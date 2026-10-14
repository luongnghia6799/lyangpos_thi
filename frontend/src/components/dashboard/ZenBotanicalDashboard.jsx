import React, { useState, useMemo, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lunar } from 'lunar-javascript';
import { m, AnimatePresence } from 'framer-motion';
import { Bar } from 'react-chartjs-2';
import {
    Leaf,
    Sun,
    Calendar,
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
    Sparkles,
    ArrowRight,
    SlidersHorizontal,
    Sprout,
    Check,
    Truck,
    BarChart3,
    ShieldAlert,
    Phone,
    ArrowUpRight,
    Sparkle
} from 'lucide-react';
import { formatCurrency, formatNumber, cn } from '../../lib/utils';

// -------------------------------------------------------------
// 1. SCENIC BOTANICAL LANDSCAPE BANNER
// -------------------------------------------------------------
const ZenLandscapeBanner = memo(({ weather, currentTime, shopName, onToggleZen }) => {
    const navigate = useNavigate();

    // Time-based greeting & vibe
    const currentHour = currentTime.getHours();
    const timeGreeting = useMemo(() => {
        if (currentHour >= 5 && currentHour < 11) {
            return {
                title: 'Bình minh an lành & Vụ mùa bội thu',
                subtitle: 'Khởi đầu ngày mới với tâm thế thong dong, năng suất và tươi mới',
                sunColor: '#E28743',
                sunGlow: '#F5A26B',
                mood: 'morning'
            };
        } else if (currentHour >= 11 && currentHour < 14) {
            return {
                title: 'Trưa hanh thông & Vững vàng tiến bước',
                subtitle: 'Giữ năng lượng tích cực cho những chuyến hàng tấp nập buổi chiều',
                sunColor: '#E6A15C',
                sunGlow: '#F8BE7C',
                mood: 'noon'
            };
        } else if (currentHour >= 14 && currentHour < 18) {
            return {
                title: 'Chiều êm ả & Năng suất trọn vẹn',
                subtitle: 'Không gian làm việc thanh bình, hoàn thành chỉ tiêu vụ mùa hôm nay',
                sunColor: '#DE8C5A',
                sunGlow: '#EF9F70',
                mood: 'afternoon'
            };
        } else {
            return {
                title: 'Hoàng hôn thư thái & Tổng kết an nhiên',
                subtitle: 'Một ngày làm việc chăm chỉ khép lại trong bình yên và trọn vẹn',
                sunColor: '#C86D43',
                sunGlow: '#E5895E',
                mood: 'evening'
            };
        }
    }, [currentHour]);

    // Lunar Date calculation
    const lunarInfo = useMemo(() => {
        try {
            const l = Lunar.fromDate(currentTime);
            return `Âm lịch: Ngày ${l.getDay()} tháng ${l.getMonth()} (${l.getYearInGanZhi()} ${l.getYearShengXiao()})`;
        } catch {
            return '';
        }
    }, [currentTime]);

    return (
        <div className="relative w-full rounded-2xl sm:rounded-[28px] overflow-hidden bg-gradient-to-b from-[#F9F5EC] via-[#EFE6D5] to-[#E5DAC6] dark:from-[#21271E] dark:via-[#191F16] dark:to-[#131711] border border-[#E4DAC7]/80 dark:border-[#333C2F] shadow-[0_12px_40px_rgba(125,139,110,0.1)] transition-all">
            {/* Scenic Vector Landscape Art */}
            <div className="relative h-56 sm:h-64 md:h-72 w-full overflow-hidden select-none">
                <svg
                    viewBox="0 0 1440 380"
                    preserveAspectRatio="xMidYMid slice"
                    className="absolute inset-0 w-full h-full pointer-events-none"
                >
                    <defs>
                        {/* Sun Radial Glow */}
                        <radialGradient id="zenSunGlowMaster" cx="50%" cy="50%" r="50%">
                            <stop offset="0%" stopColor={timeGreeting.sunColor} stopOpacity="1" />
                            <stop offset="55%" stopColor={timeGreeting.sunGlow} stopOpacity="0.85" />
                            <stop offset="100%" stopColor={timeGreeting.sunColor} stopOpacity="0" />
                        </radialGradient>

                        {/* Mountain Layers Gradients */}
                        <linearGradient id="zenDistantMtn" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#CCD9C0" stopOpacity="0.8" />
                            <stop offset="100%" stopColor="#B6C5A7" stopOpacity="0.95" />
                        </linearGradient>
                        <linearGradient id="zenMidMtn" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#A2B792" stopOpacity="0.9" />
                            <stop offset="100%" stopColor="#8A9F78" stopOpacity="0.98" />
                        </linearGradient>
                        <linearGradient id="zenFrontMtn" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#768C65" stopOpacity="0.98" />
                            <stop offset="100%" stopColor="#586E48" stopOpacity="1" />
                        </linearGradient>
                        <linearGradient id="zenForegroundHill" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#667D55" />
                            <stop offset="100%" stopColor="#4A603A" />
                        </linearGradient>

                        {/* Plant leaves gradient */}
                        <linearGradient id="zenLeafGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#496240" />
                            <stop offset="100%" stopColor="#32452B" />
                        </linearGradient>

                        {/* Soft cloud gradient */}
                        <linearGradient id="zenCloudGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.65" />
                            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.15" />
                        </linearGradient>
                    </defs>

                    {/* Sky Background Tint */}
                    <rect width="1440" height="380" fill="#FAF6EE" className="dark:fill-[#1C2219]" />

                    {/* Terracotta / Golden Sun with Breathing Aura */}
                    <circle cx="1060" cy="118" r="48" fill={timeGreeting.sunColor} className="opacity-95" />
                    <circle cx="1060" cy="118" r="70" fill="url(#zenSunGlowMaster)" className="opacity-40 animate-pulse" />

                    {/* Soft Organic Watercolor Clouds */}
                    <path
                        d="M520,80 Q570,62 630,78 Q680,68 730,82 Q750,96 720,105 Q620,110 530,95 Z"
                        fill="url(#zenCloudGrad)"
                    />
                    <path
                        d="M220,100 Q265,88 320,100 Q360,92 400,104 Q390,118 320,118 Q235,116 220,100 Z"
                        fill="url(#zenCloudGrad)"
                        opacity="0.8"
                    />

                    {/* Distant Misty Mountain Ridge */}
                    <path
                        d="M0,225 Q240,145 480,190 T960,158 T1440,185 L1440,380 L0,380 Z"
                        fill="url(#zenDistantMtn)"
                        className="dark:opacity-35"
                    />

                    {/* Mid Mountain Ridge */}
                    <path
                        d="M0,250 Q290,175 620,220 T1150,185 T1440,240 L1440,380 L0,380 Z"
                        fill="url(#zenMidMtn)"
                        className="dark:opacity-55"
                    />

                    {/* Foreground Rolling Hills */}
                    <path
                        d="M0,285 Q370,218 750,268 T1440,238 L1440,380 L0,380 Z"
                        fill="url(#zenFrontMtn)"
                    />
                    <path
                        d="M0,325 Q500,265 1050,318 T1440,298 L1440,380 L0,380 Z"
                        fill="url(#zenForegroundHill)"
                    />

                    {/* Botanical Plant Stem & Leaves on Right side */}
                    <g transform="translate(1230, 68) scale(1.22)">
                        {/* Main Stem */}
                        <path d="M45,240 Q40,158 52,88 Q58,38 60,8" stroke="#374B2F" strokeWidth="4.5" strokeLinecap="round" fill="none" />
                        
                        {/* Top Leaf */}
                        <path d="M60,8 Q66,-12 60,-24 Q54,-12 60,8" fill="url(#zenLeafGrad)" />
                        
                        {/* Left Leaves */}
                        <path d="M57,44 C30,34 15,48 5,64 C20,70 45,62 56,52" fill="url(#zenLeafGrad)" />
                        <path d="M52,94 C25,80 10,98 -5,118 C12,126 38,114 50,102" fill="url(#zenLeafGrad)" />
                        <path d="M48,148 C18,136 5,158 -12,184 C8,190 35,174 46,158" fill="url(#zenLeafGrad)" />
                        
                        {/* Right Leaves */}
                        <path d="M59,28 C85,18 100,30 110,46 C95,54 72,48 60,36" fill="url(#zenLeafGrad)" />
                        <path d="M55,74 C85,60 105,76 118,96 C100,104 75,94 56,82" fill="url(#zenLeafGrad)" />
                        <path d="M51,124 C82,110 104,128 116,150 C98,158 72,144 51,132" fill="url(#zenLeafGrad)" />
                        <path d="M47,178 C80,166 98,188 108,210 C90,218 66,202 46,186" fill="url(#zenLeafGrad)" />
                    </g>
                </svg>

                {/* Overlay Greeting & Status */}
                <div className="absolute inset-0 p-5 sm:p-7 md:p-8 flex flex-col justify-between z-10">
                    {/* Top Row: Shop Pill & Action Controls */}
                    <div className="flex items-start justify-between gap-3">
                        <div className="flex flex-wrap items-center gap-2">
                            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/80 dark:bg-black/50 backdrop-blur-md border border-[#7D8B6E]/35 text-[#425435] dark:text-[#C5D4B6] text-[10.5px] font-black uppercase tracking-wider shadow-xs">
                                <Leaf size={13} className="text-[#6D835A]" />
                                <span>Zen Botanical</span>
                                <span className="opacity-30">•</span>
                                <span className="font-bold">{shopName || 'Lyang POS'}</span>
                            </div>

                            {/* Weather pill */}
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/70 dark:bg-black/40 backdrop-blur-md border border-[#E0D5C1] dark:border-[#384233] text-[#4E4436] dark:text-[#D5CCC0] text-[11px] font-semibold shadow-2xs">
                                <Sun size={13} className="text-[#DE8C5A]" />
                                <span>{weather?.temp ?? 28}°C</span>
                                <span className="text-[10px] opacity-60">({weather?.city || 'Vụ mùa'})</span>
                            </div>
                        </div>

                        {/* Switch back button */}
                        <button
                            type="button"
                            onClick={onToggleZen}
                            title="Chuyển về giao diện gốc"
                            className="w-8 h-8 rounded-full bg-white/85 hover:bg-white dark:bg-black/60 dark:hover:bg-black/80 backdrop-blur-md border border-[#7D8B6E]/40 text-[#4D603E] dark:text-[#C8D6B9] shadow-2xs hover:scale-110 active:scale-90 transition-all flex items-center justify-center cursor-pointer shrink-0"
                        >
                            <SlidersHorizontal size={14} />
                        </button>
                    </div>

                    {/* Middle: Poetry Title & Subtitle */}
                    <div className="space-y-1.5 max-w-xl pr-12 sm:pr-0">
                        <h1 className="text-2xl sm:text-3xl md:text-4xl font-serif font-bold text-[#2A241C] dark:text-[#F6F2EB] tracking-tight leading-tight">
                            {timeGreeting.title}
                        </h1>
                        <p className="text-xs sm:text-sm font-medium text-[#5F5445] dark:text-[#B7AEA2] line-clamp-2">
                            {timeGreeting.subtitle}
                        </p>
                    </div>

                    {/* Bottom Strip: Solar + Lunar Date & Quick Shortcuts */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 text-xs text-[#52483B] dark:text-[#C2BAAE]">
                        <div className="flex flex-wrap items-center gap-2 font-medium">
                            <Clock size={13} className="text-[#6D835A] shrink-0" />
                            <span className="font-semibold">{currentTime.toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'numeric', year: 'numeric' })}</span>
                            {lunarInfo && (
                                <>
                                    <span className="opacity-40">•</span>
                                    <span className="text-[#6D835A] dark:text-[#A7BA95] font-bold">
                                        {lunarInfo}
                                    </span>
                                </>
                            )}
                        </div>

                        {/* Quick Action Navigation Pills */}
                        <div className="flex items-center gap-2 shrink-0">
                            <button
                                type="button"
                                onClick={() => navigate('/pos')}
                                className="px-3 py-1.5 rounded-full bg-[#7D8B6E] hover:bg-[#68765A] text-white text-[11px] font-bold shadow-xs hover:shadow-md transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                            >
                                <ShoppingCart size={13} />
                                <span>Bán hàng POS</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => navigate('/purchase')}
                                className="px-3 py-1.5 rounded-full bg-white/75 hover:bg-white dark:bg-black/45 dark:hover:bg-black/65 border border-[#7D8B6E]/30 text-[#4D603E] dark:text-[#C8D6B9] text-[11px] font-bold shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                            >
                                <Truck size={13} />
                                <span>Nhập hàng</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => navigate('/debt')}
                                className="px-3 py-1.5 rounded-full bg-white/75 hover:bg-white dark:bg-black/45 dark:hover:bg-black/65 border border-[#7D8B6E]/30 text-[#4D603E] dark:text-[#C8D6B9] text-[11px] font-bold shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                            >
                                <Wallet size={13} />
                                <span>Sổ nợ</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
});

// -------------------------------------------------------------
// 2. EXECUTIVE BENTO KPI METRICS CARDS
// -------------------------------------------------------------
const ZenBentoMetricsGrid = memo(({ stats, filters, navigate }) => {
    // Profit margin percentage
    const profitMargin = useMemo(() => {
        const rev = stats?.revenue || 0;
        const prof = stats?.profit || 0;
        if (rev <= 0) return 0;
        return Math.round((prof / rev) * 100);
    }, [stats?.revenue, stats?.profit]);

    // Cash ratio
    const cashRatio = useMemo(() => {
        const rev = stats?.revenue || 0;
        const cash = stats?.cash_revenue || 0;
        if (rev <= 0) return 100;
        return Math.min(100, Math.round((cash / rev) * 100));
    }, [stats?.revenue, stats?.cash_revenue]);

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
            {/* Card 1: Doanh Thu Hôm Nay */}
            <div className="bg-[#FFFDF9] dark:bg-[#1C2219] rounded-[24px] border border-[#E8DFC8] dark:border-[#2E382A] p-5 shadow-[0_4px_24px_rgba(125,139,110,0.05)] hover:border-[#7D8B6E]/60 transition-all flex flex-col justify-between group relative overflow-hidden">
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-2xl bg-[#7D8B6E]/15 text-[#516641] dark:text-[#B3C6A2] flex items-center justify-center font-bold">
                                <Sprout size={18} />
                            </div>
                            <div>
                                <h3 className="text-[11px] font-black uppercase tracking-wider text-[#8A7E6C] dark:text-[#A79D8E]">
                                    Doanh Thu Ngày
                                </h3>
                                <p className="text-[10px] text-[#A69B8A] dark:text-[#887F72]">
                                    {filters.day}/{filters.month}/{filters.year}
                                </p>
                            </div>
                        </div>

                        {stats?.revenue_trend !== undefined && stats?.revenue_trend !== 0 && (
                            <div className={cn(
                                "flex items-center gap-1 text-[10.5px] font-bold px-2 py-0.5 rounded-full border",
                                stats.revenue_trend > 0
                                    ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
                                    : "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20"
                            )}>
                                {stats.revenue_trend > 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                                <span>{Math.abs(stats.revenue_trend)}%</span>
                            </div>
                        )}
                    </div>

                    <div>
                        <div className="text-2xl sm:text-[26px] font-serif font-bold text-[#2A231B] dark:text-[#F3EEE5] tracking-tight">
                            {formatCurrency(stats?.revenue || 0)}
                        </div>
                    </div>
                </div>

                {/* Progress bar: Cash vs Debt ratio */}
                <div className="pt-4 border-t border-[#EFE8DA] dark:border-[#2C3628] space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] font-medium text-[#736756] dark:text-[#ABA092]">
                        <span>Tiền mặt: <strong className="text-[#383023] dark:text-[#E8E2D5]">{formatCurrency(stats?.cash_revenue || 0)}</strong></span>
                        <span>{cashRatio}%</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-[#EFE8DA] dark:bg-[#2C3628] overflow-hidden flex">
                        <div 
                            className="h-full bg-[#7D8B6E] rounded-full transition-all duration-500" 
                            style={{ width: `${cashRatio}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* Card 2: Lợi Nhuận Thuần */}
            <div className="bg-[#FFFDF9] dark:bg-[#1C2219] rounded-[24px] border border-[#E8DFC8] dark:border-[#2E382A] p-5 shadow-[0_4px_24px_rgba(125,139,110,0.05)] hover:border-[#7D8B6E]/60 transition-all flex flex-col justify-between group relative overflow-hidden">
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-2xl bg-[#DE8C5A]/15 text-[#C8733E] flex items-center justify-center font-bold">
                                <Sparkles size={18} />
                            </div>
                            <div>
                                <h3 className="text-[11px] font-black uppercase tracking-wider text-[#8A7E6C] dark:text-[#A79D8E]">
                                    Lợi Nhuận Ước Tính
                                </h3>
                                <p className="text-[10px] text-[#A69B8A] dark:text-[#887F72]">
                                    Hiệu suất bán lẻ
                                </p>
                            </div>
                        </div>

                        {profitMargin > 0 && (
                            <span className="text-[10.5px] font-bold px-2 py-0.5 rounded-full bg-[#7D8B6E]/15 text-[#526842] dark:text-[#A6B995] border border-[#7D8B6E]/20">
                                Biên {profitMargin}%
                            </span>
                        )}
                    </div>

                    <div>
                        <div className="text-2xl sm:text-[26px] font-serif font-bold text-[#4D653E] dark:text-[#B2C5A2] tracking-tight">
                            {formatCurrency(stats?.profit || 0)}
                        </div>
                    </div>
                </div>

                <div className="pt-4 border-t border-[#EFE8DA] dark:border-[#2C3628] flex items-center justify-between text-[11px]">
                    <span className="text-[#736756] dark:text-[#ABA092]">Đánh giá hiệu suất:</span>
                    <span className="font-bold text-[#526842] dark:text-[#A6B995]">
                        {stats?.profit > 0 ? '🌿 Vụ mùa hiệu quả' : 'Đang cập nhật'}
                    </span>
                </div>
            </div>

            {/* Card 3: Công Nợ Khách Hàng */}
            <div className="bg-[#FFFDF9] dark:bg-[#1C2219] rounded-[24px] border border-[#E8DFC8] dark:border-[#2E382A] p-5 shadow-[0_4px_24px_rgba(125,139,110,0.05)] hover:border-[#7D8B6E]/60 transition-all flex flex-col justify-between group relative overflow-hidden">
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-2xl bg-[#C8733E]/15 text-[#C8733E] flex items-center justify-center font-bold">
                                <Wallet size={18} />
                            </div>
                            <div>
                                <h3 className="text-[11px] font-black uppercase tracking-wider text-[#8A7E6C] dark:text-[#A79D8E]">
                                    Công Nợ Khách Hàng
                                </h3>
                                <p className="text-[10px] text-[#A69B8A] dark:text-[#887F72]">
                                    Khoản phải thu
                                </p>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={() => navigate('/debt')}
                            className="p-1 rounded-lg text-[#C8733E] hover:bg-[#C8733E]/10 transition-colors cursor-pointer"
                            title="Mở sổ công nợ"
                        >
                            <ArrowUpRight size={15} />
                        </button>
                    </div>

                    <div>
                        <div className="text-2xl sm:text-[26px] font-serif font-bold text-[#C8733E] tracking-tight">
                            {formatCurrency(stats?.customer_debt || 0)}
                        </div>
                    </div>
                </div>

                <div className="pt-4 border-t border-[#EFE8DA] dark:border-[#2C3628] flex items-center justify-between text-[11px]">
                    <span className="text-[#736756] dark:text-[#ABA092]">Nợ NCC:</span>
                    <span className="font-bold text-[#554A3B] dark:text-[#D5CCC0]">
                        {formatCurrency(stats?.supplier_debt || 0)}
                    </span>
                </div>
            </div>

            {/* Card 4: Sức Khỏe Kho Vận */}
            <div className="bg-[#FFFDF9] dark:bg-[#1C2219] rounded-[24px] border border-[#E8DFC8] dark:border-[#2E382A] p-5 shadow-[0_4px_24px_rgba(125,139,110,0.05)] hover:border-[#7D8B6E]/60 transition-all flex flex-col justify-between group relative overflow-hidden">
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-2xl bg-[#7D8B6E]/15 text-[#516641] dark:text-[#B3C6A2] flex items-center justify-center font-bold">
                                <Package size={18} />
                            </div>
                            <div>
                                <h3 className="text-[11px] font-black uppercase tracking-wider text-[#8A7E6C] dark:text-[#A79D8E]">
                                    Sức Khỏe Kho Vận
                                </h3>
                                <p className="text-[10px] text-[#A69B8A] dark:text-[#887F72]">
                                    Tồn kho & Hạn dùng
                                </p>
                            </div>
                        </div>

                        <span className={cn(
                            "text-[10.5px] font-bold px-2 py-0.5 rounded-full border",
                            (stats?.low_stock || 0) > 0 || (stats?.expiry?.near || 0) > 0
                                ? "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20"
                                : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
                        )}>
                            {(stats?.low_stock || 0) > 0 ? `${stats.low_stock} cần nhập` : 'Kho ổn định'}
                        </span>
                    </div>

                    <div className="flex items-baseline gap-2">
                        <div className="text-2xl sm:text-[26px] font-serif font-bold text-[#2A231B] dark:text-[#F3EEE5] tracking-tight">
                            {stats?.low_stock || 0}
                        </div>
                        <span className="text-xs text-[#8A7E6C] dark:text-[#A79D8E] font-medium">sản phẩm tồn thấp</span>
                    </div>
                </div>

                <div className="pt-4 border-t border-[#EFE8DA] dark:border-[#2C3628] flex items-center justify-between text-[11px]">
                    <span className="text-[#736756] dark:text-[#ABA092]">Sắp hết hạn:</span>
                    <span className="font-bold text-[#DE8C5A]">
                        {stats?.expiry?.near || 0} món
                    </span>
                </div>
            </div>
        </div>
    );
});

// -------------------------------------------------------------
// 3. INTERACTIVE ZEN BOTANICAL ANALYTICS CHART
// -------------------------------------------------------------
const ZenAnalyticsChart = memo(({ stats }) => {
    const [chartMode, setChartMode] = useState('both'); // 'revenue' | 'profit' | 'both'

    const totalRevenue = useMemo(() => {
        return (stats?.chart?.data || []).reduce((acc, val) => acc + (val || 0), 0);
    }, [stats?.chart?.data]);

    const totalProfit = useMemo(() => {
        return (stats?.chart?.profit_data || []).reduce((acc, val) => acc + (val || 0), 0);
    }, [stats?.chart?.profit_data]);

    const maxDay = useMemo(() => {
        const arr = stats?.chart?.data || [];
        if (arr.length === 0) return 0;
        return Math.max(...arr);
    }, [stats?.chart?.data]);

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: 'rgba(255, 253, 249, 0.96)',
                titleColor: '#2B241C',
                bodyColor: '#4A4032',
                borderColor: '#E2D8C6',
                borderWidth: 1.5,
                padding: 12,
                cornerRadius: 14,
                boxPadding: 4,
                usePointStyle: true,
                callbacks: {
                    label: (context) => {
                        const name = context.dataset.label || '';
                        return ` ${name}: ${formatCurrency(context.raw)}`;
                    }
                }
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                grid: { 
                    color: 'rgba(125, 139, 110, 0.08)', 
                    drawBorder: false 
                },
                ticks: {
                    color: '#8E8270',
                    font: { size: 10, family: 'Inter, sans-serif' },
                    callback: (val) => val >= 1000000 ? `${(val / 1000000).toFixed(1)}M` : formatNumber(val)
                }
            },
            x: {
                grid: { display: false },
                ticks: { 
                    color: '#8E8270', 
                    font: { size: 10, family: 'Inter, sans-serif' } 
                }
            }
        }
    };

    const datasets = [];
    if (chartMode === 'revenue' || chartMode === 'both') {
        datasets.push({
            type: 'bar',
            label: 'Doanh thu',
            data: stats?.chart?.data || [],
            backgroundColor: '#7D8B6E',
            hoverBackgroundColor: '#68775A',
            borderRadius: 10,
            barThickness: 22,
            order: 2
        });
    }
    if (chartMode === 'profit' || chartMode === 'both') {
        datasets.push({
            type: 'line',
            label: 'Lợi nhuận',
            data: stats?.chart?.profit_data || [],
            borderColor: '#DE8C5A',
            backgroundColor: 'rgba(222, 140, 90, 0.12)',
            borderWidth: 3,
            pointBackgroundColor: '#DE8C5A',
            pointBorderColor: '#FFFDF9',
            pointBorderWidth: 2,
            pointRadius: 4.5,
            pointHoverRadius: 7,
            tension: 0.38,
            fill: true,
            order: 1
        });
    }

    const chartData = {
        labels: stats?.chart?.labels || [],
        datasets
    };

    return (
        <div className="bg-[#FAF7F2] dark:bg-[#1A1F18] rounded-2xl sm:rounded-[26px] border border-[#E9E2D4] dark:border-[#2F392B] p-5 sm:p-6 shadow-[0_4px_24px_rgba(125,139,110,0.04)] space-y-4 w-full">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-2xl bg-[#7D8B6E]/15 text-[#516641] dark:text-[#B3C6A2] flex items-center justify-center font-bold">
                        <BarChart3 size={18} />
                    </div>
                    <div>
                        <h3 className="text-base sm:text-lg font-serif font-bold text-[#30281F] dark:text-[#EFE9DF]">
                            Nhịp Điệu Kinh Doanh 7 Ngày
                        </h3>
                        <p className="text-[11px] text-[#7A6E5E] dark:text-[#A89F92]">
                            Chu kỳ biến chuyển doanh thu và dòng lợi nhuận mộc mạc
                        </p>
                    </div>
                </div>

                {/* Filter mode toggles */}
                <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-[#EFE8DC]/80 dark:bg-[#252C22] border border-[#E2D8C6] dark:border-[#333C2F] text-xs font-bold self-start sm:self-auto">
                    <button
                        type="button"
                        onClick={() => setChartMode('both')}
                        className={cn(
                            "px-3 py-1 rounded-xl transition-all cursor-pointer",
                            chartMode === 'both'
                                ? "bg-[#7D8B6E] text-white shadow-xs"
                                : "text-[#6C604F] dark:text-[#AAA092] hover:text-[#2E281F]"
                        )}
                    >
                        Cả hai
                    </button>
                    <button
                        type="button"
                        onClick={() => setChartMode('revenue')}
                        className={cn(
                            "px-3 py-1 rounded-xl transition-all cursor-pointer",
                            chartMode === 'revenue'
                                ? "bg-[#7D8B6E] text-white shadow-xs"
                                : "text-[#6C604F] dark:text-[#AAA092] hover:text-[#2E281F]"
                        )}
                    >
                        Doanh thu
                    </button>
                    <button
                        type="button"
                        onClick={() => setChartMode('profit')}
                        className={cn(
                            "px-3 py-1 rounded-xl transition-all cursor-pointer",
                            chartMode === 'profit'
                                ? "bg-[#DE8C5A] text-white shadow-xs"
                                : "text-[#6C604F] dark:text-[#AAA092] hover:text-[#2E281F]"
                        )}
                    >
                        Lợi nhuận
                    </button>
                </div>
            </div>

            {/* Quick summary stat pills */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
                <div className="px-3.5 py-2 rounded-xl bg-white/70 dark:bg-black/25 border border-[#ECE3D4] dark:border-[#303B2C] text-xs">
                    <span className="text-[#8C806F] dark:text-[#A09689] block text-[10px] font-bold uppercase tracking-wider">Tổng chu kỳ</span>
                    <span className="font-bold text-[#32291F] dark:text-[#EDE6DB] text-sm">{formatCurrency(totalRevenue)}</span>
                </div>
                <div className="px-3.5 py-2 rounded-xl bg-white/70 dark:bg-black/25 border border-[#ECE3D4] dark:border-[#303B2C] text-xs">
                    <span className="text-[#8C806F] dark:text-[#A09689] block text-[10px] font-bold uppercase tracking-wider">Lợi nhuận chu kỳ</span>
                    <span className="font-bold text-[#4D653E] dark:text-[#B2C5A2] text-sm">{formatCurrency(totalProfit)}</span>
                </div>
                <div className="col-span-2 sm:col-span-1 px-3.5 py-2 rounded-xl bg-white/70 dark:bg-black/25 border border-[#ECE3D4] dark:border-[#303B2C] text-xs">
                    <span className="text-[#8C806F] dark:text-[#A09689] block text-[10px] font-bold uppercase tracking-wider">Ngày cao điểm</span>
                    <span className="font-bold text-[#C8733E] text-sm">{formatCurrency(maxDay)}</span>
                </div>
            </div>

            {/* Chart Area */}
            <div className="h-60 sm:h-72 w-full pt-2">
                {stats?.chart?.data?.length > 0 ? (
                    <Bar data={chartData} options={chartOptions} />
                ) : (
                    <div className="h-full flex items-center justify-center text-xs text-[#8C8070]">
                        Chưa có dữ liệu thống kê cho khoảng thời gian này
                    </div>
                )}
            </div>
        </div>
    );
});

// -------------------------------------------------------------
// 4. MINI DOT CALENDAR WIDGET
// -------------------------------------------------------------
const ZenDotCalendarCard = memo(({ filters, setFilters }) => {
    const today = new Date();
    const currentYear = parseInt(filters.year || today.getFullYear(), 10);
    const currentMonth = parseInt(filters.month || (today.getMonth() + 1), 10);

    const [viewMonth, setViewMonth] = useState(currentMonth);
    const [viewYear, setViewYear] = useState(currentYear);

    const daysInMonth = useMemo(() => {
        return new Date(viewYear, viewMonth, 0).getDate();
    }, [viewYear, viewMonth]);

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
        <div className="bg-[#FFFDF9] dark:bg-[#1E231B] rounded-[24px] border border-[#E8E1D2] dark:border-[#313B2E] p-5 shadow-[0_4px_24px_rgba(125,139,110,0.05)] flex flex-col justify-between">
            {/* Header: < [Month / Year] > */}
            <div className="flex items-center justify-between pb-3 border-b border-[#EFE8DA] dark:border-[#313B2E]">
                <button
                    type="button"
                    onClick={handlePrevMonth}
                    className="p-1 rounded-lg text-[#7D8B6E] hover:bg-[#7D8B6E]/15 transition-colors cursor-pointer"
                    title="Tháng trước"
                >
                    <ChevronLeft size={16} />
                </button>

                <div className="flex items-center gap-2">
                    <div className="w-6 h-1 rounded-full bg-[#7D8B6E] opacity-75" />
                    <span className="text-xs font-serif font-bold text-[#352D21] dark:text-[#EDE8DF]">
                        Tháng {viewMonth} / {viewYear}
                    </span>
                    <div className="w-6 h-1 rounded-full bg-[#7D8B6E] opacity-75" />
                </div>

                <button
                    type="button"
                    onClick={handleNextMonth}
                    className="p-1 rounded-lg text-[#7D8B6E] hover:bg-[#7D8B6E]/15 transition-colors cursor-pointer"
                    title="Tháng sau"
                >
                    <ChevronRight size={16} />
                </button>
            </div>

            {/* Weekdays */}
            <div className="grid grid-cols-7 gap-1 text-center py-2 text-[10px] font-bold text-[#988D7D] dark:text-[#888E81] uppercase tracking-wider">
                <span>CN</span>
                <span>T2</span>
                <span>T3</span>
                <span>T4</span>
                <span>T5</span>
                <span>T6</span>
                <span>T7</span>
            </div>

            {/* Day Dots */}
            <div className="grid grid-cols-7 gap-1.5 place-items-center py-2">
                {Array.from({ length: firstDayWeekday }).map((_, i) => (
                    <div key={`empty-${i}`} className="w-7 h-7" />
                ))}

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
                                        ? "border border-[#7D8B6E] text-[#556945] dark:text-[#C5D5B7] hover:bg-[#7D8B6E]/15"
                                        : "text-[#675C4C] dark:text-[#A7A094] hover:bg-[#EFE8DC] dark:hover:bg-[#2C3428]"
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

            {/* Footer */}
            <div className="pt-3 border-t border-[#EFE8DA] dark:border-[#313B2E] flex items-center justify-between text-xs">
                <span className="text-[11px] text-[#786D5D] dark:text-[#A0988C]">
                    Ngày chọn: <strong className="text-[#322A1E] dark:text-[#E8E2D5]">{filters.day}/{filters.month}/{filters.year}</strong>
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
                    className="text-[10.5px] font-bold text-[#7D8B6E] hover:underline uppercase tracking-wider cursor-pointer"
                >
                    Hôm nay
                </button>
            </div>
        </div>
    );
});

// -------------------------------------------------------------
// 5. TOP DEBTORS & ACTIVE CUSTOMERS WIDGET (PRACTICAL & STYLISH)
// -------------------------------------------------------------
const ZenTopDebtorsCard = memo(({ stats, navigate }) => {
    const list = stats?.customer_debt_list || [];

    return (
        <div className="bg-[#FFFDF9] dark:bg-[#1E231B] rounded-[24px] border border-[#E8E1D2] dark:border-[#313B2E] p-5 shadow-[0_4px_24px_rgba(125,139,110,0.05)] flex flex-col justify-between">
            <div className="space-y-3">
                <div className="flex items-center justify-between pb-3 border-b border-[#EFE8DA] dark:border-[#313B2E]">
                    <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#DE8C5A] inline-block" />
                        <h3 className="text-xs font-serif font-bold text-[#352D21] dark:text-[#EDE8DF] tracking-wide">
                            Khách Hàng Cần Thu Công Nợ
                        </h3>
                    </div>
                    <button
                        type="button"
                        onClick={() => navigate('/debt')}
                        className="text-[10.5px] font-bold text-[#7D8B6E] hover:underline uppercase tracking-wider cursor-pointer"
                    >
                        Tất cả ({list.length}) →
                    </button>
                </div>

                {/* Customer List */}
                {list.length > 0 ? (
                    <div className="space-y-2.5 max-h-[210px] overflow-y-auto pr-1">
                        {list.slice(0, 4).map((c, idx) => (
                            <div
                                key={c.id || idx}
                                onClick={() => navigate('/debt')}
                                className="p-2.5 rounded-2xl bg-[#FBF8F2] dark:bg-[#252C22] border border-[#ECE3D4] dark:border-[#333E2F] flex items-center justify-between gap-3 hover:border-[#7D8B6E] transition-all cursor-pointer group"
                            >
                                <div className="flex items-center gap-2.5 min-w-0">
                                    <div className="w-7 h-7 rounded-full bg-[#7D8B6E]/15 text-[#556945] dark:text-[#B5C7A5] font-bold text-xs flex items-center justify-center shrink-0">
                                        {c.name ? c.name.charAt(0).toUpperCase() : 'K'}
                                    </div>
                                    <div className="min-w-0">
                                        <div className="text-xs font-bold text-[#31291E] dark:text-[#EFE8DE] truncate group-hover:text-[#7D8B6E] transition-colors">
                                            {c.name || 'Khách nợ'}
                                        </div>
                                        {c.phone && (
                                            <div className="text-[10px] text-[#8A7E6C] dark:text-[#A09689] flex items-center gap-1">
                                                <Phone size={9} />
                                                <span>{c.phone}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="text-right shrink-0">
                                    <div className="text-xs font-bold text-[#C8733E]">
                                        {formatCurrency(c.debt_balance || 0)}
                                    </div>
                                    <span className="text-[9px] font-bold text-slate-400">cần thu</span>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="py-8 flex flex-col items-center justify-center text-center space-y-2">
                        <div className="w-12 h-12 rounded-full bg-[#7D8B6E]/15 text-[#556945] flex items-center justify-center">
                            <Sparkle size={20} />
                        </div>
                        <div className="text-xs font-serif font-bold text-[#352D21] dark:text-[#EDE8DF]">
                            Dư Nợ Cân Bằng Hoàn Hảo
                        </div>
                        <p className="text-[11px] text-[#867A6B] dark:text-[#A79E91] max-w-xs">
                            Hiện không có khoản công nợ tồn đọng nào cần lưu ý. Chúc cửa hàng tiếp tục kinh doanh hanh thông!
                        </p>
                    </div>
                )}
            </div>

            {/* Quick Actions Footer */}
            <div className="pt-3 border-t border-[#EFE8DA] dark:border-[#313B2E] flex items-center justify-between text-xs">
                <span className="text-[11px] text-[#7A6F5F] dark:text-[#A0988C]">
                    Tổng nợ: <strong className="text-[#C8733E]">{formatCurrency(stats?.customer_debt || 0)}</strong>
                </span>
                <button
                    type="button"
                    onClick={() => navigate('/debt')}
                    className="px-3 py-1.5 rounded-xl bg-[#7D8B6E]/15 text-[#516641] dark:text-[#B3C6A2] font-bold text-[10.5px] hover:bg-[#7D8B6E] hover:text-white transition-all cursor-pointer"
                >
                    Thu nợ nhanh
                </button>
            </div>
        </div>
    );
});

// -------------------------------------------------------------
// 6. MAIN ZEN BOTANICAL DASHBOARD COMPONENT
// -------------------------------------------------------------
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

    return (
        <div className="space-y-5 pb-10 w-full animate-[fadeIn_0.35s_ease-out]">
            {/* 1. SCENIC TOP PANORAMA BANNER */}
            <ZenLandscapeBanner
                weather={weather}
                currentTime={currentTime}
                shopName={shopInfo?.shop_name}
                onToggleZen={onToggleZen}
            />

            {/* 2. EXECUTIVE BENTO KPI METRICS */}
            <ZenBentoMetricsGrid
                stats={stats}
                filters={filters}
                navigate={navigate}
            />

            {/* 3. INTERACTIVE ANALYTICS CHART */}
            <ZenAnalyticsChart
                stats={stats}
            />

            {/* 4. LOWER BALANCED SECTION: CALENDAR + TOP DEBTORS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full">
                <ZenDotCalendarCard
                    filters={filters}
                    setFilters={setFilters}
                />
                <ZenTopDebtorsCard
                    stats={stats}
                    navigate={navigate}
                />
            </div>
        </div>
    );
}
