import { BrowserRouter, Routes, Route } from 'react-router-dom';
import SelectService from './pages/SelectService';
import PassengerHome from './pages/PassengerHome';
import CargoBooking from './pages/CargoBooking';
import Tracking from './pages/Tracking';
import './index.css';

export default function App() {
  return (
    <div className="bg-[#e5eeff] min-h-screen w-full flex items-center justify-center overflow-auto py-8">
      <div className="w-[400px] h-[850px] shrink-0 rounded-[40px] shadow-2xl relative overflow-hidden bg-background border-[8px] border-surface-variant">
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<SelectService />} />
            <Route path="/passenger" element={<PassengerHome />} />
            <Route path="/cargo" element={<CargoBooking />} />
            <Route path="/tracking" element={<Tracking />} />
          </Routes>
        </BrowserRouter>
      </div>
    </div>
  );
}
