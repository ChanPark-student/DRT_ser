import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Menu, Bell, Search, Mic, Bus as BusIcon, Home, Briefcase, MapPin, Route as RouteIcon, User } from 'lucide-react';
import { evaluateFeasibility } from '../feasibility';

// 승객 허용 오차를 5분으로 빡빡하게 줄임 (거절이 잘 나오게)
const DEFAULT_PASSENGER = { pickupTol: 5, dropoffTol: 5, directTime: 5, maxRide: 2 }
const MOCK_VEHICLE = {
  id: 'V_DRT_01',
  state: 'PASSENGER_ONLY',
  loc: { lat: 35.195, lon: 126.815, name: '현재 차량 위치' },
  maxVolume: 500, maxWeight: 100,
  loadVolume: 50, loadWeight: 20,
}

function getStopIcon(emoji, color) {
  return L.divIcon({
    className: 'custom-pin-stop',
    html: `<div style="width: 32px; height: 32px; background: white; border: 2px solid ${color}; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 16px; box-shadow: 0 2px 6px rgba(0,0,0,0.3);">${emoji}</div>`,
    iconSize: [32, 32], iconAnchor: [16, 16]
  });
}

function MapController({ pickup, dropoff, routeCoords }) {
  const map = useMap();
  useEffect(() => {
    const points = [[MY_LOCATION.lat, MY_LOCATION.lon]];
    
    if (routeCoords && routeCoords.length > 0) {
      routeCoords.forEach(pt => points.push(pt));
    } else {
      if (pickup) points.push([pickup.lat, pickup.lon]);
      if (dropoff) points.push([dropoff.lat, dropoff.lon]);
    }
    
    if (points.length > 1) {
      map.fitBounds(points, { padding: [40, 40], maxZoom: 15 });
    } else {
      map.setView([MOCK_VEHICLE.loc.lat, MOCK_VEHICLE.loc.lon], 13);
    }
  }, [pickup, dropoff, routeCoords, map]);
  return null;
}

const MY_LOCATION = { lat: 35.138, lon: 126.791, name: '내 위치' };

function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

function getMyLocationIcon() {
  return L.divIcon({
    className: 'custom-pin-me',
    html: `<div style="width: 24px; height: 24px; background: #e54d2e; border: 2px solid white; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 6px rgba(0,0,0,0.3); position: relative;">
      <div style="width: 24px; height: 24px; background: #e54d2e; border-radius: 50%; position: absolute; animation: pulse-ring 1.5s infinite; opacity: 0.4;"></div>
      <span style="color: white; font-size: 11px; font-weight: 800;">내</span>
    </div>`,
    iconSize: [24, 24], iconAnchor: [12, 12]
  });
}

function getVehicleIcon() {
  return L.divIcon({
    className: 'custom-pin',
    html: `<div style="width: 24px; height: 24px; background: #0052FF; border: 2px solid white; border-radius: 50%; box-shadow: 0 2px 6px rgba(0,0,0,0.3);"></div>`,
    iconSize: [24, 24], iconAnchor: [12, 12]
  });
}

function SearchableInput({ placeholder, icon: Icon, iconColor, stops, value, onChange }) {
  const [query, setQuery] = useState(value?.name || "");
  const [show, setShow] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => { setQuery(value?.name || ""); }, [value]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setShow(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filtered = stops.filter(s => s.name.includes(query)).slice(0, 50);

  return (
    <div className="relative flex items-center gap-2" ref={wrapperRef}>
      <Icon size={20} className={iconColor} />
      <input
        type="text"
        placeholder={placeholder}
        value={query}
        onFocus={() => setShow(true)}
        onChange={e => { setQuery(e.target.value); setShow(true); }}
        className="flex-1 bg-transparent border-none focus:ring-0 text-body-md font-body-md text-on-surface outline-none w-full py-1"
      />
      {show && query.trim() !== "" && (
        <ul className="absolute top-full left-8 right-0 mt-1 max-h-48 overflow-y-auto bg-surface border border-surface-variant rounded-lg shadow-lg z-50">
          {filtered.length > 0 ? filtered.map(s => (
            <li key={s.id} className="px-3 py-2 hover:bg-surface-container-low cursor-pointer text-body-sm" onClick={() => { onChange(s); setQuery(s.name); setShow(false); }}>
              {s.name}
            </li>
          )) : (
             <li className="px-3 py-2 text-on-surface-variant text-body-sm">검색 결과 없음</li>
          )}
        </ul>
      )}
    </div>
  );
}

export default function PassengerHome() {
  const navigate = useNavigate();
  const [stops, setStops] = useState([]);
  const [pickup, setPickup] = useState(null);
  const [dropoff, setDropoff] = useState(null);
  const [routeCoords, setRouteCoords] = useState([]);
  const [modalResult, setModalResult] = useState(null);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch('http://localhost:8000/api/stops?limit=100000');
        const data = await res.json();
        setStops(data);
        window.debug_stops_count = data.length;
        
        // 초기 로딩 시 가장 가까운 정류장 설정
        if (data.length > 0) {
          let closest = data[0];
          let minDist = getDistance(MY_LOCATION.lat, MY_LOCATION.lon, closest.lat, closest.lon);
          for (let i = 1; i < data.length; i++) {
            const dist = getDistance(MY_LOCATION.lat, MY_LOCATION.lon, data[i].lat, data[i].lon);
            if (dist < minDist) {
              minDist = dist;
              closest = data[i];
            }
          }
          setPickup(closest);
        }
      } catch (e) { console.error(e) }
    }
    loadData();
  }, []);

  useEffect(() => {
    if (!pickup || !dropoff) {
      setRouteCoords([]);
      return;
    }
    async function fetchRoute() {
      try {
        const url = `https://router.project-osrm.org/route/v1/driving/${pickup.lon},${pickup.lat};${dropoff.lon},${dropoff.lat}?overview=full&geometries=geojson`;
        const res = await fetch(url);
        const data = await res.json();
        if (data.routes && data.routes.length > 0) {
          const coords = data.routes[0].geometry.coordinates.map(c => [c[1], c[0]]);
          setRouteCoords(coords);
          window.debug_route_length = coords.length;
        } else {
          setRouteCoords([[pickup.lat, pickup.lon], [dropoff.lat, dropoff.lon]]);
        }
      } catch (e) {
        console.error(e);
        setRouteCoords([[pickup.lat, pickup.lon], [dropoff.lat, dropoff.lon]]);
      }
    }
    fetchRoute();
  }, [pickup, dropoff]);

  const resetToClosest = () => {
    if (stops.length > 0) {
      let closest = stops[0];
      let minDist = getDistance(MY_LOCATION.lat, MY_LOCATION.lon, closest.lat, closest.lon);
      for (let i = 1; i < stops.length; i++) {
        const dist = getDistance(MY_LOCATION.lat, MY_LOCATION.lon, stops[i].lat, stops[i].lon);
        if (dist < minDist) {
          minDist = dist;
          closest = stops[i];
        }
      }
      setPickup(closest);
    }
  };

  const handleCall = () => {
    if (!pickup || !dropoff) return;
    const pax = { ...DEFAULT_PASSENGER, pickupStop: pickup, dropoffStop: dropoff };
    const logi = { pickupLoc: pickup, dropoffLoc: dropoff, volume: 0, weight: 0, type: '일반', deadline: null };
    const res = evaluateFeasibility(MOCK_VEHICLE, pax, logi);
    setModalResult(res);
  };

  return (
    <div className="bg-background animate-fade-in text-on-background h-full w-full overflow-hidden relative font-body-md antialiased">
      {/* Map Background */}
      <div className="absolute inset-0 z-0">
        <MapContainer center={[35.19, 126.81]} zoom={13} style={{ width: '100%', height: '100%' }} zoomControl={false} attributionControl={false}>
          <TileLayer url="https://xdworld.vworld.kr/2d/Base/service/{z}/{x}/{y}.png" />
          <Marker position={[MY_LOCATION.lat, MY_LOCATION.lon]} icon={getMyLocationIcon()} />
          {pickup && (
            <Marker position={[pickup.lat, pickup.lon]} icon={getStopIcon('🧍', '#3fb950')} />
          )}
          {dropoff && (
            <Marker position={[dropoff.lat, dropoff.lon]} icon={getStopIcon('🏁', '#d32f2f')} />
          )}
          {pickup && dropoff && routeCoords.length > 0 && (
            <Polyline 
              positions={routeCoords} 
              pathOptions={{ color: '#0052FF', weight: 6, opacity: 0.8 }} 
            />
          )}
          <MapController pickup={pickup} dropoff={dropoff} routeCoords={routeCoords} />
        </MapContainer>
      </div>

      <header className="absolute top-0 w-full z-50 flex justify-between items-center px-container-margin h-16 bg-surface shadow-sm text-primary">
        <button onClick={() => navigate('/')} className="hover:bg-surface-container-low transition-colors p-2 -ml-2 rounded-full active:scale-95 duration-100">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 className="text-headline-sm font-headline-md font-bold text-primary">DRT Connect</h1>
        <button className="hover:bg-surface-container-low transition-colors p-2 -mr-2 rounded-full active:scale-95 duration-100">
          <Bell size={24} />
        </button>
      </header>

      <main className="relative z-40 h-full w-full pointer-events-none flex flex-col justify-between pt-20 pb-[104px]">
        <div className="px-container-margin pointer-events-auto mt-2">
          <div className="bg-surface-container-lowest rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.08)] p-3 flex flex-col border border-surface-container-highest transition-all focus-within:border-primary focus-within:ring-2 focus-within:ring-primary-fixed">
             <SearchableInput placeholder="출발 정류장을 검색하세요" icon={Search} iconColor="text-primary" stops={stops} value={pickup} onChange={setPickup} />
             <div className="w-full h-[1px] bg-outline-variant/30 my-2"></div>
             <SearchableInput placeholder="도착 정류장을 검색하세요" icon={MapPin} iconColor="text-error" stops={stops} value={dropoff} onChange={setDropoff} />
          </div>
          {stops.length > 0 && (
            <div className="mt-2 text-right">
              <button 
                onClick={resetToClosest}
                className="text-[11px] font-bold text-primary hover:underline bg-transparent border-none p-0 cursor-pointer pointer-events-auto"
                style={{ outline: 'none' }}>
                📍 내 위치에서 가장 가까운 정류장 설정
              </button>
            </div>
          )}
        </div>

        <div className="px-container-margin flex flex-col gap-stack-md pointer-events-auto items-end pb-4">
          <button onClick={handleCall} className="bg-primary-container text-on-primary-container px-6 py-4 rounded-xl shadow-[0_8px_24px_rgba(0,82,255,0.25)] flex items-center gap-2 hover:opacity-90 transition-all active:scale-95 animate-float border border-primary-fixed">
            <BusIcon size={24} className="fill-current" />
            <span className="text-label-md font-label-md font-bold tracking-wide">DRT 호출하기</span>
          </button>
        </div>
      </main>

      <nav className="absolute bottom-0 left-0 w-full z-50 flex animate-slide-up justify-around items-center px-4 pb-8 pt-3 bg-surface shadow-[0_-4px_20px_0_rgba(0,0,0,0.04)] rounded-t-xl">
        <button className="flex flex-col items-center justify-center bg-primary-container text-on-primary rounded-full px-5 py-1.5 scale-90 duration-200">
          <MapPin size={24} className="fill-current" />
          <span className="text-label-md font-label-md mt-1">집</span>
        </button>
        <button className="flex flex-col items-center justify-center text-secondary px-5 py-1.5">
          <RouteIcon size={24} />
          <span className="text-label-md font-label-md mt-1">이용 내역</span>
        </button>
      </nav>

      {modalResult && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(8px)' }} className="pointer-events-auto animate-fade-in">
          <div style={{ background: 'var(--surface)', width: '85%', borderRadius: '24px', padding: '32px 24px', textAlign: 'center', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }} className="animate-pop-in">
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: modalResult.result === 'D' ? 'var(--error-container)' : '#e5eeff', color: modalResult.result === 'D' ? 'var(--error)' : 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, margin: '0 auto 20px auto' }}>
              {modalResult.result === 'D' ? '!' : '✓'}
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--on-surface)', marginBottom: 12 }}>
              {modalResult.result === 'D' ? '배차 불가' : '배차 확정'}
            </h2>
            <p style={{ fontSize: 15, color: 'var(--on-surface-variant)', lineHeight: 1.5, marginBottom: 24, fontWeight: 500 }}>
              {modalResult.result === 'D' 
                ? '거리가 너무 멀거나 차량이 혼잡하여 도착 보장 시간(5분) 내에 이동할 수 있는 차량이 없습니다.' 
                : '차량이 배정되었습니다. 앱에서 실시간 위치를 확인하세요.'}
            </p>
            <div style={{ background: 'var(--surface-dim)', borderRadius: '12px', padding: '16px', marginBottom: 24, textAlign: 'left' }}>
              <div style={{ fontSize: 12, color: 'var(--on-surface-variant)', fontWeight: 600, marginBottom: 4 }}>판정 사유</div>
              <div className="font-data-mono" style={{ fontSize: 13, color: 'var(--on-surface)', fontWeight: 700 }}>
                {modalResult.reason}
              </div>
            </div>
            <button className="w-full bg-primary text-on-primary py-3 rounded-xl font-bold" onClick={() => setModalResult(null)}>확인</button>
          </div>
        </div>
      )}
    </div>
  );
}
