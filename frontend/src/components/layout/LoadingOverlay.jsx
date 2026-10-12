import React, { useState, useEffect } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { Loader2, Sparkles, Database, RefreshCw, Zap, X } from 'lucide-react';
import Portal from '../widgets/Portal';
import logo from '../../assets/logo.png';

const LoadingOverlay = ({ 
    isVisible, 
    message = "Đang khởi động hệ thống...", 
    style: propStyle,
    onDismiss
}) => {
    // Synchronously track saved style; immediately prioritize propStyle if passed (e.g. preview)
    const [savedStyle, setSavedStyle] = useState(() => {
        try {
            return localStorage.getItem('ui_loading_style') || 'ring';
        } catch (e) {
            return 'ring';
        }
    });

    // Effective style is synchronous, avoiding 1-frame style flicker during re-renders or previews
    const effectiveStyle = propStyle || savedStyle || 'ring';

    const [hintIndex, setHintIndex] = useState(0);
    const hints = [
        "Đang thiết lập kết nối bảo mật...",
        "Đang đồng bộ dữ liệu sản phẩm...",
        "Đang tối ưu hóa bộ nhớ...",
        "Gần hoàn tất rồi...",
        "Sẵn sàng phục vụ bạn!"
    ];

    // Synchronize saved style from storage or custom events
    useEffect(() => {
        const handleStyleChange = (e) => {
            const newStyle = e?.detail || localStorage.getItem('ui_loading_style') || 'ring';
            setSavedStyle(newStyle);
        };

        window.addEventListener('ui_loading_style_changed', handleStyleChange);
        window.addEventListener('storage', handleStyleChange);
        return () => {
            window.removeEventListener('ui_loading_style_changed', handleStyleChange);
            window.removeEventListener('storage', handleStyleChange);
        };
    }, []);

    // Hint rotation for vibrant mode
    useEffect(() => {
        if (isVisible && effectiveStyle === 'vibrant') {
            const interval = setInterval(() => {
                setHintIndex((prev) => (prev + 1) % hints.length);
            }, 2500);
            return () => clearInterval(interval);
        }
    }, [isVisible, effectiveStyle]);

    // Handle Escape key to dismiss if onDismiss provided
    useEffect(() => {
        if (!isVisible || !onDismiss) return;
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') onDismiss();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isVisible, onDismiss]);

    const activeMessage = message || "Đang tải dữ liệu...";

    return (
        <Portal>
            <AnimatePresence mode="wait">
                {isVisible && (
                    <m.div
                        key={`loading-overlay-root-${effectiveStyle}`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.18, ease: "easeOut" }}
                        onClick={onDismiss}
                        style={{ willChange: 'opacity' }}
                        className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center p-4 select-none ${
                            effectiveStyle === 'compact'
                                ? 'bg-black/35 dark:bg-black/60'
                                : effectiveStyle === 'vibrant'
                                    ? 'bg-[#faf8f3] dark:bg-[#050804] overflow-hidden'
                                    : 'bg-[#faf8f3]/98 dark:bg-[#070c08]/98'
                        }`}
                    >
                        {/* ============================================================== */}
                        {/* STYLE: AGRI RING (Vòng Xoay Vụ Mùa - Chuẩn Mẫu Thiết Kế Mới)   */}
                        {/* ============================================================== */}
                        {effectiveStyle === 'ring' && (
                            <m.div
                                initial={{ scale: 0.94, opacity: 0, y: 8 }}
                                animate={{ scale: 1, opacity: 1, y: 0 }}
                                exit={{ scale: 0.96, opacity: 0, y: -4 }}
                                transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                                onClick={(e) => e.stopPropagation()}
                                className="relative flex flex-col items-center justify-center text-center max-w-md w-full"
                            >
                                {onDismiss && (
                                    <button
                                        type="button"
                                        onClick={onDismiss}
                                        className="absolute -top-12 right-0 p-2 rounded-full text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
                                        title="Đóng xem thử"
                                    >
                                        <X size={18} />
                                    </button>
                                )}

                                {/* Outer Concentric Circles */}
                                <div className="relative w-44 h-44 sm:w-48 sm:h-48 flex items-center justify-center mb-6">
                                    {/* Outer Dashed Orbit Circle */}
                                    <div className="absolute inset-0 rounded-full border border-dashed border-[#8b6f47]/30 dark:border-emerald-500/25 pointer-events-none" />

                                    {/* Inner Smooth Spinning Progress Ring */}
                                    <div className="relative w-36 h-36 sm:w-40 sm:h-40 flex items-center justify-center">
                                        <svg
                                            className="w-full h-full animate-spin"
                                            viewBox="0 0 100 100"
                                            style={{ 
                                                animationDuration: '1.6s',
                                                transformOrigin: '50% 50%',
                                                willChange: 'transform'
                                            }}
                                        >
                                            <defs>
                                                <linearGradient id="agriRingGrad_overlay" x1="0%" y1="0%" x2="100%" y2="100%">
                                                    <stop offset="0%" stopColor="#34d399" />
                                                    <stop offset="50%" stopColor="#10b981" />
                                                    <stop offset="100%" stopColor="#047857" />
                                                </linearGradient>
                                            </defs>
                                            {/* Background Pale Track */}
                                            <circle
                                                cx="50"
                                                cy="50"
                                                r="42"
                                                stroke="currentColor"
                                                strokeWidth="3.5"
                                                className="text-emerald-900/10 dark:text-emerald-500/15"
                                                fill="none"
                                            />
                                            {/* Spinning Gradient Arc */}
                                            <circle
                                                cx="50"
                                                cy="50"
                                                r="42"
                                                stroke="url(#agriRingGrad_overlay)"
                                                strokeWidth="3.5"
                                                strokeLinecap="round"
                                                strokeDasharray="140 120"
                                                strokeDashoffset="0"
                                                fill="none"
                                            />
                                        </svg>

                                        {/* Center Brand App Icon */}
                                        <m.div
                                            animate={{ scale: [1, 1.04, 1] }}
                                            transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
                                            className="absolute inset-0 flex items-center justify-center pointer-events-none"
                                        >
                                            <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-[22px] sm:rounded-3xl p-1 bg-white/90 dark:bg-[#101712] shadow-md border border-emerald-900/10 dark:border-white/10 flex items-center justify-center overflow-hidden">
                                                <img
                                                    src={logo}
                                                    alt="LyangPOS Mascot"
                                                    className="w-full h-full object-contain filter drop-shadow-sm"
                                                    draggable="false"
                                                />
                                            </div>
                                        </m.div>
                                    </div>
                                </div>

                                {/* Typography: L Y A N G  P O S */}
                                <div className="flex items-center justify-center gap-2.5 text-xs sm:text-sm font-black tracking-[0.35em] uppercase mb-5">
                                    <span className="text-[#8b6f47] dark:text-[#d4a574]">L Y A N G</span>
                                    <span className="text-[#1e5128] dark:text-emerald-400">P O S</span>
                                </div>

                                {/* Rounded White Pill Capsule with Active Status */}
                                <div className="px-7 py-3 rounded-full bg-white dark:bg-[#111a14] shadow-sm hover:shadow border border-emerald-900/10 dark:border-emerald-500/20 max-w-sm sm:max-w-md w-full transition-all">
                                    <p className="text-xs sm:text-sm font-black text-[#1e5128] dark:text-emerald-300 tracking-wider uppercase truncate text-center">
                                        {activeMessage}
                                    </p>
                                </div>

                                {onDismiss && (
                                    <p className="mt-4 text-[9px] text-gray-400 dark:text-gray-500 italic">
                                        (Đang xem thử - Nhấp bất kỳ đâu để đóng)
                                    </p>
                                )}
                            </m.div>
                        )}

                        {/* ============================================================== */}
                        {/* STYLE 1: MINIMAL & LIGHTWEIGHT (Tối giản & Siêu nhẹ)           */}
                        {/* ============================================================== */}
                        {effectiveStyle === 'minimal' && (
                            <m.div
                                initial={{ scale: 0.95, opacity: 0, y: 8 }}
                                animate={{ scale: 1, opacity: 1, y: 0 }}
                                exit={{ scale: 0.96, opacity: 0, y: -4 }}
                                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                                onClick={(e) => e.stopPropagation()}
                                className="relative w-full max-w-[360px] p-6 sm:p-7 bg-white dark:bg-[#101712] rounded-3xl border border-emerald-900/10 dark:border-emerald-500/20 shadow-2xl shadow-emerald-950/15 dark:shadow-black/70 flex flex-col items-center text-center overflow-hidden"
                            >
                                {/* Top emerald glow line */}
                                <div className="absolute top-0 inset-x-8 h-[2px] bg-gradient-to-r from-transparent via-emerald-500 to-transparent opacity-80" />

                                {onDismiss && (
                                    <button
                                        type="button"
                                        onClick={onDismiss}
                                        className="absolute top-3.5 right-3.5 p-1.5 rounded-full text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
                                        title="Đóng xem thử"
                                    >
                                        <X size={15} />
                                    </button>
                                )}

                                {/* Central Animated SVG Spinner + Logo */}
                                <div className="relative w-20 h-20 flex items-center justify-center my-1">
                                    <svg 
                                        className="w-full h-full animate-spin" 
                                        viewBox="0 0 100 100" 
                                        style={{ 
                                            animationDuration: '1.8s',
                                            transformOrigin: '50% 50%',
                                            willChange: 'transform'
                                        }}
                                    >
                                        <defs>
                                            <linearGradient id="minimalGrad_overlay" x1="0%" y1="0%" x2="100%" y2="100%">
                                                <stop offset="0%" stopColor="#2d5016" />
                                                <stop offset="50%" stopColor="#d4a574" />
                                                <stop offset="100%" stopColor="#4a7c59" />
                                            </linearGradient>
                                        </defs>
                                        {/* Background Track Circle */}
                                        <circle 
                                            cx="50" 
                                            cy="50" 
                                            r="42" 
                                            stroke="currentColor" 
                                            strokeWidth="4" 
                                            className="text-emerald-900/10 dark:text-emerald-500/15" 
                                            fill="none" 
                                        />
                                        {/* Spinning Gradient Arc */}
                                        <circle 
                                            cx="50" 
                                            cy="50" 
                                            r="42" 
                                            stroke="url(#minimalGrad_overlay)" 
                                            strokeWidth="4" 
                                            strokeLinecap="round" 
                                            strokeDasharray="180" 
                                            strokeDashoffset="65" 
                                            fill="none" 
                                        />
                                    </svg>

                                    {/* Center Brand Logo with subtle pulse */}
                                    <m.div
                                        animate={{ scale: [1, 1.05, 1] }}
                                        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                                        className="absolute inset-0 flex items-center justify-center pointer-events-none"
                                    >
                                        <div className="w-12 h-12 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/50 p-2 border border-emerald-900/5 dark:border-white/5 flex items-center justify-center shadow-xs">
                                            <img 
                                                src={logo} 
                                                alt="LyangPOS Logo" 
                                                className="w-full h-full object-contain filter drop-shadow-xs"
                                            />
                                        </div>
                                    </m.div>
                                </div>

                                {/* Brand Title */}
                                <div className="mt-3">
                                    <h3 className="text-xl sm:text-2xl font-black tracking-tight text-[#2d5016] dark:text-emerald-400">
                                        Lyang<span className="text-[#d4a574] dark:text-amber-400">POS</span>
                                    </h3>
                                    <div className="flex items-center justify-center gap-1.5 text-[8.5px] font-black uppercase tracking-[0.22em] text-[#4a7c59] dark:text-emerald-400/80 mt-0.5">
                                        <Sparkles size={10} className="text-[#d4a574]" />
                                        <span>QUẢN LÝ VỤ MÙA THÔNG MINH</span>
                                    </div>
                                </div>

                                {/* Dynamic Status Message */}
                                <div className="mt-4.5 w-full flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-900/10 dark:border-emerald-500/15">
                                    <Loader2 size={14} className="animate-spin text-[#d4a574] shrink-0" />
                                    <span className="text-xs font-bold text-gray-800 dark:text-emerald-100 truncate tracking-tight">
                                        {activeMessage}
                                    </span>
                                </div>

                                {/* High-Performance Progress Bar */}
                                <div className="mt-4 w-full h-1 bg-emerald-950/5 dark:bg-white/10 rounded-full overflow-hidden">
                                    <m.div
                                        className="h-full bg-gradient-to-r from-[#2d5016] via-[#d4a574] to-[#4a7c59] rounded-full"
                                        animate={{ x: ["-100%", "100%"] }}
                                        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                                        style={{ width: "45%" }}
                                    />
                                </div>

                                {/* Footer micro status */}
                                <div className="mt-3 flex items-center justify-center gap-1.5 text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    <span>Giao diện siêu nhẹ • Tối ưu 60fps</span>
                                </div>

                                {onDismiss && (
                                    <p className="mt-2 text-[9px] text-gray-400 dark:text-gray-500 italic">
                                        (Đang xem thử - Nhấp bất kỳ đâu để đóng)
                                    </p>
                                )}
                            </m.div>
                        )}

                        {/* ============================================================== */}
                        {/* STYLE 2: COMPACT PILL (Thanh nổi Siêu gọn)                    */}
                        {/* ============================================================== */}
                        {effectiveStyle === 'compact' && (
                            <m.div
                                initial={{ scale: 0.92, opacity: 0, y: 10 }}
                                animate={{ scale: 1, opacity: 1, y: 0 }}
                                exit={{ scale: 0.94, opacity: 0, y: -6 }}
                                transition={{ duration: 0.18, ease: "easeOut" }}
                                onClick={(e) => e.stopPropagation()}
                                className="relative px-5 py-3.5 bg-white/95 dark:bg-[#101712]/95 rounded-2xl border border-emerald-900/15 dark:border-emerald-500/20 shadow-2xl shadow-black/25 flex items-center gap-3.5 max-w-sm mx-4 backdrop-blur-md"
                            >
                                <div className="relative w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center border border-emerald-900/10 dark:border-white/5 shrink-0">
                                    <img src={logo} alt="LyangPOS" className="w-5 h-5 object-contain" />
                                </div>
                                <div className="flex flex-col text-left min-w-0 pr-1">
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-[10px] font-black uppercase text-[#2d5016] dark:text-emerald-400 tracking-wider">LyangPOS</span>
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping inline-block" />
                                    </div>
                                    <span className="text-xs font-bold text-gray-800 dark:text-gray-100 truncate mt-0.5">
                                        {activeMessage}
                                    </span>
                                </div>
                                <Loader2 size={18} className="animate-spin text-[#d4a574] shrink-0 ml-1" />
                                {onDismiss && (
                                    <button
                                        type="button"
                                        onClick={onDismiss}
                                        className="ml-1 p-1 text-gray-400 hover:text-gray-700 dark:hover:text-white cursor-pointer"
                                        title="Đóng"
                                    >
                                        <X size={14} />
                                    </button>
                                )}
                            </m.div>
                        )}

                        {/* ============================================================== */}
                        {/* STYLE 3: VIBRANT & CINEMATIC (Sinh động & Hoạt họa gốc)        */}
                        {/* ============================================================== */}
                        {effectiveStyle === 'vibrant' && (
                            <>
                                {/* Animated Mesh Gradient Background with GPU acceleration */}
                                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                                    <m.div 
                                        animate={{
                                            scale: [1, 1.15, 1],
                                            x: [0, 40, 0],
                                            y: [0, 20, 0],
                                        }}
                                        transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                                        className="absolute -top-[10%] -left-[10%] w-[60%] h-[60%] bg-[#4a7c59]/15 dark:bg-[#4ade80]/10 blur-[75px] rounded-full transform-gpu"
                                    />
                                    <m.div 
                                        animate={{
                                            scale: [1.15, 1, 1.15],
                                            x: [0, -30, 0],
                                            y: [0, -40, 0],
                                        }}
                                        transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
                                        className="absolute -bottom-[10%] -right-[10%] w-[50%] h-[50%] bg-[#f4c430]/15 dark:bg-[#f4c430]/10 blur-[75px] rounded-full transform-gpu"
                                    />
                                    <m.div 
                                        animate={{
                                            scale: [1, 1.3, 1],
                                            opacity: [0.3, 0.5, 0.3],
                                        }}
                                        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40%] h-[40%] bg-[#d4a574]/15 dark:bg-[#d4a574]/10 blur-[65px] rounded-full transform-gpu"
                                    />
                                </div>

                                {onDismiss && (
                                    <button
                                        type="button"
                                        onClick={onDismiss}
                                        className="absolute top-6 right-6 z-20 p-2 rounded-full bg-white/40 dark:bg-black/40 backdrop-blur-md text-gray-700 dark:text-white border border-white/20 hover:scale-105 transition-all cursor-pointer"
                                        title="Đóng xem thử"
                                    >
                                        <X size={18} />
                                    </button>
                                )}

                                {/* Content Container */}
                                <m.div
                                    initial={{ y: 16, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    exit={{ y: -16, opacity: 0 }}
                                    transition={{ duration: 0.22, ease: "easeOut" }}
                                    onClick={(e) => e.stopPropagation()}
                                    className="relative z-10 flex flex-col items-center"
                                >
                                    {/* Logo with Glow Effect */}
                                    <div className="relative group mb-8">
                                        <m.div
                                            animate={{ 
                                                scale: [1, 1.05, 1],
                                                rotate: [0, 2, -2, 0]
                                            }}
                                            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                                            className="relative z-10 w-32 h-32 md:w-40 md:h-40 flex items-center justify-center p-4 bg-white/40 dark:bg-white/5 backdrop-blur-2xl rounded-[2.5rem] shadow-2xl border border-white/20"
                                        >
                                            <img 
                                                src={logo} 
                                                alt="LyangPOS Logo" 
                                                className="w-full h-full object-contain filter drop-shadow-lg"
                                            />
                                        </m.div>

                                        {/* Background Rings */}
                                        <m.div 
                                            animate={{ rotate: 360 }}
                                            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                                            className="absolute inset-[-15px] border border-[#2d5016]/20 dark:border-white/10 rounded-[3rem] opacity-50"
                                        />
                                        <m.div 
                                            animate={{ rotate: -360 }}
                                            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                                            className="absolute inset-[-30px] border border-[#d4a574]/10 dark:border-white/5 rounded-[3.5rem] opacity-30"
                                        />
                                        
                                        {/* Orbiting Particles */}
                                        {[0, 72, 144, 216, 288].map((angle, i) => (
                                            <m.div
                                                key={i}
                                                animate={{
                                                    rotate: [angle, angle + 360],
                                                }}
                                                transition={{ duration: 8 + i, repeat: Infinity, ease: "linear" }}
                                                className="absolute inset-0 pointer-events-none"
                                            >
                                                <m.div 
                                                    animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                                                    transition={{ duration: 2, repeat: Infinity, delay: i * 0.4 }}
                                                    className="absolute top-[-40px] left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-gradient-to-br from-[#4a7c59] to-[#f4c430] shadow-[0_0_10px_#f4c430]"
                                                />
                                            </m.div>
                                        ))}
                                    </div>

                                    {/* Brand & Loading Info */}
                                    <div className="text-center space-y-6">
                                        <div>
                                            <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-[#2d5016] dark:text-white mb-2">
                                                Lyang<span className="text-[#d4a574]">POS</span>
                                            </h1>
                                            <div className="flex items-center justify-center gap-2 text-[#4a7c59] dark:text-[#4ade80] font-bold text-sm uppercase tracking-[0.3em] opacity-80">
                                                <Sparkles size={14} />
                                                <span>QUẢN LÝ VỤ MÙA THÔNG MINH</span>
                                            </div>
                                        </div>

                                        <m.div 
                                            className="px-6 py-3 bg-white/30 dark:bg-white/5 backdrop-blur-md rounded-2xl border border-white/20 shadow-xl inline-flex items-center gap-3"
                                            animate={{ scale: [1, 1.02, 1] }}
                                            transition={{ duration: 2, repeat: Infinity }}
                                        >
                                            <Loader2 className="animate-spin text-[#d4a574]" size={20} />
                                            <div className="text-left overflow-hidden h-5 min-w-[200px]">
                                                {message && message !== "Đang khởi động hệ thống..." ? (
                                                    <p className="text-[#2d5016] dark:text-white/80 font-bold text-sm tracking-tight truncate">
                                                        {message}
                                                    </p>
                                                ) : (
                                                    <AnimatePresence mode="wait">
                                                        <m.p
                                                            key={hintIndex}
                                                            initial={{ y: 20, opacity: 0 }}
                                                            animate={{ y: 0, opacity: 1 }}
                                                            exit={{ y: -20, opacity: 0 }}
                                                            transition={{ duration: 0.2 }}
                                                            className="text-[#2d5016] dark:text-white/80 font-bold text-sm tracking-tight"
                                                        >
                                                            {hints[hintIndex]}
                                                        </m.p>
                                                    </AnimatePresence>
                                                )}
                                            </div>
                                        </m.div>
                                    </div>

                                    {/* Modern Progress Line */}
                                    <div className="mt-12 w-64 md:w-80 h-1.5 bg-gray-200/50 dark:bg-white/10 rounded-full overflow-hidden backdrop-blur-sm">
                                        <m.div
                                            className="h-full bg-gradient-to-r from-[#2d5016] via-[#f4c430] to-[#4a7c59]"
                                            animate={{
                                                x: ["-100%", "100%"]
                                            }}
                                            transition={{
                                                duration: 2.5,
                                                repeat: Infinity,
                                                ease: "easeInOut"
                                            }}
                                            style={{ width: "60%", filter: "drop-shadow(0 0 8px rgba(244,196,48,0.5))" }}
                                        />
                                    </div>

                                    {/* Features Preview (Decorative) */}
                                    <div className="mt-16 grid grid-cols-3 gap-8 opacity-40">
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="w-10 h-10 rounded-xl bg-white/20 dark:bg-white/5 flex items-center justify-center">
                                                <Database size={20} />
                                            </div>
                                            <span className="text-[10px] font-bold uppercase tracking-widest">Data</span>
                                        </div>
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="w-10 h-10 rounded-xl bg-white/20 dark:bg-white/5 flex items-center justify-center">
                                                <RefreshCw size={20} />
                                            </div>
                                            <span className="text-[10px] font-bold uppercase tracking-widest">Sync</span>
                                        </div>
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="w-10 h-10 rounded-xl bg-white/20 dark:bg-white/5 flex items-center justify-center">
                                                <Zap size={20} />
                                            </div>
                                            <span className="text-[10px] font-bold uppercase tracking-widest">Fast</span>
                                        </div>
                                    </div>

                                    {onDismiss && (
                                        <p className="mt-6 text-[10px] text-gray-400 dark:text-gray-500 italic">
                                            (Đang xem thử - Nhấp bất kỳ đâu để đóng)
                                        </p>
                                    )}
                                </m.div>

                                {/* Corner Accents */}
                                <div className="absolute top-0 left-0 w-32 h-32 border-t-2 border-l-2 border-[#2d5016]/10 rounded-br-[100px]" />
                                <div className="absolute bottom-0 right-0 w-32 h-32 border-b-2 border-r-2 border-[#d4a574]/10 rounded-tl-[100px]" />
                            </>
                        )}
                    </m.div>
                )}
            </AnimatePresence>
        </Portal>
    );
};

export default LoadingOverlay;
