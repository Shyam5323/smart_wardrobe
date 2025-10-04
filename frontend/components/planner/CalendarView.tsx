// components/planner/CalendarView.tsx
'use client';
import { useState } from 'react';

const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function CalendarView() {
  const [selectedDay, setSelectedDay] = useState('Fri');

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-slate-100">October 2025</h2>
        {/* Placeholder for month navigation */}
      </div>
      <div className="mt-6 grid grid-cols-7 gap-2 text-center text-sm">
        {days.map((day) => (
          <div key={day} className="font-medium text-slate-400">{day}</div>
        ))}
        {/* Render some days for the week */}
        {[...Array(7)].map((_, i) => {
          const day = days[i];
          const isActive = day === selectedDay;
          return (
            <button
              key={i}
              onClick={() => setSelectedDay(day)}
              className={`flex h-24 w-full flex-col items-center justify-center rounded-lg transition-colors ${isActive ? 'bg-indigo-500 text-white' : 'bg-slate-800/50 hover:bg-slate-800'}`}
            >
              <span className="text-lg font-bold">{i + 1}</span>
            </button>
          );
        })}
      </div>
      <div className="mt-8 border-t border-slate-800 pt-6">
        <h3 className="font-semibold">Outfit for {selectedDay}, Oct {days.indexOf(selectedDay) + 1}</h3>
        <div className="mt-4 flex h-32 items-center justify-center rounded-lg bg-slate-800/50">
          <p className="text-sm text-slate-500">No outfit planned.</p>
        </div>
      </div>
    </div>
  );
}