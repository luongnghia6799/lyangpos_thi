import React, { useState, useEffect, useRef, memo, useCallback } from 'react';
import { cn } from '../../lib/utils';

export const DEFAULT_DROPDOWN_MASCOT_CONFIG = {
    size: 44,
    top: -30,
    right: 24,
    visible: true
};

const DropdownMascot = ({ title = "Bé Lyang - Trợ lý bán hàng thông minh" }) => {
    const mascotRef = useRef(null);
    const tooltipRef = useRef(null);
    const [isEditing, setIsEditing] = useState(false);

    const [config, setConfig] = useState(() => {
        try {
            const saved = localStorage.getItem('pos_mascot_dropdown_config');
            if (saved) {
                return { ...DEFAULT_DROPDOWN_MASCOT_CONFIG, ...JSON.parse(saved) };
            }
        } catch (e) {}
        return DEFAULT_DROPDOWN_MASCOT_CONFIG;
    });

    const configRef = useRef(config);
    useEffect(() => {
        configRef.current = config;
    }, [config]);

    // Lắng nghe sự kiện đồng bộ config giữa các màn hình / dropdown
    useEffect(() => {
        const handleSync = (e) => {
            if (!e.detail) return;
            setConfig(prev => {
                if (
                    prev.size === e.detail.size &&
                    prev.top === e.detail.top &&
                    prev.right === e.detail.right &&
                    prev.visible === e.detail.visible
                ) {
                    return prev;
                }
                return { ...prev, ...e.detail };
            });
        };
        window.addEventListener('mascot_dropdown_config_updated', handleSync);
        return () => window.removeEventListener('mascot_dropdown_config_updated', handleSync);
    }, []);

    // Cuộn chuột để phóng to / thu nhỏ kích thước
    useEffect(() => {
        if (!isEditing || !mascotRef.current) return;
        const el = mascotRef.current;
        const handleWheel = (e) => {
            e.preventDefault();
            e.stopPropagation();
            const delta = e.deltaY < 0 ? 2 : -2;
            const currentSize = configRef.current.size || DEFAULT_DROPDOWN_MASCOT_CONFIG.size;
            const newSize = Math.max(16, Math.min(120, currentSize + delta));
            if (newSize === currentSize) return;

            const updated = {
                ...configRef.current,
                size: newSize
            };
            configRef.current = updated;
            setConfig(updated);
            localStorage.setItem('pos_mascot_dropdown_config', JSON.stringify(updated));
            window.dispatchEvent(new CustomEvent('mascot_dropdown_config_updated', { detail: updated }));
        };
        el.addEventListener('wheel', handleWheel, { passive: false });
        return () => el.removeEventListener('wheel', handleWheel);
    }, [isEditing]);

    // Kéo chuột để dời vị trí (thao tác mượt mà qua requestAnimationFrame, không re-render tràn lan)
    const handleMouseDown = useCallback((e) => {
        if (!isEditing) return;
        if (e.button !== 0) return;
        e.preventDefault();
        e.stopPropagation();

        const startX = e.clientX;
        const startY = e.clientY;
        const startTop = configRef.current.top ?? DEFAULT_DROPDOWN_MASCOT_CONFIG.top;
        const startRight = configRef.current.right ?? DEFAULT_DROPDOWN_MASCOT_CONFIG.right;

        let rafId = null;

        const handleMouseMove = (moveEvent) => {
            const deltaX = moveEvent.clientX - startX;
            const deltaY = moveEvent.clientY - startY;
            const newTop = Math.round(startTop + deltaY);
            const newRight = Math.round(startRight - deltaX);

            if (rafId) cancelAnimationFrame(rafId);
            rafId = requestAnimationFrame(() => {
                const updated = {
                    ...configRef.current,
                    top: newTop,
                    right: newRight
                };
                configRef.current = updated;
                setConfig(updated);
            });
        };

        const handleMouseUp = (upEvent) => {
            if (rafId) cancelAnimationFrame(rafId);
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);

            const deltaX = upEvent.clientX - startX;
            const deltaY = upEvent.clientY - startY;
            const finalTop = Math.round(startTop + deltaY);
            const finalRight = Math.round(startRight - deltaX);

            const updated = {
                ...configRef.current,
                top: finalTop,
                right: finalRight
            };
            configRef.current = updated;
            setConfig(updated);
            localStorage.setItem('pos_mascot_dropdown_config', JSON.stringify(updated));
            window.dispatchEvent(new CustomEvent('mascot_dropdown_config_updated', { detail: updated }));
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
    }, [isEditing]);

    const handleContextMenu = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsEditing(prev => !prev);
    }, []);

    // Đóng chế độ edit khi click ra ngoài hoặc bấm ESC
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

    const handleReset = useCallback((e) => {
        e.stopPropagation();
        const updated = { ...DEFAULT_DROPDOWN_MASCOT_CONFIG };
        configRef.current = updated;
        setConfig(updated);
        localStorage.setItem('pos_mascot_dropdown_config', JSON.stringify(updated));
        window.dispatchEvent(new CustomEvent('mascot_dropdown_config_updated', { detail: updated }));
    }, []);

    if (config.visible === false) return null;

    return (
        <div
            ref={mascotRef}
            onContextMenu={handleContextMenu}
            onMouseDown={handleMouseDown}
            onClick={isEditing ? (e) => { e.preventDefault(); e.stopPropagation(); } : undefined}
            style={{
                top: `${config.top}px`,
                right: `${config.right}px`,
                width: `${config.size}px`,
                height: `${config.size}px`,
                zIndex: 999999
            }}
            className={cn(
                "absolute !z-[999999] select-none flex items-end pointer-events-auto transition-transform duration-100",
                isEditing
                    ? "cursor-grab active:cursor-grabbing ring-2 ring-emerald-400 ring-offset-2 ring-offset-black/20 rounded-2xl shadow-xl shadow-emerald-500/20"
                    : "cursor-pointer group/mascot-drop hover:scale-110 hover:rotate-3"
            )}
            title={isEditing ? "Kéo để dời vị trí | Cuộn chuột để đổi kích thước" : "Click chuột phải để chỉnh kích thước & vị trí Mascot"}
        >
            <img
                src="/assets/images/mascot_active_pill.png"
                alt="Bé Lyang"
                className="w-full h-full object-contain pointer-events-none drop-shadow-[0_4px_10px_rgba(0,0,0,0.18)]"
                draggable="false"
                loading="eager"
                decoding="sync"
            />
            {!isEditing && (
                <span className="absolute -top-6 left-1/2 -translate-x-1/2 bg-zinc-950/90 dark:bg-black/90 text-amber-300 dark:text-emerald-300 text-[9.5px] font-black px-2 py-0.5 rounded-full whitespace-nowrap opacity-0 group-hover/mascot-drop:opacity-100 transition-opacity pointer-events-none shadow-md border border-white/10 backdrop-blur-md">
                    Bé Lyang chào bạn! 🌾
                </span>
            )}

            {/* Tooltip chỉnh sửa gắn trực tiếp với Mascot, di chuyển theo mascot mượt mà, không gián đoạn Portal */}
            {isEditing && (
                <div
                    ref={tooltipRef}
                    onClick={(e) => e.stopPropagation()}
                    className="absolute top-0 right-full mr-3 z-[999999] bg-zinc-950/95 dark:bg-[#1a1714]/95 text-white text-[11px] font-bold p-3 rounded-2xl shadow-2xl border border-white/20 dark:border-white/10 whitespace-nowrap backdrop-blur-xl flex flex-col gap-2 select-none animate-in fade-in zoom-in-95"
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
            )}
        </div>
    );
};

// Memoize tuyệt đối: Không bao giờ re-render khi parent re-render (tìm kiếm, hover item, scroll danh sách...)
export default memo(DropdownMascot, () => true);
