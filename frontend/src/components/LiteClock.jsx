import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const LiteClock = ({ activePath, superSave, color }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const location = useLocation();
  const isActive = location.pathname === activePath;

  useEffect(() => {
    let timer;
    if (isActive) {
      const interval = superSave ? 60000 : 1000;
      timer = setInterval(() => setCurrentTime(new Date()), interval);
    }
    return () => clearInterval(timer);
  }, [isActive, superSave]);

  return (
    <>
      <span className="text-xs font-black font-mono leading-none" style={{ color }}>
        {currentTime.toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
      </span>
      <span className="text-[10px] font-bold opacity-70" style={{ color }}>
        {currentTime.toLocaleDateString("vi-VN", { weekday: 'short', day: '2-digit', month: '2-digit' })}
      </span>
    </>
  );
};

export default React.memo(LiteClock);
