/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Printer, Lock, Globe, Store, Moon, ChevronRight, Monitor, Menu, Github, Check, Upload, X } from 'lucide-react';
import MobileMenu from '../../components/MobileMenu';
import { cn } from '../../lib/utils';
import axios from 'axios';

export default function MobileSettings() {
    const navigate = useNavigate();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    
    // Global Settings
    const [settings, setSettings] = useState({});
    const [templates, setTemplates] = useState([]);
    
    // Modals
    const [activeModal, setActiveModal] = useState(null); // 'store', 'printer'
    const [isDarkMode, setIsDarkMode] = useState(false);
    
    // Form states
    const [storeForm, setStoreForm] = useState({ shop_name: '', shop_address: '', shop_phone: '', invoice_logo_url: '' });
    
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState(null);

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 2000);
    };

    useEffect(() => {
        const fetchAll = async () => {
            try {
                const [setRes, tplRes] = await Promise.all([
                    axios.get('/api/settings'),
                    axios.get('/api/print-templates')
                ]);
                if (setRes.data) {
                    setSettings(setRes.data);
                    setStoreForm({
                        shop_name: setRes.data.shop_name || '',
                        shop_address: setRes.data.shop_address || '',
                        shop_phone: setRes.data.shop_phone || '',
                        invoice_logo_url: setRes.data.invoice_logo_url || ''
                    });
                }
                if (tplRes.data) {
                    setTemplates(tplRes.data);
                }
            } catch (err) {
                console.error("Failed to fetch settings", err);
            }
        };
        fetchAll();
        
        setIsDarkMode(document.documentElement.classList.contains('dark') || localStorage.getItem('theme') === 'dark');
    }, []);

    const handleToggleDarkMode = () => {
        const html = document.documentElement;
        if (html.classList.contains('dark')) {
            html.classList.remove('dark');
            localStorage.setItem('theme', 'light');
            setIsDarkMode(false);
        } else {
            html.classList.add('dark');
            localStorage.setItem('theme', 'dark');
            setIsDarkMode(true);
        }
    };

    const handleLogoUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setSaving(true);
        const formData = new FormData();
        formData.append('logo', file);
        try {
            const res = await axios.post('/api/upload-logo', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            if (res.data && res.data.url) {
                setStoreForm(prev => ({ ...prev, invoice_logo_url: res.data.url }));
                showToast("Đã tải logo lên thành công!");
            }
        } catch (err) {
            console.error("Upload error", err);
            showToast("Lỗi tải logo", "error");
        } finally {
            setSaving(false);
        }
    };

    const saveStoreSettings = async () => {
        setSaving(true);
        try {
            await axios.post('/api/settings', { ...settings, ...storeForm });
            setSettings(prev => ({ ...prev, ...storeForm }));
            showToast("Đã lưu thông tin cửa hàng");
            setActiveModal(null);
        } catch (err) {
            console.error(err);
            showToast("Lỗi lưu thông tin", "error");
        } finally {
            setSaving(false);
        }
    };

    const setTemplateActive = async (templateId) => {
        setSaving(true);
        try {
            await axios.put(`/api/print-templates/${templateId}`, { is_default: true, is_active: true });
            const tplRes = await axios.get('/api/print-templates');
            setTemplates(tplRes.data);
            showToast("Đã cập nhật template mặc định");
        } catch (err) {
            console.error(err);
            showToast("Lỗi cập nhật template", "error");
        } finally {
            setSaving(false);
        }
    };

    const activeTemplate = templates.find(t => t.is_default) || templates[0];

    const SettingItem = ({ icon: Icon, label, value, onClick, colorClass = "bg-transparent text-gray-500", rightElement }) => (
        <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={onClick}
            className="w-full flex items-center justify-between p-4 bg-transparent border-b border-gray-50 dark:border-slate-800/50 last:border-0 transition-all hover:bg-transparent dark:hover:bg-slate-800/50"
        >
            <div className="flex items-center gap-4">
                <div className={cn("w-11 h-11 rounded-[1.25rem] flex items-center justify-center shadow-inner", colorClass)}>
                    {Icon && <Icon size={20} />}
                </div>
                <div className="flex flex-col items-start text-left">
                    <span className="font-black text-[13px] uppercase tracking-wider text-gray-800 dark:text-gray-100">{label}</span>
                    {value && <span className="text-[10px] font-bold text-gray-400 mt-0.5">{value}</span>}
                </div>
            </div>
            {rightElement ? rightElement : <ChevronRight size={18} className="text-gray-300 dark:text-gray-600" />}
        </motion.button>
    );

    return (
        <div className="h-[100dvh] bg-transparent dark:bg-slate-950 flex flex-col overflow-hidden font-sans">
            <div className="flex-1 flex flex-col overflow-hidden no-print">
            <MobileMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />

            {/* Elegant Header */}
            <div className="bg-transparent backdrop-blur-md border-b border-gray-150 dark:border-slate-800/80 px-4 py-3 flex items-center justify-between z-20 shrink-0 relative">
                <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-primary/30 via-emerald-500/30 to-primary/30"></div>
                <button 
                    onClick={() => setIsMenuOpen(true)} 
                    className="p-2.5 rounded-2xl bg-gradient-to-r from-primary to-emerald-600 text-white shadow-md shadow-primary/20 active:scale-95 transition-all"
                >
                    <Menu size={20} strokeWidth={2.5} />
                </button>
                <div className="flex flex-col items-center text-center flex-1 mx-4">
                    <h1 className="font-extrabold text-sm uppercase tracking-wide font-['Be_Vietnam_Pro'] bg-gradient-to-r from-primary to-emerald-600 bg-clip-text text-transparent">
                        Cài Đặt
                    </h1>
                    <div className="text-[9px] font-black text-gray-450 dark:text-gray-400 uppercase tracking-widest mt-0.5 opacity-80">
                        Cấu hình hệ thống
                    </div>
                </div>
                <div className="w-[42px] h-[42px]"></div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-32">
                {/* Profile Section */}
                <div className="flex flex-col items-center py-6 bg-transparent rounded-[2rem] shadow-sm shadow-black/5 border border-gray-100 dark:border-slate-800 relative">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-primary to-green-300 p-1 mb-4 relative overflow-hidden shadow-lg shadow-primary/20">
                        {storeForm.invoice_logo_url ? (
                            <img src={storeForm.invoice_logo_url} alt="Logo" className="w-full h-full object-cover rounded-full bg-white border-2 border-white dark:border-slate-900" />
                        ) : (
                            <div className="w-full h-full rounded-full bg-transparent flex items-center justify-center text-primary font-black text-3xl border-2 border-white dark:border-slate-900">
                                {storeForm.shop_name?.substring(0,2).toUpperCase() || 'LY'}
                            </div>
                        )}
                    </div>
                    <span className="font-black text-xl text-gray-800 dark:text-gray-100 italic">{storeForm.shop_name || 'Lyang Store'}</span>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mt-1">{storeForm.shop_phone || 'Admin Account'}</span>
                </div>

                {/* Groups */}
                <div className="space-y-6">
                    <div>
                        <div className="text-[10px] font-black text-gray-400 uppercase tracking-[0.15em] mb-2 pl-2">Vận hành</div>
                        <div className="bg-transparent rounded-[2rem] overflow-hidden shadow-sm shadow-black/5 border border-gray-100 dark:border-slate-800/60 p-1">
                            <SettingItem 
                                icon={Store} 
                                label="Thông tin cửa hàng" 
                                value="Sửa tên, địa chỉ, logo" 
                                colorClass="bg-gradient-to-br from-blue-400 to-cyan-500 text-white shadow-blue-500/20" 
                                onClick={() => setActiveModal('store')}
                            />
                            <SettingItem 
                                icon={Printer} 
                                label="Máy in" 
                                value={`Template: ${activeTemplate?.name || 'Mặc định'}`} 
                                colorClass="bg-gradient-to-br from-orange-400 to-amber-500 text-white shadow-orange-500/20" 
                                onClick={() => setActiveModal('printer')}
                            />
                        </div>
                    </div>

                    <div>
                        <div className="text-[10px] font-black text-gray-400 uppercase tracking-[0.15em] mb-2 pl-2">Bảo mật & Giao diện</div>
                        <div className="bg-transparent rounded-[2rem] overflow-hidden shadow-sm shadow-black/5 border border-gray-100 dark:border-slate-800/60 p-1">
                            <SettingItem 
                                icon={Moon} 
                                label="Giao diện (Dark Mode)" 
                                value="Chuyển đổi giao diện tối" 
                                colorClass="bg-gradient-to-br from-purple-400 to-indigo-500 text-white shadow-purple-500/20" 
                                onClick={handleToggleDarkMode}
                                rightElement={
                                    <div className={cn("w-12 h-6 rounded-full p-1 transition-colors duration-300 shadow-inner", isDarkMode ? "bg-primary" : "bg-gray-200 dark:bg-slate-700")}>
                                        <div className={cn("w-4 h-4 bg-white rounded-full shadow-md transition-transform duration-300", isDarkMode ? "translate-x-6" : "translate-x-0")} />
                                    </div>
                                }
                            />
                            <SettingItem icon={Lock} label="Mật khẩu" value="Thay đổi mã PIN (Bản PC)" colorClass="bg-gradient-to-br from-red-400 to-rose-500 text-white shadow-red-500/20" onClick={() => showToast("Chức năng này cần thao tác trên Máy tính", "info")} />
                        </div>
                    </div>
                </div>

                {/* Hero Action */}
                <button
                    onClick={() => navigate('/')}
                    className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 p-5 rounded-3xl flex items-center justify-center gap-3 font-black uppercase tracking-widest text-xs shadow-xl active:scale-[0.98] transition-all"
                >
                    <Monitor size={18} />
                    Chuyển sang Máy tính
                </button>

                <div className="flex flex-col items-center gap-1 opacity-20 py-4">
                    <Github size={16} />
                    <span className="text-[10px] font-bold">Lyang POS v1.1.0 • Stable Build</span>
                </div>
            </div>
            </div>

            {/* Modals */}
            <AnimatePresence>
                {activeModal === 'store' && (
                    <motion.div
                        initial={{ opacity: 0, y: '100%' }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: '100%' }}
                        transition={{ type: 'spring', bounce: 0, duration: 0.3 }}
                        className="fixed inset-0 z-[60] bg-transparent flex flex-col"
                    >
                        <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-slate-800 pt-8">
                            <button onClick={() => setActiveModal(null)} className="p-2 -ml-2 text-gray-500"><X size={24} /></button>
                            <span className="font-black uppercase tracking-widest text-sm">Thông tin cửa hàng</span>
                            <button onClick={saveStoreSettings} disabled={saving} className="p-2 -mr-2 text-primary font-black uppercase text-xs">{saving ? '...' : 'Lưu'}</button>
                        </div>
                        <div className="p-4 space-y-4 overflow-y-auto">
                            <div className="flex flex-col items-center gap-3 mb-6">
                                <div className="w-24 h-24 rounded-full bg-transparent border-2 border-dashed border-gray-300 dark:border-slate-700 flex flex-col items-center justify-center relative overflow-hidden">
                                    {storeForm.invoice_logo_url ? (
                                        <img src={storeForm.invoice_logo_url} alt="Logo" className="w-full h-full object-cover" />
                                    ) : (
                                        <Upload size={24} className="text-gray-400 mb-1" />
                                    )}
                                    <input type="file" accept="image/*" onChange={handleLogoUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                                </div>
                                <span className="text-[10px] font-bold text-gray-500">Chạm để tải logo lên</span>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 pl-1">Tên cửa hàng</label>
                                <input
                                    type="text"
                                    value={storeForm.shop_name}
                                    onChange={e => setStoreForm(prev => ({ ...prev, shop_name: e.target.value }))}
                                    className="w-full p-4 rounded-2xl bg-transparent border border-gray-100 dark:border-slate-800 font-bold outline-none focus:border-primary transition-colors text-sm"
                                    placeholder="Lyang Store"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 pl-1">Địa chỉ</label>
                                <input
                                    type="text"
                                    value={storeForm.shop_address}
                                    onChange={e => setStoreForm(prev => ({ ...prev, shop_address: e.target.value }))}
                                    className="w-full p-4 rounded-2xl bg-transparent border border-gray-100 dark:border-slate-800 font-bold outline-none focus:border-primary transition-colors text-sm"
                                    placeholder="123 Đường ABC..."
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 pl-1">Số điện thoại</label>
                                <input
                                    type="tel"
                                    value={storeForm.shop_phone}
                                    onChange={e => setStoreForm(prev => ({ ...prev, shop_phone: e.target.value }))}
                                    className="w-full p-4 rounded-2xl bg-transparent border border-gray-100 dark:border-slate-800 font-bold outline-none focus:border-primary transition-colors text-sm"
                                    placeholder="09..."
                                />
                            </div>
                        </div>
                    </motion.div>
                )}

                {activeModal === 'printer' && (
                    <motion.div
                        initial={{ opacity: 0, y: '100%' }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: '100%' }}
                        transition={{ type: 'spring', bounce: 0, duration: 0.3 }}
                        className="fixed inset-0 z-[60] bg-transparent flex flex-col"
                    >
                        <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-slate-800 pt-8">
                            <button onClick={() => setActiveModal(null)} className="p-2 -ml-2 text-gray-500"><X size={24} /></button>
                            <span className="font-black uppercase tracking-widest text-sm">Máy in & Template</span>
                            <div className="w-10"></div>
                        </div>
                        <div className="p-4 space-y-4">
                            <div className="p-4 bg-orange-50 dark:bg-orange-500/10 rounded-2xl border border-orange-100 dark:border-orange-500/20">
                                <p className="text-[10px] font-bold text-orange-600 dark:text-orange-400 leading-relaxed uppercase tracking-widest text-center">
                                    Chọn Template sử dụng cho hóa đơn bán hàng
                                </p>
                            </div>
                            <div className="space-y-2 mt-4">
                                {templates.map(tpl => (
                                    <button
                                        key={tpl.id}
                                        onClick={() => setTemplateActive(tpl.id)}
                                        disabled={saving}
                                        className={cn(
                                            "w-full flex items-center justify-between p-4 rounded-2xl border transition-all text-left active:scale-[0.98]",
                                            tpl.is_default
                                                ? "bg-primary/5 border-primary text-primary shadow-sm"
                                                : "bg-transparent border-gray-100 dark:border-slate-800 text-gray-700 dark:text-gray-300"
                                        )}
                                    >
                                        <div className="flex flex-col">
                                            <span className="font-black text-sm">{tpl.name}</span>
                                            <span className="text-[10px] font-bold opacity-60 uppercase tracking-widest mt-0.5">{tpl.module}</span>
                                        </div>
                                        {tpl.is_default && <Check size={20} className="text-primary" />}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Toasts */}
            <AnimatePresence>
                {toast && (
                    <motion.div
                        initial={{ opacity: 0, y: 50, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className={cn(
                            "fixed bottom-20 left-1/2 -translate-x-1/2 px-6 py-3 rounded-full shadow-2xl z-[100] font-bold text-xs flex items-center gap-2 whitespace-nowrap border",
                            toast.type === 'error' ? "bg-red-50 text-red-600 border-red-200" : "bg-transparent text-primary border-primary/20"
                        )}
                    >
                        {toast.type === 'success' && <Check size={14} />}
                        <span>{toast.message}</span>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
