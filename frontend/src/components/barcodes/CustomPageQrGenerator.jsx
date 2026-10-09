import React, { useState, useRef, useMemo, useEffect } from 'react';
import { QRCodeCanvas, QRCodeSVG } from 'qrcode.react';
import { 
    QrCode, Printer, Download, Copy, ExternalLink, Sparkles, 
    Share2, Layers, Check, CheckCircle2, RefreshCw, Palette, 
    Type, Globe, Smartphone, Tv, ShoppingBag, BarChart3, 
    Settings, Package, Users, ReceiptText, Stethoscope, 
    Leaf, HelpCircle, Sliders, Eye, Wifi, Laptop
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import axios from 'axios';
import { cn } from '../../lib/utils';

const APP_PAGE_PRESETS = [
    {
        id: 'bacsisauquy',
        path: '/#/bacsisauquy',
        label: 'Bác Sĩ Cây Trồng Sáu Quý',
        badge: 'Công khai • Đề xuất',
        badgeColor: 'bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border-emerald-500/30',
        icon: Stethoscope,
        category: 'Tư vấn AI',
        defaultTitle: 'BÁC SĨ CÂY TRỒNG SÁU QUÝ',
        defaultSubtitle: 'Quét mã để hỏi bệnh lá/trái & kê đơn hoạt chất từ kho thuốc',
        defaultCta: 'QUÉT MÃ ĐỂ TƯ VẤN THUỐC BỆNH CÂY TRỒNG',
        defaultColor: '#163d18',
        logoType: 'plant',
        desc: 'Mở trang chat AI chẩn đoán sâu bệnh, tư vấn hoạt chất, liều pha & đối chiếu kho thuốc'
    },
    {
        id: 'packing_display',
        path: '/#/packing-display',
        label: 'Màn Hình Soạn Hàng (TV / Cast)',
        badge: 'Đóng gói • Kho',
        badgeColor: 'bg-amber-500/20 text-amber-900 dark:text-amber-300 border-amber-500/30',
        icon: Tv,
        category: 'Vận hành kho',
        defaultTitle: 'MÀN HÌNH SOẠN & ĐÓNG GÓI ĐƠN HÀNG',
        defaultSubtitle: 'Dành cho nhân viên kho, thợ đóng gói và shipper quét kiểm tra',
        defaultCta: 'QUÉT MÃ MỞ MÀN HÌNH SOẠN HÀNG',
        defaultColor: '#0f766e',
        logoType: 'pos',
        desc: 'Màn hình hiển thị danh sách đơn chờ đóng hàng, truyền trực tiếp lên Smart TV'
    },
    {
        id: 'pos',
        path: '/#/pos',
        label: 'Màn Hình Bán Hàng (POS Desktop)',
        badge: 'Thu ngân',
        badgeColor: 'bg-blue-500/20 text-blue-900 dark:text-blue-300 border-blue-500/30',
        icon: ShoppingBag,
        category: 'Bán hàng',
        defaultTitle: 'MÀN HÌNH BÁN HÀNG LYANGPOS',
        defaultSubtitle: 'Hệ thống tạo đơn bán lẻ, tính tiền và in hóa đơn',
        defaultCta: 'QUÉT MÃ TRUY CẬP POS BÁN HÀNG',
        defaultColor: '#1e3a8a',
        logoType: 'pos',
        desc: 'Truy cập nhanh vào giao diện POS bán hàng máy tính'
    },
    {
        id: 'mobile_pos',
        path: '/#/mobile-pos',
        label: 'POS Bán Hàng Mobile (Điện thoại)',
        badge: 'Mobile',
        badgeColor: 'bg-purple-500/20 text-purple-900 dark:text-purple-300 border-purple-500/30',
        icon: Smartphone,
        category: 'Bán hàng',
        defaultTitle: 'POS BÁN HÀNG TRÊN ĐIỆN THOẠI',
        defaultSubtitle: 'Giao diện cảm ứng tối ưu cho nhân viên đứng quầy / đứng vườn',
        defaultCta: 'QUÉT MÃ MỞ POS TRÊN ĐIỆN THOẠI',
        defaultColor: '#6b21a8',
        logoType: 'pos',
        desc: 'Mở trực tiếp trên điện thoại để tạo đơn hàng lưu động'
    },
    {
        id: 'purchase',
        path: '/#/purchase',
        label: 'Quản Lý Nhập Hàng & Nhà Cung Cấp',
        badge: 'Nhập kho',
        badgeColor: 'bg-teal-500/20 text-teal-900 dark:text-teal-300 border-teal-500/30',
        icon: Package,
        category: 'Vận hành kho',
        defaultTitle: 'PHIẾU NHẬP HÀNG & NHÀ CUNG CẤP',
        defaultSubtitle: 'Kiểm kê nhập kho, đối chiếu giá vốn và công nợ',
        defaultCta: 'QUÉT MÃ MỞ TRANG NHẬP HÀNG',
        defaultColor: '#047857',
        logoType: 'pos',
        desc: 'Truy cập trang tạo đơn nhập kho hàng hóa'
    },
    {
        id: 'summary',
        path: '/#/summary',
        label: 'Báo Cáo Tổng Kết & Lợi Nhuận',
        badge: 'Quản lý',
        badgeColor: 'bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border-emerald-500/30',
        icon: BarChart3,
        category: 'Quản lý',
        defaultTitle: 'BÁO CÁO KINH DOANH & TỔNG KẾT',
        defaultSubtitle: 'Theo dõi doanh thu, số đơn, lợi nhuận gộp và tồn kho',
        defaultCta: 'QUÉT MÃ XEM BÁO CÁO TỔNG KẾT',
        defaultColor: '#15803d',
        logoType: 'pos',
        desc: 'Trang tổng quan số liệu tài chính toàn cửa hàng'
    },
    {
        id: 'partners',
        path: '/#/partners',
        label: 'Quản Lý Khách Hàng & Công Nợ',
        badge: 'Khách hàng',
        badgeColor: 'bg-indigo-500/20 text-indigo-900 dark:text-indigo-300 border-indigo-500/30',
        icon: Users,
        category: 'Đối tác',
        defaultTitle: 'SỔ KHÁCH HÀNG & CÔNG NỢ',
        defaultSubtitle: 'Tra cứu lịch sử mua hàng, công nợ và chăm sóc khách hàng',
        defaultCta: 'QUÉT MÃ TRA CỨU KHÁCH HÀNG',
        defaultColor: '#3730a3',
        logoType: 'pos',
        desc: 'Tra cứu danh sách khách hàng và lịch sử công nợ'
    },
    {
        id: 'vouchers',
        path: '/#/vouchers',
        label: 'Sổ Quỹ Thu Chi & Phiếu Thu',
        badge: 'Kế toán',
        badgeColor: 'bg-amber-500/20 text-amber-900 dark:text-amber-300 border-amber-500/30',
        icon: ReceiptText,
        category: 'Tài chính',
        defaultTitle: 'SỔ QUỸ TIỀN MẶT & THU CHI',
        defaultSubtitle: 'Quản lý phiếu thu, phiếu chi và dòng tiền cửa hàng',
        defaultCta: 'QUÉT MÃ MỞ SỔ QUỸ THU CHI',
        defaultColor: '#b45309',
        logoType: 'pos',
        desc: 'Trang lập và quản lý các chứng từ thu chi'
    },
    {
        id: 'settings',
        path: '/#/settings',
        label: 'Cài Đặt Cửa Hàng & Hệ Thống',
        badge: 'Hệ thống',
        badgeColor: 'bg-stone-500/20 text-stone-800 dark:text-stone-300 border-stone-500/30',
        icon: Settings,
        category: 'Hệ thống',
        defaultTitle: 'CÀI ĐẶT HỆ THỐNG LYANGPOS',
        defaultSubtitle: 'Thông tin cửa hàng, mẫu in, kết nối máy in và AI',
        defaultCta: 'QUÉT MÃ MỞ CÀI ĐẶT CỬA HÀNG',
        defaultColor: '#334155',
        logoType: 'pos',
        desc: 'Cấu hình thông tin cửa hàng, mẫu hóa đơn và thiết bị'
    },
    {
        id: 'custom_url',
        path: '',
        label: 'Đường Link Tuỳ Chỉnh (Custom URL)',
        badge: 'Tự do',
        badgeColor: 'bg-pink-500/20 text-pink-800 dark:text-pink-300 border-pink-500/30',
        icon: Globe,
        category: 'Tự do',
        defaultTitle: 'QUÉT MÃ QR TRUY CẬP LIÊN KẾT',
        defaultSubtitle: 'Sử dụng camera điện thoại hoặc Zalo để quét mã',
        defaultCta: 'QUÉT MÃ ĐỂ MỞ TRANG',
        defaultColor: '#be185d',
        logoType: 'link',
        desc: 'Nhập bất kỳ đường link Zalo, Fanpage, Website, Wi-Fi hoặc tài liệu nào'
    }
];

const COLOR_PRESETS = [
    { name: 'Xanh Nông Nghiệp', value: '#163d18' },
    { name: 'Xanh Ngọc Emerald', value: '#059669' },
    { name: 'Đen Tuyệt Đối', value: '#000000' },
    { name: 'Xanh Dương Đậm', value: '#1e3a8a' },
    { name: 'Tím Quý Phái', value: '#6b21a8' },
    { name: 'Đỏ Rượu Vang', value: '#881337' },
    { name: 'Nâu Cà Phê', value: '#78350f' },
    { name: 'Cam Đất Nồng', value: '#c2410c' }
];

const BG_COLOR_PRESETS = [
    { name: 'Trắng tinh khiết', value: '#ffffff' },
    { name: 'Kem giấy ấm (Warm Ivory)', value: '#fdfbf7' },
    { name: 'Xanh mầm nhạt (Mint Light)', value: '#f0fdf4' },
    { name: 'Vàng rơm nhạt (Sand Light)', value: '#fefce8' }
];

const TEMPLATE_PRESETS = [
    { id: 'poster', label: 'Poster / Decal Dán Quầy (A4 / A5)', desc: 'Khung viền sang trọng, thông tin to rõ, dán trước cửa hàng / quầy thu ngân' },
    { id: 'standee', label: 'Standee Mini Để Bàn (9x14cm)', desc: 'Dạng card đứng để trên bàn làm việc hoặc bàn tiếp khách' },
    { id: 'roll_tag', label: 'Tem Dán Nhỏ / Decal Chai (50x50mm)', desc: 'Gọn gàng dán lên bao bì sản phẩm, chai thuốc hoặc phiếu bàn giao' },
    { id: 'minimal', label: 'Mã QR Đơn Giản (Minimal)', desc: 'Chỉ gồm mã QR và tiêu đề ngắn, tiết kiệm diện tích in' }
];

export default function CustomPageQrGenerator() {
    const [selectedPresetId, setSelectedPresetId] = useState('bacsisauquy');
    const [customUrlInput, setCustomUrlInput] = useState('');
    
    // Auto-detected LAN IP & Port from backend
    const [detectedLanIp, setDetectedLanIp] = useState('');
    const [detectedPort, setDetectedPort] = useState(3579);
    const [allIps, setAllIps] = useState([]);
    const [isDetectingIp, setIsDetectingIp] = useState(false);

    // Host / Base IP selection: 'lan' | 'domain' | 'localhost'
    const [hostMode, setHostMode] = useState(() => {
        return localStorage.getItem('lyang_qr_host_mode') || 'lan';
    });
    
    // Custom LAN IP / Host string
    const [customHost, setCustomHost] = useState(() => {
        return localStorage.getItem('server_ip') || '';
    });

    // Public domain / Tunnel URL
    const [publicDomain, setPublicDomain] = useState(() => {
        return localStorage.getItem('lyang_public_domain') || '';
    });

    const [storeName, setStoreName] = useState(() => {
        try {
            const saved = localStorage.getItem('lyang_store_name');
            if (saved) return saved;
        } catch (e) {}
        return 'CỬA HÀNG BVTV SÁU QUÝ';
    });

    // Auto-detect local IP from backend on mount
    const fetchLocalIp = async () => {
        setIsDetectingIp(true);
        try {
            const res = await axios.get('/api/ip');
            if (res.data) {
                const ip = res.data.ip;
                const port = res.data.port || 3579;
                const list = (res.data.all_ips && res.data.all_ips.length > 0) 
                    ? res.data.all_ips 
                    : (ip && ip !== '127.0.0.1' ? [ip] : []);
                
                setAllIps(list);
                if (ip && ip !== '127.0.0.1' && ip !== 'localhost') {
                    setDetectedLanIp(ip);
                    setDetectedPort(port);
                    setCustomHost(ip);
                    localStorage.setItem('server_ip', ip);
                }
            }
        } catch (err) {
            console.warn('[QR Generator] Could not auto-detect LAN IP from backend:', err);
        } finally {
            setIsDetectingIp(false);
        }
    };

    useEffect(() => {
        fetchLocalIp();
    }, []);

    const activePreset = useMemo(() => {
        return APP_PAGE_PRESETS.find(p => p.id === selectedPresetId) || APP_PAGE_PRESETS[0];
    }, [selectedPresetId]);

    // Design parameters
    const [title, setTitle] = useState(activePreset.defaultTitle);
    const [subtitle, setSubtitle] = useState(activePreset.defaultSubtitle);
    const [ctaText, setCtaText] = useState(activePreset.defaultCta);
    const [footerText, setFooterText] = useState('LyangPOS • Phần mềm Quản lý Nông nghiệp Thông minh');
    const [qrColor, setQrColor] = useState(activePreset.defaultColor);
    const [qrBgColor, setQrBgColor] = useState('#ffffff');
    const [templateType, setTemplateType] = useState('poster');
    const [logoType, setLogoType] = useState('plant');
    const [qrSize, setQrSize] = useState(200);
    const [printCopies, setPrintCopies] = useState(1);
    const [includeStoreName, setIncludeStoreName] = useState(true);
    const [includeInstruction, setIncludeInstruction] = useState(true);

    const qrCardRef = useRef(null);
    const printContainerRef = useRef(null);

    // Auto-update fields when switching preset
    useEffect(() => {
        setTitle(activePreset.defaultTitle);
        setSubtitle(activePreset.defaultSubtitle);
        setCtaText(activePreset.defaultCta);
        setQrColor(activePreset.defaultColor);
        setLogoType(activePreset.logoType);
        if (activePreset.id === 'custom_url' && !customUrlInput) {
            setCustomUrlInput('https://');
        }
    }, [selectedPresetId]);

    // Construct final destination URL
    const finalUrl = useMemo(() => {
        if (selectedPresetId === 'custom_url') {
            return customUrlInput.trim() || 'https://';
        }

        let base = '';
        if (hostMode === 'lan') {
            const ip = (customHost.trim() || detectedLanIp.trim() || '127.0.0.1').replace(/^https?:\/\//, '');
            const port = detectedPort || 3579;
            base = `http://${ip}:${port}`;
        } else if (hostMode === 'domain') {
            let domain = (publicDomain.trim() || (typeof window !== 'undefined' ? window.location.host : '')).replace(/\/+$/, '');
            if (!domain.startsWith('http://') && !domain.startsWith('https://')) {
                domain = `https://${domain}`;
            }
            base = domain;
        } else {
            // Localhost mode
            base = 'http://localhost:3579';
        }

        base = base.replace(/\/+$/, '');
        return `${base}${activePreset.path}`;
    }, [selectedPresetId, customUrlInput, hostMode, customHost, detectedLanIp, detectedPort, publicDomain, activePreset]);

    const isLocalhostWarning = useMemo(() => {
        return finalUrl.includes('localhost') || finalUrl.includes('127.0.0.1');
    }, [finalUrl]);

    const handleCopyUrl = () => {
        navigator.clipboard.writeText(finalUrl);
        toast.success('Đã sao chép liên kết URL vào bộ nhớ đệm!', {
            icon: '🔗'
        });
    };

    const handleOpenLink = () => {
        window.open(finalUrl, '_blank');
    };

    // Download PNG file
    const handleDownloadPng = async () => {
        try {
            toast.loading('Đang khởi tạo ảnh chất lượng cao...', { id: 'download-qr' });
            
            const canvas = qrCardRef.current?.querySelector('canvas');
            if (!canvas) {
                toast.error('Không tìm thấy mã QR để xuất ảnh!', { id: 'download-qr' });
                return;
            }

            const exportCanvas = document.createElement('canvas');
            const ctx = exportCanvas.getContext('2d');

            const isPoster = templateType === 'poster';
            const isStandee = templateType === 'standee';
            const isMinimal = templateType === 'minimal';

            const cardW = isMinimal ? 600 : isStandee ? 700 : 900;
            const cardH = isMinimal ? 750 : isStandee ? 1100 : 1250;

            exportCanvas.width = cardW;
            exportCanvas.height = cardH;

            // Background
            ctx.fillStyle = qrBgColor;
            ctx.fillRect(0, 0, cardW, cardH);

            // Border
            ctx.strokeStyle = qrColor;
            ctx.lineWidth = 8;
            ctx.strokeRect(20, 20, cardW - 40, cardH - 40);

            // Inner dashed decorative border
            if (isPoster || isStandee) {
                ctx.strokeStyle = `${qrColor}40`;
                ctx.lineWidth = 2;
                ctx.setLineDash([8, 8]);
                ctx.strokeRect(32, 32, cardW - 64, cardH - 64);
                ctx.setLineDash([]);
            }

            let curY = 70;

            // Store Name
            if (includeStoreName && storeName) {
                ctx.fillStyle = qrColor;
                ctx.font = 'bold 24px system-ui, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(storeName.toUpperCase(), cardW / 2, curY);
                curY += 45;
            }

            // Main Title
            if (title) {
                ctx.fillStyle = '#111827';
                ctx.font = 'bold 36px system-ui, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(title, cardW / 2, curY);
                curY += 40;
            }

            // Subtitle
            if (subtitle && !isMinimal) {
                ctx.fillStyle = '#4b5563';
                ctx.font = '500 20px system-ui, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(subtitle, cardW / 2, curY);
                curY += 45;
            }

            // Draw QR Code
            const qrExportSize = isMinimal ? 380 : isStandee ? 420 : 480;
            const qrX = (cardW - qrExportSize) / 2;
            const qrY = curY + 20;

            // White box padding for QR
            ctx.fillStyle = '#ffffff';
            ctx.shadowColor = 'rgba(0,0,0,0.1)';
            ctx.shadowBlur = 15;
            ctx.shadowOffsetY = 5;
            ctx.fillRect(qrX - 15, qrY - 15, qrExportSize + 30, qrExportSize + 30);
            ctx.shadowColor = 'transparent';

            ctx.drawImage(canvas, qrX, qrY, qrExportSize, qrExportSize);
            curY = qrY + qrExportSize + 50;

            // Call to Action badge
            if (ctaText && !isMinimal) {
                ctx.fillStyle = qrColor;
                const badgeW = Math.min(cardW - 120, ctx.measureText(ctaText).width + 80);
                const badgeH = 50;
                const badgeX = (cardW - badgeW) / 2;
                
                ctx.beginPath();
                ctx.roundRect(badgeX, curY, badgeW, badgeH, 16);
                ctx.fill();

                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 22px system-ui, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(ctaText, cardW / 2, curY + 33);
                curY += 80;
            }

            // Instruction / Helper
            if (includeInstruction && !isMinimal) {
                ctx.fillStyle = '#6b7280';
                ctx.font = '500 18px system-ui, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('📱 Dùng camera điện thoại hoặc Zalo để quét mã', cardW / 2, curY);
                curY += 35;
            }

            // Footer
            if (footerText && !isMinimal) {
                ctx.fillStyle = '#9ca3af';
                ctx.font = '16px system-ui, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(footerText, cardW / 2, curY);
            }

            const dataUrl = exportCanvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.download = `QR-${selectedPresetId}-${Date.now()}.png`;
            link.href = dataUrl;
            link.click();

            toast.success('Đã tải ảnh mã QR thành công!', { id: 'download-qr' });
        } catch (err) {
            console.error('Download QR PNG error:', err);
            toast.error('Lỗi khi xuất ảnh QR!', { id: 'download-qr' });
        }
    };

    // Copy QR Image directly to Clipboard for Zalo pasting
    const handleCopyImageToClipboard = async () => {
        try {
            toast.loading('Đang sao chép ảnh vào clipboard...', { id: 'copy-img' });

            const canvas = qrCardRef.current?.querySelector('canvas');
            if (!canvas) {
                toast.error('Không tìm thấy canvas!', { id: 'copy-img' });
                return;
            }

            canvas.toBlob(async (blob) => {
                if (!blob) {
                    toast.error('Không thể tạo blob ảnh!', { id: 'copy-img' });
                    return;
                }
                try {
                    await navigator.clipboard.write([
                        new ClipboardItem({ 'image/png': blob })
                    ]);
                    toast.success('Đã sao chép ảnh QR! Bạn có thể nhấn Ctrl+V để dán trực tiếp vào Zalo/Messenger.', { id: 'copy-img', duration: 4000 });
                } catch (clipErr) {
                    console.error('Clipboard write failed:', clipErr);
                    toast.error('Trình duyệt không cho phép dán ảnh tự động. Bạn có thể nhấn Tải PNG!', { id: 'copy-img' });
                }
            }, 'image/png');
        } catch (err) {
            toast.error('Sao chép ảnh thất bại!', { id: 'copy-img' });
        }
    };

    // Print QR Template
    const handlePrintQr = () => {
        window.print();
        toast.success(`Đã gửi lệnh in ${printCopies} bản mã QR!`);
    };

    return (
        <div className="flex-1 flex flex-col md:flex-row gap-5 min-h-0 overflow-hidden select-none">
            <style dangerouslySetInnerHTML={{__html: `
                @media print {
                    body * {
                        visibility: hidden !important;
                    }
                    .custom-qr-print-area, .custom-qr-print-area * {
                        visibility: visible !important;
                    }
                    .custom-qr-print-area {
                        position: absolute !important;
                        left: 0 !important;
                        top: 0 !important;
                        width: 100% !important;
                        background: white !important;
                        padding: 10mm !important;
                        margin: 0 !important;
                        display: block !important;
                    }
                    .no-print {
                        display: none !important;
                    }
                }
            `}} />

            {/* LEFT COLUMN: Controls & Config Panel */}
            <div className="w-full md:w-[450px] flex flex-col bg-[#fcfbf9]/95 dark:bg-[#091811]/95 backdrop-blur-xl rounded-3xl border border-[#8b6f47]/20 dark:border-emerald-500/20 overflow-hidden shadow-md shrink-0">
                {/* Header with Botanical Gradient */}
                <div 
                    style={{ background: 'var(--top-nav-gradient, linear-gradient(135deg, #133a15 0%, #1e5824 50%, #297a33 100%))' }}
                    className="p-4 border-b border-white/20 text-white shadow-sm shrink-0"
                >
                    <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-2xl bg-white/20 backdrop-blur-md text-white flex items-center justify-center border border-white/30 font-black shadow-xs shrink-0">
                            <QrCode size={19} />
                        </div>
                        <div className="min-w-0">
                            <h3 className="font-black text-sm uppercase tracking-tight text-white drop-shadow-xs truncate">
                                Chọn Trang Cần Tạo Mã QR
                            </h3>
                            <p className="text-[11px] text-emerald-100/90 font-medium truncate mt-0.5">
                                Chọn trang hệ thống hoặc nhập đường dẫn tuỳ ý
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-3.5 space-y-4 custom-scrollbar">
                    {/* 1. Preset List */}
                    <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-wider text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
                            <Layers size={14} className="text-[#2d5016] dark:text-emerald-400" />
                            <span>1. Danh mục trang hệ thống</span>
                        </label>
                        <div className="grid grid-cols-1 gap-1.5 max-h-[220px] overflow-y-auto custom-scrollbar p-1">
                            {APP_PAGE_PRESETS.map((p) => {
                                const IconComponent = p.icon;
                                const isSelected = selectedPresetId === p.id;
                                return (
                                    <button
                                        key={p.id}
                                        type="button"
                                        onClick={() => setSelectedPresetId(p.id)}
                                        style={isSelected ? {
                                            background: 'var(--button-gradient, linear-gradient(135deg, #163d18 0%, #2b7a33 100%))',
                                            color: '#ffffff'
                                        } : undefined}
                                        className={cn(
                                            "w-full text-left p-2.5 rounded-2xl border transition-all flex items-center justify-between gap-2.5 cursor-pointer outline-none",
                                            isSelected
                                                ? "border-emerald-400/40 shadow-sm shadow-emerald-950/25 font-bold"
                                                : "bg-white/80 dark:bg-white/5 hover:bg-emerald-50/70 dark:hover:bg-emerald-950/30 text-stone-800 dark:text-stone-200 border-[#8b6f47]/15 dark:border-white/5 hover:border-emerald-500/40"
                                        )}
                                    >
                                        <div className="flex items-center gap-2.5 min-w-0">
                                            <div className={cn(
                                                "w-7 h-7 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold transition-transform",
                                                isSelected ? "bg-white/20 text-white" : "bg-emerald-500/15 text-[#1b4a1f] dark:text-emerald-300"
                                            )}>
                                                <IconComponent size={15} />
                                            </div>
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-xs font-bold truncate">{p.label}</span>
                                                </div>
                                                <span className={cn(
                                                    "text-[10px] block truncate mt-0.5",
                                                    isSelected ? "text-emerald-100/90" : "text-stone-500 dark:text-stone-400"
                                                )}>
                                                    {p.path || 'Nhập link tuỳ ý'}
                                                </span>
                                            </div>
                                        </div>
                                        <span className={cn(
                                            "text-[9px] font-black px-2 py-0.5 rounded-full border shrink-0",
                                            isSelected ? "bg-white/25 text-white border-white/30" : p.badgeColor
                                        )}>
                                            {p.badge}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Custom URL Input (if custom_url selected) */}
                    {selectedPresetId === 'custom_url' && (
                        <div className="p-3 bg-emerald-500/10 dark:bg-emerald-950/40 border border-emerald-500/30 rounded-2xl space-y-2">
                            <label className="text-xs font-black text-[#1b4a1f] dark:text-emerald-300 flex items-center gap-1.5">
                                <Globe size={13} /> Nhập đường dẫn / URL bất kỳ:
                            </label>
                            <input
                                type="text"
                                value={customUrlInput}
                                onChange={(e) => setCustomUrlInput(e.target.value)}
                                placeholder="https://zalo.me/... hoặc https://facebook.com/..."
                                className="w-full px-3 py-2 bg-white dark:bg-[#07130e] border border-[#8b6f47]/25 dark:border-emerald-500/30 rounded-xl text-xs font-semibold text-stone-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500/30"
                            />
                        </div>
                    )}

                    {/* 2. Host / Server IP Configuration */}
                    {selectedPresetId !== 'custom_url' && (
                        <div className="space-y-3 p-3 bg-white/70 dark:bg-[#0c1c14] border border-[#8b6f47]/15 dark:border-emerald-500/15 rounded-2xl shadow-2xs">
                            <div className="flex items-center justify-between gap-2">
                                <label className="text-xs font-black uppercase tracking-wider text-stone-700 dark:text-stone-200 flex items-center gap-1.5">
                                    <Smartphone size={14} className="text-[#2d5016] dark:text-emerald-400" />
                                    <span>2. Chế độ mạng & Địa chỉ IP</span>
                                </label>
                                {detectedLanIp && (
                                    <span className="text-[10px] font-mono font-bold text-[#1a461e] dark:text-emerald-400 bg-emerald-500/15 dark:bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
                                        IP: {detectedLanIp}:{detectedPort}
                                    </span>
                                )}
                            </div>

                            {/* 3 Host Mode Selector Tabs */}
                            <div className="grid grid-cols-3 gap-1.5">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setHostMode('lan');
                                        localStorage.setItem('lyang_qr_host_mode', 'lan');
                                    }}
                                    style={hostMode === 'lan' ? {
                                        background: 'var(--button-gradient, linear-gradient(135deg, #163d18 0%, #2b7a33 100%))',
                                        color: '#ffffff'
                                    } : undefined}
                                    className={cn(
                                        "p-2 rounded-xl text-center border transition-all cursor-pointer flex flex-col items-center justify-center gap-1",
                                        hostMode === 'lan'
                                            ? "border-emerald-400/40 shadow-xs"
                                            : "bg-white/80 dark:bg-white/5 text-stone-700 dark:text-stone-300 border-[#8b6f47]/15 dark:border-white/5 hover:bg-white dark:hover:bg-white/10"
                                    )}
                                >
                                    <span className="text-[11px] font-bold flex items-center gap-1">
                                        <Wifi size={12} className={hostMode === 'lan' ? "text-white" : "text-emerald-600 dark:text-emerald-400"} />
                                        <span>Wi-Fi Cửa Hàng</span>
                                    </span>
                                    <span className="text-[9px] opacity-80 leading-none">Mạng LAN nội bộ</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => {
                                        setHostMode('domain');
                                        localStorage.setItem('lyang_qr_host_mode', 'domain');
                                    }}
                                    style={hostMode === 'domain' ? {
                                        background: 'linear-gradient(135deg, #059669 0%, #0d9488 100%)',
                                        color: '#ffffff'
                                    } : undefined}
                                    className={cn(
                                        "p-2 rounded-xl text-center border transition-all cursor-pointer flex flex-col items-center justify-center gap-1",
                                        hostMode === 'domain'
                                            ? "border-teal-400/40 shadow-xs"
                                            : "bg-white/80 dark:bg-white/5 text-stone-700 dark:text-stone-300 border-[#8b6f47]/15 dark:border-white/5 hover:bg-white dark:hover:bg-white/10"
                                    )}
                                >
                                    <span className="text-[11px] font-bold flex items-center gap-1">
                                        <Globe size={12} className={hostMode === 'domain' ? "text-white" : "text-teal-600 dark:text-teal-400"} />
                                        <span>Tên Miền Online</span>
                                    </span>
                                    <span className="text-[9px] opacity-80 leading-none">Quét 4G / Ở nhà</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => {
                                        setHostMode('localhost');
                                        localStorage.setItem('lyang_qr_host_mode', 'localhost');
                                    }}
                                    className={cn(
                                        "p-2 rounded-xl text-center border transition-all cursor-pointer flex flex-col items-center justify-center gap-1",
                                        hostMode === 'localhost'
                                            ? "bg-stone-800 text-white border-stone-800 shadow-xs"
                                            : "bg-white/80 dark:bg-white/5 text-stone-700 dark:text-stone-300 border-[#8b6f47]/15 dark:border-white/5 hover:bg-white dark:hover:bg-white/10"
                                    )}
                                >
                                    <span className="text-[11px] font-bold flex items-center gap-1">
                                        <Laptop size={12} className={hostMode === 'localhost' ? "text-white" : "text-stone-600 dark:text-stone-400"} />
                                        <span>Localhost</span>
                                    </span>
                                    <span className="text-[9px] opacity-80 leading-none">Chỉ máy này</span>
                                </button>
                            </div>

                            {/* Mode Specific Inputs */}
                            {hostMode === 'lan' && (
                                <div className="p-2.5 bg-emerald-500/10 dark:bg-emerald-950/30 border border-emerald-500/25 rounded-xl space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[11px] font-bold text-[#1e4a22] dark:text-emerald-300 flex items-center gap-1">
                                            <span>Địa chỉ IP máy tính POS trong mạng Wi-Fi:</span>
                                        </span>
                                        <button
                                            type="button"
                                            onClick={fetchLocalIp}
                                            disabled={isDetectingIp}
                                            className="text-[10px] font-bold text-[#2d5016] dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
                                        >
                                            <RefreshCw size={11} className={isDetectingIp ? 'animate-spin' : ''} />
                                            Dò lại IP
                                        </button>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="text"
                                            value={customHost}
                                            onChange={(e) => {
                                                setCustomHost(e.target.value);
                                                localStorage.setItem('server_ip', e.target.value);
                                            }}
                                            placeholder={detectedLanIp || "192.168.0.68"}
                                            className="flex-1 px-3 py-1.5 bg-white dark:bg-[#07130e] border border-[#8b6f47]/25 dark:border-emerald-500/30 rounded-lg text-xs font-mono font-bold text-stone-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500/30"
                                        />
                                        <span className="text-xs font-mono font-bold text-stone-500 shrink-0">:{detectedPort || 3579}</span>
                                    </div>

                                    {/* Multiple IP adapter selector chips */}
                                    {allIps.length > 1 && (
                                        <div className="flex items-center gap-1.5 pt-0.5 flex-wrap">
                                            <span className="text-[10px] text-stone-500">Các IP tìm thấy:</span>
                                            {allIps.map((ipAddr) => (
                                                <button
                                                    key={ipAddr}
                                                    type="button"
                                                    onClick={() => {
                                                        setCustomHost(ipAddr);
                                                        localStorage.setItem('server_ip', ipAddr);
                                                    }}
                                                    className={cn(
                                                        "px-2 py-0.5 rounded text-[10px] font-mono font-bold border transition-all cursor-pointer",
                                                        (customHost === ipAddr || (!customHost && detectedLanIp === ipAddr))
                                                            ? "bg-[#163d18] text-white border-[#163d18]"
                                                            : "bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-700 hover:border-emerald-500"
                                                    )}
                                                >
                                                    {ipAddr}
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    <p className="text-[10.5px] text-stone-600 dark:text-stone-300 leading-relaxed">
                                        💡 <strong>Điều kiện quét:</strong> Điện thoại của khách/nhân viên phải <strong>bắt cùng mạng Wi-Fi</strong> với máy tính này để truy cập.
                                    </p>
                                </div>
                            )}

                            {hostMode === 'domain' && (
                                <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl space-y-2">
                                    <span className="text-[11px] font-bold text-emerald-950 dark:text-emerald-300 block">
                                        Nhập Tên miền công khai / Link Cloudflare / Ngrok:
                                    </span>
                                    <input
                                        type="text"
                                        value={publicDomain}
                                        onChange={(e) => {
                                            setPublicDomain(e.target.value);
                                            localStorage.setItem('lyang_public_domain', e.target.value);
                                        }}
                                        placeholder="https://pos.cuahangcuaban.com hoặc https://xxx.trycloudflare.com"
                                        className="w-full px-3 py-1.5 bg-white dark:bg-[#07130e] border border-emerald-400/40 dark:border-emerald-700 rounded-lg text-xs font-semibold text-stone-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500/30"
                                    />
                                    <p className="text-[10px] text-emerald-800 dark:text-emerald-300/80 leading-relaxed">
                                        🌍 <strong>Dành cho in poster / chia sẻ:</strong> Khách hàng ở bất cứ đâu (4G, Wi-Fi tại nhà) quét mã là vào được ngay.
                                    </p>
                                </div>
                            )}

                            {hostMode === 'localhost' && (
                                <div className="p-2.5 bg-amber-500/10 border border-amber-500/25 rounded-xl space-y-1">
                                    <p className="text-[11px] font-bold text-amber-900 dark:text-amber-300 flex items-center gap-1">
                                        ⚠️ Chế độ Localhost (Chỉ dành cho máy này)
                                    </p>
                                    <p className="text-[10px] text-amber-800 dark:text-amber-400 leading-relaxed">
                                        Điện thoại quét mã này sẽ <strong>không thể kết nối</strong> vì điện thoại không phải là máy chủ. Vui lòng chuyển sang <strong>Wi-Fi Cửa Hàng</strong> hoặc <strong>Tên Miền Online</strong> khi in QR cho khách quét.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* 3. Layout & Style Configuration */}
                    <div className="space-y-3 p-3 bg-white/70 dark:bg-[#0c1c14] border border-[#8b6f47]/15 dark:border-emerald-500/15 rounded-2xl shadow-2xs">
                        <label className="text-xs font-black uppercase tracking-wider text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
                            <Palette size={14} className="text-[#2d5016] dark:text-emerald-400" />
                            <span>3. Tùy biến Mẫu In & Màu Sắc</span>
                        </label>

                        {/* Template style selector */}
                        <div className="space-y-1.5">
                            <span className="text-[11px] font-bold text-stone-600 dark:text-stone-400">Kiểu hiển thị & In:</span>
                            <div className="grid grid-cols-2 gap-1.5">
                                {TEMPLATE_PRESETS.map((t) => {
                                    const isTSelected = templateType === t.id;
                                    return (
                                        <button
                                            key={t.id}
                                            type="button"
                                            onClick={() => setTemplateType(t.id)}
                                            style={isTSelected ? {
                                                background: 'var(--button-gradient, linear-gradient(135deg, #163d18 0%, #2b7a33 100%))',
                                                color: '#ffffff'
                                            } : undefined}
                                            className={cn(
                                                "p-2.5 rounded-xl text-left border transition-all cursor-pointer",
                                                isTSelected
                                                    ? "border-emerald-400/40 shadow-xs"
                                                    : "bg-white/80 dark:bg-white/5 text-stone-700 dark:text-stone-300 border-[#8b6f47]/15 dark:border-white/5 hover:bg-white dark:hover:bg-white/10"
                                            )}
                                        >
                                            <div className="text-[11px] font-bold leading-tight">{t.label}</div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Color Selector */}
                        <div className="space-y-1.5 pt-1">
                            <div className="flex items-center justify-between">
                                <span className="text-[11px] font-bold text-stone-600 dark:text-stone-400">Màu mã QR:</span>
                                <div className="flex items-center gap-1.5">
                                    <input 
                                        type="color" 
                                        value={qrColor} 
                                        onChange={(e) => setQrColor(e.target.value)} 
                                        className="w-5 h-5 rounded-md cursor-pointer border-0 p-0 bg-transparent"
                                    />
                                    <span className="text-[10px] font-mono font-bold text-stone-500">{qrColor}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 overflow-x-auto py-1.5 px-1 custom-scrollbar">
                                {COLOR_PRESETS.map((c) => {
                                    const isSelected = qrColor === c.value;
                                    return (
                                        <button
                                            key={c.value}
                                            type="button"
                                            onClick={() => setQrColor(c.value)}
                                            title={c.name}
                                            style={{ backgroundColor: c.value }}
                                            className={cn(
                                                "w-7 h-7 rounded-full shrink-0 border-2 transition-all flex items-center justify-center cursor-pointer relative",
                                                isSelected 
                                                    ? "border-white ring-2 ring-emerald-500 shadow-md ring-offset-1 ring-offset-white dark:ring-offset-[#0c1c14]" 
                                                    : "border-stone-200/80 dark:border-white/20 hover:scale-105 opacity-85 hover:opacity-100 hover:border-emerald-500/50"
                                            )}
                                        >
                                            {isSelected && (
                                                <Check size={12} className="text-white drop-shadow-sm" strokeWidth={3} />
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Background Color Selector */}
                        <div className="space-y-1.5 pt-1">
                            <span className="text-[11px] font-bold text-stone-600 dark:text-stone-400">Màu nền khung:</span>
                            <div className="grid grid-cols-2 gap-1.5">
                                {BG_COLOR_PRESETS.map((bg) => (
                                    <button
                                        key={bg.value}
                                        type="button"
                                        onClick={() => setQrBgColor(bg.value)}
                                        className={cn(
                                            "py-1.5 px-2.5 rounded-xl text-[10.5px] font-bold border transition-all flex items-center gap-1.5 cursor-pointer",
                                            qrBgColor === bg.value
                                                ? "bg-[#163d18] text-white border-[#163d18] shadow-xs"
                                                : "bg-white/80 dark:bg-white/5 text-stone-700 dark:text-stone-300 border-[#8b6f47]/15 dark:border-white/5 hover:bg-white"
                                        )}
                                    >
                                        <span className="w-3.5 h-3.5 rounded-full border border-black/20 shrink-0" style={{ backgroundColor: bg.value }} />
                                        <span className="truncate">{bg.name}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Text Content Inputs */}
                        <div className="space-y-2 pt-2 border-t border-stone-200/80 dark:border-white/10">
                            <div>
                                <label className="text-[11px] font-bold text-stone-600 dark:text-stone-400 block mb-1">Tên cửa hàng (Header):</label>
                                <input
                                    type="text"
                                    value={storeName}
                                    onChange={(e) => {
                                        setStoreName(e.target.value);
                                        localStorage.setItem('lyang_store_name', e.target.value);
                                    }}
                                    className="w-full px-3 py-1.5 bg-white dark:bg-[#07130e] border border-[#8b6f47]/20 dark:border-emerald-500/30 rounded-xl text-xs font-bold text-stone-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500/25"
                                />
                            </div>

                            <div>
                                <label className="text-[11px] font-bold text-stone-600 dark:text-stone-400 block mb-1">Tiêu đề chính:</label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="w-full px-3 py-1.5 bg-white dark:bg-[#07130e] border border-[#8b6f47]/20 dark:border-emerald-500/30 rounded-xl text-xs font-bold text-stone-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500/25"
                                />
                            </div>

                            <div>
                                <label className="text-[11px] font-bold text-stone-600 dark:text-stone-400 block mb-1">Mô tả phụ:</label>
                                <input
                                    type="text"
                                    value={subtitle}
                                    onChange={(e) => setSubtitle(e.target.value)}
                                    className="w-full px-3 py-1.5 bg-white dark:bg-[#07130e] border border-[#8b6f47]/20 dark:border-emerald-500/30 rounded-xl text-xs font-medium text-stone-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500/25"
                                />
                            </div>

                            <div>
                                <label className="text-[11px] font-bold text-stone-600 dark:text-stone-400 block mb-1">Nút hành động (Badge CTA):</label>
                                <input
                                    type="text"
                                    value={ctaText}
                                    onChange={(e) => setCtaText(e.target.value)}
                                    className="w-full px-3 py-1.5 bg-white dark:bg-[#07130e] border border-[#8b6f47]/20 dark:border-emerald-500/30 rounded-xl text-xs font-bold text-stone-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500/25"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* RIGHT COLUMN: Live Interactive Preview & Action Toolbar */}
            <div className="flex-1 flex flex-col bg-[#fcfbf9]/95 dark:bg-[#091811]/95 backdrop-blur-xl rounded-3xl border border-[#8b6f47]/20 dark:border-emerald-500/20 overflow-hidden shadow-md">
                {/* Preview Header & Quick Actions */}
                <div className="p-3.5 sm:p-4 border-b border-[#8b6f47]/15 dark:border-white/10 flex flex-wrap items-center justify-between gap-3 shrink-0 bg-white/70 dark:bg-[#0c1c14]">
                    <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-xs" />
                        <h3 className="font-black text-sm uppercase tracking-tight text-stone-800 dark:text-white">Xem Trước & Xuất Bản</h3>
                    </div>

                    <div className="flex items-center flex-wrap gap-2">
                        <button
                            type="button"
                            onClick={handleCopyUrl}
                            title="Sao chép liên kết URL"
                            className="px-3 py-1.5 rounded-xl bg-white/90 dark:bg-white/10 hover:bg-emerald-50 dark:hover:bg-white/20 text-stone-700 dark:text-stone-200 border border-[#8b6f47]/20 dark:border-white/10 text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-2xs"
                        >
                            <Copy size={13} />
                            <span>Copy Link</span>
                        </button>

                        <button
                            type="button"
                            onClick={handleOpenLink}
                            title="Mở thử link trên tab mới"
                            className="px-3 py-1.5 rounded-xl bg-white/90 dark:bg-white/10 hover:bg-emerald-50 dark:hover:bg-white/20 text-stone-700 dark:text-stone-200 border border-[#8b6f47]/20 dark:border-white/10 text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-2xs"
                        >
                            <ExternalLink size={13} />
                            <span>Mở thử</span>
                        </button>

                        <button
                            type="button"
                            onClick={handleCopyImageToClipboard}
                            title="Sao chép ảnh QR để dán thẳng vào Zalo / Chat (Ctrl+V)"
                            className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-sm shadow-purple-950/20"
                        >
                            <Share2 size={13} />
                            <span>Dán vào Zalo</span>
                        </button>

                        <button
                            type="button"
                            onClick={handleDownloadPng}
                            title="Tải ảnh PNG độ nét cao 300DPI"
                            className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-sm shadow-emerald-950/20"
                        >
                            <Download size={13} />
                            <span>Tải ảnh PNG</span>
                        </button>

                        <button
                            type="button"
                            onClick={handlePrintQr}
                            style={{ background: 'var(--button-gradient, linear-gradient(135deg, #163d18 0%, #2b7a33 100%))' }}
                            className="px-4 py-1.5 rounded-xl text-white text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-md shadow-emerald-950/25 hover:brightness-110"
                        >
                            <Printer size={14} strokeWidth={2.5} />
                            <span>In Mã QR</span>
                        </button>
                    </div>
                </div>

                {/* Destination URL & Network Status Banner */}
                <div className={cn(
                    "px-4 py-2.5 border-b flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 shrink-0 transition-colors",
                    isLocalhostWarning 
                        ? "bg-amber-500/15 dark:bg-amber-950/40 border-amber-500/30 text-amber-900 dark:text-amber-200"
                        : hostMode === 'domain'
                        ? "bg-emerald-500/10 dark:bg-emerald-950/40 border-emerald-500/20 text-emerald-900 dark:text-emerald-200"
                        : "bg-sky-500/10 dark:bg-sky-950/40 border-sky-500/20 text-sky-900 dark:text-sky-200"
                )}>
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                        <span className={cn(
                            "text-[10px] font-black uppercase px-2 py-0.5 rounded-md text-white shrink-0",
                            isLocalhostWarning ? "bg-amber-600" : hostMode === 'domain' ? "bg-emerald-600" : "bg-[#163d18]"
                        )}>
                            URL Đích:
                        </span>
                        <code className="text-xs font-mono font-black truncate select-all">{finalUrl}</code>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                        {isLocalhostWarning ? (
                            <span className="text-[11px] font-bold text-amber-700 dark:text-amber-300 flex items-center gap-1 bg-amber-500/20 px-2.5 py-0.5 rounded-lg">
                                ⚠️ Đang là Localhost (Điện thoại quét không vào được)
                            </span>
                        ) : hostMode === 'domain' ? (
                            <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-1 bg-emerald-500/20 px-2.5 py-0.5 rounded-lg">
                                🌍 Quét được bằng 4G / Mọi nơi
                            </span>
                        ) : (
                            <span className="text-[11px] font-bold text-[#1b4a20] dark:text-emerald-300 flex items-center gap-1 bg-emerald-500/20 px-2.5 py-0.5 rounded-lg">
                                📶 Yêu cầu điện thoại kết nối cùng Wi-Fi
                            </span>
                        )}
                    </div>
                </div>

                {/* Live Preview Display Center */}
                <div className="flex-1 overflow-y-auto p-6 flex items-center justify-center custom-scrollbar bg-stone-100/60 dark:bg-[#050f0a] select-none">
                    <motion.div
                        layout
                        ref={qrCardRef}
                        className={cn(
                            "relative rounded-3xl border-4 shadow-xl overflow-hidden transition-all text-stone-800 flex flex-col items-center justify-between select-none",
                            templateType === 'minimal' ? "w-[320px] p-6 space-y-4" :
                            templateType === 'standee' ? "w-[360px] min-h-[480px] p-6 space-y-4" :
                            templateType === 'roll_tag' ? "w-[280px] p-4 space-y-2" :
                            "w-[420px] min-h-[540px] p-7 space-y-5"
                        )}
                        style={{
                            borderColor: qrColor,
                            backgroundColor: qrBgColor
                        }}
                    >
                        {/* Header Branding */}
                        <div className="text-center space-y-1 w-full">
                            {includeStoreName && storeName && (
                                <div 
                                    style={{ color: qrColor }}
                                    className="text-xs font-black tracking-widest uppercase opacity-90 truncate"
                                >
                                    {storeName}
                                </div>
                            )}
                            {title && (
                                <h2 className="text-base sm:text-lg font-black uppercase tracking-tight text-stone-900 leading-tight">
                                    {title}
                                </h2>
                            )}
                            {subtitle && templateType !== 'minimal' && (
                                <p className="text-[11px] text-stone-600 font-medium leading-snug px-2">
                                    {subtitle}
                                </p>
                            )}
                        </div>

                        {/* QR Code Container with High-Contrast Box */}
                        <div className="p-3 bg-white rounded-2xl shadow-md border border-stone-200/80 flex items-center justify-center relative group">
                            <QRCodeCanvas
                                value={finalUrl}
                                size={templateType === 'minimal' ? 180 : templateType === 'roll_tag' ? 160 : 210}
                                fgColor={qrColor}
                                bgColor="#ffffff"
                                level="H"
                                marginSize={1}
                            />
                            
                            {/* Center Decorative Icon Badge */}
                            {logoType !== 'none' && (
                                <div 
                                    style={{ backgroundColor: qrColor }}
                                    className="absolute w-10 h-10 rounded-xl text-white flex items-center justify-center shadow-lg border-2 border-white pointer-events-none"
                                >
                                    {logoType === 'plant' ? <Leaf size={20} /> :
                                     logoType === 'doctor' ? <Stethoscope size={20} /> :
                                     logoType === 'pos' ? <ShoppingBag size={20} /> : <Sparkles size={20} />}
                                </div>
                            )}
                        </div>

                        {/* Call to Action Badge */}
                        {ctaText && templateType !== 'minimal' && (
                            <div 
                                style={{ backgroundColor: qrColor }}
                                className="w-full py-2.5 px-4 rounded-xl text-white text-center font-black text-xs uppercase tracking-wider shadow-md truncate"
                            >
                                {ctaText}
                            </div>
                        )}

                        {/* Instruction Guide & Footer */}
                        {templateType !== 'minimal' && (
                            <div className="text-center space-y-1 w-full pt-1 border-t border-stone-200/60">
                                {includeInstruction && (
                                    <p className="text-[10px] font-bold text-stone-500 flex items-center justify-center gap-1">
                                        <span>📱 Mở camera hoặc Zalo để quét mã ngay</span>
                                    </p>
                                )}
                                {footerText && (
                                    <p className="text-[9px] text-stone-400 font-medium">
                                        {footerText}
                                    </p>
                                )}
                            </div>
                        )}
                    </motion.div>
                </div>
            </div>

            {/* HIDDEN PRINT CONTAINER (FOR BROWSER WINDOW.PRINT) */}
            <div className="custom-qr-print-area hidden">
                <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '20px',
                    justifyContent: 'center',
                    padding: '20px'
                }}>
                    {Array.from({ length: printCopies }).map((_, idx) => (
                        <div
                            key={idx}
                            style={{
                                width: templateType === 'roll_tag' ? '50mm' : templateType === 'standee' ? '90mm' : '140mm',
                                minHeight: templateType === 'roll_tag' ? '50mm' : templateType === 'standee' ? '130mm' : '180mm',
                                border: `3px solid ${qrColor}`,
                                borderRadius: '16px',
                                padding: '16px',
                                backgroundColor: qrBgColor,
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                pageBreakInside: 'avoid',
                                boxSizing: 'border-box',
                                fontFamily: 'system-ui, sans-serif',
                                color: '#111827'
                            }}
                        >
                            <div style={{ textAlign: 'center', width: '100%', marginBottom: '10px' }}>
                                {includeStoreName && storeName && (
                                    <div style={{ color: qrColor, fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '3px' }}>
                                        {storeName}
                                    </div>
                                )}
                                <div style={{ fontSize: '15px', fontWeight: '900', textTransform: 'uppercase', lineHeight: 1.2 }}>
                                    {title}
                                </div>
                                {subtitle && templateType !== 'minimal' && (
                                    <div style={{ fontSize: '10px', color: '#4b5563', marginTop: '4px' }}>
                                        {subtitle}
                                    </div>
                                )}
                            </div>

                            <div style={{ padding: '8px', background: '#ffffff', borderRadius: '12px', border: '1px solid #e5e7eb', position: 'relative' }}>
                                <QRCodeSVG
                                    value={finalUrl}
                                    size={templateType === 'roll_tag' ? 120 : 160}
                                    fgColor={qrColor}
                                    bgColor="#ffffff"
                                    level="H"
                                />
                            </div>

                            {ctaText && templateType !== 'minimal' && (
                                <div style={{
                                    backgroundColor: qrColor,
                                    color: '#ffffff',
                                    fontSize: '11px',
                                    fontWeight: 'bold',
                                    padding: '6px 12px',
                                    borderRadius: '8px',
                                    marginTop: '10px',
                                    width: '100%',
                                    textAlign: 'center',
                                    textTransform: 'uppercase',
                                    boxSizing: 'border-box'
                                }}>
                                    {ctaText}
                                </div>
                            )}

                            {includeInstruction && templateType !== 'minimal' && (
                                <div style={{ fontSize: '9px', color: '#6b7280', marginTop: '8px', textAlign: 'center' }}>
                                    📱 Mở camera hoặc Zalo để quét mã
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
