import React, { useState, useEffect, useLayoutEffect, useRef, useCallback } from "react";
import { motion as x } from "framer-motion";
import { Sliders, RotateCcw } from "lucide-react";

/**
 * ResizableDropdownContainer
 * - Auto-animates height smoothly when search results change (Raycast / Spotlight style)
 * - Allows dragging bottom edge, right edge, or corner to resize width & height
 * - Remembers user's custom size preference in localStorage
 * - Double-click or button to reset to default
 */
function ResizableDropdownContainer({
  id,
  storageKey = "pos_product_dropdown_size",
  coords, // { top, left, width } for fixed position, or null for absolute
  defaultWidth = 720,
  defaultMaxHeight = 480,
  className = "",
  style = {},
  scrollRef, // ref attached to scrollable list element for arrow navigation
  children,
  itemCount = 0,
  dropdownKey = "resizable-dropdown",
}) {
  // Load saved dimensions
  const [customSize, setCustomSize] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          width: typeof parsed.width === "number" ? parsed.width : defaultWidth,
          maxHeight: typeof parsed.maxHeight === "number" ? parsed.maxHeight : defaultMaxHeight,
        };
      }
    } catch {
      // fallback
    }
    return {
      width: defaultWidth,
      maxHeight: defaultMaxHeight,
    };
  });

  const [isDragging, setIsDragging] = useState(false);
  const [dragDirection, setDragDirection] = useState(null);

  // Compute effective width constrained to screen bounds
  const getEffectiveWidth = useCallback(() => {
    const screenMaxW =
      typeof window !== "undefined"
        ? window.innerWidth - (coords?.left || 0) - 16
        : defaultWidth;
    const baseW = coords?.width ? Math.max(coords.width, customSize.width) : customSize.width;
    return Math.min(baseW, Math.max(screenMaxW, 480));
  }, [coords?.left, coords?.width, customSize.width, defaultWidth]);

  // Handle Drag to Resize
  const startDrag = useCallback(
    (e, direction) => {
      e.preventDefault();
      e.stopPropagation();

      const startX = e.clientX;
      const startY = e.clientY;
      const initialW = getEffectiveWidth();
      const initialH = customSize.maxHeight;

      setIsDragging(true);
      setDragDirection(direction);

      document.body.style.userSelect = "none";
      if (direction === "both") document.body.style.cursor = "nwse-resize";
      else if (direction === "height") document.body.style.cursor = "ns-resize";
      else if (direction === "width") document.body.style.cursor = "ew-resize";

      let latestW = initialW;
      let latestH = initialH;

      const onPointerMove = (ev) => {
        ev.preventDefault();
        const deltaX = ev.clientX - startX;
        const deltaY = ev.clientY - startY;

        if (direction === "both" || direction === "width") {
          const minW = 480;
          const maxW = Math.max(window.innerWidth - (coords?.left || 0) - 16, 500);
          latestW = Math.min(Math.max(initialW + deltaX, minW), maxW);
        }

        if (direction === "both" || direction === "height") {
          const minH = 160;
          const maxH = Math.max(window.innerHeight - (coords?.top || 0) - 30, 200);
          latestH = Math.min(Math.max(initialH + deltaY, minH), maxH);
        }

        setCustomSize({
          width: Math.round(latestW),
          maxHeight: Math.round(latestH),
        });
      };

      const onPointerUp = () => {
        setIsDragging(false);
        setDragDirection(null);
        document.body.style.userSelect = "";
        document.body.style.cursor = "";
        window.removeEventListener("pointermove", onPointerMove);
        window.removeEventListener("pointerup", onPointerUp);

        try {
          localStorage.setItem(
            storageKey,
            JSON.stringify({
              width: Math.round(latestW),
              maxHeight: Math.round(latestH),
            })
          );
        } catch (err) {
          console.warn("Could not save dropdown size preference", err);
        }
      };

      window.addEventListener("pointermove", onPointerMove);
      window.addEventListener("pointerup", onPointerUp);
    },
    [coords?.left, coords?.top, customSize.maxHeight, getEffectiveWidth, storageKey]
  );

  // Reset to default dimensions
  const resetSize = useCallback(
    (type = "both") => {
      setCustomSize((prev) => {
        const next = {
          width: type === "height" ? prev.width : defaultWidth,
          maxHeight: type === "width" ? prev.maxHeight : defaultMaxHeight,
        };
        try {
          localStorage.setItem(storageKey, JSON.stringify(next));
        } catch {
          // ignore
        }
        return next;
      });
    },
    [defaultWidth, defaultMaxHeight, storageKey]
  );

  const effectiveWidth = getEffectiveWidth();
  const isCustomized =
    customSize.width !== defaultWidth || customSize.maxHeight !== defaultMaxHeight;

  const isFixed = Boolean(coords);

  return (
    <x.div
      id={id}
      initial={{ opacity: 0, y: 6, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 4, scale: 0.98 }}
      transition={{ duration: 0.12, ease: "easeOut" }}
      className={`${
        isFixed ? "fixed" : "absolute top-full left-0 mt-2"
      } frosted-glass !z-[400000] rounded-2xl overflow-hidden flex flex-col ${className}`}
      style={{
        ...(isFixed
          ? {
              top: coords.top,
              left: coords.left,
            }
          : {}),
        width: effectiveWidth,
        ...style,
      }}
    >
      {/* Right Edge Resize Handle */}
      <div
        onPointerDown={(e) => startDrag(e, "width")}
        onDoubleClick={() => resetSize("width")}
        className="absolute top-0 right-0 w-2 h-full cursor-ew-resize hover:bg-[#8b6f47]/20 dark:hover:bg-[#d4a574]/20 transition-colors z-30"
        title="Kéo mép phải để đổi chiều rộng (Nhấp đúp để đặt lại)"
      />

      {/* Scrollable list container - lightweight, instant height, zero layout lag */}
      <div
        ref={scrollRef}
        className="overflow-y-auto overscroll-contain no-scrollbar flex-1"
        style={{
          maxHeight: customSize.maxHeight,
        }}
      >
        {children}
      </div>

      {/* Sleek Minimal Bottom Handle Bar */}
      <div className="relative shrink-0 h-4 border-t border-black/5 dark:border-white/5 bg-black/[0.015] dark:bg-white/[0.015] flex items-center justify-between px-2.5 select-none transition-colors">
        {/* Left: subtle reset button when customized */}
        <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-400 dark:text-slate-500">
          {isCustomized && (
            <button
              onClick={() => resetSize("both")}
              type="button"
              className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[8.5px] font-black uppercase tracking-wider bg-[#8b6f47]/10 dark:bg-white/10 hover:bg-[#8b6f47] dark:hover:bg-[#d4a574] hover:text-white text-[#8b6f47] dark:text-[#d4a574] transition-all cursor-pointer"
              title="Đặt lại kích thước mặc định"
            >
              <RotateCcw size={8} />
              <span>Đặt lại</span>
            </button>
          )}
        </div>

        {/* Center: bottom handle pill for height resize */}
        <div
          onPointerDown={(e) => startDrag(e, "height")}
          onDoubleClick={() => resetSize("height")}
          className="group/handle py-1.5 px-6 cursor-ns-resize flex items-center justify-center -my-1"
          title="Kéo để chỉnh chiều cao (Nhấp đúp để đặt lại)"
        >
          <div className="w-10 h-1 rounded-full bg-slate-300 dark:bg-slate-700 group-hover/handle:bg-[#8b6f47] dark:group-hover/handle:bg-[#d4a574] group-hover/handle:scale-y-125 transition-all" />
        </div>

        {/* Right: Corner diagonal grip for simultaneous width + height resize */}
        <div
          onPointerDown={(e) => startDrag(e, "both")}
          onDoubleClick={() => resetSize("both")}
          className="group/corner -mr-1 p-1 cursor-nwse-resize text-slate-400 dark:text-slate-600 hover:text-[#8b6f47] dark:hover:text-[#d4a574] transition-colors flex items-center justify-center"
          title="Kéo góc để chỉnh rộng + cao (Nhấp đúp để đặt lại)"
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            className="opacity-60 group-hover/corner:opacity-100 group-hover/corner:scale-110 transition-all"
          >
            <path
              d="M10 2L2 10M10 6L6 10M10 10L10 10.01"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </svg>
        </div>
      </div>

      {/* Floating Dimension Badge while dragging */}
      {isDragging && (
        <div className="absolute top-3 right-4 z-40 pointer-events-none flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/85 dark:bg-black/95 text-white font-mono text-xs font-black shadow-2xl border border-white/20 backdrop-blur-md animate-in fade-in zoom-in-95 duration-100 select-none">
          <Sliders size={12} className="text-[#d4a574]" />
          <span>
            {Math.round(effectiveWidth)} × {Math.round(customSize.maxHeight)} px
          </span>
        </div>
      )}
    </x.div>
  );
}

export default React.memo(ResizableDropdownContainer);
