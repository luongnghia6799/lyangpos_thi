import React, { useState, useEffect, useRef } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { 
    Sparkles, Camera, Upload, Trash2, Check, X, Bot, Image as ImageIcon, 
    RefreshCw, User, ShieldCheck, CheckCircle2 
} from 'lucide-react';
import { MASCOT_LIST, playPopSound } from '../../lib/mascots';
import { cn } from '../../lib/utils';
import axios from 'axios';

export const getDashboardAvatar = () => {
    try {
        const u = JSON.parse(sessionStorage.getItem('user') || '{}');
        return (u.username && localStorage.getItem(`user_avatar_${u.username}`)) ||
               (u.id && localStorage.getItem(`user_avatar_${u.id}`)) ||
               localStorage.getItem('user_avatar') || '';
    } catch (e) {
        return '';
    }
};

export default function SidebarLogoCustomizerModal({ isOpen, onClose }) {
    const fileInputRef = useRef(null);

    // Current Mode: 'mascot' | 'static'
    const [logoType, setLogoType] = useState(() => {
        return localStorage.getItem('sidebar_logo_type') || 'mascot';
    });

    // Static Source: 'dashboard_avatar' | 'custom' | 'default'
    const [staticSource, setStaticSource] = useState(() => {
        return localStorage.getItem('sidebar_logo_static_source') || 'dashboard_avatar';
    });

    // Custom uploaded image
    const [customImage, setCustomImage] = useState(() => {
        return localStorage.getItem('sidebar_logo_custom_image') || '';
    });

    // Sync also to Dashboard avatar checkbox
    const [syncToDashboard, setSyncToDashboard] = useState(true);

    // Current Mascot ID
    const [characterId, setCharacterId] = useState(() => {
        try {
            const saved = localStorage.getItem('lyang_mascot_config');
            if (saved) {
                const parsed = JSON.parse(saved);
                return parsed.characterId || 'lyang';
            }
        } catch (e) {}
        return 'lyang';
    });

    // Dashboard avatar URL
    const [dashboardAvatar, setDashboardAvatar] = useState(() => getDashboardAvatar());

    useEffect(() => {
        if (!isOpen) return;
        setLogoType(localStorage.getItem('sidebar_logo_type') || 'mascot');
        setStaticSource(localStorage.getItem('sidebar_logo_static_source') || 'dashboard_avatar');
        setCustomImage(localStorage.getItem('sidebar_logo_custom_image') || '');
        setDashboardAvatar(getDashboardAvatar());
        try {
            const saved = localStorage.getItem('lyang_mascot_config');
            if (saved) {
                const parsed = JSON.parse(saved);
                if (parsed.characterId) setCharacterId(parsed.characterId);
            }
        } catch (e) {}
    }, [isOpen]);

    // Save and apply settings
    const handleApply = (newType, newSource, newCustomImg, newCharId) => {
        const targetType = newType !== undefined ? newType : logoType;
        const targetSource = newSource !== undefined ? newSource : staticSource;
        const targetCustom = newCustomImg !== undefined ? newCustomImg : customImage;
        const targetChar = newCharId !== undefined ? newCharId : characterId;

        localStorage.setItem('sidebar_logo_type', targetType);
        localStorage.setItem('sidebar_logo_static_source', targetSource);
        if (targetCustom) {
            localStorage.setItem('sidebar_logo_custom_image', targetCustom);
        } else {
            localStorage.removeItem('sidebar_logo_custom_image');
        }

        if (targetChar) {
            try {
                const current = JSON.parse(localStorage.getItem('lyang_mascot_config') || '{}');
                const updated = { ...current, characterId: targetChar };
                localStorage.setItem('lyang_mascot_config', JSON.stringify(updated));
                window.dispatchEvent(new Event('lyang_mascot_config_updated'));
            } catch (e) {}
        }

        // Notify app
        window.dispatchEvent(new Event('sidebar_logo_updated'));
        window.dispatchEvent(new Event('storage'));
        try {
            playPopSound();
        } catch (e) {}
    };

    // Mascot selection
    const handleSelectMascot = (id) => {
        setCharacterId(id);
        setLogoType('mascot');
        handleApply('mascot', staticSource, customImage, id);
    };

    // Static source selection
    const handleSelectStaticSource = (source) => {
        setStaticSource(source);
        setLogoType('static');
        handleApply('static', source, customImage, characterId);
    };

    // Handle Custom File Upload
    const handleImageUpload = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = async () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
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
                const base64 = canvas.toDataURL('image/png', 0.92);

                setCustomImage(base64);
                setStaticSource('custom');
                setLogoType('static');
                handleApply('static', 'custom', base64, characterId);

                // Đồng thời đồng bộ sang avatar Dashboard nếu người dùng muốn
                if (syncToDashboard) {
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
                    } catch (sErr) {}
                    window.dispatchEvent(new Event('user_avatar_updated'));
                    setDashboardAvatar(base64);
                }
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
        if (e.target) e.target.value = '';
    };

    // Reset static custom
    const handleResetStatic = () => {
        setCustomImage('');
        setStaticSource('default');
        setLogoType('static');
        handleApply('static', 'default', '', characterId);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[600000] pointer-events-none select-none">
                    {/* Subtle Backdrop to dismiss */}
                    <m.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.18 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/25 dark:bg-black/50 backdrop-blur-[3px] pointer-events-auto"
                    />

                    {/* Sleek Popup Dialog anchored beside Sidebar Logo */}
                    <m.div
                        initial={{ opacity: 0, scale: 0.88, x: -18, filter: 'blur(4px)' }}
                        animate={{ opacity: 1, scale: 1, x: 0, filter: 'blur(0px)' }}
                        exit={{ opacity: 0, scale: 0.88, x: -14, filter: 'blur(4px)', transition: { duration: 0.16 } }}
                        transition={{ type: "spring", stiffness: 440, damping: 28 }}
                        className="fixed left-[82px] top-3 z-[600001] pointer-events-auto w-[430px] max-w-[calc(100vw-98px)] max-h-[calc(100vh-28px)] bg-[#fcfaf6]/95 dark:bg-[#161a14]/95 backdrop-blur-2xl border-2 border-[#8b6f47]/30 dark:border-emerald-500/35 rounded-3xl shadow-[0_24px_60px_-10px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden origin-top-left"
                    >
                        {/* Header */}
                        <div className="p-4 sm:p-5 border-b border-[#8b6f47]/15 dark:border-white/10 flex items-center justify-between bg-black/[0.02] dark:bg-white/[0.02]">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#2d5016] to-emerald-500 text-white flex items-center justify-center shadow-md shadow-[#2d5016]/20">
                                    <Sparkles size={20} />
                                </div>
                                <div>
                                    <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 uppercase tracking-wide">
                                        Tùy chỉnh Logo Sidebar
                                    </h3>
                                    <p className="text-[10.5px] font-bold text-slate-500 dark:text-slate-400">
                                        Chọn hiển thị Mascot hoặc Ảnh tĩnh Avatar
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
                            >
                                <X size={16} strokeWidth={2.5} />
                            </button>
                        </div>

                        {/* Tab Switcher: Mascot vs Ảnh tĩnh */}
                        <div className="px-4 sm:px-5 pt-3.5 pb-2">
                            <div className="bg-[#ede8dc] dark:bg-[#20251c] p-1.5 rounded-2xl flex items-center gap-1.5 border border-[#8b6f47]/20 dark:border-white/10 relative">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setLogoType('mascot');
                                        handleApply('mascot', staticSource, customImage, characterId);
                                    }}
                                    className={cn(
                                        "flex-1 py-2 px-2.5 rounded-xl flex items-center justify-center gap-1.5 text-xs font-black transition-all cursor-pointer relative z-10",
                                        logoType === 'mascot'
                                            ? "text-white shadow-md shadow-[#2d5016]/20"
                                            : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                                    )}
                                >
                                    {logoType === 'mascot' && (
                                        <m.div 
                                            layoutId="logo_type_pill"
                                            className="absolute inset-0 bg-gradient-to-r from-[#2d5016] to-emerald-600 rounded-xl z-[-1]"
                                            transition={{ type: "spring", stiffness: 450, damping: 30 }}
                                        />
                                    )}
                                    <Bot size={15} />
                                    <span>Mascot Xoay Đầu (2.5D)</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => {
                                        setLogoType('static');
                                        handleApply('static', staticSource, customImage, characterId);
                                    }}
                                    className={cn(
                                        "flex-1 py-2 px-2.5 rounded-xl flex items-center justify-center gap-1.5 text-xs font-black transition-all cursor-pointer relative z-10",
                                        logoType === 'static'
                                            ? "text-white shadow-md shadow-[#2d5016]/20"
                                            : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                                    )}
                                >
                                    {logoType === 'static' && (
                                        <m.div 
                                            layoutId="logo_type_pill"
                                            className="absolute inset-0 bg-gradient-to-r from-[#2d5016] to-emerald-600 rounded-xl z-[-1]"
                                            transition={{ type: "spring", stiffness: 450, damping: 30 }}
                                        />
                                    )}
                                    <ImageIcon size={15} />
                                    <span>Ảnh Tĩnh (Avatar)</span>
                                </button>
                            </div>
                        </div>

                        {/* Body Content */}
                        <div className="p-4 sm:p-5 overflow-y-auto custom-scrollbar flex-1 flex flex-col gap-4">
                            {logoType === 'mascot' ? (
                                /* MASCOT PICKER MODE */
                                <div className="flex flex-col gap-3.5">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[11px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                                            Chọn nhân vật Mascot
                                        </span>
                                        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                                            Đang dùng: {MASCOT_LIST.find(c => c.id === characterId)?.name || 'Lyang'}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-3 gap-2.5">
                                        {MASCOT_LIST.map((mascot) => {
                                            const isSelected = characterId === mascot.id;
                                            return (
                                                <div
                                                    key={mascot.id}
                                                    onClick={() => handleSelectMascot(mascot.id)}
                                                    className={cn(
                                                        "p-2.5 min-h-[105px] rounded-2xl border-2 flex flex-col items-center justify-center gap-1.5 text-center cursor-pointer transition-all group relative overflow-hidden select-none",
                                                        isSelected
                                                            ? "border-emerald-500 bg-emerald-500/10 dark:bg-emerald-500/15 shadow-md shadow-emerald-500/15"
                                                            : "border-[#8b6f47]/20 dark:border-white/10 hover:border-emerald-400/60 hover:bg-black/[0.02] dark:hover:bg-white/[0.03]"
                                                    )}
                                                >
                                                    <div className="w-13 h-13 rounded-xl overflow-hidden flex items-center justify-center relative bg-white/40 dark:bg-black/30 border border-black/5 shrink-0 shadow-xs">
                                                        {mascot.avatar ? (
                                                            <img
                                                                src={mascot.avatar}
                                                                alt={mascot.name}
                                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-200"
                                                            />
                                                        ) : (
                                                            <div
                                                                style={{
                                                                    width: '100%',
                                                                    height: '100%',
                                                                    backgroundImage: `url("${mascot.directions}")`,
                                                                    backgroundSize: '300% 300%',
                                                                    backgroundPosition: '50% 50%',
                                                                    backgroundRepeat: 'no-repeat',
                                                                    transform: 'scale(1.2)'
                                                                }}
                                                                className="group-hover:scale-125 transition-transform duration-200"
                                                            />
                                                        )}
                                                    </div>
                                                    <div className="flex flex-col items-center">
                                                        <span className="text-[11.5px] font-black text-slate-800 dark:text-slate-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors line-clamp-1">
                                                            {mascot.name}
                                                        </span>
                                                        <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 line-clamp-1">
                                                            {mascot.category || 'Mascot 2.5D'}
                                                        </span>
                                                    </div>

                                                    {isSelected && (
                                                        <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-xs">
                                                            <Check size={10} strokeWidth={3} />
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>

                                    <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 text-center mt-0.5">
                                        💡 Mascot tự xoay đầu hướng mắt theo con trỏ chuột và chớp mắt tự nhiên.
                                    </p>
                                </div>
                            ) : (
                                /* STATIC IMAGE MODE */
                                <div className="flex flex-col gap-3">
                                    {/* Option 1: Use Dashboard Avatar */}
                                    <div 
                                        onClick={() => handleSelectStaticSource('dashboard_avatar')}
                                        className={cn(
                                            "p-3 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between gap-3",
                                            staticSource === 'dashboard_avatar'
                                                ? "border-emerald-500 bg-emerald-500/10 dark:bg-emerald-500/15 shadow-md shadow-emerald-500/15"
                                                : "border-[#8b6f47]/20 dark:border-white/10 hover:border-emerald-400/60"
                                        )}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 rounded-xl overflow-hidden bg-black/5 dark:bg-white/10 flex items-center justify-center border border-black/10 shrink-0 shadow-xs">
                                                {dashboardAvatar ? (
                                                    <img 
                                                        src={dashboardAvatar} 
                                                        alt="Dashboard Avatar" 
                                                        className="w-full h-full object-cover" 
                                                        onError={(e) => { e.currentTarget.src = '/logo.png'; }}
                                                    />
                                                ) : (
                                                    <img src="/logo.png" alt="Logo" className="w-full h-full object-contain p-1" />
                                                )}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-xs font-black text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                                                    Avatar từ Dashboard
                                                    <span className="px-1.5 py-0.2 rounded text-[7.5px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                                                        Tự đồng bộ
                                                    </span>
                                                </span>
                                                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                                                    {dashboardAvatar ? "Dùng ảnh đại diện tài khoản hiện tại" : "Chưa có avatar riêng (dùng logo gốc)"}
                                                </span>
                                            </div>
                                        </div>
                                        <div className={cn(
                                            "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors",
                                            staticSource === 'dashboard_avatar' ? "border-emerald-500 bg-emerald-500 text-white" : "border-slate-400 dark:border-slate-600"
                                        )}>
                                            {staticSource === 'dashboard_avatar' && <Check size={12} strokeWidth={3} />}
                                        </div>
                                    </div>

                                    {/* Option 2: Upload Custom Static Logo */}
                                    <div 
                                        className={cn(
                                            "p-3 rounded-2xl border-2 transition-all flex flex-col gap-2.5",
                                            staticSource === 'custom'
                                                ? "border-emerald-500 bg-emerald-500/10 dark:bg-emerald-500/15 shadow-md shadow-emerald-500/15"
                                                : "border-[#8b6f47]/20 dark:border-white/10"
                                        )}
                                    >
                                        <div 
                                            onClick={() => {
                                                if (customImage) {
                                                    handleSelectStaticSource('custom');
                                                } else {
                                                    fileInputRef.current?.click();
                                                }
                                            }}
                                            className="flex items-center justify-between gap-3 cursor-pointer"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 rounded-xl overflow-hidden bg-black/5 dark:bg-white/10 flex items-center justify-center border border-black/10 shrink-0 shadow-xs">
                                                    {customImage ? (
                                                        <img src={customImage} alt="Custom Logo" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <Camera size={20} className="text-slate-400" />
                                                    )}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-black text-slate-900 dark:text-slate-100">
                                                        Tải ảnh tĩnh từ máy tính
                                                    </span>
                                                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mt-0.5">
                                                        {customImage ? "Đã có ảnh tĩnh riêng cho Sidebar" : "Chọn file ảnh PNG, JPG, WebP"}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className={cn(
                                                "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors",
                                                staticSource === 'custom' ? "border-emerald-500 bg-emerald-500 text-white" : "border-slate-400 dark:border-slate-600"
                                            )}>
                                                {staticSource === 'custom' && <Check size={12} strokeWidth={3} />}
                                            </div>
                                        </div>

                                        <input 
                                            ref={fileInputRef}
                                            type="file" 
                                            accept="image/png, image/jpeg, image/jpg, image/webp"
                                            onChange={handleImageUpload}
                                            className="hidden"
                                        />

                                        <div className="flex items-center gap-2 pt-2 border-t border-black/5 dark:border-white/5">
                                            <button
                                                type="button"
                                                onClick={() => fileInputRef.current?.click()}
                                                className="flex-1 py-1.5 px-3 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-white/10 dark:hover:bg-white/20 text-slate-800 dark:text-slate-100 text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                                            >
                                                <Upload size={13} />
                                                <span>{customImage ? "Đổi ảnh khác" : "Chọn ảnh từ máy"}</span>
                                            </button>

                                            {customImage && (
                                                <button
                                                    type="button"
                                                    onClick={handleResetStatic}
                                                    className="py-1.5 px-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-black flex items-center justify-center gap-1 cursor-pointer transition-colors"
                                                    title="Xóa ảnh tùy chỉnh này"
                                                >
                                                    <Trash2 size={13} />
                                                </button>
                                            )}
                                        </div>

                                        <label className="flex items-center gap-2 cursor-pointer mt-0.5">
                                            <input
                                                type="checkbox"
                                                checked={syncToDashboard}
                                                onChange={(e) => setSyncToDashboard(e.target.checked)}
                                                className="w-3.5 h-3.5 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                                            />
                                            <span className="text-[10.5px] font-bold text-slate-600 dark:text-slate-400">
                                                Đồng thời đặt làm Avatar Dashboard cho tài khoản
                                            </span>
                                        </label>
                                    </div>

                                    {/* Option 3: Default LyangPOS Logo */}
                                    <div 
                                        onClick={() => handleSelectStaticSource('default')}
                                        className={cn(
                                            "p-3 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between gap-3",
                                            staticSource === 'default'
                                                ? "border-emerald-500 bg-emerald-500/10 dark:bg-emerald-500/15 shadow-md shadow-emerald-500/15"
                                                : "border-[#8b6f47]/20 dark:border-white/10 hover:border-emerald-400/60"
                                        )}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 rounded-xl overflow-hidden bg-black/5 dark:bg-white/10 flex items-center justify-center border border-black/10 shrink-0 shadow-xs p-1">
                                                <img src="/logo.png" alt="Default Logo" className="w-full h-full object-contain" />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-xs font-black text-slate-900 dark:text-slate-100">
                                                    Logo Mặc Định LyangPOS
                                                </span>
                                                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mt-0.5">
                                                    Sử dụng biểu tượng logo thương hiệu LyangPOS gốc
                                                </span>
                                            </div>
                                        </div>
                                        <div className={cn(
                                            "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors",
                                            staticSource === 'default' ? "border-emerald-500 bg-emerald-500 text-white" : "border-slate-400 dark:border-slate-600"
                                        )}>
                                            {staticSource === 'default' && <Check size={12} strokeWidth={3} />}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-3.5 sm:p-4 border-t border-[#8b6f47]/15 dark:border-white/10 flex items-center justify-between bg-black/[0.02] dark:bg-white/[0.02]">
                            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                                Chuột phải vào Logo sidebar để mở lại
                            </span>
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#2d5016] to-emerald-600 hover:from-[#244211] hover:to-emerald-700 text-white font-black text-xs uppercase tracking-wider shadow-md shadow-[#2d5016]/20 transition-all cursor-pointer"
                            >
                                Đóng
                            </button>
                        </div>
                    </m.div>
                </div>
            )}
        </AnimatePresence>
    );
}
