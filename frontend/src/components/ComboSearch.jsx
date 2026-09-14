import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { m, AnimatePresence } from 'framer-motion';
import { Search, X, ChevronDown } from 'lucide-react';
import { cn } from '../lib/utils';

export default function ComboSearch({
    value,
    onChange,
    onSelect,
    onSearch, // Triggered on Enter or click search
    options = [],
    placeholder = "Tìm kiếm...",
    icon: Icon = Search,
    displayKey = "name",
    valueKey = "name",
    className
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);
    const [dropUp, setDropUp] = useState(false);
    const containerRef = useRef(null);
    const inputRef = useRef(null);
    const listRef = useRef(null);
    const [coords, setCoords] = useState({ top: 0, bottom: 0, left: 0, width: 0 });

    const filteredOptions = options.filter(opt => {
        const label = typeof opt === 'string' ? opt : opt[displayKey];
        const sub = typeof opt === 'object' ? `${opt.code || ''} ${opt.phone || ''} ${opt.address || ''}` : '';
        const searchTarget = `${label || ''} ${sub}`.toLowerCase();
        return searchTarget.includes(String(value || "").trim().toLowerCase());
    }).slice(0, 50);

    const updateCoords = () => {
        if (containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            const spaceBelow = window.innerHeight - rect.bottom;
            const shouldDropUp = spaceBelow < 220 && rect.top > 220;
            setDropUp(shouldDropUp);
            setCoords({
                top: rect.bottom,
                bottom: window.innerHeight - rect.top,
                left: rect.left,
                width: Math.max(rect.width, 220)
            });
        }
    };

    useEffect(() => {
        if (!isOpen) return;
        updateCoords();
        const handleScrollOrResize = (e) => {
            if (e && e.target && e.target.closest && e.target.closest('.combo-search-dropdown')) {
                return;
            }
            updateCoords();
        };
        window.addEventListener('scroll', handleScrollOrResize, true);
        window.addEventListener('resize', handleScrollOrResize);
        return () => {
            window.removeEventListener('scroll', handleScrollOrResize, true);
            window.removeEventListener('resize', handleScrollOrResize);
        };
    }, [isOpen]);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (activeIndex >= 0 && listRef.current) {
            const container = listRef.current;
            const children = container.children;
            if (children && children[activeIndex]) {
                const activeChild = children[activeIndex];
                const containerTop = container.scrollTop;
                const containerBottom = containerTop + container.clientHeight;
                const elemTop = activeChild.offsetTop;
                const elemBottom = elemTop + activeChild.offsetHeight;

                if (elemTop < containerTop) {
                    container.scrollTop = elemTop;
                } else if (elemBottom > containerBottom) {
                    container.scrollTop = elemBottom - container.clientHeight;
                }
            }
        }
    }, [activeIndex]);

    const handleKeyDown = (e) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (!isOpen) {
                updateCoords();
                setIsOpen(true);
            }
            setActiveIndex(prev => (prev < filteredOptions.length - 1 ? prev + 1 : prev));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActiveIndex(prev => (prev > 0 ? prev - 1 : 0));
        } else if (e.key === 'Enter') {
            if (isOpen && activeIndex >= 0 && filteredOptions[activeIndex]) {
                e.preventDefault();
                handleSelect(filteredOptions[activeIndex]);
            } else {
                onSearch?.();
                setIsOpen(false);
            }
        } else if (e.key === 'Escape') {
            setIsOpen(false);
        }
    };

    const handleSelect = (opt) => {
        const val = typeof opt === 'string' ? opt : opt[valueKey];
        onChange(val);
        setIsOpen(false);
        setActiveIndex(-1);
        if (onSelect) {
            onSelect(val, opt);
        } else if (onSearch) {
            onSearch();
        }
    };

    return (
        <div className={cn("relative flex-1 min-w-[180px]", className)} ref={containerRef}>
            <Icon className="absolute left-3 top-2.5 text-emerald-500/50 z-10" size={16} />
            <input
                ref={inputRef}
                type="text"
                placeholder={placeholder}
                value={value}
                onChange={(e) => {
                    onChange(e.target.value);
                    updateCoords();
                    setIsOpen(true);
                    setActiveIndex(-1);
                }}
                onFocus={() => {
                    updateCoords();
                    setIsOpen(true);
                }}
                onKeyDown={handleKeyDown}
                className="w-full pl-9 pr-14 py-2 bg-transparent border border-border focus:border-emerald-500 rounded-xl focus:outline-none font-bold transition-all text-xs dark:text-white"
            />
            {value && (
                <button
                    type="button"
                    onClick={() => { onChange(''); inputRef.current?.focus(); }}
                    className="absolute right-7 top-1/2 -translate-y-1/2 text-gray-400 hover:text-rose-500 transition-colors z-10"
                >
                    <X size={13} />
                </button>
            )}
            <button 
                type="button"
                onClick={() => {
                    if (!isOpen) updateCoords();
                    setIsOpen(!isOpen);
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-emerald-500/40 hover:text-emerald-500 transition-colors z-10"
            >
                <ChevronDown size={14} className={cn("transition-transform duration-200", isOpen && "rotate-180")} />
            </button>

            {createPortal(
                <AnimatePresence>
                    {isOpen && filteredOptions.length > 0 && (
                        <m.div
                            initial={{ opacity: 0, y: dropUp ? -6 : 6, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: dropUp ? -6 : 6, scale: 0.98 }}
                            transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
                            className="combo-search-dropdown fixed max-h-60 overflow-y-auto no-scrollbar rounded-2xl border border-[#8b6f47]/25 dark:border-white/10 bg-[#faf8f3]/95 dark:bg-[#0f172a]/95 backdrop-blur-2xl shadow-2xl p-1.5 outline-none z-[99999999]"
                            style={{
                                left: coords.left,
                                width: coords.width,
                                minWidth: '180px',
                                top: dropUp ? 'auto' : coords.top + 6,
                                bottom: dropUp ? coords.bottom + 6 : 'auto',
                            }}
                        >
                            <div ref={listRef} className="py-0.5 space-y-0.5">
                                {filteredOptions.map((opt, idx) => {
                                    const label = typeof opt === 'string' ? opt : opt[displayKey];
                                    const subLabel = typeof opt === 'object' ? (opt.code || opt.phone || opt.unit || null) : null;
                                    const isSelected = String(label).toLowerCase() === String(value || "").toLowerCase();

                                    return (
                                        <div
                                            key={idx}
                                            onClick={() => handleSelect(opt)}
                                            onMouseEnter={() => setActiveIndex(idx)}
                                            className={cn(
                                                "px-3 py-2 rounded-xl cursor-pointer transition-all flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-[#2d5016]/10 hover:text-[#2d5016] dark:hover:bg-white/[0.08] dark:hover:text-emerald-400",
                                                idx === activeIndex && "bg-[#2d5016]/10 text-[#2d5016] dark:bg-white/[0.08] dark:text-emerald-400",
                                                isSelected && "bg-[#2d5016]/15 text-[#2d5016] dark:bg-emerald-950/60 dark:text-emerald-400 font-black"
                                            )}
                                        >
                                            <span className="truncate">{label}</span>
                                            {subLabel && (
                                                <span className="text-[10px] opacity-60 font-semibold uppercase ml-2 shrink-0 px-1.5 py-0.5 bg-black/5 dark:bg-white/10 rounded">
                                                    {subLabel}
                                                </span>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </m.div>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </div>
    );
}
