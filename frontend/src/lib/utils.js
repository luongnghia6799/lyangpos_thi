import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import axios from "axios"

export function cn(...inputs) {
    return twMerge(clsx(inputs))
}

export const removeAccents = (str) => {
    if (!str) return '';
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D');
};

export const formatCurrency = (value) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
}

export const formatNumber = (value) => {
    if (value === undefined || value === null || isNaN(value)) return "0";
    return new Intl.NumberFormat('en-US').format(value);
}

export const formatDebt = (debt) => {
    if (debt === undefined || debt === null || debt === 0) return "0";
    return (debt > 0 ? "+" : "") + formatNumber(debt);
}

export const isNearExpiry = (dateStr, days = 60) => {
    if (!dateStr || dateStr === '...') return false;
    try {
        let expiryDate;
        if (dateStr.includes('/')) {
            const parts = dateStr.split('/');
            if (parts.length !== 3) return false;
            expiryDate = new Date(parts[2], parts[1] - 1, parts[0]);
        } else if (dateStr.includes('-')) {
            // YYYY-MM-DD
            expiryDate = new Date(dateStr);
        } else {
            return false;
        }

        const today = new Date();
        // Reset hours
        today.setHours(0, 0, 0, 0);

        const diffTime = expiryDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays >= 0 && diffDays <= days;
    } catch (e) {
        return false;
    }
}

export const isExpired = (dateStr) => {
    if (!dateStr || dateStr === '...') return false;
    try {
        let expiryDate;
        if (dateStr.includes('/')) {
            const parts = dateStr.split('/');
            if (parts.length !== 3) return false;
            expiryDate = new Date(parts[2], parts[1] - 1, parts[0]);
        } else if (dateStr.includes('-')) {
            // YYYY-MM-DD
            expiryDate = new Date(dateStr);
        } else {
            return false;
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return expiryDate < today;
    } catch (e) {
        return false;
    }
}

export const getLocalDateString = (dateInput = new Date()) => {
    if (!dateInput) return '';
    try {
        const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
        if (isNaN(date.getTime())) return '';
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    } catch (e) {
        return '';
    }
};

export const formatDate = (dateInput) => {
    if (!dateInput) return '-';
    try {
        const date = new Date(dateInput);
        if (isNaN(date.getTime())) return '-';

        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');

        return `${hours}:${minutes}:${seconds} ${day}/${month}/${year}`;
    } catch (e) {
        return '-';
    }
}
export const normalizeUOM = (uom) => {
    if (!uom || typeof uom !== 'string') return uom;

    // 1. Trim & Lowercase
    const clean = uom.trim().toLowerCase();
    if (!clean) return '';

    // 2. Mapping table (Sync with BRIEF)
    const UOM_MAP = {
        'kg': 'Kg', 'ki': 'Kg', 'kilogram': 'Kg', 'kilo': 'Kg',
        'l': 'Lít', 'lit': 'Lít',
        'm': 'Mét', 'met': 'Mét',
        'cai': 'Cái', 'chiec': 'Cái',
        'thung': 'Thg', 'thg': 'Thg',
        'hop': 'Hộp',
        'chai': 'Chai', 'lo': 'Chai',
        'goi': 'Gói',
        'vien': 'Viên', 'vi': 'Vỉ',
        'tui': 'Túi',
        'cuon': 'Cuộn'
    };


    const noAccent = removeAccents(clean);

    // 4. Look up in map (original or no accent)
    if (UOM_MAP[clean]) return UOM_MAP[clean];
    if (UOM_MAP[noAccent]) return UOM_MAP[noAccent];

    // 5. Default: Capitalize first letter
    return clean.charAt(0).toUpperCase() + clean.slice(1);
};

export const UOM_PRIORITY = {
    'bao': 100, 'bành': 100, 'phuy': 100, 'phi': 100,
    'xô': 90,
    'thùng': 80, 'thg': 80, 'can': 80, 'két': 80,
    'tấm': 70, 'cuộn': 70,
    'túi': 60, 'bịch': 60, 'bó': 60,
    'bình': 50,
    'chai': 40, 'hũ': 40, 'lọ': 30, 'hộp': 30,
    'tip': 20, 'tuýp': 20, 'viên': 20,
    'gói': 10, 'cái': 10, 'chiếc': 10, 'vỉ': 10
};

export const getUomPriority = (uom) => {
    if (!uom) return 0;
    const clean = removeAccents(uom.toLowerCase().trim());
    return UOM_PRIORITY[clean] || 0;
};

export const smartSortItems = (items) => {
    if (!items || !Array.isArray(items)) return items;
    return [...items].sort((a, b) => {
        const uomA = a.unit || a.product_unit;
        const uomB = b.unit || b.product_unit;
        const priorityA = getUomPriority(uomA);
        const priorityB = getUomPriority(uomB);
        if (priorityA !== priorityB) {
            return priorityB - priorityA; // Descending
        }
        return (a.product_name || a.name || '').localeCompare(b.product_name || b.name || '', 'vi');
    });
};

export const playSuccessSound = () => {
  console.log("[Sound Debug] playSuccessSound called");
  if (localStorage.getItem('pos_lite_sounds_muted') === 'true') return;
    if (localStorage.getItem('pos_notifications_muted') === 'true') return;
    try {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (!AudioContextClass) return;
        const ctx = new AudioContextClass();

        const playTone = (freq, time, duration, volume = 0.3) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, time);

            gain.gain.setValueAtTime(0, time);
            gain.gain.linearRampToValueAtTime(volume, time + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

            osc.start(time);
            osc.stop(time + duration);
        };

        const now = ctx.currentTime;
        // Increased volume for warmer triad
        playTone(523.25, now, 0.6, 0.25);      // C5
        playTone(659.25, now + 0.15, 0.6, 0.2);  // E5
        playTone(783.99, now + 0.3, 0.8, 0.18);  // G5
    } catch (e) { console.error("Audio success sound failed", e); }
};

export const playTickSound = () => {
  console.log("[Sound Debug] playTickSound called");
  if (localStorage.getItem('pos_lite_sounds_muted') === 'true') return;
    if (localStorage.getItem('pos_notifications_muted') === 'true') return;
    try {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (!AudioContextClass) return;
        const ctx = new AudioContextClass();

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(400, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.03);

        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.002); // Increased from 0.05
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.03);

        osc.start();
        osc.stop(ctx.currentTime + 0.03);
    } catch (e) { }
};

export const playPopSound = () => {
  console.log("[Sound Debug] playPopSound called");
  if (localStorage.getItem('pos_lite_sounds_muted') === 'true') return;
    if (localStorage.getItem('pos_notifications_muted') === 'true') return;
    try {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (!AudioContextClass) return;
        const ctx = new AudioContextClass();

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.type = 'sine';
        osc.frequency.setValueAtTime(300, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.08);

        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.25, ctx.currentTime + 0.01); // Increased from 0.08
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);

        osc.start();
        osc.stop(ctx.currentTime + 0.08);
    } catch (e) { }
};

export const playNotificationSound = () => {
  console.log("[Sound Debug] playNotificationSound called");
  if (localStorage.getItem('pos_lite_sounds_muted') === 'true') return;
    if (localStorage.getItem('pos_notifications_muted') === 'true') return;
    try {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (!AudioContextClass) return;
        const ctx = new AudioContextClass();

        const playTone = (freq, time, duration, volume = 0.3) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, time);
            gain.gain.setValueAtTime(0, time);
            gain.gain.linearRampToValueAtTime(volume, time + 0.03);
            gain.gain.exponentialRampToValueAtTime(0.001, time + duration);
            osc.start(time);
            osc.stop(time + duration);
        };

        const now = ctx.currentTime;
        // Louder "Ding-Dong"
        playTone(440.00, now, 0.6, 0.3);      // A4 (Ding)
        playTone(349.23, now + 0.4, 1.0, 0.25); // F4 (Dong)
    } catch (e) { }
};

export const playErrorSound = () => {
  console.log("[Sound Debug] playErrorSound called");
  if (localStorage.getItem('pos_lite_sounds_muted') === 'true') return;
    if (localStorage.getItem('pos_notifications_muted') === 'true') return;
    try {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (!AudioContextClass) return;
        const ctx = new AudioContextClass();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);

        // Low 'donk' sound
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.15);

        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);

        osc.start();
        osc.stop(ctx.currentTime + 0.15);
    } catch (e) { }
};

export const playTabSound = () => {
  console.log("[Sound Debug] playTabSound called");
  if (localStorage.getItem('pos_lite_sounds_muted') === 'true') return;
    if (localStorage.getItem('pos_notifications_muted') === 'true') return;
    try {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (!AudioContextClass) return;
        const ctx = new AudioContextClass();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);

        // Slightly lower frequency (1000 instead of 1500) and higher volume (0.3)
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1000, ctx.currentTime);

        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.002);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);

        osc.start();
        osc.stop(ctx.currentTime + 0.05);
    } catch (e) { }
};

// Simple in-memory cache for audio buffers to achieve 0ms TTS delay via Web Audio API
const ttsAudioCache = {};
let audioCtx = null;

const getAudioContext = () => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
};

// Play an AudioBuffer via Web Audio API for zero latency
const playAudioBuffer = (audioBuffer, rate) => {
  try {
    const ctx = getAudioContext();
    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;
    source.playbackRate.value = rate;
    source.connect(ctx.destination);
    source.start(0);
    return source;
  } catch (e) {
    console.error("playAudioBuffer failed", e);
    return null;
  }
};

const CACHE_NAME = 'lyang-tts-audio-cache-v1';

const loadAndCacheAudio = async (audioUrl, cacheKey, priority = 'auto') => {
  try {
    // For low-priority background precaching, write directly to disk cache
    // and skip memory-heavy decoding to prevent RAM ballooning when AudioContext resumes
    if (priority === 'low') {
      if (typeof caches !== 'undefined') {
        try {
          const cache = await caches.open(CACHE_NAME);
          const cachedResponse = await cache.match(audioUrl);
          if (cachedResponse) {
            return null;
          }
          const resAxios = await axios.get(audioUrl, { responseType: 'arraybuffer' });
          const responseObj = new Response(resAxios.data, {
            headers: { 'Content-Type': 'audio/mpeg' }
          });
          await cache.put(audioUrl, responseObj);
        } catch (err) {
          console.warn("Low-priority Cache API write failed:", err);
        }
      }
      return null;
    }

    if (ttsAudioCache[cacheKey]) {
      return ttsAudioCache[cacheKey];
    }
    
    const loadPromise = (async () => {
      let arrayBuffer = null;
      let cachedResponse = null;

      // 1. Try to read from browser's Cache API first
      if (typeof caches !== 'undefined') {
        try {
          const cache = await caches.open(CACHE_NAME);
          cachedResponse = await cache.match(audioUrl);
        } catch (err) {
          console.warn("Cache API matching failed:", err);
        }
      }

      if (cachedResponse) {
        arrayBuffer = await cachedResponse.arrayBuffer();
      } else {
        // 2. If not in Cache API, fetch from backend via Axios (bypasses Tauri CORS/Mixed Content)
        const resAxios = await axios.get(audioUrl, { responseType: 'arraybuffer' });
        arrayBuffer = resAxios.data;
        
        // Save to browser cache for future page loads
        if (typeof caches !== 'undefined') {
          try {
            const cache = await caches.open(CACHE_NAME);
            const responseObj = new Response(arrayBuffer, {
              headers: { 'Content-Type': 'audio/mpeg' }
            });
            await cache.put(audioUrl, responseObj);
          } catch (err) {
            console.warn("Cache API writing failed:", err);
          }
        }
      }

      if (!arrayBuffer || arrayBuffer.byteLength < 100) {
        return null;
      }

      const ctx = getAudioContext();
      const audioBuffer = await ctx.decodeAudioData(arrayBuffer.slice(0));
      ttsAudioCache[cacheKey] = audioBuffer;
      return audioBuffer;
    })();
    
    ttsAudioCache[cacheKey] = loadPromise;
    return await loadPromise;
  } catch (e) {
    console.error("loadAndCacheAudio failed", e);
    delete ttsAudioCache[cacheKey];
    return null;
  }
};

const getDynamicBaseUrl = () => {
  let baseUrl = axios.defaults.baseURL || 'http://localhost:3579';
  if (baseUrl.includes('localhost') && typeof window !== 'undefined' && window.location && window.location.hostname && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1' && !window.location.hostname.includes('tauri')) {
    baseUrl = baseUrl.replace('localhost', window.location.hostname);
  }
  return baseUrl;
};

export const numberToViText = (numIn) => {
  let n = Math.round(numIn);
  const units = ["", "một", "hai", "ba", "bốn", "năm", "sáu", "bảy", "tám", "chín"];
  if (n === 0) return "không";
  if (n < 0) return "âm " + numberToViText(Math.abs(n));
  
  let text = "";
  if (n >= 1000000000) {
    text += numberToViText(Math.floor(n / 1000000000)) + " tỷ ";
    n %= 1000000000;
  }
  if (n >= 1000000) {
    text += numberToViText(Math.floor(n / 1000000)) + " triệu ";
    n %= 1000000;
  }
  if (n >= 1000) {
    text += numberToViText(Math.floor(n / 1000)) + " nghìn ";
    n %= 1000;
  }
  if (n >= 100) {
    text += units[Math.floor(n / 100)] + " trăm ";
    n %= 100;
    if (n > 0 && n < 10) {
      text += "lẻ ";
    }
  }
  if (n >= 10) {
    const ten = Math.floor(n / 10);
    const unit = n % 10;
    if (ten === 1) {
      text += "mười ";
    } else {
      text += units[ten] + " mươi ";
    }
    if (unit === 1) {
      text += ten === 1 ? "một" : "mốt";
    } else if (unit === 5) {
      text += "lăm";
    } else if (unit > 0) {
      text += units[unit];
    }
  } else if (n > 0) {
    text += units[n];
  }
  return text.trim();
};

export const precacheCommonTTS = (products = []) => {
  try {
    const rate = parseFloat(localStorage.getItem("pos_speech_rate") || "1.4");
    const selectedVoiceName = localStorage.getItem("pos_selected_voice") || "edge-vi-female";
    if (selectedVoiceName !== "google" && !selectedVoiceName.startsWith("edge")) {
      return;
    }
    const baseUrl = getDynamicBaseUrl();
    let voiceParam = 'google';
    if (selectedVoiceName === 'edge-vi-female' || selectedVoiceName === 'edge-vi-male') {
      voiceParam = selectedVoiceName;
    }
    
    // 1. Basic numbers 1-1000 and thank you text
    const textsToPrecache = [];
    for (let i = 1; i <= 1000; i++) {
      textsToPrecache.push(numberToViText(i));
    }
    
    const thankYouText = localStorage.getItem("pos_tts_thankyou_template") || "Cảm ơn quý khách đã chọn Sáu Quý";
    textsToPrecache.push(thankYouText);

    // 2. Pre-cache alias + quantities (1 to 10, and round tens like 20, 30, 40, 50) for products with alias, and the raw alias itself
    if (products && Array.isArray(products)) {
      const activeWithAlias = products
        .filter(p => p.alias && p.alias.trim());
      
      activeWithAlias.forEach(p => {
        const aliasText = p.alias.trim();
        textsToPrecache.push(aliasText);
        // Quantities 1 to 10
        for (let q = 1; q <= 10; q++) {
          textsToPrecache.push(`${aliasText}, ${q}`);
        }
        // Round tens from 20 to 50
        for (let q = 20; q <= 50; q += 10) {
          textsToPrecache.push(`${aliasText}, ${q}`);
        }
      });
    }

    // Helper to dispatch progress events
    const dispatchProgress = (completed, total, active) => {
      if (typeof window !== 'undefined') {
        window.ttsPrecacheProgress = { completed, total, active };
        window.dispatchEvent(new CustomEvent('tts-precache-progress', { 
          detail: { completed, total, active } 
        }));
      }
    };

    // 3. Queue audio requests with concurrency limit to avoid clogging browser/WebView2 connections
    let index = 0;
    let completedCount = 0;
    const totalCount = textsToPrecache.length;
    const maxConcurrency = 3;

    dispatchProgress(0, totalCount, true);

    const loadNext = async () => {
      if (index >= totalCount) {
        if (completedCount >= totalCount) {
          dispatchProgress(completedCount, totalCount, false);
        }
        return;
      }
      
      const text = textsToPrecache[index++];
      const cacheKey = `${voiceParam}_${rate}_${text}`;
      
      if (ttsAudioCache[cacheKey]) {
        completedCount++;
        dispatchProgress(completedCount, totalCount, true);
        loadNext();
        return;
      }
      
      const audioUrl = `${baseUrl.replace(/\/+$/, '')}/api/tts?text=${encodeURIComponent(text)}&voice=${voiceParam}`;
      try {
        await loadAndCacheAudio(audioUrl, cacheKey, 'low');
      } catch (err) {
        console.error("Failed to load/decode audio for precaching:", text, err);
      }
      
      completedCount++;
      dispatchProgress(completedCount, totalCount, true);
      
      if (completedCount >= totalCount) {
        dispatchProgress(completedCount, totalCount, false);
      } else {
        // Small stagger to let browser rest
        setTimeout(loadNext, 30);
      }
    };

    // Run initial batch
    for (let i = 0; i < Math.min(maxConcurrency, totalCount); i++) {
      loadNext();
    }
  } catch (e) {
    console.error("Precache TTS failed", e);
  }
};

export const checkMissingTTSCache = (products = []) => {
  return { missingCount: 0, totalNeeded: 0, details: [] };
};

export const precacheAmounts = (totalAmount, partnerName = "") => {
  try {
    const rate = parseFloat(localStorage.getItem("pos_speech_rate") || "1.4");
    const selectedVoiceName = localStorage.getItem("pos_selected_voice") || "edge-vi-female";
    if (selectedVoiceName !== "google" && !selectedVoiceName.startsWith("edge")) {
      return;
    }
    const baseUrl = getDynamicBaseUrl();
    let voiceParam = 'google';
    if (selectedVoiceName === 'edge-vi-female' || selectedVoiceName === 'edge-vi-male') {
      voiceParam = selectedVoiceName;
    }

    // Clean up old dynamic entries in ttsAudioCache to prevent memory leak (RAM overflow)
    Object.keys(ttsAudioCache).forEach(key => {
      if (key.includes("số tiền của") || key.includes("số tiền cần chuyển khoản")) {
        delete ttsAudioCache[key];
      }
    });

    const cleanPartner = (partnerName || "").trim();
    const isRealPartner = cleanPartner && 
                         cleanPartner.toLowerCase() !== "khách lẻ" && 
                         cleanPartner.toLowerCase() !== "khách vãng lai" && 
                         cleanPartner.toLowerCase() !== "ncc vãng lai";
    const partnerDisplay = isRealPartner ? cleanPartner : "";

    const textsToCache = [];

    // A. Total Amount Text
    const disablePartnerTemplate = localStorage.getItem("pos_tts_disable_partner_template") === "true";
    const finalPartnerDisplay = disablePartnerTemplate ? "" : partnerDisplay;
    const totalTemplate = finalPartnerDisplay
      ? (localStorage.getItem("pos_tts_currency_partner_template") || "số tiền của {partner} là {amount} đồng")
      : (localStorage.getItem("pos_tts_currency_template") || "số tiền của quý khách là {amount} đồng");
    const totalViText = totalTemplate
      .replace("{amount}", numberToViText(totalAmount))
      .replace(/{partner}/gi, finalPartnerDisplay || "quý khách")
      .replace(/{customer}/gi, finalPartnerDisplay || "quý khách");
    textsToCache.push(totalViText);

    // B. F7 Transfer Amount Text
    const step1 = totalAmount / 1.05;
    const step2 = Math.floor(step1 / 100) * 100;
    const finalAmount = step2 * 1.05;

    const disablePartnerTransfer = localStorage.getItem("pos_tts_disable_partner_transfer") === "true";
    const finalPartnerDisplayTransfer = disablePartnerTransfer ? "" : partnerDisplay;
    const transferTemplate = finalPartnerDisplayTransfer
      ? (localStorage.getItem("pos_tts_transfer_partner_template") || "số tiền cần chuyển khoản của {partner} là {amount} đồng")
      : (localStorage.getItem("pos_tts_transfer_template") || "số tiền cần chuyển khoản là {amount} đồng");
    const transferViText = transferTemplate
      .replace("{amount}", numberToViText(finalAmount))
      .replace(/{partner}/gi, finalPartnerDisplayTransfer || "quý khách")
      .replace(/{customer}/gi, finalPartnerDisplayTransfer || "quý khách");
    textsToCache.push(transferViText);

    textsToCache.forEach(text => {
      const cacheKey = `${voiceParam}_${rate}_${text}`;
      if (!ttsAudioCache[cacheKey]) {
        const audioUrl = `${baseUrl.replace(/\/+$/, '')}/api/tts?text=${encodeURIComponent(text)}&voice=${voiceParam}`;
        loadAndCacheAudio(audioUrl, cacheKey, 'high');
      }
    });

  } catch (e) {
    console.error("Precache amounts TTS failed", e);
  }
};

let lastSpokenText = "";
let lastSpokenTime = 0;

export const speakNumber = (num, isCurrency = false, partnerName = "", customTemplate = "") => {
  console.trace("speakNumber trace");
  if (localStorage.getItem('pos_lite_sounds_muted') === 'true') return;
  if (localStorage.getItem('pos_notifications_muted') === 'true') return;
  try {
    console.log("speakNumber invoked:", { num, isCurrency, partnerName, customTemplate, pos_tts_mode: localStorage.getItem("pos_tts_mode") });
    // Clean partner name: ignore defaults like "Khách lẻ"
    const cleanPartner = (partnerName || "").trim();
    const isRealPartner = cleanPartner && 
                         cleanPartner.toLowerCase() !== "khách lẻ" && 
                         cleanPartner.toLowerCase() !== "khách vãng lai" && 
                         cleanPartner.toLowerCase() !== "ncc vãng lai";
    const partnerDisplay = isRealPartner ? cleanPartner : "";

    let viText = "";
    if (typeof num === "string" && isNaN(Number(num))) {
      viText = num;
      if (partnerDisplay) {
        if (viText.includes("{partner}")) {
          viText = viText.replace(/{partner}/gi, partnerDisplay);
        } else if (viText.includes("{customer}")) {
          viText = viText.replace(/{customer}/gi, partnerDisplay);
        } else {
          viText = viText.replace(/quý khách/gi, partnerDisplay);
        }
      } else {
        viText = viText.replace(/\{partner\}/g, "quý khách").replace(/\{customer\}/g, "quý khách");
      }
    } else {
      viText = numberToViText(num);
      if (isCurrency) {
        const disablePartnerTemplate = localStorage.getItem("pos_tts_disable_partner_template") === "true";
        const finalPartnerDisplay = disablePartnerTemplate ? "" : partnerDisplay;
        const template = customTemplate
          ? customTemplate
          : (finalPartnerDisplay
              ? (localStorage.getItem("pos_tts_currency_partner_template") || "số tiền của {partner} là {amount} đồng")
              : (localStorage.getItem("pos_tts_currency_template") || "số tiền của quý khách là {amount} đồng"));
          
        viText = template
          .replace("{amount}", viText)
          .replace(/{partner}/gi, finalPartnerDisplay || "quý khách")
          .replace(/{customer}/gi, finalPartnerDisplay || "quý khách");
      }
    }

    const now = Date.now();
    if (viText === lastSpokenText && now - lastSpokenTime < 500) {
      return;
    }
    lastSpokenText = viText;
    lastSpokenTime = now;

    const rate = parseFloat(localStorage.getItem("pos_speech_rate") || "1.4");
    const selectedVoiceName = localStorage.getItem("pos_selected_voice") || "edge-vi-female";

    const baseUrl = getDynamicBaseUrl();
    let voiceParam = 'google';
    if (selectedVoiceName === 'edge-vi-female' || selectedVoiceName === 'edge-vi-male') {
      voiceParam = selectedVoiceName;
    }
    
    const cacheKey = `${voiceParam}_${rate}_${viText}`;
    const audioUrl = `${baseUrl.replace(/\/+$/, '')}/api/tts?text=${encodeURIComponent(viText)}&voice=${voiceParam}`;

    const playWithTraditionalAudio = async () => {
      try {
        const resBlob = await axios.get(audioUrl, { responseType: 'blob' });
        const blobUrl = URL.createObjectURL(resBlob.data);
        const audio = new Audio(blobUrl);
        audio.playbackRate = rate;
        audio.onended = () => URL.revokeObjectURL(blobUrl);
        audio.play().catch(err => {
          console.error("Local backend TTS play failed...", err);
          URL.revokeObjectURL(blobUrl);
        });
      } catch (err) {
        console.error("Traditional Audio playback failed:", err);
      }
    };

    const cached = ttsAudioCache[cacheKey];
    if (cached) {
      if (cached instanceof Promise) {
        cached.then(buffer => {
          if (buffer) {
            playAudioBuffer(buffer, rate);
          } else {
            playWithTraditionalAudio();
          }
        }).catch(() => {
          playWithTraditionalAudio();
        });
      } else {
        playAudioBuffer(cached, rate);
      }
    } else {
      loadAndCacheAudio(audioUrl, cacheKey, 'high').then(buffer => {
        if (buffer) {
          playAudioBuffer(buffer, rate);
        } else {
          playWithTraditionalAudio();
        }
      }).catch(() => {
        playWithTraditionalAudio();
      });
    }

  } catch (e) {
    console.error("Speech synthesis failed", e);
  }
};
