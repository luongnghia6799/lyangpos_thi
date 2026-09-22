import { normalizeUOM } from '../lib/utils';

export const UNIT_CATEGORIES = [
    {
        id: 'liquid',
        name: 'Dung dịch / Lỏng',
        icon: 'Droplets',
        units: ['Chai', 'Can', 'Lọ', 'Bình', 'Lít', 'Phi', 'Xô', 'Ống', 'Tuýp']
    },
    {
        id: 'solid',
        name: 'Bột / Rắn / Viên',
        icon: 'Leaf',
        units: ['Gói', 'Hộp', 'Bao', 'Túi', 'Kg', 'Gam', 'Viên', 'Vỉ', 'Liều', 'Cái']
    },
    {
        id: 'packaging',
        name: 'Bao bì & Quy đổi lớn',
        icon: 'Boxes',
        units: ['Thùng', 'Lốc', 'Két', 'Kiện', 'Cây', 'Cuộn']
    }
];

export const DEFAULT_COMMON_UNITS = [
    'Chai', 'Gói', 'Hộp', 'Can', 'Kg', 'Bao', 'Viên', 'Vỉ', 'Thùng',
    'Lọ', 'Túi', 'Bình', 'Lít', 'Phi', 'Xô', 'Ống', 'Liều', 'Lốc', 'Cái'
];

/**
 * Tổng hợp danh sách ĐVT duy nhất từ sản phẩm thực tế kết hợp danh mục chuẩn
 */
export const getAvailableUnits = (existingProducts = []) => {
    const fromProducts = (existingProducts || [])
        .flatMap(p => [p?.unit, p?.secondary_unit])
        .filter(Boolean)
        .map(u => normalizeUOM(u));

    const combined = [...new Set([...DEFAULT_COMMON_UNITS, ...fromProducts])];
    return combined.filter(u => typeof u === 'string' && u.trim().length > 0);
};
