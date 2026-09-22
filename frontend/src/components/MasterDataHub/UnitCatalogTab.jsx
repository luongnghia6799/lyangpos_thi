import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { m, AnimatePresence } from 'framer-motion';
import { 
    Layers, Search, Plus, Check, Droplets, Leaf, Boxes, 
    Store, Package, ExternalLink, X, Tag
} from 'lucide-react';
import { cn, normalizeUOM, removeAccents } from '../../lib/utils';
import { UNIT_CATEGORIES, DEFAULT_COMMON_UNITS } from '../../data/unitsData';
import CatalogPagination from './CatalogPagination';

export default function UnitCatalogTab({ products = [], onToast, onOpenEditProduct }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedGroup, setSelectedGroup] = useState('all');
    const [customUnits, setCustomUnits] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem('lyang_custom_units') || '[]');
        } catch {
            return [];
        }
    });
    const [newUnitInput, setNewUnitInput] = useState('');
    const [selectedUnitDetail, setSelectedUnitDetail] = useState(null);
    const [drawerSearch, setDrawerSearch] = useState('');
    const [page, setPage] = useState(1);
    const PAGE_SIZE = 20;

    // Thống kê sản phẩm theo từng ĐVT (cả ĐVT chính và ĐVT phụ)
    const unitStats = useMemo(() => {
        const stats = {};
        products.forEach(p => {
            if (p.unit) {
                const u = normalizeUOM(p.unit);
                if (!stats[u]) stats[u] = { name: u, primaryCount: 0, secondaryCount: 0, products: [] };
                stats[u].primaryCount += 1;
                if (!stats[u].products.some(prod => prod.id === p.id)) {
                    stats[u].products.push(p);
                }
            }
            if (p.secondary_unit) {
                const u = normalizeUOM(p.secondary_unit);
                if (!stats[u]) stats[u] = { name: u, primaryCount: 0, secondaryCount: 0, products: [] };
                stats[u].secondaryCount += 1;
                if (!stats[u].products.some(prod => prod.id === p.id)) {
                    stats[u].products.push(p);
                }
            }
        });
        return stats;
    }, [products]);

    // Tổng hợp danh sách tất cả các ĐVT
    const allUnitsList = useMemo(() => {
        const set = new Set([
            ...DEFAULT_COMMON_UNITS,
            ...customUnits,
            ...Object.keys(unitStats)
        ]);
        return Array.from(set).map(u => normalizeUOM(u)).filter(Boolean).sort((a, b) => {
            const countA = (unitStats[a]?.primaryCount || 0) + (unitStats[a]?.secondaryCount || 0);
            const countB = (unitStats[b]?.primaryCount || 0) + (unitStats[b]?.secondaryCount || 0);
            return countB - countA;
        });
    }, [customUnits, unitStats]);

    // Lọc theo nhóm
    const filteredUnits = useMemo(() => {
        let list = allUnitsList;

        if (selectedGroup === 'liquid') {
            const liquidSet = new Set(UNIT_CATEGORIES.find(c => c.id === 'liquid')?.units || []);
            list = list.filter(u => liquidSet.has(u));
        } else if (selectedGroup === 'solid') {
            const solidSet = new Set(UNIT_CATEGORIES.find(c => c.id === 'solid')?.units || []);
            list = list.filter(u => solidSet.has(u));
        } else if (selectedGroup === 'packaging') {
            const packSet = new Set(UNIT_CATEGORIES.find(c => c.id === 'packaging')?.units || []);
            list = list.filter(u => packSet.has(u));
        } else if (selectedGroup === 'in_use') {
            list = list.filter(u => unitStats[u] && (unitStats[u].primaryCount > 0 || unitStats[u].secondaryCount > 0));
        }

        if (searchTerm.trim()) {
            const term = searchTerm.toLowerCase();
            const termNoAccent = removeAccents(term);
            list = list.filter(u => {
                const low = u.toLowerCase();
                return low.includes(term) || removeAccents(low).includes(termNoAccent);
            });
        }

        return list;
    }, [allUnitsList, selectedGroup, searchTerm, unitStats]);

    // Reset page khi tìm kiếm hoặc đổi nhóm
    useEffect(() => {
        setPage(1);
    }, [searchTerm, selectedGroup]);

    const paginatedUnits = useMemo(() => {
        const start = (page - 1) * PAGE_SIZE;
        return filteredUnits.slice(start, start + PAGE_SIZE);
    }, [filteredUnits, page]);

    const allGroupsWithCounts = useMemo(() => [
        { id: 'all', label: 'Tất cả ĐVT', count: allUnitsList.length },
        { id: 'in_use', label: 'Đang dùng trong kho', count: Object.keys(unitStats).length, icon: Store },
        { id: 'liquid', label: 'Dung dịch / Lỏng', count: UNIT_CATEGORIES.find(c => c.id === 'liquid')?.units.length, icon: Droplets },
        { id: 'solid', label: 'Rắn / Bột / Viên', count: UNIT_CATEGORIES.find(c => c.id === 'solid')?.units.length, icon: Leaf },
        { id: 'packaging', label: 'Bao bì & Quy đổi', count: UNIT_CATEGORIES.find(c => c.id === 'packaging')?.units.length, icon: Boxes },
    ], [allUnitsList, unitStats]);

    const handleAddCustomUnit = () => {
        const clean = normalizeUOM(newUnitInput.trim());
        if (!clean) return;
        if (allUnitsList.some(u => u.toLowerCase() === clean.toLowerCase())) {
            onToast?.({ message: `ĐVT "${clean}" đã có trong danh mục`, type: 'warning' });
            return;
        }
        const updated = [...customUnits, clean];
        setCustomUnits(updated);
        localStorage.setItem('lyang_custom_units', JSON.stringify(updated));
        setNewUnitInput('');
        onToast?.({ message: `Đã thêm ĐVT "${clean}" vào danh mục`, type: 'success' });
    };

    return (
        <div className="space-y-6">
            {/* THANH ĐIỀU KHIỂN TRÊN CÙNG */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-black/[0.02] dark:bg-white/[0.02] p-4 rounded-3xl border border-stone-300/60 dark:border-white/10">
                {/* TÌM KIẾM */}
                <div className="relative flex-1 max-w-md">
                    <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Tìm kiếm đơn vị tính..."
                        className="w-full pl-9 pr-8 py-2 text-xs font-bold rounded-2xl bg-white dark:bg-black/30 border border-stone-300/70 dark:border-white/10 outline-none text-stone-800 dark:text-stone-100 placeholder:text-stone-400 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/15"
                    />
                    {searchTerm && (
                        <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600">
                            <X size={13} />
                        </button>
                    )}
                </div>

                {/* THÊM ĐVT MỚI */}
                <div className="flex items-center gap-2">
                    <input
                        type="text"
                        value={newUnitInput}
                        onChange={(e) => setNewUnitInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddCustomUnit()}
                        placeholder="Tên ĐVT mới (VD: Bịch, Cây)..."
                        className="px-3.5 py-2 text-xs font-bold rounded-2xl bg-white dark:bg-black/30 border border-stone-300/70 dark:border-white/10 outline-none text-stone-800 dark:text-stone-100 placeholder:text-stone-400 focus:border-emerald-600"
                    />
                    <button
                        type="button"
                        onClick={handleAddCustomUnit}
                        className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-[#2d5016] text-white rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm hover:scale-[1.02] transition-transform cursor-pointer"
                    >
                        <Plus size={14} strokeWidth={3} /> Thêm ĐVT
                    </button>
                </div>
            </div>

            {/* NHÓM ĐVT */}
            <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-black uppercase text-stone-500 tracking-wider mr-1">Nhóm:</span>
                {allGroupsWithCounts.map(group => {
                    const Icon = group.icon;
                    const isActive = selectedGroup === group.id;

                    return (
                        <button
                            key={group.id}
                            type="button"
                            onClick={() => setSelectedGroup(group.id)}
                            className={cn(
                                "px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer",
                                isActive
                                    ? "bg-emerald-700 text-white shadow-xs font-black"
                                    : "bg-black/5 dark:bg-white/5 text-stone-700 dark:text-stone-300 hover:bg-black/10 dark:hover:bg-white/10"
                            )}
                        >
                            {Icon && <Icon size={12} />}
                            <span>{group.label}</span>
                            <span className={cn(
                                "text-[10px] px-1.5 py-0.2 rounded-full",
                                isActive ? "bg-white/20 text-white" : "bg-black/10 dark:bg-white/10 text-stone-500"
                            )}>
                                {group.count}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* GRID CÁC THẺ ĐƠN VỊ TÍNH */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {paginatedUnits.map(unitName => {
                    const stats = unitStats[unitName] || { primaryCount: 0, secondaryCount: 0, products: [] };
                    const totalUsed = stats.primaryCount + stats.secondaryCount;
                    const isSelected = selectedUnitDetail?.name === unitName;

                    return (
                        <div
                            key={unitName}
                            onClick={() => setSelectedUnitDetail(stats.products.length > 0 ? { name: unitName, ...stats } : null)}
                            className={cn(
                                "p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between group",
                                isSelected
                                    ? "bg-emerald-500/15 border-emerald-600 shadow-md ring-2 ring-emerald-500/20"
                                    : "bg-white/80 dark:bg-[#141f17]/80 border-stone-300/60 dark:border-white/10 hover:border-emerald-500/50 hover:shadow-sm"
                            )}
                        >
                            <div className="flex items-center justify-between gap-1 mb-2">
                                <span className="font-black text-sm text-stone-800 dark:text-stone-100 group-hover:text-emerald-700 dark:group-hover:text-emerald-300 transition-colors">
                                    {unitName}
                                </span>
                                {totalUsed > 0 && (
                                    <span className="text-[10px] font-black bg-emerald-600/10 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 px-1.5 py-0.5 rounded-lg tabular-nums">
                                        {totalUsed} SP
                                    </span>
                                )}
                            </div>

                            <div className="text-[11px] text-stone-500 space-y-0.5">
                                <div className="flex justify-between">
                                    <span>ĐVT cơ bản:</span>
                                    <strong className="text-stone-700 dark:text-stone-200 tabular-nums">{stats.primaryCount}</strong>
                                </div>
                                <div className="flex justify-between">
                                    <span>ĐVT quy đổi:</span>
                                    <strong className="text-stone-700 dark:text-stone-200 tabular-nums">{stats.secondaryCount}</strong>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* PHÂN TRANG */}
            <CatalogPagination
                currentPage={page}
                totalItems={filteredUnits.length}
                pageSize={PAGE_SIZE}
                onPageChange={setPage}
                itemLabel="đơn vị tính"
            />

            {/* DRAWER / MODAL CHI TIẾT SẢN PHẨM DÙNG ĐVT NÀY */}
            {typeof document !== 'undefined' && createPortal(
                <AnimatePresence>
                    {selectedUnitDetail && (
                        <div className="fixed inset-0 z-[999999] isolate flex justify-end">
                            <m.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="fixed inset-0 bg-stone-900/60 dark:bg-black/75 backdrop-blur-xs"
                                onClick={() => {
                                    setSelectedUnitDetail(null);
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
                                            <Layers size={20} />
                                        </div>
                                        <div className="min-w-0">
                                            <h3 className="font-black text-base text-stone-900 dark:text-stone-100 truncate">
                                                ĐVT: "{selectedUnitDetail.name}"
                                            </h3>
                                            <p className="text-xs text-stone-500 dark:text-stone-400 font-medium">
                                                Có <span className="text-emerald-700 dark:text-emerald-400 font-bold">{selectedUnitDetail.products.length}</span> sản phẩm đang sử dụng
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => {
                                            setSelectedUnitDetail(null);
                                            setDrawerSearch('');
                                        }}
                                        className="p-2 rounded-2xl hover:bg-stone-200/60 dark:hover:bg-white/10 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition-colors shrink-0"
                                    >
                                        <X size={18} />
                                    </button>
                                </div>

                                {/* Quick filter inside drawer */}
                                {(selectedUnitDetail.products?.length || 0) > 3 && (
                                    <div className="px-5 pt-3 pb-1">
                                        <div className="relative">
                                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                                            <input
                                                type="text"
                                                value={drawerSearch}
                                                onChange={(e) => setDrawerSearch(e.target.value)}
                                                placeholder="Lọc sản phẩm sử dụng ĐVT này..."
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
                                    {(selectedUnitDetail.products || [])
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
                                                            Tồn: {p.stock ?? 0} {normalizeUOM(p.unit)}
                                                        </span>
                                                        {p.secondary_unit && (
                                                            <span className="bg-amber-500/10 text-amber-800 dark:text-amber-300 px-2 py-0.5 rounded-md font-medium">
                                                                1 {normalizeUOM(p.secondary_unit)} = {p.multiplier} {normalizeUOM(p.unit)}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                {onOpenEditProduct && (
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setSelectedUnitDetail(null);
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
