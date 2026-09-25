import React, { useRef, useState } from 'react';
import { m } from 'framer-motion';
import { X, Image as ImageIcon, FileText, Copy, Check, Printer, Loader2, Sparkles, Truck, Package } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { cn, normalizeUOM, formatDate, formatNumber } from '../../lib/utils';
import { saveOrOpenFile } from '../../utils/downloadHelper';
import Portal from '../widgets/Portal';

export default function PurchaseOrderExportModal({
    isOpen,
    onClose,
    cart = [],
    partner = null,
    note = '',
    settings = {}
}) {
    const slipRef = useRef(null);
    const [isExporting, setIsExporting] = useState(false);
    const [exportStatus, setExportStatus] = useState('');
    const [copied, setCopied] = useState(false);

    if (!isOpen) return null;

    const shopName = settings.shop_name || 'CỬA HÀNG VẬT TƯ';
    const shopAddress = settings.shop_address || '';
    const shopPhone = settings.shop_phone || '';

    const currentDateStr = formatDate(new Date(), 'DD/MM/YYYY HH:mm');
    const partnerName = partner ? partner.name : 'Nhà cung cấp';
    const partnerPhone = partner ? partner.phone : '';
    const partnerAddress = partner ? partner.address : '';

    const totalQty = cart.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
    const totalLines = cart.length;

    // Helper to generate canvas
    const generateCanvas = async () => {
        if (!slipRef.current) return null;
        try {
            // Ensure fonts in main window are loaded before capturing
            if (document.fonts && document.fonts.ready) {
                await document.fonts.ready;
            }

            // Get current active app font from document styles
            const computedFont = window.getComputedStyle(document.body).fontFamily || 
                window.getComputedStyle(document.documentElement).getPropertyValue('--app-global-font') || 
                '"Be Vietnam Pro", sans-serif';

            return await html2canvas(slipRef.current, {
                scale: 3, // Crisp resolution
                useCORS: true,
                allowTaint: true,
                backgroundColor: '#ffffff',
                logging: false,
                scrollX: 0,
                scrollY: 0,
                onclone: async (clonedDoc) => {
                    // Extract Google Font link from parent document to ensure same typography
                    const fontLinks = document.querySelectorAll('link[href*="fonts.googleapis.com"]');
                    fontLinks.forEach(link => {
                        const newLink = clonedDoc.createElement('link');
                        newLink.rel = 'stylesheet';
                        newLink.href = link.href;
                        clonedDoc.head.appendChild(newLink);
                    });

                    // Remove existing tailwind styles that might have unsupported CSS color functions
                    const styles = clonedDoc.querySelectorAll('style, link[rel="stylesheet"]:not([href*="fonts.googleapis.com"])');
                    styles.forEach(s => s.remove());

                    // Inject clean, standard CSS for the exported slip using the user's active font
                    const customStyle = clonedDoc.createElement('style');
                    customStyle.innerHTML = `
                        @import url('https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:ital,wght@0,300;0,400;0,600;0,700;0,800;0,900;1,400;1,600;1,700&display=swap');
                        * {
                            box-sizing: border-box !important;
                            font-family: ${computedFont} !important;
                            -webkit-print-color-adjust: exact !important;
                            color-adjust: exact !important;
                            margin: 0;
                            padding: 0;
                        }
                        .po-slip-container {
                            background-color: #ffffff !important;
                            color: #0f172a !important;
                            padding: 24px 32px !important;
                            width: 650px !important;
                            box-sizing: border-box !important;
                            border: 1px solid #e2e8f0 !important;
                            border-radius: 16px !important;
                            box-shadow: none !important;
                        }
                        .po-header {
                            display: flex !important;
                            flex-direction: row !important;
                            justify-content: space-between !important;
                            align-items: center !important;
                            border-bottom: 2px solid #0f172a !important;
                            padding-bottom: 12px !important;
                            margin-bottom: 16px !important;
                        }
                        .po-shop-name {
                            font-size: 18px !important;
                            font-weight: 900 !important;
                            text-transform: uppercase !important;
                            color: #0f172a !important;
                            margin: 0 !important;
                            line-height: 1.2 !important;
                        }
                        .po-shop-sub {
                            font-size: 12px !important;
                            color: #475569 !important;
                            margin: 2px 0 0 !important;
                            line-height: 1.3 !important;
                        }
                        .po-title-box {
                            text-align: center !important;
                            margin: 12px 0 16px 0 !important;
                        }
                        .po-title {
                            font-size: 20px !important;
                            font-weight: 900 !important;
                            text-transform: uppercase !important;
                            color: #065f46 !important;
                            margin: 0 !important;
                            letter-spacing: 0.5px !important;
                            line-height: 1.2 !important;
                        }
                        .po-subtitle {
                            font-size: 11px !important;
                            font-weight: 600 !important;
                            color: #64748b !important;
                            font-style: italic !important;
                            margin-top: 4px !important;
                            line-height: 1.3 !important;
                        }
                        .po-info-box {
                            background-color: #f8fafc !important;
                            border: 1px solid #e2e8f0 !important;
                            border-radius: 12px !important;
                            padding: 12px 16px !important;
                            margin: 14px 0 18px 0 !important;
                            font-size: 12px !important;
                        }
                        .po-info-row {
                            display: flex !important;
                            flex-direction: row !important;
                            align-items: center !important;
                            min-height: 24px !important;
                            line-height: 1.2 !important;
                        }
                        .po-info-label {
                            font-weight: 800 !important;
                            color: #334155 !important;
                            width: 110px !important;
                            min-width: 110px !important;
                            flex-shrink: 0 !important;
                            display: flex !important;
                            align-items: center !important;
                            line-height: 1.2 !important;
                        }
                        .po-partner-name {
                            font-size: 14px !important;
                            font-weight: 900 !important;
                            color: #064e3b !important;
                            text-transform: uppercase !important;
                            line-height: 1.2 !important;
                            display: flex !important;
                            align-items: center !important;
                        }
                        .po-table-wrap {
                            border: 1px solid #cbd5e1 !important;
                            border-radius: 12px !important;
                            overflow: hidden !important;
                            margin-top: 14px !important;
                        }
                        .po-table {
                            width: 100% !important;
                            border-collapse: collapse !important;
                            font-size: 12px !important;
                            table-layout: fixed !important;
                        }
                        .po-table th {
                            background-color: #f1f5f9 !important;
                            color: #0f172a !important;
                            font-weight: 900 !important;
                            border-bottom: 1.5px solid #0f172a !important;
                            font-size: 11px !important;
                            text-transform: uppercase !important;
                            padding: 0 !important;
                            height: 38px !important;
                        }
                        .po-th-inner {
                            height: 38px !important;
                            display: flex !important;
                            align-items: center !important;
                            justify-content: center !important;
                            line-height: 1 !important;
                            padding: 0 6px !important;
                        }
                        .po-th-inner.po-th-name {
                            justify-content: flex-start !important;
                            padding-left: 12px !important;
                        }
                        .po-table td {
                            border-bottom: 1px solid #f1f5f9 !important;
                            padding: 0 !important;
                            height: 48px !important;
                        }
                        .po-td-inner {
                            min-height: 48px !important;
                            display: flex !important;
                            align-items: center !important;
                            justify-content: center !important;
                            padding: 6px !important;
                            box-sizing: border-box !important;
                        }
                        .po-td-inner.po-td-name {
                            justify-content: flex-start !important;
                            padding-left: 12px !important;
                        }
                        .po-table tbody tr {
                            background-color: #ffffff !important;
                        }
                        .po-table tbody tr:last-child td {
                            border-bottom: none !important;
                        }
                        .po-prod-col {
                            display: flex !important;
                            flex-direction: column !important;
                            justify-content: center !important;
                            text-align: left !important;
                        }
                        .po-prod-name {
                            display: block !important;
                            font-weight: 800 !important;
                            color: #0f172a !important;
                            line-height: 1.25 !important;
                            font-size: 13px !important;
                        }
                        .po-prod-ai {
                            display: block !important;
                            font-size: 11px !important;
                            color: #64748b !important;
                            font-style: italic !important;
                            font-weight: normal !important;
                            margin-top: 2px !important;
                            line-height: 1.2 !important;
                        }
                        .po-spec-text {
                            font-size: 11.5px !important;
                            color: #334155 !important;
                            font-weight: 600 !important;
                            line-height: 1.2 !important;
                            text-align: center !important;
                            display: block !important;
                        }
                        .po-qty-cell {
                            background-color: #f0fdf4 !important;
                            color: #059669 !important;
                            font-weight: 900 !important;
                            font-size: 15px !important;
                        }
                        .po-table-tfoot {
                            background-color: #f8fafc !important;
                            font-weight: 900 !important;
                            color: #0f172a !important;
                        }
                        .po-table-tfoot td {
                            height: 42px !important;
                            border-top: 1.5px solid #0f172a !important;
                            padding: 0 !important;
                        }
                        .po-tfoot-inner-label {
                            height: 42px !important;
                            display: flex !important;
                            align-items: center !important;
                            justify-content: flex-end !important;
                            padding: 0 12px !important;
                            line-height: 1 !important;
                            font-weight: 900 !important;
                            font-size: 12px !important;
                            text-transform: uppercase !important;
                            letter-spacing: 0.5px !important;
                        }
                        .po-total-qty {
                            background-color: #d1fae5 !important;
                            color: #065f46 !important;
                            border-top: 1.5px solid #0f172a !important;
                        }
                        .po-tfoot-inner-qty {
                            height: 42px !important;
                            display: flex !important;
                            align-items: center !important;
                            justify-content: center !important;
                            font-size: 16px !important;
                            font-weight: 900 !important;
                            line-height: 1 !important;
                        }
                    `;
                    clonedDoc.head.appendChild(customStyle);

                    if (clonedDoc.fonts && clonedDoc.fonts.ready) {
                        await clonedDoc.fonts.ready;
                    }
                }
            });
        } catch (canvasErr) {
            console.error('html2canvas error:', canvasErr);
            throw canvasErr;
        }
    };

    // 1. Export as PNG Image
    const handleDownloadImage = async () => {
        try {
            setIsExporting(true);
            setExportStatus('Đang tạo hình ảnh...');
            const canvas = await generateCanvas();
            if (!canvas) throw new Error('Không tạo được canvas');

            const fileName = `phieu_dat_hang_${(partner?.name || 'NCC').replace(/\s+/g, '_')}_${new Date().getTime()}.png`;

            // Try direct blob conversion first
            canvas.toBlob(async (blob) => {
                try {
                    if (blob) {
                        await saveOrOpenFile(blob, fileName);
                    } else {
                        // Fallback to dataURL
                        const dataUrl = canvas.toDataURL('image/png');
                        await saveOrOpenFile(dataUrl, fileName);
                    }
                    setExportStatus('Đã tải ảnh thành công!');
                    setTimeout(() => setExportStatus(''), 3000);
                } catch (e) {
                    console.error('Save file error:', e);
                    // Standard browser anchor fallback
                    const dataUrl = canvas.toDataURL('image/png');
                    const link = document.createElement('a');
                    link.href = dataUrl;
                    link.download = fileName;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                } finally {
                    setIsExporting(false);
                }
            }, 'image/png');
        } catch (err) {
            console.error('Error downloading image:', err);
            setIsExporting(false);
            setExportStatus('Lỗi xuất ảnh!');
            alert('Không thể tạo file ảnh: ' + err.message);
        }
    };

    // 2. Copy Image to Clipboard (Direct paste into Zalo / Chat)
    const handleCopyImage = async () => {
        try {
            setIsExporting(true);
            setExportStatus('Đang sao chép hình ảnh...');
            const canvas = await generateCanvas();
            if (!canvas) return;

            canvas.toBlob(async (blob) => {
                try {
                    if (blob && navigator.clipboard && window.ClipboardItem) {
                        await navigator.clipboard.write([
                            new ClipboardItem({ 'image/png': blob })
                        ]);
                        setCopied(true);
                        setExportStatus('Đã copy ảnh! Bạn có thể dán (Ctrl+V) vào Zalo ngay.');
                        setTimeout(() => setCopied(false), 3000);
                        setTimeout(() => setExportStatus(''), 4000);
                    } else {
                        // If ClipboardItem API not supported, trigger download as fallback
                        setExportStatus('Không hỗ trợ copy trực tiếp, đang tải ảnh...');
                        await handleDownloadImage();
                    }
                } catch (e) {
                    console.warn('Clipboard write error, falling back to download:', e);
                    await handleDownloadImage();
                } finally {
                    setIsExporting(false);
                }
            }, 'image/png');
        } catch (err) {
            console.error('Error copying image:', err);
            setIsExporting(false);
            setExportStatus('Không thể copy, đang chuyển sang tải ảnh...');
            await handleDownloadImage();
        }
    };

    // 3. Export as PDF
    const handleDownloadPDF = async () => {
        try {
            setIsExporting(true);
            setExportStatus('Đang tạo file PDF...');
            const canvas = await generateCanvas();
            if (!canvas) return;

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });

            const imgWidth = 190;
            const pageHeight = 295;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            let heightLeft = imgHeight;
            let position = 10;

            pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;

            while (heightLeft >= 0) {
                position = heightLeft - imgHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
                heightLeft -= pageHeight;
            }

            const fileName = `phieu_dat_hang_${(partner?.name || 'NCC').replace(/\s+/g, '_')}_${new Date().getTime()}.pdf`;
            const pdfBlob = pdf.output('blob');
            await saveOrOpenFile(pdfBlob, fileName);
            setExportStatus('Đã tải file PDF thành công!');
            setTimeout(() => setExportStatus(''), 3000);
        } catch (err) {
            console.error('Error downloading PDF:', err);
            alert('Không thể tạo file PDF: ' + err.message);
        } finally {
            setIsExporting(false);
        }
    };

    // 4. Quick Print
    const handleQuickPrint = () => {
        const printContent = slipRef.current;
        if (!printContent) return;

        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        printWindow.document.write(`
            <html>
                <head>
                    <title>Phiếu Đặt Hàng</title>
                    <style>
                        @page { size: auto; margin: 10mm; }
                        body { font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 0; background: #fff; color: #000; }
                        table { width: 100%; border-collapse: collapse; margin-top: 10px; text-align: center; }
                        th, td { border: 1px solid #333; padding: 6px 8px; text-align: center; font-size: 13px; }
                        th { background-color: #f2f2f2; text-transform: uppercase; font-weight: bold; }
                        .text-center { text-align: center; }
                        .text-right { text-align: right; }
                        .title { text-align: center; font-size: 20px; font-weight: bold; text-transform: uppercase; margin: 10px 0 5px; color: #1e3a8a; }
                        .header { display: flex; justify-content: space-between; border-bottom: 2px solid #333; padding-bottom: 8px; margin-bottom: 12px; }
                        .info-row { display: flex; margin-bottom: 4px; font-size: 13px; }
                        .info-label { font-weight: bold; width: 130px; }
                    </style>
                </head>
                <body>
                    ${printContent.outerHTML}
                </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 300);
    };

    return (
        <Portal>
            <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 md:p-6 bg-black/60 backdrop-blur-sm select-none">
                <m.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                    className="relative w-full max-w-4xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/50">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-xs">
                                <FileText size={20} strokeWidth={2.5} />
                            </div>
                            <div>
                                <h3 className="text-base font-black text-slate-800 dark:text-white uppercase tracking-tight flex items-center gap-2">
                                    Xuất Phiếu Đặt Hàng NCC
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/20 uppercase tracking-widest">
                                        Không lưu đơn
                                    </span>
                                </h3>
                                <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500">
                                    Chỉ bao gồm Tên sản phẩm, Số lượng & Quy cách (Ẩn giá tiền và công nợ)
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={onClose}
                            className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                        >
                            <X size={18} strokeWidth={2.5} />
                        </button>
                    </div>

                    {/* Body: Preview Area */}
                    <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-100/70 dark:bg-slate-950/60 flex justify-center items-start">
                        {/* Printable Order Sheet (Rendered White Paper) */}
                        <div
                            ref={slipRef}
                            data-po-slip="true"
                            className="po-slip-container w-full max-w-[650px] bg-white text-slate-900 p-6 md:p-8 rounded-2xl shadow-lg border border-slate-200 font-sans"
                            style={{ minHeight: '400px', backgroundColor: '#ffffff', color: '#0f172a' }}
                        >
                            {/* Shop Header */}
                            <div className="po-header flex justify-between items-center border-b-2 border-slate-800 pb-3 mb-4">
                                <div>
                                    <h4 className="po-shop-name text-lg font-black uppercase text-slate-900 tracking-tight">{shopName}</h4>
                                    {shopAddress && <p className="po-shop-sub text-xs text-slate-600 font-medium">{shopAddress}</p>}
                                    {shopPhone && <p className="po-shop-sub text-xs text-slate-600 font-semibold">Hotline: {shopPhone}</p>}
                                </div>
                                <div className="text-right">
                                    <p className="text-[11px] font-bold text-slate-600">Ngày: {currentDateStr}</p>
                                </div>
                            </div>

                            {/* Title */}
                            <div className="po-title-box text-center my-3">
                                <h2 className="po-title text-xl md:text-2xl font-black uppercase tracking-wider text-emerald-800">
                                    PHIẾU ĐẶT HÀNG NHÀ CUNG CẤP
                                </h2>
                                <p className="po-subtitle text-xs font-bold text-slate-500 italic mt-0.5">
                                    (Gửi đơn đặt sản phẩm theo số lượng và quy cách)
                                </p>
                            </div>

                            {/* Partner & Note Info */}
                            <div className="po-info-box bg-slate-50 p-4 rounded-xl border border-slate-200 my-4 space-y-1.5 text-xs">
                                <div className="po-info-row flex items-center gap-2">
                                    <span className="po-info-label font-extrabold text-slate-700 w-28 shrink-0 flex items-center">Kính gửi NCC:</span>
                                    <span className="po-partner-name font-black text-emerald-900 uppercase text-sm flex items-center">{partnerName}</span>
                                </div>
                                {partnerPhone && (
                                    <div className="po-info-row flex items-center gap-2">
                                        <span className="po-info-label font-bold text-slate-600 w-28 shrink-0 flex items-center">Số điện thoại:</span>
                                        <span className="font-semibold text-slate-800 flex items-center">{partnerPhone}</span>
                                    </div>
                                )}
                                {partnerAddress && (
                                    <div className="po-info-row flex items-center gap-2">
                                        <span className="po-info-label font-bold text-slate-600 w-28 shrink-0 flex items-center">Địa chỉ:</span>
                                        <span className="font-medium text-slate-800 flex items-center">{partnerAddress}</span>
                                    </div>
                                )}
                                {note && (
                                    <div className="po-info-row flex items-start gap-2 pt-1 border-t border-slate-200/80">
                                        <span className="po-info-label font-bold text-slate-600 w-28 shrink-0">Ghi chú đặt hàng:</span>
                                        <span className="font-bold text-amber-900 italic">{note}</span>
                                    </div>
                                )}
                            </div>

                            {/* Products Table */}
                            <div className="po-table-wrap border border-slate-300 rounded-xl overflow-hidden mt-4">
                                 <table className="po-table w-full border-collapse text-xs">
                                     <colgroup>
                                         <col style={{ width: '42px' }} />
                                         <col style={{ width: 'auto' }} />
                                         <col style={{ width: '115px' }} />
                                         <col style={{ width: '60px' }} />
                                         <col style={{ width: '80px' }} />
                                     </colgroup>
                                     <thead>
                                         <tr className="bg-slate-100 border-b border-slate-800 text-slate-900">
                                             <th className="font-black">
                                                 <div className="po-th-inner">STT</div>
                                             </th>
                                             <th className="po-th-name font-black">
                                                 <div className="po-th-inner po-th-name">TÊN SẢN PHẨM / HOẠT CHẤT</div>
                                             </th>
                                             <th className="font-black">
                                                 <div className="po-th-inner">QUY CÁCH</div>
                                             </th>
                                             <th className="font-black">
                                                 <div className="po-th-inner">ĐVT</div>
                                             </th>
                                             <th className="font-black bg-emerald-50 text-emerald-900">
                                                 <div className="po-th-inner">SỐ LƯỢNG</div>
                                             </th>
                                         </tr>
                                     </thead>
                                     <tbody>
                                         {cart.length === 0 ? (
                                             <tr>
                                                 <td colSpan={5} className="py-8 text-center text-slate-400 italic">
                                                     Chưa có sản phẩm nào trong giỏ hàng
                                                 </td>
                                             </tr>
                                         ) : (
                                             cart.map((item, idx) => {
                                                 const prodName = item.product_name || item.name || 'Sản phẩm';
                                                 const unit = item.unit || 'Cái';
                                                 const secUnit = item.secondary_unit;
                                                 const mult = item.multiplier || 1;
                                                 const secQty = item.secondary_qty;

                                                 let specText = '—';
                                                 if (secUnit && mult > 1) {
                                                     specText = `${formatNumber(secQty || (item.quantity / mult))} ${normalizeUOM(secUnit)} (x${mult})`;
                                                 }

                                                 return (
                                                     <tr key={idx} className="bg-white border-b border-slate-100 last:border-b-0">
                                                         <td>
                                                             <div className="po-td-inner font-bold text-slate-600">
                                                                 {idx + 1}
                                                             </div>
                                                         </td>
                                                         <td className="po-td-name">
                                                             <div className="po-td-inner po-td-name">
                                                                 <div className="po-prod-col">
                                                                     <div className="po-prod-name font-black text-slate-900 tracking-tight" style={{ fontWeight: 800 }}>
                                                                         {prodName}
                                                                     </div>
                                                                     {item.active_ingredient && (
                                                                         <div className="po-prod-ai text-[11px] text-slate-500 font-normal italic mt-0.5" style={{ fontWeight: 400 }}>
                                                                             {item.active_ingredient}
                                                                         </div>
                                                                     )}
                                                                 </div>
                                                             </div>
                                                         </td>
                                                         <td>
                                                             <div className="po-td-inner">
                                                                 <span className="po-spec-text whitespace-nowrap">{specText}</span>
                                                             </div>
                                                         </td>
                                                         <td>
                                                             <div className="po-td-inner font-extrabold text-slate-800 uppercase">
                                                                 {normalizeUOM(unit)}
                                                             </div>
                                                         </td>
                                                         <td className="po-qty-cell">
                                                             <div className="po-td-inner font-black text-emerald-700">
                                                                 {formatNumber(item.quantity)}
                                                             </div>
                                                         </td>
                                                     </tr>
                                                 );
                                             })
                                         )}
                                     </tbody>
                                     <tfoot>
                                         <tr className="po-table-tfoot bg-slate-100 font-black text-slate-900 border-t-[1.5px] border-slate-900">
                                             <td colSpan={4}>
                                                 <div className="po-tfoot-inner-label">
                                                     TỔNG CỘNG SỐ LƯỢNG ({totalLines} mặt hàng):
                                                 </div>
                                             </td>
                                             <td className="po-total-qty">
                                                 <div className="po-tfoot-inner-qty">
                                                     {formatNumber(totalQty)}
                                                 </div>
                                             </td>
                                         </tr>
                                     </tfoot>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="p-4 px-6 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                            {exportStatus && (
                                <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 animate-pulse">
                                    <Sparkles size={14} />
                                    {exportStatus}
                                </span>
                            )}
                        </div>

                        <div className="flex items-center gap-2 flex-wrap">
                            {/* Copy Image Button */}
                            <m.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                disabled={cart.length === 0 || isExporting}
                                onClick={handleCopyImage}
                                className="px-4 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-md shadow-amber-500/20 disabled:opacity-40 transition-all cursor-pointer"
                                title="Copy ảnh để dán (Ctrl+V) trực tiếp vào Zalo / Messenger"
                            >
                                {copied ? <Check size={16} strokeWidth={3} /> : <Copy size={16} strokeWidth={2.5} />}
                                <span>{copied ? 'ĐÃ COPY ẢNH' : 'COPY ẢNH GỬI ZALO'}</span>
                            </m.button>

                            {/* Download PNG Button */}
                            <m.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                disabled={cart.length === 0 || isExporting}
                                onClick={handleDownloadImage}
                                className="px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-md shadow-emerald-600/20 disabled:opacity-40 transition-all cursor-pointer"
                            >
                                <ImageIcon size={16} strokeWidth={2.5} />
                                <span>TẢI ẢNH (PNG)</span>
                            </m.button>

                            {/* Download PDF Button */}
                            <m.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                disabled={cart.length === 0 || isExporting}
                                onClick={handleDownloadPDF}
                                className="px-4 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-md shadow-blue-600/20 disabled:opacity-40 transition-all cursor-pointer"
                            >
                                <FileText size={16} strokeWidth={2.5} />
                                <span>TẢI PDF</span>
                            </m.button>

                            {/* Quick Print Button */}
                            <m.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                disabled={cart.length === 0 || isExporting}
                                onClick={handleQuickPrint}
                                className="px-3.5 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer"
                                title="In nhanh phiếu đặt hàng"
                            >
                                <Printer size={16} strokeWidth={2} />
                                <span>IN PHIẾU</span>
                            </m.button>
                        </div>
                    </div>
                </m.div>
            </div>
        </Portal>
    );
}
