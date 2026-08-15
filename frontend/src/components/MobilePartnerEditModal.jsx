import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { m, AnimatePresence } from 'framer-motion';
import { X, User, Phone, MapPin, CreditCard, ChevronDown } from 'lucide-react';
import Toast from './Toast';
import Portal from './Portal';

export default function MobilePartnerEditModal({ partner, isOpen, onClose, onSave }) {
    const DEFAULT_PARTNER = {
        name: '',
        is_customer: true,
        is_supplier: false,
        cccd: '',
        phone: '',
        address: '',
        debt_balance: 0,
        opening_balance: 0
    };

    const [formData, setFormData] = useState(DEFAULT_PARTNER);
    const [toast, setToast] = useState(null);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (isOpen) {
            if (partner) {
                setFormData(prev => {
                    if (partner.id && prev.id === partner.id) return prev;
                    return { ...DEFAULT_PARTNER, ...partner };
                });
            } else {
                setFormData(DEFAULT_PARTNER);
            }
            // Prevent scrolling on body when modal is open
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }

        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen, partner]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isSaving) return;
        setIsSaving(true);
        try {
            let res;
            if (partner?.id) {
                res = await axios.put(`/api/partners/${partner.id}`, formData);
            } else {
                res = await axios.post('/api/partners', formData);
            }
            // Broadcast sync for realtime update
            const syncChannel = new BroadcastChannel('pos_data_sync');
            syncChannel.postMessage({ type: 'PARTNER_UPDATED', partnerId: partner?.id || res.data.id });
            syncChannel.close();

            onSave(res.data);
            onClose();
        } catch (err) {
            console.error(err);
            setToast({ message: err.response?.data?.error || "Lỗi khi lưu đối tác.", type: "error" });
        } finally {
            setIsSaving(false);
        }
    };

    const realtimeDebt = (partner?.debt_balance || 0) - (partner?.opening_balance || 0) + (formData.opening_balance || 0);

    return (
        <Portal>
            <AnimatePresence>
                {isOpen && (
                    <div className="fixed inset-0 z-[2000] flex flex-col justify-end overflow-hidden">
                        {/* Backdrop */}
                        <m.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                            onClick={onClose}
                        />

                        <m.div
                            initial={{ y: "100%" }}
                            animate={{ y: 0 }}
                            exit={{ y: "100%" }}
                            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                            className="w-full bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-t-[2rem] shadow-2xl relative z-10 flex flex-col max-h-[90vh]"
                        >
                            <div className="flex-shrink-0 bg-white dark:bg-slate-900 rounded-t-[2rem] px-5 pt-3 pb-4 border-b border-slate-200/80 dark:border-slate-800">
                                <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mb-4" />
                                <div className="flex justify-between items-center">
                                    <h2 className="text-lg font-extrabold text-slate-900 dark:text-slate-100 uppercase tracking-tight">
                                        {partner?.id ? 'Sửa Đối Tác' : 'Thêm Đối Tác'}
                                    </h2>
                                    <button onClick={onClose} className="p-2 rounded-full text-slate-400 hover:text-rose-500 transition-colors">
                                        <X size={20} />
                                    </button>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-5 custom-scrollbar bg-white dark:bg-slate-900">
                                <form id="mobile-partner-form" onSubmit={handleSubmit} className="space-y-5">
                                    
                                    <div className="flex gap-3 p-3 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200/80 dark:border-slate-800">
                                        <label className="flex-1 flex items-center gap-2 cursor-pointer group bg-emerald-50 dark:bg-emerald-950/40 p-2.5 rounded-xl border border-emerald-200 dark:border-emerald-800/60">
                                            <input
                                                type="checkbox"
                                                className="w-5 h-5 rounded-md border-emerald-300 text-emerald-600 focus:ring-emerald-500"
                                                checked={formData.is_customer}
                                                onChange={e => setFormData({ ...formData, is_customer: e.target.checked })}
                                            />
                                            <span className="text-xs font-extrabold uppercase text-emerald-800 dark:text-emerald-300">Khách Hàng</span>
                                        </label>
                                        <label className="flex-1 flex items-center gap-2 cursor-pointer group bg-amber-50 dark:bg-amber-950/40 p-2.5 rounded-xl border border-amber-200 dark:border-amber-800/60">
                                            <input
                                                type="checkbox"
                                                className="w-5 h-5 rounded-md border-amber-300 text-amber-600 focus:ring-amber-500"
                                                checked={formData.is_supplier}
                                                onChange={e => setFormData({ ...formData, is_supplier: e.target.checked })}
                                            />
                                            <span className="text-xs font-extrabold uppercase text-amber-800 dark:text-amber-300">Nhà CC</span>
                                        </label>
                                    </div>

                                    <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 space-y-4">
                                        <div className="relative">
                                            <label className="block text-[10px] font-extrabold uppercase text-slate-400 mb-1.5 ml-1 tracking-wider">Tên đối tác *</label>
                                            <div className="relative">
                                                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-primary dark:text-emerald-400" size={18} />
                                                <input
                                                    required
                                                    type="text"
                                                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pr-4 py-3 font-extrabold uppercase text-sm focus:border-primary outline-none transition-all text-slate-900 dark:text-white"
                                                    style={{ paddingLeft: '2.8rem' }}
                                                    placeholder="VÍ DỤ: NGUYỄN VĂN A"
                                                    value={formData.name}
                                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                                />
                                            </div>
                                        </div>

                                        <div className="relative">
                                            <label className="block text-[10px] font-extrabold uppercase text-slate-400 mb-1.5 ml-1 tracking-wider">Điện thoại</label>
                                            <div className="relative">
                                                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-primary dark:text-emerald-400" size={18} />
                                                <input
                                                    type="tel"
                                                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pr-4 py-3 font-bold text-sm focus:border-primary outline-none transition-all text-slate-900 dark:text-white"
                                                    style={{ paddingLeft: '2.8rem' }}
                                                    placeholder="Số điện thoại"
                                                    value={formData.phone}
                                                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 space-y-4">
                                        <div className="relative">
                                            <label className="block text-[10px] font-extrabold uppercase text-slate-400 mb-1.5 ml-1 tracking-wider">Số CCCD</label>
                                            <div className="relative">
                                                <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                                <input
                                                    type="text"
                                                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pr-4 py-3 font-bold text-sm focus:border-primary outline-none transition-all text-slate-900 dark:text-white"
                                                    style={{ paddingLeft: '2.8rem' }}
                                                    placeholder="Số CCCD"
                                                    value={formData.cccd || ''}
                                                    onChange={e => setFormData({ ...formData, cccd: e.target.value })}
                                                />
                                            </div>
                                        </div>

                                        <div className="relative">
                                            <label className="block text-[10px] font-extrabold uppercase text-slate-400 mb-1.5 ml-1 tracking-wider">Địa chỉ</label>
                                            <div className="relative">
                                                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                                <input
                                                    type="text"
                                                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pr-4 py-3 font-bold text-sm focus:border-primary outline-none transition-all text-slate-900 dark:text-white"
                                                    style={{ paddingLeft: '2.8rem' }}
                                                    placeholder="Địa chỉ"
                                                    value={formData.address}
                                                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 space-y-4">
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-[10px] font-extrabold uppercase text-slate-400 mb-1 tracking-wider">Công nợ ban đầu</label>
                                                <input
                                                    type="number"
                                                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 font-black text-sm text-primary dark:text-emerald-400 outline-none"
                                                    value={formData.initial_debt}
                                                    onChange={e => setFormData({ ...formData, initial_debt: parseFloat(e.target.value) || 0 })}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-extrabold uppercase text-slate-400 mb-1 tracking-wider">Nợ hiện tại *</label>
                                                <input
                                                    type="number"
                                                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 font-black text-sm text-slate-900 dark:text-white outline-none"
                                                    value={formData.current_debt}
                                                    onChange={e => setFormData({ ...formData, current_debt: parseFloat(e.target.value) || 0 })}
                                                />
                                            </div>
                                        </div>
                                        <p className="text-[10px] font-semibold text-slate-400 italic text-center">* Nhập tay nợ cũ (nếu có)</p>
                                    </div>

                                    <div className="h-10" />
                                </form>
                            </div>

                            <div className="flex-shrink-0 bg-white dark:bg-slate-900 p-4 border-t border-slate-200/80 dark:border-slate-800 flex gap-3 pb-[max(env(safe-area-inset-bottom),16px)]">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="flex-1 py-3.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-2xl font-extrabold uppercase text-xs active:scale-95 transition-transform"
                                >
                                    Hủy
                                </button>
                                <button
                                    type="submit"
                                    form="mobile-partner-form"
                                    disabled={isSaving}
                                    className="flex-[2] py-3.5 bg-gradient-to-r from-primary to-emerald-600 text-white rounded-2xl font-extrabold uppercase text-xs shadow-lg shadow-emerald-600/25 active:scale-95 transition-transform disabled:opacity-70 flex justify-center items-center gap-2"
                                >
                                    {isSaving ? "Đang lưu..." : "Lưu đối tác"}
                                </button>
                            </div>
                        </m.div>
                    </div>
                )}
            </AnimatePresence>
            
            <AnimatePresence>
                {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
            </AnimatePresence>
        </Portal>
    );
}
