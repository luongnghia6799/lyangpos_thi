import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import { m, AnimatePresence } from 'framer-motion';
import { 
    FlaskConical, Search, Plus, Trash2, Edit2, Check, X, ExternalLink, 
    Sparkles, ShieldCheck, Bug, Leaf, Sprout, Store, Info
} from 'lucide-react';
import { cn, removeAccents } from '../../lib/utils';
import { 
    POPULAR_ACTIVE_INGREDIENTS, 
    CATEGORY_LABELS, 
    getCustomActiveIngredients, 
    saveCustomActiveIngredient, 
    updateCustomActiveIngredient,
    removeCustomActiveIngredient,
    parseActiveIngredients,
    replaceIngredientInProductString
} from '../../data/activeIngredientsData';
import CatalogPagination from './CatalogPagination';

export default function IngredientCatalogTab({ products = [], onUpdate, onToast, onOpenEditProduct }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [customIngredients, setCustomIngredients] = useState(() => getCustomActiveIngredients());
    const [newIngName, setNewIngName] = useState('');
    const [newIngCat, setNewIngCat] = useState('fungicide');
    const [renamingIng, setRenamingIng] = useState(null); // { oldName, newName, category, originalCategory, syncProducts, isSubmitting }
    const [selectedIngDetail, setSelectedIngDetail] = useState(null);
    const [drawerSearch, setDrawerSearch] = useState('');
    const [page, setPage] = useState(1);
    const PAGE_SIZE = 20;

    // Thống kê sản phẩm chứa từng hoạt chất
    const productStatsByIng = useMemo(() => {
        const stats = {};
        products.forEach(p => {
            if (!p.active_ingredient) return;
            const ings = parseActiveIngredients(p.active_ingredient);
            ings.forEach(ing => {
                const rawName = typeof ing === 'string' ? ing : (ing?.name || '');
                const norm = rawName.replace(/\s+\d+.*$/i, '').trim();
                if (!norm) return;
                const key = norm.toLowerCase();
                if (!stats[key]) {
                    stats[key] = { displayName: norm, products: [] };
                }
                if (!stats[key].products.some(prod => prod.id === p.id)) {
                    stats[key].products.push(p);
                }
            });
        });
        return stats;
    }, [products]);

    // Hợp nhất danh mục chuẩn + tự tạo
    const allIngredients = useMemo(() => {
        const map = new Map();

        // 1. Thư viện chuẩn
        POPULAR_ACTIVE_INGREDIENTS.forEach(item => {
            map.set(item.name.toLowerCase(), {
                name: item.name,
                category: item.category,
                aliases: item.aliases || [],
                isCustom: false
            });
        });

        // 2. Custom từ người dùng
        customIngredients.forEach(item => {
            const name = typeof item === 'string' ? item : item.name;
            const category = typeof item === 'object' && item.category ? item.category : 'custom';
            const key = name.toLowerCase();
            if (!map.has(key)) {
                map.set(key, { name, category, isCustom: true });
            }
        });

        // 3. Từ sản phẩm thực tế trong kho nếu chưa có
        Object.values(productStatsByIng).forEach(entry => {
            const key = entry.displayName.toLowerCase();
            if (!map.has(key)) {
                map.set(key, { name: entry.displayName, category: 'custom', isCustom: true });
            }
        });

        return Array.from(map.values()).sort((a, b) => {
            const countA = productStatsByIng[a.name.toLowerCase()]?.products.length || 0;
            const countB = productStatsByIng[b.name.toLowerCase()]?.products.length || 0;
            if (countB !== countA) return countB - countA;
            return a.name.localeCompare(b.name, 'vi');
        });
    }, [customIngredients, productStatsByIng]);

    // Lọc theo Category & Search
    const filteredIngredients = useMemo(() => {
        let list = allIngredients;

        if (selectedCategory === 'in_use') {
            list = list.filter(item => (productStatsByIng[item.name.toLowerCase()]?.products.length || 0) > 0);
        } else if (selectedCategory === 'custom') {
            list = list.filter(item => item.isCustom);
        } else if (selectedCategory !== 'all') {
            list = list.filter(item => item.category === selectedCategory);
        }

        if (searchTerm.trim()) {
            const term = searchTerm.toLowerCase();
            const termNoAccent = removeAccents(term);
            list = list.filter(item => {
                const n = item.name.toLowerCase();
                const aliases = (item.aliases || []).join(' ').toLowerCase();
                return n.includes(term) || removeAccents(n).includes(termNoAccent) ||
                       aliases.includes(term) || removeAccents(aliases).includes(termNoAccent);
            });
        }

        return list;
    }, [allIngredients, selectedCategory, searchTerm, productStatsByIng]);

    // Reset page khi thay đổi tìm kiếm hoặc bộ lọc
    useEffect(() => {
        setPage(1);
    }, [searchTerm, selectedCategory]);

    const paginatedIngredients = useMemo(() => {
        const start = (page - 1) * PAGE_SIZE;
        return filteredIngredients.slice(start, start + PAGE_SIZE);
    }, [filteredIngredients, page]);

    const handleAdd = () => {
        if (!newIngName.trim()) return;
        const name = newIngName.trim();
        const updated = saveCustomActiveIngredient(name, newIngCat);
        setCustomIngredients(updated || getCustomActiveIngredients());
        setNewIngName('');
        onToast?.({ message: `Đã thêm hoạt chất "${name}" vào thư viện`, type: 'success' });
    };

    const handleDeleteCustom = (e, name) => {
        e.stopPropagation();
        const updated = removeCustomActiveIngredient(name);
        setCustomIngredients(updated || []);
        onToast?.({ message: `Đã xóa hoạt chất "${name}"`, type: 'info' });
    };

    // Đổi tên hoạt chất và đồng bộ sản phẩm nếu cần
    const handleConfirmRename = async () => {
        if (!renamingIng || !renamingIng.newName.trim()) return;
        const { oldName, newName, category, syncProducts } = renamingIng;
        const trimmedNew = newName.trim();
        if (oldName === trimmedNew && category === renamingIng.originalCategory) {
            setRenamingIng(null);
            return;
        }

        setRenamingIng(prev => ({ ...prev, isSubmitting: true }));
        try {
            // 1. Cập nhật trong custom active ingredients
            const updated = updateCustomActiveIngredient(oldName, trimmedNew, category);
            setCustomIngredients(updated || getCustomActiveIngredients());

            // 2. Nếu có sản phẩm và người dùng tick chọn đồng bộ
            const targetProducts = productStatsByIng[oldName.toLowerCase()]?.products || [];
            if (syncProducts && targetProducts.length > 0) {
                await Promise.all(
                    targetProducts.map(p => {
                        const newActive = replaceIngredientInProductString(p.active_ingredient, oldName, trimmedNew);
                        return axios.put(`/api/products/${p.id}`, {
                            ...p,
                            active_ingredient: newActive
                        });
                    })
                );
                onUpdate?.();
                onToast?.({
                    message: `Đã đổi tên hoạt chất thành "${trimmedNew}" (đồng bộ ${targetProducts.length} sản phẩm)`,
                    type: 'success'
                });
            } else {
                onToast?.({
                    message: `Đã đổi tên hoạt chất thành "${trimmedNew}"`,
                    type: 'success'
                });
            }

            setRenamingIng(null);
        } catch (err) {
            console.error('Error renaming active ingredient:', err);
            onToast?.({ message: `Lỗi cập nhật hoạt chất: ${err.message}`, type: 'error' });
            setRenamingIng(prev => ({ ...prev, isSubmitting: false }));
        }
    };

    return (
        <div className="space-y-6">
            {/* THANH ĐIỀU KHIỂN & THÊM MỚI */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-black/[0.02] dark:bg-white/[0.02] p-4 rounded-3xl border border-stone-300/60 dark:border-white/10">
                <div className="relative flex-1 max-w-md">
                    <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Tìm tên hoạt chất, tên thương mại (VD: Azoxystrobin, Amistar)..."
                        className="w-full pl-9 pr-8 py-2 text-xs font-bold rounded-2xl bg-white dark:bg-black/30 border border-stone-300/70 dark:border-white/10 outline-none text-stone-800 dark:text-stone-100 placeholder:text-stone-400 focus:border-emerald-600"
                    />
                    {searchTerm && (
                        <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600">
                            <X size={13} />
                        </button>
                    )}
                </div>

                {/* THÊM HOẠT CHẤT MỚI */}
                <div className="flex items-center gap-2 flex-wrap">
                    <input
                        type="text"
                        value={newIngName}
                        onChange={(e) => setNewIngName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                        placeholder="Tên hoạt chất mới..."
                        className="px-3.5 py-2 text-xs font-bold rounded-2xl bg-white dark:bg-black/30 border border-stone-300/70 dark:border-white/10 outline-none text-stone-800 dark:text-stone-100 placeholder:text-stone-400 focus:border-emerald-600"
                    />
                    <select
                        value={newIngCat}
                        onChange={(e) => setNewIngCat(e.target.value)}
                        className="px-3 py-2 text-xs font-bold rounded-2xl bg-white dark:bg-black/30 border border-stone-300/70 dark:border-white/10 outline-none text-stone-800 dark:text-stone-100 cursor-pointer"
                    >
                        <option value="fungicide">Trừ nấm / Bệnh</option>
                        <option value="insecticide">Trừ sâu / Rầy</option>
                        <option value="herbicide">Trừ cỏ</option>
                        <option value="pgr">Dưỡng / Sinh trưởng</option>
                    </select>
                    <button
                        type="button"
                        onClick={handleAdd}
                        className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-[#2d5016] text-white rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm hover:scale-[1.02] transition-transform cursor-pointer"
                    >
                        <Plus size={14} strokeWidth={3} /> Thêm Hoạt Chất
                    </button>
                </div>
            </div>

            {/* BANNER ĐỔI TÊN HOẠT CHẤT ĐỒNG BỘ */}
            <AnimatePresence>
                {renamingIng && (
                    <m.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="p-5 rounded-3xl bg-emerald-500/10 border border-emerald-500/30 space-y-4 shadow-sm"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <h4 className="font-black text-sm text-emerald-950 dark:text-emerald-200 flex items-center gap-2">
                                    <Edit2 size={16} className="text-emerald-600" />
                                    Sửa tên & Phân loại hoạt chất
                                </h4>
                                <p className="text-xs text-stone-600 dark:text-stone-400 mt-0.5">
                                    Đang sửa hoạt chất gốc: <strong className="text-emerald-800 dark:text-emerald-300 font-bold">"{renamingIng.oldName}"</strong>
                                </p>
                            </div>
                            <button onClick={() => setRenamingIng(null)} className="text-stone-400 hover:text-stone-600 p-1 cursor-pointer">
                                <X size={16} />
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                            <div className="md:col-span-5">
                                <label className="block text-[11px] font-bold text-stone-500 dark:text-stone-400 mb-1">Tên hoạt chất đúng:</label>
                                <input
                                    type="text"
                                    autoFocus
                                    value={renamingIng.newName}
                                    onChange={(e) => setRenamingIng(prev => ({ ...prev, newName: e.target.value }))}
                                    onKeyDown={(e) => e.key === 'Enter' && handleConfirmRename()}
                                    placeholder="Nhập tên hoạt chất chuẩn..."
                                    className="w-full px-4 py-2 text-xs font-bold rounded-2xl bg-white dark:bg-black/30 border border-stone-300/70 dark:border-white/10 outline-none text-stone-900 dark:text-stone-100 focus:border-emerald-600"
                                />
                            </div>

                            <div className="md:col-span-4">
                                <label className="block text-[11px] font-bold text-stone-500 dark:text-stone-400 mb-1">Phân loại công dụng:</label>
                                <select
                                    value={renamingIng.category}
                                    onChange={(e) => setRenamingIng(prev => ({ ...prev, category: e.target.value }))}
                                    className="w-full px-3 py-2 text-xs font-bold rounded-2xl bg-white dark:bg-[#181f19] border border-stone-300/70 dark:border-white/10 outline-none text-stone-800 dark:text-stone-200 focus:border-emerald-600 cursor-pointer"
                                >
                                    <option value="fungicide">Trừ nấm / Bệnh</option>
                                    <option value="insecticide">Trừ sâu / Rầy</option>
                                    <option value="herbicide">Trừ cỏ</option>
                                    <option value="pgr">Dưỡng / Sinh trưởng</option>
                                    <option value="custom">Cửa hàng tự thêm</option>
                                </select>
                            </div>

                            <div className="md:col-span-3 flex items-end gap-2 pt-2 md:pt-5">
                                <button
                                    type="button"
                                    disabled={renamingIng.isSubmitting || !renamingIng.newName.trim()}
                                    onClick={handleConfirmRename}
                                    className="flex-1 py-2 px-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-2xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50 cursor-pointer"
                                >
                                    <Check size={14} strokeWidth={3} />
                                    <span>{renamingIng.isSubmitting ? "Đang lưu..." : "Lưu Sửa Đổi"}</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setRenamingIng(null)}
                                    className="py-2 px-3 bg-black/5 dark:bg-white/5 text-stone-600 dark:text-stone-300 rounded-2xl text-xs font-bold hover:bg-black/10 cursor-pointer"
                                >
                                    Hủy
                                </button>
                            </div>
                        </div>

                        {/* Tự động cập nhật các sản phẩm đang chứa hoạt chất này */}
                        {(productStatsByIng[renamingIng.oldName.toLowerCase()]?.products.length || 0) > 0 && (
                            <div className="pt-2 border-t border-emerald-500/20 flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="sync-prod-check-ing"
                                    checked={renamingIng.syncProducts}
                                    onChange={(e) => setRenamingIng(prev => ({ ...prev, syncProducts: e.target.checked }))}
                                    className="w-4 h-4 rounded text-emerald-600 accent-emerald-600 cursor-pointer"
                                />
                                <label htmlFor="sync-prod-check-ing" className="text-xs font-semibold text-stone-700 dark:text-stone-300 cursor-pointer select-none">
                                    Đồng bộ cập nhật tên mới cho <strong>{productStatsByIng[renamingIng.oldName.toLowerCase()]?.products.length}</strong> sản phẩm đang dùng hoạt chất này
                                </label>
                            </div>
                        )}
                    </m.div>
                )}
            </AnimatePresence>

            {/* TABS LỌC NHÓM CÔNG DỤNG */}
            <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-black uppercase text-stone-500 tracking-wider mr-1">Phân loại:</span>
                {[
                    { id: 'all', label: 'Tất cả' },
                    { id: 'in_use', label: 'Đang dùng trong kho', icon: Store },
                    { id: 'fungicide', label: 'Trừ nấm / Bệnh', icon: ShieldCheck },
                    { id: 'insecticide', label: 'Trừ sâu / Rầy', icon: Bug },
                    { id: 'herbicide', label: 'Trừ cỏ', icon: Leaf },
                    { id: 'pgr', label: 'Sinh trưởng / Phân', icon: Sprout },
                    { id: 'custom', label: 'Cửa hàng tự thêm', icon: Sparkles },
                ].map(cat => {
                    const Icon = cat.icon;
                    const isActive = selectedCategory === cat.id;
                    return (
                        <button
                            key={cat.id}
                            type="button"
                            onClick={() => setSelectedCategory(cat.id)}
                            className={cn(
                                "px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer",
                                isActive
                                    ? "bg-emerald-700 text-white shadow-xs font-black"
                                    : "bg-black/5 dark:bg-white/5 text-stone-600 dark:text-stone-300 hover:bg-black/10"
                            )}
                        >
                            {Icon && <Icon size={12} />}
                            <span>{cat.label}</span>
                        </button>
                    );
                })}
            </div>

            {/* GRID CÁC THẺ HOẠT CHẤT */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
                {paginatedIngredients.map(item => {
                    const countEntry = productStatsByIng[item.name.toLowerCase()];
                    const productCount = countEntry?.products.length || 0;
                    const catMeta = CATEGORY_LABELS[item.category] || CATEGORY_LABELS.custom;

                    return (
                        <div
                            key={item.name}
                            onClick={() => setSelectedIngDetail(productCount > 0 ? { name: item.name, products: countEntry.products } : null)}
                            className={cn(
                                "p-4 rounded-3xl border transition-all flex flex-col justify-between group",
                                productCount > 0
                                    ? "bg-white/80 dark:bg-[#141f17]/80 border-stone-300/60 dark:border-white/10 hover:border-emerald-500/50 hover:shadow-md cursor-pointer"
                                    : "bg-black/[0.01] dark:bg-white/[0.01] border-dashed border-stone-300/50 dark:border-white/5 opacity-70"
                            )}
                        >
                            <div>
                                <div className="flex items-start justify-between gap-1.5 mb-1.5">
                                    <h4 className="font-black text-sm text-stone-900 dark:text-stone-100 group-hover:text-emerald-700 dark:group-hover:text-emerald-300 transition-colors line-clamp-1">
                                        {item.name}
                                    </h4>
                                    <div className="flex items-center gap-0.5 shrink-0">
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setRenamingIng({
                                                    oldName: item.name,
                                                    newName: item.name,
                                                    category: item.category || 'custom',
                                                    originalCategory: item.category || 'custom',
                                                    syncProducts: true,
                                                    isSubmitting: false
                                                });
                                            }}
                                            className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-stone-400 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-all cursor-pointer"
                                            title="Sửa tên hoạt chất / phân loại"
                                        >
                                            <Edit2 size={12} />
                                        </button>
                                        {item.isCustom && (
                                            <button
                                                type="button"
                                                onClick={(e) => handleDeleteCustom(e, item.name)}
                                                className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-stone-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-all cursor-pointer"
                                                title="Xóa hoạt chất tự tạo này"
                                            >
                                                <Trash2 size={12} />
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <span className={cn(
                                    "inline-block text-[9px] font-black uppercase px-2 py-0.5 rounded-md border",
                                    catMeta?.color || "bg-stone-100 text-stone-600"
                                )}>
                                    {catMeta?.label || item.category}
                                </span>

                                {item.aliases && item.aliases.length > 0 && (
                                    <p className="text-[10px] text-stone-400 italic line-clamp-1 mt-1">
                                        Gợi nhớ: {item.aliases.slice(0, 3).join(', ')}
                                    </p>
                                )}
                            </div>

                            <div className="pt-2 mt-2 border-t border-stone-200/50 dark:border-white/5 flex items-center justify-between text-[11px]">
                                <span className="text-stone-500">Sản phẩm áp dụng:</span>
                                <span className={cn(
                                    "font-black tabular-nums px-1.5 py-0.2 rounded-md",
                                    productCount > 0 ? "bg-emerald-600/15 text-emerald-800 dark:text-emerald-300" : "text-stone-400"
                                )}>
                                    {productCount} SP
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* PHÂN TRANG */}
            <CatalogPagination
                currentPage={page}
                totalItems={filteredIngredients.length}
                pageSize={PAGE_SIZE}
                onPageChange={setPage}
                itemLabel="hoạt chất"
            />

            {/* MODAL / DRAWER SẢN PHẨM CHỨA HOẠT CHẤT NÀY */}
            {typeof document !== 'undefined' && createPortal(
                <AnimatePresence>
                    {selectedIngDetail && (
                        <div className="fixed inset-0 z-[999999] isolate flex justify-end">
                            <m.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="fixed inset-0 bg-stone-900/60 dark:bg-black/75 backdrop-blur-xs"
                                onClick={() => {
                                    setSelectedIngDetail(null);
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
                                            <FlaskConical size={20} />
                                        </div>
                                        <div className="min-w-0">
                                            <h3 className="font-black text-base text-stone-900 dark:text-stone-100 truncate">
                                                {selectedIngDetail.name}
                                            </h3>
                                            <p className="text-xs text-stone-500 dark:text-stone-400 font-medium">
                                                Có <span className="text-emerald-700 dark:text-emerald-400 font-bold">{selectedIngDetail.products?.length || 0}</span> sản phẩm chứa hoạt chất này
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1 shrink-0">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const item = allIngredients.find(i => i.name.toLowerCase() === selectedIngDetail.name.toLowerCase()) || { name: selectedIngDetail.name, category: 'custom' };
                                                setRenamingIng({
                                                    oldName: item.name,
                                                    newName: item.name,
                                                    category: item.category || 'custom',
                                                    originalCategory: item.category || 'custom',
                                                    syncProducts: true,
                                                    isSubmitting: false
                                                });
                                                setSelectedIngDetail(null);
                                                setDrawerSearch('');
                                            }}
                                            className="p-2 rounded-2xl hover:bg-emerald-500/10 text-stone-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors cursor-pointer"
                                            title="Đổi tên hoạt chất này"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                        <button
                                            onClick={() => {
                                                setSelectedIngDetail(null);
                                                setDrawerSearch('');
                                            }}
                                            className="p-2 rounded-2xl hover:bg-stone-200/60 dark:hover:bg-white/10 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition-colors shrink-0 cursor-pointer"
                                        >
                                            <X size={18} />
                                        </button>
                                    </div>
                                </div>

                                {/* Quick filter inside drawer */}
                                {(selectedIngDetail.products?.length || 0) > 3 && (
                                    <div className="px-5 pt-3 pb-1">
                                        <div className="relative">
                                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                                            <input
                                                type="text"
                                                value={drawerSearch}
                                                onChange={(e) => setDrawerSearch(e.target.value)}
                                                placeholder="Lọc sản phẩm trong hoạt chất..."
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
                                    {(selectedIngDetail.products || [])
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
                                                    <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold line-clamp-1 mt-0.5">
                                                        {p.active_ingredient}
                                                    </p>
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
                                                            setSelectedIngDetail(null);
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
