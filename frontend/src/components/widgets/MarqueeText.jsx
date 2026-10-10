import React, { useRef, useLayoutEffect, useEffect, memo } from 'react';

/**
 * MarqueeText - Zero-thrashing, high-performance marquee text.
 * Measures overflow cleanly and updates CSS custom properties directly on the DOM,
 * avoiding double re-render flashes, layout thrashing, and lag during rapid keyboard navigation or hovering.
 */
export const MarqueeText = memo(({
  text,
  className = "",
  style,
  isActive = false,
  active = false,
  onClick,
  onDoubleClick,
  onContextMenu,
  title
}) => {
  const containerRef = useRef(null);
  const textRef = useRef(null);
  const isCurrentlyActive = Boolean(isActive || active);

  // Sync is-active class with DOM directly without triggering component re-render
  useLayoutEffect(() => {
    const el = textRef.current;
    if (!el) return;
    if (isCurrentlyActive) {
      el.classList.add('is-active');
    } else {
      el.classList.remove('is-active');
    }
  }, [isCurrentlyActive]);

  // Measure overflow and set CSS variables directly on DOM
  useEffect(() => {
    const container = containerRef.current;
    const textEl = textRef.current;
    if (!container || !textEl) return;

    const measure = () => {
      if (!container || !textEl) return;
      const containerW = container.clientWidth;
      const textW = textEl.scrollWidth;
      const isOverflow = textW > containerW + 2;

      if (isOverflow) {
        const dist = textW - containerW;
        const duration = Math.max(2.8, Math.min(9, (dist / 30) + 1.8));
        textEl.style.setProperty('--marquee-scroll', `-${dist + 16}px`);
        textEl.style.setProperty('--marquee-duration', `${duration}s`);
        if (!textEl.classList.contains('is-overflowing')) {
          textEl.classList.add('animate-marquee-on-hover', 'is-overflowing');
          textEl.classList.remove('truncate', 'max-w-full');
        }
      } else {
        textEl.style.removeProperty('--marquee-scroll');
        textEl.style.removeProperty('--marquee-duration');
        if (textEl.classList.contains('is-overflowing')) {
          textEl.classList.remove('animate-marquee-on-hover', 'is-overflowing');
          textEl.classList.add('truncate', 'max-w-full');
        }
      }
    };

    measure();

    let ro;
    let rafId = null;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(() => {
        if (rafId) cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(() => {
          measure();
        });
      });
      ro.observe(container);
    }

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      if (ro) ro.disconnect();
    };
  }, [text]);

  return (
    <div
      ref={containerRef}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      onContextMenu={onContextMenu}
      title={title !== undefined ? title : text}
      style={style}
      className={`w-full overflow-hidden whitespace-nowrap relative select-none py-0.5 leading-normal ${className}`}
    >
      <span
        ref={textRef}
        className={`inline-block whitespace-nowrap leading-normal truncate max-w-full ${
          isCurrentlyActive ? 'is-active' : ''
        }`}
      >
        {text}
      </span>
    </div>
  );
});

export default MarqueeText;



