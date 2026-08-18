import {
    LayoutDashboard,
    ShoppingCart,
    QrCode,
    Truck,
    History as HistoryIcon,
    Package,
    Users,
    LogOut,
    Wallet,
    Sun,
    Moon,
    Settings as SettingsIcon,
    TrendingUp,
    ChevronLeft,
    ChevronRight,
    ChevronUp,
    ChevronDown,
    LayoutTemplate,
    Sprout,
    Wheat,
    Droplets,
    Leaf,
    Coins,
    SprayCan,
    Calendar,
    Home,
    BookOpen,
    Power,
    Landmark,
    Calculator,
    Warehouse,
    X,
    Store,
    ShoppingBag,
    ShieldCheck,
    ArrowLeftRight,
    Volume2,
    VolumeX,
    Megaphone,
    Download,
    Zap,
    Gamepad2,
    Search,
    Globe,
    ArrowRight,
    FileText,
    Tv,
    Scale
} from 'lucide-react';
import { useState, useEffect, useRef, useMemo, memo } from 'react';

import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion as m, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { cn, playNotificationSound } from '../lib/utils';
import { checkIsAdmin } from '../lib/auth';
import { createPortal } from 'react-dom';
import ContextMenu from './ContextMenu';
import { getLiteTheme } from '../lib/liteTheme';
import OrderEditPopup from './OrderEditPopup';

const Portal = ({ children }) => {
    return createPortal(children, document.body);
};

const NavItem = ({ icon: Icon, label, path, active, isCollapsed, onClick, liteTheme }) => {
    const isLite = !!liteTheme;
    const linkStyle = isLite ? {
        color: active ? '#ffffff' : liteTheme.text,
    } : {};

    return (
        <m.div className="relative px-3 py-1">
            <Link
                to={path}
                onClick={onClick}
                style={linkStyle}
                className={cn(
                    "group relative flex items-center gap-4 px-4 py-3 rounded-2xl transition-all duration-300",
                    isLite 
                        ? (active ? "shadow-md" : "hover:bg-black/5 dark:hover:bg-white/5")
                        : (active
                            ? "text-emerald-700 dark:text-emerald-300 font-black"
                            : "text-slate-700 hover:text-slate-950 dark:text-slate-300 dark:hover:text-white hover:bg-emerald-500/5 dark:hover:bg-white/10")
                )}
            >
                {active && isLite && (
                    <m.div
                        layoutId="sidebar-active-pill-lite"
                        style={{
                            background: liteTheme.accent,
                            borderColor: liteTheme.border
                        }}
                        className="absolute inset-0 rounded-2xl z-0 border shadow-inner"
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                )}
                {active && !isLite && (
                    <m.div
                        layoutId="sidebar-active-pill"
                        className="absolute inset-0 rounded-2xl bg-gradient-to-r from-emerald-500/20 via-emerald-500/10 to-teal-500/5 border border-emerald-500/30 dark:border-emerald-400/30 backdrop-blur-xl shadow-md shadow-emerald-950/10 z-0"
                        transition={{ type: "spring", stiffness: 350, damping: 30 }}
                    />
                )}
                {active && !isLite && (
                    <m.div
                        layoutId="sidebar-active-glow"
                        className="absolute left-0 top-1/4 bottom-1/4 w-1.5 bg-emerald-500 dark:bg-emerald-400 rounded-r-full shadow-[0_0_12px_#34d399] z-20"
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                )}

                <m.div
                    className="relative z-10 shrink-0"
                    whileHover={{ scale: 1.15, rotate: [0, -8, 8, 0] }}
                    transition={{ duration: 0.2 }}
                >
                    <Icon size={20} strokeWidth={active ? 2.5 : 2} className={cn("transition-all duration-300", active && !isLite ? "text-emerald-600 dark:text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]" : "")} />
                </m.div>

                <AnimatePresence>
                    {!isCollapsed && (
                        <div className="relative z-10 flex-1 min-w-0 sidebar-marquee-container">
                            <m.span
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                className="inline-block text-[12px] font-black uppercase tracking-[0.15em] whitespace-nowrap marquee-content"
                            >
                                {label}
                            </m.span>
                        </div>
                    )}
                </AnimatePresence>

                {/* Tooltip for Simple Collapsed NavItem */}
                {isCollapsed && (
                    <div 
                        style={isLite ? { backgroundColor: liteTheme.surface, color: liteTheme.text, borderColor: liteTheme.border } : {}}
                        className={cn(
                            "absolute left-full ml-4 px-3 py-2 text-[11px] font-black rounded-xl opacity-0 translate-x-3 pointer-events-none group-hover:opacity-100 group-hover:translate-x-0 transition-all z-[1001] whitespace-nowrap shadow-2xl border uppercase tracking-[0.2em] backdrop-blur-md",
                            isLite ? "" : "bg-[#0d1a04] text-white border-white/10"
                        )}
                    >
                        {label}
                    </div>
                )}
            </Link>
        </m.div>
    );
};

const NavItemMemo = memo(NavItem);

const NavGroup = memo(({ item, isActive, isCollapsed, liteTheme }) => {
    const isLite = !!liteTheme;
    const [isOpen, setIsOpen] = useState(false);
    const [isFlyoutOpen, setIsFlyoutOpen] = useState(false);
    const [flyoutHeight, setFlyoutHeight] = useState(350);
    const groupRef = useRef(null);
    const flyoutRef = useRef(null);
    const timeoutRef = useRef(null);
    const isAnyChildActive = item.children.some(child => isActive(child.path));

    useEffect(() => {
        if (isAnyChildActive) setIsOpen(true);
    }, [isAnyChildActive]);

    // Measure height dynamically using ResizeObserver (handles zooms and updates)
    useEffect(() => {
        if (!isFlyoutOpen || !flyoutRef.current) return;
        
        const updateHeight = () => {
            if (flyoutRef.current) {
                const height = flyoutRef.current.getBoundingClientRect().height;
                if (height > 0) {
                    setFlyoutHeight(height);
                }
            }
        };

        updateHeight();

        const observer = new ResizeObserver(() => {
            updateHeight();
        });
        
        observer.observe(flyoutRef.current);
        return () => observer.disconnect();
    }, [isFlyoutOpen]);

    // Handle Click Outside for Flyout
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (isFlyoutOpen && groupRef.current && !groupRef.current.contains(event.target)) {
                const flyout = document.querySelector('[data-flyout="true"]');
                if (flyout && flyout.contains(event.target)) return;
                setIsFlyoutOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isFlyoutOpen]);

    const handleMouseEnterHeader = () => {
        if (!isCollapsed) {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            setIsOpen(true);
        }
    };

    const handleMouseLeaveHeader = () => {
        if (!isCollapsed && !isAnyChildActive) {
            timeoutRef.current = setTimeout(() => setIsOpen(false), 300);
        }
    };

    const handleHeaderClick = () => {
        if (isCollapsed) {
            setIsFlyoutOpen(!isFlyoutOpen);
        } else {
            setIsOpen(!isOpen);
        }
    };

    const getFlyoutPosition = () => {
        if (!groupRef.current) return { top: 0, left: 80 };
        const rect = groupRef.current.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        
        let top = rect.top;
        // Shift upward if bottom overflows viewport bottom boundary
        if (top + flyoutHeight > viewportHeight) {
            top = Math.max(10, viewportHeight - flyoutHeight - 16);
        }
        return {
            top: top,
            left: rect.right - 10
        };
    };

    return (
        <div
            ref={groupRef}
            className="flex flex-col gap-1 py-1 relative group/group"
            onMouseEnter={handleMouseEnterHeader}
            onMouseLeave={handleMouseLeaveHeader}
        >
            <m.button
                onClick={handleHeaderClick}
                className={cn(
                    "group relative flex items-center gap-4 px-4 py-3 mx-3 mb-1 rounded-2xl transition-all duration-300",
                    isLite
                        ? ((isAnyChildActive || isFlyoutOpen) ? "text-emerald-400 bg-white/5" : "text-slate-400 hover:text-white hover:bg-white/5")
                        : ((isAnyChildActive || isFlyoutOpen)
                            ? "text-emerald-700 dark:text-emerald-300 font-black bg-gradient-to-r from-emerald-500/15 via-emerald-500/10 to-teal-500/5 border border-emerald-500/25 dark:border-emerald-400/25 shadow-md shadow-emerald-950/10"
                            : "text-slate-700 hover:text-slate-950 dark:text-slate-300 dark:hover:text-white hover:bg-emerald-500/5 dark:hover:bg-white/10"),
                    isCollapsed ? "justify-center px-0 mx-4" : ""
                )}
            >
                <item.icon size={20} className={cn("shrink-0 transition-transform duration-500", (isAnyChildActive || isFlyoutOpen) ? "scale-110 rotate-3 text-emerald-600 dark:text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]" : "")} />
                {!isCollapsed && (
                    <>
                        <div className="flex-1 min-w-0 sidebar-marquee-container">
                            <span className="inline-block text-[12px] font-black uppercase tracking-[0.15em] whitespace-nowrap marquee-content">
                                {item.label}
                            </span>
                        </div>
                        <ChevronRight size={14} className={cn("transition-transform duration-300 opacity-40 shrink-0", isOpen ? "rotate-90 opacity-100 text-emerald-400" : "")} />
                    </>
                )}

                {/* Active Indicator for Collapsed Mode */}
                {isCollapsed && isAnyChildActive && (
                    <div className="absolute left-0 w-1.5 h-6 bg-emerald-500 rounded-r-full shadow-[0_0_10px_#10b981]" />
                )}
            </m.button>

            {/* FLYOUT MENU using Portal */}
            <AnimatePresence>
                {isFlyoutOpen && isCollapsed && (
                    <Portal>
                        <m.div
                            ref={flyoutRef}
                            initial={{ opacity: 0, x: 15, scale: 0.95 }}
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            exit={{ opacity: 0, x: 10, scale: 0.98 }}
                            style={{
                                position: 'fixed',
                                ...getFlyoutPosition(),
                                maxHeight: 'calc(100vh - 20px)'
                            }}
                            className="w-80 pl-6 z-[2000] pointer-events-auto"
                            data-flyout="true"
                        >
                            <div className="bg-transparent backdrop-blur-3xl rounded-[2rem] shadow-2xl shadow-emerald-900/10 border-2 border-emerald-500/20 p-4 overflow-hidden ring-1 ring-white/5 flex flex-col max-h-[85vh]">
                                <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/5 via-transparent to-transparent pointer-events-none" />

                                <div className="relative z-10 mb-3 px-5 py-2.5 border-b border-emerald-500/10 dark:border-white/5 bg-emerald-500/5 dark:bg-white/5 rounded-2xl flex items-center justify-between shrink-0">
                                    <div>
                                        <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-800/60 dark:text-emerald-400/80 leading-none">Danh mục</h3>
                                        <p className="text-[16px] font-black text-slate-800 dark:text-white uppercase tracking-widest mt-2">{item.label}</p>
                                    </div>
                                    <m.button
                                        whileTap={{ scale: 0.9 }}
                                        onClick={() => setIsFlyoutOpen(false)}
                                        className="p-1.5 rounded-full hover:bg-emerald-500/10 text-slate-400 hover:text-slate-800 dark:hover:text-white"
                                    >
                                        <X size={14} />
                                    </m.button>
                                </div>

                                <div className="relative z-10 flex flex-col gap-1 overflow-y-auto no-scrollbar flex-1 pr-1">
                                    {item.children.map(child => (
                                        <NavItemMemo
                                            key={child.path}
                                            icon={child.icon}
                                            label={child.label}
                                            path={child.path}
                                            active={isActive(child.path)}
                                            isCollapsed={false}
                                            onClick={() => setIsFlyoutOpen(false)}
                                            liteTheme={liteTheme}
                                        />
                                    ))}
                                </div>
                            </div>
                        </m.div>
                    </Portal>
                )}
            </AnimatePresence>

            {/* ACCORDION for Expanded Sidebar */}
            <AnimatePresence>
                {isOpen && !isCollapsed && (
                    <m.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden flex flex-col pl-6"
                    >
                        {item.children.map(child => (
                            <NavItemMemo
                                key={child.path}
                                icon={child.icon}
                                label={child.label}
                                path={child.path}
                                active={isActive(child.path)}
                                isCollapsed={false}
                                liteTheme={liteTheme}
                            />
                        ))}
                    </m.div>
                )}
            </AnimatePresence>
        </div>
    );
});

const FloatingLiteMenu = ({ liteTheme, navigate, containerRef }) => {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef(null);
    const dropdownRef = useRef(null);
    const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0, positionAbove: false });

    useEffect(() => {
        const handleClickOutside = (e) => {
            const clickedInsideButton = menuRef.current && menuRef.current.contains(e.target);
            const clickedInsideDropdown = dropdownRef.current && dropdownRef.current.contains(e.target);
            if (!clickedInsideButton && !clickedInsideDropdown) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const menuItems = [
        { label: "Tổng quan", path: "/", icon: "📊" },
        { label: "Bán hàng", path: "/pos", icon: "🖥️" },
        { label: "Nhập hàng", path: "/purchase", icon: "📥" },
        { label: "Lịch sử", path: "/history", icon: "📜" },
        { label: "Tổng hợp", path: "/summary", icon: "📈" },
        { label: "Sổ GD", path: "/ledger", icon: "📖" },
        { label: "Cài đặt", path: "/settings", icon: "⚙️" }
    ];

    const handleLogout = () => {
        sessionStorage.removeItem('user');
        localStorage.removeItem('user');
        navigate('/welcome');
    };

    const toggleMenu = () => {
        if (!isOpen && menuRef.current) {
            const rect = menuRef.current.getBoundingClientRect();
            const menuWidth = 192; // w-48 is 192px
            const menuHeight = 240; // Estimated height
            
            // Calculate left with screen boundary constraints
            let left = rect.left + rect.width / 2 - menuWidth / 2;
            left = Math.max(12, Math.min(window.innerWidth - menuWidth - 12, left));
            
            // Calculate top, check if it fits below
            let top = rect.bottom + 8;
            let positionAbove = false;
            if (top + menuHeight > window.innerHeight && rect.top - menuHeight - 8 > 0) {
                top = rect.top - menuHeight - 8;
                positionAbove = true;
            }
            
            setMenuPosition({ top, left, positionAbove });
        }
        setIsOpen(!isOpen);
    };

    return (
        <m.div 
            ref={menuRef} 
            drag
            dragConstraints={containerRef}
            dragMomentum={false}
            dragElastic={0.1}
            onDragStart={() => setIsOpen(false)} // Close menu when dragging starts
            className="absolute bottom-6 right-6 z-[9999] no-print select-none pointer-events-auto"
        >
            {/* Logo Image Trigger - Transparent Background */}
            <m.div
                whileHover={{ scale: 1.1, rotate: 5 }}
                whileTap={{ scale: 0.95 }}
                onClick={toggleMenu}
                className="w-20 h-20 flex items-center justify-center cursor-grab active:cursor-grabbing"
            >
                <img 
                    src="/logo.png" 
                    alt="POS" 
                    draggable="false"
                    className="w-18 h-18 object-contain drop-shadow-[0_4px_12px_rgba(16,185,129,0.4)] hover:drop-shadow-[0_6px_16px_rgba(16,185,129,0.6)] transition-all select-none pointer-events-none" 
                />
            </m.div>

            {/* Dropdown Menu in Portal */}
            <AnimatePresence>
                {isOpen && (
                    <Portal>
                        <m.div
                            ref={dropdownRef}
                            initial={{ opacity: 0, scale: 0.95, y: menuPosition.positionAbove ? 10 : -10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: menuPosition.positionAbove ? 10 : -10 }}
                            transition={{ duration: 0.15 }}
                            onPointerDown={(e) => e.stopPropagation()} // Stop dragging when interacting with menu
                            className="fixed w-48 rounded-2xl shadow-2xl border p-2 backdrop-blur-md z-[10000] select-none"
                            style={{
                                top: menuPosition.top,
                                left: menuPosition.left,
                                backgroundColor: liteTheme.surface,
                                borderColor: liteTheme.border,
                                color: liteTheme.text
                            }}
                        >
                            <div className="px-3 py-1.5 text-[9px] font-black uppercase tracking-wider opacity-40 border-b mb-1" style={{ borderColor: liteTheme.border }}>
                                MENU NHANH LITE
                            </div>
                            {menuItems.map(item => (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    onClick={() => setIsOpen(false)}
                                    className="flex items-center gap-3 px-3 py-2 rounded-xl font-black text-xs transition-all hover:bg-black/5 dark:hover:bg-white/5"
                                    style={{ color: liteTheme.text }}
                                >
                                    <span className="text-sm leading-none">{item.icon}</span>
                                    <span className="uppercase tracking-wider">{item.label}</span>
                                </Link>
                            ))}
                            <div className="h-px my-1" style={{ backgroundColor: liteTheme.border }} />
                            <button
                                onClick={() => {
                                    setIsOpen(false);
                                    handleLogout();
                                }}
                                className="flex items-center gap-3 w-full px-3 py-2 rounded-xl font-black text-xs text-red-500 transition-all hover:bg-red-500/10 cursor-pointer"
                            >
                                <span className="text-sm leading-none">🚪</span>
                                <span className="uppercase tracking-wider">Đăng xuất</span>
                            </button>
                        </m.div>
                    </Portal>
                )}
            </AnimatePresence>
        </m.div>
    );
};

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

export default function Layout({ children }) {
    const location = useLocation();
    const isActive = (path) => location.pathname === path;
    const isLiteMode = import.meta.env.VITE_APP_MODE === 'lite';
    const [liteBgColor, setLiteBgColor] = useState(() => localStorage.getItem('pos_lite_bg_color') || "#f4ecd8");
    const liteTheme = useMemo(() => getLiteTheme(liteBgColor), [liteBgColor]);
    const liteMenuContainerRef = useRef(null);

    const activeTabLabel = useMemo(() => {
        if (import.meta.env.VITE_APP_MODE === 'lite') {
            const liteItems = [
                { label: "Tổng quan", path: "/" },
                { label: "Bán hàng", path: "/pos" },
                { label: "Nhập hàng", path: "/purchase" },
                { label: "Lịch sử", path: "/history" },
                { label: "Tổng hợp", path: "/summary" },
            ];
            const active = liteItems.find(item => location.pathname === item.path);
            return active ? active.label : "POSLite";
        }
        
        const items = [
            { label: "Tổng quan", path: "/" },
            { label: "Bán hàng", path: "/pos" },
            { label: "Nhập hàng", path: "/purchase" },
            { label: "Lịch sử", path: "/history" },
            { label: "Sổ Giao Dịch", path: "/summary" },
            { label: "Kiểm kê kho", path: "/inventory" },
            { label: "Xẻ lẻ & Quy đổi", path: "/inventory/conversion" },
            { label: "Tổng Hợp", path: "/analysis" },
            { label: "Báo cáo", path: "/reports" },
            { label: "Báo Cáo Kế Toán", path: "/detailed-reports" },
            { label: "Cấu hình Excel", path: "/accounting/mapping" },
            { label: "Sổ kế toán", path: "/accounting/inventory" },
            { label: "Danh mục", path: "/products" },
            { label: "Đối tác", path: "/partners" },
            { label: "Hồ sơ đối tác", path: "/partner-profile" },
            { label: "Quỹ tiền", path: "/vouchers" },
            { label: "Tài khoản", path: "/banking" },
            { label: "Phân quyền", path: "/roles" },
            { label: "Thiết kế hóa đơn", path: "/invoice-designer" },
            { label: "Chăm sóc & Quà tặng", path: "/customer-care" },
            { label: "Máy tính", path: "/calculator" },
            { label: "Giải trí", path: "/gaming" },
        ];
        
        const active = items.find(item => {
            if (item.path === '/') return location.pathname === '/';
            return location.pathname.startsWith(item.path);
        });
        return active ? active.label : "LyangPOS";
    }, [location.pathname]);

    const activeTabIcon = useMemo(() => {
        if (import.meta.env.VITE_APP_MODE === 'lite') {
            const liteItems = [
                { path: "/", icon: Home },
                { path: "/pos", icon: ShoppingCart },
                { path: "/purchase", icon: Truck },
                { path: "/history", icon: HistoryIcon },
                { path: "/summary", icon: TrendingUp },
            ];
            const active = liteItems.find(item => location.pathname === item.path);
            return active ? active.icon : Home;
        }

        const items = [
            { path: "/", icon: Home },
            { path: "/pos", icon: ShoppingCart },
            { path: "/purchase", icon: Truck },
            { path: "/history", icon: HistoryIcon },
            { path: "/summary", icon: Calendar },
            { path: "/inventory", icon: Warehouse },
            { path: "/inventory/conversion", icon: ArrowLeftRight },
            { path: "/analysis", icon: SprayCan },
            { path: "/reports", icon: LayoutDashboard },
            { path: "/detailed-reports", icon: Download },
            { path: "/accounting/mapping", icon: SettingsIcon },
            { path: "/accounting/inventory", icon: Scale },
            { path: "/products", icon: Sprout },
            { path: "/partners", icon: Droplets },
            { path: "/partner-profile", icon: Users },
            { path: "/vouchers", icon: Coins },
            { path: "/banking", icon: Landmark },
            { path: "/roles", icon: ShieldCheck },
            { path: "/invoice-designer", icon: LayoutTemplate },
            { path: "/customer-care", icon: Package },
            { path: "/calculator", icon: Calculator },
            { path: "/gaming", icon: Gamepad2 },
        ];

        const active = items.find(item => {
            if (item.path === '/') return location.pathname === '/';
            return location.pathname.startsWith(item.path);
        });
        return active ? active.icon : Sprout;
    }, [location.pathname]);

    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
    const [appTheme, setAppTheme] = useState(localStorage.getItem('app_theme') || 'agri');
    const [showUserMenu, setShowUserMenu] = useState(false);
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

    const toggleGpuDisabled = () => {
        const nextVal = !gpuDisabled;
        setGpuDisabled(nextVal);
        localStorage.setItem("pos_gpu_disabled", String(nextVal));
        if (nextVal) {
            document.documentElement.classList.add("gpu-disabled");
        } else {
            document.documentElement.classList.remove("gpu-disabled");
        }
        window.dispatchEvent(new Event("gpu_state_changed"));
    };
    const [avatarUrl, setAvatarUrl] = useState(localStorage.getItem('user_avatar') || '');
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(localStorage.getItem('sidebar_collapsed') === 'true');
    const [isSidebarHidden, setIsSidebarHidden] = useState(localStorage.getItem('sidebar_hidden') === 'true');
    const [accountingEnabled, setAccountingEnabled] = useState(() => {
        if (import.meta.env.VITE_FEATURE_ACCOUNTING_ENABLED === 'false') return false;
        return localStorage.getItem('feature_accounting_enabled') !== 'false';
    });
    const [hiddenNavPaths, setHiddenNavPaths] = useState(() => {
        try {
            const saved = localStorage.getItem('sidebar_hidden_items');
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            return [];
        }
    });

    useEffect(() => {
        const handleSidebarVisibilityChange = () => {
            try {
                const saved = localStorage.getItem('sidebar_hidden_items');
                setHiddenNavPaths(saved ? JSON.parse(saved) : []);
            } catch (e) {
                setHiddenNavPaths([]);
            }
        };
        window.addEventListener('sidebar_visibility_changed', handleSidebarVisibilityChange);
        window.addEventListener('storage', handleSidebarVisibilityChange);
        return () => {
            window.removeEventListener('sidebar_visibility_changed', handleSidebarVisibilityChange);
            window.removeEventListener('storage', handleSidebarVisibilityChange);
        };
    }, []);

    const userMenuRef = useRef(null);
    const navigate = useNavigate();

    const [showQuickSearch, setShowQuickSearch] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const searchInputRef = useRef(null);
    const [searchResults, setSearchResults] = useState({ products: [], partners: [], orders: [] });
    const [searching, setSearching] = useState(false);

    const [globalEditingOrder, setGlobalEditingOrder] = useState(null);

    useEffect(() => {
        if (showQuickSearch && searchInputRef.current) {
            setTimeout(() => {
                searchInputRef.current.focus();
            }, 50);
        } else {
            setSearchQuery("");
            setSearchResults({ products: [], partners: [], orders: [] });
        }
    }, [showQuickSearch]);

    useEffect(() => {
        if (!searchQuery.trim()) {
            setSearchResults({ products: [], partners: [], orders: [] });
            return;
        }

        const delayDebounceFn = setTimeout(async () => {
            setSearching(true);
            try {
                const [prodRes, partRes, ordRes] = await Promise.all([
                    axios.get('/api/products', { params: { search: searchQuery, limit: 5 } }),
                    axios.get('/api/partners', { params: { search: searchQuery, limit: 5 } }),
                    axios.get('/api/orders', { params: { search: searchQuery, limit: 5 } })
                ]);

                setSearchResults({
                    products: prodRes.data?.items || (Array.isArray(prodRes.data) ? prodRes.data : []),
                    partners: partRes.data?.items || (Array.isArray(partRes.data) ? partRes.data : []),
                    orders: ordRes.data?.items || (Array.isArray(ordRes.data) ? ordRes.data : [])
                });
            } catch (err) {
                console.error("Global search error:", err);
            } finally {
                setSearching(false);
            }
        }, 150);

        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery]);

    const handleResultClick = (type, item) => {
        setShowQuickSearch(false);
        if (type === 'product') {
            navigate('/products', { state: { search: item.name } });
        } else if (type === 'partner') {
            navigate('/partners', { state: { search: item.name } });
        } else if (type === 'order') {
            // Fetch complete order details if not fully loaded (like order details array)
            if (!item.details) {
                axios.get(`/api/orders/${item.id}`)
                    .then(res => {
                        setGlobalEditingOrder(res.data);
                    })
                    .catch(err => {
                        console.error("Failed to load order details for editing popup", err);
                        // Fallback
                        setGlobalEditingOrder(item);
                    });
            } else {
                setGlobalEditingOrder(item);
            }
        }
    };

    const sidebarBackground = useMemo(() => {
        if (isLiteMode) {
            return liteTheme.surface;
        }
        return 'transparent';
    }, [isLiteMode, liteTheme]);

    // Click outside handler for user menu
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (showUserMenu && userMenuRef.current && !userMenuRef.current.contains(event.target)) {
                const trigger = event.target.closest('[data-user-trigger="true"]');
                if (!trigger) setShowUserMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showUserMenu]);

    const user = JSON.parse(sessionStorage.getItem('user') || '{}');
    const userRole = (user.role || 'user').toString().trim().toLowerCase();

    const [isMuted, setIsMuted] = useState(() => {
        return localStorage.getItem('pos_notifications_muted') === 'true';
    });

    const [isMirrorModalOpen, setIsMirrorModalOpen] = useState(false);

    // Live POS Terminal Heartbeat Broadcasting
    useEffect(() => {
        let terminalId = localStorage.getItem('pos_terminal_id');
        if (!terminalId) {
            terminalId = `POS-${(window.location.hostname || 'LOCAL').replace(/[^a-zA-Z0-9]/g, '')}-${Math.floor(100 + Math.random() * 900)}`;
            localStorage.setItem('pos_terminal_id', terminalId);
        }
        const terminalName = localStorage.getItem('pos_terminal_name') || `Máy Bán Hàng (${user.full_name || user.username || terminalId})`;

        const broadcastState = async () => {
            try {
                const myTerminalId = localStorage.getItem('pos_terminal_id');
                const myTerminalName = localStorage.getItem('pos_terminal_name') || `POS-${myTerminalId}`;
                if (!myTerminalId || location.pathname.includes('/auth')) return;

                let cart = [];
                const savedCartStr = localStorage.getItem('pos_cart') || sessionStorage.getItem('pos_cart') || localStorage.getItem('mobile_pos_cart');
                if (savedCartStr) {
                    try { cart = JSON.parse(savedCartStr); } catch (e) {}
                }
                if ((!cart || cart.length === 0) && window.__CURRENT_POS_CART__) {
                    cart = window.__CURRENT_POS_CART__;
                }
                const partnerName = localStorage.getItem('pos_partner_name') || window.__CURRENT_POS_PARTNER__ || 'Khách lẻ';

                let partnerObj = null;
                const savedPartnerStr = localStorage.getItem('pos_selected_partner') || sessionStorage.getItem('pos_selected_partner');
                if (savedPartnerStr) {
                    try { partnerObj = JSON.parse(savedPartnerStr); } catch (e) {}
                }
                if (!partnerObj && window.__CURRENT_POS_PARTNER_OBJ__) {
                    partnerObj = window.__CURRENT_POS_PARTNER_OBJ__;
                }

                const paymentMethod = localStorage.getItem('pos_active_payment_method') || window.__CURRENT_POS_PAYMENT_METHOD__ || 'Cash';
                const amountPaid = Number(localStorage.getItem('pos_active_amount_paid') || window.__CURRENT_POS_AMOUNT_PAID__ || 0);
                const cashGiven = Number(localStorage.getItem('pos_active_cash_given') || window.__CURRENT_POS_CASH_GIVEN__ || 0);
                const note = localStorage.getItem('pos_active_note') || window.__CURRENT_POS_NOTE__ || '';

                const totalItems = (cart || []).reduce((acc, i) => acc + (Number(i.quantity) || 1), 0);
                const totalAmount = (cart || []).reduce((acc, i) => acc + (Number(i.quantity) || 1) * Number(i.sale_price || i.price || 0), 0);
                try {
                    const res = await axios.post('/api/pos/terminal-state', {
                        terminal_id: myTerminalId,
                        terminal_name: myTerminalName,
                        user_name: user.full_name || user.username || 'Thu ngân',
                        cart: cart || [],
                        partner: partnerObj,
                        partner_name: partnerName,
                        payment_method: paymentMethod,
                        amount_paid: amountPaid,
                        cash_given: cashGiven,
                        note: note,
                        total_items: totalItems,
                        total_amount: totalAmount,
                        status: 'active',
                        current_page: location.pathname
                    });

                    if (res.data && res.data.status === 'remote_sync') {
                        if (res.data.action) {
                            window.dispatchEvent(new CustomEvent('pos_remote_action', {
                                detail: { action: res.data.action }
                            }));
                        }
                        const rawCart = res.data.cart || [];
                        const newCart = rawCart.map(item => {
                            const fallbackId = Math.random().toString(36).substr(2, 9);
                            return {
                                ...item,
                                cartId: item.cartId || item.id || fallbackId,
                                id: item.id || item.cartId || fallbackId
                            };
                        });
                        const pName = res.data.partner_name || 'Khách lẻ';
                        const pObj = res.data.partner;
                        const pMethod = res.data.payment_method || 'Cash';
                        const aPaid = res.data.amount_paid || 0;
                        const cGiven = res.data.cash_given || 0;
                        const vNote = res.data.note || '';

                        window.__CURRENT_POS_CART__ = newCart;
                        window.__CURRENT_POS_PARTNER__ = pName;
                        window.__CURRENT_POS_PARTNER_OBJ__ = pObj;
                        window.__CURRENT_POS_PAYMENT_METHOD__ = pMethod;
                        window.__CURRENT_POS_AMOUNT_PAID__ = aPaid;
                        window.__CURRENT_POS_CASH_GIVEN__ = cGiven;
                        window.__CURRENT_POS_NOTE__ = vNote;

                        try {
                            localStorage.setItem('pos_cart', JSON.stringify(newCart));
                            localStorage.setItem('pos_partner_name', pName);
                            if (pObj) {
                                localStorage.setItem('pos_selected_partner', JSON.stringify(pObj));
                            } else {
                                localStorage.removeItem('pos_selected_partner');
                            }
                            localStorage.setItem('pos_active_payment_method', pMethod);
                            localStorage.setItem('pos_active_amount_paid', String(aPaid));
                            localStorage.setItem('pos_active_cash_given', String(cGiven));
                            localStorage.setItem('pos_active_note', vNote);
                        } catch (e) {}

                        const activeTabId = Number(localStorage.getItem('pos_active_tab_id') || 1);
                        const savedTabsStr = localStorage.getItem('pos_order_tabs');
                        if (savedTabsStr) {
                            try {
                                const tabs = JSON.parse(savedTabsStr);
                                const updatedTabs = tabs.map(t => {
                                    if (t.id === activeTabId) {
                                        return {
                                            ...t,
                                            cart: newCart,
                                            selectedPartner: pObj,
                                            note: vNote,
                                            amountPaid: aPaid,
                                            cashGiven: cGiven,
                                            paymentMethod: pMethod
                                        };
                                    }
                                    return t;
                                });
                                localStorage.setItem('pos_order_tabs', JSON.stringify(updatedTabs));
                                
                                // Dispatch storage event to trigger update in POSnew.jsx on same tab
                                window.dispatchEvent(new StorageEvent('storage', {
                                    key: 'pos_order_tabs',
                                    newValue: JSON.stringify(updatedTabs)
                                }));
                            } catch (err) {}
                        }

                        // Dispatch custom event just in case
                        window.dispatchEvent(new CustomEvent('pos_cart_updated', {
                            detail: {
                                cart: newCart,
                                partner_name: pName,
                                partner: pObj,
                                payment_method: pMethod,
                                amount_paid: aPaid,
                                cash_given: cGiven,
                                note: vNote
                            }
                        }));
                    }
                } catch (e) {
                    // Heartbeat fail silent
                }
            } catch (outerErr) {
                // Heartbeat outer fail silent
            }
        };

        const handleCartUpdate = (e) => {
            if (e && e.detail) {
                if (e.detail.cart) {
                    window.__CURRENT_POS_CART__ = e.detail.cart;
                    try { localStorage.setItem('pos_cart', JSON.stringify(e.detail.cart)); } catch (err) {}
                }
                if (e.detail.partner_name !== undefined) {
                    window.__CURRENT_POS_PARTNER__ = e.detail.partner_name;
                    try { localStorage.setItem('pos_partner_name', e.detail.partner_name); } catch (err) {}
                }
                if (e.detail.partner !== undefined) {
                    window.__CURRENT_POS_PARTNER_OBJ__ = e.detail.partner;
                    try {
                        if (e.detail.partner) {
                            localStorage.setItem('pos_selected_partner', JSON.stringify(e.detail.partner));
                        } else {
                            localStorage.removeItem('pos_selected_partner');
                        }
                    } catch (err) {}
                }
                if (e.detail.payment_method !== undefined) {
                    window.__CURRENT_POS_PAYMENT_METHOD__ = e.detail.payment_method;
                    try { localStorage.setItem('pos_active_payment_method', e.detail.payment_method); } catch (err) {}
                }
                if (e.detail.amount_paid !== undefined) {
                    window.__CURRENT_POS_AMOUNT_PAID__ = e.detail.amount_paid;
                    try { localStorage.setItem('pos_active_amount_paid', String(e.detail.amount_paid)); } catch (err) {}
                }
                if (e.detail.cash_given !== undefined) {
                    window.__CURRENT_POS_CASH_GIVEN__ = e.detail.cash_given;
                    try { localStorage.setItem('pos_active_cash_given', String(e.detail.cash_given)); } catch (err) {}
                }
                if (e.detail.note !== undefined) {
                    window.__CURRENT_POS_NOTE__ = e.detail.note;
                    try { localStorage.setItem('pos_active_note', e.detail.note || ''); } catch (err) {}
                }
            }
            broadcastState();
        }

        broadcastState();
        const interval = setInterval(broadcastState, 2500);

        window.addEventListener('pos_cart_updated', handleCartUpdate);
        window.addEventListener('storage', broadcastState);

        return () => {
            clearInterval(interval);
            window.removeEventListener('pos_cart_updated', handleCartUpdate);
            window.removeEventListener('storage', broadcastState);
        };
    }, [location.pathname, user]);

    useEffect(() => {
        const channel = new BroadcastChannel('packing_channel');
        channel.onmessage = (event) => {
            if (!event.data) return;
            if (event.data.type === 'NEW_ORDER') {
                const isPosPage = window.location.pathname.toLowerCase().includes('/pos');
                const newItemsCount = (event.data.orders || []).reduce((sum, o) => sum + (o.items ? o.items.length : 0), 0);
                if (!isMuted && !isPosPage && newItemsCount > (window.__PREV_PACKING_ITEMS_COUNT__ || 0)) {
                    playNotificationSound();
                }
                window.__PREV_PACKING_ITEMS_COUNT__ = newItemsCount;
                if (event.data.orders && event.data.orders.length > 0) {
                    const ord = event.data.orders[0];
                    const normCart = (ord.items || []).map(i => ({
                        name: i.name || i.product_name,
                        product_name: i.name || i.product_name,
                        quantity: Number(i.quantity) || 1,
                        unit: i.unit || i.product_unit || 'Cái',
                        price: Number(i.price || i.sale_price) || 0,
                        sale_price: Number(i.price || i.sale_price) || 0,
                        cost_price: Number(i.cost_price || (i.price ? i.price * 0.75 : 0)),
                        secondary_unit: i.secondary_unit || null,
                        multiplier: Number(i.multiplier) || 1,
                        secondary_qty: i.secondary_qty !== undefined ? i.secondary_qty : ((Number(i.quantity) || 1) / (Number(i.multiplier) || 1)),
                        stock: i.stock !== undefined ? i.stock : 999,
                        latest_audit: i.latest_audit || null,
                        latest_stock_entry: i.latest_stock_entry || null,
                        is_combo: i.is_combo || false,
                        active_ingredient: i.active_ingredient || null,
                        isPacked: i.isPacked || false,
                        cartId: i.cartId || null,
                        product_id: i.product_id || i.id
                    }));
                    const partnerName = ord.customer_name || 'Khách lẻ';
                    window.__CURRENT_POS_CART__ = normCart;
                    window.__CURRENT_POS_PARTNER__ = partnerName;
                    try {
                        localStorage.setItem('pos_cart', JSON.stringify(normCart));
                        localStorage.setItem('pos_partner_name', partnerName);
                    } catch (e) {}
                    window.dispatchEvent(new CustomEvent('pos_cart_updated', {
                        detail: { cart: normCart, partner_name: partnerName }
                    }));
                }
            } else if (event.data.type === 'CLEAR') {
                window.__CURRENT_POS_CART__ = [];
                try { localStorage.setItem('pos_cart', '[]'); } catch (e) {}
                window.dispatchEvent(new CustomEvent('pos_cart_updated', {
                    detail: { cart: [], partner_name: 'Khách lẻ' }
                }));
            }
        };
        return () => channel.close();
    }, [isMuted]);

    const executeThemeTransition = (updateFn) => {
        if (!document.startViewTransition) {
            updateFn();
            return;
        }
        document.startViewTransition(() => {
            updateFn();
        });
    };

    const toggleTheme = () => {
        executeThemeTransition(() => {
            setTheme(prev => prev === 'light' ? 'dark' : 'light');
        });
    };

    const toggleMute = () => {
        setIsMuted(prev => {
            const newState = !prev;
            localStorage.setItem('pos_notifications_muted', newState);
            return newState;
        });
    };

    const MENU_ITEMS = useMemo(() => {
        if (import.meta.env.VITE_APP_MODE === 'lite') {
            const liteItems = [
                { icon: Home, label: "Tổng quan Lite", path: "/", roles: ['admin', 'accountant', 'user'] },
                { icon: ShoppingCart, label: "Bán hàng Lite", path: "/pos", roles: ['admin', 'accountant', 'user'] },
                { icon: Truck, label: "Nhập hàng Lite", path: "/purchase", roles: ['admin', 'accountant', 'user'] },
                { icon: HistoryIcon, label: "Lịch sử Lite", path: "/history", roles: ['admin', 'accountant', 'user'] },
                { icon: TrendingUp, label: "Tổng hợp Lite", path: "/summary", roles: ['admin', 'accountant', 'user'] },
            ];
            return liteItems.filter(item => !hiddenNavPaths.includes(item.path));
        }

        const items = [
            { icon: Home, label: "Tổng quan", path: "/", roles: ['admin'] },
            { icon: ShoppingCart, label: "Bán hàng (POS)", path: "/pos", roles: ['admin', 'accountant', 'user'] },
            {
                label: "Giao dịch",
                icon: ShoppingBag,
                roles: ['admin', 'accountant', 'user'],
                children: [
                    { icon: Truck, label: "Nhập hàng", path: "/purchase", roles: ['admin', 'accountant', 'user'] },
                    { icon: HistoryIcon, label: "Lịch sử", path: "/history", roles: ['admin', 'accountant', 'user'] },
                    { icon: Calendar, label: "Sổ Giao Dịch", path: "/summary", roles: ['admin', 'accountant', 'user'] },
                    { icon: Warehouse, label: "KIỂM KÊ KHO", path: "/inventory", roles: ['admin', 'accountant', 'user'] },
                    { icon: ArrowLeftRight, label: "Xẻ lẻ & Quy đổi", path: "/inventory/conversion", roles: ['admin', 'accountant', 'user'] },
                ]
            },
            {
                label: "Báo cáo",
                icon: FileText,
                roles: ['admin'],
                children: [
                    { icon: TrendingUp, label: "Tổng Hợp", path: "/analysis", roles: ['admin'] },
                    { icon: FileText, label: "Báo cáo", path: "/reports", roles: ['admin'] },
                ]
            },
            {
                label: "Kế toán",
                icon: Scale,
                roles: ['admin', 'accountant', 'user'],
                children: [
                    { icon: Download, label: "Xuất Báo Cáo Kế Toán", path: "/detailed-reports", roles: ['admin', 'accountant', 'user'] },
                    { icon: SettingsIcon, label: "Cấu hình Mẫu Excel", path: "/accounting/mapping", roles: ['admin', 'accountant', 'user'] },
                    { icon: Scale, label: "Sổ kế toán", path: "/accounting/inventory", roles: ['admin', 'accountant', 'user'] },
                ]
            },
            {
                label: "Quản lý",
                icon: SettingsIcon,
                roles: ['admin', 'accountant', 'user'],
                children: [
                    { icon: Package, label: "Danh mục", path: "/products", roles: ['admin', 'accountant', 'user'] },
                    { icon: Users, label: "Đối tác", path: "/partners", roles: ['admin', 'accountant', 'user'] },
                    { icon: Users, label: "Hồ sơ đối tác", path: "/partner-profile", roles: ['admin', 'accountant', 'user'] },
                    { icon: Coins, label: "Quỹ tiền", path: "/vouchers", roles: ['admin', 'accountant', 'user'] },
                    { icon: Landmark, label: "Tài khoản", path: "/banking", roles: ['admin', 'accountant', 'user'] },
                    { icon: ShieldCheck, label: "Phân quyền", path: "/roles", roles: ['admin', 'accountant', 'user'] },
                    { icon: LayoutTemplate, label: "Thiết kế hóa đơn", path: "/invoice-designer", roles: ['admin', 'accountant', 'user'] },
                    { icon: Package, label: "Chăm sóc & Quà tặng", path: "/customer-care", roles: ['admin', 'accountant', 'user'] },
                ]
            },
            { icon: Calculator, label: "Máy tính", path: "/calculator", roles: ['admin', 'accountant', 'user'] },
            { icon: Gamepad2, label: "Giải trí", path: "/gaming", roles: ['admin', 'accountant', 'user'] },
            { icon: QrCode, label: "In Mã Vạch", path: "/barcodes", roles: ['admin', 'accountant', 'user'] },
        ];

        // Deep filter items based on user role and hidden paths
        return items
            .filter(item => {
                if (item.label === "Kế toán" && !accountingEnabled) return false;
                if (item.path && hiddenNavPaths.includes(item.path)) return false;
                if (!item.roles) return true;
                if (item.roles.includes('admin') && checkIsAdmin(userRole)) return true;
                return item.roles.includes(userRole);
            })
            .map(item => {
                if (item.children) {
                    return {
                        ...item,
                        children: item.children.filter(child => {
                            if (hiddenNavPaths.includes(child.path)) return false;
                            if (!child.roles) return true;
                            if (child.roles.includes('admin') && checkIsAdmin(userRole)) return true;
                            return child.roles.includes(userRole);
                        })
                    };
                }
                return item;
            })
            .filter(item => !item.children || item.children.length > 0);
    }, [userRole, accountingEnabled, hiddenNavPaths]);

    const flatPaths = useMemo(() => {
        const paths = [];
        MENU_ITEMS.forEach(item => {
            if (item.path) paths.push(item.path);
            if (item.children) {
                item.children.forEach(child => {
                    if (child.path) paths.push(child.path);
                });
            }
        });
        return paths;
    }, [MENU_ITEMS]);

    useEffect(() => {
        const handleGlobalShortcut = (e) => {
            if (e.key === 'Escape') {
                setShowUserMenu(false);
                setShowQuickSearch(false);
            }
            // Navigation Shortcuts (Ctrl + Key)
            if (e.ctrlKey) {
                const key = e.key.toLowerCase();
                if (['g', 'f', 'k'].includes(key)) {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowQuickSearch(prev => !prev);
                    return;
                }
                if (['p', 'd', 'h', 'i'].includes(key)) {
                    e.preventDefault();
                    e.stopPropagation();
                    if (key === 'p') navigate('/pos');
                    if (key === 'd') navigate('/');
                    if (key === 'h') navigate('/history');
                    if (key === 'i') navigate('/inventory');
                }
            }

            // Only trigger for Ctrl + PageUp/Down
            if (e.ctrlKey && (e.key === 'PageUp' || e.key === 'PageDown')) {
                // If the user is typing in an input field, we SHOULD still switch tabs?
                // Browser behavior: switching tabs works even if focused in input.
                // However, we must prevent default so we don't scroll.

                // Ignore if it's some special input or if we are in POS where PageUp/Down might mean something else?
                // No, POS shortcuts use F1-F12.

                e.preventDefault();
                e.stopPropagation();

                const currentPath = location.pathname;
                let currentIndex = flatPaths.findIndex(p => p === currentPath);

                // If not found, try to find a sub-path match (e.g. /partner-profile/123 -> /partner-profile)
                if (currentIndex === -1) {
                    currentIndex = flatPaths.findIndex(p => p !== '/' && currentPath.startsWith(p));
                }

                if (currentIndex === -1) currentIndex = 0;

                let nextIndex;
                if (e.key === 'PageUp') {
                    nextIndex = currentIndex <= 0 ? flatPaths.length - 1 : currentIndex - 1;
                } else {
                    nextIndex = currentIndex >= flatPaths.length - 1 ? 0 : currentIndex + 1;
                }

                if (flatPaths[nextIndex]) {
                    navigate(flatPaths[nextIndex]);
                }
            }
        };

        window.addEventListener('keydown', handleGlobalShortcut, true);
        return () => window.removeEventListener('keydown', handleGlobalShortcut, true);
    }, [flatPaths, location.pathname, navigate]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
                setShowUserMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        localStorage.setItem('theme', theme);
    }, [theme]);

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', appTheme);
        localStorage.setItem('app_theme', appTheme);
    }, [appTheme]);

    useEffect(() => {
        localStorage.setItem('sidebar_collapsed', isSidebarCollapsed);
    }, [isSidebarCollapsed]);

    useEffect(() => {
        localStorage.setItem('sidebar_hidden', isSidebarHidden);
    }, [isSidebarHidden]);

    useEffect(() => {
        const handleStorage = () => {
            setAccountingEnabled(localStorage.getItem('feature_accounting_enabled') !== 'false');
            setLiteBgColor(localStorage.getItem('pos_lite_bg_color') || '#f4ecd8');
        };
        window.addEventListener('storage', handleStorage);
        const interval = setInterval(() => {
            const current = localStorage.getItem('pos_lite_bg_color') || '#f4ecd8';
            if (current !== liteBgColor) {
                setLiteBgColor(current);
            }
        }, 1000);
        return () => {
            window.removeEventListener('storage', handleStorage);
            clearInterval(interval);
        };
    }, [liteBgColor]);

    useEffect(() => {
        const fetchGlobalSettings = async () => {
            try {
                const res = await axios.get('/api/settings');
                if (res.data) {
                    if (res.data.user_avatar) {
                        localStorage.setItem('user_avatar', res.data.user_avatar);
                    }
                    if (res.data.ram_cleanup_auto_enabled !== undefined) {
                        localStorage.setItem('ram_cleanup_auto_enabled', res.data.ram_cleanup_auto_enabled);
                    }
                    if (res.data.ram_cleanup_interval_minutes !== undefined) {
                        localStorage.setItem('ram_cleanup_interval_minutes', res.data.ram_cleanup_interval_minutes);
                    }
                }
            } catch (err) {
                console.error("Failed to fetch settings in Layout", err);
            }
        };
        fetchGlobalSettings();
    }, []);

    // Automatic RAM cleanup background timer
    useEffect(() => {
        let intervalId;
        const checkAndCleanRam = async () => {
            const autoEnabled = localStorage.getItem('ram_cleanup_auto_enabled') || 'false';
            if (autoEnabled !== 'true') return;
            
            const intervalMin = parseInt(localStorage.getItem('ram_cleanup_interval_minutes') || '10', 10);
            const intervalMs = intervalMin * 60 * 1000;
            
            const lastCleanStr = localStorage.getItem('last_ram_cleanup_timestamp');
            const now = Date.now();
            
            if (!lastCleanStr || (now - parseInt(lastCleanStr, 10) >= intervalMs)) {
                console.log("[Memory Cleanup] Running scheduled RAM cleanup...");
                try {
                    // Call backend clean ram
                    await axios.post('/api/clean-ram');
                    
                    // Call Tauri clean ram
                    if (window.__TAURI__ && window.__TAURI__.core) {
                        try {
                            await window.__TAURI__.core.invoke('clean_app_ram');
                        } catch (tErr) {
                            console.error("[Memory Cleanup] Tauri RAM clean failed:", tErr);
                        }
                    }
                    
                    localStorage.setItem('last_ram_cleanup_timestamp', String(now));
                    console.log("[Memory Cleanup] RAM cleanup completed successfully.");
                } catch (err) {
                    console.error("[Memory Cleanup] Failed to run automatic RAM cleanup:", err);
                }
            }
        };

        // Run check on mount
        checkAndCleanRam();
        
        // Then check every 60 seconds
        intervalId = setInterval(checkAndCleanRam, 60 * 1000);
        
        return () => {
            if (intervalId) clearInterval(intervalId);
        };
    }, []);

    useEffect(() => {
        const checkUpdates = () => {
            const url = localStorage.getItem('user_avatar');
            if (url !== avatarUrl) setAvatarUrl(url || '');
        };
        const interval = setInterval(checkUpdates, 2000);
        return () => clearInterval(interval);
    }, [avatarUrl]);

    const handleLogout = () => {
        localStorage.removeItem('user');
        sessionStorage.removeItem('user');
        navigate('/welcome');
    };

    return (
        <div 
            style={isLiteMode ? { backgroundColor: liteTheme.bg } : {}}
            className="flex h-screen w-full main-content-bg overflow-hidden transition-colors selection:bg-emerald-100 dark:selection:bg-emerald-900/40"
        >
            <ContextMenu />

            {isLiteMode && !['/pos', '/poslite', '/purchase'].includes(location.pathname) && (
                <div ref={liteMenuContainerRef} className="fixed inset-0 pointer-events-none z-[9999] no-print">
                    <FloatingLiteMenu liteTheme={liteTheme} navigate={navigate} containerRef={liteMenuContainerRef} />
                </div>
            )}

            {/* Overlay Backdrop for expanded Sidebar */}
            <AnimatePresence>
                {!isLiteMode && !isSidebarHidden && !isSidebarCollapsed && (
                    <m.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsSidebarCollapsed(true)}
                        className="fixed inset-0 bg-black/5 dark:bg-black/40 backdrop-blur-md z-[990] print:hidden cursor-pointer"
                    />
                )}
            </AnimatePresence>

            {/* Elegant Left Sidebar (Overlay style) */}
            {!isLiteMode && (
                <m.aside
                    initial={false}
                    animate={{
                        width: isSidebarHidden ? 0 : (isSidebarCollapsed ? 80 : 280),
                        x: isSidebarHidden ? -280 : 0,
                        opacity: isSidebarHidden ? 0 : 1
                     }}
                     style={{
                         background: sidebarBackground,
                     }}
                     transition={{ type: "spring", stiffness: 250, damping: 30, mass: 0.6 }}
                     className="absolute top-0 left-0 bottom-0 h-full flex flex-col border-r border-slate-200/10 dark:border-white/5 z-[1000] print:hidden overflow-visible shrink-0 pt-4 bg-transparent"
                 >

            {/* Active Tab Logo Icon Container */}
            <div className="h-16 flex items-center justify-center border-b border-slate-200/10 dark:border-white/5 shrink-0 px-4 mb-2 relative">
                <m.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="w-14 h-14 flex items-center justify-center cursor-pointer transition-transform"
                >
                    <img 
                        src="/logo.png" 
                        alt="Logo" 
                        draggable="false"
                        className="w-14 h-14 object-contain select-none pointer-events-none" 
                    />
                </m.div>

                {/* User Dropdown positioning relative to top logo container */}
                <AnimatePresence>
                    {showUserMenu && (
                        <m.div
                            ref={userMenuRef}
                            initial={{ opacity: 0, scale: 0.9, x: 10 }}
                            animate={{ opacity: 1, scale: 1, x: 0 }}
                            exit={{ opacity: 0, scale: 0.9, x: 10 }}
                            style={isLiteMode ? {
                                backgroundColor: liteTheme.surface,
                                borderColor: liteTheme.border,
                                color: liteTheme.text
                            } : {}}
                            className={cn(
                                "absolute top-2 left-[calc(100%+12px)] w-64 backdrop-blur-2xl rounded-2xl shadow-xl shadow-black/10 p-2 z-[1100]",
                                isLiteMode ? "border" : "bg-transparent border-2 border-[#2d5016]/10 dark:border-white/10"
                            )}
                        >
                            {checkIsAdmin(userRole) && !isLiteMode && (
                                <>
                                    <Link to="/settings" onClick={() => setShowUserMenu(false)} className="flex items-center gap-3 p-3 rounded-xl hover:bg-[#2d5016]/5 dark:hover:bg-white/5 text-[#2d5016] dark:text-white font-black text-sm transition-colors">
                                        <SettingsIcon size={18} />
                                        <span>Cài đặt hệ thống</span>
                                    </Link>
                                </>
                            )}
                            <button
                                onClick={() => {
                                    sessionStorage.removeItem('user');
                                    navigate('/welcome');
                                    setShowUserMenu(false);
                                }}
                                style={isLiteMode ? { color: liteTheme.text } : {}}
                                className={cn(
                                    "flex items-center gap-3 w-full p-3 rounded-xl font-black text-sm transition-colors",
                                    isLiteMode ? "hover:bg-black/5 dark:hover:bg-white/5" : "hover:bg-[#2d5016]/5 dark:hover:bg-white/5 text-gray-700 dark:text-emerald-100/60"
                                )}
                            >
                                <LogOut size={18} className="text-gray-500" />
                                <span>Đăng xuất</span>
                            </button>
                            {!isLiteMode && (
                                <>
                                    <div className="h-px bg-[#2d5016]/10 dark:bg-white/5 my-1" />
                                    <button
                                        onClick={() => {
                                            if (window.confirm('Bạn có chắc chắn muốn thoát ứng dụng và TẮT SERVER không?')) {
                                                axios.post('/api/shutdown').catch(() => { });
                                                setTimeout(() => window.close(), 500);
                                            }
                                        }}
                                        className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-rose-500/10 text-rose-600 dark:text-red-400 font-black text-sm transition-colors"
                                    >
                                        <Power size={18} />
                                        <span>Thoát ứng dụng</span>
                                    </button>
                                </>
                            )}
                        </m.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Search Trigger Button */}
            <div className="px-3 mb-2 shrink-0">
                <button
                    onClick={() => setShowQuickSearch(true)}
                    className={cn(
                        "w-full flex items-center gap-3 transition-all hover:bg-black/5 dark:hover:bg-white/5 border border-transparent hover:border-slate-200/10 dark:hover:border-white/5",
                        isSidebarCollapsed ? "h-12 justify-center p-0 rounded-xl mx-auto" : "px-4 py-3 rounded-2xl bg-slate-100/50 dark:bg-slate-900/30"
                    )}
                >
                    <Search size={18} className="text-emerald-500 dark:text-emerald-400 shrink-0" />
                    {!isSidebarCollapsed && (
                        <div className="flex-1 flex items-center justify-between min-w-0">
                            <span className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">Tìm kiếm nhanh</span>
                            <span className="text-[9px] bg-slate-200/50 dark:bg-white/10 px-1.5 py-0.5 rounded text-slate-500 font-bold shrink-0">Ctrl+G</span>
                        </div>
                    )}
                </button>
            </div>

            {/* Navigation Scroll Area */}
            <div className="flex-1 overflow-y-auto no-scrollbar py-4">
                {MENU_ITEMS.map((item) => (
                    item.children ? (
                        <NavGroup
                            key={item.label}
                            item={item}
                            isActive={isActive}
                            isCollapsed={isSidebarCollapsed}
                            liteTheme={isLiteMode ? liteTheme : null}
                        />
                    ) : (
                        <NavItemMemo
                            key={item.path}
                            icon={item.icon}
                            label={item.label}
                            path={item.path}
                            active={isActive(item.path)}
                            isCollapsed={isSidebarCollapsed}
                            liteTheme={isLiteMode ? liteTheme : null}
                        />
                    )
                ))}
            </div>

            {/* Bottom Actions Cluster */}
            <div 
                className={cn(
                    "mb-3 rounded-3xl border backdrop-blur-xl shadow-sm transition-all duration-300",
                    isSidebarCollapsed ? "mx-auto w-12 rounded-full p-1.5 space-y-1.5" : "mx-3 space-y-2 rounded-3xl p-2",
                    "bg-black/[0.03] dark:bg-white/[0.04] border-[#8b6f47]/20 dark:border-white/10"
                )} 
                style={isLiteMode ? { borderColor: liteTheme.border, backgroundColor: liteTheme.cardBg } : {}}
            >

                {/* Footer Actions (Volume, Theme, Close) */}
                <m.div layout className={cn(
                    "grid justify-items-center transition-all duration-200",
                    isSidebarCollapsed ? "grid-cols-1 gap-1.5" : "grid-cols-3 gap-2"
                )}>
                    <m.button
                        layout
                        whileTap={{ scale: 0.9 }}
                        onClick={toggleMute}
                        style={isLiteMode ? {
                            backgroundColor: isMuted ? "rgba(239, 68, 68, 0.12)" : "rgba(16, 185, 129, 0.12)",
                            color: isMuted ? "rgb(239, 68, 68)" : liteTheme.accent
                        } : {}}
                        className={cn(
                            "rounded-full transition-colors duration-200 flex flex-col items-center justify-center gap-1 bg-transparent hover:bg-black/5 dark:hover:bg-white/10 shrink-0 shadow-none",
                            isSidebarCollapsed ? "w-10 h-10" : "w-12 h-12",
                            isLiteMode ? "" : (isMuted ? "text-rose-500 hover:text-rose-600" : "text-primary dark:text-[#d4a574] hover:opacity-80")
                        )}
                        title={isMuted ? "Bật loa thông báo" : "Tắt loa thông báo"}
                    >
                        {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                        <AnimatePresence>
                            {!isSidebarCollapsed && (
                                <m.span
                                    initial={{ opacity: 0, height: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, height: 'auto', scale: 1 }}
                                    exit={{ opacity: 0, height: 0, scale: 0.8 }}
                                    transition={{ duration: 0.15 }}
                                    className={cn(
                                        "text-[7px] font-black uppercase tracking-widest leading-none overflow-hidden",
                                        isLiteMode ? (isMuted ? "text-rose-600" : "text-emerald-700") : (isMuted ? "text-rose-500" : "text-primary dark:text-[#d4a574]")
                                    )}
                                >
                                    {isMuted ? "Tắt" : "Bật"}
                                </m.span>
                            )}
                        </AnimatePresence>
                    </m.button>

                    <m.button
                        layout
                        whileTap={{ scale: 0.9 }}
                        onClick={toggleTheme}
                        className={cn(
                            "rounded-full hover:bg-black/5 bg-transparent dark:hover:bg-white/10 text-primary dark:text-[#d4a574] hover:opacity-80 transition-colors duration-200 flex flex-col items-center justify-center gap-1 shadow-none shrink-0",
                            isSidebarCollapsed ? "w-10 h-10" : "w-12 h-12"
                        )}
                        title="Sáng/Tối"
                    >
                        {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
                        <AnimatePresence>
                            {!isSidebarCollapsed && (
                                <m.span
                                    initial={{ opacity: 0, height: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, height: 'auto', scale: 1 }}
                                    exit={{ opacity: 0, height: 0, scale: 0.8 }}
                                    transition={{ duration: 0.15 }}
                                    className="text-[7px] font-black uppercase tracking-widest leading-none overflow-hidden text-primary/80 dark:text-[#d4a574]/80"
                                >
                                    Phông
                                </m.span>
                            )}
                        </AnimatePresence>
                    </m.button>

                    <m.button
                        layout
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setIsSidebarHidden(true)}
                        style={isLiteMode ? {
                            backgroundColor: "rgba(239, 68, 68, 0.12)",
                            color: "rgb(239, 68, 68)"
                        } : {}}
                        className={cn(
                            "rounded-full transition-colors duration-200 flex flex-col items-center justify-center gap-1 bg-transparent hover:bg-rose-500/10 dark:hover:bg-rose-500/20 shrink-0 shadow-none text-rose-500 hover:text-rose-600",
                            isSidebarCollapsed ? "w-10 h-10" : "w-12 h-12"
                        )}
                        title="Đóng menu"
                    >
                        <X size={16} strokeWidth={3} />
                        <AnimatePresence>
                            {!isSidebarCollapsed && (
                                <m.span
                                    initial={{ opacity: 0, height: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, height: 'auto', scale: 1 }}
                                    exit={{ opacity: 0, height: 0, scale: 0.8 }}
                                    transition={{ duration: 0.15 }}
                                    className="text-[7px] font-black uppercase tracking-widest leading-none overflow-hidden text-rose-500"
                                >
                                    Đóng
                                </m.span>
                            )}
                        </AnimatePresence>
                    </m.button>
                </m.div>

                {/* Toggle Button */}
                <m.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                    style={isLiteMode ? {
                        backgroundColor: liteTheme.inputBg,
                        color: liteTheme.text
                    } : {}}
                    className={cn(
                        "w-full rounded-2xl transition-all flex items-center justify-center gap-3 hover:bg-black/5 dark:hover:bg-white/5",
                        isSidebarCollapsed ? "py-2 min-h-[36px]" : "py-3 min-h-[44px]",
                        isLiteMode ? "" : "text-primary dark:text-[#d4a574] hover:opacity-80"
                    )}
                >
                    {isSidebarCollapsed ? <ChevronRight size={18} /> : (
                        <>
                            <ChevronLeft size={16} />
                            <span className="text-[10px] font-black uppercase tracking-[0.3em]">Thu gọn menu</span>
                        </>
                    )}
                </m.button>
            </div>


            </m.aside>
        )}

            {/* Content Area - Fixed Flex for Sidebar */}
            <div 
                style={isLiteMode ? {} : { paddingLeft: isSidebarHidden ? 0 : 80 }}
                className="flex-1 flex flex-col min-h-0 overflow-hidden relative transition-[padding-left] duration-300"
            >
                {/* Grab Handle for Hidden Sidebar */}
                {!isLiteMode && (
                    <AnimatePresence>
                        {isSidebarHidden && (
                            <m.div
                                initial={{ x: -40, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                exit={{ x: -40, opacity: 0 }}
                                className="fixed left-0 top-1/2 -translate-y-1/2 z-[1100] print:hidden"
                            >
                                <m.button
                                    whileHover={{ x: 6, scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => setIsSidebarHidden(false)}
                                    className="group relative flex flex-col items-center gap-4 py-8 px-2.5 bg-[#faf8f3]/85 dark:bg-slate-950/60 backdrop-blur-xl text-primary dark:text-emerald-400 rounded-r-3xl shadow-[8px_0_32px_rgba(0,0,0,0.08)] border border-primary/10 dark:border-emerald-500/10 border-l-0 overflow-hidden transition-all duration-300 hover:border-primary/25 dark:hover:border-emerald-500/35"
                                >
                                    {/* Hover reflection overlay */}
                                    <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                    <div className="flex flex-col items-center gap-1.5 mb-2 relative z-10">
                                        <div className="w-1.5 h-1.5 rounded-full bg-primary dark:bg-emerald-400" />
                                        <div className="w-0.5 h-6 bg-primary/20 dark:bg-emerald-400/25 rounded-full" />
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-[0.5em] [writing-mode:vertical-lr] rotate-180 text-primary/75 dark:text-emerald-400/75 group-hover:text-primary dark:group-hover:text-emerald-300 transition-colors duration-300 relative z-10">HIỆN MENU</span>
                                    <ChevronRight size={16} className="mt-2 text-primary dark:text-emerald-400 group-hover:translate-x-1 transition-all duration-300 relative z-10" />
                                </m.button>
                            </m.div>
                        )}
                    </AnimatePresence>
                )}

            <m.main
                id="main-content"
                className="flex-1 min-w-0 h-full overflow-hidden flex flex-col relative z-0 print:overflow-visible print:static selection:bg-primary/10"
            >
                <div className="flex-1 overflow-auto relative">
                    {children}
                </div>
            </m.main>
            </div>

            {/* Spotlight Search Overlay */}
            <AnimatePresence>
                {showQuickSearch && (
                    <Portal>
                        <div 
                            onClick={(e) => {
                                if (e.target === e.currentTarget) {
                                    setShowQuickSearch(false);
                                }
                            }}
                            className="fixed inset-0 bg-black/60 backdrop-blur-md z-[99999] flex items-start justify-center pt-[15vh] px-4 select-none cursor-pointer"
                        >
                            <m.div
                                initial={{ opacity: 0, scale: 0.95, y: -20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: -20 }}
                                transition={{ type: "spring", stiffness: 350, damping: 25 }}
                                className="w-full max-w-2xl bg-slate-900/90 dark:bg-slate-950/90 border border-emerald-500/30 rounded-[2.5rem] shadow-[0_0_50px_rgba(16,185,129,0.15)] overflow-hidden flex flex-col cursor-default"
                            >
                                {/* Input Container */}
                                <div className="flex items-center gap-4 px-6 py-5 border-b border-white/10 bg-slate-950/50">
                                    <Search className="text-emerald-400 shrink-0" size={24} />
                                    <input
                                        ref={searchInputRef}
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Tìm kiếm sản phẩm, đối tác, hóa đơn hoặc điều hướng nhanh..."
                                        className="flex-1 bg-transparent text-white placeholder-slate-400 text-lg border-none outline-none focus:ring-0 focus:outline-none"
                                    />
                                    <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 px-2.5 py-1 rounded-xl text-[10px] font-black text-slate-400 uppercase tracking-widest shrink-0">
                                        <span>ESC</span>
                                        <span>ĐÓNG</span>
                                    </div>
                                </div>

                                {/* Results / Shortcuts */}
                                <div className="p-6 max-h-[60vh] overflow-y-auto no-scrollbar space-y-6">
                                    {searching && (
                                        <div className="flex flex-col items-center justify-center py-8 gap-3">
                                            <div className="w-6 h-6 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Đang tìm kiếm...</span>
                                        </div>
                                    )}

                                    {!searching && !searchQuery.trim() && (
                                        <div>
                                            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-400/80 mb-3">Liên kết nhanh</h4>
                                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                                {[
                                                    { label: "Bán hàng", path: "/pos", desc: "Ctrl+P", icon: ShoppingCart },
                                                    { label: "Nhập hàng", path: "/purchase", desc: "Quản lý mua hàng", icon: Truck },
                                                    { label: "Lịch sử", path: "/history", desc: "Ctrl+H", icon: HistoryIcon },
                                                    { label: "Danh mục", path: "/products", desc: "Sản phẩm", icon: Sprout },
                                                    { label: "Đối tác", path: "/partners", desc: "Khách hàng & NCC", icon: Droplets },
                                                    { label: "Giải trí", path: "/gaming", desc: "Game giải trí", icon: Gamepad2 },
                                                ].map((item, idx) => (
                                                    <button
                                                        key={idx}
                                                        type="button"
                                                        onClick={() => {
                                                            setShowQuickSearch(false);
                                                            navigate(item.path);
                                                        }}
                                                        className="flex flex-col p-4 rounded-2xl bg-white/5 hover:bg-emerald-500/10 border border-white/5 hover:border-emerald-500/20 text-left text-white transition-all text-sm group cursor-pointer"
                                                    >
                                                        <item.icon size={18} className="text-emerald-400 mb-2 group-hover:scale-110 transition-transform" />
                                                        <span className="font-black uppercase tracking-wider text-xs">{item.label}</span>
                                                        <span className="text-[10px] text-slate-400 mt-1">{item.desc}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {!searching && searchQuery.trim() && searchResults.products.length === 0 && searchResults.partners.length === 0 && searchResults.orders.length === 0 && (
                                        <div className="text-center py-12">
                                            <p className="text-slate-400 text-sm">Không tìm thấy kết quả phù hợp cho "{searchQuery}"</p>
                                        </div>
                                    )}

                                    {!searching && searchQuery.trim() && (
                                        <div className="space-y-6">
                                            {/* Products Section */}
                                            {searchResults.products.length > 0 && (
                                                <div>
                                                    <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-400/80 mb-3">Sản phẩm ({searchResults.products.length})</h4>
                                                    <div className="space-y-1.5">
                                                        {searchResults.products.map(prod => (
                                                            <button
                                                                key={prod.id}
                                                                onClick={() => handleResultClick('product', prod)}
                                                                className="w-full flex items-center justify-between p-3 rounded-2xl bg-white/5 hover:bg-emerald-500/10 border border-white/5 hover:border-emerald-500/25 text-left transition-all text-white group cursor-pointer"
                                                            >
                                                                <div className="flex items-center gap-3 min-w-0">
                                                                    <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 shrink-0">
                                                                        <Sprout size={18} />
                                                                    </div>
                                                                    <div className="min-w-0">
                                                                        <p className="text-xs font-black uppercase tracking-wider truncate">{prod.name}</p>
                                                                        <p className="text-[10px] text-slate-400 mt-0.5">
                                                                            Mã: {prod.sku || prod.barcode || 'N/A'} | Tồn kho: {prod.stock} {prod.unit || 'cái'}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                                <div className="text-right shrink-0 flex items-center gap-3">
                                                                    <p className="text-xs font-bold text-emerald-400">{(prod.sale_price || 0).toLocaleString('vi-VN')}đ</p>
                                                                    <ArrowRight size={14} className="text-slate-500 group-hover:translate-x-1 group-hover:text-emerald-400 transition-all" />
                                                                </div>
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Partners Section */}
                                            {searchResults.partners.length > 0 && (
                                                <div>
                                                    <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-400/80 mb-3">Đối tác & Khách hàng ({searchResults.partners.length})</h4>
                                                    <div className="space-y-1.5">
                                                        {searchResults.partners.map(part => (
                                                            <button
                                                                key={part.id}
                                                                onClick={() => handleResultClick('partner', part)}
                                                                className="w-full flex items-center justify-between p-3 rounded-2xl bg-white/5 hover:bg-emerald-500/10 border border-white/5 hover:border-emerald-500/25 text-left transition-all text-white group cursor-pointer"
                                                            >
                                                                <div className="flex items-center gap-3 min-w-0">
                                                                    <div className="w-9 h-9 rounded-xl bg-sky-500/10 flex items-center justify-center text-sky-400 shrink-0">
                                                                        <Users size={18} />
                                                                    </div>
                                                                    <div className="min-w-0">
                                                                        <p className="text-xs font-black uppercase tracking-wider truncate">{part.name}</p>
                                                                        <p className="text-[10px] text-slate-400 mt-0.5">
                                                                            SĐT: {part.phone || 'N/A'} | Nhóm: {part.is_customer ? 'Khách hàng' : 'Nhà cung cấp'}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                                <div className="text-right shrink-0 flex items-center gap-3">
                                                                    <p className="text-xs font-bold text-sky-400">
                                                                        Nợ: {(part.debt || 0).toLocaleString('vi-VN')}đ
                                                                    </p>
                                                                    <ArrowRight size={14} className="text-slate-500 group-hover:translate-x-1 group-hover:text-emerald-400 transition-all" />
                                                                </div>
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Orders Section */}
                                            {searchResults.orders.length > 0 && (
                                                <div>
                                                    <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-400/80 mb-3">Hóa đơn & Giao dịch ({searchResults.orders.length})</h4>
                                                    <div className="space-y-1.5">
                                                        {searchResults.orders.map(order => (
                                                            <button
                                                                key={order.id}
                                                                onClick={() => handleResultClick('order', order)}
                                                                className="w-full flex items-center justify-between p-3 rounded-2xl bg-white/5 hover:bg-emerald-500/10 border border-white/5 hover:border-emerald-500/25 text-left transition-all text-white group cursor-pointer"
                                                            >
                                                                <div className="flex items-center gap-3 min-w-0">
                                                                    <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400 shrink-0">
                                                                        <FileText size={18} />
                                                                    </div>
                                                                    <div className="min-w-0">
                                                                        <p className="text-xs font-black uppercase tracking-wider truncate">
                                                                            Đơn #{order.order_id || order.id}
                                                                        </p>
                                                                        <p className="text-[10px] text-slate-400 mt-0.5">
                                                                            Đối tác: {order.partner_name || 'Khách lẻ'} | Loại: {order.type === 'Sale' ? 'Bán hàng' : 'Nhập hàng'}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                                <div className="text-right shrink-0 flex items-center gap-3">
                                                                    <p className="text-xs font-bold text-amber-400">
                                                                        {(order.total_amount || 0).toLocaleString('vi-VN')}đ
                                                                    </p>
                                                                    <ArrowRight size={14} className="text-slate-500 group-hover:translate-x-1 group-hover:text-emerald-400 transition-all" />
                                                                </div>
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </m.div>
                        </div>
                    </Portal>
                )}
            </AnimatePresence>

            {globalEditingOrder && (
                <OrderEditPopup
                    order={globalEditingOrder}
                    onClose={() => setGlobalEditingOrder(null)}
                    onSave={() => {
                        setGlobalEditingOrder(null);
                        // Send data sync broadcast so other active pages auto-update!
                        const syncChannel = new BroadcastChannel('pos_data_sync');
                        syncChannel.postMessage({ type: 'ORDER_UPDATED' });
                        syncChannel.close();
                    }}
                />
            )}
        </div>
    );
}
