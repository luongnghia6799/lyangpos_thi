import React, { useState, useEffect, useMemo, useRef, useCallback, memo } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { 
    User, Lock, ArrowRight, Sparkles, UserPlus, LogIn, Sprout, Wheat, Leaf,
    Sun, Moon, ShieldCheck, Network, Wifi, WifiOff, X, Check, 
    Laptop, Plus, Eye, EyeOff, Clock, Calendar, Zap, Shield, ChevronRight,
    MonitorPlay, Palette, ChevronDown, CheckCircle2, Flame, KeyRound, 
    Delete, RefreshCw, Store, CheckCheck, Compass, HelpCircle, Layers
} from 'lucide-react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import logo from '../../assets/logo.png';
import { cn } from '../../lib/utils';
import InteractiveMascotAvatar from '../../components/widgets/InteractiveMascotAvatar';

// -------------------------------------------------------------
// THEME CONFIGURATIONS & DESIGN TOKENS
// -------------------------------------------------------------
const THEME_OPTIONS = [
    {
        id: 'zen',
        name: 'Zen Botanical',
        shortName: 'Zen Mộc',
        icon: Leaf,
        badgeText: 'Thanh bình',
        color: '#7D8B6E',
        secondary: '#DE8C5A',
        description: 'Xanh xô thơm mộc mạc, đất nung ấm áp & giấy ngà',
        lightBg: '#FAF7F2',
        darkBg: '#0b0f0c'
    },
    {
        id: 'agri',
        name: 'Nông Nghiệp Xanh',
        shortName: 'Nông Nghiệp',
        icon: Sprout,
        badgeText: 'Tươi mới',
        color: '#2d5016',
        secondary: '#d4a574',
        description: 'Xanh ngọc lúa non & màu lúa chín trĩu hạt',
        lightBg: '#faf8f3',
        darkBg: '#070b14'
    },
    {
        id: 'luxury',
        name: 'Luxury Leather',
        shortName: 'Luxury Gold',
        icon: Sparkles,
        badgeText: 'Sang trọng',
        color: '#8B5A2B',
        secondary: '#d4a574',
        description: 'Nâu espresso hoàng gia, da thuộc & ánh kim đồng',
        lightBg: '#FDFBF7',
        darkBg: '#0d0a08'
    },
    {
        id: 'red-dragon',
        name: 'Hồng Phát Đỏ',
        shortName: 'Hồng Phát',
        icon: Flame,
        badgeText: 'Tài lộc',
        color: '#b91c1c',
        secondary: '#f59e0b',
        description: 'Đỏ son may mắn, vượng tài lộc & buôn may bán đắt',
        lightBg: '#fdf8f6',
        darkBg: '#120707'
    }
];

// 100% GPU-Free Ultra-Clean Luxury Ambient Stage (0% GPU / 0% CPU Idle)
// Uses static multi-stop CSS radial mesh gradients and pre-computed static layers.
// Zero requestAnimationFrame, zero blur filter passes, zero JS animation loops!
const FloatingBackground = memo(({ themeId, isDark }) => {
    const meshStyle = useMemo(() => {
        if (isDark) {
            switch (themeId) {
                case 'zen':
                    return {
                        bg: '#080c09',
                        mesh: 'radial-gradient(at 15% 15%, rgba(125, 139, 110, 0.22) 0px, transparent 55%), radial-gradient(at 85% 85%, rgba(222, 140, 90, 0.18) 0px, transparent 55%), radial-gradient(at 50% 40%, rgba(94, 109, 80, 0.10) 0px, transparent 65%)',
                        dotColor: 'rgba(125, 139, 110, 0.14)',
                        lineGlow: 'rgba(125, 139, 110, 0.28)'
                    };
                case 'luxury':
                    return {
                        bg: '#0c0907',
                        mesh: 'radial-gradient(at 15% 15%, rgba(139, 90, 43, 0.25) 0px, transparent 55%), radial-gradient(at 85% 85%, rgba(212, 165, 116, 0.18) 0px, transparent 55%), radial-gradient(at 50% 40%, rgba(61, 37, 20, 0.16) 0px, transparent 65%)',
                        dotColor: 'rgba(212, 165, 116, 0.14)',
                        lineGlow: 'rgba(212, 165, 116, 0.28)'
                    };
                case 'red-dragon':
                    return {
                        bg: '#0e0505',
                        mesh: 'radial-gradient(at 15% 15%, rgba(185, 28, 28, 0.22) 0px, transparent 55%), radial-gradient(at 85% 85%, rgba(245, 158, 11, 0.18) 0px, transparent 55%), radial-gradient(at 50% 40%, rgba(127, 29, 29, 0.12) 0px, transparent 65%)',
                        dotColor: 'rgba(248, 113, 113, 0.14)',
                        lineGlow: 'rgba(248, 113, 113, 0.28)'
                    };
                case 'agri':
                default:
                    return {
                        bg: '#040805',
                        mesh: 'radial-gradient(at 15% 15%, rgba(5, 150, 105, 0.22) 0px, transparent 55%), radial-gradient(at 85% 85%, rgba(217, 119, 6, 0.16) 0px, transparent 55%), radial-gradient(at 50% 40%, rgba(13, 148, 136, 0.12) 0px, transparent 65%)',
                        dotColor: 'rgba(16, 185, 129, 0.14)',
                        lineGlow: 'rgba(16, 185, 129, 0.28)'
                    };
            }
        } else {
            switch (themeId) {
                case 'zen':
                    return {
                        bg: '#FAF7F2',
                        mesh: 'radial-gradient(at 10% 10%, rgba(125, 139, 110, 0.18) 0px, transparent 50%), radial-gradient(at 90% 90%, rgba(222, 140, 90, 0.16) 0px, transparent 50%), radial-gradient(at 50% 30%, rgba(244, 239, 230, 0.8) 0px, transparent 60%)',
                        dotColor: 'rgba(125, 139, 110, 0.12)',
                        lineGlow: 'rgba(125, 139, 110, 0.25)'
                    };
                case 'luxury':
                    return {
                        bg: '#FDFBF7',
                        mesh: 'radial-gradient(at 10% 10%, rgba(139, 90, 43, 0.16) 0px, transparent 50%), radial-gradient(at 90% 90%, rgba(212, 165, 116, 0.20) 0px, transparent 50%), radial-gradient(at 50% 30%, rgba(253, 251, 247, 0.8) 0px, transparent 60%)',
                        dotColor: 'rgba(139, 90, 43, 0.12)',
                        lineGlow: 'rgba(212, 165, 116, 0.25)'
                    };
                case 'red-dragon':
                    return {
                        bg: '#fdf8f6',
                        mesh: 'radial-gradient(at 10% 10%, rgba(220, 38, 38, 0.14) 0px, transparent 50%), radial-gradient(at 90% 90%, rgba(245, 158, 11, 0.16) 0px, transparent 50%), radial-gradient(at 50% 30%, rgba(253, 248, 246, 0.8) 0px, transparent 60%)',
                        dotColor: 'rgba(185, 28, 28, 0.12)',
                        lineGlow: 'rgba(220, 38, 38, 0.25)'
                    };
                case 'agri':
                default:
                    return {
                        bg: '#faf8f3',
                        mesh: 'radial-gradient(at 10% 10%, rgba(45, 80, 22, 0.15) 0px, transparent 50%), radial-gradient(at 90% 90%, rgba(212, 165, 116, 0.20) 0px, transparent 50%), radial-gradient(at 50% 30%, rgba(74, 124, 89, 0.10) 0px, transparent 60%)',
                        dotColor: 'rgba(45, 80, 22, 0.12)',
                        lineGlow: 'rgba(45, 80, 22, 0.25)'
                    };
            }
        }
    }, [themeId, isDark]);

    return (
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0 select-none">
            {/* 1. Base Solid Color Canvas */}
            <div 
                className="absolute inset-0 transition-colors duration-700"
                style={{ backgroundColor: meshStyle.bg }}
            />

            {/* 2. Static Multi-Stop Radial Mesh (0% GPU / 0% CPU, painted once, cached by browser) */}
            <div 
                className="absolute inset-0 transition-all duration-700 pointer-events-none"
                style={{ backgroundImage: meshStyle.mesh }}
            />

            {/* 3. Static Fine Dot Pattern with Smooth Center Vignette */}
            <div 
                className="absolute inset-0 pointer-events-none opacity-60"
                style={{
                    backgroundImage: `radial-gradient(${meshStyle.dotColor} 1.2px, transparent 1.2px)`,
                    backgroundSize: '24px 24px',
                    maskImage: 'radial-gradient(ellipse at center, black 35%, transparent 80%)',
                    WebkitMaskImage: 'radial-gradient(ellipse at center, black 35%, transparent 80%)'
                }}
            />

            {/* 4. Static Top Accent Beam Line */}
            <div 
                className="absolute -top-px left-1/2 -translate-x-1/2 w-2/3 max-w-3xl h-px pointer-events-none"
                style={{
                    background: `linear-gradient(90deg, transparent 0%, ${meshStyle.lineGlow} 50%, transparent 100%)`
                }}
            />
        </div>
    );
});

// Isolated Live Clock (Ensures 0% CPU re-renders for the rest of Welcome page)
const LiveClock = memo(() => {
    const [currentTime, setCurrentTime] = useState(() => new Date());

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    return (
        <span className="text-xs font-mono font-bold tracking-wider opacity-75">
            {currentTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </span>
    );
});

// Bouncy Micro-Spring Character Typing Input Field with larger typography & focus halo
const AnimatedTypingField = memo(({
    value = '',
    onChange,
    type = 'text',
    placeholder = '',
    isDark = false,
    activeStyles,
    rightElement = null,
    autoFocus = false,
    required = false,
    className = '',
    inputClassName = ''
}) => {
    const inputRef = useRef(null);
    const containerRef = useRef(null);
    const [isFocused, setIsFocused] = useState(false);

    const syncScroll = () => {
        if (containerRef.current && inputRef.current) {
            containerRef.current.scrollLeft = inputRef.current.scrollLeft;
        }
    };

    const isPassword = type === 'password';
    const chars = value ? String(value).split('') : [];

    return (
        <div className={cn("relative group w-full", className)}>
            {/* Ambient Focus Glow Halo */}
            <div 
                className={cn(
                    "absolute -inset-0.5 rounded-2xl blur-md transition-opacity duration-300 pointer-events-none",
                    isFocused ? "opacity-40" : "opacity-0"
                )}
                style={{ background: activeStyles?.primaryColor || '#10b981' }}
            />

            <div className="relative flex items-center w-full">
                {/* Visual Animated Bouncy Typing Layer */}
                <div
                    ref={containerRef}
                    className={cn(
                        "absolute inset-y-0 left-0 flex items-center pointer-events-none select-none overflow-hidden whitespace-pre pl-5 font-black text-lg sm:text-xl tracking-tight leading-none",
                        rightElement ? "pr-14" : "pr-5",
                        isDark ? "text-slate-100" : "text-slate-900"
                    )}
                    style={{ scrollbarWidth: 'none' }}
                >
                    <AnimatePresence initial={false}>
                        {chars.map((char, index) => (
                            <m.span
                                key={`char-${index}-${char}`}
                                initial={{ opacity: 0, y: 5, scale: 0.6 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                transition={{ duration: 0.14, ease: [0.175, 0.885, 0.32, 1.275] }}
                                className="inline-block shrink-0"
                            >
                                {isPassword ? '●' : (char === ' ' ? '\u00A0' : char)}
                            </m.span>
                        ))}
                    </AnimatePresence>
                </div>

                {/* Underlying Native Input */}
                <input
                    ref={inputRef}
                    type={type}
                    value={value}
                    onChange={(e) => {
                        onChange(e);
                        syncScroll();
                    }}
                    onScroll={syncScroll}
                    onKeyUp={syncScroll}
                    onKeyDown={syncScroll}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    placeholder={placeholder}
                    autoFocus={autoFocus}
                    required={required}
                    className={cn(
                        "w-full h-14 pl-5 rounded-2xl border-2 font-black text-lg sm:text-xl outline-none transition-all duration-200 tracking-tight",
                        value ? "text-transparent" : (isDark ? "placeholder:text-slate-500" : "placeholder:text-slate-400"),
                        isDark 
                            ? "bg-slate-950/60 hover:bg-slate-950/80 border-slate-800/80" 
                            : "bg-white/70 hover:bg-white/90 border-slate-200/80",
                        rightElement ? "pr-14" : "pr-5",
                        inputClassName
                    )}
                    style={{
                        caretColor: isDark ? '#fff' : (activeStyles?.primaryColor || '#10b981'),
                        borderColor: isFocused ? (activeStyles?.primaryColor || '#10b981') : undefined
                    }}
                />

                {rightElement && (
                    <div className="absolute right-0 pr-4 flex items-center z-30">
                        {rightElement}
                    </div>
                )}
            </div>
        </div>
    );
});

// Preset avatar illustrations
const USER_AVATAR_PRESETS = [
    '/mascots/avatar-lyang.webp',
    '/mascots/avatar-fox.webp',
    '/mascots/avatar-fox-ink.webp',
    '/mascots/avatar-fox-paper.webp',
    '/mascots/avatar-fox-pixel.webp',
    '/mascots/avatar-fox-riso.webp',
    '/mascots/avatar-fox-sketch.webp',
    '/mascots/avatar-wizard.webp',
    '/mascots/avatar-panda.webp',
    '/mascots/avatar-knight.webp',
    '/mascots/avatar-kamran.webp'
];

const sanitizeAvatarUrl = (url) => {
    if (!url || typeof url !== 'string' || url === 'undefined' || url === 'null') return '';
    const trimmed = url.trim();
    if (
        trimmed.includes('user_mascot') || 
        trimmed.includes('farmer_boy') || 
        trimmed.includes('plant_doctor') || 
        trimmed.includes('doraemon')
    ) {
        return USER_AVATAR_PRESETS[0];
    }
    return trimmed;
};

const getUserAvatar = (user, index = 0) => {
    if (!user) return USER_AVATAR_PRESETS[0];
    if (user.avatar) {
        const clean = sanitizeAvatarUrl(user.avatar);
        if (clean) return clean;
    }
    const custom = localStorage.getItem(`user_avatar_${user.username}`) || localStorage.getItem(`user_avatar_${user.id}`);
    if (custom) {
        const clean = sanitizeAvatarUrl(custom);
        if (clean) return clean;
    }
    
    // Hash username for consistent avatar assignment
    const key = user.username || String(user.id || index);
    let hash = 0;
    for (let i = 0; i < key.length; i++) {
        hash = (hash << 5) - hash + key.charCodeAt(i);
        hash |= 0;
    }
    const idx = Math.abs(hash) % USER_AVATAR_PRESETS.length;
    return USER_AVATAR_PRESETS[idx];
};

export default function Welcome() {
    const [isLogin, setIsLogin] = useState(true);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        username: localStorage.getItem('saved_username') || '',
        password: localStorage.getItem('saved_password') || '',
        display_name: '',
        admin_secret: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [isSecretAdminMode, setIsSecretAdminMode] = useState(false);
    const [rememberMe, setRememberMe] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    
    // NEW MODERN INTERACTION MODES:
    // 'accounts' (chọn tài khoản nhanh dạng danh thiếp sang trọng)
    // 'pinpad' (nhập PIN/mật khẩu nhanh cho user đã chọn kèm Touch Numpad)
    // 'form' (form đăng nhập / đăng ký tài khoản đầy đủ)
    const [activeTab, setActiveTab] = useState('accounts'); 
    const [selectedUser, setSelectedUser] = useState(null);
    const [quickPinInput, setQuickPinInput] = useState('');
    const [showNumpad, setShowNumpad] = useState(false);
    const [selectedUserLoading, setSelectedUserLoading] = useState(null);
    const [shopInfo, setShopInfo] = useState({ shop_name: 'Lyang Nghĩa' });

    // ---------------------------------------------------------
    // LYANG MASCOT STATE (Dynamic Sync with configured mascot)
    // ---------------------------------------------------------
    const [mascotAvatar, setMascotAvatar] = useState(() => {
        try {
            const saved = localStorage.getItem('lyang_mascot_config');
            if (saved) {
                const parsed = JSON.parse(saved);
                if (parsed.characterId) {
                    return `/mascots/avatar-${parsed.characterId}.webp`;
                }
            }
        } catch (e) {}
        return '/mascots/avatar-lyang.webp';
    });

    useEffect(() => {
        const handleMascotSync = () => {
            try {
                const saved = localStorage.getItem('lyang_mascot_config');
                if (saved) {
                    const parsed = JSON.parse(saved);
                    if (parsed.characterId) {
                        setMascotAvatar(`/mascots/avatar-${parsed.characterId}.webp`);
                        return;
                    }
                }
            } catch (e) {}
            setMascotAvatar('/mascots/avatar-lyang.webp');
        };

        window.addEventListener('lyang_mascot_config_updated', handleMascotSync);
        window.addEventListener('storage', handleMascotSync);
        return () => {
            window.removeEventListener('lyang_mascot_config_updated', handleMascotSync);
            window.removeEventListener('storage', handleMascotSync);
        };
    }, []);

    // ---------------------------------------------------------
    // THEME STATE & DYNAMIC ADAPTATION
    // ---------------------------------------------------------
    const [currentTheme, setCurrentTheme] = useState(() => {
        return localStorage.getItem('app_theme') || 'agri';
    });

    const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'));
    const [showThemePicker, setShowThemePicker] = useState(false);

    // Apply theme settings globally
    const applyTheme = useCallback(async (themeId) => {
        setCurrentTheme(themeId);
        
        if (themeId === 'zen') {
            localStorage.setItem('ui_theme_zen_botanical', 'true');
            localStorage.setItem('app_theme', 'agri');
            document.documentElement.setAttribute('data-theme', 'agri');
        } else {
            localStorage.setItem('ui_theme_zen_botanical', 'false');
            localStorage.setItem('app_theme', themeId);
            document.documentElement.setAttribute('data-theme', themeId);
        }

        window.dispatchEvent(new Event('theme_changed'));
        window.dispatchEvent(new Event('zen_theme_changed'));
        window.dispatchEvent(new Event('storage'));

        try {
            const syncChan = new BroadcastChannel('pos_data_sync');
            syncChan.postMessage({ 
                type: 'UI_SETTING_UPDATED', 
                key: 'app_theme', 
                value: themeId === 'zen' ? 'agri' : themeId 
            });
            syncChan.postMessage({ 
                type: 'UI_SETTING_UPDATED', 
                key: 'ui_theme_zen_botanical', 
                value: themeId === 'zen' ? 'true' : 'false' 
            });
            syncChan.close();
        } catch (e) {}

        try {
            await axios.post('/api/settings', {
                ui_theme_zen_botanical: themeId === 'zen' ? 'true' : 'false'
            });
        } catch (err) {}
    }, []);

    const toggleDarkMode = () => {
        const root = document.documentElement;
        const newMode = !root.classList.contains('dark');
        if (newMode) {
            root.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            root.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
        setIsDark(newMode);
        window.dispatchEvent(new Event('theme_changed'));
    };

    const themeConfig = useMemo(() => {
        return THEME_OPTIONS.find(t => t.id === currentTheme) || THEME_OPTIONS[0];
    }, [currentTheme]);

    const activeStyles = useMemo(() => {
        switch (currentTheme) {
            case 'zen':
                return {
                    primaryColor: '#7D8B6E',
                    secondaryColor: '#DE8C5A',
                    bgColor: isDark ? '#0b0f0c' : '#FAF7F2',
                    textColor: isDark ? '#FAF7F2' : '#2D382E',
                    textMuted: isDark ? '#A3B394' : '#68775B',
                    borderClass: isDark ? 'border-[#7D8B6E]/30' : 'border-[#7D8B6E]/30',
                    hoverBorderClass: 'hover:border-[#7D8B6E]',
                    buttonGradient: 'bg-gradient-to-r from-[#7D8B6E] via-[#6F7D60] to-[#DE8C5A]',
                    brandGradient: isDark 
                        ? 'from-[#A3B394] via-[#F4EFE6] to-[#DE8C5A]' 
                        : 'from-[#5E6D50] via-[#7D8B6E] to-[#C97746]',
                    cardBg: isDark ? 'bg-[#121814]/90' : 'bg-white/85',
                    heroCardBg: isDark ? 'bg-[#131b15]/75 border-[#7D8B6E]/20' : 'bg-white/70 border-[#7D8B6E]/25',
                    pillActive: 'bg-[#7D8B6E] text-white border-[#7D8B6E]',
                    accentHighlight: '#DE8C5A'
                };
            case 'luxury':
                return {
                    primaryColor: '#8B5A2B',
                    secondaryColor: '#d4a574',
                    bgColor: isDark ? '#0d0a08' : '#FDFBF7',
                    textColor: isDark ? '#FDFBF7' : '#3E2723',
                    textMuted: isDark ? '#d4a574' : '#8D6E63',
                    borderClass: isDark ? 'border-[#d4a574]/25' : 'border-[#8B5A2B]/20',
                    hoverBorderClass: 'hover:border-[#d4a574]',
                    buttonGradient: 'bg-gradient-to-r from-[#8B5A2B] via-[#9E6938] to-[#d4a574]',
                    brandGradient: isDark 
                        ? 'from-[#d4a574] via-[#FDFBF7] to-[#d4a574]' 
                        : 'from-[#3E2723] via-[#8B5A2B] to-[#b3824b]',
                    cardBg: isDark ? 'bg-[#181410]/90' : 'bg-white/85',
                    heroCardBg: isDark ? 'bg-[#1a1410]/75 border-[#d4a574]/20' : 'bg-white/70 border-[#8B5A2B]/20',
                    pillActive: 'bg-[#8B5A2B] text-white border-[#8B5A2B]',
                    accentHighlight: '#d4a574'
                };
            case 'red-dragon':
                return {
                    primaryColor: '#b91c1c',
                    secondaryColor: '#f59e0b',
                    bgColor: isDark ? '#120707' : '#fdf8f6',
                    textColor: isDark ? '#fef2f2' : '#1f2937',
                    textMuted: isDark ? '#fca5a5' : '#991b1b',
                    borderClass: isDark ? 'border-rose-500/25' : 'border-rose-500/20',
                    hoverBorderClass: 'hover:border-rose-500',
                    buttonGradient: 'bg-gradient-to-r from-[#b91c1c] via-[#dc2626] to-[#f59e0b]',
                    brandGradient: isDark 
                        ? 'from-[#f87171] via-[#fef2f2] to-[#f59e0b]' 
                        : 'from-[#991b1b] via-[#dc2626] to-[#d97706]',
                    cardBg: isDark ? 'bg-[#1c0e0e]/90' : 'bg-white/85',
                    heroCardBg: isDark ? 'bg-[#1f0d0d]/75 border-rose-500/20' : 'bg-white/70 border-rose-500/20',
                    pillActive: 'bg-[#b91c1c] text-white border-[#b91c1c]',
                    accentHighlight: '#f59e0b'
                };
            case 'agri':
            default:
                return {
                    primaryColor: '#2d5016',
                    secondaryColor: '#d4a574',
                    bgColor: isDark ? '#070b14' : '#faf8f3',
                    textColor: isDark ? '#f8fafc' : '#2d5016',
                    textMuted: isDark ? '#4ade80' : '#8b6f47',
                    borderClass: isDark ? 'border-emerald-500/25' : 'border-[#d4a574]/30',
                    hoverBorderClass: 'hover:border-emerald-500',
                    buttonGradient: 'bg-gradient-to-r from-[#2d5016] via-[#3a651d] to-[#4a7c59] dark:from-emerald-700 dark:via-emerald-600 dark:to-teal-600',
                    brandGradient: isDark 
                        ? 'from-emerald-300 via-teal-200 to-emerald-400' 
                        : 'from-[#2d5016] via-[#3e6b20] to-[#2d5016]',
                    cardBg: isDark ? 'bg-slate-900/90' : 'bg-white/85',
                    heroCardBg: isDark ? 'bg-slate-900/75 border-emerald-500/20' : 'bg-white/70 border-[#2d5016]/20',
                    pillActive: 'bg-[#2d5016] text-white border-[#2d5016]',
                    accentHighlight: '#d4a574'
                };
        }
    }, [currentTheme, isDark]);



    // ---------------------------------------------------------
    // VN GREETING (Updated once per minute, 0% CPU)
    // ---------------------------------------------------------
    const [greetingHour, setGreetingHour] = useState(() => new Date().getHours());

    useEffect(() => {
        const timer = setInterval(() => setGreetingHour(new Date().getHours()), 60000);
        return () => clearInterval(timer);
    }, []);

    const timeGreeting = useMemo(() => {
        const hr = greetingHour;
        if (hr >= 5 && hr < 11) {
            return {
                title: "Chào buổi sáng rạng rỡ",
                sub: "Khởi đầu ca làm việc tràn đầy năng lượng & đắc tài đắc lộc!",
                icon: Sun
            };
        } else if (hr >= 11 && hr < 14) {
            return {
                title: "Chào buổi trưa hanh thông",
                sub: "Đơn hàng tấp nập, quản lý kho bãi chính xác & nhẹ nhàng!",
                icon: Sparkles
            };
        } else if (hr >= 14 && hr < 18) {
            return {
                title: "Chào buổi chiều bội thu",
                sub: "Đẩy nhanh tiến độ xuất nhập hàng, kiểm soát doanh số vững vàng!",
                icon: Wheat
            };
        } else {
            return {
                title: "Chào buổi tối ấm áp",
                sub: "Tổng kết số liệu chính xác, an tâm chốt ca và nâng cao doanh thu!",
                icon: Moon
            };
        }
    }, [greetingHour]);

    // ---------------------------------------------------------
    // FETCH INITIAL DATA
    // ---------------------------------------------------------
    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const sRes = await axios.get('/api/settings');
                if (sRes.data?.shop_name) {
                    setShopInfo({ shop_name: sRes.data.shop_name });
                    localStorage.setItem('lyang_store_name', sRes.data.shop_name);
                }
            } catch (sErr) {}

            try {
                const res = await axios.get('/api/users');
                if (Array.isArray(res.data)) {
                    setUsers(res.data);
                    if (res.data.length === 0) {
                        setActiveTab('form');
                        setIsLogin(false);
                        return;
                    }

                    // Check if auto-login is active
                    const isAutoDashboard = localStorage.getItem('pos_default_landing_page') === 'dashboard';
                    const savedUser = localStorage.getItem('saved_username');
                    if (isAutoDashboard && savedUser) {
                        const targetUser = res.data.find(u => u.username === savedUser) || res.data[0];
                        const savedPwd = localStorage.getItem(`saved_pwd_${targetUser.username}`) || localStorage.getItem('saved_password') || '0607@Nghia';
                        
                        if (targetUser && savedPwd) {
                            try {
                                setLoading(true);
                                setSelectedUserLoading(targetUser.username);
                                const loginRes = await axios.post('/api/login', {
                                    username: targetUser.username,
                                    password: savedPwd
                                });
                                sessionStorage.setItem('user', JSON.stringify(loginRes.data.user));
                                navigate('/');
                                return;
                            } catch (autoErr) {
                                console.warn("Auto-login failed:", autoErr);
                            } finally {
                                setLoading(false);
                                setSelectedUserLoading(null);
                            }
                        }
                    }
                }
            } catch (err) {
                console.warn("Failed to fetch users", err);
                setActiveTab('form');
            }
        };
        fetchInitialData();
    }, [navigate]);

    // Fast Card Selection & Auto-login if password saved
    const handleSelectUser = async (user) => {
        setSelectedUser(user);
        setError('');

        const savedPassword = localStorage.getItem(`saved_pwd_${user.username}`) || (localStorage.getItem('saved_username') === user.username ? localStorage.getItem('saved_password') : '');
        
        if (savedPassword) {
            setLoading(true);
            setSelectedUserLoading(user.username);
            try {
                const res = await axios.post('/api/login', {
                    username: user.username,
                    password: savedPassword
                });
                sessionStorage.setItem('user', JSON.stringify(res.data.user));
                localStorage.setItem('saved_username', user.username);
                localStorage.setItem('saved_password', savedPassword);
                localStorage.setItem(`saved_pwd_${user.username}`, savedPassword);
                navigate('/');
            } catch (err) {
                console.warn("Auto login with saved password failed:", err);
                // Switch to PIN pad to enter password
                setActiveTab('pinpad');
                setQuickPinInput('');
                setTimeout(() => {
                    document.getElementById('quick-pin-input')?.focus();
                }, 100);
            } finally {
                setLoading(false);
                setSelectedUserLoading(null);
            }
        } else {
            // Need password -> Switch to quick PIN Pad
            setActiveTab('pinpad');
            setQuickPinInput('');
            setTimeout(() => {
                document.getElementById('quick-pin-input')?.focus();
            }, 100);
        }
    };

    // Quick PIN Pad Submit
    const handleQuickPinSubmit = async (e) => {
        if (e) e.preventDefault();
        if (!selectedUser || !quickPinInput || loading) return;

        setLoading(true);
        setError('');

        try {
            const res = await axios.post('/api/login', {
                username: selectedUser.username,
                password: quickPinInput
            });
            sessionStorage.setItem('user', JSON.stringify(res.data.user));
            
            localStorage.setItem('saved_username', selectedUser.username);
            localStorage.setItem('saved_password', quickPinInput);
            localStorage.setItem(`saved_pwd_${selectedUser.username}`, quickPinInput);
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.error || 'Mật khẩu / mã PIN không chính xác');
        } finally {
            setLoading(false);
        }
    };

    // Standard Form Submit (Login / Register)
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
                sessionStorage.setItem('user', JSON.stringify(res.data.user));

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

    // Numpad button click handler
    const handleNumpadPress = (digit) => {
        if (digit === 'backspace') {
            setQuickPinInput(prev => prev.slice(0, -1));
        } else if (digit === 'clear') {
            setQuickPinInput('');
        } else {
            setQuickPinInput(prev => prev + digit);
        }
    };

    // LAN Configuration modal
    const [showLanModal, setShowLanModal] = useState(false);
    const [lanIp, setLanIp] = useState(localStorage.getItem('server_ip') || '');
    const [testingConnection, setTestingConnection] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState(null);
    const [pingError, setPingError] = useState('');
    const [isClientMode, setIsClientMode] = useState(!!localStorage.getItem('server_ip'));

    const sanitizeIp = (input) => {
        let cleaned = input.trim();
        cleaned = cleaned.replace(/^(https?:\/\/)/i, '');
        cleaned = cleaned.replace(/\/+$/, '');
        return cleaned;
    };

    const resolveApiUrl = (val) => {
        if (!val) return '';
        let clean = val.trim();
        const defaultPort = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_BACKEND_PORT) || '3579';
        if (/^https?:\/\//i.test(clean)) return clean;
        if (clean.toLowerCase() === 'localhost') return `http://localhost:${defaultPort}`;
        const hasLetters = /[a-zA-Z]/.test(clean) && !clean.includes(':');
        if (hasLetters) return `https://${clean}`;
        if (clean.includes(':')) return `http://${clean}`;
        return `http://${clean}:${defaultPort}`;
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
            const timeoutId = setTimeout(() => controller.abort(), 3500);
            
            let fetchFn = window.fetch;
            if (window.__TAURI_INTERNALS__) {
                try {
                    const { fetch: tauriFetch } = await import('@tauri-apps/plugin-http');
                    fetchFn = tauriFetch;
                } catch (e) {
                    console.warn('Tauri fetch load failed', e);
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
            const targetUrl = resolveApiUrl(cleanedIp);
            let errorMsg = '';
            if (window.location.protocol === 'https:') {
                errorMsg = `Safari trên iOS chặn kết nối HTTP nội bộ khi truy cập qua HTTPS. Vui lòng mở: ${targetUrl}`;
            } else if (err && err.name === 'AbortError') {
                errorMsg = 'Hết thời gian chờ kết nối (Timeout 3.5s). Vui lòng kiểm tra IP và WiFi.';
            } else if (err && (err.name === 'TypeError' || String(err).includes('Fetch') || String(err).includes('Load failed'))) {
                errorMsg = `Không thể kết nối tới ${targetUrl}. Hãy cùng mạng LAN.`;
            } else {
                errorMsg = typeof err === 'string' ? err : (err?.message || String(err));
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
        window.location.reload();
    };

    const serverIp = localStorage.getItem('server_ip');
    const GreetingIcon = timeGreeting.icon;

    return (
        <div 
            className="h-[100dvh] w-full flex flex-col justify-between items-center relative overflow-hidden select-none transition-colors duration-700"
            style={{
                backgroundColor: activeStyles.bgColor,
                color: activeStyles.textColor
            }}
        >
            {/* Dynamic Animated Atmospheric Background Tailored to Active Theme */}
            <FloatingBackground themeId={currentTheme} isDark={isDark} />

            {/* TOP BAR: Cohesive Unified Luxury Dynamic Island Stage */}
            <header className="w-full shrink-0 z-40 px-4 sm:px-8 py-3.5 flex items-center justify-between gap-3 max-w-7xl mx-auto">
                {/* Left: Store Identity Transparent Glass Capsule */}
                <div className={cn(
                    "h-11 sm:h-12 flex items-center gap-2.5 px-3 rounded-full border backdrop-blur-xl shadow-xs transition-all group",
                    activeStyles.borderClass,
                    isDark ? "bg-black/25 hover:bg-black/35" : "bg-black/[0.03] hover:bg-black/[0.05]"
                )}>
                    {/* Mascot Avatar with theme aura ring */}
                    <div className="relative shrink-0 flex items-center justify-center">
                        <div 
                            className="w-8 h-8 rounded-full p-[2px] shadow-xs transition-transform duration-300 group-hover:scale-105 flex items-center justify-center"
                            style={{
                                background: `linear-gradient(135deg, ${activeStyles.primaryColor} 0%, ${activeStyles.secondaryColor} 100%)`
                            }}
                        >
                            <div className="w-full h-full rounded-full overflow-hidden bg-white/90 dark:bg-slate-900 flex items-center justify-center">
                                <InteractiveMascotAvatar size="w-full h-full" shape="circle" scale={1.25} />
                            </div>
                        </div>
                    </div>

                    {/* Store Name */}
                    <span className="text-xs sm:text-sm font-black tracking-tight text-slate-800 dark:text-slate-100">
                        {shopInfo.shop_name || "LyangPOS"}
                    </span>

                    {/* Gradient Divider */}
                    <div className="hidden md:block h-4 w-px bg-gradient-to-b from-transparent via-black/15 dark:via-white/20 to-transparent mx-0.5 my-auto" />

                    {/* Live Ecosystem Indicator */}
                    <div className="hidden md:flex items-center gap-1.5 pr-1 text-slate-600 dark:text-slate-300">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500 shadow-xs" />
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-wider opacity-70">Hệ Sinh Thái Bán Hàng</span>
                    </div>
                </div>

                {/* Right: Unified Segmented Action Island (Transparent Glass & Icon-Only) */}
                <div className={cn(
                    "h-11 sm:h-12 flex items-center gap-0.5 px-1.5 rounded-full border backdrop-blur-xl shadow-xs transition-all relative",
                    activeStyles.borderClass,
                    isDark ? "bg-black/25 hover:bg-black/35" : "bg-black/[0.03] hover:bg-black/[0.05]"
                )}>
                    {/* 1. Theme Switcher (Icon Only) */}
                    <div className="relative">
                        <button
                            type="button"
                            onClick={() => setShowThemePicker(!showThemePicker)}
                            className={cn(
                                "w-9 h-9 rounded-full flex items-center justify-center cursor-pointer transition-all duration-200 group relative",
                                showThemePicker 
                                    ? "bg-black/10 dark:bg-white/15 scale-95" 
                                    : "hover:bg-black/5 dark:hover:bg-white/10 active:scale-90"
                            )}
                            title={`Chủ đề hiện tại: ${themeConfig.name} (Bấm để đổi giao diện)`}
                        >
                            <span className="relative flex h-3 w-3 items-center justify-center">
                                <span 
                                    className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60"
                                    style={{ backgroundColor: themeConfig.color }}
                                />
                                <span 
                                    className="relative inline-flex rounded-full h-3 w-3 shadow-xs ring-1 ring-white/60 dark:ring-black/40"
                                    style={{ backgroundColor: themeConfig.color }}
                                />
                            </span>
                        </button>

                        <AnimatePresence>
                            {showThemePicker && (
                                <>
                                    <div className="fixed inset-0 z-40" onClick={() => setShowThemePicker(false)} />
                                    <m.div
                                        initial={{ opacity: 0, y: 8, scale: 0.96 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 8, scale: 0.96 }}
                                        className={cn(
                                            "absolute right-0 mt-3 w-64 p-2 rounded-3xl border backdrop-blur-2xl shadow-2xl z-50 overflow-hidden",
                                            activeStyles.borderClass,
                                            isDark ? "bg-slate-900/95" : "bg-white/95"
                                        )}
                                    >
                                        <div className="px-3 py-2 border-b border-black/5 dark:border-white/10 mb-1 flex items-center justify-between">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Chọn Giao Diện (Theme)</span>
                                            <Palette size={12} className="text-slate-400" />
                                        </div>
                                        <div className="space-y-1">
                                            {THEME_OPTIONS.map((opt) => {
                                                const IconComp = opt.icon;
                                                const isSelected = currentTheme === opt.id;
                                                return (
                                                    <button
                                                        key={opt.id}
                                                        type="button"
                                                        onClick={() => {
                                                            applyTheme(opt.id);
                                                            setShowThemePicker(false);
                                                        }}
                                                        className={cn(
                                                            "w-full text-left p-2.5 rounded-2xl flex items-center gap-3 transition-all cursor-pointer group",
                                                            isSelected 
                                                                ? (isDark ? "bg-white/10 text-white font-bold" : "bg-black/5 font-bold")
                                                                : (isDark ? "hover:bg-slate-800 text-slate-300" : "hover:bg-black/[0.03] text-slate-700")
                                                        )}
                                                    >
                                                        <div 
                                                            className="w-7 h-7 rounded-xl flex items-center justify-center text-white shrink-0 shadow-xs"
                                                            style={{ backgroundColor: opt.color }}
                                                        >
                                                            <IconComp size={15} />
                                                        </div>
                                                        <div className="min-w-0 flex-1">
                                                            <div className="flex items-center gap-1.5">
                                                                <span className="text-xs font-black truncate">{opt.name}</span>
                                                                <span 
                                                                    className="text-[8px] font-black px-1.5 py-0.2 rounded-full uppercase"
                                                                    style={{ 
                                                                        backgroundColor: `${opt.color}25`, 
                                                                        color: isDark ? '#f8fafc' : opt.color 
                                                                    }}
                                                                >
                                                                    {opt.badgeText}
                                                                </span>
                                                            </div>
                                                            <p className="text-[9px] text-slate-400 dark:text-slate-500 truncate leading-snug">
                                                                {opt.description}
                                                            </p>
                                                        </div>
                                                        {isSelected && <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </m.div>
                                </>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Gradient Divider */}
                    <div className="h-4 w-px bg-gradient-to-b from-transparent via-black/15 dark:via-white/20 to-transparent mx-0.5 my-auto" />

                    {/* 2. Standby Screensaver Button (Icon Only) */}
                    <button
                        type="button"
                        onClick={() => window.dispatchEvent(new CustomEvent('pos_open_screensaver'))}
                        title="Bật Màn hình chờ ngay (Phím tắt: F7)"
                        className="w-9 h-9 rounded-full flex items-center justify-center cursor-pointer hover:bg-black/5 dark:hover:bg-white/10 active:scale-90 transition-all text-slate-700 dark:text-slate-200"
                    >
                        <MonitorPlay size={16} style={{ color: activeStyles.primaryColor }} />
                    </button>

                    {/* Gradient Divider */}
                    <div className="h-4 w-px bg-gradient-to-b from-transparent via-black/15 dark:via-white/20 to-transparent mx-0.5 my-auto" />

                    {/* 3. Dark/Light Mode Button (Icon Only) */}
                    <button
                        type="button"
                        onClick={toggleDarkMode}
                        title={isDark ? "Chuyển giao diện sáng" : "Chuyển giao diện tối"}
                        className="w-9 h-9 rounded-full flex items-center justify-center cursor-pointer hover:bg-black/5 dark:hover:bg-white/10 active:scale-90 transition-all group"
                    >
                        {isDark ? (
                            <Sun size={16} className="text-amber-400 group-hover:rotate-45 transition-transform duration-300" />
                        ) : (
                            <Moon size={16} className="text-slate-600 group-hover:-rotate-12 transition-transform duration-300" />
                        )}
                    </button>

                    {/* Gradient Divider */}
                    <div className="h-4 w-px bg-gradient-to-b from-transparent via-black/15 dark:via-white/20 to-transparent mx-0.5 my-auto" />

                    {/* 4. LAN Configuration Button (Icon Only) */}
                    <button
                        type="button"
                        onClick={() => setShowLanModal(true)}
                        title={serverIp ? `Mạng LAN: ${serverIp}` : "Cấu hình mạng nội bộ / Cục bộ"}
                        className="w-9 h-9 rounded-full flex items-center justify-center cursor-pointer hover:bg-black/5 dark:hover:bg-white/10 active:scale-90 transition-all text-slate-700 dark:text-slate-200 relative"
                    >
                        <span className="relative flex items-center justify-center">
                            <Wifi size={15} className="opacity-80" />
                            <span className={cn(
                                "absolute -top-1 -right-1 w-2 h-2 rounded-full ring-1 ring-white dark:ring-slate-900 shadow-xs",
                                serverIp ? "bg-blue-500" : "bg-emerald-500"
                            )} />
                        </span>
                    </button>
                </div>
            </header>

            {/* MAIN STAGE: Futuristic Split Screen / Two Column Command Hub */}
            <main className="w-full flex-1 min-h-0 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-4 sm:py-6 max-w-7xl mx-auto z-20">
                <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-stretch">
                    
                    {/* LEFT COLUMN: Hero Stage Showcase */}
                    <m.div 
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.7, ease: "easeOut" }}
                        className="lg:col-span-6 flex flex-col justify-center space-y-4"
                    >
                        {/* 1. Brand Showcase Hero Card */}
                        <div className={cn(
                            "p-7 sm:p-9 rounded-[2.5rem] border backdrop-blur-3xl shadow-2xl relative overflow-hidden transition-all flex flex-col justify-between space-y-6",
                            activeStyles.heroCardBg
                        )}>
                            {/* Ambient subtle card glow */}
                            <div 
                                className="absolute -top-24 -left-24 w-64 h-64 rounded-full blur-3xl pointer-events-none opacity-40 transition-colors"
                                style={{ background: activeStyles.primaryColor }}
                            />

                            {/* Top Row: Greeting & Live Clock */}
                            <div className="flex items-center justify-between gap-3 relative z-10">
                                <span 
                                    className="px-3.5 py-1.5 rounded-full text-[11px] font-black uppercase tracking-wider flex items-center gap-2 border shadow-xs"
                                    style={{
                                        backgroundColor: `${activeStyles.primaryColor}15`,
                                        borderColor: `${activeStyles.primaryColor}30`,
                                        color: isDark ? '#fff' : activeStyles.primaryColor
                                    }}
                                >
                                    <GreetingIcon size={14} />
                                    <span>{timeGreeting.title}</span>
                                </span>
                                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/[0.04] dark:bg-white/[0.06] border border-black/5 dark:border-white/10">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    <LiveClock />
                                </div>
                            </div>

                            {/* Mascot & Brand Identity Stage */}
                            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 relative z-10 py-2">
                                <div className="relative group shrink-0">
                                    {/* Glowing pedestal under mascot */}
                                    <div 
                                        className="absolute -inset-2 rounded-3xl blur-xl opacity-50 group-hover:opacity-80 transition-opacity"
                                        style={{ background: `linear-gradient(135deg, ${activeStyles.primaryColor} 0%, ${activeStyles.secondaryColor} 100%)` }}
                                    />
                                    <div 
                                        className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl p-1.5 border-2 backdrop-blur-md shadow-xl shrink-0 flex items-center justify-center overflow-hidden relative z-10 bg-white/10 dark:bg-black/20"
                                        style={{ borderColor: `${activeStyles.primaryColor}40` }}
                                    >
                                        <InteractiveMascotAvatar size="w-full h-full" shape="rounded" scale={1.22} />
                                    </div>
                                </div>

                                <div className="text-center sm:text-left min-w-0 flex-1">
                                    <h1 className="text-3xl sm:text-4xl font-black tracking-tight leading-none">
                                        <span className={cn("bg-gradient-to-r bg-clip-text text-transparent font-black", activeStyles.brandGradient)}>
                                            LyangPOS
                                        </span>
                                    </h1>
                                    <h2 className="text-lg sm:text-xl font-black tracking-tight mt-1 opacity-90 truncate">
                                        {shopInfo.shop_name}
                                    </h2>
                                    <p className="text-xs sm:text-sm font-medium opacity-75 mt-2 leading-relaxed">
                                        {timeGreeting.sub}
                                    </p>
                                </div>
                            </div>

                            {/* Feature Highlights Pills */}
                            <div className="grid grid-cols-3 gap-2.5 pt-2 border-t border-black/5 dark:border-white/10 relative z-10">
                                <div className="p-2.5 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/5 dark:border-white/5 text-center flex flex-col items-center justify-center group hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-all">
                                    <div className="flex items-center justify-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                                        <Zap size={13} className="fill-emerald-500/25 shrink-0 group-hover:scale-110 transition-transform" />
                                        <span className="text-[10px] font-black uppercase tracking-wider">Tức Thì</span>
                                    </div>
                                    <p className="text-[11px] font-bold opacity-75 mt-0.5 truncate">SQLite WAL POS</p>
                                </div>
                                <div className="p-2.5 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/5 dark:border-white/5 text-center flex flex-col items-center justify-center group hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-all">
                                    <div className="flex items-center justify-center gap-1.5 text-blue-600 dark:text-blue-400">
                                        <ShieldCheck size={13} className="fill-blue-500/25 shrink-0 group-hover:scale-110 transition-transform" />
                                        <span className="text-[10px] font-black uppercase tracking-wider">An Toàn</span>
                                    </div>
                                    <p className="text-[11px] font-bold opacity-75 mt-0.5 truncate">Bảo mật nội bộ</p>
                                </div>
                                <div className="p-2.5 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/5 dark:border-white/5 text-center flex flex-col items-center justify-center group hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-all">
                                    <div className="flex items-center justify-center gap-1.5 text-amber-600 dark:text-amber-400">
                                        <Sprout size={13} className="fill-amber-500/25 shrink-0 group-hover:scale-110 transition-transform" />
                                        <span className="text-[10px] font-black uppercase tracking-wider">Nông Nghiệp</span>
                                    </div>
                                    <p className="text-[11px] font-bold opacity-75 mt-0.5 truncate">Tối ưu vật tư</p>
                                </div>
                            </div>
                        </div>

                        {/* Quick Mode Navigation Switcher */}
                        <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-black/[0.04] dark:bg-white/[0.06] border border-black/5 dark:border-white/10">
                            <button
                                type="button"
                                onClick={() => setActiveTab('accounts')}
                                className={cn(
                                    "flex-1 py-3 px-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2",
                                    activeTab === 'accounts' || activeTab === 'pinpad'
                                        ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm"
                                        : "opacity-60 hover:opacity-100"
                                )}
                            >
                                <User size={15} />
                                <span>Chọn ca nhanh ({users.length})</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveTab('form')}
                                className={cn(
                                    "flex-1 py-3 px-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2",
                                    activeTab === 'form'
                                        ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm"
                                        : "opacity-60 hover:opacity-100"
                                )}
                            >
                                <KeyRound size={15} />
                                <span>Đăng nhập khác</span>
                            </button>
                        </div>
                    </m.div>

                    {/* RIGHT COLUMN: Interactive Authentication Hub */}
                    <m.div
                        initial={{ opacity: 0, x: 30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.7, ease: "easeOut", delay: 0.1 }}
                        className="lg:col-span-6 flex flex-col justify-center"
                    >
                        <AnimatePresence mode="wait">
                            {/* 1. ACCOUNTS LIST (Fast Touch Switcher) */}
                            {activeTab === 'accounts' && (
                                <m.div
                                    key="tab-accounts"
                                    initial={{ opacity: 0, scale: 0.96 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.96 }}
                                    transition={{ duration: 0.3 }}
                                    className={cn(
                                        "p-6 sm:p-7 rounded-[2.5rem] border backdrop-blur-3xl shadow-2xl space-y-4 relative overflow-hidden transition-all",
                                        activeStyles.borderClass,
                                        activeStyles.heroCardBg
                                    )}
                                >
                                    {/* Ambient subtle card glow matching theme */}
                                    <div 
                                        className="absolute -top-24 -right-24 w-64 h-64 rounded-full blur-3xl pointer-events-none opacity-40 transition-colors"
                                        style={{ background: activeStyles.secondaryColor }}
                                    />

                                    <div className="flex items-center justify-between relative z-10">
                                        <div>
                                            <h2 className="text-base sm:text-lg font-black uppercase tracking-tight">Chọn tài khoản vào ca</h2>
                                            <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">Chạm thẻ nhân viên để đăng nhập ngay</p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setActiveTab('form')}
                                            className="px-3.5 py-1.5 rounded-xl border text-[11px] font-black uppercase tracking-wider transition-all cursor-pointer shadow-2xs hover:scale-105 active:scale-95"
                                            style={{
                                                borderColor: `${activeStyles.primaryColor}40`,
                                                color: isDark ? '#fff' : activeStyles.primaryColor,
                                                backgroundColor: `${activeStyles.primaryColor}12`
                                            }}
                                        >
                                            + Đăng nhập khác
                                        </button>
                                    </div>

                                    {/* Users Grid */}
                                    <div className="grid grid-cols-2 gap-3 max-h-[380px] overflow-y-auto no-scrollbar p-0.5">
                                        {users.map((u, uIdx) => {
                                            const avatarSrc = getUserAvatar(u, uIdx);
                                            const isCurrentSelected = selectedUserLoading === u.username;

                                            return (
                                                <m.div
                                                    key={u.id || u.username}
                                                    whileHover={{ y: -3, scale: 1.02 }}
                                                    whileTap={{ scale: 0.98 }}
                                                    onClick={() => handleSelectUser(u)}
                                                    className={cn(
                                                        "p-3.5 sm:p-4 rounded-3xl border backdrop-blur-xl flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 relative group overflow-hidden shadow-xs hover:shadow-lg",
                                                        activeStyles.borderClass,
                                                        isDark ? "bg-white/[0.04] hover:bg-white/[0.08]" : "bg-white/60 hover:bg-white/95"
                                                    )}
                                                    style={{
                                                        borderColor: `${activeStyles.primaryColor}30`
                                                    }}
                                                >
                                                    {/* Top accent glow on hover */}
                                                    <div 
                                                        className="absolute top-0 inset-x-0 h-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                                        style={{ background: `linear-gradient(90deg, transparent, ${activeStyles.primaryColor}, transparent)` }}
                                                    />

                                                    {/* Avatar */}
                                                    <div className="relative mb-2">
                                                        <div 
                                                            className="w-14 h-14 sm:w-16 sm:h-16 rounded-full p-1 shadow-sm transition-transform duration-300 group-hover:scale-105"
                                                            style={{
                                                                background: `linear-gradient(135deg, ${activeStyles.primaryColor} 0%, ${activeStyles.secondaryColor} 100%)`
                                                            }}
                                                        >
                                                            <div className="w-full h-full rounded-full overflow-hidden bg-white dark:bg-slate-900 flex items-center justify-center font-black text-xl">
                                                                {isCurrentSelected ? (
                                                                    <div 
                                                                        className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin"
                                                                        style={{ borderColor: activeStyles.primaryColor, borderTopColor: 'transparent' }}
                                                                    />
                                                                ) : avatarSrc ? (
                                                                    <img src={avatarSrc} alt="" className="w-full h-full object-cover" />
                                                                ) : (
                                                                    (u.display_name || u.username || "?").charAt(0).toUpperCase()
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <h3 className="text-xs sm:text-sm font-black truncate max-w-full">
                                                        {u.display_name || u.username}
                                                    </h3>
                                                    <p className="text-[10px] font-bold uppercase tracking-wider opacity-50 mt-0.5 truncate max-w-full">
                                                        @{u.username}
                                                    </p>

                                                    {/* Quick Enter Action Badge - Theme colored */}
                                                    <div 
                                                        className="mt-2.5 w-full py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1 transition-all group-hover:scale-[1.02] shadow-2xs"
                                                        style={{
                                                            backgroundColor: `${activeStyles.primaryColor}18`,
                                                            color: isDark ? '#fff' : activeStyles.primaryColor
                                                        }}
                                                    >
                                                        <span>Vào ca</span>
                                                        <ChevronRight size={11} className="group-hover:translate-x-1 transition-transform" />
                                                    </div>
                                                </m.div>
                                            );
                                        })}
                                    </div>
                                </m.div>
                            )}

                            {/* 2. PIN PAD / QUICK PASSWORD ENTRY (Touch Numpad Compatible) */}
                            {activeTab === 'pinpad' && selectedUser && (
                                <m.div
                                    key="tab-pinpad"
                                    initial={{ opacity: 0, scale: 0.96 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.96 }}
                                    transition={{ duration: 0.3 }}
                                    className={cn(
                                        "p-6 sm:p-7 rounded-[2.5rem] border backdrop-blur-3xl shadow-2xl space-y-4 relative overflow-hidden transition-all",
                                        activeStyles.borderClass,
                                        activeStyles.heroCardBg
                                    )}
                                >
                                    {/* Ambient subtle card glow matching theme */}
                                    <div 
                                        className="absolute -top-24 -right-24 w-64 h-64 rounded-full blur-3xl pointer-events-none opacity-40 transition-colors"
                                        style={{ background: activeStyles.secondaryColor }}
                                    />

                                    {/* Back Button */}
                                    <button
                                        type="button"
                                        onClick={() => { setActiveTab('accounts'); setError(''); }}
                                        className="text-xs font-bold uppercase tracking-wider opacity-70 hover:opacity-100 flex items-center gap-1 cursor-pointer transition-opacity relative z-10"
                                    >
                                        <ArrowRight size={14} className="rotate-180" /> Quay lại chọn tài khoản
                                    </button>

                                    {/* Selected User Badge */}
                                    <div className="flex items-center gap-3 p-3 rounded-2xl bg-black/[0.03] dark:bg-white/[0.04] border border-black/5 dark:border-white/5">
                                        <div className="w-12 h-12 rounded-full overflow-hidden shrink-0 border-2" style={{ borderColor: activeStyles.primaryColor }}>
                                            <img src={getUserAvatar(selectedUser)} alt="" className="w-full h-full object-cover" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <h3 className="text-sm font-black truncate">{selectedUser.display_name || selectedUser.username}</h3>
                                            <p className="text-[10px] font-bold uppercase tracking-wider opacity-60">@{selectedUser.username}</p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setShowNumpad(!showNumpad)}
                                            className={cn(
                                                "p-2 rounded-xl text-xs font-bold flex items-center gap-1 border transition-all cursor-pointer",
                                                showNumpad ? "bg-black/10 dark:bg-white/15" : "bg-transparent opacity-60"
                                            )}
                                        >
                                            <KeyRound size={14} />
                                            <span>{showNumpad ? 'Ẩn phím số' : 'Bàn phím số'}</span>
                                        </button>
                                    </div>

                                    {/* Password Input Form */}
                                    <form onSubmit={handleQuickPinSubmit} className="space-y-3">
                                        <div className="relative">
                                            <input
                                                id="quick-pin-input"
                                                type={showPassword ? "text" : "password"}
                                                value={quickPinInput}
                                                onChange={e => setQuickPinInput(e.target.value)}
                                                placeholder="Nhập mật khẩu hoặc mã PIN..."
                                                className={cn(
                                                    "w-full py-4 pl-4 pr-12 rounded-2xl border-2 font-bold text-center text-lg outline-none tracking-widest transition-all",
                                                    isDark ? "bg-slate-950/60 border-slate-800 focus:border-emerald-500" : "bg-black/[0.03] border-transparent focus:border-black/20 focus:bg-white"
                                                )}
                                                autoFocus
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute inset-y-0 right-0 pr-4 flex items-center opacity-50 hover:opacity-100 cursor-pointer"
                                            >
                                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                            </button>
                                        </div>

                                        {/* Error Alert */}
                                        {error && (
                                            <p className="text-xs text-rose-500 font-bold text-center bg-rose-500/10 p-2 rounded-xl">
                                                {error}
                                            </p>
                                        )}

                                        {/* Touch Numpad */}
                                        {showNumpad && (
                                            <div className="grid grid-cols-3 gap-2 pt-1">
                                                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                                                    <button
                                                        key={num}
                                                        type="button"
                                                        onClick={() => handleNumpadPress(String(num))}
                                                        className="py-3 rounded-2xl text-lg font-black bg-black/[0.04] dark:bg-white/[0.06] hover:bg-black/10 dark:hover:bg-white/15 active:scale-95 transition-all cursor-pointer"
                                                    >
                                                        {num}
                                                    </button>
                                                ))}
                                                <button
                                                    type="button"
                                                    onClick={() => handleNumpadPress('clear')}
                                                    className="py-3 rounded-2xl text-xs font-black uppercase tracking-wider bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 active:scale-95 transition-all cursor-pointer"
                                                >
                                                    Xóa hết
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleNumpadPress('0')}
                                                    className="py-3 rounded-2xl text-lg font-black bg-black/[0.04] dark:bg-white/[0.06] hover:bg-black/10 dark:hover:bg-white/15 active:scale-95 transition-all cursor-pointer"
                                                >
                                                    0
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleNumpadPress('backspace')}
                                                    className="py-3 rounded-2xl text-xs font-black uppercase tracking-wider bg-black/[0.04] dark:bg-white/[0.06] hover:bg-black/10 dark:hover:bg-white/15 active:scale-95 transition-all cursor-pointer flex items-center justify-center"
                                                >
                                                    <Delete size={18} />
                                                </button>
                                            </div>
                                        )}

                                        <button
                                            type="submit"
                                            disabled={loading || !quickPinInput}
                                            className={cn(
                                                "w-full py-4 rounded-2xl text-white font-black uppercase tracking-wider text-sm shadow-xl active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2",
                                                activeStyles.buttonGradient
                                            )}
                                        >
                                            {loading ? (
                                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            ) : (
                                                <>
                                                    <span>Xác nhận vào ca</span>
                                                    <ArrowRight size={16} />
                                                </>
                                            )}
                                        </button>
                                    </form>
                                </m.div>
                            )}

                            {/* 3. DEDICATED LOGIN / REGISTER FORM */}
                            {activeTab === 'form' && (
                                <m.div
                                    key="tab-form"
                                    initial={{ opacity: 0, scale: 0.96 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.96 }}
                                    transition={{ duration: 0.3 }}
                                    className={cn(
                                        "p-6 sm:p-7 rounded-[2.5rem] border backdrop-blur-3xl shadow-2xl space-y-4 relative overflow-hidden transition-all",
                                        activeStyles.borderClass,
                                        activeStyles.heroCardBg
                                    )}
                                >
                                    {/* Ambient subtle card glow matching theme */}
                                    <div 
                                        className="absolute -top-24 -right-24 w-64 h-64 rounded-full blur-3xl pointer-events-none opacity-40 transition-colors"
                                        style={{ background: activeStyles.secondaryColor }}
                                    />
                                    {/* Tabs */}
                                    <div className="flex p-1 rounded-2xl bg-black/[0.04] dark:bg-white/[0.06] border border-black/5 dark:border-white/10">
                                        <button
                                            type="button"
                                            onClick={() => { setIsLogin(true); setError(''); }}
                                            className={cn(
                                                "flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5",
                                                isLogin ? cn("text-white shadow-sm", activeStyles.buttonGradient) : "opacity-60"
                                            )}
                                        >
                                            <LogIn size={14} /> Đăng nhập
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => { setIsLogin(false); setError(''); }}
                                            className={cn(
                                                "flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5",
                                                !isLogin ? cn("text-white shadow-sm", activeStyles.buttonGradient) : "opacity-60"
                                            )}
                                        >
                                            <ShieldCheck size={14} /> {isSecretAdminMode ? 'ĐK Quản Trị' : 'Đăng ký'}
                                        </button>
                                    </div>

                                    <form onSubmit={handleSubmit} className="space-y-4">
                                        {!isLogin && (
                                            <div className="space-y-1.5">
                                                <label className="text-[11px] font-black uppercase tracking-wider opacity-75 ml-2">Họ tên / Tên hiển thị</label>
                                                <AnimatedTypingField
                                                    type="text"
                                                    value={formData.display_name}
                                                    onChange={e => setFormData({ ...formData, display_name: e.target.value })}
                                                    placeholder="Ví dụ: Nguyễn Văn A"
                                                    isDark={isDark}
                                                    activeStyles={activeStyles}
                                                    required={!isLogin}
                                                />
                                            </div>
                                        )}

                                        <div className="space-y-1.5">
                                            <label className="text-[11px] font-black uppercase tracking-wider opacity-75 ml-2">Tên tài khoản (Username)</label>
                                            <AnimatedTypingField
                                                type="text"
                                                value={formData.username}
                                                onChange={e => setFormData({ ...formData, username: e.target.value })}
                                                placeholder="Nhập tên đăng nhập..."
                                                isDark={isDark}
                                                activeStyles={activeStyles}
                                                required
                                                autoFocus
                                            />
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-[11px] font-black uppercase tracking-wider opacity-75 ml-2">Mật khẩu</label>
                                            <AnimatedTypingField
                                                type={showPassword ? "text" : "password"}
                                                value={formData.password}
                                                onChange={e => setFormData({ ...formData, password: e.target.value })}
                                                placeholder="••••••••"
                                                isDark={isDark}
                                                activeStyles={activeStyles}
                                                required
                                                rightElement={
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowPassword(!showPassword)}
                                                        className="opacity-50 hover:opacity-100 transition-opacity cursor-pointer p-1"
                                                        title={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                                                    >
                                                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                                    </button>
                                                }
                                            />
                                        </div>

                                        {/* Secret Admin Code for register */}
                                        {!isLogin && (
                                            <div className="pt-1">
                                                <button
                                                    type="button"
                                                    onClick={() => setIsSecretAdminMode(!isSecretAdminMode)}
                                                    className="text-[11px] font-bold text-amber-500 hover:underline flex items-center gap-1"
                                                >
                                                    <Shield size={13} /> {isSecretAdminMode ? 'Ẩn mã Admin' : 'Đăng ký cấp quyền Admin?'}
                                                </button>
                                                {isSecretAdminMode && (
                                                    <input
                                                        type="password"
                                                        value={formData.admin_secret}
                                                        onChange={e => setFormData({ ...formData, admin_secret: e.target.value })}
                                                        placeholder="Nhập mã bí mật Admin..."
                                                        className="w-full mt-2 py-3 px-4 rounded-2xl border-2 border-rose-300 dark:border-rose-900 bg-rose-50/50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-300 text-xs font-bold outline-none"
                                                    />
                                                )}
                                            </div>
                                        )}

                                        {isLogin && (
                                            <div className="flex items-center gap-2 pt-1 ml-1 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    id="rem-cb"
                                                    checked={rememberMe}
                                                    onChange={e => setRememberMe(e.target.checked)}
                                                    className="rounded cursor-pointer"
                                                />
                                                <label htmlFor="rem-cb" className="text-xs font-bold opacity-75 cursor-pointer">Ghi nhớ đăng nhập trên máy này</label>
                                            </div>
                                        )}

                                        {error && (
                                            <p className="text-xs text-rose-500 font-bold text-center bg-rose-500/10 p-2 rounded-xl">
                                                {error}
                                            </p>
                                        )}

                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className={cn(
                                                "w-full py-4 mt-2 rounded-2xl text-white font-black uppercase tracking-wider text-sm shadow-xl active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2",
                                                activeStyles.buttonGradient
                                            )}
                                        >
                                            {loading ? (
                                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            ) : (
                                                <>
                                                    <span>{isLogin ? 'Đăng nhập vào ca' : 'Tạo tài khoản mới'}</span>
                                                    <ArrowRight size={16} />
                                                </>
                                            )}
                                        </button>
                                    </form>
                                </m.div>
                            )}
                        </AnimatePresence>
                    </m.div>
                </div>
            </main>


            {/* Modal LAN Configuration */}
            <AnimatePresence>
                {showLanModal && (
                    <div className="fixed inset-0 w-full h-full flex items-center justify-center z-[100] p-4">
                        <m.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowLanModal(false)}
                            className="absolute inset-0 bg-slate-950/60 backdrop-blur-md"
                        />
                        <m.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className={cn(
                                "border-2 p-6 sm:p-8 rounded-[2.5rem] shadow-2xl w-full max-w-md relative z-10 overflow-hidden transition-all duration-300",
                                activeStyles.borderClass,
                                activeStyles.cardBg
                            )}
                        >
                            <div className="flex items-center justify-between mb-5">
                                <h3 className="text-lg font-black uppercase tracking-tight">Cấu hình kết nối mạng LAN</h3>
                                <button onClick={() => setShowLanModal(false)} className="p-2 rounded-xl opacity-60 hover:opacity-100 cursor-pointer">
                                    <X size={18} />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div className="flex p-1 rounded-2xl bg-black/[0.04] dark:bg-white/[0.06] border border-black/5 dark:border-white/10">
                                    <button
                                        type="button"
                                        onClick={() => setIsClientMode(false)}
                                        className={cn("flex-1 py-2.5 rounded-xl text-xs font-black uppercase transition-all cursor-pointer", !isClientMode ? "bg-white dark:bg-slate-800 shadow-sm" : "opacity-60")}
                                    >
                                        Chạy cục bộ
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setIsClientMode(true)}
                                        className={cn("flex-1 py-2.5 rounded-xl text-xs font-black uppercase transition-all cursor-pointer", isClientMode ? "bg-white dark:bg-slate-800 shadow-sm" : "opacity-60")}
                                    >
                                        Máy khách LAN
                                    </button>
                                </div>

                                {isClientMode && (
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-wider opacity-70">IP Máy Chủ Chính</label>
                                        <input
                                            type="text"
                                            value={lanIp}
                                            onChange={e => setLanIp(e.target.value)}
                                            placeholder="Ví dụ: 192.168.1.15"
                                            className={cn("w-full py-3 px-4 rounded-2xl border-2 font-mono text-sm outline-none", isDark ? "bg-slate-950/60 border-slate-800" : "bg-black/[0.03] border-transparent")}
                                        />
                                        <button
                                            type="button"
                                            onClick={handleTestConnection}
                                            disabled={testingConnection || !lanIp}
                                            className="w-full py-2.5 rounded-xl border text-xs font-bold uppercase tracking-wider hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
                                        >
                                            {testingConnection ? 'Đang kiểm tra...' : 'Kiểm tra kết nối'}
                                        </button>
                                        {connectionStatus === 'success' && <p className="text-xs text-emerald-500 font-bold text-center">Kết nối thành công!</p>}
                                        {connectionStatus === 'failed' && <p className="text-xs text-rose-500 font-bold text-center">{pingError || 'Lỗi kết nối'}</p>}
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-2 pt-2">
                                    <button type="button" onClick={() => setShowLanModal(false)} className="py-3 rounded-xl border text-xs font-black uppercase cursor-pointer">Hủy</button>
                                    <button type="button" onClick={handleSaveLanConfig} className={cn("py-3 rounded-xl text-white text-xs font-black uppercase shadow-lg cursor-pointer", activeStyles.buttonGradient)}>Lưu cấu hình</button>
                                </div>
                            </div>
                        </m.div>
                    </div>
                )}
            </AnimatePresence>

        </div>
    );
}
