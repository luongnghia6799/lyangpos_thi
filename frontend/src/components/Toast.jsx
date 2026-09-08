import React, { useEffect } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';
import { cn } from '../lib/utils';

import Portal from './Portal';

const Toast = ({ message, type = 'success', onClose, duration = 3000 }) => {
    const savedCallback = React.useRef(onClose);

    useEffect(() => {
        savedCallback.current = onClose;
    }, [onClose]);

    useEffect(() => {
        const timer = setTimeout(() => {
            savedCallback.current();
        }, duration);
        return () => clearTimeout(timer);
    }, [duration]);

    // Choose icons, background classes, and colors based on type
    let Icon = CheckCircle;
    let iconBg = "bg-emerald-500 shadow-emerald-500/25";
    let borderClass = "border-emerald-500/20";
    let progressBg = "bg-emerald-500";

    if (type === 'error') {
        Icon = AlertCircle;
        iconBg = "bg-rose-500 shadow-rose-500/25";
        borderClass = "border-rose-500/20";
        progressBg = "bg-rose-500";
    } else if (type === 'info') {
        Icon = Info;
        iconBg = "bg-sky-500 shadow-sky-500/25";
        borderClass = "border-sky-500/20";
        progressBg = "bg-sky-500";
    } else if (type === 'warning') {
        Icon = AlertTriangle;
        iconBg = "bg-amber-500 shadow-amber-500/25";
        borderClass = "border-amber-500/20";
        progressBg = "bg-amber-500";
    }

    return (
        <Portal>
            <m.div
                initial={{ opacity: 0, y: -20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.9 }}
                className={cn(
                    "fixed top-6 right-6 z-[2000000] flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl border backdrop-blur-xl no-print overflow-hidden",
                    "bg-transparent text-slate-800 dark:text-white",
                    borderClass
                )}
            >
                <div className={cn("p-2 rounded-xl text-white shadow-lg", iconBg)}>
                    <Icon size={20} />
                </div>
                <div className="flex flex-col min-w-[200px] max-w-[320px]">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 opacity-70">Thông báo</span>
                    <span className="font-bold text-sm tracking-tight text-slate-800 dark:text-white/95 leading-snug">{message}</span>
                </div>
                <button
                    onClick={onClose}
                    className="ml-4 p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors text-slate-500 dark:text-white/60 hover:text-slate-800 dark:hover:text-white"
                >
                    <X size={16} />
                </button>
                <m.div
                    initial={{ width: "100%" }}
                    animate={{ width: "0%" }}
                    transition={{ duration: duration / 1000, ease: "linear" }}
                    className={cn("absolute bottom-0 left-0 h-0.5", progressBg)}
                />
            </m.div>
        </Portal>
    );
};

export default Toast;
