import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { AnimatePresence, m } from 'framer-motion';
import CustomSelect from '../../components/CustomSelect';
import { 
    Save, Building, Cloud, Download, RefreshCcw, Info, Settings as SettingsIcon, 
    Database, Keyboard, Monitor, Layout, Tractor, Wheat, Droplets, Leaf, Bot, 
    Sparkles, Trash2, CreditCard, ArrowRight, Activity, Calculator as CalculatorIcon, 
    Copy, ShieldAlert, Wifi, Laptop, Key, CheckCircle, Smartphone, Layers
} from 'lucide-react';
import { cn } from '../../lib/utils';
import Toast from '../../components/Toast';
import ConfirmModal from '../../components/ConfirmModal';
import PasswordConfirmModal from '../../components/PasswordConfirmModal';
import CategoryManager from '../../components/CategoryManager';
import SidebarManager from '../../components/SidebarManager';
import { DEFAULT_SETTINGS } from '../../lib/settings';
import { enable, disable, isEnabled } from '@tauri-apps/plugin-autostart';
import preset1Signature from '../../assets/wallpapers/preset_1_signature.jpg';
import preset2Latte from '../../assets/wallpapers/preset_2_latte.jpg';
import presetFarmIllustration from '../../assets/wallpapers/preset_farm_illustration.jpg';
import presetMarketIllustration from '../../assets/wallpapers/preset_market_illustration.jpg';

const WALLPAPER_PRESETS = [
    { id: 1, name: "Signature Lyang", path: preset1Signature, desc: "Tối giản ấm cúng" },
    { id: 2, name: "Cafe Latte", path: preset2Latte, desc: "Cà phê & Trà" },
    { id: 3, name: "Nông Trại Xanh (Vector)", path: presetFarmIllustration, desc: "Đồi xanh & Xe táo" },
    { id: 4, name: "Tiệm Trái Cây (Story)", path: presetMarketIllustration, desc: "Gian hàng nông sản" }
];

export default function Settings() {
    const [settings, setSettings] = useState({
        shop_name: 'Lyang Nghĩa',
        shop_address: '',
        shop_phone: '',
        invoice_font_size: '13',
        invoice_font_family: 'sans-serif',
        invoice_footer: 'Cảm ơn Quý Khách!',
        paper_size: 'A4',
        shop_bank: '',
        shop_bank_account: '',
        shop_bank_user: '',
        gemini_api_key: '',
        brands_directory: '',
        ui_show_doraemon: localStorage.getItem('ui_show_doraemon') || DEFAULT_SETTINGS.ui_show_doraemon,
        ui_show_dashboard_mascot: localStorage.getItem('ui_show_dashboard_mascot') || 'true',
        ui_custom_cursor_enabled: localStorage.getItem('pos_cursor_disabled') !== 'true' ? 'true' : 'false',
        ui_custom_cursor_color: localStorage.getItem('pos_cursor_color') || '#10b981',
        feature_accounting_enabled: localStorage.getItem('feature_accounting_enabled') || DEFAULT_SETTINGS.feature_accounting_enabled,
        feature_tax_calculator_enabled: localStorage.getItem('feature_tax_calculator_enabled') || DEFAULT_SETTINGS.feature_tax_calculator_enabled || 'false',
        sidebar_hidden_items: localStorage.getItem('sidebar_hidden_items') || '[]',
        repair_on_startup: 'false',
        ram_cleanup_auto_enabled: 'false',
        ram_cleanup_interval_minutes: '10',
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [dbStats, setDbStats] = useState(null);
    const [optimizing, setOptimizing] = useState(false);
    const [normalizingUom, setNormalizingUom] = useState(false);
    const [cleaningRam, setCleaningRam] = useState(false);
    const [repairing, setRepairing] = useState(false);
    const [isReseting, setIsReseting] = useState(false);
    const [toast, setToast] = useState(null);
    const [confirm, setConfirm] = useState(null); // { title, message, onConfirm, type }
    const [passwordPrompt, setPasswordPrompt] = useState(null);
    const [localIpInfo, setLocalIpInfo] = useState({ ip: '127.0.0.1', port: 3579, hostname: 'localhost' });
    const [activeDevices, setActiveDevices] = useState([]);
    const [unlockingFirewall, setUnlockingFirewall] = useState(false);
    const [isAutostart, setIsAutostart] = useState(false);
    
    // UI Navigation Tab & SubTab
    const [activeTab, setActiveTab] = useState('general');
    const [uiSubTab, setUiSubTab] = useState('sidebar');

    const TABS = [
        { id: 'general', label: 'Cửa hàng & Ngân quỹ', icon: Building, desc: 'Tên trang trại, hotline, địa chỉ và ngân quỹ' },
        { id: 'network', label: 'Mạng & Đồng bộ LAN', icon: Wifi, desc: 'Cấu hình máy chủ, máy trạm và cổng nội bộ' },
        { id: 'database', label: 'Cơ sở dữ liệu', icon: Database, desc: 'Sao lưu, phục hồi, dọn dẹp và tối ưu máy chủ' },
        { id: 'ui', label: 'Cá nhân hóa UI/UX', icon: Monitor, desc: 'Ẩn/Hiện Menu Sidebar, Mascot, phân hệ & danh mục' },
        { id: 'shortcuts', label: 'Phím tắt thao tác', icon: Keyboard, desc: 'Tùy biến phím tắt bán hàng nhanh (F1 - F12)' }
    ];

    useEffect(() => {
        fetchSettings();
        fetchDbStats();
        fetchLocalIp();
        checkAutostart();
    }, []);

    const checkAutostart = async () => {
        if (window.__TAURI_INTERNALS__) {
            try {
                const autostartEnabled = await isEnabled();
                setIsAutostart(autostartEnabled);
            } catch (err) {
                console.error("Autostart check failed:", err);
            }
        }
    };

    const toggleAutostart = async () => {
        if (!window.__TAURI_INTERNALS__) {
            setToast({ message: "Tính năng này chỉ hoạt động trên ứng dụng Desktop", type: "error" });
            return;
        }

        const action = isAutostart ? disable : enable;
        const actionName = isAutostart ? "tắt" : "bật";

        setConfirm({
            title: "Yêu cầu quyền Hệ thống (Administrator)",
            message: `Bạn có chắc chắn muốn ${actionName} chức năng Tự khởi động cùng Windows? Hành động này sẽ ghi vào Registry (HKCU) của hệ thống.`,
            type: "info",
            onConfirm: async () => {
                setConfirm(null);
                try {
                    // Chạy giả lập lệnh powershell admin nếu ng dùng yêu cầu UAC
                    const { Command } = await import('@tauri-apps/plugin-shell');
                    try {
                        const cmd = Command.create('powershell', ['-Command', 'Start-Process', 'cmd.exe', '-ArgumentList', '"/c echo Requesting Admin Rights"', '-Verb', 'RunAs', '-WindowStyle', 'Hidden']);
                        await cmd.execute();
                    } catch (e) {
                        // ignore error if they cancel UAC, but let's proceed to set autostart anyway
                        // vì tauri plugin chỉ ghi vào HKCU không bắt buộc quyền Admin thực sự.
                    }

                    await action();
                    setIsAutostart(!isAutostart);
                    setToast({ message: `Đã ${actionName} chức năng tự khởi động!`, type: 'success' });
                } catch (err) {
                    setToast({ message: `Lỗi khi ${actionName} tự khởi động: ${err}`, type: 'error' });
                }
            }
        });
    };

    useEffect(() => {
        let interval;
        if (activeTab === 'network') {
            fetchActiveDevices();
            interval = setInterval(fetchActiveDevices, 5000);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [activeTab]);

    const fetchActiveDevices = async () => {
        try {
            const res = await axios.get('/api/active-devices');
            if (res.data && Array.isArray(res.data)) {
                setActiveDevices(res.data);
            } else {
                setActiveDevices([]);
            }
        } catch (err) {
            console.error('Lỗi khi tải danh sách thiết bị kết nối:', err);
            setActiveDevices([]);
        }
    };

    const fetchLocalIp = async () => {
        try {
            const res = await axios.get('/api/ip');
            setLocalIpInfo(res.data);
        } catch (err) {
            console.error('Lỗi khi tải IP nội bộ:', err);
        }
    };

    const handleUnlockFirewall = async () => {
        if (unlockingFirewall) return;
        setUnlockingFirewall(true);
        setToast({ 
            message: 'Đang gửi yêu cầu... Hãy đồng ý (Yes) ở hộp thoại Windows (UAC) hiển thị trên thanh tác vụ.', 
            type: 'success' 
        });
        try {
            const res = await axios.post('/api/network/unlock-firewall');
            if (res.data.success) {
                setToast({ message: res.data.message || 'Mở khóa tường lửa thành công!', type: 'success' });
            } else {
                setToast({ message: res.data.error || 'Lỗi khi mở khóa tường lửa.', type: 'error' });
            }
        } catch (err) {
            console.error('Lỗi khi mở khóa tường lửa:', err);
            const errMsg = err.response?.data?.error || 'Có lỗi xảy ra khi thực thi lệnh mở khóa.';
            setToast({ message: errMsg, type: 'error' });
        } finally {
            setUnlockingFirewall(false);
        }
    };

    const fetchDbStats = async () => {
        try {
            const res = await axios.get('/api/db-stats');
            setDbStats(res.data);
        } catch (err) {
            console.error('Lỗi khi tải thống kê DB:', err);
        }
    };

    const handleManualRamClean = async () => {
        setCleaningRam(true);
        try {
            // 1. Call backend to clean RAM and shrink DB cache
            await axios.post('/api/clean-ram');
            
            // 2. Call Tauri to clean working set of main process
            if (window.__TAURI__ && window.__TAURI__.core) {
                try {
                    await window.__TAURI__.core.invoke('clean_app_ram');
                } catch (tErr) {
                    console.error("Tauri RAM clean failed:", tErr);
                }
            }
            
            setToast({ message: 'Dọn rác & giải phóng bộ nhớ RAM thành công!', type: 'success' });
            fetchDbStats();
        } catch (err) {
            setToast({ message: 'Lỗi dọn dẹp RAM: ' + (err.response?.data?.error || err.message), type: 'error' });
        } finally {
            setCleaningRam(false);
        }
    };

    const handleOptimize = async () => {
        setConfirm({
            title: "Tối ưu hóa DB",
            message: "Tối ưu hóa sẽ sắp xếp lại dữ liệu và nén dung lượng file. App có thể tạm thời không phản hồi trong vài giây. Bạn muốn tiếp tục?",
            onConfirm: async () => {
                setOptimizing(true);
                setConfirm(null);
                try {
                    const res = await axios.post('/api/optimize-db');
                    setToast({ message: res.data.message, type: 'success' });
                    fetchDbStats();
                } catch (err) {
                    setToast({ message: 'Lỗi khi tối ưu hóa DB', type: 'error' });
                } finally {
                    setOptimizing(false);
                }
            },
            type: "info"
        });
    };

    const handleNormalizeUom = async () => {
        setConfirm({
            title: "Chuẩn hóa Đơn vị tính",
            message: "Hệ thống sẽ quét và nắn lại tất cả đơn vị tính về đúng chuẩn (VD: KG -> Kg, thung -> Thùng...). Bạn muốn tiếp tục?",
            onConfirm: async () => {
                setNormalizingUom(true);
                setConfirm(null);
                try {
                    const res = await axios.post('/api/normalize-uom');
                    setToast({ message: res.data.message, type: 'success' });
                    fetchDbStats();
                } catch (err) {
                    setToast({ message: 'Lỗi khi chuẩn hóa đơn vị tính', type: 'error' });
                } finally {
                    setNormalizingUom(false);
                }
            },
            type: "info"
        });
    };

    const handleRepairBackend = async () => {
        setConfirm({
            title: "Sửa và Vá dữ liệu Backend",
            message: "Hệ thống sẽ tiến hành liên kết lại các lô hàng chưa khớp và tính toán lại giá vốn trung bình cho toàn bộ sản phẩm. Bạn có muốn tiếp tục?",
            onConfirm: async () => {
                setRepairing(true);
                setConfirm(null);
                try {
                    const res = await axios.post('/api/settings/repair-backend');
                    setToast({ message: res.data.message || 'Sửa lỗi và vá dữ liệu thành công!', type: 'success' });
                    fetchDbStats();
                } catch (err) {
                    setToast({ message: 'Lỗi khi sửa dữ liệu backend: ' + (err.response?.data?.error || err.message), type: 'error' });
                } finally {
                    setRepairing(false);
                }
            },
            type: "info"
        });
    };

    const handleResetData = () => {
        setConfirm({
            title: "CẢNH BÁO NGUY HIỂM",
            message: "HÀNH ĐỘNG NÀY SẼ XOÁ TOÀN BỘ DỮ LIỆU (Sản phẩm, Khách hàng, Hoá đơn...). Dữ liệu sau khi xoá KHÔNG THỂ khôi phục. Bạn có chắc chắn muốn tiếp tục?",
            onConfirm: () => {
                setConfirm(null);
                setPasswordPrompt({
                    title: "Xác thực quyền quản trị",
                    message: "Vui lòng nhập mật khẩu xác nhận để tiến hành xoá dữ liệu.",
                    onConfirm: async (password) => {
                        setPasswordPrompt(null);
                        setIsReseting(true);
                        try {
                            const res = await axios.post('/api/reset-database', { password });
                            setToast({ message: res.data.message, type: 'success' });
                            setTimeout(() => window.location.reload(), 2000);
                        } catch (err) {
                            setToast({ message: err.response?.data?.error || 'Lỗi khi reset dữ liệu', type: 'error' });
                            setIsReseting(false);
                        }
                    }
                });
            },
            type: "danger"
        });
    };

    const handleRestore = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setConfirm({
            title: "Khôi phục dữ liệu",
            message: "DỮ LIỆU HIỆN TẠI SẼ BỊ XOÁ SẠCH và thay thế bằng file sao lưu này. Bạn có chắc chắn?",
            onConfirm: async () => {
                const fd = new FormData();
                fd.append('file', file);
                setLoading(true);
                setConfirm(null);
                try {
                    const res = await axios.post('/api/restore', fd);
                    setToast({ message: res.data.message + ". Hệ thống sẽ khởi động lại...", type: "success" });
                    setTimeout(() => window.location.reload(), 2000);
                } catch (err) {
                    setToast({ message: "Lỗi khôi phục: " + (err.response?.data?.error || "Lỗi server"), type: "error" });
                } finally {
                    setLoading(false);
                }
            },
            type: "danger"
        });
        e.target.value = '';
    };

    const fetchSettings = async () => {
        try {
            const res = await axios.get('/api/settings');
            if (Object.keys(res.data).length > 0) {
                let combined = { ...res.data };
                const localDora = localStorage.getItem('ui_show_doraemon');
                if (localDora !== null) combined.ui_show_doraemon = localDora;

                const localCursor = localStorage.getItem('pos_cursor_disabled');
                if (localCursor !== null) combined.ui_custom_cursor_enabled = localCursor === 'true' ? 'false' : 'true';

                const localHidden = localStorage.getItem('sidebar_hidden_items');
                if (localHidden !== null) {
                    combined.sidebar_hidden_items = localHidden;
                } else if (combined.sidebar_hidden_items) {
                    localStorage.setItem('sidebar_hidden_items', combined.sidebar_hidden_items);
                }

                const localAccounting = localStorage.getItem('feature_accounting_enabled');
                if (localAccounting !== null) {
                    combined.feature_accounting_enabled = localAccounting;
                } else if (combined.feature_accounting_enabled) {
                    localStorage.setItem('feature_accounting_enabled', String(combined.feature_accounting_enabled));
                } else {
                    combined.feature_accounting_enabled = 'true';
                    localStorage.setItem('feature_accounting_enabled', 'true');
                }

                setSettings(prev => ({
                    ...prev,
                    ...combined
                }));
            }
        } catch (err) {
            console.error('Lỗi khi tải cài đặt:', err);
        }
    };

    const updateSetting = (key, value) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    };

    const handleSave = async () => {
        setLoading(true);
        setMessage('');
        try {
            await axios.post('/api/settings', settings);
            setToast({ message: 'Đã lưu cấu hình thành công!', type: 'success' });
        } catch (err) {
            setToast({ message: 'Lỗi khi lưu cài đặt', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setSettings(prev => ({ ...prev, [name]: value }));
    };

    return (
        <div className="pt-2 px-4 pb-8 w-full h-full bg-transparent overflow-hidden flex flex-col relative font-sans">
            <div className="flex-1 flex flex-col overflow-hidden">
            {/* Visual background brand icon */}
            <div className="absolute top-0 right-0 p-12 opacity-[0.015] pointer-events-none -mr-12 -mt-12 dark:opacity-[0.03]">
                <Tractor size={320} className="text-emerald-700" />
            </div>

            {/* Compact Premium Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 relative z-10 px-4 md:px-0">
                <div>
                    <h1 className="text-3xl md:text-4xl font-black text-[#2d5016] dark:text-[#4a7c59] tracking-tight flex items-center gap-3 pt-2 pb-0.5 leading-relaxed">
                        <SettingsIcon className="text-[#2d5016] dark:text-[#4a7c59]" size={32} />
                        CẤU HÌNH HỆ THỐNG
                    </h1>
                        <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-black uppercase rounded-lg tracking-tighter">LyangPOS by Lyang</span>
                            <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                            <p className="text-[11px] font-bold text-gray-400 dark:text-gray-500">Quản trị & Cá nhân hóa vận hành POS</p>
                        </div>
                </div>
                <m.button
                    whileHover={{ scale: 1.02, y: -1 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleSave}
                    disabled={loading}
                    className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white px-6 py-3 rounded-xl font-black shadow-md shadow-emerald-500/20 active:scale-95 disabled:opacity-50 transition-all uppercase text-[10px] tracking-[0.15em] border border-white/10 shrink-0"
                >
                    <Save size={14} />
                    {loading ? 'ĐANG LƯU...' : 'LƯU THAY ĐỔI'}
                </m.button>
            </div>

            {/* Compact Dashboard Container Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start relative z-10 flex-1 overflow-hidden">
                
                {/* Left Side Tab Navigation List */}
                <div className="lg:col-span-1 flex flex-col gap-1.5 bg-transparent dark:bg-slate-900/60 backdrop-blur-xl p-2.5 rounded-[1.5rem] border border-emerald-900/5 dark:border-emerald-500/10 shadow-md shadow-black/5">
                    <p className="text-[9px] font-black uppercase tracking-[0.25em] text-emerald-800/40 dark:text-emerald-400/40 px-3.5 py-1.5 border-b border-emerald-900/5 dark:border-emerald-500/10 mb-1">DANH MỤC CẤU HÌNH</p>
                    {TABS.map((tab) => {
                        const Icon = tab.icon;
                        const isSelected = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={cn(
                                    "relative flex items-center gap-4 p-3.5 rounded-2xl text-left transition-all duration-300 group overflow-hidden",
                                    isSelected 
                                        ? "" 
                                        : "hover:bg-emerald-500/5 dark:hover:bg-emerald-500/10"
                                )}
                            >
                                {isSelected && (
                                    <>
                                        <m.div
                                            layoutId="active-settings-tab-bg"
                                            className="absolute inset-0 bg-[#2d5016]/10 dark:bg-emerald-500/10 rounded-2xl z-0 border border-[#2d5016]/20 dark:border-emerald-500/20"
                                            transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                        />
                                        <m.div
                                            layoutId="active-settings-tab-indicator"
                                            className="absolute left-0 top-1/2 -translate-y-1/2 w-2 h-8 bg-[#2d5016] dark:bg-emerald-400 rounded-r-md z-10"
                                            transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                        />
                                    </>
                                )}
                                <div className={cn(
                                    "p-2.5 rounded-xl z-10 transition-colors duration-300 flex items-center justify-center shrink-0 shadow-sm",
                                    isSelected 
                                        ? "bg-[#2d5016] dark:bg-emerald-500 text-white" 
                                        : "bg-[#2d5016]/5 dark:bg-emerald-900/30 text-[#2d5016]/70 dark:text-emerald-400 group-hover:bg-[#2d5016]/10"
                                )}>
                                    <Icon size={18} />
                                </div>
                                <div className="z-10 min-w-0">
                                    <p className={cn("text-xs font-black uppercase tracking-wider leading-none mb-1.5 transition-colors", isSelected ? "text-[#2d5016] dark:text-emerald-400" : "text-[#2d5016]/80 dark:text-emerald-100/60 group-hover:text-[#2d5016]")}>{tab.label}</p>
                                    <p className={cn("text-[9px] font-bold truncate uppercase tracking-widest leading-none transition-colors", isSelected ? "text-[#2d5016]/60 dark:text-emerald-400/60" : "text-[#2d5016]/40 dark:text-emerald-100/40")}>{tab.desc}</p>
                                </div>
                            </button>
                        );
                    })}
                </div>

                {/* Right Side Main Tab Panel */}
                <div className="lg:col-span-3 h-full overflow-y-auto custom-scrollbar pb-6 pr-2">
                    <AnimatePresence mode="wait">
                        <m.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                            className="bg-transparent p-2 md:p-4 rounded-[2rem] flex flex-col justify-between"
                        >
                            {/* TAB CONTENT: GENERAL (Cửa hàng & Ngân quỹ) */}
                            {activeTab === 'general' && (
                                <div className="space-y-6 animate-[fadeIn_0.2s_ease-out]">
                                    <div className="flex items-center gap-3.5 pb-3 border-b border-[#d4a574]/10">
                                        <div className="p-2.5 bg-emerald-100/50 dark:bg-emerald-900/30 rounded-xl text-[#2d5016] dark:text-emerald-400">
                                            <Building size={20} />
                                        </div>
                                        <div>
                                            <h2 className="text-lg font-black text-gray-800 dark:text-emerald-50 uppercase tracking-tight">Hồ sơ Trang trại & Ngân quỹ</h2>
                                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Thông tin nhận dạng hóa đơn và tài khoản thanh toán QR Pay</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                                        {/* Store information form */}
                                        <div className="space-y-4">
                                            <h3 className="text-[10px] font-black uppercase tracking-[0.15em] text-[#8b6f47] dark:text-[#d4a574] flex items-center gap-1.5">
                                                <Building size={13} className="text-[#8b6f47] dark:text-[#d4a574]" /> Thông tin cơ bản
                                            </h3>
                                            <div className="space-y-1.5">
                                                <label className="text-[8.5px] font-black text-gray-400 dark:text-emerald-100/40 uppercase tracking-widest ml-1">Tên Trang Trại / Đại lý</label>
                                                <input
                                                    name="shop_name"
                                                    value={settings.shop_name}
                                                    onChange={handleChange}
                                                    placeholder="Ví dụ: Lyang Nghĩa"
                                                    className="w-full p-3.5 bg-emerald-50/20 dark:bg-slate-800/40 border border-emerald-900/5 dark:border-slate-700 rounded-xl font-black text-xs text-gray-800 dark:text-emerald-50 focus:border-[#4a7c59] outline-none shadow-inner transition-all"
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[8.5px] font-black text-gray-400 dark:text-emerald-100/40 uppercase tracking-widest ml-1">Đường dây nóng (Hotline)</label>
                                                <input
                                                    name="shop_phone"
                                                    value={settings.shop_phone}
                                                    onChange={handleChange}
                                                    placeholder="0xxx.xxx.xxx"
                                                    className="w-full p-3.5 bg-emerald-50/20 dark:bg-slate-800/40 border border-emerald-900/5 dark:border-slate-700 rounded-xl font-black text-xs font-mono text-gray-800 dark:text-emerald-50 focus:border-[#4a7c59] outline-none shadow-inner transition-all"
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[8.5px] font-black text-gray-400 dark:text-emerald-100/40 uppercase tracking-widest ml-1">Địa chỉ Canh Tác / Trụ sở</label>
                                                <textarea
                                                    name="shop_address"
                                                    value={settings.shop_address}
                                                    onChange={handleChange}
                                                    rows="2"
                                                    placeholder="Địa chỉ giao dịch..."
                                                    className="w-full p-3.5 bg-emerald-50/20 dark:bg-slate-800/40 border border-emerald-900/5 dark:border-slate-700 rounded-xl font-bold text-xs text-gray-800 dark:text-emerald-50 resize-none focus:border-[#4a7c59] outline-none shadow-inner transition-all"
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[8.5px] font-black text-gray-400 dark:text-emerald-100/40 uppercase tracking-widest ml-1">Danh mục Hãng / Thương hiệu (Cách nhau bằng dấu phẩy)</label>
                                                <textarea
                                                    name="brands_directory"
                                                    value={settings.brands_directory || ''}
                                                    onChange={handleChange}
                                                    rows="2"
                                                    placeholder="Ví dụ: Hợp Trí, Syngenta, Bayer, Lộc Trời..."
                                                    className="w-full p-3.5 bg-emerald-50/20 dark:bg-slate-800/40 border border-emerald-900/5 dark:border-slate-700 rounded-xl font-bold text-xs text-gray-800 dark:text-emerald-50 resize-none focus:border-[#4a7c59] outline-none shadow-inner transition-all"
                                                />
                                            </div>
                                        </div>

                                        {/* Premium real-time Virtual Credit Card mock and Bank forms */}
                                        <div className="space-y-4">
                                            <h3 className="text-[10px] font-black uppercase tracking-[0.15em] text-[#8b6f47] dark:text-[#d4a574] flex items-center gap-1.5">
                                                <CreditCard size={13} className="text-[#8b6f47] dark:text-[#d4a574]" /> Cấu hình chuyển khoản (QR Pay)
                                            </h3>
                                            
                                            {/* Virtual ATM Card Mock - Optimized Padding & Height */}
                                            <div className="relative h-36 w-full bg-gradient-to-br from-[#1b3b14] via-[#2d5016] to-[#0d2208] rounded-2xl p-4.5 text-white shadow-md shadow-emerald-950/30 overflow-hidden border border-white/10 flex flex-col justify-between group">
                                                <div className="absolute -right-16 -top-16 w-36 h-36 bg-emerald-500/10 rounded-full blur-xl group-hover:scale-110 transition-transform" />
                                                
                                                <div className="flex justify-between items-start relative z-10">
                                                    <div>
                                                        <p className="text-[7px] font-black tracking-[0.25em] uppercase text-emerald-400/80">HỒ SƠ THANH TOÁN QR</p>
                                                        <p className="text-xs font-black tracking-wider uppercase mt-1 leading-none">{settings.shop_bank || 'CHƯA CHỌN NGÂN HÀNG'}</p>
                                                    </div>
                                                    <CreditCard size={20} className="text-emerald-300 opacity-80" />
                                                </div>

                                                <div className="relative z-10 my-0.5">
                                                    <p className="text-[7.5px] font-black uppercase text-emerald-300/40 tracking-wider">SỐ TÀI KHOẢN</p>
                                                    <p className="text-lg font-black font-mono tracking-[0.1em] text-emerald-100 leading-none mt-0.5">{settings.shop_bank_account || '•••• •••• ••••'}</p>
                                                </div>

                                                <div className="flex justify-between items-end relative z-10">
                                                    <div>
                                                        <p className="text-[6.5px] font-black text-emerald-300/40 tracking-widest">CHỦ THỤ HƯỞNG</p>
                                                        <p className="text-[10px] font-black uppercase tracking-wider leading-none mt-0.5">{settings.shop_bank_user || 'TEN CHU TAI KHOAN'}</p>
                                                    </div>
                                                    <div className="px-2 py-0.5 bg-transparent backdrop-blur-md rounded border border-white/10 text-[7px] font-black uppercase tracking-widest text-emerald-300">MB BANK QR</div>
                                                </div>
                                            </div>

                                            <div className="space-y-3">
                                                <div className="space-y-1.5">
                                                    <label className="text-[8.5px] font-black text-gray-400 dark:text-emerald-100/40 uppercase tracking-widest ml-1">Tên Ngân Hàng (Viết tắt)</label>
                                                    <input
                                                        name="shop_bank"
                                                        value={settings.shop_bank}
                                                        onChange={handleChange}
                                                        placeholder="Ví dụ: MB Bank, Vietcombank..."
                                                        className="w-full p-3.5 bg-emerald-50/20 dark:bg-slate-800/40 border border-emerald-900/5 dark:border-slate-700 rounded-xl font-black text-xs text-gray-800 dark:text-emerald-50 focus:border-amber-500 outline-none shadow-inner transition-all"
                                                    />
                                                </div>
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div className="space-y-1.5">
                                                        <label className="text-[8.5px] font-black text-gray-400 dark:text-emerald-100/40 uppercase tracking-widest ml-1">Số Tài Khoản</label>
                                                        <input
                                                            name="shop_bank_account"
                                                            value={settings.shop_bank_account}
                                                            onChange={handleChange}
                                                            placeholder="Nhập số TK..."
                                                            className="w-full p-3.5 bg-emerald-50/20 dark:bg-slate-800/40 border border-emerald-900/5 dark:border-slate-700 rounded-xl font-black text-xs font-mono text-gray-800 dark:text-emerald-50 focus:border-amber-500 outline-none shadow-inner transition-all"
                                                        />
                                                    </div>
                                                    <div className="grid grid-cols-1">
                                                        <div className="space-y-1.5">
                                                            <label className="text-[8.5px] font-black text-gray-400 dark:text-emerald-100/40 uppercase tracking-widest ml-1">Chủ Tài Khoản (Không dấu)</label>
                                                            <input
                                                                name="shop_bank_user"
                                                                value={settings.shop_bank_user}
                                                                onChange={handleChange}
                                                                placeholder="NGUYEN VAN A"
                                                                className="w-full p-3.5 bg-emerald-50/20 dark:bg-slate-800/40 border border-emerald-900/5 dark:border-slate-700 rounded-xl font-black text-xs uppercase text-gray-800 dark:text-emerald-50 focus:border-amber-500 outline-none shadow-inner transition-all"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* AI Integration - Gemini API Key */}
                                            <div className="pt-4 border-t border-[#d4a574]/10 space-y-3">
                                                <h3 className="text-[10px] font-black uppercase tracking-[0.15em] text-[#8b6f47] dark:text-[#d4a574] flex items-center gap-1.5">
                                                    <Bot size={13} className="text-emerald-500" /> Tích hợp AI (Gemini)
                                                </h3>
                                                <div className="space-y-1.5">
                                                    <label className="text-[8.5px] font-black text-gray-400 dark:text-emerald-100/40 uppercase tracking-widest ml-1">Gemini API Key</label>
                                                    <input
                                                        name="gemini_api_key"
                                                        type="password"
                                                        value={settings.gemini_api_key}
                                                        onChange={handleChange}
                                                        placeholder="Nhập AI API Key để quét hóa đơn..."
                                                        className="w-full p-3.5 bg-emerald-50/20 dark:bg-slate-800/40 border border-emerald-900/5 dark:border-slate-700 rounded-xl font-black text-xs text-gray-800 dark:text-emerald-50 focus:border-emerald-500 outline-none shadow-inner transition-all"
                                                    />
                                                    <p className="text-[8px] text-gray-400 dark:text-gray-500 italic ml-1">Key này dùng để phân tích hình ảnh hóa đơn nhập hàng tự động bằng mô hình Gemini 2.5 Flash.</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* TAB CONTENT: NETWORK (Mạng & Đồng bộ LAN) */}
                            {activeTab === 'network' && (
                                <div className="space-y-6 animate-[fadeIn_0.2s_ease-out]">
                                    <div className="flex items-center gap-3.5 pb-3 border-b border-[#d4a574]/10">
                                        <div className="p-2.5 bg-emerald-100/50 dark:bg-emerald-900/30 rounded-xl text-emerald-600 shadow-inner">
                                            <Wifi size={20} />
                                        </div>
                                        <div>
                                            <h2 className="text-lg font-black text-gray-800 dark:text-emerald-50 uppercase tracking-tight">Quản lý mạng nội bộ LAN</h2>
                                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Kết nối nhiều thiết bị sử dụng chung cơ sở dữ liệu qua mạng LAN/Wifi</p>
                                        </div>
                                    </div>

                                    {/* Connectivity topology graphics - Optimized Padding */}
                                    <div className="p-4 bg-transparent dark:bg-slate-950/40 rounded-[2rem] border border-emerald-900/5 dark:border-emerald-500/10 relative overflow-hidden">
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center text-center relative z-10">
                                            <div className="p-3 bg-transparent dark:bg-slate-900 rounded-xl border border-emerald-500/10 flex flex-col items-center gap-1.5">
                                                <Laptop size={24} className="text-emerald-500" />
                                                <p className="text-[9px] font-black uppercase text-gray-400">Thiết bị A (Máy Chủ)</p>
                                                <p className="text-xs font-black font-mono text-[#2d5016] dark:text-emerald-400 leading-none">{localIpInfo.ip}:3579</p>
                                            </div>
                                            <div className="flex flex-col items-center justify-center text-emerald-500/40 py-1">
                                                <span className="text-[8px] font-black uppercase tracking-widest text-emerald-500/40 mb-0.5">MẠNG LAN / WIFI</span>
                                                <ArrowRight className="hidden md:block text-emerald-500/30" size={16} />
                                            </div>
                                            <div className="p-3 bg-transparent dark:bg-slate-900 rounded-xl border border-blue-500/10 flex flex-col items-center gap-1.5">
                                                <Smartphone size={24} className="text-blue-500" />
                                                <p className="text-[9px] font-black uppercase text-gray-400">Thiết bị B (Máy Trạm)</p>
                                                <p className="text-xs font-black text-blue-500 uppercase tracking-wider leading-none">{localStorage.getItem('server_ip') ? 'Đã kết nối' : 'Có thể kết nối'}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                                        <div className="space-y-3">
                                            <h3 className="text-[10px] font-black uppercase tracking-[0.15em] text-[#8b6f47] dark:text-[#d4a574] flex items-center gap-1.5">
                                                <SettingsIcon size={13} className="text-[#8b6f47] dark:text-[#d4a574]" /> Thiết lập Vai trò
                                            </h3>
                                            
                                            <div className="space-y-1.5">
                                                <label className="text-[8.5px] font-black text-gray-400 uppercase tracking-wider ml-1">Vai trò thiết bị hiện tại</label>
                                                <CustomSelect
                                                    className="w-full border border-emerald-900/5 dark:border-slate-700 rounded-xl bg-emerald-50/20 dark:bg-slate-800/40"
                                                    value={localStorage.getItem('server_ip') ? 'client' : 'standalone'}
                                                    onChange={(e) => {
                                                        if (e.target.value === 'standalone') {
                                                            localStorage.removeItem('server_ip');
                                                            setToast({ message: 'Đã chuyển sang chế độ Máy chủ. Đang tải lại...', type: 'success' });
                                                            setTimeout(() => window.location.reload(), 1500);
                                                        } else {
                                                            localStorage.setItem('server_ip', localIpInfo.ip || '127.0.0.1');
                                                            setToast({ message: 'Đã thiết lập Máy trạm. Đang tải lại...', type: 'success' });
                                                            setTimeout(() => window.location.reload(), 1500);
                                                        }
                                                    }}
                                                    options={[
                                                        { value: "standalone", label: "Máy Chủ / Đơn Máy (Mặc định)" },
                                                        { value: "client", label: "Máy Trạm (Kết nối Máy Chủ qua LAN)" }
                                                    ]}
                                                />
                                            </div>

                                            {localStorage.getItem('server_ip') !== null && (
                                                <div className="space-y-1.5 animate-in fade-in slide-in-from-top-4 duration-300">
                                                    <label className="text-[8.5px] font-black text-gray-400 uppercase tracking-wider ml-1">Địa chỉ IP Máy Chủ chính</label>
                                                    <input
                                                        type="text"
                                                        placeholder="Ví dụ: 192.168.1.12"
                                                        defaultValue={localStorage.getItem('server_ip') === '192.168.1.15' ? '' : localStorage.getItem('server_ip')}
                                                        onBlur={(e) => {
                                                            const ip = e.target.value.trim();
                                                            if (ip) {
                                                                localStorage.setItem('server_ip', ip);
                                                                setToast({ message: `Đã đổi IP máy chủ: ${ip}. Đang tải lại...`, type: 'success' });
                                                                setTimeout(() => window.location.reload(), 1500);
                                                            }
                                                        }}
                                                        className="w-full p-3.5 bg-transparent dark:bg-slate-900 border border-emerald-500/20 rounded-xl font-black text-xs font-mono text-gray-800 dark:text-emerald-50 focus:border-emerald-500 outline-none shadow-sm"
                                                    />
                                                </div>
                                            )}
                                        </div>

                                        <div className="space-y-3">
                                            <h3 className="text-[10px] font-black uppercase tracking-[0.15em] text-[#8b6f47] dark:text-[#d4a574] flex items-center gap-1.5">
                                                <Activity size={13} className="text-[#8b6f47] dark:text-[#d4a574]" /> Trạng thái kết nối
                                            </h3>
                                            
                                            {!localStorage.getItem('server_ip') ? (
                                                <div className="p-4 bg-emerald-500/10 dark:bg-emerald-500/5 rounded-2xl border border-emerald-500/20 shadow-inner text-left">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                                        <span className="text-[9px] font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-widest leading-none">MÁY CHỦ CHÍNH (HOST)</span>
                                                    </div>
                                                    <p className="text-[10px] font-bold text-gray-500 dark:text-slate-400 leading-relaxed mb-3">
                                                        Máy trạm kết nối tới máy này qua địa chỉ LAN:
                                                    </p>
                                                    <div className="p-2.5 bg-transparent dark:bg-slate-900/60 rounded-xl border border-emerald-500/10 mb-3 text-center">
                                                        <p className="text-sm font-black font-mono text-gray-800 dark:text-emerald-300">http://{localIpInfo.ip || '127.0.0.1'}:3579</p>
                                                    </div>
                                                    <button
                                                        onClick={() => {
                                                            const connectUrl = `http://${localIpInfo.ip || '127.0.0.1'}:3579`;
                                                            navigator.clipboard.writeText(connectUrl);
                                                            setToast({ message: 'Đã sao chép địa chỉ IP Máy Chủ!', type: 'success' });
                                                        }}
                                                        className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-transparent dark:bg-slate-900 hover:bg-emerald-500 hover:text-white dark:hover:bg-emerald-600 text-emerald-600 dark:text-emerald-400 rounded-lg font-black text-[9px] uppercase tracking-widest border border-emerald-500/20 shadow-sm transition-all"
                                                    >
                                                        <Copy size={10} /> SAO CHÉP LIÊN KẾT IP
                                                    </button>
                                                    
                                                    <button
                                                        onClick={handleUnlockFirewall}
                                                        disabled={unlockingFirewall}
                                                        className={cn(
                                                            "w-full mt-2 flex items-center justify-center gap-1.5 py-2.5 rounded-lg font-black text-[9px] uppercase tracking-widest border shadow-sm transition-all outline-none",
                                                            unlockingFirewall
                                                                ? "bg-transparent text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-700 cursor-not-allowed"
                                                                : "bg-emerald-50 dark:bg-emerald-950/30 hover:bg-emerald-600 hover:text-white dark:hover:bg-emerald-700 text-emerald-700 dark:text-emerald-350 border-emerald-500/30 dark:border-emerald-500/25"
                                                        )}
                                                    >
                                                        <ShieldAlert size={10} className={cn(unlockingFirewall && "")} /> 
                                                        {unlockingFirewall ? "ĐANG GỬI YÊU CẦU..." : "MỞ KHÓA TƯỜNG LỬA (WINDOWS)"}
                                                     </button>
                                                     <button
                                                         onClick={() => {
                                                             const port = localIpInfo.port || 3579;
                                                             const cmd = `Remove-NetFirewallRule -DisplayName "LyangPOS LAN Access (${port})" -ErrorAction SilentlyContinue; New-NetFirewallRule -DisplayName "LyangPOS LAN Access (${port})" -Direction Inbound -Action Allow -Protocol TCP -LocalPort ${port}`;
                                                             navigator.clipboard.writeText(cmd);
                                                             setToast({ message: 'Đã sao chép lệnh mở khóa Tường lửa vào Clipboard!', type: 'success' });
                                                         }}
                                                         className="w-full mt-2 flex items-center justify-center gap-1.5 py-2.5 rounded-lg font-black text-[9px] uppercase tracking-widest border border-amber-500/30 dark:border-amber-500/25 bg-amber-50/50 dark:bg-amber-950/30 hover:bg-amber-600 hover:text-white dark:hover:bg-amber-700 text-amber-700 dark:text-amber-350 shadow-sm transition-all outline-none"
                                                     >
                                                         <Copy size={10} /> SAO CHÉP LỆNH POWERSHELL
                                                     </button>
                                                </div>
                                            ) : (
                                                <div className="p-4 bg-blue-500/10 dark:bg-blue-500/5 rounded-2xl border border-blue-500/20 shadow-inner">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <div className="w-2 h-2 rounded-full bg-blue-500" />
                                                        <span className="text-[9px] font-black text-blue-700 dark:text-blue-400 uppercase tracking-widest leading-none">MÁY TRẠM (CLIENT)</span>
                                                    </div>
                                                    <p className="text-[10px] font-bold text-gray-500 dark:text-slate-400 leading-relaxed mb-3">
                                                        Đang đồng bộ dữ liệu từ máy chủ chính:
                                                    </p>
                                                    <div className="p-2.5 bg-transparent dark:bg-slate-900/60 rounded-xl border border-blue-500/10 text-center">
                                                        <p className="text-sm font-black font-mono text-blue-600 dark:text-blue-400 leading-none">{localStorage.getItem('server_ip')}</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Connected Devices LAN Table */}
                                    <div className="p-5 bg-transparent dark:bg-slate-950/40 rounded-2xl border border-emerald-900/5 dark:border-slate-800/60 text-left animate-in fade-in slide-in-from-bottom-4 duration-500">
                                        <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-emerald-500/10">
                                            <Activity size={16} className="text-emerald-500" />
                                            <div>
                                                <h3 className="text-[10px] font-black uppercase tracking-[0.15em] text-[#8b6f47] dark:text-[#d4a574] flex items-center gap-1.5 leading-none">
                                                    <Laptop size={13} className="text-[#8b6f47] dark:text-[#d4a574]" /> Các thiết bị đang kết nối mạng LAN
                                                </h3>
                                                <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mt-1">Cập nhật trực tiếp các máy trạm đang đồng bộ dữ liệu vào máy chủ này</p>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[240px] overflow-y-auto pr-1 no-scrollbar">
                                            {(!activeDevices || !Array.isArray(activeDevices) || activeDevices.length === 0) ? (
                                                <div className="col-span-full py-6 text-center text-gray-400 dark:text-slate-500 font-bold text-xs uppercase tracking-wider">
                                                    Đang quét thiết bị mạng LAN...
                                                </div>
                                            ) : (
                                                activeDevices.map((device, idx) => (
                                                    <div 
                                                        key={device.ip + idx}
                                                        className={cn(
                                                            "flex items-center justify-between p-3.5 rounded-xl border transition-all",
                                                            device.is_host 
                                                                ? "bg-emerald-500/10 dark:bg-emerald-500/5 border-emerald-500/20" 
                                                                : "bg-transparent dark:bg-slate-900/60 border-emerald-950/5 dark:border-slate-800"
                                                        )}
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div className={cn(
                                                                "w-9 h-9 rounded-xl flex items-center justify-center border transition-colors",
                                                                device.is_host
                                                                    ? "bg-emerald-500/20 border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                                                                    : "bg-blue-500/20 border-blue-500/20 text-blue-600 dark:text-blue-400"
                                                            )}>
                                                                {device.is_host ? <Laptop size={16} /> : <Smartphone size={16} />}
                                                            </div>
                                                            <div>
                                                                <div className="flex items-center gap-2">
                                                                    <p className="text-xs font-black text-gray-800 dark:text-white leading-none">{device.label}</p>
                                                                    <span className={cn(
                                                                        "px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider leading-none",
                                                                        device.is_host 
                                                                            ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20" 
                                                                            : "bg-blue-500/20 text-blue-700 dark:text-blue-400 border border-blue-500/20"
                                                                    )}>
                                                                        {device.is_host ? "Máy chủ" : "Máy trạm"}
                                                                    </span>
                                                                </div>
                                                                <p className="text-[10px] font-black font-mono text-gray-400 mt-1.5">{device.ip}</p>
                                                            </div>
                                                        </div>
                                                        
                                                        <div className="text-right flex flex-col items-end gap-1.5">
                                                            <div className="flex items-center gap-1.5">
                                                                <span className="relative flex h-2 w-2">
                                                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                                                </span>
                                                                <span className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest leading-none">Online</span>
                                                            </div>
                                                            <p className="text-[8px] font-black text-gray-400 uppercase tracking-wider leading-none">
                                                                {new Date(device.last_seen).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                                            </p>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* TAB CONTENT: DATABASE (Dữ liệu & Bảo mật) */}
                            {activeTab === 'database' && (
                                <div className="space-y-6 animate-[fadeIn_0.2s_ease-out]">
                                    {/* Header Section */}
                                    <div className="flex items-center gap-3.5 pb-3.5 border-b border-[#d4a574]/15">
                                        <div className="p-3 bg-emerald-500/10 dark:bg-emerald-500/15 rounded-2xl text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shadow-sm shadow-emerald-500/5">
                                            <Database size={22} />
                                        </div>
                                        <div>
                                            <h2 className="text-lg font-black text-[#2d5016] dark:text-emerald-300 uppercase tracking-tight">Quản trị Cơ sở dữ liệu</h2>
                                            <p className="text-[10px] font-bold text-gray-400 dark:text-emerald-300/40 uppercase tracking-widest mt-0.5">Tải tệp sao lưu, phục hồi dữ liệu, tối ưu hóa và dọn dẹp hệ thống</p>
                                        </div>
                                    </div>

                                    {/* Live Stats Cards Grid */}
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        <div className="p-4.5 bg-emerald-50/20 dark:bg-slate-900/60 rounded-2xl border border-emerald-950/5 dark:border-slate-800 shadow-sm flex flex-col justify-between min-h-[90px]">
                                            <span className="text-[9px] font-black text-gray-400 dark:text-emerald-300/40 uppercase tracking-wider">Dung lượng Cơ sở dữ liệu</span>
                                            <div className="flex items-baseline gap-1 mt-2">
                                                <span className="text-2xl font-black text-[#2d5016] dark:text-emerald-400 tracking-tight">{dbStats?.db_size_mb || 0}</span>
                                                <span className="text-[10px] font-black text-[#2d5016]/60 dark:text-emerald-500 uppercase">MB</span>
                                            </div>
                                        </div>
                                        <div className="p-4.5 bg-emerald-50/20 dark:bg-slate-900/60 rounded-2xl border border-emerald-950/5 dark:border-slate-800 shadow-sm flex flex-col justify-between min-h-[90px]">
                                            <span className="text-[9px] font-black text-gray-400 dark:text-emerald-300/40 uppercase tracking-wider">Tổng số đơn hàng đã bán</span>
                                            <span className="text-2xl font-black text-[#2d5016] dark:text-emerald-400 tracking-tight mt-2">{dbStats?.orders || 0}</span>
                                        </div>
                                        <div className="p-4.5 bg-emerald-50/20 dark:bg-slate-900/60 rounded-2xl border border-emerald-950/5 dark:border-slate-800 shadow-sm flex flex-col justify-between min-h-[90px]">
                                            <span className="text-[9px] font-black text-gray-400 dark:text-emerald-300/40 uppercase tracking-wider">Máy chủ dịch vụ</span>
                                            <div className="mt-2 flex">
                                                <span className="px-3 py-1 bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[9px] font-black rounded-lg uppercase tracking-wider border border-emerald-500/20 shadow-sm">
                                                    Đang hoạt động (OK)
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Main Administrative Control Grid */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                                        {/* Backups & Actions container */}
                                        <div className="bg-emerald-50/10 dark:bg-slate-900/30 p-5 rounded-3xl border border-emerald-900/5 dark:border-slate-800 space-y-4 shadow-sm">
                                            <h3 className="text-[11px] font-black uppercase tracking-[0.15em] text-[#2d5016] dark:text-emerald-400 flex items-center gap-2 pb-2 border-b border-emerald-900/5 dark:border-slate-800">
                                                <Database size={14} className="text-[#2d5016] dark:text-emerald-400" /> Lưu trữ & An toàn dữ liệu
                                            </h3>
                                            
                                            <div className="space-y-4">
                                                <div className="p-4 bg-white/40 dark:bg-slate-900/40 rounded-2xl border border-emerald-900/5 dark:border-slate-800/80">
                                                    <h4 className="text-[10px] font-black text-gray-700 dark:text-emerald-300/80 uppercase tracking-wider">Sao lưu vật lý (.db)</h4>
                                                    <p className="text-[9px] font-bold text-gray-400 dark:text-slate-400 mt-1 leading-normal uppercase">
                                                        Tải tệp tin database của máy để lưu trữ hoặc chuyển đổi thiết bị bán hàng.
                                                    </p>
                                                    <button
                                                        onClick={() => {
                                                            const baseUrl = axios.defaults.baseURL;
                                                            window.open(`${baseUrl}/api/backup`, '_blank');
                                                        }}
                                                        className="w-full mt-3.5 flex items-center justify-center gap-2 py-3 bg-[#2d5016] hover:bg-[#203c0e] dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white rounded-xl font-black text-[10px] uppercase tracking-[0.15em] shadow-sm transition-all active:scale-95 border border-white/10"
                                                    >
                                                        <Download size={14} /> TẢI FILE SAO LƯU (.db)
                                                    </button>
                                                </div>

                                                <div className="p-4 bg-white/40 dark:bg-slate-900/40 rounded-2xl border border-emerald-900/5 dark:border-slate-800/80">
                                                    <h4 className="text-[10px] font-black text-gray-700 dark:text-emerald-300/80 uppercase tracking-wider">Phục hồi dữ liệu</h4>
                                                    <p className="text-[9px] font-bold text-gray-400 dark:text-slate-400 mt-1 leading-normal uppercase">
                                                        Chọn tệp sao lưu `.db` đã lưu trước đó để ghi đè, khôi phục lại dữ liệu gốc.
                                                    </p>
                                                    <input type="file" id="restoreFile" accept=".db" className="hidden" onChange={handleRestore} />
                                                    <button
                                                        onClick={() => document.getElementById('restoreFile').click()}
                                                        className="w-full mt-3.5 flex items-center justify-center gap-2 py-3 bg-transparent hover:bg-rose-50 dark:hover:bg-rose-950/20 text-rose-600 dark:text-rose-400 border border-rose-500/20 rounded-xl font-black text-[10px] uppercase tracking-[0.15em] shadow-sm transition-all active:scale-95"
                                                    >
                                                        <RefreshCcw size={14} /> TẢI FILE ĐỂ KHÔI PHỤC
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Performance Optimization Actions */}
                                        <div className="bg-emerald-50/10 dark:bg-slate-900/30 p-5 rounded-3xl border border-emerald-900/5 dark:border-slate-800 space-y-4 shadow-sm">
                                            <h3 className="text-[11px] font-black uppercase tracking-[0.15em] text-[#2d5016] dark:text-emerald-400 flex items-center gap-2 pb-2 border-b border-emerald-900/5 dark:border-slate-800">
                                                <Activity size={14} className="text-[#2d5016] dark:text-emerald-400" /> Tối ưu & Dọn dẹp máy chủ
                                            </h3>
                                            
                                            <div className="space-y-3.5">
                                                <div className="grid grid-cols-2 gap-3">
                                                    <button
                                                        onClick={handleOptimize}
                                                        disabled={optimizing}
                                                        className="flex items-center justify-center gap-2 py-3 bg-white dark:bg-slate-900 text-[#2d5016] dark:text-emerald-400 border border-emerald-600/20 dark:border-emerald-500/20 rounded-xl font-black tracking-wider text-[9px] uppercase shadow-sm hover:bg-emerald-50 dark:hover:bg-slate-800 transition-all active:scale-95"
                                                    >
                                                        <RefreshCcw size={13} className={optimizing ? "animate-spin" : ""} />
                                                        {optimizing ? "ĐANG TỐI ƯU..." : "Tối ưu hóa Database"}
                                                    </button>

                                                    <button
                                                        onClick={handleNormalizeUom}
                                                        disabled={normalizingUom}
                                                        className="flex items-center justify-center gap-2 py-3 bg-[#4a7c59] dark:bg-emerald-600 text-white rounded-xl font-black tracking-wider text-[9px] uppercase shadow-sm hover:bg-[#3d664a] dark:hover:bg-emerald-700 transition-all active:scale-95 border border-white/10"
                                                    >
                                                        <Activity size={13} className={normalizingUom ? "animate-spin" : ""} />
                                                        {normalizingUom ? "ĐANG CHUẨN HÓA..." : "Chuẩn hóa đơn vị"}
                                                    </button>
                                                </div>

                                                {/* Sửa chữa & Vá dữ liệu */}
                                                <div className="p-4 bg-white/40 dark:bg-slate-900/40 rounded-2xl border border-emerald-900/5 dark:border-slate-800/80 space-y-3.5">
                                                    <div className="flex items-start justify-between gap-4">
                                                        <div className="text-left">
                                                            <span className="text-[10px] font-black text-gray-800 dark:text-emerald-300 uppercase tracking-wider block">Tự động Vá lỗi khi khởi động</span>
                                                            <span className="text-[8.5px] font-bold text-gray-400 dark:text-slate-400 block mt-1 leading-normal uppercase">Tự động sửa lỗi liên kết lô hàng và tính lại giá vốn khi mở máy chủ.</span>
                                                        </div>
                                                        <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-0.5">
                                                            <input
                                                                type="checkbox"
                                                                checked={settings.repair_on_startup === 'true'}
                                                                onChange={(e) => {
                                                                    const val = e.target.checked ? 'true' : 'false';
                                                                    updateSetting('repair_on_startup', val);
                                                                }}
                                                                className="sr-only peer"
                                                            />
                                                            <div className="w-8 h-4.5 bg-gray-200 dark:bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-emerald-500"></div>
                                                        </label>
                                                    </div>
                                                    <button
                                                        onClick={handleRepairBackend}
                                                        disabled={repairing}
                                                        className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-xl font-black text-[10px] uppercase tracking-[0.15em] shadow-sm transition-all active:scale-95 border border-white/10"
                                                    >
                                                        <RefreshCcw size={13} className={repairing ? "animate-spin" : ""} />
                                                        {repairing ? "ĐANG THỰC HIỆN..." : "SỬA LỖI & VÁ DỮ LIỆU NGAY"}
                                                    </button>
                                                </div>

                                                {/* Tối ưu & Dọn RAM */}
                                                <div className="p-4 bg-white/40 dark:bg-slate-900/40 rounded-2xl border border-emerald-900/5 dark:border-slate-800/80 space-y-3.5">
                                                    <div className="flex items-start justify-between gap-4">
                                                        <div className="text-left">
                                                            <span className="text-[10px] font-black text-gray-800 dark:text-emerald-300 uppercase tracking-wider block">Dọn dẹp rác RAM tự động</span>
                                                            <span className="text-[8.5px] font-bold text-gray-400 dark:text-slate-400 block mt-1 leading-normal uppercase">Định kỳ giải phóng bộ nhớ của tiến trình chính và các luồng chạy ẩn.</span>
                                                        </div>
                                                        <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-0.5">
                                                            <input
                                                                type="checkbox"
                                                                checked={settings.ram_cleanup_auto_enabled === 'true'}
                                                                onChange={(e) => {
                                                                    const val = e.target.checked ? 'true' : 'false';
                                                                    updateSetting('ram_cleanup_auto_enabled', val);
                                                                }}
                                                                className="sr-only peer"
                                                            />
                                                            <div className="w-8 h-4.5 bg-gray-200 dark:bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-emerald-500"></div>
                                                        </label>
                                                    </div>

                                                    {settings.ram_cleanup_auto_enabled === 'true' && (
                                                        <div className="space-y-1.5 animate-[fadeIn_0.2s_ease-out]">
                                                            <label className="text-[8.5px] font-black text-gray-400 dark:text-emerald-300/40 uppercase tracking-widest ml-1">Chu kỳ dọn dẹp (Phút)</label>
                                                            <input
                                                                type="number"
                                                                min="1"
                                                                max="1440"
                                                                name="ram_cleanup_interval_minutes"
                                                                value={settings.ram_cleanup_interval_minutes || '10'}
                                                                onChange={handleChange}
                                                                className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-xs text-gray-800 dark:text-emerald-50 focus:border-[#4a7c59] outline-none shadow-sm transition-all"
                                                            />
                                                        </div>
                                                    )}

                                                    <button
                                                        onClick={handleManualRamClean}
                                                        disabled={cleaningRam}
                                                        className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl font-black text-[10px] uppercase tracking-[0.15em] shadow-sm transition-all active:scale-95 border border-white/10"
                                                    >
                                                        <Sparkles size={13} className={cleaningRam ? "animate-spin" : ""} />
                                                        {cleaningRam ? "ĐANG DỌN DẸP..." : "GIẢI PHÓNG & TỐI ƯU RAM NGAY"}
                                                    </button>
                                                </div>

                                                {/* Danger zone container */}
                                                <div className="p-4 border border-rose-500/20 bg-rose-500/5 rounded-2xl space-y-3">
                                                    <div className="flex items-center gap-1.5">
                                                        <ShieldAlert size={14} className="text-rose-500" />
                                                        <span className="text-[9px] font-black text-rose-500 uppercase tracking-widest">Khu vực nguy hiểm (Danger Zone)</span>
                                                    </div>
                                                    <button
                                                        onClick={handleResetData}
                                                        disabled={isReseting}
                                                        className="w-full flex items-center justify-center gap-2 py-3 bg-rose-500 hover:bg-rose-600 text-white rounded-xl font-black text-[10px] uppercase tracking-[0.15em] shadow-sm active:scale-95 transition-all border border-white/10"
                                                    >
                                                        <Trash2 size={13} /> XOÁ SẠCH TOÀN BỘ DỮ LIỆU GỐC
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* TAB CONTENT: PERSONALIZATION (Cá nhân hóa với Subtabs) */}
                            {activeTab === 'ui' && (
                                <div className="space-y-6 animate-[fadeIn_0.2s_ease-out]">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-[#d4a574]/10">
                                        <div className="flex items-center gap-3.5">
                                            <div className="p-2.5 bg-emerald-100/50 dark:bg-emerald-900/30 rounded-xl text-[#2d5016] dark:text-emerald-400">
                                                <Monitor size={20} />
                                            </div>
                                            <div>
                                                <h2 className="text-lg font-black text-gray-800 dark:text-emerald-50 uppercase tracking-tight">Cá nhân hóa Trải nghiệm UI/UX</h2>
                                                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Tùy biến hiển thị Sidebar, bật/tắt trợ lý ảo và quản lý danh mục</p>
                                            </div>
                                        </div>

                                        {/* Subtab Navigation Pill Switcher */}
                                        <div className="flex items-center gap-1.5 p-1 bg-emerald-50/20 dark:bg-slate-900/60 rounded-2xl border border-emerald-900/10 dark:border-slate-800 self-start sm:self-auto overflow-x-auto no-scrollbar">
                                            {[
                                                { id: 'sidebar', label: 'Menu Sidebar', icon: Layers, desc: 'Ẩn/hiện các trang' },
                                                { id: 'wallpaper', label: 'Hình Nền App', icon: Sparkles, desc: '11 Presets & Tùy chỉnh' },
                                                { id: 'general', label: 'Mascot & Hệ thống', icon: Monitor, desc: 'Con trỏ, Mascot, Kế toán' },
                                                { id: 'categories', label: 'Ngành hàng', icon: Leaf, desc: 'Danh mục Categories' },
                                            ].map(sub => {
                                                const Icon = sub.icon;
                                                const isActive = uiSubTab === sub.id;
                                                return (
                                                    <button
                                                        key={sub.id}
                                                        type="button"
                                                        onClick={() => setUiSubTab(sub.id)}
                                                        className={cn(
                                                            "flex items-center gap-2 px-3.5 py-2 rounded-xl font-black text-[10px] uppercase tracking-wider transition-all shrink-0",
                                                            isActive
                                                                ? "bg-[#2d5016] text-white dark:bg-emerald-600 shadow-md shadow-emerald-950/20 border border-white/10"
                                                                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5"
                                                        )}
                                                    >
                                                        <Icon size={14} />
                                                        <span>{sub.label}</span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* SUBTAB 1: SIDEBAR MANAGER */}
                                    {uiSubTab === 'sidebar' && (
                                        <div className="animate-[fadeIn_0.2s_ease-out]">
                                            <SidebarManager onToast={setToast} onUpdateSetting={updateSetting} />
                                        </div>
                                    )}

                                    {/* SUBTAB: WALLPAPER MANAGER */}
                                    {uiSubTab === 'wallpaper' && (
                                        <div className="space-y-6 animate-[fadeIn_0.2s_ease-out]">
                                            <div className="p-6 bg-emerald-50/20 dark:bg-slate-800/40 rounded-2xl border border-emerald-900/5 dark:border-slate-700 space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <h3 className="text-sm font-black uppercase tracking-wide text-gray-800 dark:text-emerald-300 flex items-center gap-2">
                                                            <Sparkles size={16} className="text-amber-500" />
                                                            Bộ sưu tập 11 Hình Nền LyangPOS Chính Thức
                                                        </h3>
                                                        <p className="text-[10px] font-bold text-gray-400 dark:text-slate-400 uppercase tracking-widest mt-0.5">
                                                            Thiết kế độc quyền, tối ưu hoàn hảo cho cả Light & Dark Mode
                                                        </p>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            localStorage.removeItem("pos_cart_wallpaper");
                                                            window.dispatchEvent(new Event("app_wallpaper_changed"));
                                                            setToast({ message: "Đã xóa hình nền, dùng giao diện mặc định", type: "info" });
                                                        }}
                                                        className="px-3 py-1.5 rounded-xl border border-rose-500/30 hover:bg-rose-500/10 text-rose-600 dark:text-rose-400 font-bold text-[9px] uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                                                    >
                                                        <Trash2 size={13} />
                                                        Gỡ hình nền
                                                    </button>
                                                </div>

                                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
                                                    {WALLPAPER_PRESETS.map((preset) => (
                                                        <button
                                                            key={preset.id}
                                                            type="button"
                                                            onClick={async () => {
                                                                try {
                                                                    const response = await fetch(preset.path);
                                                                    const blob = await response.blob();
                                                                    const reader = new FileReader();
                                                                    reader.onloadend = () => {
                                                                        const base64 = reader.result;
                                                                        const config = {
                                                                            image: base64,
                                                                            size: 'cover',
                                                                            position: 'center',
                                                                            opacity: 90,
                                                                            blur: 0,
                                                                            glassBlur: 8,
                                                                            glassOpacity: 15
                                                                        };
                                                                        localStorage.setItem("pos_cart_wallpaper", JSON.stringify(config));
                                                                        window.dispatchEvent(new Event("app_wallpaper_changed"));
                                                                        setToast({ message: `Đã áp dụng hình nền: ${preset.name}`, type: "success" });
                                                                    };
                                                                    reader.readAsDataURL(blob);
                                                                } catch (err) {
                                                                    console.error('Error setting preset wallpaper:', err);
                                                                    setToast({ message: "Lỗi khi áp dụng hình nền", type: "error" });
                                                                }
                                                            }}
                                                            className="group/preset relative flex flex-col p-2 rounded-2xl border border-emerald-900/10 dark:border-slate-700 bg-white/60 dark:bg-slate-900/60 hover:border-emerald-500 transition-all cursor-pointer shadow-xs hover:shadow-md hover:scale-[1.02] active:scale-98 text-left"
                                                        >
                                                            <div className="w-full h-24 rounded-xl overflow-hidden border border-black/5 dark:border-white/5 relative mb-2">
                                                                <img 
                                                                    src={preset.path} 
                                                                    alt={preset.name} 
                                                                    className="w-full h-full object-cover group-hover/preset:scale-105 transition-transform duration-300"
                                                                />
                                                                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover/preset:opacity-100 transition-opacity flex items-end p-2">
                                                                    <span className="text-[9px] font-black text-white uppercase tracking-wider">Áp dụng ngay ✓</span>
                                                                </div>
                                                            </div>
                                                            <div className="font-black text-xs text-gray-800 dark:text-emerald-100 truncate">
                                                                {preset.name}
                                                            </div>
                                                            <div className="text-[9px] font-bold text-gray-400 dark:text-slate-400 truncate">
                                                                {preset.desc}
                                                            </div>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* SUBTAB 2: GENERAL UI & MASCOTS */}
                                    {uiSubTab === 'general' && (
                                        <div className="space-y-6 animate-[fadeIn_0.2s_ease-out]">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                                                {/* Dynamic Mascot Toggles */}
                                                <div className="space-y-3.5">
                                                    <h3 className="text-[10px] font-black uppercase tracking-[0.15em] text-[#8b6f47] dark:text-[#d4a574] flex items-center gap-1.5">
                                                        <Monitor size={13} className="text-[#8b6f47] dark:text-[#d4a574]" /> Tùy chọn Mascot, Con trỏ & Hệ thống
                                                    </h3>
                                                    
                                                    <div className="flex items-center justify-between p-4 bg-emerald-50/20 dark:bg-slate-800/40 rounded-xl border border-emerald-900/5 dark:border-slate-700 group hover:border-[#4a7c59]/20 transition-all">
                                                        <div className="flex items-center gap-3 min-w-0">
                                                            <div className="w-9 h-9 bg-transparent dark:bg-slate-900 rounded-lg flex items-center justify-center text-[#2d5016] dark:text-emerald-400 shrink-0">
                                                                <Monitor size={18} />
                                                            </div>
                                                            <div className="min-w-0">
                                                                <div className="text-xs font-black text-gray-800 dark:text-slate-100 uppercase tracking-wide leading-none">Khởi động cùng Windows</div>
                                                                <div className="text-[8px] font-bold text-gray-400 uppercase tracking-widest truncate mt-1">App tự động chạy khi bật máy tính</div>
                                                            </div>
                                                        </div>
                                                        <button
                                                            onClick={toggleAutostart}
                                                            className={cn(
                                                                "relative w-10 h-5.5 rounded-full transition-all duration-300 outline-none shrink-0 border border-emerald-900/10 dark:border-slate-600",
                                                                isAutostart ? "bg-[#2d5016]" : "bg-slate-200 dark:bg-slate-700"
                                                            )}
                                                        >
                                                            <div className={cn(
                                                                "absolute top-[2px] left-[2px] w-4 h-4 bg-white dark:bg-emerald-100 rounded-full transition-all duration-300 shadow-md",
                                                                isAutostart ? "translate-x-[18px]" : "translate-x-0"
                                                            )} />
                                                        </button>
                                                    </div>
                                                    
                                                    <div className="flex items-center justify-between p-4 bg-emerald-50/20 dark:bg-slate-800/40 rounded-xl border border-emerald-900/5 dark:border-slate-700 group hover:border-[#4a7c59]/20 transition-all">
                                                        <div className="flex items-center gap-3 min-w-0">
                                                            <div className="w-9 h-9 bg-transparent dark:bg-slate-900 rounded-lg flex items-center justify-center text-[#2d5016] dark:text-emerald-400 shrink-0">
                                                                <Bot size={18} />
                                                            </div>
                                                            <div className="min-w-0">
                                                                <div className="text-xs font-black text-gray-800 dark:text-slate-100 uppercase tracking-wide leading-none">Mascot ở Màn Hình POS</div>
                                                                <div className="text-[8px] font-bold text-gray-400 uppercase tracking-widest truncate mt-1">Hiện Mascot cậu bé nón rơm tương tác tại POS</div>
                                                            </div>
                                                        </div>
                                                        <button
                                                            onClick={() => {
                                                                const curVal = localStorage.getItem('ui_show_pos_mascot') !== 'false';
                                                                const newVal = curVal ? 'false' : 'true';
                                                                localStorage.setItem('ui_show_pos_mascot', newVal);
                                                                window.dispatchEvent(new Event('storage'));
                                                                setToast({ message: newVal === 'true' ? "Đã bật Mascot tại POS" : "Đã tắt Mascot tại POS", type: "info" });
                                                            }}
                                                            className={cn(
                                                                "relative w-10 h-5.5 rounded-full transition-all duration-300 outline-none shrink-0 border border-emerald-900/10 dark:border-slate-600",
                                                                (localStorage.getItem('ui_show_pos_mascot') !== 'false') ? "bg-[#2d5016]" : "bg-slate-200 dark:bg-slate-700"
                                                            )}
                                                        >
                                                            <div className={cn(
                                                                "absolute top-[2px] left-[2px] w-4 h-4 bg-white dark:bg-emerald-100 rounded-full transition-all duration-300 shadow-md",
                                                                (localStorage.getItem('ui_show_pos_mascot') !== 'false') ? "translate-x-[18px]" : "translate-x-0"
                                                            )} />
                                                        </button>
                                                    </div>

                                                    <div className="flex items-center justify-between p-4 bg-emerald-50/20 dark:bg-slate-800/40 rounded-xl border border-emerald-900/5 dark:border-slate-700 group hover:border-[#4a7c59]/20 transition-all">
                                                        <div className="flex items-center gap-3 min-w-0">
                                                            <div className="w-9 h-9 bg-transparent dark:bg-slate-900 rounded-lg flex items-center justify-center text-[#2d5016] dark:text-emerald-400 shrink-0">
                                                                <Monitor size={18} />
                                                            </div>
                                                            <div className="min-w-0">
                                                                <div className="text-xs font-black text-gray-800 dark:text-slate-100 uppercase tracking-wide leading-none">Hiệu ứng con trỏ chuột</div>
                                                                <div className="text-[8px] font-bold text-gray-400 uppercase tracking-widest truncate mt-1">Con trỏ chuột tùy biến sinh động (Custom Cursor)</div>
                                                            </div>
                                                        </div>
                                                        <button
                                                            onClick={() => {
                                                                const newVal = settings.ui_custom_cursor_enabled === 'true' ? 'false' : 'true';
                                                                updateSetting('ui_custom_cursor_enabled', newVal);
                                                                localStorage.setItem('pos_cursor_disabled', newVal === 'true' ? 'false' : 'true');
                                                                window.dispatchEvent(new Event('storage'));
                                                            }}
                                                            className={cn(
                                                                "relative w-10 h-5.5 rounded-full transition-all duration-300 outline-none shrink-0 border border-emerald-900/10 dark:border-slate-600",
                                                                settings.ui_custom_cursor_enabled === 'true' ? "bg-[#2d5016]" : "bg-slate-200 dark:bg-slate-700"
                                                            )}
                                                        >
                                                            <div className={cn(
                                                                "absolute top-[2px] left-[2px] w-4 h-4 bg-white dark:bg-emerald-100 rounded-full transition-all duration-300 shadow-md",
                                                                settings.ui_custom_cursor_enabled === 'true' ? "translate-x-[18px]" : "translate-x-0"
                                                            )} />
                                                        </button>
                                                    </div>
                                                    {settings.ui_custom_cursor_enabled === 'true' && (
                                                        <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 mt-2 bg-white/60 dark:bg-slate-900/60 rounded-xl border border-emerald-900/10 dark:border-slate-700/80">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-3 h-3 rounded-full border border-black/10 shadow-sm" style={{ backgroundColor: settings.ui_custom_cursor_color || '#10b981' }} />
                                                                <span className="text-[11px] font-black uppercase text-gray-700 dark:text-slate-200 tracking-wider">
                                                                    Màu sắc con trỏ chuột
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center gap-2 flex-wrap">
                                                                {[
                                                                    { name: 'Xanh ngọc', color: '#10b981' },
                                                                    { name: 'Vàng đất', color: '#8b6f47' },
                                                                    { name: 'Xanh dương', color: '#3b82f6' },
                                                                    { name: 'Đỏ tươi', color: '#ef4444' },
                                                                    { name: 'Vàng rực', color: '#f59e0b' },
                                                                    { name: 'Tím', color: '#8b5cf6' },
                                                                    { name: 'Hồng', color: '#ec4899' },
                                                                ].map(c => (
                                                                    <button
                                                                        key={c.color}
                                                                        type="button"
                                                                        title={c.name}
                                                                        onClick={() => {
                                                                            updateSetting('ui_custom_cursor_color', c.color);
                                                                            localStorage.setItem('pos_cursor_color', c.color);
                                                                            window.dispatchEvent(new Event('storage'));
                                                                            window.dispatchEvent(new Event('cursor_color_changed'));
                                                                        }}
                                                                        className={cn(
                                                                            "w-6 h-6 rounded-full transition-all duration-200 border-2 relative hover:scale-110 shadow-sm",
                                                                            (settings.ui_custom_cursor_color || '#10b981') === c.color ? "border-white dark:border-slate-900 ring-2 ring-emerald-500 scale-110" : "border-transparent"
                                                                        )}
                                                                        style={{ backgroundColor: c.color }}
                                                                    />
                                                                ))}
                                                                <div className="relative flex items-center justify-center cursor-pointer group" title="Màu tùy chỉnh">
                                                                    <input
                                                                        type="color"
                                                                        value={settings.ui_custom_cursor_color || '#10b981'}
                                                                        onChange={(e) => {
                                                                            const newColor = e.target.value;
                                                                            updateSetting('ui_custom_cursor_color', newColor);
                                                                            localStorage.setItem('pos_cursor_color', newColor);
                                                                            window.dispatchEvent(new Event('storage'));
                                                                            window.dispatchEvent(new Event('cursor_color_changed'));
                                                                        }}
                                                                        className="w-6 h-6 rounded-full cursor-pointer opacity-0 absolute inset-0 z-10"
                                                                    />
                                                                    <div 
                                                                        className="w-6 h-6 rounded-full border-2 border-dashed border-gray-400 dark:border-slate-500 flex items-center justify-center text-[10px] font-black text-gray-700 dark:text-gray-200 group-hover:scale-110 transition-all overflow-hidden shadow-sm"
                                                                        style={{ backgroundColor: settings.ui_custom_cursor_color || '#10b981' }}
                                                                    >
                                                                        +
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}

                                                    <div className="flex items-center justify-between p-4 bg-emerald-50/20 dark:bg-slate-800/40 rounded-xl border border-emerald-900/5 dark:border-slate-700 group hover:border-[#4a7c59]/20 transition-all">
                                                        <div className="flex items-center gap-3 min-w-0">
                                                            <div className="w-9 h-9 bg-transparent dark:bg-slate-900 rounded-lg flex items-center justify-center text-[#2d5016] dark:text-emerald-400 shrink-0">
                                                                <Sparkles size={18} />
                                                            </div>
                                                            <div className="min-w-0">
                                                                <div className="text-xs font-black text-gray-800 dark:text-slate-100 uppercase tracking-wide leading-none">Mascot chào mừng</div>
                                                                <div className="text-[8px] font-bold text-gray-400 uppercase tracking-widest truncate mt-1">Nhân vật chào mừng trên Bảng tin</div>
                                                            </div>
                                                        </div>
                                                        <button
                                                            onClick={() => {
                                                                const newVal = settings.ui_show_dashboard_mascot === 'true' ? 'false' : 'true';
                                                                updateSetting('ui_show_dashboard_mascot', newVal);
                                                                localStorage.setItem('ui_show_dashboard_mascot', newVal);
                                                                window.dispatchEvent(new Event('storage'));
                                                            }}
                                                            className={cn(
                                                                "relative w-10 h-5.5 rounded-full transition-all duration-300 outline-none shrink-0 border border-emerald-900/10 dark:border-slate-600",
                                                                settings.ui_show_dashboard_mascot === 'true' ? "bg-[#2d5016]" : "bg-slate-200 dark:bg-slate-700"
                                                            )}
                                                        >
                                                            <div className={cn(
                                                                "absolute top-[2px] left-[2px] w-4 h-4 bg-white dark:bg-emerald-100 rounded-full transition-all duration-300 shadow-md",
                                                                settings.ui_show_dashboard_mascot === 'true' ? "translate-x-[18px]" : "translate-x-0"
                                                            )} />
                                                        </button>
                                                    </div>

                                                    <div className="flex items-center justify-between p-4 bg-emerald-50/20 dark:bg-slate-800/40 rounded-xl border border-emerald-900/5 dark:border-slate-700 group hover:border-[#4a7c59]/20 transition-all">
                                                        <div className="flex items-center gap-3 min-w-0">
                                                            <div className="w-9 h-9 bg-transparent dark:bg-slate-900 rounded-lg flex items-center justify-center text-[#2d5016] dark:text-emerald-400 shrink-0">
                                                                <CalculatorIcon size={18} />
                                                            </div>
                                                            <div className="min-w-0">
                                                                <div className="text-xs font-black text-gray-800 dark:text-slate-100 uppercase tracking-wide leading-none">Phân hệ Kế toán</div>
                                                                <div className="text-[8px] font-bold text-gray-400 uppercase tracking-widest truncate mt-1">Bật tính năng đối soát & kho kế toán</div>
                                                            </div>
                                                        </div>
                                                        <button
                                                            onClick={async () => {
                                                                const isCurrentOn = settings.feature_accounting_enabled === 'true' || (settings.feature_accounting_enabled === undefined && localStorage.getItem('feature_accounting_enabled') !== 'false');
                                                                const newVal = isCurrentOn ? 'false' : 'true';
                                                                updateSetting('feature_accounting_enabled', newVal);
                                                                localStorage.setItem('feature_accounting_enabled', newVal);
                                                                window.dispatchEvent(new Event('storage'));
                                                                try {
                                                                    await axios.post('/api/settings', { feature_accounting_enabled: newVal });
                                                                } catch (err) {
                                                                    console.error('Lỗi khi lưu cài đặt kế toán:', err);
                                                                }
                                                            }}
                                                            className={cn(
                                                                "relative w-10 h-5.5 rounded-full transition-all duration-300 outline-none shrink-0 border border-emerald-900/10 dark:border-slate-600",
                                                                (settings.feature_accounting_enabled === 'true' || (settings.feature_accounting_enabled === undefined && localStorage.getItem('feature_accounting_enabled') !== 'false')) ? "bg-[#2d5016]" : "bg-slate-200 dark:bg-slate-700"
                                                            )}
                                                        >
                                                            <div className={cn(
                                                                "absolute top-[2px] left-[2px] w-4 h-4 bg-white dark:bg-emerald-100 rounded-full transition-all duration-300 shadow-md",
                                                                (settings.feature_accounting_enabled === 'true' || (settings.feature_accounting_enabled === undefined && localStorage.getItem('feature_accounting_enabled') !== 'false')) ? "translate-x-[18px]" : "translate-x-0"
                                                            )} />
                                                        </button>
                                                    </div>

                                                    <div className="flex items-center justify-between p-4 bg-emerald-50/20 dark:bg-slate-800/40 rounded-xl border border-emerald-900/5 dark:border-slate-700 group hover:border-[#4a7c59]/20 transition-all">
                                                        <div className="flex items-center gap-3 min-w-0">
                                                            <div className="w-9 h-9 bg-transparent dark:bg-slate-900 rounded-lg flex items-center justify-center text-[#8b6f47] dark:text-[#d4a574] shrink-0">
                                                                <CreditCard size={18} />
                                                            </div>
                                                            <div className="min-w-0">
                                                                <div className="text-xs font-black text-gray-800 dark:text-slate-100 uppercase tracking-wide leading-none">Nút Quy đổi Thuế / Tiền CK (TaxCalculator)</div>
                                                                <div className="text-[8px] font-bold text-gray-400 uppercase tracking-widest truncate mt-1">Bật/Tắt nút quy đổi tiền CK & TaxCalculatorModal trên sidebar POS</div>
                                                            </div>
                                                        </div>
                                                        <button
                                                            onClick={async () => {
                                                                const isCurrentOn = settings.feature_tax_calculator_enabled === 'true';
                                                                const newVal = isCurrentOn ? 'false' : 'true';
                                                                updateSetting('feature_tax_calculator_enabled', newVal);
                                                                localStorage.setItem('feature_tax_calculator_enabled', newVal);
                                                                window.dispatchEvent(new Event('storage'));
                                                                window.dispatchEvent(new Event('feature_tax_calculator_changed'));
                                                                try {
                                                                    await axios.post('/api/settings', { feature_tax_calculator_enabled: newVal });
                                                                } catch (err) {
                                                                    console.error('Lỗi khi lưu cài đặt tính thuế:', err);
                                                                }
                                                            }}
                                                            className={cn(
                                                                "relative w-10 h-5.5 rounded-full transition-all duration-300 outline-none shrink-0 border border-emerald-900/10 dark:border-slate-600",
                                                                settings.feature_tax_calculator_enabled === 'true' ? "bg-[#2d5016]" : "bg-slate-200 dark:bg-slate-700"
                                                            )}
                                                        >
                                                            <div className={cn(
                                                                "absolute top-[2px] left-[2px] w-4 h-4 bg-white dark:bg-emerald-100 rounded-full transition-all duration-300 shadow-md",
                                                                settings.feature_tax_calculator_enabled === 'true' ? "translate-x-[18px]" : "translate-x-0"
                                                            )} />
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Brands Directory Settings */}
                                                <div className="p-4 bg-emerald-50/20 dark:bg-slate-800/40 rounded-2xl border border-emerald-900/5 dark:border-slate-700/80 space-y-3 text-left">
                                                    <div className="flex items-center gap-2.5">
                                                        <div className="w-8 h-8 bg-transparent dark:bg-slate-900 rounded-lg flex items-center justify-center text-[#2d5016] dark:text-emerald-400">
                                                            <Tractor size={16} />
                                                        </div>
                                                        <div>
                                                            <h4 className="text-xs font-black text-gray-800 dark:text-slate-100 uppercase tracking-wide leading-none">Danh mục hãng sản xuất</h4>
                                                            <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mt-1">Quản lý danh sách nhà sản xuất / hãng sản phẩm</p>
                                                        </div>
                                                    </div>
                                                    <p className="text-[8.5px] font-bold text-gray-400 dark:text-slate-400 leading-normal uppercase">
                                                        Nhập các tên hãng (cách nhau bằng dấu phẩy) để tự động hiển thị gợi ý khi thêm/sửa sản phẩm.
                                                    </p>
                                                    <textarea
                                                        name="brands_directory"
                                                        value={settings.brands_directory || ''}
                                                        onChange={handleChange}
                                                        placeholder="Ví dụ: Syngenta, Bayer, Lộc Trời, Đầu Trâu..."
                                                        rows={3}
                                                        className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-xs text-gray-800 dark:text-slate-200 focus:border-[#4a7c59] outline-none shadow-inner transition-all resize-none"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* SUBTAB 3: CATEGORIES MANAGER */}
                                    {uiSubTab === 'categories' && (
                                        <div className="space-y-4 animate-[fadeIn_0.2s_ease-out]">
                                            <CategoryManager onToast={setToast} />
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* TAB CONTENT: KEYBOARD SHORTCUTS (Phím tắt) */}
                            {activeTab === 'shortcuts' && (
                                <div className="space-y-6 animate-[fadeIn_0.2s_ease-out]">
                                    <div className="flex items-center gap-3.5 pb-3 border-b border-[#d4a574]/10">
                                        <div className="p-2.5 bg-emerald-100/50 dark:bg-emerald-900/30 rounded-xl text-[#2d5016] dark:text-emerald-400">
                                            <Keyboard size={20} />
                                        </div>
                                        <div>
                                            <h2 className="text-lg font-black text-gray-800 dark:text-emerald-50 uppercase tracking-tight">Cấu hình phím tắt thao tác nhanh</h2>
                                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Tự do thay đổi các phím nóng để thực hiện giao dịch nhanh tại màn hình bán hàng (POS)</p>
                                        </div>
                                    </div>

                                    {/* Configurable Shortcuts */}
                                    <div className="space-y-3">
                                        <h3 className="text-[10px] font-black uppercase tracking-[0.15em] text-[#8b6f47] dark:text-[#d4a574] flex items-center gap-1.5">
                                            <SettingsIcon size={13} className="text-[#8b6f47] dark:text-[#d4a574]" /> Phím nóng tùy chỉnh (Nhấp để đổi)
                                        </h3>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            <div className="space-y-2 p-3 bg-emerald-50/10 dark:bg-slate-805/20 rounded-xl border border-emerald-900/5 dark:border-slate-800 flex flex-col items-center">
                                                <label className="text-[8.5px] font-black text-gray-400 uppercase tracking-widest text-center">Tìm Sản Phẩm</label>
                                                <div className="relative group w-16 h-16 flex items-center justify-center">
                                                    <input
                                                        name="kb_search"
                                                        value={settings.kb_search || 'F2'}
                                                        onChange={handleChange}
                                                        className="w-full h-full text-center text-lg font-black text-[#2d5016] dark:text-emerald-300 bg-transparent dark:bg-slate-900 border border-emerald-600/30 dark:border-emerald-500/20 rounded-xl outline-none shadow-sm focus:border-[#4a7c59] focus:ring-4 focus:ring-[#4a7c59]/15 transition-all font-mono"
                                                    />
                                                    <div className="absolute bottom-0.5 right-1.5 text-[7px] font-bold text-[#8b6f47]/40 font-mono pointer-events-none uppercase">KEY</div>
                                                </div>
                                            </div>

                                            <div className="space-y-2 p-3 bg-emerald-50/10 dark:bg-slate-805/20 rounded-xl border border-emerald-900/5 dark:border-slate-800 flex flex-col items-center">
                                                <label className="text-[8.5px] font-black text-gray-400 uppercase tracking-widest text-center">Kết Toán Đơn</label>
                                                <div className="relative group w-16 h-16 flex items-center justify-center">
                                                    <input
                                                        name="kb_pay"
                                                        value={settings.kb_pay || 'F9'}
                                                        onChange={handleChange}
                                                        className="w-full h-full text-center text-lg font-black text-amber-500 bg-transparent dark:bg-slate-900 border border-amber-500/30 rounded-xl outline-none shadow-sm focus:border-amber-500 focus:ring-4 focus:ring-amber-500/15 transition-all font-mono"
                                                    />
                                                    <div className="absolute bottom-0.5 right-1.5 text-[7px] font-bold text-amber-500/30 font-mono pointer-events-none uppercase">KEY</div>
                                                </div>
                                            </div>

                                            <div className="space-y-2 p-3 bg-emerald-50/10 dark:bg-slate-805/20 rounded-xl border border-emerald-900/5 dark:border-slate-800 flex flex-col items-center">
                                                <label className="text-[8.5px] font-black text-gray-400 uppercase tracking-widest text-center">Tạo Đơn Mới</label>
                                                <div className="relative group w-16 h-16 flex items-center justify-center">
                                                    <input
                                                        name="kb_new"
                                                        value={settings.kb_new || 'F4'}
                                                        onChange={handleChange}
                                                        className="w-full h-full text-center text-lg font-black text-[#2d5016] dark:text-emerald-300 bg-transparent dark:bg-slate-900 border border-emerald-600/30 dark:border-emerald-500/20 rounded-xl outline-none shadow-sm focus:border-[#4a7c59] focus:ring-4 focus:ring-[#4a7c59]/15 transition-all font-mono"
                                                    />
                                                    <div className="absolute bottom-0.5 right-1.5 text-[7px] font-bold text-[#8b6f47]/40 font-mono pointer-events-none uppercase">KEY</div>
                                                </div>
                                            </div>

                                            <div className="space-y-2 p-3 bg-emerald-50/10 dark:bg-slate-805/20 rounded-xl border border-emerald-900/5 dark:border-slate-800 flex flex-col items-center">
                                                <label className="text-[8.5px] font-black text-gray-400 uppercase tracking-widest text-center">Lưu Phôi (Treo)</label>
                                                <div className="relative group w-16 h-16 flex items-center justify-center">
                                                    <input
                                                        name="kb_hold"
                                                        value={settings.kb_hold || 'F8'}
                                                        onChange={handleChange}
                                                        className="w-full h-full text-center text-lg font-black text-blue-500 bg-transparent dark:bg-slate-900 border border-blue-500/30 rounded-xl outline-none shadow-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15 transition-all font-mono"
                                                    />
                                                    <div className="absolute bottom-0.5 right-1.5 text-[7px] font-bold text-blue-500/30 font-mono pointer-events-none uppercase">KEY</div>
                                                </div>
                                            </div>

                                            <div className="space-y-2 p-3 bg-emerald-50/10 dark:bg-slate-805/20 rounded-xl border border-emerald-900/5 dark:border-slate-800 flex flex-col items-center">
                                                <label className="text-[8.5px] font-black text-gray-400 uppercase tracking-widest text-center">Tìm Đối Tác</label>
                                                <div className="relative group w-16 h-16 flex items-center justify-center">
                                                    <input
                                                        name="kb_partner"
                                                        value={settings.kb_partner || 'F3'}
                                                        onChange={handleChange}
                                                        className="w-full h-full text-center text-lg font-black text-[#2d5016] dark:text-emerald-300 bg-transparent dark:bg-slate-900 border border-emerald-600/30 dark:border-emerald-500/20 rounded-xl outline-none shadow-sm focus:border-[#4a7c59] focus:ring-4 focus:ring-[#4a7c59]/15 transition-all font-mono"
                                                    />
                                                    <div className="absolute bottom-0.5 right-1.5 text-[7px] font-bold text-[#8b6f47]/40 font-mono pointer-events-none uppercase">KEY</div>
                                                </div>
                                            </div>
                                            <div className="space-y-2 p-3 bg-emerald-50/10 dark:bg-slate-805/20 rounded-xl border border-emerald-900/5 dark:border-slate-800 flex flex-col items-center">
                                                <label className="text-[8.5px] font-black text-gray-400 uppercase tracking-widest text-center">Tiền Khách Đưa</label>
                                                <div className="relative group w-16 h-16 flex items-center justify-center">
                                                    <input
                                                        name="kb_cash"
                                                        value={settings.kb_cash || 'F1'}
                                                        onChange={handleChange}
                                                        className="w-full h-full text-center text-lg font-black text-indigo-500 bg-transparent dark:bg-slate-900 border border-indigo-500/30 rounded-xl outline-none shadow-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/15 transition-all font-mono"
                                                    />
                                                    <div className="absolute bottom-0.5 right-1.5 text-[7px] font-bold text-indigo-500/30 font-mono pointer-events-none uppercase">KEY</div>
                                                </div>
                                            </div>
                                            <div className="space-y-2 p-3 bg-emerald-50/10 dark:bg-slate-805/20 rounded-xl border border-emerald-900/5 dark:border-slate-800 flex flex-col items-center">
                                                <label className="text-[8.5px] font-black text-gray-400 uppercase tracking-widest text-center">Đọc Tổng Tiền</label>
                                                <div className="relative group w-16 h-16 flex items-center justify-center">
                                                    <input
                                                        name="kb_speech"
                                                        value={settings.kb_speech || 'F10'}
                                                        onChange={handleChange}
                                                        className="w-full h-full text-center text-lg font-black text-purple-500 bg-transparent dark:bg-slate-900 border border-purple-500/30 rounded-xl outline-none shadow-sm focus:border-purple-500 focus:ring-4 focus:ring-purple-500/15 transition-all font-mono"
                                                    />
                                                    <div className="absolute bottom-0.5 right-1.5 text-[7px] font-bold text-purple-500/30 font-mono pointer-events-none uppercase">KEY</div>
                                                </div>
                                            </div>
                                            <div className="space-y-2 p-3 bg-emerald-50/10 dark:bg-slate-805/20 rounded-xl border border-emerald-900/5 dark:border-slate-800 flex flex-col items-center">
                                                <label className="text-[8.5px] font-black text-gray-400 uppercase tracking-widest text-center">Lưu Hoá Đơn</label>
                                                <div className="relative group w-16 h-16 flex items-center justify-center">
                                                    <input
                                                        name="kb_save"
                                                        value={settings.kb_save || 'F12'}
                                                        onChange={handleChange}
                                                        className="w-full h-full text-center text-lg font-black text-rose-500 bg-transparent dark:bg-slate-900 border border-rose-500/30 rounded-xl outline-none shadow-sm focus:border-rose-500 focus:ring-4 focus:ring-rose-500/15 transition-all font-mono"
                                                    />
                                                    <div className="absolute bottom-0.5 right-1.5 text-[7px] font-bold text-rose-500/30 font-mono pointer-events-none uppercase">KEY</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Built-in System Shortcuts & Manual Guide */}
                                    <div className="space-y-3 pt-3 border-t border-[#d4a574]/15">
                                        <h3 className="text-[10px] font-black uppercase tracking-[0.15em] text-[#2d5016] dark:text-emerald-400 flex items-center gap-1.5">
                                            <Monitor size={13} className="text-[#2d5016] dark:text-emerald-400" /> Hướng dẫn & Phím tắt hệ thống mặc định
                                        </h3>
                                        <div className="p-4 bg-emerald-50/10 dark:bg-slate-800/20 border border-emerald-900/5 dark:border-slate-800 rounded-2xl space-y-3">

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-xs">
                                                <div className="flex items-center justify-between p-2.5 bg-emerald-50/20 dark:bg-slate-900/60 rounded-xl border border-emerald-900/5 dark:border-slate-800">
                                                    <span className="font-black text-[#2d5016] dark:text-emerald-300 uppercase text-[9px] tracking-wide">Xem & Quản lý đơn treo (Treo Panel)</span>
                                                    <span className="px-2 py-0.5 bg-[#2d5016]/10 dark:bg-emerald-500/20 text-[#2d5016] dark:text-emerald-400 font-mono font-black rounded text-[10px] border border-[#2d5016]/20 dark:border-emerald-500/30 shadow-sm">Ctrl + Space</span>
                                                </div>
                                                <div className="flex items-center justify-between p-2.5 bg-emerald-50/20 dark:bg-slate-900/60 rounded-xl border border-emerald-900/5 dark:border-slate-800">
                                                    <span className="font-black text-[#2d5016] dark:text-emerald-300 uppercase text-[9px] tracking-wide">Chuyển đổi Tab POS tiếp theo</span>
                                                    <span className="px-2 py-0.5 bg-[#2d5016]/10 dark:bg-emerald-500/20 text-[#2d5016] dark:text-emerald-400 font-mono font-black rounded text-[10px] border border-[#2d5016]/20 dark:border-emerald-500/30 shadow-sm">Ctrl + Arrow Down</span>
                                                </div>
                                                <div className="flex items-center justify-between p-2.5 bg-emerald-50/20 dark:bg-slate-900/60 rounded-xl border border-emerald-900/5 dark:border-slate-800">
                                                    <span className="font-black text-[#2d5016] dark:text-emerald-300 uppercase text-[9px] tracking-wide">Chuyển đổi Tab POS phía trước</span>
                                                    <span className="px-2 py-0.5 bg-[#2d5016]/10 dark:bg-emerald-500/20 text-[#2d5016] dark:text-emerald-400 font-mono font-black rounded text-[10px] border border-[#2d5016]/20 dark:border-emerald-500/30 shadow-sm">Ctrl + Arrow Up</span>
                                                </div>
                                                <div className="flex items-center justify-between p-2.5 bg-emerald-50/20 dark:bg-slate-900/60 rounded-xl border border-emerald-900/5 dark:border-slate-800">
                                                    <span className="font-black text-[#2d5016] dark:text-emerald-300 uppercase text-[9px] tracking-wide">Chọn hoá đơn đang chờ sau</span>
                                                    <span className="px-2 py-0.5 bg-[#2d5016]/10 dark:bg-emerald-500/20 text-[#2d5016] dark:text-emerald-400 font-mono font-black rounded text-[10px] border border-[#2d5016]/20 dark:border-emerald-500/30 shadow-sm">Ctrl + Arrow Right</span>
                                                </div>
                                                <div className="flex items-center justify-between p-2.5 bg-emerald-50/20 dark:bg-slate-900/60 rounded-xl border border-emerald-900/5 dark:border-slate-800">
                                                    <span className="font-black text-[#2d5016] dark:text-emerald-300 uppercase text-[9px] tracking-wide">Chọn hoá đơn đang chờ trước</span>
                                                    <span className="px-2 py-0.5 bg-[#2d5016]/10 dark:bg-emerald-500/20 text-[#2d5016] dark:text-emerald-400 font-mono font-black rounded text-[10px] border border-[#2d5016]/20 dark:border-emerald-500/30 shadow-sm">Ctrl + Arrow Left</span>
                                                </div>
                                                <div className="flex items-center justify-between p-2.5 bg-emerald-50/20 dark:bg-slate-900/60 rounded-xl border border-emerald-900/5 dark:border-slate-800">
                                                    <span className="font-black text-[#2d5016] dark:text-emerald-300 uppercase text-[9px] tracking-wide">Chuyển Tab nhanh liền trước</span>
                                                    <span className="px-2 py-0.5 bg-[#2d5016]/10 dark:bg-emerald-500/20 text-[#2d5016] dark:text-emerald-400 font-mono font-black rounded text-[10px] border border-[#2d5016]/20 dark:border-emerald-500/30 shadow-sm">Ctrl + Page Up</span>
                                                </div>
                                                <div className="flex items-center justify-between p-2.5 bg-emerald-50/20 dark:bg-slate-900/60 rounded-xl border border-emerald-900/5 dark:border-slate-800">
                                                    <span className="font-black text-[#2d5016] dark:text-emerald-300 uppercase text-[9px] tracking-wide">Chuyển Tab nhanh liền sau</span>
                                                    <span className="px-2 py-0.5 bg-[#2d5016]/10 dark:bg-emerald-500/20 text-[#2d5016] dark:text-emerald-400 font-mono font-black rounded text-[10px] border border-[#2d5016]/20 dark:border-emerald-500/30 shadow-sm">Ctrl + Page Down</span>
                                                </div>
                                                <div className="flex items-center justify-between p-2.5 bg-emerald-50/20 dark:bg-slate-900/60 rounded-xl border border-emerald-900/5 dark:border-slate-800 col-span-full">
                                                    <span className="font-black text-[#2d5016] dark:text-emerald-300 uppercase text-[9px] tracking-wide">Đóng/Tắt các Popup Modal</span>
                                                    <span className="px-2 py-0.5 bg-rose-500/10 text-rose-600 dark:text-rose-400 font-mono font-black rounded text-[10px] border border-rose-500/20 shadow-sm">ESC</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Toast and Modals Integration */}
                            <div className="mt-6 flex justify-end">
                                <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">PHIÊN BẢN HỆ THỐNG: V3.14.0 • AGRI EDITION</p>
                            </div>
                        </m.div>
                    </AnimatePresence>
                </div>
            </div>

            {/* Alert / Toast Messages */}
            <AnimatePresence>
                {toast && (
                    <Toast
                        message={toast.message}
                        type={toast.type}
                        onClose={() => setToast(null)}
                    />
                )}
            </AnimatePresence>

            {confirm && (
                <ConfirmModal
                    isOpen={!!confirm}
                    title={confirm.title}
                    message={confirm.message}
                    onConfirm={confirm.onConfirm}
                    onCancel={() => setConfirm(null)}
                    type={confirm.type}
                />
            )}

            {passwordPrompt && (
                <PasswordConfirmModal
                    isOpen={!!passwordPrompt}
                    title={passwordPrompt.title}
                    message={passwordPrompt.message}
                    onConfirm={passwordPrompt.onConfirm}
                    onCancel={() => setPasswordPrompt(null)}
                />
            )}
            </div>
        </div>
    );
}
