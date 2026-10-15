import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { 
  Clock, Calendar as CalendarIcon, ChevronLeft, ChevronRight, 
  X, Sparkles, Moon, Sun, Compass, ChevronsLeft, ChevronsRight
} from 'lucide-react';
import { Lunar, Solar } from 'lunar-javascript';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';

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

// Color and Theme Helper utilities for Calendar Sidepanel
function hexToRgba(hex, alpha = 1) {
  if (!hex || typeof hex !== 'string') return `rgba(45, 80, 22, ${alpha})`;
  let clean = hex.replace('#', '');
  if (clean.length === 3) clean = clean.split('').map(c => c + c).join('');
  if (clean.length !== 6) return `rgba(45, 80, 22, ${alpha})`;
  const num = parseInt(clean, 16);
  return `rgba(${num >> 16}, ${(num >> 8) & 0xff}, ${num & 0xff}, ${alpha})`;
}

function adjustColor(hex, percent) {
  if (!hex || typeof hex !== 'string' || !hex.startsWith('#')) return hex;
  let clean = hex.replace('#', '');
  if (clean.length === 3) clean = clean.split('').map(c => c + c).join('');
  if (clean.length !== 6) return hex;
  const num = parseInt(clean, 16);
  let r = (num >> 16) + Math.round(255 * (percent / 100));
  let g = ((num >> 8) & 0x00FF) + Math.round(255 * (percent / 100));
  let b = (num & 0x0000FF) + Math.round(255 * (percent / 100));
  r = Math.min(255, Math.max(0, r));
  g = Math.min(255, Math.max(0, g));
  b = Math.min(255, Math.max(0, b));
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

function getCalendarTheme(config, isDark = false) {
  const hasCustomAccent = Boolean(config?.accentColor && config.accentColor !== 'default');
  const hasCustomBorder = Boolean(config?.borderColor && config.borderColor !== 'default');
  const hasCustomHeader = Boolean(config?.headerBg && config.headerBg !== 'default');

  // Base primary
  let primary = hasCustomAccent ? config.accentColor : (isDark ? '#10b981' : '#2d5016');
  let secondary = hasCustomBorder 
    ? config.borderColor 
    : (hasCustomAccent ? adjustColor(primary, 24) : (isDark ? '#d4a574' : '#8b6f47'));
  let headerBg = hasCustomHeader ? config.headerBg : null;

  const primaryDark = adjustColor(primary, -22);
  const primaryLight = adjustColor(primary, 26);
  const secondaryDark = adjustColor(secondary, -20);
  const secondaryLight = adjustColor(secondary, 22);

  // Surface background tints based on theme
  let drawerBg = isDark ? '#071510' : '#f4efe6';
  let headerSurface = isDark ? '#040e0a' : '#ebe3d5';
  let cardBg = isDark 
    ? 'linear-gradient(135deg, #0a1f16 0%, #071510 50%, #040e0a 100%)' 
    : 'linear-gradient(135deg, #ebe4d6 0%, #e5dcce 50%, #dfd3c3 100%)';
  let cellBg = isDark ? '#0c241b' : '#f5ede0';
  let navBg = isDark ? '#040e0a' : '#ebe3d5';
  let navBtnBg = isDark ? '#0f2e21' : '#dfd5c4';

  if (hasCustomAccent) {
    if (isDark) {
      drawerBg = adjustColor(primary, -88);
      headerSurface = adjustColor(primary, -92);
      navBg = adjustColor(primary, -92);
      navBtnBg = adjustColor(primary, -78);
      cellBg = adjustColor(primary, -84);
      cardBg = `linear-gradient(135deg, ${adjustColor(primary, -85)} 0%, ${adjustColor(primary, -90)} 50%, ${adjustColor(primary, -94)} 100%)`;
    } else {
      drawerBg = adjustColor(primary, 93);
      headerSurface = adjustColor(primary, 86);
      navBg = adjustColor(primary, 86);
      navBtnBg = adjustColor(primary, 76);
      cellBg = adjustColor(primary, 95);
      cardBg = `linear-gradient(135deg, ${adjustColor(primary, 88)} 0%, ${adjustColor(primary, 84)} 50%, ${adjustColor(primary, 80)} 100%)`;
    }
  }

  return {
    primary,
    primaryDark,
    primaryLight,
    secondary,
    secondaryDark,
    secondaryLight,
    headerBg,
    drawerBg,
    headerSurface,
    cardBg,
    cellBg,
    navBg,
    navBtnBg,
    hasCustomAccent
  };
}

// Calendar Sidepanel Drawer Component (Theme-driven reactive)
const CalendarModal = ({ isOpen, onClose, initialDate, cartColorConfig: propConfig }) => {
  const [viewDate, setViewDate] = useState(() => new Date(initialDate || new Date()));
  const [selectedDate, setSelectedDate] = useState(() => new Date(initialDate || new Date()));
  const [liveTime, setLiveTime] = useState(new Date());

  const [cartColorConfig, setCartColorConfig] = useState(() => {
    if (propConfig) return propConfig;
    try {
      return JSON.parse(localStorage.getItem('pos_cart_color_config') || '{}');
    } catch {
      return {};
    }
  });

  const [isDark, setIsDark] = useState(() => {
    if (typeof document === 'undefined') return false;
    return document.documentElement.classList.contains('dark') || localStorage.getItem('theme') === 'dark';
  });

  // Sync propConfig
  useEffect(() => {
    if (propConfig) setCartColorConfig(propConfig);
  }, [propConfig]);

  // Synchronize color config across tabs and broadcast events
  useEffect(() => {
    const handleSync = (e) => {
      if (e.data?.type === 'CART_COLOR_CONFIG_UPDATED' || (e.data?.type === 'UI_SETTING_UPDATED' && e.data?.key === 'pos_cart_color_config')) {
        try {
          const parsed = typeof e.data.value === 'string' ? JSON.parse(e.data.value) : (e.data.config || e.data.value);
          if (parsed) setCartColorConfig(parsed);
        } catch {}
      }
    };
    const handleStorage = (e) => {
      if (e.key === 'pos_cart_color_config') {
        try {
          setCartColorConfig(JSON.parse(e.newValue || '{}'));
        } catch {}
      }
    };
    window.addEventListener('storage', handleStorage);
    let chan;
    try {
      chan = new BroadcastChannel('pos_data_sync');
      chan.addEventListener('message', handleSync);
    } catch {}

    return () => {
      window.removeEventListener('storage', handleStorage);
      if (chan) chan.close();
    };
  }, []);

  // Monitor Dark mode
  useEffect(() => {
    if (!isOpen) return;
    const checkDark = () => {
      const dark = document.documentElement.classList.contains('dark') || localStorage.getItem('theme') === 'dark';
      setIsDark(dark);
    };
    checkDark();
    const observer = new MutationObserver(checkDark);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    window.addEventListener('storage', checkDark);
    return () => {
      observer.disconnect();
      window.removeEventListener('storage', checkDark);
    };
  }, [isOpen]);

  const theme = useMemo(() => getCalendarTheme(cartColorConfig, isDark), [cartColorConfig, isDark]);

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

          {/* Sidepanel Drawer with Dynamic Theme Adaptation */}
          <motion.div
            initial={{ x: "100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 30, stiffness: 280 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: theme.drawerBg,
              borderLeftColor: theme.hasCustomAccent ? hexToRgba(theme.primary, 0.35) : undefined
            }}
            className={cn(
              "relative z-10 w-full max-w-[480px] sm:max-w-[510px] h-full border-l shadow-2xl flex flex-col justify-between overflow-hidden transition-colors duration-200",
              !theme.hasCustomAccent && "bg-[#f4efe6] dark:bg-[#071510] border-[#8b6f47]/30 dark:border-emerald-500/25",
              isDark ? "text-slate-100" : "text-slate-800"
            )}
          >
            {/* Header Bar */}
            <div 
              style={{
                backgroundColor: theme.headerSurface,
                borderBottomColor: hexToRgba(theme.primary, 0.2)
              }}
              className={cn(
                "flex items-center justify-between px-4 sm:px-5 py-3 border-b shrink-0 transition-colors duration-200",
                !theme.hasCustomAccent && "bg-[#ebe3d5] dark:bg-[#040e0a] border-[#8b6f47]/20 dark:border-white/10"
              )}
            >
              <div className="flex items-center gap-2.5">
                <div 
                  style={{
                    backgroundColor: hexToRgba(theme.primary, 0.14),
                    borderColor: hexToRgba(theme.primary, 0.3),
                    color: theme.primary
                  }}
                  className="w-9 h-9 rounded-xl border flex items-center justify-center shadow-inner shrink-0"
                >
                  <CalendarIcon size={18} strokeWidth={2.5} />
                </div>
                <div>
                  <h3 
                    style={{ color: isDark && !theme.hasCustomAccent ? '#34d399' : theme.primary }}
                    className="text-xs sm:text-sm font-black uppercase tracking-tight flex items-center gap-1.5"
                  >
                    <span>Lịch Vạn Niên & Âm Lịch</span>
                    <span 
                      style={{
                        backgroundColor: hexToRgba(theme.primary, 0.14),
                        color: isDark && !theme.hasCustomAccent ? '#6ee7b7' : theme.primary,
                        borderColor: hexToRgba(theme.primary, 0.2)
                      }}
                      className="text-[9px] font-extrabold px-2 py-0.2 rounded-full border normal-case tracking-normal"
                    >
                      Việt Nam
                    </span>
                  </h3>
                  <p 
                    style={{ color: isDark ? 'rgba(255,255,255,0.6)' : hexToRgba(theme.secondary, 0.85) }}
                    className="text-[10px] font-bold"
                  >
                    Tra cứu Dương lịch, Âm lịch, Can Chi & Tiết khí
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Live Clock Pill */}
                <div 
                  style={{
                    backgroundColor: hexToRgba(theme.primary, 0.08),
                    borderColor: hexToRgba(theme.primary, 0.22),
                    color: isDark && !theme.hasCustomAccent ? '#34d399' : theme.primary
                  }}
                  className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-[11px] font-black tabular-nums shadow-xs"
                >
                  <Clock size={12} style={{ color: theme.primary }} />
                  <span>{liveTime.toLocaleTimeString('vi-VN')}</span>
                </div>

                <button
                  onClick={onClose}
                  style={{
                    borderColor: hexToRgba(theme.primary, 0.2)
                  }}
                  className={cn(
                    "w-8 h-8 rounded-xl border flex items-center justify-center transition-all cursor-pointer active:scale-95",
                    isDark ? "bg-white/5 hover:bg-white/10 text-slate-300 hover:text-rose-400" : "bg-black/5 hover:bg-black/10 text-slate-600 hover:text-rose-600"
                  )}
                >
                  <X size={16} strokeWidth={2.5} />
                </button>
              </div>
            </div>

            {/* Sidepanel Body */}
            <div className="flex-1 p-3 sm:p-4 flex flex-col justify-between gap-2 overflow-y-auto custom-scrollbar min-h-0">
              {/* Unified Luxury Dual Hero Card */}
              <div 
                style={{
                  background: theme.cardBg,
                  borderColor: hexToRgba(theme.primary, 0.24)
                }}
                className={cn(
                  "border rounded-2xl p-3 shadow-xs relative overflow-hidden space-y-2 shrink-0 transition-all duration-200",
                  !theme.hasCustomAccent && "border-[#8b6f47]/25 dark:border-emerald-500/30"
                )}
              >
                {/* Watermark */}
                <div 
                  style={{ color: hexToRgba(theme.primary, 0.08) }}
                  className="absolute -right-3 -bottom-3 pointer-events-none"
                >
                  <Moon size={80} strokeWidth={1.5} />
                </div>

                {/* Top Section: Dual Date Highlights */}
                <div className="relative z-10 grid grid-cols-2 gap-2.5 items-stretch">
                  {/* Left: Dương Lịch Box */}
                  <div 
                    style={{
                      backgroundColor: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.45)',
                      borderColor: hexToRgba(theme.primary, 0.18)
                    }}
                    className="flex items-center gap-2.5 p-2 rounded-xl border shadow-2xs backdrop-blur-xs"
                  >
                    <div 
                      style={{
                        background: `linear-gradient(135deg, ${theme.primary}, ${theme.primaryDark})`,
                        boxShadow: `0 3px 10px ${hexToRgba(theme.primary, 0.35)}`
                      }}
                      className="w-12 h-12 rounded-xl text-white flex flex-col items-center justify-center shrink-0 px-0.5 border border-white/20"
                    >
                      <span className="text-[6.5px] font-black uppercase tracking-tight opacity-90 leading-none">Tháng {selectedDetails.solarMonth}</span>
                      <span className="text-xl font-black leading-none mt-1">{selectedDetails.solarDay}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1 mb-0.5">
                        <Sun size={11} className="text-amber-500 shrink-0" />
                        <span 
                          style={{ color: isDark ? '#fbbf24' : theme.secondary }}
                          className="text-[8.5px] font-black uppercase tracking-wider"
                        >
                          Dương Lịch
                        </span>
                      </div>
                      <div 
                        style={{ color: isDark ? '#ffffff' : theme.primary }}
                        className="text-xs font-black capitalize leading-tight truncate"
                      >
                        {selectedDetails.weekdayStr}
                      </div>
                      <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 tabular-nums">
                        {selectedDetails.solarStr}
                      </div>
                    </div>
                  </div>

                  {/* Right: Âm Lịch Box */}
                  <div 
                    style={{
                      backgroundColor: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.45)',
                      borderColor: hexToRgba(theme.secondary, 0.2)
                    }}
                    className="flex items-center gap-2.5 p-2 rounded-xl border shadow-2xs backdrop-blur-xs"
                  >
                    <div 
                      style={{
                        background: `linear-gradient(135deg, ${theme.secondary}, ${theme.secondaryDark})`,
                        boxShadow: `0 3px 10px ${hexToRgba(theme.secondary, 0.35)}`
                      }}
                      className="w-12 h-12 rounded-xl text-white flex flex-col items-center justify-center shrink-0 px-0.5 border border-white/20"
                    >
                      <span className="text-[6.5px] font-black uppercase tracking-tight opacity-90 leading-none">
                        {selectedDetails.isLeap ? 'Nhuận' : 'Âm Lịch'}
                      </span>
                      <span className="text-xl font-black leading-none mt-1">{selectedDetails.lunarDay}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <div className="flex items-center gap-1">
                          <Moon size={11} style={{ color: theme.secondary }} className="shrink-0" />
                          <span 
                            style={{ color: isDark ? '#fcd34d' : theme.secondary }}
                            className="text-[8.5px] font-black uppercase tracking-wider"
                          >
                            Âm Lịch
                          </span>
                        </div>
                        {selectedDetails.lunarDay === 1 && (
                          <span className="text-[8px] font-black px-2 py-0.5 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-600 dark:text-rose-300 leading-none shadow-2xs">
                            Mùng 1
                          </span>
                        )}
                        {selectedDetails.lunarDay === 15 && (
                          <span 
                            style={{
                              backgroundColor: hexToRgba(theme.secondary, 0.15),
                              borderColor: hexToRgba(theme.secondary, 0.35),
                              color: isDark ? '#fde047' : theme.secondary
                            }}
                            className="text-[8px] font-black px-2 py-0.5 rounded-full border leading-none shadow-2xs"
                          >
                            Rằm
                          </span>
                        )}
                      </div>
                      <div 
                        style={{ color: isDark ? '#fde68a' : theme.secondaryDark }}
                        className="text-[11px] font-black truncate leading-tight"
                      >
                        Tháng {selectedDetails.lunarMonth} năm {selectedDetails.yearGanZhi}
                      </div>
                      <div className="text-[9.5px] font-bold text-slate-500 dark:text-slate-400 truncate">
                        {selectedDetails.shengXiao}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Row: Can Chi & Tiết Khí Chips */}
                <div 
                  style={{ borderTopColor: hexToRgba(theme.primary, 0.16) }}
                  className="relative z-10 pt-1.5 border-t flex flex-wrap items-center justify-between gap-1.5"
                >
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span 
                      style={{
                        backgroundColor: isDark ? 'rgba(0,0,0,0.35)' : 'rgba(255,255,255,0.55)',
                        borderColor: hexToRgba(theme.primary, 0.16)
                      }}
                      className="px-2 py-0.5 rounded-lg border text-[10px] font-bold text-slate-700 dark:text-slate-300"
                    >
                      Ngày <b>{selectedDetails.dayGanZhi}</b>
                    </span>
                    <span 
                      style={{
                        backgroundColor: isDark ? 'rgba(0,0,0,0.35)' : 'rgba(255,255,255,0.55)',
                        borderColor: hexToRgba(theme.primary, 0.16)
                      }}
                      className="px-2 py-0.5 rounded-lg border text-[10px] font-bold text-slate-700 dark:text-slate-300"
                    >
                      Tháng <b>{selectedDetails.monthGanZhi}</b>
                    </span>
                    {selectedDetails.jieQi && (
                      <span 
                        style={{
                          backgroundColor: hexToRgba(theme.secondary, 0.14),
                          borderColor: hexToRgba(theme.secondary, 0.28),
                          color: isDark ? '#fde047' : theme.secondary
                        }}
                        className="px-2 py-0.5 rounded-lg border text-[10px] font-bold flex items-center gap-1"
                      >
                        <Sun size={10} className="text-amber-500" />
                        <span>Tiết: <b>{selectedDetails.jieQi}</b></span>
                      </span>
                    )}
                  </div>

                  {selectedDetails.holiday && (
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-rose-600 via-rose-500 to-amber-500 text-white text-[10.5px] font-black tracking-tight shadow-xs border border-rose-300/40">
                      <Sparkles size={11} className="text-amber-200 shrink-0" />
                      <span className="leading-none">{selectedDetails.holiday}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Month Navigation & Controls */}
              <div 
                style={{
                  backgroundColor: theme.navBg,
                  borderColor: hexToRgba(theme.primary, 0.2)
                }}
                className="flex items-center justify-between border rounded-xl p-1 shadow-2xs shrink-0"
              >
                <div className="flex items-center gap-1">
                  <button
                    onClick={handlePrevYear}
                    title="Năm trước"
                    style={{
                      backgroundColor: theme.navBtnBg,
                      borderColor: hexToRgba(theme.primary, 0.18),
                      color: theme.primary
                    }}
                    className="w-7 h-7 rounded-lg border flex items-center justify-center transition-all cursor-pointer active:scale-95 shadow-2xs hover:brightness-105"
                  >
                    <ChevronsLeft size={13} />
                  </button>
                  <button
                    onClick={handlePrevMonth}
                    title="Tháng trước"
                    style={{
                      backgroundColor: theme.navBtnBg,
                      borderColor: hexToRgba(theme.primary, 0.18),
                      color: theme.primary
                    }}
                    className="w-7 h-7 rounded-lg border flex items-center justify-center transition-all cursor-pointer active:scale-95 shadow-2xs hover:brightness-105"
                  >
                    <ChevronLeft size={13} />
                  </button>
                </div>

                {/* Month & Year Title */}
                <div 
                  style={{
                    backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                    borderColor: hexToRgba(theme.primary, 0.16)
                  }}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-lg border"
                >
                  <CalendarIcon size={13} style={{ color: theme.primary }} />
                  <span 
                    style={{ color: isDark && !theme.hasCustomAccent ? '#34d399' : theme.primary }}
                    className="text-xs font-black uppercase tracking-wider"
                  >
                    Tháng {viewMonth + 1} / {viewYear}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={handleToday}
                    style={{
                      background: `linear-gradient(135deg, ${theme.primary}, ${theme.primaryDark})`,
                      boxShadow: `0 2px 8px ${hexToRgba(theme.primary, 0.3)}`
                    }}
                    className="px-2.5 py-1 rounded-lg text-white text-[11px] font-black transition-all cursor-pointer active:scale-95 hover:brightness-110"
                  >
                    Hôm nay
                  </button>
                  <button
                    onClick={handleNextMonth}
                    title="Tháng sau"
                    style={{
                      backgroundColor: theme.navBtnBg,
                      borderColor: hexToRgba(theme.primary, 0.18),
                      color: theme.primary
                    }}
                    className="w-7 h-7 rounded-lg border flex items-center justify-center transition-all cursor-pointer active:scale-95 shadow-2xs hover:brightness-105"
                  >
                    <ChevronRight size={13} />
                  </button>
                  <button
                    onClick={handleNextYear}
                    title="Năm sau"
                    style={{
                      backgroundColor: theme.navBtnBg,
                      borderColor: hexToRgba(theme.primary, 0.18),
                      color: theme.primary
                    }}
                    className="w-7 h-7 rounded-lg border flex items-center justify-center transition-all cursor-pointer active:scale-95 shadow-2xs hover:brightness-105"
                  >
                    <ChevronsRight size={13} />
                  </button>
                </div>
              </div>

              {/* Luxury Calendar Grid Container */}
              <div 
                style={{
                  background: theme.cardBg,
                  borderColor: hexToRgba(theme.primary, 0.22)
                }}
                className="border rounded-2xl p-2.5 shadow-sm space-y-1.5 flex-1 min-h-0 flex flex-col justify-between"
              >
                {/* Weekday Header Track */}
                <div 
                  style={{
                    backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.04)',
                    borderColor: hexToRgba(theme.primary, 0.12)
                  }}
                  className="grid grid-cols-7 gap-1.5 p-1 border rounded-xl shrink-0"
                >
                  {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((day, idx) => (
                    <div 
                      key={day} 
                      style={{
                        color: idx >= 5 ? undefined : (isDark ? '#e2e8f0' : theme.primary)
                      }}
                      className={cn(
                        "text-center py-0.5 text-[10px] sm:text-[10.5px] font-black uppercase tracking-wider",
                        idx >= 5 && "text-rose-600 dark:text-rose-400"
                      )}
                    >
                      {day}
                    </div>
                  ))}
                </div>

                {/* Grid 42 Cells */}
                <div className="grid grid-cols-7 grid-rows-6 gap-1 sm:gap-1.5 flex-1 min-h-0 items-stretch">
                  {calendarGrid.map((item, idx) => {
                    const isCurrent = item.isCurrentMonth;
                    const isSelected = item.isSelected;
                    const isToday = item.isToday;
                    const isMung1 = item.isMung1;
                    const isRam = item.isRam;

                    let cellStyle = {};
                    if (isSelected) {
                      cellStyle = {
                        background: `linear-gradient(135deg, ${theme.primary}, ${theme.primaryDark})`,
                        borderColor: theme.primaryLight,
                        boxShadow: `0 4px 14px ${hexToRgba(theme.primary, 0.4)}`
                      };
                    } else if (isToday) {
                      cellStyle = {
                        background: isDark ? hexToRgba(theme.primary, 0.18) : hexToRgba(theme.primary, 0.12),
                        borderColor: theme.primary,
                        color: isDark ? '#ffffff' : theme.primary
                      };
                    } else if (isCurrent) {
                      cellStyle = {
                        backgroundColor: theme.cellBg,
                        borderColor: hexToRgba(theme.primary, 0.14)
                      };
                    } else {
                      cellStyle = {
                        backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.03)',
                        borderColor: hexToRgba(theme.primary, 0.08)
                      };
                    }

                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setSelectedDate(item.date)}
                        style={cellStyle}
                        className={cn(
                          "relative overflow-hidden flex flex-col justify-between p-1 sm:p-1.5 rounded-xl transition-all duration-150 cursor-pointer select-none border text-left box-border group h-full",
                          isCurrent && !isSelected && !isToday && "text-slate-800 dark:text-slate-100 hover:-translate-y-0.5 hover:shadow-sm",
                          !isCurrent && !isSelected && "border-dashed text-slate-400/50 dark:text-slate-600 opacity-50 hover:opacity-85",
                          isToday && !isSelected && "ring-2 shadow-xs",
                          isSelected && "text-white scale-[1.02] z-10"
                        )}
                      >
                        {/* Top Row: Solar Day & Badges */}
                        <div className="w-full flex items-center justify-between leading-none">
                          <span className={cn(
                            "text-[11px] sm:text-xs font-black tabular-nums leading-none tracking-tight",
                            isSelected ? "text-white drop-shadow-2xs" : item.isWeekend ? "text-rose-600 dark:text-rose-400" : isCurrent ? "text-slate-800 dark:text-slate-100" : "text-slate-400 dark:text-slate-600"
                          )}>
                            {item.dayNumber}
                          </span>

                          <div className="flex items-center gap-1 shrink-0">
                            {isToday && (
                              <span 
                                title="Hôm nay"
                                style={{
                                  backgroundColor: isSelected ? '#fde047' : theme.primary
                                }}
                                className="w-1.5 h-1.5 rounded-full shrink-0 shadow-2xs" 
                              />
                            )}
                            {item.holiday && !isToday && (
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shadow-2xs shrink-0" title={item.holiday} />
                            )}
                          </div>
                        </div>

                        {/* Bottom Row: Lunar Day Badges */}
                        <div className="w-full flex items-center justify-end leading-none mt-0.5">
                          <span 
                            style={
                              isSelected ? {
                                color: '#fef08a',
                                backgroundColor: 'rgba(0,0,0,0.25)',
                                borderColor: 'rgba(255,255,255,0.15)'
                              } : (isMung1 || isRam) ? {
                                color: '#e11d48',
                                backgroundColor: 'rgba(244,63,94,0.14)',
                                borderColor: 'rgba(244,63,94,0.3)'
                              } : isCurrent ? {
                                color: isDark ? hexToRgba(theme.primaryLight, 0.95) : theme.primary,
                                backgroundColor: hexToRgba(theme.primary, 0.08)
                              } : {
                                color: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)'
                              }
                            }
                            className={cn(
                              "tabular-nums tracking-tight px-1.5 py-0.2 rounded-md leading-none transition-all",
                              isSelected && "text-[8.5px] font-black border",
                              !isSelected && (isMung1 || isRam) && "text-[8.5px] font-black border shadow-2xs",
                              !isSelected && !isMung1 && !isRam && isCurrent && "text-[9px] font-bold",
                              !isSelected && !isMung1 && !isRam && !isCurrent && "text-[8.5px] font-bold"
                            )}
                          >
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
            <div 
              style={{
                backgroundColor: theme.headerSurface,
                borderTopColor: hexToRgba(theme.primary, 0.2)
              }}
              className={cn(
                "flex items-center justify-between gap-3 px-4 sm:px-5 py-2.5 border-t shrink-0 transition-colors duration-200",
                !theme.hasCustomAccent && "bg-[#ebe3d5] dark:bg-[#040e0a] border-[#8b6f47]/20 dark:border-white/10"
              )}
            >
              <div className="flex items-center gap-3 text-[10.5px] font-bold text-slate-700 dark:text-slate-400 flex-wrap">
                <span className="flex items-center gap-1">
                  <span 
                    style={{ backgroundColor: theme.primary }}
                    className="w-2 h-2 rounded-full" 
                  />
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
                style={{
                  background: `linear-gradient(135deg, ${theme.primary}, ${theme.primaryDark})`,
                  boxShadow: `0 4px 14px ${hexToRgba(theme.primary, 0.3)}`
                }}
                className="py-2 px-5 hover:opacity-95 text-white rounded-xl font-black text-xs uppercase tracking-wider transition-all active:scale-98 cursor-pointer shrink-0"
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
  const [cartColorConfig, setCartColorConfig] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('pos_cart_color_config') || '{}');
    } catch {
      return {};
    }
  });

  useEffect(() => {
    const handleSync = (e) => {
      if (e.data?.type === 'CART_COLOR_CONFIG_UPDATED' || (e.data?.type === 'UI_SETTING_UPDATED' && e.data?.key === 'pos_cart_color_config')) {
        try {
          const parsed = typeof e.data.value === 'string' ? JSON.parse(e.data.value) : (e.data.config || e.data.value);
          if (parsed) setCartColorConfig(parsed);
        } catch {}
      }
    };
    const handleStorage = (e) => {
      if (e.key === 'pos_cart_color_config') {
        try {
          setCartColorConfig(JSON.parse(e.newValue || '{}'));
        } catch {}
      }
    };
    window.addEventListener('storage', handleStorage);
    let chan;
    try {
      chan = new BroadcastChannel('pos_data_sync');
      chan.addEventListener('message', handleSync);
    } catch {}

    return () => {
      window.removeEventListener('storage', handleStorage);
      if (chan) chan.close();
    };
  }, []);

  const hasCustomAccent = cartColorConfig?.accentColor && cartColorConfig.accentColor !== 'default';
  const customAccent = hasCustomAccent ? cartColorConfig.accentColor : undefined;

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
          style={hasCustomAccent ? {
            background: `linear-gradient(to right, ${customAccent}, ${customAccent}dd)`,
            borderColor: `${customAccent}80`,
            boxShadow: `0 2px 10px ${customAccent}35`
          } : undefined}
          className={cn(
            "group/clock relative overflow-hidden flex items-center justify-between gap-1.5 h-[26px]",
            "bg-gradient-to-r from-[#2d5016] via-[#38631e] to-[#2d5016] dark:from-[#0b261b] dark:via-[#113828] dark:to-[#0b261b]",
            "hover:brightness-110 active:scale-98",
            "border border-[#2d5016]/50 dark:border-emerald-500/40",
            "rounded-lg px-2.5 shadow-sm shadow-[#2d5016]/20",
            "select-none cursor-pointer transition-all duration-300 shrink-0 box-border hover:scale-[1.02]",
            className
          )}
        >
          {/* Watermark Icon */}
          <div className="absolute -right-1 -bottom-1 text-white/10 dark:text-emerald-400/10 pointer-events-none transition-transform duration-300 group-hover/clock:scale-110">
            <Clock size={18} strokeWidth={2.3} />
          </div>

          {/* Left: Lịch Dương & Lịch Âm */}
          <div className="flex flex-col items-start justify-center leading-none min-w-0 relative z-10">
            <div className="flex items-center gap-0.5 text-[9.5px] font-black text-white tracking-tight tabular-nums">
              <span className="uppercase text-[8px] text-amber-300 dark:text-amber-400 font-extrabold mr-0.5">{weekday}</span>
              <span>{solarDate}</span>
            </div>
            <div className="flex items-center gap-0.5 text-[6.5px] font-black tracking-wider uppercase mt-0.5">
              <span className="text-emerald-200/90 dark:text-emerald-300">ÂM</span>
              <span className="text-amber-200 dark:text-amber-300 tabular-nums font-black">
                {lunarDay}/{lunarMonth}
              </span>
            </div>
          </div>

          {/* Divider */}
          <div className="w-px h-3.5 bg-white/25 dark:bg-white/20 shrink-0 mx-0.5 relative z-10" />

          {/* Right: Time */}
          <div className="flex items-baseline font-black text-[12px] text-white dark:text-emerald-200 tabular-nums tracking-tight leading-none drop-shadow-xs relative z-10">
            <span>{hours}</span>
            <span className="text-amber-300 dark:text-amber-400 px-px font-black">:</span>
            <span>{minutes}</span>
          </div>
        </div>

        <CalendarModal 
          isOpen={isCalendarOpen} 
          onClose={handleCloseCalendar} 
          initialDate={currentTime} 
          cartColorConfig={cartColorConfig} 
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
          cartColorConfig={cartColorConfig} 
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
          cartColorConfig={cartColorConfig} 
        />
      </>
    );
  }

  return null;
};

export default React.memo(HeavyClock);
