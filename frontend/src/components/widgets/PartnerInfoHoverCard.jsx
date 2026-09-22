import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, MapPin, Receipt, FileText, Edit3, CreditCard } from 'lucide-react';

const formatNumber = (num) => {
    if (num === null || num === undefined || isNaN(num)) return '0';
    return Number(num).toLocaleString('vi-VN');
};

export const PartnerInfoHoverCard = ({ partner, isVisible, position = 'bottom' }) => {
    if (!partner || !isVisible) return null;

    const isCustomer = partner.is_customer !== false;
    const isSupplier = Boolean(partner.is_supplier);
    const debt = partner.debt_balance || 0;

    let partnerTypeLabel = 'Khách hàng';
    let partnerTypeClass = 'bg-emerald-500/15 border-emerald-500/30 text-emerald-700 dark:text-emerald-400';
    if (isCustomer && isSupplier) {
        partnerTypeLabel = 'KH & NCC';
        partnerTypeClass = 'bg-blue-500/15 border-blue-500/30 text-blue-700 dark:text-blue-400';
    } else if (!isCustomer && isSupplier) {
        partnerTypeLabel = 'Nhà cung cấp';
        partnerTypeClass = 'bg-amber-500/15 border-amber-500/30 text-amber-700 dark:text-amber-400';
    }

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: position === 'top' ? -6 : 6, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: position === 'top' ? -6 : 6, scale: 0.96 }}
                transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
                className={`absolute ${position === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'} left-0 w-72 md:w-80 z-[4500] pointer-events-none select-none`}
            >
                <div className="dropdown-premium p-3.5 rounded-2xl !relative text-foreground flex flex-col gap-2.5 shadow-xl">
                    
                    {/* Header: Name + Badge */}
                    <div className="flex items-center justify-between gap-2 border-b border-slate-200/60 dark:border-slate-800/80 pb-2">
                        <div className="flex items-center gap-2 min-w-0">
                            <h4 className="text-sm font-black text-foreground uppercase tracking-tight truncate" title={partner.name}>
                                {partner.name}
                            </h4>
                            {partner.code && (
                                <span className="text-[10px] font-mono text-muted-foreground opacity-70 shrink-0">
                                    #{partner.code}
                                </span>
                            )}
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border shrink-0 ${partnerTypeClass}`}>
                            {partnerTypeLabel}
                        </span>
                    </div>

                    {/* Contact Details */}
                    <div className="space-y-1.5 text-xs">
                        {/* Phone */}
                        <div className="flex items-center gap-2 text-foreground/90">
                            <div className="w-5 h-5 rounded-md bg-emerald-500/10 dark:bg-emerald-500/20 text-[#059669] dark:text-emerald-400 flex items-center justify-center shrink-0">
                                <Phone size={11} strokeWidth={2.5} />
                            </div>
                            <span className="font-bold text-[11px] text-foreground">
                                {partner.phone || <span className="text-muted-foreground italic font-normal">Chưa có số điện thoại</span>}
                            </span>
                        </div>

                        {/* CCCD / ID Card */}
                        <div className="flex items-center gap-2 text-foreground/90">
                            <div className="w-5 h-5 rounded-md bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                                <CreditCard size={11} strokeWidth={2.5} />
                            </div>
                            <span className="font-mono text-[11px]">
                                {partner.cccd ? (
                                    <>CCCD: <strong className="text-foreground tracking-wider">{partner.cccd}</strong></>
                                ) : (
                                    <span className="text-muted-foreground italic font-normal">Chưa có CCCD</span>
                                )}
                            </span>
                        </div>

                        {/* Address */}
                        <div className="flex items-start gap-2 text-foreground/90">
                            <div className="w-5 h-5 rounded-md bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                                <MapPin size={11} strokeWidth={2.5} />
                            </div>
                            <span className="font-medium text-[11px] leading-snug line-clamp-2">
                                {partner.address || <span className="text-muted-foreground italic font-normal">Chưa có địa chỉ</span>}
                            </span>
                        </div>

                        {/* Tax Code */}
                        {partner.tax_code && (
                            <div className="flex items-center gap-2 text-foreground/90">
                                <div className="w-5 h-5 rounded-md bg-purple-500/10 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                                    <Receipt size={11} strokeWidth={2.5} />
                                </div>
                                <span className="font-mono text-[10px]">
                                    MST: <strong className="text-foreground">{partner.tax_code}</strong>
                                </span>
                            </div>
                        )}

                        {/* Note */}
                        {partner.note && (
                            <div className="flex items-start gap-2 text-foreground/90">
                                <div className="w-5 h-5 rounded-md bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                                    <FileText size={11} strokeWidth={2.5} />
                                </div>
                                <span className="italic text-[10px] text-muted-foreground line-clamp-2">
                                    "{partner.note}"
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Debt balance summary */}
                    <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800/80 flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                            Công nợ hiện tại:
                        </span>
                        <div className="text-right">
                            <span className={`text-xs font-black tabular-nums ${
                                debt > 0 
                                    ? 'text-rose-600 dark:text-rose-400' 
                                    : debt < 0 
                                    ? 'text-emerald-600 dark:text-emerald-400' 
                                    : 'text-muted-foreground'
                            }`}>
                                {formatNumber(Math.abs(debt))} đ
                            </span>
                            <span className="text-[9px] font-bold uppercase ml-1 opacity-70">
                                {debt > 0 ? '(Nợ)' : debt < 0 ? '(Dư)' : '(Hết nợ)'}
                            </span>
                        </div>
                    </div>

                    {/* Quick tip footer */}
                    <div className="pt-1.5 border-t border-dashed border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between text-[8.5px] font-bold text-muted-foreground uppercase tracking-wider">
                        <span className="flex items-center gap-1">
                            <Edit3 size={9} /> Nhấp đúp ô để sửa
                        </span>
                        <span>Nhấn F3 để tìm</span>
                    </div>

                </div>
            </motion.div>
        </AnimatePresence>
    );
};

export default PartnerInfoHoverCard;
