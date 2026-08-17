import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useSearchParams, useLocation } from 'react-router-dom';
import axios from 'axios';
import CustomSelect from '../../components/CustomSelect';
import {
    Plus, Edit2, Edit3, Trash2, Search, FileDown, Upload, Package, X,
    ChevronUp, ChevronDown, ArrowUpDown, Wheat,
    FileText, Save, AlertTriangle, Clock, Boxes, Database, XCircle, Sparkles, Ban, Check,
    SprayCan, Sprout, Leaf, Droplets, FlaskConical, Bug, Hammer, Fuel, Truck, Archive, Layers, Tags, ShoppingCart
} from 'lucide-react';
import { formatNumber, isNearExpiry, isExpired, normalizeUOM, cn, removeAccents } from '../../lib/utils';
import { m, AnimatePresence } from 'framer-motion';
import ProductEditModal from '../../components/ProductEditModal';
import Toast from '../../components/Toast';
import ConfirmModal from '../../components/ConfirmModal';
import LoadingOverlay from '../../components/LoadingOverlay';
import QuickEditModal from '../../components/QuickEditModal';
import CategoryIcon from '../../components/CategoryIcon';
import { useQueryClient } from '@tanstack/react-query';

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
            staggerChildren: 0.05,
            delayChildren: 0.1,
            ease: [0.22, 1, 0.36, 1]
        }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.4
        }
    }
};

const StatsCard = ({ icon: Icon, title, value, colorClass, delay }) => (
    <m.div
        variants={itemVariants}
        initial="hidden"
        animate="visible"
        transition={{ delay }}
        whileHover={{ y: -4, scale: 1.01 }}
        className="flex-1 min-w-[240px] relative overflow-hidden p-6 rounded-2xl border border-border pos-card bg-transparent shadow-none group transition-all duration-300"
    >
        <div className={`absolute top-0 right-0 w-24 h-24 ${colorClass.bg} opacity-5 rounded-bl-full -mr-8 -mt-8`} />
        <div className="flex items-center justify-between">
            <div className="p-3.5 rounded-xl bg-primary/10 text-primary">
                <Icon size={22} />
            </div>
            <div className="text-right">
                <p className="text-[9px] font-black text-muted uppercase tracking-[0.15em]">{title}</p>
                <h3 className="text-2xl font-black text-foreground tracking-tight mt-1">
                    {formatNumber(value)} <span className="text-[10px] font-black text-muted uppercase">đơn vị</span>
                </h3>
            </div>
        </div>
    </m.div>
);


const COMMON_UNITS = ['Thùng', 'Két', 'Bao', 'Can', 'Ký', 'Lốc', 'Hộp', 'Gói', 'Xô', 'Chai', 'Bịch'];

const SecondaryStockCell = ({ product, onUpdate, onToast }) => {
    const queryClient = useQueryClient();
    const [isEditing, setIsEditing] = useState(false);
    const [isSettingUp, setIsSettingUp] = useState(false);
    const [loading, setLoading] = useState(false);
    const containerRef = useRef(null);
    const [coords, setCoords] = useState({ top: 0, left: 0 });

    const [editVal, setEditVal] = useState(0);
    const [newUnit, setNewUnit] = useState(product.secondary_unit || 'Thùng');
    const [newMultiplier, setNewMultiplier] = useState(product.multiplier || 1);

    const secondaryQty = product.multiplier > 0 ? (product.stock / product.multiplier) : 0;

    const updateCoords = () => {
        if (containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            setCoords({
                top: rect.top + window.scrollY,
                left: rect.left + window.scrollX,
                width: rect.width,
                height: rect.height,
                bottom: rect.bottom + window.scrollY
            });
        }
    };

    const handleOpenEdit = (e) => {
        e.stopPropagation();
        updateCoords();
        setEditVal(Math.round(secondaryQty * 100) / 100);
        setIsEditing(true);
    };

    const handleOpenSetup = (e) => {
        e.stopPropagation();
        updateCoords();
        setIsSettingUp(true);
    };

    const handleQuickStockUpdate = async () => {
        if (loading) return;
        setLoading(true);
        try {
            const newStock = Math.round(editVal * product.multiplier);
            await axios.put(`/api/products/${product.id}`, { ...product, stock: newStock });
            queryClient.invalidateQueries({ queryKey: ['products'] });
            onUpdate();
            setIsEditing(false);
            onToast({ message: "Đã cập nhật tồn kho!", type: "success" });
        } catch (err) {
            onToast({ message: "Lỗi cập nhật", type: "error" });
        } finally { setLoading(false); }
    };

    const handleSetupConversion = async () => {
        if (loading) return;
        if (!newUnit || newMultiplier <= 0) {
            onToast({ message: "Vui lòng nhập đủ thông tin", type: "warning" });
            return;
        }
        setLoading(true);
        try {
            await axios.put(`/api/products/${product.id}`, { ...product, secondary_unit: newUnit, multiplier: newMultiplier });
            queryClient.invalidateQueries({ queryKey: ['products'] });
            onUpdate();
            setIsSettingUp(false);
            onToast({ message: "Đã thiết lập quy đổi!", type: "success" });
        } catch (err) {
            onToast({ message: "Lỗi thiết lập", type: "error" });
        } finally { setLoading(false); }
    };

    const renderPopups = () => {
        if (isSettingUp) {
            return createPortal(
                <div className="absolute z-[9999]" style={{ top: coords.top, left: coords.left }}>
                    <m.div
                        initial={{ opacity: 0, scale: 0.9, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        className="absolute right-0 top-0 mt-2 p-4 bg-white dark:bg-slate-900 rounded-[28px] border-2 border-[#d4a574] shadow-2xl flex flex-col gap-3 min-w-[280px]"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-center px-1">
                            <span className="text-[10px] font-black uppercase text-[#8b6f47]">Thiết lập quy đổi</span>
                            <button onClick={() => setIsSettingUp(false)}><X size={16} /></button>
                        </div>
                        <CustomSelect
                            className="w-full border border-border rounded-xl"
                            value={newUnit}
                            onChange={e => setNewUnit(e.target.value)}
                            options={[
                                ...COMMON_UNITS.map(u => ({ value: u, label: u })),
                                { value: "Khác", label: "Khác..." }
                            ]}
                        />
                        {newUnit === 'Khác' && (
                            <input autoFocus className="w-full px-3 py-2 border-2 rounded-xl text-xs" placeholder="Nhập đơn vị..." onChange={e => setNewUnit(e.target.value)} />
                        )}
                        <div className="relative">
                            <input type="number" className="w-full pl-3 pr-10 py-2 border-2 rounded-xl text-xs font-bold" value={newMultiplier} onChange={e => setNewMultiplier(parseFloat(e.target.value) || 1)} />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-black text-[#4a7c59]">{normalizeUOM(product.unit)}</span>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={handleSetupConversion} className="flex-1 bg-[#4a7c59] text-white text-[10px] font-black py-2 rounded-lg">XÁC NHẬN</button>
                            <button onClick={() => setIsSettingUp(false)} className="px-3 bg-transparent text-gray-400 text-[10px] font-black rounded-lg">HỦY</button>
                        </div>
                    </m.div>
                </div>,
                document.body
            );
        }

        if (isEditing) {
            const isNearBottom = coords.top > window.innerHeight * 0.7;
            return createPortal(
                <div className="absolute z-[9999]" style={{ top: coords.top, left: coords.left }}>
                    <m.div
                        initial={{ opacity: 0, scale: 0.9, x: 10 }}
                        animate={{ opacity: 1, scale: 1, x: 0 }}
                        className={cn(
                            "absolute flex items-center gap-2 right-0",
                            isNearBottom ? "bottom-0" : "top-0"
                        )}
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="relative">
                            <input
                                autoFocus
                                type="number"
                                step="0.01"
                                className="w-24 px-4 py-2 bg-transparent border-3 border-[#4a7c59] rounded-2xl text-center font-black text-base shadow-xl outline-none"
                                value={editVal}
                                onChange={e => setEditVal(parseFloat(e.target.value) || 0)}
                                onKeyDown={e => e.key === 'Enter' && handleQuickStockUpdate()}
                            />
                            <div className="absolute -top-3 left-3 px-2 py-0.5 bg-[#4a7c59] text-white text-[8px] font-black rounded-lg shadow-sm">
                                {normalizeUOM(product.secondary_unit)}
                            </div>
                        </div>
                        <div className="flex flex-col gap-1">
                            <button onClick={handleQuickStockUpdate} className="p-1.5 bg-emerald-600 text-white rounded-lg shadow-md"><Save size={16} /></button>
                            <button onClick={() => setIsEditing(false)} className="p-1.5 bg-transparent text-gray-400 rounded-lg"><X size={16} /></button>
                        </div>
                    </m.div>
                </div>,
                document.body
            );
        }
        return null;
    };

    return (
        <div ref={containerRef} className="flex justify-end min-h-[40px] items-center">
            {product.secondary_unit ? (
                <div
                    onClick={handleOpenEdit}
                    className="group flex flex-col items-end px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-500/20 rounded-xl cursor-pointer hover:border-emerald-500 hover:shadow-md transition-all"
                >
                    <div className="flex items-baseline gap-1">
                        <span className="text-sm font-black text-emerald-600 dark:text-emerald-400 tabular-nums">{formatNumber(secondaryQty)}</span>
                        <span className="text-[9px] font-black text-gray-400 uppercase">{normalizeUOM(product.secondary_unit)}</span>
                    </div>
                </div>
            ) : (
                <button
                    onClick={handleOpenSetup}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#d4a574]/10 hover:bg-[#d4a574]/20 text-[#8b6f47] border border-dashed border-[#d4a574]/50 rounded-xl transition-all"
                >
                    <Plus size={12} strokeWidth={3} className="text-[#d4a574]" />
                    <span className="text-[10px] font-black uppercase tracking-tight">Quy đổi</span>
                </button>
            )}
            {renderPopups()}
        </div>
    );
};


export default function ProductManager() {
    const queryClient = useQueryClient();
    const [searchParams] = useSearchParams();
    const location = useLocation();
    
    const getAbsoluteUrl = (path) => {
        const savedIp = localStorage.getItem('server_ip');
        const baseUrl = axios.defaults.baseURL;
        return `${baseUrl}${path}`;
    };
    const [products, setProducts] = useState([]);
    const [summary, setSummary] = useState({
        total_products: 0,
        out_of_stock: 0,
        low_stock: 0,
        near_expiry: 0
    });
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);

    // Search states
    const [searchTerm, setSearchTerm] = useState(() => location.state?.search || '');
    const [searchQuery, setSearchQuery] = useState(() => location.state?.search || '');

    useEffect(() => {
        if (location.state?.search) {
            setSearchTerm(location.state.search);
            setSearchQuery(location.state.search);
        }
    }, [location.state]);

    const [selectedIds, setSelectedIds] = useState([]);

    // UI State Persistence
    const getInitialState = (key, defaultValue) => {
        const saved = localStorage.getItem(`pm_state_${key}`);
        if (saved) return saved;
        return defaultValue;
    };

    const [page, setPage] = useState(() => parseInt(getInitialState('page', '1')));
    const [limit, setLimit] = useState(() => parseInt(getInitialState('limit', '20')));
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [loading, setLoading] = useState(false);
    const [filterType, setFilterType] = useState(() => {
        const urlFilter = searchParams.get('filter');
        if (urlFilter) return urlFilter;
        return getInitialState('filter', 'all');
    });
    const [sortBy, setSortBy] = useState(() => getInitialState('sort_by', 'name'));
    const [sortOrder, setSortOrder] = useState(() => getInitialState('sort_order', 'asc'));

    const [brands, setBrands] = useState([]);
    const [categories, setCategories] = useState([]);
    const [selectedBrand, setSelectedBrand] = useState(() => getInitialState('brand', ''));
    const [selectedCategory, setSelectedCategory] = useState(() => getInitialState('category', ''));
    const [toast, setToast] = useState(null);
    const [confirm, setConfirm] = useState(null);
    const [isQuickEditOpen, setIsQuickEditOpen] = useState(false);
    const [allProductsForEdit, setAllProductsForEdit] = useState([]);

    // Save UI state whenever it changes
    useEffect(() => {
        localStorage.setItem('pm_state_page', page.toString());
        localStorage.setItem('pm_state_limit', limit.toString());
        localStorage.setItem('pm_state_filter', filterType);
        localStorage.setItem('pm_state_brand', selectedBrand);
        localStorage.setItem('pm_state_category', selectedCategory);
        localStorage.setItem('pm_state_sort_by', sortBy);
        localStorage.setItem('pm_state_sort_order', sortOrder);
    }, [page, limit, filterType, selectedBrand, sortBy, sortOrder]);

    const fileInputRef = React.useRef(null);

    useEffect(() => {
        fetchProducts();
        fetchSummary();
    }, [page, limit, searchQuery, filterType, sortBy, sortOrder, selectedBrand, selectedCategory]);

    useEffect(() => {
        setSelectedIds([]);
    }, [searchQuery, filterType, selectedBrand, selectedCategory]);

    const fetchSummary = async () => {
        try {
            const resp = await axios.get('/api/products/summary');
            setSummary(resp.data);
        } catch (err) { console.error(err); }
    };

    useEffect(() => {
        const filter = searchParams.get('filter');
        if (filter) {
            setFilterType(filter);
            if (filter === 'expired' || filter === 'near_expiry') setSortBy('expiry_date');
            else if (filter === 'out_of_stock' || filter === 'warning') setSortBy('stock');
            else if (filter === 'loss') setSortBy('sale_price');
            setSortOrder('asc');
        }
    }, [searchParams]);

    useEffect(() => {
        fetchBrands();
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const res = await axios.get('/api/categories');
            setCategories(res.data);
        } catch (err) { console.error(err); }
    };

    const fetchBrands = async () => {
        try {
            const res = await axios.get('/api/products/brands');
            setBrands(res.data);
        } catch (err) { console.error(err); }
    };

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const res = await axios.get('/api/products', {
                params: {
                    page,
                    limit,
                    search: searchQuery,
                    filterType: filterType,
                    sort_by: sortBy,
                    sort_order: sortOrder,
                    brand: selectedBrand,
                    category_id: selectedCategory,
                    include_inactive: true
                }
            });
            if (res.data.items) {
                setProducts(res.data.items);
                setTotalPages(res.data.pages);
                setTotalItems(res.data.total);
            } else {
                setProducts(res.data);
                setTotalPages(1);
                setTotalItems(res.data.length);
            }
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
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
        if (sortBy !== field) return <ArrowUpDown size={14} className="ml-1 opacity-20" />;
        return sortOrder === 'asc' ? <ChevronUp size={14} className="ml-1 text-[#4a7c59]" /> : <ChevronDown size={14} className="ml-1 text-[#4a7c59]" />;
    };

    const handleSearchTrigger = () => {
        setSearchQuery(searchTerm);
        setPage(1);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleSearchTrigger();
        }
    };

    const handleDelete = (id) => {
        setConfirm({
            title: "Xác nhận xóa",
            message: "Bạn có chắc chắn muốn xóa sản phẩm này? Thao tác này không thể hoàn tác.",
            onConfirm: async () => {
                try {
                    await axios.delete(`/api/products/${id}`);
                    queryClient.invalidateQueries({ queryKey: ['products'] });
                    fetchProducts();
                    setToast({ message: "Đã xóa sản phẩm thành công!", type: "success" });
                } catch (err) { setToast({ message: err.response?.data?.error || "Lỗi khi xóa", type: "error" }); }
                setConfirm(null);
            },
            type: "danger"
        });
    };

    const handleBulkDelete = () => {
        setConfirm({
            title: "Xóa hàng loạt",
            message: `Bạn có chắc chắn muốn xóa ${selectedIds.length} sản phẩm đã chọn?`,
            onConfirm: async () => {
                try {
                    const res = await axios.post('/api/products/bulk-delete', { ids: selectedIds });
                    setToast({ message: res.data.message, type: "success" });
                    queryClient.invalidateQueries({ queryKey: ['products'] });
                    setSelectedIds([]);
                    fetchProducts();
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

    const isCurrentPageAllSelected = products.length > 0 && products.every(p => selectedIds.includes(p.id));

    const toggleSelectAll = () => {
        if (isCurrentPageAllSelected) {
            const currentPageIds = new Set(products.map(p => p.id));
            setSelectedIds(prev => prev.filter(id => !currentPageIds.has(id)));
        } else {
            const currentPageIds = products.map(p => p.id);
            setSelectedIds(prev => Array.from(new Set([...prev, ...currentPageIds])));
        }
    };

    const handleBulkUpdate = async (bulkData) => {
        try {
            const res = await axios.post('/api/products/bulk-update', bulkData);
            setToast({ message: res.data.message, type: "success" });
            queryClient.invalidateQueries({ queryKey: ['products'] });
            fetchProducts();
            fetchSummary();
            setIsQuickEditOpen(false);
            setSelectedIds([]);
        } catch (err) {
            setToast({ message: err.response?.data?.error || "Lỗi cập nhật hàng loạt", type: "error" });
        }
    };

    const openQuickEdit = async () => {
        // Fetch ALL products for the dropdown in modal
        try {
            setLoading(true);
            const res = await axios.get('/api/products');
            setAllProductsForEdit(Array.isArray(res.data) ? res.data : res.data.items || []);
            setIsQuickEditOpen(true);
        } catch (err) {
            setToast({ message: "Không thể tải danh sách sản phẩm", type: "error" });
        } finally {
            setLoading(false);
        }
    };

    const openEdit = (prod) => {
        setEditingProduct(prod);
        setIsModalOpen(true);
    }

    const openAdd = () => {
        setEditingProduct(null);
        setIsModalOpen(true);
    }

    const handleImport = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const formDataImport = new FormData();
        formDataImport.append('file', file);
        try {
            const res = await axios.post('/api/products/import', formDataImport);
            setToast({ message: res.data.message, type: "success" });
            queryClient.invalidateQueries({ queryKey: ['products'] });
            fetchProducts();
        } catch (err) { setToast({ message: err.response?.data?.error || "Lỗi khi nhập file", type: "error" }); }
        e.target.value = '';
    };

    const handleDownloadTemplate = async () => {
        try {
            const res = await axios.get('/api/products/template', { responseType: 'blob' });
            const { saveOrOpenFile } = await import('../../utils/downloadHelper');
            await saveOrOpenFile(res.data, 'mau_nhap_kho.xlsx');
        } catch (err) {
            console.error("Template Download Error:", err);
            setToast({ message: "Không thể tải file mẫu", type: "error" });
        }
    };

    const handleExportList = async () => {
        try {
            const res = await axios.get('/api/products/export', { responseType: 'blob' });
            const { saveOrOpenFile } = await import('../../utils/downloadHelper');
            await saveOrOpenFile(res.data, 'danh_sach_san_pham.xlsx');
        } catch (err) {
            console.error("Export List Error:", err);
            setToast({ message: "Không thể xuất danh sách sản phẩm", type: "error" });
        }
    };

    return (
        <m.div
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="pt-2 px-4 pb-20 w-full transition-colors"
        >
            <div className="flex-1 flex flex-col overflow-hidden">
                <div className="flex flex-col gap-8 mb-4">
                <m.div variants={itemVariants} className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 px-4 md:px-0">
                    <div className="flex items-center gap-5">
                        <div>
                            <h1 className="text-3xl md:text-4xl font-black text-[#2d5016] dark:text-[#4a7c59] uppercase tracking-tight flex items-center gap-3 pt-2 pb-0.5 leading-relaxed">
                                <Package className="text-[#2d5016] dark:text-[#4a7c59]" size={32} />
                                Danh Mục Sản Phẩm
                            </h1>
                            <div className="flex items-center gap-2">
                                <span className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-black uppercase rounded-lg tracking-tighter">LyangPOS by Lyang</span>
                                <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                                <p className="text-[11px] font-bold text-gray-400 dark:text-gray-500">Dữ liệu thời gian thực</p>
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-2.5">
                        <AnimatePresence>
                            {selectedIds.length > 0 && (
                                <div className="flex gap-2 items-center">
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
                                    <m.button
                                        key="bulk-edit"
                                        initial={{ opacity: 0, scale: 0.9, x: 20 }}
                                        animate={{ opacity: 1, scale: 1, x: 0 }}
                                        exit={{ opacity: 0, scale: 0.9, x: 20 }}
                                        onClick={openQuickEdit}
                                        className="bg-gradient-to-r from-[#2d5016] to-[#4a7c59] text-white px-5 py-3 rounded-2xl flex items-center gap-2 transition-all shadow-md shadow-[#2d5016]/25 hover:shadow-[#2d5016]/40 hover:scale-[1.02] font-black uppercase text-[10px] tracking-wider"
                                    >
                                        <Sparkles size={15} strokeWidth={2.5} /> SỬA NHANH ({selectedIds.length})
                                    </m.button>
                                </div>
                            )}
                        </AnimatePresence>
                        <div className="flex bg-[#faf8f3] dark:bg-slate-800/80 p-1 rounded-2xl border border-[#d4a574]/30 shadow-sm">
                            <button onClick={handleDownloadTemplate} className="px-3.5 py-2 text-[#8b6f47] dark:text-[#d4a574] rounded-xl flex items-center gap-1.5 hover:bg-[#d4a574]/15 transition-all font-black uppercase text-[10px] tracking-wider">
                                <FileDown size={15} /> Mẫu Excel
                            </button>
                            <button onClick={handleExportList} className="px-3.5 py-2 text-[#2d5016] dark:text-emerald-400 rounded-xl flex items-center gap-1.5 hover:bg-[#2d5016]/10 dark:hover:bg-emerald-950/40 transition-all font-black uppercase text-[10px] tracking-wider">
                                <FileText size={15} /> Xuất DS
                            </button>
                        </div>
                        <label className="bg-white dark:bg-slate-800 text-[#2d5016] dark:text-emerald-400 border border-[#d4a574]/40 hover:border-[#4a7c59] hover:bg-[#2d5016]/5 px-4.5 py-3 rounded-2xl flex items-center gap-2 transition-all font-black uppercase text-[10px] tracking-wider shadow-sm cursor-pointer">
                            <Upload size={15} strokeWidth={2.5} /> Nhập Kho
                            <input type="file" ref={fileInputRef} className="hidden" accept=".xlsx, .xls" onChange={handleImport} />
                        </label>
                        <button onClick={openAdd} className="bg-gradient-to-r from-[#2d5016] to-[#4a7c59] text-white px-5 py-3 rounded-2xl flex items-center gap-2 transition-all shadow-md shadow-[#2d5016]/25 hover:shadow-[#2d5016]/40 hover:scale-[1.02] font-black uppercase text-[10px] tracking-wider">
                            <Plus size={16} strokeWidth={3} /> Thêm Mới
                        </button>
                    </div>
                </m.div>

                {/* STATS BAR ROW */}
                <div className="flex flex-wrap gap-4">
                    <StatsCard
                        icon={Package}
                        title="Tất cả hàng hóa"
                        value={summary.total_products}
                        colorClass={{ bg: 'bg-emerald-500', text: 'text-emerald-600' }}
                        delay={0.1}
                    />
                    <StatsCard
                        icon={AlertTriangle}
                        title="Đã hết hàng"
                        value={summary.out_of_stock}
                        colorClass={{ bg: 'bg-red-500', text: 'text-red-600' }}
                        delay={0.2}
                    />
                    <StatsCard
                        icon={Boxes}
                        title="Sắp hết hàng"
                        value={summary.low_stock}
                        colorClass={{ bg: 'bg-amber-500', text: 'text-amber-600' }}
                        delay={0.3}
                    />
                    <StatsCard
                        icon={Clock}
                        title="Sắp hết hạn"
                        value={summary.near_expiry}
                        colorClass={{ bg: 'bg-indigo-500', text: 'text-indigo-600' }}
                        delay={0.4}
                    />
                </div>
            </div>

            <m.div variants={itemVariants} className="pos-card bg-transparent border border-border p-6 rounded-3xl flex flex-col gap-6 shadow-none">
                {/* Row 1: Search & Filter Config */}
                <div className="flex flex-col xl:flex-row gap-6 items-start xl:items-center justify-between">
                    <div className="flex flex-1 gap-3 w-full max-w-2xl">
                        <div className="relative flex-1 group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={20} />
                            <input
                                type="text"
                                placeholder="Tìm theo tên, mã sản phẩm hoặc hoạt chất..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleSearchTrigger()}
                                className="w-full pl-12 pr-4 py-3 bg-transparent border border-border rounded-xl text-sm font-bold outline-none focus:border-primary dark:text-white transition-all shadow-none placeholder:text-gray-400 placeholder:font-medium"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => { setSearchTerm(''); setSearchQuery(''); setPage(1); }}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 transition-colors"
                                    title="Xóa tìm kiếm"
                                >
                                    <X size={18} />
                                </button>
                            )}
                        </div>
                        <button
                            onClick={handleSearchTrigger}
                            className="bg-primary hover:bg-primary-hover text-white px-6 py-3 rounded-xl font-black uppercase text-xs transition-all shadow-none flex items-center gap-2"
                        >
                            <Search size={16} strokeWidth={3} /> Tìm Kiếm
                        </button>
                    </div>

                    <div className="flex flex-wrap gap-4 w-full xl:w-auto items-center">
                        <div className="flex flex-col gap-1.5 min-w-[160px]">
                            <label className="text-[9px] font-black text-[#8b6f47] uppercase ml-1 tracking-widest">Trạng thái</label>
                            <CustomSelect
                                className="w-full border border-border rounded-xl px-1 py-0.5"
                                value={filterType}
                                onChange={e => { setFilterType(e.target.value); setPage(1); }}
                                options={[
                                    { value: 'all', label: 'Tất cả' },
                                    { value: 'safe', label: 'Sẵn sàng' },
                                    { value: 'warning', label: 'Cần nhập' },
                                    { value: 'out_of_stock', label: 'Hết hàng' },
                                    { value: 'expired', label: 'Hết hạn' },
                                    { value: 'near_expiry', label: 'Sắp hết hạn' },
                                    { value: 'inactive', label: 'Ngừng TD' },
                                    { value: 'loss', label: 'Bán lỗ' },
                                    { value: 'unused', label: 'Chưa bán' }
                                ]}
                            />
                        </div>
                        <div className="flex flex-col gap-1.5 min-w-[160px]">
                            <label className="text-[9px] font-black text-[#8b6f47] uppercase ml-1 tracking-widest">Thương hiệu</label>
                            <CustomSelect
                                className="w-full border border-border rounded-xl px-1 py-0.5"
                                value={selectedBrand}
                                onChange={e => { setSelectedBrand(e.target.value); setPage(1); }}
                                options={[
                                    { value: "", label: "Tất cả các hãng" },
                                    ...brands.map(b => ({ value: b, label: b }))
                                ]}
                            />
                        </div>
                        <div className="flex flex-col gap-1.5 min-w-[160px]">
                            <label className="text-[9px] font-black text-[#8b6f47] uppercase ml-1 tracking-widest">Loại hàng</label>
                            <CustomSelect
                                className="w-full border border-border rounded-xl px-1 py-0.5"
                                value={selectedCategory}
                                onChange={e => { setSelectedCategory(e.target.value); setPage(1); }}
                                options={[
                                    { value: "", label: "Tất cả các loại" },
                                    ...categories.map(c => ({ value: String(c.id), label: c.name }))
                                ]}
                            />
                        </div>
                        <div className="flex flex-col gap-1.5 min-w-[100px]">
                            <label className="text-[9px] font-black text-[#8b6f47] uppercase ml-1 tracking-widest">Số dòng</label>
                            <CustomSelect
                                className="w-full border border-border rounded-xl px-1 py-0.5"
                                value={limit}
                                onChange={e => { setLimit(parseInt(e.target.value)); setPage(1); }}
                                options={[10, 20, 50, 100].map(v => ({ value: v, label: `${v} mục` }))}
                            />
                        </div>
                    </div>
                </div>
            </m.div>


            <m.div variants={itemVariants} className="pos-card bg-transparent border border-border rounded-3xl shadow-none overflow-hidden relative mt-6">
                <AnimatePresence mode="wait">
                    <m.div
                        key={`${filterType}-${selectedBrand}-${searchQuery}`}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                    >
                        <div className="overflow-hidden">
                            <table className="w-full text-left border-collapse table-auto">
                                <thead className="bg-primary/5 border-b border-border text-[10px] font-black tracking-widest text-muted uppercase sticky top-0 z-20">
                                    <tr>
                                        <th className="p-3 w-12 text-center">
                                            <div className="flex items-center justify-center">
                                                <ThemeCheckbox
                                                    checked={products.length > 0 && products.every(p => selectedIds.includes(p.id))}
                                                    indeterminate={products.some(p => selectedIds.includes(p.id)) && !products.every(p => selectedIds.includes(p.id))}
                                                    onChange={toggleSelectAll}
                                                    title={products.length > 0 && products.every(p => selectedIds.includes(p.id)) ? "Bỏ chọn trang này" : "Chọn tất cả trang này"}
                                                />
                                            </div>
                                        </th>
                                        <th onClick={() => handleSort('code')} className="p-3 w-28 font-black uppercase text-[12px] text-gray-400 cursor-pointer hover:text-[#4a7c59] transition-colors tracking-widest text-center">MÃ HÀNG</th>
                                        <th onClick={() => handleSort('name')} className="p-3 min-w-[150px] font-black uppercase text-[12px] text-gray-400 cursor-pointer hover:text-[#4a7c59] transition-colors tracking-widest text-left">SẢN PHẨM</th>
                                        <th className="p-3 hidden lg:table-cell font-black uppercase text-[12px] text-gray-400 tracking-widest">HÃNG</th>
                                        <th className="p-3 hidden xl:table-cell font-black uppercase text-[12px] text-gray-400 tracking-widest">HOẠT CHẤT</th>
                                        <th className="p-3 w-12 font-black uppercase text-[12px] text-gray-400 text-center tracking-widest">ĐVT</th>
                                        <th onClick={() => handleSort('cost_price')} className="p-3 w-28 hidden md:table-cell font-black uppercase text-[12px] text-gray-400 text-right cursor-pointer hover:text-[#4a7c59] transition-colors tracking-widest">GIÁ VỐN</th>
                                        <th onClick={() => handleSort('sale_price')} className="p-3 w-28 font-black uppercase text-[12px] text-gray-400 text-right cursor-pointer hover:text-[#4a7c59] transition-colors tracking-widest">GIÁ BÁN</th>
                                        <th onClick={() => handleSort('stock')} className="p-3 w-24 font-black uppercase text-[12px] text-gray-400 text-right cursor-pointer hover:text-[#4a7c59] transition-colors tracking-widest">TỒN</th>
                                        <th className="p-3 w-32 hidden md:table-cell font-black uppercase text-[12px] text-gray-400 text-right tracking-widest">TỒN PHỤ</th>
                                        <th onClick={() => handleSort('expiry_date')} className="p-3 w-28 hidden sm:table-cell font-black uppercase text-[12px] text-gray-400 text-right cursor-pointer hover:text-[#4a7c59] transition-colors tracking-widest">HẠN DÙNG</th>
                                        <th className="p-3 w-12 font-black uppercase text-[12px] text-gray-400 text-right tracking-widest">CHỈNH</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y dark:divide-slate-800">
                                    <AnimatePresence mode="popLayout">
                                        {products.map((p, idx) => {
                                            const threshold = Number(p.min_stock) > 0 ? Number(p.min_stock) : (Number(p.multiplier) || 1);
                                            const isLowStock = p.stock > 0 && p.stock <= threshold;
                                            const expired = isExpired(p.expiry_date);
                                            const nearExp = isNearExpiry(p.expiry_date);
                                            const isSelected = selectedIds.includes(p.id);
                                            return (
                                                <m.tr
                                                    key={p.id}
                                                    initial={{ opacity: 0, y: 4 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: idx * 0.02 }}
                                                    onDoubleClick={() => openEdit(p)}
                                                    className={cn(
                                                        "group transition-all duration-300 cursor-pointer border-b border-[#d4a574]/5",
                                                        isSelected ? "bg-[#d4a574]/10 dark:bg-[#4a7c59]/10" : "hover:bg-[#faf8f3] dark:hover:bg-slate-800/40",
                                                        !p.is_active && "opacity-50 grayscale-[0.3]"
                                                    )}
                                                >
                                                    <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                                                        <div className="flex items-center justify-center">
                                                            <ThemeCheckbox
                                                                checked={isSelected}
                                                                onChange={() => toggleSelect(p.id)}
                                                            />
                                                        </div>
                                                    </td>
                                                    <td className="p-3 text-center text-[12px] font-black text-[#8b6f47] group-hover:text-[#4a7c59] tabular-nums">
                                                        {p.code || `ID:${p.id}`}
                                                    </td>
                                                    <td className="p-3">
                                                        <div className="flex flex-col max-w-[240px] sm:max-w-xs">
                                                            <div className="flex items-center gap-2">
                                                                {p.category_icon && (
                                                                    <div className="p-1 px-2 bg-emerald-50 dark:bg-emerald-900/40 rounded-lg text-[#2d5016] dark:text-emerald-400">
                                                                        <CategoryIcon name={p.category_icon} size={14} />
                                                                    </div>
                                                                )}
                                                                <span className="font-black text-[14px] text-gray-800 dark:text-gray-100 uppercase break-words leading-tight group-hover:text-[#4a7c59] transition-all duration-300" title={p.name}>{p.name}</span>
                                                            </div>
                                                            {isLowStock && p.is_active && (
                                                                <div className="flex items-center gap-1.5 mt-1.5" title={`Tồn kho (${p.stock}) ≤ Mức cảnh báo (${threshold})`}>
                                                                    <span className="flex h-1.5 w-1.5 rounded-full bg-amber-500 animate-ping" />
                                                                    <span className="text-[10px] text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/30 px-2 py-0.5 rounded-full font-black uppercase tracking-tighter border border-amber-200 dark:border-amber-700/50 flex items-center gap-1">
                                                                        <AlertTriangle size={11} className="text-amber-600 dark:text-amber-400 shrink-0" />
                                                                        <span>Cần nhập (≤{threshold})</span>
                                                                    </span>
                                                                </div>
                                                            )}
                                                            {!p.is_active && (
                                                                <div className="flex items-center gap-1.5 mt-1.5">
                                                                    <span className="flex h-1.5 w-1.5 rounded-full bg-slate-400" />
                                                                    <span className="text-[10px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 px-2 py-0.5 rounded-full font-black uppercase tracking-tighter border border-slate-200 dark:border-slate-700 flex items-center gap-1">
                                                                        <Ban size={11} className="text-slate-400 shrink-0" />
                                                                        <span>Ngừng theo dõi</span>
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="p-3 hidden lg:table-cell">
                                                        <span className="text-[11.5px] font-bold text-gray-500 bg-transparent/50 dark:bg-slate-800 px-2 py-1 rounded border border-gray-200/50 break-words leading-tight block max-w-[100px]">{p.brand || '---'}</span>
                                                    </td>
                                                    <td className="p-3 hidden xl:table-cell">
                                                        <span className="text-[11.5px] font-bold text-gray-400 italic break-words leading-tight block max-w-[120px]" title={p.active_ingredient}>{p.active_ingredient || '-'}</span>
                                                    </td>
                                                    <td className="p-3 text-center font-black text-[12px] text-[#8b6f47]">{normalizeUOM(p.unit)}</td>
                                                    <td className="p-3 text-right font-black text-[14px] tabular-nums text-gray-500 hidden md:table-cell">{formatNumber(p.cost_price)}</td>
                                                    <td className="p-3 text-right font-black text-[14px] tabular-nums text-[#2d5016] dark:text-emerald-400">{formatNumber(p.sale_price)}</td>
                                                    <td className="p-3 text-right">
                                                        <div className="flex items-center justify-end">
                                                            <div className={cn(
                                                                "flex items-center px-3 py-1.5 rounded-2xl border-2 transition-transform duration-300 group-hover:scale-110 shadow-sm font-black tabular-nums text-[14px]",
                                                                p.stock <= 0 ? "bg-rose-50 border-rose-200 text-rose-600 dark:bg-rose-900/30 dark:border-rose-800 dark:text-rose-300" :
                                                                    isLowStock ? "bg-amber-50 border-amber-200 text-amber-600 dark:bg-amber-900/30 dark:border-amber-800 dark:text-amber-300" :
                                                                        "bg-emerald-50 border-emerald-200/50 text-[#2d5016] dark:bg-emerald-900/30 dark:text-emerald-300"
                                                            )} title={isLowStock ? `Tồn kho: ${p.stock} (Mức cảnh báo: ${threshold})` : `Tồn kho: ${p.stock}`}>
                                                                <Boxes size={14} className="mr-2 opacity-60" />
                                                                {p.stock}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="p-3 text-right hidden md:table-cell"><SecondaryStockCell product={p} onUpdate={fetchProducts} onToast={setToast} /></td>
                                                    <td className="p-3 text-right hidden sm:table-cell">
                                                        <div className={cn(
                                                            "inline-block px-3 py-1 rounded-full border-2 text-[12px] font-black tabular-nums transition-all",
                                                            expired ? "bg-rose-600 border-rose-500 text-white shadow-lg shadow-rose-200" :
                                                                nearExp ? "bg-amber-50 border-amber-200 text-amber-600 p-2" :
                                                                    "border-transparent text-gray-400"
                                                        )}>
                                                            {expired && <AlertTriangle size={12} className="inline mr-1 -mt-0.5" />}
                                                            {p.expiry_date || '---'}
                                                        </div>
                                                    </td>
                                                    <td className="p-3 text-right">
                                                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100">
                                                            <button onClick={() => openEdit(p)} className="p-1 text-[#2d5016] hover:bg-[#2d5016]/10 rounded shadow-sm bg-transparent"><Edit3 size={13} /></button>
                                                            <button onClick={() => handleDelete(p.id)} className="p-1 text-rose-600 hover:bg-rose-50 rounded shadow-sm bg-transparent"><Trash2 size={13} /></button>
                                                        </div>
                                                    </td>
                                                </m.tr>
                                            );
                                        })}
                                    </AnimatePresence>
                                </tbody>
                            </table>
                        </div>
                        {products.length === 0 && <div className="p-20 text-center text-gray-500 font-bold uppercase tracking-widest text-sm">Không tìm thấy sản phẩm nào phù hợp.</div>}

                        <div className="p-4 bg-gradient-to-r from-[#faf8f3]/50 to-[#f5f1e8]/50 dark:bg-[#2d5016]/5 border-t-2 border-[#d4a574]/20 flex flex-col md:flex-row justify-between items-center gap-4">
                            <div className="text-sm font-bold text-[#8b6f47]">
                                Hiển thị <span className="text-[#2d5016] dark:text-white">{(page - 1) * limit + 1} - {Math.min(page * limit, totalItems)}</span> trên tổng số <span className="text-[#2d5016] dark:text-white">{totalItems}</span> sản phẩm
                            </div>
                            <div className="flex items-center gap-1.5">
                                <button disabled={page === 1} onClick={() => setPage(p => Math.max(1, p - 1))} className="px-5 py-2.5 border-2 border-[#d4a574]/30 rounded-2xl text-[10px] font-black uppercase tracking-widest disabled:opacity-30 hover:bg-[#d4a574]/10 transition-all text-[#2d5016] dark:text-white">Trước</button>
                                {[...Array(totalPages)].map((_, i) => {
                                    const pNum = i + 1;
                                    if (pNum === 1 || pNum === totalPages || (pNum >= page - 2 && pNum <= page + 2)) {
                                        return <button key={pNum} onClick={() => setPage(pNum)} className={cn("w-10 h-10 rounded-2xl text-xs font-black transition-all", page === pNum ? "bg-gradient-to-r from-[#2d5016] to-[#4a7c59] text-white shadow-lg shadow-[#2d5016]/30 border-0" : "hover:bg-[#d4a574]/10 text-[#8b6f47] dark:text-[#d4a574]/60 border-2 border-[#d4a574]/30")}>{pNum}</button>;
                                    }
                                    if (pNum === page - 3 || pNum === page + 3) return <span key={pNum} className="px-1 text-[#d4a574]">...</span>;
                                    return null;
                                })}
                                <button disabled={page === totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))} className="px-5 py-2.5 border-2 border-[#d4a574]/30 rounded-2xl text-[10px] font-black uppercase tracking-widest disabled:opacity-30 hover:bg-[#d4a574]/10 transition-all text-[#2d5016] dark:text-white">Sau</button>
                            </div>
                        </div>
                    </m.div>
                </AnimatePresence>
            </m.div>
        </div>

            <ProductEditModal
                isOpen={isModalOpen}
                product={editingProduct}
                onClose={() => setIsModalOpen(false)}
                onSave={fetchProducts}
            />

            <AnimatePresence>
                <QuickEditModal
                    isOpen={isQuickEditOpen}
                    onClose={() => setIsQuickEditOpen(false)}
                    allProducts={allProductsForEdit}
                    categories={categories}
                    selectedProductIds={selectedIds}
                    onSave={handleBulkUpdate}
                />

                {toast && (
                    <Toast
                        message={toast.message}
                        type={toast.type}
                        onClose={() => setToast(null)}
                    />
                )}
            </AnimatePresence>

            {
                confirm && (
                    <ConfirmModal
                        isOpen={!!confirm}
                        title={confirm.title}
                        message={confirm.message}
                        onConfirm={confirm.onConfirm}
                        onCancel={() => setConfirm(null)}
                        type={confirm.type}
                    />
                )
            }

            <LoadingOverlay isVisible={loading && products.length === 0} message="Đang kiểm kho..." />
        </m.div>
    );
}

