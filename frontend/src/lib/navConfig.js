import {
    Home,
    ShoppingCart,
    Truck,
    History as HistoryIcon,
    Calendar,
    Warehouse,
    ArrowLeftRight,
    TrendingUp,
    FileText,
    Download,
    Settings as SettingsIcon,
    Landmark,
    Package,
    Users,
    Coins,
    ShieldCheck,
    LayoutTemplate,
    Calculator,
    Gamepad2,
    QrCode,
    ShoppingBag,
    Sparkles,
    Store,
    Zap,
    Scale,
    Keyboard
} from 'lucide-react';

export const DEFAULT_NAV_SECTIONS = [
    {
        id: 'main',
        label: 'Chức năng chính',
        items: [
            { id: 'dashboard', path: '/', label: 'Tổng quan', icon: Home, roles: ['admin'], desc: 'Bảng tin thống kê doanh thu & lợi nhuận' },
            { id: 'pos', path: '/pos', label: 'Bán hàng (POS)', icon: ShoppingCart, roles: ['admin', 'accountant', 'user'], desc: 'Màn hình thu ngân & tạo hóa đơn bán lẻ' },
        ]
    },
    {
        id: 'transactions',
        label: 'Giao dịch',
        icon: ShoppingBag,
        roles: ['admin', 'accountant', 'user'],
        items: [
            { id: 'purchase', path: '/purchase', label: 'Nhập hàng', icon: Truck, roles: ['admin', 'accountant', 'user'], desc: 'Quản lý phiếu nhập kho & hóa đơn nhà cung cấp' },
            { id: 'history', path: '/history', label: 'Lịch sử', icon: HistoryIcon, roles: ['admin', 'accountant', 'user'], desc: 'Danh sách và chi tiết đơn hàng đã xuất' },
            { id: 'summary', path: '/summary', label: 'Sổ Giao Dịch', icon: Calendar, roles: ['admin', 'accountant', 'user'], desc: 'Tổng kết dòng tiền theo ngày, ca làm việc' },
            { id: 'inventory', path: '/inventory', label: 'Kiểm kê kho', icon: Warehouse, roles: ['admin', 'accountant', 'user'], desc: 'Kiểm tra tồn thực tế & cân bằng kho' },
            { id: 'conversion', path: '/inventory/conversion', label: 'Xẻ lẻ & Quy đổi', icon: ArrowLeftRight, roles: ['admin', 'accountant', 'user'], desc: 'Chuyển đổi bao/thùng sang kg/gói lẻ' },
        ]
    },
    {
        id: 'management',
        label: 'Quản lý',
        icon: SettingsIcon,
        roles: ['admin', 'accountant', 'user'],
        items: [
            { id: 'products', path: '/products', label: 'Danh mục hàng', icon: Package, roles: ['admin', 'accountant', 'user'], desc: 'Quản lý sản phẩm, giá bán, tồn kho, mã vạch' },
            { id: 'partners', path: '/partners', label: 'Đối tác', icon: Users, roles: ['admin', 'accountant', 'user'], desc: 'Khách hàng, nhà cung cấp & công nợ' },
            { id: 'partner_profile', path: '/partner-profile', label: 'Hồ sơ đối tác', icon: Users, roles: ['admin', 'accountant', 'user'], desc: 'Chi tiết lịch sử mua hàng, công nợ từng đối tác' },
            { id: 'vouchers', path: '/vouchers', label: 'Quỹ tiền', icon: Coins, roles: ['admin', 'accountant', 'user'], desc: 'Sổ quỹ thu - chi, tạm ứng & quản lý ví tiền' },
            { id: 'banking', path: '/banking', label: 'Tài khoản ngân hàng', icon: Landmark, roles: ['admin', 'accountant', 'user'], desc: 'Quản lý số tài khoản và quét mã VietQR' },
            { id: 'roles', path: '/roles', label: 'Phân quyền', icon: ShieldCheck, roles: ['admin', 'accountant', 'user'], desc: 'Thiết lập quyền hạn nhân viên & tài khoản' },
            { id: 'invoice_designer', path: '/invoice-designer', label: 'Thiết kế hóa đơn', icon: LayoutTemplate, roles: ['admin', 'accountant', 'user'], desc: 'Tùy chỉnh mẫu in hóa đơn khổ A4, K80' },
            { id: 'customer_care', path: '/customer-care', label: 'Chăm sóc & Quà tặng', icon: Package, roles: ['admin', 'accountant', 'user'], desc: 'Chương trình quà tặng, khuyến mãi & tích điểm' },
        ]
    },
    {
        id: 'reports',
        label: 'Báo cáo',
        icon: FileText,
        roles: ['admin'],
        items: [
            { id: 'analysis', path: '/analysis', label: 'Tổng Hợp', icon: TrendingUp, roles: ['admin'], desc: 'Phân tích hiệu suất bán hàng & xu hướng' },
            { id: 'reports_page', path: '/reports', label: 'Báo cáo', icon: FileText, roles: ['admin'], desc: 'Báo cáo doanh số, mặt hàng bán chạy' },
        ]
    },
    {
        id: 'accounting',
        label: 'Kế toán',
        icon: Scale,
        isAccounting: true,
        roles: ['admin', 'accountant', 'user'],
        items: [
            { id: 'accounting_inventory', path: '/accounting/inventory', label: 'Kho kế toán', icon: Scale, roles: ['admin', 'accountant', 'user'], desc: 'Đối soát hàng hóa & giá vốn kế toán' },
        ]
    },
    {
        id: 'utilities',
        label: 'Tiện ích & Mở rộng',
        items: [
            { id: 'calculator', path: '/calculator', label: 'Máy tính', icon: Calculator, roles: ['admin', 'accountant', 'user'], desc: 'Bảng tính công thức phân bón & cộng nhẩm' },
            { id: 'typing', path: '/typing', label: 'Luyện gõ phím', icon: Keyboard, roles: ['admin', 'accountant', 'user'], desc: 'Luyện gõ tiếng Việt, từ vựng POS & giải trí' },
            { id: 'gaming', path: '/gaming', label: 'Giải trí', icon: Gamepad2, roles: ['admin', 'accountant', 'user'], desc: 'Trò chơi mini giải tỏa căng thẳng' },
            { id: 'barcodes', path: '/barcodes', label: 'In Mã Vạch', icon: QrCode, roles: ['admin', 'accountant', 'user'], desc: 'Thiết kế & in tem mã vạch sản phẩm' },
        ]
    }
];

export const LITE_NAV_ITEMS = [
    { id: 'lite_dashboard', path: '/', label: 'Tổng quan Lite', icon: Home, roles: ['admin', 'accountant', 'user'], desc: 'Trang chủ giao diện thu gọn' },
    { id: 'lite_pos', path: '/pos', label: 'Bán hàng Lite', icon: ShoppingCart, roles: ['admin', 'accountant', 'user'], desc: 'Giao diện bán hàng tối giản' },
    { id: 'lite_purchase', path: '/purchase', label: 'Nhập hàng Lite', icon: Truck, roles: ['admin', 'accountant', 'user'], desc: 'Nhập kho nhanh' },
    { id: 'lite_history', path: '/history', label: 'Lịch sử Lite', icon: HistoryIcon, roles: ['admin', 'accountant', 'user'], desc: 'Tra cứu đơn hàng' },
    { id: 'lite_summary', path: '/summary', label: 'Tổng hợp Lite', icon: TrendingUp, roles: ['admin', 'accountant', 'user'], desc: 'Báo cáo tổng kết' },
];

export const NAV_PRESETS = [
    {
        id: 'all',
        label: 'Đầy đủ tính năng',
        desc: 'Hiển thị tất cả các trang trên thanh Sidebar (Mặc định)',
        icon: Sparkles,
        hiddenPaths: []
    },
    {
        id: 'retail',
        label: 'Bán lẻ & Thu ngân',
        desc: 'Chỉ hiển thị các chức năng bán lẻ hàng ngày, ẩn kế toán & tiện ích nâng cao',
        icon: Store,
        hiddenPaths: [
            '/inventory/conversion',
            '/analysis',
            '/accounting/inventory',
            '/roles',
            '/invoice-designer',
            '/customer-care',
            '/calculator',
            '/gaming',
            '/barcodes'
        ]
    },
    {
        id: 'minimal',
        label: 'Tối giản nhất (Chỉ POS & Kho)',
        desc: 'Tập trung tuyệt đối vào Bán hàng, Nhập hàng và Danh mục sản phẩm',
        icon: Zap,
        hiddenPaths: [
            '/',
            '/summary',
            '/inventory/conversion',
            '/analysis',
            '/reports',
            '/accounting/inventory',
            '/partner-profile',
            '/vouchers',
            '/banking',
            '/roles',
            '/invoice-designer',
            '/customer-care',
            '/calculator',
            '/gaming',
            '/barcodes'
        ]
    }
];

export const getStoredHiddenPaths = () => {
    try {
        const saved = localStorage.getItem('sidebar_hidden_items');
        if (saved) {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed)) return parsed;
        }
    } catch (e) {
        console.error('Error reading sidebar_hidden_items:', e);
    }
    return [];
};

export const setStoredHiddenPaths = (paths) => {
    try {
        const cleanPaths = Array.isArray(paths) ? paths : [];
        localStorage.setItem('sidebar_hidden_items', JSON.stringify(cleanPaths));
        window.dispatchEvent(new Event('sidebar_visibility_changed'));
        window.dispatchEvent(new Event('storage'));
        return true;
    } catch (e) {
        console.error('Error saving sidebar_hidden_items:', e);
        return false;
    }
};
