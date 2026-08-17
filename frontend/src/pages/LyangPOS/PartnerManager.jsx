import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useLocation } from 'react-router-dom';
import CustomSelect from '../../components/CustomSelect';
import { m, AnimatePresence } from 'framer-motion';
import { Plus, Edit2, Trash2, Search, Phone, MapPin, Tag, X, FileUp, Download, Users, ChevronUp, ChevronDown, ArrowUpDown, Droplets, Sprout, Wheat, CreditCard, FileText, ShoppingCart, Check } from 'lucide-react';
import { formatNumber, formatDebt } from '../../lib/utils';
import { cn } from '../../lib/utils';
import Toast from '../../components/Toast';
import PartnerEditModal from '../../components/PartnerEditModal';
import PartnerHistoryModal from '../../components/PartnerHistoryModal';
import ConfirmModal from '../../components/ConfirmModal';
import LoadingOverlay from '../../components/LoadingOverlay';
import Portal from '../../components/Portal';

const ThemeCheckbox = ({ checked, indeterminate, onChange, title, className }) => (
    <button
        type="button"
        role="checkbox"
        aria-checked={checked}
        title={title}
        onClick={(e) => {
            e.stopPropagation();
            onChange?.(e);
        }}
        className={cn(
            "w-4.5 h-4.5 rounded-[6px] border-2 flex items-center justify-center transition-all duration-200 cursor-pointer select-none outline-none shrink-0",
            checked
                ? "bg-gradient-to-br from-[#2d5016] to-[#4a7c59] border-[#2d5016] text-white shadow-sm shadow-[#2d5016]/30 scale-105"
                : indeterminate
                    ? "bg-[#2d5016]/15 border-[#4a7c59] text-[#2d5016]"
                    : "bg-white dark:bg-slate-800 border-[#d4a574]/40 hover:border-[#4a7c59] dark:border-slate-600 hover:scale-105 shadow-2xs",
            className
        )}
    >
        {checked && <Check size={12} strokeWidth={3.5} className="text-white" />}
        {!checked && indeterminate && <span className="w-2 h-0.5 bg-[#2d5016] dark:bg-emerald-400 rounded-full" />}
    </button>
);

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.02,
            ease: "easeOut"
        }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.4,
            ease: [0.22, 1, 0.36, 1]
        }
    }
};

export default function PartnerManager() {
    const [partners, setPartners] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPartner, setEditingPartner] = useState(null);
    const [historyPartner, setHistoryPartner] = useState(null);

    const location = useLocation();
    // Search states
    const [searchTerm, setSearchTerm] = useState(() => location.state?.search || localStorage.getItem('partner_searchTerm') || '');
    const [searchQuery, setSearchQuery] = useState(() => location.state?.search || localStorage.getItem('partner_searchQuery') || '');

    useEffect(() => {
        if (location.state?.search) {
            setSearchTerm(location.state.search);
            setSearchQuery(location.state.search);
        }
    }, [location.state]);

    const [filterType, setFilterType] = useState(() => localStorage.getItem('partner_filterType') || 'All');
    const [priceListPartner, setPriceListPartner] = useState(null);
    const [customPrices, setCustomPrices] = useState({});
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(() => Number(localStorage.getItem('partner_page')) || 1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [limit, setLimit] = useState(() => Number(localStorage.getItem('partner_limit')) || 20);
    const [toast, setToast] = useState(null);
    const [confirm, setConfirm] = useState(null); // { title, message, onConfirm, type }

    // Sorting state
    const [sortBy, setSortBy] = useState(() => localStorage.getItem('partner_sortBy') || 'name');
    const [sortOrder, setSortOrder] = useState(() => localStorage.getItem('partner_sortOrder') || 'asc');

    const [selectedIds, setSelectedIds] = useState([]);

    useEffect(() => {
        localStorage.setItem('partner_searchTerm', searchTerm || '');
        localStorage.setItem('partner_searchQuery', searchQuery || '');
        localStorage.setItem('partner_filterType', filterType || 'All');
        localStorage.setItem('partner_page', page.toString());
        localStorage.setItem('partner_limit', limit.toString());
        localStorage.setItem('partner_sortBy', sortBy || 'name');
        localStorage.setItem('partner_sortOrder', sortOrder || 'asc');
    }, [searchTerm, searchQuery, filterType, page, limit, sortBy, sortOrder]);

    useEffect(() => {
        fetchPartners();
    }, [page, limit, searchQuery, filterType, sortBy, sortOrder]);

    useEffect(() => {
        fetchProducts();

        // Data Sync Channel
        const syncChannel = new BroadcastChannel('pos_data_sync');
        syncChannel.onmessage = (e) => {
            if (e.data.type === 'PARTNER_UPDATED') {
                fetchPartners();
            }
        };

        return () => {
            syncChannel.close();
        };
    }, []);

    const fetchProducts = async () => {
        try {
            const res = await axios.get('/api/products');
            const sorted = res.data.sort((a, b) => (a.name || "").localeCompare(b.name || "", 'vi', { sensitivity: 'base' }));
            setProducts(sorted);
        } catch (err) { console.error(err); }
    };

    const fetchPartners = async () => {
        setLoading(true);
        try {
            const res = await axios.get('/api/partners', {
                params: {
                    search: searchQuery,
                    type: filterType,
                    page,
                    limit,
                    sort_by: sortBy,
                    sort_order: sortOrder
                }
            });
            if (res.data.items) {
                setPartners(res.data.items);
                setTotalPages(res.data.pages);
                setTotalItems(res.data.total);
            } else {
                setPartners(res.data);
                setTotalPages(1);
                setTotalItems(res.data.length);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const broadcastUpdate = () => {
        const syncChannel = new BroadcastChannel('pos_data_sync');
        syncChannel.postMessage({ type: 'PARTNER_UPDATED' });
        syncChannel.close();
    };

    const handlePartnerSaved = () => {
        fetchPartners();
        broadcastUpdate();
    };

    const handleSort = (field) => {
        if (sortBy === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(field);
            setSortOrder('desc');
        }
        setPage(1);
    };

    const SortIcon = ({ field }) => {
        if (sortBy !== field) return <ArrowUpDown size={13} className="ml-1 opacity-20" />;
        return sortOrder === 'asc' ? <ChevronUp size={13} className="ml-1 text-[#2d5016] dark:text-[#d4a574]" /> : <ChevronDown size={13} className="ml-1 text-[#2d5016] dark:text-[#d4a574]" />;
    };

    const handleSearchTrigger = () => {
        setSearchQuery(searchTerm);
        setPage(1);
    };

    const handleDelete = (id) => {
        setConfirm({
            title: "Xác nhận xóa đối tác",
            message: "Bạn có chắc chắn muốn xóa đối tác này? Toàn bộ lịch sử giao dịch sẽ bị ảnh hưởng.",
            onConfirm: async () => {
                try {
                    await axios.delete(`/api/partners/${id}`);
                    setToast({ message: "Đã xóa đối tác thành công", type: "success" });
                    fetchPartners();
                    broadcastUpdate();
                } catch (err) {
                    setToast({ message: err.response?.data?.error || "Lỗi khi xóa", type: "error" });
                }
                setConfirm(null);
            },
            type: "danger"
        });
    };

    const handleBulkDelete = () => {
        setConfirm({
            title: "Xóa đối tác hàng loạt",
            message: `Bạn có chắc chắn muốn xóa ${selectedIds.length} đối tác đã chọn?`,
            onConfirm: async () => {
                try {
                    const res = await axios.post('/api/partners/bulk-delete', { ids: selectedIds });
                    setToast({ message: res.data.message, type: "success" });
                    setSelectedIds([]);
                    fetchPartners();
                } catch (err) {
                    setToast({ message: err.response?.data?.error || "Lỗi khi xóa hàng loạt", type: "error" });
                }
                setConfirm(null);
            },
            type: "danger"
        });
    };

    const toggleSelect = (id) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    const toggleSelectAll = () => {
        const currentPageIds = partners.map(p => p.id);
        const isAllCurrentSelected = currentPageIds.length > 0 && currentPageIds.every(id => selectedIds.includes(id));
        if (isAllCurrentSelected) {
            setSelectedIds(prev => prev.filter(id => !currentPageIds.includes(id)));
        } else {
            setSelectedIds(prev => Array.from(new Set([...prev, ...currentPageIds])));
        }
    };

    const openAdd = () => {
        setEditingPartner(null);
        setIsModalOpen(true);
    }

    const openEdit = (p) => {
        setEditingPartner(p);
        setIsModalOpen(true);
    }

    const handleImport = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const fData = new FormData();
        fData.append('file', file);
        try {
            const res = await axios.post('/api/partners/import', fData);
            setToast({ message: res.data.message, type: "success" });
            fetchPartners();
        } catch (err) {
            setToast({ message: "Lỗi khi import danh sách đối tác", type: "error" });
        }
    };

    const handleDownloadTemplate = async () => {
        try {
            const res = await axios.get('/api/partners/template', { responseType: 'blob' });
            const { saveOrOpenFile } = await import('../../utils/downloadHelper');
            await saveOrOpenFile(res.data, 'mau_nhap_doi_tac.xlsx');
        } catch (err) {
            console.error("Template Download Error:", err);
            setToast({ message: "Không thể tải file mẫu nhập đối tác", type: "error" });
        }
    };

    const handleExportList = async () => {
        try {
            const res = await axios.get('/api/partners/export', { responseType: 'blob' });
            const { saveOrOpenFile } = await import('../../utils/downloadHelper');
            await saveOrOpenFile(res.data, 'danh_sach_doi_tac.xlsx');
        } catch (err) {
            console.error("Export List Error:", err);
            setToast({ message: "Không thể xuất danh sách đối tác", type: "error" });
        }
    };

    const openPriceList = async (partner) => {
        setPriceListPartner(partner);
        try {
            const res = await axios.get(`/api/custom-prices/${partner.id}`);
            setCustomPrices(res.data);
        } catch (err) { console.error(err); }
    }

    const handleSaveCustomPrice = async (productId, price) => {
        if (!priceListPartner) return;
        try {
            const res = await axios.post('/api/custom-prices', {
                partner_id: priceListPartner.id,
                product_id: productId,
                price: parseFloat(price) || 0
            });

            if (res.data.synced) {
                setCustomPrices(prev => {
                    const next = { ...prev };
                    delete next[productId];
                    return next;
                });
                setToast({ message: "Giá trùng giá mặc định - Đã tự động đồng bộ", type: "success" });
            } else {
                setCustomPrices(prev => ({ ...prev, [productId]: parseFloat(price) || 0 }));
            }
        } catch (err) {
            setToast({ message: "Lỗi khi lưu giá", type: "error" });
        }
    }

    const handleCleanupPrices = async () => {
        setConfirm({
            title: "Đồng bộ giá hệ thống",
            message: "Hệ thống sẽ xóa toàn bộ các 'giá riêng' của khách hàng nếu giá đó trùng với giá mặc định của sản phẩm. Bạn có muốn tiếp tục?",
            onConfirm: async () => {
                try {
                    const res = await axios.post('/api/custom-prices/cleanup');
                    setToast({
                        message: `Đã đồng bộ xong! Đã xóa ${res.data.deleted_count} mức giá trùng lặp.`,
                        type: "success"
                    });
                    if (priceListPartner) {
                        const resPrices = await axios.get(`/api/custom-prices/${priceListPartner.id}`);
                        setCustomPrices(resPrices.data);
                    }
                } catch (err) {
                    setToast({ message: "Lỗi khi đồng bộ giá", type: "error" });
                }
                setConfirm(null);
            },
            type: "warning"
        });
    }

    return (
        <m.div
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="pt-2 px-4 pb-8 space-y-6 w-full max-w-[1600px] mx-auto h-full flex flex-col gap-6 relative font-sans"
        >
            <m.div variants={itemVariants} className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shrink-0 relative z-10 px-4 md:px-0">
                <div className="flex items-center gap-4">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-black text-primary dark:text-[#d4a574] uppercase tracking-tight flex items-center gap-3 pt-2 pb-0.5 leading-relaxed">
                            <Users className="text-primary dark:text-[#d4a574]" size={32} />
                            Danh sách đối tác
                        </h1>
                        <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-black uppercase rounded-lg tracking-tighter">LyangPOS by Lyang</span>
                            <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                            <p className="text-[11px] font-bold text-gray-400 dark:text-gray-500">Quản lý khách hàng, nhà cung cấp và công nợ</p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap gap-2.5 w-full xl:w-auto relative z-10 items-center">
                    <AnimatePresence>
                        {selectedIds.length > 0 && (
                            <div className="flex items-center gap-2">
                                <m.button
                                    key="clear-select"
                                    initial={{ opacity: 0, scale: 0.9, x: 20 }}
                                    animate={{ opacity: 1, scale: 1, x: 0 }}
                                    exit={{ opacity: 0, scale: 0.9, x: 20 }}
                                    onClick={() => setSelectedIds([])}
                                    className="bg-[#faf8f3] dark:bg-slate-800 text-[#8b6f47] dark:text-[#d4a574] border border-[#d4a574]/40 hover:bg-[#d4a574]/15 hover:border-[#8b6f47] px-4 py-3 rounded-2xl flex items-center gap-1.5 transition-all font-black uppercase text-[10px] tracking-wider shadow-sm"
                                    title="Bỏ chọn tất cả các trang"
                                >
                                    <X size={14} /> Bỏ chọn ({selectedIds.length})
                                </m.button>
                                <m.button
                                    key="bulk-delete"
                                    initial={{ opacity: 0, scale: 0.9, x: 20 }}
                                    animate={{ opacity: 1, scale: 1, x: 0 }}
                                    exit={{ opacity: 0, scale: 0.9, x: 20 }}
                                    onClick={handleBulkDelete}
                                    className="bg-[#c84b31] hover:bg-[#b03e26] text-white px-4.5 py-3 rounded-2xl flex items-center gap-2 transition-all shadow-md shadow-[#c84b31]/25 hover:shadow-[#c84b31]/40 hover:scale-[1.02] font-black uppercase text-[10px] tracking-wider"
                                >
                                    <Trash2 size={15} strokeWidth={2.5} /> Xóa ({selectedIds.length})
                                </m.button>
                            </div>
                        )}
                    </AnimatePresence>
                    <div className="flex bg-[#faf8f3] dark:bg-slate-800/80 p-1 rounded-2xl border border-[#d4a574]/30 shadow-sm">
                        <button onClick={handleDownloadTemplate} className="px-3.5 py-2 text-[#8b6f47] dark:text-[#d4a574] rounded-xl flex items-center gap-1.5 hover:bg-[#d4a574]/15 transition-all font-black uppercase text-[10px] tracking-wider">
                            <Download size={15} /> Mẫu Excel
                        </button>
                        <button onClick={handleCleanupPrices} className="px-3.5 py-2 text-[#2d5016] dark:text-emerald-400 rounded-xl flex items-center gap-1.5 hover:bg-[#2d5016]/10 dark:hover:bg-emerald-950/40 transition-all font-black uppercase text-[10px] tracking-wider">
                            <Droplets size={15} /> Đồng bộ giá
                        </button>
                        <button onClick={handleExportList} className="px-3.5 py-2 text-[#2d5016] dark:text-emerald-400 rounded-xl flex items-center gap-1.5 hover:bg-[#2d5016]/10 dark:hover:bg-emerald-950/40 transition-all font-black uppercase text-[10px] tracking-wider">
                            <FileText size={15} /> Xuất Excel
                        </button>
                    </div>
                    <label className="bg-white dark:bg-slate-800 text-[#2d5016] dark:text-emerald-400 border border-[#d4a574]/40 hover:border-[#4a7c59] hover:bg-[#2d5016]/5 px-4.5 py-3 rounded-2xl flex items-center gap-2 transition-all font-black uppercase text-[10px] tracking-wider shadow-sm cursor-pointer">
                        <FileUp size={15} strokeWidth={2.5} /> Nhập Excel
                        <input type="file" className="hidden" accept=".xlsx, .xls" onChange={handleImport} />
                    </label>
                    <button onClick={openAdd} className="bg-gradient-to-r from-[#2d5016] to-[#4a7c59] text-white px-5 py-3 rounded-2xl flex items-center gap-2 transition-all shadow-md shadow-[#2d5016]/25 hover:shadow-[#2d5016]/40 hover:scale-[1.02] font-black uppercase text-[10px] tracking-wider">
                        <Plus size={16} strokeWidth={3} /> Thêm Đối Tác
                    </button>
                </div>
            </m.div>

            {/* Filter and Search Section */}
            <m.div variants={itemVariants} className="pos-card bg-transparent border border-border p-6 rounded-3xl flex flex-col xl:flex-row items-center justify-between gap-6 shadow-none shrink-0 relative z-10">
                <div className="flex-1 flex flex-col sm:flex-row gap-3 w-full xl:w-auto">
                    <div className="relative flex-1 max-w-md group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={18} />
                        <input
                            type="text"
                            placeholder="Tìm kiếm đối tác..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleSearchTrigger()}
                            className="w-full pl-11 pr-4 py-3 bg-transparent border border-border rounded-xl text-sm font-bold outline-none focus:border-primary dark:text-white transition-all shadow-none placeholder:text-gray-400 placeholder:font-medium"
                        />
                    </div>
                    <button onClick={handleSearchTrigger} className="bg-[#2d5016] hover:bg-[#1d350f] text-white px-6 py-3 rounded-2xl font-black uppercase text-xs transition-all shadow-sm flex items-center justify-center gap-2">
                        <Search size={14} /> Tìm đối tác
                    </button>
                    {searchQuery && <button onClick={() => { setSearchTerm(''); setSearchQuery(''); setPage(1); }} className="text-slate-450 hover:text-red-500 transition-colors p-2"><X size={20} /></button>}
                </div>
                <div className="flex flex-wrap items-center gap-4 w-full xl:w-auto justify-between sm:justify-end">
                    <div className="flex flex-col gap-1.5 min-w-[160px]">
                        <label className="text-[9px] font-black text-[#8b6f47] uppercase ml-1 tracking-widest">Loại đối tác</label>
                        <CustomSelect
                            className="w-full border border-border rounded-xl px-1 py-0.5"
                            value={filterType}
                            onChange={e => { setFilterType(e.target.value); setPage(1); }}
                            options={[
                                { value: 'All', label: 'Tất cả đối tác' },
                                { value: 'Customer', label: 'Khách hàng' },
                                { value: 'Supplier', label: 'Nhà cung cấp' },
                                { value: 'Both', label: 'Hợp tác X (Cả hai)' }
                            ]}
                        />
                    </div>
                    <div className="flex flex-col gap-1.5 min-w-[100px]">
                        <label className="text-[9px] font-black text-[#8b6f47] uppercase ml-1 tracking-widest">Số dòng</label>
                        <CustomSelect
                            className="w-full border border-border rounded-xl px-1 py-0.5"
                            value={limit}
                            onChange={e => { setLimit(parseInt(e.target.value)); setPage(1); }}
                            options={[
                                { value: 10, label: "10 mục" },
                                { value: 20, label: "20 mục" },
                                { value: 50, label: "50 mục" },
                                { value: 100, label: "100 mục" }
                            ]}
                        />
                    </div>
                </div>
            </m.div>

            {/* Partners Table Section */}
            <m.div variants={itemVariants} className="pos-card bg-transparent border border-border rounded-3xl shadow-none overflow-hidden relative z-10 flex-1 flex flex-col min-h-[300px]">
                <div className="overflow-x-auto flex-1">
                    <table className="w-full text-left border-collapse min-w-[900px]">
                        <thead className="bg-primary/5 border-b border-border text-[10px] font-black tracking-widest text-muted uppercase">
                            <tr>
                                <th className="p-5 w-12 text-center">
                                    <div className="flex items-center justify-center">
                                        <ThemeCheckbox
                                            checked={partners.length > 0 && partners.every(p => selectedIds.includes(p.id))}
                                            indeterminate={partners.some(p => selectedIds.includes(p.id)) && !partners.every(p => selectedIds.includes(p.id))}
                                            onChange={toggleSelectAll}
                                            title={partners.length > 0 && partners.every(p => selectedIds.includes(p.id)) ? "Bỏ chọn trang này" : "Chọn tất cả trang này"}
                                        />
                                    </div>
                                </th>
                                <th onClick={() => handleSort('id')} className="p-5 font-black text-[10px] uppercase tracking-widest text-muted cursor-pointer hover:text-primary transition-colors group w-24">
                                    <div className="flex items-center">ID <SortIcon field="id" /></div>
                                </th>
                                <th onClick={() => handleSort('type')} className="p-5 font-black text-[10px] uppercase tracking-widest text-muted cursor-pointer hover:text-primary transition-colors group w-36">
                                    <div className="flex items-center">Loại đối tác <SortIcon field="type" /></div>
                                </th>
                                <th onClick={() => handleSort('name')} className="p-5 font-black text-[10px] uppercase tracking-widest text-muted cursor-pointer hover:text-primary transition-colors group">
                                    <div className="flex items-center">Tên & CCCD <SortIcon field="name" /></div>
                                </th>
                                <th onClick={() => handleSort('phone')} className="p-5 font-black text-[10px] uppercase tracking-widest text-muted cursor-pointer hover:text-primary transition-colors group w-44">
                                    <div className="flex items-center">Số điện thoại <SortIcon field="phone" /></div>
                                </th>
                                <th onClick={() => handleSort('debt_balance')} className="p-5 font-black text-[10px] uppercase tracking-widest text-muted text-right cursor-pointer hover:text-primary transition-colors group w-48">
                                    <div className="flex items-center justify-end">Dư nợ chốt <SortIcon field="debt_balance" /></div>
                                </th>
                                <th className="p-5 font-black text-[10px] uppercase tracking-widest text-muted text-right w-44">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {loading ? (
                                <tr><td colSpan="7" className="p-20 text-center text-slate-400 font-bold animate-pulse">HỆ THỐNG ĐANG QUÉT DỮ LIỆU...</td></tr>
                            ) : partners.length > 0 ? (
                                partners.map((p, idx) => {
                                    const isSelected = selectedIds.includes(p.id);
                                    return (
                                        <tr
                                            key={p.id}
                                            className={cn(
                                                "hover:bg-[#2d5016]/5 dark:hover:bg-slate-800/40 transition-all duration-200 border-b border-border",
                                                isSelected ? "bg-emerald-50/30 dark:bg-emerald-950/20" : ""
                                            )}
                                        >
                                            <td 
                                                className="p-5 w-12 text-center"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <div className="flex items-center justify-center">
                                                    <ThemeCheckbox
                                                        checked={isSelected}
                                                        onChange={() => toggleSelect(p.id)}
                                                    />
                                                </div>
                                            </td>
                                            <td className="p-5">
                                                <span className="px-2.5 py-1 rounded-lg bg-primary/10 text-primary dark:bg-slate-800 dark:text-[#d4a574] text-xs font-black border border-border shadow-none">
                                                    #{p.id}
                                                </span>
                                            </td>
                                            <td className="p-5 uppercase text-[9px] font-black">
                                                <div className="flex flex-wrap gap-1">
                                                    {p.is_customer && <span className="px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 shadow-sm dark:bg-blue-900/30 dark:text-blue-300">Khách</span>}
                                                    {p.is_supplier && <span className="px-2.5 py-1 rounded-full bg-orange-100 text-orange-700 shadow-sm dark:bg-orange-900/30 dark:text-orange-300">NCC</span>}
                                                </div>
                                            </td>
                                            <td className="p-5 font-black uppercase text-sm dark:text-gray-100">
                                                <div className="text-slate-800 dark:text-slate-200">{p.name || '-'}</div>
                                                <div className="text-[10px] text-slate-400 flex items-center gap-1 font-bold mt-1 opacity-70"><CreditCard size={12} /> {p.cccd || 'CCCD chưa điền'}</div>
                                            </td>
                                            <td className="p-5 text-xs font-bold text-slate-600 dark:text-gray-400">{p.phone || '-'}</td>
                                            <td className={cn("p-5 text-right font-black uppercase text-xs tabular-nums", p.debt_balance > 0 ? "text-blue-600 dark:text-blue-400" : p.debt_balance < 0 ? "text-red-650 dark:text-red-400" : "text-slate-400 dark:text-slate-600")}>
                                                {formatDebt(p.debt_balance)}
                                            </td>
                                            <td className="p-4 text-right space-x-1">
                                                {p.is_customer && (
                                                    <button onClick={(e) => { e.stopPropagation(); openPriceList(p); }} className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-xl" title="Bảng giá riêng">
                                                        <Tag size={18} />
                                                    </button>
                                                )}
                                                <button onClick={(e) => { e.stopPropagation(); openEdit(p); }} className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl" title="Sửa đối tác">
                                                    <Edit2 size={18} />
                                                </button>
                                                <button onClick={(e) => { e.stopPropagation(); handleDelete(p.id); }} className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl" title="Xóa đối tác">
                                                    <Trash2 size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan="7" className="p-20 text-center text-slate-400 font-bold uppercase tracking-widest text-sm bg-transparent">
                                        Không tìm thấy đối tác phù hợp
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Footer */}
                <div className="p-6 bg-transparent border-t border-border flex flex-col md:flex-row justify-between items-center gap-6 shrink-0 z-20">
                    <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Hiển thị <span className="text-primary dark:text-[#d4a574] font-black">{(page - 1) * limit + 1} - {Math.min(page * limit, totalItems)}</span> trên tổng số <span className="text-primary dark:text-[#d4a574] font-black">{totalItems}</span> đối tác
                    </div>
                    <div className="flex items-center gap-1">
                        <button disabled={page === 1} onClick={() => setPage(p => Math.max(1, p - 1))} className="px-4 py-2 border border-border rounded-xl text-xs font-black uppercase tracking-widest disabled:opacity-30 hover:bg-primary/10 transition-all text-primary dark:text-white">Trước</button>
                        {[...Array(totalPages)].map((_, i) => {
                            const pNum = i + 1;
                            if (pNum === 1 || pNum === totalPages || (pNum >= page - 2 && pNum <= page + 2)) {
                                return (
                                    <button
                                        key={pNum}
                                        onClick={() => setPage(pNum)}
                                        className={cn(
                                            "w-10 h-10 rounded-xl text-xs font-black transition-all border",
                                            page === pNum
                                                ? "bg-primary text-white border-transparent shadow-none"
                                                : "hover:bg-primary/10 text-muted border-border"
                                        )}
                                    >
                                        {pNum}
                                    </button>
                                );
                            }
                            if (pNum === page - 3 || pNum === page + 3) return <span key={pNum} className="px-1 text-[#d4a574]">...</span>;
                            return null;
                        })}
                        <button disabled={page === totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))} className="px-4 py-2 border border-border rounded-xl text-xs font-black uppercase tracking-widest disabled:opacity-30 hover:bg-primary/10 transition-all text-primary dark:text-white">Sau</button>
                    </div>
                </div>
            </m.div>

            {/* Modals and Overlays */}
            <PartnerEditModal
                isOpen={isModalOpen}
                partner={editingPartner}
                onClose={() => setIsModalOpen(false)}
                onSave={handlePartnerSaved}
            />

            {/* Price list Modal */}
            <AnimatePresence>
                {priceListPartner && (
                    <Portal>
                        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[2000] p-4 backdrop-blur-sm">
                            <m.div
                                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                                className="bg-[#fdfdfb] dark:bg-[#0f172a] rounded-[2.5rem] shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden border-4 border-white dark:border-slate-800"
                            >
                                <div className="p-6 border-b border-emerald-100/20 dark:border-slate-800 flex justify-between items-center bg-[#2d5016]/5 dark:bg-slate-950/40">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#2d5016] to-[#4a7c59] flex items-center justify-center text-white shadow-sm shrink-0">
                                            <Tag size={18} className="text-white" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-black uppercase tracking-tight text-[#2d5016] dark:text-[#d4a574]">Bảng giá sỉ riêng</h3>
                                            <p className="text-[10px] text-[#8b6f47] dark:text-slate-400 font-bold uppercase tracking-wider mt-0.5">{priceListPartner.name}</p>
                                        </div>
                                    </div>
                                    <button onClick={() => setPriceListPartner(null)} className="w-9 h-9 rounded-xl bg-transparent flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors">
                                        <X size={20} />
                                    </button>
                                </div>
                                <div className="flex-1 overflow-auto p-6 space-y-4 custom-scrollbar">
                                    <table className="w-full text-left border-collapse">
                                        <thead className="text-[10px] font-black uppercase text-gray-400 tracking-widest border-b border-emerald-100/10 dark:border-slate-800 pb-3">
                                            <tr>
                                                <th className="pb-3">Tên sản phẩm</th>
                                                <th className="pb-3 text-right">Giá mặc định</th>
                                                <th className="pb-3 text-right w-40">Giá sỉ riêng (VNĐ)</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-emerald-50/20 dark:divide-slate-850">
                                            {products.map(prod => (
                                                <tr key={prod.id} className="hover:bg-[#2d5016]/5 dark:hover:bg-slate-800/40 transition-colors">
                                                    <td className="py-3 font-bold text-xs uppercase text-slate-800 dark:text-slate-200">{prod.name}</td>
                                                    <td className="py-3 text-right font-black text-slate-400 text-xs tabular-nums">{formatNumber(prod.sale_price)} đ</td>
                                                    <td className="py-3 text-right">
                                                        <input
                                                            type="text"
                                                            className="w-36 p-2 bg-[#faf9f6] dark:bg-slate-900 border-2 border-emerald-50 focus:border-[#2d5016] dark:border-slate-800 dark:focus:border-[#4a7c59] rounded-xl text-right font-black text-blue-600 outline-none text-xs"
                                                            value={formatNumber(customPrices[prod.id] !== undefined ? customPrices[prod.id] : '')}
                                                            onBlur={(e) => {
                                                                const val = parseFloat(e.target.value.replace(/,/g, ''));
                                                                if (!isNaN(val)) handleSaveCustomPrice(prod.id, val);
                                                            }}
                                                            onChange={(e) => {
                                                                const val = e.target.value.replace(/,/g, '');
                                                                if (!isNaN(parseFloat(val)) || val === '') {
                                                                    setCustomPrices(prev => ({ ...prev, [prod.id]: val }));
                                                                }
                                                            }}
                                                        />
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                <div className="p-6 bg-transparent dark:bg-slate-950/40 border-t border-emerald-100/20 dark:border-slate-800 text-right">
                                    <button onClick={() => setPriceListPartner(null)} className="px-6 py-3 bg-gradient-to-br from-[#2d5016] to-[#4a7c59] text-white rounded-xl font-black uppercase text-xs tracking-wider shadow-md">
                                        Đóng bảng giá
                                    </button>
                                </div>
                            </m.div>
                        </div>
                    </Portal>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {historyPartner && (
                    <PartnerHistoryModal
                        isOpen={!!historyPartner}
                        partner={historyPartner}
                        onClose={() => setHistoryPartner(null)}
                    />
                )}
            </AnimatePresence>

            <AnimatePresence>{toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}</AnimatePresence>

            {confirm && (
                <ConfirmModal
                    isOpen={!!confirm}
                    title={confirm.title}
                    message={confirm.message}
                    onConfirm={confirm.onConfirm}
                    onCancel={() => setConfirm(null)}
                    type={confirm.type}
                />
            )}

            <LoadingOverlay isVisible={loading && partners.length === 0} message="Đang nạp đối tác..." />
        </m.div >
    );
}
