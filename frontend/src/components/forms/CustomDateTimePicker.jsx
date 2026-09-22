import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { m, AnimatePresence } from 'framer-motion';
import { Calendar as CalendarIcon, Clock, ChevronLeft, ChevronRight, X, Check, Zap } from 'lucide-react';
import { cn } from '../../lib/utils';

export default function CustomDateTimePicker({
  value,
  onChange,
  className,
  placeholder = 'Chọn ngày giờ...',
  disabled = false,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0, bottom: 0 });
  const [dropUp, setDropUp] = useState(false);
  const containerRef = useRef(null);

  // Parse YYYY-MM-DDTHH:mm or YYYY-MM-DD HH:mm:ss
  const parseDateTime = (val) => {
    if (!val) return new Date();
    const clean = val.replace(' ', 'T');
    const d = new Date(clean);
    return isNaN(d.getTime()) ? new Date() : d;
  };

  const parsed = value ? parseDateTime(value) : null;
  const now = new Date();
  const [currentMonth, setCurrentMonth] = useState(parsed || now);
  const [selectedDate, setSelectedDate] = useState(parsed || now);
  const [selectedHour, setSelectedHour] = useState(parsed ? parsed.getHours() : now.getHours());
  const [selectedMinute, setSelectedMinute] = useState(parsed ? parsed.getMinutes() : now.getMinutes());

  useEffect(() => {
    if (value) {
      const d = parseDateTime(value);
      setSelectedDate(d);
      setCurrentMonth(d);
      setSelectedHour(d.getHours());
      setSelectedMinute(d.getMinutes());
    } else {
      const cur = new Date();
      setSelectedDate(cur);
      setCurrentMonth(cur);
      setSelectedHour(cur.getHours());
      setSelectedMinute(cur.getMinutes());
    }
  }, [value]);

  // Positioning
  useEffect(() => {
    if (isOpen && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const popupWidth = Math.min(580, window.innerWidth - 20);
      const spaceBelow = window.innerHeight - rect.bottom;
      const shouldDropUp = spaceBelow < 420 && rect.top > 420;
      setDropUp(shouldDropUp);
      setCoords({
        top: rect.bottom,
        bottom: window.innerHeight - rect.top,
        left: Math.max(10, Math.min(rect.left, window.innerWidth - popupWidth - 10)),
        width: popupWidth,
      });
    }
  }, [isOpen]);

  // Click outside to close
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        const portalEl = document.getElementById('custom-datetime-picker-portal');
        if (portalEl && portalEl.contains(event.target)) return;
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const emitChange = (d, h, m) => {
    const y = d.getFullYear();
    const mo = String(d.getMonth() + 1).padStart(2, '0');
    const da = String(d.getDate()).padStart(2, '0');
    const ho = String(h).padStart(2, '0');
    const mi = String(m).padStart(2, '0');
    const formatted = `${y}-${mo}-${da}T${ho}:${mi}`;
    onChange(formatted);
  };

  const handleSelectDay = (day) => {
    const newDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    setSelectedDate(newDate);
    emitChange(newDate, selectedHour, selectedMinute);
  };

  const handleHourChange = (newH) => {
    const h = Math.max(0, Math.min(23, Number(newH) || 0));
    setSelectedHour(h);
    emitChange(selectedDate, h, selectedMinute);
  };

  const handleMinuteChange = (newM) => {
    const m = Math.max(0, Math.min(59, Number(newM) || 0));
    setSelectedMinute(m);
    emitChange(selectedDate, selectedHour, m);
  };

  const handleSetNow = () => {
    const cur = new Date();
    setSelectedDate(cur);
    setCurrentMonth(cur);
    setSelectedHour(cur.getHours());
    setSelectedMinute(cur.getMinutes());
    emitChange(cur, cur.getHours(), cur.getMinutes());
  };

  const handleApplyPresetMinutes = (addMins) => {
    const d = new Date(selectedDate || new Date());
    d.setHours(selectedHour, selectedMinute, 0, 0);
    d.setMinutes(d.getMinutes() + addMins);
    setSelectedDate(d);
    setCurrentMonth(d);
    setSelectedHour(d.getHours());
    setSelectedMinute(d.getMinutes());
    emitChange(d, d.getHours(), d.getMinutes());
  };

  // Calendar math
  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const startOffset = firstDay === 0 ? 6 : firstDay - 1;

  const prevMonthDays = new Date(year, month, 0).getDate();
  const daysArray = [];
  for (let i = startOffset; i > 0; i--) {
    daysArray.push({ day: prevMonthDays - i + 1, current: false, offset: -1 });
  }
  for (let i = 1; i <= daysInMonth; i++) {
    daysArray.push({ day: i, current: true, offset: 0 });
  }
  const remaining = 42 - daysArray.length;
  for (let i = 1; i <= remaining; i++) {
    daysArray.push({ day: i, current: false, offset: 1 });
  }

  const isToday = (d) => {
    const cur = new Date();
    return (
      d === cur.getDate() &&
      month === cur.getMonth() &&
      year === cur.getFullYear()
    );
  };

  const isSelected = (d) => {
    if (!selectedDate) return false;
    return (
      d === selectedDate.getDate() &&
      month === selectedDate.getMonth() &&
      year === selectedDate.getFullYear()
    );
  };

  const displayString = parsed
    ? `${String(parsed.getHours()).padStart(2, '0')}:${String(parsed.getMinutes()).padStart(2, '0')} - ${String(parsed.getDate()).padStart(2, '0')}/${String(parsed.getMonth() + 1).padStart(2, '0')}/${parsed.getFullYear()}`
    : placeholder;

  // All 60 minutes (00 -> 59)
  const minuteSteps = Array.from({ length: 60 }, (_, i) => i);

  return (
    <div ref={containerRef} className={cn('relative w-full select-none', className)}>
      {/* Trigger Button */}
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={cn(
          'w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border rounded-xl text-xs font-bold flex items-center justify-between cursor-pointer transition-all duration-200',
          isOpen
            ? 'border-emerald-500 ring-2 ring-emerald-500/20 bg-white dark:bg-slate-900 shadow-sm'
            : 'border-slate-200 dark:border-slate-800 hover:border-emerald-500/60',
          disabled && 'opacity-50 cursor-not-allowed bg-slate-100 dark:bg-slate-900'
        )}
      >
        <div className="flex items-center gap-2.5 truncate">
          <CalendarIcon size={15} className="text-[#2d5016] dark:text-emerald-400 shrink-0" />
          <span
            className={cn(
              'font-mono text-xs font-black truncate',
              parsed ? 'text-slate-800 dark:text-slate-100' : 'text-slate-400'
            )}
          >
            {displayString}
          </span>
        </div>

        <div className="flex items-center gap-1 shrink-0 text-slate-400">
          <Clock size={14} className="text-emerald-600 dark:text-emerald-400" />
        </div>
      </div>

      {/* Dropdown Portal */}
      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {isOpen && (
              <div
                id="custom-datetime-picker-portal"
                className="fixed z-[2147483640]"
                style={{
                  top: dropUp ? undefined : coords.top + 6,
                  bottom: dropUp ? coords.bottom + 6 : undefined,
                  left: coords.left,
                  width: coords.width,
                  maxWidth: '580px',
                }}
              >
                <m.div
                  initial={{ opacity: 0, y: dropUp ? 8 : -8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: dropUp ? 8 : -8, scale: 0.96 }}
                  transition={{ duration: 0.16, ease: 'easeOut' }}
                  className="bg-white dark:bg-[#121614] border border-[#8b6f47]/20 dark:border-white/10 rounded-3xl shadow-2xl p-4 select-none backdrop-blur-2xl flex flex-col md:flex-row gap-4"
                >
                  {/* LEFT COLUMN: CALENDAR */}
                  <div className="flex-1 space-y-2.5 min-w-[240px]">
                    {/* Month Header Navigation */}
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-2">
                      <button
                        type="button"
                        onClick={() =>
                          setCurrentMonth(new Date(year, month - 1, 1))
                        }
                        className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-slate-600 dark:text-slate-300 transition-colors"
                        title="Tháng trước"
                      >
                        <ChevronLeft size={16} />
                      </button>

                      <span className="text-xs font-black uppercase tracking-wider text-[#2d5016] dark:text-emerald-400 font-mono">
                        Tháng {month + 1}, {year}
                      </span>

                      <button
                        type="button"
                        onClick={() =>
                          setCurrentMonth(new Date(year, month + 1, 1))
                        }
                        className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-slate-600 dark:text-slate-300 transition-colors"
                        title="Tháng sau"
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>

                    {/* Weekday Headers */}
                    <div className="grid grid-cols-7 gap-1 text-center">
                      {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((w, idx) => (
                        <span
                          key={w}
                          className={cn(
                            'text-[10px] font-black uppercase py-0.5',
                            idx >= 5 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400'
                          )}
                        >
                          {w}
                        </span>
                      ))}
                    </div>

                    {/* Day Matrix */}
                    <div className="grid grid-cols-7 gap-1">
                      {daysArray.map((item, idx) => {
                        const dayIsCurrent = item.current;
                        const selected = dayIsCurrent && isSelected(item.day);
                        const today = dayIsCurrent && isToday(item.day);

                        return (
                          <button
                            key={idx}
                            type="button"
                            disabled={!dayIsCurrent}
                            onClick={() => handleSelectDay(item.day)}
                            className={cn(
                              'h-7 rounded-lg text-xs font-mono font-bold flex items-center justify-center transition-all',
                              !dayIsCurrent && 'text-slate-300 dark:text-slate-700 opacity-40 cursor-default',
                              dayIsCurrent && !selected && !today && 'hover:bg-black/5 dark:hover:bg-white/5 text-slate-700 dark:text-slate-200',
                              today && !selected && 'border border-emerald-500 text-emerald-600 dark:text-emerald-400 font-black',
                              selected && 'bg-[#2d5016] dark:bg-emerald-600 text-white font-black shadow-xs scale-105'
                            )}
                          >
                            {item.day}
                          </button>
                        );
                      })}
                    </div>

                    {/* Left Quick Jump */}
                    <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800/80">
                      <button
                        type="button"
                        onClick={() => {
                          const cur = new Date();
                          setSelectedDate(cur);
                          setCurrentMonth(cur);
                          emitChange(cur, selectedHour, selectedMinute);
                        }}
                        className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
                      >
                        Hôm nay
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const tmr = new Date();
                          tmr.setDate(tmr.getDate() + 1);
                          setSelectedDate(tmr);
                          setCurrentMonth(tmr);
                          emitChange(tmr, selectedHour, selectedMinute);
                        }}
                        className="text-[10px] font-bold text-slate-500 dark:text-slate-400 hover:underline"
                      >
                        Ngày mai
                      </button>
                    </div>
                  </div>

                  {/* VERTICAL DIVIDER */}
                  <div className="hidden md:block w-px bg-slate-200/80 dark:bg-slate-800/80 self-stretch my-1" />

                  {/* RIGHT COLUMN: TIME SELECTOR */}
                  <div className="flex-1 space-y-3 min-w-[230px] flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-2">
                        <span className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                          <Clock size={14} className="text-emerald-600 dark:text-emerald-400" />
                          Chọn Giờ Hẹn
                        </span>

                        <span className="text-xs font-mono font-black px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                          {String(selectedHour).padStart(2, '0')}:{String(selectedMinute).padStart(2, '0')}
                        </span>
                      </div>

                      {/* Hour & Minute Pickers */}
                      <div className="grid grid-cols-2 gap-2.5 mt-2.5">
                        {/* Hour Column */}
                        <div>
                          <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                            Giờ (0 - 23h)
                          </label>
                          <select
                            value={selectedHour}
                            onChange={(e) => handleHourChange(e.target.value)}
                            size={5}
                            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono font-bold text-slate-800 dark:text-slate-200 outline-none p-1 custom-scrollbar"
                          >
                            {Array.from({ length: 24 }, (_, i) => i).map((h) => (
                              <option
                                key={h}
                                value={h}
                                className="px-2 py-1 rounded-md my-0.5 cursor-pointer hover:bg-emerald-500/20 font-mono text-center"
                              >
                                {String(h).padStart(2, '0')} giờ
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Minute Column */}
                        <div>
                          <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                            Phút (0 - 59p)
                          </label>
                          <select
                            value={selectedMinute}
                            onChange={(e) => handleMinuteChange(e.target.value)}
                            size={5}
                            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono font-bold text-slate-800 dark:text-slate-200 outline-none p-1 custom-scrollbar"
                          >
                            {minuteSteps.map((m) => (
                              <option
                                key={m}
                                value={m}
                                className="px-2 py-1 rounded-md my-0.5 cursor-pointer hover:bg-emerald-500/20 font-mono text-center"
                              >
                                {String(m).padStart(2, '0')} phút
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Quick Stepper Buttons */}
                      <div className="flex items-center gap-1.5 flex-wrap mt-3">
                        <button
                          type="button"
                          onClick={handleSetNow}
                          className="px-2 py-1 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 text-[9.5px] font-black rounded-lg hover:bg-amber-100 transition-colors border border-amber-300/40 flex items-center gap-0.5"
                        >
                          <Zap size={10} /> Hiện tại
                        </button>
                        <button
                          type="button"
                          onClick={() => handleApplyPresetMinutes(15)}
                          className="px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[9.5px] font-bold rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                        >
                          +15p
                        </button>
                        <button
                          type="button"
                          onClick={() => handleApplyPresetMinutes(30)}
                          className="px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[9.5px] font-bold rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                        >
                          +30p
                        </button>
                        <button
                          type="button"
                          onClick={() => handleApplyPresetMinutes(60)}
                          className="px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[9.5px] font-bold rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                        >
                          +1h
                        </button>
                      </div>
                    </div>

                    {/* Confirmation Button */}
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex justify-end">
                      <button
                        type="button"
                        onClick={() => setIsOpen(false)}
                        className="w-full py-2 bg-[#2d5016] dark:bg-emerald-600 hover:bg-[#3d6b20] text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-md active:scale-95"
                      >
                        <Check size={14} strokeWidth={3} />
                        Xác Nhận & Đóng
                      </button>
                    </div>
                  </div>
                </m.div>
              </div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </div>
  );
}
