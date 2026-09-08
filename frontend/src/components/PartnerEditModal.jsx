import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { m } from 'framer-motion';
import { X, User, Phone, MapPin, CreditCard, Save } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import Toast from './Toast';

import Portal from './Portal';

export default function PartnerEditModal({ partner, isOpen, onClose, onSave }) {
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
        }
    }, [isOpen]);

    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };
        window.addEventListener('keydown', handleEsc);

        if (isOpen) {
            document.body.style.overflow = 'hidden';
            const mainContent = document.getElementById('main-content');
            if (mainContent) mainContent.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
            const mainContent = document.getElementById('main-content');
            if (mainContent) mainContent.style.overflow = 'auto';
        }

        return () => {
            window.removeEventListener('keydown', handleEsc);
            document.body.style.overflow = '';
            const mainContent = document.getElementById('main-content');
            if (mainContent) mainContent.style.overflow = 'auto';
        };
    }, [isOpen, onClose]);

    const handleSubmit = async (e) => {
        e.preventDefault();
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
        }
    };

    return (
        <Portal>
            <AnimatePresence>
                {isOpen && (
                    <div className="fixed inset-0 z-[500000] flex items-center justify-center p-4 overflow-y-auto bg-slate-950/70 backdrop-blur-sm android-webview">
                        <m.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0"
                            onClick={onClose}
                        />
                        <m.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                            className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white w-full max-w-lg rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col relative z-10 overflow-hidden"
                        >
                            <div className="p-4 px-5 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20">
                                        <Save size={20} className="text-primary" />
                                    </div>
                                    <div>
                                        <h3 className="text-base font-bold text-foreground uppercase tracking-wide leading-tight">
                                            {partner?.id ? 'Sửa thông tin đối tác' : 'Thêm đối tác mới'}
                                        </h3>
                                        <p className="text-muted-foreground text-[10px] font-medium uppercase tracking-widest mt-0.5">Chi tiết đối tác</p>
                                    </div>
                                </div>
                                <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg bg-transparent hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors">
                                    <X size={16} strokeWidth={2.5} />
                                </button>
                            </div>

                            {/* Logic tính nợ realtime khi đang gõ */}
                            {(() => {
                                const baseCurrent = partner?.debt_balance || 0;
                                const baseOpening = partner?.opening_balance || 0;
                                const currentInputOpening = formData.opening_balance || 0;
                                const realtimeDebt = (baseCurrent - baseOpening) + currentInputOpening;

                                // Gán vào biến để dùng ở dưới
                                window._realtimeDebt = realtimeDebt;
                                return null;
                            })()}

                            <form onSubmit={handleSubmit} className="flex-1 overflow-hidden flex flex-col">
                                <div className="p-5 space-y-6 overflow-y-auto custom-scrollbar">
                                    <div className="flex gap-4 p-4 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-2xl border border-emerald-100 dark:border-emerald-800/50">
                                    <label className="flex-1 flex items-center gap-2 cursor-pointer group">
                                        <input
                                            type="checkbox"
                                            className="w-5 h-5 rounded-lg border-2 border-emerald-200 text-emerald-600 focus:ring-emerald-500"
                                            checked={formData.is_customer}
                                            onChange={e => setFormData({ ...formData, is_customer: e.target.checked })}
                                        />
                                        <span className="text-sm font-black uppercase text-emerald-700 dark:text-emerald-400 group-hover:text-emerald-600">Khách Hàng</span>
                                    </label>
                                    <label className="flex-1 flex items-center gap-2 cursor-pointer group">
                                        <input
                                            type="checkbox"
                                            className="w-5 h-5 rounded-lg border-2 border-emerald-200 text-emerald-600 focus:ring-emerald-500"
                                            checked={formData.is_supplier}
                                            onChange={e => setFormData({ ...formData, is_supplier: e.target.checked })}
                                        />
                                        <span className="text-sm font-black uppercase text-emerald-700 dark:text-emerald-400 group-hover:text-emerald-600">Nhà Cung Cấp</span>
                                    </label>
                                </div>

                                <div className="space-y-4">
                                    <div className="relative">
                                        <label className="block text-[10px] font-black uppercase text-muted-foreground mb-1.5 ml-1 tracking-widest">Tên đối tác</label>
                                        <div className="relative">
                                            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500 drop-shadow-[0_0_5px_rgba(16,185,129,0.5)]" size={20} />
                                            <input
                                                required
                                                type="text"
                                                className="input-premium w-full pr-4 py-3.5 font-black"
                                                style={{ paddingLeft: '3.5rem' }}
                                                placeholder="Ví dụ: Nguyễn Văn A"
                                                value={formData.name}
                                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                                autoComplete="off"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="relative">
                                            <label className="block text-[10px] font-black uppercase text-muted-foreground mb-1.5 ml-1 tracking-widest">Số CCCD</label>
                                            <div className="relative">
                                                <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500 drop-shadow-[0_0_5px_rgba(16,185,129,0.5)]" size={20} />
                                                <input
                                                    type="text"
                                                    className="input-premium w-full pr-4 py-3.5 font-bold"
                                                    style={{ paddingLeft: '3.5rem' }}
                                                    placeholder="Số thẻ căn cước"
                                                    value={formData.cccd || ''}
                                                    onChange={e => setFormData({ ...formData, cccd: e.target.value })}
                                                    autoComplete="off"
                                                />
                                            </div>
                                        </div>
                                        <div className="relative">
                                            <label className="block text-[10px] font-black uppercase text-muted-foreground mb-1.5 ml-1 tracking-widest">Điện thoại</label>
                                            <div className="relative">
                                                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500 drop-shadow-[0_0_5px_rgba(16,185,129,0.5)]" size={20} />
                                                <input
                                                    type="text"
                                                    className="input-premium w-full pr-4 py-3.5 font-bold"
                                                    style={{ paddingLeft: '3.5rem' }}
                                                    placeholder="Số điện thoại"
                                                    value={formData.phone}
                                                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                                    autoComplete="off"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="relative">
                                        <label className="block text-[10px] font-black uppercase text-muted-foreground mb-1.5 ml-1 tracking-widest">Địa chỉ</label>
                                        <div className="relative">
                                            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500 drop-shadow-[0_0_5px_rgba(16,185,129,0.5)]" size={20} />
                                            <input
                                                type="text"
                                                className="input-premium w-full pr-4 py-3.5 font-bold"
                                                style={{ paddingLeft: '3.5rem' }}
                                                placeholder="Địa chỉ liên hệ"
                                                value={formData.address}
                                                onChange={e => setFormData({ ...formData, address: e.target.value })}
                                                autoComplete="off"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="relative">
                                            <label className="block text-[10px] font-black uppercase text-muted-foreground mb-1.5 ml-1 tracking-widest">Công nợ ban đầu</label>
                                            <div className="relative">
                                                <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground opacity-50" size={16} />
                                                <input
                                                    type="number"
                                                    className="input-premium w-full pr-4 py-3 font-black text-blue-600 dark:text-blue-400"
                                                    style={{ paddingLeft: '2.5rem' }}
                                                    value={formData.opening_balance}
                                                    onChange={e => setFormData({ ...formData, opening_balance: parseFloat(e.target.value) || 0 })}
                                                    autoComplete="off"
                                                />
                                            </div>
                                            <p className="text-[9px] text-muted-foreground mt-1 ml-1 italic">* Nhập tay nợ cũ (nếu có)</p>
                                        </div>
                                        <div className="relative">
                                            <label className="block text-[10px] font-black uppercase text-muted-foreground mb-1.5 ml-1 tracking-widest">Công nợ hiện tại</label>
                                            <div className="relative">
                                                <div className="absolute left-3 top-1/2 -translate-y-1/2">
                                                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                                </div>
                                                <input
                                                    readOnly
                                                    disabled
                                                    type="text"
                                                    className="input-premium w-full pr-4 py-3 font-black bg-background/50 border-border cursor-not-allowed opacity-80"
                                                    style={{ paddingLeft: '2.5rem' }}
                                                    value={new Intl.NumberFormat('vi-VN').format(window._realtimeDebt || 0)}
                                                />
                                            </div>
                                            <p className="text-[9px] text-emerald-500 mt-1 ml-1 font-bold uppercase tracking-tighter">🔒 Tự động tính</p>
                                        </div>
                                    </div>
                                </div>

                                </div>

                                <div className="p-6 bg-card border-t border-border flex justify-end gap-3 shrink-0">
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        className="px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-wider text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors"
                                    >
                                        Hủy bỏ
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-8 py-3 bg-primary hover:bg-primary-hover text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-2"
                                    >
                                        <Save size={16} /> Lưu đối tác
                                    </button>
                                </div>
                            </form>
                        </m.div>
                    </div>
                )}
                <AnimatePresence>
                    {toast && (
                        <Toast
                            message={toast.message}
                            type={toast.type}
                            onClose={() => setToast(null)}
                        />
                    )}
                </AnimatePresence>
            </AnimatePresence>
        </Portal>
    );
}
