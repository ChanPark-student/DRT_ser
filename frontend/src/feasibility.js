/**
 * DRT 판정 로직 (Python 모듈의 JS 포트)
 * Feasible_{v,k}(π) 기반
 */

const R_EARTH = 6371;

function haversineKm(a, b) {
  const toRad = d => d * Math.PI / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const h = Math.sin(dLat/2)**2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLon/2)**2;
  return 2 * R_EARTH * Math.asin(Math.sqrt(h));
}

function tt(a, b, speed = 25) {
  return (haversineKm(a, b) / speed) * 60;
}

export function evaluateFeasibility(vehicle, passenger, logistics) {
  const v = vehicle, pax = passenger, logi = logistics;

  // 적재량 검사
  if (v.loadVolume + logi.volume > v.maxVolume || v.loadWeight + logi.weight > v.maxWeight) {
    return {
      result: 'D', resultLabel: 'D. 불가능',
      pickupDelay: 0, dropoffDelay: 0, rideTime: 0,
      candidateRoute: '없음',
      recommendedOrder: '배정 제외',
      reason: `적재량 초과 (부피: ${v.loadVolume + logi.volume}/${v.maxVolume}, 무게: ${v.loadWeight + logi.weight}/${v.maxWeight})`,
      candidates: [],
    };
  }

  // 물류 유형
  if (logi.type === '위험물' || logi.type === '냉장') {
    return {
      result: 'D', resultLabel: 'D. 불가능',
      pickupDelay: 0, dropoffDelay: 0, rideTime: 0,
      candidateRoute: '없음',
      recommendedOrder: '배정 제외',
      reason: `승객 동승 불가 물류 유형: ${logi.type}`,
      candidates: [],
    };
  }

  const isGoingToPickup = v.state === 'GOING_TO_PICKUP';

  // 기준 경로
  let basePickupTime, baseDropoffTime, baseRideTime;
  if (isGoingToPickup) {
    basePickupTime  = tt(v.loc, pax.pickupStop);
    baseDropoffTime = basePickupTime + tt(pax.pickupStop, pax.dropoffStop);
    baseRideTime    = tt(pax.pickupStop, pax.dropoffStop);
  } else {
    basePickupTime  = 0;
    baseDropoffTime = tt(v.loc, pax.dropoffStop);
    baseRideTime    = baseDropoffTime;
  }

  // 후보 A: 차량 → 물류상차 → 물류하차 → 승객하차
  let tA_pickup, tA_dropoff, tA_ride, tA_logiDrop;
  if (isGoingToPickup) {
    tA_pickup  = tt(v.loc, logi.pickupLoc) + tt(logi.pickupLoc, logi.dropoffLoc) + tt(logi.dropoffLoc, pax.pickupStop);
    tA_dropoff = tA_pickup + tt(pax.pickupStop, pax.dropoffStop);
    tA_ride    = tt(pax.pickupStop, pax.dropoffStop);
  } else {
    tA_pickup  = 0;
    tA_dropoff = tt(v.loc, logi.pickupLoc) + tt(logi.pickupLoc, logi.dropoffLoc) + tt(logi.dropoffLoc, pax.dropoffStop);
    tA_ride    = tA_dropoff;
  }
  tA_logiDrop = tt(v.loc, logi.pickupLoc) + tt(logi.pickupLoc, logi.dropoffLoc);
  const candA = {
    key: 'A',
    desc: '차량 → 물류상차 → 물류하차 → 승객하차',
    pickupDelay:  tA_pickup  - basePickupTime,
    dropoffDelay: tA_dropoff - baseDropoffTime,
    rideTime:     tA_ride,
    logiDropTime: tA_logiDrop,
    order: '물류 상차 → 물류 하차 → 승객 하차',
  };

  // 후보 B: 차량 → 물류상차 → 승객하차 → 물류하차
  let tB_pickup, tB_dropoff, tB_ride;
  if (isGoingToPickup) {
    tB_pickup  = tt(v.loc, logi.pickupLoc) + tt(logi.pickupLoc, pax.pickupStop);
    tB_dropoff = tB_pickup + tt(pax.pickupStop, pax.dropoffStop);
    tB_ride    = tt(pax.pickupStop, pax.dropoffStop);
  } else {
    tB_pickup  = 0;
    tB_dropoff = tt(v.loc, logi.pickupLoc) + tt(logi.pickupLoc, pax.dropoffStop);
    tB_ride    = tB_dropoff;
  }
  const candB = {
    key: 'B',
    desc: '차량 → 물류상차 → 승객하차 → 물류하차',
    pickupDelay:  tB_pickup  - basePickupTime,
    dropoffDelay: tB_dropoff - baseDropoffTime,
    rideTime:     tB_ride,
    logiDropTime: tB_dropoff + tt(pax.dropoffStop, logi.dropoffLoc),
    order: '물류 상차 → 승객 하차 → 물류 하차',
  };

  // 후보 C: 차량 → 승객하차 → 물류상차 → 물류하차
  const candC = {
    key: 'C',
    desc: '차량 → 승객하차 → 물류상차 → 물류하차',
    pickupDelay:  0,
    dropoffDelay: 0,
    rideTime:     baseRideTime,
    logiDropTime: baseDropoffTime + tt(pax.dropoffStop, logi.pickupLoc) + tt(logi.pickupLoc, logi.dropoffLoc),
    order: '승객 하차 → 물류 상차 → 물류 하차',
  };

  const candidates = [candA, candB, candC];

  function check(c) {
    if (c.pickupDelay  > pax.pickupTol)   return { ok: false, reason: `픽업 지연 ${c.pickupDelay.toFixed(1)}분 > 허용 ${pax.pickupTol}분` };
    if (c.dropoffDelay > pax.dropoffTol)  return { ok: false, reason: `도착 지연 ${c.dropoffDelay.toFixed(1)}분 > 허용 ${pax.dropoffTol}분` };
    if (c.rideTime > pax.directTime + pax.maxRide) return { ok: false, reason: `탑승시간 ${c.rideTime.toFixed(1)}분 초과` };
    if (logi.deadline != null && c.logiDropTime > logi.deadline) return { ok: false, reason: `물류 하차 시간 ${c.logiDropTime.toFixed(1)}분 > 제한 ${logi.deadline}분` };
    return { ok: true, reason: 'OK' };
  }

  const checks = candidates.map(c => ({ ...c, ...check(c) }));

  // A 또는 B 통과 → 상차+하차
  for (const c of [checks[0], checks[1]]) {
    if (c.ok) return {
      result: 'A', resultLabel: 'A. 상차+하차 가능',
      pickupDelay: c.pickupDelay, dropoffDelay: c.dropoffDelay, rideTime: c.rideTime,
      candidateRoute: `후보 ${c.key}: ${c.desc}`,
      recommendedOrder: c.order,
      reason: '승객 허용오차 및 물류 제약 모두 만족',
      candidates: checks,
      selectedKey: c.key,
    };
  }

  // C 통과
  if (checks[2].ok) return {
    result: 'C', resultLabel: 'C. 하차만 가능',
    pickupDelay: 0, dropoffDelay: 0, rideTime: candC.rideTime,
    candidateRoute: `후보 C: ${candC.desc}`,
    recommendedOrder: candC.order,
    reason: '승객 하차 이후 물류 처리 (지연 없음)',
    candidates: checks,
    selectedKey: 'C',
  };

  // 상차만 가능
  const b = checks[1];
  if (b.pickupDelay <= pax.pickupTol && b.dropoffDelay <= pax.dropoffTol && b.rideTime <= pax.directTime + pax.maxRide) {
    return {
      result: 'B', resultLabel: 'B. 상차만 가능',
      pickupDelay: b.pickupDelay, dropoffDelay: b.dropoffDelay, rideTime: b.rideTime,
      candidateRoute: '물류 상차만 허용 (하차는 승객 하차 후)',
      recommendedOrder: '물류 상차 → 승객 하차 → 이후 물류 하차',
      reason: `물류 하차 시간 초과 (${b.reason})`,
      candidates: checks,
      selectedKey: null,
    };
  }

  return {
    result: 'D', resultLabel: 'D. 불가능',
    pickupDelay: 0, dropoffDelay: 0, rideTime: 0,
    candidateRoute: '없음',
    recommendedOrder: '배정 제외',
    reason: checks.filter(c => !c.ok).map(c => `후보${c.key}: ${c.reason}`).join('; '),
    candidates: checks,
    selectedKey: null,
  };
}
