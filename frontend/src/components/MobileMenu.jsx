import React from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { Package, ShoppingCart, ListChecks, LogOut, X, ClipboardList, TrendingUp, BookOpen, Users, Tags, ChevronRight, User, ShieldCheck, Sparkles } from 'lucide-react';
import logo from '../assets/logo.png';
import { useNavigate, useLocation } from 'react-router-dom';
import { cn } from '../lib/utils';
import useMobileNative from '../hooks/useMobileNative';

export default function MobileMenu({ isOpen, onClose }) {
    const navigate = useNavigate();
    const location = useLocation();
    const { triggerHaptic } = useMobileNative();

    const userStr = sessionStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    const userName = user?.name || user?.username || 'Quản Trị Viên';
    const userRole = user?.role ? (user.role === 'admin' ? 'Quản Trị' : 'Nhân Viên') : 'Quản Trị';

    const menuSections = [
        {
            title: 'TÁC VỤ BÁN HÀNG',
            items: [
                { label: 'Tổng Quan', icon: TrendingUp, path: '/mobile-dashboard', desc: 'Báo cáo & Phím tắt nhanh' },
                { label: 'Bán Hàng POS', icon: ShoppingCart, path: '/mobile-pos', desc: 'Tạo đơn hàng & Thanh toán', badge: 'Chính' },
            ]
        },
        {
            title: 'QUẢN LÝ NÔNG NGHIỆP',
            items: [
                { label: 'Danh Mục Sản Phẩm', icon: Tags, path: '/mobile-products', desc: 'Giá cả & Quy đổi thùng/lẻ' },
                { label: 'Soạn & Giao Đơn', icon: ListChecks, path: '/mobile-orders', desc: 'Theo dõi tiến độ soạn hàng' },
                { label: 'Nhập Hàng Kho', icon: Package, path: '/mobile-purchase', desc: 'Nhập kho từ nhà cung cấp' },
                { label: 'Đối Tác & Khách Hàng', icon: Users, path: '/mobile-partners', desc: 'Danh bạ & Sổ công nợ' },
                { label: 'Kiểm Kho Thực Tế', icon: ClipboardList, path: '/mobile-inventory', desc: 'Cân bằng tồn kho nhanh' },
            ]
        },
        {
            title: 'BÁO CÁO & LỊCH SỬ',
            items: [
                { label: 'Lịch Sử Giao Dịch', icon: BookOpen, path: '/mobile-history', desc: 'Tra cứu hóa đơn đã bán' },
            ]
        }
    ];

    const handleNavigate = (path) => {
        triggerHaptic('light');
        navigate(path);
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <m.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => {
                            triggerHaptic('light');
                            onClose();
                        }}
                        className="fixed inset-0 bg-slate-950/70 z-[60] backdrop-blur-sm"
                    />

                    {/* Android Material 3 Premium Bottom Sheet Container */}
                    <m.div
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                        className="fixed bottom-0 left-0 right-0 max-h-[88dvh] bg-white dark:bg-black z-[70] rounded-t-[32px] overflow-hidden border-t border-slate-200/80 dark:border-slate-800 shadow-2xl safe-area-pb android-webview text-slate-900 dark:text-white flex flex-col"
                    >
                        {/* Drag Handle Bar */}
                        <div 
                            className="w-full flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing shrink-0"
                            onClick={onClose}
                        >
                            <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full" />
                        </div>

                        {/* Profile & Store Header Card */}
                        <div className="px-5 pb-3.5 pt-1 border-b border-slate-100 dark:border-slate-800/80 bg-white dark:bg-black shrink-0">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3.5 overflow-hidden">
                                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-primary to-emerald-500 text-white flex items-center justify-center font-black text-base shadow-md shadow-emerald-500/20 shrink-0">
                                        {userName.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                        <div className="flex items-center gap-1.5">
                                            <span className="font-extrabold text-sm text-slate-900 dark:text-slate-100 truncate">{userName}</span>
                                            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 font-bold text-[9px] uppercase tracking-wider shrink-0">
                                                {userRole}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1 mt-0.5 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                            <span>LyangPOS Mobile Pro</span>
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => {
                                        triggerHaptic('light');
                                        onClose();
                                    }}
                                    className="p-2 rounded-2xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                        </div>

                        {/* Categorized Menu List */}
                        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4 bg-white dark:bg-black custom-scrollbar">
                            {menuSections.map((section, sIdx) => (
                                <div key={sIdx} className="space-y-1.5">
                                    <div className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500 px-2 py-0.5">
                                        {section.title}
                                    </div>
                                    <div className="space-y-1">
                                        {section.items.map((item, iIdx) => {
                                            const isActive = location.pathname === item.path;
                                            const Icon = item.icon;

                                            return (
                                                <button
                                                    key={iIdx}
                                                    onClick={() => handleNavigate(item.path)}
                                                    className={cn(
                                                        "flex items-center gap-3.5 w-full p-3 rounded-2xl transition-all active:scale-[0.98] text-left relative overflow-hidden group",
                                                        isActive
                                                            ? "bg-gradient-to-r from-primary to-emerald-600 dark:from-emerald-600 dark:to-emerald-700 text-white shadow-lg shadow-emerald-600/25 font-bold"
                                                            : "text-slate-800 dark:text-slate-200 hover:bg-slate-100/80 dark:hover:bg-slate-900/80 active:bg-slate-200 dark:active:bg-slate-800 border border-transparent dark:hover:border-slate-800/80"
                                                    )}
                                                >
                                                    <div className={cn(
                                                        "p-2 rounded-xl transition-all shrink-0",
                                                        isActive
                                                            ? "bg-white/20 text-white shadow-xs"
                                                            : "bg-slate-100 dark:bg-slate-800/90 text-slate-700 dark:text-slate-300 group-hover:bg-primary/10 group-hover:text-primary dark:group-hover:text-emerald-400"
                                                    )}>
                                                        <Icon size={19} />
                                                    </div>

                                                    <div className="flex flex-col flex-1 min-w-0">
                                                        <div className="flex items-center justify-between">
                                                            <span className="font-bold text-xs leading-snug truncate">{item.label}</span>
                                                            {item.badge && (
                                                                <span className={cn(
                                                                    "px-2 py-0.5 rounded-md font-extrabold text-[9px] uppercase tracking-wider",
                                                                    isActive 
                                                                        ? "bg-white/25 text-white" 
                                                                        : "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                                                                )}>
                                                                    {item.badge}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <span className={cn("text-[10px] leading-tight mt-0.5 truncate", isActive ? "text-white/80 font-normal" : "text-slate-400 dark:text-slate-500 font-medium")}>
                                                            {item.desc}
                                                        </span>
                                                    </div>

                                                    <ChevronRight size={16} className={cn("shrink-0 transition-transform group-hover:translate-x-0.5", isActive ? "text-white" : "text-slate-300 dark:text-slate-600")} />
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Footer Card */}
                        <div className="p-4 border-t border-slate-100 dark:border-slate-800/80 bg-white dark:bg-black shrink-0 flex items-center justify-between gap-3">
                            <button
                                onClick={() => {
                                    triggerHaptic('heavy');
                                    sessionStorage.removeItem('user');
                                    navigate('/welcome');
                                }}
                                className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-2xl text-rose-600 dark:text-rose-400 font-extrabold text-xs uppercase tracking-wider bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 dark:hover:bg-rose-950/50 border border-rose-200/60 dark:border-rose-900/40 active:scale-95 transition-all"
                            >
                                <LogOut size={16} />
                                <span>Đăng Xuất</span>
                            </button>
                        </div>
                    </m.div>
                </>
            )}
        </AnimatePresence>
    );
}

