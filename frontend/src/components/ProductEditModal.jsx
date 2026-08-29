import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { m } from 'framer-motion';
import { Trash2, X, Plus, Save, Package, Layers, CircleDollarSign, Boxes, ShieldAlert, AlertTriangle, FileText } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import { formatNumber, normalizeUOM, cn } from '../lib/utils';
import Toast from './Toast';
import Portal from './Portal';
import { useQueryClient } from '@tanstack/react-query';

const PRIMARY_UNITS_SUGGESTIONS = ['Chai', 'Hộp', 'Viên', 'Gói', 'Tuýp', 'Lọ', 'Bịch', 'Can', 'Ký', 'Cái'];
const SECONDARY_UNITS_SUGGESTIONS = ['Thùng', 'Lốc', 'Két', 'Kiện', 'Bao', 'Hộp', 'Lít'];
const COMMON_UNITS = [...new Set([...PRIMARY_UNITS_SUGGESTIONS, ...SECONDARY_UNITS_SUGGESTIONS])];

const NumberInput = ({ value, onChange, placeholder, className, ...props }) => {
    const [displayVal, setDisplayVal] = useState('');
    useEffect(() => {
        if (value !== undefined && value !== null) {
            setDisplayVal(formatNumber(value));
        }
    }, [value]);
    const handleChange = (e) => {
        const val = e.target.value.replace(/,/g, '');
        if (!isNaN(val)) {
            onChange(val === '' ? 0 : parseFloat(val));
            setDisplayVal(val === '' ? '' : formatNumber(val));
        }
    };
    return (
        <input
            type="text"
            value={displayVal}
            onChange={handleChange}
            placeholder={placeholder}
            className={`input-premium ${className}`}
            autoComplete="off"
            {...props}
        />
    )
}

export default function ProductEditModal({ product, isOpen, onClose, onSave }) {
    const queryClient = useQueryClient();
    const DEFAULT_PRODUCT = {
        name: '', code: '', unit: 'Cái', secondary_unit: '', multiplier: 1,
        cost_price: 0, sale_price: 0, stock: 0, min_stock: 0, expiry_date: '',
        active_ingredient: '',
        brand: '',
        is_combo: false, is_active: true, combo_items: [],
        category_id: null,
        accounting_price: 0,
        accounting_stock: 0,
        bulk_quantity: '',
        bulk_price: '',
        alias: ''
    };

    const [formData, setFormData] = useState(DEFAULT_PRODUCT);
    const [toast, setToast] = useState(null);
    const [allProducts, setAllProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [brandsList, setBrandsList] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [accountingEnabled, setAccountingEnabled] = useState(localStorage.getItem('feature_accounting_enabled') !== 'false');
    const [activeTab, setActiveTab] = useState('basic');

    const [dropdownActiveIndex, setDropdownActiveIndex] = useState(-1);
    const dropdownListRef = useRef(null);

    const filteredDropdownProducts = allProducts.filter(p => 
        !p.is_combo && (
            p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
            (p.code && p.code.toLowerCase().includes(searchQuery.toLowerCase()))
        )
    );

    useEffect(() => {
        setDropdownActiveIndex(-1);
    }, [searchQuery]);

    useEffect(() => {
        if (dropdownActiveIndex >= 0 && dropdownListRef.current) {
            const container = dropdownListRef.current;
            const children = container.children;
            if (children && children[dropdownActiveIndex]) {
                const activeChild = children[dropdownActiveIndex];
                const containerTop = container.scrollTop;
                const containerBottom = containerTop + container.clientHeight;
                const elemTop = activeChild.offsetTop;
                const elemBottom = elemTop + activeChild.offsetHeight;
                
                if (elemTop < containerTop) {
                    container.scrollTop = elemTop;
                } else if (elemBottom > containerBottom) {
                    container.scrollTop = elemBottom - container.clientHeight;
                }
            }
        }
    }, [dropdownActiveIndex]);

    const handleSearchInputKeyDown = (e) => {
        if (filteredDropdownProducts.length === 0) return;
        
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setDropdownActiveIndex(prev => (prev < filteredDropdownProducts.length - 1 ? prev + 1 : prev));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setDropdownActiveIndex(prev => (prev > 0 ? prev - 1 : 0));
        } else if (e.key === 'Enter') {
            e.preventDefault();
            const activeItem = filteredDropdownProducts[dropdownActiveIndex >= 0 ? dropdownActiveIndex : 0];
            if (activeItem) {
                if (!formData.combo_items.some(i => i.product_id === activeItem.id)) {
                    setFormData(prev => ({
                        ...prev,
                        combo_items: [...prev.combo_items, { product_id: activeItem.id, quantity: 1, unit: activeItem.unit }]
                    }));
                }
                setSearchQuery('');
                setDropdownActiveIndex(-1);
            }
        } else if (e.key === 'Escape') {
            setSearchQuery('');
            setDropdownActiveIndex(-1);
        }
    };

    // Reset form data when the modal opens or when the product changes
    useEffect(() => {
        if (isOpen) {
            if (product) {
                setFormData({
                    ...DEFAULT_PRODUCT,
                    ...product,
                    combo_items: product.combo_items || []
                });
            } else {
                setFormData(DEFAULT_PRODUCT);
            }
        }
    }, [isOpen, product?.id, product?.code, product?.name]);

    const fetchBrandsDirectory = async () => {
        try {
            const res = await axios.get('/api/settings');
            if (res.data.brands_directory) {
                const brands = res.data.brands_directory.split(',').map(b => b.trim()).filter(b => b);
                setBrandsList(brands);
            } else {
                setBrandsList([]);
            }
        } catch (err) {
            console.error("Lỗi khi tải danh mục hãng:", err);
            setBrandsList([]);
        }
    };

    useEffect(() => {
        if (isOpen) {
            fetchCategories();
            fetchBrandsDirectory();
            if (formData.is_combo) fetchProducts();
        }
    }, [isOpen, formData.is_combo]);

    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };
        const handleStorage = () => {
            setAccountingEnabled(localStorage.getItem('feature_accounting_enabled') !== 'false');
        };
        window.addEventListener('keydown', handleEsc);
        window.addEventListener('storage', handleStorage);
        return () => {
            window.removeEventListener('keydown', handleEsc);
            window.removeEventListener('storage', handleStorage);
        };
    }, [isOpen, onClose]);

    useEffect(() => {
        if (formData.is_combo && formData.combo_items.length > 0 && allProducts.length > 0) {
            let totalCost = 0;
            let stocks = [];
            formData.combo_items.forEach(item => {
                const p = allProducts.find(prod => prod.id === item.product_id);
                if (p) {
                    totalCost += (p.cost_price || 0) * (item.quantity || 0);
                    stocks.push(Math.floor((p.stock || 0) / (item.quantity || 1)));
                }
            });
            setFormData(prev => ({
                ...prev,
                cost_price: totalCost,
                stock: stocks.length > 0 ? Math.min(...stocks) : 0
            }));
        }
    }, [formData.combo_items, formData.is_combo, allProducts]);

    const fetchCategories = async () => {
        try {
            const res = await axios.get('/api/categories');
            setCategories(res.data);
        } catch (err) { console.error(err); }
    };

    const fetchProducts = async () => {
        try {
            const res = await axios.get('/api/products');
            // Handle both array and paginated object response
            let data = res.data;
            if (data.items && Array.isArray(data.items)) {
                data = data.items;
            }

            if (Array.isArray(data)) {
                const sorted = data.sort((a, b) => (a.name || "").localeCompare(b.name || "", 'vi', { sensitivity: 'base' }));
                setAllProducts(sorted);
            } else {
                console.error("Invalid products data format", data);
                setAllProducts([]);
            }
        } catch (err) { console.error(err); }
    };

    const saveProduct = async (data) => {
        if (product?.id) {
            await axios.put(`/api/products/${product.id}`, data);
        } else {
            await axios.post('/api/products', data);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await saveProduct(formData);
            queryClient.invalidateQueries({ queryKey: ['products'] });
            onSave();
            onClose();
        } catch (err) {
            console.error(err);
            setToast({ message: err.response?.data?.error || "Lỗi khi lưu sản phẩm.", type: "error" });
        }
    };

    const handleSaveAndContinue = async (e) => {
        e.preventDefault();
        if (!formData.name) {
            setToast({ message: "Vui lòng nhập tên sản phẩm", type: "error" });
            return;
        }

        try {
            await saveProduct(formData);
            queryClient.invalidateQueries({ queryKey: ['products'] });
            onSave();
            setFormData({
                name: '', code: '', unit: 'Cái', secondary_unit: '', multiplier: 1,
                cost_price: 0, sale_price: 0, stock: 0, min_stock: 0, expiry_date: '',
                active_ingredient: '',
                brand: '',
                is_combo: false, is_active: true, combo_items: [],
                category_id: null,
                accounting_price: 0,
                accounting_stock: 0,
                bulk_quantity: '',
                bulk_price: '',
                alias: ''
            });
            setTimeout(() => document.getElementById('prod-name-input')?.focus(), 100);
            setToast({ message: "Đã lưu sản phẩm!", type: "success" });
        } catch (err) {
            console.error(err);
            setToast({ message: err.response?.data?.error || "Lỗi khi lưu sản phẩm.", type: "error" });
        }
    };

    return (
        <Portal>
            <AnimatePresence>
                {isOpen && (
                    <div className="fixed inset-0 z-[500000] flex items-center justify-center p-4 overflow-y-auto bg-slate-950/70 backdrop-blur-sm android-webview">
                        <m.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0"
                            onClick={onClose}
                        />
                        <m.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                            className="bg-card text-foreground w-full max-w-4xl rounded-3xl border border-border shadow-2xl backdrop-blur-xl flex flex-col relative z-10 overflow-hidden max-h-[95vh]"
                        >
                            {/* Header */}
                            <m.div 
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="p-4 px-5 flex items-center justify-between border-b border-border bg-card/60 shrink-0"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20">
                                        <Save size={20} className="text-primary" />
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                        <h3 className="text-base font-bold text-foreground uppercase tracking-wide leading-relaxed py-1 truncate max-w-[400px]" title={product?.id ? `Chỉnh Sửa: ${product.name}` : 'Thêm Mới'}>
                                            {product?.id ? `Chỉnh Sửa: ${product.name || ''}` : 'Thêm Mới'}
                                        </h3>
                                        <p className="text-muted-foreground text-[10px] font-medium uppercase tracking-widest mt-0.5">Chi tiết sản phẩm</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center p-1 bg-black/5 dark:bg-white/5 rounded-2xl border border-border gap-1">
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, is_active: true })}
                                            className={cn(
                                                "px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all tracking-wider",
                                                formData.is_active 
                                                    ? "bg-primary text-white shadow-md shadow-primary/20" 
                                                    : "text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5"
                                            )}
                                        >
                                            Đang bán
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, is_active: false })}
                                            className={cn(
                                                "px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all tracking-wider",
                                                !formData.is_active 
                                                    ? "bg-rose-600 text-white shadow-md shadow-rose-600/20" 
                                                    : "text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5"
                                            )}
                                        >
                                            Ngừng bán
                                        </button>
                                    </div>
                                    <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg bg-transparent hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors">
                                        <X size={16} strokeWidth={2.5} />
                                    </button>
                                </div>
                            </m.div>

                            {/* Horizontal Tabs */}
                            <div className="flex space-x-2 border-b-2 border-border mb-6 mt-2 px-5">
                                <button type="button" onClick={() => setActiveTab('basic')} className={cn("px-6 py-3 font-black text-[11px] uppercase tracking-widest border-b-2 -mb-[2px] transition-all flex items-center gap-2", activeTab === 'basic' ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground")}>
                                    <Package size={16} /> Cơ bản
                                </button>
                                <button type="button" onClick={() => setActiveTab('stock')} className={cn("px-6 py-3 font-black text-[11px] uppercase tracking-widest border-b-2 -mb-[2px] transition-all flex items-center gap-2", activeTab === 'stock' ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground")}>
                                    <Layers size={16} /> Kho & Đơn vị
                                </button>

                                {formData.is_combo && (
                                    <button type="button" onClick={() => setActiveTab('combo')} className={cn("px-6 py-3 font-black text-[11px] uppercase tracking-widest border-b-2 -mb-[2px] transition-all flex items-center gap-2", activeTab === 'combo' ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground")}>
                                        <Boxes size={16} /> Combo
                                    </button>
                                )}
                            </div>

                            <form onSubmit={handleSubmit} className="flex-1 overflow-hidden flex flex-col" id="product-edit-form">
                                <div className="h-[60vh] min-h-[500px] flex-1 overflow-y-auto overflow-x-hidden px-5 custom-scrollbar">
                                    <AnimatePresence mode="wait">
                                        {activeTab === 'basic' && (
                                            <m.div key="basic" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="space-y-6">
                                                <div className="grid grid-cols-12 gap-6 bg-card/40 p-6 rounded-2xl border border-border">
                                                    <div className="col-span-8">
                                                        <label className="block text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2 ml-1">Tên sản phẩm</label>
                                                        <input required id="prod-name-input" type="text" className="input-premium w-full p-3 font-black text-sm border border-border focus:border-primary" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} onKeyDown={e => e.key === 'Enter' && handleSubmit(e)} autoComplete="off" />
                                                    </div>
                                                    <div className="col-span-4">
                                                        <label className="block text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2 ml-1">Mã SP</label>
                                                        <input type="text" className="input-premium w-full p-3 font-black text-sm border border-border focus:border-primary" value={formData.code || ''} onChange={e => setFormData({ ...formData, code: e.target.value })} onKeyDown={e => e.key === 'Enter' && handleSubmit(e)} autoComplete="off" placeholder="Tự động..." />
                                                    </div>

                                                    <div className="col-span-12">
                                                         <label className="block text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2 ml-1">Alias đọc âm thanh (TTS)</label>
                                                         <input type="text" className="input-premium w-full p-3 font-bold text-sm border border-border focus:border-primary" value={formData.alias || ''} onChange={e => setFormData({ ...formData, alias: e.target.value })} onKeyDown={e => e.key === 'Enter' && handleSubmit(e)} autoComplete="off" placeholder="Tên đọc tắt phát âm thanh... VD: diệt côn trùng" />
                                                    </div>

                                                    <div className="col-span-12 border-t border-border my-2"></div>

                                                    <div className="col-span-6 relative group">
                                                        <label className="absolute -top-3 left-4 px-2 bg-card text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest z-10 rounded-full border border-amber-500/20">Giá nhập (Vốn)</label>
                                                        <div className="relative">
                                                            <NumberInput disabled={formData.is_combo} className="w-full p-4 font-black text-lg text-foreground bg-amber-500/10 border-2 border-amber-500/20 focus:border-amber-500 disabled:opacity-50 transition-all rounded-2xl" value={formData.cost_price} onChange={val => setFormData({ ...formData, cost_price: val })} onKeyDown={(e) => e.key === 'Enter' && handleSubmit(e)} />
                                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-amber-600/60 dark:text-amber-400/60">VNĐ</div>
                                                        </div>
                                                    </div>
                                                    <div className="col-span-6 relative group">
                                                        <label className="absolute -top-3 left-4 px-2 bg-card text-[10px] font-black text-primary uppercase tracking-widest z-10 rounded-full border border-primary/20">Giá bán hiện tại</label>
                                                        <div className="relative">
                                                            <NumberInput className="w-full p-4 font-black text-xl text-primary bg-primary/10 border-2 border-primary/20 focus:border-primary transition-all rounded-2xl shadow-sm" value={formData.sale_price} onChange={val => setFormData({ ...formData, sale_price: val })} onKeyDown={(e) => e.key === 'Enter' && handleSubmit(e)} />
                                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-primary/60">VNĐ</div>
                                                        </div>
                                                    </div>

                                                    {formData.cost_price > formData.sale_price && formData.sale_price > 0 && (
                                                        <div className="col-span-12 p-3 bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/30 rounded-2xl flex items-center gap-2 text-amber-700 dark:text-amber-300 animate-in fade-in slide-in-from-top-1 text-xs font-bold">
                                                            <AlertTriangle size={18} className="text-amber-600 shrink-0" />
                                                            <span>Giá nhập ({formatNumber(formData.cost_price)} đ) đang cao hơn giá bán hiện tại ({formatNumber(formData.sale_price)} đ)!</span>
                                                        </div>
                                                    )}
                                                    
                                                    <div className="col-span-6 relative group">
                                                        <label className="absolute -top-3 left-4 px-2 bg-card text-[10px] font-black text-muted-foreground uppercase tracking-widest z-10 rounded-full border border-border">SL đạt giá sỉ</label>
                                                        <NumberInput className="w-full p-4 font-black text-sm border-2 border-border focus:border-primary rounded-2xl bg-card/50" value={formData.bulk_quantity} onChange={val => setFormData({ ...formData, bulk_quantity: val })} placeholder="VD: 5" />
                                                    </div>
                                                    <div className="col-span-6 relative group">
                                                        <label className="absolute -top-3 left-4 px-2 bg-card text-[10px] font-black text-emerald-500 uppercase tracking-widest z-10 rounded-full border border-emerald-500/20">Giá sỉ</label>
                                                        <div className="relative">
                                                            <NumberInput className="w-full p-4 font-black text-lg text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-2 border-emerald-500/20 focus:border-emerald-500 rounded-2xl" value={formData.bulk_price} onChange={val => setFormData({ ...formData, bulk_price: val })} placeholder="VD: 100,000" />
                                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-emerald-600/60 dark:text-emerald-400/60">VNĐ</div>
                                                        </div>
                                                    </div>

                                                    <div className="col-span-12 border-t border-border my-2"></div>

                                                    <div className="col-span-6">
                                                        <label className="block text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2 ml-1">Phân loại</label>
                                                        <select className="input-premium w-full p-3 font-bold text-sm border border-border focus:border-primary" value={formData.category_id || ''} onChange={e => setFormData({ ...formData, category_id: e.target.value || null })}>
                                                            <option value="">-- Chưa phân loại --</option>
                                                            {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                                                        </select>
                                                    </div>
                                                    <div className="col-span-6">
                                                        <label className="block text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2 ml-1">Hãng</label>
                                                        <select className="input-premium w-full p-3 font-bold text-sm border border-border focus:border-primary" value={formData.brand || ''} onChange={e => setFormData({ ...formData, brand: e.target.value })}>
                                                            <option value="">-- Chưa chọn hãng --</option>
                                                            {(() => {
                                                                const opts = [...brandsList];
                                                                if (formData.brand && !opts.includes(formData.brand)) {
                                                                    opts.push(formData.brand);
                                                                }
                                                                return opts.map(b => <option key={b} value={b}>{b}</option>);
                                                            })()}
                                                        </select>
                                                    </div>
                                                    <div className="col-span-12">
                                                        <label className="block text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2 ml-1">Hoạt chất & Thành phần</label>
                                                        <input type="text" className="input-premium w-full p-3 font-bold text-sm border border-border focus:border-primary" value={formData.active_ingredient || ''} onChange={e => setFormData({ ...formData, active_ingredient: e.target.value })} autoComplete="off" />
                                                    </div>
                                                </div>
                                            </m.div>
                                        )}

                                        {activeTab === 'stock' && (
                                            <m.div key="stock" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="space-y-6">
                                                <div className="grid grid-cols-12 gap-6 bg-card/40 p-6 rounded-3xl border border-border">
                                                    <div className="col-span-3">
                                                        <label className="block text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2 ml-1">ĐVT Cơ Bản</label>
                                                        <input required type="text" className="input-premium w-full p-3 font-black text-sm border border-border focus:border-primary" value={formData.unit} list="unit-list-primary" onChange={e => setFormData({ ...formData, unit: e.target.value })} onBlur={e => setFormData({ ...formData, unit: normalizeUOM(e.target.value) })} onKeyDown={e => e.key === 'Enter' && handleSubmit(e)} autoComplete="off" />
                                                        <datalist id="unit-list-primary">
                                                            {PRIMARY_UNITS_SUGGESTIONS.map(u => <option key={u} value={u} />)}
                                                        </datalist>
                                                    </div>
                                                    <div className="col-span-3">
                                                        <label className="block text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2 ml-1">Tồn kho</label>
                                                        <input required type="number" disabled={formData.is_combo} className="input-premium w-full p-3 font-black text-sm border border-border focus:border-primary disabled:opacity-50" value={formData.stock} onChange={e => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })} onKeyDown={e => e.key === 'Enter' && handleSubmit(e)} autoComplete="off" />
                                                    </div>
                                                    <div className="col-span-3">
                                                        <label className="block text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest mb-2 ml-1 flex items-center gap-1">
                                                            <AlertTriangle size={12} />
                                                            Tồn cảnh báo
                                                        </label>
                                                        <input 
                                                            type="number" 
                                                            min="0" 
                                                            className="input-premium w-full p-3 font-black text-sm border border-border focus:border-primary" 
                                                            value={formData.min_stock !== undefined ? formData.min_stock : 0} 
                                                            onChange={e => setFormData({ ...formData, min_stock: parseFloat(e.target.value) || 0 })} 
                                                            onKeyDown={e => e.key === 'Enter' && handleSubmit(e)} 
                                                            autoComplete="off" 
                                                            placeholder="0" 
                                                            title="Tồn kho nhỏ hơn hoặc bằng mức này sẽ hiển thị cảnh báo cần nhập hàng" 
                                                        />
                                                    </div>
                                                    <div className="col-span-3">
                                                        <label className="block text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2 ml-1">Hạn sử dụng</label>
                                                        <input type="date" className="input-premium w-full p-3 font-black text-sm border border-border focus:border-primary" value={formData.expiry_date || ''} onChange={e => setFormData({ ...formData, expiry_date: e.target.value })} onKeyDown={e => e.key === 'Enter' && handleSubmit(e)} autoComplete="off" />
                                                    </div>

                                                    {accountingEnabled && (
                                                        <>
                                                            <div className="col-span-12 border-t border-border my-1"></div>
                                                            <div className="col-span-6 relative group">
                                                                <label className="block text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-2 ml-1 flex items-center gap-1.5">
                                                                    <FileText size={12} className="shrink-0" />
                                                                    Giá Kế Toán
                                                                </label>
                                                                <div className="relative">
                                                                    <NumberInput 
                                                                        className="w-full p-3 font-black text-sm text-blue-700 dark:text-blue-300 bg-blue-500/10 border-2 border-blue-500/20 focus:border-blue-500 rounded-xl" 
                                                                        value={formData.accounting_price} 
                                                                        onChange={val => setFormData({ ...formData, accounting_price: val })} 
                                                                        placeholder="0" 
                                                                    />
                                                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-blue-600/50 dark:text-blue-400/50">VNĐ</div>
                                                                </div>
                                                            </div>
                                                            <div className="col-span-6 relative group">
                                                                <label className="block text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-2 ml-1 flex items-center gap-1.5">
                                                                    <FileText size={12} className="shrink-0" />
                                                                    Tồn Kế Toán
                                                                </label>
                                                                <input 
                                                                    type="number" 
                                                                    className="input-premium w-full p-3 font-black text-sm text-blue-700 dark:text-blue-300 bg-blue-500/10 border-2 border-blue-500/20 focus:border-blue-500 rounded-xl" 
                                                                    value={formData.accounting_stock} 
                                                                    onChange={e => setFormData({ ...formData, accounting_stock: parseFloat(e.target.value) || 0 })} 
                                                                    autoComplete="off" 
                                                                    placeholder="0" 
                                                                />
                                                            </div>
                                                        </>
                                                    )}

                                                    {!formData.is_combo && (
                                                        <>
                                                            <div className="col-span-12">
                                                         <label className="block text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2 ml-1">Alias đọc âm thanh (TTS)</label>
                                                         <input type="text" className="input-premium w-full p-3 font-bold text-sm border border-border focus:border-primary" value={formData.alias || ''} onChange={e => setFormData({ ...formData, alias: e.target.value })} onKeyDown={e => e.key === 'Enter' && handleSubmit(e)} autoComplete="off" placeholder="Tên đọc tắt phát âm thanh... VD: diệt côn trùng" />
                                                     </div>

                                                     <div className="col-span-12 border-t border-border my-2"></div>
                                                            <div className="col-span-6">
                                                                <label className="block text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2 ml-1">Quy đổi (ĐVT Lớn)</label>
                                                                <input type="text" className="input-premium w-full p-3 font-bold text-sm border border-border focus:border-primary" value={formData.secondary_unit || ''} list="unit-list-secondary" onChange={e => setFormData({ ...formData, secondary_unit: e.target.value })} onBlur={e => setFormData({ ...formData, secondary_unit: normalizeUOM(e.target.value) })} autoComplete="off" placeholder="Ví dụ: Thùng" />
                                                                <datalist id="unit-list-secondary">
                                                                    {SECONDARY_UNITS_SUGGESTIONS.map(u => <option key={u} value={u} />)}
                                                                </datalist>
                                                            </div>
                                                            <div className="col-span-6">
                                                                <label className="block text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2 ml-1">Tỷ lệ (1 {formData.secondary_unit || 'ĐVT lớn'} = ? {formData.unit || 'ĐVT nhỏ'})</label>
                                                                <input type="number" className="input-premium w-full p-3 font-black text-sm border border-border focus:border-primary" value={formData.multiplier || 1} onChange={e => setFormData({ ...formData, multiplier: parseFloat(e.target.value) || 1 })} autoComplete="off" />
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                            </m.div>
                                        )}



                                        {activeTab === 'combo' && formData.is_combo && (
                                            <m.div key="combo" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="h-full flex flex-col">
                                                <div className="bg-card/40 p-6 rounded-3xl border border-border flex-1 flex flex-col min-h-0">
                                                    <div className="relative mb-4">
                                                        <input type="text" className="input-premium w-full p-3 text-sm font-bold border border-border focus:border-primary rounded-2xl shadow-sm" style={{ paddingLeft: '2.75rem' }} placeholder="Tìm kiếm và thêm sản phẩm thành phần..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} onKeyDown={handleSearchInputKeyDown} autoComplete="off" />
                                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/60"><Plus size={18} /></div>
                                                        <AnimatePresence>
                                                            {searchQuery && (
                                                                <m.div ref={dropdownListRef} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute w-full mt-2 bg-card rounded-2xl shadow-2xl border border-border max-h-48 overflow-y-auto z-[9999] p-2 custom-scrollbar">
                                                                    {filteredDropdownProducts.map((p, idx) => (
                                                                        <button key={p.id} type="button" onClick={() => { if (!formData.combo_items.some(i => i.product_id === p.id)) setFormData({ ...formData, combo_items: [...formData.combo_items, { product_id: p.id, quantity: 1, unit: p.unit }] }); setSearchQuery(''); setDropdownActiveIndex(-1); }} className={cn("w-full text-left p-3 flex justify-between items-center text-sm rounded-xl transition-all", idx === dropdownActiveIndex ? "bg-primary/10 text-primary" : "hover:bg-muted/50 text-foreground")}>
                                                                            <span className="font-bold">{p.name}</span>
                                                                            <span className="bg-muted/40 px-2 py-1 rounded text-xs text-muted-foreground font-bold">{p.unit}</span>
                                                                        </button>
                                                                    ))}
                                                                </m.div>
                                                            )}
                                                        </AnimatePresence>
                                                    </div>
                                                    <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 custom-scrollbar">
                                                        {formData.combo_items.map((item, idx) => {
                                                            const p = allProducts.find(prod => prod.id === item.product_id);
                                                            return (
                                                                <div key={idx} className="flex items-center gap-3 bg-black/[0.03] dark:bg-white/[0.04] border border-border/80 p-3 rounded-2xl transition-all hover:border-primary/40">
                                                                    <div className="flex-1 text-sm font-black uppercase text-foreground truncate">{p?.name}</div>
                                                                    <div className="flex items-center gap-1.5 bg-black/5 dark:bg-white/5 px-2 py-1 rounded-xl border border-border/60">
                                                                        <input type="number" className="w-14 py-1 bg-transparent border-none text-center font-black text-foreground outline-none text-sm" value={item.quantity} onChange={e => { const newItems = [...formData.combo_items]; newItems[idx].quantity = parseFloat(e.target.value) || 1; setFormData({ ...formData, combo_items: newItems }); }} />
                                                                        <span className="text-[11px] font-black text-muted-foreground uppercase">{p?.unit}</span>
                                                                    </div>
                                                                    <button type="button" onClick={() => setFormData({ ...formData, combo_items: formData.combo_items.filter((_, i) => i !== idx) })} className="p-2.5 text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all"><Trash2 size={16} /></button>
                                                                </div>
                                                            );
                                                        })}
                                                        {formData.combo_items.length === 0 && (
                                                            <div className="h-full flex items-center justify-center text-muted-foreground text-sm font-bold opacity-50 flex-col gap-2">
                                                                <Boxes size={32} />
                                                                <p>Chưa có sản phẩm thành phần nào</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </m.div>
                                        )}
                                    </AnimatePresence>
                                </div>


                                {/* Footer */}
                                <div className="p-6 bg-card/80 border-t border-border flex justify-between items-center shrink-0">
                                    <div className="flex items-center gap-4">
                                        <label className="flex items-center gap-3 cursor-pointer group">
                                            <div className="relative w-10 h-5 bg-muted/40 rounded-full transition-colors group-hover:bg-muted/60">
                                                <input type="checkbox" className="hidden" checked={formData.is_combo} onChange={e => setFormData({ ...formData, is_combo: e.target.checked, combo_items: e.target.checked ? (formData.combo_items || []) : [] })} />
                                                <div className={cn("absolute top-0.5 left-0.5 w-4 h-4 rounded-full transition-all duration-300", formData.is_combo ? "translate-x-5 bg-primary" : "bg-white dark:bg-slate-400")}></div>
                                            </div>
                                            <span className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Sản phẩm Combo</span>
                                        </label>
                                    </div>
                                    <div className="flex justify-end gap-3">
                                        <button type="button" onClick={onClose} className="px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-wider text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors">Hủy bỏ</button>
                                        <button type="submit" className="px-8 py-3 bg-primary hover:bg-primary-hover text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-2">
                                            <Save size={16} />
                                            Lưu sản phẩm
                                        </button>
                                    </div>
                                </div>
                            </form>
                        </m.div>
                    </div>
                )}
                <AnimatePresence>
                    {toast && (
                        <Toast
                            message={toast.message}
                            type={toast.type}
                            onClose={() => setToast(null)}
                        />
                    )}
                </AnimatePresence>
            </AnimatePresence>
        </Portal >
    );
}
