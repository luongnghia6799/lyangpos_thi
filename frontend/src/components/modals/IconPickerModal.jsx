import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Search, X, Check, Sparkles, RotateCcw, Sliders, Minus, Plus, Layers } from 'lucide-react';
import { motion as m, AnimatePresence } from 'framer-motion';
import { getAllLucideIcons, POPULAR_ICONS, getLucideIconComponent } from '../../lib/iconConfig';
import Portal from '../widgets/Portal';
import { cn } from '../../lib/utils';

const INITIAL_DISPLAY_LIMIT = 80;
const LOAD_MORE_STEP = 60;

const STROKE_PRESETS = [
    { value: 1, label: '1.0' },
    { value: 1.5, label: '1.5' },
    { value: 2, label: '2.0' },
    { value: 2.5, label: '2.5' },
    { value: 3, label: '3.0' }
];

export default function IconPickerModal({
    isOpen,
    onClose,
    target, // { id: string, label: string, currentIconName?: string, currentStrokeWidth?: number, anchorRect?: { top, bottom, left, right, width, height } }
    onSelectIcon,
    onResetIcon
}) {
    const [search, setSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [displayLimit, setDisplayLimit] = useState(INITIAL_DISPLAY_LIMIT);
    const [strokeWidth, setStrokeWidth] = useState(2);
    const [selectedIconName, setSelectedIconName] = useState('');
    const popoutRef = useRef(null);
    const scrollContainerRef = useRef(null);

    // Giữ lại target cuối cùng để animation đóng (exit) có đủ thông tin render mượt mà
    const lastTargetRef = useRef(target);
    if (target) {
        lastTargetRef.current = target;
    }
    const currentTarget = target || lastTargetRef.current;

    // Đồng bộ strokeWidth và selectedIconName khi mở modal
    useEffect(() => {
        if (isOpen && currentTarget) {
            setStrokeWidth(currentTarget.currentStrokeWidth || 2);
            setSelectedIconName(currentTarget.currentIconName || '');
            setSearch('');
            setSelectedCategory('All');
        }
    }, [isOpen, currentTarget?.id]);

    // Lấy danh sách toàn bộ icon an toàn
    const allIcons = useMemo(() => {
        if (!isOpen && !currentTarget) return POPULAR_ICONS;
        return getAllLucideIcons();
    }, [isOpen, currentTarget]);

    // Reset pagination khi search hoặc đổi category
    useEffect(() => {
        setDisplayLimit(INITIAL_DISPLAY_LIMIT);
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTop = 0;
        }
    }, [search, selectedCategory]);

    // Tính toán vị trí Popout tương đối với anchorRect
    const popoutPosition = useMemo(() => {
        const POPOUT_WIDTH = 430;
        const POPOUT_HEIGHT = 530;
        const PADDING = 12;

        if (!currentTarget?.anchorRect) {
            return {
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                placement: 'center'
            };
        }

        const { top, bottom, left, right, width, height } = currentTarget.anchorRect;
        const vw = typeof window !== 'undefined' ? window.innerWidth : 1200;
        const vh = typeof window !== 'undefined' ? window.innerHeight : 800;

        let calculatedLeft = left;
        if (calculatedLeft + POPOUT_WIDTH > vw - PADDING) {
            calculatedLeft = vw - POPOUT_WIDTH - PADDING;
        }
        if (calculatedLeft < PADDING) {
            calculatedLeft = PADDING;
        }

        let calculatedTop = bottom + 8;
        let placement = 'bottom';

        if (calculatedTop + POPOUT_HEIGHT > vh - PADDING) {
            if (top - POPOUT_HEIGHT - 8 >= PADDING) {
                calculatedTop = top - POPOUT_HEIGHT - 8;
                placement = 'top';
            } else {
                calculatedTop = Math.max(PADDING, Math.min(vh - POPOUT_HEIGHT - PADDING, bottom + 8));
                placement = 'middle';
            }
        }

        return {
            top: `${calculatedTop}px`,
            left: `${calculatedLeft}px`,
            placement
        };
    }, [currentTarget]);

    const categories = useMemo(() => {
        const ordered = [
            'All',
            'Phổ biến',
            'Điều hướng',
            'Bán hàng',
            'Kho vận',
            'Giao dịch',
            'Báo cáo',
            'Tài chính',
            'Đối tác',
            'Hệ thống',
            'Tiện ích',
            'Nâng cao',
            'Nông nghiệp',
            'Kho Icon Khác'
        ];
        const existing = new Set(allIcons.map(i => i.category));
        return ordered.filter(cat => cat === 'All' || cat === 'Phổ biến' || existing.has(cat));
    }, [allIcons]);

    const filteredIcons = useMemo(() => {
        const query = search.trim().toLowerCase();
        let baseList = allIcons;

        if (selectedCategory === 'Phổ biến') {
            baseList = POPULAR_ICONS;
        } else if (selectedCategory !== 'All') {
            baseList = allIcons.filter(item => item.category === selectedCategory);
        }

        if (!query) return baseList;

        return baseList.filter(item => {
            return (
                item.name.toLowerCase().includes(query) ||
                (item.label && item.label.toLowerCase().includes(query)) ||
                (item.category && item.category.toLowerCase().includes(query))
            );
        });
    }, [search, selectedCategory, allIcons]);

    const visibleIcons = useMemo(() => {
        return filteredIcons.slice(0, displayLimit);
    }, [filteredIcons, displayLimit]);

    const handleScroll = (e) => {
        const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
        if (scrollHeight - scrollTop - clientHeight < 150) {
            if (displayLimit < filteredIcons.length) {
                setDisplayLimit(prev => Math.min(prev + LOAD_MORE_STEP, filteredIcons.length));
            }
        }
    };

    // Khi thay đổi strokeWidth (áp dụng ngay và giữ state)
    const handleStrokeChange = (newStroke) => {
        const clamped = Math.max(0.75, Math.min(3.5, Math.round(newStroke * 4) / 4));
        setStrokeWidth(clamped);
        if (currentTarget?.id) {
            const activeName = selectedIconName || currentTarget.currentIconName;
            onSelectIcon(currentTarget.id, {
                name: activeName,
                strokeWidth: clamped
            });
        }
    };

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

    const currentName = selectedIconName || currentTarget?.currentIconName;

    return (
        <Portal>
            <AnimatePresence>
                {isOpen && currentTarget && (
                    <div id="icon-popout-picker" className="fixed inset-0 z-[999999] pointer-events-auto select-none">
                        {/* Backdrop fade in/out siêu mượt */}
                        <m.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.18, ease: "easeOut" }}
                            onClick={onClose}
                            className="fixed inset-0 bg-black/25 backdrop-blur-[2px]"
                        />

                        {/* Anchored Popout Card với hiệu ứng Mở & Đóng co giãn mượt mà */}
                        <m.div
                            ref={popoutRef}
                            initial={{
                                opacity: 0,
                                scale: 0.88,
                                y: popoutPosition.placement === 'top' ? 12 : -12,
                                filter: 'blur(4px)'
                            }}
                            animate={{
                                opacity: 1,
                                scale: 1,
                                y: 0,
                                filter: 'blur(0px)'
                            }}
                            exit={{
                                opacity: 0,
                                scale: 0.88,
                                y: popoutPosition.placement === 'top' ? 10 : -10,
                                filter: 'blur(4px)'
                            }}
                            transition={{
                                type: "spring",
                                stiffness: 420,
                                damping: 30,
                                mass: 0.75
                            }}
                            style={{
                                position: 'fixed',
                                top: popoutPosition.top,
                                left: popoutPosition.left,
                                transform: popoutPosition.transform || 'none',
                                width: '430px',
                                maxHeight: '540px'
                            }}
                            className="bg-white/98 dark:bg-slate-900/98 backdrop-blur-2xl rounded-2xl shadow-2xl border border-slate-200/90 dark:border-slate-700/80 flex flex-col overflow-hidden z-20 ring-1 ring-black/10 dark:ring-white/10 origin-center"
                        >
                            {/* Header Popout */}
                            <div className="px-3.5 py-2.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-800/60">
                                <div className="flex items-center gap-2 min-w-0">
                                    <div className="w-7 h-7 rounded-lg bg-emerald-500/10 dark:bg-emerald-500/20 text-[#2d5016] dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20 shadow-xs">
                                        <Sparkles size={14} />
                                    </div>
                                    <div className="min-w-0 truncate">
                                        <h3 className="text-xs font-black uppercase tracking-tight text-slate-800 dark:text-white leading-tight flex items-center gap-1.5">
                                            <span>Tùy Chỉnh Icon & Nét Vẽ</span>
                                            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 font-bold">
                                                {allIcons.length}+
                                            </span>
                                        </h3>
                                        <p className="text-[10.5px] text-slate-500 dark:text-slate-400 font-medium truncate">
                                            Đổi cho: <strong className="text-emerald-600 dark:text-emerald-400 font-bold">{currentTarget.label || currentTarget.id}</strong>
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1 shrink-0 ml-2">
                                    {onResetIcon && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                onResetIcon(currentTarget.id);
                                                onClose();
                                            }}
                                            className="px-2.5 py-1 rounded-lg border border-rose-500/30 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 text-[10.5px] font-bold transition-colors flex items-center gap-1 cursor-pointer"
                                            title="Khôi phục lại icon và độ dày nét mặc định"
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

                            {/* Control Stroke Width */}
                            <div className="px-3 py-2 bg-slate-50/60 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                                <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700 dark:text-slate-300 shrink-0">
                                    <Sliders size={13} className="text-emerald-600 dark:text-emerald-400" />
                                    <span>Độ dày nét:</span>
                                    <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-mono text-[10.5px]">
                                        {strokeWidth.toFixed(2)}px
                                    </span>
                                </div>

                                <div className="flex items-center gap-1">
                                    <button
                                        type="button"
                                        onClick={() => handleStrokeChange(strokeWidth - 0.25)}
                                        className="w-5 h-5 rounded bg-slate-200/70 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 flex items-center justify-center text-slate-600 dark:text-slate-300 cursor-pointer transition-colors"
                                        title="Giảm độ dày nét"
                                    >
                                        <Minus size={10} />
                                    </button>

                                    <div className="flex items-center gap-1 mx-1">
                                        {STROKE_PRESETS.map((p) => {
                                            const isSelected = Math.abs(strokeWidth - p.value) < 0.1;
                                            return (
                                                <button
                                                    key={p.value}
                                                    type="button"
                                                    onClick={() => handleStrokeChange(p.value)}
                                                    className={cn(
                                                        "px-1.5 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-all",
                                                        isSelected
                                                            ? "bg-emerald-600 text-white shadow-xs"
                                                            : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
                                                    )}
                                                >
                                                    {p.label}
                                                </button>
                                            );
                                        })}
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => handleStrokeChange(strokeWidth + 0.25)}
                                        className="w-5 h-5 rounded bg-slate-200/70 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 flex items-center justify-center text-slate-600 dark:text-slate-300 cursor-pointer transition-colors"
                                        title="Tăng độ dày nét"
                                    >
                                        <Plus size={10} />
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
                                        placeholder="Tìm hơn 1400+ icon (Home, Cart, Bell, User, Flame, Wifi...)"
                                        className="w-full pl-8 pr-7 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-medium text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-1.5 focus:ring-emerald-500/50 border border-transparent focus:border-emerald-500 transition-all"
                                        autoFocus
                                    />
                                    {search && (
                                        <button
                                            type="button"
                                            onClick={() => setSearch('')}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
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
                                                {cat === 'All' ? `Tất cả (${allIcons.length})` : cat}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Icon Grid (5-column compact, high-density) */}
                            <div
                                ref={scrollContainerRef}
                                onScroll={handleScroll}
                                className="flex-1 overflow-y-auto p-2 min-h-[240px] max-h-[290px]"
                            >
                                {filteredIcons.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                                        <Search size={28} className="opacity-30 mb-2" />
                                        <p className="text-xs font-bold">Không tìm thấy icon "{search}"</p>
                                        <p className="text-[10px] opacity-70">Thử gõ tên tiếng Anh như: Box, Store, Star, Key...</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-5 gap-1.5">
                                        {visibleIcons.map((item) => {
                                            const IconComp = getLucideIconComponent(item.name);
                                            if (!IconComp) return null;
                                            const isCurrent = currentName === item.name;

                                            return (
                                                <button
                                                    key={item.name}
                                                    type="button"
                                                    title={`${item.label} (${item.name})`}
                                                    onClick={() => {
                                                        setSelectedIconName(item.name);
                                                        onSelectIcon(currentTarget.id, {
                                                            name: item.name,
                                                            strokeWidth
                                                        });
                                                        onClose();
                                                    }}
                                                    className={cn(
                                                        "group relative flex flex-col items-center justify-center p-1.5 rounded-xl border transition-all duration-150 cursor-pointer text-center",
                                                        isCurrent
                                                            ? "bg-emerald-500/15 dark:bg-emerald-500/25 border-emerald-500 text-[#2d5016] dark:text-emerald-300 shadow-xs ring-1 ring-emerald-500"
                                                            : "bg-slate-50/60 dark:bg-slate-800/40 border-slate-200/60 dark:border-slate-800/80 hover:bg-emerald-50/60 dark:hover:bg-slate-800 hover:border-emerald-500/40 hover:scale-[1.04]"
                                                    )}
                                                >
                                                    {isCurrent && (
                                                        <div className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-xs">
                                                            <Check size={8} strokeWidth={3} />
                                                        </div>
                                                    )}
                                                    <div className="w-6 h-6 rounded-lg flex items-center justify-center text-slate-700 dark:text-slate-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                                                        <IconComp size={17} strokeWidth={strokeWidth} />
                                                    </div>
                                                    <span className="text-[9px] font-bold text-slate-800 dark:text-slate-200 truncate w-full mt-0.5 leading-tight">
                                                        {item.label}
                                                    </span>
                                                    <span className="text-[7.5px] font-mono text-slate-400 dark:text-slate-500 truncate w-full leading-none">
                                                        {item.name}
                                                    </span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}

                                {displayLimit < filteredIcons.length && (
                                    <div className="py-2 text-center">
                                        <button
                                            type="button"
                                            onClick={() => setDisplayLimit(prev => Math.min(prev + LOAD_MORE_STEP * 2, filteredIcons.length))}
                                            className="px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 text-[10px] font-bold cursor-pointer transition-colors"
                                        >
                                            Đang hiện {displayLimit}/{filteredIcons.length} icon — Cuộn hoặc bấm để tải thêm
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            <div className="px-3 py-2 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-500">
                                <span className="font-medium flex items-center gap-1">
                                    <Layers size={11} className="text-emerald-600" />
                                    <span>
                                        Hiển thị <strong className="text-slate-700 dark:text-slate-300">{filteredIcons.length}</strong> / {allIcons.length} icon
                                    </span>
                                </span>
                                <span className="text-slate-400">
                                    Bấm vào icon bất kỳ để áp dụng
                                </span>
                            </div>
                        </m.div>
                    </div>
                )}
            </AnimatePresence>
        </Portal>
    );
}
