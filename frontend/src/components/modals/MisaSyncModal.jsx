import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Cloud,
    Key,
    Building2,
    Database,
    CheckCircle2,
    AlertCircle,
    X,
    Loader2,
    RefreshCw,
    Save,
    ExternalLink,
    HelpCircle,
    Eye,
    EyeOff,
    Check,
    Layers,
    Calendar
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { cn } from '../../lib/utils';
import { createPortal } from 'react-dom';

const getTodayStr = () => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
};

const getLastMonthEndStr = () => {
    const d = new Date();
    const lastDay = new Date(d.getFullYear(), d.getMonth(), 0);
    const yyyy = lastDay.getFullYear();
    const mm = String(lastDay.getMonth() + 1).padStart(2, '0');
    const dd = String(lastDay.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
};

export default function MisaSyncModal({ isOpen, onClose, onSyncSuccess }) {
    const [config, setConfig] = useState({
        api_url: 'https://actapp.misa.vn',
        app_id: '',
        access_code: '',
        org_company_code: '',
        branch_id: '',
        stock_code: '',
        to_date: getTodayStr()
    });

    const [stocks, setStocks] = useState([]);
    const [loadingStocks, setLoadingStocks] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [loadingConfig, setLoadingConfig] = useState(false);
    const [testing, setTesting] = useState(false);
    const [testResult, setTestResult] = useState(null); // { success: boolean, message: string }
    const [syncing, setSyncing] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (isOpen) {
            loadConfig();
            setTestResult(null);
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [isOpen]);

    const loadConfig = async () => {
        setLoadingConfig(true);
        try {
            const res = await axios.get('/api/misa/config');
            if (res.data) {
                const loaded = {
                    api_url: res.data.api_url || 'https://actapp.misa.vn',
                    app_id: res.data.app_id || '',
                    access_code: res.data.access_code || '',
                    org_company_code: res.data.org_company_code || '',
                    branch_id: res.data.branch_id || '',
                    stock_code: res.data.stock_code || '',
                    to_date: getTodayStr()
                };
                setConfig(prev => ({
                    ...prev,
                    ...loaded
                }));
                if (loaded.app_id && loaded.access_code) {
                    handleFetchStocks(loaded, true);
                }
            }
        } catch {
            // Fallback to localStorage if backend config endpoint is not yet available
            const saved = localStorage.getItem('misa_amis_config');
            if (saved) {
                try {
                    const parsed = JSON.parse(saved);
                    setConfig(prev => ({ ...prev, ...parsed, to_date: getTodayStr() }));
                    if (parsed.app_id && parsed.access_code) {
                        handleFetchStocks(parsed, true);
                    }
                } catch (e) {
                    console.error("Error reading localStorage misa config", e);
                }
            }
        } finally {
            setLoadingConfig(false);
        }
    };

    const handleFetchStocks = async (cfgToUse = null, silent = false) => {
        const c = cfgToUse || config;
        if (!c.app_id?.trim() || !c.access_code?.trim()) {
            if (!silent) toast.error("Vui lòng nhập App ID và Access Code để tải danh sách kho!");
            return;
        }

        setLoadingStocks(true);
        try {
            // 1. Try backend endpoint
            try {
                const res = await axios.post('/api/misa/stocks', c);
                if (res.data && res.data.success && Array.isArray(res.data.stocks)) {
                    setStocks(res.data.stocks);
                    if (!silent) toast.success(`Đã tải ${res.data.stocks.length} kho từ MISA!`);
                    return res.data.stocks;
                }
            } catch (backendErr) {
                console.warn("Backend stocks fetch failed, trying direct client fetch:", backendErr);
            }

            // 2. Direct client fallback
            const baseUrl = (c.api_url || 'https://actapp.misa.vn').replace(/\/+$/, '');
            const connectRes = await axios.post(`${baseUrl}/api/oauth/actopen/connect`, {
                app_id: c.app_id.trim(),
                access_code: c.access_code.trim(),
                org_company_code: c.org_company_code?.trim() || ''
            });

            if (!connectRes.data?.Success) {
                throw new Error(connectRes.data?.ErrorMessage || "MISA từ chối kết nối");
            }

            let token = null;
            const rawConn = connectRes.data.Data;
            if (typeof rawConn === 'string') {
                try {
                    const parsed = JSON.parse(rawConn);
                    token = parsed.access_token || parsed.AccessToken || parsed.token || rawConn;
                } catch {
                    token = rawConn;
                }
            } else if (typeof rawConn === 'object' && rawConn) {
                token = rawConn.access_token || rawConn.AccessToken || rawConn.token;
            }

            if (!token) throw new Error("Không nhận được token từ MISA");

            const dictRes = await axios.post(`${baseUrl}/apir/sync/actopen/get_dictionary`, {
                app_id: c.app_id.trim(),
                data_type: 3,
                branch_id: c.branch_id?.trim() || null,
                skip: 0,
                take: 100,
                last_sync_time: null
            }, {
                headers: {
                    'X-MISA-AccessToken': token,
                    'Content-Type': 'application/json'
                }
            });

            if (!dictRes.data?.Success) {
                throw new Error(dictRes.data?.ErrorMessage || "Không thể lấy danh mục kho từ MISA");
            }

            let dataArr = [];
            const rawData = dictRes.data?.Data;
            if (typeof rawData === 'string') {
                try {
                    dataArr = JSON.parse(rawData) || [];
                } catch {
                    dataArr = [];
                }
            } else if (Array.isArray(rawData)) {
                dataArr = rawData;
            }

            const parsedStocks = dataArr.map(s => ({
                stock_id: s.stock_id || s.StockId || '',
                stock_code: (s.stock_code || s.StockCode || '').trim(),
                stock_name: (s.stock_name || s.StockName || '').trim(),
                inactive: Boolean(s.inactive ?? s.Inactive)
            })).filter(s => s.stock_code);

            setStocks(parsedStocks);
            if (!silent) toast.success(`Đã tải ${parsedStocks.length} kho từ MISA!`);
            return parsedStocks;
        } catch (err) {
            console.error("Fetch stocks error:", err);
            const msg = err.response?.data?.error || err.message || "Không thể tải danh sách kho từ MISA";
            if (!silent) toast.error(msg);
        } finally {
            setLoadingStocks(false);
        }
    };

    const handleSaveConfig = async (silent = false) => {
        setSaving(true);
        localStorage.setItem('misa_amis_config', JSON.stringify(config));
        try {
            await axios.post('/api/misa/config', config);
            if (!silent) toast.success("Đã lưu cấu hình kết nối MISA thành công!");
            return true;
        } catch (error) {
            console.warn("Backend save config failed, stored in localStorage:", error);
            if (!silent) toast.success("Đã lưu cấu hình vào máy!");
            return true;
        } finally {
            setSaving(false);
        }
    };

    const handleTestConnection = async () => {
        if (!config.app_id?.trim() || !config.access_code?.trim()) {
            toast.error("Vui lòng nhập App ID và Access Code của MISA");
            return;
        }

        setTesting(true);
        setTestResult(null);

        try {
            // 1. Try backend API first
            try {
                const res = await axios.post('/api/misa/test-connection', config);
                if (res.data && res.data.success) {
                    setTestResult({
                        success: true,
                        message: res.data.message || "Kết nối MISA AMIS Kế toán thành công!"
                    });
                    toast.success("Kết nối MISA AMIS thành công!");
                    handleSaveConfig(true);
                    handleFetchStocks(config, true);
                    return;
                }
            } catch (backendErr) {
                // If backend returned specific error message, inspect it
                if (backendErr.response?.data?.error) {
                    throw new Error(backendErr.response.data.error);
                }
                console.warn("Backend test failed, trying direct call:", backendErr);
            }

            // 2. Direct client fallback
            const baseUrl = (config.api_url || 'https://actapp.misa.vn').replace(/\/+$/, '');
            const connectUrl = `${baseUrl}/api/oauth/actopen/connect`;
            const connectRes = await axios.post(connectUrl, {
                app_id: config.app_id.trim(),
                access_code: config.access_code.trim(),
                org_company_code: config.org_company_code.trim() || ''
            });

            if (connectRes.data?.Success) {
                setTestResult({
                    success: true,
                    message: "Xác thực MISA AMIS Kế toán thành công!"
                });
                toast.success("Kết nối MISA AMIS thành công!");
                handleSaveConfig(true);
                handleFetchStocks(config, true);
            } else {
                const msg = connectRes.data?.ErrorMessage || connectRes.data?.ErrorCode || "MISA từ chối xác thực";
                setTestResult({
                    success: false,
                    message: `Lỗi: ${msg}`
                });
                toast.error(`Xác thực thất bại: ${msg}`);
            }
        } catch (error) {
            const msg = error.message || error.response?.data?.error || "Không thể kết nối đến server MISA";
            setTestResult({
                success: false,
                message: `Lỗi kết nối: ${msg}`
            });
            toast.error(msg);
        } finally {
            setTesting(false);
        }
    };

    const handleSyncNow = async () => {
        if (!config.app_id?.trim() || !config.access_code?.trim()) {
            toast.error("Vui lòng cấu hình App ID và Access Code của MISA");
            return;
        }

        setSyncing(true);
        await handleSaveConfig(true);

        try {
            let items = null;

            // 1. Try backend proxy
            try {
                const res = await axios.post('/api/misa/sync-inventory', config);
                if (res.data && res.data.success && Array.isArray(res.data.items)) {
                    items = res.data.items;
                }
            } catch (backendErr) {
                console.warn("Backend sync failed, trying direct client fetch:", backendErr);
                if (backendErr.response?.data?.error && !backendErr.response.data.error.includes("404")) {
                    throw new Error(backendErr.response.data.error);
                }
            }

            // 2. Direct client fallback if backend proxy not used
            if (!items) {
                const baseUrl = (config.api_url || 'https://actapp.misa.vn').replace(/\/+$/, '');
                const connectUrl = `${baseUrl}/api/oauth/actopen/connect`;

                const connectRes = await axios.post(connectUrl, {
                    app_id: config.app_id.trim(),
                    access_code: config.access_code.trim(),
                    org_company_code: config.org_company_code.trim() || ''
                });

                if (!connectRes.data?.Success) {
                    throw new Error(connectRes.data?.ErrorMessage || "MISA từ chối xác thực kết nối");
                }

                let token = null;
                const rawConnData = connectRes.data.Data;
                if (typeof rawConnData === 'string') {
                    try {
                        const parsed = JSON.parse(rawConnData);
                        token = parsed.access_token || parsed.AccessToken || parsed.token || rawConnData;
                    } catch {
                        token = rawConnData;
                    }
                } else if (typeof rawConnData === 'object' && rawConnData) {
                    token = rawConnData.access_token || rawConnData.AccessToken || rawConnData.token;
                }

                if (!token) throw new Error("Không nhận được access_token từ MISA");

                const invUrl = `${baseUrl}/apir/sync/actopen/get_list_inventory_balance`;
                let allItems = [];
                let skip = 0;
                const take = 500;

                while (true) {
                    const invRes = await axios.post(invUrl, {
                        app_id: config.app_id.trim(),
                        branch_id: config.branch_id?.trim() || null,
                        skip,
                        take,
                        last_sync_time: null
                    }, {
                        headers: {
                            'X-MISA-AccessToken': token,
                            'Content-Type': 'application/json'
                        }
                    });

                    if (!invRes.data?.Success) {
                        throw new Error(invRes.data?.ErrorMessage || "Lỗi khi lấy dữ liệu tồn kho từ MISA");
                    }

                    const rawInvData = invRes.data?.Data;
                    let dataArr = [];
                    if (typeof rawInvData === 'string') {
                        try {
                            dataArr = JSON.parse(rawInvData) || [];
                        } catch {
                            dataArr = [];
                        }
                    } else if (Array.isArray(rawInvData)) {
                        dataArr = rawInvData;
                    }

                    if (dataArr.length === 0) break;

                    for (const item of dataArr) {
                        const itemStockCode = (item.stock_code || item.StockCode || '').trim();
                        if (config.stock_code?.trim() && itemStockCode !== config.stock_code.trim()) {
                            continue;
                        }

                        const code = (item.inventory_item_code || item.InventoryItemCode || '').trim();
                        const name = (item.inventory_item_name || item.InventoryItemName || '').trim();
                        const unit = (item.unit_name || item.UnitName || '').trim();
                        const stock = Number(item.quantity_balance ?? item.Quantity ?? item.quantity ?? 0);
                        const amount = Number(item.amount_balance ?? item.Amount ?? item.amount ?? 0);
                        const explicitPrice = Number(item.unit_price ?? item.UnitPrice ?? 0);
                        const price = explicitPrice > 0 ? Math.round(explicitPrice) : (stock !== 0 && amount !== 0 ? Math.round(amount / stock) : 0);
                        const stockName = (item.stock_name || item.StockName || '').trim();

                        allItems.push({
                            code,
                            name,
                            stock,
                            unit,
                            price,
                            amount,
                            stock_code: itemStockCode,
                            stock_name: stockName
                        });
                    }

                    if (dataArr.length < take) break;
                    skip += take;
                    if (skip > 50000) break;
                }

                items = allItems;
            }

            if (!items || items.length === 0) {
                toast.error("Không tìm thấy mặt hàng nào trong kho MISA!");
                return;
            }

            toast.success(`Đã lấy thành công ${items.length} mặt hàng từ MISA AMIS!`);
            const selectedStock = stocks.find(s => s.stock_code === config.stock_code);
            const meta = {
                stock_code: config.stock_code || '',
                stock_name: selectedStock ? selectedStock.stock_name : (config.stock_code ? config.stock_code : 'Tất cả các kho'),
                to_date: config.to_date || ''
            };
            onSyncSuccess(items, meta);
            onClose();
        } catch (err) {
            console.error("Sync error:", err);
            const msg = err.message || err.response?.data?.error || "Lỗi khi kết nối hoặc đồng bộ từ MISA";
            toast.error(msg);
        } finally {
            setSyncing(false);
        }
    };

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 10 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 10 }}
                className="bg-white dark:bg-slate-900 w-full max-w-3xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden relative z-10 p-6 md:p-8 max-h-[92vh] flex flex-col"
            >
                {/* Header */}
                <div className="flex items-center justify-between pb-5 border-b border-slate-200 dark:border-slate-800 shrink-0">
                    <div className="flex items-center gap-3.5">
                        <div className="w-12 h-12 bg-blue-50 dark:bg-blue-950/60 text-blue-600 rounded-2xl flex items-center justify-center shadow-inner border border-blue-200 dark:border-blue-800 shrink-0">
                            <Cloud size={24} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                                <h3 className="text-xl font-black text-slate-900 dark:text-slate-100 uppercase tracking-tight whitespace-nowrap">
                                    Đồng Bộ MISA AMIS Kế Toán
                                </h3>
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-700 whitespace-nowrap shrink-0">
                                    OpenAPI
                                </span>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                Kết nối trực tiếp API MISA AMIS để lấy số lượng tồn kho sổ sách đối soát
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 rounded-xl transition-all cursor-pointer"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body Form */}
                <div className="space-y-4 my-5 overflow-y-auto pr-1 custom-scrollbar flex-1">
                    {/* Hướng dẫn nhanh */}
                    <div className="p-4 bg-blue-50/60 dark:bg-blue-950/30 rounded-2xl border border-blue-200/80 dark:border-blue-900/40 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                        <div className="flex items-center gap-2 font-bold text-blue-700 dark:text-blue-400 mb-1">
                            <HelpCircle size={15} />
                            <span>Cách lấy thông tin kết nối từ MISA AMIS Kế toán:</span>
                        </div>
                        <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-600 dark:text-slate-400 pl-1">
                            <li>Đăng nhập phần mềm <strong>MISA AMIS Kế toán</strong> (hoặc cổng Developer MISA).</li>
                            <li>Vào <strong>Thiết lập</strong> &rarr; <strong>Kết nối ứng dụng</strong> &rarr; chọn mục <strong>API kết nối</strong> để sao chép <strong>Access Code</strong>.</li>
                            <li>Điền <strong>App ID</strong> do MISA cấp cho ứng dụng của bạn.</li>
                        </ul>
                    </div>

                    {/* MISA API URL */}
                    <div>
                        <label className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase block mb-1.5">
                            MISA API URL <span className="text-rose-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={config.api_url}
                            onChange={(e) => setConfig({ ...config, api_url: e.target.value })}
                            placeholder="https://actapp.misa.vn"
                            className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2.5 font-bold text-sm text-slate-800 dark:text-slate-100 outline-none focus:border-blue-500 transition-all font-mono"
                        />
                        <p className="text-[10px] text-slate-400 mt-1">Mặc định: <code>https://actapp.misa.vn</code> (hoặc <code>https://developer.misa.vn/apis</code>)</p>
                    </div>

                    {/* App ID & Access Code */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase block mb-1.5 whitespace-nowrap">
                                App ID (Mã ứng dụng) <span className="text-rose-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={config.app_id}
                                onChange={(e) => setConfig({ ...config, app_id: e.target.value })}
                                placeholder="VD: 31c69d29-837e-4b12-a702-..."
                                className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2.5 font-bold text-sm text-slate-800 dark:text-slate-100 outline-none focus:border-blue-500 transition-all font-mono"
                            />
                        </div>

                        <div>
                            <label className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase block mb-1.5 whitespace-nowrap">
                                Access Code (Mã kết nối) <span className="text-rose-500">*</span>
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={config.access_code}
                                    onChange={(e) => setConfig({ ...config, access_code: e.target.value })}
                                    placeholder="Nhập Access Code từ AMIS..."
                                    className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl pl-4 pr-10 py-2.5 font-bold text-sm text-slate-800 dark:text-slate-100 outline-none focus:border-blue-500 transition-all font-mono"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                >
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Org Company Code & Branch ID */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase block mb-1.5 whitespace-nowrap">
                                Mã Công Ty (Org Company Code)
                            </label>
                            <input
                                type="text"
                                value={config.org_company_code}
                                onChange={(e) => setConfig({ ...config, org_company_code: e.target.value })}
                                placeholder="Tùy chọn (Mã công ty MISA)"
                                className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2.5 font-bold text-sm text-slate-800 dark:text-slate-100 outline-none focus:border-blue-500 transition-all font-mono"
                            />
                        </div>

                        <div>
                            <label className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase block mb-1.5 whitespace-nowrap">
                                Mã Chi Nhánh (Branch ID)
                            </label>
                            <input
                                type="text"
                                value={config.branch_id}
                                onChange={(e) => setConfig({ ...config, branch_id: e.target.value })}
                                placeholder="Để trống nếu lấy tất cả chi nhánh"
                                className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2.5 font-bold text-sm text-slate-800 dark:text-slate-100 outline-none focus:border-blue-500 transition-all font-mono"
                            />
                        </div>
                    </div>

                    {/* Kho Hàng (Stock) & Ngày Chốt Tồn Kho (Date) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-2xl bg-blue-50/40 dark:bg-blue-950/20 border border-blue-200/80 dark:border-blue-900/40">
                        {/* Chọn Kho */}
                        <div className="flex flex-col justify-between">
                            <div>
                                <div className="flex items-center justify-between mb-1.5 gap-2">
                                    <label className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase flex items-center gap-1.5 whitespace-nowrap shrink-0">
                                        <Layers size={14} className="text-blue-600 dark:text-blue-400 shrink-0" />
                                        <span>Kho Hàng MISA</span>
                                    </label>
                                    <button
                                        type="button"
                                        onClick={() => handleFetchStocks()}
                                        disabled={loadingStocks || !config.app_id?.trim() || !config.access_code?.trim()}
                                        className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1 cursor-pointer disabled:opacity-40 transition-colors whitespace-nowrap shrink-0"
                                        title="Bấm để tải lại danh sách kho từ MISA qua API"
                                    >
                                        <RefreshCw size={12} className={cn(loadingStocks && "animate-spin")} />
                                        <span>{loadingStocks ? "Đang tải..." : (stocks.length > 0 ? "Tải lại DS" : "Lấy DS Kho API")}</span>
                                    </button>
                                </div>

                                <select
                                    value={config.stock_code || ''}
                                    onChange={(e) => setConfig({ ...config, stock_code: e.target.value })}
                                    className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 font-bold text-sm text-slate-800 dark:text-slate-100 outline-none focus:border-blue-500 transition-all cursor-pointer shadow-xs truncate"
                                >
                                    <option value="">-- Tất cả các kho (Toàn bộ) --</option>
                                    {stocks.map(s => (
                                        <option key={s.stock_code} value={s.stock_code}>
                                            {s.stock_name} ({s.stock_code}){s.inactive ? ' [Ngừng theo dõi]' : ''}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-2 truncate">
                                {stocks.length > 0
                                    ? `Đã nhận diện ${stocks.length} kho từ MISA qua API.`
                                    : "Bấm 'Lấy DS Kho API' hoặc để mặc định lấy toàn bộ."}
                            </p>
                        </div>

                        {/* Chọn Ngày Chốt Tồn Kho */}
                        <div className="flex flex-col justify-between">
                            <div>
                                <label className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase flex items-center gap-1.5 mb-1.5 whitespace-nowrap">
                                    <Calendar size={14} className="text-blue-600 dark:text-blue-400 shrink-0" />
                                    <span>Tính Tồn Kho Đến Ngày</span>
                                </label>

                                <input
                                    type="date"
                                    value={config.to_date || ''}
                                    onChange={(e) => setConfig({ ...config, to_date: e.target.value })}
                                    className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 font-bold text-sm text-slate-800 dark:text-slate-100 outline-none focus:border-blue-500 transition-all cursor-pointer shadow-xs"
                                />
                            </div>

                            <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                                <span className="text-[10px] text-slate-400 font-semibold whitespace-nowrap">Chọn nhanh:</span>
                                <button
                                    type="button"
                                    onClick={() => setConfig({ ...config, to_date: getTodayStr() })}
                                    className={cn(
                                        "text-[10px] font-bold px-2.5 py-1 rounded-lg border transition-all cursor-pointer whitespace-nowrap shrink-0",
                                        config.to_date === getTodayStr()
                                            ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                                            : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-700 hover:border-blue-400"
                                    )}
                                >
                                    Hôm nay
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setConfig({ ...config, to_date: getLastMonthEndStr() })}
                                    className={cn(
                                        "text-[10px] font-bold px-2.5 py-1 rounded-lg border transition-all cursor-pointer whitespace-nowrap shrink-0",
                                        config.to_date === getLastMonthEndStr()
                                            ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                                            : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-700 hover:border-blue-400"
                                    )}
                                    title="Chốt số liệu tại ngày cuối cùng của tháng trước"
                                >
                                    Cuối tháng trước
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Test Connection Banner */}
                    {testResult && (
                        <div className={cn(
                            "p-3.5 rounded-xl border flex items-center gap-2.5 text-xs font-bold transition-all",
                            testResult.success
                                ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800"
                                : "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-300 dark:border-rose-800"
                        )}>
                            {testResult.success ? <CheckCircle2 size={18} className="shrink-0" /> : <AlertCircle size={18} className="shrink-0" />}
                            <span>{testResult.message}</span>
                        </div>
                    )}
                </div>

                {/* Footer Buttons */}
                <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            disabled={testing || syncing || saving}
                            onClick={handleTestConnection}
                            className="px-4 py-2.5 bg-transparent border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-black text-xs uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50 whitespace-nowrap shrink-0"
                        >
                            {testing ? <Loader2 size={14} className="animate-spin text-blue-600" /> : <RefreshCw size={14} />}
                            <span>{testing ? 'Đang kiểm tra...' : 'Kiểm tra kết nối'}</span>
                        </button>

                        <button
                            type="button"
                            disabled={saving || syncing}
                            onClick={() => handleSaveConfig(false)}
                            className="px-3.5 py-2.5 bg-transparent border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50 whitespace-nowrap shrink-0"
                            title="Lưu cấu hình"
                        >
                            <Save size={14} />
                            <span>Lưu cấu hình</span>
                        </button>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2.5 bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 rounded-xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap shrink-0"
                        >
                            Đóng
                        </button>

                        <button
                            type="button"
                            disabled={syncing || testing}
                            onClick={handleSyncNow}
                            className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-500 hover:to-indigo-600 text-white rounded-xl font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-blue-600/25 border border-blue-500/30 transition-all cursor-pointer disabled:opacity-50 whitespace-nowrap shrink-0"
                        >
                            {syncing ? <Loader2 size={16} className="animate-spin" /> : <Cloud size={16} />}
                            <span>{syncing ? 'Đang tải tồn kho...' : 'Lấy Tồn Kho Ngay'}</span>
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>,
        document.body
    );
}

