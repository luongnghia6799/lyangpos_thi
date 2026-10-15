import React, { useEffect } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';
import { cn } from '../../lib/utils';

import Portal from './Portal';

const toastConfig = {
    success: {
        Icon: CheckCircle2,
        title: 'Thành công',
        iconGrad: 'from-emerald-600 via-emerald-700 to-teal-800 text-white shadow-emerald-700/25 border-emerald-400/30',
        badgeColor: 'text-[#2d5016] dark:text-emerald-400',
        borderColor: 'border-[#8b6f47]/25 dark:border-white/15',
        progressBg: 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500',
        glowBg: 'bg-emerald-500/15 dark:bg-emerald-400/10'
    },
    error: {
        Icon: AlertCircle,
        title: 'Thông báo lỗi',
        iconGrad: 'from-rose-500 via-rose-600 to-red-700 text-white shadow-rose-600/25 border-rose-400/30',
        badgeColor: 'text-rose-700 dark:text-rose-400',
        borderColor: 'border-rose-500/30 dark:border-rose-500/25',
        progressBg: 'bg-gradient-to-r from-rose-500 via-red-600 to-rose-500',
        glowBg: 'bg-rose-500/15 dark:bg-rose-400/10'
    },
    warning: {
        Icon: AlertTriangle,
        title: 'Cảnh báo',
        iconGrad: 'from-amber-500 via-amber-600 to-orange-700 text-white shadow-amber-600/25 border-amber-400/30',
        badgeColor: 'text-amber-700 dark:text-amber-400',
        borderColor: 'border-amber-500/30 dark:border-amber-500/25',
        progressBg: 'bg-gradient-to-r from-amber-500 via-orange-600 to-amber-500',
        glowBg: 'bg-amber-500/15 dark:bg-amber-400/10'
    },
    info: {
        Icon: Info,
        title: 'Thông báo',
        iconGrad: 'from-[#8b6f47] via-[#705836] to-[#594326] dark:from-sky-600 dark:to-blue-700 text-white shadow-[#8b6f47]/25 border-[#8b6f47]/30 dark:border-white/20',
        badgeColor: 'text-[#8b6f47] dark:text-[#d4a574]',
        borderColor: 'border-[#8b6f47]/25 dark:border-white/15',
        progressBg: 'bg-gradient-to-r from-[#8b6f47] to-[#d4a574] dark:from-sky-500 dark:to-blue-500',
        glowBg: 'bg-[#8b6f47]/15 dark:bg-[#d4a574]/10'
    }
};

const Toast = ({ message, type = 'success', onClose, duration = 3000 }) => {
    const savedCallback = React.useRef(onClose);

    useEffect(() => {
        savedCallback.current = onClose;
    }, [onClose]);

    useEffect(() => {
        const timer = setTimeout(() => {
            savedCallback.current?.();
        }, duration);
        return () => clearTimeout(timer);
    }, [duration]);

    const cfg = toastConfig[type] || toastConfig.info;
    const Icon = cfg.Icon;

    return (
        <Portal>
            <m.div
                initial={{ opacity: 0, y: -16, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -16, scale: 0.95 }}
                transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                className={cn(
                    "fixed top-6 right-6 z-[2000000] flex items-center gap-3.5 px-5 py-3.5 rounded-2xl border backdrop-blur-2xl no-print overflow-hidden select-none",
                    "bg-[#fbf9f4]/95 dark:bg-[#1a1c1e]/95 text-slate-800 dark:text-slate-100",
                    "shadow-[0_16px_36px_-6px_rgba(45,80,22,0.16),0_4px_12px_rgba(139,111,71,0.08)] dark:shadow-[0_20px_45px_rgba(0,0,0,0.7)]",
                    "ring-1 ring-black/[0.04] dark:ring-white/[0.08]",
                    cfg.borderColor
                )}
            >
                {/* Subtle Ambient Radial Glow */}
                <div className={cn("absolute -top-10 -left-10 w-28 h-28 rounded-full blur-2xl pointer-events-none", cfg.glowBg)} />

                {/* Icon box */}
                <div className={cn(
                    "relative z-1 p-2 rounded-xl text-white shadow-md border flex items-center justify-center shrink-0 bg-gradient-to-br",
                    cfg.iconGrad
                )}>
                    <Icon size={18} strokeWidth={2.5} />
                </div>

                {/* Content */}
                <div className="relative z-1 flex flex-col min-w-[200px] max-w-[340px]">
                    <span className={cn("text-[9.5px] font-black uppercase tracking-[0.16em] leading-none mb-1", cfg.badgeColor)}>
                        {cfg.title}
                    </span>
                    <span className="font-bold text-[13px] tracking-tight text-slate-900 dark:text-slate-100 leading-snug">
                        {message}
                    </span>
                </div>

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="relative z-1 ml-2 w-7 h-7 flex items-center justify-center rounded-xl bg-black/[0.04] dark:bg-white/[0.06] hover:bg-rose-500/15 text-[#8b6f47]/70 dark:text-[#d4a574]/70 hover:text-rose-500 border border-[#8b6f47]/20 dark:border-white/10 transition-all active:scale-90 shrink-0 cursor-pointer"
                    title="Đóng (ESC)"
                >
                    <X size={14} strokeWidth={2.5} />
                </button>

                {/* Progress Bar */}
                <m.div
                    initial={{ width: "100%" }}
                    animate={{ width: "0%" }}
                    transition={{ duration: duration / 1000, ease: "linear" }}
                    className={cn("absolute bottom-0 left-0 h-[2.5px]", cfg.progressBg)}
                />
            </m.div>
        </Portal>
    );
};

export default Toast;

