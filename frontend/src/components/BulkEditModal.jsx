
import React, { useState, useEffect } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { X, Save, Tags, Hash, List, Sparkles, Type, Binary } from 'lucide-react';
import { cn } from '../lib/utils';
import Portal from './Portal';
import CategoryIcon from './CategoryIcon';

// Helper to remove Vietnamese tones
const removeVietnameseTones = (str) => {
    str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, "a");
    str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, "e");
    str = str.replace(/ì|í|ị|ỉ|ĩ/g, "i");
    str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, "o");
    str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, "u");
    str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, "y");
    str = str.replace(/đ/g, "d");
    str = str.replace(/À|Á|Ạ|Ả|Ã|Â|Ầ|Ấ|Ậ|Ẩ|Ẫ|Ă|Ằ|Ắ|Ặ|Ẳ|Ẵ/g, "A");
    str = str.replace(/È|É|Ẹ|Ẻ|Ẽ|Ê|Ề|Ế|Ệ|Ể|Ễ/g, "E");
    str = str.replace(/Ì|Í|Ị|Ỉ|Ĩ/g, "I");
    str = str.replace(/Ò|Ó|Ọ|Ỏ|Õ|Ô|Ồ|Ố|Ộ|Ổ|Ỗ|Ơ|Ờ|Ớ|Ợ|Ở|Ỡ/g, "O");
    str = str.replace(/Ù|Ú|Ụ|Ủ|Ũ|Ư|Ừ|Ứ|Ự|Ử|Ữ/g, "U");
    str = str.replace(/Ỳ|Ý|Ỵ|Ỷ|Ỹ/g, "Y");
    str = str.replace(/Đ/g, "D");
    return str;
};

// Helper to get abbreviation
const getAbbreviation = (name) => {
    const cleanName = removeVietnameseTones(name).replace(/[^a-zA-Z0-9 ]/g, "");
    return cleanName
        .split(' ')
        .filter(word => word.length > 0)
        .map(word => word[0])
        .join('')
        .toUpperCase();
};

export default function BulkEditModal({ 
    isOpen, 
    onClose, 
    selectedProducts, 
    categories, 
    onSave 
}) {
    const [categoryId, setCategoryId] = useState('');
    const [skuMode, setSkuMode] = useState('none'); // 'none', 'numeric', 'abbreviation'
    const [autoSkuPrefix, setAutoSkuPrefix] = useState('');
    const [startNumber, setStartNumber] = useState(1);
    const [previewCodes, setPreviewCodes] = useState([]);

    useEffect(() => {
        // Reset preview if mode is none
        if (skuMode === 'none') {
            setPreviewCodes([]);
            return;
        }

        const preview = selectedProducts.map((p, index) => {
            let newCode = p.code;
            if (skuMode === 'numeric' && autoSkuPrefix) {
                newCode = `${autoSkuPrefix}${String(startNumber + index).padStart(3, '0')}`;
            } else if (skuMode === 'abbreviation') {
                newCode = `${autoSkuPrefix}${getAbbreviation(p.name)}`;
            }
            
            return {
                id: p.id,
                name: p.name,
                oldCode: p.code,
                newCode: newCode
            };
        });
        setPreviewCodes(preview);
    }, [skuMode, autoSkuPrefix, startNumber, selectedProducts]);

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        
        const updateData = {};
        if (categoryId === 'none') {
            updateData.category_id = null;
        } else if (categoryId) {
            updateData.category_id = categoryId;
        }

        if (skuMode !== 'none') {
            const skuMap = {};
            previewCodes.forEach(item => {
                skuMap[item.id] = item.newCode;
            });
            updateData.sku_map = skuMap;
        }

        onSave(updateData);
    };

    return (
        <Portal>
            <AnimatePresence>
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
                    <m.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="bg-transparent w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden border border-white dark:border-slate-800 flex flex-col max-h-[90vh]"
                    >
                        {/* Header */}
                        <div className="p-8 border-b dark:border-slate-800 flex justify-between items-center bg-emerald-50/30 dark:bg-emerald-950/10">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-emerald-500 rounded-2xl text-white shadow-lg shadow-emerald-500/20">
                                    <Sparkles size={24} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-[#2d5016] dark:text-emerald-400 uppercase tracking-tighter">Xử lý hàng loạt thông minh</h2>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-0.5">Đang chọn {selectedProducts.length} sản phẩm</p>
                                </div>
                            </div>
                            <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                            {/* Phân loại */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 text-emerald-600">
                                    <Tags size={16} />
                                    <span className="text-xs font-black uppercase tracking-widest">Gán phân loại chung</span>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setCategoryId(categoryId === 'none' ? '' : 'none')}
                                        className={cn(
                                            "flex items-center gap-3 p-3 rounded-2xl border-2 transition-all text-left group",
                                            categoryId === 'none' 
                                                ? "bg-transparent-panel0 border-slate-500 text-white shadow-lg shadow-slate-500/20" 
                                                : "bg-transparent border-transparent hover:border-slate-200 dark:hover:border-slate-700 text-gray-600 dark:text-gray-400"
                                        )}
                                    >
                                        <div className={cn(
                                            "p-1.5 rounded-lg transition-colors",
                                            categoryId === 'none' ? "bg-white/20" : "bg-transparent dark:bg-slate-700 shadow-sm"
                                        )}>
                                            <Package size={14} className={categoryId === 'none' ? "text-white" : "text-slate-400"} />
                                        </div>
                                        <span className="text-[10px] font-black truncate leading-tight">Chưa phân loại</span>
                                    </button>
                                    {categories.map(cat => (
                                        <button
                                            key={cat.id}
                                            type="button"
                                            onClick={() => setCategoryId(cat.id === categoryId ? '' : cat.id)}
                                            className={cn(
                                                "flex items-center gap-3 p-3 rounded-2xl border-2 transition-all text-left group",
                                                categoryId === cat.id 
                                                    ? "bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/20" 
                                                    : "bg-transparent border-transparent hover:border-emerald-200 dark:hover:border-emerald-900/30 text-gray-600 dark:text-gray-400"
                                            )}
                                        >
                                            <div className={cn(
                                                "p-1.5 rounded-lg transition-colors",
                                                categoryId === cat.id ? "bg-white/20" : "bg-transparent dark:bg-slate-700 shadow-sm group-hover:bg-emerald-50"
                                            )}>
                                                <CategoryIcon name={cat.icon} size={14} />
                                            </div>
                                            <span className="text-[10px] font-black truncate leading-tight">{cat.name}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Mã hàng hóa */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 text-blue-600">
                                    <Hash size={16} />
                                    <span className="text-xs font-black uppercase tracking-widest">Tạo mã hàng thông minh</span>
                                </div>

                                {/* SKU Mode Toggle */}
                                <div className="flex p-1.5 bg-transparent rounded-2xl gap-1">
                                    <button
                                        type="button"
                                        onClick={() => setSkuMode('none')}
                                        className={cn(
                                            "flex-1 py-3 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2",
                                            skuMode === 'none' ? "bg-white dark:bg-slate-700 text-gray-800 dark:text-white shadow-sm" : "text-gray-400 hover:text-gray-600"
                                        )}
                                    >
                                        <X size={14} /> Không đổi mã
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setSkuMode('abbreviation')}
                                        className={cn(
                                            "flex-1 py-3 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2",
                                            skuMode === 'abbreviation' ? "bg-[#2d5016] text-white shadow-lg shadow-[#2d5016]/20" : "text-gray-400 hover:text-gray-600"
                                        )}
                                    >
                                        <Type size={14} /> Viết tắt từ tên
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setSkuMode('numeric')}
                                        className={cn(
                                            "flex-1 py-3 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2",
                                            skuMode === 'numeric' ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20" : "text-gray-400 hover:text-gray-600"
                                        )}
                                    >
                                        <Binary size={14} /> Số tăng dần
                                    </button>
                                </div>

                                {skuMode !== 'none' && (
                                    <m.div 
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="grid grid-cols-1 md:grid-cols-2 gap-4"
                                    >
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">
                                                Tiền tố (Prefix) {skuMode === 'abbreviation' && <span className="text-gray-300">(Tùy chọn)</span>}
                                            </label>
                                            <input 
                                                type="text" 
                                                placeholder={skuMode === 'numeric' ? "Ví dụ: T-" : "VD: CH- (Của hàng)"}
                                                className="input-premium w-full p-4 font-black uppercase"
                                                value={autoSkuPrefix}
                                                onChange={e => setAutoSkuPrefix(e.target.value)}
                                            />
                                        </div>
                                        {skuMode === 'numeric' && (
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Số bắt đầu</label>
                                                <input 
                                                    type="number" 
                                                    className="input-premium w-full p-4 font-black"
                                                    value={startNumber}
                                                    onChange={e => setStartNumber(parseInt(e.target.value) || 1)}
                                                />
                                            </div>
                                        )}
                                    </m.div>
                                )}

                                {/* Preview Area */}
                                {previewCodes.length > 0 && (
                                    <div className="mt-6 p-6 bg-transparent rounded-3xl border-2 border-slate-100 dark:border-slate-800 shadow-inner">
                                        <div className="flex items-center gap-2 mb-4 text-[#2d5016] dark:text-emerald-400">
                                            <List size={14} />
                                            <span className="text-[10px] font-black uppercase tracking-widest">Xem trước mã hàng dự kiến</span>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                                            {previewCodes.map(item => (
                                                <div key={item.id} className="flex flex-col gap-1 p-2 hover:bg-white dark:hover:bg-slate-700 rounded-xl transition-all">
                                                    <span className="text-[9px] text-gray-400 font-black uppercase tracking-tighter truncate">{item.name}</span>
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-[10px] text-gray-300 line-through tabular-nums opacity-50">{item.oldCode || '(Trống)'}</span>
                                                        <span className={cn(
                                                            "text-xs font-black tabular-nums",
                                                            skuMode === 'abbreviation' ? "text-[#2d5016] dark:text-emerald-400" : "text-blue-600"
                                                        )}>→ {item.newCode}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </form>

                        {/* Footer */}
                        <div className="p-8 border-t dark:border-slate-800 flex gap-4 bg-transparent/50 dark:bg-slate-800/30">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 px-6 py-4 bg-transparent text-gray-400 dark:text-gray-500 rounded-2xl font-black text-xs uppercase tracking-widest border border-gray-200 dark:border-slate-700 hover:bg-transparent transition-all"
                            >
                                Hủy bỏ
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={!categoryId && skuMode === 'none'}
                                className="flex-3 px-10 py-4 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-emerald-500/20 hover:bg-emerald-700 disabled:opacity-50 transition-all flex items-center justify-center gap-3"
                            >
                                <Save size={18} /> Lưu {selectedProducts.length} mục
                            </button>
                        </div>
                    </m.div>
                </div>
            </AnimatePresence>
        </Portal>
    );
}
