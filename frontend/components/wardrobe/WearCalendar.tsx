'use client';

import { Fragment, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import type { WearLogDay } from '@/lib/api';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const formatDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatDisplayDate = (isoDate: string) => {
  const date = new Date(`${isoDate}T00:00:00Z`);
  return date.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
};

type WearCalendarProps = {
  logs: WearLogDay[];
  isLoading?: boolean;
  errorMessage?: string | null;
  onRefresh?: () => void;
};

type CalendarDay = {
  date: Date;
  inMonth: boolean;
  isToday: boolean;
};

type CalendarMonth = {
  label: string;
  year: number;
  month: number;
  weeks: CalendarDay[][];
};

const buildCalendarMonth = (base: Date): CalendarMonth => {
  const year = base.getFullYear();
  const month = base.getMonth();
  const monthFormatter = new Intl.DateTimeFormat(undefined, {
    month: 'long',
    year: 'numeric',
  });

  const firstOfMonth = new Date(year, month, 1);
  const startDay = firstOfMonth.getDay();
  const cursor = new Date(year, month, 1 - startDay);
  const todayKey = formatDateKey(new Date());

  const weeks: CalendarDay[][] = [];
  for (let week = 0; week < 6; week++) {
    const days: CalendarDay[] = [];
    for (let day = 0; day < 7; day++) {
      const snapshot = new Date(cursor);
      days.push({
        date: snapshot,
        inMonth: snapshot.getMonth() === month,
        isToday: formatDateKey(snapshot) === todayKey,
      });
      cursor.setDate(cursor.getDate() + 1);
    }
    weeks.push(days);
  }

  return {
    label: monthFormatter.format(firstOfMonth),
    year,
    month,
    weeks,
  };
};

export const WearCalendar = ({
  logs,
  isLoading = false,
  errorMessage,
  onRefresh,
}: WearCalendarProps) => {
  const [monthOffset, setMonthOffset] = useState(0);
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);

  const today = useMemo(() => new Date(), []);

  const activeMonth = useMemo(() => {
    return buildCalendarMonth(new Date(today.getFullYear(), today.getMonth() + monthOffset, 1));
  }, [monthOffset, today]);

  const logsByDate = useMemo(() => {
    const map = new Map<string, WearLogDay>();
    for (const log of logs) {
      map.set(log.date, log);
    }
    return map;
  }, [logs]);

  useEffect(() => {
    if (selectedDateKey && logsByDate.has(selectedDateKey)) {
      return;
    }
    if (logs.length > 0) {
      const mostRecent = logs[logs.length - 1]?.date;
      if (mostRecent) {
        setSelectedDateKey(mostRecent);
        const mostRecentDate = new Date(`${mostRecent}T00:00:00Z`);
        const diffMonths =
          mostRecentDate.getUTCFullYear() * 12 + mostRecentDate.getUTCMonth() -
          (today.getFullYear() * 12 + today.getMonth());
        setMonthOffset(diffMonths);
      }
    }
  }, [logs, logsByDate, selectedDateKey, today]);

  const selectedLog = selectedDateKey ? logsByDate.get(selectedDateKey) : null;

  const handleSelectDate = (date: Date) => {
    const key = formatDateKey(date);
    setSelectedDateKey(logsByDate.has(key) ? key : null);
  };

  const goToPreviousMonth = () => {
    setMonthOffset((value) => value - 1);
  };

  const goToNextMonth = () => {
    setMonthOffset((value) => Math.min(value + 1, 0));
  };

  const canGoNext = monthOffset < 0;

  return (
    <aside className="flex h-[600px] flex-col gap-4 rounded-2xl border border-slate-800 bg-slate-900/70 p-4 shadow-lg">
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={goToPreviousMonth}
          className="rounded-full border border-slate-700 p-2 text-slate-300 transition hover:border-slate-500 hover:text-white"
          aria-label="Previous month"
        >
          <ChevronLeft size={16} />
        </button>
        <div className="flex flex-col items-center">
          <span className="text-sm font-semibold text-slate-200">{activeMonth.label}</span>
          <span className="text-xs text-slate-500">Outfit history</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={goToNextMonth}
            disabled={!canGoNext}
            className="rounded-full border border-slate-700 p-2 text-slate-300 transition hover:border-slate-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Next month"
          >
            <ChevronRight size={16} />
          </button>
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              className="rounded-full border border-slate-700 p-2 text-slate-300 transition hover:border-slate-500 hover:text-white"
              aria-label="Refresh wear logs"
            >
              <RefreshCw size={16} />
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2 text-center text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
        {DAY_LABELS.map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>

      <div className="grid flex-1 grid-cols-7 gap-2 text-sm">
        {activeMonth.weeks.map((week, weekIndex) => (
          <Fragment key={weekIndex}>
            {week.map((day) => {
              const key = formatDateKey(day.date);
              const hasLog = logsByDate.has(key);
              const isSelected = selectedDateKey === key && hasLog;

              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleSelectDate(day.date)}
                  className={`flex h-14 flex-col items-center justify-center rounded-xl border text-xs transition focus:outline-none focus:ring-2 focus:ring-indigo-500/60
                    ${day.inMonth ? 'border-slate-700 bg-slate-900/80 text-slate-200' : 'border-transparent bg-slate-900/40 text-slate-600'}
                    ${hasLog ? 'hover:border-indigo-400 hover:bg-indigo-500/10' : 'hover:border-slate-600 hover:bg-slate-800/60'}
                    ${isSelected ? 'border-indigo-500 bg-indigo-500/20 text-white' : ''}
                    ${day.isToday ? 'ring-1 ring-indigo-400/60' : ''}
                  `}
                >
                  <span className="text-sm font-semibold">{day.date.getDate()}</span>
                  {hasLog && <span className="mt-1 h-1.5 w-1.5 rounded-full bg-indigo-400" />}
                </button>
              );
            })}
          </Fragment>
        ))}
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-200">
        {errorMessage ? (
          <p className="text-sm text-rose-300">{errorMessage}</p>
        ) : isLoading ? (
          <p className="text-sm text-slate-400">Loading outfit history…</p>
        ) : selectedLog ? (
          <div className="space-y-3">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Worn on</p>
              <p className="text-sm font-semibold text-slate-100">{formatDisplayDate(selectedLog.date)}</p>
            </div>
            <ul className="space-y-3">
              {selectedLog.items.map((entry, index) => (
                <li key={`${entry.itemId || 'unknown'}-${index}`} className="flex items-center gap-3">
                  {entry.item?.imageUrl ? (
                    <div className="relative h-12 w-12 overflow-hidden rounded-lg border border-slate-800">
                      <Image
                        src={entry.item.imageUrl}
                        alt={entry.item.customName || entry.item.originalName || 'Wardrobe item'}
                        fill
                        className="object-cover"
                        sizes="48px"
                      />
                    </div>
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-slate-800 bg-slate-900/80 text-xs text-slate-500">
                      No image
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-100">
                      {entry.item?.customName || entry.item?.originalName || 'Wardrobe item'}
                    </p>
                    <p className="text-xs text-slate-500">
                      {entry.count > 1 ? `${entry.count} wears logged` : 'Logged once'}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ) : logs.length === 0 ? (
          <p className="text-sm text-slate-400">Start logging outfits to see them appear here.</p>
        ) : (
          <p className="text-sm text-slate-400">Select a highlighted date to view logged outfits.</p>
        )}
      </div>
    </aside>
  );
};

export default WearCalendar;
