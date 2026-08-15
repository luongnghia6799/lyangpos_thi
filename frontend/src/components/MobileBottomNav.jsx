import React from 'react';
import { ShoppingCart, ListChecks, Tags, TrendingUp, Menu, BookOpen, Package } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { cn } from '../lib/utils';
import { m } from 'framer-motion';
import useMobileNative from '../hooks/useMobileNative';

export default function MobileBottomNav({ onOpenMenu }) {
    const navigate = useNavigate();
    const location = useLocation();
    const { triggerHaptic } = useMobileNative();

    const navItems = [
        { label: 'Tổng quan', icon: TrendingUp, path: '/mobile-dashboard' },
        { label: 'Bán hàng', icon: ShoppingCart, path: '/mobile-pos' },
        { label: 'Sản phẩm', icon: Tags, path: '/mobile-products' },
        { label: 'Soạn đơn', icon: ListChecks, path: '/mobile-orders' },
        { label: 'Danh mục', icon: Menu, isAction: true },
    ];

    const handleItemClick = (item) => {
        triggerHaptic('light');
        if (item.isAction) {
            if (onOpenMenu) onOpenMenu();
        } else if (item.path) {
            navigate(item.path);
        }
    };

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/90 dark:bg-slate-950/90 backdrop-blur-md border-t border-slate-200/80 dark:border-slate-800/80 pb-[env(safe-area-inset-bottom,0px)] android-webview transition-colors">
            <div className="flex items-center justify-around h-16 px-1 max-w-md mx-auto">
                {navItems.map((item, idx) => {
                    const isActive = !item.isAction && location.pathname === item.path;
                    const Icon = item.icon;

                    return (
                        <button
                            key={idx}
                            onClick={() => handleItemClick(item)}
                            className="relative flex flex-col items-center justify-center flex-1 h-full py-1 android-touchable focus:outline-none"
                        >
                            {/* Material Design 3 Active Pill Container */}
                            <div className="relative flex items-center justify-center w-16 h-8 mb-0.5">
                                {isActive && (
                                    <m.div
                                        layoutId="m3-nav-pill"
                                        className="absolute inset-0 bg-primary/15 dark:bg-emerald-500/20 rounded-full"
                                        transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                                    />
                                )}
                                <Icon
                                    size={20}
                                    className={cn(
                                        "z-10 transition-colors duration-200",
                                        isActive
                                            ? "text-primary dark:text-emerald-400 stroke-[2.4]"
                                            : "text-slate-500 dark:text-slate-400 stroke-[1.8]"
                                    )}
                                />
                            </div>

                            {/* Label */}
                            <span
                                className={cn(
                                    "text-[10px] font-semibold tracking-tight transition-colors duration-200 leading-tight",
                                    isActive
                                        ? "text-primary dark:text-emerald-400 font-bold"
                                        : "text-slate-600 dark:text-slate-400"
                                )}
                            >
                                {item.label}
                            </span>
                        </button>
                    );
                })}
            </div>
        </nav>
    );
}
