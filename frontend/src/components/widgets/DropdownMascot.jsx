import React, { useState, useEffect, useRef, memo } from 'react';
import { motion as m } from 'framer-motion';
import Portal from './Portal';
import { cn } from '../../lib/utils';

export const DEFAULT_DROPDOWN_MASCOT_CONFIG = {
    size: 44,
    top: -30,
    right: 24,
    visible: true
};

const DropdownMascot = memo(({ title = "Bé Lyang - Trợ lý bán hàng thông minh" }) => {
    const mascotRef = useRef(null);
    const tooltipRef = useRef(null);
    const [isEditing, setIsEditing] = useState(false);
    const [tooltipPos, setTooltipPos] = useState(null);

    const [config, setConfig] = useState(() => {
        try {
            const saved = localStorage.getItem('pos_mascot_dropdown_config');
            if (saved) {
                return { ...DEFAULT_DROPDOWN_MASCOT_CONFIG, ...JSON.parse(saved) };
            }
        } catch (e) {}
        return DEFAULT_DROPDOWN_MASCOT_CONFIG;
    });

    useEffect(() => {
        const handleSync = (e) => {
            if (e.detail) setConfig(e.detail);
        };
        window.addEventListener('mascot_dropdown_config_updated', handleSync);
        return () => window.removeEventListener('mascot_dropdown_config_updated', handleSync);
    }, []);

    useEffect(() => {
        if (!isEditing) {
            setTooltipPos(null);
            return;
        }
        const updatePos = () => {
            if (mascotRef.current) {
                const rect = mascotRef.current.getBoundingClientRect();
                setTooltipPos({
                    top: Math.max(12, rect.top - 8),
                    left: rect.right + 14
                });
            }
        };
        updatePos();
        window.addEventListener('scroll', updatePos, true);
        window.addEventListener('resize', updatePos);
        return () => {
            window.removeEventListener('scroll', updatePos, true);
            window.removeEventListener('resize', updatePos);
        };
    }, [isEditing, config]);

    // Cuộn chuột để phóng to / thu nhỏ kích thước
    useEffect(() => {
        if (!isEditing || !mascotRef.current) return;
        const el = mascotRef.current;
        const handleWheel = (e) => {
            e.preventDefault();
            e.stopPropagation();
            const delta = e.deltaY < 0 ? 2 : -2;
            setConfig(prev => {
                const currentSize = prev.size || DEFAULT_DROPDOWN_MASCOT_CONFIG.size;
                const newSize = Math.max(16, Math.min(120, currentSize + delta));
                const updated = {
                    ...prev,
                    size: newSize
                };
                localStorage.setItem('pos_mascot_dropdown_config', JSON.stringify(updated));
                window.dispatchEvent(new CustomEvent('mascot_dropdown_config_updated', { detail: updated }));
                return updated;
            });
        };
        el.addEventListener('wheel', handleWheel, { passive: false });
        return () => el.removeEventListener('wheel', handleWheel);
    }, [isEditing]);

    // Kéo chuột để dời vị trí
    const handleMouseDown = (e) => {
        if (!isEditing) return;
        if (e.button !== 0) return;
        e.preventDefault();
        e.stopPropagation();

        const startX = e.clientX;
        const startY = e.clientY;
        const startTop = config.top ?? DEFAULT_DROPDOWN_MASCOT_CONFIG.top;
        const startRight = config.right ?? DEFAULT_DROPDOWN_MASCOT_CONFIG.right;

        const handleMouseMove = (moveEvent) => {
            const deltaX = moveEvent.clientX - startX;
            const deltaY = moveEvent.clientY - startY;
            const newTop = Math.round(startTop + deltaY);
            const newRight = Math.round(startRight - deltaX);

            setConfig(prev => ({
                ...prev,
                top: newTop,
                right: newRight
            }));
        };

        const handleMouseUp = (upEvent) => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);

            const deltaX = upEvent.clientX - startX;
            const deltaY = upEvent.clientY - startY;
            const finalTop = Math.round(startTop + deltaY);
            const finalRight = Math.round(startRight - deltaX);

            setConfig(prev => {
                const updated = {
                    ...prev,
                    top: finalTop,
                    right: finalRight
                };
                localStorage.setItem('pos_mascot_dropdown_config', JSON.stringify(updated));
                window.dispatchEvent(new CustomEvent('mascot_dropdown_config_updated', { detail: updated }));
                return updated;
            });
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
    };

    const handleContextMenu = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsEditing(prev => !prev);
    };

    useEffect(() => {
        if (!isEditing) return;
        const handleOutsideClick = (e) => {
            if (
                mascotRef.current && !mascotRef.current.contains(e.target) &&
                tooltipRef.current && !tooltipRef.current.contains(e.target)
            ) {
                setIsEditing(false);
            }
        };
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') setIsEditing(false);
        };
        const timer = setTimeout(() => {
            window.addEventListener('mousedown', handleOutsideClick);
            window.addEventListener('keydown', handleKeyDown);
        }, 100);
        return () => {
            clearTimeout(timer);
            window.removeEventListener('mousedown', handleOutsideClick);
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [isEditing]);

    const handleReset = (e) => {
        e.stopPropagation();
        setConfig(() => {
            const updated = { ...DEFAULT_DROPDOWN_MASCOT_CONFIG };
            localStorage.setItem('pos_mascot_dropdown_config', JSON.stringify(updated));
            window.dispatchEvent(new CustomEvent('mascot_dropdown_config_updated', { detail: updated }));
            return updated;
        });
    };

    if (config.visible === false) return null;

    return (
        <>
            <m.div
                ref={mascotRef}
                initial={{ opacity: 0, scale: 0.7, y: 6 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.7 }}
                whileHover={!isEditing ? { scale: 1.15, rotate: 3, transition: { duration: 0.2 } } : {}}
                transition={{ type: "spring", stiffness: 420, damping: 26 }}
                onContextMenu={handleContextMenu}
                onMouseDown={handleMouseDown}
                onClick={isEditing ? (e) => { e.preventDefault(); e.stopPropagation(); } : undefined}
                style={{
                    top: `${config.top}px`,
                    right: `${config.right}px`,
                    width: `${config.size}px`,
                    height: `${config.size}px`
                }}
                className={cn(
                    "absolute z-[400050] select-none flex items-end pointer-events-auto",
                    isEditing
                        ? "cursor-grab active:cursor-grabbing ring-2 ring-emerald-400 ring-offset-2 ring-offset-black/20 rounded-2xl shadow-xl shadow-emerald-500/20"
                        : "cursor-pointer group/mascot-drop"
                )}
                title={isEditing ? "Kéo để dời vị trí | Cuộn chuột để đổi kích thước" : "Click chuột phải để chỉnh kích thước & vị trí Mascot"}
            >
                <img
                    src="/assets/images/mascot_active_pill.png"
                    alt="Bé Lyang"
                    className="w-full h-full object-contain pointer-events-none drop-shadow-[0_4px_10px_rgba(0,0,0,0.18)]"
                    draggable="false"
                />
                {!isEditing && (
                    <span className="absolute -top-6 left-1/2 -translate-x-1/2 bg-zinc-950/90 dark:bg-black/90 text-amber-300 dark:text-emerald-300 text-[9.5px] font-black px-2 py-0.5 rounded-full whitespace-nowrap opacity-0 group-hover/mascot-drop:opacity-100 transition-opacity pointer-events-none shadow-md border border-white/10 backdrop-blur-md">
                        Bé Lyang chào bạn! 🌾
                    </span>
                )}
            </m.div>

            {isEditing && tooltipPos && (
                <Portal>
                    <div
                        ref={tooltipRef}
                        style={{
                            position: 'fixed',
                            top: `${tooltipPos.top}px`,
                            left: `${tooltipPos.left}px`,
                            zIndex: 999999
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="bg-zinc-950/95 dark:bg-[#1a1714]/95 text-white text-[11px] font-bold p-3 rounded-2xl shadow-2xl border border-white/20 dark:border-white/10 whitespace-nowrap backdrop-blur-xl flex flex-col gap-2 select-none animate-in fade-in zoom-in-95"
                    >
                        <div className="flex items-center justify-between gap-4 text-emerald-400 font-black">
                            <span className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                CHỈNH SỬA MASCOT DROPDOWN
                            </span>
                            <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded-full text-white font-mono">
                                {config.size}px
                            </span>
                        </div>
                        <div className="text-[10px] text-zinc-300 font-medium leading-relaxed">
                            <div>• 🖱️ <b>Kéo chuột:</b> Dời vị trí (Top: {config.top}px, Right: {config.right}px)</div>
                            <div>• 🔄 <b>Cuộn chuột:</b> Phóng to / Thu nhỏ size</div>
                        </div>
                        <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/10">
                            <button
                                type="button"
                                onClick={handleReset}
                                className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-[10px] text-zinc-300 transition-colors cursor-pointer"
                            >
                                Đặt lại mặc định
                            </button>
                            <button
                                type="button"
                                onClick={() => setIsEditing(false)}
                                className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-[10px] text-white font-black shadow-sm transition-colors cursor-pointer"
                            >
                                Xong ✓
                            </button>
                        </div>
                    </div>
                </Portal>
            )}
        </>
    );
});

export default DropdownMascot;
