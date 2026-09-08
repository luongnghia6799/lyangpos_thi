import React from 'react';

const BlossomItem = React.memo(({ accentColor, secondaryColor }) => {
    const style = React.useMemo(() => ({
        top: `${Math.random() * 100}%`,
        left: `${Math.random() * 100}%`,
        animationDelay: `${Math.random() * 5}s`,
        transform: `rotate(${Math.random() * 360}deg) scale(${0.4 + Math.random() * 0.8})`,
        animationDuration: `${3 + Math.random() * 4}s`
    }), []);

    return (
        <div className="absolute animate-pulse" style={style}>
            <svg width="24" height="24" viewBox="0 0 20 20">
                <circle cx="10" cy="10" r="3" fill={accentColor} />
                {[...Array(5)].map((_, j) => (
                    <ellipse
                        key={j}
                        cx="10" cy="5" rx="3" ry="6"
                        fill={accentColor}
                        transform={`rotate(${j * 72} 10 10)`}
                    />
                ))}
                <circle cx="10" cy="10" r="1.5" fill={secondaryColor} opacity="0.8" />
            </svg>
        </div>
    );
});

export default BlossomItem;
