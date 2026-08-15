import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Settings, X, Sun, Moon, Type, AlignLeft, Image as ImageIcon, Maximize, MoveVertical } from 'lucide-react';
import { playNotificationSound } from '../../lib/utils';

const BlossomItem = React.memo(({ accentColor, secondaryColor }) => {
    const style = React.useMemo(() => ({
        top: `${Math.random() * 100}%`,
        left: `${Math.random() * 100}%`,
        animationDelay: `${Math.random() * 5}s`,
        transform: `rotate(${Math.random() * 360}deg) scale(${0.4 + Math.random() * 0.8})`
    }), []);

    return (
        <div className="absolute animate-pulse" style={style}>
            <svg width="24" height="24" viewBox="0 0 20 20">
                <circle cx="10" cy="10" r="3" fill={accentColor} />
                {[...Array(5)].map((_, j) => (
                    <ellipse
                        key={j}
                        cx="10" cy="5" rx="3" ry="6"
                        fill={accentColor}
                        transform={`rotate(${j * 72} 10 10)`}
                    />
                ))}
                <circle cx="10" cy="10" r="1.5" fill={secondaryColor} opacity="0.8" />
            </svg>
        </div>
    );
});

const TetDecorations = ({ theme }) => {
    const isDark = theme === 'dark';
    const accentColor = isDark ? '#fbbf24' : '#dc2626';
    const secondaryColor = isDark ? '#ef4444' : '#fbbf24';

    return (
        <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-30 z-0">
            <style>
                {`
                    @keyframes bounce-slow {
                        0%, 100% { transform: translateY(0); }
                        50% { transform: translateY(-20px); }
                    }
                    .animate-bounce-slow {
                        animation: bounce-slow 4s ease-in-out infinite;
                    }
                    @keyframes spin-very-slow {
                        from { transform: rotate(0deg); }
                        to { transform: rotate(360deg); }
                    }
                    .animate-spin-very-slow {
                        animation: spin-very-slow 20s linear infinite;
                    }
                    @keyframes shimmer {
                        100% { transform: translateX(100%); }
                    }
                    @keyframes shake {
                        0%, 100% { transform: translateX(0); }
                        10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
                        20%, 40%, 60%, 80% { transform: translateX(5px); }
                    }
                    @keyframes float {
                        0%, 100% { transform: translateY(0); }
                        50% { transform: translateY(-20px); }
                    }
                    .animate-shake { animation: shake 2s infinite; }
                    .animate-float { animation: float 3s ease-in-out infinite; }
                    .animate-pulse-slow { animation: pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
                `}
            </style>

            {/* Hanging Lanterns */}
            <div className="absolute top-0 left-10 animate-bounce-slow">
                <svg width="40" height="120" viewBox="0 0 40 100">
                    <line x1="20" y1="0" x2="20" y2="30" stroke={accentColor} strokeWidth="2" />
                    <ellipse cx="20" cy="50" rx="15" ry="20" fill={secondaryColor} />
                    <line x1="10" y1="50" x2="30" y2="50" stroke={accentColor} strokeWidth="1" opacity="0.3" />
                    <rect x="15" y="70" width="10" height="5" fill={accentColor} />
                    <path d="M18 75 L15 100 M20 75 L20 100 M22 75 L25 100" stroke={accentColor} strokeWidth="1" />
                </svg>
            </div>
            <div className="absolute top-0 right-1/4 animate-bounce-slow" style={{ animationDelay: '1.5s' }}>
                <svg width="30" height="100" viewBox="0 0 40 100">
                    <line x1="20" y1="0" x2="20" y2="30" stroke={accentColor} strokeWidth="2" />
                    <circle cx="20" cy="50" r="15" fill={secondaryColor} />
                    <rect x="15" y="65" width="10" height="4" fill={accentColor} />
                    <path d="M18 70 L15 90 M20 70 L20 90 M22 70 L25 90" stroke={accentColor} strokeWidth="1" />
                </svg>
            </div>

            {/* Floating Blossoms - Mai & Đào */}
            {[...Array(12)].map((_, i) => (
                <BlossomItem key={i} accentColor={accentColor} secondaryColor={secondaryColor} />
            ))}

            {/* Firecrackers (Pháo) */}
            <div className="absolute top-20 right-10 opacity-40">
                <svg width="40" height="120" viewBox="0 0 40 120">
                    <line x1="20" y1="0" x2="20" y2="100" stroke={accentColor} strokeWidth="1" strokeDasharray="2,2" />
                    {[...Array(6)].map((_, i) => (
                        <g key={i} transform={`translate(0, ${i * 18 + 10})`}>
                            <rect x="5" y="0" width="14" height="6" fill={secondaryColor} rx="1" />
                            <rect x="21" y="4" width="14" height="6" fill={secondaryColor} rx="1" />
                        </g>
                    ))}
                    <circle cx="20" cy="115" r="4" fill={accentColor} className="animate-ping" />
                </svg>
            </div>

            {/* Stylized Luck Characters (Symbolic) */}
            <div
                className="absolute rotate-12 top-1/4 left-1/3 opacity-5 animate-spin-very-slow text-[150px] font-black select-none pointer-events-none"
                style={{ color: accentColor }}
            >
                福
            </div>
            <div
                className="absolute -rotate-12 bottom-1/4 right-1/4 opacity-5 animate-spin-very-slow text-[120px] font-black select-none pointer-events-none"
                style={{ animationDirection: 'reverse', color: accentColor }}
            >
                禄
            </div>

            {/* Cloud & Traditional Border Patterns */}
            <div className="absolute bottom-[-20px] left-0 opacity-20 w-full overflow-hidden flex">
                {[...Array(10)].map((_, i) => (
                    <svg key={i} width="150" height="80" viewBox="0 0 100 50" className="flex-shrink-0">
                        <path d="M0 50 Q 25 10, 50 50 Q 75 10, 100 50" stroke={accentColor} fill="none" strokeWidth="2" opacity="0.6" />
                        <path d="M10 40 Q 30 20, 50 40 Q 70 20, 90 40" stroke={accentColor} fill="none" strokeWidth="1" opacity="0.4" />
                    </svg>
                ))}
            </div>
        </div>
    );
};

const PackingDisplay = () => {
    const [orders, setOrders] = useState([]);
    const [heldOrders, setHeldOrders] = useState([]);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [soundEnabled, setSoundEnabled] = useState(true);
    const [showSettings, setShowSettings] = useState(false);

    // Initial settings from localStorage or defaults
    const [displaySettings, setDisplaySettings] = useState(() => {
        const saved = localStorage.getItem('packing_display_settings');
        const defaultSettings = {
            theme: 'dark', // light, dark
            colorTheme: 'green', // green, blue, red, yellow
            zoom: 1, // 0.5 - 2.0
            fontSize: 16, // px (base)
            headerFontSize: 40, // px (custom header text size)
            cardHeaderSize: 32, // px (Order ID size)
            cardHeaderPadding: 16, // px (Header padding)
            totalAmountSize: 48, // px (Total Amount size)
            totalAmountPadding: 12, // px (Total Amount padding)
            rowSpacing: 12, // px (padding)
            showFields: {
                image: false,
                barcode: false,
                note: true,
                unit: true,
                price: true, // Auto-enabled
                time: true
            },
            headerTitle: "CHÚC MỪNG NĂM MỚI", // New customizable title
            headerTitleColor: "", // Custom color for header title
            headerBgColor: "", // Custom background color for header title banner
            customBgDark: "", // Custom background for dark mode
            customBgLight: "", // Custom background for light mode
            quantityColor: "", // Custom color for quantity box (hex)
            // Idle Screen Settings
            idleMessage: "KHO ĐANG NGHỈ\nCHÚC MỪNG NĂM MỚI",
            idleSubMessage: "Dự kiến mở lại: 8h00 Ngày mùng 6 Tết",
            showIdleIcon: true,
            idleFontSize: 3, // rem base relative to zoom
            idleTextColor: "", // Custom color
            idleAnimation: true, // Keep for backward compat, but use Type
            idleAnimationType: 'pulse', // pulse, bounce, shake, float, none
            idleLogo: "" // Base64 image string
        };

        // Migrate old settings if compatible
        if (saved) {
            const parsed = JSON.parse(saved);
            // Ensure default for price if missing
            if (parsed.showFields && parsed.showFields.price === undefined) {
                parsed.showFields.price = true;
            }
            if (parsed.headerTitle === undefined) {
                parsed.headerTitle = "CHÚC MỪNG NĂM MỚI";
            }
            if (parsed.headerTitleColor === undefined) parsed.headerTitleColor = "";
            if (parsed.headerBgColor === undefined) parsed.headerBgColor = "";
            if (parsed.colorTheme === undefined) {
                parsed.colorTheme = 'tet';
            }
            if (parsed.quantityColor === undefined) parsed.quantityColor = "";
            if (parsed.idleMessage === undefined) parsed.idleMessage = "CHỜ ĐƠN HÀNG...";
            if (parsed.idleSubMessage === undefined) parsed.idleSubMessage = "";
            if (parsed.showIdleIcon === undefined) parsed.showIdleIcon = true;
            if (parsed.idleFontSize === undefined) parsed.idleFontSize = 3;
            if (parsed.idleTextColor === undefined) parsed.idleTextColor = "";
            if (parsed.idleAnimation === undefined) parsed.idleAnimation = true;
            if (parsed.idleAnimationType === undefined) parsed.idleAnimationType = parsed.idleAnimation ? 'pulse' : 'none';
            if (parsed.idleLogo === undefined) parsed.idleLogo = "";
            return { ...defaultSettings, ...parsed };
        }
        return defaultSettings;
    });

    // Handle Image Upload
    const handleLogoUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setDisplaySettings({ ...displaySettings, idleLogo: reader.result });
            };
            reader.readAsDataURL(file);
        }
    };

    // Live Clock Update
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        localStorage.setItem('packing_display_settings', JSON.stringify(displaySettings));
    }, [displaySettings]);

    // Apply Theme to Body
    useEffect(() => {
        if (displaySettings.theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [displaySettings.theme]);

    const lastStateIdRef = useRef(null);

    useEffect(() => {
        const channel = new BroadcastChannel('packing_channel');

        const handleData = (data) => {
            if (data.type === 'NEW_ORDER') {
                setOrders(data.orders || []);
                if (soundEnabled) {
                    playNotificationSound();
                }
            } else if (data.type === 'CLEAR') {
                setOrders([]);
            } else if (data.type === 'SYNC_HELD') {
                setHeldOrders(data.heldInvoices || []);
            }
        };

        channel.onmessage = (event) => {
            handleData(event.data);
        };

        // Request current cart state immediately from the POS window on tab load
        channel.postMessage({ type: 'REQUEST_SYNC' });

        // Polling fallback for cross-origin (browser cast)
        const pollBackend = async () => {
            try {
                const res = await axios.get('/api/packing/sync');
                if (res.data && res.data.state_id !== lastStateIdRef.current) {
                    lastStateIdRef.current = res.data.state_id;
                    handleData(res.data);
                }
            } catch (e) {
                // Ignore polling errors
            }
        };

        pollBackend(); // initial poll
        const interval = setInterval(pollBackend, 1500);

        return () => {
            channel.close();
            clearInterval(interval);
        };
    }, [soundEnabled]);



    // --- THEME CONFIGURATION ---
    const THEMES = {
        green: {
            name: 'Mộc (Xanh)',
            dark: {
                bg: 'bg-[#050804]', text: 'text-[#dcfce7]',
                cardBg: 'bg-[#0a1f0a]/90', cardBorder: 'border-[#d4a574]/30',
                accent: '#d4a574', accentText: 'text-[#d4a574]', accentBg: 'bg-[#d4a574]',
                subText: 'text-[#8b6f47]', success: 'text-[#4ade80]',
                gradient: 'from-[#1e3a0f] to-[#0a1f0a]', overlay: 'from-[#d4a574] to-transparent'
            },
            light: {
                bg: 'bg-[#faf8f3]', text: 'text-[#2d5016]',
                cardBg: 'bg-[#faf8f3]', cardBorder: 'border-[#d4a574]/40',
                accent: '#2d5016', accentText: 'text-[#2d5016]', accentBg: 'bg-[#2d5016]',
                subText: 'text-[#8b6f47]', success: 'text-[#2d5016]',
                gradient: 'from-[#2d5016] to-[#1e3a0f]', overlay: 'from-[#2d5016] to-[#d4a574]'
            }
        },
        blue: {
            name: 'Thủy (Xanh Dương)',
            dark: {
                bg: 'bg-[#020617]', text: 'text-[#e0f2fe]',
                cardBg: 'bg-[#0f172a]/90', cardBorder: 'border-[#38bdf8]/30',
                accent: '#38bdf8', accentText: 'text-[#38bdf8]', accentBg: 'bg-[#38bdf8]',
                subText: 'text-[#94a3b8]', success: 'text-[#7dd3fc]',
                gradient: 'from-[#0c4a6e] to-[#020617]', overlay: 'from-[#38bdf8] to-transparent'
            },
            light: {
                bg: 'bg-[#f0f9ff]', text: 'text-[#0369a1]',
                cardBg: 'bg-white', cardBorder: 'border-[#0ea5e9]/40',
                accent: '#0284c7', accentText: 'text-[#0284c7]', accentBg: 'bg-[#0284c7]',
                subText: 'text-[#64748b]', success: 'text-[#0284c7]',
                gradient: 'from-[#0ea5e9] to-[#0284c7]', overlay: 'from-[#0ea5e9] to-[#7dd3fc]'
            }
        },
        red: {
            name: 'Hỏa (Đỏ Tết)',
            dark: {
                bg: 'bg-[#2a0a0a]', text: 'text-[#ffe4e6]',
                cardBg: 'bg-[#450a0a]/90', cardBorder: 'border-[#fbbf24]/30',
                accent: '#fbbf24', accentText: 'text-[#fbbf24]', accentBg: 'bg-[#fbbf24]',
                subText: 'text-[#fca5a5]', success: 'text-[#fcd34d]',
                gradient: 'from-[#7f1d1d] to-[#450a0a]', overlay: 'from-[#fbbf24] to-transparent'
            },
            light: {
                bg: 'bg-[#fff1f2]', text: 'text-[#881337]',
                cardBg: 'bg-white', cardBorder: 'border-[#f43f5e]/40',
                accent: '#be123c', accentText: 'text-[#be123c]', accentBg: 'bg-[#be123c]',
                subText: 'text-[#9f1239]', success: 'text-[#be123c]',
                gradient: 'from-[#f43f5e] to-[#9f1239]', overlay: 'from-[#e11d48] to-[#fda4af]'
            }
        },
        yellow: {
            name: 'Kim (Vàng)',
            dark: {
                bg: 'bg-[#1c1917]', text: 'text-[#fef3c7]',
                cardBg: 'bg-[#292524]/90', cardBorder: 'border-[#f59e0b]/40',
                accent: '#f59e0b', accentText: 'text-[#f59e0b]', accentBg: 'bg-[#f59e0b]',
                subText: 'text-[#d7ccc8]', success: 'text-[#fbbf24]',
                gradient: 'from-[#78350f] to-[#292524]', overlay: 'from-[#f59e0b] to-transparent'
            },
            light: {
                bg: 'bg-[#fffbeb]', text: 'text-[#78350f]',
                cardBg: 'bg-white', cardBorder: 'border-[#d97706]/40',
                accent: '#d97706', accentText: 'text-[#d97706]', accentBg: 'bg-[#d97706]',
                subText: 'text-[#92400e]', success: 'text-[#d97706]',
                gradient: 'from-[#f59e0b] to-[#d97706]', overlay: 'from-[#f59e0b] to-[#fcd34d]'
            }
        },
        tet: {
            name: 'Tết (Năm Mới)',
            dark: {
                bg: 'bg-[#450a0a]',
                text: 'text-[#fef3c7]', // Pale Gold
                cardBg: 'bg-[#450a0a]/80 backdrop-blur-sm',
                cardBorder: 'border-[#fbbf24]/50', // Bright Gold
                accent: '#fbbf24', // Gold
                accentText: 'text-[#fbbf24]',
                accentBg: 'bg-[#fbbf24]',
                subText: 'text-[#fca5a5]', // Light Red
                success: 'text-[#fde047]', // Yellow
                gradient: 'from-[#ef4444] to-[#b91c1c]', // Red Gradient
                overlay: 'from-[#fbbf24] to-transparent',
                richBg: 'radial-gradient(circle at top, #991b1b 0%, #7f1d1d 50%, #450a0a 100%)'
            },
            light: {
                bg: 'bg-[#fecaca]',
                text: 'text-[#991b1b]', // Deep Red
                cardBg: 'bg-transparent backdrop-blur-sm',
                cardBorder: 'border-[#ef4444]/40',
                accent: '#dc2626', // Red
                accentText: 'text-[#dc2626]',
                accentBg: 'bg-[#dc2626]',
                subText: 'text-[#b91c1c]',
                success: 'text-[#dc2626]',
                gradient: 'from-[#ef4444] to-[#b91c1c]',
                overlay: 'from-[#fca5a5] to-[#fecaca]',
                richBg: 'radial-gradient(circle at top, #fef2f2 0%, #fee2e2 50%, #fecaca 100%)'
            }
        }
    };

    const colors = THEMES[displaySettings.colorTheme || 'green'][displaySettings.theme];
    const activeCustomBg = displaySettings.theme === 'dark' ? displaySettings.customBgDark : displaySettings.customBgLight;

    return (
        <div
            className={`min-h-screen font-sans transition-colors duration-300 overflow-x-hidden ${!activeCustomBg ? colors.bg : ''} ${colors.text}`}
            style={{
                backgroundColor: activeCustomBg || undefined,
                backgroundImage: (!activeCustomBg && colors.richBg) ? colors.richBg : undefined
            }}
        >
            {displaySettings.colorTheme === 'tet' && !activeCustomBg && (
                <TetDecorations theme={displaySettings.theme} />
            )}

            {/* Settings Overlay - Fixed (Not Zoomed) */}
            {showSettings && (
                <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in text-base">
                    <div className={`${displaySettings.theme === 'dark' ? 'bg-[#18181b] text-white border-white/20' : 'bg-white text-gray-900 border-black/10'} rounded-xl shadow-2xl p-6 w-full max-w-md border flex flex-col max-h-[85vh]`}>
                        <div className="flex justify-between items-center mb-6 flex-shrink-0">
                            <h2 className={`text-xl font-bold uppercase flex items-center gap-2 ${colors.accentText}`}>
                                <Settings size={20} className="animate-spin-slow" /> Cấu hình hiển thị
                            </h2>
                            <button onClick={() => setShowSettings(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="space-y-6 overflow-y-auto pr-2 custom-scrollbar flex-1">
                            {/* Color Theme Selector */}
                            <div>
                                <label className="text-xs font-bold uppercase tracking-wider opacity-70 flex items-center gap-2 mb-2">Màu sắc chủ đạo</label>
                                <div className="grid grid-cols-5 gap-2">
                                    {Object.entries(THEMES).map(([key, theme]) => (
                                        <button
                                            key={key}
                                            onClick={() => setDisplaySettings({ ...displaySettings, colorTheme: key })}
                                            className={`py-2 px-1 rounded-lg text-xs font-bold border-2 transition-all ${displaySettings.colorTheme === key ? `border-[${theme.dark.accent}] bg-white/10 scale-105` : 'border-transparent bg-black/20 opacity-70 hover:opacity-100'}`}
                                            style={{ borderColor: displaySettings.colorTheme === key ? theme.dark.accent : 'transparent' }}
                                        >
                                            <div className="w-4 h-4 rounded-full mx-auto mb-1" style={{ backgroundColor: theme.dark.accent }}></div>
                                            {theme.name.split(' ')[0]}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Theme Mode */}
                            <div className={`flex gap-2 p-1 rounded-lg ${displaySettings.theme === 'dark' ? 'bg-black/40' : 'bg-transparent'}`}>
                                <button
                                    onClick={() => setDisplaySettings({ ...displaySettings, theme: 'light' })}
                                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-bold transition-all ${displaySettings.theme === 'light' ? 'bg-transparent shadow text-[#2d5016]' : 'text-[#8b6f47] hover:text-[#2d5016]'}`}
                                >
                                    <Sun size={16} /> Sáng
                                </button>
                                <button
                                    onClick={() => setDisplaySettings({ ...displaySettings, theme: 'dark' })}
                                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-bold transition-all ${displaySettings.theme === 'dark' ? 'bg-[#1a3c0f] shadow text-[#d4a574]' : 'text-[#8b6f47] hover:text-[#2d5016]'}`}
                                >
                                    <Moon size={16} /> Tối
                                </button>
                            </div>

                            {/* Custom Background Color */}
                            <div>
                                <label className="text-xs font-bold uppercase tracking-wider opacity-70 flex items-center gap-2 mb-2"><ImageIcon size={14} /> Tùy chỉnh màu nền</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-[10px] font-bold block mb-1 opacity-60">Nền chế độ Tối</label>
                                        <div className="flex gap-2">
                                            <input
                                                type="color"
                                                value={displaySettings.customBgDark || '#000000'}
                                                onChange={(e) => setDisplaySettings({ ...displaySettings, customBgDark: e.target.value })}
                                                className="h-8 w-8 rounded cursor-pointer border-0 p-0"
                                            />
                                            <div className="flex-1 relative">
                                                <input
                                                    type="text"
                                                    value={displaySettings.customBgDark}
                                                    onChange={(e) => setDisplaySettings({ ...displaySettings, customBgDark: e.target.value })}
                                                    placeholder="Mặc định"
                                                    className={`w-full px-2 py-1.5 text-xs rounded border outline-none ${displaySettings.theme === 'dark' ? 'bg-black/30 border-white/20' : 'bg-white border-black/10'}`}
                                                />
                                                {displaySettings.customBgDark && (
                                                    <button
                                                        onClick={() => setDisplaySettings({ ...displaySettings, customBgDark: "" })}
                                                        className="absolute right-1 top-1/2 -translate-y-1/2 hover:text-red-500"
                                                    >
                                                        <X size={12} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold block mb-1 opacity-60">Nền chế độ Sáng</label>
                                        <div className="flex gap-2">
                                            <input
                                                type="color"
                                                value={displaySettings.customBgLight || '#ffffff'}
                                                onChange={(e) => setDisplaySettings({ ...displaySettings, customBgLight: e.target.value })}
                                                className="h-8 w-8 rounded cursor-pointer border-0 p-0"
                                            />
                                            <div className="flex-1 relative">
                                                <input
                                                    type="text"
                                                    value={displaySettings.customBgLight}
                                                    onChange={(e) => setDisplaySettings({ ...displaySettings, customBgLight: e.target.value })}
                                                    placeholder="Mặc định"
                                                    className={`w-full px-2 py-1.5 text-xs rounded border outline-none ${displaySettings.theme === 'dark' ? 'bg-black/30 border-white/20' : 'bg-white border-black/10'}`}
                                                />
                                                {displaySettings.customBgLight && (
                                                    <button
                                                        onClick={() => setDisplaySettings({ ...displaySettings, customBgLight: "" })}
                                                        className="absolute right-1 top-1/2 -translate-y-1/2 hover:text-red-500"
                                                    >
                                                        <X size={12} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Quantity Box Color */}
                            <div>
                                <label className="text-xs font-bold uppercase tracking-wider opacity-70 flex items-center gap-2 mb-2">Màu ô Số lượng</label>
                                <div className="flex gap-2">
                                    <input
                                        type="color"
                                        value={displaySettings.quantityColor || '#ffffff'}
                                        onChange={(e) => setDisplaySettings({ ...displaySettings, quantityColor: e.target.value })}
                                        className="h-9 w-9 rounded cursor-pointer border-0 p-0"
                                    />
                                    <div className="flex-1 relative">
                                        <input
                                            type="text"
                                            value={displaySettings.quantityColor}
                                            onChange={(e) => setDisplaySettings({ ...displaySettings, quantityColor: e.target.value })}
                                            placeholder="Mặc định (Theo theme)"
                                            className={`w-full px-3 py-2 rounded-lg font-bold border outline-none transition-all ${displaySettings.theme === 'dark' ? 'bg-black/30 border-white/20' : 'bg-white border-black/10'}`}
                                        />
                                        {displaySettings.quantityColor && (
                                            <button
                                                onClick={() => setDisplaySettings({ ...displaySettings, quantityColor: "" })}
                                                className="absolute right-2 top-1/2 -translate-y-1/2 hover:text-red-500"
                                            >
                                                <X size={14} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Header Text Customization */}
                            <div>
                                <label className="text-xs font-bold uppercase tracking-wider opacity-70 flex items-center gap-2 mb-2"><Type size={14} /> Tiêu đề Header & Màu sắc</label>
                                <div className="flex gap-2 items-center flex-wrap">
                                    <div className="flex flex-col gap-1 items-center">
                                        <input
                                            type="color"
                                            value={displaySettings.headerTitleColor || '#ffffff'}
                                            onChange={(e) => setDisplaySettings({ ...displaySettings, headerTitleColor: e.target.value })}
                                            className="h-10 w-10 rounded-lg cursor-pointer border-0 p-0 shadow-sm"
                                            title="Màu chữ tiêu đề"
                                        />
                                        <span className="text-[8px] font-bold opacity-50">CHỮ</span>
                                    </div>
                                    <div className="flex flex-col gap-1 items-center">
                                        <input
                                            type="color"
                                            value={displaySettings.headerBgColor || '#dc2626'}
                                            onChange={(e) => setDisplaySettings({ ...displaySettings, headerBgColor: e.target.value })}
                                            className="h-10 w-10 rounded-lg cursor-pointer border-0 p-0 shadow-sm"
                                            title="Màu nền tiêu đề"
                                        />
                                        <span className="text-[8px] font-bold opacity-50">NỀN</span>
                                    </div>
                                    <input
                                        type="text"
                                        value={displaySettings.headerTitle || ""}
                                        onChange={(e) => setDisplaySettings({ ...displaySettings, headerTitle: e.target.value })}
                                        placeholder="Nhập tiêu đề..."
                                        className={`flex-1 min-w-[120px] px-3 py-2 rounded-lg font-bold border outline-none transition-all ${displaySettings.theme === 'dark' ? 'bg-black/30 border-white/20 focus:border-white/50' : 'bg-white border-black/10 focus:border-black/30'} ${colors.accentText}`}
                                    />
                                    <input
                                        type="number"
                                        value={displaySettings.headerFontSize}
                                        onChange={(e) => setDisplaySettings({ ...displaySettings, headerFontSize: parseInt(e.target.value) || 40 })}
                                        className={`w-16 px-2 py-2 rounded-lg font-bold border outline-none transition-all text-center ${displaySettings.theme === 'dark' ? 'bg-black/30 border-white/20' : 'bg-white border-black/10'} ${colors.accentText}`}
                                        title="Cỡ chữ"
                                    />
                                    {(displaySettings.headerTitleColor || displaySettings.headerBgColor) && (
                                        <button
                                            onClick={() => setDisplaySettings({ ...displaySettings, headerTitleColor: "", headerBgColor: "" })}
                                            className="p-2 hover:bg-red-500/10 text-red-500 rounded-lg"
                                            title="Xóa màu tùy chỉnh"
                                        >
                                            <X size={16} />
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Zoom Control */}
                            <div>
                                <div className="flex justify-between mb-2">
                                    <label className="text-xs font-bold uppercase tracking-wider opacity-70 flex items-center gap-2"><Maximize size={14} /> Zoom (Tỷ lệ)</label>
                                    <span className="text-xs font-mono font-bold bg-[#d4a574]/20 text-[#d4a574] px-1.5 rounded">
                                        {Math.round(displaySettings.zoom * 100)}%
                                    </span>
                                </div>
                                <input
                                    type="range" min="0.5" max="2" step="0.1"
                                    value={displaySettings.zoom}
                                    onChange={(e) => setDisplaySettings({ ...displaySettings, zoom: parseFloat(e.target.value) })}
                                    className="w-full accent-[#d4a574] h-2 bg-[#d4a574]/20 rounded-lg appearance-none cursor-pointer"
                                />
                            </div>

                            {/* Font Size Control */}
                            <div>
                                <div className="flex justify-between mb-2">
                                    <label className="text-xs font-bold uppercase tracking-wider opacity-70 flex items-center gap-2"><Type size={14} /> Cỡ chữ</label>
                                    <span className="text-xs font-mono font-bold bg-[#d4a574]/20 text-[#d4a574] px-1.5 rounded">
                                        {displaySettings.fontSize}px
                                    </span>
                                </div>
                                <input
                                    type="range" min="10" max="40" step="1"
                                    value={displaySettings.fontSize}
                                    onChange={(e) => setDisplaySettings({ ...displaySettings, fontSize: parseInt(e.target.value) })}
                                    className="w-full accent-[#d4a574] h-2 bg-[#d4a574]/20 rounded-lg appearance-none cursor-pointer"
                                />
                                <div className="grid grid-cols-2 gap-2 mt-2">
                                    <div>
                                        <label className="text-[10px] font-bold uppercase opacity-70 mb-1 block">Cỡ chữ Đơn #</label>
                                        <input
                                            type="number"
                                            value={displaySettings.cardHeaderSize}
                                            onChange={(e) => setDisplaySettings({ ...displaySettings, cardHeaderSize: parseInt(e.target.value) || 32 })}
                                            className={`w-full px-2 py-1 rounded border text-sm font-bold text-center ${displaySettings.theme === 'dark' ? 'bg-black/30 border-white/20' : 'bg-white border-black/10'}`}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold uppercase opacity-70 mb-1 block">Padding Header</label>
                                        <input
                                            type="number"
                                            value={displaySettings.cardHeaderPadding}
                                            onChange={(e) => setDisplaySettings({ ...displaySettings, cardHeaderPadding: parseInt(e.target.value) || 16 })}
                                            className={`w-full px-2 py-1 rounded border text-sm font-bold text-center ${displaySettings.theme === 'dark' ? 'bg-black/30 border-white/20' : 'bg-white border-black/10'}`}
                                        />
                                    </div>
                                </div>
                                <div className="mt-2">
                                    <label className="text-[10px] font-bold uppercase opacity-70 mb-1 block">Size & Padding Tổng tiền</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <input
                                            type="number"
                                            value={displaySettings.totalAmountSize}
                                            onChange={(e) => setDisplaySettings({ ...displaySettings, totalAmountSize: parseInt(e.target.value) || 48 })}
                                            className={`w-full px-2 py-1 rounded border text-sm font-bold text-center ${displaySettings.theme === 'dark' ? 'bg-black/30 border-white/20' : 'bg-white border-black/10'}`}
                                            placeholder="Cỡ chữ (px)"
                                            title="Cỡ chữ Tổng tiền"
                                        />
                                        <input
                                            type="number"
                                            value={displaySettings.totalAmountPadding}
                                            onChange={(e) => setDisplaySettings({ ...displaySettings, totalAmountPadding: parseInt(e.target.value) || 12 })}
                                            className={`w-full px-2 py-1 rounded border text-sm font-bold text-center ${displaySettings.theme === 'dark' ? 'bg-black/30 border-white/20' : 'bg-white border-black/10'}`}
                                            placeholder="Padding"
                                            title="Padding Tổng tiền"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Row Spacing Control */}
                            <div>
                                <div className="flex justify-between mb-2">
                                    <label className="text-xs font-bold uppercase tracking-wider opacity-70 flex items-center gap-2"><MoveVertical size={14} /> Giãn dòng</label>
                                    <span className="text-xs font-mono font-bold bg-[#d4a574]/20 text-[#d4a574] px-1.5 rounded">
                                        {displaySettings.rowSpacing}px
                                    </span>
                                </div>
                                <input
                                    type="range" min="2" max="30" step="1"
                                    value={displaySettings.rowSpacing}
                                    onChange={(e) => setDisplaySettings({ ...displaySettings, rowSpacing: parseInt(e.target.value) })}
                                    className="w-full accent-[#d4a574] h-2 bg-[#d4a574]/20 rounded-lg appearance-none cursor-pointer"
                                />
                            </div>

                            {/* Fields Toggle */}
                            <div className="grid grid-cols-2 gap-2">
                                <label className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${displaySettings.theme === 'dark' ? 'bg-[#050804]/50 hover:bg-[#050804]' : 'bg-[#d4a574]/10 hover:bg-[#d4a574]/20'}`}>
                                    <input
                                        type="checkbox"
                                        checked={displaySettings.showFields.note}
                                        onChange={(e) => setDisplaySettings({ ...displaySettings, showFields: { ...displaySettings.showFields, note: e.target.checked } })}
                                        className="w-4 h-4 rounded text-[#d4a574] focus:ring-[#d4a574] bg-transparent border-[#d4a574]"
                                    />
                                    <AlignLeft size={14} /> <span className="text-xs font-bold">Ghi chú</span>
                                </label>
                                <label className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${displaySettings.theme === 'dark' ? 'bg-[#050804]/50 hover:bg-[#050804]' : 'bg-[#d4a574]/10 hover:bg-[#d4a574]/20'}`}>
                                    <input
                                        type="checkbox"
                                        checked={displaySettings.showFields.unit}
                                        onChange={(e) => setDisplaySettings({ ...displaySettings, showFields: { ...displaySettings.showFields, unit: e.target.checked } })}
                                        className="w-4 h-4 rounded text-[#d4a574] focus:ring-[#d4a574] bg-transparent border-[#d4a574]"
                                    />
                                    <Type size={14} /> <span className="text-xs font-bold">Đơn vị</span>
                                </label>
                                <label className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${displaySettings.theme === 'dark' ? 'bg-[#050804]/50 hover:bg-[#050804]' : 'bg-[#d4a574]/10 hover:bg-[#d4a574]/20'}`}>
                                    <input
                                        type="checkbox"
                                        checked={displaySettings.showFields.price}
                                        onChange={(e) => setDisplaySettings({ ...displaySettings, showFields: { ...displaySettings.showFields, price: e.target.checked } })}
                                        className="w-4 h-4 rounded text-[#d4a574] focus:ring-[#d4a574] bg-transparent border-[#d4a574]"
                                    />
                                    <span className="text-xs font-bold">💲 Đơn giá</span>
                                </label>
                            </div>

                            {/* Idle Screen Customization */}
                            <div>
                                <label className="text-xs font-bold uppercase tracking-wider opacity-70 flex items-center gap-2 mb-2"><Type size={14} /> Màn hình chờ / Thông báo</label>
                                <div className="space-y-3 bg-black/5 p-3 rounded-lg border border-black/5">
                                    {/* Main Text */}
                                    <div>
                                        <label className="text-[10px] font-bold opacity-60 uppercase mb-1 block">Nội dung chính (Xuống dòng tự do)</label>
                                        <textarea
                                            value={displaySettings.idleMessage}
                                            onChange={(e) => setDisplaySettings({ ...displaySettings, idleMessage: e.target.value })}
                                            placeholder="Nhập thông báo... (Nhấn Enter để xuống dòng)"
                                            rows={3}
                                            className={`w-full px-3 py-2 rounded-lg font-bold border outline-none transition-all resize-none ${displaySettings.theme === 'dark' ? 'bg-black/30 border-white/20' : 'bg-white border-black/10'}`}
                                        />
                                    </div>

                                    {/* Sub Text */}
                                    <div>
                                        <label className="text-[10px] font-bold opacity-60 uppercase mb-1 block">Nội dung phụ</label>
                                        <input
                                            type="text"
                                            value={displaySettings.idleSubMessage}
                                            onChange={(e) => setDisplaySettings({ ...displaySettings, idleSubMessage: e.target.value })}
                                            placeholder="Ghi chú thêm..."
                                            className={`w-full px-3 py-2 rounded-lg text-sm border outline-none transition-all ${displaySettings.theme === 'dark' ? 'bg-black/30 border-white/20' : 'bg-white border-black/10'}`}
                                        />
                                    </div>

                                    {/* Appearance Controls */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-[10px] font-bold opacity-60 uppercase mb-1 block">Cỡ chữ Chính</label>
                                            <input
                                                type="range" min="1" max="8" step="0.5"
                                                value={displaySettings.idleFontSize}
                                                onChange={(e) => setDisplaySettings({ ...displaySettings, idleFontSize: parseFloat(e.target.value) })}
                                                className="w-full accent-[#d4a574] h-2 bg-[#d4a574]/20 rounded-lg appearance-none cursor-pointer"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold opacity-60 uppercase mb-1 block">Màu chữ</label>
                                            <div className="flex gap-2">
                                                <input
                                                    type="color"
                                                    value={displaySettings.idleTextColor || '#ffffff'}
                                                    onChange={(e) => setDisplaySettings({ ...displaySettings, idleTextColor: e.target.value })}
                                                    className="h-7 w-8 rounded cursor-pointer border-0 p-0"
                                                />
                                                <button
                                                    onClick={() => setDisplaySettings({ ...displaySettings, idleTextColor: "" })}
                                                    className="text-[10px] underline opacity-70 hover:opacity-100"
                                                >Mặc định</button>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex gap-4 pt-1 items-center flex-wrap">
                                        <div className="w-full">
                                            <label className="text-[10px] font-bold opacity-60 uppercase mb-1 block">Logo / Hình ảnh (Upload)</label>
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={handleLogoUpload}
                                                    className={`block w-full text-xs file:mr-2 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold space-y-2
                                                    ${displaySettings.theme === 'dark' ? 'file:bg-white/10 file:text-white hover:file:bg-white/20' : 'file:bg-black/5 file:text-red-700 hover:file:bg-black/10'}`}
                                                />
                                                {displaySettings.idleLogo && (
                                                    <button
                                                        onClick={() => setDisplaySettings({ ...displaySettings, idleLogo: "" })}
                                                        className="text-xs text-red-500 font-bold hover:underline whitespace-nowrap"
                                                    >
                                                        Xóa ảnh
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        <label className="flex items-center gap-2 cursor-pointer mt-2">
                                            <input
                                                type="checkbox"
                                                checked={displaySettings.showIdleIcon}
                                                onChange={(e) => setDisplaySettings({ ...displaySettings, showIdleIcon: e.target.checked })}
                                                className="w-4 h-4 rounded text-[#d4a574]"
                                            />
                                            <span className="text-xs font-bold">Hiện Icon / Logo</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer mt-2 w-full">
                                            <span className="text-xs font-bold opacity-70">Hiệu ứng:</span>
                                            <select
                                                value={displaySettings.idleAnimationType}
                                                onChange={(e) => setDisplaySettings({ ...displaySettings, idleAnimationType: e.target.value })}
                                                className={`flex-1 px-2 py-1 rounded text-xs font-bold border outline-none cursor-pointer ${displaySettings.theme === 'dark' ? 'bg-black/30 border-white/20' : 'bg-white border-black/10'}`}
                                            >
                                                <option value="none">Không hiệu ứng</option>
                                                <option value="pulse">Nhấp nháy (Pulse)</option>
                                                <option value="bounce">Nảy (Bounce)</option>
                                                <option value="shake">Rung lắc (Shake)</option>
                                                <option value="float">Lơ lửng (Float)</option>
                                            </select>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 pt-4 border-t border-[#d4a574]/20 flex-shrink-0 flex gap-3">
                            <button
                                onClick={() => {
                                    if (window.confirm('Bạn có chắc muốn xóa toàn bộ cấu hình hiển thị về mặc định?')) {
                                        localStorage.removeItem('packing_display_settings');
                                        window.location.reload();
                                    }
                                }}
                                className={`flex-1 py-3 border rounded-lg font-bold uppercase text-xs transition-all active:scale-95 ${displaySettings.theme === 'dark' ? 'border-white/10 hover:bg-white/5 text-white/50' : 'border-black/10 hover:bg-black/5 text-black/50'}`}
                            >
                                Reset Mặc định
                            </button>
                            <button
                                onClick={() => setShowSettings(false)}
                                className="flex-[2] py-3 bg-gradient-to-br from-[#2d5016] to-[#4a7c59] hover:from-[#1e3a0f] hover:to-[#3a6320] text-white rounded-lg font-bold uppercase text-sm shadow-lg transition-all active:scale-95"
                            >
                                Đóng
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content Scalable Wrapper */}
            <div
                style={{
                    transform: `scale(${displaySettings.zoom})`,
                    transformOrigin: 'top left',
                    width: `${100 / displaySettings.zoom}%`,
                    minHeight: `${100 / displaySettings.zoom}vh`
                }}
                className="transition-transform duration-200"
            >
                <div className="flex justify-between items-center px-4 py-3 mb-1 bg-transparent relative z-50">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                        {orders.length > 0 && (
                            <div className="flex items-center gap-6 animate-fade-in-right">
                                <div className="flex flex-col">
                                    <div className="flex items-center gap-4">
                                        <h1 className={`text-5xl font-[900] leading-none tracking-tight ${colors.text} drop-shadow-sm`}>
                                            ĐƠN #{orders[0].id}
                                        </h1>
                                    </div>
                                    <div className="flex items-center gap-3 opacity-90 mt-1">
                                        <span className={`font-bold px-3 py-0.5 rounded-full flex items-center gap-1.5 ${colors.accentBg}/10 ${colors.accentText} border ${colors.cardBorder} text-sm`}>
                                            🕒 {orders[0].timestamp}
                                        </span>
                                        <span className={`font-bold uppercase tracking-wider ${colors.subText} text-sm`}>
                                            {orders.reduce((sum, order) => sum + (order.items ? order.items.length : 0), 0)} SẢN PHẨM
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* CENTER: Custom Title (Always visible, absolute center) */}
                    {displaySettings.headerTitle && (
                        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none flex items-center justify-center">
                            {/* Left Decoration */}
                            <div className="absolute left-[-60px] top-1/2 -translate-y-1/2 text-4xl opacity-80 animate-bounce" style={{ animationDuration: '2s' }}>🧧</div>

                            <div
                                className={`relative font-[900] uppercase tracking-[0.15em] shadow-2xl px-16 py-3 rounded-2xl overflow-hidden group transform hover:scale-105 transition-transform duration-500`}
                                style={{
                                    fontSize: `${displaySettings.headerFontSize}px`,
                                    color: displaySettings.headerTitleColor || 'white',
                                    background: displaySettings.headerBgColor
                                        ? displaySettings.headerBgColor
                                        : (displaySettings.colorTheme === 'tet'
                                            ? `linear-gradient(135deg, #b91c1c 0%, #dc2626 50%, #991b1b 100%)`
                                            : undefined),
                                    border: displaySettings.colorTheme === 'tet' ? '3px solid #f59e0b' : (displaySettings.headerBgColor ? '1px solid rgba(255,255,255,0.2)' : '1px solid rgba(255,255,255,0.2)'),
                                    textShadow: (displaySettings.colorTheme === 'tet' || displaySettings.headerBgColor) ? '3px 3px 0px rgba(0,0,0,0.3), 6px 6px 12px rgba(0,0,0,0.4)' : undefined,
                                    boxShadow: (displaySettings.colorTheme === 'tet' || displaySettings.headerBgColor) ? '0 20px 50px -10px rgba(0,0,0,0.3)' : undefined
                                }}
                            >
                                {/* Shimmer Effect */}
                                <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full animate-[shimmer_2.5s_infinite] skew-x-12"></div>

                                <span className="relative z-10 flex items-center gap-4">
                                    <span className={displaySettings.colorTheme === 'tet' ? "text-[#fbbf24] animate-pulse" : ""}>✨</span>
                                    {displaySettings.headerTitle}
                                    <span className={displaySettings.colorTheme === 'tet' ? "text-[#fbbf24] animate-pulse" : ""}>✨</span>
                                </span>

                                {/* Corner Accents for Tet */}
                                {displaySettings.colorTheme === 'tet' && (
                                    <>
                                        <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-[#fbbf24] m-1 rounded-tl"></div>
                                        <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-[#fbbf24] m-1 rounded-tr"></div>
                                        <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-[#fbbf24] m-1 rounded-bl"></div>
                                        <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-[#fbbf24] m-1 rounded-br"></div>
                                    </>
                                )}
                            </div>

                            {/* Right Decoration */}
                            <div className="absolute right-[-60px] top-1/2 -translate-y-1/2 text-4xl opacity-80 animate-bounce" style={{ animationDuration: '2.5s' }}>🧨</div>
                        </div>
                    )}

                    <div className="flex items-center gap-3 z-20">
                        {/* Clock */}
                        <div className={`
                            flex items-center gap-4 px-2 py-2 select-none 
                            ${colors.text} transition-transform hover:scale-105
                        `}>
                            <div className={`text-6xl font-[900] leading-none tracking-tight drop-shadow-md tabular-nums ${colors.accentText}`}>
                                {currentTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                            <div className={`flex flex-col justify-center border-l-2 pl-4 h-12 opacity-90 ${displaySettings.colorTheme === 'tet' ? 'border-[#f59e0b]' : 'border-current'}`}>
                                <div className="text-xs font-bold uppercase tracking-widest mb-0.5">
                                    {currentTime.toLocaleDateString('vi-VN', { weekday: 'long' })}
                                </div>
                                <div className="text-sm font-bold leading-none">
                                    {currentTime.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                </div>
                            </div>
                        </div>

                        {/* Sound Toggle */}
                        <button
                            onClick={() => setSoundEnabled(!soundEnabled)}
                            className={`
                                group relative p-2 rounded-xl border transition-all duration-300 backdrop-blur-md shadow-sm
                                ${soundEnabled
                                    ? (displaySettings.theme === 'dark' ? 'bg-[#2d5016]/20 border-[#4ade80]/30 text-[#4ade80]' : 'bg-[#dcfce7] border-[#4ade80] text-[#166534]')
                                    : 'bg-red-500/10 border-red-500/30 text-red-500 hover:bg-red-500/20'
                                }
                            `}
                            title={soundEnabled ? "Âm thanh: Bật" : "Âm thanh: Tắt"}
                        >
                            <div className={`absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity ${soundEnabled ? 'bg-[#4ade80]/10' : 'bg-red-500/10'}`}></div>
                            {soundEnabled ? <span className="text-xl">🔊</span> : <span className="text-xl">🔇</span>}
                        </button>

                        {/* Settings Button */}
                        <button
                            onClick={() => setShowSettings(true)}
                            className={`
                                group relative p-2 rounded-xl border transition-all duration-300 backdrop-blur-md shadow-sm
                                ${displaySettings.theme === 'dark'
                                    ? 'bg-black/40 border-white/10 text-white hover:border-white/30'
                                    : 'bg-white/60 border-black/5 text-gray-800 hover:border-black/20'
                                }
                            `}
                            title="Cấu hình"
                        >
                            <Settings size={22} className="group-hover:rotate-45 transition-transform duration-500" />
                        </button>
                    </div>
                </div>

                <SoundConfig orders={orders} soundEnabled={soundEnabled} />

                {orders.length > 0 ? (
                    <div className="grid grid-cols-1 gap-6 px-4 pb-8 animate-fade-in-up max-w-[95%] mx-auto">
                        {orders.map((order, index) => (
                            <div key={index} className="relative flex flex-col transition-all duration-300 h-full"> {/* h-full to expand */}
                                {/* Items List (The "Cart" - Boxed & Bordered) */}

                                {/* Items List (The "Cart" - Boxed & Bordered) */}
                                <div className={`relative z-10 flex-1 overflow-hidden rounded-3xl shadow-2xl border ${colors.cardBg} ${colors.cardBorder}`}>
                                    {/* Order Info Header inside Card */}
                                    <div className={`px-4 py-3 border-b ${colors.cardBorder} ${displaySettings.theme === 'dark' ? 'bg-black/30' : 'bg-black/5'} flex justify-between items-center relative overflow-hidden`}>
                                        <div className="flex items-center gap-3 relative z-10">
                                            <span className={`text-xl font-[900] ${colors.accentText} filter drop-shadow-sm`}>#{order.id}</span>
                                            {order.customer_name && (
                                                <div className={`flex items-center gap-2 px-3 py-1 rounded-full border shadow-sm ${displaySettings.theme === 'dark' ? 'bg-[#fbbf24]/10 border-[#fbbf24]/30' : 'bg-white border-black/10'}`}>
                                                    <span className="text-sm">👤</span>
                                                    <span className={`text-lg font-[900] uppercase tracking-wider ${displaySettings.theme === 'dark' ? 'text-[#fbbf24]' : colors.accentText}`}>
                                                        {order.customer_name}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                        <span className={`text-xs font-[900] opacity-70 px-2 py-1 rounded-lg ${displaySettings.theme === 'dark' ? 'bg-black/20' : 'bg-white/50'} ${colors.subText}`}>{order.timestamp}</span>
                                    </div>

                                    {/* Decorative Gradient Overlay for Cart */}
                                    <div className={`absolute inset-0 pointer-events-none opacity-10 bg-gradient-to-br ${colors.overlay}`}></div>

                                    <div className={`p-4 h-full overflow-y-auto custom-scrollbar ${displaySettings.theme === 'dark' ? 'bg-black/10' : 'bg-white/30'}`}>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            {order.items.map((item, idx) => (
                                                <div key={idx} className={`group flex items-center p-3 rounded-2xl border transition-all hover:scale-[1.005] hover:shadow-lg ${displaySettings.theme === 'dark' ? 'bg-black/20 hover:bg-black/40' : 'bg-white/60 hover:bg-white'} ${colors.cardBorder}`}>

                                                    {/* Quantity Badge */}
                                                    <div style={{ minWidth: `${displaySettings.fontSize * 3.5}px` }} className="flex-shrink-0 flex items-center justify-center mr-4">
                                                        <div
                                                            style={{
                                                                fontSize: `${displaySettings.fontSize * 1.4}px`,
                                                                backgroundColor: displaySettings.quantityColor || (displaySettings.colorTheme === 'tet' ? '#fbbf24' : undefined),
                                                                color: displaySettings.quantityColor ? '#fff' : (displaySettings.colorTheme === 'tet' ? '#450a0a' : undefined),
                                                                borderColor: displaySettings.quantityColor || (displaySettings.colorTheme === 'tet' ? '#f59e0b' : undefined)
                                                            }}
                                                            className={`min-w-[3rem] h-12 px-3 rounded-xl flex items-center justify-center font-[900] shadow-lg backdrop-blur-md border 
                                                            ${displaySettings.quantityColor || displaySettings.colorTheme === 'tet' ? '' : (displaySettings.theme === 'dark' ? 'bg-white/10 text-white border-white/20' : 'bg-black/5 text-gray-800 border-black/10')}
                                                            transition-all duration-300 transform group-hover:scale-110`}
                                                        >
                                                            {item.quantity}
                                                        </div>
                                                    </div>

                                                    {/* Product Info */}
                                                    <div className="flex-1 min-w-0 mr-4">
                                                        <div style={{ fontSize: `${displaySettings.fontSize * 1.1}px` }} className={`font-[700] leading-tight mb-1 break-words ${colors.text}`}>
                                                            {item.name}
                                                        </div>
                                                        <div className="flex items-center gap-2 opactity-70">
                                                            {displaySettings.showFields.unit && (
                                                                <span style={{ fontSize: `${displaySettings.fontSize * 0.8}px` }} className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border ${colors.subText} border-current opacity-60`}>
                                                                    {item.unit}
                                                                </span>
                                                            )}
                                                            {displaySettings.showFields.price && (
                                                                <span style={{ fontSize: `${displaySettings.fontSize * 0.9}px` }} className={`font-mono ${colors.subText}`}>
                                                                    {item.price ? new Intl.NumberFormat('vi-VN').format(item.price) : '-'}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Total Price */}
                                                    <div style={{ fontSize: `${displaySettings.fontSize * 1.2}px` }} className={`font-[800] text-right min-w-[120px] ${colors.success}`}>
                                                        {item.price ? new Intl.NumberFormat('vi-VN').format(item.price * item.quantity) : '-'}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Footer & Note (Transparent, Floating) */}
                                <div className="mt-2 px-2 py-2 flex flex-col md:flex-row justify-between items-center gap-4">
                                    {order.note && displaySettings.showFields.note ? (
                                        <div className={`flex-1 p-3 rounded-xl border-l-4 w-full md:w-auto flex gap-3 shadow-lg backdrop-blur-md ${displaySettings.theme === 'dark' ? 'bg-red-900/20 border-red-500/50 text-red-200' : 'bg-red-50/80 border-red-500 text-red-800'}`}>
                                            <span className="text-xl">📝</span>
                                            <div>
                                                <div className="font-[900] text-[10px] uppercase tracking-widest opacity-70 mb-0.5">Lưu ý</div>
                                                <div style={{ fontSize: `${displaySettings.fontSize}px` }} className="font-bold leading-tight">{order.note}</div>
                                            </div>
                                        </div>
                                    ) : (<div></div>)}

                                    <div className="flex items-center gap-4">
                                        <span style={{ fontSize: `${displaySettings.fontSize}px` }} className={`font-bold uppercase tracking-widest ${colors.subText} drop-shadow-sm`}>
                                            Tổng tiền
                                        </span>
                                        <div
                                            className={`rounded-2xl shadow-2xl border-2 backdrop-blur-xl ${colors.accentBg}/10 ${colors.cardBorder.replace('/30', '').replace('/40', '')}`}
                                            style={{ padding: `${displaySettings.totalAmountPadding}px` }}
                                        >
                                            <span style={{ fontSize: `${displaySettings.totalAmountSize}px` }} className={`font-[900] ${colors.accentText} drop-shadow-sm leading-none block`}>
                                                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(
                                                    order.items.reduce((sum, item) => sum + (item.price || 0) * item.quantity, 0)
                                                )}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : heldOrders.length > 0 ? (
                    <div className="px-4 pb-8 max-w-[95%] mx-auto">
                        <div className="flex items-center gap-3 mb-6">
                            <h2 className={`text-xl font-[900] uppercase tracking-widest flex items-center gap-3 ${colors.accentText}`}>
                                <span className={`w-8 h-1 rounded-full ${colors.accentBg}`}></span>
                                Hàng chờ ({heldOrders.length})
                            </h2>
                            <div className={`h-px flex-1 bg-gradient-to-r ${colors.overlay}`}></div>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {heldOrders.map((held) => (
                                <div key={held.id} className={`group relative overflow-hidden rounded-2xl border transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${displaySettings.theme === 'dark' ? 'bg-black/40' : 'bg-white'} ${colors.cardBorder} hover:border-current`}>
                                    <div className={`absolute top-0 right-0 p-2 opacity-[0.03] font-black text-7xl pointer-events-none -rotate-12 select-none group-hover:opacity-[0.08] transition-opacity ${colors.text}`}>
                                        #{held.id}
                                    </div>

                                    <div className={`p-4 border-b ${colors.cardBorder} ${displaySettings.theme === 'dark' ? 'bg-black/20' : 'bg-transparent/50'}`}>
                                        <div className="flex justify-between items-start mb-2 relative z-10">
                                            <div className="flex-1 pr-2">
                                                <h3 style={{ fontSize: `${displaySettings.fontSize * 1.1}px` }} className={`font-bold line-clamp-1 mb-1 ${colors.accentText}`}>{held.partner_name}</h3>
                                                <div className="flex items-center gap-1.5">
                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${colors.accentBg}/10 ${colors.accentText}`}>🕒 {held.time}</span>
                                                </div>
                                            </div>
                                            <div className={`text-lg font-black rounded-xl w-10 h-10 flex items-center justify-center border shadow-inner ${displaySettings.theme === 'dark' ? 'bg-black/50 text-white' : 'bg-white text-gray-900'} ${colors.cardBorder}`}>
                                                {held.itemCount}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-3">
                                        <ul className="space-y-2">
                                            {held.items.slice(0, 3).map((item, idx) => (
                                                <li key={idx} className={`flex justify-between items-center text-xs pb-1 border-b last:border-0 last:pb-0 ${colors.cardBorder}`}>
                                                    <span className={`font-medium truncate pr-2 flex-1 ${colors.text} opacity-80`}>{item.name}</span>
                                                    <span className={`font-bold px-1.5 py-0.5 rounded text-[10px] min-w-[1.5rem] text-center ${colors.accentBg}/10 ${colors.accentText}`}>x{item.quantity}</span>
                                                </li>
                                            ))}
                                            {held.items.length > 3 && (
                                                <li className={`text-[10px] text-center italic mt-1 ${colors.subText}`}>
                                                    ... và {held.items.length - 3} sản phẩm khác
                                                </li>
                                            )}
                                        </ul>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className={`flex flex-col items-center justify-center p-8 text-center min-h-[70vh] my-auto 
                        ${displaySettings.idleAnimationType === 'pulse' ? 'animate-pulse' : ''}
                        ${displaySettings.idleAnimationType === 'bounce' ? 'animate-bounce' : ''}
                        ${displaySettings.idleAnimationType === 'shake' ? 'animate-shake' : ''}
                        ${displaySettings.idleAnimationType === 'float' ? 'animate-float' : ''}
                        ${colors.subText}`}
                    >
                        {displaySettings.showIdleIcon && (
                            <div
                                className={`mb-6 opacity-90 ${colors.accentText} flex items-center justify-center transition-all duration-500`}
                                style={{
                                    width: `${displaySettings.idleFontSize * 3}rem`, // Slightly larger for logo
                                    height: displaySettings.idleLogo ? 'auto' : `${displaySettings.idleFontSize * 2.5}rem`,
                                    maxHeight: '40vh',
                                    color: displaySettings.idleTextColor || undefined
                                }}
                            >
                                {displaySettings.idleLogo ? (
                                    <img
                                        src={displaySettings.idleLogo}
                                        alt="Logo"
                                        className="w-full h-full object-contain drop-shadow-lg"
                                    />
                                ) : (
                                    <svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                                        <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                                        <line x1="12" y1="22.08" x2="12" y2="12"></line>
                                    </svg>
                                )}
                            </div>
                        )}

                        <div className="relative z-10 max-w-4xl mx-auto">
                            <h2
                                className="font-[900] uppercase tracking-widest leading-tight whitespace-pre-line drop-shadow-xl"
                                style={{
                                    fontSize: `${displaySettings.idleFontSize}rem`,
                                    color: displaySettings.idleTextColor || undefined,
                                    textShadow: displaySettings.idleTextColor ? '0 4px 12px rgba(0,0,0,0.5)' : undefined
                                }}
                            >
                                {displaySettings.idleMessage || "WAITING FOR ORDERS..."}
                            </h2>

                            {displaySettings.idleSubMessage && (
                                <div
                                    className="mt-6 font-medium opacity-80 max-w-2xl mx-auto whitespace-pre-line"
                                    style={{
                                        fontSize: `${Math.max(1, displaySettings.idleFontSize * 0.4)}rem`,
                                        color: displaySettings.idleTextColor || undefined
                                    }}
                                >
                                    {displaySettings.idleSubMessage}
                                </div>
                            )}
                        </div>

                        {/* Optional Decorative Border for High Importance feel */}
                        {displaySettings.idleFontSize > 4 && (
                            <div className={`absolute inset-x-8 inset-y-8 border-4 border-dashed opacity-20 rounded-3xl pointer-events-none ${colors.cardBorder}`}></div>
                        )}
                    </div>
                )}
            </div>
        </div >
    );
};

const SoundConfig = ({ orders, soundEnabled }) => {
    const prevCountRef = useRef(0);
    const audioRef = useRef(null);

    useEffect(() => {
        // Base64 notification sound (short pop)
        const AUDIO_SRC = "data:audio/mp3;base64,SUQzBAAAAAABAFRYWFgAAAASAAADbWFqb3JfYnJhbmQAZGFzaABUWFhYAAAAEQAAA21pbm9yX3ZlcnNpb24AMABUWFhYAAAAHAAAA2NvbXBhdGlibGVfYnJhbmRzAGlzbzZtcDQxAFRTU0UAAAAOAAADTGF2ZjU5LjI3LjEwMAAAAAAAAAAAAAAA//uQZAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWgAAAA0AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABYaW5nAAAAHgAAAAgAAAd4AAKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioq//uQZAAAAAAAABAAAAAAAAAAAAAAKlhwAAAAAALgAAAAAAAABZWFyADIwMjMA//uQZAAP8AAANAAAAAAA0AAAAAAA0AAAAAAA0AAAAAAA0AAAAA";
        audioRef.current = new Audio(AUDIO_SRC);
    }, []);

    useEffect(() => {
        if (!orders) return;
        const currentCount = orders.reduce((sum, order) => sum + (order.items ? order.items.length : 0), 0);

        if (currentCount > prevCountRef.current && soundEnabled && audioRef.current) {
            audioRef.current.currentTime = 0;
            audioRef.current.play().catch(e => console.error("Sound play failed", e));
        }
        prevCountRef.current = currentCount;
    }, [orders, soundEnabled]);

    return null;
};

export default PackingDisplay;
