import React, { useState, useEffect, useRef, useMemo } from 'react';
import axios from 'axios';
import { m, AnimatePresence } from 'framer-motion';
import {
    Search, Plus, Minus, X, ClipboardList, Trash2,
    Save, History, Package, ArrowRight, RotateCcw,
    CheckCircle2, AlertTriangle, Info, ArrowLeftRight,
    Calendar, Filter, RefreshCw, Layers, TrendingUp,
    ListChecks, Edit3, RotateCw, ChevronLeft, ChevronRight
} from 'lucide-react';


import { formatNumber, cn } from '../../lib/utils';
import Toast from '../../components/Toast';
import { useQueryClient } from '@tanstack/react-query';
import ProductAutocomplete from '../../components/ProductAutocomplete';
import { useProductData } from '../../queries/useProductData';

export default function StockConversion() {
    const queryClient = useQueryClient();
    const { data: productsData } = useProductData();
    const allProducts = productsData || [];
    const [toast, setToast] = useState(null);
    const [mode, setMode] = useState('convert'); // 'convert' or 'history'
    const [isSubmitting, setIsSubmitting] = useState(false);

    // refs for focus management
    const sourceSearchRef = useRef(null);
    const sourceQtyRef = useRef(null);
    const multiplierRef = useRef(null);
    const destSearchRef = useRef(null);
    const destQtyRef = useRef(null);
    const noteRef = useRef(null);

    // Form Stats
    const [sourceProduct, setSourceProduct] = useState(null);
    const [destProduct, setDestProduct] = useState(null);
    const [sourceQty, setSourceQty] = useState(1);
    const [multiplier, setMultiplier] = useState(50);
    const [destQtyActual, setDestQtyActual] = useState(0);
    const [note, setNote] = useState('');

    // Bulk Conversion Queue
    const [pendingItems, setPendingItems] = useState([]);

    // Editing State
    const [editingHistoryItem, setEditingHistoryItem] = useState(null);

    // History
    const [history, setHistory] = useState([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);
    const [selectedDate, setSelectedDate] = useState(null); // null means 'All'
    const [showCalendar, setShowCalendar] = useState(false);
    const calendarRef = useRef(null);

    const [currentMonth, setCurrentMonth] = useState(new Date());

    const handlePrevMonth = () => {
        setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
    };

    const calendarDays = useMemo(() => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        
        let startOffset = firstDay.getDay() - 1;
        if (startOffset < 0) startOffset = 6;
        
        const days = [];
        const prevMonthLastDay = new Date(year, month, 0).getDate();
        for (let i = startOffset; i > 0; i--) {
            days.push({
                date: new Date(year, month - 1, prevMonthLastDay - i + 1),
                isCurrentMonth: false
            });
        }
        
        for (let i = 1; i <= lastDay.getDate(); i++) {
            days.push({
                date: new Date(year, month, i),
                isCurrentMonth: true
            });
        }
        
        const totalCells = Math.ceil(days.length / 7) * 7;
        const nextDaysCount = totalCells - days.length;
        for (let i = 1; i <= nextDaysCount; i++) {
            days.push({
                date: new Date(year, month + 1, i),
                isCurrentMonth: false
            });
        }
        
        return days;
    }, [currentMonth]);


    const datesWithConversions = useMemo(() => {
        const set = new Set();
        history.forEach(item => {
            if (item.date) {
                const dStr = new Date(item.date).toISOString().split('T')[0];
                set.add(dStr);
            }
        });
        return set;
    }, [history]);

    const groupedHistory = useMemo(() => {
        const groups = {};
        const filtered = selectedDate
            ? history.filter(item => item.date && new Date(item.date).toISOString().split('T')[0] === selectedDate)
            : history;

        filtered.forEach(item => {
            if (item.date) {
                const dateKey = new Date(item.date).toLocaleDateString('vi-VN');
                if (!groups[dateKey]) groups[dateKey] = [];
                groups[dateKey].push(item);
            }
        });
        return groups;
    }, [history, selectedDate]);

    const user = JSON.parse(sessionStorage.getItem('user') || '{}');


    // Auto calculate expected when inputs change
    useEffect(() => {
        if (sourceProduct && multiplier) {
            setDestQtyActual(Number(sourceQty) * Number(multiplier));
        }
    }, [sourceQty, multiplier, sourceProduct]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (calendarRef.current && !calendarRef.current.contains(event.target)) {
                setShowCalendar(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);


    const addToQueue = () => {
        if (!sourceProduct || !destProduct || destQtyActual <= 0) return;
        
        const newItem = {
            id: Date.now(),
            source_product: sourceProduct,
            dest_product: destProduct,
            source_qty: Number(sourceQty),
            multiplier: Number(multiplier),
            dest_qty_actual: Number(destQtyActual),
            note: note || `Xẻ lẻ từ ${sourceProduct.name} sang ${destProduct.name}`,
            cost_price_source: sourceProduct.cost_price,
            cost_price_dest: (sourceProduct.cost_price * sourceQty) / destQtyActual
        };
        
        setPendingItems(prev => [newItem, ...prev]);
        
        // Reset and Focus back to search
        setSourceProduct(null);
        setDestProduct(null);
        setSourceQty(1);
        setMultiplier(50);
        setDestQtyActual(0);
        setNote('');
        setTimeout(() => sourceSearchRef.current?.focus(), 50);
        showToast(`Đã thêm ${sourceProduct.name} vào hàng đợi`);
    };

    const removeFromQueue = (id) => {
        setPendingItems(prev => prev.filter(item => item.id !== id));
    };

    const handleBulkSubmit = async () => {
        if (pendingItems.length === 0) return;
        
        setIsSubmitting(true);
        let successCount = 0;
        let errors = [];

        try {
            // Process one by one for reliability (or we could make a bulk endpoint)
            for (const item of pendingItems) {
                try {
                    const payload = {
                        source_product_id: item.source_product.id,
                        dest_product_id: item.dest_product.id,
                        source_qty: item.source_qty,
                        multiplier: item.multiplier,
                        dest_qty_actual: item.dest_qty_actual,
                        note: item.note,
                        user_id: user.id,
                        cost_price_at_conversion: item.cost_price_source
                    };
                    await axios.post('/api/inventory/convert', payload);
                    successCount++;
                } catch (err) {
                    errors.push(`${item.source_product.name}: ${err.response?.data?.error || err.message}`);
                }
            }

            if (successCount > 0) {
                showToast(`Đã xẻ lẻ thành công ${successCount} mặt hàng!`);
                queryClient.invalidateQueries({ queryKey: ['products'] });
                setPendingItems([]);
                fetchHistory();
            }
            
            if (errors.length > 0) {
                errors.forEach(err => showToast(err, 'error'));
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const startEditingHistory = (item) => {
        // Switch to conversion mode and pre-fill form
        setMode('convert');
        setEditingHistoryItem(item);
        
        // Find source and dest products (assuming items have enough data or search them)
        // For simplicity, we use the IDs from the item
        setSourceProduct({ id: item.source_product_id, name: item.source_product_name, unit: 'Bao', cost_price: item.cost_price_at_conversion });
        setDestProduct({ id: item.dest_product_id, name: item.dest_product_name, unit: 'Kg' });
        
        setSourceQty(item.source_qty);
        setMultiplier(item.multiplier);
        setDestQtyActual(item.dest_qty_actual);
        setNote(item.note);
        
        // Focus first logical field
        setTimeout(() => sourceQtyRef.current?.focus(), 50);
    };

    const handleUpdateHistory = async () => {
        if (!editingHistoryItem) return;
        
        setIsSubmitting(true);
        try {
            const payload = {
                source_qty: Number(sourceQty),
                multiplier: Number(multiplier),
                dest_qty_actual: Number(destQtyActual),
                note: note,
                cost_price_at_conversion: sourceProduct?.cost_price
            };
            await axios.put(`/api/inventory/conversions/${editingHistoryItem.id}`, payload);
            showToast('Đã cập nhật và tái cân bằng kho hàng thành công!');
            queryClient.invalidateQueries({ queryKey: ['products'] });
            
            // Clean up
            setEditingHistoryItem(null);
            setSourceProduct(null);
            setDestProduct(null);
            setSourceQty(1);
            setNote('');
            setMode('history');
            fetchHistory();
        } catch (err) {
            showToast(err.response?.data?.error || 'Lỗi khi cập nhật', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const fetchHistory = async () => {
        setIsLoadingHistory(true);
        try {
            const res = await axios.get('/api/inventory/conversions');
            setHistory(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoadingHistory(false);
        }
    };

    useEffect(() => {
        if (mode === 'history') fetchHistory();
    }, [mode]);

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const handleDeleteHistory = async (id) => {
        const msg = "Bạn có chắc chắn muốn XÓA bản ghi này?\n\nHệ thống sẽ ĐẢO NGƯỢC kho hàng:\n- Trả lại số bao đã xẻ cho kho nguồn.\n- Trừ bớt số kg đã nhận ở kho đích.\n\nThao tác này đảm bảo tồn kho luôn chính xác.";
        if (!window.confirm(msg)) return;
        try {
            await axios.delete(`/api/inventory/conversions/${id}`);
            queryClient.invalidateQueries({ queryKey: ['products'] });
            setHistory(prev => prev.filter(h => h.id !== id));
            showToast('Đã xóa và hoàn lại tồn kho thành công');
        } catch (err) {
            showToast(err.response?.data?.error || 'Lỗi khi xóa', 'error');
        }
    };

    return (
        <div className="pt-2 px-4 pb-2 w-full transition-colors duration-300 h-[calc(100vh-30px)] overflow-hidden flex flex-col font-sans relative">
            <div className="flex-1 flex flex-col overflow-hidden">
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
            
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-4 relative z-10">
                <div>
                    <h1 className="text-3xl md:text-4xl font-black text-primary uppercase tracking-tight flex items-center gap-3 pt-2 pb-0.5 leading-relaxed">
                        <ArrowLeftRight className="text-primary" size={32} />
                        QUY ĐỔI KHO HÀNG
                    </h1>
                    <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-black uppercase rounded-lg tracking-tighter">LyangPOS by Lyang</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                        <p className="text-[11px] font-bold text-gray-400 dark:text-gray-500">
                            {mode === 'convert' ? 'Tạo lệnh quy đổi bao sang ký lẻ' : 'Lịch sử quy đổi kho'}
                        </p>
                    </div>
                </div>

                <div className="flex p-1.5 bg-transparent border border-border rounded-2xl relative">
                    <button
                        onClick={() => setMode('convert')}
                        className={cn(
                            "relative z-10 px-8 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all",
                            mode === 'convert' ? "text-white" : "text-[#8b6f47] hover:text-[#2d5016] dark:text-[#d4a574]/60 dark:hover:text-[#d4a574]"
                        )}
                    >
                        QUY ĐỔI
                        {mode === 'convert' && (
                            <m.div
                                layoutId="stockConversionModeIndicator"
                                className="absolute inset-0 bg-primary rounded-xl -z-10"
                                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                            />
                        )}
                    </button>
                    <button
                        onClick={() => setMode('history')}
                        className={cn(
                            "relative z-10 px-8 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all",
                            mode === 'history' ? "text-white" : "text-[#8b6f47] hover:text-[#2d5016] dark:text-[#d4a574]/60 dark:hover:text-[#d4a574]"
                        )}
                    >
                        LỊCH SỬ
                        {mode === 'history' && (
                            <m.div
                                layoutId="stockConversionModeIndicator"
                                className="absolute inset-0 bg-primary rounded-xl -z-10"
                                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                            />
                        )}
                    </button>
                </div>
            </div>

            <div className="flex-1 pos-card rounded-2xl border border-border overflow-hidden flex flex-col shadow-none">
                <AnimatePresence mode="wait">
                    {mode === 'convert' ? (
                        <m.div
                            key="convert"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="flex-1 overflow-hidden p-6 flex flex-col gap-6"
                        >
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 overflow-hidden">
                                {/* LEFT COLUMN: INPUTS & ACTIONS */}
                                <div className="lg:col-span-5 flex flex-col gap-5 overflow-y-auto pr-1 no-scrollbar pb-6">
                                    {/* SOURCE PRODUCT CARD */}
                                    <m.div 
                                        whileHover={{ y: -2 }}
                                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                        className={cn(
                                            "pos-card rounded-2xl p-6 border transition-all flex flex-col gap-6 relative focus-within:z-50 bg-transparent shadow-none",
                                            sourceProduct ? "border-primary/50" : "border-border"
                                        )}
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <Layers className="text-orange-500" size={20} />
                                                <h3 className="font-black text-sm uppercase tracking-widest text-muted">Sản phẩm Nguồn (Bao)</h3>
                                            </div>
                                            {sourceProduct && (
                                                <m.button 
                                                    whileHover={{ scale: 1.1 }} 
                                                    whileTap={{ scale: 0.9 }} 
                                                    onClick={() => setSourceProduct(null)} 
                                                    className="p-2 hover:bg-rose-500/10 text-rose-500 rounded-lg transition-colors"
                                                >
                                                    <RotateCcw size={16} />
                                                </m.button>
                                            )}
                                        </div>

                                        {!sourceProduct ? (
                                            <ProductAutocomplete
                                                ref={sourceSearchRef}
                                                allProducts={allProducts}
                                                value={sourceProduct?.id || null}
                                                onChange={(productId) => {
                                                    const p = allProducts.find(prod => prod.id === productId);
                                                    if (p) {
                                                        setSourceProduct(p);
                                                        if (p.multiplier > 1) setMultiplier(p.multiplier);
                                                        setTimeout(() => sourceQtyRef.current?.focus(), 50);
                                                    }
                                                }}
                                                placeholder="TÌM SẢN PHẨM NGUYÊN BAO..."
                                                className="w-full"
                                            />
                                        ) : (
                                            <m.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="bg-primary/5 p-4 rounded-xl border border-primary/10 w-full">
                                                <div className="text-lg font-black text-primary uppercase leading-tight mb-2">{sourceProduct.name}</div>
                                                <div className="grid grid-cols-3 gap-6">
                                                    <div>
                                                        <div className="text-[10px] font-black text-muted uppercase tracking-widest mb-1">Tồn hiện tại</div>
                                                        <div className="text-lg font-black text-foreground tabular-nums">{sourceProduct.stock} <span className="text-[10px]">{sourceProduct.unit}</span></div>
                                                    </div>
                                                    <div className="w-px h-10 bg-primary/10" />
                                                    <div>
                                                        <div className="text-[10px] font-black text-orange-500 uppercase tracking-widest mb-1">Giá vốn (Bao)</div>
                                                        <div className="text-lg font-black text-orange-600 tabular-nums">{formatNumber(sourceProduct.cost_price)} <span className="text-[10px]">đ</span></div>
                                                    </div>
                                                </div>
                                            </m.div>
                                        )}

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="relative">
                                                <label className="absolute -top-2.5 left-4 px-2 bg-card border border-border rounded-lg text-[9px] font-black text-muted uppercase tracking-widest shadow-none z-10">Mất đi (Số bao xuất)</label>
                                                <input
                                                    ref={sourceQtyRef}
                                                    type="number"
                                                    className="w-full bg-transparent border border-border focus:ring-1 focus:ring-primary/20 rounded-xl py-3 px-4 font-black text-xl text-orange-600 outline-none tabular-nums transition-all"
                                                    value={sourceQty}
                                                    onChange={e => setSourceQty(e.target.value)}
                                                    onKeyDown={e => e.key === 'Enter' && multiplierRef.current?.focus()}
                                                    onFocus={e => e.target.select()}
                                                />
                                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400 uppercase">{sourceProduct?.unit || 'Bao'}</span>
                                            </div>
                                            <div className="relative">
                                                <label className="absolute -top-2.5 left-4 px-2 bg-card border border-border rounded-lg text-[9px] font-black text-muted uppercase tracking-widest shadow-none z-10">Dự kiến (Kg lẻ/bao)</label>
                                                <input
                                                    ref={multiplierRef}
                                                    type="number"
                                                    className="w-full bg-transparent border border-border focus:ring-1 focus:ring-primary/20 rounded-xl py-3 px-4 font-black text-xl text-primary outline-none tabular-nums transition-all"
                                                    value={multiplier}
                                                    onChange={e => setMultiplier(e.target.value)}
                                                    onKeyDown={e => e.key === 'Enter' && destSearchRef.current?.focus()}
                                                    onFocus={e => e.target.select()}
                                                />
                                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400 uppercase">Ký / Bao</span>
                                            </div>
                                        </div>
                                    </m.div>

                                    {/* DESTINATION PRODUCT CARD */}
                                    <m.div 
                                        whileHover={{ y: -2 }}
                                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                        className={cn(
                                            "pos-card rounded-2xl p-6 border transition-all flex flex-col gap-6 relative focus-within:z-50 bg-transparent shadow-none",
                                            destProduct ? "border-primary/50" : "border-border"
                                        )}
                                    >
                                         <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <ArrowRight className="text-primary" size={20} />
                                                <h3 className="font-black text-sm uppercase tracking-widest text-muted">Sản phẩm đích (Lẻ)</h3>
                                            </div>
                                            {destProduct && (
                                                <m.button 
                                                    whileHover={{ scale: 1.1 }} 
                                                    whileTap={{ scale: 0.9 }} 
                                                    onClick={() => setDestProduct(null)} 
                                                    className="p-2 hover:bg-rose-500/10 text-rose-500 rounded-lg transition-colors"
                                                >
                                                    <RotateCcw size={16} />
                                                </m.button>
                                            )}
                                        </div>

                                        {!destProduct ? (
                                            <ProductAutocomplete
                                                ref={destSearchRef}
                                                allProducts={allProducts}
                                                value={destProduct?.id || null}
                                                onChange={(productId) => {
                                                    const p = allProducts.find(prod => prod.id === productId);
                                                    if (p) {
                                                        setDestProduct(p);
                                                        setTimeout(() => destQtyRef.current?.focus(), 50);
                                                    }
                                                }}
                                                placeholder="TÌM SẢN PHẨM KÝ LẺ..."
                                                className="w-full"
                                            />
                                        ) : (
                                            <m.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="bg-primary/5 p-4 rounded-xl border border-primary/10 w-full">
                                                <div className="text-lg font-black text-primary uppercase leading-tight mb-2">{destProduct.name}</div>
                                                <div className="grid grid-cols-3 gap-6">
                                                    <div>
                                                        <div className="text-[10px] font-black text-muted uppercase tracking-widest mb-1">Tồn hiện tại</div>
                                                        <div className="text-lg font-black text-foreground tabular-nums">{destProduct.stock} <span className="text-[10px]">{destProduct.unit}</span></div>
                                                    </div>
                                                    <div className="w-px h-10 bg-primary/10" />
                                                    <div>
                                                        <div className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-1">Giá vốn lẻ (Dự tính)</div>
                                                        <div className="text-lg font-black text-blue-600 tabular-nums">
                                                            {sourceProduct && destQtyActual > 0 
                                                                ? formatNumber((sourceProduct.cost_price * sourceQty) / destQtyActual) 
                                                                : 0
                                                            } <span className="text-[10px]">đ/kg</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </m.div>
                                        )}

                                        <div className="relative">
                                            <label className="absolute -top-2.5 left-4 px-2 bg-card border border-border rounded-lg text-[9px] font-black text-primary uppercase tracking-widest shadow-none z-10">Nhận được (Số Kg thực tế sau hao hụt)</label>
                                            <input
                                                ref={destQtyRef}
                                                type="number"
                                                className="w-full bg-transparent border border-border focus:ring-1 focus:ring-primary/20 rounded-xl py-3 px-4 font-black text-xl text-primary outline-none tabular-nums transition-all"
                                                value={destQtyActual}
                                                onChange={e => setDestQtyActual(e.target.value)}
                                                onKeyDown={e => e.key === 'Enter' && noteRef.current?.focus()}
                                                onFocus={e => e.target.select()}
                                            />
                                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black text-primary uppercase">{destProduct?.unit || 'Kg'}</span>
                                            
                                            {/* Loss Indicator */}
                                            {sourceProduct && destQtyActual > 0 && (
                                                <div className="absolute top-2 right-4 text-[9px] font-black uppercase flex items-center gap-1.5 px-3 py-0.5 bg-card rounded-full border border-border">
                                                    {destQtyActual === sourceQty * multiplier ? (
                                                        <span className="text-emerald-500">Đầy đủ 100%</span>
                                                    ) : destQtyActual < sourceQty * multiplier ? (
                                                        <span className="text-rose-500">Hao hụt: {(sourceQty * multiplier - destQtyActual).toFixed(2)} {destProduct?.unit}</span>
                                                    ) : (
                                                        <span className="text-blue-500 font-bold">Dôi dư: {(destQtyActual - sourceQty * multiplier).toFixed(2)} {destProduct?.unit}</span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </m.div>

                                    {/* SUBMIT SECTION */}
                                    <div className="flex flex-col gap-6 mt-2">
                                        <div className="relative">
                                            <label className="absolute -top-2 left-4 px-2 bg-card border border-border rounded-lg text-[9px] font-black text-muted uppercase tracking-widest shadow-none z-10">Ghi chú quan trọng</label>
                                            <textarea
                                                ref={noteRef}
                                                className="w-full bg-transparent border border-border focus:ring-1 focus:ring-primary/20 rounded-xl p-4 pt-6 outline-none font-medium text-sm min-h-[80px] text-foreground transition-all"
                                                placeholder="Ví dụ: Xẻ đợt hàng nhập ngày 20/10, hao hụt do rơi vãi..."
                                                value={note}
                                                onChange={e => setNote(e.target.value)}
                                                onKeyDown={e => e.key === 'Enter' && e.ctrlKey && (editingHistoryItem ? handleUpdateHistory() : addToQueue())}
                                            />
                                        </div>
                                        
                                        <div className="flex items-center gap-4">
                                            {editingHistoryItem && (
                                                <m.button
                                                    whileHover={{ y: -2 }}
                                                    whileTap={{ scale: 0.98 }}
                                                    onClick={() => {
                                                        setEditingHistoryItem(null);
                                                        setSourceProduct(null);
                                                        setNote('');
                                                        setMode('history');
                                                    }}
                                                    className="px-6 py-3.5 rounded-xl border border-rose-500/20 text-rose-500 font-black uppercase text-[10px] tracking-widest hover:bg-rose-500/10 transition-all"
                                                >
                                                    Hủy Sửa
                                                </m.button>
                                            )}
                                            <m.button
                                                whileHover={{ y: -2 }}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={editingHistoryItem ? handleUpdateHistory : addToQueue}
                                                disabled={!sourceProduct || !destProduct || destQtyActual <= 0}
                                                className="group relative flex-1 bg-primary border border-primary text-white hover:shadow-lg rounded-xl py-3.5 px-6 transition-all flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-40 disabled:hover:translate-y-0 hover:bg-primary/95"
                                            >
                                                {editingHistoryItem ? <Save size={20} /> : <Plus size={20} />}
                                                <span className="text-sm font-black uppercase tracking-wider">
                                                    {editingHistoryItem ? 'Cập nhật & Cân Bằng Kho' : 'Thêm vào danh sách chờ'}
                                                </span>
                                            </m.button>
                                        </div>
                                    </div>
                                </div>

                                {/* RIGHT COLUMN: PENDING QUEUE */}
                                <div className="lg:col-span-7 flex flex-col border border-border rounded-2xl p-6 overflow-hidden bg-transparent">
                                    <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                                         <div className="flex items-center gap-2">
                                             <ListChecks className="text-primary" size={22} />
                                             <div>
                                                 <h2 className="text-lg font-black text-foreground uppercase">Danh sách chờ quy đổi</h2>
                                                 <p className="text-[10px] font-bold text-muted uppercase tracking-widest mt-1">
                                                     {pendingItems.length > 0 ? `Đang có ${pendingItems.length} mặt hàng trong hàng đợi` : 'Chưa có mặt hàng nào'}
                                                 </p>
                                             </div>
                                         </div>
                                         {pendingItems.length > 0 && (
                                             <m.button
                                                 whileHover={{ y: -2 }}
                                                 whileTap={{ scale: 0.98 }}
                                                 onClick={handleBulkSubmit}
                                                 disabled={isSubmitting}
                                                 className="bg-primary border border-primary text-white hover:shadow-lg rounded-xl py-3 px-6 font-black uppercase tracking-widest text-xs transition-all flex items-center gap-2.5 disabled:opacity-50 hover:bg-primary/95"
                                             >
                                                 {isSubmitting ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
                                                 Xác nhận Lưu Tất Cả ({pendingItems.length})
                                             </m.button>
                                         )}
                                    </div>

                                    {pendingItems.length === 0 ? (
                                        <div className="flex-1 flex flex-col items-center justify-center text-center opacity-40 py-20">
                                            <ListChecks size={48} className="mb-3 text-muted" />
                                            <span className="font-black text-xs uppercase tracking-[0.25em] text-muted">Trống danh sách chờ</span>
                                        </div>
                                    ) : (
                                        <div className="flex-1 overflow-y-auto no-scrollbar">
                                             <table className="w-full text-left border-collapse">
                                                 <thead>
                                                     <tr className="text-[10px] font-black text-muted uppercase tracking-widest border-b border-border">
                                                         <th className="px-6 py-3">Mặt hàng quy đổi</th>
                                                         <th className="px-6 py-3">S.Lượng Xuất</th>
                                                         <th className="px-6 py-3">Kết Quả Nhận</th>
                                                         <th className="px-6 py-3">Giá Vốn Dự Tính</th>
                                                         <th className="px-6 py-3 text-center">Hành động</th>
                                                     </tr>
                                                 </thead>
                                                 <tbody className="divide-y divide-border">
                                                     {pendingItems.map((item) => (
                                                         <tr key={item.id} className="group hover:bg-primary/5 transition-colors">
                                                             <td className="px-6 py-3.5">
                                                                 <div className="flex items-center gap-3">
                                                                     <div className="flex flex-col">
                                                                         <span className="font-black text-xs text-foreground uppercase">{item.source_product.name}</span>
                                                                         <div className="flex items-center gap-1 mt-1">
                                                                             <ArrowRight size={10} className="text-primary" />
                                                                             <span className="font-bold text-[10px] text-primary uppercase">{item.dest_product.name}</span>
                                                                         </div>
                                                                     </div>
                                                                 </div>
                                                             </td>
                                                             <td className="px-6 py-3.5">
                                                                 <span className="font-black text-sm text-orange-600">{item.source_qty}</span>
                                                                 <span className="text-[10px] font-bold text-muted uppercase ml-1">{item.source_product.unit}</span>
                                                             </td>
                                                             <td className="px-6 py-3.5">
                                                                 <span className="font-black text-sm text-primary">{item.dest_qty_actual}</span>
                                                                 <span className="text-[10px] font-bold text-muted uppercase ml-1">{item.dest_product.unit}</span>
                                                             </td>
                                                             <td className="px-6 py-3.5">
                                                                 <div className="flex flex-col">
                                                                     <span className="font-black text-sm text-blue-600">{formatNumber(item.cost_price_dest)} đ</span>
                                                                     <span className="text-[9px] font-bold text-muted uppercase">Mỗi {item.dest_product.unit}</span>
                                                                 </div>
                                                             </td>
                                                             <td className="px-6 py-3.5 text-center">
                                                                 <m.button 
                                                                     whileHover={{ scale: 1.1 }}
                                                                     whileTap={{ scale: 0.9 }}
                                                                     onClick={() => removeFromQueue(item.id)}
                                                                     className="p-2 hover:bg-rose-500/10 text-rose-500 rounded-lg transition-all"
                                                                 >
                                                                     <Trash2 size={16} />
                                                                 </m.button>
                                                             </td>
                                                         </tr>
                                                     ))}
                                                 </tbody>
                                             </table>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </m.div>
                    ) : (
                        <m.div
                            key="history"
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.98 }}
                            className="flex-1 flex flex-col overflow-hidden"
                        >
                            <div className="p-4 border-b border-border flex items-center justify-between bg-transparent shrink-0">
                                <div className="flex items-center gap-3">
                                    <h3 className="font-black text-xs uppercase tracking-[0.25em] text-muted">Nhật ký quy đổi</h3>
                                    
                                    {/* Dropdown Calendar Trigger */}
                                    <div className="relative" ref={calendarRef}>
                                        <button
                                            onClick={() => setShowCalendar(!showCalendar)}
                                            className="px-3.5 py-1.5 bg-primary/10 border border-primary/20 hover:bg-primary/20 text-primary rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all active:scale-[0.98]"
                                        >
                                            <Calendar size={14} />
                                            {selectedDate 
                                                ? `Ngày: ${new Date(selectedDate).toLocaleDateString('vi-VN')}` 
                                                : 'Tất cả các ngày'}
                                        </button>

                                        <AnimatePresence>
                                            {showCalendar && (
                                                <m.div
                                                    initial={{ opacity: 0, y: 8 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: 8 }}
                                                    className="dropdown-premium absolute left-0 mt-2 w-[340px] p-5 z-50 flex flex-col gap-4"
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <h4 className="font-black text-xs uppercase tracking-wider text-primary">Bộ lọc ngày</h4>
                                                        <button
                                                            onClick={() => { 
                                                                setSelectedDate(null); 
                                                                setShowCalendar(false); 
                                                            }}
                                                            className={cn(
                                                                "px-3.5 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all border",
                                                                selectedDate === null
                                                                    ? "bg-primary text-white border-primary"
                                                                    : "bg-transparent hover:bg-primary/5 text-muted border-border"
                                                            )}
                                                        >
                                                            Xem tất cả
                                                        </button>
                                                    </div>

                                                    {/* Month Selector */}
                                                    <div className="flex items-center justify-between px-1 py-2 border-y border-border">
                                                        <button onClick={handlePrevMonth} className="p-1.5 hover:bg-primary/5 rounded-lg text-primary transition-all">
                                                            <ChevronLeft size={18} />
                                                        </button>
                                                        <span className="text-sm font-black uppercase tracking-widest text-foreground font-sans">
                                                            Tháng {currentMonth.getMonth() + 1}, {currentMonth.getFullYear()}
                                                        </span>
                                                        <button onClick={handleNextMonth} className="p-1.5 hover:bg-primary/5 rounded-lg text-primary transition-all">
                                                            <ChevronRight size={18} />
                                                        </button>
                                                    </div>

                                                    {/* Days of Week Header */}
                                                    <div className="grid grid-cols-7 text-center gap-1">
                                                        {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map(d => (
                                                            <span key={d} className="text-[10px] font-black text-muted uppercase tracking-wider py-1">{d}</span>
                                                        ))}
                                                    </div>

                                                    {/* Calendar Grid Cells */}
                                                    <div className="grid grid-cols-7 gap-1.5 text-center">
                                                        {calendarDays.map((cell, idx) => {
                                                            const dStr = cell.date.toISOString().split('T')[0];
                                                            const hasConversions = datesWithConversions.has(dStr);
                                                            const isSelected = selectedDate === dStr;
                                                            const isToday = new Date().toISOString().split('T')[0] === dStr;
                                                            
                                                            return (
                                                                <button
                                                                    key={idx}
                                                                    onClick={() => { 
                                                                        setSelectedDate(dStr); 
                                                                        setShowCalendar(false); 
                                                                    }}
                                                                    className={cn(
                                                                        "aspect-square rounded-xl text-xs font-black flex flex-col items-center justify-center relative transition-all border border-transparent py-2.5",
                                                                        !cell.isCurrentMonth && "opacity-30",
                                                                        isSelected 
                                                                            ? "bg-primary text-white shadow-lg shadow-primary/20"
                                                                            : isToday 
                                                                                ? "bg-primary/10 text-primary border-primary/20" 
                                                                                : "hover:bg-primary/5 text-slate-700 dark:text-slate-300",
                                                                    )}
                                                                >
                                                                    <span>{cell.date.getDate()}</span>
                                                                    
                                                                    {/* Glowing dot for dates with conversions */}
                                                                    {hasConversions && (
                                                                        <span className={cn(
                                                                            "w-1.5 h-1.5 rounded-full absolute bottom-1.5",
                                                                            isSelected ? "bg-white" : "bg-emerald-500 animate-pulse"
                                                                        )} />
                                                                    )}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </m.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </div>

                                <m.button 
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={fetchHistory} 
                                    className="p-2 text-primary hover:bg-primary/10 rounded-xl transition-all"
                                >
                                    <RotateCw size={16} />
                                </m.button>
                            </div>
                            
                            <div className="flex-1 flex flex-col overflow-hidden p-6">
                                {/* FULL WIDTH GROUPED TABLE LIST */}
                                <div className="w-full flex-1 flex flex-col overflow-hidden border border-border rounded-2xl pos-card bg-transparent shadow-none">
                                    <div className="flex-1 overflow-y-auto no-scrollbar">
                                        {isLoadingHistory ? (
                                            <div className="h-full flex items-center justify-center py-20">
                                                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                            </div>
                                        ) : history.length === 0 ? (
                                            <div className="h-full flex flex-col items-center justify-center opacity-20 grayscale py-20">
                                                <History size={48} strokeWidth={1.5} className="mb-3" />
                                                <span className="font-black text-xs uppercase tracking-[0.3em] text-muted">Trống nhật ký</span>
                                            </div>
                                        ) : (
                                            <table className="w-full text-left border-collapse">
                                                <thead className="sticky top-0 bg-primary/5 dark:bg-slate-900/60 backdrop-blur-md z-10 border-b border-border">
                                                    <tr>
                                                        <th className="px-4 py-3 text-[9px] font-black uppercase text-muted">Thời gian</th>
                                                        <th className="px-4 py-3 text-[9px] font-black uppercase text-muted">Nội dung quy đổi</th>
                                                        <th className="px-4 py-3 text-[9px] font-black uppercase text-muted text-right">Tỷ lệ & Hiệu quả</th>
                                                        <th className="px-4 py-3 text-[9px] font-black uppercase text-muted text-right">Giá vốn lẻ</th>
                                                        <th className="px-4 py-3 text-[9px] font-black uppercase text-muted text-center">Ghi chú</th>
                                                        <th className="px-4 py-3 text-[9px] font-black uppercase text-muted text-center">Thao tác</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-border">
                                                    {Object.keys(groupedHistory).length === 0 ? (
                                                        <tr>
                                                            <td colSpan={6} className="px-6 py-12 text-center text-xs text-muted-foreground italic">
                                                                Không có lịch sử quy đổi trong ngày đã chọn
                                                            </td>
                                                        </tr>
                                                    ) : (
                                                        Object.entries(groupedHistory).map(([dateLabel, items]) => (
                                                            <React.Fragment key={dateLabel}>
                                                                {/* Date Group Header Row */}
                                                                <tr className="bg-transparent/50 dark:bg-slate-800/25">
                                                                    <td colSpan={6} className="px-4 py-2 border-y border-border">
                                                                        <div className="flex items-center gap-2">
                                                                            <Calendar size={12} className="text-primary" />
                                                                            <span className="font-black text-[11px] text-primary uppercase">{dateLabel}</span>
                                                                            <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[8px] font-black">{items.length} quy đổi</span>
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                                {items.map(item => {
                                                                    const loss = (item.source_qty * item.multiplier) - item.dest_qty_actual;
                                                                    return (
                                                                        <tr key={item.id} className="group hover:bg-primary/5 transition-colors">
                                                                            <td className="px-4 py-3">
                                                                                 <div className="font-black text-xs text-foreground tabular-nums">
                                                                                    {new Date(item.date).toLocaleDateString('vi-VN')}
                                                                                </div>
                                                                                <div className="text-[9px] font-bold text-muted uppercase mt-0.5">
                                                                                    {new Date(item.date).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                                                                </div>
                                                                            </td>
                                                                            <td className="px-4 py-3">
                                                                                <div className="flex items-center gap-3">
                                                                                    <div className="flex flex-col">
                                                                                        <span className="text-[11px] font-black text-orange-600 uppercase mb-0.5">{item.source_product_name}</span>
                                                                                        <span className="text-[10px] font-black tabular-nums">-{item.source_qty} bao</span>
                                                                                    </div>
                                                                                    <ArrowRight size={12} className="text-muted" />
                                                                                    <div className="flex flex-col">
                                                                                        <span className="text-[11px] font-black text-primary uppercase mb-0.5">{item.dest_product_name}</span>
                                                                                        <span className="text-[10px] font-black tabular-nums">+{item.dest_qty_actual} kg</span>
                                                                                    </div>
                                                                                </div>
                                                                            </td>
                                                                            <td className="px-4 py-3 text-right">
                                                                                <div className="text-[11px] font-black text-foreground tabular-nums">1 Bao = {item.multiplier} Kg</div>
                                                                                <div className={cn(
                                                                                    "text-[9px] font-bold uppercase mt-0.5",
                                                                                    loss <= 0 ? "text-primary" : "text-rose-500"
                                                                                )}>
                                                                                    {loss > 0 ? `Hao hụt ${loss.toFixed(2)}kg` : `Đủ số lượng`}
                                                                                </div>
                                                                            </td>
                                                                            <td className="px-4 py-3 text-right">
                                                                                <div className="text-xs font-black text-blue-600 tabular-nums">
                                                                                    {formatNumber(item.dest_qty_actual > 0 ? (item.cost_price_at_conversion * item.source_qty / item.dest_qty_actual) : 0)} đ
                                                                                </div>
                                                                                <div className="text-[9px] font-bold text-muted uppercase mt-0.5">Giá vốn lẻ</div>
                                                                            </td>
                                                                            <td className="px-4 py-3 text-center">
                                                                                <p className="text-[10px] font-bold text-muted max-w-[150px] truncate mx-auto italic">
                                                                                    {item.note || '---'}
                                                                                </p>
                                                                            </td>
                                                                            <td className="px-4 py-3 text-center">
                                                                                <div className="flex items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all">
                                                                                    <m.button 
                                                                                        whileHover={{ scale: 1.1 }}
                                                                                        whileTap={{ scale: 0.9 }}
                                                                                        onClick={() => startEditingHistory(item)}
                                                                                        className="w-7 h-7 rounded-lg flex items-center justify-center text-muted hover:text-primary hover:bg-primary/10 transition-all"
                                                                                        title="Sửa bản ghi này"
                                                                                    >
                                                                                        <Edit3 size={14} />
                                                                                    </m.button>
                                                                                    <m.button 
                                                                                        whileHover={{ scale: 1.1 }}
                                                                                        whileTap={{ scale: 0.9 }}
                                                                                        onClick={() => handleDeleteHistory(item.id)}
                                                                                        className="w-7 h-7 rounded-lg flex items-center justify-center text-muted hover:text-rose-500 hover:bg-rose-500/10 transition-all"
                                                                                        title="Xóa và hoàn kho"
                                                                                    >
                                                                                        <Trash2 size={14} />
                                                                                    </m.button>
                                                                                </div>
                                                                            </td>
                                                                        </tr>
                                                                    );
                                                                })}
                                                            </React.Fragment>
                                                        ))
                                                    )}
                                                </tbody>
                                            </table>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </m.div>

                    )}
                </AnimatePresence>
            </div>
        </div>
    </div>
    );
}
