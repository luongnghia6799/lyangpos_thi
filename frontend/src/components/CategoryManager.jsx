import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import { 
    Plus, Trash2, Edit2, Search, X, Check,
    Package, SprayCan, Sprout, Leaf, Hammer, 
    Droplets, FlaskConical, Bug, Fuel, Truck, 
    ShoppingCart, Tags, Archive, Layers 
} from 'lucide-react';
import { AnimatePresence, m } from 'framer-motion';
import { cn } from '../lib/utils';
import CategoryIcon from './CategoryIcon';

// Danh sách Icon gợi ý cho ngành Nông nghiệp/Hàng hóa
const SUGGESTED_ICONS = [
    { id: 'SprayCan', icon: SprayCan, label: 'Thuốc trừ sâu' },
    { id: 'Sprout', icon: Sprout, label: 'Mầm cây / Phân bón' },
    { id: 'Leaf', icon: Leaf, label: 'Lá cây / Hạt giống' },
    { id: 'Droplets', icon: Droplets, label: 'Nước / Phân bón lỏng' },
    { id: 'FlaskConical', icon: FlaskConical, label: 'Hóa chất / Thuốc đặc trị' },
    { id: 'Bug', icon: Bug, label: 'Trừ sâu / Diệt côn trùng' },
    { id: 'Hammer', icon: Hammer, label: 'Dụng cụ' },
    { id: 'Fuel', icon: Fuel, label: 'Nhiên liệu' },
    { id: 'Truck', icon: Truck, label: 'Vận chuyển' },
    { id: 'Package', icon: Package, label: 'Hàng hóa chung' },
    { id: 'Archive', icon: Archive, label: 'Kho hàng' },
    { id: 'Layers', icon: Layers, label: 'Phân lớp' },
    { id: 'Tags', icon: Tags, label: 'Nhãn hiệu' },
    { id: 'ShoppingCart', icon: ShoppingCart, label: 'Giỏ hàng' },
];


export default function CategoryManager({ onToast }) {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({ name: '', icon: 'Package' });
    const [showIconPicker, setShowIconPicker] = useState(false);

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        setLoading(true);
        try {
            const res = await axios.get('/api/categories');
            setCategories(res.data);
        } catch (err) {
            onToast?.({ message: 'Lỗi khi tải danh mục', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!formData.name.trim()) return;
        setLoading(true);
        try {
            if (editingId) {
                await axios.put(`/api/categories/${editingId}`, formData);
                onToast?.({ message: 'Đã cập nhật danh mục', type: 'success' });
            } else {
                await axios.post('/api/categories', formData);
                onToast?.({ message: 'Đã thêm danh mục mới', type: 'success' });
            }
            setFormData({ name: '', icon: 'Package' });
            setIsAdding(false);
            setEditingId(null);
            fetchCategories();
        } catch (err) {
            onToast?.({ message: err.response?.data?.error || 'Lỗi khi lưu danh mục', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Bạn có chắc chắn muốn xóa danh mục này?')) return;
        setLoading(true);
        try {
            await axios.delete(`/api/categories/${id}`);
            onToast?.({ message: 'Đã xóa danh mục', type: 'success' });
            fetchCategories();
        } catch (err) {
            onToast?.({ message: err.response?.data?.error || 'Lỗi khi xóa', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-transparent backdrop-blur-2xl border-2 border-emerald-500/10 p-10 rounded-[3.5rem] relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-12 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity pointer-events-none">
                <Layers size={160} className="text-emerald-500" />
            </div>

            <div className="flex items-center justify-between mb-10">
                <div className="flex items-center gap-5">
                    <div className="p-4 bg-emerald-100/50 dark:bg-emerald-900/30 rounded-[1.5rem] text-emerald-600 shadow-inner">
                        <Tags size={28} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-gray-800 dark:text-emerald-50 uppercase tracking-tight">Phân loại hàng hóa</h2>
                        <div className="h-1 w-12 bg-emerald-500 rounded-full mt-1" />
                    </div>
                </div>
                <button 
                    onClick={() => {
                        setIsAdding(true);
                        setEditingId(null);
                        setFormData({ name: '', icon: 'Package' });
                    }}
                    className="p-4 bg-emerald-500 text-white rounded-2xl hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
                >
                    <Plus size={24} />
                </button>
            </div>

            <div className="space-y-4 relative z-10 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {categories.length === 0 && !isAdding && (
                    <div className="text-center py-10 opacity-40">
                        <Package size={48} className="mx-auto mb-2 text-[#2d5016]" />
                        <p className="text-xs font-black uppercase tracking-widest">Chưa có phân loại nào</p>
                    </div>
                )}

                {categories.map((cat) => (
                    <div key={cat.id} className="group/item flex items-center justify-between p-4 bg-transparent border-2 border-[#d4a574]/10 rounded-3xl hover:border-emerald-500/30 transition-all shadow-sm">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-transparent rounded-2xl flex items-center justify-center text-[#2d5016]">
                                <CategoryIcon name={cat.icon} size={24} />
                            </div>
                            <div className="font-black text-gray-700 dark:text-emerald-100">{cat.name}</div>
                        </div>
                        <div className="flex items-center gap-2 opacity-0 group-hover/item:opacity-100 transition-opacity">
                            <button 
                                onClick={() => {
                                    setEditingId(cat.id);
                                    setFormData({ name: cat.name, icon: cat.icon });
                                    setIsAdding(true);
                                }}
                                className="p-2 text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-xl transition-colors"
                            >
                                <Edit2 size={18} />
                            </button>
                            <button 
                                onClick={() => handleDelete(cat.id)}
                                className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-colors"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal/Overlay cho Form Thêm/Sửa sử dụng Portal */}
            {isAdding && typeof document !== 'undefined' && createPortal(
                <div className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-md z-[999] flex items-center justify-center p-4">
                    <m.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-105 dark:border-slate-800 rounded-[2.5rem] p-8 flex flex-col shadow-2xl"
                    >
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-black text-[#2d5016] dark:text-emerald-50 uppercase tracking-wider">
                                {editingId ? 'Cập nhật phân loại' : 'Thêm phân loại mới'}
                            </h3>
                            <button onClick={() => setIsAdding(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-250 transition-colors">
                                <X size={28} />
                            </button>
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-2.5">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] ml-2">Tên phân loại</label>
                                <input 
                                    autoFocus
                                    value={formData.name}
                                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                                    placeholder="Ví dụ: Thuốc trừ cỏ, Phân Kali..."
                                    className="w-full p-4 bg-transparent border-2 border-gray-150 dark:border-slate-800 rounded-2xl font-black text-gray-850 dark:text-emerald-50 outline-none focus:border-emerald-500 transition-all shadow-inner"
                                />
                            </div>

                            <div className="space-y-2.5">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] ml-2">Biểu tượng nhận diện</label>
                                <div className="grid grid-cols-5 md:grid-cols-7 gap-3 max-h-[180px] overflow-y-auto p-1 custom-scrollbar">
                                    {SUGGESTED_ICONS.map((item) => (
                                        <button
                                            key={item.id}
                                            onClick={() => setFormData({...formData, icon: item.id})}
                                            title={item.label}
                                            className={cn(
                                                "w-full aspect-square rounded-2xl flex items-center justify-center transition-all border-2",
                                                formData.icon === item.id 
                                                    ? "bg-emerald-500 text-white border-emerald-500 shadow-lg shadow-emerald-500/30 scale-110" 
                                                    : "bg-transparent text-gray-400 border-gray-100 dark:border-slate-800 hover:border-emerald-300"
                                            )}
                                        >
                                            <item.icon size={22} />
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <button
                                onClick={handleSave}
                                disabled={loading || !formData.name.trim()}
                                className="w-full py-4.5 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-[1.5rem] font-black uppercase tracking-[0.2em] shadow-xl shadow-emerald-500/30 hover:shadow-emerald-500/40 active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                            >
                                <Check size={20} />
                                {editingId ? 'XÁC NHẬN CẬP NHẬT' : 'TẠO PHÂN LOẠI'}
                            </button>
                        </div>
                    </m.div>
                </div>,
                document.body
            )}
        </div>
    );
}
