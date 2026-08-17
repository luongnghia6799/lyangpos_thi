import React, { useRef, useState, useEffect } from 'react';

export const MarqueeText = ({
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

  useEffect(() => {
    const checkOverflow = () => {
      if (containerRef.current && textRef.current) {
        const containerW = containerRef.current.clientWidth;
        const textW = textRef.current.scrollWidth;
        if (textW > containerW + 1) {
          setOverflowDist(textW - containerW);
        } else {
          setOverflowDist(0);
        }
      }
    };

    checkOverflow();
    
    let ro;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(checkOverflow);
      if (containerRef.current) ro.observe(containerRef.current);
      if (textRef.current) ro.observe(textRef.current);
    } else {
      window.addEventListener('resize', checkOverflow);
    }

    return () => {
      if (ro) ro.disconnect();
      else window.removeEventListener('resize', checkOverflow);
    };
  }, [text]);

  const isOverflowing = overflowDist > 0;
  const isCurrentlyActive = isActive || active;
  // Dynamic duration based on overflow length
  const duration = Math.max(3, Math.min(12, (overflowDist / 35) + 2));

  return (
    <div
      ref={containerRef}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      title={title || text}
      style={style}
      className={`w-full overflow-hidden whitespace-nowrap relative select-none ${className}`}
    >
      <span
        ref={textRef}
        className={`inline-block whitespace-nowrap ${
          isOverflowing ? 'animate-marquee-on-hover is-overflowing' : ''
        } ${isCurrentlyActive && isOverflowing ? 'is-active' : ''}`}
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
};

export default MarqueeText;
