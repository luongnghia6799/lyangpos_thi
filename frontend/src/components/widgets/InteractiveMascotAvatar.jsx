import React, { useState, useEffect, useRef, useCallback, useMemo, memo } from 'react';
import { MASCOT_LIST, playPopSound } from '../../lib/mascots';
import { cn } from '../../lib/utils';

const MASCOT_DIRECTIONS = [
    'up-left', 'up', 'up-right',
    'left', 'center', 'right',
    'down-left', 'down', 'down-right'
];

const MASCOT_CLOCKWISE = [
    'right', 'down-right', 'down', 'down-left',
    'left', 'up-left', 'up', 'up-right'
];

const MASCOT_SECTOR = (Math.PI * 2) / MASCOT_CLOCKWISE.length;
const MASCOT_HYSTERESIS = 0.08;

function getMascotCellPos(index) {
    const col = index % 3;
    const row = Math.floor(index / 3);
    return `${col * 50}% ${row * 50}%`;
}

function wrapMascotAngle(angle) {
    return Math.atan2(Math.sin(angle), Math.cos(angle));
}

const InteractiveMascotAvatar = memo(({
    className = '',
    size = 'w-full h-full',
    shape = 'circle', // 'circle' | 'rounded'
    interactive = true,
    scale = 1.25,
    onClick,
    title
}) => {
    const containerRef = useRef(null);
    const spriteRef = useRef(null);
    const sectorRef = useRef(-1);
    const isReactingRef = useRef(false);
    const timerRef = useRef(null);
    const boopsRef = useRef({ count: 0, at: 0 });
    const rafRef = useRef(null);
    const lastPointerRef = useRef((typeof window !== 'undefined' && window.__lyangLastPointer) 
        ? { ...window.__lyangLastPointer } 
        : { x: -999, y: -999 }
    );
    const centerRef = useRef({ x: 0, y: 0 });
    const updateHeadRef = useRef(null);
    const currentBgPosRef = useRef('50% 50%');

    // Mascot Character State
    const [charId, setCharId] = useState(() => {
        try {
            const saved = localStorage.getItem('lyang_mascot_config');
            if (saved) {
                const parsed = JSON.parse(saved);
                if (parsed.characterId) return parsed.characterId;
            }
        } catch (e) {}
        return 'lyang';
    });

    // Sync character with config updates
    useEffect(() => {
        const handleSync = () => {
            try {
                const saved = localStorage.getItem('lyang_mascot_config');
                if (saved) {
                    const parsed = JSON.parse(saved);
                    if (parsed.characterId && parsed.characterId !== charId) {
                        setCharId(parsed.characterId);
                    }
                }
            } catch (e) {}
        };
        window.addEventListener('lyang_mascot_config_updated', handleSync);
        window.addEventListener('storage', handleSync);
        return () => {
            window.removeEventListener('lyang_mascot_config_updated', handleSync);
            window.removeEventListener('storage', handleSync);
        };
    }, [charId]);

    const currentChar = useMemo(() => {
        return (MASCOT_LIST || []).find(m => m.id === charId) || {
            id: 'lyang',
            name: 'Lí An',
            directions: '/mascots/lyang-directions.webp',
            reactions: '/mascots/lyang-reactions.webp',
            avatar: '/mascots/avatar-lyang.webp'
        };
    }, [charId]);

    const directionsUrl = currentChar?.directions || '/mascots/lyang-directions.webp';
    const reactionsUrl = currentChar?.reactions || '/mascots/lyang-reactions.webp';

    const updateCenter = useCallback(() => {
        if (containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            centerRef.current = {
                x: rect.left + rect.width / 2,
                y: rect.top + rect.height / 2
            };
        }
    }, []);

    useEffect(() => {
        updateCenter();
        window.addEventListener('resize', updateCenter, { passive: true });
        window.addEventListener('scroll', updateCenter, { passive: true });
        return () => {
            window.removeEventListener('resize', updateCenter);
            window.removeEventListener('scroll', updateCenter);
        };
    }, [updateCenter]);

    // Head tracking logic
    const updateHead = useCallback(() => {
        rafRef.current = null;
        if (isReactingRef.current || !spriteRef.current || !interactive) return;

        let px = lastPointerRef.current.x;
        let py = lastPointerRef.current.y;
        if (px < 0 || py < 0) {
            if (typeof window !== 'undefined' && window.__lyangLastPointer) {
                px = window.__lyangLastPointer.x;
                py = window.__lyangLastPointer.y;
                lastPointerRef.current = { x: px, y: py };
            } else {
                return;
            }
        }

        const dx = px - centerRef.current.x;
        const dy = py - centerRef.current.y;
        const distSq = dx * dx + dy * dy;

        // Subtle 2.5D perspective tilt towards mouse cursor
        const maxDist = Math.max(window.innerWidth || 1200, window.innerHeight || 800);
        const dist = Math.sqrt(distSq);
        const factor = Math.min(1, dist / (maxDist * 0.35));
        const tiltX = dist > 0 ? (dx / dist) * factor * 2.5 : 0;
        const tiltY = dist > 0 ? (dy / dist) * factor * 2.5 : 0;
        const tiltRotate = dist > 0 ? (dx / dist) * factor * 3.5 : 0;

        spriteRef.current.style.transform = `scale(${scale}) translate3d(${tiltX.toFixed(2)}px, ${tiltY.toFixed(2)}px, 0px) rotate(${tiltRotate.toFixed(2)}deg)`;

        // Deadzone: when mouse is directly over avatar (< 28px), look directly forward
        if (distSq < 28 * 28) {
            if (sectorRef.current !== -1) {
                sectorRef.current = -1;
                currentBgPosRef.current = '50% 50%';
                spriteRef.current.style.backgroundPosition = '50% 50%';
            }
            return;
        }

        const angle = Math.atan2(dy, dx);
        const currentSector = sectorRef.current;

        // Hysteresis threshold to prevent jittering on sector boundaries
        if (
            currentSector !== -1 &&
            Math.abs(wrapMascotAngle(angle - currentSector * MASCOT_SECTOR)) < MASCOT_SECTOR / 2 + MASCOT_HYSTERESIS
        ) {
            if (spriteRef.current.style.backgroundPosition !== currentBgPosRef.current) {
                spriteRef.current.style.backgroundPosition = currentBgPosRef.current;
            }
            return;
        }

        const newSector = (Math.round(angle / MASCOT_SECTOR) + MASCOT_CLOCKWISE.length) % MASCOT_CLOCKWISE.length;
        sectorRef.current = newSector;
        const dirName = MASCOT_CLOCKWISE[newSector];
        const dirIdx = MASCOT_DIRECTIONS.indexOf(dirName);
        if (dirIdx >= 0 && spriteRef.current) {
            const pos = getMascotCellPos(dirIdx);
            currentBgPosRef.current = pos;
            spriteRef.current.style.backgroundPosition = pos;
        }
    }, [interactive, scale]);

    useEffect(() => {
        updateHeadRef.current = updateHead;
    }, [updateHead]);

    // Update sprite when character changes
    useEffect(() => {
        if (spriteRef.current && !isReactingRef.current) {
            spriteRef.current.style.backgroundImage = `url("${directionsUrl}")`;
        }
    }, [directionsUrl]);

    // Pointer move listener
    useEffect(() => {
        if (!interactive) return;

        const handlePointerMove = (e) => {
            lastPointerRef.current.x = e.clientX;
            lastPointerRef.current.y = e.clientY;
            if (typeof window !== 'undefined') {
                window.__lyangLastPointer = { x: e.clientX, y: e.clientY };
            }

            if (!rafRef.current) {
                rafRef.current = requestAnimationFrame(updateHead);
            }
        };

        if (typeof window !== 'undefined' && window.__lyangLastPointer) {
            lastPointerRef.current = { ...window.__lyangLastPointer };
            updateHead();
        }

        window.addEventListener('pointermove', handlePointerMove, { passive: true });
        return () => {
            window.removeEventListener('pointermove', handlePointerMove);
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
        };
    }, [interactive, updateHead]);

    useEffect(() => {
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
        };
    }, []);

    const handleClick = (e) => {
        if (interactive && spriteRef.current && reactionsUrl) {
            isReactingRef.current = true;
            const now = Date.now();
            const boops = boopsRef.current;
            boops.count = now - boops.at < 1600 ? boops.count + 1 : 1;
            boops.at = now;

            if (timerRef.current) clearTimeout(timerRef.current);

            spriteRef.current.style.backgroundImage = `url("${reactionsUrl}")`;

            if (boops.count >= 4) {
                // Dizzy state from rapid clicking!
                boops.count = 0;
                spriteRef.current.style.backgroundPosition = getMascotCellPos(7); // 7 = dizzy
                timerRef.current = setTimeout(() => {
                    isReactingRef.current = false;
                    if (spriteRef.current) {
                        spriteRef.current.style.backgroundImage = `url("${directionsUrl}")`;
                        spriteRef.current.style.backgroundPosition = currentBgPosRef.current || '50% 50%';
                        updateHeadRef.current?.();
                    }
                }, 1100);
            } else {
                // Blink then payoff emotion (heart, sparkle, wink, delighted, surprised)
                spriteRef.current.style.backgroundPosition = getMascotCellPos(0); // blink
                timerRef.current = setTimeout(() => {
                    if (!spriteRef.current) return;
                    const payoffs = [1, 2, 4, 8, 3]; // heart, sparkle, wink, delighted, surprised
                    const payoff = payoffs[(boops.count - 1) % payoffs.length];
                    spriteRef.current.style.backgroundPosition = getMascotCellPos(payoff);

                    timerRef.current = setTimeout(() => {
                        isReactingRef.current = false;
                        if (spriteRef.current) {
                            spriteRef.current.style.backgroundImage = `url("${directionsUrl}")`;
                            spriteRef.current.style.backgroundPosition = currentBgPosRef.current || '50% 50%';
                            updateHeadRef.current?.();
                        }
                    }, 480);
                }, 120);
            }
        }

        try {
            const saved = localStorage.getItem('lyang_mascot_config');
            if (saved) {
                const parsed = JSON.parse(saved);
                if (parsed.soundEnabled !== false) playPopSound();
            } else {
                playPopSound();
            }
        } catch (err) {}

        if (onClick) onClick(e);
    };

    return (
        <div
            ref={containerRef}
            onMouseEnter={updateCenter}
            onClick={handleClick}
            title={title || `${currentChar?.name || 'Lí An'} (Chạm để tương tác!)`}
            className={cn(
                "relative overflow-hidden flex items-center justify-center cursor-pointer select-none transition-transform active:scale-95",
                shape === 'circle' ? "rounded-full" : "rounded-2xl",
                size,
                className
            )}
        >
            <div
                ref={spriteRef}
                style={{
                    width: '100%',
                    height: '100%',
                    backgroundImage: `url("${directionsUrl}")`,
                    backgroundSize: '300% 300%',
                    backgroundPosition: currentBgPosRef.current || '50% 50%',
                    backgroundRepeat: 'no-repeat',
                    transform: `scale(${scale})`,
                    transformOrigin: 'center center'
                }}
                className="pointer-events-none select-none transition-transform duration-100 ease-out"
            />
        </div>
    );
});

export default InteractiveMascotAvatar;
