import * as LucideIcons from 'lucide-react';

if (typeof window !== 'undefined') {
    window.__LUCIDE_ICONS__ = LucideIcons;
}

export const POPULAR_ICONS = [
    // Điều hướng & Chức năng chính
    { name: 'Home', label: 'Trang chủ', category: 'Điều hướng' },
    { name: 'LayoutDashboard', label: 'Tổng quan', category: 'Điều hướng' },
    { name: 'ShoppingCart', label: 'Bán hàng (POS)', category: 'Bán hàng' },
    { name: 'ShoppingBag', label: 'Giỏ hàng / Đơn hàng', category: 'Bán hàng' },
    { name: 'Store', label: 'Cửa hàng', category: 'Bán hàng' },
    { name: 'Truck', label: 'Nhập hàng / Vận chuyển', category: 'Kho vận' },
    { name: 'Package', label: 'Sản phẩm / Hàng hóa', category: 'Kho vận' },
    { name: 'PackagePlus', label: 'Thêm hàng mới', category: 'Kho vận' },
    { name: 'Warehouse', label: 'Kho bãi / Kiểm kê', category: 'Kho vận' },
    { name: 'Boxes', label: 'Kiện hàng', category: 'Kho vận' },
    { name: 'History', label: 'Lịch sử giao dịch', category: 'Giao dịch' },
    { name: 'Calendar', label: 'Sổ giao dịch / Lịch', category: 'Giao dịch' },
    { name: 'Receipt', label: 'Hóa đơn / Phiếu thu', category: 'Giao dịch' },
    { name: 'FileText', label: 'Báo cáo / Chứng từ', category: 'Giao dịch' },
    { name: 'TrendingUp', label: 'Tăng trưởng / Thống kê', category: 'Báo cáo' },
    { name: 'BarChart2', label: 'Biểu đồ cột', category: 'Báo cáo' },
    { name: 'PieChart', label: 'Biểu đồ tròn', category: 'Báo cáo' },
    { name: 'Users', label: 'Khách hàng / Đối tác', category: 'Đối tác' },
    { name: 'UserCheck', label: 'Khách hàng VIP', category: 'Đối tác' },
    { name: 'UserPlus', label: 'Thêm đối tác', category: 'Đối tác' },
    { name: 'Coins', label: 'Quỹ tiền / Tiền tệ', category: 'Tài chính' },
    { name: 'Landmark', label: 'Ngân hàng / Tài khoản', category: 'Tài chính' },
    { name: 'Wallet', label: 'Ví tiền', category: 'Tài chính' },
    { name: 'CreditCard', label: 'Thanh toán thẻ', category: 'Tài chính' },
    { name: 'Scale', label: 'Kế toán / Cân đo', category: 'Tài chính' },
    { name: 'ArrowLeftRight', label: 'Quy đổi / Luân chuyển', category: 'Kho vận' },
    { name: 'ShieldCheck', label: 'Phân quyền / Bảo mật', category: 'Hệ thống' },
    { name: 'Settings', label: 'Cài đặt hệ thống', category: 'Hệ thống' },
    { name: 'SlidersHorizontal', label: 'Tùy chỉnh cấu hình', category: 'Hệ thống' },
    { name: 'LayoutTemplate', label: 'Mẫu in / Thiết kế', category: 'Tiện ích' },
    { name: 'Calculator', label: 'Máy tính bỏ túi', category: 'Tiện ích' },
    { name: 'Keyboard', label: 'Bàn phím / Luyện gõ', category: 'Tiện ích' },
    { name: 'Gamepad2', label: 'Giải trí / Trò chơi', category: 'Tiện ích' },
    { name: 'QrCode', label: 'Mã QR / Quét mã', category: 'Tiện ích' },
    { name: 'Barcode', label: 'Mã vạch Barcode', category: 'Tiện ích' },
    { name: 'Sparkles', label: 'AI Trợ lý / Cao cấp', category: 'Nâng cao' },
    { name: 'Bot', label: 'Robot AI', category: 'Nâng cao' },
    { name: 'Zap', label: 'Tác vụ nhanh', category: 'Nâng cao' },
    { name: 'Tag', label: 'Thẻ giá / Phân loại', category: 'Bán hàng' },
    { name: 'Tags', label: 'Nhiều phân loại', category: 'Bán hàng' },
    { name: 'Percent', label: 'Chiết khấu / Giảm giá', category: 'Bán hàng' },
    { name: 'BadgePercent', label: 'Khuyến mãi đặc biệt', category: 'Bán hàng' },
    { name: 'Gift', label: 'Quà tặng / Chăm sóc', category: 'Đối tác' },
    { name: 'HeartHandshake', label: 'Tri ân khách hàng', category: 'Đối tác' },
    { name: 'Printer', label: 'Máy in / In hóa đơn', category: 'Hệ thống' },
    { name: 'Save', label: 'Lưu dữ liệu', category: 'Hệ thống' },
    { name: 'Plus', label: 'Thêm mới (+)', category: 'Thao tác' },
    { name: 'Trash2', label: 'Xóa / Thùng rác', category: 'Thao tác' },
    { name: 'Edit', label: 'Chỉnh sửa (Bút chì)', category: 'Thao tác' },
    { name: 'RefreshCw', label: 'Làm mới / Đồng bộ', category: 'Thao tác' },
    { name: 'Search', label: 'Tìm kiếm', category: 'Thao tác' },
    { name: 'Filter', label: 'Bộ lọc danh sách', category: 'Thao tác' },
    { name: 'Download', label: 'Tải về / Xuất Excel', category: 'Thao tác' },
    { name: 'Upload', label: 'Tải lên / Nhập Excel', category: 'Thao tác' },
    { name: 'Check', label: 'Hoàn tất / Đã duyệt', category: 'Thao tác' },
    { name: 'CheckCircle2', label: 'Thành công (Tròn)', category: 'Thao tác' },
    { name: 'AlertCircle', label: 'Cảnh báo', category: 'Hệ thống' },
    { name: 'Clock', label: 'Thời gian / Chờ xử lý', category: 'Giao dịch' },
    { name: 'MapPin', label: 'Địa chỉ / Vị trí', category: 'Đối tác' },
    { name: 'Phone', label: 'Số điện thoại / Hotline', category: 'Đối tác' },
    { name: 'Camera', label: 'Chụp ảnh / Máy ảnh', category: 'Tiện ích' },
    { name: 'Eye', label: 'Xem chi tiết', category: 'Thao tác' },
    { name: 'Lock', label: 'Khóa / Mật mã', category: 'Hệ thống' },
    { name: 'Unlock', label: 'Mở khóa', category: 'Hệ thống' },
    { name: 'Power', label: 'Nguồn / Đăng xuất', category: 'Hệ thống' },
    // Nông nghiệp, vật tư, sinh thái
    { name: 'Sprout', label: 'Mầm cây / Giống', category: 'Nông nghiệp' },
    { name: 'Leaf', label: 'Lá cây / Nông sản', category: 'Nông nghiệp' },
    { name: 'Wheat', label: 'Lúa / Ngũ cốc', category: 'Nông nghiệp' },
    { name: 'Droplets', label: 'Nước / Phân bón lỏng', category: 'Nông nghiệp' },
    { name: 'SprayCan', label: 'Bình xịt / Thuốc BVTV', category: 'Nông nghiệp' },
    { name: 'FlaskConical', label: 'Hóa chất / Thí nghiệm', category: 'Nông nghiệp' },
    { name: 'Bug', label: 'Sâu bọ / Trừ sâu', category: 'Nông nghiệp' },
    { name: 'Sun', label: 'Mặt trời / Thời tiết', category: 'Nông nghiệp' },
    { name: 'Moon', label: 'Mặt trăng / Chế độ đêm', category: 'Hệ thống' },
    { name: 'Flame', label: 'Lửa / Bán chạy Hot', category: 'Bán hàng' },
    { name: 'Star', label: 'Đánh giá / Yêu thích', category: 'Bán hàng' },
    { name: 'Bookmark', label: 'Đánh dấu', category: 'Tiện ích' },
    { name: 'Wrench', label: 'Sửa chữa / Cài đặt', category: 'Hệ thống' },
    { name: 'Cpu', label: 'Bộ vi xử lý / Máy chủ', category: 'Hệ thống' },
    { name: 'HardDrive', label: 'Ổ cứng / Dữ liệu', category: 'Hệ thống' },
    { name: 'Database', label: 'Cơ sở dữ liệu', category: 'Hệ thống' },
    { name: 'Wifi', label: 'Mạng LAN / Wifi', category: 'Hệ thống' }
];

const STORAGE_KEY = 'app_custom_icons';

export const getStoredCustomIcons = () => {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            const parsed = JSON.parse(saved);
            if (typeof parsed === 'object' && parsed !== null) return parsed;
        }
    } catch (e) {
        console.error('Error reading app_custom_icons:', e);
    }
    return {};
};

const CLIENT_ID = Math.random().toString(36).substring(2);

export const setStoredCustomIcon = (iconId, iconData) => {
    try {
        const current = getStoredCustomIcons();
        const baseName = iconId.replace(/^icon\./, '');
        if (!iconData) {
            delete current[iconId];
            delete current[baseName];
            delete current[`icon.${baseName}`];
        } else {
            current[iconId] = iconData;
            if (!iconId.startsWith('icon.') && !iconId.startsWith('nav.') && !iconId.startsWith('pos.')) {
                current[`icon.${iconId}`] = iconData;
            }
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
        window.dispatchEvent(new CustomEvent('app_icon_changed', { detail: { iconId, iconData } }));
        window.dispatchEvent(new Event('storage'));
        try {
            const chan = new BroadcastChannel('pos_data_sync');
            chan.postMessage({ type: 'APP_ICON_UPDATED', iconId, iconData, clientId: CLIENT_ID });
        } catch (e) {}
        return true;
    } catch (e) {
        console.error('Error saving app_custom_icons:', e);
        return false;
    }
};

export const resetStoredCustomIcons = () => {
    try {
        localStorage.removeItem(STORAGE_KEY);
        window.dispatchEvent(new CustomEvent('app_icon_changed', { detail: { reset: true } }));
        window.dispatchEvent(new Event('storage'));
        try {
            const chan = new BroadcastChannel('pos_data_sync');
            chan.postMessage({ type: 'APP_ICON_RESET', clientId: CLIENT_ID });
        } catch (e) {}
        return true;
    } catch (e) {
        console.error('Error resetting app_custom_icons:', e);
        return false;
    }
};


export const getLucideIconComponent = (name) => {
    if (!name) return null;
    return LucideIcons[name] || (typeof window !== 'undefined' && window.__LUCIDE_ICONS__ ? window.__LUCIDE_ICONS__[name] : null) || null;
};

// Lazy getter tránh lỗi Circular TDZ (Temporal Dead Zone)
let cachedAllIcons = null;

export const getAllLucideIcons = () => {
    if (cachedAllIcons && cachedAllIcons.length > 100) return cachedAllIcons;

    const list = [...POPULAR_ICONS];
    const seen = new Set(POPULAR_ICONS.map(i => i.name));

    try {
        const iconsSource = (typeof window !== 'undefined' && window.__LUCIDE_ICONS__) || LucideIcons;
        if (iconsSource) {
            Object.keys(iconsSource).forEach(key => {
                if (
                    /^[A-Z]/.test(key) &&
                    key !== 'Icon' &&
                    key !== 'Lucide' &&
                    key !== 'LucideIcon' &&
                    !key.endsWith('Icon')
                ) {
                    if (!seen.has(key)) {
                        seen.add(key);
                        const friendlyLabel = key.replace(/([A-Z])/g, ' $1').trim();
                        list.push({
                            name: key,
                            label: friendlyLabel,
                            category: 'Kho Icon Khác'
                        });
                    }
                }
            });
        }
    } catch (e) {
        console.warn('Lazy loading lucide icons:', e);
    }

    if (list.length > POPULAR_ICONS.length) {
        cachedAllIcons = list;
    }
    return list;
};

export const ALL_LUCIDE_ICONS = new Proxy([], {
    get(target, prop) {
        const full = getAllLucideIcons();
        if (prop === 'length') return full.length;
        if (prop === Symbol.iterator) return full[Symbol.iterator].bind(full);
        if (typeof full[prop] === 'function') return full[prop].bind(full);
        return full[prop];
    }
});
