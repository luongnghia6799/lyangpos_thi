import React, { useRef, useState, useEffect, memo } from 'react';

export const MarqueeText = memo(({
  text,
  className = "",
  style,
  isActive = false,
  active = false,
  onClick,
  onDoubleClick,
  title
}) => {
  const containerRef = useRef(null);
  const textRef = useRef(null);
  const [overflowDist, setOverflowDist] = useState(0);
  const isCurrentlyActive = isActive || active;

  useEffect(() => {
    // Only measure overflow when active or hovered to save 99% CPU/GPU layout recalculations
    if (!isCurrentlyActive) {
      if (overflowDist !== 0) setOverflowDist(0);
      return;
    }

    if (containerRef.current && textRef.current) {
      const containerW = containerRef.current.clientWidth;
      const textW = textRef.current.scrollWidth;
      const newDist = textW > containerW + 2 ? textW - containerW : 0;
      if (newDist !== overflowDist) {
        setOverflowDist(newDist);
      }
    }
  }, [text, isCurrentlyActive]);

  const isOverflowing = isCurrentlyActive && overflowDist > 0;
  const duration = Math.max(3, Math.min(10, (overflowDist / 35) + 2));

  return (
    <div
      ref={containerRef}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      title={title || text}
      style={style}
      className={`w-full overflow-hidden whitespace-nowrap relative select-none py-1 leading-normal ${className}`}
    >
      <span
        ref={textRef}
        className={`inline-block whitespace-nowrap leading-normal ${
          isOverflowing ? 'animate-marquee-on-hover is-overflowing is-active' : ''
        }`}
        style={
          isOverflowing
            ? {
                '--marquee-scroll': `-${overflowDist + 14}px`,
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
