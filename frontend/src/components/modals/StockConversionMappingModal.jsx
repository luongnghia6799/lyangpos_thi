import React, { useState, useMemo } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { 
    X, 
    Plus, 
    Trash2, 
    ArrowRight, 
    Save, 
    Search, 
    Layers, 
    Link as LinkIcon, 
    CheckCircle2, 
    AlertCircle,
    Info,
    ArrowLeftRight
} from 'lucide-react';
import Portal from '@/components/widgets/Portal';
import ProductAutocomplete from '../forms/ProductAutocomplete';
import { formatNumber, cn, removeAccents } from '../../lib/utils';

export default function StockConversionMappingModal({
    isOpen = false,
    onClose,
    mappings = [],
    onSaveMappings,
    allProducts = [],
    showToast
}) {
    const [searchTerm, setSearchTerm] = useState('');
    const [newSourceId, setNewSourceId] = useState(null);
    const [newDestId, setNewDestId] = useState(null);
    const [newMultiplier, setNewMultiplier] = useState(50);
    const [newNote, setNewNote] = useState('');

    const sourceProduct = useMemo(() => 
        allProducts.find(p => p.id === newSourceId), 
        [allProducts, newSourceId]
    );

    const destProduct = useMemo(() => 
        allProducts.find(p => p.id === newDestId), 
        [allProducts, newDestId]
    );

    // Auto set multiplier when source product is chosen if it has multiplier > 1
    const handleSourceChange = (pId) => {
        setNewSourceId(pId);
        const p = allProducts.find(prod => prod.id === pId);
        if (p && p.multiplier > 1) {
            setNewMultiplier(p.multiplier);
        }
    };

    const handleAddMapping = () => {
        if (!newSourceId || !newDestId) {
            showToast?.('Vui lòng chọn cả sản phẩm Nguồn và sản phẩm Đích!', 'error');
            return;
        }
        if (newSourceId === newDestId) {
            showToast?.('Sản phẩm nguồn và đích không thể giống nhau!', 'error');
            return;
        }
        if (Number(newMultiplier) <= 0) {
            showToast?.('Tỉ lệ quy đổi phải lớn hơn 0!', 'error');
            return;
        }

        const existingIdx = mappings.findIndex(m => m.source_product_id === newSourceId);
        let updated;
        const newEntry = {
            source_product_id: newSourceId,
            dest_product_id: newDestId,
            multiplier: Number(newMultiplier),
            note: newNote.trim() || `Xé lẻ ${sourceProduct?.name || ''} ➔ ${destProduct?.name || ''}`,
            updated_at: new Date().toISOString()
        };

        if (existingIdx > -1) {
            updated = [...mappings];
            updated[existingIdx] = newEntry;
            showToast?.(`Đã cập nhật liên kết cho "${sourceProduct?.name}"!`, 'success');
        } else {
            updated = [newEntry, ...mappings];
            showToast?.(`Đã thêm cấu hình xé lẻ mới!`, 'success');
        }

        onSaveMappings(updated);
        // Reset inputs
        setNewSourceId(null);
        setNewDestId(null);
        setNewMultiplier(50);
        setNewNote('');
    };

    const handleDeleteMapping = (sourceId) => {
        const item = mappings.find(m => m.source_product_id === sourceId);
        const p = allProducts.find(prod => prod.id === sourceId);
        if (window.confirm(`Bạn có chắc chắn muốn xóa liên kết xé lẻ của "${p?.name || 'sản phẩm này'}"?`)) {
            const updated = mappings.filter(m => m.source_product_id !== sourceId);
            onSaveMappings(updated);
            showToast?.('Đã xóa liên kết!', 'success');
        }
    };

    const handleUpdateMultiplier = (sourceId, newMult) => {
        const val = parseFloat(newMult);
        if (isNaN(val) || val <= 0) return;
        const updated = mappings.map(m => {
            if (m.source_product_id === sourceId) {
                return { ...m, multiplier: val, updated_at: new Date().toISOString() };
            }
            return m;
        });
        onSaveMappings(updated);
    };

    const filteredMappings = useMemo(() => {
        if (!searchTerm.trim()) return mappings;
        const term = removeAccents(searchTerm.toLowerCase());
        return mappings.filter(m => {
            const src = allProducts.find(p => p.id === m.source_product_id);
            const dst = allProducts.find(p => p.id === m.dest_product_id);
            const srcName = removeAccents(src?.name || '').toLowerCase();
            const dstName = removeAccents(dst?.name || '').toLowerCase();
            const noteText = removeAccents(m.note || '').toLowerCase();
            return srcName.includes(term) || dstName.includes(term) || noteText.includes(term);
        });
    }, [mappings, searchTerm, allProducts]);

    if (!isOpen) return null;

    return (
        <Portal>
            <div className="fixed inset-0 z-[500000] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
                <m.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0"
                    onClick={onClose}
                />

                <m.div
                    initial={{ opacity: 0, scale: 0.95, y: 15 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 15 }}
                    transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                    className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white w-full max-w-4xl rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col relative z-10 overflow-hidden max-h-[90vh]"
                >
                    {/* Header */}
                    <div className="p-4 px-6 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/80 shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-primary/10 text-primary rounded-2xl flex items-center justify-center border border-primary/20 shadow-xs">
                                <LinkIcon size={20} />
                            </div>
                            <div>
                                <h3 className="text-base font-black uppercase tracking-tight text-foreground flex items-center gap-2">
                                    Cài Đặt Liên Kết Xé Lẻ
                                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/20">
                                        {mappings.length} Cặp đã cấu hình
                                    </span>
                                </h3>
                                <p className="text-[11px] font-medium text-muted-foreground mt-0.5">
                                    Thiết lập sẵn sản phẩm nào khi xé lẻ sẽ ra sản phẩm nào & tỉ lệ quy đổi (Ví dụ: 1 Bao ➔ 50 Kg)
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 flex items-center justify-center rounded-xl bg-black/5 dark:bg-white/5 hover:bg-rose-500 hover:text-white text-muted-foreground transition-colors"
                        >
                            <X size={16} strokeWidth={2.5} />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-6 overflow-y-auto overflow-x-hidden flex-1 space-y-6 custom-scrollbar">
                        {/* FORM: THÊM CẶP LIÊN KẾT MỚI */}
                        <div className="p-5 rounded-2xl bg-primary/5 border border-primary/15 space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-primary font-black text-xs uppercase tracking-wider">
                                    <Plus size={16} /> Thêm Cặp Liên Kết Quy Đổi Mới
                                </div>
                                <span className="text-[10px] font-bold text-muted-foreground">
                                    Tự động điền khi tạo đơn xé lẻ & khi AI scan ảnh
                                </span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                                {/* SP Nguồn */}
                                <div className="md:col-span-5 space-y-1 relative">
                                    <label className="text-[10px] font-black uppercase text-muted-foreground tracking-wider block">
                                        1. Sản phẩm Nguồn (Bao / Thùng)
                                    </label>
                                    <ProductAutocomplete
                                        allProducts={allProducts}
                                        value={newSourceId}
                                        onChange={handleSourceChange}
                                        placeholder="Tìm SP nguyên bao..."
                                        className="w-full text-xs"
                                        dropdownAlign="left"
                                    />
                                    {sourceProduct && (
                                        <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold truncate">
                                            ✓ {sourceProduct.name} ({sourceProduct.unit || 'Bao'})
                                        </div>
                                    )}
                                </div>

                                {/* Arrow Icon */}
                                <div className="md:col-span-1 flex items-center justify-center pt-4">
                                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-black">
                                        <ArrowRight size={16} />
                                    </div>
                                </div>

                                {/* SP Đích */}
                                <div className="md:col-span-4 space-y-1 relative">
                                    <label className="text-[10px] font-black uppercase text-muted-foreground tracking-wider block">
                                        2. Sản phẩm Đích (Ký lẻ / Gói)
                                    </label>
                                    <ProductAutocomplete
                                        allProducts={allProducts}
                                        value={newDestId}
                                        onChange={setNewDestId}
                                        placeholder="Tìm SP bán lẻ..."
                                        className="w-full text-xs"
                                        dropdownAlign="right"
                                    />
                                    {destProduct && (
                                        <div className="text-[10px] text-blue-600 dark:text-blue-400 font-bold truncate">
                                            ✓ {destProduct.name} ({destProduct.unit || 'Kg'})
                                        </div>
                                    )}
                                </div>

                                {/* Multiplier */}
                                <div className="md:col-span-2 space-y-1">
                                    <label className="text-[10px] font-black uppercase text-muted-foreground tracking-wider block">
                                        Tỉ lệ (Kg/Bao)
                                    </label>
                                    <input
                                        type="number"
                                        min="0.1"
                                        step="any"
                                        value={newMultiplier}
                                        onChange={e => setNewMultiplier(e.target.value)}
                                        className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-black text-center text-primary outline-none focus:border-primary"
                                        placeholder="50"
                                    />
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                                <input
                                    type="text"
                                    value={newNote}
                                    onChange={e => setNewNote(e.target.value)}
                                    placeholder="Ghi chú quy cách (tùy chọn, ví dụ: 1 bao 50kg, hàng cám đậm đặc...)"
                                    className="flex-1 w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-medium outline-none focus:border-primary text-foreground"
                                />
                                <button
                                    onClick={handleAddMapping}
                                    disabled={!newSourceId || !newDestId || Number(newMultiplier) <= 0}
                                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm transition-all disabled:opacity-40 disabled:hover:bg-primary active:scale-95 shrink-0"
                                >
                                    <Save size={14} />
                                    Lưu Cặp Liên Kết
                                </button>
                            </div>
                        </div>

                        {/* LIST OF MAPPINGS */}
                        <div className="space-y-3">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <h4 className="font-black text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                    <Layers size={14} /> Danh Sách Cặp Sản Phẩm Đã Cài Đặt ({filteredMappings.length})
                                </h4>
                                <div className="relative max-w-xs w-full">
                                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                    <input
                                        type="text"
                                        value={searchTerm}
                                        onChange={e => setSearchTerm(e.target.value)}
                                        placeholder="Lọc theo tên sản phẩm..."
                                        className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 outline-none focus:border-primary"
                                    />
                                </div>
                            </div>

                            {filteredMappings.length === 0 ? (
                                <div className="p-8 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col items-center justify-center text-center text-muted-foreground">
                                    <LinkIcon size={32} className="mb-2 opacity-30" />
                                    <p className="text-xs font-bold uppercase tracking-wider">
                                        {searchTerm ? 'Không tìm thấy liên kết phù hợp' : 'Chưa có cấu hình liên kết nào'}
                                    </p>
                                    <p className="text-[11px] mt-1 max-w-sm">
                                        Thêm cặp liên kết ở ô trên để hệ thống tự động nhảy sản phẩm lẻ mỗi khi bạn xé bao hoặc quét ảnh AI!
                                    </p>
                                </div>
                            ) : (
                                <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs divide-y divide-slate-200 dark:divide-slate-800">
                                    {filteredMappings.map((m) => {
                                        const src = allProducts.find(p => p.id === m.source_product_id);
                                        const dst = allProducts.find(p => p.id === m.dest_product_id);

                                        return (
                                            <div
                                                key={m.source_product_id}
                                                className="p-3.5 px-4 bg-white dark:bg-slate-900/60 hover:bg-slate-50 dark:hover:bg-slate-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors"
                                            >
                                                {/* Products Row */}
                                                <div className="flex-1 flex flex-col sm:flex-row items-start sm:items-center gap-3">
                                                    {/* Source */}
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="px-1.5 py-0.5 rounded-md bg-orange-500/10 text-orange-600 dark:text-orange-400 font-mono text-[9px] font-black uppercase">
                                                                Nguồn
                                                            </span>
                                                            <span className="font-black text-xs text-foreground uppercase truncate">
                                                                {src?.name || `[ID ${m.source_product_id}]`}
                                                            </span>
                                                        </div>
                                                        <div className="text-[10px] text-muted-foreground font-medium mt-0.5 flex items-center gap-2">
                                                            <span>ĐVT: <strong>{src?.unit || 'Bao'}</strong></span>
                                                            <span>•</span>
                                                            <span>Tồn: <strong>{src ? formatNumber(src.stock) : 0}</strong></span>
                                                            {src?.cost_price > 0 && (
                                                                <>
                                                                    <span>•</span>
                                                                    <span>Vốn: <strong>{formatNumber(src.cost_price)}đ</strong></span>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Arrow + Multiplier */}
                                                    <div className="flex items-center gap-2 shrink-0 px-2 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60">
                                                        <ArrowRight size={13} className="text-primary" />
                                                        <span className="text-[11px] font-black text-primary font-mono">
                                                            1 {src?.unit || 'Bao'} = {m.multiplier} {dst?.unit || 'Kg'}
                                                        </span>
                                                    </div>

                                                    {/* Destination */}
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="px-1.5 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 font-mono text-[9px] font-black uppercase">
                                                                Đích (Lẻ)
                                                            </span>
                                                            <span className="font-black text-xs text-foreground uppercase truncate">
                                                                {dst?.name || `[ID ${m.dest_product_id}]`}
                                                            </span>
                                                        </div>
                                                        <div className="text-[10px] text-muted-foreground font-medium mt-0.5 flex items-center gap-2">
                                                            <span>ĐVT: <strong>{dst?.unit || 'Kg'}</strong></span>
                                                            <span>•</span>
                                                            <span>Tồn: <strong>{dst ? formatNumber(dst.stock) : 0}</strong></span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Actions */}
                                                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                                                    <div className="flex items-center gap-1">
                                                        <span className="text-[10px] text-muted-foreground font-bold">Tỉ lệ:</span>
                                                        <input
                                                            type="number"
                                                            min="0.1"
                                                            step="any"
                                                            defaultValue={m.multiplier}
                                                            onBlur={e => handleUpdateMultiplier(m.source_product_id, e.target.value)}
                                                            className="w-14 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-1.5 py-1 text-xs font-black text-center text-primary outline-none focus:border-primary"
                                                            title="Sửa nhanh tỉ lệ quy đổi"
                                                        />
                                                    </div>

                                                    <button
                                                        onClick={() => handleDeleteMapping(m.source_product_id)}
                                                        className="p-2 text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-colors"
                                                        title="Xóa liên kết này"
                                                    >
                                                        <Trash2 size={15} />
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="p-4 px-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between shrink-0">
                        <div className="text-[11px] text-muted-foreground font-medium flex items-center gap-1.5">
                            <Info size={13} className="text-primary" />
                            Cấu hình liên kết được tự động đồng bộ trên toàn hệ thống mạng LAN
                        </div>
                        <button
                            onClick={onClose}
                            className="px-6 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-black text-xs uppercase tracking-wider rounded-xl transition-all"
                        >
                            Đóng
                        </button>
                    </div>
                </m.div>
            </div>
        </Portal>
    );
}
