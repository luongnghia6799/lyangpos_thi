import React, { useEffect, useRef, useState } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { X, Camera, AlertCircle } from 'lucide-react';
import Portal from './Portal';
import useMobileNative from '../hooks/useMobileNative';

export default function MobileBarcodeScannerModal({ isOpen, onClose, onScan }) {
    const mobileNative = useMobileNative();
    const triggerHaptic = mobileNative?.triggerHaptic || (() => {});
    const [scannerError, setScannerError] = useState(null);
    const [isScanning, setIsScanning] = useState(false);
    const html5QrcodeRef = useRef(null);
    const scannerId = "mobile-barcode-reader";

    useEffect(() => {
        if (!isOpen) return;
        setScannerError(null);
        setIsScanning(true);

        const startScanner = async () => {
            try {
                await new Promise(resolve => setTimeout(resolve, 250));
                
                // Request camera permission explicitly first
                if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                    try {
                        const initStream = await navigator.mediaDevices.getUserMedia({ video: true });
                        initStream.getTracks().forEach(t => t.stop());
                    } catch (permErr) {
                        console.warn("Permission request error:", permErr);
                    }
                }

                const { Html5Qrcode } = await import('html5-qrcode');
                const element = document.getElementById(scannerId);
                if (!element) return;

                const scannerInstance = new Html5Qrcode(scannerId);
                html5QrcodeRef.current = scannerInstance;

                // Try starting camera with back camera fallback
                const cameraConfig = { fps: 15, qrbox: { width: 260, height: 160 }, aspectRatio: 1.0 };
                
                try {
                    await scannerInstance.start(
                        { facingMode: "environment" },
                        cameraConfig,
                        (decodedText) => {
                            try { triggerHaptic('success'); } catch (e) {}
                            if (onScan) onScan(decodedText);
                            if (onClose) onClose();
                        },
                        () => {}
                    );
                } catch (e1) {
                    // Fallback to user facing camera or default camera
                    await scannerInstance.start(
                        { facingMode: "user" },
                        cameraConfig,
                        (decodedText) => {
                            try { triggerHaptic('success'); } catch (e) {}
                            if (onScan) onScan(decodedText);
                            if (onClose) onClose();
                        },
                        () => {}
                    );
                }
            } catch (err) {
                console.error("Camera scanner error:", err);
                setScannerError("Máy ảnh bị chặn hoặc trình duyệt yêu cầu kết nối HTTPS. Bạn có thể chụp ảnh mã vạch để quét bên dưới.");
                setIsScanning(false);
            }
        };

        startScanner();

        return () => {
            if (html5QrcodeRef.current) {
                try {
                    html5QrcodeRef.current
                        .stop()
                        .then(() => {
                            try { html5QrcodeRef.current?.clear(); } catch (e) {}
                        })
                        .catch(() => {});
                } catch (e) {}
                html5QrcodeRef.current = null;
            }
        };
    }, [isOpen]);

    const handleFileScan = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            const { Html5Qrcode } = await import('html5-qrcode');
            const tempScanner = new Html5Qrcode("file-scan-temp");
            const decodedText = await tempScanner.scanFile(file, true);
            try { triggerHaptic('success'); } catch (err) {}
            if (onScan) onScan(decodedText);
            if (onClose) onClose();
        } catch (err) {
            console.error("File barcode scan error:", err);
            alert("Không nhận diện được mã vạch trong ảnh chụp. Vui lòng thử chụp lại rõ hơn.");
        }
    };

    if (!isOpen) return null;

    return (
        <Portal>
            <AnimatePresence>
                {isOpen && (
                    <div className="fixed inset-0 z-[500000] flex flex-col justify-between bg-slate-950 text-white android-webview overflow-hidden">
                        {/* Top Bar */}
                        <div className="px-4 py-3 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between z-20 shrink-0">
                            <div className="flex items-center gap-2">
                                <Camera size={20} className="text-primary dark:text-emerald-400" />
                                <span className="font-extrabold text-sm text-white">Quét Mã Vạch Sản Phẩm</span>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 active:scale-95 transition-all"
                            >
                                <X size={22} />
                            </button>
                        </div>

                        {/* Camera Scanner Container */}
                        <div className="flex-1 relative flex flex-col items-center justify-center bg-black">
                            <div id={scannerId} className="w-full h-full max-h-[70vh] object-cover" />

                            {/* Scanning Guide Overlay Frame */}
                            {isScanning && !scannerError && (
                                <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
                                    <div className="w-[280px] h-[180px] border-2 border-emerald-400/80 rounded-2xl relative shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]">
                                        {/* Corner brackets */}
                                        <div className="absolute top-0 left-0 w-5 h-5 border-t-4 border-l-4 border-emerald-500 rounded-tl-xl -mt-1 -ml-1" />
                                        <div className="absolute top-0 right-0 w-5 h-5 border-t-4 border-r-4 border-emerald-500 rounded-tr-xl -mt-1 -mr-1" />
                                        <div className="absolute bottom-0 left-0 w-5 h-5 border-b-4 border-l-4 border-emerald-500 rounded-bl-xl -mb-1 -ml-1" />
                                        <div className="absolute bottom-0 right-0 w-5 h-5 border-b-4 border-r-4 border-emerald-500 rounded-br-xl -mb-1 -mr-1" />

                                        {/* Animated Laser Beam */}
                                        <m.div
                                            animate={{ y: [0, 160, 0] }}
                                            transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                                            className="w-full h-0.5 bg-emerald-400 shadow-[0_0_12px_#34d399]"
                                        />
                                    </div>
                                    <span className="text-xs font-bold text-slate-200 mt-6 px-4 py-1.5 rounded-full bg-slate-900/80 backdrop-blur-sm border border-slate-700">
                                        Căn chỉnh mã vạch vào giữa khung quét
                                    </span>
                                </div>
                            )}

                            {/* Error State */}
                            {scannerError && (
                                <div className="p-6 text-center max-w-sm flex flex-col items-center gap-3">
                                    <AlertCircle size={40} className="text-rose-500" />
                                    <p className="text-sm font-semibold text-slate-300 leading-relaxed">
                                        {scannerError}
                                    </p>
                                    <button
                                        onClick={onClose}
                                        className="mt-2 px-5 py-2.5 bg-primary text-white font-bold text-xs rounded-xl shadow-md"
                                    >
                                        Đóng & Tìm thủ công
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Hidden element for photo barcode decoding */}
                        <div id="file-scan-temp" className="hidden" />

                        {/* Bottom Action Footer */}
                        <div className="p-4 bg-slate-900/90 border-t border-slate-800 flex flex-col gap-2.5 shrink-0">
                            <label className="w-full py-3 bg-primary dark:bg-emerald-600 hover:bg-primary-hover text-white font-bold text-xs rounded-xl uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98">
                                <Camera size={18} />
                                <span>Chụp / Tải ảnh mã vạch</span>
                                <input
                                    type="file"
                                    accept="image/*"
                                    capture="environment"
                                    className="hidden"
                                    onChange={handleFileScan}
                                />
                            </label>

                            <button
                                onClick={onClose}
                                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl uppercase tracking-wider transition-all"
                            >
                                Hủy Bỏ
                            </button>
                        </div>
                    </div>
                )}
            </AnimatePresence>
        </Portal>
    );
}
