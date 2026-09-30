import React, { useRef, useState, useLayoutEffect, memo } from 'react';

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
  const [overflowDist, setOverflowDist] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const isCurrentlyActive = Boolean(isActive || active || isHovered);

  const measure = () => {
    if (containerRef.current && textRef.current) {
      const containerW = containerRef.current.clientWidth;
      const textW = textRef.current.scrollWidth;
      const dist = textW > containerW + 2 ? textW - containerW : 0;
      setOverflowDist(dist);
    }
  };

  useLayoutEffect(() => {
    measure();
    const el = containerRef.current;
    if (!el) return;

    let ro;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(() => {
        measure();
      });
      ro.observe(el);
      if (textRef.current) ro.observe(textRef.current);
    }

    const timer = setTimeout(measure, 100);

    return () => {
      if (ro) ro.disconnect();
      clearTimeout(timer);
    };
  }, [text]);

  const handleMouseEnter = () => {
    setIsHovered(true);
    measure();
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  const isOverflowing = overflowDist > 0;
  const shouldAnimate = isCurrentlyActive && isOverflowing;
  const duration = Math.max(2.8, Math.min(9, (overflowDist / 30) + 1.8));

  return (
    <div
      ref={containerRef}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      onContextMenu={onContextMenu}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      title={title !== undefined ? title : text}
      style={style}
      className={`w-full overflow-hidden whitespace-nowrap relative select-none py-0.5 leading-normal ${className}`}
    >
      <span
        ref={textRef}
        className={`inline-block whitespace-nowrap leading-normal ${
          shouldAnimate ? 'animate-marquee-on-hover is-overflowing is-active' : ''
        }`}
        style={
          shouldAnimate
            ? {
                '--marquee-scroll': `-${overflowDist + 16}px`,
                '--marquee-duration': `${duration}s`,
              }
            : undefined
        }
      >
        {text}
      </span>
    </div>
  );
});

export default MarqueeText;

