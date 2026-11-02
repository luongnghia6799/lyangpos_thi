import React, { useEffect, useRef } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';

export default function SearchTypingOverlay({
    text = '',
    enabled = false,
    inputRef,
    className = '',
    style = {}
}) {
    const containerRef = useRef(null);

    // Keep scroll position synchronized with the underlying input
    useEffect(() => {
        if (!enabled || !inputRef?.current) return;
        const inputEl = inputRef.current;
        const syncScroll = () => {
            if (containerRef.current && inputEl) {
                containerRef.current.scrollLeft = inputEl.scrollLeft;
            }
        };

        inputEl.addEventListener('scroll', syncScroll, { passive: true });
        inputEl.addEventListener('keyup', syncScroll, { passive: true });
        inputEl.addEventListener('keydown', syncScroll, { passive: true });
        inputEl.addEventListener('select', syncScroll, { passive: true });
        inputEl.addEventListener('input', syncScroll, { passive: true });

        // Initial sync
        syncScroll();

        return () => {
            inputEl.removeEventListener('scroll', syncScroll);
            inputEl.removeEventListener('keyup', syncScroll);
            inputEl.removeEventListener('keydown', syncScroll);
            inputEl.removeEventListener('select', syncScroll);
            inputEl.removeEventListener('input', syncScroll);
        };
    }, [enabled, inputRef]);

    if (!enabled || !text) return null;

    return (
        <div
            ref={containerRef}
            className={cn(
                "absolute inset-y-0 flex items-center pointer-events-none select-none overflow-hidden z-20 whitespace-pre",
                className
            )}
            style={{
                scrollbarWidth: 'none',
                ...style
            }}
        >
            <AnimatePresence initial={false}>
                {text.split('').map((char, index) => (
                    <m.span
                        key={`ch-${index}-${char}`}
                        initial={{ opacity: 0, y: 5, scale: 0.6 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={false}
                        transition={{ duration: 0.14, ease: [0.175, 0.885, 0.32, 1.275] }}
                        className="inline-block shrink-0"
                    >
                        {char === ' ' ? '\u00A0' : char}
                    </m.span>
                ))}
            </AnimatePresence>
        </div>
    );
}
