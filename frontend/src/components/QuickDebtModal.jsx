import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { m } from 'framer-motion';
import { X, CreditCard, Calendar, Clock } from 'lucide-react';
import { cn, formatNumber, getLocalDateString } from '../lib/utils';

const QuickDebtModal = ({ isOpen, onClose, partner, onSave, initialData = null }) => {
    const [amount, setAmount] = useState('');
    const [date, setDate] = useState(() => getLocalDateString());
    const [day, setDay] = useState(new Date().getDate().toString().padStart(2, '0'));
    const [month, setMonth] = useState((new Date().getMonth() + 1).toString().padStart(2, '0'));
    const [year, setYear] = useState(new Date().getFullYear().toString());
    const [note, setNote] = useState('');
    const [debtType, setDebtType] = useState('plus'); // 'plus' = Họ nợ mình, 'minus' = Mình nợ họ
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const dayRef = React.useRef(null);
    const monthRef = React.useRef(null);
    const yearRef = React.useRef(null);

    useEffect(() => {
        if (isOpen) {
            let dObj = new Date();
            if (initialData) {
                const val = initialData.amount;
                setAmount(Math.abs(val).toString());
                setDebtType(val >= 0 ? 'plus' : 'minus');
                const d = getLocalDateString(initialData.date);
                dObj = new Date(initialData.date);
                setDate(d);
                setNote(initialData.note || '');
            } else {
                setAmount('');
                setDebtType('plus');
                const d = getLocalDateString();
                dObj = new Date();
                setDate(d);
                setNote('');
            }
            setDay(dObj.getDate().toString().padStart(2, '0'));
            setMonth((dObj.getMonth() + 1).toString().padStart(2, '0'));
            setYear(dObj.getFullYear().toString());
            setError(null);
        }
    }, [isOpen, initialData]);

    useEffect(() => {
        if (day.length === 2 && month.length === 2 && year.length === 4) {
            setDate(`${year}-${month}-${day}`);
        }
    }, [day, month, year]);

    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape' && isOpen) onClose();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [isOpen, onClose]);

    const handleDayChange = (e) => {
        const val = e.target.value.replace(/\D/g, "").slice(0, 2);
        setDay(val);
        if (val.length === 2) monthRef.current?.focus();
    };

    const handleMonthChange = (e) => {
        const val = e.target.value.replace(/\D/g, "").slice(0, 2);
        setMonth(val);
        if (val.length === 2) yearRef.current?.focus();
    };

    const handleYearChange = (e) => {
        const val = e.target.value.replace(/\D/g, "").slice(0, 4);
        setYear(val);
    };

    const handleKeyDown = (e, field) => {
        if (e.key === 'Backspace') {
            if (field === 'month' && !month) dayRef.current?.focus();
            if (field === 'year' && !year) monthRef.current?.focus();
        }
    };

    if (!isOpen || !partner) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        const floatAmount = parseFloat(amount);
        if (!amount || floatAmount <= 0) {
            setError("Vui lòng nhập số tiền hợp lệ");
            return;
        }

        const finalAmount = debtType === 'plus' ? floatAmount : -floatAmount;

        setLoading(true);
        try {
            let res;
            if (initialData) {
                // Update mode
                res = await axios.put(`/api/vouchers/${initialData.id}`, {
                    amount: finalAmount,
                    date,
                    note
                });
            } else {
                // Create mode
                res = await axios.post(`/api/partners/${partner.id}/quick-debt`, {
                    amount: finalAmount,
                    date,
                    note
                });
            }
            // Broadcast sync for realtime update
            const syncChannel = new BroadcastChannel('pos_data_sync');
            syncChannel.postMessage({ type: 'PARTNER_UPDATED', partnerId: partner.id });
            syncChannel.close();

            onSave(res.data);
            onClose();
        } catch (err) {
            setError(err.response?.data?.error || "Có lỗi xảy ra khi ghi nợ");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[200000] flex items-center justify-center p-4 bg-black/40 backdrop-blur-md animate-in fade-in duration-200" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <m.div
                initial={{ scale: 0.95, opacity: 0, y: 10 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 10 }}
                className="bg-card/90 dark:bg-slate-950/90 backdrop-blur-2xl w-full max-w-sm rounded-3xl shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] border border-white/10 dark:border-white/15 flex flex-col relative z-10 overflow-hidden"
            >
                <div className="p-5 flex items-center justify-between border-b border-border/50 bg-transparent relative z-10">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20 shrink-0">
                            <CreditCard size={20} className="text-primary" />
                        </div>
                        <div className="flex flex-col min-w-0">
                            <h3 className="text-base font-bold text-primary uppercase tracking-wide leading-tight truncate">
                                {initialData ? 'Sửa Nợ Sổ Tay' : 'Ghi Nợ Nhanh'}
                            </h3>
                            <div className="text-muted-foreground text-[10px] font-medium uppercase tracking-widest mt-0.5 flex flex-wrap items-center gap-1.5 leading-tight">
                                <span className="truncate max-w-[120px]">Khách: <span className="text-foreground">{partner.name}</span></span>
                                <span className="opacity-30 shrink-0">|</span>
                                <span className={cn(
                                    "font-black shrink-0",
                                    partner.debt_balance > 0 ? "text-rose-500" : "text-emerald-500"
                                )}>
                                    DƯ NỢ: {formatNumber(Math.abs(partner.debt_balance))} {partner.debt_balance < 0 && '(DƯ)'}
                                </span>
                            </div>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-transparent hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors shrink-0"
                    >
                        <X size={16} strokeWidth={2.5} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col">
                    <div className="p-5 space-y-4 bg-transparent">
                        {error && (
                            <div className="bg-rose-500/10 text-rose-600 dark:text-rose-400 p-4 rounded-3xl text-[10px] font-black uppercase border border-rose-500/20">
                                {error}
                            </div>
                        )}

                        {/* Debt Type Toggle */}
                        <div className="flex gap-2 p-1.5 bg-transparent rounded-[1.5rem] border border-border">
                            <button
                                type="button"
                                onClick={() => setDebtType('plus')}
                                className={cn(
                                    "flex-1 py-3 px-4 rounded-2xl text-[10px] font-black uppercase transition-all",
                                    debtType === 'plus'
                                        ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30"
                                        : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                Họ nợ mình (+)
                            </button>
                            <button
                                type="button"
                                onClick={() => setDebtType('minus')}
                                className={cn(
                                    "flex-1 py-3 px-4 rounded-2xl text-[10px] font-black uppercase transition-all",
                                    debtType === 'minus'
                                        ? "bg-rose-600 text-white shadow-lg shadow-rose-500/30"
                                        : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                Mình nợ họ (-)
                            </button>
                        </div>

                        {/* Amount Input */}
                        <div className="relative">
                            <label className="block text-[10px] font-black uppercase text-muted-foreground mb-2 ml-1 tracking-widest leading-none">
                                Số tiền ({debtType === 'plus' ? 'Họ nợ thêm' : 'Trả bớt nợ'})
                            </label>
                            <div className="relative">
                                <input
                                    autoFocus
                                    type="number"
                                    required
                                    step="any"
                                    className={cn(
                                        "w-full bg-transparent rounded-3xl px-4 py-8 text-center text-4xl font-black outline-none border-2 transition-all tabular-nums",
                                        debtType === 'plus'
                                            ? "text-blue-600 border-blue-500/20 focus:border-blue-500/50"
                                            : "text-rose-600 border-rose-500/20 focus:border-rose-500/50"
                                    )}
                                    placeholder="0"
                                    value={amount}
                                    onChange={e => setAmount(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="relative group/date">
                            <label className="block text-[10px] font-black uppercase text-muted-foreground mb-2 ml-1 tracking-widest flex items-center gap-2 leading-none">
                                <Clock size={10} className="opacity-50" />
                                Ngày nợ (Ngày / Tháng / Năm)
                            </label>
                            <div className="flex items-center gap-2 relative bg-transparent p-1.5 rounded-2xl border border-border focus-within:border-primary/50 transition-all">
                                <div className="flex items-center gap-1.5 flex-1 px-1">
                                    <input
                                        ref={dayRef}
                                        type="text"
                                        placeholder="DD"
                                        className="w-10 bg-transparent outline-none font-black text-sm text-center text-foreground"
                                        value={day}
                                        onChange={handleDayChange}
                                        onFocus={e => e.target.select()}
                                    />
                                    <span className="text-muted-foreground font-bold">/</span>
                                    <input
                                        ref={monthRef}
                                        type="text"
                                        placeholder="MM"
                                        className="w-10 bg-transparent outline-none font-black text-sm text-center text-foreground"
                                        value={month}
                                        onChange={handleMonthChange}
                                        onKeyDown={e => handleKeyDown(e, 'month')}
                                        onFocus={e => e.target.select()}
                                    />
                                    <span className="text-muted-foreground font-bold">/</span>
                                    <input
                                        ref={yearRef}
                                        type="text"
                                        placeholder="YYYY"
                                        className="w-16 bg-transparent outline-none font-black text-sm text-center text-foreground"
                                        value={year}
                                        onChange={handleYearChange}
                                        onKeyDown={e => handleKeyDown(e, 'year')}
                                        onFocus={e => e.target.select()}
                                    />
                                </div>
                                
                                <div className="relative shrink-0">
                                    <input 
                                        type="date"
                                        className="absolute inset-0 opacity-0 cursor-pointer z-10"
                                        value={date}
                                        onChange={(e) => {
                                            const newDate = e.target.value;
                                            if (!newDate) return;
                                            setDate(newDate);
                                            const parts = newDate.split('-');
                                            setYear(parts[0]);
                                            setMonth(parts[1]);
                                            setDay(parts[2]);
                                        }}
                                    />
                                    <div className="w-10 h-10 flex items-center justify-center bg-background border border-border rounded-xl text-muted-foreground hover:text-emerald-500 transition-all shadow-sm">
                                        <Calendar size={18} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-[10px] font-black uppercase text-muted-foreground mb-2 ml-1 tracking-widest leading-none">Ghi chú</label>
                            <textarea
                                rows="2"
                                placeholder="Ghi chú chi tiết..."
                                className="w-full bg-transparent border border-border rounded-2xl px-5 py-3 outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500/50 font-bold text-sm text-foreground transition-all resize-none"
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="p-5 border-t border-border bg-card rounded-b-2xl">
                        <button
                            type="submit"
                            disabled={loading || !amount}
                            className={cn(
                                "w-full py-3.5 text-white font-bold rounded-xl uppercase tracking-wider transition-colors flex items-center justify-center disabled:opacity-50",
                                debtType === 'plus' ? "bg-blue-600 hover:bg-blue-700" : "bg-rose-600 hover:bg-rose-700"
                            )}
                        >
                            {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'LƯU NỢ NHANH'}
                        </button>
                    </div>
                </form>
            </m.div>
        </div>
    );
};

export default QuickDebtModal;
