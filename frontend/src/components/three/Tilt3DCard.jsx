import React, { useRef, useState, useCallback } from 'react';
import { cn } from '../../lib/utils';

/**
 * Tilt3DCard - Spatial 3D Card with cursor-tracked perspective tilt,
 * Z-axis depth extrusion, and dynamic specular glare reflection.
 */
export default function Tilt3DCard({
    children,
    className = '',
    style = {},
    intensity = 10,
    glare = true,
    scale = 1.015,
    disabled = false,
    onClick,
    ...props
}) {
    const cardRef = useRef(null);
    const [transformStyle, setTransformStyle] = useState('perspective(1100px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)');
    const [glarePos, setGlarePos] = useState({ x: 50, y: 50, opacity: 0 });

    const handleMouseMove = useCallback((e) => {
        if (disabled || !cardRef.current) return;
        if (document.documentElement.classList.contains('gpu-disabled')) return;

        const rect = cardRef.current.getBoundingClientRect();
        const width = rect.width || 1;
        const height = rect.height || 1;
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const pctX = (mouseX / width) - 0.5;
        const pctY = (mouseY / height) - 0.5;

        const rotateY = +(pctX * intensity * 1.6).toFixed(2);
        const rotateX = -(pctY * intensity * 1.6).toFixed(2);

        setTransformStyle(
            `perspective(1100px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(8px) scale3d(${scale}, ${scale}, 1)`
        );
        if (glare) {
            setGlarePos({
                x: Math.round((mouseX / width) * 100),
                y: Math.round((mouseY / height) * 100),
                opacity: 0.22
            });
        }
    }, [disabled, intensity, glare, scale]);

    const handleMouseLeave = useCallback(() => {
        setTransformStyle('perspective(1100px) rotateX(0deg) rotateY(0deg) translateZ(0px) scale3d(1, 1, 1)');
        setGlarePos(prev => ({ ...prev, opacity: 0 }));
    }, []);

    return (
        <div
            ref={cardRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            onClick={onClick}
            style={{
                ...style,
                transform: transformStyle,
                transformStyle: 'preserve-3d',
                transition: glarePos.opacity > 0
                    ? 'transform 0.08s ease-out, box-shadow 0.2s ease'
                    : 'transform 0.45s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.35s ease'
            }}
            className={cn('relative argon-card', className)}
            {...props}
        >
            {glare && (
                <div
                    className="pointer-events-none absolute inset-0 rounded-[inherit] overflow-hidden z-20 transition-opacity duration-300"
                    style={{
                        opacity: glarePos.opacity,
                        background: `radial-gradient(circle at ${glarePos.x}% ${glarePos.y}%, rgba(255,255,255,0.65) 0%, rgba(255,255,255,0.12) 35%, transparent 70%)`,
                        mixBlendMode: 'overlay'
                    }}
                />
            )}
            <div style={{ transform: 'translateZ(12px)', transformStyle: 'preserve-3d' }} className="relative z-10 h-full w-full">
                {children}
            </div>
        </div>
    );
}

