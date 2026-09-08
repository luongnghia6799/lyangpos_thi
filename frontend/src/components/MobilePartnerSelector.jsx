import React, { useState, useMemo } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { Search, User, X, Plus, Check, Phone, DollarSign } from 'lucide-react';
import { usePartnerData } from '../queries/useProductData';
import { cn, removeAccents, formatNumber } from '../lib/utils';
import axios from 'axios';
import { useQueryClient } from '@tanstack/react-query';
import useMobileNative from '../hooks/useMobileNative';

export default function MobilePartnerSelector({ isOpen, onClose, onSelect, selectedPartner, type = 'Customer' }) {
    const { triggerHaptic } = useMobileNative();
    const { data: partnersData } = usePartnerData();
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const [newPartnerName, setNewPartnerName] = useState('');
    const [newPartnerPhone, setNewPartnerPhone] = useState('');

    const partners = partnersData || [];

    const filteredPartners = useMemo(() => {
        let res = partners;

        if (searchTerm) {
            const s = searchTerm.toLowerCase();
            const sNoAccent = removeAccents(s);
            res = res.filter(p => {
                const name = (p.name || '').toLowerCase();
                const phone = (p.phone || '').toLowerCase();
                return name.includes(s) || removeAccents(name).includes(sNoAccent) || phone.includes(s);
            });
        }
        return res;
    }, [partners, searchTerm]);

    const handleCreatePartner = async () => {
        if (!newPartnerName.trim()) return;
        triggerHaptic('medium');
        try {
            const res = await axios.post('/api/partners', {
                name: newPartnerName,
                phone: newPartnerPhone,
                address: '',
                is_customer: type === 'Customer',
                is_supplier: type === 'Supplier'
            });
            await queryClient.invalidateQueries(['partners']);
            onSelect(res.data);
            onClose();
            setNewPartnerName('');
            setNewPartnerPhone('');
            setIsCreating(false);
        } catch (err) {
            console.error(err);
            alert('Lỗi tạo mới đối tác');
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex flex-col justify-end bg-slate-950/70 backdrop-blur-sm android-webview">
                    {/* Backdrop Tap to Close */}
                    <div className="flex-1" onClick={onClose} />

                    {/* Bottom Sheet Drawer Container */}
                    <m.div
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                        className="bg-white dark:bg-slate-900 rounded-t-[28px] max-h-[85dvh] flex flex-col overflow-hidden border-t border-slate-200 dark:border-slate-800 shadow-2xl safe-area-pb"
                    >
                        {/* Drag Handle Indicator */}
                        <div className="pt-3 pb-1 flex justify-center">
                            <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full" />
                        </div>

                        {/* Modal Header */}
                        <div className="px-4 py-3 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <User size={20} className="text-primary dark:text-emerald-400" />
                                <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                                    Chọn {type === 'Customer' ? 'Khách Hàng' : 'Nhà Cung Cấp'}
                                </h3>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Search Bar Input */}
                        <div className="p-3 bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-200/60 dark:border-slate-800">
                            <div className="relative flex items-center">
                                <Search className="absolute left-3.5 text-slate-400" size={18} />
                                <input
                                    className="w-full bg-slate-100 dark:bg-slate-800 rounded-xl py-2.5 pl-10 pr-10 outline-none font-semibold text-sm text-slate-900 dark:text-white placeholder:text-slate-400"
                                    placeholder="Tìm theo tên hoặc số điện thoại..."
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                />
                                {searchTerm && (
                                    <button
                                        onClick={() => setSearchTerm('')}
                                        className="absolute right-3 text-slate-400 p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700"
                                    >
                                        <X size={16} />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Partners List Container */}
                        <div className="flex-1 overflow-y-auto p-3 space-y-2">
                            {/* Default Retail Option */}
                            <button
                                onClick={() => {
                                    triggerHaptic('light');
                                    onSelect(null);
                                    onClose();
                                }}
                                className={cn(
                                    "w-full p-3.5 rounded-2xl flex items-center justify-between transition-all android-touchable border",
                                    !selectedPartner
                                        ? "bg-primary/10 dark:bg-emerald-950/40 border-2 border-primary dark:border-emerald-500 text-primary dark:text-emerald-400 font-bold"
                                        : "bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/80 text-slate-800 dark:text-slate-200"
                                )}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-slate-600 dark:text-slate-300">
                                        <User size={18} />
                                    </div>
                                    <div className="text-left">
                                        <div className="font-bold text-sm">
                                            {type === 'Customer' ? 'Khách Lẻ (Tạo đơn nhanh)' : 'NCC Vãng Lai'}
                                        </div>
                                        <div className="text-xs text-slate-400 font-medium">Không ghi nhận công nợ</div>
                                    </div>
                                </div>
                                {!selectedPartner && <Check size={20} strokeWidth={2.5} />}
                            </button>

                            {/* Create New Prompt Button */}
                            {searchTerm && filteredPartners.length === 0 && !isCreating && (
                                <button
                                    onClick={() => {
                                        triggerHaptic('light');
                                        setNewPartnerName(searchTerm);
                                        setIsCreating(true);
                                    }}
                                    className="w-full p-3.5 rounded-2xl flex items-center justify-center gap-2 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 font-bold text-sm border border-emerald-200 dark:border-emerald-800/50"
                                >
                                    <Plus size={18} />
                                    <span>Tạo nhanh "{searchTerm}"</span>
                                </button>
                            )}

                            {/* Quick Create Partner Form */}
                            {isCreating && (
                                <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
                                    <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">Thêm đối tác mới</h4>
                                    <input
                                        className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-semibold outline-none text-slate-900 dark:text-white"
                                        placeholder="Tên khách hàng / Nhà cung cấp *"
                                        value={newPartnerName}
                                        onChange={e => setNewPartnerName(e.target.value)}
                                    />
                                    <input
                                        className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-semibold outline-none text-slate-900 dark:text-white"
                                        placeholder="Số điện thoại (Không bắt buộc)"
                                        value={newPartnerPhone}
                                        onChange={e => setNewPartnerPhone(e.target.value)}
                                    />
                                    <div className="flex justify-end gap-2 pt-1">
                                        <button
                                            onClick={() => setIsCreating(false)}
                                            className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700"
                                        >
                                            Hủy
                                        </button>
                                        <button
                                            onClick={handleCreatePartner}
                                            className="px-4 py-2 bg-primary dark:bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-xs"
                                        >
                                            Lưu & Chọn
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Existing Partners List */}
                            {filteredPartners.map(p => {
                                const isSelected = selectedPartner?.id === p.id;
                                return (
                                    <button
                                        key={p.id}
                                        onClick={() => {
                                            triggerHaptic('light');
                                            onSelect(p);
                                            onClose();
                                        }}
                                        className={cn(
                                            "w-full p-3.5 rounded-2xl flex items-center justify-between border transition-all text-left android-touchable",
                                            isSelected
                                                ? "bg-primary/10 dark:bg-emerald-950/40 border-2 border-primary dark:border-emerald-500 text-primary dark:text-emerald-400"
                                                : "bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/80 text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800"
                                        )}
                                    >
                                        <div className="min-w-0 flex-1 space-y-0.5">
                                            <div className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate">
                                                {p.name}
                                            </div>
                                            {p.phone && (
                                                <div className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                                    <Phone size={12} className="text-emerald-500 shrink-0" />
                                                    <span>{p.phone}</span>
                                                </div>
                                            )}
                                            {p.debt_balance !== undefined && p.debt_balance !== 0 && (
                                                <div className="text-[11px] font-semibold text-slate-400 pt-0.5">
                                                    Công nợ: <span className={cn(p.debt_balance > 0 ? "text-blue-600 dark:text-blue-400 font-bold" : "text-red-500 font-bold")}>{formatNumber(p.debt_balance)}đ</span>
                                                </div>
                                            )}
                                        </div>
                                        {isSelected && <Check size={20} strokeWidth={2.5} className="shrink-0 ml-2" />}
                                    </button>
                                );
                            })}
                        </div>
                    </m.div>
                </div>
            )}
        </AnimatePresence>
    );
}
