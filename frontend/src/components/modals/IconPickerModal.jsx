import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Search, X, Check, Sparkles, RotateCcw } from 'lucide-react';
import { motion as m, AnimatePresence } from 'framer-motion';
import { POPULAR_ICONS, getLucideIconComponent } from '../../lib/iconConfig';
import Portal from '../widgets/Portal';
import { cn } from '../../lib/utils';

export default function IconPickerModal({
    isOpen,
    onClose,
    target, // { id: string, label: string, currentIconName?: string, anchorRect?: { top, bottom, left, right, width, height } }
    onSelectIcon,
    onResetIcon
}) {
    const [search, setSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const popoutRef = useRef(null);

    // Tính toán vị trí Popout tương đối với anchorRect (vị trí icon vừa click)
    const popoutPosition = useMemo(() => {
        const POPOUT_WIDTH = 380;
        const POPOUT_HEIGHT = 440;
        const PADDING = 12;

        if (!target?.anchorRect) {
            // Fallback ở giữa màn hình nếu không có tọa độ
            return {
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                placement: 'center'
            };
        }

        const { top, bottom, left, right, width, height } = target.anchorRect;
        const vw = typeof window !== 'undefined' ? window.innerWidth : 1200;
        const vh = typeof window !== 'undefined' ? window.innerHeight : 800;

        let calculatedLeft = left;
        // Đảm bảo không tràn màn hình bên phải
        if (calculatedLeft + POPOUT_WIDTH > vw - PADDING) {
            calculatedLeft = vw - POPOUT_WIDTH - PADDING;
        }
        // Đảm bảo không tràn màn hình bên trái
        if (calculatedLeft < PADDING) {
            calculatedLeft = PADDING;
        }

        let calculatedTop = bottom + 8;
        let placement = 'bottom';

        // Nếu phía dưới không đủ chỗ hiển thị, đưa lên phía trên icon
        if (calculatedTop + POPOUT_HEIGHT > vh - PADDING) {
            if (top - POPOUT_HEIGHT - 8 >= PADDING) {
                calculatedTop = top - POPOUT_HEIGHT - 8;
                placement = 'top';
            } else {
                // Nếu cả trên và dưới đều chật, căn vừa vặn trong màn hình
                calculatedTop = Math.max(PADDING, Math.min(vh - POPOUT_HEIGHT - PADDING, bottom + 8));
                placement = 'middle';
            }
        }

        return {
            top: `${calculatedTop}px`,
            left: `${calculatedLeft}px`,
            placement
        };
    }, [target]);

    const categories = useMemo(() => {
        const set = new Set(POPULAR_ICONS.map(i => i.category));
        return ['All', ...Array.from(set)];
    }, []);

    const filteredIcons = useMemo(() => {
        const query = search.trim().toLowerCase();
        return POPULAR_ICONS.filter(item => {
            const matchesCat = selectedCategory === 'All' || item.category === selectedCategory;
            if (!matchesCat) return false;
            if (!query) return true;
            return item.name.toLowerCase().includes(query) || item.label.toLowerCase().includes(query);
        });
    }, [search, selectedCategory]);

    // Đóng khi nhấn phím Escape
    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen || !target) return null;

    const currentName = target.currentIconName;

    return (
        <Portal>
            <AnimatePresence>
                {isOpen && (
                    <div id="icon-popout-picker" className="fixed inset-0 z-[999999] pointer-events-auto">
                        {/* Backdrop vô hình/mờ nhẹ để bấm ra ngoài là đóng Popout */}
                        <div
                            onClick={onClose}
                            className="fixed inset-0 bg-black/20 backdrop-blur-[1px] transition-opacity"
                        />

                        {/* Anchored Popout Card */}
                        <m.div
                            ref={popoutRef}
                            initial={{ opacity: 0, scale: 0.92, y: popoutPosition.placement === 'top' ? 8 : -8 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.92, y: popoutPosition.placement === 'top' ? 8 : -8 }}
                            transition={{ type: "spring", stiffness: 450, damping: 32 }}
                            style={{
                                position: 'fixed',
                                top: popoutPosition.top,
                                left: popoutPosition.left,
                                transform: popoutPosition.transform || 'none',
                                width: '380px',
                                maxHeight: '450px'
                            }}
                            className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-200/90 dark:border-slate-700/80 flex flex-col overflow-hidden z-20 ring-1 ring-black/10 dark:ring-white/10"
                        >
                            {/* Header Popout */}
                            <div className="px-3.5 py-2.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-800/60">
                                <div className="flex items-center gap-2 min-w-0">
                                    <div className="w-7 h-7 rounded-lg bg-emerald-500/10 dark:bg-emerald-500/20 text-[#2d5016] dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20">
                                        <Sparkles size={14} />
                                    </div>
                                    <div className="min-w-0 truncate">
                                        <h3 className="text-xs font-black uppercase tracking-tight text-slate-800 dark:text-white leading-tight">
                                            Chọn Icon Mới
                                        </h3>
                                        <p className="text-[10.5px] text-slate-500 dark:text-slate-400 font-medium truncate">
                                            Vị trí: <strong className="text-emerald-600 dark:text-emerald-400 font-bold">{target.label || target.id}</strong>
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1 shrink-0 ml-2">
                                    {onResetIcon && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                onResetIcon(target.id);
                                                onClose();
                                            }}
                                            className="px-2 py-1 rounded-lg border border-rose-500/30 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 text-[10px] font-bold transition-colors flex items-center gap-1 cursor-pointer"
                                            title="Khôi phục lại icon mặc định"
                                        >
                                            <RotateCcw size={11} />
                                            <span>Mặc định</span>
                                        </button>
                                    )}
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                                    >
                                        <X size={15} />
                                    </button>
                                </div>
                            </div>

                            {/* Search and Category Filter */}
                            <div className="p-2.5 border-b border-slate-100 dark:border-slate-800/80 space-y-2">
                                <div className="relative">
                                    <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type="text"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        placeholder="Tìm icon (Home, Cart, Tiền, Kho...)"
                                        className="w-full pl-8 pr-7 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-medium text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-1.5 focus:ring-emerald-500/50 border border-transparent focus:border-emerald-500 transition-all"
                                        autoFocus
                                    />
                                    {search && (
                                        <button
                                            type="button"
                                            onClick={() => setSearch('')}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                                        >
                                            <X size={12} />
                                        </button>
                                    )}
                                </div>

                                {/* Category pills */}
                                <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-0.5">
                                    {categories.map((cat) => {
                                        const isSelected = selectedCategory === cat;
                                        return (
                                            <button
                                                key={cat}
                                                type="button"
                                                onClick={() => setSelectedCategory(cat)}
                                                className={cn(
                                                    "px-2 py-1 rounded-lg text-[10px] font-bold whitespace-nowrap transition-all border shrink-0 cursor-pointer",
                                                    isSelected
                                                        ? "bg-[#2d5016] dark:bg-emerald-600 text-white border-transparent shadow-xs"
                                                        : "bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 border-slate-200/80 dark:border-slate-700/60 hover:bg-slate-100"
                                                )}
                                            >
                                                {cat === 'All' ? 'Tất cả' : cat}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Icon Grid (Compact 4-column) */}
                            <div className="flex-1 overflow-y-auto p-2.5 min-h-[220px] max-h-[280px]">
                                {filteredIcons.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-10 text-slate-400">
                                        <Search size={26} className="opacity-30 mb-1.5" />
                                        <p className="text-xs font-bold">Không tìm thấy icon phù hợp</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-4 gap-1.5">
                                        {filteredIcons.map((item) => {
                                            const IconComp = getLucideIconComponent(item.name);
                                            if (!IconComp) return null;
                                            const isCurrent = currentName === item.name;

                                            return (
                                                <button
                                                    key={item.name}
                                                    type="button"
                                                    onClick={() => {
                                                        onSelectIcon(target.id, item.name);
                                                        onClose();
                                                    }}
                                                    className={cn(
                                                        "group relative flex flex-col items-center justify-center p-2 rounded-xl border transition-all duration-150 cursor-pointer text-center",
                                                        isCurrent
                                                            ? "bg-emerald-500/15 dark:bg-emerald-500/25 border-emerald-500 text-[#2d5016] dark:text-emerald-300 shadow-xs"
                                                            : "bg-slate-50/60 dark:bg-slate-800/40 border-slate-200/60 dark:border-slate-800/80 hover:bg-emerald-50/60 dark:hover:bg-slate-800 hover:border-emerald-500/40 hover:scale-[1.03]"
                                                    )}
                                                >
                                                    {isCurrent && (
                                                        <div className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-xs">
                                                            <Check size={8} strokeWidth={3} />
                                                        </div>
                                                    )}
                                                    <div className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-700 dark:text-slate-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                                                        <IconComp size={18} />
                                                    </div>
                                                    <span className="text-[9.5px] font-bold text-slate-800 dark:text-slate-200 truncate w-full mt-0.5 leading-tight">
                                                        {item.label}
                                                    </span>
                                                    <span className="text-[8px] font-mono text-slate-400 dark:text-slate-500 truncate w-full leading-none">
                                                        {item.name}
                                                    </span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            <div className="px-3 py-2 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-500">
                                <span className="font-medium">
                                    <strong className="text-slate-700 dark:text-slate-300">{filteredIcons.length}</strong> icon
                                </span>
                                <span className="text-slate-400">
                                    Bấm icon để áp dụng
                                </span>
                            </div>
                        </m.div>
                    </div>
                )}
            </AnimatePresence>
        </Portal>
    );
}
