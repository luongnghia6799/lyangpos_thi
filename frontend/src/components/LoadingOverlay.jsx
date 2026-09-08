import React, { useState, useEffect } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { Loader2, Sparkles, CheckCircle2, Database, RefreshCw, Zap } from 'lucide-react';
import Portal from './Portal';
import logo from '../assets/logo.png';

const LoadingOverlay = ({ isVisible, message = "Đang khởi động hệ thống..." }) => {
    const [hintIndex, setHintIndex] = useState(0);
    const hints = [
        "Đang thiết lập kết nối bảo mật...",
        "Đang đồng bộ dữ liệu sản phẩm...",
        "Đang tối ưu hóa bộ nhớ...",
        "Gần hoàn tất rồi...",
        "Sẵn sàng phục vụ bạn!"
    ];

    useEffect(() => {
        if (isVisible) {
            const interval = setInterval(() => {
                setHintIndex((prev) => (prev + 1) % hints.length);
            }, 2500);
            return () => clearInterval(interval);
        }
    }, [isVisible]);

    return (
        <Portal>
            <AnimatePresence>
                {isVisible && (
                    <m.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                        className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden"
                    >
                        {/* Animated Mesh Gradient Background */}
                        <div className="absolute inset-0 bg-[#faf8f3] dark:bg-[#050804]">
                            <m.div 
                                animate={{
                                    scale: [1, 1.2, 1],
                                    x: [0, 50, 0],
                                    y: [0, 30, 0],
                                }}
                                transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                                className="absolute -top-[10%] -left-[10%] w-[60%] h-[60%] bg-[#4a7c59]/10 dark:bg-[#4ade80]/5 blur-[120px] rounded-full"
                            />
                            <m.div 
                                animate={{
                                    scale: [1.2, 1, 1.2],
                                    x: [0, -40, 0],
                                    y: [0, -60, 0],
                                }}
                                transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
                                className="absolute -bottom-[10%] -right-[10%] w-[50%] h-[50%] bg-[#f4c430]/10 dark:bg-[#f4c430]/5 blur-[120px] rounded-full"
                            />
                            <m.div 
                                animate={{
                                    scale: [1, 1.5, 1],
                                    opacity: [0.3, 0.6, 0.3],
                                }}
                                transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40%] h-[40%] bg-[#d4a574]/10 dark:bg-[#d4a574]/5 blur-[100px] rounded-full"
                            />
                        </div>

                        {/* Content Container */}
                        <m.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: -20, opacity: 0 }}
                            transition={{ type: "spring", damping: 25, stiffness: 120 }}
                            className="relative z-10 flex flex-col items-center"
                        >
                            {/* Logo with Glow Effect */}
                            <div className="relative group mb-8">
                                <m.div
                                    animate={{ 
                                        scale: [1, 1.05, 1],
                                        rotate: [0, 2, -2, 0]
                                    }}
                                    transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                                    className="relative z-10 w-32 h-32 md:w-40 md:h-40 flex items-center justify-center p-4 bg-white/40 dark:bg-white/5 backdrop-blur-2xl rounded-[2.5rem] shadow-2xl border border-white/20"
                                >
                                    <img 
                                        src={logo} 
                                        alt="LyangPOS Logo" 
                                        className="w-full h-full object-contain filter drop-shadow-lg"
                                    />
                                </m.div>

                                {/* Background Rings */}
                                <m.div 
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                                    className="absolute inset-[-15px] border border-[#2d5016]/20 dark:border-white/10 rounded-[3rem] opacity-50"
                                />
                                <m.div 
                                    animate={{ rotate: -360 }}
                                    transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                                    className="absolute inset-[-30px] border border-[#d4a574]/10 dark:border-white/5 rounded-[3.5rem] opacity-30"
                                />
                                
                                {/* Orbiting Particles */}
                                {[0, 72, 144, 216, 288].map((angle, i) => (
                                    <m.div
                                        key={i}
                                        animate={{
                                            rotate: [angle, angle + 360],
                                        }}
                                        transition={{ duration: 8 + i, repeat: Infinity, ease: "linear" }}
                                        className="absolute inset-0 pointer-events-none"
                                    >
                                        <m.div 
                                            animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                                            transition={{ duration: 2, repeat: Infinity, delay: i * 0.4 }}
                                            className="absolute top-[-40px] left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-gradient-to-br from-[#4a7c59] to-[#f4c430] shadow-[0_0_10px_#f4c430]"
                                        />
                                    </m.div>
                                ))}
                            </div>

                            {/* Brand & Loading Info */}
                            <div className="text-center space-y-6">
                                <m.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3 }}
                                >
                                    <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-[#2d5016] dark:text-white mb-2">
                                        Lyang<span className="text-[#d4a574]">POS</span>
                                    </h1>
                                    <div className="flex items-center justify-center gap-2 text-[#4a7c59] dark:text-[#4ade80] font-bold text-sm uppercase tracking-[0.3em] opacity-80">
                                        <Sparkles size={14} />
                                        <span>QUẢN LÝ VỤ MÙA THÔNG MINH</span>
                                    </div>
                                </m.div>

                                <m.div 
                                    className="px-6 py-3 bg-white/30 dark:bg-white/5 backdrop-blur-md rounded-2xl border border-white/20 shadow-xl inline-flex items-center gap-3"
                                    animate={{ scale: [1, 1.02, 1] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                >
                                    <Loader2 className="animate-spin text-[#d4a574]" size={20} />
                                    <div className="text-left overflow-hidden h-5 min-w-[200px]">
                                        <AnimatePresence mode="wait">
                                            <m.p
                                                key={hintIndex}
                                                initial={{ y: 20, opacity: 0 }}
                                                animate={{ y: 0, opacity: 1 }}
                                                exit={{ y: -20, opacity: 0 }}
                                                className="text-[#2d5016] dark:text-white/80 font-bold text-sm tracking-tight"
                                            >
                                                {hints[hintIndex]}
                                            </m.p>
                                        </AnimatePresence>
                                    </div>
                                </m.div>
                            </div>

                            {/* Modern Progress Line */}
                            <div className="mt-12 w-64 md:w-80 h-1.5 bg-gray-200/50 dark:bg-white/10 rounded-full overflow-hidden backdrop-blur-sm">
                                <m.div
                                    className="h-full bg-gradient-to-r from-[#2d5016] via-[#f4c430] to-[#4a7c59]"
                                    animate={{
                                        x: ["-100%", "100%"]
                                    }}
                                    transition={{
                                        duration: 2.5,
                                        repeat: Infinity,
                                        ease: "easeInOut"
                                    }}
                                    style={{ width: "60%", filter: "drop-shadow(0 0 8px rgba(244,196,48,0.5))" }}
                                />
                            </div>

                            {/* Features Preview (Decorative) */}
                            <div className="mt-16 grid grid-cols-3 gap-8 opacity-40">
                                <div className="flex flex-col items-center gap-2">
                                    <div className="w-10 h-10 rounded-xl bg-white/20 dark:bg-white/5 flex items-center justify-center">
                                        <Database size={20} />
                                    </div>
                                    <span className="text-[10px] font-bold uppercase tracking-widest">Data</span>
                                </div>
                                <div className="flex flex-col items-center gap-2">
                                    <div className="w-10 h-10 rounded-xl bg-white/20 dark:bg-white/5 flex items-center justify-center">
                                        <RefreshCw size={20} />
                                    </div>
                                    <span className="text-[10px] font-bold uppercase tracking-widest">Sync</span>
                                </div>
                                <div className="flex flex-col items-center gap-2">
                                    <div className="w-10 h-10 rounded-xl bg-white/20 dark:bg-white/5 flex items-center justify-center">
                                        <Zap size={20} />
                                    </div>
                                    <span className="text-[10px] font-bold uppercase tracking-widest">Fast</span>
                                </div>
                            </div>
                        </m.div>

                        {/* Corner Accents */}
                        <div className="absolute top-0 left-0 w-32 h-32 border-t-2 border-l-2 border-[#2d5016]/10 rounded-br-[100px]" />
                        <div className="absolute bottom-0 right-0 w-32 h-32 border-b-2 border-r-2 border-[#d4a574]/10 rounded-tl-[100px]" />
                    </m.div>
                )}
            </AnimatePresence>
        </Portal>
    );
};

export default LoadingOverlay;

