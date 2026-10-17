import { loadIcon, addIcon, getIcon } from '@iconify/react';

const STORAGE_CACHE_KEY = 'app_iconify_offline_cache';

// Khôi phục offline cache từ localStorage khi khởi động
export function initIconifyOfflineCache() {
    if (typeof window === 'undefined') return;
    try {
        const raw = localStorage.getItem(STORAGE_CACHE_KEY);
        if (raw) {
            const cache = JSON.parse(raw);
            if (cache && typeof cache === 'object') {
                Object.entries(cache).forEach(([name, data]) => {
                    if (data && data.body) {
                        addIcon(name, data);
                        addIcon(`iconify:${name}`, data);
                    }
                });
            }
        }
    } catch (e) {
        console.warn('[iconify] Error loading offline cache:', e);
    }
}

// Gọi khởi tạo ngay khi module được import
initIconifyOfflineCache();

// Lưu 1 icon vào offline cache
export async function cacheIconPermanently(iconName) {
    if (!iconName || typeof iconName !== 'string') return null;
    const cleanName = iconName.replace(/^iconify:/, '');
    try {
        const iconData = await loadIcon(cleanName);
        if (iconData) {
            addIcon(cleanName, iconData);
            addIcon(`iconify:${cleanName}`, iconData);

            if (typeof window !== 'undefined') {
                const raw = localStorage.getItem(STORAGE_CACHE_KEY);
                const cache = raw ? JSON.parse(raw) : {};
                cache[cleanName] = iconData;
                localStorage.setItem(STORAGE_CACHE_KEY, JSON.stringify(cache));
            }
            return iconData;
        }
    } catch (e) {
        console.warn('[iconify] Error caching icon:', iconName, e);
    }
    return null;
}

// Kiểm tra xem iconName có phải từ Iconify không
export function isIconifyName(name) {
    if (!name || typeof name !== 'string') return false;
    if (name.startsWith('iconify:')) return true;
    // Tên icon dạng prefix:icon-name (VD: solar:cart-bold, flat-color-icons:shop)
    return name.includes(':') && !name.startsWith('duo:');
}

// Chuẩn hóa tên Iconify
export function normalizeIconifyName(name) {
    if (!name || typeof name !== 'string') return '';
    return name.replace(/^iconify:/, '');
}

// Danh sách bộ icon tuyển chọn mẫu hiển thị ngay khi mở tab Iconify
export const FEATURED_ICONIFY_LIST = [
    // Solar Duotone (Sang trọng, cực đẹp cho POS)
    { id: 'solar:cart-large-4-bold-duotone', label: 'Giỏ hàng Solar', category: 'Solar Duotone' },
    { id: 'solar:shop-2-bold-duotone', label: 'Cửa hàng Solar', category: 'Solar Duotone' },
    { id: 'solar:box-minimalistic-bold-duotone', label: 'Kiện hàng Solar', category: 'Solar Duotone' },
    { id: 'solar:card-2-bold-duotone', label: 'Thanh toán thẻ Solar', category: 'Solar Duotone' },
    { id: 'solar:wallet-money-bold-duotone', label: 'Ví tiền Solar', category: 'Solar Duotone' },
    { id: 'solar:bill-check-bold-duotone', label: 'Hóa đơn Solar', category: 'Solar Duotone' },
    { id: 'solar:bell-bing-bold-duotone', label: 'Chuông thông báo Solar', category: 'Solar Duotone' },
    { id: 'solar:user-circle-bold-duotone', label: 'Khách hàng Solar', category: 'Solar Duotone' },
    { id: 'solar:chart-square-bold-duotone', label: 'Báo cáo doanh số Solar', category: 'Solar Duotone' },
    { id: 'solar:delivery-bold-duotone', label: 'Vận chuyển xe Solar', category: 'Solar Duotone' },
    { id: 'solar:settings-bold-duotone', label: 'Cài đặt Solar', category: 'Solar Duotone' },
    { id: 'solar:cup-first-bold-duotone', label: 'Cúp VIP Solar', category: 'Solar Duotone' },
    { id: 'solar:fire-bold-duotone', label: 'Lửa Hot Solar', category: 'Solar Duotone' },
    { id: 'solar:rocket-bold-duotone', label: 'Tên lửa Solar', category: 'Solar Duotone' },
    { id: 'solar:printer-bold-duotone', label: 'Máy in hóa đơn Solar', category: 'Solar Duotone' },
    { id: 'solar:scanner-bold-duotone', label: 'Máy quét Barcode Solar', category: 'Solar Duotone' },

    // Flat Color Icons (Icon màu thực sống động)
    { id: 'flat-color-icons:shop', label: 'Shop nhiều màu', category: 'Flat Color' },
    { id: 'flat-color-icons:sales-performance', label: 'Biểu đồ tăng trưởng màu', category: 'Flat Color' },
    { id: 'flat-color-icons:money-transfer', label: 'Chuyển tiền màu', category: 'Flat Color' },
    { id: 'flat-color-icons:paid', label: 'Đã thanh toán màu', category: 'Flat Color' },
    { id: 'flat-color-icons:shipped', label: 'Xe giao hàng màu', category: 'Flat Color' },
    { id: 'flat-color-icons:package', label: 'Kiện hàng màu', category: 'Flat Color' },
    { id: 'flat-color-icons:print', label: 'Máy in màu', category: 'Flat Color' },
    { id: 'flat-color-icons:rules', label: 'Sổ sách kiểm kê màu', category: 'Flat Color' },
    { id: 'flat-color-icons:vip', label: 'Thẻ VIP màu', category: 'Flat Color' },
    { id: 'flat-color-icons:debt', label: 'Quản lý công nợ màu', category: 'Flat Color' },
    { id: 'flat-color-icons:calculator', label: 'Máy tính tiền màu', category: 'Flat Color' },
    { id: 'flat-color-icons:services', label: 'Cài đặt dịch vụ màu', category: 'Flat Color' },

    // Fluent Emoji (Emoji 3D mượt mà)
    { id: 'fluent-emoji:shopping-cart', label: 'Giỏ hàng 3D', category: '3D Emoji' },
    { id: 'fluent-emoji:money-bag', label: 'Túi tiền 3D', category: '3D Emoji' },
    { id: 'fluent-emoji:package', label: 'Thùng hàng 3D', category: '3D Emoji' },
    { id: 'fluent-emoji:credit-card', label: 'Thẻ ATM 3D', category: '3D Emoji' },
    { id: 'fluent-emoji:receipt', label: 'Hóa đơn 3D', category: '3D Emoji' },
    { id: 'fluent-emoji:sparkles', label: 'Ngôi sao lấp lánh 3D', category: '3D Emoji' },
    { id: 'fluent-emoji:fire', label: 'Ngọn lửa 3D', category: '3D Emoji' },
    { id: 'fluent-emoji:rocket', label: 'Tên lửa 3D', category: '3D Emoji' },

    // Tabler Icons & Material Design (Hiện đại, tối giản)
    { id: 'tabler:building-store', label: 'Cửa hàng Tabler', category: 'Tabler & Material' },
    { id: 'tabler:receipt-tax', label: 'Hóa đơn thuế Tabler', category: 'Tabler & Material' },
    { id: 'tabler:barcode', label: 'Mã vạch Barcode Tabler', category: 'Tabler & Material' },
    { id: 'tabler:truck-delivery', label: 'Giao hàng Tabler', category: 'Tabler & Material' },
    { id: 'mdi:point-of-sale', label: 'Máy tính tiền POS MDI', category: 'Tabler & Material' },
    { id: 'mdi:cash-register', label: 'Ngăn kéo đựng tiền MDI', category: 'Tabler & Material' }
];

// Tìm kiếm trực tiếp qua Iconify Search API
let searchAbortController = null;

export async function searchIconifyApi(query, limit = 50) {
    if (!query || typeof query !== 'string' || !query.trim()) {
        return FEATURED_ICONIFY_LIST.map(item => item.id);
    }

    if (searchAbortController) {
        searchAbortController.abort();
    }
    searchAbortController = new AbortController();

    try {
        const res = await fetch(
            `https://api.iconify.design/search?query=${encodeURIComponent(query.trim())}&limit=${limit}`,
            { signal: searchAbortController.signal }
        );
        if (!res.ok) return [];
        const data = await res.json();
        return Array.isArray(data.icons) ? data.icons : [];
    } catch (e) {
        if (e.name === 'AbortError') return [];
        console.warn('[iconify] Search API error:', e);
        return [];
    }
}
