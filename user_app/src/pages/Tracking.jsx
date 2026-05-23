import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Phone, FileText, Package } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Polyline } from 'react-leaflet';
import L from 'leaflet';

export default function Tracking() {
  const navigate = useNavigate();

  const getVehicleIcon = () => {
    return L.divIcon({
      className: 'custom-pin',
      html: `<div style="width: 36px; height: 36px; background: #0052FF; border: 3px solid white; border-radius: 50%; box-shadow: 0 4px 12px rgba(0,82,255,0.4); display:flex; align-items:center; justify-content:center; color:white;"><span class="material-symbols-outlined" style="font-size: 20px;">local_shipping</span></div>`,
      iconSize: [36, 36], iconAnchor: [18, 18]
    });
  };

  const getMarkerIcon = (color) => {
    return L.divIcon({
      className: 'custom-pin',
      html: `<div style="width: 16px; height: 16px; background: ${color}; border: 2px solid white; border-radius: 50%; box-shadow: 0 2px 4px rgba(0,0,0,0.2);"></div>`,
      iconSize: [16, 16], iconAnchor: [8, 8]
    });
  };

  return (
    <div className="bg-background animate-fade-in text-on-background font-body-md text-body-md h-full flex flex-col antialiased h-full overflow-hidden">
      {/* TopAppBar */}
      <header className="absolute top-0 w-full z-50 flex justify-between items-center px-container-margin h-16 bg-surface shadow-sm">
        <button onClick={() => navigate('/cargo')} className="text-primary hover:bg-surface-container-low transition-colors rounded-full p-2 flex items-center justify-center">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-headline-sm font-headline-sm text-primary font-bold">실시간 화물 추적</h1>
        <div className="w-10"></div>
      </header>

      {/* Main Content Canvas */}
      <main className="flex-1 flex flex-col pt-16 h-full relative">
        {/* Map Area */}
        <div className="flex-1 relative bg-surface-container-low overflow-hidden">
          <MapContainer center={[35.195, 126.815]} zoom={14} style={{ width: '100%', height: '100%' }} zoomControl={false} attributionControl={false}>
            <TileLayer url="https://xdworld.vworld.kr/2d/Base/service/{z}/{x}/{y}.png" />
            <Marker position={[35.195, 126.815]} icon={getVehicleIcon()} />
            <Marker position={[35.18, 126.80]} icon={getMarkerIcon('#FFFFFF')} />
            <Marker position={[35.21, 126.83]} icon={getMarkerIcon('#0052FF')} />
            <Polyline positions={[[35.18, 126.80], [35.195, 126.815], [35.21, 126.83]]} pathOptions={{ color: '#0052FF', weight: 4, dashArray: '8,8' }} />
          </MapContainer>
        </div>

        {/* Non-Modal Bottom Sheet */}
        <div className="bg-surface rounded-t-xl animate-slide-up shadow-[0_-4px_20px_0_rgba(0,0,0,0.04)] px-container-margin py-stack-lg z-20 relative -mt-4">
          <div className="w-12 h-1.5 bg-outline-variant rounded-full mx-auto mb-stack-md"></div>
          
          <div className="flex justify-between items-center mb-stack-lg">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-primary animate-pulse"></div>
              <h2 className="text-headline-sm font-headline-sm text-on-surface font-bold">운송 중</h2>
            </div>
            <span className="text-data-mono font-data-mono text-secondary">#CRG-8924</span>
          </div>

          <div className="relative w-full h-2 bg-surface-container rounded-full mb-stack-lg">
            <div className="absolute top-0 left-0 h-full bg-primary-container rounded-full" style={{width: '60%'}}></div>
            <div className="absolute top-1/2 left-0 transform -translate-y-1/2 w-4 h-4 rounded-full bg-primary border-2 border-surface"></div>
            <div className="absolute top-1/2 left-[60%] transform -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-primary border-2 border-surface shadow-[0_0_0_4px_rgba(0,82,255,0.2)]"></div>
            <div className="absolute top-1/2 right-0 transform -translate-y-1/2 w-4 h-4 rounded-full bg-surface-container border-2 border-surface"></div>
          </div>
          
          <div className="flex justify-between text-label-md font-label-md text-secondary mb-stack-lg">
            <span>상차 완료<br/>오전 10:45</span>
            <span className="text-right">도착 예정<br/>오전 11:30</span>
          </div>
          
          <hr className="border-outline-variant opacity-50 mb-stack-md"/>

          <div className="bg-surface-container-low rounded-lg p-stack-md mb-stack-lg flex items-center gap-4">
            <div className="bg-tertiary-container text-on-tertiary-container p-3 rounded-lg">
              <Package size={24} />
            </div>
            <div className="flex-1">
              <h3 className="text-body-md font-body-md text-on-surface font-semibold">일반 화물 (Box)</h3>
              <p className="text-label-md font-label-md text-secondary">1 팔레트 • 300 kg</p>
            </div>
          </div>

          <div className="flex gap-gutter mt-auto pb-stack-md">
            <button className="flex-1 bg-surface-container-high text-on-surface text-body-md font-body-md py-3 rounded-lg font-medium flex justify-center items-center gap-2 hover:bg-surface-variant transition-colors">
              <FileText size={20} /> 인수증
            </button>
            <button className="flex-[2] bg-primary-container text-on-primary text-body-md font-body-md py-3 rounded-lg font-semibold flex justify-center items-center gap-2 shadow-lg shadow-primary-container/20 hover:opacity-90 transition-opacity">
              <Phone size={20} /> 기사님 호출
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
