import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { m, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check, Search, X } from 'lucide-react';
import { cn, removeAccents } from '../../lib/utils';

export default function ThemeSelect({
    value,
    onChange,
    options = [],
    placeholder = '-- Chọn --',
    className = '',
    menuClassName = '',
    searchable,
    searchPlaceholder = 'Tìm kiếm...',
    disabled = false,
    allowClear = true,
    clearLabel = '-- Chưa chọn --',
    size = 'sm', // 'sm' | 'md'
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [highlightedIndex, setHighlightedIndex] = useState(0);
    const [coords, setCoords] = useState({ top: undefined, bottom: undefined, left: 0, width: 180, isUp: false });

    const buttonRef = useRef(null);
    const dropdownRef = useRef(null);
    const searchInputRef = useRef(null);
    const listRef = useRef(null);

    // Chuẩn hóa options thành [{ value, label, raw }]
    const normalizedOptions = useMemo(() => {
        return (options || []).map(opt => {
            if (opt === null || opt === undefined) return { value: '', label: '' };
            if (typeof opt === 'object') {
                const val = opt.value !== undefined ? opt.value : (opt.id !== undefined ? opt.id : opt.key);
                const lab = opt.label !== undefined ? opt.label : (opt.name !== undefined ? opt.name : String(val));
                return { value: val, label: String(lab), raw: opt };
            }
            return { value: opt, label: String(opt), raw: opt };
        });
    }, [options]);

    // Tìm item đang được chọn
    const selectedItem = useMemo(() => {
        return normalizedOptions.find(o => String(o.value) === String(value));
    }, [normalizedOptions, value]);

    // Tự động bật tìm kiếm nếu có từ 7 options trở lên
    const isSearchable = searchable !== undefined ? searchable : normalizedOptions.length > 6;

    // Lọc options theo từ khóa
    const filteredOptions = useMemo(() => {
        if (!searchTerm.trim()) return normalizedOptions;
        const term = searchTerm.toLowerCase();
        const termNoAccent = removeAccents(term);
        return normalizedOptions.filter(opt => {
            const l = opt.label.toLowerCase();
            return l.includes(term) || removeAccents(l).includes(termNoAccent);
        });
    }, [normalizedOptions, searchTerm]);

    // Tính toán tọa độ menu nổi (Portal vào document.body)
    const updateCoords = () => {
        if (!buttonRef.current) return;
        const rect = buttonRef.current.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        const shouldUp = spaceBelow < 210 && rect.top > 210;

        const targetWidth = Math.max(rect.width, 160);
        let left = rect.left;
        if (left + targetWidth > window.innerWidth - 8) {
            left = Math.max(8, window.innerWidth - targetWidth - 8);
        }

        setCoords({
            top: shouldUp ? undefined : rect.bottom + 4,
            bottom: shouldUp ? window.innerHeight - rect.top + 4 : undefined,
            left: Math.max(8, left),
            width: Math.min(targetWidth, window.innerWidth - 16),
            isUp: shouldUp
        });
    };

    useEffect(() => {
        if (isOpen) {
            updateCoords();
            setSearchTerm('');
            setHighlightedIndex(0);
            setTimeout(() => {
                if (isSearchable && searchInputRef.current) {
                    searchInputRef.current.focus();
                }
            }, 50);
        }
    }, [isOpen, isSearchable]);

    // Click outside và đóng khi scroll ngoài dropdown
    useEffect(() => {
        if (!isOpen) return;

        const handleMouseDown = (e) => {
            if (
                buttonRef.current?.contains(e.target) ||
                dropdownRef.current?.contains(e.target)
            ) {
                return;
            }
            setIsOpen(false);
        };

        const handleScroll = (e) => {
            if (dropdownRef.current?.contains(e.target)) return;
            setIsOpen(false);
        };

        window.addEventListener('mousedown', handleMouseDown);
        window.addEventListener('scroll', handleScroll, true);
        window.addEventListener('resize', updateCoords);

        return () => {
            window.removeEventListener('mousedown', handleMouseDown);
            window.removeEventListener('scroll', handleScroll, true);
            window.removeEventListener('resize', updateCoords);
        };
    }, [isOpen]);

    const handleSelect = (val) => {
        onChange?.(val);
        setIsOpen(false);
        buttonRef.current?.focus();
    };

    const handleKeyDown = (e) => {
        if (disabled) return;

        if (!isOpen) {
            if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setIsOpen(true);
            }
            return;
        }

        if (e.key === 'Escape') {
            e.preventDefault();
            setIsOpen(false);
            buttonRef.current?.focus();
            return;
        }

        const totalItems = (allowClear ? 1 : 0) + filteredOptions.length;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setHighlightedIndex(prev => (prev + 1) % Math.max(1, totalItems));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setHighlightedIndex(prev => (prev - 1 + totalItems) % Math.max(1, totalItems));
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (allowClear && highlightedIndex === 0) {
                handleSelect(null);
            } else {
                const optIndex = allowClear ? highlightedIndex - 1 : highlightedIndex;
                if (filteredOptions[optIndex]) {
                    handleSelect(filteredOptions[optIndex].value);
                }
            }
        }
    };

    const isCurrentSelectedEmpty = value === '' || value === null || value === undefined;

    return (
        <div className="relative w-full">
            {/* TRIGGER BUTTON */}
            <button
                ref={buttonRef}
                type="button"
                disabled={disabled}
                onClick={() => !disabled && setIsOpen(prev => !prev)}
                onKeyDown={handleKeyDown}
                className={cn(
                    "w-full flex items-center justify-between gap-1.5 transition-all text-left outline-none cursor-pointer select-none",
                    size === 'sm' ? "px-2.5 py-1.5 text-xs font-bold rounded-xl" : "px-3 py-2 text-sm font-bold rounded-2xl",
                    "border border-stone-400/40 dark:border-white/10 bg-transparent hover:bg-black/[0.02] dark:hover:bg-white/5",
                    "hover:border-emerald-500/60 shadow-2xs",
                    isOpen
                        ? "border-emerald-600 ring-2 ring-emerald-500/15 dark:border-emerald-500"
                        : "focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/15",
                    disabled && "opacity-50 cursor-not-allowed",
                    className
                )}
            >
                <span className={cn(
                    "truncate flex-1 leading-tight",
                    selectedItem
                        ? "text-stone-800 dark:text-stone-100 font-bold"
                        : "text-stone-600 dark:text-stone-300 font-medium"
                )}>
                    {selectedItem ? selectedItem.label : placeholder}
                </span>
                <ChevronDown
                    size={size === 'sm' ? 13 : 15}
                    className={cn(
                        "shrink-0 text-stone-500 transition-transform duration-200",
                        isOpen && "rotate-180 text-emerald-600 dark:text-emerald-400"
                    )}
                />
            </button>

            {/* PORTAL DROPDOWN MENU */}
            {typeof document !== 'undefined' && createPortal(
                <AnimatePresence>
                    {isOpen && (
                        <m.div
                            ref={dropdownRef}
                            initial={{ opacity: 0, scale: 0.95, y: coords.isUp ? 4 : -4 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: coords.isUp ? 4 : -4 }}
                            transition={{ duration: 0.15, ease: 'easeOut' }}
                            style={{
                                position: 'fixed',
                                top: coords.top !== undefined ? `${coords.top}px` : 'auto',
                                bottom: coords.bottom !== undefined ? `${coords.bottom}px` : 'auto',
                                left: `${coords.left}px`,
                                width: `${coords.width}px`,
                                zIndex: 99999,
                            }}
                            className={cn(
                                "rounded-2xl p-1.5 border shadow-2xl backdrop-blur-md overflow-hidden",
                                "bg-[#faf8f5]/95 dark:bg-[#152118]/95",
                                "border-emerald-600/20 dark:border-emerald-500/20 shadow-emerald-950/10",
                                menuClassName
                            )}
                            onKeyDown={handleKeyDown}
                        >
                            {/* SEARCH BOX */}
                            {isSearchable && (
                                <div className="p-1 mb-1 border-b border-stone-200/70 dark:border-white/10">
                                    <div className="relative flex items-center">
                                        <Search size={13} className="absolute left-2.5 text-stone-400 pointer-events-none" />
                                        <input
                                            ref={searchInputRef}
                                            type="text"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            placeholder={searchPlaceholder}
                                            className="w-full pl-7 pr-7 py-1 text-xs font-semibold rounded-lg bg-black/5 dark:bg-white/10 border-none outline-none text-stone-800 dark:text-stone-100 placeholder:text-stone-400"
                                        />
                                        {searchTerm && (
                                            <button
                                                type="button"
                                                onClick={() => setSearchTerm('')}
                                                className="absolute right-2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
                                            >
                                                <X size={12} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* OPTIONS LIST */}
                            <div ref={listRef} className="max-h-56 overflow-y-auto no-scrollbar space-y-0.5">
                                {/* MỤC RỖNG / CLEAR */}
                                {allowClear && !searchTerm && (
                                    <button
                                        type="button"
                                        onClick={() => handleSelect(null)}
                                        className={cn(
                                            "w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-xl text-xs text-left transition-colors cursor-pointer",
                                            isCurrentSelectedEmpty
                                                ? "bg-emerald-600/15 dark:bg-emerald-500/25 text-emerald-800 dark:text-emerald-300 font-bold"
                                                : "text-stone-400 dark:text-stone-400 hover:bg-black/5 dark:hover:bg-white/5 hover:text-stone-600 dark:hover:text-stone-200 italic"
                                        )}
                                    >
                                        <span className="truncate">{clearLabel || placeholder}</span>
                                        {isCurrentSelectedEmpty && (
                                            <Check size={13} className="text-emerald-600 dark:text-emerald-400 shrink-0" strokeWidth={2.5} />
                                        )}
                                    </button>
                                )}

                                {/* DANH SÁCH CÁC MỤC */}
                                {filteredOptions.length > 0 ? (
                                    filteredOptions.map((opt, idx) => {
                                        const isSelected = String(opt.value) === String(value);
                                        return (
                                            <button
                                                key={`${opt.value}-${idx}`}
                                                type="button"
                                                onClick={() => handleSelect(opt.value)}
                                                className={cn(
                                                    "w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-xl text-xs text-left transition-colors cursor-pointer",
                                                    isSelected
                                                        ? "bg-emerald-600/15 dark:bg-emerald-500/25 text-emerald-800 dark:text-emerald-300 font-bold shadow-2xs"
                                                        : "text-stone-700 dark:text-stone-200 font-semibold hover:bg-emerald-600/10 dark:hover:bg-white/5 hover:text-emerald-800 dark:hover:text-emerald-300"
                                                )}
                                            >
                                                <span className="truncate">{opt.label}</span>
                                                {isSelected && (
                                                    <Check size={13} className="text-emerald-600 dark:text-emerald-400 shrink-0" strokeWidth={2.5} />
                                                )}
                                            </button>
                                        );
                                    })
                                ) : (
                                    <div className="py-3 px-2 text-center text-xs text-stone-400 italic">
                                        Không tìm thấy lựa chọn phù hợp
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
