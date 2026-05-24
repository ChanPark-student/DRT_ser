import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, ArrowLeft, Zap } from 'lucide-react';
import { evaluateFeasibility } from '../feasibility';

// 화물은 엄격하게 적재량 100kg 제한을 테스트하기 위해
const DEFAULT_PASSENGER = { pickupTol: 10, dropoffTol: 10, directTime: 10, maxRide: 15 }
const MOCK_VEHICLE = {
  id: 'V_DRT_01',
  state: 'EMPTY',
  loc: { lat: 35.195, lon: 126.815, name: '근처 차량' },
  maxVolume: 500, maxWeight: 100,
  loadVolume: 0, loadWeight: 0,
}

function SearchableInput({ placeholder, stops, value, onChange }) {
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
    <div className="relative w-full" ref={wrapperRef}>
      <input
        type="text"
        placeholder={placeholder}
        value={query}
        onFocus={() => setShow(true)}
        onChange={e => { setQuery(e.target.value); setShow(true); }}
        className="w-full bg-surface-container-low border-none rounded py-1 px-2 text-body-md font-semibold text-on-surface outline-none"
      />
      {show && query.trim() !== "" && (
        <ul className="absolute top-full left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-surface border border-surface-variant rounded-lg shadow-lg z-50">
          {filtered.length > 0 ? filtered.map(s => (
            <li key={s.id} className="px-3 py-2 hover:bg-surface-container-low cursor-pointer text-body-sm font-normal" onClick={() => { onChange(s); setQuery(s.name); setShow(false); }}>
              {s.name}
            </li>
          )) : (
             <li className="px-3 py-2 text-on-surface-variant text-body-sm font-normal">검색 결과 없음</li>
          )}
        </ul>
      )}
    </div>
  );
}

export default function CargoBooking() {
  const navigate = useNavigate();
  const [nodes, setNodes] = useState([]);
  const [priorityStops, setPriorityStops] = useState([]);
  const [pickup, setPickup] = useState(null);
  const [dropoff, setDropoff] = useState(null);
  const [vol, setVol] = useState(30);
  const [weight, setWeight] = useState(10);
  const [modalResult, setModalResult] = useState(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [nodesRes, priorityRes] = await Promise.all([
          fetch('http://localhost:8000/api/logistics_nodes?limit=500'),
          fetch('http://localhost:8000/api/stops?priority=true')
        ]);
        const nodesData = await nodesRes.json();
        const priorityData = await priorityRes.json();
        setNodes(nodesData);
        setPriorityStops(priorityData);
      } catch (e) { console.error(e) }
    }
    loadData();
  }, []);

  const handleBook = () => {
    if(!pickup || !dropoff) return;
    const pax = { ...DEFAULT_PASSENGER, pickupStop: pickup, dropoffStop: dropoff };
    const logi = { pickupLoc: pickup, dropoffLoc: dropoff, volume: vol, weight: weight, type: '일반', deadline: null };
    const res = evaluateFeasibility(MOCK_VEHICLE, pax, logi);
    setModalResult(res);
  };

  const getPrice = () => {
    const base = 40000;
    const extra = (weight * 100) + (vol * 50);
    return (base + extra).toLocaleString();
  };

  return (
    <div className="bg-background animate-fade-in text-on-background font-body-md text-body-md h-full flex flex-col relative overflow-hidden antialiased">
      <header className="flex items-center px-container-margin py-4 bg-surface z-10 shrink-0 shadow-sm">
        <button onClick={() => navigate('/')} className="p-2 -ml-2 rounded-full hover:bg-surface-container-low transition-colors text-on-surface">
          <ArrowLeft size={24} />
        </button>
        <h1 className="ml-2 font-headline-sm text-headline-sm text-on-surface font-bold tracking-tight">화물 예약</h1>
      </header>

      <main className="flex-1 overflow-y-auto no-scrollbar pt-6 pb-48 px-container-margin">
        <section className="mb-stack-lg">
          <div className="bg-surface-container-lowest rounded-xl p-5 shadow-[0_4px_20px_0_rgba(0,0,0,0.04)] relative border border-outline-variant/30">
            <div className="flex items-start mb-4">
              <div className="flex flex-col items-center mr-4 mt-1">
                <span className="w-4 h-4 rounded-full border-4 border-primary"></span>
                <div className="w-0.5 h-16 bg-outline-variant my-1 rounded-full"></div>
                <span className="w-4 h-4 rounded-full bg-error border-2 border-surface"></span>
              </div>
              <div className="flex-1">
                <div className="mb-4">
                  <p className="font-label-md text-label-md text-on-surface-variant mb-1 uppercase tracking-wider text-[11px] font-bold">출발지 검색</p>
                  <SearchableInput placeholder="상차지 주소 검색" stops={nodes} value={pickup} onChange={setPickup} />
                </div>
                <div>
                  <p className="font-label-md text-label-md text-on-surface-variant mb-1 uppercase tracking-wider text-[11px] font-bold">도착지 검색</p>
                  <SearchableInput placeholder="하차지 주소 검색" stops={priorityStops} value={dropoff} onChange={setDropoff} />
                </div>
              </div>
            </div>
            
            <div className="flex gap-4 pt-4 border-t border-surface-variant mt-2">
               <div className="flex-1">
                  <label className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider text-[11px] font-bold">총 부피 (L)</label>
                  <input type="number" className="w-full mt-1 bg-surface-container-low border-none rounded px-2 py-1 font-data-mono text-primary font-bold" value={vol} onChange={e=>setVol(Number(e.target.value))} />
               </div>
               <div className="flex-1">
                  <label className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider text-[11px] font-bold">총 무게 (kg)</label>
                  <input type="number" className="w-full mt-1 bg-surface-container-low border-none rounded px-2 py-1 font-data-mono text-primary font-bold" value={weight} onChange={e=>setWeight(Number(e.target.value))} />
               </div>
            </div>
            <p className="text-[11px] text-error mt-3">* 테스트: 잔여 무게 한도 80kg (초과 시 배차 거절)</p>
          </div>
        </section>

        <section>
          <div className="bg-primary-container/30 border border-primary/20 rounded-xl p-4 flex gap-4 items-start shadow-sm">
            <div className="bg-primary text-on-primary p-2 rounded-full mt-1 shrink-0">
              <Zap size={20} className="fill-current" />
            </div>
            <div>
              <h3 className="font-headline-sm text-label-lg font-bold text-on-surface mb-1">스마트 AI 자동 배차</h3>
              <p className="text-body-sm font-body-sm text-on-surface-variant leading-relaxed">
                차량 종류를 직접 선택할 필요가 없습니다. AI가 주변 차량 중 공간이 넉넉한 차량을 자동으로 매칭해 드립니다.
              </p>
            </div>
          </div>
        </section>
      </main>

      <div className="absolute bottom-0 left-0 w-full bg-surface-container-lowest animate-slide-up p-container-margin pt-5 pb-8 rounded-t-3xl shadow-[0_-10px_40px_0_rgba(0,0,0,0.08)] z-20 border-t border-surface-variant">
        <div className="flex justify-between items-end mb-4">
          <div>
            <p className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider text-[11px] font-bold mb-1">예상 요금</p>
            <div className="flex items-center gap-2">
              <span className="font-headline-md text-headline-md font-bold text-primary">{getPrice()}</span>
              <span className="bg-surface-container text-on-surface-variant font-data-mono text-[11px] px-2 py-0.5 rounded">원</span>
            </div>
          </div>
          <div className="text-right">
            <p className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider text-[11px] font-bold mb-1">배차 방식</p>
            <p className="font-body-md text-body-md font-bold text-primary flex items-center justify-end gap-1"><Zap size={14} className="fill-current"/> 자동 매칭</p>
          </div>
        </div>
        <button onClick={handleBook} className="w-full bg-primary hover:bg-on-primary-fixed-variant text-on-primary font-headline-sm text-headline-sm py-4 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-sm active:scale-[0.98] duration-150">
          <Package size={24} />
          운송 예약하기
        </button>
      </div>

      {modalResult && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(8px)' }} className="animate-fade-in">
          <div style={{ background: 'var(--surface)', width: '85%', borderRadius: '24px', padding: '32px 24px', textAlign: 'center', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }} className="animate-pop-in">
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: modalResult.result === 'D' ? 'var(--error-container)' : '#e5eeff', color: modalResult.result === 'D' ? 'var(--error)' : 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, margin: '0 auto 20px auto' }}>
              {modalResult.result === 'D' ? '!' : '✓'}
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--on-surface)', marginBottom: 12 }}>
              {modalResult.result === 'D' ? '배차 불가' : '화물 배차 성공!'}
            </h2>
            <p style={{ fontSize: 15, color: 'var(--on-surface-variant)', lineHeight: 1.5, marginBottom: 24, fontWeight: 500 }}>
              {modalResult.result === 'D' 
                ? '입력하신 부피/무게를 수용하며, 동승 승객의 지연을 유발하지 않는 차량이 근처에 없습니다.' 
                : '최적의 DRT 차량이 자동 배정되었습니다. 추적 화면으로 이동하시겠습니까?'}
            </p>
            <div style={{ background: 'var(--surface-dim)', borderRadius: '12px', padding: '16px', marginBottom: 24, textAlign: 'left' }}>
              <div style={{ fontSize: 12, color: 'var(--on-surface-variant)', fontWeight: 600, marginBottom: 4 }}>시스템 사유:</div>
              <div className="font-data-mono" style={{ fontSize: 13, color: 'var(--on-surface)', fontWeight: 700 }}>
                {modalResult.reason}
              </div>
            </div>
            {modalResult.result === 'D' ? (
              <button className="w-full bg-primary text-on-primary py-3 rounded-xl font-bold shadow-sm" onClick={() => setModalResult(null)}>확인</button>
            ) : (
              <button className="w-full bg-primary text-on-primary py-3 rounded-xl font-bold shadow-sm" onClick={() => navigate('/tracking', { state: { pickup, dropoff } })}>화물 추적하기</button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
