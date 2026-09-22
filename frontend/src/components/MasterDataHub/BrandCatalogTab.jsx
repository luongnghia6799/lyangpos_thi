import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import { m, AnimatePresence } from 'framer-motion';
import { 
    Tags, Search, Plus, Trash2, Edit2, X, Check, 
    ExternalLink, AlertTriangle, Building2, Layers
} from 'lucide-react';
import { cn, removeAccents } from '../../lib/utils';
import CatalogPagination from './CatalogPagination';

export default function BrandCatalogTab({ products = [], onUpdate, onToast, onOpenEditProduct }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [customBrands, setCustomBrands] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem('lyang_custom_brands') || '[]');
        } catch {
            return [];
        }
    });
    const [newBrandName, setNewBrandName] = useState('');
    const [renamingBrand, setRenamingBrand] = useState(null); // { oldName, newName, isSubmitting }
    const [selectedBrandDetail, setSelectedBrandDetail] = useState(null);
    const [drawerSearch, setDrawerSearch] = useState('');
    const [page, setPage] = useState(1);
    const PAGE_SIZE = 16;

    // Thống kê sản phẩm theo từng hãng
    const brandStats = useMemo(() => {
        const stats = {};
        products.forEach(p => {
            const b = (p.brand || '').trim();
            const key = b || '__no_brand__';
            if (!stats[key]) {
                stats[key] = {
                    name: b || '-- Chưa có hãng --',
                    rawName: b,
                    isMissing: !b,
                    products: []
                };
            }
            stats[key].products.push(p);
        });
        return stats;
    }, [products]);

    // Hợp nhất danh sách tất cả các hãng
    const allBrandsList = useMemo(() => {
        const set = new Set(customBrands);
        Object.keys(brandStats).forEach(key => {
            if (key !== '__no_brand__' && brandStats[key].rawName) {
                set.add(brandStats[key].rawName);
            }
        });
        return Array.from(set).filter(Boolean).sort((a, b) => {
            const countA = brandStats[a]?.products.length || 0;
            const countB = brandStats[b]?.products.length || 0;
            if (countB !== countA) return countB - countA;
            return a.localeCompare(b, 'vi');
        });
    }, [customBrands, brandStats]);

    const filteredBrands = useMemo(() => {
        if (!searchTerm.trim()) return allBrandsList;
        const term = searchTerm.toLowerCase();
        const termNoAccent = removeAccents(term);
        return allBrandsList.filter(b => {
            const low = b.toLowerCase();
            return low.includes(term) || removeAccents(low).includes(termNoAccent);
        });
    }, [allBrandsList, searchTerm]);

    // Reset page khi tìm kiếm
    useEffect(() => {
        setPage(1);
    }, [searchTerm]);

    const paginatedBrands = useMemo(() => {
        const start = (page - 1) * PAGE_SIZE;
        return filteredBrands.slice(start, start + PAGE_SIZE);
    }, [filteredBrands, page]);

    const handleAddBrand = () => {
        const trimmed = newBrandName.trim();
        if (!trimmed) return;
        if (allBrandsList.some(b => b.toLowerCase() === trimmed.toLowerCase())) {
            onToast?.({ message: `Hãng "${trimmed}" đã có trong danh mục`, type: 'warning' });
            return;
        }
        const updated = [...customBrands, trimmed];
        setCustomBrands(updated);
        localStorage.setItem('lyang_custom_brands', JSON.stringify(updated));
        setNewBrandName('');
        onToast?.({ message: `Đã thêm hãng "${trimmed}"`, type: 'success' });
    };

    // Đổi tên hãng đồng bộ hàng loạt cho tất cả sản phẩm
    const handleConfirmRename = async () => {
        if (!renamingBrand || !renamingBrand.newName.trim()) return;
        const { oldName, newName } = renamingBrand;
        if (oldName === newName.trim()) {
            setRenamingBrand(null);
            return;
        }

        const targetProducts = brandStats[oldName]?.products || [];
        setRenamingBrand(prev => ({ ...prev, isSubmitting: true }));

        try {
            // Cập nhật từng sản phẩm thuộc hãng này
            await Promise.all(
                targetProducts.map(p =>
                    axios.put(`/api/products/${p.id}`, { ...p, brand: newName.trim() })
                )
            );

            // Cập nhật trong custom brands nếu có
            const updatedCustom = customBrands.map(b => (b === oldName ? newName.trim() : b));
            setCustomBrands(updatedCustom);
            localStorage.setItem('lyang_custom_brands', JSON.stringify(updatedCustom));

            onToast?.({ message: `Đã đổi tên hãng cho ${targetProducts.length} sản phẩm thành công`, type: 'success' });
            onUpdate?.();
            setRenamingBrand(null);
        } catch (err) {
            onToast?.({ message: `Lỗi cập nhật hãng: ${err.message}`, type: 'error' });
            setRenamingBrand(prev => ({ ...prev, isSubmitting: false }));
        }
    };

    return (
        <div className="space-y-6">
            {/* THANH TÌM KIẾM & THÊM MỚI */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-black/[0.02] dark:bg-white/[0.02] p-4 rounded-3xl border border-stone-300/60 dark:border-white/10">
                <div className="relative flex-1 max-w-md">
                    <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Tìm kiếm hãng sản xuất, thương hiệu..."
                        className="w-full pl-9 pr-8 py-2 text-xs font-bold rounded-2xl bg-white dark:bg-black/30 border border-stone-300/70 dark:border-white/10 outline-none text-stone-800 dark:text-stone-100 placeholder:text-stone-400 focus:border-emerald-600"
                    />
                    {searchTerm && (
                        <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600">
                            <X size={13} />
                        </button>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    <input
                        type="text"
                        value={newBrandName}
                        onChange={(e) => setNewBrandName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddBrand()}
                        placeholder="Tên hãng mới (VD: Syngenta, Bayer)..."
                        className="px-3.5 py-2 text-xs font-bold rounded-2xl bg-white dark:bg-black/30 border border-stone-300/70 dark:border-white/10 outline-none text-stone-800 dark:text-stone-100 placeholder:text-stone-400 focus:border-emerald-600"
                    />
                    <button
                        type="button"
                        onClick={handleAddBrand}
                        className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-[#2d5016] text-white rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm hover:scale-[1.02] transition-transform cursor-pointer"
                    >
                        <Plus size={14} strokeWidth={3} /> Thêm Hãng
                    </button>
                </div>
            </div>

            {/* MODAL ĐỔI TÊN HÃNG ĐỒNG BỘ */}
            <AnimatePresence>
                {renamingBrand && (
                    <m.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="p-5 rounded-3xl bg-emerald-500/10 border border-emerald-500/25 space-y-3"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <h4 className="font-black text-sm text-emerald-950 dark:text-emerald-200">
                                    Đổi tên hãng đồng bộ toàn bộ sản phẩm
                                </h4>
                                <p className="text-xs text-stone-600 dark:text-stone-400">
                                    Hệ thống sẽ cập nhật tên hãng mới cho tất cả <strong>{brandStats[renamingBrand.oldName]?.products.length || 0}</strong> sản phẩm đang thuộc hãng "{renamingBrand.oldName}".
                                </p>
                            </div>
                            <button onClick={() => setRenamingBrand(null)} className="text-stone-400 hover:text-stone-600 p-1">
                                <X size={16} />
                            </button>
                        </div>

                        <div className="flex items-center gap-3">
                            <input
                                type="text"
                                autoFocus
                                value={renamingBrand.newName}
                                onChange={(e) => setRenamingBrand(prev => ({ ...prev, newName: e.target.value }))}
                                onKeyDown={(e) => e.key === 'Enter' && handleConfirmRename()}
                                placeholder="Nhập tên hãng chuẩn mới..."
                                className="flex-1 px-4 py-2 text-xs font-bold rounded-2xl bg-white dark:bg-black/30 border border-stone-300/70 dark:border-white/10 outline-none text-stone-900 dark:text-stone-100 focus:border-emerald-600"
                            />
                            <button
                                type="button"
                                disabled={renamingBrand.isSubmitting || !renamingBrand.newName.trim()}
                                onClick={handleConfirmRename}
                                className="px-5 py-2 bg-emerald-600 text-white rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm hover:bg-emerald-700 disabled:opacity-50 cursor-pointer"
                            >
                                <Check size={14} strokeWidth={3} />
                                <span>{renamingBrand.isSubmitting ? "Đang lưu..." : "Cập nhật đồng bộ"}</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setRenamingBrand(null)}
                                className="px-4 py-2 bg-black/5 dark:bg-white/5 text-stone-600 dark:text-stone-300 rounded-2xl text-xs font-bold hover:bg-black/10 cursor-pointer"
                            >
                                Hủy
                            </button>
                        </div>
                    </m.div>
                )}
            </AnimatePresence>

            {/* GRID CÁC HÃNG */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
                {paginatedBrands.map(brandName => {
                    const stats = brandStats[brandName] || { products: [] };
                    const count = stats.products.length;

                    return (
                        <div
                            key={brandName}
                            onClick={() => setSelectedBrandDetail(count > 0 ? { name: brandName, products: stats.products } : null)}
                            className="p-4 rounded-3xl bg-white/80 dark:bg-[#141f17]/80 border border-stone-300/60 dark:border-white/10 hover:border-emerald-500/50 hover:shadow-md transition-all flex flex-col justify-between group cursor-pointer"
                        >
                            <div className="flex items-start justify-between gap-2 mb-3">
                                <div className="flex items-center gap-2.5 min-w-0">
                                    <div className="w-10 h-10 rounded-2xl bg-emerald-600/10 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0">
                                        <Building2 size={20} />
                                    </div>
                                    <div className="min-w-0">
                                        <h4 className="font-black text-sm text-stone-900 dark:text-stone-100 group-hover:text-emerald-700 dark:group-hover:text-emerald-300 transition-colors truncate">
                                            {brandName}
                                        </h4>
                                        <span className="text-[10px] text-stone-400">Thương hiệu</span>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setRenamingBrand({ oldName: brandName, newName: brandName, isSubmitting: false });
                                    }}
                                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-stone-400 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-opacity"
                                    title="Đổi tên hãng đồng bộ"
                                >
                                    <Edit2 size={13} />
                                </button>
                            </div>

                            <div className="pt-2 border-t border-stone-200/50 dark:border-white/5 flex items-center justify-between text-xs">
                                <span className="text-stone-500 text-[11px]">Sản phẩm thuộc hãng:</span>
                                <span className={cn(
                                    "font-black px-2 py-0.5 rounded-lg tabular-nums text-xs",
                                    count > 0
                                        ? "bg-emerald-600/15 text-emerald-800 dark:text-emerald-300"
                                        : "bg-black/5 dark:bg-white/5 text-stone-400"
                                )}
                                >
                                    {count} SP
                                </span>
                            </div>
                        </div>
                    );
                })}

                {/* SẢN PHẨM CHƯA CÓ HÃNG (chỉ hiển thị ở trang 1 nếu có) */}
                {page === 1 && brandStats['__no_brand__'] && brandStats['__no_brand__'].products.length > 0 && (
                    <div
                        onClick={() => setSelectedBrandDetail({
                            name: '-- Chưa có hãng --',
                            products: brandStats['__no_brand__'].products
                        })}
                        className="p-4 rounded-3xl bg-amber-500/5 border border-amber-500/20 hover:border-amber-500/40 hover:shadow-md transition-all flex flex-col justify-between group cursor-pointer"
                    >
                        <div className="flex items-center gap-2.5 mb-3">
                            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0">
                                <AlertTriangle size={20} />
                            </div>
                            <div>
                                <h4 className="font-black text-sm text-amber-900 dark:text-amber-200">Chưa có hãng</h4>
                                <span className="text-[10px] text-amber-600/70">Cần bổ sung</span>
                            </div>
                        </div>
                        <div className="pt-2 border-t border-amber-500/15 flex items-center justify-between text-xs">
                            <span className="text-stone-500 text-[11px]">Sản phẩm chưa gán hãng:</span>
                            <span className="font-black bg-amber-500/20 text-amber-900 dark:text-amber-200 px-2 py-0.5 rounded-lg tabular-nums text-xs">
                                {brandStats['__no_brand__'].products.length} SP
                            </span>
                        </div>
                    </div>
                )}
            </div>

            {/* PHÂN TRANG */}
            <CatalogPagination
                currentPage={page}
                totalItems={filteredBrands.length}
                pageSize={PAGE_SIZE}
                onPageChange={setPage}
                itemLabel="hãng sản xuất"
            />

            {/* DRAWER SẢN PHẨM CỦA HÃNG NÀY */}
            {typeof document !== 'undefined' && createPortal(
                <AnimatePresence>
                    {selectedBrandDetail && (
                        <div className="fixed inset-0 z-[999999] isolate flex justify-end">
                            <m.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="fixed inset-0 bg-stone-900/60 dark:bg-black/75 backdrop-blur-xs"
                                onClick={() => {
                                    setSelectedBrandDetail(null);
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
                                            <Building2 size={20} />
                                        </div>
                                        <div className="min-w-0">
                                            <h3 className="font-black text-base text-stone-900 dark:text-stone-100 truncate">
                                                {selectedBrandDetail.name}
                                            </h3>
                                            <p className="text-xs text-stone-500 dark:text-stone-400 font-medium">
                                                Có <span className="text-emerald-700 dark:text-emerald-400 font-bold">{selectedBrandDetail.products?.length || 0}</span> sản phẩm thuộc hãng này
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => {
                                            setSelectedBrandDetail(null);
                                            setDrawerSearch('');
                                        }}
                                        className="p-2 rounded-2xl hover:bg-stone-200/60 dark:hover:bg-white/10 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition-colors shrink-0"
                                    >
                                        <X size={18} />
                                    </button>
                                </div>

                                {/* Quick filter inside drawer */}
                                {(selectedBrandDetail.products?.length || 0) > 3 && (
                                    <div className="px-5 pt-3 pb-1">
                                        <div className="relative">
                                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                                            <input
                                                type="text"
                                                value={drawerSearch}
                                                onChange={(e) => setDrawerSearch(e.target.value)}
                                                placeholder="Lọc sản phẩm trong hãng..."
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
                                    {(selectedBrandDetail.products || [])
                                        .filter(p => {
                                            if (!drawerSearch.trim()) return true;
                                            const t = drawerSearch.toLowerCase();
                                            return (p.name && p.name.toLowerCase().includes(t)) ||
                                                   (p.code && p.code.toLowerCase().includes(t));
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
                                                        <span className="bg-emerald-500/15 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 font-bold px-2 py-0.5 rounded-md">
                                                            Tồn: {p.stock ?? 0} {p.unit}
                                                        </span>
                                                    </div>
                                                </div>
                                                {onOpenEditProduct && (
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setSelectedBrandDetail(null);
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
