import React, { useEffect } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { BadgePercent, X, ArrowDown } from 'lucide-react';
import Portal from './Portal';
import { formatCurrency, speakNumber, numberToViText } from '../lib/utils';

export default function TaxCalculatorModal({
    isOpen,
    onClose,
    totalAmount = 0,
    partnerName = ""
}) {

    const lastSpokenAmountRef = React.useRef(null);

    useEffect(() => {
        console.log("TaxCalculatorModal useEffect triggered:", { isOpen, totalAmount, partnerName });
        if (isOpen && totalAmount > 0 && localStorage.getItem("pos_tts_mode") !== "off") {
            const step1 = totalAmount / 1.05;
            const step2 = Math.floor(step1 / 100) * 100;
            const finalAmount = step2 * 1.05;
            console.log("TaxCalculatorModal calculated finalAmount:", finalAmount, "lastSpoken:", lastSpokenAmountRef.current);
            
            if (lastSpokenAmountRef.current !== finalAmount) {
                const disablePartner = localStorage.getItem("pos_tts_disable_partner_transfer") === "true";
                const finalPartner = disablePartner ? "" : partnerName;
                
                const template = finalPartner
                    ? (localStorage.getItem("pos_tts_transfer_partner_template") || "số tiền cần chuyển khoản của {partner} là {amount} đồng")
                    : (localStorage.getItem("pos_tts_transfer_template") || "số tiền cần chuyển khoản là {amount} đồng");
                
                console.log("TaxCalculatorModal calling speakNumber with:", { finalAmount, finalPartner, template });
                speakNumber(finalAmount, true, finalPartner, template);
                lastSpokenAmountRef.current = finalAmount;
            }
        } else if (!isOpen) {
            lastSpokenAmountRef.current = null;
        }
    }, [isOpen, totalAmount, partnerName]);

    useEffect(() => {
        if (!isOpen) {
            return;
        }

        const handleKeyDown = (e) => {
            if (e.key === 'Enter' || e.key === 'Escape') {
                e.preventDefault();
                e.stopPropagation();
                onClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown, true);
        return () => {
            window.removeEventListener('keydown', handleKeyDown, true);
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const step1 = totalAmount / 1.05;
    const step2 = Math.floor(step1 / 100) * 100;
    const finalAmount = step2 * 1.05;

    return (
        <Portal>
            <AnimatePresence>
                {isOpen && (
                    <div className="fixed inset-0 z-[500000] flex items-center justify-center p-4 bg-transparent overflow-y-auto">
                        <m.div
                            initial={{ scale: 0.95, opacity: 0, y: 10 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 10 }}
                            className="bg-card/80 dark:bg-slate-950/80 backdrop-blur-2xl w-full max-w-md rounded-3xl border border-white/10 dark:border-white/15 flex flex-col relative z-10 overflow-hidden shadow-2xl"
                        >
                            {/* Header */}
                            <div className="p-5 flex items-center justify-between border-b border-border/50 bg-transparent">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20">
                                        <BadgePercent className="text-primary" size={20} />
                                    </div>
                                    <div>
                                        <h3 className="text-base font-bold text-foreground uppercase tracking-wide leading-tight">Quy đổi thuế</h3>
                                        <p className="text-muted-foreground text-[10px] font-medium uppercase tracking-widest mt-0.5">Xuất hóa đơn chuyển khoản</p>
                                    </div>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-transparent hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
                                >
                                    <X size={16} strokeWidth={2.5} />
                                </button>
                            </div>

                            {/* Body */}
                            <div className="p-5 space-y-3 bg-transparent">
                                {/* Step 1: Total */}
                                <div className="flex justify-between items-center p-3.5 bg-background/50 rounded-xl border border-border/80">
                                    <span className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Tổng cộng ban đầu</span>
                                    <span className="text-base font-bold text-foreground">{formatCurrency(totalAmount)}</span>
                                </div>
                                
                                <div className="flex justify-center -my-2 relative z-10">
                                    <div className="w-6 h-6 bg-primary/10 text-primary rounded-full flex items-center justify-center border border-primary/20">
                                        <ArrowDown size={12} strokeWidth={3} />
                                    </div>
                                </div>

                                {/* Step 2: Div 1.05 */}
                                <div className="flex justify-between items-center p-3.5 bg-background/50 rounded-xl border border-border/80">
                                    <span className="text-xs font-bold uppercase text-muted-foreground tracking-wider flex items-center gap-1.5">
                                        Chia 1.05 
                                        <span className="px-1.5 py-0.5 bg-primary/10 text-primary rounded text-[9px]">Gốc</span>
                                    </span>
                                    <span className="text-sm font-semibold text-foreground/80 tabular-nums">{formatCurrency(step1)}</span>
                                </div>

                                <div className="flex justify-center -my-2 relative z-10">
                                    <div className="w-6 h-6 bg-primary/10 text-primary rounded-full flex items-center justify-center border border-primary/20">
                                        <ArrowDown size={12} strokeWidth={3} />
                                    </div>
                                </div>

                                {/* Step 3: Rounding */}
                                <div className="flex justify-between items-center p-3.5 bg-background/50 rounded-xl border border-border/80">
                                    <span className="text-xs font-bold uppercase text-muted-foreground tracking-wider">
                                        Làm tròn <span className="lowercase text-[10px] font-normal">(xuống trăm)</span>
                                    </span>
                                    <span className="text-sm font-semibold text-foreground/80 tabular-nums">{formatCurrency(step2)}</span>
                                </div>

                                <div className="flex justify-center -my-1 relative z-10">
                                    <span className="text-[10px] font-bold px-2 py-0.5 bg-primary/10 text-primary rounded-full border border-primary/20">
                                        x 1.05
                                    </span>
                                </div>
                            </div>

                            {/* Final Amount Highlight */}
                            <div className="p-6 bg-transparent border-t border-border/50 text-center flex flex-col items-center">
                                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-primary/10 text-primary rounded-full text-[10px] font-bold uppercase tracking-wider mb-2 border border-primary/20">
                                    Số tiền cần chuyển khoản
                                </div>
                                
                                <div className="text-4xl font-extrabold text-primary tracking-tight tabular-nums mb-4">
                                    {formatCurrency(finalAmount)}
                                </div>
                                
                                <button
                                    onClick={onClose}
                                    className="w-full py-3 bg-primary hover:bg-primary-hover text-white rounded-xl font-bold uppercase tracking-wider transition-all duration-200 active:scale-[0.98]"
                                >
                                    Đã hiểu
                                </button>
                            </div>
                        </m.div>
                    </div>
                )}
            </AnimatePresence>
        </Portal>
    );
}
