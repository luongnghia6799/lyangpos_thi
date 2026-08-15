
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

    // Add an empty row on open if empty
    useEffect(() => {
        if (isOpen && rows.length === 0) {
            handleAddRow();
        }
    }, [isOpen]);

    // Focus last row product search if just added
    useEffect(() => {
        if (rows.length > 0) {
            const lastRow = rows[rows.length - 1];
            // If it's a new empty row, we might want to focus it
            // But we need to handle this carefully to not annoy the user
        }
    }, [rows.length]);

    if (!isOpen) return null;

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
            // But let's check if the first row is now occupied.
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
        // Since we prepended a row, the row we filled is now at index 1
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
        // fieldIdx -1 is Product Selection
        // fieldIdx >= 0 are selectedFields

        if (e.key === 'Enter') {
            // Enter always jumps back to Top Search (Row 0) to prepare for next item
            e.preventDefault();
            setTimeout(() => {
                const topSearch = tableRef.current?.querySelector(`[data-row="0"][data-field="-1"] input`);
                topSearch?.focus();
            }, 50);
        } else if (e.key === 'Tab') {
            // Tab moves to next field
            const isLastField = fieldIdx === selectedFields.length - 1;

            if (isLastField) {
                // If it's the last field, go back to top search
                e.preventDefault();
                setTimeout(() => {
                    const topSearch = tableRef.current?.querySelector(`[data-row="0"][data-field="-1"] input`);
                    topSearch?.focus();
                }, 50);
            } else {
                // Natural tab handles fieldIdx -1 to 0 if we let it, 
                // but we have custom fieldIdx tracking.
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
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
                    <m.div
                        initial={{ opacity: 0, scale: 0.95, y: 30, filter: 'blur(10px)' }}
                        animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
                        exit={{ opacity: 0, scale: 0.95, y: 30, filter: 'blur(10px)' }}
                        transition={{ 
                            type: "spring", 
                            stiffness: 260, 
                            damping: 20, 
                            mass: 1
                        }}
                        className="bg-transparent w-[95vw] h-[90vh] rounded-[3rem] shadow-2xl overflow-hidden border-4 border-white dark:border-slate-800 flex flex-col"
                    >
                        {/* Header */}
                        <div className="p-8 border-b dark:border-slate-800 flex justify-between items-center bg-primary/5 dark:bg-primary/10">
                            <div className="flex items-center gap-6">
                                <m.div 
                                    initial={{ rotate: -10 }}
                                    animate={{ rotate: 3 }}
                                    className="w-16 h-16 bg-gradient-to-br from-primary to-[#4a7c59] rounded-[24px] flex items-center justify-center text-white shadow-xl shadow-primary/30"
                                >
                                    <Sparkles size={32} strokeWidth={2.5} />
                                </m.div>
                                <div className="space-y-1">
                                    <h2 className="text-3xl font-black text-slate-800 dark:text-primary uppercase tracking-tighter leading-none">Cập Nhật Nhanh Vụ Mùa</h2>
                                    <div className="flex items-center gap-3">
                                        <div className="px-3 py-0.5 bg-primary/10 dark:bg-primary/40 text-primary rounded-full text-[10px] font-black uppercase tracking-widest border border-primary/20">CHẾ ĐỘ BẢNG TÍNH</div>
                                        <span className="w-1 h-1 rounded-full bg-primary/40"></span>
                                        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Đang chỉnh sửa {rows.filter(r => r.productId).length} sản phẩm</p>
                                    </div>
                                </div>
                            </div>
                            <button onClick={onClose} className="w-12 h-12 rounded-2xl bg-transparent flex items-center justify-center text-gray-400 hover:text-red-500 hover:shadow-lg transition-all border border-gray-100 dark:border-slate-700">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="flex flex-1 overflow-hidden">
                            {/* Left Sidebar: Field Selection */}
                            <div className="w-72 flex-shrink-0 border-r dark:border-slate-800 bg-transparent/50 dark:bg-slate-900/20 p-6 overflow-y-auto no-scrollbar hidden xl:flex flex-col gap-6">
                                <div className="space-y-1">
                                    <h3 className="text-[10px] font-black text-[#8b6f47] uppercase tracking-[0.2em] ml-2">Tiêu chí cần sửa</h3>
                                    <p className="text-[9px] text-gray-400 italic ml-2">Chọn các cột anh muốn hiện trên bảng</p>
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
                                                    "flex items-center gap-4 p-4 rounded-2xl border-2 transition-all duration-300 text-left group",
                                                    isActive
                                                        ? "bg-primary border-primary text-white shadow-lg shadow-primary/20"
                                                        : "bg-transparent border-transparent hover:border-primary/20 dark:hover:border-primary/40 text-gray-600 dark:text-gray-400"
                                                )}
                                            >
                                                <div className={cn(
                                                    "w-10 h-10 rounded-xl flex items-center justify-center transition-colors shadow-sm",
                                                    isActive ? "bg-white/20" : "bg-transparent dark:bg-slate-700 group-hover:bg-transparent"
                                                )}>
                                                    <Icon size={20} className={isActive ? "text-white" : "text-primary"} />
                                                </div>
                                                <div className="flex-1 flex flex-col">
                                                    <span className="text-[11px] font-black uppercase tracking-tight leading-tight">{f.label}</span>
                                                    {isActive && <span className="text-[8px] font-bold opacity-70">Đang bật</span>}
                                                </div>
                                                {isActive && <Check size={16} className="text-white" />}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Main Table Area */}
                            <div className="flex-1 flex flex-col bg-transparent relative">
                                {/* Mobile/Small screen field toggle - simple list */}
                                <div className="xl:hidden p-4 border-b dark:border-slate-800 flex gap-2 overflow-x-auto no-scrollbar">
                                    {EDITABLE_FIELDS_FILTERED.map(f => (
                                        <button
                                            key={f.id}
                                            onClick={() => toggleField(f.id)}
                                            className={cn(
                                                "whitespace-nowrap px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-tighter border-2 transition-all",
                                                selectedFields.includes(f.id)
                                                    ? "bg-primary border-primary text-white"
                                                    : "bg-transparent border-transparent text-gray-400"
                                            )}
                                        >
                                            {f.label}
                                        </button>
                                    ))}
                                </div>

                                {/* Scrollable Table Area with container restriction */}
                                <div className="flex-1 relative w-full overflow-hidden">
                                    <div ref={tableRef} className="absolute inset-0 overflow-auto bg-[#fafafa] dark:bg-slate-900/50 p-8 custom-scrollbar">
                                        <div className="min-w-fit space-y-4">
                                            <div className="flex items-center px-6 py-4 bg-transparent rounded-[28px] border-2 border-primary/10 shadow-sm sticky top-0 z-50 w-max min-w-full">
                                                <div className="sticky left-0 z-30 w-[300px] flex-shrink-0 text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2 bg-transparent pr-4">Sản phẩm cần điều chỉnh</div>
                                                <div className="flex items-center gap-4">
                                                    {selectedFields.map(fieldId => (
                                                        <div key={fieldId} className="w-[180px] flex-shrink-0 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">
                                                            {EDITABLE_FIELDS_FILTERED.find(f => f.id === fieldId).label}
                                                        </div>
                                                    ))}
                                                </div>
                                                <div className="w-12 flex-shrink-0"></div>
                                            </div>

                                            <AnimatePresence initial={false}>
                                                {rows.map((row, idx) => (
                                                    <m.div
                                                        key={row.id}
                                                        initial={{ opacity: 0, x: -20, scale: 0.98 }}
                                                        animate={{ opacity: 1, x: 0, scale: 1 }}
                                                        exit={{ opacity: 0, x: 20, scale: 0.98 }}
                                                        transition={{ 
                                                            duration: 0.3,
                                                            delay: idx * 0.05,
                                                            type: "spring",
                                                            stiffness: 300,
                                                            damping: 30
                                                        }}
                                                        className="flex items-center px-6 py-4 bg-transparent rounded-[32px] border-2 border-white dark:border-slate-800 shadow-sm hover:shadow-xl hover:border-primary/20 transition-all group w-max min-w-full relative focus-within:z-50"
                                                    >
                                                        <div className="sticky left-0 z-20 w-[300px] flex-shrink-0 bg-transparent pr-4 group-focus-within:z-50" data-row={idx} data-field="-1">
                                                            <ProductAutocomplete
                                                                allProducts={allProducts}
                                                                value={row.productId}
                                                                onKeyDown={(e) => handleKeyDown(e, idx, -1)}
                                                                onChange={(val) => handleProductSelect(row.id, val)}
                                                                placeholder="🔍 Gõ tên hoặc mã SP..."
                                                                className="!rounded-2xl !text-[13px] !font-black"
                                                            />
                                                        </div>

                                                        <div className="flex items-center gap-4">
                                                            {selectedFields.map((fieldId, fIdx) => {
                                                                const field = EDITABLE_FIELDS_FILTERED.find(f => f.id === fieldId);

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
                                                                                className="!bg-transparent/50 dark:!bg-slate-900/50 !rounded-2xl !py-3 !border-none"
                                                                            />
                                                                        </div>
                                                                    );
                                                                }

                                                                return (
                                                                    <div key={fieldId} className={cn(
                                                                        "w-[180px] flex-shrink-0 relative transition-all",
                                                                        fieldId === 'sale_price' && "bg-primary/5 dark:bg-primary/10 rounded-xl",
                                                                        fieldId === 'cost_price' && "bg-amber-500/5 dark:bg-amber-500/10 rounded-xl"
                                                                    )} data-row={idx} data-field={fIdx}>
                                                                        <input
                                                                            type={field.type}
                                                                            value={row.values[fieldId] ?? ''}
                                                                            onKeyDown={(e) => handleKeyDown(e, idx, fIdx)}
                                                                            onChange={(e) => handleValueChange(row.id, fieldId, field.type === 'number' ? (e.target.value === '' ? '' : parseFloat(e.target.value)) : e.target.value)}
                                                                            placeholder={field.placeholder || row.productData?.[fieldId]?.toString() || '---'}
                                                                            className={cn(
                                                                                "w-full px-5 py-3.5 border-none bg-transparent rounded-xl text-[13px] font-black text-center outline-none transition-all placeholder:text-gray-300 placeholder:font-medium dark:text-white",
                                                                                fieldId === 'sale_price' && "text-primary"
                                                                            )}
                                                                        />
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>

                                                        <button
                                                            onClick={() => handleRemoveRow(row.id)}
                                                            className="w-12 h-12 flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-2xl transition-all ml-4"
                                                        >
                                                            <Trash2 size={18} />
                                                        </button>
                                                    </m.div>
                                                ))}
                                            </AnimatePresence>

                                        </div>
                                    </div>
                                </div>

                                {/* Footer Sidebar Area (Selection Count) - ALWAYS FIXED HERE */}
                                <div className="p-8 border-t dark:border-slate-800 bg-transparent flex flex-col md:flex-row justify-between items-center gap-6 shadow-[0_-10px_40px_rgba(0,0,0,0.03)] z-20">
                                    <div className="flex items-center gap-10">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Lưu ý chuyên gia</span>
                                            <div className="flex items-center gap-2 text-[#8b6f47] font-bold text-xs mt-1">
                                                <AlertTriangle size={14} className="text-amber-500" />
                                                <span>Thay đổi giá sẽ ảnh hưởng đến báo cáo lợi nhuận từ thời điểm này.</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex gap-4 w-full md:w-auto">
                                        <button
                                            onClick={onClose}
                                            className="flex-1 md:w-48 px-10 py-5 bg-transparent text-gray-400 dark:text-gray-500 rounded-3xl font-black text-xs uppercase tracking-widest hover:bg-gray-200 dark:hover:bg-slate-800 transition-all border border-transparent hover:border-gray-300"
                                        >
                                            Hủy bỏ
                                        </button>
                                        <button
                                            onClick={handleSubmit}
                                            disabled={rows.filter(r => r.productId).length === 0}
                                            className="flex-[2] md:w-80 px-12 py-5 bg-gradient-to-br from-primary to-[#4a7c59] text-white rounded-3xl font-black text-xs uppercase tracking-widest shadow-2xl shadow-primary/40 hover:scale-[1.02] hover:shadow-primary/60 disabled:opacity-30 disabled:scale-100 disabled:shadow-none transition-all flex items-center justify-center gap-4 group"
                                        >
                                            <Save size={20} className="group-hover:rotate-12 transition-transform" />
                                            XÁC NHẬN CẬP NHẬT CÁC SP ĐÃ CHỌN
                                            <ChevronRight size={18} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </m.div>
                </div>
            </AnimatePresence>
        </Portal>
    );
}
