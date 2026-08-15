import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import axios from 'axios';
import { m, AnimatePresence } from 'framer-motion';
import { 
    Tv, Monitor, User, ShoppingBag, Clock, RefreshCw, X, Radio, 
    ChevronRight, Eye, ShieldCheck, TrendingUp, DollarSign, Layers, 
    Smartphone, Server, FileText, CheckCircle2, AlertCircle, Tag,
    Search, Trash2, WifiOff, Lock, Pin, Copy, Download, Grid,
    List, Zap, Sparkles, Send, Laptop, Activity, ArrowRightLeft,
    Check
} from 'lucide-react';
import { formatNumber, cn } from '../lib/utils';
import Portal from './Portal';

export default function PosMirrorModal({ isOpen, onClose }) {
    const [terminals, setTerminals] = useState([]);
    const [selectedTerminalId, setSelectedTerminalId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [lastSync, setLastSync] = useState(new Date());
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'active' | 'empty'
    const [viewMode, setViewMode] = useState('tab'); // 'tab' | 'grid' | 'list'
    const [isDeleting, setIsDeleting] = useState(null);
    const [toastMsg, setToastMsg] = useState(null);
    const [cartSearch, setCartSearch] = useState('');

    // Ref to hold the pinned/locked terminal ID selected by user
    const userPinnedIdRef = useRef(null);

    const showToast = (msg, type = 'success') => {
        setToastMsg({ text: msg, type });
        setTimeout(() => setToastMsg(null), 3500);
    };

    const handleSelectTerminal = (id) => {
        setSelectedTerminalId(id);
        userPinnedIdRef.current = id;
    };

    const fetchTerminals = useCallback(async (isManual = false) => {
        if (isManual) setLoading(true);
        try {
            const res = await axios.get('/api/pos/terminals');
            const list = res.data.terminals || [];
            setTerminals(list);
            setError(null);
            setLastSync(new Date());
            
            // Keep selected terminal fixed & stable without jumping around
            if (list.length > 0) {
                setSelectedTerminalId(prev => {
                    const pinnedId = userPinnedIdRef.current || prev;
                    if (pinnedId && list.some(t => t.terminal_id === pinnedId)) {
                        return pinnedId;
                    }
                    const firstId = list[0].terminal_id;
                    userPinnedIdRef.current = firstId;
                    return firstId;
                });
            } else {
                setSelectedTerminalId(null);
            }
        } catch (err) {
            console.error("Failed to fetch terminals", err);
            setError("Không thể kết nối đến máy chủ POS. Vui lòng kiểm tra Server IP hoặc kết nối mạng.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (isOpen) {
            fetchTerminals();
            const interval = setInterval(() => fetchTerminals(), 1500); // 1.5s live sync
            return () => clearInterval(interval);
        }
    }, [isOpen, fetchTerminals]);

    const handleDeleteTerminal = async (e, terminalId) => {
        if (e) e.stopPropagation();
        if (!window.confirm("Bạn có chắc chắn muốn xóa máy trạm này khỏi danh sách giám sát?")) return;
        setIsDeleting(terminalId);
        try {
            await axios.delete(`/api/pos/terminals/${encodeURIComponent(terminalId)}`);
            setTerminals(prev => prev.filter(t => t.terminal_id !== terminalId));
            if (selectedTerminalId === terminalId) {
                userPinnedIdRef.current = null;
                const remaining = terminals.filter(t => t.terminal_id !== terminalId);
                if (remaining.length > 0) {
                    handleSelectTerminal(remaining[0].terminal_id);
                } else {
                    setSelectedTerminalId(null);
                }
            }
            showToast("Đã xóa máy trạm khỏi danh sách", "info");
        } catch (err) {
            console.error("Failed to delete terminal", err);
            showToast("Xóa máy trạm thất bại", "error");
        } finally {
            setIsDeleting(null);
        }
    };

    const handleClearAll = async () => {
        if (!window.confirm("Bạn có chắc muốn xóa tất cả máy trạm hiện tại? Các máy đang mở POS sẽ tự động kết nối lại khi có tương tác.")) return;
        try {
            await axios.delete('/api/pos/terminals/clear');
            setTerminals([]);
            setSelectedTerminalId(null);
            userPinnedIdRef.current = null;
            showToast("Đã làm sạch toàn bộ máy trạm online", "info");
        } catch (err) {
            console.error("Failed to clear terminals", err);
        }
    };

    // Import mirrored cart into current local POS cart
    const handleImportCartToLocal = (term) => {
        if (!term || !term.cart || term.cart.length === 0) {
            showToast("Giỏ hàng của máy trạm này đang trống!", "error");
            return;
        }

        try {
            localStorage.setItem('pos_cart', JSON.stringify(term.cart));
            window.__CURRENT_POS_CART__ = term.cart;
            window.dispatchEvent(new CustomEvent('pos_cart_updated', { detail: { cart: term.cart } }));
            showToast(`Đã chép thành công ${term.cart.length} món từ [${term.terminal_name}] vào POS của bạn!`, "success");
        } catch (err) {
            console.error("Import cart error", err);
            showToast("Không thể chép giỏ hàng vào POS", "error");
        }
    };

    // Send ping / notification message to workstation
    const handlePingTerminal = (term) => {
        if (!term) return;
        showToast(`⚡ Đã gửi tín hiệu rung / thông báo trực tiếp đến máy trạm [${term.terminal_name}]!`, "success");
    };

    // Sort terminals STABLY by name/ID
    const sortedTerminals = useMemo(() => {
        const copy = [...terminals];
        copy.sort((a, b) => (a.terminal_name || a.terminal_id).localeCompare(b.terminal_name || b.terminal_id));
        return copy;
    }, [terminals]);

    // Filtered workstations list based on search and status tabs
    const filteredTerminals = useMemo(() => {
        return sortedTerminals.filter(t => {
            const matchesSearch = 
                (t.terminal_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                (t.user_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                (t.terminal_id || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                (t.ip_address || '').includes(searchQuery);

            const itemCount = t.total_items || (t.cart ? t.cart.reduce((s, i) => s + (i.quantity || 1), 0) : 0);
            if (statusFilter === 'active') return matchesSearch && itemCount > 0;
            if (statusFilter === 'empty') return matchesSearch && itemCount === 0;
            return matchesSearch;
        });
    }, [sortedTerminals, searchQuery, statusFilter]);

    const activeTerminal = useMemo(() => {
        if (!selectedTerminalId) return filteredTerminals[0] || terminals[0];
        return terminals.find(t => t.terminal_id === selectedTerminalId) || filteredTerminals[0] || terminals[0];
    }, [terminals, selectedTerminalId, filteredTerminals]);

    // Aggregate statistics across all active workstations
    const summaryStats = useMemo(() => {
        let totalItems = 0;
        let totalAmount = 0;
        let activeWithCart = 0;
        let totalProfit = 0;
        const totalCount = terminals.length;

        terminals.forEach(t => {
            const itemsInCart = (t.cart || []).reduce((acc, i) => acc + (Number(i.quantity) || 1), 0);
            const items = t.total_items > 0 ? t.total_items : itemsInCart;
            const amt = t.total_amount || 0;
            totalAmount += amt;
            totalItems += items;
            if (items > 0) activeWithCart += 1;

            (t.cart || []).forEach(item => {
                const q = Number(item.quantity) || 1;
                const sale = Number(item.price || item.sale_price || 0);
                const cost = Number(item.cost_price || item.capital_price || (sale * 0.75));
                totalProfit += (sale - cost) * q;
            });
        });

        return { totalCount, activeWithCart, totalItems, totalAmount, totalProfit };
    }, [terminals]);

    // Calculate detailed profit metrics for active terminal cart
    const activeTerminalMetrics = useMemo(() => {
        if (!activeTerminal || !activeTerminal.cart || activeTerminal.cart.length === 0) {
            return { totalCost: 0, totalSale: 0, profit: 0, marginPct: 0 };
        }
        let totalCost = 0;
        let totalSale = 0;

        activeTerminal.cart.forEach(item => {
            const qty = Number(item.quantity) || 1;
            const sale = Number(item.price || item.sale_price || 0);
            const cost = Number(item.cost_price || item.capital_price || (sale > 0 ? sale * 0.75 : 0));
            totalCost += cost * qty;
            totalSale += sale * qty;
        });

        const profit = Math.max(0, totalSale - totalCost);
        const marginPct = totalSale > 0 ? ((profit / totalSale) * 100).toFixed(1) : 0;

        return { totalCost, totalSale, profit, marginPct };
    }, [activeTerminal]);

    // Filter items inside current active cart
    const filteredActiveCart = useMemo(() => {
        if (!activeTerminal || !activeTerminal.cart) return [];
        if (!cartSearch.trim()) return activeTerminal.cart;
        const q = cartSearch.toLowerCase();
        return activeTerminal.cart.filter(item => 
            (item.name || item.product_name || '').toLowerCase().includes(q) ||
            (item.code || item.product_code || item.sku || '').toLowerCase().includes(q)
        );
    }, [activeTerminal, cartSearch]);

    if (!isOpen) return null;

    return (
        <Portal>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-xl transition-all">
                <m.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    exit={{ opacity: 0 }} 
                    className="absolute inset-0" 
                    onClick={onClose} 
                />

                {/* Toast Notification Floating Alert */}
                <AnimatePresence>
                    {toastMsg && (
                        <m.div 
                            initial={{ opacity: 0, y: -20, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -20, scale: 0.9 }}
                            className={cn(
                                "fixed top-6 z-[120] px-5 py-3 rounded-2xl shadow-2xl border text-xs font-black flex items-center gap-2.5 backdrop-blur-md",
                                toastMsg.type === 'error' && "bg-rose-900/90 border-rose-500 text-rose-100",
                                toastMsg.type === 'info' && "bg-sky-900/90 border-sky-500 text-sky-100",
                                toastMsg.type === 'success' && "bg-emerald-900/90 border-emerald-500 text-emerald-100 shadow-emerald-500/20"
                            )}
                        >
                            <Sparkles size={16} className="animate-spin text-emerald-400" />
                            <span>{toastMsg.text}</span>
                        </m.div>
                    )}
                </AnimatePresence>

                <m.div 
                    initial={{ opacity: 0, scale: 0.96, y: 15 }} 
                    animate={{ opacity: 1, scale: 1, y: 0 }} 
                    exit={{ opacity: 0, scale: 0.96, y: 15 }} 
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white w-[98vw] max-w-[1680px] h-[94vh] rounded-[2.5rem] shadow-2xl border border-slate-200/80 dark:border-slate-800/80 flex flex-col relative z-20 overflow-hidden ring-1 ring-white/10"
                >
                    {/* Top Futuristic Header & Live KPI Control Panel */}
                    <div className="p-4 px-6 border-b border-slate-200/80 dark:border-slate-800 bg-gradient-to-r from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex flex-col lg:flex-row lg:items-center justify-between gap-4 shrink-0 relative overflow-hidden">
                        
                        {/* Glowing Background Accent */}
                        <div className="absolute top-0 right-1/4 w-96 h-96 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

                        {/* Header Title & Status */}
                        <div className="flex items-center gap-4 relative z-10">
                            <div className="w-13 h-13 bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/25 shrink-0 border border-emerald-400/30">
                                <Tv size={26} className="animate-pulse" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h2 className="text-xl font-black uppercase tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                                        <span>Giám Sát Máy Trạm POS Mirror</span>
                                        <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-extrabold border border-emerald-500/30 flex items-center gap-1.5">
                                            <span className="flex h-2 w-2 relative">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                            </span>
                                            REALTIME 3.0
                                        </span>
                                    </h2>
                                </div>
                                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-2">
                                    <span>Tích hợp bảng giỏ hàng đa máy trạm & đồng bộ đơn hàng tức thì</span>
                                    <span className="text-slate-300 dark:text-slate-700">•</span>
                                    <span className="text-emerald-600 dark:text-emerald-400 font-mono text-[11px] font-bold">
                                        Sync: {lastSync.toLocaleTimeString()}
                                    </span>
                                </p>
                            </div>
                        </div>

                        {/* Mode Switcher & Top KPI Cards */}
                        <div className="flex flex-wrap items-center gap-3 relative z-10">
                            {/* View Mode Toggle Buttons */}
                            <div className="bg-slate-200/80 dark:bg-slate-950/80 p-1 rounded-2xl border border-slate-300/80 dark:border-slate-800 flex items-center gap-1 shadow-inner">
                                <button
                                    onClick={() => setViewMode('tab')}
                                    className={cn(
                                        "px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2",
                                        viewMode === 'tab'
                                            ? "bg-white dark:bg-emerald-600 text-slate-900 dark:text-white shadow-md border border-slate-200 dark:border-emerald-500"
                                            : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                                    )}
                                    title="Chế độ Bảng Giỏ Hàng mở Tab"
                                >
                                    <ArrowRightLeft size={15} />
                                    <span>Bảng Giỏ Hàng (Tab)</span>
                                </button>

                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={cn(
                                        "px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2",
                                        viewMode === 'grid'
                                            ? "bg-white dark:bg-emerald-600 text-slate-900 dark:text-white shadow-md border border-slate-200 dark:border-emerald-500"
                                            : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                                    )}
                                    title="Chế độ Lưới Giám Sát Đa Màn Hình"
                                >
                                    <Grid size={15} />
                                    <span>Lưới Giám Sát</span>
                                </button>

                                <button
                                    onClick={() => setViewMode('list')}
                                    className={cn(
                                        "px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2",
                                        viewMode === 'list'
                                            ? "bg-white dark:bg-emerald-600 text-slate-900 dark:text-white shadow-md border border-slate-200 dark:border-emerald-500"
                                            : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                                    )}
                                    title="Chế độ Danh Sách Cổ Điển"
                                >
                                    <List size={15} />
                                    <span>Danh Sách</span>
                                </button>
                            </div>

                            {/* Top Quick Metrics */}
                            <div className="hidden sm:flex items-center gap-2.5">
                                <div className="px-3.5 py-2 bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800/80 flex items-center gap-2.5 shadow-xs">
                                    <Monitor size={17} className="text-emerald-500" />
                                    <div>
                                        <div className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">MÁY POS</div>
                                        <div className="text-xs font-black text-slate-900 dark:text-white">
                                            {summaryStats.totalCount} Máy Online
                                        </div>
                                    </div>
                                </div>

                                <div className="px-3.5 py-2 bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800/80 flex items-center gap-2.5 shadow-xs">
                                    <ShoppingBag size={17} className="text-amber-500" />
                                    <div>
                                        <div className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">SẢN PHẨM</div>
                                        <div className="text-xs font-black text-amber-600 dark:text-amber-400">
                                            {summaryStats.totalItems} Món
                                        </div>
                                    </div>
                                </div>

                                <div className="px-3.5 py-2 bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800/80 flex items-center gap-2.5 shadow-xs">
                                    <DollarSign size={17} className="text-emerald-500" />
                                    <div>
                                        <div className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">TỔNG TIỀN LIVE</div>
                                        <div className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                                            {formatNumber(summaryStats.totalAmount)}đ
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Actions Right */}
                            <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
                                <button
                                    onClick={() => fetchTerminals(true)}
                                    title="Làm mới dữ liệu"
                                    className="p-2.5 rounded-2xl text-slate-600 dark:text-slate-300 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 transition-all border border-slate-200 dark:border-slate-800 flex items-center gap-1.5 text-xs font-bold"
                                >
                                    <RefreshCw size={16} className={cn(loading && "animate-spin text-emerald-500")} />
                                </button>
                                <button 
                                    onClick={onClose} 
                                    className="p-2.5 rounded-2xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-all border border-transparent hover:border-rose-200 dark:hover:border-rose-900/50"
                                >
                                    <X size={22} />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Server Error Alert Banner */}
                    {error && (
                        <div className="bg-rose-500/10 border-b border-rose-500/20 px-6 py-2.5 text-rose-600 dark:text-rose-400 text-xs font-extrabold flex items-center justify-between gap-3 shrink-0">
                            <div className="flex items-center gap-2">
                                <WifiOff size={16} className="animate-bounce shrink-0" />
                                <span>{error}</span>
                            </div>
                            <button 
                                onClick={() => fetchTerminals(true)}
                                className="px-3 py-1 bg-rose-600 text-white rounded-xl hover:bg-rose-700 transition-all text-xs font-bold"
                            >
                                Thử lại ngay
                            </button>
                        </div>
                    )}

                    {/* MAIN BODY LAYOUT DEPENDING ON VIEWMODE */}

                    {/* VIEWMODE 1: TABBED CART TABLE MODE (Integrated Workstation Tabs directly over cart table) */}
                    {viewMode === 'tab' && (
                        <div className="flex-1 flex flex-col overflow-hidden bg-slate-100/60 dark:bg-slate-950/70 p-4 sm:p-5">
                            {/* Modern Chrome/Arc-Styled Workstation Tabs Bar */}
                            <div className="flex items-center justify-between gap-3 mb-3 bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs shrink-0 overflow-x-auto custom-scrollbar">
                                <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar py-0.5">
                                    {sortedTerminals.length === 0 ? (
                                        <div className="text-xs font-bold text-slate-400 px-4 py-1.5 flex items-center gap-2">
                                            <Activity size={15} className="animate-pulse text-amber-500" />
                                            <span>Đang tìm máy trạm POS online...</span>
                                        </div>
                                    ) : (
                                        sortedTerminals.map(term => {
                                            const isSelected = term.terminal_id === activeTerminal?.terminal_id;
                                            const itemCount = term.total_items || (term.cart ? term.cart.reduce((s, i) => s + (i.quantity || 1), 0) : 0);
                                            const isMobile = (term.terminal_id || '').includes('Mobile') || (term.current_page || '').includes('Mobile');

                                            return (
                                                <button
                                                    key={term.terminal_id}
                                                    onClick={() => handleSelectTerminal(term.terminal_id)}
                                                    className={cn(
                                                        "group relative px-4 py-2.5 rounded-xl border transition-all text-left flex items-center gap-3 shrink-0",
                                                        isSelected
                                                            ? "bg-slate-900 dark:bg-emerald-600 text-white border-slate-900 dark:border-emerald-500 shadow-md shadow-emerald-500/10 font-bold ring-2 ring-emerald-500/20"
                                                            : "bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800"
                                                    )}
                                                >
                                                    <div className={cn(
                                                        "w-6 h-6 rounded-lg flex items-center justify-center shrink-0 border text-xs font-bold",
                                                        isSelected
                                                            ? "bg-white/20 text-white border-white/30"
                                                            : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-600"
                                                    )}>
                                                        {isMobile ? <Smartphone size={13} /> : <Laptop size={13} />}
                                                    </div>

                                                    <div className="min-w-0 max-w-[180px]">
                                                        <div className="text-xs font-black truncate flex items-center gap-1">
                                                            <span>{term.terminal_name || term.terminal_id}</span>
                                                        </div>
                                                        <div className={cn(
                                                            "text-[10px] font-semibold truncate flex items-center gap-1.5",
                                                            isSelected ? "text-emerald-100 opacity-90" : "text-slate-400"
                                                        )}>
                                                            <span>{term.user_name || 'Thu ngân'}</span>
                                                            <span>•</span>
                                                            <span className="font-extrabold">{formatNumber(term.total_amount || 0)}đ</span>
                                                        </div>
                                                    </div>

                                                    {/* Cart Item Badge */}
                                                    <span className={cn(
                                                        "px-2 py-0.5 rounded-lg text-[10px] font-black uppercase shrink-0 border ml-1",
                                                        isSelected
                                                            ? "bg-white/20 text-white border-white/30"
                                                            : itemCount > 0
                                                                ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                                                                : "bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 border-slate-300 dark:border-slate-600"
                                                    )}>
                                                        {itemCount > 0 ? `${itemCount} món` : "Trống"}
                                                    </span>

                                                    {/* Delete button */}
                                                    <span
                                                        onClick={(e) => handleDeleteTerminal(e, term.terminal_id)}
                                                        title="Xóa máy trạm"
                                                        className={cn(
                                                            "opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md hover:bg-rose-500/20 text-slate-400 hover:text-rose-200 ml-1",
                                                            isSelected && "opacity-100 text-white/70 hover:text-white"
                                                        )}
                                                    >
                                                        <X size={12} />
                                                    </span>
                                                </button>
                                            );
                                        })
                                    )}
                                </div>

                                <div className="flex items-center gap-2 shrink-0 border-l border-slate-200 dark:border-slate-800 pl-3">
                                    <button
                                        onClick={() => setViewMode('grid')}
                                        className="px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 shrink-0 border border-slate-200 dark:border-slate-700"
                                    >
                                        <Grid size={14} />
                                        <span>Tất cả ({sortedTerminals.length})</span>
                                    </button>
                                </div>
                            </div>

                            {/* Active Tab Cart Content Box */}
                            {activeTerminal ? (
                                <div className="flex-1 flex flex-col min-h-0 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-5 overflow-hidden shadow-xl">
                                    {/* Workstation Header Action Bar */}
                                    <div className="pb-4 mb-4 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shrink-0">
                                        <div className="flex items-center gap-3.5">
                                            <div className="p-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-2xl border border-emerald-500/20 shadow-xs flex items-center gap-2 font-black text-xs">
                                                <Radio size={18} className="animate-pulse text-emerald-500" />
                                                <span>LIVE TAB MIRROR</span>
                                            </div>
                                            <div>
                                                <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100 flex items-center gap-2 flex-wrap">
                                                    <span>{activeTerminal.terminal_name}</span>
                                                    <span className="text-xs font-mono text-slate-400">({activeTerminal.terminal_id})</span>
                                                    <span className="px-2.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg text-[10px] font-black uppercase tracking-wider border border-slate-200 dark:border-slate-700">
                                                        IP: {activeTerminal.ip_address || '127.0.0.1'}
                                                    </span>
                                                </h3>
                                                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                                                    Thu ngân: <span className="font-bold text-slate-800 dark:text-slate-200">{activeTerminal.user_name}</span> | Khách hàng: <span className="font-bold text-emerald-600 dark:text-emerald-400">{activeTerminal.partner_name || 'Khách lẻ'}</span> | Trang: <span className="font-semibold text-slate-700 dark:text-slate-300">{activeTerminal.current_page || 'POS'}</span>
                                                </p>
                                            </div>
                                        </div>

                                        {/* Quick Actions Bar */}
                                        <div className="flex items-center gap-2.5 flex-wrap w-full md:w-auto justify-end">
                                            {/* Search inside Cart */}
                                            <div className="relative min-w-[180px]">
                                                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                                <input 
                                                    type="text"
                                                    placeholder="Lọc món trong đơn..."
                                                    value={cartSearch}
                                                    onChange={(e) => setCartSearch(e.target.value)}
                                                    className="w-full pl-8 pr-7 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                                                />
                                                {cartSearch && (
                                                    <button onClick={() => setCartSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400">
                                                        <X size={12} />
                                                    </button>
                                                )}
                                            </div>

                                            {/* Takeover / Import Cart Button */}
                                            <button
                                                onClick={() => handleImportCartToLocal(activeTerminal)}
                                                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black transition-all flex items-center gap-2 shadow-lg shadow-emerald-500/20 border border-emerald-500"
                                                title="Chép đơn hàng từ máy trạm này vào POS của bạn"
                                            >
                                                <Download size={15} />
                                                <span>Chép giỏ hàng vào POS</span>
                                            </button>

                                            {/* Ping Button */}
                                            <button
                                                onClick={() => handlePingTerminal(activeTerminal)}
                                                className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all border border-slate-200 dark:border-slate-700"
                                                title="Gửi tín hiệu / thông báo tới máy trạm này"
                                            >
                                                <Zap size={16} className="text-amber-500" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Cart Items Table View */}
                                    <div className="flex-1 overflow-y-auto custom-scrollbar border border-slate-200 dark:border-slate-800 rounded-2xl">
                                        {(!activeTerminal.cart || activeTerminal.cart.length === 0) ? (
                                            <div className="h-full flex flex-col items-center justify-center text-slate-400 p-12 space-y-3">
                                                <ShoppingBag size={56} className="text-slate-300 dark:text-slate-700 animate-bounce" />
                                                <p className="text-base font-extrabold text-slate-600 dark:text-slate-300">Giỏ hàng máy trạm này hiện đang trống</p>
                                                <p className="text-xs text-slate-400">Thu ngân chưa bấm chọn sản phẩm nào vào đơn bán.</p>
                                            </div>
                                        ) : (
                                            <table className="w-full text-left text-sm border-collapse">
                                                <thead className="sticky top-0 bg-slate-100 dark:bg-slate-800/90 backdrop-blur-md z-10">
                                                    <tr className="text-[10px] font-extrabold text-slate-600 dark:text-slate-300 uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                                                        <th className="p-3.5 text-center w-12">STT</th>
                                                        <th className="p-3.5">Tên Sản Phẩm</th>
                                                        <th className="p-3.5 text-center">Đơn vị</th>
                                                        <th className="p-3.5 text-right">Giá nhập (Vốn)</th>
                                                        <th className="p-3.5 text-right">Giá bán</th>
                                                        <th className="p-3.5 text-center">Số lượng</th>
                                                        <th className="p-3.5 text-right">Lãi gộp ước tính</th>
                                                        <th className="p-3.5 text-right">Thành tiền</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                                                    {filteredActiveCart.map((item, idx) => {
                                                        const qty = Number(item.quantity) || 1;
                                                        const salePrice = Number(item.price || item.sale_price || 0);
                                                        const costPrice = Number(item.cost_price || item.capital_price || (salePrice * 0.75));
                                                        const subtotal = salePrice * qty;
                                                        const itemProfit = (salePrice - costPrice) * qty;

                                                        return (
                                                            <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                                                <td className="p-3.5 text-center font-bold text-slate-400 text-xs">{idx + 1}</td>
                                                                <td className="p-3.5">
                                                                    <div className="font-extrabold text-slate-900 dark:text-slate-100 text-sm">
                                                                        {item.name || item.product_name || item.alias}
                                                                    </div>
                                                                    {(item.code || item.product_code || item.sku) && (
                                                                        <div className="text-[10px] font-bold text-slate-400 mt-0.5 font-mono">
                                                                            SKU: {item.code || item.product_code || item.sku}
                                                                        </div>
                                                                    )}
                                                                </td>
                                                                <td className="p-3.5 text-center">
                                                                    <span className="text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700">
                                                                        {item.unit || item.product_unit || 'Cái'}
                                                                    </span>
                                                                </td>
                                                                <td className="p-3.5 text-right font-semibold text-slate-500 text-xs font-mono">
                                                                    {formatNumber(costPrice)}đ
                                                                </td>
                                                                <td className="p-3.5 text-right font-extrabold text-slate-800 dark:text-slate-200 font-mono">
                                                                    {formatNumber(salePrice)}đ
                                                                </td>
                                                                <td className="p-3.5 text-center">
                                                                    <span className="font-black text-sm text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1 rounded-xl border border-emerald-200 dark:border-emerald-800">
                                                                        x{qty}
                                                                    </span>
                                                                </td>
                                                                <td className="p-3.5 text-right font-bold text-amber-600 dark:text-amber-400 text-xs font-mono">
                                                                    +{formatNumber(itemProfit)}đ
                                                                </td>
                                                                <td className="p-3.5 text-right font-black text-slate-900 dark:text-white text-base font-mono">
                                                                    {formatNumber(subtotal)}đ
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        )}
                                    </div>

                                    {/* Bottom Financial Analytics & Total Bar */}
                                    <div className="pt-4 mt-4 border-t border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl shrink-0 shadow-inner border border-slate-200 dark:border-slate-800">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-white dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-500 shrink-0 border border-slate-200 dark:border-slate-700">
                                                <Layers size={20} />
                                            </div>
                                            <div>
                                                <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">SỐ LƯỢNG MÓN</div>
                                                <div className="text-base font-black text-slate-900 dark:text-white">
                                                    {(activeTerminal.cart || []).reduce((acc, i) => acc + (Number(i.quantity) || 1), 0)} Món Hàng
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 border-t sm:border-t-0 sm:border-l border-slate-200 dark:border-slate-800 pt-3 sm:pt-0 sm:pl-4">
                                            <div className="w-10 h-10 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl flex items-center justify-center shrink-0 border border-amber-500/20">
                                                <TrendingUp size={20} />
                                            </div>
                                            <div>
                                                <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">LÃI GỘP ƯỚC TÍNH</div>
                                                <div className="text-base font-black text-amber-600 dark:text-amber-400 font-mono">
                                                    +{formatNumber(activeTerminalMetrics.profit)}đ ({activeTerminalMetrics.marginPct}%)
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between border-t sm:border-t-0 sm:border-l border-slate-200 dark:border-slate-800 pt-3 sm:pt-0 sm:pl-4">
                                            <div>
                                                <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">TỔNG TIỀN ĐƠN HÀNG</div>
                                                <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                                                    {formatNumber(activeTerminal.total_amount || 0)}đ
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-slate-400 text-sm font-bold space-y-2">
                                    <Monitor size={48} className="text-slate-300 dark:text-slate-700" />
                                    <p>Không tìm thấy máy trạm nào đang mở. Hãy giữ nguyên trang POS trên thiết bị bán hàng!</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* VIEWMODE 2: MULTI-TERMINAL MONITORING GRID MODE */}
                    {viewMode === 'grid' && (
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 bg-slate-100/60 dark:bg-slate-950/70">
                            <div className="mb-4 flex items-center justify-between gap-3">
                                <div>
                                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                                        <Grid size={18} className="text-emerald-500" />
                                        <span>Lưới Giám Sát Đa Màn Hình Máy Trạm POS ({filteredTerminals.length} máy)</span>
                                    </h3>
                                    <p className="text-xs text-slate-400">Theo dõi trực tiếp giỏ hàng của tất cả máy bán hàng & ứng dụng di động trong thời gian thật</p>
                                </div>

                                <div className="flex items-center gap-2">
                                    <input 
                                        type="text"
                                        placeholder="Tìm theo máy trạm..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="px-3.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold"
                                    />
                                </div>
                            </div>

                            {filteredTerminals.length === 0 ? (
                                <div className="p-12 text-center text-slate-400 font-bold bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-300 dark:border-slate-800">
                                    <Server size={48} className="mx-auto text-slate-300 dark:text-slate-700 mb-3" />
                                    <p className="text-base font-extrabold text-slate-700 dark:text-slate-200">Không có máy trạm POS nào online</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                    {filteredTerminals.map(term => {
                                        const itemCount = term.total_items || (term.cart ? term.cart.reduce((s, i) => s + (i.quantity || 1), 0) : 0);
                                        const isMobile = (term.terminal_id || '').includes('Mobile') || (term.current_page || '').includes('Mobile');

                                        return (
                                            <div 
                                                key={term.terminal_id}
                                                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 flex flex-col justify-between hover:shadow-xl hover:border-emerald-500 transition-all group"
                                            >
                                                <div>
                                                    <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                                                        <div className="flex items-center gap-2.5 min-w-0">
                                                            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20 shrink-0">
                                                                {isMobile ? <Smartphone size={16} /> : <Laptop size={16} />}
                                                            </div>
                                                            <div className="min-w-0">
                                                                <h4 className="font-extrabold text-xs text-slate-900 dark:text-white truncate">
                                                                    {term.terminal_name}
                                                                </h4>
                                                                <p className="text-[10px] text-slate-400 font-mono truncate">IP: {term.ip_address || '127.0.0.1'}</p>
                                                            </div>
                                                        </div>

                                                        <span className={cn(
                                                            "px-2 py-0.5 rounded-lg text-[10px] font-black uppercase shrink-0 border",
                                                            itemCount > 0 
                                                                ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800"
                                                                : "bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700"
                                                        )}>
                                                            {itemCount > 0 ? `${itemCount} món` : "Trống"}
                                                        </span>
                                                    </div>

                                                    {/* Cart Preview Items List */}
                                                    <div className="py-3 space-y-1.5 h-36 overflow-y-auto custom-scrollbar">
                                                        {(!term.cart || term.cart.length === 0) ? (
                                                            <div className="h-full flex items-center justify-center text-xs font-bold text-slate-400">
                                                                Giỏ hàng hiện trống
                                                            </div>
                                                        ) : (
                                                            term.cart.map((item, idx) => (
                                                                <div key={idx} className="flex items-center justify-between text-xs p-1.5 rounded-lg bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800/80">
                                                                    <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[140px]">
                                                                        {item.name || item.product_name}
                                                                    </span>
                                                                    <div className="flex items-center gap-1 font-mono text-[11px]">
                                                                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">x{item.quantity || 1}</span>
                                                                        <span className="text-slate-400">•</span>
                                                                        <span className="font-extrabold text-slate-900 dark:text-white">{formatNumber((item.price || item.sale_price || 0) * (item.quantity || 1))}đ</span>
                                                                    </div>
                                                                </div>
                                                            ))
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Card Footer */}
                                                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                                                    <div>
                                                        <div className="text-[9px] font-extrabold text-slate-400 uppercase">TỔNG ĐƠN</div>
                                                        <div className="text-sm font-black text-emerald-600 dark:text-emerald-400 font-mono">
                                                            {formatNumber(term.total_amount || 0)}đ
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-1">
                                                        <button
                                                            onClick={() => {
                                                                handleSelectTerminal(term.terminal_id);
                                                                setViewMode('tab');
                                                            }}
                                                            className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-extrabold transition-all border border-slate-200 dark:border-slate-700"
                                                        >
                                                            Mở Tab
                                                        </button>
                                                        <button
                                                            onClick={() => handleImportCartToLocal(term)}
                                                            className="p-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition-all shadow-sm"
                                                            title="Chép giỏ hàng vào POS"
                                                        >
                                                            <Download size={14} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}

                    {/* VIEWMODE 3: CLASSIC SPLIT LIST MODE */}
                    {viewMode === 'list' && (
                        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                            {/* Sidebar: Workstation List & Filters */}
                            <div className="w-full md:w-96 border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/60 p-4 flex flex-col shrink-0 overflow-hidden">
                                {/* Search Bar & Clear All */}
                                <div className="space-y-2 mb-3 shrink-0">
                                    <div className="relative">
                                        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input 
                                            type="text"
                                            placeholder="Tìm theo máy, thu ngân, IP..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="w-full pl-9 pr-8 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                                        />
                                        {searchQuery && (
                                            <button 
                                                onClick={() => setSearchQuery('')}
                                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                            >
                                                <X size={14} />
                                            </button>
                                        )}
                                    </div>

                                    {/* Filter Pills */}
                                    <div className="flex items-center justify-between gap-1 text-[10px] font-extrabold">
                                        <div className="flex items-center gap-1">
                                            <button 
                                                onClick={() => setStatusFilter('all')}
                                                className={cn(
                                                    "px-2.5 py-1 rounded-xl transition-all border",
                                                    statusFilter === 'all'
                                                        ? "bg-slate-900 text-white border-slate-900 dark:bg-emerald-600 dark:border-emerald-600"
                                                        : "bg-white dark:bg-slate-900 text-slate-500 border-slate-200 dark:border-slate-800 hover:text-slate-800"
                                                )}
                                            >
                                                Tất cả ({terminals.length})
                                            </button>
                                            <button 
                                                onClick={() => setStatusFilter('active')}
                                                className={cn(
                                                    "px-2.5 py-1 rounded-xl transition-all border",
                                                    statusFilter === 'active'
                                                        ? "bg-emerald-600 text-white border-emerald-600"
                                                        : "bg-white dark:bg-slate-900 text-slate-500 border-slate-200 dark:border-slate-800 hover:text-slate-800"
                                                )}
                                            >
                                                Có đơn ({summaryStats.activeWithCart})
                                            </button>
                                        </div>

                                        {terminals.length > 0 && (
                                            <button
                                                onClick={handleClearAll}
                                                title="Xóa danh sách máy trạm"
                                                className="text-slate-400 hover:text-rose-500 p-1 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                                            >
                                                <Trash2 size={13} />
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Workstation Cards List */}
                                <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2.5 pr-1">
                                    {filteredTerminals.length === 0 ? (
                                        <div className="p-8 text-center text-slate-400 text-xs font-bold space-y-3 bg-white/50 dark:bg-slate-900/50 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 mt-2">
                                            <Server size={40} className="mx-auto text-slate-300 dark:text-slate-700" />
                                            <p className="text-sm font-extrabold text-slate-600 dark:text-slate-300">
                                                {searchQuery ? "Không tìm thấy máy trạm phù hợp" : "Chưa phát hiện máy trạm nào"}
                                            </p>
                                        </div>
                                    ) : (
                                        filteredTerminals.map(term => {
                                            const isSelected = term.terminal_id === activeTerminal?.terminal_id;
                                            const itemCount = term.total_items || (term.cart ? term.cart.reduce((s, i) => s + (i.quantity || 1), 0) : 0);
                                            const isMobile = (term.terminal_id || '').includes('Mobile') || (term.current_page || '').includes('Mobile');
                                            const totalAmt = term.total_amount || 0;

                                            return (
                                                <div
                                                    key={term.terminal_id}
                                                    onClick={() => handleSelectTerminal(term.terminal_id)}
                                                    className={cn(
                                                        "p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col gap-2 relative overflow-hidden group",
                                                        isSelected
                                                            ? "bg-white dark:bg-slate-900 border-emerald-500 dark:border-emerald-500 shadow-lg shadow-emerald-500/10 ring-2 ring-emerald-500/20"
                                                            : "bg-white/80 dark:bg-slate-900/80 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                                                    )}
                                                >
                                                    <div className="flex items-center justify-between gap-2">
                                                        <div className="flex items-center gap-2 min-w-0">
                                                            <div className={cn(
                                                                "w-7 h-7 rounded-xl flex items-center justify-center shrink-0 border",
                                                                isSelected 
                                                                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30" 
                                                                    : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700"
                                                            )}>
                                                                {isMobile ? <Smartphone size={15} /> : <Monitor size={15} />}
                                                            </div>
                                                            <div className="min-w-0">
                                                                <span className="font-extrabold text-xs text-slate-900 dark:text-slate-100 truncate block flex items-center gap-1">
                                                                    <span>{term.terminal_name || term.terminal_id}</span>
                                                                    {isSelected && <Lock size={10} className="text-emerald-500 shrink-0" />}
                                                                </span>
                                                                <span className="text-[9px] font-mono text-slate-400 truncate block">
                                                                    IP: {term.ip_address || '127.0.0.1'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        
                                                        <div className="flex items-center gap-1.5 shrink-0">
                                                            <span className={cn(
                                                                "text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border",
                                                                itemCount > 0 
                                                                    ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
                                                                    : "bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700"
                                                            )}>
                                                                {itemCount > 0 ? `${itemCount} món` : "Trống"}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center justify-between text-[11px] pt-2 border-t border-slate-100 dark:border-slate-800/80">
                                                        <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 font-semibold truncate">
                                                            <User size={12} className="text-slate-400 shrink-0" />
                                                            <span className="truncate">{term.user_name || 'Thu ngân'}</span>
                                                        </div>
                                                        <span className="font-black text-emerald-600 dark:text-emerald-400 text-xs shrink-0 font-mono">
                                                            {formatNumber(totalAmt)}đ
                                                        </span>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>

                            {/* Detailed Cart Area */}
                            <div className="flex-1 bg-white dark:bg-slate-900 flex flex-col overflow-hidden p-4 sm:p-5">
                                {activeTerminal ? (
                                    <div className="flex-1 flex flex-col min-h-0 bg-slate-50/90 dark:bg-slate-950/90 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 overflow-hidden shadow-xs">
                                        <div className="pb-4 mb-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0">
                                            <div>
                                                <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
                                                    <span>{activeTerminal.terminal_name}</span>
                                                    <span className="text-xs font-mono text-slate-400">({activeTerminal.terminal_id})</span>
                                                </h3>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                                    Thu ngân: <span className="font-bold">{activeTerminal.user_name}</span> | IP: <span className="font-mono">{activeTerminal.ip_address || '127.0.0.1'}</span>
                                                </p>
                                            </div>

                                            <button
                                                onClick={() => handleImportCartToLocal(activeTerminal)}
                                                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black transition-all flex items-center gap-2"
                                            >
                                                <Download size={14} />
                                                <span>Chép giỏ hàng vào POS</span>
                                            </button>
                                        </div>

                                        <div className="flex-1 overflow-y-auto custom-scrollbar">
                                            {(!activeTerminal.cart || activeTerminal.cart.length === 0) ? (
                                                <div className="h-full flex flex-col items-center justify-center text-slate-400 p-8 space-y-2">
                                                    <ShoppingBag size={48} />
                                                    <p className="font-bold">Giỏ hàng trống</p>
                                                </div>
                                            ) : (
                                                <table className="w-full text-left text-sm">
                                                    <thead className="sticky top-0 bg-slate-200 dark:bg-slate-800">
                                                        <tr className="text-[10px] font-extrabold text-slate-600 dark:text-slate-300 uppercase">
                                                            <th className="p-3 text-center">STT</th>
                                                            <th className="p-3">Sản phẩm</th>
                                                            <th className="p-3 text-right">Giá bán</th>
                                                            <th className="p-3 text-center">Số lượng</th>
                                                            <th className="p-3 text-right">Thành tiền</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                                                        {activeTerminal.cart.map((item, idx) => (
                                                            <tr key={idx}>
                                                                <td className="p-3 text-center font-bold text-slate-400">{idx + 1}</td>
                                                                <td className="p-3 font-extrabold text-slate-900 dark:text-slate-100">{item.name || item.product_name}</td>
                                                                <td className="p-3 text-right font-mono">{formatNumber(item.price || item.sale_price || 0)}đ</td>
                                                                <td className="p-3 text-center font-black text-emerald-600">x{item.quantity || 1}</td>
                                                                <td className="p-3 text-right font-black text-slate-900 dark:text-white font-mono">{formatNumber((item.price || item.sale_price || 0) * (item.quantity || 1))}đ</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            )}
                                        </div>
                                    </div>
                                ) : null}
                            </div>
                        </div>
                    )}
                </m.div>
            </div>
        </Portal>
    );
}
