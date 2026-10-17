import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Search, X, Check, Sparkles, RotateCcw, Sliders, Minus, Plus, Layers, Palette, Globe, Loader2 } from 'lucide-react';
import { motion as m, AnimatePresence } from 'framer-motion';
import { getAllLucideIcons, POPULAR_ICONS, getLucideIconComponent } from '../../lib/iconConfig';
import { getAllDuoIcons } from '../../lib/duoIconsConfig';
import { FEATURED_ICONIFY_LIST, searchIconifyApi, cacheIconPermanently, isIconifyName } from '../../lib/iconifyConfig';
import { Icon as IconifyIcon } from '@iconify/react';
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
    const [activeLibrary, setActiveLibrary] = useState('all'); // 'all' | 'iconify' | 'duo' | 'lucide'
    const [displayLimit, setDisplayLimit] = useState(INITIAL_DISPLAY_LIMIT);
    const [strokeWidth, setStrokeWidth] = useState(2);
    const [selectedIconName, setSelectedIconName] = useState('');
    const [iconifyResults, setIconifyResults] = useState([]);
    const [isSearchingIconify, setIsSearchingIconify] = useState(false);
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
            if (currentTarget.currentIconName && isIconifyName(currentTarget.currentIconName)) {
                setActiveLibrary('iconify');
            } else if (currentTarget.currentIconName && (currentTarget.currentIconName.startsWith('duo:') || currentTarget.currentIconName.startsWith('duo-'))) {
                setActiveLibrary('duo');
            } else {
                setActiveLibrary('all');
            }
        }
    }, [isOpen, currentTarget?.id]);

    const duoIcons = useMemo(() => getAllDuoIcons(), []);

    const lucideIcons = useMemo(() => {
        if (!isOpen && !currentTarget) return POPULAR_ICONS;
        return getAllLucideIcons();
    }, [isOpen, currentTarget]);

    // Tìm kiếm và hiển thị Iconify
    useEffect(() => {
        if (activeLibrary !== 'iconify') return;
        if (!search.trim()) {
            setIconifyResults(FEATURED_ICONIFY_LIST.map(item => ({
                id: item.id,
                name: item.id,
                rawName: item.id.split(':').pop(),
                label: item.label,
                category: item.category,
                library: 'iconify'
            })));
            setIsSearchingIconify(false);
            return;
        }

        setIsSearchingIconify(true);
        const timer = setTimeout(() => {
            searchIconifyApi(search.trim(), 80).then((results) => {
                const mapped = results.map(iconId => {
                    const [collection, rawName] = iconId.includes(':') ? iconId.split(':') : ['', iconId];
                    const friendly = rawName.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                    return {
                        id: iconId,
                        name: iconId,
                        rawName: rawName,
                        label: friendly,
                        category: collection ? collection.toUpperCase() : 'Iconify',
                        library: 'iconify'
                    };
                });
                setIconifyResults(mapped);
                setIsSearchingIconify(false);
            }).catch(() => {
                setIsSearchingIconify(false);
            });
        }, 300);

        return () => clearTimeout(timer);
    }, [search, activeLibrary]);

    // Lấy danh sách toàn bộ icon an toàn theo thư viện
    const allIcons = useMemo(() => {
        if (activeLibrary === 'iconify') return iconifyResults;
        if (activeLibrary === 'duo') return duoIcons;
        if (activeLibrary === 'lucide') return lucideIcons;
        return [
            ...duoIcons,
            ...FEATURED_ICONIFY_LIST.map(item => ({
                id: item.id,
                name: item.id,
                rawName: item.id.split(':').pop(),
                label: item.label,
                category: item.category,
                library: 'iconify'
            })),
            ...lucideIcons
        ];
    }, [activeLibrary, duoIcons, lucideIcons, iconifyResults]);

    // Reset pagination khi search hoặc đổi category hoặc đổi thư viện
    useEffect(() => {
        setDisplayLimit(INITIAL_DISPLAY_LIMIT);
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTop = 0;
        }
    }, [search, selectedCategory, activeLibrary]);

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
        if (activeLibrary === 'iconify') {
            const set = new Set(iconifyResults.map(i => i.category));
            return ['All', ...Array.from(set)];
        }
        const ordered = [
            'All',
            '🎨 Duo Icons',
            'Phổ biến',
            'Điều hướng',
            'Bán hàng',
            'Kho vận',
            'Giao dịch',
            'Báo cáo',
            'Tài chính',
            'Thiết bị & Công nghệ',
            'Đối tác',
            'Hệ thống',
            'Tiện ích',
            'Nâng cao',
            'Nông nghiệp',
            'Kho Icon Khác'
        ];
        const existing = new Set(allIcons.map(i => i.category));
        return ordered.filter(cat => 
            cat === 'All' || 
            (cat === '🎨 Duo Icons' && activeLibrary !== 'duo') || 
            (cat === 'Phổ biến' && activeLibrary !== 'duo') || 
            existing.has(cat)
        );
    }, [allIcons, activeLibrary, iconifyResults]);

    const filteredIcons = useMemo(() => {
        if (activeLibrary === 'iconify') {
            if (selectedCategory === 'All') return iconifyResults;
            return iconifyResults.filter(item => item.category === selectedCategory);
        }

        const query = search.trim().toLowerCase();
        let baseList = allIcons;

        if (selectedCategory === '🎨 Duo Icons') {
            baseList = duoIcons;
        } else if (selectedCategory === 'Phổ biến') {
            baseList = POPULAR_ICONS;
        } else if (selectedCategory !== 'All') {
            baseList = allIcons.filter(item => item.category === selectedCategory);
        }

        if (!query) return baseList;

        return baseList.filter(item => {
            return (
                item.name.toLowerCase().includes(query) ||
                (item.rawName && item.rawName.toLowerCase().includes(query)) ||
                (item.label && item.label.toLowerCase().includes(query)) ||
                (item.category && item.category.toLowerCase().includes(query))
            );
        });
    }, [search, selectedCategory, allIcons, duoIcons, activeLibrary, iconifyResults]);

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
                            className="bg-[#faf8f3]/98 dark:bg-[#0c140e]/98 backdrop-blur-2xl rounded-2xl shadow-2xl border border-[#8b6f47]/30 dark:border-white/10 flex flex-col overflow-hidden z-20 ring-1 ring-black/10 dark:ring-white/10 origin-center text-slate-800 dark:text-slate-100"
                        >
                            {/* Header Popout */}
                            <div className="px-3.5 py-2.5 border-b border-[#8b6f47]/15 dark:border-white/10 flex items-center justify-between bg-[#d4a574]/15 dark:bg-white/[0.02]">
                                <div className="flex items-center gap-2 min-w-0">
                                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#2d5016] to-[#4a7c59] text-white flex items-center justify-center shrink-0 shadow-xs">
                                        <Sparkles size={14} />
                                    </div>
                                    <div className="min-w-0 truncate">
                                        <h3 className="text-xs font-black uppercase tracking-tight text-[#2d5016] dark:text-[#d4a574] leading-tight flex items-center gap-1.5">
                                            <span>Tùy Chỉnh Icon & Nét Vẽ</span>
                                            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[#2d5016]/10 dark:bg-white/10 text-[#2d5016] dark:text-[#d4a574] font-bold">
                                                {allIcons.length}+
                                            </span>
                                        </h3>
                                        <p className="text-[10.5px] text-[#8b6f47] dark:text-slate-400 font-medium truncate">
                                            Đổi cho: <strong className="text-[#2d5016] dark:text-[#d4a574] font-bold">{currentTarget.label || currentTarget.id}</strong>
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
                                        className="p-1.5 rounded-lg text-[#8b6f47] dark:text-slate-400 hover:text-[#2d5016] dark:hover:text-white hover:bg-[#8b6f47]/10 dark:hover:bg-white/10 transition-colors cursor-pointer"
                                    >
                                        <X size={15} />
                                    </button>
                                </div>
                            </div>

                            {/* Library Switcher Tabs */}
                            <div className="px-2.5 pt-2 pb-1.5 border-b border-[#8b6f47]/15 dark:border-white/10 flex items-center gap-1 bg-[#d4a574]/5 dark:bg-white/[0.01]">
                                <button
                                    type="button"
                                    onClick={() => { setActiveLibrary('all'); setSelectedCategory('All'); }}
                                    className={cn(
                                        "flex-1 py-1.5 px-1.5 rounded-xl text-[10px] font-bold transition-all flex items-center justify-center gap-1 border cursor-pointer",
                                        activeLibrary === 'all'
                                            ? "bg-gradient-to-r from-[#2d5016] to-[#3a6320] text-white border-transparent shadow-xs"
                                            : "bg-white/70 dark:bg-white/5 text-[#8b6f47] dark:text-slate-300 border-[#8b6f47]/20 dark:border-white/10 hover:bg-[#8b6f47]/10"
                                    )}
                                >
                                    <Sparkles size={11} className={activeLibrary === 'all' ? "text-amber-300" : "text-[#8b6f47]/70 dark:text-slate-400"} />
                                    <span>Tất cả</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { setActiveLibrary('iconify'); setSelectedCategory('All'); }}
                                    className={cn(
                                        "flex-1 py-1.5 px-1.5 rounded-xl text-[10px] font-bold transition-all flex items-center justify-center gap-1 border cursor-pointer",
                                        activeLibrary === 'iconify'
                                            ? "bg-gradient-to-r from-[#2d5016] to-[#3a6320] text-white border-transparent shadow-xs"
                                            : "bg-white/70 dark:bg-white/5 text-[#8b6f47] dark:text-slate-300 border-[#8b6f47]/20 dark:border-white/10 hover:bg-[#8b6f47]/10"
                                    )}
                                    title="Kho hơn 200,000+ icons (Solar, Flat Color, 3D, Material, Tabler...)"
                                >
                                    <Globe size={11} className={activeLibrary === 'iconify' ? "text-white" : "text-[#8b6f47]/70 dark:text-slate-400"} />
                                    <span>Iconify</span>
                                    <span className={cn(
                                        "text-[8px] px-1 py-0.2 rounded-full font-mono font-black",
                                        activeLibrary === 'iconify' ? "bg-white/20 text-white" : "bg-[#8b6f47]/15 dark:bg-white/10 text-[#8b6f47] dark:text-slate-300"
                                    )}>
                                        200K+
                                    </span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { setActiveLibrary('duo'); setSelectedCategory('All'); }}
                                    className={cn(
                                        "flex-1 py-1.5 px-1.5 rounded-xl text-[10px] font-bold transition-all flex items-center justify-center gap-1 border cursor-pointer",
                                        activeLibrary === 'duo'
                                            ? "bg-gradient-to-r from-[#2d5016] to-[#3a6320] text-white border-transparent shadow-xs"
                                            : "bg-white/70 dark:bg-white/5 text-[#8b6f47] dark:text-slate-300 border-[#8b6f47]/20 dark:border-white/10 hover:bg-[#8b6f47]/10"
                                    )}
                                >
                                    <Layers size={11} className={activeLibrary === 'duo' ? "text-white" : "text-[#8b6f47]/70 dark:text-slate-400"} />
                                    <span>Duo</span>
                                    <span className={cn(
                                        "text-[8.5px] px-1 py-0.2 rounded-full font-mono font-bold",
                                        activeLibrary === 'duo' ? "bg-white/20 text-white" : "bg-[#8b6f47]/15 dark:bg-white/10 text-[#8b6f47] dark:text-slate-300"
                                    )}>
                                        91
                                    </span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { setActiveLibrary('lucide'); setSelectedCategory('All'); }}
                                    className={cn(
                                        "flex-1 py-1.5 px-1.5 rounded-xl text-[10px] font-bold transition-all flex items-center justify-center gap-1 border cursor-pointer",
                                        activeLibrary === 'lucide'
                                            ? "bg-gradient-to-r from-[#2d5016] to-[#3a6320] text-white border-transparent shadow-xs"
                                            : "bg-white/70 dark:bg-white/5 text-[#8b6f47] dark:text-slate-300 border-[#8b6f47]/20 dark:border-white/10 hover:bg-[#8b6f47]/10"
                                    )}
                                >
                                    <Sliders size={11} className={activeLibrary === 'lucide' ? "text-white" : "text-[#8b6f47]/70 dark:text-slate-400"} />
                                    <span>Lucide</span>
                                    <span className={cn(
                                        "text-[8.5px] px-1 py-0.2 rounded-full font-mono font-bold",
                                        activeLibrary === 'lucide' ? "bg-white/20 text-white" : "bg-[#8b6f47]/15 dark:bg-white/10 text-[#8b6f47] dark:text-slate-300"
                                    )}>
                                        1.9k
                                    </span>
                                </button>
                            </div>

                            {/* Control Stroke Width (chỉ hiển thị cho Lucide / Tất cả) */}
                            {(activeLibrary === 'all' || activeLibrary === 'lucide') && (
                                <div className="px-3 py-2 bg-black/[0.02] dark:bg-white/[0.02] border-b border-[#8b6f47]/10 dark:border-white/10 flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#2d5016] dark:text-[#d4a574] shrink-0">
                                        <Sliders size={13} className="text-[#2d5016] dark:text-[#4ade80]" />
                                        <span>Độ dày nét:</span>
                                        <span className="px-1.5 py-0.5 rounded bg-[#2d5016]/10 dark:bg-white/10 text-[#2d5016] dark:text-[#d4a574] font-mono text-[10.5px]">
                                            {strokeWidth.toFixed(2)}px
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-1">
                                        <button
                                            type="button"
                                            onClick={() => handleStrokeChange(strokeWidth - 0.25)}
                                            className="w-5 h-5 rounded bg-[#8b6f47]/10 dark:bg-white/10 hover:bg-[#8b6f47]/20 dark:hover:bg-white/20 flex items-center justify-center text-[#8b6f47] dark:text-slate-300 cursor-pointer transition-colors"
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
                                                                ? "bg-gradient-to-r from-[#2d5016] to-[#3a6320] text-white shadow-xs"
                                                                : "bg-white/70 dark:bg-white/5 text-[#8b6f47] dark:text-slate-300 hover:bg-[#8b6f47]/10"
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
                                            className="w-5 h-5 rounded bg-[#8b6f47]/10 dark:bg-white/10 hover:bg-[#8b6f47]/20 dark:hover:bg-white/20 flex items-center justify-center text-[#8b6f47] dark:text-slate-300 cursor-pointer transition-colors"
                                            title="Tăng độ dày nét"
                                        >
                                            <Plus size={10} />
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Search and Category Filter */}
                            <div className="p-2.5 border-b border-[#8b6f47]/10 dark:border-white/10 space-y-2 bg-black/[0.01] dark:bg-white/[0.01]">
                                <div className="relative">
                                    <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#8b6f47]/60" />
                                    <input
                                        type="text"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        placeholder={
                                            activeLibrary === 'iconify'
                                                ? "Tìm 200k+ icon toàn cầu (cart, shop, food, bill, car, card...)"
                                                : activeLibrary === 'duo'
                                                ? "Tìm trong 91 DuoIcons (Bank, Box, User, Rocket, Car...)"
                                                : "Tìm hơn 1500+ icon (Home, Cart, Bell, User, Flame, Wifi...)"
                                        }
                                        className="w-full pl-8 pr-7 py-1.5 rounded-xl bg-white/80 dark:bg-[#06140e] border border-[#8b6f47]/25 dark:border-white/10 text-xs font-semibold text-slate-800 dark:text-slate-100 placeholder-[#8b6f47]/60 focus:outline-none focus:ring-1.5 focus:ring-[#2d5016]/30 dark:focus:ring-[#4ade80]/30 focus:border-[#2d5016] dark:focus:border-[#4ade80] transition-all"
                                        autoFocus
                                    />
                                    {isSearchingIconify ? (
                                        <Loader2 size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#2d5016] dark:text-[#4ade80] animate-spin" />
                                    ) : search ? (
                                        <button
                                            type="button"
                                            onClick={() => setSearch('')}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 text-[#8b6f47]/60 hover:text-slate-800 dark:hover:text-white p-0.5 cursor-pointer"
                                        >
                                            <X size={12} />
                                        </button>
                                    ) : null}
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
                                                        ? "bg-gradient-to-r from-[#2d5016] to-[#3a6320] text-white border-transparent shadow-xs"
                                                        : "bg-white/70 dark:bg-white/5 text-[#8b6f47] dark:text-slate-300 border-[#8b6f47]/20 dark:border-white/10 hover:bg-[#8b6f47]/10"
                                                )}
                                            >
                                                {cat === 'All' ? `Tất cả (${filteredIcons.length})` : cat}
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
                                {isSearchingIconify && filteredIcons.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-12 text-[#8b6f47] dark:text-slate-400 gap-2">
                                        <Loader2 size={24} className="animate-spin text-[#2d5016] dark:text-[#4ade80]" />
                                        <p className="text-xs font-bold text-[#2d5016] dark:text-[#d4a574]">Đang tìm trong 200,000+ Iconify icons...</p>
                                    </div>
                                ) : filteredIcons.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-12 text-[#8b6f47] dark:text-slate-400">
                                        <Search size={28} className="opacity-30 mb-2" />
                                        <p className="text-xs font-bold">Không tìm thấy icon "{search}"</p>
                                        <p className="text-[10px] opacity-70">
                                            {activeLibrary === 'iconify' 
                                                ? 'Thử gõ từ khóa tiếng Anh ngắn như: cart, money, shop, car, star...' 
                                                : 'Thử gõ tên tiếng Anh như: Bank, Box, Store, Star, Key...'}
                                        </p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-5 gap-1.5">
                                        {visibleIcons.map((item) => {
                                            const isIconify = item.library === 'iconify' || isIconifyName(item.name);
                                            const isDuo = !isIconify && (item.library === 'duo' || (item.name && item.name.startsWith('duo:')));
                                            const IconComp = item.component || getLucideIconComponent(item.name);
                                            const isCurrent = currentName === item.name || currentName === item.rawName || 
                                                (item.name && item.name.startsWith('duo:') && currentName === `duo:${item.rawName}`) || 
                                                (currentName && item.name === `duo:${currentName}`) ||
                                                (isIconify && currentName === (item.id || item.name));

                                            return (
                                                <button
                                                    key={item.id || item.name}
                                                    type="button"
                                                    title={`${item.label} (${item.rawName || item.name}) - ${isIconify ? 'Iconify' : isDuo ? 'DuoIcons' : 'Lucide'}`}
                                                    onClick={() => {
                                                        const finalName = item.id || item.name;
                                                        setSelectedIconName(finalName);
                                                        if (isIconify) {
                                                            cacheIconPermanently(finalName);
                                                        }
                                                        onSelectIcon(currentTarget.id, {
                                                            name: finalName,
                                                            library: isIconify ? 'iconify' : (isDuo ? 'duo' : 'lucide'),
                                                            strokeWidth
                                                        });
                                                        onClose();
                                                    }}
                                                    className={cn(
                                                        "group relative flex flex-col items-center justify-center p-1.5 rounded-xl border transition-all duration-150 cursor-pointer text-center",
                                                        isCurrent
                                                            ? "bg-[#2d5016]/12 dark:bg-[#4ade80]/15 border-[#2d5016] dark:border-[#4ade80] text-[#2d5016] dark:text-[#4ade80] shadow-sm ring-1 ring-[#2d5016] dark:ring-[#4ade80]"
                                                            : "bg-white/75 dark:bg-white/[0.03] border-[#8b6f47]/20 dark:border-white/10 hover:bg-[#2d5016]/8 dark:hover:bg-white/[0.08] hover:border-[#2d5016]/50 dark:hover:border-[#4ade80]/50 hover:scale-[1.04]"
                                                    )}
                                                >
                                                    {isCurrent && (
                                                        <div className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full text-white flex items-center justify-center shadow-xs z-10 bg-[#2d5016] dark:bg-[#4ade80] dark:text-slate-900">
                                                            <Check size={8} strokeWidth={3} />
                                                        </div>
                                                    )}

                                                    <div className="w-6 h-6 rounded-lg flex items-center justify-center transition-colors text-[#2d5016] dark:text-[#a7f3d0] group-hover:text-[#1e3a0f] dark:group-hover:text-white">
                                                        {isIconify ? (
                                                            <IconifyIcon icon={item.id || item.name} width={19} height={19} />
                                                        ) : isDuo ? (
                                                            <IconComp size={18} />
                                                        ) : (
                                                            <IconComp size={17} strokeWidth={strokeWidth} />
                                                        )}
                                                    </div>
                                                    <span className="text-[9px] font-bold text-slate-800 dark:text-slate-100 truncate w-full mt-0.5 leading-tight">
                                                        {item.label}
                                                    </span>
                                                    <span className="text-[7.5px] font-mono text-[#8b6f47]/80 dark:text-slate-400 truncate w-full leading-none">
                                                        {item.rawName || item.name}
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
                                            className="px-3 py-1 rounded-lg bg-[#8b6f47]/10 dark:bg-white/10 hover:bg-[#8b6f47]/20 dark:hover:bg-white/20 text-[#2d5016] dark:text-slate-200 border border-[#8b6f47]/20 dark:border-white/10 text-[10px] font-bold cursor-pointer transition-colors"
                                        >
                                            Đang hiện {displayLimit}/{filteredIcons.length} icon — Cuộn hoặc bấm để tải thêm
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            <div className="px-3 py-2 bg-[#d4a574]/10 dark:bg-white/[0.02] border-t border-[#8b6f47]/15 dark:border-white/10 flex items-center justify-between text-[10px] text-[#8b6f47] dark:text-slate-400">
                                <span className="font-medium flex items-center gap-1">
                                    <Layers size={11} className="text-[#2d5016] dark:text-[#4ade80]" />
                                    <span>
                                        Hiển thị <strong className="text-[#2d5016] dark:text-[#d4a574] font-bold">{filteredIcons.length}</strong> / {allIcons.length} icon
                                    </span>
                                </span>
                                <span className="text-[#8b6f47]/80 dark:text-slate-400">
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
