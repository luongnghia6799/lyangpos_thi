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
    PlusCircle,
    Code
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { cn } from '../lib/utils';

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

    if (!isVisible) return null;

    return createPortal(
        <AnimatePresence>
            {isVisible && (
                <m.div
                    ref={menuRef}
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    transition={{ duration: 0.1, ease: "easeOut" }}
                    style={{ 
                        position: 'fixed', 
                        top: position.y, 
                        left: position.x,
                        zIndex: 999999 
                    }}
                    className="w-60 bg-[#1a300d]/95 backdrop-blur-3xl rounded-2xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] p-1.5 overflow-hidden"
                >
                    {/* Navigation Group */}
                    <div className="flex items-center justify-between px-2 py-2 mb-1 border-b border-white/5">
                        <MenuIconButton icon={ArrowLeft} onClick={() => handleAction('back')} title="Back" />
                        <MenuIconButton icon={ArrowRight} onClick={() => handleAction('forward')} title="Forward" />
                        <MenuIconButton icon={RotateCcw} onClick={() => handleAction('reload')} title="Reload" />
                        <div className="w-px h-4 bg-white/10 mx-1" />
                        <MenuIconButton 
                            icon={isDarkMode ? Sun : Moon} 
                            onClick={() => handleAction('theme')} 
                            title="Toggle Theme" 
                            className="text-amber-400"
                        />
                    </div>

                    <div className="space-y-0.5">
                        <MenuItem 
                            icon={LayoutDashboard} 
                            label="Tổng quan" 
                            shortcut="Ctrl+Q"
                            onClick={() => handleAction('dashboard')} 
                        />
                        <MenuItem 
                            icon={ShoppingCart} 
                            label="Bán hàng (POS)" 
                            shortcut="Ctrl+P"
                            active={isPOS}
                            onClick={() => handleAction('pos')} 
                        />
                        <MenuItem 
                            icon={History} 
                            label="Lịch sử đơn" 
                            onClick={() => handleAction('history')} 
                        />
                    </div>

                    <div className="h-px bg-white/5 my-1.5" />

                    <div className="space-y-0.5">
                        {isPOS && (
                            <>
                                <MenuItem 
                                    icon={Save} 
                                    label="Lưu hóa đơn" 
                                    shortcut="F12"
                                    onClick={() => {
                                        setIsVisible(false);
                                        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'F12' }));
                                    }} 
                                />
                                <MenuItem 
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
                            icon={isFullscreen ? Minimize : Maximize} 
                            label={isFullscreen ? "Thoát toàn màn hình" : "Toàn màn hình"} 
                            shortcut="F11"
                            onClick={() => handleAction('fullscreen')} 
                        />
                        <MenuItem 
                            icon={Code} 
                            label="Kiểm tra (Inspect)" 
                            shortcut="Ctrl+Shift+I"
                            onClick={() => handleAction('devtools')} 
                        />
                    </div>

                    <div className="h-px bg-white/5 my-1.5" />

                    <MenuItem 
                        icon={LogOut} 
                        label="Đăng xuất" 
                        danger
                        onClick={() => handleAction('logout')} 
                    />

                    {/* Logo/Branding footer */}
                    <div className="mt-2 px-3 py-2 bg-white/5 rounded-xl flex items-center justify-between">
                        <span className="text-[9px] font-black text-white/30 tracking-[0.2em] uppercase">LyangPOS v4.0</span>
                        <div className="flex gap-1">
                            <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                            <div className="w-1 h-1 rounded-full bg-emerald-500/50" />
                        </div>
                    </div>
                </m.div>
            )}
        </AnimatePresence>,
        document.body
    );
};

const MenuItem = ({ icon: Icon, label, shortcut, onClick, active, danger }) => (
    <m.button
        whileHover={{ x: 2 }}
        whileTap={{ scale: 0.98 }}
        onClick={onClick}
        className={`
            w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all
            ${active ? 'bg-emerald-500/20 text-emerald-400' : 'hover:bg-white/5 text-white/80 hover:text-white'}
            ${danger ? 'hover:bg-rose-500/10 hover:text-rose-400' : ''}
        `}
    >
        <div className="flex items-center gap-3">
            <Icon size={16} className={cn("shrink-0", active ? "text-emerald-400" : (danger ? "text-rose-400" : "text-white/40"))} />
            <span className="text-xs font-bold tracking-wide">{label}</span>
        </div>
        {shortcut && (
            <span className="text-[9px] font-black text-white/20 uppercase tracking-tighter bg-white/5 px-1.5 py-0.5 rounded-md group-hover:text-white/40">
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
            "p-2 rounded-xl hover:bg-white/10 text-white/60 hover:text-white transition-all",
            className
        )}
    >
        <Icon size={16} />
    </m.button>
);

export default ContextMenu;
