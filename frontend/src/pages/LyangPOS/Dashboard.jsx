import React, { useEffect, useState, memo, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Lunar } from 'lunar-javascript';
import { m, AnimatePresence, useReducedMotion, MotionConfig } from 'framer-motion';
import { Bar, Doughnut } from 'react-chartjs-2';
import CustomSelect from '../../components/CustomSelect';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    PointElement,
    LineElement,
    LineController,
    Filler
} from 'chart.js';
import {
    Leaf,
    Sun,
    Cloud,
    CloudRain,
    CloudLightning,
    CloudMoon,
    Moon,
    Wind,
    ThermometerSun,
    TrendingUp,
    TrendingDown,
    Calendar,
    AlertCircle,
    Users,
    Activity,
    Wallet,
    Sprout,
    Wheat,
    Droplets,
    Coins,
    MapPin,
    RefreshCw,
    Loader2,
    Truck,
    Package,
    ShoppingBag,
    DollarSign,
    PieChart,
    BarChart3,
    Clock,
    Zap,
    Award,
    Target,
    ArrowRight,
    ShoppingCart,
    Paintbrush,
    X,
    Image as ImageIcon,
    Trash2,
    Eye,
    EyeOff,
    Edit,
    Sparkles
} from 'lucide-react';
import { formatCurrency, formatNumber, formatDebt, cn } from '../../lib/utils';
import Toast from '../../components/Toast';
import LoadingOverlay from '../../components/LoadingOverlay';
import Portal from '../../components/Portal';
import preset1Signature from '../../assets/wallpapers/preset_1_signature.jpg';
import preset2Latte from '../../assets/wallpapers/preset_2_latte.jpg';
import presetFarmIllustration from '../../assets/wallpapers/preset_farm_illustration.jpg';
import presetMarketIllustration from '../../assets/wallpapers/preset_market_illustration.jpg';
import presetMascotFarm from '../../assets/wallpapers/preset_mascot_farm.jpg';
import presetMascotLatte from '../../assets/wallpapers/preset_mascot_latte.jpg';

const WALLPAPER_PRESETS = [
    { id: 1, name: "Signature Lyang", path: preset1Signature, desc: "Tối giản ấm cúng" },
    { id: 2, name: "Cafe Latte", path: preset2Latte, desc: "Cà phê & Trà" },
    { id: 3, name: "Nông Trại Xanh (Vector)", path: presetFarmIllustration, desc: "Đồi xanh & Xe táo" },
    { id: 4, name: "Tiệm Trái Cây (Story)", path: presetMarketIllustration, desc: "Gian hàng nông sản" },
    { id: 5, name: "Bé Mascot Nông Trại", path: presetMascotFarm, desc: "Đồi chè & Táo đỏ" },
    { id: 6, name: "Bé Mascot Đồng Quê", path: presetMascotLatte, desc: "Bình yên & Dễ đọc chữ" }
];

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    PointElement,
    LineElement,
    LineController,
    Filler
);

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.05,
            delayChildren: 0.02
        }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.98, filter: 'blur(4px)' },
    visible: {
        opacity: 1,
        y: 0,
        scale: 1,
        filter: 'blur(0.01px)',
        transition: {
            duration: 0.6,
            ease: [0.22, 1, 0.36, 1]
        }
    }
};


// Helper to get initials for partner avatar badges
const getInitials = (name) => {
    if (!name) return '??';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

// Premium Stat Card with Theme Gradient & Modern Styling
const StatCard = memo(({ title, value, icon: Icon, gradient, trend, subtitle, details, delay = 0 }) => {
    const shouldReduceMotion = useReducedMotion();
    return (
        <m.div
            layout="position"
            variants={itemVariants}
            whileHover={shouldReduceMotion ? {} : { y: -4, scale: 1.01, transition: { duration: 0.25 } }}
            className="relative overflow-hidden bg-transparent p-6 rounded-3xl border border-[#8b6f47]/20 dark:border-white/10 backdrop-blur-md shadow-none group h-full transition-all duration-300"
        >
            {/* Background Glow */}
            <div className={`absolute -top-16 -right-16 w-52 h-52 bg-gradient-to-br ${gradient} opacity-10 dark:opacity-20 rounded-full blur-3xl group-hover:opacity-20 group-hover:scale-110 transition-all duration-500`} />
            
            <div className="relative z-10 flex flex-col h-full justify-between">
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <div className={`p-3.5 rounded-2xl bg-gradient-to-br ${gradient} text-white shadow-xs group-hover:scale-105 transition-transform duration-300`}>
                            <Icon size={22} strokeWidth={2.2} />
                        </div>
                        {trend !== undefined && (
                            <m.div
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className={cn(
                                    "px-2.5 py-1 rounded-full flex items-center gap-1 text-[10px] font-black tracking-tight",
                                    trend >= 0 
                                        ? "bg-[#2d5016]/10 text-[#2d5016] border border-[#2d5016]/20 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30" 
                                        : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                                )}
                            >
                                {trend >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                                {Math.abs(trend)}%
                            </m.div>
                        )}
                    </div>

                    <div className="space-y-1">
                        <p className="text-[10px] font-black text-[#8b6f47] dark:text-[#d4a574] uppercase tracking-[0.2em]">
                            {title}
                        </p>
                        <h3 className="text-3xl lg:text-4xl font-black text-[#2d5016] dark:text-[#e8dfd5] tracking-tight transition-colors min-h-[40px] flex items-center overflow-hidden">
                            <AnimatePresence mode="wait">
                                <m.span
                                    key={value}
                                    initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
                                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                                    exit={{ opacity: 0, y: -10, filter: "blur(4px)" }}
                                    transition={{ duration: 0.2 }}
                                    className="inline-block"
                                >
                                    {value}
                                </m.span>
                            </AnimatePresence>
                        </h3>
                    </div>
                </div>
 
                <div className="mt-4 pt-3.5 border-t border-[#8b6f47]/15 dark:border-white/5">
                    {/* Breakdown Details */}
                    {details && details.length > 0 ? (
                        <div className="flex flex-wrap gap-x-4 gap-y-1.5">
                            {details.map((detail, idx) => (
                                <div key={idx} className="flex items-center gap-1.5 opacity-90 hover:opacity-100 transition-opacity">
                                    {detail.icon && <detail.icon size={11} className="text-[#2d5016] dark:text-emerald-400" />}
                                    <span className="text-[9px] font-black text-[#8b6f47] dark:text-[#d4a574] uppercase tracking-wider">{detail.label}:</span>
                                    <span className="text-[11px] font-black text-[#2d5016] dark:text-[#e8dfd5] overflow-hidden inline-flex h-4 items-center">
                                        <AnimatePresence mode="wait">
                                            <m.span
                                                key={detail.value}
                                                initial={{ opacity: 0, y: 4, filter: "blur(1px)" }}
                                                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                                                exit={{ opacity: 0, y: -4, filter: "blur(1px)" }}
                                                transition={{ duration: 0.15 }}
                                            >
                                                {typeof detail.value === 'string' ? detail.value : formatCurrency(detail.value)}
                                            </m.span>
                                        </AnimatePresence>
                                    </span>
                                </div>
                            ))}
                        </div>
                    ) : subtitle ? (
                        <div className="text-[11px] font-bold text-[#8b6f47]/80 dark:text-[#d4a574]/80 flex items-center gap-1.5">
                            <div className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${gradient}`} />
                            {subtitle}
                        </div>
                    ) : null}
                </div>
            </div>
        </m.div>
    );
});

// Mini Stat Card
const MiniStatCard = memo(({ icon: Icon, label, value, color = "emerald", onClick }) => (
    <m.div
        layout
        variants={itemVariants}
        whileHover={{ y: -3, scale: 1.01 }}
        onClick={onClick}
        className={cn(
            "flex items-center gap-4 p-4 bg-transparent border border-[#8b6f47]/20 dark:border-white/10 rounded-2xl shadow-none backdrop-blur-md transition-all",
            onClick && "cursor-pointer hover:border-[#2d5016]/40 dark:hover:border-emerald-500/40"
        )}
    >
        <div className="p-3 rounded-xl bg-[#2d5016]/10 text-[#2d5016] dark:bg-emerald-500/15 dark:text-emerald-400 border border-[#2d5016]/20 dark:border-emerald-500/30 shadow-none shrink-0">
            <Icon size={18} strokeWidth={2.2} />
        </div>
        <div className="flex-1 min-w-0">
            <p className="text-[9px] font-black text-[#8b6f47] dark:text-[#d4a574] uppercase tracking-[0.15em] mb-0.5 truncate">
                {label}
            </p>
            <p className="text-lg font-black text-[#2d5016] dark:text-[#e8dfd5] leading-tight truncate">
                {value}
            </p>
        </div>
    </m.div>
));

const getAvatarSrc = (url) => {
    if (!url || url === 'undefined' || url === 'null') return '';
    const normalized = url.replace(/\\/g, '/').trim();
    if (normalized.startsWith('preset:')) return normalized;
    if (normalized.startsWith('http') || normalized.startsWith('data:')) {
        return encodeURI(normalized);
    }
    const base = axios.defaults.baseURL || 'http://localhost:3579';
    const fullPath = `${base.replace(/\/+$/, '')}/${normalized.replace(/^\/+/, '')}`;
    return encodeURI(fullPath);
};

const CUTE_PRESETS = [
    { emoji: '🌾', gradient: 'from-amber-200 to-yellow-600', label: 'Lúa Vàng' },
    { emoji: '🥑', gradient: 'from-lime-300 to-lime-600', label: 'Bơ Ngọt' },
    { emoji: '🥬', gradient: 'from-green-300 to-emerald-600', label: 'Cải Xanh' },
    { emoji: '🍎', gradient: 'from-red-300 to-red-600', label: 'Táo Đỏ' },
    { emoji: '🥕', gradient: 'from-orange-300 to-orange-600', label: 'Cà Rốt' },
    { emoji: '🌻', gradient: 'from-yellow-300 to-amber-600', label: '🌻 Vui Vẻ' },
    { emoji: '🐱', gradient: 'from-purple-200 to-indigo-600', label: 'Mèo Ú' },
    { emoji: '🐶', gradient: 'from-blue-300 to-blue-600', label: 'Cún Con' },
    { emoji: '🐷', gradient: 'from-pink-200 to-pink-500', label: 'Heo Xinh' },
    { emoji: '🏪', gradient: 'from-teal-200 to-teal-600', label: 'Cửa Hàng' },
    { emoji: '☕', gradient: 'from-amber-200 to-stone-700', label: 'Cà Phê' },
    { emoji: '⚡', gradient: 'from-yellow-300 to-emerald-600', label: 'Tia Chớp' }
];

const ClockWidget = () => {
    const [currentTime, setCurrentTime] = useState(new Date());
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);
    return (
        <div className="flex-1 flex flex-col justify-center bg-transparent border border-[#8b6f47]/20 dark:border-white/10 rounded-3xl shadow-none p-5 backdrop-blur-md relative overflow-hidden group hover:border-[#2d5016]/40 transition-all">
            <div className="absolute -right-4 -top-4 opacity-[0.03] dark:opacity-[0.05] group-hover:scale-110 transition-transform duration-500 pointer-events-none text-[#2d5016] dark:text-emerald-400">
                <Clock size={100} />
            </div>
            <div className="flex flex-col relative z-10">
                <div className="text-4xl lg:text-5xl font-black text-[#2d5016] dark:text-[#e8dfd5] tracking-tight tabular-nums mb-1">
                    {currentTime.toLocaleTimeString('vi-VN', { hour12: false, hour: '2-digit', minute: '2-digit' })}
                </div>
                <div className="flex items-center gap-2 text-[#8b6f47] dark:text-[#d4a574] font-black text-[9px] sm:text-[10px] uppercase tracking-wider">
                    <Calendar size={12} className="text-[#2d5016] dark:text-emerald-400 shrink-0" />
                    <span className="truncate">
                        {currentTime.toLocaleDateString('vi-VN', { weekday: 'short', day: 'numeric', month: 'short' })}
                        <span className="mx-1.5 opacity-40">•</span>
                        <span className="text-[#2d5016] dark:text-emerald-400">
                            ÂL {Lunar.fromDate(currentTime).getDay()}/{Lunar.fromDate(currentTime).getMonth()}
                        </span>
                    </span>
                </div>
            </div>
        </div>
    );
};

export default function Dashboard() {
    const navigate = useNavigate();
    const [hideStats, setHideStats] = useState(() => localStorage.getItem('hide_dashboard_stats') === 'true');
    const [stats, setStats] = useState({
        revenue: 0, cash_revenue: 0, debt_revenue: 0, profit: 0, customer_debt: 0, supplier_debt: 0,
        customer_debt_list: [], supplier_debt_list: [],
        chart: { labels: [], data: [], profit_data: [] },
        expiry: { near: 0, expired: 0 },
        low_stock: 0
    });
    const [remoteInfo, setRemoteInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        year: new Date().getFullYear().toString(),
        month: (new Date().getMonth() + 1).toString().padStart(2, '0'),
        day: new Date().getDate().toString().padStart(2, '0')
    });
    const [weather, setWeather] = useState({ temp: 28, desc: 'Nắng nhẹ', icon: Sun, city: 'Vụ mùa' });
    const [isWeatherLoading, setIsWeatherLoading] = useState(false);
    const [showMascot, setShowMascot] = useState(localStorage.getItem('ui_show_dashboard_mascot') !== 'false');
    const [animateMascot, setAnimateMascot] = useState(() => localStorage.getItem('ui_mascot_animate') === 'true');
    const [mascotConfig, setMascotConfig] = useState({ x: 0, y: 0, scale: 1.5 });
    const [avatarUrl, setAvatarUrl] = useState(localStorage.getItem('user_avatar') || '');
    const [showAvatarModal, setShowAvatarModal] = useState(false);
    const [toast, setToast] = useState(null);
    const fileInputRef = useRef(null);

    const [showWallpaperSettings, setShowWallpaperSettings] = useState(false);
    const [appWallpaper, setAppWallpaper] = useState(() => {
        const saved = localStorage.getItem("pos_cart_wallpaper");
        return saved ? JSON.parse(saved) : { image: "", size: "cover", position: "center", blur: 0, opacity: 100 };
    });

    const compressAndSetWallpaper = (file) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement("canvas");
                const ctx = canvas.getContext("2d");
                
                // Limit max dimension to 1200px to keep storage usage low
                const maxDim = 1200;
                let width = img.width;
                let height = img.height;
                if (width > maxDim || height > maxDim) {
                    if (width > height) {
                        height = Math.round((height * maxDim) / width);
                        width = maxDim;
                    } else {
                        width = Math.round((width * maxDim) / height);
                        height = maxDim;
                    }
                }
                
                canvas.width = width;
                canvas.height = height;
                ctx.drawImage(img, 0, 0, width, height);
                
                // Compress as JPEG to save space
                const compressedBase64 = canvas.toDataURL("image/jpeg", 0.7);
                
                // Check if size is within reasonable storage limits (standard quota ~5MB total)
                if (compressedBase64.length > 2 * 1024 * 1024) {
                    setToast({ message: "Ảnh quá lớn ngay cả sau khi nén. Vui lòng chọn ảnh khác.", type: "error" });
                    return;
                }
                
                setAppWallpaper(prev => ({ ...prev, image: compressedBase64 }));
            };
            img.onerror = () => {
                setAppWallpaper(prev => ({ ...prev, image: event.target.result }));
            };
            img.src = event.target.result;
        };
        reader.onerror = () => {
            setToast({ message: "Không thể đọc file hình ảnh.", type: "error" });
        };
        reader.readAsDataURL(file);
    };

    useEffect(() => {
        try {
            localStorage.setItem("pos_cart_wallpaper", JSON.stringify(appWallpaper));
            window.dispatchEvent(new Event("app_wallpaper_changed"));
        } catch (e) {
            console.error("Failed to save wallpaper to localStorage", e);
            setToast({ 
                message: "Không thể lưu hình nền do vượt quá giới hạn bộ nhớ trình duyệt.", 
                type: "error" 
            });
        }
    }, [appWallpaper]);

    const [gpuDisabled, setGpuDisabled] = useState(() => localStorage.getItem("pos_gpu_disabled") === "true");

    useEffect(() => {
        const handleGpuState = () => {
            setGpuDisabled(localStorage.getItem("pos_gpu_disabled") === "true");
        };
        window.addEventListener("gpu_state_changed", handleGpuState);
        window.addEventListener("storage", handleGpuState);
        return () => {
            window.removeEventListener("gpu_state_changed", handleGpuState);
            window.removeEventListener("storage", handleGpuState);
        };
    }, []);

    useEffect(() => {
        // Data Sync Channel for REALTIME UPDATE
        const syncChannel = new BroadcastChannel('pos_data_sync');
        syncChannel.onmessage = (e) => {
            if (e.data.type === 'PARTNER_UPDATED') {
                fetchData(true); // Silent refresh
            }
        };

        return () => {
            syncChannel.close();
        };
    }, []);

    useEffect(() => {
        const saved = localStorage.getItem('mascot_config');
        if (saved) {
            try {
                setMascotConfig(JSON.parse(saved));
            } catch (e) {
                console.error("Error loading mascot config", e);
            }
        }

        const handleStorageChange = () => {
            setShowMascot(localStorage.getItem('ui_show_dashboard_mascot') !== 'false');
        };
        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    const saveMascotConfig = (updates) => {
        const newConfig = { ...mascotConfig, ...updates };
        setMascotConfig(newConfig);
        localStorage.setItem('mascot_config', JSON.stringify(newConfig));
    };

    const handleDragEnd = (event, info) => {
        saveMascotConfig({ x: mascotConfig.x + info.offset.x, y: mascotConfig.y + info.offset.y });
    };

    const fetchWeather = async (lat = null, lon = null, cityName = null) => {
        setIsWeatherLoading(true);
        try {
            let latitude = lat;
            let longitude = lon;
            let city = cityName;

            if (!latitude || !longitude) {
                const savedLoc = localStorage.getItem('weather_location');
                if (savedLoc && savedLoc !== 'undefined') {
                    try {
                        const parsed = JSON.parse(savedLoc);
                        latitude = parsed.latitude;
                        longitude = parsed.longitude;
                        city = parsed.city;
                    } catch (err) {
                        console.error("Error parsing saved weather location", err);
                        localStorage.removeItem('weather_location');
                    }
                }
            }

            const params = {};
            if (latitude && longitude) {
                params.latitude = latitude;
                params.longitude = longitude;
            }
            if (city) {
                params.city = city;
            }

            const res = await axios.get('/api/weather', { params });
            const data = res.data;

            let Icon = Sun;
            const weathercode = data.weathercode;
            if (weathercode === 0) Icon = Sun;
            else if (weathercode <= 3) Icon = Cloud;
            else if (weathercode <= 48) Icon = Wind;
            else if (weathercode <= 67) Icon = CloudRain;
            else if (weathercode <= 82) Icon = CloudRain;
            else if (weathercode <= 99) Icon = CloudLightning;

            setWeather({
                temp: data.temp,
                desc: data.desc,
                city: data.city || 'Vụ mùa',
                icon: Icon
            });

            if (data.latitude && data.longitude) {
                localStorage.setItem('weather_location', JSON.stringify({ 
                    latitude: data.latitude, 
                    longitude: data.longitude, 
                    city: data.city 
                }));
            }

        } catch (e) {
            console.error("Weather fetch failed", e);
        } finally {
            setIsWeatherLoading(false);
        }
    };

    const handleSyncGPS = () => {
        if (!navigator.geolocation) {
            setToast({ message: 'Trình duyệt của bạn không hỗ trợ định vị.', type: 'error' });
            return;
        }
        setIsWeatherLoading(true);
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                await fetchWeather(latitude, longitude, "Vị trí của tôi");
                setToast({ message: 'Đồng bộ vị trí GPS thành công!', type: 'success' });
            },
            async (err) => {
                console.warn("GPS synchronization failed, falling back to IP geolocation", err);
                try {
                    setToast({ message: 'Định vị GPS không thành công. Đang tự động định vị qua IP...', type: 'info' });
                    await fetchWeather();
                    setToast({ message: 'Định vị IP thành công! Bạn có thể click vào tên địa điểm để nhập thủ công.', type: 'success' });
                } catch (ipErr) {
                    console.error("IP fallback failed", ipErr);
                    setToast({ message: "Không thể lấy vị trí. Click vào tên địa điểm để nhập thủ công.", type: 'error' });
                } finally {
                    setIsWeatherLoading(false);
                }
            },
            { enableHighAccuracy: false, timeout: 5000, maximumAge: 10000 }
        );
    }

    const handleEditLocation = async (e) => {
        if (e) e.stopPropagation();
        const currentCity = weather.city && weather.city !== 'Vụ mùa' && weather.city !== 'Vị trí của tôi' ? weather.city : '';
        const newCity = prompt("Nhập tên Thành phố/Tỉnh của bạn (Ví dụ: Hải Phòng, Đà Nẵng, TP.HCM):", currentCity);
        if (newCity === null) return; // User cancelled
        
        if (newCity.trim() === "") {
            setToast({ message: 'Vui lòng nhập tên địa điểm hợp lệ.', type: 'error' });
            return;
        }

        setIsWeatherLoading(true);
        try {
            const res = await axios.get('/api/weather', { params: { city: newCity.trim() } });
            const data = res.data;
            if (data.status === 'success') {
                let Icon = Sun;
                const weathercode = data.weathercode;
                if (weathercode === 0) Icon = Sun;
                else if (weathercode <= 3) Icon = Cloud;
                else if (weathercode <= 48) Icon = Wind;
                else if (weathercode <= 67) Icon = CloudRain;
                else if (weathercode <= 82) Icon = CloudRain;
                else if (weathercode <= 99) Icon = CloudLightning;

                setWeather({
                    temp: data.temp,
                    desc: data.desc,
                    city: data.city || newCity.trim(),
                    icon: Icon
                });

                localStorage.setItem('weather_location', JSON.stringify({ 
                    latitude: data.latitude, 
                    longitude: data.longitude, 
                    city: data.city || newCity.trim()
                }));
                setToast({ message: `Cập nhật địa điểm thành ${data.city || newCity.trim()} thành công!`, type: 'success' });
            } else {
                setToast({ message: 'Không tìm thấy vị trí yêu cầu.', type: 'error' });
            }
        } catch (err) {
            console.error("Manual geocoding failed", err);
            setToast({ message: "Không thể lấy vị trí. Vui lòng thử lại.", type: 'error' });
        } finally {
            setIsWeatherLoading(false);
        }
    };

    useEffect(() => {
        fetchWeather();
        const interval = setInterval(() => fetchWeather(), 600000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const fetchGlobalSettings = async () => {
            try {
                const res = await axios.get('/api/settings');
                if (res.data && res.data.user_avatar) {
                    localStorage.setItem('user_avatar', res.data.user_avatar);
                    setAvatarUrl(res.data.user_avatar);
                }
            } catch (err) {
                console.error("Failed to fetch user_avatar setting", err);
            }
        };
        fetchGlobalSettings();
    }, []);

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 5) return { text: "Chúc ngủ ngon", icon: Moon, desc: "Nghỉ ngơi để ngày mai tràn đầy năng lượng" };
        if (hour < 11) return { text: "Chào buổi sáng", icon: ThermometerSun, desc: "Bắt đầu ngày mới với tinh thần phấn chấn" };
        if (hour < 14) return { text: "Chào buổi trưa", icon: Sun, desc: "Nghỉ ngơi để tiếp tục chinh phục mục tiêu" };
        if (hour < 18) return { text: "Chào buổi chiều", icon: Wind, desc: "Hoàn thiện công việc trong ngày hôm nay" };
        return { text: "Chào buổi tối", icon: CloudMoon, desc: "Tổng kết và chuẩn bị cho ngày mai" };
    };

    const greeting = getGreeting();

    const handleAvatarUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const formData = new FormData();
        formData.append('file', file);
        try {
            const res = await axios.post('/api/upload-logo', formData);
            const url = res.data.url;
            setAvatarUrl(url);
            localStorage.setItem('user_avatar', url);
            
            // Save globally to database settings
            await axios.post('/api/settings', { user_avatar: url });
        } catch (err) {
            console.error("Avatar upload failed", err);
        }
    };

    const fetchData = async (isSilent = false) => {
        if (!isSilent) setLoading(true);
        try {
            const params = new URLSearchParams(filters);
            const [statsRes, ipRes] = await Promise.all([
                axios.get(`/api/dashboard-stats?${params.toString()}`),
                axios.get('/api/ip')
            ]);
            setStats(statsRes.data);
            setRemoteInfo(ipRes.data);
        } catch (error) {
            console.error("Failed to fetch dashboard stats", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [filters]);

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    // Chart Data with Natural Gradients
    const chartData = {
        labels: stats.chart?.labels || [],
        datasets: [
            {
                type: 'bar',
                label: 'Doanh thu',
                data: stats.chart?.data || [],
                backgroundColor: (context) => {
                    const ctx = context.chart.ctx;
                    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
                    gradient.addColorStop(0, '#10b981');
                    gradient.addColorStop(1, '#064e3b');
                    return gradient;
                },
                borderRadius: 12,
                barThickness: 24,
                order: 2,
            },
            {
                type: 'line',
                label: 'Lợi nhuận',
                data: stats.chart?.profit_data || [],
                borderColor: '#fbbf24',
                backgroundColor: 'rgba(251, 191, 36, 0.1)',
                borderWidth: 4,
                pointBackgroundColor: '#fbbf24',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 6,
                pointHoverRadius: 8,
                tension: 0.4,
                fill: true,
                order: 1,
            }
        ],
    };

    // Doughnut Chart for Debt Distribution
    const debtChartData = {
        labels: ['Khách hàng nợ', 'Nợ nhà cung cấp'],
        datasets: [{
            data: [Math.abs(stats.customer_debt), Math.abs(stats.supplier_debt)],
            backgroundColor: (context) => {
                const ctx = context.chart.ctx;
                const g1 = ctx.createLinearGradient(0, 0, 0, 400);
                g1.addColorStop(0, '#10b981');
                g1.addColorStop(1, '#064e3b');
                
                const g2 = ctx.createLinearGradient(0, 0, 0, 400);
                g2.addColorStop(0, '#fbbf24');
                g2.addColorStop(1, '#92400e');
                
                return [g1, g2];
            },
            hoverBackgroundColor: ['#34d399', '#fcd34d'],
            borderColor: 'rgba(255,255,255,0.1)',
            borderWidth: 2,
            borderRadius: 15,
            spacing: 5,
            cutout: '78%',
        }]
    };

    const chartOptions = (title) => ({
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                titleColor: '#1a300d',
                bodyColor: '#1a300d',
                padding: 12,
                boxPadding: 6,
                usePointStyle: true,
                borderColor: 'rgba(16, 185, 129, 0.2)',
                borderWidth: 1,
                callbacks: {
                    label: (context) => ` ${context.label}: ${formatCurrency(context.raw)}`
                }
            },
            title: {
                display: false
            },
        },
        scales: {
            y: {
                beginAtZero: true,
                grid: { color: 'rgba(16, 185, 129, 0.05)', drawBorder: false },
                ticks: { font: { family: "'Be Vietnam Pro', sans-serif" }, color: 'rgba(52, 211, 153, 0.5)' }
            },
            x: {
                grid: { display: false },
                ticks: { font: { family: "'Be Vietnam Pro', sans-serif" }, color: 'rgba(52, 211, 153, 0.5)' }
            }
        },
        animation: false
    });

    const doughnutOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                titleColor: '#1a300d',
                bodyColor: '#1a300d',
                padding: 15,
                cornerRadius: 15,
                boxPadding: 6,
                usePointStyle: true,
                callbacks: {
                    label: (context) => ` ${context.label}: ${formatCurrency(context.raw)}`
                }
            }
        },
        cutout: '78%',
        animation: false
    };

    return (
        <MotionConfig reducedMotion={gpuDisabled ? "always" : "no-preference"}>
        <m.div
            id="dashboard-root-container"
            layout="position"
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className={cn("p-6 space-y-6 min-h-screen relative overflow-y-auto no-scrollbar bg-transparent transition-colors duration-700", gpuDisabled ? "gpu-disabled-mode" : "")}
        >

            {/* Cute Avatar Picker Modal */}
            <Portal>
                <AnimatePresence>
                    {showAvatarModal && (
                        <div className="fixed inset-0 z-[500000] flex items-center justify-center p-4 bg-slate-950/40 dark:bg-black/60 overflow-y-auto">
                            {/* Backdrop */}
                            <m.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setShowAvatarModal(false)}
                                className="absolute inset-0"
                            />
 
                            {/* Modal Content */}
                            <m.div
                                initial={{ scale: 0.95, opacity: 0, y: 10 }}
                                animate={{ scale: 1, opacity: 1, y: 0 }}
                                exit={{ scale: 0.95, opacity: 0, y: 10 }}
                                className="bg-card w-full max-w-md rounded-2xl border border-border flex flex-col relative z-10 overflow-hidden shadow-2xl text-left"
                            >
                                {/* Header */}
                                <div className="p-5 flex items-center justify-between border-b border-border bg-card">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20">
                                            <ImageIcon className="text-primary" size={20} />
                                        </div>
                                        <div>
                                            <h3 className="text-base font-bold text-foreground uppercase tracking-wide leading-tight">Cá nhân hóa Avatar</h3>
                                            <p className="text-muted-foreground text-[10px] font-medium uppercase tracking-widest mt-0.5">Chọn icon ngộ nghĩnh hoặc tải ảnh lên</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setShowAvatarModal(false)}
                                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-transparent hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                                    >
                                        <X size={16} strokeWidth={2.5} />
                                    </button>
                                </div>
 
                                <div className="p-6 flex flex-col gap-5 overflow-y-auto max-h-[70vh] bg-card/50">
                                    {/* Cute Presets Grid */}
                                    <div className="space-y-3">
                                        <label className="text-sm font-bold text-foreground/80 uppercase tracking-wider">Chọn icon cute có sẵn</label>
                                        <div className="grid grid-cols-4 gap-3">
                                            {CUTE_PRESETS.map((preset, index) => (
                                                <m.button
                                                    key={index}
                                                    whileHover={{ scale: 1.08, y: -2 }}
                                                    whileTap={{ scale: 0.95 }}
                                                    onClick={async () => {
                                                        const val = `preset:${preset.emoji}|${preset.gradient}`;
                                                        setAvatarUrl(val);
                                                        localStorage.setItem('user_avatar', val);
                                                        await axios.post('/api/settings', { user_avatar: val });
                                                        setShowAvatarModal(false);
                                                    }}
                                                    className={cn(
                                                        "aspect-square rounded-xl bg-gradient-to-br flex flex-col items-center justify-center p-2 text-3xl shadow-none border border-white/20 relative group/btn cursor-pointer",
                                                        preset.gradient
                                                    )}
                                                >
                                                    <span>{preset.emoji}</span>
                                                    <span className="absolute bottom-1 text-[8px] font-black text-white/80 uppercase tracking-tighter opacity-0 group-hover/btn:opacity-100 transition-opacity">
                                                        {preset.label}
                                                    </span>
                                                </m.button>
                                            ))}
                                        </div>
                                    </div>
 
                                    {/* Custom File Upload Option */}
                                    <div className="border-t border-border pt-4 space-y-3">
                                        <label className="text-sm font-bold text-foreground/80 uppercase tracking-wider">Hoặc tải ảnh từ thiết bị của bạn</label>
                                        <button
                                            onClick={() => {
                                                fileInputRef.current?.click();
                                                setShowAvatarModal(false);
                                            }}
                                            className="w-full py-3 bg-primary text-primary-foreground font-semibold rounded-xl transition-all flex items-center justify-center gap-2 hover:bg-primary-hover cursor-pointer text-sm shadow-sm"
                                        >
                                            <ShoppingBag size={16} /> Tải ảnh lên từ máy tính
                                        </button>
                                    </div>

                                    {/* Delete Current Avatar */}
                                    {avatarUrl && (
                                        <div className="border-t border-border pt-4">
                                            <button
                                                onClick={async () => {
                                                    setAvatarUrl('');
                                                    localStorage.setItem('user_avatar', '');
                                                    await axios.post('/api/settings', { user_avatar: '' });
                                                    setShowAvatarModal(false);
                                                }}
                                                className="w-full py-3 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-red-400 font-semibold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer text-sm"
                                            >
                                                <Trash2 size={16} /> Trở về Logo mặc định
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </m.div>
                        </div>
                    )}
                </AnimatePresence>
            </Portal>

            <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-4 lg:gap-6 pb-12 max-w-[1600px] mx-auto">
                {/* 1. Header Hero - Span 6 */}
                <m.div 
                    variants={itemVariants} 
                    className="md:col-span-12 xl:col-span-6 relative overflow-hidden p-6 lg:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 bg-transparent border-none shadow-none"
                >
                    <div className="flex flex-col sm:flex-row items-center gap-6 relative z-10 text-center sm:text-left w-full">
                        {/* Modern Avatar Container */}
                        <div className="relative group shrink-0">
                            <m.div
                                whileHover={{ scale: 1.05, rotate: 2 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setShowAvatarModal(true)}
                                className="w-28 h-28 lg:w-32 lg:h-32 rounded-[1.5rem] p-0.5 bg-gradient-to-br from-[#2d5016] via-[#3d6e1e] to-[#8b6f47] shadow-none cursor-pointer overflow-hidden border-2 border-white/20"
                            >
                                <div className="w-full h-full rounded-[1.1rem] overflow-hidden bg-transparent flex items-center justify-center">
                                    {getAvatarSrc(avatarUrl) ? (
                                        getAvatarSrc(avatarUrl).startsWith('preset:') ? (
                                            (() => {
                                                const [emoji, gradient] = getAvatarSrc(avatarUrl).replace('preset:', '').split('|');
                                                return (
                                                    <div className={cn("w-full h-full flex items-center justify-center text-5xl lg:text-6xl select-none bg-gradient-to-br", gradient)}>
                                                        {emoji}
                                                    </div>
                                                );
                                            })()
                                        ) : (
                                            <img 
                                                src={getAvatarSrc(avatarUrl)} 
                                                alt="Avatar" 
                                                className="w-full h-full object-cover" 
                                            />
                                        )
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-white/10">
                                            <img src="/logo.png" alt="Logo LyangPOS" className="w-[85%] h-[85%] object-contain drop-shadow-md" />
                                        </div>
                                    )}
                                </div>
                            </m.div>
                            <input type="file" ref={fileInputRef} onChange={handleAvatarUpload} className="hidden" accept="image/*" />
                        </div>
 
                        {/* Greeting Message */}
                        <div className="flex-1">
                            <h2 className="text-4xl lg:text-5xl xl:text-6xl font-black text-[#2d5016] dark:text-[#e8dfd5] tracking-tight mb-2 drop-shadow-none">
                                {greeting.text}
                            </h2>
                            <p className="text-base lg:text-lg text-[#8b6f47] dark:text-[#d4a574] font-black flex items-center justify-center sm:justify-start gap-2.5 tracking-wide">
                                <Wheat size={18} className="text-[#2d5016] dark:text-emerald-400" />
                                {greeting.desc}
                            </p>
                            <div className="flex items-center gap-2 mt-3">
                                <button
                                    onClick={() => setShowWallpaperSettings(true)}
                                    className="px-3 py-1.5 bg-[#2d5016]/10 text-[#2d5016] dark:bg-emerald-500/15 dark:text-emerald-300 hover:bg-[#2d5016] hover:text-white rounded-xl text-[11px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 border border-[#2d5016]/20 cursor-pointer"
                                >
                                    <Paintbrush size={14} /> Hình Nền
                                </button>
                                <button
                                    onClick={() => setHideStats(prev => {
                                        const next = !prev;
                                        localStorage.setItem('hide_dashboard_stats', String(next));
                                        return next;
                                    })}
                                    className="p-1.5 bg-[#2d5016]/10 text-[#2d5016] dark:bg-emerald-500/15 dark:text-emerald-300 hover:bg-[#2d5016] hover:text-white rounded-xl transition-all flex items-center justify-center border border-[#2d5016]/20 cursor-pointer overflow-hidden"
                                    title={hideStats ? "Hiện chỉ số" : "Ẩn chỉ số"}
                                >
                                    <AnimatePresence mode="wait">
                                        <m.div
                                            key={hideStats ? "hidden" : "visible"}
                                            initial={{ opacity: 0, rotate: -45, scale: 0.8 }}
                                            animate={{ opacity: 1, rotate: 0, scale: 1 }}
                                            exit={{ opacity: 0, rotate: 45, scale: 0.8 }}
                                            transition={{ duration: 0.15 }}
                                            className="flex items-center justify-center"
                                        >
                                            {hideStats ? <EyeOff size={14} /> : <Eye size={14} />}
                                        </m.div>
                                    </AnimatePresence>
                                </button>
                            </div>
                        </div>
                    </div>
                </m.div>

                {/* 2. Top Right Box: Filters & Info - Span 6 */}
                <m.div variants={itemVariants} className="md:col-span-12 xl:col-span-6 flex flex-col justify-between gap-4">
                    {/* Top Row: Weather & Clock */}
                    <div className="flex gap-4 h-full">
                        <ClockWidget />

                        {/* Weather */}
                        <div 
                            onClick={handleSyncGPS} 
                            className="flex-1 flex flex-col justify-center bg-transparent border border-[#8b6f47]/20 dark:border-white/10 rounded-3xl shadow-none p-5 backdrop-blur-md cursor-pointer hover:border-[#2d5016]/40 transition-all group relative overflow-hidden"
                            title="Click để đồng bộ vị trí GPS"
                        >
                            <div className="absolute -left-4 -bottom-4 opacity-[0.03] dark:opacity-[0.05] group-hover:scale-110 group-hover:rotate-12 transition-all duration-500 pointer-events-none text-[#2d5016] dark:text-emerald-400">
                                <weather.icon size={100} />
                            </div>
                            <div className="flex justify-between items-center mb-1 relative z-10">
                                <div className="p-2 rounded-2xl bg-[#2d5016]/10 text-[#2d5016] dark:bg-emerald-500/15 dark:text-emerald-400 border border-[#2d5016]/20 dark:border-emerald-500/30 group-hover:scale-110 transition-transform">
                                    <weather.icon size={26} strokeWidth={2.2} />
                                </div>
                                <div className="flex items-center gap-2">
                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleSyncGPS();
                                        }}
                                        disabled={isWeatherLoading}
                                        className="text-[9px] font-black text-[#2d5016] dark:text-emerald-400 bg-[#2d5016]/10 border border-[#2d5016]/20 hover:bg-[#2d5016] hover:text-white active:scale-95 px-2.5 py-1.5 rounded-full flex items-center gap-1 transition-all relative z-20 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                        title="Định vị vị trí hiện tại"
                                    >
                                        {isWeatherLoading ? (
                                            <Loader2 size={10} className="animate-spin" />
                                        ) : (
                                            <MapPin size={10} />
                                        )}
                                        {isWeatherLoading ? 'ĐANG LẤY VỊ TRÍ...' : 'ĐỊNH VỊ'}
                                    </button>
                                    <span className="text-4xl font-black text-[#2d5016] dark:text-[#e8dfd5] tracking-tight">
                                        {weather.temp}°
                                    </span>
                                </div>
                            </div>
                            <div className="text-[9px] sm:text-[10px] font-black uppercase text-[#8b6f47] dark:text-[#d4a574] tracking-wider mt-1 relative z-10 flex flex-col sm:flex-row sm:items-center sm:gap-2">
                                <span 
                                    onClick={handleEditLocation} 
                                    className="hover:text-[#2d5016] dark:hover:text-emerald-300 cursor-pointer flex items-center gap-1 group/city bg-[#2d5016]/5 hover:bg-[#2d5016]/10 px-2 py-0.5 rounded-md transition-all inline-flex max-w-full"
                                    title="Click để nhập địa điểm thủ công"
                                >
                                    <span className="truncate">{weather.city}</span>
                                    <Edit size={10} className="opacity-60 group-hover/city:opacity-100 transition-opacity shrink-0" />
                                </span>
                                <span className="hidden sm:inline opacity-40">•</span>
                                <span className="text-[#2d5016] dark:text-emerald-400">{weather.desc}</span>
                            </div>
                        </div>
                    </div>

                    {/* Filter & IP Row */}
                    <div className="bg-transparent border border-[#8b6f47]/20 dark:border-white/10 px-5 py-4 rounded-3xl shadow-none backdrop-blur-md flex flex-wrap lg:flex-nowrap items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-[#2d5016]/10 text-[#2d5016] dark:bg-emerald-500/15 dark:text-emerald-400 rounded-xl border border-[#2d5016]/20">
                                <Calendar size={18} />
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <CustomSelect
                                    className="min-w-[80px]"
                                    value={filters.day}
                                    onChange={(e) => handleFilterChange({ target: { name: 'day', value: e.target.value } })}
                                    options={[
                                        { value: "", label: "Ngày" },
                                        ...[...Array(31)].map((_, i) => {
                                            const val = (i + 1).toString().padStart(2, '0');
                                            return { value: val, label: String(i + 1) };
                                        })
                                    ]}
                                />
                                <CustomSelect
                                    className="min-w-[90px]"
                                    value={filters.month}
                                    onChange={(e) => handleFilterChange({ target: { name: 'month', value: e.target.value } })}
                                    options={[
                                        { value: "", label: "Tháng" },
                                        ...[...Array(12)].map((_, i) => {
                                            const val = (i + 1).toString().padStart(2, '0');
                                            return { value: val, label: `Th.${i + 1}` };
                                        })
                                    ]}
                                />
                                <CustomSelect
                                    className="min-w-[80px]"
                                    value={filters.year}
                                    onChange={(e) => handleFilterChange({ target: { name: 'year', value: e.target.value } })}
                                    options={[
                                        { value: "", label: "Năm" },
                                        ...[2024, 2025, 2026, 2027, 2028].map(y => ({ value: String(y), label: String(y) }))
                                    ]}
                                />
                            </div>
                        </div>
                        {remoteInfo && (
                            <div className="flex items-center gap-2 px-4 py-2 bg-[#2d5016]/10 rounded-xl text-[10px] font-black text-[#2d5016] dark:text-emerald-400 border border-[#2d5016]/20">
                                <Activity size={14} />
                                {remoteInfo.ip}:{remoteInfo.port}
                            </div>
                        )}
                    </div>
                </m.div>

                {/* 3. Main Stats - Full Width */}
                <m.div variants={itemVariants} className="md:col-span-12 xl:col-span-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                    <StatCard title="Doanh thu" value={hideStats ? "********" : formatCurrency(stats.revenue)} icon={Wheat} gradient="from-[#2d5016] to-[#1e3a10]" trend={stats.revenue_trend} details={[ { label: 'Tiền mặt', value: hideStats ? "********" : (stats.cash_revenue || 0), icon: Wallet }, { label: 'Công nợ', value: hideStats ? "********" : (stats.debt_revenue || 0), icon: Users } ]} />
                    <StatCard title="Lợi nhuận" value={hideStats ? "********" : formatCurrency(stats.profit)} icon={Coins} gradient="from-[#8b6f47] to-[#5c4728]" trend={stats.profit_trend} subtitle="Sau khi trừ vốn nhập" />
                    <StatCard title="Tổng nợ thu" value={hideStats ? "********" : formatCurrency(Math.abs(stats.customer_debt))} icon={Users} gradient="from-[#3d6e1e] to-[#2d5016]" subtitle="Khách hàng còn nợ" />
                    <StatCard title="Tổng nợ trả" value={hideStats ? "********" : formatCurrency(Math.abs(stats.supplier_debt))} icon={Truck} gradient="from-rose-600 to-rose-800" subtitle="Nợ nhà cung cấp" />
                </m.div>

                {/* 4. Quick Metrics - Full Width */}
                <m.div variants={itemVariants} className="md:col-span-12 xl:col-span-12 grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                    <MiniStatCard icon={Package} label="Sắp hết hạn" value={stats.expiry?.near || 0} onClick={() => navigate('/products?filter=near_expiry')} />
                    <MiniStatCard icon={AlertCircle} label="Đã quá hạn" value={stats.expiry?.expired || 0} onClick={() => navigate('/products?filter=expired')} />
                    <MiniStatCard icon={ShoppingBag} label="Cần nhập ngay" value={stats.low_stock || 0} onClick={() => navigate('/products?filter=warning')} />
                    <MiniStatCard icon={Target} label="Tỷ suất LN" value={stats.revenue > 0 ? `${((stats.profit / stats.revenue) * 100).toFixed(1)}%` : '0%'} />
                </m.div>

                {/* 5. Charts - Bar Span 8, Pie Span 4 */}
                <m.div layout="position" variants={itemVariants} className="md:col-span-12 xl:col-span-8 bg-transparent p-6 lg:p-8 rounded-3xl border border-[#8b6f47]/20 dark:border-white/10 shadow-none backdrop-blur-md relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-[#2d5016]/5 rounded-full blur-3xl -mr-32 -mt-32" />
                    
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 relative z-10 gap-4">
                        <div>
                            <h3 className="text-lg font-black text-[#2d5016] dark:text-[#e8dfd5] uppercase tracking-tight flex items-center gap-3">
                                <BarChart3 size={24} className="text-[#2d5016] dark:text-emerald-400" />
                                Hiệu suất 7 ngày qua
                            </h3>
                            <p className="text-[10px] text-[#8b6f47] dark:text-[#d4a574] font-black tracking-wider mt-1 uppercase">Hiệu suất Doanh thu & Lợi nhuận</p>
                        </div>
                        <div className="flex gap-3">
                             <div className="flex items-center gap-2 px-3 py-1.5 bg-[#2d5016]/10 rounded-full border border-[#2d5016]/20 text-[9px] font-black uppercase tracking-wider text-[#2d5016] dark:text-emerald-400">
                                <div className="w-2 h-2 rounded-full bg-[#2d5016] dark:bg-emerald-400 shadow-none" /> Doanh thu
                             </div>
                             <div className="flex items-center gap-2 px-3 py-1.5 bg-[#8b6f47]/15 rounded-full border border-[#8b6f47]/25 text-[9px] font-black uppercase tracking-wider text-[#8b6f47] dark:text-[#d4a574]">
                                <div className="w-2 h-2 rounded-full bg-[#8b6f47] dark:bg-[#d4a574] shadow-none" /> Lợi nhuận
                             </div>
                        </div>
                    </div>
                    
                    <div className="h-[300px] relative z-10">
                        <Bar options={chartOptions('Hiệu suất tài chính')} data={chartData} />
                    </div>
                </m.div>

                <m.div layout variants={itemVariants} className="md:col-span-12 xl:col-span-4 bg-transparent p-6 lg:p-8 rounded-3xl border border-[#8b6f47]/20 dark:border-white/10 shadow-none backdrop-blur-md relative overflow-hidden flex flex-col">
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#2d5016]/5 rounded-full blur-3xl -ml-24 -mb-24" />
                    <div className="flex items-center justify-between mb-8 relative z-10">
                        <div>
                            <h3 className="text-lg font-black text-[#2d5016] dark:text-[#e8dfd5] uppercase tracking-tight flex items-center gap-3">
                                <PieChart size={24} className="text-[#2d5016] dark:text-emerald-400" />
                                Cân bằng nợ
                            </h3>
                            <p className="text-[10px] text-[#8b6f47] dark:text-[#d4a574] font-black tracking-wider mt-1 uppercase">Tỷ lệ Phải Thu / Phải Trả</p>
                        </div>
                    </div>
                    <div className="flex-1 min-h-[250px] flex items-center justify-center relative z-10">
                        <Doughnut options={doughnutOptions} data={debtChartData} />
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                             <div className="p-4 rounded-full bg-transparent backdrop-blur-md border-transparent shadow-none flex flex-col items-center justify-center w-28 h-28 transform transition-transform hover:scale-105">
                                <span className="text-[8px] font-black uppercase text-[#8b6f47] dark:text-[#d4a574] tracking-[0.2em] mb-1">Tỷ lệ nợ</span>
                                <span className="text-2xl font-black text-[#2d5016] dark:text-[#e8dfd5] tracking-tight leading-none">
                                    {Math.round((Math.abs(stats.customer_debt) / (Math.max(1, Math.abs(stats.customer_debt) + Math.abs(stats.supplier_debt)))) * 100)}%
                                </span>
                                <span className="text-[8px] font-black uppercase tracking-widest text-[#2d5016] dark:text-emerald-400 mt-1">Phải thu</span>
                             </div>
                        </div>
                    </div>
                </m.div>

                {/* 6. Debt Lists - Span 6 each */}
                <m.div layout variants={itemVariants} className="md:col-span-12 lg:col-span-6 bg-transparent p-6 lg:p-8 rounded-3xl shadow-none border border-[#8b6f47]/20 dark:border-white/10 backdrop-blur-md relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#2d5016]/5 rounded-full blur-2xl" />
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 relative z-10">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-[#2d5016]/10 text-[#2d5016] dark:bg-emerald-500/15 dark:text-emerald-400 border border-[#2d5016]/20 dark:border-emerald-500/30 rounded-2xl">
                                <Users size={20} />
                            </div>
                            <div>
                                <h3 className="text-base font-black text-[#2d5016] dark:text-[#e8dfd5] uppercase tracking-tight">
                                    Khách hàng nợ
                                </h3>
                                <p className="text-[10px] font-black text-[#8b6f47] dark:text-[#d4a574] uppercase tracking-wider mt-1">Top 10 nợ cao nhất</p>
                            </div>
                        </div>
                        <Link to="/partners" className="px-4 py-2 bg-[#2d5016]/10 text-[#2d5016] dark:bg-emerald-500/15 dark:text-emerald-300 border border-[#2d5016]/20 rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-[#2d5016] hover:text-white transition-colors shrink-0">
                            Chi tiết
                        </Link>
                    </div>
                    <div className="space-y-3 max-h-[350px] overflow-y-auto no-scrollbar pr-1 relative z-10">
                        {stats.customer_debt_list?.length > 0 ? (
                            stats.customer_debt_list.slice(0, 10).map((p, idx) => (
                                <m.div
                                    key={p.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.04 }}
                                    whileHover={{ x: 4, backgroundColor: 'rgba(255,255,255,0.06)' }}
                                    className="flex items-center justify-between p-3.5 bg-transparent rounded-2xl border border-[#8b6f47]/15 dark:border-white/10 hover:border-[#2d5016]/40 transition-all shadow-none group"
                                >
                                    <div className="flex items-center gap-4 min-w-0">
                                        <div className="w-10 h-10 rounded-xl bg-[#2d5016]/10 text-[#2d5016] dark:bg-emerald-500/15 dark:text-emerald-400 font-black text-xs border border-[#2d5016]/20 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                                            {getInitials(p.name)}
                                        </div>
                                        <span className="font-black text-slate-800 dark:text-[#e8dfd5] text-sm truncate">{p.name}</span>
                                    </div>
                                    <div className="flex items-center gap-3 shrink-0">
                                        <span className="font-black text-[#2d5016] dark:text-emerald-400 text-sm tracking-tight">{formatDebt(p.balance)}</span>
                                        <span className="text-[10px] font-black w-6 h-6 flex items-center justify-center bg-[#8b6f47]/10 text-[#8b6f47] dark:bg-white/10 dark:text-[#d4a574] rounded-lg">#{idx + 1}</span>
                                    </div>
                                </m.div>
                            ))
                        ) : (
                            <div className="flex flex-col items-center justify-center py-16 opacity-50">
                                <Users size={40} className="text-[#2d5016] mb-4 opacity-50" />
                                <p className="font-black uppercase tracking-wider text-xs italic text-[#8b6f47]">Không có công nợ</p>
                            </div>
                        )}
                    </div>
                </m.div>

                <m.div layout variants={itemVariants} className="md:col-span-12 lg:col-span-6 bg-transparent p-6 lg:p-8 rounded-3xl shadow-none border border-[#8b6f47]/20 dark:border-white/10 backdrop-blur-md relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 rounded-full blur-2xl" />
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 relative z-10">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-rose-500/10 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400 border border-rose-500/20 rounded-2xl">
                                <Truck size={20} />
                            </div>
                            <div>
                                <h3 className="text-base font-black text-[#2d5016] dark:text-[#e8dfd5] uppercase tracking-tight">
                                    Nợ nhà cung cấp
                                </h3>
                                <p className="text-[10px] font-black text-[#8b6f47] dark:text-[#d4a574] uppercase tracking-wider mt-1">Cần thanh toán</p>
                            </div>
                        </div>
                        <Link to="/partners" className="px-4 py-2 bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-rose-600 hover:text-white transition-colors shrink-0">
                            Chi tiết
                        </Link>
                    </div>
                    <div className="space-y-3 max-h-[350px] overflow-y-auto no-scrollbar pr-1 relative z-10">
                        {stats.supplier_debt_list?.length > 0 ? (
                            stats.supplier_debt_list.slice(0, 10).map((p, idx) => (
                                <m.div
                                    key={p.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.04 }}
                                    whileHover={{ x: 4, backgroundColor: 'rgba(255,255,255,0.06)' }}
                                    className="flex items-center justify-between p-3.5 bg-transparent rounded-2xl border border-[#8b6f47]/15 dark:border-white/10 hover:border-rose-500/40 transition-all shadow-none group"
                                >
                                    <div className="flex items-center gap-4 min-w-0">
                                        <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400 font-black text-xs border border-rose-500/20 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                                            {getInitials(p.name)}
                                        </div>
                                        <span className="font-black text-slate-800 dark:text-[#e8dfd5] text-sm truncate">{p.name}</span>
                                    </div>
                                    <div className="flex items-center gap-3 shrink-0">
                                        <span className="font-black text-rose-600 dark:text-rose-400 text-sm tracking-tight">{formatDebt(p.balance)}</span>
                                        <span className="text-[10px] font-black w-6 h-6 flex items-center justify-center bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-lg">#{idx + 1}</span>
                                    </div>
                                </m.div>
                            ))
                        ) : (
                            <div className="flex flex-col items-center justify-center py-16 opacity-50">
                                <Truck size={40} className="text-rose-500 mb-4 opacity-50" />
                                <p className="font-black uppercase tracking-wider text-xs italic text-[#8b6f47]">Chưa có nợ</p>
                            </div>
                        )}
                    </div>
                </m.div>
            </div>
            {/* Toast Notifications */}
            <AnimatePresence>
                {toast && (
                    <Toast
                        message={toast.message}
                        type={toast.type}
                        onClose={() => setToast(null)}
                    />
                )}
            </AnimatePresence>

            {/* Floating Mascot */}
            <AnimatePresence>
                {showMascot && !gpuDisabled && (
                    <m.div
                        drag
                        dragMomentum={false}
                        onDragEnd={handleDragEnd}
                        animate={{
                            x: mascotConfig.x,
                            y: mascotConfig.y,
                        }}
                        whileDrag={{ cursor: 'grabbing', scale: mascotConfig.scale * 1.05 }}
                        className="fixed z-[9999] cursor-grab group"
                        style={{
                            top: '20%',
                            left: '80%',
                            width: `${12 * mascotConfig.scale}rem`,
                            height: `${12 * mascotConfig.scale}rem`
                        }}
                    >
                        <m.img
                            src="/assets/images/user_mascot.png"
                            alt="Mascot"
                            animate={animateMascot ? {
                                y: [0, -15, 0],
                                rotate: [-1, 1, -1]
                            } : {}}
                            transition={animateMascot ? {
                                duration: 2,
                                repeat: Infinity,
                                ease: "easeInOut"
                            } : {}}
                            className="w-full h-full object-contain mix-blend-multiply dark:mix-blend-normal drop-shadow-2xl select-none"
                            draggable="false"
                        />
                        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-4 py-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-3 shadow-none border border-[#d4a574]/20 text-[10px] font-black uppercase text-[#8b6f47] min-w-[200px]">
                            <div className="flex items-center gap-1">
                                <span>Nhảy</span>
                                <input
                                    type="checkbox"
                                    checked={animateMascot}
                                    onChange={(e) => {
                                        const nextVal = e.target.checked;
                                        setAnimateMascot(nextVal);
                                        localStorage.setItem('ui_mascot_animate', nextVal.toString());
                                    }}
                                    className="cursor-pointer rounded accent-[#2d5016]"
                                />
                            </div>
                            <div className="h-3 w-px bg-[#d4a574]/30" />
                            <div className="flex items-center gap-1.5 flex-1">
                                <span>Size</span>
                                <input
                                    type="range"
                                    min="0.5"
                                    max="3"
                                    step="0.1"
                                    value={mascotConfig.scale}
                                    onChange={(e) => saveMascotConfig({ scale: parseFloat(e.target.value) })}
                                    className="w-16 h-1 bg-[#d4a574]/30 rounded-lg appearance-none cursor-pointer accent-[#2d5016]"
                                />
                            </div>
                        </div>
                    </m.div>
                )}
            </AnimatePresence>

            {/* Premium Loading Overlay */}
            <LoadingOverlay isVisible={loading && !stats.revenue} message="Đang thu hoạch dữ liệu..." />
            
            {/* App Wallpaper Settings Modal */}
            <Portal>
                <AnimatePresence>
                    {showWallpaperSettings && (
                        <div className="fixed inset-0 z-[500000] flex items-center justify-center p-4 bg-slate-950/40 dark:bg-black/60 overflow-y-auto">
                            <m.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setShowWallpaperSettings(false)}
                                className="absolute inset-0"
                            />
                            <m.div
                                initial={{ scale: 0.95, opacity: 0, y: 10 }}
                                animate={{ scale: 1, opacity: 1, y: 0 }}
                                exit={{ scale: 0.95, opacity: 0, y: 10 }}
                                className="bg-card w-full max-w-md rounded-2xl border border-border flex flex-col relative z-10 overflow-hidden shadow-2xl"
                            >
                                <div className="p-5 flex items-center justify-between border-b border-border bg-card">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20">
                                            <Paintbrush className="text-primary" size={20} />
                                        </div>
                                        <div>
                                            <h3 className="text-base font-bold text-foreground uppercase tracking-wide leading-tight">Hình Nền</h3>
                                            <p className="text-muted-foreground text-[10px] font-medium uppercase tracking-widest mt-0.5">Tùy chỉnh giao diện</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setShowWallpaperSettings(false)}
                                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-transparent hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                                    >
                                        <X size={16} strokeWidth={2.5} />
                                    </button>
                                </div>
                                <div className="p-6 flex flex-col gap-5 overflow-y-auto max-h-[70vh] bg-card/50">
                                    {/* Preview & Upload */}
                                    <div className="space-y-3">
                                        <label className="text-sm font-bold text-foreground/80 uppercase tracking-wider">Ảnh Nền Của Bạn</label>
                                        
                                        {appWallpaper.image ? (
                                            <div className="relative w-full h-40 rounded-xl overflow-hidden border border-border group bg-black/5 dark:bg-white/5">
                                                <img 
                                                    src={appWallpaper.image} 
                                                    alt="Preview" 
                                                    className="w-full h-full object-cover"
                                                />
                                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                                                    <label className="p-2 bg-white/20 hover:bg-white/40 rounded-lg cursor-pointer text-white backdrop-blur-md transition-colors">
                                                        <ImageIcon size={20} />
                                                        <input
                                                            type="file"
                                                            accept="image/*"
                                                            className="hidden"
                                                            onChange={(e) => {
                                                                const file = e.target.files[0];
                                                                if (file) {
                                                                    compressAndSetWallpaper(file);
                                                                }
                                                            }}
                                                        />
                                                    </label>
                                                    <button 
                                                        onClick={() => setAppWallpaper(prev => ({ ...prev, image: null }))}
                                                        className="p-2 bg-red-500/80 hover:bg-red-500 rounded-lg text-white backdrop-blur-md transition-colors cursor-pointer"
                                                    >
                                                        <Trash2 size={20} />
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <label className="flex flex-col items-center justify-center w-full h-40 bg-background/50 border-2 border-dashed border-border rounded-xl cursor-pointer hover:bg-primary/5 hover:border-primary/30 transition-colors">
                                                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-2">
                                                    <ImageIcon size={24} />
                                                </div>
                                                <span className="text-sm font-semibold text-foreground/70">Nhấp để tải ảnh lên</span>
                                                <span className="text-xs text-muted-foreground mt-1">Hỗ trợ JPG, PNG (Tối đa 4MB)</span>
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    className="hidden"
                                                    onChange={(e) => {
                                                        const file = e.target.files[0];
                                                        if (file) {
                                                            compressAndSetWallpaper(file);
                                                        }
                                                    }}
                                                />
                                            </label>
                                        )}
                                        
                                        {/* Brand Default Wallpaper Preset Gallery */}
                                        <div className="space-y-2 pt-2 border-t border-border/60">
                                            <div className="flex items-center justify-between">
                                                <label className="text-xs font-bold text-foreground/80 uppercase tracking-wider flex items-center gap-1.5">
                                                    <Sparkles size={14} className="text-amber-500" />
                                                    Bộ sưu tập hình nền LyangPOS
                                                </label>
                                            </div>
                                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-1 bg-black/[0.02] dark:bg-white/[0.02] rounded-xl border border-border/60">
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
                                                                    setAppWallpaper(prev => ({
                                                                        ...prev,
                                                                        image: base64,
                                                                        size: 'cover',
                                                                        position: 'center',
                                                                        opacity: 90,
                                                                        blur: 0,
                                                                        glassBlur: 8,
                                                                        glassOpacity: 15
                                                                    }));
                                                                };
                                                                reader.readAsDataURL(blob);
                                                            } catch (err) {
                                                                console.error('Error loading preset wallpaper:', err);
                                                            }
                                                        }}
                                                        className="group/preset relative flex flex-col items-center gap-1 p-1 rounded-xl border border-border/80 hover:border-primary bg-card/60 hover:bg-primary/5 transition-all cursor-pointer shadow-2xs hover:scale-[1.03] active:scale-95 text-left"
                                                        title={preset.desc}
                                                    >
                                                        <div className="w-full h-16 rounded-lg overflow-hidden border border-border/60 relative">
                                                            <img 
                                                                src={preset.path} 
                                                                alt={preset.name} 
                                                                className="w-full h-full object-cover group-hover/preset:scale-110 transition-transform duration-300"
                                                            />
                                                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover/preset:opacity-100 transition-opacity flex items-end p-1">
                                                                <span className="text-[7.5px] font-black text-white uppercase tracking-wider truncate">Chọn</span>
                                                            </div>
                                                        </div>
                                                        <span className="text-[9px] font-bold text-foreground truncate w-full text-center leading-tight">
                                                            {preset.name}
                                                        </span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-foreground/80 uppercase tracking-wider">Kích Thước</label>
                                        <CustomSelect
                                            className="w-full"
                                            value={appWallpaper.size || "cover"}
                                            onChange={(e) => setAppWallpaper(prev => ({ ...prev, size: e.target.value }))}
                                            options={[
                                                { value: "cover", label: "Vừa khít (Cover)" },
                                                { value: "contain", label: "Thu gọn (Contain)" },
                                                { value: "auto", label: "Tự động (Auto)" },
                                                { value: "100% 100%", label: "Kéo giãn (100% 100%)" }
                                            ]}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-foreground/80 uppercase tracking-wider">Vị Trí</label>
                                        <CustomSelect
                                            className="w-full"
                                            value={appWallpaper.position || "center"}
                                            onChange={(e) => setAppWallpaper(prev => ({ ...prev, position: e.target.value }))}
                                            options={[
                                                { value: "center", label: "Giữa (Center)" },
                                                { value: "top", label: "Trên (Top)" },
                                                { value: "bottom", label: "Dưới (Bottom)" },
                                                { value: "left", label: "Trái (Left)" },
                                                { value: "right", label: "Phải (Right)" }
                                            ]}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <label className="text-sm font-bold text-foreground/80 uppercase tracking-wider">Độ Mờ (Blur)</label>
                                            <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">{appWallpaper.blur || 0}px</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="0"
                                            max="50"
                                            value={appWallpaper.blur || 0}
                                            onChange={(e) => setAppWallpaper(prev => ({ ...prev, blur: parseInt(e.target.value) }))}
                                            className="w-full accent-primary"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <label className="text-sm font-bold text-foreground/80 uppercase tracking-wider">Độ Đậm (Opacity)</label>
                                            <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">{appWallpaper.opacity ?? 100}%</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="0"
                                            max="100"
                                            value={appWallpaper.opacity ?? 100}
                                            onChange={(e) => setAppWallpaper(prev => ({ ...prev, opacity: parseInt(e.target.value) }))}
                                            className="w-full accent-primary"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <label className="text-sm font-bold text-foreground/80 uppercase tracking-wider">Độ Nhòe Kính (Glass Blur)</label>
                                            <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">{appWallpaper.glassBlur !== undefined ? appWallpaper.glassBlur : 10}px</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="0"
                                            max="50"
                                            value={appWallpaper.glassBlur !== undefined ? appWallpaper.glassBlur : 10}
                                            onChange={(e) => setAppWallpaper(prev => ({ ...prev, glassBlur: parseInt(e.target.value) }))}
                                            className="w-full accent-primary"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <label className="text-sm font-bold text-foreground/80 uppercase tracking-wider">Độ Đậm Kính (Glass Opacity)</label>
                                            <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">{appWallpaper.glassOpacity !== undefined ? appWallpaper.glassOpacity : 20}%</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="0"
                                            max="100"
                                            value={appWallpaper.glassOpacity !== undefined ? appWallpaper.glassOpacity : 20}
                                            onChange={(e) => setAppWallpaper(prev => ({ ...prev, glassOpacity: parseInt(e.target.value) }))}
                                            className="w-full accent-primary"
                                        />
                                    </div>
                                </div>
                            </m.div>
                        </div>
                    )}
                </AnimatePresence>
            </Portal>
        </m.div >
        </MotionConfig>
    );
}
