import React, { useState, useEffect } from 'react';

const AppWallpaper = () => {
  const [wallpaper, setWallpaper] = useState(() => {
    const saved = localStorage.getItem("pos_cart_wallpaper");
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    const handleStorageChange = () => {
      const saved = localStorage.getItem("pos_cart_wallpaper");
      setWallpaper(saved ? JSON.parse(saved) : null);
    };

    window.addEventListener("app_wallpaper_changed", handleStorageChange);
    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("app_wallpaper_changed", handleStorageChange);
      window.removeEventListener("storage", handleStorageChange);
      document.documentElement.classList.remove("has-wallpaper");
    };
  }, []);

  useEffect(() => {
    if (wallpaper?.image) {
      document.documentElement.classList.add("has-wallpaper");
      
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        canvas.width = 50; canvas.height = 50;
        ctx.drawImage(img, 0, 0, 50, 50);
        try {
          const data = ctx.getImageData(0, 0, 50, 50).data;
          let r = 0, g = 0, b = 0;
          for (let i = 0; i < data.length; i += 4) {
            r += data[i]; g += data[i + 1]; b += data[i + 2];
          }
          const count = data.length / 4;
          const brightness = Math.round(((r / count) * 299 + (g / count) * 587 + (b / count) * 114) / 1000);
          
          if (brightness < 128) {
            document.documentElement.classList.add("wallpaper-dark");
            document.documentElement.classList.remove("wallpaper-light");
          } else {
            document.documentElement.classList.add("wallpaper-light");
            document.documentElement.classList.remove("wallpaper-dark");
          }
        } catch (e) {
          console.warn("Could not calculate wallpaper brightness", e);
        }
      };
      img.src = wallpaper.image;
    } else {
      document.documentElement.classList.remove("has-wallpaper");
      document.documentElement.classList.remove("wallpaper-dark");
      document.documentElement.classList.remove("wallpaper-light");
    }
  }, [wallpaper?.image]);

  if (!wallpaper?.image) return null;

  return (
    <>
      <div
        className="fixed inset-0 pointer-events-none transition-all duration-300"
        style={{
          zIndex: -10, // Ensure it's behind everything but visible
          backgroundImage: `url(${wallpaper.image})`,
          backgroundSize: wallpaper.size || 'cover',
          backgroundPosition: wallpaper.position || 'center',
          backgroundRepeat: 'no-repeat',
          opacity: (wallpaper.opacity ?? 100) / 100,
          filter: `blur(${wallpaper.blur || 0}px)`,
          transform: wallpaper.blur ? 'scale(1.1)' : 'none'
        }}
      />
      {/* Glass Overlay */}
      <div
        className="fixed inset-0 pointer-events-none transition-all duration-300"
        style={{
          zIndex: -9,
          backdropFilter: `blur(${wallpaper.glassBlur !== undefined ? wallpaper.glassBlur : 10}px)`,
          WebkitBackdropFilter: `blur(${wallpaper.glassBlur !== undefined ? wallpaper.glassBlur : 10}px)`,
          backgroundColor: `color-mix(in srgb, var(--bg-color) ${wallpaper.glassOpacity !== undefined ? wallpaper.glassOpacity : 20}%, transparent)`
        }}
      />
      {/* Dark Overlay for Dark Mode */}
      <div
        className="fixed inset-0 pointer-events-none transition-opacity duration-300 bg-black/50 opacity-0 dark:opacity-100"
        style={{
          zIndex: -8
        }}
      />
    </>
  );
};

export default AppWallpaper;
