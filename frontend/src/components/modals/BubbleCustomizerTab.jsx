import React, { useState } from 'react';
import { 
    Palette, RotateCcw, Check, Sparkles, Sliders, Eye, SunMedium, 
    Layers, Zap, Square, SlidersHorizontal, ArrowDown, User, DollarSign,
    CreditCard, Receipt, Printer, MousePointerClick, ShieldCheck, Type
} from 'lucide-react';
import { cn } from '../../lib/utils';

export const hexToRgba = (hex, alpha = 1) => {
    if (!hex || typeof hex !== 'string') return null;
    let clean = hex.replace('#', '');
    if (clean.length === 3) clean = clean.split('').map(c => c + c).join('');
    if (clean.length !== 6) return null;
    const num = parseInt(clean, 16);
    return `rgba(${num >> 16}, ${(num >> 8) & 0xff}, ${num & 0xff}, ${alpha})`;
};

export const isLightColor = (hex) => {
    if (!hex || typeof hex !== 'string' || !hex.startsWith('#')) return false;
    let clean = hex.replace('#', '');
    if (clean.length === 3) clean = clean.split('').map(c => c + c).join('');
    if (clean.length !== 6) return false;
    const num = parseInt(clean, 16);
    const r = num >> 16, g = (num >> 8) & 0xff, b = num & 0xff;
    return (0.299 * r + 0.587 * g + 0.114 * b) > 175;
};

export const BUBBLE_PRESETS = [
    {
        id: 'default',
        name: 'Mặc Định (Lyang Theme)',
        desc: 'Ấm áp, hài hòa theo chế độ Sáng / Tối',
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
        btnSavePrintBg: 'default',
        btnSavePrintTextColor: '#ffffff',
        btnSavePrintBorder: 'default',
        btnSavePrintShadowY: 10,
        btnSavePrintEnableGlow: true,
        btnSavePrintGlowColor: '#10b981',
        previewBorder: '#8b6f47',
        previewAccent: '#2d5016',
        previewBg: '#fbf9f4'
    },
    {
        id: 'cyber_emerald',
        name: 'Xanh Ngọc Neon (Cyber Emerald)',
        desc: 'Tông đen sâu, viền neon emerald phát sáng nổi bật',
        bubbleBg: '#122016',
        bubbleTextColor: '#6ee7b7',
        bubbleBorderColor: '#10b981',
        bubbleBorderWidth: '2',
        bubbleEnableBorder: true,
        bubbleShadowY: 12,
        bubbleShadowBlur: 26,
        bubbleShadowColor: '#000000',
        bubbleShadowOpacity: 55,
        bubbleEnableGlow: true,
        bubbleGlowColor: '#10b981',
        bubbleGlowIntensity: 18,
        btnBg: '#122016',
        btnTextColor: '#34d399',
        btnBorderColor: '#10b981',
        btnBorderWidth: '2',
        btnEnableBorder: true,
        btnShadowY: 10,
        btnShadowBlur: 20,
        btnShadowColor: '#000000',
        btnShadowOpacity: 50,
        btnEnableGlow: true,
        btnGlowColor: '#10b981',
        btnGlowIntensity: 14,
        btnSavePrintBg: 'linear-gradient(135deg, #059669, #10b981)',
        btnSavePrintTextColor: '#ffffff',
        btnSavePrintBorder: '#34d399',
        btnSavePrintShadowY: 12,
        btnSavePrintEnableGlow: true,
        btnSavePrintGlowColor: '#34d399',
        previewBorder: '#10b981',
        previewAccent: '#059669',
        previewBg: '#122016'
    },
    {
        id: 'warm_amber',
        name: 'Hoàng Gia Gold (Warm Amber)',
        desc: 'Nền nâu ấm, viền vàng hổ phách, bóng đổ sang trọng',
        bubbleBg: '#241a10',
        bubbleTextColor: '#fde68a',
        bubbleBorderColor: '#f59e0b',
        bubbleBorderWidth: '2',
        bubbleEnableBorder: true,
        bubbleShadowY: 12,
        bubbleShadowBlur: 24,
        bubbleShadowColor: '#000000',
        bubbleShadowOpacity: 50,
        bubbleEnableGlow: true,
        bubbleGlowColor: '#f59e0b',
        bubbleGlowIntensity: 16,
        btnBg: '#241a10',
        btnTextColor: '#fbbf24',
        btnBorderColor: '#f59e0b',
        btnBorderWidth: '2',
        btnEnableBorder: true,
        btnShadowY: 9,
        btnShadowBlur: 20,
        btnShadowColor: '#000000',
        btnShadowOpacity: 45,
        btnEnableGlow: true,
        btnGlowColor: '#f59e0b',
        btnGlowIntensity: 12,
        btnSavePrintBg: 'linear-gradient(135deg, #b45309, #f59e0b)',
        btnSavePrintTextColor: '#ffffff',
        btnSavePrintBorder: '#fbbf24',
        btnSavePrintShadowY: 12,
        btnSavePrintEnableGlow: true,
        btnSavePrintGlowColor: '#fbbf24',
        previewBorder: '#f59e0b',
        previewAccent: '#d97706',
        previewBg: '#241a10'
    },
    {
        id: 'ruby_velvet',
        name: 'Đỏ Hồng Ruby (Ruby Velvet)',
        desc: 'Huyền bí rực rỡ, glow đỏ ruby nổi khối 3D',
        bubbleBg: '#240e16',
        bubbleTextColor: '#fecdd3',
        bubbleBorderColor: '#f43f5e',
        bubbleBorderWidth: '2',
        bubbleEnableBorder: true,
        bubbleShadowY: 12,
        bubbleShadowBlur: 24,
        bubbleShadowColor: '#000000',
        bubbleShadowOpacity: 55,
        bubbleEnableGlow: true,
        bubbleGlowColor: '#f43f5e',
        bubbleGlowIntensity: 16,
        btnBg: '#240e16',
        btnTextColor: '#fb7185',
        btnBorderColor: '#f43f5e',
        btnBorderWidth: '2',
        btnEnableBorder: true,
        btnShadowY: 9,
        btnShadowBlur: 20,
        btnShadowColor: '#000000',
        btnShadowOpacity: 50,
        btnEnableGlow: true,
        btnGlowColor: '#f43f5e',
        btnGlowIntensity: 12,
        btnSavePrintBg: 'linear-gradient(135deg, #be123c, #f43f5e)',
        btnSavePrintTextColor: '#ffffff',
        btnSavePrintBorder: '#fb7185',
        btnSavePrintShadowY: 12,
        btnSavePrintEnableGlow: true,
        btnSavePrintGlowColor: '#fb7185',
        previewBorder: '#f43f5e',
        previewAccent: '#e11d48',
        previewBg: '#240e16'
    },
    {
        id: 'minimal_dark',
        name: 'Titan Siêu Tối Giản (Minimal Dark)',
        desc: 'Đen mun tinh tế, viền xám titan, bóng đổ sâu không chói',
        bubbleBg: '#0f172a',
        bubbleTextColor: '#f1f5f9',
        bubbleBorderColor: '#475569',
        bubbleBorderWidth: '1.5',
        bubbleEnableBorder: true,
        bubbleShadowY: 14,
        bubbleShadowBlur: 28,
        bubbleShadowColor: '#000000',
        bubbleShadowOpacity: 65,
        bubbleEnableGlow: false,
        bubbleGlowColor: '#38bdf8',
        bubbleGlowIntensity: 12,
        btnBg: '#0f172a',
        btnTextColor: '#cbd5e1',
        btnBorderColor: '#475569',
        btnBorderWidth: '1.5',
        btnEnableBorder: true,
        btnShadowY: 10,
        btnShadowBlur: 20,
        btnShadowColor: '#000000',
        btnShadowOpacity: 55,
        btnEnableGlow: false,
        btnSavePrintBg: 'linear-gradient(135deg, #1e293b, #334155)',
        btnSavePrintTextColor: '#ffffff',
        btnSavePrintBorder: '#64748b',
        btnSavePrintShadowY: 12,
        btnSavePrintEnableGlow: false,
        btnSavePrintGlowColor: '#94a3b8',
        previewBorder: '#475569',
        previewAccent: '#334155',
        previewBg: '#0f172a'
    }
];

export const adjustColor = (hex, percent) => {
    if (!hex || typeof hex !== 'string' || !hex.startsWith('#')) return hex;
    let clean = hex.replace('#', '');
    if (clean.length === 3) clean = clean.split('').map(c => c + c).join('');
    if (clean.length !== 6) return hex;
    const num = parseInt(clean, 16);
    let r = (num >> 16) + Math.round(255 * (percent / 100));
    let g = ((num >> 8) & 0x00FF) + Math.round(255 * (percent / 100));
    let b = (num & 0x0000FF) + Math.round(255 * (percent / 100));
    r = Math.min(255, Math.max(0, r));
    g = Math.min(255, Math.max(0, g));
    b = Math.min(255, Math.max(0, b));
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
};

export const getBubbleBadgeStyle = (config, bubbleKey = 'cash') => {
    if (!config) {
        return {
            background: 'linear-gradient(135deg, #2d5016, #059669)',
            boxShadow: '0 4px 14px rgba(45, 80, 22, 0.3)',
            color: '#ffffff'
        };
    }
    const mode = config.bubbleCustomMode || 'all';

    // 1. Check specific border for this bubble
    let col = null;
    if (mode === 'individual') {
        if (bubbleKey === 'cash' && config.bubbleCashBorder && config.bubbleCashBorder !== 'default') col = config.bubbleCashBorder;
        else if (bubbleKey === 'payment' && config.bubblePaymentBorder && config.bubblePaymentBorder !== 'default') col = config.bubblePaymentBorder;
        else if (bubbleKey === 'total' && config.bubbleTotalBorder && config.bubbleTotalBorder !== 'default') col = config.bubbleTotalBorder;
        else if (bubbleKey === 'partner' && config.bubblePartnerBorder && config.bubblePartnerBorder !== 'default') col = config.bubblePartnerBorder;
    }

    // 2. Global bubble border
    if (!col && config.bubbleBorderColor && config.bubbleBorderColor !== 'default') {
        col = config.bubbleBorderColor;
    }

    // 3. Accent color
    if (!col && config.accentColor && config.accentColor !== 'default') {
        col = config.accentColor;
    }

    // 4. Glow color
    if (!col && config.bubbleEnableGlow && config.bubbleGlowColor && config.bubbleGlowColor !== 'default') {
        col = config.bubbleGlowColor;
    }

    // 5. If we have a chosen accent/border color:
    if (col && col.startsWith('#')) {
        const isLight = isLightColor(col);
        const darker = adjustColor(col, -25);
        const lighter = adjustColor(col, 15);
        const shadowCol = hexToRgba(col, 0.35) || 'rgba(0,0,0,0.3)';
        return {
            background: `linear-gradient(135deg, ${lighter}, ${darker})`,
            boxShadow: `0 4px 14px ${shadowCol}`,
            color: isLight ? '#1a1e17' : '#ffffff'
        };
    }

    // 6. If background is customized but border/accent is default:
    let bg = config.bubbleBg;
    if (mode === 'individual') {
        if (bubbleKey === 'cash' && config.bubbleCashBg && config.bubbleCashBg !== 'default') bg = config.bubbleCashBg;
        else if (bubbleKey === 'payment' && config.bubblePaymentBg && config.bubblePaymentBg !== 'default') bg = config.bubblePaymentBg;
    }

    if (bg && bg !== 'default' && bg.startsWith('#')) {
        // Derive rich gradient from the bubble's background color
        const isLight = isLightColor(bg);
        const darker = adjustColor(bg, -25);
        const lighter = adjustColor(bg, 15);
        return {
            background: `linear-gradient(135deg, ${lighter}, ${darker})`,
            boxShadow: '0 4px 14px rgba(0,0,0,0.25)',
            color: isLight ? '#1a1e17' : '#ffffff'
        };
    }

    // Default Lyang green fallback
    return {
        background: 'linear-gradient(135deg, #059669, #1b380f)',
        boxShadow: '0 4px 14px rgba(45, 80, 22, 0.25)',
        color: '#ffffff'
    };
};

// Helper to compute bubble styles
export const getBubbleComputedStyle = (config, bubbleKey = 'all') => {
    if (!config) return {};
    const mode = config.bubbleCustomMode || 'all';

    // 1. Resolve Background
    let bg = config.bubbleBg;
    if (mode === 'individual') {
        if (bubbleKey === 'partner' && config.bubblePartnerBg && config.bubblePartnerBg !== 'default') bg = config.bubblePartnerBg;
        else if (bubbleKey === 'cash' && config.bubbleCashBg && config.bubbleCashBg !== 'default') bg = config.bubbleCashBg;
        else if (bubbleKey === 'payment' && config.bubblePaymentBg && config.bubblePaymentBg !== 'default') bg = config.bubblePaymentBg;
        else if (bubbleKey === 'total' && config.bubbleTotalBg && config.bubbleTotalBg !== 'default') bg = config.bubbleTotalBg;
    }

    // 2. Resolve Border
    let borderCol = config.bubbleBorderColor;
    if (mode === 'individual') {
        if (bubbleKey === 'partner' && config.bubblePartnerBorder && config.bubblePartnerBorder !== 'default') borderCol = config.bubblePartnerBorder;
        else if (bubbleKey === 'cash' && config.bubbleCashBorder && config.bubbleCashBorder !== 'default') borderCol = config.bubbleCashBorder;
        else if (bubbleKey === 'payment' && config.bubblePaymentBorder && config.bubblePaymentBorder !== 'default') borderCol = config.bubblePaymentBorder;
        else if (bubbleKey === 'total' && config.bubbleTotalBorder && config.bubbleTotalBorder !== 'default') borderCol = config.bubbleTotalBorder;
    }

    const borderWidth = (config.bubbleEnableBorder === false) ? 0 : Number(config.bubbleBorderWidth || 2);

    // 3. Resolve Text Color
    let textCol = config.bubbleTextColor;
    if (mode === 'individual') {
        if (bubbleKey === 'partner' && config.bubblePartnerTextColor && config.bubblePartnerTextColor !== 'default') textCol = config.bubblePartnerTextColor;
        else if (bubbleKey === 'cash' && config.bubbleCashTextColor && config.bubbleCashTextColor !== 'default') textCol = config.bubbleCashTextColor;
        else if (bubbleKey === 'payment' && config.bubblePaymentTextColor && config.bubblePaymentTextColor !== 'default') textCol = config.bubblePaymentTextColor;
        else if (bubbleKey === 'total' && config.bubbleTotalTextColor && config.bubbleTotalTextColor !== 'default') textCol = config.bubbleTotalTextColor;
    }

    // 4. Resolve Shadow & Glow
    const y = Number(config.bubbleShadowY !== undefined ? config.bubbleShadowY : 10);
    const blur = Number(config.bubbleShadowBlur !== undefined ? config.bubbleShadowBlur : 22);
    const op = Number(config.bubbleShadowOpacity !== undefined ? config.bubbleShadowOpacity : 24) / 100;
    const shadowColorHex = (config.bubbleShadowColor && config.bubbleShadowColor !== 'default') ? config.bubbleShadowColor : '#8b6f47';
    const shadowRgba = hexToRgba(shadowColorHex, op) || `rgba(139,111,71,${op})`;

    const shadows = [];
    if (y > 0 || blur > 0) {
        shadows.push(`0 ${y}px ${blur}px -2px ${shadowRgba}`);
    }

    // Glow
    let glowCol = config.bubbleGlowColor || '#10b981';
    let enableGlow = config.bubbleEnableGlow;
    if (mode === 'individual') {
        if (bubbleKey === 'partner' && config.bubblePartnerGlow && config.bubblePartnerGlow !== 'default') {
            glowCol = config.bubblePartnerGlow;
            enableGlow = true;
        } else if (bubbleKey === 'cash' && config.bubbleCashGlow && config.bubbleCashGlow !== 'default') {
            glowCol = config.bubbleCashGlow;
            enableGlow = true;
        } else if (bubbleKey === 'payment' && config.bubblePaymentGlow && config.bubblePaymentGlow !== 'default') {
            glowCol = config.bubblePaymentGlow;
            enableGlow = true;
        } else if (bubbleKey === 'total' && config.bubbleTotalGlow && config.bubbleTotalGlow !== 'default') {
            glowCol = config.bubbleTotalGlow;
            enableGlow = true;
        }
    }
    if (enableGlow && glowCol && glowCol !== 'default') {
        const glowSpread = Number(config.bubbleGlowIntensity || 15);
        shadows.push(`0 0 ${glowSpread}px ${glowCol}45`, `0 0 ${Math.floor(glowSpread / 2)}px ${glowCol}65`);
    }

    const res = {};
    if (bg && bg !== 'default') res.backgroundColor = bg;
    if (borderCol && borderCol !== 'default') {
        res.borderColor = borderCol;
        res.borderWidth = `${borderWidth}px`;
        res.borderStyle = 'solid';
    } else if (config.bubbleEnableBorder === false) {
        res.border = 'none';
    } else if (borderWidth !== 2) {
        res.borderWidth = `${borderWidth}px`;
    }

    if (textCol && textCol !== 'default') {
        res.color = textCol;
        res['--bubble-text'] = textCol;
    }

    if (shadows.length > 0) {
        res.boxShadow = shadows.join(', ');
    }
    return res;
};

// Helper to compute button styles
export const getButtonComputedStyle = (config, btnKey = 'all') => {
    if (!config) return {};
    const mode = config.bubbleCustomMode || 'all';
    
    // Check if this is the Save & Print F9 button
    if (btnKey === 'save_print') {
        const bg = config.btnSavePrintBg;
        const borderCol = config.btnSavePrintBorder;
        let textCol = config.btnSavePrintTextColor;
        if (!textCol || textCol === 'default') {
            if (config.btnTextColor && config.btnTextColor !== 'default') textCol = config.btnTextColor;
        }

        const y = Number(config.btnSavePrintShadowY !== undefined ? config.btnSavePrintShadowY : 10);
        const shadowColHex = (config.btnSavePrintShadowColor && config.btnSavePrintShadowColor !== 'default') ? config.btnSavePrintShadowColor : '#2d5016';
        const shadowRgba = hexToRgba(shadowColHex, 0.35) || `rgba(45,80,22,0.35)`;
        
        const shadows = [`0 ${y}px 22px ${shadowRgba}`];
        if (config.btnSavePrintEnableGlow !== false) {
            const glowCol = config.btnSavePrintGlowColor || '#10b981';
            shadows.push(`0 0 16px ${glowCol}50`);
        }

        const res = {};
        if (bg && bg !== 'default') res.background = bg;
        if (borderCol && borderCol !== 'default') res.borderColor = borderCol;
        if (textCol && textCol !== 'default') {
            res.color = textCol;
            res['--btn-text'] = textCol;
        }
        res.boxShadow = shadows.join(', ');
        return res;
    }

    // Standard mini-sidebar & auxiliary buttons
    let bg = config.btnBg;
    let borderCol = config.btnBorderColor;
    let textCol = config.btnTextColor;
    const borderWidth = (config.btnEnableBorder === false) ? 0 : Number(config.btnBorderWidth || 2);

    const y = Number(config.btnShadowY !== undefined ? config.btnShadowY : 8);
    const blur = Number(config.btnShadowBlur !== undefined ? config.btnShadowBlur : 18);
    const op = Number(config.btnShadowOpacity !== undefined ? config.btnShadowOpacity : 22) / 100;
    const shadowColorHex = (config.btnShadowColor && config.btnShadowColor !== 'default') ? config.btnShadowColor : '#8b6f47';
    const shadowRgba = hexToRgba(shadowColorHex, op) || `rgba(139,111,71,${op})`;

    const shadows = [];
    if (y > 0 || blur > 0) {
        shadows.push(`0 ${y}px ${blur}px ${shadowRgba}`);
    }
    if (config.btnEnableGlow && config.btnGlowColor && config.btnGlowColor !== 'default') {
        const glowSpread = Number(config.btnGlowIntensity || 12);
        shadows.push(`0 0 ${glowSpread}px ${config.btnGlowColor}45`);
    }

    const res = {};
    if (bg && bg !== 'default') res.backgroundColor = bg;
    if (borderCol && borderCol !== 'default') {
        res.borderColor = borderCol;
        res.borderWidth = `${borderWidth}px`;
        res.borderStyle = 'solid';
    } else if (config.btnEnableBorder === false) {
        res.border = 'none';
    } else if (borderWidth !== 2) {
        res.borderWidth = `${borderWidth}px`;
    }
    if (textCol && textCol !== 'default') {
        res.color = textCol;
        res['--btn-text'] = textCol;
    }
    if (shadows.length > 0) res.boxShadow = shadows.join(', ');
    return res;
};

export default function BubbleCustomizerTab({ config, onChangeConfig }) {
    const currentConfig = { ...config };
    const [subTarget, setSubTarget] = useState('all'); // 'all', 'partner', 'cash', 'payment', 'total', 'buttons', 'save_print'

    const handleApplyPreset = (preset) => {
        const newCfg = {
            ...currentConfig,
            bubbleBg: preset.bubbleBg,
            bubbleTextColor: preset.bubbleTextColor || 'default',
            bubbleBorderColor: preset.bubbleBorderColor,
            bubbleBorderWidth: preset.bubbleBorderWidth,
            bubbleEnableBorder: preset.bubbleEnableBorder,
            bubbleShadowY: preset.bubbleShadowY,
            bubbleShadowBlur: preset.bubbleShadowBlur,
            bubbleShadowColor: preset.bubbleShadowColor,
            bubbleShadowOpacity: preset.bubbleShadowOpacity,
            bubbleEnableGlow: preset.bubbleEnableGlow,
            bubbleGlowColor: preset.bubbleGlowColor,
            bubbleGlowIntensity: preset.bubbleGlowIntensity,
            btnBg: preset.btnBg,
            btnTextColor: preset.btnTextColor || 'default',
            btnBorderColor: preset.btnBorderColor,
            btnBorderWidth: preset.btnBorderWidth,
            btnEnableBorder: preset.btnEnableBorder,
            btnShadowY: preset.btnShadowY,
            btnShadowBlur: preset.btnShadowBlur,
            btnShadowColor: preset.btnShadowColor,
            btnShadowOpacity: preset.btnShadowOpacity,
            btnEnableGlow: preset.btnEnableGlow,
            btnGlowColor: preset.btnGlowColor || preset.bubbleGlowColor,
            btnGlowIntensity: preset.btnGlowIntensity || 12,
            btnSavePrintBg: preset.btnSavePrintBg,
            btnSavePrintTextColor: preset.btnSavePrintTextColor || '#ffffff',
            btnSavePrintBorder: preset.btnSavePrintBorder,
            btnSavePrintShadowY: preset.btnSavePrintShadowY,
            btnSavePrintEnableGlow: preset.btnSavePrintEnableGlow,
            btnSavePrintGlowColor: preset.btnSavePrintGlowColor
        };
        onChangeConfig(newCfg);
    };

    const handleResetBubbles = () => {
        const defaultPreset = BUBBLE_PRESETS[0];
        handleApplyPreset(defaultPreset);
    };

    const quickColors = [
        '#fbf9f4', '#ffffff', '#142316', '#1a1e17', '#0f172a', '#1e293b', 
        '#8b6f47', '#2d5016', '#10b981', '#059669', '#f59e0b', '#f43f5e', 
        '#3b82f6', '#8b5cf6', '#000000'
    ];

    const glowColors = [
        '#10b981', '#059669', '#2d5016', '#f59e0b', '#fbbf24', 
        '#f43f5e', '#ec4899', '#3b82f6', '#06b6d4', '#8b5cf6', '#d4a574'
    ];

    // Helper to get active fields according to subTarget
    const getTargetFieldNames = () => {
        if (subTarget === 'partner') {
            return { bg: 'bubblePartnerBg', text: 'bubblePartnerTextColor', border: 'bubblePartnerBorder', glow: 'bubblePartnerGlow' };
        } else if (subTarget === 'cash') {
            return { bg: 'bubbleCashBg', text: 'bubbleCashTextColor', border: 'bubbleCashBorder', glow: 'bubbleCashGlow' };
        } else if (subTarget === 'payment') {
            return { bg: 'bubblePaymentBg', text: 'bubblePaymentTextColor', border: 'bubblePaymentBorder', glow: 'bubblePaymentGlow' };
        } else if (subTarget === 'total') {
            return { bg: 'bubbleTotalBg', text: 'bubbleTotalTextColor', border: 'bubbleTotalBorder', glow: 'bubbleTotalGlow' };
        } else if (subTarget === 'buttons') {
            return { bg: 'btnBg', text: 'btnTextColor', border: 'btnBorderColor', glow: 'btnGlowColor' };
        } else if (subTarget === 'save_print') {
            return { bg: 'btnSavePrintBg', text: 'btnSavePrintTextColor', border: 'btnSavePrintBorder', glow: 'btnSavePrintGlowColor' };
        }
        return { bg: 'bubbleBg', text: 'bubbleTextColor', border: 'bubbleBorderColor', glow: 'bubbleGlowColor' };
    };

    const fieldNames = getTargetFieldNames();

    const quickTextColors = [
        '#ffffff', '#fbf9f4', '#6ee7b7', '#fde68a', '#fecdd3', 
        '#7dd3fc', '#e2e8f0', '#2d5016', '#8b6f47', '#0f172a'
    ];

    const handleTextColorChange = (val) => {
        if (subTarget === 'all') {
            onChangeConfig({
                ...currentConfig,
                bubbleTextColor: val,
                btnTextColor: val
            });
        } else {
            onChangeConfig({
                ...currentConfig,
                [fieldNames.text]: val
            });
        }
    };

    const isGlobal = subTarget === 'all';
    const isButtons = subTarget === 'buttons';
    const isSavePrint = subTarget === 'save_print';

    return (
        <div className="space-y-6">
            {/* Live Interactive Preview Box for Bubbles */}
            <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    <span className="flex items-center gap-1.5">
                        <Eye size={14} className="text-emerald-600 dark:text-emerald-400" />
                        Xem trước Bubble & Nút Thực Tế (Live Preview)
                    </span>
                    <span className="text-[10px] text-slate-400 lowercase font-medium">
                        màu chữ, bóng đổ & hiệu ứng thay đổi ngay tức thì
                    </span>
                </div>

                <div className="w-full rounded-2xl p-5 bg-black/5 dark:bg-black/40 border border-black/10 dark:border-white/10 relative overflow-hidden transition-all duration-300">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        {/* Left Side: Partner Bubble & Note/Ship buttons */}
                        <div className="flex items-center gap-2.5">
                            {/* Partner Bubble Preview */}
                            {(() => {
                                const st = getBubbleComputedStyle(currentConfig, 'partner');
                                return (
                                    <div 
                                        style={st}
                                        className="flex items-center gap-3 p-2.5 px-4 rounded-2xl border-2 transition-all duration-300 bg-[#fbf9f4] dark:bg-[#1a1e17] border-[#8b6f47]/40 dark:border-[#d4a574]/35 cursor-pointer shadow-md select-none"
                                    >
                                        <div 
                                            className="w-8 h-8 rounded-xl bg-[#8b6f47]/15 dark:bg-[#d4a574]/20 flex items-center justify-center font-black shrink-0 transition-colors"
                                            style={st.color ? { color: st.color, backgroundColor: `${st.color}20` } : undefined}
                                        >
                                            <User size={16} />
                                        </div>
                                        <div className="flex flex-col text-left">
                                            <span 
                                                className="text-[8px] font-black uppercase tracking-wider text-[#8b6f47] dark:text-[#d4a574] transition-colors"
                                                style={st.color ? { color: st.color, opacity: 0.8 } : undefined}
                                            >
                                                Khách Hàng
                                            </span>
                                            <span 
                                                className="text-xs font-black text-[#2d5016] dark:text-emerald-400 uppercase tracking-tight transition-colors"
                                                style={st.color ? { color: st.color } : undefined}
                                            >
                                                Nguyễn Văn A
                                            </span>
                                        </div>
                                    </div>
                                );
                            })()}

                            {/* Note & Ship Buttons Preview */}
                            {(() => {
                                const btnSt = getButtonComputedStyle(currentConfig, 'buttons');
                                return (
                                    <div 
                                        style={btnSt}
                                        className="w-9 h-9 rounded-xl border-2 flex items-center justify-center text-[#8b6f47] dark:text-[#d4a574] bg-[#fbf9f4] dark:bg-[#1a1e17] border-[#8b6f47]/40 dark:border-[#d4a574]/35 shadow-sm cursor-pointer select-none transition-colors"
                                        title="Ghi chú"
                                    >
                                        <Receipt size={15} style={btnSt.color ? { color: btnSt.color } : undefined} />
                                    </div>
                                );
                            })()}
                        </div>

                        {/* Right Side: Cash given, Payment toggle, Total bubble & Save/Print */}
                        <div className="flex items-center gap-2.5 flex-wrap">
                            {/* Cash Given F1 Preview */}
                            {(() => {
                                const cashSt = getBubbleComputedStyle(currentConfig, 'cash');
                                const badgeSt = getBubbleBadgeStyle(currentConfig, 'cash');
                                return (
                                    <div 
                                        style={cashSt}
                                        className="flex items-center gap-2 p-2 px-3 rounded-2xl border-2 bg-[#fbf9f4] dark:bg-[#1a1e17] border-[#8b6f47]/40 dark:border-[#d4a574]/35 transition-all shadow-md select-none"
                                    >
                                        <div style={badgeSt} className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 shadow-xs">
                                            <DollarSign size={13} style={{ color: badgeSt.color || '#ffffff' }} />
                                        </div>
                                        <div className="flex flex-col text-right">
                                            <span 
                                                className="text-[7.5px] font-black uppercase text-[#8b6f47] dark:text-[#d4a574] transition-colors"
                                                style={cashSt.color ? { color: cashSt.color, opacity: 0.8 } : undefined}
                                            >
                                                Khách đưa F1
                                            </span>
                                            <span 
                                                className="text-xs font-black text-[#2d5016] dark:text-emerald-400 transition-colors"
                                                style={cashSt.color ? { color: cashSt.color } : undefined}
                                            >
                                                500.000đ
                                            </span>
                                        </div>
                                    </div>
                                );
                            })()}

                            {/* Total Bubble Preview */}
                            {(() => {
                                const totalSt = getBubbleComputedStyle(currentConfig, 'total');
                                return (
                                    <div 
                                        style={totalSt}
                                        className="flex items-center gap-2.5 p-2 px-4 rounded-2xl border-2 bg-[#fbf9f4] dark:bg-[#1a1e17] border-[#8b6f47]/40 dark:border-[#d4a574]/35 transition-all shadow-md select-none"
                                    >
                                        <div className="flex flex-col text-right">
                                            <span 
                                                className="text-[8px] font-black uppercase tracking-wider text-[#8b6f47] dark:text-[#d4a574] transition-colors"
                                                style={totalSt.color ? { color: totalSt.color, opacity: 0.8 } : undefined}
                                            >
                                                Tổng cộng
                                            </span>
                                            <span 
                                                className="text-base font-black text-[#2d5016] dark:text-emerald-400 tracking-tight transition-colors"
                                                style={totalSt.color ? { color: totalSt.color } : undefined}
                                            >
                                                450.000đ
                                            </span>
                                        </div>
                                    </div>
                                );
                            })()}

                            {/* Mini-sidebar Button Preview */}
                            {(() => {
                                const btnSt = getButtonComputedStyle(currentConfig, 'buttons');
                                return (
                                    <div 
                                        style={btnSt}
                                        className="w-10 h-10 rounded-2xl border-2 flex items-center justify-center text-[#8b6f47] dark:text-[#d4a574] bg-[#fbf9f4] dark:bg-[#1a1e17] border-[#8b6f47]/40 dark:border-[#d4a574]/35 shadow-md cursor-pointer select-none transition-colors"
                                        title="Nút chức năng"
                                    >
                                        <SlidersHorizontal size={16} style={btnSt.color ? { color: btnSt.color } : undefined} />
                                    </div>
                                );
                            })()}

                            {/* Save & Print F9 Button Preview */}
                            {(() => {
                                const spSt = getButtonComputedStyle(currentConfig, 'save_print');
                                return (
                                    <div 
                                        style={spSt}
                                        className="w-10 h-10 rounded-2xl border-2 flex items-center justify-center text-white shadow-lg cursor-pointer select-none transition-colors"
                                        title="Lưu & In (F9)"
                                    >
                                        <Printer size={18} strokeWidth={2.5} style={spSt.color ? { color: spSt.color } : undefined} />
                                    </div>
                                );
                            })()}
                        </div>
                    </div>
                </div>
            </div>

            {/* Presets Grid */}
            <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                    <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <Sparkles size={14} className="text-amber-500" />
                        Gợi ý phong cách Bubble & Nút bấm (Presets)
                    </h4>
                    <button
                        type="button"
                        onClick={handleResetBubbles}
                        className="flex items-center gap-1 text-[10px] font-bold text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                    >
                        <RotateCcw size={11} />
                        <span>Khôi phục mặc định</span>
                    </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                    {BUBBLE_PRESETS.map((preset) => {
                        const isSelected = (currentConfig.bubbleBorderColor === preset.bubbleBorderColor && 
                                            currentConfig.bubbleBg === preset.bubbleBg &&
                                            currentConfig.bubbleShadowY === preset.bubbleShadowY);
                        return (
                            <button
                                key={preset.id}
                                type="button"
                                onClick={() => handleApplyPreset(preset)}
                                className={cn(
                                    "flex flex-col p-2.5 rounded-2xl border text-left transition-all cursor-pointer shadow-xs hover:scale-[1.02] active:scale-98 group",
                                    isSelected
                                        ? "border-emerald-500 dark:border-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/30 ring-2 ring-emerald-500/20"
                                        : "border-black/10 dark:border-white/10 bg-white/50 dark:bg-slate-900/40 hover:border-black/20 dark:hover:border-white/20"
                                )}
                            >
                                <div className="flex items-center justify-between w-full mb-1">
                                    <span className="font-black text-[11px] text-slate-800 dark:text-slate-100 truncate">
                                        {preset.name}
                                    </span>
                                    {isSelected && (
                                        <div className="w-3.5 h-3.5 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
                                            <Check size={9} strokeWidth={3} />
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center gap-1.5 mt-1">
                                    <div 
                                        className="w-3.5 h-3.5 rounded border shrink-0" 
                                        style={{ backgroundColor: preset.previewBg, borderColor: preset.previewBorder }}
                                    />
                                    <div 
                                        className="w-3.5 h-3.5 rounded shadow-xs shrink-0" 
                                        style={{ backgroundColor: preset.previewAccent }}
                                    />
                                    <span className="text-[8.5px] font-bold text-slate-400 truncate flex-1 min-w-0">
                                        {preset.desc}
                                    </span>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Customization Target Selector */}
            <div className="space-y-3 pt-3 border-t border-[#8b6f47]/20 dark:border-white/10">
                <div className="flex items-center justify-between flex-wrap gap-2">
                    <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <Sliders size={14} className="text-emerald-600 dark:text-emerald-400" />
                        Chọn đối tượng muốn tùy biến:
                    </h4>

                    {/* Mode: Quick All vs Granular */}
                    <div className="flex items-center p-0.5 bg-black/5 dark:bg-white/5 rounded-xl border border-black/5 dark:border-white/10">
                        <button
                            type="button"
                            onClick={() => {
                                onChangeConfig({ ...currentConfig, bubbleCustomMode: 'all' });
                                setSubTarget('all');
                            }}
                            className={cn(
                                "px-2.5 py-1 rounded-lg text-[10px] font-black uppercase transition-all cursor-pointer",
                                (currentConfig.bubbleCustomMode !== 'individual')
                                    ? "bg-emerald-600 text-white shadow-xs"
                                    : "text-slate-500 hover:text-slate-800 dark:hover:text-white"
                            )}
                        >
                            Tất cả cùng lúc
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                onChangeConfig({ ...currentConfig, bubbleCustomMode: 'individual' });
                                if (subTarget === 'all') setSubTarget('partner');
                            }}
                            className={cn(
                                "px-2.5 py-1 rounded-lg text-[10px] font-black uppercase transition-all cursor-pointer",
                                (currentConfig.bubbleCustomMode === 'individual')
                                    ? "bg-emerald-600 text-white shadow-xs"
                                    : "text-slate-500 hover:text-slate-800 dark:hover:text-white"
                            )}
                        >
                            Chi tiết từng ô
                        </button>
                    </div>
                </div>

                {/* Sub-targets pill tabs */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
                    <button
                        type="button"
                        onClick={() => {
                            setSubTarget('all');
                            onChangeConfig({ ...currentConfig, bubbleCustomMode: 'all' });
                        }}
                        className={cn(
                            "px-3 py-1.5 rounded-xl text-xs font-black whitespace-nowrap flex items-center gap-1.5 transition-all cursor-pointer border",
                            subTarget === 'all'
                                ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                                : "bg-white/60 dark:bg-slate-900/60 text-slate-700 dark:text-slate-300 border-black/10 dark:border-white/10 hover:border-black/20"
                        )}
                    >
                        <Sparkles size={13} />
                        <span>Tất cả Bubble & Nút</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => {
                            setSubTarget('partner');
                            onChangeConfig({ ...currentConfig, bubbleCustomMode: 'individual' });
                        }}
                        className={cn(
                            "px-3 py-1.5 rounded-xl text-xs font-black whitespace-nowrap flex items-center gap-1.5 transition-all cursor-pointer border",
                            subTarget === 'partner'
                                ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                                : "bg-white/60 dark:bg-slate-900/60 text-slate-700 dark:text-slate-300 border-black/10 dark:border-white/10 hover:border-black/20"
                        )}
                    >
                        <User size={13} />
                        <span>Khách Hàng</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => {
                            setSubTarget('cash');
                            onChangeConfig({ ...currentConfig, bubbleCustomMode: 'individual' });
                        }}
                        className={cn(
                            "px-3 py-1.5 rounded-xl text-xs font-black whitespace-nowrap flex items-center gap-1.5 transition-all cursor-pointer border",
                            subTarget === 'cash'
                                ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                                : "bg-white/60 dark:bg-slate-900/60 text-slate-700 dark:text-slate-300 border-black/10 dark:border-white/10 hover:border-black/20"
                        )}
                    >
                        <DollarSign size={13} />
                        <span>Khách Đưa F1</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => {
                            setSubTarget('payment');
                            onChangeConfig({ ...currentConfig, bubbleCustomMode: 'individual' });
                        }}
                        className={cn(
                            "px-3 py-1.5 rounded-xl text-xs font-black whitespace-nowrap flex items-center gap-1.5 transition-all cursor-pointer border",
                            subTarget === 'payment'
                                ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                                : "bg-white/60 dark:bg-slate-900/60 text-slate-700 dark:text-slate-300 border-black/10 dark:border-white/10 hover:border-black/20"
                        )}
                    >
                        <CreditCard size={13} />
                        <span>Phương Thức TT</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => {
                            setSubTarget('total');
                            onChangeConfig({ ...currentConfig, bubbleCustomMode: 'individual' });
                        }}
                        className={cn(
                            "px-3 py-1.5 rounded-xl text-xs font-black whitespace-nowrap flex items-center gap-1.5 transition-all cursor-pointer border",
                            subTarget === 'total'
                                ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                                : "bg-white/60 dark:bg-slate-900/60 text-slate-700 dark:text-slate-300 border-black/10 dark:border-white/10 hover:border-black/20"
                        )}
                    >
                        <Zap size={13} />
                        <span>Tổng Cộng Tiền</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setSubTarget('buttons')}
                        className={cn(
                            "px-3 py-1.5 rounded-xl text-xs font-black whitespace-nowrap flex items-center gap-1.5 transition-all cursor-pointer border",
                            subTarget === 'buttons'
                                ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                                : "bg-white/60 dark:bg-slate-900/60 text-slate-700 dark:text-slate-300 border-black/10 dark:border-white/10 hover:border-black/20"
                        )}
                    >
                        <MousePointerClick size={13} />
                        <span>Nút Phím Tắt</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setSubTarget('save_print')}
                        className={cn(
                            "px-3 py-1.5 rounded-xl text-xs font-black whitespace-nowrap flex items-center gap-1.5 transition-all cursor-pointer border",
                            subTarget === 'save_print'
                                ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                                : "bg-white/60 dark:bg-slate-900/60 text-slate-700 dark:text-slate-300 border-black/10 dark:border-white/10 hover:border-black/20"
                        )}
                    >
                        <Printer size={13} />
                        <span>Nút Lưu & In (F9)</span>
                    </button>
                </div>
            </div>

            {/* CONTROLS SECTION */}
            <div className="space-y-5 pt-2">
                {/* 1. Background Color, Text Color & Border Color Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {/* Background Color Card */}
                    <div className="p-3.5 rounded-2xl bg-black/[0.03] dark:bg-white/[0.04] border border-black/10 dark:border-white/10 space-y-2.5 flex flex-col justify-between shadow-xs">
                        <div className="flex items-center justify-between">
                            <span className="flex items-center gap-1.5 text-xs font-black text-slate-800 dark:text-slate-200">
                                <span className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20">
                                    <Palette size={13} strokeWidth={2.5} />
                                </span>
                                Màu nền
                            </span>
                            <span className="font-mono text-[10.5px] text-emerald-700 dark:text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/20">
                                {currentConfig[fieldNames.bg] === 'default' || !currentConfig[fieldNames.bg] ? 'Mặc định' : currentConfig[fieldNames.bg]}
                            </span>
                        </div>

                        {/* Input Row: Picker + Hex + Reset */}
                        <div className="flex items-center gap-1.5">
                            <input
                                type="color"
                                value={currentConfig[fieldNames.bg] === 'default' || !currentConfig[fieldNames.bg] ? '#fbf9f4' : currentConfig[fieldNames.bg]}
                                onChange={(e) => onChangeConfig({ ...currentConfig, [fieldNames.bg]: e.target.value })}
                                className="w-8 h-8 rounded-xl cursor-pointer border border-black/15 dark:border-white/15 p-0.5 bg-white dark:bg-slate-800 shrink-0 shadow-xs"
                                title="Bấm để chọn màu"
                            />
                            <input
                                type="text"
                                value={currentConfig[fieldNames.bg] === 'default' || !currentConfig[fieldNames.bg] ? '' : currentConfig[fieldNames.bg]}
                                placeholder="#HEX..."
                                onChange={(e) => onChangeConfig({ ...currentConfig, [fieldNames.bg]: e.target.value })}
                                className="flex-1 min-w-0 h-8 px-2 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-xs font-mono font-bold outline-none uppercase focus:border-emerald-500 transition-colors"
                            />
                            <button
                                type="button"
                                onClick={() => onChangeConfig({ ...currentConfig, [fieldNames.bg]: 'default' })}
                                className={cn(
                                    "h-8 px-2.5 text-[11px] font-black rounded-xl border transition-all cursor-pointer whitespace-nowrap shrink-0",
                                    currentConfig[fieldNames.bg] === 'default' || !currentConfig[fieldNames.bg]
                                        ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                                        : "bg-black/5 dark:bg-white/5 text-slate-600 dark:text-slate-400 border-black/10 dark:border-white/10 hover:bg-black/10"
                                )}
                            >
                                Mặc định
                            </button>
                        </div>

                        {/* Quick Swatches */}
                        <div className="flex items-center gap-1.5 pt-0.5">
                            {quickColors.slice(0, 7).map((col) => (
                                <button
                                    key={col}
                                    type="button"
                                    onClick={() => onChangeConfig({ ...currentConfig, [fieldNames.bg]: col })}
                                    className="w-5 h-5 rounded-full border border-black/20 hover:scale-125 transition-transform shadow-xs cursor-pointer shrink-0"
                                    style={{ backgroundColor: col }}
                                    title={col}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Text Color Card */}
                    <div className="p-3.5 rounded-2xl bg-black/[0.03] dark:bg-white/[0.04] border border-black/10 dark:border-white/10 space-y-2.5 flex flex-col justify-between shadow-xs">
                        <div className="flex items-center justify-between">
                            <span className="flex items-center gap-1.5 text-xs font-black text-slate-800 dark:text-slate-200">
                                <span className="w-6 h-6 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0 border border-sky-500/20">
                                    <Type size={13} strokeWidth={2.5} />
                                </span>
                                Màu chữ
                            </span>
                            <span className="font-mono text-[10.5px] text-sky-700 dark:text-sky-400 font-bold bg-sky-500/10 px-2 py-0.5 rounded-lg border border-sky-500/20">
                                {currentConfig[fieldNames.text] === 'default' || !currentConfig[fieldNames.text] ? 'Mặc định' : currentConfig[fieldNames.text]}
                            </span>
                        </div>

                        {/* Input Row: Picker + Hex + Reset */}
                        <div className="flex items-center gap-1.5">
                            <input
                                type="color"
                                value={currentConfig[fieldNames.text] === 'default' || !currentConfig[fieldNames.text] ? '#ffffff' : currentConfig[fieldNames.text]}
                                onChange={(e) => handleTextColorChange(e.target.value)}
                                className="w-8 h-8 rounded-xl cursor-pointer border border-black/15 dark:border-white/15 p-0.5 bg-white dark:bg-slate-800 shrink-0 shadow-xs"
                                title="Bấm để chọn màu chữ"
                            />
                            <input
                                type="text"
                                value={currentConfig[fieldNames.text] === 'default' || !currentConfig[fieldNames.text] ? '' : currentConfig[fieldNames.text]}
                                placeholder="#HEX..."
                                onChange={(e) => handleTextColorChange(e.target.value)}
                                className="flex-1 min-w-0 h-8 px-2 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-xs font-mono font-bold outline-none uppercase focus:border-sky-500 transition-colors"
                            />
                            <button
                                type="button"
                                onClick={() => handleTextColorChange('default')}
                                className={cn(
                                    "h-8 px-2.5 text-[11px] font-black rounded-xl border transition-all cursor-pointer whitespace-nowrap shrink-0",
                                    currentConfig[fieldNames.text] === 'default' || !currentConfig[fieldNames.text]
                                        ? "bg-sky-600 text-white border-sky-600 shadow-xs"
                                        : "bg-black/5 dark:bg-white/5 text-slate-600 dark:text-slate-400 border-black/10 dark:border-white/10 hover:bg-black/10"
                                )}
                            >
                                Mặc định
                            </button>
                        </div>

                        {/* Quick Swatches */}
                        <div className="flex items-center gap-1.5 pt-0.5">
                            {quickTextColors.slice(0, 7).map((col) => (
                                <button
                                    key={col}
                                    type="button"
                                    onClick={() => handleTextColorChange(col)}
                                    className="w-5 h-5 rounded-full border border-black/20 hover:scale-125 transition-transform shadow-xs cursor-pointer shrink-0"
                                    style={{ backgroundColor: col }}
                                    title={col}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Border Color Card */}
                    <div className="p-3.5 rounded-2xl bg-black/[0.03] dark:bg-white/[0.04] border border-black/10 dark:border-white/10 space-y-2.5 flex flex-col justify-between shadow-xs">
                        <div className="flex items-center justify-between">
                            <span className="flex items-center gap-1.5 text-xs font-black text-slate-800 dark:text-slate-200">
                                <span className="w-6 h-6 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/20">
                                    <Square size={13} strokeWidth={2.5} />
                                </span>
                                Màu viền
                            </span>
                            <span className="font-mono text-[10.5px] text-amber-700 dark:text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/20">
                                {currentConfig[fieldNames.border] === 'default' || !currentConfig[fieldNames.border] ? 'Mặc định' : currentConfig[fieldNames.border]}
                            </span>
                        </div>

                        {/* Input Row: Picker + Hex + Reset */}
                        <div className="flex items-center gap-1.5">
                            <input
                                type="color"
                                value={currentConfig[fieldNames.border] === 'default' || !currentConfig[fieldNames.border] ? '#8b6f47' : currentConfig[fieldNames.border]}
                                onChange={(e) => onChangeConfig({ ...currentConfig, [fieldNames.border]: e.target.value })}
                                className="w-8 h-8 rounded-xl cursor-pointer border border-black/15 dark:border-white/15 p-0.5 bg-white dark:bg-slate-800 shrink-0 shadow-xs"
                                title="Bấm để chọn màu viền"
                            />
                            <input
                                type="text"
                                value={currentConfig[fieldNames.border] === 'default' || !currentConfig[fieldNames.border] ? '' : currentConfig[fieldNames.border]}
                                placeholder="#HEX..."
                                onChange={(e) => onChangeConfig({ ...currentConfig, [fieldNames.border]: e.target.value })}
                                className="flex-1 min-w-0 h-8 px-2 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-xs font-mono font-bold outline-none uppercase focus:border-amber-500 transition-colors"
                            />
                            <button
                                type="button"
                                onClick={() => onChangeConfig({ ...currentConfig, [fieldNames.border]: 'default' })}
                                className={cn(
                                    "h-8 px-2.5 text-[11px] font-black rounded-xl border transition-all cursor-pointer whitespace-nowrap shrink-0",
                                    currentConfig[fieldNames.border] === 'default' || !currentConfig[fieldNames.border]
                                        ? "bg-amber-600 text-white border-amber-600 shadow-xs"
                                        : "bg-black/5 dark:bg-white/5 text-slate-600 dark:text-slate-400 border-black/10 dark:border-white/10 hover:bg-black/10"
                                )}
                            >
                                Mặc định
                            </button>
                        </div>

                        {/* Quick Swatches */}
                        <div className="flex items-center gap-1.5 pt-0.5">
                            {quickColors.slice(0, 7).map((col) => (
                                <button
                                    key={col}
                                    type="button"
                                    onClick={() => onChangeConfig({ ...currentConfig, [fieldNames.border]: col })}
                                    className="w-5 h-5 rounded-full border border-black/20 hover:scale-125 transition-transform shadow-xs cursor-pointer shrink-0"
                                    style={{ backgroundColor: col }}
                                    title={col}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                {/* Dedicated Border Width Bar */}
                <div className="p-3.5 rounded-2xl bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/20 flex flex-wrap items-center justify-between gap-3 shadow-xs">
                    <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/30">
                            <Square size={14} strokeWidth={2.5} />
                        </div>
                        <div>
                            <span className="text-xs font-black text-slate-800 dark:text-slate-100 block">
                                Độ Dày Đường Viền (Border Width)
                            </span>
                            <span className="text-[10px] text-slate-500 dark:text-slate-400">
                                Áp dụng độ dày viền bao quanh các ô và nút bấm
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-1.5 bg-black/5 dark:bg-white/5 p-1 rounded-xl border border-black/10 dark:border-white/10">
                        {['1', '1.5', '2', '3', '4'].map((w) => {
                            const activeW = isButtons 
                                ? (currentConfig.btnBorderWidth || '2') 
                                : (currentConfig.bubbleBorderWidth || '2');
                            const isSelected = activeW === w;
                            return (
                                <button
                                    key={w}
                                    type="button"
                                    onClick={() => {
                                        if (isButtons) {
                                            onChangeConfig({ ...currentConfig, btnBorderWidth: w });
                                        } else {
                                            onChangeConfig({ ...currentConfig, bubbleBorderWidth: w });
                                        }
                                    }}
                                    className={cn(
                                        "px-2.5 py-1 text-xs font-black rounded-lg transition-all cursor-pointer flex items-center gap-1.5",
                                        isSelected
                                            ? "bg-amber-600 text-white shadow-xs"
                                            : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5"
                                    )}
                                >
                                    <span 
                                        className="inline-block rounded-full bg-current opacity-80" 
                                        style={{ 
                                            width: `${Math.max(2, parseFloat(w) * 1.5)}px`, 
                                            height: `${Math.max(2, parseFloat(w) * 1.5)}px` 
                                        }} 
                                    />
                                    {w}px
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* 2. Downward Shadow Controls (Đổ bóng hướng xuống dưới) */}
                <div className="p-4 rounded-2xl bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/20 space-y-3.5">
                    <div className="flex items-center justify-between">
                        <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                            <ArrowDown size={15} className="text-amber-500 animate-bounce" />
                            Đổ Bóng Hướng Xuống Dưới (Downward Cast Shadow)
                        </h4>
                        <span className="text-[10px] text-amber-700 dark:text-amber-400 font-bold bg-amber-500/15 px-2 py-0.5 rounded-lg border border-amber-500/30">
                            Y-Offset: {isButtons ? (currentConfig.btnShadowY ?? 8) : (currentConfig.bubbleShadowY ?? 10)}px
                        </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                        {/* Downward Y-Offset */}
                        <div className="space-y-1.5">
                            <div className="flex justify-between items-center text-[11px] font-bold text-slate-700 dark:text-slate-300">
                                <span>Độ lệch rơi xuống (Y):</span>
                                <span className="font-mono text-emerald-600 dark:text-emerald-400 font-black">
                                    +{isButtons ? (currentConfig.btnShadowY ?? 8) : (currentConfig.bubbleShadowY ?? 10)}px
                                </span>
                            </div>
                            <input
                                type="range"
                                min="2"
                                max="28"
                                step="1"
                                value={isButtons ? (currentConfig.btnShadowY ?? 8) : (currentConfig.bubbleShadowY ?? 10)}
                                onChange={(e) => {
                                    const val = parseInt(e.target.value, 10);
                                    if (isButtons) {
                                        onChangeConfig({ ...currentConfig, btnShadowY: val });
                                    } else {
                                        onChangeConfig({ ...currentConfig, bubbleShadowY: val, btnShadowY: Math.max(4, val - 2) });
                                    }
                                }}
                                className="w-full accent-amber-500 cursor-pointer h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg"
                            />
                        </div>

                        {/* Blur Radius */}
                        <div className="space-y-1.5">
                            <div className="flex justify-between items-center text-[11px] font-bold text-slate-700 dark:text-slate-300">
                                <span>Độ mịn bóng (Blur):</span>
                                <span className="font-mono text-emerald-600 dark:text-emerald-400 font-black">
                                    {isButtons ? (currentConfig.btnShadowBlur ?? 18) : (currentConfig.bubbleShadowBlur ?? 22)}px
                                </span>
                            </div>
                            <input
                                type="range"
                                min="6"
                                max="36"
                                step="1"
                                value={isButtons ? (currentConfig.btnShadowBlur ?? 18) : (currentConfig.bubbleShadowBlur ?? 22)}
                                onChange={(e) => {
                                    const val = parseInt(e.target.value, 10);
                                    if (isButtons) {
                                        onChangeConfig({ ...currentConfig, btnShadowBlur: val });
                                    } else {
                                        onChangeConfig({ ...currentConfig, bubbleShadowBlur: val, btnShadowBlur: Math.max(6, val - 4) });
                                    }
                                }}
                                className="w-full accent-amber-500 cursor-pointer h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg"
                            />
                        </div>

                        {/* Shadow Opacity */}
                        <div className="space-y-1.5">
                            <div className="flex justify-between items-center text-[11px] font-bold text-slate-700 dark:text-slate-300">
                                <span>Độ đậm bóng (Opacity):</span>
                                <span className="font-mono text-emerald-600 dark:text-emerald-400 font-black">
                                    {isButtons ? (currentConfig.btnShadowOpacity ?? 22) : (currentConfig.bubbleShadowOpacity ?? 24)}%
                                </span>
                            </div>
                            <input
                                type="range"
                                min="10"
                                max="70"
                                step="2"
                                value={isButtons ? (currentConfig.btnShadowOpacity ?? 22) : (currentConfig.bubbleShadowOpacity ?? 24)}
                                onChange={(e) => {
                                    const val = parseInt(e.target.value, 10);
                                    if (isButtons) {
                                        onChangeConfig({ ...currentConfig, btnShadowOpacity: val });
                                    } else {
                                        onChangeConfig({ ...currentConfig, bubbleShadowOpacity: val, btnShadowOpacity: Math.max(10, val - 2) });
                                    }
                                }}
                                className="w-full accent-amber-500 cursor-pointer h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg"
                            />
                        </div>
                    </div>
                </div>

                {/* 3. Neon Glow Effect Controls */}
                <div className="p-4 rounded-2xl bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20 space-y-3.5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                            <div className={cn(
                                "w-7 h-7 rounded-xl flex items-center justify-center transition-all",
                                (currentConfig.bubbleEnableGlow || currentConfig.btnEnableGlow)
                                    ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30"
                                    : "bg-black/10 dark:bg-white/10 text-slate-400"
                            )}>
                                <SunMedium size={15} strokeWidth={2.5} />
                            </div>
                            <div>
                                <span className="font-black text-xs text-slate-800 dark:text-slate-100 block">
                                    Hiệu Ứng Phát Sáng Neon (Neon Glow Viền)
                                </span>
                                <span className="text-[10px] text-slate-500 dark:text-slate-400">
                                    Tạo viền phát sáng đa sắc xung quanh bubble và nút
                                </span>
                            </div>
                        </div>

                        {/* Toggle Glow */}
                        <div 
                            onClick={() => {
                                const nextVal = !currentConfig.bubbleEnableGlow;
                                onChangeConfig({ 
                                    ...currentConfig, 
                                    bubbleEnableGlow: nextVal,
                                    btnEnableGlow: nextVal
                                });
                            }}
                            className={cn(
                                "w-10 h-6 rounded-full p-0.5 transition-colors duration-300 flex items-center shrink-0 border cursor-pointer",
                                (currentConfig.bubbleEnableGlow || currentConfig.btnEnableGlow)
                                    ? "bg-emerald-600 border-emerald-600 justify-end"
                                    : "bg-slate-300 dark:bg-slate-700 border-slate-300 dark:border-slate-600 justify-start"
                            )}
                        >
                            <div className="w-4 h-4 rounded-full bg-white shadow-sm" />
                        </div>
                    </div>

                    {(currentConfig.bubbleEnableGlow || currentConfig.btnEnableGlow) && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-emerald-500/15 animate-in fade-in duration-200">
                            {/* Glow Color */}
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                                    <span>Màu ánh sáng phát Neon:</span>
                                    <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                                        {currentConfig[fieldNames.glow] || '#10b981'}
                                    </span>
                                </label>
                                <div className="flex items-center gap-1.5 flex-wrap">
                                    {glowColors.map((col) => (
                                        <button
                                            key={col}
                                            type="button"
                                            onClick={() => onChangeConfig({ ...currentConfig, [fieldNames.glow]: col })}
                                            className={cn(
                                                "w-6 h-6 rounded-lg border-2 transition-all cursor-pointer shadow-xs",
                                                currentConfig[fieldNames.glow] === col
                                                    ? "scale-115 border-white ring-2 ring-emerald-500"
                                                    : "border-black/20 hover:scale-110"
                                            )}
                                            style={{ backgroundColor: col }}
                                            title={col}
                                        />
                                    ))}
                                    <input
                                        type="color"
                                        value={currentConfig[fieldNames.glow] || '#10b981'}
                                        onChange={(e) => onChangeConfig({ ...currentConfig, [fieldNames.glow]: e.target.value })}
                                        className="w-6 h-6 rounded-lg cursor-pointer border border-black/20 p-0 bg-transparent"
                                        title="Chọn màu khác"
                                    />
                                </div>
                            </div>

                            {/* Glow Spread Radius */}
                            <div className="space-y-1.5">
                                <div className="flex justify-between items-center text-[11px] font-bold text-slate-700 dark:text-slate-300">
                                    <span>Bán kính ánh sáng (Spread):</span>
                                    <span className="font-mono text-emerald-600 dark:text-emerald-400 font-black">
                                        {currentConfig.bubbleGlowIntensity || 15}px
                                    </span>
                                </div>
                                <input
                                    type="range"
                                    min="6"
                                    max="32"
                                    step="1"
                                    value={currentConfig.bubbleGlowIntensity || 15}
                                    onChange={(e) => {
                                        const val = parseInt(e.target.value, 10);
                                        onChangeConfig({ 
                                            ...currentConfig, 
                                            bubbleGlowIntensity: val,
                                            btnGlowIntensity: Math.max(6, val - 3)
                                        });
                                    }}
                                    className="w-full accent-emerald-500 cursor-pointer h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg"
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
