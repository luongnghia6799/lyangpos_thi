import React, { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { m, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check, Search, X, Plus, Droplets, Leaf, Boxes, Store } from 'lucide-react';
import { cn, normalizeUOM, removeAccents } from '../../lib/utils';
import { UNIT_CATEGORIES, DEFAULT_COMMON_UNITS, getAvailableUnits } from '../../data/unitsData';

export default function UnitSelect({
    value = '',
    onChange,
    existingProducts = [],
    placeholder = 'ĐVT...',
    className = '',
    buttonClassName = '',
    disabled = false,
    size = 'sm', // 'sm' | 'md'
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [dropUp, setDropUp] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedTab, setSelectedTab] = useState('all'); // 'all' | 'liquid' | 'solid' | 'packaging' | 'used'
    const [highlightedIndex, setHighlightedIndex] = useState(0);
    const [coords, setCoords] = useState({ top: 0, left: 0, width: 0, bottom: 0 });

    const containerRef = useRef(null);
    const searchInputRef = useRef(null);
    const dropdownRef = useRef(null);
    const listRef = useRef(null);
    const itemRefs = useRef([]);
    const isUsingKeyboardRef = useRef(false);

    // Danh sách ĐVT thực tế đang dùng trong kho
    const storeUnits = useMemo(() => {
        const set = new Set();
        (existingProducts || []).forEach(p => {
            if (p?.unit) set.add(normalizeUOM(p.unit));
            if (p?.secondary_unit) set.add(normalizeUOM(p.secondary_unit));
        });
        return Array.from(set).filter(Boolean);
    }, [existingProducts]);

    // Tất cả ĐVT có sẵn
    const allUnits = useMemo(() => {
        return getAvailableUnits(existingProducts);
    }, [existingProducts]);

    // Lọc theo Tab danh mục
    const unitsByTab = useMemo(() => {
        if (selectedTab === 'liquid') {
            return UNIT_CATEGORIES.find(c => c.id === 'liquid')?.units || [];
        }
        if (selectedTab === 'solid') {
            return UNIT_CATEGORIES.find(c => c.id === 'solid')?.units || [];
        }
        if (selectedTab === 'packaging') {
            return UNIT_CATEGORIES.find(c => c.id === 'packaging')?.units || [];
        }
        if (selectedTab === 'used') {
            return storeUnits.length > 0 ? storeUnits : allUnits;
        }
        return allUnits;
    }, [selectedTab, allUnits, storeUnits]);

    // Lọc theo tìm kiếm
    const filteredUnits = useMemo(() => {
        if (!searchTerm.trim()) return unitsByTab;
        const term = searchTerm.toLowerCase();
        const termNoAccent = removeAccents(term);
        return unitsByTab.filter(u => {
            const low = u.toLowerCase();
            return low.includes(term) || removeAccents(low).includes(termNoAccent);
        });
    }, [unitsByTab, searchTerm]);

    const isCustomNew = useMemo(() => {
        if (!searchTerm.trim()) return false;
        const normalizedInput = normalizeUOM(searchTerm.trim());
        return !allUnits.some(u => u.toLowerCase() === normalizedInput.toLowerCase());
    }, [searchTerm, allUnits]);

    const selectableUnits = useMemo(() => {
        const items = [];
        if (isCustomNew) {
            items.push({ type: 'new', value: searchTerm.trim() });
        }
        filteredUnits.forEach(u => {
            items.push({ type: 'unit', value: u });
        });
        return items;
    }, [isCustomNew, searchTerm, filteredUnits]);

    // Cập nhật tọa độ Portal
    const updateCoords = () => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        const shouldDropUp = spaceBelow < 250 && rect.top > 250;
        setDropUp(shouldDropUp);

        const targetWidth = Math.max(rect.width, 240);
        let left = rect.left;
        if (left + targetWidth > window.innerWidth - 8) {
            left = Math.max(8, window.innerWidth - targetWidth - 8);
        }

        setCoords({
            top: rect.bottom,
            bottom: window.innerHeight - rect.top,
            left: Math.max(8, left),
            width: Math.min(targetWidth, window.innerWidth - 16)
        });
    };

    useEffect(() => {
        if (isOpen) {
            updateCoords();
            setSearchTerm('');
            isUsingKeyboardRef.current = false;
            setTimeout(() => {
                searchInputRef.current?.focus();
            }, 60);
        }
    }, [isOpen]);

    // Thiết lập vị trí highlight ban đầu
    useEffect(() => {
        if (!isOpen) return;
        const cur = normalizeUOM(value || '').toLowerCase();
        const matchedIdx = selectableUnits.findIndex(
            it => it.type === 'unit' && it.value.toLowerCase() === cur
        );
        const targetIdx = matchedIdx >= 0 ? matchedIdx : (selectableUnits.length > 0 ? 0 : -1);
        setHighlightedIndex(targetIdx);

        setTimeout(() => {
            if (listRef.current && targetIdx >= 0) {
                const el = itemRefs.current[targetIdx];
                if (el) {
                    const itemRect = el.getBoundingClientRect();
                    const listRect = listRef.current.getBoundingClientRect();
                    if (itemRect.top < listRect.top) {
                        listRef.current.scrollTop -= (listRect.top - itemRect.top + 4);
                    } else if (itemRect.bottom > listRect.bottom) {
                        listRef.current.scrollTop += (itemRect.bottom - listRect.bottom + 4);
                    }
                }
            }
        }, 80);
    }, [isOpen, selectedTab]);

    useEffect(() => {
        if (isOpen && searchTerm.trim()) {
            setHighlightedIndex(0);
        }
    }, [searchTerm]);

    // Tự động cuộn theo phím mũi tên
    useEffect(() => {
        if (!isOpen || !listRef.current || highlightedIndex < 0) return;
        const el = itemRefs.current[highlightedIndex];
        if (el) {
            const itemRect = el.getBoundingClientRect();
            const listRect = listRef.current.getBoundingClientRect();
            if (itemRect.top < listRect.top) {
                listRef.current.scrollTop -= (listRect.top - itemRect.top + 4);
            } else if (itemRect.bottom > listRect.bottom) {
                listRef.current.scrollTop += (itemRect.bottom - listRect.bottom + 4);
            }
        }
    }, [highlightedIndex, isOpen]);

    // Click outside / Scroll
    useEffect(() => {
        if (!isOpen) return;
        const handleScrollOrResize = (e) => {
            if (e && e.target && (e.target.closest?.('.unit-select-dropdown') || dropdownRef.current?.contains(e.target))) {
                return;
            }
            setIsOpen(false);
        };
        const handleClickOutside = (e) => {
            if (
                containerRef.current &&
                !containerRef.current.contains(e.target) &&
                !e.target.closest?.('.unit-select-dropdown')
            ) {
                setIsOpen(false);
            }
        };

        window.addEventListener('mousedown', handleClickOutside);
        window.addEventListener('scroll', handleScrollOrResize, true);
        window.addEventListener('resize', handleScrollOrResize);

        return () => {
            window.removeEventListener('mousedown', handleClickOutside);
            window.removeEventListener('scroll', handleScrollOrResize, true);
            window.removeEventListener('resize', handleScrollOrResize);
        };
    }, [isOpen]);

    const handleSelect = (u) => {
        if (disabled) return;
        const clean = normalizeUOM(u);
        onChange?.(clean);
        setIsOpen(false);
    };

    const handleKeyDown = (e) => {
        if (disabled) return;

        if (!isOpen) {
            if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                e.stopPropagation();
                setIsOpen(true);
            }
            return;
        }

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                e.stopPropagation();
                isUsingKeyboardRef.current = true;
                if (selectableUnits.length > 0) {
                    setHighlightedIndex(prev =>
                        prev < selectableUnits.length - 1 ? prev + 1 : 0
                    );
                }
                break;
            case 'ArrowUp':
                e.preventDefault();
                e.stopPropagation();
                isUsingKeyboardRef.current = true;
                if (selectableUnits.length > 0) {
                    setHighlightedIndex(prev =>
                        prev > 0 ? prev - 1 : selectableUnits.length - 1
                    );
                }
                break;
            case 'Enter':
                e.preventDefault();
                e.stopPropagation();
                if (selectableUnits.length > 0 && highlightedIndex >= 0 && highlightedIndex < selectableUnits.length) {
                    handleSelect(selectableUnits[highlightedIndex].value);
                } else if (searchTerm.trim()) {
                    handleSelect(searchTerm.trim());
                }
                break;
            case 'Escape':
                e.preventDefault();
                e.stopPropagation();
                setIsOpen(false);
                break;
            case 'Tab':
                setIsOpen(false);
                break;
            default:
                break;
        }
    };

    const normalizedValue = normalizeUOM(value);

    return (
        <div ref={containerRef} className={cn("relative inline-block w-full", className)}>
            {/* TRIGGER BUTTON */}
            <button
                type="button"
                onClick={() => !disabled && setIsOpen(prev => !prev)}
                onKeyDown={handleKeyDown}
                disabled={disabled}
                className={cn(
                    "w-full flex items-center justify-between gap-1 transition-all text-center outline-none cursor-pointer select-none",
                    size === 'sm'
                        ? "px-2.5 py-1.5 text-xs font-bold rounded-xl"
                        : "px-3.5 py-2.5 text-sm font-bold rounded-2xl",
                    "border border-stone-400/40 dark:border-white/10 bg-transparent text-stone-800 dark:text-stone-100",
                    "hover:bg-black/[0.02] dark:hover:bg-white/5 hover:border-emerald-500/60 shadow-2xs",
                    isOpen
                        ? "border-emerald-600 ring-2 ring-emerald-500/15"
                        : "focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/15",
                    disabled && "opacity-50 cursor-not-allowed",
                    buttonClassName
                )}
            >
                <span className={cn(
                    "truncate flex-1 font-bold",
                    !normalizedValue && "text-stone-400 font-normal italic"
                )}>
                    {normalizedValue || placeholder}
                </span>
                <ChevronDown
                    size={size === 'sm' ? 12 : 14}
                    className={cn(
                        "text-stone-400 dark:text-stone-500 transition-transform duration-200 shrink-0",
                        isOpen && "rotate-180 text-emerald-600 dark:text-emerald-400"
                    )}
                />
            </button>

            {/* DROPDOWN PORTAL */}
            {typeof document !== 'undefined' && createPortal(
                <AnimatePresence>
                    {isOpen && (
                        <m.div
                            ref={dropdownRef}
                            tabIndex={-1}
                            onKeyDown={(e) => {
                                if (e.target === searchInputRef.current) return;
                                handleKeyDown(e);
                            }}
                            initial={{ opacity: 0, y: dropUp ? 4 : -4, scale: 0.96 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: dropUp ? 4 : -4, scale: 0.96 }}
                            transition={{ duration: 0.15, ease: 'easeOut' }}
                            style={{
                                position: 'fixed',
                                top: dropUp ? 'auto' : coords.top + 4,
                                bottom: dropUp ? coords.bottom + 4 : 'auto',
                                left: coords.left,
                                width: coords.width,
                                minWidth: '240px',
                                zIndex: 99999999,
                            }}
                            className={cn(
                                "unit-select-dropdown rounded-2xl p-2 border shadow-2xl backdrop-blur-xl overflow-hidden flex flex-col",
                                "bg-[#faf8f5]/98 dark:bg-[#142018]/98",
                                "border-emerald-600/20 dark:border-white/10 shadow-emerald-950/20 outline-none"
                            )}
                        >
                            {/* SEARCH & CUSTOM INPUT */}
                            <div className="relative mb-2">
                                <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
                                <input
                                    ref={searchInputRef}
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Tìm hoặc gõ ĐVT mới..."
                                    className="w-full pl-7 pr-7 py-1.5 text-xs font-bold rounded-xl bg-black/5 dark:bg-white/10 border border-stone-300/60 dark:border-white/10 outline-none text-stone-800 dark:text-stone-100 placeholder:text-stone-400 focus:border-emerald-600"
                                />
                                {searchTerm && (
                                    <button
                                        type="button"
                                        onClick={() => setSearchTerm('')}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                                    >
                                        <X size={12} />
                                    </button>
                                )}
                            </div>

                            {/* TABS PHÂN NHÓM ĐVT */}
                            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-1.5 mb-1.5 border-b border-stone-200/70 dark:border-white/10">
                                {[
                                    { id: 'all', label: 'Tất cả' },
                                    { id: 'liquid', label: 'Lỏng', icon: Droplets },
                                    { id: 'solid', label: 'Rắn/Bột', icon: Leaf },
                                    { id: 'packaging', label: 'Quy đổi', icon: Boxes },
                                    ...(storeUnits.length > 0 ? [{ id: 'used', label: 'Đã dùng', icon: Store }] : [])
                                ].map(tab => {
                                    const Icon = tab.icon;
                                    const isActive = selectedTab === tab.id;
                                    return (
                                        <button
                                            key={tab.id}
                                            type="button"
                                            onClick={() => setSelectedTab(tab.id)}
                                            className={cn(
                                                "px-2 py-0.5 rounded-lg text-[10px] font-black whitespace-nowrap flex items-center gap-1 transition-all cursor-pointer",
                                                isActive
                                                    ? "bg-emerald-600 text-white shadow-2xs"
                                                    : "bg-black/5 dark:bg-white/5 text-stone-600 dark:text-stone-300 hover:bg-black/10"
                                            )}
                                        >
                                            {Icon && <Icon size={10} />}
                                            <span>{tab.label}</span>
                                        </button>
                                    );
                                })}
                            </div>

                            {/* GRID CÁC ĐƠN VỊ TÍNH */}
                            <div
                                ref={listRef}
                                onMouseMove={() => { isUsingKeyboardRef.current = false; }}
                                className="max-h-52 overflow-y-auto no-scrollbar space-y-1 p-0.5"
                            >
                                {selectableUnits.map((item, idx) => {
                                    const isHighlighted = highlightedIndex === idx;

                                    if (item.type === 'new') {
                                        return (
                                            <button
                                                key="__new__"
                                                ref={el => (itemRefs.current[idx] = el)}
                                                type="button"
                                                onClick={() => handleSelect(item.value)}
                                                onMouseEnter={() => {
                                                    if (!isUsingKeyboardRef.current) {
                                                        setHighlightedIndex(idx);
                                                    }
                                                }}
                                                className={cn(
                                                    "w-full mb-1 p-2 rounded-xl border text-xs font-bold flex items-center justify-between transition-colors cursor-pointer text-left select-none",
                                                    isHighlighted
                                                        ? "bg-emerald-500/25 border-emerald-500 text-emerald-900 dark:text-emerald-200 ring-1 ring-emerald-500"
                                                        : "bg-emerald-500/15 border-emerald-500/30 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-500/25"
                                                )}
                                            >
                                                <span className="truncate">Sử dụng ĐVT mới: <strong>"{normalizeUOM(item.value)}"</strong></span>
                                                <Plus size={13} className="shrink-0 ml-1" />
                                            </button>
                                        );
                                    }

                                    const unit = item.value;
                                    const isSelected = normalizedValue.toLowerCase() === unit.toLowerCase();
                                    return (
                                        <button
                                            key={unit}
                                            ref={el => (itemRefs.current[idx] = el)}
                                            type="button"
                                            onClick={() => handleSelect(unit)}
                                            onMouseEnter={() => {
                                                if (!isUsingKeyboardRef.current) {
                                                    setHighlightedIndex(idx);
                                                }
                                            }}
                                            className={cn(
                                                "w-full px-3 py-1.5 rounded-xl text-xs font-bold flex items-center justify-between transition-all cursor-pointer select-none text-left",
                                                isSelected && isHighlighted && "bg-emerald-600 text-white font-black ring-2 ring-emerald-400 shadow-2xs",
                                                isSelected && !isHighlighted && "bg-emerald-600 text-white shadow-2xs font-black",
                                                !isSelected && isHighlighted && "bg-emerald-600/15 dark:bg-emerald-500/25 text-emerald-800 dark:text-emerald-200 ring-1 ring-emerald-500/40 font-bold",
                                                !isSelected && !isHighlighted && "bg-black/5 dark:bg-white/5 text-stone-700 dark:text-stone-200 hover:bg-emerald-600/10 hover:text-emerald-800 dark:hover:text-emerald-300"
                                            )}
                                        >
                                            <span className="truncate">{unit}</span>
                                            {isSelected && <Check size={12} strokeWidth={3} className="shrink-0 ml-1" />}
                                        </button>
                                    );
                                })}

                                {selectableUnits.length === 0 && (
                                    <div className="py-3 text-center text-xs text-stone-400 italic">
                                        Không có ĐVT phù hợp
                                    </div>
                                )}
                            </div>
                        </m.div>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </div>
    );
}
