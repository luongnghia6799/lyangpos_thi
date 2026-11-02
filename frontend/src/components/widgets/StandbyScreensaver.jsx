import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { Palette, X, Timer, ChevronDown, Check, Moon } from 'lucide-react';
import { Lunar } from 'lunar-javascript';
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

const translateGanZhi = (gzStr) => {
    if (!gzStr || typeof gzStr !== 'string') return '';
    return gzStr.split('').map(ch => CAN_MAP[ch] || CHI_MAP[ch] || ch).join(' ');
};

// Rich Preset Color Themes for Standby Screensaver
export const SCREENSAVER_COLOR_THEMES = [
    { id: 'agri', name: 'Nông Nghiệp Xanh', color: '#22c55e', secondary: '#10b981' },
    { id: 'zen', name: 'Zen Mộc Nhiên', color: '#7D8B6E', secondary: '#DE8C5A' },
    { id: 'luxury', name: 'Espresso Hoàng Gia', color: '#d4a574', secondary: '#8B5A2B' },
    { id: 'red-dragon', name: 'Hồng Phát Đỏ', color: '#ef4444', secondary: '#f59e0b' },
    { id: 'cyber-neon', name: 'Cyberpunk Tím Neon', color: '#a855f7', secondary: '#06b6d4' },
    { id: 'ocean', name: 'Đại Dương Lam', color: '#38bdf8', secondary: '#3b82f6' },
    { id: 'gold-luxury', name: 'Hoàng Kim Cát Tường', color: '#eab308', secondary: '#ca8a04' }
];

// Idle Timeout Options in Seconds
const TIMEOUT_OPTIONS = [
    { label: 'Tắt tự động', value: 0 },
    { label: '1 phút', value: 60 },
    { label: '2 phút', value: 120 },
    { label: '3 phút', value: 180 },
    { label: '5 phút', value: 300 },
    { label: '10 phút', value: 600 },
    { label: '15 phút', value: 900 }
];

export default function StandbyScreensaver({
    isOpen,
    onClose,
    theme = 'zen',
    onThemeSelect
}) {
    const [currentTime, setCurrentTime] = useState(new Date());

    // Configurable Screensaver Theme Color
    const [activeTheme, setActiveTheme] = useState(() => {
        return localStorage.getItem('pos_screensaver_theme') || theme || 'agri';
    });

    // Configurable Idle Timeout
    const [activeTimeout, setActiveTimeout] = useState(() => {
        const saved = localStorage.getItem('pos_welcome_screensaver_timeout');
        return saved !== null ? parseInt(saved, 10) : 300;
    });
    const [showTimeoutMenu, setShowTimeoutMenu] = useState(false);

    useEffect(() => {
        const saved = localStorage.getItem('pos_screensaver_theme');
        if (saved) {
            setActiveTheme(saved);
        } else if (theme) {
            setActiveTheme(theme);
        }
    }, [theme, isOpen]);

    useEffect(() => {
        const saved = localStorage.getItem('pos_welcome_screensaver_timeout');
        if (saved !== null) {
            setActiveTimeout(parseInt(saved, 10));
        }
    }, [isOpen]);

    const handleThemeChange = (newTheme) => {
        setActiveTheme(newTheme);
        localStorage.setItem('pos_screensaver_theme', newTheme);
        if (onThemeSelect) onThemeSelect(newTheme);
    };

    const handleTimeoutSelect = (val) => {
        setActiveTimeout(val);
        localStorage.setItem('pos_welcome_screensaver_timeout', String(val));
        window.dispatchEvent(new CustomEvent('pos_screensaver_timeout_changed', { detail: val }));
        setShowTimeoutMenu(false);
    };

    const [burnInOffset, setBurnInOffset] = useState({ x: 0, y: 0 });
    const openTimestampRef = useRef(0);

    // Track open timestamp to prevent immediate close / opening flicker
    useEffect(() => {
        if (isOpen) {
            openTimestampRef.current = Date.now();
            setShowTimeoutMenu(false);
        }
    }, [isOpen]);

    // Live Clock (Second-based)
    useEffect(() => {
        if (!isOpen) return;
        const clockInterval = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(clockInterval);
    }, [isOpen]);

    // Anti-Burn-In Protection (slight pixel drift every 30 seconds)
    useEffect(() => {
        if (!isOpen) return;
        const driftInterval = setInterval(() => {
            const dx = Math.floor(Math.random() * 41) - 20;
            const dy = Math.floor(Math.random() * 31) - 15;
            setBurnInOffset({ x: dx, y: dy });
        }, 30000);
        return () => clearInterval(driftInterval);
    }, [isOpen]);

    const handleScreenClick = useCallback(() => {
        if (showTimeoutMenu) {
            setShowTimeoutMenu(false);
            return;
        }
        // Prevent accidental closing during opening transition
        if (Date.now() - openTimestampRef.current < 350) return;
        onClose();
    }, [showTimeoutMenu, onClose]);

    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e) => {
            // Grace period: ignore key events in first 350ms after opening
            if (Date.now() - openTimestampRef.current < 350) return;

            if (showTimeoutMenu && e.key === 'Escape') {
                e.preventDefault();
                e.stopPropagation();
                setShowTimeoutMenu(false);
                return;
            }

            if (e.key === 'F7' || e.keyCode === 118 || e.key === 'Escape') {
                e.preventDefault();
                e.stopPropagation();
                onClose();
                return;
            }
            // Any other key wakes up the screensaver
            onClose();
        };

        window.addEventListener('keydown', handleKeyDown, true);
        return () => {
            window.removeEventListener('keydown', handleKeyDown, true);
        };
    }, [isOpen, showTimeoutMenu, onClose]);

    // Lunar & Solar calculations
    const lunarData = useMemo(() => {
        try {
            const l = Lunar.fromDate(currentTime);
            return {
                day: l.getDay(),
                month: l.getMonth(),
                yearGanZhi: translateGanZhi(l.getYearInGanZhi()),
                monthGanZhi: translateGanZhi(l.getMonthInGanZhi()),
                dayGanZhi: translateGanZhi(l.getDayInGanZhi()),
                isLeap: l.getMonth() < 0
            };
        } catch (e) {
            return {
                day: currentTime.getDate(),
                month: currentTime.getMonth() + 1,
                yearGanZhi: "Bính Ngọ",
                monthGanZhi: "",
                dayGanZhi: "",
                isLeap: false
            };
        }
    }, [currentTime]);

    const formatFullDateVN = (date) => {
        const days = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
        const dayName = days[date.getDay()];
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${dayName}, ngày ${day} tháng ${month}, ${year}`;
    };

    const hours = String(currentTime.getHours()).padStart(2, '0');
    const minutes = String(currentTime.getMinutes()).padStart(2, '0');
    const seconds = String(currentTime.getSeconds()).padStart(2, '0');
    const isPm = currentTime.getHours() >= 12;

    // Theme Visual Styles Map - Powered by activeTheme
    const themeStyles = useMemo(() => {
        switch (activeTheme) {
            case 'zen':
                return {
                    primary: '#7D8B6E',
                    secondary: '#DE8C5A',
                    accent: '#E6A15C',
                    gradientText: 'from-[#7D8B6E] via-[#DE8C5A] to-[#E6A15C]',
                    glowBg: 'radial-gradient(circle at 50% 50%, rgba(125, 139, 110, 0.22) 0%, rgba(222, 140, 90, 0.15) 40%, transparent 70%)',
                    badgeBg: 'bg-[#7D8B6E]/15 border-[#7D8B6E]/30 text-[#A3B394]'
                };
            case 'luxury':
                return {
                    primary: '#d4a574',
                    secondary: '#8B5A2B',
                    accent: '#F3E5AB',
                    gradientText: 'from-[#d4a574] via-[#F3E5AB] to-[#8B5A2B]',
                    glowBg: 'radial-gradient(circle at 50% 50%, rgba(212, 165, 116, 0.25) 0%, rgba(139, 90, 43, 0.16) 40%, transparent 70%)',
                    badgeBg: 'bg-[#8B5A2B]/20 border-[#d4a574]/30 text-[#d4a574]'
                };
            case 'red-dragon':
                return {
                    primary: '#ef4444',
                    secondary: '#f59e0b',
                    accent: '#fca5a5',
                    gradientText: 'from-[#ef4444] via-[#f59e0b] to-[#f87171]',
                    glowBg: 'radial-gradient(circle at 50% 50%, rgba(239, 68, 68, 0.22) 0%, rgba(245, 158, 11, 0.15) 40%, transparent 70%)',
                    badgeBg: 'bg-rose-500/15 border-rose-500/30 text-rose-300'
                };
            case 'cyber-neon':
                return {
                    primary: '#a855f7',
                    secondary: '#06b6d4',
                    accent: '#f43f5e',
                    gradientText: 'from-purple-400 via-pink-400 to-cyan-300',
                    glowBg: 'radial-gradient(circle at 50% 50%, rgba(168, 85, 247, 0.25) 0%, rgba(6, 182, 212, 0.16) 40%, transparent 70%)',
                    badgeBg: 'bg-purple-500/15 border-purple-500/30 text-purple-300'
                };
            case 'ocean':
                return {
                    primary: '#38bdf8',
                    secondary: '#3b82f6',
                    accent: '#60a5fa',
                    gradientText: 'from-sky-400 via-blue-400 to-indigo-300',
                    glowBg: 'radial-gradient(circle at 50% 50%, rgba(56, 189, 248, 0.25) 0%, rgba(59, 130, 246, 0.16) 40%, transparent 70%)',
                    badgeBg: 'bg-sky-500/15 border-sky-500/30 text-sky-300'
                };
            case 'gold-luxury':
                return {
                    primary: '#eab308',
                    secondary: '#ca8a04',
                    accent: '#fef08a',
                    gradientText: 'from-amber-300 via-yellow-400 to-amber-500',
                    glowBg: 'radial-gradient(circle at 50% 50%, rgba(234, 179, 8, 0.25) 0%, rgba(202, 138, 4, 0.16) 40%, transparent 70%)',
                    badgeBg: 'bg-amber-500/15 border-amber-500/30 text-amber-300'
                };
            case 'agri':
            default:
                return {
                    primary: '#4ade80',
                    secondary: '#22c55e',
                    accent: '#facc15',
                    gradientText: 'from-emerald-400 via-teal-300 to-amber-300',
                    glowBg: 'radial-gradient(circle at 50% 50%, rgba(74, 222, 128, 0.22) 0%, rgba(20, 184, 166, 0.14) 40%, transparent 70%)',
                    badgeBg: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                };
        }
    }, [activeTheme]);

    const activeTimeoutLabel = useMemo(() => {
        const found = TIMEOUT_OPTIONS.find(o => o.value === activeTimeout);
        return found ? found.label : `${Math.round(activeTimeout / 60)} phút`;
    }, [activeTimeout]);

    return (
        <AnimatePresence>
            {isOpen && (
                <m.div
                    key="global-standby-screensaver"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{
                        opacity: 0,
                        scale: 1.04,
                        filter: 'blur(16px)',
                        transition: { duration: 0.45, ease: [0.32, 0, 0.67, 0] }
                    }}
                    transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                    onClick={handleScreenClick}
                    className="fixed inset-0 z-[100] w-screen h-[100dvh] flex flex-col justify-between items-center select-none overflow-hidden cursor-pointer"
                    style={{
                        backgroundColor: '#05070a',
                        color: '#f8fafc'
                    }}
                >
                    {/* Ambient Deep Radial Backdrops */}
                    <div
                        className="absolute inset-0 pointer-events-none transition-all duration-1000"
                        style={{ background: themeStyles.glowBg }}
                    />

                    {/* Subtle Geometric Dot Pattern */}
                    <div
                        className="absolute inset-0 opacity-[0.04] pointer-events-none"
                        style={{
                            backgroundImage: `radial-gradient(${themeStyles.primary} 1.5px, transparent 1.5px)`,
                            backgroundSize: '40px 40px'
                        }}
                    />

                    {/* Soft Animated Floating Breathing Orbs */}
                    <div
                        className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl opacity-20 pointer-events-none animate-pulse"
                        style={{ backgroundColor: themeStyles.primary }}
                    />
                    <div
                        className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full blur-3xl opacity-15 pointer-events-none animate-pulse"
                        style={{ backgroundColor: themeStyles.secondary, animationDelay: '2s' }}
                    />

                    {/* TOP FLOATING ISLAND: Minimal Theme & Idle Timeout Menu */}
                    <header className="w-full shrink-0 pt-6 sm:pt-8 px-4 flex justify-center z-30 pointer-events-auto">
                        <div
                            onClick={(e) => e.stopPropagation()}
                            className="px-4 py-2 rounded-full bg-white/[0.08] hover:bg-white/[0.12] border border-white/15 backdrop-blur-2xl shadow-2xl flex items-center gap-2.5 sm:gap-3 transition-all duration-300 cursor-default"
                        >
                            {/* Color Theme Selector */}
                            <div className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-white/70 pl-1">
                                <Palette size={14} className="text-white/80" />
                                <span className="hidden sm:inline">Chủ đề</span>
                            </div>
                            <div className="h-3.5 w-px bg-white/15" />
                            <div className="flex items-center gap-1.5 sm:gap-2">
                                {SCREENSAVER_COLOR_THEMES.map((themeOpt) => {
                                    const isSelected = activeTheme === themeOpt.id;
                                    return (
                                        <button
                                            key={themeOpt.id}
                                            type="button"
                                            onClick={() => handleThemeChange(themeOpt.id)}
                                            title={themeOpt.name}
                                            className={cn(
                                                "w-5 h-5 rounded-full transition-all duration-200 cursor-pointer relative flex items-center justify-center cursor-color-btn",
                                                isSelected
                                                    ? "shadow-md opacity-100 scale-110"
                                                    : "opacity-45 hover:opacity-85 hover:scale-105"
                                            )}
                                            style={{
                                                background: `linear-gradient(135deg, ${themeOpt.color} 0%, ${themeOpt.secondary} 100%)`
                                            }}
                                        >
                                            {isSelected && (
                                                <Check size={11} strokeWidth={3.2} className="text-white drop-shadow-md" />
                                            )}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Divider */}
                            <div className="h-3.5 w-px bg-white/15 ml-0.5" />

                            {/* Idle Timeout Selector Dropdown */}
                            <div className="relative">
                                <button
                                    type="button"
                                    onClick={() => setShowTimeoutMenu(prev => !prev)}
                                    className={cn(
                                        "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold transition-all cursor-pointer",
                                        activeTimeout > 0
                                            ? "bg-white/10 hover:bg-white/20 text-white border border-white/15"
                                            : "bg-white/[0.04] hover:bg-white/10 text-white/50 border border-white/10"
                                    )}
                                    title="Thời gian tự động vào màn hình chờ khi không hoạt động"
                                >
                                    <Timer size={13} className={activeTimeout > 0 ? "text-amber-400" : "text-white/40"} />
                                    <span>{activeTimeoutLabel}</span>
                                    <ChevronDown size={11} className={cn("transition-transform duration-200 text-white/60", showTimeoutMenu && "rotate-180")} />
                                </button>

                                <AnimatePresence>
                                    {showTimeoutMenu && (
                                        <m.div
                                            initial={{ opacity: 0, scale: 0.95, y: -6 }}
                                            animate={{ opacity: 1, scale: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.95, y: -6 }}
                                            transition={{ duration: 0.15 }}
                                            className="absolute top-full mt-2.5 left-1/2 -translate-x-1/2 min-w-[140px] p-1.5 rounded-2xl bg-[#0c1017]/95 border border-white/20 backdrop-blur-2xl shadow-[0_12px_40px_rgba(0,0,0,0.8)] z-50 flex flex-col gap-0.5"
                                        >
                                            <div className="px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-white/40 border-b border-white/10 mb-1">
                                                Tự động bật sau
                                            </div>
                                            {TIMEOUT_OPTIONS.map((opt) => {
                                                const isSelected = activeTimeout === opt.value;
                                                return (
                                                    <button
                                                        key={opt.value}
                                                        type="button"
                                                        onClick={() => handleTimeoutSelect(opt.value)}
                                                        className={cn(
                                                            "w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer text-left",
                                                            isSelected
                                                                ? "bg-white/20 text-white font-bold"
                                                                : "text-white/70 hover:bg-white/10 hover:text-white"
                                                        )}
                                                    >
                                                        <span>{opt.label}</span>
                                                        {isSelected && <Check size={12} className="text-emerald-400" />}
                                                    </button>
                                                );
                                            })}
                                        </m.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Divider */}
                            <div className="h-3.5 w-px bg-white/15" />

                            {/* Close Button */}
                            <button
                                type="button"
                                onClick={onClose}
                                title="Đóng màn hình chờ (ESC)"
                                className="w-6 h-6 rounded-full flex items-center justify-center text-white/60 hover:text-white hover:bg-white/15 transition-all cursor-pointer"
                            >
                                <X size={14} />
                            </button>
                        </div>
                    </header>

                    {/* CENTER CLOCK DISPLAY: Pure, Minimal & Atmospheric */}
                    <main
                        className="flex-1 w-full flex flex-col items-center justify-center relative z-20 px-4 transition-all duration-1000 pb-12 sm:pb-16"
                        style={{
                            transform: `translate(${burnInOffset.x}px, ${burnInOffset.y}px)`
                        }}
                    >
                        <div className="text-center flex flex-col items-center space-y-4 sm:space-y-6 max-w-4xl">
                            {/* Grand Digital Clock */}
                            <div className="relative flex items-baseline justify-center tracking-tighter select-none">
                                <span className={cn(
                                    "text-8xl sm:text-[11rem] md:text-[13rem] font-black leading-none bg-gradient-to-b bg-clip-text text-transparent filter drop-shadow-2xl font-mono",
                                    themeStyles.gradientText
                                )}>
                                    {hours}:{minutes}
                                </span>
                                <div className="flex flex-col ml-3 sm:ml-6 text-left">
                                    <span className="text-2xl sm:text-4xl md:text-5xl font-mono font-bold text-white/50 leading-none">
                                        :{seconds}
                                    </span>
                                    <span className="text-xs sm:text-sm font-black uppercase tracking-widest text-white/40 mt-2">
                                        {isPm ? 'PM' : 'AM'}
                                    </span>
                                </div>
                            </div>

                            {/* Full Date & Lunar Calendar */}
                            <div className="space-y-2 pt-2">
                                <p className="text-base sm:text-xl md:text-2xl font-bold text-white/90 tracking-wide">
                                    {formatFullDateVN(currentTime)}
                                </p>
                                <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                                    <span className={cn("px-4 py-1.5 rounded-full text-xs sm:text-sm font-bold border backdrop-blur-md inline-flex items-center gap-1.5", themeStyles.badgeBg)}>
                                        <Moon size={14} className="shrink-0 text-amber-300" />
                                        <span>Âm lịch: Ngày {String(lunarData.day).padStart(2, '0')}/{String(lunarData.month).padStart(2, '0')} Năm {lunarData.yearGanZhi}</span>
                                    </span>
                                    {lunarData.dayGanZhi && (
                                        <span className="px-3 py-1.5 rounded-full text-xs sm:text-sm font-bold bg-white/[0.06] border border-white/10 text-white/70">
                                            Ngày {lunarData.dayGanZhi}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </main>

                    {/* Bottom balance spacing */}
                    <div className="h-6 sm:h-8 shrink-0 pointer-events-none" />
                </m.div>
            )}
        </AnimatePresence>
    );
}
