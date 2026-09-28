import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion as m, AnimatePresence } from 'framer-motion';
import { 
    ArrowLeft, 
    ArrowRight, 
    RotateCcw, 
    Moon, 
    Sun, 
    LogOut, 
    LayoutDashboard, 
    ShoppingCart, 
    History, 
    Maximize, 
    Minimize,
    PanelLeftClose,
    PanelLeftOpen,
    Save,
    PlusCircle
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { cn } from '../../lib/utils';

const ContextMenu = () => {
    const [isVisible, setIsVisible] = useState(false);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDarkMode, setIsDarkMode] = useState(document.documentElement.classList.contains('dark'));
    const [isFullscreen, setIsFullscreen] = useState(!!document.fullscreenElement);
    const menuRef = useRef(null);
    const navigate = useNavigate();
    const location = useLocation();

    const isPOS = location.pathname === '/pos';

    const handleContextMenu = useCallback((e) => {
        // If holding Shift key, allow native browser context menu (Inspect Element)
        if (e.shiftKey) {
            return;
        }

        // Only show custom menu if not clicking on restricted areas (like inputs or scrollbars)
        const target = e.target;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
            return;
        }

        e.preventDefault();
        
        // Calculate position to prevent overflow
        let x = e.clientX;
        let y = e.clientY;
        const menuWidth = 240;
        const menuHeight = 380;

        if (x + menuWidth > window.innerWidth) x -= menuWidth;
        if (y + menuHeight > window.innerHeight) y -= menuHeight;

        setPosition({ x, y });
        setIsVisible(true);
    }, []);

    const handleClick = useCallback(() => {
        setIsVisible(false);
    }, []);

    useEffect(() => {
        window.addEventListener('contextmenu', handleContextMenu);
        window.addEventListener('click', handleClick);
        window.addEventListener('scroll', handleClick, true);
        
        const handleKeyDown = (e) => {
            if (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i')) {
                if (window.__TAURI__) {
                    window.__TAURI__.core.invoke('open_devtools').catch(console.error);
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);

        const handleFullscreenChange = () => {
            if (window.__TAURI__) {
                try {
                    window.__TAURI__.window.getCurrentWindow().isFullscreen()
                        .then(setIsFullscreen)
                        .catch(() => setIsFullscreen(prev => !prev));
                } catch (e) {
                    setIsFullscreen(prev => !prev);
                }
            } else {
                setIsFullscreen(!!document.fullscreenElement);
            }
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        window.addEventListener('tauri-fullscreenchange', handleFullscreenChange);

        return () => {
            window.removeEventListener('contextmenu', handleContextMenu);
            window.removeEventListener('click', handleClick);
            window.removeEventListener('scroll', handleClick, true);
            window.removeEventListener('keydown', handleKeyDown);
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
            window.removeEventListener('tauri-fullscreenchange', handleFullscreenChange);
        };
    }, [handleContextMenu, handleClick]);

    const handleAction = (action) => {
        setIsVisible(false);
        switch (action) {
            case 'back': window.history.back(); break;
            case 'forward': window.history.forward(); break;
            case 'reload': window.location.reload(); break;
            case 'theme': 
                const isDark = document.documentElement.classList.toggle('dark');
                setIsDarkMode(isDark);
                localStorage.setItem('theme', isDark ? 'dark' : 'light');
                break;
            case 'fullscreen':
                if (window.__TAURI__) {
                    window.__TAURI__.core.invoke('toggle_fullscreen')
                        .then(() => {
                            window.dispatchEvent(new CustomEvent('tauri-fullscreenchange'));
                        })
                        .catch(console.error);
                } else {
                    if (!document.fullscreenElement) {
                        document.documentElement.requestFullscreen();
                    } else {
                        document.exitFullscreen();
                    }
                }
                break;
            case 'devtools':
                if (window.__TAURI__) {
                    window.__TAURI__.core.invoke('open_devtools').catch(console.error);
                }
                break;
            case 'pos': navigate('/pos'); break;
            case 'dashboard': navigate('/'); break;
            case 'history': navigate('/history'); break;
            case 'logout':
                localStorage.removeItem('user');
                sessionStorage.removeItem('user');
                navigate('/welcome');
                break;
            default: break;
        }
    };

    const containerVariants = {
        hidden: { 
            opacity: 0, 
            scale: 0.94, 
            y: -8,
            transition: {
                duration: 0.15,
                ease: "easeInOut"
            }
        },
        visible: {
            opacity: 1,
            scale: 1,
            y: 0,
            transition: {
                duration: 0.22,
                ease: [0.16, 1, 0.3, 1],
                staggerChildren: 0.03,
                delayChildren: 0.015
            }
        },
        exit: {
            opacity: 0,
            scale: 0.95,
            y: -4,
            transition: {
                duration: 0.2,
                ease: "easeInOut",
                staggerChildren: 0.02,
                staggerDirection: -1
            }
        }
    };

    const itemVariants = {
        hidden: { 
            opacity: 0, 
            x: -12, 
            y: -2,
            filter: "blur(4px)" 
        },
        visible: { 
            opacity: 1, 
            x: 0, 
            y: 0,
            filter: "blur(0px)",
            transition: { 
                type: "spring", 
                stiffness: 450, 
                damping: 25,
                mass: 0.6
            } 
        },
        exit: {
            opacity: 0,
            x: -10,
            filter: "blur(3px)",
            transition: {
                duration: 0.12,
                ease: "easeIn"
            }
        }
    };

    return createPortal(
        <AnimatePresence>
            {isVisible && (
                <m.div
                    ref={menuRef}
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    style={{ 
                        position: 'fixed', 
                        top: position.y, 
                        left: position.x,
                        zIndex: 999999 
                    }}
                    className="w-64 bg-white/92 dark:bg-slate-900/92 text-slate-800 dark:text-slate-100 backdrop-blur-2xl rounded-2xl border border-black/10 dark:border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.15)] dark:shadow-[0_25px_60px_rgba(0,0,0,0.6)] p-2 overflow-hidden select-none"
                >
                    {/* Navigation Group */}
                    <m.div variants={itemVariants} className="flex items-center justify-between px-1.5 py-1.5 mb-1.5 bg-slate-100/70 dark:bg-white/5 rounded-xl border border-black/5 dark:border-white/5">
                        <MenuIconButton icon={ArrowLeft} onClick={() => handleAction('back')} title="Quay lại" />
                        <MenuIconButton icon={ArrowRight} onClick={() => handleAction('forward')} title="Tiến tới" />
                        <MenuIconButton icon={RotateCcw} onClick={() => handleAction('reload')} title="Tải lại trang" />
                        <div className="w-px h-4 bg-slate-300 dark:bg-white/10 mx-1" />
                        <MenuIconButton 
                            icon={isDarkMode ? Sun : Moon} 
                            onClick={() => handleAction('theme')} 
                            title={isDarkMode ? "Chuyển sang chế độ Sáng" : "Chuyển sang chế độ Tối"} 
                            className="text-amber-500 dark:text-amber-400 hover:bg-amber-500/15"
                        />
                    </m.div>

                    <div className="space-y-0.5">
                        <MenuItem 
                            variants={itemVariants}
                            icon={LayoutDashboard} 
                            label="Tổng quan" 
                            shortcut="Ctrl+Q"
                            onClick={() => handleAction('dashboard')} 
                        />
                        <MenuItem 
                            variants={itemVariants}
                            icon={ShoppingCart} 
                            label="Bán hàng (POS)" 
                            shortcut="Ctrl+P"
                            active={isPOS}
                            onClick={() => handleAction('pos')} 
                        />
                        <MenuItem 
                            variants={itemVariants}
                            icon={History} 
                            label="Lịch sử đơn" 
                            onClick={() => handleAction('history')} 
                        />
                    </div>

                    <m.div variants={itemVariants} className="h-px bg-slate-200/80 dark:bg-white/10 my-1.5 mx-1" />

                    <div className="space-y-0.5">
                        {isPOS && (
                            <>
                                <MenuItem 
                                    variants={itemVariants}
                                    icon={Save} 
                                    label="Lưu hóa đơn" 
                                    shortcut="F12"
                                    onClick={() => {
                                        setIsVisible(false);
                                        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'F12' }));
                                    }} 
                                />
                                <MenuItem 
                                    variants={itemVariants}
                                    icon={PlusCircle} 
                                    label="Tạo đơn mới" 
                                    shortcut="F4"
                                    onClick={() => {
                                        setIsVisible(false);
                                        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'F4' }));
                                    }} 
                                />
                            </>
                        )}
                        <MenuItem 
                            variants={itemVariants}
                            icon={isFullscreen ? Minimize : Maximize} 
                            label={isFullscreen ? "Thoát toàn màn hình" : "Toàn màn hình"} 
                            shortcut="F11" 
                            onClick={() => handleAction('fullscreen')} 
                        />
                    </div>

                    <m.div variants={itemVariants} className="h-px bg-slate-200/80 dark:bg-white/10 my-1.5 mx-1" />

                    <MenuItem 
                        variants={itemVariants}
                        icon={LogOut} 
                        label="Đăng xuất" 
                        danger
                        onClick={() => handleAction('logout')} 
                    />

                    {/* Logo/Branding footer */}
                    <m.div variants={itemVariants} className="mt-1.5 px-3 py-1.5 bg-slate-100/70 dark:bg-white/5 rounded-xl flex items-center justify-between border border-black/5 dark:border-white/5">
                        <span className="text-[9.5px] font-black text-slate-400 dark:text-white/30 tracking-[0.2em] uppercase">LyangPOS v4.0</span>
                        <div className="flex gap-1.5 items-center">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/40" />
                        </div>
                    </m.div>
                </m.div>
            )}
        </AnimatePresence>,
        document.body
    );
};

const MenuItem = ({ icon: Icon, label, shortcut, onClick, active, danger, variants }) => (
    <m.button
        variants={variants}
        whileHover={{ x: 4, scale: 1.01 }}
        whileTap={{ scale: 0.97 }}
        onClick={onClick}
        className={cn(
            "w-full flex items-center justify-between px-3 py-2 rounded-xl transition-colors font-semibold text-xs cursor-pointer",
            active 
                ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 font-bold shadow-xs border border-emerald-500/20" 
                : danger
                    ? "text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 hover:text-rose-700 dark:hover:text-rose-300"
                    : "text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white"
        )}
    >
        <div className="flex items-center gap-2.5">
            <Icon size={16} className={cn(
                "shrink-0 transition-transform duration-200", 
                active ? "text-emerald-600 dark:text-emerald-400 scale-105" : (danger ? "text-rose-500 dark:text-rose-400" : "text-slate-400 dark:text-slate-400")
            )} />
            <span className="text-xs font-bold tracking-tight">{label}</span>
        </div>
        {shortcut && (
            <span className="text-[9px] font-black text-slate-400 dark:text-white/40 uppercase tracking-tight bg-black/5 dark:bg-white/10 px-1.5 py-0.5 rounded-md">
                {shortcut}
            </span>
        )}
    </m.button>
);

const MenuIconButton = ({ icon: Icon, onClick, title, className }) => (
    <m.button
        whileHover={{ scale: 1.15, y: -1 }}
        whileTap={{ scale: 0.9 }}
        onClick={onClick}
        title={title}
        className={cn(
            "p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 text-slate-600 dark:text-white/70 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer",
            className
        )}
    >
        <Icon size={16} />
    </m.button>
);

export default ContextMenu;
