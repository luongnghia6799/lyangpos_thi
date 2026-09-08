import React, { useState, useEffect, useRef, useMemo } from 'react';
import axios from 'axios';
import { m, AnimatePresence } from 'framer-motion';
import {
    Search, Plus, Minus, X, ClipboardList, Trash2,
    Save, AlertCircle, History, WifiOff, Filter,
    Calendar, Package, ArrowRight, RotateCcw,
    CheckCircle2, AlertTriangle, Info, ArrowLeftRight
} from 'lucide-react';
import { formatNumber, cn } from '../lib/utils';
import Portal from './Portal';

export default function WebInventory({ isOpen, onClose }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);

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
        const saved = localStorage.getItem('web_inventory_audit');
        return saved ? JSON.parse(saved) : [];
    });

    const [note, setNote] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [toast, setToast] = useState(null);

    const { totalThung, totalLe } = useMemo(() => {
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

    const searchInputRef = useRef(null);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                onClose();
            } else if (e.key === 'F2') {
                e.preventDefault();
                searchInputRef.current?.focus();
            } else if (e.key === 'F12') {
                e.preventDefault();
                if (auditItems.length > 0) handleSubmitAudit();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, auditItems]);

    // Focus only once when opened
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => searchInputRef.current?.focus(), 300);
        }
    }, [isOpen]);

    useEffect(() => {
        localStorage.setItem('web_inventory_audit', JSON.stringify(auditItems));
    }, [auditItems]);

    const [allProducts, setAllProducts] = useState([]);
    const [auditFilter, setAuditFilter] = useState('audited'); // 'audited' or 'remaining'
    const [auditedTodayIds, setAuditedTodayIds] = useState(new Set());

    useEffect(() => {
        if (!isOpen) return;
        const fetchAll = async () => {
            try {
                const res = await axios.get('/api/products?limit=1000');
                setAllProducts(res.data.items || res.data);
            } catch (err) {
                console.error(err);
            }
        };
        const fetchToday = async () => {
            const todayStr = new Date().toISOString().split('T')[0];
            try {
                const res = await axios.get(`/api/inventory/audits?start_date=${todayStr}&end_date=${todayStr}`);
                const ids = new Set();
                (res.data.items || []).forEach(audit => {
                    (audit.details || []).forEach(detail => {
                        ids.add(detail.product_id);
                    });
                });
                setAuditedTodayIds(ids);
            } catch (err) {
                console.error(err);
            }
        };
        fetchAll();
        fetchToday();
    }, [isOpen]);

    useEffect(() => {
        if (mode === 'history' && isOpen) {
            fetchHistory();
        }
    }, [mode, isOpen, filterStartDate, filterEndDate, filterSearch]);

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
        setIsFilterOpen(false);
    };

    // Search logic with debounce
    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            if (searchTerm.trim().length >= 2) {
                performSearch(searchTerm);
            } else {
                setSearchResults([]);
            }
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm]);

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
                actual_stock: product.stock // Default to system stock
            };
            setAuditItems(prev => [newItem, ...prev]);
            setSearchTerm('');
            setSearchResults([]);
            searchInputRef.current?.focus();
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
                note: note || 'Kiểm kê kho từ POS Web',
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
            localStorage.removeItem('web_inventory_audit');

            showToast('Đã lưu phiếu kiểm kê thành công!');
            setMode('history');
        } catch (err) {
            showToast('Lỗi khi lưu phiếu kiểm kê', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <Portal>
            <div className="fixed inset-0 z-[4000] flex items-center justify-center font-sans">
                <m.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-slate-950/40 backdrop-blur-md"
                />
                <m.div
                    initial={{ scale: 0.95, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.95, opacity: 0, y: 20 }}
                    className="relative w-[95vw] h-[90vh] bg-transparent shadow-2xl rounded-[2.5rem] border border-white/20 dark:border-slate-800 flex flex-col overflow-hidden"
                >
                    {/* Header */}
                    <div className="px-8 py-6 bg-gradient-to-r from-primary/10 via-transparent to-transparent border-b border-gray-100 dark:border-slate-800 flex items-center justify-between shrink-0">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-primary/10 rounded-2xl text-primary">
                                <ClipboardList size={28} />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-gray-800 dark:text-gray-100 uppercase tracking-tight leading-none">Kiểm kê kho hàng</h2>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-[0.2em] mt-1.5 flex items-center gap-2">
                                    {mode === 'audit' ? (
                                        <>
                                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                            Đang tạo phiếu mới
                                        </>
                                    ) : (
                                        <>
                                            <History size={12} />
                                            Xem lại lịch sử kiểm kê
                                        </>
                                    )}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="bg-transparent p-1 rounded-2xl flex">
                                <button
                                    onClick={() => setMode('audit')}
                                    className={cn(
                                        "px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                                        mode === 'audit' ? "bg-white dark:bg-slate-700 text-primary shadow-sm" : "text-gray-400 hover:text-gray-600"
                                    )}
                                >
                                    Kiểm mới
                                </button>
                                <button
                                    onClick={() => setMode('history')}
                                    className={cn(
                                        "px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                                        mode === 'history' ? "bg-white dark:bg-slate-700 text-primary shadow-sm" : "text-gray-400 hover:text-gray-600"
                                    )}
                                >
                                    Lịch sử
                                </button>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-3 hover:bg-rose-50 dark:hover:bg-rose-900/20 text-gray-400 hover:text-rose-500 rounded-2xl transition-all ml-4"
                            >
                                <X size={24} />
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 flex overflow-hidden">
                        {mode === 'audit' ? (
                            <>
                                {/* Left Side: Product Search & List */}
                                <div className="w-[450px] border-r border-gray-100 dark:border-slate-800 flex flex-col bg-transparent/50 dark:bg-slate-900/50 shrink-0">
                                    <div className="p-6">
                                        <div className="relative group">
                                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={20} />
                                            <input
                                                ref={searchInputRef}
                                                className="w-full bg-transparent border-2 border-transparent focus:border-primary/30 rounded-2xl py-4 pl-12 pr-4 outline-none font-bold text-sm shadow-sm transition-all dark:text-white"
                                                placeholder="TÌM TÊN HOẶC MÃ SẢN PHẨM..."
                                                value={searchTerm}
                                                onChange={e => setSearchTerm(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter' && searchResults.length > 0) {
                                                        addToAudit(searchResults[0]);
                                                    }
                                                }}
                                            />
                                            {isSearching && (
                                                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                                    <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                                </div>
                                            )}
                                        </div>

                                        {/* Search Results */}
                                        <AnimatePresence>
                                            {searchTerm.length >= 2 && (
                                                <m.div
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    className="absolute mt-2 w-[402px] bg-transparent rounded-3xl shadow-2xl border border-gray-100 dark:border-slate-700 z-50 max-h-[500px] overflow-y-auto no-scrollbar p-2"
                                                >
                                                    {searchResults.length === 0 && !isSearching ? (
                                                        <div className="p-8 text-center text-gray-400 text-xs font-bold uppercase tracking-widest">Không tìm thấy sản phẩm</div>
                                                    ) : (
                                                        searchResults.map((p, idx) => {
                                                            const isAdded = auditItems.find(ai => ai.product_id === p.id);
                                                            const isAuditedToday = auditedTodayIds.has(p.id);
                                                            return (
                                                                <button
                                                                    key={p.id}
                                                                    onClick={() => !isAdded && addToAudit(p)}
                                                                    className={cn(
                                                                        "w-full flex items-center justify-between p-4 rounded-2xl transition-all text-left border-b border-gray-50 dark:border-slate-700 last:border-0 group/item",
                                                                        isAdded ? "opacity-50 cursor-default bg-transparent" : "hover:bg-primary/5 cursor-pointer"
                                                                    )}
                                                                >
                                                                    <div className="flex-1 pr-4">
                                                                        <div className="font-black text-xs text-gray-800 dark:text-gray-100 uppercase group-hover/item:text-primary transition-colors flex items-center gap-2">
                                                                            {p.name}
                                                                            {isAdded && <span className="text-[8px] bg-emerald-500 text-white px-1.5 py-0.5 rounded-full">Đang kiểm</span>}
                                                                            {isAuditedToday && !isAdded && <span className="text-[8px] bg-amber-500 text-white px-1.5 py-0.5 rounded-full">Đã kiểm hôm nay</span>}
                                                                        </div>
                                                                        <div className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-tighter">
                                                                            Mã: {p.code || '---'} | Tồn: {p.stock} {p.unit}
                                                                        </div>
                                                                    </div>
                                                                    {!isAdded && (
                                                                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary opacity-0 group-hover/item:opacity-100 transition-all">
                                                                            <Plus size={16} strokeWidth={3} />
                                                                        </div>
                                                                    )}
                                                                </button>
                                                            );
                                                        })
                                                    )}
                                                </m.div>
                                            )}
                                        </AnimatePresence>
                                    </div>

                                    <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-3 no-scrollbar">
                                        <div className="flex items-center justify-between px-2">
                                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Danh mục đang kiểm ({auditItems.length})</span>
                                            {auditItems.length > 0 && (
                                                <button onClick={() => setAuditItems([])} className="text-[10px] font-black text-rose-500 uppercase hover:underline">Xóa hết</button>
                                            )}
                                        </div>

                                        {auditItems.length === 0 ? (
                                            <div className="h-64 flex flex-col items-center justify-center text-gray-300 dark:text-slate-800 grayscale">
                                                <Package size={64} strokeWidth={1} className="mb-4 opacity-20" />
                                                <p className="font-black text-[10px] uppercase tracking-[0.2em] text-center px-10 leading-relaxed">Nhập tên sản phẩm để thêm vào danh sách kiểm kê</p>
                                            </div>
                                        ) : (
                                            auditItems.map((item) => (
                                                <m.div
                                                    key={item.product_id}
                                                    layout
                                                    className="bg-transparent p-4 rounded-3xl shadow-sm border border-transparent hover:border-primary/20 transition-all group"
                                                >
                                                    <div className="flex justify-between items-start mb-2">
                                                        <div className="font-black text-xs text-gray-800 dark:text-gray-100 uppercase truncate pr-4">{item.name}</div>
                                                        <button onClick={() => removeItem(item.product_id)} className="text-gray-300 hover:text-rose-500 transition-colors">
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                    <div className="flex items-center justify-between text-[10px] font-bold">
                                                        <div className="text-gray-400 uppercase tracking-tighter">Mã: {item.code || '---'}</div>
                                                        <div className="text-primary/60 uppercase tracking-tighter">Hệ thống: {item.system_stock} {item.unit}</div>
                                                    </div>
                                                </m.div>
                                            ))
                                        )}
                                    </div>
                                </div>

                                {/* Right Side: Table View & Submit */}
                                <div className="flex-1 flex flex-col overflow-hidden bg-transparent">
                                    <div className="flex-1 overflow-auto">
                                        <table className="w-full text-left border-separate border-spacing-0">
                                            <thead className="sticky top-0 z-10 bg-transparent backdrop-blur-md">
                                                <tr>
                                                    <th className="p-6 text-[10px] font-black uppercase tracking-widest text-gray-400 border-b dark:border-slate-800">Sản phẩm</th>
                                                    <th className="p-6 text-[10px] font-black uppercase tracking-widest text-gray-400 border-b dark:border-slate-800 text-center">Tồn hệ thống</th>
                                                    <th className="p-6 text-[10px] font-black uppercase tracking-widest text-gray-400 border-b dark:border-slate-800 text-center w-64">Thực tế</th>
                                                    <th className="p-6 text-[10px] font-black uppercase tracking-widest text-gray-400 border-b dark:border-slate-800 text-center">Chênh lệch</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {auditItems.length === 0 ? (
                                                    <tr>
                                                        <td colSpan="4" className="py-40 text-center">
                                                            <div className="flex flex-col items-center opacity-30">
                                                                <ClipboardList size={64} className="mb-4" />
                                                                <span className="font-black text-xs uppercase tracking-[0.3em]">Bảng kiểm kê trống</span>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    auditItems.map((item, idx) => {
                                                        const diff = item.actual_stock - item.system_stock;
                                                        return (
                                                            <tr key={item.product_id} className="group hover:bg-transparent dark:hover:bg-white/5 transition-colors">
                                                                <td className="p-6 border-b dark:border-slate-800 pr-0">
                                                                    <div className="font-black text-sm text-gray-800 dark:text-gray-100 uppercase">{item.name}</div>
                                                                    <div className="text-[10px] font-bold text-gray-400 mt-1">Đơn vị: {item.unit}</div>
                                                                </td>
                                                                <td className="p-6 border-b dark:border-slate-800 text-center">
                                                                    <div className="inline-flex flex-col items-center px-4 py-2 bg-transparent rounded-2xl">
                                                                        <span className="text-lg font-black dark:text-gray-200 tabular-nums">{item.system_stock}</span>
                                                                        <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest leading-none">{item.unit}</span>
                                                                    </div>
                                                                </td>
                                                                <td className="p-6 border-b dark:border-slate-800">
                                                                    <div className="flex flex-col gap-2">
                                                                        {item.multiplier > 1 ? (
                                                                            /* Multi-unit Input */
                                                                        <div className="flex flex-col gap-2">
                                                                            <div className="flex items-center gap-2">
                                                                                <div className="flex-1 relative">
                                                                                    <input
                                                                                        type="number"
                                                                                        className="w-full bg-transparent border-2 border-gray-100 dark:border-slate-700 focus:border-primary/50 py-3 rounded-2xl text-center font-black text-lg outline-none tabular-nums"
                                                                                        value={Math.floor(item.actual_stock / item.multiplier)}
                                                                                        onChange={e => {
                                                                                            const secVal = parseInt(e.target.value) || 0;
                                                                                            const priVal = item.actual_stock % item.multiplier;
                                                                                            updateActualStock(item.product_id, secVal * item.multiplier + priVal);
                                                                                        }}
                                                                                    />
                                                                                    <span className="absolute -top-2 left-3 px-1.5 bg-transparent text-[8px] font-black text-primary uppercase">{item.secondary_unit}</span>
                                                                                </div>
                                                                                <Plus size={14} className="text-gray-300" />
                                                                                <div className="flex-1 relative">
                                                                                    <input
                                                                                        type="number"
                                                                                        className="w-full bg-transparent border-2 border-gray-100 dark:border-slate-700 focus:border-primary/50 py-3 rounded-2xl text-center font-black text-lg outline-none tabular-nums"
                                                                                        value={(item.actual_stock % item.multiplier).toFixed(2).replace(/\.00$/, '')}
                                                                                        onChange={e => {
                                                                                            const priVal = parseFloat(e.target.value) || 0;
                                                                                            const secVal = Math.floor(item.actual_stock / item.multiplier);
                                                                                            updateActualStock(item.product_id, secVal * item.multiplier + priVal);
                                                                                        }}
                                                                                    />
                                                                                    <span className="absolute -top-2 left-3 px-1.5 bg-transparent text-[8px] font-black text-primary uppercase">{item.unit} Lẻ</span>
                                                                                </div>
                                                                            </div>
                                                                            <div className="flex items-center justify-center gap-2">
                                                                                <div className="h-px flex-1 bg-transparent" />
                                                                                <span className="text-[8px] font-black text-gray-400 uppercase bg-transparent px-2 py-0.5 rounded border border-gray-50 dark:border-slate-800">
                                                                                    Tổng quy lẻ: <span className="text-primary tabular-nums">{item.actual_stock}</span> {item.unit}
                                                                                </span>
                                                                                <div className="h-px flex-1 bg-transparent" />
                                                                            </div>
                                                                        </div>
                                                                        ) : (
                                                                            /* Single-unit Input */
                                                                            <div className="relative">
                                                                                <input
                                                                                    type="number"
                                                                                    className="w-full bg-transparent border-2 border-gray-100 dark:border-slate-700 focus:border-primary/50 py-4 rounded-2xl text-center font-black text-xl outline-none tabular-nums"
                                                                                    value={item.actual_stock}
                                                                                    onChange={e => updateActualStock(item.product_id, e.target.value)}
                                                                                />
                                                                                <span className="absolute top-1/2 -translate-y-1/2 right-4 text-[10px] font-black text-gray-300 uppercase">{item.unit}</span>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </td>
                                                                <td className="p-6 border-b dark:border-slate-800 text-center">
                                                                    <div className={cn(
                                                                        "inline-flex flex-col items-center px-6 py-3 rounded-[1.5rem] border animate-in zoom-in-95 duration-200",
                                                                        diff === 0
                                                                            ? "bg-transparent border-gray-100 text-gray-400 dark:bg-slate-800/50 dark:border-slate-700"
                                                                            : diff > 0
                                                                                ? "bg-emerald-50 border-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:border-emerald-500/20"
                                                                                : "bg-rose-50 border-rose-100 text-rose-600 dark:bg-rose-500/10 dark:border-rose-500/20"
                                                                    )}>
                                                                        <span className="text-xl font-black tabular-nums">{diff > 0 ? '+' : ''}{formatNumber(diff)}</span>
                                                                        <div className="flex items-center gap-1">
                                                                            {diff === 0 ? <CheckCircle2 size={10} /> : diff > 0 ? <Plus size={10} /> : <Minus size={10} />}
                                                                            <span className="text-[8px] font-black uppercase tracking-tight">{diff === 0 ? 'Khớp tồn' : diff > 0 ? 'Dư thừa' : 'Hao hụt'}</span>
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

                                    {/* Footer Action */}
                                    <div className="p-8 bg-transparent border-t border-gray-100 dark:border-slate-800 flex items-center gap-6">
                                        <div className="flex-1 relative">
                                            <label className="absolute -top-2 left-4 px-2 bg-transparent text-[9px] font-black text-gray-400 uppercase tracking-widest z-10">Ghi chú đợt kiểm kho</label>
                                            <textarea
                                                className="w-full bg-transparent border-2 border-transparent focus:border-primary/20 rounded-2xl p-4 pt-5 outline-none font-bold text-sm min-h-[80px] max-h-[80px] dark:text-white shadow-inner"
                                                placeholder="VD: Kiểm kê định kỳ tháng 3..."
                                                value={note}
                                                onChange={e => setNote(e.target.value)}
                                            />
                                        </div>
                                        <div className="shrink-0 flex flex-col gap-2">
                                            <div className="flex items-center gap-4 px-4 py-2 bg-transparent rounded-2xl shadow-sm border border-primary/10 mb-2">
                                                <div className="flex flex-col items-end">
                                                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Tổng mặt hàng</span>
                                                    <span className="text-lg font-black text-primary">{auditItems.length}</span>
                                                </div>
                                                <div className="w-px h-8 bg-transparent dark:bg-slate-700" />
                                                <div className="flex flex-col">
                                                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Hư hỏng/Mất mát</span>
                                                    <span className="text-lg font-black text-rose-500">-{auditItems.filter(i => (i.actual_stock - i.system_stock) < 0).length}</span>
                                                </div>
                                                <div className="w-px h-8 bg-transparent dark:bg-slate-700" />
                                                <div className="flex flex-col">
                                                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Tổng cộng tồn</span>
                                                    <div className="flex items-baseline gap-1">
                                                        <span className="text-lg font-black text-emerald-500 tabular-nums">{formatNumber(totalThung)}</span>
                                                        <span className="text-[8px] font-bold text-gray-400 uppercase">Thùng</span>
                                                        <span className="text-lg font-black text-amber-500 tabular-nums ml-1">{formatNumber(totalLe)}</span>
                                                        <span className="text-[8px] font-bold text-gray-400 uppercase">Lẻ</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <m.button
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                disabled={auditItems.length === 0 || isSubmitting}
                                                onClick={handleSubmitAudit}
                                                className={cn(
                                                    "px-10 py-5 rounded-3xl font-black uppercase tracking-[0.2em] shadow-2xl flex items-center justify-center gap-4 transition-all group",
                                                    isSubmitting || auditItems.length === 0
                                                        ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                                                        : "bg-primary text-white shadow-primary/30 hover:brightness-110"
                                                )}
                                            >
                                                {isSubmitting ? (
                                                    <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                                                ) : (
                                                    <>
                                                        XÁC NHẬN CẬP NHẬT KHO
                                                        <Save size={24} className="group-hover:translate-x-1 transition-transform" />
                                                    </>
                                                )}
                                            </m.button>
                                        </div>
                                    </div>
                                </div>
                            </>
                        ) : (
                            /* History Mode */
                            <div className="flex-1 flex flex-col overflow-hidden">
                                <div className="px-8 py-4 bg-transparent/50 dark:bg-slate-900/50 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <span className="text-xs font-black text-gray-400 uppercase tracking-widest">
                                            {historyItems.length} PHIẾU KIỂM KÊ
                                        </span>
                                        {(filterStartDate || filterEndDate || filterSearch) && (
                                            <button
                                                onClick={clearFilters}
                                                className="px-3 py-1 bg-rose-50 text-rose-500 rounded-full text-[9px] font-black uppercase hover:bg-rose-100 transition-colors"
                                            >
                                                XÓA BỘ LỌC
                                            </button>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="relative">
                                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                            <input
                                                value={filterSearch}
                                                onChange={e => setFilterSearch(e.target.value)}
                                                placeholder="TÌM THEO GHI CHÚ..."
                                                className="bg-transparent border-2 border-transparent focus:border-primary/20 rounded-[1.2rem] py-2.5 pl-10 pr-4 outline-none font-bold text-[10px] w-64 shadow-sm"
                                            />
                                        </div>
                                        <div className="flex items-center bg-transparent rounded-[1.2rem] border-2 border-transparent shadow-sm px-4 py-2 gap-3">
                                            <div className="flex items-center gap-2">
                                                <Calendar size={12} className="text-primary" />
                                                <input
                                                    type="date"
                                                    value={filterStartDate}
                                                    onChange={e => setFilterStartDate(e.target.value)}
                                                    className="bg-transparent text-[10px] font-black uppercase dark:text-white outline-none"
                                                />
                                            </div>
                                            <ArrowRight size={12} className="text-gray-300" />
                                            <input
                                                type="date"
                                                value={filterEndDate}
                                                onChange={e => setFilterEndDate(e.target.value)}
                                                className="bg-transparent text-[10px] font-black uppercase dark:text-white outline-none"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex-1 overflow-y-auto p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 no-scrollbar">
                                    {isLoadingHistory ? (
                                        <div className="col-span-full py-40 flex flex-col items-center justify-center opacity-30">
                                            <RotateCcw size={64} className="animate-spin mb-4" />
                                            <span className="font-black text-xs uppercase tracking-[0.3em]">Đang tải dữ liệu...</span>
                                        </div>
                                    ) : historyItems.length === 0 ? (
                                        <div className="col-span-full py-40 flex flex-col items-center justify-center opacity-30grayscale">
                                            <Info size={64} className="mb-4" />
                                            <span className="font-black text-xs uppercase tracking-[0.3em]">Không tìm thấy phiếu nào</span>
                                        </div>
                                    ) : (
                                        historyItems.map((audit) => (
                                            <m.div
                                                key={audit.id}
                                                whileHover={{ y: -4, shadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                                                onClick={() => setSelectedAudit(audit)}
                                                className="bg-transparent p-6 rounded-[2rem] border border-gray-100 dark:border-slate-700 shadow-sm cursor-pointer transition-all hover:border-primary/30"
                                            >
                                                <div className="flex justify-between items-start mb-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 bg-primary/5 dark:bg-primary/20 rounded-2xl flex items-center justify-center text-primary">
                                                            <ClipboardList size={20} />
                                                        </div>
                                                        <div>
                                                            <div className="text-sm font-black text-gray-800 dark:text-white uppercase tracking-tighter">PHIẾU #{audit.id}</div>
                                                            <div className="text-[10px] font-bold text-gray-400 mt-0.5">{new Date(audit.date).toLocaleString('vi-VN')}</div>
                                                        </div>
                                                    </div>
                                                    <span className="px-3 py-1 bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 rounded-lg text-[9px] font-black uppercase">Hoàn tất</span>
                                                </div>
                                                <div className="bg-transparent p-3 rounded-2xl mb-4 text-[11px] font-bold text-gray-600 dark:text-gray-400 italic">
                                                    {audit.note ? `"${audit.note}"` : 'Không có ghi chú'}
                                                </div>
                                                <div className="flex items-center justify-between pt-4 border-t border-gray-50 dark:border-slate-700">
                                                    <div className="flex items-center gap-2">
                                                        <Package size={14} className="text-gray-400" />
                                                        <span className="text-[10px] font-black text-gray-500 uppercase">{audit.details.length} mặt hàng</span>
                                                    </div>
                                                    <div className="w-8 h-8 rounded-full bg-transparent dark:bg-slate-700 flex items-center justify-center text-gray-400 group-hover:bg-primary group-hover:text-white transition-all">
                                                        <ArrowRight size={16} />
                                                    </div>
                                                </div>
                                            </m.div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </m.div>
            </div>

            {/* Sub Modal: Audit Details View */}
            <AnimatePresence>
                {selectedAudit && (
                    <div className="fixed inset-0 z-[5000] flex items-center justify-center p-4">
                        <m.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedAudit(null)}
                            className="absolute inset-0 bg-slate-950/60 backdrop-blur-md"
                        />
                        <m.div
                            initial={{ scale: 0.9, opacity: 0, y: 30 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 30 }}
                            className="relative w-full max-w-4xl bg-transparent rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
                        >
                            <div className="p-8 border-b dark:border-slate-800 flex justify-between items-center bg-transparent dark:bg-slate-950">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-primary/10 rounded-2xl text-primary">
                                        <Package size={28} />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-black text-gray-800 dark:text-white uppercase tracking-tighter">Chi tiết phiếu kiểm kê #{selectedAudit.id}</h2>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mt-1">{new Date(selectedAudit.date).toLocaleString('vi-VN')}</p>
                                    </div>
                                </div>
                                <button onClick={() => setSelectedAudit(null)} className="p-3 hover:bg-gray-200 dark:hover:bg-slate-800 rounded-2xl transition-all"><X size={24} /></button>
                            </div>

                            <div className="p-8 pt-4 overflow-y-auto space-y-4 no-scrollbar">
                                <table className="w-full text-left">
                                    <thead className="sticky top-0 bg-transparent z-10">
                                        <tr>
                                            <th className="py-4 text-[10px] font-black uppercase text-gray-400 tracking-widest border-b dark:border-slate-800">Sản phẩm</th>
                                            <th className="py-4 text-[10px] font-black uppercase text-gray-400 tracking-widest border-b dark:border-slate-800 text-center">Hệ thống</th>
                                            <th className="py-4 text-[10px] font-black uppercase text-gray-400 tracking-widest border-b dark:border-slate-800 text-center">Thực tế</th>
                                            <th className="py-4 text-[10px] font-black uppercase text-gray-400 tracking-widest border-b dark:border-slate-800 text-center">Chênh lệch</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50 dark:divide-slate-800">
                                        {selectedAudit.details.map((detail, idx) => {
                                            const diff = detail.discrepancy;
                                            return (
                                                <tr key={idx}>
                                                    <td className="py-6 min-w-[300px]">
                                                        <div className="font-black text-sm text-gray-800 dark:text-gray-100 uppercase">{detail.product_name}</div>
                                                        <div className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-tighter">Mã SP: {detail.product_code || '---'}</div>
                                                    </td>
                                                    <td className="py-6 text-center tabular-nums font-bold text-gray-600 dark:text-gray-400">{detail.system_stock}</td>
                                                    <td className="py-6 text-center tabular-nums font-black text-primary">
                                                        {detail.actual_stock}
                                                        {detail.multiplier > 1 && (
                                                            <div className="text-[9px] font-black text-gray-400 uppercase mt-0.5">
                                                                ~ {Math.floor(detail.actual_stock / detail.multiplier)} {detail.secondary_unit}
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="py-6 text-center">
                                                        <div className={cn(
                                                            "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black tabular-nums",
                                                            diff === 0 ? "text-gray-400" : diff > 0 ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"
                                                        )}>
                                                            {diff > 0 ? <Plus size={10} strokeWidth={3} /> : diff < 0 ? <Minus size={10} strokeWidth={3} /> : <CheckCircle2 size={10} />}
                                                            {Math.abs(diff)}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>

                                {selectedAudit.note && (
                                    <div className="mt-8 p-6 bg-amber-50 dark:bg-amber-900/20 rounded-[2rem] border border-amber-100 dark:border-amber-900/30 flex gap-4">
                                        <div className="p-3 bg-amber-200 dark:bg-amber-800 rounded-2xl text-amber-700 dark:text-amber-200 shrink-0">
                                            <Info size={24} />
                                        </div>
                                        <div>
                                            <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Ghi chú phiếu kiểm</span>
                                            <p className="text-sm font-bold text-amber-900 dark:text-amber-100 mt-1 leading-relaxed">{selectedAudit.note}</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="p-8 bg-transparent dark:bg-slate-950/50 flex gap-4">
                                <button
                                    onClick={() => setSelectedAudit(null)}
                                    className="flex-1 py-5 bg-transparent text-gray-500 rounded-[1.5rem] font-black uppercase tracking-widest text-xs border border-gray-100 dark:border-slate-800 shadow-sm"
                                >
                                    Đóng chi tiết
                                </button>
                                <button
                                    onClick={() => {
                                        // Bonus: Re-import items to a new audit
                                        const itemsToImport = selectedAudit.details.map(d => ({
                                            product_id: d.product_id,
                                            name: d.product_name,
                                            code: d.product_code,
                                            unit: d.unit, // Assuming unit is available or use d.multiplier logic
                                            secondary_unit: d.secondary_unit,
                                            multiplier: d.multiplier,
                                            system_stock: d.system_stock,
                                            actual_stock: d.actual_stock
                                        }));
                                        setAuditItems(itemsToImport);
                                        setMode('audit');
                                        setSelectedAudit(null);
                                        showToast('Đã sao chép các mặt hàng vào phiếu kiểm mới!');
                                    }}
                                    className="flex-1 py-5 bg-primary text-white rounded-[1.5rem] font-black uppercase tracking-widest text-xs shadow-xl shadow-primary/20 flex items-center justify-center gap-2"
                                >
                                    <ArrowLeftRight size={16} />
                                    Kiểm lại đợt này
                                </button>
                            </div>
                        </m.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Global Toasts inside Portal */}
            <AnimatePresence>
                {toast && (
                    <m.div
                        initial={{ opacity: 0, y: -40, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -40, scale: 0.9 }}
                        className={cn(
                            "fixed top-10 left-1/2 -translate-x-1/2 z-[10000] px-8 py-4 rounded-3xl shadow-2xl flex items-center gap-4 min-w-[320px] backdrop-blur-md",
                            toast.type === 'error' ? "bg-rose-500 text-white" :
                                toast.type === 'info' ? "bg-amber-500 text-white" : "bg-emerald-600 text-white"
                        )}
                    >
                        {toast.type === 'error' ? <AlertTriangle size={24} /> :
                            toast.type === 'info' ? <Info size={24} /> : <CheckCircle2 size={24} />}
                        <span className="font-black uppercase text-xs tracking-widest">{toast.message}</span>
                    </m.div>
                )}
            </AnimatePresence>
        </Portal>
    );
}
