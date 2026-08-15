import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { m, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { cn } from '../lib/utils';

export default function CustomSelect({
    value,
    onChange,
    options = [],
    className,
    dropdownClassName,
    placeholder = "Chọn...",
    disabled = false
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [dropUp, setDropUp] = useState(false);
    const [coords, setCoords] = useState({ top: 0, left: 0, width: 0, bottom: 0 });
    const containerRef = useRef(null);
    
    const selectedOption = options.find(opt => opt.value === value) || options.find(opt => String(opt.value) === String(value));

    // Update coordinates when opened
    useEffect(() => {
        if (isOpen && containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            const spaceBelow = window.innerHeight - rect.bottom;
            const shouldDropUp = spaceBelow < 240 && rect.top > 240;
            setDropUp(shouldDropUp);
            setCoords({
                top: rect.bottom,
                bottom: window.innerHeight - rect.top,
                left: rect.left,
                width: rect.width
            });
        }
    }, [isOpen]);

    // Handle scroll/resize to close dropdown so it doesn't float away
    useEffect(() => {
        if (!isOpen) return;
        const handleScrollOrResize = (e) => {
            // If the scroll target is inside the dropdown list itself, do not close it.
            if (e && e.target && e.target.closest && e.target.closest('.custom-select-dropdown')) {
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
            if (containerRef.current && !containerRef.current.contains(event.target)) {
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
        onChange({ target: { value: optionValue } }); // Mimic native event structure
        setIsOpen(false);
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
                disabled={disabled}
                className={cn(
                    "w-full flex items-center justify-between gap-1.5 px-3 py-1.5 bg-transparent rounded-xl text-sm font-bold text-primary dark:text-white transition-all focus:outline-none",
                    isOpen && "opacity-80",
                    disabled && "opacity-50 cursor-not-allowed"
                )}
            >
                <span className="truncate">
                    {selectedOption ? selectedOption.label : placeholder}
                </span>
                <ChevronDown 
                    size={14} 
                    className={cn(
                        "text-muted transition-transform duration-300 shrink-0",
                        isOpen && "rotate-180 text-primary"
                    )} 
                />
            </button>

            {createPortal(
                <AnimatePresence>
                    {isOpen && (
                        <m.div
                            initial={{ opacity: 0, y: dropUp ? -8 : 8, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: dropUp ? -8 : 8, scale: 0.95 }}
                            transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
                            className={cn(
                                "fixed max-h-60 overflow-y-auto no-scrollbar rounded-2xl border border-border bg-white dark:bg-slate-950 shadow-2xl p-1 outline-none z-[99999999] custom-select-dropdown",
                                dropdownClassName
                            )}
                            style={{
                                left: coords.left,
                                width: coords.width,
                                minWidth: '120px',
                                top: dropUp ? 'auto' : coords.top + 6,
                                bottom: dropUp ? coords.bottom + 6 : 'auto',
                            }}
                        >
                            {options.map((option) => {
                                const isSelected = String(option.value) === String(value);
                                return (
                                    <button
                                        key={option.value}
                                        type="button"
                                        onClick={() => handleSelect(option.value)}
                                        className={cn(
                                            "w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-all text-slate-700 dark:text-slate-200 hover:bg-primary/10 hover:text-primary dark:hover:text-emerald-400 cursor-pointer",
                                            isSelected && "bg-primary/10 text-primary dark:bg-emerald-950/40 dark:text-emerald-400"
                                        )}
                                    >
                                        {option.label}
                                    </button>
                                );
                            })}
                        </m.div>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </div>
    );
}
