import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { AnimatePresence, m } from 'framer-motion';
import CustomSelect from '../../components/forms/CustomSelect';
import { 
    Save, Building, Cloud, Download, RefreshCcw, RefreshCw, Check, Info, Settings as SettingsIcon, 
    Database, Keyboard, Monitor, Layout, Tractor, Wheat, Droplets, Leaf, Bot, 
    Sparkles, Trash2, CreditCard, ArrowRight, Activity, Calculator as CalculatorIcon, 
    Copy, ShieldAlert, Shield, Wifi, Laptop, Key, CheckCircle, Smartphone, Layers, Volume2, Type, Edit3,
    Loader2, Zap, Eye, RotateCw, RotateCcw, ChevronLeft, ChevronRight, Archive
} from 'lucide-react';
import YearEndArchiveModal from '../../components/modals/YearEndArchiveModal';
import LoadingOverlay from '../../components/layout/LoadingOverlay';
import OrderSwitchOverlay from '../../components/pos/OrderSwitchOverlay';
import { cn } from '../../lib/utils';
import { useIconContext } from '../../context/IconContext';
import { getLucideIconComponent } from '../../lib/iconConfig';
import Toast from '../../components/widgets/Toast';
import ConfirmModal from '../../components/modals/ConfirmModal';
import PasswordConfirmModal from '../../components/modals/PasswordConfirmModal';
import CategoryManager from '../../components/panels/CategoryManager';
import SidebarManager from '../../components/layout/SidebarManager';
import GoogleFontPickerModal from '../../components/modals/GoogleFontPickerModal';
import IconPickerModal from '../../components/modals/IconPickerModal';
import { applyGlobalAppFont } from '../../lib/googleFonts';
import { DEFAULT_SETTINGS } from '../../lib/settings';
import { queryClient } from '../../lib/queryClient';
import { enable, disable, isEnabled } from '@tauri-apps/plugin-autostart';


export default function Settings() {
    const { customIcons, editMode, toggleEditMode, resetIcons, updateIcon } = useIconContext();
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
        gemini_api_key_2: '',
        gemini_api_key_3: '',
        gemini_selected_model: localStorage.getItem('lyang_ai_selected_model') || 'gemini-2.5-flash',
        gemini_available_models: '[]',
        brands_directory: '',
        ui_theme_zen_botanical: localStorage.getItem('ui_theme_zen_botanical') || DEFAULT_SETTINGS.ui_theme_zen_botanical || 'false',
        ui_loading_style: localStorage.getItem('ui_loading_style') || DEFAULT_SETTINGS.ui_loading_style || 'ring',
        pos_order_switch_animation: localStorage.getItem('pos_order_switch_animation') || DEFAULT_SETTINGS.pos_order_switch_animation || 'ring',
        ui_show_doraemon: localStorage.getItem('ui_show_doraemon') || DEFAULT_SETTINGS.ui_show_doraemon,
        ui_custom_cursor_enabled: localStorage.getItem('pos_cursor_disabled') !== 'true' ? 'true' : 'false',
        ui_custom_cursor_color: localStorage.getItem('pos_cursor_color') || '#10b981',
        ui_custom_cursor_icon: localStorage.getItem('pos_cursor_icon') || '',
        ui_custom_cursor_icon_size: localStorage.getItem('pos_cursor_icon_size') || '24',
        ui_custom_cursor_ring_enabled: localStorage.getItem('pos_cursor_ring_disabled') !== 'true' ? 'true' : 'false',
        ui_custom_cursor_glow_enabled: localStorage.getItem('pos_cursor_glow_disabled') !== 'true' ? 'true' : 'false',
        feature_accounting_enabled: localStorage.getItem('feature_accounting_enabled') || DEFAULT_SETTINGS.feature_accounting_enabled,
        pos_default_landing_page: localStorage.getItem('pos_default_landing_page') || DEFAULT_SETTINGS.pos_default_landing_page || 'dashboard',
        pos_typing_sound_enabled: localStorage.getItem('pos_typing_sound_enabled') || DEFAULT_SETTINGS.pos_typing_sound_enabled || 'true',
        app_font_family: localStorage.getItem('app_font_family') || DEFAULT_SETTINGS.app_font_family || 'Be Vietnam Pro',
        sidebar_hidden_items: localStorage.getItem('sidebar_hidden_items') || '[]',
        repair_on_startup: 'false',
        ram_cleanup_auto_enabled: 'false',
        ram_cleanup_interval_minutes: '10',
    });
    const [previewLoading, setPreviewLoading] = useState(null); // { style, message }
    const [previewOrderSwitch, setPreviewOrderSwitch] = useState(null); // { style, title }
    const [showAppFontModal, setShowAppFontModal] = useState(false);
    const [cursorPickerTarget, setCursorPickerTarget] = useState(null);
    const [isFetchingGeminiModels, setIsFetchingGeminiModels] = useState(false);
    const [availableGeminiModels, setAvailableGeminiModels] = useState(() => {
        try {
            const saved = localStorage.getItem('lyang_ai_available_models');
            if (saved) {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed) && parsed.length > 0) return parsed;
            }
        } catch (e) {}
        return [
            { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', desc: 'Thế hệ 2.5 mới nhất - Tốc độ cực nhanh & tối ưu nhất (Khuyên dùng)' },
            { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', desc: 'Tốc độ cao, đa phương thức vượt trội' },
            { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', desc: 'Hoạt động ổn định, phản hồi tức thì' },
            { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', desc: 'Suy luận cao cấp nhất, độ chính xác tối đa' },
            { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', desc: 'Suy luận chuyên sâu & ngữ cảnh lớn' }
        ];
    });

    useEffect(() => {
        const handleModelChanged = (e) => {
            if (e.detail?.model) {
                setSettings(prev => ({ ...prev, gemini_selected_model: e.detail.model }));
            }
            if (e.detail?.models && Array.isArray(e.detail.models)) {
                setAvailableGeminiModels(e.detail.models);
            }
        };
        window.addEventListener('gemini_model_changed', handleModelChanged);
        return () => window.removeEventListener('gemini_model_changed', handleModelChanged);
    }, []);

        const geminiModelOptions = useMemo(() => {
        return (availableGeminiModels || []).map(m => {
            const id = m.id || m.value;
            const name = m.name || m.label || id;
            const label = (name && name !== id) ? `${name} (${id})` : id;
            return {
                value: id,
                label: label,
                desc: m.desc
            };
        });
    }, [availableGeminiModels]);

    const handleSelectGeminiModel = async (modelId) => {
        setSettings(prev => ({ ...prev, gemini_selected_model: modelId }));
        try {
            localStorage.setItem('lyang_ai_selected_model', modelId);
            await axios.post('/api/settings', { gemini_selected_model: modelId });
            window.dispatchEvent(new CustomEvent('gemini_model_changed', { detail: { model: modelId } }));
            setToast({ message: `Đã chọn mô hình ${modelId} áp dụng cho toàn bộ hệ thống!`, type: 'success' });
        } catch (err) {
            console.error('Lỗi khi lưu model:', err);
        }
    };

    const handleFetchGeminiModels = async () => {
        setIsFetchingGeminiModels(true);
        try {
            let apiKeys = [];
            [settings.gemini_api_key, settings.gemini_api_key_2, settings.gemini_api_key_3].forEach(k => {
                if (k && typeof k === 'string') {
                    k.split(/[,;\n]/).forEach(p => {
                        const trimmed = p.trim();
                        if (trimmed && !apiKeys.includes(trimmed)) apiKeys.push(trimmed);
                    });
                }
            });
            const localKey = (localStorage.getItem('gemini_api_key') || '').trim();
            if (localKey && !apiKeys.includes(localKey)) apiKeys.push(localKey);

            let foundModels = [];
            let lastError = '';

            // 1. Thử gọi qua endpoint backend
            try {
                const bRes = await axios.post('/api/ai/models', { api_key: apiKeys[0] || undefined }, { timeout: 15000 });
                if (bRes.data?.models && Array.isArray(bRes.data.models) && bRes.data.models.length > 0) {
                    foundModels = bRes.data.models;
                }
            } catch (bErr) {
                console.warn('Backend fetch models failed, trying direct Google API...', bErr);
            }

            // 2. Dự phòng: gọi trực tiếp Google Generative Language API nếu backend chưa fetch được
            if (foundModels.length === 0) {
                if (apiKeys.length === 0) {
                    setToast({ message: 'Vui lòng nhập ít nhất một Gemini API Key để lấy danh sách mô hình!', type: 'error' });
                    setIsFetchingGeminiModels(false);
                    return;
                }
                for (let i = 0; i < apiKeys.length; i++) {
                    const key = apiKeys[i];
                    try {
                        const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;
                        const res = await axios.get(url, { timeout: 12000 });
                        if (res.data?.models && Array.isArray(res.data.models)) {
                            const filtered = res.data.models
                                .filter(m => {
                                    const methods = m.supportedGenerationMethods || [];
                                    return methods.includes('generateContent');
                                })
                                .map(m => {
                                    const cleanId = (m.name || '').replace(/^models\//, '');
                                    return {
                                        id: cleanId,
                                        name: m.displayName || cleanId,
                                        desc: m.description ? (m.description.length > 90 ? m.description.substring(0, 90) + '...' : m.description) : `Tokens: ${m.inputTokenLimit?.toLocaleString() || '1M'}`,
                                        inputTokenLimit: m.inputTokenLimit
                                    };
                                })
                                .filter(m => m.id && !m.id.includes('embedding') && !m.id.includes('aqa') && !m.id.includes('imagen') && !m.id.includes('text-embedding'));

                            if (filtered.length > 0) {
                                filtered.sort((a, b) => {
                                    const getRank = (id) => {
                                        if (id.includes('2.5-flash')) return 100;
                                        if (id.includes('2.0-flash')) return 90;
                                        if (id.includes('1.5-flash')) return 80;
                                        if (id.includes('3.5-flash')) return 75;
                                        if (id.includes('2.5-pro')) return 70;
                                        if (id.includes('2.0-pro')) return 60;
                                        if (id.includes('1.5-pro')) return 50;
                                        return 10;
                                    };
                                    return getRank(b.id) - getRank(a.id);
                                });
                                foundModels = filtered;
                                break;
                            }
                        }
                    } catch (err) {
                        lastError = err.response?.data?.error?.message || err.message;
                    }
                }
            }

            if (foundModels.length > 0) {
                setAvailableGeminiModels(foundModels);
                const currentSelected = settings.gemini_selected_model;
                const chosenModel = foundModels.some(m => m.id === currentSelected) ? currentSelected : foundModels[0].id;
                
                setSettings(prev => ({
                    ...prev,
                    gemini_selected_model: chosenModel,
                    gemini_available_models: JSON.stringify(foundModels)
                }));

                localStorage.setItem('lyang_ai_available_models', JSON.stringify(foundModels));
                localStorage.setItem('lyang_ai_selected_model', chosenModel);

                await axios.post('/api/settings', {
                    gemini_available_models: JSON.stringify(foundModels),
                    gemini_selected_model: chosenModel
                });

                window.dispatchEvent(new CustomEvent('gemini_model_changed', {
                    detail: { model: chosenModel, models: foundModels }
                }));

                setToast({
                    message: `Đã cập nhật ${foundModels.length} mô hình chính thức từ Google AI! Áp dụng: ${chosenModel}`,
                    type: 'success'
                });
            } else {
                setToast({
                    message: `Không thể lấy danh sách mô hình: ${lastError || 'Kiểm tra lại kết nối và API Key'}`,
                    type: 'error'
                });
            }
        } catch (e) {
            setToast({ message: `Lỗi fetch models: ${e.message}`, type: 'error' });
        } finally {
            setIsFetchingGeminiModels(false);
        }
    };
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [dbStats, setDbStats] = useState(null);
    const [optimizing, setOptimizing] = useState(false);
    const [normalizingUom, setNormalizingUom] = useState(false);
    const [cleaningRam, setCleaningRam] = useState(false);
    const [repairing, setRepairing] = useState(false);
    const [isReseting, setIsReseting] = useState(false);
    const [showArchiveModal, setShowArchiveModal] = useState(false);
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
                    
                    // 1. Xóa toàn bộ React Query cache & LocalStorage state cũ để nạp mới 100%
                    queryClient.clear();
                    try {
                        const keysToKeep = ['server_ip', 'user', 'theme', 'app_font_family', 'ui_show_doraemon', 'pos_cursor_disabled', 'pos_cursor_color', 'pos_cursor_icon', 'pos_cursor_icon_size', 'pos_cursor_ring_disabled', 'pos_cursor_glow_disabled', 'pos_default_landing_page', 'pos_typing_sound_enabled', 'ui_loading_style', 'pos_order_switch_animation'];
                        Object.keys(localStorage).forEach(k => {
                            if (!keysToKeep.includes(k) && !k.startsWith('tauri')) {
                                localStorage.removeItem(k);
                            }
                        });
                    } catch (e) {
                        console.warn('Clear storage cache error:', e);
                    }

                    setToast({ message: (res.data.message || "Khôi phục dữ liệu thành công!") + " Đang làm mới dữ liệu...", type: "success" });
                    
                    // 2. Tải lại toàn bộ giao diện và dữ liệu ngay lập tức
                    setTimeout(() => {
                        window.location.reload();
                    }, 1200);
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

                const localCursorColor = localStorage.getItem('pos_cursor_color');
                if (localCursorColor !== null) combined.ui_custom_cursor_color = localCursorColor;

                const localCursorIcon = localStorage.getItem('pos_cursor_icon');
                if (localCursorIcon !== null) combined.ui_custom_cursor_icon = localCursorIcon;

                const localCursorIconSize = localStorage.getItem('pos_cursor_icon_size');
                if (localCursorIconSize !== null) combined.ui_custom_cursor_icon_size = localCursorIconSize;

                const localCursorRing = localStorage.getItem('pos_cursor_ring_disabled');
                if (localCursorRing !== null) combined.ui_custom_cursor_ring_enabled = localCursorRing === 'true' ? 'false' : 'true';

                const localCursorGlow = localStorage.getItem('pos_cursor_glow_disabled');
                if (localCursorGlow !== null) combined.ui_custom_cursor_glow_enabled = localCursorGlow === 'true' ? 'false' : 'true';

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

                const localAppFont = localStorage.getItem('app_font_family');
                if (localAppFont !== null) {
                    combined.app_font_family = localAppFont;
                } else if (combined.app_font_family) {
                    localStorage.setItem('app_font_family', combined.app_font_family);
                    applyGlobalAppFont(combined.app_font_family);
                }

                                if (combined.gemini_selected_model) {
                    localStorage.setItem('lyang_ai_selected_model', combined.gemini_selected_model);
                } else {
                    combined.gemini_selected_model = localStorage.getItem('lyang_ai_selected_model') || 'gemini-2.5-flash';
                }

                if (combined.gemini_available_models) {
                    try {
                        const parsed = typeof combined.gemini_available_models === 'string'
                            ? JSON.parse(combined.gemini_available_models)
                            : combined.gemini_available_models;
                        if (Array.isArray(parsed) && parsed.length > 0) {
                            setAvailableGeminiModels(parsed);
                            localStorage.setItem('lyang_ai_available_models', JSON.stringify(parsed));
                        }
                    } catch (e) {}
                }

                const localLoadingStyle = localStorage.getItem('ui_loading_style');
                if (localLoadingStyle !== null) {
                    combined.ui_loading_style = localLoadingStyle;
                } else if (combined.ui_loading_style) {
                    localStorage.setItem('ui_loading_style', combined.ui_loading_style);
                }

                const localOrderSwitchAnim = localStorage.getItem('pos_order_switch_animation');
                if (localOrderSwitchAnim !== null) {
                    combined.pos_order_switch_animation = localOrderSwitchAnim;
                } else if (combined.pos_order_switch_animation) {
                    localStorage.setItem('pos_order_switch_animation', combined.pos_order_switch_animation);
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

    const handleLoadingStyleSelect = async (styleKey) => {
        updateSetting('ui_loading_style', styleKey);
        localStorage.setItem('ui_loading_style', styleKey);
        window.dispatchEvent(new CustomEvent('ui_loading_style_changed', { detail: styleKey }));
        window.dispatchEvent(new Event('storage'));
        try {
            const syncChan = new BroadcastChannel('pos_data_sync');
            syncChan.postMessage({ type: 'UI_SETTING_UPDATED', key: 'ui_loading_style', value: styleKey });
            syncChan.close();
        } catch (e) {}
        try {
            await axios.post('/api/settings', { ui_loading_style: styleKey });
        } catch (e) {}
        setToast({
            message: `Đã chọn kiểu màn hình tải: ${
                styleKey === 'ring'
                    ? 'Vòng Xoay Vụ Mùa (Agri Ring)'
                    : styleKey === 'minimal' 
                        ? 'Thẻ Tối Giản (Minimal Card)' 
                        : styleKey === 'compact' 
                            ? 'Thanh Nổi Mini' 
                            : 'Sinh Động & Hoạt Họa'
            }`,
            type: 'success'
        });
    };

    const handlePreviewLoading = (styleKey) => {
        const sampleMsg = styleKey === 'ring'
            ? 'Đang đồng bộ dữ liệu...'
            : styleKey === 'minimal'
                ? 'Đang kiểm tra hệ thống (Tối giản siêu nhẹ)...'
                : styleKey === 'compact'
                    ? 'Đang đồng bộ nhanh dữ liệu...'
                    : 'Đang khởi động hệ thống...';
        setPreviewLoading({
            style: styleKey,
            message: sampleMsg
        });
    };

    useEffect(() => {
        if (!previewLoading) return;
        const timer = setTimeout(() => {
            setPreviewLoading(null);
        }, 2800);
        return () => clearTimeout(timer);
    }, [previewLoading]);

    const handleOrderSwitchAnimSelect = async (styleKey) => {
        updateSetting('pos_order_switch_animation', styleKey);
        localStorage.setItem('pos_order_switch_animation', styleKey);
        window.dispatchEvent(new CustomEvent('pos_order_switch_anim_changed', { detail: styleKey }));
        window.dispatchEvent(new Event('storage'));
        try {
            const syncChan = new BroadcastChannel('pos_data_sync');
            syncChan.postMessage({ type: 'UI_SETTING_UPDATED', key: 'pos_order_switch_animation', value: styleKey });
            syncChan.close();
        } catch (e) {}
        try {
            await axios.post('/api/settings', { pos_order_switch_animation: styleKey });
        } catch (e) {}
        setToast({
            message: `Đã chọn hoạt ảnh chuyển đơn: ${
                styleKey === 'ring' ? 'Vòng Xoay Vụ Mùa' :
                styleKey === 'minimal' ? 'Thanh Nổi Mini' :
                styleKey === 'slide' ? 'Trượt Thẻ Đơn' :
                styleKey === 'pulse' ? 'Hào Quang Nhịp Thở' : 'Tắt Hoạt Ảnh'
            }`,
            type: 'success'
        });
    };

    const handlePreviewOrderSwitch = (styleKey) => {
        setPreviewOrderSwitch({
            style: styleKey,
            title: styleKey === 'ring' ? 'Vòng Xoay Vụ Mùa' :
                   styleKey === 'minimal' ? 'Thanh Nổi Mini' :
                   styleKey === 'slide' ? 'Trượt Thẻ Đơn' :
                   styleKey === 'pulse' ? 'Hào Quang Nhịp Thở' : 'Tắt Hoạt Ảnh'
        });
    };

    useEffect(() => {
        if (!previewOrderSwitch) return;
        const timer = setTimeout(() => {
            setPreviewOrderSwitch(null);
        }, 2400);
        return () => clearTimeout(timer);
    }, [previewOrderSwitch]);

    const handleSave = async () => {
        setLoading(true);
        setMessage('');
        try {
            if (settings.app_font_family) {
                localStorage.setItem('app_font_family', settings.app_font_family);
                applyGlobalAppFont(settings.app_font_family);
                window.dispatchEvent(new CustomEvent('app_font_changed', { detail: { font: settings.app_font_family } }));
            }
            if (settings.ui_loading_style) {
                localStorage.setItem('ui_loading_style', settings.ui_loading_style);
                window.dispatchEvent(new CustomEvent('ui_loading_style_changed', { detail: settings.ui_loading_style }));
            }
            if (settings.pos_order_switch_animation) {
                localStorage.setItem('pos_order_switch_animation', settings.pos_order_switch_animation);
                window.dispatchEvent(new CustomEvent('pos_order_switch_anim_changed', { detail: settings.pos_order_switch_animation }));
            }
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
                    <h1 className="text-3xl md:text-4xl font-black text-primary tracking-tight flex items-center gap-3 pt-2 pb-0.5 leading-relaxed">
                        <SettingsIcon className="text-primary" size={32} />
                        CẤU HÌNH HỆ THỐNG
                    </h1>
                        <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-black uppercase rounded-lg tracking-tighter">LyangPOS Argon Engine</span>
                            <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                            <p className="text-[11px] font-bold text-gray-400 dark:text-gray-500">Quản trị & Cá nhân hóa vận hành POS</p>
                        </div>
                </div>
                <m.button
                    whileHover={{ scale: 1.02, y: -1 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleSave}
                    disabled={loading}
                    className="flex items-center gap-2 bg-primary hover:opacity-95 text-white px-6 py-3 rounded-xl font-black shadow-md shadow-primary/20 active:scale-95 disabled:opacity-50 transition-all uppercase text-[10px] tracking-[0.15em] border border-white/10 shrink-0 cursor-pointer"
                >
                    <Save size={14} />
                    {loading ? 'ĐANG LƯU...' : 'LƯU THAY ĐỔI'}
                </m.button>
            </div>

            {/* Compact Dashboard Container Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start relative z-10 flex-1 overflow-hidden">
                
                {/* Left Side Tab Navigation List */}
                <div className="lg:col-span-1 flex flex-col gap-2 bg-[var(--card-bg)] backdrop-blur-md p-2.5 rounded-3xl border border-[var(--border-color)] shadow-xs">
                    <div className="px-3.5 py-2 border-b border-[var(--border-color)] mb-0.5 flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Danh Mục Cài Đặt</span>
                        <span className="text-[9px] font-bold text-stone-400 dark:text-stone-500 font-mono">5 mục</span>
                    </div>
                    {TABS.map((tab) => {
                        const Icon = tab.icon;
                        const isSelected = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={cn(
                                    "flex items-center gap-3.5 p-3 rounded-2xl text-left transition-all duration-150 group cursor-pointer border",
                                    isSelected 
                                        ? "bg-primary/10 border-primary/35 shadow-xs" 
                                        : "border-transparent hover:bg-primary/5"
                                )}
                            >
                                <div className={cn(
                                    "w-10 h-10 rounded-xl transition-all duration-150 flex items-center justify-center shrink-0 shadow-xs",
                                    isSelected 
                                        ? "bg-primary text-white" 
                                        : "bg-stone-200/50 dark:bg-stone-800/60 text-stone-500 dark:text-stone-400 group-hover:bg-primary/10 group-hover:text-primary"
                                )}>
                                    <Icon size={18} />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className={cn(
                                        "text-xs font-black uppercase tracking-wider leading-tight mb-1 transition-colors duration-150",
                                        isSelected 
                                            ? "text-primary" 
                                            : "text-stone-700 dark:text-stone-300 group-hover:text-primary"
                                    )}>
                                        {tab.label}
                                    </p>
                                    <p className={cn(
                                        "text-[10px] font-medium line-clamp-1 leading-snug transition-colors duration-150",
                                        isSelected 
                                            ? "text-primary/75" 
                                            : "text-stone-400 dark:text-stone-500 group-hover:text-stone-600 dark:group-hover:text-stone-400"
                                    )}>
                                        {tab.desc}
                                    </p>
                                </div>
                                {isSelected && (
                                    <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0 mr-1" />
                                )}
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
                                    {/* Header: Clean & Themed */}
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-200/80 dark:border-stone-800">
                                        <div className="flex items-center gap-3.5">
                                            <div className="w-11 h-11 bg-emerald-500/15 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center text-[#2d5016] dark:text-emerald-400 border border-emerald-500/25 shadow-2xs">
                                                <Building size={22} />
                                            </div>
                                            <div>
                                                <h2 className="text-base md:text-lg font-black text-slate-800 dark:text-emerald-50 uppercase tracking-tight">Hồ sơ Trang trại & Ngân quỹ</h2>
                                                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-0.5">Thông tin nhận diện chứng từ hóa đơn, tài khoản QR Pay và Trí tuệ nhân tạo</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 self-start sm:self-auto">
                                            <span className="px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                                                Phiên bản Agri Edition
                                            </span>
                                        </div>
                                    </div>

                                    {/* TOP ROW: 2 Balanced Cards (Store Profile & Bank QR Pay) */}
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-stretch">
                                        {/* CARD 1: Store Information */}
                                        <div className="p-5 md:p-6 rounded-3xl border border-stone-300/60 dark:border-slate-800 bg-white/70 dark:bg-slate-900/50 shadow-xs flex flex-col justify-between space-y-4">
                                            <div>
                                                <div className="flex items-center justify-between pb-3 border-b border-stone-200/70 dark:border-slate-800/80 mb-4">
                                                    <h3 className="text-xs font-black uppercase tracking-wider text-[#2d5016] dark:text-emerald-400 flex items-center gap-2">
                                                        <div className="w-7 h-7 rounded-xl bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 flex items-center justify-center">
                                                            <Building size={14} />
                                                        </div>
                                                        <span>Thông Tin Cửa Hàng / Trang Trại</span>
                                                    </h3>
                                                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-lg bg-stone-200/60 dark:bg-slate-800 text-stone-600 dark:text-slate-400">
                                                        In trên hóa đơn
                                                    </span>
                                                </div>

                                                <div className="space-y-3.5">
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                        <div className="space-y-1">
                                                            <label className="text-[10px] font-black text-stone-600 dark:text-stone-400 uppercase tracking-wider ml-0.5">Tên Trang Trại / Đại lý</label>
                                                            <input
                                                                name="shop_name"
                                                                value={settings.shop_name}
                                                                onChange={handleChange}
                                                                placeholder="Ví dụ: Lyang Nghĩa"
                                                                className="w-full px-3.5 py-2.5 bg-white/80 dark:bg-slate-950/60 border border-stone-300/80 dark:border-slate-700 rounded-xl font-bold text-xs text-stone-900 dark:text-emerald-50 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 outline-none transition-all shadow-2xs placeholder:text-stone-400"
                                                            />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <label className="text-[10px] font-black text-stone-600 dark:text-stone-400 uppercase tracking-wider ml-0.5">Đường dây nóng (Hotline)</label>
                                                            <input
                                                                name="shop_phone"
                                                                value={settings.shop_phone}
                                                                onChange={handleChange}
                                                                placeholder="0xxx.xxx.xxx"
                                                                className="w-full px-3.5 py-2.5 bg-white/80 dark:bg-slate-950/60 border border-stone-300/80 dark:border-slate-700 rounded-xl font-bold text-xs font-mono text-stone-900 dark:text-emerald-50 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 outline-none transition-all shadow-2xs placeholder:text-stone-400"
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="space-y-1">
                                                        <label className="text-[10px] font-black text-stone-600 dark:text-stone-400 uppercase tracking-wider ml-0.5">Địa chỉ Canh Tác / Trụ sở</label>
                                                        <textarea
                                                            name="shop_address"
                                                            value={settings.shop_address}
                                                            onChange={handleChange}
                                                            rows="2"
                                                            placeholder="Địa chỉ giao dịch đầy đủ..."
                                                            className="w-full px-3.5 py-2.5 bg-white/80 dark:bg-slate-950/60 border border-stone-300/80 dark:border-slate-700 rounded-xl font-semibold text-xs text-stone-900 dark:text-emerald-50 resize-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 outline-none transition-all shadow-2xs placeholder:text-stone-400 leading-relaxed"
                                                        />
                                                    </div>

                                                    <div className="space-y-1">
                                                        <label className="text-[10px] font-black text-stone-600 dark:text-stone-400 uppercase tracking-wider ml-0.5">Danh mục Hãng / Thương hiệu (Cách nhau bằng dấu phẩy)</label>
                                                        <textarea
                                                            name="brands_directory"
                                                            value={settings.brands_directory || ''}
                                                            onChange={handleChange}
                                                            rows="2"
                                                            placeholder="Ví dụ: SYNGENTA, HỢP TRÍ, BAYER, VFC, SALA..."
                                                            className="w-full px-3.5 py-2.5 bg-white/80 dark:bg-slate-950/60 border border-stone-300/80 dark:border-slate-700 rounded-xl font-semibold text-xs text-stone-900 dark:text-emerald-50 resize-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 outline-none transition-all shadow-2xs placeholder:text-stone-400 leading-relaxed"
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="pt-2 text-[10px] text-stone-500 dark:text-slate-400 font-medium italic border-t border-stone-200/50 dark:border-slate-800">
                                                💡 Thông tin này sẽ tự động xuất hiện ở đầu hóa đơn in nhiệt / hóa đơn A4 và chứng từ kho.
                                            </div>
                                        </div>

                                        {/* CARD 2: Bank Account & QR Pay */}
                                        <div className="p-5 md:p-6 rounded-3xl border border-stone-300/60 dark:border-slate-800 bg-white/70 dark:bg-slate-900/50 shadow-xs flex flex-col justify-between space-y-4">
                                            <div>
                                                <div className="flex items-center justify-between pb-3 border-b border-stone-200/70 dark:border-slate-800/80 mb-4">
                                                    <h3 className="text-xs font-black uppercase tracking-wider text-[#2d5016] dark:text-emerald-400 flex items-center gap-2">
                                                        <div className="w-7 h-7 rounded-xl bg-amber-500/15 text-amber-700 dark:text-amber-300 flex items-center justify-center">
                                                            <CreditCard size={14} />
                                                        </div>
                                                        <span>Cấu hình Chuyển Khoản & QR Pay</span>
                                                    </h3>
                                                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20">
                                                        Quét mã thanh toán POS
                                                    </span>
                                                </div>

                                                {/* Virtual ATM Card Mock */}
                                                <div className="relative h-34 w-full bg-gradient-to-br from-[#173812] via-[#244b1c] to-[#0e250b] rounded-2xl p-4 text-white shadow-md shadow-emerald-950/20 overflow-hidden border border-white/10 flex flex-col justify-between mb-4 group">
                                                    <div className="absolute -right-12 -top-12 w-32 h-32 bg-emerald-400/15 rounded-full blur-xl group-hover:scale-110 transition-transform pointer-events-none" />
                                                    
                                                    <div className="flex justify-between items-start relative z-10">
                                                        <div>
                                                            <p className="text-[7.5px] font-black tracking-[0.25em] uppercase text-emerald-400/80">HỒ SƠ THANH TOÁN QR</p>
                                                            <p className="text-sm font-black tracking-wider uppercase mt-0.5 leading-none">{settings.shop_bank || 'CHƯA CHỌN NGÂN HÀNG'}</p>
                                                        </div>
                                                        <CreditCard size={18} className="text-emerald-300/80" />
                                                    </div>

                                                    <div className="relative z-10 my-0.5">
                                                        <p className="text-[7.5px] font-black uppercase text-emerald-300/50 tracking-wider">SỐ TÀI KHOẢN</p>
                                                        <p className="text-base md:text-lg font-black font-mono tracking-[0.12em] text-emerald-100 leading-none mt-0.5">{settings.shop_bank_account || '•••• •••• ••••'}</p>
                                                    </div>

                                                    <div className="flex justify-between items-end relative z-10">
                                                        <div>
                                                            <p className="text-[7px] font-black text-emerald-300/50 tracking-widest uppercase">CHỦ THỤ HƯỞNG</p>
                                                            <p className="text-[11px] font-black uppercase tracking-wider leading-none mt-0.5">{settings.shop_bank_user || 'TEN CHU TAI KHOAN'}</p>
                                                        </div>
                                                        <div className="px-2 py-0.5 bg-white/10 backdrop-blur-md rounded-md border border-white/15 text-[8px] font-black uppercase tracking-widest text-emerald-300">VIETQR PAY</div>
                                                    </div>
                                                </div>

                                                {/* Bank Input fields */}
                                                <div className="space-y-3">
                                                    <div className="space-y-1">
                                                        <label className="text-[10px] font-black text-stone-600 dark:text-stone-400 uppercase tracking-wider ml-0.5">Tên Ngân Hàng (Viết tắt)</label>
                                                        <input
                                                            name="shop_bank"
                                                            value={settings.shop_bank}
                                                            onChange={handleChange}
                                                            placeholder="Ví dụ: VietinBank, MB Bank, Vietcombank..."
                                                            className="w-full px-3.5 py-2.5 bg-white/80 dark:bg-slate-950/60 border border-stone-300/80 dark:border-slate-700 rounded-xl font-bold text-xs text-stone-900 dark:text-emerald-50 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 outline-none transition-all shadow-2xs placeholder:text-stone-400"
                                                        />
                                                    </div>
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                        <div className="space-y-1">
                                                            <label className="text-[10px] font-black text-stone-600 dark:text-stone-400 uppercase tracking-wider ml-0.5">Số Tài Khoản</label>
                                                            <input
                                                                name="shop_bank_account"
                                                                value={settings.shop_bank_account}
                                                                onChange={handleChange}
                                                                placeholder="Nhập số TK..."
                                                                className="w-full px-3.5 py-2.5 bg-white/80 dark:bg-slate-950/60 border border-stone-300/80 dark:border-slate-700 rounded-xl font-bold text-xs font-mono text-stone-900 dark:text-emerald-50 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 outline-none transition-all shadow-2xs placeholder:text-stone-400"
                                                            />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <label className="text-[10px] font-black text-stone-600 dark:text-stone-400 uppercase tracking-wider ml-0.5">Chủ Tài Khoản (Không dấu)</label>
                                                            <input
                                                                name="shop_bank_user"
                                                                value={settings.shop_bank_user}
                                                                onChange={handleChange}
                                                                placeholder="NGUYEN VAN A"
                                                                className="w-full px-3.5 py-2.5 bg-white/80 dark:bg-slate-950/60 border border-stone-300/80 dark:border-slate-700 rounded-xl font-bold text-xs uppercase text-stone-900 dark:text-emerald-50 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 outline-none transition-all shadow-2xs placeholder:text-stone-400"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="pt-2 text-[10px] text-stone-500 dark:text-slate-400 font-medium italic border-t border-stone-200/50 dark:border-slate-800">
                                                💡 Mã VietQR tạo ra từ tài khoản này sẽ hiển thị ở màn hình POS để khách quét chuyển tiền trực tiếp.
                                            </div>
                                        </div>
                                    </div>

                                    {/* BOTTOM ROW: Dedicated AI Intelligence Center (Full Width, 2 Columns) */}
                                    <div className="p-5 md:p-6 rounded-3xl border border-emerald-500/25 dark:border-emerald-500/30 bg-gradient-to-br from-emerald-500/[0.04] via-white/70 to-teal-500/[0.04] dark:from-slate-900/80 dark:via-slate-900/60 dark:to-emerald-950/30 shadow-xs space-y-4">
                                        {/* AI Header */}
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-emerald-500/15 dark:border-slate-800">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-700 text-white flex items-center justify-center shadow-sm shadow-emerald-700/25 shrink-0">
                                                    <Bot size={20} />
                                                </div>
                                                <div>
                                                    <h3 className="text-sm font-black uppercase tracking-wider text-slate-800 dark:text-emerald-300 flex items-center gap-2">
                                                        <span>Trung Tâm Trí Tuệ Nhân Tạo (Google Gemini AI)</span>
                                                    </h3>
                                                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                                                        Cấu hình mô hình thông minh & khóa API áp dụng đồng bộ cho toàn bộ hệ thống LyangPOS
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
                                                <span className="text-[10px] font-black px-2.5 py-1 rounded-xl bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                                                    ● Đang hoạt động toàn hệ thống
                                                </span>
                                                <span className="text-[10px] font-black px-2.5 py-1 rounded-xl bg-stone-200/60 dark:bg-slate-800 text-stone-700 dark:text-slate-300 border border-stone-300/60 dark:border-slate-700">
                                                    Xoay vòng 3 Key tự động
                                                </span>
                                            </div>
                                        </div>

                                        {/* 2-Column AI Grid: Left = Model Selector, Right = API Keys */}
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
                                            {/* Left: Model Selector & Fetch */}
                                            <div className="space-y-3 p-4 bg-white/70 dark:bg-slate-950/40 rounded-2xl border border-stone-200/80 dark:border-slate-800 shadow-2xs">
                                                <div className="flex items-center justify-between gap-2 flex-wrap">
                                                    <label className="text-[10px] font-black text-emerald-800 dark:text-emerald-300 uppercase tracking-widest flex items-center gap-1.5">
                                                        <Sparkles size={13} className="text-emerald-600 dark:text-emerald-400" />
                                                        <span>Mô hình đang áp dụng:</span>
                                                    </label>
                                                    <span className="text-[11px] text-slate-500 dark:text-slate-400 font-bold">
                                                        ({availableGeminiModels.length} models sẵn sàng)
                                                    </span>
                                                </div>

                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className="text-xs font-black text-emerald-800 dark:text-emerald-300 font-mono bg-emerald-500/15 px-3 py-1 rounded-xl border border-emerald-500/30 shadow-2xs">
                                                        {settings.gemini_selected_model || 'gemini-2.5-flash'}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={handleFetchGeminiModels}
                                                        disabled={isFetchingGeminiModels}
                                                        className="px-3.5 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 disabled:opacity-60 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-sm shadow-emerald-700/20 transition-all cursor-pointer whitespace-nowrap active:scale-95 ml-auto"
                                                    >
                                                        <RefreshCw size={13} className={cn(isFetchingGeminiModels && "animate-spin")} />
                                                        <span>{isFetchingGeminiModels ? 'Đang lấy từ Google...' : 'Lấy Danh Sách Model Mới Nhất'}</span>
                                                    </button>
                                                </div>

                                                {/* CustomSelect */}
                                                <div className="pt-1">
                                                    <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block mb-1">Chọn mô hình hoạt động:</label>
                                                    <CustomSelect
                                                        value={settings.gemini_selected_model || 'gemini-2.5-flash'}
                                                        onChange={(val) => {
                                                            const selectedVal = (val && typeof val === 'object' && val.target) ? val.target.value : val;
                                                            handleSelectGeminiModel(selectedVal);
                                                        }}
                                                        options={geminiModelOptions}
                                                        placeholder="Chọn mô hình Gemini..."
                                                        searchable={true}
                                                        searchPlaceholder="Tìm kiếm mô hình Gemini trong danh sách..."
                                                        className="w-full"
                                                        buttonClassName="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-stone-300/80 dark:border-slate-700 rounded-xl font-bold text-xs text-slate-900 dark:text-white focus:border-emerald-500 shadow-2xs"
                                                    />
                                                </div>

                                                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium italic pt-1 leading-relaxed">
                                                    💡 Khi chọn tại đây, toàn bộ hệ thống (Trợ lý AI, Quét HĐ nhập hàng, Tra cứu hoạt chất) sẽ tự động sử dụng mô hình này.
                                                </p>
                                            </div>

                                            {/* Right: 3 API Keys Inputs */}
                                            <div className="space-y-3 p-4 bg-white/70 dark:bg-slate-950/40 rounded-2xl border border-stone-200/80 dark:border-slate-800 shadow-2xs">
                                                <div className="space-y-1">
                                                    <div className="flex items-center justify-between">
                                                        <label className="text-[10px] font-black text-stone-600 dark:text-stone-400 uppercase tracking-wider ml-0.5">
                                                            🔑 Gemini API Key Chính (Key #1)
                                                        </label>
                                                        <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20">Ưu tiên 1</span>
                                                    </div>
                                                    <input
                                                        name="gemini_api_key"
                                                        type="password"
                                                        value={settings.gemini_api_key}
                                                        onChange={handleChange}
                                                        placeholder="Nhập Gemini API Key chính..."
                                                        className="w-full px-3.5 py-2.5 bg-white/90 dark:bg-slate-900 border border-stone-300/80 dark:border-slate-700 rounded-xl font-bold text-xs text-stone-900 dark:text-emerald-50 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 outline-none transition-all shadow-2xs font-mono"
                                                    />
                                                </div>

                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                    <div className="space-y-1">
                                                        <label className="text-[10px] font-black text-stone-600 dark:text-stone-400 uppercase tracking-wider ml-0.5">
                                                            🔑 Key Dự phòng 2 (Key #2)
                                                        </label>
                                                        <input
                                                            name="gemini_api_key_2"
                                                            type="password"
                                                            value={settings.gemini_api_key_2 || ''}
                                                            onChange={handleChange}
                                                            placeholder="Nhập Key dự phòng 2..."
                                                            className="w-full px-3.5 py-2.5 bg-white/90 dark:bg-slate-900 border border-stone-300/80 dark:border-slate-700 rounded-xl font-bold text-xs text-stone-900 dark:text-emerald-50 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 outline-none transition-all shadow-2xs font-mono"
                                                        />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className="text-[10px] font-black text-stone-600 dark:text-stone-400 uppercase tracking-wider ml-0.5">
                                                            🔑 Key Dự phòng 3 (Key #3)
                                                        </label>
                                                        <input
                                                            name="gemini_api_key_3"
                                                            type="password"
                                                            value={settings.gemini_api_key_3 || ''}
                                                            onChange={handleChange}
                                                            placeholder="Nhập Key dự phòng 3..."
                                                            className="w-full px-3.5 py-2.5 bg-white/90 dark:bg-slate-900 border border-stone-300/80 dark:border-slate-700 rounded-xl font-bold text-xs text-stone-900 dark:text-emerald-50 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 outline-none transition-all shadow-2xs font-mono"
                                                        />
                                                    </div>
                                                </div>

                                                <p className="text-[10px] text-stone-500 dark:text-slate-400 font-medium italic pt-1 leading-relaxed">
                                                    💡 Hệ thống tự động <strong>xoay vòng và kích hoạt key dự phòng</strong> nếu key chính hết hạn ngạch (Rate Limit/Quota), đảm bảo hoạt động liên tục 24/7.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* TAB CONTENT: NETWORK (Mạng & Đồng bộ LAN) */}
                            {activeTab === 'network' && (
                                <div className="space-y-6 animate-[fadeIn_0.2s_ease-out]">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-200/80 dark:border-stone-800">
                                        <div className="flex items-center gap-3.5">
                                            <div className="w-11 h-11 bg-emerald-500/15 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center text-[#2d5016] dark:text-emerald-400 border border-emerald-500/25 shadow-2xs">
                                                <Wifi size={22} />
                                            </div>
                                            <div>
                                                <h2 className="text-base font-black text-stone-800 dark:text-stone-100 uppercase tracking-wide">Quản lý mạng nội bộ LAN</h2>
                                                <p className="text-[11px] font-medium text-stone-500 dark:text-stone-400 mt-0.5">Kết nối nhiều thiết bị sử dụng chung cơ sở dữ liệu qua mạng LAN/Wifi</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Connectivity topology graphics - Themed Card */}
                                    <div className="p-5 bg-[#fbf9f5] dark:bg-stone-900/60 rounded-3xl border border-stone-200/80 dark:border-stone-800 relative overflow-hidden shadow-xs">
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center text-center relative z-10">
                                            <div className="p-3.5 bg-white dark:bg-stone-800/80 rounded-2xl border border-stone-200/60 dark:border-stone-700/60 flex flex-col items-center gap-1.5 shadow-2xs">
                                                <Laptop size={24} className="text-[#2d5016] dark:text-emerald-400" />
                                                <p className="text-[10px] font-black uppercase tracking-wider text-stone-500">Thiết bị A (Máy Chủ)</p>
                                                <p className="text-xs font-black font-mono text-[#2d5016] dark:text-emerald-400 leading-none">{localIpInfo.ip}:3579</p>
                                            </div>
                                            <div className="flex flex-col items-center justify-center text-[#2d5016]/50 dark:text-emerald-400/50 py-1">
                                                <span className="text-[9px] font-black uppercase tracking-widest text-[#2d5016]/60 dark:text-emerald-400/60 mb-1">MẠNG LAN / WIFI</span>
                                                <ArrowRight className="hidden md:block text-[#2d5016]/40 dark:text-emerald-400/40" size={18} />
                                            </div>
                                            <div className="p-3.5 bg-white dark:bg-stone-800/80 rounded-2xl border border-stone-200/60 dark:border-stone-700/60 flex flex-col items-center gap-1.5 shadow-2xs">
                                                <Smartphone size={24} className="text-[#2d5016] dark:text-emerald-400" />
                                                <p className="text-[10px] font-black uppercase tracking-wider text-stone-500">Thiết bị B (Máy Trạm)</p>
                                                <p className="text-xs font-black text-[#2d5016] dark:text-emerald-400 uppercase tracking-wider leading-none">{localStorage.getItem('server_ip') ? 'Đã kết nối' : 'Có thể kết nối'}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* 2-Column Balanced Setup Cards */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                                        {/* Card 1: Role Configuration */}
                                        <div className="p-6 bg-[#fbf9f5] dark:bg-stone-900/60 rounded-3xl border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-4">
                                            <div className="flex items-center gap-2.5 pb-3 border-b border-stone-200/60 dark:border-stone-800">
                                                <SettingsIcon size={16} className="text-[#2d5016] dark:text-emerald-400" />
                                                <h3 className="text-xs font-black uppercase tracking-wider text-stone-800 dark:text-stone-100">
                                                    Thiết lập Vai trò Thiết bị
                                                </h3>
                                            </div>
                                            
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider ml-0.5">
                                                    Vai trò thiết bị hiện tại
                                                </label>
                                                <CustomSelect
                                                    className="w-full"
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

                                            {localStorage.getItem('server_ip') !== null ? (
                                                <div className="space-y-2 pt-1 animate-in fade-in slide-in-from-top-4 duration-300">
                                                    <label className="text-[10px] font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider ml-0.5">
                                                        Địa chỉ IP Máy Chủ chính
                                                    </label>
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
                                                        className="w-full px-4 py-3 bg-white dark:bg-stone-800 border border-stone-200/80 dark:border-stone-700 rounded-2xl font-black text-xs font-mono text-stone-800 dark:text-emerald-50 focus:border-emerald-500 outline-none shadow-2xs"
                                                    />
                                                    <p className="text-[11px] text-stone-500 dark:text-stone-400 leading-relaxed">
                                                        Nhập địa chỉ IP của máy chủ LyangPOS trong mạng LAN để máy này kết nối và đồng bộ hóa đơn.
                                                    </p>
                                                </div>
                                            ) : (
                                                <div className="p-4 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-2xl border border-emerald-500/20 text-stone-600 dark:text-stone-400 text-xs leading-relaxed space-y-1.5">
                                                    <p className="font-bold text-[#2d5016] dark:text-emerald-400 flex items-center gap-1.5">
                                                        <Laptop size={14} /> Chế độ Máy Chủ Độc Lập
                                                    </p>
                                                    <p className="text-[11px] text-stone-500 dark:text-stone-400 leading-normal">
                                                        Máy này giữ cơ sở dữ liệu chính. Các máy trạm, điện thoại hoặc máy tính bảng kết nối qua địa chỉ IP LAN để bán hàng cùng lúc.
                                                    </p>
                                                </div>
                                            )}
                                        </div>

                                        {/* Card 2: Connection Status & Quick Actions */}
                                        <div className="p-6 bg-[#fbf9f5] dark:bg-stone-900/60 rounded-3xl border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-4">
                                            <div className="flex items-center justify-between pb-3 border-b border-stone-200/60 dark:border-stone-800">
                                                <div className="flex items-center gap-2.5">
                                                    <Activity size={16} className="text-[#2d5016] dark:text-emerald-400" />
                                                    <h3 className="text-xs font-black uppercase tracking-wider text-stone-800 dark:text-stone-100">
                                                        Trạng thái Kết nối
                                                    </h3>
                                                </div>
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold border border-emerald-500/20">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                                                    {localStorage.getItem('server_ip') === null ? "Máy Chủ Chính (Host)" : "Máy Trạm (Client)"}
                                                </span>
                                            </div>

                                            {localStorage.getItem('server_ip') === null ? (
                                                <div className="space-y-3.5">
                                                    <p className="text-xs font-medium text-stone-600 dark:text-stone-400">
                                                        Máy trạm kết nối tới máy này qua địa chỉ LAN nội bộ:
                                                    </p>

                                                    {/* IP Display Box */}
                                                    <div className="p-3.5 bg-white dark:bg-stone-800 rounded-2xl border border-stone-200/80 dark:border-stone-700 flex items-center justify-between shadow-2xs">
                                                        <span className="text-sm font-black font-mono text-[#2d5016] dark:text-emerald-300 tracking-tight">
                                                            http://{localIpInfo.ip}:3579
                                                        </span>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                navigator.clipboard.writeText(`http://${localIpInfo.ip}:3579`);
                                                                setToast({ message: 'Đã sao chép link kết nối!', type: 'success' });
                                                            }}
                                                            className="px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-[#2d5016] dark:text-emerald-300 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                                                        >
                                                            <Copy size={13} />
                                                            <span>Sao chép IP</span>
                                                        </button>
                                                    </div>

                                                    {/* Action Buttons */}
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                                                        <button
                                                            type="button"
                                                            onClick={handleUnlockFirewall}
                                                            disabled={unlockingFirewall}
                                                            className={cn(
                                                                "flex items-center justify-center gap-2 py-3 px-4 rounded-2xl font-bold text-xs shadow-xs transition-all cursor-pointer",
                                                                unlockingFirewall 
                                                                    ? "bg-emerald-500/20 text-emerald-600 cursor-wait" 
                                                                    : "bg-[#2d5016] hover:bg-[#3d6b20] text-white"
                                                            )}
                                                        >
                                                            <ShieldAlert size={14} />
                                                            <span>{unlockingFirewall ? "Đang mở..." : "Mở khóa tường lửa"}</span>
                                                        </button>
                                                        
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                const cmd = `New-NetFirewallRule -DisplayName "LyangPOS Server" -Direction Inbound -LocalPort 3579 -Protocol TCP -Action Allow -Profile Any -Force`;
                                                                navigator.clipboard.writeText(cmd);
                                                                setToast({ message: 'Đã sao chép lệnh PowerShell mở cổng 3579!', type: 'info' });
                                                            }}
                                                            className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-white dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-700/60 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700 font-bold text-xs transition-all cursor-pointer shadow-2xs"
                                                        >
                                                            <Copy size={13} />
                                                            <span>Sao chép PowerShell</span>
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="space-y-3.5">
                                                    <p className="text-xs font-medium text-stone-600 dark:text-stone-400">
                                                        Đang đồng bộ dữ liệu từ máy chủ chính:
                                                    </p>
                                                    <div className="p-3.5 bg-white dark:bg-stone-800 rounded-2xl border border-stone-200/80 dark:border-stone-700 text-center shadow-2xs">
                                                        <p className="text-sm font-black font-mono text-[#2d5016] dark:text-emerald-400">{localStorage.getItem('server_ip')}</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Connected Devices LAN Table - Full Width Card */}
                                    <div className="p-6 bg-[#fbf9f5] dark:bg-stone-900/60 rounded-3xl border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-4 text-left">
                                        <div className="flex items-center justify-between pb-3 border-b border-stone-200/60 dark:border-stone-800">
                                            <div className="flex items-center gap-2.5">
                                                <Laptop size={16} className="text-[#2d5016] dark:text-emerald-400" />
                                                <div>
                                                    <h3 className="text-xs font-black uppercase tracking-wider text-stone-800 dark:text-stone-100">
                                                        Các thiết bị đang kết nối mạng LAN
                                                    </h3>
                                                    <p className="text-[11px] font-medium text-stone-500 dark:text-stone-400 mt-0.5">
                                                        Tự động đồng bộ hóa đơn & tồn kho giữa máy chủ và các máy trạm bán hàng
                                                    </p>
                                                </div>
                                            </div>
                                            <span className="px-3 py-1 rounded-full bg-stone-200/60 dark:bg-stone-800 text-stone-600 dark:text-stone-300 font-mono text-[10px] font-bold">
                                                {activeDevices?.length || 0} thiết bị
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                                            {(!activeDevices || !Array.isArray(activeDevices) || activeDevices.length === 0) ? (
                                                <div className="col-span-full py-8 text-center text-stone-400 dark:text-stone-500 font-bold text-xs uppercase tracking-wider">
                                                    Đang quét thiết bị mạng LAN...
                                                </div>
                                            ) : (
                                                activeDevices.map((device, idx) => (
                                                    <div 
                                                        key={device.ip + idx}
                                                        className="flex items-center justify-between p-4 rounded-2xl border bg-white dark:bg-stone-800/80 border-stone-200/70 dark:border-stone-700 shadow-2xs hover:border-emerald-500/30 transition-all"
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div className={cn(
                                                                "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-2xs",
                                                                device.is_host
                                                                    ? "bg-emerald-500/15 text-[#2d5016] dark:text-emerald-400 border border-emerald-500/20"
                                                                    : "bg-blue-500/15 text-blue-700 dark:text-blue-400 border border-blue-500/20"
                                                            )}>
                                                                {device.is_host ? <Laptop size={18} /> : <Smartphone size={18} />}
                                                            </div>
                                                            <div>
                                                                <div className="flex items-center gap-2">
                                                                    <p className="text-xs font-black text-stone-800 dark:text-stone-100 leading-none">{device.label}</p>
                                                                    <span className={cn(
                                                                        "px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider leading-none",
                                                                        device.is_host 
                                                                            ? "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/20" 
                                                                            : "bg-blue-500/15 text-blue-800 dark:text-blue-300 border border-blue-500/20"
                                                                    )}>
                                                                        {device.is_host ? "Máy chủ" : "Máy trạm"}
                                                                    </span>
                                                                </div>
                                                                <p className="text-[11px] font-bold font-mono text-stone-400 mt-1">{device.ip}</p>
                                                            </div>
                                                        </div>
                                                        
                                                        <div className="text-right flex flex-col items-end gap-1">
                                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold">
                                                                <span className="relative flex h-2 w-2">
                                                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                                                </span>
                                                                Online
                                                            </span>
                                                            <p className="text-[10px] font-medium text-stone-400 font-mono">
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
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-200/80 dark:border-stone-800">
                                        <div className="flex items-center gap-3.5">
                                            <div className="w-11 h-11 bg-emerald-500/15 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center text-[#2d5016] dark:text-emerald-400 border border-emerald-500/25 shadow-2xs">
                                                <Database size={22} />
                                            </div>
                                            <div>
                                                <h2 className="text-base font-black text-stone-800 dark:text-stone-100 uppercase tracking-wide">Quản trị Cơ sở dữ liệu</h2>
                                                <p className="text-[11px] font-medium text-stone-500 dark:text-stone-400 mt-0.5">Tải tệp sao lưu, phục hồi dữ liệu, tối ưu hóa và dọn dẹp hệ thống</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Live Stats Cards Grid */}
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        <div className="p-4.5 bg-[#fbf9f5] dark:bg-stone-900/60 rounded-2xl border border-stone-200/80 dark:border-stone-800 shadow-xs flex flex-col justify-between min-h-[90px]">
                                            <span className="text-[10px] font-black text-stone-500 dark:text-stone-400 uppercase tracking-wider">Dung lượng Cơ sở dữ liệu</span>
                                            <div className="flex items-baseline gap-1 mt-2">
                                                <span className="text-2xl font-black text-[#2d5016] dark:text-emerald-400 tracking-tight">{dbStats?.db_size_mb || 0}</span>
                                                <span className="text-[10px] font-black text-[#2d5016]/60 dark:text-emerald-500 uppercase">MB</span>
                                            </div>
                                        </div>
                                        <div className="p-4.5 bg-[#fbf9f5] dark:bg-stone-900/60 rounded-2xl border border-stone-200/80 dark:border-stone-800 shadow-xs flex flex-col justify-between min-h-[90px]">
                                            <span className="text-[10px] font-black text-stone-500 dark:text-stone-400 uppercase tracking-wider">Tổng số đơn hàng đã bán</span>
                                            <span className="text-2xl font-black text-[#2d5016] dark:text-emerald-400 tracking-tight mt-2">{dbStats?.orders || 0}</span>
                                        </div>
                                        <div className="p-4.5 bg-[#fbf9f5] dark:bg-stone-900/60 rounded-2xl border border-stone-200/80 dark:border-stone-800 shadow-xs flex flex-col justify-between min-h-[90px]">
                                            <span className="text-[10px] font-black text-stone-500 dark:text-stone-400 uppercase tracking-wider">Máy chủ dịch vụ</span>
                                            <div className="mt-2 flex">
                                                <span className="px-3 py-1 bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 text-[10px] font-black rounded-lg uppercase tracking-wider border border-emerald-500/20 shadow-2xs">
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

                                                {/* Chốt Sổ Năm & Lưu Trữ Dữ Liệu Cũ */}
                                                <div className="p-4 bg-gradient-to-br from-emerald-500/10 via-[#2d5016]/5 to-[#4a7c59]/10 dark:bg-emerald-950/20 rounded-2xl border border-emerald-500/25 dark:border-emerald-800/40 shadow-inner">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <Archive size={14} className="text-[#2d5016] dark:text-emerald-400" />
                                                        <h4 className="text-[10px] font-black text-[#2d5016] dark:text-emerald-300 uppercase tracking-wider">Chốt sổ năm tài chính & Kết chuyển số dư</h4>
                                                    </div>
                                                    <p className="text-[9px] font-bold text-gray-500 dark:text-slate-400 mt-1 leading-normal uppercase">
                                                        Đóng gói lưu trữ an toàn dữ liệu năm cũ, tự động kết chuyển công nợ, tồn kho và số dư quỹ tiền mặt sang năm mới.
                                                    </p>
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowArchiveModal(true)}
                                                        className="w-full mt-3.5 flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-emerald-700 to-[#2d5016] hover:from-emerald-800 hover:to-[#203c0e] text-white rounded-xl font-black text-[10px] uppercase tracking-[0.15em] shadow-sm transition-all active:scale-95 border border-white/10"
                                                    >
                                                        <Archive size={14} /> CHỐT SỔ NĂM & LÀM MỚI DATABASE
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
                                        <div className="flex items-center gap-1.5 p-1.5 bg-stone-200/60 dark:bg-stone-900/80 rounded-2xl border border-stone-300/40 dark:border-stone-800 self-start sm:self-auto overflow-x-auto no-scrollbar">
                                            {[
                                                { id: 'sidebar', label: 'Menu Sidebar', icon: Layers, desc: 'Ẩn/hiện các trang' },
                                                { id: 'icons', label: 'Tùy biến Icon', icon: Edit3, desc: 'Đổi icon toàn app' },
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
                                                            "flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold text-xs uppercase tracking-wider transition-all shrink-0 cursor-pointer",
                                                            isActive
                                                                ? "bg-[#2d5016] text-white dark:bg-emerald-600 shadow-xs"
                                                                : "text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-white/5"
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

                                    {/* SUBTAB: ICONS CUSTOMIZER */}
                                    {uiSubTab === 'icons' && (
                                        <div className="space-y-6 animate-[fadeIn_0.2s_ease-out]">
                                            <div className="p-6 bg-gradient-to-br from-amber-500/10 via-amber-600/5 to-transparent dark:from-amber-950/30 dark:via-slate-900 rounded-3xl border border-amber-500/30 space-y-4">
                                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                                    <div>
                                                        <h3 className="text-base font-black uppercase tracking-tight text-slate-800 dark:text-amber-300 flex items-center gap-2">
                                                            <Edit3 size={18} className="text-amber-500" />
                                                            Hệ Thống Tùy Biến Icon Toàn Diện
                                                        </h3>
                                                        <p className="text-xs text-slate-600 dark:text-slate-400 font-medium mt-1">
                                                            Cho phép click chọn và thay đổi bất kỳ icon nào trên Sidebar, Nút Bấm POS, Đơn Nhập Hàng, Lịch sử...
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={toggleEditMode}
                                                            className={cn(
                                                                "px-4 py-2.5 rounded-2xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2 shadow-sm cursor-pointer",
                                                                editMode
                                                                    ? "bg-amber-500 text-white shadow-amber-500/30 animate-pulse"
                                                                    : "bg-[#2d5016] hover:bg-[#3d6b20] dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white"
                                                            )}
                                                        >
                                                            <Edit3 size={15} />
                                                            <span>{editMode ? "Đang Bật Edit Mode (Alt+I)" : "Bật Chế Độ Sửa Icon (Alt+I)"}</span>
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                if (window.confirm("Khôi phục toàn bộ icon về mặc định gốc?")) {
                                                                    resetIcons();
                                                                    setToast({ message: "Đã khôi phục toàn bộ icon về mặc định", type: "info" });
                                                                }
                                                            }}
                                                            className="px-3.5 py-2.5 rounded-2xl border border-rose-500/30 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 font-bold text-xs uppercase tracking-wider transition-all cursor-pointer"
                                                        >
                                                            Đặt Lại Mặc Định
                                                        </button>
                                                    </div>
                                                </div>

                                                <div className="p-4 bg-white/70 dark:bg-slate-900/60 rounded-2xl border border-amber-500/20 text-xs space-y-2">
                                                    <div className="font-bold text-slate-800 dark:text-slate-200">
                                                        💡 Cách sử dụng linh hoạt:
                                                    </div>
                                                    <ul className="list-disc list-inside space-y-1 text-slate-600 dark:text-slate-400">
                                                        <li><strong>Cách 1:</strong> Bấm phím tắt <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 font-mono font-bold text-amber-600">Alt + I</kbd> ở bất kỳ đâu trên màn hình, hoặc bấm chuột phải chọn <em>"Tùy biến Icon"</em>. Khi đó các icon có thể đổi sẽ phát sáng viền vàng, bạn chỉ cần bấm vào để chọn icon mới!</li>
                                                        <li><strong>Cách 2:</strong> Vào trang <em>Menu Sidebar</em> bên cạnh để đổi nhanh icon từng trang và từng nhóm danh mục.</li>
                                                    </ul>
                                                </div>

                                                {/* Danh sách các icon đã tùy chỉnh */}
                                                <div className="pt-2">
                                                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-3 flex items-center justify-between">
                                                        <span>
                                                            Danh sách Icon Đã Tùy Chỉnh ({
                                                                Object.keys(customIcons).filter(k => k.startsWith('icon.') || !customIcons[`icon.${k}`]).length
                                                            })
                                                        </span>
                                                    </h4>
                                                    {Object.keys(customIcons).length === 0 ? (
                                                        <div className="p-6 text-center rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 text-slate-400 text-xs">
                                                            Hiện tại tất cả icon đang sử dụng mặc định ban đầu.
                                                        </div>
                                                    ) : (
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                                                            {Object.entries(customIcons)
                                                                .filter(([id]) => id.startsWith('icon.') || !customIcons[`icon.${id}`])
                                                                .map(([id, config]) => {
                                                                    const iconName = typeof config === 'object' && config !== null ? config.name : config;
                                                                    const strokeWidth = typeof config === 'object' && config !== null && config.strokeWidth != null ? config.strokeWidth : null;
                                                                    const IconPreview = iconName ? getLucideIconComponent(iconName) : null;
                                                                    const displayName = id.replace(/^icon\./, '');

                                                                    return (
                                                                        <div key={id} className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 shadow-xs">
                                                                            <div className="flex items-center gap-2.5 min-w-0">
                                                                                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 dark:bg-emerald-500/20 text-[#2d5016] dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20">
                                                                                    {IconPreview ? <IconPreview size={18} strokeWidth={strokeWidth || 2} /> : <Sparkles size={16} />}
                                                                                </div>
                                                                                <div className="min-w-0">
                                                                                    <div className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate" title={id}>{displayName}</div>
                                                                                    <div className="text-[10px] text-amber-600 dark:text-amber-400 font-mono truncate">
                                                                                        {iconName || 'Chưa đặt'} {strokeWidth ? `(${strokeWidth}px)` : ''}
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => {
                                                                                    updateIcon(id, null);
                                                                                    setToast({ message: `Đã khôi phục icon mặc định cho "${displayName}"`, type: "info" });
                                                                                }}
                                                                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors shrink-0 cursor-pointer"
                                                                                title="Khôi phục mặc định cho icon này"
                                                                            >
                                                                                <Trash2 size={13} />
                                                                            </button>
                                                                        </div>
                                                                    );
                                                                })}
                                                        </div>
                                                    )}
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
                                                        <div className="space-y-3 p-3.5 mt-2 bg-white/70 dark:bg-slate-900/70 rounded-xl border border-emerald-900/10 dark:border-slate-700/80">
                                                            {/* Chọn Icon con trỏ chuột từ Icon Picker */}
                                                            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-stone-200/60 dark:border-slate-800">
                                                                <div className="flex items-center gap-3">
                                                                    <div 
                                                                        className="w-10 h-10 rounded-xl bg-emerald-500/10 dark:bg-slate-800 border border-emerald-500/20 flex items-center justify-center shrink-0 shadow-xs relative"
                                                                        style={{ color: settings.ui_custom_cursor_color || '#10b981' }}
                                                                    >
                                                                        {settings.ui_custom_cursor_icon ? (
                                                                            (() => {
                                                                                const CursorIconComp = getLucideIconComponent(settings.ui_custom_cursor_icon);
                                                                                return CursorIconComp ? (
                                                                                    <CursorIconComp size={Math.min(26, Math.max(16, parseInt(settings.ui_custom_cursor_icon_size || '24', 10)))} strokeWidth={2.2} />
                                                                                ) : (
                                                                                    <Sparkles size={20} />
                                                                                );
                                                                            })()
                                                                        ) : (
                                                                            <div 
                                                                                className="w-3.5 h-3.5 rounded-full"
                                                                                style={{ 
                                                                                    backgroundColor: settings.ui_custom_cursor_color || '#10b981',
                                                                                    boxShadow: settings.ui_custom_cursor_glow_enabled !== 'false' ? '0 0 10px currentColor' : 'none'
                                                                                }}
                                                                            />
                                                                        )}
                                                                    </div>
                                                                    <div>
                                                                        <div className="text-[11px] font-black uppercase text-gray-800 dark:text-slate-100 tracking-wider">
                                                                            {settings.ui_custom_cursor_icon ? `Icon: ${settings.ui_custom_cursor_icon}` : 'Chấm tròn phát sáng (Mặc định)'}
                                                                        </div>
                                                                        <div className="text-[9.5px] text-gray-400 font-medium">
                                                                            {settings.ui_custom_cursor_icon 
                                                                                ? 'Con trỏ hiển thị theo icon đã chọn từ kho icon của ứng dụng'
                                                                                : 'Chấm tròn laser di chuyển mượt mà cùng vòng sáng'}
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                <div className="flex items-center gap-2">
                                                                    <button
                                                                        type="button"
                                                                        onClick={(e) => {
                                                                            const rect = e.currentTarget.getBoundingClientRect();
                                                                            setCursorPickerTarget({
                                                                                id: 'pos_cursor_icon',
                                                                                label: 'Con trỏ chuột tùy biến (Custom Cursor)',
                                                                                currentIconName: settings.ui_custom_cursor_icon || localStorage.getItem('pos_cursor_icon') || '',
                                                                                currentStrokeWidth: 2,
                                                                                anchorRect: {
                                                                                    top: rect.top,
                                                                                    bottom: rect.bottom,
                                                                                    left: rect.left,
                                                                                    right: rect.right,
                                                                                    width: rect.width,
                                                                                    height: rect.height
                                                                                }
                                                                            });
                                                                        }}
                                                                        className="px-3 py-1.5 rounded-xl bg-[#2d5016] hover:bg-[#3a6320] active:scale-95 text-white text-[11px] font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                                                                    >
                                                                        <Sparkles size={13} />
                                                                        <span>{settings.ui_custom_cursor_icon ? 'Đổi icon khác' : 'Chọn icon từ thư viện'}</span>
                                                                    </button>

                                                                    {settings.ui_custom_cursor_icon && (
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => {
                                                                                updateSetting('ui_custom_cursor_icon', '');
                                                                                localStorage.removeItem('pos_cursor_icon');
                                                                                window.dispatchEvent(new Event('storage'));
                                                                                window.dispatchEvent(new Event('cursor_icon_changed'));
                                                                                setToast({ message: 'Đã đặt lại con trỏ chấm tròn mặc định', type: 'info' });
                                                                            }}
                                                                            className="px-2.5 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-white/10 dark:hover:bg-white/15 text-stone-600 dark:text-slate-300 active:scale-95 text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1"
                                                                            title="Về lại chấm tròn mặc định"
                                                                        >
                                                                            <RotateCcw size={12} />
                                                                            <span>Mặc định</span>
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            {/* Kích thước Icon con trỏ chuột (khi có chọn icon) */}
                                                            {settings.ui_custom_cursor_icon && (
                                                                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-stone-200/60 dark:border-slate-800">
                                                                    <span className="text-[11px] font-black uppercase text-gray-700 dark:text-slate-200 tracking-wider">
                                                                        Kích thước Icon con trỏ
                                                                    </span>
                                                                    <div className="flex items-center gap-1.5">
                                                                        {[
                                                                            { size: '18', label: '18px (Nhỏ)' },
                                                                            { size: '22', label: '22px (Vừa)' },
                                                                            { size: '26', label: '26px (Lớn)' },
                                                                            { size: '32', label: '32px (Rất lớn)' }
                                                                        ].map(s => {
                                                                            const isChosen = (settings.ui_custom_cursor_icon_size || '24') === s.size;
                                                                            return (
                                                                                <button
                                                                                    key={s.size}
                                                                                    type="button"
                                                                                    onClick={() => {
                                                                                        updateSetting('ui_custom_cursor_icon_size', s.size);
                                                                                        localStorage.setItem('pos_cursor_icon_size', s.size);
                                                                                        window.dispatchEvent(new Event('storage'));
                                                                                        window.dispatchEvent(new Event('cursor_icon_changed'));
                                                                                    }}
                                                                                    className={cn(
                                                                                        "px-2.5 py-1 rounded-lg text-[10.5px] font-bold transition-all cursor-pointer",
                                                                                        isChosen
                                                                                            ? "bg-[#2d5016] text-white shadow-xs"
                                                                                            : "bg-stone-100 hover:bg-stone-200 dark:bg-white/5 dark:hover:bg-white/10 text-stone-700 dark:text-slate-300"
                                                                                    )}
                                                                                >
                                                                                    {s.label}
                                                                                </button>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {/* Bật / Tắt vòng tròn hào quang bên ngoài (Follower Ring) */}
                                                            <div className="flex items-center justify-between pb-3 border-b border-stone-200/60 dark:border-slate-800">
                                                                <div className="flex items-center gap-2.5">
                                                                    <div className="w-5 h-5 rounded-full border-2 border-emerald-500/60 dark:border-emerald-400/60 flex items-center justify-center shrink-0">
                                                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400" />
                                                                    </div>
                                                                    <div>
                                                                        <div className="text-[11px] font-black uppercase text-gray-700 dark:text-slate-200 tracking-wider">
                                                                            Vòng tròn hào quang bên ngoài (Follower Ring)
                                                                        </div>
                                                                        <div className="text-[9.5px] text-gray-400 font-medium">
                                                                            Vòng sáng lướt bám theo sau con trỏ (có thể tắt để chỉ giữ icon/chấm)
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        const currentEnabled = settings.ui_custom_cursor_ring_enabled !== 'false';
                                                                        const newVal = currentEnabled ? 'false' : 'true';
                                                                        updateSetting('ui_custom_cursor_ring_enabled', newVal);
                                                                        localStorage.setItem('pos_cursor_ring_disabled', newVal === 'true' ? 'false' : 'true');
                                                                        window.dispatchEvent(new Event('storage'));
                                                                        window.dispatchEvent(new Event('cursor_ring_changed'));
                                                                    }}
                                                                    className={cn(
                                                                        "w-11 h-6 rounded-full transition-colors relative p-0.5 cursor-pointer shrink-0",
                                                                        settings.ui_custom_cursor_ring_enabled !== 'false' ? "bg-[#2d5016]" : "bg-gray-300 dark:bg-slate-700"
                                                                    )}
                                                                >
                                                                    <div className={cn(
                                                                        "w-5 h-5 rounded-full bg-white transition-transform shadow-xs",
                                                                        settings.ui_custom_cursor_ring_enabled !== 'false' ? "translate-x-[20px]" : "translate-x-0"
                                                                    )} />
                                                                </button>
                                                            </div>

                                                            {/* Bật / Tắt hiệu ứng phát sáng neon (Cursor Glow) */}
                                                            <div className="flex items-center justify-between pb-3 border-b border-stone-200/60 dark:border-slate-800">
                                                                <div className="flex items-center gap-2.5">
                                                                    <div className="w-5 h-5 rounded-full bg-emerald-500/20 dark:bg-emerald-400/20 flex items-center justify-center shrink-0">
                                                                        <Sparkles size={12} className="text-emerald-600 dark:text-emerald-400" />
                                                                    </div>
                                                                    <div>
                                                                        <div className="text-[11px] font-black uppercase text-gray-700 dark:text-slate-200 tracking-wider">
                                                                            Hiệu ứng phát sáng & bóng mờ (Cursor Glow)
                                                                        </div>
                                                                        <div className="text-[9.5px] text-gray-400 font-medium">
                                                                            Tắt để con trỏ sắc nét, gọn gàng và không tỏa quầng sáng neon
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        const currentEnabled = settings.ui_custom_cursor_glow_enabled !== 'false';
                                                                        const newVal = currentEnabled ? 'false' : 'true';
                                                                        updateSetting('ui_custom_cursor_glow_enabled', newVal);
                                                                        localStorage.setItem('pos_cursor_glow_disabled', newVal === 'true' ? 'false' : 'true');
                                                                        window.dispatchEvent(new Event('storage'));
                                                                        window.dispatchEvent(new Event('cursor_glow_changed'));
                                                                    }}
                                                                    className={cn(
                                                                        "w-11 h-6 rounded-full transition-colors relative p-0.5 cursor-pointer shrink-0",
                                                                        settings.ui_custom_cursor_glow_enabled !== 'false' ? "bg-[#2d5016]" : "bg-gray-300 dark:bg-slate-700"
                                                                    )}
                                                                >
                                                                    <div className={cn(
                                                                        "w-5 h-5 rounded-full bg-white transition-transform shadow-xs",
                                                                        settings.ui_custom_cursor_glow_enabled !== 'false' ? "translate-x-[20px]" : "translate-x-0"
                                                                    )} />
                                                                </button>
                                                            </div>

                                                            {/* Màu sắc con trỏ chuột */}
                                                            <div className="flex flex-wrap items-center justify-between gap-3 pt-0.5">
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
                                                                                "w-6 h-6 rounded-full transition-all duration-200 border-2 relative hover:scale-110 shadow-sm cursor-color-btn",
                                                                                (settings.ui_custom_cursor_color || '#10b981') === c.color ? "border-transparent ring-2 ring-emerald-500 ring-offset-2 ring-offset-transparent scale-110" : "border-transparent"
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
                                                        </div>
                                                    )}

                                                    <div className="flex items-center justify-between p-4 bg-emerald-50/20 dark:bg-slate-800/40 rounded-xl border border-emerald-900/5 dark:border-slate-700 group hover:border-[#4a7c59]/20 transition-all">
                                                        <div className="flex items-center gap-3 min-w-0">
                                                            <div className="w-9 h-9 bg-transparent dark:bg-slate-900 rounded-lg flex items-center justify-center text-[#2d5016] dark:text-emerald-400 shrink-0">
                                                                <Sparkles size={18} />
                                                            </div>
                                                            <div className="min-w-0">
                                                                <div className="text-xs font-black text-gray-800 dark:text-slate-100 uppercase tracking-wide leading-none">Mascot Toàn Trang (Page Mascot)</div>
                                                                <div className="text-[8px] font-bold text-gray-400 uppercase tracking-widest truncate mt-1">Dõi theo chuột, kéo thả tự do & tương tác cảm xúc</div>
                                                            </div>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => window.dispatchEvent(new CustomEvent('lyang_open_mascot_settings'))}
                                                            className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-[11px] font-bold shadow-sm transition-all cursor-pointer"
                                                        >
                                                            Tùy chỉnh Mascot
                                                        </button>
                                                    </div>

                                                    <div className="flex items-center justify-between p-4 bg-emerald-50/20 dark:bg-slate-800/40 rounded-xl border border-emerald-900/5 dark:border-slate-700 group hover:border-[#4a7c59]/20 transition-all">
                                                        <div className="flex items-center gap-3 min-w-0">
                                                            <div className="w-9 h-9 bg-transparent dark:bg-slate-900 rounded-lg flex items-center justify-center text-[#7D8B6E] dark:text-[#AFC1A0] shrink-0">
                                                                <Leaf size={18} />
                                                            </div>
                                                            <div className="min-w-0">
                                                                <div className="text-xs font-black text-gray-800 dark:text-slate-100 uppercase tracking-wide leading-none flex items-center gap-2">
                                                                    <span>Trang trí Tự Do (Decorations)</span>
                                                                    <span className="text-[8px] font-black px-1.5 py-0.5 rounded-full bg-[#7D8B6E] text-white">Alt + D</span>
                                                                </div>
                                                                <div className="text-[8px] font-bold text-gray-400 uppercase tracking-widest truncate mt-1">Kéo thả chậu cây, cành lá tự do lên màn hình POS / Dashboard</div>
                                                            </div>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => window.dispatchEvent(new CustomEvent('toggle_page_decorations_mode', { detail: { action: 'open', openPalette: true } }))}
                                                            className="px-3 py-1.5 rounded-xl bg-[#7D8B6E] hover:bg-[#6C7B5D] text-white text-[11px] font-bold shadow-sm transition-all cursor-pointer"
                                                        >
                                                            Mở kho Decor 🪴
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
                                                            <div className="w-9 h-9 bg-transparent dark:bg-slate-900 rounded-lg flex items-center justify-center text-[#2d5016] dark:text-emerald-400 shrink-0">
                                                                <Shield size={18} />
                                                            </div>
                                                            <div className="min-w-0">
                                                                <div className="text-xs font-black text-gray-800 dark:text-slate-100 uppercase tracking-wide leading-none">Bảo vệ đơn cũ (Khóa sửa POS)</div>
                                                                <div className="text-[8px] font-bold text-gray-400 uppercase tracking-widest truncate mt-1">Khi xem lại đơn cũ sẽ khóa chỉnh sửa, yêu cầu bấm nút 'Sửa đơn'</div>
                                                            </div>
                                                        </div>
                                                        <button
                                                            onClick={() => {
                                                                const isCurrentOn = localStorage.getItem('pos_protect_past_orders') !== 'false';
                                                                const newVal = isCurrentOn ? 'false' : 'true';
                                                                localStorage.setItem('pos_protect_past_orders', newVal);
                                                                window.dispatchEvent(new Event('storage'));
                                                                setToast({
                                                                    message: newVal === 'true' ? "Đã BẬT bảo vệ đơn cũ (cần bấm Sửa đơn)" : "Đã TẮT bảo vệ đơn cũ (cho phép sửa trực tiếp)",
                                                                    type: "success"
                                                                });
                                                            }}
                                                            className={cn(
                                                                "relative w-10 h-5.5 rounded-full transition-all duration-300 outline-none shrink-0 border border-emerald-900/10 dark:border-slate-600",
                                                                (localStorage.getItem('pos_protect_past_orders') !== 'false') ? "bg-[#2d5016]" : "bg-slate-200 dark:bg-slate-700"
                                                            )}
                                                        >
                                                            <div className={cn(
                                                                "absolute top-[2px] left-[2px] w-4 h-4 bg-white dark:bg-emerald-100 rounded-full transition-all duration-300 shadow-md",
                                                                (localStorage.getItem('pos_protect_past_orders') !== 'false') ? "translate-x-[18px]" : "translate-x-0"
                                                            )} />
                                                        </button>
                                                    </div>

                                                    <div className="flex items-center justify-between p-4 bg-emerald-50/20 dark:bg-slate-800/40 rounded-xl border border-emerald-900/5 dark:border-slate-700 group hover:border-[#4a7c59]/20 transition-all">
                                                        <div className="flex items-center gap-3 min-w-0">
                                                            <div className="w-9 h-9 bg-transparent dark:bg-slate-900 rounded-lg flex items-center justify-center text-[#2d5016] dark:text-emerald-400 shrink-0">
                                                                <Layout size={18} />
                                                            </div>
                                                            <div className="min-w-0">
                                                                <div className="text-xs font-black text-gray-800 dark:text-slate-100 uppercase tracking-wide leading-none">Tự động vào Bảng tin (Dashboard)</div>
                                                                <div className="text-[8px] font-bold text-gray-400 uppercase tracking-widest truncate mt-1">Mở trang Bảng tin sau khi đăng nhập thay vì chuyển thẳng vào POS</div>
                                                            </div>
                                                        </div>
                                                        <button
                                                            onClick={async () => {
                                                                const isCurrentOn = (settings.pos_default_landing_page !== 'pos' && localStorage.getItem('pos_default_landing_page') !== 'pos');
                                                                
                                                                if (!isCurrentOn) {
                                                                    // User wants to turn ON -> Prompt for admin security password
                                                                    setPasswordPrompt({
                                                                        title: "Xác thực bảo mật",
                                                                        message: "Vui lòng nhập mật khẩu quản trị để cấp quyền tự động vào Bảng tin (Dashboard)",
                                                                        onConfirm: async (enteredPassword) => {
                                                                            if (enteredPassword !== '0607@Nghia') {
                                                                                setPasswordPrompt(null);
                                                                                setToast({ message: "Mật khẩu không chính xác!", type: "error" });
                                                                                return;
                                                                            }
                                                                            setPasswordPrompt(null);
                                                                            const newVal = 'dashboard';
                                                                            updateSetting('pos_default_landing_page', newVal);
                                                                            localStorage.setItem('pos_default_landing_page', newVal);
                                                                            window.dispatchEvent(new Event('storage'));
                                                                            try {
                                                                                const syncChan = new BroadcastChannel('pos_data_sync');
                                                                                syncChan.postMessage({ type: 'UI_SETTING_UPDATED', key: 'pos_default_landing_page', value: newVal });
                                                                                syncChan.close();
                                                                            } catch (err) {}
                                                                            try {
                                                                                await axios.post('/api/settings', { pos_default_landing_page: newVal });
                                                                            } catch (err) {
                                                                                console.error('Lỗi khi lưu cài đặt landing page:', err);
                                                                            }
                                                                            setToast({ message: "Đã bật tự động vào Bảng tin Dashboard", type: "success" });
                                                                        }
                                                                    });
                                                                } else {
                                                                    // Turn OFF
                                                                    const newVal = 'pos';
                                                                    updateSetting('pos_default_landing_page', newVal);
                                                                    localStorage.setItem('pos_default_landing_page', newVal);
                                                                    window.dispatchEvent(new Event('storage'));
                                                                    try {
                                                                        const syncChan = new BroadcastChannel('pos_data_sync');
                                                                        syncChan.postMessage({ type: 'UI_SETTING_UPDATED', key: 'pos_default_landing_page', value: newVal });
                                                                        syncChan.close();
                                                                    } catch (err) {}
                                                                    try {
                                                                        await axios.post('/api/settings', { pos_default_landing_page: newVal });
                                                                    } catch (err) {
                                                                        console.error('Lỗi khi lưu cài đặt landing page:', err);
                                                                    }
                                                                    setToast({ message: "Đã chuyển về mặc định vào Bán hàng POS", type: "info" });
                                                                }
                                                            }}
                                                            className={cn(
                                                                "relative w-10 h-5.5 rounded-full transition-all duration-300 outline-none shrink-0 border border-emerald-900/10 dark:border-slate-600",
                                                                (settings.pos_default_landing_page !== 'pos' && localStorage.getItem('pos_default_landing_page') !== 'pos') ? "bg-[#2d5016]" : "bg-slate-200 dark:bg-slate-700"
                                                            )}
                                                        >
                                                            <div className={cn(
                                                                "absolute top-[2px] left-[2px] w-4 h-4 bg-white dark:bg-emerald-100 rounded-full transition-all duration-300 shadow-md",
                                                                (settings.pos_default_landing_page !== 'pos' && localStorage.getItem('pos_default_landing_page') !== 'pos') ? "translate-x-[18px]" : "translate-x-0"
                                                            )} />
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Global App Font Settings Card - Perfectly consistent with System & Mascot */}
                                                <div className="p-4 bg-emerald-50/20 dark:bg-slate-800/40 rounded-xl border border-emerald-900/5 dark:border-slate-700 space-y-3 text-left">
                                                    <div className="flex items-center justify-between gap-3">
                                                        <div className="flex items-center gap-3 min-w-0">
                                                            <div className="w-9 h-9 bg-transparent dark:bg-slate-900 rounded-lg flex items-center justify-center text-[#2d5016] dark:text-emerald-400 shrink-0">
                                                                <Type size={18} />
                                                            </div>
                                                            <div className="min-w-0">
                                                                <div className="text-xs font-black text-gray-800 dark:text-slate-100 uppercase tracking-wide leading-none flex items-center gap-1.5">
                                                                    <span>Font chữ toàn hệ thống App</span>
                                                                    <span className="text-[8px] font-black px-1.5 py-0.2 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 rounded">150+ FONTS</span>
                                                                </div>
                                                                <div className="text-[8px] font-bold text-gray-400 uppercase tracking-widest truncate mt-1">
                                                                    Áp dụng font chữ Google Fonts cho toàn bộ giao diện POS & App
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => setShowAppFontModal(true)}
                                                            className="px-3.5 py-2 bg-[#2d5016] dark:bg-emerald-600 text-white rounded-xl font-black text-[9.5px] uppercase tracking-wider shadow-sm hover:brightness-110 active:scale-95 transition-all shrink-0"
                                                        >
                                                            Kho font Tiếng Việt 🔍
                                                        </button>
                                                    </div>

                                                    <div className="flex items-center justify-between pt-2 border-t border-emerald-900/5 dark:border-slate-700/50">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Đang áp dụng:</span>
                                                            <span className="text-xs font-black text-[#2d5016] dark:text-emerald-400 px-2 py-0.5 bg-emerald-100/50 dark:bg-emerald-900/30 rounded-md">
                                                                {settings.app_font_family || 'Be Vietnam Pro'}
                                                            </span>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                const defaultFont = 'Be Vietnam Pro';
                                                                updateSetting('app_font_family', defaultFont);
                                                                localStorage.setItem('app_font_family', defaultFont);
                                                                applyGlobalAppFont(defaultFont);
                                                                window.dispatchEvent(new CustomEvent('app_font_changed', { detail: { font: defaultFont } }));
                                                                setToast({ message: 'Đã đặt lại font mặc định: Be Vietnam Pro', type: 'info' });
                                                            }}
                                                            className="text-[9px] font-bold text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 uppercase tracking-wider underline transition-colors"
                                                        >
                                                            Đặt lại mặc định
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

                                            {/* Loading Screen Style Selector Card */}
                                        <div className="p-5 bg-emerald-50/20 dark:bg-slate-800/40 rounded-2xl border border-emerald-900/10 dark:border-slate-700/80 space-y-4 text-left shadow-xs">
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-emerald-900/10 dark:border-slate-700/60">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-emerald-100/60 dark:bg-slate-900 rounded-xl flex items-center justify-center text-[#2d5016] dark:text-emerald-400 shrink-0 shadow-inner">
                                                        <Loader2 size={20} className="text-[#2d5016] dark:text-emerald-400" />
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <h4 className="text-xs font-black text-gray-800 dark:text-slate-100 uppercase tracking-wide leading-none">
                                                                Kiểu Màn hình Tải (Loading Screen)
                                                            </h4>
                                                            <span className="text-[8px] font-black px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 rounded-full tracking-wider uppercase">
                                                                Tùy chọn UI/UX
                                                            </span>
                                                        </div>
                                                        <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mt-1">
                                                            Chọn phong cách màn hình chờ khi khởi động hoặc tải dữ liệu lớn
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 text-[10px] font-bold text-gray-500 dark:text-slate-400">
                                                    <span>Đang chọn:</span>
                                                    <span className="font-black text-[#2d5016] dark:text-emerald-400 uppercase bg-emerald-100/70 dark:bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-900/10 dark:border-emerald-500/20">
                                                        {settings.ui_loading_style === 'ring'
                                                            ? 'Vòng Xoay Vụ Mùa'
                                                            : settings.ui_loading_style === 'minimal' 
                                                                ? 'Thẻ Tối Giản' 
                                                                : settings.ui_loading_style === 'compact' 
                                                                    ? 'Thanh nổi Mini' 
                                                                    : 'Sinh động & Hoạt họa'}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Style Selector Cards */}
                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 pt-1">
                                                {[
                                                    {
                                                        id: 'ring',
                                                        title: 'Vòng Xoay Vụ Mùa',
                                                        tag: 'Thiết kế mới • Siêu nhẹ',
                                                        tagColor: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
                                                        desc: 'Vòng xoay kép nét đứt, icon squircle sắc nét, phối chữ LYANG POS hai màu & capsule trạng thái bo tròn. Đúng chuẩn thiết kế mẫu.',
                                                        icon: RotateCw,
                                                        features: ['Vòng xoay nét đứt kép', 'Thanh capsule bo tròn', 'Nhẹ mượt không tốn GPU']
                                                    },
                                                    {
                                                        id: 'minimal',
                                                        title: 'Thẻ Tối Giản',
                                                        tag: 'Khuyên dùng • 60 FPS',
                                                        tagColor: 'bg-teal-100 dark:bg-teal-900/40 text-teal-800 dark:text-teal-300 border-teal-200 dark:border-teal-800',
                                                        desc: 'Thiết kế card trung tâm tinh gọn, vòng xoay SVG mượt mà, không dùng hiệu ứng mờ (blur). Giảm tối đa tải CPU/GPU, chuyển cảnh tức thì.',
                                                        icon: Zap,
                                                        features: ['Không giật lag máy yếu', 'Tiết kiệm CPU/RAM', 'Chuyển cảnh tức thì']
                                                    },
                                                    {
                                                        id: 'compact',
                                                        title: 'Thanh nổi Mini',
                                                        tag: 'Siêu gọn nhẹ',
                                                        tagColor: 'bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800',
                                                        desc: 'Thanh thông báo trạng thái nổi mini dạng viên thuốc (floating pill). Nhỏ gọn, không che khuất màn hình làm việc.',
                                                        icon: Layout,
                                                        features: ['Không che màn hình', 'Dạng thanh pill nổi', 'Tối giản tuyệt đối']
                                                    },
                                                    {
                                                        id: 'vibrant',
                                                        title: 'Sinh động (Hoạt họa)',
                                                        tag: 'Đầy đủ hiệu ứng',
                                                        tagColor: 'bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800',
                                                        desc: 'Mascot xoay 3D, vòng xoay quỹ đạo hạt phát sáng và nền mesh gradient chuyển động. Phù hợp máy tính để bàn cấu hình cao.',
                                                        icon: Sparkles,
                                                        features: ['Hiệu ứng hạt vũ trụ', 'Mascot 3D chuyển động', 'Nền Gradient đa tầng']
                                                    }
                                                ].map((item) => {
                                                    const isSelected = (settings.ui_loading_style || 'ring') === item.id;
                                                    const ItemIcon = item.icon;
                                                    return (
                                                        <div
                                                            key={item.id}
                                                            onClick={() => handleLoadingStyleSelect(item.id)}
                                                            className={cn(
                                                                "relative p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between group",
                                                                isSelected
                                                                    ? "bg-white dark:bg-slate-900/90 border-[#2d5016] dark:border-emerald-500 shadow-md ring-2 ring-[#2d5016]/20 dark:ring-emerald-500/20"
                                                                    : "bg-white/60 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 hover:border-emerald-600/40 hover:bg-white dark:hover:bg-slate-900"
                                                            )}
                                                        >
                                                            <div>
                                                                <div className="flex items-center justify-between gap-2 mb-2">
                                                                    <div className="flex items-center gap-2">
                                                                        <div className={cn(
                                                                            "w-7 h-7 rounded-lg flex items-center justify-center transition-colors",
                                                                            isSelected 
                                                                                ? "bg-[#2d5016] text-white dark:bg-emerald-600" 
                                                                                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 group-hover:text-emerald-600"
                                                                        )}>
                                                                            <ItemIcon size={14} />
                                                                        </div>
                                                                        <span className="text-xs font-black text-gray-800 dark:text-slate-100 uppercase tracking-tight">
                                                                            {item.title}
                                                                        </span>
                                                                    </div>
                                                                    {isSelected ? (
                                                                        <div className="w-5 h-5 rounded-full bg-[#2d5016] dark:bg-emerald-500 text-white flex items-center justify-center shadow-xs">
                                                                            <CheckCircle size={12} />
                                                                        </div>
                                                                    ) : (
                                                                        <div className="w-5 h-5 rounded-full border-2 border-slate-300 dark:border-slate-700" />
                                                                    )}
                                                                </div>

                                                                <div className="mb-2">
                                                                    <span className={cn("text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border", item.tagColor)}>
                                                                        {item.tag}
                                                                    </span>
                                                                </div>

                                                                <p className="text-[10px] text-gray-600 dark:text-slate-400 leading-relaxed min-h-[42px]">
                                                                    {item.desc}
                                                                </p>

                                                                <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 space-y-1">
                                                                    {item.features.map((feat, idx) => (
                                                                        <div key={idx} className="flex items-center gap-1.5 text-[9px] font-bold text-gray-500 dark:text-slate-400">
                                                                            <span className="w-1 h-1 rounded-full bg-emerald-500" />
                                                                            <span>{feat}</span>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>

                                                            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
                                                                <button
                                                                    type="button"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handlePreviewLoading(item.id);
                                                                    }}
                                                                    className="w-full py-1.5 px-3 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:hover:bg-emerald-900/60 text-[#2d5016] dark:text-emerald-300 font-black text-[10px] uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all active:scale-95 border border-emerald-900/10 dark:border-emerald-500/20 cursor-pointer"
                                                                >
                                                                    <Eye size={12} />
                                                                    <span>Xem thử hiệu ứng</span>
                                                                </button>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        {/* SECTION 2: HOẠT ẢNH QUAY LẠI ĐƠN TRƯỚC (POS ORDER SWITCH ANIMATION) */}
                                        <div className="space-y-4 pt-6 border-t border-slate-200/80 dark:border-white/10">
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-emerald-100/60 dark:bg-slate-900 rounded-xl flex items-center justify-center text-[#2d5016] dark:text-emerald-400 shrink-0 shadow-inner">
                                                        <RotateCcw size={20} className="text-[#2d5016] dark:text-emerald-400" />
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <h4 className="text-xs font-black text-gray-800 dark:text-slate-100 uppercase tracking-wide leading-none">
                                                                Hoạt Ảnh Quay Lại Đơn Trước (POS)
                                                            </h4>
                                                            <span className="text-[8px] font-black px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 rounded-full tracking-wider uppercase">
                                                                Chuyển đơn POS
                                                            </span>
                                                        </div>
                                                        <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mt-1">
                                                            Hiệu ứng hiển thị khi bấm "Đơn trước" hoặc duyệt lại lịch sử hóa đơn tại màn hình thu ngân
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 text-[10px] font-bold text-gray-500 dark:text-slate-400">
                                                    <span>Đang chọn:</span>
                                                    <span className="font-black text-[#2d5016] dark:text-emerald-400 uppercase bg-emerald-100/70 dark:bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-900/10 dark:border-emerald-500/20">
                                                        {settings.pos_order_switch_animation === 'ring'
                                                            ? 'Vòng Xoay Vụ Mùa'
                                                            : settings.pos_order_switch_animation === 'minimal' 
                                                                ? 'Thanh Nổi Mini' 
                                                                : settings.pos_order_switch_animation === 'slide' 
                                                                    ? 'Trượt Thẻ Đơn' 
                                                                    : settings.pos_order_switch_animation === 'pulse' 
                                                                        ? 'Hào Quang Nhịp Thở' 
                                                                        : 'Tắt Hoạt Ảnh'}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Style Selector Cards */}
                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-1">
                                                {[
                                                    {
                                                        id: 'ring',
                                                        title: 'Vòng Xoay Vụ Mùa',
                                                        tag: 'Mặc định • Chuẩn mẫu',
                                                        tagColor: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
                                                        desc: 'Vòng xoay kép nét đứt xanh lục & hạt mầm, logo LyangPOS ở tâm, kèm thanh capsule "Đang đồng bộ dữ liệu...". Đúng thiết kế người dùng yêu cầu.',
                                                        icon: RotateCw,
                                                        features: ['Vòng đứt kép xanh ngọc', 'Logo LyangPOS ở tâm', 'Capsule bo tròn đẹp mắt']
                                                    },
                                                    {
                                                        id: 'minimal',
                                                        title: 'Thanh Nổi Mini',
                                                        tag: 'Không che màn hình',
                                                        tagColor: 'bg-teal-100 dark:bg-teal-900/40 text-teal-800 dark:text-teal-300 border-teal-200 dark:border-teal-800',
                                                        desc: 'Viên thuốc bo tròn nổi nhẹ góc trên giỏ hàng, spinner mini êm dịu, không che khuất danh sách sản phẩm hay làm gián đoạn tầm nhìn thu ngân.',
                                                        icon: Layout,
                                                        features: ['Dạng floating capsule', 'Không che màn hình giỏ', 'Siêu nhẹ & tinh gọn']
                                                    },
                                                    {
                                                        id: 'slide',
                                                        title: 'Trượt Thẻ Đơn',
                                                        tag: 'Mượt mà • 60 FPS',
                                                        tagColor: 'bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800',
                                                        desc: 'Banner gradient ngọc lục bảo trượt ngang nhịp nhàng cùng biểu tượng mũi tên lùi đơn, tạo cảm giác chuyển lật trang tự nhiên, trực quan.',
                                                        icon: ChevronLeft,
                                                        features: ['Trượt slide ngang mượt', 'Hiển thị chiều chuyển đơn', 'Banner bo tròn sang trọng']
                                                    },
                                                    {
                                                        id: 'pulse',
                                                        title: 'Hào Quang Nhịp Thở',
                                                        tag: 'Phát sáng viền',
                                                        tagColor: 'bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800',
                                                        desc: 'Viền phát sáng nhịp thở nhẹ nhàng quanh khung giỏ hàng kèm vòng tròn neon tinh gọn, cực kỳ thanh lịch và êm dịu cho mắt khi làm việc ca tối.',
                                                        icon: Sparkles,
                                                        features: ['Viền phát sáng nhịp thở', 'Neon ping hiệu ứng nhẹ', 'Không làm chói mắt']
                                                    },
                                                    {
                                                        id: 'none',
                                                        title: 'Tắt Hoạt Ảnh',
                                                        tag: '0 Delay • Tức thì',
                                                        tagColor: 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700',
                                                        desc: 'Không hiển thị màn hình chờ hay hoạt ảnh nào. Dữ liệu nạp tức thì vào bảng ngay khi nhấp, tối ưu cho máy cấu hình yếu hoặc thu ngân cần tốc độ cao.',
                                                        icon: Zap,
                                                        features: ['Không có độ trễ hiệu ứng', 'Tối ưu máy cấu hình thấp', 'Nạp dữ liệu tức thì']
                                                    }
                                                ].map((item) => {
                                                    const isSelected = (settings.pos_order_switch_animation || 'ring') === item.id;
                                                    const ItemIcon = item.icon;
                                                    return (
                                                        <div
                                                            key={item.id}
                                                            onClick={() => handleOrderSwitchAnimSelect(item.id)}
                                                            className={cn(
                                                                "relative p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between group",
                                                                isSelected
                                                                    ? "bg-white dark:bg-slate-900/90 border-[#2d5016] dark:border-emerald-500 shadow-md ring-2 ring-[#2d5016]/20 dark:ring-emerald-500/20"
                                                                    : "bg-white/60 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 hover:border-emerald-600/40 hover:bg-white dark:hover:bg-slate-900"
                                                            )}
                                                        >
                                                            <div>
                                                                <div className="flex items-center justify-between gap-1.5 mb-2">
                                                                    <div className="flex items-center gap-1.5 min-w-0">
                                                                        <div className={cn(
                                                                            "w-6 h-6 rounded-lg flex items-center justify-center transition-colors shrink-0",
                                                                            isSelected 
                                                                                ? "bg-[#2d5016] text-white dark:bg-emerald-600" 
                                                                                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 group-hover:text-emerald-600"
                                                                        )}>
                                                                            <ItemIcon size={13} />
                                                                        </div>
                                                                        <span className="text-[11px] font-black text-gray-800 dark:text-slate-100 uppercase tracking-tight truncate">
                                                                            {item.title}
                                                                        </span>
                                                                    </div>
                                                                    {isSelected ? (
                                                                        <div className="w-4 h-4 rounded-full bg-[#2d5016] dark:bg-emerald-500 text-white flex items-center justify-center shadow-xs shrink-0">
                                                                            <CheckCircle size={10} />
                                                                        </div>
                                                                    ) : (
                                                                        <div className="w-4 h-4 rounded-full border-2 border-slate-300 dark:border-slate-700 shrink-0" />
                                                                    )}
                                                                </div>

                                                                <div className="mb-2">
                                                                    <span className={cn("text-[7.5px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md border", item.tagColor)}>
                                                                        {item.tag}
                                                                    </span>
                                                                </div>

                                                                <p className="text-[9.5px] text-gray-600 dark:text-slate-400 leading-relaxed min-h-[44px]">
                                                                    {item.desc}
                                                                </p>

                                                                <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/80 space-y-1">
                                                                    {item.features.map((feat, idx) => (
                                                                        <div key={idx} className="flex items-center gap-1 text-[8.5px] font-bold text-gray-500 dark:text-slate-400">
                                                                            <span className="w-1 h-1 rounded-full bg-emerald-500 shrink-0" />
                                                                            <span className="truncate">{feat}</span>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>

                                                            <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
                                                                <button
                                                                    type="button"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handlePreviewOrderSwitch(item.id);
                                                                    }}
                                                                    className="w-full py-1.5 px-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:hover:bg-emerald-900/60 text-[#2d5016] dark:text-emerald-300 font-black text-[9.5px] uppercase tracking-wider flex items-center justify-center gap-1 transition-all active:scale-95 border border-emerald-900/10 dark:border-emerald-500/20 cursor-pointer"
                                                                >
                                                                    <Eye size={11} />
                                                                    <span>Xem thử</span>
                                                                </button>
                              </div>
                                                        </div>
                                                    );
                                                })}
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
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-200/80 dark:border-stone-800">
                                        <div className="flex items-center gap-3.5">
                                            <div className="w-11 h-11 bg-emerald-500/15 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center text-[#2d5016] dark:text-emerald-400 border border-emerald-500/25 shadow-2xs">
                                                <Keyboard size={22} />
                                            </div>
                                            <div>
                                                <h2 className="text-base font-black text-stone-800 dark:text-stone-100 uppercase tracking-wide">Cấu hình phím tắt thao tác nhanh</h2>
                                                <p className="text-[11px] font-medium text-stone-500 dark:text-stone-400 mt-0.5">Tự do thay đổi các phím nóng để thực hiện giao dịch nhanh tại màn hình bán hàng (POS)</p>
                                            </div>
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

            {showAppFontModal && (
                <GoogleFontPickerModal
                    isOpen={showAppFontModal}
                    onClose={() => setShowAppFontModal(false)}
                    currentFont={settings.app_font_family}
                    onSelectFont={(selectedFont) => {
                        updateSetting('app_font_family', selectedFont);
                        localStorage.setItem('app_font_family', selectedFont);
                        applyGlobalAppFont(selectedFont);
                        window.dispatchEvent(new CustomEvent('app_font_changed', { detail: { font: selectedFont } }));
                        setToast({ message: `Đã áp dụng font ${selectedFont} cho toàn bộ app!`, type: 'success' });
                    }}
                />
            )}

            {/* Live Preview Loading Overlay */}
            <LoadingOverlay
                isVisible={!!previewLoading}
                style={previewLoading?.style}
                message={previewLoading?.message}
                onDismiss={() => setPreviewLoading(null)}
            />

            {/* Live Preview Order Switch Overlay */}
            {previewOrderSwitch && (
                <div 
                    className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-[fadeIn_0.15s_ease-out]"
                    onClick={() => setPreviewOrderSwitch(null)}
                >
                    <div 
                        className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl border border-emerald-500/40 overflow-hidden shadow-2xl p-5 flex flex-col gap-3"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                            <div className="flex items-center gap-2">
                                <RotateCcw size={16} className="text-[#2d5016] dark:text-emerald-400" />
                                <span className="text-xs font-black uppercase text-[#2d5016] dark:text-emerald-400">
                                    Xem thử hoạt ảnh: {previewOrderSwitch.title}
                                </span>
                            </div>
                            <button 
                                type="button"
                                onClick={() => setPreviewOrderSwitch(null)}
                                className="text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 px-2 py-1 rounded-lg cursor-pointer"
                            >
                                Đóng
                            </button>
                        </div>
                        <div className="relative h-56 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-950/80 border border-slate-200/80 dark:border-white/10 flex items-center justify-center">
                            <OrderSwitchOverlay 
                                isVisible={true} 
                                style={previewOrderSwitch.style} 
                                direction="prev" 
                                message="Đang đồng bộ dữ liệu..." 
                                isAbsolute={true}
                            />
                        </div>
                        <p className="text-[10px] text-center text-slate-400 italic">
                            {previewOrderSwitch.style === 'none' 
                                ? 'Chế độ tắt: Dữ liệu nạp tức thì mà không hiển thị khung chờ' 
                                : 'Hiệu ứng hiển thị trong giỏ hàng POS khi bấm "Đơn trước"'}
                        </p>
                    </div>
                </div>
            )}
            {/* Year-End Archive Modal */}
            <YearEndArchiveModal
                isOpen={showArchiveModal}
                onClose={() => setShowArchiveModal(false)}
                onSuccess={(data) => {
                    setToast({
                        message: data?.message || "Đã chốt sổ và lưu trữ năm thành công!",
                        type: "success"
                    });
                }}
            />

            {/* Custom Cursor Icon Picker Modal */}
            <IconPickerModal
                isOpen={Boolean(cursorPickerTarget)}
                onClose={() => setCursorPickerTarget(null)}
                target={cursorPickerTarget || {
                    id: 'pos_cursor_icon',
                    label: 'Con trỏ chuột tùy biến (Custom Cursor)',
                    currentIconName: settings.ui_custom_cursor_icon || localStorage.getItem('pos_cursor_icon') || '',
                    currentStrokeWidth: 2
                }}
                onSelectIcon={(_, iconData) => {
                    const iconName = iconData?.name || '';
                    updateSetting('ui_custom_cursor_icon', iconName);
                    localStorage.setItem('pos_cursor_icon', iconName);
                    window.dispatchEvent(new Event('storage'));
                    window.dispatchEvent(new Event('cursor_icon_changed'));
                    setToast({ message: `Đã chọn icon con trỏ chuột: ${iconName}`, type: 'success' });
                }}
                onResetIcon={() => {
                    updateSetting('ui_custom_cursor_icon', '');
                    localStorage.removeItem('pos_cursor_icon');
                    window.dispatchEvent(new Event('storage'));
                    window.dispatchEvent(new Event('cursor_icon_changed'));
                    setToast({ message: 'Đã đặt lại con trỏ chấm tròn mặc định', type: 'info' });
                }}
            />
            </div>
        </div>
    );
}
