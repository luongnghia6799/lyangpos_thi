import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import { m, AnimatePresence } from 'framer-motion';
import { 
    Sprout, Plus, Trash2, Edit2, Search, X, Check,
    Package, SprayCan, Leaf, Hammer, Droplets, FlaskConical, 
    Bug, Fuel, Truck, ShoppingCart, Tags, Archive, Layers,
    ExternalLink, AlertTriangle
} from 'lucide-react';
import { cn, removeAccents } from '../../lib/utils';
import CategoryIcon from '../widgets/CategoryIcon';
import CatalogPagination from './CatalogPagination';

const SUGGESTED_ICONS = [
    { id: 'SprayCan', icon: SprayCan, label: 'Thuốc BVTV' },
    { id: 'Sprout', icon: Sprout, label: 'Phân bón / Mầm cây' },
    { id: 'Leaf', icon: Leaf, label: 'Hạt giống / Lá cây' },
    { id: 'Droplets', icon: Droplets, label: 'Phân bón lỏng / Nước' },
    { id: 'FlaskConical', icon: FlaskConical, label: 'Thuốc đặc trị / Hóa chất' },
    { id: 'Bug', icon: Bug, label: 'Trừ sâu / Rầy / Bọ trĩ' },
    { id: 'Hammer', icon: Hammer, label: 'Dụng cụ nông nghiệp' },
    { id: 'Package', icon: Package, label: 'Hàng hóa đóng gói' },
    { id: 'Layers', icon: Layers, label: 'Phân lớp / Phụ kiện' },
    { id: 'Tags', icon: Tags, label: 'Nhãn mác' },
    { id: 'Archive', icon: Archive, label: 'Kho vật tư' },
    { id: 'Truck', icon: Truck, label: 'Vận chuyển' },
    { id: 'Fuel', icon: Fuel, label: 'Xăng dầu' },
    { id: 'ShoppingCart', icon: ShoppingCart, label: 'Tổng hợp' },
];

export default function CategoryCatalogTab({ products = [], onToast, onOpenEditProduct }) {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [page, setPage] = useState(1);
    const PAGE_SIZE = 16;
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({ name: '', icon: 'Package' });
    const [showIconPicker, setShowIconPicker] = useState(false);
    const [selectedCatDetail, setSelectedCatDetail] = useState(null);
    const [drawerSearch, setDrawerSearch] = useState('');

    useEffect(() => {
        fetchCategories();
    }, []);

    useEffect(() => {
        setPage(1);
    }, [searchTerm]);

    const fetchCategories = async () => {
        setLoading(true);
        try {
            const res = await axios.get('/api/categories');
            setCategories(res.data || []);
        } catch (err) {
            onToast?.({ message: 'Lỗi khi tải danh mục', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    // Số sản phẩm thuộc từng Category
    const countByCatId = useMemo(() => {
        const counts = {};
        products.forEach(p => {
            const catId = p.category_id || 'uncategorized';
            if (!counts[catId]) counts[catId] = [];
            counts[catId].push(p);
        });
        return counts;
    }, [products]);

    const filteredCategories = useMemo(() => {
        if (!searchTerm.trim()) return categories;
        const term = searchTerm.toLowerCase();
        const termNoAccent = removeAccents(term);
        return categories.filter(c => {
            const n = c.name.toLowerCase();
            return n.includes(term) || removeAccents(n).includes(termNoAccent);
        });
    }, [categories, searchTerm]);

    const paginatedCategories = useMemo(() => {
        const start = (page - 1) * PAGE_SIZE;
        return filteredCategories.slice(start, start + PAGE_SIZE);
    }, [filteredCategories, page]);

    const handleSave = async () => {
        if (!formData.name.trim()) return;
        setLoading(true);
        try {
            if (editingId) {
                await axios.put(`/api/categories/${editingId}`, formData);
                onToast?.({ message: 'Đã cập nhật phân loại', type: 'success' });
            } else {
                await axios.post('/api/categories', formData);
                onToast?.({ message: 'Đã thêm phân loại mới', type: 'success' });
            }
            setFormData({ name: '', icon: 'Package' });
            setIsAdding(false);
            setEditingId(null);
            fetchCategories();
        } catch (err) {
            onToast?.({ message: err.response?.data?.error || 'Lỗi khi lưu phân loại', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id, catName) => {
        const prods = countByCatId[id] || [];
        if (prods.length > 0) {
            if (!window.confirm(`Phân loại "${catName}" đang có ${prods.length} sản phẩm liên kết. Bạn có chắc chắn muốn xóa không?`)) {
                return;
            }
        } else {
            if (!window.confirm(`Bạn có chắc chắn muốn xóa phân loại "${catName}"?`)) return;
        }

        setLoading(true);
        try {
            await axios.delete(`/api/categories/${id}`);
            onToast?.({ message: 'Đã xóa phân loại', type: 'success' });
            fetchCategories();
        } catch (err) {
            onToast?.({ message: err.response?.data?.error || 'Lỗi khi xóa', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleStartEdit = (cat) => {
        setEditingId(cat.id);
        setFormData({ name: cat.name, icon: cat.icon || 'Package' });
        setIsAdding(true);
    };

    const handleCancelForm = () => {
        setIsAdding(false);
        setEditingId(null);
        setFormData({ name: '', icon: 'Package' });
        setShowIconPicker(false);
    };

    return (
        <div className="space-y-6">
            {/* THANH TÌM KIẾM & NÚT THÊM */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-black/[0.02] dark:bg-white/[0.02] p-4 rounded-3xl border border-stone-300/60 dark:border-white/10">
                <div className="relative flex-1 max-w-md">
                    <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Tìm kiếm phân loại hàng hóa..."
                        className="w-full pl-9 pr-8 py-2 text-xs font-bold rounded-2xl bg-white dark:bg-black/30 border border-stone-300/70 dark:border-white/10 outline-none text-stone-800 dark:text-stone-100 placeholder:text-stone-400 focus:border-emerald-600"
                    />
                    {searchTerm && (
                        <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600">
                            <X size={13} />
                        </button>
                    )}
                </div>

                {!isAdding && (
                    <button
                        type="button"
                        onClick={() => {
                            setFormData({ name: '', icon: 'Package' });
                            setEditingId(null);
                            setIsAdding(true);
                        }}
                        className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-[#2d5016] text-white rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm hover:scale-[1.02] transition-transform cursor-pointer"
                    >
                        <Plus size={14} strokeWidth={3} /> Thêm Phân Loại
                    </button>
                )}
            </div>

            {/* FORM THÊM / SỬA PHÂN LOẠI */}
            <AnimatePresence>
                {isAdding && (
                    <m.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="p-5 rounded-3xl bg-emerald-500/10 border border-emerald-500/25 space-y-4"
                    >
                        <div className="flex items-center justify-between">
                            <h4 className="font-black text-sm text-emerald-950 dark:text-emerald-200">
                                {editingId ? "Chỉnh sửa phân loại" : "Thêm phân loại mới"}
                            </h4>
                            <button onClick={handleCancelForm} className="text-stone-400 hover:text-stone-600 p-1">
                                <X size={16} />
                            </button>
                        </div>

                        <div className="flex flex-col sm:flex-row items-center gap-3">
                            {/* CHỌN ICON */}
                            <div className="relative">
                                <button
                                    type="button"
                                    onClick={() => setShowIconPicker(prev => !prev)}
                                    className="w-11 h-11 rounded-2xl bg-white dark:bg-black/30 border border-stone-300/80 dark:border-white/20 flex items-center justify-center text-emerald-700 dark:text-emerald-400 shadow-2xs hover:scale-105 transition-transform"
                                    title="Chọn biểu tượng"
                                >
                                    <CategoryIcon icon={formData.icon} size={20} />
                                </button>
                            </div>

                            {/* TÊN PHÂN LOẠI */}
                            <input
                                type="text"
                                autoFocus
                                value={formData.name}
                                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                                placeholder="Tên phân loại (VD: Thuốc trừ sâu, Phân bón lá, Hạt giống...)"
                                className="flex-1 px-4 py-2.5 text-xs font-bold rounded-2xl bg-white dark:bg-black/30 border border-stone-300/70 dark:border-white/10 outline-none text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/15"
                            />

                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={handleSave}
                                    disabled={loading || !formData.name.trim()}
                                    className="px-5 py-2.5 bg-emerald-600 text-white rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm hover:bg-emerald-700 disabled:opacity-50 cursor-pointer"
                                >
                                    <Check size={14} strokeWidth={3} /> {editingId ? "Cập nhật" : "Lưu"}
                                </button>
                                <button
                                    type="button"
                                    onClick={handleCancelForm}
                                    className="px-4 py-2.5 bg-black/5 dark:bg-white/5 text-stone-600 dark:text-stone-300 rounded-2xl text-xs font-bold hover:bg-black/10 cursor-pointer"
                                >
                                    Hủy
                                </button>
                            </div>
                        </div>

                        {/* PICKER CHỌN ICON NÔNG NGHIỆP */}
                        {showIconPicker && (
                            <div className="p-3 bg-white dark:bg-[#121a14] rounded-2xl border border-stone-300/60 dark:border-white/10 grid grid-cols-4 sm:grid-cols-7 gap-2">
                                {SUGGESTED_ICONS.map(ic => {
                                    const IconComp = ic.icon;
                                    const isSelected = formData.icon === ic.id;
                                    return (
                                        <button
                                            key={ic.id}
                                            type="button"
                                            onClick={() => {
                                                setFormData(prev => ({ ...prev, icon: ic.id }));
                                                setShowIconPicker(false);
                                            }}
                                            className={cn(
                                                "p-2.5 rounded-xl border flex flex-col items-center gap-1 text-center transition-all cursor-pointer",
                                                isSelected
                                                    ? "bg-emerald-500/20 border-emerald-600 text-emerald-800 dark:text-emerald-300 font-bold"
                                                    : "border-transparent hover:bg-black/5 dark:hover:bg-white/5 text-stone-600 dark:text-stone-300"
                                            )}
                                        >
                                            <IconComp size={18} />
                                            <span className="text-[9px] leading-tight line-clamp-1">{ic.label}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </m.div>
                )}
            </AnimatePresence>

            {/* GRID CÁC PHÂN LOẠI */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
                {paginatedCategories.map(cat => {
                    const prodList = countByCatId[cat.id] || [];
                    const count = prodList.length;

                    return (
                        <div
                            key={cat.id}
                            onClick={() => setSelectedCatDetail(count > 0 ? { ...cat, products: prodList } : null)}
                            className="p-4 rounded-3xl bg-white/80 dark:bg-[#141f17]/80 border border-stone-300/60 dark:border-white/10 hover:border-emerald-500/50 hover:shadow-md transition-all flex flex-col justify-between group cursor-pointer"
                        >
                            <div className="flex items-start justify-between gap-2 mb-3">
                                <div className="flex items-center gap-2.5 min-w-0">
                                    <div className="w-10 h-10 rounded-2xl bg-emerald-600/10 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0">
                                        <CategoryIcon icon={cat.icon} size={20} />
                                    </div>
                                    <div className="min-w-0">
                                        <h4 className="font-black text-sm text-stone-900 dark:text-stone-100 group-hover:text-emerald-700 dark:group-hover:text-emerald-300 transition-colors truncate">
                                            {cat.name}
                                        </h4>
                                        <span className="text-[10px] text-stone-400 font-mono">ID: {cat.id}</span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleStartEdit(cat);
                                        }}
                                        className="p-1 rounded-lg text-stone-400 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                                        title="Chỉnh sửa"
                                    >
                                        <Edit2 size={13} />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDelete(cat.id, cat.name);
                                        }}
                                        className="p-1 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                                        title="Xóa phân loại"
                                    >
                                        <Trash2 size={13} />
                                    </button>
                                </div>
                            </div>

                            <div className="pt-2 border-t border-stone-200/50 dark:border-white/5 flex items-center justify-between text-xs">
                                <span className="text-stone-500 text-[11px]">Sản phẩm liên kết:</span>
                                <span className={cn(
                                    "font-black px-2 py-0.5 rounded-lg tabular-nums text-xs",
                                    count > 0
                                        ? "bg-emerald-600/15 text-emerald-800 dark:text-emerald-300"
                                        : "bg-black/5 dark:bg-white/5 text-stone-400"
                                )}>
                                    {count} SP
                                </span>
                            </div>
                        </div>
                    );
                })}

                {/* THẺ SẢN PHẨM CHƯA PHÂN LOẠI (chỉ hiển thị ở trang 1 nếu có) */}
                {page === 1 && countByCatId['uncategorized'] && countByCatId['uncategorized'].length > 0 && (
                    <div
                        onClick={() => setSelectedCatDetail({
                            id: 'uncategorized',
                            name: '-- Chưa phân loại --',
                            products: countByCatId['uncategorized']
                        })}
                        className="p-4 rounded-3xl bg-amber-500/5 border border-amber-500/20 hover:border-amber-500/40 hover:shadow-md transition-all flex flex-col justify-between group cursor-pointer"
                    >
                        <div className="flex items-center gap-2.5 mb-3">
                            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0">
                                <AlertTriangle size={20} />
                            </div>
                            <div>
                                <h4 className="font-black text-sm text-amber-900 dark:text-amber-200">Chưa phân loại</h4>
                                <span className="text-[10px] text-amber-600/70">Cần gán nhóm hàng</span>
                            </div>
                        </div>
                        <div className="pt-2 border-t border-amber-500/15 flex items-center justify-between text-xs">
                            <span className="text-stone-500 text-[11px]">Sản phẩm chưa có nhóm:</span>
                            <span className="font-black bg-amber-500/20 text-amber-900 dark:text-amber-200 px-2 py-0.5 rounded-lg tabular-nums text-xs">
                                {countByCatId['uncategorized'].length} SP
                            </span>
                        </div>
                    </div>
                )}
            </div>

            {/* PHÂN TRANG */}
            <CatalogPagination
                currentPage={page}
                totalItems={filteredCategories.length}
                pageSize={PAGE_SIZE}
                onPageChange={setPage}
                itemLabel="phân loại"
            />

            {/* DRAWER SẢN PHẨM TRONG PHÂN LOẠI NÀY */}
            {typeof document !== 'undefined' && createPortal(
                <AnimatePresence>
                    {selectedCatDetail && (
                        <div className="fixed inset-0 z-[999999] isolate flex justify-end">
                            <m.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="fixed inset-0 bg-stone-900/60 dark:bg-black/75 backdrop-blur-xs"
                                onClick={() => {
                                    setSelectedCatDetail(null);
                                    setDrawerSearch('');
                                }}
                            />

                            <m.div
                                initial={{ x: '100%' }}
                                animate={{ x: 0 }}
                                exit={{ x: '100%' }}
                                transition={{ type: 'spring', damping: 28, stiffness: 280 }}
                                className="relative w-full max-w-md h-full bg-[#faf8f5] dark:bg-[#142018] shadow-2xl flex flex-col border-l border-emerald-600/20 dark:border-white/10 z-10"
                                onClick={(e) => e.stopPropagation()}
                            >
                                {/* Header */}
                                <div className="p-5 pb-4 border-b border-stone-200/80 dark:border-white/10 flex items-start justify-between gap-3 bg-white/40 dark:bg-black/20">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="w-10 h-10 rounded-2xl bg-emerald-600/10 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0 border border-emerald-600/20 shadow-2xs">
                                            {selectedCatDetail.icon ? (
                                                <CategoryIcon icon={selectedCatDetail.icon} size={20} />
                                            ) : (
                                                <Sprout size={20} />
                                            )}
                                        </div>
                                        <div className="min-w-0">
                                            <h3 className="font-black text-base text-stone-900 dark:text-stone-100 truncate">
                                                {selectedCatDetail.name}
                                            </h3>
                                            <p className="text-xs text-stone-500 dark:text-stone-400 font-medium">
                                                Có <span className="text-emerald-700 dark:text-emerald-400 font-bold">{selectedCatDetail.products?.length || 0}</span> sản phẩm trong nhóm này
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => {
                                            setSelectedCatDetail(null);
                                            setDrawerSearch('');
                                        }}
                                        className="p-2 rounded-2xl hover:bg-stone-200/60 dark:hover:bg-white/10 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition-colors shrink-0"
                                    >
                                        <X size={18} />
                                    </button>
                                </div>

                                {/* Quick filter inside drawer */}
                                {(selectedCatDetail.products?.length || 0) > 3 && (
                                    <div className="px-5 pt-3 pb-1">
                                        <div className="relative">
                                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                                            <input
                                                type="text"
                                                value={drawerSearch}
                                                onChange={(e) => setDrawerSearch(e.target.value)}
                                                placeholder="Lọc sản phẩm trong phân loại..."
                                                className="w-full pl-8 pr-7 py-1.5 text-xs font-medium rounded-xl bg-white dark:bg-black/30 border border-stone-200 dark:border-white/10 outline-none text-stone-800 dark:text-stone-100 placeholder:text-stone-400 focus:border-emerald-600"
                                            />
                                            {drawerSearch && (
                                                <button onClick={() => setDrawerSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600">
                                                    <X size={12} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Product list */}
                                <div className="p-5 space-y-2.5 flex-1 overflow-y-auto">
                                    {(selectedCatDetail.products || [])
                                        .filter(p => {
                                            if (!drawerSearch.trim()) return true;
                                            const t = drawerSearch.toLowerCase();
                                            return (p.name && p.name.toLowerCase().includes(t)) ||
                                                   (p.code && p.code.toLowerCase().includes(t)) ||
                                                   (p.brand && p.brand.toLowerCase().includes(t));
                                        })
                                        .map(p => (
                                            <div
                                                key={p.id}
                                                className="p-3.5 rounded-2xl bg-white/90 dark:bg-[#19271e]/90 border border-stone-200/90 dark:border-white/10 hover:border-emerald-500/60 hover:shadow-md transition-all group flex items-center justify-between gap-3"
                                            >
                                                <div className="min-w-0 flex-1">
                                                    <p className="font-bold text-xs text-stone-900 dark:text-stone-100 group-hover:text-emerald-700 dark:group-hover:text-emerald-300 transition-colors line-clamp-1">
                                                        {p.name}
                                                    </p>
                                                    {p.active_ingredient && (
                                                        <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold line-clamp-1 mt-0.5">
                                                            {p.active_ingredient}
                                                        </p>
                                                    )}
                                                    <div className="flex items-center gap-1.5 flex-wrap text-[10px] mt-1.5">
                                                        <span className="bg-stone-100 dark:bg-white/5 text-stone-600 dark:text-stone-300 px-2 py-0.5 rounded-md font-mono">
                                                            {p.code || `ID:${p.id}`}
                                                        </span>
                                                        {p.brand && (
                                                            <span className="bg-stone-100 dark:bg-white/5 text-stone-600 dark:text-stone-300 px-2 py-0.5 rounded-md">
                                                                {p.brand}
                                                            </span>
                                                        )}
                                                        <span className="bg-emerald-500/15 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 font-bold px-2 py-0.5 rounded-md">
                                                            Tồn: {p.stock ?? 0} {p.unit}
                                                        </span>
                                                    </div>
                                                </div>
                                                {onOpenEditProduct && (
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setSelectedCatDetail(null);
                                                            onOpenEditProduct(p);
                                                        }}
                                                        className="p-2 rounded-xl text-stone-400 group-hover:text-emerald-700 dark:group-hover:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 transition-all shrink-0"
                                                        title="Mở sửa sản phẩm"
                                                    >
                                                        <ExternalLink size={15} />
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                </div>
                            </m.div>
                        </div>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </div>
    );
}
