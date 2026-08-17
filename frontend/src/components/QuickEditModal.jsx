
import React, { useState, useEffect } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import {
    X, Save, Plus, Trash2, Layers, Search,
    Tags, Hash, List, Sparkles, Type, Binary,
    DollarSign, Package, Calendar, Activity,
    Smartphone, Box, AlertTriangle, ChevronRight, Check,
    FileSpreadsheet
} from 'lucide-react';
import { cn, formatNumber } from '../lib/utils';
import Portal from './Portal';
import CategoryIcon from './CategoryIcon';
import SearchableSelect from './SearchableSelect';
import ProductAutocomplete from './ProductAutocomplete';

const EDITABLE_FIELDS = [
    { id: 'code', label: 'Mã Hàng', icon: Hash, type: 'text' },
    { id: 'name', label: 'Tên Sản Phẩm', icon: Type, type: 'text' },
    { id: 'alias', label: 'Alias đọc TTS', icon: Type, type: 'text' },
    { id: 'sale_price', label: 'Giá Bán', icon: DollarSign, type: 'number' },
    { id: 'accounting_price', label: 'Giá Kế Toán', icon: FileSpreadsheet, type: 'number' },
    { id: 'cost_price', label: 'Giá Vốn', icon: Hash, type: 'number' },
    { id: 'stock', label: 'Tồn Kho', icon: Package, type: 'number' },
    { id: 'min_stock', label: 'Tồn Cảnh Báo', icon: AlertTriangle, type: 'number' },
    { id: 'accounting_stock', label: 'Tồn Kế Toán', icon: Layers, type: 'number' },
    { id: 'unit', label: 'Đơn Vị Chính', icon: Box, type: 'select' },
    { id: 'secondary_unit', label: 'Đơn Vị Cách', icon: Box, type: 'select' },
    { id: 'multiplier', label: 'Quy Cách', icon: Layers, type: 'number' },
    { id: 'brand', label: 'Hãng', icon: Smartphone, type: 'select' },
    { id: 'active_ingredient', label: 'Hoạt Chất', icon: Activity, type: 'text' },
    { id: 'expiry_date', label: 'Hạn Sử Dụng', icon: Calendar, type: 'text', placeholder: 'DD/MM/YYYY' },
    { id: 'category_id', label: 'Loại Hàng', icon: Tags, type: 'select' },
];

const PRIMARY_UNITS_SUGGESTIONS = ['Chai', 'Hộp', 'Viên', 'Gói', 'Tuýp', 'Lọ', 'Bịch', 'Can', 'Ký', 'Cái'];
const SECONDARY_UNITS_SUGGESTIONS = ['Thùng', 'Lốc', 'Két', 'Kiện', 'Bao', 'Hộp', 'Lít'];
const COMMON_UNITS = [...new Set([...PRIMARY_UNITS_SUGGESTIONS, ...SECONDARY_UNITS_SUGGESTIONS])];

export default function QuickEditModal({
    isOpen,
    onClose,
    allProducts,
    categories,
    selectedProductIds = [],
    onSave
}) {
    const accountingEnabled = localStorage.getItem('feature_accounting_enabled') === 'true';

    const EDITABLE_FIELDS_FILTERED = React.useMemo(() => {
        return EDITABLE_FIELDS.filter(f => {
            if (!accountingEnabled && (f.id === 'accounting_price' || f.id === 'accounting_stock')) return false;
            return true;
        });
    }, [accountingEnabled]);

    const [selectedFields, setSelectedFields] = useState(['sale_price', ...(accountingEnabled ? ['accounting_price'] : [])]);
    const [rows, setRows] = useState([]);
    const tableRef = React.useRef(null);

    // Get unique existing brands and units for dropdowns
    const brandOptions = React.useMemo(() => {
        const uniqueBrands = Array.from(new Set(allProducts.map(p => p.brand).filter(Boolean)));
        return uniqueBrands.map(b => ({ id: b, name: b }));
    }, [allProducts]);

    const primaryUnitOptions = React.useMemo(() => {
        const uniqueUnits = Array.from(new Set([
            ...PRIMARY_UNITS_SUGGESTIONS,
            ...allProducts.map(p => p.unit).filter(Boolean)
        ]));
        return uniqueUnits.map(u => ({ id: u, name: u }));
    }, [allProducts]);

    const secondaryUnitOptions = React.useMemo(() => {
        const uniqueUnits = Array.from(new Set([
            ...SECONDARY_UNITS_SUGGESTIONS,
            ...allProducts.map(p => p.secondary_unit).filter(Boolean)
        ]));
        return uniqueUnits.map(u => ({ id: u, name: u }));
    }, [allProducts]);

    // Populate rows when modal opens (either with selected items across pages, or 1 empty search row)
    useEffect(() => {
        if (isOpen) {
            if (selectedProductIds && selectedProductIds.length > 0) {
                const initialRows = selectedProductIds.map(pId => {
                    const product = allProducts.find(p => p.id === pId);
                    return {
                        id: Math.random().toString(36).substr(2, 9),
                        productId: pId,
                        productData: product,
                        values: {}
                    };
                });
                setRows([
                    { id: Math.random().toString(36).substr(2, 9), productId: null, values: {} },
                    ...initialRows
                ]);
            } else {
                setRows([{
                    id: Math.random().toString(36).substr(2, 9),
                    productId: null,
                    values: {}
                }]);
            }
        }
    }, [isOpen]);

    const handleAddRow = () => {
        setRows([{
            id: Math.random().toString(36).substr(2, 9),
            productId: null,
            values: {}
        }, ...rows]);
    };

    const handleRemoveRow = (id) => {
        if (rows.length > 1) {
            setRows(rows.filter(r => r.id !== id));
        } else {
            setRows([{ id, productId: null, values: {} }]);
        }
    };

    const handleProductSelect = (rowId, productId) => {
        const product = allProducts.find(p => p.id === productId);
        setRows(prevRows => {
            const newRows = prevRows.map(r => {
                if (r.id === rowId) {
                    return { ...r, productId, productData: product };
                }
                return r;
            });

            // If we just selected a product in an empty row, and it was the first row,
            // we might want to ensure there is always an empty one at the top.
            if (newRows[0].productId !== null) {
                return [{
                    id: Math.random().toString(36).substr(2, 9),
                    productId: null,
                    values: {}
                }, ...newRows];
            }
            return newRows;
        });

        // Focus the first field of the row we just filled
        setTimeout(() => {
            const firstFieldOfFilledRow = tableRef.current?.querySelector(`[data-row="1"][data-field="0"] input, [data-row="1"][data-field="0"] button`);
            firstFieldOfFilledRow?.focus();
        }, 100);
    };

    const handleValueChange = (rowId, fieldId, value) => {
        setRows(rows.map(r => {
            if (r.id === rowId) {
                return { ...r, values: { ...r.values, [fieldId]: value } };
            }
            return r;
        }));
    };

    const toggleField = (fieldId) => {
        setSelectedFields(prev =>
            prev.includes(fieldId)
                ? prev.filter(f => f !== fieldId)
                : [...prev, fieldId]
        );
    };

    const handleKeyDown = (e, rowIdx, fieldIdx) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            setTimeout(() => {
                const topSearch = tableRef.current?.querySelector(`[data-row="0"][data-field="-1"] input`);
                topSearch?.focus();
            }, 50);
        } else if (e.key === 'Tab') {
            const isLastField = fieldIdx === selectedFields.length - 1;

            if (isLastField) {
                e.preventDefault();
                setTimeout(() => {
                    const topSearch = tableRef.current?.querySelector(`[data-row="0"][data-field="-1"] input`);
                    topSearch?.focus();
                }, 50);
            } else {
                e.preventDefault();
                const nextField = tableRef.current?.querySelector(`[data-row="${rowIdx}"][data-field="${fieldIdx + 1}"] input, [data-row="${rowIdx}"][data-field="${fieldIdx + 1}"] button`);
                nextField?.focus();
                nextField?.select?.();
            }
        }
    };

    const handleSubmit = () => {
        const individual_updates = rows
            .filter(r => r.productId)
            .map(r => ({
                id: r.productId,
                ...r.values
            }));

        if (individual_updates.length === 0) return;
        onSave({ individual_updates });
    };

    return (
        <Portal>
            <AnimatePresence>
                {isOpen && (
                    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
                        {/* Backdrop */}
                        <m.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/60 backdrop-blur-md"
                            onClick={onClose}
                        />

                        {/* Modal Container */}
                        <m.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            transition={{ 
                                duration: 0.25,
                                ease: [0.22, 1, 0.36, 1]
                            }}
                            className="bg-[#faf8f3] dark:bg-slate-900 text-slate-900 dark:text-slate-100 w-[95vw] h-[90vh] rounded-[2.5rem] shadow-2xl overflow-hidden border-2 border-[#d4a574]/30 dark:border-slate-800 flex flex-col relative z-10"
                        >
                            {/* Header */}
                            <div className="p-5 px-8 border-b border-[#d4a574]/20 dark:border-slate-800 flex justify-between items-center bg-white/80 dark:bg-slate-900/80 backdrop-blur shrink-0">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-gradient-to-br from-[#2d5016] to-[#4a7c59] rounded-2xl flex items-center justify-center text-white shadow-md shadow-[#2d5016]/25">
                                        <Sparkles size={24} strokeWidth={2.5} />
                                    </div>
                                    <div className="space-y-0.5">
                                        <h2 className="text-2xl font-black text-[#2d5016] dark:text-[#4a7c59] uppercase tracking-tight leading-none">Cập Nhật Nhanh Vụ Mùa</h2>
                                        <div className="flex items-center gap-3">
                                            <div className="px-2.5 py-0.5 bg-[#2d5016]/10 dark:bg-[#4a7c59]/20 text-[#2d5016] dark:text-emerald-300 rounded-full text-[10px] font-black uppercase tracking-widest border border-[#2d5016]/20">CHẾ ĐỘ BẢNG TÍNH</div>
                                            <span className="w-1 h-1 rounded-full bg-[#8b6f47]/50"></span>
                                            <p className="text-[11px] font-bold text-[#8b6f47] dark:text-slate-400 uppercase tracking-wider">Đang chỉnh sửa {rows.filter(r => r.productId).length} sản phẩm</p>
                                        </div>
                                    </div>
                                </div>
                                <button onClick={onClose} className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center text-[#8b6f47] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all border border-[#d4a574]/25 dark:border-slate-700 shadow-sm">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="flex flex-1 overflow-hidden">
                                {/* Left Sidebar: Field Selection */}
                                <div className="w-72 flex-shrink-0 border-r border-[#d4a574]/20 dark:border-slate-800 bg-[#f7f4ed]/90 dark:bg-slate-950/40 p-5 overflow-y-auto custom-scrollbar hidden xl:flex flex-col gap-4">
                                    <div className="space-y-0.5">
                                        <h3 className="text-[11px] font-black text-[#8b6f47] dark:text-[#d4a574] uppercase tracking-[0.15em] ml-1">Tiêu chí cần sửa</h3>
                                        <p className="text-[10px] text-slate-500 dark:text-slate-400 italic ml-1">Chọn các cột muốn hiện trên bảng</p>
                                    </div>

                                    <div className="flex flex-col gap-2">
                                        {EDITABLE_FIELDS_FILTERED.map(f => {
                                            const isActive = selectedFields.includes(f.id);
                                            const Icon = f.icon;
                                            return (
                                                <button
                                                    key={f.id}
                                                    onClick={() => toggleField(f.id)}
                                                    className={cn(
                                                        "flex items-center gap-3 p-3.5 rounded-2xl border transition-all duration-200 text-left group",
                                                        isActive
                                                            ? "bg-gradient-to-r from-[#2d5016] to-[#4a7c59] text-white shadow-md shadow-[#2d5016]/20 border-transparent"
                                                            : "bg-white dark:bg-slate-800/80 border-[#d4a574]/25 dark:border-slate-700/60 hover:border-[#4a7c59]/50 text-slate-700 dark:text-slate-300 shadow-sm"
                                                    )}
                                                >
                                                    <div className={cn(
                                                        "w-9 h-9 rounded-xl flex items-center justify-center transition-colors shadow-sm shrink-0",
                                                        isActive ? "bg-white/20 text-white" : "bg-[#faf8f3] dark:bg-slate-700 text-[#2d5016] dark:text-emerald-400"
                                                    )}>
                                                        <Icon size={18} />
                                                    </div>
                                                    <div className="flex-1 flex flex-col min-w-0">
                                                        <span className="text-[11px] font-black uppercase tracking-tight leading-tight truncate">{f.label}</span>
                                                        {isActive && <span className="text-[9px] font-bold opacity-80">Đang bật</span>}
                                                    </div>
                                                    {isActive && <Check size={16} className="text-white shrink-0" />}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Main Table Area */}
                                <div className="flex-1 flex flex-col bg-[#f4efe6]/40 dark:bg-slate-950/40 relative">
                                    {/* Mobile/Small screen field toggle */}
                                    <div className="xl:hidden p-3 border-b border-[#d4a574]/20 dark:border-slate-800 bg-white dark:bg-slate-900 flex gap-2 overflow-x-auto custom-scrollbar">
                                        {EDITABLE_FIELDS_FILTERED.map(f => (
                                            <button
                                                key={f.id}
                                                onClick={() => toggleField(f.id)}
                                                className={cn(
                                                    "whitespace-nowrap px-3.5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider border transition-all",
                                                    selectedFields.includes(f.id)
                                                        ? "bg-gradient-to-r from-[#2d5016] to-[#4a7c59] text-white border-transparent shadow-sm"
                                                        : "bg-white dark:bg-slate-800 border-[#d4a574]/30 dark:border-slate-700 text-[#8b6f47]"
                                                )}
                                            >
                                                {f.label}
                                            </button>
                                        ))}
                                    </div>

                                    {/* Scrollable Table Area */}
                                    <div className="flex-1 relative w-full overflow-hidden">
                                        <div ref={tableRef} className="absolute inset-0 overflow-auto bg-[#f4efe6]/40 dark:bg-slate-950/40 p-6 custom-scrollbar">
                                            <div className="min-w-fit space-y-3">
                                                {/* Header Row */}
                                                <div className="flex items-center px-6 py-3 bg-[#ebe4d6] dark:bg-slate-800 rounded-2xl border border-[#d4a574]/35 dark:border-slate-700 shadow-sm sticky top-0 z-30 w-max min-w-full backdrop-blur-md">
                                                    <div className="sticky left-0 z-30 w-[300px] flex-shrink-0 text-[11px] font-black text-[#8b6f47] dark:text-[#d4a574] uppercase tracking-widest pl-2 bg-[#ebe4d6] dark:bg-slate-800 pr-4">Sản phẩm cần điều chỉnh</div>
                                                    <div className="flex items-center gap-4">
                                                        {selectedFields.map(fieldId => (
                                                            <div key={fieldId} className="w-[180px] flex-shrink-0 text-[11px] font-black text-[#8b6f47] dark:text-[#d4a574] uppercase tracking-widest text-center">
                                                                {EDITABLE_FIELDS_FILTERED.find(f => f.id === fieldId)?.label}
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <div className="w-12 flex-shrink-0"></div>
                                                </div>

                                                <AnimatePresence initial={false}>
                                                    {rows.map((row, idx) => (
                                                        <m.div
                                                            key={row.id}
                                                            initial={{ opacity: 0, x: -15, scale: 0.98 }}
                                                            animate={{ opacity: 1, x: 0, scale: 1 }}
                                                            exit={{ opacity: 0, x: 15, scale: 0.98 }}
                                                            transition={{ duration: 0.2 }}
                                                            className="flex items-center px-6 py-3.5 bg-white dark:bg-slate-800 rounded-2xl border border-[#d4a574]/25 dark:border-slate-700/80 shadow-sm hover:shadow-md hover:border-[#4a7c59]/50 transition-all group w-max min-w-full relative focus-within:z-20"
                                                        >
                                                            <div className="sticky left-0 z-20 w-[300px] flex-shrink-0 bg-white dark:bg-slate-800 pr-4 group-focus-within:z-20" data-row={idx} data-field="-1">
                                                                <ProductAutocomplete
                                                                    allProducts={allProducts}
                                                                    value={row.productId}
                                                                    onKeyDown={(e) => handleKeyDown(e, idx, -1)}
                                                                    onChange={(val) => handleProductSelect(row.id, val)}
                                                                    placeholder="🔍 Gõ tên hoặc mã SP..."
                                                                    className="!rounded-xl !text-[13px] !font-black !bg-[#faf8f3] dark:!bg-slate-900 !border-[#d4a574]/30 dark:!border-slate-700"
                                                                />
                                                            </div>

                                                            <div className="flex items-center gap-4">
                                                                {selectedFields.map((fieldId, fIdx) => {
                                                                    const field = EDITABLE_FIELDS_FILTERED.find(f => f.id === fieldId);
                                                                    if (!field) return null;

                                                                    if (field.type === 'select') {
                                                                        let options = [];
                                                                        if (fieldId === 'category_id') options = categories;
                                                                        else if (fieldId === 'brand') options = brandOptions;
                                                                        else if (fieldId === 'unit') options = primaryUnitOptions;
                                                                        else if (fieldId === 'secondary_unit') options = secondaryUnitOptions;

                                                                        return (
                                                                            <div key={fieldId} className="w-[180px] flex-shrink-0" data-row={idx} data-field={fIdx}>
                                                                                <SearchableSelect
                                                                                    options={options}
                                                                                    value={row.values[fieldId] ?? row.productData?.[fieldId] ?? ''}
                                                                                    onKeyDown={(e) => handleKeyDown(e, idx, fIdx)}
                                                                                    onChange={(val) => handleValueChange(row.id, fieldId, val)}
                                                                                    placeholder={`Chọn ${field.label}...`}
                                                                                    displayValue={(o) => o.name}
                                                                                    valueKey="id"
                                                                                    className="!bg-[#faf8f3] dark:!bg-slate-900 !rounded-xl !py-2.5 !border-[#d4a574]/30 dark:!border-slate-700"
                                                                                />
                                                                            </div>
                                                                        );
                                                                    }

                                                                    return (
                                                                        <div key={fieldId} className="w-[180px] flex-shrink-0 relative" data-row={idx} data-field={fIdx}>
                                                                            <input
                                                                                type={field.type}
                                                                                value={row.values[fieldId] ?? ''}
                                                                                onKeyDown={(e) => handleKeyDown(e, idx, fIdx)}
                                                                                onChange={(e) => handleValueChange(row.id, fieldId, field.type === 'number' ? (e.target.value === '' ? '' : parseFloat(e.target.value)) : e.target.value)}
                                                                                placeholder={field.placeholder || row.productData?.[fieldId]?.toString() || '---'}
                                                                                className={cn(
                                                                                    "w-full px-4 py-2.5 bg-[#faf8f3] dark:bg-slate-900 border border-[#d4a574]/30 dark:border-slate-700 rounded-xl text-[13px] font-black text-center outline-none focus:border-[#4a7c59] focus:ring-1 focus:ring-[#4a7c59] transition-all text-[#2d5016] dark:text-emerald-400 placeholder:text-slate-400",
                                                                                    fieldId === 'sale_price' && "text-[#2d5016] dark:text-emerald-400 font-black"
                                                                                )}
                                                                            />
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>

                                                            <button
                                                                onClick={() => handleRemoveRow(row.id)}
                                                                className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all ml-3"
                                                                title="Xóa dòng này"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </m.div>
                                                    ))}
                                                </AnimatePresence>

                                            </div>
                                        </div>
                                    </div>

                                    {/* Footer */}
                                    <div className="p-4 px-8 border-t border-[#d4a574]/20 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur flex flex-col md:flex-row justify-between items-center gap-4 shrink-0 z-20">
                                        <div className="flex items-center gap-2 text-[#8b6f47] dark:text-slate-400 font-bold text-xs">
                                            <AlertTriangle size={15} className="text-amber-500 shrink-0" />
                                            <span>Thay đổi giá sẽ ảnh hưởng đến báo cáo lợi nhuận từ thời điểm này.</span>
                                        </div>

                                        <div className="flex items-center gap-3 w-full md:w-auto">
                                            <button
                                                onClick={onClose}
                                                className="flex-1 md:w-36 px-6 py-3 bg-[#faf8f3] dark:bg-slate-800 text-[#8b6f47] dark:text-[#d4a574] rounded-2xl font-black text-xs uppercase tracking-wider hover:bg-[#d4a574]/15 transition-all border border-[#d4a574]/30 dark:border-slate-700"
                                            >
                                                Hủy bỏ
                                            </button>
                                            <button
                                                onClick={handleSubmit}
                                                disabled={rows.filter(r => r.productId).length === 0}
                                                className="flex-1 md:w-80 px-8 py-3 bg-gradient-to-r from-[#2d5016] to-[#4a7c59] text-white rounded-2xl font-black text-xs uppercase tracking-wider shadow-lg shadow-[#2d5016]/30 hover:scale-[1.02] hover:shadow-[#2d5016]/50 disabled:opacity-30 disabled:scale-100 disabled:shadow-none transition-all flex items-center justify-center gap-2.5 group"
                                            >
                                                <Save size={18} />
                                                XÁC NHẬN CẬP NHẬT ({rows.filter(r => r.productId).length})
                                                <ChevronRight size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </m.div>
                    </div>
                )}
            </AnimatePresence>
        </Portal>
    );
}
