import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { m, AnimatePresence } from 'framer-motion';
import { X, Package, DollarSign, Tag, Calendar, Database, CheckSquare, Plus, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import Toast from './Toast';
import Portal from './Portal';
import { formatNumber, normalizeUOM, cn } from '../lib/utils';
import { useQueryClient } from '@tanstack/react-query';

const PRIMARY_UNITS = ['Chai', 'Hộp', 'Viên', 'Gói', 'Tuýp', 'Lọ', 'Bịch', 'Can', 'Ký', 'Cái'];

export default function MobileProductEditModal({ product, isOpen, onClose, onSave }) {
    const DEFAULT_PRODUCT = {
        name: '', code: '', unit: 'Cái', secondary_unit: '', multiplier: 1,
        cost_price: 0, sale_price: 0, stock: 0, expiry_date: '',
        active_ingredient: '', brand: '', is_combo: false, is_active: true, 
        combo_items: [], category_id: null, alias: ''
    };

    const [formData, setFormData] = useState(DEFAULT_PRODUCT);
    const [toast, setToast] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [categories, setCategories] = useState([]);
    const [allProducts, setAllProducts] = useState([]);
    
    // Accordion state
    const [expandedSection, setExpandedSection] = useState('basic'); // basic, price, storage, combo

    useEffect(() => {
        if (isOpen) {
            if (product) {
                setFormData(prev => {
                    if (product.id && prev.id === product.id) return prev;
                    return { ...DEFAULT_PRODUCT, ...product, combo_items: product.combo_items || [] };
                });
            } else {
                setFormData(DEFAULT_PRODUCT);
            }
            fetchCategories();
            fetchProducts();
            document.body.style.overflow = 'hidden';
            setExpandedSection('basic');
        } else {
            document.body.style.overflow = '';
        }

        return () => { document.body.style.overflow = ''; };
    }, [isOpen, product]);

    const fetchCategories = async () => {
        try {
            const res = await axios.get('/api/categories');
            setCategories(res.data || []);
        } catch (err) { console.error(err); }
    };

    const fetchProducts = async () => {
        try {
            const res = await axios.get('/api/products?limit=1000');
            const items = res.data.items || res.data || [];
            setAllProducts(items.filter(p => !p.is_combo));
        } catch (err) { console.error(err); }
    };

    const queryClient = useQueryClient();
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isSaving) return;
        setIsSaving(true);
        try {
            let res;
            if (product?.id) {
                res = await axios.put(`/api/products/${product.id}`, formData);
            } else {
                res = await axios.post('/api/products', formData);
            }
            queryClient.invalidateQueries({ queryKey: ['products'] });
            onSave(res.data);
            onClose();
        } catch (err) {
            console.error(err);
            setToast({ message: err.response?.data?.error || "Lỗi khi lưu SP.", type: "error" });
        } finally {
            setIsSaving(false);
        }
    };

    const toggleSection = (section) => {
        setExpandedSection(prev => prev === section ? null : section);
    };

    const SectionHeader = ({ title, icon: Icon, section, isActive }) => (
        <button
            type="button"
            onClick={() => toggleSection(section)}
            className="flex items-center justify-between w-full p-4 bg-transparent border-b border-gray-100 dark:border-slate-800"
        >
            <div className="flex items-center gap-3">
                <div className={cn("p-2 rounded-xl transition-colors", isActive ? "bg-primary/10 text-primary" : "bg-transparent text-gray-500")}>
                    <Icon size={18} />
                </div>
                <span className={cn("font-bold text-sm", isActive ? "text-primary" : "text-gray-700 dark:text-gray-200")}>{title}</span>
            </div>
            {isActive ? <ChevronDown size={18} className="text-primary" /> : <ChevronRight size={18} className="text-gray-400" />}
        </button>
    );

    return (
        <Portal>
            <AnimatePresence>
                {isOpen && (
                    <div className="fixed inset-0 z-[2000] flex flex-col justify-end overflow-hidden">
                        <m.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                            onClick={onClose}
                        />

                        <m.div
                            initial={{ y: "100%" }}
                            animate={{ y: 0 }}
                            exit={{ y: "100%" }}
                            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                            className="w-full bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-t-[2rem] shadow-2xl relative z-10 flex flex-col h-[90vh]"
                        >
                            {/* Header */}
                            <div className="flex-shrink-0 bg-white dark:bg-slate-900 rounded-t-[2rem] px-5 pt-3 pb-4 border-b border-slate-200/80 dark:border-slate-800">
                                <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mb-4" />
                                <div className="flex justify-between items-center">
                                    <div>
                                        <h2 className="text-lg font-extrabold text-slate-900 dark:text-slate-100 uppercase tracking-tight">
                                            {product?.id ? 'Sửa Sản Phẩm' : 'Thêm SP Mới'}
                                        </h2>
                                        {formData.name && <p className="text-xs font-medium text-slate-500 truncate max-w-[200px] mt-0.5">{formData.name}</p>}
                                    </div>
                                    <button onClick={onClose} className="p-2 rounded-full text-slate-400 hover:text-rose-500 transition-colors">
                                        <X size={20} />
                                    </button>
                                </div>
                            </div>

                            {/* Accordion Content */}
                            <div className="flex-1 overflow-y-auto custom-scrollbar bg-white dark:bg-slate-900">
                                <form id="mobile-product-form" onSubmit={handleSubmit}>
                                    
                                    {/* 1. Basic Info */}
                                    <SectionHeader title="Thông tin cơ bản" icon={Package} section="basic" isActive={expandedSection === 'basic'} />
                                    <AnimatePresence initial={false}>
                                        {expandedSection === 'basic' && (
                                            <m.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800">
                                                <div className="p-4 space-y-4">
                                                    <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200/60 dark:border-slate-700/60">
                                                        <span className="text-sm font-extrabold text-slate-800 dark:text-slate-200">Trạng thái bán hàng</span>
                                                        <label className="relative inline-flex items-center cursor-pointer">
                                                            <input type="checkbox" className="sr-only peer" checked={formData.is_active} onChange={e => setFormData({ ...formData, is_active: e.target.checked })} />
                                                            <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-emerald-500"></div>
                                                        </label>
                                                    </div>

                                                    <div className="space-y-1.5">
                                                        <label className="text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase">Tên sản phẩm *</label>
                                                        <input required type="text" className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 font-bold text-sm focus:border-primary outline-none transition-all text-slate-900 dark:text-white" placeholder="VD: Nước suối Aquafina" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                                                    </div>

                                                    <div className="space-y-1.5">
                                                        <label className="text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase">Alias đọc âm thanh (TTS)</label>
                                                        <input type="text" className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 font-bold text-sm focus:border-primary outline-none transition-all text-slate-900 dark:text-white" placeholder="VD: nước suối" value={formData.alias || ''} onChange={e => setFormData({ ...formData, alias: e.target.value })} />
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-3">
                                                        <div className="space-y-1.5">
                                                            <label className="text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase">Mã SKU</label>
                                                            <input type="text" className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 font-bold text-sm focus:border-primary outline-none transition-all text-slate-900 dark:text-white" placeholder="Tự động" value={formData.code || ''} onChange={e => setFormData({ ...formData, code: e.target.value })} />
                                                        </div>
                                                        <div className="space-y-1.5">
                                                            <label className="text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase">Đơn vị *</label>
                                                            <input required type="text" list="units-list" className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 font-bold text-sm focus:border-primary outline-none transition-all text-slate-900 dark:text-white" placeholder="Chai, Lọ..." value={formData.unit} onChange={e => setFormData({ ...formData, unit: e.target.value })} onBlur={e => setFormData({ ...formData, unit: normalizeUOM(e.target.value) })} />
                                                            <datalist id="units-list">
                                                                {PRIMARY_UNITS.map(u => <option key={u} value={u} />)}
                                                            </datalist>
                                                        </div>
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <label className="text-xs font-bold text-gray-500 uppercase">Danh mục</label>
                                                        <select className="w-full bg-transparent dark:bg-slate-950 border border-gray-200 dark:border-slate-700 rounded-xl p-3 font-bold text-sm focus:border-primary outline-none transition-all dark:text-white appearance-none" value={formData.category_id || ''} onChange={e => setFormData({ ...formData, category_id: e.target.value || null })}>
                                                            <option value="">-- Chưa phân loại --</option>
                                                            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                                        </select>
                                                    </div>
                                                </div>
                                            </m.div>
                                        )}
                                    </AnimatePresence>

                                    {/* 2. Price & Finances */}
                                    <SectionHeader title="Giá & Tài chính" icon={DollarSign} section="price" isActive={expandedSection === 'price'} />
                                    <AnimatePresence initial={false}>
                                        {expandedSection === 'price' && (
                                            <m.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden bg-transparent border-b border-gray-100 dark:border-slate-800">
                                                <div className="p-4 space-y-4">
                                                    <div className="space-y-1.5">
                                                        <label className="text-xs font-black text-amber-600 uppercase">Giá nhập (Vốn)</label>
                                                        <div className="relative">
                                                            <input type="number" disabled={formData.is_combo} className="w-full bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-3 font-black text-amber-700 dark:text-amber-500 text-lg outline-none disabled:opacity-50" value={formData.cost_price || ''} onChange={e => setFormData({ ...formData, cost_price: parseFloat(e.target.value) || 0 })} />
                                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-black text-amber-600/50">VNĐ</span>
                                                        </div>
                                                    </div>

                                                    <div className="space-y-1.5">
                                                        <label className="text-xs font-black text-primary uppercase">Giá bán lẻ</label>
                                                        <div className="relative">
                                                            <input type="number" className="w-full bg-primary/10 border border-primary/30 rounded-xl p-3 font-black text-primary text-xl shadow-sm outline-none" value={formData.sale_price || ''} onChange={e => setFormData({ ...formData, sale_price: parseFloat(e.target.value) || 0 })} />
                                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-black text-primary/50">VNĐ</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </m.div>
                                        )}
                                    </AnimatePresence>

                                    {/* 3. Storage & Inventory */}
                                    <SectionHeader title="Tồn kho & Quy đổi" icon={Database} section="storage" isActive={expandedSection === 'storage'} />
                                    <AnimatePresence initial={false}>
                                        {expandedSection === 'storage' && (
                                            <m.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden bg-transparent border-b border-gray-100 dark:border-slate-800">
                                                <div className="p-4 space-y-4">
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <div className="space-y-1.5">
                                                            <label className="text-xs font-bold text-gray-500 uppercase">Tồn kho hiện tại</label>
                                                            <input type="number" disabled={formData.is_combo} className="w-full bg-transparent dark:bg-slate-950 border border-gray-200 dark:border-slate-700 rounded-xl p-3 font-bold text-sm focus:border-primary outline-none disabled:opacity-50 dark:text-white" value={formData.stock || ''} onChange={e => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })} />
                                                        </div>
                                                        <div className="space-y-1.5">
                                                            <label className="text-xs font-bold text-gray-500 uppercase">Hạn SD (Tùy chọn)</label>
                                                            <input type="date" className="w-full bg-transparent dark:bg-slate-950 border border-gray-200 dark:border-slate-700 rounded-xl p-3 font-bold text-sm focus:border-primary outline-none dark:text-white" value={formData.expiry_date || ''} onChange={e => setFormData({ ...formData, expiry_date: e.target.value })} />
                                                        </div>
                                                    </div>

                                                    {!formData.is_combo && (
                                                        <div className="p-3 bg-blue-50/50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-800/30">
                                                            <p className="text-[10px] font-black text-blue-500 uppercase mb-3 text-center tracking-widest">Đơn vị quy đổi (Mua sỉ bán lẻ)</p>
                                                            <div className="grid grid-cols-2 gap-3">
                                                                <div className="space-y-1.5">
                                                                    <label className="text-[10px] font-bold text-gray-500 uppercase">ĐV Lớn (Thùng, Lốc...)</label>
                                                                    <input type="text" className="w-full bg-transparent border border-gray-200 dark:border-slate-700 rounded-xl p-2.5 font-bold text-sm outline-none dark:text-white" value={formData.secondary_unit || ''} onChange={e => setFormData({ ...formData, secondary_unit: e.target.value })} />
                                                                </div>
                                                                <div className="space-y-1.5">
                                                                    <label className="text-[10px] font-bold text-gray-500 uppercase">Giá trị quy đổi</label>
                                                                    <input type="number" className="w-full bg-transparent border border-gray-200 dark:border-slate-700 rounded-xl p-2.5 font-bold text-sm outline-none dark:text-white" value={formData.multiplier || 1} onChange={e => setFormData({ ...formData, multiplier: parseFloat(e.target.value) || 1 })} />
                                                                </div>
                                                            </div>
                                                            {formData.secondary_unit && formData.multiplier > 1 && (
                                                                <p className="text-[10px] text-blue-600 mt-2 text-center">1 {formData.secondary_unit} = {formData.multiplier} {formData.unit}</p>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </m.div>
                                        )}
                                    </AnimatePresence>
                                    
                                    <div className="h-20" />
                                </form>
                            </div>

                            {/* Footer Actions */}
                            <div className="flex-shrink-0 bg-transparent p-4 border-t border-gray-100 dark:border-slate-800 flex gap-3 pb-[max(env(safe-area-inset-bottom),16px)]">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="flex-1 py-3.5 bg-transparent text-gray-600 dark:text-gray-300 rounded-2xl font-black uppercase text-xs active:scale-95 transition-transform"
                                >
                                    Hủy
                                </button>
                                <button
                                    type="submit"
                                    form="mobile-product-form"
                                    disabled={isSaving}
                                    className="flex-[2] py-3.5 bg-gradient-to-r from-primary to-emerald-600 text-white rounded-2xl font-black uppercase text-xs shadow-lg shadow-primary/30 active:scale-95 transition-transform disabled:opacity-70 flex justify-center items-center gap-2"
                                >
                                    {isSaving ? "Đang lưu..." : "Lưu sản phẩm"}
                                </button>
                            </div>
                        </m.div>
                    </div>
                )}
            </AnimatePresence>
            
            <AnimatePresence>
                {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
            </AnimatePresence>
        </Portal>
    );
}
