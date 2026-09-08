import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { 
  Clock, Calendar as CalendarIcon, ChevronLeft, ChevronRight, 
  X, Sparkles, Moon, Sun, Compass, ChevronsLeft, ChevronsRight
} from 'lucide-react';
import { Lunar, Solar } from 'lunar-javascript';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';

// Vietnamese translations for GanZhi (Can Chi)
const CAN_MAP = {
  '甲': 'Giáp', '乙': 'Ất', '丙': 'Bính', '丁': 'Đinh', '戊': 'Mậu',
  '己': 'Kỷ', '庚': 'Canh', '辛': 'Tân', '壬': 'Nhâm', '癸': 'Quý'
};

const CHI_MAP = {
  '子': 'Tý', '丑': 'Sửu', '寅': 'Dần', '卯': 'Mão', '辰': 'Thìn', '巳': 'Tỵ',
  '午': 'Ngọ', '未': 'Mùi', '申': 'Thân', '酉': 'Dậu', '戌': 'Tuất', '亥': 'Hợi'
};

const SHENGXIAO_MAP = {
  '鼠': 'Chuột (Tý)', '牛': 'Trâu (Sửu)', '虎': 'Cọp (Dần)', '兔': 'Mèo (Mão)',
  '龙': 'Rồng (Thìn)', '蛇': 'Rắn (Tỵ)', '马': 'Ngựa (Ngọ)', '羊': 'Dê (Mùi)',
  '猴': 'Khỉ (Thân)', '鸡': 'Gà (Dậu)', '狗': 'Chó (Tuất)', '猪': 'Heo (Hợi)'
};

const JIEQI_MAP = {
  '立春': 'Lập Xuân', '雨水': 'Vũ Thủy', '惊蛰': 'Kinh Trập', '春分': 'Xuân Phân',
  '清明': 'Thanh Minh', '谷雨': 'Cốc Vũ', '立夏': 'Lập Hạ', '小满': 'Tiểu Mãn',
  '芒种': 'Mang Chủng', '夏至': 'Hạ Chí', '小暑': 'Tiểu Thử', '大暑': 'Đại Thử',
  '立秋': 'Lập Thu', '处暑': 'Xử Thử', '白露': 'Bạch Lộ', '秋分': 'Thu Phân',
  '寒露': 'Hàn Lộ', '霜降': 'Sương Giáng', '立冬': 'Lập Đông', '小雪': 'Tiểu Tuyết',
  '大雪': 'Đại Tuyết', '冬至': 'Đông Chí', '小寒': 'Tiểu Hàn', '大寒': 'Đại Hàn'
};

const LUNAR_HOLIDAYS = {
  '1-1': 'Tết Nguyên Đán (Mùng 1)',
  '1-2': 'Tết Nguyên Đán (Mùng 2)',
  '1-3': 'Tết Nguyên Đán (Mùng 3)',
  '1-15': 'Tết Nguyên Tiêu (Rằm T.Giêng)',
  '3-3': 'Tết Hàn Thực',
  '3-10': 'Giỗ Tổ Hùng Vương',
  '4-15': 'Lễ Phật Đản',
  '5-5': 'Tết Đoan Ngọ (Diệt sâu bọ)',
  '7-7': 'Lễ Thất Tịch',
  '7-15': 'Lễ Vu Lan & Xá tội vong nhân',
  '8-15': 'Tết Trung Thu',
  '9-9': 'Tết Trùng Cửu',
  '10-10': 'Tết Thường Tân',
  '10-15': 'Tết Hạ Nguyên',
  '12-23': 'Ông Táo Chầu Trời',
  '12-30': 'Đêm Giao Thừa (Tất Niên)',
};

const SOLAR_HOLIDAYS = {
  '1-1': 'Tết Dương Lịch',
  '14-2': 'Lễ Tình Nhân (Valentine)',
  '8-3': 'Quốc tế Phụ nữ',
  '30-4': 'Giải phóng Miền Nam',
  '1-5': 'Quốc tế Lao Động',
  '1-6': 'Quốc tế Thiếu Nhi',
  '2-9': 'Quốc khánh Việt Nam',
  '20-10': 'Phụ nữ Việt Nam',
  '20-11': 'Nhà giáo Việt Nam',
  '24-12': 'Lễ Giáng Sinh (Noel)',
};

function translateGanZhi(str) {
  if (!str) return '';
  return str.split('').map(c => CAN_MAP[c] || CHI_MAP[c] || c).join(' ');
}

function translateShengXiao(str) {
  if (!str) return '';
  return SHENGXIAO_MAP[str] || str;
}

function translateJieQi(str) {
  if (!str) return '';
  return JIEQI_MAP[str] || str;
}

// Calendar Sidepanel Drawer Component (Zero-white warm theme)
const CalendarModal = ({ isOpen, onClose, initialDate }) => {
  const [viewDate, setViewDate] = useState(() => new Date(initialDate || new Date()));
  const [selectedDate, setSelectedDate] = useState(() => new Date(initialDate || new Date()));
  const [liveTime, setLiveTime] = useState(new Date());

  useEffect(() => {
    if (!isOpen) return;
    const timer = setInterval(() => setLiveTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  const viewYear = viewDate.getFullYear();
  const viewMonth = viewDate.getMonth();

  const handlePrevMonth = () => setViewDate(new Date(viewYear, viewMonth - 1, 1));
  const handleNextMonth = () => setViewDate(new Date(viewYear, viewMonth + 1, 1));
  const handlePrevYear = () => setViewDate(new Date(viewYear - 1, viewMonth, 1));
  const handleNextYear = () => setViewDate(new Date(viewYear + 1, viewMonth, 1));
  const handleToday = () => {
    const now = new Date();
    setViewDate(now);
    setSelectedDate(now);
  };

  // Generate 42 days grid (6 weeks)
  const calendarGrid = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1);
    let dayOfWeek = firstDay.getDay();
    let offset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

    const startDate = new Date(viewYear, viewMonth, 1 - offset);
    const days = [];

    for (let i = 0; i < 42; i++) {
      const d = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate() + i);
      const isCurrentMonth = d.getMonth() === viewMonth;
      const lunar = Lunar.fromDate(d);
      const rawMonth = lunar?.getMonth ? lunar.getMonth() : (d.getMonth() + 1);
      const isLeap = rawMonth < 0;
      const lunarMonth = Math.abs(rawMonth);
      const lunarDay = lunar?.getDay ? lunar.getDay() : d.getDate();
      const isMung1 = lunarDay === 1;
      const isRam = lunarDay === 15;

      const lunarKey = `${lunarMonth}-${lunarDay}`;
      const solarKey = `${d.getDate()}-${d.getMonth() + 1}`;
      const holiday = LUNAR_HOLIDAYS[lunarKey] || SOLAR_HOLIDAYS[solarKey] || null;

      days.push({
        date: d,
        dayNumber: d.getDate(),
        isCurrentMonth,
        isToday: d.toDateString() === new Date().toDateString(),
        isSelected: d.toDateString() === selectedDate.toDateString(),
        isWeekend: d.getDay() === 0 || d.getDay() === 6,
        lunarDay,
        lunarMonth,
        isLeap,
        isMung1,
        isRam,
        holiday,
        lunarDisplay: isMung1 ? `${lunarDay}/${lunarMonth}` : `${lunarDay}`
      });
    }
    return days;
  }, [viewYear, viewMonth, selectedDate]);

  // Selected date detailed info
  const selectedDetails = useMemo(() => {
    const lunar = Lunar.fromDate(selectedDate);
    const rawMonth = lunar?.getMonth ? lunar.getMonth() : (selectedDate.getMonth() + 1);
    const isLeap = rawMonth < 0;
    const lunarMonth = Math.abs(rawMonth);
    const lunarDay = lunar?.getDay ? lunar.getDay() : selectedDate.getDate();
    const lunarYear = lunar?.getYear ? lunar.getYear() : selectedDate.getFullYear();

    const yearGanZhi = translateGanZhi(lunar?.getYearInGanZhi ? lunar.getYearInGanZhi() : '');
    const monthGanZhi = translateGanZhi(lunar?.getMonthInGanZhi ? lunar.getMonthInGanZhi() : '');
    const dayGanZhi = translateGanZhi(lunar?.getDayInGanZhi ? lunar.getDayInGanZhi() : '');
    const timeGanZhi = translateGanZhi(lunar?.getTimeInGanZhi ? lunar.getTimeInGanZhi() : '');
    const shengXiao = translateShengXiao(lunar?.getYearShengXiao ? lunar.getYearShengXiao() : '');
    const jieQi = translateJieQi(lunar?.getJieQi ? lunar.getJieQi() : '');

    const lunarKey = `${lunarMonth}-${lunarDay}`;
    const solarKey = `${selectedDate.getDate()}-${selectedDate.getMonth() + 1}`;
    const holiday = LUNAR_HOLIDAYS[lunarKey] || SOLAR_HOLIDAYS[solarKey] || null;

    const weekdayStr = selectedDate.toLocaleDateString('vi-VN', { weekday: 'long' });

    return {
      weekdayStr,
      solarStr: `${selectedDate.getDate().toString().padStart(2, '0')}/${(selectedDate.getMonth() + 1).toString().padStart(2, '0')}/${selectedDate.getFullYear()}`,
      solarDay: selectedDate.getDate(),
      solarMonth: selectedDate.getMonth() + 1,
      solarYear: selectedDate.getFullYear(),
      lunarDay,
      lunarMonth,
      lunarYear,
      isLeap,
      yearGanZhi,
      monthGanZhi,
      dayGanZhi,
      timeGanZhi,
      shengXiao,
      jieQi,
      holiday
    };
  }, [selectedDate]);

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[500000] flex justify-end font-sans">
          {/* Backdrop with Fade */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Sidepanel Drawer with Zero-white Warm Theme */}
          <motion.div
            initial={{ x: "100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 30, stiffness: 280 }}
            onClick={(e) => e.stopPropagation()}
            className="relative z-10 w-full max-w-[480px] sm:max-w-[510px] h-full bg-[#f4efe6] dark:bg-[#071510] border-l border-[#8b6f47]/30 dark:border-emerald-500/25 shadow-2xl flex flex-col justify-between text-slate-800 dark:text-slate-100 overflow-hidden"
          >
            {/* Header Bar */}
            <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-[#8b6f47]/20 dark:border-white/10 shrink-0 bg-[#ebe3d5] dark:bg-[#040e0a]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#8b6f47]/15 dark:bg-emerald-500/15 border border-[#8b6f47]/30 dark:border-emerald-500/30 text-[#8b6f47] dark:text-emerald-400 flex items-center justify-center shadow-inner shrink-0">
                  <CalendarIcon size={18} strokeWidth={2.5} />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-black uppercase tracking-tight text-[#2d5016] dark:text-emerald-400 flex items-center gap-1.5">
                    <span>Lịch Vạn Niên & Âm Lịch</span>
                    <span className="text-[9px] font-extrabold px-2 py-0.2 rounded-full bg-[#8b6f47]/15 dark:bg-emerald-500/20 text-[#8b6f47] dark:text-emerald-300 normal-case tracking-normal">
                      Việt Nam
                    </span>
                  </h3>
                  <p className="text-[10px] font-bold text-[#8b6f47]/80 dark:text-slate-400">
                    Tra cứu Dương lịch, Âm lịch, Can Chi & Tiết khí
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Live Clock Pill */}
                <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#e3d7c5] dark:bg-[#0a1f16] border border-[#8b6f47]/20 dark:border-emerald-500/20 text-[#2d5016] dark:text-emerald-400 text-[11px] font-black tabular-nums shadow-xs">
                  <Clock size={12} className="text-[#8b6f47] dark:text-emerald-400" />
                  <span>{liveTime.toLocaleTimeString('vi-VN')}</span>
                </div>

                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-xl bg-[#e3d7c5] hover:bg-[#d8cbb7] dark:bg-white/5 dark:hover:bg-white/10 border border-[#8b6f47]/20 dark:border-white/10 flex items-center justify-center text-slate-600 hover:text-rose-500 transition-all cursor-pointer active:scale-95"
                >
                  <X size={16} strokeWidth={2.5} />
                </button>
              </div>
            </div>

            {/* Sidepanel Body (Auto-fitted, responsive on all laptop screens) */}
            <div className="flex-1 p-3 sm:p-4 flex flex-col justify-between gap-2 overflow-y-auto custom-scrollbar min-h-0">
              {/* Unified Luxury Dual Hero Card */}
              <div className="bg-gradient-to-br from-[#ebe4d6] via-[#e5dcce] to-[#dfd3c3] dark:from-[#0a1f16] dark:via-[#071510] dark:to-[#040e0a] border border-[#8b6f47]/25 dark:border-emerald-500/30 rounded-2xl p-3 shadow-xs relative overflow-hidden space-y-2 shrink-0">
                {/* Watermark */}
                <div className="absolute -right-3 -bottom-3 text-[#8b6f47]/8 dark:text-emerald-400/5 pointer-events-none">
                  <Moon size={80} strokeWidth={1.5} />
                </div>

                {/* Top Section: Dual Date Highlights */}
                <div className="relative z-10 grid grid-cols-2 gap-2.5 items-stretch">
                  {/* Left: Dương Lịch Box */}
                  <div className="flex items-center gap-2.5 p-2 rounded-xl bg-[#f0e8db] dark:bg-[#06140e] border border-[#8b6f47]/20 dark:border-white/10 shadow-2xs">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#2d5016] to-[#1c330e] dark:from-emerald-600 dark:to-teal-700 text-white flex flex-col items-center justify-center shadow-xs shrink-0 px-0.5">
                      <span className="text-[6.5px] font-black uppercase tracking-tight opacity-90 leading-none">Tháng {selectedDetails.solarMonth}</span>
                      <span className="text-xl font-black leading-none mt-1">{selectedDetails.solarDay}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1 mb-0.5">
                        <Sun size={11} className="text-amber-600 shrink-0" />
                        <span className="text-[8.5px] font-black uppercase tracking-wider text-[#8b6f47] dark:text-[#d4a574]">
                          Dương Lịch
                        </span>
                      </div>
                      <div className="text-xs font-black text-[#2d5016] dark:text-white capitalize leading-tight">
                        {selectedDetails.weekdayStr}
                      </div>
                      <div className="text-[10px] font-bold text-[#8b6f47]/90 dark:text-slate-400 tabular-nums">
                        {selectedDetails.solarStr}
                      </div>
                    </div>
                  </div>

                  {/* Right: Âm Lịch Box */}
                  <div className="flex items-center gap-2.5 p-2 rounded-xl bg-[#f0e8db] dark:bg-[#06140e] border border-[#8b6f47]/20 dark:border-white/10 shadow-2xs">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#8b6f47] to-[#6e5433] dark:from-amber-600 dark:to-yellow-700 text-white flex flex-col items-center justify-center shadow-xs shrink-0 px-0.5">
                      <span className="text-[6.5px] font-black uppercase tracking-tight opacity-90 leading-none">
                        {selectedDetails.isLeap ? 'Nhuận' : 'Âm Lịch'}
                      </span>
                      <span className="text-xl font-black leading-none mt-1">{selectedDetails.lunarDay}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <div className="flex items-center gap-1">
                          <Moon size={11} className="text-[#8b6f47] dark:text-amber-400 shrink-0" />
                          <span className="text-[8.5px] font-black uppercase tracking-wider text-[#8b6f47] dark:text-amber-400">
                            Âm Lịch
                          </span>
                        </div>
                        {selectedDetails.lunarDay === 1 && (
                          <span className="text-[8px] font-black px-2 py-0.5 rounded-full bg-rose-500/12 dark:bg-rose-500/20 border border-rose-500/30 text-rose-700 dark:text-rose-300 leading-none shadow-2xs">
                            Mùng 1
                          </span>
                        )}
                        {selectedDetails.lunarDay === 15 && (
                          <span className="text-[8px] font-black px-2 py-0.5 rounded-full bg-amber-500/12 dark:bg-amber-500/20 border border-amber-500/30 text-[#8b6f47] dark:text-amber-300 leading-none shadow-2xs">
                            Rằm
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] font-black text-[#8b6f47] dark:text-amber-300 truncate leading-tight">
                        Tháng {selectedDetails.lunarMonth} năm {selectedDetails.yearGanZhi}
                      </div>
                      <div className="text-[9.5px] font-bold text-slate-600 dark:text-slate-400 truncate">
                        {selectedDetails.shengXiao}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Row: Can Chi & Tiết Khí Chips */}
                <div className="relative z-10 pt-1.5 border-t border-[#8b6f47]/20 dark:border-white/10 flex flex-wrap items-center justify-between gap-1.5">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="px-2 py-0.5 rounded-lg bg-[#dfd4c3] dark:bg-[#040e0a] border border-[#8b6f47]/20 dark:border-white/5 text-[10px] font-bold text-slate-800 dark:text-slate-300">
                      Ngày <b>{selectedDetails.dayGanZhi}</b>
                    </span>
                    <span className="px-2 py-0.5 rounded-lg bg-[#dfd4c3] dark:bg-[#040e0a] border border-[#8b6f47]/20 dark:border-white/5 text-[10px] font-bold text-slate-800 dark:text-slate-300">
                      Tháng <b>{selectedDetails.monthGanZhi}</b>
                    </span>
                    {selectedDetails.jieQi && (
                      <span className="px-2 py-0.5 rounded-lg bg-amber-600/10 border border-amber-600/20 text-[10px] font-bold text-[#8b6f47] dark:text-amber-300 flex items-center gap-1">
                        <Sun size={10} className="text-amber-600" />
                        <span>Tiết: <b>{selectedDetails.jieQi}</b></span>
                      </span>
                    )}
                  </div>

                  {selectedDetails.holiday && (
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-rose-700 via-rose-600 to-amber-600 dark:from-rose-800 dark:via-rose-700 dark:to-amber-700 text-white text-[10.5px] font-black tracking-tight shadow-xs border border-rose-300/40">
                      <Sparkles size={11} className="text-amber-200 shrink-0" />
                      <span className="leading-none">{selectedDetails.holiday}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Month Navigation & Controls */}
              <div className="flex items-center justify-between bg-[#ebe3d5] dark:bg-[#040e0a] border border-[#8b6f47]/20 dark:border-emerald-500/20 rounded-xl p-1 shadow-2xs shrink-0">
                <div className="flex items-center gap-1">
                  <button
                    onClick={handlePrevYear}
                    title="Năm trước"
                    className="w-7 h-7 rounded-lg bg-[#dfd5c4] hover:bg-[#d5c9b6] dark:bg-[#0f2e21] dark:hover:bg-[#143c2c] border border-[#8b6f47]/20 dark:border-emerald-500/30 flex items-center justify-center text-[#8b6f47] dark:text-emerald-300 transition-all cursor-pointer active:scale-95 shadow-2xs"
                  >
                    <ChevronsLeft size={13} />
                  </button>
                  <button
                    onClick={handlePrevMonth}
                    title="Tháng trước"
                    className="w-7 h-7 rounded-lg bg-[#dfd5c4] hover:bg-[#d5c9b6] dark:bg-[#0f2e21] dark:hover:bg-[#143c2c] border border-[#8b6f47]/20 dark:border-emerald-500/30 flex items-center justify-center text-[#8b6f47] dark:text-emerald-300 transition-all cursor-pointer active:scale-95 shadow-2xs"
                  >
                    <ChevronLeft size={13} />
                  </button>
                </div>

                {/* Month & Year Title */}
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#dfd5c4] dark:bg-white/[0.04] border border-[#8b6f47]/20 dark:border-white/5">
                  <CalendarIcon size={13} className="text-[#8b6f47] dark:text-emerald-400" />
                  <span className="text-xs font-black uppercase text-[#2d5016] dark:text-emerald-400 tracking-wider">
                    Tháng {viewMonth + 1} / {viewYear}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={handleToday}
                    className="px-2.5 py-1 rounded-lg bg-[#8b6f47] hover:bg-[#735b39] dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white text-[11px] font-black transition-all cursor-pointer active:scale-95 shadow-xs"
                  >
                    Hôm nay
                  </button>
                  <button
                    onClick={handleNextMonth}
                    title="Tháng sau"
                    className="w-7 h-7 rounded-lg bg-[#dfd5c4] hover:bg-[#d5c9b6] dark:bg-[#0f2e21] dark:hover:bg-[#143c2c] border border-[#8b6f47]/20 dark:border-emerald-500/30 flex items-center justify-center text-[#8b6f47] dark:text-emerald-300 transition-all cursor-pointer active:scale-95 shadow-2xs"
                  >
                    <ChevronRight size={13} />
                  </button>
                  <button
                    onClick={handleNextYear}
                    title="Năm sau"
                    className="w-7 h-7 rounded-lg bg-[#dfd5c4] hover:bg-[#d5c9b6] dark:bg-[#0f2e21] dark:hover:bg-[#143c2c] border border-[#8b6f47]/20 dark:border-emerald-500/30 flex items-center justify-center text-[#8b6f47] dark:text-emerald-300 transition-all cursor-pointer active:scale-95 shadow-2xs"
                  >
                    <ChevronsRight size={13} />
                  </button>
                </div>
              </div>

              {/* Luxury Calendar Grid Container (Fluid Responsive) */}
              <div className="bg-gradient-to-b from-[#ebe4d6] via-[#e5dcce] to-[#dfd3c3] dark:from-[#0a1f16] dark:via-[#071610] dark:to-[#040e0a] border border-[#8b6f47]/25 dark:border-emerald-500/25 rounded-2xl p-2.5 shadow-sm space-y-1.5 flex-1 min-h-0 flex flex-col justify-between">
                {/* Weekday Header Track */}
                <div className="grid grid-cols-7 gap-1.5 p-1 bg-[#ded3c2] dark:bg-white/[0.03] border border-[#8b6f47]/15 dark:border-white/5 rounded-xl shrink-0">
                  {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((day, idx) => (
                    <div 
                      key={day} 
                      className={cn(
                        "text-center py-0.5 text-[10px] sm:text-[10.5px] font-black uppercase tracking-wider",
                        idx >= 5 ? "text-rose-700 dark:text-rose-400" : "text-[#8b6f47] dark:text-[#d4a574]"
                      )}
                    >
                      {day}
                    </div>
                  ))}
                </div>

                {/* Grid 42 Luxury Cells (Auto-distribute 6 rows height) */}
                <div className="grid grid-cols-7 grid-rows-6 gap-1 sm:gap-1.5 flex-1 min-h-0 items-stretch">
                  {calendarGrid.map((item, idx) => {
                    const isCurrent = item.isCurrentMonth;
                    const isSelected = item.isSelected;
                    const isToday = item.isToday;
                    const isMung1 = item.isMung1;
                    const isRam = item.isRam;

                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setSelectedDate(item.date)}
                        className={cn(
                          "relative overflow-hidden flex flex-col justify-between p-1 sm:p-1.5 rounded-xl transition-all duration-150 cursor-pointer select-none border text-left box-border group h-full",
                          // 1. Current month normal days: warm coffee tone (zero white)
                          isCurrent && !isSelected && !isToday && "bg-[#f5ede0] dark:bg-[#0c241b] border-[#8b6f47]/20 dark:border-emerald-500/20 text-slate-800 dark:text-slate-100 shadow-[0_1px_3px_rgba(139,111,71,0.05)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.3)] hover:-translate-y-0.5 hover:shadow-sm hover:border-[#8b6f47]/50 dark:hover:border-emerald-400/40 hover:bg-[#ebe0ce]",
                          // 2. Non-current month days
                          !isCurrent && !isSelected && "bg-[#ded3c2]/40 dark:bg-black/20 border-dashed border-[#8b6f47]/12 dark:border-white/5 text-slate-500/50 dark:text-slate-600 opacity-50 hover:opacity-85",
                          // 3. Today (when not selected): Rich warm caramel background with glowing double ring
                          isToday && !isSelected && "bg-gradient-to-b from-[#eadac4] to-[#decab1] dark:from-[#0e3525] dark:to-[#082017] ring-2 ring-[#8b6f47] dark:ring-emerald-400 border border-[#8b6f47]/40 text-[#8b6f47] dark:text-emerald-300 shadow-xs",
                          // 4. Selected day
                          isSelected && "bg-gradient-to-br from-[#8b6f47] via-[#785e3a] to-[#5d4629] dark:from-emerald-600 dark:via-emerald-700 dark:to-teal-800 text-white border-[#8b6f47] dark:border-emerald-400 shadow-md shadow-[#8b6f47]/30 dark:shadow-emerald-600/35 scale-[1.02] z-10"
                        )}
                      >
                        {/* Top Row: Solar Day & Badges */}
                        <div className="w-full flex items-center justify-between leading-none">
                          <span className={cn(
                            "text-[11px] sm:text-xs font-black tabular-nums leading-none tracking-tight",
                            isSelected ? "text-white drop-shadow-2xs" : item.isWeekend ? "text-rose-700 dark:text-rose-400" : isCurrent ? "text-slate-800 dark:text-slate-100" : "text-slate-500/60 dark:text-slate-600"
                          )}>
                            {item.dayNumber}
                          </span>

                          <div className="flex items-center gap-1 shrink-0">
                            {isToday && (
                              <span 
                                title="Hôm nay"
                                className={cn(
                                  "w-1.5 h-1.5 rounded-full shrink-0 transition-transform",
                                  isSelected ? "bg-amber-300 shadow-2xs scale-110" : "bg-[#8b6f47] dark:bg-emerald-400 shadow-2xs"
                                )} 
                              />
                            )}
                            {item.holiday && !isToday && (
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shadow-2xs shrink-0" title={item.holiday} />
                            )}
                          </div>
                        </div>

                        {/* Bottom Row: Lunar Day Badges */}
                        <div className="w-full flex items-center justify-end leading-none mt-0.5">
                          <span className={cn(
                            "tabular-nums tracking-tight px-1.5 py-0.2 rounded-md leading-none transition-all",
                            // Selected
                            isSelected && "text-amber-200 bg-black/25 text-[8.5px] font-black border border-white/10",
                            // Mùng 1 & Rằm
                            !isSelected && (isMung1 || isRam) && "text-rose-700 dark:text-rose-300 bg-rose-500/10 dark:bg-rose-500/20 border border-rose-500/25 text-[8.5px] font-black shadow-2xs",
                            // Normal current month
                            !isSelected && !isMung1 && !isRam && isCurrent && "text-[#8b6f47]/80 dark:text-emerald-400/80 bg-[#8b6f47]/[0.06] dark:bg-emerald-500/10 text-[9px] font-bold",
                            // Normal non-current month
                            !isSelected && !isMung1 && !isRam && !isCurrent && "text-slate-500/50 dark:text-slate-600 text-[8.5px] font-bold"
                          )}>
                            {item.lunarDisplay}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Footer with Legend & Close Button */}
            <div className="flex items-center justify-between gap-3 px-4 sm:px-5 py-2.5 border-t border-[#8b6f47]/20 dark:border-white/10 shrink-0 bg-[#ebe3d5] dark:bg-[#040e0a]">
              <div className="flex items-center gap-3 text-[10.5px] font-bold text-slate-700 dark:text-slate-400 flex-wrap">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-[#8b6f47]" />
                  <span>Dưới: <b>Âm lịch</b></span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  <span><b>Mùng 1 & Rằm</b></span>
                </span>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="py-2 px-5 bg-gradient-to-r from-[#8b6f47] to-[#6e5433] dark:from-emerald-600 dark:to-teal-600 hover:opacity-95 text-white rounded-xl font-black text-xs uppercase tracking-wider transition-all shadow-md shadow-[#8b6f47]/20 dark:shadow-emerald-600/25 active:scale-98 cursor-pointer shrink-0"
              >
                Đóng Lịch
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};

// Main Clock Component
const HeavyClock = ({ variant = 'posnew', gpuDisabled = false, className = '' }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  useEffect(() => {
    const intervalTime = gpuDisabled ? 60000 : 1000;
    const timer = setInterval(() => setCurrentTime(new Date()), intervalTime);
    return () => clearInterval(timer);
  }, [gpuDisabled]);

  const handleOpenCalendar = useCallback((e) => {
    e.stopPropagation();
    setIsCalendarOpen(true);
  }, []);

  const handleCloseCalendar = useCallback(() => {
    setIsCalendarOpen(false);
  }, []);

  if (variant === 'purchase') {
    const lunarObj = Lunar.fromDate(currentTime);
    const rawMonth = lunarObj?.getMonth ? lunarObj.getMonth() : (currentTime.getMonth() + 1);
    const lunarMonth = Math.abs(rawMonth).toString().padStart(2, '0');
    const lunarDay = (lunarObj?.getDay ? lunarObj.getDay() : currentTime.getDate()).toString().padStart(2, '0');
    const weekday = currentTime.toLocaleDateString('vi-VN', { weekday: 'short' });
    const solarDate = currentTime.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
    const fullDateStr = `Dương lịch: ${currentTime.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })} | Âm lịch: Ngày ${lunarObj.getDay()} tháng ${lunarObj.getMonth()} năm ${lunarObj.getYearInGanZhi()} - Bấm để xem Lịch vạn niên`;

    const hours = currentTime.getHours().toString().padStart(2, '0');
    const minutes = currentTime.getMinutes().toString().padStart(2, '0');

    return (
      <>
        <div
          onClick={handleOpenCalendar}
          title={fullDateStr}
          className={cn(
            "group/clock relative overflow-hidden flex items-center justify-between gap-1.5 h-[26px]",
            "bg-[#8b6f47]/[0.06] hover:bg-[#8b6f47]/[0.15] dark:bg-white/[0.04] dark:hover:bg-white/[0.1]",
            "border border-[#8b6f47]/20 dark:border-white/10 hover:border-[#2d5016]/50 dark:hover:border-emerald-400/40",
            "rounded-lg px-2 backdrop-blur-md shadow-xs",
            "select-none cursor-pointer transition-all duration-300 shrink-0 box-border hover:scale-[1.02] active:scale-98",
            className
          )}
        >
          {/* Watermark Icon */}
          <div className="absolute -right-1 -bottom-1 text-[#2d5016]/10 dark:text-emerald-400/10 pointer-events-none transition-transform duration-300 group-hover/clock:scale-110">
            <Clock size={18} strokeWidth={2.3} />
          </div>

          {/* Left: Lịch Dương & Lịch Âm */}
          <div className="flex flex-col items-start justify-center leading-none min-w-0 relative z-10">
            <div className="flex items-center gap-0.5 text-[9.5px] font-black text-[#2d5016] dark:text-[#e8dfd5] tracking-tight tabular-nums">
              <span className="uppercase text-[8px] text-[#8b6f47] dark:text-[#d4a574] font-extrabold mr-0.5">{weekday}</span>
              <span>{solarDate}</span>
            </div>
            <div className="flex items-center gap-0.5 text-[6.5px] font-black tracking-wider uppercase mt-0.5">
              <span className="text-[#8b6f47] dark:text-[#d4a574]">ÂM</span>
              <span className="text-[#2d5016] dark:text-emerald-400 tabular-nums">
                {lunarDay}/{lunarMonth}
              </span>
            </div>
          </div>

          {/* Divider */}
          <div className="w-px h-3 bg-[#8b6f47]/25 dark:bg-white/15 shrink-0 mx-0.5 relative z-10" />

          {/* Right: Time */}
          <div className="flex items-baseline font-black text-[11.5px] text-[#2d5016] dark:text-emerald-400 tabular-nums tracking-tight leading-none drop-shadow-xs relative z-10">
            <span>{hours}</span>
            <span className="text-[#8b6f47] dark:text-[#d4a574] px-px">:</span>
            <span>{minutes}</span>
          </div>
        </div>

        <CalendarModal 
          isOpen={isCalendarOpen} 
          onClose={handleCloseCalendar} 
          initialDate={currentTime} 
        />
      </>
    );
  }

  if (variant === 'posnew') {
    const lunarObj = Lunar.fromDate(currentTime);
    const rawMonth = lunarObj?.getMonth ? lunarObj.getMonth() : (currentTime.getMonth() + 1);
    const lunarMonth = Math.abs(rawMonth).toString().padStart(2, '0');
    const lunarDay = (lunarObj?.getDay ? lunarObj.getDay() : currentTime.getDate()).toString().padStart(2, '0');

    return (
      <>
        <div 
          onClick={handleOpenCalendar}
          title="Bấm để xem lịch vạn niên & âm lịch chi tiết"
          className={cn(
            "flex items-center gap-2.5 bg-gradient-to-br from-amber-500/15 via-white/70 to-amber-200/5 dark:from-emerald-500/10 dark:via-slate-900/80 dark:to-amber-900/10 backdrop-blur-2xl rounded-2xl px-3 py-1.5 border border-[#8b6f47]/25 dark:border-white/10 hover:border-[#2d5016]/40 dark:hover:border-emerald-400/40 shadow-xs relative overflow-hidden group/clock transition-all cursor-pointer hover:scale-[1.02] active:scale-98",
            className
          )}
        >
          <div className="flex flex-col items-end leading-tight pr-2.5 border-r border-[#8b6f47]/20 dark:border-white/10">
            <div className="flex items-center gap-1">
              <span className="text-[9px] font-black text-[#2d5016] dark:text-emerald-400 uppercase tracking-wider">{currentTime.toLocaleDateString("vi-VN", { weekday: "short" })}</span>
              <span className="text-[10px] font-black text-[#8b6f47] dark:text-[#d4a574] tabular-nums">{currentTime.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" })}</span>
            </div>
            <span className="text-[7.5px] font-extrabold text-[#8b6f47] dark:text-emerald-400 tracking-tight">ÂL {lunarDay}/{lunarMonth}</span>
          </div>
          <div className="flex items-baseline font-black text-lg tracking-tight tabular-nums gap-0.5">
            <span className="text-[#2d5016] dark:text-white">{currentTime.getHours().toString().padStart(2, "0")}</span>
            <span className="text-[#8b6f47] dark:text-[#d4a574]">:</span>
            <span className="text-[#2d5016] dark:text-white">{currentTime.getMinutes().toString().padStart(2, "0")}</span>
          </div>
        </div>

        <CalendarModal 
          isOpen={isCalendarOpen} 
          onClose={handleCloseCalendar} 
          initialDate={currentTime} 
        />
      </>
    );
  }

  if (variant === 'pos') {
    return (
      <>
        <div 
          onClick={handleOpenCalendar}
          title="Bấm để xem lịch vạn niên & âm lịch"
          className={cn(
            "group/clock flex items-center gap-2.5 bg-[#8b6f47]/5 hover:bg-[#8b6f47]/10 dark:bg-slate-900/40 dark:hover:bg-slate-900/60 backdrop-blur-xl rounded-full px-3 py-1 border border-[#8b6f47]/20 dark:border-white/10 hover:border-[#2d5016]/40 dark:hover:border-emerald-400/40 shadow-xs select-none cursor-pointer transition-all hover:scale-[1.02] active:scale-98",
            className
          )}
        >
          <div className="flex flex-col items-end leading-none">
            <span className="text-[8.5px] font-black text-[#2d5016] dark:text-emerald-400 uppercase tracking-wider mb-0.5">
              {currentTime.toLocaleDateString("vi-VN", { weekday: "short" })}
            </span>
            <span className="text-[10px] font-black text-[#8b6f47] dark:text-[#d4a574] tabular-nums">
              {currentTime.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" })}
            </span>
          </div>

          <div className="w-px h-5 bg-[#8b6f47]/20 dark:bg-white/10" />

          <div className="flex items-baseline font-black text-lg tracking-tight tabular-nums gap-0.5">
            <span className="text-[#2d5016] dark:text-white">
              {currentTime.getHours().toString().padStart(2, "0")}
            </span>
            <span className="text-[#8b6f47] dark:text-[#d4a574] font-bold">:</span>
            <span className="text-[#2d5016] dark:text-white">
              {currentTime.getMinutes().toString().padStart(2, "0")}
            </span>
          </div>
        </div>

        <CalendarModal 
          isOpen={isCalendarOpen} 
          onClose={handleCloseCalendar} 
          initialDate={currentTime} 
        />
      </>
    );
  }

  return null;
};

export default React.memo(HeavyClock);
