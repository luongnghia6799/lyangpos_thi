import React, { useEffect } from 'react';
import AiConsultantModal from '../../components/modals/AiConsultantModal';

export default function BacSiSauQuy() {
    useEffect(() => {
        const prevTitle = document.title;
        document.title = 'Bác Sĩ Cây Trồng Lí An • Tư Vấn & Kê Đơn Thuốc BVTV';
        return () => {
            document.title = prevTitle;
        };
    }, []);

    return (
        <div className="fixed inset-0 w-full h-full max-h-[100dvh] overflow-hidden bg-transparent select-none flex flex-col z-30">
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
