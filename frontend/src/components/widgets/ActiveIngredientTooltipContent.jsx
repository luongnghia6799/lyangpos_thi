import React, { useState, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion as m, AnimatePresence } from 'framer-motion';
import {
    POPULAR_ACTIVE_INGREDIENTS,
    CATEGORY_LABELS,
    parseActiveIngredients,
    getCustomActiveIngredients
} from '../../data/activeIngredientsData';
import { useResearchedActiveIngredients } from '../../queries/useProductData';
import { 
    FlaskConical, 
    Tag, 
    ShieldCheck, 
    Bug, 
    Flower2, 
    Zap, 
    Droplets, 
    Flame, 
    Leaf, 
    Crosshair, 
    PlusCircle, 
    Gauge, 
    AlertTriangle, 
    CheckCircle2,
    Layers,
    Shield,
    Sparkles
} from 'lucide-react';

/**
 * Phân tích và tìm thông tin nhóm / công dụng của hoạt chất
 */
export function getIngredientDetails(rawIngredientName) {
    if (!rawIngredientName || typeof rawIngredientName !== 'string') return null;
    const cleanName = rawIngredientName.replace(/\s+\d+.*$/i, '').trim().toLowerCase();

    // 1. Tìm trong từ điển chuẩn
    const foundStandard = POPULAR_ACTIVE_INGREDIENTS.find(p => {
        if (p.name.toLowerCase() === cleanName) return true;
        if (p.aliases && p.aliases.some(a => a.toLowerCase() === cleanName || cleanName.includes(a.toLowerCase()))) return true;
        return false;
    });

    if (foundStandard) {
        return {
            name: foundStandard.name,
            cleanName,
            raw: rawIngredientName,
            category: foundStandard.category,
            categoryInfo: CATEGORY_LABELS[foundStandard.category] || CATEGORY_LABELS.custom
        };
    }

    // 2. Tìm trong danh sách custom
    const customList = getCustomActiveIngredients();
    const foundCustom = customList.find(c => {
        const cName = (typeof c === 'string' ? c : c.name || '').toLowerCase();
        return cName === cleanName;
    });

    if (foundCustom) {
        const cat = typeof foundCustom === 'object' && foundCustom.category ? foundCustom.category : 'custom';
        return {
            name: typeof foundCustom === 'string' ? foundCustom : foundCustom.name,
            cleanName,
            raw: rawIngredientName,
            category: cat,
            categoryInfo: CATEGORY_LABELS[cat] || CATEGORY_LABELS.custom
        };
    }

    return {
        name: rawIngredientName.trim(),
        cleanName,
        raw: rawIngredientName,
        category: 'custom',
        categoryInfo: CATEGORY_LABELS.custom
    };
}

/**
 * Biểu tượng tương ứng cho từng nhóm hoạt chất
 */
function getCategoryIcon(category) {
    switch (category) {
        case 'fungicide':
            return <ShieldCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />;
        case 'insecticide':
            return <Bug className="w-3 h-3 text-rose-600 dark:text-rose-400 shrink-0" />;
        case 'herbicide':
            return <Flower2 className="w-3 h-3 text-amber-600 dark:text-amber-400 shrink-0" />;
        case 'pgr':
            return <Zap className="w-3 h-3 text-teal-600 dark:text-teal-400 shrink-0" />;
        default:
            return <Tag className="w-3 h-3 text-[#8b6f47] dark:text-[#d4a574] shrink-0" />;
    }
}

/**
 * Helper parse danh sách tags, targets, synergies
 */
function parseTagsList(val) {
    if (!val) return [];
    if (Array.isArray(val)) return val.filter(Boolean);
    if (typeof val === 'string') {
        try {
            const parsed = JSON.parse(val);
            if (Array.isArray(parsed)) return parsed.filter(Boolean);
        } catch (_) {}
        return val.split(/[,;\n]+/).map(s => s.trim()).filter(Boolean);
    }
    return [];
}

/**
 * Tự động xác định đặc tính tác động dược lý (Lưu dẫn 2 chiều, Nội hấp thấm sâu, Tiếp xúc vị độc, Tiếp xúc bảo vệ...)
 */
/**
 * Tự động xác định đặc tính tác động dược lý với cấu hình badge chuyên nghiệp
 */
/**
 * Tự động phân tích danh sách các nhãn cơ chế tác động chuyên biệt và chính xác
 */
export function getActionBadges(cleanName, category, research) {
    const name = (cleanName || '').toLowerCase();
    const badges = [];
    const added = new Set();

    const addBadge = (label, color) => {
        if (!added.has(label)) {
            added.add(label);
            badges.push({ label, color });
        }
    };

    const fullText = [
        research?.moa || '',
        research?.role_type || '',
        research?.features || '',
        research?.group_name || '',
        research?.keywords || ''
    ].join(' ').toLowerCase();

    // 0. Nhóm CHẤT TRỢ LỰC, LOANG TRẢI, BÁM DÍNH, DẦU KHOÁNG (Adjuvants / Surfactants)
    const isAdjuvant = [
        'polyethoxylated', 'nonylphenol', 'adjuvant', 'surfactant', 'bám dính', 'bam dinh',
        'loang trải', 'loang trai', 'dầu khoáng', 'dau khoang', 'silicone', 'thấm sâu 30s', 'tro luc'
    ].some(k => name.includes(k) || fullText.includes(k));

    if (isAdjuvant) {
        addBadge('Loang trải mạnh', 'bg-cyan-500/15 text-cyan-800 dark:text-cyan-300 border-cyan-500/30');
        addBadge('Bám dính chống rửa trôi', 'bg-teal-500/15 text-teal-800 dark:text-teal-300 border-teal-500/30');
        addBadge('Trợ lực dẫn thuốc', 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border-emerald-500/30');
        return badges;
    }

    // 1. Nhóm ĐIỀU HÒA SINH TRƯỞNG & DINH DƯỠNG (PGR & Nutrients)
    if (category === 'pgr' || ['ga3', 'gibberellic', 'paclobutrazol', 'paclo', 'brassinolide', 'amino', 'acid humic', 'fulvic', 'seaweed', 'rong bien', 'chitosan', 'cppu', 'naa', 'iba'].some(k => name.includes(k))) {
        if (name.includes('ga3') || fullText.includes('kéo đọt') || fullText.includes('lớn trái')) {
            addBadge('Kích thích sinh trưởng', 'bg-teal-500/15 text-teal-800 dark:text-teal-300 border-teal-500/30');
            addBadge('Kéo đọt & Phóng bông', 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border-emerald-500/30');
        } else if (name.includes('paclo') || fullText.includes('hãm đọt') || fullText.includes('ra hoa')) {
            addBadge('Ức chế sinh trưởng', 'bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/30');
            addBadge('Kích tạo mầm hoa', 'bg-purple-500/15 text-purple-800 dark:text-purple-300 border-purple-500/30');
        } else if (name.includes('brassin') || fullText.includes('chống sốc') || fullText.includes('giải độc')) {
            addBadge('Chống sốc thời tiết', 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border-emerald-500/30');
            addBadge('Giải độc phân thuốc', 'bg-teal-500/15 text-teal-800 dark:text-teal-300 border-teal-500/30');
        } else if (name.includes('chitosan')) {
            addBadge('Kích kháng sinh học', 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border-emerald-500/30');
            addBadge('Kích thích ra rễ', 'bg-teal-500/15 text-teal-800 dark:text-teal-300 border-teal-500/30');
        } else {
            addBadge('Hấp thu qua lá & rễ', 'bg-teal-500/15 text-teal-800 dark:text-teal-300 border-teal-500/30');
            addBadge('Dưỡng cây khỏe', 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border-emerald-500/30');
        }
        return badges;
    }

    // 2. Phân tích Dược Lý cho Thuốc Trừ Sâu, Rầy, Nấm, Bệnh từ DB Research
    if (research && (research.moa || research.role_type)) {
        // 2.1 Lưu dẫn hai chiều
        if (fullText.includes('hai chiều') || fullText.includes('2 chiều') || fullText.includes('hai chieu') || fullText.includes('2 chieu')) {
            addBadge('Lưu dẫn 2 chiều', 'bg-purple-500/15 text-purple-800 dark:text-purple-300 border-purple-500/30');
        } 
        // 2.2 Lưu dẫn / Nội hấp
        else if (fullText.includes('lưu dẫn') || fullText.includes('nội hấp') || fullText.includes('luu dan') || fullText.includes('noi hap') || research.is_systemic) {
            addBadge('Lưu dẫn / Nội hấp', 'bg-indigo-500/15 text-indigo-800 dark:text-indigo-300 border-indigo-500/30');
        }

        // 2.3 Thấm sâu / Chuyển vị
        if (fullText.includes('thấm sâu') || fullText.includes('tham sau') || fullText.includes('chuyển vị') || fullText.includes('chuyen vi') || fullText.includes('nhu mô lá') || fullText.includes('mesostemic') || fullText.includes('translaminar')) {
            addBadge('Thấm sâu', 'bg-cyan-500/15 text-cyan-800 dark:text-cyan-300 border-cyan-500/30');
        }

        // 2.4 Xông hơi
        if (fullText.includes('xông hơi') || fullText.includes('xong hoi') || fullText.includes('bốc hơi') || fullText.includes('pha hơi')) {
            addBadge('Xông hơi', 'bg-orange-500/15 text-orange-800 dark:text-orange-300 border-orange-500/30');
        }

        // 2.5 Tiếp xúc
        if (fullText.includes('tiếp xúc') || fullText.includes('tiep xuc') || fullText.includes('bảo vệ bề mặt') || fullText.includes('hạ gục')) {
            addBadge('Tiếp xúc', 'bg-rose-500/15 text-rose-800 dark:text-rose-300 border-rose-500/30');
        }

        // 2.6 Vị độc (Chỉ dành cho thuốc trừ sâu có cơ chế vị độc miệng nhai/đường ruột)
        if (fullText.includes('vị độc') || fullText.includes('vi doc') || (fullText.includes('miệng nhai') && !fullText.includes('không phải là thuốc'))) {
            addBadge('Vị độc', 'bg-red-500/15 text-red-800 dark:text-red-300 border-red-500/30');
        }

        // 2.7 Ức chế lột xác / Ung trứng
        if (fullText.includes('lột xác') || fullText.includes('lot xac') || fullText.includes('ung trứng') || fullText.includes('chitin') || fullText.includes('triệt sản')) {
            addBadge('Ức chế lột xác', 'bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/30');
        }

        // 2.8 Hạ gục nhanh
        if (fullText.includes('hạ gục nhanh') || fullText.includes('knockdown')) {
            addBadge('Hạ gục nhanh', 'bg-rose-600/15 text-rose-900 dark:text-rose-200 border-rose-600/30');
        }
    }

    if (badges.length > 0) return badges;

    // 2. Tra cứu từ điển hoạt chất chuyên sâu nếu chưa có DB Research:
    
    // Profenofos: Tiếp xúc + Vị độc + Xông hơi + Thấm sâu
    if (name.includes('profenofos')) {
        return [
            { label: 'Tiếp xúc', color: 'bg-rose-500/15 text-rose-800 dark:text-rose-300 border-rose-500/30' },
            { label: 'Vị độc', color: 'bg-red-500/15 text-red-800 dark:text-red-300 border-red-500/30' },
            { label: 'Xông hơi', color: 'bg-orange-500/15 text-orange-800 dark:text-orange-300 border-orange-500/30' },
            { label: 'Thấm sâu', color: 'bg-cyan-500/15 text-cyan-800 dark:text-cyan-300 border-cyan-500/30' }
        ];
    }

    // Chlorpyrifos / Fenitrothion / Diazinon / Dichlorvos: Tiếp xúc + Vị độc + Xông hơi
    if (['chlorpyrifos', 'fenitrothion', 'diazinon', 'quinalphos', 'fenthion', 'dichlorvos'].some(k => name.includes(k))) {
        return [
            { label: 'Tiếp xúc', color: 'bg-rose-500/15 text-rose-800 dark:text-rose-300 border-rose-500/30' },
            { label: 'Vị độc', color: 'bg-red-500/15 text-red-800 dark:text-red-300 border-red-500/30' },
            { label: 'Xông hơi', color: 'bg-orange-500/15 text-orange-800 dark:text-orange-300 border-orange-500/30' }
        ];
    }

    // Abamectin / Emamectin benzoate: Tiếp xúc + Vị độc + Thấm sâu
    if (['abamectin', 'emamectin'].some(k => name.includes(k))) {
        return [
            { label: 'Tiếp xúc', color: 'bg-rose-500/15 text-rose-800 dark:text-rose-300 border-rose-500/30' },
            { label: 'Vị độc', color: 'bg-red-500/15 text-red-800 dark:text-red-300 border-red-500/30' },
            { label: 'Thấm sâu', color: 'bg-cyan-500/15 text-cyan-800 dark:text-cyan-300 border-cyan-500/30' }
        ];
    }

    // Cúc tổng hợp (Pyrethroid): Lambda-cyhalothrin, Alpha-cypermethrin, Cypermethrin, Deltamethrin...
    if (['cyhalothrin', 'cypermethrin', 'deltamethrin', 'permethrin', 'bifenthrin', 'fenvalerate', 'etofenprox'].some(k => name.includes(k))) {
        return [
            { label: 'Tiếp xúc', color: 'bg-rose-500/15 text-rose-800 dark:text-rose-300 border-rose-500/30' },
            { label: 'Vị độc', color: 'bg-red-500/15 text-red-800 dark:text-red-300 border-red-500/30' },
            { label: 'Hạ gục nhanh', color: 'bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/30' }
        ];
    }

    // Cartap / Fenobucarb / Isoprocarb: Tiếp xúc + Vị độc + Nội hấp nhẹ
    if (['cartap', 'fenobucarb', 'isoprocarb', 'carbosulfan', 'benfuracarb'].some(k => name.includes(k))) {
        return [
            { label: 'Tiếp xúc', color: 'bg-rose-500/15 text-rose-800 dark:text-rose-300 border-rose-500/30' },
            { label: 'Vị độc', color: 'bg-red-500/15 text-red-800 dark:text-red-300 border-red-500/30' },
            { label: 'Lưu dẫn nhẹ', color: 'bg-indigo-500/15 text-indigo-800 dark:text-indigo-300 border-indigo-500/30' }
        ];
    }

    // Lưu dẫn 2 chiều: Spirotetramat, Metalaxyl, Fosetyl-Al
    if (['spirotetramat', 'metalaxyl', 'fosetyl'].some(k => name.includes(k))) {
        return [
            { label: 'Lưu dẫn 2 chiều', color: 'bg-purple-500/15 text-purple-800 dark:text-purple-300 border-purple-500/30' },
            { label: 'Nội hấp mạnh', color: 'bg-indigo-500/15 text-indigo-800 dark:text-indigo-300 border-indigo-500/30' }
        ];
    }

    // Neonicotinoid & Nhóm chích hút: Imidacloprid, Thiamethoxam, Dinotefuran, Clothianidin, Acetamiprid, Sulfoxaflor, Flupyrimin
    if (['imidacloprid', 'thiamethoxam', 'dinotefuran', 'clothianidin', 'acetamiprid', 'sulfoxaflor', 'flupyrimin', 'nitenpyram', 'pymetrozine'].some(k => name.includes(k))) {
        return [
            { label: 'Lưu dẫn / Nội hấp', color: 'bg-indigo-500/15 text-indigo-800 dark:text-indigo-300 border-indigo-500/30' },
            { label: 'Vị độc', color: 'bg-red-500/15 text-red-800 dark:text-red-300 border-red-500/30' },
            { label: 'Tiếp xúc', color: 'bg-rose-500/15 text-rose-800 dark:text-rose-300 border-rose-500/30' }
        ];
    }

    // Thuốc trừ sâu thế hệ mới (Diamide): Chlorantraniliprole, Cyantraniliprole, Flubendiamide
    if (['chlorantraniliprole', 'cyantraniliprole', 'flubendiamide'].some(k => name.includes(k))) {
        return [
            { label: 'Nội hấp lưu dẫn', color: 'bg-indigo-500/15 text-indigo-800 dark:text-indigo-300 border-indigo-500/30' },
            { label: 'Vị độc mạnh', color: 'bg-red-500/15 text-red-800 dark:text-red-300 border-red-500/30' },
            { label: 'Thấm sâu', color: 'bg-cyan-500/15 text-cyan-800 dark:text-cyan-300 border-cyan-500/30' }
        ];
    }

    // Ức chế lột xác & Trừ nhện non: Buprofezin, Lufenuron, Hexythiazox, Spirodiclofen, Pyriproxyfen
    if (['buprofezin', 'lufenuron', 'pyriproxyfen', 'hexythiazox', 'spirodiclofen', 'tebufenozide', 'diafenthiuron'].some(k => name.includes(k))) {
        return [
            { label: 'Ức chế lột xác', color: 'bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/30' },
            { label: 'Ung trứng', color: 'bg-orange-500/15 text-orange-800 dark:text-orange-300 border-orange-500/30' },
            { label: 'Vị độc', color: 'bg-red-500/15 text-red-800 dark:text-red-300 border-red-500/30' }
        ];
    }

    // Thuốc trừ bệnh Nội hấp lưu dẫn: Difenoconazole, Azoxystrobin, Hexaconazole, Tebuconazole, Tricyclazole, Kasugamycin, Isoprothiolane
    if (['difenoconazole', 'azoxystrobin', 'hexaconazole', 'tebuconazole', 'propiconazole', 'tricyclazole', 'kasugamycin', 'isoprothiolane', 'pydiflumetofen', 'fluxapyroxad'].some(k => name.includes(k))) {
        return [
            { label: 'Lưu dẫn / Nội hấp', color: 'bg-indigo-500/15 text-indigo-800 dark:text-indigo-300 border-indigo-500/30' },
            { label: 'Thấm sâu', color: 'bg-cyan-500/15 text-cyan-800 dark:text-cyan-300 border-cyan-500/30' },
            { label: 'Phòng & Trị', color: 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border-emerald-500/30' }
        ];
    }

    // Thuốc trừ nấm tiếp xúc bảo vệ: Mancozeb, Propineb, Chlorothalonil, Copper (Đồng), Sulfur (Lưu huỳnh)
    if (['mancozeb', 'propineb', 'chlorothalonil', 'copper', 'dong', 'sulfur', 'luu huynh', 'zineb', 'captan', 'folpet'].some(k => name.includes(k))) {
        return [
            { label: 'Tiếp xúc', color: 'bg-rose-500/15 text-rose-800 dark:text-rose-300 border-rose-500/30' },
            { label: 'Bảo vệ bề mặt', color: 'bg-teal-500/15 text-teal-800 dark:text-teal-300 border-teal-500/30' },
            { label: 'Bám dính cao', color: 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border-emerald-500/30' }
        ];
    }

    // Trừ cỏ:
    if (['glyphosate', '2,4-d', 'bispyribac', 'penoxsulam', 'haloxyfop', 'cyhalofop', 'fenoxaprop', 'pretilachlor'].some(k => name.includes(k))) {
        return [
            { label: 'Lưu dẫn trừ cỏ', color: 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border-emerald-500/30' },
            { label: 'Nội hấp rễ & lá', color: 'bg-indigo-500/15 text-indigo-800 dark:text-indigo-300 border-indigo-500/30' }
        ];
    }
    if (['glufosinate', 'paraquat', 'oxadiazon'].some(k => name.includes(k))) {
        return [
            { label: 'Tiếp xúc cháy nhanh', color: 'bg-orange-500/15 text-orange-800 dark:text-orange-300 border-orange-500/30' }
        ];
    }

    if (category === 'pgr') {
        return [{ label: 'Hấp thu nhanh qua lá', color: 'bg-teal-500/15 text-teal-800 dark:text-teal-300 border-teal-500/30' }];
    }

    return research?.is_systemic 
        ? [{ label: 'Lưu dẫn / Nội hấp', color: 'bg-indigo-500/15 text-indigo-800 dark:text-indigo-300 border-indigo-500/30' }]
        : [{ label: 'Tiếp xúc', color: 'bg-rose-500/15 text-rose-800 dark:text-rose-300 border-rose-500/30' }, { label: 'Vị độc', color: 'bg-red-500/15 text-red-800 dark:text-red-300 border-red-500/30' }];
}

// Alias backward compatibility
export function getActionTypeConfig(cleanName, category, research) {
    const badges = getActionBadges(cleanName, category, research);
    return badges[0] || { label: 'Tiếp xúc', color: 'bg-rose-500/15 text-rose-800 dark:text-rose-300 border-rose-500/30' };
}

export function getActionTypeTag(cleanName, category, research) {
    const cfg = getActionTypeConfig(cleanName, category, research);
    return cfg?.label || 'Tiếp xúc';
}

/**
 * Thư viện liều lượng và khuyến cáo phối trộn chuẩn nông nghiệp Việt Nam
 */
const DEFAULT_ING_DOSAGES = {
    'mancozeb': {
        dosage: '50-60g / bình 25L (400-500g / phuy 200L)',
        synergies: ['Metalaxyl', 'Difenoconazole', 'Azoxystrobin'],
        note: 'Bám dính siêu hạng, bổ sung vi lượng Kẽm & Mangan giúp lá xanh dày.'
    },
    'profenofos': {
        dosage: '15-25ml / bình 25L (1 chai / 2 phuy 400L)',
        synergies: ['Alpha-cypermethrin', 'Abamectin', 'Emamectin'],
        note: 'Xông hơi cực mạnh, thấm sâu diệt sâu ẩn nấp trong kẽ lá và thân cây.'
    },
    'lambda-cyhalothrin': {
        dosage: '15-20ml / bình 25L (1 chai / 200-400L)',
        synergies: ['Thiamethoxam', 'Imidacloprid', 'Buprofezin'],
        note: 'Hạ gục cực nhanh, xua đuổi côn trùng chích hút.'
    },
    'imidacloprid': {
        dosage: '15-20ml / bình 25L (100-150ml / phuy 200L)',
        synergies: ['Buprofezin', 'Alpha-cypermethrin', 'Cartap'],
        note: 'Lưu dẫn cực mạnh, chuyên trị rầy nâu, bọ trĩ và rệp sáp.'
    },
    'alpha-cypermethrin': {
        dosage: '20-25ml / bình 25L (150-200ml / phuy 200L)',
        synergies: ['Imidacloprid', 'Thiamethoxam', 'Emamectin'],
        note: 'Hạ gục tức thì khi tiếp xúc, nên phối chung với thuốc lưu dẫn để kéo dài hiệu lực.'
    },
    'emamectin benzoate': {
        dosage: '10-15ml / bình 25L (80-100ml / phuy 200L)',
        synergies: ['Lufenuron', 'Spinetoram', 'Chlorantraniliprole'],
        note: 'Dập dịch sâu tơ, sâu đục trái, bọ trĩ; cực mát cây không sượng hoa.'
    },
    'abamectin': {
        dosage: '15-20ml / bình 25L (100-150ml / phuy 200L)',
        synergies: ['Hexythiazox', 'Spirodiclofen', 'Dầu khoáng SK'],
        note: 'Đặc trị nhện đỏ, sâu vẽ bùa, bọ trĩ; tránh phun lúc nắng gắt.'
    },
    'difenoconazole': {
        dosage: '15-20ml / bình 25L (100-150ml / phuy 200L)',
        synergies: ['Azoxystrobin', 'Mancozeb', 'Kasugamycin'],
        note: 'Nội hấp cực mạnh, làm khô vết thán thư, đốm lá trong 24 giờ.'
    },
    'azoxystrobin': {
        dosage: '20-25ml / bình 25L (150-200ml / phuy 200L)',
        synergies: ['Difenoconazole', 'Hexaconazole', 'Metalaxyl'],
        note: 'Dưỡng xanh lá, sáng bông; phối với Difenoconazole tạo cặp đôi diệt nấm hoàn hảo.'
    },
    'metalaxyl': {
        dosage: '25-30g / bình 25L (250-300g / phuy 200L)',
        synergies: ['Mancozeb', 'Dimethomorph', 'Fosetyl-Al'],
        note: 'Lưu dẫn 2 chiều lên ngọn và xuống rễ; đặc trị xì mủ, thối rễ, sương mai.'
    },
    'hexaconazole': {
        dosage: '25-30ml / bình 25L (200-250ml / phuy 200L)',
        synergies: ['Tricyclazole', 'Validamycin', 'Mancozeb'],
        note: 'Đặc trị nấm hồng, khô vằn, rỉ sắt; giúp đứng vết bệnh tức thì.'
    },
    'spinetoram': {
        dosage: '15-20ml / bình 25L (100-150ml / phuy 200L)',
        synergies: ['Lufenuron', 'Thiamethoxam', 'Buprofezin'],
        note: 'Đặc trị bọ trĩ và sâu kháng thuốc; sinh học cực mát bông trái non.'
    },
    'dinotefuran': {
        dosage: '15-20g / bình 25L (100-150g / phuy 200L)',
        synergies: ['Buprofezin', 'Pymetrozine', 'Spinetoram'],
        note: 'Hạ gục rầy nâu, bọ phấn trắng siêu nhanh, chống cháy rầy cấp tốc.'
    },
    'thiamethoxam': {
        dosage: '10-15g / bình 25L (100g / phuy 200L)',
        synergies: ['Spinetoram', 'Emamectin', 'Buprofezin'],
        note: 'Lưu dẫn thần tốc, thấm vào chồi đọt non bảo vệ liên tục 14 ngày.'
    },
    'lufenuron': {
        dosage: '15-20ml / bình 25L (100-150ml / phuy 200L)',
        synergies: ['Spinetoram', 'Emamectin', 'Chlorantraniliprole'],
        note: 'Ức chế lột xác, ung trứng sâu hại; cắt đứt hoàn toàn lứa sâu tiếp theo.'
    },
    'buprofezin': {
        dosage: '25-30g / bình 25L (200g / phuy 200L)',
        synergies: ['Dinotefuran', 'Thiamethoxam', 'Imidacloprid'],
        note: 'Triệt sản rầy cái, ung trứng rầy; phối với thuốc hạ gục để dập tắt dịch rầy.'
    }
};

/**
 * Thân tooltip chỉ hiển thị danh sách tên các hoạt chất theo đúng theme UI
 */
export function ActiveIngredientTooltipBody({ activeIngredient }) {
    const ingredients = useMemo(() => {
        if (!activeIngredient) return [];
        const parts = parseActiveIngredients(activeIngredient);
        return parts.map(getIngredientDetails).filter(Boolean);
    }, [activeIngredient]);

    if (!ingredients.length) {
        return null;
    }

    return (
        <div className="flex flex-col gap-2 p-1 min-w-[200px] text-xs font-sans antialiased select-text">
            {/* Header: Icon Sparkles + HOẠT CHẤT / THÀNH PHẦN */}
            <div className="flex items-center gap-1.5 pb-1 border-b border-[#2d5016]/15 dark:border-emerald-500/20">
                <Sparkles className="w-3.5 h-3.5 text-[#2d5016] dark:text-emerald-400 shrink-0" />
                <span className="font-extrabold text-[11px] tracking-wider text-[#2d5016] dark:text-emerald-400 uppercase">
                    HOẠT CHẤT / THÀNH PHẦN
                </span>
            </div>

            {/* Danh sách Pill tên hoạt chất */}
            <div className="flex flex-wrap gap-1.5 items-center">
                {ingredients.map((item, idx) => (
                    <span
                        key={idx}
                        className="inline-flex items-center px-2.5 py-1 rounded-full bg-[#3d5a2b]/10 dark:bg-emerald-500/15 border border-[#3d5a2b]/25 dark:border-emerald-500/30 text-[#1f3813] dark:text-emerald-200 font-bold text-[12px] leading-tight shadow-2xs"
                    >
                        {item.raw || item.name}
                    </span>
                ))}
            </div>
        </div>
    );
}

/**
 * Wrapper hiển thị children và bung Tooltip qua React Portal
 */
export default function ActiveIngredientTooltip({ activeIngredient, children, className = '' }) {
    const [isOpen, setIsOpen] = useState(false);
    const [coords, setCoords] = useState({ top: 0, left: 0, placement: 'bottom' });
    const targetRef = useRef(null);
    const closeTimeoutRef = useRef(null);

    const updatePosition = () => {
        if (!targetRef.current) return;
        const rect = targetRef.current.getBoundingClientRect();

        const spaceAbove = rect.top;
        const placeTop = spaceAbove >= 180;

        let top = placeTop ? (rect.top - 8) : (rect.bottom + 8);
        let left = rect.left;

        if (left + 260 > window.innerWidth - 16) {
            left = Math.max(16, window.innerWidth - 260 - 16);
        }

        setCoords({
            top,
            left: Math.max(16, left),
            placement: placeTop ? 'top' : 'bottom'
        });
    };

    const handleMouseEnter = () => {
        if (!targetRef.current || !activeIngredient) return;
        clearTimeout(closeTimeoutRef.current);
        updatePosition();
        setIsOpen(true);
    };

    const handleMouseLeave = () => {
        closeTimeoutRef.current = setTimeout(() => {
            setIsOpen(false);
        }, 120);
    };

    const handleTooltipMouseEnter = () => {
        clearTimeout(closeTimeoutRef.current);
    };

    const handleTooltipMouseLeave = () => {
        handleMouseLeave();
    };

    if (!children) {
        return (
            <div className={className}>
                <ActiveIngredientTooltipBody activeIngredient={activeIngredient} />
            </div>
        );
    }

    if (!activeIngredient) {
        return <>{children}</>;
    }

    const tooltipVariants = {
        hidden: {
            opacity: 0,
            scale: 0.92,
            y: coords.placement === 'top' ? 6 : -6,
            filter: "blur(4px)"
        },
        visible: {
            opacity: 1,
            scale: 1,
            y: 0,
            filter: "blur(0px)",
            transition: {
                type: "spring",
                stiffness: 400,
                damping: 24,
                mass: 0.6
            }
        },
        exit: {
            opacity: 0,
            scale: 0.94,
            y: coords.placement === 'top' ? 4 : -4,
            filter: "blur(2px)",
            transition: {
                duration: 0.12,
                ease: "easeIn"
            }
        }
    };

    return (
        <>
            <div
                ref={targetRef}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                className={`inline-flex items-center ${className}`}
            >
                {children}
            </div>

            {typeof document !== 'undefined' && createPortal(
                <AnimatePresence>
                    {isOpen && (
                        <m.div
                            key="active-ingredient-tooltip-popover"
                            variants={tooltipVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            onMouseEnter={handleTooltipMouseEnter}
                            onMouseLeave={handleTooltipMouseLeave}
                            style={{
                                position: 'fixed',
                                top: coords.placement === 'top' ? undefined : `${coords.top}px`,
                                bottom: coords.placement === 'top' ? `${window.innerHeight - coords.top}px` : undefined,
                                left: `${coords.left}px`,
                                zIndex: 999999
                            }}
                            className="bg-[#faf8f3]/95 dark:bg-[#151c14]/95 backdrop-blur-xl border border-[#2d5016]/20 dark:border-emerald-500/25 rounded-2xl p-2.5 shadow-[0_12px_30px_-5px_rgba(45,80,22,0.2)] dark:shadow-[0_12px_30px_-5px_rgba(0,0,0,0.8)] pointer-events-auto"
                        >
                            <ActiveIngredientTooltipBody activeIngredient={activeIngredient} />
                            {coords.placement === 'top' ? (
                                <div className="absolute -bottom-1.5 left-5 w-3 h-3 rotate-45 bg-[#faf8f3] dark:bg-[#151c14] border-r border-b border-[#2d5016]/20 dark:border-emerald-500/25 pointer-events-none" />
                            ) : (
                                <div className="absolute -top-1.5 left-5 w-3 h-3 rotate-45 bg-[#faf8f3] dark:bg-[#151c14] border-l border-t border-[#2d5016]/20 dark:border-emerald-500/25 pointer-events-none" />
                            )}
                        </m.div>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </>
    );
}