import React, { useState, useEffect, useRef, useMemo } from 'react';
import axios from 'axios';
import { m, AnimatePresence } from 'framer-motion';
import { Search, Plus, Minus, X, Menu, ChevronRight, ClipboardList, Trash2, ArrowLeft, Save, AlertCircle, History, WifiOff, Filter, Calendar } from 'lucide-react';
import { formatNumber } from '../../lib/utils';
import { cn } from '../../lib/utils';
import { useNavigate } from 'react-router-dom';
import MobileMenu from '../../components/MobileMenu';
import ConfirmModal from '../../components/ConfirmModal';
import ProductEditModal from '../../components/ProductEditModal';
import Toast from '../../components/Toast';

export default function MobileInventory() {
    const triggerHaptic = (style = 'medium') => {
        if (window.navigator?.vibrate) {
            if (style === 'light') window.navigator.vibrate(10);
            else if (style === 'medium') window.navigator.vibrate(20);
            else if (style === 'heavy') window.navigator.vibrate([30, 50, 30]);
            else if (style === 'success') window.navigator.vibrate([10, 30, 10]);
        }
    };

    const navigate = useNavigate();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [toast, setToast] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [activeIndex, setActiveIndex] = useState(0);

    // Mode: 'audit' (Create new) or 'history' (View old)
    const [mode, setMode] = useState('audit');
    const [historyItems, setHistoryItems] = useState([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);
    const [selectedAudit, setSelectedAudit] = useState(null);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [filterStartDate, setFilterStartDate] = useState('');
    const [filterEndDate, setFilterEndDate] = useState('');
    const [filterSearch, setFilterSearch] = useState('');

    // Counting list: [{ product_id, name, code, unit, system_stock, actual_stock }]
    const [auditItems, setAuditItems] = useState(() => {
        const saved = localStorage.getItem('mobile_inventory_audit');
        return saved ? JSON.parse(saved) : [];
    });

    const [allProducts, setAllProducts] = useState([]);
    const [auditFilter, setAuditFilter] = useState('audited'); // 'audited' or 'remaining'
    const [auditedTodayIds, setAuditedTodayIds] = useState(new Set());
    const [audited7DaysIds, setAudited7DaysIds] = useState(new Set());
    const [recentFilter, setRecentFilter] = useState('all'); // 'all', 'audited', 'pending'
    const [displayLimit, setDisplayLimit] = useState(50);
    const [isProductModalOpen, setIsProductModalOpen] = useState(false);

    const remainingProducts = useMemo(() => {
        return allProducts.filter(p => !auditItems.find(ai => ai.product_id === p.id));
    }, [allProducts, auditItems]);

    const recentStats = useMemo(() => {
        const audited = remainingProducts.filter(p => audited7DaysIds.has(p.id)).length;
        const pending = remainingProducts.length - audited;
        return { audited, pending };
    }, [remainingProducts, audited7DaysIds]);

    const fetchAll = async () => {
        try {
            const res = await axios.get('/api/products?limit=5000');
            setAllProducts(res.data.items || res.data);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        const fetchRecent = async () => {
            const today = new Date();
            const start = new Date();
            start.setDate(today.getDate() - 7);
            const startStr = start.toISOString().split('T')[0];
            const endStr = today.toISOString().split('T')[0];
            const todayStr = today.toISOString().split('T')[0];

            try {
                const res = await axios.get(`/api/inventory/audits?start_date=${startStr}&end_date=${endStr}&limit=500`);
                const ids7d = new Set();
                const idsToday = new Set();
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
                console.error(err);
            }
        };
        fetchAll();
        fetchRecent();
    }, []);

    const [note, setNote] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [isOffline, setIsOffline] = useState(!window.navigator.onLine);
    const searchInputRef = useRef(null);
    const firstInputRef = useRef(null);
    const activeItemRef = useRef(null);

    const { totalThung, totalLe } = useMemo(() => {
        return auditItems.reduce((acc, item) => {
            const m = item.multiplier || 1;
            if (m > 1) {
                acc.totalThung += Math.trunc(item.actual_stock / m);
                acc.totalLe += item.actual_stock % m;
            } else {
                acc.totalLe += item.actual_stock;
            }
            return acc;
        }, { totalThung: 0, totalLe: 0 });
    }, [auditItems]);

    useEffect(() => {
        const handleOnline = () => setIsOffline(false);
        const handleOffline = () => setIsOffline(true);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    useEffect(() => {
        localStorage.setItem('mobile_inventory_audit', JSON.stringify(auditItems));
    }, [auditItems]);

    // Fetch history when mode is 'history' OR filters change
    useEffect(() => {
        if (mode === 'history') {
            fetchHistory();
        }
    }, [mode, filterStartDate, filterEndDate, filterSearch]);

    const fetchHistory = async () => {
        setIsLoadingHistory(true);
        try {
            let url = `/api/inventory/audits?limit=50`;
            if (filterStartDate) url += `&start_date=${filterStartDate}`;
            if (filterEndDate) url += `&end_date=${filterEndDate}`;
            if (filterSearch) url += `&search=${filterSearch}`;
            const res = await axios.get(url);
            setHistoryItems(res.data.items);
        } catch (err) {
            console.error(err);
            setToast({ message: 'Lỗi khi tải lịch sử', type: 'error' });
        } finally {
            setIsLoadingHistory(false);
        }
    };

    const clearFilters = () => {
        setFilterStartDate('');
        setFilterEndDate('');
        setFilterSearch('');
        setIsFilterOpen(false);
    };

    // Search logic with debounce
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
        if (isOffline) {
            setSearchResults([]);
            return;
        }
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
        triggerHaptic('light');
        const existingIdx = auditItems.findIndex(i => i.product_id === product.id);
        if (existingIdx > -1) {
            setToast({ message: `${product.name} đã có trong danh sách`, type: 'info' });
        } else {
            const newItem = {
                product_id: product.id,
                name: product.name,
                code: product.code,
                unit: product.unit,
                secondary_unit: product.secondary_unit,
                multiplier: product.multiplier || 1,
                system_stock: product.stock,
                actual_stock: product.stock // Default to system stock
            };
            setAuditItems(prev => [newItem, ...prev]);
            setToast({ message: `Đã thêm ${product.name}`, type: 'success' });
            setSearchTerm('');
            setSearchResults([]);
            setActiveIndex(0);
            
            // Wait for render then focus
            setTimeout(() => {
                firstInputRef.current?.focus();
                firstInputRef.current?.select();
            }, 100);
        }
        setTimeout(() => setToast(null), 1500);
    };

    const updateActualStock = (idx, value) => {
        const newItems = [...auditItems];
        newItems[idx].actual_stock = parseFloat(value) || 0;
        setAuditItems(newItems);
    };

    const adjustStock = (idx, delta) => {
        triggerHaptic('light');
        const newItems = [...auditItems];
        if (newItems[idx].multiplier > 1) {
            // Priority adjust by secondary unit (secondary_unit)
            newItems[idx].actual_stock = Math.max(0, (newItems[idx].actual_stock || 0) + (delta * newItems[idx].multiplier));
        } else {
            newItems[idx].actual_stock = Math.max(0, (newItems[idx].actual_stock || 0) + delta);
        }
        setAuditItems(newItems);
    };

    const handleSubmitAudit = async () => {
        if (auditItems.length === 0) return;
        if (isOffline) {
            setToast({ message: 'Không thể lưu khi đang ngoại tuyến!', type: 'error' });
            setTimeout(() => setToast(null), 3000);
            return;
        }

        setIsSubmitting(true);
        triggerHaptic('heavy');

        try {
            const payload = {
                note: note || 'Kiểm kê kho Mobile',
                status: 'Completed',
                items: auditItems.map(i => ({
                    product_id: i.product_id,
                    actual_stock: i.actual_stock,
                    system_stock: i.system_stock
                }))
            };

            await axios.post('/api/inventory/audit', payload);

            setAuditItems([]);
            setNote('');
            localStorage.removeItem('mobile_inventory_audit');

            setToast({ message: 'Đã cập nhật kho thành công!', type: 'success' });
            triggerHaptic('success');
            setTimeout(() => {
                setToast(null);
                setMode('history'); // Switch to history to see the new record
            }, 1000);
        } catch (err) {
            setToast({ message: 'Lỗi khi lưu phiếu kiểm kê', type: 'error' });
            setTimeout(() => setToast(null), 3000);
        } finally {
            setIsSubmitting(false);
        }
    };
    return (
        <div className="p-3 space-y-3 no-print font-sans pb-28">
            <MobileMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />

            {/* Offline Info */}
            <AnimatePresence>
                {isOffline && (
                    <m.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="bg-amber-500 text-white text-xs font-bold py-2 px-3 rounded-xl flex items-center justify-center gap-2"
                    >
                        <WifiOff size={14} />
                        <span>Đang ngoại tuyến - Dữ liệu sẽ lưu tạm tại máy</span>
                    </m.div>
                )}
            </AnimatePresence>

            {/* Controls & Search Card */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-sm p-3 space-y-3">
                {/* Mode Switcher */}
                <div className="flex bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl gap-1">
                    <button
                        onClick={() => { triggerHaptic('light'); setMode('audit'); setSelectedAudit(null); }}
                        className={cn(
                            "flex-1 py-2 text-center text-xs font-bold rounded-lg transition-all android-touchable",
                            mode === 'audit' ? "bg-white dark:bg-slate-900 text-primary dark:text-emerald-400 shadow-xs" : "text-slate-600 dark:text-slate-400"
                        )}
                    >
                        Kiểm mới
                    </button>
                    <button
                        onClick={() => { triggerHaptic('light'); setMode('history'); setSelectedAudit(null); }}
                        className={cn(
                            "flex-1 py-2 text-center text-xs font-bold rounded-lg transition-all android-touchable",
                            mode === 'history' ? "bg-white dark:bg-slate-900 text-primary dark:text-emerald-400 shadow-xs" : "text-slate-600 dark:text-slate-400"
                        )}
                    >
                        Lịch sử
                    </button>
                    {mode === 'audit' && (
                        <button
                            onClick={() => { triggerHaptic('light'); setIsProductModalOpen(true); }}
                            className="p-2 bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 rounded-lg hover:bg-emerald-100 android-touchable font-bold text-xs flex items-center gap-1 shrink-0"
                        >
                            <Plus size={16} />
                            <span>Tạo SP</span>
                        </button>
                    )}
                </div>

                {/* Audit Tabs */}
                {mode === 'audit' && (
                    <div className="flex bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl gap-1">
                        <button
                            onClick={() => { triggerHaptic('light'); setAuditFilter('audited'); }}
                            className={cn(
                                "flex-1 py-1.5 text-center text-xs font-bold rounded-lg transition-all android-touchable",
                                auditFilter === 'audited' ? "bg-white dark:bg-slate-900 text-primary dark:text-emerald-400 shadow-xs" : "text-slate-600 dark:text-slate-400"
                            )}
                        >
                            Đã kiểm ({auditItems.length})
                        </button>
                        <button
                            onClick={() => { triggerHaptic('light'); setAuditFilter('remaining'); }}
                            className={cn(
                                "flex-1 py-1.5 text-center text-xs font-bold rounded-lg transition-all android-touchable",
                                auditFilter === 'remaining' ? "bg-white dark:bg-slate-900 text-primary dark:text-emerald-400 shadow-xs" : "text-slate-600 dark:text-slate-400"
                            )}
                        >
                            Chưa kiểm ({allProducts.length - auditItems.length})
                        </button>
                    </div>
                )}

                {/* Recent Filters */}
                {mode === 'audit' && auditFilter === 'remaining' && (
                    <div className="flex gap-1.5 overflow-x-auto no-scrollbar pt-1">
                        <button
                            onClick={() => setRecentFilter('all')}
                            className={cn(
                                "whitespace-nowrap px-3 py-1 rounded-lg text-xs font-bold transition-all border android-touchable",
                                recentFilter === 'all' ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 border-slate-900" : "bg-slate-100 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400"
                            )}
                        >
                            Tất cả
                        </button>
                        <button
                            onClick={() => setRecentFilter('audited')}
                            className={cn(
                                "whitespace-nowrap px-3 py-1 rounded-lg text-xs font-bold transition-all border android-touchable",
                                recentFilter === 'audited' ? "bg-amber-500 text-white border-amber-500" : "bg-slate-100 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400"
                            )}
                        >
                            Đã kiểm (7N) [{recentStats.audited}]
                        </button>
                        <button
                            onClick={() => setRecentFilter('pending')}
                            className={cn(
                                "whitespace-nowrap px-3 py-1 rounded-lg text-xs font-bold transition-all border android-touchable",
                                recentFilter === 'pending' ? "bg-rose-500 text-white border-rose-500" : "bg-slate-100 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400"
                            )}
                        >
                            Chưa kiểm (7N) [{recentStats.pending}]
                        </button>
                    </div>
                )}

                {/* Search Bar Input */}
                {mode === 'audit' && (
                    <div className="relative flex items-center">
                        <Search className="absolute left-3.5 text-slate-400" size={20} />
                        <input
                            ref={searchInputRef}
                            className="w-full bg-slate-100 dark:bg-slate-800/80 rounded-xl py-2.5 pl-11 pr-10 outline-none font-semibold text-sm text-slate-900 dark:text-white placeholder:text-slate-400 transition-all"
                            placeholder="Tên hoặc quét mã sản phẩm..."
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
                        {searchTerm && (
                            <button className="absolute right-3 text-slate-400 p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700" onClick={() => setSearchTerm('')}>
                                <X size={18} />
                            </button>
                        )}
                    </div>
                )}
            </div>
            {mode === 'audit' && (
                <>
                    {/* Search Results Dropdown */}
                    <AnimatePresence>
                        {searchTerm.length >= 2 && (
                            <m.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="absolute top-[280px] left-3 right-3 bg-transparent rounded-2xl shadow-2xl border border-gray-100 dark:border-slate-800 z-50 max-h-[50vh] overflow-y-auto"
                            >
                                {isOffline ? (
                                    <div className="p-8 text-center text-gray-400 text-sm font-bold flex flex-col items-center gap-2">
                                        <WifiOff size={24} className="opacity-30" />
                                        <span>Tính năng tìm kiếm cần kết nối mạng</span>
                                    </div>
                                ) : isSearching ? (
                                    <div className="p-8 text-center text-gray-400 text-sm font-bold animate-pulse">Đang tìm kiếm...</div>
                                ) : searchResults.length === 0 ? (
                                    <div className="p-8 text-center text-gray-400 text-sm font-bold">Không tìm thấy sản phẩm</div>
                                ) : (
                                    <div className="p-2 space-y-1">
                                        {searchResults.map((p, index) => {
                                            const isAdded = auditItems.find(ai => ai.product_id === p.id);
                                            const isAuditedToday = auditedTodayIds.has(p.id);
                                            return (
                                                <button
                                                    key={p.id}
                                                    ref={activeIndex === index ? activeItemRef : null}
                                                    onClick={() => !isAdded && addToAudit(p)}
                                                    className={cn(
                                                        "w-full flex items-center justify-between p-3 rounded-xl transition-all text-left",
                                                        isAdded ? "opacity-50" : (activeIndex === index ? "bg-primary/10" : "hover:bg-transparent dark:hover:bg-white/5 active:bg-primary/5 active:scale-[0.98]")
                                                    )}
                                                >
                                                    <div className="flex-1 min-w-0 pr-4">
                                                        <div className="font-bold text-sm text-gray-800 dark:text-gray-100 uppercase truncate flex flex-wrap gap-1 items-center">
                                                            {p.name}
                                                            {isAdded && <span className="text-[7px] bg-emerald-500 text-white px-1 py-0.5 rounded-full whitespace-nowrap">Đang kiểm</span>}
                                                            {isAuditedToday && !isAdded && <span className="text-[7px] bg-amber-500 text-white px-1 py-0.5 rounded-full whitespace-nowrap font-black uppercase">Đã kiểm hôm nay</span>}
                                                        </div>
                                                        <div className="text-[10px] text-gray-400 mt-0.5 whitespace-nowrap overflow-hidden text-ellipsis font-bold">
                                                            Mã: {p.code || '---'} | Tồn: {p.stock} {p.unit}
                                                            {p.multiplier > 1 && ` (${Math.trunc(p.stock / p.multiplier)} ${p.secondary_unit} ${p.stock % p.multiplier > 0 ? (p.stock % p.multiplier) + ' ' + p.unit : ''})`}
                                                        </div>
                                                    </div>
                                                    {!isAdded && <Plus className="text-primary" size={20} />}
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </m.div>
                        )}
                    </AnimatePresence>

                    {/* Main Content Area */}
                    <div className="space-y-3">
                        {auditFilter === 'remaining' ? (
                            <>
                                {allProducts
                                    .filter(p => !auditItems.find(ai => ai.product_id === p.id))
                                    .filter(p => !searchTerm || p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.code?.toLowerCase().includes(searchTerm.toLowerCase()))
                                    .filter(p => {
                                        const isRecent = audited7DaysIds.has(p.id);
                                        if (recentFilter === 'audited') return isRecent;
                                        if (recentFilter === 'pending') return !isRecent;
                                        return true;
                                    })
                                    .slice(0, displayLimit)
                                    .map(product => {
                                        const isAuditedToday = auditedTodayIds.has(product.id);
                                        const isAudited7d = audited7DaysIds.has(product.id);
                                        return (
                                            <m.div
                                                key={product.id}
                                                initial={{ opacity: 0, y: 8 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className="bg-white dark:bg-slate-900 rounded-2xl p-3.5 border border-slate-200/90 dark:border-slate-800 shadow-sm flex items-center justify-between gap-3"
                                            >
                                                <div className="flex-1 min-w-0">
                                                    <div className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate flex items-center gap-1.5 flex-wrap">
                                                        <span>{product.name}</span>
                                                        {isAuditedToday ? (
                                                            <span className="text-[10px] bg-emerald-500 text-white px-1.5 py-0.5 rounded-md font-bold">HÔM NAY</span>
                                                        ) : isAudited7d ? (
                                                            <span className="text-[10px] bg-amber-500 text-white px-1.5 py-0.5 rounded-md font-bold">7 NGÀY QUA</span>
                                                        ) : (
                                                            <span className="text-[10px] bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 px-1.5 py-0.5 rounded-md font-bold">CHƯA KIỂM</span>
                                                        )}
                                                    </div>
                                                    <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">
                                                        Tồn máy: <span className="text-primary dark:text-emerald-400 font-bold">{product.stock} {product.unit}</span>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => addToAudit(product)}
                                                    className="px-3.5 py-2 bg-primary dark:bg-emerald-600 text-white rounded-xl font-bold text-xs shadow-xs active:scale-95 transition-all shrink-0 android-touchable"
                                                >
                                                    + Kiểm
                                                </button>
                                            </m.div>
                                        );
                                    })
                                }
                                {allProducts.filter(p => !auditItems.find(ai => ai.product_id === p.id)).length > displayLimit && (
                                    <button
                                        onClick={() => setDisplayLimit(prev => prev + 100)}
                                        className="w-full py-3 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-500 dark:text-slate-400 mb-4"
                                    >
                                        Xem thêm {allProducts.filter(p => !auditItems.find(ai => ai.product_id === p.id)).length - displayLimit} sản phẩm...
                                    </button>
                                )}
                            </>
                        ) : auditItems.length === 0 ? (
                            <div className="bg-white dark:bg-slate-900 rounded-2xl p-10 border border-slate-200/90 dark:border-slate-800 shadow-sm flex flex-col items-center justify-center text-center">
                                <div className="w-14 h-14 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-400 mb-3">
                                    <ClipboardList size={28} />
                                </div>
                                <p className="font-bold text-sm text-slate-900 dark:text-slate-100">Chưa có sản phẩm nào cần kiểm</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Nhập tên hoặc quét mã sản phẩm ở trên để bắt đầu</p>
                            </div>
                        ) : (
                            auditItems.map((item, idx) => {
                                const diff = item.actual_stock - item.system_stock;
                                return (
                                    <m.div
                                        key={item.product_id}
                                        layout
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-3"
                                    >
                                        <div className="flex justify-between items-start">
                                            <div className="flex-1 min-w-0 pr-3">
                                                <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 leading-snug">
                                                    {item.name}
                                                </h3>
                                                <div className="flex flex-wrap items-center gap-2 mt-1">
                                                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                                                        Tồn máy: <strong className="text-slate-800 dark:text-slate-200">{item.system_stock} {item.unit}</strong>
                                                    </span>
                                                    {item.multiplier > 1 && (
                                                        <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[11px] font-bold px-2 py-0.5 rounded-md">
                                                            1 {item.secondary_unit} = {item.multiplier} {item.unit}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => setItemToDelete(idx)}
                                                className="p-2 rounded-xl bg-rose-50 text-rose-500 dark:bg-rose-950/40 dark:text-rose-400 hover:bg-rose-100 active:scale-95 transition-all"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <div className="flex-1">
                                                {item.multiplier > 1 ? (
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <div className="flex flex-col items-center bg-slate-50 dark:bg-slate-800/80 rounded-xl p-2 border border-slate-200 dark:border-slate-700">
                                                            <input
                                                                type="number"
                                                                inputMode="decimal"
                                                                className="w-full text-center bg-transparent border-none outline-none font-extrabold text-lg text-slate-900 dark:text-white"
                                                                value={Math.trunc(item.actual_stock / item.multiplier) || ''}
                                                                ref={idx === 0 ? firstInputRef : null}
                                                                onChange={e => {
                                                                    const secVal = parseInt(e.target.value) || 0;
                                                                    const priVal = item.actual_stock % item.multiplier;
                                                                    updateActualStock(idx, secVal * item.multiplier + priVal);
                                                                }}
                                                                onFocus={e => e.target.select()}
                                                            />
                                                            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">{item.secondary_unit}</span>
                                                        </div>
                                                        <div className="flex flex-col items-center bg-slate-50 dark:bg-slate-800/80 rounded-xl p-2 border border-slate-200 dark:border-slate-700">
                                                            <input
                                                                type="number"
                                                                inputMode="decimal"
                                                                className="w-full text-center bg-transparent border-none outline-none font-extrabold text-lg text-slate-900 dark:text-white"
                                                                value={item.actual_stock % item.multiplier || ''}
                                                                onChange={e => {
                                                                    const priVal = parseFloat(e.target.value) || 0;
                                                                    const secVal = Math.trunc(item.actual_stock / item.multiplier);
                                                                    updateActualStock(idx, secVal * item.multiplier + priVal);
                                                                }}
                                                                onFocus={e => e.target.select()}
                                                            />
                                                            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">{item.unit} lẻ</span>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center bg-slate-50 dark:bg-slate-800/80 rounded-xl p-1.5 border border-slate-200 dark:border-slate-700">
                                                        <button
                                                            onClick={() => adjustStock(idx, -1)}
                                                            className="w-10 h-10 flex items-center justify-center bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg shadow-xs active:scale-95 transition-all font-bold"
                                                        >
                                                            <Minus size={18} strokeWidth={2.5} />
                                                        </button>
                                                        <div className="flex-1 flex flex-col items-center">
                                                            <input
                                                                type="number"
                                                                inputMode="decimal"
                                                                className="w-full text-center bg-transparent border-none outline-none font-extrabold text-xl text-slate-900 dark:text-white"
                                                                value={item.actual_stock || ''}
                                                                ref={idx === 0 && item.multiplier <= 1 ? firstInputRef : null}
                                                                onChange={e => updateActualStock(idx, e.target.value)}
                                                                onFocus={e => e.target.select()}
                                                            />
                                                            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">Thực tế ({item.unit})</span>
                                                        </div>
                                                        <button
                                                            onClick={() => adjustStock(idx, 1)}
                                                            className="w-10 h-10 flex items-center justify-center bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg shadow-xs active:scale-95 transition-all font-bold"
                                                        >
                                                            <Plus size={18} strokeWidth={2.5} />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>

                                            <div className={cn(
                                                "w-24 p-2.5 rounded-xl border flex flex-col items-center justify-center transition-all shrink-0",
                                                diff === 0
                                                    ? "bg-slate-50 border-slate-200 text-slate-500 dark:bg-slate-800/50 dark:border-slate-700 dark:text-slate-400"
                                                    : diff > 0
                                                        ? "bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-400"
                                                        : "bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-400"
                                            )}>
                                                <span className="text-[10px] font-bold uppercase tracking-wider mb-0.5">Chênh lệch</span>
                                                <span className="font-extrabold text-base tabular-nums">
                                                    {diff > 0 ? '+' : ''}{diff}
                                                </span>
                                            </div>
                                        </div>
                                    </m.div>
                                );
                            })
                        )}
                    </div>
                </>
            )}

            {mode === 'history' && (
                <div className="flex-1 flex flex-col overflow-hidden">
                    <div className="px-4 py-2 bg-transparent border-b border-gray-100 dark:border-slate-800 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                {historyItems.length} kết quả
                            </span>
                            {(filterStartDate || filterEndDate || filterSearch) && (
                                <button
                                    onClick={clearFilters}
                                    className="text-[8px] font-black bg-red-50 text-red-500 px-2 py-0.5 rounded-md uppercase"
                                >
                                    Xóa lọc
                                </button>
                            )}
                        </div>
                        <button
                            onClick={() => setIsFilterOpen(true)}
                            className={cn(
                                "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all",
                                (filterStartDate || filterEndDate || filterSearch)
                                    ? "bg-primary text-white border-primary"
                                    : "bg-transparent text-gray-500 border-gray-100 dark:border-slate-700"
                            )}
                        >
                            <Filter size={12} />
                            Bộ lọc
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
                        {isLoadingHistory ? (
                            <div className="py-20 flex flex-col items-center justify-center gap-4">
                                <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Đang tải lịch sử...</span>
                            </div>
                        ) : historyItems.length === 0 ? (
                            <div className="py-20 flex flex-col items-center justify-center text-gray-400">
                                <AlertCircle size={40} className="mb-4 opacity-20" />
                                <p className="font-black text-sm uppercase tracking-widest">Chưa có phiếu kiểm nào</p>
                            </div>
                        ) : (
                            historyItems.map((audit) => (
                                <m.div
                                    key={audit.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    onClick={() => { setSelectedAudit(audit); triggerHaptic('light'); }}
                                    className="bg-transparent p-4 rounded-3xl shadow-sm border border-gray-100 dark:border-white/5 active:scale-[0.98] transition-all"
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                                                <ClipboardList size={16} />
                                            </div>
                                            <div>
                                                <div className="text-[10px] font-black text-primary uppercase tracking-widest">PHIẾU #{audit.id}</div>
                                                <div className="text-[9px] font-bold text-gray-400 uppercase">{new Date(audit.date).toLocaleDateString('vi-VN')} {new Date(audit.date).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</div>
                                            </div>
                                        </div>
                                        <div className="text-[10px] font-black px-2 py-0.5 rounded-md bg-green-50 text-green-500 dark:bg-green-500/10">HOÀN TẤT</div>
                                    </div>
                                    <div className="text-xs font-bold text-gray-700 dark:text-gray-200 mt-2 truncate">
                                        {audit.note || 'Không có ghi chú'}
                                    </div>
                                    <div className="mt-3 flex items-center justify-between border-t border-gray-50 dark:border-white/5 pt-3">
                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">{audit.details.length} mặt hàng</span>
                                        <ChevronRight size={16} className="text-gray-300" />
                                    </div>
                                </m.div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {/* Float Actions for Audit Mode */}
            {mode === 'audit' && (
                <AnimatePresence>
                    {auditItems.length > 0 && (
                        <m.div
                            initial={{ y: 80, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 80, opacity: 0 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                            className="fixed bottom-4 left-3 right-3 max-w-md mx-auto z-40 bg-slate-900 text-white dark:bg-emerald-600 rounded-2xl shadow-xl p-4 border border-slate-800 dark:border-emerald-500/50 flex flex-col gap-3"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-bold text-slate-300 dark:text-emerald-100">Tổng kiểm thực tế</span>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <span className="text-base font-extrabold text-white">{formatNumber(totalThung)} <small className="font-normal text-xs">thùng</small></span>
                                        <span className="text-slate-400">|</span>
                                        <span className="text-base font-extrabold text-amber-300">{formatNumber(totalLe)} <small className="font-normal text-xs">lẻ</small></span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className="text-[10px] font-bold text-slate-300 dark:text-emerald-100">Mặt hàng</span>
                                    <div className="text-base font-extrabold text-white">{auditItems.length} SP</div>
                                </div>
                            </div>

                            <input
                                value={note}
                                onChange={e => setNote(e.target.value)}
                                className="w-full bg-slate-800/80 dark:bg-emerald-700/60 text-white placeholder:text-slate-400 dark:placeholder:text-emerald-200 rounded-xl py-2 px-3 outline-none font-semibold text-xs border border-slate-700 dark:border-emerald-500/40"
                                placeholder="Ghi chú đợt kiểm kê này..."
                            />

                            <button
                                disabled={isSubmitting}
                                onClick={handleSubmitAudit}
                                className={cn(
                                    "w-full py-3 rounded-xl font-bold text-xs uppercase tracking-wider shadow-md transition-all flex items-center justify-center gap-2 active:scale-95 android-touchable",
                                    isSubmitting ? "bg-slate-700 text-slate-400" : "bg-primary dark:bg-white text-white dark:text-slate-950"
                                )}
                            >
                                <Save size={18} />
                                <span>{isSubmitting ? "Đang xử lý..." : "Xác nhận lưu kiểm kho"}</span>
                            </button>
                        </m.div>
                    )}
                </AnimatePresence>
            )}

            {/* Audit Details Sheet Drawer */}
            <AnimatePresence>
                {selectedAudit && (
                    <div className="fixed inset-0 z-[100] flex flex-col justify-end bg-slate-950/70 backdrop-blur-sm android-webview">
                        <div className="flex-1" onClick={() => setSelectedAudit(null)} />
                        <m.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                            className="bg-white dark:bg-slate-900 rounded-t-[28px] max-h-[85dvh] flex flex-col overflow-hidden border-t border-slate-200 dark:border-slate-800 shadow-2xl safe-area-pb"
                        >
                            {/* Drag handle */}
                            <div className="pt-3 pb-1 flex justify-center" onClick={() => setSelectedAudit(null)}>
                                <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full" />
                            </div>

                            {/* Sheet Header */}
                            <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                                <div>
                                    <h2 className="font-extrabold text-base text-slate-900 dark:text-slate-100">Chi tiết phiếu #{selectedAudit.id}</h2>
                                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">{new Date(selectedAudit.date).toLocaleString('vi-VN')}</p>
                                </div>
                                <button onClick={() => setSelectedAudit(null)} className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800">
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Sheet Content */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                                {selectedAudit.details.map((detail, idx) => (
                                    <div key={idx} className="p-3.5 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 space-y-2">
                                        <div className="font-bold text-xs text-slate-900 dark:text-slate-100 uppercase">{detail.product_name}</div>
                                        <div className="grid grid-cols-3 gap-2">
                                            <div className="flex flex-col items-center p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase mb-0.5">Hệ thống</span>
                                                <span className="font-extrabold text-xs text-slate-800 dark:text-slate-200">{detail.system_stock}</span>
                                            </div>
                                            <div className="flex flex-col items-center p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase mb-0.5">Thực tế</span>
                                                <span className="font-extrabold text-xs text-primary dark:text-emerald-400">
                                                    {detail.actual_stock}
                                                    {detail.multiplier > 1 && (
                                                        <span className="block text-[9px] font-normal text-slate-500">
                                                            ({Math.trunc(detail.actual_stock / detail.multiplier)} {detail.secondary_unit})
                                                        </span>
                                                    )}
                                                </span>
                                            </div>
                                            <div className={cn(
                                                "flex flex-col items-center p-2 rounded-xl border",
                                                detail.discrepancy === 0 
                                                    ? "bg-white dark:bg-slate-900 border-slate-200/60 dark:border-slate-700/60 text-slate-500" 
                                                    : detail.discrepancy > 0 
                                                        ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400" 
                                                        : "bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400"
                                            )}>
                                                <span className="text-[10px] font-bold uppercase mb-0.5">Hao hụt</span>
                                                <span className="font-extrabold text-xs">{detail.discrepancy > 0 ? '+' : ''}{detail.discrepancy}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {selectedAudit.note && (
                                    <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 rounded-2xl border border-amber-200 dark:border-amber-800">
                                        <div className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase mb-1">Ghi chú</div>
                                        <div className="text-xs font-semibold text-amber-900 dark:text-amber-200 leading-relaxed">{selectedAudit.note}</div>
                                    </div>
                                )}
                            </div>
                        </m.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Filter Modal */}
            <AnimatePresence>
                {isFilterOpen && (
                    <div className="fixed inset-0 z-[100] flex flex-col justify-end bg-slate-950/70 backdrop-blur-sm android-webview">
                        <div className="flex-1" onClick={() => setIsFilterOpen(false)} />
                        <m.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                            className="bg-white dark:bg-slate-900 rounded-t-[28px] p-5 border-t border-slate-200 dark:border-slate-800 shadow-2xl safe-area-pb"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="font-extrabold text-base text-slate-900 dark:text-slate-100">BỘ LỌC LỊCH SỬ</h2>
                                <button onClick={() => setIsFilterOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 block">Tìm trong ghi chú</label>
                                    <div className="relative">
                                        <Search className="absolute left-3.5 top-3 text-slate-400" size={16} />
                                        <input
                                            value={filterSearch}
                                            onChange={e => setFilterSearch(e.target.value)}
                                            placeholder="Nhập nội dung ghi chú..."
                                            className="w-full bg-slate-100 dark:bg-slate-800 py-2.5 pl-10 pr-4 rounded-xl outline-none text-xs font-semibold text-slate-900 dark:text-white"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-2.5">
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 block">Từ ngày</label>
                                        <input
                                            type="date"
                                            value={filterStartDate}
                                            onChange={e => setFilterStartDate(e.target.value)}
                                            className="w-full bg-slate-100 dark:bg-slate-800 py-2.5 px-3 rounded-xl outline-none text-xs font-semibold text-slate-900 dark:text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 block">Đến ngày</label>
                                        <input
                                            type="date"
                                            value={filterEndDate}
                                            onChange={e => setFilterEndDate(e.target.value)}
                                            className="w-full bg-slate-100 dark:bg-slate-800 py-2.5 px-3 rounded-xl outline-none text-xs font-semibold text-slate-900 dark:text-white"
                                        />
                                    </div>
                                </div>

                                <div className="pt-2 flex gap-2.5">
                                    <button
                                        onClick={clearFilters}
                                        className="flex-1 py-2.5 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl font-bold text-xs"
                                    >
                                        Xóa lọc
                                    </button>
                                    <button
                                        onClick={() => setIsFilterOpen(false)}
                                        className="flex-1 py-2.5 bg-primary dark:bg-emerald-600 text-white rounded-xl font-bold text-xs shadow-md"
                                    >
                                        Áp dụng
                                    </button>
                                </div>
                            </div>
                        </m.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Menu & Toast */}
            <MobileMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />

            <AnimatePresence>
                {toast && (
                    <m.div
                        initial={{ opacity: 0, scale: 0.8, y: -20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8, y: -20 }}
                        className={cn(
                            "fixed top-24 left-1/2 -translate-x-1/2 px-6 py-2.5 rounded-full shadow-2xl z-[80] font-bold text-xs flex items-center gap-2",
                            toast.type === 'success' ? "bg-transparent text-primary border border-primary/20" :
                                toast.type === 'info' ? "bg-transparent text-amber-600 border border-amber-500/20" : "bg-red-500 text-white"
                        )}
                    >
                        <div className={cn("w-2 h-2 rounded-full", toast.type === 'success' ? "bg-primary" : toast.type === 'info' ? "bg-amber-500" : "bg-white")}></div>
                        <span>{toast.message}</span>
                    </m.div>
                )}
            </AnimatePresence>

            <ConfirmModal
                isOpen={itemToDelete !== null}
                title="Xóa khỏi danh sách?"
                message={`Bạn có chắc muốn xóa "${auditItems[itemToDelete]?.name}" khỏi danh sách kiểm không?`}
                type="danger"
                onConfirm={() => {
                    setAuditItems(auditItems.filter((_, i) => i !== itemToDelete));
                    setItemToDelete(null);
                }}
                onCancel={() => setItemToDelete(null)}
            />
            <ProductEditModal
                isOpen={isProductModalOpen}
                onClose={() => setIsProductModalOpen(false)}
                onSave={() => {
                    fetchAll();
                    setToast({ message: "Đã thêm sản phẩm mới thành công!", type: 'success' });
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
    );
}
