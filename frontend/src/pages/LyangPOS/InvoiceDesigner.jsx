import axios from 'axios';
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Save, Trash2, Plus, ArrowLeft, Image as ImageIcon,
    Type, Layout, Palette, Phone, MapPin, Globe, CreditCard,
    CheckCircle2, AlertCircle, FileText, Eye, Settings as SettingsIcon,
    ArrowRight, ChevronLeft, ChevronRight, Upload, Download, RefreshCw,
    Table as TableIcon, Undo, Clipboard, Monitor, Printer, Check, Star,
    Bold, Italic, AlignLeft, AlignCenter, AlignRight, Sprout, Wheat, Droplets, Leaf,
    ChevronDown, ChevronUp, Home, Search, X, Sliders, Columns, Footprints, Layers,
    Sparkles, Shield, Tag, HelpCircle, FileCheck, CheckSquare, Square,
    ShoppingCart, Package, BookOpen, TrendingUp
} from 'lucide-react';
import { cn, formatNumber } from '../../lib/utils';
import Toast from '../../components/Toast';
import { m, AnimatePresence } from 'framer-motion';
import PrintTemplate from '../../components/PrintTemplate';
import ConfirmModal from '../../components/ConfirmModal';
import GoogleFontPickerModal from '../../components/GoogleFontPickerModal';
import { loadGoogleFont } from '../../lib/googleFonts';
import { DEFAULT_SETTINGS } from '../../lib/settings';

const MODULES = [
    { id: 'Sale', label: 'Bán hàng', icon: ShoppingCart },
    { id: 'Purchase', label: 'Nhập hàng', icon: Package },
    { id: 'PartnerLedger', label: 'Sổ nợ đối tác', icon: BookOpen },
    { id: 'Report', label: 'Báo cáo', icon: TrendingUp }
];

const PAPER_SIZES = [
    { id: 'A4', label: 'A4 (210 x 297 mm)', desc: 'Khổ in văn phòng chuẩn' },
    { id: 'A5', label: 'A5 (148 x 210 mm)', desc: 'Khổ in hóa đơn phổ biến' },
    { id: 'A6', label: 'A6 (105 x 148 mm)', desc: 'Khổ in nhỏ gọn' },
    { id: 'C5', label: 'Phong bì C5 (162 x 229 mm)', desc: 'Phong bì / Bì thư' },
    { id: 'K80', label: 'In nhiệt 80mm', desc: 'Máy in bill K80' },
    { id: 'K58', label: 'In nhiệt 58mm', desc: 'Máy in bill K58 mini' },
    { id: 'CUSTOM', label: 'Tùy chỉnh (User Defined)', desc: 'Nhập kích thước riêng mm' }
];

const CONFIG_TABS = [
    { id: 'layout', label: 'Bố cục', icon: Layout, desc: 'Khổ giấy, lề, số trang' },
    { id: 'header', label: 'Đầu trang', icon: Layers, desc: 'Shop, logo, tiêu đề, đối tác' },
    { id: 'table', label: 'Bảng hàng', icon: TableIcon, desc: 'Cột, viền, giãn dòng' },
    { id: 'footer', label: 'Tổng kết', icon: CreditCard, desc: 'Nợ, thanh toán, ghi chú' },
    { id: 'style', label: 'Font & Màu', icon: Palette, desc: 'Font chữ, cỡ chữ, màu sắc' },
    { id: 'advanced', label: 'Nâng cao', icon: Sliders, desc: 'Watermark, kéo thả' }
];

const DEFAULT_INVOICE_CONFIG = {
    ...(DEFAULT_SETTINGS || {}),
    invoice_custom_width: '210',
    invoice_custom_height: '297',
    invoice_line_spacing: '1.4',
    invoice_column_spacing: '10',
    invoice_orientation: 'portrait',
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
    invoice_color_store_info: '#333333',
    invoice_color_title: '#000000',
    invoice_color_customer_info: '#000000',
    invoice_color_table_header: '#000000',
    invoice_color_table_body: '#000000',
    invoice_color_total_label: '#000000',
    invoice_color_total_value: '#000000',
    invoice_color_notes: '#555555',
    invoice_color_footer: '#444444',
    invoice_total_line_size: '18',
    invoice_total_line_bold: 'true',
    invoice_total_line_italic: 'false',
    invoice_total_line_margin_top: '0',
    invoice_total_line_margin_bottom: '4',
    invoice_margin_top: '10',
    invoice_margin_bottom: '10',
    invoice_margin_left: '10',
    invoice_margin_right: '10',
    invoice_padding_top: '0',
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
    invoice_preview_bg_opacity: '0.45',
    invoice_table_name_nowrap: 'false',
    invoice_show_title: 'true',
    invoice_repeat_header: 'false',
    invoice_repeat_header_mode: 'full',
    invoice_show_page_number: 'false',
    invoice_page_number_position: 'bottom-right',
    invoice_page_number_format: 'page_total',
    invoice_page_number_size: '10',
    invoice_page_number_color: '#64748b'
};

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

/* =========================================================================
   THEMED REUSABLE UI CONTROLS FOR CONFIG PANEL (LyangPOS Theme)
   ========================================================================= */

function CustomTemplateSelect({ templates, selectedTemplate, onSelect, disabled }) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selectedTitle = selectedTemplate?.name 
        ? `${selectedTemplate.name}${selectedTemplate.is_default ? ' ★' : ''}`
        : (templates.length > 0 ? 'Chọn mẫu...' : 'Chưa có mẫu');

    return (
        <div className="relative flex-1 min-w-[130px]" ref={dropdownRef}>
            <button
                type="button"
                onClick={() => !disabled && setIsOpen(!isOpen)}
                disabled={disabled}
                className={cn(
                    "w-full h-8 px-3 bg-transparent border border-[#d4a574]/30 dark:border-white/10 hover:border-[#2d5016] dark:hover:border-[#4ade80] rounded-xl flex items-center justify-between gap-1.5 text-xs font-black text-[#2d5016] dark:text-[#4ade80] transition-all select-none shadow-none cursor-pointer",
                    isOpen && "ring-2 ring-[#2d5016]/20 border-[#2d5016]",
                    disabled && "opacity-50 cursor-not-allowed"
                )}
            >
                <span className="truncate text-left text-[11px] leading-none">
                    {selectedTitle}
                </span>
                <ChevronDown
                    size={12}
                    className={cn(
                        "shrink-0 text-[#2d5016] dark:text-[#4ade80] transition-transform duration-200",
                        isOpen && "rotate-180"
                    )}
                />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <m.div
                        initial={{ opacity: 0, y: -4, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -4, scale: 0.96 }}
                        transition={{ duration: 0.15 }}
                        className="absolute left-0 top-full mt-1.5 w-60 max-h-64 overflow-y-auto custom-scrollbar bg-[#faf8f3]/98 dark:bg-[#0f172a]/98 backdrop-blur-2xl border border-[#8b6f47]/30 dark:border-white/15 rounded-2xl shadow-2xl p-1.5 z-[100] flex flex-col gap-1 text-left"
                    >
                        {Array.isArray(templates) && templates.length > 0 ? (
                            templates.map((t) => {
                                const isSelected = selectedTemplate?.id === t.id;
                                return (
                                    <button
                                        key={t.id}
                                        type="button"
                                        onClick={() => {
                                            onSelect(t);
                                            setIsOpen(false);
                                        }}
                                        className={cn(
                                            "w-full px-2.5 py-1.5 rounded-xl text-left text-xs font-black flex items-center justify-between transition-all cursor-pointer",
                                            isSelected
                                                ? "bg-[#2d5016] text-white shadow-sm"
                                                : "text-[#2d5016] dark:text-slate-200 hover:bg-[#d4a574]/15 hover:text-[#2d5016] dark:hover:text-white"
                                        )}
                                    >
                                        <span className="truncate flex-1 pr-2">{t.name}</span>
                                        <div className="flex items-center gap-1 shrink-0">
                                            {t.is_default && (
                                                <Star
                                                    size={12}
                                                    className={cn(
                                                        "fill-current",
                                                        isSelected ? "text-amber-300" : "text-amber-500"
                                                    )}
                                                />
                                            )}
                                            {isSelected && <Check size={12} strokeWidth={3} className="text-white" />}
                                        </div>
                                    </button>
                                );
                            })
                        ) : (
                            <div className="p-2 text-center text-xs text-slate-400 font-medium">Chưa có mẫu nào</div>
                        )}
                    </m.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function DesignerSection({ title, icon: Icon, badge, children, subtitle }) {
    return (
        <div className="rounded-2xl border border-[#d4a574]/30 dark:border-white/10 bg-transparent p-3.5 space-y-3 transition-all duration-200 hover:border-[#4a7c59]/50">
            <div className="flex items-center justify-between pb-1.5 border-b border-[#d4a574]/20 dark:border-white/10">
                <div className="flex items-center gap-2">
                    {Icon ? (
                        <div className="w-5 h-5 rounded-lg bg-[#2d5016]/10 dark:bg-[#4a7c59]/20 text-[#2d5016] dark:text-[#4ade80] flex items-center justify-center shrink-0">
                            <Icon size={12} />
                        </div>
                    ) : (
                        <div className="w-1.5 h-1.5 rounded-full bg-[#4a7c59]" />
                    )}
                    <div>
                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8b6f47] dark:text-[#d4a574] flex items-center gap-1.5">
                            {title}
                            {badge && (
                                <span className="text-[8px] font-black px-1.5 py-0.2 rounded bg-[#d4a574]/20 text-[#8b6f47] dark:text-[#d4a574] tracking-normal">
                                    {badge}
                                </span>
                            )}
                        </h4>
                        {subtitle && <p className="text-[9px] font-medium text-slate-400 dark:text-slate-500">{subtitle}</p>}
                    </div>
                </div>
            </div>
            <div className="space-y-2.5">
                {children}
            </div>
        </div>
    );
}

function ModernToggle({ label, subtitle, checked, onChange, disabled }) {
    return (
        <div
            onClick={() => !disabled && onChange(!checked)}
            className={cn(
                "flex items-center justify-between p-2.5 rounded-xl border transition-all select-none cursor-pointer group",
                checked
                    ? "bg-[#2d5016]/10 dark:bg-[#4a7c59]/20 border-[#2d5016]/40"
                    : "bg-transparent border-[#d4a574]/20 hover:bg-[#d4a574]/10 dark:hover:bg-slate-800/30",
                disabled && "opacity-40 cursor-not-allowed pointer-events-none"
            )}
        >
            <div className="pr-2">
                <p className={cn(
                    "text-xs font-black uppercase tracking-tight transition-colors leading-tight",
                    checked ? "text-[#2d5016] dark:text-[#4ade80]" : "text-[#8b6f47] dark:text-emerald-50 group-hover:text-[#2d5016] dark:group-hover:text-white"
                )}>
                    {label}
                </p>
                {subtitle && <p className="text-[9px] font-medium text-slate-400 dark:text-slate-500 mt-0.5 leading-snug">{subtitle}</p>}
            </div>
            <button
                type="button"
                className={cn(
                    "relative w-9 h-5 rounded-full transition-all duration-200 flex-shrink-0 outline-none shadow-none",
                    checked ? "bg-[#2d5016] dark:bg-[#4a7c59]" : "bg-[#8b6f47]/20 dark:bg-slate-700"
                )}
            >
                <div
                    className={cn(
                        "absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform duration-200 shadow-sm",
                        checked ? "translate-x-4" : "translate-x-0"
                    )}
                />
            </button>
        </div>
    );
}

function SliderWithInput({ label, subtitle, value, onChange, min = 0, max = 100, step = 1, unit = 'px', presets }) {
    const numVal = parseFloat(value) || 0;

    return (
        <div className="space-y-1.5 p-2.5 rounded-xl bg-transparent border border-[#d4a574]/30 dark:border-white/10">
            <div className="flex justify-between items-center text-xs">
                <div>
                    <span className="font-black text-[#8b6f47] dark:text-[#d4a574] text-[10px] uppercase tracking-wider">{label}</span>
                    {subtitle && <p className="text-[9px] text-slate-400 italic">{subtitle}</p>}
                </div>
                <div className="flex items-center gap-1">
                    <input
                        type="number"
                        min={min}
                        max={max}
                        step={step}
                        value={value ?? ''}
                        onChange={(e) => onChange(e.target.value)}
                        className="w-12 bg-transparent border border-[#d4a574]/30 dark:border-white/10 rounded-lg px-1.5 py-0.5 text-xs text-center font-black text-[#2d5016] dark:text-white outline-none focus:border-[#2d5016] shadow-none"
                    />
                    {unit && <span className="text-[9.5px] font-black text-[#8b6f47] dark:text-slate-400">{unit}</span>}
                </div>
            </div>
            <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={numVal}
                onChange={(e) => onChange(e.target.value)}
                className="w-full h-1.5 bg-[#8b6f47]/20 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-[#2d5016]"
            />
            {presets && presets.length > 0 && (
                <div className="flex items-center gap-1 pt-0.5">
                    <span className="text-[8.5px] text-slate-400 font-bold uppercase tracking-wider">Nhanh:</span>
                    {presets.map((p, idx) => (
                        <button
                            key={idx}
                            type="button"
                            onClick={() => onChange(String(p.value))}
                            className={cn(
                                "px-1.5 py-0.5 text-[8.5px] font-black rounded uppercase tracking-wider transition-all",
                                String(value) === String(p.value)
                                    ? "bg-[#2d5016] text-white shadow-none"
                                    : "bg-[#d4a574]/15 dark:bg-slate-700/60 text-[#8b6f47] dark:text-[#d4a574] hover:bg-[#d4a574]/25"
                            )}
                        >
                            {p.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

function EnhancedColorPicker({ label, value, onChange, presets }) {
    const defaultPresets = ['#000000', '#2d5016', '#4a7c59', '#8b6f47', '#d4a574', '#1e293b', '#64748b', '#dc2626', '#ffffff'];
    const activePresets = presets || defaultPresets;

    return (
        <div className="space-y-1.5 p-2 rounded-xl bg-transparent border border-[#d4a574]/30 dark:border-white/10">
            <div className="flex items-center justify-between">
                <label className="text-[9.5px] font-black text-[#8b6f47] dark:text-[#d4a574] uppercase tracking-wider">{label}</label>
                <div className="flex items-center gap-1.5">
                    <div
                        className="w-5 h-5 rounded-lg border border-[#d4a574]/40 shadow-none relative overflow-hidden flex-shrink-0 cursor-pointer group"
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
                        className="w-16 bg-transparent border border-[#d4a574]/30 dark:border-white/10 rounded px-1 py-0.5 text-[10px] font-mono font-black uppercase text-[#8b6f47] dark:text-slate-200 text-center outline-none focus:border-[#2d5016]"
                    />
                </div>
            </div>
            <div className="flex items-center gap-1 pt-0.5">
                {activePresets.map((hex) => (
                    <button
                        key={hex}
                        type="button"
                        onClick={() => onChange(hex)}
                        className={cn(
                            "w-3.5 h-3.5 rounded-full border transition-transform hover:scale-125 shadow-none",
                            value?.toLowerCase() === hex.toLowerCase() ? "ring-2 ring-[#2d5016] scale-110" : "border-black/10 dark:border-white/10"
                        )}
                        style={{ backgroundColor: hex }}
                        title={hex}
                    />
                ))}
            </div>
        </div>
    );
}

function SegmentedControl({ label, value, onChange, options }) {
    return (
        <div className="space-y-1">
            {label && <label className="text-[9.5px] font-black text-[#8b6f47] dark:text-[#d4a574]/80 uppercase tracking-widest block ml-0.5">{label}</label>}
            <div className="flex bg-[#d4a574]/10 dark:bg-slate-800/30 p-0.5 rounded-xl border border-[#d4a574]/25">
                {options.map((opt) => (
                    <button
                        key={opt.id}
                        type="button"
                        onClick={() => onChange(opt.id)}
                        className={cn(
                            "flex-1 py-1 px-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all duration-200 text-center flex items-center justify-center gap-1",
                            value === opt.id
                                ? "bg-[#2d5016] text-white shadow-none"
                                : "text-[#8b6f47] dark:text-[#d4a574] hover:bg-[#d4a574]/15"
                        )}
                    >
                        {opt.icon && <opt.icon size={12} />}
                        <span>{opt.label}</span>
                    </button>
                ))}
            </div>
        </div>
    );
}

function ColumnConfigRow({ label, visible, onToggleVisible, width, onWidthChange, typeLabel }) {
    return (
        <div className={cn(
            "flex items-center justify-between p-2 rounded-xl border transition-all duration-200",
            visible ? "bg-transparent border-[#d4a574]/30 dark:border-white/10" : "bg-transparent border-dashed border-[#d4a574]/20 opacity-50"
        )}>
            <div className="flex items-center gap-2">
                <button
                    type="button"
                    onClick={() => onToggleVisible(!visible)}
                    className={cn(
                        "w-4 h-4 rounded flex items-center justify-center transition-colors border shadow-none",
                        visible ? "bg-[#2d5016] border-[#2d5016] text-white" : "border-[#d4a574]/40 text-transparent"
                    )}
                >
                    <Check size={10} strokeWidth={3} />
                </button>
                <div>
                    <span className="text-xs font-black text-[#8b6f47] dark:text-emerald-50">{label}</span>
                    {typeLabel && <span className="text-[8.5px] text-slate-400 font-bold ml-1">({typeLabel})</span>}
                </div>
            </div>
            {visible && onWidthChange && (
                <div className="flex items-center gap-1">
                    <span className="text-[9px] font-black text-[#8b6f47]/70 dark:text-slate-400">Rộng:</span>
                    <input
                        type="text"
                        value={width ?? ''}
                        onChange={(e) => onWidthChange(e.target.value)}
                        placeholder="px / auto"
                        className="w-14 bg-transparent border border-[#d4a574]/30 dark:border-white/10 rounded px-1.5 py-0.5 text-xs font-mono font-black text-center text-[#2d5016] dark:text-slate-100 outline-none focus:border-[#2d5016]"
                    />
                    <span className="text-[9px] font-black text-[#8b6f47] dark:text-slate-400">px</span>
                </div>
            )}
        </div>
    );
}

function DesignerInput({ label, subtitle, value, onChange, placeholder, type = "text", ...props }) {
    return (
        <div className="space-y-1">
            <div className="flex justify-between items-baseline ml-0.5">
                <label className="text-[9.5px] font-black text-[#8b6f47] dark:text-[#d4a574]/70 uppercase tracking-widest">{label}</label>
                {subtitle && <span className="text-[8.5px] text-slate-400 italic font-medium">{subtitle}</span>}
            </div>
            <input
                type={type}
                value={value ?? ''}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="w-full bg-transparent border border-[#d4a574]/30 dark:border-white/10 rounded-xl px-2.5 py-1.5 text-xs font-black text-[#2d5016] dark:text-white outline-none focus:border-[#2d5016] focus:ring-1 ring-[#2d5016]/20 transition-all placeholder:font-normal placeholder:text-[#8b6f47]/40 shadow-none"
                {...props}
            />
        </div>
    );
}

/* =========================================================================
   MAIN COMPONENT: INVOICE DESIGNER
   ========================================================================= */

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
    const [confirm, setConfirm] = useState(null);
    const [activeTab, setActiveTab] = useState('layout');
    const [searchQuery, setSearchQuery] = useState('');
    const [fonts, setFonts] = useState([]);
    const [zoomScale, setZoomScale] = useState(100);
    const [showGoogleFontModal, setShowGoogleFontModal] = useState(false);

    // Keyboard shortcut: Ctrl + S to save
    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                handleSave();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [settings, selectedTemplate, selectedModule]);

    const handleGoogleFontSelect = (fontName) => {
        const formatted = `'${fontName}', sans-serif`;
        loadGoogleFont(fontName);
        updateSetting('invoice_custom_font_name', '');
        updateSetting('invoice_font_family', formatted);
        setToast({ message: `Đã áp dụng Google Font: "${fontName}"`, type: 'success' });
    };

    const customFontsStyle = (
        <style>
            {Array.isArray(fonts) && fonts.map(font => {
                const name = font.split('.')[0];
                return `@font-face { font-family: '${name}'; src: url('/uploads/fonts/${font}'); }`;
            }).join('\n')}
        </style>
    );

    const previewData = useMemo(() => {
        if (selectedModule === 'PartnerLedger') {
            return {
                id: 'PL-001',
                date: new Date().toISOString(),
                partner_name: 'Lyang Nghĩa',
                partner_id: 88,
                partner: {
                    id: 88,
                    name: 'Lyang Nghĩa',
                    phone: '0901 234 567',
                    address: 'Châu Thành, Long An'
                },
                type: 'PartnerLedger',
                details: [
                    {
                        date: new Date(Date.now() - 86400000 * 2).toISOString(),
                        type: 'Order',
                        ref_id: 'DH-1001',
                        desc: 'Hóa đơn phân bón & vật tư',
                        increase: 1250000,
                        decrease: 0,
                        running_balance: 1250000,
                        items: [
                            { product_name: 'Phân bón NPK 20-20-15', quantity: 10, unit_price: 25000, total_price: 250000 },
                            { product_name: 'Thuốc trừ sâu sinh học', quantity: 20, unit_price: 50000, total_price: 1000000 }
                        ]
                    },
                    {
                        date: new Date(Date.now() - 86400000 * 1).toISOString(),
                        type: 'Receipt',
                        ref_id: 'PT-5001',
                        desc: 'Khách thanh toán chuyển khoản',
                        increase: 0,
                        decrease: 1000000,
                        running_balance: 250000,
                        items: []
                    }
                ],
                total_amount: 1850000,
                amount_paid: 1000000,
                old_debt: 250000,
                note: 'Sổ theo dõi công nợ chi tiết giao dịch'
            };
        }
        if (selectedModule === 'Report') {
            return {
                id: 'RPT-001',
                date: new Date().toISOString(),
                partner_name: 'Lyang Nghĩa',
                partner_id: 88,
                partner: {
                    id: 88,
                    name: 'Lyang Nghĩa',
                    phone: '0901 234 567',
                    address: 'Châu Thành, Long An'
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
            };
        }
        return {
            id: '12345',
            date: new Date().toISOString(),
            partner_name: 'Lyang Nghĩa',
            partner_id: 88,
            partner: {
                id: 88,
                name: 'Lyang Nghĩa',
                phone: '0901 234 567',
                address: 'Châu Thành, Long An'
            },
            details: Array.from({ length: previewItemsCount }, (_, i) => ({
                product_name: `Vật tư nông nghiệp ${i + 1}${i === 2 ? ' dòng đặc biệt siêu kích rễ đọt non bung tược' : ''}`,
                secondary_unit: i % 2 === 0 ? 'Thùng' : 'Xô',
                quantity: Math.floor(Math.random() * 20) + 1,
                price: (Math.floor(Math.random() * 50) + 1) * 10000,
                unit: i % 2 === 0 ? 'Chai' : 'Bao',
                multiplier: i % 2 === 0 ? 24 : 10
            })),
            total_amount: 1850000,
            cost_price: 80000,
            amount_paid: 1000000,
            old_debt: 250000,
            note: 'Hàng đã giao đầy đủ kèm hướng dẫn sử dụng',
            type: selectedModule === 'Purchase' ? 'Purchase' : 'Sale'
        };
    }, [selectedModule, previewItemsCount]);

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
                    if (targetId) {
                        candidate = data.find(t => t.id === targetId);
                    }
                    if (!candidate) {
                        const lastId = localStorage.getItem(`last_template_${selectedModule}`);
                        if (lastId) {
                            candidate = data.find(t => t.id === parseInt(lastId));
                        }
                    }
                    if (!candidate) {
                        candidate = data.find(t => t.is_default) || data[0];
                    }
                    if (candidate) {
                        selectTemplate(candidate);
                    } else {
                        setSelectedTemplate(null);
                        setSettings(DEFAULT_INVOICE_CONFIG);
                    }
                } else {
                    setSelectedTemplate(null);
                    setSettings(DEFAULT_INVOICE_CONFIG);
                }
            } else {
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
            }
        } catch (err) {
            console.error("Error fetching fonts", err);
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
                    config = {};
                }
            }
            setSettings({ ...DEFAULT_INVOICE_CONFIG, ...(config || {}) });
        } catch (e) {
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
                selectTemplate(savedData);
                setToast({ message: "Đã lưu thiết kế bản in thành công! (Ctrl+S)", type: "success" });

                const syncChannel = new BroadcastChannel('pos_data_sync');
                syncChannel.postMessage({ type: 'SETTINGS_UPDATED' });
                syncChannel.close();
            } else {
                const errText = await res.text();
                setToast({ message: `Lỗi khi lưu mẫu in (${res.status}): ${errText}`, type: "error" });
            }
        } catch (err) {
            setToast({ message: "Đã xảy ra lỗi khi lưu: " + err.message, type: "error" });
        } finally {
            setSaving(false);
        }
    };

    const updateAllTemplatesShopInfo = () => {
        setConfirm({
            title: "Đồng bộ thông tin shop",
            message: "Cập nhật Tên Shop, Địa chỉ, SĐT và STK ngân hàng từ Cài Đặt Hệ Thống cho TẤT CẢ các mẫu in? Hành động này giúp bạn không phải nhập lại nhiều lần.",
            onConfirm: async () => {
                setSaving(true);
                try {
                    const settingsRes = await fetchWithAxios('/api/settings');
                    const globalSettings = await settingsRes.json();

                    if (!globalSettings.shop_name) {
                        setToast({ message: "Chưa có thông tin shop trong Cài đặt!", type: "info" });
                        setConfirm(null);
                        setSaving(false);
                        return;
                    }

                    const resAll = await fetchWithAxios('/api/print-templates');
                    const allTemplates = await resAll.json();

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

                    setToast({ message: "Đã đồng bộ thông tin shop cho toàn bộ mẫu in!", type: "success" });
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
            setToast({ message: `Đã tạo mẫu mới: "${name}". Hãy điều chỉnh và Lưu lại!`, type: "info" });
        }
    };

    const handleSetDefault = async () => {
        if (!selectedTemplate?.id) return;
        setSaving(true);
        try {
            const body = { is_default: true };
            const res = await fetchWithAxios(`/api/print-templates/${selectedTemplate.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            if (res.ok) {
                setToast({ message: "Đã đặt làm mẫu mặc định!", type: "success" });
                await fetchTemplates(selectedTemplate.id);
                const syncChannel = new BroadcastChannel('pos_data_sync');
                syncChannel.postMessage({ type: 'SETTINGS_UPDATED' });
                syncChannel.close();
            } else {
                setToast({ message: "Lỗi khi đặt mặc định!", type: "error" });
            }
        } catch (e) {
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
            title: "Xác nhận xóa mẫu in",
            message: `Bạn có chắc chắn muốn xóa vĩnh viễn mẫu "${selectedTemplate.name}"?`,
            onConfirm: async () => {
                setSaving(true);
                try {
                    const res = await fetchWithAxios(`/api/print-templates/${selectedTemplate.id}`, { method: 'DELETE' });
                    if (res.ok) {
                        if (localStorage.getItem(`last_template_${selectedModule}`) == selectedTemplate.id) {
                            localStorage.removeItem(`last_template_${selectedModule}`);
                        }
                        await fetchTemplates();
                        setToast({ message: `Đã xóa mẫu "${selectedTemplate.name}" thành công!`, type: "success" });

                        const syncChannel = new BroadcastChannel('pos_data_sync');
                        syncChannel.postMessage({ type: 'SETTINGS_UPDATED' });
                        syncChannel.close();
                    } else {
                        const errText = await res.text();
                        setToast({ message: `Lỗi khi xóa mẫu (${res.status}): ${errText}`, type: "error" });
                    }
                } catch (err) {
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
            setToast({ message: "Lỗi tải font!", type: "error" });
        } finally {
            setSaving(false);
        }
    };

    const handlePreviewBgUpload = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 8 * 1024 * 1024) {
            setToast({ message: "Kích thước ảnh mẫu quá lớn! Vui lòng chọn ảnh dưới 8MB.", type: "error" });
            return;
        }
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64data = reader.result;
            updateSetting('invoice_preview_bg_image', base64data);
            setToast({ message: "Đã tải ảnh phôi mẫu đối chiếu!", type: "success" });
        };
        reader.onerror = () => {
            setToast({ message: "Lỗi khi đọc file ảnh mẫu!", type: "error" });
        };
        reader.readAsDataURL(file);
    };

    // Filter matching tabs or search query highlights
    const isSearching = searchQuery.trim().length > 0;
    const query = searchQuery.toLowerCase().trim();

    return (
        <div className="flex min-h-screen font-sans bg-transparent text-slate-900 dark:text-slate-100">
            {customFontsStyle}

            {/* =========================================================================
                LEFT SIDEBAR: CONFIGURATION PANEL
                ========================================================================= */}
            <div className="w-[40%] min-w-[420px] max-w-[560px] border-r border-[#d4a574]/30 dark:border-white/10 bg-transparent h-screen sticky top-0 shadow-none z-20 no-print flex flex-col overflow-hidden">
                
                {/* Fixed Non-Scrolling Header Toolbar & Tabs */}
                <div className="p-3 border-b border-[#d4a574]/30 dark:border-white/10 bg-transparent backdrop-blur-md shrink-0 space-y-2 z-30">
                    
                    {/* Row 1: Template Selector + Action Buttons */}
                    <div className="flex items-center justify-between gap-1.5">
                        {/* Custom Template Select Dropdown */}
                        <CustomTemplateSelect
                            templates={templates}
                            selectedTemplate={selectedTemplate}
                            onSelect={selectTemplate}
                            disabled={loading}
                        />

                        {/* Template & Global Action Buttons */}
                        <div className="flex items-center gap-1 shrink-0">
                            <button
                                onClick={handleCreateNew}
                                disabled={loading}
                                className="w-8 h-8 flex items-center justify-center bg-transparent text-[#2d5016] dark:text-[#4ade80] border border-[#d4a574]/30 dark:border-white/10 rounded-xl hover:bg-[#d4a574]/15 transition-all disabled:opacity-50 shadow-none active:scale-95"
                                title="Thêm mẫu mới"
                            >
                                <Plus size={14} />
                            </button>

                            {selectedTemplate?.id && (
                                <>
                                    <button
                                        onClick={handleSetDefault}
                                        disabled={saving || loading || selectedTemplate.is_default}
                                        className={cn(
                                            "w-8 h-8 flex items-center justify-center border border-[#d4a574]/30 dark:border-white/10 rounded-xl transition-all shadow-none active:scale-95",
                                            selectedTemplate.is_default
                                                ? "text-amber-500 border-amber-500/40 bg-amber-500/10"
                                                : "bg-transparent text-[#8b6f47] dark:text-[#d4a574] hover:bg-[#d4a574]/15"
                                        )}
                                        title={selectedTemplate.is_default ? 'Mẫu mặc định' : 'Đặt làm mặc định'}
                                    >
                                        <Star size={14} className={selectedTemplate.is_default ? "fill-current" : ""} />
                                    </button>
                                    <button
                                        onClick={handleDelete}
                                        disabled={saving || loading}
                                        className="w-8 h-8 flex items-center justify-center bg-transparent text-rose-500 border border-[#d4a574]/30 dark:border-white/10 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all shadow-none active:scale-95"
                                        title="Xóa mẫu này"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </>
                            )}

                            <button
                                onClick={updateAllTemplatesShopInfo}
                                disabled={saving || loading}
                                className="w-8 h-8 flex items-center justify-center text-[#8b6f47] dark:text-[#d4a574] hover:bg-[#d4a574]/15 rounded-xl border border-[#d4a574]/30 dark:border-white/10 transition-all shadow-none active:scale-95"
                                title="Đồng bộ thông tin shop từ Cài đặt hệ thống"
                            >
                                <RefreshCw size={14} className={saving ? "animate-spin" : ""} />
                            </button>

                            <button
                                onClick={handleSave}
                                disabled={saving || loading}
                                className="h-8 px-3 bg-[#2d5016] hover:bg-[#1e3a0f] text-white rounded-xl active:scale-95 transition-all disabled:opacity-50 border border-white/20 shadow-none flex items-center gap-1.5 font-black text-xs uppercase tracking-wider"
                                title="Lưu (Ctrl+S)"
                            >
                                <Save size={13} />
                                <span>{saving ? '...' : 'Lưu'}</span>
                            </button>
                        </div>
                    </div>

                    {/* Row 2: Module Selection Pills with Lucide Icons */}
                    <div className="flex bg-[#d4a574]/10 dark:bg-slate-900/60 p-1 rounded-2xl border border-[#d4a574]/25 overflow-hidden gap-1">
                        {MODULES.map(m => {
                            const IconComponent = m.icon;
                            const isSelected = selectedModule === m.id;
                            return (
                                <button
                                    key={m.id}
                                    onClick={() => setSelectedModule(m.id)}
                                    className={cn(
                                        "flex-1 py-1.5 px-1.5 rounded-xl text-[9px] font-black tracking-wider uppercase transition-all duration-200 text-center flex items-center justify-center gap-1 truncate",
                                        isSelected
                                            ? "bg-[#2d5016] text-white shadow-none"
                                            : "text-[#8b6f47] dark:text-[#d4a574] hover:bg-[#d4a574]/15 hover:text-[#2d5016] dark:hover:text-white"
                                    )}
                                >
                                    <IconComponent size={12} className={cn("shrink-0", isSelected ? "text-white" : "text-[#8b6f47] dark:text-[#d4a574]")} />
                                    <span>{m.label}</span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Row 3: Search & 6 Tabs */}
                    <div className="space-y-1.5">
                        <div className="relative">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Tìm kiếm cài đặt (logo, font, lề, nợ, viền...)"
                                className="w-full bg-transparent border border-[#d4a574]/30 dark:border-white/10 rounded-xl pl-8 pr-7 py-1.5 text-xs font-bold text-[#2d5016] dark:text-emerald-50 placeholder:text-[#8b6f47]/50 dark:placeholder:text-slate-500 outline-none focus:border-[#2d5016] transition-all shadow-none"
                            />
                            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#8b6f47] dark:text-slate-400 pointer-events-none" />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8b6f47] hover:text-[#2d5016] dark:hover:text-white"
                                >
                                    <X size={13} />
                                </button>
                            )}
                        </div>

                        {/* 6 Tabs Bar */}
                        {!isSearching && (
                            <div className="grid grid-cols-6 gap-1 bg-[#d4a574]/10 dark:bg-slate-900/60 p-1 rounded-2xl border border-[#d4a574]/25 overflow-hidden">
                                {CONFIG_TABS.map(tab => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={cn(
                                            "py-1.5 px-0.5 rounded-xl text-center transition-all duration-200 flex flex-col items-center gap-1 group",
                                            activeTab === tab.id
                                                ? "bg-[#2d5016] text-white shadow-none font-black"
                                                : "text-[#8b6f47] dark:text-[#d4a574] hover:bg-[#d4a574]/15 hover:text-[#2d5016] dark:hover:text-white font-bold"
                                        )}
                                        title={tab.desc}
                                    >
                                        <tab.icon size={13} className={cn("transition-transform", activeTab === tab.id ? "scale-105" : "group-hover:scale-105")} />
                                        <span className="text-[8px] uppercase tracking-wider leading-none">{tab.label}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Scrollable Tab Contents Container */}
                <div className="p-3.5 space-y-3.5 flex-1 overflow-y-auto custom-scrollbar pb-32">

                    {/* =========================================================================
                        SEARCH RESULTS VIEW (When search active)
                        ========================================================================= */}
                    {isSearching && (
                        <div className="space-y-3.5 animate-in fade-in duration-200">
                            <div className="flex items-center justify-between px-1">
                                <span className="text-[11px] font-black text-[#8b6f47] dark:text-[#d4a574]">
                                    Kết quả tìm kiếm cho: <span className="text-[#2d5016] dark:text-[#4ade80] font-black">"{searchQuery}"</span>
                                </span>
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="text-[10px] text-[#2d5016] hover:underline font-black uppercase tracking-wider"
                                >
                                    Đóng tìm kiếm
                                </button>
                            </div>

                            {/* Search Sections */}
                            {(query.includes('khổ') || query.includes('giấy') || query.includes('paper') || query.includes('a4') || query.includes('a5') || query.includes('k80') || query.includes('k58')) && (
                                <DesignerSection title="Khổ giấy & Kích thước" icon={Layout}>
                                    <div className="grid grid-cols-2 gap-1.5">
                                        {PAPER_SIZES.map(p => (
                                            <button
                                                key={p.id}
                                                type="button"
                                                onClick={() => updateSetting('paper_size', p.id)}
                                                className={cn(
                                                    "p-2 rounded-xl text-left border transition-all flex items-center justify-between",
                                                    settings.paper_size === p.id
                                                        ? "bg-[#2d5016] text-white border-[#2d5016] shadow-none font-black"
                                                        : "border-[#d4a574]/30 hover:border-[#2d5016]/50 text-[#8b6f47] dark:text-[#d4a574]"
                                                )}
                                            >
                                                <div className="text-xs font-black">{p.label}</div>
                                                {settings.paper_size === p.id && <Check size={12} strokeWidth={3} className="text-white shrink-0" />}
                                            </button>
                                        ))}
                                    </div>
                                </DesignerSection>
                            )}

                            {(query.includes('lề') || query.includes('margin') || query.includes('padding') || query.includes('đệm')) && (
                                <DesignerSection title="Căn lề & Đệm lề" icon={Layout}>
                                    <ModernToggle
                                        label="Dùng lề mặc định máy in"
                                        subtitle="Bật để máy in tự điều chỉnh lề giấy"
                                        checked={settings.invoice_use_default_margins === 'true'}
                                        onChange={(v) => updateSetting('invoice_use_default_margins', v ? 'true' : 'false')}
                                    />
                                    <div className={cn("grid grid-cols-2 gap-2", settings.invoice_use_default_margins === 'true' && "opacity-30 pointer-events-none")}>
                                        <DesignerInput label="Lề Trên (mm)" value={settings.invoice_margin_top} onChange={(v) => updateSetting('invoice_margin_top', v)} type="number" />
                                        <DesignerInput label="Lề Dưới (mm)" value={settings.invoice_margin_bottom} onChange={(v) => updateSetting('invoice_margin_bottom', v)} type="number" />
                                        <DesignerInput label="Lề Trái (mm)" value={settings.invoice_margin_left} onChange={(v) => updateSetting('invoice_margin_left', v)} type="number" />
                                        <DesignerInput label="Lề Phải (mm)" value={settings.invoice_margin_right} onChange={(v) => updateSetting('invoice_margin_right', v)} type="number" />
                                    </div>
                                    <SliderWithInput
                                        label="Đệm lề trên khi in (Padding Top)"
                                        subtitle="Khoảng cách từ mép giấy trên cùng"
                                        value={settings.invoice_padding_top || '0'}
                                        onChange={(v) => updateSetting('invoice_padding_top', v)}
                                        min={0}
                                        max={50}
                                        unit="mm"
                                    />
                                </DesignerSection>
                            )}

                            {(query.includes('logo') || query.includes('tên shop') || query.includes('cửa hàng') || query.includes('địa chỉ') || query.includes('điện thoại') || query.includes('sđt') || query.includes('ngân hàng') || query.includes('stk')) && (
                                <DesignerSection title="Thông tin Cửa hàng" icon={Layers}>
                                    <ModernToggle label="Hiện Logo cửa hàng" checked={settings.invoice_show_logo === 'true'} onChange={(v) => updateSetting('invoice_show_logo', v ? 'true' : 'false')} />
                                    <DesignerInput label="Tên cửa hàng" value={settings.shop_name} onChange={(v) => updateSetting('shop_name', v)} />
                                    <DesignerInput label="Địa chỉ" value={settings.shop_address} onChange={(v) => updateSetting('shop_address', v)} />
                                    <DesignerInput label="Số điện thoại" value={settings.shop_phone} onChange={(v) => updateSetting('shop_phone', v)} />
                                    <ModernToggle label="Hiện STK Ngân hàng" checked={settings.invoice_show_bank_info === 'true'} onChange={(v) => updateSetting('invoice_show_bank_info', v ? 'true' : 'false')} />
                                    <div className="grid grid-cols-2 gap-2">
                                        <DesignerInput label="Tên ngân hàng" value={settings.shop_bank} onChange={(v) => updateSetting('shop_bank', v)} placeholder="MB Bank, VCB..." />
                                        <DesignerInput label="Số tài khoản" value={settings.shop_bank_account} onChange={(v) => updateSetting('shop_bank_account', v)} />
                                    </div>
                                    <DesignerInput label="Chủ tài khoản" value={settings.shop_bank_user} onChange={(v) => updateSetting('shop_bank_user', v)} />
                                </DesignerSection>
                            )}

                            {(query.includes('tiêu đề') || query.includes('title') || query.includes('badge')) && (
                                <DesignerSection title="Tiêu đề Hóa đơn" icon={Layers}>
                                    <ModernToggle label="Hiện Tiêu đề" checked={settings.invoice_show_title !== 'false'} onChange={(v) => updateSetting('invoice_show_title', v ? 'true' : 'false')} />
                                    <DesignerInput label="Tiêu đề tùy chỉnh" value={settings.invoice_custom_title} onChange={(v) => updateSetting('invoice_custom_title', v)} placeholder="HÓA ĐƠN BÁN HÀNG" />
                                    <SliderWithInput label="Cỡ chữ tiêu đề" value={settings.invoice_title_size || '22'} onChange={(v) => updateSetting('invoice_title_size', v)} min={12} max={40} unit="px" />
                                    <ModernToggle label="Viền khung (Badge) tiêu đề" checked={settings.invoice_title_badge === 'true'} onChange={(v) => updateSetting('invoice_title_badge', v ? 'true' : 'false')} />
                                </DesignerSection>
                            )}

                            {(query.includes('khách') || query.includes('đối tác') || query.includes('ngày') || query.includes('giờ') || query.includes('mã')) && (
                                <DesignerSection title="Thông tin Đối tác & Chứng từ" icon={Layers}>
                                    <ModernToggle label="Hiện Thông tin đối tác (Khách hàng)" checked={settings.invoice_show_customer_info === 'true'} onChange={(v) => updateSetting('invoice_show_customer_info', v ? 'true' : 'false')} />
                                    <ModernToggle label="Ẩn mã đối tác (#ID)" checked={settings.invoice_hide_customer_id === 'true'} onChange={(v) => updateSetting('invoice_hide_customer_id', v ? 'true' : 'false')} />
                                    <ModernToggle label="Hiện Mã số hóa đơn" checked={settings.invoice_show_id === 'true'} onChange={(v) => updateSetting('invoice_show_id', v ? 'true' : 'false')} />
                                    <ModernToggle label="Hiện Ngày hóa đơn" checked={settings.invoice_show_date === 'true'} onChange={(v) => updateSetting('invoice_show_date', v ? 'true' : 'false')} />
                                    <ModernToggle label="Kèm Giờ in (hh:mm:ss)" checked={settings.invoice_show_time !== 'false'} onChange={(v) => updateSetting('invoice_show_time', v ? 'true' : 'false')} />
                                </DesignerSection>
                            )}

                            {(query.includes('nợ') || query.includes('tiền') || query.includes('thanh toán') || query.includes('còn lại') || query.includes('thối') || query.includes('đưa')) && (
                                <DesignerSection title="Tổng tiền & Công nợ" icon={CreditCard}>
                                    <ModernToggle label="Hiện Tổng tiền" checked={settings.invoice_show_total_amount === 'true'} onChange={(v) => updateSetting('invoice_show_total_amount', v ? 'true' : 'false')} />
                                    <ModernToggle label="Hiện Nợ cũ" checked={settings.invoice_show_old_debt === 'true'} onChange={(v) => updateSetting('invoice_show_old_debt', v ? 'true' : 'false')} />
                                    <ModernToggle label="Hiện Thanh toán" checked={settings.invoice_show_paid === 'true'} onChange={(v) => updateSetting('invoice_show_paid', v ? 'true' : 'false')} />
                                    <ModernToggle label="Hiện Còn lại" checked={settings.invoice_show_balance === 'true'} onChange={(v) => updateSetting('invoice_show_balance', v ? 'true' : 'false')} />
                                    <ModernToggle label="Hiện Khách đưa" checked={settings.invoice_show_cash_given === 'true'} onChange={(v) => updateSetting('invoice_show_cash_given', v ? 'true' : 'false')} />
                                    <ModernToggle label="Hiện Tiền thối" checked={settings.invoice_show_change === 'true'} onChange={(v) => updateSetting('invoice_show_change', v ? 'true' : 'false')} />
                                    <ModernToggle label="Ẩn nợ cũ khi thu tiền mặt" checked={settings.invoice_hide_old_debt_on_cash === 'true'} onChange={(v) => updateSetting('invoice_hide_old_debt_on_cash', v ? 'true' : 'false')} />
                                </DesignerSection>
                            )}

                            {(query.includes('font') || query.includes('chữ') || query.includes('cỡ') || query.includes('size')) && (
                                <DesignerSection title="Font chữ & Kích thước" icon={Type}>
                                    <button
                                        type="button"
                                        onClick={() => setShowGoogleFontModal(true)}
                                        className="w-full py-2 px-3 bg-[#2d5016] text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-between shadow-none"
                                    >
                                        <span className="flex items-center gap-1.5"><Search size={12} /> Mở kho Google Fonts Tiếng Việt (60+ font)</span>
                                        <span className="text-[10px] opacity-90">Chọn &gt;</span>
                                    </button>
                                    <SliderWithInput label="Cỡ chữ tiêu đề" value={settings.invoice_title_size || '22'} onChange={(v) => updateSetting('invoice_title_size', v)} min={12} max={40} unit="px" />
                                    <SliderWithInput label="Cỡ chữ tên shop" value={settings.invoice_store_name_size || '24'} onChange={(v) => updateSetting('invoice_store_name_size', v)} min={12} max={40} unit="px" />
                                    <SliderWithInput label="Cỡ chữ thông tin khách" value={settings.invoice_customer_info_size || '12'} onChange={(v) => updateSetting('invoice_customer_info_size', v)} min={8} max={24} unit="px" />
                                    <SliderWithInput label="Cỡ chữ header bảng" value={settings.invoice_table_header_size || '12'} onChange={(v) => updateSetting('invoice_table_header_size', v)} min={8} max={24} unit="px" />
                                    <SliderWithInput label="Cỡ chữ nội dung bảng" value={settings.invoice_table_content_size || '12'} onChange={(v) => updateSetting('invoice_table_content_size', v)} min={8} max={24} unit="px" />
                                    <SliderWithInput label="Cỡ chữ dòng tổng tiền" value={settings.invoice_total_line_size || '18'} onChange={(v) => updateSetting('invoice_total_line_size', v)} min={10} max={36} unit="px" />
                                </DesignerSection>
                            )}

                            {(query.includes('màu') || query.includes('color') || query.includes('palette')) && (
                                <DesignerSection title="Bảng phối màu" icon={Palette}>
                                    <div className="grid grid-cols-2 gap-2">
                                        <EnhancedColorPicker label="Thông tin shop" value={settings.invoice_color_store_info} onChange={v => updateSetting('invoice_color_store_info', v)} />
                                        <EnhancedColorPicker label="Tiêu đề mẫu in" value={settings.invoice_color_title} onChange={v => updateSetting('invoice_color_title', v)} />
                                        <EnhancedColorPicker label="Thông tin khách" value={settings.invoice_color_customer_info} onChange={v => updateSetting('invoice_color_customer_info', v)} />
                                        <EnhancedColorPicker label="Tiêu đề bảng" value={settings.invoice_color_table_header} onChange={v => updateSetting('invoice_color_table_header', v)} />
                                        <EnhancedColorPicker label="Nội dung hàng" value={settings.invoice_color_table_body} onChange={v => updateSetting('invoice_color_table_body', v)} />
                                        <EnhancedColorPicker label="Nhãn tổng tiền" value={settings.invoice_color_total_label} onChange={v => updateSetting('invoice_color_total_label', v)} />
                                    </div>
                                </DesignerSection>
                            )}
                        </div>
                    )}

                    {/* =========================================================================
                        TAB 1: BỐ CỤC & TRANG (Page & Layout)
                        ========================================================================= */}
                    {!isSearching && activeTab === 'layout' && (
                        <div className="space-y-4 animate-in fade-in duration-200">
                            
                            {/* Khổ giấy */}
                            <DesignerSection title="Khổ Giấy & Kích Thước" icon={Layout} subtitle="Chọn khổ giấy chuẩn hoặc nhập kích thước tùy chỉnh">
                                <div className="grid grid-cols-2 gap-1.5">
                                    {PAPER_SIZES.map(p => (
                                        <button
                                            key={p.id}
                                            type="button"
                                            onClick={() => updateSetting('paper_size', p.id)}
                                            className={cn(
                                                "p-2 rounded-xl text-left border transition-all flex items-center justify-between",
                                                settings.paper_size === p.id
                                                    ? "bg-[#2d5016] text-white border-[#2d5016] shadow-none"
                                                    : "bg-transparent border-[#d4a574]/30 dark:border-white/10 hover:border-[#2d5016]/50 text-[#8b6f47] dark:text-[#d4a574] hover:bg-[#d4a574]/10"
                                            )}
                                        >
                                            <div>
                                                <div className={cn("text-xs font-black", settings.paper_size === p.id ? "text-white" : "text-[#2d5016] dark:text-emerald-50")}>
                                                    {p.id}
                                                </div>
                                                <p className={cn("text-[8.5px] font-medium opacity-80 mt-0.5", settings.paper_size === p.id ? "text-white/90" : "text-[#8b6f47]/80 dark:text-slate-400")}>
                                                    {p.label.replace(p.id, '').replace(/^\s*[\(]/, '').replace(/[\)]$/, '')}
                                                </p>
                                            </div>
                                            {settings.paper_size === p.id && <Check size={12} strokeWidth={3} className="text-white shrink-0" />}
                                        </button>
                                    ))}
                                </div>

                                {settings.paper_size === 'CUSTOM' && (
                                    <div className="p-2.5 bg-transparent rounded-xl border border-[#d4a574]/30 dark:border-white/10 space-y-2">
                                        <div className="flex items-center justify-between text-[10px] font-black text-[#8b6f47] dark:text-[#d4a574] uppercase tracking-wider">
                                            <span>Kích thước tùy chỉnh (mm)</span>
                                            <span className="text-[9px] font-medium opacity-80">Rộng x Cao</span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <DesignerInput
                                                label="Chiều rộng (mm)"
                                                value={settings.invoice_custom_width || '210'}
                                                onChange={(v) => updateSetting('invoice_custom_width', v)}
                                                type="number"
                                                placeholder="210"
                                            />
                                            <DesignerInput
                                                label="Chiều cao (mm)"
                                                subtitle="0 = Tự động"
                                                value={settings.invoice_custom_height || '297'}
                                                onChange={(v) => updateSetting('invoice_custom_height', v)}
                                                type="number"
                                                placeholder="297"
                                            />
                                        </div>
                                    </div>
                                )}
                            </DesignerSection>

                            {/* Hướng in & Giãn dòng */}
                            <DesignerSection title="Hướng In & Giãn Dòng Trang" icon={Sliders}>
                                <SegmentedControl
                                    label="Hướng in trang"
                                    value={settings.invoice_orientation || 'portrait'}
                                    onChange={(v) => updateSetting('invoice_orientation', v)}
                                    options={[
                                        { id: 'portrait', label: 'In Dọc (Portrait)', icon: FileText },
                                        { id: 'landscape', label: 'In Ngang (Landscape)', icon: FileCheck }
                                    ]}
                                />
                                <SliderWithInput
                                    label="Độ giãn dòng toàn trang (Line Spacing)"
                                    value={settings.invoice_line_spacing || '1.4'}
                                    onChange={(v) => updateSetting('invoice_line_spacing', v)}
                                    min={1.0}
                                    max={2.5}
                                    step={0.05}
                                    unit=""
                                    presets={[
                                        { label: 'Gọn (1.2)', value: '1.2' },
                                        { label: 'Chuẩn (1.4)', value: '1.4' },
                                        { label: 'Thoáng (1.6)', value: '1.6' }
                                    ]}
                                />
                            </DesignerSection>

                            {/* Căn lề & Đệm lề */}
                            <DesignerSection title="Căn Lề Trang & Đệm Đỉnh" icon={Layout} subtitle="Căn chỉnh khoảng cách mép giấy khi in">
                                <ModernToggle
                                    label="Dùng lề mặc định máy in"
                                    subtitle="Bỏ chọn để tùy chỉnh lề thủ công 4 hướng (mm)"
                                    checked={settings.invoice_use_default_margins === 'true'}
                                    onChange={(v) => updateSetting('invoice_use_default_margins', v ? 'true' : 'false')}
                                />

                                <div className={cn("grid grid-cols-2 gap-2.5 transition-all", settings.invoice_use_default_margins === 'true' && "opacity-30 pointer-events-none")}>
                                    <DesignerInput label="Lề Trên (mm)" value={settings.invoice_margin_top} onChange={(v) => updateSetting('invoice_margin_top', v)} type="number" />
                                    <DesignerInput label="Lề Dưới (mm)" value={settings.invoice_margin_bottom} onChange={(v) => updateSetting('invoice_margin_bottom', v)} type="number" />
                                    <DesignerInput label="Lề Trái (mm)" value={settings.invoice_margin_left} onChange={(v) => updateSetting('invoice_margin_left', v)} type="number" />
                                    <DesignerInput label="Lề Phải (mm)" value={settings.invoice_margin_right} onChange={(v) => updateSetting('invoice_margin_right', v)} type="number" />
                                </div>

                                <SliderWithInput
                                    label="Đệm lề trên khi in (Padding Top)"
                                    subtitle="Cách mép giấy trên cùng, độc lập với lề máy in"
                                    value={settings.invoice_padding_top || '0'}
                                    onChange={(v) => updateSetting('invoice_padding_top', v)}
                                    min={0}
                                    max={50}
                                    step={1}
                                    unit="mm"
                                />
                            </DesignerSection>

                            {/* Đa trang & Lặp lại Header */}
                            <DesignerSection title="Đa Trang & Lặp Lại Header" icon={Layers} subtitle="Cấu hình cho hóa đơn / báo cáo dài nhiều trang">
                                <ModernToggle
                                    label="Lặp lại Header trên mỗi trang"
                                    subtitle="Tự động in lại tiêu đề & thông tin khách trên các trang tiếp theo"
                                    checked={settings.invoice_repeat_header === 'true'}
                                    onChange={(v) => updateSetting('invoice_repeat_header', v ? 'true' : 'false')}
                                />

                                {settings.invoice_repeat_header === 'true' && (
                                    <div className="pl-3 border-l-2 border-[#4a7c59]/40 space-y-3 pt-1">
                                        <SegmentedControl
                                            label="Kiểu lặp lại Header"
                                            value={settings.invoice_repeat_header_mode || 'full'}
                                            onChange={(v) => updateSetting('invoice_repeat_header_mode', v)}
                                            options={[
                                                { id: 'full', label: 'Đầy đủ (Shop + Tiêu đề + Khách)' },
                                                { id: 'compact', label: 'Rút gọn (Khách + Mã + Ngày)' }
                                            ]}
                                        />
                                    </div>
                                )}

                                <div className="pt-2 border-t border-border">
                                    <ModernToggle
                                        label="Đánh số trang (Trang 1/2...)"
                                        subtitle="Hiển thị chỉ số trang ở góc dưới bản in"
                                        checked={settings.invoice_show_page_number === 'true'}
                                        onChange={(v) => updateSetting('invoice_show_page_number', v ? 'true' : 'false')}
                                    />

                                    {settings.invoice_show_page_number === 'true' && (
                                        <div className="pl-3 border-l-2 border-[#4a7c59]/40 space-y-3 pt-2">
                                            <SegmentedControl
                                                label="Vị trí số trang"
                                                value={settings.invoice_page_number_position || 'bottom-right'}
                                                onChange={(v) => updateSetting('invoice_page_number_position', v)}
                                                options={[
                                                    { id: 'bottom-left', label: 'Dưới Trái' },
                                                    { id: 'bottom-center', label: 'Dưới Giữa' },
                                                    { id: 'bottom-right', label: 'Dưới Phải' }
                                                ]}
                                            />
                                            <SegmentedControl
                                                label="Định dạng số trang"
                                                value={settings.invoice_page_number_format || 'page_total'}
                                                onChange={(v) => updateSetting('invoice_page_number_format', v)}
                                                options={[
                                                    { id: 'page_total', label: 'Trang X/Y (Trang 1/2)' },
                                                    { id: 'page_only', label: 'Chỉ số trang (Trang 1)' }
                                                ]}
                                            />
                                            <div className="grid grid-cols-2 gap-2.5">
                                                <DesignerInput
                                                    label="Cỡ chữ số trang (px)"
                                                    type="number"
                                                    value={settings.invoice_page_number_size || '10'}
                                                    onChange={(v) => updateSetting('invoice_page_number_size', v)}
                                                />
                                                <EnhancedColorPicker
                                                    label="Màu số trang"
                                                    value={settings.invoice_page_number_color || '#64748b'}
                                                    onChange={(v) => updateSetting('invoice_page_number_color', v)}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </DesignerSection>

                            {/* Phôi nền đối chiếu xem trước */}
                            <DesignerSection title="Phôi Hóa Đơn Đối Chiếu" icon={ImageIcon} subtitle="Chỉ hiển thị trên màn hình xem trước để căn chỉnh">
                                <div>
                                    <input
                                        type="file"
                                        id="preview-bg-upload-layout-tab"
                                        accept="image/*"
                                        onChange={handlePreviewBgUpload}
                                        className="hidden"
                                    />
                                    <label
                                        htmlFor="preview-bg-upload-layout-tab"
                                        className="w-full flex items-center justify-center gap-2 p-3 bg-[#d4a574]/10 dark:bg-slate-800/40 text-[#8b6f47] dark:text-[#d4a574] border border-[#d4a574]/30 hover:bg-[#d4a574]/20 rounded-2xl cursor-pointer text-xs font-black uppercase tracking-wider transition-all shadow-none"
                                    >
                                        <Upload size={14} /> Tải ảnh phôi scan mẫu lên
                                    </label>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-[#8b6f47] dark:text-[#d4a574]/60 uppercase tracking-widest block ml-1">Mẫu phôi áp dụng:</label>
                                    <select
                                        value={
                                            !settings.invoice_preview_bg_image || settings.invoice_preview_bg_image === 'none'
                                                ? 'none'
                                                : (settings.invoice_preview_bg_image === 'a5_template.png' ? 'a5_template.png' : 'custom')
                                        }
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            if (val === 'none') {
                                                updateSetting('invoice_preview_bg_image', 'none');
                                            } else if (val === 'a5_template.png') {
                                                updateSetting('invoice_preview_bg_image', 'a5_template.png');
                                            }
                                        }}
                                        className="w-full text-xs bg-transparent border border-border rounded-xl px-3.5 py-2.5 text-[#8b6f47] dark:text-slate-200 font-black outline-none"
                                    >
                                        <option value="none" className="dark:bg-slate-900">Không sử dụng (Nền trắng tinh)</option>
                                        <option value="a5_template.png" className="dark:bg-slate-900">Mẫu phôi in sẵn A5 Syngenta</option>
                                        {settings.invoice_preview_bg_image && settings.invoice_preview_bg_image !== 'none' && settings.invoice_preview_bg_image !== 'a5_template.png' && (
                                            <option value="custom" className="dark:bg-slate-900">Ảnh phôi bạn vừa tải lên</option>
                                        )}
                                    </select>
                                </div>

                                {settings.invoice_preview_bg_image && settings.invoice_preview_bg_image !== 'none' && (
                                    <SliderWithInput
                                        label="Độ mờ / hiển thị phôi nền"
                                        value={settings.invoice_preview_bg_opacity || '0.45'}
                                        onChange={(v) => updateSetting('invoice_preview_bg_opacity', v)}
                                        min={0.1}
                                        max={1.0}
                                        step={0.05}
                                        unit=""
                                    />
                                )}
                            </DesignerSection>
                        </div>
                    )}

                    {/* =========================================================================
                        TAB 2: ĐẦU TRANG & SHOP (Header & Shop)
                        ========================================================================= */}
                    {!isSearching && activeTab === 'header' && (
                        <div className="space-y-6 animate-in fade-in duration-200">
                            
                            {/* Thông tin Shop & Logo */}
                            <DesignerSection title="Thông Tin Cửa Hàng & Logo" icon={Home} subtitle="Thông tin định danh của trang trại / cửa hàng">
                                <div className="space-y-3">
                                    <ModernToggle
                                        label="Hiện Logo Cửa hàng"
                                        checked={settings.invoice_show_logo === 'true'}
                                        onChange={(v) => updateSetting('invoice_show_logo', v ? 'true' : 'false')}
                                    />

                                    {settings.invoice_show_logo === 'true' && (
                                        <div className="p-3 bg-[#d4a574]/5 dark:bg-slate-800/30 rounded-2xl border border-border flex items-center justify-between">
                                            <div className="flex items-center gap-2.5">
                                                {settings.invoice_logo_url ? (
                                                    <img src={settings.invoice_logo_url} alt="Logo" className="w-9 h-9 object-contain rounded-xl border border-border" />
                                                ) : (
                                                    <div className="w-9 h-9 rounded-xl bg-[#d4a574]/15 flex items-center justify-center text-[#8b6f47]">
                                                        <ImageIcon size={18} />
                                                    </div>
                                                )}
                                                <span className="text-xs font-black text-[#8b6f47] dark:text-[#d4a574]">Logo thương hiệu</span>
                                            </div>
                                            <div>
                                                <input type="file" id="logo-upload-tab" className="hidden" accept="image/*" onChange={handleLogoUpload} />
                                                <label htmlFor="logo-upload-tab" className="px-3.5 py-1.5 bg-gradient-to-r from-[#2d5016] to-[#4a7c59] text-white rounded-xl text-xs font-black cursor-pointer hover:brightness-110 transition-all flex items-center gap-1.5 shadow-none">
                                                    <Upload size={13} /> Tải logo
                                                </label>
                                            </div>
                                        </div>
                                    )}

                                    <div className="pt-2 space-y-3">
                                        <ModernToggle
                                            label="Hiện Tên Cửa hàng"
                                            checked={settings.invoice_show_shop_name === 'true'}
                                            onChange={(v) => updateSetting('invoice_show_shop_name', v ? 'true' : 'false')}
                                        />
                                        {settings.invoice_show_shop_name === 'true' && (
                                            <DesignerInput
                                                label="Tên cửa hàng / Nhà vườn"
                                                value={settings.shop_name}
                                                onChange={(v) => updateSetting('shop_name', v)}
                                                placeholder="Cửa hàng VTNN Lyang Nghĩa"
                                            />
                                        )}

                                        <ModernToggle
                                            label="Hiện Địa chỉ Cửa hàng"
                                            checked={settings.invoice_show_address === 'true'}
                                            onChange={(v) => updateSetting('invoice_show_address', v ? 'true' : 'false')}
                                        />
                                        {settings.invoice_show_address === 'true' && (
                                            <DesignerInput
                                                label="Địa chỉ"
                                                value={settings.shop_address}
                                                onChange={(v) => updateSetting('shop_address', v)}
                                                placeholder="QL1A, Cai Lậy, Tiền Giang"
                                            />
                                        )}

                                        <ModernToggle
                                            label="Hiện Số điện thoại Shop"
                                            checked={settings.invoice_show_phone === 'true'}
                                            onChange={(v) => updateSetting('invoice_show_phone', v ? 'true' : 'false')}
                                        />
                                        {settings.invoice_show_phone === 'true' && (
                                            <DesignerInput
                                                label="Số điện thoại"
                                                value={settings.shop_phone}
                                                onChange={(v) => updateSetting('shop_phone', v)}
                                                placeholder="0901 234 567"
                                            />
                                        )}

                                        <ModernToggle
                                            label="Hiện STK Ngân hàng"
                                            checked={settings.invoice_show_bank_info === 'true'}
                                            onChange={(v) => updateSetting('invoice_show_bank_info', v ? 'true' : 'false')}
                                        />
                                        {settings.invoice_show_bank_info === 'true' && (
                                            <div className="p-3.5 bg-[#d4a574]/5 dark:bg-slate-800/30 rounded-2xl border border-border space-y-2.5">
                                                <div className="grid grid-cols-2 gap-2.5">
                                                    <DesignerInput label="Tên ngân hàng" value={settings.shop_bank} onChange={(v) => updateSetting('shop_bank', v)} placeholder="MB Bank, VCB..." />
                                                    <DesignerInput label="Số tài khoản" value={settings.shop_bank_account} onChange={(v) => updateSetting('shop_bank_account', v)} placeholder="0123456789" />
                                                </div>
                                                <DesignerInput label="Chủ tài khoản" value={settings.shop_bank_user} onChange={(v) => updateSetting('shop_bank_user', v)} placeholder="NGUYEN VAN A" />
                                            </div>
                                        )}

                                        <SliderWithInput
                                            label="Khoảng cách đầu trang (Header Spacing)"
                                            value={settings.invoice_header_spacing || '10'}
                                            onChange={(v) => updateSetting('invoice_header_spacing', v)}
                                            min={0}
                                            max={50}
                                            unit="px"
                                        />
                                    </div>
                                </div>
                            </DesignerSection>

                            {/* Tiêu đề Hóa đơn */}
                            <DesignerSection title="Tiêu Đề Mẫu In" icon={FileText} subtitle="Tiêu đề chính và kiểu viền khung (Badge)">
                                <ModernToggle
                                    label="Hiện Tiêu đề hóa đơn"
                                    checked={settings.invoice_show_title !== 'false'}
                                    onChange={(v) => updateSetting('invoice_show_title', v ? 'true' : 'false')}
                                />

                                {settings.invoice_show_title !== 'false' && (
                                    <div className="space-y-3.5">
                                        <DesignerInput
                                            label="Tiêu đề tùy chỉnh"
                                            value={settings.invoice_custom_title}
                                            onChange={(v) => updateSetting('invoice_custom_title', v)}
                                            placeholder="Để trống để dùng tiêu đề tự động"
                                        />
                                        <SliderWithInput
                                            label="Cỡ chữ tiêu đề"
                                            value={settings.invoice_title_size || '22'}
                                            onChange={(v) => updateSetting('invoice_title_size', v)}
                                            min={12}
                                            max={40}
                                            unit="px"
                                        />

                                        <div className="pt-2 border-t border-border space-y-3">
                                            <ModernToggle
                                                label="Viền khung bo tròn (Badge) tiêu đề"
                                                subtitle="Tạo nền màu và viền nổi bật cho tiêu đề hóa đơn"
                                                checked={settings.invoice_title_badge === 'true'}
                                                onChange={(v) => updateSetting('invoice_title_badge', v ? 'true' : 'false')}
                                            />

                                            {settings.invoice_title_badge === 'true' && (
                                                <div className="p-3.5 bg-[#d4a574]/5 dark:bg-slate-800/30 rounded-2xl border border-border space-y-3 animate-in fade-in duration-200">
                                                    <div className="grid grid-cols-2 gap-2.5">
                                                        <EnhancedColorPicker label="Màu nền Badge" value={settings.invoice_title_badge_bg || '#2d5016'} onChange={v => updateSetting('invoice_title_badge_bg', v)} />
                                                        <EnhancedColorPicker label="Màu viền Badge" value={settings.invoice_title_badge_border || '#86efac'} onChange={v => updateSetting('invoice_title_badge_border', v)} />
                                                    </div>
                                                    <EnhancedColorPicker label="Màu chữ tiêu đề" value={settings.invoice_title_badge_text_color || '#ffffff'} onChange={v => updateSetting('invoice_title_badge_text_color', v)} />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </DesignerSection>

                            {/* Thông tin Khách hàng & Chứng từ */}
                            <DesignerSection title="Khách Hàng & Thông Tin Chứng Từ" icon={Shield} subtitle="Mã hóa đơn, ngày lập và thông tin khách">
                                <ModernToggle
                                    label="Hiện Thông tin đối tác (Khách hàng)"
                                    checked={settings.invoice_show_customer_info === 'true'}
                                    onChange={(v) => updateSetting('invoice_show_customer_info', v ? 'true' : 'false')}
                                />

                                {settings.invoice_show_customer_info === 'true' && (
                                    <div className="pl-3 border-l-2 border-[#4a7c59]/40 space-y-2">
                                        <ModernToggle
                                            label="Ẩn mã đối tác (#ID)"
                                            subtitle="Chỉ hiện tên khách, SĐT, địa chỉ mà không hiện mã ID"
                                            checked={settings.invoice_hide_customer_id === 'true'}
                                            onChange={(v) => updateSetting('invoice_hide_customer_id', v ? 'true' : 'false')}
                                        />
                                    </div>
                                )}

                                <div className="pt-2 border-t border-border space-y-2">
                                    <ModernToggle
                                        label="Hiện Mã số hóa đơn"
                                        checked={settings.invoice_show_id === 'true'}
                                        onChange={(v) => updateSetting('invoice_show_id', v ? 'true' : 'false')}
                                    />
                                    <ModernToggle
                                        label="Hiện Ngày hóa đơn"
                                        checked={settings.invoice_show_date === 'true'}
                                        onChange={(v) => updateSetting('invoice_show_date', v ? 'true' : 'false')}
                                    />
                                    {settings.invoice_show_date === 'true' && (
                                        <div className="pl-3 border-l-2 border-[#4a7c59]/40">
                                            <ModernToggle
                                                label="Kèm Giờ in (hh:mm:ss)"
                                                subtitle="Tắt để chỉ in ngày (DD/MM/YYYY)"
                                                checked={settings.invoice_show_time !== 'false'}
                                                onChange={(v) => updateSetting('invoice_show_time', v ? 'true' : 'false')}
                                            />
                                        </div>
                                    )}
                                </div>

                                <SliderWithInput
                                    label="Cỡ chữ thông tin khách / chung"
                                    value={settings.invoice_customer_info_size || '12'}
                                    onChange={(v) => updateSetting('invoice_customer_info_size', v)}
                                    min={8}
                                    max={24}
                                    unit="px"
                                />
                            </DesignerSection>
                        </div>
                    )}

                    {/* =========================================================================
                        TAB 3: BẢNG HÀNG HÓA (Table & Columns)
                        ========================================================================= */}
                    {!isSearching && activeTab === 'table' && (
                        <div className="space-y-6 animate-in fade-in duration-200">
                            
                            {/* Cột hiển thị & Độ rộng cột */}
                            <DesignerSection title="Cột Bảng & Độ Rộng (px)" icon={Columns} subtitle="Bật/tắt cột và chỉnh độ rộng px tương ứng">
                                <div className="space-y-2.5">
                                    <ColumnConfigRow
                                        label="STT (Số thứ tự)"
                                        visible={settings.invoice_show_col_stt === 'true'}
                                        onToggleVisible={(v) => updateSetting('invoice_show_col_stt', v ? 'true' : 'false')}
                                        width={settings.invoice_col_stt}
                                        onWidthChange={(w) => updateSetting('invoice_col_stt', w)}
                                    />

                                    {selectedModule === 'Report' ? (
                                        <>
                                            <ColumnConfigRow
                                                label="Mã Đơn"
                                                visible={settings.invoice_show_col_code === 'true'}
                                                onToggleVisible={(v) => updateSetting('invoice_show_col_code', v ? 'true' : 'false')}
                                                width={settings.invoice_col_code}
                                                onWidthChange={(w) => updateSetting('invoice_col_code', w)}
                                            />
                                            <ColumnConfigRow
                                                label="Ngày lập"
                                                visible={settings.invoice_show_col_date === 'true'}
                                                onToggleVisible={(v) => updateSetting('invoice_show_col_date', v ? 'true' : 'false')}
                                                width={settings.invoice_col_date}
                                                onWidthChange={(w) => updateSetting('invoice_col_date', w)}
                                            />
                                            <ColumnConfigRow
                                                label="Phương thức thanh toán (PTTT)"
                                                visible={settings.invoice_show_col_method === 'true'}
                                                onToggleVisible={(v) => updateSetting('invoice_show_col_method', v ? 'true' : 'false')}
                                                width={settings.invoice_col_method}
                                                onWidthChange={(w) => updateSetting('invoice_col_method', w)}
                                            />
                                        </>
                                    ) : selectedModule === 'PartnerLedger' ? (
                                        <>
                                            <ColumnConfigRow
                                                label="Ghi nợ (+)"
                                                visible={true}
                                                width={settings.invoice_col_ledger_increase || '90'}
                                                onWidthChange={(w) => updateSetting('invoice_col_ledger_increase', w)}
                                            />
                                            <ColumnConfigRow
                                                label="Thanh toán / Trả (-)"
                                                visible={true}
                                                width={settings.invoice_col_ledger_decrease || '90'}
                                                onWidthChange={(w) => updateSetting('invoice_col_ledger_decrease', w)}
                                            />
                                            <ColumnConfigRow
                                                label="Dư nợ chạy"
                                                visible={true}
                                                width={settings.invoice_col_ledger_balance || '100'}
                                                onWidthChange={(w) => updateSetting('invoice_col_ledger_balance', w)}
                                            />
                                            <ColumnConfigRow
                                                label="Nội dung"
                                                visible={true}
                                                width={settings.invoice_col_content || 'auto'}
                                                onWidthChange={(w) => updateSetting('invoice_col_content', w)}
                                            />
                                        </>
                                    ) : (
                                        <>
                                            <ColumnConfigRow
                                                label="Tên sản phẩm / Hàng hóa"
                                                visible={settings.invoice_show_col_name === 'true'}
                                                onToggleVisible={(v) => updateSetting('invoice_show_col_name', v ? 'true' : 'false')}
                                                width={settings.invoice_col_name}
                                                onWidthChange={(w) => updateSetting('invoice_col_name', w)}
                                            />
                                            <ColumnConfigRow
                                                label="Đơn vị tính (ĐVT)"
                                                visible={settings.invoice_show_col_unit === 'true'}
                                                onToggleVisible={(v) => updateSetting('invoice_show_col_unit', v ? 'true' : 'false')}
                                                width={settings.invoice_col_unit}
                                                onWidthChange={(w) => updateSetting('invoice_col_unit', w)}
                                            />
                                            <ColumnConfigRow
                                                label="Số lượng"
                                                visible={settings.invoice_show_col_qty === 'true'}
                                                onToggleVisible={(v) => updateSetting('invoice_show_col_qty', v ? 'true' : 'false')}
                                                width={settings.invoice_col_qty}
                                                onWidthChange={(w) => updateSetting('invoice_col_qty', w)}
                                            />
                                            <ColumnConfigRow
                                                label="Đơn giá"
                                                visible={settings.invoice_show_col_price === 'true'}
                                                onToggleVisible={(v) => updateSetting('invoice_show_col_price', v ? 'true' : 'false')}
                                                width={settings.invoice_col_price}
                                                onWidthChange={(w) => updateSetting('invoice_col_price', w)}
                                            />
                                        </>
                                    )}

                                    <ColumnConfigRow
                                        label="Thành tiền"
                                        visible={settings.invoice_show_col_total === 'true'}
                                        onToggleVisible={(v) => updateSetting('invoice_show_col_total', v ? 'true' : 'false')}
                                        width={settings.invoice_col_total}
                                        onWidthChange={(w) => updateSetting('invoice_col_total', w)}
                                    />

                                    <div className="pt-2 border-t border-border">
                                        <ModernToggle
                                            label="Cắt ngắn tên hàng hóa (Không xuống dòng)"
                                            subtitle="Giúp bảng gọn gàng nếu tên sản phẩm quá dài"
                                            checked={settings.invoice_table_name_nowrap === 'true'}
                                            onChange={(v) => updateSetting('invoice_table_name_nowrap', v ? 'true' : 'false')}
                                        />
                                    </div>
                                </div>
                            </DesignerSection>

                            {/* Quy cách & Số lượng quy đổi */}
                            <DesignerSection title="Quy Cách & SL Quy Đổi (Secondary Qty)" icon={Sparkles} subtitle="Hỗ trợ in kèm Thùng/Hộp/Bao bên cạnh đơn vị lẻ">
                                <ModernToggle
                                    label="Hiện Cột Số lượng quy đổi"
                                    checked={settings.invoice_show_secondary_qty === 'true'}
                                    onChange={(v) => updateSetting('invoice_show_secondary_qty', v ? 'true' : 'false')}
                                />
                                {settings.invoice_show_secondary_qty === 'true' && (
                                    <div className="pl-3 border-l-2 border-[#4a7c59]/40 space-y-3 pt-1">
                                        <SliderWithInput
                                            label="Độ rộng cột quy đổi (px)"
                                            value={settings.invoice_col_secondary_qty_width || '80'}
                                            onChange={(v) => updateSetting('invoice_col_secondary_qty_width', v)}
                                            min={40}
                                            max={200}
                                            unit="px"
                                        />
                                    </div>
                                )}
                                <ModernToggle
                                    label="Hiện Dòng Tổng cộng quy đổi"
                                    checked={settings.invoice_show_total_secondary_qty === 'true'}
                                    onChange={(v) => updateSetting('invoice_show_total_secondary_qty', v ? 'true' : 'false')}
                                />
                            </DesignerSection>

                            {/* Kiểu dáng & Viền Bảng */}
                            <DesignerSection title="Kiểu Dáng Viền & Bố Cục Bảng" icon={TableIcon} subtitle="Độ dày viền, nét đứt/liền và khoảng cách đệm">
                                <div className="grid grid-cols-2 gap-2.5">
                                    <SegmentedControl
                                        label="Độ dày viền"
                                        value={settings.invoice_table_border_thickness || 'thin'}
                                        onChange={(v) => updateSetting('invoice_table_border_thickness', v)}
                                        options={[
                                            { id: 'thin', label: 'Mỏng (1px)' },
                                            { id: 'medium', label: 'Vừa (2px)' }
                                        ]}
                                    />
                                    <SegmentedControl
                                        label="Kiểu nét viền"
                                        value={settings.invoice_table_border_style || 'solid'}
                                        onChange={(v) => updateSetting('invoice_table_border_style', v)}
                                        options={[
                                            { id: 'solid', label: 'Nét liền' },
                                            { id: 'dashed', label: 'Nét đứt' }
                                        ]}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-1.5 pt-1">
                                    <ModernToggle label="Viền bảng" checked={settings.invoice_table_border === 'true'} onChange={(v) => updateSetting('invoice_table_border', v ? 'true' : 'false')} />
                                    <ModernToggle label="Viền tiêu đề cột" checked={settings.invoice_table_header_border !== 'false'} onChange={(v) => updateSetting('invoice_table_header_border', v ? 'true' : 'false')} />
                                    <ModernToggle label="Viền dòng" checked={settings.invoice_table_border_rows === 'true'} onChange={(v) => updateSetting('invoice_table_border_rows', v ? 'true' : 'false')} />
                                    <ModernToggle label="Viền cột" checked={settings.invoice_table_border_cols === 'true'} onChange={(v) => updateSetting('invoice_table_border_cols', v ? 'true' : 'false')} />
                                </div>

                                <div className="space-y-3 pt-2 border-t border-border">
                                    <SliderWithInput
                                        label="Đệm dòng bảng (Row Padding)"
                                        value={settings.invoice_row_padding || '4'}
                                        onChange={(v) => updateSetting('invoice_row_padding', v)}
                                        min={0}
                                        max={20}
                                        unit="px"
                                        presets={[
                                            { label: 'Gọn (2px)', value: '2' },
                                            { label: 'Chuẩn (4px)', value: '4' },
                                            { label: 'Rộng (8px)', value: '8' }
                                        ]}
                                    />
                                    <SliderWithInput
                                        label="Giãn dòng hàng bảng (Line Height)"
                                        value={settings.invoice_table_line_height || '1.15'}
                                        onChange={(v) => updateSetting('invoice_table_line_height', v)}
                                        min={0.8}
                                        max={2.0}
                                        step={0.05}
                                        unit=""
                                        presets={[
                                            { label: 'Gọn (1.0)', value: '1.0' },
                                            { label: 'Chuẩn (1.15)', value: '1.15' },
                                            { label: 'Thoáng (1.35)', value: '1.35' }
                                        ]}
                                    />
                                    <SliderWithInput
                                        label="Khoảng cách trước bảng (Margin Top)"
                                        value={settings.invoice_table_margin_top || '5'}
                                        onChange={(v) => updateSetting('invoice_table_margin_top', v)}
                                        min={0}
                                        max={30}
                                        unit="px"
                                    />
                                </div>
                            </DesignerSection>

                            {/* Header Bảng & Hiệu ứng */}
                            <DesignerSection title="Header Bảng & Hiệu Ứng Sọc" icon={Palette} subtitle="Nền tiêu đề, viền bo tròn và sọc Zebra">
                                <div className="space-y-3.5">
                                    <div className="flex items-center justify-between">
                                        <ModernToggle
                                            label="Nền tiêu đề bảng"
                                            checked={settings.invoice_table_header_bg_enabled === 'true'}
                                            onChange={(v) => updateSetting('invoice_table_header_bg_enabled', v ? 'true' : 'false')}
                                        />
                                        {settings.invoice_table_header_bg_enabled === 'true' && (
                                            <div className="w-48">
                                                <EnhancedColorPicker label="Màu nền header" value={settings.invoice_table_header_bg_color || '#f2f2f2'} onChange={v => updateSetting('invoice_table_header_bg_color', v)} />
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex items-center justify-between pt-2 border-t border-border">
                                        <ModernToggle
                                            label="Kẻ sọc so le (Zebra stripe)"
                                            checked={settings.invoice_table_zebra_stripe === 'true'}
                                            onChange={(v) => updateSetting('invoice_table_zebra_stripe', v ? 'true' : 'false')}
                                        />
                                        {settings.invoice_table_zebra_stripe === 'true' && (
                                            <div className="w-48">
                                                <EnhancedColorPicker label="Màu sọc Zebra" value={settings.invoice_table_zebra_color || '#f9fafb'} onChange={v => updateSetting('invoice_table_zebra_color', v)} />
                                            </div>
                                        )}
                                    </div>

                                    <div className="pt-2 border-t border-border space-y-2.5">
                                        <ModernToggle
                                            label="Header bo tròn Badge"
                                            subtitle="Tạo kiểu badge bo góc hiện đại cho tiêu đề cột"
                                            checked={settings.invoice_table_header_is_badge === 'true'}
                                            onChange={(v) => updateSetting('invoice_table_header_is_badge', v ? 'true' : 'false')}
                                        />
                                        {settings.invoice_table_header_is_badge === 'true' && (
                                            <div className="p-3.5 bg-[#d4a574]/5 dark:bg-slate-800/30 rounded-2xl border border-border space-y-2.5">
                                                <div className="grid grid-cols-2 gap-2.5">
                                                    <EnhancedColorPicker label="Màu nền Badge" value={settings.invoice_table_header_badge_bg || '#2d5016'} onChange={v => updateSetting('invoice_table_header_badge_bg', v)} />
                                                    <EnhancedColorPicker label="Màu viền Badge" value={settings.invoice_table_header_badge_border || '#86efac'} onChange={v => updateSetting('invoice_table_header_badge_border', v)} />
                                                </div>
                                                <EnhancedColorPicker label="Màu chữ Header Badge" value={settings.invoice_table_header_badge_text_color || '#ffffff'} onChange={v => updateSetting('invoice_table_header_badge_text_color', v)} />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </DesignerSection>
                        </div>
                    )}

                    {/* =========================================================================
                        TAB 4: TỔNG KẾT & CHÂN TRANG (Totals & Footer)
                        ========================================================================= */}
                    {!isSearching && activeTab === 'footer' && (
                        <div className="space-y-6 animate-in fade-in duration-200">
                            
                            {/* Dòng tổng hợp chân bảng */}
                            <DesignerSection title="Dòng Tổng Hợp Chân Bảng" icon={CheckSquare} subtitle="Hiển thị tổng mặt hàng và tổng số lượng">
                                <div className="grid grid-cols-2 gap-2.5">
                                    <ModernToggle label="Tổng số mặt hàng" checked={settings.invoice_show_total_items === 'true'} onChange={(v) => updateSetting('invoice_show_total_items', v ? 'true' : 'false')} />
                                    <ModernToggle label="Tổng số lượng" checked={settings.invoice_show_total_qty === 'true'} onChange={(v) => updateSetting('invoice_show_total_qty', v ? 'true' : 'false')} />
                                </div>
                                <SliderWithInput
                                    label="Cỡ chữ dòng Tổng hợp chân bảng"
                                    value={settings.invoice_total_summary_font_size || '11'}
                                    onChange={(v) => updateSetting('invoice_total_summary_font_size', v)}
                                    min={8}
                                    max={20}
                                    unit="px"
                                />
                            </DesignerSection>

                            {/* Khối Tổng tiền & Công nợ */}
                            <DesignerSection title="Khối Tổng Tiền & Công Nợ" icon={CreditCard} subtitle="Tổng tiền, nợ cũ, thanh toán và số dư">
                                <div className="space-y-2.5">
                                    <ModernToggle label="Hiện Tổng tiền đơn" checked={settings.invoice_show_total_amount === 'true'} onChange={(v) => updateSetting('invoice_show_total_amount', v ? 'true' : 'false')} />
                                    <ModernToggle label="Hiện Nợ cũ" checked={settings.invoice_show_old_debt === 'true'} onChange={(v) => updateSetting('invoice_show_old_debt', v ? 'true' : 'false')} />
                                    <ModernToggle label="Hiện Thanh toán" checked={settings.invoice_show_paid === 'true'} onChange={(v) => updateSetting('invoice_show_paid', v ? 'true' : 'false')} />
                                    <ModernToggle label="Hiện Còn lại" checked={settings.invoice_show_balance === 'true'} onChange={(v) => updateSetting('invoice_show_balance', v ? 'true' : 'false')} />
                                    <ModernToggle label="Hiện Khách đưa" checked={settings.invoice_show_cash_given === 'true'} onChange={(v) => updateSetting('invoice_show_cash_given', v ? 'true' : 'false')} />
                                    <ModernToggle label="Hiện Tiền thối" checked={settings.invoice_show_change === 'true'} onChange={(v) => updateSetting('invoice_show_change', v ? 'true' : 'false')} />

                                    {selectedModule === 'Sale' && (
                                        <div className="pt-2 border-t border-border">
                                            <ModernToggle
                                                label="Ẩn nợ cũ khi khách trả tiền mặt"
                                                subtitle="Tự động ẩn nợ cũ và số dư nếu hóa đơn đã thanh toán đủ tiền mặt"
                                                checked={settings.invoice_hide_old_debt_on_cash === 'true'}
                                                onChange={(v) => updateSetting('invoice_hide_old_debt_on_cash', v ? 'true' : 'false')}
                                            />
                                        </div>
                                    )}

                                    <div className="pt-2 border-t border-border space-y-2.5">
                                        <SliderWithInput
                                            label="Khoảng cách trên khối Tổng kết (Margin Top)"
                                            subtitle="Khoảng cách giữa bảng hàng hóa và khối tổng cộng / ghi chú"
                                            value={settings.invoice_total_section_margin_top ?? '4'}
                                            onChange={(v) => updateSetting('invoice_total_section_margin_top', v)}
                                            min={0}
                                            max={60}
                                            unit="px"
                                        />
                                        <SliderWithInput
                                            label="Đệm dòng tiền (Summary Padding)"
                                            subtitle="Khoảng cách đệm trên/dưới của các dòng tiền (độc lập với bảng)"
                                            value={settings.invoice_summary_row_padding !== undefined && settings.invoice_summary_row_padding !== '' ? settings.invoice_summary_row_padding : (settings.invoice_row_padding || '4')}
                                            onChange={(v) => updateSetting('invoice_summary_row_padding', v)}
                                            min={0}
                                            max={20}
                                            unit="px"
                                            presets={[
                                                { label: 'Gọn (2px)', value: '2' },
                                                { label: 'Chuẩn (4px)', value: '4' },
                                                { label: 'Rộng (8px)', value: '8' }
                                            ]}
                                        />
                                        <SliderWithInput
                                            label="Giãn dòng tiền (Summary Line Height)"
                                            subtitle="Độ cao dòng của chữ số và nhãn tổng kết"
                                            value={settings.invoice_summary_line_height || settings.invoice_table_line_height || '1.15'}
                                            onChange={(v) => updateSetting('invoice_summary_line_height', v)}
                                            min={0.8}
                                            max={2.0}
                                            step={0.05}
                                            unit=""
                                            presets={[
                                                { label: 'Gọn (1.0)', value: '1.0' },
                                                { label: 'Chuẩn (1.15)', value: '1.15' },
                                                { label: 'Thoáng (1.35)', value: '1.35' }
                                            ]}
                                        />
                                        <SliderWithInput
                                            label="Khoảng cách giữa các dòng tiền (Row Spacing)"
                                            subtitle="Khoảng cách giữa các dòng Nợ cũ, Thanh toán, Tiền thối..."
                                            value={settings.invoice_summary_row_spacing ?? '0'}
                                            onChange={(v) => updateSetting('invoice_summary_row_spacing', v)}
                                            min={0}
                                            max={20}
                                            unit="px"
                                        />
                                        <SliderWithInput
                                            label="Khoảng cách trên dòng Còn lại / Dư nợ"
                                            subtitle="Khoảng cách từ dòng trên đến đường gạch đôi Còn lại"
                                            value={settings.invoice_total_balance_margin_top ?? '0'}
                                            onChange={(v) => updateSetting('invoice_total_balance_margin_top', v)}
                                            min={0}
                                            max={30}
                                            unit="px"
                                        />
                                    </div>
                                </div>

                                <div className="pt-3 border-t border-border space-y-3">
                                    <h5 className="text-[10px] font-black uppercase tracking-wider text-[#8b6f47] dark:text-[#d4a574]">Định dạng dòng Tổng tiền</h5>
                                    <div className="grid grid-cols-2 gap-2.5">
                                        <EnhancedColorPicker label="Màu chữ nhãn" value={settings.invoice_color_total_label || '#000000'} onChange={v => updateSetting('invoice_color_total_label', v)} />
                                        <EnhancedColorPicker label="Màu chữ số" value={settings.invoice_color_total_value || '#000000'} onChange={v => updateSetting('invoice_color_total_value', v)} />
                                    </div>
                                    <div className="flex items-center gap-2.5">
                                        <div className="flex-1">
                                            <SliderWithInput
                                                label="Cỡ chữ dòng Tổng"
                                                value={settings.invoice_total_line_size || '18'}
                                                onChange={(v) => updateSetting('invoice_total_line_size', v)}
                                                min={10}
                                                max={36}
                                                unit="px"
                                            />
                                        </div>
                                        <div className="flex gap-1.5 items-end pb-2">
                                            <button
                                                type="button"
                                                onClick={() => updateSetting('invoice_total_line_bold', settings.invoice_total_line_bold === 'true' ? 'false' : 'true')}
                                                className={cn(
                                                    "p-2.5 rounded-xl border transition-all shadow-none",
                                                    settings.invoice_total_line_bold === 'true' ? "bg-gradient-to-r from-[#2d5016] to-[#4a7c59] text-white border-primary" : "border-border text-[#8b6f47] hover:bg-[#d4a574]/10"
                                                )}
                                                title="In đậm"
                                            >
                                                <Bold size={16} />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => updateSetting('invoice_total_line_italic', settings.invoice_total_line_italic === 'true' ? 'false' : 'true')}
                                                className={cn(
                                                    "p-2.5 rounded-xl border transition-all shadow-none",
                                                    settings.invoice_total_line_italic === 'true' ? "bg-gradient-to-r from-[#2d5016] to-[#4a7c59] text-white border-primary" : "border-border text-[#8b6f47] hover:bg-[#d4a574]/10"
                                                )}
                                                title="In nghiêng"
                                            >
                                                <Italic size={16} />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="pt-2 border-t border-border space-y-2.5">
                                        <SliderWithInput
                                            label="Cỡ chữ các dòng tiền (Nợ cũ, Thanh toán...)"
                                            subtitle="Áp dụng cho Nợ cũ, Thanh toán, Khách đưa, Tiền thối"
                                            value={settings.invoice_total_section_size || '14'}
                                            onChange={(v) => updateSetting('invoice_total_section_size', v)}
                                            min={9}
                                            max={28}
                                            unit="px"
                                        />
                                        <SliderWithInput
                                            label="Cỡ chữ dòng Còn lại / Dư nợ"
                                            value={settings.invoice_total_balance_size || '18'}
                                            onChange={(v) => updateSetting('invoice_total_balance_size', v)}
                                            min={9}
                                            max={32}
                                            unit="px"
                                        />
                                        <SegmentedControl
                                            label="Đường gạch trên dòng Còn lại"
                                            value={settings.invoice_total_balance_border || 'double'}
                                            onChange={(v) => updateSetting('invoice_total_balance_border', v)}
                                            options={[
                                                { id: 'none', label: 'Không gạch' },
                                                { id: 'double', label: 'Gạch đôi (Mặc định)' },
                                                { id: 'solid', label: 'Gạch đơn' }
                                            ]}
                                        />
                                    </div>
                                </div>
                            </DesignerSection>

                            {/* Ghi chú, Cảm ơn & Chữ ký */}
                            <DesignerSection title="Ghi Chú, Cảm Ơn & Chữ Ký" icon={FileText} subtitle="Nội dung chân trang và khối ký tên">
                                <ModernToggle
                                    label="Hiện Ghi chú chân trang"
                                    checked={settings.invoice_show_notes === 'true'}
                                    onChange={(v) => updateSetting('invoice_show_notes', v ? 'true' : 'false')}
                                />
                                {settings.invoice_show_notes === 'true' && (
                                    <DesignerInput
                                        label="Nội dung ghi chú mặc định"
                                        value={settings.invoice_custom_notes}
                                        onChange={(v) => updateSetting('invoice_custom_notes', v)}
                                        placeholder="Ví dụ: Hàng mua rồi xin miễn đổi trả sau 3 ngày..."
                                    />
                                )}

                                <div className="pt-2 border-t border-border space-y-2">
                                    <ModernToggle
                                        label="Hiện Lời cảm ơn"
                                        checked={settings.invoice_show_thank_you === 'true'}
                                        onChange={(v) => updateSetting('invoice_show_thank_you', v ? 'true' : 'false')}
                                    />
                                    {settings.invoice_show_thank_you === 'true' && (
                                        <DesignerInput
                                            label="Nội dung Lời cảm ơn"
                                            value={settings.invoice_thank_you_message}
                                            onChange={(v) => updateSetting('invoice_thank_you_message', v)}
                                            placeholder="Cảm ơn Quý Khách & Hẹn Gặp Lại!"
                                        />
                                    )}
                                </div>

                                <div className="pt-2 border-t border-border">
                                    <ModernToggle
                                        label="Hiện Khối Chữ ký các bên"
                                        subtitle="Người lập phiếu, Khách hàng, Thủ kho..."
                                        checked={settings.invoice_show_signatures === 'true'}
                                        onChange={(v) => updateSetting('invoice_show_signatures', v ? 'true' : 'false')}
                                    />
                                </div>
                            </DesignerSection>
                        </div>
                    )}

                    {/* =========================================================================
                        TAB 5: FONT & MÀU SẮC (Typography & Colors)
                        ========================================================================= */}
                    {!isSearching && activeTab === 'style' && (
                        <div className="space-y-6 animate-in fade-in duration-200">
                            
                            {/* Typography / Font chữ */}
                            <DesignerSection title="Font Chữ Mẫu In" icon={Type} subtitle="Kho font tiếng Việt và font tùy chỉnh">
                                <button
                                    type="button"
                                    onClick={() => setShowGoogleFontModal(true)}
                                    className="w-full flex items-center justify-between p-3.5 bg-[#d4a574]/10 dark:bg-slate-800/20 hover:bg-[#d4a574]/15 border border-[#8b6f47]/25 dark:border-white/10 rounded-2xl transition-all group shadow-none"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-xl bg-gradient-to-r from-[#2d5016] to-[#4a7c59] text-white flex items-center justify-center group-hover:scale-105 transition-transform">
                                            <Type size={16} strokeWidth={2.5} />
                                        </div>
                                        <div className="text-left">
                                            <p className="text-[11px] font-black uppercase tracking-tight text-[#2d5016] dark:text-[#d4a574] flex items-center gap-1.5">
                                                Kho Google Fonts Tiếng Việt
                                                <span className="text-[9px] font-black px-1.5 py-0.5 bg-[#8b6f47]/15 dark:bg-[#d4a574]/15 text-[#2d5016] dark:text-[#d4a574] rounded-md">60+ fonts</span>
                                            </p>
                                            <p className="text-[10px] text-[#8b6f47] dark:text-slate-400 font-medium truncate max-w-[200px]">
                                                Đang dùng: <span className="font-black text-[#2d5016] dark:text-[#4ade80] font-mono">{settings.invoice_custom_font_name ? `File: ${settings.invoice_custom_font_name}` : (settings.invoice_font_family || 'Mặc định')}</span>
                                            </p>
                                        </div>
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#2d5016] to-[#4a7c59] text-white group-hover:brightness-110 transition-all shadow-none flex items-center gap-1.5">
                                        <Search size={12} /> Duyệt font
                                    </span>
                                </button>

                                <div className="space-y-1.5 pt-1">
                                    <label className="text-[10px] font-black text-[#8b6f47] dark:text-[#d4a574]/60 uppercase tracking-widest block ml-1">Hoặc chọn nhanh font phổ biến:</label>
                                    <select
                                        className="w-full bg-transparent border border-border rounded-xl px-3.5 py-2.5 text-xs font-black text-[#8b6f47] dark:text-white outline-none focus:border-[#4a7c59]"
                                        value={settings.invoice_font_family}
                                        onChange={(e) => {
                                            updateSetting('invoice_custom_font_name', '');
                                            updateSetting('invoice_font_family', e.target.value);
                                        }}
                                    >
                                        <option value="'Be Vietnam Pro', sans-serif" className="dark:bg-slate-900">Be Vietnam Pro (Google Font - Chuẩn Việt)</option>
                                        <option value="Inter, sans-serif" className="dark:bg-slate-900">Inter (Mặc định tinh gọn)</option>
                                        <option value="'Roboto', sans-serif" className="dark:bg-slate-900">Roboto (Google Font)</option>
                                        <option value="'Montserrat', sans-serif" className="dark:bg-slate-900">Montserrat (Google Font)</option>
                                        <option value="'Playfair Display', serif" className="dark:bg-slate-900">Playfair Display (Có chân sang trọng)</option>
                                        <option value="'Quicksand', sans-serif" className="dark:bg-slate-900">Quicksand (Bo tròn mềm mại)</option>
                                        <option value="'Courier New', Courier, monospace" className="dark:bg-slate-900">Courier New (Máy in kim / Cổ điển)</option>
                                        <option value="Arial, sans-serif" className="dark:bg-slate-900">Arial (Chuẩn hệ thống)</option>
                                        <option value="'Times New Roman', Times, serif" className="dark:bg-slate-900">Times New Roman</option>
                                        {Array.isArray(fonts) && fonts.map(font => (
                                            <option key={font} value={`'${font.split('.')[0]}', sans-serif`} className="dark:bg-slate-900">Tập tin font: {font}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <input type="file" id="font-upload-tab" className="hidden" accept=".ttf,.otf" onChange={handleFontUpload} />
                                    <label htmlFor="font-upload-tab" className="flex items-center justify-center gap-2 py-2.5 border-2 border-dashed border-[#8b6f47]/25 dark:border-slate-700 rounded-xl text-[#8b6f47] dark:text-slate-400 hover:text-[#2d5016] hover:border-[#2d5016] transition-all cursor-pointer text-[10px] font-black uppercase tracking-wider">
                                        <Upload size={14} /> Tải file font từ máy (.ttf, .otf)
                                    </label>
                                </div>
                            </DesignerSection>

                            {/* Cỡ chữ toàn diện */}
                            <DesignerSection title="Bảng Cỡ Chữ Toàn Diện (px)" icon={Type} subtitle="Quản lý tập trung kích thước chữ các thành phần">
                                <div className="grid grid-cols-2 gap-2.5">
                                    <SliderWithInput label="Tiêu đề mẫu in" value={settings.invoice_title_size || '22'} onChange={(v) => updateSetting('invoice_title_size', v)} min={12} max={40} unit="px" />
                                    <SliderWithInput label="Tên cửa hàng" value={settings.invoice_store_name_size || '24'} onChange={(v) => updateSetting('invoice_store_name_size', v)} min={12} max={40} unit="px" />
                                    <SliderWithInput label="Thông tin khách" value={settings.invoice_customer_info_size || '12'} onChange={(v) => updateSetting('invoice_customer_info_size', v)} min={8} max={24} unit="px" />
                                    <SliderWithInput label="Header bảng" value={settings.invoice_table_header_size || '12'} onChange={(v) => updateSetting('invoice_table_header_size', v)} min={8} max={24} unit="px" />
                                    <SliderWithInput label="Nội dung hàng bảng" value={settings.invoice_table_content_size || '12'} onChange={(v) => updateSetting('invoice_table_content_size', v)} min={8} max={24} unit="px" />
                                    <SliderWithInput label="Dòng tổng tiền" value={settings.invoice_total_line_size || '18'} onChange={(v) => updateSetting('invoice_total_line_size', v)} min={10} max={36} unit="px" />
                                </div>
                            </DesignerSection>

                            {/* Bảng phối màu thương hiệu */}
                            <DesignerSection title="Bảng Phối Màu Thương Hiệu" icon={Palette} subtitle="Tùy biến màu sắc đồng bộ cho toàn bộ bản in">
                                <div className="grid grid-cols-2 gap-2.5">
                                    <EnhancedColorPicker label="Thông tin shop" value={settings.invoice_color_store_info} onChange={v => updateSetting('invoice_color_store_info', v)} />
                                    <EnhancedColorPicker label="Tiêu đề mẫu in" value={settings.invoice_color_title} onChange={v => updateSetting('invoice_color_title', v)} />
                                    <EnhancedColorPicker label="Thông tin khách" value={settings.invoice_color_customer_info} onChange={v => updateSetting('invoice_color_customer_info', v)} />
                                    <EnhancedColorPicker label="Tiêu đề bảng" value={settings.invoice_color_table_header} onChange={v => updateSetting('invoice_color_table_header', v)} />
                                    <EnhancedColorPicker label="Nội dung hàng" value={settings.invoice_color_table_body} onChange={v => updateSetting('invoice_color_table_body', v)} />
                                    <EnhancedColorPicker label="Ghi chú / Khác" value={settings.invoice_color_notes} onChange={v => updateSetting('invoice_color_notes', v)} />
                                </div>
                            </DesignerSection>
                        </div>
                    )}

                    {/* =========================================================================
                        TAB 6: NÂNG CAO (Watermark & Free Layout)
                        ========================================================================= */}
                    {!isSearching && activeTab === 'advanced' && (
                        <div className="space-y-6 animate-in fade-in duration-200">
                            
                            {/* Watermark (Hình mờ) */}
                            <DesignerSection title="Watermark (Hình Mờ Bảo Vệ)" icon={Shield} subtitle="Chống giả mạo, khẳng định thương hiệu">
                                <ModernToggle
                                    label="Hiển thị Watermark"
                                    checked={String(settings.invoice_show_watermark) === 'true'}
                                    onChange={(v) => updateSetting('invoice_show_watermark', v ? 'true' : 'false')}
                                />

                                {String(settings.invoice_show_watermark) === 'true' && (
                                    <div className="space-y-3.5 pt-2 animate-in fade-in duration-200">
                                        <SegmentedControl
                                            label="Loại Watermark"
                                            value={settings.invoice_watermark_type || 'text'}
                                            onChange={(v) => updateSetting('invoice_watermark_type', v)}
                                            options={[
                                                { id: 'text', label: 'Văn bản (Chữ)' },
                                                { id: 'image', label: 'Hình ảnh (Logo)' }
                                            ]}
                                        />

                                        {settings.invoice_watermark_type === 'text' ? (
                                            <DesignerInput
                                                label="Nội dung chữ Watermark"
                                                value={settings.invoice_watermark_text}
                                                onChange={(v) => updateSetting('invoice_watermark_text', v)}
                                                placeholder="BẢN GỐC / LYANGPOS"
                                            />
                                        ) : (
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-[#8b6f47] dark:text-[#d4a574]/60 uppercase tracking-widest block ml-1">Hình ảnh Watermark</label>
                                                <input
                                                    type="file"
                                                    id="watermark-image-file-tab"
                                                    accept="image/*"
                                                    onChange={(e) => {
                                                        const file = e.target.files[0];
                                                        if (!file) return;
                                                        if (file.size > 1.5 * 1024 * 1024) {
                                                            setToast({ message: "Vui lòng chọn ảnh dưới 1.5MB!", type: "error" });
                                                            return;
                                                        }
                                                        const reader = new FileReader();
                                                        reader.onloadend = () => {
                                                            updateSetting('invoice_watermark_image_url', reader.result);
                                                            setToast({ message: "Đã tải ảnh watermark!", type: "success" });
                                                        };
                                                        reader.readAsDataURL(file);
                                                    }}
                                                    className="hidden"
                                                />
                                                <label
                                                    htmlFor="watermark-image-file-tab"
                                                    className="w-full flex items-center justify-center gap-2 p-3 bg-[#d4a574]/10 dark:bg-slate-800/20 text-[#8b6f47] border border-[#d4a574]/30 dark:border-slate-700 hover:bg-[#d4a574]/20 rounded-xl cursor-pointer text-xs font-black uppercase tracking-wider transition-all"
                                                >
                                                    <Upload size={14} /> Tải ảnh logo watermark
                                                </label>
                                            </div>
                                        )}

                                        <div className="space-y-3 pt-2 border-t border-border">
                                            <SliderWithInput
                                                label="Độ trong suốt (Opacity)"
                                                value={settings.invoice_watermark_opacity || '0.15'}
                                                onChange={(v) => updateSetting('invoice_watermark_opacity', v)}
                                                min={0.05}
                                                max={1}
                                                step={0.05}
                                                unit=""
                                            />
                                            <SliderWithInput
                                                label={settings.invoice_watermark_type === 'image' ? 'Chiều rộng ảnh (px)' : 'Cỡ chữ (px)'}
                                                value={settings.invoice_watermark_size || '100'}
                                                onChange={(v) => updateSetting('invoice_watermark_size', v)}
                                                min={10}
                                                max={500}
                                                step={5}
                                                unit="px"
                                            />
                                            <SliderWithInput
                                                label="Góc xoay (độ °)"
                                                value={settings.invoice_watermark_angle || '-30'}
                                                onChange={(v) => updateSetting('invoice_watermark_angle', v)}
                                                min={-180}
                                                max={180}
                                                step={5}
                                                unit="°"
                                            />
                                            <div className="grid grid-cols-2 gap-2.5">
                                                <DesignerInput label="Tọa độ X (px)" value={settings.invoice_watermark_x} onChange={(v) => updateSetting('invoice_watermark_x', v)} type="number" />
                                                <DesignerInput label="Tọa độ Y (px)" value={settings.invoice_watermark_y} onChange={(v) => updateSetting('invoice_watermark_y', v)} type="number" />
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    updateSetting('invoice_watermark_x', '100');
                                                    updateSetting('invoice_watermark_y', '200');
                                                    updateSetting('invoice_watermark_angle', '-30');
                                                    updateSetting('invoice_watermark_size', '100');
                                                    updateSetting('invoice_watermark_opacity', '0.15');
                                                }}
                                                className="w-full py-2 bg-transparent text-[#8b6f47] border border-border rounded-xl hover:bg-[#d4a574]/10 transition-all text-[9px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-none"
                                            >
                                                Đặt lại vị trí watermark mặc định
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </DesignerSection>

                            {/* Bố cục tự do (Kéo thả) */}
                            <DesignerSection title="Bố Cục Tự Do (Kéo Thả)" icon={Sliders} subtitle="Tự do kéo thả di chuyển các khối trên màn hình xem trước">
                                <ModernToggle
                                    label="Kích hoạt vị trí tự do"
                                    subtitle="Bật để di chuyển logo, tên shop, bảng, chữ ký bằng chuột"
                                    checked={settings.invoice_free_layout === 'true'}
                                    onChange={(v) => updateSetting('invoice_free_layout', v ? 'true' : 'false')}
                                />

                                {settings.invoice_free_layout === 'true' && (
                                    <div className="space-y-3 pt-2">
                                        <p className="text-[10px] text-slate-400 italic">
                                            * Bạn có thể bấm và kéo trực tiếp các thành phần ở khung Xem trước bên phải.
                                        </p>
                                        <button
                                            type="button"
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
                                                setToast({ message: "Đã đặt lại vị trí các khối mặc định!", type: "info" });
                                            }}
                                            className="w-full py-2.5 bg-transparent text-[#8b6f47] border border-border rounded-xl hover:bg-[#d4a574]/10 transition-all text-[9px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-none"
                                        >
                                            Đặt lại vị trí mặc định
                                        </button>
                                    </div>
                                )}
                            </DesignerSection>
                        </div>
                    )}
                </div>
            </div>

            {/* =========================================================================
                RIGHT AREA: LIVE PREVIEW & WORKSPACE
                ========================================================================= */}
            <div className="flex-1 flex flex-col p-8 md:p-12 overflow-y-auto relative no-print bg-transparent">
                <div className="absolute inset-0 bg-[radial-gradient(#d4a574_1px,transparent_1px)] dark:bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:40px_40px] opacity-[0.15] pointer-events-none -z-10" />

                <div className="max-w-[1100px] mx-auto w-full flex flex-col items-center">
                    
                    {/* Top Preview Controls Bar */}
                    <div className="w-full flex items-center justify-between mb-8 pb-4 border-b border-[#d4a574]/30 dark:border-white/10">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-[#2d5016]/10 dark:bg-[#4ade80]/15 text-[#2d5016] dark:text-[#4ade80] flex items-center justify-center shrink-0 border border-[#2d5016]/20 shadow-sm">
                                <Sprout size={22} />
                            </div>
                            <div>
                                <div className="flex items-center gap-2 text-[#4a7c59] dark:text-[#4ade80] mb-0.5 font-black uppercase text-[10px] tracking-[0.25em]">
                                    <Monitor size={12} /> Bản In • Xem Trước Thời Gian Thực
                                </div>
                                <h3 className="text-xl font-black text-slate-800 dark:text-emerald-50 uppercase tracking-tight">
                                    {selectedTemplate?.name ? `Mẫu: ${selectedTemplate.name}` : 'Thiết Kế Bản In'}
                                </h3>
                            </div>
                        </div>

                        <div className="flex items-center gap-2.5">
                            {/* Phôi Mẫu Quick Toggle */}
                            <div className="flex items-center gap-1.5 bg-[#d4a574]/5 dark:bg-slate-800/20 px-2.5 py-1.5 rounded-xl border border-border shadow-none">
                                <input
                                    type="file"
                                    id="preview-quick-bg-upload-top"
                                    accept="image/*"
                                    onChange={handlePreviewBgUpload}
                                    className="hidden"
                                />
                                <label
                                    htmlFor="preview-quick-bg-upload-top"
                                    className={cn(
                                        "flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider cursor-pointer px-2.5 py-1 rounded-lg transition-all",
                                        settings.invoice_preview_bg_image && settings.invoice_preview_bg_image !== 'none'
                                            ? "bg-[#4a7c59] text-white shadow-none"
                                            : "text-[#8b6f47] dark:text-[#d4a574] hover:bg-[#d4a574]/15"
                                    )}
                                    title="Tải ảnh phôi đối chiếu"
                                >
                                    <ImageIcon size={13} />
                                    {settings.invoice_preview_bg_image && settings.invoice_preview_bg_image !== 'none' ? 'Đang bật phôi' : 'Phôi đối chiếu'}
                                </label>
                                {settings.invoice_preview_bg_image && settings.invoice_preview_bg_image !== 'none' && (
                                    <button
                                        onClick={() => {
                                            updateSetting('invoice_preview_bg_image', 'none');
                                            setToast({ message: "Đã tắt ảnh phôi đối chiếu!", type: "info" });
                                        }}
                                        className="text-[10px] text-rose-500 hover:text-rose-600 px-1 font-bold"
                                        title="Tắt phôi đối chiếu"
                                    >
                                        ✕
                                    </button>
                                )}
                            </div>

                            {/* Số dòng test */}
                            <div className="flex items-center gap-2 bg-[#d4a574]/5 dark:bg-slate-800/20 px-3 py-1.5 rounded-xl border border-border shadow-none">
                                <span className="text-[9px] font-black text-[#8b6f47] dark:text-[#d4a574] uppercase tracking-wider">Hàng test:</span>
                                <select
                                    value={previewItemsCount}
                                    onChange={(e) => setPreviewItemsCount(parseInt(e.target.value))}
                                    className="text-xs bg-transparent text-[#8b6f47] dark:text-emerald-50 outline-none font-bold cursor-pointer"
                                >
                                    <option value={2} className="dark:bg-slate-900">2 dòng</option>
                                    <option value={3} className="dark:bg-slate-900">3 dòng</option>
                                    <option value={5} className="dark:bg-slate-900">5 dòng</option>
                                    <option value={8} className="dark:bg-slate-900">8 dòng</option>
                                    <option value={12} className="dark:bg-slate-900">12 dòng</option>
                                    <option value={16} className="dark:bg-slate-900">16 dòng</option>
                                    <option value={20} className="dark:bg-slate-900">20 dòng</option>
                                </select>
                            </div>

                            {/* Zoom & Print */}
                            <div className="flex bg-[#d4a574]/5 dark:bg-slate-800/20 p-1 rounded-xl border border-border shadow-none items-center">
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
                                <div className="w-[1px] h-4 bg-border mx-1" />
                                <button
                                    onClick={() => window.print()}
                                    className="flex items-center gap-2 px-3.5 py-1.5 hover:bg-[#d4a574]/10 text-[#8b6f47] dark:text-[#d4a574] rounded-lg text-[10px] font-black uppercase tracking-wider transition-all"
                                >
                                    <Printer size={13} /> Máy in thực tế
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Paper Sheet Preview Container */}
                    <div className="w-full bg-transparent border border-border rounded-3xl p-8 shadow-none overflow-auto custom-scrollbar flex justify-center min-h-[650px]">
                        <m.div
                            initial={{ rotateX: 5, y: 30, opacity: 0 }}
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
                                    <PrintTemplate
                                        data={previewData}
                                        settings={settings}
                                        type={selectedModule}
                                        isPreview={true}
                                        onUpdateSetting={updateSetting}
                                    />
                                </div>
                            </div>
                        </m.div>
                    </div>

                    {/* Status Footer */}
                    <div className="mt-12 flex items-center gap-8 text-[#8b6f47]/50 dark:text-[#d4a574]/40 text-[10px] font-black uppercase tracking-widest">
                        <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-[#4a7c59]" /> ĐANG HOẠT ĐỘNG</div>
                        <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-[#d4a574]" /> TỰ ĐỘNG ĐẾM DÒNG</div>
                        <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-[#8b6f47]" /> HỖ TRỢ MỌI KHỔ GIẤY</div>
                    </div>

                </div>
            </div>

            {/* Print Only Hidden Container */}
            <div className="only-print">
                <PrintTemplate data={previewData} settings={settings} type={selectedModule} isPreview={false} />
            </div>

            {/* Toast Notification */}
            <AnimatePresence>
                {toast && (
                    <Toast
                        message={toast.message}
                        type={toast.type}
                        onClose={() => setToast(null)}
                    />
                )}
            </AnimatePresence>

            {/* Confirmation Modal */}
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

            {/* Google Font Picker Modal */}
            <GoogleFontPickerModal
                isOpen={showGoogleFontModal}
                onClose={() => setShowGoogleFontModal(false)}
                currentFont={settings.invoice_font_family}
                onSelectFont={handleGoogleFontSelect}
            />
        </div>
    );
};

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("Uncaught error in InvoiceDesigner:", error, errorInfo);
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
