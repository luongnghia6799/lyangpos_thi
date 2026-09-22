import React, { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { m, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check, Search, X, Plus, Building2, Tags, Sparkles } from 'lucide-react';
import { cn, removeAccents } from '../../lib/utils';
import axios from 'axios';

export default function BrandSelect({
    value = '',
    onChange,
    existingProducts = [],
    brandsList = [],
    placeholder = 'Hãng...',
    className = '',
    buttonClassName = '',
    disabled = false,
    size = 'sm', // 'sm' | 'md'
    allowClear = true,
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [dropUp, setDropUp] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterTab, setFilterTab] = useState('all'); // 'all' | 'popular'
    const [highlightedIndex, setHighlightedIndex] = useState(0);
    const [coords, setCoords] = useState({ top: 0, left: 0, width: 0, bottom: 0 });
    const [fetchedBrands, setFetchedBrands] = useState([]);

    const containerRef = useRef(null);
    const searchInputRef = useRef(null);
    const dropdownRef = useRef(null);
    const listRef = useRef(null);
    const itemRefs = useRef([]);
    const isUsingKeyboardRef = useRef(false);

    // Tự động tải danh sách hãng nếu không được truyền vào
    useEffect(() => {
        if (brandsList && brandsList.length > 0) return;
        let isMounted = true;
        axios.get('/api/products/brands')
            .then(res => {
                if (isMounted && Array.isArray(res.data)) {
                    setFetchedBrands(res.data);
                }
            })
            .catch(() => {});
        return () => { isMounted = false; };
    }, [brandsList]);

    // Thống kê số sản phẩm của mỗi hãng
    const brandStats = useMemo(() => {
        const stats = {};
        (existingProducts || []).forEach(p => {
            const b = (p?.brand || '').trim();
            if (b) {
                stats[b] = (stats[b] || 0) + 1;
            }
        });
        return stats;
    }, [existingProducts]);

    // Tổng hợp tất cả các hãng (từ props, fetched, existingProducts và value hiện tại)
    const allBrands = useMemo(() => {
        const set = new Set();
        (brandsList || []).forEach(b => b && set.add(b.trim()));
        (fetchedBrands || []).forEach(b => b && set.add(b.trim()));
        Object.keys(brandStats).forEach(b => b && set.add(b.trim()));
        if (value && typeof value === 'string' && value.trim()) {
            set.add(value.trim());
        }

        return Array.from(set).filter(Boolean).sort((a, b) => {
            const countA = brandStats[a] || 0;
            const countB = brandStats[b] || 0;
            if (countB !== countA) return countB - countA;
            return a.localeCompare(b, 'vi');
        });
    }, [brandsList, fetchedBrands, brandStats, value]);

    // Lọc theo Tab
    const brandsByTab = useMemo(() => {
        if (filterTab === 'popular') {
            return allBrands.filter(b => (brandStats[b] || 0) > 0);
        }
        return allBrands;
    }, [allBrands, filterTab, brandStats]);

    // Lọc theo từ khóa tìm kiếm (bỏ dấu tiếng Việt)
    const filteredBrands = useMemo(() => {
        if (!searchTerm.trim()) return brandsByTab;
        const term = searchTerm.toLowerCase();
        const termNoAccent = removeAccents(term);
        return brandsByTab.filter(b => {
            const low = b.toLowerCase();
            return low.includes(term) || removeAccents(low).includes(termNoAccent);
        });
    }, [brandsByTab, searchTerm]);

    // Kiểm tra xem người dùng có đang gõ một hãng mới hoàn toàn hay không
    const isNewBrand = useMemo(() => {
        if (!searchTerm.trim()) return false;
        const normalized = searchTerm.trim().toLowerCase();
        return !allBrands.some(b => b.toLowerCase() === normalized);
    }, [searchTerm, allBrands]);

    // Danh sách các mục có thể chọn theo thứ tự điều hướng
    const selectableItems = useMemo(() => {
        const items = [];
        if (isNewBrand) {
            items.push({
                type: 'new',
                value: searchTerm.trim(),
                label: `Thêm hãng mới: "${searchTerm.trim()}"`
            });
        }
        if (allowClear && !searchTerm.trim()) {
            items.push({
                type: 'clear',
                value: '',
                label: '-- Không chọn hãng (Để trống) --'
            });
        }
        filteredBrands.forEach(b => {
            items.push({
                type: 'brand',
                value: b,
                label: b
            });
        });
        return items;
    }, [isNewBrand, searchTerm, allowClear, filteredBrands]);

    // Tính toán tọa độ Portal
    const updateCoords = () => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        const shouldDropUp = spaceBelow < 280 && rect.top > 280;
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

    // Thiết lập vị trí highlight ban đầu khi mở hoặc chuyển tab
    useEffect(() => {
        if (!isOpen) return;
        const curVal = (value || '').trim().toLowerCase();
        const matchedIdx = selectableItems.findIndex(
            it => it.type === 'brand' && it.value.toLowerCase() === curVal
        );
        const targetIdx = matchedIdx >= 0 ? matchedIdx : (selectableItems.length > 0 ? 0 : -1);
        setHighlightedIndex(targetIdx);

        // Cuộn tới mục được chọn ban đầu
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
    }, [isOpen, filterTab]);

    // Reset highlightedIndex khi gõ tìm kiếm
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

    // Đóng dropdown khi click ngoài hoặc scroll ngoài dropdown
    useEffect(() => {
        if (!isOpen) return;
        const handleScrollOrResize = (e) => {
            if (e && e.target && (e.target.closest?.('.brand-select-dropdown') || dropdownRef.current?.contains(e.target))) {
                return;
            }
            setIsOpen(false);
        };
        const handleClickOutside = (e) => {
            if (
                containerRef.current &&
                !containerRef.current.contains(e.target) &&
                !e.target.closest?.('.brand-select-dropdown')
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

    const handleSelect = (brandName) => {
        if (disabled) return;
        onChange?.(brandName);
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
                if (selectableItems.length > 0) {
                    setHighlightedIndex(prev =>
                        prev < selectableItems.length - 1 ? prev + 1 : 0
                    );
                }
                break;
            case 'ArrowUp':
                e.preventDefault();
                e.stopPropagation();
                isUsingKeyboardRef.current = true;
                if (selectableItems.length > 0) {
                    setHighlightedIndex(prev =>
                        prev > 0 ? prev - 1 : selectableItems.length - 1
                    );
                }
                break;
            case 'Enter':
                e.preventDefault();
                e.stopPropagation();
                if (selectableItems.length > 0 && highlightedIndex >= 0 && highlightedIndex < selectableItems.length) {
                    handleSelect(selectableItems[highlightedIndex].value);
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

    const displayValue = (value || '').trim();

    return (
        <div ref={containerRef} className={cn("relative inline-block w-full", className)}>
            {/* NÚT TRIGGER BUTTON */}
            <button
                type="button"
                onClick={() => !disabled && setIsOpen(prev => !prev)}
                onKeyDown={handleKeyDown}
                disabled={disabled}
                className={cn(
                    "w-full flex items-center justify-between gap-1.5 transition-all text-left outline-none cursor-pointer select-none",
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
                    !displayValue && "text-stone-400 font-normal italic"
                )}>
                    {displayValue || placeholder}
                </span>

                <div className="flex items-center gap-1 shrink-0">
                    {allowClear && displayValue && !disabled && (
                        <span
                            role="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleSelect('');
                            }}
                            className="p-0.5 rounded-md hover:bg-black/10 dark:hover:bg-white/10 text-stone-400 hover:text-rose-600 transition-colors"
                            title="Bỏ chọn hãng"
                        >
                            <X size={size === 'sm' ? 11 : 13} />
                        </span>
                    )}
                    <ChevronDown
                        size={size === 'sm' ? 12 : 14}
                        className={cn(
                            "text-stone-400 dark:text-stone-500 transition-transform duration-200",
                            isOpen && "rotate-180 text-emerald-600 dark:text-emerald-400"
                        )}
                    />
                </div>
            </button>

            {/* PORTAL DROPDOWN */}
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
                            initial={{ opacity: 0, y: dropUp ? 4 : -4, scale: 0.97 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: dropUp ? 4 : -4, scale: 0.97 }}
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
                                "brand-select-dropdown rounded-2xl p-2 border shadow-2xl backdrop-blur-xl overflow-hidden flex flex-col",
                                "bg-[#faf8f5]/98 dark:bg-[#142018]/98",
                                "border-emerald-600/25 dark:border-white/10 shadow-emerald-950/20 outline-none"
                            )}
                        >
                            {/* SEARCH & INPUT TRỰC TIẾP */}
                            <div className="relative mb-2">
                                <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
                                <input
                                    ref={searchInputRef}
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Tìm hoặc gõ hãng mới..."
                                    className="w-full pl-7 pr-7 py-1.5 text-xs font-bold rounded-xl bg-black/5 dark:bg-white/10 border border-stone-300/60 dark:border-white/10 outline-none text-stone-800 dark:text-stone-100 placeholder:text-stone-400 focus:border-emerald-600"
                                />
                                {searchTerm && (
                                    <button
                                        type="button"
                                        onClick={() => setSearchTerm('')}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 p-0.5"
                                    >
                                        <X size={12} />
                                    </button>
                                )}
                            </div>

                            {/* TABS LỌC HÃNG */}
                            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-1.5 mb-1.5 border-b border-stone-200/70 dark:border-white/10 text-[10px]">
                                <button
                                    type="button"
                                    onClick={() => setFilterTab('all')}
                                    className={cn(
                                        "px-2 py-0.5 rounded-lg font-black whitespace-nowrap transition-all cursor-pointer",
                                        filterTab === 'all'
                                            ? "bg-emerald-600 text-white shadow-2xs"
                                            : "bg-black/5 dark:bg-white/5 text-stone-600 dark:text-stone-300 hover:bg-black/10"
                                    )}
                                >
                                    Tất cả ({allBrands.length})
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFilterTab('popular')}
                                    className={cn(
                                        "px-2 py-0.5 rounded-lg font-black whitespace-nowrap flex items-center gap-1 transition-all cursor-pointer",
                                        filterTab === 'popular'
                                            ? "bg-emerald-600 text-white shadow-2xs"
                                            : "bg-black/5 dark:bg-white/5 text-stone-600 dark:text-stone-300 hover:bg-black/10"
                                    )}
                                >
                                    <Sparkles size={10} />
                                    Phổ biến
                                </button>
                            </div>

                            {/* DANH SÁCH CÁC HÃNG & TÙY CHỌN */}
                            <div
                                ref={listRef}
                                onMouseMove={() => { isUsingKeyboardRef.current = false; }}
                                className="max-h-56 overflow-y-auto no-scrollbar space-y-0.5 p-0.5"
                            >
                                {selectableItems.map((item, idx) => {
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
                                                <span className="truncate">Thêm hãng mới: <strong>"{item.value}"</strong></span>
                                                <Plus size={13} className="shrink-0 ml-1" />
                                            </button>
                                        );
                                    }

                                    if (item.type === 'clear') {
                                        const isSelected = !displayValue;
                                        return (
                                            <button
                                                key="__clear__"
                                                ref={el => (itemRefs.current[idx] = el)}
                                                type="button"
                                                onClick={() => handleSelect('')}
                                                onMouseEnter={() => {
                                                    if (!isUsingKeyboardRef.current) {
                                                        setHighlightedIndex(idx);
                                                    }
                                                }}
                                                className={cn(
                                                    "w-full px-2.5 py-1.5 mb-1 rounded-xl text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer select-none text-left",
                                                    isHighlighted && "bg-stone-200/80 dark:bg-white/15 ring-1 ring-stone-400",
                                                    isSelected ? "bg-black/5 dark:bg-white/5 font-black text-stone-800 dark:text-stone-100" : "text-stone-500 hover:bg-black/5 dark:hover:bg-white/5"
                                                )}
                                            >
                                                <span className="italic text-[11px]">-- Không chọn hãng (Để trống) --</span>
                                                {isSelected && <Check size={11} strokeWidth={3} className="shrink-0 text-emerald-600" />}
                                            </button>
                                        );
                                    }

                                    // item.type === 'brand'
                                    const brandName = item.value;
                                    const isSelected = displayValue.toLowerCase() === brandName.toLowerCase();
                                    const count = brandStats[brandName] || 0;

                                    return (
                                        <button
                                            key={brandName}
                                            ref={el => (itemRefs.current[idx] = el)}
                                            type="button"
                                            onClick={() => handleSelect(brandName)}
                                            onMouseEnter={() => {
                                                if (!isUsingKeyboardRef.current) {
                                                    setHighlightedIndex(idx);
                                                }
                                            }}
                                            className={cn(
                                                "w-full px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center justify-between transition-all cursor-pointer select-none text-left",
                                                isSelected && isHighlighted && "bg-emerald-600 text-white font-black ring-2 ring-emerald-400 shadow-2xs",
                                                isSelected && !isHighlighted && "bg-emerald-600 text-white shadow-2xs font-black",
                                                !isSelected && isHighlighted && "bg-emerald-600/15 dark:bg-emerald-500/25 text-emerald-800 dark:text-emerald-200 ring-1 ring-emerald-500/40 font-bold",
                                                !isSelected && !isHighlighted && "bg-transparent hover:bg-emerald-600/10 hover:text-emerald-800 dark:hover:text-emerald-300 text-stone-800 dark:text-stone-200"
                                            )}
                                        >
                                            <div className="flex items-center gap-2 min-w-0">
                                                <Building2 size={12} className={cn("shrink-0", isSelected ? "text-white" : (isHighlighted ? "text-emerald-600 dark:text-emerald-400" : "text-stone-400"))} />
                                                <span className="truncate">{brandName}</span>
                                            </div>

                                            <div className="flex items-center gap-1.5 shrink-0 ml-2">
                                                {count > 0 && (
                                                    <span className={cn(
                                                        "text-[9.5px] font-black px-1.5 py-0.5 rounded-md tabular-nums",
                                                        isSelected
                                                            ? "bg-white/20 text-white"
                                                            : "bg-stone-200/70 dark:bg-white/10 text-stone-600 dark:text-stone-300"
                                                    )}>
                                                        {count} SP
                                                    </span>
                                                )}
                                                {isSelected && <Check size={12} strokeWidth={3} className="shrink-0" />}
                                            </div>
                                        </button>
                                    );
                                })}

                                {selectableItems.length === 0 && (
                                    <div className="py-4 text-center text-xs text-stone-400 italic">
                                        Không có hãng phù hợp
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
