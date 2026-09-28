import React from 'react';
import { useIconContext } from '../../context/IconContext';
import IconPickerModal from '../modals/IconPickerModal';
import { Edit3, Check, RotateCcw } from 'lucide-react';
import { motion as m, AnimatePresence } from 'framer-motion';

export default function GlobalIconPickerContainer() {
    const {
        editMode,
        toggleEditMode,
        activePickerTarget,
        closePicker,
        updateIcon,
        resetIcons
    } = useIconContext();

    return (
        <>
            {/* Modal picker khi click vao bat ky icon nao trong Edit Mode hoac tu Settings */}
            <IconPickerModal
                isOpen={!!activePickerTarget}
                onClose={closePicker}
                target={activePickerTarget}
                onSelectIcon={(id, name) => updateIcon(id, name)}
                onResetIcon={(id) => updateIcon(id, null)}
            />

            {/* Floating Banner thông báo đang bật chế độ Tùy biến Icon (Alt + I) */}
            <AnimatePresence>
                {editMode && (
                    <m.div
                        initial={{ opacity: 0, y: -40, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -40, scale: 0.9 }}
                        transition={{ type: "spring", stiffness: 400, damping: 28 }}
                        className="fixed top-4 left-1/2 -translate-x-1/2 z-[99999] flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-amber-500/95 dark:bg-amber-600/95 text-white shadow-2xl backdrop-blur-md border border-white/20 select-none text-xs font-bold"
                    >
                        <div className="flex items-center gap-2">
                            <span className="p-1 rounded-lg bg-black/20 animate-spin">
                                <Edit3 size={14} />
                            </span>
                            <span>
                                Đang bật <strong>Chế độ đổi Icon</strong>: Bấm vào bất kỳ icon nào có viền vàng để đổi!
                            </span>
                        </div>

                        <div className="flex items-center gap-1.5 pl-2 border-l border-white/20">
                            <button
                                type="button"
                                onClick={() => {
                                    if (window.confirm('Khôi phục tất cả icon về mặc định ban đầu?')) {
                                        resetIcons();
                                    }
                                }}
                                className="px-2 py-1 rounded-xl bg-black/20 hover:bg-black/30 text-[10px] font-black uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer"
                                title="Khôi phục toàn bộ icon về mặc định"
                            >
                                <RotateCcw size={11} />
                                <span>Reset tất cả</span>
                            </button>
                            <button
                                type="button"
                                onClick={toggleEditMode}
                                className="px-3 py-1 rounded-xl bg-white text-amber-700 hover:bg-amber-50 text-[11px] font-black uppercase tracking-wider flex items-center gap-1 shadow-sm transition-all cursor-pointer"
                            >
                                <Check size={12} strokeWidth={3} />
                                <span>Xong (Alt+I)</span>
                            </button>
                        </div>
                    </m.div>
                )}
            </AnimatePresence>
        </>
    );
}
