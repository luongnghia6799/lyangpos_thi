
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { ChevronDown, Search, X, User, Phone, MapPin } from 'lucide-react';
import { cn, removeAccents, formatDebt } from '../lib/utils';

export default function SearchableSelect({
    options,
    value,
    onChange,
    placeholder = "Chọn...",
    className,
    searchPlaceholder = "Tìm kiếm...",
    displayValue, // function or key to display. If string, used as key. If undefined, uses option directly
    valueKey = "id", // Key to use for value
    disabled = false,
    multiple = false,
    onKeyDown: parentKeyDown
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [highlightedIndex, setHighlightedIndex] = useState(0);
    const containerRef = useRef(null);
    const searchInputRef = useRef(null);
    const listRef = useRef(null);

    // Detect if options contain partner objects
    const isPartnerSelect = useMemo(() => {
        return options.some(o => o && typeof o === 'object' && ('debt_balance' in o || 'is_customer' in o || 'is_supplier' in o));
    }, [options]);

    // Filter options based on search
    const filteredOptions = useMemo(() => {
        let filtered = options;
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            const termNoAccent = removeAccents(term);
            
            filtered = options.filter(option => {
                const label = typeof displayValue === 'function'
                    ? displayValue(option)
                    : (displayValue ? option[displayValue] : option);

                const labelStr = String(label).toLowerCase();
                const labelMatch = labelStr.includes(term) || removeAccents(labelStr).includes(termNoAccent);

                const code = (typeof option === 'object' && option.code) ? String(option.code).toLowerCase() : '';
                const codeMatch = code.includes(term) || removeAccents(code).includes(termNoAccent);

                const phone = (typeof option === 'object' && option.phone) ? String(option.phone).toLowerCase() : '';
                const phoneMatch = phone.includes(term);

                return labelMatch || codeMatch || phoneMatch;
            });

            // Sort to prioritize label matches over code/phone matches
            filtered = [...filtered].sort((a, b) => {
                const getLabel = (opt) => {
                    const label = typeof displayValue === 'function'
                        ? displayValue(opt)
                        : (displayValue ? opt[displayValue] : opt);
                    return String(label).toLowerCase();
                };
                const labelA = getLabel(a);
                const labelB = getLabel(b);
                const labelANorm = removeAccents(labelA);
                const labelBNorm = removeAccents(labelB);

                const codeA = (typeof a === 'object' && a.code) ? String(a.code).toLowerCase() : '';
                const codeB = (typeof b === 'object' && b.code) ? String(b.code).toLowerCase() : '';
                const codeANorm = removeAccents(codeA);
                const codeBNorm = removeAccents(codeB);

                const phoneA = (typeof a === 'object' && a.phone) ? String(a.phone).toLowerCase() : '';
                const phoneB = (typeof b === 'object' && b.phone) ? String(b.phone).toLowerCase() : '';

                const getScore = (labelStr, labelNorm, codeStr, codeNorm, phoneStr) => {
                    if (labelStr.startsWith(term)) return 0;
                    if (labelNorm.startsWith(termNoAccent)) return 1;
                    if (labelStr.includes(term) || labelNorm.includes(termNoAccent)) return 2;

                    if (codeStr.startsWith(term)) return 3;
                    if (codeNorm.startsWith(termNoAccent)) return 4;
                    if (codeStr.includes(term) || codeNorm.includes(termNoAccent)) return 5;

                    if (phoneStr.startsWith(term)) return 6;
                    if (phoneStr.includes(term)) return 7;

                    return 8;
                };

                const scoreA = getScore(labelA, labelANorm, codeA, codeANorm, phoneA);
                const scoreB = getScore(labelB, labelBNorm, codeB, codeBNorm, phoneB);

                if (scoreA !== scoreB) {
                    return scoreA - scoreB;
                }
                return labelA.localeCompare(labelB, "vi", { sensitivity: "base" });
            });
        }
        
        // Limit number of rendered items to improve performance
        return filtered.slice(0, 50);
    }, [options, searchTerm, displayValue]);

    useEffect(() => {
        if (isOpen) {
            setHighlightedIndex(0);
            setTimeout(() => searchInputRef.current?.focus(), 100);
        } else {
            setSearchTerm('');
        }
    }, [isOpen]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Scroll highlighted item into view
    useEffect(() => {
        if (isOpen && listRef.current) {
            const item = listRef.current.children[highlightedIndex + 1]; // +1 because index 0 is the placeholder
            if (item) {
                item.scrollIntoView({
                    behavior: 'smooth',
                    block: 'nearest',
                });
            }
        }
    }, [highlightedIndex, isOpen]);

    const handleKeyDown = (e) => {
        if (!isOpen) {
            if (e.key === 'Enter' || e.key === 'ArrowDown' || e.key === ' ') {
                setIsOpen(true);
                e.preventDefault();
            } else if (parentKeyDown) {
                parentKeyDown(e);
            }
            return;
        }

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setHighlightedIndex(prev =>
                    prev < filteredOptions.length - 1 ? prev + 1 : 0
                );
                break;
            case 'ArrowUp':
                e.preventDefault();
                setHighlightedIndex(prev =>
                    prev > 0 ? prev - 1 : filteredOptions.length - 1
                );
                break;
            case 'Enter':
                e.preventDefault();
                if (filteredOptions[highlightedIndex]) {
                    handleSelect(filteredOptions[highlightedIndex]);
                    // If we have a parent handler, let it know we're done selecting
                    if (parentKeyDown) {
                        setTimeout(() => parentKeyDown(e), 50);
                    }
                } else if (!multiple) {
                    setIsOpen(false);
                    if (parentKeyDown) parentKeyDown(e);
                }
                break;
            case 'Escape':
                e.preventDefault();
                setIsOpen(false);
                break;
            case 'Tab':
                setIsOpen(false);
                break;
        }
    };

    const handleSelect = (option) => {
        if (option === "") {
            onChange(multiple ? [] : "");
            if (!multiple) setIsOpen(false);
            return;
        }

        const val = valueKey && typeof option === 'object' ? option[valueKey] : option;

        if (multiple) {
            const currentValues = Array.isArray(value) ? value : [];
            const isSelected = currentValues.some(v => v == val);
            if (isSelected) {
                onChange(currentValues.filter(v => v != val));
            } else {
                onChange([...currentValues, val]);
            }
        } else {
            onChange(val);
            setIsOpen(false);
        }
    };

    const getOptionLabel = (option) => {
        if (!option) return '';
        return typeof displayValue === 'function'
            ? displayValue(option)
            : (displayValue ? option[displayValue] : option);
    };

    const getDisplayLabel = () => {
        if (multiple) {
            const currentValues = Array.isArray(value) ? value : [];
            if (currentValues.length === 0) return placeholder;
            if (currentValues.length === 1) {
                const opt = options.find(o => (valueKey && typeof o === 'object' ? o[valueKey] == currentValues[0] : o == currentValues[0]));
                return opt ? getOptionLabel(opt) : currentValues[0];
            }
            return `Đã chọn ${currentValues.length}`;
        }

        const selectedOption = options.find(o => (valueKey && typeof o === 'object' ? o[valueKey] == value : o === value));
        return selectedOption ? getOptionLabel(selectedOption) : placeholder;
    };

    const isOptionSelected = (option) => {
        const val = valueKey && typeof option === 'object' ? option[valueKey] : option;
        if (multiple) {
            return Array.isArray(value) && value.some(v => v == val);
        }
        return val == value;
    };

    return (
        <div className={cn("relative min-w-[150px]", className)} ref={containerRef}>
            <button
                type="button"
                onClick={() => !disabled && setIsOpen(!isOpen)}
                onKeyDown={handleKeyDown}
                disabled={disabled}
                className={cn(
                    "flex items-center justify-between w-full px-3 py-2 text-xs font-black bg-emerald-50/50 dark:bg-slate-800 border-none rounded-xl outline-none dark:text-emerald-400 transition-all text-left",
                    disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:bg-emerald-100/50 dark:hover:bg-slate-700",
                    multiple && Array.isArray(value) && value.length > 0 && "bg-emerald-100/50 dark:bg-emerald-900/30 ring-1 ring-emerald-500/20"
                )}
            >
                <div className="flex items-center gap-2 overflow-hidden">
                    {multiple && Array.isArray(value) && value.length > 0 && (
                        <div className="flex-shrink-0 w-4 h-4 rounded-full bg-emerald-500 text-white text-[10px] flex items-center justify-center font-bold">
                            {value.length}
                        </div>
                    )}
                    <span className="truncate">{getDisplayLabel()}</span>
                </div>
                <ChevronDown size={14} className={cn("flex-shrink-0 text-emerald-600/50 transition-transform", isOpen && "rotate-180")} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <m.div
                        initial={{ opacity: 0, y: 5, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 5, scale: 0.95 }}
                        transition={{ duration: 0.1 }}
                        className={cn(
                            "absolute top-full left-0 z-50 mt-1 rounded-2xl border overflow-hidden shadow-2xl bg-white/40 dark:bg-black/40 backdrop-blur-xl backdrop-saturate-150 border-white/50 dark:border-white/10",
                            isPartnerSelect ? "min-w-[480px]" : "w-full min-w-[220px]"
                        )}
                    >
                        <div className="p-2 border-b dark:border-slate-700">
                            <div className="relative">
                                <Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    ref={searchInputRef}
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder={searchPlaceholder}
                                    autoComplete="off"
                                    className="w-full pl-7 pr-2 py-1.5 text-xs bg-transparent rounded-lg outline-none border-none dark:text-white font-bold"
                                />
                                {searchTerm && (
                                    <button
                                        onClick={() => { setSearchTerm(''); searchInputRef.current?.focus(); }}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500"
                                    >
                                        <X size={12} />
                                    </button>
                                )}
                            </div>
                        </div>

                        <ul ref={listRef} className="max-h-60 overflow-y-auto no-scrollbar rounded-2xl m-0 p-0 list-none">
                            {!multiple && (
                                <li
                                    className={cn(
                                        "px-3 py-2 text-xs font-bold cursor-pointer transition-colors flex items-center gap-3 !rounded-none",
                                        !value ? "bg-emerald-50/50 dark:bg-emerald-900/20 text-emerald-600" : "hover:bg-slate-50 dark:hover:bg-slate-800 text-gray-700 dark:text-gray-300"
                                    )}
                                    onClick={() => handleSelect("")}
                                >
                                    <div className={cn(
                                        "w-4 h-4 rounded border flex items-center justify-center transition-all flex-shrink-0",
                                        !value ? "bg-emerald-500 border-emerald-500 text-white" : "border-gray-200 dark:border-slate-700 bg-transparent"
                                    )}>
                                        {!value && (
                                            <svg className="w-2.5 h-2.5 fill-current" viewBox="0 0 20 20">
                                                <path d="M0 11l2-2 5 5L18 3l2 2L7 18z" fill="white" />
                                            </svg>
                                        )}
                                    </div>
                                    <span>Tất cả</span>
                                </li>
                            )}

                            {multiple && (
                                <li
                                    className="px-3 py-2 text-[10px] font-black uppercase text-emerald-600/40 border-b dark:border-slate-800 mb-1 flex justify-between items-center bg-emerald-50/20"
                                >
                                    <div
                                        className="flex items-center gap-3 cursor-pointer hover:text-emerald-600 transition-colors flex-1"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            const allVisibleValues = filteredOptions.map(o => (valueKey && typeof o === 'object' ? o[valueKey] : o));
                                            const currentValues = Array.isArray(value) ? value : [];
                                            const isAllSelected = allVisibleValues.every(v => currentValues.includes(v));

                                            if (isAllSelected) {
                                                onChange(currentValues.filter(v => !allVisibleValues.includes(v)));
                                            } else {
                                                const newSet = new Set([...currentValues, ...allVisibleValues]);
                                                onChange(Array.from(newSet));
                                            }
                                        }}
                                    >
                                        <div className={cn(
                                            "w-4 h-4 rounded border flex items-center justify-center transition-all flex-shrink-0",
                                            filteredOptions.length > 0 && filteredOptions.every(o => isOptionSelected(o))
                                                ? "bg-emerald-600 border-emerald-600"
                                                : "border-gray-300 dark:border-slate-600 bg-transparent"
                                        )}>
                                            {filteredOptions.length > 0 && filteredOptions.every(o => isOptionSelected(o)) && (
                                                <div className="w-1.5 h-1.5 rounded-full bg-transparent shadow-sm" />
                                            )}
                                        </div>
                                        <span>Chọn tất cả {searchTerm && "(kết quả tìm kiếm)"}</span>
                                    </div>
                                    {Array.isArray(value) && value.length > 0 && (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleSelect(""); }}
                                            className="text-rose-500 hover:text-rose-600 normal-case"
                                        >
                                            Xóa hết
                                        </button>
                                    )}
                                </li>
                            )}

                            {filteredOptions.length > 0 ? (
                                filteredOptions.map((option, index) => {
                                    const isSelected = isOptionSelected(option);
                                    const isHighlighted = index === highlightedIndex;

                                    if (option && typeof option === 'object' && ('debt_balance' in option || 'is_customer' in option || 'is_supplier' in option)) {
                                        // Premium Partner style
                                        return (
                                            <li
                                                key={valueKey ? option[valueKey] : index}
                                                onClick={() => handleSelect(option)}
                                                onMouseEnter={() => setHighlightedIndex(index)}
                                                className={cn(
                                                    "dropdown-item flex justify-between items-center gap-4 !rounded-none",
                                                    isHighlighted && "active",
                                                    isSelected && !isHighlighted && "bg-emerald-50 dark:bg-emerald-950/20"
                                                )}
                                            >
                                                <div className="flex items-center gap-4 relative z-10">
                                                    <div className={cn(
                                                        "w-4 h-4 rounded border flex items-center justify-center transition-all flex-shrink-0",
                                                        isSelected ? "bg-emerald-500 border-emerald-500 text-white" : "border-gray-300 dark:border-slate-600 bg-transparent"
                                                    )}>
                                                        {isSelected && (
                                                            <svg className="w-2.5 h-2.5 fill-current" viewBox="0 0 20 20">
                                                                <path d="M0 11l2-2 5 5L18 3l2 2L7 18z" fill="white" />
                                                            </svg>
                                                        )}
                                                    </div>
                                                    <div className={cn(
                                                        "w-10 h-10 rounded-xl flex items-center justify-center transition-all", 
                                                        isHighlighted ? "bg-white text-emerald-600 scale-110 shadow-primary/30" : "bg-emerald-50 dark:bg-slate-800 text-emerald-600"
                                                    )}>
                                                        <User size={20} strokeWidth={2.5} />
                                                    </div>
                                                    <div className="flex flex-col gap-0.5">
                                                        <div className="flex items-center gap-2">
                                                            <span className={cn(
                                                                "px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border shrink-0 transition-colors",
                                                                isHighlighted
                                                                    ? "bg-white/20 text-white border-white/40"
                                                                    : option.is_customer && option.is_supplier ? "bg-blue-500/10 border-blue-500/20 text-blue-500" : option.is_customer ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" : "bg-amber-500/10 border-amber-500/20 text-amber-500"
                                                            )}>
                                                                {option.is_customer && option.is_supplier ? "KH & NCC" : option.is_customer ? "KH" : "NCC"}
                                                            </span>
                                                            <p className="font-black uppercase tracking-tight text-[13px]">{option.name}</p>
                                                        </div>
                                                        <div className="flex items-center gap-3 text-[10px] font-bold opacity-80">
                                                            <span className="flex items-center gap-1"><Phone size={10} className="opacity-50" /> {option.phone || '---'}</span>
                                                            {option.address && <span className="flex items-center gap-1 truncate max-w-[150px]"><MapPin size={10} className="opacity-50" /> {option.address}</span>}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="text-right relative z-10 flex flex-col items-end gap-0.5">
                                                    <p className={cn(
                                                        "text-[16px] font-black tabular-nums tracking-tighter leading-none", 
                                                        isHighlighted ? "text-white" : (option.debt_balance > 0 ? "text-rose-600" : "text-emerald-600")
                                                    )}>
                                                        {formatDebt(option.debt_balance)}
                                                    </p>
                                                    <div className={cn(
                                                        "px-1.5 py-0.2 rounded text-[7px] font-black uppercase tracking-wider border",
                                                        isHighlighted 
                                                            ? "bg-white/20 border-white/30 text-white" 
                                                            : "bg-transparent border-slate-200 dark:border-slate-700 text-slate-500"
                                                    )}>
                                                        Dư nợ
                                                    </div>
                                                </div>
                                            </li>
                                        );
                                    }

                                    // Default option style
                                    return (
                                        <li
                                            key={valueKey && typeof option === 'object' ? option[valueKey] : index}
                                            onClick={() => handleSelect(option)}
                                            onMouseEnter={() => setHighlightedIndex(index)}
                                            className={cn(
                                                "px-3 py-2 text-xs font-bold cursor-pointer transition-colors group relative !rounded-none",
                                                isSelected ? "bg-emerald-50 dark:bg-emerald-900/10 text-emerald-600" : "text-gray-700 dark:text-gray-300",
                                                isHighlighted && !isSelected && "bg-transparent"
                                            )}
                                        >
                                            <div className="flex items-center gap-3 overflow-hidden">
                                                <div className={cn(
                                                    "w-4 h-4 rounded border flex items-center justify-center transition-all flex-shrink-0",
                                                    isSelected ? "bg-emerald-500 border-emerald-500 text-white" : "border-gray-200 dark:border-slate-700 bg-transparent"
                                                )}>
                                                    {isSelected && (
                                                        <svg className="w-2.5 h-2.5 fill-current" viewBox="0 0 20 20">
                                                            <path d="M0 11l2-2 5 5L18 3l2 2L7 18z" fill="white" />
                                                        </svg>
                                                    )}
                                                </div>
                                                <div className="flex-1 flex justify-between items-center gap-2 overflow-hidden">
                                                    <span className="truncate">{getOptionLabel(option)}</span>
                                                    {option.code && (
                                                        <span className="text-[9px] opacity-40 font-black bg-transparent dark:bg-slate-700 px-1 rounded tabular-nums flex-shrink-0">
                                                            {option.code}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </li>
                                    );
                                })
                            ) : (
                                <li className="px-3 py-4 text-center text-xs text-gray-400">Không tìm thấy kết quả</li>
                            )}
                        </ul>
                    </m.div>
                )}
            </AnimatePresence>
        </div>
    );
}

