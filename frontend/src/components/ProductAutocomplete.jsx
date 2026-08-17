
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { Search, X, AlertTriangle, Package, PackageX } from 'lucide-react';
import { cn, removeAccents, formatNumber, normalizeUOM } from '../lib/utils';
import MarqueeText from './MarqueeText';

const ProductAutocomplete = React.forwardRef(({
    allProducts,
    value,
    onChange,
    onKeyDown: parentKeyDown,
    placeholder = "🔍 Tìm sản phẩm...",
    className
}, ref) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [highlightedIndex, setHighlightedIndex] = useState(0);
    const containerRef = useRef(null);
    const inputRef = useRef(null);
    const listRef = useRef(null);

    // Find current product name to show as initial value
    const selectedProduct = useMemo(() =>
        allProducts.find(p => p.id === value),
        [allProducts, value]);

    // Sync search term with selected product when not typing
    useEffect(() => {
        if (!isOpen) {
            setSearchTerm(selectedProduct ? `${selectedProduct.code ? '[' + selectedProduct.code + '] ' : ''}${selectedProduct.name}` : '');
        }
    }, [selectedProduct, isOpen]);

    // Scroll highlighted item into view
    useEffect(() => {
        if (isOpen && listRef.current) {
            const item = listRef.current.children[highlightedIndex];
            if (item) {
                item.scrollIntoView({
                    behavior: 'smooth',
                    block: 'nearest',
                });
            }
        }
    }, [highlightedIndex, isOpen]);

    const filteredOptions = useMemo(() => {
        if (!searchTerm || selectedProduct?.name === searchTerm) return allProducts.slice(0, 10);
        const term = searchTerm.toLowerCase();
        const termNoAccent = removeAccents(term);

        return allProducts.filter(p => {
            const name = (p.name || '').toLowerCase();
            const code = (p.code || '').toLowerCase();
            return name.includes(term) ||
                removeAccents(name).includes(termNoAccent) ||
                code.includes(term);
        }).slice(0, 15);
    }, [allProducts, searchTerm, selectedProduct]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleKeyDown = (e) => {
        if (!isOpen) {
            if (e.key === 'ArrowDown') {
                setIsOpen(true);
                e.preventDefault();
                return;
            }
            if (parentKeyDown) parentKeyDown(e);
            return;
        }

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setHighlightedIndex(prev => (prev < filteredOptions.length - 1 ? prev + 1 : 0));
                break;
            case 'ArrowUp':
                e.preventDefault();
                setHighlightedIndex(prev => (prev > 0 ? prev - 1 : filteredOptions.length - 1));
                break;
            case 'Enter':
            case 'Tab':
                if (isOpen && filteredOptions.length > 0) {
                    e.preventDefault();
                    const p = filteredOptions[highlightedIndex];
                    onChange(p.id);
                    setIsOpen(false);
                    // Pass key to parent AFTER selection to move focus
                    setTimeout(() => parentKeyDown?.(e), 50);
                } else if (e.key === 'Escape') {
                    setIsOpen(false);
                }
                break;
            case 'Escape':
                setIsOpen(false);
                break;
        }
    };

    return (
        <div className={cn("relative w-full", className)} ref={containerRef}>
            <div className="relative group">
                <input
                    ref={ref || inputRef}
                    type="text"
                    value={searchTerm}
                    onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setIsOpen(true);
                        setHighlightedIndex(0);
                    }}
                    onFocus={() => setIsOpen(true)}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    autoComplete="off"
                    className="w-full pl-4 pr-10 py-3 bg-[#f8f9fa] dark:bg-slate-900 border-2 border-transparent focus:border-emerald-500/30 rounded-2xl text-[13px] font-black outline-none transition-all dark:text-white uppercase"
                />
                <Search size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-emerald-500 transition-colors" />
            </div>


            <AnimatePresence>
                {isOpen && filteredOptions.length > 0 && (
                    <m.div
                        initial={{ opacity: 0, y: 5, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 5, scale: 0.98 }}
                        transition={{ duration: 0.1 }}
                        className="absolute top-full left-0 right-0 rounded-2xl mt-2 z-[100] border overflow-hidden shadow-2xl border-amber-300/50 dark:border-white/10 w-full min-w-[500px] backdrop-blur-[24px] backdrop-saturate-150"
                        style={{ backgroundColor: 'color-mix(in srgb, var(--bg-color, #faf8f3) 90%, transparent)' }}
                    >
                            {/* Liquid Header highlight */}
                            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white/40 to-transparent pointer-events-none" />
                            
                            <ul ref={listRef} className="max-h-60 overflow-y-auto no-scrollbar rounded-2xl">
                                {filteredOptions.map((p, index) => (
                                    <li
                                        key={p.id}
                                        onMouseEnter={() => setHighlightedIndex(index)}
                                        onClick={() => {
                                            onChange(p.id);
                                            setIsOpen(false);
                                        }}
                                        className={cn(
                                            "dropdown-item flex justify-between items-center",
                                            index === highlightedIndex && "active"
                                        )}
                                    >
                                        <div className="flex-1 flex flex-col gap-1.5 relative z-10 min-w-0 overflow-hidden mr-3">
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className="min-w-0 flex-1 overflow-hidden">
                                                    <MarqueeText
                                                        text={p.name}
                                                        isActive={index === highlightedIndex}
                                                        className="font-black uppercase tracking-tight transition-all duration-300"
                                                        style={{
                                                            paddingLeft: index === highlightedIndex ? '12px' : '0px'
                                                        }}
                                                    />
                                                </div>
                                                {p.code && (
                                                    <span className="shrink-0 px-2.5 py-0.5 rounded-lg bg-slate-900/5 dark:bg-white/10 border border-black/5 dark:border-white/10 text-[10px] font-black tabular-nums text-slate-500 dark:text-slate-400">
                                                        {p.code}
                                                    </span>
                                                )}
                                                {p.is_combo && (
                                                    <span className="shrink-0 px-2.5 py-0.5 rounded-lg bg-amber-500 text-white text-[10px] font-black tracking-widest ">COMBO</span>
                                                )}
                                            </div>

                                            <div className="flex items-center gap-5">
                                                <span className="text-[11px] font-black italic tracking-wide transition-colors">
                                                    {p.active_ingredient || ""}
                                                </span>
                                                <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                                                    <span className={cn(
                                                        "px-2 py-0.5 rounded-md border transition-colors",
                                                        index === highlightedIndex 
                                                            ? "bg-white/20 border-white/30 text-white" 
                                                            : "bg-transparent border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
                                                    )}>
                                                        {normalizeUOM(p.unit)}
                                                    </span>
                                                    {p.multiplier > 1 && (
                                                        <span className={index === highlightedIndex ? "text-white/60" : "text-slate-500 opacity-60"}>/ {normalizeUOM(p.secondary_unit)} (x{p.multiplier})</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-8 relative z-10">
                                            {/* Stock Level Badge */}
                                            <div
                                                className={cn(
                                                    "px-4 py-2 rounded-2xl text-[13px] font-black border-2 transition-all flex items-center gap-2.5",
                                                    p.stock <= 0
                                                        ? "bg-rose-500/10 text-rose-600 border-rose-500/30"
                                                        : p.stock < 10
                                                            ? "bg-amber-500/10 text-amber-700 border-amber-500/30"
                                                            : "bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
                                                )}
                                            >
                                                {p.stock <= 0 ? <PackageX size={16} strokeWidth={3} /> : p.stock < 10 ? <AlertTriangle size={16} strokeWidth={3} /> : <Package size={16} strokeWidth={3} />}
                                                <span className="tabular-nums">{p.stock}</span>
                                            </div>

                                            <div className="flex flex-col items-end gap-1">
                                                <div className="text-[22px] font-black tracking-tighter tabular-nums drop- font-sans">
                                                    {formatNumber(p.sale_price)}
                                                </div>
                                                <div className="text-[10px] font-black text-slate-500 dark:text-slate-500 uppercase tracking-widest opacity-80">
                                                    NHẬP CUỐI: {formatNumber(p.latest_cost_price || p.cost_price || 0)}
                                                </div>
                                            </div>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </m.div>
                )}
            </AnimatePresence>
        </div>
    );
})

export default ProductAutocomplete;

