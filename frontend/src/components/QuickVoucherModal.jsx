import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { m } from 'framer-motion';
import { X, ReceiptIcon, Wallet, Calendar } from 'lucide-react';
import { cn, formatNumber, getLocalDateString } from '../lib/utils';

const QuickVoucherModal = ({ isOpen, onClose, partner, onSave, initialData }) => {
    const [amount, setAmount] = useState('');
    const [type, setType] = useState('Receipt'); // 'Receipt' or 'Payment'
    const [note, setNote] = useState('');
    const [date, setDate] = useState(() => getLocalDateString());
    const [day, setDay] = useState(new Date().getDate().toString().padStart(2, '0'));
    const [month, setMonth] = useState((new Date().getMonth() + 1).toString().padStart(2, '0'));
    const [year, setYear] = useState(new Date().getFullYear().toString());
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);
    const [livePartner, setLivePartner] = useState(partner);

    const dayRef = React.useRef(null);
    const monthRef = React.useRef(null);
    const yearRef = React.useRef(null);

    useEffect(() => {
        if (isOpen) {
            setLivePartner(partner);
            let dObj = new Date();
            if (initialData) {
                setAmount(initialData.amount || '');
                setType(initialData.type || 'Receipt');
                setNote(initialData.note || '');
                const dateStr = initialData.date ? getLocalDateString(initialData.date) : getLocalDateString();
                dObj = new Date(initialData.date || new Date());
                setDate(dateStr);
            } else {
                setAmount('');
                setType('Receipt');
                setNote('');
                const d = getLocalDateString();
                dObj = new Date();
                setDate(d);
            }
            setDay(dObj.getDate().toString().padStart(2, '0'));
            setMonth((dObj.getMonth() + 1).toString().padStart(2, '0'));
            setYear(dObj.getFullYear().toString());
            setError(null);
            setSuccessMessage(null);
        }
    }, [isOpen, initialData, partner]);

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

    const currentPartner = livePartner || partner;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccessMessage(null);
        if (!amount || parseFloat(amount) <= 0) {
            setError("Vui lòng nhập số tiền hợp lệ");
            return;
        }

        setLoading(true);
        try {
            const parsedAmount = parseFloat(amount);
            const payload = {
                partner_id: partner.id,
                amount: parsedAmount,
                type,
                note,
                date,
                source: 'manual'
            };

            let res;
            if (initialData?.id) {
                res = await axios.put(`/api/vouchers/${initialData.id}`, payload);
            } else {
                res = await axios.post(`/api/vouchers`, payload);
            }

            // Broadcast sync for realtime update
            const syncChannel = new BroadcastChannel('pos_data_sync');
            syncChannel.postMessage({ type: 'PARTNER_UPDATED', partnerId: partner.id });
            syncChannel.close();

            // Update live partner balance inside modal
            const delta = type === 'Receipt' ? -parsedAmount : parsedAmount;
            setLivePartner(prev => prev ? ({ ...prev, debt_balance: (prev.debt_balance || 0) + delta }) : null);

            onSave(res.data);
            setAmount('');
            setNote('');
            setSuccessMessage(`Đã lập ${type === 'Receipt' ? 'phiếu thu' : 'phiếu chi'} ${formatNumber(parsedAmount)} đ thành công!`);
            setTimeout(() => setSuccessMessage(null), 3500);
        } catch (err) {
            setError(err.response?.data?.error || "Có lỗi xảy ra khi xử lý phiếu");
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
                className="bg-[#fbf9f4]/95 dark:bg-[#181512]/95 backdrop-blur-2xl w-full max-w-sm rounded-3xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.35)] border-2 border-[#8b6f47]/30 dark:border-[#d4a574]/30 flex flex-col relative z-10 overflow-hidden text-foreground"
            >

                <div className="p-5 flex items-center justify-between border-b border-[#8b6f47]/20 dark:border-[#d4a574]/20 bg-transparent relative z-10">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#8b6f47]/10 dark:bg-[#d4a574]/15 rounded-2xl flex items-center justify-center border border-[#8b6f47]/20 dark:border-[#d4a574]/30 text-[#2d5016] dark:text-[#34d399] shrink-0">
                            {type === 'Receipt' ? <ReceiptIcon size={20} className="text-[#2d5016] dark:text-[#34d399]" /> : <Wallet size={20} className="text-[#2d5016] dark:text-[#34d399]" />}
                        </div>
                        <div className="flex flex-col min-w-0">
                            <h3 className="text-base font-black text-[#2d5016] dark:text-[#34d399] uppercase tracking-wide leading-tight truncate">Lập Phiếu Nhanh</h3>
                            <div className="text-[#8b6f47] dark:text-[#c4a480] text-[10px] font-bold uppercase tracking-wider mt-0.5 flex flex-wrap items-center gap-1.5 leading-tight">
                                <span className="truncate">Đối tác: <span className="text-foreground font-black">{currentPartner.name}</span></span>
                            </div>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-xl bg-transparent hover:bg-[#8b6f47]/10 dark:hover:bg-[#d4a574]/15 text-[#8b6f47] dark:text-[#c4a480] hover:text-[#2d5016] dark:hover:text-[#34d399] transition-colors shrink-0"
                    >
                        <X size={16} strokeWidth={2.5} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col">
                    <div className="p-5 space-y-4 bg-transparent">
                        {error && (
                            <div className="bg-rose-500/10 text-rose-600 dark:text-rose-400 p-3 rounded-2xl text-xs font-bold border border-rose-500/20">
                                {error}
                            </div>
                        )}

                        {successMessage && (
                            <div className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 p-3 rounded-2xl text-xs font-bold border border-emerald-500/30 flex items-center gap-2 animate-in fade-in slide-in-from-top-1 duration-200">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 animate-pulse" />
                                <span>{successMessage}</span>
                            </div>
                        )}

                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-[0.1em] text-[#8b6f47] dark:text-[#c4a480] mb-2 ml-1 leading-none">
                                Loại phiếu <span className="text-rose-500">*</span>
                            </label>
                            <div className="flex gap-2 p-1.5 bg-black/[0.03] dark:bg-white/[0.03] rounded-2xl border border-[#8b6f47]/20 dark:border-[#d4a574]/20">
                                <button
                                    type="button"
                                    onClick={() => setType('Receipt')}
                                    className={cn(
                                        "flex-1 py-2.5 rounded-xl font-black uppercase tracking-wider text-xs transition-all border",
                                        type === 'Receipt'
                                            ? "bg-emerald-600 dark:bg-emerald-500 border-emerald-600 text-white shadow-md shadow-emerald-600/20"
                                            : "bg-transparent border-transparent text-[#8b6f47] dark:text-[#c4a480] hover:text-[#2d5016] dark:hover:text-[#34d399]"
                                    )}
                                >
                                    Thu Tiền
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setType('Payment')}
                                    className={cn(
                                        "flex-1 py-2.5 rounded-xl font-black uppercase tracking-wider text-xs transition-all border",
                                        type === 'Payment'
                                            ? "bg-amber-600 dark:bg-amber-500 border-amber-600 text-white shadow-md shadow-amber-600/20"
                                            : "bg-transparent border-transparent text-[#8b6f47] dark:text-[#c4a480] hover:text-[#2d5016] dark:hover:text-[#34d399]"
                                    )}
                                >
                                    Chi Tiền
                                </button>
                            </div>
                        </div>

                        <div className="relative group/date z-10">
                            <label className="block text-[10px] font-black uppercase tracking-[0.1em] text-[#8b6f47] dark:text-[#c4a480] mb-2 ml-1 leading-none">
                                Ngày lập <span className="text-rose-500">*</span>
                            </label>
                            <div className="flex items-center gap-2 relative bg-transparent p-1.5 rounded-2xl border border-[#8b6f47]/25 dark:border-[#d4a574]/25 focus-within:border-[#8b6f47] dark:focus-within:border-[#d4a574] transition-all">
                                <div className="flex items-center gap-1.5 flex-1 px-1">
                                    <input
                                        ref={dayRef}
                                        type="text"
                                        placeholder="DD"
                                        className="w-10 bg-transparent outline-none font-black text-sm text-center text-[#2d5016] dark:text-[#e2d7c7]"
                                        value={day}
                                        onChange={handleDayChange}
                                        onFocus={e => e.target.select()}
                                    />
                                    <span className="text-[#8b6f47]/50 dark:text-[#c4a480]/50 font-bold">/</span>
                                    <input
                                        ref={monthRef}
                                        type="text"
                                        placeholder="MM"
                                        className="w-10 bg-transparent outline-none font-black text-sm text-center text-[#2d5016] dark:text-[#e2d7c7]"
                                        value={month}
                                        onChange={handleMonthChange}
                                        onKeyDown={e => handleKeyDown(e, 'month')}
                                        onFocus={e => e.target.select()}
                                    />
                                    <span className="text-[#8b6f47]/50 dark:text-[#c4a480]/50 font-bold">/</span>
                                    <input
                                        ref={yearRef}
                                        type="text"
                                        placeholder="YYYY"
                                        className="w-16 bg-transparent outline-none font-black text-sm text-center text-[#2d5016] dark:text-[#e2d7c7]"
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
                                    <div className="w-10 h-10 flex items-center justify-center bg-[#8b6f47]/10 dark:bg-[#d4a574]/15 border border-[#8b6f47]/20 dark:border-[#d4a574]/30 rounded-xl text-[#8b6f47] dark:text-[#c4a480] hover:text-[#2d5016] dark:hover:text-[#34d399] transition-all shadow-xs">
                                        <Calendar size={18} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-[0.1em] text-[#8b6f47] dark:text-[#c4a480] mb-2 ml-1 leading-none">
                                Nợ hiện tại
                            </label>
                            <div className="w-full bg-black/[0.03] dark:bg-white/[0.03] border border-[#8b6f47]/20 dark:border-[#d4a574]/20 rounded-2xl px-5 py-3.5 font-black text-lg text-[#2d5016] dark:text-[#e2d7c7] select-none">
                                {formatNumber(Math.abs(currentPartner.debt_balance || 0))} đ {currentPartner.debt_balance > 0 ? '(Khách nợ)' : currentPartner.debt_balance < 0 ? '(Mình nợ)' : ''}
                            </div>
                        </div>

                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-[0.1em] text-[#8b6f47] dark:text-[#c4a480] mb-2 ml-1 leading-none">
                                Số tiền thanh toán <span className="text-rose-500">*</span>
                            </label>
                            <input
                                type="text"
                                inputMode="numeric"
                                required
                                placeholder="0"
                                className={cn(
                                    "w-full bg-transparent border-2 rounded-2xl px-5 py-4 outline-none focus:ring-4 font-black text-2xl md:text-3xl text-center transition-all tabular-nums",
                                    type === 'Receipt'
                                        ? "border-emerald-500/30 focus:border-emerald-600 dark:focus:border-emerald-400 focus:ring-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                        : "border-amber-500/30 focus:border-amber-600 dark:focus:border-amber-400 focus:ring-amber-500/10 text-amber-600 dark:text-amber-400"
                                )}
                                value={amount ? formatNumber(parseFloat(amount)) : ''}
                                onChange={(e) => {
                                    const rawVal = e.target.value.replace(/\D/g, '');
                                    setAmount(rawVal);
                                }}
                                autoFocus
                            />
                        </div>

                        {(() => {
                            const currentDebt = currentPartner.debt_balance || 0;
                            const val = parseFloat(amount) || 0;
                            const projected = type === 'Receipt' ? currentDebt - val : currentDebt + val;
                            return (
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-[0.1em] text-[#8b6f47] dark:text-[#c4a480] mb-2 ml-1 leading-none">
                                        Dư nợ dự kiến
                                    </label>
                                    <div className={cn(
                                        "w-full bg-black/[0.03] dark:bg-white/[0.03] border border-[#8b6f47]/20 dark:border-[#d4a574]/20 rounded-2xl px-5 py-3.5 font-black text-lg select-none",
                                        projected > 0 ? "text-rose-600 dark:text-rose-400" : projected < 0 ? "text-emerald-600 dark:text-emerald-400" : "text-[#2d5016] dark:text-[#e2d7c7]"
                                    )}>
                                        {formatNumber(Math.abs(projected))} đ {projected > 0 ? '(Khách nợ)' : projected < 0 ? '(Mình nợ)' : ''}
                                    </div>
                                </div>
                            );
                        })()}

                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-[0.1em] text-[#8b6f47] dark:text-[#c4a480] mb-2 ml-1 leading-none">
                                Ghi chú
                            </label>
                            <textarea
                                rows="2"
                                placeholder={type === 'Receipt' ? "Thu nợ cũ, tiền hàng..." : "Chi trả hàng, hoa hồng..."}
                                className="w-full bg-transparent border border-[#8b6f47]/25 dark:border-[#d4a574]/25 rounded-2xl px-5 py-3 outline-none focus:ring-4 focus:ring-[#8b6f47]/10 focus:border-[#8b6f47] dark:focus:border-[#d4a574] font-bold text-sm text-[#2d5016] dark:text-[#e2d7c7] placeholder-[#8b6f47]/40 dark:placeholder-[#c4a480]/40 transition-all resize-none"
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="p-5 border-t border-[#8b6f47]/20 dark:border-[#d4a574]/20 bg-transparent rounded-b-3xl">
                        <button
                            type="submit"
                            disabled={loading || !amount}
                            className={cn(
                                "w-full py-3.5 text-white font-black rounded-2xl uppercase tracking-wider transition-all flex items-center justify-center disabled:opacity-50 shadow-lg cursor-pointer active:scale-[0.99]",
                                type === 'Receipt' ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20" : "bg-amber-600 hover:bg-amber-700 shadow-amber-600/20"
                            )}
                        >
                            {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'LẬP PHIẾU NGAY'}
                        </button>
                    </div>
                </form>
            </m.div>
        </div>
    );
};

export default QuickVoucherModal;
