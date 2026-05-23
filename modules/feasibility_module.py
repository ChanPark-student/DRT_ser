# -*- coding: utf-8 -*-
"""
승객 우선 동승 물류 가능성 판정 모듈
Passenger-Priority Co-Loading Feasibility Module for DRT

근거 논문:
- Cordeau (2006) DARP - time window, capacity, ride-time constraints
- Alonso-Mora et al. (2017) - maximum waiting time, maximum delay
- Molenbruch et al. (2017) - DARP service quality constraints
- Parragh et al. (2008) - pickup-before-delivery, PDPTW
"""

from __future__ import annotations
from dataclasses import dataclass, field
from enum import Enum
from typing import Optional
import math


# ─────────────────────────────────────────────
# 열거형 정의
# ─────────────────────────────────────────────

class VehicleState(Enum):
    EMPTY               = "공차"                    # 승객 없음, 물류 없음
    PASSENGER_ONLY      = "승객 탑승 중"
    GOING_TO_PICKUP     = "승객 픽업 이동 중"
    LOGISTICS_ONLY      = "물류만 탑재 중"
    PASSENGER_LOGISTICS = "승객+물류 동시 탑재 중"


class FeasibilityResult(Enum):
    BOTH_POSSIBLE    = "A. 상차+하차 가능"
    PICKUP_ONLY      = "B. 상차만 가능"
    DROPOFF_ONLY     = "C. 하차만 가능"
    IMPOSSIBLE       = "D. 불가능"


# ─────────────────────────────────────────────
# 데이터 클래스 정의
# ─────────────────────────────────────────────

@dataclass
class Location:
    """위경도 위치"""
    lat: float
    lon: float
    name: str = ""


@dataclass
class PassengerRequest:
    """승객 요청"""
    passenger_id: str
    pickup_stop: Location        # 승객 픽업 정류장
    dropoff_stop: Location       # 승객 하차 정류장
    request_time: float          # 요청 시각 (초 단위 또는 분 단위)
    pickup_tolerance: float      # 픽업 지연 허용오차 (분) ε_i^pick
    dropoff_tolerance: float     # 도착 지연 허용오차 (분) ε_i^drop
    max_ride_time: float         # 최대 탑승시간 (분) Δ_i
    direct_travel_time: float    # 직접 이동 기준시간 (분) T_i^direct


@dataclass
class LogisticsRequest:
    """물류 요청"""
    logistics_id: str
    pickup_loc: Location         # 물류 상차 위치
    dropoff_loc: Location        # 물류 하차 위치(정류장 또는 거점)
    volume: float                # 부피 (단위 통일 필요, 예: 리터 or m³)
    weight: float                # 무게 (kg)
    deadline: Optional[float]    # 하차 제한시간 (분, None이면 제한 없음) U_k
    logistics_type: str = "일반"  # 예: '냉장', '위험물', '일반'


@dataclass
class Vehicle:
    """DRT 차량"""
    vehicle_id: str
    current_loc: Location
    state: VehicleState
    max_capacity_volume: float   # 최대 적재 부피 Q_v
    max_capacity_weight: float   # 최대 적재 무게 Q_v (무게 기준)
    current_load_volume: float = 0.0
    current_load_weight: float = 0.0
    current_passenger: Optional[PassengerRequest] = None
    current_logistics: Optional[LogisticsRequest] = None


@dataclass
class DecisionOutput:
    """판정 결과"""
    vehicle_id: str
    logistics_id: str
    result: FeasibilityResult
    candidate_route: str         # 선택된 후보 경로 설명
    passenger_pickup_delay: float    # 승객 픽업 지연 (분) ΔP_i
    passenger_dropoff_delay: float   # 승객 도착 지연 (분) ΔD_i
    passenger_ride_time: float       # 예상 탑승시간 (분) R_i
    recommended_order: str           # 추천 처리 순서
    reason: str                      # 판정 이유


# ─────────────────────────────────────────────
# 이동시간 계산 (Haversine 거리 기반 추정)
# ─────────────────────────────────────────────

def haversine_km(a: Location, b: Location) -> float:
    """두 위경도 간 직선거리 (km)"""
    R = 6371.0
    lat1, lon1 = math.radians(a.lat), math.radians(a.lon)
    lat2, lon2 = math.radians(b.lat), math.radians(b.lon)
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    h = math.sin(dlat / 2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon / 2)**2
    return 2 * R * math.asin(math.sqrt(h))


def travel_time_min(a: Location, b: Location, speed_kmh: float = 25.0) -> float:
    """
    두 지점 간 예상 이동시간 (분).
    실제 구현에서는 OSRM, 카카오모빌리티 API 또는
    광주광역시 주요 구간 차량 속도 데이터를 사용해야 함.
    현재는 Haversine + 평균속도로 추정.
    """
    dist_km = haversine_km(a, b)
    return (dist_km / speed_kmh) * 60.0


# ─────────────────────────────────────────────
# 핵심 판정 함수
# ─────────────────────────────────────────────

def evaluate_feasibility(
    vehicle: Vehicle,
    passenger: PassengerRequest,
    logistics: LogisticsRequest,
    speed_kmh: float = 25.0,
) -> DecisionOutput:
    """
    승객 우선 동승 물류 가능성 판정.

    판정 기준 (Feasible_{v,k}(π)):
    1. ΔP_i(π) ≤ ε_i^pick   (픽업 지연 허용오차)
    2. ΔD_i(π) ≤ ε_i^drop   (도착 지연 허용오차)
    3. R_i(π)  ≤ T_i^direct + Δ_i  (최대 탑승시간)
    4. load_v(t,π) + q_k ≤ Q_v     (차량 적재량)
    5. L_k(π) < U_k(π)              (상차가 하차보다 먼저)

    Parameters
    ----------
    vehicle   : 차량 현재 상태
    passenger : 현재 탑승 중인 (또는 픽업 예정인) 승객 요청
    logistics : 새로 들어온 물류 요청
    speed_kmh : 평균 이동속도 (실제 도로 데이터로 대체 가능)

    Returns
    -------
    DecisionOutput : 판정 결과
    """

    veh = vehicle
    pax = passenger
    logi = logistics

    def tt(a, b):
        return travel_time_min(a, b, speed_kmh)

    # ── 적재량 제약 검사 ──────────────────────────────
    if (veh.current_load_volume + logi.volume > veh.max_capacity_volume or
            veh.current_load_weight + logi.weight > veh.max_capacity_weight):
        return DecisionOutput(
            vehicle_id=veh.vehicle_id,
            logistics_id=logi.logistics_id,
            result=FeasibilityResult.IMPOSSIBLE,
            candidate_route="없음",
            passenger_pickup_delay=0.0,
            passenger_dropoff_delay=0.0,
            passenger_ride_time=0.0,
            recommended_order="배정 제외",
            reason=f"차량 적재량 초과 (부피: {veh.current_load_volume + logi.volume:.1f}/{veh.max_capacity_volume}, "
                   f"무게: {veh.current_load_weight + logi.weight:.1f}/{veh.max_capacity_weight})",
        )

    # ── 물류 유형 검사 ────────────────────────────────
    if logi.logistics_type in ("위험물", "냉장"):
        return DecisionOutput(
            vehicle_id=veh.vehicle_id,
            logistics_id=logi.logistics_id,
            result=FeasibilityResult.IMPOSSIBLE,
            candidate_route="없음",
            passenger_pickup_delay=0.0,
            passenger_dropoff_delay=0.0,
            passenger_ride_time=0.0,
            recommended_order="배정 제외",
            reason=f"승객 동승 불가 물류 유형: {logi.logistics_type}",
        )

    # ── 기준 경로 시간 계산 ───────────────────────────
    # 기본 경로: 차량 현재 위치 → (픽업 정류장 →) 승객 하차 정류장
    if veh.state == VehicleState.GOING_TO_PICKUP:
        # 아직 픽업 전: 현재위치 → 픽업 → 하차
        t_base_pickup  = tt(veh.current_loc, pax.pickup_stop)
        t_base_dropoff = t_base_pickup + tt(pax.pickup_stop, pax.dropoff_stop)
        t_base_ridetime = tt(pax.pickup_stop, pax.dropoff_stop)
    else:
        # 이미 승객 탑승 중: 현재위치 → 하차
        t_base_pickup  = 0.0
        t_base_dropoff = tt(veh.current_loc, pax.dropoff_stop)
        t_base_ridetime = t_base_dropoff

    # ── 후보 경로 4가지 계산 ─────────────────────────
    results = {}

    # 후보 A: 차량 → 물류상차 → 물류하차 → 승객하차
    if veh.state == VehicleState.GOING_TO_PICKUP:
        t_a_pickup  = (tt(veh.current_loc, logi.pickup_loc) +
                       tt(logi.pickup_loc, logi.dropoff_loc) +
                       tt(logi.dropoff_loc, pax.pickup_stop))
        t_a_dropoff = t_a_pickup + tt(pax.pickup_stop, pax.dropoff_stop)
        t_a_ride    = tt(pax.pickup_stop, pax.dropoff_stop)
    else:
        t_a_pickup  = 0.0
        t_a_dropoff = (tt(veh.current_loc, logi.pickup_loc) +
                       tt(logi.pickup_loc, logi.dropoff_loc) +
                       tt(logi.dropoff_loc, pax.dropoff_stop))
        t_a_ride    = t_a_dropoff
    t_logistics_dropoff_a = (tt(veh.current_loc, logi.pickup_loc) +
                              tt(logi.pickup_loc, logi.dropoff_loc))
    results["A"] = {
        "desc": "차량 → 물류상차 → 물류하차 → 승객하차",
        "pickup_delay":  t_a_pickup  - t_base_pickup,
        "dropoff_delay": t_a_dropoff - t_base_dropoff,
        "ride_time":     t_a_ride,
        "logi_dropoff_time": t_logistics_dropoff_a,
        "order": "물류 상차 → 물류 하차 → 승객 하차",
        "has_full_logistics": True,
    }

    # 후보 B: 차량 → 물류상차 → 승객하차 → 물류하차
    if veh.state == VehicleState.GOING_TO_PICKUP:
        t_b_pickup  = (tt(veh.current_loc, logi.pickup_loc) +
                       tt(logi.pickup_loc, pax.pickup_stop))
        t_b_dropoff = t_b_pickup + tt(pax.pickup_stop, pax.dropoff_stop)
        t_b_ride    = tt(pax.pickup_stop, pax.dropoff_stop)
    else:
        t_b_pickup  = 0.0
        t_b_dropoff = (tt(veh.current_loc, logi.pickup_loc) +
                       tt(logi.pickup_loc, pax.dropoff_stop))
        t_b_ride    = t_b_dropoff
    results["B"] = {
        "desc": "차량 → 물류상차 → 승객하차 → 물류하차",
        "pickup_delay":  t_b_pickup  - t_base_pickup,
        "dropoff_delay": t_b_dropoff - t_base_dropoff,
        "ride_time":     t_b_ride,
        "logi_dropoff_time": (t_b_dropoff + tt(pax.dropoff_stop, logi.dropoff_loc)),
        "order": "물류 상차 → 승객 하차 → 물류 하차",
        "has_full_logistics": True,
    }

    # 후보 C: 차량 → 승객하차 → 물류상차 → 물류하차  (승객 하차 후 물류 처리)
    t_c_pickup  = t_base_pickup
    t_c_dropoff = t_base_dropoff
    t_c_ride    = t_base_ridetime
    results["C"] = {
        "desc": "차량 → 승객하차 → 물류상차 → 물류하차",
        "pickup_delay":  0.0,
        "dropoff_delay": 0.0,
        "ride_time":     t_c_ride,
        "logi_dropoff_time": (t_c_dropoff +
                               tt(pax.dropoff_stop, logi.pickup_loc) +
                               tt(logi.pickup_loc, logi.dropoff_loc)),
        "order": "승객 하차 → 물류 상차 → 물류 하차",
        "has_full_logistics": True,
    }

    # ── 후보별 제약 검사 ──────────────────────────────
    def check_constraints(cand: dict) -> tuple[bool, str]:
        """(통과 여부, 실패 이유)"""
        dp = cand["pickup_delay"]
        dd = cand["dropoff_delay"]
        rt = cand["ride_time"]
        ldt = cand["logi_dropoff_time"]

        if dp > pax.pickup_tolerance:
            return False, f"픽업 지연 {dp:.1f}분 > 허용 {pax.pickup_tolerance}분"
        if dd > pax.dropoff_tolerance:
            return False, f"도착 지연 {dd:.1f}분 > 허용 {pax.dropoff_tolerance}분"
        if rt > pax.direct_travel_time + pax.max_ride_time:
            return False, f"탑승시간 {rt:.1f}분 > 기준 {pax.direct_travel_time + pax.max_ride_time:.1f}분"
        if logi.deadline is not None and ldt > logi.deadline:
            return False, f"물류 하차 {ldt:.1f}분 > 제한시간 {logi.deadline}분"
        return True, "OK"

    passed = {}
    for key, cand in results.items():
        ok, reason = check_constraints(cand)
        passed[key] = (ok, reason)

    # ── 최종 판정 ─────────────────────────────────────
    # 후보 A 또는 B: 상차+하차 모두 가능
    for key in ("A", "B"):
        if passed[key][0]:
            c = results[key]
            return DecisionOutput(
                vehicle_id=veh.vehicle_id,
                logistics_id=logi.logistics_id,
                result=FeasibilityResult.BOTH_POSSIBLE,
                candidate_route=f"후보 {key}: {c['desc']}",
                passenger_pickup_delay=c["pickup_delay"],
                passenger_dropoff_delay=c["dropoff_delay"],
                passenger_ride_time=c["ride_time"],
                recommended_order=c["order"],
                reason="승객 허용오차 및 물류 제약 모두 만족",
            )

    # 후보 C: 승객 하차 후 물류 처리 (지연 없음, 항상 가능)
    if passed["C"][0]:
        c = results["C"]
        return DecisionOutput(
            vehicle_id=veh.vehicle_id,
            logistics_id=logi.logistics_id,
            result=FeasibilityResult.DROPOFF_ONLY,
            candidate_route=f"후보 C: {c['desc']}",
            passenger_pickup_delay=0.0,
            passenger_dropoff_delay=0.0,
            passenger_ride_time=c["ride_time"],
            recommended_order=c["order"],
            reason="승객 하차 이후 물류 처리 (승객 지연 없음)",
        )

    # 상차만 가능 여부 (후보 B에서 물류 하차 부분 제거, 상차만)
    # 픽업 지연과 도착 지연만 체크 (물류 하차는 추후)
    b = results["B"]
    if (b["pickup_delay"] <= pax.pickup_tolerance and
            b["dropoff_delay"] <= pax.dropoff_tolerance and
            b["ride_time"] <= pax.direct_travel_time + pax.max_ride_time):
        return DecisionOutput(
            vehicle_id=veh.vehicle_id,
            logistics_id=logi.logistics_id,
            result=FeasibilityResult.PICKUP_ONLY,
            candidate_route="물류 상차만 가능 (하차는 승객 하차 이후)",
            passenger_pickup_delay=b["pickup_delay"],
            passenger_dropoff_delay=b["dropoff_delay"],
            passenger_ride_time=b["ride_time"],
            recommended_order="물류 상차 → 승객 하차 → 이후 물류 하차",
            reason=f"물류 하차 시간 초과 ({passed['B'][1]}), 상차만 허용",
        )

    # 모두 불가
    reasons = "; ".join(f"후보{k}: {v[1]}" for k, v in passed.items() if not v[0])
    return DecisionOutput(
        vehicle_id=veh.vehicle_id,
        logistics_id=logi.logistics_id,
        result=FeasibilityResult.IMPOSSIBLE,
        candidate_route="없음",
        passenger_pickup_delay=0.0,
        passenger_dropoff_delay=0.0,
        passenger_ride_time=0.0,
        recommended_order="배정 제외",
        reason=reasons,
    )


# ─────────────────────────────────────────────
# 출력 포맷
# ─────────────────────────────────────────────

def print_result(out: DecisionOutput) -> None:
    print("\n" + "=" * 55)
    print(f"  차량 ID     : {out.vehicle_id}")
    print(f"  물류 ID     : {out.logistics_id}")
    print(f"  판정 결과   : {out.result.value}")
    print(f"  선택 경로   : {out.candidate_route}")
    print(f"  픽업 지연   : {out.passenger_pickup_delay:+.1f}분")
    print(f"  도착 지연   : {out.passenger_dropoff_delay:+.1f}분")
    print(f"  탑승 시간   : {out.passenger_ride_time:.1f}분")
    print(f"  추천 순서   : {out.recommended_order}")
    print(f"  판정 이유   : {out.reason}")
    print("=" * 55)


# ─────────────────────────────────────────────
# 테스트 실행
# ─────────────────────────────────────────────

if __name__ == "__main__":
    print("=== 승객 우선 동승 물류 가능성 판정 모듈 테스트 ===\n")

    # 공통 위치 (광산구 기준 예시)
    haenam_sandan    = Location(35.19, 126.80, "하남산단")
    suwan_stop       = Location(35.17, 126.79, "수완지구정류장")
    pyeongdong_sandan= Location(35.13, 126.79, "평동산단")
    gwangsan_stop    = Location(35.14, 126.79, "광산구청정류장")
    logi_pickup_loc  = Location(35.19, 126.81, "물류상차지점(하남)")
    logi_dropoff_loc = Location(35.16, 126.78, "물류하차정류장")

    # ── 시나리오 1: 승객 탑승 중, 물류 요청 ──────────────
    print("[ 시나리오 1 ] 승객 탑승 중 → 물류 요청")
    vehicle1 = Vehicle(
        vehicle_id="V03",
        current_loc=haenam_sandan,
        state=VehicleState.PASSENGER_ONLY,
        max_capacity_volume=500.0,
        max_capacity_weight=100.0,
        current_load_volume=0.0,
        current_load_weight=0.0,
    )
    passenger1 = PassengerRequest(
        passenger_id="P001",
        pickup_stop=haenam_sandan,
        dropoff_stop=suwan_stop,
        request_time=0.0,
        pickup_tolerance=5.0,
        dropoff_tolerance=5.0,
        max_ride_time=10.0,
        direct_travel_time=8.0,
    )
    logistics1 = LogisticsRequest(
        logistics_id="L001",
        pickup_loc=logi_pickup_loc,
        dropoff_loc=logi_dropoff_loc,
        volume=30.0,
        weight=10.0,
        deadline=None,
        logistics_type="일반",
    )
    out1 = evaluate_feasibility(vehicle1, passenger1, logistics1)
    print_result(out1)

    # ── 시나리오 2: 물류만 실은 상태 → 승객 요청 ────────
    print("\n[ 시나리오 2 ] 물류만 탑재 중 → 승객 요청 발생")
    vehicle2 = Vehicle(
        vehicle_id="V05",
        current_loc=haenam_sandan,
        state=VehicleState.LOGISTICS_ONLY,
        max_capacity_volume=500.0,
        max_capacity_weight=100.0,
        current_load_volume=50.0,
        current_load_weight=15.0,
    )
    passenger2 = PassengerRequest(
        passenger_id="P002",
        pickup_stop=pyeongdong_sandan,
        dropoff_stop=gwangsan_stop,
        request_time=0.0,
        pickup_tolerance=8.0,
        dropoff_tolerance=8.0,
        max_ride_time=15.0,
        direct_travel_time=10.0,
    )
    logistics2 = LogisticsRequest(
        logistics_id="L002",
        pickup_loc=haenam_sandan,
        dropoff_loc=logi_dropoff_loc,
        volume=50.0,
        weight=15.0,
        deadline=30.0,
        logistics_type="일반",
    )
    out2 = evaluate_feasibility(vehicle2, passenger2, logistics2)
    print_result(out2)

    # ── 시나리오 3: 적재량 초과 ──────────────────────────
    print("\n[ 시나리오 3 ] 적재량 초과 → 불가")
    vehicle3 = Vehicle(
        vehicle_id="V07",
        current_loc=haenam_sandan,
        state=VehicleState.PASSENGER_ONLY,
        max_capacity_volume=100.0,
        max_capacity_weight=30.0,
        current_load_volume=80.0,
        current_load_weight=25.0,
    )
    logistics3 = LogisticsRequest(
        logistics_id="L003",
        pickup_loc=logi_pickup_loc,
        dropoff_loc=logi_dropoff_loc,
        volume=50.0,   # 80+50 > 100 → 초과
        weight=10.0,
        deadline=None,
        logistics_type="일반",
    )
    out3 = evaluate_feasibility(vehicle3, passenger1, logistics3)
    print_result(out3)
