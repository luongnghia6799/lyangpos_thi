import React, { useEffect } from 'react';
import AiConsultantModal from '../../components/modals/AiConsultantModal';

export default function BacSiSauQuy() {
    useEffect(() => {
        const prevTitle = document.title;
        document.title = 'Bác Sĩ Cây Trồng Sáu Quý • Tư Vấn & Kê Đơn Thuốc BVTV';
        return () => {
            document.title = prevTitle;
        };
    }, []);

    return (
        <div className="fixed inset-0 w-full h-full max-h-[100dvh] overflow-hidden bg-[#f4f1ea] dark:bg-[#050f0a] select-none flex flex-col z-30">
            {/* Ambient Background Lighting Orbs */}
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/10 dark:bg-emerald-500/5 rounded-full blur-3xl pointer-events-none -translate-y-1/2" />
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-teal-500/10 dark:bg-teal-500/5 rounded-full blur-3xl pointer-events-none translate-y-1/2" />

            <div className="relative z-10 w-full h-full flex flex-col flex-1 overflow-hidden">
                <AiConsultantModal
                    isOpen={true}
                    isStandalone={true}
                    onlyDoctorMode={true}
                    onClose={() => {
                        if (window.history.length > 1) {
                            window.history.back();
                        } else {
                            window.location.hash = '#/welcome';
                        }
                    }}
                />
            </div>
        </div>
    );
}
