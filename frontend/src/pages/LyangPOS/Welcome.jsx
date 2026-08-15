import React, { useState } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { User, Lock, ArrowRight, Sparkles, UserPlus, LogIn, Leaf, Sprout, Sun, Wheat, ShieldCheck, Network, Wifi, WifiOff, X, Check, Laptop, Plus } from 'lucide-react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import logo from '../../assets/logo.png';
import { cn } from '../../lib/utils';

export default function Welcome() {
    const [isLogin, setIsLogin] = useState(true);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        username: localStorage.getItem('saved_username') || '',
        password: localStorage.getItem('saved_password') || '',
        display_name: '',
        admin_secret: ''
    });
    const [isSecretAdminMode, setIsSecretAdminMode] = useState(false);
    const [rememberMe, setRememberMe] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [showLoginForm, setShowLoginForm] = useState(false);

    React.useEffect(() => {
        if (users && users.length === 0) {
            setShowLoginForm(true);
        }
    }, [users]);

    React.useEffect(() => {
        const fetchUsers = async () => {
            try {
                const res = await axios.get('/api/users');
                if (Array.isArray(res.data)) {
                    setUsers(res.data);
                }
            } catch (err) {
                console.warn("Failed to fetch users in welcome screen", err);
            }
        };
        fetchUsers();
    }, []);

    const handleSelectUser = async (user) => {
        const savedPassword = localStorage.getItem(`saved_pwd_${user.username}`) || '';
        
        if (savedPassword) {
            setLoading(true);
            setError('');
            try {
                const res = await axios.post('/api/login', {
                    username: user.username,
                    password: savedPassword
                });
                const userData = JSON.stringify(res.data.user);
                sessionStorage.setItem('user', userData);
                
                localStorage.setItem('saved_username', user.username);
                localStorage.setItem('saved_password', savedPassword);
                localStorage.setItem(`saved_pwd_${user.username}`, savedPassword);
                
                navigate('/');
            } catch (err) {
                console.error("Auto login failed, showing login form:", err);
                setError(err.response?.data?.error || 'Thông tin đăng nhập không chính xác');
                setFormData({
                    username: user.username,
                    password: '',
                    display_name: ''
                });
                setShowLoginForm(true);
            } finally {
                setLoading(false);
            }
        } else {
            setFormData({
                username: user.username,
                password: '',
                display_name: ''
            });
            setShowLoginForm(true);
            setTimeout(() => {
                document.getElementById('welcome-password-input')?.focus();
            }, 100);
        }
    };

    const [time, setTime] = useState(new Date());
    React.useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const formatDateVN = (date) => {
        const days = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
        const dayName = days[date.getDay()];
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${dayName}, ngày ${day}/${month}/${year}`;
    };

    const getAuspiciousHours = (date) => {
        const d = date.getDate();
        const m = date.getMonth() + 1;
        const y = date.getFullYear();
        
        let a = Math.floor((14 - m) / 12);
        let y_calc = y + 4800 - a;
        let m_calc = m + 12 * a - 3;
        let jd = d + Math.floor((153 * m_calc + 2) / 5) + 365 * y_calc + Math.floor(y_calc / 4) - Math.floor(y_calc / 100) + Math.floor(y_calc / 400) - 32045;
        
        const dayChiIndex = (Math.floor(jd + 1.5) + 11) % 12;
        
        const mapping = {
            0: ["Tý", "Sửu", "Dần", "Mão", "Mùi", "Dậu"],
            6: ["Tý", "Sửu", "Dần", "Mão", "Mùi", "Dậu"],
            1: ["Dần", "Mão", "Tỵ", "Thân", "Tuất", "Hợi"],
            7: ["Dần", "Mão", "Tỵ", "Thân", "Tuất", "Hợi"],
            2: ["Tý", "Sửu", "Thìn", "Tỵ", "Mùi", "Tuất"],
            8: ["Tý", "Sửu", "Thìn", "Tỵ", "Mùi", "Tuất"],
            3: ["Tý", "Dần", "Mão", "Ngọ", "Mùi", "Dậu"],
            9: ["Tý", "Dần", "Mão", "Ngọ", "Mùi", "Dậu"],
            4: ["Dần", "Thìn", "Tỵ", "Thân", "Dậu", "Hợi"],
            10: ["Dần", "Thìn", "Tỵ", "Thân", "Dậu", "Hợi"],
            5: ["Sửu", "Thìn", "Ngọ", "Mùi", "Tuất", "Hợi"],
            11: ["Sửu", "Thìn", "Ngọ", "Mùi", "Tuất", "Hợi"]
        };
        
        return mapping[dayChiIndex] || ["Tý", "Sửu", "Dần", "Mão", "Mùi", "Dậu"];
    };

    const getLunarDate = (date) => {
        const y = date.getFullYear();
        const data = {
            2024: { lny: new Date(2024, 1, 10), months: [30, 29, 30, 29, 30, 29, 29, 30, 29, 30, 30, 29], leap: 0, stemBranch: "Giáp Thìn" },
            2025: { lny: new Date(2025, 0, 29), months: [30, 29, 30, 29, 29, 30, 30, 29, 29, 30, 30, 29, 30], leap: 6, stemBranch: "Ất Tỵ" },
            2026: { lny: new Date(2026, 1, 17), months: [30, 29, 30, 29, 30, 29, 30, 29, 30, 29, 30, 30], leap: 0, stemBranch: "Bính Ngọ" },
            2027: { lny: new Date(2027, 1, 6), months: [30, 29, 30, 29, 30, 29, 29, 30, 29, 30, 30, 29], leap: 0, stemBranch: "Đinh Mùi" }
        };

        const yearData = data[y] || data[2026];
        let diffDays = Math.floor((date.getTime() - yearData.lny.getTime()) / (24 * 60 * 60 * 1000));

        if (diffDays < 0) {
            const prevYearData = data[y - 1] || data[2025];
            diffDays = Math.floor((date.getTime() - prevYearData.lny.getTime()) / (24 * 60 * 60 * 1000));
            let lunarMonth = 1;
            let day = diffDays + 1;
            for (let i = 0; i < prevYearData.months.length; i++) {
                const daysInMonth = prevYearData.months[i];
                if (day <= daysInMonth) {
                    lunarMonth = i + 1;
                    break;
                }
                day -= daysInMonth;
            }
            let displayMonth = lunarMonth;
            let isLeap = false;
            if (prevYearData.leap > 0) {
                if (lunarMonth === prevYearData.leap + 1) {
                    displayMonth = prevYearData.leap;
                    isLeap = true;
                } else if (lunarMonth > prevYearData.leap + 1) {
                    displayMonth = lunarMonth - 1;
                }
            }
            return { day, month: displayMonth, isLeap, year: prevYearData.stemBranch };
        } else {
            let lunarMonth = 1;
            let day = diffDays + 1;
            for (let i = 0; i < yearData.months.length; i++) {
                const daysInMonth = yearData.months[i];
                if (day <= daysInMonth) {
                    lunarMonth = i + 1;
                    break;
                }
                day -= daysInMonth;
            }
            let displayMonth = lunarMonth;
            let isLeap = false;
            if (yearData.leap > 0) {
                if (lunarMonth === yearData.leap + 1) {
                    displayMonth = yearData.leap;
                    isLeap = true;
                } else if (lunarMonth > yearData.leap + 1) {
                    displayMonth = lunarMonth - 1;
                }
            }
            return { day, month: displayMonth, isLeap, year: yearData.stemBranch };
        }
    };

    const randomQuote = React.useMemo(() => {
        const quotes = [
            "Quản lý thông minh - Tương lai thịnh vượng.",
            "Tối ưu quy trình, nâng tầm hiệu quả kinh doanh.",
            "Bán hàng nhanh chóng, quản lý dễ dàng.",
            "Mỗi giao dịch hoàn thành là một niềm vui nhân đôi.",
            "Kinh doanh hiệu quả là gốc rễ của sự thịnh vượng bền lâu.",
            "Chăm sóc khách hàng tốt, gặt hái triệu niềm vui."
        ];
        return quotes[Math.floor(Math.random() * quotes.length)];
    }, []);

    React.useEffect(() => {
        const handleGlobalEnter = (e) => {
            if (e.key === 'Enter' && isLogin && formData.username && formData.password && !loading) {
                 if (document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'BUTTON') {
                     document.getElementById('login-form-submit-btn')?.click();
                 }
            }
        };
        window.addEventListener('keydown', handleGlobalEnter);
        return () => window.removeEventListener('keydown', handleGlobalEnter);
    }, [isLogin, formData, loading]);

    const [showLanModal, setShowLanModal] = useState(false);
    const [lanIp, setLanIp] = useState(localStorage.getItem('server_ip') || '');
    const [testingConnection, setTestingConnection] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState(null); // 'success' | 'failed' | null
    const [pingError, setPingError] = useState('');
    const [isClientMode, setIsClientMode] = useState(!!localStorage.getItem('server_ip'));

    const sanitizeIp = (input) => {
        let cleaned = input.trim();
        // Loại bỏ http:// hoặc https:// nếu người dùng lỡ nhập/copy
        cleaned = cleaned.replace(/^(https?:\/\/)/i, '');
        // Loại bỏ ký tự gạch chéo cuối dòng nếu có
        cleaned = cleaned.replace(/\/+$/, '');
        // Loại bỏ cổng (ví dụ :3579 hoặc :5001) nếu người dùng copy nguyên URL
        cleaned = cleaned.replace(/:\d+$/, '');
        return cleaned;
    };

    const resolveApiUrl = (val) => {
        if (!val) return '';
        let clean = val.trim();
        if (/^https?:\/\//i.test(clean)) return clean;
        if (clean.toLowerCase() === 'localhost') return 'http://localhost:3579';
        const hasLetters = /[a-zA-Z]/.test(clean);
        if (hasLetters) {
            return `https://${clean}`;
        }
        return `http://${clean}:3579`;
    };

    const handleTestConnection = async () => {
        const cleanedIp = sanitizeIp(lanIp);
        if (!cleanedIp) {
            setConnectionStatus('failed');
            setPingError('Vui lòng nhập địa chỉ IP hợp lệ.');
            return;
        }
        setTestingConnection(true);
        setConnectionStatus(null);
        setPingError('');
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3500); // 3.5s timeout
            
            // Tự động nhận diện môi trường Tauri để sử dụng native fetch qua Rust
            let fetchFn = window.fetch;
            if (window.__TAURI_INTERNALS__) {
                try {
                    const { fetch: tauriFetch } = await import('@tauri-apps/plugin-http');
                    fetchFn = tauriFetch;
                } catch (e) {
                    console.warn('Khong the nap Tauri HTTP plugin, su dung fetch mac dinh', e);
                }
            }
            
            const testUrl = resolveApiUrl(cleanedIp) + '/api/ping';
            const response = await fetchFn(testUrl, {
                method: 'GET',
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                setConnectionStatus('failed');
                setPingError(`Máy chủ phản hồi mã lỗi HTTP: ${response.status}`);
                return;
            }
            
            const data = await response.json();
            if (data.status === 'ok' || data.message === 'pong') {
                setConnectionStatus('success');
            } else {
                setConnectionStatus('failed');
                setPingError('Phản hồi từ máy chủ không khớp.');
            }
        } catch (err) {
            setConnectionStatus('failed');
            let errorMsg = 'Không thể kết nối đến máy chủ.';
            if (window.location.protocol === 'https:') {
                errorMsg = `Safari trên iOS chặn kết nối HTTP nội bộ khi truy cập qua Vercel HTTPS. Vui lòng mở đường dẫn trực tiếp: http://${cleanedIp}:3579 trên Safari.`;
            } else if (err && err.name === 'AbortError') {
                errorMsg = 'Hết thời gian chờ kết nối (Timeout 3.5s). Vui lòng kiểm tra IP và kết nối WiFi.';
            } else if (err && (err.name === 'TypeError' || String(err).includes('Fetch') || String(err).includes('Load failed'))) {
                errorMsg = `Safari không thể kết nối tới http://${cleanedIp}:3579 (TypeError). Vui lòng đảm bảo thiết bị Safari và Máy POS kết nối cùng một mạng WiFi.`;
            } else {
                errorMsg = typeof err === 'string' ? err : (err && err.message ? err.message : String(err));
            }
            setPingError(errorMsg);
        } finally {
            setTestingConnection(false);
        }
    };

    const handleSaveLanConfig = () => {
        if (isClientMode) {
            const cleanedIp = sanitizeIp(lanIp);
            if (!cleanedIp) {
                setError('Vui lòng nhập IP máy chủ hoặc chọn chế độ chạy cục bộ.');
                return;
            }
            localStorage.setItem('server_ip', cleanedIp);
        } else {
            localStorage.removeItem('server_ip');
        }
        setShowLanModal(false);
        // Reload page to re-initialize Axios base URL with the new configuration
        window.location.reload();
    };




    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            if (isLogin) {
                const res = await axios.post('/api/login', {
                    username: formData.username,
                    password: formData.password
                });
                const userData = JSON.stringify(res.data.user);
                sessionStorage.setItem('user', userData);

                if (rememberMe) {
                    localStorage.setItem('saved_username', formData.username);
                    localStorage.setItem('saved_password', formData.password);
                    localStorage.setItem(`saved_pwd_${formData.username}`, formData.password);
                } else {
                    localStorage.removeItem('saved_username');
                    localStorage.removeItem('saved_password');
                    localStorage.removeItem(`saved_pwd_${formData.username}`);
                }
                navigate('/');
            } else {
                const res = await axios.post('/api/register', {
                    username: formData.username,
                    password: formData.password,
                    display_name: formData.display_name,
                    admin_secret: isSecretAdminMode ? formData.admin_secret : ''
                });
                sessionStorage.setItem('user', JSON.stringify(res.data.user));
                navigate('/');
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Thông tin đăng nhập không chính xác');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={cn("min-h-[100dvh] w-full flex flex-col items-center justify-center bg-transparent relative", showLoginForm ? "h-[100dvh] overflow-hidden" : "overflow-y-auto py-12 sm:py-20")}>

            {/* LAN Configuration Button in top-right */}
            <div className="absolute top-[max(env(safe-area-inset-top,16px),16px)] right-4 sm:right-6 sm:top-6 z-50">
                <m.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowLanModal(true)}
                    className="flex items-center gap-1.5 sm:gap-2.5 px-3 py-2 sm:px-5 sm:py-3 border border-[#d4a574]/20 hover:border-[#2d5016] rounded-xl sm:rounded-2xl shadow-lg transition-all text-[10px] sm:text-xs font-black uppercase tracking-wider text-[#8b6f47] hover:text-[#2d5016] dark:text-emerald-400/80 dark:hover:text-emerald-400 cursor-pointer"
                >
                    {localStorage.getItem('server_ip') ? (
                        <>
                            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-blue-500" />
                            <Network size={14} className="sm:w-4 sm:h-4" />
                            <span className="max-w-[100px] sm:max-w-none truncate">LAN: {localStorage.getItem('server_ip')}</span>
                        </>
                    ) : (
                        <>
                            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-500" />
                            <Wifi size={14} className="sm:w-4 sm:h-4" />
                            <span>Cục bộ</span>
                        </>
                    )}
                </m.button>
            </div>

            {/* Modal LAN Configuration */}
            <AnimatePresence>
                {showLanModal && (
                    <div className="fixed inset-0 w-full h-full flex items-center justify-center z-[100] p-4">
                        {/* Overlay backdrop */}
                        <m.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowLanModal(false)}
                            className="absolute inset-0 bg-slate-950/40 dark:bg-black/60 backdrop-blur-sm"
                        />

                        {/* Modal Body */}
                        <m.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className="bg-[#faf8f3] dark:bg-slate-900 border-2 border-[#d4a574]/20 p-8 rounded-[2.5rem] shadow-2xl w-full max-w-md relative z-10 overflow-hidden"
                        >
                            {/* Decorative wheat background */}
                            <div className="absolute right-0 bottom-0 opacity-[0.03] pointer-events-none -rotate-12 translate-x-4 translate-y-4">
                                <Wheat size={180} />
                            </div>

                            {/* Header */}
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-3 bg-emerald-100/50 dark:bg-emerald-950/30 rounded-2xl text-[#2d5016] dark:text-emerald-400">
                                        <Network size={20} />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-black text-[#2d5016] dark:text-emerald-400 uppercase tracking-tight">Cấu hình kết nối LAN</h3>
                                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-0.5">Liên kết dữ liệu giữa các thiết bị</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowLanModal(false)}
                                    className="p-2 hover:bg-transparent dark:hover:bg-slate-800 rounded-xl transition-colors text-gray-400 hover:text-gray-600 cursor-pointer"
                                >
                                    <X size={16} />
                                </button>
                            </div>

                            <div className="space-y-6">
                                {/* Mode Selection Switcher */}
                                <div className="grid grid-cols-2 gap-3 bg-[#faf8f3] dark:bg-slate-950/50 p-1.5 rounded-2xl border border-[#d4a574]/10">
                                    <button
                                        type="button"
                                        onClick={() => { setIsClientMode(false); setConnectionStatus(null); }}
                                        className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${!isClientMode ? 'bg-[#2d5016] text-white shadow-md' : 'text-[#8b6f47] hover:text-[#2d5016]'}`}
                                    >
                                        <Laptop size={14} /> Chạy Cục bộ
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setIsClientMode(true)}
                                        className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${isClientMode ? 'bg-[#2d5016] text-white shadow-md' : 'text-[#8b6f47] hover:text-[#2d5016]'}`}
                                    >
                                        <Network size={14} /> Máy khách LAN
                                    </button>
                                </div>

                                {isClientMode ? (
                                    <m.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="space-y-4 overflow-hidden"
                                    >
                                        <div className="space-y-1.5">
                                            <label className="text-[9px] font-black text-[#8b6f47] uppercase ml-1 tracking-wider">Địa chỉ IP Máy Chủ chính</label>
                                            <input
                                                type="text"
                                                placeholder="Ví dụ: 192.168.1.15"
                                                value={lanIp}
                                                onChange={(e) => { setLanIp(e.target.value); setConnectionStatus(null); }}
                                                className="w-full bg-[#faf8f3] dark:bg-slate-950/50 border-2 border-transparent focus:border-[#d4a574]/30 focus:bg-transparent rounded-2xl py-3.5 px-4 font-mono font-bold text-sm text-gray-800 dark:text-emerald-300 outline-none transition-all shadow-inner"
                                            />
                                        </div>

                                        {/* Status Message */}
                                        {connectionStatus === 'success' && (
                                            <m.div
                                                initial={{ opacity: 0, scale: 0.95 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase tracking-wider flex items-center gap-2 justify-center"
                                            >
                                                <Check size={14} /> Kết nối Máy Chủ thành công!
                                            </m.div>
                                        )}
                                        {connectionStatus === 'failed' && (
                                            <m.div
                                                initial={{ opacity: 0, scale: 0.95 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-600 dark:text-rose-400 text-[10px] font-black uppercase tracking-wider flex flex-col items-center gap-2 justify-center"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <WifiOff size={14} /> Lỗi kết nối! Kiểm tra lại IP/Wifi.
                                                </div>
                                                {pingError && (
                                                    <div className="mt-1.5 text-[9px] text-rose-500/80 font-mono select-text text-center lowercase border-t border-rose-500/10 pt-1.5 w-full">
                                                        chi tiet: {pingError}
                                                    </div>
                                                )}
                                            </m.div>
                                        )}

                                        <button
                                            type="button"
                                            onClick={handleTestConnection}
                                            disabled={testingConnection || !lanIp.trim()}
                                            className="w-full py-3.5 bg-transparent hover:bg-[#faf8f3] border-2 border-emerald-500/20 text-emerald-700 dark:text-emerald-400 font-black uppercase tracking-wider text-[10px] rounded-2xl shadow-sm hover:shadow active:scale-98 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                                        >
                                            {testingConnection ? (
                                                <>
                                                    <div className="w-3.5 h-3.5 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
                                                    <span>ĐANG KIỂM TRA...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Wifi size={14} /> Kiểm tra kết nối mạng
                                                </>
                                            )}
                                        </button>
                                    </m.div>
                                ) : (
                                    <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-800 dark:text-emerald-400 text-[10px] font-bold leading-relaxed uppercase tracking-wider text-center">
                                        🏠 Ứng dụng sẽ chạy độc lập, sử dụng cơ sở dữ liệu nội bộ trên máy tính này.
                                    </div>
                                )}

                                {/* Modal Footer buttons */}
                                <div className="grid grid-cols-2 gap-3 pt-4 border-t border-[#d4a574]/15">
                                    <button
                                        type="button"
                                        onClick={() => setShowLanModal(false)}
                                        className="py-3.5 bg-[#2d5016] text-white font-black uppercase tracking-widest text-[10px] rounded-2xl hover:bg-[#4a7c59] transition-all shadow-md active:scale-98 cursor-pointer"
                                    >
                                        HỦY BỎ
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleSaveLanConfig}
                                        className="py-3.5 bg-[#2d5016] text-white font-black uppercase tracking-widest text-[10px] rounded-2xl hover:bg-[#4a7c59] transition-all shadow-md active:scale-98 cursor-pointer"
                                    >
                                        LƯU CẤU HÌNH
                                    </button>
                                </div>
                            </div>
                        </m.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Organic Background Decorations */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#2d5016]/5 rounded-full blur-[100px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#d4a574]/10 rounded-full blur-[100px]" />

                {/* Floating Icons for Agri Vibe */}
                <div className="absolute top-[20%] right-[15%] text-[#2d5016]/10">
                    <Leaf size={120} />
                </div>
                <div className="absolute bottom-[20%] left-[10%] text-[#d4a574]/10">
                    <Wheat size={160} />
                </div>
            </div>




            <m.div
                initial={{ opacity: 0, y: 30, scale: 0.9, filter: 'blur(20px)' }}
                animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0.01px)' }}
                transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
                className={cn("w-full transition-all duration-500 relative z-10 px-4 sm:p-6 mt-10 sm:mt-0 flex flex-col justify-center items-center", showLoginForm ? "max-w-md h-full sm:h-auto" : "max-w-6xl")}
            >

                {/* Brand / Logo Section */}
                <div className="text-center mb-6">
                    <m.div
                        initial={{ scale: 0.5, opacity: 0, rotate: -20 }}
                        animate={{ scale: 1, opacity: 1, rotate: 0 }}
                        transition={{
                            delay: 0.4,
                            type: "spring",
                            stiffness: 150,
                            damping: 20
                        }}
                        className="inline-flex items-center justify-center w-24 h-24 sm:w-40 sm:h-40 mb-1 sm:mb-4 group"
                    >
                        <img
                            src={logo}
                            alt="Logo"
                            className="w-full h-full object-contain drop-shadow-[0_20px_50px_rgba(45,80,22,0.3)] group-hover:scale-110 transition-transform duration-700 ease-out"
                        />
                    </m.div>

                    <m.div
                        initial={{ opacity: 0, y: 20, filter: 'blur(10px)' }}
                        animate={{ opacity: 1, y: 0, filter: 'blur(0.01px)' }}
                        transition={{ delay: 0.6, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                    >
                        <h1 className="text-3xl sm:text-5xl font-black text-primary dark:text-emerald-400 tracking-tighter mb-0.5 sm:mb-2 italic">
                            Lyang<span className="text-[#d4a574] not-italic">POS</span>
                        </h1>
                        <p className="text-[#8b6f47] dark:text-emerald-400/60 font-bold uppercase tracking-[0.2em] text-[10px]">
                            Hệ thống quản lý bán hàng thông minh • {new Date().getFullYear()}
                        </p>
                    </m.div>

                </div>

                <AnimatePresence mode="wait">
                    {showLoginForm ? (
                        /* Form Context Card */
                        <m.div
                            key="login-form-card"
                            initial={{ opacity: 0, scale: 0.95, y: 15, filter: 'blur(10px)' }}
                            animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0.01px)' }}
                            exit={{ opacity: 0, scale: 0.95, y: -15, filter: 'blur(10px)' }}
                            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                            className="bg-transparent rounded-[2rem] sm:rounded-[3rem] border sm:border-2 border-[#d4a574]/20 p-5 sm:p-8 shadow-2xl relative overflow-hidden group w-full"
                        >
                        {/* Decorative Wheat on Card */}
                        <div className="absolute -right-6 -bottom-6 opacity-[0.05] -rotate-12 group-hover:rotate-0 transition-transform duration-700 pointer-events-none">
                            <Wheat size={120} />
                        </div>

                        {users.length > 0 && (
                            <button 
                                type="button"
                                onClick={() => setShowLoginForm(false)}
                                className="w-full py-2 bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-[#8b6f47] dark:text-emerald-400/80 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all mb-4 border border-dashed border-slate-300 dark:border-slate-700/60"
                            >
                                ← Quay lại danh sách tài khoản
                            </button>
                        )}

                        {/* Login/Register Toggle */}
                        <div className="flex bg-[#faf8f3] dark:bg-slate-950/50 p-1 sm:p-1.5 rounded-[1.8rem] mb-4 sm:mb-8 relative border border-[#d4a574]/10">
                            <m.div
                                className="absolute inset-y-1.5 rounded-[1.4rem] bg-gradient-to-r from-[#2d5016] to-[#4a7c59] shadow-lg shadow-[#2d5016]/20"
                                initial={false}
                                animate={{
                                    left: isLogin ? '6px' : '50%',
                                    width: 'calc(50% - 6px)'
                                }}
                                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            />
                            <button
                                onClick={() => { setIsLogin(true); setIsSecretAdminMode(false); setError(''); }}
                                className={`flex-1 relative z-10 py-2.5 sm:py-3.5 text-[10px] sm:text-xs font-black uppercase tracking-wider transition-colors flex items-center justify-center gap-2 ${isLogin ? 'text-white' : 'text-[#8b6f47] hover:text-[#2d5016]'}`}
                            >
                                <LogIn size={16} className="w-4 h-4 sm:w-5 sm:h-5" /> Đăng nhập
                            </button>
                            <button
                                onClick={() => { 
                                    setIsLogin(false); 
                                    setIsSecretAdminMode(!isSecretAdminMode);
                                    setError(''); 
                                }}
                                className={`flex-1 relative z-10 py-2.5 sm:py-3.5 text-[10px] sm:text-xs font-black uppercase tracking-wider transition-colors flex items-center justify-center gap-2 ${!isLogin ? 'text-white' : 'text-[#8b6f47] hover:text-[#2d5016]'}`}
                            >
                                <ShieldCheck size={16} className="w-4 h-4 sm:w-5 sm:h-5" /> {isSecretAdminMode ? 'ĐK Admin' : 'Đăng ký'}
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-5">
                            {/* Mobile Quick Selector */}
                            {users.length > 0 && (
                                <div className="block md:hidden border-b border-[#d4a574]/10 pb-3 mb-2">
                                    <p className="text-[9px] font-black text-[#8b6f47] dark:text-emerald-400/60 uppercase tracking-widest mb-2">Chọn tài khoản nhanh:</p>
                                    <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
                                        {users.map(u => {
                                            const initial = (u.display_name || u.username || "?").charAt(0).toUpperCase();
                                            const gradients = [
                                                "from-emerald-500 to-teal-650",
                                                "from-rose-500 to-orange-600",
                                                "from-blue-500 to-indigo-600",
                                                "from-amber-500 to-yellow-600",
                                                "from-purple-500 to-pink-600"
                                            ];
                                            const gradIdx = (u.id || 0) % gradients.length;
                                            const gradient = gradients[gradIdx];
                                            const isSelected = formData.username === u.username;

                                            return (
                                                <button
                                                    key={u.id}
                                                    type="button"
                                                    onClick={() => handleSelectUser(u)}
                                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-wider shrink-0 transition-all ${
                                                        isSelected
                                                            ? "bg-[#2d5016] text-white border-[#2d5016]"
                                                            : "bg-white/30 dark:bg-slate-800/30 border-[#d4a574]/20 text-[#8b6f47] dark:text-emerald-400"
                                                    }`}
                                                >
                                                    <div className="w-4 h-4 rounded-full bg-transparent border border-[#d4a574]/25 flex items-center justify-center text-[#2d5016] dark:text-emerald-400 text-[8px] font-black">
                                                        {initial}
                                                    </div>
                                                    <span>{u.display_name?.split(' ')[0] || u.username}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                            <AnimatePresence mode="wait">
                                {!isLogin && (
                                    <m.div
                                        key="displayName"
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 20 }}
                                        className="space-y-1.5"
                                    >
                                        <label className="text-[10px] font-black text-[#8b6f47] uppercase ml-4">Tên hiển thị</label>
                                        <div className="relative group">
                                            <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-[#d4a574] group-focus-within:text-[#2d5016] transition-colors">
                                                <Sparkles size={18} />
                                            </div>
                                            <input
                                                type="text"
                                                className="w-full bg-[#faf8f3] dark:bg-slate-950/50 border-2 border-transparent focus:border-[#d4a574]/30 focus:bg-transparent rounded-[1rem] sm:rounded-2xl py-3 sm:py-4 pl-12 sm:pl-14 pr-4 text-[#2d5016] placeholder-[#8b6f47]/40 outline-none transition-all font-bold shadow-inner"
                                                placeholder="Họ tên của bạn..."
                                                value={formData.display_name}
                                                onChange={e => setFormData({ ...formData, display_name: e.target.value })}
                                                required={!isLogin}
                                            />
                                        </div>
                                        
                                        <AnimatePresence>
                                            {isSecretAdminMode && (
                                                <m.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: 'auto', opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    className="overflow-hidden space-y-1.5 mt-4"
                                                >
                                                    <label className="text-[10px] font-black text-rose-500 uppercase ml-4 flex items-center gap-2">
                                                        <Lock size={10} /> Mật khẩu bí mật cấp Admin
                                                    </label>
                                                    <div className="relative group">
                                                        <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-rose-400 group-focus-within:text-rose-600 transition-colors">
                                                            <ShieldCheck size={18} />
                                                        </div>
                                                        <input
                                                            type="password"
                                                            className="w-full bg-rose-50 dark:bg-rose-950/20 border-2 border-rose-200/50 focus:border-rose-500 rounded-[1rem] sm:rounded-2xl py-3 sm:py-4 pl-12 sm:pl-14 pr-4 text-rose-700 dark:text-rose-300 placeholder-rose-300 outline-none transition-all font-bold"
                                                            placeholder="Nhập mã bí mật..."
                                                            value={formData.admin_secret}
                                                            onChange={e => setFormData({ ...formData, admin_secret: e.target.value })}
                                                            required={isSecretAdminMode}
                                                        />
                                                    </div>
                                                </m.div>
                                            )}
                                        </AnimatePresence>
                                    </m.div>
                                )}
                            </AnimatePresence>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-[#8b6f47] uppercase ml-4">Tên đăng nhập</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-[#d4a574] group-focus-within:text-[#2d5016] transition-colors">
                                        <User size={18} />
                                    </div>
                                    <input
                                        type="text"
                                        className="w-full bg-[#faf8f3] dark:bg-slate-950/50 border-2 border-transparent focus:border-[#d4a574]/30 focus:bg-transparent rounded-[1rem] sm:rounded-2xl py-3 sm:py-4 pl-12 sm:pl-14 pr-4 text-[#2d5016] placeholder-[#8b6f47]/40 outline-none transition-all font-bold shadow-inner"
                                        placeholder="Username"
                                        value={formData.username}
                                        onChange={e => setFormData({ ...formData, username: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-[#8b6f47] uppercase ml-4">Mật khẩu</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-[#d4a574] group-focus-within:text-[#2d5016] transition-colors">
                                        <Lock size={18} />
                                    </div>
                                    <input
                                        id="welcome-password-input"
                                        type="password"
                                        className="w-full bg-[#faf8f3] dark:bg-slate-950/50 border-2 border-transparent focus:border-[#d4a574]/30 focus:bg-transparent rounded-[1rem] sm:rounded-2xl py-3 sm:py-4 pl-12 sm:pl-14 pr-4 text-[#2d5016] placeholder-[#8b6f47]/40 outline-none transition-all font-bold shadow-inner"
                                        placeholder="••••••••"
                                        value={formData.password}
                                        onChange={e => setFormData({ ...formData, password: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            {isLogin && (
                                <div className="flex items-center gap-2 ml-2">
                                    <label className="flex items-center gap-3 cursor-pointer group/check">
                                        <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all ${rememberMe ? 'bg-[#2d5016] border-[#2d5016]' : 'bg-transparent border-[#d4a574]/40 group-hover/check:border-[#2d5016]'}`}>
                                            {rememberMe && <m.div initial={{ scale: 0 }} animate={{ scale: 1 }}><ArrowRight size={12} className="text-white -rotate-45" /></m.div>}
                                        </div>
                                        <input
                                            type="checkbox"
                                            className="hidden"
                                            checked={rememberMe}
                                            onChange={e => setRememberMe(e.target.checked)}
                                        />
                                        <span className={`text-[11px] font-black transition-colors uppercase tracking-wider ${rememberMe ? 'text-[#2d5016]' : 'text-[#8b6f47] group-hover/check:text-[#2d5016]'}`}>
                                            Ghi nhớ tài khoản
                                        </span>
                                    </label>
                                </div>
                            )}

                            {error && (
                                <m.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="p-4 bg-red-50 dark:bg-red-950/20 border-2 border-red-200/50 dark:border-red-900/30 rounded-2xl text-red-600 dark:text-red-400 text-[11px] font-black text-center uppercase tracking-wider"
                                >
                                    {error}
                                </m.div>
                            )}

                            <button
                                id="login-form-submit-btn"
                                type="submit"
                                disabled={loading}
                                className="w-full bg-gradient-to-r from-[#2d5016] to-[#4a7c59] text-white font-black uppercase tracking-[0.2em] py-3.5 sm:py-4 rounded-2xl shadow-xl shadow-[#2d5016]/20 hover:shadow-[#2d5016]/40 active:scale-[0.98] transition-all flex items-center justify-center gap-3 mt-2 sm:mt-4 group disabled:opacity-50"
                            >
                                {loading ? (
                                    <div className="flex items-center gap-2">
                                        Đang xử lý...
                                    </div>
                                ) : (
                                    "Xác nhận"
                                )}
                            </button>
                        </form>
                        </m.div>
                    ) : (
                        /* Accounts Horizontal Scroll Row */
                        <m.div
                            key="accounts-row"
                            initial={{ opacity: 0, scale: 0.98, y: 10, filter: 'blur(5px)' }}
                            animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0.01px)' }}
                            exit={{ opacity: 0, scale: 0.98, y: -10, filter: 'blur(5px)' }}
                            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                            className="flex gap-6 overflow-x-auto w-full max-w-full py-8 px-4 no-scrollbar scroll-smooth items-stretch mt-4 snap-x snap-mandatory justify-start"
                        >
                            {/* Đăng nhập khác Card */}
                            <m.div
                                whileHover={{ y: -4, scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => {
                                    setShowLoginForm(true);
                                    setFormData({ username: '', password: '', display_name: '' });
                                }}
                                className="bg-white/60 dark:bg-slate-900/40 backdrop-blur-xl border-2 border-dashed border-slate-300 dark:border-slate-800 rounded-3xl p-5 flex flex-col items-center justify-center min-h-[160px] cursor-pointer shadow-lg hover:shadow-xl transition-all hover:border-[#2d5016] dark:hover:border-emerald-500 w-40 shrink-0 snap-start"
                            >
                                <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-4 border border-primary/20">
                                    <Plus size={24} />
                                </div>
                                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[#8b6f47] dark:text-emerald-450">Đăng nhập khác</span>
                            </m.div>

                            {/* Recent User Cards */}
                            {users.map(u => {
                                const initial = (u.display_name || u.username || "?").charAt(0).toUpperCase();

                                return (
                                    <m.div
                                        key={u.id}
                                        whileHover={{ y: -4, scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => handleSelectUser(u)}
                                        className="bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/50 dark:border-slate-800/45 rounded-3xl p-5 flex flex-col items-center justify-center min-h-[160px] shadow-lg hover:shadow-xl transition-all relative overflow-hidden group text-center cursor-pointer w-40 shrink-0 snap-start"
                                    >
                                        <div className="flex flex-col items-center justify-center w-full">
                                            <div className="relative mb-2 mt-1">
                                                <div className="w-16 h-16 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-200 font-black text-xl shadow-md border border-slate-200 dark:border-slate-700/80 ring-4 ring-slate-100 dark:ring-slate-800/40 group-hover:scale-105 transition-transform duration-300">
                                                    {initial}
                                                </div>
                                            </div>
                                            <h3 className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-wide text-center group-hover:text-[#2d5016] dark:group-hover:text-emerald-450 transition-colors mt-2">
                                                {u.display_name || u.username}
                                            </h3>
                                        </div>
                                    </m.div>
                                );
                            })}
                        </m.div>
                    )}
                </AnimatePresence>

                {/* Footer Credits */}
                <div className="text-center mt-6 sm:mt-10">
                    <p className="text-[#8b6f47]/40 dark:text-emerald-900 text-[10px] font-black uppercase tracking-[0.3em] flex items-center justify-center gap-2">
                        <Leaf size={12} /> LyangPOS Sustainable Agri System • 2024
                    </p>
                </div>
            </m.div>


        </div>
    );
}
