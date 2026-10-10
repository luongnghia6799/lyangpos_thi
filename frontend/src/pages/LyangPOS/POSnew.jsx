import React, { useState, useEffect, useRef, useMemo, useCallback, useLayoutEffect, forwardRef } from "react";
const i = React;
import axios from "axios";
const M = axios;
const Vn = axios;
import { useQueryClient } from "@tanstack/react-query";
const zl = useQueryClient;
const ci = useQueryClient;
import { useLocation } from "react-router-dom";
const Il = useLocation;
const bd = useLocation;
import toast from "react-hot-toast";
const Ve = toast;
const At = toast;
import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { motion as x, useMotionValue as In, useSpring as Dn, MotionConfig as ro, AnimatePresence as Ws } from "framer-motion";
const P = Ws;
const fd = ro;
import { 
  ReceiptText as ReceiptTextIcon, FileText as FileTextIcon, Copy as Pn, Trash2 as so, User as Qn, X as Xn, 
  Phone as Jn, MapPin as Yn, Plus as Zn, ChevronRight as no, FileText as ei, Pause as io, ChevronLeft as lo, 
  Users as oo, History as ti, Menu as co, Bot as En, Eye as po, Tv as qr, Volume2 as la, ShoppingCart as uo, 
  Bell as mo, PanelRight as xo, PanelBottom as ho, TrendingUp as bo, Satellite as go, Coins as Rs, Zap as fo, 
  Search as yo, PackageX as vo, TriangleAlert as As, Package as ko, RefreshCcw as wo, RotateCcw as jo, 
  TrendingDown as _o, CircleAlert as No, Droplets as Co, Check as Os, Sparkles as Es, Activity as So, 
  Sprout as To, Wallet as zo, Truck as Io, Banknote as Do, CreditCard as Po, ArrowLeftRight as Eo, 
  ArrowRight as qo, ShoppingBag as Mo, Save as Wo, Printer as Ro, Clock as Ao, LoaderCircle as ai, 
  Leaf as ri, BookOpen as Oo, ReceiptText as Lo, BadgePercent as $o, HandCoins as Ho, RotateCw as Ko, 
  Minus as Go, VolumeX as Uo, Camera as Bo, Calendar as Fo, CircleCheck as Vo, PackageSearch as Qo, 
  ExternalLink as Xo, EyeOff as Jo, Bone as Yo, Settings as SetIcon, MessageSquareQuote as MsgQuote, 
  Music as MuIcon, Radio as RadioIcon, Keyboard as KeybIcon, Sliders as SlidersIcon, Palette,
  ChevronDown, Upload as UploadIcon
} from "lucide-react";
import CartColorCustomizerModal, { 
  DEFAULT_CART_COLOR_CONFIG, 
  getCartBoxShadow, 
  getCartOverlayStyle,
  getCartTextPillStyle,
  getCartTextShadowStyle,
  getBubbleComputedStyle,
  getButtonComputedStyle,
  getBubbleBadgeStyle,
  compressImageForWatermark
} from "../../components/modals/CartColorCustomizerModal";
import DynamicIcon from "../../components/widgets/DynamicIcon";
import ResizableDropdownContainer from "../../components/widgets/ResizableDropdownContainer";
import CartTableRow from "../../components/pos/CartTableRow";
import SoundVoiceSettingsModal from "../../components/modals/SoundVoiceSettingsModal";
import MascotWatermarkCustomizer from "../../components/widgets/MascotWatermarkCustomizer";
import AIScanInvoiceModal from "../../components/modals/AIScanInvoiceModal";
import POSPrintPreviewModal from "../../components/modals/POSPrintPreviewModal";
import QuickProductCreateModal from "../../components/modals/QuickProductCreateModal";
import PackingDisplayModeModal from "../../components/modals/PackingDisplayModeModal";
import ProductSearchItem from "../../components/pos/ProductSearchItem";
import PartnerSearchItem from "../../components/pos/PartnerSearchItem";
import POSSummaryPanel from "../../components/pos/POSSummaryPanel";

// Lucide icon & UI component aliases used across POS
const Comp_fd = ro;
const Comp_ke = Xn;
const Comp_ai = ai;
const Comp_pa = so;
const Comp_ei = ei;
const Comp_jt = io;
const Comp_qs = lo;
const Comp_jd = oo;
const Comp_co = co;
const Comp_la = la;
const Comp_uo = uo;
const Comp_mo = mo;
const Comp_xo = xo;
const Comp_ho = ho;
const Comp_da = As;
const Comp_ca = ko;
const Comp_oa = wo;
const Comp_ti = jo;
const Comp_qo = qo;
const Comp_ri = ri;
const Comp_ua = ti;
const Comp_pi = zo;
const Comp_ui = Go;
const Comp_u_t = Io;
const Comp_u_d = FileTextIcon;

const Ir = Qn;
const Gs = yo;
const En_Icon = En;
const As_Icon = As;
const Zn_Icon = Zn;
const Bo_Icon = Bo;
const Es_Icon = Es;
const Ao_Icon = Ao;
const Xn_Icon = Xn;

const TvMonitorIcon = qr;
const SatelliteIcon = go;
const Ln = qr;
const Ot = Zn;
const Dr = no;
const $s = po;
const On = Jo;
const Ja = Ao;
const Hs = Oo;
const Ks = Lo;
const Va = zo;
const yd = Yo;
const Qa = ko;
const _t = Io;
const vd = Fo;
const zr = Vo;
const Us = Yn;
const Mr = Jn;
const kd = Qo;
const wd = Xo;
const Xa = wo;
const Nd = fo;
const Pr = vo;
const Ms = jo;
const $n = _o;
const Cd = No;
const Sd = Co;
const Hn = Os;
const Kn = So;
const Gn = To;
const ca = ei;
const Un = ai;
const Er = Wo;
const Fa = Ro;
const Td = $o;
const Bn = Eo;
const zd = ri;
const Id = Ho;
const Dd = Ko;
const ua = ti;
const oa = Rs;
const Rn = async v => await v();
const Ts = async v => await v();
const An = ProductEditModal;
const Wn = PartnerEditModal;
const Pd = PartnerHistoryModal;

import { DEFAULT_SETTINGS as Gl, DEFAULT_SETTINGS as Tr } from "@/lib/settings";
import { ensureFontLoaded } from "@/lib/googleFonts";
import PrintTemplate from "@/components/panels/PrintTemplate";
const Ul = PrintTemplate;
const Mn = PrintTemplate;
import PartnerEditModal from "@/components/modals/PartnerEditModal";
const Fl = PartnerEditModal;
import PartnerInfoHoverCard from "@/components/widgets/PartnerInfoHoverCard";
const Vl = PartnerInfoHoverCard;
import HeavyClock from "@/components/widgets/HeavyClock";
const Ql = HeavyClock;
import DailyOrderHistoryModal from "@/components/modals/DailyOrderHistoryModal";
const Xl = DailyOrderHistoryModal;
import OrderDatePickerModal from "@/components/modals/OrderDatePickerModal";
import OrderEditPopup from "@/components/modals/OrderEditPopup";
const OrderEditModal = OrderEditPopup;
import QuickDebtModal from "@/components/modals/QuickDebtModal";
const Jl = QuickDebtModal;
import QuickVoucherModal from "@/components/modals/QuickVoucherModal";
const Yl = QuickVoucherModal;
import QuickAuditPopout from "@/components/modals/QuickAuditPopout";
const Zl = QuickAuditPopout;
import OrderNoteModal from "@/components/modals/OrderNoteModal";
import OrderNotePopup from "@/components/widgets/OrderNotePopup";
import ShippingInfoPopup from "@/components/widgets/ShippingInfoPopup";
import CustomSelect from "@/components/forms/CustomSelect";
const zn = CustomSelect;
import MarqueeText from "@/components/widgets/MarqueeText";
const Ps = MarqueeText;
import ActiveIngredientTooltip from "@/components/widgets/ActiveIngredientTooltipContent";
import ActionContextMenu from "@/components/widgets/ActionContextMenu";

import { useProductData as eo, usePartnerData as to, useShippingSummary as ao } from "@/queries/useProductData";
const od = eo;
const dd = to;
const cd = ao;
import { 
  cn as c, formatNumber as z, formatCurrency as lt, formatDate as ot, removeAccents as xt, 
  speakNumber as ht, speakAudioSequence, stopAllTTS, precacheAmounts as yl, precacheCommonTTS as Ss, 
  cancelPrecacheCommonTTS, clearTTSAudioCache,
  normalizeUOM as Ae, smartSortItems as Tn, formatDebt as vl, playSuccessSound as Is, 
  playErrorSound as Sl, playPopSound as Ds, playTabSound as zs, playTypingSound as playTypingSoundUtil, 
  playAddToCartSound, formatRelativePurchaseDate 
} from "@/lib/utils";
import Portal from "@/components/widgets/Portal";
const Fn = Portal;
const Ee = Portal;
import CustomDatePicker from "@/components/forms/CustomDatePicker";
import POSHistoryPanel from "@/components/panels/POSHistoryPanel";
import PartnerHistoryModal from "@/components/modals/PartnerHistoryModal";
import ProductEditModal from "@/components/modals/ProductEditModal";
import Toast from "@/components/widgets/Toast";
const jl = Toast;
import ConfirmModal from "@/components/modals/ConfirmModal";
const Cl = ConfirmModal;
import QuickEditModal from "@/components/modals/QuickEditModal";
const Nl = QuickEditModal;
import logo from "@/assets/logo.png";
const kl = logo;
const _l = () => null;

// Modal & dialog aliases used across POS
const Comp_td = jl;
const Comp_ed = _l;
const Comp_nd = Jl;
const Comp_id = Yl;
const Comp_ad = _l;
const Comp_rd = Nl;
const Comp_sd = Cl;
const Comp_ld = Zl;
import ShippingPanel from "@/components/panels/ShippingPanel";
const Comp_ac = ShippingPanel;
const Comp_zn = zn;

const Ls = (v, N) => {
    let C = M.defaults.baseURL || "http://localhost:3579";
    const rate = localStorage.getItem("pos_speech_rate") || "1";
    const pitch = localStorage.getItem("pos_speech_pitch") || "0";
    return C.includes("localhost") && typeof window < "u" && window.location && window.location.hostname && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1" && !window.location.hostname.includes("tauri") && (C = C.replace("localhost", window.location.hostname)), `${C.replace(/\/+$/, "")}/api/tts?text=${encodeURIComponent(v)}&voice=${N}&rate=${rate}&pitch=${encodeURIComponent(pitch)}`;
  },
  qn = async (v, N, repeatCount = null, forceStart = false) => {
    if (!v || v.length === 0) return;

    if (!forceStart && window.currentPackingQueue) {
      window.currentPackingQueue.stop();
      return;
    }

    if (window.currentPackingQueue) {
      window.currentPackingQueue.stop();
    }

    let totalLoops = 1;
    if (repeatCount !== null && repeatCount !== undefined) {
      totalLoops = (repeatCount === "Infinity" || repeatCount === "loop" || repeatCount === Infinity)
        ? Infinity
        : Math.max(1, parseInt(repeatCount, 10) || 1);
    } else {
      const stored = localStorage.getItem("pos_packing_repeat_count");
      totalLoops = (stored === "Infinity" || stored === "loop")
        ? Infinity
        : Math.max(1, parseInt(stored, 10) || 1);
    }

    let isStopped = false;
    window.currentPackingQueue = {
      stop: () => {
        isStopped = true;
        stopAllTTS();
        window.currentPackingQueue = null;
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("pos_packing_tts_status", {
            detail: { isPlaying: false, currentLoop: 0, totalLoops }
          }));
        }
      }
    };

    const S = localStorage.getItem("pos_tts_cart_speech_order") || "name_first";
    const itemGap = parseFloat(localStorage.getItem("pos_speech_gap") || "150");

    let loop = 0;
    while (!isStopped && loop < totalLoops) {
      loop++;
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("pos_packing_tts_status", {
          detail: { isPlaying: true, currentLoop: loop, totalLoops }
        }));
      }

      if (loop > 1) {
        await new Promise(res => setTimeout(res, 1200));
        if (isStopped) break;
      }

      await speakAudioSequence(["Soạn hàng"]);
      if (isStopped) break;
      await new Promise(res => setTimeout(res, Math.max(100, itemGap)));

      for (let i = 0; i < v.length; i++) {
        if (isStopped) break;
        const B = v[i];
        const ue = B.quantity || 0;
        const Ie = N.find(Le => Le.id === B.product_id) || B;
        const dt = (Ie && Ie.alias && Ie.alias.trim()) || (B.alias && B.alias.trim()) || B.product_name;

        const tokens = [];
        if (S === "qty_first") {
          if (ue) tokens.push(ue);
          if (dt) tokens.push(dt);
        } else {
          if (dt) tokens.push(dt);
          if (ue) tokens.push(ue);
        }

        await speakAudioSequence(tokens);
        if (isStopped) break;
        await new Promise(res => setTimeout(res, Math.max(150, itemGap * 1.5)));
      }
    }

    if (!isStopped) {
      window.currentPackingQueue = null;
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("pos_packing_tts_status", {
          detail: { isPlaying: false, currentLoop: 0, totalLoops }
        }));
      }
    }
  };

// Isolated component for TTS Precache progress & actions to prevent re-rendering the whole 6300-line POS page
const TTSPrecacheSection = ({ products, onPrecache, onPrecacheQuick, onCancel, onClearCache, IconLa, IconUo, IconSo }) => {
  const [status, setStatus] = React.useState(() => {
    return (typeof window !== 'undefined' && window.ttsPrecacheProgress) || { completed: 0, total: 0, active: false, currentText: "" };
  });

  React.useEffect(() => {
    const handleProgress = (e) => {
      if (e.detail) {
        setStatus(e.detail);
      }
    };
    window.addEventListener('tts-precache-progress', handleProgress);
    return () => window.removeEventListener('tts-precache-progress', handleProgress);
  }, []);

  return (
    <div className="space-y-3 bg-[#fbf8f2] dark:bg-[#0a1f16]/60 p-4 rounded-2xl border border-[#8b6f47]/20 dark:border-emerald-500/20">
      <div className="flex justify-between items-center text-xs font-black">
        <span className="uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
          <IconLa size={16} strokeWidth={2.5} className="text-[#8b6f47] dark:text-emerald-400" />
          <span>Tải sẵn âm thanh Offline vĩnh viễn (Precache)</span>
        </span>
        <span className="px-2 py-0.5 rounded-lg bg-[#8b6f47]/15 dark:bg-emerald-500/15 text-[#8b6f47] dark:text-emerald-300 font-mono font-black text-[10px]">
          {status.active ? "ĐANG TẢI VỀ..." : "LƯU TRÊN Ổ ĐĨA"}
        </span>
      </div>

      <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-bold">
        Tải trước toàn bộ số đếm (1 - 1000), tên sản phẩm và câu thông báo vào bộ nhớ đệm để đọc tức thì 0ms, không độ trễ ngay cả khi không có mạng.
      </p>

      {/* Progress Bar if downloading */}
      {status.active && (
        <div className="space-y-1.5 p-3 rounded-xl bg-white dark:bg-[#06140e] border border-[#8b6f47]/20 dark:border-white/10 shadow-xs">
          <div className="flex justify-between items-center text-[11px] font-black">
            <span className="text-[#8b6f47] dark:text-emerald-400 truncate max-w-[250px]">
              Đang tải: "{status.currentText || 'Đang nạp...'}"
            </span>
            <span className="font-mono text-slate-600 dark:text-slate-300">
              {status.completed} / {status.total} ({Math.round((status.completed / (status.total || 1)) * 100)}%)
            </span>
          </div>
          <div className="w-full h-2.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#8b6f47] to-[#b38f5d] dark:from-emerald-600 dark:to-teal-500 rounded-full transition-all duration-150"
              style={{
                width: `${Math.round((status.completed / (status.total || 1)) * 100)}%`
              }}
            />
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 pt-1">
        {status.active ? (
          <button
            type="button"
            onClick={onCancel}
            className="w-full py-2.5 px-3 rounded-xl text-xs font-black bg-rose-500 hover:bg-rose-600 text-white uppercase tracking-wider transition-all cursor-pointer shadow-xs active:scale-98 flex items-center justify-center gap-1.5"
          >
            <IconUo size={14} /><span>Dừng tải trước</span>
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={() => onPrecache(products)}
              className="flex-1 py-2.5 px-3 rounded-xl text-xs font-black bg-[#8b6f47] dark:bg-emerald-600 hover:opacity-90 text-white uppercase tracking-wider transition-all cursor-pointer shadow-xs active:scale-98 flex items-center justify-center gap-1.5"
            >
              <IconLa size={14} /><span>Tải trước (1-1000 & SP)</span>
            </button>
            <button
              type="button"
              onClick={() => onPrecacheQuick(products, { limitNumbers: 100 })}
              className="py-2.5 px-3 rounded-xl text-xs font-black bg-white dark:bg-[#06140e] border border-[#8b6f47]/20 dark:border-white/10 hover:border-[#8b6f47] dark:hover:border-emerald-500 text-slate-700 dark:text-slate-300 uppercase tracking-wider transition-all cursor-pointer shadow-xs active:scale-98 flex items-center justify-center gap-1.5"
              title="Tải nhanh 100 số đầu tiên & mặt hàng"
            >
              <span>Tải nhanh (1-100)</span>
            </button>
            <button
              type="button"
              onClick={async () => {
                if (window.confirm("Bạn có chắc chắn muốn xóa toàn bộ bộ nhớ đệm âm thanh trên ổ đĩa và trình duyệt để tải lại từ đầu?")) {
                  await onClearCache();
                }
              }}
              className="py-2.5 px-3 rounded-xl text-xs font-black bg-rose-500/10 hover:bg-rose-500 text-rose-600 hover:text-white border border-rose-500/20 transition-all cursor-pointer shadow-xs active:scale-98 flex items-center justify-center gap-1.5"
              title="Xóa toàn bộ cache âm thanh trên ổ đĩa để tải lại mới"
            >
              <IconSo size={14} /><span>Xóa cache</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
};

function POSPage({
  onToggleTheme: v,
  currentTheme: N
}) {
  const [C, X] = i.useState(!1),
    [xe, W] = i.useState(!1),
    [pe, we] = i.useState([]),
    [Oe, Qe] = i.useState(!1),
    [te, at] = i.useState(""),
    B = new Set(["co", "thuoc", "phan", "bon", "sau", "ray", "benh", "duong", "chai", "goi", "can", "xit", "tri", "giet", "diet", "tru", "hop", "thung", "bao", "kg", "gr", "g", "ml", "l", "lit", "x", "loai", "hieu", "syngenta", "hop tri", "basf"]),
    ue = t => xt(String(t || "")).toLowerCase().trim(),
    je = t => {
      if (!t) return {
        clean: "",
        tokens: new Set(),
        codes: new Set(),
        volumes: new Set(),
        npk: null,
        coreWords: []
      };
      let a = ue(t),
        r = null;
      const s = a.match(/\b(\d{1,2})[\-.](\d{1,2})[\-.](\d{1,2})\b/);
      s && (r = `${s[1]}-${s[2]}-${s[3]}`, a = a.replace(s[0], " ")), a = a.replace(/\bx\s*\d+\b/gi, " ");
      const n = new Set(),
        l = /\b(\d+(?:\.\d+)?)\s*(ml|l|lit|kg|gr|g|cc)\b/g;
      let d;
      for (; (d = l.exec(a)) !== null;) {
        let b = d[2] === "lit" ? "l" : d[2] === "gr" ? "g" : d[2];
        n.add(`${d[1]}${b}`);
      }
      const o = a.split(/[\s\-_,./+*()[\]{}]+/).filter(Boolean),
        u = new Set(),
        h = [];
      return o.forEach(b => {
        /^[a-z]+\d+[a-z]*$/i.test(b) || /^\d+[a-z]+$/i.test(b) ? /^\d+(ml|l|lit|kg|gr|g|cc)$/i.test(b) ? n.add(b.toLowerCase()) : u.add(b.toLowerCase()) : b.length > 1 && !B.has(b) && !/^\d+$/.test(b) && h.push(b.toLowerCase());
      }), {
        clean: ue(t),
        tokens: new Set(o),
        codes: u,
        volumes: n,
        npk: r,
        coreWords: h
      };
    },
    Ie = (t, a) => {
      if (t === a) return !0;
      if (t.length >= 3 && a.length >= 3) {
        if (t.includes(a) || a.includes(t)) return !0;
        const r = Math.min(t.length, a.length);
        if (Math.max(t.length, a.length) - r <= 2) {
          let n = 0;
          for (; n < r && t[n] === a[n];) n++;
          if (n >= 4 || r <= 4 && n >= 3) return !0;
        }
      }
      return !1;
    },
    dt = (t, a) => {
      if (!a) return 0;
      const r = a.name || "",
        s = a.alias || "",
        n = a.code || "",
        l = `${r} ${s} ${n}`,
        d = je(l);
      if (t.clean === d.clean || t.clean === ue(r)) return 20;
      let o = 0,
        u = !1;
      if (t.npk && d.npk) {
        if (t.npk === d.npk) o += 6, u = !0;else return 0;
      } else t.npk && !d.npk && (o -= 2);
      let h = 0;
      if (t.coreWords.forEach(w => {
        d.coreWords.some(U => Ie(w, U)) && (h += 1);
      }), h > 0 ? (o += h * 3.5, u = !0) : d.coreWords.length > 0 && t.coreWords.length > 0 && (o -= 2), !u) return 0;
      t.codes.forEach(w => {
        d.codes.has(w) ? o += 3 : d.codes.size > 0 && (o -= 1);
      }), t.volumes.forEach(w => {
        d.volumes.has(w) ? o += 2 : d.volumes.size > 0 && (o -= 1);
      });
      let b = 0;
      t.tokens.forEach(w => {
        d.tokens.has(w) && (b += 1);
      }), b > 0 && (o += b / Math.max(t.tokens.size, d.tokens.size) * 1.5);
      const S = ue(r);
      return (t.clean.includes(S) || S.includes(t.clean)) && (o += 2), Math.max(0, o);
    },
    Le = (t, a) => {
      if (!t || !a || a.length === 0) return null;
      const r = je(t);
      let s = null,
        n = 0;
      for (const l of a) {
        const d = dt(r, l);
        d > n && (n = d, s = l);
      }
      return n >= 0.5 ? s : null;
    },
    Nt = t => {
      const a = Array.from(t.target.files || []);
      if (a.length === 0) return;
      const r = a.map(s => new Promise(n => {
        const l = new FileReader();
        l.onloadend = () => n(l.result), l.readAsDataURL(s);
      }));
      Promise.all(r).then(s => {
        we(n => [...n, ...s]);
      });
    },
    Lt = async () => {
      if (pe.length !== 0) {
        Qe(!0);
        try {
          const t = await M.post("/api/purchase/scan-invoice", {
            images: pe,
            api_key: te || J?.gemini_api_key || ""
          });
          te && te !== J?.gemini_api_key && (await M.post("/api/settings", {
            gemini_api_key: te
          }), Na(s => ({
            ...s,
            gemini_api_key: te
          })));
          const a = t.data || [];
          if (a.length === 0) {
            G({
              message: "Không phát hiện được sản phẩm nào trong hóa đơn.",
              type: "error"
            });
            return;
          }
          const r = [...y];
          a.forEach(s => {
            const n = Le(s.product_name, T),
              l = Math.max(1, parseFloat(s.quantity) || 1);
            if (n) {
              const d = (s.unit || "").trim().toLowerCase(),
                o = (n.unit || "").trim().toLowerCase(),
                u = (n.secondary_unit || "").trim().toLowerCase();
              let h = l,
                b = l / (n.multiplier || 1);
              u && d && (d === u || d.includes(u) || u.includes(d)) && (h = l * (n.multiplier || 1), b = l);
              let S = 0;
              const hasCustomPrice = Boolean(p && p.id && R && R[n.id] !== void 0);
              const w = hasCustomPrice ? R[n.id] : void 0,
                U = (Te || localStorage.getItem("unified_pos_mode") || "Retail") === "Wholesale" ? n.bulk_price || n.sale_price || 0 : n.sale_price || 0;
              w !== void 0 ? S = w : n.bulk_quantity > 0 && h >= n.bulk_quantity && n.bulk_price ? S = n.bulk_price : S = U, S <= 0 && s.price && parseFloat(s.price) > 0 && (S = parseFloat(s.price));
              const L = r.findIndex(ce => ce.product_id === n.id && ce.price === S);
              L > -1 ? (r[L].quantity += h, r[L].secondary_qty = r[L].quantity / (n.multiplier || 1)) : r.push({
                cartId: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                product_id: n.id,
                product_name: n.name,
                unit: n.unit,
                secondary_unit: n.secondary_unit,
                multiplier: n.multiplier || 1,
                price: S,
                quantity: h,
                secondary_qty: b,
                cost_price: n.cost_price,
                latest_cost_price: n.latest_cost_price,
                stock: n.stock,
                is_combo: n.is_combo,
                active_ingredient: n.active_ingredient,
                latest_audit: n.latest_audit,
                latest_stock_entry: n.latest_stock_entry,
                ai_scanned: !0,
                ai_original_name: s.product_name,
                ai_matched_status: "matched"
              });
            } else {
              const d = s.price && parseFloat(s.price) > 0 ? parseFloat(s.price) : 0;
              r.push({
                cartId: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                product_id: null,
                product_name: s.product_name,
                unit: s.unit || "Cái",
                secondary_unit: null,
                multiplier: 1,
                price: d,
                quantity: l,
                secondary_qty: l,
                cost_price: 0,
                latest_cost_price: 0,
                stock: 0,
                is_combo: !1,
                active_ingredient: null,
                ai_scanned: !0,
                ai_original_name: s.product_name,
                ai_matched_status: "unmatched"
              });
            }
          }), H(r), X(!1), we([]), Is?.(), G({
            message: `Quét AI thành công! Đã thêm ${a.length} sản phẩm vào giỏ hàng.`,
            type: "success"
          });
        } catch (t) {
          console.error(t), G({
            message: t.response?.data?.error || "Có lỗi xảy ra khi quét hóa đơn.",
            type: "error"
          });
        } finally {
          Qe(!1);
        }
      }
    },
    {
      data: he,
      isLoading: $t
    } = od(),
    {
      data: _e,
      isLoading: Xe
    } = dd(),
    {
      data: j
    } = cd(),
    E = ci(),
    D = j?.total || 0,
    isAccountingFeatureEnabled = localStorage.getItem("feature_accounting_enabled") !== "false",
    T = Array.isArray(he) ? he : (Array.isArray(he?.items) ? he.items : (Array.isArray(he?.products) ? he.products : [])),
    Y = Array.isArray(_e) ? _e : (Array.isArray(_e?.items) ? _e.items : (Array.isArray(_e?.partners) ? _e.partners : [])),
    be = (t, a) => {
      const r = localStorage.getItem("pos_order_tabs"),
        s = localStorage.getItem("pos_active_tab_id");
      if (r && s) try {
        const n = JSON.parse(r),
          l = JSON.parse(s),
          d = n.find(o => o.id === l);
        if (d && d[t] !== void 0) return d[t];
      } catch {}
      return a;
    },
    [Z, ae] = i.useState(""),
    [bt, rt] = i.useState(!0),
    [gt, Ht] = i.useState("add"),
    [fe, _] = i.useState(() => {
      const t = localStorage.getItem("pos_order_tabs");
      if (t) try {
        return JSON.parse(t);
      } catch (a) {
        console.error("Failed to parse saved POS tabs:", a);
      }
      return [{
        id: 1,
        name: "Đơn 1",
        cart: [],
        selectedPartner: null,
        note: "",
        amountPaid: 0,
        cashGiven: 0,
        paymentMethod: (localStorage.getItem("unified_pos_mode") || "Retail") === "Wholesale" ? "Debt" : "Cash"
      }];
    }),
    [g, f] = i.useState(() => {
      const t = localStorage.getItem("pos_active_tab_id");
      return t ? JSON.parse(t) : 1;
    }),
    [ne, me] = i.useState(() => {
      const t = localStorage.getItem("pos_pinned_scan_tab_id");
      return t ? JSON.parse(t) : 1;
    }),
    qe = i.useRef(""),
    ma = i.useRef(0),
    A = i.useRef(null),
    ie = i.useRef({}),
    [y, H] = i.useState(() => be("cart", [])),
    [Je, rc] = i.useState(() => {
      const t = {
          color1: "#ffffff",
          color2: "#f8fafc",
          opacity: 0.8,
          isGradient: !0,
          blur: 20,
          radius: 2.5,
          shadow: 20,
          accent: "#10b981",
          headerColor: "#ffffff",
          headerOpacity: 0.4,
          bgColor1: "#ecfdf5",
          bgColor2: "#f0fdf4",
          dropdownBg: "#ffffff",
          dropdownAccent: "#10b981"
        },
        a = localStorage.getItem("pos_new_style");
      if (!a) return t;
      try {
        const r = JSON.parse(a);
        return {
          ...t,
          ...r
        };
      } catch {
        return t;
      }
    }),
    [sc, nc] = i.useState(!1);
  i.useRef(null);
  const Wr = i.useRef(null),
    Rr = i.useRef(null),
    [ic, lc] = i.useState("themes"),
    [hi, Bs] = i.useState([]),
    [Ya, oc] = i.useState(() => localStorage.getItem("pos_gpu_disabled") === "true"),
    [ft, bi] = i.useState(() => localStorage.getItem("pos_tts_mode") || "female"),
    [Za, gi] = i.useState(() => localStorage.getItem("pos_tts_read_product") !== "false"),
    [er, fi] = i.useState(() => localStorage.getItem("pos_tts_read_qty") !== "false"),
    [xa, yi] = i.useState(() => localStorage.getItem("pos_tts_read_total") !== "false"),
    [ha, vi] = i.useState(() => localStorage.getItem("pos_tts_read_thanks") !== "false"),
    tr = () => {
      stopAllTTS();
    },
    Ar = t => {
      bi(t);
      localStorage.setItem("pos_tts_mode", t);
      tr();
      if (t === "female") {
        Fs("edge-vi-female");
        localStorage.setItem("pos_selected_voice", "edge-vi-female");
      } else if (t === "male") {
        Fs("edge-vi-male");
        localStorage.setItem("pos_selected_voice", "edge-vi-male");
      }
      setTimeout(() => Ss(T), 50);
    },
    [ki, Fs] = i.useState(() => {
      const t = localStorage.getItem("pos_selected_voice") || "edge-vi-female";
      return t === "native-vi" || !t.startsWith("edge") && t !== "google" ? (localStorage.setItem("pos_selected_voice", "edge-vi-female"), "edge-vi-female") : t;
    });
  // Precache audio initial
  i.useEffect(() => {
    // Chỉ kích hoạt precache một lần sau khi dữ liệu sản phẩm đã nạp xong, không trigger re-render
    if (T && T.length > 0) {
      const timer = setTimeout(() => {
        Ss(T);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [T?.length]);
  const [Or, wi] = i.useState(() => parseFloat(localStorage.getItem("pos_speech_rate") || "1")),
    ji = t => {
      const a = parseFloat(t.target.value);
      wi(a), localStorage.setItem("pos_speech_rate", a.toString()), setTimeout(() => Ss(T), 100);
    },
    [speechPitch, setSpeechPitch] = i.useState(() => parseInt(localStorage.getItem("pos_speech_pitch") || "0")),
    handlePitchChange = t => {
      const val = parseInt(t.target.value);
      setSpeechPitch(val);
      localStorage.setItem("pos_speech_pitch", val.toString());
      setTimeout(() => Ss(T), 100);
    },
    [speechGap, setSpeechGap] = i.useState(() => parseInt(localStorage.getItem("pos_speech_gap") || "150")),
    handleGapChange = t => {
      const val = parseInt(t.target.value);
      setSpeechGap(val);
      localStorage.setItem("pos_speech_gap", val.toString());
    },
    [Lr, ba] = i.useState(!1),
    [ar, Ct] = i.useState(!1),
    [ga, Vs] = i.useState(() => localStorage.getItem("pos_keep_order_after_save") === "true"),
    [blockTabPrice, setBlockTabPrice] = i.useState(() => localStorage.getItem("pos_block_tab_unit_price") === "true"),
    [showLastPurchaseBadge, setShowLastPurchaseBadge] = i.useState(() => localStorage.getItem("pos_show_last_purchase_badge") !== "false"),
    [typingSoundEnabled, setTypingSoundEnabled] = i.useState(() => localStorage.getItem("pos_typing_sound_enabled") !== "false"),
    [soundThemeSuccess, setSoundThemeSuccess] = i.useState(() => localStorage.getItem("pos_sound_theme_success") || "chime"),
    [soundThemeAction, setSoundThemeAction] = i.useState(() => localStorage.getItem("pos_sound_theme_action") || "pop_bubble"),
    [soundThemeCartAdd, setSoundThemeCartAdd] = i.useState(() => localStorage.getItem("pos_sound_theme_cart_add") || "barcode_beep"),
    [soundThemeTyping, setSoundThemeTyping] = i.useState(() => localStorage.getItem("pos_sound_theme_typing") || "mechanical"),
    [soundThemeError, setSoundThemeError] = i.useState(() => localStorage.getItem("pos_sound_theme_error") || "buzz_low"),
    [showMascotCustomizer, setShowMascotCustomizer] = i.useState(false),
    [mascotWatermarkVisible, setMascotWatermarkVisible] = i.useState(() => localStorage.getItem("pos_mascot_watermark_visible") !== "false"),
    [mascotWatermarkPos, setMascotWatermarkPos] = i.useState(() => localStorage.getItem("pos_mascot_watermark_pos") || "bottom-right"),
    [mascotWatermarkScale, setMascotWatermarkScale] = i.useState(() => parseFloat(localStorage.getItem("pos_mascot_watermark_scale") || "100")),
    [mascotWatermarkOpacity, setMascotWatermarkOpacity] = i.useState(() => parseFloat(localStorage.getItem("pos_mascot_watermark_opacity") || "15")),
    [mascotWatermarkRotate, setMascotWatermarkRotate] = i.useState(() => parseFloat(localStorage.getItem("pos_mascot_watermark_rotate") || "-6")),
    [mascotWatermarkOffsetX, setMascotWatermarkOffsetX] = i.useState(() => parseFloat(localStorage.getItem("pos_mascot_watermark_offset_x") || "10")),
    [mascotWatermarkOffsetY, setMascotWatermarkOffsetY] = i.useState(() => parseFloat(localStorage.getItem("pos_mascot_watermark_offset_y") || "10")),
    [mascotWatermarkCustomImage, setMascotWatermarkCustomImage] = i.useState(() => {
      try {
        return localStorage.getItem("pos_mascot_watermark_custom_image") || null;
      } catch (e) {
        return null;
      }
    }),
    [isCompressingMascot, setIsCompressingMascot] = i.useState(false),
    mascotQuickFileInputRef = i.useRef(null),
    $r = i.useRef(null);

  const handleQuickMascotUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsCompressingMascot(true);
      const compressedBase64 = await compressImageForWatermark(file, 512, 0.85);
      setMascotWatermarkCustomImage(compressedBase64);
      try {
        localStorage.setItem("pos_mascot_watermark_custom_image", compressedBase64);
      } catch (storageErr) {
        console.warn("Storage quota warning:", storageErr);
      }
      try {
        const syncChan = new BroadcastChannel('pos_data_sync');
        syncChan.postMessage({ type: 'UI_SETTING_UPDATED', key: 'pos_mascot_watermark_custom_image', value: compressedBase64 });
        syncChan.close();
      } catch (err) {}
    } catch (err) {
      alert(err.message || "Lỗi xử lý ảnh");
    } finally {
      setIsCompressingMascot(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleResetQuickMascot = () => {
    setMascotWatermarkCustomImage(null);
    try {
      localStorage.removeItem("pos_mascot_watermark_custom_image");
    } catch (e) {}
    try {
      const syncChan = new BroadcastChannel('pos_data_sync');
      syncChan.postMessage({ type: 'UI_SETTING_UPDATED', key: 'pos_mascot_watermark_custom_image', value: null });
      syncChan.close();
    } catch (e) {}
  };

  i.useEffect(() => {
    try {
      const syncChan = new BroadcastChannel('pos_data_sync');
      syncChan.onmessage = (e) => {
        const data = e.data;
        if (data && data.type === 'UI_SETTING_UPDATED') {
          if (data.key === 'pos_mascot_watermark_custom_image') {
            setMascotWatermarkCustomImage(data.value);
          } else if (data.key === 'pos_mascot_watermark_visible') {
            setMascotWatermarkVisible(data.value === 'true' || data.value === true);
          } else if (data.key === 'pos_mascot_watermark_pos') {
            setMascotWatermarkPos(data.value);
          } else if (data.key === 'pos_mascot_watermark_scale') {
            setMascotWatermarkScale(parseFloat(data.value) || 100);
          } else if (data.key === 'pos_mascot_watermark_opacity') {
            setMascotWatermarkOpacity(parseFloat(data.value) || 15);
          } else if (data.key === 'pos_mascot_watermark_rotate') {
            setMascotWatermarkRotate(parseFloat(data.value) || 0);
          } else if (data.key === 'pos_mascot_watermark_offset_x') {
            setMascotWatermarkOffsetX(parseFloat(data.value) || 0);
          } else if (data.key === 'pos_mascot_watermark_offset_y') {
            setMascotWatermarkOffsetY(parseFloat(data.value) || 0);
          }
        }
      };
      return () => syncChan.close();
    } catch (e) {}
  }, []);

  i.useEffect(() => {
    const t = a => {
      $r.current && !$r.current.contains(a.target) && Ct(!1);
    };
    return ar && document.addEventListener("mousedown", t), () => document.removeEventListener("mousedown", t);
  }, [ar]);
  const [dc, cc] = i.useState("general"),
    Qs = i.useRef(null);
  i.useRef(null);
  const rr = ie;
  i.useEffect(() => {
    const t = a => {
      Qs.current && !Qs.current.contains(a.target) && ba(!1);
    };
    return Lr && document.addEventListener("mousedown", t), () => document.removeEventListener("mousedown", t);
  }, [Lr]);
  const [pc, uc] = i.useState(() => localStorage.getItem("pos_tts_currency_template") || "dạ {amount} đồng"),
    [mc, xc] = i.useState(() => localStorage.getItem("pos_tts_currency_partner_template") || "dạ {amount} đồng"),
    [hc, bc] = i.useState(() => {
      const saved = localStorage.getItem("pos_tts_thankyou_template");
      return saved && saved !== "Cảm ơn quý khách đã chọn Sáu Quý" ? saved : "Cảm ơn quý khách";
    }),
    [gc, fc] = i.useState(() => {
      const saved = localStorage.getItem("pos_tts_thankyou_partner_template");
      return saved && saved !== "Cảm ơn {partner} đã chọn Sáu Quý" ? saved : "Cảm ơn quý khách";
    }),
    [yc, vc] = i.useState(() => localStorage.getItem("pos_tts_enable_thankyou") !== "false"),
    [kc, wc] = i.useState(() => localStorage.getItem("pos_tts_disable_partner_template") === "true"),
    [jc, _c] = i.useState(() => localStorage.getItem("pos_tts_disable_partner_thankyou") === "true"),
    [Dc, Pc] = i.useState(() => localStorage.getItem("pos_tts_enable_cart_addition") !== "false"),
    [Ec, qc] = i.useState(() => localStorage.getItem("pos_tts_enable_cart_product_name") !== "false"),
    [Mc, Wc] = i.useState(() => localStorage.getItem("pos_tts_cart_speech_order") || "name_first"),
    [p, F] = i.useState(() => be("selectedPartner", null)),
    pRef = i.useRef(p);
  i.useEffect(() => {
    pRef.current = p;
  }, [p]);
  i.useEffect(() => {
    if (Array.isArray(Y) && Y.length > 0) {
      const curPartner = pRef.current;
      if (curPartner?.id) {
        const freshPartner = Y.find(item => item.id === curPartner.id);
        if (freshPartner && (freshPartner.debt_balance !== curPartner.debt_balance || freshPartner.name !== curPartner.name || freshPartner.phone !== curPartner.phone)) {
          F(freshPartner);
        }
      }
      _((prevTabs) => {
        let changed = false;
        const nextTabs = prevTabs.map(tab => {
          if (tab.selectedPartner?.id) {
            const fresh = Y.find(item => item.id === tab.selectedPartner.id);
            if (fresh && (fresh.debt_balance !== tab.selectedPartner.debt_balance || fresh.name !== tab.selectedPartner.name || fresh.phone !== tab.selectedPartner.phone)) {
              changed = true;
              return { ...tab, selectedPartner: fresh };
            }
          }
          return tab;
        });
        return changed ? nextTabs : prevTabs;
      });
    }
  }, [Y]);
  const [st, Hr] = i.useState(null),
    [nt, Kr] = i.useState(null),
    [Ne, Kt] = i.useState("debt"),
    [sr, Gr] = i.useState(!1),
    [Xs, Js] = i.useState(!1),
    [yt, Ge] = i.useState(""),
    [Me, Ue] = i.useState(!1),
    [K, $e] = i.useState(() => be("note", "")),
    [oe, re] = i.useState(() => be("amountPaid", 0)),
    [V, Ye] = i.useState(() => be("cashGiven", 0)),
    [I, ge] = i.useState(() => be("paymentMethod", (localStorage.getItem("unified_pos_mode") || "Retail") === "Wholesale" ? "Debt" : "Cash")),
    [fa, Ur] = i.useState(null),
    [ya, Ys] = i.useState(null),
    [Be, Zs] = i.useState(!1),
    [Q, Gt] = i.useState(null),
    [le, Br] = i.useState(null),
    [customOrderDate, setCustomOrderDate] = i.useState(""),
    [isOrderDatePickerOpen, setIsOrderDatePickerOpen] = i.useState(!1),
    [Fr, nr] = i.useState(null),
    [Ce, Vr] = i.useState(0);
  i.useEffect(() => {
    (async () => {
      try {
        const t = await M.get("/api/orders?limit=1&page=1&type=Sale");
        t.data.items && t.data.items.length > 0 && Ys(t.data.items[0]);
      } catch (t) {
        console.error("Failed to fetch last order:", t);
      }
    })();
  }, []), i.useEffect(() => {
    _(t => {
      const a = t.find(r => r.id === g);
      return a && (a.cart !== y || a.selectedPartner !== p || a.note !== K || a.amountPaid !== oe || a.cashGiven !== V || a.paymentMethod !== I) ? t.map(r => r.id === g ? {
        ...r,
        cart: y,
        selectedPartner: p,
        note: K,
        amountPaid: oe,
        cashGiven: V,
        paymentMethod: I
      } : r) : t;
    });
  }, [g, y, p, K, oe, V, I]), i.useEffect(() => {
    localStorage.setItem("pos_order_tabs", JSON.stringify(fe));
  }, [fe]), i.useEffect(() => {
    localStorage.setItem("pos_active_tab_id", JSON.stringify(g));
  }, [g]), i.useEffect(() => {
    localStorage.setItem("pos_pinned_scan_tab_id", JSON.stringify(ne));
  }, [ne]), i.useEffect(() => {
    const t = a => {
      if (a.newValue) {
        if (a.key === "pos_order_tabs") try {
          const r = JSON.parse(a.newValue);
          _(r);
          const s = r.find(n => n.id === g);
          s && (JSON.stringify(s.cart) !== JSON.stringify(y) && H(s.cart || []), s.selectedPartner?.id !== p?.id && F(s.selectedPartner || null), s.note !== K && $e(s.note || ""), s.amountPaid !== oe && re(s.amountPaid || 0), s.cashGiven !== V && Ye(s.cashGiven || 0), s.paymentMethod !== I && ge(s.paymentMethod || "Cash"));
        } catch (r) {
          console.error("Error syncing storage across tabs:", r);
        } else if (a.key === "pos_active_tab_id") try {
          const r = JSON.parse(a.newValue);
          if (r !== g) {
            f(r);
            const s = localStorage.getItem("pos_order_tabs");
            if (s) {
              const l = JSON.parse(s).find(d => d.id === r);
              l && (H(l.cart || []), F(l.selectedPartner || null), $e(l.note || ""), re(l.amountPaid || 0), Ye(l.cashGiven || 0), ge(l.paymentMethod || "Cash"));
            }
          }
        } catch {} else if (a.key === "pos_pinned_scan_tab_id") try {
          const r = JSON.parse(a.newValue);
          r !== ne && me(r);
        } catch {}
      }
    };
    return window.addEventListener("storage", t), () => {
      window.removeEventListener("storage", t);
    };
  }, [g, y, p, K, oe, V, I, ne]);
  const Ut = bd(),
    [Fe, Qr] = i.useState(() => {
      const t = localStorage.getItem("held_invoices");
      return t ? JSON.parse(t) : [];
    }),
    [va, St] = i.useState(!1),
    [ka, en] = i.useState(!1),
    [Ze, _i] = i.useState(() => localStorage.getItem("pos_summary_layout_mode") || "sidebar"),
    [ir, Ni] = i.useState(() => localStorage.getItem("pos_save_notice_style") || "card"),
    Ci = () => {
      const t = Ze === "sidebar" ? "bottom" : "sidebar";
      _i(t), localStorage.setItem("pos_summary_layout_mode", t);
    },
    [Si, Xr] = i.useState(!1),
    [Ti, Bt] = i.useState(!1),
    [Rc, zi] = i.useState(!1),
    partnerBubbleRef = i.useRef(null),
    totalBubbleRef = i.useRef(null),
    cartScrollContainerRef = i.useRef(null),
    [Jr, Yr] = i.useState(() => {
      const t = localStorage.getItem("pos_bottom_summary_height");
      const parsed = t ? parseInt(t, 10) : 105;
      return Math.max(parsed, 96);
    }),
    [tn, an] = i.useState(!1),
    Ii = t => {
      t.preventDefault(), t.stopPropagation(), an(!0);
      const a = t.clientY,
        r = Jr,
        s = l => {
          const d = a - l.clientY,
            o = Math.min(Math.max(r + d, 96), 320);
          Yr(o);
        },
        n = () => {
          an(!1), window.removeEventListener("mousemove", s), window.removeEventListener("mouseup", n), Yr(l => (localStorage.setItem("pos_bottom_summary_height", l.toString()), l));
        };
      window.addEventListener("mousemove", s), window.addEventListener("mouseup", n);
    },
    [Se, Di] = i.useState(() => {
      try {
        const t = localStorage.getItem("pos_bubble_positions");
        return t ? JSON.parse(t) : {
          partner: {
            x: 0,
            y: 0
          },
          total: {
            x: 0,
            y: 0
          }
        };
      } catch {
        return {
          partner: {
            x: 0,
            y: 0
          },
          total: {
            x: 0,
            y: 0
          }
        };
      }
    }),
    rn = (t, a) => {
      Di(r => {
        let s = r[t].x + a.x,
          n = r[t].y + a.y;
        t === "partner" ? (s = Math.max(-20, Math.min(s, 800)), n = Math.max(-500, Math.min(n, 20))) : t === "total" && (s = Math.max(-800, Math.min(s, 20)), n = Math.max(-500, Math.min(n, 20)));
        const l = {
          ...r,
          [t]: {
            x: s,
            y: n
          }
        };
        return localStorage.setItem("pos_bubble_positions", JSON.stringify(l)), l;
      });
    },
    Zr = (t, a) => t.map(r => r.id === a ? {
      ...r,
      cart: y,
      selectedPartner: p,
      note: K,
      amountPaid: oe,
      cashGiven: V,
      paymentMethod: I
    } : r),
    es = t => {
      if (t === g) return;
      _(a => {
        const r = Zr(a, g),
          s = r.find(n => n.id === t);
        if (s) {
          let partnerToSet = s.selectedPartner;
          if (partnerToSet?.id && Array.isArray(Y) && Y.length > 0) {
            const fresh = Y.find(item => item.id === partnerToSet.id);
            if (fresh) partnerToSet = fresh;
          }
          H(s.cart);
          F(partnerToSet);
          $e(s.note);
          re(s.amountPaid);
          Ye(s.cashGiven);
          ge(s.paymentMethod);
          f(t);
          if (partnerToSet?.id) {
            M.post(`/api/partners/${partnerToSet.id}/recalculate-debt`).then(res => {
              if (res.data?.new_balance !== undefined) {
                F(prev => prev && prev.id === partnerToSet.id ? { ...prev, debt_balance: res.data.new_balance } : prev);
                _((prevTabs) =>
                  prevTabs.map((tab) =>
                    tab.selectedPartner?.id === partnerToSet.id
                      ? { ...tab, selectedPartner: { ...tab.selectedPartner, debt_balance: res.data.new_balance } }
                      : tab
                  )
                );
              }
            }).catch(() => {});
          }
        }
        return r;
      });
    },
    Pi = () => {
      if (fe.length >= 5) {
        G({
          message: "Tối đa 5 đơn cùng lúc",
          type: "error"
        });
        return;
      }
      _(t => {
        const a = Zr(t, g),
          r = Math.max(...a.map(n => n.id), 0) + 1,
          s = {
            id: r,
            name: `Đơn ${r}`,
            cart: [],
            selectedPartner: null,
            note: "",
            amountPaid: 0,
            cashGiven: 0,
            paymentMethod: (localStorage.getItem("unified_pos_mode") || "Retail") === "Wholesale" ? "Debt" : "Cash"
          };
        return H(s.cart), F(s.selectedPartner), $e(s.note), re(s.amountPaid), Ye(s.cashGiven), ge(s.paymentMethod), f(r), [...a, s];
      });
    },
    Ei = (t, a) => {
      if (a.stopPropagation(), fe.length <= 1) {
        G({
          message: "Không thể đóng đơn cuối cùng",
          type: "error"
        });
        return;
      }
      _(r => {
        ie.current && delete ie.current[t];
        let s = Zr(r, g);
        if (s = s.filter(n => n.id !== t), g === t) {
          const n = s[s.length - 1];
          H(n.cart), F(n.selectedPartner), $e(n.note), re(n.amountPaid), Ye(n.cashGiven), ge(n.paymentMethod), f(n.id);
        }
        return ne === t && me(s[0].id), s;
      });
    },
    [sn, qi] = i.useState(78),
    [wa, nn] = i.useState(!1),
    [Mi, ja] = i.useState(!1),
    [Wi, _a] = i.useState(!1),
    [Ri, ts] = i.useState(!1),
    [lr, as] = i.useState(!1),
    [De, Ft] = i.useState(0),
    [We, rs] = i.useState(0),
    [R, or] = i.useState({}),
    [partnerLastPurchases, setPartnerLastPurchases] = i.useState({}),
    [ln, Ai] = i.useState([]),
    [ss, ns] = i.useState(""),
    [J, Na] = i.useState(() => {
      const t = localStorage.getItem("ui_enable_smart_sorting");
      return {
        ...Tr,
        ui_enable_smart_sorting: t !== null ? t : Tr.ui_enable_smart_sorting
      };
    }),
    [dr, cr] = i.useState(!1),
    [pr, ur] = i.useState(!1),
    [on, dn] = i.useState(""),
    [is, G] = i.useState(null),
    [Te, Oi] = i.useState(() => localStorage.getItem("unified_pos_mode") || "Retail"),
    [m, He] = i.useState({
      product: null,
      quantity: 0,
      price: 0,
      secondary_qty: 0,
      name: ""
    }),
    [Tt, ct] = i.useState(null),
    [zt, ls] = i.useState(""),
    [It, Ca] = i.useState(0),
    [Li, os] = i.useState(!1),
    [ds, Sa] = i.useState(!1),
    [showFloatingMascot, setShowFloatingMascot] = i.useState(() => localStorage.getItem('ui_show_pos_mascot') !== 'false'),
    [animateMascot, setAnimateMascot] = i.useState(() => localStorage.getItem('ui_mascot_animate') === 'true'),
    [mascotConfig, setMascotConfig] = i.useState(() => {
      try {
        const saved = localStorage.getItem('pos_mascot_config');
        return saved ? JSON.parse(saved) : { x: 0, y: 0, scale: 1.1 };
      } catch {
        return { x: 0, y: 0, scale: 1.1 };
      }
    }),
    savePosMascotConfig = (newCfg) => {
      setMascotConfig(prev => {
        const updated = { ...prev, ...newCfg };
        localStorage.setItem('pos_mascot_config', JSON.stringify(updated));
        return updated;
      });
    },
    [Ta, $i] = i.useState(null),
    [cn, cs] = i.useState(1),
    [ps, vt] = i.useState(!1),
    [Hi, Vt] = i.useState(null),
    [Qt, Dt] = i.useState(!1),
    [pt, Xt] = i.useState(null),
    [Ki, za] = i.useState(null),
    [Gi, pn] = i.useState("Sale"),
    [Jt, un] = i.useState("Sale");

  const undoStackRef = i.useRef([]),
    redoStackRef = i.useRef([]),
    lastStateSnapshotRef = i.useRef(null),
    isUndoingRef = i.useRef(!1);

  i.useEffect(() => {
    if (isUndoingRef.current) {
      isUndoingRef.current = !1;
      return;
    }
    const currentSnapshot = {
      cart: y,
      partner: p,
      note: K,
      amountPaid: oe,
      cashGiven: V,
      paymentMethod: I,
      orderId: Q,
      workingProduct: m
    };
    if (lastStateSnapshotRef.current) {
      const prev = lastStateSnapshotRef.current;
      const cartDiff = JSON.stringify(prev.cart) !== JSON.stringify(currentSnapshot.cart);
      const partnerDiff = prev.partner?.id !== currentSnapshot.partner?.id;
      const noteDiff = prev.note !== currentSnapshot.note;
      const orderIdDiff = prev.orderId !== currentSnapshot.orderId;
      if (cartDiff || partnerDiff || noteDiff || orderIdDiff) {
        undoStackRef.current.push(prev);
        if (undoStackRef.current.length > 50) {
          undoStackRef.current.shift();
        }
        redoStackRef.current = [];
      }
    }
    lastStateSnapshotRef.current = currentSnapshot;
  }, [y, p, K, oe, V, I, Q]);

  const handleUndo = () => {
    if (undoStackRef.current.length === 0) {
      G({
        message: "Không có thao tác nào để hoàn tác!",
        type: "error"
      });
      return;
    }
    const currentSnapshot = {
      cart: y,
      partner: p,
      note: K,
      amountPaid: oe,
      cashGiven: V,
      paymentMethod: I,
      orderId: Q,
      workingProduct: m
    };
    const previousSnapshot = undoStackRef.current.pop();
    if (previousSnapshot) {
      redoStackRef.current.push(currentSnapshot);
      isUndoingRef.current = !0;
      lastStateSnapshotRef.current = previousSnapshot;
      H(previousSnapshot.cart || []);
      F(previousSnapshot.partner || null);
      $e(previousSnapshot.note || "");
      re(previousSnapshot.amountPaid || 0);
      Ye(previousSnapshot.cashGiven || 0);
      ge(previousSnapshot.paymentMethod || "Cash");
      Gt(previousSnapshot.orderId || null);
      if (previousSnapshot.workingProduct) {
        He(previousSnapshot.workingProduct);
      }
      try {
        Is();
      } catch {}
      G({
        message: `Đã hoàn tác (Undo)! Còn ${undoStackRef.current.length} bước`,
        type: "success"
      });
    }
  };

  const handleRedo = () => {
    if (redoStackRef.current.length === 0) return;
    const currentSnapshot = {
      cart: y,
      partner: p,
      note: K,
      amountPaid: oe,
      cashGiven: V,
      paymentMethod: I,
      orderId: Q,
      workingProduct: m
    };
    const nextSnapshot = redoStackRef.current.pop();
    if (nextSnapshot) {
      undoStackRef.current.push(currentSnapshot);
      isUndoingRef.current = !0;
      lastStateSnapshotRef.current = nextSnapshot;
      H(nextSnapshot.cart || []);
      F(nextSnapshot.partner || null);
      $e(nextSnapshot.note || "");
      re(nextSnapshot.amountPaid || 0);
      Ye(nextSnapshot.cashGiven || 0);
      ge(nextSnapshot.paymentMethod || "Cash");
      Gt(nextSnapshot.orderId || null);
      if (nextSnapshot.workingProduct) {
        He(nextSnapshot.workingProduct);
      }
      try {
        Is();
      } catch {}
      G({
        message: "Đã làm lại (Redo)!",
        type: "success"
      });
    }
  };

  i.useEffect(() => {
    if (he) {
      const t = Array.isArray(he) ? he : he.items || [];
      if (m.product) {
        const a = t.find(r => r.id === m.product.id);
        a && (a.stock !== m.product.stock || a.name !== m.product.name || a.unit !== m.product.unit || a.cost_price !== m.product.cost_price || JSON.stringify(a.latest_audit) !== JSON.stringify(m.product.latest_audit)) && He(r => ({
          ...r,
          product: a
        }));
      }
      if (Qt && pt) {
        const a = t.find(r => r.id === pt.id);
        if (a) {
          const r = a.stock !== pt.stock,
            s = JSON.stringify(a.latest_audit) !== JSON.stringify(pt.latest_audit);
          (r || s) && Xt(a);
        }
      }
      H(a => {
        let r = !1;
        const s = a.map(n => {
          if (!n.product_id) return n;
          const l = t.find(d => d.id === n.product_id);
          return l && (l.stock !== n.stock || l.name !== n.product_name || l.unit !== n.unit || l.multiplier !== n.multiplier || l.cost_price !== n.cost_price || l.latest_cost_price !== n.latest_cost_price) ? (r = !0, {
            ...n,
            product_name: l.name,
            unit: l.unit,
            secondary_unit: l.secondary_unit,
            multiplier: l.multiplier || 1,
            stock: l.stock,
            cost_price: l.cost_price,
            latest_cost_price: l.latest_cost_price,
            latest_stock_entry: l.latest_stock_entry,
            latest_audit: l.latest_audit,
            is_combo: l.is_combo,
            active_ingredient: l.active_ingredient
          }) : n;
        });
        return r ? s : a;
      });
    }
  }, [he, m.product?.id, Qt, pt?.id, pt?.stock, JSON.stringify(pt?.latest_audit)]), i.useEffect(() => {
    if (_e && p) {
      const t = (Array.isArray(_e) ? _e : _e.items || []).find(a => a.id === p.id);
      t && (t.debt_balance !== p.debt_balance || t.name !== p.name) && F(t);
    }
  }, [_e, p?.id]);
  const [Ui, Yt] = i.useState(!1),
    [us, mr] = i.useState(null),
    [ye, Ia] = i.useState(null),
    [Da, et] = i.useState(null),
    Bi = i.useRef({}),
    se = i.useRef(null),
    Pt = i.useRef(null),
    ms = i.useRef(null),
    Et = i.useRef(null),
    xr = i.useRef(null),
    Pa = i.useRef(null),
    xs = i.useRef(null),
    hs = i.useRef(null),
    Ea = i.useRef(null),
    [cartColorConfig, setCartColorConfig] = i.useState(() => {
      try {
        const saved = localStorage.getItem("pos_cart_color_config");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.constrainCartAboveBubbles === false) {
            parsed.constrainCartAboveBubbles = true;
            localStorage.setItem("pos_cart_color_config", JSON.stringify(parsed));
          }
          return {
            ...DEFAULT_CART_COLOR_CONFIG,
            ...parsed,
            constrainCartAboveBubbles: true
          };
        }
        return DEFAULT_CART_COLOR_CONFIG;
      } catch {
        return DEFAULT_CART_COLOR_CONFIG;
      }
    }),
    [productSearchCoords, setProductSearchCoords] = i.useState({ top: 0, left: 0, width: 700 }),
    [cartRowSearchCoords, setCartRowSearchCoords] = i.useState({ top: 0, left: 0, width: 700 }),
    [hr, qa] = i.useState([]),
    [q, br] = i.useState(null),
    [Zt, Ma] = i.useState(!1),
    [Ac, Oc] = i.useState(!1),
    bs = i.useRef(null),
    [Fi, gr] = i.useState(!1),
    [mn, Wa] = i.useState(""),
    [ea, xn] = i.useState(null),
    Vi = () => {
      const t = parseInt(mn.trim(), 10);
      if (!isNaN(t) && t > 0 && t <= ve.length) {
        const a = ve[t - 1];
        a && (H(r => r.filter(s => s.cartId !== a.cartId)), G({
          message: `Đã xóa dòng ${t}: ${a.product_name || "Sản phẩm"}`,
          type: "success"
        }));
      } else G({
        message: "Số dòng không hợp lệ!",
        type: "error"
      });
      gr(!1), Wa("");
    };
  const isCartRowDropdownOpen = Boolean(Tt !== null && zt);
  i.useEffect(() => {
    if (isCartRowDropdownOpen) {
      let rafId = null;
      const measureCartCoords = () => {
        const el = document.getElementById(`row-name-${Tt}`);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.width > 0 && rect.bottom > 0) {
            const nextTop = Math.round(rect.bottom + 6),
              nextLeft = Math.round(rect.left),
              nextWidth = Math.round(Math.max(rect.width, 700));
            setCartRowSearchCoords(prev => {
              if (prev.top === nextTop && prev.left === nextLeft && prev.width === nextWidth) {
                return prev;
              }
              return { top: nextTop, left: nextLeft, width: nextWidth };
            });
          }
        }
      };
      const updateCartCoords = (e) => {
        if (e && e.target && e.target.closest && (e.target.closest('#cart-row-product-dropdown') || e.target.closest('.frosted-glass'))) {
          return;
        }
        if (rafId) cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(measureCartCoords);
      };
      measureCartCoords();
      window.addEventListener("resize", updateCartCoords, { passive: true });
      window.addEventListener("scroll", updateCartCoords, { passive: true, capture: true });
      return () => {
        if (rafId) cancelAnimationFrame(rafId);
        window.removeEventListener("resize", updateCartCoords);
        window.removeEventListener("scroll", updateCartCoords, true);
      };
    }
  }, [isCartRowDropdownOpen, Tt]);

  const isProductSearchOpen = Boolean(Z && !m?.product);
  i.useEffect(() => {
    if (isProductSearchOpen) {
      let rafId = null;
      const measureCoords = () => {
        if (se.current) {
          const rect = se.current.getBoundingClientRect();
          if (rect.width > 0 && rect.bottom > 0) {
            const nextTop = Math.round(rect.bottom + 6),
              nextLeft = Math.round(rect.left),
              nextWidth = Math.round(Math.max(rect.width, 700));
            setProductSearchCoords(prev => {
              if (prev.top === nextTop && prev.left === nextLeft && prev.width === nextWidth) {
                return prev;
              }
              return { top: nextTop, left: nextLeft, width: nextWidth };
            });
          }
        }
      };
      const updateCoords = (e) => {
        if (e && e.target && e.target.closest && (e.target.closest('#pos-product-dropdown') || e.target.closest('.frosted-glass'))) {
          return;
        }
        if (rafId) cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(measureCoords);
      };
      measureCoords();
      window.addEventListener("resize", updateCoords, { passive: true });
      window.addEventListener("scroll", updateCoords, { passive: true, capture: true });
      return () => {
        if (rafId) cancelAnimationFrame(rafId);
        window.removeEventListener("resize", updateCoords);
        window.removeEventListener("scroll", updateCoords, true);
      };
    }
  }, [isProductSearchOpen]);
  i.useEffect(() => {
    if (!Zt) return;
    const t = a => {
      a.key === "Escape" && Ma(!1);
    };
    return window.addEventListener("keydown", t), () => window.removeEventListener("keydown", t);
  }, [Zt]), i.useEffect(() => {
    !(fe.some(a => a.id === g) || g === "remote_inspect" && q) && fe.length > 0 && f(fe[0].id);
  }, [g, fe, q]), i.useEffect(() => {
    const t = async () => {
      try {
        if (typeof document !== "undefined" && document.hidden) return;
        const s = localStorage.getItem("pos_terminal_id"),
          l = ((await Vn.get("/api/pos/terminals")).data.terminals || []).filter(d => d.terminal_id !== s);
        qa(prev => (JSON.stringify(prev) === JSON.stringify(l) ? prev : l));
      } catch {}
    };
    t();
    const a = setInterval(t, 5e3),
      r = () => {
        Ma(s => !s);
      };
    return window.addEventListener("focus_pos_mirror_tab", r), () => {
      clearInterval(a), window.removeEventListener("focus_pos_mirror_tab", r);
    };
  }, []);
  const hn = t => {
      if (!t || t.length === 0) {
        Ve.error("Giỏ hàng của máy trạm này đang trống!");
        return;
      }
      const a = t.map((r, s) => ({
        id: `imported_${Date.now()}_${s}`,
        product_id: r.id || r.product_id,
        product_name: r.name || r.product_name,
        unit: r.unit || r.product_unit || "Cái",
        quantity: Number(r.quantity) || 1,
        price: Number(r.price || r.sale_price) || 0,
        cost_price: Number(r.cost_price || r.capital_price) || 0,
        code: r.code || r.product_code || r.sku || ""
      }));
      H(a), br(null), Ve.success(`Đã chép ${a.length} sản phẩm từ máy trạm vào đơn của bạn!`);
    },
    k = q ? hr.find(t => t.terminal_id === q || t.ip_address === q || t.ip_address && q.includes(t.ip_address) || t.terminal_id && (q.includes(t.terminal_id) || t.terminal_id.includes(q))) : null,
    ze = k?.partner || (k?.partner_name && k.partner_name !== "Khách lẻ" && k.partner_name !== "Khách bán lẻ" ? {
      name: k.partner_name,
      debt_balance: k.debt_balance || 0
    } : null),
    Pe = g === "remote_inspect" ? ze : p,
    Ra = t => {
      q && (qa(a => a.map(r => r.terminal_id === q || r.ip_address === q ? {
        ...r,
        cart: t,
        total_items: t.reduce((s, n) => s + (Number(n.quantity) || 1), 0),
        total_amount: t.reduce((s, n) => s + (Number(n.quantity) || 1) * Number(n.price || n.sale_price || 0), 0)
      } : r)), M.post("/api/pos/terminal-state/edit-cart", {
        terminal_id: q,
        cart: t
      }).catch(a => {
        Ve.error("Không thể cập nhật máy trạm!");
      }));
    },
    Aa = t => {
      q && (qa(a => a.map(r => r.terminal_id === q || r.ip_address === q ? {
        ...r,
        partner: t,
        partner_name: t ? t.name : "Khách lẻ"
      } : r)), M.post("/api/pos/terminal-state/edit-cart", {
        terminal_id: q,
        partner: t,
        partner_name: t ? t.name : "Khách lẻ",
        cart: k?.cart || []
      }).catch(a => {
        Ve.error("Không thể cập nhật đối tác máy trạm!");
      }));
    },
    Qi = i.useMemo(() => {
      if (g !== "remote_inspect") return [];
      if (!q && !k) return [];
      const t = k || {
          user_name: "Thu ngân",
          ip_address: q.includes(".") ? q : null,
          cart: []
        },
        a = <x.tr key="remote-header-banner" initial={{
          opacity: 0,
          y: -10
        }} animate={{
          opacity: 1,
          y: 0
        }} exit={{
          opacity: 0,
          y: -10
        }} className="bg-transparent border-b border-[#8b6f47]/15 dark:border-white/10 z-50 relative"><td colSpan={9} className="p-1.5 px-3"><div className="flex items-center justify-between gap-4 py-1.5 px-3 bg-black/[0.03] dark:bg-white/[0.04] rounded-xl border border-[#8b6f47]/20 dark:border-white/10 backdrop-blur-md shadow-xs transition-all duration-300"><div className="flex items-center gap-2 text-slate-700 dark:text-slate-200 text-[11px] font-black tracking-wider"><span className="flex h-2 w-2 relative shrink-0"><span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500 shadow-sm" /></span><span className="px-2 py-0.5 rounded-lg bg-emerald-600 dark:bg-emerald-700 text-white text-[9px] font-black uppercase tracking-widest mr-1 shadow-sm">LIVE INSPECT</span><span>Đang soi: <strong className="font-black text-[#8b6f47] dark:text-[#d4a574]">{`${t.user_name || "Thu ngân"} (${t.ip_address || "Local"})`}</strong>{` - ${(t.cart || []).length} món`}</span></div><div className="flex items-center gap-1.5 shrink-0"><button onClick={() => {
                  et({
                    title: "Xác nhận lưu hóa đơn",
                    message: "Bạn có chắc chắn muốn lưu hóa đơn trên máy trạm này?",
                    onConfirm: () => {
                      et(null), M.post("/api/pos/terminal-state/action", {
                        terminal_id: q,
                        action: "save_order"
                      }).then(() => {
                        Ve.success("Đã gửi lệnh lưu hóa đơn tới máy trạm!");
                      }).catch(s => {
                        Ve.error("Không thể gửi lệnh lưu hóa đơn!");
                      });
                    }
                  });
                }} className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-black text-[9px] uppercase tracking-wider shadow-sm transition-all cursor-pointer flex items-center gap-1">LƯU HÓA ĐƠN</button><button onClick={() => hn(t.cart)} className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-black text-[9px] uppercase tracking-wider shadow-sm transition-all cursor-pointer flex items-center gap-1"><Pn size={10} className="shrink-0" />CHÉP GIỎ HÀNG</button><button onClick={() => br(null)} className="px-2.5 py-1 bg-black/[0.05] dark:bg-white/[0.08] hover:bg-[#8b6f47]/15 text-[#8b6f47] dark:text-[#d4a574] border border-[#8b6f47]/20 dark:border-white/10 rounded-lg font-black text-[9px] uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1"><span>✕</span>QUAY LẠI</button></div></div></td></x.tr>,
        r = !t.cart || t.cart.length === 0 ? [<x.tr key="remote-empty-cart" initial={{
          opacity: 0
        }} animate={{
          opacity: 1
        }} exit={{
          opacity: 0
        }}><td colSpan={9} className="p-8 text-center text-xs font-black uppercase tracking-widest text-slate-400">Giỏ hàng của máy trạm này hiện tại đang trống.</td></x.tr>] : t.cart.map((s, n) => {
          const l = Number(s.quantity) || 0,
            d = Number(s.price || s.sale_price) || 0,
            o = d * l,
            u = Number(s.multiplier) || 1,
            h = s.secondary_qty !== void 0 && s.secondary_qty !== null ? s.secondary_qty : l / u,
            b = u > 1 || s.secondary_qty ? Number(h) % 1 === 0 ? Number(h) : Number(h).toFixed(3) : "N/A",
            S = s.id || s.product_id || `remote_${n}_${s.name || s.product_name}`;
          return <x.tr key={S} layout={!0} initial={{
            opacity: 0,
            x: -20,
            scale: 0.98
          }} animate={{
            opacity: 1,
            x: 0,
            scale: 1
          }} exit={{
            opacity: 0,
            x: 30,
            scale: 0.95,
            transition: {
              duration: 0.2
            }
          }} transition={{
            type: "spring",
            stiffness: 350,
            damping: 25
          }} className="border-b border-slate-200 dark:border-white/5 hover:bg-primary/5 dark:hover:bg-slate-800/20 transition-colors group"><td className="py-2 px-4 text-center text-slate-400 font-black text-[11px] group-hover:text-emerald-500 transition-colors tabular-nums">{n + 1}</td><td className="py-2 px-4 text-center"><button onClick={w => {
                w.stopPropagation();
                const O = (k?.cart || []).filter((U, L) => L !== n);
                Ra(O);
              }} className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-all" title="Xóa dòng"><Comp_pa size={18} /></button></td>            <td className="py-2 px-2 relative">
              <div 
                style={{ color: cartColorConfig?.productTextColor && cartColorConfig.productTextColor !== 'default' ? cartColorConfig.productTextColor : undefined }} 
                className={c(
                  "w-full h-auto py-2.5 px-4 text-[17px] font-black uppercase tracking-tight leading-relaxed truncate",
                  (!cartColorConfig?.productTextColor || cartColorConfig.productTextColor === 'default') && "text-emerald-900 dark:text-emerald-300"
                )}
              >
                {s.name || s.product_name}
                {(s.code || s.product_code || s.sku) && <span className="ml-2 text-xs font-black tabular-nums text-slate-400 normal-case">({s.code || s.product_code || s.sku})</span>}
              </div>
            </td><td className="py-2 px-4 text-center"><div className="font-bold text-gray-700 dark:text-gray-200">{Ae(s.unit || s.product_unit || "Cái")}</div></td><td className="py-2 px-2 w-32">{s.secondary_unit ? <div className="flex items-center justify-center gap-1 h-10 px-2 bg-transparent border border-white/20 dark:border-white/10 rounded-2xl font-black text-base text-primary dark:text-[#d4a574]"><input type="text" className="w-16 bg-transparent text-center border-0 outline-none p-0 focus:ring-0 focus:border-0 font-black text-base text-primary dark:text-[#d4a574]" value={b} onFocus={w => w.target.select()} onKeyDown={w => {
                  w.key === "Enter" && (w.preventDefault(), se.current?.focus());
                }} onChange={w => {
                  const O = parseFloat(w.target.value) || 0,
                    U = (k?.cart || []).map((L, ce) => ce === n ? {
                      ...L,
                      secondary_qty: O,
                      quantity: O * (Number(L.multiplier) || 1)
                    } : L);
                  Ra(U);
                }} /><span className="text-[10px] font-black text-gray-400 uppercase ml-1">{Ae(s.secondary_unit || "Cái")}</span></div> : <div className="text-center text-gray-300 italic text-[10px] font-bold">N/A</div>}</td><td className="py-2 px-2 w-24"><input type="text" className="w-full h-10 text-center bg-transparent border border-white/20 dark:border-white/10 rounded-2xl font-black text-lg text-primary dark:text-[#d4a574] focus:ring-0 focus:outline-none focus:border-emerald-500/30" value={l} onFocus={w => w.target.select()} onKeyDown={w => {
                w.key === "Enter" && (w.preventDefault(), se.current?.focus());
              }} onChange={w => {
                const O = parseFloat(w.target.value) || 0,
                  U = (k?.cart || []).map((L, ce) => ce === n ? {
                    ...L,
                    quantity: O,
                    secondary_qty: O / (Number(L.multiplier) || 1)
                  } : L);
                Ra(U);
              }} /></td><td className="py-2 px-2 w-[180px]"><input type="text" tabIndex={blockTabPrice ? -1 : 0} className="w-full h-10 text-center bg-transparent border border-white/20 dark:border-white/10 rounded-2xl font-black text-base text-primary dark:text-[#d4a574] focus:ring-0 focus:outline-none focus:border-emerald-500/30" value={z(d)} onFocus={w => w.target.select()} onKeyDown={w => {
                w.key === "Enter" && (w.preventDefault(), se.current?.focus());
              }} onChange={w => {
                const O = parseFloat(w.target.value.replace(/,/g, "")) || 0,
                  U = (k?.cart || []).map((L, ce) => ce === n ? {
                    ...L,
                    price: O,
                    sale_price: O
                  } : L);
                Ra(U);
              }} /></td><td className="py-2 px-4 text-right"><div className="font-black text-lg text-emerald-600 dark:text-emerald-400 tabular-nums">{z(o)}đ</div></td><td className="w-8" /></x.tr>;
        });
      return [a, ...r];
    }, [q, k, g, cartColorConfig]),
    [Xi, Oa] = i.useState(!1),
    [Ji, fr] = i.useState(null),
    [gs, La] = i.useState(!1),
    [Yi, fs] = i.useState(!1),
    [ut, $a] = i.useState({
      name: "",
      price: ""
    }),
    ys = i.useRef(null),
    bn = i.useRef(null),
    [gn, Zi] = i.useState(!1),
    ve = i.useMemo(() => J.ui_enable_smart_sorting !== "true" ? y : Tn(y), [y, J.ui_enable_smart_sorting]),
    [fn, yn] = i.useState(!1),
    [Ha, el] = i.useState(!1),
    ta = i.useRef(null),
    yr = t => {
      ta.current || (ta.current = setTimeout(() => {
        el(a => !a), ta.current = null;
      }, 3e3));
    },
    aa = () => {
      ta.current && (clearTimeout(ta.current), ta.current = null);
    },
    [tl, kt] = i.useState(!1),
    [editingHistoryOrder, setEditingHistoryOrder] = i.useState(null),
    [al, vn] = i.useState(!1),
    [tt, qt] = i.useState(null),
    [vr, ra] = i.useState(""),
    [kr, sa] = i.useState(""),
    mt = i.useRef(null),
    [Ke, rl] = i.useState(() => {
      const t = localStorage.getItem("pos_print_options");
      return t ? JSON.parse(t) : {
        showOldDebt: !1,
        showPayment: !1,
        showRemaining: !1,
        showCashGiven: !0,
        showChange: !0
      };
    }),
    [transparentCartTable, setTransparentCartTable] = i.useState(() => {
      const t = localStorage.getItem("pos_transparent_cart_table");
      return t === null ? true : t === "true";
    }),
    [showCartColorCustomizer, setShowCartColorCustomizer] = i.useState(false),
    [itemContextMenu, setItemContextMenu] = i.useState(null),
    [packingRepeatCount, setPackingRepeatCount] = i.useState(() => {
      const saved = localStorage.getItem("pos_packing_repeat_count");
      if (saved === "Infinity" || saved === "loop") return Infinity;
      return saved ? (parseInt(saved, 10) || 1) : 1;
    }),
    [isPackingSpeaking, setIsPackingSpeaking] = i.useState(false),
    [packingSpeakingLoop, setPackingSpeakingLoop] = i.useState({ current: 0, total: 1 }),
    [isPackingRepeatMenuOpen, setIsPackingRepeatMenuOpen] = i.useState(false),
    [packingRepeatMenuPos, setPackingRepeatMenuPos] = i.useState({ x: 0, y: 0 });

  const packingLongPressTimerRef = i.useRef(null);
  const isPackingLongPressRef = i.useRef(false);

  const startPackingLongPress = i.useCallback((e) => {
    if (e.button && e.button !== 0) return;
    isPackingLongPressRef.current = false;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = {
      x: clientX || rect.left + rect.width / 2,
      y: (clientY || rect.bottom) + 8
    };

    if (packingLongPressTimerRef.current) {
      clearTimeout(packingLongPressTimerRef.current);
    }
    packingLongPressTimerRef.current = setTimeout(() => {
      isPackingLongPressRef.current = true;
      setPackingRepeatMenuPos(pos);
      setIsPackingRepeatMenuOpen(true);
      if (typeof window !== "undefined" && window.navigator && window.navigator.vibrate) {
        try { window.navigator.vibrate(50); } catch (_) {}
      }
    }, 400);
  }, []);

  const cancelPackingLongPress = i.useCallback(() => {
    if (packingLongPressTimerRef.current) {
      clearTimeout(packingLongPressTimerRef.current);
      packingLongPressTimerRef.current = null;
    }
  }, []);

  const handlePackingSpeakerClick = i.useCallback((e) => {
    if (isPackingLongPressRef.current) {
      e.preventDefault();
      e.stopPropagation();
      isPackingLongPressRef.current = false;
      return;
    }
    e.stopPropagation();
    if (isPackingSpeaking || (window.currentPackingQueue && !window.currentPackingQueue.isStopped)) {
      if (window.currentPackingQueue) {
        window.currentPackingQueue.stop();
      }
      setIsPackingSpeaking(false);
      Ve.success("Đã dừng đọc danh sách soạn hàng");
      return;
    }
    if (ve && ve.length > 0) {
      qn(ve, T, packingRepeatCount, true);
    } else {
      Ve.error("Giỏ hàng đang trống!");
    }
  }, [isPackingSpeaking, ve, T, packingRepeatCount]);

  const handlePackingContextMenu = i.useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    cancelPackingLongPress();
    setPackingRepeatMenuPos({ x: e.clientX, y: e.clientY });
    setIsPackingRepeatMenuOpen(true);
  }, [cancelPackingLongPress]);

  const selectPackingRepeat = i.useCallback((val) => {
    setIsPackingRepeatMenuOpen(false);
    if (val === "stop") {
      if (window.currentPackingQueue) {
        window.currentPackingQueue.stop();
      }
      setIsPackingSpeaking(false);
      Ve.success("Đã dừng đọc danh sách soạn hàng");
      return;
    }

    setPackingRepeatCount(val);
    localStorage.setItem("pos_packing_repeat_count", String(val));
    const label = val === Infinity || val === "Infinity" ? "liên tục" : `${val} lần`;

    if (ve && ve.length > 0) {
      Ve.success(`Bắt đầu đọc soạn hàng (${label})`);
      qn(ve, T, val, true);
    } else {
      Ve.success(`Đã lưu cài đặt phát lại: ${label}`);
    }
  }, [ve, T]);

  i.useEffect(() => {
    const handleTtsStatus = (e) => {
      if (e.detail) {
        setIsPackingSpeaking(Boolean(e.detail.isPlaying));
        if (e.detail.currentLoop !== undefined) {
          setPackingSpeakingLoop({ 
            current: e.detail.currentLoop, 
            total: e.detail.totalLoops === undefined ? 1 : e.detail.totalLoops 
          });
        }
      }
    };
    window.addEventListener('pos_packing_tts_status', handleTtsStatus);
    return () => {
      window.removeEventListener('pos_packing_tts_status', handleTtsStatus);
    };
  }, []);
  i.useEffect(() => {
    localStorage.setItem("pos_new_style", JSON.stringify(Je));
    document.documentElement.style.setProperty("--pos-accent", Je.accent);
    document.documentElement.style.setProperty("--dropdown-bg", Je.dropdownBg);
    document.documentElement.style.setProperty("--dropdown-accent", Je.dropdownAccent);
    document.documentElement.style.setProperty("--radius-pos", `${Je.radius}rem`);
    document.documentElement.style.setProperty("--bg-transparent-blur", `${Je.blur}px`);
  }, [Je]);
  const kn = t => {
      if (!t) return "#000000";
      const a = parseInt(t.slice(1, 3), 16),
        r = parseInt(t.slice(3, 5), 16),
        s = parseInt(t.slice(5, 7), 16);
      return (a * 299 + r * 587 + s * 114) / 1e3 > 128 ? "#000000" : "#ffffff";
    },
    sl = (t, a = 0.8) => {
      const r = parseInt(t.slice(1, 3), 16),
        s = parseInt(t.slice(3, 5), 16),
        n = parseInt(t.slice(5, 7), 16);
      return `rgba(${r}, ${s}, ${n}, ${a})`;
    },
    Mt = i.useMemo(() => {
      const t = document.documentElement.classList.contains("dark") || N === "dark",
        a = t ? "#1a1714" : "#f7f4ed",
        r = (cartColorConfig?.accentColor && cartColorConfig.accentColor !== 'default') 
          ? cartColorConfig.accentColor 
          : (Je.dropdownAccent || "#8b6f47"),
        s = kn(a),
        n = kn(r);
      return {
        main: s,
        accent: n,
        muted: s === "#ffffff" ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.5)",
        accentMuted: n === "#ffffff" ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.6)",
        glassBg: "transparent",
        glassAccent: sl(r, 0.9)
      };
    }, [Je.dropdownBg, Je.dropdownAccent, N, cartColorConfig]);
  i.useEffect(() => {
    localStorage.setItem("pos_print_options", JSON.stringify(Ke));
  }, [Ke]);
  const nl = In(0),
    il = In(0);
  Dn(nl, {
    stiffness: 50,
    damping: 20
  }), Dn(il, {
    stiffness: 50,
    damping: 20
  }), i.useEffect(() => {
    mt.current = new BroadcastChannel("packing_channel");
    const t = new BroadcastChannel("pos_data_sync");
    const handleSync = async a => {
      const data = a.data || a.detail || {};
      if (data.type === "PARTNER_UPDATED" || data.type === "ORDER_SAVED") {
        E.invalidateQueries({ queryKey: ["shippingSummary"] });
        E.invalidateQueries({ queryKey: ["partners"] });
        E.invalidateQueries({ queryKey: ["products"] });
        E.invalidateQueries({ queryKey: ["orders"] });
        const targetPartnerId = data.partnerId || pRef.current?.id;
        if (targetPartnerId) {
          try {
            const res = await M.post(`/api/partners/${targetPartnerId}/recalculate-debt`);
            const newBal = res.data?.new_balance;
            if (newBal !== undefined) {
              if (pRef.current?.id === targetPartnerId) {
                F(prev => prev && prev.id === targetPartnerId ? { ...prev, debt_balance: newBal } : prev);
              }
              _((prevTabs) =>
                prevTabs.map((tab) =>
                  tab.selectedPartner?.id === targetPartnerId
                    ? { ...tab, selectedPartner: { ...tab.selectedPartner, debt_balance: newBal } }
                    : tab
                )
              );
            } else {
              const pRes = await M.get(`/api/partners/${targetPartnerId}`);
              if (pRes.data) {
                if (pRef.current?.id === targetPartnerId) {
                  F(pRes.data);
                }
                _((prevTabs) =>
                  prevTabs.map((tab) =>
                    tab.selectedPartner?.id === targetPartnerId
                      ? { ...tab, selectedPartner: pRes.data }
                      : tab
                  )
                );
              }
            }
          } catch {}
        }
      } else if (data.type === "PRODUCT_UPDATED") {
        E.invalidateQueries({ queryKey: ["products"] });
      } else if (data.type === "SETTINGS_UPDATED") {
        _n();
        Nn();
      } else if (data.type === "UI_SETTING_UPDATED" && data.key === "pos_keep_order_after_save") {
        Vs(data.value === "true");
      } else if (data.type === "UI_SETTING_UPDATED" && data.key === "pos_block_tab_unit_price") {
        setBlockTabPrice(data.value === "true");
      } else if (data.type === "UI_SETTING_UPDATED" && data.key === "pos_transparent_cart_table") {
        setTransparentCartTable(data.value === "true");
      } else if (data.type === "UI_SETTING_UPDATED" && data.key === "pos_typing_sound_enabled") {
        setTypingSoundEnabled(data.value !== "false");
      } else if (data.type === "UI_SETTING_UPDATED" && data.key === "pos_sound_theme_success") {
        setSoundThemeSuccess(data.value);
      } else if (data.type === "UI_SETTING_UPDATED" && data.key === "pos_sound_theme_action") {
        setSoundThemeAction(data.value);
      } else if (data.type === "UI_SETTING_UPDATED" && data.key === "pos_sound_theme_typing") {
        setSoundThemeTyping(data.value);
      } else if (data.type === "UI_SETTING_UPDATED" && data.key === "ui_enable_smart_sorting") {
        Na(r => ({
          ...r,
          ui_enable_smart_sorting: data.value
        }));
      } else if (data.type === "CART_COLOR_CONFIG_UPDATED" || (data.type === "UI_SETTING_UPDATED" && data.key === "pos_cart_color_config")) {
        try {
          const cfg = typeof data.value === "string" ? JSON.parse(data.value) : (data.config || data.value);
          if (cfg) setCartColorConfig(cfg);
        } catch {}
      }
    };
    t.onmessage = handleSync;
    window.addEventListener("pos_data_sync", handleSync);
    return () => {
      mt.current && mt.current.close();
      t.close();
      window.removeEventListener("pos_data_sync", handleSync);
    };
  }, []), i.useEffect(() => {
    if (mt.current) {
      mt.current.onmessage = s => {
        if (s.data && s.data.type === "REQUEST_SYNC") {
          const n = new Date().toLocaleTimeString("vi-VN", {
              hour: "2-digit",
              minute: "2-digit"
            }),
            l = {
              type: y.length > 0 ? "NEW_ORDER" : "CLEAR",
              orders: y.length > 0 ? [{
                id: Q || "MỚI",
                customer_name: p ? p.name : null,
                timestamp: n,
                items: y.map(d => ({
                  id: d.cartId,
                  product_id: d.product_id,
                  name: d.product_name,
                  quantity: d.quantity,
                  unit: d.unit,
                  price: d.price
                })),
                note: K
              }] : []
            };
          mt.current.postMessage(l), M.post("/api/packing/sync", l).catch(console.error);
        }
      };
      const t = new Date().toLocaleTimeString("vi-VN", {
          hour: "2-digit",
          minute: "2-digit"
        }),
        a = {
          type: y.length > 0 ? "NEW_ORDER" : "CLEAR",
          orders: y.length > 0 ? [{
            id: Q || "MỚI",
            customer_name: p ? p.name : null,
            timestamp: t,
            items: y.map(s => ({
              id: s.cartId,
              product_id: s.product_id,
              name: s.product_name,
              quantity: s.quantity,
              unit: s.unit,
              price: s.price
            })),
            note: K
          }] : []
        };
      mt.current.postMessage(a);
      const r = setTimeout(() => {
        M.post("/api/packing/sync", a).catch(console.error);
      }, 350);
      try {
        const s = y.map(l => ({
            name: l.product_name || l.name,
            product_name: l.product_name || l.name,
            quantity: l.quantity || 1,
            unit: l.unit || l.product_unit || "Cái",
            price: l.price || l.sale_price || 0,
            sale_price: l.price || l.sale_price || 0,
            cost_price: l.cost_price || l.capital_price || (l.price ? l.price * 0.75 : 0),
            code: l.code || l.sku || l.product_code || "",
            secondary_unit: l.secondary_unit || null,
            multiplier: Number(l.multiplier) || 1,
            secondary_qty: Number(l.secondary_qty) || 0,
            product_id: l.product_id || null
          })),
          n = p && p.name || "Khách lẻ";
        localStorage.setItem("pos_cart", JSON.stringify(s)), localStorage.setItem("pos_partner_name", n), p ? localStorage.setItem("pos_selected_partner", JSON.stringify(p)) : localStorage.removeItem("pos_selected_partner"), localStorage.setItem("pos_active_payment_method", I || "Cash"), localStorage.setItem("pos_active_amount_paid", String(oe || 0)), localStorage.setItem("pos_active_cash_given", String(V || 0)), localStorage.setItem("pos_active_note", K || ""), window.dispatchEvent(new CustomEvent("pos_cart_updated", {
          detail: {
            cart: s,
            partner_name: n,
            partner: p,
            payment_method: I || "Cash",
            amount_paid: oe || 0,
            cash_given: V || 0,
            note: K || ""
          }
        }));
      } catch {}
      return () => clearTimeout(r);
    }
  }, [y, K, Q, p, I, oe, V]), i.useEffect(() => {
    if (mt.current) {
      const t = {
        type: "SYNC_HELD",
        heldInvoices: Fe.map(a => ({
          id: a.id,
          partner_name: a.partner ? a.partner.name : "Khách Lẻ",
          total: a.total,
          time: a.time,
          itemCount: a.cart.length,
          items: a.cart.map(r => ({
            name: r.product_name,
            quantity: r.quantity,
            unit: r.unit,
            price: r.price
          })),
          note: a.note
        }))
      };
      mt.current.postMessage(t), M.post("/api/packing/sync", t).catch(console.error);
    }
  }, [Fe]), i.useEffect(() => {
    if (m.product) {
      const t = setTimeout(() => {
        const a = Te === "Wholesale" && m.product.secondary_unit ? Pa : Pt;
        a.current && document.activeElement !== a.current && (a.current.focus(), a.current.select?.());
      }, 0);
      return () => clearTimeout(t);
    }
  }, [m.product?.id, Te]);
  const wn = i.useMemo(() => m.product ? m.price * m.quantity : 0, [m.product, m.price, m.quantity]),
    $ = i.useMemo(() => y.reduce((t, a) => t + a.price * a.quantity, 0) + wn, [y, wn]);
  i.useEffect(() => {
    if ($ > 0) {
      const t = setTimeout(() => {
        yl($, p?.name);
      }, 150);
      return () => clearTimeout(t);
    }
  }, [$, p?.name]);
  const vs = i.useMemo(() => {
      const t = y.reduce((r, s) => {
          const n = s.product_id == null ? s.price : s.cost_price || 0;
          return r + (s.price - n) * s.quantity;
        }, 0),
        a = m.product ? (m.price - (m.product.cost_price || 0)) * m.quantity : 0;
      return t + a;
    }, [y, m]),
    ll = i.useMemo(() => y.length + (m.product ? 1 : 0), [y, m.product]),
    ol = i.useMemo(() => y.reduce((t, a) => t + (a.quantity || 0), 0) + (m.quantity || 0), [y, m.quantity]),
    dl = i.useMemo(() => y.reduce((t, a) => t + (a.secondary_qty || 0), 0) + (m.secondary_qty || 0), [y, m.secondary_qty]),
    de = i.useMemo(() => {
      if (!p) return 0;
      if (Q && le && p.id === le.partner_id && le.old_debt !== void 0 && le.old_debt !== null) return le.old_debt;
      let t = p.debt_balance;
      if (Q && le && p.id === le.partner_id && le.payment_method === "Debt") {
        const a = (le.total_amount || 0) - (le.amount_paid || 0);
        t -= a;
      }
      return t;
    }, [p, Q, le]),
    it = I === "Debt" ? de + ($ >= 0 ? $ - oe : $ + oe) : de,
    wr = () => {
      if (y.length === 0) return;
      const t = {
        id: Date.now(),
        cart: [...y],
        partner: p,
        note: K,
        amountPaid: oe,
        cashGiven: V,
        paymentMethod: I,
        editOrderId: Q,
        time: new Date().toLocaleTimeString("vi-VN", {
          hour: "2-digit",
          minute: "2-digit"
        }),
        total: $
      };
      Qr([t, ...Fe]), Wt(), G({
        message: "Đã tạm dừng đơn hàng",
        type: "success"
      });
    },
    jn = t => {
      H(t.cart), F(t.partner), $e(t.note), re(t.amountPaid), Ye(t.cashGiven || 0), ge(t.paymentMethod || "Debt"), Gt(t.editOrderId || null), Qr(Fe.filter(a => a.id !== t.id)), St(!1);
    },
    cl = t => {
      Qr(Fe.filter(a => a.id !== t));
    },
    Wt = (t = !1) => {
      H([]), t || (F(null), Ge("")), ae(""), Ue(!1), re(0), Ye(0), $e(""), or({});
      He({
        product: null,
        quantity: 0,
        price: 0,
        secondary_qty: 0,
        name: ""
      });
      const a = Te === "Wholesale" ? "Debt" : "Cash";
      ge(a), a === "Cash" && re(0), Gt(null), Br(null), setCustomOrderDate(""), Ur(null), Vr(0), qt(null), ra(""), sa(""), ie.current && (ie.current[g] = null), Ds(), setTimeout(() => se.current?.focus(), 100);
    },
    Re = async (t = !0, a = "Sale") => {
      let r = [...y];
      if (m.product && m.quantity !== 0) {
        const s = r.findIndex(n => n.product_id === m.product.id && n.price === m.price);
        s > -1 ? (r[s].quantity += m.quantity, r[s].secondary_qty += m.secondary_qty) : r = [{
          product_id: m.product.id,
          product_name: m.product.name,
          unit: m.product.unit,
          secondary_unit: m.product.secondary_unit,
          multiplier: m.product.multiplier || 1,
          price: m.price,
          cost_price: m.product.cost_price,
          latest_cost_price: m.product.latest_cost_price,
          quantity: m.quantity,
          secondary_qty: m.secondary_qty,
          stock: m.product.stock,
          accounting_stock: m.product.accounting_stock,
          is_combo: m.product.is_combo,
          active_ingredient: m.product.active_ingredient,
          isPacked: !1,
          cartId: Math.random().toString(36).substr(2, 9)
        }, ...r];
      }
      if (r.length !== 0) {
        J.ui_enable_smart_sorting === "true" && (r = Tn(r)), Zs(!0);
        try {
          const s = {
            partner_id: p ? p.id : null,
            type: "Sale",
            payment_method: I,
            details: r.map(o => ({
              product_id: o.product_id,
              product_name: o.product_name,
              quantity: o.quantity,
              price: o.price
            })),
            note: K,
            amount_paid: oe,
            cash_given: V,
            bank_account_id: I === "Transfer" ? ss : null,
            shipping_status: tt,
            shipping_address: vr,
            shipping_phone: kr,
            date: customOrderDate || (le?.date ? le.date : undefined),
            created_by: JSON.parse(sessionStorage.getItem("user") || "{}").name || JSON.parse(sessionStorage.getItem("user") || "{}").username || "Unknown"
          };
          let n;
          if (Q ? n = await M.put(`/api/orders/${Q}`, s) : n = await M.post("/api/orders", s), ft !== "off" && ha) try {
            tr();
            const h = localStorage.getItem("pos_tts_disable_partner_thankyou") === "true",
              b = (p?.name || "").trim(),
              S = b && b.toLowerCase() !== "khách lẻ" && b.toLowerCase() !== "khách vãng lai" && b.toLowerCase() !== "ncc vãng lai",
              w = h || !S ? "" : b,
              U = (w ? localStorage.getItem("pos_tts_thankyou_partner_template") || "Cảm ơn quý khách" : localStorage.getItem("pos_tts_thankyou_template") || "Cảm ơn quý khách").replace(/{partner}/gi, w || "quý khách").replace(/{customer}/gi, w || "quý khách");
            ht(U);
          } catch (o) {
            console.error("Lỗi đọc cảm ơn:", o);
          }
          const l = {
              ...n.data,
              total_amount: n.data?.total_amount ?? n.data?.total ?? $,
              details: (n.data?.details && n.data.details.length > 0) ? n.data.details : r.map(o => ({
                product_id: o.product_id,
                product_name: o.product_name,
                quantity: o.quantity,
                price: o.price,
                unit: o.unit || "Cái"
              })),
              old_debt: n.data?.old_debt !== void 0 && n.data?.old_debt !== null ? n.data.old_debt : p && p.debt_balance || 0,
              partner_id: p?.id || n.data.partner_id,
              partner_name: p?.name || n.data.partner_name,
              partner_address: p?.address || n.data.partner_address,
              partner_phone: p?.phone || n.data.partner_phone,
              partner: p || n.data.partner || null
            },
            d = n.data?.display_id || n.data?.id || Q || "MỚI";
          if (ir === "card") {
            xn({
              id: d,
              count: r.length,
              total: $,
              partnerName: p ? p.name : "Khách lẻ",
              type: "Sale"
            });
            setTimeout(() => xn(null), 1100);
          } else {
            G({
              message: "Đã lưu đơn hàng thành công!",
              type: "success"
            });
          }
          if (Ur(l), Ys(l), p) {
            const o = r.filter(u => u.product_id).map(u => ({
              product_id: u.product_id,
              price: u.price
            }));
            if (o.length > 0) try {
              await M.post("/api/custom-prices/bulk", {
                partner_id: p.id,
                prices: o
              });
              or(prev => {
                const next = { ...prev };
                o.forEach(item => {
                  const prod = (T || []).find(x => x.id === item.product_id);
                  if (prod && Math.abs((prod.sale_price || 0) - item.price) < 0.001) {
                    delete next[item.product_id];
                  } else if (item.price > 0) {
                    next[item.product_id] = item.price;
                  } else {
                    delete next[item.product_id];
                  }
                });
                return next;
              });
              ws(p.id);
            } catch (u) {
              console.error("Failed to save custom prices:", u);
            }
          }
          pn(a || "Sale");
          E.invalidateQueries({ queryKey: ["shippingSummary"] });
          E.invalidateQueries({ queryKey: ["partners"] });
          E.invalidateQueries({ queryKey: ["products"] });
          E.invalidateQueries({ queryKey: ["orders"] });
          try {
            const syncChan = new BroadcastChannel("pos_data_sync");
            syncChan.postMessage({ type: "ORDER_SAVED", partnerId: p?.id });
            if (p?.id) syncChan.postMessage({ type: "PARTNER_UPDATED", partnerId: p.id });
            syncChan.close();
            window.dispatchEvent(new CustomEvent("pos_data_sync", { detail: { type: "ORDER_SAVED", partnerId: p?.id } }));
            if (p?.id) window.dispatchEvent(new CustomEvent("pos_data_sync", { detail: { type: "PARTNER_UPDATED", partnerId: p.id } }));
          } catch (e) {}
          if (t) {
            const printFn = async () => {
              try {
                await ensureFontLoaded(J?.invoice_font_family, J?.invoice_custom_font_name);
                if (document.fonts && document.fonts.ready) {
                  await document.fonts.ready;
                }
                // Allow browser layout and style recomputation for print-template
                await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
              } catch (e) {}
              window.print();
              setTimeout(() => {
                ga ? (Gt(n.data.id), jr(), Ga(), Ua()) : (Wt(!1), localStorage.removeItem("pos_draft"));
              }, 1e3);
            };
            setTimeout(printFn, 300);
          } else {
            ga ? (Gt(n.data.id), jr(), Ga(), Ua()) : (Wt(!1), localStorage.removeItem("pos_draft"));
            Is();
          }
        } catch (s) {
          G({
            message: s.response?.data?.error || "Lỗi khi lưu đơn hàng",
            type: "error"
          });
        } finally {
          Zs(!1);
        }
      }
    };
  const [historyPartner, setHistoryPartner] = i.useState(null);
  const [isHistoryPanelOpen, setIsHistoryPanelOpen] = i.useState(false);
  const [isDailyHistoryOpen, setIsDailyHistoryOpen] = i.useState(false);
  const [availableTemplates, setAvailableTemplates] = i.useState([]);
  const [currentTemplateId, setCurrentTemplateId] = i.useState(null);
  const [canScrollDown, setCanScrollDown] = i.useState(false);

  const checkCartScroll = i.useCallback(() => {
    const el = cartScrollContainerRef.current;
    if (!el) {
      setCanScrollDown(prev => prev ? false : prev);
      return;
    }
    const hasMore = el.scrollHeight > el.clientHeight + 8 && el.scrollTop < el.scrollHeight - el.clientHeight - 12;
    setCanScrollDown(prev => (prev !== hasMore ? hasMore : prev));
  }, []);

  i.useEffect(() => {
    const el = cartScrollContainerRef.current;
    if (!el) return;
    let debounceTimer = null;
    const debouncedCheck = () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(checkCartScroll, 100);
    };
    checkCartScroll();
    el.addEventListener('scroll', checkCartScroll, { passive: true });
    const ro = new ResizeObserver(debouncedCheck);
    ro.observe(el);
    return () => {
      el.removeEventListener('scroll', checkCartScroll);
      ro.disconnect();
      if (debounceTimer) clearTimeout(debounceTimer);
    };
  }, [ve, Ze, ka, checkCartScroll]);

  const handleScrollDownCart = () => {
    if (cartScrollContainerRef.current) {
      cartScrollContainerRef.current.scrollBy({ top: 220, behavior: 'smooth' });
    }
  };

  i.useEffect(() => {
    if (Ze !== "sidebar" || ka || cartColorConfig?.constrainCartAboveBubbles === false) {
      if (cartScrollContainerRef.current) {
        cartScrollContainerRef.current.style.removeProperty('--cart-bubble-bottom');
      }
      return;
    }

    let debounceTimer = null;
    let observedP = null;
    let observedT = null;

    const ro = new ResizeObserver(() => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(measureAndApply, 50);
    });

    const attachObservers = () => {
      const pEl = partnerBubbleRef.current || document.getElementById('partner-bubble') || document.querySelector('[data-bubble="partner"]');
      const tEl = totalBubbleRef.current || document.getElementById('total-bubble') || document.querySelector('[data-bubble="total"]');
      if (pEl && pEl !== observedP) {
        if (observedP) ro.unobserve(observedP);
        ro.observe(pEl);
        observedP = pEl;
      }
      if (tEl && tEl !== observedT) {
        if (observedT) ro.unobserve(observedT);
        ro.observe(tEl);
        observedT = tEl;
      }
    };

    const measureAndApply = () => {
      if (!cartScrollContainerRef.current) return;
      attachObservers();
      const pEl = partnerBubbleRef.current || document.getElementById('partner-bubble') || document.querySelector('[data-bubble="partner"]');
      const tEl = totalBubbleRef.current || document.getElementById('total-bubble') || document.querySelector('[data-bubble="total"]');
      const pH = pEl ? Math.max(pEl.offsetHeight || 0, Math.round(pEl.getBoundingClientRect?.().height || 0)) : 0;
      const tH = tEl ? Math.max(tEl.offsetHeight || 0, Math.round(tEl.getBoundingClientRect?.().height || 0)) : 0;
      const maxH = Math.max(pH, tH);
      const fallback = (p || g === "remote_inspect") ? 100 : 85;
      const targetH = maxH > 30 ? Math.round(maxH + 20) : fallback;
      const targetVal = `${targetH}px`;
      if (cartScrollContainerRef.current.style.getPropertyValue('--cart-bubble-bottom') !== targetVal) {
        cartScrollContainerRef.current.style.setProperty('--cart-bubble-bottom', targetVal);
      }
      checkCartScroll();
    };

    measureAndApply();

    const rafId = requestAnimationFrame(measureAndApply);
    const timer1 = setTimeout(measureAndApply, 100);
    const timer2 = setTimeout(measureAndApply, 350);

    attachObservers();
    window.addEventListener('resize', measureAndApply, { passive: true });

    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(timer1);
      clearTimeout(timer2);
      ro.disconnect();
      if (debounceTimer) clearTimeout(debounceTimer);
      window.removeEventListener('resize', measureAndApply);
    };
  }, [Ze, ka, cartColorConfig?.constrainCartAboveBubbles, p, y.length, ve.length, I, $, checkCartScroll]);

  i.useEffect(() => {
    const t = a => {
      a.detail && a.detail.action === "save_order" && Re(!1);
    };
    return window.addEventListener("pos_remote_action", t), () => window.removeEventListener("pos_remote_action", t);
  }, [Re]);
  const pl = async t => {
      try {
        const a = await M.get(`/api/orders/${t}`);
        a.data && (await Ka(a.data));
      } catch (a) {
        console.error("Error fetching order", a), G({
          message: "Không tìm thấy hóa đơn",
          type: "error"
        });
      }
    },
    Ka = async t => {
      let orderObj = t;
      if (!orderObj) return;
      if ((!orderObj.details || orderObj.details.length === 0) && orderObj.id) {
        try {
          const res = await M.get(`/api/orders/${orderObj.id}`);
          if (res.data) orderObj = res.data;
        } catch (e) {
          console.error("Error fetching full order details", e);
        }
      }
      Gt(orderObj.id);
      Br(orderObj);
      const detailsList = orderObj.details || orderObj.items || [];
      H(detailsList.map(a => {
        const r = T.find(s => s.id === a.product_id);
        return {
          product_id: a.product_id,
          product_name: a.product_name || a.name || r?.name,
          unit: a.product_unit || a.unit || r?.unit,
          secondary_unit: a.secondary_unit || r?.secondary_unit,
          multiplier: a.multiplier || r?.multiplier || 1,
          price: a.price,
          cost_price: r ? r.cost_price : a.cost_price,
          latest_cost_price: r ? r.latest_cost_price : a.latest_cost_price,
          quantity: a.quantity,
          secondary_qty: a.quantity / (a.multiplier || r?.multiplier || 1),
          stock: r ? r.stock : a.stock || 0,
          latest_audit: r?.latest_audit,
          active_ingredient: a.active_ingredient || r?.active_ingredient,
          is_manual_price: !0,
          isPacked: !1,
          cartId: Math.random().toString(36).substr(2, 9)
        };
      }));
      He({
        product: null,
        quantity: 0,
        price: 0,
        secondary_qty: 0,
        name: ""
      });
      $e(orderObj.note || "");
      re(orderObj.amount_paid !== undefined ? orderObj.amount_paid : 0);
      Ye(orderObj.cash_given !== undefined ? orderObj.cash_given : 0);
      ge(orderObj.payment_method || "Cash");
      qt(orderObj.shipping_status || null);
      ra(orderObj.shipping_address || "");
      sa(orderObj.shipping_phone || "");
      setCustomOrderDate(orderObj.date ? orderObj.date.slice(0, 10) : "");
      
      const ptn = Y.find(p => p.id === orderObj.partner_id);
      const hasStoredOldDebt = orderObj.old_debt !== undefined && orderObj.old_debt !== null;
      const resolvedOldDebt = hasStoredOldDebt ? Number(orderObj.old_debt) : Number(ptn?.debt_balance || 0);
      F(ptn ? { ...ptn, debt_balance: resolvedOldDebt } : (orderObj.partner || null));
      nr(null);

      Ge("");
      ae("");
      Ue(!1);
    },
    na = async t => {
      let a;
      if (t === "prev" ? a = Ce + 1 : a = Math.max(0, Ce - 1), a === 0) {
        Ds();
        if (!ks()) Wt();
        return;
      }
      yn(!0);
      try {
        const r = await M.get(`/api/orders?limit=1&page=${a}&type=Sale`);
        const items = r.data.items || r.data;
        if (items && items.length > 0) {
          let order = items[0];
          if ((!order.details || order.details.length === 0) && order.id) {
            try {
              const fullRes = await M.get(`/api/orders/${order.id}`);
              if (fullRes.data) order = fullRes.data;
            } catch (e) {
              console.error("Error fetching full order details", e);
            }
          }
          await Ka(order);
          Vr(a);
          Ds();
        } else {
          if (t === "prev") {
            G({
              message: "Không còn hóa đơn nào khác",
              type: "info"
            });
          } else {
            if (!ks()) Wt();
          }
        }
      } catch (r) {
        console.error(r);
        G({
          message: "Lỗi khi tải lịch sử hóa đơn",
          type: "error"
        });
      } finally {
        yn(!1);
      }
    },
    _n = async () => {
      try {
        const [t, a] = await Promise.all([M.get("/api/print-templates?module=Sale"), M.get("/api/settings")]);
        let r = {
          ...Tr
        };
        if (a.data && (r = {
          ...r,
          ...a.data
        }), t.data && t.data.length > 0) {
          setAvailableTemplates(t.data);
          const l = t.data.find(d => d.is_default) || t.data[0];
          if (l) {
            setCurrentTemplateId(l.id);
            try {
              const d = typeof l.config === "string" ? JSON.parse(l.config) : l.config;
              r = {
                ...r,
                ...d
              };
            } catch (d) {
              console.error(d);
            }
          }
        } else {
          setAvailableTemplates([]);
          setCurrentTemplateId(null);
        }
        const s = localStorage.getItem("ui_show_doraemon");
        s !== null && (r.ui_show_doraemon = s);
        const n = localStorage.getItem("ui_enable_smart_sorting");
        r.ui_enable_smart_sorting = n !== null ? n : Tr.ui_enable_smart_sorting, Na(r);
      } catch (t) {
        console.error(t);
      }
    },
    handleSelectDefaultTemplate = async (templateId) => {
      try {
        await M.put(`/api/print-templates/${templateId}`, { is_default: true, is_active: true });
        G({
          message: "Đã chọn làm mẫu in mặc định!",
          type: "success"
        });
        await _n();
        try {
          const channel = new BroadcastChannel("pos_data_sync");
          channel.postMessage({ type: "SETTINGS_UPDATED" });
          channel.close();
        } catch (e) {}
      } catch (err) {
        console.error("Error setting default template:", err);
        G({
          message: "Lỗi khi đổi mẫu in mặc định",
          type: "error"
        });
      }
    };
  i.useEffect(() => {
    if (!C) return;
    const handlePaste = (e) => {
      const target = e.target;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
        if (target.type === 'text' || target.type === 'password') return;
      }
      const items = (e.clipboardData || e.originalEvent?.clipboardData)?.items;
      if (!items) return;
      const imageFiles = [];
      for (let idx = 0; idx < items.length; idx++) {
        if (items[idx].type.indexOf('image') !== -1) {
          const blob = items[idx].getAsFile();
          if (blob) imageFiles.push(blob);
        }
      }
      if (imageFiles.length > 0) {
        e.preventDefault();
        const r = imageFiles.map(s => new Promise(n => {
          const l = new FileReader();
          l.onloadend = () => n(l.result);
          l.readAsDataURL(s);
        }));
        Promise.all(r).then(s => {
          we(n => [...n, ...s]);
          G({ message: `Đã dán ${imageFiles.length} ảnh từ Clipboard!`, type: "success" });
        });
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [C]), i.useEffect(() => {
    const t = a => {
      a.key === "ui_show_doraemon" && Na(r => ({
        ...r,
        [a.key]: a.newValue
      }));
    };
    const syncChannel = new BroadcastChannel('pos_data_sync');
    syncChannel.onmessage = (event) => {
      if (event.data?.type === 'SETTINGS_UPDATED') {
        _n();
      }
    };
    window.addEventListener("storage", t);
    return () => {
      window.removeEventListener("storage", t);
      syncChannel.close();
    };
  }, []), i.useEffect(() => {
    va && setTimeout(() => {
      const t = document.getElementById("first-held-card");
      t && t.focus();
    }, 100);
  }, [va]), i.useEffect(() => {
    const t = a => {
      if (a.isComposing || a.keyCode === 229 || !a.key) return;
      if (a.key === "Delete") {
        const o = document.activeElement;
        if (!o || o.tagName !== "INPUT" && o.tagName !== "TEXTAREA" && o.getAttribute("contenteditable") !== "true" || o === se.current) {
          a.preventDefault(), a.stopPropagation(), Wa(""), gr(!0);
          return;
        }
      }
      const r = Date.now();
      if (a.key.length === 1 && !a.ctrlKey && !a.altKey && !a.metaKey) {
        const o = r - ma.current;
        if (ma.current = r, o > 150 ? qe.current = a.key : qe.current += a.key, o < 45) {
          const u = document.activeElement;
          u && (u.tagName === "INPUT" || u.tagName === "TEXTAREA") || (a.preventDefault(), a.stopPropagation()), A.current && (clearTimeout(A.current), A.current = null);
        }
      } else if (a.key === "Enter") {
        const o = r - ma.current,
          u = qe.current;
        if (o < 45 && u.length >= 4) {
          if (a.preventDefault(), a.stopPropagation(), qe.current = "", _s.current(u, Nr.current) || G({
            message: `Mã vạch ${u} không tồn tại`,
            type: "error"
          }), document.activeElement && (document.activeElement.tagName === "INPUT" || document.activeElement.tagName === "TEXTAREA")) {
            const h = document.activeElement,
              b = u[0];
            if (h.value.endsWith(u)) try {
              const S = h.tagName === "TEXTAREA" ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype;
              Object.getOwnPropertyDescriptor(S, "value").set.call(h, h.value.slice(0, -u.length)), h.dispatchEvent(new Event("input", {
                bubbles: !0
              }));
            } catch {
              h.value = h.value.slice(0, -u.length);
            } else if (b && h.value.endsWith(b)) try {
              const S = h.tagName === "TEXTAREA" ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype;
              Object.getOwnPropertyDescriptor(S, "value").set.call(h, h.value.slice(0, -1)), h.dispatchEvent(new Event("input", {
                bubbles: !0
              }));
            } catch {
              h.value = h.value.slice(0, -1);
            }
          }
          return;
        }
        qe.current = "";
      }
      if (a.ctrlKey && (a.code === "Space" || a.key === " ")) {
        a.preventDefault(), a.stopPropagation(), St(o => !o);
        return;
      }
      if ((a.ctrlKey || a.metaKey) && !a.altKey && (a.key === "z" || a.key === "Z")) {
        a.preventDefault();
        a.stopPropagation();
        if (a.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
        return;
      }
      if ((a.ctrlKey || a.metaKey) && !a.altKey && (a.key === "y" || a.key === "Y")) {
        a.preventDefault();
        a.stopPropagation();
        handleRedo();
        return;
      }
      if (a.key === "Home") {
        a.preventDefault();
        a.stopPropagation();
        if (ve && ve.length > 0) {
          const nextIdx = ve.findIndex(item => !item.isPacked);
          if (nextIdx !== -1) {
            xl(nextIdx);
            document.getElementById(`cart-row-${nextIdx}`)?.scrollIntoView({ block: "nearest", behavior: "smooth" });
          } else {
            G({
              message: "Đã soạn xong toàn bộ danh sách hàng!",
              type: "success"
            });
            try {
              ht("Đã soạn xong");
            } catch {}
          }
        }
        return;
      }
      a.key === "Tab" && zs();
      const s = a.key.toUpperCase();
      if (s === (J.kb_cash || "F1").toUpperCase()) {
        a.preventDefault(), a.stopPropagation();
        const o = document.getElementById("cash-given-compact"),
          u = document.getElementById("cash-given-sidebar"),
          h = o && o.offsetParent !== null ? o : u;
        h ? (h.focus(), h.select()) : (xr.current?.focus(), xr.current?.select());
      }
      if (s === (J.kb_partner || "F3").toUpperCase()) {
        a.preventDefault(), a.stopPropagation(), W(!1), zi(!0), setTimeout(() => {
          Et.current?.focus(), Et.current?.select();
        }, 50);
        return;
      }
      if (a.key === "Escape") tr(), (Me || va || ds || dr || pr || ps || Z || Tt !== null || lr || gs || Qt) && (Ue(!1), St(!1), Sa(!1), cr(!1), ur(!1), vt(!1), ae(""), ct(null), kt(!1), as(!1), La(!1), Dt(!1));else if (s === "F2" && a.shiftKey) {
        if (a.preventDefault(), m.product) {
          const o = se.current?.getBoundingClientRect();
          Xt(m.product), o && za({
            top: o.top,
            bottom: o.bottom,
            left: o.left,
            right: o.right
          }), Dt(!0);
        }
      } else if (s === (J.kb_search || "F2").toUpperCase()) {
        a.preventDefault();
        a.stopPropagation();
        const o = document.activeElement;
        if (o && o.id && o.id.startsWith("row-name-")) {
          const u = parseInt(o.id.replace("row-name-", "")),
            h = ve[u];
          if (h) {
            const b = T.find(S => S.id === h.product_id);
            b && (Vt(b), vt(!0));
          }
        } else se.current?.focus(), se.current?.select?.();
      } else if (s === (J.kb_save || "F12").toUpperCase()) {
        a.preventDefault();
        a.stopPropagation();
        Re(!1);
      } else if (s === (J.kb_pay || "F9").toUpperCase()) {
        a.preventDefault();
        a.stopPropagation();
        Re(!0);
      } else if (s === (J.kb_new || "F4").toUpperCase()) {
        a.preventDefault();
        a.stopPropagation();
        Wt();
      } else if (s === (J.kb_hold || "F8").toUpperCase()) {
        a.preventDefault();
        a.stopPropagation();
        wr();
      } else if (s === (J.kb_custom || "F6").toUpperCase()) {
        a.preventDefault();
        a.stopPropagation();
        La(!0);
        $a({
          name: "",
          price: ""
        });
        setTimeout(() => {
          ys.current?.focus();
        }, 100);
      } else if (s === (J.kb_speech || "F10").toUpperCase()) {
        a.preventDefault();
        a.stopPropagation();
        ft !== "off" && xa && (tr(), console.log("F10 calling speakNumber with:", $), ht($, !0, p?.name));
      } else if (a.key === "Insert") {
        a.preventDefault();
        a.stopPropagation();
        m && m.product && He(o => ({
          ...o,
          quantity: o.quantity * -1,
          secondary_qty: o.secondary_qty * -1
        }));
      } else if (a.ctrlKey && a.key === "ArrowUp") {
        a.preventDefault();
        a.stopPropagation();
        const o = [...fe];
        q && o.push({
          id: "remote_inspect"
        });
        const u = o.findIndex(h => h.id === g);
        if (u > 0) {
          const h = o[u - 1];
          h.id === "remote_inspect" ? f("remote_inspect") : es(h.id);
        }
      } else if (a.ctrlKey && a.key === "ArrowDown") {
        a.preventDefault();
        a.stopPropagation();
        const o = [...fe];
        q && o.push({
          id: "remote_inspect"
        });
        const u = o.findIndex(h => h.id === g);
        if (u !== -1 && u < o.length - 1) {
          const h = o[u + 1];
          h.id === "remote_inspect" ? f("remote_inspect") : es(h.id);
        }
      } else if (a.ctrlKey && (a.key === "s" || a.key === "S")) {
        a.preventDefault();
        a.stopPropagation();
        setIsDailyHistoryOpen(prev => !prev);
      } else if (a.ctrlKey && a.key === "ArrowLeft") {
        a.preventDefault();
        a.stopPropagation();
        na("prev");
      } else if (a.ctrlKey && a.key === "ArrowRight") {
        a.preventDefault();
        a.stopPropagation();
        na("next");
      }
      const n = a.key.length === 1,
        l = !a.ctrlKey && !a.altKey && !a.metaKey,
        d = a.target.tagName !== "INPUT" && a.target.tagName !== "TEXTAREA";
      console.log("[Keydown Debug] target:", a.target ? a.target.tagName : "null", "key:", a.key, "x:", d), n && l && d && (A.current && clearTimeout(A.current), A.current = setTimeout(() => {
        Sl();
      }, 50));
    };
    return window.addEventListener("keydown", t, !0), () => window.removeEventListener("keydown", t, !0);
  }, [y, p, oe, K, J, Me, va, ds, dr, pr, ps, Z, Tt, gs, Ce, V, I, tt, vr, kr, Re, m, Qt, $, ft, ve, Za, er, xa, ha]);
  const ks = () => {
    const t = localStorage.getItem("pos_draft");
    if (t) try {
      const a = JSON.parse(t);
      if (H(a.cart || []), $e(a.note || ""), re(a.amountPaid || 0), ge(a.paymentMethod || (localStorage.getItem("unified_pos_mode") === "Wholesale" ? "Debt" : "Cash")), Ye(a.cashGiven || 0), a.selectedPartnerId) {
        const r = Y.find(s => s.id === a.selectedPartnerId);
        F(r || null);
      } else F(null);
      return Gt(null), Br(null), Vr(0), !0;
    } catch (a) {
      console.error("Error loading draft", a);
    }
    return !1;
  };
  i.useEffect(() => {
    if (_n(), Nn(), Ut.state?.editOrder || ks(), Ut.state?.editOrder) {
      const t = Ut.state.editOrder;
      Ka(t);
    } else {
      const t = new URLSearchParams(window.location.search),
        a = t.get("edit"),
        r = t.get("partner_id");
      a ? pl(a) : (r && nr(r), Q && (ks() || Wt(!1)));
    }
    Zi(!0);
  }, [Ut.search, Ut.state]);
  const ul = t => {
    Oi(t), localStorage.setItem("unified_pos_mode", t), y.length === 0 && !Q && ge(t === "Wholesale" ? "Debt" : "Cash");
  };
  i.useEffect(() => {
    I === "Cash" && re($);
  }, [I, $]), i.useEffect(() => {
    if (gn && !Q) {
      const t = {
        cart: y,
        selectedPartnerId: p?.id,
        note: K,
        amountPaid: oe,
        paymentMethod: I,
        cashGiven: V
      };
      localStorage.setItem("pos_draft", JSON.stringify(t));
    }
  }, [y, p, K, oe, I, V, Q, gn]), i.useEffect(() => {
    localStorage.setItem("held_invoices", JSON.stringify(Fe));
  }, [Fe]), i.useEffect(() => {
    if (Y.length > 0) {
      if (Fr) {
        const t = Y.find(a => a.id == Fr);
        t && (F(t), nr(null), Ge(""));
      } else if (p) {
        const t = Y.find(a => a.id === p.id);
        t && t.debt_balance !== p.debt_balance && F(t);
      }
    }
  }, [Y, Fr, Q, Ut.state]), i.useEffect(() => {
    p?.id && !Q && (async () => {
      try {
        const t = await M.post(`/api/partners/${p.id}/recalculate-debt`);
        if (t.data.new_balance !== void 0) {
          F(a => !a || a.id !== p.id || a.debt_balance === t.data.new_balance ? a : {
            ...a,
            debt_balance: t.data.new_balance
          });
          _((prevTabs) => {
            const hasChange = prevTabs.some((tab) => tab.selectedPartner?.id === p.id && tab.selectedPartner?.debt_balance !== t.data.new_balance);
            if (!hasChange) return prevTabs;
            return prevTabs.map((tab) =>
              tab.selectedPartner?.id === p.id
                ? { ...tab, selectedPartner: { ...tab.selectedPartner, debt_balance: t.data.new_balance } }
                : tab
            );
          });
        }
      } catch (t) {
        console.error("Error auto-syncing debt:", t);
      }
    })();
  }, [p?.id, g, Q]);
  const ml = async t => {
      try {
        await M.post("/api/inventory/audit", t), G({
          message: "Đã cập nhật kho thành công!",
          type: "success"
        }), E.invalidateQueries(["products"]);
        const a = new BroadcastChannel("pos_data_sync");
        a.postMessage({
          type: "PRODUCT_UPDATED"
        }), a.close();
      } catch (a) {
        throw console.error(a), G({
          message: "Lỗi khi cập nhật kho",
          type: "error"
        }), a;
      }
    },
    Nn = async () => {
      try {
        const t = await M.get("/api/bank-accounts");
        Ai(t.data), t.data.length > 0 && ns(t.data[0].id);
      } catch (t) {
        console.error(t);
      }
    },
    fetchPartnerPurchases = async t => {
      setPartnerLastPurchases({});
      if (!t) return;
      try {
        const a = await M.get(`/api/partners/${t}/last-purchases`);
        setPartnerLastPurchases(a.data || {});
      } catch (a) {
        console.error("Error fetching partner last purchases:", a);
      }
    },
    ws = async t => {
      or({});
      if (!t) return;
      try {
        const a = await M.get(`/api/custom-prices/${t}`);
        or(a.data || {});
      } catch (a) {
        console.error(a);
      }
    };
  i.useEffect(() => {
    if (p && p.id) {
      ws(p.id);
      fetchPartnerPurchases(p.id);
      Js(!0);
      Kt("debt");
      M.get(`/api/partners/${p.id}/ledger`).then(t => {
        const a = t.data?.ledger || [],
          r = a.find(n => n.type === "Order" && n.payment_method === "Debt" && (n.increase > 0 || n.obj && n.obj.total_amount > 0)),
          s = a.find(n => n.type === "Order" && n.payment_method !== "Debt" && (n.increase > 0 || n.obj && n.obj.total_amount > 0));
        Hr(r || null);
        Kr(s || null);
      }).catch(t => {
        console.error("Error fetching partner ledger:", t);
        Hr(null);
        Kr(null);
      }).finally(() => {
        Js(!1);
      });
    } else {
      or({});
      setPartnerLastPurchases({});
      Hr(null);
      Kr(null);
      Kt("debt");
    }
  }, [p?.id]), i.useEffect(() => {
    const t = a => {
      document.body.contains(a.target) && !(Wr.current && Wr.current.contains(a.target) || Rr.current && Rr.current.contains(a.target)) && !a.target.closest(".partner-popout-trigger") && Gr(!1);
    };
    return document.addEventListener("mousedown", t), () => document.removeEventListener("mousedown", t);
  }, []), i.useEffect(() => {
    if (!he) return;
    const t = Array.isArray(he) ? he : he.items || [];
    H(a => {
      if (a.length === 0) return a;
      let r = !1;
      const s = a.map(n => {
        const l = t.find(d => d.id === n.product_id);
        if (l) {
          const d = l.stock !== n.stock,
            o = l.unit !== n.unit || l.multiplier !== n.multiplier || l.secondary_unit !== n.secondary_unit;
          const hasCustomPrice = Boolean(p && p.id && R && R[n.product_id] !== void 0);
          let u = hasCustomPrice ? R[n.product_id] : l.sale_price;
          if (l.bulk_quantity > 0 && n.quantity >= l.bulk_quantity && !hasCustomPrice) {
            u = l.bulk_price || u;
          }
          const h = !n.is_manual_price && n.price !== u;
          if (d || o || h) return r = !0, {
            ...n,
            cost_price: l.cost_price,
            stock: l.stock,
            unit: l.unit,
            multiplier: l.multiplier || 1,
            secondary_unit: l.secondary_unit,
            latest_audit: l.latest_audit,
            latest_stock_entry: l.latest_stock_entry,
            price: h ? u : n.price
          };
        }
        return n;
      });
      return r ? s : a;
    });
  }, [he, R, y.length, p?.id]), i.useEffect(() => {
    I === "Cash" && re($);
  }, [$, I]);
  const Ga = async () => {
      try {
        await E.invalidateQueries({
          queryKey: ["products"]
        });
      } catch (t) {
        console.error(t);
      }
    },
    Ua = async () => {
      try {
        await E.invalidateQueries({
          queryKey: ["partners"]
        });
      } catch (t) {
        console.error(t);
      }
    },
    jr = async () => {
      if (p) try {
        const {
            data: t
          } = await M.get("/api/partners"),
          a = t.find(r => r.id === p.id);
        a && F(a), await E.invalidateQueries({
          queryKey: ["partners"]
        });
      } catch (t) {
        console.error("Error syncing partner balance:", t);
      }
    },
    ia = (t, a = null, r = null) => {
      if (g === "remote_inspect" && q) {
        const b = k?.cart || [],
          S = a !== null ? a : 1,
          w = t.sale_price,
          hasCustomPriceInspect = Boolean(k?.partner?.id && R && R[t.id] !== void 0),
          O = hasCustomPriceInspect ? R[t.id] : w,
          U = r !== null && r !== O,
          L = b.find(ee => (t.id !== null ? ee.product_id === t.id : ee.product_id === null && ee.product_name === t.name) && (U ? ee.price === (r !== null ? r : O) : !ee.is_manual_price)),
          ce = (L ? L.quantity : 0) + S;
        let Rt = r !== null ? r : O;
        t.bulk_quantity > 0 && ce >= t.bulk_quantity && r === null && !U && !hasCustomPriceInspect && (Rt = t.bulk_price || O);
        let Sr = [];
        if (L) ce === 0 ? Sr = b.filter(ee => (ee.id || ee.cartId) !== (L.id || L.cartId)) : Sr = b.map(ee => (ee.id || ee.cartId) === (L.id || L.cartId) ? {
          ...ee,
          quantity: ce,
          price: Rt,
          secondary_qty: ce / (ee.multiplier || 1),
          is_manual_price: U || ee.is_manual_price,
          isPacked: ee.isPacked || !1
        } : ee);else {
          const ee = Math.random().toString(36).substr(2, 9);
          Sr = [{
            id: ee,
            cartId: ee,
            product_id: t.id,
            product_name: t.name,
            unit: t.unit,
            secondary_unit: t.secondary_unit,
            multiplier: t.multiplier || 1,
            price: Rt,
            cost_price: t.cost_price,
            latest_cost_price: t.latest_cost_price,
            quantity: S,
            secondary_qty: S / (t.multiplier || 1),
            stock: t.stock,
            accounting_stock: t.accounting_stock,
            latest_audit: t.latest_audit,
            latest_stock_entry: t.latest_stock_entry,
            is_combo: t.is_combo,
            active_ingredient: t.active_ingredient,
            is_manual_price: U,
            isPacked: !1
          }, ...b];
        }
        Ra(Sr), ae(""), Ft(0), He({
          product: null,
          quantity: 0,
          price: 0,
          secondary_qty: 0,
          name: ""
        }), requestAnimationFrame(() => {
          const ee = se.current;
          ee && (ee.focus(), ee.select?.());
        });
        return;
      }
      const s = a !== null ? a : 1,
        n = t.sale_price,
        hasCustomPrice = Boolean(p && p.id && R && R[t.id] !== void 0),
        l = hasCustomPrice ? R[t.id] : n,
        d = r !== null && r !== l,
        o = y.find(b => (t.id !== null ? b.product_id === t.id : b.product_id === null && b.product_name === t.name) && (d ? b.price === (r !== null ? r : l) : !b.is_manual_price)),
        u = (o ? o.quantity : 0) + s;
      let h = r !== null ? r : l;
      if (t.bulk_quantity > 0 && u >= t.bulk_quantity && r === null && !d && !hasCustomPrice && (h = t.bulk_price || l), H(o ? u === 0 ? y.filter(b => b.cartId !== o.cartId) : y.map(b => b.cartId === o.cartId ? {
        ...b,
        quantity: u,
        price: h,
        secondary_qty: u / (b.multiplier || 1),
        is_manual_price: d || b.is_manual_price,
        isPacked: b.isPacked || !1
      } : b) : [{
        product_id: t.id,
        product_name: t.name,
        unit: t.unit,
        secondary_unit: t.secondary_unit,
        multiplier: t.multiplier || 1,
        price: h,
        cost_price: t.cost_price,
        latest_cost_price: t.latest_cost_price,
        quantity: s,
        secondary_qty: s / (t.multiplier || 1),
        stock: t.stock,
        accounting_stock: t.accounting_stock,
        latest_audit: t.latest_audit,
        latest_stock_entry: t.latest_stock_entry,
        is_combo: t.is_combo,
        active_ingredient: t.active_ingredient,
        is_manual_price: d,
        isPacked: !1,
        cartId: Math.random().toString(36).substr(2, 9)
      }, ...y]), setTimeout(() => {
        playAddToCartSound(soundThemeCartAdd);
      }, 15), ft !== "off" && localStorage.getItem("pos_tts_enable_cart_addition") !== "false" && s !== 0) {
        const b = Za && localStorage.getItem("pos_tts_enable_cart_product_name") !== "false",
          S = localStorage.getItem("pos_tts_cart_speech_order") || "name_first";
        setTimeout(() => {
          if (window.cartSpeechTimeout && (clearTimeout(window.cartSpeechTimeout), window.cartSpeechTimeout = null), u === 0) ht("Đã xóa");else {
            const w = u < 0,
              O = Math.abs(u),
              U = w ? `Trả hàng ${O}` : O;
            const shouldReadQty = er;
            const fullProduct = T.find(p => p.id === t.id) || t;
            const rawAlias = (fullProduct.alias && fullProduct.alias.trim()) || (t.alias && t.alias.trim()) || "";
            const hasAlias = Boolean(rawAlias);
            const alias = rawAlias;
            const isFirstAdd = !o; // Nếu chưa có trong giỏ hàng thì mới đọc tên alias
            
            if (b && hasAlias && isFirstAdd && shouldReadQty) {
              S === "qty_first" 
                ? speakAudioSequence([U, alias]) 
                : speakAudioSequence([alias, U]);
              rr.current[g] = t.id;
            } else if (b && hasAlias && isFirstAdd) {
              speakAudioSequence([alias]);
              rr.current[g] = t.id;
            } else if (shouldReadQty) {
              ht(U);
              rr.current[g] = t.id;
            }
          }
        }, 25);
      }
      ae(""), Ft(0), He({
        product: null,
        quantity: 0,
        price: 0,
        secondary_qty: 0,
        name: ""
      }), requestAnimationFrame(() => {
        const b = se.current;
        b && (b.focus(), b.select?.());
      });
    },
    xl = t => {
      const a = ve[t];
      if (a) {
        const nextPacked = !a.isPacked;
        H(r => r.map(s => s.cartId === a.cartId ? {
          ...s,
          isPacked: nextPacked
        } : s));
        if (nextPacked && ft !== "off") {
          const r = T.find(n => n.id === a.product_id) || a,
            rawAlias = (r.alias && r.alias.trim()) || (a.alias && a.alias.trim()) || "",
            alias = rawAlias || a.product_name,
            qty = a.quantity,
            b = Za && localStorage.getItem("pos_tts_enable_cart_product_name") !== "false",
            S = localStorage.getItem("pos_tts_cart_speech_order") || "name_first",
            shouldReadQty = er;

          const tokens = [];
          if (b && alias && shouldReadQty) {
            S === "qty_first" ? tokens.push(qty, alias) : tokens.push(alias, qty);
          } else if (b && alias) {
            tokens.push(alias);
          } else if (shouldReadQty) {
            tokens.push(qty);
          } else {
            tokens.push(alias, qty);
          }

          if (tokens.length > 0) {
            speakAudioSequence(tokens);
          }
        }
      }
    },
    _r = (t, a, r) => {
      const s = ve[t];
      s && H(n => n.map(l => {
        if (l.cartId !== s.cartId) return l;
        const d = {
          ...l
        };
        if (a === "secondary_qty" ? (d.secondary_qty = r, d.quantity = r * (d.multiplier || 1)) : a === "quantity" ? (d.quantity = r, d.secondary_qty = Math.round(((r / (d.multiplier || 1)) + Number.EPSILON) * 1000) / 1000) : a === "price" ? (d.price = r, d.is_manual_price = !0) : d[a] = r, (a === "quantity" || a === "secondary_qty") && !d.is_manual_price) {
          const o = T.find(u => u.id === d.product_id);
          if (o) {
            const hasCustomPrice = Boolean(p && p.id && R && R[o.id] !== void 0);
            const u = hasCustomPrice ? R[o.id] : o.sale_price;
            o.bulk_quantity > 0 && d.quantity >= o.bulk_quantity && !hasCustomPrice ? d.price = o.bulk_price || u : d.price = u;
          }
        }
        return d;
      }));
    },
    hl = (t, a, r = 1) => {
      if (t === g) {
        const d = a.sale_price,
          hasCustomPrice = Boolean(p && p.id && R && R[a.id] !== void 0),
          o = hasCustomPrice ? R[a.id] : d;
        ia(a, r, o);
        return;
      }
      const s = fe.find(d => d.id === t),
        n = s ? s.name : `Đơn #${t}`,
        l = Date.now() + Math.random();
      if (Bs(d => [...d, {
        id: l,
        productName: a.name,
        qty: r,
        tabName: n
      }]), setTimeout(() => {
        Bs(d => d.filter(o => o.id !== l));
      }, 2500), _(d => d.map(o => {
        if (o.id !== t) return o;
        const u = a.sale_price;
        let h = u;
        a.bulk_quantity > 0 && r >= a.bulk_quantity && (h = a.bulk_price || u);
        const b = o.cart.findIndex(w => w.product_id === a.id && !w.is_manual_price);
        let S;
        if (b > -1) {
          const w = o.cart[b].quantity + r;
          w <= 0 ? S = o.cart.filter((O, U) => U !== b) : S = o.cart.map((O, U) => U !== b ? O : {
            ...O,
            quantity: w,
            price: a.bulk_quantity > 0 && w >= a.bulk_quantity && a.bulk_price || O.price,
            secondary_qty: w / (O.multiplier || 1)
          });
        } else r > 0 ? S = [{
          product_id: a.id,
          product_name: a.name,
          unit: a.unit,
          secondary_unit: a.secondary_unit,
          multiplier: a.multiplier || 1,
          price: h,
          cost_price: a.cost_price,
          latest_cost_price: a.latest_cost_price,
          quantity: r,
          secondary_qty: r / (a.multiplier || 1),
          stock: a.stock,
          latest_audit: a.latest_audit,
          latest_stock_entry: a.latest_stock_entry,
          is_combo: a.is_combo,
          active_ingredient: a.active_ingredient,
          is_manual_price: !1,
          isPacked: !1,
          cartId: Math.random().toString(36).substr(2, 9)
        }, ...o.cart] : S = o.cart;
        return {
          ...o,
          cart: S
        };
      })), s) {
        const d = s.cart.findIndex(o => o.product_id === a.id && !o.is_manual_price);
        d > -1 && s.cart[d].quantity;
      }
    },
    js = (t, a = null) => {
      const r = a !== null ? a : Nr.current || g;
      if (t) {
        const u = t.trim().toUpperCase();
        if (u === "THANHTOAN" || u === "THANH_TOAN" || u === "PAY" || u === "IN" || u === "IN_HOA_DON") return Re(!0), !0;
        if (u === "LUUDON" || u === "LUU_DON" || u === "SAVE") return Re(!1), !0;
        if (u === "CMD-TRU" || u === "CMD_TRU" || u === "TRU" || u === "GIAM" || u === "CMD-SUBTRACT") return Ht("subtract"), !0;
        if (u === "CMD-XOA" || u === "CMD_XOA" || u === "XOA" || u === "DELETE" || u === "CMD-DELETE") return Ht("delete"), !0;
        if (u === "CMD-CONG" || u === "CMD_CONG" || u === "CONG" || u === "ADD" || u === "CMD-ADD") return Ht("add"), !0;
      }
      let s = null,
        n = 1,
        l = gt === "delete",
        d = gt === "subtract",
        o = t ? t.trim() : "";
      if (o.toUpperCase().startsWith("DEL-") ? (l = !0, o = o.substring(4)) : o.toUpperCase().startsWith("DELETE-") ? (l = !0, o = o.substring(7)) : o.startsWith("-") && (d = !0, o = o.substring(1)), s = T.find(u => u.code === o || u.barcode === o), !s && o.includes("-")) {
        const u = o.split("-"),
          h = parseInt(u.pop(), 10);
        if (!isNaN(h) && h > 0) {
          const b = u.join("-");
          s = T.find(S => S.code === b || S.barcode === b), s && (n = h);
        }
      }
      if (s) {
        const u = l ? -999999 : d ? -n : n;
        return hl(r, s, u), gt !== "add" && Ht("add"), !0;
      }
      return !1;
    },
    _s = i.useRef(js);
  i.useEffect(() => {
    _s.current = js;
  });
  const Nr = i.useRef(ne);
  i.useEffect(() => {
    Nr.current = ne;
  }, [ne]), i.useEffect(() => {
    if (!bt) return;
    let t = !0;
    const a = async () => {
        try {
          let s = !0;
          for (; s && t;) {
            const n = await M.get("/api/remote-scans/pop");
            if (!t) break;
            if (n.data && n.data.barcode) {
              const l = n.data.barcode;
              _s.current(l, Nr.current) || G({
                message: `Mã vạch ${l} không tồn tại`,
                type: "error"
              });
            } else s = !1;
          }
        } catch {}
      },
      r = setInterval(() => {
        t && a();
      }, 500);
    return () => {
      t = !1, clearInterval(r);
    };
  }, [bt]);
  const bl = t => {
      const a = ve[t];
      a && H(r => r.filter(s => s.cartId !== a.cartId));
    },
    Cn = (t, a) => {
      t && (H([{
        product_id: null,
        product_name: t,
        unit: "Món",
        secondary_unit: null,
        multiplier: 1,
        price: a,
        cost_price: 0,
        quantity: 1,
        secondary_qty: 1,
        stock: 0,
        is_combo: !1,
        active_ingredient: "",
        isPacked: !1,
        cartId: Math.random().toString(36).substr(2, 9)
      }, ...y]), La(!1), $a({
        name: "",
        price: ""
      }), setTimeout(() => {
        se.current?.focus();
      }, 10));
    },
    gl = t => {
      et({
        title: "Xác nhận xóa nợ sổ tay",
        message: `Bạn có chắc chắn muốn xóa khoản nợ ${z(t.total_amount)} VNĐ của ${p?.name}?`,
        onConfirm: async () => {
          try {
            const a = t.id.toString().replace("v_", "");
            await M.delete(`/api/vouchers/${a}`), G({
              message: "Đã xóa khoản nợ thành công!",
              type: "success"
            }), E.invalidateQueries(["partners"]);
            const r = new BroadcastChannel("pos_data_sync");
            r.postMessage({
              type: "PARTNER_UPDATED"
            }), r.close(), kt(!1);
          } catch {
            G({
              message: "Lỗi khi xóa khoản nợ",
              type: "error"
            });
          } finally {
            et(null);
          }
        }
      });
    },
    Sn = t => {
      et({
        title: "Xác nhận hủy đơn hàng",
        message: `Bạn có chắc chắn muốn hủy đơn hàng #${t.display_id || t.id}?`,
        onConfirm: async () => {
          try {
            await M.delete(`/api/orders/${t.id}`), G({
              message: "Đã hủy đơn hàng!",
              type: "success"
            }), kt(!1), Ga(), Ua();
            const r = new BroadcastChannel("pos_data_sync");
            r.postMessage({
              type: "ORDER_DELETED",
              id: t.id
            }), r.close();
          } catch {
            G({
              message: "Lỗi khi hủy đơn hàng",
              type: "error"
            });
          } finally {
            et(null);
          }
        }
      });
    },
    Ba = i.useMemo(() => T.map(t => ({
      ...t,
      _normName: xt((t.name || "").toLowerCase()),
      _normCode: xt((t.code || "").toLowerCase()),
      _normActive: xt((t.active_ingredient || "").toLowerCase()),
      _lowName: (t.name || "").toLowerCase(),
      _lowCode: (t.code || "").toLowerCase(),
      _lowActive: (t.active_ingredient || "").toLowerCase()
    })), [T]),
    cartFilteredProducts = i.useMemo(() => {
      const t = (zt || "").toLowerCase().trim(),
        a = xt(t);
      return t ? Ba.filter(r => r._lowName.includes(t) || r._normName.includes(a) || r._lowCode.includes(t) || r._normCode.includes(a) || r._lowActive.includes(t) || r._normActive.includes(a)).sort((r, s) => {
        const n = o => o._lowName.startsWith(t) ? 0 : o._normName.startsWith(a) ? 1 : o._lowName.includes(t) ? 2 : o._normName.includes(a) ? 3 : o._lowCode.startsWith(t) ? 4 : o._normCode.startsWith(a) ? 5 : o._lowCode.includes(t) || o._normCode.includes(a) ? 6 : o._lowActive.startsWith(t) || o._normActive.startsWith(a) ? 7 : o._lowActive.includes(t) || o._normActive.includes(a) ? 8 : 9,
          l = n(r),
          d = n(s);
        return l !== d ? l - d : r._lowName.localeCompare(s._lowName, "vi", {
          sensitivity: "base"
        });
      }).slice(0, 20) : Ba.slice(0, 20);
    }, [Ba, zt]),
    wt = i.useMemo(() => {
      const t = Z.toLowerCase(),
        a = xt(t);
      return t ? Ba.filter(r => r._lowName.includes(t) || r._normName.includes(a) || r._lowCode.includes(t) || r._normCode.includes(a) || r._lowActive.includes(t) || r._normActive.includes(a)).sort((r, s) => {
        const n = o => o._lowName.startsWith(t) ? 0 : o._normName.startsWith(a) ? 1 : o._lowName.includes(t) ? 2 : o._normName.includes(a) ? 3 : o._lowCode.startsWith(t) ? 4 : o._normCode.startsWith(a) ? 5 : o._lowCode.includes(t) || o._normCode.includes(a) ? 6 : o._lowActive.startsWith(t) || o._normActive.startsWith(a) ? 7 : o._lowActive.includes(t) || o._normActive.includes(a) ? 8 : 9,
          l = n(r),
          d = n(s);
        return l !== d ? l - d : r._lowName.localeCompare(s._lowName, "vi", {
          sensitivity: "base"
        });
      }).slice(0, 20) : Ba.slice(0, 20);
    }, [Ba, Z]),
    Cr = i.useMemo(() => {
      const t = yt.toLowerCase(),
        a = parseInt(t),
        r = xt(t);
      return Y.filter(s => {
        const n = !isNaN(a) && s.id === a,
          l = (s.name || "").toLowerCase();
        return n || l.includes(t) || xt(l).includes(r) || (s.phone || "").includes(t);
      }).sort((s, n) => {
        if (!isNaN(a)) {
          if (s.id === a) return -1;
          if (n.id === a) return 1;
        }
        const l = (s.name || "").toLowerCase(),
          d = (n.name || "").toLowerCase(),
          o = l.startsWith(t),
          u = d.startsWith(t);
        return o && !u ? -1 : !o && u ? 1 : l.localeCompare(d, "vi", {
          sensitivity: "base"
        });
      }).slice(0, 25);
    }, [Y, yt]),
    fl = i.useCallback(() => {
      nn(!0);
    }, []),
    Ns = i.useCallback(() => {
      nn(!1);
    }, []),
    Cs = i.useCallback(t => {
      if (wa) {
        const a = t.clientX / window.innerWidth * 100;
        a > 50 && a < 85 && qi(a);
      }
    }, [wa]);
  i.useEffect(() => {
    const handleAddProduct = (e) => {
      if (!e || !e.detail) return;
      const { productId, product, quantity } = e.detail;
      const targetProd = (T && T.find(p => p.id === productId || (product && (p.id === product.id || p.name === product.name)))) || product;
      if (targetProd) {
        ia(targetProd, quantity || 1);
      }
    };
    window.addEventListener('pos_add_product_by_id', handleAddProduct);
    return () => window.removeEventListener('pos_add_product_by_id', handleAddProduct);
  }, [ia, T]);
  i.useEffect(() => {
    if (!wa) return;
    window.addEventListener("mousemove", Cs);
    window.addEventListener("mouseup", Ns);
    return () => {
      window.removeEventListener("mousemove", Cs);
      window.removeEventListener("mouseup", Ns);
    };
  }, [wa, Cs, Ns]);
  return <Comp_fd reducedMotion={Ya ? "always" : "no-preference"} transition={Ya ? {
    type: "just"
  } : void 0}><><div id="pos-root-container" style={{
    '--pos-accent': Je.accent,
    '--radius-pos': `${Je.radius}rem`,
    '--bg-transparent-blur': `${Je.blur}px`
  }} className={c("flex flex-col h-screen bg-transparent font-sans overflow-hidden transition-colors relative z-0", Ya && "gpu-disabled-mode")}><div className="flex-1 flex flex-col overflow-hidden no-print"><div className="p-3.5 px-5 flex gap-5 items-center justify-between print:hidden transition-colors relative z-[3000] bg-transparent"><div className="flex items-center gap-3 shrink-0"><div className="flex items-center gap-3 group cursor-default relative"><div className="flex flex-col"><h1 className="text-2xl font-black text-[#2d5016] dark:text-[#d4a574] uppercase tracking-tighter flex items-center gap-2 leading-none" style={{ color: cartColorConfig?.accentColor && cartColorConfig.accentColor !== 'default' ? cartColorConfig.accentColor : undefined }}>BÁN HÀNG</h1><span className="text-[10px] font-bold text-[#8b6f47]/70 dark:text-[#d4a574]/60 tracking-wider">by LyangNghia</span></div><x.button type="button" onClick={() => setIsOrderDatePickerOpen(true)} title="Bấm để chọn ngày hóa đơn" whileHover={{ scale: 1.03, y: -0.5 }} whileTap={{ scale: 0.97 }} transition={{ type: "spring", stiffness: 450, damping: 25 }} className="flex items-center gap-2 bg-[#8b6f47]/[0.08] hover:bg-[#8b6f47]/[0.15] dark:bg-white/[0.06] dark:hover:bg-white/[0.1] px-3 py-1 rounded-xl border border-[#8b6f47]/25 dark:border-white/15 hover:border-[#2d5016]/50 dark:hover:border-emerald-400/40 shadow-xs transition-colors duration-200 shrink-0 cursor-pointer text-left select-none">{(() => {
                    const originalDateStr = le?.date ? le.date.slice(0, 10) : '';
                    let isDateModified = false;
                    if (customOrderDate) {
                      if (!le) {
                        isDateModified = true;
                      } else if (customOrderDate !== originalDateStr) {
                        isDateModified = true;
                      }
                    }
                    if (!isDateModified && le?.date && le?.display_id) {
                      const idParts = le.display_id.split('.');
                      if (idParts.length >= 2) {
                        const dateInId = idParts.slice(1).join('.');
                        const dateSlash = dateInId.split('/');
                        if (dateSlash.length === 3) {
                          const d = parseInt(dateSlash[0], 10);
                          const m = parseInt(dateSlash[1], 10);
                          const y = parseInt(dateSlash[2], 10);
                          const oDate = new Date(le.date);
                          const orderD = oDate.getDate();
                          const orderM = oDate.getMonth() + 1;
                          const orderY = oDate.getFullYear() % 100;
                          if (orderD !== d || orderM !== m || orderY !== y) {
                            isDateModified = true;
                          }
                        }
                      }
                    }
                    return (
                      <>
                        <div className="relative flex items-center justify-center shrink-0 w-2 h-2">
                          <span className={c("w-2 h-2 rounded-full shrink-0", isDateModified ? "bg-amber-600 dark:bg-amber-400" : Q ? "bg-[#8b6f47] dark:bg-[#d4a574]" : "bg-[#2d5016] dark:bg-emerald-400")} style={{ backgroundColor: !isDateModified && !Q && cartColorConfig?.accentColor && cartColorConfig.accentColor !== 'default' ? cartColorConfig.accentColor : undefined }} />
                          <span className={c("absolute w-2 h-2 rounded-full animate-ping opacity-40", isDateModified ? "bg-amber-500" : Q ? "bg-[#8b6f47] dark:bg-[#d4a574]" : "bg-[#2d5016] dark:bg-emerald-400")} style={{ backgroundColor: !isDateModified && !Q && cartColorConfig?.accentColor && cartColorConfig.accentColor !== 'default' ? cartColorConfig.accentColor : undefined }} />
                        </div>
                        <div className="flex flex-col justify-center leading-none min-w-0">
                          <x.span 
                            key={le?.display_id || (Q ? `edit-${Q}` : (Ce > 0 ? `active-${Ce}` : "new"))}
                            initial={{ opacity: 0.6, y: -1 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.18 }}
                            className="text-[11px] sm:text-[11.5px] font-black font-mono text-[#2d5016] dark:text-[#e8dfd5] tracking-tight leading-tight tabular-nums flex items-center gap-1" 
                            style={{ color: cartColorConfig?.accentColor && cartColorConfig.accentColor !== 'default' ? cartColorConfig.accentColor : undefined }}
                          >
                            #{le?.display_id || Q || (Ce > 0 ? Ce : "MỚI")}
                          </x.span>
                          {(() => {
                            if (isDateModified) {
                              const timeStr = le?.date ? new Date(le.date).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }) : new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
                              const activeDate = customOrderDate || originalDateStr;
                              let dateStr = activeDate;
                              if (activeDate) {
                                const p = activeDate.split('-');
                                dateStr = p.length === 3 ? `${p[2]}/${p[1]}` : activeDate;
                              }
                              return <span className="text-[7.5px] sm:text-[8px] font-black text-amber-700 dark:text-amber-400 mt-0.5 tabular-nums leading-none uppercase">{timeStr} - {dateStr} (ĐÃ SỬA)</span>;
                            }
                            if (le?.date) {
                              return <span className="text-[7.5px] sm:text-[8px] font-black text-[#8b6f47] dark:text-[#d4a574] mt-0.5 tabular-nums leading-none uppercase">{new Date(le.date).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })} - {new Date(le.date).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" })}</span>;
                            }
                            return <span className="text-[7.5px] sm:text-[8px] font-bold text-[#8b6f47]/70 dark:text-[#d4a574]/70 mt-0.5 leading-none uppercase">{Q ? "ĐANG SỬA" : "TẠO MỚI"}</span>;
                          })()}
                        </div>
                      </>
                    );
                  })()}</x.button></div><div className="flex items-center gap-2.5 pl-4 border-l border-[#8b6f47]/20 dark:border-white/10 relative z-[2100]"><div className="relative shrink-0" onMouseEnter={() => { !Me && document.activeElement !== Et.current && W(!0); }} onMouseLeave={() => W(!1)} onBlur={t => { t.currentTarget.contains(t.relatedTarget) || setTimeout(() => { Ue(!1); }, 180); }}><div style={(g === "remote_inspect" ? ze || k?.partner_name && k.partner_name !== "Khách lẻ" && k.partner_name !== "Khách bán lẻ" : p) && !Me && cartColorConfig?.accentColor && cartColorConfig.accentColor !== 'default' ? { background: `linear-gradient(to right, ${cartColorConfig.accentColor}, ${cartColorConfig.accentColor}dd)`, borderColor: cartColorConfig.accentColor, boxShadow: `0 4px 14px ${cartColorConfig.accentColor}40` } : undefined} className={c("relative flex items-center rounded-full overflow-hidden w-44 md:w-52 h-9 border transition-all duration-200 ease-out", (g === "remote_inspect" ? ze || k?.partner_name && k.partner_name !== "Khách lẻ" && k.partner_name !== "Khách bán lẻ" : p) && !Me ? "bg-gradient-to-r from-[#2d5016] to-[#3d6820] dark:from-[#1e3a10] dark:to-[#2d5016] border-[#2d5016] dark:border-[#34d399]/40 shadow-md shadow-[#2d5016]/20 text-white" : "border-[#8b6f47]/30 dark:border-[#d4a574]/30 bg-[#8b6f47]/[0.05] dark:bg-white/[0.04] shadow-xs focus-within:border-[#2d5016] dark:focus-within:border-[#d4a574] focus-within:ring-2 focus-within:ring-[#2d5016]/10")}><x.div key={(g === "remote_inspect" ? ze || k?.partner_name && k.partner_name !== "Khách lẻ" && k.partner_name !== "Khách bán lẻ" : p) && !Me ? "selected-partner-icon" : "search-icon"} initial={{
                      scale: 0.75,
                      rotate: -8
                    }} animate={{
                      scale: 1,
                      rotate: 0
                    }} transition={{
                      type: "spring",
                      stiffness: 500,
                      damping: 24
                    }} className="absolute left-2.5 top-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none z-10"><Ir style={!((g === "remote_inspect" ? ze || k?.partner_name && k.partner_name !== "Khách lẻ" && k.partner_name !== "Khách bán lẻ" : p) && !Me) && cartColorConfig?.accentColor && cartColorConfig.accentColor !== 'default' ? { color: cartColorConfig.accentColor } : undefined} className={(g === "remote_inspect" ? ze || k?.partner_name && k.partner_name !== "Khách lẻ" && k.partner_name !== "Khách bán lẻ" : p) && !Me ? "text-white shrink-0 drop-shadow-sm" : "text-[#2d5016] dark:text-[#d4a574] shrink-0"} size={15} strokeWidth={(g === "remote_inspect" ? ze || k?.partner_name && k.partner_name !== "Khách lẻ" && k.partner_name !== "Khách bán lẻ" : p) && !Me ? 2.8 : 2.5} /></x.div><input type="text" className={c("w-full pl-8 pr-7 py-1.5 h-full bg-transparent outline-none font-black text-xs text-slate-900 dark:text-white placeholder:text-muted/60 leading-normal", (g === "remote_inspect" ? ze || k?.partner_name && k.partner_name !== "Khách lẻ" && k.partner_name !== "Khách bán lẻ" : p) && !Me && "opacity-0 select-none cursor-pointer")} ref={Et} placeholder="Tìm đối tác (F3)..." value={(g === "remote_inspect" ? ze?.name || (k?.partner_name && k.partner_name !== "Khách lẻ" && k.partner_name !== "Khách bán lẻ" ? k.partner_name : "") || yt : p ? p.name : yt) || ""} onMouseDown={t => {
                      if (t.button === 2) {
                        t.preventDefault();
                      }
                    }} onClick={t => {
                      if (t.button === 0) {
                        W(!1);
                        Ue(!0);
                        t.target.select?.();
                      }
                    }} onFocus={t => {
                      if (window._preventPartnerFocusOpen) {
                        window._preventPartnerFocusOpen = false;
                        return;
                      }
                      W(!1);
                      Ue(!0);
                      t.target.select?.();
                    }} onContextMenu={t => {
                      t.preventDefault();
                      t.stopPropagation();
                      window._preventPartnerFocusOpen = true;
                      setTimeout(() => { window._preventPartnerFocusOpen = false; }, 300);
                      Ue(!1);
                      W(!1);
                      const partnerObj = g === "remote_inspect" ? (ze || (k?.partner_name ? { name: k.partner_name, id: k?.partner_id } : null)) : p;
                      if (partnerObj) {
                        setItemContextMenu({
                          type: 'partner',
                          data: partnerObj,
                          position: { x: t.clientX, y: t.clientY }
                        });
                      }
                    }} onChange={t => {
                      W(!1), Ge(t.target.value), g !== "remote_inspect" && p && F(null), Ue(!0), rs(0);
                    }} onKeyDown={t => {
                      if (t.key === "Escape") t.preventDefault(), W(!1), Ue(!1);else if (t.key === "ArrowDown") t.preventDefault(), W(!1), rs(a => {
                        const maxIdx = yt ? Math.max(0, Cr.length - 1) : Cr.length,
                          r = Math.min(a + 1, maxIdx),
                          s = xs.current;
                        if (s) {
                          const n = s.querySelector(`[data-index="${r}"]`);
                          n && n.scrollIntoView({
                            block: "nearest"
                          });
                        }
                        return r;
                      });else if (t.key === "ArrowUp") t.preventDefault(), W(!1), rs(a => {
                        const r = Math.max(a - 1, 0),
                          s = xs.current;
                        if (s) {
                          const n = s.querySelector(`[data-index="${r}"]`);
                          n && n.scrollIntoView({
                            block: "nearest"
                          });
                        }
                        return r;
                      });else if (t.key === "Enter") {
                        if (t.preventDefault(), W(!1), !yt) {
                          if (We === 0) g === "remote_inspect" ? Aa(null) : F(null), Ge(""), Ue(!1);
                          else if (Cr[We - 1]) {
                            const a = Cr[We - 1];
                            g === "remote_inspect" ? Aa(a) : F(a), Ge(""), Ue(!1);
                          }
                        } else {
                          if (Cr[We]) {
                            const a = Cr[We];
                            g === "remote_inspect" ? Aa(a) : F(a), Ge(""), Ue(!1);
                          }
                        }
                        setTimeout(() => se.current?.focus(), 50);
                      }
                    }} /><Ws mode="wait">{(g === "remote_inspect" ? ze || k?.partner_name && k.partner_name !== "Khách lẻ" && k.partner_name !== "Khách bán lẻ" : p) && !Me && <x.div key={g === "remote_inspect" ? ze?.name || k?.partner_name : p?.name} initial={{
                        opacity: 0,
                        x: 6,
                        scale: 0.95
                      }} animate={{
                        opacity: 1,
                        x: 0,
                        scale: 1
                      }} exit={{
                        opacity: 0,
                        x: -6,
                        scale: 0.95
                      }} transition={{
                        type: "spring",
                        stiffness: 450,
                        damping: 28
                      }} className="absolute left-8 right-7 top-0 bottom-0 flex items-center overflow-hidden pointer-events-none"><span className={c("font-black text-xs uppercase tracking-tight whitespace-nowrap inline-block text-white font-black drop-shadow-sm", ((g === "remote_inspect" ? ze?.name || k?.partner_name : p?.name) || "").length > 12 && "partner-pill-marquee-text")}>{g === "remote_inspect" ? ze?.name || k?.partner_name : p?.name}</span></x.div>}</Ws><Ws>{((g === "remote_inspect" ? ze || k?.partner_name && k.partner_name !== "Khách lẻ" && k.partner_name !== "Khách bán lẻ" : p) || yt) && !Me && <x.div initial={{
                        opacity: 0,
                        scale: 0.6
                      }} animate={{
                        opacity: 1,
                        scale: 1
                      }} exit={{
                        opacity: 0,
                        scale: 0.6
                      }} transition={{
                        type: "spring",
                        stiffness: 450,
                        damping: 25
                      }} className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center z-10"><button onClick={t => {
                          t.stopPropagation(), W(!1), g === "remote_inspect" ? Aa(null) : F(null), Ge("");
                        }} className={c("w-5 h-5 flex items-center justify-center rounded-full transition-all cursor-pointer", (g === "remote_inspect" ? ze || k?.partner_name && k.partner_name !== "Khách lẻ" && k.partner_name !== "Khách bán lẻ" : p) && !Me ? "bg-white/20 text-white hover:bg-rose-500 hover:text-white shadow-sm" : "bg-black/5 dark:bg-white/10 text-muted hover:bg-rose-500 hover:text-white")} title="Bỏ chọn đối tác"><Comp_ke size={10} strokeWidth={3} /></button></x.div>}</Ws></div><Vl partner={g === "remote_inspect" ? k?.partner : p} isVisible={xe && !Me && !!(g === "remote_inspect" ? k?.partner : p) && document.activeElement !== Et.current} /><Ws>{Me && <ResizableDropdownContainer key="pos-partner-dropdown" id="pos-partner-dropdown" dropdownKey="pos-partner-dropdown" storageKey="pos_partner_dropdown_size" coords={null} defaultWidth={600} defaultMaxHeight={500} className="!z-[3000] frosted-glass dropdown-frosted-glass" scrollRef={xs} itemCount={Cr.length + (yt ? 1 : 0)}>{!yt && <x.div data-index={0} className={c("dropdown-item flex items-center gap-3.5 px-4 py-3.5 transition-all relative cursor-pointer", We === 0 && "active")} onMouseMove={() => { if (We !== 0) rs(0); }} onMouseDown={e => {
                          e.preventDefault();
                          W(!1), g === "remote_inspect" ? Aa(null) : F(null), Ge(""), Ue(!1), setTimeout(() => se.current?.focus(), 50);
                        }}><div className={c("w-11 h-11 rounded-2xl flex items-center justify-center transition-all relative z-10 shrink-0 border", We === 0 ? "bg-white/20 text-white border-transparent" : "bg-black/[0.04] dark:bg-white/10 text-slate-700 dark:text-slate-300 border-black/5 dark:border-white/10 shadow-xs")}><Ir size={22} strokeWidth={2.5} /></div><div className="relative z-10 py-1"><p className={c("font-black uppercase tracking-tight text-base md:text-[17px] leading-snug pt-0.5", We === 0 ? "text-white" : "text-slate-900 dark:text-white")}>KHÁCH VÃNG LAI</p><p className={c("text-[11px] font-bold uppercase tracking-widest leading-relaxed mt-0.5", We === 0 ? "text-white/80" : "text-slate-500 dark:text-slate-400")}>MẶC ĐỊNH KHÔNG LƯU NỢ</p></div></x.div>}{Cr.map((t, a) => {
                          const isItemActive = yt ? We === a : We === a + 1;
                          const targetIndex = yt ? a : a + 1;
                          return (
                            <PartnerSearchItem
                              key={t.id}
                              partner={t}
                              isActive={isItemActive}
                              index={a}
                              targetIndex={targetIndex}
                              onHover={(idx) => {
                                if (We !== idx) rs(idx);
                              }}
                              onSelect={(partner) => {
                                W(!1);
                                g === "remote_inspect" ? Aa(partner) : F(partner);
                                Ge("");
                                Ue(!1);
                                setTimeout(() => se.current?.focus(), 50);
                              }}
                              onContextMenu={(e, partner) => {
                                setItemContextMenu({
                                  type: 'partner',
                                  data: partner,
                                  position: { x: e.clientX, y: e.clientY }
                                });
                              }}
                            />
                          );
                        })}{yt && <div className="dropdown-item flex items-center justify-between group/add border-t border-black/5 dark:border-white/5 px-4 py-3 cursor-pointer" onMouseDown={e => {
                          e.preventDefault();
                          dn(yt), cr(!0), Ue(!1);
                        }}><div className="flex items-center gap-3"><div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center group-hover/add:rotate-90 transition-transform text-primary shrink-0"><Ot size={18} strokeWidth={3} /></div><div className="py-0.5"><p className="text-[10px] font-black uppercase tracking-widest opacity-60 leading-normal">Đối tác mới</p><p className="text-sm font-black uppercase tracking-tight text-primary leading-snug pt-0.5">Tạo nhanh "{yt}"</p></div></div><Dr size={18} strokeWidth={3} className="opacity-40 group-hover/add:translate-x-1 transition-transform" /></div>}</ResizableDropdownContainer>}</Ws></div><x.button whileHover={{
                  y: -2,
                  scale: 1.05
                }} whileTap={{
                  scale: 0.98
                }} onClick={() => Bt(!0)} style={cartColorConfig?.accentColor && cartColorConfig.accentColor !== 'default' ? { color: cartColorConfig.accentColor } : undefined} className="relative w-9 h-9 flex items-center justify-center bg-[#8b6f47]/[0.08] hover:bg-[#2d5016] text-[#2d5016] hover:text-white dark:bg-white/[0.05] dark:hover:bg-[#2d5016] dark:text-[#d4a574] dark:hover:text-white rounded-full transition-all duration-200 border border-[#8b6f47]/25 hover:border-[#2d5016] dark:border-white/10 dark:hover:border-[#d4a574]/40 shadow-xs hover:shadow-md hover:shadow-[#2d5016]/20 shrink-0 cursor-pointer" title={K ? `Ghi chú: ${K}` : "Thêm ghi chú đơn hàng"}><Comp_ei size={16} strokeWidth={2.5} />{K && <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-amber-400 border-2 border-white dark:border-slate-900 rounded-full shadow-sm" />}</x.button><x.button whileHover={{
                  y: -2,
                  scale: 1.05
                }} whileTap={{
                  scale: 0.98
                }} onClick={() => St(!0)} style={cartColorConfig?.accentColor && cartColorConfig.accentColor !== 'default' ? { color: cartColorConfig.accentColor } : undefined} className="relative w-9 h-9 flex items-center justify-center bg-[#8b6f47]/[0.08] hover:bg-[#2d5016] text-[#2d5016] hover:text-white dark:bg-white/[0.05] dark:hover:bg-[#2d5016] dark:text-[#d4a574] dark:hover:text-white rounded-full transition-all duration-200 border border-[#8b6f47]/25 hover:border-[#2d5016] dark:border-white/10 dark:hover:border-[#d4a574]/40 shadow-xs hover:shadow-md hover:shadow-[#2d5016]/20 group shrink-0 cursor-pointer" title="Danh sách đơn tạm / treo"><Comp_jt size={16} strokeWidth={2.5} className="relative z-10" />{Fe.length > 0 && <x.span initial={{
                    scale: 0
                  }} animate={{
                    scale: 1
                  }} className="absolute -top-1.5 -right-1.5 bg-rose-600 text-white text-[9px] min-w-[18px] h-4.5 rounded-full flex items-center justify-center font-black border border-white px-1 leading-none z-20">{Fe.length}</x.span>}</x.button>{Ze === "sidebar" && <x.div className="flex items-center rounded-xl border border-[#8b6f47]/20 dark:border-white/10 bg-[#8b6f47]/[0.06] hover:bg-[#8b6f47]/[0.1] dark:bg-white/[0.04] p-0.5 transition-all shadow-xs shrink-0"><x.button onClick={() => na("prev")} whileTap={{
                    scale: 0.9
                  }} className="w-7 h-7 flex items-center justify-center transition-all rounded-lg bg-transparent hover:bg-[#8b6f47]/15 text-[#8b6f47] dark:text-[#d4a574]" title="Đơn trước"><Comp_qs size={14} strokeWidth={2.5} /></x.button><x.button whileTap={{
                    scale: 0.98
                  }} onClick={() => Ce !== 0 && !ks() && Wt()} className="px-2.5 flex items-center justify-center min-w-[55px]"><span className="text-[11px] font-black uppercase tracking-tight text-[#2d5016] dark:text-[#e8dfd5]" style={{ color: cartColorConfig?.accentColor && cartColorConfig.accentColor !== 'default' ? cartColorConfig.accentColor : undefined }}>{le?.display_id ? `#${le.display_id}` : Q ? `#${Q}` : "MỚI"}</span></x.button><x.button onClick={() => na("next")} disabled={Ce === 0} whileTap={{
                    scale: 0.9
                  }} className={c("w-7 h-7 flex items-center justify-center transition-all rounded-lg", Ce === 0 ? "opacity-30 cursor-not-allowed text-[#8b6f47] dark:text-[#d4a574]" : "bg-transparent hover:bg-[#8b6f47]/15 text-[#8b6f47] dark:text-[#d4a574]")}><Dr size={14} strokeWidth={2.5} /></x.button></x.div>}<x.button whileHover={{
                  y: -2,
                  scale: 1.05
                }} whileTap={{
                  scale: 0.98
                }} onClick={() => ul(Te === "Retail" ? "Wholesale" : "Retail")} style={cartColorConfig?.accentColor && cartColorConfig.accentColor !== 'default' ? { color: cartColorConfig.accentColor } : undefined} className="relative w-9 h-9 flex items-center justify-center bg-[#8b6f47]/[0.08] hover:bg-[#2d5016] text-[#2d5016] hover:text-white dark:bg-white/[0.05] dark:hover:bg-[#2d5016] dark:text-[#d4a574] dark:hover:text-white rounded-full transition-all duration-200 border border-[#8b6f47]/25 hover:border-[#2d5016] dark:border-white/10 dark:hover:border-[#d4a574]/40 shadow-xs hover:shadow-md hover:shadow-[#2d5016]/20 shrink-0 cursor-pointer" title={Te === "Wholesale" ? "Chế độ Bán sỉ (Bấm để đổi sang Lẻ)" : "Chế độ Bán lẻ (Bấm để đổi sang Sỉ)"}>{Te === "Wholesale" ? <Comp_jd size={16} strokeWidth={2.5} /> : <Ir size={16} strokeWidth={2.5} />}<div className={c("absolute bottom-1.5 right-1.5 w-2 h-2 rounded-full border border-white dark:border-slate-900", Te === "Wholesale" ? "bg-amber-400" : "bg-slate-300 dark:bg-slate-600")} /></x.button><x.button whileHover={{
                  y: -2,
                  scale: 1.05
                }} whileTap={{
                  scale: 0.98
                }} onClick={() => {
                  Xr(!0);
                }} style={cartColorConfig?.accentColor && cartColorConfig.accentColor !== 'default' ? { color: cartColorConfig.accentColor } : undefined} className="relative w-9 h-9 flex items-center justify-center bg-[#8b6f47]/[0.08] hover:bg-[#2d5016] text-[#2d5016] hover:text-white dark:bg-white/[0.05] dark:hover:bg-[#2d5016] dark:text-[#d4a574] dark:hover:text-white rounded-full transition-all duration-200 border border-[#8b6f47]/25 hover:border-[#2d5016] dark:border-white/10 dark:hover:border-[#d4a574]/40 shadow-xs hover:shadow-md hover:shadow-[#2d5016]/20 shrink-0 cursor-pointer" title="Lịch sử hóa đơn trong ngày"><Comp_ua size={16} strokeWidth={2.5} /></x.button><div className="relative" ref={$r}><x.button whileHover={{
                    y: -2,
                    scale: 1.05
                  }} whileTap={{
                    scale: 0.98
                  }} onClick={() => Ct(t => !t)} style={ar && cartColorConfig?.accentColor && cartColorConfig.accentColor !== 'default' ? { backgroundColor: cartColorConfig.accentColor, borderColor: cartColorConfig.accentColor } : (!ar && cartColorConfig?.accentColor && cartColorConfig.accentColor !== 'default' ? { color: cartColorConfig.accentColor } : undefined)} className={c("w-9 h-9 shrink-0 rounded-full transition-all duration-200 flex items-center justify-center border shadow-xs cursor-pointer", ar ? "bg-[#2d5016] text-white border-[#2d5016] shadow-md shadow-[#2d5016]/25" : "bg-[#8b6f47]/[0.08] hover:bg-[#2d5016] text-[#2d5016] hover:text-white dark:bg-white/[0.05] dark:hover:bg-[#2d5016] dark:text-[#d4a574] dark:hover:text-white border-[#8b6f47]/25 hover:border-[#2d5016] dark:border-white/10 dark:hover:border-[#d4a574]/40")} title="Thao tác khác"><Comp_co size={16} strokeWidth={2.5} /></x.button><P>{ar && <x.div initial={{
                      opacity: 0,
                      y: 8,
                      scale: 0.95
                    }} animate={{
                      opacity: 1,
                      y: 0,
                      scale: 1
                    }} exit={{
                      opacity: 0,
                      y: 8,
                      scale: 0.95
                    }} transition={{
                      duration: 0.15
                    }} className="absolute right-0 top-full mt-2 w-64 max-h-[50vh] overflow-y-auto !overflow-y-auto overscroll-contain custom-scrollbar bg-[#faf8f3]/95 dark:bg-[#0f172a]/95 backdrop-blur-2xl border border-[#8b6f47]/30 dark:border-white/10 rounded-2xl shadow-2xl p-1.5 z-[4000] flex flex-col gap-1 text-left select-none" style={{ maxHeight: '50vh', overflowY: 'auto' }}><button onClick={() => {
                        Ct(!1), X(!0);
                      }} className="flex items-center gap-3 px-3 py-2.5 text-xs font-black text-slate-700 dark:text-slate-200 hover:bg-emerald-500/10 hover:text-primary dark:hover:text-emerald-400 rounded-2xl transition-all group/menu-item w-full text-left"><div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-primary dark:text-emerald-400 flex items-center justify-center group-hover/menu-item:scale-110 transition-transform shrink-0"><En size={16} strokeWidth={2.5} /></div><span className="uppercase tracking-tight text-left">AI SCAN</span></button><button onClick={() => {
                        Ct(!1);
                        const t = y.reduce((r, s) => r + (parseFloat(s.quantity) || 0) * (parseFloat(s.price) || 0), 0),
                          a = {
                            id: Q || le?.id || null,
                            display_id: le?.display_id || (Q ? `#${Q}` : Ce > 0 ? `#${Ce}` : "XEM TRƯỚC"),
                            date: le?.date || new Date().toISOString(),
                            partner: p || null,
                            partner_id: p?.id || null,
                            partner_name: g === "remote_inspect" ? k?.partner?.name || "Khách lẻ" : p?.name || "Khách lẻ",
                            partner_address: g === "remote_inspect" ? k?.partner?.address || "" : p?.address || "",
                            partner_phone: g === "remote_inspect" ? k?.partner?.phone || "" : p?.phone || "",
                            old_debt: de !== void 0 ? de : p?.debt_balance || 0,
                            total_amount: t,
                            final_amount: t,
                            amount_paid: oe !== void 0 ? oe : t,
                            cash_given: V || 0,
                            payment_method: I || "Cash",
                            note: K || "",
                            details: y.map(r => ({
                              product_id: r.product_id,
                              product_name: r.product_name,
                              unit: r.unit,
                              secondary_unit: r.secondary_unit,
                              multiplier: r.multiplier || 1,
                              quantity: r.quantity,
                              secondary_qty: r.secondary_qty,
                              price: r.price,
                              cost_price: r.cost_price,
                              stock: r.stock
                            }))
                          };
                        $i(a), Sa(!0);
                      }} className="flex items-center gap-3 px-3 py-2.5 text-xs font-black text-slate-700 dark:text-slate-200 hover:bg-emerald-500/10 hover:text-primary dark:hover:text-emerald-400 rounded-2xl transition-all group/menu-item"><div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-primary dark:text-emerald-400 flex items-center justify-center group-hover/menu-item:scale-110 transition-transform"><$s size={16} strokeWidth={2.5} /></div><span className="uppercase tracking-tight">Xem trước in đơn</span></button>
                      
                      {/* Chọn Mẫu In Mặc Định (Từ Invoice Designer) */}
                      <div className="p-2.5 bg-black/5 dark:bg-white/5 rounded-2xl border border-slate-200/80 dark:border-white/10 flex flex-col gap-1.5 my-0.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                            <Ro size={13} className="text-primary dark:text-emerald-400 shrink-0" strokeWidth={2.5} /> Mẫu in mặc định:
                          </span>
                          <span className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                            {availableTemplates.length} mẫu
                          </span>
                        </div>
                        {availableTemplates.length > 0 ? (
                          <div className="relative">
                            <select
                              value={currentTemplateId || availableTemplates.find(t => t.is_default)?.id || availableTemplates[0]?.id || ''}
                              onChange={(e) => {
                                const tplId = parseInt(e.target.value);
                                if (tplId) handleSelectDefaultTemplate(tplId);
                              }}
                              className="w-full bg-white dark:bg-[#06140e] border border-slate-200 dark:border-white/15 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl px-2.5 py-2 outline-none cursor-pointer focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all shadow-xs"
                            >
                              {availableTemplates.map((tpl) => (
                                <option key={tpl.id} value={tpl.id} className="dark:bg-slate-900">
                                  {tpl.name || `Mẫu #${tpl.id}`} {tpl.is_default ? "★ (Mặc định)" : ""}
                                </option>
                              ))}
                            </select>
                          </div>
                        ) : (
                          <div className="text-[10px] italic text-slate-400 py-1">Chưa có mẫu in nào trong thiết kế</div>
                        )}
                      </div>

                      <button onClick={() => {
                        Ct(!1), fs(!0);
                      }} className="flex items-center gap-3 px-3 py-2.5 text-xs font-black text-slate-700 dark:text-slate-200 hover:bg-emerald-500/10 hover:text-primary dark:hover:text-emerald-400 rounded-2xl transition-all group/menu-item w-full text-left"><div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-primary dark:text-emerald-400 flex items-center justify-center group-hover/menu-item:scale-110 transition-transform"><Ln size={16} strokeWidth={2.5} /></div><span className="uppercase tracking-tight">Màn hình soạn hàng</span></button><button onClick={() => {
                        Ct(!1), ba(!0);
                      }} className="flex items-center gap-3 px-3 py-2.5 text-xs font-black text-slate-700 dark:text-slate-200 hover:bg-emerald-500/10 hover:text-primary dark:hover:text-emerald-400 rounded-2xl transition-all group/menu-item"><div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-primary dark:text-emerald-400 flex items-center justify-center group-hover/menu-item:scale-110 transition-transform"><Comp_la size={16} strokeWidth={2.5} /></div><span className="uppercase tracking-tight">Cài đặt giọng đọc (Loa)</span></button><button onClick={() => {
                        const t = !ga;
                        Vs(t), localStorage.setItem("pos_keep_order_after_save", t ? "true" : "false");
                        try {
                          const a = new BroadcastChannel("pos_data_sync");
                          a.postMessage({
                            type: "UI_SETTING_UPDATED",
                            key: "pos_keep_order_after_save",
                            value: t ? "true" : "false"
                          }), a.close();
                        } catch {}
                      }} className="flex items-center justify-between px-3 py-2.5 text-xs font-black text-slate-700 dark:text-slate-200 hover:bg-emerald-500/10 hover:text-primary dark:hover:text-emerald-400 rounded-2xl transition-all border-t border-slate-100 dark:border-slate-800/80 pt-2.5 mt-0.5 group/menu-item w-full text-left"><div className="flex items-center gap-3"><div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-primary dark:text-emerald-400 flex items-center justify-center group-hover/menu-item:scale-110 transition-transform"><Comp_uo size={16} strokeWidth={2.5} /></div><div className="flex flex-col text-left"><span className="uppercase tracking-tight text-[11px]">Ở lại đơn vừa lưu</span><span className="text-[9px] font-bold text-slate-400 lowercase tracking-normal">{ga ? "bật: giữ lại giỏ hàng" : "tắt: tự xóa giỏ hàng"}</span></div></div><div className={c("w-9 h-5 rounded-full p-0.5 transition-colors duration-200 ease-in-out shrink-0 flex items-center border", ga ? "bg-emerald-500 border-emerald-500 justify-end" : "bg-slate-200 dark:bg-slate-700 border-slate-300 dark:border-slate-600 justify-start")}><div className="w-4 h-4 rounded-full bg-white shadow-sm" /></div></button><button onClick={() => {
                        const t = ir === "card" ? "toast" : "card";
                        Ni(t), localStorage.setItem("pos_save_notice_style", t);
                        try {
                          const a = new BroadcastChannel("pos_data_sync");
                          a.postMessage({
                            type: "UI_SETTING_UPDATED",
                            key: "pos_save_notice_style",
                            value: t
                          }), a.close();
                        } catch {}
                      }} className="flex items-center justify-between px-3 py-2.5 text-xs font-black text-slate-700 dark:text-slate-200 hover:bg-emerald-500/10 hover:text-primary dark:hover:text-emerald-400 rounded-2xl transition-all border-t border-slate-100 dark:border-slate-800/80 pt-2.5 mt-0.5 group/menu-item w-full text-left"><div className="flex items-center gap-3"><div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-primary dark:text-emerald-400 flex items-center justify-center group-hover/menu-item:scale-110 transition-transform"><Comp_mo size={16} strokeWidth={2.5} /></div><div className="flex flex-col text-left"><span className="uppercase tracking-tight text-[11px]">Kiểu báo lưu đơn</span><span className="text-[9px] font-bold text-slate-400 lowercase tracking-normal">{ir === "card" ? "thẻ nổi giữa màn hình" : "toast góc cũ"}</span></div></div><div className={c("w-9 h-5 rounded-full p-0.5 transition-colors duration-200 ease-in-out shrink-0 flex items-center border", ir === "card" ? "bg-emerald-500 border-emerald-500 justify-end" : "bg-slate-200 dark:bg-slate-700 border-slate-300 dark:border-slate-600 justify-start")}><div className="w-4 h-4 rounded-full bg-white shadow-sm" /></div></button><button onClick={() => {
                        const t = !blockTabPrice;
                        setBlockTabPrice(t), localStorage.setItem("pos_block_tab_unit_price", t ? "true" : "false");
                        try {
                          const a = new BroadcastChannel("pos_data_sync");
                          a.postMessage({
                            type: "UI_SETTING_UPDATED",
                            key: "pos_block_tab_unit_price",
                            value: t ? "true" : "false"
                          }), a.close();
                        } catch {}
                      }} className="flex items-center justify-between px-3 py-2.5 text-xs font-black text-slate-700 dark:text-slate-200 hover:bg-emerald-500/10 hover:text-primary dark:hover:text-emerald-400 rounded-2xl transition-all border-t border-slate-100 dark:border-slate-800/80 pt-2.5 mt-0.5 group/menu-item w-full text-left"><div className="flex items-center gap-3"><div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-primary dark:text-emerald-400 flex items-center justify-center group-hover/menu-item:scale-110 transition-transform"><Rs size={16} strokeWidth={2.5} /></div><div className="flex flex-col text-left"><span className="uppercase tracking-tight text-[11px]">Chặn Tab vào ô đơn giá</span><span className="text-[9px] font-bold text-slate-400 lowercase tracking-normal">{blockTabPrice ? "bật: bỏ qua ô giá khi Tab" : "tắt: Tab vào ô giá bình thường"}</span></div></div><div className={c("w-9 h-5 rounded-full p-0.5 transition-colors duration-200 ease-in-out shrink-0 flex items-center border", blockTabPrice ? "bg-emerald-500 border-emerald-500 justify-end" : "bg-slate-200 dark:bg-slate-700 border-slate-300 dark:border-slate-600 justify-start")}><div className="w-4 h-4 rounded-full bg-white shadow-sm" /></div></button><button onClick={() => {
                        Ct(!1), Ci();
                      }} className="flex items-center gap-3 px-3 py-2.5 text-xs font-black text-slate-700 dark:text-slate-200 hover:bg-emerald-500/10 hover:text-primary dark:hover:text-emerald-400 rounded-2xl transition-all border-t border-slate-100 dark:border-slate-800/80 pt-2.5 mt-0.5 group/menu-item"><div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-primary dark:text-emerald-400 flex items-center justify-center group-hover/menu-item:scale-110 transition-transform">{Ze === "bottom" ? <Comp_xo size={16} strokeWidth={2.5} /> : <Comp_ho size={16} strokeWidth={2.5} />}</div><span className="uppercase tracking-tight">Chuyển bố cục: {Ze === "bottom" ? "Cột phải" : "Ở dưới"}</span></button></x.div>}</P></div><P mode="popLayout">{p && p.yearly_revenue > 0 && <x.div layout={!0} initial={{
                    opacity: 0,
                    x: -20,
                    scale: 0.8
                  }} animate={{
                    opacity: 1,
                    x: 0,
                    scale: 1
                  }} exit={{
                    opacity: 0,
                    x: -20,
                    scale: 0.8
                  }} className="flex items-center h-9 relative overflow-hidden bg-[#8b6f47]/[0.06] hover:bg-[#8b6f47]/[0.1] dark:bg-white/[0.04] dark:hover:bg-white/[0.08] border border-[#8b6f47]/20 dark:border-white/10 hover:border-[#2d5016]/40 dark:hover:border-emerald-400/30 rounded-2xl px-3 backdrop-blur-md shadow-xs transition-all duration-300 shrink-0 group/revenue box-border"><div className="absolute -right-1 -bottom-1 text-[#2d5016]/10 dark:text-emerald-400/10 pointer-events-none transition-transform duration-300 group-hover/revenue:scale-110 group-hover/revenue:rotate-6"><Comp_u_d size={26} strokeWidth={2.5} /></div><div className="flex flex-col justify-center leading-none relative z-10"><p className="text-[8px] font-black text-[#8b6f47] dark:text-[#d4a574] uppercase tracking-wider leading-none mb-0.5">Doanh thu năm</p><p className="text-[13px] font-black text-[#2d5016] dark:text-[#e8dfd5] tabular-nums tracking-tight leading-none">{z(p.yearly_revenue)}</p></div></x.div>}</P></div></div><div className="flex-1 min-w-[8px]" /><div className="flex items-center gap-2 shrink-0"><div className="flex items-center gap-2 ml-auto"><div className="flex items-center gap-1 shrink-0 h-[26px]"><div className="max-w-[120px] overflow-x-auto no-scrollbar scroll-smooth flex items-center gap-1 shrink-0">{fe.map((t, a) => {
                    const r = t.id === g,
                      s = t.id === ne;
                    return <div key={t.id} className="group/tab relative shrink-0"><button onClick={n => {
                        n.stopPropagation(), es(t.id);
                      }} style={r && cartColorConfig?.accentColor && cartColorConfig.accentColor !== 'default' ? { backgroundColor: cartColorConfig.accentColor, borderColor: cartColorConfig.accentColor } : undefined} className={c("relative flex items-center gap-1 px-2 py-0.5 rounded-lg text-[9px] font-black tracking-wide transition-all border cursor-pointer select-none shrink-0 h-[26px]", r ? "bg-[#2d5016] text-white border-[#2d5016] shadow-xs" : "bg-[#8b6f47]/[0.08] hover:bg-[#8b6f47]/15 text-[#8b6f47] dark:text-[#d4a574] border-[#8b6f47]/20 hover:border-[#2d5016]/40")}>{s && <span className="flex items-end gap-[1px] h-1.5 mr-0.5 pb-[1px] shrink-0"><span className={c("w-[1.2px] rounded-full", r ? "bg-white" : "bg-[#2d5016]")} style={{
                          height: "40%"
                        }} /><span className={c("w-[1.2px] rounded-full", r ? "bg-white" : "bg-[#2d5016]")} style={{
                          height: "70%"
                        }} /><span className={c("w-[1.2px] rounded-full", r ? "bg-white" : "bg-[#2d5016]")} style={{
                          height: "100%"
                        }} /></span>}<span>T{a + 1}</span>{fe.length > 1 && <span className={c("inline-flex items-center justify-center w-3 h-3 rounded-full ml-0.5 transition-colors text-[8px]", r ? "text-white/70 hover:text-white hover:bg-white/20" : "text-[#8b6f47]/60 hover:text-rose-500 hover:bg-rose-500/15")} onClick={n => {
                          n.stopPropagation(), Ei(t.id, n);
                        }}>✕</span>}</button>{!s && <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 opacity-0 group-hover/tab:opacity-100 pointer-events-none group-hover/tab:pointer-events-auto transition-opacity z-50"><button onClick={n => {
                          n.stopPropagation(), me(t.id);
                        }} className="bg-slate-800 text-white text-[8px] px-1 py-0.5 rounded-lg shadow-xl flex items-center gap-0.5 hover:bg-blue-600 transition-colors border border-white/20 whitespace-nowrap">Ghim quét</button></div>}</div>;
                  })}{q && <div className="group/tab relative shrink-0"><button onClick={t => {
                      t.stopPropagation(), f("remote_inspect");
                    }} className={c("relative flex items-center gap-1 px-2 py-0.5 rounded-lg text-[9px] font-black tracking-wider transition-all border cursor-pointer shrink-0 h-[26px]", g === "remote_inspect" ? "bg-emerald-600 border-emerald-600 text-white shadow-xs" : "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20")}><SatelliteIcon size={11} className="mr-0.5 shrink-0 text-inherit" /><span className="font-extrabold flex items-center gap-0.5 text-inherit">.{(() => {
                          const t = k?.ip_address || (q.includes(".") ? q : "");
                          if (!t) return "LOCAL";
                          const a = t.split(".");
                          return a[a.length - 1];
                        })()}</span><span className="inline-flex items-center justify-center w-3 h-3 rounded-full ml-0.5 hover:bg-emerald-500/20 hover:text-emerald-600 transition-colors text-emerald-500/60 text-[8px]" onClick={t => {
                        t.stopPropagation(), br(null), g === "remote_inspect" && f(fe[0]?.id || "tab1");
                      }}>✕</span></button></div>}</div>{fe.length < 5 && <button onClick={t => {
                    t.stopPropagation(), Pi();
                  }} style={cartColorConfig?.accentColor && cartColorConfig.accentColor !== 'default' ? { color: cartColorConfig.accentColor } : undefined} className="w-[26px] h-[26px] flex items-center justify-center bg-[#8b6f47]/[0.08] hover:bg-[#8b6f47]/15 border border-dashed border-[#8b6f47]/30 hover:border-[#2d5016] rounded-lg text-[#8b6f47] dark:text-[#d4a574] hover:text-[#2d5016] transition-all text-[10px] font-black cursor-pointer shrink-0" title="Thêm tab đơn mới (Ctrl+N)">＋</button>}<div className="relative shrink-0"><button ref={bs} onClick={t => {
                      t.stopPropagation(), Ma(!Zt);
                    }} className={c("relative w-[26px] h-[26px] rounded-lg flex items-center justify-center transition-all cursor-pointer border shrink-0", Zt || q ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-600 dark:text-emerald-400 shadow-xs" : "bg-[#2d5016]/10 hover:bg-[#2d5016]/20 text-[#2d5016] dark:text-emerald-400 border-[#2d5016]/20 hover:border-[#2d5016]/40")} title={(() => {
                      const t = new Set();
                      return `Giám sát máy trạm (${hr.filter(r => {
                        const s = r.ip_address || r.terminal_id;
                        return s && !t.has(s) ? (t.add(s), !0) : !1;
                      }).length} máy online)`;
                    })()}><TvMonitorIcon size={11} strokeWidth={2.3} className="shrink-0" />{(() => {
                        const t = new Set(),
                          a = hr.filter(r => {
                            const s = r.ip_address || r.terminal_id;
                            return s && !t.has(s) ? (t.add(s), !0) : !1;
                          });
                        return a.length > 0 && <span className="absolute -top-1 -right-1 flex h-3 min-w-3 px-0.5 items-center justify-center rounded-full bg-emerald-500 text-[6.5px] font-black text-white shadow-xs ring-1 ring-card">{a.length}</span>;
                      })()}</button><P>{Zt ? <Fn><x.div initial={{
                          opacity: 0,
                          scale: 0.95,
                          y: -10
                        }} animate={{
                          opacity: 1,
                          scale: 1,
                          y: 0
                        }} exit={{
                          opacity: 0,
                          scale: 0.95,
                          y: -10
                        }} transition={{
                          duration: 0.15,
                          ease: "easeOut"
                        }} style={(() => {
                          if (bs.current) {
                            const t = bs.current.getBoundingClientRect();
                            return {
                              position: "fixed",
                              top: t.bottom + 6 + "px",
                              right: Math.max(10, window.innerWidth - t.right) + "px",
                              zIndex: 99999
                            };
                          }
                          return {
                            position: "fixed",
                            top: "100px",
                            right: "100px",
                            zIndex: 99999
                          };
                        })()} className="w-[340px] bg-card/95 backdrop-blur-xl border border-border rounded-2xl shadow-2xl p-3.5 space-y-3 text-foreground ring-1 ring-border" onClick={t => t.stopPropagation()}><div className="pb-2 border-b border-border flex items-center justify-between"><span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground"><div className="flex items-center gap-1.5"><TvMonitorIcon size={12} className="text-emerald-500" />MÁY TRẠM HOẠT ĐỘNG</div></span><button onClick={() => Ma(!1)} className="text-muted-foreground hover:text-rose-500 text-sm font-black p-1 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer">✕</button></div><div className="max-h-64 overflow-y-auto custom-scrollbar space-y-2 pr-1">{(() => {
                              const t = new Set(),
                                a = [],
                                r = [...hr].sort((s, n) => {
                                  const l = (s.terminal_name || "").includes("MÁY POS") || (s.terminal_id || "").includes("127.0.0.1"),
                                    d = (n.terminal_name || "").includes("MÁY POS") || (n.terminal_id || "").includes("127.0.0.1");
                                  return l && !d ? 1 : !l && d ? -1 : (n.terminal_id || "").length - (s.terminal_id || "").length;
                                });
                              for (const s of r) {
                                const n = s.ip_address || s.terminal_id;
                                n && !t.has(n) && (t.add(n), a.push(s));
                              }
                              return a.length === 0 ? <div className="p-4 text-center text-xs font-black uppercase tracking-widest text-muted-foreground">Không tìm thấy máy trạm nào online</div> : a.map(s => {
                                const n = q === s.terminal_id,
                                  l = s.total_items || (s.cart ? s.cart.reduce((u, h) => u + (h.quantity || 1), 0) : 0),
                                  d = (s.terminal_id || "").includes("Mobile") || (s.current_page || "").includes("Mobile"),
                                  o = s.total_amount || 0;
                                return <div key={s.terminal_id} className={c("w-full p-3 rounded-2xl border text-left flex items-center justify-between gap-3 transition-all relative overflow-hidden", n ? "bg-emerald-500/15 border-emerald-500 text-foreground shadow-md shadow-emerald-500/5" : "bg-card/60 border-border hover:bg-card")}><div className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer" onClick={() => {
                                    br(s.terminal_id), Ma(!1), f("remote_inspect");
                                  }}><div className={c("w-9 h-9 rounded-xl flex items-center justify-center border shrink-0 text-sm", n ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-600 dark:text-emerald-400" : "bg-card border-border text-muted-foreground")}>{d ? <Rs size={16} /> : <TvMonitorIcon size={16} />}</div><div className="min-w-0 flex-1"><div className="text-xs font-black uppercase tracking-wide truncate text-foreground">{s.user_name && !s.user_name.includes("Thu ngân") ? `${s.user_name} (${s.ip_address})` : `MÁY POS (${s.ip_address})`}</div><div className="text-[10px] font-bold text-muted-foreground truncate flex items-center gap-1"><Qn size={10} />{s.terminal_name || s.terminal_id}</div></div></div><div className="text-right shrink-0 flex flex-col items-end gap-0.5"><div className="text-xs font-black text-emerald-600 dark:text-emerald-400 tabular-nums flex items-center gap-0.5">{z(o)}đ</div><div className="text-[9px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded-lg border border-amber-500/10 tabular-nums">{l} món</div></div><button onClick={u => {
                                    u.stopPropagation(), hn(s.cart);
                                  }} className="p-2 bg-emerald-500/15 hover:bg-emerald-500 text-emerald-600 dark:text-emerald-400 hover:text-white rounded-xl transition-all border border-emerald-500/20 cursor-pointer shadow-xs" title="Sao chép nhanh giỏ hàng từ máy này"><Pn size={13} /></button></div>;
                              });
                            })()}</div></x.div></Fn> : null}</P></div></div><HeavyClock variant="purchase" gpuDisabled={Ya} /></div></div></div><P>{va && <Ee><div className="fixed inset-0 z-[2000] flex justify-end font-sans"><x.div initial={{
                  opacity: 0
                }} animate={{
                  opacity: 1
                }} exit={{
                  opacity: 0
                }} className="absolute inset-0 bg-black/40 backdrop-blur-md" onClick={() => St(!1)} /><x.div initial={{
                  x: "100%",
                  opacity: 0
                }} animate={{
                  x: 0,
                  opacity: 1
                }} exit={{
                  x: "100%",
                  opacity: 0
                }} transition={{
                  type: "spring",
                  damping: 32,
                  stiffness: 260
                }} className="relative w-full max-w-[440px] h-full bg-[#f8f6f0]/95 dark:bg-[#022c22]/95 backdrop-blur-[100px] flex flex-col border-l border-[#8b6f47]/20 dark:border-white/10 shadow-2xl"><div className="p-5 border-b border-[#8b6f47]/15 dark:border-white/10 relative overflow-hidden group"><div className="absolute top-0 right-0 p-8 opacity-[0.03] dark:opacity-[0.03] -rotate-12 translate-x-4 -translate-y-4 pointer-events-none transition-transform group-hover:scale-110 duration-700 text-[#8b6f47] dark:text-white"><Comp_jt size={100} /></div><div className="flex justify-between items-center relative z-10"><div className="flex items-center gap-4"><div className="w-9 h-9 bg-amber-500/10 dark:bg-white/10 rounded-xl flex items-center justify-center text-amber-600 dark:text-amber-400 border border-amber-500/20 dark:border-white/10 shadow-xs"><Comp_jt size={18} strokeWidth={2.5} /></div><div><h3 className="font-black text-[14px] text-stone-800 dark:text-white uppercase tracking-tighter leading-none mb-1">Hóa đơn chờ</h3><p className="text-[9px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />Đang treo ({Fe.length})</p></div></div><button onClick={() => St(!1)} className="w-9 h-9 flex items-center justify-center bg-stone-200/60 dark:bg-white/10 hover:bg-rose-500/15 dark:hover:bg-rose-500/20 text-stone-500 hover:text-rose-600 dark:text-white/60 dark:hover:text-rose-400 rounded-xl transition-all hover:rotate-90 border border-stone-200/80 dark:border-white/10 cursor-pointer"><Comp_ke size={16} strokeWidth={3} /></button></div></div><div className="flex-1 overflow-y-auto no-scrollbar px-5 py-6 space-y-4">{Fe.length === 0 ? <div className="text-center py-40 opacity-30 dark:opacity-20"><Comp_jt size={60} strokeWidth={1} className="mx-auto mb-8 text-stone-700 dark:text-white" /><p className="font-black uppercase text-[10px] tracking-[0.4em] text-stone-700 dark:text-white">Trống trải...</p></div> : <P mode="popLayout">{Fe.map((t, a) => <x.div key={t.id} id={a === 0 ? "first-held-card" : void 0} tabIndex={0} layout={!0} initial={{
                        opacity: 0,
                        x: 20
                      }} animate={{
                        opacity: 1,
                        x: 0
                      }} exit={{
                        opacity: 0,
                        scale: 0.9,
                        x: 20
                      }} transition={{
                        delay: a * 0.04
                      }} className="bg-white/90 dark:bg-white/[0.04] border border-[#8b6f47]/20 dark:border-white/5 rounded-2xl p-4 hover:border-amber-500/50 dark:hover:border-amber-500/40 focus:border-amber-500 focus:bg-white dark:focus:bg-white/[0.08] transition-all group hover:bg-white dark:hover:bg-white/[0.08] outline-none focus:outline-none cursor-pointer shadow-xs hover:shadow-md" onKeyDown={r => {
                        if (r.key === "ArrowDown") {
                          r.preventDefault();
                          const s = r.currentTarget.nextElementSibling;
                          s && s.focus();
                        } else if (r.key === "ArrowUp") {
                          r.preventDefault();
                          const s = r.currentTarget.previousElementSibling;
                          s && s.focus();
                        } else r.key === "Enter" && (r.preventDefault(), jn(t));
                      }}><div className="flex justify-between items-start mb-3"><div className="flex-1 pr-3 min-w-0"><div className="font-black text-stone-800 dark:text-white uppercase text-xs leading-tight group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors truncate">{t.partner ? t.partner.name : "KHÁCH BÁN LẺ"}</div><div className="flex items-center gap-3 mt-1.5"><div className="text-[8px] font-black text-stone-500 dark:text-white/30 bg-stone-100 dark:bg-white/5 px-1.5 py-0.5 rounded uppercase tracking-wider tabular-nums border border-stone-200 dark:border-white/5">{t.time}</div><div className="text-[8px] font-black text-amber-600 dark:text-amber-400 bg-amber-500/10 dark:bg-amber-500/5 px-1.5 py-0.5 rounded border border-amber-500/20 dark:border-amber-500/10 uppercase tracking-widest">{t.cart.length} món</div></div></div></div>{t.cart && t.cart.length > 0 && <div className="border-t border-[#8b6f47]/15 dark:border-white/5 mt-2 pt-2 flex flex-wrap gap-1 mb-3">{t.cart.slice(0, 3).map((r, s) => <div key={s} className="px-1.5 py-0.5 bg-amber-500/10 dark:bg-amber-500/5 border border-amber-500/20 dark:border-amber-500/10 rounded-md text-[8px] font-black text-amber-700 dark:text-amber-400/90 uppercase flex items-center gap-1 transition-all hover:bg-amber-500/15 dark:hover:bg-amber-500/10"><span className="truncate max-w-[70px]">{r.product_name}</span><div className="w-px h-1.5 bg-amber-500/30 dark:bg-amber-500/20" /><span className="text-amber-600 dark:text-amber-300 font-bold">{z(r.quantity)}</span></div>)}{t.cart.length > 3 && <div className="px-1.5 py-0.5 bg-stone-100 dark:bg-white/5 border border-stone-200 dark:border-white/5 rounded-md text-[8px] font-black text-stone-500 dark:text-white/30 uppercase tracking-tighter">+{t.cart.length - 3} món</div>}</div>}<div className="flex justify-between items-center bg-stone-100/90 dark:bg-black/20 p-3 rounded-xl border border-stone-200/80 dark:border-white/5"><div className="text-amber-600 dark:text-amber-400 font-black text-lg tracking-tighter tabular-nums">{z(t.total)}</div><div className="flex gap-2"><x.button whileHover={{
                              scale: 1.05
                            }} whileTap={{
                              scale: 0.95
                            }} onClick={() => cl(t.id)} className="p-1.5 bg-rose-500/10 hover:bg-rose-500 text-rose-600 dark:text-rose-500 hover:text-white rounded-lg transition-all border border-rose-500/20 dark:border-rose-500/10 active:scale-95 flex items-center justify-center cursor-pointer shadow-xs" title="Xóa hóa đơn chờ"><Comp_pa size={12} strokeWidth={2.5} /></x.button><x.button whileHover={{
                              scale: 1.05
                            }} whileTap={{
                              scale: 0.95
                            }} onClick={() => jn(t)} className="bg-amber-500 hover:bg-amber-600 dark:bg-amber-500/20 dark:hover:bg-amber-500 text-white dark:text-amber-400 dark:hover:text-white px-4 py-1.5 rounded-lg font-black text-[9px] uppercase tracking-widest transition-all border border-amber-500 dark:border-amber-500/10 active:scale-95 cursor-pointer shadow-xs">MỞ LẠI</x.button></div></div></x.div>)}</P>}</div><div className="p-5 border-t border-[#8b6f47]/15 dark:border-white/10"><button onClick={() => St(!1)} className="w-full py-3.5 rounded-xl border border-stone-300 dark:border-white/10 text-stone-500 dark:text-white/30 font-black uppercase text-[9px] hover:bg-stone-100 dark:hover:bg-white/5 hover:text-stone-800 dark:hover:text-white transition-all tracking-[0.3em] active:scale-[0.98] cursor-pointer">Đóng</button></div></x.div></div></Ee>}</P><div className="flex-1 flex gap-3 px-4 pb-4 print:hidden min-h-0"><x.div initial={!1} animate={{
              width: Ze === "bottom" ? "100%" : ka ? "calc(100% - 370px)" : "calc(100% - 100px)"
            }} transition={{
              type: "spring",
              stiffness: 300,
              damping: 30
            }} className="flex flex-col min-h-0 flex-1"><div 
              className={c("flex-1 overflow-hidden relative transition-[background-color,border-color,box-shadow] duration-200 rounded-3xl", cartColorConfig.enableBorder !== false ? "border" : "border-0", transparentCartTable && (!cartColorConfig?.overlayColor || cartColorConfig.overlayColor === 'default') ? "bg-card/30 dark:bg-card/25 shadow-[0_0_25px_rgba(139,111,71,0.15),0_8px_32px_rgba(139,111,71,0.1)] dark:shadow-[0_0_30px_rgba(212,165,116,0.18)]" : (!transparentCartTable ? "bg-transparent shadow-[0_0_25px_rgba(139,111,71,0.12),0_4px_20px_rgba(139,111,71,0.06)] dark:shadow-[0_0_28px_rgba(212,165,116,0.15)]" : "shadow-[0_0_25px_rgba(139,111,71,0.15),0_8px_32px_rgba(139,111,71,0.1)] dark:shadow-[0_0_30px_rgba(212,165,116,0.18)]"))}
              style={{
                ...getCartOverlayStyle(cartColorConfig, transparentCartTable),
                border: cartColorConfig.enableBorder === false ? 'none' : undefined,
                borderColor: cartColorConfig.enableBorder === false ? 'transparent' : (cartColorConfig.borderColor !== 'default' ? cartColorConfig.borderColor : undefined),
                borderWidth: cartColorConfig.enableBorder === false ? 0 : (cartColorConfig.borderWidth ? `${cartColorConfig.borderWidth}px` : undefined),
                boxShadow: getCartBoxShadow(cartColorConfig)
              }}
            ><P>{fn && <x.div key="history-sync-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="absolute inset-0 z-[200] flex flex-col items-center justify-center gap-3.5 bg-transparent select-none rounded-3xl pointer-events-none"><div className="relative w-16 h-16 flex items-center justify-center"><div className="absolute inset-0 rounded-full border-[2.5px] border-emerald-500/30 border-t-emerald-600 dark:border-white/10 dark:border-t-emerald-400 animate-spin" /><div className="absolute -inset-1.5 rounded-full border border-dashed border-[#8b6f47]/20 dark:border-white/10 pointer-events-none" /><div className="w-9 h-9 flex items-center justify-center relative z-10"><img src={kl} alt="LyangPOS" className="w-full h-full object-contain rounded-xl drop-shadow-md" /></div></div><div className="flex flex-col items-center gap-1"><span className="text-[10px] font-black uppercase tracking-[0.25em] text-[#8b6f47] dark:text-[#d4a574]">Lyang<span className="text-emerald-700 dark:text-emerald-400">POS</span></span><span className="text-xs font-black text-[#2d5016] dark:text-emerald-300 uppercase tracking-widest px-3.5 py-1 rounded-full bg-card/80 border border-[#8b6f47]/25 dark:border-white/10 shadow-xs">Đang đồng bộ dữ liệu...</span></div></x.div>}</P>{mascotWatermarkVisible && (
              <div 
                className={c(
                  "absolute pointer-events-none select-none z-0 overflow-hidden flex transition-all duration-200",
                  mascotWatermarkPos === "bottom-right" ? "right-0 bottom-0 items-end justify-end" :
                  mascotWatermarkPos === "bottom-left" ? "left-0 bottom-0 items-end justify-start" :
                  mascotWatermarkPos === "top-right" ? "right-0 top-0 items-start justify-end" :
                  mascotWatermarkPos === "top-left" ? "left-0 top-0 items-start justify-start" :
                  "inset-0 items-center justify-center"
                )}
                style={{ opacity: (mascotWatermarkOpacity || 15) / 100 }}
              >
                <img
                  src={mascotWatermarkCustomImage || "/assets/images/user_mascot.png"}
                  alt="Lyang Mascot"
                  style={{
                    width: `${Math.round(360 * ((mascotWatermarkScale || 100) / 100))}px`,
                    height: `${Math.round(360 * ((mascotWatermarkScale || 100) / 100))}px`,
                    transform: `translate(${mascotWatermarkOffsetX || 0}px, ${mascotWatermarkOffsetY || 0}px) rotate(${mascotWatermarkRotate || 0}deg)`,
                  }}
                  className="object-contain pointer-events-none select-none filter grayscale contrast-[300%] brightness-[90%] sepia-[0.35] hue-rotate-[30deg] dark:invert dark:grayscale dark:contrast-[250%] dark:brightness-[130%] mix-blend-multiply dark:mix-blend-screen transition-transform duration-100"
                  draggable="false"
                />
              </div>
            )}<div className="w-full h-full relative bg-transparent"><div ref={cartScrollContainerRef} className="absolute top-0 left-0 right-0 overflow-y-scroll no-scrollbar-on-empty z-10 [scrollbar-gutter:stable] transition-[bottom] duration-200 ease-out" style={{ bottom: (Ze === "sidebar" && !ka && cartColorConfig?.constrainCartAboveBubbles !== false) ? "var(--cart-bubble-bottom, 100px)" : 0 }}><div className={c("w-full transition-colors relative", (Ze === "sidebar" && !ka && cartColorConfig?.constrainCartAboveBubbles !== false) ? "pb-4" : (Ze === "sidebar" && !ka ? "pb-[400px]" : "pb-6"))}><table className="w-full text-left border-collapse table-fixed"><colgroup><col style={{
                            width: "3.5%"
                          }} /><col style={{
                            width: "3.5%"
                          }} /><col style={{
                            width: "38%"
                          }} /><col style={{
                            width: "7%"
                          }} /><col style={{
                            width: "9%"
                          }} /><col style={{
                            width: "8%"
                          }} /><col style={{
                            width: "12%"
                          }} /><col style={{
                            width: "14%"
                          }} /><col style={{
                            width: "5%"
                          }} /></colgroup><thead 
                            className="sticky top-0 z-[100] print:hidden border-none transition-colors duration-150"
                            style={{
                              backgroundColor: cartColorConfig.headerBg !== 'default' ? cartColorConfig.headerBg : 'transparent'
                            }}
                          ><tr className="border-none"><th className="py-2.5 px-2 text-center align-middle font-black uppercase text-[10px] tracking-wider whitespace-nowrap" style={{ color: cartColorConfig.headerText !== 'default' ? cartColorConfig.headerText : undefined, ...(cartColorConfig.headerText === 'default' ? {} : {}) }}><span className={cartColorConfig.headerText === 'default' ? "text-[#8b6f47] dark:text-[#d4a574]" : ""}>Stt</span></th><th 
  onMouseDown={startPackingLongPress}
  onMouseUp={cancelPackingLongPress}
  onMouseLeave={cancelPackingLongPress}
  onTouchStart={startPackingLongPress}
  onTouchEnd={cancelPackingLongPress}
  onContextMenu={handlePackingContextMenu}
  onClick={t => {
    if (isPackingLongPressRef.current) {
      t.preventDefault();
      t.stopPropagation();
      isPackingLongPressRef.current = false;
      return;
    }
    t.stopPropagation();
    if (ve && ve.length > 0) {
      const anyPacked = ve.some(item => item.isPacked);
      if (anyPacked) {
        H(r => r.map(item => ({ ...item, isPacked: false })));
        G({ message: "Đã uncheck toàn bộ danh sách để soạn lại!", type: "info" });
      } else {
        H(r => r.map(item => ({ ...item, isPacked: true })));
        G({ message: "Đã đánh dấu đã soạn toàn bộ!", type: "success" });
      }
    }
  }} 
  className="py-2.5 px-2 text-center align-middle font-black uppercase text-[10px] tracking-wider whitespace-nowrap cursor-pointer hover:text-primary transition-colors select-none relative" 
  style={{ color: cartColorConfig.headerText !== 'default' ? cartColorConfig.headerText : undefined }} 
  title="Bấm để uncheck toàn bộ / soạn lại (Đè để chọn số lần đọc lặp)"
>
  <span className={cartColorConfig.headerText === 'default' ? "text-[#8b6f47] dark:text-[#d4a574]" : ""}>Soạn</span>
  {packingRepeatCount !== 1 && (
    <span className="ml-1 px-1 py-0.2 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 text-[8.5px] font-black inline-block align-middle scale-90">
      {packingRepeatCount === Infinity || packingRepeatCount === 'Infinity' ? '∞' : `${packingRepeatCount}x`}
    </span>
  )}
</th><th className="px-3 py-2.5 align-middle whitespace-nowrap"><div className="flex items-center justify-between w-full"><div className="flex items-center gap-2.5"><span className="font-black uppercase tracking-wider text-[11px]" style={{ color: cartColorConfig.headerText !== 'default' ? cartColorConfig.headerText : undefined }}><span className={cartColorConfig.headerText === 'default' ? "text-[#8b6f47] dark:text-[#d4a574]" : ""}>Danh mục sản phẩm</span></span><span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary dark:text-emerald-400 text-[9px] font-black tracking-tight border border-primary/20" style={cartColorConfig.accentColor && cartColorConfig.accentColor !== 'default' ? { backgroundColor: `${cartColorConfig.accentColor}20`, borderColor: `${cartColorConfig.accentColor}40`, color: cartColorConfig.accentColor } : undefined}><span className="w-1.5 h-1.5 rounded-full bg-primary dark:bg-emerald-400" style={cartColorConfig.accentColor && cartColorConfig.accentColor !== 'default' ? { backgroundColor: cartColorConfig.accentColor } : undefined} />{ll} món</span></div><x.button
                                    whileHover={{ scale: 1.03 }}
                                    whileTap={{ scale: 0.97 }}
                                    onClick={t => {
                                      t.stopPropagation();
                                      const a = J.ui_enable_smart_sorting === "true" ? "false" : "true";
                                      Na(r => ({
                                        ...r,
                                        ui_enable_smart_sorting: a
                                      })), localStorage.setItem("ui_enable_smart_sorting", a), new BroadcastChannel("pos_data_sync").postMessage({
                                        type: "UI_SETTING_UPDATED",
                                        key: "ui_enable_smart_sorting",
                                        value: a
                                      });
                                    }}
                                    className={c(
                                      "relative overflow-hidden flex items-center gap-2 px-3 py-1 rounded-full cursor-pointer transition-colors duration-150 select-none shadow-xs border group/gom-nhom",
                                      J.ui_enable_smart_sorting === "true"
                                        ? "bg-[#2d5016]/12 hover:bg-[#2d5016]/20 dark:bg-emerald-500/20 dark:hover:bg-emerald-500/30 border-[#2d5016]/40 dark:border-emerald-400/40 text-[#2d5016] dark:text-emerald-300 shadow-[0_0_12px_rgba(45,80,22,0.12)] dark:shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                                        : "bg-[#8b6f47]/[0.06] hover:bg-[#8b6f47]/[0.12] dark:bg-white/[0.04] dark:hover:bg-white/[0.08] border-[#8b6f47]/20 dark:border-white/10 text-[#8b6f47] dark:text-[#d4a574]"
                                    )}
                                    style={J.ui_enable_smart_sorting === 'true' && cartColorConfig.accentColor && cartColorConfig.accentColor !== 'default' ? {
                                      backgroundColor: `${cartColorConfig.accentColor}25`,
                                      borderColor: cartColorConfig.accentColor,
                                      color: cartColorConfig.accentColor
                                    } : undefined}
                                    title="Gom nhóm thông minh tự động (Smart Sorting)"
                                  >
                                    <div className="absolute -right-1 -bottom-1.5 text-current opacity-[0.13] dark:opacity-[0.18] pointer-events-none -rotate-12 transition-transform duration-300 group-hover/gom-nhom:scale-125 select-none">
                                      <Es size={28} strokeWidth={2} />
                                    </div>
                                    <span className="text-[9px] font-black uppercase tracking-wider leading-none relative z-10 pt-0.5">GOM NHÓM</span>
                                    <div
                                      className={c(
                                        "relative z-10 w-6 h-3.5 rounded-full transition-colors duration-300 p-0.5 flex items-center shadow-inner",
                                        J.ui_enable_smart_sorting === "true"
                                          ? "bg-[#2d5016] dark:bg-emerald-500 justify-end"
                                          : "bg-[#8b6f47]/25 dark:bg-white/20 justify-start"
                                      )}
                                      style={J.ui_enable_smart_sorting === 'true' && cartColorConfig.accentColor && cartColorConfig.accentColor !== 'default' ? {
                                        backgroundColor: cartColorConfig.accentColor
                                      } : undefined}
                                    >
                                      <x.div
                                        layout={!0}
                                        transition={{
                                          type: "spring",
                                          stiffness: 600,
                                          damping: 35
                                        }}
                                        className="w-2.5 h-2.5 rounded-full bg-white shadow-sm ring-1 ring-black/10"
                                      />
                                    </div>
                                  </x.button></div></th><th className="py-2.5 px-3 text-center align-middle font-black uppercase text-[10px] tracking-wider whitespace-nowrap" style={{ color: cartColorConfig.headerText !== 'default' ? cartColorConfig.headerText : undefined }}><span className={cartColorConfig.headerText === 'default' ? "text-[#8b6f47] dark:text-[#d4a574]" : ""}>Đơn vị</span></th><th className="py-2 px-2 text-center align-middle font-black uppercase text-[10px] tracking-wider whitespace-nowrap" style={{ color: cartColorConfig.headerText !== 'default' ? cartColorConfig.headerText : undefined }}><div className="flex flex-col items-center justify-center leading-tight"><span className={cartColorConfig.headerText === 'default' ? "text-[#8b6f47] dark:text-[#d4a574]" : ""}>Quy đổi</span><span className={c("text-[10px] font-mono tabular-nums transition-colors mt-0.5", dl > 0 ? (cartColorConfig.headerText !== 'default' ? "" : "text-[#8b6f47] dark:text-[#d4a574]") + " font-black" : "opacity-40 font-normal")}>{dl > 0 ? z(dl) : "—"}</span></div></th><th className="py-2 px-2 text-center align-middle font-black uppercase text-[10px] tracking-wider whitespace-nowrap" style={{ color: cartColorConfig.headerText !== 'default' ? cartColorConfig.headerText : undefined }}><div className="flex flex-col items-center justify-center leading-tight"><span className={cartColorConfig.headerText === 'default' ? "text-[#8b6f47] dark:text-[#d4a574]" : ""}>Số lượng</span><span className={c("text-[10px] font-mono tabular-nums transition-colors mt-0.5", ol > 0 ? "text-primary dark:text-emerald-400 font-black" : "opacity-40 font-normal")}>{ol > 0 ? z(ol) : "—"}</span></div></th><th className="py-2.5 px-3 text-center align-middle font-black uppercase text-[10px] tracking-wider whitespace-nowrap" style={{ color: cartColorConfig.headerText !== 'default' ? cartColorConfig.headerText : undefined }}><span className={cartColorConfig.headerText === 'default' ? "text-[#8b6f47] dark:text-[#d4a574]" : ""}>Đơn giá</span></th><th className="py-2.5 px-3 text-center align-middle font-black uppercase text-[10px] tracking-wider whitespace-nowrap" style={{ color: cartColorConfig.headerText !== 'default' ? cartColorConfig.headerText : undefined }}><span className={cartColorConfig.headerText === 'default' ? "text-[#8b6f47] dark:text-[#d4a574]" : ""}>Thành tiền</span></th><th className="py-2.5 px-2 text-center align-middle" /></tr></thead><tbody className="divide-none"><tr className={c("sticky top-0 z-[150] hover:z-[1000] focus-within:z-[2001] transition-all duration-200 group/working-row bg-transparent", cartColorConfig.enableBorder !== false ? "border-b border-[#8b6f47]/20 dark:border-white/10" : "border-b-0")} style={{ backgroundColor: cartColorConfig.rowBg && cartColorConfig.rowBg !== 'default' ? cartColorConfig.rowBg : 'transparent', borderColor: cartColorConfig.enableBorder === false ? 'transparent' : (cartColorConfig.borderColor !== 'default' ? `${cartColorConfig.borderColor}40` : undefined) }} onContextMenu={e => {
  if (m.product) {
    e.preventDefault();
    e.stopPropagation();
    setItemContextMenu({
      type: 'product',
      data: m.product,
      position: { x: e.clientX, y: e.clientY }
    });
  }
}}><td 
  onMouseDown={startPackingLongPress}
  onMouseUp={cancelPackingLongPress}
  onMouseLeave={cancelPackingLongPress}
  onTouchStart={startPackingLongPress}
  onTouchEnd={cancelPackingLongPress}
  onClick={handlePackingSpeakerClick}
  onContextMenu={handlePackingContextMenu}
  title={isPackingSpeaking ? "Đang đọc danh sách soạn hàng (Bấm để dừng, đè để đổi số lần lặp)" : "Bấm để đọc toàn bộ danh sách soạn hàng (Đè để chọn số lần lặp)"} 
  className="py-2.5 px-1 text-center cursor-pointer select-none group/speaker-td relative"
>
  <div className={c(
    "w-8 h-8 mx-auto rounded-xl flex items-center justify-center border transition-all duration-200 relative select-none",
    isPackingSpeaking
      ? "bg-emerald-500 text-white border-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.5)] animate-pulse"
      : "bg-transparent text-primary dark:text-[#d4a574] border-[#8b6f47]/25 dark:border-white/15 hover:bg-primary hover:text-white dark:hover:bg-[#d4a574] dark:hover:text-black hover:border-transparent hover:scale-110 active:scale-95"
  )}>
    <Nd size={15} strokeWidth={2.5} className={isPackingSpeaking ? "animate-pulse" : "group-hover/speaker-td:animate-pulse"} />
    {packingRepeatCount !== 1 && (
      <span className={c(
        "absolute -top-1.5 -right-1.5 px-1 min-w-[15px] h-[15px] rounded-full text-[9px] font-black flex items-center justify-center leading-none shadow-xs ring-1 ring-white/50 dark:ring-black/50 pointer-events-none",
        isPackingSpeaking ? "bg-amber-500 text-white" : "bg-[#8b6f47] dark:bg-[#d4a574] text-white dark:text-black"
      )}>
        {packingRepeatCount === Infinity || packingRepeatCount === 'Infinity' ? '∞' : `${packingRepeatCount}x`}
      </span>
    )}
  </div>
</td>
<td 
  onContextMenu={handlePackingContextMenu}
  onClick={t => {
    t.stopPropagation();
    if (ve && ve.length > 0) {
      const anyPacked = ve.some(item => item.isPacked);
      if (anyPacked) {
        H(r => r.map(item => ({ ...item, isPacked: false })));
        G({ message: "Đã uncheck toàn bộ danh sách để soạn lại!", type: "info" });
      } else {
        H(r => r.map(item => ({ ...item, isPacked: true })));
        G({ message: "Đã đánh dấu đã soạn toàn bộ!", type: "success" });
      }
    }
  }} 
  title="Bấm để uncheck toàn bộ danh sách để soạn lại (Chuột phải để chọn số lần đọc lặp)" 
  className="py-2.5 px-1 text-center cursor-pointer select-none"
>
  <div className="w-8 h-8 rounded-xl bg-transparent text-primary dark:text-[#d4a574] border border-[#8b6f47]/25 dark:border-white/15 flex items-center justify-center mx-auto transition-all duration-200 group-hover/working-row:scale-110 hover:bg-primary hover:text-white dark:hover:bg-[#d4a574] dark:hover:text-black active:scale-95">
    <Ot size={16} strokeWidth={2.5} />
  </div>
</td><td className="py-2.5 px-2 relative"><div className="relative group/search flex items-center gap-2.5"><div className="relative flex-1"><div className="relative"><div className="absolute left-3.5 top-1/2 -translate-y-1/2 z-10 text-primary/60 dark:text-[#d4a574]/60 group-focus-within/search:text-primary dark:group-focus-within/search:text-[#d4a574] transition-colors"><Gs size={18} strokeWidth={2.5} /></div><input id="pos-quick-product-search" type="text" placeholder="Tìm kiếm sản phẩm thông minh (F2)..." className="w-full h-10 py-1.5 pl-10 pr-16 bg-transparent border border-[#8b6f47]/25 dark:border-white/15 rounded-xl font-extrabold font-sans text-[13.5px] tracking-normal leading-normal text-slate-900 dark:text-white outline-none transition-all duration-150 focus:border-primary/60 dark:focus:border-[#d4a574]/60 focus:ring-2 focus:ring-primary/20 dark:focus:ring-[#d4a574]/20 focus:bg-transparent placeholder:text-slate-400 dark:placeholder:text-slate-500 placeholder:text-[12.5px] placeholder:font-bold placeholder:font-sans placeholder:tracking-tight" autoComplete="off" value={Z} onChange={t => {
                                      const a = t.target.value;
                                      playTypingSoundUtil();
                                      ae(a), Ft(0), os(!0);
                                      if (se.current && (!productSearchCoords.top || productSearchCoords.top === 0)) {
                                        const rect = se.current.getBoundingClientRect();
                                        if (rect.width > 0 && rect.bottom > 0) {
                                          setProductSearchCoords({
                                            top: Math.round(rect.bottom + 6),
                                            left: Math.round(rect.left),
                                            width: Math.round(Math.max(rect.width, 700))
                                          });
                                        }
                                      }
                                      if (!a || a.trim() === "") {
                                        He({
                                          product: null,
                                          name: "",
                                          quantity: 0,
                                          price: 0,
                                          secondary_qty: 0
                                        });
                                      } else if (m.product && a !== m.name) {
                                        He({
                                          ...m,
                                          product: null,
                                          name: a,
                                          quantity: 0,
                                          price: 0,
                                          secondary_qty: 0
                                        });
                                      }
                                    }} onKeyDown={t => {
                                      if (t.key === "Escape") {
                                        t.preventDefault(), ae(""), os(!1), He({
                                          product: null,
                                          quantity: 0,
                                          price: 0,
                                          secondary_qty: 0,
                                          name: ""
                                        });
                                      } else if (t.key === "ArrowUp") {
                                        t.preventDefault();
                                        Ft(a => {
                                          const r = Math.max(a - 1, 0);
                                          requestAnimationFrame(() => {
                                            if (hs.current) {
                                              const n = hs.current.children[r];
                                              n && n.scrollIntoView({ block: "nearest" });
                                            }
                                          });
                                          return r;
                                        });
                                      } else if (t.key === "ArrowDown") {
                                        t.preventDefault();
                                        Ft(a => {
                                          const r = Math.min(a + 1, wt.length - 1);
                                          requestAnimationFrame(() => {
                                            if (hs.current) {
                                              const n = hs.current.children[r];
                                              n && n.scrollIntoView({ block: "nearest" });
                                            }
                                          });
                                          return r;
                                        });
                                      }else if (t.key === "Enter") {
                                        t.preventDefault();
                                        const a = t.target.value.trim();
                                        if (m.product && m.product.id) {
                                          const r = m.quantity && m.quantity !== 0 ? m.quantity : 1;
                                          ia(m.product, r, m.price);
                                          return;
                                        }
                                        if (a && wt.length === 0) {
                                          G({
                                            message: `Mã vạch ${a} không tồn tại`,
                                            type: "error"
                                          }), ae("");
                                          return;
                                        }
                                        if (Z && wt[De]) {
                                          const a = wt[De],
                                            r = m.quantity && m.quantity !== 0 ? m.quantity : 1,
                                            hasCustomPrice = Boolean(p && p.id && R && R[a.id] !== void 0),
                                            pPrice = hasCustomPrice ? R[a.id] : a.sale_price;
                                          ia(a, r, pPrice);
                                          return;
                                        }
                                      } else if (t.key === "Tab") {
                                        t.preventDefault();
                                        t.stopPropagation();
                                        if (m.product) {
                                          const a = Te === "Wholesale" && m.product.secondary_unit ? Pa : Pt;
                                          a.current?.focus(), a.current?.select?.();
                                        } else if (Z && (wt[De] || wt[0])) {
                                          const a = wt[De] || wt[0],
                                            r = m.quantity && m.quantity !== 0 ? m.quantity : 1,
                                            hasCustomPrice = Boolean(p && p.id && R && R[a.id] !== void 0);
                                          He({
                                            product: a,
                                            quantity: r,
                                            price: hasCustomPrice ? R[a.id] : a.sale_price,
                                            secondary_qty: r / (a.multiplier || 1),
                                            name: a.name
                                          });
                                          ae(a.name);
                                          if (Te !== "Wholesale") {
                                            Pt.current?.focus();
                                            Pt.current?.select?.();
                                          }
                                          requestAnimationFrame(() => {
                                            const s = Te === "Wholesale" && a.secondary_unit ? Pa : Pt;
                                            s.current?.focus(), s.current?.select?.();
                                          });
                                        } else {
                                          Pt.current?.focus();
                                          Pt.current?.select?.();
                                        }
                                      }
                                    }} onFocus={t => {
                                      t.target.select();
                                      requestAnimationFrame(() => {
                                        if (se.current) {
                                          const rect = se.current.getBoundingClientRect();
                                          if (rect.width > 0 && rect.bottom > 0) {
                                            const nextTop = Math.round(rect.bottom + 6),
                                              nextLeft = Math.round(rect.left),
                                              nextWidth = Math.round(Math.max(rect.width, 700));
                                            setProductSearchCoords(prev => {
                                              if (prev.top === nextTop && prev.left === nextLeft && prev.width === nextWidth) return prev;
                                              return { top: nextTop, left: nextLeft, width: nextWidth };
                                            });
                                          }
                                        }
                                      });
                                    }} ref={se} />{m.product ? (<div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5"><div className="flex items-center gap-2 relative z-[200]"><div onClick={t => {
                                      t.stopPropagation();
                                      const a = t.currentTarget.getBoundingClientRect();
                                      Xt(m.product), za({
                                        top: a.top,
                                        bottom: a.bottom,
                                        left: a.left,
                                        right: a.right
                                      }), Dt(!0);
                                    }} className={c("px-2.5 py-0.5 rounded-full text-[11px] font-black border transition-all flex items-center gap-1.5 hover:scale-105 active:scale-95 group/stock cursor-pointer select-none shadow-xs backdrop-blur-md", m.product.stock <= 0 ? "bg-gradient-to-r from-rose-500/15 via-red-500/20 to-rose-600/15 dark:from-rose-500/25 dark:to-rose-600/30 text-rose-700 dark:text-rose-300 border-rose-500/35 dark:border-rose-400/45 shadow-rose-500/10 hover:border-rose-500/60" : m.product.stock < 10 ? "bg-gradient-to-r from-amber-500/15 via-orange-500/20 to-amber-600/15 dark:from-amber-500/25 dark:to-amber-600/30 text-amber-800 dark:text-amber-300 border-amber-500/35 dark:border-amber-400/45 shadow-amber-500/10 hover:border-amber-500/60" : "bg-gradient-to-r from-emerald-500/15 via-teal-500/20 to-emerald-600/15 dark:from-emerald-500/25 dark:to-emerald-600/30 text-emerald-800 dark:text-emerald-300 border-emerald-500/35 dark:border-emerald-400/45 shadow-emerald-500/10 hover:border-emerald-500/60")} title="Kiểm tồn nhanh"><div className="flex items-center gap-1 tabular-nums">{m.product.stock <= 0 ? <Pr size={12} strokeWidth={2.6} className="text-rose-600 dark:text-rose-400 shrink-0" /> : m.product.stock < 10 ? <Comp_da size={12} strokeWidth={2.6} className="text-amber-600 dark:text-amber-400 shrink-0" /> : <Qa size={12} strokeWidth={2.6} className="text-emerald-600 dark:text-emerald-400 shrink-0" />}<span className="tabular-nums font-black">{m.product.stock}</span></div>{isAccountingFeatureEnabled && <><span className="w-px h-3 bg-current opacity-25 shrink-0" /><div className="inline-flex items-center gap-1 opacity-90 shrink-0 whitespace-nowrap" title="Tồn sổ sách kế toán"><ReceiptTextIcon size={11} strokeWidth={2.4} className="shrink-0" /><span className="tabular-nums font-black">{m.product.accounting_stock || 0}</span></div></>}</div></div></div>) : (!Z && <div className="absolute right-3 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded-md bg-[#8b6f47]/10 dark:bg-white/[0.08] text-[10px] font-black tracking-wider text-[#8b6f47] dark:text-[#d4a574] border border-[#8b6f47]/20 dark:border-white/[0.08] pointer-events-none">F2</div>)}</div></div><x.button whileHover={{
                                  scale: 1.02
                                }} whileTap={{
                                  scale: 0.95
                                }} onClick={() => {
                                  La(!0), $a({
                                    name: "",
                                    price: ""
                                  }), ae(""), setTimeout(() => ys.current?.focus(), 100);
                                }} tabIndex={-1} className="h-8 px-2.5 bg-transparent hover:bg-primary text-primary hover:text-white dark:hover:bg-[#2d5016] dark:text-[#d4a574] dark:hover:text-white rounded-xl font-black flex items-center gap-1.5 border border-[#8b6f47]/25 dark:border-white/15 hover:border-transparent dark:hover:border-transparent transition-all duration-200 whitespace-nowrap shrink-0 group/f6 active:scale-95 cursor-pointer" title="Thêm món ngoài (F6)"><div className="w-4.5 h-4.5 rounded-md bg-primary/15 text-primary group-hover/f6:bg-white/20 group-hover/f6:text-white dark:bg-[#d4a574]/15 dark:text-[#d4a574] dark:group-hover/f6:text-white flex items-center justify-center group-hover/f6:rotate-12 transition-all"><Ot size={11} strokeWidth={3} /></div><div className="px-1 py-0.5 rounded bg-[#8b6f47]/15 dark:bg-[#d4a574]/20 group-hover/f6:bg-white/20 text-[#8b6f47] dark:text-[#d4a574] group-hover/f6:text-white text-[7.5px] font-black border border-[#8b6f47]/20 dark:border-[#d4a574]/30 group-hover/f6:border-white/30 transition-all">F6</div></x.button></div><Fn><Ws>{Z && !m.product && productSearchCoords.top > 0 && (
  <ResizableDropdownContainer
    key="pos-product-dropdown"
    id="pos-product-dropdown"
    dropdownKey="pos-product-dropdown"
    storageKey="pos_product_dropdown_size"
    coords={productSearchCoords}
    defaultWidth={720}
    defaultMaxHeight={480}
    scrollRef={hs}
    itemCount={wt.length}
  >
{wt.map((t, a) => (
  <ProductSearchItem
    key={t.id}
    product={t}
    isActive={a === De}
    index={a}
    colorTheme={Mt}
    showLastPurchaseBadge={showLastPurchaseBadge}
    lastPurchase={partnerLastPurchases?.[t.id]}
    accountingEnabled={isAccountingFeatureEnabled}
    onHover={(idx) => {
      if (De !== idx) Ft(idx);
    }}
    onSelect={(selectedProd) => {
      const s = m.quantity && m.quantity !== 0 ? m.quantity : 1;
      const hasCustomPrice = Boolean(p && p.id && R && R[selectedProd.id] !== void 0);
      He({
        product: selectedProd,
        quantity: s,
        price: hasCustomPrice ? R[selectedProd.id] : selectedProd.sale_price,
        secondary_qty: s / (selectedProd.multiplier || 1),
        name: selectedProd.name
      });
      ae(selectedProd.name);
    }}
    onQuickStock={(prod, coords) => {
      Xt(prod);
      za(coords);
      Dt(!0);
    }}
    onContextMenu={(e, prod) => {
      setItemContextMenu({
        type: 'product',
        data: prod,
        position: { x: e.clientX, y: e.clientY }
      });
    }}
  />
))}
{Z && wt.length === 0 && <div className="dropdown-item flex items-center justify-center gap-3 font-black uppercase text-[12px] tracking-widest border-t border-transparent" onClick={() => {
                                      dn(Z), ur(!0);
                                    }}><Ot size={18} strokeWidth={3} /><span>Thêm sản phẩm mới: "{Z}"</span></div>}</ResizableDropdownContainer>)}
{Tt !== null && zt && cartRowSearchCoords.top > 0 && ve[Tt] && (
  <ResizableDropdownContainer
    key="cart-row-product-dropdown"
    id="cart-row-product-dropdown"
    dropdownKey="cart-row-product-dropdown"
    storageKey="pos_product_dropdown_size"
    coords={cartRowSearchCoords}
    defaultWidth={720}
    defaultMaxHeight={480}
    scrollRef={Ea}
    itemCount={cartFilteredProducts.length}
  >
{cartFilteredProducts.map((r, s) => {
  const curRow = ve[Tt];
  const hasCustomPrice = Boolean(p && p.id && R && R[r.id] !== void 0);
  const displayPrice = hasCustomPrice ? R[r.id] : ((Te === "Wholesale" && r.bulk_price) || r.sale_price);
  return (
    <ProductSearchItem
      key={r.id}
      product={r}
      isActive={s === It}
      index={s}
      colorTheme={Mt}
      displayPrice={displayPrice}
      showLastPurchaseBadge={showLastPurchaseBadge}
      lastPurchase={partnerLastPurchases?.[r.id]}
      accountingEnabled={isAccountingFeatureEnabled}
      onHover={(idx) => {
        if (It !== idx) Ca(idx);
      }}
      onSelect={(selectedProd) => {
        if (!curRow) return;
        let n = [...y];
        const l = n.findIndex(u => u.cartId === curRow.cartId);
        if (l === -1) return;
        const d = n[l].quantity;
        const o = n.findIndex((u, h) => h !== l && u.product_id === selectedProd.id);
        if (o > -1) {
          n[o].quantity += d;
          n[o].secondary_qty = n[o].quantity / (n[o].multiplier || 1);
          n.splice(l, 1);
        } else {
          n[l] = {
            ...n[l],
            product_id: selectedProd.id,
            product_name: selectedProd.name,
            unit: selectedProd.unit,
            secondary_unit: selectedProd.secondary_unit,
            multiplier: selectedProd.multiplier || 1,
            price: displayPrice,
            cost_price: selectedProd.cost_price,
            latest_cost_price: selectedProd.latest_cost_price,
            stock: selectedProd.stock,
            is_combo: selectedProd.is_combo,
            active_ingredient: selectedProd.active_ingredient,
            is_manual_price: false
          };
          delete n[l]?.ai_scanned;
        }
        H(n);
        ct(null);
        ls("");
        setTimeout(() => {
          const targetCartId = o > -1 ? n[o > l ? o - 1 : o].cartId : n[l].cartId;
          const b = ve.findIndex(O => O.cartId === targetCartId);
          const S = b > -1 ? b : (o > -1 ? (o > l ? o - 1 : o) : l);
          const w = document.getElementById(`qty-sec-${S}`);
          if (Te === "Wholesale" && w && !w.disabled) {
            w.focus();
            w.select?.();
          } else {
            const O = document.getElementById(`qty-main-${S}`);
            O?.focus();
            O?.select?.();
          }
        }, 100);
      }}
      onQuickStock={(prod, coords) => {
        Xt(prod);
        za(coords);
        Dt(!0);
      }}
      onContextMenu={(e, prod) => {
        setItemContextMenu({
          type: 'product',
          data: prod,
          position: { x: e.clientX, y: e.clientY }
        });
      }}
    />
  );
})}
{zt && cartFilteredProducts.length === 0 && (
  <div className="dropdown-item flex items-center justify-center gap-3 font-black uppercase text-[12px] tracking-widest border-t border-transparent" onClick={() => {
    dn(zt), ur(!0);
  }}>
    <Ot size={18} strokeWidth={3} />
    <span>Thêm sản phẩm mới: "{zt}"</span>
  </div>
)}
</ResizableDropdownContainer>)}</Ws></Fn></td><td className="py-2.5 px-2 text-center"><div className="font-bold font-sans text-slate-700 dark:text-slate-200 text-xs leading-normal">{m.product ? Ae(m.product.unit) : "-"}</div>{m.product && m.product.secondary_unit && <div className="text-[9.5px] text-primary dark:text-[#d4a574] font-black uppercase tracking-tighter leading-tight font-sans">1 {Ae(m.product.secondary_unit)} = {m.product.multiplier} {Ae(m.product.unit)}</div>}</td><td className="py-2.5 px-2">{m.product && m.product.secondary_unit ? <div className="flex items-center gap-1 h-10 px-2 bg-transparent border border-[#8b6f47]/25 dark:border-white/15 rounded-xl focus-within:border-primary/50 dark:focus-within:border-[#d4a574]/50 focus-within:ring-2 focus-within:ring-primary/15 transition-all text-primary dark:text-foreground"><input type="number" step="any" tabIndex={Te === "Wholesale" ? 0 : -1} className="w-full min-w-0 bg-transparent text-center font-black font-sans text-sm outline-none placeholder:text-muted-foreground/30 leading-normal" value={m.secondary_qty !== undefined && m.secondary_qty !== null && m.secondary_qty !== "" ? (typeof m.secondary_qty === 'number' ? Math.round((m.secondary_qty + Number.EPSILON) * 1000) / 1000 : m.secondary_qty) : ""} id="working-sec-qty" ref={Pa} autoComplete="off" onFocus={t => t.target.select()} onChange={t => {
                                    const a = parseFloat(t.target.value) || 0;
                                    He(r => {
                                      const s = parseFloat(r.product?.multiplier) || 1;
                                      return {
                                        ...r,
                                        secondary_qty: a,
                                        quantity: a * s
                                      };
                                    });
                                  }} onKeyDown={t => {
                                    if (t.key === "Tab") {
                                      t.preventDefault(), t.stopPropagation();
                                      if (t.shiftKey) {
                                        se.current?.focus(), se.current?.select?.();
                                      } else {
                                        Pt.current?.focus(), Pt.current?.select?.();
                                      }
                                    } else if (t.key === "Enter") {
                                      t.preventDefault(), m.product && m.quantity !== 0 && ia(m.product, m.quantity, m.price);
                                    }
                                  }} /><span className="text-[10px] font-black font-sans text-muted-foreground uppercase pr-1 shrink-0 leading-normal">{Ae(m.product.secondary_unit)}</span></div> : <div className="text-center text-muted-foreground italic text-[10px] font-bold h-[40px] flex items-center justify-center font-sans">N/A</div>}</td><td className="py-2.5 px-2 group/qty"><div className="relative w-full"><input type="number" style={{ color: (cartColorConfig?.cartValuesColor && cartColorConfig.cartValuesColor !== 'default') ? cartColorConfig.cartValuesColor : undefined }} className="w-full h-10 text-center bg-transparent border border-[#8b6f47]/25 dark:border-white/15 rounded-xl focus:border-primary/50 dark:focus:border-[#d4a574]/50 focus:ring-2 focus:ring-primary/15 outline-none font-black font-sans text-base text-primary dark:text-foreground leading-normal transition-all" value={m.product ? m.quantity : ""} id="working-main-qty" ref={Pt} autoComplete="off" onFocus={t => t.target.select()} onChange={t => {
                                    const a = parseFloat(t.target.value) || 0;
                                    He(r => {
                                      const s = parseFloat(r.product?.multiplier) || 1;
                                      return {
                                        ...r,
                                        quantity: a,
                                        secondary_qty: Math.round(((a / s) + Number.EPSILON) * 1000) / 1000
                                      };
                                    });
                                  }} onKeyDown={t => {
                                    if (t.key === "Tab") {
                                      t.preventDefault(), t.stopPropagation();
                                      if (t.shiftKey) {
                                        if (Te === "Wholesale" && m.product?.secondary_unit) {
                                          Pa.current?.focus(), Pa.current?.select?.();
                                        } else {
                                          se.current?.focus(), se.current?.select?.();
                                        }
                                      } else {
                                        if (blockTabPrice) {
                                          t.target.select?.();
                                        } else {
                                          ms.current?.focus(), ms.current?.select?.();
                                        }
                                      }
                                    } else if (t.key === "Enter") {
                                      t.preventDefault(), m.product && m.quantity !== 0 && ia(m.product, m.quantity, m.price);
                                    }
                                  }} /><button tabIndex={-1} className="absolute -top-2 -right-2 w-5 h-5 flex items-center justify-center bg-[#8b6f47]/10 dark:bg-white/10 text-[#8b6f47] dark:text-[#d4a574] rounded-full border border-[#8b6f47]/20 dark:border-white/15 hover:bg-[#8b6f47]/20 dark:hover:bg-white/20 active:scale-90 z-[70] transition-all hover:scale-110 opacity-0 group-hover/qty:opacity-100" onClick={() => {
                                    He(t => ({
                                      ...t,
                                      quantity: t.quantity * -1,
                                      secondary_qty: t.secondary_qty * -1
                                    })), Pt.current?.focus();
                                  }} title="Đổi thành Trả Hàng (Âm)"><Ms size={11} strokeWidth={3} /></button></div></td><td className="py-2.5 px-2 text-right"><div className="flex flex-col items-center gap-1 group/price relative group-hover/price:z-[500]">{m.product && <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 p-1 bg-[#ede8dc]/95 dark:bg-slate-900/95 backdrop-blur-2xl rounded-2xl border border-[#8b6f47]/30 dark:border-white/15 shadow-2xl shadow-[#8b6f47]/10 dark:shadow-black/50 flex items-stretch whitespace-nowrap z-[9999] opacity-0 group-hover/price:opacity-100 group-focus-within/price:opacity-100 transition-all duration-300 pointer-events-none -translate-y-2 group-hover/price:translate-y-0 group-focus-within/price:translate-y-0 ring-1 ring-black/5 dark:ring-white/5"><div className="flex flex-col items-center px-3 py-1.5 hover:bg-black/5 dark:hover:bg-white/5 rounded-xl transition-colors"><span className="text-[8.5px] uppercase font-black font-sans text-slate-500/80 dark:text-slate-400 leading-none mb-1 tracking-[0.1em]">Vốn TB</span><span className="text-xs font-black font-sans text-amber-700 dark:amber-300 tabular-nums leading-normal">{z(m.product.cost_price)}<span className="text-[9px] ml-0.5 opacity-60">đ</span></span></div><div className="w-px my-1.5 bg-gradient-to-b from-transparent via-[#8b6f47]/20 dark:via-white/15 to-transparent" /><div className="flex flex-col items-center px-3 py-1.5 hover:bg-black/5 dark:hover:bg-white/5 rounded-xl transition-colors"><span className="text-[8.5px] uppercase font-black font-sans text-[#8b6f47] dark:text-[#d4a574] leading-none mb-1 tracking-[0.1em]">Nhập cuối</span><span className="text-xs font-black font-sans text-emerald-600 dark:text-emerald-400 tabular-nums leading-normal">{z(m.product.latest_cost_price || 0)}<span className="text-[9px] ml-0.5 opacity-60">đ</span></span></div><div className="absolute bottom-full left-1/2 -translate-x-1/2 border-[5px] border-transparent border-b-[#ede8dc]/95 dark:border-b-slate-900/95 drop-shadow-xs" /></div>}<input type="text" tabIndex={blockTabPrice ? -1 : 0} style={{ color: (cartColorConfig?.cartValuesColor && cartColorConfig.cartValuesColor !== 'default' && !(m.product && (m.price < m.product.cost_price || m.price < (m.product.latest_cost_price || 0)))) ? cartColorConfig.cartValuesColor : undefined }} className={c("w-full h-10 text-center bg-transparent border border-[#8b6f47]/25 dark:border-white/15 rounded-xl focus:border-primary/50 dark:focus:border-[#d4a574]/50 focus:ring-2 focus:ring-primary/15 outline-none font-black font-sans text-base leading-normal transition-all", m.product && m.price < m.product.cost_price ? "text-rose-600 dark:text-rose-400 bg-rose-500/15 dark:bg-rose-900/20 focus:ring-rose-200" : m.product && m.price < (m.product.latest_cost_price || 0) ? "text-orange-600 dark:text-orange-400 bg-orange-500/15 dark:bg-orange-900/10 focus:ring-orange-200" : "text-primary dark:text-foreground")} value={m.product ? z(m.price) : ""} id="working-price" ref={ms} autoComplete="off" onFocus={t => t.target.select()} onChange={t => {
                                    const a = parseFloat(t.target.value.replace(/,/g, "")) || 0;
                                    He({
                                      ...m,
                                      price: a
                                    });
                                  }} onKeyDown={t => {
                                    t.key === "Enter" ? (t.preventDefault(), m.product && m.quantity !== 0 && ia(m.product, m.quantity, m.price)) : t.key === "Tab" && !t.shiftKey && (t.preventDefault(), t.stopPropagation(), se.current?.focus());
                                  }} /><P initial={false}>
  {m.product && (m.price < m.product.cost_price || (m.price < (m.product.latest_cost_price || 0) && m.price >= m.product.cost_price) || (m.price < m.product.sale_price && m.price >= (m.product.latest_cost_price || m.product.cost_price)) || (p && R[m.product.id] !== void 0 && m.price === m.product.sale_price)) && (
    <x.div
      initial={{ height: 0, opacity: 0, scale: 0.85, marginTop: 0 }}
      animate={{ height: "auto", opacity: 1, scale: 1, marginTop: 4 }}
      exit={{ height: 0, opacity: 0, scale: 0.85, marginTop: 0 }}
      transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
      className="overflow-hidden flex items-center gap-1"
    >
      {m.price < m.product.cost_price && (
        <div key="input-loss" className="bg-rose-500/15 dark:bg-rose-500/25 text-rose-700 dark:text-rose-300 text-[8.5px] px-2 py-0.5 rounded-full font-black whitespace-nowrap z-10 flex items-center gap-1 border border-rose-500/30 dark:border-rose-400/40">
          <Comp_da size={11} strokeWidth={2.6} className="text-rose-600 dark:text-rose-400" />LỖ VỐN
        </div>
      )}
      {m.price < (m.product.latest_cost_price || 0) && m.price >= m.product.cost_price && (
        <div key="input-below-new" className="bg-orange-500/15 dark:bg-orange-500/25 text-orange-700 dark:text-orange-300 text-[8.5px] px-2 py-0.5 rounded-full font-black whitespace-nowrap z-10 flex items-center gap-1 border border-orange-500/30 dark:border-orange-400/40">
          <$n size={11} strokeWidth={2.6} className="text-orange-600 dark:text-orange-400" />DƯỚI VỐN NHẬP
        </div>
      )}
      {m.price < ((Te === "Wholesale" && m.product.bulk_price) || m.product.sale_price) && m.price >= (m.product.latest_cost_price || m.product.cost_price) && (
        <div key="input-low-price" className="bg-amber-500/15 dark:bg-amber-500/25 text-amber-800 dark:text-amber-300 text-[8.5px] px-2 py-0.5 rounded-full font-black whitespace-nowrap z-10 flex items-center gap-1 border border-amber-500/30 dark:border-amber-400/40">
          <Cd size={11} strokeWidth={2.6} className="text-amber-600 dark:text-amber-400" />GIÁ THẤP ({z((Te === "Wholesale" && m.product.bulk_price) || m.product.sale_price)}đ)
        </div>
      )}
      {p && R[m.product.id] !== void 0 && m.price === m.product.sale_price && (
        <div key="input-sync" className="bg-emerald-500/15 dark:bg-emerald-500/25 text-emerald-800 dark:text-emerald-300 text-[8.5px] px-2 py-0.5 rounded-full font-black whitespace-nowrap z-10 flex items-center gap-1 border border-emerald-500/30 dark:border-emerald-400/40">
          <Sd size={11} className="text-emerald-600 dark:text-emerald-400" /><span className="text-[8.5px] font-black uppercase tracking-wider">Đồng bộ giá</span>
        </div>
      )}
    </x.div>
  )}
</P></div></td><td className="py-2 px-2 text-right"><div style={{ color: (m.quantity >= 0 && cartColorConfig?.cartValuesColor && cartColorConfig.cartValuesColor !== 'default') ? cartColorConfig.cartValuesColor : undefined }} className={c("font-black font-sans text-base leading-normal transition-colors", m.quantity < 0 ? "text-rose-600 dark:text-rose-400" : "text-primary")}>{m.product ? z(m.price * m.quantity) : ""}</div>{m.quantity < 0 && <span className="inline-block px-2.5 py-0.5 bg-gradient-to-r from-rose-500/15 to-red-500/20 text-rose-700 dark:text-rose-300 rounded-full text-[8.5px] font-black uppercase tracking-widest border border-rose-500/30 dark:border-rose-400/40 shadow-xs shadow-rose-500/10 mt-0.5 backdrop-blur-md">Hàng trả</span>}</td><td className="py-2 px-1.5 text-center">{m.product && <button onClick={() => {
                                  ae("");
                                  He({
                                    product: null,
                                    quantity: 0,
                                    price: 0,
                                    secondary_qty: 0,
                                    name: ""
                                  });
                                }} className="group/clear-btn w-7 h-7 mx-auto rounded-lg flex items-center justify-center text-slate-400/80 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 bg-transparent hover:bg-rose-500/15 dark:hover:bg-rose-500/20 border border-transparent hover:border-rose-500/30 dark:hover:border-rose-500/40 hover:shadow-[0_0_10px_rgba(244,63,94,0.25)] hover:scale-110 active:scale-95 transition-all duration-200 cursor-pointer" title="Xóa dòng tạm"><Comp_ke size={15} strokeWidth={2.5} className="transition-transform duration-200 group-hover/clear-btn:rotate-90" /></button>}</td></tr><P initial={!1}>{...Qi || []}{g !== "remote_inspect" && ve.length > 0 && ve.map((t, a) => (
  <CartTableRow
    key={t.cartId || `cart-row-${a}-${t.product_id}`}
    item={t}
    index={a}
    totalRows={ve.length}
    cartColorConfig={cartColorConfig}
    productsList={T}
    selectedPartner={p}
    partnerCustomPrices={R}
    partnerLastPurchases={partnerLastPurchases}
    showLastPurchaseBadge={showLastPurchaseBadge}
    posMode={Te}
    blockTabPrice={blockTabPrice}
    isSearchFocused={Tt === a}
    searchQuery={zt}
    onUpdateField={_r}
    onRemove={bl}
    onTogglePack={xl}
    onQuickStockCheck={(prod, coords) => {
      Xt(prod);
      za(coords);
      Dt(!0);
    }}
    onContextMenu={(e, item, idx) => {
      const r = T.find(s => s.id === item.product_id) || item;
      if (r) {
        e.preventDefault();
        e.stopPropagation();
        setItemContextMenu({
          type: 'product',
          data: r,
          position: { x: e.clientX, y: e.clientY },
          onDelete: () => H(prev => prev.filter((_, i) => i !== idx))
        });
      }
    }}
    onFocusSearch={(e, idx, item) => {
      ct(idx);
      ls(item.product_name);
      Ca(0);
      if (e?.target) {
        e.target.select?.();
        const rect = e.target.getBoundingClientRect();
        if (rect.width > 0 && rect.bottom > 0) {
          setCartRowSearchCoords({
            top: Math.round(rect.bottom + 6),
            left: Math.round(rect.left),
            width: Math.round(Math.max(rect.width, 700))
          });
        }
      } else {
        setTimeout(() => {
          const r = document.getElementById(`row-name-${idx}`);
          r?.focus();
          r?.select?.();
        }, 50);
      }
    }}
    onChangeSearch={(e) => {
      ls(e.target.value);
      Ca(0);
    }}
    onBlurSearch={() => {
      setTimeout(() => {
        ct(r => r === a ? null : r);
      }, 200);
    }}
    onKeyDownSearch={(e, idx, item) => {
      const s = cartFilteredProducts;
      if (e.key === "ArrowDown") {
        if (Tt === idx && s.length > 0) {
          e.preventDefault();
          Ca(n => {
            const l = Math.min(n + 1, s.length - 1);
            requestAnimationFrame(() => {
              if (Ea.current) {
                const d = Ea.current.children[l];
                d && d.scrollIntoView({ block: "nearest" });
              }
            });
            return l;
          });
        } else {
          e.preventDefault();
          const n = idx + 1;
          n < ve.length && document.getElementById(`row-name-${n}`)?.focus();
        }
      } else if (e.key === "ArrowUp") {
        if (Tt === idx && s.length > 0) {
          e.preventDefault();
          Ca(n => {
            const l = Math.max(n - 1, 0);
            requestAnimationFrame(() => {
              if (Ea.current) {
                const d = Ea.current.children[l];
                d && d.scrollIntoView({ block: "nearest" });
              }
            });
            return l;
          });
        } else {
          e.preventDefault();
          const n = idx - 1;
          n >= 0 ? document.getElementById(`row-name-${n}`)?.focus() : se.current?.focus();
        }
      } else if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        if (s[It]) {
          const l = s[It];
          let d = [...y];
          const o = item.quantity,
            hasCust = Boolean(p && p.id && R && R[l.id] !== void 0),
            unitPrice = hasCust ? R[l.id] : ((Te === "Wholesale" && l.bulk_price) || l.sale_price),
            u = d.findIndex(b => b.cartId !== item.cartId && b.product_id === l.id),
            h = d.findIndex(b => b.cartId === item.cartId);
          if (h > -1) {
            if (u > -1) {
              d[u].quantity += o;
              d[u].secondary_qty = d[u].quantity / (d[u].multiplier || 1);
              d.splice(h, 1);
              H(d);
              ct(null);
              ls("");
              setTimeout(() => {
                const b = ve.findIndex(O => O.cartId === d[u > h ? u - 1 : u].cartId),
                  S = b > -1 ? b : (u > h ? u - 1 : u),
                  w = document.getElementById(`qty-sec-${S}`);
                if (Te === "Wholesale" && w && !w.disabled) w.focus(), w.select?.();
                else {
                  const O = document.getElementById(`qty-main-${S}`);
                  O?.focus(), O?.select?.();
                }
              }, 100);
            } else {
              d[h] = {
                ...d[h],
                product_id: l.id,
                product_name: l.name,
                unit: l.unit,
                secondary_unit: l.secondary_unit,
                multiplier: l.multiplier || 1,
                price: unitPrice,
                cost_price: l.cost_price,
                latest_cost_price: l.latest_cost_price,
                stock: l.stock,
                latest_stock_entry: l.latest_stock_entry,
                is_combo: l.is_combo,
                secondary_qty: o / (l.multiplier || 1),
                active_ingredient: l.active_ingredient,
                is_manual_price: false
              };
              delete d[h]?.ai_scanned;
              H(d);
              ct(null);
              ls("");
              setTimeout(() => {
                const w = document.getElementById(`qty-sec-${idx}`);
                if (Te === "Wholesale" && w && !w.disabled) w.focus(), w.select?.();
                else {
                  const S = document.getElementById(`qty-main-${idx}`);
                  S?.focus(), S?.select?.();
                }
              }, 100);
            }
          }
        } else {
          ct(null);
          setTimeout(() => {
            const w = document.getElementById(`qty-sec-${idx}`);
            if (Te === "Wholesale" && w && !w.disabled) w.focus(), w.select?.();
            else {
              const S = document.getElementById(`qty-main-${idx}`);
              S?.focus(), S?.select?.();
            }
          }, 100);
        }
      }
    }}
  />
))}</P></tbody></table></div></div><P>{ea && <x.div initial={{
                      opacity: 0
                    }} animate={{
                      opacity: 1
                    }} exit={{
                      opacity: 0,
                      transition: {
                        duration: 0.2
                      }
                    }} className="no-print print:hidden absolute inset-0 z-[500] pointer-events-none rounded-3xl flex items-center justify-center p-4"><x.div initial={{
                        scale: 0.88,
                        opacity: 0,
                        y: 10
                      }} animate={{
                        scale: 1,
                        opacity: 1,
                        y: 0
                      }} exit={{
                        scale: 0.92,
                        opacity: 0,
                        y: -8,
                        transition: {
                          duration: 0.18
                        }
                      }} transition={{
                        type: "spring",
                        stiffness: 450,
                        damping: 28
                      }} className="bg-[#fbf8f2] dark:bg-[#1a1e17] border-2 border-[#8b6f47]/30 dark:border-[#d4a574]/30 shadow-2xl rounded-3xl px-6 py-5 md:px-8 md:py-6 flex flex-col items-center gap-2.5 text-center w-auto max-w-md mx-auto relative overflow-hidden pointer-events-auto"><svg className="absolute inset-0 w-full h-full pointer-events-none z-20"><x.rect x="1" y="1" width="calc(100% - 2px)" height="calc(100% - 2px)" rx="23" fill="none" stroke="#10b981" strokeWidth="2" pathLength="100" strokeDasharray="25 75" initial={{
                            strokeDashoffset: 100
                          }} animate={{
                            strokeDashoffset: 0
                          }} transition={{
                            duration: 0.85,
                            ease: "easeInOut"
                          }} /></svg><div className="relative flex items-center justify-center mb-0.5"><x.div initial={{ scale: 0.5, rotate: -15 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 500, damping: 22 }} className="w-14 h-14 rounded-full bg-gradient-to-tr from-[#2d5016] to-emerald-600 text-white flex items-center justify-center shadow-lg shadow-[#2d5016]/25 relative z-10"><Os size={30} strokeWidth={3.5} /></x.div></div><div className="text-base sm:text-lg font-black uppercase tracking-tight text-[#2d5016] dark:text-emerald-400 whitespace-nowrap select-none">ĐÃ LƯU ĐƠN HÀNG THÀNH CÔNG!</div><div className="flex items-center flex-nowrap whitespace-nowrap gap-2 px-3.5 py-1 rounded-full bg-[#8b6f47]/10 dark:bg-[#d4a574]/15 border border-[#8b6f47]/25 dark:border-[#d4a574]/30 text-[#2d5016] dark:text-[#d4a574] text-xs font-black uppercase tracking-wide shrink-0"><span>ĐƠN #{ea.id}</span><span className="opacity-40">•</span><span>{ea.count} MÓN</span>{ea.partnerName && ea.partnerName !== "Khách lẻ" && <><span className="opacity-40">•</span><span className="truncate max-w-[140px]">{ea.partnerName}</span></>}</div></x.div></x.div>}</P><P>{Ze === "sidebar" && !ka && <>
  <x.div
    key="partner-bubble"
    id="partner-bubble"
    data-bubble="partner"
    ref={partnerBubbleRef}
    layout
    initial={{
      opacity: 0,
      scale: 0.92,
      y: 24,
      filter: "blur(12px)"
    }}
    animate={{
      opacity: 1,
      scale: 1,
      y: 0,
      filter: "blur(0.01px)"
    }}
    exit={{
      opacity: 0,
      scale: 0.92,
      y: 24,
      filter: "blur(12px)",
      transition: {
        duration: 0.2,
        ease: "easeInOut"
      }
    }}
    transition={{
      layout: { duration: 0.28, ease: [0.25, 1, 0.5, 1] },
      type: "spring",
      stiffness: 350,
      damping: 26,
      mass: 0.8
    }}
    className="absolute bottom-3 left-3 z-[110] pointer-events-none flex flex-col items-start gap-2.5"
  >
    <div className="flex items-center gap-2.5 pointer-events-auto">
      <x.div
        key="partner-card-bubble"
        layout
        initial={{ opacity: 0, scale: 0.92, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 12 }}
        transition={{
          layout: { duration: 0.28, ease: [0.25, 1, 0.5, 1] },
          type: "spring",
          stiffness: 400,
          damping: 28
        }}
        onClick={t => {
          t.stopPropagation(), p ? setIsHistoryPanelOpen(true) : Xr(!0);
        }}
        style={getBubbleComputedStyle(cartColorConfig, 'partner')}
        className="flex items-start group/partner-bubble cursor-pointer hover:scale-[1.02] active:scale-[0.99] transition-shadow transition-border duration-300 p-3 px-5 rounded-2xl border-2 border-[#8b6f47]/40 dark:border-[#d4a574]/35 bg-[#fbf9f4] dark:bg-[#1a1e17] backdrop-blur-xl hover:border-[#2d5016] dark:hover:border-emerald-400 shadow-[0_10px_22px_-2px_rgba(139,111,71,0.24)] dark:shadow-[0_12px_24px_-2px_rgba(0,0,0,0.7)] hover:shadow-[0_14px_28px_-2px_rgba(139,111,71,0.3)] relative overflow-hidden"
      >
        <Gn className="absolute -right-4 -bottom-4 w-28 h-28 text-[#8b6f47]/10 dark:text-[#d4a574]/10 -rotate-12 transition-transform group-hover/partner-bubble:scale-110 group-hover/partner-bubble:-rotate-6 pointer-events-none" style={getBubbleComputedStyle(cartColorConfig, 'partner')?.color ? { color: getBubbleComputedStyle(cartColorConfig, 'partner').color, opacity: 0.1 } : undefined} />
        <x.div layout transition={{ layout: { duration: 0.28, ease: [0.25, 1, 0.5, 1] } }} className="flex flex-col max-w-[300px] min-w-[200px] relative z-10">
          <div className="text-[9px] font-black uppercase tracking-[0.15em] text-[#8b6f47] dark:text-[#d4a574] mb-0.5 leading-normal py-0.5" style={getBubbleComputedStyle(cartColorConfig, 'partner')?.color ? { color: getBubbleComputedStyle(cartColorConfig, 'partner').color } : undefined}>
            Đối tác / Khách hàng
          </div>
          <div className="flex items-center gap-1.5 mb-1">
            {g === "remote_inspect" ? (
              <span className="px-1.5 py-0.5 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 rounded-md text-[9px] font-black tracking-wider shrink-0 border border-emerald-500/20">
                MÁY TRẠM
              </span>
            ) : (
              p && (
                <span 
                  className={c("px-1.5 py-0.5 rounded-md text-[9px] font-black tracking-wider shrink-0 border transition-all", !getBubbleComputedStyle(cartColorConfig, 'partner')?.color && "bg-[#8b6f47]/15 dark:bg-[#d4a574]/20 text-[#8b6f47] dark:text-[#d4a574] border-[#8b6f47]/30 dark:border-[#d4a574]/30")}
                  style={getBubbleComputedStyle(cartColorConfig, 'partner')?.color ? { color: getBubbleComputedStyle(cartColorConfig, 'partner').color, borderColor: `${getBubbleComputedStyle(cartColorConfig, 'partner').color}40`, backgroundColor: `${getBubbleComputedStyle(cartColorConfig, 'partner').color}20` } : undefined}
                >
                  ID: {p.id}
                </span>
              )
            )}
            <div className="text-base font-black text-[#2d5016] dark:text-emerald-400 uppercase leading-normal py-0.5 tracking-tight truncate" style={getBubbleComputedStyle(cartColorConfig, 'partner')?.color ? { color: getBubbleComputedStyle(cartColorConfig, 'partner').color } : undefined}>
              {g === "remote_inspect" ? k?.partner_name || "Khách bán lẻ" : p ? p.name : "Khách bán lẻ"}
            </div>
          </div>
          <P initial={false}>
            {Pe && (
              <x.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{
                  height: { duration: 0.26, ease: [0.25, 1, 0.5, 1] },
                  opacity: { duration: 0.18, ease: "easeOut" }
                }}
                className="flex flex-col gap-1 w-full border-l-2 border-[#8b6f47]/30 dark:border-[#d4a574]/30 pl-2.5 ml-0.5 overflow-hidden"
                style={getBubbleComputedStyle(cartColorConfig, 'partner')?.color ? { borderColor: `${getBubbleComputedStyle(cartColorConfig, 'partner').color}40` } : undefined}
              >
                {(Pe.phone || Pe.cccd) && (
                  <div className="flex items-center gap-3 text-[10px] font-bold text-slate-600 dark:text-slate-300 leading-normal py-0.5" style={getBubbleComputedStyle(cartColorConfig, 'partner')?.color ? { color: getBubbleComputedStyle(cartColorConfig, 'partner').color } : undefined}>
                    {Pe.phone && (
                      <div className="flex items-center gap-1" style={getBubbleComputedStyle(cartColorConfig, 'partner')?.color ? { color: getBubbleComputedStyle(cartColorConfig, 'partner').color } : undefined}>
                        <Mr size={11} className="text-[#8b6f47] dark:text-[#d4a574] shrink-0" style={getBubbleComputedStyle(cartColorConfig, 'partner')?.color ? { color: getBubbleComputedStyle(cartColorConfig, 'partner').color } : undefined} />
                        <span className="truncate leading-normal" style={getBubbleComputedStyle(cartColorConfig, 'partner')?.color ? { color: getBubbleComputedStyle(cartColorConfig, 'partner').color } : undefined}>{Pe.phone}</span>
                      </div>
                    )}
                    {Pe.cccd && (
                      <div className="flex items-center gap-1" style={getBubbleComputedStyle(cartColorConfig, 'partner')?.color ? { color: getBubbleComputedStyle(cartColorConfig, 'partner').color } : undefined}>
                        <Comp_ca size={11} className="text-[#8b6f47] dark:text-[#d4a574] shrink-0" style={getBubbleComputedStyle(cartColorConfig, 'partner')?.color ? { color: getBubbleComputedStyle(cartColorConfig, 'partner').color } : undefined} />
                        <span className="truncate leading-normal" style={getBubbleComputedStyle(cartColorConfig, 'partner')?.color ? { color: getBubbleComputedStyle(cartColorConfig, 'partner').color } : undefined}>{Pe.cccd}</span>
                      </div>
                    )}
                  </div>
                )}
                {Pe.address && (
                  <div className="flex items-center gap-1 text-[10px] font-bold text-slate-600 dark:text-slate-300 leading-normal py-0.5" style={getBubbleComputedStyle(cartColorConfig, 'partner')?.color ? { color: getBubbleComputedStyle(cartColorConfig, 'partner').color } : undefined}>
                    <Us size={11} className="text-[#8b6f47] dark:text-[#d4a574] shrink-0" style={getBubbleComputedStyle(cartColorConfig, 'partner')?.color ? { color: getBubbleComputedStyle(cartColorConfig, 'partner').color } : undefined} />
                    <span className="truncate leading-normal" style={getBubbleComputedStyle(cartColorConfig, 'partner')?.color ? { color: getBubbleComputedStyle(cartColorConfig, 'partner').color } : undefined}>{Pe.address}</span>
                  </div>
                )}
                {(g === "remote_inspect" ? Pe.debt_balance || 0 : (it !== 0 || de !== 0)) && (
                  <div className="w-full mt-0.5 pt-1 border-t border-[#8b6f47]/15 dark:border-[#d4a574]/15" style={getBubbleComputedStyle(cartColorConfig, 'partner')?.color ? { borderColor: `${getBubbleComputedStyle(cartColorConfig, 'partner').color}25` } : undefined}>
                    {(() => {
                      const tc = getBubbleComputedStyle(cartColorConfig, 'partner')?.color;
                      if (g === "remote_inspect") {
                        const a = Pe.debt_balance || 0;
                        return (
                          <div className="flex items-center justify-between gap-2 px-2 py-1 rounded-lg bg-[#8b6f47]/10 dark:bg-white/5 border border-[#8b6f47]/20 dark:border-[#d4a574]/20 shadow-xs" style={tc ? { borderColor: `${tc}30`, backgroundColor: `${tc}15` } : undefined}>
                            <div className="flex items-center gap-1 text-[9px] font-black uppercase text-[#8b6f47] dark:text-[#d4a574]" style={tc ? { color: tc } : undefined}>
                              <Va size={11} className="shrink-0" style={tc ? { color: tc } : undefined} />
                              <span style={tc ? { color: tc } : undefined}>Dư nợ:</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className={c("text-xs font-black tabular-nums", a > 0 ? "text-rose-600 dark:text-rose-400" : a < 0 ? "text-emerald-600 dark:text-emerald-400" : "text-slate-500")}>
                                {z(Math.abs(a))}đ
                              </span>
                              <span className={c("text-[8px] font-black px-1.5 py-0.5 rounded-md", a > 0 ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20" : a < 0 ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20" : "bg-slate-500/10 text-slate-500")}>
                                {a > 0 ? "Khách nợ" : a < 0 ? "Mình nợ" : "Hết nợ"}
                              </span>
                            </div>
                          </div>
                        );
                      }
                      if (it - de === 0) {
                        return (
                          <div className="flex items-center justify-between gap-2 px-2 py-1 rounded-lg bg-[#8b6f47]/10 dark:bg-white/5 border border-[#8b6f47]/20 dark:border-[#d4a574]/20 shadow-xs" style={tc ? { borderColor: `${tc}30`, backgroundColor: `${tc}15` } : undefined}>
                            <div className="flex items-center gap-1 text-[9px] font-black uppercase text-[#8b6f47] dark:text-[#d4a574]" style={tc ? { color: tc } : undefined}>
                              <Va size={11} className="shrink-0" style={tc ? { color: tc } : undefined} />
                              <span style={tc ? { color: tc } : undefined}>Dư nợ:</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className={c("text-xs font-black tabular-nums", de > 0 ? "text-rose-600 dark:text-rose-400" : de < 0 ? "text-emerald-600 dark:text-emerald-400" : "text-slate-500")}>
                                {z(Math.abs(de))}đ
                              </span>
                              <span className={c("text-[8px] font-black px-1.5 py-0.5 rounded-md", de > 0 ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20" : de < 0 ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20" : "bg-slate-500/10 text-slate-500")}>
                                {de > 0 ? "Khách nợ" : de < 0 ? "Mình nợ" : "Hết nợ"}
                              </span>
                            </div>
                          </div>
                        );
                      }
                      const S_delta = it - de;
                      return (
                        <div className="flex flex-col gap-1 w-full">
                          <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-wider text-[#8b6f47] dark:text-[#d4a574]" style={tc ? { color: tc } : undefined}>
                            <span className="flex items-center gap-1">
                              <Va size={11} className="shrink-0 text-[#8b6f47] dark:text-[#d4a574]" style={tc ? { color: tc } : undefined} />
                              <span style={tc ? { color: tc } : undefined}>Biến động nợ</span>
                            </span>
                            <span className={c("text-[8px] font-black px-1.5 py-0.5 rounded-md", it > 0 ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20" : it < 0 ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20" : "bg-slate-500/10 text-slate-500")}>
                              {it > 0 ? "Khách nợ" : it < 0 ? "Mình nợ" : "Hết nợ"}
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-1.5 px-2 py-1 rounded-lg bg-black/5 dark:bg-white/5 border border-[#8b6f47]/20 dark:border-[#d4a574]/20 shadow-xs" style={tc ? { borderColor: `${tc}30`, backgroundColor: `${tc}15` } : undefined}>
                            <div className="flex flex-col">
                              <span className="text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase leading-none mb-0.5" style={tc ? { color: tc, opacity: 0.7 } : undefined}>
                                Hiện tại
                              </span>
                              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 line-through decoration-rose-400/60 tabular-nums" style={tc ? { color: tc, opacity: 0.8 } : undefined}>
                                {z(Math.abs(de))}đ
                              </span>
                            </div>
                            <div className={c("flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[8px] font-black tracking-tight", S_delta > 0 ? "bg-rose-500/10 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/25" : "bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25")}>
                              <span>➔</span>
                              <span>{S_delta > 0 ? `+${z(S_delta)}` : `-${z(Math.abs(S_delta))}`}</span>
                            </div>
                            <div className="flex flex-col items-end">
                              <span className="text-[8px] font-bold text-rose-500/80 dark:text-rose-400/80 uppercase leading-none mb-0.5">
                                Sau đơn
                              </span>
                              <span className={c("text-[11px] font-black tabular-nums", it > 0 ? "text-rose-600 dark:text-rose-400" : it < 0 ? "text-emerald-600 dark:text-emerald-400" : "text-[#2d5016] dark:text-emerald-400")}>
                                {z(Math.abs(it))}đ
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </x.div>
            )}
          </P>
        </x.div>
      </x.div>
      <x.div layout transition={{ layout: { duration: 0.28, ease: [0.25, 1, 0.5, 1] } }} className="relative group/note-container pointer-events-auto">
        <x.div
          layout
          initial={false}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          transition={{
            layout: { duration: 0.28, ease: [0.25, 1, 0.5, 1] },
            type: "spring",
            stiffness: 450,
            damping: 25
          }}
          onClick={t => {
            t.stopPropagation(), as(!lr);
          }}
          style={getButtonComputedStyle(cartColorConfig, 'note')}
          className={c("w-11 h-11 rounded-2xl flex items-center justify-center transition-colors transition-shadow cursor-pointer border-2 shadow-[0_8px_18px_rgba(139,111,71,0.22)] dark:shadow-[0_8px_18px_rgba(0,0,0,0.6)] hover:shadow-[0_12px_24px_rgba(139,111,71,0.28)]", K || lr ? "bg-gradient-to-tr from-[#2d5016] to-emerald-600 text-white border-[#2d5016] dark:border-emerald-400 shadow-md shadow-[#2d5016]/25" : "bg-[#fbf9f4] dark:bg-[#1a1e17] text-[#8b6f47] dark:text-[#d4a574] border-[#8b6f47]/40 dark:border-[#d4a574]/35 hover:bg-[#8b6f47]/10 hover:border-[#2d5016] hover:text-[#2d5016] dark:hover:border-emerald-400 dark:hover:text-emerald-400")}
          title="Ghi chú hóa đơn"
        >
          <Comp_ca size={18} className={K || lr ? "text-white" : "transition-colors"} strokeWidth={2.5} />
          {K && !lr && <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white dark:border-slate-800" />}
        </x.div>
        <OrderNotePopup
          isOpen={lr}
          initialNote={K}
          onClose={() => as(!1)}
          onSave={newNote => $e(newNote)}
        />
      </x.div>
      <x.div layout transition={{ layout: { type: "spring", stiffness: 350, damping: 28 } }} className="relative group/ship-container pointer-events-auto">
        <x.div
          layout
          initial={false}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          transition={{
            layout: { type: "spring", stiffness: 350, damping: 28 },
            type: "spring",
            stiffness: 450,
            damping: 25
          }}
          onClick={t => {
            t.stopPropagation(), tt ? qt(null) : (qt("Shipping"), p && (ra(p.address || ""), sa(p.phone || "")));
          }}
          style={getButtonComputedStyle(cartColorConfig, 'ship')}
          className={c("w-11 h-11 rounded-2xl flex items-center justify-center transition-colors transition-shadow cursor-pointer border-2 shadow-[0_8px_18px_rgba(139,111,71,0.22)] dark:shadow-[0_8px_18px_rgba(0,0,0,0.6)] hover:shadow-[0_12px_24px_rgba(139,111,71,0.28)]", tt ? "bg-gradient-to-tr from-[#2d5016] to-emerald-600 text-white border-[#2d5016] dark:border-emerald-400 shadow-md shadow-[#2d5016]/25" : "bg-[#fbf9f4] dark:bg-[#1a1e17] text-[#8b6f47] dark:text-[#d4a574] border-[#8b6f47]/40 dark:border-[#d4a574]/35 hover:bg-[#8b6f47]/10 hover:border-[#2d5016] hover:text-[#2d5016] dark:hover:border-emerald-400 dark:hover:text-emerald-400")}
          title="Giao hàng tận nơi"
        >
          <Comp_u_t size={18} strokeWidth={2.5} className={tt ? "text-white" : "transition-colors"} />
          {tt && <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-white dark:border-slate-800" />}
        </x.div>
        <ShippingInfoPopup
          isOpen={tt === "Shipping"}
          initialAddress={vr}
          initialPhone={kr}
          onClose={() => qt(null)}
          onSave={({ address, phone }) => {
            ra(address);
            sa(phone);
          }}
        />
      </x.div>
    </div>
  </x.div>
  <x.div
    key="total-bubble"
    id="total-bubble"
    data-bubble="total"
    ref={totalBubbleRef}
    layout
    initial={{
      opacity: 0,
      scale: 0.92,
      y: 24,
      filter: "blur(12px)"
    }}
    animate={{
      opacity: 1,
      scale: 1,
      y: 0,
      filter: "blur(0.01px)"
    }}
    exit={{
      opacity: 0,
      scale: 0.92,
      y: 24,
      filter: "blur(12px)",
      transition: {
        duration: 0.2,
        ease: "easeInOut"
      }
    }}
    transition={{
      layout: { type: "spring", stiffness: 350, damping: 28, mass: 0.8 },
      type: "spring",
      stiffness: 350,
      damping: 26,
      mass: 0.8
    }}
    className="absolute bottom-3 right-3 z-[110] pointer-events-none flex items-center gap-2.5"
  >
    <P mode="popLayout">
      {I === "Cash" && (
        <x.div
          key="cash-bubble"
          layout
          initial={{
            opacity: 0,
            scale: 0.85,
            x: 30,
            filter: "blur(8px)"
          }}
          animate={{
            opacity: 1,
            scale: 1,
            x: 0,
            filter: "blur(0px)"
          }}
          exit={{
            opacity: 0,
            scale: 0.85,
            x: 30,
            filter: "blur(8px)",
            transition: {
              duration: 0.2,
              ease: "easeInOut"
            }
          }}
          transition={{
            layout: { type: "spring", stiffness: 350, damping: 28 },
            type: "spring",
            stiffness: 400,
            damping: 28
          }}
          style={getBubbleComputedStyle(cartColorConfig, 'cash')}
          className="pointer-events-auto flex items-start group/cash-calculator cursor-pointer hover:scale-[1.02] active:scale-[0.99] transition-shadow transition-border duration-300 p-3 px-5 rounded-2xl border-2 border-[#8b6f47]/40 dark:border-[#d4a574]/35 bg-[#fbf9f4] dark:bg-[#1a1e17] backdrop-blur-xl hover:border-[#2d5016] dark:hover:border-emerald-400 shadow-[0_10px_22px_-2px_rgba(139,111,71,0.24)] dark:shadow-[0_12px_24px_-2px_rgba(0,0,0,0.7)] hover:shadow-[0_14px_28px_-2px_rgba(139,111,71,0.3)] relative overflow-hidden min-w-[200px]"
        >
          <Comp_oa className="absolute -right-3 -bottom-3 w-24 h-24 text-[#8b6f47]/10 dark:text-[#d4a574]/10 -rotate-12 transition-transform group-hover/cash-calculator:scale-110 group-hover/cash-calculator:-rotate-6 pointer-events-none select-none" style={getBubbleComputedStyle(cartColorConfig, 'cash')?.color ? { color: getBubbleComputedStyle(cartColorConfig, 'cash').color, opacity: 0.1 } : undefined} />
          <x.div layout transition={{ layout: { type: "spring", stiffness: 350, damping: 28 } }} className="flex flex-col relative z-10 w-full">
            <span className="text-[9px] font-black uppercase tracking-[0.15em] text-[#8b6f47] dark:text-[#d4a574] mb-0.5 leading-normal py-0.5 whitespace-nowrap" style={getBubbleComputedStyle(cartColorConfig, 'cash')?.color ? { color: getBubbleComputedStyle(cartColorConfig, 'cash').color } : undefined}>Khách đưa (F1)</span>
            <div className="flex items-center gap-2.5">
              <x.div layout transition={{ layout: { type: "spring", stiffness: 350, damping: 28 } }} className="relative flex items-center min-w-[70px] group/input-wrapper h-full">
                <span className="invisible whitespace-pre font-black text-xl px-1 pointer-events-none tabular-nums select-none">{z(V) || "0"}</span>
                <input id="cash-given-compact" ref={xr} type="text" style={getBubbleComputedStyle(cartColorConfig, 'cash')?.color ? { color: getBubbleComputedStyle(cartColorConfig, 'cash').color } : undefined} className="absolute inset-0 w-full h-full bg-transparent border-b-2 border-[#8b6f47]/30 focus:border-[#2d5016] dark:focus:border-emerald-400 outline-none font-black text-xl text-[#2d5016] dark:text-emerald-400 p-0 tabular-nums transition-all z-10" value={z(V)} autoComplete="off" onChange={t => Ye(parseFloat(t.target.value.replace(/,/g, "")) || 0)} onFocus={t => t.target.select()} />
              </x.div>
              <P>
                {V > 0 && (
                  <x.div
                    layout
                    initial={{ opacity: 0, scale: 0.85, width: 0, x: 10 }}
                    animate={{ opacity: 1, scale: 1, width: "auto", x: 0 }}
                    exit={{ opacity: 0, scale: 0.85, width: 0, x: 10 }}
                    transition={{
                      layout: { type: "spring", stiffness: 350, damping: 28 },
                      type: "spring",
                      stiffness: 380,
                      damping: 26
                    }}
                    className="flex flex-col items-end min-w-[85px] border-l border-[#8b6f47]/20 dark:border-[#d4a574]/20 pl-3 py-0.5 overflow-hidden"
                  >
                    <span className="text-[8px] font-black text-[#8b6f47] dark:text-[#d4a574] uppercase leading-none mb-0.5 whitespace-nowrap" style={getBubbleComputedStyle(cartColorConfig, 'cash')?.color ? { color: getBubbleComputedStyle(cartColorConfig, 'cash').color } : undefined}>Tiền thối</span>
                    <span className={c("text-xl font-black tabular-nums transition-colors", V > $ ? "text-emerald-600 dark:text-emerald-400" : "text-gray-400 opacity-50")}>{z(Math.max(0, V - $))}</span>
                  </x.div>
                )}
              </P>
            </div>
          </x.div>
        </x.div>
      )}
    </P>
    <P mode="popLayout">
      {(p || g === "remote_inspect") && (
        <x.div
          key="payment-toggle-bubble"
          layout
          initial={{
            opacity: 0,
            scale: 0.85,
            x: 25,
            filter: "blur(8px)"
          }}
          animate={{
            opacity: 1,
            scale: 1,
            x: 0,
            filter: "blur(0px)"
          }}
          exit={{
            opacity: 0,
            scale: 0.85,
            x: 25,
            filter: "blur(8px)",
            transition: {
              duration: 0.18,
              ease: "easeOut"
            }
          }}
          transition={{
            layout: { type: "spring", stiffness: 350, damping: 28 },
            type: "spring",
            stiffness: 400,
            damping: 28
          }}
          style={getBubbleComputedStyle(cartColorConfig, 'payment')}
          className="w-[155px] pointer-events-auto flex items-center bg-[#fbf9f4] dark:bg-[#1a1e17] backdrop-blur-xl p-1 rounded-2xl border-2 border-[#8b6f47]/40 dark:border-[#d4a574]/35 shadow-[0_10px_22px_-2px_rgba(139,111,71,0.24)] dark:shadow-[0_12px_24px_-2px_rgba(0,0,0,0.7)] hover:shadow-[0_14px_28px_-2px_rgba(139,111,71,0.3)] hover:border-[#2d5016] dark:hover:border-emerald-400 group/payment-toggle relative h-[56px] transition-shadow transition-border duration-300"
        >
          <x.div
            layout={!0}
            className="absolute inset-y-1 rounded-xl shadow-md z-0"
            style={{
              width: "calc(50% - 4px)",
              left: (g === "remote_inspect" ? k?.payment_method || "Cash" : I) === "Cash" ? "4px" : "calc(50%)",
              ...getBubbleBadgeStyle(cartColorConfig, 'payment')
            }}
            transition={{
              type: "spring",
              stiffness: 400,
              damping: 30
            }}
          />
          <button
            onClick={t => {
              t.stopPropagation(), ge("Cash"), re($);
            }}
            style={{
              color: I === "Cash" 
                ? (getBubbleBadgeStyle(cartColorConfig, "payment").color || "#ffffff") 
                : (getBubbleComputedStyle(cartColorConfig, "payment").color || undefined)
            }}
            className={c("flex-1 h-full rounded-lg flex flex-col items-center justify-center transition-colors duration-200 relative z-10 gap-0.5", I === "Cash" ? "" : "text-[#8b6f47] dark:text-[#d4a574] hover:text-[#2d5016] dark:hover:text-emerald-400")}
          >
            <Comp_oa size={13} className={c(I === "Cash" ? "opacity-100" : "opacity-40")} />
            <span className="text-[9px] font-black uppercase tracking-wider">Tiền mặt</span>
          </button>
          <button
            onClick={t => {
              t.stopPropagation(), ge("Debt"), re(0);
            }}
            style={{
              color: I === "Debt" 
                ? (getBubbleBadgeStyle(cartColorConfig, "payment").color || "#ffffff") 
                : (getBubbleComputedStyle(cartColorConfig, "payment").color || undefined)
            }}
            className={c("flex-1 h-full rounded-lg flex flex-col items-center justify-center transition-colors duration-200 relative z-10 gap-0.5", I === "Debt" ? "" : "text-[#8b6f47] dark:text-[#d4a574] hover:text-[#2d5016] dark:hover:text-emerald-400")}
          >
            <Comp_ua size={13} className={c(I === "Debt" ? "opacity-100" : "opacity-40")} />
            <span className="text-[9px] font-black uppercase tracking-wider">Ghi nợ</span>
          </button>
        </x.div>
      )}
    </P>
    <x.div
      key="total-amount-bubble"
      layout
      initial={{ opacity: 0, scale: 0.92, y: 12 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.92, y: 12 }}
      transition={{
        layout: { type: "spring", stiffness: 350, damping: 28 },
        type: "spring",
        stiffness: 400,
        damping: 28
      }}
      onMouseDown={yr}
      onMouseUp={aa}
      onMouseLeave={aa}
      onTouchStart={yr}
      onTouchEnd={aa}
      style={getBubbleComputedStyle(cartColorConfig, 'total')}
      className="px-6 py-3 rounded-2xl border-2 border-[#8b6f47]/40 dark:border-[#d4a574]/35 bg-[#fbf9f4] dark:bg-[#1a1e17] shadow-[0_10px_22px_-2px_rgba(139,111,71,0.24)] dark:shadow-[0_12px_24px_-2px_rgba(0,0,0,0.7)] hover:shadow-[0_14px_28px_-2px_rgba(139,111,71,0.3)] hover:border-[#2d5016] dark:hover:border-emerald-400 flex flex-col items-end group/total pointer-events-auto relative overflow-hidden transition-shadow transition-border duration-300 hover:scale-[1.02] active:scale-[0.99]"
    >
      <Va className="absolute -left-8 -bottom-8 w-36 h-36 text-[#2d5016]/5 dark:text-emerald-500/5 -rotate-12 transition-transform group-hover/total:scale-110 group-hover/total:-rotate-6 pointer-events-none" />
      <x.div layout transition={{ layout: { type: "spring", stiffness: 350, damping: 28 } }} className="flex items-center gap-1.5 mb-0.5 z-10 relative">
        <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: (cartColorConfig?.bubbleBorderColor && cartColorConfig.bubbleBorderColor !== 'default') ? cartColorConfig.bubbleBorderColor : (cartColorConfig?.accentColor && cartColorConfig.accentColor !== 'default') ? cartColorConfig.accentColor : '#10b981' }} />
        <span className="text-[9px] font-black uppercase tracking-[0.15em] text-[#8b6f47] dark:text-[#d4a574] flex items-center gap-1.5" style={getBubbleComputedStyle(cartColorConfig, "total").color ? { color: getBubbleComputedStyle(cartColorConfig, "total").color } : undefined}>Tổng cộng thanh toán</span>
      </x.div>
      <x.div layout transition={{ layout: { type: "spring", stiffness: 350, damping: 28 } }} className="text-2xl sm:text-3xl font-black tracking-tighter tabular-nums text-[#2d5016] dark:text-emerald-400 flex items-baseline gap-1 z-10 relative" style={getBubbleComputedStyle(cartColorConfig, "total").color ? { color: getBubbleComputedStyle(cartColorConfig, "total").color } : undefined}>
        {z(g === "remote_inspect" ? k?.total_amount || (k?.cart || []).reduce((t, a) => t + (a.price || a.sale_price || 0) * (a.quantity || 1), 0) : $)}
        <span className="text-sm text-emerald-600 dark:text-emerald-400 font-bold ml-0.5" style={getBubbleComputedStyle(cartColorConfig, "total").color ? { color: getBubbleComputedStyle(cartColorConfig, "total").color } : undefined}>đ</span>
      </x.div>
      <P>
        {Ha && (y.some(t => t.product_id !== null) || m.product && m.product.id !== null) && (
          <x.div
            layout
            initial={{ opacity: 0, height: 0, scale: 0.9 }}
            animate={{ opacity: 1, height: "auto", scale: 1 }}
            exit={{ opacity: 0, height: 0, scale: 0.9 }}
            transition={{
              layout: { type: "spring", stiffness: 350, damping: 28 },
              type: "spring",
              stiffness: 380,
              damping: 26
            }}
            className="mt-1 px-3 py-1 bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 rounded-xl flex items-center gap-1.5 border border-emerald-500/20 z-10 relative overflow-hidden"
          >
            <Kn size={12} className="text-emerald-600 dark:text-emerald-400" />
            <span className="text-[10px] font-black uppercase tracking-tight">Lợi nhuận: {z(vs)}đ</span>
          </x.div>
        )}
      </P>
    </x.div>
  </x.div>
  <P>
    {canScrollDown && (
      <x.button
        type="button"
        initial={{ opacity: 0, y: 16, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.9 }}
        transition={{ type: "spring", stiffness: 450, damping: 28 }}
        whileHover={{ scale: 1.05, y: -2 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleScrollDownCart}
        className="absolute bottom-3.5 left-1/2 -translate-x-1/2 z-[115] cursor-pointer flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#fbf9f4]/95 dark:bg-[#1a1e17]/95 backdrop-blur-xl border-2 border-[#8b6f47]/40 dark:border-[#d4a574]/40 shadow-[0_10px_22px_-2px_rgba(139,111,71,0.24)] dark:shadow-[0_12px_24px_-2px_rgba(0,0,0,0.7)] text-[#2d5016] dark:text-emerald-400 text-[10px] font-black uppercase tracking-wider hover:border-[#2d5016] dark:hover:border-emerald-400 transition-colors select-none group pointer-events-auto"
        title="Bấm để cuộn xuống xem các sản phẩm tiếp theo"
      >
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
        </span>
        <span>Còn sản phẩm bên dưới</span>
        <ChevronDown size={13} strokeWidth={3} className="animate-bounce group-hover:translate-y-0.5 transition-transform text-[#8b6f47] dark:text-[#d4a574]" />
      </x.button>
    )}
  </P>
</>}</P></div></div>{Ze === "bottom" && (
              <POSSummaryPanel
              mode={Ze}
              isSidebarExpanded={ka}
              onToggleSidebar={en}
              bottomHeight={Jr}
              onBottomHeightResize={Ii}
              onResetBottomHeight={() => { Yr(105); localStorage.setItem("pos_bottom_summary_height", "105"); }}
              isResizingBottom={tn}
              partner={p}
              partnerDebt={p?.debt_balance || 0}
              debtBeforeOrder={de}
              debtAfterOrder={it}
              onOpenPartnerHistory={(ptn) => setIsHistoryPanelOpen(true)}
              onFocusPartnerSearch={() => Et.current?.focus()}
              isRemoteInspect={g === "remote_inspect"}
              remoteState={k}
              activeTerminalId={q}
              onRemoteAction={(actionData) => {
                if (actionData.payment_method) {
                  qa(S => S.map(w => w.terminal_id === q || w.ip_address === q ? { ...w, payment_method: actionData.payment_method } : w));
                  M.post("/api/pos/terminal-state/edit-cart", {
                    terminal_id: q,
                    payment_method: actionData.payment_method,
                    cart: k?.cart || []
                  }).catch(() => {});
                }
              }}
              cart={y}
              totalAmount={$}
              isProfitRevealed={Ha}
              orderProfit={vs}
              onMouseDownProfit={yr}
              onMouseUpProfit={aa}
              paymentMethod={I}
              onSelectPaymentMethod={ge}
              amountPaid={oe}
              onChangeAmountPaid={re}
              cashGiven={V}
              onChangeCashGiven={Ye}
              cashGivenInputRef={xr}
              selectedBankId={ss}
              onChangeBankId={ns}
              bankList={ln}
              shippingActive={tt === "Shipping"}
              onToggleShipping={() => {
                tt ? qt(null) : (qt("Shipping"), p && (ra(p.address || ""), sa(p.phone || "")));
              }}
              shippingAddress={vr}
              onChangeShippingAddress={ra}
              shippingPhone={kr}
              onChangeShippingPhone={sa}
              shippingCount={D}
              onOpenShippingPanel={() => vn(!0)}
              orderNote={K}
              onChangeOrderNote={$e}
              onOpenQuickDebt={() => ja(!0)}
              onOpenQuickVoucher={() => _a(!0)}
              onHoldOrder={wr}
              onSaveOrder={(print) => {
                if (g === "remote_inspect") {
                  et({
                    title: "Xác nhận lưu hóa đơn",
                    message: "Bạn có chắc chắn muốn lưu hóa đơn trên máy trạm này?",
                    onConfirm: () => {
                      et(null);
                      M.post("/api/pos/terminal-state/action", { terminal_id: q, action: "save_order" })
                        .then(() => Ve.success("Đã gửi lệnh lưu hóa đơn tới máy trạm!"))
                        .catch(() => Ve.error("Không thể gửi lệnh lưu hóa đơn!"));
                    }
                  });
                } else {
                  Re(print);
                }
              }}
              onSaveAndPrintOrder={(print) => {
                if (g === "remote_inspect") {
                  et({
                    title: "Xác nhận lưu hóa đơn",
                    message: "Bạn có chắc chắn muốn lưu hóa đơn trên máy trạm này?",
                    onConfirm: () => {
                      et(null);
                      M.post("/api/pos/terminal-state/action", { terminal_id: q, action: "save_order" })
                        .then(() => Ve.success("Đã gửi lệnh lưu hóa đơn tới máy trạm!"))
                        .catch(() => Ve.error("Không thể gửi lệnh lưu hóa đơn!"));
                    }
                  });
                } else {
                  Re(print);
                }
              }}
              isSaving={Be}
              onNavigateOrder={na}
              historyOrderIndex={Ce}
              cartColorConfig={cartColorConfig}
              onToggleTheme={v}
              partnerPopoutOpen={sr}
              onTogglePartnerPopout={() => p && Gr(!sr)}
              partnerPopoutRef={Rr}
              partnerPopoutType={Ne}
              onChangePartnerPopoutType={Kt}
              isPartnerHistoryLoading={Xs}
              lastDebtTx={st}
              lastCashTx={nt}
              onSelectHistoryTx={(t) => {
                if (t?.obj) {
                  mr(t.obj);
                  Yt(!0);
                }
              }}
            />
            )}
            </x.div>
            {Ze === "sidebar" && (
              <POSSummaryPanel
              mode={Ze}
              isSidebarExpanded={ka}
              onToggleSidebar={en}
              bottomHeight={Jr}
              onBottomHeightResize={Ii}
              onResetBottomHeight={() => { Yr(105); localStorage.setItem("pos_bottom_summary_height", "105"); }}
              isResizingBottom={tn}
              partner={p}
              partnerDebt={p?.debt_balance || 0}
              debtBeforeOrder={de}
              debtAfterOrder={it}
              onOpenPartnerHistory={(ptn) => setIsHistoryPanelOpen(true)}
              onFocusPartnerSearch={() => Et.current?.focus()}
              isRemoteInspect={g === "remote_inspect"}
              remoteState={k}
              activeTerminalId={q}
              onRemoteAction={(actionData) => {
                if (actionData.payment_method) {
                  qa(S => S.map(w => w.terminal_id === q || w.ip_address === q ? { ...w, payment_method: actionData.payment_method } : w));
                  M.post("/api/pos/terminal-state/edit-cart", {
                    terminal_id: q,
                    payment_method: actionData.payment_method,
                    cart: k?.cart || []
                  }).catch(() => {});
                }
              }}
              cart={y}
              totalAmount={$}
              isProfitRevealed={Ha}
              orderProfit={vs}
              onMouseDownProfit={yr}
              onMouseUpProfit={aa}
              paymentMethod={I}
              onSelectPaymentMethod={ge}
              amountPaid={oe}
              onChangeAmountPaid={re}
              cashGiven={V}
              onChangeCashGiven={Ye}
              cashGivenInputRef={xr}
              selectedBankId={ss}
              onChangeBankId={ns}
              bankList={ln}
              shippingActive={tt === "Shipping"}
              onToggleShipping={() => {
                tt ? qt(null) : (qt("Shipping"), p && (ra(p.address || ""), sa(p.phone || "")));
              }}
              shippingAddress={vr}
              onChangeShippingAddress={ra}
              shippingPhone={kr}
              onChangeShippingPhone={sa}
              shippingCount={D}
              onOpenShippingPanel={() => vn(!0)}
              orderNote={K}
              onChangeOrderNote={$e}
              onOpenQuickDebt={() => ja(!0)}
              onOpenQuickVoucher={() => _a(!0)}
              onHoldOrder={wr}
              onSaveOrder={(print) => {
                if (g === "remote_inspect") {
                  et({
                    title: "Xác nhận lưu hóa đơn",
                    message: "Bạn có chắc chắn muốn lưu hóa đơn trên máy trạm này?",
                    onConfirm: () => {
                      et(null);
                      M.post("/api/pos/terminal-state/action", { terminal_id: q, action: "save_order" })
                        .then(() => Ve.success("Đã gửi lệnh lưu hóa đơn tới máy trạm!"))
                        .catch(() => Ve.error("Không thể gửi lệnh lưu hóa đơn!"));
                    }
                  });
                } else {
                  Re(print);
                }
              }}
              onSaveAndPrintOrder={(print) => {
                if (g === "remote_inspect") {
                  et({
                    title: "Xác nhận lưu hóa đơn",
                    message: "Bạn có chắc chắn muốn lưu hóa đơn trên máy trạm này?",
                    onConfirm: () => {
                      et(null);
                      M.post("/api/pos/terminal-state/action", { terminal_id: q, action: "save_order" })
                        .then(() => Ve.success("Đã gửi lệnh lưu hóa đơn tới máy trạm!"))
                        .catch(() => Ve.error("Không thể gửi lệnh lưu hóa đơn!"));
                    }
                  });
                } else {
                  Re(print);
                }
              }}
              isSaving={Be}
              onNavigateOrder={na}
              historyOrderIndex={Ce}
              cartColorConfig={cartColorConfig}
              onToggleTheme={v}
              partnerPopoutOpen={sr}
              onTogglePartnerPopout={() => p && Gr(!sr)}
              partnerPopoutRef={Rr}
              partnerPopoutType={Ne}
              onChangePartnerPopoutType={Kt}
              isPartnerHistoryLoading={Xs}
              lastDebtTx={st}
              lastCashTx={nt}
              onSelectHistoryTx={(t) => {
                if (t?.obj) {
                  mr(t.obj);
                  Yt(!0);
                }
              }}
            />
            )}
          </div>
<P>{dr && <Wn isOpen={dr} partner={{
              name: on,
              is_customer: !0,
              is_supplier: !1
            }} onClose={() => cr(!1)} onSave={t => {
              Ua(), cr(!1), t && (F(t), Ge(""), setTimeout(() => se.current?.focus(), 100));
            }} />}</P><P>{pr && <An isOpen={pr} product={{
              name: on
            }} onClose={() => ur(!1)} onSave={() => {
              Ga(), ur(!1);
            }} />}</P><P>{is && <Comp_td message={is.message} type={is.type} onClose={() => G(null)} />}</P><div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none"><P>{hi.map(t => <x.div key={t.id} initial={{
                opacity: 0,
                x: 100,
                scale: 0.9
              }} animate={{
                opacity: 1,
                x: 0,
                scale: 1
              }} exit={{
                opacity: 0,
                x: 50,
                scale: 0.9,
                transition: {
                  duration: 0.15
                }
              }} className="bg-slate-900/90 text-white px-4 py-3 rounded-2xl shadow-xl border border-white/10 dark:border-white/10 backdrop-blur-md text-xs font-black flex items-center gap-3 pointer-events-auto"><div className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0" /><div><div className="text-[10px] text-slate-400 uppercase tracking-wider leading-none">Quét từ xa</div><div className="mt-1">{t.productName} <span className="text-amber-400">x{t.qty}</span> → <span className="underline text-blue-400">{t.tabName}</span></div></div></x.div>)}</P></div><An isOpen={ps} product={Hi} onClose={() => vt(!1)} onSave={Ga} /><Wn isOpen={Xi} partner={Ji} onClose={() => Oa(!1)} onSave={async t => {
            await Ua(), t && (F(t), Ge(""), setTimeout(() => se.current?.focus(), 100));
          }} /><Ee><Comp_nd isOpen={Mi || ye && ye.type === "DebtIncrease"} partner={p} initialData={ye && ye.type === "DebtIncrease" ? ye : null} onClose={() => {
              ja(!1), Ia(null);
            }} onSave={async t => {
              ye ? await jr() : (F(t), E.invalidateQueries(["partners"])), G({
                message: ye ? "Đã cập nhật khoản nợ thành công!" : "Đã lưu khoản nợ mới thành công!",
                type: "success"
              }), Ia(null), ja(!1), ye || kt(!1);
            }} /></Ee><Ee><Comp_ac isOpen={al} onClose={() => vn(!1)} onViewOrder={t => {
              mr(t), Yt(!0);
            }} /></Ee><Ee><Comp_id isOpen={Wi || ye && (ye.type === "Receipt" || ye.type === "Payment")} partner={p} initialData={ye && (ye.type === "Receipt" || ye.type === "Payment") ? ye : null} onClose={() => {
              _a(!1), Ia(null);
            }} onSave={async t => {
              await jr(), G({
                message: ye ? "Đã cập nhật phiếu thành công!" : "Đã lập phiếu thành công!",
                type: "success"
              }), ye && (Ia(null), _a(!1));
            }} /></Ee><POSPrintPreviewModal
              isOpen={ds && !!Ta}
              orderData={Ta}
              settings={J}
              invoiceType={Jt}
              onChangeInvoiceType={un}
              printOptions={Ke}
              onTogglePrintOption={(key) => rl(s => ({ ...s, [key]: !s[key] }))}
              onConfirmPrint={(type) => { Sa(!1); Re(!0, type); }}
              onReadPacking={() => { if (Ta?.details) qn(Ta.details, T); }}
              onClose={() => Sa(!1)}
            /><Comp_ad isVisible={Be && T.length === 0} message="Đang nạp dữ liệu POS..." /><Ee><Pd isOpen={tl} partner={p} onClose={() => kt(!1)} onViewOrder={t => {
              setEditingHistoryOrder(t);
            }} onEditOrder={async t => {
              kt(!1);
              await Ka(t);
              G({
                message: `Đã nạp hóa đơn #${t.display_id || t.id} ra giỏ hàng!`,
                type: "success"
              });
            }} onDeleteOrder={Sn} onEditVoucher={t => {
              Ia({
                ...t,
                id: t.id.toString().replace("v_", ""),
                amount: t.total_amount
              });
            }} onDeleteVoucher={gl} onAddToCart={t => {
              const a = T.find(r => r.id === t.id);
              a && ia(a);
            }} /></Ee><Ws>{editingHistoryOrder && <OrderEditModal order={editingHistoryOrder} partner={p || Y.find(n => n.id === editingHistoryOrder.partner_id)} onClose={() => setEditingHistoryOrder(null)} onSave={() => {
              setEditingHistoryOrder(null);
              window.dispatchEvent(new CustomEvent("pos_data_sync", { detail: { type: "ORDER_SAVED" } }));
              const bc = new BroadcastChannel("pos_data_sync");
              bc.postMessage({ type: "ORDER_SAVED" });
              bc.close();
              G({
                message: "Đã cập nhật hóa đơn thành công!",
                type: "success"
              });
            }} />}</Ws><QuickProductCreateModal
              isOpen={gs}
              initialName={ut.name}
              initialPrice={ut.price}
              onClose={() => La(!1)}
              onConfirm={(name, price) => Cn(name, price)}
            /><P>{Ui && us && <Comp_rd order={us} partner={Y.find(t => t.id === us.partner_id)} onClose={() => Yt(!1)} onSave={() => {
              Yt(!1), _e && E.invalidateQueries(["orders"]);
            }} />}</P><P>{Da && <Comp_sd isOpen={!!Da} title={Da.title} message={Da.message} onConfirm={Da.onConfirm} onCancel={() => et(null)} />}</P><Ee><P>{Qt && pt && <Comp_ld product={pt} isOpen={Qt} onClose={() => Dt(!1)} onSave={ml} coordinates={Ki} />}</P></Ee><Ee><P>{Fi && <x.div initial={{
                opacity: 0,
                y: -20,
                scale: 0.9
              }} animate={{
                opacity: 1,
                y: 0,
                scale: 1
              }} exit={{
                opacity: 0,
                y: -20,
                scale: 0.9
              }} className="fixed top-6 right-6 z-[2000000] flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl border border-rose-500/20 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl no-print overflow-hidden"><div className="p-2 rounded-xl text-white shadow-lg bg-rose-500 shadow-rose-500/25 shrink-0"><Comp_pa size={20} /></div><div className="flex flex-col min-w-[140px] max-w-[180px]"><span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 opacity-70">Hành động</span><span className="font-bold text-xs tracking-tight text-slate-800 dark:text-white/95 leading-snug">Xóa dòng thứ mấy?</span></div><input type="text" autoFocus={!0} value={mn} onChange={t => Wa(t.target.value)} onKeyDown={t => {
                  t.key === "Enter" ? (t.preventDefault(), Vi()) : t.key === "Escape" && (gr(!1), Wa(""));
                }} placeholder="Số..." className="w-16 px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-center text-sm font-black text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500 transition-all" /><button onClick={() => {
                  gr(!1), Wa("");
                }} className="ml-2 p-1.5 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors text-slate-500 dark:text-white/60 hover:text-slate-800 dark:hover:text-white"><Comp_ke size={16} /></button></x.div>}</P></Ee>
            <OrderNoteModal
              isOpen={Ti}
              initialNote={K}
              partnerName={p?.name}
              onClose={() => Bt(!1)}
              onSave={newNote => $e(newNote)}
            />
            <PackingDisplayModeModal
              isOpen={Yi}
              onClose={() => fs(!1)}
            /><SoundVoiceSettingsModal isOpen={Lr} onClose={() => ba(false)} products={T} /><AIScanInvoiceModal
              isOpen={C}
              onClose={() => { X(!1); we([]); }}
              settings={J}
              apiKeyInput={te}
              onApiKeyChange={at}
              previewImages={pe}
              onSetPreviewImages={we}
              onFileChange={Nt}
              onStartScan={Lt}
              isScanning={Oe}
              notify={G}
            /><Ee><Xl isOpen={Si} settings={J} onClose={() => Xr(!1)} onEditOrder={t => {
              Ka(t), G({
                message: `Đã nạp hóa đơn #${t.display_id || t.id} ra giỏ hàng!`,
                type: "success"
              });
            }} onPrintOrder={(t, a = "Sale") => {
              pn(a || "Sale");
              const r = Y.find(n => n.id === t.partner_id),
                s = {
                  ...t,
                  old_debt: t.old_debt !== void 0 && t.old_debt !== null ? t.old_debt : r && r.debt_balance || 0,
                  partner: r || t.partner || null
                };
              Ur(s);
              setTimeout(async () => {
                try {
                  await ensureFontLoaded(J?.invoice_font_family, J?.invoice_custom_font_name);
                  if (document.fonts && document.fonts.ready) {
                    await document.fonts.ready;
                  }
                  await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
                } catch (e) {}
                window.print();
              }, 300);
            }} onDeleteOrder={t => {
              Sn(t);
            }} /></Ee><MascotWatermarkCustomizer
              isOpen={showMascotCustomizer}
              onClose={() => setShowMascotCustomizer(false)}
              visible={mascotWatermarkVisible}
              onToggleVisible={() => {
                const next = !mascotWatermarkVisible;
                setMascotWatermarkVisible(next);
                localStorage.setItem("pos_mascot_watermark_visible", String(next));
              }}
              customImage={mascotWatermarkCustomImage}
              isCompressing={isCompressingMascot}
              onUploadImage={handleQuickMascotUpload}
              onResetImage={handleResetQuickMascot}
              pos={mascotWatermarkPos}
              onPosChange={(val) => {
                setMascotWatermarkPos(val);
                localStorage.setItem("pos_mascot_watermark_pos", val);
              }}
              scale={mascotWatermarkScale}
              onScaleChange={(val) => {
                setMascotWatermarkScale(val);
                localStorage.setItem("pos_mascot_watermark_scale", String(val));
              }}
              opacity={mascotWatermarkOpacity}
              onOpacityChange={(val) => {
                setMascotWatermarkOpacity(val);
                localStorage.setItem("pos_mascot_watermark_opacity", String(val));
              }}
              offsetX={mascotWatermarkOffsetX}
              onOffsetXChange={(val) => {
                setMascotWatermarkOffsetX(val);
                localStorage.setItem("pos_mascot_watermark_offset_x", String(val));
              }}
              offsetY={mascotWatermarkOffsetY}
              onOffsetYChange={(val) => {
                setMascotWatermarkOffsetY(val);
                localStorage.setItem("pos_mascot_watermark_offset_y", String(val));
              }}
              rotate={mascotWatermarkRotate}
              onRotateChange={(val) => {
                setMascotWatermarkRotate(val);
                localStorage.setItem("pos_mascot_watermark_rotate", String(val));
              }}
              onResetAll={() => {
                setMascotWatermarkOffsetX(10);
                setMascotWatermarkOffsetY(10);
                setMascotWatermarkRotate(-6);
                setMascotWatermarkScale(100);
                setMascotWatermarkOpacity(15);
                setMascotWatermarkPos("bottom-right");
                localStorage.setItem("pos_mascot_watermark_offset_x", "10");
                localStorage.setItem("pos_mascot_watermark_offset_y", "10");
                localStorage.setItem("pos_mascot_watermark_rotate", "-6");
                localStorage.setItem("pos_mascot_watermark_scale", "100");
                localStorage.setItem("pos_mascot_watermark_opacity", "15");
                localStorage.setItem("pos_mascot_watermark_pos", "bottom-right");
              }}
            />
            <CartColorCustomizerModal
              isOpen={showCartColorCustomizer}
              config={cartColorConfig}
              onClose={() => setShowCartColorCustomizer(false)}
              onChangeConfig={newCfg => {
                setCartColorConfig(newCfg);
                localStorage.setItem("pos_cart_color_config", JSON.stringify(newCfg));
                try {
                  const syncChan = new BroadcastChannel("pos_data_sync");
                  syncChan.postMessage({
                    type: "CART_COLOR_CONFIG_UPDATED",
                    key: "pos_cart_color_config",
                    value: JSON.stringify(newCfg)
                  });
                  syncChan.close();
                } catch (e) {}
              }}
            /><OrderDatePickerModal
              isOpen={isOrderDatePickerOpen}
              initialDate={customOrderDate || (le?.date ? le.date.slice(0, 10) : new Date().toISOString().slice(0, 10))}
              onClose={() => setIsOrderDatePickerOpen(false)}
              onConfirm={(val) => setCustomOrderDate(val)}
            /><DailyOrderHistoryModal
              isOpen={isDailyHistoryOpen}
              onClose={() => setIsDailyHistoryOpen(false)}
              type="Sale"
              settings={J}
              onEditOrder={async (order) => {
                setIsDailyHistoryOpen(false);
                await Ka(order);
                G({
                  message: `Đã nạp hóa đơn #${order.display_id || order.id} ra giỏ hàng!`,
                  type: "success"
                });
              }}
              onPrintOrder={(t, a = "Sale") => {
                pn(a || "Sale");
                const r = Y.find(n => n.id === t.partner_id),
                  s = {
                    ...t,
                    old_debt: t.old_debt !== void 0 && t.old_debt !== null ? t.old_debt : r && r.debt_balance || 0,
                    partner: r || t.partner || null
                  };
                Ur(s);
                setTimeout(async () => {
                  try {
                    await ensureFontLoaded(J?.invoice_font_family, J?.invoice_custom_font_name);
                    if (document.fonts && document.fonts.ready) {
                      await document.fonts.ready;
                    }
                    await new Promise(res => requestAnimationFrame(() => requestAnimationFrame(res)));
                  } catch (e) {}
                  window.print();
                }, 300);
              }}
              onDeleteOrder={(order) => {
                Sn(order);
              }}
            /><P>{historyPartner && <PartnerHistoryModal isOpen={!!historyPartner} partner={historyPartner} onClose={() => setHistoryPartner(null)} />}</P><Fn><POSHistoryPanel context="POS" defaultType="Sale" partner={p} isOpen={isHistoryPanelOpen} onClose={() => setIsHistoryPanelOpen(!1)} onAddToCart={t => {
              const a = (T || []).find(r => r.id === t.id) || t,
                hasCustomPrice = Boolean(p && p.id && R && R[a.id] !== void 0),
                r = t.last_price !== void 0 ? t.last_price : hasCustomPrice ? R[a.id] : Te === "Wholesale" && a.bulk_price || a.sale_price || 0;
              He({
                product: a,
                quantity: 1,
                price: r,
                secondary_qty: 1 / (a.multiplier || 1),
                name: a.name
              }), ia(a, 1, r), Ds(), G({
                message: `Đã thêm ${a.name} vào giỏ hàng`,
                type: "success"
              });
            }} onEditOrder={async t => {
              setIsHistoryPanelOpen(!1);
              await Ka(t);
              G({
                message: `Đã nạp hóa đơn #${t.display_id || t.id} ra giỏ hàng!`,
                type: "success"
              });
            }} onDeleteOrder={t => {
              Sn(t);
            }} /></Fn>
            <ActionContextMenu
              isOpen={!!itemContextMenu}
              type={itemContextMenu?.type || 'product'}
              data={itemContextMenu?.data}
              position={itemContextMenu?.position}
              onClose={() => setItemContextMenu(null)}
              onEdit={item => {
                if (itemContextMenu?.type === 'partner') {
                  fr(item);
                  Oa(!0);
                } else {
                  const prod = T.find(s => s.id === (item.id || item.product_id)) || item;
                  Vt(prod);
                  vt(!0);
                }
              }}
              onConsultAI={item => {
                const prod = T.find(s => s.id === (item.id || item.product_id)) || item;
                const ingInfo = (prod.active_ingredient || item.active_ingredient) ? ` (Hoạt chất: ${prod.active_ingredient || item.active_ingredient})` : '';
                const query = `Cho tôi biết công dụng, đặc trị bệnh gì, liều lượng pha và phối hợp thuốc của sản phẩm ${prod.name || prod.product_name}${ingInfo}`;
                window.dispatchEvent(new CustomEvent('open-ai-consult', { detail: { query } }));
              }}
              onViewHistory={item => {
                if (itemContextMenu?.type === 'partner') {
                  setHistoryPartner(item);
                } else {
                  const prod = T.find(s => s.id === (item.id || item.product_id)) || item;
                  Xt(prod);
                  za({
                    top: itemContextMenu?.position?.y || 200,
                    bottom: (itemContextMenu?.position?.y || 200) + 40,
                    left: itemContextMenu?.position?.x || 300,
                    right: (itemContextMenu?.position?.x || 300) + 100
                  });
                  Dt(!0);
                }
              }}
              onDelete={itemContextMenu?.onDelete}
            />
            {/* Popover chọn số lần lặp đọc soạn hàng */}
            <Ee>
              <Ws>
                {isPackingRepeatMenuOpen && (
                  <div 
                    className="fixed inset-0 z-[99999] bg-black/25 backdrop-blur-[1px] select-none"
                    onClick={() => setIsPackingRepeatMenuOpen(false)}
                    onContextMenu={e => { e.preventDefault(); setIsPackingRepeatMenuOpen(false); }}
                  >
                    <x.div
                      initial={{ opacity: 0, scale: 0.92, y: -6 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.94, y: -4 }}
                      transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
                      onClick={e => e.stopPropagation()}
                      style={{
                        position: "fixed",
                        left: typeof window !== "undefined" ? Math.max(12, Math.min(window.innerWidth - 300, packingRepeatMenuPos.x - 20)) : 100,
                        top: typeof window !== "undefined" ? Math.max(12, Math.min(window.innerHeight - 380, packingRepeatMenuPos.y)) : 100,
                      }}
                      className="w-[280px] bg-white/95 dark:bg-[#1a1c23]/95 backdrop-blur-xl border border-amber-500/25 dark:border-white/15 rounded-2xl shadow-2xl p-2.5 overflow-hidden ring-1 ring-black/5"
                    >
                      {/* Header */}
                      <div className="flex items-center justify-between px-2 py-1.5 mb-1.5 border-b border-slate-100 dark:border-white/10">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                            <jo size={15} strokeWidth={2.5} />
                          </div>
                          <div>
                            <div className="text-[12px] font-black tracking-tight text-slate-800 dark:text-slate-100">
                              Lặp Đọc Soạn Hàng
                            </div>
                            <div className="text-[10px] font-medium text-slate-400 dark:text-slate-400">
                              {isPackingSpeaking 
                                ? `Đang đọc lượt ${packingSpeakingLoop.current}/${packingSpeakingLoop.total === Infinity ? '∞' : packingSpeakingLoop.total}` 
                                : "Chọn số lần phát lại danh sách"}
                            </div>
                          </div>
                        </div>
                        <button 
                          type="button"
                          onClick={() => setIsPackingRepeatMenuOpen(false)}
                          className="w-6 h-6 rounded-md hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 flex items-center justify-center transition-colors"
                        >
                          <Xn size={14} />
                        </button>
                      </div>

                      {/* Options */}
                      <div className="space-y-1">
                        {[
                          { value: 1, label: "Đọc 1 lần", desc: "Mặc định, đọc hết danh sách rồi dừng", badge: "1x" },
                          { value: 2, label: "Lặp lại 2 lần", desc: "Đọc lại danh sách 2 lượt liên tiếp", badge: "2x" },
                          { value: 3, label: "Lặp lại 3 lần", desc: "Đọc lại danh sách 3 lượt liên tiếp", badge: "3x" },
                          { value: 5, label: "Lặp lại 5 lần", desc: "Đọc lại danh sách 5 lượt liên tiếp", badge: "5x" },
                          { value: Infinity, label: "Lặp liên tục", desc: "Phát vòng lặp vô hạn cho tới khi bấm dừng", badge: "∞" },
                        ].map((opt) => {
                          const isSelected = packingRepeatCount === opt.value || (opt.value === Infinity && (packingRepeatCount === Infinity || packingRepeatCount === 'Infinity'));
                          return (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() => selectPackingRepeat(opt.value)}
                              className={c(
                                "w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-left transition-all duration-150 group",
                                isSelected
                                  ? "bg-amber-500/15 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 font-bold border border-amber-500/30"
                                  : "hover:bg-slate-100 dark:hover:bg-white/5 text-slate-700 dark:text-slate-200 border border-transparent"
                              )}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <span className={c(
                                  "w-6 h-6 rounded-lg text-[10px] font-black flex items-center justify-center shrink-0 border",
                                  isSelected
                                    ? "bg-amber-500 text-white border-amber-600 shadow-xs"
                                    : "bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-white/10 group-hover:border-amber-500/40"
                                )}>
                                  {opt.badge}
                                </span>
                                <div className="truncate">
                                  <div className="text-[12px] leading-tight font-black">{opt.label}</div>
                                  <div className="text-[10px] text-slate-400 dark:text-slate-400 font-normal truncate">{opt.desc}</div>
                                </div>
                              </div>
                              {isSelected && (
                                <Os size={14} strokeWidth={3} className="text-amber-600 dark:text-amber-400 shrink-0 ml-1.5" />
                              )}
                            </button>
                          );
                        })}
                      </div>

                      {/* If currently speaking or stop button */}
                      {isPackingSpeaking && (
                        <div className="mt-2 pt-2 border-t border-slate-100 dark:border-white/10">
                          <button
                            type="button"
                            onClick={() => selectPackingRepeat("stop")}
                            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-red-500/10 hover:bg-red-500 text-red-600 hover:text-white dark:text-red-400 dark:hover:text-white font-bold text-xs transition-all duration-150 border border-red-500/20"
                          >
                            <Uo size={14} strokeWidth={2.5} />
                            <span>Dừng đọc danh sách ngay</span>
                          </button>
                        </div>
                      )}

                      {/* Footnote */}
                      <div className="mt-2 px-1 text-[9.5px] text-slate-400 dark:text-slate-400 text-center font-medium">
                        💡 Đè nút soạn ({'>'} 400ms) để chọn nhanh số lần đọc
                      </div>
                    </x.div>
                  </div>
                )}
              </Ws>
            </Ee>
            </div></div>{(fa || ya) && (fa && fa.details && fa.details.length > 0 || ya && ya.details && ya.details.length > 0) && <div className="only-print"><PrintTemplate data={fa || ya} settings={J} type={Gi || "Sale"} isPreview={false} showOldDebt={Ke.showOldDebt} showPayment={Ke.showPayment} showRemaining={Ke.showRemaining} showCashGiven={Ke.showCashGiven} showChange={Ke.showChange} /></div>}</></Comp_fd>;
}
export default POSPage;