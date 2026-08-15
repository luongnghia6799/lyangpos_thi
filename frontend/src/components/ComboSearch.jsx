
import React, { useState, useRef, useEffect } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { Search, X, ChevronDown } from 'lucide-react';
import { cn } from '../lib/utils';
import Portal from './Portal';

export default function ComboSearch({
    value,
    onChange,
    onSearch, // Triggered on Enter or click search
    options = [],
    placeholder = "Tìm kiếm...",
    icon: Icon = Search,
    displayKey = "name",
    valueKey = "name", // Usually we search by name in History, but can be ID
    className
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);
    const containerRef = useRef(null);
    const inputRef = useRef(null);
    const listRef = useRef(null);
    const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });

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

    const filteredOptions = options.filter(opt => {
        const label = typeof opt === 'string' ? opt : opt[displayKey];
        return String(label || "").toLowerCase().includes(String(value || "").toLowerCase());
    }).slice(0, 50); // Limit suggestions for performance

    const updateCoords = (e) => {
        if (e && e.target) {
            if (listRef.current && listRef.current.contains(e.target)) {
                return;
            }
        }
        if (containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            setCoords({
                top: rect.bottom + window.scrollY,
                left: rect.left + window.scrollX,
                width: rect.width
            });
        }
    };

    useEffect(() => {
        const handleScroll = (e) => updateCoords(e);
        if (isOpen) {
            updateCoords();
            window.addEventListener('scroll', handleScroll, true);
            window.addEventListener('resize', updateCoords);
        } else {
            window.removeEventListener('scroll', handleScroll, true);
            window.removeEventListener('resize', updateCoords);
        }
        return () => {
            window.removeEventListener('scroll', handleScroll, true);
            window.removeEventListener('resize', updateCoords);
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

    const handleKeyDown = (e) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (!isOpen) setIsOpen(true);
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
                    setIsOpen(true);
                    setActiveIndex(-1);
                }}
                onFocus={() => setIsOpen(true)}
                onKeyDown={handleKeyDown}
                className="w-full pl-9 pr-8 py-2 bg-white/10 dark:bg-slate-950/20 border border-white/20 dark:border-white/5 focus:border-emerald-500 rounded-xl focus:outline-none font-bold transition-all text-xs dark:text-white backdrop-blur-md"
            />
            {value && (
                <button
                    onClick={() => { onChange(''); inputRef.current?.focus(); }}
                    className="absolute right-8 top-1/2 -translate-y-1/2 text-gray-400 hover:text-rose-500 transition-colors z-10"
                >
                    <X size={12} />
                </button>
            )}
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-emerald-500/30 hover:text-emerald-500 transition-colors z-10"
            >
                <ChevronDown size={14} className={cn("transition-transform", isOpen && "rotate-180")} />
            </button>

            <AnimatePresence>
                {isOpen && filteredOptions.length > 0 && (
                    <Portal>
                        <m.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="bg-transparent-dropdown z-[100001] flex flex-col"
                            style={{
                                position: 'fixed',
                                top: coords.top + 4,
                                left: coords.left,
                                width: coords.width,
                                maxHeight: '300px'
                            }}
                        >
                            <div ref={listRef} className="overflow-y-auto no-scrollbar py-2">
                                {filteredOptions.map((opt, idx) => {
                                    const label = typeof opt === 'string' ? opt : opt[displayKey];
                                    const subLabel = typeof opt === 'object' && opt.code ? opt.code : (opt.phone ? opt.phone : null);
                                    
                                    return (
                                        <div
                                            key={idx}
                                            onClick={() => handleSelect(opt)}
                                            onMouseEnter={() => setActiveIndex(idx)}
                                            className={cn(
                                                "px-4 py-2 cursor-pointer transition-colors flex flex-col",
                                                idx === activeIndex ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "text-gray-600 dark:text-gray-300 hover:bg-transparent dark:hover:bg-slate-800/50"
                                            )}
                                        >
                                            <span className="text-xs font-black truncate">{label}</span>
                                            {subLabel && <span className="text-[9px] opacity-50 font-bold uppercase">{subLabel}</span>}
                                        </div>
                                    );
                                })}
                            </div>
                        </m.div>
                    </Portal>
                )}
            </AnimatePresence>
        </div>
    );
}
