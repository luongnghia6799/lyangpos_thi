import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion as m, AnimatePresence } from 'framer-motion';
import { 
    Palette, X, RotateCcw, Check, Sparkles, Sliders, Eye, SunMedium, 
    Layers, Zap, Square, ShoppingCart, Clock, Bell, Image as ImageIcon,
    SlidersHorizontal, Compass, Move, Maximize2, ShieldAlert, Paintbrush, Droplet
} from 'lucide-react';
import { cn } from '../../lib/utils';
import BubbleCustomizerTab, { getBubbleComputedStyle, getButtonComputedStyle, getBubbleBadgeStyle, adjustColor, BUBBLE_PRESETS } from './BubbleCustomizerTab';

export { getBubbleComputedStyle, getButtonComputedStyle, getBubbleBadgeStyle, adjustColor, BUBBLE_PRESETS };

export const CART_COLOR_PRESETS = [
    {
        id: 'default',
        name: 'Mặc định (Lyang Theme)',
        desc: 'Tông màu tự nhiên chuẩn hệ thống',
        headerBg: 'default',
        headerText: 'default',
        borderColor: 'default',
        borderWidth: '1',
        accentColor: 'default',
        productTextColor: 'default',
        previewHeaderBg: '#8b6f47',
        previewBorder: '#8b6f47',
        previewAccent: '#2d5016'
    },
    {
        id: 'emerald',
        name: 'Xanh Ngọc Emerald',
        desc: 'Sang trọng, sáng sủa, thanh lịch',
        headerBg: '#064e3b',
        headerText: '#6ee7b7',
        borderColor: '#10b981',
        borderWidth: '2',
        accentColor: '#059669',
        productTextColor: 'default',
        previewHeaderBg: '#064e3b',
        previewBorder: '#10b981',
        previewAccent: '#059669'
    },
    {
        id: 'forest',
        name: 'Xanh Rêu Forest',
        desc: 'Đằm thắm, chuyên nghiệp, dịu mắt',
        headerBg: '#1e3a10',
        headerText: '#d9f99d',
        borderColor: '#2d5016',
        borderWidth: '2',
        accentColor: '#2d5016',
        productTextColor: 'default',
        previewHeaderBg: '#1e3a10',
        previewBorder: '#2d5016',
        previewAccent: '#2d5016'
    },
    {
        id: 'terracotta',
        name: 'Nâu Đất Cổ Điển',
        desc: 'Ấm áp, phong cách Vintage Lyang',
        headerBg: '#543b24',
        headerText: '#fde68a',
        borderColor: '#8b6f47',
        borderWidth: '2',
        accentColor: '#8b5a2b',
        productTextColor: 'default',
        previewHeaderBg: '#543b24',
        previewBorder: '#8b6f47',
        previewAccent: '#8b5a2b'
    },
    {
        id: 'navy',
        name: 'Xanh Biển Navy',
        desc: 'Công nghệ, hiện đại, sắc nét',
        headerBg: '#172554',
        headerText: '#93c5fd',
        borderColor: '#3b82f6',
        borderWidth: '2',
        accentColor: '#2563eb',
        productTextColor: 'default',
        previewHeaderBg: '#172554',
        previewBorder: '#3b82f6',
        previewAccent: '#2563eb'
    },
    {
        id: 'purple',
        name: 'Tím Hoàng Gia',
        desc: 'Huyền bí, thời thượng, đẳng cấp',
        headerBg: '#3b0764',
        headerText: '#e9d5ff',
        borderColor: '#8b5cf6',
        borderWidth: '2',
        accentColor: '#7c3aed',
        productTextColor: 'default',
        previewHeaderBg: '#3b0764',
        previewBorder: '#8b5cf6',
        previewAccent: '#7c3aed'
    },
    {
        id: 'rose',
        name: 'Đỏ Hồng Ruby',
        desc: 'Nổi bật, rực rỡ, năng động',
        headerBg: '#4c0519',
        headerText: '#fecdd3',
        borderColor: '#f43f5e',
        borderWidth: '2',
        accentColor: '#e11d48',
        productTextColor: 'default',
        previewHeaderBg: '#4c0519',
        previewBorder: '#f43f5e',
        previewAccent: '#e11d48'
    },
    {
        id: 'amber',
        name: 'Hổ Phách Warm Amber',
        desc: 'Ấm cúng, cuốn hút, tương phản cao',
        headerBg: '#451a03',
        headerText: '#fde68a',
        borderColor: '#f59e0b',
        borderWidth: '2',
        accentColor: '#d97706',
        productTextColor: 'default',
        previewHeaderBg: '#451a03',
        previewBorder: '#f59e0b',
        previewAccent: '#d97706'
    },
    {
        id: 'slate',
        name: 'Đen Slate Tối Giản',
        desc: 'Đen mun hiện đại, siêu nét',
        headerBg: '#0f172a',
        headerText: '#cbd5e1',
        borderColor: '#475569',
        borderWidth: '2',
        accentColor: '#334155',
        productTextColor: 'default',
        previewHeaderBg: '#0f172a',
        previewBorder: '#475569',
        previewAccent: '#334155'
    }
];

export const DEFAULT_CART_COLOR_CONFIG = {
    headerBg: 'default',
    headerText: 'default',
    borderColor: 'default',
    borderWidth: '1',
    accentColor: 'default',
    productTextColor: 'default',
    cartValuesColor: 'default',
    overlayColor: 'default',
    overlayOpacity: 30,
    overlayBlur: 12,
    enableBorder: true,
    enableGlow: true,
    enableShadow: true,
    // Bubble & Button customizations
    bubbleCustomMode: 'all',
    bubbleBg: 'default',
    bubbleTextColor: 'default',
    bubbleBorderColor: 'default',
    bubbleBorderWidth: '2',
    bubbleEnableBorder: true,
    bubbleShadowY: 10,
    bubbleShadowBlur: 22,
    bubbleShadowColor: 'default',
    bubbleShadowOpacity: 24,
    bubbleEnableGlow: false,
    bubbleGlowColor: '#10b981',
    bubbleGlowIntensity: 15,
    bubblePartnerBg: 'default',
    bubblePartnerTextColor: 'default',
    bubblePartnerBorder: 'default',
    bubblePartnerGlow: 'default',
    bubbleCashBg: 'default',
    bubbleCashTextColor: 'default',
    bubbleCashBorder: 'default',
    bubbleCashGlow: 'default',
    bubblePaymentBg: 'default',
    bubblePaymentTextColor: 'default',
    bubblePaymentBorder: 'default',
    bubblePaymentGlow: 'default',
    bubbleTotalBg: 'default',
    bubbleTotalTextColor: 'default',
    bubbleTotalBorder: 'default',
    bubbleTotalGlow: 'default',
    btnBg: 'default',
    btnTextColor: 'default',
    btnBorderColor: 'default',
    btnBorderWidth: '2',
    btnEnableBorder: true,
    btnShadowY: 8,
    btnShadowBlur: 18,
    btnShadowColor: 'default',
    btnShadowOpacity: 22,
    btnEnableGlow: false,
    btnGlowColor: '#2d5016',
    btnGlowIntensity: 12,
    btnSavePrintBg: 'default',
    btnSavePrintTextColor: 'default',
    btnSavePrintBorder: 'default',
    btnSavePrintShadowY: 10,
    btnSavePrintEnableGlow: true,
    btnSavePrintGlowColor: '#10b981',
    // Text Pills customization
    enableTextPills: false,
    textPillStyle: 'glass', // 'glass' | 'neon' | 'theme'
    pillBgColor: 'default',
    pillBorderColor: 'default',
    pillBlur: 12,
    pillOpacity: 25,
    pillRadius: 16, // px (0 to 99)
    pillGlow: true,
    // Text Glow & Text Shadow customization
    textShadowMode: 'none', // 'none' | 'glow' | 'shadow' | 'both'
    textGlowColor: 'default',
    textShadowColor: 'default',
    textShadowBlur: 6
};

export const getCartTextShadowStyle = (config, baseColor = null) => {
    const mode = config?.textShadowMode || 'none';
    if (!mode || mode === 'none') return null;

    const accent = (config?.accentColor && config.accentColor !== 'default') ? config.accentColor : '#2d5016';
    const glowCol = (config?.textGlowColor && config.textGlowColor !== 'default') 
        ? config.textGlowColor 
        : (baseColor || accent || '#10b981');
    const shadowCol = (config?.textShadowColor && config.textShadowColor !== 'default') 
        ? config.textShadowColor 
        : 'rgba(0, 0, 0, 0.45)';
    const blur = (config?.textShadowBlur !== undefined && config?.textShadowBlur !== null && config?.textShadowBlur !== '') 
        ? Number(config.textShadowBlur) 
        : 6;

    if (mode === 'glow') {
        return {
            textShadow: `0 0 ${blur}px ${glowCol}99, 0 0 ${blur * 2}px ${glowCol}45`
        };
    }

    if (mode === 'shadow') {
        return {
            textShadow: `0 2px ${blur}px ${shadowCol}, 0 1px 2px rgba(0, 0, 0, 0.35)`
        };
    }

    if (mode === 'both') {
        return {
            textShadow: `0 2px ${blur}px ${shadowCol}, 0 0 ${blur * 1.5}px ${glowCol}80`
        };
    }

    return null;
};

export const getCartTextPillStyle = (config, type = 'default') => {
    if (!config?.enableTextPills) return null;
    const style = config?.textPillStyle || 'glass';
    const accent = (config?.accentColor && config.accentColor !== 'default') ? config.accentColor : '#2d5016';
    const borderCol = (config?.borderColor && config.borderColor !== 'default') ? config.borderColor : accent;

    // Custom overrides if set
    const customBg = (config?.pillBgColor && config.pillBgColor !== 'default') ? config.pillBgColor : null;
    const customBorder = (config?.pillBorderColor && config.pillBorderColor !== 'default') ? config.pillBorderColor : null;
    const customBlur = (config?.pillBlur !== undefined && config?.pillBlur !== null && config?.pillBlur !== '') ? Number(config.pillBlur) : null;
    const customOpacity = (config?.pillOpacity !== undefined && config?.pillOpacity !== null && config?.pillOpacity !== '') ? (Number(config.pillOpacity) / 100) : null;
    const customRadius = (config?.pillRadius !== undefined && config?.pillRadius !== null && config?.pillRadius !== '') ? Number(config.pillRadius) : 16;
    const borderRadius = `${customRadius}px`;
    const enableGlow = config?.pillGlow !== false;

    if (style === 'neon') {
        const bgAlpha = customOpacity !== null ? customOpacity : 0.12;
        const blurVal = customBlur !== null ? customBlur : 8;
        const finalBorder = customBorder || `${borderCol}80`;
        const finalBg = customBg ? (hexToRgba(customBg, bgAlpha) || `${customBg}20`) : (hexToRgba(accent, bgAlpha) || `${accent}18`);
        const glowColor = customBorder || borderCol;

        return {
            backgroundColor: finalBg,
            borderColor: finalBorder,
            borderRadius,
            boxShadow: enableGlow ? `0 0 12px ${glowColor}40` : '0 1px 4px rgba(0,0,0,0.06)',
            backdropFilter: blurVal > 0 ? `blur(${blurVal}px)` : 'none',
            WebkitBackdropFilter: blurVal > 0 ? `blur(${blurVal}px)` : 'none'
        };
    }

    if (style === 'theme') {
        const bgAlpha = customOpacity !== null ? customOpacity : 0.18;
        const blurVal = customBlur !== null ? customBlur : 8;
        const finalBorder = customBorder || `${accent}40`;
        const finalBg = customBg ? (hexToRgba(customBg, bgAlpha) || `${customBg}25`) : (hexToRgba(accent, bgAlpha) || `${accent}22`);

        return {
            backgroundColor: finalBg,
            borderColor: finalBorder,
            borderRadius,
            boxShadow: enableGlow ? `0 2px 10px rgba(0,0,0,0.08), 0 0 8px ${accent}20` : '0 2px 8px rgba(0,0,0,0.06)',
            backdropFilter: blurVal > 0 ? `blur(${blurVal}px)` : 'none',
            WebkitBackdropFilter: blurVal > 0 ? `blur(${blurVal}px)` : 'none'
        };
    }

    // Default: 'glass'
    const bgAlpha = customOpacity !== null ? customOpacity : 0.22;
    const blurVal = customBlur !== null ? customBlur : 12;
    const finalBg = customBg 
        ? (hexToRgba(customBg, bgAlpha) || `rgba(255, 255, 255, ${bgAlpha})`)
        : `rgba(255, 255, 255, ${bgAlpha})`;
    const finalBorder = customBorder || 'rgba(255, 255, 255, 0.45)';

    return {
        backgroundColor: finalBg,
        borderColor: finalBorder,
        borderRadius,
        boxShadow: enableGlow 
            ? '0 4px 15px rgba(0, 0, 0, 0.08), inset 0 1px 1px rgba(255, 255, 255, 0.6), 0 0 8px rgba(255, 255, 255, 0.25)' 
            : '0 4px 15px rgba(0, 0, 0, 0.08), inset 0 1px 1px rgba(255, 255, 255, 0.6)',
        backdropFilter: blurVal > 0 ? `blur(${blurVal}px)` : 'none',
        WebkitBackdropFilter: blurVal > 0 ? `blur(${blurVal}px)` : 'none'
    };
};

export const hexToRgba = (hex, alpha = 1) => {
    if (!hex || hex === 'default') return null;
    let cleanHex = hex.replace('#', '');
    if (cleanHex.length === 3) {
        cleanHex = cleanHex.split('').map(c => c + c).join('');
    }
    if (cleanHex.length !== 6) return null;
    const r = parseInt(cleanHex.substring(0, 2), 16);
    const g = parseInt(cleanHex.substring(2, 4), 16);
    const b = parseInt(cleanHex.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export const getCartOverlayStyle = (config, isTransparent) => {
    if (!isTransparent) {
        return {
            backgroundColor: 'transparent',
            backdropFilter: 'none',
            WebkitBackdropFilter: 'none'
        };
    }
    const color = config?.overlayColor;
    const opacity = (config?.overlayOpacity !== undefined && config?.overlayOpacity !== null && config?.overlayOpacity !== '') 
        ? Number(config.overlayOpacity) 
        : 30;
    const blur = (config?.overlayBlur !== undefined && config?.overlayBlur !== null && config?.overlayBlur !== '') 
        ? Number(config.overlayBlur) 
        : 12;

    const blurStr = blur > 0 ? `blur(${blur}px)` : 'none';

    if (color && color !== 'default') {
        const rgba = hexToRgba(color, opacity / 100) || color;
        return {
            backgroundColor: rgba,
            backdropFilter: blurStr,
            WebkitBackdropFilter: blurStr
        };
    }

    return {
        backgroundColor: `color-mix(in srgb, var(--card, var(--bg-color, #ffffff)) ${opacity}%, transparent)`,
        backdropFilter: blurStr,
        WebkitBackdropFilter: blurStr
    };
};

export const applyCartThemeToDom = (config) => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    const cfg = config || (() => {
        try {
            return JSON.parse(localStorage.getItem('pos_cart_color_config') || '{}');
        } catch (e) {
            return {};
        }
    })();

    if (cfg && cfg.accentColor && cfg.accentColor !== 'default') {
        const color = cfg.accentColor;
        root.style.setProperty('--primary-color', color);
        root.style.setProperty('--color-primary', color);
        root.style.setProperty('--color-ring', color);
        
        const hex = color.replace('#', '');
        if (hex.length === 6) {
            const r = parseInt(hex.substring(0, 2), 16);
            const g = parseInt(hex.substring(2, 4), 16);
            const b = parseInt(hex.substring(4, 6), 16);
            root.style.setProperty('--primary-rgb', `${r}, ${g}, ${b}`);
            
            const hr = Math.max(0, Math.floor(r * 0.85));
            const hg = Math.max(0, Math.floor(g * 0.85));
            const hb = Math.max(0, Math.floor(b * 0.85));
            const hoverHex = `#${hr.toString(16).padStart(2, '0')}${hg.toString(16).padStart(2, '0')}${hb.toString(16).padStart(2, '0')}`;
            root.style.setProperty('--primary-hover', hoverHex);
            root.style.setProperty('--color-primary-hover', hoverHex);
        }
    } else {
        root.style.removeProperty('--primary-color');
        root.style.removeProperty('--color-primary');
        root.style.removeProperty('--color-ring');
        root.style.removeProperty('--primary-rgb');
        root.style.removeProperty('--primary-hover');
        root.style.removeProperty('--color-primary-hover');
    }

    if (cfg && cfg.productTextColor && cfg.productTextColor !== 'default') {
        root.style.setProperty('--text-main', cfg.productTextColor);
        root.style.setProperty('--product-text-color', cfg.productTextColor);
    } else {
        root.style.removeProperty('--text-main');
        root.style.removeProperty('--product-text-color');
    }

    if (cfg && cfg.cartValuesColor && cfg.cartValuesColor !== 'default') {
        root.style.setProperty('--cart-values-color', cfg.cartValuesColor);
    } else {
        root.style.removeProperty('--cart-values-color');
    }
};

export const getCartBoxShadow = (config) => {
    if (!config) return undefined;
    const hasGlow = config.enableGlow !== false && config.enableGlow !== 'false';
    const hasShadow = config.enableShadow !== false && config.enableShadow !== 'false';
    
    if (!hasGlow && !hasShadow) return 'none';
    
    const isCustomBorder = config.borderColor && config.borderColor !== 'default';
    const col = isCustomBorder ? config.borderColor : '#8b6f47';
    
    const shadows = [];
    if (hasGlow) {
        shadows.push(`0 0 25px ${col}25`, `0 0 10px ${col}18`);
    }
    if (hasShadow) {
        shadows.push(`0 8px 32px ${col}18`, `0 4px 16px rgba(0,0,0,0.08)`);
    }
    return shadows.join(', ');
};

export default function CartColorCustomizerModal({ 
    isOpen, 
    onClose, 
    config, 
    onChangeConfig,
    activeTab: initialTab = 'colors'
}) {
    const [activeTab, setActiveTab] = useState(initialTab);

    // Additional display settings stored in localStorage
    const [transparentCartTable, setTransparentCartTable] = useState(() => localStorage.getItem("pos_transparent_cart_table") === "true");
    const [showLastPurchaseBadge, setShowLastPurchaseBadge] = useState(() => localStorage.getItem("pos_show_last_purchase_badge") !== "false");
    const [showEmptyCartGuide, setShowEmptyCartGuide] = useState(() => localStorage.getItem("pos_show_empty_cart_guide") !== "false");

    // Mascot Watermark settings
    const [mascotWatermarkVisible, setMascotWatermarkVisible] = useState(() => localStorage.getItem("pos_mascot_watermark_visible") !== "false");
    const [mascotWatermarkPos, setMascotWatermarkPos] = useState(() => localStorage.getItem("pos_mascot_watermark_pos") || "bottom-right");
    const [mascotWatermarkScale, setMascotWatermarkScale] = useState(() => parseFloat(localStorage.getItem("pos_mascot_watermark_scale") || "100"));
    const [mascotWatermarkOpacity, setMascotWatermarkOpacity] = useState(() => parseFloat(localStorage.getItem("pos_mascot_watermark_opacity") || "15"));
    const [mascotWatermarkRotate, setMascotWatermarkRotate] = useState(() => parseFloat(localStorage.getItem("pos_mascot_watermark_rotate") || "-6"));
    const [mascotWatermarkOffsetX, setMascotWatermarkOffsetX] = useState(() => parseFloat(localStorage.getItem("pos_mascot_watermark_offset_x") || "10"));
    const [mascotWatermarkOffsetY, setMascotWatermarkOffsetY] = useState(() => parseFloat(localStorage.getItem("pos_mascot_watermark_offset_y") || "10"));

    useEffect(() => {
        if (isOpen) {
            setTransparentCartTable(localStorage.getItem("pos_transparent_cart_table") === "true");
            setShowLastPurchaseBadge(localStorage.getItem("pos_show_last_purchase_badge") !== "false");
            setShowEmptyCartGuide(localStorage.getItem("pos_show_empty_cart_guide") !== "false");
            setMascotWatermarkVisible(localStorage.getItem("pos_mascot_watermark_visible") !== "false");
            setMascotWatermarkPos(localStorage.getItem("pos_mascot_watermark_pos") || "bottom-right");
            setMascotWatermarkScale(parseFloat(localStorage.getItem("pos_mascot_watermark_scale") || "100"));
            setMascotWatermarkOpacity(parseFloat(localStorage.getItem("pos_mascot_watermark_opacity") || "15"));
            setMascotWatermarkRotate(parseFloat(localStorage.getItem("pos_mascot_watermark_rotate") || "-6"));
            setMascotWatermarkOffsetX(parseFloat(localStorage.getItem("pos_mascot_watermark_offset_x") || "10"));
            setMascotWatermarkOffsetY(parseFloat(localStorage.getItem("pos_mascot_watermark_offset_y") || "10"));
            if (initialTab) setActiveTab(initialTab);
        }
    }, [isOpen, initialTab]);

    if (!isOpen) return null;

    const currentConfig = { ...DEFAULT_CART_COLOR_CONFIG, ...config };

    const broadcastSetting = (key, value) => {
        try {
            const syncChan = new BroadcastChannel('pos_data_sync');
            syncChan.postMessage({ type: 'UI_SETTING_UPDATED', key, value });
            syncChan.close();
        } catch (e) {}
    };

    const handleToggleTransparent = () => {
        const val = !transparentCartTable;
        setTransparentCartTable(val);
        localStorage.setItem("pos_transparent_cart_table", val ? "true" : "false");
        broadcastSetting("pos_transparent_cart_table", val ? "true" : "false");
    };

    const handleToggleLastPurchaseBadge = () => {
        const val = !showLastPurchaseBadge;
        setShowLastPurchaseBadge(val);
        localStorage.setItem("pos_show_last_purchase_badge", val ? "true" : "false");
        broadcastSetting("pos_show_last_purchase_badge", val ? "true" : "false");
    };

    const handleToggleEmptyCartGuide = () => {
        const val = !showEmptyCartGuide;
        setShowEmptyCartGuide(val);
        localStorage.setItem("pos_show_empty_cart_guide", val ? "true" : "false");
        broadcastSetting("pos_show_empty_cart_guide", val ? "true" : "false");
    };

    const handleToggleMascotVisible = () => {
        const val = !mascotWatermarkVisible;
        setMascotWatermarkVisible(val);
        localStorage.setItem("pos_mascot_watermark_visible", String(val));
        broadcastSetting("pos_mascot_watermark_visible", String(val));
    };

    const handleApplyPreset = (preset) => {
        const newCfg = {
            ...currentConfig,
            headerBg: preset.headerBg,
            headerText: preset.headerText,
            borderColor: preset.borderColor,
            borderWidth: preset.borderWidth,
            accentColor: preset.accentColor || 'default',
            productTextColor: preset.productTextColor || 'default'
        };
        onChangeConfig(newCfg);
        applyCartThemeToDom(newCfg);
    };

    const handleResetColors = () => {
        onChangeConfig(DEFAULT_CART_COLOR_CONFIG);
        applyCartThemeToDom(DEFAULT_CART_COLOR_CONFIG);
    };

    const handleResetMascot = () => {
        setMascotWatermarkOffsetX(10);
        setMascotWatermarkOffsetY(10);
        setMascotWatermarkRotate(-6);
        setMascotWatermarkScale(100);
        setMascotWatermarkOpacity(15);
        setMascotWatermarkPos("bottom-right");
        localStorage.setItem("pos_mascot_watermark_offset_x", "10");
        localStorage.setItem("pos_mascot_watermark_offset_y", "10");
        localStorage.setItem("pos_mascot_watermark_rotate", "-6");
        localStorage.setItem("pos_mascot_watermark_scale", "100");
        localStorage.setItem("pos_mascot_watermark_opacity", "15");
        localStorage.setItem("pos_mascot_watermark_pos", "bottom-right");
    };

    const colorSwatches = [
        '#2d5016', '#10b981', '#064e3b', '#8b6f47', '#543b24',
        '#2563eb', '#1d4ed8', '#7c3aed', '#db2777', '#e11d48',
        '#d97706', '#0f172a', '#334155', '#475569', '#ffffff', '#000000'
    ];

    if (typeof document === 'undefined') return null;

    const activeAccentColor = currentConfig.accentColor !== 'default' ? currentConfig.accentColor : '#2d5016';

    return createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-5">
            <m.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="fixed inset-0 bg-black/65 backdrop-blur-md"
            />

            <m.div
                initial={{ opacity: 0, scale: 0.94, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.94, y: 15 }}
                transition={{ type: "spring", stiffness: 350, damping: 28 }}
                className="relative w-full max-w-3xl bg-[#faf8f3] dark:bg-[#071510] border border-[#8b6f47]/30 dark:border-emerald-500/30 rounded-[2rem] shadow-[0_25px_80px_rgba(0,0,0,0.55)] overflow-hidden z-10 flex flex-col max-h-[92vh]"
            >
                {/* Header with Navigation Tabs */}
                <div className="px-6 pt-5 pb-3 border-b border-[#8b6f47]/15 dark:border-white/10 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div 
                                className="w-11 h-11 rounded-2xl text-white flex items-center justify-center shadow-md transition-all"
                                style={{ 
                                    backgroundColor: activeAccentColor,
                                    boxShadow: `0 8px 20px ${activeAccentColor}40`
                                }}
                            >
                                <Palette size={22} strokeWidth={2.5} />
                            </div>
                            <div>
                                <h3 className="font-black text-base uppercase tracking-wider text-slate-800 dark:text-slate-100 flex items-center gap-2">
                                    <span>Tùy Chỉnh Giỏ Hàng & Giao Diện Bảng</span>
                                    <span className="text-[10px] bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 font-extrabold px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                                        Live Preview
                                    </span>
                                </h3>
                                <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                                    Tông màu, viền neon, lớp kính mờ, các badge hiển thị và linh vật chìm
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-9 h-9 rounded-2xl flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                        >
                            <X size={20} strokeWidth={2.5} />
                        </button>
                    </div>

                    {/* Segmented Control / Tabs */}
                    <div className="flex items-center p-1 bg-black/5 dark:bg-white/5 rounded-2xl gap-1 border border-black/5 dark:border-white/10 overflow-x-auto custom-scrollbar">
                        <button
                            type="button"
                            onClick={() => setActiveTab('colors')}
                            className={cn(
                                "flex-1 min-w-[110px] py-2 px-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap",
                                activeTab === 'colors'
                                    ? "bg-white dark:bg-[#0e271d] text-slate-800 dark:text-emerald-400 shadow-sm border border-black/5 dark:border-emerald-500/30"
                                    : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                            )}
                        >
                            <Palette size={14} strokeWidth={2.5} className="shrink-0" />
                            <span>1. Màu Giỏ Hàng</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('displays')}
                            className={cn(
                                "flex-1 min-w-[110px] py-2 px-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap",
                                activeTab === 'displays'
                                    ? "bg-white dark:bg-[#0e271d] text-slate-800 dark:text-emerald-400 shadow-sm border border-black/5 dark:border-emerald-500/30"
                                    : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                            )}
                        >
                            <SlidersHorizontal size={14} strokeWidth={2.5} className="shrink-0" />
                            <span>2. Hiển Thị & Mờ Kính</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('mascot')}
                            className={cn(
                                "flex-1 min-w-[110px] py-2 px-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap",
                                activeTab === 'mascot'
                                    ? "bg-white dark:bg-[#0e271d] text-slate-800 dark:text-emerald-400 shadow-sm border border-black/5 dark:border-emerald-500/30"
                                    : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                            )}
                        >
                            <ImageIcon size={14} strokeWidth={2.5} className="shrink-0" />
                            <span>3. Mascot Chìm</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('bubbles')}
                            className={cn(
                                "flex-1 min-w-[130px] py-2 px-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap",
                                activeTab === 'bubbles'
                                    ? "bg-white dark:bg-[#0e271d] text-slate-800 dark:text-emerald-400 shadow-sm border border-black/5 dark:border-emerald-500/30"
                                    : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                            )}
                        >
                            <Sparkles size={14} strokeWidth={2.5} className="text-amber-500 shrink-0" />
                            <span>4. Bubble & Nút Bấm</span>
                        </button>
                    </div>
                </div>

                {/* Content Area */}
                <div className="p-6 overflow-y-auto space-y-6 custom-scrollbar flex-1">
                    {/* Live Preview Box (Always pinned at top of modal) */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                            <span className="flex items-center gap-1.5">
                                <Eye size={14} className="text-emerald-600 dark:text-emerald-400" />
                                Xem trước giỏ hàng thực tế (Live Preview)
                            </span>
                            <span className="text-[10px] text-slate-400 lowercase font-medium">
                                thay đổi có hiệu lực ngay
                            </span>
                        </div>

                        <div 
                            className={cn(
                                "w-full rounded-2xl overflow-hidden transition-all duration-300 relative",
                                transparentCartTable && (!currentConfig.overlayColor || currentConfig.overlayColor === 'default') ? "bg-card/40" : (!transparentCartTable ? "bg-white/70 dark:bg-slate-900/60" : "")
                            )}
                            style={{
                                ...getCartOverlayStyle(currentConfig, transparentCartTable),
                                border: currentConfig.enableBorder !== false ? `${currentConfig.borderWidth || '1'}px solid ${currentConfig.borderColor !== 'default' ? currentConfig.borderColor : '#8b6f4740'}` : 'none',
                                boxShadow: getCartBoxShadow(currentConfig)
                            }}
                        >
                            {/* Watermark in Preview if enabled */}
                            {mascotWatermarkVisible && (
                                <div 
                                    className={cn(
                                        "absolute pointer-events-none select-none z-0 overflow-hidden flex transition-all duration-200",
                                        mascotWatermarkPos === "bottom-right" ? "right-2 bottom-2 items-end justify-end" :
                                        mascotWatermarkPos === "bottom-left" ? "left-2 bottom-2 items-end justify-start" :
                                        mascotWatermarkPos === "top-right" ? "right-2 top-2 items-start justify-end" :
                                        mascotWatermarkPos === "top-left" ? "left-2 top-2 items-start justify-start" :
                                        "inset-0 items-center justify-center"
                                    )}
                                    style={{ opacity: (mascotWatermarkOpacity || 15) / 100 }}
                                >
                                    <img
                                        src="/assets/images/user_mascot.png"
                                        alt="Watermark Preview"
                                        className="object-contain"
                                        style={{
                                            width: `${(mascotWatermarkScale || 100) * 0.7}px`,
                                            height: `${(mascotWatermarkScale || 100) * 0.7}px`,
                                            transform: `translate(${mascotWatermarkOffsetX * 0.4}px, ${mascotWatermarkOffsetY * 0.4}px) rotate(${mascotWatermarkRotate}deg)`
                                        }}
                                    />
                                </div>
                            )}

                            <table className="w-full text-left border-collapse table-fixed text-xs relative z-10">
                                <thead>
                                    <tr 
                                        style={{
                                            backgroundColor: currentConfig.headerBg !== 'default' ? currentConfig.headerBg : 'transparent',
                                            color: currentConfig.headerText !== 'default' ? currentConfig.headerText : '#8b6f47'
                                        }}
                                        className="transition-colors duration-200 border-b border-black/10 dark:border-white/10"
                                    >
                                        <th className="py-2 px-3 font-black uppercase text-[10px] w-12 text-center" style={{ color: currentConfig.headerText !== 'default' ? currentConfig.headerText : undefined }}>Stt</th>
                                        <th className="py-2 px-3 font-black uppercase text-[10px]" style={{ color: currentConfig.headerText !== 'default' ? currentConfig.headerText : undefined }}>
                                            <div className="flex items-center gap-2">
                                                <span>Tên sản phẩm</span>
                                                <span 
                                                    className="px-2 py-0.5 rounded-full text-[9px] font-black text-white shadow-xs"
                                                    style={{ backgroundColor: activeAccentColor }}
                                                >
                                                    1 món
                                                </span>
                                            </div>
                                        </th>
                                        <th className="py-2 px-3 font-black uppercase text-[10px] text-center w-20" style={{ color: currentConfig.headerText !== 'default' ? currentConfig.headerText : undefined }}>Số lượng</th>
                                        <th className="py-2 px-3 font-black uppercase text-[10px] text-right w-24" style={{ color: currentConfig.headerText !== 'default' ? currentConfig.headerText : undefined }}>Đơn giá</th>
                                        <th className="py-2 px-3 font-black uppercase text-[10px] text-right w-28" style={{ color: currentConfig.headerText !== 'default' ? currentConfig.headerText : undefined }}>Thành tiền</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr 
                                        className="border-b border-black/5 dark:border-white/5 transition-colors"
                                        style={{
                                            borderColor: currentConfig.borderColor !== 'default' ? `${currentConfig.borderColor}30` : undefined
                                        }}
                                    >
                                        <td className="py-2.5 px-3 text-center font-bold text-slate-400">
                                            {currentConfig.enableTextPills ? (
                                                <span 
                                                    className="inline-flex items-center justify-center px-2 py-0.5 rounded-full border text-xs font-black shadow-xs"
                                                    style={getCartTextPillStyle(currentConfig, 'index')}
                                                >
                                                    1
                                                </span>
                                            ) : (
                                                <span>1</span>
                                            )}
                                        </td>
                                        <td className="py-2.5 px-3">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <div 
                                                    className={cn(
                                                        "font-black text-slate-800 dark:text-slate-100 uppercase",
                                                        currentConfig.enableTextPills && "px-2.5 py-1 rounded-xl border shadow-xs inline-flex items-center"
                                                    )}
                                                    style={{
                                                        color: (currentConfig.productTextColor && currentConfig.productTextColor !== 'default')
                                                            ? currentConfig.productTextColor
                                                            : undefined,
                                                        ...(currentConfig.enableTextPills ? getCartTextPillStyle(currentConfig, 'name') : {}),
                                                        ...getCartTextShadowStyle(currentConfig, currentConfig.productTextColor)
                                                    }}
                                                >
                                                    Sản phẩm mẫu VIP
                                                </div>
                                            </div>
                                            {showLastPurchaseBadge && (
                                                <div className="inline-flex items-center gap-1 mt-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 animate-in fade-in zoom-in-90 duration-200 transition-all">
                                                    <Clock size={10} /> Mua gần nhất: 2 ngày trước
                                                </div>
                                            )}
                                        </td>
                                        <td className="py-2.5 px-3 text-center font-black">
                                            <span 
                                                className={cn(
                                                    "inline-flex items-center justify-center min-w-[28px]",
                                                    currentConfig.enableTextPills && "px-2 py-1 rounded-xl border shadow-xs"
                                                )}
                                                style={{
                                                    color: (currentConfig.cartValuesColor && currentConfig.cartValuesColor !== 'default') ? currentConfig.cartValuesColor : activeAccentColor,
                                                    ...(currentConfig.enableTextPills ? getCartTextPillStyle(currentConfig, 'qty') : {}),
                                                    ...getCartTextShadowStyle(currentConfig, currentConfig.cartValuesColor)
                                                }}
                                            >
                                                2
                                            </span>
                                        </td>
                                        <td className="py-2.5 px-3 text-right font-black">
                                            <span 
                                                className={cn(
                                                    "inline-flex items-center justify-end",
                                                    currentConfig.enableTextPills && "px-2 py-1 rounded-xl border shadow-xs"
                                                )}
                                                style={{
                                                    color: (currentConfig.cartValuesColor && currentConfig.cartValuesColor !== 'default') ? currentConfig.cartValuesColor : undefined,
                                                    ...(currentConfig.enableTextPills ? getCartTextPillStyle(currentConfig, 'price') : {}),
                                                    ...getCartTextShadowStyle(currentConfig, currentConfig.cartValuesColor)
                                                }}
                                            >
                                                150.000
                                            </span>
                                        </td>
                                        <td className="py-2.5 px-3 text-right font-black">
                                            <span 
                                                className={cn(
                                                    "inline-flex items-center justify-end",
                                                    currentConfig.enableTextPills && "px-2.5 py-1 rounded-xl border shadow-xs"
                                                )}
                                                style={{
                                                    color: (currentConfig.cartValuesColor && currentConfig.cartValuesColor !== 'default') ? currentConfig.cartValuesColor : activeAccentColor,
                                                    ...(currentConfig.enableTextPills ? getCartTextPillStyle(currentConfig, 'amount') : {}),
                                                    ...getCartTextShadowStyle(currentConfig, currentConfig.cartValuesColor || activeAccentColor)
                                                }}
                                            >
                                                300.000đ
                                            </span>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>

                            {/* Sample active bar preview */}
                            <div className="p-2.5 bg-black/[0.02] dark:bg-white/[0.02] border-t border-black/5 dark:border-white/5 flex items-center justify-between gap-3 text-[11px] relative z-10">
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-bold text-slate-400">Nút Active:</span>
                                    <div 
                                        className="px-3 py-1 rounded-xl text-white font-black text-[10px] shadow-sm flex items-center gap-1.5"
                                        style={{
                                            background: `linear-gradient(90deg, ${activeAccentColor}, ${currentConfig.borderColor !== 'default' ? currentConfig.borderColor : activeAccentColor})`
                                        }}
                                    >
                                        <Check size={12} strokeWidth={3} />
                                        TIỀN MẶT
                                    </div>
                                </div>
                                <div 
                                    className="px-3.5 py-1.5 rounded-xl text-white font-black text-xs shadow-md flex items-center gap-2"
                                    style={{
                                        background: `linear-gradient(135deg, ${activeAccentColor}, ${currentConfig.borderColor !== 'default' ? currentConfig.borderColor : activeAccentColor}dd)`
                                    }}
                                >
                                    <span className="text-[9px] uppercase tracking-wider opacity-85">TỔNG CỘNG:</span>
                                    <span>300.000đ</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* TAB 1: COLORS & BORDERS */}
                    {activeTab === 'colors' && (
                        <div className="space-y-6">
                            {/* Presets Grid */}
                            <div className="space-y-2.5">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                        <Sparkles size={14} className="text-amber-500" />
                                        Bộ sưu tập Theme mẫu (Presets)
                                    </h4>
                                    <button
                                        type="button"
                                        onClick={handleResetColors}
                                        className="flex items-center gap-1 text-[10px] font-bold text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                                    >
                                        <RotateCcw size={11} />
                                        <span>Khôi phục mặc định</span>
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                                    {CART_COLOR_PRESETS.map((preset) => {
                                        const isSelected = currentConfig.headerBg === preset.headerBg && 
                                                           currentConfig.headerText === preset.headerText && 
                                                           currentConfig.borderColor === preset.borderColor &&
                                                           (currentConfig.accentColor || 'default') === (preset.accentColor || 'default') &&
                                                           (currentConfig.productTextColor || 'default') === (preset.productTextColor || 'default') &&
                                                           (currentConfig.borderWidth || '1') === preset.borderWidth;
                                        return (
                                            <button
                                                key={preset.id}
                                                type="button"
                                                onClick={() => handleApplyPreset(preset)}
                                                className={cn(
                                                    "relative flex flex-col p-2.5 rounded-2xl border text-left transition-all cursor-pointer shadow-xs hover:scale-[1.02] active:scale-98 group",
                                                    isSelected
                                                        ? "border-emerald-500 dark:border-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/30 ring-2 ring-emerald-500/20"
                                                        : "border-black/10 dark:border-white/10 bg-white/50 dark:bg-slate-900/40 hover:border-black/20 dark:hover:border-white/20"
                                                )}
                                            >
                                                <div className="flex items-center justify-between w-full mb-1.5">
                                                    <span className="font-black text-xs text-slate-800 dark:text-slate-100 truncate">
                                                        {preset.name}
                                                    </span>
                                                    {isSelected && (
                                                        <div className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
                                                            <Check size={10} strokeWidth={3} />
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="flex items-center gap-1.5">
                                                    <div 
                                                        className="w-4 h-4 rounded-md border border-black/10 shadow-inner shrink-0" 
                                                        style={{ backgroundColor: preset.previewHeaderBg }}
                                                        title="Màu nền Header"
                                                    />
                                                    <div 
                                                        className="w-4 h-4 rounded-md border-2 shrink-0" 
                                                        style={{ borderColor: preset.previewBorder, backgroundColor: 'transparent' }}
                                                        title="Màu viền"
                                                    />
                                                    <div 
                                                        className="w-4 h-4 rounded-md shadow-xs shrink-0" 
                                                        style={{ backgroundColor: preset.previewAccent || preset.previewBorder }}
                                                        title="Màu nút & Active"
                                                    />
                                                    <span className="text-[9px] font-bold text-slate-400 truncate flex-1 min-w-0">
                                                        {preset.desc}
                                                    </span>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Custom Controls */}
                            <div className="space-y-4 pt-2 border-t border-[#8b6f47]/20 dark:border-white/10">
                                <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                    <Sliders size={14} className="text-emerald-600 dark:text-emerald-400" />
                                    Tùy Chỉnh Màu Sắc Từng Phần (Custom Palette)
                                </h4>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {/* Accent Color / Active elements */}
                                    <div className="space-y-2 sm:col-span-2 p-3 rounded-2xl bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/20">
                                        <label className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center justify-between">
                                            <span className="flex items-center gap-1.5">
                                                <Zap size={14} className="text-amber-500" />
                                                Màu Tô Đậm / Điểm Nhấn (Nút, Active, Thẻ Tổng Tiền):
                                            </span>
                                            <span className="font-mono text-[10px] text-emerald-700 dark:text-emerald-400 font-bold">
                                                {currentConfig.accentColor === 'default' ? 'Mặc định (Lyang Green)' : currentConfig.accentColor}
                                            </span>
                                        </label>
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const newCfg = { ...currentConfig, accentColor: 'default' };
                                                    onChangeConfig(newCfg);
                                                    applyCartThemeToDom(newCfg);
                                                }}
                                                className={cn(
                                                    "px-3 py-1.5 text-xs font-black rounded-xl border transition-all cursor-pointer",
                                                    currentConfig.accentColor === 'default'
                                                        ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                                                        : "bg-black/5 dark:bg-white/5 text-slate-600 dark:text-slate-400 border-black/10 dark:border-white/10"
                                                )}
                                            >
                                                Mặc định
                                            </button>
                                            <div className="relative flex items-center gap-1.5 flex-1">
                                                <input
                                                    type="color"
                                                    value={currentConfig.accentColor === 'default' ? '#2d5016' : currentConfig.accentColor}
                                                    onChange={(e) => {
                                                        const newCfg = { ...currentConfig, accentColor: e.target.value };
                                                        onChangeConfig(newCfg);
                                                        applyCartThemeToDom(newCfg);
                                                    }}
                                                    className="w-9 h-9 rounded-xl cursor-pointer border border-black/10 p-0.5 bg-transparent shadow-xs"
                                                />
                                                <input
                                                    type="text"
                                                    value={currentConfig.accentColor === 'default' ? '' : currentConfig.accentColor}
                                                    placeholder="#HEX (vd: #059669)..."
                                                    onChange={(e) => {
                                                        const newCfg = { ...currentConfig, accentColor: e.target.value };
                                                        onChangeConfig(newCfg);
                                                        applyCartThemeToDom(newCfg);
                                                    }}
                                                    className="flex-1 h-9 px-3 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-xs font-mono font-bold outline-none"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Header Background */}
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-slate-700 dark:text-slate-300 flex items-center justify-between">
                                            <span>Màu nền Header bảng:</span>
                                            <span className="font-mono text-[10px] text-emerald-700 dark:text-emerald-400 font-bold">
                                                {currentConfig.headerBg === 'default' ? 'Mặc định' : currentConfig.headerBg}
                                            </span>
                                        </label>
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => onChangeConfig({ ...currentConfig, headerBg: 'default' })}
                                                className={cn(
                                                    "px-2.5 py-1 text-[10px] font-black rounded-lg border transition-all cursor-pointer",
                                                    currentConfig.headerBg === 'default'
                                                        ? "bg-emerald-600 text-white border-emerald-600"
                                                        : "bg-black/5 dark:bg-white/5 text-slate-600 dark:text-slate-400 border-black/10 dark:border-white/10"
                                                )}
                                            >
                                                Mặc định
                                            </button>
                                            <div className="relative flex items-center gap-1.5 flex-1">
                                                <input
                                                    type="color"
                                                    value={currentConfig.headerBg === 'default' ? '#8b6f47' : currentConfig.headerBg}
                                                    onChange={(e) => onChangeConfig({ ...currentConfig, headerBg: e.target.value })}
                                                    className="w-8 h-8 rounded-xl cursor-pointer border border-black/10 p-0.5 bg-transparent"
                                                />
                                                <input
                                                    type="text"
                                                    value={currentConfig.headerBg === 'default' ? '' : currentConfig.headerBg}
                                                    placeholder="#HEX..."
                                                    onChange={(e) => onChangeConfig({ ...currentConfig, headerBg: e.target.value })}
                                                    className="flex-1 h-8 px-2 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-xs font-mono font-bold outline-none"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Header Text Color */}
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-slate-700 dark:text-slate-300 flex items-center justify-between">
                                            <span>Màu chữ Header:</span>
                                            <span className="font-mono text-[10px] text-emerald-700 dark:text-emerald-400 font-bold">
                                                {currentConfig.headerText === 'default' ? 'Mặc định' : currentConfig.headerText}
                                            </span>
                                        </label>
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => onChangeConfig({ ...currentConfig, headerText: 'default' })}
                                                className={cn(
                                                    "px-2.5 py-1 text-[10px] font-black rounded-lg border transition-all cursor-pointer",
                                                    currentConfig.headerText === 'default'
                                                        ? "bg-emerald-600 text-white border-emerald-600"
                                                        : "bg-black/5 dark:bg-white/5 text-slate-600 dark:text-slate-400 border-black/10 dark:border-white/10"
                                                )}
                                            >
                                                Mặc định
                                            </button>
                                            <div className="relative flex items-center gap-1.5 flex-1">
                                                <input
                                                    type="color"
                                                    value={currentConfig.headerText === 'default' ? '#ffffff' : currentConfig.headerText}
                                                    onChange={(e) => onChangeConfig({ ...currentConfig, headerText: e.target.value })}
                                                    className="w-8 h-8 rounded-xl cursor-pointer border border-black/10 p-0.5 bg-transparent"
                                                />
                                                <input
                                                    type="text"
                                                    value={currentConfig.headerText === 'default' ? '' : currentConfig.headerText}
                                                    placeholder="#HEX..."
                                                    onChange={(e) => onChangeConfig({ ...currentConfig, headerText: e.target.value })}
                                                    className="flex-1 h-8 px-2 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-xs font-mono font-bold outline-none"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Product Name Text Color */}
                                    <div className="space-y-2 sm:col-span-2 p-3 rounded-2xl bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20">
                                        <label className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center justify-between">
                                            <span className="flex items-center gap-1.5">
                                                <Sparkles size={14} className="text-emerald-500" />
                                                Màu chữ Tên Sản Phẩm & Toàn hệ thống:
                                            </span>
                                            <span className="font-mono text-[10px] text-emerald-700 dark:text-emerald-400 font-bold">
                                                {currentConfig.productTextColor === 'default' || !currentConfig.productTextColor ? 'Mặc định (Theo theme)' : currentConfig.productTextColor}
                                            </span>
                                        </label>
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const newCfg = { ...currentConfig, productTextColor: 'default' };
                                                    onChangeConfig(newCfg);
                                                    applyCartThemeToDom(newCfg);
                                                }}
                                                className={cn(
                                                    "px-3 py-1.5 text-xs font-black rounded-xl border transition-all cursor-pointer",
                                                    (currentConfig.productTextColor === 'default' || !currentConfig.productTextColor)
                                                        ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                                                        : "bg-black/5 dark:bg-white/5 text-slate-600 dark:text-slate-400 border-black/10 dark:border-white/10"
                                                )}
                                            >
                                                Mặc định
                                            </button>
                                            <div className="relative flex items-center gap-1.5 flex-1">
                                                <input
                                                    type="color"
                                                    value={(currentConfig.productTextColor && currentConfig.productTextColor !== 'default') ? currentConfig.productTextColor : '#064e3b'}
                                                    onChange={(e) => {
                                                        const newCfg = { ...currentConfig, productTextColor: e.target.value };
                                                        onChangeConfig(newCfg);
                                                        applyCartThemeToDom(newCfg);
                                                    }}
                                                    className="w-9 h-9 rounded-xl cursor-pointer border border-black/10 p-0.5 bg-transparent shadow-xs"
                                                />
                                                <input
                                                    type="text"
                                                    value={(currentConfig.productTextColor && currentConfig.productTextColor !== 'default') ? currentConfig.productTextColor : ''}
                                                    placeholder="#HEX (vd: #ffffff, #fde68a, #38bdf8)..."
                                                    onChange={(e) => {
                                                        const newCfg = { ...currentConfig, productTextColor: e.target.value };
                                                        onChangeConfig(newCfg);
                                                        applyCartThemeToDom(newCfg);
                                                    }}
                                                    className="flex-1 h-9 px-3 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-xs font-mono font-bold outline-none"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Cart Columns Values (Qty, Price, Amount) Color */}
                                    <div className="space-y-2 sm:col-span-2 p-3 rounded-2xl bg-teal-500/5 dark:bg-teal-500/10 border border-teal-500/20">
                                        <label className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center justify-between">
                                            <span className="flex items-center gap-1.5">
                                                <SlidersHorizontal size={14} className="text-teal-500" />
                                                Màu chữ Số lượng, Quy đổi, Đơn giá & Thành tiền (Giỏ hàng):
                                            </span>
                                            <span className="font-mono text-[10px] text-teal-700 dark:text-teal-400 font-bold">
                                                {currentConfig.cartValuesColor === 'default' || !currentConfig.cartValuesColor ? 'Mặc định (Theo màu điểm nhấn/hệ thống)' : currentConfig.cartValuesColor}
                                            </span>
                                        </label>
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const newCfg = { ...currentConfig, cartValuesColor: 'default' };
                                                    onChangeConfig(newCfg);
                                                    applyCartThemeToDom(newCfg);
                                                }}
                                                className={cn(
                                                    "px-3 py-1.5 text-xs font-black rounded-xl border transition-all cursor-pointer",
                                                    (currentConfig.cartValuesColor === 'default' || !currentConfig.cartValuesColor)
                                                        ? "bg-teal-600 text-white border-teal-600 shadow-xs"
                                                        : "bg-black/5 dark:bg-white/5 text-slate-600 dark:text-slate-400 border-black/10 dark:border-white/10"
                                                )}
                                            >
                                                Mặc định
                                            </button>
                                            <div className="relative flex items-center gap-1.5 flex-1">
                                                <input
                                                    type="color"
                                                    value={(currentConfig.cartValuesColor && currentConfig.cartValuesColor !== 'default') ? currentConfig.cartValuesColor : (currentConfig.accentColor !== 'default' ? currentConfig.accentColor : '#2d5016')}
                                                    onChange={(e) => {
                                                        const newCfg = { ...currentConfig, cartValuesColor: e.target.value };
                                                        onChangeConfig(newCfg);
                                                        applyCartThemeToDom(newCfg);
                                                    }}
                                                    className="w-9 h-9 rounded-xl cursor-pointer border border-black/10 p-0.5 bg-transparent shadow-xs"
                                                />
                                                <input
                                                    type="text"
                                                    value={(currentConfig.cartValuesColor && currentConfig.cartValuesColor !== 'default') ? currentConfig.cartValuesColor : ''}
                                                    placeholder="#HEX (vd: #10b981, #d4a574, #38bdf8)..."
                                                    onChange={(e) => {
                                                        const newCfg = { ...currentConfig, cartValuesColor: e.target.value };
                                                        onChangeConfig(newCfg);
                                                        applyCartThemeToDom(newCfg);
                                                    }}
                                                    className="flex-1 h-9 px-3 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-xs font-mono font-bold outline-none"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Cart Border Color */}
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-slate-700 dark:text-slate-300 flex items-center justify-between">
                                            <span>Màu viền giỏ hàng:</span>
                                            <span className="font-mono text-[10px] text-emerald-700 dark:text-emerald-400 font-bold">
                                                {currentConfig.borderColor === 'default' ? 'Mặc định' : currentConfig.borderColor}
                                            </span>
                                        </label>
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => onChangeConfig({ ...currentConfig, borderColor: 'default' })}
                                                className={cn(
                                                    "px-2.5 py-1 text-[10px] font-black rounded-lg border transition-all cursor-pointer",
                                                    currentConfig.borderColor === 'default'
                                                        ? "bg-emerald-600 text-white border-emerald-600"
                                                        : "bg-black/5 dark:bg-white/5 text-slate-600 dark:text-slate-400 border-black/10 dark:border-white/10"
                                                )}
                                            >
                                                Mặc định
                                            </button>
                                            <div className="relative flex items-center gap-1.5 flex-1">
                                                <input
                                                    type="color"
                                                    value={currentConfig.borderColor === 'default' ? '#8b6f47' : currentConfig.borderColor}
                                                    onChange={(e) => onChangeConfig({ ...currentConfig, borderColor: e.target.value })}
                                                    className="w-8 h-8 rounded-xl cursor-pointer border border-black/10 p-0.5 bg-transparent"
                                                />
                                                <input
                                                    type="text"
                                                    value={currentConfig.borderColor === 'default' ? '' : currentConfig.borderColor}
                                                    placeholder="#HEX..."
                                                    onChange={(e) => onChangeConfig({ ...currentConfig, borderColor: e.target.value })}
                                                    className="flex-1 h-8 px-2 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-xs font-mono font-bold outline-none"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Cart Border Width */}
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-slate-700 dark:text-slate-300 flex items-center justify-between">
                                            <span>Độ dày viền giỏ hàng:</span>
                                            <span className="font-mono text-[10px] text-emerald-700 dark:text-emerald-400 font-bold">
                                                {currentConfig.borderWidth || '1'}px
                                            </span>
                                        </label>
                                        <div className="grid grid-cols-6 gap-1.5">
                                            {['0.5', '1', '1.5', '2', '3', '4'].map((w) => (
                                                <button
                                                    key={w}
                                                    type="button"
                                                    onClick={() => onChangeConfig({ ...currentConfig, borderWidth: w })}
                                                    className={cn(
                                                        "py-1 text-xs font-black rounded-lg border transition-all cursor-pointer text-center",
                                                        (currentConfig.borderWidth || '1') === w
                                                            ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                                                            : "bg-black/5 dark:bg-white/5 text-slate-600 dark:text-slate-400 border-black/10 dark:border-white/10"
                                                    )}
                                                >
                                                    {w}px
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Quick Color Swatches */}
                                <div className="pt-2 border-t border-black/5 dark:border-white/5">
                                    <span className="text-[10px] font-bold text-slate-400 block mb-1.5">
                                        Bảng màu chọn nhanh cho Điểm nhấn & Viền:
                                    </span>
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                        {colorSwatches.map((color) => (
                                            <button
                                                key={color}
                                                type="button"
                                                onClick={() => {
                                                    const newCfg = {
                                                        ...currentConfig,
                                                        borderColor: color,
                                                        accentColor: color
                                                    };
                                                    onChangeConfig(newCfg);
                                                    applyCartThemeToDom(newCfg);
                                                }}
                                                className="w-5 h-5 rounded-md border border-black/20 hover:scale-125 transition-transform shadow-xs cursor-pointer"
                                                style={{ backgroundColor: color }}
                                                title={color}
                                            />
                                        ))}
                                    </div>
                                </div>

                                {/* Border, Glow & Shadow Toggles */}
                                <div className="pt-3 border-t border-[#8b6f47]/20 dark:border-white/10 space-y-2.5">
                                    <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                        <SunMedium size={14} className="text-amber-500" />
                                        Hiệu Ứng Viền Neon & Đổ Bóng (Glow & Shadow)
                                    </h4>

                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                        {/* Border Toggle */}
                                        <div 
                                            onClick={() => onChangeConfig({
                                                ...currentConfig,
                                                enableBorder: currentConfig.enableBorder === false ? true : false
                                            })}
                                            className={cn(
                                                "flex items-center justify-between p-3 rounded-2xl border transition-all cursor-pointer select-none group",
                                                currentConfig.enableBorder !== false
                                                    ? "bg-blue-500/10 border-blue-500/30 dark:bg-blue-500/15 dark:border-blue-400/30"
                                                    : "bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10 opacity-70"
                                            )}
                                        >
                                            <div className="flex items-center gap-2.5">
                                                <div className={cn(
                                                    "w-8 h-8 rounded-xl flex items-center justify-center transition-all",
                                                    currentConfig.enableBorder !== false
                                                        ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                                                        : "bg-black/10 dark:bg-white/10 text-slate-400"
                                                )}>
                                                    <Square size={16} strokeWidth={2.5} />
                                                </div>
                                                <div>
                                                    <span className="font-black text-xs text-slate-800 dark:text-slate-100 block">
                                                        Đường viền
                                                    </span>
                                                    <span className="text-[10px] text-slate-500 dark:text-slate-400">
                                                        Bật / tắt viền giỏ
                                                    </span>
                                                </div>
                                            </div>

                                            <div className={cn(
                                                "w-10 h-6 rounded-full p-0.5 transition-colors duration-300 flex items-center shrink-0 border",
                                                currentConfig.enableBorder !== false
                                                    ? "bg-blue-600 border-blue-600 justify-end"
                                                    : "bg-slate-300 dark:bg-slate-700 border-slate-300 dark:border-slate-600 justify-start"
                                            )}>
                                                <div className="w-4 h-4 rounded-full bg-white shadow-sm" />
                                            </div>
                                        </div>

                                        {/* Glow Toggle */}
                                        <div 
                                            onClick={() => onChangeConfig({
                                                ...currentConfig,
                                                enableGlow: currentConfig.enableGlow === false ? true : false
                                            })}
                                            className={cn(
                                                "flex items-center justify-between p-3 rounded-2xl border transition-all cursor-pointer select-none group",
                                                currentConfig.enableGlow !== false
                                                    ? "bg-amber-500/10 border-amber-500/30 dark:bg-amber-500/15 dark:border-amber-400/30"
                                                    : "bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10 opacity-70"
                                            )}
                                        >
                                            <div className="flex items-center gap-2.5">
                                                <div className={cn(
                                                    "w-8 h-8 rounded-xl flex items-center justify-center transition-all",
                                                    currentConfig.enableGlow !== false
                                                        ? "bg-amber-500 text-white shadow-md shadow-amber-500/30"
                                                        : "bg-black/10 dark:bg-white/10 text-slate-400"
                                                )}>
                                                    <SunMedium size={16} strokeWidth={2.5} />
                                                </div>
                                                <div>
                                                    <span className="font-black text-xs text-slate-800 dark:text-slate-100 block">
                                                        Phát sáng (Glow)
                                                    </span>
                                                    <span className="text-[10px] text-slate-500 dark:text-slate-400">
                                                        Ánh neon viền
                                                    </span>
                                                </div>
                                            </div>

                                            <div className={cn(
                                                "w-10 h-6 rounded-full p-0.5 transition-colors duration-300 flex items-center shrink-0 border",
                                                currentConfig.enableGlow !== false
                                                    ? "bg-amber-500 border-amber-500 justify-end"
                                                    : "bg-slate-300 dark:bg-slate-700 border-slate-300 dark:border-slate-600 justify-start"
                                            )}>
                                                <div className="w-4 h-4 rounded-full bg-white shadow-sm" />
                                            </div>
                                        </div>

                                        {/* Shadow Toggle */}
                                        <div 
                                            onClick={() => onChangeConfig({
                                                ...currentConfig,
                                                enableShadow: currentConfig.enableShadow === false ? true : false
                                            })}
                                            className={cn(
                                                "flex items-center justify-between p-3 rounded-2xl border transition-all cursor-pointer select-none group",
                                                currentConfig.enableShadow !== false
                                                    ? "bg-emerald-500/10 border-emerald-500/30 dark:bg-emerald-500/15 dark:border-emerald-400/30"
                                                    : "bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10 opacity-70"
                                            )}
                                        >
                                            <div className="flex items-center gap-2.5">
                                                <div className={cn(
                                                    "w-8 h-8 rounded-xl flex items-center justify-center transition-all",
                                                    currentConfig.enableShadow !== false
                                                        ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30"
                                                        : "bg-black/10 dark:bg-white/10 text-slate-400"
                                                )}>
                                                    <Layers size={16} strokeWidth={2.5} />
                                                </div>
                                                <div>
                                                    <span className="font-black text-xs text-slate-800 dark:text-slate-100 block">
                                                        Đổ bóng (Shadow)
                                                    </span>
                                                    <span className="text-[10px] text-slate-500 dark:text-slate-400">
                                                        Độ sâu 3D sang trọng
                                                    </span>
                                                </div>
                                            </div>

                                            <div className={cn(
                                                "w-10 h-6 rounded-full p-0.5 transition-colors duration-300 flex items-center shrink-0 border",
                                                currentConfig.enableShadow !== false
                                                    ? "bg-emerald-600 border-emerald-600 justify-end"
                                                    : "bg-slate-300 dark:bg-slate-700 border-slate-300 dark:border-slate-600 justify-start"
                                            )}>
                                                <div className="w-4 h-4 rounded-full bg-white shadow-sm" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Text Glow & Shadow Customization (Hiệu ứng phát sáng & Đổ bóng chữ) */}
                                    <div className="p-4 rounded-2xl bg-white/70 dark:bg-slate-900/60 border border-amber-500/25 dark:border-amber-500/20 shadow-xs space-y-3.5">
                                        <div className="flex items-center justify-between pb-1 border-b border-black/5 dark:border-white/5">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                                                    <Sparkles size={16} strokeWidth={2.5} />
                                                </div>
                                                <div>
                                                    <span className="font-black text-xs uppercase tracking-tight text-slate-800 dark:text-slate-100 block">
                                                        Phát Sáng & Đổ Bóng Chữ (Text Glow / Shadow)
                                                    </span>
                                                    <span className="text-[10px] text-slate-500 dark:text-slate-400">
                                                        Làm nổi bật chữ trên mọi nền tối, sáng hoặc ảnh nền phức tạp
                                                    </span>
                                                </div>
                                            </div>

                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const newCfg = {
                                                        ...currentConfig,
                                                        textShadowMode: 'none',
                                                        textGlowColor: 'default',
                                                        textShadowColor: 'default',
                                                        textShadowBlur: 6
                                                    };
                                                    onChangeConfig(newCfg);
                                                    applyCartThemeToDom(newCfg);
                                                }}
                                                className="flex items-center gap-1 text-[10px] font-bold text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                                            >
                                                <RotateCcw size={10} />
                                                <span>Tắt hiệu ứng chữ</span>
                                            </button>
                                        </div>

                                        {/* Mode selector */}
                                        <div className="grid grid-cols-4 gap-2">
                                            {[
                                                { id: 'none', label: 'Tắt', desc: 'Chữ phẳng' },
                                                { id: 'glow', label: '✨ Phát sáng (Glow)', desc: 'Ánh hào quang rực rỡ' },
                                                { id: 'shadow', label: '🌑 Đổ bóng (Shadow)', desc: 'Bóng đổ 3D sắc nét' },
                                                { id: 'both', label: '🌟 Glow + Shadow', desc: 'Kết hợp tương phản tối đa' }
                                            ].map((modeOpt) => (
                                                <button
                                                    key={modeOpt.id}
                                                    type="button"
                                                    onClick={() => {
                                                        const newCfg = { ...currentConfig, textShadowMode: modeOpt.id };
                                                        onChangeConfig(newCfg);
                                                        applyCartThemeToDom(newCfg);
                                                    }}
                                                    className={cn(
                                                        "p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-0.5",
                                                        (currentConfig.textShadowMode || 'none') === modeOpt.id
                                                            ? "bg-amber-500/15 border-amber-600 dark:border-amber-400 shadow-xs ring-1 ring-amber-500/20"
                                                            : "bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10 hover:border-black/20"
                                                    )}
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-xs font-black text-slate-800 dark:text-slate-200">
                                                            {modeOpt.label}
                                                        </span>
                                                        {(currentConfig.textShadowMode || 'none') === modeOpt.id && (
                                                            <Check size={12} strokeWidth={3} className="text-amber-600 dark:text-amber-400" />
                                                        )}
                                                    </div>
                                                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                                                        {modeOpt.desc}
                                                    </span>
                                                </button>
                                            ))}
                                        </div>

                                        {/* Color & Blur Controls when active */}
                                        {currentConfig.textShadowMode && currentConfig.textShadowMode !== 'none' && (
                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-black/5 dark:border-white/5">
                                                {/* Glow Color (if glow or both) */}
                                                {(currentConfig.textShadowMode === 'glow' || currentConfig.textShadowMode === 'both') && (
                                                    <div className="space-y-1.5">
                                                        <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                                                            <span>Màu Glow chữ:</span>
                                                            <span className="font-mono text-[9.5px] text-amber-700 dark:text-amber-400 font-bold">
                                                                {currentConfig.textGlowColor === 'default' || !currentConfig.textGlowColor ? 'Tự động' : currentConfig.textGlowColor}
                                                            </span>
                                                        </label>
                                                        <div className="flex items-center gap-1.5">
                                                            <input
                                                                type="color"
                                                                value={(currentConfig.textGlowColor && currentConfig.textGlowColor !== 'default') ? currentConfig.textGlowColor : activeAccentColor}
                                                                onChange={(e) => {
                                                                    const newCfg = { ...currentConfig, textGlowColor: e.target.value };
                                                                    onChangeConfig(newCfg);
                                                                    applyCartThemeToDom(newCfg);
                                                                }}
                                                                className="w-8 h-8 rounded-xl cursor-pointer border border-black/10 p-0.5 bg-transparent"
                                                            />
                                                            <input
                                                                type="text"
                                                                value={(currentConfig.textGlowColor && currentConfig.textGlowColor !== 'default') ? currentConfig.textGlowColor : ''}
                                                                placeholder="#HEX..."
                                                                onChange={(e) => {
                                                                    const newCfg = { ...currentConfig, textGlowColor: e.target.value };
                                                                    onChangeConfig(newCfg);
                                                                    applyCartThemeToDom(newCfg);
                                                                }}
                                                                className="flex-1 h-8 px-2 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 text-xs font-mono font-bold outline-none"
                                                            />
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Shadow Color (if shadow or both) */}
                                                {(currentConfig.textShadowMode === 'shadow' || currentConfig.textShadowMode === 'both') && (
                                                    <div className="space-y-1.5">
                                                        <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                                                            <span>Màu Shadow đổ bóng:</span>
                                                            <span className="font-mono text-[9.5px] text-slate-700 dark:text-slate-400 font-bold">
                                                                {currentConfig.textShadowColor === 'default' || !currentConfig.textShadowColor ? 'Đen 3D mờ' : currentConfig.textShadowColor}
                                                            </span>
                                                        </label>
                                                        <div className="flex items-center gap-1.5">
                                                            <input
                                                                type="color"
                                                                value={(currentConfig.textShadowColor && currentConfig.textShadowColor !== 'default') ? currentConfig.textShadowColor : '#000000'}
                                                                onChange={(e) => {
                                                                    const newCfg = { ...currentConfig, textShadowColor: e.target.value };
                                                                    onChangeConfig(newCfg);
                                                                    applyCartThemeToDom(newCfg);
                                                                }}
                                                                className="w-8 h-8 rounded-xl cursor-pointer border border-black/10 p-0.5 bg-transparent"
                                                            />
                                                            <input
                                                                type="text"
                                                                value={(currentConfig.textShadowColor && currentConfig.textShadowColor !== 'default') ? currentConfig.textShadowColor : ''}
                                                                placeholder="#HEX..."
                                                                onChange={(e) => {
                                                                    const newCfg = { ...currentConfig, textShadowColor: e.target.value };
                                                                    onChangeConfig(newCfg);
                                                                    applyCartThemeToDom(newCfg);
                                                                }}
                                                                className="flex-1 h-8 px-2 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 text-xs font-mono font-bold outline-none"
                                                            />
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Blur Intensity Slider */}
                                                <div className="space-y-1.5">
                                                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 dark:text-slate-300">
                                                        <span>Cường độ mờ / tỏa sáng:</span>
                                                        <span className="font-mono text-[9.5px] text-amber-700 dark:text-amber-400 font-bold bg-amber-500/10 px-1.5 py-0.2 rounded">
                                                            {currentConfig.textShadowBlur !== undefined ? currentConfig.textShadowBlur : 6}px
                                                        </span>
                                                    </div>
                                                    <input
                                                        type="range"
                                                        min="2"
                                                        max="20"
                                                        step="1"
                                                        value={currentConfig.textShadowBlur !== undefined ? currentConfig.textShadowBlur : 6}
                                                        onChange={(e) => {
                                                            const newCfg = { ...currentConfig, textShadowBlur: Number(e.target.value) };
                                                            onChangeConfig(newCfg);
                                                            applyCartThemeToDom(newCfg);
                                                        }}
                                                        className="w-full accent-amber-500 cursor-pointer h-1.5 bg-black/10 dark:bg-white/10 rounded-lg appearance-none mt-2"
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB 2: DISPLAYS & VISUALS (Consolidated Switches) */}
                    {activeTab === 'displays' && (
                        <div className="space-y-4">
                            <div className="p-3.5 bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/25 rounded-2xl flex items-center gap-3">
                                <SlidersHorizontal size={20} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                                <div className="text-xs text-slate-700 dark:text-slate-200">
                                    <p className="font-bold">Các tùy chọn hiển thị giỏ hàng & bảng dữ liệu</p>
                                    <p className="text-[10px] text-slate-500 dark:text-slate-400">Tất cả thay đổi được đồng bộ tự động realtime trên toàn hệ thống POS.</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-3">
                                {/* Transparent Cart Table */}
                                <div 
                                    onClick={handleToggleTransparent}
                                    className={cn(
                                        "flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer select-none group",
                                        transparentCartTable
                                            ? "bg-emerald-500/10 border-emerald-500/30 dark:bg-emerald-500/15 dark:border-emerald-400/30"
                                            : "bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10"
                                    )}
                                >
                                    <div className="flex items-center gap-3.5">
                                        <div className={cn(
                                            "w-10 h-10 rounded-2xl flex items-center justify-center transition-all",
                                            transparentCartTable
                                                ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30"
                                                : "bg-black/10 dark:bg-white/10 text-slate-400"
                                        )}>
                                            <Eye size={20} strokeWidth={2.5} />
                                        </div>
                                        <div>
                                            <span className="font-black text-xs uppercase tracking-tight text-slate-800 dark:text-slate-100 block">
                                                Lớp Phủ Mờ Giỏ Hàng (Glassmorphism Blur)
                                            </span>
                                            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                                                {transparentCartTable ? "Bật: Nền kính mờ nổi bật, sang trọng và hiện đại" : "Tắt: Trong suốt trùng hoàn toàn màu nền hệ thống"}
                                            </span>
                                        </div>
                                    </div>

                                    <div className={cn(
                                        "w-11 h-6 rounded-full p-0.5 transition-colors duration-300 flex items-center shrink-0 border",
                                        transparentCartTable
                                            ? "bg-emerald-600 border-emerald-600 justify-end"
                                            : "bg-slate-300 dark:bg-slate-700 border-slate-300 dark:border-slate-600 justify-start"
                                    )}>
                                        <div className="w-5 h-5 rounded-full bg-white shadow-sm" />
                                    </div>
                                </div>

                                {/* Custom Overlay Color & Blur Controls when transparentCartTable is active */}
                                {transparentCartTable && (
                                    <m.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        transition={{ duration: 0.2 }}
                                        className="p-4 rounded-2xl bg-white/70 dark:bg-slate-900/60 border border-emerald-500/25 dark:border-emerald-500/20 shadow-xs space-y-4"
                                    >
                                        <div className="flex items-center justify-between pb-2 border-b border-black/5 dark:border-white/5">
                                            <span className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                                                <Paintbrush size={14} className="text-emerald-600 dark:text-emerald-400" />
                                                Tùy Chỉnh Màu Phủ & Độ Nhòe Kính (Glass Blur & Tint)
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const newCfg = {
                                                        ...currentConfig,
                                                        overlayColor: 'default',
                                                        overlayOpacity: 30,
                                                        overlayBlur: 12
                                                    };
                                                    onChangeConfig(newCfg);
                                                }}
                                                className="flex items-center gap-1 text-[10px] font-bold text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                                            >
                                                <RotateCcw size={11} />
                                                <span>Mặc định lớp phủ</span>
                                            </button>
                                        </div>

                                        {/* 1. Overlay Color */}
                                        <div className="space-y-2">
                                            <label className="text-xs font-black text-slate-700 dark:text-slate-300 flex items-center justify-between">
                                                <span className="flex items-center gap-1.5">
                                                    <Droplet size={13} className="text-emerald-500" />
                                                    Màu sắc lớp phủ (Glass Tint):
                                                </span>
                                                <span className="font-mono text-[10px] text-emerald-700 dark:text-emerald-400 font-bold">
                                                    {currentConfig.overlayColor === 'default' || !currentConfig.overlayColor ? 'Mặc định (Theo theme)' : currentConfig.overlayColor}
                                                </span>
                                            </label>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => onChangeConfig({ ...currentConfig, overlayColor: 'default' })}
                                                    className={cn(
                                                        "px-3 py-1.5 text-xs font-black rounded-xl border transition-all cursor-pointer",
                                                        (currentConfig.overlayColor === 'default' || !currentConfig.overlayColor)
                                                            ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                                                            : "bg-black/5 dark:bg-white/5 text-slate-600 dark:text-slate-400 border-black/10 dark:border-white/10"
                                                    )}
                                                >
                                                    Mặc định
                                                </button>
                                                <div className="relative flex items-center gap-1.5 flex-1">
                                                    <input
                                                        type="color"
                                                        value={(currentConfig.overlayColor && currentConfig.overlayColor !== 'default') ? currentConfig.overlayColor : '#ffffff'}
                                                        onChange={(e) => onChangeConfig({ ...currentConfig, overlayColor: e.target.value })}
                                                        className="w-9 h-9 rounded-xl cursor-pointer border border-black/10 p-0.5 bg-transparent shadow-xs"
                                                    />
                                                    <input
                                                        type="text"
                                                        value={(currentConfig.overlayColor && currentConfig.overlayColor !== 'default') ? currentConfig.overlayColor : ''}
                                                        placeholder="#HEX (vd: #ffffff, #064e3b, #1e293b, #000000)..."
                                                        onChange={(e) => onChangeConfig({ ...currentConfig, overlayColor: e.target.value })}
                                                        className="flex-1 h-9 px-3 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-xs font-mono font-bold outline-none"
                                                    />
                                                </div>
                                            </div>

                                            {/* Quick swatches for overlay */}
                                            <div className="flex items-center gap-1.5 flex-wrap pt-1">
                                                <span className="text-[10px] font-bold text-slate-400 mr-1">Màu gợi ý:</span>
                                                {[
                                                    { color: '#ffffff', label: 'Trắng Sáng' },
                                                    { color: '#000000', label: 'Đen Khói' },
                                                    { color: '#064e3b', label: 'Xanh Emerald' },
                                                    { color: '#1e3a10', label: 'Rêu Forest' },
                                                    { color: '#543b24', label: 'Nâu Gỗ' },
                                                    { color: '#172554', label: 'Xanh Navy' },
                                                    { color: '#3b0764', label: 'Tím Huyền' },
                                                    { color: '#1e293b', label: 'Xám Slate' },
                                                    { color: '#451a03', label: 'Hổ Phách' }
                                                ].map((swatch) => (
                                                    <button
                                                        key={swatch.color}
                                                        type="button"
                                                        onClick={() => onChangeConfig({ ...currentConfig, overlayColor: swatch.color })}
                                                        className={cn(
                                                            "w-6 h-6 rounded-lg border shadow-xs transition-transform hover:scale-125 cursor-pointer relative",
                                                            currentConfig.overlayColor === swatch.color ? "ring-2 ring-emerald-500 scale-110" : "border-black/20 dark:border-white/20"
                                                        )}
                                                        style={{ backgroundColor: swatch.color }}
                                                        title={swatch.label}
                                                    />
                                                ))}
                                            </div>
                                        </div>

                                        {/* 2. Overlay Opacity Slider */}
                                        <div className="space-y-2 pt-2 border-t border-black/5 dark:border-white/5">
                                            <div className="flex items-center justify-between text-xs font-black text-slate-700 dark:text-slate-300">
                                                <span className="flex items-center gap-1.5">
                                                    <Layers size={13} className="text-emerald-500" />
                                                    Độ đục / Độ đậm lớp phủ (Opacity):
                                                </span>
                                                <span className="font-mono text-[10px] text-emerald-700 dark:text-emerald-400 font-bold bg-emerald-500/10 dark:bg-emerald-500/20 px-2 py-0.5 rounded-md">
                                                    {currentConfig.overlayOpacity !== undefined ? currentConfig.overlayOpacity : 30}%
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <input
                                                    type="range"
                                                    min="5"
                                                    max="95"
                                                    step="5"
                                                    value={currentConfig.overlayOpacity !== undefined ? currentConfig.overlayOpacity : 30}
                                                    onChange={(e) => onChangeConfig({ ...currentConfig, overlayOpacity: Number(e.target.value) })}
                                                    className="flex-1 accent-emerald-600 cursor-pointer h-2 bg-black/10 dark:bg-white/10 rounded-lg appearance-none"
                                                />
                                            </div>
                                            <div className="grid grid-cols-5 gap-1.5 pt-0.5">
                                                {[
                                                    { val: 10, label: '10% (Siêu mỏng)' },
                                                    { val: 25, label: '25% (Nhẹ)' },
                                                    { val: 40, label: '40% (Vừa)' },
                                                    { val: 60, label: '60% (Rõ)' },
                                                    { val: 80, label: '80% (Đậm)' }
                                                ].map((item) => (
                                                    <button
                                                        key={item.val}
                                                        type="button"
                                                        onClick={() => onChangeConfig({ ...currentConfig, overlayOpacity: item.val })}
                                                        className={cn(
                                                            "py-1 text-[10px] font-bold rounded-lg border transition-all cursor-pointer text-center truncate px-1",
                                                            Number(currentConfig.overlayOpacity ?? 30) === item.val
                                                                ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                                                                : "bg-black/5 dark:bg-white/5 text-slate-600 dark:text-slate-400 border-black/10 dark:border-white/10 hover:border-black/20"
                                                        )}
                                                    >
                                                        {item.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* 3. Overlay Blur Strength Slider */}
                                        <div className="space-y-2 pt-2 border-t border-black/5 dark:border-white/5">
                                            <div className="flex items-center justify-between text-xs font-black text-slate-700 dark:text-slate-300">
                                                <span className="flex items-center gap-1.5">
                                                    <Sparkles size={13} className="text-amber-500" />
                                                    Độ nhòe kính mờ (Backdrop Blur):
                                                </span>
                                                <span className="font-mono text-[10px] text-amber-700 dark:text-amber-400 font-bold bg-amber-500/10 dark:bg-amber-500/20 px-2 py-0.5 rounded-md">
                                                    {currentConfig.overlayBlur !== undefined ? currentConfig.overlayBlur : 12}px
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <input
                                                    type="range"
                                                    min="0"
                                                    max="32"
                                                    step="2"
                                                    value={currentConfig.overlayBlur !== undefined ? currentConfig.overlayBlur : 12}
                                                    onChange={(e) => onChangeConfig({ ...currentConfig, overlayBlur: Number(e.target.value) })}
                                                    className="flex-1 accent-amber-500 cursor-pointer h-2 bg-black/10 dark:bg-white/10 rounded-lg appearance-none"
                                                />
                                            </div>
                                            <div className="grid grid-cols-5 gap-1.5 pt-0.5">
                                                {[
                                                    { val: 0, label: '0px (Tắt)' },
                                                    { val: 6, label: '6px (Nhẹ)' },
                                                    { val: 12, label: '12px (Chuẩn)' },
                                                    { val: 20, label: '20px (Mạnh)' },
                                                    { val: 32, label: '32px (Ảo diệu)' }
                                                ].map((item) => (
                                                    <button
                                                        key={item.val}
                                                        type="button"
                                                        onClick={() => onChangeConfig({ ...currentConfig, overlayBlur: item.val })}
                                                        className={cn(
                                                            "py-1 text-[10px] font-bold rounded-lg border transition-all cursor-pointer text-center truncate px-1",
                                                            Number(currentConfig.overlayBlur ?? 12) === item.val
                                                                ? "bg-amber-600 text-white border-amber-600 shadow-xs"
                                                                : "bg-black/5 dark:bg-white/5 text-slate-600 dark:text-slate-400 border-black/10 dark:border-white/10 hover:border-black/20"
                                                        )}
                                                    >
                                                        {item.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </m.div>
                                )}

                                {/* Last Purchase Badge */}
                                <div 
                                    onClick={handleToggleLastPurchaseBadge}
                                    className={cn(
                                        "flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer select-none group",
                                        showLastPurchaseBadge
                                            ? "bg-indigo-500/10 border-indigo-500/30 dark:bg-indigo-500/15 dark:border-indigo-400/30"
                                            : "bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10"
                                    )}
                                >
                                    <div className="flex items-center gap-3.5">
                                        <div className={cn(
                                            "w-10 h-10 rounded-2xl flex items-center justify-center transition-all",
                                            showLastPurchaseBadge
                                                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                                                : "bg-black/10 dark:bg-white/10 text-slate-400"
                                        )}>
                                            <Clock size={20} strokeWidth={2.5} />
                                        </div>
                                        <div>
                                            <span className="font-black text-xs uppercase tracking-tight text-slate-800 dark:text-slate-100 block">
                                                Badge Ngày Mua Gần Nhất Của Khách Hàng
                                            </span>
                                            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                                                {showLastPurchaseBadge ? "Bật: Hiển thị nhãn ngày khách mua sản phẩm này gần nhất dưới tên món" : "Tắt: Ẩn nhãn ngày mua gần nhất để bảng gọn hơn"}
                                            </span>
                                        </div>
                                    </div>

                                    <div className={cn(
                                        "w-11 h-6 rounded-full p-0.5 transition-colors duration-300 flex items-center shrink-0 border",
                                        showLastPurchaseBadge
                                            ? "bg-indigo-600 border-indigo-600 justify-end"
                                            : "bg-slate-300 dark:bg-slate-700 border-slate-300 dark:border-slate-600 justify-start"
                                    )}>
                                        <div className="w-5 h-5 rounded-full bg-white shadow-sm" />
                                    </div>
                                </div>

                                {/* Empty Cart Guide & Mascot Banner */}
                                <div 
                                    onClick={handleToggleEmptyCartGuide}
                                    className={cn(
                                        "flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer select-none group",
                                        showEmptyCartGuide
                                            ? "bg-amber-500/10 border-amber-500/30 dark:bg-amber-500/15 dark:border-amber-400/30"
                                            : "bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10"
                                    )}
                                >
                                    <div className="flex items-center gap-3.5">
                                        <div className={cn(
                                            "w-10 h-10 rounded-2xl flex items-center justify-center transition-all",
                                            showEmptyCartGuide
                                                ? "bg-amber-500 text-white shadow-md shadow-amber-500/30"
                                                : "bg-black/10 dark:bg-white/10 text-slate-400"
                                        )}>
                                            <ShoppingCart size={20} strokeWidth={2.5} />
                                        </div>
                                        <div>
                                            <span className="font-black text-xs uppercase tracking-tight text-slate-800 dark:text-slate-100 block">
                                                Hình Hướng Dẫn & Linh Vật Khi Giỏ Trống
                                            </span>
                                            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                                                {showEmptyCartGuide ? "Bật: Hiện linh vật cậu bé và bảng phím tắt nhanh khi chưa có món" : "Tắt: Ẩn hoàn toàn bảng trống, giao diện tối giản tối đa"}
                                            </span>
                                        </div>
                                    </div>

                                    <div className={cn(
                                        "w-11 h-6 rounded-full p-0.5 transition-colors duration-300 flex items-center shrink-0 border",
                                        showEmptyCartGuide
                                            ? "bg-amber-500 border-amber-500 justify-end"
                                            : "bg-slate-300 dark:bg-slate-700 border-slate-300 dark:border-slate-600 justify-start"
                                    )}>
                                        <div className="w-5 h-5 rounded-full bg-white shadow-sm" />
                                    </div>
                                </div>

                                {/* Text Pills Highlighter Toggle & Style Options */}
                                <div className="p-4 rounded-2xl bg-white/70 dark:bg-slate-900/60 border border-teal-500/25 dark:border-teal-500/20 shadow-xs space-y-3">
                                    <div 
                                        onClick={() => {
                                            const newCfg = {
                                                ...currentConfig,
                                                enableTextPills: !currentConfig.enableTextPills
                                            };
                                            onChangeConfig(newCfg);
                                            applyCartThemeToDom(newCfg);
                                        }}
                                        className="flex items-center justify-between cursor-pointer select-none group"
                                    >
                                        <div className="flex items-center gap-3.5">
                                            <div className={cn(
                                                "w-10 h-10 rounded-2xl flex items-center justify-center transition-all",
                                                currentConfig.enableTextPills
                                                    ? "bg-teal-600 text-white shadow-md shadow-teal-600/30"
                                                    : "bg-black/10 dark:bg-white/10 text-slate-400"
                                            )}>
                                                <Sparkles size={20} strokeWidth={2.5} />
                                            </div>
                                            <div>
                                                <span className="font-black text-xs uppercase tracking-tight text-slate-800 dark:text-slate-100 flex items-center gap-2">
                                                    <span>Badge / Pill Nền Mờ Nổi Bật Chữ Trong Giỏ</span>
                                                    <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-teal-500/15 text-teal-700 dark:text-teal-400 border border-teal-500/20">
                                                        HOT
                                                    </span>
                                                </span>
                                                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                                                    {currentConfig.enableTextPills 
                                                        ? "Bật: Bọc viền & nền mờ pill sang trọng cho Tên sản phẩm, Đơn vị, Quy đổi, SL, Giá & Thành tiền" 
                                                        : "Tắt: Chữ hiển thị phẳng tự nhiên theo nền giỏ hàng"}
                                                </span>
                                            </div>
                                        </div>

                                        <div className={cn(
                                            "w-11 h-6 rounded-full p-0.5 transition-colors duration-300 flex items-center shrink-0 border",
                                            currentConfig.enableTextPills
                                                ? "bg-teal-600 border-teal-600 justify-end"
                                                : "bg-slate-300 dark:bg-slate-700 border-slate-300 dark:border-slate-600 justify-start"
                                        )}>
                                            <div className="w-5 h-5 rounded-full bg-white shadow-sm" />
                                        </div>
                                    </div>

                                    {/* Pill Style Selector (Glass vs Neon vs Theme) */}
                                    {currentConfig.enableTextPills && (
                                        <m.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="pt-3 border-t border-black/5 dark:border-white/5 space-y-2"
                                        >
                                            <div className="flex items-center justify-between text-xs font-black text-slate-700 dark:text-slate-300">
                                                <span className="flex items-center gap-1.5">
                                                    <Paintbrush size={13} className="text-teal-500" />
                                                    Kiểu dáng Pill nổi bật:
                                                </span>
                                                <span className="font-mono text-[10px] text-teal-700 dark:text-teal-400 font-bold uppercase">
                                                    {currentConfig.textPillStyle === 'neon' ? 'Viền Neon Sắc Nét' : currentConfig.textPillStyle === 'theme' ? 'Nền Màu Theme POS' : 'Kính Mờ Tinh Tế (Glass)'}
                                                </span>
                                            </div>

                                            <div className="grid grid-cols-3 gap-2">
                                                {[
                                                    {
                                                        id: 'glass',
                                                        label: 'Kính Mờ Glass',
                                                        desc: 'Bóng bẩy, mờ ảo cao cấp'
                                                    },
                                                    {
                                                        id: 'neon',
                                                        label: 'Viền Neon Sắc',
                                                        desc: 'Viền phát sáng nhẹ theo theme'
                                                    },
                                                    {
                                                        id: 'theme',
                                                        label: 'Nền Mờ Theme',
                                                        desc: 'Hòa quyện với màu chủ đạo'
                                                    }
                                                ].map(pillOpt => (
                                                    <button
                                                        key={pillOpt.id}
                                                        type="button"
                                                        onClick={() => {
                                                            const newCfg = {
                                                                ...currentConfig,
                                                                textPillStyle: pillOpt.id
                                                            };
                                                            onChangeConfig(newCfg);
                                                            applyCartThemeToDom(newCfg);
                                                        }}
                                                        className={cn(
                                                            "p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-0.5",
                                                            (currentConfig.textPillStyle || 'glass') === pillOpt.id
                                                                ? "bg-teal-500/15 border-teal-600 dark:border-teal-400 shadow-xs ring-1 ring-teal-500/20"
                                                                : "bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10 hover:border-black/20"
                                                        )}
                                                    >
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-xs font-black text-slate-800 dark:text-slate-200">
                                                                {pillOpt.label}
                                                            </span>
                                                            {(currentConfig.textPillStyle || 'glass') === pillOpt.id && (
                                                                <Check size={12} strokeWidth={3} className="text-teal-600 dark:text-teal-400" />
                                                            )}
                                                        </div>
                                                        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                                                            {pillOpt.desc}
                                                        </span>
                                                    </button>
                                                ))}
                                            </div>

                                            {/* Advanced Pill Customization Controls: Border Color, Background Color, Blur, Opacity, Glow */}
                                            <div className="pt-3 border-t border-black/5 dark:border-white/5 space-y-3.5">
                                                <div className="flex items-center justify-between pb-1">
                                                    <span className="text-[11px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                                                        <Sliders size={13} className="text-teal-600 dark:text-teal-400" />
                                                        Chi tiết màu sắc & độ mờ Pill
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            const newCfg = {
                                                                ...currentConfig,
                                                                pillBgColor: 'default',
                                                                pillBorderColor: 'default',
                                                                pillBlur: 12,
                                                                pillOpacity: 25,
                                                                pillRadius: 16,
                                                                pillGlow: true
                                                            };
                                                            onChangeConfig(newCfg);
                                                            applyCartThemeToDom(newCfg);
                                                        }}
                                                        className="flex items-center gap-1 text-[10px] font-bold text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                                                    >
                                                        <RotateCcw size={10} />
                                                        <span>Đặt lại Pill</span>
                                                    </button>
                                                </div>

                                                {/* 1. Pill Background Color */}
                                                <div className="space-y-1.5">
                                                    <label className="text-xs font-black text-slate-700 dark:text-slate-300 flex items-center justify-between">
                                                        <span className="flex items-center gap-1.5">
                                                            <Droplet size={12} className="text-teal-500" />
                                                            Màu nền Pill:
                                                        </span>
                                                        <span className="font-mono text-[10px] text-teal-700 dark:text-teal-400 font-bold">
                                                            {currentConfig.pillBgColor === 'default' || !currentConfig.pillBgColor ? 'Mặc định theo chế độ' : currentConfig.pillBgColor}
                                                        </span>
                                                    </label>
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                const newCfg = { ...currentConfig, pillBgColor: 'default' };
                                                                onChangeConfig(newCfg);
                                                                applyCartThemeToDom(newCfg);
                                                            }}
                                                            className={cn(
                                                                "px-2.5 py-1 text-[10px] font-black rounded-lg border transition-all cursor-pointer",
                                                                (currentConfig.pillBgColor === 'default' || !currentConfig.pillBgColor)
                                                                    ? "bg-teal-600 text-white border-teal-600 shadow-xs"
                                                                    : "bg-black/5 dark:bg-white/5 text-slate-600 dark:text-slate-400 border-black/10 dark:border-white/10"
                                                            )}
                                                        >
                                                            Mặc định
                                                        </button>
                                                        <div className="relative flex items-center gap-1.5 flex-1">
                                                            <input
                                                                type="color"
                                                                value={(currentConfig.pillBgColor && currentConfig.pillBgColor !== 'default') ? currentConfig.pillBgColor : (currentConfig.textPillStyle === 'glass' ? '#ffffff' : activeAccentColor)}
                                                                onChange={(e) => {
                                                                    const newCfg = { ...currentConfig, pillBgColor: e.target.value };
                                                                    onChangeConfig(newCfg);
                                                                    applyCartThemeToDom(newCfg);
                                                                }}
                                                                className="w-8 h-8 rounded-xl cursor-pointer border border-black/10 p-0.5 bg-transparent shadow-xs"
                                                            />
                                                            <input
                                                                type="text"
                                                                value={(currentConfig.pillBgColor && currentConfig.pillBgColor !== 'default') ? currentConfig.pillBgColor : ''}
                                                                placeholder="#HEX (vd: #ffffff, #10b981, #d4a574)..."
                                                                onChange={(e) => {
                                                                    const newCfg = { ...currentConfig, pillBgColor: e.target.value };
                                                                    onChangeConfig(newCfg);
                                                                    applyCartThemeToDom(newCfg);
                                                                }}
                                                                className="flex-1 h-8 px-2.5 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-xs font-mono font-bold outline-none"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* 2. Pill Border Color */}
                                                <div className="space-y-1.5">
                                                    <label className="text-xs font-black text-slate-700 dark:text-slate-300 flex items-center justify-between">
                                                        <span className="flex items-center gap-1.5">
                                                            <Square size={12} className="text-teal-500" />
                                                            Màu viền Pill:
                                                        </span>
                                                        <span className="font-mono text-[10px] text-teal-700 dark:text-teal-400 font-bold">
                                                            {currentConfig.pillBorderColor === 'default' || !currentConfig.pillBorderColor ? 'Mặc định theo chế độ' : currentConfig.pillBorderColor}
                                                        </span>
                                                    </label>
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                const newCfg = { ...currentConfig, pillBorderColor: 'default' };
                                                                onChangeConfig(newCfg);
                                                                applyCartThemeToDom(newCfg);
                                                            }}
                                                            className={cn(
                                                                "px-2.5 py-1 text-[10px] font-black rounded-lg border transition-all cursor-pointer",
                                                                (currentConfig.pillBorderColor === 'default' || !currentConfig.pillBorderColor)
                                                                    ? "bg-teal-600 text-white border-teal-600 shadow-xs"
                                                                    : "bg-black/5 dark:bg-white/5 text-slate-600 dark:text-slate-400 border-black/10 dark:border-white/10"
                                                            )}
                                                        >
                                                            Mặc định
                                                        </button>
                                                        <div className="relative flex items-center gap-1.5 flex-1">
                                                            <input
                                                                type="color"
                                                                value={(currentConfig.pillBorderColor && currentConfig.pillBorderColor !== 'default') ? currentConfig.pillBorderColor : (currentConfig.borderColor !== 'default' ? currentConfig.borderColor : activeAccentColor)}
                                                                onChange={(e) => {
                                                                    const newCfg = { ...currentConfig, pillBorderColor: e.target.value };
                                                                    onChangeConfig(newCfg);
                                                                    applyCartThemeToDom(newCfg);
                                                                }}
                                                                className="w-8 h-8 rounded-xl cursor-pointer border border-black/10 p-0.5 bg-transparent shadow-xs"
                                                            />
                                                            <input
                                                                type="text"
                                                                value={(currentConfig.pillBorderColor && currentConfig.pillBorderColor !== 'default') ? currentConfig.pillBorderColor : ''}
                                                                placeholder="#HEX viền (vd: #10b981, #ffffff, #38bdf8)..."
                                                                onChange={(e) => {
                                                                    const newCfg = { ...currentConfig, pillBorderColor: e.target.value };
                                                                    onChangeConfig(newCfg);
                                                                    applyCartThemeToDom(newCfg);
                                                                }}
                                                                className="flex-1 h-8 px-2.5 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-xs font-mono font-bold outline-none"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* 3. Pill Opacity, Blur & Border Radius Sliders */}
                                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                                                    {/* Border Radius */}
                                                    <div className="space-y-1.5 p-2.5 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/5 dark:border-white/5">
                                                        <div className="flex items-center justify-between text-xs font-black text-slate-700 dark:text-slate-300">
                                                            <span className="flex items-center gap-1 text-[11px]">
                                                                <Square size={12} className="text-emerald-500" />
                                                                Độ bo góc (Radius):
                                                            </span>
                                                            <span className="font-mono text-[10px] text-emerald-700 dark:text-emerald-400 font-bold bg-emerald-500/10 dark:bg-emerald-500/20 px-1.5 py-0.2 rounded">
                                                                {currentConfig.pillRadius !== undefined ? currentConfig.pillRadius : 16}px
                                                            </span>
                                                        </div>
                                                        <input
                                                            type="range"
                                                            min="0"
                                                            max="40"
                                                            step="2"
                                                            value={currentConfig.pillRadius !== undefined ? currentConfig.pillRadius : 16}
                                                            onChange={(e) => {
                                                                const newCfg = { ...currentConfig, pillRadius: Number(e.target.value) };
                                                                onChangeConfig(newCfg);
                                                                applyCartThemeToDom(newCfg);
                                                            }}
                                                            className="w-full accent-emerald-600 cursor-pointer h-1.5 bg-black/10 dark:bg-white/10 rounded-lg appearance-none"
                                                        />
                                                        <div className="flex items-center justify-between gap-1 pt-1">
                                                            {[
                                                                { r: 4, l: 'Vuông' },
                                                                { r: 10, l: 'Bo nhẹ' },
                                                                { r: 16, l: 'Vừa' },
                                                                { r: 24, l: 'Tròn' },
                                                                { r: 99, l: 'Pill max' }
                                                            ].map(opt => (
                                                                <button
                                                                    key={opt.r}
                                                                    type="button"
                                                                    onClick={() => {
                                                                        const newCfg = { ...currentConfig, pillRadius: opt.r };
                                                                        onChangeConfig(newCfg);
                                                                        applyCartThemeToDom(newCfg);
                                                                    }}
                                                                    className={cn(
                                                                        "flex-1 py-0.5 text-[9px] font-bold rounded border transition-all text-center",
                                                                        (Number(currentConfig.pillRadius ?? 16) === opt.r)
                                                                            ? "bg-emerald-600 text-white border-emerald-600"
                                                                            : "bg-black/5 dark:bg-white/5 text-slate-500 dark:text-slate-400 border-black/10 dark:border-white/10"
                                                                    )}
                                                                >
                                                                    {opt.l}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    {/* Opacity */}
                                                    <div className="space-y-1.5 p-2.5 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/5 dark:border-white/5">
                                                        <div className="flex items-center justify-between text-xs font-black text-slate-700 dark:text-slate-300">
                                                            <span className="flex items-center gap-1 text-[11px]">
                                                                <Layers size={12} className="text-teal-500" />
                                                                Độ đậm nền pill:
                                                            </span>
                                                            <span className="font-mono text-[10px] text-teal-700 dark:text-teal-400 font-bold bg-teal-500/10 dark:bg-teal-500/20 px-1.5 py-0.2 rounded">
                                                                {currentConfig.pillOpacity !== undefined ? currentConfig.pillOpacity : (currentConfig.textPillStyle === 'glass' ? 22 : 18)}%
                                                            </span>
                                                        </div>
                                                        <input
                                                            type="range"
                                                            min="5"
                                                            max="85"
                                                            step="5"
                                                            value={currentConfig.pillOpacity !== undefined ? currentConfig.pillOpacity : (currentConfig.textPillStyle === 'glass' ? 22 : 18)}
                                                            onChange={(e) => {
                                                                const newCfg = { ...currentConfig, pillOpacity: Number(e.target.value) };
                                                                onChangeConfig(newCfg);
                                                                applyCartThemeToDom(newCfg);
                                                            }}
                                                            className="w-full accent-teal-600 cursor-pointer h-1.5 bg-black/10 dark:bg-white/10 rounded-lg appearance-none"
                                                        />
                                                    </div>

                                                    {/* Blur (Độ Glass) */}
                                                    <div className="space-y-1.5 p-2.5 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/5 dark:border-white/5">
                                                        <div className="flex items-center justify-between text-xs font-black text-slate-700 dark:text-slate-300">
                                                            <span className="flex items-center gap-1 text-[11px]">
                                                                <Sparkles size={12} className="text-amber-500" />
                                                                Độ nhòe kính (Glass blur):
                                                            </span>
                                                            <span className="font-mono text-[10px] text-amber-700 dark:text-amber-400 font-bold bg-amber-500/10 dark:bg-amber-500/20 px-1.5 py-0.2 rounded">
                                                                {currentConfig.pillBlur !== undefined ? currentConfig.pillBlur : (currentConfig.textPillStyle === 'glass' ? 12 : 8)}px
                                                            </span>
                                                        </div>
                                                        <input
                                                            type="range"
                                                            min="0"
                                                            max="30"
                                                            step="2"
                                                            value={currentConfig.pillBlur !== undefined ? currentConfig.pillBlur : (currentConfig.textPillStyle === 'glass' ? 12 : 8)}
                                                            onChange={(e) => {
                                                                const newCfg = { ...currentConfig, pillBlur: Number(e.target.value) };
                                                                onChangeConfig(newCfg);
                                                                applyCartThemeToDom(newCfg);
                                                            }}
                                                            className="w-full accent-amber-500 cursor-pointer h-1.5 bg-black/10 dark:bg-white/10 rounded-lg appearance-none"
                                                        />
                                                    </div>
                                                </div>

                                                {/* 4. Glow toggle for Pill */}
                                                <div 
                                                    onClick={() => {
                                                        const newCfg = {
                                                            ...currentConfig,
                                                            pillGlow: currentConfig.pillGlow === false ? true : false
                                                        };
                                                        onChangeConfig(newCfg);
                                                        applyCartThemeToDom(newCfg);
                                                    }}
                                                    className="flex items-center justify-between p-2.5 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/5 dark:border-white/5 cursor-pointer select-none group"
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <SunMedium size={14} className={currentConfig.pillGlow !== false ? "text-amber-500" : "text-slate-400"} />
                                                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                                            Hiệu ứng viền phát sáng & đổ bóng nhẹ (Pill Glow & Depth)
                                                        </span>
                                                    </div>
                                                    <div className={cn(
                                                        "w-9 h-5 rounded-full p-0.5 transition-colors duration-300 flex items-center shrink-0 border",
                                                        currentConfig.pillGlow !== false
                                                            ? "bg-teal-600 border-teal-600 justify-end"
                                                            : "bg-slate-300 dark:bg-slate-700 border-slate-300 dark:border-slate-600 justify-start"
                                                    )}>
                                                        <div className="w-3.5 h-3.5 rounded-full bg-white shadow-xs" />
                                                    </div>
                                                </div>
                                            </div>
                                        </m.div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB 3: MASCOT WATERMARK (Integrated Customizer) */}
                    {activeTab === 'mascot' && (
                        <div className="space-y-5">
                            {/* Mascot Toggle */}
                            <div 
                                onClick={handleToggleMascotVisible}
                                className={cn(
                                    "flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer select-none group",
                                    mascotWatermarkVisible
                                        ? "bg-emerald-500/10 border-emerald-500/30 dark:bg-emerald-500/15 dark:border-emerald-400/30"
                                        : "bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10"
                                )}
                            >
                                <div className="flex items-center gap-3.5">
                                    <div className={cn(
                                        "w-10 h-10 rounded-2xl flex items-center justify-center transition-all",
                                        mascotWatermarkVisible
                                            ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30"
                                            : "bg-black/10 dark:bg-white/10 text-slate-400"
                                    )}>
                                        <ImageIcon size={20} strokeWidth={2.5} />
                                    </div>
                                    <div>
                                        <span className="font-black text-xs uppercase tracking-tight text-slate-800 dark:text-slate-100 block">
                                            Hiển Thị Mascot Khắc Chìm Dưới Bảng
                                        </span>
                                        <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                                            {mascotWatermarkVisible ? "Bật: Khắc hình linh vật mờ nghệ thuật chìm dưới danh sách món" : "Tắt: Ẩn hoàn toàn hình chìm"}
                                        </span>
                                    </div>
                                </div>

                                <div className={cn(
                                    "w-11 h-6 rounded-full p-0.5 transition-colors duration-300 flex items-center shrink-0 border",
                                    mascotWatermarkVisible
                                        ? "bg-emerald-600 border-emerald-600 justify-end"
                                        : "bg-slate-300 dark:bg-slate-700 border-slate-300 dark:border-slate-600 justify-start"
                                    )}>
                                        <div className="w-5 h-5 rounded-full bg-white shadow-sm" />
                                </div>
                            </div>

                            {mascotWatermarkVisible && (
                                <div className="space-y-4 pt-2 border-t border-[#8b6f47]/20 dark:border-white/10">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                            <Compass size={14} className="text-emerald-600 dark:text-emerald-400" />
                                            Vị Trí Góc Neo & Tọa Độ Dịch Chuyển
                                        </h4>
                                        <button
                                            type="button"
                                            onClick={handleResetMascot}
                                            className="flex items-center gap-1 text-[10px] font-bold text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                                        >
                                            <RotateCcw size={11} />
                                            <span>Mặc định góc</span>
                                        </button>
                                    </div>

                                    {/* Anchor Positions */}
                                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 text-xs font-bold">
                                        {[
                                            { id: "bottom-right", label: "Dưới Phải" },
                                            { id: "bottom-left", label: "Dưới Trái" },
                                            { id: "center", label: "Chính Giữa" },
                                            { id: "top-right", label: "Trên Phải" },
                                            { id: "top-left", label: "Trên Trái" },
                                        ].map(item => (
                                            <button
                                                key={item.id}
                                                type="button"
                                                onClick={() => {
                                                    setMascotWatermarkPos(item.id);
                                                    localStorage.setItem("pos_mascot_watermark_pos", item.id);
                                                    broadcastSetting("pos_mascot_watermark_pos", item.id);
                                                }}
                                                className={cn(
                                                    "py-2 px-2.5 rounded-xl border text-center transition-all cursor-pointer text-xs font-black",
                                                    mascotWatermarkPos === item.id
                                                        ? "bg-emerald-600 text-white shadow-sm border-emerald-600"
                                                        : "bg-white/60 dark:bg-slate-900/60 border-black/10 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:border-black/20"
                                                )}
                                            >
                                                {item.label}
                                            </button>
                                        ))}
                                    </div>

                                    {/* Scale & Opacity Sliders */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div className="space-y-1.5 p-3 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10">
                                            <div className="flex justify-between items-center text-xs font-black text-slate-800 dark:text-slate-200">
                                                <span className="flex items-center gap-1.5">
                                                    <Maximize2 size={13} className="text-emerald-600" />
                                                    Kích cỡ hình ({mascotWatermarkScale}%)
                                                </span>
                                            </div>
                                            <input
                                                type="range"
                                                min="40"
                                                max="200"
                                                step="5"
                                                value={mascotWatermarkScale}
                                                onChange={e => {
                                                    const val = parseFloat(e.target.value);
                                                    setMascotWatermarkScale(val);
                                                    localStorage.setItem("pos_mascot_watermark_scale", String(val));
                                                    broadcastSetting("pos_mascot_watermark_scale", String(val));
                                                }}
                                                className="w-full accent-emerald-600 cursor-pointer h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg"
                                            />
                                        </div>

                                        <div className="space-y-1.5 p-3 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10">
                                            <div className="flex justify-between items-center text-xs font-black text-slate-800 dark:text-slate-200">
                                                <span className="flex items-center gap-1.5">
                                                    <Eye size={13} className="text-emerald-600" />
                                                    Độ đậm / Trong suốt ({mascotWatermarkOpacity}%)
                                                </span>
                                            </div>
                                            <input
                                                type="range"
                                                min="5"
                                                max="60"
                                                step="1"
                                                value={mascotWatermarkOpacity}
                                                onChange={e => {
                                                    const val = parseFloat(e.target.value);
                                                    setMascotWatermarkOpacity(val);
                                                    localStorage.setItem("pos_mascot_watermark_opacity", String(val));
                                                    broadcastSetting("pos_mascot_watermark_opacity", String(val));
                                                }}
                                                className="w-full accent-emerald-600 cursor-pointer h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg"
                                            />
                                        </div>
                                    </div>

                                    {/* Offset X / Y & Rotate */}
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                        <div className="space-y-1.5 p-3 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10">
                                            <div className="flex justify-between items-center text-[11px] font-black text-slate-700 dark:text-slate-300">
                                                <span>Dịch ngang (X):</span>
                                                <span className="font-mono text-emerald-700 dark:text-emerald-400 font-bold">{mascotWatermarkOffsetX > 0 ? `+${mascotWatermarkOffsetX}` : mascotWatermarkOffsetX}px</span>
                                            </div>
                                            <input
                                                type="range"
                                                min="-120"
                                                max="120"
                                                step="2"
                                                value={mascotWatermarkOffsetX}
                                                onChange={e => {
                                                    const val = parseFloat(e.target.value);
                                                    setMascotWatermarkOffsetX(val);
                                                    localStorage.setItem("pos_mascot_watermark_offset_x", String(val));
                                                    broadcastSetting("pos_mascot_watermark_offset_x", String(val));
                                                }}
                                                className="w-full accent-emerald-600 cursor-pointer h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg"
                                            />
                                        </div>

                                        <div className="space-y-1.5 p-3 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10">
                                            <div className="flex justify-between items-center text-[11px] font-black text-slate-700 dark:text-slate-300">
                                                <span>Dịch dọc (Y):</span>
                                                <span className="font-mono text-emerald-700 dark:text-emerald-400 font-bold">{mascotWatermarkOffsetY > 0 ? `+${mascotWatermarkOffsetY}` : mascotWatermarkOffsetY}px</span>
                                            </div>
                                            <input
                                                type="range"
                                                min="-120"
                                                max="120"
                                                step="2"
                                                value={mascotWatermarkOffsetY}
                                                onChange={e => {
                                                    const val = parseFloat(e.target.value);
                                                    setMascotWatermarkOffsetY(val);
                                                    localStorage.setItem("pos_mascot_watermark_offset_y", String(val));
                                                    broadcastSetting("pos_mascot_watermark_offset_y", String(val));
                                                }}
                                                className="w-full accent-emerald-600 cursor-pointer h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg"
                                            />
                                        </div>

                                        <div className="space-y-1.5 p-3 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10">
                                            <div className="flex justify-between items-center text-[11px] font-black text-slate-700 dark:text-slate-300">
                                                <span>Góc xoay nghiêng:</span>
                                                <span className="font-mono text-emerald-700 dark:text-emerald-400 font-bold">{mascotWatermarkRotate}°</span>
                                            </div>
                                            <input
                                                type="range"
                                                min="-45"
                                                max="45"
                                                step="1"
                                                value={mascotWatermarkRotate}
                                                onChange={e => {
                                                    const val = parseFloat(e.target.value);
                                                    setMascotWatermarkRotate(val);
                                                    localStorage.setItem("pos_mascot_watermark_rotate", String(val));
                                                    broadcastSetting("pos_mascot_watermark_rotate", String(val));
                                                }}
                                                className="w-full accent-emerald-600 cursor-pointer h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* TAB 4: BUBBLES & BUTTONS CUSTOMIZATION */}
                    {activeTab === 'bubbles' && (
                        <BubbleCustomizerTab 
                            config={currentConfig} 
                            onChangeConfig={onChangeConfig} 
                        />
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 px-6 border-t border-[#8b6f47]/15 dark:border-white/10 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md flex items-center justify-between">
                    <span className="text-[10.5px] font-bold text-slate-400 flex items-center gap-1.5">
                        <Check size={13} className="text-emerald-500" />
                        Tự động lưu và đồng bộ toàn hệ thống
                    </span>
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-xs uppercase tracking-wider shadow-md shadow-emerald-950/20 transition-all cursor-pointer hover:scale-105 active:scale-95"
                        style={currentConfig.accentColor !== 'default' ? { backgroundColor: currentConfig.accentColor } : undefined}
                    >
                        Hoàn tất & Đóng
                    </button>
                </div>
            </m.div>
        </div>,
        document.body
    );
}

