import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { m, AnimatePresence } from 'framer-motion';
import {
    Search, Plus, Warehouse, Minus, X, ClipboardList, Trash2,
    Save, History, Package, ArrowRight, RotateCcw,
    CheckCircle2, AlertTriangle, Info, ArrowLeftRight,
    Calendar, Filter
} from 'lucide-react';
import { formatNumber, cn } from '../../lib/utils';
import ProductEditModal from '../../components/ProductEditModal';
import Toast from '../../components/Toast';
import { useQueryClient } from '@tanstack/react-query';
import CategoryIcon from '../../components/CategoryIcon';

export default function InventoryAudit() {
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isProductModalOpen, setIsProductModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [isSearching, setIsSearching] = useState(false);
    const [toast, setToast] = useState(null);
    const [activeIndex, setActiveIndex] = useState(0);

    const [mode, setMode] = useState('audit'); // 'audit' or 'history'
    const [historyItems, setHistoryItems] = useState([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);
    const [selectedAudit, setSelectedAudit] = useState(null);
    const [filterStartDate, setFilterStartDate] = useState('');
    const [filterEndDate, setFilterEndDate] = useState('');
    const [filterSearch, setFilterSearch] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
    const [categories, setCategories] = useState([]);
    const [selectedCategoryId, setSelectedCategoryId] = useState(null);

    const [auditItems, setAuditItems] = useState(() => {
        const saved = localStorage.getItem('web_inventory_audit');
        return saved ? JSON.parse(saved) : [];
    });

    const [note, setNote] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [allProducts, setAllProducts] = useState([]);
    const [auditFilter, setAuditFilter] = useState('audited'); // 'audited' or 'remaining'
    const [isLoadingRemaining, setIsLoadingRemaining] = useState(false);
    const [displayLimit, setDisplayLimit] = useState(100);
    const [auditedTodayIds, setAuditedTodayIds] = useState(new Set());
    const [audited7DaysIds, setAudited7DaysIds] = useState(new Set());
    const [recentFilter, setRecentFilter] = useState('all'); // 'all', 'audited', 'pending', 'never'

    const remainingProducts = React.useMemo(() => {
        return allProducts.filter(p => !auditItems.find(ai => ai.product_id === p.id));
    }, [allProducts, auditItems]);

    const recentStats = React.useMemo(() => {
        const audited = remainingProducts.filter(p => p.latest_audit).length;
        const pending = remainingProducts.filter(p => !p.latest_audit).length;
        return { audited, pending };
    }, [remainingProducts]);

    const fetchRecentAudits = async () => {
        const today = new Date();
        const start = new Date();
        start.setDate(today.getDate() - 7);

        const startStr = start.toISOString().split('T')[0];
        const endStr = today.toISOString().split('T')[0];

        try {
            const res = await axios.get(`/api/inventory/audits?start_date=${startStr}&end_date=${endStr}&limit=500`);
            const ids7d = new Set();
            const idsToday = new Set();
            const todayStr = today.toISOString().split('T')[0];

            (res.data.items || []).forEach(audit => {
                const isToday = audit.date && audit.date.startsWith(todayStr);
                (audit.details || []).forEach(detail => {
                    ids7d.add(detail.product_id);
                    if (isToday) idsToday.add(detail.product_id);
                });
            });
            setAudited7DaysIds(ids7d);
            setAuditedTodayIds(idsToday);
        } catch (err) {
            console.error('Error fetching recent audits:', err);
        }
    };

    const fetchAllProducts = async () => {
        setIsLoadingRemaining(true);
        try {
            const res = await axios.get('/api/products?limit=5000');
            setAllProducts(res.data.items || res.data);
        } catch (err) {
            console.error('Error fetching products:', err);
        } finally {
            setIsLoadingRemaining(false);
        }
    };

    const fetchCategories = async () => {
        try {
            const res = await axios.get('/api/categories');
            setCategories(res.data);
        } catch (err) {
            console.error('Error fetching categories:', err);
        }
    };

    useEffect(() => {
        if (mode === 'audit') {
            fetchAllProducts();
            fetchRecentAudits();
            fetchCategories();
        }
    }, [mode]);

    const searchInputRef = useRef(null);
    const firstInputRef = useRef(null);
    const activeItemRef = useRef(null);

    const { totalThung, totalLe } = React.useMemo(() => {
        return auditItems.reduce((acc, item) => {
            const m = item.multiplier || 1;
            if (m > 1) {
                acc.totalThung += Math.floor(item.actual_stock / m);
                acc.totalLe += item.actual_stock % m;
            } else {
                acc.totalLe += item.actual_stock;
            }
            return acc;
        }, { totalThung: 0, totalLe: 0 });
    }, [auditItems]);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'F2') {
                e.preventDefault();
                searchInputRef.current?.focus();
            } else if (e.key === 'F12') {
                e.preventDefault();
                if (auditItems.length > 0) handleSubmitAudit();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [auditItems]);

    // Focus only once on mount
    useEffect(() => {
        setTimeout(() => searchInputRef.current?.focus(), 300);
    }, []);

    useEffect(() => {
        localStorage.setItem('web_inventory_audit', JSON.stringify(auditItems));
    }, [auditItems]);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 1024);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        if (mode === 'history') {
            if (currentPage === 1 || isSearching) {
                fetchHistory(1);
            } else {
                fetchHistory(currentPage);
            }
        }
    }, [mode, filterStartDate, filterEndDate, filterSearch, currentPage]);

    const fetchHistory = async (page = 1) => {
        setIsLoadingHistory(true);
        try {
            const limit = 20;
            let url = `/api/inventory/audits?page=${page}&limit=${limit}`;
            if (filterStartDate) url += `&start_date=${filterStartDate}`;
            if (filterEndDate) url += `&end_date=${filterEndDate}`;
            if (filterSearch) url += `&search=${filterSearch}`;

            const res = await axios.get(url);

            if (isMobile && page > 1) {
                setHistoryItems(prev => [...prev, ...res.data.items]);
            } else {
                setHistoryItems(res.data.items);
            }
            setTotalPages(res.data.pages);
        } catch (err) {
            console.error(err);
            showToast('Lỗi khi tải lịch sử', 'error');
        } finally {
            setIsLoadingHistory(false);
        }
    };

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const clearFilters = () => {
        setFilterStartDate('');
        setFilterEndDate('');
        setFilterSearch('');
        setCurrentPage(1);
    };

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            if (searchTerm.trim().length >= 2) {
                performSearch(searchTerm);
                setActiveIndex(0);
            } else {
                setSearchResults([]);
                setActiveIndex(0);
            }
        }, 300);
        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm]);

    useEffect(() => {
        if (activeItemRef.current) {
            activeItemRef.current.scrollIntoView({
                block: 'nearest',
                behavior: 'smooth'
            });
        }
    }, [activeIndex]);

    const performSearch = async (term) => {
        setIsSearching(true);
        try {
            const res = await axios.get(`/api/inventory/products/search?search=${term}`);
            setSearchResults(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setIsSearching(false);
        }
    };

    const addToAudit = (product) => {
        const existingIdx = auditItems.findIndex(i => i.product_id === product.id);
        if (existingIdx > -1) {
            showToast(`${product.name} đã có trong danh sách`, 'info');
        } else {
            const newItem = {
                product_id: product.id,
                name: product.name,
                code: product.code,
                unit: product.unit,
                secondary_unit: product.secondary_unit,
                multiplier: product.multiplier || 1,
                system_stock: product.stock,
                actual_stock: product.stock
            };
            setAuditItems(prev => [newItem, ...prev]);
            setSearchTerm('');
            setSearchResults([]);
            setActiveIndex(0);
            // Wait for render then focus
            setTimeout(() => {
                firstInputRef.current?.focus();
                firstInputRef.current?.select();
            }, 100);
        }
    };

    const updateActualStock = (product_id, value) => {
        setAuditItems(prev => prev.map(item =>
            item.product_id === product_id ? { ...item, actual_stock: parseFloat(value) || 0 } : item
        ));
    };

    const removeItem = (product_id) => {
        setAuditItems(prev => prev.filter(item => item.product_id !== product_id));
    };

    const handleSubmitAudit = async () => {
        if (auditItems.length === 0) return;
        setIsSubmitting(true);
        try {
            const payload = {
                note: note || 'Kiểm kê kho từ giao diện Web',
                status: 'Completed',
                items: auditItems.map(i => ({
                    product_id: i.product_id,
                    actual_stock: i.actual_stock,
                    system_stock: i.system_stock
                }))
            };
            await axios.post('/api/inventory/audit', payload);
            queryClient.invalidateQueries(['products']);
            setAuditItems([]);
            setNote('');
            localStorage.removeItem('web_inventory_audit');
            showToast('Đã lưu phiếu kiểm kê thành công!');
            setMode('history');
        } catch (err) {
            showToast('Lỗi khi lưu phiếu kiểm kê', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="pt-2 px-4 pb-2 w-full transition-colors duration-300 h-[calc(100vh-30px)] overflow-hidden flex flex-col font-sans relative">
            <div className="flex-1 flex flex-col overflow-hidden">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-4 relative z-10">
                <div className="flex items-center gap-4">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-black text-primary uppercase tracking-tight flex items-center gap-3 pt-2 pb-0.5 leading-relaxed">
                            <Warehouse className="text-primary" size={32} />
                            KIỂM KÊ KHO HÀNG
                        </h1>
                        <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-black uppercase rounded-lg tracking-tighter">LyangPOS by Lyang</span>
                            <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                            <p className="text-[11px] font-bold text-gray-400 dark:text-gray-500">
                                {mode === 'audit' ? 'Tạo phiếu kiểm kê mới' : 'Xem lịch sử kiểm kê hệ thống'}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex p-1.5 bg-transparent border border-border rounded-2xl relative">
                    <button
                        onClick={() => setMode('audit')}
                        className={cn(
                            "relative z-10 px-8 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all",
                            mode === 'audit' ? "text-white" : "text-[#8b6f47] hover:text-[#2d5016] dark:text-[#d4a574]/60 dark:hover:text-[#d4a574]"
                        )}
                    >
                        KIỂM MỚI
                        {mode === 'audit' && (
                            <m.div
                                layoutId="auditModeIndicator"
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
                                layoutId="auditModeIndicator"
                                className="absolute inset-0 bg-primary rounded-xl -z-10"
                                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                            />
                        )}
                    </button>
                </div>
            </div>

            <div className="flex-1 pos-card rounded-2xl border border-border overflow-hidden flex shadow-none">
                {mode === 'audit' ? (
                    <>
                        {/* Sidebar: Search & Pending */}
                        <div className="w-[420px] bg-transparent border-r border-border flex flex-col p-6">
                            {/* Category Filter Bar */}
                            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 mb-4">
                                <button
                                    onClick={() => setSelectedCategoryId(null)}
                                    className={cn(
                                        "px-2.5 py-1.5 rounded-xl text-[10px] font-black uppercase transition-all flex items-center gap-1.5 whitespace-nowrap border border-border shadow-none",
                                        selectedCategoryId === null
                                            ? "bg-primary text-white border-primary"
                                            : "bg-transparent text-slate-400 hover:border-primary/30"
                                    )}
                                >
                                    <Package size={12} />
                                    <span>Tất cả</span>
                                </button>
                                {categories.map((cat) => (
                                    <button
                                        key={cat.id}
                                        onClick={() => setSelectedCategoryId(cat.id === selectedCategoryId ? null : cat.id)}
                                        className={cn(
                                            "px-2.5 py-1.5 rounded-xl text-[10px] font-black uppercase transition-all flex items-center gap-1.5 whitespace-nowrap border border-border shadow-none",
                                            selectedCategoryId === cat.id
                                                ? "bg-primary text-white border-primary"
                                                : "bg-transparent text-slate-400 hover:border-primary/30"
                                        )}
                                    >
                                        <CategoryIcon name={cat.icon} size={12} />
                                        <span>{cat.name}</span>
                                    </button>
                                ))}
                            </div>

                            <div className="relative group mb-6">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={20} />
                                <input
                                    ref={searchInputRef}
                                    className="w-full bg-transparent border border-border focus:ring-1 focus:ring-primary/20 rounded-xl py-3.5 pl-12 pr-4 outline-none font-medium text-sm transition-all text-foreground"
                                    placeholder="TÌM TÊN / MÃ SẢN PHẨM..."
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                    onKeyDown={e => {
                                        if (e.key === 'ArrowDown') {
                                            e.preventDefault();
                                            setActiveIndex(prev => Math.min(prev + 1, searchResults.length - 1));
                                        } else if (e.key === 'ArrowUp') {
                                            e.preventDefault();
                                            setActiveIndex(prev => Math.max(prev - 1, 0));
                                        } else if (e.key === 'Enter') {
                                            if (searchResults.length > 0) {
                                                addToAudit(searchResults[activeIndex]);
                                            }
                                        }
                                    }}
                                />
                                {isSearching && (
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                        <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                    </div>
                                )}

                                <AnimatePresence>
                                    {searchTerm.length >= 2 && (
                                        <m.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="absolute top-full left-0 right-0 mt-2 bg-popover rounded-xl shadow-lg border border-border z-50 max-h-[300px] overflow-y-auto no-scrollbar p-1"
                                        >
                                            {searchResults.length === 0 && !isSearching ? (
                                                <div className="p-8 text-center text-slate-400 text-xs font-bold uppercase tracking-widest">Không tìm thấy sản phẩm</div>
                                            ) : (
                                                searchResults.map((p, index) => {
                                                    const isAdded = auditItems.find(ai => ai.product_id === p.id);
                                                    const isAuditedToday = auditedTodayIds.has(p.id);
                                                    return (
                                                        <button
                                                            key={p.id}
                                                            ref={activeIndex === index ? activeItemRef : null}
                                                            onClick={() => !isAdded && addToAudit(p)}
                                                            className={cn(
                                                                "w-full flex items-center justify-between p-3 rounded-lg transition-all text-left border-b border-border last:border-0 group/item",
                                                                isAdded ? "opacity-50 cursor-default bg-muted" : (activeIndex === index ? "bg-primary/10" : "hover:bg-primary/5 cursor-pointer")
                                                            )}
                                                        >
                                                            <div className="flex-1 pr-4">
                                                                <div 
                                                                    className="font-black text-xs text-slate-800 dark:text-slate-100 uppercase group-hover/item:text-primary transition-colors flex items-center gap-2 cursor-pointer"
                                                                    onDoubleClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setEditingProduct(p);
                                                                        setIsProductModalOpen(true);
                                                                    }}
                                                                >
                                                                    {p.name}
                                                                    {isAdded && <span className="text-[8px] bg-emerald-500 text-white px-1.5 py-0.5 rounded-full whitespace-nowrap">Đang trong phiếu</span>}
                                                                    {isAuditedToday && !isAdded && <span className="text-[8px] bg-amber-500 text-white px-1.5 py-0.5 rounded-full whitespace-nowrap">Đã kiểm hôm nay</span>}
                                                                </div>
                                                                <div className="text-[10px] font-bold text-slate-400 mt-1">Mã: {p.code || '---'} | Tồn: {p.stock} {p.unit}</div>
                                                            </div>
                                                            {!isAdded && <Plus size={16} className="text-primary opacity-0 group-hover:opacity-100 transition-all" />}
                                                        </button>
                                                    );
                                                })
                                            )}
                                        </m.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            <div className="flex-1 overflow-y-auto space-y-3 no-scrollbar">
                                <div className="flex items-center justify-between px-2 mb-2">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sản phẩm đang chọn ({auditItems.length})</span>
                                    {auditItems.length > 0 && (
                                        <button onClick={() => setAuditItems([])} className="text-[10px] font-black text-rose-500 uppercase hover:underline underline-offset-4">Xóa hết</button>
                                    )}
                                </div>

                                {auditItems.length === 0 ? (
                                    <div className="h-64 flex flex-col items-center justify-center text-slate-300 dark:text-slate-800 grayscale opacity-40">
                                        <Package size={64} strokeWidth={1} className="mb-4" />
                                        <p className="font-black text-[10px] uppercase tracking-widest text-center px-10 leading-relaxed">Chưa có sản phẩm nào trong danh sách</p>
                                    </div>
                                ) : (
                                    auditItems.map((item) => (
                                        <m.div
                                            key={item.product_id}
                                            layout
                                            whileHover={{ y: -2, scale: 1.01 }}
                                            className="pos-card p-3 rounded-xl border border-border hover:border-primary/40 transition-all group bg-transparent shadow-none cursor-pointer"
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <div 
                                                    className="font-black text-xs text-slate-800 dark:text-slate-100 uppercase truncate pr-4 cursor-pointer hover:text-primary transition-colors"
                                                    onDoubleClick={() => {
                                                        const p = allProducts.find(x => x.id === item.product_id);
                                                        if (p) {
                                                            setEditingProduct(p);
                                                            setIsProductModalOpen(true);
                                                        }
                                                    }}
                                                >
                                                    {item.name}
                                                </div>
                                                <button onClick={() => removeItem(item.product_id)} className="text-slate-300 hover:text-rose-500 transition-colors">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                            <div className="flex items-center justify-between text-[10px] font-bold">
                                                <div className="text-slate-400">Mã: {item.code || '---'}</div>
                                                <div className="text-primary/60">Hệ thống: {item.system_stock} {item.unit}</div>
                                            </div>
                                        </m.div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Main Table Content */}
                        <div className="flex-1 flex flex-col min-h-0 bg-transparent overflow-hidden">
                            {/* Sticky Header Container */}
                            <div className="sticky top-0 z-30 bg-transparent border-b border-border">
                                <div className="flex items-center justify-between px-6 py-4">
                                    <div className="flex bg-transparent p-1 rounded-xl border border-border">
                                        <button
                                            onClick={() => setAuditFilter('audited')}
                                            className={cn(
                                                "px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                                                auditFilter === 'audited' ? "bg-primary text-white shadow-none" : "text-slate-400"
                                            )}
                                        >
                                            Đã kiểm ({auditItems.length})
                                        </button>
                                        <button
                                            onClick={() => setAuditFilter('remaining')}
                                            className={cn(
                                                "px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                                                auditFilter === 'remaining' ? "bg-primary text-white shadow-none" : "text-slate-400"
                                            )}
                                        >
                                            Chưa kiểm ({allProducts.length - auditItems.length})
                                        </button>
                                    </div>
                                    <m.button
                                        whileHover={{ y: -2, scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => {
                                            setEditingProduct(null);
                                            setIsProductModalOpen(true);
                                        }}
                                        className="flex items-center gap-2 px-6 py-2 rounded-xl bg-transparent text-amber-600 border border-amber-500/20 font-black text-[10px] uppercase tracking-widest hover:border-amber-500/40 transition-all shadow-none"
                                    >
                                        <Package size={16} />
                                        + Thêm hàng mới
                                    </m.button>
                                    {auditFilter === 'remaining' && (
                                        <div className="flex bg-transparent p-1 rounded-xl border border-border">
                                            <button
                                                onClick={() => setRecentFilter('all')}
                                                className={cn(
                                                    "px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all",
                                                    recentFilter === 'all' ? "bg-primary/10 text-primary shadow-none" : "text-slate-400"
                                                )}
                                            >
                                                Tất cả
                                            </button>
                                            <button
                                                onClick={() => setRecentFilter('audited')}
                                                className={cn(
                                                    "px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all",
                                                    recentFilter === 'audited' ? "bg-primary/10 text-amber-500 shadow-none" : "text-slate-400"
                                                )}
                                            >
                                                Đã kiểm ({recentStats.audited})
                                            </button>
                                            <button
                                                onClick={() => setRecentFilter('never')}
                                                className={cn(
                                                    "px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all",
                                                    recentFilter === 'never' ? "bg-primary/10 text-rose-500 shadow-none" : "text-slate-400"
                                                )}
                                            >
                                                Chưa bao giờ kiểm ({recentStats.pending})
                                            </button>
                                        </div>
                                    )}
                                </div>
                                <div className="px-6 py-2 border-b border-border">
                                    <div className="text-[10px] font-bold text-slate-400 italic">
                                        {auditFilter === 'audited' ? 'Danh sách sản phẩm đã được nhập số lượng' : 'Danh sách sản phẩm trong kho chưa được thêm vào phiếu'}
                                    </div>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto no-scrollbar min-h-0">
                                <table className="w-full text-left border-separate border-spacing-0">
                                    <thead className="sticky top-0 z-20 bg-primary/5 backdrop-blur-md">
                                        <tr>
                                            <th className="p-6 text-[11px] font-black uppercase tracking-widest text-slate-450 text-muted border-b border-border">Sản phẩm</th>
                                            <th className="p-6 text-[11px] font-black uppercase tracking-widest text-slate-450 text-muted border-b border-border text-center">Tồn hệ thống</th>
                                            <th className="p-6 text-[11px] font-black uppercase tracking-widest text-slate-450 text-muted border-b border-border text-center w-72">
                                                {auditFilter === 'audited' ? 'Thực tế' : 'Thao tác'}
                                            </th>
                                            {auditFilter === 'audited' && (
                                                <th className="p-6 text-[11px] font-black uppercase tracking-widest text-slate-450 text-muted border-b border-border text-center">Chênh lệch</th>
                                            )}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {auditFilter === 'remaining' ? (
                                            <>
                                                {allProducts
                                                    .filter(p => !auditItems.find(ai => ai.product_id === p.id))
                                                    .filter(p => !searchTerm || p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.code?.toLowerCase().includes(searchTerm.toLowerCase()))
                                                    .filter(p => !selectedCategoryId || p.category_id === selectedCategoryId)
                                                    .filter(p => {
                                                        if (recentFilter === 'audited') return !!p.latest_audit;
                                                        if (recentFilter === 'never') return !p.latest_audit;
                                                        return true;
                                                    })
                                                    .sort((a, b) => {
                                                        if (!a.latest_audit) return -1;
                                                        if (!b.latest_audit) return 1;
                                                        return new Date(a.latest_audit) - new Date(b.latest_audit);
                                                    })
                                                    .slice(0, displayLimit)
                                                    .map(product => {
                                                        const isAuditedToday = auditedTodayIds.has(product.id);
                                                        const lastAudit = product.latest_audit ? new Date(product.latest_audit) : null;
                                                        const daysSinceAudit = lastAudit ? Math.floor((new Date() - lastAudit) / (1000 * 60 * 60 * 24)) : null;

                                                        let statusColor = "bg-rose-500/10 text-rose-600 border-rose-200";
                                                        let statusText = "CHƯA KIỂM";

                                                        if (isAuditedToday) {
                                                            statusColor = "bg-emerald-500 text-white border-emerald-500";
                                                            statusText = "HÔM NAY";
                                                        } else if (lastAudit) {
                                                            if (daysSinceAudit < 7) {
                                                                statusColor = "bg-emerald-500/10 text-emerald-600 border-emerald-200";
                                                                statusText = `< 7 NGÀY`;
                                                            } else if (daysSinceAudit < 30) {
                                                                statusColor = "bg-amber-500/10 text-amber-600 border-amber-200";
                                                                statusText = `${daysSinceAudit} NGÀY QUA`;
                                                            } else {
                                                                statusColor = "bg-rose-500/10 text-rose-600 border-rose-400";
                                                                statusText = `> 30 NGÀY`;
                                                            }
                                                        }
                                                        return (
                                                            <tr key={product.id} className="group hover:bg-primary/5 transition-colors">
                                                                <td className="p-6">
                                                                    <div className="flex items-center gap-2">
                                                                        <div 
                                                                        className="font-black text-sm text-slate-800 dark:text-white uppercase cursor-pointer hover:text-primary transition-colors"
                                                                        onDoubleClick={() => {
                                                                            setEditingProduct(product);
                                                                            setIsProductModalOpen(true);
                                                                        }}
                                                                    >
                                                                        {product.name}
                                                                    </div>
                                                                        <span className={cn("text-[9px] px-2 py-0.5 rounded-md font-black uppercase tracking-widest border shadow-sm", statusColor)}>
                                                                            {statusText}
                                                                            {lastAudit && !isAuditedToday && (
                                                                                <span className="ml-1.5 opacity-60 font-bold border-l pl-1.5 border-current">
                                                                                    {lastAudit.toLocaleDateString('vi-VN')}
                                                                                </span>
                                                                            )}
                                                                        </span>
                                                                    </div>
                                                                    <div className="text-[11px] font-bold text-slate-400 mt-0.5 capitalize">Mã: {product.code || '---'} | Đơn vị: {product.unit}</div>
                                                                </td>
                                                                <td className="p-6 text-center">
                                                                    <span className="font-black text-lg text-slate-600 dark:text-slate-300">{product.stock} {product.unit}</span>
                                                                </td>
                                                                <td className="p-6 text-center">
                                                                    <m.button
                                                                        whileHover={{ y: -2, scale: 1.02 }}
                                                                        whileTap={{ scale: 0.98 }}
                                                                        onClick={() => addToAudit(product)}
                                                                        className="px-6 py-2 bg-primary/10 text-primary rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-primary hover:text-white transition-all shadow-none"
                                                                    >
                                                                        + Thêm vào phiếu
                                                                    </m.button>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })
                                                }
                                                {allProducts.filter(p => !auditItems.find(ai => ai.product_id === p.id)).length > displayLimit && (
                                                    <tr>
                                                        <td colSpan="3" className="p-8 text-center text-slate-400">
                                                            <button
                                                                onClick={() => setDisplayLimit(prev => prev + 200)}
                                                                className="px-8 py-3 bg-transparent hover:bg-slate-200 dark:hover:bg-slate-700 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all"
                                                            >
                                                                Xem thêm {allProducts.filter(p => !auditItems.find(ai => ai.product_id === p.id)).length - displayLimit} sản phẩm...
                                                            </button>
                                                        </td>
                                                    </tr>
                                                )}
                                            </>
                                        ) : auditItems.length === 0 ? (
                                            <tr>
                                                <td colSpan="4" className="py-40 text-center">
                                                    <div className="flex flex-col items-center opacity-20 dark:opacity-10 grayscale">
                                                        <ClipboardList size={80} className="mb-4" />
                                                        <span className="font-black text-sm uppercase tracking-[0.4em]">Danh sách trống</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : (
                                            auditItems.map((item, index) => {
                                                const diff = item.actual_stock - item.system_stock;
                                                return (
                                                    <tr key={item.product_id} className="group hover:bg-primary/5 transition-colors">
                                                        <td className="p-6">
                                                            <div 
                                                                className="font-black text-sm text-slate-800 dark:text-white uppercase cursor-pointer hover:text-primary transition-colors"
                                                                onDoubleClick={() => {
                                                                    const p = allProducts.find(x => x.id === item.product_id);
                                                                    if (p) {
                                                                        setEditingProduct(p);
                                                                        setIsProductModalOpen(true);
                                                                    }
                                                                }}
                                                            >
                                                                {item.name}
                                                            </div>
                                                            <div className="text-[11px] font-bold text-slate-400 mt-0.5 capitalize">Đơn vị tính: {item.unit}</div>
                                                        </td>
                                                        <td className="p-6 text-center">
                                                             <div className="inline-flex flex-col items-center px-4 py-2 bg-transparent rounded-xl border border-border">
                                                                 <span className="text-xl font-black tabular-nums dark:text-white">{item.system_stock}</span>
                                                                 <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{item.unit}</span>
                                                             </div>
                                                         </td>
                                                         <td className="p-6">
                                                             <div className="flex flex-col gap-2">
                                                                 {item.multiplier > 1 ? (
                                                                     <div className="flex flex-col gap-2">
                                                                         <div className="flex items-center gap-2">
                                                                             <div className="flex-1 relative">
                                                                                 <input
                                                                                     type="number"
                                                                                     ref={index === 0 ? firstInputRef : null}
                                                                                     className="w-full bg-transparent border border-border focus:ring-1 focus:ring-primary/20 py-2.5 rounded-xl text-center font-black text-lg outline-none tabular-nums text-foreground transition-all shadow-none"
                                                                                     value={Math.trunc(item.actual_stock / item.multiplier) || ''}
                                                                                     onFocus={e => e.target.select()}
                                                                                     onChange={e => {
                                                                                         const secVal = parseInt(e.target.value) || 0;
                                                                                         const priVal = item.actual_stock % item.multiplier;
                                                                                         updateActualStock(item.product_id, secVal * item.multiplier + priVal);
                                                                                     }}
                                                                                     onKeyDown={e => {
                                                                                         if (e.key === 'Enter') {
                                                                                             e.preventDefault();
                                                                                             searchInputRef.current?.focus();
                                                                                             searchInputRef.current?.select();
                                                                                         }
                                                                                     }}
                                                                                 />
                                                                                 <span className="absolute -top-2 left-4 px-1.5 bg-background text-[9px] font-black text-primary uppercase border border-border rounded-md shadow-none">{item.secondary_unit}</span>
                                                                             </div>
                                                                             <Plus size={14} className="text-slate-300" />
                                                                             <div className="flex-1 relative">
                                                                                 <input
                                                                                     type="number"
                                                                                     className="w-full bg-transparent border border-border focus:ring-1 focus:ring-primary/20 py-2.5 rounded-xl text-center font-black text-lg outline-none tabular-nums text-foreground transition-all shadow-none"
                                                                                     value={(item.actual_stock % item.multiplier) || ''}
                                                                                     onFocus={e => e.target.select()}
                                                                                     onChange={e => {
                                                                                         const priVal = parseFloat(e.target.value) || 0;
                                                                                         const secVal = Math.trunc(item.actual_stock / item.multiplier);
                                                                                         updateActualStock(item.product_id, secVal * item.multiplier + priVal);
                                                                                     }}
                                                                                     onKeyDown={e => {
                                                                                         if (e.key === 'Enter') {
                                                                                             e.preventDefault();
                                                                                             searchInputRef.current?.focus();
                                                                                             searchInputRef.current?.select();
                                                                                         }
                                                                                     }}
                                                                                 />
                                                                                 <span className="absolute -top-2 left-4 px-1.5 bg-background text-[9px] font-black text-primary uppercase border border-border rounded-md shadow-none">Lẻ ({item.unit})</span>
                                                                             </div>
                                                                         </div>
                                                                         <div className="flex items-center justify-center gap-2">
                                                                             <div className="h-px flex-1 bg-border" />
                                                                             <span className="text-[9px] font-black text-slate-400 uppercase bg-transparent px-2 py-0.5 rounded border border-border">
                                                                                 Tổng quy lẻ: <span className="text-primary tabular-nums text-xs">{item.actual_stock}</span> {item.unit}
                                                                             </span>
                                                                             <div className="h-px flex-1 bg-border" />
                                                                         </div>
                                                                     </div>
                                                                 ) : (
                                                                     <div className="relative">
                                                                         <input
                                                                             type="number"
                                                                             ref={index === 0 ? firstInputRef : null}
                                                                             className="w-full bg-transparent border border-border focus:ring-1 focus:ring-primary/20 py-3 rounded-xl text-center font-black text-xl outline-none tabular-nums text-foreground transition-all shadow-none"
                                                                             value={item.actual_stock || ''}
                                                                             onFocus={e => e.target.select()}
                                                                             onChange={e => updateActualStock(item.product_id, e.target.value)}
                                                                             onKeyDown={e => {
                                                                                 if (e.key === 'Enter') {
                                                                                     e.preventDefault();
                                                                                     searchInputRef.current?.focus();
                                                                                     searchInputRef.current?.select();
                                                                                 }
                                                                             }}
                                                                         />
                                                                         <span className="absolute top-1/2 -translate-y-1/2 right-4 text-[11px] font-black text-slate-300 uppercase">{item.unit}</span>
                                                                     </div>
                                                                 )}
                                                             </div>
                                                         </td>
                                                         <td className="p-6 text-center">
                                                             <div className={cn(
                                                                 "inline-flex flex-col items-center px-6 py-2 rounded-xl border shadow-none transition-all duration-300",
                                                                 diff === 0
                                                                     ? "bg-transparent border-border text-slate-400"
                                                                     : diff > 0
                                                                         ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:bg-emerald-500/10 dark:border-emerald-500/20"
                                                                         : "bg-rose-500/10 border-rose-500/20 text-rose-600 dark:bg-rose-500/10 dark:border-rose-500/20"
                                                             )}>
                                                                 <span className="text-2xl font-black tabular-nums">{diff > 0 ? '+' : ''}{formatNumber(diff)}</span>
                                                                 <div className="flex items-center gap-1.5 mt-0.5">
                                                                     {diff === 0 ? <CheckCircle2 size={12} /> : diff > 0 ? <Plus size={12} /> : <Minus size={12} />}
                                                                     <span className="text-[10px] font-black uppercase tracking-tight">{diff === 0 ? 'Khớp tồn' : diff > 0 ? 'Dư thừa' : 'Hao hụt'}</span>
                                                                 </div>
                                                             </div>
                                                         </td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            <div className="p-8 bg-transparent border-t border-border flex items-center justify-between gap-10">
                                <div className="flex-1 relative max-w-2xl">
                                    <label className="absolute -top-2 left-5 px-2 bg-background text-[10px] font-black text-slate-400 uppercase tracking-widest z-10 rounded-md">Ghi chú đợt kiểm kê</label>
                                    <textarea
                                        className="w-full bg-transparent border border-border focus:ring-1 focus:ring-primary/20 rounded-2xl p-5 outline-none font-bold text-sm min-h-[90px] text-foreground transition-all shadow-none"
                                        placeholder="Nhập ghi chú quan trọng cho lần kiểm kê này..."
                                        value={note}
                                        onChange={e => setNote(e.target.value)}
                                    />
                                </div>

                                <div className="flex flex-col items-end gap-4 min-w-[340px]">
                                    <div className="flex items-center gap-8 px-6 py-4 bg-transparent rounded-2xl border border-border">
                                        <div className="flex flex-col items-end">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tổng mặt hàng</span>
                                            <span className="text-2xl font-black text-primary tracking-tighter tabular-nums">{auditItems.length}</span>
                                        </div>
                                        <div className="w-px h-10 bg-border" />
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Hao hụt/Mất mát</span>
                                            <span className="text-2xl font-black text-rose-500 tracking-tighter tabular-nums">-{auditItems.filter(i => (i.actual_stock - i.system_stock) < 0).length}</span>
                                        </div>
                                        <div className="w-px h-10 bg-border" />
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tổng thùng + lẻ</span>
                                            <div className="flex items-baseline gap-1">
                                                <span className="text-2xl font-black text-emerald-500 tracking-tighter tabular-nums">{formatNumber(totalThung)}</span>
                                                <span className="text-[8px] font-bold text-slate-400 uppercase">Thùng</span>
                                                <span className="text-xl font-black text-amber-500 tracking-tighter tabular-nums ml-1">{formatNumber(totalLe)}</span>
                                                <span className="text-[8px] font-bold text-slate-400 uppercase">Lẻ</span>
                                            </div>
                                        </div>
                                    </div>

                                    <m.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        disabled={auditItems.length === 0 || isSubmitting}
                                        onClick={handleSubmitAudit}
                                        className={cn(
                                            "w-full py-4 rounded-xl font-black uppercase tracking-[0.2em] shadow-none flex items-center justify-center gap-4 transition-all group",
                                            isSubmitting || auditItems.length === 0
                                                ? "bg-slate-200 text-slate-400 dark:bg-slate-800 dark:text-slate-600 cursor-not-allowed shadow-none"
                                                : "bg-primary text-white shadow-none hover:brightness-110 active:shadow-inner"
                                        )}
                                    >
                                        {isSubmitting ? (
                                            <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                                        ) : (
                                            <>
                                                LƯU PHIẾU KIỂM
                                                <Save size={24} className="group-hover:translate-x-1 transition-transform" />
                                            </>
                                        )}
                                    </m.button>
                                </div>
                            </div>
                        </div>
                    </>
                ) : (
                    /* History Mode Page Component */
                    <div className="flex-1 flex flex-col overflow-hidden">
                        <div className="px-8 py-5 flex items-center justify-between border-b border-border bg-transparent">
                            <div className="flex items-center gap-4">
                                <span className="text-xs font-black text-slate-400 uppercase tracking-widest">
                                    Tìm thấy {historyItems.length} phiếu trong hệ thống
                                </span>
                                {(filterStartDate || filterEndDate || filterSearch) && (
                                    <button
                                        onClick={clearFilters}
                                        className="px-4 py-1.5 bg-rose-50/50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400 rounded-full text-[10px] font-black uppercase hover:bg-rose-100 transition-colors shadow-none border border-rose-200/20"
                                    >
                                        Xóa tất cả bộ lọc
                                    </button>
                                )}
                            </div>

                            <div className="flex items-center gap-4">
                                <div className="relative">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                    <input
                                        value={filterSearch}
                                        onChange={e => setFilterSearch(e.target.value)}
                                        placeholder="TÌM THEO GHI CHÚ..."
                                        className="bg-transparent border border-border focus:ring-1 focus:ring-primary/20 rounded-xl py-2.5 pl-10 pr-4 outline-none font-medium text-[11px] w-72 shadow-none text-slate-700 dark:text-white"
                                    />
                                </div>
                                <div className="flex items-center bg-transparent rounded-xl border border-border px-4 py-2 gap-4">
                                    <div className="flex items-center gap-2">
                                        <Calendar size={14} className="text-primary" />
                                        <input
                                            type="date"
                                            value={filterStartDate}
                                            onChange={e => setFilterStartDate(e.target.value)}
                                            className="bg-transparent text-[11px] font-black uppercase dark:text-white outline-none cursor-pointer"
                                        />
                                    </div>
                                    <ArrowRight size={14} className="text-slate-300" />
                                    <input
                                        type="date"
                                        value={filterEndDate}
                                        onChange={e => setFilterEndDate(e.target.value)}
                                        className="bg-transparent text-[11px] font-black uppercase dark:text-white outline-none cursor-pointer"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-8 flex flex-col gap-4 no-scrollbar">
                            {isLoadingHistory ? (
                                <div className="py-40 flex flex-col items-center justify-center opacity-30 grayscale">
                                    <RotateCcw size={80} className="animate-spin mb-6 text-primary" />
                                    <span className="font-black text-sm uppercase tracking-[0.5em]">Đang đồng bộ dữ liệu...</span>
                                </div>
                            ) : historyItems.length === 0 ? (
                                <div className="py-40 flex flex-col items-center justify-center opacity-20 grayscale">
                                    <Info size={80} className="mb-6" />
                                    <span className="font-black text-sm uppercase tracking-[0.5em]">Không tìm thấy phiếu nào thích hợp</span>
                                </div>
                            ) : (
                                historyItems.map((audit) => (
                                    <m.div
                                        key={audit.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        whileHover={{ x: 4 }}
                                        onClick={() => setSelectedAudit(audit)}
                                        className="bg-transparent p-5 rounded-2xl border border-border shadow-none cursor-pointer transition-all hover:border-primary/40 relative group flex items-center gap-6"
                                    >
                                        <div className="w-14 h-14 bg-primary/10 text-primary rounded-2xl flex items-center justify-center shrink-0">
                                            <ClipboardList size={24} />
                                        </div>

                                        <div className="w-40 shrink-0">
                                            <div className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tighter">PHIẾU #{audit.id}</div>
                                            <div className="text-[10px] font-bold text-slate-400 mt-0.5 tracking-wider">{new Date(audit.date).toLocaleString('vi-VN')}</div>
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="text-[11px] font-bold text-slate-600 dark:text-slate-400 italic line-clamp-1">
                                                {audit.note ? `"${audit.note}"` : 'Khoản kiểm kê định kỳ không có ghi chú'}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-8 shrink-0">
                                            <div className="flex items-center gap-3">
                                                <div className="flex -space-x-2">
                                                    {[0, 1, 2].map((i) => (
                                                        <div key={i} className="w-6 h-6 rounded-full border-2 border-white dark:border-slate-800 bg-slate-200 dark:bg-slate-700" />
                                                    ))}
                                                </div>
                                                <span className="text-[10px] font-black text-slate-500 uppercase">{audit.details.length} mặt hàng</span>
                                            </div>

                                            <span className="px-3 py-1 bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 rounded-lg text-[9px] font-black uppercase border border-emerald-100 dark:border-emerald-500/20">Hoàn tất</span>

                                            <div className="w-10 h-10 rounded-2xl bg-transparent dark:bg-slate-700 flex items-center justify-center text-slate-400 group-hover:bg-primary group-hover:text-white transition-all transform group-hover:translate-x-1">
                                                <ArrowRight size={20} />
                                            </div>
                                        </div>
                                    </m.div>
                                ))
                            )}

                            {/* Pagination Logic */}
                            {!isLoadingHistory && historyItems.length > 0 && (
                                <div className="mt-8 mb-12 flex justify-center">
                                    {isMobile ? (
                                        // Mobile: "Load More" Button
                                        currentPage < totalPages && (
                                            <m.button
                                                whileTap={{ scale: 0.95 }}
                                                onClick={() => setCurrentPage(prev => prev + 1)}
                                                className="w-full max-w-sm py-4 bg-transparent border-2 border-slate-100 dark:border-slate-700 rounded-3xl font-black text-xs uppercase tracking-[0.2em] text-primary shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-3"
                                            >
                                                Tải thêm dữ liệu
                                                <RotateCcw size={16} />
                                            </m.button>
                                        )
                                    ) : (
                                        // Web: Numeric Pagination
                                        <div className="flex items-center gap-2 p-2 bg-transparent rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
                                            <button
                                                disabled={currentPage === 1}
                                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                                className="p-2 hover:bg-transparent dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed rounded-xl transition-all"
                                            >
                                                <ArrowLeftRight size={18} className="rotate-180" />
                                            </button>

                                            {[...Array(totalPages)].map((_, i) => {
                                                const pageNum = i + 1;
                                                // Show only near current page (sliding window logic)
                                                if (
                                                    pageNum === 1 ||
                                                    pageNum === totalPages ||
                                                    (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                                                ) {
                                                    return (
                                                        <button
                                                            key={pageNum}
                                                            onClick={() => setCurrentPage(pageNum)}
                                                            className={cn(
                                                                "min-w-[40px] h-10 rounded-xl font-black text-xs transition-all",
                                                                currentPage === pageNum
                                                                    ? "bg-primary text-white shadow-lg shadow-primary/20"
                                                                    : "hover:bg-transparent dark:hover:bg-slate-700 text-slate-400"
                                                            )}
                                                        >
                                                            {pageNum}
                                                        </button>
                                                    );
                                                } else if (
                                                    pageNum === currentPage - 2 ||
                                                    pageNum === currentPage + 2
                                                ) {
                                                    return <span key={pageNum} className="text-slate-300">...</span>;
                                                }
                                                return null;
                                            })}

                                            <button
                                                disabled={currentPage === totalPages}
                                                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                                className="p-2 hover:bg-transparent dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed rounded-xl transition-all"
                                            >
                                                <ArrowLeftRight size={18} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Audit Details Modal (Portal-less because it's already within full-page layout) */}
            <AnimatePresence>
                {selectedAudit && (
                    <div className="fixed inset-0 z-[5000] flex items-center justify-center p-6">
                        <m.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedAudit(null)}
                            className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl"
                        />
                        <m.div
                            initial={{ scale: 0.9, opacity: 0, y: 50 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 50 }}
                            className="relative w-full max-w-5xl bg-background rounded-2xl border border-border shadow-none overflow-hidden flex flex-col max-h-[85vh]"
                        >
                            <div className="p-8 border-b border-border flex justify-between items-center bg-transparent">
                                <div className="flex items-center gap-6">
                                    <div className="p-4 bg-primary text-white shadow-xl shadow-primary/20 rounded-[1.5rem] transform -rotate-3 hover:rotate-0 transition-transform">
                                        <Package size={32} />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">Chi tiết phiếu kiểm kê #{selectedAudit.id}</h2>
                                        <div className="flex items-center gap-3 mt-1.5">
                                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{new Date(selectedAudit.date).toLocaleString('vi-VN')}</span>
                                            <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                                            <span className="text-[11px] font-black text-primary uppercase">Trạng thái: Hoàn tất</span>
                                        </div>
                                    </div>
                                </div>
                                <button onClick={() => setSelectedAudit(null)} className="p-4 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-3xl transition-all"><X size={30} /></button>
                            </div>

                            <div className="p-10 pt-4 overflow-y-auto space-y-8 no-scrollbar">
                                <table className="w-full text-left">
                                    <thead className="sticky top-0 bg-transparent z-10 border-b-2 border-slate-100 dark:border-slate-800">
                                        <tr>
                                            <th className="py-6 text-[11px] font-black uppercase text-slate-400 tracking-[0.2em] w-1/2">Mặt hàng</th>
                                            <th className="py-6 text-[11px] font-black uppercase text-slate-400 tracking-[0.2em] text-center">Hệ thống</th>
                                            <th className="py-6 text-[11px] font-black uppercase text-slate-400 tracking-[0.2em] text-center">Thực tế</th>
                                            <th className="py-6 text-[11px] font-black uppercase text-slate-400 tracking-[0.2em] text-center">Chênh lệch</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/10">
                                        {selectedAudit.details.map((detail, idx) => {
                                            const diff = detail.discrepancy;
                                            return (
                                                <tr key={idx} className="group hover:bg-transparent/50 dark:hover:bg-white/5 transition-colors">
                                                    <td className="py-8">
                                                        <div className="font-black text-base text-slate-800 dark:text-slate-100 uppercase tracking-tight">{detail.product_name}</div>
                                                        <div className="flex items-center gap-3 mt-2">
                                                            <div className="px-2 py-0.5 bg-transparent text-[10px] font-black text-slate-500 rounded uppercase">mã: {detail.product_code || '---'}</div>
                                                            <div className="text-[10px] font-bold text-slate-400 italic">Đơn vị: {detail.unit}</div>
                                                        </div>
                                                    </td>
                                                    <td className="py-8 text-center tabular-nums font-bold text-slate-500 dark:text-slate-400 text-lg">{detail.system_stock}</td>
                                                    <td className="py-8 text-center">
                                                        <div className="inline-flex flex-col items-center">
                                                            <span className="text-xl font-black text-primary tabular-nums">{detail.actual_stock}</span>
                                                            {detail.multiplier > 1 && (
                                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter mt-1">
                                                                    ≈ {Math.trunc(detail.actual_stock / detail.multiplier)} {detail.secondary_unit}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="py-8 text-center">
                                                        <div className={cn(
                                                            "inline-flex items-center gap-2 px-5 py-2 rounded-2xl text-sm font-black tabular-nums border",
                                                            diff === 0
                                                                ? "text-slate-400 border-slate-100 bg-transparent dark:border-slate-800 dark:bg-slate-800/20"
                                                                : diff > 0
                                                                    ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                                                                    : "bg-rose-500/10 text-rose-600 border-rose-500/20"
                                                        )}>
                                                            {diff > 0 ? <Plus size={14} strokeWidth={4} /> : diff < 0 ? <Minus size={14} strokeWidth={4} /> : <CheckCircle2 size={14} strokeWidth={3} />}
                                                            {Math.abs(diff)}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>

                                {selectedAudit.note && (
                                    <div className="mt-10 p-8 bg-amber-50 dark:bg-amber-900/10 rounded-[2.5rem] border border-amber-100 dark:border-amber-900/20 flex gap-6 shadow-sm">
                                        <div className="p-4 bg-amber-500 text-white rounded-2xl shadow-lg shadow-amber-500/20 shrink-0">
                                            <Info size={28} />
                                        </div>
                                        <div>
                                            <span className="text-[11px] font-black text-amber-600 dark:text-amber-500 uppercase tracking-[0.2em]">Ghi chú cho đợt kiểm kê này:</span>
                                            <p className="text-base font-bold text-amber-900 dark:text-amber-100 mt-2 leading-relaxed italic">"{selectedAudit.note}"</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="p-10 bg-transparent dark:bg-slate-950 flex gap-6">
                                <button
                                    onClick={() => setSelectedAudit(null)}
                                    className="flex-1 py-5 bg-transparent text-slate-500 dark:text-slate-300 rounded-3xl font-black uppercase tracking-widest text-xs border border-slate-200 dark:border-slate-700 shadow-sm hover:bg-transparent transition-all"
                                >
                                    ĐÓNG CHI TIẾT
                                </button>
                                <button
                                    onClick={() => {
                                        const itemsToImport = selectedAudit.details.map(d => ({
                                            product_id: d.product_id,
                                            name: d.product_name,
                                            code: d.product_code,
                                            unit: d.unit,
                                            secondary_unit: d.secondary_unit,
                                            multiplier: d.multiplier,
                                            system_stock: d.system_stock,
                                            actual_stock: d.actual_stock
                                        }));
                                        setAuditItems(itemsToImport);
                                        setMode('audit');
                                        setSelectedAudit(null);
                                        showToast('Đã khôi phục danh sách mặt hàng để kiểm lại!');
                                    }}
                                    className="flex-1 py-5 bg-primary text-white rounded-3xl font-black uppercase tracking-widest text-xs shadow-2xl shadow-primary/30 flex items-center justify-center gap-3 hover:brightness-110 active:scale-95 transition-all"
                                >
                                    <ArrowLeftRight size={20} />
                                    KIỂM LẠI DANH SÁCH NÀY
                                </button>
                            </div>
                        </m.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Notifications */}
            <AnimatePresence>
                {toast && (
                    <m.div
                        initial={{ opacity: 0, y: -40, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -40, scale: 0.9 }}
                        className={cn(
                            "fixed top-12 left-1/2 -translate-x-1/2 z-[10000] px-10 py-5 rounded-[2rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)] flex items-center gap-4 min-w-[400px] backdrop-blur-2xl border border-white/20",
                            toast.type === 'error' ? "bg-rose-500 text-white" :
                                toast.type === 'info' ? "bg-amber-500 text-white" : "bg-emerald-600 text-white"
                        )}
                    >
                        <div className="p-2 bg-white/20 rounded-xl">
                            {toast.type === 'error' ? <AlertTriangle size={24} /> :
                                toast.type === 'info' ? <Info size={24} /> : <CheckCircle2 size={24} />}
                        </div>
                        <span className="font-black uppercase text-xs tracking-[0.1em]">{toast.message}</span>
                    </m.div>
                )}
            </AnimatePresence>
            <ProductEditModal
                isOpen={isProductModalOpen}
                product={editingProduct}
                onClose={() => {
                    setIsProductModalOpen(false);
                    setEditingProduct(null);
                }}
                onSave={() => {
                    fetchAllProducts();
                    setToast({ message: editingProduct ? "Đã cập nhật sản phẩm thành công!" : "Đã thêm sản phẩm mới thành công!", type: 'success' });
                    setSearchTerm('');
                    setIsProductModalOpen(false);
                }}
            />

            <AnimatePresence>
                {toast && (
                    <Toast
                        message={toast.message}
                        type={toast.type}
                        onClose={() => setToast(null)}
                    />
                )}
            </AnimatePresence>
            </div>
        </div>
    );
}
