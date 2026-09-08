import React from 'react';
import BlossomItem from './BlossomItem';

const TetDecorations = ({ density = 12 }) => {
    const isDark = document.documentElement.classList.contains('dark');
    const accentColor = isDark ? '#fbbf24' : '#dc2626';
    const secondaryColor = isDark ? '#ef4444' : '#fbbf24';

    return (
        <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-30 z-0 print:hidden">
            <style>
                {`
                    @keyframes bounce-slow {
                        0%, 100% { transform: translateY(0); }
                        50% { transform: translateY(-20px); }
                    }
                    .animate-bounce-slow {
                        animation: bounce-slow 4s ease-in-out infinite;
                    }
                    @keyframes spin-very-slow {
                        from { transform: rotate(0deg); }
                        to { transform: rotate(360deg); }
                    }
                    .animate-spin-very-slow {
                        animation: spin-very-slow 30s linear infinite;
                    }
                    @keyframes float {
                        0%, 100% { transform: translateY(0); }
                        50% { transform: translateY(-20px); }
                    }
                    .animate-float { animation: float 3s ease-in-out infinite; }
                `}
            </style>

            {/* Hanging Lanterns - Left */}
            <div className="absolute top-0 left-10 animate-bounce-slow">
                <svg width="40" height="120" viewBox="0 0 40 100">
                    <line x1="20" y1="0" x2="20" y2="30" stroke={accentColor} strokeWidth="2" />
                    <ellipse cx="20" cy="50" rx="15" ry="20" fill={secondaryColor} />
                    <line x1="10" y1="50" x2="30" y2="50" stroke={accentColor} strokeWidth="1" opacity="0.3" />
                    <rect x="15" y="70" width="10" height="5" fill={accentColor} />
                    <path d="M18 75 L15 100 M20 75 L20 100 M22 75 L25 100" stroke={accentColor} strokeWidth="1" />
                </svg>
            </div>

            {/* Hanging Lanterns - Right */}
            <div className="absolute top-0 right-10 animate-bounce-slow" style={{ animationDelay: '2s' }}>
                <svg width="40" height="120" viewBox="0 0 40 100">
                    <line x1="20" y1="0" x2="20" y2="30" stroke={accentColor} strokeWidth="2" />
                    <ellipse cx="20" cy="50" rx="15" ry="20" fill={secondaryColor} />
                    <line x1="10" y1="50" x2="30" y2="50" stroke={accentColor} strokeWidth="1" opacity="0.3" />
                    <rect x="15" y="70" width="10" height="5" fill={accentColor} />
                    <path d="M18 75 L15 100 M20 75 L20 100 M22 75 L25 100" stroke={accentColor} strokeWidth="1" />
                </svg>
            </div>

            {/* Floating Blossoms */}
            {[...Array(density)].map((_, i) => (
                <BlossomItem key={i} accentColor={accentColor} secondaryColor={secondaryColor} />
            ))}

            {/* Firecrackers (Pháo) - Optional decorative touch in corners */}
            <div className="absolute top-20 right-20 opacity-20 hidden lg:block">
                <svg width="30" height="100" viewBox="0 0 40 120">
                    <line x1="20" y1="0" x2="20" y2="100" stroke={accentColor} strokeWidth="1" strokeDasharray="2,2" />
                    {[...Array(4)].map((_, i) => (
                        <g key={i} transform={`translate(0, ${i * 20 + 10})`}>
                            <rect x="5" y="0" width="14" height="8" fill={secondaryColor} rx="1" />
                            <rect x="21" y="6" width="14" height="8" fill={secondaryColor} rx="1" />
                        </g>
                    ))}
                </svg>
            </div>

            {/* Traditional Symbol - Luck */}
            <div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.03] animate-spin-very-slow text-[30vw] font-black select-none pointer-events-none"
                style={{ color: accentColor }}
            >
                福
            </div>

            {/* Cloud Pattern at bottom */}
            <div className="absolute bottom-0 left-0 w-full flex opacity-10">
                {[...Array(8)].map((_, i) => (
                    <svg key={i} width="200" height="60" viewBox="0 0 100 50" className="flex-shrink-0">
                        <path d="M0 50 Q 25 10, 50 50 Q 75 10, 100 50" stroke={accentColor} fill="none" strokeWidth="2" />
                    </svg>
                ))}
            </div>
        </div>
    );
};

export default TetDecorations;
