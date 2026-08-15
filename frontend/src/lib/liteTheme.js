function hexToHsl(hex) {
  hex = hex.replace(/^#/, '');
  if (hex.length === 3) {
    hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  }
  let r = parseInt(hex.substring(0, 2), 16) / 255;
  let g = parseInt(hex.substring(2, 4), 16) / 255;
  let b = parseInt(hex.substring(4, 6), 16) / 255;

  let max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;

  if (max === min) {
    h = s = 0;
  } else {
    let d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100)
  };
}

export function getLiteTheme(bgColor) {
  if (bgColor === "#050505") { // Dark
    return {
      bg: "#12151c",
      surface: "#1b1e2a",
      inputBg: "#1e2230",
      subSurface: "#141722",
      border: "#272c3d",
      text: "#e2e8f0",
      muted: "#94a3b8",
      accent: "#10b981",
      activeBg: "#1f2a3a",
      isDark: true
    };
  } else if (bgColor === "#e8f5e9") { // Tea Green Light (Sage)
    return {
      bg: "#e2eed5",
      surface: "#d4e2c7",
      inputBg: "#c5d6b8",
      subSurface: "#dcebd0",
      border: "#b6cca8",
      text: "#1a3520",
      muted: "#4d6351",
      accent: "#1c4722",
      activeBg: "#cbdcb5",
      isDark: false
    };
  } else if (bgColor === "#f4ecd8") { // Paper Cream
    return {
      bg: "#faf8f3",
      surface: "#f1ede2",
      inputBg: "#ebdcb7",
      subSurface: "#f5f1e8",
      border: "#dfd7c5",
      text: "#2c2e3b",
      muted: "#64748b",
      accent: "#1b4d3e",
      activeBg: "#e4dac5",
      isDark: false
    };
  } else {
    // Dynamic Custom Theme Color Generator
    try {
      const { h, s, l } = hexToHsl(bgColor);
      const isDarkColor = l < 50;
      if (isDarkColor) {
        return {
          bg: `hsl(${h}, ${s}%, ${Math.max(5, l - 5)}%)`,
          surface: `hsl(${h}, ${Math.max(10, s - 5)}%, ${l + 5}%)`,
          inputBg: `hsl(${h}, ${Math.max(10, s - 5)}%, ${l + 10}%)`,
          subSurface: `hsl(${h}, ${Math.max(10, s - 5)}%, ${l}%)`,
          border: `hsl(${h}, ${Math.max(10, s - 10)}%, ${l + 15}%)`,
          text: `hsl(${h}, 10%, 90%)`,
          muted: `hsl(${h}, 10%, 70%)`,
          accent: `hsl(${h}, ${Math.min(100, s + 20)}%, 50%)`,
          activeBg: `hsl(${h}, ${s}%, ${l + 12}%)`,
          isDark: true
        };
      } else {
        return {
          bg: `hsl(${h}, ${s}%, ${Math.min(98, l + 5)}%)`,
          surface: `hsl(${h}, ${s}%, ${Math.max(10, l - 6)}%)`,
          inputBg: `hsl(${h}, ${Math.max(10, s - 5)}%, ${Math.max(5, l - 15)}%)`,
          subSurface: `hsl(${h}, ${s}%, ${Math.min(97, l + 2)}%)`,
          border: `hsl(${h}, ${Math.max(5, s - 10)}%, ${Math.max(5, l - 20)}%)`,
          text: `hsl(${h}, 20%, 12%)`,
          muted: `hsl(${h}, 15%, 35%)`,
          accent: `hsl(${h}, ${Math.min(100, s + 10)}%, ${Math.max(15, l - 40)}%)`,
          activeBg: `hsl(${h}, ${s}%, ${Math.max(10, l - 12)}%)`,
          isDark: false
        };
      }
    } catch (e) {
      return {
        bg: "#faf8f3",
        surface: "#f1ede2",
        inputBg: "#ebdcb7",
        subSurface: "#f5f1e8",
        border: "#dfd7c5",
        text: "#2c2e3b",
        muted: "#64748b",
        accent: "#1b4d3e",
        activeBg: "#e4dac5",
        isDark: false
      };
    }
  }
}
