import React, { useState, useEffect, useRef } from 'react';
import { motion as m, AnimatePresence } from 'framer-motion';
import { 
    Palette, X, RotateCcw, Check, Sparkles, Sliders, Eye, SunMedium, 
    Layers, Zap, Square, ShoppingCart, Clock, Bell, Image as ImageIcon,
    SlidersHorizontal, Compass, Move, Maximize2, ShieldAlert, Paintbrush, Droplet,
    Bookmark, Plus, Trash2, ChevronDown, ChevronUp, FolderHeart, Upload, RefreshCw,
    Layout as LayoutIcon, Monitor, CheckCircle2, BookmarkCheck, ChevronRight
} from 'lucide-react';
import { cn } from '../../lib/utils';
import Portal from '../widgets/Portal';
import BubbleCustomizerTab, { getBubbleComputedStyle, getButtonComputedStyle, getBubbleBadgeStyle, adjustColor, BUBBLE_PRESETS } from './BubbleCustomizerTab';
import BadgeCustomizerTab, { getBadgeComputedStyle, BADGE_PRESETS } from './BadgeCustomizerTab';

export { getBubbleComputedStyle, getButtonComputedStyle, getBubbleBadgeStyle, adjustColor, BUBBLE_PRESETS, getBadgeComputedStyle, BADGE_PRESETS };

export const PAGE_BG_SWATCHES = [
    { name: 'Mặc định (Lyang)', color: 'default', preview: '#faf8f3' },
    { name: 'Trắng Tinh Khôi', color: '#ffffff', preview: '#ffffff' },
    { name: 'Xanh Thảo Mộc', color: '#e2eed5', preview: '#e2eed5' },
    { name: 'Xanh Bạc Hà', color: '#ecfdf5', preview: '#ecfdf5' },
    { name: 'Vàng Kem Ấm', color: '#fefce8', preview: '#fefce8' },
    { name: 'Xanh Lam Dịu', color: '#f0f9ff', preview: '#f0f9ff' },
    { name: 'Hồng Phấn Nhạt', color: '#fff1f2', preview: '#fff1f2' },
    { name: 'Xám Tối Giản', color: '#f8fafc', preview: '#f8fafc' },
    { name: 'Nâu Be Mộc', color: '#f7f3ee', preview: '#f7f3ee' },
    { name: 'Tím Oải Hương', color: '#f5f3ff', preview: '#f5f3ff' },
];

/**
 * Safely compresses and scales down user uploaded watermark images on client-side
 * using HTML5 Canvas to prevent browser memory exhaustion and localStorage QuotaExceededError.
 */
export const compressImageForWatermark = (file, maxDim = 512, quality = 0.85) => {
    return new Promise((resolve, reject) => {
        if (!file) return reject(new Error("Không tìm thấy tệp ảnh"));
        if (!file.type || !file.type.startsWith('image/')) {
            return reject(new Error("Vui lòng chọn định dạng ảnh hợp lệ (PNG, JPG, WebP, SVG)"));
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                try {
                    let w = img.naturalWidth || img.width;
                    let h = img.naturalHeight || img.height;

                    if (!w || !h) {
                        return reject(new Error("Không thể xác định kích thước ảnh"));
                    }

                    if (w > maxDim || h > maxDim) {
                        if (w > h) {
                            h = Math.round((h * maxDim) / w);
                            w = maxDim;
                        } else {
                            w = Math.round((w * maxDim) / h);
                            h = maxDim;
                        }
                    }

                    const canvas = document.createElement('canvas');
                    canvas.width = Math.max(1, w);
                    canvas.height = Math.max(1, h);
                    const ctx = canvas.getContext('2d');
                    if (!ctx) {
                        return reject(new Error("Lỗi Canvas context"));
                    }

                    ctx.clearRect(0, 0, w, h);
                    ctx.drawImage(img, 0, 0, w, h);

                    const mime = (file.type === 'image/jpeg' || file.type === 'image/jpg') ? 'image/jpeg' : 'image/png';
                    const dataUrl = canvas.toDataURL(mime, quality);

                    // Clean up canvas
                    canvas.width = 0;
                    canvas.height = 0;

                    resolve(dataUrl);
                } catch (err) {
                    reject(err);
                }
            };
            img.onerror = () => reject(new Error("Không thể nạp hình ảnh"));
            img.src = e.target.result;
        };
        reader.onerror = () => reject(new Error("Lỗi đọc tệp"));
        reader.readAsDataURL(file);
    });
};

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
    pageBgColor: 'default',
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
    bubbleLayoutStyle: 'modern',
    cartRowAnimation: 'waterfall',
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
    enableSearchTypingAnimation: true,
    enableTextPills: false,
    textPillStyle: 'glass',
    pillBgColor: 'default',
    pillBorderColor: 'default',
    pillBlur: 12,
    pillOpacity: 25,
    pillRadius: 16,
    pillGlow: true,
    textShadowMode: 'none',
    textGlowColor: 'default',
    textShadowColor: 'default',
    textShadowBlur: 6,
    constrainCartAboveBubbles: true,
    badgeCustomMode: 'all',
    badgeBorderWidth: '2',
    badgeEnableBorder: true,
    badgeEnableShadow: false,
    badgeBg: 'default',
    badgeBorderColor: 'default',
    badgeTextColor: 'default',
    badgeStockBg: 'default',
    badgeStockBorder: 'default',
    badgeStockText: 'default',
    badgePurchaseBg: 'default',
    badgePurchaseBorder: 'default',
    badgePurchaseText: 'default',
    badgeLowPriceBg: 'default',
    badgeLowPriceBorder: 'default',
    badgeLowPriceText: 'default',
    badgeLossBg: 'default',
    badgeLossBorder: 'default',
    badgeLossText: 'default',
    badgeDeliveryBg: 'default',
    badgeDeliveryBorder: 'default',
    badgeDeliveryText: 'default',
    badgeDeliveryBorderWidth: '2',
    badgeDeliveryEnableBorder: true,
    badgeDeliveryEnableShadow: true
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

    // Màu nền toàn bộ trang trong POS (Áp dụng cho Light Mode, giữ nguyên Dark Mode)
    const isDark = root.classList.contains('dark') || localStorage.getItem('theme') === 'dark';
    if (cfg && cfg.pageBgColor && cfg.pageBgColor !== 'default') {
        const bg = cfg.pageBgColor;
        root.style.setProperty('--custom-page-bg', bg);
        if (!isDark) {
            root.style.setProperty('--bg-color', bg);
            root.style.setProperty('--color-app-bg', bg);
            root.style.setProperty('--color-background', bg);
            root.style.setProperty('--main-gradient', bg);
        } else {
            root.style.setProperty('--bg-color', '#000000');
            root.style.setProperty('--color-app-bg', '#000000');
            root.style.setProperty('--color-background', '#000000');
            root.style.setProperty('--main-gradient', 'linear-gradient(180deg, #000000 0%, #080605 100%)');
        }
    } else {
        root.style.removeProperty('--custom-page-bg');
        if (!isDark) {
            root.style.removeProperty('--bg-color');
            root.style.removeProperty('--color-app-bg');
            root.style.removeProperty('--color-background');
            root.style.removeProperty('--main-gradient');
        } else {
            root.style.setProperty('--bg-color', '#000000');
            root.style.setProperty('--color-app-bg', '#000000');
            root.style.setProperty('--color-background', '#000000');
            root.style.setProperty('--main-gradient', 'linear-gradient(180deg, #000000 0%, #080605 100%)');
        }
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
    activeTab: initialTab = 'themes'
}) {
    const getNormalizedTab = (tab) => {
        if (!tab) return 'themes';
        if (tab === 'colors' || tab === 'themes') return 'themes';
        if (tab === 'table_colors' || tab === 'cart') return 'cart';
        if (tab === 'displays' || tab === 'effects') return 'effects';
        if (tab === 'mascot') return 'mascot';
        if (tab === 'bubbles' || tab === 'badges') return 'bubbles';
        return 'themes';
    };

    const [activeTab, setActiveTab] = useState(() => getNormalizedTab(initialTab));
    const [bubblesSubTab, setBubblesSubTab] = useState(() => (initialTab === 'badges' ? 'badges' : 'bubbles'));
    const [showTab1Preview, setShowTab1Preview] = useState(false);

    // Additional display settings stored in localStorage
    const [transparentCartTable, setTransparentCartTable] = useState(() => localStorage.getItem("pos_transparent_cart_table") === "true");
    const [showLastPurchaseBadge, setShowLastPurchaseBadge] = useState(() => localStorage.getItem("pos_show_last_purchase_badge") !== "false");

    // Mascot Watermark settings
    const [mascotWatermarkVisible, setMascotWatermarkVisible] = useState(() => localStorage.getItem("pos_mascot_watermark_visible") !== "false");
    const [mascotWatermarkPos, setMascotWatermarkPos] = useState(() => localStorage.getItem("pos_mascot_watermark_pos") || "bottom-right");
    const [mascotWatermarkScale, setMascotWatermarkScale] = useState(() => parseFloat(localStorage.getItem("pos_mascot_watermark_scale") || "100"));
    const [mascotWatermarkOpacity, setMascotWatermarkOpacity] = useState(() => parseFloat(localStorage.getItem("pos_mascot_watermark_opacity") || "15"));
    const [mascotWatermarkRotate, setMascotWatermarkRotate] = useState(() => parseFloat(localStorage.getItem("pos_mascot_watermark_rotate") || "-6"));
    const [mascotWatermarkOffsetX, setMascotWatermarkOffsetX] = useState(() => parseFloat(localStorage.getItem("pos_mascot_watermark_offset_x") || "10"));
    const [mascotWatermarkOffsetY, setMascotWatermarkOffsetY] = useState(() => parseFloat(localStorage.getItem("pos_mascot_watermark_offset_y") || "10"));
    const [mascotWatermarkCustomImage, setMascotWatermarkCustomImage] = useState(() => {
        try {
            return localStorage.getItem("pos_mascot_watermark_custom_image") || null;
        } catch (e) {
            return null;
        }
    });
    const [isCompressingMascot, setIsCompressingMascot] = useState(false);
    const mascotFileInputRef = useRef(null);

    // Custom presets list & UI states
    const [customPresets, setCustomPresets] = useState(() => {
        try {
            const saved = localStorage.getItem("pos_cart_custom_presets");
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            return [];
        }
    });
    const [isSavingPreset, setIsSavingPreset] = useState(false);
    const [presetNameInput, setPresetNameInput] = useState('');
    const [showAllBuiltinPresets, setShowAllBuiltinPresets] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setTransparentCartTable(localStorage.getItem("pos_transparent_cart_table") === "true");
            setShowLastPurchaseBadge(localStorage.getItem("pos_show_last_purchase_badge") !== "false");
            setMascotWatermarkVisible(localStorage.getItem("pos_mascot_watermark_visible") !== "false");
            setMascotWatermarkPos(localStorage.getItem("pos_mascot_watermark_pos") || "bottom-right");
            setMascotWatermarkScale(parseFloat(localStorage.getItem("pos_mascot_watermark_scale") || "100"));
            setMascotWatermarkOpacity(parseFloat(localStorage.getItem("pos_mascot_watermark_opacity") || "15"));
            setMascotWatermarkRotate(parseFloat(localStorage.getItem("pos_mascot_watermark_rotate") || "-6"));
            setMascotWatermarkOffsetX(parseFloat(localStorage.getItem("pos_mascot_watermark_offset_x") || "10"));
            setMascotWatermarkOffsetY(parseFloat(localStorage.getItem("pos_mascot_watermark_offset_y") || "10"));
            try {
                setMascotWatermarkCustomImage(localStorage.getItem("pos_mascot_watermark_custom_image") || null);
            } catch (e) {}
            try {
                const saved = localStorage.getItem("pos_cart_custom_presets");
                if (saved) setCustomPresets(JSON.parse(saved));
            } catch (e) {}
            if (initialTab) {
                setActiveTab(getNormalizedTab(initialTab));
                if (initialTab === 'badges') setBubblesSubTab('badges');
            }
        }
    }, [isOpen, initialTab]);

    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                onClose?.();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    const currentConfig = { 
        ...DEFAULT_CART_COLOR_CONFIG, 
        orderSwitchAnimation: localStorage.getItem('pos_order_switch_animation') || 'ring',
        enableSearchTypingAnimation: config?.enableSearchTypingAnimation !== undefined 
            ? Boolean(config.enableSearchTypingAnimation) 
            : (localStorage.getItem("pos_search_typing_animation") !== "false"),
        ...config 
    };

    const activeAccentColor = currentConfig.accentColor !== 'default' ? currentConfig.accentColor : '#2d5016';

    const broadcastSetting = (key, value) => {
        try {
            const syncChan = new BroadcastChannel('pos_data_sync');
            syncChan.postMessage({ type: 'UI_SETTING_UPDATED', key, value });
            syncChan.close();
        } catch (e) {}
    };

    const saveCustomPresetsToStorage = (newList) => {
        setCustomPresets(newList);
        localStorage.setItem("pos_cart_custom_presets", JSON.stringify(newList));
        broadcastSetting("pos_cart_custom_presets", JSON.stringify(newList));
    };

    const handleSaveCustomPreset = () => {
        const trimmed = presetNameInput.trim() || `Theme Tự Tạo #${customPresets.length + 1}`;
        const newPreset = {
            id: `custom_preset_${Date.now()}`,
            name: trimmed,
            desc: `Tự tạo ngày ${new Date().toLocaleDateString('vi-VN')}`,
            headerBg: currentConfig.headerBg,
            headerText: currentConfig.headerText,
            borderColor: currentConfig.borderColor,
            borderWidth: currentConfig.borderWidth,
            accentColor: currentConfig.accentColor || 'default',
            productTextColor: currentConfig.productTextColor || 'default',
            cartValuesColor: currentConfig.cartValuesColor || 'default',
            pageBgColor: currentConfig.pageBgColor || 'default',
            previewHeaderBg: currentConfig.headerBg !== 'default' ? currentConfig.headerBg : '#8b6f47',
            previewBorder: currentConfig.borderColor !== 'default' ? currentConfig.borderColor : '#8b6f47',
            previewAccent: currentConfig.accentColor !== 'default' ? currentConfig.accentColor : '#2d5016',
            fullConfig: { ...currentConfig },
            isCustom: true,
            createdAt: Date.now()
        };
        const updated = [newPreset, ...customPresets];
        saveCustomPresetsToStorage(updated);
        setIsSavingPreset(false);
        setPresetNameInput('');
    };

    const handleDeleteCustomPreset = (presetId, e) => {
        e?.stopPropagation?.();
        if (window.confirm("Bạn có chắc chắn muốn xóa preset này?")) {
            const updated = customPresets.filter(p => p.id !== presetId);
            saveCustomPresetsToStorage(updated);
        }
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

    const handleToggleMascotVisible = () => {
        const val = !mascotWatermarkVisible;
        setMascotWatermarkVisible(val);
        localStorage.setItem("pos_mascot_watermark_visible", String(val));
        broadcastSetting("pos_mascot_watermark_visible", String(val));
    };

    const handleMascotFileUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            setIsCompressingMascot(true);
            const compressedBase64 = await compressImageForWatermark(file, 512, 0.85);
            setMascotWatermarkCustomImage(compressedBase64);
            try {
                localStorage.setItem("pos_mascot_watermark_custom_image", compressedBase64);
            } catch (storageErr) {
                console.warn("Storage quota warning, fallback session only:", storageErr);
            }
            broadcastSetting("pos_mascot_watermark_custom_image", compressedBase64);
        } catch (err) {
            alert(err.message || "Lỗi xử lý ảnh");
        } finally {
            setIsCompressingMascot(false);
            if (e.target) e.target.value = '';
        }
    };

    const handleResetMascotToDefault = () => {
        setMascotWatermarkCustomImage(null);
        try {
            localStorage.removeItem("pos_mascot_watermark_custom_image");
        } catch (e) {}
        broadcastSetting("pos_mascot_watermark_custom_image", null);
    };

    const handleApplyPreset = (preset) => {
        if (preset.fullConfig) {
            onChangeConfig({ ...preset.fullConfig });
            applyCartThemeToDom(preset.fullConfig);
        } else {
            const newCfg = {
                ...currentConfig,
                headerBg: preset.headerBg,
                headerText: preset.headerText,
                borderColor: preset.borderColor,
                borderWidth: preset.borderWidth,
                accentColor: preset.accentColor || 'default',
                productTextColor: preset.productTextColor || 'default',
                cartValuesColor: preset.cartValuesColor || currentConfig.cartValuesColor || 'default',
                pageBgColor: preset.pageBgColor || currentConfig.pageBgColor || 'default'
            };
            onChangeConfig(newCfg);
            applyCartThemeToDom(newCfg);
        }
    };

    const isPresetSelected = (preset) => {
        return currentConfig.headerBg === preset.headerBg && 
               currentConfig.headerText === preset.headerText && 
               currentConfig.borderColor === preset.borderColor &&
               (currentConfig.accentColor || 'default') === (preset.accentColor || 'default') &&
               (currentConfig.productTextColor || 'default') === (preset.productTextColor || 'default') &&
               (currentConfig.borderWidth || '1') === preset.borderWidth;
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

    const TABS = [
        { id: 'themes', label: '1. Giao Diện & Nền', icon: Palette, desc: 'Presets & Màu trang' },
        { id: 'cart', label: '2. Bảng Giỏ Hàng', icon: ShoppingCart, desc: 'Tiêu đề, chữ & giá' },
        { id: 'effects', label: '3. Kính & Viền', icon: SlidersHorizontal, desc: 'Độ mờ, Neon & 3D' },
        { id: 'mascot', label: '4. Mascot Chìm', icon: ImageIcon, desc: 'Linh vật trong giỏ' },
        { id: 'bubbles', label: '5. Nút & Nhãn', icon: Sparkles, desc: 'Bubbles & Badges' },
    ];

    if (typeof document === 'undefined') return null;

    /**
     * Reusable Live Preview Table for Cart
     */
    const renderLivePreview = (compact = false) => {
        return (
            <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    <span className="flex items-center gap-1.5">
                        <Eye size={14} className="text-emerald-600 dark:text-emerald-400" />
                        Xem trước giỏ hàng thực tế (Live Preview)
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">
                        Cập nhật tức thì
                    </span>
                </div>

                <div 
                    className={cn(
                        "w-full rounded-2xl overflow-hidden transition-all duration-300 relative select-none",
                        transparentCartTable && (!currentConfig.overlayColor || currentConfig.overlayColor === 'default') 
                            ? "bg-card/40" 
                            : (!transparentCartTable ? "bg-white/80 dark:bg-slate-900/70" : "")
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
                                src={mascotWatermarkCustomImage || "/assets/images/user_mascot.png"}
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
                                <th className="py-2.5 px-3 font-black uppercase text-[10px] w-12 text-center" style={{ color: currentConfig.headerText !== 'default' ? currentConfig.headerText : undefined }}>Stt</th>
                                <th className="py-2.5 px-3 font-black uppercase text-[10px]" style={{ color: currentConfig.headerText !== 'default' ? currentConfig.headerText : undefined }}>
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
                                <th className="py-2.5 px-3 font-black uppercase text-[10px] text-center w-20" style={{ color: currentConfig.headerText !== 'default' ? currentConfig.headerText : undefined }}>Số lượng</th>
                                <th className="py-2.5 px-3 font-black uppercase text-[10px] text-right w-24" style={{ color: currentConfig.headerText !== 'default' ? currentConfig.headerText : undefined }}>Đơn giá</th>
                                <th className="py-2.5 px-3 font-black uppercase text-[10px] text-right w-28" style={{ color: currentConfig.headerText !== 'default' ? currentConfig.headerText : undefined }}>Thành tiền</th>
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
                                            Phân bón NPK 20-20-15 Cao Cấp
                                        </div>
                                    </div>
                                    {showLastPurchaseBadge && (
                                        <div className="inline-flex items-center gap-1 mt-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
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
                                        2 bao
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
                                        450.000
                                    </span>
                                </td>
                                <td className="py-2.5 px-3 text-right font-black">
                                    <span 
                                        className={cn(
                                            "inline-flex items-center justify-end",
                                            currentConfig.enableTextPills && "px-2 py-1 rounded-xl border shadow-xs"
                                        )}
                                        style={{
                                            color: (currentConfig.cartValuesColor && currentConfig.cartValuesColor !== 'default') ? currentConfig.cartValuesColor : activeAccentColor,
                                            ...(currentConfig.enableTextPills ? getCartTextPillStyle(currentConfig, 'amount') : {}),
                                            ...getCartTextShadowStyle(currentConfig, currentConfig.cartValuesColor || activeAccentColor)
                                        }}
                                    >
                                        900.000đ
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
                            <span>900.000đ</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    /**
     * Reusable Color Field Card
     */
    const renderColorField = ({
        id,
        label,
        desc,
        value,
        defaultValue = 'default',
        defaultLabel = 'Mặc định (Theme)',
        swatches = [],
        onChange
    }) => {
        const isCustom = value && value !== defaultValue;
        return (
            <div className="p-4 rounded-2xl bg-white/70 dark:bg-slate-900/50 border border-[#8b6f47]/15 dark:border-white/10 space-y-3 shadow-xs transition-all hover:border-[#8b6f47]/30 dark:hover:border-white/20">
                <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                        <div className="font-black text-xs uppercase tracking-tight text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                            <span>{label}</span>
                        </div>
                        {desc && (
                            <p className="text-[10.5px] text-slate-500 dark:text-slate-400 mt-0.5">
                                {desc}
                            </p>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] px-2 py-0.5 rounded-lg bg-black/5 dark:bg-white/10 text-slate-700 dark:text-slate-300 font-bold">
                            {isCustom ? value : defaultLabel}
                        </span>
                        {isCustom && (
                            <button
                                type="button"
                                onClick={() => onChange(defaultValue)}
                                className="px-2 py-0.5 text-[10px] font-bold text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                                title="Khôi phục mặc định"
                            >
                                Đặt lại
                            </button>
                        )}
                    </div>
                </div>

                {/* Swatches Grid */}
                {swatches.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap pt-1">
                        {swatches.map((color) => {
                            const isSelected = value === color;
                            return (
                                <button
                                    key={color}
                                    type="button"
                                    onClick={() => onChange(color)}
                                    className={cn(
                                        "w-6 h-6 rounded-lg transition-all flex items-center justify-center cursor-pointer shadow-xs",
                                        isSelected ? "scale-115 ring-2 ring-emerald-500 ring-offset-1 dark:ring-offset-slate-900 z-10" : "hover:scale-110 opacity-85 hover:opacity-100"
                                    )}
                                    style={{ 
                                        backgroundColor: color,
                                        border: color === '#ffffff' ? '1px solid rgba(0,0,0,0.15)' : '1px solid rgba(0,0,0,0.1)'
                                    }}
                                    title={color}
                                >
                                    {isSelected && (
                                        <Check 
                                            size={12} 
                                            strokeWidth={3} 
                                            className={['#ffffff', '#fefce8', '#f8fafc', '#fff1f2', '#e2eed5', '#ecfdf5', '#fde68a'].includes(color) ? "text-slate-900" : "text-white"} 
                                        />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                )}

                {/* Hex input & native color picker */}
                <div className="flex items-center gap-2 pt-1 border-t border-black/5 dark:border-white/5">
                    <label className="relative w-8 h-8 rounded-xl overflow-hidden cursor-pointer border border-black/15 dark:border-white/20 shrink-0 shadow-xs hover:scale-105 transition-transform" title="Bấm để chọn màu tùy biến">
                        <input
                            type="color"
                            value={isCustom ? value : '#8b6f47'}
                            onChange={(e) => onChange(e.target.value)}
                            className="absolute -top-4 -left-4 w-16 h-16 cursor-pointer opacity-0"
                        />
                        <div 
                            className="w-full h-full" 
                            style={{ backgroundColor: isCustom ? value : '#8b6f47' }} 
                        />
                    </label>

                    <div className="relative flex-1">
                        <input
                            type="text"
                            value={isCustom ? value : ''}
                            onChange={(e) => onChange(e.target.value)}
                            placeholder={defaultLabel}
                            className="w-full px-3 py-1.5 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-xs font-mono font-bold text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                        />
                    </div>
                </div>
            </div>
        );
    };

    return (
        <Portal>
            <AnimatePresence>
                {isOpen && (
                    <m.div 
                        key="cart-color-customizer-modal-wrapper"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.18 }}
                        className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-5 select-none"
                    >
                        <m.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.18 }}
                            onClick={onClose}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm transform-gpu will-change-transform"
                        />

                        <m.div
                            initial={{ opacity: 0, scale: 0.95, y: 12 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 12 }}
                            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                            className="relative w-full max-w-4xl bg-[#faf8f3] dark:bg-[#07130c] border border-[#8b6f47]/30 dark:border-emerald-500/30 rounded-[2rem] shadow-[0_25px_80px_rgba(0,0,0,0.55)] overflow-hidden z-10 flex flex-col max-h-[92vh] transform-gpu will-change-transform"
                        >
                            {/* Modal Header */}
                            <div className="px-6 pt-5 pb-3 border-b border-[#8b6f47]/15 dark:border-white/10 bg-white/60 dark:bg-black/40 backdrop-blur-xl shrink-0">
                                <div className="flex items-center justify-between mb-3.5">
                                    <div className="flex items-center gap-3">
                                        <div 
                                            className="w-11 h-11 rounded-2xl text-white flex items-center justify-center shadow-md transition-all shrink-0"
                                            style={{ 
                                                backgroundColor: activeAccentColor,
                                                boxShadow: `0 8px 20px ${activeAccentColor}40`
                                            }}
                                        >
                                            <Palette size={22} strokeWidth={2.5} />
                                        </div>
                                        <div>
                                            <h3 className="font-black text-base uppercase tracking-wider text-slate-800 dark:text-slate-100 flex items-center gap-2">
                                                <span>Tùy Chỉnh Giỏ Hàng & Giao Diện POS</span>
                                                <span className="text-[10px] bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 font-extrabold px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                                                    Theo Theme
                                                </span>
                                            </h3>
                                            <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                                                Cá nhân hóa màu sắc giỏ hàng, màu nền trang, hiệu ứng kính mờ và linh vật chìm
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={onClose}
                                        className="w-9 h-9 rounded-2xl flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                                        title="Đóng (Esc)"
                                    >
                                        <X size={20} strokeWidth={2.5} />
                                    </button>
                                </div>

                                {/* Modern Segmented Navigation Tabs */}
                                <div className="overflow-x-auto custom-scrollbar pb-0.5">
                                    <div className="grid grid-cols-5 min-w-[620px] p-1 bg-black/5 dark:bg-white/5 rounded-2xl gap-1 border border-black/5 dark:border-white/10">
                                        {TABS.map((tab) => {
                                            const isActive = activeTab === tab.id;
                                            const IconComp = tab.icon;
                                            return (
                                                <button
                                                    key={tab.id}
                                                    type="button"
                                                    onClick={() => setActiveTab(tab.id)}
                                                    className={cn(
                                                        "w-full py-2 px-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer select-none",
                                                        isActive
                                                            ? "bg-white dark:bg-[#0e271d] text-slate-900 dark:text-emerald-400 shadow-sm border border-black/5 dark:border-emerald-500/30 scale-[1.01]"
                                                            : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-black/5 dark:hover:bg-white/5"
                                                    )}
                                                >
                                                    <IconComp size={14} strokeWidth={2.5} className={cn("shrink-0", isActive && "text-emerald-600 dark:text-emerald-400")} />
                                                    <span className="truncate">{tab.label}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            {/* Modal Body */}
                            <div className="p-6 overflow-y-auto space-y-6 custom-scrollbar flex-1">
                                {/* TAB 1: GIAO DIỆN & NỀN (THEMES & BACKGROUNDS) */}
                                {activeTab === 'themes' && (
                                    <div className="space-y-6">
                                        {/* Status & Quick Preview Toggle */}
                                        <div className="p-4 rounded-2xl bg-white/70 dark:bg-slate-900/50 border border-[#8b6f47]/15 dark:border-white/10 flex items-center justify-between flex-wrap gap-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                                                    <Sparkles size={20} />
                                                </div>
                                                <div>
                                                    <div className="text-xs font-black uppercase text-slate-800 dark:text-slate-100">
                                                        Phối Màu Giỏ Hàng Đang Áp Dụng
                                                    </div>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Bảng màu:</span>
                                                        <div className="w-4 h-4 rounded-md border border-black/10 shadow-xs" style={{ backgroundColor: currentConfig.headerBg !== 'default' ? currentConfig.headerBg : '#8b6f47' }} title="Header" />
                                                        <div className="w-4 h-4 rounded-md border-2 shadow-xs" style={{ borderColor: currentConfig.borderColor !== 'default' ? currentConfig.borderColor : '#8b6f47', backgroundColor: 'transparent' }} title="Border" />
                                                        <div className="w-4 h-4 rounded-md shadow-xs" style={{ backgroundColor: activeAccentColor }} title="Accent" />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => setShowTab1Preview(prev => !prev)}
                                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all cursor-pointer"
                                                >
                                                    <Eye size={13} className="text-emerald-600 dark:text-emerald-400" />
                                                    <span>{showTab1Preview ? "Thu gọn xem trước" : "Xem trước bảng giỏ"}</span>
                                                    {showTab1Preview ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={handleResetColors}
                                                    className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                                                    title="Khôi phục toàn bộ về mặc định ban đầu"
                                                >
                                                    <RotateCcw size={12} />
                                                    <span>Mặc định</span>
                                                </button>
                                            </div>
                                        </div>

                                        {/* Optional Live Preview if toggled */}
                                        <AnimatePresence>
                                            {showTab1Preview && (
                                                <m.div
                                                    initial={{ opacity: 0, height: 0 }}
                                                    animate={{ opacity: 1, height: 'auto' }}
                                                    exit={{ opacity: 0, height: 0 }}
                                                    transition={{ duration: 0.2 }}
                                                >
                                                    {renderLivePreview()}
                                                </m.div>
                                            )}
                                        </AnimatePresence>

                                        {/* Section: Màu Nền Tất Cả Trang Trong POS */}
                                        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-teal-500/10 border border-emerald-500/25 shadow-xs space-y-4">
                                            <div className="flex items-center justify-between flex-wrap gap-2">
                                                <div className="flex items-center gap-2.5">
                                                    <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/25">
                                                        <LayoutIcon size={18} />
                                                    </div>
                                                    <div>
                                                        <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-100 flex items-center gap-2">
                                                            <span>Màu Nền Tất Cả Trang Trong POS</span>
                                                            <span className="text-[9.5px] px-2 py-0.5 rounded-full bg-emerald-600/15 text-emerald-800 dark:text-emerald-300 font-extrabold border border-emerald-600/20">
                                                                All Pages Background
                                                            </span>
                                                        </h4>
                                                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                                                            Áp dụng đồng bộ cho tất cả các trang: Bán hàng, Nhập hàng, Báo cáo, Lịch sử, Khách hàng...
                                                        </p>
                                                    </div>
                                                </div>

                                                <span className="font-mono text-xs px-2.5 py-1 rounded-xl bg-white dark:bg-slate-900 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 font-bold shadow-2xs">
                                                    {(!currentConfig.pageBgColor || currentConfig.pageBgColor === 'default') ? 'Mặc định (#faf8f3)' : currentConfig.pageBgColor}
                                                </span>
                                            </div>

                                            {/* Note about Dark Mode protection */}
                                            <div className="p-3 rounded-xl bg-white/70 dark:bg-slate-900/60 border border-emerald-500/20 flex items-start gap-2.5 text-[11px] text-slate-600 dark:text-slate-300">
                                                <Monitor size={15} className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                                                <div>
                                                    <strong className="text-emerald-700 dark:text-emerald-400">Cơ chế Dark Mode tự động:</strong> Khi bạn chuyển sang Chế độ Tối (Dark Mode), hệ thống sẽ tự động giữ nguyên màu đen chuẩn sang trọng (<code className="font-mono text-[10px] bg-black/10 dark:bg-white/10 px-1 py-0.5 rounded">#000000</code> / Obsidian Dark) để bảo vệ mắt và giữ độ tương phản cao nhất.
                                                </div>
                                            </div>

                                            {/* Swatches Grid */}
                                            <div>
                                                <div className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                                                    Bảng Màu Tuyển Chọn (1 Chạm Để Đổi):
                                                </div>
                                                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                                                    {PAGE_BG_SWATCHES.map((swatch) => {
                                                        const isSelected = (!currentConfig.pageBgColor || currentConfig.pageBgColor === 'default')
                                                            ? swatch.color === 'default'
                                                            : currentConfig.pageBgColor === swatch.color;
                                                        return (
                                                            <button
                                                                key={swatch.name}
                                                                type="button"
                                                                onClick={() => {
                                                                    const newCfg = { ...currentConfig, pageBgColor: swatch.color };
                                                                    onChangeConfig(newCfg);
                                                                    applyCartThemeToDom(newCfg);
                                                                }}
                                                                className={cn(
                                                                    "flex items-center gap-2 p-2 rounded-xl border text-left transition-all cursor-pointer shadow-2xs hover:scale-[1.02] active:scale-98",
                                                                    isSelected
                                                                        ? "bg-white dark:bg-slate-900 border-emerald-500 dark:border-emerald-400 ring-2 ring-emerald-500/30"
                                                                        : "bg-white/60 dark:bg-white/5 border-black/10 dark:border-white/10 hover:border-black/20"
                                                                )}
                                                            >
                                                                <div 
                                                                    className="w-5 h-5 rounded-lg border border-black/15 shadow-2xs shrink-0 flex items-center justify-center"
                                                                    style={{ backgroundColor: swatch.preview }}
                                                                >
                                                                    {isSelected && <Check size={11} strokeWidth={3} className="text-slate-800" />}
                                                                </div>
                                                                <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 truncate">
                                                                    {swatch.name}
                                                                </span>
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>

                                            {/* Custom HEX & Native Color Picker */}
                                            <div className="flex items-center gap-3 pt-1">
                                                <div className="flex items-center gap-2 flex-1">
                                                    <label className="relative w-8 h-8 rounded-xl overflow-hidden cursor-pointer border border-emerald-500/40 shrink-0 shadow-xs hover:scale-105 transition-transform" title="Chọn màu tự do">
                                                        <input
                                                            type="color"
                                                            value={(!currentConfig.pageBgColor || currentConfig.pageBgColor === 'default') ? '#faf8f3' : currentConfig.pageBgColor}
                                                            onChange={(e) => {
                                                                const newCfg = { ...currentConfig, pageBgColor: e.target.value };
                                                                onChangeConfig(newCfg);
                                                                applyCartThemeToDom(newCfg);
                                                            }}
                                                            className="absolute -top-4 -left-4 w-16 h-16 cursor-pointer opacity-0"
                                                        />
                                                        <div 
                                                            className="w-full h-full"
                                                            style={{ backgroundColor: (!currentConfig.pageBgColor || currentConfig.pageBgColor === 'default') ? '#faf8f3' : currentConfig.pageBgColor }} 
                                                        />
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={(!currentConfig.pageBgColor || currentConfig.pageBgColor === 'default') ? '' : currentConfig.pageBgColor}
                                                        placeholder="Hoặc nhập mã HEX tùy ý (vd: #f5f0eb)..."
                                                        onChange={(e) => {
                                                            const newCfg = { ...currentConfig, pageBgColor: e.target.value };
                                                            onChangeConfig(newCfg);
                                                            applyCartThemeToDom(newCfg);
                                                        }}
                                                        className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-emerald-500/30 text-xs font-mono font-bold text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                                    />
                                                </div>

                                                {currentConfig.pageBgColor && currentConfig.pageBgColor !== 'default' && (
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            const newCfg = { ...currentConfig, pageBgColor: 'default' };
                                                            onChangeConfig(newCfg);
                                                            applyCartThemeToDom(newCfg);
                                                        }}
                                                        className="px-3 py-1.5 rounded-xl text-xs font-bold text-rose-500 hover:bg-rose-500/10 border border-rose-500/20 transition-colors cursor-pointer shrink-0"
                                                    >
                                                        Về mặc định
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        {/* Section: Presets Themes Mẫu */}
                                        <div className="space-y-3.5">
                                            <div className="flex items-center justify-between flex-wrap gap-2">
                                                <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                                    <BookmarkCheck size={14} className="text-amber-500" />
                                                    Bộ Sưu Tập Theme Mẫu Sẵn Có (Presets)
                                                </h4>
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setPresetNameInput(`Theme #${customPresets.length + 1}`);
                                                            setIsSavingPreset(prev => !prev);
                                                        }}
                                                        className="flex items-center gap-1 px-3 py-1 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/30 text-[10.5px] font-black uppercase tracking-wider transition-all cursor-pointer shadow-2xs hover:scale-105 active:scale-95"
                                                    >
                                                        <Plus size={12} strokeWidth={3} />
                                                        <span>Lưu Phối Màu Hiện Tại</span>
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Form lưu theme hiện tại */}
                                            <AnimatePresence>
                                                {isSavingPreset && (
                                                    <m.div
                                                        initial={{ opacity: 0, height: 0, y: -6 }}
                                                        animate={{ opacity: 1, height: 'auto', y: 0 }}
                                                        exit={{ opacity: 0, height: 0, y: -6 }}
                                                        transition={{ duration: 0.18 }}
                                                        className="p-3.5 rounded-2xl bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/30 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs"
                                                    >
                                                        <div className="flex items-center gap-2.5 w-full sm:w-auto flex-1">
                                                            <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                                                                <Bookmark size={15} />
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <div className="text-[10.5px] font-black uppercase tracking-wider text-amber-900 dark:text-amber-300">
                                                                    Tên Theme Preset Mới:
                                                                </div>
                                                                <input
                                                                    type="text"
                                                                    value={presetNameInput}
                                                                    onChange={(e) => setPresetNameInput(e.target.value)}
                                                                    placeholder="VD: Xanh Neon, Theme Tết, Nâu Cổ Điển..."
                                                                    className="w-full mt-1 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-amber-500/30 text-xs font-bold text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                                                                    autoFocus
                                                                    onKeyDown={(e) => {
                                                                        if (e.key === 'Enter') handleSaveCustomPreset();
                                                                        if (e.key === 'Escape') setIsSavingPreset(false);
                                                                    }}
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
                                                            <button
                                                                type="button"
                                                                onClick={() => setIsSavingPreset(false)}
                                                                className="px-3 py-1.5 rounded-xl text-slate-500 hover:text-slate-700 dark:text-slate-400 text-xs font-bold cursor-pointer transition-colors"
                                                            >
                                                                Hủy
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={handleSaveCustomPreset}
                                                                className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase tracking-wider shadow-xs flex items-center gap-1.5 cursor-pointer transition-all hover:scale-105 active:scale-95"
                                                            >
                                                                <Check size={13} strokeWidth={3} />
                                                                <span>Lưu Mẫu</span>
                                                            </button>
                                                        </div>
                                                    </m.div>
                                                )}
                                            </AnimatePresence>

                                            {/* Danh sách Theme Tự Lưu (Custom Presets) */}
                                            {customPresets.length > 0 && (
                                                <div className="space-y-2">
                                                    <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-400">
                                                        <span className="flex items-center gap-1">
                                                            <FolderHeart size={12} />
                                                            Theme Của Bạn ({customPresets.length})
                                                        </span>
                                                    </div>
                                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                                                        {customPresets.map((preset) => {
                                                            const isSelected = isPresetSelected(preset);
                                                            return (
                                                                <div
                                                                    key={preset.id}
                                                                    onClick={() => handleApplyPreset(preset)}
                                                                    className={cn(
                                                                        "group relative flex flex-col p-3 rounded-2xl border text-left transition-all cursor-pointer shadow-xs hover:scale-[1.02] active:scale-98",
                                                                        isSelected
                                                                            ? "border-amber-500 dark:border-amber-400 bg-amber-50/60 dark:bg-amber-950/40 ring-2 ring-amber-500/30"
                                                                            : "border-amber-500/20 dark:border-amber-500/20 bg-amber-500/5 dark:bg-amber-950/20 hover:border-amber-500/40"
                                                                    )}
                                                                >
                                                                    <div className="flex items-center justify-between w-full mb-1.5">
                                                                        <div className="flex items-center gap-1.5 min-w-0">
                                                                            <span className="font-black text-xs text-slate-800 dark:text-slate-100 truncate">
                                                                                {preset.name}
                                                                            </span>
                                                                            <span className="px-1.5 py-0.2 rounded-full text-[8.5px] font-black bg-amber-500/20 text-amber-700 dark:text-amber-300 shrink-0">
                                                                                Tự tạo
                                                                            </span>
                                                                        </div>
                                                                        <div className="flex items-center gap-1 shrink-0 ml-1">
                                                                            {isSelected && (
                                                                                <div className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
                                                                                    <Check size={10} strokeWidth={3} />
                                                                                </div>
                                                                            )}
                                                                            <button
                                                                                type="button"
                                                                                onClick={(e) => handleDeleteCustomPreset(preset.id, e)}
                                                                                className="w-5 h-5 rounded-lg opacity-60 hover:opacity-100 hover:bg-rose-500/15 hover:text-rose-500 text-slate-400 flex items-center justify-center transition-all cursor-pointer"
                                                                                title="Xóa theme này"
                                                                            >
                                                                                <Trash2 size={11} />
                                                                            </button>
                                                                        </div>
                                                                    </div>

                                                                    <div className="flex items-center gap-1.5">
                                                                        <div className="w-4 h-4 rounded-md border border-black/10 shadow-inner shrink-0" style={{ backgroundColor: preset.previewHeaderBg }} title="Màu nền Header" />
                                                                        <div className="w-4 h-4 rounded-md border-2 shrink-0" style={{ borderColor: preset.previewBorder, backgroundColor: 'transparent' }} title="Màu viền" />
                                                                        <div className="w-4 h-4 rounded-md shadow-xs shrink-0" style={{ backgroundColor: preset.previewAccent || preset.previewBorder }} title="Màu nút & Active" />
                                                                        <span className="text-[9px] font-bold text-slate-400 truncate flex-1 min-w-0">
                                                                            {preset.desc || 'Tự thiết kế'}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Built-in Presets */}
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                                    <span>Theme Mẫu Hệ Thống Chuẩn</span>
                                                    {CART_COLOR_PRESETS.length > 3 && (
                                                        <button
                                                            type="button"
                                                            onClick={() => setShowAllBuiltinPresets(prev => !prev)}
                                                            className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                                                        >
                                                            <span>{showAllBuiltinPresets ? "Thu gọn 3 mẫu" : `Xem thêm ${CART_COLOR_PRESETS.length - 3} mẫu khác`}</span>
                                                            {showAllBuiltinPresets ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                                                        </button>
                                                    )}
                                                </div>

                                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                                                    {(showAllBuiltinPresets ? CART_COLOR_PRESETS : CART_COLOR_PRESETS.slice(0, 3)).map((preset) => {
                                                        const isSelected = isPresetSelected(preset);
                                                        return (
                                                            <button
                                                                key={preset.id}
                                                                type="button"
                                                                onClick={() => handleApplyPreset(preset)}
                                                                className={cn(
                                                                    "relative flex flex-col p-3 rounded-2xl border text-left transition-all cursor-pointer shadow-xs hover:scale-[1.02] active:scale-98 group",
                                                                    isSelected
                                                                        ? "border-emerald-500 dark:border-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/30 ring-2 ring-emerald-500/20"
                                                                        : "border-black/10 dark:border-white/10 bg-white/60 dark:bg-slate-900/40 hover:border-black/20 dark:hover:border-white/20"
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
                                                                    <div className="w-4 h-4 rounded-md border border-black/10 shadow-inner shrink-0" style={{ backgroundColor: preset.previewHeaderBg }} title="Màu nền Header" />
                                                                    <div className="w-4 h-4 rounded-md border-2 shrink-0" style={{ borderColor: preset.previewBorder, backgroundColor: 'transparent' }} title="Màu viền" />
                                                                    <div className="w-4 h-4 rounded-md shadow-xs shrink-0" style={{ backgroundColor: preset.previewAccent || preset.previewBorder }} title="Màu nút & Active" />
                                                                    <span className="text-[9px] font-bold text-slate-400 truncate flex-1 min-w-0">
                                                                        {preset.desc}
                                                                    </span>
                                                                </div>
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* TAB 2: BẢNG GIỎ HÀNG (CART TABLE COLORS) */}
                                {activeTab === 'cart' && (
                                    <div className="space-y-6">
                                        {/* Live Preview Table pinned at top of Cart tab */}
                                        {renderLivePreview()}

                                        <div className="pt-2 border-t border-[#8b6f47]/15 dark:border-white/10 space-y-4">
                                            <div className="flex items-center justify-between">
                                                <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-100 flex items-center gap-2">
                                                    <Palette size={15} className="text-emerald-600 dark:text-emerald-400" />
                                                    <span>Chi Tiết Màu Sắc Bảng Giỏ Hàng</span>
                                                </h4>
                                                <span className="text-[10px] text-slate-400">
                                                    Tự do phối màu từng phần
                                                </span>
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                {/* 1. Header Background */}
                                                {renderColorField({
                                                    id: 'headerBg',
                                                    label: '1. Màu Nền Thanh Tiêu Đề',
                                                    desc: 'Nền của hàng tiêu đề (Stt, Tên SP, SL, Đơn giá...)',
                                                    value: currentConfig.headerBg,
                                                    defaultLabel: 'Mặc định (Trong suốt)',
                                                    swatches: ['#8b6f47', '#2d5016', '#1e3a0f', '#064e3b', '#172554', '#1e1b4b', '#311042', '#543b24', '#1c1917', '#0f172a', '#ffffff'],
                                                    onChange: (val) => {
                                                        const newCfg = { ...currentConfig, headerBg: val };
                                                        onChangeConfig(newCfg);
                                                        applyCartThemeToDom(newCfg);
                                                    }
                                                })}

                                                {/* 2. Header Text */}
                                                {renderColorField({
                                                    id: 'headerText',
                                                    label: '2. Màu Chữ Tiêu Đề',
                                                    desc: 'Màu chữ hiển thị trên thanh tiêu đề giỏ hàng',
                                                    value: currentConfig.headerText,
                                                    defaultLabel: 'Mặc định (#8b6f47)',
                                                    swatches: ['#ffffff', '#8b6f47', '#2d5016', '#6ee7b7', '#d9f99d', '#fde68a', '#93c5fd', '#c4b5fd', '#fbcfe8', '#cbd5e1'],
                                                    onChange: (val) => {
                                                        const newCfg = { ...currentConfig, headerText: val };
                                                        onChangeConfig(newCfg);
                                                        applyCartThemeToDom(newCfg);
                                                    }
                                                })}

                                                {/* 3. Accent Color */}
                                                {renderColorField({
                                                    id: 'accentColor',
                                                    label: '3. Màu Điểm Nhấn (Accent)',
                                                    desc: 'Màu huy hiệu đếm số món, nút active, tổng thanh toán',
                                                    value: currentConfig.accentColor,
                                                    defaultLabel: 'Mặc định (#2d5016)',
                                                    swatches: ['#2d5016', '#8b6f47', '#10b981', '#059669', '#2563eb', '#7c3aed', '#db2777', '#ea580c', '#eab308', '#0d9488'],
                                                    onChange: (val) => {
                                                        const newCfg = { ...currentConfig, accentColor: val };
                                                        onChangeConfig(newCfg);
                                                        applyCartThemeToDom(newCfg);
                                                    }
                                                })}

                                                {/* 4. Product Text Color */}
                                                {renderColorField({
                                                    id: 'productTextColor',
                                                    label: '4. Màu Chữ Tên Sản Phẩm',
                                                    desc: 'Màu tên sản phẩm hiển thị trong từng dòng giỏ hàng',
                                                    value: currentConfig.productTextColor,
                                                    defaultLabel: 'Mặc định (Theme)',
                                                    swatches: ['#2d5016', '#1e293b', '#0f172a', '#334155', '#15803d', '#1d4ed8', '#6d28d9', '#be185d', '#b45309', '#047857'],
                                                    onChange: (val) => {
                                                        const newCfg = { ...currentConfig, productTextColor: val };
                                                        onChangeConfig(newCfg);
                                                        applyCartThemeToDom(newCfg);
                                                    }
                                                })}

                                                {/* 5. Cart Values Color */}
                                                <div className="sm:col-span-2">
                                                    {renderColorField({
                                                        id: 'cartValuesColor',
                                                        label: '5. Màu Giá Trị Số (Số Lượng & Tiền)',
                                                        desc: 'Màu sắc hiển thị cho các cột Số lượng, Đơn giá và Thành tiền',
                                                        value: currentConfig.cartValuesColor,
                                                        defaultLabel: 'Mặc định (Theo Accent)',
                                                        swatches: ['#2d5016', '#8b6f47', '#10b981', '#2563eb', '#7c3aed', '#db2777', '#ea580c', '#059669', '#0284c7', '#16a34a'],
                                                        onChange: (val) => {
                                                            const newCfg = { ...currentConfig, cartValuesColor: val };
                                                            onChangeConfig(newCfg);
                                                            applyCartThemeToDom(newCfg);
                                                        }
                                                    })}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* TAB 3: KÍNH & VIỀN (GLASS, BORDER & EFFECTS) */}
                                {activeTab === 'effects' && (
                                    <div className="space-y-6">
                                        {/* Compact preview */}
                                        {renderLivePreview(true)}

                                        <div className="pt-2 border-t border-[#8b6f47]/15 dark:border-white/10 space-y-5">
                                            {/* Card 1: Khung Viền & Chiều Dày */}
                                            <div className="p-4 rounded-2xl bg-white/70 dark:bg-slate-900/50 border border-[#8b6f47]/15 dark:border-white/10 space-y-4 shadow-xs">
                                                <div className="flex items-center justify-between flex-wrap gap-2">
                                                    <div className="flex items-center gap-2.5">
                                                        <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                                                            <Square size={16} strokeWidth={2.5} />
                                                        </div>
                                                        <div>
                                                            <span className="font-black text-xs uppercase tracking-tight text-slate-800 dark:text-slate-100 block">
                                                                Đường Viền Giỏ Hàng
                                                            </span>
                                                            <span className="text-[10px] text-slate-500 dark:text-slate-400">
                                                                Độ dày và màu sắc viền bao quanh bảng giỏ hàng
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <div 
                                                        onClick={() => {
                                                            const newCfg = { ...currentConfig, enableBorder: currentConfig.enableBorder === false ? true : false };
                                                            onChangeConfig(newCfg);
                                                            applyCartThemeToDom(newCfg);
                                                        }}
                                                        className={cn(
                                                            "w-11 h-6 rounded-full p-0.5 transition-colors duration-300 flex items-center shrink-0 border cursor-pointer",
                                                            currentConfig.enableBorder !== false
                                                                ? "bg-blue-600 border-blue-600 justify-end"
                                                                : "bg-slate-300 dark:bg-slate-700 border-slate-300 dark:border-slate-600 justify-start"
                                                        )}
                                                    >
                                                        <div className="w-5 h-5 rounded-full bg-white shadow-xs" />
                                                    </div>
                                                </div>

                                                {currentConfig.enableBorder !== false && (
                                                    <div className="space-y-3 pt-2 border-t border-black/5 dark:border-white/5">
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Độ dày viền:</span>
                                                            <div className="flex items-center gap-1.5">
                                                                {['1', '2', '3', '4'].map((w) => (
                                                                    <button
                                                                        key={w}
                                                                        type="button"
                                                                        onClick={() => {
                                                                            const newCfg = { ...currentConfig, borderWidth: w };
                                                                            onChangeConfig(newCfg);
                                                                            applyCartThemeToDom(newCfg);
                                                                        }}
                                                                        className={cn(
                                                                            "w-8 h-7 rounded-lg text-xs font-black transition-all cursor-pointer",
                                                                            (currentConfig.borderWidth || '1') === w
                                                                                ? "bg-blue-600 text-white shadow-xs"
                                                                                : "bg-black/5 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:bg-black/10"
                                                                        )}
                                                                    >
                                                                        {w}px
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>

                                                        {renderColorField({
                                                            id: 'borderColor',
                                                            label: 'Màu Đường Viền',
                                                            desc: 'Màu viền giỏ hàng và các đường kẻ phân cách',
                                                            value: currentConfig.borderColor,
                                                            defaultLabel: 'Mặc định (#8b6f47)',
                                                            swatches: ['#8b6f47', '#2d5016', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#f97316', '#eab308', '#14b8a6', '#ffffff'],
                                                            onChange: (val) => {
                                                                const newCfg = { ...currentConfig, borderColor: val };
                                                                onChangeConfig(newCfg);
                                                                applyCartThemeToDom(newCfg);
                                                            }
                                                        })}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Card 2: Hiệu Ứng Ánh Sáng Glow & Đổ Bóng 3D */}
                                            <div className="p-4 rounded-2xl bg-white/70 dark:bg-slate-900/50 border border-[#8b6f47]/15 dark:border-white/10 space-y-4 shadow-xs">
                                                <div className="flex items-center gap-2.5">
                                                    <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                                                        <SunMedium size={16} strokeWidth={2.5} />
                                                    </div>
                                                    <div>
                                                        <span className="font-black text-xs uppercase tracking-tight text-slate-800 dark:text-slate-100 block">
                                                            Hiệu Ứng Phát Sáng & Chiều Sâu 3D
                                                        </span>
                                                        <span className="text-[10px] text-slate-500 dark:text-slate-400">
                                                            Ánh sáng neon viền và đổ bóng nhiều lớp cao cấp
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                                                    {/* Glow Toggle */}
                                                    <div 
                                                        onClick={() => {
                                                            const newCfg = { ...currentConfig, enableGlow: currentConfig.enableGlow === false ? true : false };
                                                            onChangeConfig(newCfg);
                                                            applyCartThemeToDom(newCfg);
                                                        }}
                                                        className={cn(
                                                            "flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer select-none",
                                                            currentConfig.enableGlow !== false
                                                                ? "bg-amber-500/10 border-amber-500/30 text-amber-900 dark:text-amber-300"
                                                                : "bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10 opacity-70"
                                                        )}
                                                    >
                                                        <div>
                                                            <div className="font-black text-xs">Ánh Sáng Neon (Glow)</div>
                                                            <div className="text-[10px] text-slate-500 dark:text-slate-400">Tạo vầng hào quang viền</div>
                                                        </div>
                                                        <div className={cn(
                                                            "w-10 h-6 rounded-full p-0.5 transition-colors duration-300 flex items-center shrink-0 border",
                                                            currentConfig.enableGlow !== false
                                                                ? "bg-amber-500 border-amber-500 justify-end"
                                                                : "bg-slate-300 dark:bg-slate-700 border-slate-300 dark:border-slate-600 justify-start"
                                                        )}>
                                                            <div className="w-4 h-4 rounded-full bg-white shadow-xs" />
                                                        </div>
                                                    </div>

                                                    {/* Shadow Toggle */}
                                                    <div 
                                                        onClick={() => {
                                                            const newCfg = { ...currentConfig, enableShadow: currentConfig.enableShadow === false ? true : false };
                                                            onChangeConfig(newCfg);
                                                            applyCartThemeToDom(newCfg);
                                                        }}
                                                        className={cn(
                                                            "flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer select-none",
                                                            currentConfig.enableShadow !== false
                                                                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-900 dark:text-emerald-300"
                                                                : "bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10 opacity-70"
                                                        )}
                                                    >
                                                        <div>
                                                            <div className="font-black text-xs">Đổ Bóng Nổi 3D (Shadow)</div>
                                                            <div className="text-[10px] text-slate-500 dark:text-slate-400">Tạo chiều sâu tách lớp</div>
                                                        </div>
                                                        <div className={cn(
                                                            "w-10 h-6 rounded-full p-0.5 transition-colors duration-300 flex items-center shrink-0 border",
                                                            currentConfig.enableShadow !== false
                                                                ? "bg-emerald-600 border-emerald-600 justify-end"
                                                                : "bg-slate-300 dark:bg-slate-700 border-slate-300 dark:border-slate-600 justify-start"
                                                        )}>
                                                            <div className="w-4 h-4 rounded-full bg-white shadow-xs" />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Card 3: Lớp Kính Mờ (Glass Overlay) */}
                                            <div className="p-4 rounded-2xl bg-white/70 dark:bg-slate-900/50 border border-[#8b6f47]/15 dark:border-white/10 space-y-4 shadow-xs">
                                                <div className="flex items-center justify-between flex-wrap gap-2">
                                                    <div className="flex items-center gap-2.5">
                                                        <div className="w-8 h-8 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                                                            <Layers size={16} strokeWidth={2.5} />
                                                        </div>
                                                        <div>
                                                            <span className="font-black text-xs uppercase tracking-tight text-slate-800 dark:text-slate-100 block">
                                                                Lớp Kính Mờ & Bảng Trong Suốt
                                                            </span>
                                                            <span className="text-[10px] text-slate-500 dark:text-slate-400">
                                                                Tạo cảm giác mờ ảo hiện đại nhìn xuyên thấu nền
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <div 
                                                        onClick={handleToggleTransparent}
                                                        className={cn(
                                                            "w-11 h-6 rounded-full p-0.5 transition-colors duration-300 flex items-center shrink-0 border cursor-pointer",
                                                            transparentCartTable
                                                                ? "bg-teal-600 border-teal-600 justify-end"
                                                                : "bg-slate-300 dark:bg-slate-700 border-slate-300 dark:border-slate-600 justify-start"
                                                        )}
                                                    >
                                                        <div className="w-5 h-5 rounded-full bg-white shadow-xs" />
                                                    </div>
                                                </div>

                                                {transparentCartTable && (
                                                    <div className="space-y-3.5 pt-2 border-t border-black/5 dark:border-white/5">
                                                        {/* Opacity slider */}
                                                        <div className="space-y-1.5">
                                                            <div className="flex justify-between items-center text-xs font-bold text-slate-700 dark:text-slate-300">
                                                                <span>Độ mờ kính (Opacity):</span>
                                                                <span className="font-mono text-teal-700 dark:text-teal-400 font-black">{currentConfig.overlayOpacity !== undefined ? currentConfig.overlayOpacity : 30}%</span>
                                                            </div>
                                                            <input
                                                                type="range"
                                                                min="0"
                                                                max="100"
                                                                step="5"
                                                                value={currentConfig.overlayOpacity !== undefined ? currentConfig.overlayOpacity : 30}
                                                                onChange={(e) => {
                                                                    const newCfg = { ...currentConfig, overlayOpacity: Number(e.target.value) };
                                                                    onChangeConfig(newCfg);
                                                                    applyCartThemeToDom(newCfg);
                                                                }}
                                                                className="w-full accent-teal-600 cursor-pointer h-1.5 bg-black/10 dark:bg-white/10 rounded-lg appearance-none"
                                                            />
                                                        </div>

                                                        {/* Blur slider */}
                                                        <div className="space-y-1.5">
                                                            <div className="flex justify-between items-center text-xs font-bold text-slate-700 dark:text-slate-300">
                                                                <span>Độ nhòe kính (Blur):</span>
                                                                <span className="font-mono text-teal-700 dark:text-teal-400 font-black">{currentConfig.overlayBlur !== undefined ? currentConfig.overlayBlur : 12}px</span>
                                                            </div>
                                                            <input
                                                                type="range"
                                                                min="0"
                                                                max="30"
                                                                step="2"
                                                                value={currentConfig.overlayBlur !== undefined ? currentConfig.overlayBlur : 12}
                                                                onChange={(e) => {
                                                                    const newCfg = { ...currentConfig, overlayBlur: Number(e.target.value) };
                                                                    onChangeConfig(newCfg);
                                                                    applyCartThemeToDom(newCfg);
                                                                }}
                                                                className="w-full accent-teal-600 cursor-pointer h-1.5 bg-black/10 dark:bg-white/10 rounded-lg appearance-none"
                                                            />
                                                        </div>

                                                        {renderColorField({
                                                            id: 'overlayColor',
                                                            label: 'Màu Phủ Kính Mờ',
                                                            desc: 'Tông màu của lớp kính mờ bao phủ',
                                                            value: currentConfig.overlayColor,
                                                            defaultLabel: 'Mặc định (Theo Card)',
                                                            swatches: ['#ffffff', '#faf8f3', '#0f172a', '#000000', '#2d5016', '#8b6f47', '#1e1b4b'],
                                                            onChange: (val) => {
                                                                const newCfg = { ...currentConfig, overlayColor: val };
                                                                onChangeConfig(newCfg);
                                                                applyCartThemeToDom(newCfg);
                                                            }
                                                        })}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Card 4: Tùy Chọn Hiển Thị Tiện Ích */}
                                            <div className="p-4 rounded-2xl bg-white/70 dark:bg-slate-900/50 border border-[#8b6f47]/15 dark:border-white/10 space-y-3 shadow-xs">
                                                <div className="text-xs font-black uppercase text-slate-800 dark:text-slate-100 flex items-center gap-2">
                                                    <Sliders size={15} className="text-emerald-600 dark:text-emerald-400" />
                                                    <span>Tùy Chọn Hiển Thị Khác</span>
                                                </div>

                                                <div className="space-y-2 pt-1">
                                                    {/* Nhãn mua gần nhất */}
                                                    <div 
                                                        onClick={handleToggleLastPurchaseBadge}
                                                        className="flex items-center justify-between p-2.5 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/5 dark:border-white/5 cursor-pointer select-none"
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            <Clock size={15} className="text-indigo-500" />
                                                            <div>
                                                                <div className="text-xs font-bold text-slate-800 dark:text-slate-200">Huy hiệu lịch sử mua gần nhất</div>
                                                                <div className="text-[10px] text-slate-400">Hiển thị nhãn thời gian khách mua gần nhất dưới tên sản phẩm</div>
                                                            </div>
                                                        </div>
                                                        <div className={cn(
                                                            "w-10 h-6 rounded-full p-0.5 transition-colors duration-300 flex items-center shrink-0 border",
                                                            showLastPurchaseBadge ? "bg-indigo-600 border-indigo-600 justify-end" : "bg-slate-300 dark:bg-slate-700 border-slate-300 dark:border-slate-600 justify-start"
                                                        )}>
                                                            <div className="w-4 h-4 rounded-full bg-white shadow-xs" />
                                                        </div>
                                                    </div>

                                                    {/* Hiệu ứng gõ phím tìm kiếm */}
                                                    <div 
                                                        onClick={() => {
                                                            const newCfg = { ...currentConfig, enableSearchTypingAnimation: !currentConfig.enableSearchTypingAnimation };
                                                            onChangeConfig(newCfg);
                                                            localStorage.setItem("pos_search_typing_animation", String(newCfg.enableSearchTypingAnimation));
                                                        }}
                                                        className="flex items-center justify-between p-2.5 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/5 dark:border-white/5 cursor-pointer select-none"
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            <Sparkles size={15} className="text-amber-500" />
                                                            <div>
                                                                <div className="text-xs font-bold text-slate-800 dark:text-slate-200">Hiệu ứng nhảy chữ khi gõ tìm kiếm</div>
                                                                <div className="text-[10px] text-slate-400">Animation chữ nhảy vui mắt theo phong cách Lí An AI</div>
                                                            </div>
                                                        </div>
                                                        <div className={cn(
                                                            "w-10 h-6 rounded-full p-0.5 transition-colors duration-300 flex items-center shrink-0 border",
                                                            currentConfig.enableSearchTypingAnimation ? "bg-amber-500 border-amber-500 justify-end" : "bg-slate-300 dark:bg-slate-700 border-slate-300 dark:border-slate-600 justify-start"
                                                        )}>
                                                            <div className="w-4 h-4 rounded-full bg-white shadow-xs" />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* TAB 4: MASCOT CHÌM (MASCOT WATERMARK) */}
                                {activeTab === 'mascot' && (
                                    <div className="space-y-6">
                                        {/* Live Preview with Mascot */}
                                        {renderLivePreview()}

                                        <div className="pt-2 border-t border-[#8b6f47]/15 dark:border-white/10 space-y-4">
                                            {/* Mascot Master Toggle */}
                                            <div 
                                                onClick={handleToggleMascotVisible}
                                                className={cn(
                                                    "flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer select-none",
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
                                                            {mascotWatermarkVisible ? "Đang bật: Khắc hình linh vật mờ nghệ thuật chìm dưới danh sách món" : "Đang tắt: Ẩn hoàn toàn hình chìm"}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className={cn(
                                                    "w-11 h-6 rounded-full p-0.5 transition-colors duration-300 flex items-center shrink-0 border",
                                                    mascotWatermarkVisible
                                                        ? "bg-emerald-600 border-emerald-600 justify-end"
                                                        : "bg-slate-300 dark:bg-slate-700 border-slate-300 dark:border-slate-600 justify-start"
                                                )}>
                                                    <div className="w-5 h-5 rounded-full bg-white shadow-xs" />
                                                </div>
                                            </div>

                                            {mascotWatermarkVisible && (
                                                <div className="space-y-4">
                                                    {/* Card: Nguồn Ảnh Linh Vật */}
                                                    <div className="p-4 rounded-2xl bg-white/70 dark:bg-slate-900/50 border border-[#8b6f47]/15 dark:border-white/10 space-y-3 shadow-xs">
                                                        <div className="flex items-center justify-between">
                                                            <label className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                                                <Upload size={14} className="text-emerald-600 dark:text-emerald-400" />
                                                                Nguồn Ảnh Linh Vật
                                                            </label>
                                                            {mascotWatermarkCustomImage ? (
                                                                <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                                                                    Ảnh tự tải (Đã nén tối ưu)
                                                                </span>
                                                            ) : (
                                                                <span className="text-[10px] font-bold text-slate-500 bg-black/5 dark:bg-white/5 px-2 py-0.5 rounded-full">
                                                                    Mascot Lyang mặc định
                                                                </span>
                                                            )}
                                                        </div>

                                                        <div className="flex items-center gap-3">
                                                            <div className="w-16 h-16 rounded-2xl bg-white dark:bg-slate-900 border border-black/10 dark:border-white/10 p-1 flex items-center justify-center shrink-0 shadow-inner overflow-hidden relative">
                                                                <img 
                                                                    src={mascotWatermarkCustomImage || "/assets/images/user_mascot.png"} 
                                                                    alt="Current Mascot" 
                                                                    className="w-full h-full object-contain filter grayscale contrast-150"
                                                                />
                                                                {isCompressingMascot && (
                                                                    <div className="absolute inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center text-white text-[9px] font-bold text-center px-1">
                                                                        Đang nén...
                                                                    </div>
                                                                )}
                                                            </div>

                                                            <div className="flex-1 flex flex-col gap-1.5">
                                                                <div className="flex items-center gap-2">
                                                                    <input
                                                                        ref={mascotFileInputRef}
                                                                        type="file"
                                                                        accept="image/png,image/jpeg,image/webp,image/svg+xml"
                                                                        className="hidden"
                                                                        onChange={handleMascotFileUpload}
                                                                    />
                                                                    <button
                                                                        type="button"
                                                                        disabled={isCompressingMascot}
                                                                        onClick={() => mascotFileInputRef.current?.click()}
                                                                        className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-xs uppercase tracking-tight flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer disabled:opacity-50"
                                                                    >
                                                                        <Upload size={14} />
                                                                        <span>{mascotWatermarkCustomImage ? "Đổi ảnh khác từ máy tính" : "Tải ảnh từ máy tính"}</span>
                                                                    </button>

                                                                    {mascotWatermarkCustomImage && (
                                                                        <button
                                                                            type="button"
                                                                            onClick={handleResetMascotToDefault}
                                                                            className="py-2 px-3 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-rose-500/10 text-slate-500 hover:text-rose-500 text-xs font-bold transition-all cursor-pointer"
                                                                            title="Quay lại linh vật mặc định"
                                                                        >
                                                                            <RotateCcw size={14} />
                                                                        </button>
                                                                    )}
                                                                </div>
                                                                <p className="text-[10px] text-slate-400">
                                                                    Hỗ trợ PNG trong suốt, JPG, WebP. Hệ thống tự động nén nhẹ không lo lag.
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Card: Vị Trí & Tinh Chỉnh */}
                                                    <div className="p-4 rounded-2xl bg-white/70 dark:bg-slate-900/50 border border-[#8b6f47]/15 dark:border-white/10 space-y-4 shadow-xs">
                                                        <div className="flex items-center justify-between">
                                                            <div className="text-xs font-black uppercase text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                                                                <Compass size={15} className="text-emerald-600 dark:text-emerald-400" />
                                                                <span>Vị Trí & Tinh Chỉnh Hiển Thị</span>
                                                            </div>
                                                            <button
                                                                type="button"
                                                                onClick={handleResetMascot}
                                                                className="text-[10.5px] font-bold text-slate-400 hover:text-rose-500 cursor-pointer"
                                                            >
                                                                Đặt lại mặc định
                                                            </button>
                                                        </div>

                                                        {/* Position buttons */}
                                                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                                                            {[
                                                                { id: 'bottom-right', label: 'Dưới phải (Chuẩn)' },
                                                                { id: 'bottom-left', label: 'Dưới trái' },
                                                                { id: 'top-right', label: 'Trên phải' },
                                                                { id: 'top-left', label: 'Trên trái' },
                                                                { id: 'center', label: 'Chính giữa' }
                                                            ].map(pos => (
                                                                <button
                                                                    key={pos.id}
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setMascotWatermarkPos(pos.id);
                                                                        localStorage.setItem("pos_mascot_watermark_pos", pos.id);
                                                                        broadcastSetting("pos_mascot_watermark_pos", pos.id);
                                                                    }}
                                                                    className={cn(
                                                                        "py-2 px-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer text-center",
                                                                        mascotWatermarkPos === pos.id
                                                                            ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                                                                            : "bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-black/10"
                                                                    )}
                                                                >
                                                                    {pos.label}
                                                                </button>
                                                            ))}
                                                        </div>

                                                        {/* Sliders Grid */}
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                                                            {/* Opacity */}
                                                            <div className="space-y-1.5 p-3 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/5 dark:border-white/5">
                                                                <div className="flex justify-between items-center text-xs font-bold text-slate-700 dark:text-slate-300">
                                                                    <span>Độ mờ nghệ thuật:</span>
                                                                    <span className="font-mono text-emerald-700 dark:text-emerald-400 font-black">{mascotWatermarkOpacity}%</span>
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
                                                                    className="w-full accent-emerald-600 cursor-pointer h-1.5 bg-black/10 dark:bg-white/10 rounded-lg appearance-none"
                                                                />
                                                            </div>

                                                            {/* Scale */}
                                                            <div className="space-y-1.5 p-3 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/5 dark:border-white/5">
                                                                <div className="flex justify-between items-center text-xs font-bold text-slate-700 dark:text-slate-300">
                                                                    <span>Kích thước linh vật:</span>
                                                                    <span className="font-mono text-emerald-700 dark:text-emerald-400 font-black">{mascotWatermarkScale}px</span>
                                                                </div>
                                                                <input
                                                                    type="range"
                                                                    min="40"
                                                                    max="220"
                                                                    step="5"
                                                                    value={mascotWatermarkScale}
                                                                    onChange={e => {
                                                                        const val = parseFloat(e.target.value);
                                                                        setMascotWatermarkScale(val);
                                                                        localStorage.setItem("pos_mascot_watermark_scale", String(val));
                                                                        broadcastSetting("pos_mascot_watermark_scale", String(val));
                                                                    }}
                                                                    className="w-full accent-emerald-600 cursor-pointer h-1.5 bg-black/10 dark:bg-white/10 rounded-lg appearance-none"
                                                                />
                                                            </div>

                                                            {/* Rotate */}
                                                            <div className="space-y-1.5 p-3 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/5 dark:border-white/5">
                                                                <div className="flex justify-between items-center text-xs font-bold text-slate-700 dark:text-slate-300">
                                                                    <span>Góc xoay nghiêng:</span>
                                                                    <span className="font-mono text-emerald-700 dark:text-emerald-400 font-black">{mascotWatermarkRotate}°</span>
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
                                                                    className="w-full accent-emerald-600 cursor-pointer h-1.5 bg-black/10 dark:bg-white/10 rounded-lg appearance-none"
                                                                />
                                                            </div>

                                                            {/* Offset X & Y */}
                                                            <div className="space-y-1.5 p-3 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/5 dark:border-white/5">
                                                                <div className="flex justify-between items-center text-xs font-bold text-slate-700 dark:text-slate-300">
                                                                    <span>Tọa độ lệch (X / Y):</span>
                                                                    <span className="font-mono text-emerald-700 dark:text-emerald-400 font-black">{mascotWatermarkOffsetX} / {mascotWatermarkOffsetY}px</span>
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    <input
                                                                        type="range"
                                                                        min="-100"
                                                                        max="100"
                                                                        step="2"
                                                                        value={mascotWatermarkOffsetX}
                                                                        onChange={e => {
                                                                            const val = parseFloat(e.target.value);
                                                                            setMascotWatermarkOffsetX(val);
                                                                            localStorage.setItem("pos_mascot_watermark_offset_x", String(val));
                                                                            broadcastSetting("pos_mascot_watermark_offset_x", String(val));
                                                                        }}
                                                                        className="w-1/2 accent-emerald-600 cursor-pointer h-1.5 bg-black/10 dark:bg-white/10 rounded-lg appearance-none"
                                                                        title="Lệch ngang X"
                                                                    />
                                                                    <input
                                                                        type="range"
                                                                        min="-100"
                                                                        max="100"
                                                                        step="2"
                                                                        value={mascotWatermarkOffsetY}
                                                                        onChange={e => {
                                                                            const val = parseFloat(e.target.value);
                                                                            setMascotWatermarkOffsetY(val);
                                                                            localStorage.setItem("pos_mascot_watermark_offset_y", String(val));
                                                                            broadcastSetting("pos_mascot_watermark_offset_y", String(val));
                                                                        }}
                                                                        className="w-1/2 accent-emerald-600 cursor-pointer h-1.5 bg-black/10 dark:bg-white/10 rounded-lg appearance-none"
                                                                        title="Lệch dọc Y"
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* TAB 5: NÚT & NHÃN (BUBBLES & BADGES) */}
                                {activeTab === 'bubbles' && (
                                    <div className="space-y-5">
                                        {/* Sub-tabs selector for Bubbles vs Badges */}
                                        <div className="p-1 bg-black/5 dark:bg-white/5 rounded-2xl flex items-center gap-1 border border-black/5 dark:border-white/10 max-w-lg mx-auto flex-nowrap">
                                            <button
                                                type="button"
                                                onClick={() => setBubblesSubTab('bubbles')}
                                                className={cn(
                                                    "flex-1 py-2 px-3 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap",
                                                    bubblesSubTab === 'bubbles'
                                                        ? "bg-white dark:bg-[#0e271d] text-slate-800 dark:text-emerald-400 shadow-sm border border-black/5 dark:border-emerald-500/30"
                                                        : "text-slate-500 dark:text-slate-400 hover:text-slate-800"
                                                )}
                                            >
                                                <Sparkles size={14} className="text-amber-500 shrink-0" />
                                                <span className="whitespace-nowrap">1. Nút Thao Tác</span>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setBubblesSubTab('badges')}
                                                className={cn(
                                                    "flex-1 py-2 px-3 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap",
                                                    bubblesSubTab === 'badges'
                                                        ? "bg-white dark:bg-[#0e271d] text-slate-800 dark:text-emerald-400 shadow-sm border border-black/5 dark:border-emerald-500/30"
                                                        : "text-slate-500 dark:text-slate-400 hover:text-slate-800"
                                                )}
                                            >
                                                <Bookmark size={14} className="text-amber-600 dark:text-amber-400 shrink-0" />
                                                <span className="whitespace-nowrap">2. Nhãn & Badges</span>
                                            </button>
                                        </div>

                                        {/* Render selected subtab */}
                                        {bubblesSubTab === 'bubbles' ? (
                                            <BubbleCustomizerTab 
                                                config={currentConfig} 
                                                onChangeConfig={onChangeConfig} 
                                            />
                                        ) : (
                                            <BadgeCustomizerTab 
                                                config={currentConfig} 
                                                onChangeConfig={onChangeConfig} 
                                            />
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Modal Footer */}
                            <div className="p-4 px-6 border-t border-[#8b6f47]/15 dark:border-white/10 bg-white/60 dark:bg-black/40 backdrop-blur-xl flex items-center justify-between shrink-0">
                                <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5">
                                    <CheckCircle2 size={14} className="text-emerald-500" />
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
                    </m.div>
                )}
            </AnimatePresence>
        </Portal>
    );
}
