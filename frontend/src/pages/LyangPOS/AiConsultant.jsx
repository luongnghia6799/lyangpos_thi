import React, { useEffect } from 'react';
import AiConsultantModal from '../../components/modals/AiConsultantModal';

export default function AiConsultant() {
    useEffect(() => {
        const prevTitle = document.title;
        document.title = 'AI Tư Vấn & Cố Vấn Nông Nghiệp • Lí An AI';
        return () => {
            document.title = prevTitle;
        };
    }, []);

    return (
        <div className="w-full h-full min-h-0 flex-1 overflow-hidden select-none flex flex-col bg-transparent">
            <AiConsultantModal
                isOpen={true}
                isStandalone={true}
                onlyDoctorMode={false}
            />
        </div>
    );
}
