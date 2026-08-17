import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { m, AnimatePresence } from 'framer-motion';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { cn } from '../lib/utils';

export default function CustomDatePicker({
    value,
    onChange,
    className,
    inputClassName,
    dropdownClassName,
    placeholder = "Chọn ngày...",
    disabled = false,
    max
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [coords, setCoords] = useState({ top: 0, left: 0, width: 0, bottom: 0 });
    const [dropUp, setDropUp] = useState(false);
    const containerRef = useRef(null);

    // Parse value (YYYY-MM-DD)
    const getParsedDate = (val) => {
        if (!val) return new Date();
        const parts = val.split('-');
        if (parts.length === 3) {
            return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        }
        return new Date();
    };

    const selectedDate = value ? getParsedDate(value) : null;
    const [currentMonth, setCurrentMonth] = useState(selectedDate || new Date());

    useEffect(() => {
        if (selectedDate) {
            setCurrentMonth(selectedDate);
        }
    }, [value]);

    // Position updates
    useEffect(() => {
        if (isOpen && containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            const spaceBelow = window.innerHeight - rect.bottom;
            const shouldDropUp = spaceBelow < 340 && rect.top > 340; // Calendar popup is ~320px tall
            setDropUp(shouldDropUp);
            setCoords({
                top: rect.bottom,
                bottom: window.innerHeight - rect.top,
                left: rect.left,
                width: rect.width
            });
        }
    }, [isOpen]);

    // Auto-close on scroll/resize
    useEffect(() => {
        if (!isOpen) return;
        const handleScrollOrResize = () => {
            setIsOpen(false);
        };
        window.addEventListener('scroll', handleScrollOrResize, true);
        window.addEventListener('resize', handleScrollOrResize);
        return () => {
            window.removeEventListener('scroll', handleScrollOrResize, true);
            window.removeEventListener('resize', handleScrollOrResize);
        };
    }, [isOpen]);

    // Click outside handler
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                // Also check if clicked inside the portal container
                const portalContainer = document.getElementById('datepicker-portal-root');
                if (portalContainer && portalContainer.contains(event.target)) return;
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const formatDateString = (date) => {
        if (!date) return '';
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    };

    const displayFormat = (date) => {
        if (!date) return placeholder;
        const d = String(date.getDate()).padStart(2, '0');
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const y = date.getFullYear();
        return `${d}/${m}/${y}`;
    };

    const handleSelectDay = (day) => {
        const selected = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
        const formatted = formatDateString(selected);
        
        // Handle max limit
        if (max && formatted > max) return;

        onChange({ target: { value: formatted } });
        setIsOpen(false);
    };

    const handleClear = (e) => {
        e.stopPropagation();
        onChange({ target: { value: '' } });
    };

    const prevMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
    };

    const nextMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
    };

    // Calendar Generation
    const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
    const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay(); // 0 is Sun

    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);

    // Adjust for Monday start (0: Mon, ..., 6: Sun)
    const startOffset = firstDay === 0 ? 6 : firstDay - 1;

    // Previous month padding days
    const prevMonthDays = new Date(year, month, 0).getDate();
    const daysArray = [];
    for (let i = startOffset; i > 0; i--) {
        daysArray.push({ day: prevMonthDays - i + 1, current: false, monthOffset: -1 });
    }
    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
        daysArray.push({ day: i, current: true, monthOffset: 0 });
    }
    // Next month padding days
    const totalCells = 42; // 6 rows * 7 days
    const remaining = totalCells - daysArray.length;
    for (let i = 1; i <= remaining; i++) {
        daysArray.push({ day: i, current: false, monthOffset: 1 });
    }

    const weekdays = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

    return (
        <div ref={containerRef} className={cn("relative inline-block text-left w-full", className)}>
            <div
                onClick={() => !disabled && setIsOpen(!isOpen)}
                className={cn(
                    "flex items-center justify-between gap-2 px-3 py-2 bg-white dark:bg-slate-900 border border-border/80 rounded-xl text-xs font-bold text-foreground transition-all cursor-pointer hover:border-primary/50 shadow-xs select-none",
                    isOpen && "border-primary ring-2 ring-primary/10",
                    disabled && "opacity-50 cursor-not-allowed",
                    inputClassName
                )}
            >
                <div className="flex items-center gap-2 overflow-hidden min-w-0">
                    <CalendarIcon size={14} className="text-primary/70 dark:text-emerald-400/70 shrink-0" />
                    <span className={cn("truncate text-xs font-bold font-mono", !selectedDate && "text-muted-foreground font-sans font-medium")}>
                        {displayFormat(selectedDate)}
                    </span>
                </div>
                {value && !disabled ? (
                    <button 
                        type="button"
                        onClick={handleClear} 
                        className="p-0.5 text-muted-foreground hover:text-rose-500 rounded-md transition-colors shrink-0"
                        title="Xóa ngày"
                    >
                        <X size={13} />
                    </button>
                ) : null}
            </div>

            {createPortal(
                <AnimatePresence>
                    {isOpen && (
                        <m.div
                            id="datepicker-portal-root"
                            initial={{ opacity: 0, y: dropUp ? -10 : 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: dropUp ? -10 : 10, scale: 0.95 }}
                            transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
                            className={cn(
                                "fixed w-[280px] rounded-2xl border border-border bg-white dark:bg-slate-950 shadow-2xl p-4 outline-none z-[99999999] select-none text-slate-800 dark:text-slate-100",
                                dropdownClassName
                            )}
                            style={{
                                left: coords.left,
                                top: dropUp ? 'auto' : coords.top + 6,
                                bottom: dropUp ? coords.bottom + 6 : 'auto',
                            }}
                        >
                            {/* Calendar Header */}
                            <div className="flex items-center justify-between mb-4">
                                <button type="button" onClick={prevMonth} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
                                    <ChevronLeft size={16} />
                                </button>
                                <div className="text-xs font-black uppercase tracking-wider text-primary dark:text-[#d4a574]">
                                    Tháng {month + 1}, {year}
                                </div>
                                <button type="button" onClick={nextMonth} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
                                    <ChevronRight size={16} />
                                </button>
                            </div>

                            {/* Calendar Grid */}
                            <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold mb-2 text-slate-400">
                                {weekdays.map(d => <div key={d} className="py-1">{d}</div>)}
                            </div>

                            <div className="grid grid-cols-7 gap-1">
                                {daysArray.map((cell, idx) => {
                                    const cellDateStr = formatDateString(new Date(year, month + cell.monthOffset, cell.day));
                                    const isToday = formatDateString(new Date()) === cellDateStr;
                                    const isSelected = value && formatDateString(selectedDate) === cellDateStr;
                                    const isMaxed = max && cellDateStr > max;

                                    return (
                                        <button
                                            key={idx}
                                            type="button"
                                            disabled={isMaxed}
                                            onClick={() => cell.current && handleSelectDay(cell.day)}
                                            className={cn(
                                                "h-8 w-8 text-xs font-bold rounded-xl flex items-center justify-center transition-all cursor-pointer",
                                                !cell.current && "opacity-25 pointer-events-none",
                                                isToday && "border border-primary text-primary",
                                                isSelected && "bg-primary text-white dark:bg-[#4a7c59] dark:text-white scale-105",
                                                isMaxed && "opacity-20 cursor-not-allowed pointer-events-none",
                                                cell.current && !isSelected && !isMaxed && "hover:bg-slate-100 dark:hover:bg-slate-800"
                                            )}
                                        >
                                            {cell.day}
                                        </button>
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
