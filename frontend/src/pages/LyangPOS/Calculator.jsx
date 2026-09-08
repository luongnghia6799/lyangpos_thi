import { useState, useEffect, useRef } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import {
    Calculator as CalcIcon,
    Trash2,
    Plus,
    X,
    History,
    Copy,
    CheckCircle2
} from 'lucide-react';
import Toast from '../../components/Toast';

export default function Calculator() {
    const [inputValue, setInputValue] = useState('');
    const [tape, setTape] = useState(() => {
        const saved = localStorage.getItem('debt_calculator_tape');
        return saved ? JSON.parse(saved) : [];
    });
    const [note, setNote] = useState('');
    const [toast, setToast] = useState(null);
    const inputRef = useRef(null);
    const scrollRef = useRef(null);

    // F2 (focus and select raw input) and F4 (clear all history) keyboard shortcuts
    useEffect(() => {
        const handleGlobalKeyDown = (e) => {
            if (e.key === 'F2') {
                e.preventDefault();
                inputRef.current?.focus();
                inputRef.current?.select();
            } else if (e.key === 'F4') {
                e.preventDefault();
                clearAll();
            }
        };
        window.addEventListener('keydown', handleGlobalKeyDown);
        return () => window.removeEventListener('keydown', handleGlobalKeyDown);
    }, []);

    useEffect(() => {
        localStorage.setItem('debt_calculator_tape', JSON.stringify(tape));
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [tape]);

    const handleAdd = (e) => {
        e?.preventDefault();
        const value = parseInt(inputValue.replace(/[^0-9]/g, ''));
        if (isNaN(value)) return;

        const newItem = {
            id: Date.now(),
            value: value,
            note: note || '',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        setTape(prev => [...prev, newItem]);
        setInputValue('');
        setNote('');
        inputRef.current?.focus();
    };

    const removeLine = (id) => {
        setTape(prev => prev.filter(item => item.id !== id));
    };

    const clearAll = () => {
        if (window.confirm('Xóa toàn bộ lịch sử tính toán?')) {
            setTape([]);
        }
    };

    const total = tape.reduce((sum, item) => sum + item.value, 0);

    const formatCurrency = (val) => {
        return new Intl.NumberFormat('vi-VN').format(val);
    };

    const copyTotal = () => {
        navigator.clipboard.writeText(total.toString());
        setToast({ message: 'Đã sao chép tổng số tiền thành công!', type: 'success' });
    };

    const handleQuickNumber = (num) => {
        setInputValue(prev => {
            const current = prev.replace(/[^0-9]/g, '');
            const newValue = parseInt(current + num);
            return formatCurrency(newValue || 0);
        });
    };

    return (
        <div className="pt-2 px-4 pb-8 w-full h-full bg-transparent overflow-hidden flex flex-col gap-3 relative font-sans">
            {/* Background Aesthetic Blur Elements removed per user request */}

            {/* Header section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2 relative z-10 shrink-0">
                <div className="flex items-center gap-3 relative z-10">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-black text-primary uppercase tracking-tight flex items-center gap-3 pt-2 pb-0.5 leading-relaxed">
                            <CalcIcon className="text-primary" size={32} />
                            MÁY TÍNH SỔ NỢ
                        </h1>
                        <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-black uppercase rounded-lg tracking-tighter">LyangPOS by Lyang</span>
                            <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                            <p className="text-[11px] font-bold text-gray-400 dark:text-gray-500">Cộng dồn và đối soát lịch sử</p>
                        </div>
                    </div>
                </div>

                <m.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={clearAll}
                    className="flex items-center gap-2 px-6 py-3 border border-red-500/20 hover:border-red-500/40 hover:bg-red-500/5 rounded-2xl text-red-500 font-black transition-all text-xs uppercase tracking-wider shadow-none"
                >
                    <Trash2 size={15} />
                    <span>Xóa toàn bộ (F4)</span>
                </m.button>
            </div>

            {/* Main Workspace grid */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 min-h-0 relative z-10">
                {/* Input Card Container (5 cols) */}
                <div className="lg:col-span-5 flex flex-col gap-4 overflow-y-auto scrollbar-thin h-full">
                    <div className="bg-transparent rounded-3xl p-4 md:p-6 border border-border flex flex-col gap-4 flex-1 shrink-0">
                        <form onSubmit={handleAdd} className="space-y-5">
                            <div>
                                <label className="block text-[11px] font-black text-[#2d5016] dark:text-[#d4a574] uppercase mb-2 ml-1 tracking-widest">Số tiền cần cộng (F2)</label>
                                <div className="relative">
                                    <input
                                        ref={inputRef}
                                        autoFocus
                                        type="text"
                                        value={inputValue}
                                        onChange={(e) => {
                                            const val = e.target.value.replace(/[^0-9]/g, '');
                                            setInputValue(val ? formatCurrency(parseInt(val)) : '');
                                        }}
                                        placeholder="0"
                                        className="w-full bg-transparent border border-border focus:border-primary rounded-2xl px-6 py-6 text-4xl font-black text-[#2d5016] dark:text-[#fdfdfb] transition-all outline-none text-center"
                                    />
                                    <div className="absolute right-6 top-1/2 -translate-y-1/2 text-[#8b6f47] dark:text-[#d4a574] font-black text-2xl">đ</div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-[11px] font-black text-[#2d5016] dark:text-[#d4a574] uppercase mb-2 ml-1 tracking-widest">Ghi chú nhanh (không bắt buộc)</label>
                                <input
                                    type="text"
                                    value={note}
                                    onChange={(e) => setNote(e.target.value)}
                                    placeholder="Ví dụ: Tiền cá, Tiền gạo, Thêm đợt mới..."
                                    className="w-full bg-transparent border border-border rounded-2xl px-5 py-4 font-bold text-slate-800 dark:text-slate-200 outline-none focus:border-primary transition-all placeholder:text-slate-400/60"
                                />
                            </div>

                            <m.button
                                whileHover={{ scale: 1.01 }}
                                whileTap={{ scale: 0.99 }}
                                type="submit"
                                className="w-full bg-gradient-to-r from-[#2d5016] to-[#4a7c59] text-[#fdfdfb] py-5 rounded-2xl font-black text-lg shadow-none flex items-center justify-center gap-3 hover:scale-[1.01] active:scale-95 transition-all uppercase tracking-widest border border-white/10"
                            >
                                <Plus size={22} strokeWidth={2.5} />
                                <span>Cộng vào sổ</span>
                            </m.button>
                        </form>

                        {/* Divider Line */}
                        <div className="h-px bg-gradient-to-r from-transparent via-[#d4a574]/30 to-transparent my-1"></div>

                        {/* Tactile Quick Numbers Pad */}
                        <div className="grid grid-cols-4 gap-3">
                            {['1', '2', '3', '0', '4', '5', '6', '00', '7', '8', '9', '000'].map(num => (
                                <m.button
                                    whileHover={{ scale: 1.05, y: -2 }}
                                    whileTap={{ scale: 0.95 }}
                                    key={num}
                                    onClick={() => handleQuickNumber(num)}
                                    className="py-4 bg-transparent border border-border hover:border-primary/50 hover:bg-primary/5 rounded-2xl font-black text-[#2d5016] dark:text-[#d4a574] transition-all text-xl"
                                >
                                    {num}
                                </m.button>
                            ))}
                        </div>
                    </div>

                    {/* Total Summary Gradient Card */}
                    <div className="bg-gradient-to-r from-[#2d5016] to-[#4a7c59] rounded-3xl p-6 text-white shadow-none flex items-center justify-between border border-white/10 relative overflow-hidden group shrink-0">
                        <div className="absolute top-[-30px] right-[-30px] p-10 opacity-10 group-hover:opacity-20 group-hover:rotate-12 transition-all duration-700 pointer-events-none">
                            <CalcIcon size={140} className="text-white" />
                        </div>
                        <div className="relative z-10">
                            <p className="text-[10px] font-black text-emerald-100/60 uppercase tracking-widest mb-1.5 font-mono">Tổng cộng tạm tính</p>
                            <h2 className="text-4xl md:text-5xl font-black tracking-tight tabular-nums">{formatCurrency(total)} <span className="text-2xl opacity-75">đ</span></h2>
                        </div>
                        <m.button
                            whileHover={{ scale: 1.08 }}
                            whileTap={{ scale: 0.92 }}
                            onClick={copyTotal}
                            className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-md hover:bg-white/25 flex items-center justify-center transition-all shadow-lg border border-white/10 relative z-10"
                            title="Sao chép tổng số tiền"
                        >
                            <Copy size={22} className="text-white" />
                        </m.button>
                    </div>
                </div>

                {/* Tape History Container (7 cols) */}
                <div className="lg:col-span-7 bg-transparent rounded-3xl border border-border flex flex-col overflow-hidden">
                    <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-transparent">
                        <div className="flex items-center gap-2.5">
                            <History size={20} className="text-[#2d5016] dark:text-[#d4a574]" />
                            <span className="font-black text-[#2d5016] dark:text-[#fdfdfb] uppercase text-sm tracking-wider">Băng giấy lịch sử</span>
                        </div>
                        <span className="text-xs font-black text-[#8b6f47] dark:text-[#d4a574] bg-[#d4a574]/10 px-3 py-1 rounded-full">{tape.length} dòng đã nhập</span>
                    </div>

                    <div
                        ref={scrollRef}
                        className="flex-1 overflow-y-auto p-6 md:p-8 space-y-4 custom-scrollbar"
                    >
                        <AnimatePresence initial={false}>
                            {tape.length === 0 ? (
                                <m.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="h-full flex flex-col items-center justify-center text-slate-350 dark:text-slate-650 gap-4 py-20"
                                >
                                    <div className="w-20 h-20 rounded-full bg-transparent flex items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-800">
                                        <CalcIcon size={40} strokeWidth={1} className="opacity-40 text-slate-400" />
                                    </div>
                                    <p className="font-black text-sm uppercase tracking-wider text-center text-slate-400">
                                        Chưa có số nào được nhập.<br />
                                        <span className="text-xs font-bold text-slate-400/60 lowercase normal-case mt-1 block">Bắt đầu nhập số ở bảng bên trái</span>
                                    </p>
                                </m.div>
                            ) : (
                                tape.map((item, index) => (
                                    <m.div
                                        key={item.id}
                                        initial={{ opacity: 0, y: 15 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        className="group flex items-center justify-between bg-transparent p-5 rounded-2xl border border-border hover:bg-primary/5 transition-all"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-9 h-9 rounded-xl bg-transparent flex items-center justify-center text-xs font-black text-[#2d5016] dark:text-[#d4a574] border border-border">
                                                {index + 1}
                                            </div>
                                            <div>
                                                <div className="text-2xl font-black text-[#2d5016] dark:text-[#fdfdfb] tracking-tight tabular-nums">
                                                    + {formatCurrency(item.value)} <span className="text-base font-bold text-slate-400">đ</span>
                                                </div>
                                                {item.note && (
                                                    <div className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-1 bg-emerald-500/5 dark:bg-emerald-500/10 w-fit px-2 py-0.5 rounded-lg border border-emerald-500/10">
                                                        <CheckCircle2 size={13} className="text-emerald-600 dark:text-emerald-500" />
                                                        {item.note}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase bg-transparent px-2.5 py-1.5 rounded-xl shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                                                {item.timestamp}
                                            </span>
                                            <m.button
                                                whileHover={{ scale: 1.1 }}
                                                whileTap={{ scale: 0.9 }}
                                                onClick={() => removeLine(item.id)}
                                                className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl transition-all border-2 border-transparent hover:border-red-500/10"
                                            >
                                                <X size={18} strokeWidth={2.5} />
                                            </m.button>
                                        </div>
                                    </m.div>
                                ))
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Tape Footer Summary Bar */}
                    <div className="p-5 bg-transparent border-t border-border">
                        <div className="flex items-center justify-between">
                            <div className="text-xs font-black text-slate-400 uppercase tracking-widest">Tổng kết sổ nợ</div>
                            <div className="text-3xl md:text-4xl font-black text-[#2d5016] dark:text-[#d4a574] tabular-nums tracking-tight">{formatCurrency(total)} đ</div>
                        </div>
                    </div>
                </div>
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
        </div>
    );
}
