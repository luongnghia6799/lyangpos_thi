import React from 'react';
import { m } from 'framer-motion';
import { ShieldAlert, Home, ArrowLeft, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Unauthorized = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-transparent dark:bg-slate-950 p-6">
            <div className="max-w-md w-full text-center">
                <m.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 260, damping: 20 }}
                    className="mb-8 flex justify-center"
                >
                    <div className="relative">
                        <div className="absolute inset-0 bg-rose-500 blur-3xl opacity-20 animate-pulse" />
                        <div className="w-32 h-32 bg-rose-500/10 rounded-full flex items-center justify-center border-4 border-rose-500/30 relative z-10">
                            <Lock size={64} className="text-rose-500" />
                        </div>
                    </div>
                </m.div>

                <m.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                >
                    <h1 className="text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tighter mb-4">
                        Truy cập bị chặn
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 font-medium mb-12">
                        Xin lỗi, bạn không có quyền truy cập vào trang này. Vui lòng liên hệ quản trị viên nếu bạn tin rằng đây là một sự nhầm lẫn.
                    </p>
                </m.div>

                <div className="grid grid-cols-2 gap-4">
                    <m.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => navigate(-1)}
                        className="flex items-center justify-center gap-2 px-6 py-4 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-2xl font-black uppercase tracking-wider text-xs transition-colors hover:bg-slate-300 dark:hover:bg-slate-700"
                    >
                        <ArrowLeft size={18} /> Quay lại
                    </m.button>
                    <m.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => navigate('/')}
                        className="flex items-center justify-center gap-2 px-6 py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-wider text-xs transition-all shadow-lg shadow-emerald-600/20 hover:shadow-emerald-600/40"
                    >
                        <Home size={18} /> Trang chủ
                    </m.button>
                </div>

                <div className="mt-16">
                    <p className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-400 dark:text-slate-600">
                        Error Code: 403 • LYANGPOS SECURITY
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Unauthorized;
