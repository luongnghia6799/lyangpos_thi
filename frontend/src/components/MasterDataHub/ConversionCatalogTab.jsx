import React, { useState, useEffect, useMemo } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { 
    Boxes, Search, X, Check, Save, AlertCircle, 
    ArrowRight, Sparkles, Filter, Edit3
} from 'lucide-react';
import { cn, normalizeUOM, removeAccents } from '../../lib/utils';
import UnitSelect from '../forms/UnitSelect';
import CatalogPagination from './CatalogPagination';

export default function ConversionCatalogTab({ products = [], onUpdate, onToast, onOpenEditProduct }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('has_conversion'); // 'has_conversion' | 'missing' | 'all'
    const [page, setPage] = useState(1);
    const PAGE_SIZE = 15;
    const [editingState, setEditingState] = useState({}); // { [productId]: { secondary_unit, multiplier, isSaving } }

    useEffect(() => {
        setPage(1);
    }, [searchTerm, filterStatus]);

    const conversionStats = useMemo(() => {
        let hasConv = 0;
        let missing = 0;
        const packStats = {};

        products.forEach(p => {
            if (p.secondary_unit && Number(p.multiplier) > 1) {
                hasConv++;
                const sU = normalizeUOM(p.secondary_unit);
                packStats[sU] = (packStats[sU] || 0) + 1;
            } else {
                missing++;
            }
        });

        return { hasConv, missing, packStats };
    }, [products]);

    const filteredProducts = useMemo(() => {
        let list = products;

        if (filterStatus === 'has_conversion') {
            list = list.filter(p => p.secondary_unit && Number(p.multiplier) > 1);
        } else if (filterStatus === 'missing') {
            list = list.filter(p => !p.secondary_unit || Number(p.multiplier) <= 1);
        }

        if (searchTerm.trim()) {
            const term = searchTerm.toLowerCase();
            const termNoAccent = removeAccents(term);
            list = list.filter(p => {
                const name = (p.name || '').toLowerCase();
                const code = (p.code || '').toLowerCase();
                const u = (p.unit || '').toLowerCase();
                const su = (p.secondary_unit || '').toLowerCase();
                return name.includes(term) || removeAccents(name).includes(termNoAccent) ||
                       code.includes(term) || u.includes(term) || su.includes(term);
            });
        }

        return list;
    }, [products, filterStatus, searchTerm]);

    const paginatedProducts = useMemo(() => {
        const start = (page - 1) * PAGE_SIZE;
        return filteredProducts.slice(start, start + PAGE_SIZE);
    }, [filteredProducts, page]);

    const handleFieldChange = (prodId, field, val) => {
        setEditingState(prev => {
            const current = prev[prodId] || {
                secondary_unit: products.find(p => p.id === prodId)?.secondary_unit || '',
                multiplier: products.find(p => p.id === prodId)?.multiplier || 1
            };
            return {
                ...prev,
                [prodId]: { ...current, [field]: val, isDirty: true }
            };
        });
    };

    const handleSaveRow = async (p) => {
        const row = editingState[p.id];
        if (!row || !row.isDirty) return;

        setEditingState(prev => ({
            ...prev,
            [p.id]: { ...prev[p.id], isSaving: true }
        }));

        try {
            await axios.put(`/api/products/${p.id}`, {
                ...p,
                secondary_unit: row.secondary_unit ? normalizeUOM(row.secondary_unit) : null,
                multiplier: parseFloat(row.multiplier) || 1
            });
            onToast?.({ message: `Đã lưu quy đổi cho "${p.name}"`, type: 'success' });
            onUpdate?.();
            setEditingState(prev => ({
                ...prev,
                [p.id]: { ...prev[p.id], isSaving: false, isDirty: false, isSaved: true }
            }));
            setTimeout(() => {
                setEditingState(prev => {
                    const copy = { ...prev };
                    if (copy[p.id]) copy[p.id].isSaved = false;
                    return copy;
                });
            }, 2000);
        } catch (err) {
            onToast?.({ message: `Lỗi lưu quy đổi: ${err.message}`, type: 'error' });
            setEditingState(prev => ({
                ...prev,
                [p.id]: { ...prev[p.id], isSaving: false }
            }));
        }
    };

    return (
        <div className="space-y-6">
            {/* THỐNG KÊ NHANH */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                        <Boxes size={22} />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">Đã thiết lập quy đổi</p>
                        <h4 className="text-2xl font-black text-emerald-950 dark:text-emerald-100 tabular-nums">
                            {conversionStats.hasConv} <span className="text-xs font-normal text-stone-500">/ {products.length} SP</span>
                        </h4>
                    </div>
                </div>

                <div className="p-4 rounded-3xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-amber-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                        <AlertCircle size={22} />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider">Chưa có quy đổi</p>
                        <h4 className="text-2xl font-black text-amber-950 dark:text-amber-100 tabular-nums">
                            {conversionStats.missing} <span className="text-xs font-normal text-stone-500">SP</span>
                        </h4>
                    </div>
                </div>

                <div className="p-4 rounded-3xl bg-stone-500/10 border border-stone-500/20 flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-stone-700 text-white flex items-center justify-center shrink-0 shadow-sm">
                        <Filter size={20} />
                    </div>
                    <div className="min-w-0">
                        <p className="text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider">ĐVT quy đổi phổ biến</p>
                        <div className="flex gap-1.5 flex-wrap mt-1">
                            {Object.entries(conversionStats.packStats).slice(0, 4).map(([unit, count]) => (
                                <span key={unit} className="text-[10px] font-bold bg-white/70 dark:bg-black/40 px-2 py-0.5 rounded-lg border border-stone-300/40 dark:border-white/10">
                                    {unit} ({count})
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* BỘ LỌC & TÌM KIẾM */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-black/[0.02] dark:bg-white/[0.02] p-4 rounded-3xl border border-stone-300/60 dark:border-white/10">
                <div className="relative flex-1 max-w-md">
                    <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Tìm sản phẩm, mã hoặc đơn vị..."
                        className="w-full pl-9 pr-8 py-2 text-xs font-bold rounded-2xl bg-white dark:bg-black/30 border border-stone-300/70 dark:border-white/10 outline-none text-stone-800 dark:text-stone-100 placeholder:text-stone-400 focus:border-emerald-600"
                    />
                    {searchTerm && (
                        <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600">
                            <X size={13} />
                        </button>
                    )}
                </div>

                <div className="flex items-center gap-1.5">
                    {[
                        { id: 'has_conversion', label: `Có quy đổi (${conversionStats.hasConv})` },
                        { id: 'missing', label: `Chưa có (${conversionStats.missing})` },
                        { id: 'all', label: `Tất cả (${products.length})` },
                    ].map(f => (
                        <button
                            key={f.id}
                            type="button"
                            onClick={() => setFilterStatus(f.id)}
                            className={cn(
                                "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer",
                                filterStatus === f.id
                                    ? "bg-emerald-700 text-white shadow-xs font-black"
                                    : "bg-black/5 dark:bg-white/5 text-stone-700 dark:text-stone-300 hover:bg-black/10"
                            )}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* BẢNG THIẾT LẬP QUY ĐỔI */}
            <div className="overflow-x-auto rounded-3xl border border-stone-300/60 dark:border-white/10">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-[#ede8dc] dark:bg-[#142219] border-b border-stone-300/70 dark:border-white/10 text-[10.5px] font-black uppercase text-stone-700 dark:text-stone-300">
                        <tr>
                            <th className="px-4 py-3 min-w-[240px]">Sản Phẩm</th>
                            <th className="px-3 py-3 w-[120px] text-center">ĐVT Cơ Bản</th>
                            <th className="px-3 py-3 w-[260px] text-center">Công Thức Quy Đổi</th>
                            <th className="px-3 py-3 w-[120px] text-center">Tồn Hiện Tại</th>
                            <th className="px-3 py-3 w-[100px] text-center">Thao Tác</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-200/60 dark:divide-white/5 text-xs">
                        {paginatedProducts.map(p => {
                            const curState = editingState[p.id];
                            const secondaryUnit = curState?.secondary_unit !== undefined ? curState.secondary_unit : (p.secondary_unit || '');
                            const multiplier = curState?.multiplier !== undefined ? curState.multiplier : (p.multiplier || 1);
                            const isDirty = curState?.isDirty;
                            const isSaving = curState?.isSaving;
                            const isSaved = curState?.isSaved;

                            const calculatedBiggerQty = Number(multiplier) > 0 ? (p.stock / multiplier).toFixed(2) : '0';

                            return (
                                <tr key={p.id} className="hover:bg-stone-500/5 dark:hover:bg-white/[0.02] transition-colors">
                                    {/* TÊN SẢN PHẨM */}
                                    <td className="px-4 py-2.5 align-middle">
                                        <div className="flex items-center justify-between gap-2">
                                            <div>
                                                <p className="font-bold text-xs text-stone-900 dark:text-stone-100 uppercase line-clamp-1">{p.name}</p>
                                                <span className="text-[10px] text-stone-500 font-mono">{p.code || `ID:${p.id}`}</span>
                                            </div>
                                            {onOpenEditProduct && (
                                                <button
                                                    onClick={() => onOpenEditProduct(p)}
                                                    className="p-1 rounded-md text-stone-400 hover:text-emerald-700 hover:bg-black/5"
                                                    title="Sửa toàn bộ sản phẩm"
                                                >
                                                    <Edit3 size={12} />
                                                </button>
                                            )}
                                        </div>
                                    </td>

                                    {/* ĐVT CƠ BẢN */}
                                    <td className="px-3 py-2.5 text-center font-black text-[#8b6f47] dark:text-[#d4a574]">
                                        {normalizeUOM(p.unit) || '-'}
                                    </td>

                                    {/* FORM QUY ĐỔI */}
                                    <td className="px-3 py-2.5">
                                        <div className="flex items-center justify-center gap-1.5">
                                            <span className="text-xs font-bold text-stone-500">1</span>
                                            <div className="w-28">
                                                <UnitSelect
                                                    value={secondaryUnit}
                                                    onChange={(val) => handleFieldChange(p.id, 'secondary_unit', val)}
                                                    existingProducts={products}
                                                    placeholder="ĐVT lớn..."
                                                />
                                            </div>
                                            <span className="text-xs font-black text-stone-400">=</span>
                                            <input
                                                type="number"
                                                min="1"
                                                step="1"
                                                value={multiplier}
                                                onChange={(e) => handleFieldChange(p.id, 'multiplier', parseFloat(e.target.value) || 1)}
                                                className="w-16 px-2 py-1.5 text-xs font-black text-center tabular-nums rounded-xl border border-stone-400/40 dark:border-white/10 bg-transparent hover:border-emerald-500/60 focus:border-emerald-600 focus:bg-transparent outline-none"
                                            />
                                            <span className="text-xs font-black text-[#8b6f47] dark:text-[#d4a574] truncate max-w-[60px]">
                                                {normalizeUOM(p.unit)}
                                            </span>
                                        </div>
                                    </td>

                                    {/* TỒN QUY ĐỔI HIỆN TẠI */}
                                    <td className="px-3 py-2.5 text-center">
                                        <div className="font-bold text-xs text-stone-800 dark:text-stone-200 tabular-nums">
                                            {p.stock ?? 0} {normalizeUOM(p.unit)}
                                        </div>
                                        {secondaryUnit && Number(multiplier) > 1 && (
                                            <div className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 tabular-nums">
                                                ≈ {calculatedBiggerQty} {normalizeUOM(secondaryUnit)}
                                            </div>
                                        )}
                                    </td>

                                    {/* NÚT LƯU */}
                                    <td className="px-3 py-2.5 text-center">
                                        {isDirty ? (
                                            <button
                                                type="button"
                                                disabled={isSaving}
                                                onClick={() => handleSaveRow(p)}
                                                className="px-3 py-1 bg-emerald-600 text-white rounded-xl text-xs font-black flex items-center justify-center gap-1 shadow-xs hover:bg-emerald-700 transition-colors mx-auto cursor-pointer"
                                            >
                                                {isSaving ? <span className="animate-spin text-xs">⏳</span> : <Save size={12} />}
                                                <span>Lưu</span>
                                            </button>
                                        ) : isSaved ? (
                                            <span className="inline-flex items-center gap-0.5 text-[10px] font-black text-emerald-700 bg-emerald-500/20 px-2 py-0.5 rounded-full">
                                                <Check size={10} strokeWidth={3} /> Đã lưu
                                            </span>
                                        ) : (
                                            <span className="text-[10px] text-stone-400">Đã chuẩn</span>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* PHÂN TRANG */}
            <CatalogPagination
                currentPage={page}
                totalItems={filteredProducts.length}
                pageSize={PAGE_SIZE}
                onPageChange={setPage}
                itemLabel="sản phẩm"
            />
        </div>
    );
}
