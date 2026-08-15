import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Sun, Moon, ArrowLeft, RefreshCw, ShoppingCart, Search, ChevronDown } from 'lucide-react';
import MobileBottomNav from './MobileBottomNav';
import MobileMenu from './MobileMenu';
import useMobileNative from '../hooks/useMobileNative';
import logo from '../assets/logo.png';
import { cn } from '../lib/utils';

const ROUTE_TITLES = {
    '/mobile-dashboard': 'Tổng Quan',
    '/mobile-pos': 'Bán Hàng POS',
    '/mobile-products': 'Danh Mục Sản Phẩm',
    '/mobile-orders': 'Soạn & Giao Đơn',
    '/mobile-purchase': 'Nhập Hàng',
    '/mobile-partners': 'Danh Sách Đối Tác',
    '/mobile-inventory': 'Kiểm Kho Nông Nghiệp',
    '/mobile-history': 'Lịch Sử Giao Dịch',
    '/mobile-settings': 'Cài Đặt Hệ Thống',
};

export default function MobileLayout({ children }) {
    const location = useLocation();
    const navigate = useNavigate();
    const { triggerHaptic, setStatusBarColor } = useMobileNative();

    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(() => {
        return document.documentElement.classList.contains('dark');
    });

    const pageTitle = ROUTE_TITLES[location.pathname] || 'LyangPOS';

    const toggleDarkMode = () => {
        triggerHaptic('light');
        const nextDark = !isDarkMode;
        setIsDarkMode(nextDark);
        if (nextDark) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
            setStatusBarColor('#000000');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
            setStatusBarColor('#ffffff');
        }
    };

    useEffect(() => {
        setStatusBarColor(isDarkMode ? '#000000' : '#ffffff');
    }, [isDarkMode, setStatusBarColor]);

    const isPOSPage = location.pathname === '/mobile-pos';

    return (
        <div className="min-h-screen w-full bg-slate-100 dark:bg-black text-slate-800 dark:text-slate-100 flex flex-col android-webview selection:bg-primary/20">
            {/* Android Top App Bar */}
            <header className="sticky top-0 z-40 bg-white dark:bg-black border-b border-slate-200/70 dark:border-slate-800/80 safe-area-pt shadow-xs transition-colors">
                <div className="flex items-center justify-between h-14 px-3 max-w-md mx-auto">
                    {/* Clickable Logo & Page Title to Trigger Navigation Menu */}
                    <div 
                        onClick={() => {
                            triggerHaptic('light');
                            setIsMenuOpen(true);
                        }}
                        className="flex items-center gap-2 cursor-pointer py-1 px-2 -ml-1 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-900 active:scale-95 transition-all android-touchable overflow-hidden"
                    >
                        <img src={logo} alt="Logo" className="w-7 h-7 object-contain shrink-0 drop-shadow-xs" />
                        <div className="flex items-center gap-1.5 truncate">
                            <h1 className="font-extrabold text-base tracking-tight text-slate-900 dark:text-slate-100 truncate">
                                {pageTitle}
                            </h1>
                            <ChevronDown size={15} className="text-slate-400 dark:text-slate-500 shrink-0" />
                        </div>
                    </div>

                    {/* Right Quick Action Icons */}
                    <div className="flex items-center gap-1 shrink-0">
                        <button
                            onClick={toggleDarkMode}
                            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95 transition-all android-touchable"
                            aria-label="Toggle Theme"
                        >
                            {isDarkMode ? <Sun size={20} className="text-amber-400" /> : <Moon size={20} className="text-slate-600" />}
                        </button>

                        {!isPOSPage && (
                            <button
                                onClick={() => {
                                    triggerHaptic('light');
                                    navigate('/mobile-pos');
                                }}
                                className="p-2 rounded-xl text-primary dark:text-emerald-400 bg-primary/10 dark:bg-emerald-500/10 hover:bg-primary/20 active:scale-95 transition-all android-touchable"
                                aria-label="Go to POS"
                            >
                                <ShoppingCart size={20} />
                            </button>
                        )}
                    </div>
                </div>
            </header>

            {/* Main WebView Content Area */}
            <main className="flex-1 w-full max-w-md mx-auto pb-6 overflow-x-hidden">
                {children}
            </main>

            {/* Material 3 Bottom Sheet Menu Drawer */}
            <MobileMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
        </div>
    );
}
