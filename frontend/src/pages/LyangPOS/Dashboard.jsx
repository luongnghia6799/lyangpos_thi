import React, { useEffect, useState, memo, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Lunar } from 'lunar-javascript';
import { m, AnimatePresence, useReducedMotion, MotionConfig } from 'framer-motion';
import { Bar, Doughnut } from 'react-chartjs-2';
import CustomSelect from '../../components/CustomSelect';
import CustomDatePicker from '../../components/CustomDatePicker';
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
    Sparkles,
    Camera,
    Upload,
    Check,
    SlidersHorizontal,
    Sliders,
    Layers
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



const getAvatarSrc = (url) => {
    if (!url || url === 'undefined' || url === 'null') return '';
    const normalized = url.replace(/\\/g, '/').trim();
    if (normalized.startsWith('http') || normalized.startsWith('data:') || normalized.startsWith('blob:')) {
        return normalized;
    }
    const base = axios.defaults.baseURL || 'http://localhost:3579';
    const fullPath = `${base.replace(/\/+$/, '')}/${normalized.replace(/^\/+/, '')}`;
    return encodeURI(fullPath);
};

const ClockWidget = memo(() => {
    const [currentTime, setCurrentTime] = useState(new Date());
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);
    return (
        <div className="relative p-5 flex flex-col justify-center overflow-hidden group hover:bg-[#8b6f47]/[0.03] dark:hover:bg-white/[0.02] transition-colors">
            <div className="absolute -right-3 -bottom-3 text-[#2d5016]/[0.08] dark:text-emerald-400/[0.08] pointer-events-none group-hover:scale-110 group-hover:rotate-12 transition-transform duration-500">
                <Clock size={90} strokeWidth={1.8} />
            </div>
            <div className="relative z-10 flex flex-col">
                <div className="text-4xl lg:text-5xl font-black text-[#2d5016] dark:text-[#e8dfd5] tracking-tight tabular-nums leading-none mb-2">
                    {currentTime.toLocaleTimeString('vi-VN', { hour12: false, hour: '2-digit', minute: '2-digit' })}
                </div>
                <div className="flex items-center gap-2 text-[#8b6f47] dark:text-[#d4a574] font-black text-[9.5px] uppercase tracking-wider">
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
});

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
    const [showMascot, setShowMascot] = useState(() => localStorage.getItem('ui_show_dashboard_mascot') === 'true');
    const [animateMascot, setAnimateMascot] = useState(() => localStorage.getItem('ui_mascot_animate') === 'true');
    const [mascotConfig, setMascotConfig] = useState({ x: 0, y: 0, scale: 1.5 });
    const [avatarUrl, setAvatarUrl] = useState(() => {
        const u = JSON.parse(sessionStorage.getItem('user') || '{}');
        return (u.username && localStorage.getItem(`user_avatar_${u.username}`)) ||
               (u.id && localStorage.getItem(`user_avatar_${u.id}`)) ||
               localStorage.getItem('user_avatar') || '';
    });

    useEffect(() => {
        const updateAvatar = () => {
            const u = JSON.parse(sessionStorage.getItem('user') || '{}');
            const custom = (u.username && localStorage.getItem(`user_avatar_${u.username}`)) ||
                           (u.id && localStorage.getItem(`user_avatar_${u.id}`)) ||
                           localStorage.getItem('user_avatar') || '';
            setAvatarUrl(custom);
        };
        window.addEventListener('user_avatar_updated', updateAvatar);
        window.addEventListener('storage', updateAvatar);
        return () => {
            window.removeEventListener('user_avatar_updated', updateAvatar);
            window.removeEventListener('storage', updateAvatar);
        };
    }, []);
    const [showAvatarModal, setShowAvatarModal] = useState(false);
    const [toast, setToast] = useState(null);
    const fileInputRef = useRef(null);

    const [shopInfo, setShopInfo] = useState({ shop_name: 'Lyang Nghĩa', shop_address: '', shop_phone: '' });
    const [customGreetingTitle, setCustomGreetingTitle] = useState(() => localStorage.getItem('dashboard_custom_greeting_title') || '');
    const [customGreetingSubtitle, setCustomGreetingSubtitle] = useState(() => localStorage.getItem('dashboard_custom_greeting_subtitle') || '');
    const [showGreetingModal, setShowGreetingModal] = useState(false);
    const [tempGreetingTitle, setTempGreetingTitle] = useState('');
    const [tempGreetingSubtitle, setTempGreetingSubtitle] = useState('');

    const [showWallpaperSettings, setShowWallpaperSettings] = useState(false);
    const [showCardGlassPopover, setShowCardGlassPopover] = useState(false);
    const [cardSettingsTab, setCardSettingsTab] = useState('glass'); // 'glass' | 'glow'
    const [cardGlassEnabled, setCardGlassEnabled] = useState(() => localStorage.getItem("ui_dashboard_card_glass") !== "false");
    const [cardGlassOpacity, setCardGlassOpacity] = useState(() => {
        const saved = localStorage.getItem("ui_dashboard_card_glass_opacity");
        return saved !== null ? parseInt(saved, 10) : 40; // Mặc định 40%
    });
    const [cardGlassBlur, setCardGlassBlur] = useState(() => {
        const saved = localStorage.getItem("ui_dashboard_card_glass_blur");
        return saved !== null ? parseInt(saved, 10) : 16; // Mặc định 16px
    });

    // Card Glow States
    const [cardGlowEnabled, setCardGlowEnabled] = useState(() => localStorage.getItem("ui_dashboard_card_glow_enabled") === "true");
    const [cardGlowColor, setCardGlowColor] = useState(() => localStorage.getItem("ui_dashboard_card_glow_color") || "#10b981");
    const [cardGlowSize, setCardGlowSize] = useState(() => {
        const saved = localStorage.getItem("ui_dashboard_card_glow_size");
        return saved !== null ? parseInt(saved, 10) : 16; // Mặc định 16px
    });
    const [cardGlowOpacity, setCardGlowOpacity] = useState(() => {
        const saved = localStorage.getItem("ui_dashboard_card_glow_opacity");
        return saved !== null ? parseInt(saved, 10) : 50; // Mặc định 50%
    });

    const [appWallpaper, setAppWallpaper] = useState(() => {
        const saved = localStorage.getItem("pos_cart_wallpaper");
        return saved ? JSON.parse(saved) : { image: "", size: "cover", position: "center", blur: 0, opacity: 100 };
    });

    const toggleCardGlass = () => {
        setCardGlassEnabled(prev => {
            const next = !prev;
            localStorage.setItem("ui_dashboard_card_glass", String(next));
            return next;
        });
    };

    const updateCardGlassOpacity = (val) => {
        setCardGlassOpacity(val);
        localStorage.setItem("ui_dashboard_card_glass_opacity", String(val));
    };

    const updateCardGlassBlur = (val) => {
        setCardGlassBlur(val);
        localStorage.setItem("ui_dashboard_card_glass_blur", String(val));
    };

    const toggleCardGlow = () => {
        setCardGlowEnabled(prev => {
            const next = !prev;
            localStorage.setItem("ui_dashboard_card_glow_enabled", String(next));
            return next;
        });
    };

    const updateCardGlowColor = (val) => {
        setCardGlowColor(val);
        localStorage.setItem("ui_dashboard_card_glow_color", val);
    };

    const updateCardGlowSize = (val) => {
        setCardGlowSize(val);
        localStorage.setItem("ui_dashboard_card_glow_size", String(val));
    };

    const updateCardGlowOpacity = (val) => {
        setCardGlowOpacity(val);
        localStorage.setItem("ui_dashboard_card_glow_opacity", String(val));
    };

    const hexToRgba = (hex, alpha = 1) => {
        if (!hex) return `rgba(16, 185, 129, ${alpha})`;
        let c = hex.replace('#', '');
        if (c.length === 3) {
            c = c.split('').map(char => char + char).join('');
        }
        const num = parseInt(c, 16);
        const r = (num >> 16) & 255;
        const g = (num >> 8) & 255;
        const b = num & 255;
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    };

    const getCardGlassStyle = () => {
        const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');
        const opacity = (cardGlassOpacity ?? 40) / 100;
        const blur = cardGlassBlur ?? 16;
        
        const style = {};
        // Only engage GPU backdrop blur if a wallpaper image is actually present and card glass is enabled
        if (cardGlassEnabled && appWallpaper.image) {
            style.backgroundColor = isDark 
                ? `rgba(20, 24, 18, ${Math.min(1, opacity * 0.9)})` 
                : `rgba(255, 255, 255, ${opacity})`;
            if (blur > 0) {
                style.backdropFilter = `blur(${blur}px)`;
                style.WebkitBackdropFilter = `blur(${blur}px)`;
            }
        }

        if (cardGlowEnabled && cardGlowSize > 0) {
            const glowAlpha = (cardGlowOpacity ?? 50) / 100;
            const color = cardGlowColor || '#10b981';
            style.boxShadow = `0 0 ${cardGlowSize}px ${Math.round(cardGlowSize * 0.25)}px ${hexToRgba(color, glowAlpha)}, 0 10px 30px rgba(0,0,0,0.08)`;
            style.borderColor = hexToRgba(color, Math.min(1, glowAlpha + 0.3));
        }

        return style;
    };

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
                if (res.data) {
                    if (res.data.user_avatar) {
                        localStorage.setItem('user_avatar', res.data.user_avatar);
                        setAvatarUrl(res.data.user_avatar);
                    }
                    setShopInfo({
                        shop_name: res.data.shop_name || 'Lyang Nghĩa',
                        shop_address: res.data.shop_address || '',
                        shop_phone: res.data.shop_phone || ''
                    });
                }
            } catch (err) {
                console.error("Failed to fetch settings", err);
            }
        };
        fetchGlobalSettings();

        const handleSettingsUpdate = () => fetchGlobalSettings();
        window.addEventListener('storage', handleSettingsUpdate);
        return () => window.removeEventListener('storage', handleSettingsUpdate);
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
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const reader = new FileReader();
            reader.onload = async (event) => {
                const img = new Image();
                img.onload = async () => {
                    const canvas = document.createElement("canvas");
                    const ctx = canvas.getContext("2d");
                    const maxDim = 512;
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
                    const base64 = canvas.toDataURL("image/png", 0.9);

                    setAvatarUrl(base64);
                    localStorage.setItem('user_avatar', base64);

                    const currentUser = JSON.parse(sessionStorage.getItem('user') || '{}');
                    if (currentUser.username) {
                        localStorage.setItem(`user_avatar_${currentUser.username}`, base64);
                    }
                    if (currentUser.id) {
                        localStorage.setItem(`user_avatar_${currentUser.id}`, base64);
                    }

                    try {
                        await axios.post('/api/settings', { user_avatar: base64 });
                    } catch (sErr) {
                        console.warn("Save avatar setting error", sErr);
                    }

                    window.dispatchEvent(new Event('user_avatar_updated'));
                    window.dispatchEvent(new Event('storage'));
                    setToast({ message: 'Tải ảnh đại diện thành công!', type: 'success' });
                    setShowAvatarModal(false);
                };
                img.onerror = () => {
                    setToast({ message: 'Không thể đọc dữ liệu ảnh.', type: 'error' });
                };
                img.src = event.target.result;
            };
            reader.onerror = () => {
                setToast({ message: 'Không thể tải file ảnh.', type: 'error' });
            };
            reader.readAsDataURL(file);
        } catch (err) {
            console.error("Avatar upload failed", err);
            setToast({ message: 'Lỗi tải ảnh đại diện', type: 'error' });
        } finally {
            if (e.target) e.target.value = '';
        }
    };

    const handleResetAvatar = async () => {
        setAvatarUrl('');
        localStorage.removeItem('user_avatar');
        const currentUser = JSON.parse(sessionStorage.getItem('user') || '{}');
        if (currentUser.username) {
            localStorage.removeItem(`user_avatar_${currentUser.username}`);
        }
        if (currentUser.id) {
            localStorage.removeItem(`user_avatar_${currentUser.id}`);
        }
        try {
            await axios.post('/api/settings', { user_avatar: '' });
        } catch (e) {
            console.warn("Reset avatar setting error", e);
        }
        window.dispatchEvent(new Event('user_avatar_updated'));
        window.dispatchEvent(new Event('storage'));
        setShowAvatarModal(false);
        setToast({ message: 'Đã khôi phục Logo mặc định', type: 'info' });
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
        if (!e) return;
        const name = e.target ? e.target.name : e.name;
        const value = e.target ? e.target.value : (e.value !== undefined ? e.value : e);
        if (name) {
            setFilters(prev => ({ ...prev, [name]: value }));
        }
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

            {/* Avatar Customization Modal */}
            <Portal>
                <AnimatePresence>
                    {showAvatarModal && (
                        <div className="fixed inset-0 z-[500000] flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-sm overflow-y-auto">
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
                                initial={{ scale: 0.95, opacity: 0, y: 15 }}
                                animate={{ scale: 1, opacity: 1, y: 0 }}
                                exit={{ scale: 0.95, opacity: 0, y: 15 }}
                                className="bg-card w-full max-w-md rounded-3xl border border-border flex flex-col relative z-10 overflow-hidden shadow-2xl text-left"
                            >
                                {/* Header */}
                                <div className="p-5 sm:p-6 flex items-center justify-between border-b border-border bg-card">
                                    <div className="flex items-center gap-3.5">
                                        <div className="w-11 h-11 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20 text-primary">
                                            <Camera size={22} />
                                        </div>
                                        <div>
                                            <h3 className="text-base font-black text-foreground uppercase tracking-wide leading-tight">Cá nhân hóa Avatar</h3>
                                            <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest mt-0.5">Tải ảnh đại diện từ thiết bị của bạn</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setShowAvatarModal(false)}
                                        className="w-9 h-9 flex items-center justify-center rounded-xl bg-transparent hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                                    >
                                        <X size={18} strokeWidth={2.5} />
                                    </button>
                                </div>
 
                                <div className="p-6 flex flex-col gap-6 bg-card/40">
                                    {/* Preview Circle */}
                                    <div className="flex flex-col items-center justify-center gap-3">
                                        <div className="relative group/prev">
                                            <div className="w-28 h-28 rounded-2xl overflow-hidden flex items-center justify-center bg-card/30 shadow-md">
                                                {getAvatarSrc(avatarUrl) ? (
                                                    <img 
                                                        src={getAvatarSrc(avatarUrl)} 
                                                        alt="Avatar Preview" 
                                                        className="w-full h-full object-cover rounded-2xl" 
                                                    />
                                                ) : (
                                                    <img 
                                                        src="/logo.png" 
                                                        alt="Default Logo" 
                                                        className="w-full h-full object-contain p-2" 
                                                    />
                                                )}
                                            </div>
                                            <div className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground p-1.5 rounded-xl shadow-md border-2 border-card">
                                                <Sparkles size={14} />
                                            </div>
                                        </div>
                                        <p className="text-xs font-bold text-muted-foreground">
                                            {avatarUrl ? "Ảnh đại diện tùy chỉnh hiện tại" : "Đang sử dụng Logo mặc định"}
                                        </p>
                                    </div>

                                    {/* Upload Dropzone / Button */}
                                    <div 
                                        onClick={() => fileInputRef.current?.click()}
                                        className="border-2 border-dashed border-primary/30 hover:border-primary hover:bg-primary/[0.04] transition-all rounded-2xl p-6 flex flex-col items-center justify-center gap-2.5 text-center cursor-pointer group"
                                    >
                                        <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
                                            <Upload size={22} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-black text-foreground">Tải ảnh lên từ máy tính</p>
                                            <p className="text-[11px] text-muted-foreground mt-0.5">Hỗ trợ định dạng PNG, JPG, JPEG, WebP</p>
                                        </div>
                                        <button
                                            type="button"
                                            className="mt-1 px-4 py-2 bg-primary text-primary-foreground text-xs font-black uppercase tracking-wider rounded-xl shadow-xs group-hover:bg-primary-hover transition-colors pointer-events-none"
                                        >
                                            Chọn File Ảnh
                                        </button>
                                    </div>

                                    {/* Reset / Remove custom avatar */}
                                    {avatarUrl && (
                                        <button
                                            type="button"
                                            onClick={handleResetAvatar}
                                            className="w-full py-3 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer text-xs uppercase tracking-wider"
                                        >
                                            <Trash2 size={16} /> Khôi phục Logo mặc định
                                        </button>
                                    )}
                                </div>
                            </m.div>
                        </div>
                    )}
                </AnimatePresence>
            </Portal>

            {/* Precompute Card Background & Backdrop classes based on cardGlassEnabled */}
            {(() => {
                const cardGlassClasses = cardGlassEnabled
                    ? "bg-white/40 dark:bg-black/30 backdrop-blur-xl"
                    : "bg-[#f8f5ee] dark:bg-[#1a1c18]";
                return null;
            })()}

            <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-4 lg:gap-6 pb-12 max-w-[1600px] mx-auto">
                {/* 1. Header Hero - Span 7 (60% on desktop) */}
                <m.div 
                    variants={itemVariants} 
                    className="md:col-span-12 xl:col-span-7 relative z-30 flex flex-col justify-center py-1"
                >
                    <div className="flex flex-col sm:flex-row items-center sm:items-stretch gap-5 lg:gap-6 relative z-10 text-center sm:text-left w-full h-full">
                        {/* Modern Avatar Container - Full Height Proportion */}
                        <div className="relative group shrink-0 self-center sm:self-stretch flex items-center justify-center">
                            <m.div
                                whileHover={{ scale: 1.04 }}
                                whileTap={{ scale: 0.96 }}
                                onClick={() => setShowAvatarModal(true)}
                                className="w-32 h-32 sm:w-auto sm:h-full aspect-square shrink-0 rounded-3xl cursor-pointer overflow-hidden relative flex items-center justify-center bg-[#2d5016]/5 dark:bg-white/5 border border-[#8b6f47]/20 dark:border-white/10 shadow-sm hover:shadow-md transition-all min-h-[140px] max-h-[170px]"
                            >
                                {getAvatarSrc(avatarUrl) ? (
                                    <img 
                                        src={getAvatarSrc(avatarUrl)} 
                                        alt="Avatar" 
                                        className="w-full h-full aspect-square object-cover" 
                                    />
                                ) : (
                                    <div className="w-full h-full aspect-square flex items-center justify-center p-4">
                                        <img src="/logo.png" alt="Logo LyangPOS" className="w-full h-full aspect-square object-contain drop-shadow-sm" />
                                    </div>
                                )}

                                {/* Hover Camera Badge */}
                                <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 text-white">
                                    <Camera size={20} className="drop-shadow-sm" />
                                    <span className="text-[9.5px] font-black uppercase tracking-wider">Đổi ảnh</span>
                                </div>
                            </m.div>
                            <input 
                                type="file" 
                                ref={fileInputRef} 
                                onChange={handleAvatarUpload} 
                                className="hidden" 
                                accept="image/png, image/jpeg, image/jpg, image/webp" 
                            />
                        </div>
 
                        {/* Greeting Message & Agency Info */}
                        <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                            {/* Agency / Store Info Badge Header */}
                            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5 mb-1">
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-[#2d5016]/10 dark:bg-emerald-500/15 border border-[#2d5016]/20 dark:border-emerald-500/30 text-[10px] font-black text-[#2d5016] dark:text-emerald-300 shadow-2xs tracking-wide">
                                    <Leaf size={11} className="text-[#2d5016] dark:text-emerald-400" />
                                    <span className="uppercase tracking-wider font-extrabold">{shopInfo.shop_name || 'Lyang Nghĩa'}</span>
                                </span>
                                {shopInfo.shop_phone && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-black/[0.03] dark:bg-white/5 border border-border text-[9.5px] font-bold text-muted-foreground">
                                        Hotline: <strong className="text-foreground/80">{shopInfo.shop_phone}</strong>
                                    </span>
                                )}
                                {shopInfo.shop_address && (
                                    <span className="hidden xl:inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-black/[0.03] dark:bg-white/5 border border-border text-[9.5px] font-medium text-muted-foreground truncate max-w-[220px]" title={shopInfo.shop_address}>
                                        <MapPin size={9} className="shrink-0 text-muted-foreground" />
                                        <span className="truncate">{shopInfo.shop_address}</span>
                                    </span>
                                )}
                            </div>

                            {/* Greeting Title (Editable on Click) */}
                            <div 
                                className="group/greet inline-flex items-center justify-center sm:justify-start gap-2.5 cursor-pointer w-fit max-w-full my-1" 
                                onClick={() => {
                                    setTempGreetingTitle(customGreetingTitle || greeting.text);
                                    setTempGreetingSubtitle(customGreetingSubtitle || greeting.desc);
                                    setShowGreetingModal(true);
                                }} 
                                title="Bấm để chỉnh sửa lời chào"
                            >
                                <h2 className="text-3xl sm:text-4xl lg:text-[42px] xl:text-5xl font-black text-[#2d5016] dark:text-[#e8dfd5] tracking-tight leading-none transition-colors group-hover/greet:text-[#3d6820] dark:group-hover/greet:text-emerald-300">
                                    {customGreetingTitle || greeting.text}
                                </h2>
                                <Edit size={16} className="text-muted-foreground/40 group-hover/greet:text-primary transition-all shrink-0" />
                            </div>

                            {/* Greeting Subtitle */}
                            <p 
                                className="text-sm sm:text-base text-[#8b6f47] dark:text-[#d4a574] font-bold flex items-center justify-center sm:justify-start gap-2 tracking-normal cursor-pointer hover:opacity-80 transition-opacity"
                                onClick={() => {
                                    setTempGreetingTitle(customGreetingTitle || greeting.text);
                                    setTempGreetingSubtitle(customGreetingSubtitle || greeting.desc);
                                    setShowGreetingModal(true);
                                }}
                                title="Bấm để chỉnh sửa thông điệp"
                            >
                                <Wheat size={16} className="text-[#2d5016] dark:text-emerald-400 shrink-0 opacity-80" />
                                <span className="truncate">{customGreetingSubtitle || greeting.desc}</span>
                            </p>

                            {/* Action Buttons Row */}
                            <div className="flex items-center justify-center sm:justify-start gap-2 pt-1">
                                {/* Appearance Customizer Button */}
                                <button
                                    onClick={() => setShowWallpaperSettings(true)}
                                    className={cn(
                                        "w-8 h-8 rounded-full border active:scale-90 hover:scale-110 transition-all duration-200 flex items-center justify-center cursor-pointer shadow-2xs",
                                        (appWallpaper.image || cardGlassEnabled || cardGlowEnabled)
                                            ? "bg-[#2d5016] text-white border-[#2d5016] dark:bg-emerald-600 dark:border-emerald-500 shadow-xs"
                                            : "bg-[#2d5016]/10 text-[#2d5016] dark:bg-emerald-500/15 dark:text-emerald-300 border-[#2d5016]/20 dark:border-emerald-500/30 hover:bg-[#2d5016] hover:text-white"
                                    )}
                                    title="Tùy chỉnh Giao diện: Hình nền, Kính mờ & Viền Glow"
                                >
                                    <Sparkles size={14} className={(appWallpaper.image || cardGlassEnabled || cardGlowEnabled) ? "text-amber-300" : "text-[#2d5016] dark:text-emerald-400"} />
                                </button>

                                {/* Ẩn/Hiện Chỉ Số Button */}
                                <button
                                    onClick={() => setHideStats(prev => {
                                        const next = !prev;
                                        localStorage.setItem('hide_dashboard_stats', String(next));
                                        return next;
                                    })}
                                    className="w-8 h-8 rounded-full bg-[#8b6f47]/10 dark:bg-white/5 text-[#8b6f47] dark:text-muted-foreground hover:text-foreground border border-[#8b6f47]/20 dark:border-white/10 hover:border-primary/40 hover:scale-110 active:scale-90 transition-all duration-200 flex items-center justify-center cursor-pointer shadow-2xs"
                                    title={hideStats ? "Hiện số liệu" : "Ẩn số liệu"}
                                >
                                    <AnimatePresence mode="wait">
                                        <m.div
                                            key={hideStats ? "hidden" : "visible"}
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.8 }}
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

                {/* 2. Top Right Box: Filters & Info - Integrated Panorama Widgets - Span 5 (40% on desktop) */}
                <m.div variants={itemVariants} className="md:col-span-12 xl:col-span-5 flex flex-col justify-center gap-3 py-1">
                    {/* Top Row: Integrated Clock & Weather Strip */}
                    <div 
                        className={cn(
                            "relative overflow-hidden rounded-[2rem] border border-[#8b6f47]/25 dark:border-white/10 shadow-[0_8px_25px_rgba(139,111,71,0.05)] dark:shadow-[0_8px_25px_rgba(0,0,0,0.3)] grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-[#8b6f47]/15 dark:divide-white/10 transition-all duration-300",
                            cardGlassEnabled ? "" : "bg-[#fbf9f4] dark:bg-[#1a1c18] shadow-md"
                        )}
                        style={getCardGlassStyle()}
                    >
                        {/* Clock Widget with Watermark */}
                        <ClockWidget />

                        {/* Weather Widget with Watermark */}
                        <div 
                            onClick={handleSyncGPS} 
                            className="relative p-5 flex flex-col justify-center overflow-hidden group cursor-pointer hover:bg-[#8b6f47]/[0.03] dark:hover:bg-white/[0.02] transition-colors"
                            title="Click để đồng bộ vị trí GPS"
                        >
                            <div className="absolute -right-3 -bottom-3 text-[#2d5016]/[0.08] dark:text-emerald-400/[0.08] pointer-events-none group-hover:scale-110 group-hover:rotate-12 transition-transform duration-500">
                                <weather.icon size={90} strokeWidth={1.8} />
                            </div>
                            <div className="relative z-10 flex items-center justify-between mb-1.5">
                                <button 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleSyncGPS();
                                    }}
                                    disabled={isWeatherLoading}
                                    className="text-[9px] font-black text-[#2d5016] dark:text-emerald-400 bg-[#2d5016]/10 border border-[#2d5016]/20 hover:bg-[#2d5016] hover:text-white active:scale-95 px-2.5 py-1 rounded-full flex items-center gap-1 transition-all cursor-pointer disabled:opacity-50"
                                    title="Định vị vị trí hiện tại"
                                >
                                    {isWeatherLoading ? (
                                        <Loader2 size={9} className="animate-spin" />
                                    ) : (
                                        <MapPin size={9} />
                                    )}
                                    {isWeatherLoading ? 'ĐANG ĐỊNH VỊ...' : 'ĐỊNH VỊ'}
                                </button>
                                <span className="text-3xl lg:text-4xl font-black text-[#2d5016] dark:text-[#e8dfd5] tracking-tight leading-none">
                                    {weather.temp}°
                                </span>
                            </div>
                            <div className="text-[9px] sm:text-[10px] font-black uppercase text-[#8b6f47] dark:text-[#d4a574] tracking-wider relative z-10 flex items-center gap-2">
                                <span 
                                    onClick={handleEditLocation} 
                                    className="hover:text-[#2d5016] dark:hover:text-emerald-300 cursor-pointer flex items-center gap-1 group/city bg-[#2d5016]/5 hover:bg-[#2d5016]/10 px-1.5 py-0.5 rounded transition-all truncate max-w-[130px]"
                                    title="Click để nhập địa điểm thủ công"
                                >
                                    <span className="truncate">{weather.city}</span>
                                    <Edit size={9} className="opacity-60 group-hover/city:opacity-100 transition-opacity shrink-0" />
                                </span>
                                <span className="opacity-40">•</span>
                                <span className="text-[#2d5016] dark:text-emerald-400 truncate">{weather.desc}</span>
                            </div>
                        </div>
                    </div>

                    {/* Filter & IP Row - Seamless Integrated Strip */}
                    <div 
                        className={cn(
                            "relative overflow-hidden px-5 py-3 rounded-[1.8rem] border border-[#8b6f47]/25 dark:border-white/10 shadow-[0_8px_25px_rgba(139,111,71,0.05)] dark:shadow-[0_8px_25px_rgba(0,0,0,0.3)] flex flex-wrap lg:flex-nowrap items-center justify-between gap-3 transition-all duration-300",
                            cardGlassEnabled ? "" : "bg-[#fbf9f4] dark:bg-[#1a1c18] shadow-md"
                        )}
                        style={getCardGlassStyle()}
                    >
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                            <span className="text-[10px] font-black text-[#8b6f47] dark:text-[#d4a574] uppercase tracking-wider flex items-center gap-1.5 shrink-0">
                                <Calendar size={13} className="text-[#2d5016] dark:text-emerald-400" />
                                Lọc ngày:
                            </span>

                            {/* Elegant Custom Date Picker */}
                            <div className="w-[150px] sm:w-[170px]">
                                <CustomDatePicker
                                    value={`${filters.year}-${filters.month}-${filters.day}`}
                                    onChange={(val) => {
                                        if (val && typeof val === 'string' && val.includes('-')) {
                                            const [y, m, d] = val.split('-');
                                            setFilters({ year: y, month: m, day: d });
                                        } else if (val && val.target && val.target.value) {
                                            const [y, m, d] = val.target.value.split('-');
                                            setFilters({ year: y, month: m, day: d });
                                        }
                                    }}
                                    inputClassName="!bg-[#8b6f47]/[0.08] hover:!bg-[#8b6f47]/[0.12] dark:!bg-white/[0.06] dark:hover:!bg-white/[0.1] !border-[#8b6f47]/25 dark:!border-white/15 rounded-2xl hover:!border-[#2d5016]/50 shadow-none text-xs font-bold text-[#2d5016] dark:text-emerald-300 transition-all"
                                    placeholder="Chọn ngày..."
                                />
                            </div>

                            {/* Quick Day Presets (Hôm nay / Hôm qua) */}
                            <div className="flex items-center gap-1">
                                <button
                                    type="button"
                                    onClick={() => {
                                        const now = new Date();
                                        setFilters({
                                            year: now.getFullYear().toString(),
                                            month: (now.getMonth() + 1).toString().padStart(2, '0'),
                                            day: now.getDate().toString().padStart(2, '0')
                                        });
                                    }}
                                    className={cn(
                                        "px-2.5 py-1 text-[10.5px] font-black rounded-xl transition-all border cursor-pointer",
                                        (() => {
                                            const now = new Date();
                                            const isToday = filters.year === now.getFullYear().toString() &&
                                                filters.month === (now.getMonth() + 1).toString().padStart(2, '0') &&
                                                filters.day === now.getDate().toString().padStart(2, '0');
                                            return isToday
                                                ? "bg-[#2d5016] text-white border-[#2d5016] shadow-sm shadow-[#2d5016]/30 dark:bg-emerald-600 dark:border-emerald-500"
                                                : "bg-[#2d5016]/5 dark:bg-white/5 text-[#2d5016] dark:text-emerald-400 border-[#2d5016]/20 dark:border-white/10 hover:bg-[#2d5016]/15 hover:border-[#2d5016]/40";
                                        })()
                                    )}
                                >
                                    Hôm nay
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        const yest = new Date();
                                        yest.setDate(yest.getDate() - 1);
                                        setFilters({
                                            year: yest.getFullYear().toString(),
                                            month: (yest.getMonth() + 1).toString().padStart(2, '0'),
                                            day: yest.getDate().toString().padStart(2, '0')
                                        });
                                    }}
                                    className={cn(
                                        "px-2.5 py-1 text-[10.5px] font-black rounded-xl transition-all border cursor-pointer",
                                        (() => {
                                            const yest = new Date();
                                            yest.setDate(yest.getDate() - 1);
                                            const isYest = filters.year === yest.getFullYear().toString() &&
                                                filters.month === (yest.getMonth() + 1).toString().padStart(2, '0') &&
                                                filters.day === yest.getDate().toString().padStart(2, '0');
                                            return isYest
                                                ? "bg-[#2d5016] text-white border-[#2d5016] shadow-sm shadow-[#2d5016]/30 dark:bg-emerald-600 dark:border-emerald-500"
                                                : "bg-[#2d5016]/5 dark:bg-white/5 text-[#2d5016] dark:text-emerald-400 border-[#2d5016]/20 dark:border-white/10 hover:bg-[#2d5016]/15 hover:border-[#2d5016]/40";
                                        })()
                                    )}
                                >
                                    Hôm qua
                                </button>
                            </div>
                        </div>

                        {/* Modern Glowing IP Badge */}
                        {remoteInfo && (
                            <div className="group relative flex items-center gap-2 px-3.5 py-1.5 bg-gradient-to-r from-[#2d5016]/15 to-[#2d5016]/8 dark:from-emerald-950/40 dark:to-emerald-900/20 rounded-2xl text-[10px] font-black text-[#2d5016] dark:text-emerald-300 border border-[#2d5016]/30 dark:border-emerald-500/30 shadow-[0_2px_10px_rgba(45,80,22,0.08)] shrink-0 hover:border-[#2d5016] dark:hover:border-emerald-400 transition-all">
                                <span className="relative flex h-2 w-2">
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500 shadow-xs"></span>
                                </span>
                                <div className="flex items-center gap-1.5 font-mono">
                                    <span className="text-[#8b6f47] dark:text-emerald-400/70 uppercase text-[9px] tracking-wider font-sans font-extrabold">IP Mạng:</span>
                                    <span className="font-bold tracking-tight">{remoteInfo.ip}:{remoteInfo.port || (window.location.port || '3579')}</span>
                                </div>
                            </div>
                        )}
                    </div>
                </m.div>

                {/* 3. Main Stats - Modern Integrated Panorama Strip Layout with Watermark Icons */}
                <m.div variants={itemVariants} className="md:col-span-12 xl:col-span-12">
                    <div 
                        className={cn(
                            "relative overflow-hidden rounded-[2.5rem] border border-[#8b6f47]/25 dark:border-white/10 shadow-[0_10px_35px_rgba(139,111,71,0.06)] dark:shadow-[0_10px_35px_rgba(0,0,0,0.3)] transition-all duration-300",
                            cardGlassEnabled ? "" : "bg-[#fbf9f4] dark:bg-[#1a1c18] shadow-lg"
                        )}
                        style={getCardGlassStyle()}
                    >
                        {/* 4 Primary Key Indicators Row */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-[#8b6f47]/15 dark:divide-white/10">
                            
                            {/* 1. Doanh thu */}
                            <div className="relative p-6 lg:p-7 overflow-hidden group hover:bg-[#8b6f47]/[0.03] dark:hover:bg-white/[0.02] transition-colors">
                                {/* Large Watermark Icon Inset in Card Background */}
                                <div className="absolute -right-4 -bottom-4 text-[#2d5016]/[0.09] dark:text-emerald-400/[0.08] pointer-events-none group-hover:scale-110 group-hover:rotate-6 transition-transform duration-500">
                                    <Wheat size={120} strokeWidth={1.8} />
                                </div>
                                <div className="relative z-10 flex flex-col justify-between h-full min-h-[120px]">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-black text-[#8b6f47] dark:text-[#d4a574] uppercase tracking-[0.2em]">
                                            Doanh thu
                                        </span>
                                        {stats.revenue_trend !== undefined && (
                                            <span className={cn(
                                                "px-2 py-0.5 rounded-full flex items-center gap-1 text-[9.5px] font-black tracking-tight",
                                                stats.revenue_trend >= 0 
                                                    ? "bg-[#2d5016]/10 text-[#2d5016] border border-[#2d5016]/20 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30" 
                                                    : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                                            )}>
                                                {stats.revenue_trend >= 0 ? <TrendingUp size={9} /> : <TrendingDown size={9} />}
                                                {Math.abs(stats.revenue_trend)}%
                                            </span>
                                        )}
                                    </div>
                                    <div className="my-2 min-h-[40px] flex items-center">
                                        <AnimatePresence mode="wait">
                                            <m.h3 
                                                key={hideStats ? "hidden-rev" : "visible-rev"}
                                                initial={{ opacity: 0, y: 6, filter: 'blur(6px)' }}
                                                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                                                exit={{ opacity: 0, y: -6, filter: 'blur(6px)' }}
                                                transition={{ duration: 0.25, ease: 'easeOut' }}
                                                className="text-3xl lg:text-4xl font-black text-[#2d5016] dark:text-[#e8dfd5] tracking-tight leading-none"
                                            >
                                                {hideStats ? "••••••••" : formatCurrency(stats.revenue)}
                                            </m.h3>
                                        </AnimatePresence>
                                    </div>
                                    <div className="flex items-center gap-3 pt-2 border-t border-[#8b6f47]/10 dark:border-white/5 text-[10px] font-bold text-[#8b6f47] dark:text-[#d4a574]">
                                        <span className="flex items-center gap-1">
                                            <Wallet size={11} className="text-[#2d5016] dark:text-emerald-400" />
                                            Tiền mặt: <strong className="text-[#2d5016] dark:text-[#e8dfd5] font-black">{hideStats ? "••••••" : formatCurrency(stats.cash_revenue || 0)}</strong>
                                        </span>
                                        <span className="opacity-40">•</span>
                                        <span className="flex items-center gap-1">
                                            <Users size={11} className="text-[#8b6f47] dark:text-[#d4a574]" />
                                            Công nợ: <strong className="text-[#2d5016] dark:text-[#e8dfd5] font-black">{hideStats ? "••••••" : formatCurrency(stats.debt_revenue || 0)}</strong>
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* 2. Lợi nhuận */}
                            <div className="relative p-6 lg:p-7 overflow-hidden group hover:bg-[#8b6f47]/[0.03] dark:hover:bg-white/[0.02] transition-colors">
                                <div className="absolute -right-4 -bottom-4 text-[#8b6f47]/[0.09] dark:text-[#d4a574]/[0.08] pointer-events-none group-hover:scale-110 group-hover:-rotate-6 transition-transform duration-500">
                                    <Coins size={120} strokeWidth={1.8} />
                                </div>
                                <div className="relative z-10 flex flex-col justify-between h-full min-h-[120px]">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-black text-[#8b6f47] dark:text-[#d4a574] uppercase tracking-[0.2em]">
                                            Lợi nhuận
                                        </span>
                                        {stats.profit_trend !== undefined && (
                                            <span className={cn(
                                                "px-2 py-0.5 rounded-full flex items-center gap-1 text-[9.5px] font-black tracking-tight",
                                                stats.profit_trend >= 0 
                                                    ? "bg-[#2d5016]/10 text-[#2d5016] border border-[#2d5016]/20 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30" 
                                                    : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                                            )}>
                                                {stats.profit_trend >= 0 ? <TrendingUp size={9} /> : <TrendingDown size={9} />}
                                                {Math.abs(stats.profit_trend)}%
                                            </span>
                                        )}
                                    </div>
                                    <div className="my-2 min-h-[40px] flex items-center">
                                        <AnimatePresence mode="wait">
                                            <m.h3 
                                                key={hideStats ? "hidden-prof" : "visible-prof"}
                                                initial={{ opacity: 0, y: 6, filter: 'blur(6px)' }}
                                                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                                                exit={{ opacity: 0, y: -6, filter: 'blur(6px)' }}
                                                transition={{ duration: 0.25, ease: 'easeOut' }}
                                                className="text-3xl lg:text-4xl font-black text-[#2d5016] dark:text-[#e8dfd5] tracking-tight leading-none"
                                            >
                                                {hideStats ? "••••••••" : formatCurrency(stats.profit)}
                                            </m.h3>
                                        </AnimatePresence>
                                    </div>
                                    <div className="flex items-center gap-1.5 pt-2 border-t border-[#8b6f47]/10 dark:border-white/5 text-[10px] font-bold text-[#8b6f47] dark:text-[#d4a574]">
                                        <div className="w-1.5 h-1.5 rounded-full bg-[#8b6f47] dark:bg-[#d4a574]" />
                                        <span>Sau khi trừ vốn nhập</span>
                                    </div>
                                </div>
                            </div>

                            {/* 3. Tổng nợ thu */}
                            <div className="relative p-6 lg:p-7 overflow-hidden group hover:bg-[#8b6f47]/[0.03] dark:hover:bg-white/[0.02] transition-colors">
                                <div className="absolute -right-4 -bottom-4 text-[#2d5016]/[0.09] dark:text-emerald-400/[0.08] pointer-events-none group-hover:scale-110 group-hover:rotate-6 transition-transform duration-500">
                                    <Users size={120} strokeWidth={1.8} />
                                </div>
                                <div className="relative z-10 flex flex-col justify-between h-full min-h-[120px]">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-black text-[#8b6f47] dark:text-[#d4a574] uppercase tracking-[0.2em]">
                                            Tổng nợ thu
                                        </span>
                                    </div>
                                    <div className="my-2 min-h-[40px] flex items-center">
                                        <AnimatePresence mode="wait">
                                            <m.h3 
                                                key={hideStats ? "hidden-debt" : "visible-debt"}
                                                initial={{ opacity: 0, y: 6, filter: 'blur(6px)' }}
                                                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                                                exit={{ opacity: 0, y: -6, filter: 'blur(6px)' }}
                                                transition={{ duration: 0.25, ease: 'easeOut' }}
                                                className="text-3xl lg:text-4xl font-black text-[#2d5016] dark:text-[#e8dfd5] tracking-tight leading-none"
                                            >
                                                {hideStats ? "••••••••" : formatCurrency(Math.abs(stats.customer_debt))}
                                            </m.h3>
                                        </AnimatePresence>
                                    </div>
                                    <div className="flex items-center gap-1.5 pt-2 border-t border-[#8b6f47]/10 dark:border-white/5 text-[10px] font-bold text-[#8b6f47] dark:text-[#d4a574]">
                                        <div className="w-1.5 h-1.5 rounded-full bg-[#2d5016] dark:bg-emerald-400" />
                                        <span>Khách hàng còn nợ</span>
                                    </div>
                                </div>
                            </div>

                            {/* 4. Tổng nợ trả */}
                            <div className="relative p-6 lg:p-7 overflow-hidden group hover:bg-[#8b6f47]/[0.03] dark:hover:bg-white/[0.02] transition-colors">
                                <div className="absolute -right-4 -bottom-4 text-rose-500/[0.08] dark:text-rose-400/[0.08] pointer-events-none group-hover:scale-110 group-hover:-rotate-6 transition-transform duration-500">
                                    <Truck size={120} strokeWidth={1.8} />
                                </div>
                                <div className="relative z-10 flex flex-col justify-between h-full min-h-[120px]">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-black text-[#8b6f47] dark:text-[#d4a574] uppercase tracking-[0.2em]">
                                            Tổng nợ trả
                                        </span>
                                    </div>
                                    <div className="my-2 min-h-[40px] flex items-center">
                                        <AnimatePresence mode="wait">
                                            <m.h3 
                                                key={hideStats ? "hidden-supp" : "visible-supp"}
                                                initial={{ opacity: 0, y: 6, filter: 'blur(6px)' }}
                                                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                                                exit={{ opacity: 0, y: -6, filter: 'blur(6px)' }}
                                                transition={{ duration: 0.25, ease: 'easeOut' }}
                                                className="text-3xl lg:text-4xl font-black text-rose-600 dark:text-rose-400 tracking-tight leading-none"
                                            >
                                                {hideStats ? "••••••••" : formatCurrency(Math.abs(stats.supplier_debt))}
                                            </m.h3>
                                        </AnimatePresence>
                                    </div>
                                    <div className="flex items-center gap-1.5 pt-2 border-t border-[#8b6f47]/10 dark:border-white/5 text-[10px] font-bold text-rose-600/80 dark:text-rose-400/80">
                                        <div className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                                        <span>Nợ nhà cung cấp</span>
                                    </div>
                                </div>
                            </div>

                        </div>

                        {/* Secondary Indicators Strip with Watermark Details */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 border-t border-[#8b6f47]/20 dark:border-white/10 bg-[#8b6f47]/[0.04] dark:bg-white/[0.02] divide-y sm:divide-y-0 sm:divide-x divide-[#8b6f47]/15 dark:divide-white/10">
                            
                            <div 
                                onClick={() => navigate('/products?filter=near_expiry')}
                                className="relative px-6 py-4 flex items-center justify-between group cursor-pointer hover:bg-[#8b6f47]/10 dark:hover:bg-white/5 transition-colors overflow-hidden"
                            >
                                <div className="absolute -right-2 -bottom-2 text-[#8b6f47]/[0.08] dark:text-white/[0.06] pointer-events-none group-hover:scale-110 transition-transform">
                                    <Package size={54} strokeWidth={1.5} />
                                </div>
                                <div className="relative z-10">
                                    <p className="text-[9px] font-black text-[#8b6f47] dark:text-[#d4a574] uppercase tracking-[0.18em]">Sắp hết hạn</p>
                                    <p className="text-xl font-black text-[#2d5016] dark:text-[#e8dfd5] leading-tight">{stats.expiry?.near || 0}</p>
                                </div>
                            </div>

                            <div 
                                onClick={() => navigate('/products?filter=expired')}
                                className="relative px-6 py-4 flex items-center justify-between group cursor-pointer hover:bg-[#8b6f47]/10 dark:hover:bg-white/5 transition-colors overflow-hidden"
                            >
                                <div className="absolute -right-2 -bottom-2 text-rose-500/[0.08] dark:text-rose-400/[0.06] pointer-events-none group-hover:scale-110 transition-transform">
                                    <AlertCircle size={54} strokeWidth={1.5} />
                                </div>
                                <div className="relative z-10">
                                    <p className="text-[9px] font-black text-[#8b6f47] dark:text-[#d4a574] uppercase tracking-[0.18em]">Đã quá hạn</p>
                                    <p className="text-xl font-black text-rose-600 dark:text-rose-400 leading-tight">{stats.expiry?.expired || 0}</p>
                                </div>
                            </div>

                            <div 
                                onClick={() => navigate('/products?filter=warning')}
                                className="relative px-6 py-4 flex items-center justify-between group cursor-pointer hover:bg-[#8b6f47]/10 dark:hover:bg-white/5 transition-colors overflow-hidden"
                            >
                                <div className="absolute -right-2 -bottom-2 text-[#8b6f47]/[0.08] dark:text-white/[0.06] pointer-events-none group-hover:scale-110 transition-transform">
                                    <ShoppingBag size={54} strokeWidth={1.5} />
                                </div>
                                <div className="relative z-10">
                                    <p className="text-[9px] font-black text-[#8b6f47] dark:text-[#d4a574] uppercase tracking-[0.18em]">Cần nhập ngay</p>
                                    <p className="text-xl font-black text-[#2d5016] dark:text-[#e8dfd5] leading-tight">{stats.low_stock || 0}</p>
                                </div>
                            </div>

                            <div className="relative px-6 py-4 flex items-center justify-between group overflow-hidden">
                                <div className="absolute -right-2 -bottom-2 text-[#2d5016]/[0.08] dark:text-emerald-400/[0.06] pointer-events-none group-hover:scale-110 transition-transform">
                                    <Target size={54} strokeWidth={1.5} />
                                </div>
                                <div className="relative z-10">
                                    <p className="text-[9px] font-black text-[#8b6f47] dark:text-[#d4a574] uppercase tracking-[0.18em]">Tỷ suất LN</p>
                                    <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 leading-tight">
                                        {stats.revenue > 0 ? `${((stats.profit / stats.revenue) * 100).toFixed(1)}%` : '0%'}
                                    </p>
                                </div>
                            </div>

                        </div>
                    </div>
                </m.div>

                {/* 5. Charts - Seamless Panorama Strip with Watermark Backgrounds */}
                <m.div layout="position" variants={itemVariants} className="md:col-span-12 xl:col-span-12">
                    <div 
                        className={cn(
                            "grid grid-cols-1 xl:grid-cols-12 overflow-hidden rounded-[2.5rem] border border-[#8b6f47]/25 dark:border-white/10 shadow-[0_10px_35px_rgba(139,111,71,0.06)] dark:shadow-[0_10px_35px_rgba(0,0,0,0.3)] divide-y xl:divide-y-0 xl:divide-x divide-[#8b6f47]/15 dark:divide-white/10 transition-all duration-300",
                            cardGlassEnabled ? "" : "bg-[#fbf9f4] dark:bg-[#1a1c18] shadow-lg"
                        )}
                        style={getCardGlassStyle()}
                    >
                        
                        {/* 5.1 Bar Chart Span 8 */}
                        <div className="xl:col-span-8 p-6 lg:p-8 relative overflow-hidden group">
                            {/* Watermark Icon */}
                            <div className="absolute -right-6 -bottom-6 text-[#2d5016]/[0.06] dark:text-emerald-400/[0.05] pointer-events-none group-hover:scale-105 transition-transform duration-500">
                                <BarChart3 size={200} strokeWidth={1.5} />
                            </div>

                            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 relative z-10 gap-4">
                                <div>
                                    <h3 className="text-base lg:text-lg font-black text-[#2d5016] dark:text-[#e8dfd5] uppercase tracking-tight flex items-center gap-2.5">
                                        Hiệu suất 7 ngày qua
                                    </h3>
                                    <p className="text-[10px] text-[#8b6f47] dark:text-[#d4a574] font-black tracking-wider mt-0.5 uppercase">
                                        Doanh thu & Lợi nhuận
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                     <div className="flex items-center gap-1.5 px-3 py-1 bg-[#2d5016]/10 rounded-full border border-[#2d5016]/20 text-[9px] font-black uppercase tracking-wider text-[#2d5016] dark:text-emerald-400">
                                        <div className="w-1.5 h-1.5 rounded-full bg-[#2d5016] dark:bg-emerald-400" /> Doanh thu
                                     </div>
                                     <div className="flex items-center gap-1.5 px-3 py-1 bg-[#8b6f47]/15 rounded-full border border-[#8b6f47]/25 text-[9px] font-black uppercase tracking-wider text-[#8b6f47] dark:text-[#d4a574]">
                                        <div className="w-1.5 h-1.5 rounded-full bg-[#8b6f47] dark:bg-[#d4a574]" /> Lợi nhuận
                                     </div>
                                </div>
                            </div>
                            
                            <div className="h-[290px] relative z-10">
                                <Bar options={chartOptions('Hiệu suất tài chính')} data={chartData} />
                            </div>
                        </div>

                        {/* 5.2 Debt Doughnut Chart Span 4 */}
                        <div className="xl:col-span-4 p-6 lg:p-8 relative overflow-hidden flex flex-col justify-between group">
                            {/* Watermark Icon */}
                            <div className="absolute -right-6 -bottom-6 text-[#8b6f47]/[0.06] dark:text-[#d4a574]/[0.05] pointer-events-none group-hover:scale-105 transition-transform duration-500">
                                <PieChart size={180} strokeWidth={1.5} />
                            </div>

                            <div className="mb-4 relative z-10">
                                <h3 className="text-base lg:text-lg font-black text-[#2d5016] dark:text-[#e8dfd5] uppercase tracking-tight">
                                    Cân bằng nợ
                                </h3>
                                <p className="text-[10px] text-[#8b6f47] dark:text-[#d4a574] font-black tracking-wider mt-0.5 uppercase">
                                    Tỷ lệ Phải Thu / Phải Trả
                                </p>
                            </div>

                            <div className="flex-1 min-h-[220px] flex items-center justify-center relative z-10">
                                <Doughnut options={doughnutOptions} data={debtChartData} />
                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                     <div className="flex flex-col items-center justify-center">
                                        <span className="text-[8px] font-black uppercase text-[#8b6f47] dark:text-[#d4a574] tracking-[0.2em]">Tỷ lệ nợ</span>
                                        <span className="text-2xl font-black text-[#2d5016] dark:text-[#e8dfd5] tracking-tight leading-none my-0.5">
                                            {Math.round((Math.abs(stats.customer_debt) / (Math.max(1, Math.abs(stats.customer_debt) + Math.abs(stats.supplier_debt)))) * 100)}%
                                        </span>
                                        <span className="text-[8px] font-black uppercase tracking-widest text-[#2d5016] dark:text-emerald-400">Phải thu</span>
                                     </div>
                                </div>
                            </div>
                        </div>

                    </div>
                </m.div>

                {/* 6. Debt Lists - Seamless Panorama Dual Panel with Watermark Icons */}
                <m.div layout="position" variants={itemVariants} className="md:col-span-12 xl:col-span-12">
                    <div 
                        className={cn(
                            "grid grid-cols-1 lg:grid-cols-2 overflow-hidden rounded-[2.5rem] border border-[#8b6f47]/25 dark:border-white/10 shadow-[0_10px_35px_rgba(139,111,71,0.06)] dark:shadow-[0_10px_35px_rgba(0,0,0,0.3)] divide-y lg:divide-y-0 lg:divide-x divide-[#8b6f47]/15 dark:divide-white/10 transition-all duration-300",
                            cardGlassEnabled ? "" : "bg-[#fbf9f4] dark:bg-[#1a1c18] shadow-lg"
                        )}
                        style={getCardGlassStyle()}
                    >
                        
                        {/* 6.1 Khách hàng nợ */}
                        <div className="p-6 lg:p-8 relative overflow-hidden group">
                            {/* Watermark Icon */}
                            <div className="absolute -right-4 -bottom-4 text-[#2d5016]/[0.06] dark:text-emerald-400/[0.05] pointer-events-none group-hover:scale-105 transition-transform duration-500">
                                <Users size={180} strokeWidth={1.5} />
                            </div>

                            <div className="flex items-center justify-between gap-4 mb-5 relative z-10">
                                <div>
                                    <h3 className="text-base font-black text-[#2d5016] dark:text-[#e8dfd5] uppercase tracking-tight">
                                        Khách hàng nợ
                                    </h3>
                                    <p className="text-[10px] font-black text-[#8b6f47] dark:text-[#d4a574] uppercase tracking-wider mt-0.5">Top 10 nợ cao nhất</p>
                                </div>
                                <Link to="/partners" className="px-3.5 py-1.5 bg-[#2d5016]/10 text-[#2d5016] dark:bg-emerald-500/15 dark:text-emerald-300 border border-[#2d5016]/20 rounded-xl text-[9.5px] font-black uppercase tracking-wider hover:bg-[#2d5016] hover:text-white transition-colors shrink-0">
                                    Chi tiết ➔
                                </Link>
                            </div>

                            <div className="space-y-2.5 max-h-[350px] overflow-y-auto no-scrollbar pr-1 relative z-10">
                                {stats.customer_debt_list?.length > 0 ? (
                                    stats.customer_debt_list.slice(0, 10).map((p, idx) => (
                                        <m.div
                                            key={p.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: idx * 0.03 }}
                                            whileHover={{ x: 4, backgroundColor: 'rgba(255,255,255,0.1)' }}
                                            className="flex items-center justify-between p-3 bg-white/50 dark:bg-white/[0.03] rounded-2xl border border-[#8b6f47]/15 dark:border-white/10 hover:border-[#2d5016]/40 transition-all shadow-none group"
                                        >
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className="w-9 h-9 rounded-xl bg-[#2d5016]/10 text-[#2d5016] dark:bg-emerald-500/15 dark:text-emerald-400 font-black text-xs border border-[#2d5016]/20 flex items-center justify-center shrink-0">
                                                    {getInitials(p.name)}
                                                </div>
                                                <span className="font-black text-slate-800 dark:text-[#e8dfd5] text-sm truncate">{p.name}</span>
                                            </div>
                                            <div className="flex items-center gap-2.5 shrink-0">
                                                <span className="font-black text-[#2d5016] dark:text-emerald-400 text-sm tracking-tight">{formatDebt(p.balance)}</span>
                                                <span className="text-[9px] font-black w-5 h-5 flex items-center justify-center bg-[#8b6f47]/10 text-[#8b6f47] dark:bg-white/10 dark:text-[#d4a574] rounded-md">#{idx + 1}</span>
                                            </div>
                                        </m.div>
                                    ))
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-16 opacity-50">
                                        <Users size={36} className="text-[#2d5016] mb-2 opacity-50" />
                                        <p className="font-black uppercase tracking-wider text-xs italic text-[#8b6f47]">Không có công nợ</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* 6.2 Nợ nhà cung cấp */}
                        <div className="p-6 lg:p-8 relative overflow-hidden group">
                            {/* Watermark Icon */}
                            <div className="absolute -right-4 -bottom-4 text-rose-500/[0.06] dark:text-rose-400/[0.05] pointer-events-none group-hover:scale-105 transition-transform duration-500">
                                <Truck size={180} strokeWidth={1.5} />
                            </div>

                            <div className="flex items-center justify-between gap-4 mb-5 relative z-10">
                                <div>
                                    <h3 className="text-base font-black text-[#2d5016] dark:text-[#e8dfd5] uppercase tracking-tight">
                                        Nợ nhà cung cấp
                                    </h3>
                                    <p className="text-[10px] font-black text-[#8b6f47] dark:text-[#d4a574] uppercase tracking-wider mt-0.5">Cần thanh toán</p>
                                </div>
                                <Link to="/partners" className="px-3.5 py-1.5 bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 rounded-xl text-[9.5px] font-black uppercase tracking-wider hover:bg-rose-600 hover:text-white transition-colors shrink-0">
                                    Chi tiết ➔
                                </Link>
                            </div>

                            <div className="space-y-2.5 max-h-[350px] overflow-y-auto no-scrollbar pr-1 relative z-10">
                                {stats.supplier_debt_list?.length > 0 ? (
                                    stats.supplier_debt_list.slice(0, 10).map((p, idx) => (
                                        <m.div
                                            key={p.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: idx * 0.03 }}
                                            whileHover={{ x: 4, backgroundColor: 'rgba(255,255,255,0.1)' }}
                                            className="flex items-center justify-between p-3 bg-white/50 dark:bg-white/[0.03] rounded-2xl border border-[#8b6f47]/15 dark:border-white/10 hover:border-rose-500/40 transition-all shadow-none group"
                                        >
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400 font-black text-xs border border-rose-500/20 flex items-center justify-center shrink-0">
                                                    {getInitials(p.name)}
                                                </div>
                                                <span className="font-black text-slate-800 dark:text-[#e8dfd5] text-sm truncate">{p.name}</span>
                                            </div>
                                            <div className="flex items-center gap-2.5 shrink-0">
                                                <span className="font-black text-rose-600 dark:text-rose-400 text-sm tracking-tight">{formatDebt(p.balance)}</span>
                                                <span className="text-[9px] font-black w-5 h-5 flex items-center justify-center bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-md">#{idx + 1}</span>
                                            </div>
                                        </m.div>
                                    ))
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-16 opacity-50">
                                        <Truck size={36} className="text-rose-500 mb-2 opacity-50" />
                                        <p className="font-black uppercase tracking-wider text-xs italic text-[#8b6f47]">Chưa có nợ</p>
                                    </div>
                                )}
                            </div>
                        </div>

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
                                className="bg-card w-full max-w-lg rounded-2xl border border-border flex flex-col relative z-10 overflow-hidden shadow-2xl"
                            >
                                {/* Modal Header */}
                                <div className="p-4 sm:p-5 flex items-center justify-between border-b border-border bg-card">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20 text-primary">
                                            <Sparkles size={20} />
                                        </div>
                                        <div>
                                            <h3 className="text-base font-bold text-foreground uppercase tracking-wide leading-tight">Tùy Chỉnh Giao Diện</h3>
                                            <p className="text-muted-foreground text-[10px] font-medium uppercase tracking-widest mt-0.5">Hình nền & Hiệu ứng thẻ</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setShowWallpaperSettings(false)}
                                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-transparent hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                                    >
                                        <X size={16} strokeWidth={2.5} />
                                    </button>
                                </div>

                                {/* Tabs Navigation */}
                                <div className="px-5 pt-3 pb-2 border-b border-border/70 bg-card/60">
                                    <div className="flex p-1 bg-black/[0.04] dark:bg-white/[0.04] rounded-xl border border-border/60 gap-1">
                                        {[
                                            { id: 'wallpaper', label: 'Hình Nền', icon: ImageIcon },
                                            { id: 'glass', label: 'Kính Mờ Thẻ', icon: Layers },
                                            { id: 'glow', label: 'Viền Glow Thẻ', icon: Sparkles }
                                        ].map((t) => {
                                            const Icon = t.icon;
                                            const isSelected = cardSettingsTab === t.id;
                                            return (
                                                <button
                                                    key={t.id}
                                                    type="button"
                                                    onClick={() => setCardSettingsTab(t.id)}
                                                    className={cn(
                                                        "flex-1 flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
                                                        isSelected
                                                            ? "bg-[#2d5016] text-white dark:bg-emerald-600 shadow-xs"
                                                            : "text-foreground/70 hover:text-foreground hover:bg-black/[0.03] dark:hover:bg-white/[0.03]"
                                                    )}
                                                >
                                                    <Icon size={14} className={isSelected ? "text-white" : "text-muted-foreground"} />
                                                    <span className="truncate">{t.label}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Tab Contents */}
                                <div className="p-5 flex flex-col gap-5 overflow-y-auto max-h-[65vh] bg-card/40">
                                    {/* TAB 1: WALLPAPER */}
                                    {cardSettingsTab === 'wallpaper' && (
                                        <div className="space-y-4">
                                            {/* Preview & Upload */}
                                            <div className="space-y-3">
                                                <label className="text-xs font-bold text-foreground/80 uppercase tracking-wider">Ảnh Nền Hiện Tại</label>
                                                {appWallpaper.image ? (
                                                    <div className="relative w-full h-36 rounded-xl overflow-hidden border border-border group bg-black/5 dark:bg-white/5">
                                                        <img 
                                                            src={appWallpaper.image} 
                                                            alt="Preview" 
                                                            className="w-full h-full object-cover"
                                                        />
                                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                                                            <label className="p-2 bg-white/20 hover:bg-white/40 rounded-lg cursor-pointer text-white backdrop-blur-md transition-colors">
                                                                <ImageIcon size={18} />
                                                                <input
                                                                    type="file"
                                                                    accept="image/*"
                                                                    className="hidden"
                                                                    onChange={(e) => {
                                                                        const file = e.target.files[0];
                                                                        if (file) compressAndSetWallpaper(file);
                                                                    }}
                                                                />
                                                            </label>
                                                            <button 
                                                                onClick={() => setAppWallpaper(prev => ({ ...prev, image: null }))}
                                                                className="p-2 bg-red-500/80 hover:bg-red-500 rounded-lg text-white backdrop-blur-md transition-colors cursor-pointer"
                                                            >
                                                                <Trash2 size={18} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <label className="flex flex-col items-center justify-center w-full h-32 bg-background/50 border-2 border-dashed border-border rounded-xl cursor-pointer hover:bg-primary/5 hover:border-primary/30 transition-colors">
                                                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-1.5">
                                                            <ImageIcon size={20} />
                                                        </div>
                                                        <span className="text-xs font-semibold text-foreground/70">Nhấp để tải ảnh lên từ máy</span>
                                                        <span className="text-[10px] text-muted-foreground mt-0.5">Hỗ trợ JPG, PNG (Tối đa 4MB)</span>
                                                        <input
                                                            type="file"
                                                            accept="image/*"
                                                            className="hidden"
                                                            onChange={(e) => {
                                                                const file = e.target.files[0];
                                                                if (file) compressAndSetWallpaper(file);
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
                                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-1 bg-black/[0.02] dark:bg-white/[0.02] rounded-xl border border-border/60">
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
                                                                <div className="w-full h-14 rounded-lg overflow-hidden border border-border/60 relative">
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

                                            {/* Size & Position */}
                                            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border/60">
                                                <div className="space-y-1.5">
                                                    <label className="text-xs font-bold text-foreground/80 uppercase tracking-wider">Kích Thước</label>
                                                    <CustomSelect
                                                        className="w-full"
                                                        value={appWallpaper.size || "cover"}
                                                        onChange={(e) => {
                                                            const val = e?.target ? e.target.value : e;
                                                            setAppWallpaper(prev => ({ ...prev, size: val }));
                                                        }}
                                                        options={[
                                                            { value: "cover", label: "Vừa khít (Cover)" },
                                                            { value: "contain", label: "Thu gọn (Contain)" },
                                                            { value: "auto", label: "Tự động (Auto)" },
                                                            { value: "100% 100%", label: "Kéo giãn (100%)" }
                                                        ]}
                                                    />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label className="text-xs font-bold text-foreground/80 uppercase tracking-wider">Vị Trí</label>
                                                    <CustomSelect
                                                        className="w-full"
                                                        value={appWallpaper.position || "center"}
                                                        onChange={(e) => {
                                                            const val = e?.target ? e.target.value : e;
                                                            setAppWallpaper(prev => ({ ...prev, position: val }));
                                                        }}
                                                        options={[
                                                            { value: "center", label: "Giữa (Center)" },
                                                            { value: "top", label: "Trên (Top)" },
                                                            { value: "bottom", label: "Dưới (Bottom)" },
                                                            { value: "left", label: "Trái (Left)" },
                                                            { value: "right", label: "Phải (Right)" }
                                                        ]}
                                                    />
                                                </div>
                                            </div>

                                            {/* Sliders: Blur & Opacity */}
                                            <div className="space-y-3 pt-2">
                                                <div className="space-y-1.5">
                                                    <div className="flex justify-between items-center">
                                                        <label className="text-xs font-bold text-foreground/80 uppercase tracking-wider">Độ Mờ Nền (Blur)</label>
                                                        <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">{appWallpaper.blur || 0}px</span>
                                                    </div>
                                                    <input
                                                        type="range"
                                                        min="0"
                                                        max="50"
                                                        value={appWallpaper.blur || 0}
                                                        onChange={(e) => setAppWallpaper(prev => ({ ...prev, blur: parseInt(e.target.value) }))}
                                                        className="w-full accent-[#2d5016] dark:accent-emerald-500 cursor-pointer"
                                                    />
                                                </div>

                                                <div className="space-y-1.5">
                                                    <div className="flex justify-between items-center">
                                                        <label className="text-xs font-bold text-foreground/80 uppercase tracking-wider">Độ Đậm Nền (Opacity)</label>
                                                        <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">{appWallpaper.opacity ?? 100}%</span>
                                                    </div>
                                                    <input
                                                        type="range"
                                                        min="0"
                                                        max="100"
                                                        value={appWallpaper.opacity ?? 100}
                                                        onChange={(e) => setAppWallpaper(prev => ({ ...prev, opacity: parseInt(e.target.value) }))}
                                                        className="w-full accent-[#2d5016] dark:accent-emerald-500 cursor-pointer"
                                                    />
                                                </div>
                                            </div>

                                            {/* Glass Overlay on Wallpaper */}
                                            <div className="space-y-3 pt-3 border-t border-border/60">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <label className="text-xs font-bold text-foreground/90 uppercase tracking-wider flex items-center gap-1.5">
                                                            <Layers size={14} className="text-emerald-500" />
                                                            Lớp Phủ Kính Hình Nền
                                                        </label>
                                                        <p className="text-[10px] text-muted-foreground font-medium">Hiệu ứng kính mờ che hình nền toàn trang</p>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        role="switch"
                                                        aria-checked={appWallpaper.glassEnabled !== false}
                                                        onClick={() => setAppWallpaper(prev => ({ ...prev, glassEnabled: prev.glassEnabled === false ? true : false }))}
                                                        className={cn(
                                                            "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none shadow-inner",
                                                            (appWallpaper.glassEnabled !== false)
                                                                ? "bg-[#2d5016] dark:bg-emerald-600"
                                                                : "bg-[#8b6f47]/30 dark:bg-white/20"
                                                        )}
                                                    >
                                                        <span
                                                            className={cn(
                                                                "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out",
                                                                (appWallpaper.glassEnabled !== false) ? "translate-x-5" : "translate-x-0"
                                                            )}
                                                        />
                                                    </button>
                                                </div>

                                                {(appWallpaper.glassEnabled !== false) && (
                                                    <div className="space-y-3 pl-1 pt-1">
                                                        <div className="space-y-1.5">
                                                            <div className="flex justify-between items-center">
                                                                <label className="text-xs font-bold text-foreground/80 uppercase tracking-wider">Độ Nhòe Kính</label>
                                                                <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">{appWallpaper.glassBlur !== undefined ? appWallpaper.glassBlur : 10}px</span>
                                                            </div>
                                                            <input
                                                                type="range"
                                                                min="0"
                                                                max="50"
                                                                value={appWallpaper.glassBlur !== undefined ? appWallpaper.glassBlur : 10}
                                                                onChange={(e) => setAppWallpaper(prev => ({ ...prev, glassBlur: parseInt(e.target.value) }))}
                                                                className="w-full accent-[#2d5016] dark:accent-emerald-500 cursor-pointer"
                                                            />
                                                        </div>

                                                        <div className="space-y-1.5">
                                                            <div className="flex justify-between items-center">
                                                                <label className="text-xs font-bold text-foreground/80 uppercase tracking-wider">Độ Đậm Kính</label>
                                                                <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">{appWallpaper.glassOpacity !== undefined ? appWallpaper.glassOpacity : 20}%</span>
                                                            </div>
                                                            <input
                                                                type="range"
                                                                min="0"
                                                                max="100"
                                                                value={appWallpaper.glassOpacity !== undefined ? appWallpaper.glassOpacity : 20}
                                                                onChange={(e) => setAppWallpaper(prev => ({ ...prev, glassOpacity: parseInt(e.target.value) }))}
                                                                className="w-full accent-[#2d5016] dark:accent-emerald-500 cursor-pointer"
                                                            />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Wallpaper Color Filter Presets */}
                                            <div className="space-y-3 pt-3 border-t border-border/60">
                                                <div className="flex items-center justify-between">
                                                    <label className="text-xs font-black text-foreground/90 uppercase tracking-wider flex items-center gap-1.5">
                                                        <Sparkles size={14} className="text-amber-500" />
                                                        Bộ Lọc Màu Hình Nền
                                                    </label>
                                                    {(appWallpaper.filterPreset || appWallpaper.brightness !== 100 || appWallpaper.contrast !== 100 || appWallpaper.saturate !== 100 || appWallpaper.sepia > 0 || appWallpaper.tintColor) && (
                                                        <button
                                                            type="button"
                                                            onClick={() => setAppWallpaper(prev => ({
                                                                ...prev,
                                                                filterPreset: 'normal',
                                                                brightness: 100,
                                                                contrast: 100,
                                                                saturate: 100,
                                                                sepia: 0,
                                                                hueRotate: 0,
                                                                grayscale: 0,
                                                                invert: 0,
                                                                tintColor: '',
                                                                tintOpacity: 20
                                                            }))}
                                                            className="text-[10px] font-bold text-rose-500 hover:underline cursor-pointer"
                                                        >
                                                            Đặt lại màu gốc
                                                        </button>
                                                    )}
                                                </div>

                                                <div className="grid grid-cols-4 gap-1.5">
                                                    {[
                                                        { id: 'normal', label: 'Gốc', filter: { brightness: 100, contrast: 100, saturate: 100, sepia: 0, hueRotate: 0, grayscale: 0, tintColor: '' } },
                                                        { id: 'warm', label: 'Ấm Áp', filter: { brightness: 102, contrast: 105, saturate: 120, sepia: 25, hueRotate: 0, grayscale: 0, tintColor: '#ffedd5', tintOpacity: 15 } },
                                                        { id: 'cool', label: 'Tươi Mát', filter: { brightness: 100, contrast: 105, saturate: 115, sepia: 0, hueRotate: 180, grayscale: 0, tintColor: '#e0f2fe', tintOpacity: 15 } },
                                                        { id: 'vintage', label: 'Vintage', filter: { brightness: 95, contrast: 90, saturate: 85, sepia: 50, hueRotate: 0, grayscale: 0, tintColor: '#fef3c7', tintOpacity: 25 } },
                                                        { id: 'nature', label: 'Xanh Lá', filter: { brightness: 100, contrast: 110, saturate: 130, sepia: 0, hueRotate: 85, grayscale: 0, tintColor: '#dcfce7', tintOpacity: 20 } },
                                                        { id: 'dramatic', label: 'Tương Phản', filter: { brightness: 105, contrast: 135, saturate: 125, sepia: 0, hueRotate: 0, grayscale: 0, tintColor: '' } },
                                                        { id: 'mono', label: 'Đen Trắng', filter: { brightness: 100, contrast: 120, saturate: 0, sepia: 0, hueRotate: 0, grayscale: 100, tintColor: '' } },
                                                        { id: 'cinema', label: 'Điện Ảnh', filter: { brightness: 90, contrast: 125, saturate: 110, sepia: 15, hueRotate: 0, grayscale: 0, tintColor: '#1e1b4b', tintOpacity: 20, tintBlendMode: 'color-burn' } }
                                                    ].map(preset => {
                                                        const isCurrent = appWallpaper.filterPreset === preset.id || (!appWallpaper.filterPreset && preset.id === 'normal');
                                                        return (
                                                            <button
                                                                key={preset.id}
                                                                type="button"
                                                                onClick={() => setAppWallpaper(prev => ({
                                                                    ...prev,
                                                                    filterPreset: preset.id,
                                                                    ...preset.filter
                                                                }))}
                                                                className={cn(
                                                                    "py-1.5 px-2 rounded-xl text-[11px] font-bold transition-all border text-center cursor-pointer",
                                                                    isCurrent 
                                                                        ? "bg-[#2d5016] text-white border-[#2d5016] dark:bg-emerald-600 dark:border-emerald-500 shadow-xs" 
                                                                        : "bg-black/[0.03] dark:bg-white/[0.05] border-border/80 text-foreground/80 hover:border-[#2d5016]/50"
                                                                )}
                                                            >
                                                                {preset.label}
                                                            </button>
                                                        );
                                                    })}
                                                </div>

                                                {/* Tint Overlay Color Picker */}
                                                <div className="space-y-2 pt-2 border-t border-border/40">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-xs font-bold text-foreground/80 uppercase tracking-wider">Phủ Màu Tint (Color Overlay)</span>
                                                        {appWallpaper.tintColor && (
                                                            <button
                                                                type="button"
                                                                onClick={() => setAppWallpaper(prev => ({ ...prev, tintColor: '' }))}
                                                                className="text-[10px] text-rose-500 hover:underline cursor-pointer"
                                                            >
                                                                Xóa phủ màu
                                                            </button>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <input
                                                            type="color"
                                                            value={appWallpaper.tintColor || "#2d5016"}
                                                            onChange={(e) => setAppWallpaper(prev => ({ ...prev, tintColor: e.target.value }))}
                                                            className="w-10 h-9 rounded-lg border border-border cursor-pointer p-0.5 bg-transparent"
                                                        />
                                                        <div className="flex-1 flex items-center gap-2">
                                                            <input
                                                                type="range"
                                                                min="0"
                                                                max="90"
                                                                value={appWallpaper.tintOpacity !== undefined ? appWallpaper.tintOpacity : 20}
                                                                onChange={(e) => setAppWallpaper(prev => ({ ...prev, tintOpacity: parseInt(e.target.value) }))}
                                                                className="flex-1 accent-[#2d5016] dark:accent-emerald-500"
                                                                disabled={!appWallpaper.tintColor}
                                                            />
                                                            <span className="text-xs font-bold text-primary min-w-[36px] text-right">
                                                                {appWallpaper.tintColor ? `${appWallpaper.tintOpacity ?? 20}%` : '0%'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* TAB 2: CARD GLASS */}
                                    {cardSettingsTab === 'glass' && (
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between p-3.5 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-border/80">
                                                <div>
                                                    <label className="text-xs font-bold text-foreground/90 uppercase tracking-wider flex items-center gap-1.5">
                                                        <Layers size={14} className="text-emerald-500" />
                                                        Bật Hiệu Ứng Kính Mờ Thẻ
                                                    </label>
                                                    <p className="text-[10px] text-muted-foreground font-medium mt-0.5">Xuyên thấu hình nền phía sau các thẻ thống kê</p>
                                                </div>
                                                <button
                                                    type="button"
                                                    role="switch"
                                                    aria-checked={cardGlassEnabled}
                                                    onClick={toggleCardGlass}
                                                    className={cn(
                                                        "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none shadow-inner",
                                                        cardGlassEnabled
                                                            ? "bg-[#2d5016] dark:bg-emerald-600"
                                                            : "bg-[#8b6f47]/30 dark:bg-white/20"
                                                    )}
                                                >
                                                    <span
                                                        className={cn(
                                                            "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out",
                                                            cardGlassEnabled ? "translate-x-5" : "translate-x-0"
                                                        )}
                                                    />
                                                </button>
                                            </div>

                                            {cardGlassEnabled && (
                                                <div className="space-y-4 pt-1">
                                                    {/* Quick Presets */}
                                                    <div className="space-y-2">
                                                        <label className="text-xs font-bold text-foreground/80 uppercase tracking-wider">Chế độ độ mờ nhanh</label>
                                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                                            {[
                                                                { label: 'Siêu Trong', opacity: 15, blur: 8 },
                                                                { label: 'Chuẩn Lyang', opacity: 40, blur: 16 },
                                                                { label: 'Kính Đậm', opacity: 70, blur: 24 },
                                                                { label: 'Đặc', opacity: 100, blur: 0 }
                                                            ].map(p => {
                                                                const isSel = cardGlassOpacity === p.opacity;
                                                                return (
                                                                    <button
                                                                        key={p.label}
                                                                        type="button"
                                                                        onClick={() => {
                                                                            updateCardGlassOpacity(p.opacity);
                                                                            updateCardGlassBlur(p.blur);
                                                                        }}
                                                                        className={cn(
                                                                            "py-2 px-2 rounded-xl text-xs font-bold transition-all border text-center cursor-pointer",
                                                                            isSel
                                                                                ? "bg-[#2d5016] text-white border-[#2d5016] dark:bg-emerald-600 dark:border-emerald-500 shadow-xs"
                                                                                : "bg-black/[0.03] dark:bg-white/[0.05] border-border/80 text-foreground/80 hover:border-[#2d5016]/40"
                                                                        )}
                                                                    >
                                                                        <div className="leading-tight">{p.label}</div>
                                                                        <div className="text-[10px] opacity-75 font-mono mt-0.5">{p.opacity}%</div>
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>

                                                    <div className="space-y-2 pt-2 border-t border-border/60">
                                                        <div className="flex justify-between items-center">
                                                            <label className="text-xs font-bold text-foreground/80 uppercase tracking-wider">Độ Đậm Thẻ (Opacity)</label>
                                                            <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">{cardGlassOpacity}%</span>
                                                        </div>
                                                        <input
                                                            type="range"
                                                            min="0"
                                                            max="100"
                                                            value={cardGlassOpacity}
                                                            onChange={(e) => updateCardGlassOpacity(parseInt(e.target.value))}
                                                            className="w-full accent-[#2d5016] dark:accent-emerald-500 cursor-pointer"
                                                        />
                                                        <div className="flex justify-between text-[10px] text-muted-foreground font-semibold">
                                                            <span>0% (Trong suốt hoàn toàn)</span>
                                                            <span>100% (Đặc không xuyên thấu)</span>
                                                        </div>
                                                    </div>

                                                    <div className="space-y-2 pt-2 border-t border-border/60">
                                                        <div className="flex justify-between items-center">
                                                            <label className="text-xs font-bold text-foreground/80 uppercase tracking-wider">Độ Nhòe Kính Thẻ (Blur)</label>
                                                            <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">{cardGlassBlur}px</span>
                                                        </div>
                                                        <input
                                                            type="range"
                                                            min="0"
                                                            max="40"
                                                            value={cardGlassBlur}
                                                            onChange={(e) => updateCardGlassBlur(parseInt(e.target.value))}
                                                            className="w-full accent-[#2d5016] dark:accent-emerald-500 cursor-pointer"
                                                        />
                                                        <div className="flex justify-between text-[10px] text-muted-foreground font-semibold">
                                                            <span>0px (Rõ nét)</span>
                                                            <span>40px (Mờ sương)</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* TAB 3: CARD GLOW */}
                                    {cardSettingsTab === 'glow' && (
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between p-3.5 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-border/80">
                                                <div>
                                                    <label className="text-xs font-bold text-foreground/90 uppercase tracking-wider flex items-center gap-1.5">
                                                        <Sparkles size={14} className="text-amber-500" />
                                                        Bật Viền Sáng Card (Border Glow)
                                                    </label>
                                                    <p className="text-[10px] text-muted-foreground font-medium mt-0.5">Hiệu ứng viền phát sáng nhẹ quanh các thẻ</p>
                                                </div>
                                                <button
                                                    type="button"
                                                    role="switch"
                                                    aria-checked={cardGlowEnabled}
                                                    onClick={toggleCardGlow}
                                                    className={cn(
                                                        "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none shadow-inner",
                                                        cardGlowEnabled
                                                            ? "bg-[#2d5016] dark:bg-emerald-600"
                                                            : "bg-[#8b6f47]/30 dark:bg-white/20"
                                                    )}
                                                >
                                                    <span
                                                        className={cn(
                                                            "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out",
                                                            cardGlowEnabled ? "translate-x-5" : "translate-x-0"
                                                        )}
                                                    />
                                                </button>
                                            </div>

                                            {cardGlowEnabled && (
                                                <div className="space-y-4 pt-1">
                                                    {/* Color Presets */}
                                                    <div className="space-y-2">
                                                        <div className="flex justify-between items-center text-xs font-bold text-foreground/80 uppercase tracking-wider">
                                                            <span>Màu Sắc Viền Glow</span>
                                                            <span className="font-mono text-[10px] text-primary bg-primary/10 px-2 py-0.5 rounded-full">{cardGlowColor}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2 flex-wrap p-2 bg-black/[0.02] dark:bg-white/[0.02] rounded-xl border border-border/60">
                                                            {[
                                                                { color: '#10b981', title: 'Xanh Ngọc' },
                                                                { color: '#2d5016', title: 'Lyang POS' },
                                                                { color: '#f59e0b', title: 'Vàng Kim' },
                                                                { color: '#06b6d4', title: 'Lam Neon' },
                                                                { color: '#a855f7', title: 'Tím Neon' },
                                                                { color: '#f43f5e', title: 'Hồng Đỏ' },
                                                                { color: '#ffffff', title: 'Pha Lê' }
                                                            ].map(preset => {
                                                                const isSel = cardGlowColor.toLowerCase() === preset.color.toLowerCase();
                                                                return (
                                                                    <button
                                                                        key={preset.color}
                                                                        type="button"
                                                                        onClick={() => updateCardGlowColor(preset.color)}
                                                                        title={preset.title}
                                                                        style={{ backgroundColor: preset.color }}
                                                                        className={cn(
                                                                            "w-7 h-7 rounded-full border-2 transition-all cursor-pointer shadow-xs",
                                                                            isSel ? "scale-115 border-foreground shadow-md ring-2 ring-primary/40" : "border-white/50 dark:border-black/50 opacity-80 hover:opacity-100"
                                                                        )}
                                                                    />
                                                                );
                                                            })}
                                                            <div className="h-6 w-[1px] bg-border mx-1" />
                                                            <input
                                                                type="color"
                                                                value={cardGlowColor}
                                                                onChange={(e) => updateCardGlowColor(e.target.value)}
                                                                className="w-8 h-7 rounded-lg border border-border cursor-pointer p-0 bg-transparent"
                                                                title="Chọn màu tùy biến"
                                                            />
                                                        </div>
                                                    </div>

                                                    {/* Sliders: Radius & Opacity */}
                                                    <div className="space-y-2 pt-2 border-t border-border/60">
                                                        <div className="flex justify-between items-center">
                                                            <label className="text-xs font-bold text-foreground/80 uppercase tracking-wider">Độ Lan Tỏa Glow (Radius)</label>
                                                            <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">{cardGlowSize}px</span>
                                                        </div>
                                                        <input
                                                            type="range"
                                                            min="4"
                                                            max="40"
                                                            value={cardGlowSize}
                                                            onChange={(e) => updateCardGlowSize(parseInt(e.target.value))}
                                                            className="w-full accent-[#2d5016] dark:accent-emerald-500 cursor-pointer"
                                                        />
                                                    </div>

                                                    <div className="space-y-2 pt-2 border-t border-border/60">
                                                        <div className="flex justify-between items-center">
                                                            <label className="text-xs font-bold text-foreground/80 uppercase tracking-wider">Độ Rực Sáng Glow (Opacity)</label>
                                                            <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">{cardGlowOpacity}%</span>
                                                        </div>
                                                        <input
                                                            type="range"
                                                            min="10"
                                                            max="100"
                                                            value={cardGlowOpacity}
                                                            onChange={(e) => updateCardGlowOpacity(parseInt(e.target.value))}
                                                            className="w-full accent-[#2d5016] dark:accent-emerald-500 cursor-pointer"
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </m.div>
                        </div>
                    )}
                </AnimatePresence>
            </Portal>

            {/* Custom Greeting & Motto Edit Modal */}
            <Portal>
                <AnimatePresence>
                    {showGreetingModal && (
                        <div 
                            className="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                            onClick={() => setShowGreetingModal(false)}
                        >
                            <m.div
                                initial={{ opacity: 0, scale: 0.92, y: 15 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                transition={{ type: "spring", damping: 25, stiffness: 350 }}
                                className="w-full max-w-md bg-[#faf7f0] dark:bg-[#181c15] border-2 border-[#8b6f47]/30 dark:border-white/15 rounded-3xl p-6 shadow-2xl space-y-5 text-left"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="flex items-center justify-between pb-3 border-b border-[#8b6f47]/20 dark:border-white/10">
                                    <div className="flex items-center gap-2.5">
                                        <div className="p-2 rounded-2xl bg-[#2d5016]/15 text-[#2d5016] dark:bg-emerald-500/20 dark:text-emerald-300">
                                            <Sparkles size={18} />
                                        </div>
                                        <div>
                                            <h3 className="text-base font-black text-[#2d5016] dark:text-[#e8dfd5] uppercase tracking-wide">Tùy Chỉnh Lời Chào</h3>
                                            <p className="text-[11px] font-bold text-[#8b6f47] dark:text-[#d4a574]">Cá nhân hóa thông điệp mở đầu ngày mới</p>
                                        </div>
                                    </div>
                                    <button 
                                        type="button" 
                                        onClick={() => setShowGreetingModal(false)}
                                        className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
                                    >
                                        <X size={18} />
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-black text-[#2d5016] dark:text-[#e8dfd5] uppercase tracking-wider">
                                            Tiêu Đề Lời Chào (Ví dụ: Chào buổi sáng, Xin chào sếp Nghĩa)
                                        </label>
                                        <input
                                            type="text"
                                            value={tempGreetingTitle}
                                            onChange={(e) => setTempGreetingTitle(e.target.value)}
                                            placeholder={greeting.text}
                                            className="w-full px-4 py-2.5 rounded-2xl border-2 border-[#8b6f47]/30 dark:border-white/15 bg-white/80 dark:bg-black/30 text-foreground font-bold text-sm focus:border-[#2d5016] dark:focus:border-emerald-500 outline-none transition-all"
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-black text-[#2d5016] dark:text-[#e8dfd5] uppercase tracking-wider">
                                            Thông Điệp / Câu Nói Động Lực (Motto)
                                        </label>
                                        <textarea
                                            rows={2}
                                            value={tempGreetingSubtitle}
                                            onChange={(e) => setTempGreetingSubtitle(e.target.value)}
                                            placeholder={greeting.desc}
                                            className="w-full px-4 py-2.5 rounded-2xl border-2 border-[#8b6f47]/30 dark:border-white/15 bg-white/80 dark:bg-black/30 text-foreground font-bold text-sm focus:border-[#2d5016] dark:focus:border-emerald-500 outline-none transition-all resize-none"
                                        />
                                    </div>

                                    {/* Preset Recommendations */}
                                    <div className="space-y-1.5">
                                        <span className="text-[10.5px] font-black text-[#8b6f47] dark:text-[#d4a574] uppercase tracking-wider">Gợi ý mẫu:</span>
                                        <div className="grid grid-cols-2 gap-1.5">
                                            {[
                                                { t: 'Đại Lợi Phát Tài', s: 'Buôn may bán đắt, vạn sự hanh thông!' },
                                                { t: 'Chào mừng trở lại', s: 'Hôm nay sẽ là một ngày bùng nổ doanh số!' },
                                                { t: 'Lyang Farm & Cafe', s: 'Nông sản hữu cơ - Tươi ngon mỗi ngày' },
                                                { t: 'Tươi Vui Mỗi Ngày', s: 'Trao chất lượng, nhận trọn niềm tin' }
                                            ].map(item => (
                                                <button
                                                    key={item.t}
                                                    type="button"
                                                    onClick={() => {
                                                        setTempGreetingTitle(item.t);
                                                        setTempGreetingSubtitle(item.s);
                                                    }}
                                                    className="p-2 rounded-xl text-left bg-[#8b6f47]/5 hover:bg-[#2d5016]/10 dark:bg-white/5 dark:hover:bg-white/10 border border-[#8b6f47]/15 dark:border-white/10 transition-all cursor-pointer"
                                                >
                                                    <div className="text-[11px] font-black text-[#2d5016] dark:text-emerald-300 truncate">{item.t}</div>
                                                    <div className="text-[9.5px] text-muted-foreground truncate">{item.s}</div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between pt-3 border-t border-[#8b6f47]/20 dark:border-white/10">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setCustomGreetingTitle('');
                                            setCustomGreetingSubtitle('');
                                            localStorage.removeItem('dashboard_custom_greeting_title');
                                            localStorage.removeItem('dashboard_custom_greeting_subtitle');
                                            setShowGreetingModal(false);
                                            setToast({ message: 'Đã đặt lại lời chào theo khung giờ mặc định', type: 'info' });
                                        }}
                                        className="px-3.5 py-2 rounded-2xl text-xs font-black text-[#8b6f47] dark:text-[#d4a574] hover:bg-[#8b6f47]/10 transition-all cursor-pointer"
                                    >
                                        Mặc định theo giờ
                                    </button>
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setShowGreetingModal(false)}
                                            className="px-4 py-2 rounded-2xl text-xs font-black text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
                                        >
                                            Hủy
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setCustomGreetingTitle(tempGreetingTitle);
                                                setCustomGreetingSubtitle(tempGreetingSubtitle);
                                                localStorage.setItem('dashboard_custom_greeting_title', tempGreetingTitle);
                                                localStorage.setItem('dashboard_custom_greeting_subtitle', tempGreetingSubtitle);
                                                setShowGreetingModal(false);
                                                setToast({ message: 'Đã lưu lời chào & khẩu hiệu mới!', type: 'success' });
                                            }}
                                            className="px-5 py-2 rounded-2xl text-xs font-black bg-[#2d5016] text-white hover:bg-[#3d6820] shadow-md transition-all cursor-pointer"
                                        >
                                            Lưu thay đổi
                                        </button>
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
