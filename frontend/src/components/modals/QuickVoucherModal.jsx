import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { m, AnimatePresence } from 'framer-motion';
import { X, ReceiptIcon, Wallet, Calendar, Clock, RotateCcw, Check, Sparkles } from 'lucide-react';
import { cn, formatNumber, getLocalDateString } from '../../lib/utils';
import Portal from '../widgets/Portal';

const QuickVoucherModal = ({ isOpen, onClose, partner, onSave, initialData }) => {
    const [amount, setAmount] = useState('');
    const [type, setType] = useState('Receipt'); // 'Receipt' or 'Payment'
    const [note, setNote] = useState('');
    const [date, setDate] = useState(() => getLocalDateString());
    const [day, setDay] = useState(() => new Date().getDate().toString().padStart(2, '0'));
    const [month, setMonth] = useState(() => (new Date().getMonth() + 1).toString().padStart(2, '0'));
    const [year, setYear] = useState(() => new Date().getFullYear().toString());
    const [hour, setHour] = useState(() => String(new Date().getHours()).padStart(2, '0'));
    const [minute, setMinute] = useState(() => String(new Date().getMinutes()).padStart(2, '0'));
    const [isTimeDropdownOpen, setIsTimeDropdownOpen] = useState(false);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);
    const [livePartner, setLivePartner] = useState(partner);

    const dayRef = useRef(null);
    const monthRef = useRef(null);
    const yearRef = useRef(null);
    const hourRef = useRef(null);
    const minuteRef = useRef(null);
    const timeContainerRef = useRef(null);

    // Sync hours and minutes when initialData or partner changes
    useEffect(() => {
        if (isOpen) {
            setLivePartner(partner);
            let dObj = new Date();
            if (initialData) {
                setAmount(initialData.amount ? String(initialData.amount) : '');
                setType(initialData.type || 'Receipt');
                setNote(initialData.note || '');
                const dateStr = initialData.date ? getLocalDateString(initialData.date) : getLocalDateString();
                dObj = new Date(initialData.date || new Date());
                setDate(dateStr);
                if (initialData.date) {
                    const clean = String(initialData.date).replace('T', ' ');
                    const parts = clean.split(' ');
                    if (parts[1]) {
                        const tParts = parts[1].split(':');
                        setHour(tParts[0] ? tParts[0].padStart(2, '0') : '12');
                        setMinute(tParts[1] ? tParts[1].padStart(2, '0') : '00');
                    } else {
                        const now = new Date();
                        setHour(String(now.getHours()).padStart(2, '0'));
                        setMinute(String(now.getMinutes()).padStart(2, '0'));
                    }
                }
            } else {
                setAmount('');
                setType('Receipt');
                setNote('');
                const d = getLocalDateString();
                dObj = new Date();
                setDate(d);
                const now = new Date();
                setHour(String(now.getHours()).padStart(2, '0'));
                setMinute(String(now.getMinutes()).padStart(2, '0'));
            }
            setDay(dObj.getDate().toString().padStart(2, '0'));
            setMonth((dObj.getMonth() + 1).toString().padStart(2, '0'));
            setYear(dObj.getFullYear().toString());
            setError(null);
            setSuccessMessage(null);
            setIsTimeDropdownOpen(false);
        }
    }, [isOpen, initialData, partner]);

    useEffect(() => {
        if (day.length === 2 && month.length === 2 && year.length === 4) {
            setDate(`${year}-${month}-${day}`);
        }
    }, [day, month, year]);

    // Close on ESC
    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape' && isOpen) {
                if (isTimeDropdownOpen) {
                    setIsTimeDropdownOpen(false);
                } else {
                    onClose();
                }
            }
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [isOpen, isTimeDropdownOpen, onClose]);

    // Click outside time dropdown
    useEffect(() => {
        if (!isTimeDropdownOpen) return;
        const handleClickOutside = (e) => {
            if (timeContainerRef.current && !timeContainerRef.current.contains(e.target)) {
                setIsTimeDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isTimeDropdownOpen]);

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

    if (!isOpen) return null;

    const currentPartner = livePartner || partner || { id: null, name: 'Khách lẻ / Không định danh', debt_balance: 0 };

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
            const curH = (hour || '12').padStart(2, '0');
            const curM = (minute || '00').padStart(2, '0');
            const fullDate = `${date} ${curH}:${curM}:00`;
            const payload = {
                partner_id: currentPartner?.id || null,
                amount: parsedAmount,
                type,
                note,
                date: fullDate,
                source: 'manual'
            };

            let res;
            if (initialData?.id) {
                res = await axios.put(`/api/vouchers/${initialData.id}`, payload);
            } else {
                res = await axios.post(`/api/vouchers`, payload);
            }

            if (currentPartner?.id) {
                // Broadcast sync for realtime update
                const syncChannel = new BroadcastChannel('pos_data_sync');
                syncChannel.postMessage({ type: 'PARTNER_UPDATED', partnerId: currentPartner.id });
                syncChannel.close();

                // Update live partner balance inside modal
                const delta = type === 'Receipt' ? -parsedAmount : parsedAmount;
                setLivePartner(prev => prev ? ({ ...prev, debt_balance: (prev.debt_balance || 0) + delta }) : null);
            }

            if (onSave) {
                onSave(res.data);
            }

            const isEdit = Boolean(initialData?.id);
            setSuccessMessage(isEdit ? `Đã cập nhật phiếu thành công!` : `Đã lập ${type === 'Receipt' ? 'phiếu thu' : 'phiếu chi'} ${formatNumber(parsedAmount)} đ thành công!`);
            
            if (isEdit) {
                setTimeout(() => {
                    onClose();
                }, 600);
            } else {
                setAmount('');
                setNote('');
                setTimeout(() => setSuccessMessage(null), 3000);
            }
        } catch (err) {
            setError(err.response?.data?.error || err.response?.data?.message || err.message || "Có lỗi xảy ra khi xử lý phiếu");
        } finally {
            setLoading(false);
        }
    };

    const isEditMode = Boolean(initialData?.id);

    return (
        <Portal zIndex={2000000}>
            <AnimatePresence>
                {isOpen && (
                    <div className="fixed inset-0 z-[2000000] flex items-center justify-center p-4 select-none" style={{ zIndex: 2000000 }}>
                        <m.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            onClick={onClose}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm transform-gpu will-change-transform"
                        />
                        <m.div
                            initial={{ scale: 0.95, opacity: 0, y: 10 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 10 }}
                            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                            className="bg-[#fbf9f4]/95 dark:bg-[#181512]/95 backdrop-blur-2xl w-full max-w-[430px] rounded-3xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.35)] border-2 border-[#8b6f47]/30 dark:border-[#d4a574]/30 flex flex-col relative z-10 overflow-visible text-foreground transform-gpu will-change-transform"
                        >
                            {/* Modal Header */}
                            <div className="p-5 flex items-center justify-between border-b border-[#8b6f47]/20 dark:border-[#d4a574]/20 bg-transparent relative z-10">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className={cn(
                                        "w-11 h-11 rounded-2xl flex items-center justify-center border text-white shadow-md shrink-0 transition-colors",
                                        type === 'Receipt'
                                            ? "bg-emerald-600 border-emerald-500 shadow-emerald-600/20"
                                            : "bg-rose-600 border-rose-500 shadow-rose-600/20"
                                    )}>
                                        {type === 'Receipt' ? <ReceiptIcon size={20} /> : <Wallet size={20} />}
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-base font-black text-[#2d5016] dark:text-[#34d399] uppercase tracking-wide leading-tight truncate">
                                                {isEditMode ? 'Cập Nhật Phiếu' : 'Lập Phiếu Nhanh'}
                                            </h3>
                                            {isEditMode && (
                                                <span className="text-[10px] font-mono font-black px-2 py-0.5 rounded-md bg-[#8b6f47]/15 dark:bg-[#d4a574]/20 text-[#2d5016] dark:text-[#34d399] border border-[#8b6f47]/20">
                                                    #{initialData.id}
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-[#8b6f47] dark:text-[#c4a480] text-[10px] font-bold uppercase tracking-wider mt-0.5 flex flex-wrap items-center gap-1.5 leading-tight truncate">
                                            <span className="truncate">
                                                Đối tác: <span className="text-foreground font-black">{currentPartner.name}</span>
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="w-8 h-8 flex items-center justify-center rounded-xl bg-transparent hover:bg-[#8b6f47]/10 dark:hover:bg-[#d4a574]/15 text-[#8b6f47] dark:text-[#c4a480] hover:text-[#2d5016] dark:hover:text-[#34d399] transition-colors shrink-0 cursor-pointer"
                                >
                                    <X size={16} strokeWidth={2.5} />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="flex flex-col">
                                <div className="p-5 space-y-4 bg-transparent overflow-visible">
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

                                    {/* Loại phiếu */}
                                    <div>
                                        <label className="block text-[10px] font-black uppercase tracking-[0.1em] text-[#8b6f47] dark:text-[#c4a480] mb-2 ml-1 leading-none">
                                            Loại phiếu <span className="text-rose-500">*</span>
                                        </label>
                                        <div className="flex gap-2 p-1.5 bg-black/[0.03] dark:bg-white/[0.03] rounded-2xl border border-[#8b6f47]/20 dark:border-[#d4a574]/20">
                                            <button
                                                type="button"
                                                onClick={() => setType('Receipt')}
                                                className={cn(
                                                    "flex-1 py-2.5 rounded-xl font-black uppercase tracking-wider text-xs transition-all border cursor-pointer",
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
                                                    "flex-1 py-2.5 rounded-xl font-black uppercase tracking-wider text-xs transition-all border cursor-pointer",
                                                    type === 'Payment'
                                                        ? "bg-rose-600 dark:bg-rose-500 border-rose-600 text-white shadow-md shadow-rose-600/20"
                                                        : "bg-transparent border-transparent text-[#8b6f47] dark:text-[#c4a480] hover:text-[#2d5016] dark:hover:text-[#34d399]"
                                                )}
                                            >
                                                Chi Tiền
                                            </button>
                                        </div>
                                    </div>

                                    {/* Ngày & Giờ lập với Custom Time Select */}
                                    <div className="relative group/date z-20">
                                        <label className="block text-[10px] font-black uppercase tracking-[0.1em] text-[#8b6f47] dark:text-[#c4a480] mb-2 ml-1 leading-none">
                                            Ngày & Giờ lập <span className="text-rose-500">*</span>
                                        </label>
                                        <div className="flex items-center gap-2">
                                            {/* Date Box */}
                                            <div className="flex items-center gap-1 relative bg-transparent p-1.5 rounded-2xl border border-[#8b6f47]/25 dark:border-[#d4a574]/25 focus-within:border-[#8b6f47] dark:focus-within:border-[#d4a574] transition-all flex-1 h-[52px]">
                                                <div className="flex items-center gap-1 flex-1 px-1">
                                                    <input
                                                        ref={dayRef}
                                                        type="text"
                                                        placeholder="DD"
                                                        maxLength={2}
                                                        className="w-7 bg-transparent outline-none font-black text-sm text-center text-[#2d5016] dark:text-[#e2d7c7] font-mono"
                                                        value={day}
                                                        onChange={handleDayChange}
                                                        onFocus={e => e.target.select()}
                                                    />
                                                    <span className="text-[#8b6f47]/50 dark:text-[#c4a480]/50 font-bold">/</span>
                                                    <input
                                                        ref={monthRef}
                                                        type="text"
                                                        placeholder="MM"
                                                        maxLength={2}
                                                        className="w-7 bg-transparent outline-none font-black text-sm text-center text-[#2d5016] dark:text-[#e2d7c7] font-mono"
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
                                                        maxLength={4}
                                                        className="w-12 bg-transparent outline-none font-black text-sm text-center text-[#2d5016] dark:text-[#e2d7c7] font-mono"
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
                                                    <div className="w-9 h-9 flex items-center justify-center bg-[#8b6f47]/10 dark:bg-[#d4a574]/15 border border-[#8b6f47]/20 dark:border-[#d4a574]/30 rounded-xl text-[#8b6f47] dark:text-[#c4a480] hover:text-[#2d5016] dark:hover:text-[#34d399] transition-all shadow-xs cursor-pointer">
                                                        <Calendar size={16} />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Custom Time Select Box */}
                                            <div ref={timeContainerRef} className="relative w-[135px] shrink-0">
                                                <div className={cn(
                                                    "flex items-center gap-1 bg-transparent p-1.5 rounded-2xl border transition-all h-[52px]",
                                                    isTimeDropdownOpen
                                                        ? "border-[#8b6f47] dark:border-[#d4a574] ring-2 ring-[#8b6f47]/15"
                                                        : "border-[#8b6f47]/25 dark:border-[#d4a574]/25 hover:border-[#8b6f47]/50"
                                                )}>
                                                    <div className="flex items-center flex-1 px-1 justify-center">
                                                        <input
                                                            ref={hourRef}
                                                            type="text"
                                                            placeholder="12"
                                                            maxLength={2}
                                                            value={hour}
                                                            onChange={(e) => {
                                                                const val = e.target.value.replace(/\D/g, '').slice(0, 2);
                                                                if (val === '' || (parseInt(val, 10) >= 0 && parseInt(val, 10) <= 23)) {
                                                                    setHour(val);
                                                                    if (val.length === 2) minuteRef.current?.focus();
                                                                }
                                                            }}
                                                            onBlur={() => {
                                                                if (hour) setHour(hour.padStart(2, '0'));
                                                            }}
                                                            onFocus={(e) => e.target.select()}
                                                            className="w-6 bg-transparent outline-none font-black text-sm text-center text-[#2d5016] dark:text-[#e2d7c7] font-mono"
                                                            title="Giờ (00-23)"
                                                        />
                                                        <span className="text-[#8b6f47]/50 dark:text-[#c4a480]/50 font-bold px-0.5">:</span>
                                                        <input
                                                            ref={minuteRef}
                                                            type="text"
                                                            placeholder="00"
                                                            maxLength={2}
                                                            value={minute}
                                                            onChange={(e) => {
                                                                const val = e.target.value.replace(/\D/g, '').slice(0, 2);
                                                                if (val === '' || (parseInt(val, 10) >= 0 && parseInt(val, 10) <= 59)) {
                                                                    setMinute(val);
                                                                }
                                                            }}
                                                            onBlur={() => {
                                                                if (minute) setMinute(minute.padStart(2, '0'));
                                                            }}
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Backspace' && !minute) hourRef.current?.focus();
                                                            }}
                                                            onFocus={(e) => e.target.select()}
                                                            className="w-6 bg-transparent outline-none font-black text-sm text-center text-[#2d5016] dark:text-[#e2d7c7] font-mono"
                                                            title="Phút (00-59)"
                                                        />
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => setIsTimeDropdownOpen(prev => !prev)}
                                                        className={cn(
                                                            "w-9 h-9 flex items-center justify-center rounded-xl border transition-all cursor-pointer shrink-0 shadow-xs",
                                                            isTimeDropdownOpen
                                                                ? "bg-[#2d5016] dark:bg-[#34d399] text-white dark:text-slate-900 border-transparent"
                                                                : "bg-[#8b6f47]/10 dark:bg-[#d4a574]/15 border-[#8b6f47]/20 dark:border-[#d4a574]/30 text-[#8b6f47] dark:text-[#c4a480] hover:text-[#2d5016] dark:hover:text-[#34d399]"
                                                        )}
                                                        title="Bật bảng chọn giờ"
                                                    >
                                                        <Clock size={16} />
                                                    </button>
                                                </div>

                                                {/* Custom Time Selector Dropdown */}
                                                <AnimatePresence>
                                                    {isTimeDropdownOpen && (
                                                        <m.div
                                                            initial={{ opacity: 0, y: -4, scale: 0.96 }}
                                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                                            exit={{ opacity: 0, y: -4, scale: 0.96 }}
                                                            transition={{ duration: 0.15 }}
                                                            className="absolute right-0 top-full mt-2 z-50 w-60 bg-[#fbf9f4] dark:bg-[#1a1714] rounded-2xl border-2 border-[#8b6f47]/30 dark:border-[#d4a574]/30 shadow-2xl p-3 flex flex-col gap-2.5 backdrop-blur-xl"
                                                        >
                                                            {/* Header with shortcut buttons */}
                                                            <div className="flex items-center justify-between pb-2 border-b border-[#8b6f47]/15 dark:border-[#d4a574]/15">
                                                                <span className="text-[10px] font-black uppercase tracking-wider text-[#8b6f47] dark:text-[#c4a480]">
                                                                    Chọn giờ
                                                                </span>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        const now = new Date();
                                                                        const curH = String(now.getHours()).padStart(2, '0');
                                                                        const curM = String(now.getMinutes()).padStart(2, '0');
                                                                        setHour(curH);
                                                                        setMinute(curM);
                                                                        setIsTimeDropdownOpen(false);
                                                                    }}
                                                                    className="text-[10px] font-black px-2 py-1 rounded-lg bg-[#8b6f47]/10 dark:bg-[#d4a574]/15 text-[#2d5016] dark:text-[#34d399] hover:bg-[#8b6f47]/20 transition-all flex items-center gap-1 cursor-pointer"
                                                                >
                                                                    <RotateCcw size={10} /> Hiện tại
                                                                </button>
                                                            </div>

                                                            {/* Quick presets */}
                                                            <div className="flex flex-wrap gap-1">
                                                                {['07:00', '08:00', '10:00', '11:30', '12:00', '13:30', '15:00', '17:00'].map((preset) => {
                                                                    const [pH, pM] = preset.split(':');
                                                                    const isSelected = hour.padStart(2, '0') === pH && minute.padStart(2, '0') === pM;
                                                                    return (
                                                                        <button
                                                                            key={preset}
                                                                            type="button"
                                                                            onClick={() => {
                                                                                setHour(pH);
                                                                                setMinute(pM);
                                                                            }}
                                                                            className={cn(
                                                                                "px-1.5 py-0.5 rounded-md text-[10px] font-mono font-bold transition-all border cursor-pointer",
                                                                                isSelected
                                                                                    ? "bg-[#2d5016] dark:bg-[#34d399] text-white dark:text-slate-900 border-transparent shadow-xs"
                                                                                    : "bg-black/[0.03] dark:bg-white/[0.03] border-transparent hover:border-[#8b6f47]/30 text-muted-foreground hover:text-foreground"
                                                                            )}
                                                                        >
                                                                            {preset}
                                                                        </button>
                                                                    );
                                                                })}
                                                            </div>

                                                            {/* Columns: Hour (00-23) & Minute (00-59) */}
                                                            <div className="grid grid-cols-2 gap-2 text-center pt-1 border-t border-[#8b6f47]/15 dark:border-[#d4a574]/15">
                                                                <div>
                                                                    <div className="text-[9px] font-black uppercase tracking-wider text-[#8b6f47] dark:text-[#c4a480] mb-1">
                                                                        Giờ (0-23)
                                                                    </div>
                                                                    <div className="max-h-36 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                                                                        {Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0')).map((h) => (
                                                                            <button
                                                                                key={h}
                                                                                type="button"
                                                                                onClick={() => setHour(h)}
                                                                                className={cn(
                                                                                    "w-full py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer",
                                                                                    hour.padStart(2, '0') === h
                                                                                        ? "bg-[#2d5016] text-white dark:bg-[#34d399] dark:text-slate-900 shadow-sm"
                                                                                        : "hover:bg-[#8b6f47]/10 dark:hover:bg-[#d4a574]/15 text-foreground"
                                                                                )}
                                                                            >
                                                                                {h}
                                                                            </button>
                                                                        ))}
                                                                    </div>
                                                                </div>

                                                                <div>
                                                                    <div className="text-[9px] font-black uppercase tracking-wider text-[#8b6f47] dark:text-[#c4a480] mb-1">
                                                                        Phút (0-59)
                                                                    </div>
                                                                    <div className="max-h-36 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                                                                        {Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0')).map((m) => (
                                                                            <button
                                                                                key={m}
                                                                                type="button"
                                                                                onClick={() => {
                                                                                    setMinute(m);
                                                                                    setIsTimeDropdownOpen(false);
                                                                                }}
                                                                                className={cn(
                                                                                    "w-full py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer",
                                                                                    minute.padStart(2, '0') === m
                                                                                        ? "bg-[#2d5016] text-white dark:bg-[#34d399] dark:text-slate-900 shadow-sm"
                                                                                        : "hover:bg-[#8b6f47]/10 dark:hover:bg-[#d4a574]/15 text-foreground"
                                                                                )}
                                                                            >
                                                                                {m}
                                                                            </button>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <div className="pt-2 border-t border-[#8b6f47]/15 dark:border-[#d4a574]/15 flex justify-end">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setIsTimeDropdownOpen(false)}
                                                                    className="text-[10px] font-black px-3 py-1 rounded-lg bg-[#2d5016] dark:bg-[#34d399] text-white dark:text-slate-900 hover:opacity-90 transition-all cursor-pointer"
                                                                >
                                                                    Xong
                                                                </button>
                                                            </div>
                                                        </m.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Nợ hiện tại */}
                                    <div>
                                        <label className="block text-[10px] font-black uppercase tracking-[0.1em] text-[#8b6f47] dark:text-[#c4a480] mb-2 ml-1 leading-none">
                                            Nợ hiện tại
                                        </label>
                                        <div className="w-full bg-black/[0.03] dark:bg-white/[0.03] border border-[#8b6f47]/20 dark:border-[#d4a574]/20 rounded-2xl px-5 py-3.5 font-black text-lg text-[#2d5016] dark:text-[#e2d7c7] select-none">
                                            {formatNumber(Math.abs(currentPartner.debt_balance || 0))} đ {currentPartner.debt_balance > 0 ? '(Khách nợ)' : currentPartner.debt_balance < 0 ? '(Mình nợ)' : ''}
                                        </div>
                                    </div>

                                    {/* Số tiền thanh toán */}
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
                                                    : "border-rose-500/30 focus:border-rose-600 dark:focus:border-rose-400 focus:ring-rose-500/10 text-rose-600 dark:text-rose-400"
                                            )}
                                            value={amount ? formatNumber(parseFloat(amount)) : ''}
                                            onChange={(e) => {
                                                const rawVal = e.target.value.replace(/\D/g, '');
                                                setAmount(rawVal);
                                            }}
                                            autoFocus
                                        />
                                    </div>

                                    {/* Dư nợ dự kiến */}
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

                                    {/* Ghi chú */}
                                    <div>
                                        <label className="block text-[10px] font-black uppercase tracking-[0.1em] text-[#8b6f47] dark:text-[#c4a480] mb-2 ml-1 leading-none">
                                            Ghi chú
                                        </label>
                                        <textarea
                                            rows="2"
                                            placeholder={type === 'Receipt' ? "Thu nợ cũ, tiền hàng..." : "Chi tiền nhập hàng, chi phí..."}
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
                                            type === 'Receipt' ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20" : "bg-rose-600 hover:bg-rose-700 shadow-rose-600/20"
                                        )}
                                    >
                                        {loading ? (
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        ) : (
                                            isEditMode ? 'LƯU THAY ĐỔI' : 'LẬP PHIẾU NGAY'
                                        )}
                                    </button>
                                </div>
                            </form>
                        </m.div>
                    </div>
                )}
            </AnimatePresence>
        </Portal>
    );
};

export default QuickVoucherModal;
