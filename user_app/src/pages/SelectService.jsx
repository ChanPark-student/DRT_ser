import { useNavigate } from 'react-router-dom';

export default function SelectService() {
  const navigate = useNavigate();

  return (
    <div className="bg-background animate-fade-in text-on-background min-h-full flex flex-col font-body-md antialiased selection:bg-primary-container selection:text-on-primary-container">
      {/* TopAppBar */}
      <header className="absolute top-0 w-full z-50 flex justify-between items-center px-container-margin h-16 bg-surface shadow-sm">
        <button aria-label="Menu" className="text-primary hover:bg-surface-container-low transition-colors rounded-full p-2 -ml-2">
          <span className="material-symbols-outlined">menu</span>
        </button>
        <h1 className="text-headline-sm font-headline-sm font-bold text-primary">DRT Connect</h1>
        <button aria-label="Notifications" className="text-primary hover:bg-surface-container-low transition-colors rounded-full p-2 -mr-2">
          <span className="material-symbols-outlined">notifications</span>
        </button>
      </header>

      {/* Main Content Canvas */}
      <main className="flex-grow pt-24 px-container-margin pb-safe-bottom flex flex-col items-center justify-center">
        <div className="w-full max-w-md mx-auto flex flex-col gap-stack-lg">
          <div className="text-center mb-stack-md">
            <h2 className="text-display-lg font-display-lg text-on-surface mb-stack-sm">서비스 선택</h2>
            <p className="text-body-lg font-body-lg text-on-surface-variant">오늘 어떤 이동 서비스가 필요하신가요?</p>
          </div>

          {/* 여객 (승객) Card */}
          <button 
            onClick={() => navigate('/passenger')}
            className="service-card w-full bg-surface-container-lowest border border-outline-variant rounded-2xl p-stack-lg flex flex-col items-start gap-stack-md ambient-shadow text-left focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent group"
          >
            <div className="w-16 h-16 rounded-full bg-surface-container-low flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-on-primary transition-colors duration-300">
              <span className="material-symbols-outlined text-[36px] icon-fill">directions_bus</span>
            </div>
            <div>
              <h3 className="text-headline-md font-headline-md text-on-surface mb-unit">여객 (승객)</h3>
              <p className="text-body-md font-body-md text-on-surface-variant">원하시는 목적지까지 빠르고 편안하게 이동하세요.</p>
            </div>
            <div className="w-full flex justify-end mt-stack-sm">
              <span className="material-symbols-outlined text-primary group-hover:translate-x-1 transition-transform">arrow_forward</span>
            </div>
          </button>

          {/* 화물 (물류) Card */}
          <button 
            onClick={() => navigate('/cargo')}
            className="service-card w-full bg-surface-container-lowest border border-outline-variant rounded-2xl p-stack-lg flex flex-col items-start gap-stack-md ambient-shadow text-left focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent group"
          >
            <div className="w-16 h-16 rounded-full bg-surface-container-low flex items-center justify-center text-tertiary group-hover:bg-tertiary group-hover:text-on-tertiary transition-colors duration-300">
              <span className="material-symbols-outlined text-[36px] icon-fill">local_shipping</span>
            </div>
            <div>
              <h3 className="text-headline-md font-headline-md text-on-surface mb-unit">화물 (물류)</h3>
              <p className="text-body-md font-body-md text-on-surface-variant">물류 거점 간의 신속하고 안전한 화물 운송 서비스입니다.</p>
            </div>
            <div className="w-full flex justify-end mt-stack-sm">
              <span className="material-symbols-outlined text-tertiary group-hover:translate-x-1 transition-transform">arrow_forward</span>
            </div>
          </button>
        </div>
      </main>
    </div>
  );
}
