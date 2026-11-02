import React, { memo } from 'react';
import { motion as m, AnimatePresence } from 'framer-motion';
import { RotateCw, ChevronLeft, ChevronRight, Zap, Sparkles } from 'lucide-react';
import defaultLogo from '@/assets/logo.png';

/**
 * OrderSwitchOverlay
 * Hoạt ảnh hiển thị khi chuyển đổi đơn hàng hoặc quay lại đơn trước trong POS.
 * 
 * Styles hỗ trợ:
 * - 'ring': Vòng xoay Vụ Mùa (Agri Ring) - Chuẩn thiết kế với logo LyangPOS ở tâm
 * - 'minimal': Thanh nổi Mini (Floating Pill) - Không che màn hình, siêu gọn
 * - 'slide': Trượt thẻ đơn (Smooth Slide) - Thanh gradient trượt ngang mượt mà
 * - 'pulse': Hào quang nhịp thở (Glowing Pulse) - Viền bảng phát sáng nhịp thở
 * - 'none': Tắt hoạt ảnh - Không hiển thị hiệu ứng chờ
 */
const OrderSwitchOverlay = ({
    isVisible = false,
    style = 'ring',
    direction = 'prev',
    logo = defaultLogo,
    message = 'Đang đồng bộ dữ liệu...',
    className = '',
    isAbsolute = true,
}) => {
    if (style === 'none') {
        return null;
    }

    const displayMessage = message && message !== 'Đang đồng bộ dữ liệu...' ? message : (direction === 'current' ? 'Quay lại đơn hiện tại...' : direction === 'prev' ? 'Đang nạp đơn trước...' : 'Đang chuyển đơn kế tiếp...');

    const positionClass = isAbsolute ? 'absolute inset-0 z-[200]' : 'relative w-full h-full min-h-[160px]';

    return (
        <AnimatePresence>
            {isVisible && (
                <m.div
                    key={`order-switch-overlay-${style}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.18 }}
                    className={`${positionClass} select-none pointer-events-none overflow-hidden rounded-3xl flex items-center justify-center ${className}`}
                >
                    {/* STYLE 1: VÒNG XOAY VỤ MÙA (AGRI RING) - CHUẨN THIẾT KẾ MẪU */}
                    {style === 'ring' && (
                        <m.div
                            initial={{ scale: 0.92, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            transition={{ duration: 0.22, ease: 'easeOut' }}
                            className="flex flex-col items-center justify-center gap-3.5 bg-black/20 dark:bg-black/40 w-full h-full rounded-3xl transform-gpu"
                        >
                            <div className="relative w-16 h-16 flex items-center justify-center">
                                {/* Vòng xoay spinner chính */}
                                <div className="absolute inset-0 rounded-full border-[2.5px] border-emerald-500/30 border-t-emerald-600 dark:border-white/10 dark:border-t-emerald-400 animate-spin" style={{ animationDuration: '1.25s' }} />
                                {/* Vòng đứt trang trí bên ngoài */}
                                <div className="absolute -inset-1.5 rounded-full border border-dashed border-[#8b6f47]/30 dark:border-white/20 pointer-events-none" />
                                {/* Logo LyangPOS ở tâm */}
                                <div className="w-9 h-9 flex items-center justify-center relative z-10">
                                    <img
                                        src={logo || defaultLogo}
                                        alt="LyangPOS"
                                        className="w-full h-full object-contain rounded-xl drop-shadow-md"
                                        draggable="false"
                                    />
                                </div>
                            </div>
                            {/* Chữ thương hiệu & Capsule trạng thái */}
                            <div className="flex flex-col items-center gap-1">
                                <span className="text-[10px] font-black uppercase tracking-[0.25em] text-[#8b6f47] dark:text-[#d4a574]">
                                    Lyang<span className="text-emerald-700 dark:text-emerald-400">POS</span>
                                </span>
                                <span className="text-xs font-black text-[#2d5016] dark:text-emerald-300 uppercase tracking-widest px-3.5 py-1 rounded-full bg-card dark:bg-slate-900 border border-[#8b6f47]/25 dark:border-white/10 shadow-sm">
                                    {displayMessage}
                                </span>
                            </div>
                        </m.div>
                    )}

                    {/* STYLE 2: THANH NỔI MINI (FLOATING PILL) - KHÔNG CHE MÀN HÌNH */}
                    {style === 'minimal' && (
                        <m.div
                            initial={{ opacity: 0, y: -16, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -16, scale: 0.9 }}
                            transition={{ duration: 0.20, ease: 'easeOut' }}
                            className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-2.5 px-4 py-2 bg-white/95 dark:bg-slate-900/95 rounded-full border border-emerald-500/40 dark:border-emerald-400/30 shadow-xl pointer-events-auto transform-gpu"
                        >
                            <div className="w-4 h-4 rounded-full border-2 border-emerald-500/30 border-t-emerald-600 dark:border-emerald-400/30 dark:border-t-emerald-400 animate-spin" style={{ animationDuration: '1.25s' }} />
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-xs font-black text-[#2d5016] dark:text-emerald-300 uppercase tracking-wide">
                                {direction === 'current' ? 'Đang quay lại đơn hiện tại...' : direction === 'next' ? 'Đang chuyển đơn kế tiếp...' : 'Đang nạp đơn trước...'}
                            </span>
                        </m.div>
                    )}

                    {/* STYLE 3: TRƯỢT THẺ ĐƠN (SMOOTH SLIDE) - CHUYỂN CẢNH MƯỢT MÀ */}
                    {style === 'slide' && (
                        <m.div
                            initial={{ opacity: 0, x: direction === 'next' ? 24 : -24 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: direction === 'next' ? -24 : 24 }}
                            transition={{ duration: 0.18, ease: 'easeOut' }}
                            className="absolute inset-x-4 top-3.5 flex items-center justify-between px-4 py-2.5 bg-gradient-to-r from-[#2d5016]/95 via-emerald-800/95 to-teal-800/95 text-white rounded-2xl shadow-xl border border-emerald-400/30 pointer-events-auto transform-gpu"
                        >
                            <div className="flex items-center gap-2.5">
                                <div className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
                                    {direction === 'current' ? (
                                        <RotateCw size={15} strokeWidth={2.8} />
                                    ) : direction === 'next' ? (
                                        <ChevronRight size={15} strokeWidth={2.8} />
                                    ) : (
                                        <ChevronLeft size={15} strokeWidth={2.8} />
                                    )}
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[11px] font-black uppercase tracking-wider">
                                        {direction === 'current' ? 'Quay lại hiện tại' : direction === 'next' ? 'Chuyển đơn kế tiếp' : 'Quay lại đơn trước'}
                                    </span>
                                    <span className="text-[9px] font-medium text-emerald-200">
                                        {direction === 'current' ? 'Đang khôi phục đơn hàng đang tạo...' : 'Đang cập nhật giỏ hàng & thông tin hóa đơn...'}
                                    </span>
                                </div>
                            </div>
                            <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin shrink-0" style={{ animationDuration: '1.25s' }} />
                        </m.div>
                    )}

                    {/* STYLE 4: HÀO QUANG NHỊP THỞ (GLOWING PULSE) - SANG TRỌNG TINH TẾ */}
                    {style === 'pulse' && (
                        <div className="absolute inset-0 w-full h-full flex items-center justify-center transform-gpu">
                            {/* Viền hào quang nhịp thở viền ngoài */}
                            <m.div
                                animate={{ opacity: [0.35, 0.85, 0.35], scale: [0.995, 1, 0.995] }}
                                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                                className="absolute inset-0 rounded-3xl border-2 border-emerald-500 shadow-[0_0_24px_rgba(16,185,129,0.35)] bg-emerald-500/[0.04] dark:bg-emerald-500/[0.08]"
                            />
                            {/* Huy hiệu trung tâm */}
                            <m.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.9, opacity: 0 }}
                                transition={{ duration: 0.15 }}
                                className="relative px-5 py-2.5 rounded-2xl bg-card dark:bg-slate-900 border border-emerald-500/40 shadow-2xl flex items-center gap-3 transform-gpu"
                            >
                                <div className="relative flex items-center justify-center">
                                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping absolute" />
                                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 relative" />
                                </div>
                                <span className="text-xs font-black text-[#2d5016] dark:text-emerald-300 uppercase tracking-widest">
                                    {displayMessage}
                                </span>
                            </m.div>
                        </div>
                    )}
                </m.div>
            )}
        </AnimatePresence>
    );
};

export default memo(OrderSwitchOverlay);
