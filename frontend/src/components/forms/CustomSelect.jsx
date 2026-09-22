import React, { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { m, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check, Search, X } from 'lucide-react';
import { cn, removeAccents } from '../../lib/utils';

export default function CustomSelect({
    value,
    onChange,
    options = [],
    className,
    buttonClassName,
    dropdownClassName,
    placeholder = "Chọn...",
    disabled = false,
    searchable,
    searchPlaceholder = "Tìm kiếm...",
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [dropUp, setDropUp] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    const [coords, setCoords] = useState({ top: 0, left: 0, width: 0, bottom: 0 });
    const containerRef = useRef(null);
    const searchInputRef = useRef(null);
    const listRef = useRef(null);
    const itemRefs = useRef([]);
    const isUsingKeyboardRef = useRef(false);

    // Normalize options if they are simple values
    const normalizedOptions = useMemo(() => {
        return (options || []).map(opt => {
            if (opt === null || opt === undefined) return { value: '', label: '' };
            if (typeof opt === 'object') {
                const val = opt.value !== undefined ? opt.value : (opt.id !== undefined ? opt.id : opt.key);
                const lab = opt.label !== undefined ? opt.label : (opt.name !== undefined ? opt.name : String(val));
                return { ...opt, value: val, label: String(lab) };
            }
            return { value: opt, label: String(opt) };
        });
    }, [options]);

    const selectedOption = normalizedOptions.find(opt => opt.value === value) ||
        normalizedOptions.find(opt => String(opt.value) === String(value));

    // Enable search if searchable is true or if more than 6 options
    const shouldShowSearch = searchable !== undefined ? searchable : normalizedOptions.length > 6;

    const filteredOptions = useMemo(() => {
        if (!searchTerm.trim()) return normalizedOptions;
        const term = searchTerm.toLowerCase();
        const termNoAccent = removeAccents(term);
        return normalizedOptions.filter(opt => {
            const lab = (opt.label || '').toLowerCase();
            return lab.includes(term) || removeAccents(lab).includes(termNoAccent);
        });
    }, [normalizedOptions, searchTerm]);

    // Update coordinates when opened
    const updateCoords = () => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        const shouldDropUp = spaceBelow < 220 && rect.top > 220;
        setDropUp(shouldDropUp);

        const targetWidth = Math.max(rect.width, 160);
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

    // Initialize highlight and focus when opening
    useEffect(() => {
        if (isOpen) {
            updateCoords();
            setSearchTerm('');
            isUsingKeyboardRef.current = false;
            const selectedIdx = normalizedOptions.findIndex(opt =>
                opt.value === value || String(opt.value) === String(value)
            );
            const initialIdx = selectedIdx >= 0 ? selectedIdx : (normalizedOptions.length > 0 ? 0 : -1);
            setHighlightedIndex(initialIdx);

            if (shouldShowSearch) {
                setTimeout(() => {
                    searchInputRef.current?.focus();
                }, 50);
            }

            // Scroll to initial selected item
            setTimeout(() => {
                if (listRef.current && initialIdx >= 0) {
                    const el = itemRefs.current[initialIdx];
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
            }, 60);
        }
    }, [isOpen]);

    // Reset highlightedIndex when search term changes
    useEffect(() => {
        if (isOpen && searchTerm.trim()) {
            setHighlightedIndex(0);
        }
    }, [searchTerm]);

    // Scroll highlighted item into view
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

    // Handle scroll/resize to close dropdown so it doesn't float away
    useEffect(() => {
        if (!isOpen) return;
        const handleScrollOrResize = (e) => {
            if (e && e.target && (e.target.closest?.('.custom-select-dropdown') || listRef.current?.contains(e.target))) {
                return;
            }
            setIsOpen(false);
        };
        window.addEventListener('scroll', handleScrollOrResize, true);
        window.addEventListener('resize', handleScrollOrResize);
        return () => {
            window.removeEventListener('scroll', handleScrollOrResize, true);
            window.removeEventListener('resize', handleScrollOrResize);
        };
    }, [isOpen]);

    // Handle click outside to close
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                containerRef.current &&
                !containerRef.current.contains(event.target) &&
                !event.target.closest?.('.custom-select-dropdown')
            ) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleToggle = () => {
        if (disabled) return;
        setIsOpen(!isOpen);
    };

    const handleSelect = (optionValue) => {
        if (disabled) return;
        if (typeof onChange === 'function') {
            const simulatedEvent = {
                target: { value: optionValue, name: '' },
                currentTarget: { value: optionValue },
                value: optionValue
            };
            try {
                onChange(simulatedEvent);
            } catch (err) {
                try {
                    onChange(optionValue);
                } catch (e2) {
                    console.error("Error in CustomSelect onChange:", e2);
                }
            }
        }
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
                if (filteredOptions.length > 0) {
                    setHighlightedIndex(prev =>
                        (prev < filteredOptions.length - 1 ? prev + 1 : 0)
                    );
                }
                break;
            case 'ArrowUp':
                e.preventDefault();
                e.stopPropagation();
                isUsingKeyboardRef.current = true;
                if (filteredOptions.length > 0) {
                    setHighlightedIndex(prev =>
                        (prev > 0 ? prev - 1 : filteredOptions.length - 1)
                    );
                }
                break;
            case 'Enter':
                e.preventDefault();
                e.stopPropagation();
                if (filteredOptions.length > 0 && highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
                    handleSelect(filteredOptions[highlightedIndex].value);
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

    return (
        <div
            ref={containerRef}
            className={cn(
                "relative inline-block text-left min-w-[80px]",
                className
            )}
        >
            <button
                type="button"
                onClick={handleToggle}
                onKeyDown={handleKeyDown}
                disabled={disabled}
                className={cn(
                    "w-full flex items-center justify-between gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all focus:outline-none cursor-pointer select-none",
                    "text-stone-800 dark:text-stone-100",
                    isOpen && "ring-2 ring-emerald-500/20 border-emerald-600 dark:border-emerald-500",
                    disabled && "opacity-50 cursor-not-allowed",
                    buttonClassName
                )}
            >
                <span
                    className={cn(
                        "truncate font-preview-sample",
                        !selectedOption && "text-stone-400 dark:text-stone-500 font-normal italic"
                    )}
                    style={selectedOption?.fontFamily ? { fontFamily: selectedOption.fontFamily } : undefined}
                >
                    {selectedOption ? selectedOption.label : placeholder}
                </span>
                <ChevronDown
                    size={13}
                    className={cn(
                        "text-stone-400 dark:text-stone-500 transition-transform duration-200 shrink-0",
                        isOpen && "rotate-180 text-emerald-600 dark:text-emerald-400"
                    )}
                />
            </button>

            {createPortal(
                <AnimatePresence>
                    {isOpen && (
                        <m.div
                            initial={{ opacity: 0, y: dropUp ? 4 : -4, scale: 0.96 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: dropUp ? 4 : -4, scale: 0.96 }}
                            transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
                            tabIndex={-1}
                            onKeyDown={(e) => {
                                if (e.target === searchInputRef.current) return;
                                handleKeyDown(e);
                            }}
                            className={cn(
                                "fixed max-h-60 overflow-hidden rounded-2xl border border-stone-300/80 dark:border-white/10 bg-[#faf8f5]/95 dark:bg-[#142018]/95 backdrop-blur-xl shadow-2xl p-1.5 outline-none z-[99999999] custom-select-dropdown",
                                "flex flex-col shadow-emerald-950/15",
                                dropdownClassName
                            )}
                            style={{
                                left: coords.left,
                                width: coords.width,
                                minWidth: '160px',
                                top: dropUp ? 'auto' : coords.top + 4,
                                bottom: dropUp ? coords.bottom + 4 : 'auto',
                            }}
                        >
                            {/* SEARCH BOX IF OPTIONS > 6 */}
                            {shouldShowSearch && (
                                <div className="p-1 mb-1 border-b border-stone-200/70 dark:border-white/10">
                                    <div className="relative flex items-center">
                                        <Search size={12} className="absolute left-2.5 text-stone-400 pointer-events-none" />
                                        <input
                                            ref={searchInputRef}
                                            type="text"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            onKeyDown={handleKeyDown}
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

                            {/* SCROLLABLE LIST */}
                            <div
                                ref={listRef}
                                onMouseMove={() => { isUsingKeyboardRef.current = false; }}
                                className="max-h-52 overflow-y-auto no-scrollbar space-y-0.5"
                            >
                                {filteredOptions.length > 0 ? (
                                    filteredOptions.map((option, idx) => {
                                        const isSelected = String(option.value) === String(value);
                                        const isClearOption = !option.value && option.value !== 0;
                                        const isHighlighted = highlightedIndex === idx;
                                        return (
                                            <button
                                                key={String(option.value)}
                                                ref={el => (itemRefs.current[idx] = el)}
                                                type="button"
                                                onClick={() => handleSelect(option.value)}
                                                onMouseEnter={() => {
                                                    if (!isUsingKeyboardRef.current) {
                                                        setHighlightedIndex(idx);
                                                    }
                                                }}
                                                style={option.fontFamily ? { fontFamily: option.fontFamily } : undefined}
                                                className={cn(
                                                    "w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-xl text-xs text-left transition-all cursor-pointer font-preview-sample select-none",
                                                    isClearOption && !isSelected && "text-stone-400 dark:text-stone-400 italic",
                                                    isSelected && isHighlighted && "bg-emerald-600 text-white font-black ring-2 ring-emerald-400 shadow-2xs",
                                                    isSelected && !isHighlighted && "bg-emerald-600/15 dark:bg-emerald-500/25 text-emerald-800 dark:text-emerald-300 font-black shadow-2xs",
                                                    !isSelected && isHighlighted && "bg-emerald-600/15 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-200 ring-1 ring-emerald-500/40 font-bold",
                                                    !isSelected && !isHighlighted && "text-stone-700 dark:text-stone-200 font-semibold hover:bg-emerald-600/10 dark:hover:bg-white/5 hover:text-emerald-800 dark:hover:text-emerald-300"
                                                )}
                                            >
                                                <span className="truncate">{option.label}</span>
                                                {isSelected && (
                                                    <Check
                                                        size={13}
                                                        className={cn(
                                                            "shrink-0",
                                                            isSelected && isHighlighted ? "text-white" : "text-emerald-600 dark:text-emerald-400"
                                                        )}
                                                        strokeWidth={2.5}
                                                    />
                                                )}
                                            </button>
                                        );
                                    })
                                ) : (
                                    <div className="py-3 px-2 text-center text-xs text-stone-400 italic">
                                        Không tìm thấy lựa chọn
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
