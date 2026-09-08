import React, { useEffect, useState, useRef } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

const hexToRgba = (hex, alpha = 1) => {
  if (!hex || typeof hex !== 'string') return `rgba(16, 185, 129, ${alpha})`;
  let c = hex.trim().replace('#', '');
  if (c.length === 3) {
    c = c.split('').map(x => x + x).join('');
  }
  if (c.length !== 6) return `rgba(16, 185, 129, ${alpha})`;
  const num = parseInt(c, 16);
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const CustomCursor = () => {
  const [isHovering, setIsHovering] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [gpuDisabled, setGpuDisabled] = useState(() => {
    return localStorage.getItem("pos_gpu_disabled") === "true";
  });
  const [cursorDisabled, setCursorDisabled] = useState(() => {
    return localStorage.getItem("pos_cursor_disabled") === "true";
  });
  const [cursorColor, setCursorColor] = useState(() => {
    return localStorage.getItem("pos_cursor_color") || "#10b981";
  });

  const isVisibleRef = useRef(false);

  // Settings listener
  useEffect(() => {
    const checkSettings = () => {
      setGpuDisabled(localStorage.getItem("pos_gpu_disabled") === "true");
      setCursorDisabled(localStorage.getItem("pos_cursor_disabled") === "true");
      setCursorColor(localStorage.getItem("pos_cursor_color") || "#10b981");
    };
    window.addEventListener("gpu_state_changed", checkSettings);
    window.addEventListener("liteThemeChange", checkSettings);
    window.addEventListener("storage", checkSettings);
    window.addEventListener("cursor_color_changed", checkSettings);
    return () => {
      window.removeEventListener("gpu_state_changed", checkSettings);
      window.removeEventListener("liteThemeChange", checkSettings);
      window.removeEventListener("storage", checkSettings);
      window.removeEventListener("cursor_color_changed", checkSettings);
    };
  }, []);

  // Motion values for smooth 144Hz tracking without React re-renders
  const mouseX = useMotionValue(-100);
  const mouseY = useMotionValue(-100);

  // Spring configuration for follower ring (critically damped: zero overshoot, zero jitter)
  const springConfig = { damping: 36, stiffness: 380, mass: 0.2 };
  const followerX = useSpring(mouseX, springConfig);
  const followerY = useSpring(mouseY, springConfig);

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.matchMedia('(pointer: coarse)').matches || window.innerWidth < 1024);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Toggle global class on <html> ONCE per setting change (prevents flickering native cursor)
  useEffect(() => {
    const isLite = window.location.pathname.includes('lite');
    const shouldDisable = isMobile || gpuDisabled || cursorDisabled || isLite;
    
    if (!shouldDisable) {
      document.documentElement.classList.add('custom-cursor-active');
    } else {
      document.documentElement.classList.remove('custom-cursor-active');
    }

    return () => {
      document.documentElement.classList.remove('custom-cursor-active');
    };
  }, [isMobile, gpuDisabled, cursorDisabled]);

  // Mouse movement & hover listener
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isVisibleRef.current) {
        isVisibleRef.current = true;
        setIsVisible(true);
      }
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };

    const handleMouseLeave = () => {
      isVisibleRef.current = false;
      setIsVisible(false);
    };

    const handleMouseEnter = () => {
      isVisibleRef.current = true;
      setIsVisible(true);
    };

    const handleOver = (e) => {
      const target = e.target;
      if (!target || !(target instanceof HTMLElement)) return;

      const isClickable = Boolean(
        target.tagName === 'BUTTON' || 
        target.tagName === 'A' || 
        target.tagName === 'INPUT' ||
        target.tagName === 'SELECT' ||
        target.tagName === 'TEXTAREA' ||
        target.getAttribute('role') === 'button' ||
        target.classList.contains('cursor-pointer') ||
        target.closest('button') || 
        target.closest('a') ||
        target.closest('.cursor-pointer') ||
        target.closest('[role="button"]')
      );
      
      setIsHovering(isClickable);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('mouseleave', handleMouseLeave, { passive: true });
    window.addEventListener('mouseenter', handleMouseEnter, { passive: true });
    window.addEventListener('mouseover', handleOver, { passive: true });

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('mouseenter', handleMouseEnter);
      window.removeEventListener('mouseover', handleOver);
    };
  }, [mouseX, mouseY]);

  const isLite = window.location.pathname.includes('lite');
  if (isMobile || gpuDisabled || cursorDisabled || isLite) return null;

  const followerBorderColor = isHovering ? hexToRgba(cursorColor, 0.75) : hexToRgba(cursorColor, 0.45);
  const followerShadow = isHovering 
    ? `0 0 20px ${hexToRgba(cursorColor, 0.4)}` 
    : `0 0 12px ${hexToRgba(cursorColor, 0.25)}`;

  return (
    <div 
      id="custom-cursor-container" 
      className="pointer-events-none fixed inset-0 z-[999999] select-none transition-opacity duration-200"
      style={{ opacity: isVisible ? 1 : 0 }}
    >
      {/* Follower Ring */}
      <motion.div
        className="cursor-follower pointer-events-none"
        style={{
          left: followerX,
          top: followerY,
          x: "-50%",
          y: "-50%",
          borderColor: followerBorderColor,
          boxShadow: followerShadow,
        }}
        animate={{
          scale: isHovering ? 1.6 : 1,
        }}
        transition={{ type: "spring", stiffness: 350, damping: 25 }}
      />
      
      {/* Core Dot */}
      <motion.div
        className="cursor-dot pointer-events-none flex items-center justify-center rounded-full"
        style={{
          left: mouseX,
          top: mouseY,
          x: "-50%",
          y: "-50%",
          width: 8,
          height: 8,
          backgroundColor: cursorColor,
          boxShadow: `0 0 12px ${hexToRgba(cursorColor, 0.85)}`,
        }}
        animate={{
          scale: isHovering ? 1.6 : 1,
        }}
        transition={{ type: "spring", stiffness: 450, damping: 22 }}
      />
    </div>
  );
};

export default CustomCursor;
