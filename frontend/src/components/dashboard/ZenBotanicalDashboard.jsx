import React, { useState, useMemo, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lunar } from 'lunar-javascript';
import { m, AnimatePresence } from 'framer-motion';
import { Bar } from 'react-chartjs-2';
import {
    Leaf,
    Sun,
    Calendar,
    CheckCircle2,
    Circle,
    Star,
    ChevronLeft,
    ChevronRight,
    TrendingUp,
    TrendingDown,
    ShoppingCart,
    Package,
    Users,
    Wallet,
    AlertCircle,
    Clock,
    RefreshCw,
    Sparkles,
    ArrowRight,
    MapPin,
    SlidersHorizontal,
    Sprout,
    Check
} from 'lucide-react';
import { formatCurrency, formatNumber, cn } from '../../lib/utils';

// Botanical Landscape SVG Banner
const ZenLandscapeBanner = memo(({ weather, currentTime, shopName, onToggleZen }) => {
    return (
        <div className="relative w-full rounded-[28px] overflow-hidden bg-gradient-to-b from-[#F7F2E7] via-[#EDE4D2] to-[#E5DAC6] dark:from-[#242A21] dark:via-[#1D221A] dark:to-[#161B14] border border-[#E4DAC7] dark:border-[#333C2F] shadow-[0_8px_30px_rgb(125,139,110,0.08)]">
            {/* Scenic Vector Landscape matching user photo */}
            <div className="relative h-48 sm:h-56 md:h-64 w-full overflow-hidden select-none">
                <svg
                    viewBox="0 0 1000 360"
                    preserveAspectRatio="xMidYMid slice"
                    className="absolute inset-0 w-full h-full pointer-events-none"
                >
                    <defs>
                        {/* Sun Gradient */}
                        <radialGradient id="zenSunGlow" cx="50%" cy="50%" r="50%">
                            <stop offset="0%" stopColor="#E59868" stopOpacity="1" />
                            <stop offset="60%" stopColor="#DE8C5A" stopOpacity="0.9" />
                            <stop offset="100%" stopColor="#D47B45" stopOpacity="0" />
                        </radialGradient>

                        {/* Mountain Layers Gradients */}
                        <linearGradient id="zenDistantMtn" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#C9D6BC" stopOpacity="0.75" />
                            <stop offset="100%" stopColor="#B3C2A3" stopOpacity="0.9" />
                        </linearGradient>
                        <linearGradient id="zenMidMtn" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#9FB38F" stopOpacity="0.9" />
                            <stop offset="100%" stopColor="#879C75" stopOpacity="0.95" />
                        </linearGradient>
                        <linearGradient id="zenFrontMtn" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#788E67" stopOpacity="0.95" />
                            <stop offset="100%" stopColor="#5D734C" stopOpacity="1" />
                        </linearGradient>
                        <linearGradient id="zenForegroundHill" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#6C835A" />
                            <stop offset="100%" stopColor="#516740" />
                        </linearGradient>

                        {/* Plant leaves gradient */}
                        <linearGradient id="zenLeafGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#4D6543" />
                            <stop offset="100%" stopColor="#3B5033" />
                        </linearGradient>
                    </defs>

                    {/* Sky Background Tint */}
                    <rect width="1000" height="360" fill="#FAF6EE" className="dark:fill-[#20261D]" />

                    {/* Terracotta Morning Sun */}
                    <circle cx="680" cy="115" r="44" fill="#DE8C5A" className="opacity-95" />
                    <circle cx="680" cy="115" r="58" fill="url(#zenSunGlow)" className="opacity-40 animate-pulse" />

                    {/* Soft Watercolor Clouds */}
                    <path
                        d="M380,85 Q420,70 470,85 Q510,75 550,88 Q565,100 540,105 Q450,110 380,95 Z"
                        fill="#FFFFFF"
                        opacity="0.55"
                    />
                    <path
                        d="M150,105 Q190,95 240,105 Q270,98 300,108 Q290,120 230,120 Q160,118 150,105 Z"
                        fill="#FFFFFF"
                        opacity="0.4"
                    />

                    {/* Distant Mountain Ridge */}
                    <path
                        d="M0,230 Q160,150 320,195 T640,165 T1000,190 L1000,360 L0,360 Z"
                        fill="url(#zenDistantMtn)"
                        className="dark:opacity-40"
                    />

                    {/* Mid Mountain Ridge */}
                    <path
                        d="M0,255 Q200,180 430,225 T800,190 T1000,245 L1000,360 L0,360 Z"
                        fill="url(#zenMidMtn)"
                        className="dark:opacity-60"
                    />

                    {/* Foreground Rolling Hills */}
                    <path
                        d="M0,285 Q260,220 520,270 T1000,240 L1000,360 L0,360 Z"
                        fill="url(#zenFrontMtn)"
                    />
                    <path
                        d="M0,320 Q350,265 720,315 T1000,295 L1000,360 L0,360 Z"
                        fill="url(#zenForegroundHill)"
                    />

                    {/* Botanical Plant Stem & Leaves on Right side (matching image) */}
                    <g transform="translate(810, 80) scale(1.15)">
                        {/* Main Stem */}
                        <path d="M45,240 Q40,160 52,90 Q58,40 60,10" stroke="#3D5235" strokeWidth="4.5" strokeLinecap="round" fill="none" />
                        
                        {/* Leaf pairs */}
                        {/* Top leaf */}
                        <path d="M60,10 Q66,-10 60,-22 Q54,-10 60,10" fill="url(#zenLeafGrad)" />
                        
                        {/* Left Leaves */}
                        <path d="M57,45 C30,35 15,48 5,65 C20,70 45,62 56,52" fill="url(#zenLeafGrad)" />
                        <path d="M52,95 C25,82 10,100 -5,120 C12,126 38,115 50,102" fill="url(#zenLeafGrad)" />
                        <path d="M48,150 C18,138 5,160 -12,185 C8,190 35,175 46,158" fill="url(#zenLeafGrad)" />
                        
                        {/* Right Leaves */}
                        <path d="M59,30 C85,20 100,32 110,48 C95,54 72,48 60,36" fill="url(#zenLeafGrad)" />
                        <path d="M55,75 C85,62 105,78 118,98 C100,104 75,95 56,82" fill="url(#zenLeafGrad)" />
                        <path d="M51,125 C82,112 104,130 116,152 C98,158 72,146 51,133" fill="url(#zenLeafGrad)" />
                        <path d="M47,180 C80,168 98,190 108,212 C90,218 66,204 46,188" fill="url(#zenLeafGrad)" />
                    </g>
                </svg>

                {/* Overlay Greeting & Status */}
                <div className="absolute inset-0 p-5 sm:p-7 md:p-8 flex flex-col justify-between z-10">
                    <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/70 dark:bg-black/40 backdrop-blur-md border border-[#7D8B6E]/30 text-[#4D603E] dark:text-[#C5D4B6] text-[10px] font-black uppercase tracking-widest shadow-xs">
                                <Leaf size={12} className="text-[#6D835A]" />
                                <span>Zen Botanical POS</span>
                                <span className="opacity-40">•</span>
                                <span>{shopName || 'Lyang Nghĩa'}</span>
                            </div>
                            <h1 className="text-2xl sm:text-3xl md:text-4xl font-serif font-bold text-[#2E2820] dark:text-[#F3EFE6] tracking-tight">
                                Bình yên & Năng suất
                            </h1>
                            <p className="text-xs sm:text-sm font-medium text-[#64594A] dark:text-[#B4ABA0] max-w-md line-clamp-1">
                                Không gian làm việc thanh bình, đồng hành cùng vụ mùa bội thu
                            </p>
                        </div>

                        {/* Right Top Actions */}
                        <div className="flex items-center gap-2 shrink-0">
                            {/* Weather pill */}
                            <div className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-white/75 dark:bg-black/50 backdrop-blur-md border border-[#E0D5C1] dark:border-[#384233] text-[#4E4436] dark:text-[#D5CCC0] text-xs font-semibold shadow-xs">
                                <Sun size={15} className="text-[#DE8C5A]" />
                                <span>{weather?.temp ?? 28}°C</span>
                                <span className="text-[10px] opacity-60">({weather?.city || 'Vụ mùa'})</span>
                            </div>

                            {/* Theme toggle back to classic button */}
                            <button
                                type="button"
                                onClick={onToggleZen}
                                title="Chuyển đổi giao diện"
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-white/85 hover:bg-white dark:bg-black/60 dark:hover:bg-black/80 backdrop-blur-md border border-[#7D8B6E]/40 text-[#4D603E] dark:text-[#C8D6B9] font-bold text-xs shadow-sm hover:scale-102 active:scale-98 transition-all cursor-pointer"
                            >
                                <SlidersHorizontal size={13} />
                                <span className="hidden md:inline">Giao diện gốc</span>
                            </button>
                        </div>
                    </div>

                    {/* Bottom strip inside banner */}
                    <div className="flex items-center justify-between text-xs text-[#52483B] dark:text-[#C2BAAE]">
                        <div className="flex items-center gap-2 font-medium">
                            <Clock size={13} className="text-[#6D835A]" />
                            <span>{currentTime.toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'numeric', year: 'numeric' })}</span>
                            <span className="opacity-40">•</span>
                            <span className="text-[#6D835A] dark:text-[#A7BA95] font-bold">
                                Âm lịch: {Lunar.fromDate(currentTime).getDay()}/{Lunar.fromDate(currentTime).getMonth()}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
});

// Potted Plant Illustration Widget (matching bottom right of user image)
const ZenPottedPlantCard = memo(({ stats, navigate }) => {
    return (
        <div className="bg-[#FFFDF9] dark:bg-[#1E231B] rounded-[24px] border border-[#E8E1D2] dark:border-[#313B2E] p-5 shadow-[0_4px_20px_rgb(125,139,110,0.05)] flex flex-col justify-between relative overflow-hidden group hover:border-[#7D8B6E]/60 transition-all">
            {/* Soft decorative background leaf pattern */}
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#7D8B6E]/5 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#7D8B6E] inline-block animate-pulse" />
                    <span className="text-xs font-serif font-bold text-[#3A3328] dark:text-[#EDE8DF] tracking-wide">
                        Vụ Mùa Sinh Trưởng
                    </span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#7D8B6E]/15 text-[#556945] dark:text-[#AFC1A0]">
                    Đang mở cửa
                </span>
            </div>

            {/* Botanical Plant in Terracotta Pot Vector Graphic */}
            <div className="my-2 flex items-center justify-center">
                <div className="relative w-44 h-44 flex items-center justify-center">
                    <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-sm select-none">
                        <defs>
                            <linearGradient id="zenPotGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#DE8C5A" />
                                <stop offset="70%" stopColor="#C8733E" />
                                <stop offset="100%" stopColor="#AD5C2A" />
                            </linearGradient>
                            <linearGradient id="zenPlantLeaf" x1="0%" y1="0%" x2="0%" y2="100%">
                                <stop offset="0%" stopColor="#6C855B" />
                                <stop offset="100%" stopColor="#465D37" />
                            </linearGradient>
                            <linearGradient id="zenPlantLeafLight" x1="0%" y1="0%" x2="0%" y2="100%">
                                <stop offset="0%" stopColor="#87A175" />
                                <stop offset="100%" stopColor="#5B764B" />
                            </linearGradient>
                        </defs>

                        {/* Wooden Table Shelf Surface */}
                        <rect x="15" y="180" width="170" height="8" rx="4" fill="#D8C7B0" opacity="0.6" />
                        <ellipse cx="100" cy="180" rx="35" ry="5" fill="#000000" opacity="0.08" />

                        {/* Terracotta Plant Pot */}
                        {/* Pot Rim */}
                        <rect x="74" y="132" width="52" height="10" rx="4" fill="url(#zenPotGrad)" />
                        {/* Pot Body */}
                        <path d="M78,140 L84,178 Q100,183 116,178 L122,140 Z" fill="url(#zenPotGrad)" />
                        {/* Pot Highlight */}
                        <path d="M82,143 Q86,174 88,175" stroke="#F1B18A" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.6" />

                        {/* Plant Stems */}
                        <path d="M100,135 Q100,95 100,60" stroke="#3D5030" strokeWidth="3.5" strokeLinecap="round" fill="none" />
                        <path d="M98,125 Q80,105 65,85" stroke="#3D5030" strokeWidth="3" strokeLinecap="round" fill="none" />
                        <path d="M102,125 Q120,105 135,85" stroke="#3D5030" strokeWidth="3" strokeLinecap="round" fill="none" />
                        <path d="M97,130 Q70,120 50,110" stroke="#3D5030" strokeWidth="2.5" strokeLinecap="round" fill="none" />
                        <path d="M103,130 Q130,120 150,110" stroke="#3D5030" strokeWidth="2.5" strokeLinecap="round" fill="none" />

                        {/* Leaves */}
                        {/* Center tall leaf */}
                        <path d="M100,45 C90,20 110,20 100,45 Z" fill="none" />
                        <path d="M100,40 C85,60 85,90 100,105 C115,90 115,60 100,40 Z" fill="url(#zenPlantLeafLight)" />
                        
                        {/* Left upper leaf */}
                        <path d="M62,70 C50,90 60,115 80,120 C85,100 80,80 62,70 Z" fill="url(#zenPlantLeaf)" />
                        
                        {/* Right upper leaf */}
                        <path d="M138,70 C150,90 140,115 120,120 C115,100 120,80 138,70 Z" fill="url(#zenPlantLeafLight)" />

                        {/* Left bottom leaf */}
                        <path d="M45,95 C35,115 48,135 70,135 C72,118 62,102 45,95 Z" fill="url(#zenPlantLeaf)" />

                        {/* Right bottom leaf */}
                        <path d="M155,95 C165,115 152,135 130,135 C128,118 138,102 155,95 Z" fill="url(#zenPlantLeaf)" />

                        {/* Leaf Veins */}
                        <path d="M100,48 L100,100" stroke="#2B3A22" strokeWidth="1" strokeLinecap="round" opacity="0.35" />
                        <path d="M65,75 Q75,98 80,118" stroke="#2B3A22" strokeWidth="1" strokeLinecap="round" opacity="0.35" />
                        <path d="M135,75 Q125,98 120,118" stroke="#2B3A22" strokeWidth="1" strokeLinecap="round" opacity="0.35" />
                    </svg>
                </div>
            </div>

            {/* Quick Farm / Store Status */}
            <div className="pt-2 border-t border-[#EDE6D7] dark:border-[#313B2E] space-y-2">
                <div className="flex items-center justify-between text-xs">
                    <span className="text-[#6B6152] dark:text-[#ABA295] font-medium">Cảnh báo hết hàng:</span>
                    <span className="font-bold text-[#DE8C5A]">
                        {stats?.low_stock || 0} sản phẩm
                    </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                    <span className="text-[#6B6152] dark:text-[#ABA295] font-medium">Sắp hết hạn:</span>
                    <span className="font-bold text-[#DE8C5A]">
                        {stats?.expiry?.near || 0} sản phẩm
                    </span>
                </div>

                <button
                    type="button"
                    onClick={() => navigate('/pos')}
                    className="w-full mt-2 py-2.5 px-3 rounded-xl bg-[#7D8B6E] hover:bg-[#6D7B5E] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
                >
                    <ShoppingCart size={14} />
                    <span>Mở Bán Hàng POS</span>
                </button>
            </div>
        </div>
    );
});

// Mini Dot Calendar Widget (matching bottom left of user image)
const ZenDotCalendarCard = memo(({ filters, setFilters }) => {
    const today = new Date();
    const currentYear = parseInt(filters.year || today.getFullYear(), 10);
    const currentMonth = parseInt(filters.month || (today.getMonth() + 1), 10);
    const currentDay = parseInt(filters.day || today.getDate(), 10);

    const [viewMonth, setViewMonth] = useState(currentMonth);
    const [viewYear, setViewYear] = useState(currentYear);

    // Days in current view month
    const daysInMonth = useMemo(() => {
        return new Date(viewYear, viewMonth, 0).getDate();
    }, [viewYear, viewMonth]);

    // Start weekday of the month (0 = Sun, 1 = Mon...)
    const firstDayWeekday = useMemo(() => {
        return new Date(viewYear, viewMonth - 1, 1).getDay();
    }, [viewYear, viewMonth]);

    const handlePrevMonth = () => {
        if (viewMonth === 1) {
            setViewMonth(12);
            setViewYear(viewYear - 1);
        } else {
            setViewMonth(viewMonth - 1);
        }
    };

    const handleNextMonth = () => {
        if (viewMonth === 12) {
            setViewMonth(1);
            setViewYear(viewYear + 1);
        } else {
            setViewMonth(viewMonth + 1);
        }
    };

    const handleSelectDay = (dayNum) => {
        setFilters({
            year: viewYear.toString(),
            month: viewMonth.toString().padStart(2, '0'),
            day: dayNum.toString().padStart(2, '0')
        });
    };

    const isTodayView = viewYear === today.getFullYear() && viewMonth === (today.getMonth() + 1);

    return (
        <div className="bg-[#FFFDF9] dark:bg-[#1E231B] rounded-[24px] border border-[#E8E1D2] dark:border-[#313B2E] p-5 shadow-[0_4px_20px_rgb(125,139,110,0.05)] flex flex-col justify-between">
            {/* Header matching user image: < [Pill] > */}
            <div className="flex items-center justify-between pb-3 border-b border-[#EFE8DA] dark:border-[#313B2E]">
                <button
                    type="button"
                    onClick={handlePrevMonth}
                    className="p-1 rounded-lg text-[#7D8B6E] hover:bg-[#7D8B6E]/10 transition-colors cursor-pointer"
                    title="Tháng trước"
                >
                    <ChevronLeft size={16} />
                </button>

                <div className="flex items-center gap-2">
                    <div className="w-8 h-1.5 rounded-full bg-[#7D8B6E] opacity-80" />
                    <span className="text-xs font-serif font-bold text-[#3E362A] dark:text-[#EDE8DF]">
                        Tháng {viewMonth} / {viewYear}
                    </span>
                    <div className="w-8 h-1.5 rounded-full bg-[#7D8B6E] opacity-80" />
                </div>

                <button
                    type="button"
                    onClick={handleNextMonth}
                    className="p-1 rounded-lg text-[#7D8B6E] hover:bg-[#7D8B6E]/10 transition-colors cursor-pointer"
                    title="Tháng sau"
                >
                    <ChevronRight size={16} />
                </button>
            </div>

            {/* Weekday labels */}
            <div className="grid grid-cols-7 gap-1 text-center py-2 text-[10px] font-bold text-[#968B7A] dark:text-[#888E81] uppercase">
                <span>CN</span>
                <span>T2</span>
                <span>T3</span>
                <span>T4</span>
                <span>T5</span>
                <span>T6</span>
                <span>T7</span>
            </div>

            {/* Dot Grid of Days (as shown in user's image) */}
            <div className="grid grid-cols-7 gap-2 place-items-center py-2">
                {/* Empty slots before first day */}
                {Array.from({ length: firstDayWeekday }).map((_, i) => (
                    <div key={`empty-${i}`} className="w-6 h-6" />
                ))}

                {/* Day Dots */}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                    const dayNum = i + 1;
                    const isSelected = 
                        filters.year === viewYear.toString() &&
                        parseInt(filters.month, 10) === viewMonth &&
                        parseInt(filters.day, 10) === dayNum;
                    const isRealToday = isTodayView && today.getDate() === dayNum;

                    return (
                        <button
                            key={`day-${dayNum}`}
                            type="button"
                            onClick={() => handleSelectDay(dayNum)}
                            className={cn(
                                "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all cursor-pointer relative",
                                isSelected
                                    ? "bg-[#7D8B6E] text-white shadow-sm shadow-[#7D8B6E]/40 scale-105"
                                    : isRealToday
                                        ? "border border-[#7D8B6E] text-[#5A6D4B] dark:text-[#C5D5B7] hover:bg-[#7D8B6E]/15"
                                        : "text-[#6B6152] dark:text-[#A7A094] hover:bg-[#EFE8DC] dark:hover:bg-[#2C3428]"
                            )}
                            title={`Ngày ${dayNum}/${viewMonth}/${viewYear}`}
                        >
                            {dayNum}
                            {isSelected && (
                                <span className="absolute -bottom-0.5 w-1 h-1 rounded-full bg-white" />
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Quick Filter: Hôm nay */}
            <div className="pt-3 border-t border-[#EFE8DA] dark:border-[#313B2E] flex items-center justify-between">
                <span className="text-[11px] text-[#7A6F5F] dark:text-[#A0988C]">
                    Đang xem: <strong className="text-[#3E362A] dark:text-[#E8E2D5]">{filters.day}/{filters.month}/{filters.year}</strong>
                </span>
                <button
                    type="button"
                    onClick={() => {
                        setFilters({
                            year: today.getFullYear().toString(),
                            month: (today.getMonth() + 1).toString().padStart(2, '0'),
                            day: today.getDate().toString().padStart(2, '0')
                        });
                        setViewMonth(today.getMonth() + 1);
                        setViewYear(today.getFullYear());
                    }}
                    className="text-[10px] font-bold text-[#7D8B6E] hover:underline uppercase tracking-wider cursor-pointer"
                >
                    Về hôm nay
                </button>
            </div>
        </div>
    );
});

// Main Zen Botanical Dashboard Container
export default function ZenBotanicalDashboard({
    stats,
    filters,
    setFilters,
    weather,
    shopInfo,
    onToggleZen
}) {
    const navigate = useNavigate();
    const [currentTime] = useState(new Date());

    // Prepare chart data matching Earthy Zen palette
    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: 'rgba(255, 253, 249, 0.95)',
                titleColor: '#332C22',
                bodyColor: '#54493B',
                borderColor: '#E2D8C6',
                borderWidth: 1,
                padding: 10,
                cornerRadius: 12,
                callbacks: {
                    label: (context) => ` Doanh thu: ${formatCurrency(context.raw)}`
                }
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                grid: { color: 'rgba(125, 139, 110, 0.08)', drawBorder: false },
                ticks: {
                    color: '#8E8270',
                    font: { size: 10 },
                    callback: (val) => val >= 1000000 ? `${(val / 1000000).toFixed(1)}M` : formatNumber(val)
                }
            },
            x: {
                grid: { display: false },
                ticks: { color: '#8E8270', font: { size: 10 } }
            }
        }
    };

    const chartData = {
        labels: stats?.chart?.labels || [],
        datasets: [
            {
                label: 'Doanh thu',
                data: stats?.chart?.data || [],
                backgroundColor: '#7D8B6E',
                hoverBackgroundColor: '#68775A',
                borderRadius: 8,
                barPercentage: 0.6
            }
        ]
    };

    return (
        <div className="space-y-6 pb-12 max-w-[1400px] mx-auto animate-[fadeIn_0.3s_ease-out]">
            {/* 1. TOP SCENIC LANDSCAPE BANNER */}
            <ZenLandscapeBanner
                weather={weather}
                currentTime={currentTime}
                shopName={shopInfo?.shop_name}
                onToggleZen={onToggleZen}
            />

            {/* 2. "TODAY" (HÔM NAY) SECTION (MATCHING USER REFERENCE DESIGN) */}
            <div className="bg-[#FAF7F2] dark:bg-[#1A1F18] rounded-[28px] border border-[#E9E2D4] dark:border-[#2F392B] p-6 sm:p-7 shadow-[0_4px_24px_rgb(125,139,110,0.04)] space-y-5">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#332C22] dark:text-[#EDE7DD] tracking-tight">
                            Today
                        </h2>
                        <p className="text-xs text-[#7B6F5F] dark:text-[#A79F92] font-medium mt-0.5">
                            Tổng hợp hoạt động kinh doanh hôm nay ({filters.day}/{filters.month}/{filters.year})
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#7D8B6E] bg-[#7D8B6E]/15 px-3 py-1 rounded-full">
                            Tự động đồng bộ
                        </span>
                    </div>
                </div>

                {/* Pill Cards (Matching exact rows in image) */}
                <div className="space-y-3">
                    {/* Row 1: Doanh thu & Chỉ tiêu (with Golden Star ⭐) */}
                    <div className="p-4 sm:p-4.5 bg-[#FFFDF9] dark:bg-[#20261C] rounded-[20px] border border-[#ECE4D5] dark:border-[#333E2F] flex items-center justify-between gap-4 shadow-xs hover:border-[#7D8B6E]/60 transition-all group">
                        <div className="flex items-center gap-3.5 min-w-0">
                            <div className="w-7 h-7 rounded-full border-2 border-[#7D8B6E] flex items-center justify-center shrink-0 text-[#7D8B6E]">
                                <Circle size={12} className="stroke-[2.5]" />
                            </div>
                            <div className="min-w-0">
                                <div className="text-[11px] font-black uppercase tracking-wider text-[#857968] dark:text-[#A39989]">
                                    Tổng Doanh Thu Trong Ngày
                                </div>
                                <div className="text-lg sm:text-xl font-bold text-[#2E281F] dark:text-[#F2EDE4] truncate">
                                    {formatCurrency(stats?.revenue || 0)}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                            <span className="hidden sm:inline-block text-xs font-medium text-[#7A6F5F] dark:text-[#B0A79A]">
                                Tiền mặt: <strong className="text-[#3A3226] dark:text-[#E8E2D5]">{formatCurrency(stats?.cash_revenue || 0)}</strong>
                            </span>
                            <div className="w-8 h-8 rounded-full bg-[#DF8C5A]/15 text-[#DE8C5A] flex items-center justify-center shrink-0">
                                <Star size={17} className="fill-[#DE8C5A] stroke-[#DE8C5A]" />
                            </div>
                        </div>
                    </div>

                    {/* Row 2: Lợi nhuận gộp & Đã xử lý (with Checked Circle ✓) */}
                    <div className="p-4 sm:p-4.5 bg-[#FFFDF9] dark:bg-[#20261C] rounded-[20px] border border-[#ECE4D5] dark:border-[#333E2F] flex items-center justify-between gap-4 shadow-xs hover:border-[#7D8B6E]/60 transition-all group">
                        <div className="flex items-center gap-3.5 min-w-0">
                            <div className="w-7 h-7 rounded-full bg-[#7D8B6E] text-white flex items-center justify-center shrink-0 shadow-xs shadow-[#7D8B6E]/30">
                                <Check size={14} className="stroke-[3]" />
                            </div>
                            <div className="min-w-0">
                                <div className="text-[11px] font-black uppercase tracking-wider text-[#857968] dark:text-[#A39989]">
                                    Lợi Nhuận Ước Tính
                                </div>
                                <div className="text-lg sm:text-xl font-bold text-[#4D653E] dark:text-[#B2C5A2] truncate">
                                    {formatCurrency(stats?.profit || 0)}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-[#7D8B6E]/15 text-[#526842] dark:text-[#A6B995]">
                                Hoạt động hiệu quả
                            </span>
                        </div>
                    </div>

                    {/* Row 3: Công nợ khách hàng cần thu (Unfilled Circle) */}
                    <div className="p-4 sm:p-4.5 bg-[#FFFDF9] dark:bg-[#20261C] rounded-[20px] border border-[#ECE4D5] dark:border-[#333E2F] flex items-center justify-between gap-4 shadow-xs hover:border-[#7D8B6E]/60 transition-all group">
                        <div className="flex items-center gap-3.5 min-w-0">
                            <div className="w-7 h-7 rounded-full border-2 border-[#D4C7B2] dark:border-[#4B5646] flex items-center justify-center shrink-0 text-[#8F8372]">
                                <Circle size={10} className="stroke-[2.5]" />
                            </div>
                            <div className="min-w-0">
                                <div className="text-[11px] font-black uppercase tracking-wider text-[#857968] dark:text-[#A39989]">
                                    Công Nợ Khách Hàng Hiện Tại
                                </div>
                                <div className="text-lg sm:text-xl font-bold text-[#C8733E] truncate">
                                    {formatCurrency(stats?.customer_debt || 0)}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                            <button
                                type="button"
                                onClick={() => navigate('/debt')}
                                className="px-3 py-1.5 rounded-xl border border-[#D8CCB7] hover:border-[#7D8B6E] text-xs font-bold text-[#554A3B] dark:text-[#C8BFA] hover:text-[#7D8B6E] transition-all cursor-pointer"
                            >
                                Sổ nợ →
                            </button>
                        </div>
                    </div>
                </div>

                {/* 3. BOTTOM WIDGETS ROW (CALENDAR + PLANT WIDGET - EXACT COMPOSITION OF USER IMAGE) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
                    {/* Left: Dot Calendar Widget */}
                    <ZenDotCalendarCard
                        filters={filters}
                        setFilters={setFilters}
                    />

                    {/* Right: Botanical Plant Pot Widget */}
                    <ZenPottedPlantCard
                        stats={stats}
                        navigate={navigate}
                    />
                </div>
            </div>

            {/* 4. EXTENDED ANALYTICS: REVENUE CHART IN SAGE & TERRACOTTA PALETTE */}
            <div className="bg-[#FAF7F2] dark:bg-[#1A1F18] rounded-[28px] border border-[#E9E2D4] dark:border-[#2F392B] p-6 sm:p-7 shadow-[0_4px_24px_rgb(125,139,110,0.04)] space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-[#7D8B6E]/15 text-[#556945] dark:text-[#AFC1A0] flex items-center justify-center">
                            <TrendingUp size={16} />
                        </div>
                        <div>
                            <h3 className="text-base font-serif font-bold text-[#332C22] dark:text-[#EDE7DD]">
                                Diễn Biến Doanh Thu 7 Ngày Qua
                            </h3>
                            <p className="text-[11px] text-[#7B6F5F] dark:text-[#A79F92]">
                                Nhịp điệu kinh doanh mộc mạc theo từng ngày
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 text-xs">
                        <span className="flex items-center gap-1.5 font-bold text-[#526842] dark:text-[#A6B995]">
                            <span className="w-3 h-3 rounded-full bg-[#7D8B6E]" /> Doanh thu
                        </span>
                    </div>
                </div>

                <div className="h-56 sm:h-64 w-full pt-2">
                    {stats?.chart?.data?.length > 0 ? (
                        <Bar data={chartData} options={chartOptions} />
                    ) : (
                        <div className="h-full flex items-center justify-center text-xs text-[#8C8070]">
                            Chưa có dữ liệu thống kê cho khoảng thời gian này
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
