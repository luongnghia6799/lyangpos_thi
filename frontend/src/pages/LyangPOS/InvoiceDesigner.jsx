import axios from 'axios';
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Save, Trash2, Plus, ArrowLeft, Image as ImageIcon,
    Type, Layout, Palette, Phone, MapPin, Globe, CreditCard,
    CheckCircle2, AlertCircle, FileText, Eye, Settings as SettingsIcon,
    ArrowRight, ChevronLeft, ChevronRight, Upload, Download, RefreshCw,
    Table as TableIcon, Undo, Clipboard, Monitor, Printer, Check, Star,
    Bold, Italic, AlignLeft, AlignCenter, AlignRight, Sprout, Wheat, Droplets, Leaf, ChevronDown, Home
} from 'lucide-react';
import { cn, formatNumber } from '../../lib/utils';
import Toast from '../../components/Toast';
import { m, AnimatePresence } from 'framer-motion';
import PrintTemplate from '../../components/PrintTemplate';
import ConfirmModal from '../../components/ConfirmModal';
import { DEFAULT_SETTINGS } from '../../lib/settings';

const MODULES = [
    { id: 'Sale', label: 'Bán hàng' },
    { id: 'Purchase', label: 'Nhập hàng' },
    { id: 'PartnerLedger', label: 'Sổ nợ đối tác' },
    { id: 'Report', label: 'Báo cáo' }
];

const PAPER_SIZES = [
    { id: 'A4', label: 'A4 (210mm)' },
    { id: 'A5', label: 'A5 (148mm)' },
    { id: 'A6', label: 'A6 (105mm)' },
    { id: 'K80', label: 'In nhiệt 80mm' },
    { id: 'K58', label: 'In nhiệt 58mm' }
];

function ColorPicker({ label, value, onChange }) {
    return (
        <div className="space-y-1.5">
            <label className="text-[10px] font-black text-[#8b6f47] dark:text-[#d4a574]/60 uppercase tracking-[0.2em] ml-1">{label}</label>
            <div className="flex items-center gap-3 p-1.5 bg-transparent dark:bg-slate-800/10 border border-border rounded-2xl focus-within:border-[#4a7c59] transition-all">
                <div
                    className="w-10 h-10 rounded-xl border border-border flex-shrink-0 relative overflow-hidden group"
                    style={{ backgroundColor: value || '#000000' }}
                >
                    <input
                        type="color"
                        value={value || '#000000'}
                        onChange={(e) => onChange(e.target.value)}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full scale-150"
                    />
                </div>
                <input
                    type="text"
                    value={value || '#000000'}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder="#HEX"
                    className="flex-1 bg-transparent border-none px-2 py-2 text-xs font-black font-mono dark:text-white outline-none uppercase tracking-widest text-[#8b6f47]"
                />
            </div>
        </div>
    );
}

const DEFAULT_INVOICE_CONFIG = {
    ...(DEFAULT_SETTINGS || {}),
    invoice_line_spacing: '1.4',
    invoice_column_spacing: '10',
    invoice_orientation: 'portrait', // portrait, landscape
    invoice_title_size: '22',
    invoice_table_header_size: '12',
    invoice_table_content_size: '12',
    invoice_total_section_size: '14',
    invoice_total_balance_size: '18',
    invoice_show_logo: 'true',
    invoice_show_shop_name: 'true',
    invoice_show_address: 'true',
    invoice_show_phone: 'true',
    invoice_show_thank_you: 'true',
    invoice_thank_you_message: 'Cảm ơn Quý Khách & Hẹn Gặp Lại!',
    invoice_show_id: 'true',
    invoice_show_date: 'true',
    invoice_show_time: 'true',
    invoice_show_customer_info: 'true',
    invoice_hide_customer_id: 'false',
    invoice_show_table: 'true',
    invoice_show_summary: 'true',
    invoice_show_signatures: 'true',
    invoice_show_col_stt: 'true',
    invoice_show_col_name: 'true',
    invoice_show_col_unit_secondary: 'true',
    invoice_show_col_qty: 'true',
    invoice_show_col_price: 'true',
    invoice_show_col_total: 'true',
    invoice_show_total_items: 'true',
    invoice_show_total_qty: 'true',
    invoice_show_old_debt: 'true',
    invoice_show_bank_info: 'true',
    invoice_show_paid: 'true',
    invoice_show_balance: 'true',
    shop_bank: '',
    shop_bank_account: '',
    shop_bank_user: '',
    invoice_header_spacing: '10',
    invoice_custom_font_url: '',
    invoice_use_default_margins: 'false',
    // New Table Styling
    invoice_table_border: 'true',
    invoice_table_border_rows: 'true',
    invoice_table_border_cols: 'true',
    invoice_table_border_thickness: 'thin',
    invoice_table_border_style: 'solid',
    invoice_table_header_bg_enabled: 'true',
    invoice_table_header_bg_color: '#f2f2f2',
    invoice_table_zebra_stripe: 'true',
    invoice_table_zebra_color: '#f9fafb',
    invoice_table_two_columns: 'false',
    // Expanded Color Settings
    invoice_color_store_info: '#333333',
    invoice_color_title: '#000000',
    invoice_color_customer_info: '#000000',
    invoice_color_table_header: '#000000',
    invoice_color_table_body: '#000000',
    invoice_color_total_label: '#000000',
    invoice_color_total_value: '#000000',
    invoice_color_notes: '#555555',
    invoice_color_footer: '#444444',
    // Total Line Styling
    invoice_total_line_size: '18',
    invoice_total_line_bold: 'true',
    invoice_total_line_italic: 'false',
    invoice_total_line_margin_top: '10',
    invoice_total_line_margin_bottom: '10',
    // Default Margins (mm)
    invoice_margin_top: '10',
    invoice_margin_bottom: '10',
    invoice_margin_left: '10',

    invoice_margin_right: '10',
    // Report Defaults
    invoice_show_col_code: 'true',
    invoice_show_col_date: 'true',
    invoice_show_col_method: 'true',
    invoice_col_code: '80',
    invoice_col_date: '80',
    invoice_col_method: '80',
    invoice_col_ledger_increase: '90',
    invoice_col_ledger_decrease: '90',
    invoice_col_ledger_balance: '100',
    invoice_col_content: 'auto',
    invoice_hide_old_debt_on_cash: 'false',
    invoice_show_cash_given: 'true',
    invoice_show_change: 'true',
    invoice_free_layout: 'false',
    pos_logo_x: '20',
    pos_logo_y: '20',
    pos_shop_name_x: '100',
    pos_shop_name_y: '20',
    pos_shop_info_x: '100',
    pos_shop_info_y: '50',
    pos_title_x: '500',
    pos_title_y: '20',
    pos_customer_info_x: '20',
    pos_customer_info_y: '150',
    pos_customer_name_x: '20',
    pos_customer_name_y: '150',
    pos_customer_phone_x: '20',
    pos_customer_phone_y: '168',
    pos_customer_address_x: '20',
    pos_customer_address_y: '186',
    pos_invoice_meta_x: '500',
    pos_invoice_meta_y: '150',
    pos_table_x: '20',
    pos_table_y: '230',
    pos_notes_x: '20',
    pos_notes_y: '500',
    pos_summary_x: '450',
    pos_summary_y: '500',
    pos_signatures_x: '20',
    pos_signatures_y: '650',
    pos_thank_you_x: '20',
    pos_thank_you_y: '750',
    pos_width_logo: '150',
    pos_width_shop_name: '300',
    pos_width_shop_info: '300',
    pos_width_title: '250',
    pos_width_customer_info: '450',
    pos_width_customer_name: '450',
    pos_width_customer_phone: '450',
    pos_width_customer_address: '450',
    pos_width_invoice_meta: '250',
    pos_width_table: '750',
    pos_width_notes: '350',
    pos_width_summary: '350',
    pos_width_signatures: '750',
    pos_width_thank_you: '750',
    invoice_preview_bg_image: 'none',
    invoice_table_name_nowrap: 'false',
    invoice_show_title: 'true',
    invoice_repeat_header_on_later_pages: 'true',
    invoice_show_page_number: 'false',
    invoice_page_number_position: 'bottom-right',
    invoice_page_number_format: 'page_total',
    invoice_page_number_size: '10',
    invoice_page_number_color: '#64748b'
};

// Internal component, wrapped below

// Custom fetch wrapper using axios to fix Tauri IP issues
const fetchWithAxios = async (url, options = {}) => {
    try {
        let data = options.body;
        if (typeof data === 'string' && options.headers && options.headers['Content-Type'] === 'application/json') {
            data = JSON.parse(data);
        }
        const res = await axios({
            url,
            method: options.method || 'GET',
            headers: options.headers,
            data: data,
            validateStatus: () => true
        });
        return {
            ok: res.status >= 200 && res.status < 300,
            status: res.status,
            json: async () => res.data,
            text: async () => (typeof res.data === 'string' ? res.data : JSON.stringify(res.data))
        };
    } catch (e) {
        throw e;
    }
};

const InvoiceDesigner = () => {
    const navigate = useNavigate();
    const [selectedModule, setSelectedModule] = useState('Sale');
    const [templates, setTemplates] = useState([]);
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [settings, setSettings] = useState(DEFAULT_INVOICE_CONFIG);
    const [previewItemsCount, setPreviewItemsCount] = useState(3);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState(null);
    const [confirm, setConfirm] = useState(null); // { title, message, onConfirm, type }
    const [activeTab, setActiveTab] = useState('components'); // content, layout, fonts, table
    const [fonts, setFonts] = useState([]);
    const [zoomScale, setZoomScale] = useState(100);

    // Generate @font-face for all custom fonts
    const customFontsStyle = (
        <style>
            {Array.isArray(fonts) && fonts.map(font => {
                const name = font.split('.')[0];
                return `@font-face { font-family: '${name}'; src: url('/uploads/fonts/${font}'); }`;
            }).join('\n')}
        </style>
    );

    // Preview data
    const previewData = selectedModule === 'PartnerLedger' ? {
        id: 'PL-001',
        date: new Date().toISOString(),
        partner_name: 'Khách hàng Mẫu',
        partner_id: 88,
        partner: {
            id: 88,
            name: 'Khách hàng Mẫu',
            phone: '0901 234 567',
            address: '123 Đường ABC, Quận XYZ, TP.HCM'
        },
        type: 'PartnerLedger',
        details: [
            {
                date: new Date(Date.now() - 86400000 * 2).toISOString(),
                type: 'Order',
                ref_id: 'DH-1001',
                desc: 'Hóa đơn bán Rau Củ',
                increase: 1250000,
                decrease: 0,
                running_balance: 1250000,
                items: [
                    { product_name: 'Bắp Cải', quantity: 10, unit_price: 25000, total_price: 250000 },
                    { product_name: 'Cà Rốt', quantity: 20, unit_price: 50000, total_price: 1000000 }
                ]
            },
            {
                date: new Date(Date.now() - 86400000 * 1).toISOString(),
                type: 'Receipt',
                ref_id: 'PT-5001',
                desc: 'Khách thanh toán mẻ rau',
                increase: 0,
                decrease: 1000000,
                running_balance: 250000,
                items: []
            }
        ],
        total_amount: 1850000,
        amount_paid: 1000000,
        old_debt: 250000,
        note: 'Sổ nợ chi tiết giao dịch'
    } : selectedModule === 'Report' ? {
        id: 'RPT-001',
        date: new Date().toISOString(),
        partner_name: 'Khách hàng Mẫu',
        partner_id: 88,
        partner: {
            id: 88,
            name: 'Khách hàng Mẫu',
            phone: '0901 234 567',
            address: '123 Đường ABC, Quận XYZ, TP.HCM'
        },
        type: 'Report',
        details: Array.from({ length: previewItemsCount }, (_, i) => ({
            id: `ORD-00${i + 1}`,
            display_id: `DH-00${i + 1}`,
            date: new Date(Date.now() - i * 86400000).toISOString(),
            payment_method: i % 3 === 0 ? 'Debt' : 'Cash',
            total_amount: (Math.floor(Math.random() * 50) + 1) * 100000,
        })),
        total_amount: 5500000,
        amount_paid: 2000000,
        old_debt: 1000000,
        note: 'Báo cáo chi tiết công nợ'
    } : {
        id: '12345',
        date: new Date().toISOString(),
        partner_name: 'Khách hàng Mẫu',
        partner_id: 88,
        partner: {
            id: 88,
            name: 'Khách hàng Mẫu',
            phone: '0901 234 567',
            address: '123 Đường ABC, Quận XYZ, TP.HCM'
        },
        details: Array.from({ length: previewItemsCount }, (_, i) => ({
            product_name: `Sản phẩm mẫu ${i + 1}${i === 2 ? ' có tên rất dài để kiểm tra việc xuống dòng trong bảng hóa đơn' : ''}`,
            secondary_unit: i % 2 === 0 ? 'Thùng' : 'Hộp',
            quantity: Math.floor(Math.random() * 20) + 1,
            price: (Math.floor(Math.random() * 50) + 1) * 10000,
            unit: i % 2 === 0 ? 'Chai' : 'Cái',
            multiplier: i % 2 === 0 ? 24 : 10
        })),
        total_amount: 1850000,
        cost_price: 80000,
        amount_paid: 1000000,
        old_debt: 250000,
        note: 'Ghi chú mẫu cho hóa đơn',
        type: selectedModule === 'Purchase' ? 'Purchase' : 'Sale'
    };

    useEffect(() => {
        fetchTemplates();
        fetchFonts();
    }, [selectedModule]);

    const fetchTemplates = async (targetId = null) => {
        setLoading(true);
        try {
            const res = await fetchWithAxios(`/api/print-templates?module=${selectedModule}`);
            const data = await res.json();

            if (Array.isArray(data)) {
                setTemplates(data);
                if (data.length > 0) {
                    let candidate = null;

                    // 1. Try explicit target (from save)
                    if (targetId) {
                        candidate = data.find(t => t.id === targetId);
                    }

                    // 2. Try localStorage (from previous session)
                    if (!candidate) {
                        const lastId = localStorage.getItem(`last_template_${selectedModule}`);
                        if (lastId) {
                            candidate = data.find(t => t.id === parseInt(lastId));
                        }
                    }

                    // 3. Fallback to Default or First
                    if (!candidate) {
                        candidate = data.find(t => t.is_default) || data[0];
                    }

                    if (candidate) {
                        selectTemplate(candidate);
                    } else {
                        // If no template found, clear selection and reset settings
                        setSelectedTemplate(null);
                        setSettings(DEFAULT_INVOICE_CONFIG);
                    }
                } else {
                    setSelectedTemplate(null);
                    setSettings(DEFAULT_INVOICE_CONFIG);
                }
            } else {
                console.warn("API returned non-array for templates:", data);
                setTemplates([]);
                setSelectedTemplate(null);
                setSettings(DEFAULT_INVOICE_CONFIG);
            }
        } catch (err) {
            console.error("Error fetching templates", err);
            setTemplates([]);
            setSelectedTemplate(null);
            setSettings(DEFAULT_INVOICE_CONFIG);
            setToast({ message: "Lỗi khi tải mẫu in!", type: "error" });
        } finally {
            setLoading(false);
        }
    };

    const fetchFonts = async () => {
        try {
            const res = await fetchWithAxios('/api/fonts');
            const data = await res.json();
            if (Array.isArray(data)) {
                setFonts(data);
            } else {
                console.warn("API returned non-array for fonts:", data);
                setFonts([]);
            }
        } catch (err) {
            console.error("Error fetching fonts", err);
            setFonts([]);
            setToast({ message: "Lỗi khi tải font chữ!", type: "error" });
        }
    };

    const selectTemplate = (template) => {
        setSelectedTemplate(template);
        if (template?.id) {
            localStorage.setItem(`last_template_${selectedModule}`, template.id);
        }

        try {
            let config = template.config;
            if (typeof config === 'string') {
                try {
                    config = JSON.parse(config);
                } catch (e) {
                    console.error("Invalid JSON config", e);
                    config = {};
                }
            }
            // Merge with default settings to ensure all keys are present
            setSettings({ ...DEFAULT_INVOICE_CONFIG, ...(config || {}) });
        } catch (e) {
            console.error("Error setting template", e);
            setSettings({ ...DEFAULT_INVOICE_CONFIG });
            setToast({ message: "Lỗi khi tải cấu hình mẫu!", type: "error" });
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const body = {
                name: selectedTemplate?.name || `Mẫu ${selectedModule} mới`,
                module: selectedModule,
                config: settings,
                is_default: selectedTemplate?.is_default || false
            };

            let res;
            if (selectedTemplate?.id) {
                res = await fetchWithAxios(`/api/print-templates/${selectedTemplate.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(body)
                });
            } else {
                res = await fetchWithAxios('/api/print-templates', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(body)
                });
            }

            if (res.ok) {
                const savedData = await res.json();

                // Manually update the list so we don't have to wait for fetch
                setTemplates(prev => {
                    const existingIdx = prev.findIndex(t => t.id === savedData.id);
                    if (existingIdx >= 0) {
                        const newArr = [...prev];
                        newArr[existingIdx] = savedData;
                        return newArr;
                    } else {
                        return [...prev, savedData];
                    }
                });

                // Select it directly.
                selectTemplate(savedData);

                setToast({ message: "Đã lưu thiết kế thành công!", type: "success" });
                
                // Auto-sync with POS tabs
                const syncChannel = new BroadcastChannel('pos_data_sync');
                syncChannel.postMessage({ type: 'SETTINGS_UPDATED' });
                syncChannel.close();
            } else {
                const errText = await res.text();
                console.error("Save failed with status:", res.status, errText);
                setToast({ message: `Lỗi khi lưu mẫu in (${res.status}): ${errText}`, type: "error" });
            }

        } catch (err) {
            console.error("Save error:", err);
            setToast({ message: "Đã xảy ra lỗi khi lưu: " + err.message, type: "error" });
        } finally {
            setSaving(false);
        }
    };

    const updateAllTemplatesShopInfo = () => {
        setConfirm({
            title: "Đồng bộ thông tin shop",
            message: "Hành động này sẽ cập nhật Tên Shop, Địa chỉ, SĐT và STK ngân hàng từ Cài Đặt Hệ Thống cho TẤT CẢ các mẫu in (Bán hàng, Nhập hàng, Phiếu Chi...). Tiếp tục?",
            onConfirm: async () => {
                setSaving(true);
                try {
                    // 1. Lấy thông tin shop từ Cài Đặt Hệ Thống
                    const settingsRes = await fetchWithAxios('/api/settings');
                    const globalSettings = await settingsRes.json();

                    if (!globalSettings.shop_name) {
                        setToast({ message: "Chưa có thông tin shop trong Cài đặt!", type: "info" });
                        setConfirm(null);
                        setSaving(false);
                        return;
                    }

                    // 2. Lấy toàn bộ danh sách mẫu in
                    const resAll = await fetchWithAxios('/api/print-templates');
                    const allTemplates = await resAll.json();

                    // 3. Cập nhật từng mẫu
                    const updatePromises = allTemplates.map(async (template) => {
                        let currentConfig = template.config;
                        if (typeof currentConfig === 'string') {
                            try { currentConfig = JSON.parse(currentConfig); } catch (e) { currentConfig = {}; }
                        }

                        const updatedConfig = {
                            ...(currentConfig || {}),
                            shop_name: globalSettings.shop_name || '',
                            shop_address: globalSettings.shop_address || '',
                            shop_phone: globalSettings.shop_phone || '',
                            shop_bank: globalSettings.shop_bank || '',
                            shop_bank_account: globalSettings.shop_bank_account || '',
                            shop_bank_user: globalSettings.shop_bank_user || ''
                        };

                        return fetchWithAxios(`/api/print-templates/${template.id}`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                ...template,
                                config: updatedConfig
                            })
                        });
                    });

                    await Promise.all(updatePromises);

                    // 4. Reload mẫu đang chọn để hiển thị thông tin mới
                    if (selectedTemplate) {
                        const refreshedRes = await fetchWithAxios(`/api/print-templates?module=${selectedModule}`);
                        const refreshedData = await refreshedRes.json();
                        setTemplates(refreshedData);
                        const current = refreshedData.find(t => t.id === selectedTemplate.id);
                        if (current) {
                            setSelectedTemplate(current);
                            let cfg = current.config;
                            if (typeof cfg === 'string') cfg = JSON.parse(cfg);
                            setSettings({ ...DEFAULT_INVOICE_CONFIG, ...cfg });
                        }
                    }

                    setToast({ message: "Đã đồng bộ thông tin shop thành công cho toàn bộ mẫu!", type: "success" });
                } catch (err) {
                    console.error("Error syncing shop info:", err);
                    setToast({ message: "Lỗi khi đồng bộ thông tin shop!", type: "error" });
                } finally {
                    setSaving(false);
                    setConfirm(null);
                }
            },
            type: "info"
        });
    };

    const handleCreateNew = () => {
        const name = prompt("Nhập tên mẫu mới:");
        if (name) {
            setSelectedTemplate({ name, is_default: false, config: DEFAULT_INVOICE_CONFIG });
            setSettings(DEFAULT_INVOICE_CONFIG);
            setToast({ message: `Đã tạo mẫu mới: "${name}". Hãy lưu lại!`, type: "info" });
        }
    };

    const handleSetDefault = async () => {
        if (!selectedTemplate?.id) return;
        setSaving(true);
        try {
            const body = {
                is_default: true
            };
            const res = await fetchWithAxios(`/api/print-templates/${selectedTemplate.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            if (res.ok) {
                setToast({ message: "Đã đặt làm mẫu mặc định!", type: "success" });
                await fetchTemplates(selectedTemplate.id);
                
                // Auto-sync with POS tabs
                const syncChannel = new BroadcastChannel('pos_data_sync');
                syncChannel.postMessage({ type: 'SETTINGS_UPDATED' });
                syncChannel.close();
            } else {
                setToast({ message: "Lỗi khi đặt mặc định!", type: "error" });
            }
        } catch (e) {
            console.error(e);
            setToast({ message: "Lỗi khi đặt làm mặc định!", type: "error" });
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = () => {
        if (!selectedTemplate?.id) {
            setToast({ message: "Không có mẫu nào để xóa.", type: "warning" });
            return;
        }
        setConfirm({
            title: "Xác nhận xóa mẫu",
            message: `Bạn có chắc chắn muốn xóa mẫu "${selectedTemplate.name}"?`,
            onConfirm: async () => {
                setSaving(true);
                try {
                    const res = await fetchWithAxios(`/api/print-templates/${selectedTemplate.id}`, { method: 'DELETE' });
                    if (res.ok) {
                        // Clear storage if we deleted the active one
                        if (localStorage.getItem(`last_template_${selectedModule}`) == selectedTemplate.id) {
                            localStorage.removeItem(`last_template_${selectedModule}`);
                        }
                        await fetchTemplates(); // Re-fetch to update list and select new default/first
                        setToast({ message: `Đã xóa mẫu "${selectedTemplate.name}" thành công!`, type: "success" });

                        // Auto-sync with POS tabs
                        const syncChannel = new BroadcastChannel('pos_data_sync');
                        syncChannel.postMessage({ type: 'SETTINGS_UPDATED' });
                        syncChannel.close();
                    } else {
                        const errText = await res.text();
                        setToast({ message: `Lỗi khi xóa mẫu (${res.status}): ${errText}`, type: "error" });
                    }
                } catch (err) {
                    console.error("Error deleting template", err);
                    setToast({ message: "Lỗi khi xóa mẫu!", type: "error" });
                } finally {
                    setSaving(false);
                    setConfirm(null);
                }
            },
            type: "danger"
        });
    };

    const updateSetting = (key, value) => {
        if (key === 'activeTab') {
            setActiveTab(value);
            return;
        }
        setSettings(prev => ({ ...prev, [key]: value }));
        if (key === 'ui_show_doraemon') {
            localStorage.setItem('ui_show_doraemon', value);
            // Trigger storage event for same-window detection
            window.dispatchEvent(new Event('storage'));
        }
    };

    const handleLogoUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setSaving(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetchWithAxios('/api/upload-logo', {
                method: 'POST',
                body: formData
            });
            const data = await res.json();
            if (data.url) {
                updateSetting('invoice_logo_url', data.url);
                setToast({ message: "Logo đã được tải lên thành công!", type: "success" });
            } else {
                setToast({ message: "Lỗi tải logo: Không nhận được URL.", type: "error" });
            }
        } catch (err) {
            console.error("Error uploading logo", err);
            setToast({ message: "Lỗi tải logo!", type: "error" });
        } finally {
            setSaving(false);
        }
    };


    const handleFontUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setSaving(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetchWithAxios('/api/fonts', {
                method: 'POST',
                body: formData
            });
            const data = await res.json();
            if (data.filename) {
                fetchFonts();
                updateSetting('invoice_custom_font_name', data.filename);
                setToast({ message: `Font "${data.filename}" đã được tải lên thành công!`, type: "success" });
            } else {
                setToast({ message: "Lỗi tải font: Không nhận được tên file.", type: "error" });
            }
        } catch (err) {
            console.error("Error uploading font", err);
            setToast({ message: "Lỗi tải font!", type: "error" });
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="flex min-h-screen font-sans bg-transparent">
            {customFontsStyle}
            {/* Sidebar Content Designer */}
            <div className="w-[40%] border-r border-border bg-transparent overflow-y-auto h-screen sticky top-0 custom-scrollbar shadow-none z-20 no-print">
                <div className="p-5">
                    <div className="flex flex-col gap-4 mb-6">
                        <div className="flex items-start justify-between">
                            <div>
                                <h1 className="text-3xl font-black text-[#2d5016] dark:text-[#4a7c59] uppercase tracking-tight flex items-center gap-3 pt-2 pb-0.5 leading-relaxed">
                                    <Sprout className="text-[#2d5016] dark:text-[#4a7c59]" size={28} />
                                    THIẾT KẾ BẢN IN
                                </h1>
                                <div className="flex items-center gap-2">
                                    <span className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-black uppercase rounded-lg tracking-tighter">LyangPOS by Lyang</span>
                                    <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                                    <p className="text-[11px] font-bold text-gray-400 dark:text-gray-500">Cá nhân hóa mẫu hóa đơn & chứng từ</p>
                                </div>
                            </div>
                            <button
                                onClick={handleSave}
                                disabled={saving || loading}
                                className="p-2.5 bg-gradient-to-r from-[#2d5016] to-[#4a7c59] text-white rounded-xl hover:scale-[1.01] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed border border-white/20 shadow-none"
                                title="Lưu thay đổi"
                            >
                                <Save size={20} />
                            </button>
                        </div>

                        <button
                            onClick={updateAllTemplatesShopInfo}
                            disabled={saving || loading}
                            className="w-full px-4 py-2.5 bg-[#d4a574]/10 dark:bg-[#d4a574]/5 text-[#8b6f47] dark:text-[#d4a574] rounded-xl text-[9px] font-black uppercase tracking-wider hover:bg-[#d4a574]/20 transition-all border border-[#d4a574]/20 flex items-center justify-center gap-2 shadow-none"
                            title="Đồng bộ thông tin shop từ Cài đặt hệ thống cho TOÀN BỘ các mẫu"
                        >
                            <RefreshCw size={14} className={saving ? "animate-spin" : ""} />
                            Đồng bộ thông tin Trang trại
                        </button>
                    </div>

                    {/* Module Selection */}
                    <div className="flex bg-[#d4a574]/5 dark:bg-slate-800/20 p-1 rounded-xl border border-border backdrop-blur-none mb-6">
                        {MODULES.map(m => (
                            <button
                                key={m.id}
                                onClick={() => setSelectedModule(m.id)}
                                className={cn(
                                    "flex-1 py-2 px-1 rounded-lg text-[9px] font-black tracking-wider uppercase transition-all duration-300",
                                    selectedModule === m.id
                                        ? "bg-gradient-to-r from-[#2d5016] to-[#4a7c59] text-white shadow-none"
                                        : "text-[#8b6f47] hover:bg-[#d4a574]/10"
                                )}
                            >
                                {m.label}
                            </button>
                        ))}
                    </div>

                    {/* Template Picker */}
                    <div className="mb-8 p-4 bg-transparent rounded-2xl border border-border shadow-none">
                        <label className="text-[10px] font-black uppercase tracking-wider text-[#8b6f47] mb-3 block ml-1 flex items-center gap-2">
                            <Wheat size={12} /> Mẫu thiết kế vụ mùa
                        </label>
                        <div className="flex gap-2.5">
                            <div className="relative flex-1 group">
                                <select
                                    className="w-full bg-transparent border border-border rounded-xl px-4 py-2.5 text-xs font-black appearance-none outline-none focus:border-primary transition-all dark:text-white shadow-none"
                                    value={selectedTemplate?.id || ''}
                                    onChange={(e) => {
                                        const template = templates.find(t => t.id === parseInt(e.target.value));
                                        if (template) selectTemplate(template);
                                    }}
                                    disabled={loading}
                                >
                                    {Array.isArray(templates) && templates.map(t => (
                                        <option key={t.id} value={t.id}>{t.name} {t.is_default ? '(Mặc định)' : ''}</option>
                                    ))}
                                    {!selectedTemplate?.id && selectedTemplate && (
                                        <option value="">{selectedTemplate.name}</option>
                                    )}
                                    {templates.length === 0 && !selectedTemplate && (
                                        <option value="">Chưa có mẫu nào</option>
                                    )}
                                </select>
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#8b6f47]">
                                    <ChevronDown size={14} />
                                </div>
                            </div>
                            <button
                                onClick={handleCreateNew}
                                disabled={loading}
                                className="p-2.5 bg-transparent text-primary border border-border rounded-xl hover:bg-primary/10 transition-all disabled:opacity-50 shadow-none active:scale-95"
                                title="Thêm mẫu mới"
                            >
                                <Plus size={20} />
                            </button>
                        </div>
                        {selectedTemplate?.id && (
                            <div className="flex flex-col gap-1.5 mt-3">
                                <button
                                    onClick={handleSetDefault}
                                    disabled={saving || loading || selectedTemplate.is_default}
                                    className="w-full py-2 bg-transparent text-primary border border-border rounded-xl hover:bg-primary/10 transition-all disabled:opacity-50 text-[9px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-none"
                                >
                                    <Star size={12} className={selectedTemplate.is_default ? "fill-current" : ""} /> 
                                    {selectedTemplate.is_default ? 'Đang là mặc định' : 'Đặt làm mặc định'}
                                </button>
                                <button
                                    onClick={handleDelete}
                                    disabled={saving || loading}
                                    className="w-full py-2 bg-transparent text-rose-500 border border-border rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all disabled:opacity-50 text-[9px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-none"
                                >
                                    <Trash2 size={12} /> Xóa thiết kế này
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Designer Tabs */}
                    <div className="flex bg-[#d4a574]/5 dark:bg-slate-800/20 p-1 rounded-xl border border-border mb-6 sticky top-0 backdrop-blur-md z-30 shadow-none overflow-x-auto whitespace-nowrap scrollbar-none">
                        {[
                            { id: 'components', icon: Eye, label: 'THÀNH PHẦN' },
                            { id: 'text', icon: FileText, label: 'CHỮ IN' },
                            { id: 'layout', icon: Layout, label: 'BỐ CỤC' },
                            { id: 'fonts', icon: Type, label: 'FONT CHỮ' },
                            { id: 'table', icon: TableIcon, label: 'BẢNG' },
                            { id: 'watermark', icon: Palette, label: 'WATERMARK' }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={cn(
                                    "flex-1 py-2 px-1 rounded-lg text-[9px] font-black tracking-wider uppercase transition-all duration-300 flex flex-col items-center gap-1",
                                    activeTab === tab.id ? "bg-gradient-to-r from-[#2d5016] to-[#4a7c59] text-white shadow-none" : "text-[#8b6f47] hover:bg-[#d4a574]/10"
                                )}
                            >
                                <tab.icon size={16} className={activeTab === tab.id ? "scale-105" : ""} />
                                <span className="text-[8px] font-black tracking-wider">{tab.label}</span>
                            </button>
                        ))}
                    </div>

                    {/* Tab Content */}
                    <div className="space-y-6 pb-20">
                        {activeTab === 'components' && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-left-2 duration-300">
                                <DesignerSection title="Ẩn/Hiện Thành phần Header">
                                    <Toggle label="Hiện Logo Cửa hàng" checked={settings.invoice_show_logo === 'true'} onChange={(v) => updateSetting('invoice_show_logo', v ? 'true' : 'false')} />
                                    {settings.invoice_show_logo === 'true' && (
                                        <div className="mt-2 ml-6">
                                            <input type="file" id="logo-upload" className="hidden" accept="image/*" onChange={handleLogoUpload} />
                                            <label htmlFor="logo-upload" className="flex items-center gap-2 text-xs font-bold text-primary cursor-pointer hover:underline">
                                                <Upload size={14} /> Tải logo lên mới
                                            </label>
                                        </div>
                                    )}
                                    <Toggle label="Hiện Tên Cửa hàng" checked={settings.invoice_show_shop_name === 'true'} onChange={(v) => updateSetting('invoice_show_shop_name', v ? 'true' : 'false')} />
                                    <Toggle label="Hiện Địa chỉ Cửa hàng" checked={settings.invoice_show_address === 'true'} onChange={(v) => updateSetting('invoice_show_address', v ? 'true' : 'false')} />
                                    <Toggle label="Hiện Số điện thoại Shop" checked={settings.invoice_show_phone === 'true'} onChange={(v) => updateSetting('invoice_show_phone', v ? 'true' : 'false')} />
                                    <Toggle label="Hiện STK Ngân hàng" checked={settings.invoice_show_bank_info === 'true'} onChange={(v) => updateSetting('invoice_show_bank_info', v ? 'true' : 'false')} />
                                    <Toggle label="Hiện Tiêu đề hóa đơn" checked={settings.invoice_show_title !== 'false'} onChange={(v) => updateSetting('invoice_show_title', v ? 'true' : 'false')} />
                                    <Toggle label="Hiện Thông tin đối tác (Khách hàng)" checked={settings.invoice_show_customer_info === 'true'} onChange={(v) => updateSetting('invoice_show_customer_info', v ? 'true' : 'false')} />
                                    {settings.invoice_show_customer_info === 'true' && (
                                        <div className="ml-6 mt-1 pb-1 border-l pl-3 border-slate-200 dark:border-slate-800">
                                            <Toggle label="Ẩn mã số đối tác (#ID)" checked={settings.invoice_hide_customer_id === 'true'} onChange={(v) => updateSetting('invoice_hide_customer_id', v ? 'true' : 'false')} />
                                        </div>
                                    )}
                                </DesignerSection>

                                <DesignerSection title="Viền & Nền Tiêu đề">
                                    <Toggle label="Sử dụng viền (Badge)" checked={settings.invoice_title_badge === 'true'} onChange={(v) => updateSetting('invoice_title_badge', v ? 'true' : 'false')} />
                                    {settings.invoice_title_badge === 'true' && (
                                        <div className="mt-4 space-y-4 pt-4 border-t dark:border-slate-800 animate-in slide-in-from-top-2">
                                            <div className="grid grid-cols-2 gap-4">
                                                <ColorPicker label="Màu nền" value={settings.invoice_title_badge_bg} onChange={v => updateSetting('invoice_title_badge_bg', v)} />
                                                <ColorPicker label="Màu viền" value={settings.invoice_title_badge_border} onChange={v => updateSetting('invoice_title_badge_border', v)} />
                                            </div>
                                            <ColorPicker label="Màu chữ" value={settings.invoice_title_badge_text_color} onChange={v => updateSetting('invoice_title_badge_text_color', v)} />
                                        </div>
                                    )}
                                </DesignerSection>

                                <DesignerSection title="Thông tin Chung & Mã số">
                                    <Toggle label="Hiện Mã số hóa đơn" checked={settings.invoice_show_id === 'true'} onChange={(v) => updateSetting('invoice_show_id', v ? 'true' : 'false')} />
                                    <Toggle label="Hiện Ngày hóa đơn" checked={settings.invoice_show_date === 'true'} onChange={(v) => updateSetting('invoice_show_date', v ? 'true' : 'false')} />
                                    {settings.invoice_show_date === 'true' && (
                                        <div className="ml-3 pl-3 border-l-2 border-[#4a7c59]/40 mt-1 mb-2 animate-in fade-in duration-200">
                                            <Toggle label="Kèm Giờ in (hh:mm:ss)" checked={settings.invoice_show_time !== 'false'} onChange={(v) => updateSetting('invoice_show_time', v ? 'true' : 'false')} />
                                            <p className="text-[9px] text-slate-400 italic mt-0.5">Tắt tùy chọn này để chỉ hiển thị ngày (DD/MM/YYYY) mà không hiển thị giờ in.</p>
                                        </div>
                                    )}
                                    <div className="mt-4 pt-4 border-t dark:border-slate-800">
                                        <div className="flex justify-between text-xs mb-1">
                                            <span className="text-slate-500">Cỡ chữ thông tin khách hàng/chung</span>
                                            <span className="font-bold">{settings.invoice_customer_info_size}px</span>
                                        </div>
                                        <input 
                                            type="range" 
                                            min="8" 
                                            max="24" 
                                            step="1" 
                                            value={settings.invoice_customer_info_size || '12'} 
                                            onChange={(e) => updateSetting('invoice_customer_info_size', e.target.value)} 
                                            className="w-full h-1 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer"
                                        />
                                    </div>
                                </DesignerSection>

                                <DesignerSection title="Ẩn/Hiện Chân trang (Footer)">
                                    <Toggle label="Hiện Tổng tiền" checked={settings.invoice_show_total_amount === 'true'} onChange={(v) => updateSetting('invoice_show_total_amount', v ? 'true' : 'false')} />
                                    <Toggle label="Hiện Khách đưa" checked={settings.invoice_show_cash_given === 'true'} onChange={(v) => updateSetting('invoice_show_cash_given', v ? 'true' : 'false')} />
                                    <Toggle label="Hiện Tiền thối" checked={settings.invoice_show_change === 'true'} onChange={(v) => updateSetting('invoice_show_change', v ? 'true' : 'false')} />
                                    <Toggle label="Hiện Ghi chú" checked={settings.invoice_show_notes === 'true'} onChange={(v) => updateSetting('invoice_show_notes', v ? 'true' : 'false')} />
                                    <Toggle label="Hiện Chữ ký" checked={settings.invoice_show_signatures === 'true'} onChange={(v) => updateSetting('invoice_show_signatures', v ? 'true' : 'false')} />
                                    <Toggle label="Hiện Lời cảm ơn" checked={settings.invoice_show_thank_you === 'true'} onChange={(v) => updateSetting('invoice_show_thank_you', v ? 'true' : 'false')} />
                                </DesignerSection>
                            </div>
                        )}

                        {activeTab === 'text' && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-left-2 duration-300">
                                <DesignerSection title="Thông tin Cửa hàng">
                                    <DesignerInput label="Tên cửa hàng" value={settings.shop_name} onChange={(v) => updateSetting('shop_name', v)} />
                                    <DesignerInput label="Địa chỉ cửa hàng" value={settings.shop_address} onChange={(v) => updateSetting('shop_address', v)} />
                                    <DesignerInput label="Số điện thoại cửa hàng" value={settings.shop_phone} onChange={(v) => updateSetting('shop_phone', v)} />

                                    <div className="grid grid-cols-2 gap-3">
                                        <DesignerInput label="Tên ngân hàng" value={settings.shop_bank} onChange={(v) => updateSetting('shop_bank', v)} placeholder="Ví dụ: MB Bank" />
                                        <DesignerInput label="Số tài khoản" value={settings.shop_bank_account} onChange={(v) => updateSetting('shop_bank_account', v)} placeholder="0123456789" />
                                    </div>
                                    <DesignerInput label="Chủ tài khoản" value={settings.shop_bank_user} onChange={(v) => updateSetting('shop_bank_user', v)} placeholder="NGUYEN VAN A" />
                                </DesignerSection>

                                <DesignerSection title="Lời cảm ơn">
                                    <DesignerInput label="Nội dung Lời cảm ơn" value={settings.invoice_thank_you_message} onChange={(v) => updateSetting('invoice_thank_you_message', v)} />
                                </DesignerSection>
                            </div>
                        )}

                        {activeTab === 'layout' && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-left-2 duration-300">
                                <DesignerSection title="Đa trang & Đánh số trang">
                                    <div className="space-y-3">
                                        <div>
                                            <Toggle
                                                label="Lặp lại Header ở trang 2 trở đi"
                                                checked={settings.invoice_repeat_header_on_later_pages === 'true'}
                                                onChange={(v) => updateSetting('invoice_repeat_header_on_later_pages', v ? 'true' : 'false')}
                                            />
                                            <p className="text-[10px] text-slate-400 italic mt-0.5 ml-1">Bật để tự động lặp lại thông tin cửa hàng & tiêu đề ở đầu trang 2 trở đi khi in đơn dài; tắt để tiết kiệm giấy.</p>
                                        </div>

                                        <div className="pt-2 border-t border-border">
                                            <Toggle
                                                label="Đánh số trang (Trang 1/2...)"
                                                checked={settings.invoice_show_page_number === 'true'}
                                                onChange={(v) => updateSetting('invoice_show_page_number', v ? 'true' : 'false')}
                                            />
                                            {settings.invoice_show_page_number === 'true' && (
                                                <div className="mt-3 space-y-3 pl-3 border-l-2 border-[#4a7c59]/40 animate-in fade-in duration-200">
                                                    <div className="space-y-1.5">
                                                        <label className="text-[10px] font-bold text-slate-400 uppercase">Vị trí số trang</label>
                                                        <div className="flex bg-[#d4a574]/5 dark:bg-slate-800/20 p-1 rounded-xl border border-border">
                                                            {[
                                                                { id: 'bottom-left', label: 'Dưới Trái' },
                                                                { id: 'bottom-center', label: 'Dưới Giữa' },
                                                                { id: 'bottom-right', label: 'Dưới Phải' }
                                                            ].map(pos => (
                                                                <button
                                                                    key={pos.id}
                                                                    type="button"
                                                                    onClick={() => updateSetting('invoice_page_number_position', pos.id)}
                                                                    className={cn(
                                                                        "flex-1 py-1.5 rounded-lg text-xs font-bold transition-all",
                                                                        (settings.invoice_page_number_position || 'bottom-right') === pos.id
                                                                            ? "bg-gradient-to-r from-[#2d5016] to-[#4a7c59] text-white shadow-none"
                                                                            : "text-slate-400 hover:text-slate-200"
                                                                    )}
                                                                >
                                                                    {pos.label}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    <div className="space-y-1.5">
                                                        <label className="text-[10px] font-bold text-slate-400 uppercase">Định dạng hiển thị</label>
                                                        <div className="flex bg-[#d4a574]/5 dark:bg-slate-800/20 p-1 rounded-xl border border-border">
                                                            {[
                                                                { id: 'page_total', label: 'Trang X/Y (Trang 1/2)' },
                                                                { id: 'page_only', label: 'Chỉ số trang (Trang 1)' }
                                                            ].map(fmt => (
                                                                <button
                                                                    key={fmt.id}
                                                                    type="button"
                                                                    onClick={() => updateSetting('invoice_page_number_format', fmt.id)}
                                                                    className={cn(
                                                                        "flex-1 py-1.5 rounded-lg text-xs font-bold transition-all",
                                                                        (settings.invoice_page_number_format || 'page_total') === fmt.id
                                                                            ? "bg-gradient-to-r from-[#2d5016] to-[#4a7c59] text-white shadow-none"
                                                                            : "text-slate-400 hover:text-slate-200"
                                                                    )}
                                                                >
                                                                    {fmt.label}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-3">
                                                        <DesignerInput
                                                            label="Cỡ chữ số trang (px)"
                                                            type="number"
                                                            value={settings.invoice_page_number_size || '10'}
                                                            onChange={(v) => updateSetting('invoice_page_number_size', v)}
                                                        />
                                                        <ColorPicker
                                                            label="Màu chữ số trang"
                                                            value={settings.invoice_page_number_color || '#64748b'}
                                                            onChange={(v) => updateSetting('invoice_page_number_color', v)}
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </DesignerSection>

                                <DesignerSection title="Bố cục tự do (Kéo thả)">
                                    <Toggle
                                        label="Kích hoạt vị trí tự do"
                                        checked={settings.invoice_free_layout === 'true'}
                                        onChange={(v) => updateSetting('invoice_free_layout', v ? 'true' : 'false')}
                                    />
                                    <p className="text-[10px] text-slate-400 italic mb-2">Bật để tự do kéo thả tất cả các thành phần trên màn hình xem trước.</p>
                                    {settings.invoice_free_layout === 'true' && (
                                          <>
                                              <div className="mt-2 mb-3">
                                                 <label className="text-[10px] font-black text-[#8b6f47] dark:text-[#d4a574] block mb-1 uppercase tracking-wider">Ảnh mẫu đối chiếu (Chỉ hiện preview):</label>
                                                 <select
                                                     value={settings.invoice_preview_bg_image || 'none'}
                                                     onChange={(e) => updateSetting('invoice_preview_bg_image', e.target.value)}
                                                     className="w-full text-xs bg-slate-50 dark:bg-slate-900 border border-border rounded-xl px-3 py-2 text-slate-800 dark:text-slate-200 outline-none"
                                                 >
                                                     <option value="none">Không sử dụng</option>
                                                     <option value="a5_template.png">Mẫu giấy A5 Syngenta (In sẵn)</option>
                                                 </select>
                                                 <p className="text-[9px] text-slate-400 italic mt-1">Chọn ảnh mẫu để căn chỉnh các ô thông tin không bị in đè vào các dòng có sẵn trên giấy in.</p>
                                             </div>

                                             <button
                                                 onClick={() => {
                                                     updateSetting('pos_logo_x', '20');
                                                     updateSetting('pos_logo_y', '20');
                                                     updateSetting('pos_shop_name_x', '100');
                                                     updateSetting('pos_shop_name_y', '20');
                                                     updateSetting('pos_shop_info_x', '100');
                                                     updateSetting('pos_shop_info_y', '50');
                                                     updateSetting('pos_title_x', '500');
                                                     updateSetting('pos_title_y', '20');
                                                     updateSetting('pos_customer_info_x', '20');
                                                     updateSetting('pos_customer_info_y', '150');
                                                      updateSetting('pos_customer_name_x', '20');
                                                      updateSetting('pos_customer_name_y', '150');
                                                      updateSetting('pos_customer_phone_x', '20');
                                                      updateSetting('pos_customer_phone_y', '168');
                                                      updateSetting('pos_customer_address_x', '20');
                                                      updateSetting('pos_customer_address_y', '186');
                                                     updateSetting('pos_invoice_meta_x', '500');
                                                     updateSetting('pos_invoice_meta_y', '150');
                                                     updateSetting('pos_table_x', '20');
                                                     updateSetting('pos_table_y', '230');
                                                     updateSetting('pos_notes_x', '20');
                                                     updateSetting('pos_notes_y', '500');
                                                     updateSetting('pos_summary_x', '450');
                                                     updateSetting('pos_summary_y', '500');
                                                     updateSetting('pos_signatures_x', '20');
                                                     updateSetting('pos_signatures_y', '650');
                                                     updateSetting('pos_thank_you_x', '20');
                                                     updateSetting('pos_thank_you_y', '750');
                                                     updateSetting('pos_width_logo', '150');
                                                     updateSetting('pos_width_shop_name', '300');
                                                     updateSetting('pos_width_shop_info', '300');
                                                     updateSetting('pos_width_title', '250');
                                                     updateSetting('pos_width_customer_info', '450');
                                                     updateSetting('pos_width_customer_name', '450');
                                                     updateSetting('pos_width_customer_phone', '450');
                                                     updateSetting('pos_width_customer_address', '450');
                                                     updateSetting('pos_width_invoice_meta', '250');
                                                     updateSetting('pos_width_table', '750');
                                                     updateSetting('pos_width_notes', '350');
                                                     updateSetting('pos_width_summary', '350');
                                                     updateSetting('pos_width_signatures', '750');
                                                     updateSetting('pos_width_thank_you', '750');
                                                     updateSetting('invoice_preview_bg_image', 'none');
                                                     updateSetting('invoice_table_name_nowrap', 'false');
                                                      updateSetting('invoice_show_title', 'true');
                                                      updateSetting('invoice_repeat_header_on_later_pages', 'true');
                                                     setToast({ message: "Đã đặt lại thiết kế mặc định!", type: "info" });
                                                 }}
                                                 className="w-full py-2 mt-2 bg-transparent text-[#8b6f47] border border-border rounded-xl hover:bg-[#d4a574]/10 transition-all text-[9px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-none"
                                             >
                                                 Đặt lại vị trí mặc định
                                             </button>
                                         </>
                                     )}
                                </DesignerSection>
                                <DesignerSection title="Khổ giấy">
                                    <div className="grid grid-cols-1 gap-2">
                                        {PAPER_SIZES.map(p => (
                                            <button
                                                key={p.id}
                                                onClick={() => updateSetting('paper_size', p.id)}
                                                className={cn(
                                                    "px-4 py-3 rounded-xl text-left font-bold text-sm border flex items-center justify-between transition-all",
                                                    settings.paper_size === p.id
                                                        ? "bg-primary/5 text-primary border-primary"
                                                        : "bg-transparent text-[#8b6f47] dark:text-[#d4a574] border-border hover:border-primary/50"
                                                )}
                                            >
                                                {p.label}
                                                {settings.paper_size === p.id && <CheckCircle2 size={16} />}
                                            </button>
                                        ))}
                                    </div>
                                </DesignerSection>

                                <DesignerSection title="Định dạng">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase">Hướng in</label>
                                            <div className="flex bg-[#d4a574]/5 dark:bg-slate-800/20 p-1 rounded-xl border border-border">
                                                <button
                                                    onClick={() => updateSetting('invoice_orientation', 'portrait')}
                                                    className={cn("flex-1 py-1.5 rounded-lg text-xs font-bold transition-all", settings.invoice_orientation === 'portrait' ? "bg-gradient-to-r from-[#2d5016] to-[#4a7c59] text-white shadow-none" : "text-slate-400")}
                                                >Dọc</button>
                                                <button
                                                    onClick={() => updateSetting('invoice_orientation', 'landscape')}
                                                    className={cn("flex-1 py-1.5 rounded-lg text-xs font-bold transition-all", settings.invoice_orientation === 'landscape' ? "bg-gradient-to-r from-[#2d5016] to-[#4a7c59] text-white shadow-none" : "text-slate-400")}
                                                >Ngang</button>
                                            </div>
                                        </div>
                                        <DesignerInput label="Cách dòng" value={settings.invoice_line_spacing} onChange={(v) => updateSetting('invoice_line_spacing', v)} type="number" step="0.1" />
                                    </div>
                                </DesignerSection>

                                <DesignerSection title="Cách lề">
                                    <Toggle
                                        label="Dùng lề mặc định máy in"
                                        checked={settings.invoice_use_default_margins === 'true'}
                                        onChange={(v) => updateSetting('invoice_use_default_margins', v ? 'true' : 'false')}
                                    />
                                    <p className="text-[10px] text-slate-400 italic mb-2">Tắt để tùy chỉnh lề thủ công (mm)</p>
                                    <div className={cn("grid grid-cols-2 gap-4 transition-all", settings.invoice_use_default_margins === 'true' && "opacity-30 pointer-events-none")}>
                                        <DesignerInput label="Trên" value={settings.invoice_margin_top} onChange={(v) => updateSetting('invoice_margin_top', v)} type="number" />
                                        <DesignerInput label="Dưới" value={settings.invoice_margin_bottom} onChange={(v) => updateSetting('invoice_margin_bottom', v)} type="number" />
                                        <DesignerInput label="Trái" value={settings.invoice_margin_left} onChange={(v) => updateSetting('invoice_margin_left', v)} type="number" />
                                        <DesignerInput label="Phải" value={settings.invoice_margin_right} onChange={(v) => updateSetting('invoice_margin_right', v)} type="number" />
                                    </div>
                                </DesignerSection>
                            </div>
                        )}

                        {activeTab === 'fonts' && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-left-2 duration-300">
                                <DesignerSection title="Font mặc định">
                                    <select
                                        className="w-full bg-transparent border border-border rounded-xl px-4 py-3 text-sm dark:text-white outline-none focus:border-[#4a7c59]"
                                        value={settings.invoice_font_family}
                                        onChange={(e) => updateSetting('invoice_font_family', e.target.value)}
                                    >
                                        <option value="'Be Vietnam Pro', sans-serif">Be Vietnam Pro (Google Font)</option>
                                        <option value="Inter, sans-serif">Inter (Mặc định)</option>
                                        <option value="'Roboto', sans-serif">Roboto</option>
                                        <option value="'Courier New', Courier, monospace">Courier New (Máy in kim)</option>
                                        <option value="Arial, sans-serif">Arial</option>
                                        <option value="'Times New Roman', Times, serif">Times New Roman</option>
                                        {Array.isArray(fonts) && fonts.map(font => (
                                            <option key={font} value={`'${font.split('.')[0]}', sans-serif`}>{font}</option>
                                        ))}
                                    </select>
                                    <div className="mt-4">
                                        <input type="file" id="font-upload" className="hidden" accept=".ttf,.otf" onChange={handleFontUpload} />
                                        <label htmlFor="font-upload" className="flex items-center justify-center gap-2 py-3 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl text-slate-400 hover:text-primary hover:border-primary transition-all cursor-pointer text-xs font-bold">
                                            <Upload size={16} /> Tải font tùy chỉnh (.ttf, .otf)
                                        </label>
                                    </div>
                                </DesignerSection>

                                <DesignerSection title="Kích cỡ chữ (px)">
                                    <div className="grid grid-cols-2 gap-4">
                                        <DesignerInput label="Tiêu đề" value={settings.invoice_title_size} onChange={(v) => updateSetting('invoice_title_size', v)} type="number" />
                                        <DesignerInput label="Tên cửa hàng" value={settings.invoice_store_name_size} onChange={(v) => updateSetting('invoice_store_name_size', v)} type="number" />
                                        <DesignerInput label="Heder bảng" value={settings.invoice_table_header_size} onChange={(v) => updateSetting('invoice_table_header_size', v)} type="number" />
                                        <DesignerInput label="Nội dung bảng" value={settings.invoice_table_content_size} onChange={(v) => updateSetting('invoice_table_content_size', v)} type="number" />
                                        <DesignerInput label="Tổng tiền" value={settings.invoice_total_section_size} onChange={(v) => updateSetting('invoice_total_section_size', v)} type="number" />
                                        <DesignerInput label="Còn lại (nổi bật)" value={settings.invoice_total_balance_size} onChange={(v) => updateSetting('invoice_total_balance_size', v)} type="number" />
                                    </div>
                                </DesignerSection>
                            </div>
                        )}

                        {activeTab === 'table' && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-left-2 duration-300">
                                <DesignerSection title="Cột hiển thị">
                                    <Toggle label="STT" checked={settings.invoice_show_col_stt === 'true'} onChange={(v) => updateSetting('invoice_show_col_stt', v ? 'true' : 'false')} />

                                    {selectedModule === 'Report' ? (
                                        <>
                                            <Toggle label="Mã Đơn" checked={settings.invoice_show_col_code === 'true'} onChange={(v) => updateSetting('invoice_show_col_code', v ? 'true' : 'false')} />
                                            <Toggle label="Ngày" checked={settings.invoice_show_col_date === 'true'} onChange={(v) => updateSetting('invoice_show_col_date', v ? 'true' : 'false')} />
                                            <Toggle label="PTTT" checked={settings.invoice_show_col_method === 'true'} onChange={(v) => updateSetting('invoice_show_col_method', v ? 'true' : 'false')} />
                                        </>
                                    ) : (
                                        <>
                                            <Toggle label="Tên sản phẩm" checked={settings.invoice_show_col_name === 'true'} onChange={(v) => updateSetting('invoice_show_col_name', v ? 'true' : 'false')} />
                                            <Toggle label="Đơn vị tính (ĐVT)" checked={settings.invoice_show_col_unit === 'true'} onChange={(v) => updateSetting('invoice_show_col_unit', v ? 'true' : 'false')} />
                                            <Toggle label="SL quy đổi" checked={settings.invoice_show_secondary_qty === 'true'} onChange={(v) => updateSetting('invoice_show_secondary_qty', v ? 'true' : 'false')} />
                                            <Toggle label="Số lượng" checked={settings.invoice_show_col_qty === 'true'} onChange={(v) => updateSetting('invoice_show_col_qty', v ? 'true' : 'false')} />
                                            <Toggle label="Đơn giá" checked={settings.invoice_show_col_price === 'true'} onChange={(v) => updateSetting('invoice_show_col_price', v ? 'true' : 'false')} />
                                        </>
                                    )}
                                    <Toggle label="Thành tiền" checked={settings.invoice_show_col_total === 'true'} onChange={(v) => updateSetting('invoice_show_col_total', v ? 'true' : 'false')} />
                                    <div className="border-t dark:border-slate-800 my-2 pt-2">
                                         <Toggle label="Cắt ngắn tên hàng hóa (Không xuống dòng)" checked={settings.invoice_table_name_nowrap === 'true'} onChange={(v) => updateSetting('invoice_table_name_nowrap', v ? 'true' : 'false')} />
                                    </div>
                                </DesignerSection>

                                <DesignerSection title="Màu Sắc & Thương Hiệu">
                                    <div className="grid grid-cols-2 gap-4">
                                        <ColorPicker label="Thông tin shop" value={settings.invoice_color_store_info} onChange={v => updateSetting('invoice_color_store_info', v)} />
                                        <ColorPicker label="Tiêu đề mẫu in" value={settings.invoice_color_title} onChange={v => updateSetting('invoice_color_title', v)} />
                                        <ColorPicker label="Thông tin khách" value={settings.invoice_color_customer_info} onChange={v => updateSetting('invoice_color_customer_info', v)} />
                                        <ColorPicker label="Tiêu đề bảng" value={settings.invoice_color_table_header} onChange={v => updateSetting('invoice_color_table_header', v)} />
                                        <ColorPicker label="Nội dung hàng" value={settings.invoice_color_table_body} onChange={v => updateSetting('invoice_color_table_body', v)} />
                                        <ColorPicker label="Ghi chú / Khác" value={settings.invoice_color_notes} onChange={v => updateSetting('invoice_color_notes', v)} />
                                    </div>
                                </DesignerSection>

                                <DesignerSection title="Kiểu dáng Bảng">
                                    <div className="grid grid-cols-2 gap-3 mb-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase">Độ dày viền</label>
                                            <select
                                                className="w-full bg-transparent border border-border rounded-xl px-3 py-2 text-sm dark:text-white outline-none focus:border-[#4a7c59]"
                                                value={settings.invoice_table_border_thickness}
                                                onChange={(e) => updateSetting('invoice_table_border_thickness', e.target.value)}
                                            >
                                                <option value="thin">Mỏng (1px)</option>
                                                <option value="medium">Vừa (2px)</option>
                                            </select>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase">Kiểu nét</label>
                                            <select
                                                className="w-full bg-transparent border border-border rounded-xl px-3 py-2 text-sm dark:text-white outline-none focus:border-[#4a7c59]"
                                                value={settings.invoice_table_border_style}
                                                onChange={(e) => updateSetting('invoice_table_border_style', e.target.value)}
                                            >
                                                <option value="solid">Nét liền</option>
                                                <option value="dashed">Nét đứt</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <Toggle label="Viền toàn bảng" checked={settings.invoice_table_border === 'true'} onChange={(v) => updateSetting('invoice_table_border', v ? 'true' : 'false')} />
                                        <Toggle label="Viền dòng" checked={settings.invoice_table_border_rows === 'true'} onChange={(v) => updateSetting('invoice_table_border_rows', v ? 'true' : 'false')} />
                                        <Toggle label="Viền cột" checked={settings.invoice_table_border_cols === 'true'} onChange={(v) => updateSetting('invoice_table_border_cols', v ? 'true' : 'false')} />

                                        <div className="pt-2">
                                            <div className="flex justify-between text-xs mb-1">
                                                <span className="text-slate-500 font-medium">Khoảng cách đệm dòng bảng</span>
                                                <span className="font-bold">{settings.invoice_row_padding || '4'}px</span>
                                            </div>
                                            <input 
                                                type="range" 
                                                min="2" 
                                                max="16" 
                                                step="1" 
                                                value={settings.invoice_row_padding || '4'} 
                                                onChange={(e) => updateSetting('invoice_row_padding', e.target.value)} 
                                                className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-primary"
                                            />
                                        </div>

                                        <div className="border-t dark:border-slate-800 pt-3 mt-3">
                                            <div className="flex items-center justify-between mb-3">
                                                <label className="text-[10px] font-black text-primary/60 uppercase tracking-widest block">Viền Header Bảng</label>
                                                <Toggle label="Bo tròn (Badge)" checked={settings.invoice_table_header_is_badge === 'true'} onChange={(v) => updateSetting('invoice_table_header_is_badge', v ? 'true' : 'false')} />
                                            </div>

                                            {settings.invoice_table_header_is_badge === 'true' ? (
                                                <div className="mt-3 space-y-4 pl-4 border-l-2 border-primary/20 animate-in slide-in-from-left-2">
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <ColorPicker label="Màu nền" value={settings.invoice_table_header_badge_bg} onChange={v => updateSetting('invoice_table_header_badge_bg', v)} />
                                                        <ColorPicker label="Màu viền" value={settings.invoice_table_header_badge_border} onChange={v => updateSetting('invoice_table_header_badge_border', v)} />
                                                    </div>
                                                    <ColorPicker label="Màu chữ" value={settings.invoice_table_header_badge_text_color} onChange={v => updateSetting('invoice_table_header_badge_text_color', v)} />
                                                </div>
                                            ) : (
                                                <>
                                                    <Toggle label="Sử dụng viền Header riêng" checked={settings.invoice_table_header_border === 'true'} onChange={(v) => updateSetting('invoice_table_header_border', v ? 'true' : 'false')} />
                                                    {settings.invoice_table_header_border === 'true' && (
                                                        <div className="mt-3 space-y-3 pl-4 border-l-2 border-primary/20 animate-in slide-in-from-left-2">
                                                            <div className="grid grid-cols-2 gap-3">
                                                                <ColorPicker label="Màu viền" value={settings.invoice_table_header_border_color} onChange={v => updateSetting('invoice_table_header_border_color', v)} />
                                                                <div className="space-y-1.5">
                                                                    <label className="text-[10px] font-bold text-slate-400 uppercase">Độ dày (px)</label>
                                                                    <input
                                                                        type="number" min="1" max="10"
                                                                        className="w-full bg-transparent border border-border rounded-xl px-3 py-2 text-sm dark:text-white outline-none focus:border-[#4a7c59]"
                                                                        value={settings.invoice_table_header_border_width}
                                                                        onChange={(e) => updateSetting('invoice_table_header_border_width', e.target.value)}
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="space-y-2">
                                                <Toggle label="Nền tiêu đề" checked={settings.invoice_table_header_bg_enabled === 'true'} onChange={(v) => updateSetting('invoice_table_header_bg_enabled', v ? 'true' : 'false')} />
                                                {settings.invoice_table_header_bg_enabled === 'true' && (
                                                    <ColorPicker label="Màu nền tiêu đề" value={settings.invoice_table_header_bg_color} onChange={v => updateSetting('invoice_table_header_bg_color', v)} />
                                                )}
                                            </div>
                                            <div className="space-y-2">
                                                <Toggle label="Kẻ Zebra" checked={settings.invoice_table_zebra_stripe === 'true'} onChange={(v) => updateSetting('invoice_table_zebra_stripe', v ? 'true' : 'false')} />
                                                {settings.invoice_table_zebra_stripe === 'true' && (
                                                    <ColorPicker label="Màu Zebra" value={settings.invoice_table_zebra_color} onChange={v => updateSetting('invoice_table_zebra_color', v)} />
                                                )}
                                            </div>
                                        </div>
                                        <div className="border-t dark:border-slate-700 my-2 pt-2 space-y-3">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase block">Quy cách quy đổi (Secondary Qty)</label>
                                            <Toggle label="Cột Số lượng quy đổi" checked={settings.invoice_show_secondary_qty === 'true'} onChange={(v) => updateSetting('invoice_show_secondary_qty', v ? 'true' : 'false')} />
                                            {settings.invoice_show_secondary_qty === 'true' && (
                                                <div className="pl-4 space-y-2">
                                                    <label className="text-[10px] font-bold text-slate-400">Độ rộng cột quy đổi (px)</label>
                                                    <div className="flex items-center gap-3">
                                                        <input
                                                            type="range" min="40" max="250" step="1"
                                                            value={settings.invoice_col_secondary_qty_width}
                                                            onChange={(e) => updateSetting('invoice_col_secondary_qty_width', e.target.value)}
                                                            className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-primary"
                                                        />
                                                        <span className="text-xs font-mono w-8">{settings.invoice_col_secondary_qty_width}</span>
                                                    </div>
                                                </div>
                                            )}
                                            <Toggle label="Dòng Tổng cộng quy đổi" checked={settings.invoice_show_total_secondary_qty === 'true'} onChange={(v) => updateSetting('invoice_show_total_secondary_qty', v ? 'true' : 'false')} />
                                            {(settings.invoice_show_total_items === 'true' || settings.invoice_show_total_qty === 'true' || settings.invoice_show_total_secondary_qty === 'true') && (
                                                <div className="pl-4 space-y-2 border-t dark:border-slate-700 pt-2 pb-1">
                                                    <label className="text-[10px] font-bold text-slate-400">Cỡ chữ dòng Tổng (px)</label>
                                                    <div className="flex items-center gap-3">
                                                        <input
                                                            type="range" min="8" max="24" step="1"
                                                            value={settings.invoice_total_summary_font_size}
                                                            onChange={(e) => updateSetting('invoice_total_summary_font_size', e.target.value)}
                                                            className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-primary"
                                                        />
                                                        <span className="text-xs font-mono w-8">{settings.invoice_total_summary_font_size}</span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </DesignerSection>

                                <DesignerSection title="Tổng hợp (Chân bảng)">
                                    <Toggle label="Tổng số mặt hàng (dòng)" checked={settings.invoice_show_total_items === 'true'} onChange={(v) => updateSetting('invoice_show_total_items', v ? 'true' : 'false')} />
                                    <Toggle label="Tổng số lượng" checked={settings.invoice_show_total_qty === 'true'} onChange={(v) => updateSetting('invoice_show_total_qty', v ? 'true' : 'false')} />
                                </DesignerSection>

                                {(selectedModule === 'Sale' || selectedModule === 'Purchase' || selectedModule === 'Report' || selectedModule === 'PartnerLedger') && (
                                    <DesignerSection title={`Phần Tổng cộng (${selectedModule === 'Sale' ? 'Bán hàng' : selectedModule === 'Purchase' ? 'Nhập hàng' : selectedModule === 'PartnerLedger' ? 'Sổ nợ' : 'Báo cáo'})`}>
                                        <div className="grid grid-cols-2 gap-4 mb-3">
                                            <ColorPicker label="Màu Chữ Nhãn" value={settings.invoice_color_total_label} onChange={v => updateSetting('invoice_color_total_label', v)} />
                                            <ColorPicker label="Màu Chữ Số" value={settings.invoice_color_total_value} onChange={v => updateSetting('invoice_color_total_value', v)} />
                                        </div>
                                        <div className="grid grid-cols-2 gap-3 mb-4">
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-bold text-slate-400 uppercase">Cỡ chữ (px)</label>
                                                <input
                                                    type="number"
                                                    className="w-full bg-transparent border border-border rounded-xl px-3 py-2 text-sm dark:text-white outline-none focus:border-[#4a7c59]"
                                                    value={settings.invoice_total_line_size}
                                                    onChange={(e) => updateSetting('invoice_total_line_size', e.target.value)}
                                                />
                                            </div>
                                            <div className="flex gap-2 items-end pb-1">
                                                <button
                                                    onClick={() => updateSetting('invoice_total_line_bold', settings.invoice_total_line_bold === 'true' ? 'false' : 'true')}
                                                    className={cn("p-2 rounded-lg border transition-all", settings.invoice_total_line_bold === 'true' ? "bg-primary/10 border-primary text-primary" : "border-slate-200 text-slate-400")}
                                                ><Bold size={16} /></button>
                                                <button
                                                    onClick={() => updateSetting('invoice_total_line_italic', settings.invoice_total_line_italic === 'true' ? 'false' : 'true')}
                                                    className={cn("p-2 rounded-lg border transition-all", settings.invoice_total_line_italic === 'true' ? "bg-primary/10 border-primary text-primary" : "border-slate-200 text-slate-400")}
                                                ><Italic size={16} /></button>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3 mb-4">
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-bold text-slate-400 uppercase">Lề trên (px)</label>
                                                <input
                                                    type="number"
                                                    className="w-full bg-transparent border border-border rounded-xl px-3 py-2 text-sm dark:text-white outline-none focus:border-[#4a7c59]"
                                                    value={settings.invoice_total_line_margin_top}
                                                    onChange={(e) => updateSetting('invoice_total_line_margin_top', e.target.value)}
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-bold text-slate-400 uppercase">Lề dưới (px)</label>
                                                <input
                                                    type="number"
                                                    className="w-full bg-transparent border border-border rounded-xl px-3 py-2 text-sm dark:text-white outline-none focus:border-[#4a7c59]"
                                                    value={settings.invoice_total_line_margin_bottom}
                                                    onChange={(e) => updateSetting('invoice_total_line_margin_bottom', e.target.value)}
                                                />
                                            </div>
                                        </div>
                                        <Toggle label="Nợ cũ" checked={settings.invoice_show_old_debt === 'true'} onChange={(v) => updateSetting('invoice_show_old_debt', v ? 'true' : 'false')} />
                                        <Toggle label="Thanh toán" checked={settings.invoice_show_paid === 'true'} onChange={(v) => updateSetting('invoice_show_paid', v ? 'true' : 'false')} />
                                        <Toggle label="Còn lại" checked={settings.invoice_show_balance === 'true'} onChange={(v) => updateSetting('invoice_show_balance', v ? 'true' : 'false')} />
                                        {selectedModule === 'Sale' && (
                                            <div className="pt-2 border-t dark:border-slate-800 mt-2">
                                                <Toggle
                                                    label="Ẩn nợ cũ khi thu tiền mặt"
                                                    checked={settings.invoice_hide_old_debt_on_cash === 'true'}
                                                    onChange={(v) => updateSetting('invoice_hide_old_debt_on_cash', v ? 'true' : 'false')}
                                                />
                                                <p className="text-[10px] text-slate-400 italic ml-3 mt-1">* Tự động ẩn nợ cũ & số dư nếu khách trả tiền mặt.</p>
                                            </div>
                                        )}
                                    </DesignerSection>
                                )}


                                <DesignerSection title="Độ rộng cột (px)">
                                    <div className="grid grid-cols-2 gap-4">
                                        <DesignerInput label="STT" value={settings.invoice_col_stt} onChange={(v) => updateSetting('invoice_col_stt', v)} type="number" />
                                        {selectedModule === 'PartnerLedger' ? (
                                            <>
                                                <DesignerInput label="Ghi nợ (+)" value={settings.invoice_col_ledger_increase || '90'} onChange={(v) => updateSetting('invoice_col_ledger_increase', v)} type="number" />
                                                <DesignerInput label="Toán/Chi (-)" value={settings.invoice_col_ledger_decrease || '90'} onChange={(v) => updateSetting('invoice_col_ledger_decrease', v)} type="number" />
                                                <DesignerInput label="Dư nợ" value={settings.invoice_col_ledger_balance || '100'} onChange={(v) => updateSetting('invoice_col_ledger_balance', v)} type="number" />
                                                <DesignerInput label="Nội dung" value={settings.invoice_col_content || 'auto'} onChange={(v) => updateSetting('invoice_col_content', v)} placeholder="auto hoặc số px" />
                                                <DesignerInput label="Ngày" value={settings.invoice_col_date} onChange={(v) => updateSetting('invoice_col_date', v)} type="number" />
                                                <DesignerInput label="Đơn giá" value={settings.invoice_col_price} onChange={(v) => updateSetting('invoice_col_price', v)} type="number" />
                                                <DesignerInput label="Số lượng" value={settings.invoice_col_qty} onChange={(v) => updateSetting('invoice_col_qty', v)} type="number" />
                                            </>
                                        ) : selectedModule === 'Report' ? (
                                            <>
                                                <DesignerInput label="Mã Đơn" value={settings.invoice_col_code} onChange={(v) => updateSetting('invoice_col_code', v)} type="number" />
                                                <DesignerInput label="Ngày" value={settings.invoice_col_date} onChange={(v) => updateSetting('invoice_col_date', v)} type="number" />
                                                <DesignerInput label="PTTT" value={settings.invoice_col_method} onChange={(v) => updateSetting('invoice_col_method', v)} type="number" />
                                            </>
                                        ) : (
                                            <>
                                                <DesignerInput label="Tên sản phẩm" value={settings.invoice_col_name} onChange={(v) => updateSetting('invoice_col_name', v)} type="number" />
                                                <DesignerInput label="ĐVT" value={settings.invoice_col_unit} onChange={(v) => updateSetting('invoice_col_unit', v)} type="number" />
                                                <DesignerInput label="Số lượng" value={settings.invoice_col_qty} onChange={(v) => updateSetting('invoice_col_qty', v)} type="number" />
                                                <DesignerInput label="Đơn giá" value={settings.invoice_col_price} onChange={(v) => updateSetting('invoice_col_price', v)} type="number" />
                                            </>
                                        )}
                                        <DesignerInput label="Thành tiền" value={settings.invoice_col_total} onChange={(v) => updateSetting('invoice_col_total', v)} type="number" />
                                    </div>
                                </DesignerSection>
                            </div>
                        )}

                        {activeTab === 'watermark' && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-left-2 duration-300">
                                <DesignerSection title="Cấu hình Watermark">
                                    <Toggle 
                                        label="Hiển thị Watermark" 
                                        checked={String(settings.invoice_show_watermark) === 'true'} 
                                        onChange={(v) => updateSetting('invoice_show_watermark', v ? 'true' : 'false')} 
                                    />
                                    
                                    <div className="space-y-1.5 mt-3">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase">Loại Watermark</label>
                                        <select
                                            className="w-full bg-transparent border border-border rounded-xl px-3 py-2 text-sm dark:text-white outline-none focus:border-[#4a7c59]"
                                            value={settings.invoice_watermark_type}
                                            onChange={(e) => updateSetting('invoice_watermark_type', e.target.value)}
                                        >
                                            <option value="text">Chữ (Văn bản)</option>
                                            <option value="image">Hình ảnh</option>
                                        </select>
                                    </div>

                                    {settings.invoice_watermark_type === 'text' ? (
                                        <DesignerInput 
                                            label="Nội dung chữ" 
                                            value={settings.invoice_watermark_text} 
                                            onChange={(v) => updateSetting('invoice_watermark_text', v)} 
                                        />
                                    ) : (
                                        <div className="space-y-2 mt-3">
                                            <label className="text-[10px] font-black text-[#8b6f47] dark:text-[#d4a574]/60 uppercase tracking-widest block">Hình ảnh Watermark</label>
                                            {settings.invoice_watermark_image_url && (
                                                <div className="mb-2 p-2 border border-border rounded-xl flex items-center justify-between bg-slate-50 dark:bg-slate-800/10">
                                                    <span className="text-xs truncate max-w-[200px]">{settings.invoice_watermark_image_url}</span>
                                                    <button 
                                                        onClick={() => updateSetting('invoice_watermark_image_url', '')}
                                                        className="text-xs text-rose-500 hover:underline"
                                                    >
                                                        Xóa
                                                    </button>
                                                </div>
                                            )}
                                            <div className="relative">
                                                <input
                                                    type="file"
                                                    id="watermark-image-file"
                                                    accept="image/*"
                                                    onChange={(e) => {
                                                        const file = e.target.files[0];
                                                        if (!file) return;

                                                        if (file.size > 1.5 * 1024 * 1024) {
                                                            setToast({ message: "Kích thước ảnh quá lớn! Vui lòng chọn ảnh dưới 1.5MB để đảm bảo hiệu năng.", type: "error" });
                                                            return;
                                                        }

                                                        setSaving(true);
                                                        const reader = new FileReader();
                                                        reader.onloadend = () => {
                                                            const base64data = reader.result;
                                                            updateSetting('invoice_watermark_image_url', base64data);
                                                            setToast({ message: "Đã tải và nhúng ảnh watermark thành công!", type: "success" });
                                                            setSaving(false);
                                                        };
                                                        reader.onerror = () => {
                                                            setToast({ message: "Lỗi đọc file hình ảnh!", type: "error" });
                                                            setSaving(false);
                                                        };
                                                        reader.readAsDataURL(file);
                                                    }}
                                                    className="hidden"
                                                />
                                                <label
                                                    htmlFor="watermark-image-file"
                                                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#d4a574]/10 dark:bg-slate-800/20 text-[#8b6f47] border border-[#d4a574]/30 dark:border-slate-700 hover:bg-[#d4a574]/20 rounded-xl cursor-pointer text-xs font-black uppercase tracking-wider transition-all"
                                                >
                                                    <Upload size={14} /> Tải ảnh lên
                                                </label>
                                            </div>
                                        </div>
                                    )}
                                </DesignerSection>

                                <DesignerSection title="Căn chỉnh Chi tiết">
                                    <div className="space-y-4">
                                        <div>
                                            <div className="flex justify-between items-center mb-1">
                                                <label className="text-[10px] font-bold text-slate-400 uppercase">Độ trong suốt (Opacity)</label>
                                                <span className="text-xs font-mono">{settings.invoice_watermark_opacity}</span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <input
                                                    type="range" min="0.05" max="1" step="0.05"
                                                    value={settings.invoice_watermark_opacity}
                                                    onChange={(e) => updateSetting('invoice_watermark_opacity', e.target.value)}
                                                    className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-primary"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <div className="flex justify-between items-center mb-1">
                                                <label className="text-[10px] font-bold text-slate-400 uppercase">
                                                    {settings.invoice_watermark_type === 'image' ? 'Chiều rộng ảnh (px)' : 'Cỡ chữ (px)'}
                                                </label>
                                                <span className="text-xs font-mono">{settings.invoice_watermark_size} px</span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <input
                                                    type="range" min="10" max="500" step="5"
                                                    value={settings.invoice_watermark_size}
                                                    onChange={(e) => updateSetting('invoice_watermark_size', e.target.value)}
                                                    className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-primary"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <div className="flex justify-between items-center mb-1">
                                                <label className="text-[10px] font-bold text-slate-400 uppercase">Góc xoay (độ)</label>
                                                <span className="text-xs font-mono">{settings.invoice_watermark_angle}°</span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <input
                                                    type="range" min="-180" max="180" step="5"
                                                    value={settings.invoice_watermark_angle}
                                                    onChange={(e) => updateSetting('invoice_watermark_angle', e.target.value)}
                                                    className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-primary"
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3 border-t dark:border-slate-800 pt-3 mt-3">
                                            <DesignerInput 
                                                label="Vị trí X (px)" 
                                                value={settings.invoice_watermark_x} 
                                                onChange={(v) => updateSetting('invoice_watermark_x', v)} 
                                                type="number" 
                                            />
                                            <DesignerInput 
                                                label="Vị trí Y (px)" 
                                                value={settings.invoice_watermark_y} 
                                                onChange={(v) => updateSetting('invoice_watermark_y', v)} 
                                                type="number" 
                                            />
                                        </div>

                                        <button
                                            onClick={() => {
                                                updateSetting('invoice_watermark_x', '100');
                                                updateSetting('invoice_watermark_y', '200');
                                                updateSetting('invoice_watermark_angle', '-30');
                                                updateSetting('invoice_watermark_size', '100');
                                                updateSetting('invoice_watermark_opacity', '0.15');
                                            }}
                                            className="w-full py-2 bg-transparent text-[#8b6f47] border border-border rounded-xl hover:bg-[#d4a574]/10 transition-all text-[9px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-none"
                                        >
                                            Đặt lại vị trí mặc định
                                        </button>
                                    </div>
                                </DesignerSection>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Preview Area */}
            <div className="flex-1 flex flex-col p-12 overflow-y-auto relative no-print">
                <div className="absolute inset-0 bg-[radial-gradient(#d4a574_1px,transparent_1px)] dark:bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:40px_40px] opacity-[0.15] -z-10" />

                <div className="max-w-[1100px] mx-auto w-full flex flex-col items-center">
                    <div className="w-full flex items-center justify-between mb-12">
                        <div>
                            <div className="flex items-center gap-3 text-[#4a7c59] mb-2 font-black uppercase text-xs tracking-[0.4em]">
                                <Monitor size={16} /> Phòng LAB Thiết kế
                            </div>
                            <h3 className="text-4xl font-black text-slate-800 dark:text-emerald-50 uppercase tracking-tighter">Xem trước Thời gian thực</h3>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2 bg-[#d4a574]/5 dark:bg-slate-800/20 px-3 py-1.5 rounded-xl border border-border">
                                <span className="text-[9px] font-black text-[#8b6f47] dark:text-[#d4a574] uppercase tracking-wider">Hàng test:</span>
                                <select
                                    value={previewItemsCount}
                                    onChange={(e) => setPreviewItemsCount(parseInt(e.target.value))}
                                    className="text-xs bg-white dark:bg-slate-900 border border-border rounded-lg px-2 py-0.5 text-slate-800 dark:text-slate-200 outline-none font-bold"
                                >
                                    <option value={2}>2 dòng</option>
                                    <option value={3}>3 dòng</option>
                                    <option value={5}>5 dòng</option>
                                    <option value={8}>8 dòng</option>
                                    <option value={12}>12 dòng</option>
                                    <option value={16}>16 dòng</option>
                                    <option value={20}>20 dòng</option>
                                    <option value={25}>25 dòng</option>
                                </select>
                            </div>
                            <div className="flex bg-[#d4a574]/5 dark:bg-slate-800/20 p-1 rounded-xl border border-border shadow-none items-center">
                                <div className="flex items-center gap-1 border-r border-border pr-1 mr-1">
                                    <button 
                                        onClick={() => setZoomScale(prev => Math.max(50, prev - 10))} 
                                        className="px-2.5 py-1 text-xs font-black text-[#8b6f47] dark:text-[#d4a574] hover:bg-[#d4a574]/15 rounded-lg active:scale-95 transition-all outline-none"
                                        title="Thu nhỏ"
                                    >
                                        -
                                    </button>
                                    <button 
                                        onClick={() => setZoomScale(100)} 
                                        className="px-2 py-1 text-[10px] font-black text-[#8b6f47] dark:text-[#d4a574] uppercase tracking-wider hover:bg-[#d4a574]/15 rounded-lg active:scale-95 transition-all w-14 text-center outline-none"
                                        title="Đặt lại 100%"
                                    >
                                        {zoomScale}%
                                    </button>
                                    <button 
                                        onClick={() => setZoomScale(prev => Math.min(200, prev + 10))} 
                                        className="px-2.5 py-1 text-xs font-black text-[#8b6f47] dark:text-[#d4a574] hover:bg-[#d4a574]/15 rounded-lg active:scale-95 transition-all outline-none"
                                        title="Phóng to"
                                    >
                                        +
                                    </button>
                                </div>
                                <button onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2 hover:bg-[#d4a574]/10 text-[#8b6f47] dark:text-[#d4a574] rounded-lg text-[10px] font-black uppercase tracking-wider transition-all">
                                    <Printer size={14} /> Máy in thực tế
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="w-full bg-transparent border border-border rounded-3xl p-8 shadow-none overflow-auto custom-scrollbar flex justify-center">
                        <m.div
                            initial={{ rotateX: 5, y: 40, opacity: 0 }}
                            animate={{ rotateX: 0, y: 0, opacity: 1 }}
                            className="origin-top"
                        >
                            <div
                                style={{
                                    transform: `scale(${zoomScale / 100})`,
                                    transformOrigin: 'top center',
                                    transition: 'transform 0.15s ease-out'
                                }}
                            >
                                <div className="keep-white bg-transparent shadow-none border border-border">
                                    <PrintTemplate data={previewData} settings={settings} type={selectedModule} isPreview={true} onUpdateSetting={updateSetting} />
                                </div>
                            </div>
                        </m.div>
                    </div>

                    <div className="mt-12 flex items-center gap-8 text-[#8b6f47]/40">
                        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#4a7c59]/40" /> <span className="text-[10px] font-black uppercase tracking-widest">ĐANG HOẠT ĐỘNG</span></div>
                        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#d4a574]/40" /> <span className="text-[10px] font-black uppercase tracking-widest">TỰ ĐỘNG ĐẾM DÒNG</span></div>
                        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-slate-300" /> <span className="text-[10px] font-black uppercase tracking-widest">HỖ TRỢ MỌI KHỔ GIẤY</span></div>
                    </div>

                </div>
            </div>
            <div className="only-print">
                <PrintTemplate data={previewData} settings={settings} type={selectedModule} isPreview={false} />
            </div>

            <AnimatePresence>
                {toast && (
                    <Toast
                        message={toast.message}
                        type={toast.type}
                        onClose={() => setToast(null)}
                    />
                )}
            </AnimatePresence>

            {confirm && (
                <ConfirmModal
                    isOpen={!!confirm}
                    title={confirm.title}
                    message={confirm.message}
                    onConfirm={confirm.onConfirm}
                    onCancel={() => setConfirm(null)}
                    type={confirm.type}
                />
            )}
        </div>
    );
}



// Sub-components
function DesignerSection({ title, children }) {
    return (
        <div className="space-y-4 mb-8">
            <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-[#8b6f47] mb-3 ml-2 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[#4a7c59]" />
                {title}
            </h4>
            <div className="bg-transparent dark:bg-slate-800/10 p-6 rounded-3xl border border-border space-y-5 relative overflow-hidden">
                <div className="absolute top-0 right-0 opacity-[0.03] pointer-events-none p-4">
                    <Leaf size={64} />
                </div>
                {children}
            </div>
        </div>
    );
}

function DesignerInput({ label, value, onChange, type = "text", ...props }) {
    return (
        <div className="space-y-2">
            <label className="text-[10px] font-black text-[#8b6f47] dark:text-[#d4a574]/60 uppercase tracking-widest ml-1">{label}</label>
            <input
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full bg-transparent border border-border rounded-xl px-4 py-2 text-xs font-black focus:border-[#4a7c59] dark:focus:border-[#4a7c59] transition-all dark:text-white outline-none focus:ring-1 ring-[#4a7c59]/20"
                {...props}
            />
        </div>
    );
}

function Toggle({ label, checked, onChange }) {
    return (
        <div
            className="flex items-center justify-between cursor-pointer group p-3 hover:bg-[#d4a574]/5 rounded-2xl transition-all"
            onClick={() => onChange(!checked)}
        >
            <span className="text-sm font-black text-[#8b6f47] dark:text-emerald-50 group-hover:text-[#4a7c59] transition-colors uppercase tracking-tight">{label}</span>
            <button
                className={cn(
                    "relative w-12 h-6 rounded-full transition-all duration-300 outline-none",
                    checked ? "bg-gradient-to-r from-[#2d5016] to-[#4a7c59]" : "bg-slate-200 dark:bg-slate-700"
                )}
            >
                <div className={cn(
                    "absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-all duration-300 shadow-md",
                    checked ? "translate-x-6" : "translate-x-0"
                )} />
            </button>
        </div>
    );
}

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("Uncaught error:", error, errorInfo);
        this.setState({ errorInfo });
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="p-10 bg-red-50 text-red-800 rounded-xl border border-red-200 m-4">
                    <h3 className="text-xl font-bold mb-4">Invoice Designer Error</h3>
                    <p className="font-mono text-sm whitespace-pre-wrap bg-white p-4 rounded border border-red-100">{this.state.error?.toString()}</p>
                    <details className="mt-4">
                        <summary className="cursor-pointer font-bold mb-2">Stack Trace</summary>
                        <pre className="text-[10px] overflow-auto max-h-60 bg-slate-900 text-white p-4 rounded">{this.state.errorInfo?.componentStack}</pre>
                    </details>
                    <button onClick={() => window.location.reload()} className="mt-6 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">Reload Page</button>
                </div>
            );
        }

        return this.props.children;
    }
}

export default function InvoiceDesignerWrapper() {
    return (
        <ErrorBoundary>
            <InvoiceDesigner />
        </ErrorBoundary>
    );
}
