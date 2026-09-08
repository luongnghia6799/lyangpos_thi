import React from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';
import { cn } from '../lib/utils';
import Portal from './Portal';

export default function ConfirmModal({
    isOpen,
    title = "Xác nhận",
    message,
    onConfirm,
    onCancel,
    confirmText = "Xác nhận",
    cancelText = "Hủy bỏ",
    type = "warning" // warning, danger, info
}) {
    React.useEffect(() => {
        if (!isOpen) return;

        const handleGlobalKeyDown = (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                e.stopPropagation();
                onConfirm();
            } else if (e.key === 'Escape') {
                e.preventDefault();
                e.stopPropagation();
                onCancel();
            }
        };

        window.addEventListener('keydown', handleGlobalKeyDown, true);
        return () => window.removeEventListener('keydown', handleGlobalKeyDown, true);
    }, [isOpen, onConfirm, onCancel]);

    const colors = {
        warning: "text-amber-600 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200 dark:border-amber-800",
        danger: "text-rose-600 bg-rose-50 dark:bg-rose-950/40 dark:text-rose-400 border-rose-200 dark:border-rose-800",
        info: "text-blue-600 bg-blue-50 dark:bg-blue-950/40 dark:text-blue-400 border-blue-200 dark:border-blue-800",
    };

    const btnColors = {
        warning: "bg-amber-600 hover:bg-amber-700 text-white shadow-amber-500/20",
        danger: "bg-rose-600 hover:bg-rose-700 text-white shadow-rose-500/20",
        info: "bg-primary dark:bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20",
    };

    return (
        <Portal>
            <AnimatePresence>
                {isOpen && (
                    <div className="fixed inset-0 z-[500000] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto android-webview">
                        <m.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                            className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col my-auto relative z-10"
                        >
                            <div className="p-6 flex flex-col items-center text-center">
                                <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center mb-3.5 border", colors[type])}>
                                    <AlertTriangle size={28} />
                                </div>
                                <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100 uppercase tracking-tight mb-2">
                                    {title}
                                </h3>
                                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium whitespace-pre-wrap">
                                    {message}
                                </p>
                            </div>

                            <div className="p-4 bg-slate-50 dark:bg-slate-900/80 border-t border-slate-200 dark:border-slate-800 flex gap-2.5">
                                <button
                                    onClick={onCancel}
                                    className="flex-1 px-4 py-2.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold uppercase tracking-wider border border-slate-300/50 dark:border-slate-700 transition-all active:scale-95 android-touchable"
                                >
                                    {cancelText}
                                </button>
                                <button
                                    onClick={onConfirm}
                                    className={cn("flex-1 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider shadow-md transition-all active:scale-95 android-touchable", btnColors[type])}
                                >
                                    {confirmText}
                                </button>
                            </div>
                        </m.div>
                    </div>
                )}
            </AnimatePresence>
        </Portal>
    );
}
