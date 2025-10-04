// components/wardrobe/WeatherWidget.tsx
import { Sun, Cloud, Thermometer } from 'lucide-react';

export default function WeatherWidget() {
  return (
    <div className="mb-8 rounded-xl border border-slate-800 bg-slate-900/60 p-6 flex items-center justify-between">
      <div>
        <p className="text-sm text-slate-400">Today's Forecast</p>
        <h3 className="text-2xl font-bold text-slate-100">Ajmer, Rajasthan</h3>
      </div>
      <div className="flex items-center gap-6">
        <div className="text-center">
          <Sun size={28} className="text-yellow-400 mx-auto" />
          <p className="font-bold text-xl mt-1">Sunny</p>
        </div>
        <div className="text-center">
          <Thermometer size={28} className="text-red-400 mx-auto" />
          <p className="font-bold text-xl mt-1">32°C</p>
        </div>
      </div>
    </div>
  );
}