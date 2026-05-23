import { useState, useEffect, useRef, useCallback } from 'react'
import { evaluateFeasibility } from './feasibility'
import { MapContainer, TileLayer, Marker, Polyline } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import './App.css'

/* ─── 기본 좌표 ─── */
const DEFAULT_STATE = {
  vehicle: {
    id: 'V03',
    state: 'PASSENGER_ONLY',
    loc:   { lat: 35.19, lon: 126.81, name: '차량 현재 위치' },
    maxVolume: 500, maxWeight: 100,
    loadVolume: 0, loadWeight: 0,
  },
  passenger: {
    pickupStop:  { lat: 35.19, lon: 126.80, name: '승객 픽업 정류장' },
    dropoffStop: { lat: 35.17, lon: 126.79, name: '승객 하차 정류장' },
    pickupTol:  5, dropoffTol: 5,
    directTime: 8, maxRide: 10,
  },
  logistics: {
    id: 'L001',
    pickupLoc:  { lat: 35.20, lon: 126.81, name: '물류 상차 위치' },
    dropoffLoc: { lat: 35.16, lon: 126.78, name: '물류 하차 위치' },
    volume: 30, weight: 10,
    deadline: null, type: '일반',
  }
}

const VEHICLE_STATES = [
  { value: 'EMPTY',               label: '공차' },
  { value: 'PASSENGER_ONLY',      label: '승객 탑승 중' },
  { value: 'GOING_TO_PICKUP',     label: '승객 픽업 이동 중' },
  { value: 'LOGISTICS_ONLY',      label: '물류만 탑재 중' },
  { value: 'PASSENGER_LOGISTICS', label: '승객+물류 동시 탑재 중' },
]

const RESULT_COLORS = { A: '#0052ff', B: '#f57c00', C: '#2196f3', D: '#d32f2f' }
const RESULT_BG     = { A: '#f0f4ff', B: '#fff4e5', C: '#e3f2fd', D: '#ffebee' }

/* ─── Leaflet 맵 컴포넌트 ─── */
function getIcon(emoji, color, label) {
  return L.divIcon({
    className: 'custom-icon',
    html: `<div style="display: flex; flex-direction: column; align-items: center; justify-content: center; width: 40px; height: 40px; position: relative; top: -20px; left: -20px;">
      <div style="background: ${color}22; border: 2px solid ${color}; border-radius: 50%; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; font-size: 14px; box-shadow: 0 4px 8px rgba(0,0,0,0.15); background: white;">${emoji}</div>
      <div style="font-size: 11px; font-weight: 700; color: #0b1c30; margin-top: 4px; text-shadow: 1px 1px 0 #fff, -1px -1px 0 #fff, 1px -1px 0 #fff, -1px 1px 0 #fff; white-space: nowrap;">${label}</div>
    </div>`,
    iconSize: [0, 0],
    iconAnchor: [0, 0]
  });
}

function DRTMap({ vehicle, passenger, logistics, result }) {
  const centerLat = (vehicle.loc.lat + passenger.pickupStop.lat + passenger.dropoffStop.lat + logistics.pickupLoc.lat + logistics.dropoffLoc.lat) / 5;
  const centerLon = (vehicle.loc.lon + passenger.pickupStop.lon + passenger.dropoffStop.lon + logistics.pickupLoc.lon + logistics.dropoffLoc.lon) / 5;

  const selectedKey = result?.selectedKey;
  
  const routes = {
    A: [[vehicle.loc.lat, vehicle.loc.lon], [logistics.pickupLoc.lat, logistics.pickupLoc.lon], [logistics.dropoffLoc.lat, logistics.dropoffLoc.lon], [passenger.dropoffStop.lat, passenger.dropoffStop.lon]],
    B: [[vehicle.loc.lat, vehicle.loc.lon], [logistics.pickupLoc.lat, logistics.pickupLoc.lon], [passenger.dropoffStop.lat, passenger.dropoffStop.lon], [logistics.dropoffLoc.lat, logistics.dropoffLoc.lon]],
    C: [[vehicle.loc.lat, vehicle.loc.lon], [passenger.dropoffStop.lat, passenger.dropoffStop.lon], [logistics.pickupLoc.lat, logistics.pickupLoc.lon], [logistics.dropoffLoc.lat, logistics.dropoffLoc.lon]],
  }
  const routeColors = { A: '#0052ff', B: '#f57c00', C: '#2196f3' }

  return (
    <div style={{ width: '100%', height: 420, borderRadius: 'var(--radius)', overflow: 'hidden', border: '1px solid var(--border)', position: 'relative', boxShadow: 'var(--shadow)' }}>
      <MapContainer center={[centerLat, centerLon]} zoom={12} style={{ width: '100%', height: '100%', background: '#e5e3df' }}>
        <TileLayer
          attribution='&copy; <a href="http://map.vworld.kr/">Vworld</a>'
          url="https://xdworld.vworld.kr/2d/Base/service/{z}/{x}/{y}.png"
        />
        
        {Object.entries(routes).map(([k, pts]) => (
          selectedKey !== k && <Polyline key={k} positions={pts} pathOptions={{ color: routeColors[k], weight: 4, dashArray: '6,6', opacity: 0.5 }} />
        ))}
        {selectedKey && (
          <Polyline positions={routes[selectedKey]} pathOptions={{ color: routeColors[selectedKey], weight: 6, opacity: 0.9 }} />
        )}

        <Marker position={[vehicle.loc.lat, vehicle.loc.lon]} icon={getIcon('🚌', '#0052ff', '차량')} />
        <Marker position={[passenger.pickupStop.lat, passenger.pickupStop.lon]} icon={getIcon('🧍', '#3fb950', '승객 픽업')} />
        <Marker position={[passenger.dropoffStop.lat, passenger.dropoffStop.lon]} icon={getIcon('🏁', '#3fb950', '승객 하차')} />
        <Marker position={[logistics.pickupLoc.lat, logistics.pickupLoc.lon]} icon={getIcon('📦', '#f57c00', '물류 상차')} />
        <Marker position={[logistics.dropoffLoc.lat, logistics.dropoffLoc.lon]} icon={getIcon('📫', '#f57c00', '물류 하차')} />
      </MapContainer>

      <div style={{ position: 'absolute', right: 16, top: 16, background: 'rgba(255,255,255,0.95)', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border)', zIndex: 1000, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text)', marginBottom: 6 }}>경로 색상</div>
        {Object.entries(routeColors).map(([k, c]) => (
          <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, opacity: selectedKey && selectedKey !== k ? 0.4 : 1 }}>
            <div style={{ width: 18, height: 4, background: c, borderBottom: selectedKey !== k ? `2px dashed ${c}` : 'none' }}></div>
            <span style={{ fontSize: 11, color: 'var(--text)', fontWeight: 600 }}>후보 {k}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function Section({ title, color, children }) {
  return (
    <div style={{ marginBottom:24, background: 'var(--surface)', padding: '16px 18px', borderRadius: 'var(--radius)', border: '1px solid var(--border)', boxShadow: 'var(--shadow)' }}>
      <div style={{ fontSize:15, fontWeight:800, color: 'var(--text)', marginBottom:16,
        display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 4, height: 16, background: color, borderRadius: 2 }} />
        {title}
      </div>
      {children}
    </div>
  )
}

function NumInput({ label, value, onChange }) {
  return (
    <div>
      <label style={{ fontSize:12, color:'var(--muted)', display:'block', marginBottom:6, fontWeight: 500 }}>{label}</label>
      <input type="number" value={value} onChange={e => onChange(Number(e.target.value))}
        style={{ width:'100%', background:'var(--surface2)', color:'var(--text)', border:'1px solid var(--border)',
          borderRadius:8, padding:'10px 12px', fontSize:13, fontWeight: 600, outline: 'none' }} />
    </div>
  )
}

function Slider({ label, value, min, max, step = 0.5, unit = '분', onChange }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ display:'flex', justifyContent:'space-between', marginBottom: 8 }}>
        <span style={{ fontSize: 13, color: 'var(--muted)', fontWeight: 600 }}>{label}</span>
        <span style={{ fontSize: 14, color: 'var(--accent)', fontWeight: 800 }}>{value}{unit}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{ width:'100%', accentColor:'var(--accent)', cursor: 'pointer' }} />
    </div>
  )
}

function ResultCard({ result }) {
  if (!result) return null
  const color = RESULT_COLORS[result.result]
  const bg    = RESULT_BG[result.result]

  return (
    <div style={{ background: bg, border: `1px solid ${color}40`, borderRadius: 'var(--radius)', padding: '20px 24px', marginTop: 16 }}>
      <div style={{ fontSize: 20, fontWeight: 800, color, marginBottom: 8 }}>{result.resultLabel}</div>
      <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 20, fontWeight: 600 }}>{result.reason}</div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap: 12 }}>
        {[
          ['승객 픽업 지연', `${result.pickupDelay >= 0 ? '+' : ''}${result.pickupDelay.toFixed(1)}분`],
          ['승객 도착 지연', `${result.dropoffDelay >= 0 ? '+' : ''}${result.dropoffDelay.toFixed(1)}분`],
          ['총 탑승 시간', `${result.rideTime.toFixed(1)}분`],
          ['최적 배정 순서', result.recommendedOrder],
        ].map(([k, v]) => (
          <div key={k} style={{ background:'var(--surface)', borderRadius: 8, padding:'12px 14px', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 12, color:'var(--muted)', marginBottom: 6, fontWeight: 600 }}>{k}</div>
            <div style={{ fontSize: 15, color, fontWeight: 800 }}>{v}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function CandidateTable({ candidates, selectedKey }) {
  if (!candidates?.length) return null
  const cols = ['후보', '설명', '픽업 지연', '도착 지연', '탑승시간', '통과여부']
  return (
    <div style={{ marginTop: 16, overflowX:'auto', border: '1px solid var(--border)', borderRadius: 'var(--radius)', background: 'var(--surface)' }}>
      <table style={{ width:'100%', borderCollapse:'collapse', fontSize: 12 }}>
        <thead>
          <tr style={{ background: 'var(--surface2)' }}>{cols.map(c => (
            <th key={c} style={{ padding:'12px 16px', textAlign:'left', color:'var(--muted)',
              borderBottom:'1px solid var(--border)', fontWeight:600 }}>{c}</th>
          ))}</tr>
        </thead>
        <tbody>
          {candidates.map((c, i) => {
            const color = c.ok ? 'var(--accent2)' : 'var(--warn)'
            const isSel = c.key === selectedKey
            return (
              <tr key={c.key} style={{ background: isSel ? 'var(--bg)' : 'transparent', borderBottom: i === candidates.length - 1 ? 'none' : '1px solid var(--border)' }}>
                <td style={{ padding:'12px 16px', color: RESULT_COLORS[c.key] || 'var(--text)', fontWeight: 800 }}>
                  {isSel ? '▶ ' : ''}{c.key}
                </td>
                <td style={{ padding:'12px 16px', color:'var(--text)', fontWeight: 500, maxWidth: 200 }}>{c.desc}</td>
                <td style={{ padding:'12px 16px', color: c.pickupDelay > 0 ? 'var(--warn)' : 'var(--accent2)', fontWeight: 600 }}>
                  {c.pickupDelay >= 0 ? '+' : ''}{c.pickupDelay.toFixed(1)}분
                </td>
                <td style={{ padding:'12px 16px', color: c.dropoffDelay > 0 ? 'var(--warn)' : 'var(--accent2)', fontWeight: 600 }}>
                  {c.dropoffDelay >= 0 ? '+' : ''}{c.dropoffDelay.toFixed(1)}분
                </td>
                <td style={{ padding:'12px 16px', color:'var(--text)', fontWeight: 600 }}>{c.rideTime.toFixed(1)}분</td>
                <td style={{ padding:'12px 16px', color, fontWeight: 700 }}>{c.ok ? '✓ 통과' : `✗ ${c.reason}`}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export default function App() {
  const [state, setState] = useState(DEFAULT_STATE)
  const [result, setResult] = useState(null)
  const [autoRun, setAutoRun] = useState(true)
  const [stops, setStops] = useState([])
  const [nodes, setNodes] = useState([])

  useEffect(() => {
    async function loadData() {
      try {
        const [stopsRes, nodesRes] = await Promise.all([
          fetch('http://localhost:8000/api/stops?limit=50'),
          fetch('http://localhost:8000/api/logistics_nodes?limit=50')
        ])
        const stopsData = await stopsRes.json()
        const nodesData = await nodesRes.json()
        setStops(stopsData)
        setNodes(nodesData)
        
        if (stopsData.length >= 3 && nodesData.length >= 1) {
           const pStop1 = stopsData[0]
           const pStop2 = stopsData[1]
           const lNode1 = nodesData[0]
           const lNode2 = stopsData[2]
           
           setState(prev => ({
             ...prev,
             passenger: {
               ...prev.passenger,
               pickupStop: { lat: pStop1.lat, lon: pStop1.lon, name: pStop1.name },
               dropoffStop: { lat: pStop2.lat, lon: pStop2.lon, name: pStop2.name }
             },
             logistics: {
               ...prev.logistics,
               pickupLoc: { lat: lNode1.lat, lon: lNode1.lon, name: lNode1.name },
               dropoffLoc: { lat: lNode2.lat, lon: lNode2.lon, name: lNode2.name }
             }
           }))
        }
      } catch (e) {
        console.error("Failed to load backend data:", e)
      }
    }
    loadData()
  }, [])

  const run = useCallback(() => {
    const r = evaluateFeasibility(state.vehicle, state.passenger, state.logistics)
    setResult(r)
  }, [state])

  useEffect(() => { if (autoRun) run() }, [state, autoRun, run])

  const setV = (path, val) => setState(prev => {
    const next = JSON.parse(JSON.stringify(prev))
    const keys = path.split('.')
    let obj = next
    keys.slice(0, -1).forEach(k => obj = obj[k])
    obj[keys[keys.length - 1]] = val
    return next
  })

  const s = state
  const resultColor = result ? RESULT_COLORS[result.result] : 'var(--muted)'

  const selectStyle = {
    width:'100%', marginTop:6, background:'var(--surface2)', color:'var(--text)', border:'1px solid var(--border)',
    borderRadius:8, padding:'10px 12px', fontSize:13, fontWeight: 600
  }

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg)', display:'flex', flexDirection:'column' }}>
      {/* 헤더 */}
      <header style={{ background:'var(--surface)', borderBottom:'1px solid var(--border)', padding:'16px 32px',
        display:'flex', alignItems:'center', gap: 16, position:'sticky', top:0, zIndex:10, boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
        <div style={{ background: 'var(--accent)', color: 'white', width: 40, height: 40, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
          🚌
        </div>
        <div>
          <div style={{ fontSize: 18, fontWeight: 800, color:'var(--text)' }}>Smart DRT Mobility</div>
          <div style={{ fontSize: 12, color:'var(--muted)', fontWeight: 500, marginTop: 2 }}>광산구 승객 우선 물류 판정 시스템</div>
        </div>
        <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:16 }}>
          <label style={{ fontSize:13, color:'var(--text)', display:'flex', alignItems:'center', gap:8, cursor:'pointer', fontWeight: 600 }}>
            <input type="checkbox" checked={autoRun} onChange={e => setAutoRun(e.target.checked)} style={{ accentColor:'var(--accent)', width: 16, height: 16 }} />
            실시간 자동 계산
          </label>
          <button onClick={run}
            style={{ background:'var(--accent)', color:'white', border:'none', borderRadius:8,
              padding:'10px 20px', fontSize:14, fontWeight:700, cursor:'pointer', boxShadow: '0 4px 12px rgba(0, 82, 255, 0.2)' }}>
            판정 실행
          </button>
        </div>
      </header>

      <div style={{ display:'grid', gridTemplateColumns:'360px 1fr', gap:24, flex:1, overflow:'hidden', padding: 24, maxWidth: 1600, margin: '0 auto', width: '100%' }}>
        {/* 좌측 입력 패널 */}
        <div style={{ overflowY:'auto', paddingRight: 8 }}>
          {/* 차량 상태 */}
          <Section title="차량 상태" color="var(--accent)">
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize:12, color:'var(--muted)', fontWeight: 600 }}>현재 차량 모드</label>
              <select value={s.vehicle.state} onChange={e => setV('vehicle.state', e.target.value)} style={selectStyle}>
                {VEHICLE_STATES.map(vs => <option key={vs.value} value={vs.value}>{vs.label}</option>)}
              </select>
            </div>
            <Slider label="현재 적재 부피" value={s.vehicle.loadVolume} min={0} max={s.vehicle.maxVolume} unit="L"
              onChange={v => setV('vehicle.loadVolume', v)} />
            <Slider label="현재 적재 무게" value={s.vehicle.loadWeight} min={0} max={s.vehicle.maxWeight} unit="kg"
              onChange={v => setV('vehicle.loadWeight', v)} />
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginTop:16 }}>
              <NumInput label="최대 부피(L)" value={s.vehicle.maxVolume} onChange={v => setV('vehicle.maxVolume', v)} />
              <NumInput label="최대 무게(kg)" value={s.vehicle.maxWeight} onChange={v => setV('vehicle.maxWeight', v)} />
            </div>
          </Section>

          {/* 승객 */}
          <Section title="승객 요청" color="var(--accent2)">
            <div style={{ marginBottom:16 }}>
              <label style={{ fontSize:12, color:'var(--muted)', fontWeight: 600 }}>픽업 정류장</label>
              <select 
                value={s.passenger.pickupStop.name} 
                onChange={e => {
                  const st = stops.find(x => x.name === e.target.value)
                  if(st) setV('passenger.pickupStop', { lat: st.lat, lon: st.lon, name: st.name })
                }}
                style={selectStyle}>
                {stops.map(st => <option key={`p_${st.id}`} value={st.name}>{st.name}</option>)}
              </select>
            </div>
            <div style={{ marginBottom:20 }}>
              <label style={{ fontSize:12, color:'var(--muted)', fontWeight: 600 }}>하차 정류장</label>
              <select 
                value={s.passenger.dropoffStop.name} 
                onChange={e => {
                  const st = stops.find(x => x.name === e.target.value)
                  if(st) setV('passenger.dropoffStop', { lat: st.lat, lon: st.lon, name: st.name })
                }}
                style={selectStyle}>
                {stops.map(st => <option key={`d_${st.id}`} value={st.name}>{st.name}</option>)}
              </select>
            </div>
            <Slider label="승객 픽업 최대 허용 지연시간" value={s.passenger.pickupTol} min={0} max={20}
              onChange={v => setV('passenger.pickupTol', v)} />
            <Slider label="승객 도착 최대 허용 지연시간" value={s.passenger.dropoffTol} min={0} max={20}
              onChange={v => setV('passenger.dropoffTol', v)} />
            <Slider label="승객 기본 이동 소요시간 (직행)" value={s.passenger.directTime} min={1} max={40}
              onChange={v => setV('passenger.directTime', v)} />
            <Slider label="우회로 인한 최대 추가 탑승 허용시간" value={s.passenger.maxRide} min={0} max={30}
              onChange={v => setV('passenger.maxRide', v)} />
          </Section>

          {/* 물류 */}
          <Section title="물류 요청" color="var(--yellow)">
            <div style={{ marginBottom:16 }}>
              <label style={{ fontSize:12, color:'var(--muted)', fontWeight: 600 }}>상차(출발) 위치</label>
              <select 
                value={s.logistics.pickupLoc.name} 
                onChange={e => {
                  const n = nodes.find(x => x.name === e.target.value) || stops.find(x => x.name === e.target.value)
                  if(n) setV('logistics.pickupLoc', { lat: n.lat, lon: n.lon, name: n.name })
                }}
                style={selectStyle}>
                <optgroup label="물류 거점">
                  {nodes.map(n => <option key={`ln_${n.id}`} value={n.name}>{n.name}</option>)}
                </optgroup>
                <optgroup label="정류장">
                  {stops.map(st => <option key={`ls_${st.id}`} value={st.name}>{st.name}</option>)}
                </optgroup>
              </select>
            </div>
            <div style={{ marginBottom:16 }}>
              <label style={{ fontSize:12, color:'var(--muted)', fontWeight: 600 }}>하차(도착) 위치</label>
              <select 
                value={s.logistics.dropoffLoc.name} 
                onChange={e => {
                  const n = nodes.find(x => x.name === e.target.value) || stops.find(x => x.name === e.target.value)
                  if(n) setV('logistics.dropoffLoc', { lat: n.lat, lon: n.lon, name: n.name })
                }}
                style={selectStyle}>
                <optgroup label="물류 거점">
                  {nodes.map(n => <option key={`ldn_${n.id}`} value={n.name}>{n.name}</option>)}
                </optgroup>
                <optgroup label="정류장">
                  {stops.map(st => <option key={`lds_${st.id}`} value={st.name}>{st.name}</option>)}
                </optgroup>
              </select>
            </div>
            <div style={{ marginBottom:20 }}>
              <label style={{ fontSize:12, color:'var(--muted)', fontWeight: 600 }}>물류 유형</label>
              <select value={s.logistics.type} onChange={e => setV('logistics.type', e.target.value)} style={selectStyle}>
                {['일반','냉장','위험물'].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <Slider label="물류 부피" value={s.logistics.volume} min={0} max={500} unit="L"
              onChange={v => setV('logistics.volume', v)} />
            <Slider label="물류 무게" value={s.logistics.weight} min={0} max={100} unit="kg"
              onChange={v => setV('logistics.weight', v)} />
            <Slider label="하차 제한시간 (0=없음)" value={s.logistics.deadline ?? 0} min={0} max={60}
              onChange={v => setV('logistics.deadline', v === 0 ? null : v)} />
          </Section>
        </div>

        {/* 우측 메인 */}
        <div style={{ overflowY:'auto', display:'flex', flexDirection:'column', gap:24, paddingRight: 8 }}>

          {/* 지도 */}
          <DRTMap vehicle={s.vehicle} passenger={s.passenger} logistics={s.logistics} result={result} />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 24 }}>
            {/* 판정 결과 */}
            <div style={{ background:'var(--surface)', borderRadius:'var(--radius)', padding:'24px', border:'1px solid var(--border)', boxShadow: 'var(--shadow)' }}>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
                <div style={{ width:12, height:12, borderRadius:'50%', background: resultColor }} />
                <span style={{ fontSize:16, fontWeight:800, color:'var(--text)' }}>AI 판정 결과</span>
              </div>
              <ResultCard result={result} />
            </div>

            {/* 후보 경로 비교표 */}
            <div style={{ background:'var(--surface)', borderRadius:'var(--radius)', padding:'24px', border:'1px solid var(--border)', boxShadow: 'var(--shadow)' }}>
              <span style={{ fontSize:16, fontWeight:800, color:'var(--text)' }}>후보 경로 비교</span>
              <CandidateTable candidates={result?.candidates} selectedKey={result?.selectedKey} />
            </div>

            {/* 판정식 설명 */}
            <div style={{ background:'var(--surface)', borderRadius:'var(--radius)', padding:'24px', border:'1px solid var(--border)', boxShadow: 'var(--shadow)', fontSize:13, color:'var(--muted)', lineHeight:1.8 }}>
              <div style={{ fontSize:14, fontWeight:800, color:'var(--text)', marginBottom:16 }}>차량 합승 가능 여부 판정 기준</div>
              {[
                ['[조건 1] 픽업 지연 시간 확인', '승객을 태우러 가는 시간이 최대 허용 대기시간을 넘지 않아야 합니다.', 'var(--accent)'],
                ['[조건 2] 도착 지연 시간 확인', '승객이 목적지에 도착하는 시간이 최대 허용 지연시간을 넘지 않아야 합니다.', 'var(--accent)'],
                ['[조건 3] 총 탑승 시간 확인', '승객이 차에 타 있는 총 시간이 (직행 기준 시간 + 추가 허용 시간)을 넘지 않아야 합니다.', 'var(--accent2)'],
                ['[조건 4] 차량 적재량 확인', '새로운 화물을 실었을 때 차량의 최대 적재 한도(부피/무게)를 초과하지 않아야 합니다.', 'var(--accent2)'],
                ['[조건 5] 상/하차 순서 확인', '화물을 싣는 작업이 내리는 작업보다 먼저 이루어져야 합니다.', 'var(--yellow)'],
              ].map(([eq, desc, c]) => (
                <div key={eq} style={{ display:'flex', gap:16, marginBottom:8, alignItems: 'flex-start' }}>
                  <span style={{ color: c, fontWeight:800, minWidth:200 }}>{eq}</span>
                  <span style={{ color: 'var(--text)', fontWeight: 500 }}>{desc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
