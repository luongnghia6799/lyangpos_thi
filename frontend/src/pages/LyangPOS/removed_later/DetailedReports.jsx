import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import {
    Download, RefreshCcw, Search, Calendar, ChevronDown, ChevronUp,
    ArrowUpDown, FileText, Package, Tag, Layers, ChevronLeft, ChevronRight, FileSpreadsheet,
    Sprout, Wheat, TrendingUp
} from 'lucide-react';
import { m, AnimatePresence } from 'framer-motion';
import SearchableSelect from '../../components/SearchableSelect';
import { cn } from '../../lib/utils';
import LoadingOverlay from '../../components/LoadingOverlay';

export default function DetailedReports() {
    const [loading, setLoading] = useState(false);

    const getAbsoluteUrl = (path) => {
        const savedIp = localStorage.getItem('server_ip');
        const baseUrl = axios.defaults.baseURL;
        return `${baseUrl}${path}`;
    };
    const [data, setData] = useState([]);
    const [brands, setBrands] = useState([]);
    const [allCategories, setAllCategories] = useState([]);
    const [allProducts, setAllProducts] = useState([]);

    // Pagination states
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(50);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [overallTotals, setOverallTotals] = useState({ quantity: 0, total: 0 });
    const [accountingEnabled] = useState(localStorage.getItem('feature_accounting_enabled') !== 'false');

    const savedState = JSON.parse(sessionStorage.getItem('detailed_report_state') || '{}');

    // Filters
    const [detailedStartDate, setDetailedStartDate] = useState(savedState.detailedStartDate || new Date(new Date().setHours(0, 0, 0, 0)).toISOString().slice(0, 16));
    const [detailedEndDate, setDetailedEndDate] = useState(savedState.detailedEndDate || new Date().toISOString().slice(0, 16));
    const [detailedBrands, setDetailedBrands] = useState(savedState.detailedBrands || []);
    const [detailedCategories, setDetailedCategories] = useState(savedState.detailedCategories || []);
    const [detailedProductSearch, setDetailedProductSearch] = useState('');
    const [detailedProductSelection, setDetailedProductSelection] = useState(savedState.detailedProductSelection || []);
    const [viewMode, setViewMode] = useState(savedState.viewMode || 'detail'); // 'detail' or 'summary'
    const [priceMode, setPriceMode] = useState(savedState.priceMode || 'sale'); // 'sale' or 'accounting'
    const [hasCodeOnly, setHasCodeOnly] = useState(savedState.hasCodeOnly || false);

    // Sorting & Accounting Params
    const [sortBy, setSortBy] = useState('time');
    const [sortOrder, setSortOrder] = useState('desc');
    const [manualInvoiceId, setManualInvoiceId] = useState(savedState.manualInvoiceId || '');
    const [manualInvoiceDate, setManualInvoiceDate] = useState(savedState.manualInvoiceDate || new Date().toISOString().split('T')[0]);
    const [targetProfit, setTargetProfit] = useState(savedState.targetProfit || 20);
    const [profitVariance, setProfitVariance] = useState(savedState.profitVariance || 2);

    // Persist state to sessionStorage whenever it changes
    useEffect(() => {
        const stateToSave = {
            detailedStartDate,
            detailedEndDate,
            detailedBrands,
            detailedCategories,
            detailedProductSelection,
            viewMode,
            priceMode,
            hasCodeOnly,
            manualInvoiceId,
            manualInvoiceDate,
            targetProfit,
            profitVariance
        };
        sessionStorage.setItem('detailed_report_state', JSON.stringify(stateToSave));
    }, [detailedStartDate, detailedEndDate, detailedBrands, detailedCategories, detailedProductSelection, viewMode, priceMode, hasCodeOnly, manualInvoiceId, manualInvoiceDate, targetProfit, profitVariance]);

    useEffect(() => {
        fetchMetadata();
    }, []);

    useEffect(() => {
        setPage(1);
    }, [detailedStartDate, detailedEndDate, detailedBrands, detailedCategories, detailedProductSearch, detailedProductSelection, viewMode, priceMode, hasCodeOnly]);

    // Fetch data when page or filter-triggered-page-1 changes
    useEffect(() => {
        fetchData();
    }, [page, limit, detailedStartDate, detailedEndDate, detailedBrands, detailedCategories, detailedProductSearch, detailedProductSelection, viewMode, priceMode, hasCodeOnly]);

    const fetchMetadata = async () => {
        try {
            const [bRes, cRes, pRes] = await Promise.all([
                axios.get('/api/products/brands'),
                axios.get('/api/categories'),
                axios.get('/api/products')
            ]);
            setBrands(bRes.data);
            setAllCategories(cRes.data);
            setAllProducts(pRes.data);
        } catch (err) {
            console.error('Lỗi tải dữ liệu metadata:', err);
        }
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (detailedStartDate) params.append('start_date', detailedStartDate);
            if (detailedEndDate) params.append('end_date', detailedEndDate);
            if (detailedBrands.length > 0) params.append('brands', detailedBrands.join(','));
            if (detailedCategories.length > 0) params.append('categories', detailedCategories.join(','));

            // Combine manual search with dropdown selection
            const manualItems = detailedProductSearch.split(/[\n,;]+/).map(i => i.trim()).filter(i => i);
            const dropdownItems = detailedProductSelection;
            const combinedProducts = Array.from(new Set([...manualItems, ...dropdownItems])).join(',');

            if (combinedProducts) {
                params.append('products', combinedProducts);
            }

            params.append('group_by_product', viewMode === 'summary');
            params.append('price_mode', priceMode);
            params.append('has_code', hasCodeOnly);
            params.append('page', page);
            params.append('limit', limit);
            params.append('target_profit', targetProfit);
            params.append('profit_variance', profitVariance);

            const res = await axios.get(`/api/reports/flattened-products?${params.toString()}`);

            const items = res.data?.items || [];
            setData(items);
            setTotalPages(res.data?.pages || 1);
            setTotalItems(res.data?.total || 0);
            setOverallTotals(res.data?.overall_totals || { quantity: 0, total: 0 });
        } catch (err) {
            console.error('Lỗi tải báo cáo chi tiết:', err);
            setData([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSort = (field) => {
        if (sortBy === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(field);
            setSortOrder('asc');
        }
    };

    const sortedData = useMemo(() => {
        if (!data || !Array.isArray(data)) return [];
        return [...data].sort((a, b) => {
            let valA = a[sortBy];
            let valB = b[sortBy];
            if (sortBy === 'time' || sortBy === 'date_iso') {
                valA = new Date(a.date_iso || a.time);
                valB = new Date(b.date_iso || b.time);
            }
            if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
            if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
            return 0;
        });
    }, [data, sortBy, sortOrder]);

    const handleExport = async () => {
        try {
            const params = Object.fromEntries(getExportParams());
            const res = await axios.get('/api/reports/flattened-products/export', { params, responseType: 'blob' });
            const { saveOrOpenFile } = await import('../../utils/downloadHelper');
            const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
            await saveOrOpenFile(res.data, `bao_cao_chi_tiet_${todayStr}.xlsx`);
        } catch (err) {
            console.error("Export Detailed Error:", err);
        }
    };

    const handleExportTemplate = async () => {
        try {
            const params = Object.fromEntries(getExportParams());
            const res = await axios.get('/api/accounting/export', { params, responseType: 'blob' });
            const { saveOrOpenFile } = await import('../../utils/downloadHelper');
            const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
            await saveOrOpenFile(res.data, `bao_cao_ke_toan_${todayStr}.xlsx`);
        } catch (err) {
            console.error("Export Template Error:", err);
        }
    };

    const getExportParams = () => {
        const params = new URLSearchParams();
        if (detailedStartDate) params.append('start_date', detailedStartDate);
        if (detailedEndDate) params.append('end_date', detailedEndDate);
        if (detailedBrands.length > 0) params.append('brands', detailedBrands.join(','));
        if (detailedCategories.length > 0) params.append('categories', detailedCategories.join(','));

        const manualItems = detailedProductSearch.split(/[\n,;]+/).map(i => i.trim()).filter(i => i);
        const dropdownItems = detailedProductSelection;
        const combinedProducts = Array.from(new Set([...manualItems, ...dropdownItems])).join(',');

        if (combinedProducts) {
            params.append('products', combinedProducts);
        }

        params.append('group_by_product', viewMode === 'summary');
        params.append('price_mode', priceMode);
        params.append('has_code', hasCodeOnly);
        params.append('manual_id', manualInvoiceId);
        params.append('manual_date', manualInvoiceDate);
        params.append('target_profit', targetProfit);
        params.append('profit_variance', profitVariance);

        return params;
    };

    const SortIcon = ({ field }) => {
        if (sortBy !== field) return <ArrowUpDown size={14} className="ml-1 opacity-20" />;
        return sortOrder === 'asc' ? <ChevronUp size={14} className="ml-1 text-emerald-600" /> : <ChevronDown size={14} className="ml-1 text-emerald-600" />;
    };

    return (
        <div className="pt-2 px-4 pb-20 w-full max-w-[98%] mx-auto transition-all duration-500">
            {loading && <LoadingOverlay isVisible={true} message="Đang xử lý dữ liệu..." />}

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10 relative z-10 px-4 md:px-0">
                <div className="flex items-center gap-5">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-black text-[#2d5016] dark:text-[#fdfdfb] uppercase tracking-tight flex items-center gap-3 pt-2 pb-0.5 leading-relaxed">
                            Báo Cáo Chi Tiết
                        </h1>
                        <div className="flex items-center gap-2 text-[#8b6f47] dark:text-[#d4a574]/60 font-bold text-xs uppercase tracking-widest mt-1">
                            <Sprout size={14} className="text-emerald-500" />
                            <span>Truy xuất dữ liệu bán hàng thông minh</span>
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 bg-[#fdfdfb]/80 dark:bg-slate-900/80 border-2 border-emerald-100 dark:border-emerald-900/50 p-2 rounded-[2rem] shadow-xl shadow-emerald-900/5 backdrop-blur-xl">
                    <div className="flex items-center gap-3 px-4 py-2 bg-emerald-50/50 dark:bg-emerald-900/20 rounded-full border border-emerald-100/50 dark:border-emerald-500/10">
                        <Calendar size={14} className="text-emerald-600" />
                        <div className="flex items-center gap-2">
                            <input
                                type="datetime-local"
                                value={detailedStartDate}
                                onChange={(e) => { setDetailedStartDate(e.target.value); setPage(1); }}
                                className="bg-transparent border-none outline-none font-black text-[11px] text-emerald-900 dark:text-emerald-100 uppercase"
                            />
                            <span className="text-[10px] font-black text-emerald-300">→</span>
                            <input
                                type="datetime-local"
                                value={detailedEndDate}
                                onChange={(e) => { setDetailedEndDate(e.target.value); setPage(1); }}
                                className="bg-transparent border-none outline-none font-black text-[11px] text-emerald-900 dark:text-emerald-100 uppercase"
                            />
                        </div>
                    </div>
                    <m.button
                        whileHover={{ rotate: 180 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => fetchData()}
                        className="w-11 h-11 flex items-center justify-center bg-transparent text-emerald-600 rounded-full shadow-md hover:shadow-lg transition-all border border-emerald-50 dark:border-slate-700"
                    >
                        <RefreshCcw size={18} strokeWidth={3} />
                    </m.button>
                </div>
            </div>

            {/* Background Decorations */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-[0.03] dark:opacity-[0.05] z-0">
                <div className="absolute top-20 right-[-100px] -rotate-12">
                    <Wheat size={600} />
                </div>
                <div className="absolute bottom-[-100px] left-[-100px] rotate-45">
                    <Sprout size={500} />
                </div>
            </div>

            {/* Quick Stats Banner */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10 relative z-10">
                <m.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-[#fdfdfb] dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-2xl shadow-emerald-900/5 border-2 border-emerald-50 dark:border-slate-800 relative overflow-hidden group hover:border-emerald-200 transition-all duration-500"
                >
                    <div className="absolute top-[-20px] right-[-20px] p-10 opacity-[0.03] group-hover:opacity-[0.08] group-hover:scale-110 transition-all duration-700">
                        <Package size={160} className="text-[#2d5016] dark:text-white" />
                    </div>
                    <div className="relative z-10">
                        <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center text-emerald-600 mb-4">
                            <Layers size={24} strokeWidth={2.5} />
                        </div>
                        <p className="text-[11px] font-black uppercase tracking-[0.2em] text-emerald-600/60 mb-2 font-mono">Dòng Dữ Liệu</p>
                        <h3 className="text-5xl font-black text-slate-900 dark:text-white tabular-nums tracking-tighter">{totalItems.toLocaleString()}</h3>
                    </div>
                </m.div>

                <m.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-[#fdfdfb] dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-2xl shadow-emerald-900/5 border-2 border-emerald-50 dark:border-slate-800 relative overflow-hidden group hover:border-emerald-200 transition-all duration-500"
                >
                    <div className="absolute top-[-20px] right-[-20px] p-10 opacity-[0.03] group-hover:opacity-[0.08] group-hover:scale-110 transition-all duration-700">
                        <TrendingUp size={160} className="text-[#2d5016] dark:text-white" />
                    </div>
                    <div className="relative z-10">
                        <div className="w-12 h-12 bg-amber-50 dark:bg-amber-900/30 rounded-2xl flex items-center justify-center text-amber-600 mb-4">
                            <Package size={24} strokeWidth={2.5} />
                        </div>
                        <p className="text-[11px] font-black uppercase tracking-[0.2em] text-amber-600/60 mb-2 font-mono">Tổng Sản Lượng</p>
                        <h3 className="text-5xl font-black text-slate-900 dark:text-white tabular-nums tracking-tighter">{overallTotals.quantity.toLocaleString()}</h3>
                    </div>
                </m.div>

                <m.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-gradient-to-br from-[#2d5016] to-[#4a7c59] p-8 rounded-[2.5rem] shadow-2xl shadow-emerald-900/30 border-2 border-white/10 relative overflow-hidden group hover:scale-[1.02] transition-all duration-500"
                >
                    <div className="absolute top-[-20px] right-[-20px] p-10 opacity-10 group-hover:opacity-20 group-hover:rotate-12 transition-all duration-700">
                        <Tag size={160} className="text-white" />
                    </div>
                    <div className="relative z-10">
                        <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-white mb-4 shadow-lg">
                            <Download size={24} strokeWidth={2.5} />
                        </div>
                        <p className="text-[11px] font-black uppercase tracking-[0.2em] text-white/60 mb-2 font-mono">
                            {priceMode === 'accounting' ? 'Tổng Giá Kế Toán' : 'Tổng Doanh Thu'}
                        </p>
                        <h3 className="text-5xl font-black text-white tabular-nums tracking-tighter">
                            {overallTotals.total.toLocaleString()}
                            <span className="text-2xl ml-1 opacity-60">đ</span>
                        </h3>
                    </div>
                </m.div>
            </div>

            {/* Control Dashboard */}
            <m.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[#fdfdfb]/90 dark:bg-slate-900/90 backdrop-blur-2xl rounded-[3rem] border-2 border-emerald-50 dark:border-slate-800 shadow-2xl overflow-hidden mb-10 relative z-10"
            >
                {/* Mode Selector Bar */}
                <div className="flex flex-col lg:flex-row items-center border-b border-emerald-100/50 dark:border-slate-800">
                    <div className="flex p-3 gap-3 bg-emerald-50/30 dark:bg-black/20 w-full lg:w-fit">
                        <div className="flex bg-transparent p-1.5 rounded-full shadow-sm border border-emerald-100 dark:border-slate-700">
                            <button
                                onClick={() => { setViewMode('detail'); setSortBy('time'); }}
                                className={cn(
                                    "px-8 py-3 rounded-full text-[11px] font-black transition-all flex items-center gap-2 tracking-widest",
                                    viewMode === 'detail'
                                        ? "bg-[#2d5016] text-white shadow-lg shadow-emerald-900/30 scale-105"
                                        : "text-slate-400 hover:text-[#2d5016]"
                                )}
                            >
                                <FileText size={14} strokeWidth={2.5} />
                                CHI TIẾT
                            </button>
                            <button
                                onClick={() => { setViewMode('summary'); setSortBy('total'); }}
                                className={cn(
                                    "px-8 py-3 rounded-full text-[11px] font-black transition-all flex items-center gap-2 tracking-widest",
                                    viewMode === 'summary'
                                        ? "bg-[#2d5016] text-white shadow-lg shadow-emerald-900/30 scale-105"
                                        : "text-slate-400 hover:text-[#2d5016]"
                                )}
                            >
                                <Layers size={14} strokeWidth={2.5} />
                                TỔNG HỢP
                            </button>
                        </div>

                        {accountingEnabled && (
                            <div className="flex bg-transparent p-1.5 rounded-full shadow-sm border border-emerald-100 dark:border-slate-700">
                                <button
                                    onClick={() => setPriceMode('sale')}
                                    className={cn(
                                        "px-8 py-3 rounded-full text-[11px] font-black transition-all flex items-center gap-2 tracking-widest",
                                        priceMode === 'sale'
                                            ? "bg-emerald-50 text-emerald-700 border border-emerald-100 scale-105"
                                            : "text-slate-400 hover:text-emerald-600"
                                    )}
                                >
                                    <Tag size={14} strokeWidth={2.5} />
                                    GIÁ BÁN
                                </button>
                                <button
                                    onClick={() => setPriceMode('accounting')}
                                    className={cn(
                                        "px-8 py-3 rounded-full text-[11px] font-black transition-all flex items-center gap-2 tracking-widest",
                                        priceMode === 'accounting'
                                            ? "bg-amber-50 text-amber-700 border border-amber-100 scale-105"
                                            : "text-slate-400 hover:text-amber-600"
                                    )}
                                >
                                    <RefreshCcw size={14} strokeWidth={2.5} className="rotate-180" />
                                    KẾ TOÁN
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="flex-1 flex flex-wrap items-center gap-8 px-10 py-4">
                        <div className="group">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1.5 group-hover:text-emerald-500 transition-colors">Số Hóa Đơn</label>
                            <input
                                type="text"
                                value={manualInvoiceId}
                                onChange={(e) => setManualInvoiceId(e.target.value)}
                                className="bg-transparent border-2 border-slate-100 dark:border-slate-700 rounded-2xl text-slate-800 dark:text-white text-sm font-black py-2.5 px-5 shadow-inner focus:border-emerald-500/50 outline-none transition-all w-40"
                                placeholder="VD: 001"
                            />
                        </div>

                        <div className="group">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1.5 group-hover:text-emerald-500 transition-colors">Ngày In Lên Phôi</label>
                            <input
                                type="date"
                                value={manualInvoiceDate}
                                onChange={(e) => setManualInvoiceDate(e.target.value)}
                                className="bg-transparent border-2 border-slate-100 dark:border-slate-700 rounded-2xl text-slate-800 dark:text-white text-sm font-black py-2.5 px-5 shadow-inner focus:border-emerald-500/50 outline-none transition-all cursor-pointer"
                            />
                        </div>
                    </div>

                    <div className="p-4 pr-10 flex gap-4">
                        {accountingEnabled && (
                            <m.button
                                whileHover={{ scale: 1.02, y: -2 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={handleExportTemplate}
                                className="flex items-center gap-3 bg-slate-800 dark:bg-slate-700 text-white px-6 py-4 rounded-[1.5rem] text-[11px] font-black shadow-xl shadow-slate-900/20 hover:bg-slate-900 transition-all uppercase tracking-widest border border-white/10"
                            >
                                <FileSpreadsheet size={18} className="text-emerald-400" strokeWidth={2.5} />
                                PHÔI MAPPING
                            </m.button>
                        )}
                        <m.button
                            whileHover={{ scale: 1.02, y: -2 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleExport}
                            className="flex items-center gap-3 bg-[#2d5016] text-white px-8 py-4 rounded-[1.5rem] text-[11px] font-black shadow-xl shadow-emerald-900/30 hover:bg-[#1d350f] transition-all uppercase tracking-widest border border-white/10"
                        >
                            <Download size={18} strokeWidth={2.5} />
                            XUẤT EXCEL {viewMode === 'summary' ? 'TỔNG HỢP' : 'CHI TIẾT'}
                        </m.button>
                    </div>
                </div>

                <AnimatePresence>
                    {priceMode === 'accounting' && (
                        <m.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="bg-amber-50/30 dark:bg-amber-900/10 border-t border-amber-100/50 dark:border-amber-900/20 overflow-hidden"
                        >
                            <div className="p-6 px-10 flex flex-wrap items-center gap-12">
                                <div className="flex items-center gap-5">
                                    <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-2xl flex items-center justify-center text-amber-600 shadow-sm border border-amber-200/50">
                                        <Tag size={24} strokeWidth={2.5} />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-amber-600/60 uppercase tracking-[0.2em] mb-1.5">Lãi suất mục tiêu</label>
                                        <div className="flex items-center gap-3">
                                            <input
                                                type="number"
                                                value={targetProfit}
                                                onChange={(e) => setTargetProfit(e.target.value)}
                                                className="bg-transparent border-2 border-amber-200 dark:border-amber-900/30 rounded-xl text-amber-900 dark:text-amber-400 text-base font-black py-1.5 px-4 w-24 outline-none focus:border-amber-500 transition-all"
                                            />
                                            <span className="text-lg font-black text-amber-400">%</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-5">
                                    <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-2xl flex items-center justify-center text-amber-600 shadow-sm border border-amber-200/50">
                                        <ArrowUpDown size={24} strokeWidth={2.5} />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-amber-600/60 uppercase tracking-[0.2em] mb-1.5">Biến động (±)</label>
                                        <div className="flex items-center gap-3">
                                            <input
                                                type="number"
                                                value={profitVariance}
                                                onChange={(e) => setProfitVariance(e.target.value)}
                                                className="bg-transparent border-2 border-amber-200 dark:border-amber-900/30 rounded-xl text-amber-900 dark:text-amber-400 text-base font-black py-1.5 px-4 w-20 outline-none focus:border-amber-500 transition-all"
                                            />
                                            <span className="text-lg font-black text-amber-400">%</span>
                                        </div>
                                    </div>
                                </div>

                                <m.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => fetchData()}
                                    className="flex items-center gap-3 px-8 py-3 bg-amber-500 text-white rounded-2xl text-[11px] font-black shadow-xl shadow-amber-500/30 hover:bg-amber-600 transition-all uppercase tracking-widest ml-auto border border-white/20"
                                >
                                    <RefreshCcw size={16} strokeWidth={3} /> TẢI LẠI GIÁ
                                </m.button>
                            </div>
                        </m.div>
                    )}
                </AnimatePresence>
            </m.div>

            <div className="bg-[#fdfdfb] dark:bg-slate-900 border-2 border-emerald-50 dark:border-slate-800 rounded-[3rem] p-8 mb-10 shadow-2xl shadow-emerald-900/5 relative z-10">
                <div className="grid grid-cols-1 xl:grid-cols-4 gap-8 items-end">
                    <div className="xl:col-span-2 flex flex-col gap-3">
                        <label className="text-[12px] font-black uppercase tracking-widest text-[#2d5016]/40 dark:text-emerald-400/40 ml-1">Sản phẩm (Chọn hoặc Dán mã hàng loạt)</label>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <SearchableSelect
                                placeholder="Chọn từ danh sách..."
                                options={allProducts.map(p => ({ id: p.name, name: `${p.code ? '[' + p.code + '] ' : ''}${p.name}` }))}
                                value={detailedProductSelection}
                                onChange={(vals) => { setDetailedProductSelection(vals); setPage(1); }}
                                displayValue={item => item.name}
                                valueKey="id"
                                multiple={true}
                                className="flex-1"
                            />
                            <textarea
                                placeholder="Dán mã hàng (cách nhau bởi phẩy hoặc xuống dòng)..."
                                value={detailedProductSearch}
                                onChange={(e) => { setDetailedProductSearch(e.target.value); setPage(1); }}
                                className="bg-transparent border-2 border-emerald-100 dark:border-slate-700 rounded-2xl px-5 py-3 text-xs font-bold outline-none dark:text-white focus:border-[#2d5016] transition-all h-[52px] min-h-[52px] max-h-[150px] resize-y w-full sm:w-1/2 shadow-inner"
                            />
                        </div>
                    </div>

                    <div className="flex flex-col gap-3">
                        <label className="text-[12px] font-black uppercase tracking-widest text-[#2d5016]/40 dark:text-emerald-400/40 ml-1">Thương hiệu</label>
                        <SearchableSelect
                            placeholder="Tất cả hãng"
                            options={[{ id: '_no_brand_', name: '(Không có hãng)' }, ...brands.map(b => ({ id: b, name: b }))]}
                            value={detailedBrands}
                            onChange={(vals) => { setDetailedBrands(vals); setPage(1); }}
                            displayValue={item => item.name}
                            valueKey="id"
                            multiple={true}
                        />
                    </div>

                    <div className="flex items-end gap-4">
                        <div className="flex-1 flex flex-col gap-3">
                            <label className="text-[12px] font-black uppercase tracking-widest text-[#2d5016]/40 dark:text-emerald-400/40 ml-1">Phân loại</label>
                            <SearchableSelect
                                placeholder="Tất cả phân loại"
                                options={[{ id: '_no_category_', name: '(Chưa phân loại)' }, ...allCategories]}
                                value={detailedCategories}
                                onChange={(vals) => { setDetailedCategories(vals); setPage(1); }}
                                displayValue={item => item.name}
                                valueKey="id"
                                multiple={true}
                            />
                        </div>
                        <div className="flex flex-col gap-3">
                            <label className="text-[12px] font-black uppercase tracking-widest text-[#2d5016]/40 dark:text-emerald-400/40 ml-1">Tùy chọn</label>
                            <div className="flex items-center gap-3 h-[52px] px-5 bg-transparent border-2 border-emerald-100 dark:border-slate-700 rounded-2xl group cursor-pointer hover:border-[#2d5016] transition-all shadow-inner">
                                <input
                                    type="checkbox"
                                    id="hasCodeOnly"
                                    checked={hasCodeOnly}
                                    onChange={(e) => setHasCodeOnly(e.target.checked)}
                                    className="w-5 h-5 accent-[#2d5016] rounded-lg cursor-pointer"
                                />
                                <label htmlFor="hasCodeOnly" className="text-[11px] font-black text-slate-600 cursor-pointer select-none dark:text-slate-300 uppercase tracking-tighter">Chỉ hiện có mã</label>
                            </div>
                        </div>
                        <div className="w-24">
                            <label className="text-[12px] font-black uppercase tracking-widest text-[#2d5016]/40 dark:text-emerald-400/40 ml-1 mb-3 block opacity-0">Dòng</label>
                            <select
                                value={limit}
                                onChange={e => { setLimit(parseInt(e.target.value)); setPage(1); }}
                                className="w-full bg-transparent border-2 border-emerald-100 dark:border-slate-700 rounded-2xl h-[52px] px-3 text-sm font-black outline-none dark:text-emerald-400 focus:border-[#2d5016] transition-all cursor-pointer shadow-inner"
                            >
                                <option value={20}>20</option>
                                <option value={50}>50</option>
                                <option value={100}>100</option>
                                <option value={200}>200</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-[#fdfdfb]/90 dark:bg-slate-900/80 backdrop-blur-2xl rounded-[3.5rem] border-2 border-emerald-50 dark:border-slate-800 shadow-2xl overflow-hidden mb-12 relative z-10">
                <div className="overflow-x-auto no-scrollbar">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b-2 border-emerald-100/50 dark:border-slate-800 bg-[#2d5016]/5 dark:bg-black/20">
                                {viewMode === 'detail' && (
                                    <>
                                        <th className="p-8 text-[11px] font-black uppercase tracking-[0.2em] text-[#2d5016] dark:text-emerald-400 cursor-pointer hover:bg-emerald-100/50 dark:hover:bg-emerald-900/30 transition-all" onClick={() => handleSort('time')}>
                                            <div className="flex items-center gap-2">Thời gian <SortIcon field="time" /></div>
                                        </th>
                                        <th className="p-8 text-[11px] font-black uppercase tracking-[0.2em] text-[#2d5016] dark:text-emerald-400">Số hóa đơn</th>
                                    </>
                                )}
                                <th className="p-8 text-[11px] font-black uppercase tracking-[0.2em] text-[#2d5016] dark:text-emerald-400 cursor-pointer hover:bg-emerald-100/50 dark:hover:bg-emerald-900/30 transition-all" onClick={() => handleSort('code')}>
                                    <div className="flex items-center gap-2">Mã hàng <SortIcon field="code" /></div>
                                </th>
                                <th className="p-8 text-[11px] font-black uppercase tracking-[0.2em] text-[#2d5016] dark:text-emerald-400 cursor-pointer hover:bg-emerald-100/50 dark:hover:bg-emerald-900/30 transition-all" onClick={() => handleSort('product_name')}>
                                    <div className="flex items-center gap-2">Sản phẩm <SortIcon field="product_name" /></div>
                                </th>
                                <th className="p-8 text-[11px] font-black uppercase tracking-[0.2em] text-[#2d5016] dark:text-emerald-400">Hãng / Loại</th>
                                <th className="p-8 text-[11px] font-black uppercase tracking-[0.2em] text-[#2d5016] dark:text-emerald-400">ĐVT</th>
                                <th className="p-8 text-[11px] font-black uppercase tracking-[0.2em] text-[#2d5016] dark:text-emerald-400 text-right cursor-pointer hover:bg-emerald-100/50 dark:hover:bg-emerald-900/30 transition-all" onClick={() => handleSort('quantity')}>
                                    <div className="flex items-center gap-2 justify-end">{viewMode === 'summary' ? 'Tổng SL' : 'Số lượng'} <SortIcon field="quantity" /></div>
                                </th>
                                <th className="p-8 text-[11px] font-black uppercase tracking-[0.2em] text-[#2d5016] dark:text-emerald-400 text-right">
                                    {priceMode === 'accounting' ? 'Giá KT' : 'Đơn giá'}
                                </th>
                                {priceMode === 'accounting' && (
                                    <th className="p-8 text-[11px] font-black uppercase tracking-[0.2em] text-amber-600 text-right bg-amber-50/20 dark:bg-amber-900/20">
                                        Giá bán tính
                                    </th>
                                )}
                                <th className="p-8 text-[11px] font-black uppercase tracking-[0.2em] text-[#2d5016] dark:text-emerald-400 text-right cursor-pointer hover:bg-emerald-100/50 dark:hover:bg-emerald-900/30 transition-all" onClick={() => handleSort('total')}>
                                    <div className="flex items-center gap-2 justify-end">{viewMode === 'summary' ? 'Thành tiền' : 'Thành tiền'} <SortIcon field="total" /></div>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-emerald-100/30 dark:divide-slate-800/50">
                            <AnimatePresence mode="popLayout">
                                {sortedData.map((item, idx) => (
                                    <m.tr
                                        key={item.id || item.product_id || (viewMode === 'summary' ? `${item.code}-${idx}` : `${item.order_id}-${item.code}-${idx}`)}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.005 }}
                                        className={cn(
                                            "hover:bg-[#2d5016]/5 dark:hover:bg-[#2d5016]/10 transition-all group cursor-default",
                                            idx % 2 === 0 ? "bg-[#fdfdfb]/50 dark:bg-white/[0.01]" : ""
                                        )}
                                    >
                                        {viewMode === 'detail' && (
                                            <>
                                                <td className="p-8">
                                                    <span className="text-[13px] font-bold text-slate-400 group-hover:text-slate-600 dark:text-slate-500 dark:group-hover:text-slate-300 transition-colors tabular-nums">{item.time}</span>
                                                </td>
                                                <td className="p-8">
                                                    <div className="flex items-center gap-3">
                                                        <span className="px-4 py-1.5 bg-transparent text-[#2d5016] dark:text-emerald-400 rounded-xl text-[12px] font-black tracking-tighter border-2 border-emerald-100 dark:border-emerald-900/50 shadow-sm group-hover:border-[#2d5016] transition-all">
                                                            #{item.order_id}
                                                        </span>
                                                    </div>
                                                </td>
                                            </>
                                        )}
                                        <td className="p-8">
                                            <span className="text-[13px] font-black text-slate-500 dark:text-slate-400 tracking-wider bg-transparent/50 dark:bg-slate-800/50 px-3 py-1.5 rounded-xl border border-slate-200/50 dark:border-slate-700">{item.code || '---'}</span>
                                        </td>
                                        <td className="p-8">
                                            <div className="flex flex-col">
                                                <span className="text-[16px] font-black text-slate-800 dark:text-white uppercase leading-tight group-hover:text-[#2d5016] transition-all duration-300">{item.product_name}</span>
                                            </div>
                                        </td>
                                        <td className="p-8">
                                            <div className="flex flex-wrap gap-2 text-[10px] font-black uppercase tracking-widest">
                                                <span className="text-emerald-700 bg-emerald-50 dark:bg-emerald-900/30 px-3 py-1 rounded-full border border-emerald-100 dark:border-emerald-800/50 shadow-sm">{item.brand || 'Vô danh'}</span>
                                                <span className="text-blue-700 bg-blue-50 dark:bg-blue-900/30 px-3 py-1 rounded-full border border-blue-100 dark:border-blue-800/50 shadow-sm">{item.category_name}</span>
                                            </div>
                                        </td>
                                        <td className="p-8">
                                            <span className="text-[12px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{item.unit || '---'}</span>
                                        </td>
                                        <td className="p-8 text-right">
                                            <span className={cn(
                                                "text-[20px] font-black tabular-nums tracking-tighter",
                                                viewMode === 'summary' ? "text-[#2d5016] dark:text-emerald-400" : "text-slate-700 dark:text-white"
                                            )}>{item.quantity.toLocaleString()}</span>
                                        </td>
                                        <td className="p-8 text-right">
                                            <span className={cn(
                                                "text-[14px] font-bold tabular-nums opacity-60",
                                                priceMode === 'accounting' ? "text-amber-600 dark:text-amber-400 opacity-100" : "text-slate-400"
                                            )}>{item.retail_price?.toLocaleString()}đ</span>
                                        </td>
                                        {priceMode === 'accounting' && (
                                            <td className="p-8 text-right bg-amber-50/10 dark:bg-amber-900/10">
                                                <span className="text-[16px] font-black text-amber-600 dark:text-amber-400 tabular-nums">
                                                    {item.generated_price?.toLocaleString()}đ
                                                </span>
                                            </td>
                                        )}
                                        <td className="p-8 text-right">
                                            <span className={cn(
                                                "text-[20px] font-black tracking-tighter tabular-nums drop-shadow-sm",
                                                priceMode === 'accounting' ? "text-amber-600 dark:text-amber-400" : "text-[#2d5016] dark:text-emerald-400"
                                            )}>{item.total.toLocaleString()}đ</span>
                                        </td>
                                    </m.tr>
                                ))}
                            </AnimatePresence>
                            {data.length === 0 && (
                                <tr>
                                    <td colSpan="12" className="px-6 py-32 text-center">
                                        <div className="flex flex-col items-center gap-4 opacity-20">
                                            <Package size={64} className="text-slate-400" />
                                            <span className="text-sm font-black uppercase tracking-widest text-slate-500">Không có dữ liệu phù hợp</span>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                        {data.length > 0 && (
                            <tfoot className="relative border-t-4 border-[#2d5016]">
                                <tr className="bg-[#fdfdfb] dark:bg-black/20 backdrop-blur-xl group/total">
                                    <td colSpan={viewMode === 'detail' ? 6 : 4} className="p-10">
                                        <div className="flex flex-col gap-2">
                                            <span className="text-[11px] font-black text-[#2d5016]/40 dark:text-emerald-400/40 uppercase tracking-[0.5em]">QUYẾT TOÁN TRÊN TRANG</span>
                                            <span className="text-2xl font-black text-[#2d5016] dark:text-[#fdfdfb] uppercase tracking-tighter">TỔNG CỘNG TẠM TÍNH</span>
                                        </div>
                                    </td>
                                    <td className="p-10 text-right align-middle">
                                        <div className="inline-flex flex-col items-end">
                                            <span className="text-[11px] font-black text-emerald-600/60 uppercase tracking-widest mb-2">Sản lượng</span>
                                            <span className="text-[36px] font-black text-[#2d5016] dark:text-emerald-400 tabular-nums leading-none tracking-tighter drop-shadow-sm">
                                                {sortedData.reduce((sum, item) => sum + item.quantity, 0).toLocaleString()}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="p-10"></td>
                                    {priceMode === 'accounting' && <td className="p-10"></td>}
                                    <td className="p-0 text-right overflow-hidden relative group-hover/total:brightness-110 transition-all duration-500">
                                        <div className="absolute inset-0 bg-gradient-to-br from-[#2d5016] to-[#4a7c59]"></div>
                                        <div className="relative p-10 flex flex-col items-end gap-2">
                                            <span className="text-[11px] font-black text-emerald-100/60 uppercase tracking-widest leading-none">THÀNH TIỀN TRÊN TRANG</span>
                                            <div className="flex items-baseline gap-2">
                                                <span className="text-[42px] font-black text-white tabular-nums tracking-tighter drop-shadow-xl">
                                                    {sortedData.reduce((sum, item) => sum + item.total, 0).toLocaleString()}
                                                </span>
                                                <span className="text-[18px] font-black text-emerald-200 uppercase tracking-widest">đ</span>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            </tfoot>
                        )}
                    </table>
                </div>

                <div className="p-8 border-t-2 border-emerald-50 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-full border border-emerald-100 dark:border-emerald-800/50 shadow-sm">
                            <span className="text-xs font-bold text-slate-400">Hiển thị</span>
                            <span className="text-sm font-black text-[#2d5016] dark:text-emerald-400">{sortedData.length}</span>
                            <span className="text-xs font-bold text-slate-400">/</span>
                            <span className="text-sm font-black text-slate-600 dark:text-slate-300">{totalItems}</span>
                        </div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Mặt hàng được lọc</span>
                    </div>

                    <div className="flex items-center gap-3">
                        <m.button
                            whileHover={{ scale: 1.1, x: -5 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="w-12 h-12 flex items-center justify-center rounded-2xl bg-transparent text-slate-600 dark:text-white disabled:opacity-20 hover:text-[#2d5016] shadow-md border border-slate-100 dark:border-slate-700 transition-all"
                        >
                            <ChevronLeft size={24} strokeWidth={3} />
                        </m.button>

                        <div className="flex items-center gap-2 mx-4">
                            {[...Array(totalPages)].map((_, i) => {
                                const pNum = i + 1;
                                if (pNum === 1 || pNum === totalPages || (pNum >= page - 2 && pNum <= page + 2)) {
                                    return (
                                        <m.button
                                            key={pNum}
                                            whileHover={{ scale: 1.1, y: -2 }}
                                            whileTap={{ scale: 0.9 }}
                                            onClick={() => setPage(pNum)}
                                            className={cn(
                                                "w-12 h-12 rounded-2xl text-[12px] font-black transition-all border-2 shadow-sm",
                                                page === pNum
                                                    ? "bg-[#2d5016] text-white border-[#2d5016] shadow-xl shadow-emerald-900/30 scale-110"
                                                    : "bg-transparent border-slate-100 dark:border-slate-700 text-slate-400 hover:border-[#2d5016] hover:text-[#2d5016]"
                                            )}
                                        >
                                            {pNum}
                                        </m.button>
                                    );
                                }
                                if (pNum === page - 3 || pNum === page + 3) return <span key={pNum} className="px-2 text-slate-300 font-black">...</span>;
                                return null;
                            })}
                        </div>

                        <m.button
                            whileHover={{ scale: 1.1, x: 5 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                            className="w-12 h-12 flex items-center justify-center rounded-2xl bg-transparent text-slate-600 dark:text-white disabled:opacity-20 hover:text-[#2d5016] shadow-md border border-slate-100 dark:border-slate-700 transition-all"
                        >
                            <ChevronRight size={24} strokeWidth={3} />
                        </m.button>
                    </div>
                </div>
            </div>
        </div >
    );
}
