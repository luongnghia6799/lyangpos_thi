import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import * as e from "react/jsx-runtime";
import axios from "axios";
import { m, AnimatePresence, useMotionValue, useSpring, MotionConfig } from "framer-motion";
import { useLocation } from "react-router-dom";
import { DEFAULT_SETTINGS } from "../../lib/settings";
import PrintTemplate from "../../components/PrintTemplate";
import ConfirmModal from "../../components/ConfirmModal";
import TaxCalculatorModal from "../../components/TaxCalculatorModal";
import ProductEditModal from "../../components/ProductEditModal";
import PartnerEditModal from "../../components/PartnerEditModal";
import LoadingOverlay from "../../components/LoadingOverlay";
import Portal from "../../components/Portal";
import Toast from "../../components/Toast";
import OrderEditPopup from "../../components/OrderEditPopup";
import HeavyClock from "../../components/HeavyClock";
import QuickDebtModal from "../../components/QuickDebtModal";
import QuickVoucherModal from "../../components/QuickVoucherModal";
import QuickAuditPopout from "../../components/QuickAuditPopout";
import PosMirrorModal from "../../components/PosMirrorModal";
import CustomSelect from "../../components/CustomSelect";

import {
  useProductData,
  usePartnerData,
  useShippingSummary
} from "../../queries/useProductData";

import {
  formatDate as Fe,
  cn as u,
  formatNumber as I,
  smartSortItems as xs,
  numberToViText as qa,
  removeAccents as nt,
  formatDebt as En,
  formatCurrency as it,
  normalizeUOM as Te,
  playSuccessSound as fs,
  playTabSound as On,
  playErrorSound as Wn,
  playPopSound as Tr,
  speakNumber,
  precacheCommonTTS,
  precacheAmounts
} from "../../lib/utils";

import * as ScrollArea from "@radix-ui/react-scroll-area";
import * as Dialog from "@radix-ui/react-dialog";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";
import {
  History, Eye, EyeOff, X, Clock, ShoppingBag, BookOpen, ReceiptText, Wallet, Copy, Satellite,
  SquarePen, Trash2, Package, Truck, Search, Calendar, CircleCheck, MapPin,
  Phone, PackageSearch, ExternalLink, RefreshCcw, Tv, VolumeX, Volume2, User,
  Plus, ChevronRight, Pause, ChevronLeft, Coins, Users, TrendingUp, Zap,
  PackageX, TriangleAlert, RotateCcw, TrendingDown, CircleAlert, Droplets,
  Check, Activity, Sprout, FileText, LoaderCircle, Save, Printer, BadgePercent,
  ArrowLeftRight, Leaf, HandCoins, RotateCw, Minus
} from "lucide-react";

// Aliases used in the compiled code
const i = React;
const q = axios;
const Ae = (text, voice) => {
  let baseUrl = q.defaults.baseURL || 'http://localhost:3579';
  if (baseUrl.includes('localhost') && typeof window !== 'undefined' && window.location && window.location.hostname && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1' && !window.location.hostname.includes('tauri')) {
    baseUrl = baseUrl.replace('localhost', window.location.hostname);
  }
  return `${baseUrl.replace(/\/+$/, '')}/api/tts?text=${encodeURIComponent(text)}&voice=${voice}`;
};
const playPackingQueue = (items, productsList) => {
  if (!items || items.length === 0) return;
  const voice = localStorage.getItem("pos_selected_voice") || "edge-vi-female";
  const sentences = ["Soạn hàng"];
  items.forEach(item => {
    const qty = item.quantity || 0;
    const unit = item.product_unit || item.unit || '';
    const prod = productsList.find(s => s.id === item.product_id);
    const nameText = (prod && prod.alias && prod.alias.trim()) ? prod.alias.trim() : item.product_name;
    sentences.push(`${qty} ${unit} ${nameText}`);
  });
  
  if (window.currentPackingQueue) {
    window.currentPackingQueue.stop();
  }
  
  let currentIndex = 0;
  let currentAudio = null;
  let nextAudio = null;
  let isStopped = false;
  
  const destroyAudio = (audio) => {
    if (audio) {
      try {
        audio.pause();
        audio.src = "";
        audio.load();
      } catch (e) {}
      audio.onended = null;
      audio.onerror = null;
    }
  };
  
  const preloadAudio = (index) => {
    if (index >= sentences.length || isStopped) return null;
    const url = Ae(sentences[index], voice);
    const audio = new Audio(url);
    audio.preload = "auto";
    return audio;
  };
  
  const playNext = () => {
    if (isStopped) return;
    
    if (currentAudio) {
      destroyAudio(currentAudio);
      currentAudio = null;
    }
    
    if (currentIndex >= sentences.length) {
      cleanup();
      return;
    }
    
    if (nextAudio) {
      currentAudio = nextAudio;
      nextAudio = null;
    } else {
      currentAudio = preloadAudio(currentIndex);
    }
    
    if (!currentAudio) {
      cleanup();
      return;
    }
    
    // Preload the next item immediately while current is playing
    nextAudio = preloadAudio(currentIndex + 1);
    
    currentAudio.onended = () => {
      currentIndex++;
      playNext();
    };
    currentAudio.onerror = () => {
      currentIndex++;
      playNext();
    };
    
    const playPromise = currentAudio.play();
    if (playPromise !== undefined) {
      playPromise.catch(err => {
        console.error("Queue play failed:", err);
        currentIndex++;
        playNext();
      });
    }
  };
  
  const cleanup = () => {
    isStopped = true;
    destroyAudio(currentAudio);
    destroyAudio(nextAudio);
    currentAudio = null;
    nextAudio = null;
    window.currentPackingQueue = null;
  };
  
  window.currentPackingQueue = {
    stop: cleanup
  };
  
  playNext();
};
const Qn = HeavyClock;
const Ra = DEFAULT_SETTINGS;
const bs = PrintTemplate;
const Vn = TaxCalculatorModal;
const gs = PartnerEditModal;

const hs = async (fn) => await fn();
const ms = ProductEditModal;
const An = Toast;
const qn = LoadingOverlay;
const Rn = OrderEditPopup;
const Mn = ConfirmModal;
const Be = Portal;

const fi = QuickDebtModal;
const bi = QuickVoucherModal;
const gi = QuickAuditPopout;

const yi = useProductData;
const wi = usePartnerData;
const vi = useShippingSummary;

// Radix ScrollArea aliases
const Ds = ScrollArea.Root;
const $n = ScrollArea.Viewport;
const Bn = ScrollArea.Corner;
const zs = ScrollArea.Scrollbar;
const Fn = ScrollArea.Thumb;

// Radix Dialog aliases
const Ps = Dialog.Overlay;
const Un = Dialog.Portal;
const Es = Dialog.Content;
const Kn = Dialog.Close;
const As = Dialog.Title;
const qs = Dialog.Description;
const Ds_dialog = Dialog.Root;

const Rs = useQueryClient;
const ht = toast;
const Gn = useLocation;

const Ln = Slot;
const Hn = cva;

// Framer motion aliases
const T = AnimatePresence;
const ys = useMotionValue;
const ws = useSpring;
const Xn = MotionConfig;

// Lucide icon aliases
const Ot = History;
const zr = Eye;
const vs = EyeOff;
const Se = X;
const ia = Clock;
const Jn = ShoppingBag;
const Pr = BookOpen;
const Er = ReceiptText;
const La = Wallet;
const Yn = SquarePen;
const Ar = Trash2;
const sa = Package;
const lt = Truck;
const qr = Search;
const Zn = Calendar;
const Ma = CircleCheck;
const Ha = MapPin;
const na = Phone;
const ei = PackageSearch;
const ti = ExternalLink;
const Rt = RefreshCcw;
const ks = Tv;
const ai = VolumeX;
const ri = Volume2;
const Oa = User;
const ft = Plus;
const Sr = ChevronRight;
const At = Pause;
const js = ChevronLeft;
const bt = Coins;
const si = Users;
const ni = TrendingUp;
const ii = Zap;
const Wa = PackageX;
const qt = TriangleAlert;
const Ir = RotateCcw;
const Ns = TrendingDown;
const li = CircleAlert;
const oi = Droplets;
const ci = Check;
const _s = Activity;
const Cs = Sprout;
const ra = FileText;
const Ts = LoaderCircle;
const Ss = Save;
const Dr = Printer;
const di = BadgePercent;
const pi = ArrowLeftRight;
const ui = Leaf;
const xi = HandCoins;
const mi = RotateCw;
const hi = Minus;


function ki({
  partner: f,
  isOpen: g,
  onClose: h,
  onAddToCart: $,
  onViewOrder: B,
  onEditOrder: oe,
  onDeleteOrder: Z,
  onEditVoucher: F,
  onDeleteVoucher: ve
}) {
  const [z, Q] = i.useState([]), [ee, ce] = i.useState([]), [qe, Ue] = i.useState(!1), [de, Ie] = i.useState("invoices"), [te, Re] = i.useState("all"), [xe, Ke] = i.useState(1), [De, Me] = i.useState(!0), [ae, y] = i.useState(!0), [P, N] = i.useState("all"), [b, S] = i.useState(""), [O, ke] = i.useState(""), re = z.filter(w => w.is_voucher && w.type === "Receipt");
  i.useEffect(() => {
    g && f && (Q([]), Ke(1), Me(!0), N("all"), S(""), ke(""), Ge(1))
  }, [g, f]), i.useEffect(() => {
    const w = new BroadcastChannel("pos_data_sync");
    return w.onmessage = be => {
      g && f && (be.data.type === "ORDER_SAVED" || be.data.type === "PARTNER_UPDATED") && (console.log("History Panel Sync Refreshing..."), Q([]), Ke(1), Me(!0), Ge(1))
    }, () => w.close()
  }, [g, f]), i.useEffect(() => {
    const w = be => {
      be.key === "Escape" && h()
    };
    return g && window.addEventListener("keydown", w), () => window.removeEventListener("keydown", w)
  }, [g, h]), i.useEffect(() => {
    P === "custom" && re.length >= 2 ? (b || S(re[0].id), O || ke(re[1].id)) : P === "custom" && re.length === 1 && (b || S(re[0].id), O || ke(re[0].id))
  }, [P, re, b, O]);
  const Ge = async (w = 1) => {
    Ue(!0);
    try {
      const [k, ze] = await Promise.all([q.get(`/api/orders?partner_id=${f.id}&limit=20&page=${w}&type=Sale`), q.get(`/api/vouchers?partner_id=${f.id}`)]), K = k.data.items || k.data || [], Qe = (ze.data || []).filter(W => W.source !== 'auto').map(W => ({
        id: `v_${W.id}`,
        is_voucher: !0,
        display_id: W.type === "DebtIncrease" ? `GN-${W.id}` : W.type === "Receipt" ? `PT-${W.id}` : `PC-${W.id}`,
        date: W.date,
        time: Fe(W.date, "HH:mm"),
        total_amount: W.amount,
        payment_method: W.type === "DebtIncrease" ? "Debt" : W.type === "Receipt" ? "PT" : "PC",
        type: W.type,
        note: W.note,
        details: []
      }));
      if (Q(W => (w === 1 ? [...K.map(M => ({
          ...M,
          time: Fe(M.date, "HH:mm")
        })), ...Qe] : [...W, ...K.map(M => ({
          ...M,
          time: Fe(M.date, "HH:mm")
        }))]).sort((M, oa) => new Date(oa.date) - new Date(M.date))), K.length < 20 && Me(!1), w === 1) {
        const W = {};
        K.forEach(C => {
          C.details && C.details.forEach(M => {
            W[M.product_id] || (W[M.product_id] = {
              id: M.product_id,
              name: M.product_name,
              unit: M.product_unit,
              price: M.price,
              total_qty: 0,
              last_price: M.price,
              last_date: C.date
            }), W[M.product_id].total_qty += M.quantity, new Date(C.date) > new Date(W[M.product_id].last_date) && (W[M.product_id].last_date = C.date, W[M.product_id].last_price = M.price)
          })
        }), ce(Object.values(W).sort((C, M) => M.total_qty - C.total_qty))
      }
    } catch (be) {
      console.error("Error fetching POS history:", be)
    } finally {
      Ue(!1)
    }
  }, la = () => {
    const w = xe + 1;
    Ke(w), Ge(w)
  };
  return e.jsx(T, {
    children: g && e.jsxs("div", {
      className: "fixed inset-0 z-[3000] flex justify-end font-sans",
      children: [e.jsx(m.div, {
        initial: {
          opacity: 0
        },
        animate: {
          opacity: 1
        },
        exit: {
          opacity: 0
        },
        onClick: h,
        className: "absolute inset-0 bg-black/40 backdrop-blur-md"
      }), e.jsxs(m.div, {
        initial: {
          x: "100%",
          opacity: 0
        },
        animate: {
          x: 0,
          opacity: 1
        },
        exit: {
          x: "100%",
          opacity: 0
        },
        transition: {
          type: "spring",
          damping: 32,
          stiffness: 260
        },
        className: "relative w-full max-w-[440px] h-full bg-[#022c22]/95 backdrop-blur-[100px] shadow-[0_0_150px_rgba(0,0,0,0.7)] flex flex-col border-l border-white/10",
        children: [e.jsxs("div", {
          className: "p-5 border-b border-white/10 relative overflow-hidden group",
          children: [e.jsx("div", {
            className: "absolute top-0 right-0 p-8 opacity-[0.03] -rotate-12 translate-x-4 -translate-y-4 pointer-events-none transition-transform group-hover:scale-110 duration-700 text-white",
            children: e.jsx(Ot, {
              size: 100
            })
          }), e.jsxs("div", {
            className: "flex justify-between items-center relative z-10",
            children: [e.jsxs("div", {
              className: "flex items-center gap-4",
              children: [e.jsx("div", {
                className: "w-9 h-9 bg-white/10 rounded-xl flex items-center justify-center text-emerald-400 border border-white/10",
                children: e.jsx(Ot, {
                  size: 18,
                  strokeWidth: 2.5
                })
              }), e.jsxs("div", {
                children: [e.jsx("h3", {
                  className: "font-black text-[14px] text-white uppercase tracking-tighter leading-none mb-1",
                  children: "Lịch sử GD"
                }), e.jsxs("p", {
                  className: "text-[9px] font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-2",
                  children: [e.jsx("span", {
                    className: "w-1 h-1 rounded-full bg-emerald-500"
                  }), f.name]
                })]
              })]
            }), e.jsxs("div", {
              className: "flex items-center gap-2",
              children: [e.jsx("button", {
                onClick: () => y(!ae),
                className: "w-9 h-9 flex items-center justify-center bg-white/10 hover:bg-white/20 text-white/60 hover:text-white rounded-xl transition-all border border-white/10 shadow-lg",
                title: ae ? "Chế độ riêng tư" : "Hiện thông tin chi tiết",
                children: ae ? e.jsx(zr, {
                  size: 16,
                  strokeWidth: 2.5
                }) : e.jsx(vs, {
                  size: 16,
                  strokeWidth: 2.5
                })
              }), e.jsx("button", {
                onClick: h,
                className: "w-9 h-9 flex items-center justify-center bg-white/10 hover:bg-rose-500/20 text-white/60 hover:text-rose-400 rounded-xl transition-all hover:rotate-90 border border-white/10 shadow-lg",
                children: e.jsx(Se, {
                  size: 16,
                  strokeWidth: 3
                })
              })]
            })]
          })]
        }), e.jsxs("div", {
          className: "flex p-3 gap-2",
          children: [e.jsxs("button", {
            onClick: () => Ie("invoices"),
            className: u("flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 border-2", de === "invoices" ? "bg-emerald-500 border-white/10 text-white shadow-lg shadow-emerald-500/20" : "bg-white/5 border-white/5 text-white/50 hover:text-white hover:bg-white/10"),
            children: [e.jsx(ia, {
              size: 14,
              strokeWidth: 3
            }), " Hóa đơn"]
          }), e.jsxs("button", {
            onClick: () => Ie("products"),
            className: u("flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 border-2", de === "products" ? "bg-emerald-500 border-white/10 text-white shadow-lg shadow-emerald-500/20" : "bg-white/5 border-white/5 text-white/50 hover:text-white hover:bg-white/10"),
            children: [e.jsx(Jn, {
              size: 14,
              strokeWidth: 3
            }), " Sản phẩm"]
          })]
        }), e.jsx(T, {
          children: de === "invoices" && e.jsxs(m.div, {
            initial: {
              opacity: 0,
              y: -10
            },
            animate: {
              opacity: 1,
              y: 0
            },
            exit: {
              opacity: 0,
              y: -10
            },
            className: "px-5 pb-3 flex flex-col gap-2 border-b border-white/5",
            children: [e.jsx("div", {
              className: "flex gap-2",
              children: [{
                id: "all",
                label: "Tất cả"
              }, {
                id: "cash",
                label: "Tiền mặt"
              }, {
                id: "debt",
                label: "Công nợ"
              }].map(w => e.jsx("button", {
                onClick: () => Re(w.id),
                className: u("px-2.5 py-1 rounded-md text-[8px] font-black uppercase tracking-widest transition-all border", te === w.id ? "bg-white/20 border-white/40 text-white" : "bg-transparent border-white/5 text-white/30 hover:text-white/60"),
                children: w.label
              }, w.id))
            }), e.jsx("div", {
              className: "flex gap-2 bg-white/[0.02] p-1 rounded-lg border border-white/5",
              children: [{
                id: "all",
                label: "Hiện Full"
              }, {
                id: "latest",
                label: "Trả gần nhất → Nay"
              }, {
                id: "custom",
                label: "Tùy chọn"
              }].map(w => e.jsx("button", {
                onClick: () => N(w.id),
                className: u("flex-1 py-1 rounded-md text-[7px] font-black uppercase tracking-wider transition-all border", P === w.id ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400 shadow-md shadow-emerald-500/5" : "bg-transparent border-white/5 text-white/40 hover:text-white/70"),
                children: w.label
              }, w.id))
            }), P === "custom" && e.jsxs("div", {
              className: "flex gap-2 items-center mt-1 bg-white/5 p-2 rounded-lg border border-white/5",
              children: [e.jsxs("div", {
                className: "flex-1 flex flex-col gap-0.5",
                children: [e.jsx("span", {
                  className: "text-[7px] text-white/40 uppercase font-black",
                  children: "Từ lần trả"
                }), e.jsxs("select", {
                  value: b,
                  onChange: w => S(w.target.value),
                  className: "w-full bg-[#022c22] border border-white/10 text-white text-[9px] rounded p-1 font-bold outline-none focus:border-emerald-500/50",
                  children: [e.jsx("option", {
                    value: "",
                    children: "-- Chọn --"
                  }), re.map(w => e.jsxs("option", {
                    value: w.id,
                    children: [w.display_id, " (", Fe(w.date), ")"]
                  }, w.id))]
                })]
              }), e.jsx("span", {
                className: "text-[8px] text-white/30 font-bold self-end mb-1.5",
                children: "→"
              }), e.jsxs("div", {
                className: "flex-1 flex flex-col gap-0.5",
                children: [e.jsx("span", {
                  className: "text-[7px] text-white/40 uppercase font-black",
                  children: "Đến lần trả"
                }), e.jsxs("select", {
                  value: O,
                  onChange: w => ke(w.target.value),
                  className: "w-full bg-[#022c22] border border-white/10 text-white text-[9px] rounded p-1 font-bold outline-none focus:border-emerald-500/50",
                  children: [e.jsx("option", {
                    value: "",
                    children: "-- Chọn --"
                  }), re.map(w => e.jsxs("option", {
                    value: w.id,
                    children: [w.display_id, " (", Fe(w.date), ")"]
                  }, w.id))]
                })]
              })]
            })]
          })
        }), e.jsx("div", {
          className: "flex-1 overflow-y-auto no-scrollbar px-5 pb-6 space-y-3",
          children: qe && xe === 1 ? e.jsxs("div", {
            className: "flex flex-col items-center justify-center py-32",
            children: [e.jsx("div", {
              className: "w-10 h-10 border-[3px] border-white/10 border-t-emerald-500 rounded-full animate-spin mb-6"
            }), e.jsx("span", {
              className: "font-black text-[10px] text-emerald-400 uppercase tracking-[0.4em]",
              children: "Đang nạp dữ liệu..."
            })]
          }) : de === "invoices" ? z.length === 0 ? e.jsxs("div", {
            className: "text-center py-40 opacity-20",
            children: [e.jsx(Ot, {
              size: 60,
              strokeWidth: 1,
              className: "mx-auto mb-8 text-white"
            }), e.jsx("p", {
              className: "font-black uppercase text-[10px] tracking-[0.4em] text-white",
              children: "Trống trải..."
            })]
          }) : (() => {
            let w = [...z];
            if (P === "latest") {
              const k = w.findIndex(ze => ze.is_voucher && ze.type === "Receipt");
              k !== -1 && (w = w.slice(0, k + 1))
            } else if (P === "custom" && b && O) {
              const k = w.findIndex(K => K.id === b),
                ze = w.findIndex(K => K.id === O);
              if (k !== -1 && ze !== -1) {
                const K = Math.min(k, ze),
                  ot = Math.max(k, ze);
                w = w.slice(K, ot + 1)
              }
            }
            const be = w.filter(k => te === "all" ? !0 : te === "cash" ? k.payment_method !== "Debt" : te === "debt" ? k.payment_method === "Debt" : !0);
            return e.jsxs("div", {
              className: "relative pl-7 space-y-2 pt-4",
              children: [e.jsx("div", {
                className: "absolute left-[13px] top-4 bottom-4 w-px bg-white/10"
              }), be.map((k, ze) => e.jsxs("div", {
                className: "relative",
                children: [e.jsx("div", {
                  className: u("absolute left-[-22px] top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full border-2 border-slate-950 z-10", k.type === "DebtIncrease" ? "bg-amber-500" : k.type === "Receipt" ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" : k.type === "Payment" ? "bg-rose-500" : "bg-white")
                }), e.jsxs("div", {
                  className: u("p-3 rounded-xl border transition-all group flex flex-col cursor-pointer relative overflow-hidden", k.type === "Receipt" ? "bg-emerald-500/10 border-emerald-500/30 hover:border-emerald-400 hover:bg-emerald-500/15 shadow-[0_0_15px_rgba(16,185,129,0.1)]" : "bg-white/[0.04] border-white/5 hover:border-emerald-400/40 hover:bg-white/[0.08]"),
                  onClick: K => {
                    !k.is_voucher && B && B(k)
                  },
                  children: [e.jsxs("div", {
                    className: "flex items-center justify-between w-full",
                    children: [e.jsxs("div", {
                      className: "flex items-center gap-2.5 flex-1 min-w-0",
                      children: [e.jsx("div", {
                        className: u("w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-inner", k.type === "DebtIncrease" ? "bg-amber-500/20 text-amber-500" : k.type === "Receipt" ? "bg-emerald-500/20 text-emerald-500" : k.type === "Payment" ? "bg-rose-500/20 text-rose-500" : "bg-white/10 text-white/50"),
                        children: k.type === "DebtIncrease" ? e.jsx(Pr, {
                          size: 14,
                          strokeWidth: 2.5
                        }) : k.is_voucher ? e.jsx(Er, {
                          size: 14,
                          strokeWidth: 2.5
                        }) : ae ? e.jsx(zr, {
                          size: 14,
                          strokeWidth: 2.5
                        }) : e.jsx(vs, {
                          size: 14,
                          strokeWidth: 2.5
                        })
                      }), e.jsxs("div", {
                        className: "min-w-0",
                        children: [e.jsxs("div", {
                          className: u("text-[12px] font-black uppercase tracking-wide leading-none mb-1 truncate pr-2 flex items-center gap-1", k.type === "DebtIncrease" ? "text-amber-400" : k.type === "Receipt" ? "text-emerald-400 font-extrabold" : k.type === "Payment" ? "text-rose-400" : k.payment_method === "Debt" ? "text-blue-400" : "text-white"),
                          children: [k.type === "Receipt" && e.jsx(La, {
                            size: 12,
                            className: "shrink-0"
                          }), ae ? k.is_voucher ? k.type === "DebtIncrease" ? "Ghi nợ" : k.type === "Receipt" ? `Thu tiền #${k.id.split("_")[1]}` : `Chi tiền #${k.id.split("_")[1]}` : k.display_id ? `#${k.display_id}` : `#${k.id}` : "********"]
                        }), e.jsxs("div", {
                          className: "flex items-center gap-2",
                          children: [e.jsx("span", {
                            className: "text-[9px] font-black text-white/30 tabular-nums uppercase",
                            children: ae ? k.time : "--:--"
                          }), e.jsx("div", {
                            className: u("text-[7px] font-black px-1 py-0.5 rounded uppercase tracking-tight border", k.payment_method === "Debt" ? "bg-blue-500/20 text-blue-400 border-blue-500/5" : "bg-emerald-500/20 text-emerald-400 border-emerald-500/5"),
                            children: k.payment_method === "Debt" ? "NỢ" : "T.MẶT"
                          })]
                        })]
                      })]
                    }), e.jsxs("div", {
                      className: "flex items-center gap-2 pl-2 shrink-0",
                      children: [e.jsx("div", {
                        className: u("text-[15px] font-black tracking-tighter tabular-nums text-right leading-none drop-shadow-md", k.type === "DebtIncrease" ? "text-amber-400" : k.type === "Receipt" ? "text-emerald-400" : k.type === "Payment" ? "text-rose-400" : k.payment_method === "Debt" ? "text-blue-400" : "text-emerald-400"),
                        children: I(k.total_amount || k.total)
                      }), e.jsxs("div", {
                        className: "flex flex-col gap-1 transition-all duration-200 opacity-0 scale-90 translate-x-1 group-hover:opacity-100 group-hover:scale-100 group-hover:translate-x-0 w-0 group-hover:w-auto overflow-hidden",
                        children: [e.jsx("button", {
                          onClick: K => {
                            K.stopPropagation(), k.is_voucher ? F && F(k) : oe && oe(k)
                          },
                          className: "p-1 bg-white/10 hover:bg-white/20 text-white/40 hover:text-white rounded-md transition-all",
                          children: e.jsx(Yn, {
                            size: 10
                          })
                        }), e.jsx("button", {
                          onClick: K => {
                            K.stopPropagation(), k.is_voucher ? ve && ve(k) : Z && Z(k.id)
                          },
                          className: "p-1 bg-rose-500/10 hover:bg-rose-500/30 text-white/40 hover:text-rose-400 rounded-md transition-all",
                          children: e.jsx(Ar, {
                            size: 10
                          })
                        })]
                      })]
                    })]
                  }), ae && k.details && k.details.length > 0 && e.jsxs("div", {
                    className: "border-t border-white/5 mt-2.5 pt-2.5 flex flex-wrap gap-1",
                    children: [k.details.slice(0, 3).map((K, ot) => e.jsxs("div", {
                      className: "px-1.5 py-0.5 bg-emerald-500/5 border border-emerald-500/10 rounded-md text-[8px] font-black text-emerald-400/90 uppercase flex items-center gap-1 transition-all hover:bg-emerald-500/10",
                      children: [e.jsx("span", {
                        className: "truncate max-w-[70px]",
                        children: K.product_name
                      }), e.jsx("div", {
                        className: "w-px h-1.5 bg-emerald-500/20"
                      }), e.jsx("span", {
                        className: "text-emerald-300",
                        children: I(K.quantity)
                      })]
                    }, ot)), k.details.length > 3 && e.jsxs("div", {
                      className: "px-1.5 py-0.5 bg-white/5 border border-white/5 rounded-md text-[8px] font-black text-white/30 uppercase tracking-tighter",
                      children: ["+", k.details.length - 3, " món"]
                    })]
                  })]
                })]
              }, k.id || ze)), De && e.jsx("button", {
                onClick: la,
                disabled: qe,
                className: "w-full py-3 rounded-xl border border-white/5 text-white/30 text-[8px] font-black uppercase tracking-[0.4em] hover:bg-white/5 hover:text-white transition-all active:scale-[0.98]",
                children: qe ? "Đang truy xuất..." : "Tải thêm"
              })]
            })
          })() : ee.length === 0 ? e.jsxs("div", {
            className: "text-center py-40 opacity-20",
            children: [e.jsx(sa, {
              size: 60,
              strokeWidth: 1,
              className: "mx-auto mb-8 text-white"
            }), e.jsx("p", {
              className: "font-black uppercase text-[10px] tracking-[0.4em] text-white",
              children: "Trống trải..."
            })]
          }) : ee.map(w => e.jsxs("div", {
            className: "bg-white/[0.04] p-3 rounded-xl border border-white/5 hover:border-emerald-500/40 transition-colors flex items-center justify-between hover:bg-white/[0.08]",
            children: [e.jsxs("div", {
              className: "flex-1 min-w-0 pr-3",
              children: [e.jsx("div", {
                className: "font-black text-[12px] text-white uppercase truncate mb-1",
                title: w.name,
                children: w.name
              }), e.jsxs("div", {
                className: "flex items-center gap-2",
                children: [e.jsxs("span", {
                  className: "text-[9px] font-black text-emerald-400 bg-emerald-500/5 px-1.5 py-0.5 rounded-md border border-emerald-500/5 tabular-nums",
                  children: ["Tổng ", I(w.total_qty), " ", w.unit]
                }), e.jsxs("span", {
                  className: "text-[9px] font-black text-white/20 tabular-nums",
                  children: ["Giá cuối: ", I(w.last_price)]
                })]
              })]
            }), e.jsx("button", {
              onClick: () => $(w),
              className: "w-8 h-8 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white rounded-lg shadow-lg flex items-center justify-center transition-all border border-emerald-500/5 active:scale-90",
              children: e.jsx(ji, {
                size: 14,
                strokeWidth: 2.5
              })
            })]
          }, w.id))
        })]
      })]
    })
  })
}
const ji = ({
    size: f,
    strokeWidth: g
  }) => e.jsxs("svg", {
    width: f,
    height: f,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: g,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    children: [e.jsx("line", {
      x1: "12",
      y1: "5",
      x2: "12",
      y2: "19"
    }), e.jsx("line", {
      x1: "5",
      y1: "12",
      x2: "19",
      y2: "12"
    })]
  }),
  Ni = i.forwardRef(({
    className: f,
    ...g
  }, h) => e.jsx("div", {
    className: "relative w-full overflow-auto",
    children: e.jsx("table", {
      ref: h,
      className: u("w-full caption-bottom text-sm", f),
      ...g
    })
  }));
Ni.displayName = "Table";
const _i = i.forwardRef(({
  className: f,
  ...g
}, h) => e.jsx("thead", {
  ref: h,
  className: u("[&_tr]:border-b", f),
  ...g
}));
_i.displayName = "TableHeader";
const Ci = i.forwardRef(({
  className: f,
  ...g
}, h) => e.jsx("tbody", {
  ref: h,
  className: u("[&_tr:last-child]:border-0", f),
  ...g
}));
Ci.displayName = "TableBody";
const Ti = i.forwardRef(({
  className: f,
  ...g
}, h) => e.jsx("tfoot", {
  ref: h,
  className: u("border-t bg-muted/50 font-medium [&>tr]:last:border-b-0", f),
  ...g
}));
Ti.displayName = "TableFooter";
const Si = i.forwardRef(({
  className: f,
  ...g
}, h) => e.jsx("tr", {
  ref: h,
  className: u("border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted", f),
  ...g
}));
Si.displayName = "TableRow";
const Ii = i.forwardRef(({
  className: f,
  ...g
}, h) => e.jsx("th", {
  ref: h,
  className: u("h-10 px-2 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]", f),
  ...g
}));
Ii.displayName = "TableHead";
const Di = i.forwardRef(({
  className: f,
  ...g
}, h) => e.jsx("td", {
  ref: h,
  className: u("p-2 align-middle [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]", f),
  ...g
}));
Di.displayName = "TableCell";
const zi = i.forwardRef(({
  className: f,
  ...g
}, h) => e.jsx("caption", {
  ref: h,
  className: u("mt-4 text-sm text-muted-foreground", f),
  ...g
}));
zi.displayName = "TableCaption";
const Pi = cva("inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0", {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        outline: "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline"
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }),
  Ei = i.forwardRef(({
    className: f,
    variant: g,
    size: h,
    asChild: $ = !1,
    ...B
  }, oe) => {
    const Z = $ ? Ln : "button";
    return e.jsx(Z, {
      className: u(Pi({
        variant: g,
        size: h,
        className: f
      })),
      ref: oe,
      ...B
    })
  });
Ei.displayName = "Button";
const Ai = i.forwardRef(({
  className: f,
  type: g,
  ...h
}, $) => e.jsx("input", {
  type: g,
  className: u("flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm", f),
  ref: $,
  ...h
}));
Ai.displayName = "Input";
const qi = i.forwardRef(({
  className: f,
  ...g
}, h) => e.jsx("div", {
  ref: h,
  className: u("rounded-xl border bg-card text-card-foreground shadow", f),
  ...g
}));
qi.displayName = "Card";
const Ri = i.forwardRef(({
  className: f,
  ...g
}, h) => e.jsx("div", {
  ref: h,
  className: u("flex flex-col space-y-1.5 p-6", f),
  ...g
}));
Ri.displayName = "CardHeader";
const Mi = i.forwardRef(({
  className: f,
  ...g
}, h) => e.jsx("div", {
  ref: h,
  className: u("font-semibold leading-none tracking-tight", f),
  ...g
}));
Mi.displayName = "CardTitle";
const Oi = i.forwardRef(({
  className: f,
  ...g
}, h) => e.jsx("div", {
  ref: h,
  className: u("text-sm text-muted-foreground", f),
  ...g
}));
Oi.displayName = "CardDescription";
const Wi = i.forwardRef(({
  className: f,
  ...g
}, h) => e.jsx("div", {
  ref: h,
  className: u("p-6 pt-0", f),
  ...g
}));
Wi.displayName = "CardContent";
const Li = i.forwardRef(({
  className: f,
  ...g
}, h) => e.jsx("div", {
  ref: h,
  className: u("flex items-center p-6 pt-0", f),
  ...g
}));
Li.displayName = "CardFooter";
const Hi = i.forwardRef(({
  className: f,
  children: g,
  ...h
}, $) => e.jsxs(Ds, {
  ref: $,
  className: u("relative overflow-hidden", f),
  ...h,
  children: [e.jsx($n, {
    className: "h-full w-full rounded-[inherit]",
    children: g
  }), e.jsx(Ms, {}), e.jsx(Bn, {})]
}));
Hi.displayName = Ds.displayName;
const Ms = i.forwardRef(({
  className: f,
  orientation: g = "vertical",
  ...h
}, $) => e.jsx(zs, {
  ref: $,
  orientation: g,
  className: u("flex touch-none select-none transition-colors", g === "vertical" && "h-full w-2.5 border-l border-l-transparent p-[1px]", g === "horizontal" && "h-2.5 flex-col border-t border-t-transparent p-[1px]", f),
  ...h,
  children: e.jsx(Fn, {
    className: "relative flex-1 rounded-full bg-border"
  })
}));
Ms.displayName = zs.displayName;
const $i = Un,
  Os = i.forwardRef(({
    className: f,
    ...g
  }, h) => e.jsx(Ps, {
    ref: h,
    className: u("fixed inset-0 z-50 bg-black/80  data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0", f),
    ...g
  }));
Os.displayName = Ps.displayName;
const Bi = i.forwardRef(({
  className: f,
  children: g,
  ...h
}, $) => e.jsxs($i, {
  children: [e.jsx(Os, {}), e.jsxs(Es, {
    ref: $,
    className: u("fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg", f),
    ...h,
    children: [g, e.jsxs(Kn, {
      className: "absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground",
      children: [e.jsx(Se, {
        className: "h-4 w-4"
      }), e.jsx("span", {
        className: "sr-only",
        children: "Close"
      })]
    })]
  })]
}));
Bi.displayName = Es.displayName;
const Fi = i.forwardRef(({
  className: f,
  ...g
}, h) => e.jsx(As, {
  ref: h,
  className: u("text-lg font-semibold leading-none tracking-tight", f),
  ...g
}));
Fi.displayName = As.displayName;
const Ui = i.forwardRef(({
  className: f,
  ...g
}, h) => e.jsx(qs, {
  ref: h,
  className: u("text-sm text-muted-foreground", f),
  ...g
}));
Ui.displayName = qs.displayName;

function Ki({
  isOpen: f,
  onClose: g,
  onViewOrder: h
}) {
  const $ = Rs(),
    [B, oe] = i.useState([]),
    [Z, F] = i.useState(!1),
    [ve, z] = i.useState("Shipping"),
    [Q, ee] = i.useState(""),
    [ce, qe] = i.useState(null),
    [Ue, de] = i.useState(null),
    [Ie, te] = i.useState(null),
    [Re, xe] = i.useState(new Date().toLocaleDateString("en-CA"));
  i.useEffect(() => {
    f && Ke()
  }, [f, Re]);
  const Ke = async () => {
    F(!0);
    try {
      const y = await q.get("/api/orders?shipping_status=Shipping&limit=100&sort_by=date&sort_order=desc"),
        P = y.data.items || y.data,
        [N, b, S] = Re.split("-"),
        O = await q.get(`/api/orders?shipping_status=Delivered&delivered_year=${N}&delivered_month=${b}&delivered_day=${S}&limit=100&sort_by=date&sort_order=desc`),
        ke = O.data.items || O.data;
      oe([...P, ...ke])
    } catch (y) {
      console.error("Error fetching shipping orders:", y), ht.error("Không thể tải danh sách giao hàng.")
    } finally {
      F(!1)
    }
  }, De = async (y, P) => {
    try {
      await q.patch(`/api/orders/${y}/shipping-status`, {
        shipping_status: P
      }), P === null ? (oe(N => N.filter(b => b.id !== y)), te(null), ht.success("Đã gỡ đơn khỏi danh sách giao hàng.")) : (oe(N => N.map(b => b.id === y ? {
        ...b,
        shipping_status: P
      } : b)), ht.success(P === "Delivered" ? "Đã giao hàng thành công!" : "Đã hoàn tác trạng thái.")), $.invalidateQueries(["shippingSummary"])
    } catch (N) {
      console.error("Error updating shipping status:", N), ht.error("Không thể cập nhật trạng thái.")
    }
  }, Me = async (y, P) => {
    const N = ht.loading("Đang cập nhật...");
    try {
      const b = await q.patch(`/api/order-details/${y.id}/shipped-quantity`, {
          shipped_quantity: P
        }),
        {
          order_shipping_status: S
        } = b.data;
      oe(O => O.map(ke => {
        if (ke.details?.some(re => re.id === y.id)) {
          const re = ke.details.map(Ge => Ge.id === y.id ? {
            ...Ge,
            shipped_quantity: P
          } : Ge);
          return {
            ...ke,
            details: re,
            shipping_status: S
          }
        }
        return ke
      })), de(null), $.invalidateQueries(["shippingSummary"]), ht.success("Cập nhật số lượng thành công!", {
        id: N
      })
    } catch (b) {
      console.error("Error updating item shipped qty:", b), ht.error("Không thể cập nhật số lượng.", {
        id: N
      })
    }
  }, ae = B.filter(y => (ve === "any" || y.shipping_status === ve) && (y.display_id?.toLowerCase().includes(Q.toLowerCase()) || y.partner_name?.toLowerCase().includes(Q.toLowerCase()) || y.shipping_phone?.includes(Q)));
  return e.jsxs(Be, {
    children: [
      e.jsx(T, {
        children: f && e.jsxs("div", {
          className: "fixed inset-0 z-[500000] flex justify-end font-sans",
          children: [
            e.jsx(m.div, {
              initial: { opacity: 0 },
              animate: { opacity: 1 },
              exit: { opacity: 0 },
              onClick: g,
              className: "absolute inset-0 bg-slate-950/40 dark:bg-black/60 backdrop-blur-sm"
            }),
            e.jsxs(m.div, {
              initial: { x: "100%", opacity: 0 },
              animate: { x: 0, opacity: 1 },
              exit: { x: "100%", opacity: 0 },
              transition: { type: "spring", damping: 25, stiffness: 200 },
              className: "relative w-[650px] h-full bg-card backdrop-blur-3xl flex flex-col border-l border-border shadow-2xl text-foreground",
              children: [
                e.jsxs("div", {
                  className: "p-6 border-b border-border bg-card flex justify-between items-center relative overflow-hidden shrink-0",
                  children: [
                    e.jsxs("div", {
                      className: "flex items-center gap-3.5 relative z-10",
                      children: [
                        e.jsx("div", {
                          className: "w-11 h-11 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20 shadow-[0_0_15px_rgba(var(--primary-rgb),0.1)]",
                          children: e.jsx(lt, { size: 20, className: "text-primary" })
                        }),
                        e.jsxs("div", {
                          children: [
                            e.jsx("h3", {
                              className: "font-black text-lg text-foreground uppercase tracking-wider leading-tight",
                              children: "Giao Hàng"
                            }),
                            e.jsxs("div", {
                              className: "flex gap-2.5 mt-2",
                              children: [
                                e.jsxs("span", {
                                  className: "text-[9px] font-black text-primary bg-primary/10 border border-primary/20 px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5 shadow-[0_0_10px_rgba(var(--primary-rgb),0.1)]",
                                  children: [e.jsx("span", { className: "w-1.5 h-1.5 rounded-full bg-primary" }), `${B.filter(y => y.shipping_status === "Shipping").length} ĐANG CHẠY`]
                                }),
                                e.jsxs("span", {
                                  className: "text-[9px] font-black text-muted-foreground bg-background/50 border border-border px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5",
                                  children: [e.jsx("span", { className: "w-1.5 h-1.5 rounded-full bg-muted-foreground" }), `${B.filter(y => y.shipping_status === "Delivered").length} HOÀN TẤT`]
                                })
                              ]
                            })
                          ]
                        })
                      ]
                    }),
                    e.jsx("button", {
                      onClick: g,
                      className: "w-9 h-9 flex items-center justify-center rounded-xl bg-background hover:bg-primary/10 text-muted-foreground hover:text-primary border border-border transition-all duration-300 hover:rotate-90",
                      children: e.jsx(Se, { size: 16, strokeWidth: 3 })
                    })
                  ]
                }),
                e.jsxs("div", {
                  className: "p-6 space-y-4 bg-card border-b border-border",
                  children: [
                    e.jsxs("div", {
                      className: "flex gap-3.5",
                      children: [
                        e.jsxs("div", {
                          className: "relative flex-1 group",
                          children: [
                            e.jsx(qr, { className: "absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors", size: 18 }),
                            e.jsx("input", {
                              type: "text",
                              placeholder: "Tìm mã đơn, tên khách...",
                              className: "w-full h-11 pl-11 pr-4 bg-background border border-border focus:border-primary rounded-xl text-sm font-semibold transition-all outline-none text-foreground focus:ring-1 focus:ring-primary placeholder-muted-foreground/50",
                              value: Q,
                              onChange: y => ee(y.target.value)
                            })
                          ]
                        }),
                        e.jsxs("div", {
                          className: "relative w-40 group",
                          children: [
                            e.jsx(Zn, { className: "absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors pointer-events-none", size: 16 }),
                            e.jsx("input", {
                              type: "date",
                              className: "w-full h-11 pl-9 pr-2 bg-background border border-border focus:border-primary rounded-xl text-xs font-semibold transition-all outline-none text-foreground focus:ring-1 focus:ring-primary appearance-none uppercase",
                              value: Re,
                              onChange: y => xe(y.target.value)
                            })
                          ]
                        })
                      ]
                    }),
                    e.jsx("div", {
                      className: "flex gap-3.5",
                      children: [{ label: "Đang giao", value: "Shipping", icon: ia }, { label: "Đã giao", value: "Delivered", icon: Ma }].map(y => {
                        const isSelected = ve === y.value;
                        return e.jsxs("button", {
                          onClick: () => z(y.value),
                          className: u(
                            "flex-1 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all duration-200 flex items-center justify-center gap-2 border active:scale-98 cursor-pointer",
                            isSelected 
                              ? "bg-primary/10 border-primary/20 text-primary shadow-[0_0_15px_rgba(var(--primary-rgb),0.1)]" 
                              : "bg-background border-border text-muted-foreground hover:text-foreground hover:bg-background/80"
                          ),
                          children: [e.jsx(y.icon, { size: 14, strokeWidth: 3 }), e.jsx("span", { children: y.label })]
                        }, y.value);
                      })
                    })
                  ]
                }),
                e.jsx("div", {
                  className: "flex-1 overflow-y-auto no-scrollbar p-5 space-y-4 bg-transparent",
                  children: Z ? e.jsxs("div", {
                    className: "flex flex-col items-center justify-center py-20 opacity-50",
                    children: [
                      e.jsx("div", { className: "w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" }),
                      e.jsx("span", { className: "font-black text-[10px] uppercase text-primary tracking-[0.2em]", children: "Đang tải đơn hàng..." })
                    ]
                  }) : ae.length === 0 ? e.jsxs("div", {
                    className: "text-center py-20 text-muted-foreground opacity-60",
                    children: [
                      e.jsx(lt, { size: 48, className: "mx-auto mb-4 opacity-10" }),
                      e.jsx("p", { className: "font-black uppercase text-[10px] tracking-[0.25em]", children: "Không tìm thấy đơn nào" })
                    ]
                  }) : ae.map((y, P) => e.jsxs(m.div, {
                    initial: { opacity: 0, y: 10 },
                    animate: { opacity: 1, y: 0 },
                    transition: { delay: P * .05 },
                    className: u(
                      "p-4 rounded-2xl border transition-all duration-300 group flex flex-col relative overflow-hidden bg-background/50 border-border/80 hover:border-primary/30 hover:bg-background hover:shadow-md",
                      y.shipping_status === "Delivered" && "hover:border-blue-550/30"
                    ),
                    children: [
                      e.jsxs("div", {
                        className: "flex items-center justify-between w-full mb-3",
                        children: [
                          e.jsxs("div", {
                            className: "flex items-center gap-3 flex-1 min-w-0",
                            children: [
                              e.jsx("div", {
                                className: u("w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-inner", y.shipping_status === "Delivered" ? "bg-blue-500/10 text-blue-555" : "bg-primary/10 text-primary"),
                                children: y.shipping_status === "Delivered" ? e.jsx(Ma, { size: 14, strokeWidth: 2.5 }) : e.jsx(lt, { size: 14, strokeWidth: 2.5 })
                              }),
                              e.jsxs("div", {
                                className: "min-w-0",
                                children: [
                                  e.jsxs("div", {
                                    className: u("text-[13px] font-black uppercase tracking-wider leading-none mb-1.5 flex items-center gap-1", y.shipping_status === "Delivered" ? "text-blue-600" : "text-primary"),
                                    children: ["#", y.display_id]
                                  }),
                                  e.jsxs("div", {
                                    className: "flex items-center gap-2.5",
                                    children: [
                                      e.jsx("span", {
                                        className: "text-[9px] font-black text-muted-foreground tabular-nums uppercase tracking-wide",
                                        children: y.shipping_status === "Delivered" ? y.delivery_date ? Fe(y.delivery_date) : Fe(y.date) : Fe(y.date)
                                      }),
                                      e.jsx("div", {
                                        className: u("text-[8px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider border", y.shipping_status === "Delivered" ? "bg-blue-500/10 text-blue-600 border-blue-500/20" : "bg-primary/10 text-primary border-primary/20"),
                                        children: y.partner_name || "Khách lẻ"
                                      })
                                    ]
                                  })
                                ]
                              })
                            ]
                          }),
                          e.jsxs("div", {
                            className: "flex items-center gap-3.5 shrink-0",
                            children: [
                              e.jsx("div", {
                                className: u("text-[16px] font-black tracking-tight tabular-nums text-right leading-none text-foreground", y.shipping_status === "Delivered" ? "text-blue-600" : "text-primary"),
                                children: I(y.total_amount)
                              }),
                              e.jsx("button", {
                                onClick: N => { N.stopPropagation(); te(y.id); },
                                className: "p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 hover:text-rose-700 rounded-lg transition-all border border-rose-500/25 active:scale-95 duration-200 cursor-pointer",
                                title: "Hủy giao hàng",
                                children: e.jsx(Se, { size: 10, strokeWidth: 3 })
                              })
                            ]
                          })
                        ]
                      }),
                      e.jsxs("div", {
                        className: "flex gap-2 items-center mb-4 bg-background p-2.5 rounded-xl border border-border",
                        children: [
                          e.jsxs("div", {
                            className: "flex items-center gap-2 flex-1 min-w-0",
                            children: [
                              e.jsx(Ha, { size: 11, className: "text-primary shrink-0" }),
                              e.jsx("span", {
                                className: "text-[10px] font-semibold text-muted-foreground truncate",
                                children: y.shipping_address || e.jsx("span", { className: "italic opacity-30", children: "N/A" })
                              })
                            ]
                          }),
                          e.jsx("div", { className: "w-px h-3.5 bg-border shrink-0" }),
                          e.jsxs("div", {
                            className: "flex items-center gap-2 shrink-0",
                            children: [
                              e.jsx(na, { size: 11, className: "text-blue-500 shrink-0" }),
                              e.jsx("span", {
                                className: "text-[10px] font-black text-foreground tracking-wide",
                                children: y.shipping_phone || e.jsx("span", { className: "italic opacity-30", children: "N/A" })
                              })
                            ]
                          })
                        ]
                      }),
                      e.jsxs("div", {
                        className: "flex gap-2",
                        children: [
                          e.jsxs("button", {
                            onClick: () => qe(y.id),
                            className: "flex-1 py-2.5 bg-background hover:bg-primary/10 text-muted-foreground hover:text-primary rounded-xl transition-all border border-border text-[9px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 active:scale-95 duration-200 cursor-pointer",
                            children: [e.jsx(ei, { size: 10 }), " Bốc hàng"]
                          }),
                          e.jsx("button", {
                            onClick: () => h(y),
                            className: "w-9 h-9 bg-background hover:bg-primary/10 text-muted-foreground hover:text-primary rounded-xl transition-all border border-border flex items-center justify-center active:scale-95 duration-200 cursor-pointer",
                            children: e.jsx(ti, { size: 10 })
                          }),
                          y.shipping_status === "Shipping" && e.jsxs("button", {
                            onClick: () => De(y.id, "Delivered"),
                            className: "flex-1 py-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 hover:text-emerald-700 border border-emerald-500/20 hover:border-emerald-500/40 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 active:scale-95 duration-200 shadow-sm cursor-pointer",
                            children: [e.jsx(Ma, { size: 10, strokeWidth: 3 }), " XONG"]
                          }),
                          y.shipping_status === "Delivered" && e.jsxs("button", {
                            onClick: () => De(y.id, "Shipping"),
                            className: "flex-1 py-2.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 hover:text-amber-700 border border-amber-500/20 hover:border-amber-500/40 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 active:scale-95 duration-200 shadow-sm cursor-pointer",
                            children: [e.jsx(Rt, { size: 10 }), " HOÀN TÁC"]
                          })
                        ]
                      })
                    ]
                  }, y.id))
                })
              ]
            })
          ]
        })
      }),
      e.jsx(T, {
        children: ce && e.jsxs("div", {
          className: "fixed inset-0 z-[600000] flex items-center justify-center p-4 bg-slate-950/40 dark:bg-black/60 overflow-y-auto",
          children: [
            e.jsx(m.div, {
              initial: { opacity: 0 },
              animate: { opacity: 1 },
              exit: { opacity: 0 },
              onClick: () => qe(null),
              className: "absolute inset-0 bg-slate-950/40 dark:bg-black/60 backdrop-blur-sm"
            }),
            e.jsx(m.div, {
              initial: { scale: .95, opacity: 0, y: 20 },
              animate: { scale: 1, opacity: 1, y: 0 },
              exit: { scale: .95, opacity: 0, y: 20 },
              className: "relative w-full max-w-xl bg-card border border-border rounded-[2rem] overflow-hidden shadow-2xl flex flex-col font-sans text-foreground",
              children: (() => {
                const y = B.find(N => N.id === ce);
                if (!y) return null;
                const P = Math.round(y.details?.reduce((N, b) => N + (b.shipped_quantity || 0), 0) / y.details?.reduce((N, b) => N + b.quantity, 0) * 100);
                return e.jsxs(e.Fragment, {
                  children: [
                    e.jsxs("div", {
                      className: "p-6 border-b border-border flex justify-between items-center bg-card",
                      children: [
                        e.jsxs("div", {
                          children: [
                            e.jsxs("h4", { className: "text-lg font-black text-foreground uppercase tracking-wider", children: ["📦 Bốc hàng #", y.display_id] }),
                            e.jsx("p", { className: "text-[10px] font-bold text-muted-foreground mt-1 uppercase tracking-widest", children: y.partner_name || "Khách lẻ" })
                          ]
                        }),
                        e.jsxs("div", {
                          className: "text-right flex flex-col items-end",
                          children: [
                            e.jsx("div", { className: "text-[8px] font-black text-primary uppercase tracking-widest mb-1.5", children: "Tiến độ bốc hàng" }),
                            e.jsxs("div", {
                              className: "text-2xl font-black text-primary flex items-baseline gap-0.5 leading-none",
                              children: [P, e.jsx("span", { className: "text-xs text-primary/60 font-bold", children: "%" })]
                            })
                          ]
                        })
                      ]
                    }),
                    e.jsx("div", {
                      className: "w-full h-1 bg-background overflow-hidden",
                      children: e.jsx("div", {
                        className: "h-full bg-gradient-to-r from-emerald-500 to-teal-400 shadow-[0_0_8px_rgba(16,185,129,0.5)] transition-all duration-500 ease-out",
                        style: { width: `${P}%` }
                      })
                    }),
                    e.jsx("div", {
                      className: "max-h-[50vh] overflow-y-auto p-6 space-y-3.5 no-scrollbar bg-card/50",
                      children: y.details?.map(N => {
                        const b = (N.shipped_quantity || 0) >= N.quantity;
                        return e.jsxs("div", {
                          className: u(
                            "flex items-center gap-4 p-4 rounded-2xl border transition-all duration-300 bg-background/50 border-border/80 shadow-sm",
                            b ? "bg-emerald-500/5 border-emerald-500/20 opacity-60" : "hover:bg-background hover:border-border"
                          ),
                          children: [
                            e.jsxs("div", {
                              className: "flex-1 min-w-0",
                              children: [
                                e.jsx("div", { className: u("text-base font-black uppercase tracking-tight text-foreground", b && "line-through text-muted-foreground/45 decoration-emerald-500/50"), children: N.product_name }),
                                e.jsxs("div", {
                                  className: "text-xs font-bold text-muted-foreground mt-1.5 flex items-center gap-1",
                                  children: ["Đã bốc: ", e.jsx("span", { className: "text-foreground font-black", children: N.shipped_quantity || 0 }), " / ", N.quantity, " ", N.unit]
                                })
                              ]
                            }),
                            e.jsxs("div", {
                              className: "flex items-center gap-2.5",
                              children: [
                                Ue?.detailId === N.id ? e.jsx("input", {
                                  type: "number",
                                  autoFocus: !0,
                                  className: "w-20 h-10 bg-background border-2 border-primary rounded-xl text-lg font-black text-center text-foreground outline-none focus:ring-1 focus:ring-primary",
                                  value: Ue.value,
                                  onChange: S => de({ ...Ue, value: S.target.value }),
                                  onBlur: () => Me(N, parseFloat(Ue.value) || 0),
                                  onKeyDown: S => S.key === "Enter" && Me(N, parseFloat(Ue.value) || 0)
                                }) : e.jsx("button", {
                                  onClick: () => de({ detailId: N.id, value: N.shipped_quantity || 0 }),
                                  className: "p-3 bg-background hover:bg-primary/10 rounded-xl text-muted-foreground hover:text-primary transition-all border border-border active:scale-95 cursor-pointer",
                                  children: e.jsx(qr, { size: 16 })
                                }),
                                e.jsx("button", {
                                  onClick: () => Me(N, b ? 0 : N.quantity),
                                  className: u(
                                    "w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-200 active:scale-95 shadow-md cursor-pointer",
                                    b ? "bg-primary text-white shadow-primary/20" : "bg-background border border-border text-muted-foreground/30 hover:border-primary/50 hover:text-primary"
                                  ),
                                  children: e.jsx(Ma, { size: 20 })
                                })
                              ]
                            })
                          ]
                        }, N.id);
                      })
                    }),
                    e.jsx("div", {
                      className: "p-6 border-t border-border bg-card shrink-0",
                      children: e.jsx("button", {
                        onClick: () => qe(null),
                        className: "w-full h-12 bg-primary hover:bg-primary-hover text-white rounded-xl font-black text-xs uppercase tracking-[0.2em] shadow-lg transition-all active:scale-98 duration-200 cursor-pointer",
                        children: "Đóng danh sách"
                      })
                    })
                  ]
                });
              })()
            })
          ]
        })
      }),
      e.jsx(T, {
        children: Ie && e.jsxs("div", {
          className: "fixed inset-0 z-[600000] flex items-center justify-center p-4 bg-slate-950/40 dark:bg-black/60 overflow-y-auto",
          children: [
            e.jsx(m.div, {
              initial: { opacity: 0 },
              animate: { opacity: 1 },
              exit: { opacity: 0 },
              onClick: () => te(null),
              className: "absolute inset-0 bg-slate-950/40 dark:bg-black/60 backdrop-blur-sm"
            }),
            e.jsxs(m.div, {
              initial: { scale: .9, opacity: 0, y: 20 },
              animate: { scale: 1, opacity: 1, y: 0 },
              exit: { scale: .9, opacity: 0, y: 20 },
              className: "relative w-full max-w-sm bg-card rounded-[32px] p-8 shadow-2xl overflow-hidden border border-border",
              children: [
                e.jsx("div", { className: "absolute top-0 left-0 w-full h-2 bg-rose-500" }),
                e.jsx("div", {
                  className: "w-16 h-16 bg-rose-50 dark:bg-rose-900/20 rounded-2xl flex items-center justify-center text-rose-500 mb-6 mx-auto",
                  children: e.jsx(lt, { size: 32 })
                }),
                e.jsx("h3", {
                  className: "text-xl font-black text-foreground text-center uppercase tracking-tight mb-2",
                  children: "Gỡ danh sách ship?"
                }),
                e.jsx("p", {
                  className: "text-sm text-muted-foreground text-center font-medium leading-relaxed mb-8",
                  children: "Bạn có chắc chắn muốn gỡ đơn hàng này không? Đơn hàng vẫn được lưu lại trong lịch sử bán hàng."
                }),
                e.jsxs("div", {
                  className: "flex gap-3",
                  children: [
                    e.jsx("button", {
                      onClick: () => te(null),
                      className: "flex-1 h-12 bg-transparent text-muted-foreground rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-background/80 transition-all",
                      children: "Bỏ qua"
                    }),
                    e.jsx("button", {
                      onClick: () => De(Ie, null),
                      className: "flex-1 h-12 bg-rose-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-rose-600 shadow-lg shadow-rose-500/20 transition-all",
                      children: "Gỡ ngay"
                    })
                  ]
                })
              ]
            })
          ]
        })
      })
    ]
  });
}
// Inline TTS helpers removed, using functions imported from utils.js

function ol({
  onToggleTheme: f,
  currentTheme: g
}) {
  const {
    data: h,
    isLoading: $
  } = yi(), {
    data: B,
    isLoading: oe
  } = wi(), {
    data: Z
  } = vi(), F = Rs(), ve = Z?.total || 0, z = h || [], Q = B || [];

  const getActiveTabField = (field, defaultValue) => {
    const savedTabs = localStorage.getItem("pos_order_tabs");
    const savedActive = localStorage.getItem("pos_active_tab_id");
    if (savedTabs && savedActive) {
      try {
        const tabs = JSON.parse(savedTabs);
        const activeId = JSON.parse(savedActive);
        const activeTab = tabs.find(t => t.id === activeId);
        if (activeTab && activeTab[field] !== undefined) return activeTab[field];
      } catch {}
    }
    return defaultValue;
  };

  const [ee, ce] = i.useState(""), [qe, Ue] = i.useState(!0), [de, Ie] = i.useState("add"), [te, Re] = i.useState(() => {
    const saved = localStorage.getItem("pos_order_tabs");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (err) {
        console.error("Failed to parse saved POS tabs:", err);
      }
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
  }), [xe, Ke] = i.useState(() => {
    const saved = localStorage.getItem("pos_active_tab_id");
    return saved ? JSON.parse(saved) : 1;
  }), [De, Me] = i.useState(() => {
    const saved = localStorage.getItem("pos_pinned_scan_tab_id");
    return saved ? JSON.parse(saved) : 1;
  }), ae = i.useRef(""), y = i.useRef(0), P = i.useRef(null), N = i.useRef({}), [b, S] = i.useState(() => {
    return getActiveTabField("cart", []);
  }), [O, ke] = i.useState(() => {
    const t = {
        color1: "#ffffff",
        color2: "#f8fafc",
        opacity: .8,
        isGradient: !0,
        blur: 20,
        radius: 2.5,
        shadow: 20,
        accent: "#10b981",
        headerColor: "#ffffff",
        headerOpacity: .4,
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
      }
    } catch {
      return t
    }
  }), [re, Ge] = i.useState(!1), la = i.useRef(null), w = i.useRef(null), be = i.useRef(null), [k, ze] = i.useState("themes"), [K, ot] = i.useState([]), [Qe, W] = i.useState(() => localStorage.getItem("pos_gpu_disabled") === "true");

  const [C, M] = i.useState(() => localStorage.getItem("pos_tts_mode") || "female");
  const [oa, Ws] = i.useState(() => localStorage.getItem("pos_tts_read_product") !== "false");
  const [Rr, Ls] = i.useState(() => localStorage.getItem("pos_tts_read_qty") !== "false");
  const [ca, Hs] = i.useState(() => localStorage.getItem("pos_tts_read_total") !== "false");
  const [Ba, $s] = i.useState(() => localStorage.getItem("pos_tts_read_thanks") !== "false");
  const Mt = () => {
    if (window.currentTtsSequence) {
      try { window.currentTtsSequence.audio1.pause(); } catch (e) {}
      try { window.currentTtsSequence.audio2.pause(); } catch (e) {}
    }
  };
  const Ka = (t) => {
    M(t);
    localStorage.setItem("pos_tts_mode", t);
    Mt();
    if (t === "female") {
      setSelectedVoice("edge-vi-female");
      localStorage.setItem("pos_selected_voice", "edge-vi-female");
    } else if (t === "male") {
      setSelectedVoice("edge-vi-male");
      localStorage.setItem("pos_selected_voice", "edge-vi-male");
    }
  };

  // Reconstructed July 6th voice settings states
  const [selectedVoice, setSelectedVoice] = i.useState(() => {
    const saved = localStorage.getItem("pos_selected_voice") || "edge-vi-female";
    if (saved === "native-vi" || !saved.startsWith("edge") && saved !== "google") {
      localStorage.setItem("pos_selected_voice", "edge-vi-female");
      return "edge-vi-female";
    }
    return saved;
  });
  i.useEffect(() => {
    precacheCommonTTS();
  }, []);
  i.useEffect(() => {
    if (z && z.length > 0) {
      precacheCommonTTS(z);
    }
  }, [z]);
  const handleVoiceChange = (e) => {
    const val = e.target.value;
    setSelectedVoice(val);
    localStorage.setItem("pos_selected_voice", val);
    setTimeout(() => precacheCommonTTS(z), 100);
  };
  const [speechRate, setSpeechRate] = i.useState(() => parseFloat(localStorage.getItem("pos_speech_rate") || "1.4"));
  const handleSpeechRateChange = (e) => {
    const val = parseFloat(e.target.value);
    setSpeechRate(val);
    localStorage.setItem("pos_speech_rate", val.toString());
    setTimeout(() => precacheCommonTTS(z), 100);
  };
  const [showVoiceSettings, setShowVoiceSettings] = i.useState(false);
  const [settingsVoiceTab, setSettingsVoiceTab] = i.useState("general");
  const voiceSettingsRef = i.useRef(null);
  const cartSpeechTimeoutRef = i.useRef(null);
  const lastSpokenProductIdRef = N;
  i.useEffect(() => {
    const handleClickOutside = (e) => {
      if (voiceSettingsRef.current && !voiceSettingsRef.current.contains(e.target)) {
        setShowVoiceSettings(false);
      }
    };
    if (showVoiceSettings) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showVoiceSettings]);
  const [currencyTemplate, setCurrencyTemplate] = i.useState(() => localStorage.getItem("pos_tts_currency_template") || "số tiền của quý khách là {amount} đồng");
  const [currencyPartnerTemplate, setCurrencyPartnerTemplate] = i.useState(() => localStorage.getItem("pos_tts_currency_partner_template") || "số tiền của {partner} là {amount} đồng");
  const [thankyouTemplate, setThankyouTemplate] = i.useState(() => localStorage.getItem("pos_tts_thankyou_template") || "Cảm ơn quý khách đã chọn Sáu Quý");
  const [thankyouPartnerTemplate, setThankyouPartnerTemplate] = i.useState(() => localStorage.getItem("pos_tts_thankyou_partner_template") || "Cảm ơn {partner} đã chọn Sáu Quý");
  const [enableThankyou, setEnableThankyou] = i.useState(() => localStorage.getItem("pos_tts_enable_thankyou") !== "false");
  const [disablePartnerCurrency, setDisablePartnerCurrency] = i.useState(() => localStorage.getItem("pos_tts_disable_partner_template") === "true");
  const [disablePartnerThankyou, setDisablePartnerThankyou] = i.useState(() => localStorage.getItem("pos_tts_disable_partner_thankyou") === "true");
  const [transferTemplate, setTransferTemplate] = i.useState(() => localStorage.getItem("pos_tts_transfer_template") || "số tiền cần chuyển khoản là {amount} đồng");
  const [transferPartnerTemplate, setTransferPartnerTemplate] = i.useState(() => localStorage.getItem("pos_tts_transfer_partner_template") || "số tiền cần chuyển khoản của {partner} là {amount} đồng");
  const [disablePartnerTransfer, setDisablePartnerTransfer] = i.useState(() => localStorage.getItem("pos_tts_disable_partner_transfer") === "true");
  const [enableCartAdditionSpeech, setEnableCartAdditionSpeech] = i.useState(() => localStorage.getItem("pos_tts_enable_cart_addition") !== "false");
  const handleEnableCartAdditionSpeechChange = (e) => {
    const val = e.target.checked;
    setEnableCartAdditionSpeech(val);
    localStorage.setItem("pos_tts_enable_cart_addition", val ? "true" : "false");
  };
  const [enableCartProductNameSpeech, setEnableCartProductNameSpeech] = i.useState(() => localStorage.getItem("pos_tts_enable_cart_product_name") !== "false");
  const handleEnableCartProductNameSpeechChange = (e) => {
    const val = e.target.checked;
    setEnableCartProductNameSpeech(val);
    localStorage.setItem("pos_tts_enable_cart_product_name", val ? "true" : "false");
  };
  const [cartSpeechOrder, setCartSpeechOrder] = i.useState(() => localStorage.getItem("pos_tts_cart_speech_order") || "name_first");
  const handleCartSpeechOrderChange = (e) => {
    const val = e.target.value;
    setCartSpeechOrder(val);
    localStorage.setItem("pos_tts_cart_speech_order", val);
  };
  const handleDisablePartnerCurrencyChange = (e) => {
    const val = e.target.checked;
    setDisablePartnerCurrency(val);
    localStorage.setItem("pos_tts_disable_partner_template", val ? "true" : "false");
  };
  const handleDisablePartnerThankyouChange = (e) => {
    const val = e.target.checked;
    setDisablePartnerThankyou(val);
    localStorage.setItem("pos_tts_disable_partner_thankyou", val ? "true" : "false");
  };
  const handleDisablePartnerTransferChange = (e) => {
    const val = e.target.checked;
    setDisablePartnerTransfer(val);
    localStorage.setItem("pos_tts_disable_partner_transfer", val ? "true" : "false");
  };
  const handleCurrencyTemplateChange = (e) => {
    const val = e.target.value;
    setCurrencyTemplate(val);
    localStorage.setItem("pos_tts_currency_template", val);
  };
  const handleCurrencyPartnerTemplateChange = (e) => {
    const val = e.target.value;
    setCurrencyPartnerTemplate(val);
    localStorage.setItem("pos_tts_currency_partner_template", val);
  };
  const handleThankyouTemplateChange = (e) => {
    const val = e.target.value;
    setThankyouTemplate(val);
    localStorage.setItem("pos_tts_thankyou_template", val);
    setTimeout(() => precacheCommonTTS(), 100);
  };
  const handleThankyouPartnerTemplateChange = (e) => {
    const val = e.target.value;
    setThankyouPartnerTemplate(val);
    localStorage.setItem("pos_tts_thankyou_partner_template", val);
    setTimeout(() => precacheCommonTTS(), 100);
  };
  const handleTransferTemplateChange = (e) => {
    const val = e.target.value;
    setTransferTemplate(val);
    localStorage.setItem("pos_tts_transfer_template", val);
  };
  const handleTransferPartnerTemplateChange = (e) => {
    const val = e.target.value;
    setTransferPartnerTemplate(val);
    localStorage.setItem("pos_tts_transfer_partner_template", val);
  };
  const handleEnableThankyouChange = (e) => {
    const val = e.target.checked;
    setEnableThankyou(val);
    localStorage.setItem("pos_tts_enable_thankyou", val ? "true" : "false");
  };

  const [p, L] = i.useState(() => getActiveTabField("selectedPartner", null)), [Oe, Ga] = i.useState(null), [We, Qa] = i.useState(null), [se, gt] = i.useState("debt"), [da, Va] = i.useState(!1), [Or, Wr] = i.useState(!1), [yt, je] = i.useState(""), [Xa, Pe] = i.useState(!1), [pe, Ve] = i.useState(() => getActiveTabField("note", "")), [Le, J] = i.useState(() => getActiveTabField("amountPaid", 0)), [ne, Xe] = i.useState(() => getActiveTabField("cashGiven", 0)), [D, me] = i.useState(() => getActiveTabField("paymentMethod", (localStorage.getItem("unified_pos_mode") || "Retail") === "Wholesale" ? "Debt" : "Cash")), [pa, ua] = i.useState(null), [wt, Lr] = i.useState(null), [tt, Hr] = i.useState(!1), [H, xa] = i.useState(null), [ge, Ja] = i.useState(null), [Ya, ma] = i.useState(null), [He, Za] = i.useState(0);
  i.useEffect(() => {
    (async () => {
      try {
        const a = await q.get("/api/orders?limit=1&page=1&type=Sale");
        a.data.items && a.data.items.length > 0 && Lr(a.data.items[0])
      } catch (a) {
        console.error("Failed to fetch last order:", a)
      }
    })()
  }, []);

  // Sync changes in active states back to te state
  i.useEffect(() => {
    Re(prevTabs => {
      const activeTab = prevTabs.find(tab => tab.id === xe);
      if (activeTab && (
        activeTab.cart !== b ||
        activeTab.selectedPartner !== p ||
        activeTab.note !== pe ||
        activeTab.amountPaid !== Le ||
        activeTab.cashGiven !== ne ||
        activeTab.paymentMethod !== D
      )) {
        return prevTabs.map(tab => {
          if (tab.id === xe) {
            return {
              ...tab,
              cart: b,
              selectedPartner: p,
              note: pe,
              amountPaid: Le,
              cashGiven: ne,
              paymentMethod: D
            };
          }
          return tab;
        });
      }
      return prevTabs;
    });
  }, [xe, b, p, pe, Le, ne, D]);

  // Save te, xe, De to localStorage when they change
  i.useEffect(() => {
    localStorage.setItem("pos_order_tabs", JSON.stringify(te));
  }, [te]);

  i.useEffect(() => {
    localStorage.setItem("pos_active_tab_id", JSON.stringify(xe));
  }, [xe]);

  i.useEffect(() => {
    localStorage.setItem("pos_pinned_scan_tab_id", JSON.stringify(De));
  }, [De]);

  // Sync state across multiple browser tabs in real time
  i.useEffect(() => {
    const handleStorageChange = (e) => {
      if (!e.newValue) return;
      if (e.key === "pos_order_tabs") {
        try {
          const newTabs = JSON.parse(e.newValue);
          Re(newTabs);
          const activeTab = newTabs.find(t => t.id === xe);
          if (activeTab) {
            if (JSON.stringify(activeTab.cart) !== JSON.stringify(b)) {
              S(activeTab.cart || []);
            }
            if (activeTab.selectedPartner?.id !== p?.id) {
              L(activeTab.selectedPartner || null);
            }
            if (activeTab.note !== pe) {
              Ve(activeTab.note || "");
            }
            if (activeTab.amountPaid !== Le) {
              J(activeTab.amountPaid || 0);
            }
            if (activeTab.cashGiven !== ne) {
              Xe(activeTab.cashGiven || 0);
            }
            if (activeTab.paymentMethod !== D) {
              me(activeTab.paymentMethod || "Cash");
            }
          }
        } catch (err) {
          console.error("Error syncing storage across tabs:", err);
        }
      } else if (e.key === "pos_active_tab_id") {
        try {
          const newActiveId = JSON.parse(e.newValue);
          if (newActiveId !== xe) {
            Ke(newActiveId);
            const savedTabs = localStorage.getItem("pos_order_tabs");
            if (savedTabs) {
              const tabs = JSON.parse(savedTabs);
              const activeTab = tabs.find(t => t.id === newActiveId);
              if (activeTab) {
                S(activeTab.cart || []);
                L(activeTab.selectedPartner || null);
                Ve(activeTab.note || "");
                J(activeTab.amountPaid || 0);
                Xe(activeTab.cashGiven || 0);
                me(activeTab.paymentMethod || "Cash");
              }
            }
          }
        } catch {}
      } else if (e.key === "pos_pinned_scan_tab_id") {
        try {
          const newPinnedId = JSON.parse(e.newValue);
          if (newPinnedId !== De) {
            Me(newPinnedId);
          }
        } catch {}
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [xe, b, p, pe, Le, ne, D, De]);
  const vt = Gn(),
    [Ne, er] = i.useState(() => {
      const t = localStorage.getItem("held_invoices");
      return t ? JSON.parse(t) : []
    }),
    [Wt, ct] = i.useState(!1),
    [Lt, $r] = i.useState(!1),
    [ie, Bs] = i.useState(() => {
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
        }
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
        }
      }
    }),
    Br = (t, a) => {
      Bs(r => {
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
        return localStorage.setItem("pos_bubble_positions", JSON.stringify(l)), l
      })
    },
    tr = (t, a) => t.map(r => r.id === a ? {
      ...r,
      cart: b,
      selectedPartner: p,
      note: pe,
      amountPaid: Le,
      cashGiven: ne,
      paymentMethod: D
    } : r),
    Fs = t => {
      t !== xe && Re(a => {
        const r = tr(a, xe),
          s = r.find(n => n.id === t);
        return s && (S(s.cart), L(s.selectedPartner), Ve(s.note), J(s.amountPaid), Xe(s.cashGiven), me(s.paymentMethod), Ke(t)), r
      })
    },
    Us = () => {
      if (te.length >= 5) {
        G({
          message: "Tối đa 5 đơn cùng lúc",
          type: "error"
        });
        return
      }
      Re(t => {
        const a = tr(t, xe),
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
        return S(s.cart), L(s.selectedPartner), Ve(s.note), J(s.amountPaid), Xe(s.cashGiven), me(s.paymentMethod), Ke(r), [...a, s]
      })
    },
    Ks = (t, a) => {
      if (a.stopPropagation(), te.length <= 1) {
        G({
          message: "Không thể đóng đơn cuối cùng",
          type: "error"
        });
        return
      }
      Re(r => {
        N.current && delete N.current[t];
        let s = tr(r, xe);
        if (s = s.filter(n => n.id !== t), xe === t) {
          const n = s[s.length - 1];
          S(n.cart), L(n.selectedPartner), Ve(n.note), J(n.amountPaid), Xe(n.cashGiven), me(n.paymentMethod), Ke(n.id)
        }
        return De === t && Me(s[0].id), s
      })
    },
    [Fr, Gs] = i.useState(78),
    [Ht, Ur] = i.useState(!1),
    [Qs, ha] = i.useState(!1),
    [Vs, fa] = i.useState(!1),
    [Xs, ar] = i.useState(!1),
    [ba, rr] = i.useState(!1),
    [he, $t] = i.useState(0),
    [V, sr] = i.useState(0),
    [E, nr] = i.useState({}),
    [Js, Ys] = i.useState([]),
    [Kr, Gr] = i.useState(""),
    [X, ga] = i.useState(() => {
      const t = localStorage.getItem("ui_enable_smart_sorting");
      return {
        ...Ra,
        ui_enable_smart_sorting: t !== null ? t : Ra.ui_enable_smart_sorting
      }
    }),
    [ya, wa] = i.useState(!1),
    [va, ka] = i.useState(!1),
    [Qr, Vr] = i.useState(""),
    [ir, G] = i.useState(null),
    [ye, Zs] = i.useState(() => localStorage.getItem("unified_pos_mode") || "Retail"),
    [o, _e] = i.useState({
      product: null,
      quantity: 0,
      price: 0,
      secondary_qty: 0,
      name: ""
    }),
    [Je, at] = i.useState(null),
    [kt, Xr] = i.useState(""),
    [jt, ja] = i.useState(0),
    [en, lr] = i.useState(!1),
    [or, Bt] = i.useState(!1),
    [Jr, tn] = i.useState(null),
    [Yr, cr] = i.useState(1),
    [dr, dt] = i.useState(!1),
    [an, Ft] = i.useState(null),
    [Nt, pt] = i.useState(!1),
    [Ye, _t] = i.useState(null),
    [rn, Ut] = i.useState(null);
  i.useEffect(() => {
    if (h) {
      const t = Array.isArray(h) ? h : h.items || [];
      if (o.product) {
        const a = t.find(r => r.id === o.product.id);
        a && (a.stock !== o.product.stock || a.name !== o.product.name || a.unit !== o.product.unit || a.cost_price !== o.product.cost_price || JSON.stringify(a.latest_audit) !== JSON.stringify(o.product.latest_audit)) && _e(s => ({
          ...s,
          product: a
        }))
      }
      if (Nt && Ye) {
        const a = t.find(r => r.id === Ye.id);
        if (a) {
          const r = a.stock !== Ye.stock,
            s = JSON.stringify(a.latest_audit) !== JSON.stringify(Ye.latest_audit);
          (r || s) && _t(a)
        }
      }
      S(a => {
        let r = !1;
        const s = a.map(n => {
          if (!n.product_id) return n;
          const l = t.find(c => c.id === n.product_id);
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
          }) : n
        });
        return r ? s : a
      })
    }
  }, [h, o.product?.id, Nt, Ye?.id, Ye?.stock, JSON.stringify(Ye?.latest_audit)]), i.useEffect(() => {
    if (B && p) {
      const a = (Array.isArray(B) ? B : B.items || []).find(r => r.id === p.id);
      a && (a.debt_balance !== p.debt_balance || a.name !== p.name) && L(a)
    }
  }, [B, p?.id]);
  const [sn, Ct] = i.useState(!1), [pr, Na] = i.useState(null), [le, Kt] = i.useState(null), [Gt, Qt] = i.useState(null), nn = i.useRef({}), ue = i.useRef(null), ut = i.useRef(null), ur = i.useRef(null), Vt = i.useRef(null), _a = i.useRef(null), Xt = i.useRef(null), xr = i.useRef(null), mr = i.useRef(null), Jt = i.useRef(null);
  const [remoteTerminals, setRemoteTerminals] = i.useState([]);
  const [activeRemoteTerminalId, setActiveRemoteTerminalId] = i.useState(null);
  const [isMirrorDropdownOpen, setIsMirrorDropdownOpen] = i.useState(false);
  const [isMirrorModalOpen, setIsMirrorModalOpen] = i.useState(false);
  const mirrorDropdownRef = i.useRef(null);

  const [showDeletePrompt, setShowDeletePrompt] = i.useState(false);
  const [deleteRowInput, setDeleteRowInput] = i.useState("");

  const handleConfirmDeleteRow = () => {
    const rowNum = parseInt(deleteRowInput.trim(), 10);
    if (!isNaN(rowNum) && rowNum > 0 && rowNum <= fe.length) {
      const itemToRemove = fe[rowNum - 1];
      if (itemToRemove) {
        S(prevCart => prevCart.filter(item => item.cartId !== itemToRemove.cartId));
        G({
          message: `Đã xóa dòng ${rowNum}: ${itemToRemove.product_name || "Sản phẩm"}`,
          type: "success"
        });
      }
    } else {
      G({
        message: "Số dòng không hợp lệ!",
        type: "error"
      });
    }
    setShowDeletePrompt(false);
    setDeleteRowInput("");
  };

  i.useEffect(() => {
    if (!isMirrorDropdownOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setIsMirrorDropdownOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isMirrorDropdownOpen]);

  i.useEffect(() => {
    const isValidTab = te.some(t => t.id === xe) || (xe === 'remote_inspect' && activeRemoteTerminalId);
    if (!isValidTab && te.length > 0) {
      Ke(te[0].id);
    }
  }, [xe, te, activeRemoteTerminalId]);

  i.useEffect(() => {
    const fetchRemoteTerminals = async () => {
      try {
        const myTerminalId = localStorage.getItem('pos_terminal_id');
        const res = await axios.get('/api/pos/terminals');
        const list = (res.data.terminals || []).filter(t => t.terminal_id !== myTerminalId);
        setRemoteTerminals(list);
      } catch (err) {}
    };
    fetchRemoteTerminals();
    const interval = setInterval(fetchRemoteTerminals, 2000);
    const handleFocusTab = () => {
      setIsMirrorDropdownOpen(prev => !prev);
    };
    window.addEventListener('focus_pos_mirror_tab', handleFocusTab);
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus_pos_mirror_tab', handleFocusTab);
    };
  }, []);

  const handleImportRemoteCart = (remoteCart) => {
    if (!remoteCart || remoteCart.length === 0) {
      toast.error("Giỏ hàng của máy trạm này đang trống!");
      return;
    }
    const newItems = remoteCart.map((item, idx) => ({
      id: `imported_${Date.now()}_${idx}`,
      product_id: item.id || item.product_id,
      product_name: item.name || item.product_name,
      unit: item.unit || item.product_unit || 'Cái',
      quantity: Number(item.quantity) || 1,
      price: Number(item.price || item.sale_price) || 0,
      cost_price: Number(item.cost_price || item.capital_price) || 0,
      code: item.code || item.product_code || item.sku || ''
    }));
    S(newItems);
    setActiveRemoteTerminalId(null);
    toast.success(`Đã chép ${newItems.length} sản phẩm từ máy trạm vào đơn của bạn!`);
  };

  const activeRemoteTerm = activeRemoteTerminalId 
    ? remoteTerminals.find(t => t.terminal_id === activeRemoteTerminalId || t.ip_address === activeRemoteTerminalId || (t.ip_address && activeRemoteTerminalId.includes(t.ip_address)) || (t.terminal_id && (activeRemoteTerminalId.includes(t.terminal_id) || t.terminal_id.includes(activeRemoteTerminalId))))
    : null;

  const displayPartner = xe === 'remote_inspect' ? activeRemoteTerm?.partner : p;

  const handleUpdateRemoteCart = (newCart) => {
    if (!activeRemoteTerminalId) return;
    
    // 1. Update local cache immediately
    setRemoteTerminals(prev => prev.map(t => {
      if (t.terminal_id === activeRemoteTerminalId || t.ip_address === activeRemoteTerminalId) {
        return {
          ...t,
          cart: newCart,
          total_items: newCart.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0),
          total_amount: newCart.reduce((sum, item) => sum + (Number(item.quantity) || 1) * Number(item.price || item.sale_price || 0), 0)
        };
      }
      return t;
    }));

    // 2. Push to server
    q.post('/api/pos/terminal-state/edit-cart', {
      terminal_id: activeRemoteTerminalId,
      cart: newCart
    }).catch(err => {
      toast.error("Không thể cập nhật máy trạm!");
    });
  };

  const handleUpdateRemotePartner = (newPartner) => {
    if (!activeRemoteTerminalId) return;
    
    // 1. Update local cache immediately
    setRemoteTerminals(prev => prev.map(t => {
      if (t.terminal_id === activeRemoteTerminalId || t.ip_address === activeRemoteTerminalId) {
        return {
          ...t,
          partner: newPartner,
          partner_name: newPartner ? newPartner.name : 'Khách lẻ'
        };
      }
      return t;
    }));

    // 2. Push to server
    q.post('/api/pos/terminal-state/edit-cart', {
      terminal_id: activeRemoteTerminalId,
      partner: newPartner,
      partner_name: newPartner ? newPartner.name : 'Khách lẻ',
      cart: activeRemoteTerm?.cart || []
    }).catch(err => {
      toast.error("Không thể cập nhật đối tác máy trạm!");
    });
  };

  const remoteCartRows = i.useMemo(() => {
    if (xe !== 'remote_inspect') return [];
    if (!activeRemoteTerminalId && !activeRemoteTerm) return [];
    const currentRemoteTerm = activeRemoteTerm || {
      terminal_id: activeRemoteTerminalId,
      terminal_name: activeRemoteTerminalId,
      user_name: 'Thu ngân',
      ip_address: activeRemoteTerminalId.includes('.') ? activeRemoteTerminalId : null,
      cart: []
    };

    const bannerRow = e.jsx(m.tr, {
      key: 'remote-header-banner',
      initial: { opacity: 0, y: -10 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: -10 },
      className: 'bg-emerald-500/5 dark:bg-emerald-500/10 border-b border-emerald-500/20 z-50 relative',
      children: e.jsx('td', {
        colSpan: 10,
        className: 'p-2 px-4',
        children: e.jsxs('div', {
          className: 'flex items-center justify-between gap-4 py-1.5 px-3 bg-emerald-500/10 dark:bg-emerald-500/20 rounded-2xl border border-emerald-500/20 backdrop-blur-md shadow-xs shadow-emerald-500/5 transition-all duration-300',
          children: [
            e.jsxs('div', {
              className: 'flex items-center gap-2 text-emerald-700 dark:text-emerald-300 text-[11px] font-black uppercase tracking-wider',
              children: [
                e.jsxs('span', {
                  className: 'flex h-2 w-2 relative shrink-0',
                  children: [
                    e.jsx('span', { className: 'relative inline-flex rounded-full h-2 w-2 bg-emerald-500' })
                  ]
                }),
                e.jsx('span', {
                  className: 'px-2 py-0.5 rounded-lg bg-emerald-500 text-white text-[9px] font-black uppercase tracking-widest mr-1.5 shadow-sm shadow-emerald-500/25',
                  children: 'LIVE INSPECT'
                }),
                e.jsxs('span', {
                  children: [
                    'Đang soi: ',
                    e.jsx('strong', { 
                      className: 'font-black text-emerald-800 dark:text-emerald-200 uppercase', 
                      children: `${currentRemoteTerm.user_name || 'Thu ngân'} (${currentRemoteTerm.ip_address || 'Local'})` 
                    }),
                    ` - ${(currentRemoteTerm.cart || []).length} món`
                  ]
                })
              ]
            }),
             e.jsxs('div', {
              className: 'flex items-center gap-2 shrink-0',
              children: [
                e.jsxs('button', {
                  onClick: () => {
                    Qt({
                      title: "Xác nhận lưu hóa đơn",
                      message: "Bạn có chắc chắn muốn lưu hóa đơn trên máy trạm này?",
                      onConfirm: () => {
                        Qt(null);
                        q.post('/api/pos/terminal-state/action', {
                          terminal_id: activeRemoteTerminalId,
                          action: 'save_order'
                        }).then(() => {
                          toast.success("Đã gửi lệnh lưu hóa đơn tới máy trạm!");
                        }).catch(err => {
                          toast.error("Không thể gửi lệnh lưu hóa đơn!");
                        });
                      }
                    });
                  },
                  className: 'px-2.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-black text-[9px] uppercase tracking-widest shadow-sm shadow-rose-500/10 border border-rose-500/20 transition-all cursor-pointer flex items-center gap-1.5',
                  children: ['LƯU HÓA ĐƠN']
                }),
                e.jsxs('button', {
                  onClick: () => handleImportRemoteCart(currentRemoteTerm.cart),
                  className: 'px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-[9px] uppercase tracking-widest shadow-sm shadow-emerald-500/10 border border-emerald-500/20 transition-all cursor-pointer flex items-center gap-1.5',
                  children: [e.jsx(Copy, { size: 10, className: 'shrink-0' }), 'CHÉP GIỎ HÀNG']
                }),
                e.jsxs('button', {
                  onClick: () => setActiveRemoteTerminalId(null),
                  className: 'px-2.5 py-1 bg-slate-200/80 dark:bg-slate-800/80 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all cursor-pointer flex items-center gap-1',
                  children: [e.jsx('span', { children: '✕' }), 'QUAY LẠI']
                })
              ]
            })
          ]
        })
      })
    });

    const cartItems = (!currentRemoteTerm.cart || currentRemoteTerm.cart.length === 0) ? [
      e.jsx(m.tr, {
        key: 'remote-empty-cart',
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        children: e.jsx('td', {
          colSpan: 10,
          className: 'p-8 text-center text-xs font-black uppercase tracking-widest text-slate-400',
          children: 'Giỏ hàng của máy trạm này hiện tại đang trống.'
        })
      })
    ] : currentRemoteTerm.cart.map((item, idx) => {
      const qty = Number(item.quantity) || 0;
      const price = Number(item.price || item.sale_price) || 0;
      const subtotal = price * qty;
      const mult = Number(item.multiplier) || 1;
      const secQty = item.secondary_qty !== undefined && item.secondary_qty !== null ? item.secondary_qty : (qty / mult);
      const secQtyStr = (mult > 1 || item.secondary_qty) ? (Number(secQty) % 1 === 0 ? Number(secQty) : Number(secQty).toFixed(3)) : 'N/A';
      const itemKey = item.id || item.product_id || `remote_${idx}_${item.name || item.product_name}`;

      return e.jsxs(m.tr, {
        key: itemKey,
        layout: true,
        initial: { opacity: 0, x: -20, scale: 0.98 },
        animate: { opacity: 1, x: 0, scale: 1 },
        exit: { opacity: 0, x: 30, scale: 0.95, transition: { duration: 0.2 } },
        transition: { type: 'spring', stiffness: 350, damping: 25 },
        className: 'border-b border-slate-200 dark:border-white/5 hover:bg-primary/5 dark:hover:bg-slate-800/20 transition-colors group',
        children: [
          e.jsx('td', {
            className: 'py-2 px-4 text-center text-slate-400 font-black text-[11px] group-hover:text-emerald-500 transition-colors tabular-nums',
            children: idx + 1
          }),
          e.jsx('td', {
            className: 'py-2 px-4 text-center',
            children: e.jsx('button', {
              onClick: (ev) => {
                ev.stopPropagation();
                const newCart = (activeRemoteTerm?.cart || []).filter((c, i) => i !== idx);
                handleUpdateRemoteCart(newCart);
              },
              className: 'p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-all',
              title: 'Xóa dòng',
              children: e.jsx(Ar, { size: 18 })
            })
          }),
          e.jsx('td', {
            className: 'py-2 px-2 relative',
            children: e.jsxs('div', {
              className: 'w-full h-auto py-2.5 px-4 text-[17px] font-black uppercase tracking-tight text-emerald-900 dark:text-emerald-300 leading-relaxed truncate',
              children: [
                item.name || item.product_name,
                (item.code || item.product_code || item.sku) && e.jsxs('span', {
                  className: 'ml-2 text-xs font-black tabular-nums text-slate-400 normal-case',
                  children: ['(', item.code || item.product_code || item.sku, ')']
                })
              ]
            })
          }),
          e.jsx('td', {
            className: 'py-2 px-4 text-center',
            children: e.jsx('div', {
              className: 'font-bold text-gray-700 dark:text-gray-200',
              children: Te(item.unit || item.product_unit || 'Cái')
            })
          }),
          e.jsx('td', {
            className: 'py-2 px-2 w-32',
            children: item.secondary_unit ? e.jsxs('div', {
              className: 'flex items-center justify-center gap-1 h-10 px-2 bg-transparent border border-white/20 dark:border-white/10 rounded-2xl font-black text-base text-primary dark:text-[#d4a574]',
              children: [
                e.jsx('input', {
                  type: 'text',
                  className: 'w-16 bg-transparent text-center border-0 outline-none p-0 focus:ring-0 focus:border-0 font-black text-base text-primary dark:text-[#d4a574]',
                  value: secQtyStr,
                  onFocus: (ev) => ev.target.select(),
                  onKeyDown: (ev) => {
                    if (ev.key === 'Enter') {
                      ev.preventDefault();
                      ue.current?.focus();
                    }
                  },
                  onChange: (ev) => {
                    const val = parseFloat(ev.target.value) || 0;
                    const newCart = (activeRemoteTerm?.cart || []).map((c, i) => i === idx ? {
                      ...c,
                      secondary_qty: val,
                      quantity: val * (Number(c.multiplier) || 1)
                    } : c);
                    handleUpdateRemoteCart(newCart);
                  }
                }),
                e.jsx('span', { className: 'text-[10px] font-black text-gray-400 uppercase ml-1', children: Te(item.secondary_unit || 'Cái') })
              ]
            }) : e.jsx('div', {
              className: 'text-center text-gray-300 italic text-[10px] font-bold',
              children: 'N/A'
            })
          }),
          e.jsx('td', {
            className: 'py-2 px-2 w-24',
            children: e.jsx('input', {
              type: 'text',
              className: 'w-full h-10 text-center bg-transparent border border-white/20 dark:border-white/10 rounded-2xl font-black text-lg text-primary dark:text-[#d4a574] focus:ring-0 focus:outline-none focus:border-emerald-500/30',
              value: qty,
              onFocus: (ev) => ev.target.select(),
              onKeyDown: (ev) => {
                if (ev.key === 'Enter') {
                  ev.preventDefault();
                  ue.current?.focus();
                }
              },
              onChange: (ev) => {
                const val = parseFloat(ev.target.value) || 0;
                const newCart = (activeRemoteTerm?.cart || []).map((c, i) => i === idx ? {
                  ...c,
                  quantity: val,
                  secondary_qty: val / (Number(c.multiplier) || 1)
                } : c);
                handleUpdateRemoteCart(newCart);
              }
            })
          }),
          e.jsx('td', {
            className: 'py-2 px-2 w-[180px]',
            children: e.jsx('input', {
              type: 'text',
              className: 'w-full h-10 text-center bg-transparent border border-white/20 dark:border-white/10 rounded-2xl font-black text-base text-primary dark:text-[#d4a574] focus:ring-0 focus:outline-none focus:border-emerald-500/30',
              value: I(price),
              onFocus: (ev) => ev.target.select(),
              onKeyDown: (ev) => {
                if (ev.key === 'Enter') {
                  ev.preventDefault();
                  ue.current?.focus();
                }
              },
              onChange: (ev) => {
                const val = parseFloat(ev.target.value.replace(/,/g, '')) || 0;
                const newCart = (activeRemoteTerm?.cart || []).map((c, i) => i === idx ? {
                  ...c,
                  price: val,
                  sale_price: val
                } : c);
                handleUpdateRemoteCart(newCart);
              }
            })
          }),
          e.jsx('td', {
            className: 'py-2 px-4 text-right',
            children: e.jsxs('div', {
              className: 'font-black text-lg text-emerald-600 dark:text-emerald-400 tabular-nums',
              children: [I(subtotal), 'đ']
            })
          }),
          e.jsx('td', {
            className: 'w-8'
          })
        ]
      });
    });

    return [bannerRow, ...cartItems];
  }, [activeRemoteTerminalId, activeRemoteTerm, xe]);

  const [ln, Yt] = i.useState(!1), [on, Ca] = i.useState(null), [hr, Zt] = i.useState(!1), [cn, Ta] = i.useState(!1), [Ze, ea] = i.useState({
    name: "",
    price: ""
  }), fr = i.useRef(null), Zr = i.useRef(null), [es, dn] = i.useState(!1), fe = i.useMemo(() => X.ui_enable_smart_sorting !== "true" ? b : xs(b), [b, X.ui_enable_smart_sorting]), [ts, as] = i.useState(!1), [pn, un] = i.useState(!1), Tt = i.useRef(null), rs = t => {
    Tt.current || (Tt.current = setTimeout(() => {
      un(a => !a), Tt.current = null
    }, 3e3))
  }, br = () => {
    Tt.current && (clearTimeout(Tt.current), Tt.current = null)
  }, [xn, xt] = i.useState(!1), [mn, ss] = i.useState(!1), [Ee, mt] = i.useState(null), [Sa, St] = i.useState(""), [Ia, It] = i.useState(""), et = i.useRef(null), [we, hn] = i.useState(() => {
    const t = localStorage.getItem("pos_print_options");
    return t ? JSON.parse(t) : {
      showOldDebt: !1,
      showPayment: !1,
      showRemaining: !1,
      showCashGiven: !0,
      showChange: !0
    }
  });
  i.useEffect(() => {
    localStorage.setItem("pos_new_style", JSON.stringify(O)), document.documentElement.style.setProperty("--pos-accent", O.accent), document.documentElement.style.setProperty("--dropdown-bg", O.dropdownBg), document.documentElement.style.setProperty("--dropdown-accent", O.dropdownAccent)
  }, [O]);
  const ns = t => {
      if (!t) return "#000000";
      const a = parseInt(t.slice(1, 3), 16),
        r = parseInt(t.slice(3, 5), 16),
        s = parseInt(t.slice(5, 7), 16);
      return (a * 299 + r * 587 + s * 114) / 1e3 > 128 ? "#000000" : "#ffffff"
    },
    is = (t, a = .8) => {
      if (!t) return `rgba(255, 255, 255, ${a})`;
      const r = parseInt(t.slice(1, 3), 16),
        s = parseInt(t.slice(3, 5), 16),
        n = parseInt(t.slice(5, 7), 16);
      return `rgba(${r}, ${s}, ${n}, ${a})`
    },
    Y = i.useMemo(() => {
      const a = document.documentElement.classList.contains("dark") || g === "dark" ? "#0f172a" : O.dropdownBg,
        r = O.dropdownAccent,
        s = ns(a),
        n = ns(r);
      return {
        main: s,
        accent: n,
        muted: s === "#ffffff" ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.5)",
        accentMuted: n === "#ffffff" ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.6)",
        glassBg: is(a, .35),
        glassAccent: is(r, .9)
      }
    }, [O.dropdownBg, O.dropdownAccent, g]);
  i.useEffect(() => {
    localStorage.setItem("pos_print_options", JSON.stringify(we))
  }, [we]);
  const fn = useMotionValue(0),
    bn = useMotionValue(0);
  useSpring(fn, {
    stiffness: 50,
    damping: 20
  }), useSpring(bn, {
    stiffness: 50,
    damping: 20
  }), i.useEffect(() => {
    et.current = new BroadcastChannel("packing_channel");
    const t = new BroadcastChannel("pos_data_sync");
    return t.onmessage = a => {
      a.data.type === "PARTNER_UPDATED" ? (F.invalidateQueries({
        queryKey: ["partners"]
      }), p && yr(p.id)) : a.data.type === "PRODUCT_UPDATED" ? F.invalidateQueries({
        queryKey: ["products"]
      }) : a.data.type === "ORDER_SAVED" ? (F.invalidateQueries({
        queryKey: ["shippingSummary"]
      }), F.invalidateQueries({
        queryKey: ["partners"]
      }), F.invalidateQueries({
        queryKey: ["products"]
      }), p && yr(p.id)) : a.data.type === "SETTINGS_UPDATED" ? (cs(), ds()) : a.data.type === "UI_SETTING_UPDATED" && a.data.key === "ui_enable_smart_sorting" && ga(r => ({
        ...r,
        ui_enable_smart_sorting: a.data.value
      }))
    }, () => {
      et.current && et.current.close(), t.close()
    }
  }, []), i.useEffect(() => {
    if (et.current) {
      et.current.onmessage = r => {
        if (r.data && r.data.type === "REQUEST_SYNC") {
          const s = new Date().toLocaleTimeString("vi-VN", {
              hour: "2-digit",
              minute: "2-digit"
            }),
            n = {
              type: b.length > 0 ? "NEW_ORDER" : "CLEAR",
              orders: b.length > 0 ? [{
                id: H || "MỚI",
                customer_name: p ? p.name : null,
                timestamp: s,
                items: b.map(l => ({
                  id: l.cartId,
                  product_id: l.product_id,
                  name: l.product_name,
                  quantity: l.quantity,
                  unit: l.unit,
                  price: l.price
                })),
                note: pe
              }] : []
            };
          et.current.postMessage(n), q.post("/api/packing/sync", n).catch(console.error)
        }
      };
      const t = new Date().toLocaleTimeString("vi-VN", {
          hour: "2-digit",
          minute: "2-digit"
        }),
        a = {
          type: b.length > 0 ? "NEW_ORDER" : "CLEAR",
          orders: b.length > 0 ? [{
            id: H || "MỚI",
            customer_name: p ? p.name : null,
            timestamp: t,
            items: b.map(r => ({
              id: r.cartId,
              product_id: r.product_id,
              name: r.product_name,
              quantity: r.quantity,
              unit: r.unit,
              price: r.price
            })),
            note: pe
          }] : []
        };
      et.current.postMessage(a), q.post("/api/packing/sync", a).catch(console.error);
      try {
        const normCart = b.map(r => ({
          name: r.product_name || r.name,
          product_name: r.product_name || r.name,
          quantity: r.quantity || 1,
          unit: r.unit || r.product_unit || 'Cái',
          price: r.price || r.sale_price || 0,
          sale_price: r.price || r.sale_price || 0,
          cost_price: r.cost_price || r.capital_price || (r.price ? r.price * 0.75 : 0),
          code: r.code || r.sku || r.product_code || '',
          secondary_unit: r.secondary_unit || null,
          multiplier: Number(r.multiplier) || 1,
          secondary_qty: Number(r.secondary_qty) || 0,
          product_id: r.product_id || null
        }));
        const pName = p ? (p.name || 'Khách lẻ') : 'Khách lẻ';
        localStorage.setItem('pos_cart', JSON.stringify(normCart));
        localStorage.setItem('pos_partner_name', pName);
        window.dispatchEvent(new CustomEvent('pos_cart_updated', {
          detail: { cart: normCart, partner_name: pName }
        }));
      } catch (e) {}
    }
  }, [b, pe, H, p]), i.useEffect(() => {
    if (et.current) {
      const t = {
        type: "SYNC_HELD",
        heldInvoices: Ne.map(a => ({
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
      et.current.postMessage(t), q.post("/api/packing/sync", t).catch(console.error)
    }
  }, [Ne]);
  const gn = () => {
    Ta(!0)
  };
  i.useEffect(() => {
    if (o.product) {
      const t = setTimeout(() => {
        const a = ye === "Wholesale" && o.product.secondary_unit ? Xt : ut;
        a.current && document.activeElement !== a.current && (a.current.focus(), a.current.select?.())
      }, 0);
      return () => clearTimeout(t)
    }
  }, [o.product?.id, ye]);
  const ls = i.useMemo(() => o.product ? o.price * o.quantity : 0, [o.product, o.price, o.quantity]),
    A = i.useMemo(() => b.reduce((t, a) => t + a.price * a.quantity, 0) + ls, [b, ls]);
  i.useEffect(() => {
    if (A > 0) {
      const timer = setTimeout(() => {
        precacheAmounts(A, p?.name);
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [A, p]);
  const yn = i.useMemo(() => {
      const t = b.reduce((r, s) => {
          const n = s.product_id == null ? s.price : s.cost_price || 0;
          return r + (s.price - n) * s.quantity
        }, 0),
        a = o.product ? (o.price - (o.product.cost_price || 0)) * o.quantity : 0;
      return t + a
    }, [b, o]),
    wn = i.useMemo(() => b.length + (o.product ? 1 : 0), [b, o.product]),
    vn = i.useMemo(() => b.reduce((t, a) => t + (a.quantity || 0), 0) + (o.quantity || 0), [b, o.quantity]),
    kn = i.useMemo(() => b.reduce((t, a) => t + (a.secondary_qty || 0), 0) + (o.secondary_qty || 0), [b, o.secondary_qty]),
    Dt = i.useMemo(() => {
      if (!p) return 0;
      let t = p.debt_balance;
      if (H && ge && p.id === ge.partner_id && ge.payment_method === "Debt") {
        const a = (ge.total_amount || 0) - (ge.amount_paid || 0);
        t -= a
      }
      return t
    }, [p, H, ge]),
    zt = D === "Debt" ? Dt + (A >= 0 ? A - Le : A + Le) : Dt,
    gr = () => {
      if (b.length === 0) return;
      const t = {
        id: Date.now(),
        cart: [...b],
        partner: p,
        note: pe,
        amountPaid: Le,
        cashGiven: ne,
        paymentMethod: D,
        editOrderId: H,
        time: new Date().toLocaleTimeString("vi-VN", {
          hour: "2-digit",
          minute: "2-digit"
        }),
        total: A
      };
      er([t, ...Ne]), rt(), G({
        message: "Đã tạm dừng đơn hàng",
        type: "success"
      })
    },
    os = t => {
      S(t.cart), L(t.partner), Ve(t.note), J(t.amountPaid), Xe(t.cashGiven || 0), me(t.paymentMethod || "Debt"), xa(t.editOrderId || null), er(Ne.filter(a => a.id !== t.id)), ct(!1)
    },
    jn = t => {
      er(Ne.filter(a => a.id !== t))
    },
    rt = (t = !1) => {
      S([]), t || (L(null), je("")), ce(""), Pe(!1), J(0), Xe(0), Ve(""), nr({});
      const a = ye === "Wholesale" ? "Debt" : "Cash";
      me(a), a === "Cash" && J(0), xa(null), Ja(null), ua(null), Za(0), mt(null), St(""), It(""), N.current && (N.current[xe] = null), Tr(), setTimeout(() => ue.current?.focus(), 100)
    };
    const $e = async (t = !0) => {
      let a = [...b];
      if (o.product && o.quantity !== 0) {
        const r = a.findIndex(s => s.product_id === o.product.id && s.price === o.price);
        r > -1 ? (a[r].quantity += o.quantity, a[r].secondary_qty += o.secondary_qty) : a = [{
          product_id: o.product.id,
          product_name: o.product.name,
          unit: o.product.unit,
          secondary_unit: o.product.secondary_unit,
          multiplier: o.product.multiplier || 1,
          price: o.price,
          cost_price: o.product.cost_price,
          latest_cost_price: o.product.latest_cost_price,
          quantity: o.quantity,
          secondary_qty: o.secondary_qty,
          stock: o.product.stock,
          is_combo: o.product.is_combo,
          active_ingredient: o.product.active_ingredient,
          isPacked: !1,
          cartId: Math.random().toString(36).substr(2, 9)
        }, ...a]
      }
      if (a.length !== 0) {
        X.ui_enable_smart_sorting === "true" && (a = xs(a)), Hr(!0);
        try {
          const r = {
            partner_id: p ? p.id : null,
            type: "Sale",
            payment_method: D,
            details: a.map(n => ({
              product_id: n.product_id,
              product_name: n.product_name,
              quantity: n.quantity,
              price: n.price
            })),
            note: pe,
            amount_paid: Le,
            cash_given: ne,
            bank_account_id: D === "Transfer" ? Kr : null,
            shipping_status: Ee,
            shipping_address: Sa,
            shipping_phone: Ia,
            created_by: JSON.parse(sessionStorage.getItem("user") || "{}").name || JSON.parse(sessionStorage.getItem("user") || "{}").username || "Unknown"
          };
          let s;
          if (H) {
            s = await q.put(`/api/orders/${H}`, r);
          } else {
            s = await q.post("/api/orders", r);
          }
          if (C !== "off" && Ba) try {
            Mt();
            const savedVoice = localStorage.getItem("pos_selected_voice") || (C === "male" ? "edge-vi-male" : "edge-vi-female");
            const n = savedVoice === "edge-vi-male" ? "edge-vi-male" : (savedVoice === "edge-vi-female" ? "edge-vi-female" : "google");
            const disablePartnerThankyou = localStorage.getItem("pos_tts_disable_partner_thankyou") === "true";
            const cleanPartner = (p?.name || "").trim();
            const isRealPartner = cleanPartner && cleanPartner.toLowerCase() !== "khách lẻ" && cleanPartner.toLowerCase() !== "khách vãng lai" && cleanPartner.toLowerCase() !== "ncc vãng lai";
            const finalPartnerDisplay = (disablePartnerThankyou || !isRealPartner) ? "" : cleanPartner;
            
            const tpl = finalPartnerDisplay 
              ? (localStorage.getItem("pos_tts_thankyou_partner_template") || "Cảm ơn {partner} đã chọn Sáu Quý")
              : (localStorage.getItem("pos_tts_thankyou_template") || "Cảm ơn quý khách đã chọn Sáu Quý");
            
            const l = tpl
              .replace(/{partner}/gi, finalPartnerDisplay || "quý khách")
              .replace(/{customer}/gi, finalPartnerDisplay || "quý khách");
              
            const c = `${l}_${n}`;
            let x;
            if (window.preloadedTtsAudios && window.preloadedTtsAudios[c]) x = window.preloadedTtsAudios[c], x.currentTime = 0;
            else {
              const d = Ae(l, n);
              x = new Audio(d), x.load()
            }
            window.currentTtsSequence = {
              audio1: x,
              audio2: null
            }, x.play().catch(d => console.error("Error playing Thank You TTS:", d))
          } catch (n) {
            console.error("Lỗi đọc cảm ơn:", n)
          }
          if (ua(s.data), Lr(s.data), p) {
            const n = a.filter(l => l.product_id).map(l => ({
              product_id: l.product_id,
              price: l.price
            }));
            if (n.length > 0) try {
              await q.post("/api/custom-prices/bulk", {
                partner_id: p.id,
                prices: n
              })
            } catch (l) {
              console.error("Failed to save custom prices:", l)
            }
          }
          if (F.invalidateQueries(["shippingSummary"]), t) fs(), setTimeout(() => {
            window.print(), setTimeout(() => {
              rt(!1);
              const n = new BroadcastChannel("pos_data_sync");
              n.postMessage({
                type: "ORDER_SAVED"
              }), n.close(), ua(null)
            }, 1e3)
          }, 1e3);
          else {
            rt(!1);
            const n = new BroadcastChannel("pos_data_sync");
            n.postMessage({
              type: "ORDER_SAVED"
            }), n.close(), fs(), G({
              message: "Đã lưu đơn hàng thành công!",
              type: "success"
            }), ua(null), localStorage.removeItem("pos_draft")
          }
        } catch (r) {
          G({
            message: r.response?.data?.error || "Lỗi khi lưu đơn hàng",
            type: "error"
          })
        } finally {
          Hr(!1)
        }
      }
    };

  i.useEffect(() => {
    const handleRemoteAction = (e) => {
      if (e.detail && e.detail.action === 'save_order') {
        $e();
      }
    };
    window.addEventListener('pos_remote_action', handleRemoteAction);
    return () => window.removeEventListener('pos_remote_action', handleRemoteAction);
  }, [$e]);

  const Nn = async t => {
      try {
        const a = await q.get(`/api/orders/${t}`);
        a.data && Da(a.data)
      } catch (a) {
        console.error("Error fetching order", a), G({
          message: "Không tìm thấy hóa đơn",
          type: "error"
        })
      }
    }, Da = t => {
      xa(t.id), Ja(t), S(t.details.map(a => {
        const r = z.find(s => s.id === a.product_id);
        return {
          product_id: a.product_id,
          product_name: a.product_name,
          unit: a.product_unit,
          secondary_unit: a.secondary_unit,
          multiplier: a.multiplier || 1,
          price: a.price,
          cost_price: r ? r.cost_price : a.cost_price,
          latest_cost_price: r ? r.latest_cost_price : a.latest_cost_price,
          quantity: a.quantity,
          secondary_qty: a.quantity / (a.multiplier || 1),
          stock: r ? r.stock : a.stock || 0,
          latest_audit: r?.latest_audit,
          active_ingredient: a.active_ingredient,
          is_manual_price: !0,
          isPacked: !1,
          cartId: Math.random().toString(36).substr(2, 9)
        }
      })), Ve(t.note || ""), J(t.amount_paid || 0), Xe(t.cash_given || 0), me(t.payment_method), mt(t.shipping_status || null), St(t.shipping_address || ""), It(t.shipping_phone || ""), t.partner_id ? ma(t.partner_id) : (L(null), ma(null)), je(""), ce(""), Pe(!1)
    }, za = async t => {
      let a;
      if (t === "prev" ? a = He + 1 : a = Math.max(0, He - 1), a === 0) {
        Tr(), rt();
        return
      }
      Tr(), as(!0);
      try {
        const r = await q.get(`/api/orders?limit=1&page=${a}&type=Sale`);
        r.data.items && r.data.items.length > 0 ? (Da(r.data.items[0]), Za(a)) : G({
          message: "Không còn hóa đơn nào khác",
          type: "info"
        })
      } catch (r) {
        console.error(r)
      } finally {
        as(!1)
      }
    }, cs = async () => {
      try {
        const [t, a] = await Promise.all([q.get("/api/print-templates?module=Sale"), q.get("/api/settings")]);
        let r = {
          ...Ra
        };
        if (a.data && (r = {
            ...r,
            ...a.data
          }), t.data && t.data.length > 0) {
          const l = t.data.find(c => c.is_default) || t.data[0];
          if (l) try {
            const c = JSON.parse(l.config);
            r = {
              ...r,
              ...c
            }
          } catch (c) {
            console.error(c)
          }
        }
        const s = localStorage.getItem("ui_show_doraemon");
        s !== null && (r.ui_show_doraemon = s);
        const n = localStorage.getItem("ui_enable_smart_sorting");
        r.ui_enable_smart_sorting = n !== null ? n : Ra.ui_enable_smart_sorting, ga(r)
      } catch (t) {
        console.error(t)
      }
    };
  i.useEffect(() => {
    const t = a => {
      a.key === "ui_show_doraemon" && ga(r => ({
        ...r,
        [a.key]: a.newValue
      }))
    };
    return window.addEventListener("storage", t), () => window.removeEventListener("storage", t)
  }, []), i.useEffect(() => {
    Wt && setTimeout(() => {
      const t = document.getElementById("first-held-card");
      t && t.focus()
    }, 100)
  }, [Wt]), i.useEffect(() => {
    const t = a => {
      if (a.isComposing || a.keyCode === 229 || !a.key) return;
      if (a.key === "Delete") {
        const v = document.activeElement;
        if (!v || (v.tagName !== "INPUT" && v.tagName !== "TEXTAREA" && v.getAttribute("contenteditable") !== "true") || v === ue.current) {
          a.preventDefault();
          a.stopPropagation();
          setDeleteRowInput("");
          setShowDeletePrompt(true);
          return;
        }
      }
      const r = Date.now();
      if (a.key.length === 1 && !a.ctrlKey && !a.altKey && !a.metaKey) {
        const d = r - y.current;
        if (y.current = r, d > 150 ? ae.current = a.key : ae.current += a.key, d < 45) {
          const v = document.activeElement;
          v && (v.tagName === "INPUT" || v.tagName === "TEXTAREA") || (a.preventDefault(), a.stopPropagation()), P.current && (clearTimeout(P.current), P.current = null)
        }
      } else if (a.key === "Enter") {
        const d = r - y.current,
          v = ae.current;
        if (d < 45 && v.length >= 4) {
          if (a.preventDefault(), a.stopPropagation(), ae.current = "", jr.current(v, Ea.current) || G({
              message: `Mã vạch ${v} không tồn tại`,
              type: "error"
            }), document.activeElement && (document.activeElement.tagName === "INPUT" || document.activeElement.tagName === "TEXTAREA")) {
            const j = document.activeElement,
              U = v[0];
            if (j.value.endsWith(v)) try {
              const R = j.tagName === "TEXTAREA" ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype;
              Object.getOwnPropertyDescriptor(R, "value").set.call(j, j.value.slice(0, -v.length)), j.dispatchEvent(new Event("input", {
                bubbles: !0
              }))
            } catch {
              j.value = j.value.slice(0, -v.length)
            } else if (U && j.value.endsWith(U)) try {
              const R = j.tagName === "TEXTAREA" ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype;
              Object.getOwnPropertyDescriptor(R, "value").set.call(j, j.value.slice(0, -1)), j.dispatchEvent(new Event("input", {
                bubbles: !0
              }))
            } catch {
              j.value = j.value.slice(0, -1)
            }
          }
          return
        }
        ae.current = ""
      }
      if (a.ctrlKey && (a.code === "Space" || a.key === " ")) {
        a.preventDefault(), a.stopPropagation(), ct(d => !d);
        return
      }
      a.key === "Tab" && On();
      const n = a.key.toUpperCase();
      if (n === (X.kb_cash || "F1").toUpperCase()) {
        a.preventDefault(), a.stopPropagation();
        const d = document.getElementById("cash-given-compact"),
          v = document.getElementById("cash-given-sidebar"),
          _ = d && d.offsetParent !== null ? d : v;
        _ ? (_.focus(), _.select()) : (_a.current?.focus(), _a.current?.select())
      }
      if (n === (X.kb_partner || "F3").toUpperCase()) {
        a.preventDefault(), a.stopPropagation(), setTimeout(() => {
          Vt.current?.focus(), Vt.current?.select()
        }, 50);
        return
      }
      if (a.key === "Escape") Mt(), (Xa || Wt || or || ya || va || dr || ee || Je !== null || ba || hr || Nt) && (Pe(!1), ct(!1), Bt(!1), wa(!1), ka(!1), dt(!1), ce(""), at(null), xt(!1), rr(!1), Zt(!1), pt(!1));
      else if (n === "F2" && a.shiftKey) {
        if (a.preventDefault(), o.product) {
          const d = ue.current?.getBoundingClientRect();
          _t(o.product), d && Ut({
            top: d.top,
            bottom: d.bottom,
            left: d.left,
            right: d.right
          }), pt(!0)
        }
      } else if (n === (X.kb_search || "F2").toUpperCase()) {
        a.preventDefault();
        const d = document.activeElement;
        if (d && d.id && d.id.startsWith("row-name-")) {
          const v = parseInt(d.id.replace("row-name-", "")),
            _ = fe[v];
          if (_) {
            const j = z.find(U => U.id === _.product_id);
            j && (Ft(j), dt(!0))
          }
        } else ue.current?.focus(), ue.current?.select?.()
      } else if (n === (X.kb_save || "F12").toUpperCase()) a.preventDefault(), $e(!1);
      else if (n === (X.kb_pay || "F9").toUpperCase()) a.preventDefault(), $e(!0);
      else if (n === (X.kb_new || "F4").toUpperCase()) a.preventDefault(), rt();
      else if (n === (X.kb_hold || "F8").toUpperCase()) a.preventDefault(), gr();
      else if (n === (X.kb_custom || "F6").toUpperCase()) a.preventDefault(), Zt(!0), ea({
        name: "",
        price: ""
      }), setTimeout(() => {
        fr.current?.focus()
      }, 100);
      else if (n === (X.kb_speech || "F10").toUpperCase()) {
        a.preventDefault(), a.stopPropagation();
        if (C !== "off" && ca) {
          Mt();
          console.log("F10 calling speakNumber with:", A);
          speakNumber(A, true, p?.name);
        }
      }
      else if (a.key === "Insert") {
        a.preventDefault(), a.stopPropagation();
        if (o && o.product) {
          _e(v => ({
            ...v,
            quantity: v.quantity * -1,
            secondary_qty: v.secondary_qty * -1
          }));
        }
      }
      else if (n === "F7") {
        a.preventDefault();
        console.log("F7 keydown triggered. State:", { bLength: b.length });
        if (b.length > 0) {
          ar(!0);
        }
      } else if (a.ctrlKey && a.key === "ArrowUp") {
        a.preventDefault();
        const allTabs = [...te];
        if (activeRemoteTerminalId) {
          allTabs.push({ id: 'remote_inspect' });
        }
        const idx = allTabs.findIndex(t => t.id === xe);
        if (idx > 0) {
          const target = allTabs[idx - 1];
          if (target.id === 'remote_inspect') {
            Ke('remote_inspect');
          } else {
            Fs(target.id);
          }
        }
      } else if (a.ctrlKey && a.key === "ArrowDown") {
        a.preventDefault();
        const allTabs = [...te];
        if (activeRemoteTerminalId) {
          allTabs.push({ id: 'remote_inspect' });
        }
        const idx = allTabs.findIndex(t => t.id === xe);
        if (idx !== -1 && idx < allTabs.length - 1) {
          const target = allTabs[idx + 1];
          if (target.id === 'remote_inspect') {
            Ke('remote_inspect');
          } else {
            Fs(target.id);
          }
        }
      } else if (a.ctrlKey && a.key === "ArrowLeft") {
        a.preventDefault();
        za("prev");
      } else if (a.ctrlKey && a.key === "ArrowRight") {
        a.preventDefault();
        za("next");
      }
      const l = a.key.length === 1,
        c = !a.ctrlKey && !a.altKey && !a.metaKey,
        x = a.target.tagName !== "INPUT" && a.target.tagName !== "TEXTAREA";
      console.log("[Keydown Debug] target:", a.target ? a.target.tagName : "null", "key:", a.key, "x:", x);
      l && c && x && (P.current && clearTimeout(P.current), P.current = setTimeout(() => {
        Wn()
      }, 50))
    };
    return window.addEventListener("keydown", t, !0), () => window.removeEventListener("keydown", t, !0)
  }, [b, p, Le, pe, X, Xa, Wt, or, ya, va, dr, ee, Je, hr, He, ne, D, Ee, Sa, Ia, $e, o, Nt, A, C, fe, oa, Rr, ca, Ba]);
  const Pa = () => {
    const t = localStorage.getItem("pos_draft");
    if (t) try {
      const a = JSON.parse(t);
      if (S(a.cart || []), Ve(a.note || ""), J(a.amountPaid || 0), me(a.paymentMethod || (localStorage.getItem("unified_pos_mode") === "Wholesale" ? "Debt" : "Cash")), Xe(a.cashGiven || 0), a.selectedPartnerId) {
        const r = Q.find(s => s.id === a.selectedPartnerId);
        L(r || null)
      } else L(null);
      return xa(null), Ja(null), Za(0), !0
    } catch (a) {
      console.error("Error loading draft", a)
    }
    return !1
  };
  i.useEffect(() => {
    if (cs(), ds(), vt.state?.editOrder || Pa(), vt.state?.editOrder) {
      const t = vt.state.editOrder;
      Da(t)
    } else {
      const t = new URLSearchParams(window.location.search),
        a = t.get("edit"),
        r = t.get("partner_id");
      a ? Nn(a) : (r && ma(r), H && (Pa() || rt(!1)))
    }
    dn(!0)
  }, [vt.search, vt.state]);
  const _n = t => {
    Zs(t), localStorage.setItem("unified_pos_mode", t), b.length === 0 && !H && me(t === "Wholesale" ? "Debt" : "Cash")
  };
  i.useEffect(() => {
    D === "Cash" && J(A)
  }, [D, A]), i.useEffect(() => {
    if (es && !H) {
      const t = {
        cart: b,
        selectedPartnerId: p?.id,
        note: pe,
        amountPaid: Le,
        paymentMethod: D,
        cashGiven: ne
      };
      localStorage.setItem("pos_draft", JSON.stringify(t))
    }
  }, [b, p, pe, Le, D, ne, H, es]), i.useEffect(() => {
    localStorage.setItem("held_invoices", JSON.stringify(Ne))
  }, [Ne]), i.useEffect(() => {
    if (Q.length > 0) {
      if (Ya) {
        const t = Q.find(a => a.id == Ya);
        t && (L(t), ma(null), je(""))
      } else if (p) {
        const t = Q.find(a => a.id === p.id);
        t && t.debt_balance !== p.debt_balance && L(t)
      } else if (!H) {
        const t = localStorage.getItem("pos_draft");
        if (t) try {
          const a = JSON.parse(t);
          if (a.selectedPartnerId) {
            const r = Q.find(s => s.id === a.selectedPartnerId);
            r && (L(r), je(""))
          }
        } catch {}
      }
    }
  }, [Q, Ya, H, vt.state]), i.useEffect(() => {
    p?.id && !H && (async () => {
      try {
        const a = await q.post(`/api/partners/${p.id}/recalculate-debt`);
        a.data.new_balance !== void 0 && L(r => !r || r.id !== p.id ? r : {
          ...r,
          debt_balance: a.data.new_balance
        })
      } catch (a) {
        console.error("Error auto-syncing debt:", a)
      }
    })()
  }, [p?.id, H]);
  const Cn = async t => {
    try {
      await q.post("/api/inventory/audit", t), G({
        message: "Đã cập nhật kho thành công!",
        type: "success"
      }), F.invalidateQueries(["products"]);
      const a = new BroadcastChannel("pos_data_sync");
      a.postMessage({
        type: "PRODUCT_UPDATED"
      }), a.close()
    } catch (a) {
      throw console.error(a), G({
        message: "Lỗi khi cập nhật kho",
        type: "error"
      }), a
    }
  }, ds = async () => {
    try {
      const t = await q.get("/api/bank-accounts");
      Ys(t.data), t.data.length > 0 && Gr(t.data[0].id)
    } catch (t) {
      console.error(t)
    }
  }, yr = async t => {
    nr({});
    if (!t) {
      return
    }
    try {
      const a = await q.get(`/api/custom-prices/${t}`);
      nr(a.data)
    } catch (a) {
      console.error(a)
    }
  };
  i.useEffect(() => {
    p ? (yr(p.id), Wr(!0), gt("debt"), q.get(`/api/partners/${p.id}/ledger`).then(t => {
      const a = t.data?.ledger || [],
        r = a.find(n => n.type === "Order" && n.payment_method === "Debt" && (n.increase > 0 || n.obj && n.obj.total_amount > 0)),
        s = a.find(n => n.type === "Order" && n.payment_method !== "Debt" && (n.increase > 0 || n.obj && n.obj.total_amount > 0));
      Ga(r || null), Qa(s || null)
    }).catch(t => {
      console.error("Error fetching partner ledger:", t), Ga(null), Qa(null)
    }).finally(() => {
      Wr(!1)
    })) : (nr({}), Ga(null), Qa(null), gt("debt"))
  }, [p]), i.useEffect(() => {
    const t = a => {
      if (!document.body.contains(a.target)) return;
      !(w.current && w.current.contains(a.target) || be.current && be.current.contains(a.target)) && !a.target.closest(".partner-popout-trigger") && Va(!1)
    };
    return document.addEventListener("mousedown", t), () => document.removeEventListener("mousedown", t)
  }, []), i.useEffect(() => {
    if (!h) return;
    const t = Array.isArray(h) ? h : h.items || [];
    S(a => {
      if (a.length === 0) return a;
      let r = !1;
      const s = a.map(n => {
        const l = t.find(c => c.id === n.product_id);
        if (l) {
          const c = l.stock !== n.stock,
            x = l.unit !== n.unit || l.multiplier !== n.multiplier || l.secondary_unit !== n.secondary_unit;
          let d = E[n.product_id] !== void 0 ? E[n.product_id] : l.sale_price;
          l.bulk_quantity > 0 && n.quantity >= l.bulk_quantity && E[n.product_id] === void 0 && (d = l.bulk_price || d);
          const v = !n.is_manual_price && n.price !== d;
          if (c || x || v) return r = !0, {
            ...n,
            cost_price: l.cost_price,
            stock: l.stock,
            unit: l.unit,
            multiplier: l.multiplier || 1,
            secondary_unit: l.secondary_unit,
            latest_audit: l.latest_audit,
            latest_stock_entry: l.latest_stock_entry,
            price: v ? d : n.price
          }
        }
        return n
      });
      return r ? s : a
    })
  }, [h, E, b.length]), i.useEffect(() => {
    D === "Cash" && J(A)
  }, [A, D]);
  const wr = async () => {
    try {
      await F.invalidateQueries({
        queryKey: ["products"]
      })
    } catch (t) {
      console.error(t)
    }
  }, vr = async () => {
    try {
      await F.invalidateQueries({
        queryKey: ["partners"]
      })
    } catch (t) {
      console.error(t)
    }
  }, ps = async () => {
    if (p) try {
      const {
        data: t
      } = await q.get("/api/partners"), a = t.find(r => r.id === p.id);
      a && L(a), await F.invalidateQueries({
        queryKey: ["partners"]
      })
    } catch (t) {
      console.error("Error syncing partner balance:", t)
    }
  }, Pt = (t, a = null, r = null) => {
    if (xe === 'remote_inspect' && activeRemoteTerminalId) {
      const currentCart = activeRemoteTerm?.cart || [];
      const s = a !== null ? a : 1,
        n = t.sale_price,
        l = E[t.id] !== void 0 ? E[t.id] : n,
        c = r !== null && r !== l,
        x = currentCart.find(j => (t.id !== null ? j.product_id === t.id : j.product_id === null && j.product_name === t.name) && (c ? j.price === (r !== null ? r : l) : !j.is_manual_price)),
        v = (x ? x.quantity : 0) + s;
      let _ = r !== null ? r : l;
      t.bulk_quantity > 0 && v >= t.bulk_quantity && r === null && !c && E[t.id] === void 0 && (_ = t.bulk_price || l);

      let newCart = [];
      if (x) {
        if (v === 0) {
          newCart = currentCart.filter(j => (j.id || j.cartId) !== (x.id || x.cartId));
        } else {
          newCart = currentCart.map(j => (j.id || j.cartId) === (x.id || x.cartId) ? {
            ...j,
            quantity: v,
            price: _,
            secondary_qty: v / (j.multiplier || 1),
            is_manual_price: c || j.is_manual_price,
            isPacked: j.isPacked || !1
          } : j);
        }
      } else {
        const newId = Math.random().toString(36).substr(2, 9);
        newCart = [{
          id: newId,
          cartId: newId,
          product_id: t.id,
          product_name: t.name,
          unit: t.unit,
          secondary_unit: t.secondary_unit,
          multiplier: t.multiplier || 1,
          price: _,
          cost_price: t.cost_price,
          latest_cost_price: t.latest_cost_price,
          quantity: s,
          secondary_qty: s / (t.multiplier || 1),
          stock: t.stock,
          latest_audit: t.latest_audit,
          latest_stock_entry: t.latest_stock_entry,
          is_combo: t.is_combo,
          active_ingredient: t.active_ingredient,
          is_manual_price: c,
          isPacked: !1
        }, ...currentCart];
      }
      handleUpdateRemoteCart(newCart);
      ce("");
      $t(0);
      _e({
        product: null,
        quantity: 0,
        price: 0,
        secondary_qty: 0,
        name: ""
      });
      setTimeout(() => {
        const j = ue.current;
        j && (j.focus(), j.select())
      }, 10);
      return;
    }

    const s = a !== null ? a : 1,
      n = t.sale_price,
      l = E[t.id] !== void 0 ? E[t.id] : n,
      c = r !== null && r !== l,
      x = b.find(j => (t.id !== null ? j.product_id === t.id : j.product_id === null && j.product_name === t.name) && (c ? j.price === (r !== null ? r : l) : !j.is_manual_price)),
      v = (x ? x.quantity : 0) + s;
    let _ = r !== null ? r : l;
    t.bulk_quantity > 0 && v >= t.bulk_quantity && r === null && !c && E[t.id] === void 0 && (_ = t.bulk_price || l), x ? v === 0 ? S(b.filter(j => j.cartId !== x.cartId)) : S(b.map(j => j.cartId === x.cartId ? {
      ...j,
      quantity: v,
      price: _,
      secondary_qty: v / (j.multiplier || 1),
      is_manual_price: c || j.is_manual_price,
      isPacked: j.isPacked || !1
    } : j)) : S([{
      product_id: t.id,
      product_name: t.name,
      unit: t.unit,
      secondary_unit: t.secondary_unit,
      multiplier: t.multiplier || 1,
      price: _,
      cost_price: t.cost_price,
      latest_cost_price: t.latest_cost_price,
      quantity: s,
      secondary_qty: s / (t.multiplier || 1),
      stock: t.stock,
      latest_audit: t.latest_audit,
      latest_stock_entry: t.latest_stock_entry,
      is_combo: t.is_combo,
      active_ingredient: t.active_ingredient,
      is_manual_price: c,
      isPacked: !1,
      cartId: Math.random().toString(36).substr(2, 9)
    }, ...b]);
    if (localStorage.getItem("pos_tts_enable_cart_addition") !== "false" && s !== 0) {
      const displayQty = v <= 0 ? 0 : v;
      const readProductName = localStorage.getItem("pos_tts_enable_cart_product_name") !== "false";
      const speechOrder = localStorage.getItem("pos_tts_cart_speech_order") || "name_first";
      
      if (window.cartSpeechTimeout) {
        clearTimeout(window.cartSpeechTimeout);
        window.cartSpeechTimeout = null;
      }

      if (v === 0) {
        speakNumber("Đã xóa");
      } else {
        const isReturn = v < 0;
        const absQty = Math.abs(v);
        const qtyText = isReturn ? `Trả hàng ${absQty}` : absQty;

        if (readProductName && t.alias && t.alias.trim()) {
          const aliasText = t.alias.trim();
          if (speechOrder === "qty_first") {
            speakNumber(qtyText);
            window.cartSpeechTimeout = setTimeout(() => {
              speakNumber(aliasText);
            }, 1500);
            lastSpokenProductIdRef.current[xe] = t.id;
          } else {
            if (lastSpokenProductIdRef.current[xe] === t.id) {
              speakNumber(qtyText);
            } else {
              speakNumber(`${aliasText}, ${qtyText}`);
              lastSpokenProductIdRef.current[xe] = t.id;
            }
          }
        } else {
          speakNumber(qtyText);
          lastSpokenProductIdRef.current[xe] = t.id;
        }
      }
    }
    ce("");
    $t(0);
    _e({
      product: null,
      quantity: 0,
      price: 0,
      secondary_qty: 0,
      name: ""
    });
    setTimeout(() => {
      const j = ue.current;
      j && (j.focus(), j.select())
    }, 10);
  }, Tn = t => {
    const a = fe[t];
    if (a) {
      S(r => r.map(s => s.cartId === a.cartId ? {
        ...s,
        isPacked: !s.isPacked
      } : s));
      if (!a.isPacked) {
        const prod = z.find(p => p.id === a.product_id);
        const nameText = (prod && prod.alias && prod.alias.trim()) ? prod.alias.trim() : a.product_name;
        speakNumber(`${nameText}, ${a.quantity}`);
      }
    }
  }, ta = (t, a, r) => {
    const s = fe[t];
    s && S(n => n.map(l => {
      if (l.cartId !== s.cartId) return l;
      const c = {
        ...l
      };
      if (a === "secondary_qty" ? (c.secondary_qty = r, c.quantity = r * (c.multiplier || 1)) : a === "quantity" ? (c.quantity = r, c.secondary_qty = r / (c.multiplier || 1)) : a === "price" ? (c.price = r, c.is_manual_price = !0) : c[a] = r, (a === "quantity" || a === "secondary_qty") && !c.is_manual_price) {
        const x = z.find(d => d.id === c.product_id);
        if (x) {
          const d = E[x.id] !== void 0 ? E[x.id] : x.sale_price;
          x.bulk_quantity > 0 && c.quantity >= x.bulk_quantity && E[x.id] === void 0 ? c.price = x.bulk_price || d : c.price = d
        }
      }
      return c
    }))
  }, Sn = (t, a, r = 1) => {
    if (t === xe) {
      const c = a.sale_price,
        x = E[a.id] !== void 0 ? E[a.id] : c;
      Pt(a, r, x);
      return
    }
    const s = te.find(c => c.id === t),
      n = s ? s.name : `Đơn #${t}`,
      l = Date.now() + Math.random();
    if (ot(c => [...c, {
        id: l,
        productName: a.name,
        qty: r,
        tabName: n
      }]), setTimeout(() => {
        ot(c => c.filter(x => x.id !== l))
      }, 2500), Re(c => c.map(x => {
        if (x.id !== t) return x;
        const d = a.sale_price;
        let v = d;
        a.bulk_quantity > 0 && r >= a.bulk_quantity && (v = a.bulk_price || d);
        const _ = x.cart.findIndex(U => U.product_id === a.id && !U.is_manual_price);
        let j;
        if (_ > -1) {
          const U = x.cart[_].quantity + r;
          U <= 0 ? j = x.cart.filter((R, Ce) => Ce !== _) : j = x.cart.map((R, Ce) => Ce !== _ ? R : {
            ...R,
            quantity: U,
            price: a.bulk_quantity > 0 && U >= a.bulk_quantity && a.bulk_price || R.price,
            secondary_qty: U / (R.multiplier || 1)
          })
        } else r > 0 ? j = [{
          product_id: a.id,
          product_name: a.name,
          unit: a.unit,
          secondary_unit: a.secondary_unit,
          multiplier: a.multiplier || 1,
          price: v,
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
        }, ...x.cart] : j = x.cart;
        return {
          ...x,
          cart: j
        }
      })), s) {
      const c = s.cart.findIndex(x => x.product_id === a.id && !x.is_manual_price);
      c > -1 && s.cart[c].quantity
    }
  }, kr = (t, a = null) => {
    const r = a !== null ? a : Ea.current || xe;
    if (t) {
      const d = t.trim().toUpperCase();
      if (d === "THANHTOAN" || d === "THANH_TOAN" || d === "PAY" || d === "IN" || d === "IN_HOA_DON") return $e(!0), !0;
      if (d === "LUUDON" || d === "LUU_DON" || d === "SAVE") return $e(!1), !0;
      if (d === "CMD-TRU" || d === "CMD_TRU" || d === "TRU" || d === "GIAM" || d === "CMD-SUBTRACT") return Ie("subtract"), !0;
      if (d === "CMD-XOA" || d === "CMD_XOA" || d === "XOA" || d === "DELETE" || d === "CMD-DELETE") return Ie("delete"), !0;
      if (d === "CMD-CONG" || d === "CMD_CONG" || d === "CONG" || d === "ADD" || d === "CMD-ADD") return Ie("add"), !0
    }
    let s = null,
      n = 1,
      l = de === "delete",
      c = de === "subtract",
      x = t ? t.trim() : "";
    if (x.toUpperCase().startsWith("DEL-") ? (l = !0, x = x.substring(4)) : x.toUpperCase().startsWith("DELETE-") ? (l = !0, x = x.substring(7)) : x.startsWith("-") && (c = !0, x = x.substring(1)), s = z.find(d => d.code === x || d.barcode === x), !s && x.includes("-")) {
      const d = x.split("-"),
        v = parseInt(d.pop(), 10);
      if (!isNaN(v) && v > 0) {
        const _ = d.join("-");
        s = z.find(j => j.code === _ || j.barcode === _), s && (n = v)
      }
    }
    if (s) {
      const d = l ? -999999 : c ? -n : n;
      return Sn(r, s, d), de !== "add" && Ie("add"), !0
    }
    return !1
  }, jr = i.useRef(kr);
  i.useEffect(() => {
    jr.current = kr
  });
  const Ea = i.useRef(De);
  i.useEffect(() => {
    Ea.current = De
  }, [De]), i.useEffect(() => {
    if (!qe) return;
    let t = !0;
    const a = async () => {
      try {
        let s = !0;
        for (; s && t;) {
          const n = await q.get("/api/remote-scans/pop");
          if (!t) break;
          if (n.data && n.data.barcode) {
            const l = n.data.barcode;
            jr.current(l, Ea.current) || G({
              message: `Mã vạch ${l} không tồn tại`,
              type: "error"
            })
          } else s = !1
        }
      } catch {}
    }, r = setInterval(() => {
      t && a()
    }, 500);
    return () => {
      t = !1, clearInterval(r)
    }
  }, [qe]);
  const In = t => {
      const a = fe[t];
      a && S(r => r.filter(s => s.cartId !== a.cartId))
    },
    us = (t, a) => {
      t && (S([{
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
      }, ...b]), Zt(!1), ea({
        name: "",
        price: ""
      }), setTimeout(() => {
        ue.current?.focus()
      }, 10))
    },
    Dn = t => {
      Qt({
        title: "Xác nhận xóa nợ sổ tay",
        message: `Bạn có chắc chắn muốn xóa khoản nợ ${I(t.total_amount)} VNĐ của ${p?.name}?`,
        onConfirm: async () => {
          try {
            const a = t.id.toString().replace("v_", "");
            await q.delete(`/api/vouchers/${a}`), G({
              message: "Đã xóa khoản nợ thành công!",
              type: "success"
            }), F.invalidateQueries(["partners"]);
            const r = new BroadcastChannel("pos_data_sync");
            r.postMessage({
              type: "PARTNER_UPDATED"
            }), r.close(), xt(!1)
          } catch {
            G({
              message: "Lỗi khi xóa khoản nợ",
              type: "error"
            })
          } finally {
            Qt(null)
          }
        }
      })
    },
    zn = t => {
      Qt({
        title: "Xác nhận hủy đơn hàng",
        message: `Bạn có chắc chắn muốn hủy đơn hàng #${t.display_id||t.id}?`,
        onConfirm: async () => {
          try {
            await q.delete(`/api/orders/${t.id}`), G({
              message: "Đã hủy đơn hàng!",
              type: "success"
            }), xt(!1), wr(), vr()
          } catch {
            G({
              message: "Lỗi khi hủy đơn hàng",
              type: "error"
            })
          } finally {
            Qt(null)
          }
        }
      })
    },
    aa = i.useMemo(() => z.map(t => ({
      ...t,
      _normName: nt((t.name || "").toLowerCase()),
      _normCode: nt((t.code || "").toLowerCase()),
      _normActive: nt((t.active_ingredient || "").toLowerCase()),
      _lowName: (t.name || "").toLowerCase(),
      _lowCode: (t.code || "").toLowerCase(),
      _lowActive: (t.active_ingredient || "").toLowerCase()
    })), [z]),
    st = i.useMemo(() => {
      const t = ee.toLowerCase(),
        a = nt(t);
      return t ? aa.filter(r => r._lowName.includes(t) || r._normName.includes(a) || r._lowCode.includes(t) || r._normCode.includes(a) || r._lowActive.includes(t) || r._normActive.includes(a)).sort((r, s) => {
        const n = x => x._lowName.startsWith(t) ? 0 : x._normName.startsWith(a) ? 1 : x._lowName.includes(t) ? 2 : x._normName.includes(a) ? 3 : x._lowCode.startsWith(t) ? 4 : x._normCode.startsWith(a) ? 5 : x._lowCode.includes(t) || x._normCode.includes(a) ? 6 : x._lowActive.startsWith(t) || x._normActive.startsWith(a) ? 7 : x._lowActive.includes(t) || x._normActive.includes(a) ? 8 : 9,
          l = n(r),
          c = n(s);
        return l !== c ? l - c : r._lowName.localeCompare(s._lowName, "vi", {
          sensitivity: "base"
        })
      }).slice(0, 50) : aa.slice(0, 50)
    }, [aa, ee]),
    Aa = i.useMemo(() => {
      const t = yt.toLowerCase(),
        a = parseInt(t),
        r = nt(t);
      return Q.filter(s => {
        const n = !isNaN(a) && s.id === a,
          l = (s.name || "").toLowerCase();
        return n || l.includes(t) || nt(l).includes(r) || (s.phone || "").includes(t)
      }).sort((s, n) => {
        if (!isNaN(a)) {
          if (s.id === a) return -1;
          if (n.id === a) return 1
        }
        const l = (s.name || "").toLowerCase(),
          c = (n.name || "").toLowerCase(),
          x = l.startsWith(t),
          d = c.startsWith(t);
        return x && !d ? -1 : !x && d ? 1 : l.localeCompare(c, "vi", {
          sensitivity: "base"
        })
      }).slice(0, 50)
    }, [Q, yt]),
    Pn = i.useCallback(() => {
      Ur(!0)
    }, []),
    Nr = i.useCallback(() => {
      Ur(!1)
    }, []),
    _r = i.useCallback(t => {
      if (Ht) {
        const a = t.clientX / window.innerWidth * 100;
        a > 50 && a < 85 && Gs(a)
      }
    }, [Ht]);
  return i.useEffect(() => (window.addEventListener("mousemove", _r), window.addEventListener("mouseup", Nr), () => {
    window.removeEventListener("mousemove", _r), window.removeEventListener("mouseup", Nr)
  }), [_r, Nr]), e.jsx(Xn, {
    reducedMotion: Qe ? "always" : "no-preference",
    transition: Qe ? {
      type: "just"
    } : void 0,
    children: e.jsxs("div", {
      id: "pos-root-container",
      className: u("flex flex-col h-screen bg-transparent font-sans overflow-hidden transition-colors relative z-0", Qe && "gpu-disabled-mode"),
      children: [e.jsx("style", {
        children: `
          :root {
            --pos-accent: ${O.accent};
            --radius-pos: ${O.radius}rem;
            --bg-transparent-blur: ${O.blur}px;
          }
          .pos- {
            backdrop-filter: blur(var(--bg-transparent-blur)) !important;
            border-radius: var(--radius-pos) !important;
          }
        `
      }), e.jsxs("div", {
        className: "flex-1 flex flex-col overflow-hidden no-print",
        children: [e.jsxs("div", {
          className: "p-4 flex gap-6 items-center justify-between print:hidden transition-colors relative z-[3000] bg-transparent",
          children: [e.jsxs("div", {
            className: "flex items-center gap-3 shrink-0",
            children: [e.jsxs("div", {
              className: "flex items-center gap-3 group cursor-default relative",
              children: [e.jsxs("div", {
                className: "flex flex-col",
                children: [e.jsx("h1", {
                  className: "text-2xl font-black text-primary dark:text-[#d4a574] uppercase tracking-tighter flex items-center gap-2 leading-none",
                  children: "BÁN HÀNG"
                }), e.jsx("span", {
                  className: "text-[10px] font-bold text-slate-400",
                  children: "by LyangNghia"
                })]
              }), e.jsx(T, {
                mode: "popLayout",
                initial: !1,
                children: e.jsx(m.div, {
                  initial: {
                    opacity: 0
                  },
                  animate: {
                    opacity: 1
                  },
                  exit: {
                    opacity: 0
                  },
                  transition: {
                    duration: .2
                  },
                  className: "flex items-center",
                  children: e.jsxs("div", {
                    className: "flex items-center bg-transparent px-3 py-1.5 rounded-xl border border-black/10 dark:border-white/10",
                    children: [e.jsx("div", {
                      className: u("w-2 h-2 rounded-full mr-2", H ? "bg-amber-500" : "bg-emerald-500")
                    }), e.jsxs("div", {
                      className: "flex flex-col",
                      children: [e.jsxs("span", {
                        className: "text-[14px] font-black font-mono text-amber-600 dark:text-amber-400 tracking-wider leading-none",
                        children: ["#", ge?.display_id || H || (He > 0 ? He : "MỚI")]
                      }), ge?.date && e.jsxs("span", {
                        className: "text-[9px] font-bold text-slate-500 dark:text-slate-400 mt-0.5 tabular-nums",
                        children: [new Date(ge.date).toLocaleTimeString("vi-VN", {
                          hour: "2-digit",
                          minute: "2-digit"
                        }), " - ", new Date(ge.date).toLocaleDateString("vi-VN", {
                          day: "2-digit",
                          month: "2-digit"
                        })]
                      })]
                    })]
                  })
                }, ge?.id || He || "draft")
              })]
            }), e.jsxs("div", {
              className: "flex gap-1.5 pl-4 border-l border-slate-200 dark:border-slate-800",
              children: [e.jsx(m.button, {
                whileHover: {
                  y: -2,
                  scale: 1.05
                },
                whileTap: {
                  scale: .98
                },
                onClick: () => {
                  const t = {
                    display_id: H ? `Đơn #${H}` : "XEM TRƯỚC",
                    date: new Date().toISOString(),
                    partner_name: p ? p.name : "Khách Lẻ",
                    partner_address: p ? p.address : "",
                    partner_phone: p ? p.phone : "",
                    total_amount: A,
                    amount_paid: Le,
                    payment_method: D,
                    note: pe,
                    old_debt: Dt,
                    partner_id: p ? p.id : null,
                    cash_given: ne,
                    details: fe.map(a => ({
                      ...a
                    }))
                  };
                  tn(t), Bt(!0)
                },
                className: "w-9 h-9 flex items-center justify-center bg-[#059669] hover:bg-[#047857] text-white rounded-full transition-all border border-emerald-500/40 dark:border-emerald-400/40 shadow-sm",
                title: "Xem trước in",
                children: e.jsx(zr, {
                  size: 16,
                  strokeWidth: 2.5
                })
              }), e.jsx(m.button, {
                whileHover: {
                  y: -2,
                  scale: 1.05
                },
                whileTap: {
                  scale: .98
                },
                onClick: gn,
                className: "w-9 h-9 flex items-center justify-center bg-slate-900 hover:bg-slate-800 text-white rounded-full transition-all border border-slate-400/50 dark:border-white/20 shadow-sm",
                title: "Màn hình soạn hàng",
                children: e.jsx(ks, {
                  size: 16,
                  strokeWidth: 2.5
                })
              }), e.jsxs("div", {
                className: "relative",
                ref: voiceSettingsRef,
                children: [e.jsx(m.button, {
                  whileHover: {
                    y: -2,
                    scale: 1.05
                  },
                  whileTap: {
                    scale: .98
                  },
                  onClick: () => setShowVoiceSettings(t => !t),
                  className: u("w-9 h-9 flex items-center justify-center rounded-full transition-all border shadow-sm", showVoiceSettings ? "bg-indigo-600 text-white border-indigo-400" : "bg-slate-900 hover:bg-slate-800 text-white border-slate-400/50 dark:border-white/20"),
                  title: "Cài đặt giọng đọc sản phẩm",
                  children: e.jsx(Volume2, {
                    size: 16,
                    strokeWidth: 2.5
                  })
                }), e.jsx(T, {
                  children: showVoiceSettings && e.jsxs(m.div, {
                    initial: {
                      opacity: 0,
                      y: 10,
                      scale: .95
                    },
                    animate: {
                      opacity: 1,
                      y: 0,
                      scale: 1
                    },
                    exit: {
                      opacity: 0,
                      y: 10,
                      scale: .95
                    },
                    transition: {
                      duration: .15
                    },
                    className: "absolute left-0 mt-2 w-[380px] bg-white/80 dark:bg-slate-950/80 border border-white/20 dark:border-white/15 rounded-3xl shadow-2xl p-5 z-[4000] backdrop-blur-2xl flex flex-col gap-4 text-left",
                    children: [e.jsxs("div", {
                      className: "flex items-center justify-between",
                      children: [e.jsxs("div", {
                        className: "flex flex-col gap-0.5",
                        children: [e.jsx("span", {
                          className: "text-[10px] font-black text-muted-foreground uppercase tracking-widest leading-none",
                          children: "Cấu hình"
                        }), e.jsx("h4", {
                          className: "text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight",
                          children: "Giọng nói & Âm thanh"
                        })]
                      }), e.jsxs("div", {
                        className: "flex bg-slate-100 dark:bg-slate-800/60 p-0.5 rounded-xl border border-slate-200/20",
                        children: [e.jsx("button", {
                          type: "button",
                          onClick: () => setSettingsVoiceTab("general"),
                          className: u("px-3 py-1.5 text-[10px] font-black uppercase rounded-lg transition-all cursor-pointer", settingsVoiceTab === "general" ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-sm" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"),
                          children: "Cơ bản"
                        }), e.jsx("button", {
                          type: "button",
                          onClick: () => setSettingsVoiceTab("templates"),
                          className: u("px-3 py-1.5 text-[10px] font-black uppercase rounded-lg transition-all cursor-pointer", settingsVoiceTab === "templates" ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-sm" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"),
                          children: "Mẫu câu"
                        })]
                      })]
                    }), e.jsx("div", {
                      className: "h-[1px] bg-slate-100 dark:bg-slate-800/50 w-full"
                    }), settingsVoiceTab === "general" && e.jsxs("div", {
                      className: "flex flex-col gap-4.5 animate-in fade-in duration-200",
                      children: [
                        e.jsxs("div", {
                          className: "grid grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-800/20 p-3 rounded-2xl border border-slate-100 dark:border-slate-800/40",
                          children: [
                            e.jsxs("div", {
                              className: "flex flex-col gap-1.5",
                              children: [e.jsx("label", {
                                className: "text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider",
                                children: "Giọng đọc"
                              }), e.jsxs("select", {
                                value: selectedVoice,
                                onChange: handleVoiceChange,
                                className: "w-full text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl px-2.5 py-2 cursor-pointer focus:outline-none hover:bg-slate-50 dark:hover:bg-slate-700 transition-all",
                                children: [e.jsx("option", {
                                  value: "edge-vi-female",
                                  children: "Nữ miền Tây"
                                }), e.jsx("option", {
                                  value: "edge-vi-male",
                                  children: "Nam miền Tây"
                                }), e.jsx("option", {
                                  value: "google",
                                  children: "Google Translate"
                                })]
                              })]
                            }),
                            e.jsxs("div", {
                              className: "flex flex-col gap-1.5",
                              children: [e.jsx("label", {
                                className: "text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider",
                                children: "Tốc độ đọc"
                              }), e.jsxs("select", {
                                value: speechRate.toString(),
                                onChange: handleSpeechRateChange,
                                className: "w-full text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl px-2.5 py-2 cursor-pointer focus:outline-none hover:bg-slate-50 dark:hover:bg-slate-700 transition-all",
                                children: [e.jsx("option", {
                                  value: "1.0",
                                  children: "x1.0 (Thường)"
                                }), e.jsx("option", {
                                  value: "1.2",
                                  children: "x1.2 (Nhanh nhẹ)"
                                }), e.jsx("option", {
                                  value: "1.4",
                                  children: "x1.4 (Nhanh vừa)"
                                }), e.jsx("option", {
                                  value: "1.6",
                                  children: "x1.6 (Rất nhanh)"
                                }), e.jsx("option", {
                                  value: "1.8",
                                  children: "x1.8 (Cực nhanh)"
                                }), e.jsx("option", {
                                  value: "2.0",
                                  children: "x2.0 (Tối đa)"
                                })]
                              })]
                            })
                          ]
                        }),
                        e.jsxs("div", {
                          className: "flex flex-col gap-3 bg-slate-50/50 dark:bg-slate-800/10 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800/30",
                          children: [
                            e.jsx("label", {
                              className: "text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider",
                              children: "Cài đặt giỏ hàng"
                            }),
                            e.jsxs("label", {
                              className: "flex items-center justify-between cursor-pointer select-none group",
                              children: [e.jsx("span", {
                                className: "text-xs font-bold text-slate-600 dark:text-slate-300 group-hover:text-slate-800 dark:group-hover:text-slate-100 transition-colors",
                                children: "Đọc sản phẩm khi thêm giỏ"
                              }), e.jsxs("div", {
                                className: "relative",
                                children: [e.jsx("input", {
                                  type: "checkbox",
                                  checked: enableCartAdditionSpeech,
                                  onChange: handleEnableCartAdditionSpeechChange,
                                  className: "sr-only"
                                }), e.jsx("div", {
                                  className: u("w-9 h-5 rounded-full transition-all duration-300", enableCartAdditionSpeech ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-700")
                                }), e.jsx("div", {
                                  className: u("absolute left-0.5 top-0.5 bg-white w-4 h-4 rounded-full transition-all duration-300 shadow-sm", enableCartAdditionSpeech ? "transform translate-x-4" : "")
                                })]
                              })]
                            }),
                            e.jsxs("label", {
                              className: u("flex items-center justify-between cursor-pointer select-none group transition-opacity duration-200", !enableCartAdditionSpeech && "opacity-50 pointer-events-none"),
                              children: [e.jsx("span", {
                                className: "text-xs font-bold text-slate-600 dark:text-slate-300 group-hover:text-slate-800 dark:group-hover:text-slate-100 transition-colors",
                                children: "Đọc tên sản phẩm"
                              }), e.jsxs("div", {
                                className: "relative",
                                children: [e.jsx("input", {
                                  type: "checkbox",
                                  checked: enableCartProductNameSpeech,
                                  onChange: handleEnableCartProductNameSpeechChange,
                                  className: "sr-only",
                                  disabled: !enableCartAdditionSpeech
                                }), e.jsx("div", {
                                  className: u("w-9 h-5 rounded-full transition-all duration-300", enableCartProductNameSpeech && enableCartAdditionSpeech ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-700")
                                }), e.jsx("div", {
                                  className: u("absolute left-0.5 top-0.5 bg-white w-4 h-4 rounded-full transition-all duration-300 shadow-sm", enableCartProductNameSpeech && enableCartAdditionSpeech ? "transform translate-x-4" : "")
                                })]
                              })]
                            }),
                            e.jsxs("div", {
                              className: u("flex flex-col gap-1.5 transition-opacity duration-200", (!enableCartAdditionSpeech || !enableCartProductNameSpeech) && "opacity-50 pointer-events-none"),
                              children: [
                                e.jsx("span", {
                                  className: "text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider",
                                  children: "Thứ tự đọc giỏ hàng"
                                }),
                                e.jsxs("select", {
                                  value: cartSpeechOrder,
                                  onChange: handleCartSpeechOrderChange,
                                  disabled: !enableCartAdditionSpeech || !enableCartProductNameSpeech,
                                  className: "w-full text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl px-3 py-2 cursor-pointer focus:outline-none hover:bg-slate-50 dark:hover:bg-slate-700 transition-all disabled:cursor-not-allowed",
                                  children: [
                                    e.jsx("option", { value: "name_first", children: "Tên trước, Số lượng sau" }),
                                    e.jsx("option", { value: "qty_first", children: "Số lượng trước, Tên sau" })
                                  ]
                                })
                              ]
                            })
                          ]
                        }),
                        e.jsxs("div", {
                          className: "flex flex-col gap-3 bg-slate-50/50 dark:bg-slate-800/10 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800/30",
                          children: [
                            e.jsx("label", {
                              className: "text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider",
                              children: "Cài đặt thanh toán"
                            }),
                            e.jsxs("label", {
                              className: "flex items-center justify-between cursor-pointer select-none group",
                              children: [e.jsx("span", {
                                className: "text-xs font-bold text-slate-600 dark:text-slate-300 group-hover:text-slate-800 dark:group-hover:text-slate-100 transition-colors",
                                children: "Bật câu cảm ơn khi lưu/in"
                              }), e.jsxs("div", {
                                className: "relative",
                                children: [e.jsx("input", {
                                  type: "checkbox",
                                  checked: enableThankyou,
                                  onChange: handleEnableThankyouChange,
                                  className: "sr-only"
                                }), e.jsx("div", {
                                  className: u("w-9 h-5 rounded-full transition-all duration-300", enableThankyou ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-700")
                                }), e.jsx("div", {
                                  className: u("absolute left-0.5 top-0.5 bg-white w-4 h-4 rounded-full transition-all duration-300 shadow-sm", enableThankyou ? "transform translate-x-4" : "")
                                })]
                              })]
                            })
                          ]
                        })
                      ]
                    }), settingsVoiceTab === "templates" && e.jsxs("div", {
                      className: "flex flex-col gap-4 max-h-[350px] overflow-y-auto pr-1.5 animate-in fade-in duration-200 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700 scrollbar-track-transparent",
                      children: [e.jsxs("div", {
                        className: "flex flex-col gap-2.5 bg-slate-50 dark:bg-slate-800/20 p-3 rounded-2xl border border-slate-100 dark:border-slate-800/40",
                        children: [e.jsx("span", {
                          className: "text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest",
                          children: "1. Đọc số tiền (F10 / Click)"
                        }), e.jsxs("div", {
                          className: "flex flex-col gap-1",
                          children: [e.jsx("label", {
                            className: "text-[9px] font-bold text-slate-400 uppercase",
                            children: "Khách lẻ"
                          }), e.jsx("input", {
                            type: "text",
                            value: currencyTemplate,
                            onChange: handleCurrencyTemplateChange,
                            placeholder: "số tiền của quý khách là {amount} đồng",
                            className: "w-full text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-lg px-2.5 py-1.5 outline-none focus:border-indigo-500 transition-all"
                          })]
                        }), e.jsxs("div", {
                          className: "flex flex-col gap-1",
                          children: [e.jsx("label", {
                            className: "text-[9px] font-bold text-slate-400 uppercase",
                            children: "Khách có tên"
                          }), e.jsx("input", {
                            type: "text",
                            value: currencyPartnerTemplate,
                            onChange: handleCurrencyPartnerTemplateChange,
                            disabled: disablePartnerCurrency,
                            placeholder: "số tiền của {partner} là {amount} đồng",
                            className: "w-full text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-lg px-2.5 py-1.5 outline-none focus:border-indigo-500 transition-all disabled:opacity-50"
                          })]
                        }), e.jsxs("label", {
                          className: "flex items-center justify-between cursor-pointer select-none mt-1",
                          children: [e.jsx("span", {
                            className: "text-[10px] font-bold text-slate-500 dark:text-slate-400",
                            children: "Tắt đọc tên đối tác"
                          }), e.jsxs("div", {
                            className: "relative",
                            children: [e.jsx("input", {
                              type: "checkbox",
                              checked: disablePartnerCurrency,
                              onChange: handleDisablePartnerCurrencyChange,
                              className: "sr-only"
                            }), e.jsx("div", {
                              className: u("w-7 h-4 rounded-full transition-all duration-300", disablePartnerCurrency ? "bg-rose-500" : "bg-slate-300 dark:bg-slate-700")
                            }), e.jsx("div", {
                              className: u("absolute left-0.5 top-0.5 bg-white w-3 h-3 rounded-full transition-all duration-300 shadow-sm", disablePartnerCurrency ? "transform translate-x-3" : "")
                            })]
                          })]
                        })]
                      }), e.jsxs("div", {
                        className: "flex flex-col gap-2.5 bg-slate-50 dark:bg-slate-800/20 p-3 rounded-2xl border border-slate-100 dark:border-slate-800/40",
                        children: [e.jsx("span", {
                          className: "text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest",
                          children: "2. Chuyển khoản (F7)"
                        }), e.jsxs("div", {
                          className: "flex flex-col gap-1",
                          children: [e.jsx("label", {
                            className: "text-[9px] font-bold text-slate-400 uppercase",
                            children: "Khách lẻ"
                          }), e.jsx("input", {
                            type: "text",
                            value: transferTemplate,
                            onChange: handleTransferTemplateChange,
                            placeholder: "số tiền cần chuyển khoản là {amount} đồng",
                            className: "w-full text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-lg px-2.5 py-1.5 outline-none focus:border-indigo-500 transition-all"
                          })]
                        }), e.jsxs("div", {
                          className: "flex flex-col gap-1",
                          children: [e.jsx("label", {
                            className: "text-[9px] font-bold text-slate-400 uppercase",
                            children: "Khách có tên"
                          }), e.jsx("input", {
                            type: "text",
                            value: transferPartnerTemplate,
                            onChange: handleTransferPartnerTemplateChange,
                            disabled: disablePartnerTransfer,
                            placeholder: "số tiền cần chuyển khoản của {partner} là {amount} đồng",
                            className: "w-full text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-lg px-2.5 py-1.5 outline-none focus:border-indigo-500 transition-all disabled:opacity-50"
                          })]
                        }), e.jsxs("label", {
                          className: "flex items-center justify-between cursor-pointer select-none mt-1",
                          children: [e.jsx("span", {
                            className: "text-[10px] font-bold text-slate-500 dark:text-slate-400",
                            children: "Tắt đọc tên đối tác"
                          }), e.jsxs("div", {
                            className: "relative",
                            children: [e.jsx("input", {
                              type: "checkbox",
                              checked: disablePartnerTransfer,
                              onChange: handleDisablePartnerTransferChange,
                              className: "sr-only"
                            }), e.jsx("div", {
                              className: u("w-7 h-4 rounded-full transition-all duration-300", disablePartnerTransfer ? "bg-rose-500" : "bg-slate-300 dark:bg-slate-700")
                            }), e.jsx("div", {
                              className: u("absolute left-0.5 top-0.5 bg-white w-3 h-3 rounded-full transition-all duration-300 shadow-sm", disablePartnerTransfer ? "transform translate-x-3" : "")
                            })]
                          })]
                        })]
                      }), e.jsxs("div", {
                        className: "flex flex-col gap-2.5 bg-slate-50 dark:bg-slate-800/20 p-3 rounded-2xl border border-slate-100 dark:border-slate-800/40",
                        children: [e.jsx("span", {
                          className: "text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest",
                          children: "3. Lời cảm ơn (Lưu/In)"
                        }), e.jsxs("div", {
                          className: "flex flex-col gap-1",
                          children: [e.jsx("label", {
                            className: "text-[9px] font-bold text-slate-400 uppercase",
                            children: "Khách lẻ"
                          }), e.jsx("input", {
                            type: "text",
                            value: thankyouTemplate,
                            onChange: handleThankyouTemplateChange,
                            disabled: !enableThankyou,
                            placeholder: "Cảm ơn quý khách đã chọn Sáu Quý",
                            className: "w-full text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-lg px-2.5 py-1.5 outline-none focus:border-indigo-500 transition-all disabled:opacity-50"
                          })]
                        }), e.jsxs("div", {
                          className: "flex flex-col gap-1",
                          children: [e.jsx("label", {
                            className: "text-[9px] font-bold text-slate-400 uppercase",
                            children: "Khách có tên"
                          }), e.jsx("input", {
                            type: "text",
                            value: thankyouPartnerTemplate,
                            onChange: handleThankyouPartnerTemplateChange,
                            disabled: !enableThankyou || disablePartnerThankyou,
                            placeholder: "Cảm ơn {partner} đã chọn Sáu Quý",
                            className: "w-full text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-lg px-2.5 py-1.5 outline-none focus:border-indigo-500 transition-all disabled:opacity-50"
                          })]
                        }), e.jsxs("label", {
                          className: "flex items-center justify-between cursor-pointer select-none mt-1",
                          children: [e.jsx("span", {
                            className: "text-[10px] font-bold text-slate-500 dark:text-slate-400",
                            children: "Tắt đọc tên đối tác"
                          }), e.jsxs("div", {
                            className: "relative",
                            children: [e.jsx("input", {
                              type: "checkbox",
                              checked: disablePartnerThankyou,
                              onChange: handleDisablePartnerThankyouChange,
                              className: "sr-only"
                            }), e.jsx("div", {
                              className: u("w-7 h-4 rounded-full transition-all duration-300", disablePartnerThankyou ? "bg-rose-500" : "bg-slate-300 dark:bg-slate-700")
                            }), e.jsx("div", {
                              className: u("absolute left-0.5 top-0.5 bg-white w-3 h-3 rounded-full transition-all duration-300 shadow-sm", disablePartnerThankyou ? "transform translate-x-3" : "")
                            })]
                          })]
                        })]
                      })]
                    })]
                  })
                })]
              })
            ]
          })
        ]
      }),
      e.jsxs("div", {
            className: "flex-1 max-w-[800px] flex items-center gap-4",
            children: [e.jsxs("div", {
              className: "flex-1 relative z-50 group/partner",
              onBlur: () => setTimeout(() => Pe(!1), 200),
              children: [e.jsxs("div", {
                className: "relative cursor-pointer group",
                onDoubleClick: t => {
                  t.preventDefault(), p && (Ca(p), Yt(!0))
                },
                children: [e.jsx("div", {
                  className: "absolute left-1.5 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center transition-all group-focus-within/partner:scale-110",
                  children: e.jsx(Oa, {
                    className: "text-primary dark:text-emerald-400",
                    size: 20,
                    strokeWidth: 2.5
                  })
                }), e.jsx("input", {
                  type: "text",
                  className: "w-full pl-14 pr-12 py-3 bg-transparent border border-slate-300 dark:border-white/15 focus:border-primary dark:focus:border-emerald-400 rounded-2xl outline-none font-bold text-[15px] dark:text-white leading-normal transition-all shadow-sm",
                  ref: Vt,
                  placeholder: "Tìm kiếm đối tác (F3)...",
                  value: xe === 'remote_inspect' ? (activeRemoteTerm?.partner ? activeRemoteTerm.partner.name : yt) : (p ? p.name : yt),
                  onFocus: () => {
                    Pe(!0)
                  },
                  onDoubleClick: t => {
                    if (xe === 'remote_inspect') {
                      if (activeRemoteTerm?.partner) {
                        t.stopPropagation(), Ca(activeRemoteTerm.partner), Yt(!0);
                      }
                    } else {
                      p && (t.stopPropagation(), Ca(p), Yt(!0));
                    }
                  },
                  onChange: t => {
                    je(t.target.value);
                    if (xe !== 'remote_inspect') {
                      p && L(null);
                    }
                    Pe(!0);
                    sr(0);
                  },
                  onKeyDown: t => {
                    if (t.key === "ArrowDown") t.preventDefault(), sr(a => {
                      const r = Math.min(a + 1, Aa.length),
                        s = xr.current;
                      if (s) {
                        const n = s.querySelector(`[data-index="${r}"]`);
                        n && n.scrollIntoView({
                          block: "nearest"
                        })
                      }
                      return r
                    });
                    else if (t.key === "ArrowUp") t.preventDefault(), sr(a => {
                      const r = Math.max(a - 1, 0),
                        s = xr.current;
                      if (s) {
                        const n = s.querySelector(`[data-index="${r}"]`);
                        n && n.scrollIntoView({
                          block: "nearest"
                        })
                      }
                      return r
                    });
                    else if (t.key === "Enter") {
                      if (t.preventDefault(), V === 0) {
                        if (xe === 'remote_inspect') handleUpdateRemotePartner(null);
                        else L(null);
                        je(""), Pe(!1);
                      } else if (Aa[V - 1]) {
                        const a = Aa[V - 1];
                        if (xe === 'remote_inspect') handleUpdateRemotePartner(a);
                        else L(a);
                        je(""), Pe(!1);
                      }
                      setTimeout(() => ue.current?.focus(), 50)
                    }
                  }
                }), e.jsx("div", {
                  className: "absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2",
                  children: (xe === 'remote_inspect' ? activeRemoteTerm?.partner : p) ? e.jsx(m.button, {
                    initial: {
                      scale: 0
                    },
                    animate: {
                      scale: 1
                    },
                    onClick: t => {
                      t.stopPropagation();
                      if (xe === 'remote_inspect') {
                        handleUpdateRemotePartner(null);
                      } else {
                        L(null);
                      }
                      je("");
                    },
                    className: "w-7 h-7 flex items-center justify-center rounded-full bg-rose-50 dark:bg-rose-500/10 text-rose-500 hover:bg-rose-100 transition-colors ",
                    children: e.jsx(Se, {
                      size: 14,
                      strokeWidth: 3
                    })
                  }) : e.jsx("span", {
                    className: "text-[10px] font-black opacity-20 border border-current px-1 rounded uppercase tracking-tighter",
                    children: "F3"
                  })
                })]
              }), e.jsx(T, {
                children: Xa && !(xe === 'remote_inspect' ? activeRemoteTerm?.partner : p) && e.jsxs(m.div, {
                  initial: {
                    opacity: 0,
                    y: -5
                  },
                  animate: {
                    opacity: 1,
                    y: 0
                  },
                  exit: {
                    opacity: 0,
                    y: -5
                  },
                  transition: {
                    duration: .15
                  },
                  className: "absolute top-full left-0 right-0 mt-2 dropdown-premium backdrop-blur-xl backdrop-saturate-150 !z-[1000]",
                  style: {
                    backgroundColor: Y.glassBg
                  },
                  ref: xr,
                  children: [e.jsx("div", {
                    className: "absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white/40 to-transparent pointer-events-none"
                  }), e.jsxs("div", {
                    className: "max-h-[450px] overflow-y-auto custom-scrollbar",
                    children: [e.jsxs(m.div, {
                      "data-index": 0,
                      className: u("dropdown-item flex items-center gap-4", V === 0 && "active"),
                      onClick: () => {
                        if (xe === 'remote_inspect') handleUpdateRemotePartner(null);
                        else L(null);
                        je(""), Pe(!1);
                      },
                      children: [e.jsx("div", {
                        className: u("w-12 h-12 rounded-xl flex items-center justify-center transition-all relative z-10", V === 0 ? "bg-primary text-white scale-110 shadow-primary/30" : "bg-transparent text-slate-400"),
                        children: e.jsx(Oa, {
                          size: 24,
                          strokeWidth: 2.5
                        })
                      }), e.jsxs("div", {
                        className: "relative z-10 py-1",
                        children: [e.jsx("p", {
                          className: "font-black uppercase tracking-tight transition-all duration-300",
                          style: {
                            color: V === 0 ? Y.accent : Y.main,
                            fontSize: V === 0 ? "18px" : "16px",
                            transform: V === 0 ? "scale(1.02)" : "scale(1)"
                          },
                          children: "Khách vãng lai"
                        }), e.jsx("p", {
                          className: "text-[10px] font-bold uppercase tracking-widest transition-colors leading-none",
                          style: {
                            color: V === 0 ? Y.accentMuted : Y.muted
                          },
                          children: "Mặc định không lưu nợ"
                        })]
                      })]
                    }), Aa.map((t, a) => e.jsxs(m.div, {
                      "data-index": a + 1,
                      onClick: () => {
                        if (xe === 'remote_inspect') handleUpdateRemotePartner(t);
                        else L(t);
                        je(""), Pe(!1);
                      },
                      className: u("dropdown-item flex justify-between items-center", V === a + 1 && "active"),
                      children: [e.jsxs("div", {
                        className: "flex items-center gap-4 relative z-10",
                        children: [e.jsx("div", {
                          className: u("w-12 h-12 rounded-xl flex items-center justify-center transition-all ", V === a + 1 ? "bg-primary text-white scale-110 shadow-primary/30" : "bg-white dark:bg-slate-700 text-primary"),
                          children: e.jsx(Oa, {
                            size: 24,
                            strokeWidth: 2.5
                          })
                        }), e.jsxs("div", {
                          className: "flex flex-col gap-1",
                          children: [e.jsxs("div", {
                            className: "flex items-center gap-3",
                            children: [e.jsx("span", {
                              className: u("px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest border-2 shrink-0 transition-colors", V === a + 1 ? "bg-primary text-white border-white/40 " : t.is_customer && t.is_supplier ? "bg-blue-500/10 border-blue-500/20 text-blue-500" : t.is_customer ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" : "bg-amber-500/10 border-amber-500/20 text-amber-500"),
                              children: t.is_customer && t.is_supplier ? "KH & NCC" : t.is_customer ? "KH" : "NCC"
                            }), e.jsx("p", {
                              className: "font-black uppercase tracking-tight transition-all duration-300",
                              style: {
                                color: V === a + 1 ? Y.accent : Y.main,
                                fontSize: V === a + 1 ? "18px" : "16px",
                                transform: V === a + 1 ? "scale(1.02)" : "scale(1)"
                              },
                              children: t.name
                            })]
                          }), e.jsxs("div", {
                            className: "flex items-center gap-4 text-[11px] font-black tracking-wide transition-colors",
                            style: {
                              color: V === a + 1 ? Y.accentMuted : Y.muted
                            },
                            children: [e.jsxs("span", {
                              className: "flex items-center gap-1.5",
                              children: [e.jsx(na, {
                                size: 12,
                                strokeWidth: 3,
                                className: "opacity-50"
                              }), " ", t.phone || "---"]
                            }), t.address && e.jsxs("span", {
                              className: "flex items-center gap-1.5 truncate max-w-[180px]",
                              children: [e.jsx(Ha, {
                                size: 12,
                                strokeWidth: 3,
                                className: "opacity-50"
                              }), " ", t.address]
                            })]
                          })]
                        })]
                      }), e.jsxs("div", {
                        className: "text-right relative z-10 flex flex-col items-end gap-1",
                        children: [e.jsx("p", {
                          className: "text-[22px] font-black tabular-nums tracking-tighter leading-none drop- transition-colors",
                          style: {
                            color: V === a + 1 ? Y.accent : t.debt_balance > 0 ? "#e11d48" : "#059669"
                          },
                          children: En(t.debt_balance)
                        }), e.jsx("div", {
                          className: u("px-2 py-0.5 rounded-md border text-[9px] font-black uppercase tracking-widest transition-colors", V === a + 1 ? "bg-white/20 border-white/30 text-white" : "bg-transparent border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400"),
                          children: "Dư nợ hiện tại"
                        })]
                      })]
                    }, t.id))]
                  }), yt && e.jsxs("div", {
                    className: "dropdown-item flex items-center justify-between group/add border-t border-transparent",
                    onClick: () => {
                      Vr(yt), wa(!0), Pe(!1)
                    },
                    children: [e.jsxs("div", {
                      className: "flex items-center gap-4",
                      children: [e.jsx("div", {
                        className: "w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center group-hover/add:rotate-90 transition-transform",
                        children: e.jsx(ft, {
                          size: 22,
                          strokeWidth: 3
                        })
                      }), e.jsxs("div", {
                        children: [e.jsx("p", {
                          className: "text-[10px] font-black uppercase tracking-widest opacity-50",
                          children: "Đối tác mới"
                        }), e.jsxs("p", {
                          className: "text-[14px] font-black uppercase tracking-tight",
                          children: ['Tạo nhanh "', yt, '"']
                        })]
                      })]
                    }), e.jsx(Sr, {
                      size: 24,
                      strokeWidth: 3,
                      className: "opacity-30 group-hover/add:translate-x-1 transition-transform"
                    })]
                  })]
                })
              })]
            }), e.jsxs("div", {
              className: "flex items-center gap-2 shrink-0",
              children: [e.jsxs(m.button, {
                whileHover: {
                  y: -2
                },
                whileTap: {
                  scale: .98
                },
                onClick: () => ct(!0),
                className: "relative w-9 h-9 bg-amber-500 hover:bg-amber-600 text-white rounded-full flex items-center justify-center border border-amber-600/40 dark:border-amber-400/40 shadow-sm group",
                children: [e.jsx(At, {
                  size: 16,
                  strokeWidth: 2.5,
                  className: "relative z-10"
                }), Ne.length > 0 && e.jsx(m.span, {
                  initial: {
                    scale: 0
                  },
                  animate: {
                    scale: 1
                  },
                  className: "absolute -top-1.5 -right-1.5 bg-rose-600 text-white text-[9px] min-w-[20px] h-5 rounded-full flex items-center justify-center font-black border border-white px-1 z-20",
                  children: Ne.length
                })]
              }), e.jsxs(m.div, {
                className: "flex items-center rounded-full border border-slate-300 dark:border-white/15 bg-transparent p-0.5 transition-colors shadow-sm",
                children: [e.jsx(m.button, {
                  onClick: () => za("prev"),
                  whileTap: {
                    scale: .9
                  },
                  className: "w-8 h-8 flex items-center justify-center transition-colors rounded-full bg-amber-500 text-black hover:bg-amber-600 border border-amber-600/40",
                  title: "Đơn trước",
                  children: e.jsx(js, {
                    size: 16,
                    strokeWidth: 2.5
                  })
                }), e.jsx(m.button, {
                  whileTap: {
                    scale: .98
                  },
                  onClick: () => He !== 0 && !Pa() && rt(),
                  className: "px-3 flex items-center justify-center min-w-[70px]",
                  children: e.jsx("span", {
                    className: u("text-[12px] font-black uppercase tracking-tighter", He === 0 ? "text-primary dark:text-emerald-400" : "text-amber-500 dark:text-amber-400"),
                    children: ge?.display_id ? `#${ge.display_id}` : H ? `#${H}` : "MỚI"
                  })
                }), e.jsx(m.button, {
                  onClick: () => za("next"),
                  disabled: He === 0,
                  whileTap: {
                    scale: .9
                  },
                  className: u("w-8 h-8 flex items-center justify-center transition-colors rounded-full", He === 0 ? "text-slate-200 dark:text-slate-800" : "bg-amber-500 text-black hover:bg-amber-600 border border-amber-600/40"),
                  children: e.jsx(Sr, {
                    size: 16,
                    strokeWidth: 2.5
                  })
                })]
              }), wt && e.jsxs("div", {
                className: "relative group flex items-center bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 w-9 h-9 rounded-full justify-center transition-all cursor-pointer border border-slate-300 dark:border-white/15 hover:border-amber-400 shadow-sm",
                children: [e.jsx(bt, {
                  size: 16,
                  strokeWidth: 2.5,
                  className: "text-amber-500"
                }), e.jsxs("div", {
                  className: "absolute top-full left-1/2 -translate-x-1/2 mt-2 w-52 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-[1000] text-left",
                  children: [e.jsx("p", {
                    className: "text-[10px] font-black text-amber-500 uppercase tracking-wider mb-1",
                    children: "Đơn hàng vừa qua"
                  }), e.jsxs("div", {
                    className: "space-y-1 text-[11px] font-medium font-sans",
                    children: [e.jsxs("div", {
                      className: "flex justify-between",
                      children: [e.jsx("span", {
                        className: "text-slate-400",
                        children: "Mã đơn:"
                      }), e.jsxs("span", {
                        className: "font-bold text-slate-800 dark:text-slate-200",
                        children: ["#", wt.display_id || wt.id]
                      })]
                    }), e.jsxs("div", {
                      className: "flex justify-between",
                      children: [e.jsx("span", {
                        className: "text-slate-400",
                        children: "Khách:"
                      }), e.jsx("span", {
                        className: "font-bold text-slate-800 dark:text-slate-200 truncate max-w-[110px]",
                        title: wt.partner_name || "Khách lẻ",
                        children: wt.partner_name || "Khách lẻ"
                      })]
                    }), e.jsxs("div", {
                      className: "flex justify-between border-t border-slate-100 dark:border-slate-800 pt-1.5 mt-1",
                      children: [e.jsx("span", {
                        className: "text-slate-400 font-bold",
                        children: "Tổng tiền:"
                      }), e.jsx("span", {
                        className: "font-black text-emerald-500 text-[12px]",
                        children: it(wt.total_amount || 0)
                      })]
                    })]
                  })]
                })]
              }), e.jsxs(m.button, {
                whileHover: {
                  y: -2
                },
                whileTap: {
                  scale: .98
                },
                onClick: () => _n(ye === "Retail" ? "Wholesale" : "Retail"),
                className: "relative w-9 h-9 bg-transparent dark:bg-slate-950/90 backdrop-blur-sm text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-full transition-all flex items-center justify-center border border-emerald-600/30 dark:border-emerald-400/30 hover:border-emerald-500 shadow-sm",
                children: [ye === "Wholesale" ? e.jsx(si, {
                  size: 16,
                  strokeWidth: 2.5
                }) : e.jsx(Oa, {
                  size: 16,
                  strokeWidth: 2.5
                }), e.jsx("div", {
                  className: u("absolute bottom-2 right-2 w-2 h-2 rounded-full border border-white", ye === "Wholesale" ? "bg-emerald-500" : "bg-emerald-400")
                })]
              }), e.jsx(T, {
                mode: "popLayout",
                children: p && e.jsx(m.button, {
                  initial: {
                    opacity: 0,
                    x: -10
                  },
                  animate: {
                    opacity: 1,
                    x: 0
                  },
                  exit: {
                    opacity: 0,
                    x: -10
                  },
                  whileHover: {
                    y: -2
                  },
                  whileTap: {
                    scale: .98
                  },
                  onClick: () => xt(!0),
                  className: "w-9 h-9 bg-[#059669] hover:bg-[#047857] text-white rounded-full transition-all flex items-center justify-center  shadow-emerald-200/50 border-2 border-white/20",
                  title: "Lịch sử mua hàng",
                  children: e.jsx(Ot, {
                    size: 16,
                    strokeWidth: 2.5
                  })
                })
              })]
            })]
          }), e.jsx("div", {
            className: "flex items-center gap-4 shrink-0",
            children: e.jsxs("div", {
              className: "flex items-center gap-4 ml-auto",
              children: [e.jsx(T, {
                mode: "popLayout",
                children: p && p.yearly_revenue > 0 && e.jsxs(m.div, {
                  layout: !0,
                  initial: {
                    opacity: 0,
                    x: 20,
                    scale: .8
                  },
                  animate: {
                    opacity: 1,
                    x: 0,
                    scale: 1
                  },
                  exit: {
                    opacity: 0,
                    x: 20,
                    scale: .8
                  },
                  className: "hidden xl:flex items-center gap-3 bg-gradient-to-br from-blue-500/10 to-teal-500/5 dark:bg-slate-900/40 rounded-2xl px-4 py-2 border border-slate-100 dark:border-slate-800 ",
                  children: [e.jsx("div", {
                    className: "w-9 h-9 bg-blue-500 text-white rounded-xl flex items-center justify-center ",
                    children: e.jsx(ni, {
                      size: 18,
                      strokeWidth: 3
                    })
                  }), e.jsxs("div", {
                    children: [e.jsx("p", {
                      className: "text-[8px] font-black text-blue-500 uppercase tracking-widest leading-none mb-1",
                      children: "Doanh thu năm"
                    }), e.jsx("p", {
                      className: "text-[15px] font-black text-slate-800 dark:text-blue-300 tabular-nums leading-none",
                      children: I(p.yearly_revenue)
                    })]
                  })]
                })
              }), e.jsx(Qn, {
                variant: "purchase",
                gpuDisabled: Qe
              })]
            })
          })]
        }), e.jsx(T, {
          children: Wt && e.jsx(Be, {
            children: e.jsxs("div", {
              className: "fixed inset-0 z-[2000] flex justify-end font-sans",
              children: [e.jsx(m.div, {
                initial: {
                  opacity: 0
                },
                animate: {
                  opacity: 1
                },
                exit: {
                  opacity: 0
                },
                className: "absolute inset-0 bg-black/40 backdrop-blur-md",
                onClick: () => ct(!1)
              }), e.jsxs(m.div, {
                initial: {
                  x: "100%",
                  opacity: 0
                },
                animate: {
                  x: 0,
                  opacity: 1
                },
                exit: {
                  x: "100%",
                  opacity: 0
                },
                transition: {
                  type: "spring",
                  damping: 32,
                  stiffness: 260
                },
                className: "relative w-full max-w-[440px] h-full bg-[#022c22]/95 backdrop-blur-[100px]  flex flex-col border-l border-white/10",
                children: [e.jsxs("div", {
                  className: "p-5 border-b border-white/10 relative overflow-hidden group",
                  children: [e.jsx("div", {
                    className: "absolute top-0 right-0 p-8 opacity-[0.03] -rotate-12 translate-x-4 -translate-y-4 pointer-events-none transition-transform group-hover:scale-110 duration-700 text-white",
                    children: e.jsx(At, {
                      size: 100
                    })
                  }), e.jsxs("div", {
                    className: "flex justify-between items-center relative z-10",
                    children: [e.jsxs("div", {
                      className: "flex items-center gap-4",
                      children: [e.jsx("div", {
                        className: "w-9 h-9 bg-white/10 rounded-xl flex items-center justify-center text-amber-400 border border-white/10",
                        children: e.jsx(At, {
                          size: 18,
                          strokeWidth: 2.5
                        })
                      }), e.jsxs("div", {
                        children: [e.jsx("h3", {
                          className: "font-black text-[14px] text-white uppercase tracking-tighter leading-none mb-1",
                          children: "Hóa đơn chờ"
                        }), e.jsxs("p", {
                          className: "text-[9px] font-bold text-amber-400 uppercase tracking-widest flex items-center gap-2",
                          children: [e.jsx("span", {
                            className: "w-1 h-1 rounded-full bg-amber-500"
                          }), "Đang treo (", Ne.length, ")"]
                        })]
                      })]
                    }), e.jsx("button", {
                      onClick: () => ct(!1),
                      className: "w-9 h-9 flex items-center justify-center bg-white/10 hover:bg-rose-500/20 text-white/60 hover:text-rose-400 rounded-xl transition-all hover:rotate-90 border border-white/10 ",
                      children: e.jsx(Se, {
                        size: 16,
                        strokeWidth: 3
                      })
                    })]
                  })]
                }), e.jsx("div", {
                  className: "flex-1 overflow-y-auto no-scrollbar px-5 py-6 space-y-4",
                  children: Ne.length === 0 ? e.jsxs("div", {
                    className: "text-center py-40 opacity-20",
                    children: [e.jsx(At, {
                      size: 60,
                      strokeWidth: 1,
                      className: "mx-auto mb-8 text-white"
                    }), e.jsx("p", {
                      className: "font-black uppercase text-[10px] tracking-[0.4em] text-white",
                      children: "Trống trải..."
                    })]
                  }) : e.jsx(T, {
                    mode: "popLayout",
                    children: Ne.map((t, a) => e.jsxs(m.div, {
                      id: a === 0 ? "first-held-card" : void 0,
                      tabIndex: 0,
                      layout: !0,
                      initial: {
                        opacity: 0,
                        x: 20
                      },
                      animate: {
                        opacity: 1,
                        x: 0
                      },
                      exit: {
                        opacity: 0,
                        scale: .9,
                        x: 20
                      },
                      transition: {
                        delay: a * .04
                      },
                      className: "bg-white/[0.04] border border-white/5 rounded-2xl p-4 hover:border-amber-500/40 focus:border-amber-500 focus:bg-white/[0.08] transition-all group hover:bg-white/[0.08] outline-none focus:outline-none cursor-pointer",
                      onKeyDown: r => {
                        if (r.key === "ArrowDown") {
                          r.preventDefault();
                          const s = r.currentTarget.nextElementSibling;
                          s && s.focus()
                        } else if (r.key === "ArrowUp") {
                          r.preventDefault();
                          const s = r.currentTarget.previousElementSibling;
                          s && s.focus()
                        } else r.key === "Enter" && (r.preventDefault(), os(t))
                      },
                      children: [e.jsx("div", {
                        className: "flex justify-between items-start mb-3",
                        children: e.jsxs("div", {
                          className: "flex-1 pr-3 min-w-0",
                          children: [e.jsx("div", {
                            className: "font-black text-white uppercase text-xs leading-tight group-hover:text-amber-400 transition-colors truncate",
                            children: t.partner ? t.partner.name : "KHÁCH BÁN LẺ"
                          }), e.jsxs("div", {
                            className: "flex items-center gap-3 mt-1.5",
                            children: [e.jsx("div", {
                              className: "text-[8px] font-black text-white/30 bg-white/5 px-1.5 py-0.5 rounded uppercase tracking-wider tabular-nums border border-white/5",
                              children: t.time
                            }), e.jsxs("div", {
                              className: "text-[8px] font-black text-amber-400 bg-amber-500/5 px-1.5 py-0.5 rounded border border-amber-500/10 uppercase tracking-widest",
                              children: [t.cart.length, " món"]
                            })]
                          })]
                        })
                      }), t.cart && t.cart.length > 0 && e.jsxs("div", {
                        className: "border-t border-white/5 mt-2 pt-2 flex flex-wrap gap-1 mb-3",
                        children: [t.cart.slice(0, 3).map((r, s) => e.jsxs("div", {
                          className: "px-1.5 py-0.5 bg-amber-500/5 border border-amber-500/10 rounded-md text-[8px] font-black text-amber-400/90 uppercase flex items-center gap-1 transition-all hover:bg-amber-500/10",
                          children: [e.jsx("span", {
                            className: "truncate max-w-[70px]",
                            children: r.product_name
                          }), e.jsx("div", {
                            className: "w-px h-1.5 bg-amber-500/20"
                          }), e.jsx("span", {
                            className: "text-amber-300",
                            children: I(r.quantity)
                          })]
                        }, s)), t.cart.length > 3 && e.jsxs("div", {
                          className: "px-1.5 py-0.5 bg-white/5 border border-white/5 rounded-md text-[8px] font-black text-white/30 uppercase tracking-tighter",
                          children: ["+", t.cart.length - 3, " món"]
                        })]
                      }), e.jsxs("div", {
                        className: "flex justify-between items-center bg-black/20 p-3 rounded-xl border border-white/5",
                        children: [e.jsx("div", {
                          className: "text-amber-400 font-black text-lg tracking-tighter tabular-nums",
                          children: I(t.total)
                        }), e.jsxs("div", {
                          className: "flex gap-2",
                          children: [e.jsx(m.button, {
                            whileHover: {
                              scale: 1.05
                            },
                            whileTap: {
                              scale: .95
                            },
                            onClick: () => jn(t.id),
                            className: "p-1.5 bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white rounded-lg transition-all border border-rose-500/10 active:scale-95 flex items-center justify-center",
                            title: "Xóa hóa đơn chờ",
                            children: e.jsx(Ar, {
                              size: 12,
                              strokeWidth: 2.5
                            })
                          }), e.jsx(m.button, {
                            whileHover: {
                              scale: 1.05
                            },
                            whileTap: {
                              scale: .95
                            },
                            onClick: () => os(t),
                            className: "bg-amber-500/20 hover:bg-amber-500 text-amber-400 hover:text-white px-4 py-1.5 rounded-lg font-black text-[9px] uppercase tracking-widest transition-all border border-amber-500/10 active:scale-95",
                            children: "MỞ LẠI"
                          })]
                        })]
                      })]
                    }, t.id))
                  })
                }), e.jsx("div", {
                  className: "p-5 border-t border-white/10",
                  children: e.jsx("button", {
                    onClick: () => ct(!1),
                    className: "w-full py-3.5 rounded-xl border border-white/10 text-white/30 font-black uppercase text-[9px] hover:bg-white/5 hover:text-white transition-all tracking-[0.3em] active:scale-[0.98]",
                    children: "Đóng"
                  })
                })]
              })]
            })
          })
        }), e.jsxs("div", {
          className: "flex-1 flex gap-3 px-4 pb-4 print:hidden min-h-0",
          children: [e.jsx(m.div, {
            initial: !1,
            animate: {
              width: Lt ? `${Fr}%` : "calc(100% - 100px)"
            },
            transition: Ht ? {
              duration: 0
            } : {
              type: "spring",
              stiffness: 300,
              damping: 30
            },
            className: "flex flex-col min-h-0",
            children: e.jsx("div", {
              className: "flex-1 overflow-hidden relative transition-all duration-500 rounded-[2.7rem] bg-transparent border border-[#8b6f47]/30 dark:border-emerald-500/25 shadow-md shadow-black/5 dark:shadow-emerald-950/20",
              children: e.jsxs("div", {
                className: "w-full h-full rounded-[2.5rem] overflow-hidden relative bg-transparent",
                children: [e.jsx("div", {
                  className: "absolute inset-0 overflow-auto no-scrollbar-on-empty z-10",
                  children: e.jsx("div", {
                    className: "min-w-[1000px] transition-colors relative pb-[400px]",
                    children: e.jsxs("table", {
                      className: "w-full text-left border-collapse",
                      children: [e.jsxs("thead", {
                        className: "bg-transparent sticky top-0 z-[100] print:hidden border-b border-transparent",
                        children: [e.jsxs("tr", {
                          className: "border-none",
                          children: [e.jsx("th", {
                            rowSpan: 2,
                            className: "py-1.5 px-2 w-14 text-center align-middle font-black uppercase text-[9px] tracking-widest text-slate-400 border-r border-white/10 dark:border-slate-800/20 whitespace-nowrap",
                            children: "Stt"
                          }), e.jsx("th", {
                            rowSpan: 2,
                            className: "py-1.5 px-2 w-10 text-center align-middle font-black uppercase text-[9px] tracking-widest text-slate-400 border-r border-white/10 dark:border-slate-800/20 whitespace-nowrap",
                            children: "Soạn"
                          }), e.jsx("th", {
                            className: "px-4 py-1 align-middle min-w-[450px] whitespace-nowrap",
                            children: e.jsxs("div", {
                              className: "flex items-center justify-between w-full gap-4",
                              children: [e.jsxs("div", {
                                onClick: t => {
                                  t.stopPropagation();
                                  const a = X.ui_enable_smart_sorting === "true" ? "false" : "true";
                                  ga(s => ({
                                    ...s,
                                    ui_enable_smart_sorting: a
                                  })), localStorage.setItem("ui_enable_smart_sorting", a), new BroadcastChannel("pos_data_sync").postMessage({
                                    type: "UI_SETTING_UPDATED",
                                    key: "ui_enable_smart_sorting",
                                    value: a
                                  })
                                },
                                className: "flex items-center gap-3 group/sort-wrapper cursor-pointer shrink-0",
                                children: [e.jsx("span", {
                                  className: "font-black uppercase tracking-[0.1em] text-[9px] text-slate-500/80 dark:text-slate-400 group-hover/sort-wrapper:text-primary transition-colors",
                                  children: "Danh mục sản phẩm"
                                }), e.jsx("div", {
                                  className: u("relative w-14 h-5 rounded-lg p-0.5 transition-all duration-500 border", X.ui_enable_smart_sorting === "true" ? "bg-primary/20 border-primary/30 " : "bg-transparent-panel0/10 border-slate-500/20"),
                                  children: e.jsx(m.div, {
                                    layout: !0,
                                    transition: {
                                      type: "spring",
                                      stiffness: 400,
                                      damping: 30
                                    },
                                    className: u("absolute inset-y-0.5 w-[55%] rounded-md flex items-center justify-center gap-1  text-[7px] font-black uppercase tracking-tighter transition-all", X.ui_enable_smart_sorting === "true" ? "right-0.5 bg-primary text-white" : "left-0.5 bg-white/40 text-slate-500"),
                                    children: X.ui_enable_smart_sorting === "true" ? "AUTO" : "MAN"
                                  })
                                })]
                              }), e.jsxs("div", {
                                className: "flex items-center gap-1 overflow-x-auto no-scrollbar shrink-0",
                                children: [te.map((t, a) => {
                                  const r = t.id === xe,
                                    s = t.id === De;
                                  return e.jsxs("div", {
                                    className: "group/tab relative shrink-0",
                                    children: [e.jsxs("button", {
                                      onClick: n => {
                                        n.stopPropagation(), Fs(t.id)
                                      },
                                      className: `
                                            relative flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-black tracking-widest transition-all border
                                            ${r?"bg-primary border-primary text-white shadow-md shadow-primary/10":"bg-transparent border border-slate-300 dark:border-white/25 text-slate-600 dark:text-slate-300 hover:border-primary dark:hover:border-emerald-400 hover:bg-black/5 dark:hover:bg-white/5"}
                                          `,
                                      children: [s && e.jsxs("span", {
                                        className: "flex items-end gap-[1.5px] h-2.5 mr-1.5 pb-[1px] shrink-0",
                                        children: [e.jsx("span", {
                                          className: `w-[2px] rounded-full ${r?"bg-white":"bg-blue-500"}`,
                                          style: {
                                            height: "40%"
                                          }
                                        }), e.jsx("span", {
                                          className: `w-[2px] rounded-full ${r?"bg-white":"bg-blue-500"}`,
                                          style: {
                                            height: "70%"
                                          }
                                        }), e.jsx("span", {
                                          className: `w-[2px] rounded-full ${r?"bg-white":"bg-blue-500"}`,
                                          style: {
                                            height: "100%"
                                          }
                                        })]
                                      }), e.jsxs("span", {
                                        children: ["T", a + 1]
                                      }), te.length > 1 && e.jsx("span", {
                                        className: `inline-flex items-center justify-center w-3.5 h-3.5 rounded-full ml-1 hover:bg-rose-500/20 hover:text-rose-500 transition-colors ${r?"text-white/50":"text-slate-400/50"}`,
                                        onClick: n => {
                                          n.stopPropagation(), Ks(t.id, n)
                                        },
                                        children: "✕"
                                      })]
                                    }), !s && e.jsx("div", {
                                      className: "absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 opacity-0 group-hover/tab:opacity-100 pointer-events-none group-hover/tab:pointer-events-auto transition-opacity z-50",
                                      children: e.jsx("button", {
                                        onClick: n => {
                                          n.stopPropagation(), Me(t.id)
                                        },
                                        className: "bg-slate-800 text-white text-[9px] px-1.5 py-0.5 rounded-lg shadow-xl flex items-center gap-0.5 hover:bg-blue-600 transition-colors border border-white/20",
                                        children: "Ghim quét"
                                      })
                                  })
                                ]
                              })
                                                                  }),
                                      activeRemoteTerminalId && e.jsxs("div", {
                                        className: "group/tab relative shrink-0",
                                        children: [
                                          e.jsxs("button", {
                                            onClick: n => {
                                              n.stopPropagation();
                                              Ke('remote_inspect');
                                            },
                                            className: `relative flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-black tracking-widest transition-all border cursor-pointer ${
                                              xe === 'remote_inspect'
                                                ? "bg-emerald-600 border-emerald-600 text-white shadow-none"
                                                : "bg-transparent border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 shadow-none"
                                            }`,
                                            children: [
                                              e.jsx(Satellite, { size: 12, className: "mr-1 shrink-0 text-inherit" }),
                                              e.jsxs("span", {
                                                className: "font-extrabold flex items-center gap-0.5 text-inherit",
                                                children: [
                                                  ".",
                                                  (() => {
                                                    const ip = activeRemoteTerm?.ip_address || (activeRemoteTerminalId.includes('.') ? activeRemoteTerminalId : '');
                                                    if (!ip) return 'LOCAL';
                                                    const parts = ip.split('.');
                                                    return parts[parts.length - 1];
                                                  })()
                                                ]
                                              }),
                                              e.jsx("span", {
                                                className: "inline-flex items-center justify-center w-3.5 h-3.5 rounded-full ml-1 hover:bg-emerald-500/20 hover:text-emerald-600 transition-colors text-emerald-500/50",
                                                onClick: n => {
                                                  n.stopPropagation();
                                                  setActiveRemoteTerminalId(null);
                                                  if (xe === 'remote_inspect') {
                                                    Ke(te[0]?.id || 'tab1');
                                                  }
                                                },
                                                children: "✕"
                                              })
                                            ]
                                          })
                                        ]
                                      }), te.length < 5 && e.jsx("button", {
                                   onClick: t => {
                                     t.stopPropagation(), Us()
                                   },
                                   className: "w-5 h-5 flex items-center justify-center bg-transparent border border-dashed border-black/25 dark:border-white/25 rounded-md text-slate-400 hover:text-primary hover:border-primary hover:bg-primary/5 transition-all text-[9px]",
                                   title: "Thêm đơn mới",
                                   children: "＋"
                                 }), e.jsxs("div", {
                                   className: "relative shrink-0 ml-2 pl-2 border-l border-slate-300 dark:border-white/25",
                                   children: [
                                     e.jsxs("button", {
                                       ref: mirrorDropdownRef,
                                       onClick: evt => {
                                         evt.stopPropagation();
                                         setIsMirrorDropdownOpen(!isMirrorDropdownOpen);
                                       },
                                       className: `relative w-6 h-6 rounded-lg flex items-center justify-center transition-all cursor-pointer shadow-none border-none bg-transparent ${
                                         isMirrorDropdownOpen || activeRemoteTerminalId
                                           ? "text-emerald-500"
                                           : "text-slate-500 dark:text-slate-400 hover:text-emerald-500 hover:bg-emerald-500/10"
                                       }`,
                                       title: (() => {
                                         const seen = new Set();
                                         const uniqueTerms = remoteTerminals.filter(t => {
                                           const ip = t.ip_address || t.terminal_id;
                                           if (ip && !seen.has(ip)) {
                                             seen.add(ip);
                                             return true;
                                           }
                                           return false;
                                         });
                                         return `Giám sát máy trạm (${uniqueTerms.length} máy online)`;
                                       })(),
                                       children: [
                                         e.jsx(Tv, { size: 14, className: (isMirrorDropdownOpen || activeRemoteTerminalId) ? "text-emerald-500" : "" }),
                                         (() => {
                                           const seen = new Set();
                                           const uniqueTerms = remoteTerminals.filter(t => {
                                             const ip = t.ip_address || t.terminal_id;
                                             if (ip && !seen.has(ip)) {
                                               seen.add(ip);
                                               return true;
                                             }
                                             return false;
                                           });
                                           return uniqueTerms.length > 0 && e.jsx("span", {
                                             className: "absolute top-0 right-0 flex h-3 w-3 items-center justify-center rounded-full bg-emerald-500 text-[7px] font-black text-white shadow-sm",
                                             children: uniqueTerms.length
                                           });
                                         })()
                                       ]
                                     }),
                                      e.jsx(T, {
                                        children: isMirrorDropdownOpen ? e.jsx(Portal, {
                                           children: e.jsxs(m.div, {
                                             initial: { opacity: 0, scale: 0.95, y: -10 },
                                             animate: { opacity: 1, scale: 1, y: 0 },
                                             exit: { opacity: 0, scale: 0.95, y: -10 },
                                             transition: { duration: 0.15, ease: "easeOut" },
                                             style: (() => {
                                               if (mirrorDropdownRef.current) {
                                                 const rect = mirrorDropdownRef.current.getBoundingClientRect();
                                                 return {
                                                   position: "fixed",
                                                   top: (rect.bottom + 6) + "px",
                                                   left: Math.max(10, rect.left) + "px",
                                                   zIndex: 99999
                                                 };
                                               }
                                               return { position: "fixed", top: "100px", left: "100px", zIndex: 99999 };
                                             })(),
                                             className: "w-[340px] bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl border border-slate-200 dark:border-emerald-500/20 rounded-[2rem] shadow-[0_20px_60px_rgba(16,185,129,0.12)] p-4 space-y-3.5 text-slate-900 dark:text-white ring-1 ring-black/5 dark:ring-white/5",
                                             onClick: evt => evt.stopPropagation(),
                                             children: [
                                               e.jsxs("div", {
                                                 className: "pb-2 border-b border-slate-100 dark:border-slate-800/60 flex items-center justify-between",
                                                 children: [
                                                   e.jsx("span", {
                                                     className: "text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-400",
                                                     children: e.jsxs("div", {
                                                       className: "flex items-center gap-1.5",
                                                       children: [
                                                         e.jsx(Tv, { size: 12, className: "text-emerald-500" }),
                                                         "MÁY TRẠM HOẠT ĐỘNG"
                                                       ]
                                                     })
                                                   }),
                                                   e.jsx("button", {
                                                     onClick: () => setIsMirrorDropdownOpen(false),
                                                     className: "text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 text-sm font-black p-1 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer",
                                                     children: "✕"
                                                   })
                                                 ]
                                               }),
                                               e.jsx("div", {
                                                 className: "max-h-64 overflow-y-auto custom-scrollbar space-y-2 pr-1",
                                                 children: (() => {
                                                   // Deduplicate by IP address
                                                   const seenIps = new Set();
                                                   const filteredTerminals = [];
                                                   // Sort to prioritize non-generic names
                                                   const sortedTerms = [...remoteTerminals].sort((a, b) => {
                                                     const aGen = (a.terminal_name || '').includes('MÁY POS') || (a.terminal_id || '').includes('127.0.0.1');
                                                     const bGen = (b.terminal_name || '').includes('MÁY POS') || (b.terminal_id || '').includes('127.0.0.1');
                                                     if (aGen && !bGen) return 1;
                                                     if (!aGen && bGen) return -1;
                                                     return (b.terminal_id || '').length - (a.terminal_id || '').length;
                                                   });

                                                   for (const term of sortedTerms) {
                                                     const ip = term.ip_address || term.terminal_id;
                                                     if (ip && !seenIps.has(ip)) {
                                                       seenIps.add(ip);
                                                       filteredTerminals.push(term);
                                                     }
                                                   }

                                                   if (filteredTerminals.length === 0) {
                                                     return e.jsx("div", {
                                                       className: "p-4 text-center text-xs font-black uppercase tracking-widest text-slate-400",
                                                       children: "Không tìm thấy máy trạm nào online"
                                                     });
                                                   }

                                                   return filteredTerminals.map(term => {
                                                     const isSelected = activeRemoteTerminalId === term.terminal_id;
                                                     const itemCount = term.total_items || (term.cart ? term.cart.reduce((s, item) => s + (item.quantity || 1), 0) : 0);
                                                     const isMobile = (term.terminal_id || '').includes('Mobile') || (term.current_page || '').includes('Mobile');
                                                     const totalAmt = term.total_amount || 0;

                                                     return e.jsxs("div", {
                                                       key: term.terminal_id,
                                                       className: u(
                                                         "w-full p-3 rounded-2xl border text-left flex items-center justify-between gap-3 transition-all relative overflow-hidden",
                                                         isSelected
                                                           ? "bg-emerald-500/15 border-emerald-500 dark:border-emerald-400 text-slate-900 dark:text-emerald-200 shadow-md shadow-emerald-500/5"
                                                           : "bg-slate-50/50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800"
                                                       ),
                                                       children: [
                                                         e.jsxs("div", {
                                                           className: "flex items-center gap-3 min-w-0 flex-1 cursor-pointer",
                                                           onClick: () => {
                                                             setActiveRemoteTerminalId(term.terminal_id);
                                                             setIsMirrorDropdownOpen(false);
                                                             Ke('remote_inspect');
                                                           },
                                                           children: [
                                                             e.jsx("div", {
                                                               className: u(
                                                                 "w-9 h-9 rounded-xl flex items-center justify-center border shrink-0 text-sm",
                                                                 isSelected 
                                                                   ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-600 dark:text-emerald-400" 
                                                                   : "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500"
                                                               ),
                                                               children: isMobile ? e.jsx(Coins, { size: 16 }) : e.jsx(Tv, { size: 16 })
                                                             }),
                                                             e.jsxs("div", {
                                                               className: "min-w-0 flex-1",
                                                               children: [
                                                                 e.jsx("div", { 
                                                                   className: "text-xs font-black uppercase tracking-wide truncate text-slate-900 dark:text-slate-100", 
                                                                   children: term.user_name && !term.user_name.includes('Thu ngân')
                                                                     ? `${term.user_name} (${term.ip_address})` 
                                                                     : `MÁY POS (${term.ip_address})`
                                                                 }),
                                                                 e.jsxs("div", { 
                                                                   className: "text-[10px] font-bold text-slate-400 dark:text-slate-500 truncate flex items-center gap-1", 
                                                                   children: [e.jsx(User, { size: 10 }), term.terminal_name || term.terminal_id] 
                                                                 })
                                                               ]
                                                             })
                                                           ]
                                                         }),
                                                         e.jsxs("div", {
                                                           className: "text-right shrink-0 flex flex-col items-end gap-0.5",
                                                           children: [
                                                             e.jsxs("div", { className: "text-xs font-black text-emerald-600 dark:text-emerald-400 tabular-nums flex items-center gap-0.5", children: [I(totalAmt), "đ"] }),
                                                             e.jsxs("div", { className: "text-[9px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded-lg border border-amber-500/10 tabular-nums", children: [itemCount, " món"] })
                                                           ]
                                                         }),
                                                         e.jsx("button", {
                                                           onClick: (evt) => {
                                                             evt.stopPropagation();
                                                             handleImportRemoteCart(term.cart);
                                                           },
                                                           className: "p-2 bg-emerald-500/15 hover:bg-emerald-500 text-emerald-600 dark:text-emerald-400 hover:text-white rounded-xl transition-all border border-emerald-500/20 cursor-pointer shadow-xs",
                                                           title: "Sao chép nhanh giỏ hàng từ máy này",
                                                           children: e.jsx(Copy, { size: 13 })
                                                         })
                                                       ]
                                                     });
                                                   });
                                                 })()
                                               })
                                             ]
                                           })
                                        })
                                      : null })
                                   ]
                                  })
                                ]
                              })
                            ] }) }), e.jsx("th", {
                            rowSpan: 2,
                            className: "py-1.5 px-3 w-28 text-center align-middle font-black uppercase text-[9px] tracking-widest text-slate-400 border-x border-white/10 dark:border-slate-800/20 whitespace-nowrap",
                            children: "Đơn vị"
                          }), e.jsx("th", {
                            className: "py-1.5 px-3 w-36 text-center font-black uppercase text-[9px] tracking-widest text-slate-400 border-r border-white/10 dark:border-slate-800/20 whitespace-nowrap",
                            children: "Quy đổi"
                          }), e.jsx("th", {
                            className: "py-1.5 px-3 w-20 text-center font-black uppercase text-[9px] tracking-widest text-slate-400 border-r border-white/10 dark:border-slate-800/20 whitespace-nowrap",
                            children: "Số lượng"
                          }), e.jsx("th", {
                            rowSpan: 2,
                            className: "py-1.5 px-3 w-36 text-center align-middle font-black uppercase text-[9px] tracking-widest text-slate-400 border-r border-white/10 dark:border-slate-800/20 whitespace-nowrap",
                            children: "Đơn giá"
                          }), e.jsx("th", {
                            rowSpan: 2,
                            className: "py-1.5 px-3 w-36 text-center align-middle font-black uppercase text-[9px] tracking-widest text-slate-400 whitespace-nowrap",
                            children: "Thành tiền"
                          }), e.jsx("th", {
                            rowSpan: 2,
                            className: "w-8"
                          })]
                        }), e.jsxs("tr", {
                          className: "border-t border-slate-200 dark:border-white/10 dark:border-slate-800/20 bg-transparent",
                          children: [e.jsx("td", {
                            className: "px-4 py-1 text-center border-r border-white/10 dark:border-slate-800/20 whitespace-nowrap",
                            children: e.jsxs("div", {
                              className: "flex items-center justify-center gap-1.5",
                              children: [e.jsx("div", {
                                className: "w-1 h-1 rounded-full bg-primary/40"
                              }), e.jsxs("span", {
                                className: "text-[8px] font-black text-slate-400/80 uppercase tracking-widest",
                                children: [wn, " items"]
                              })]
                            })
                          }), e.jsx("td", {
                            className: "px-3 py-1 text-center border-r border-white/10 dark:border-slate-800/20 whitespace-nowrap",
                            children: e.jsx("span", {
                              className: "text-xs font-black text-slate-500 tabular-nums",
                              children: I(kn)
                            })
                          }), e.jsx("td", {
                            className: "px-3 py-1 text-center whitespace-nowrap",
                            children: e.jsx("span", {
                              className: "text-xs font-black text-primary/80 tabular-nums",
                              children: I(vn)
                            })
                          })]
                        })]
                      }), e.jsxs("tbody", {
                        className: "divide-none",
                        children: [e.jsxs("tr", {
                          className: "bg-transparent sticky top-[60px] z-[150] hover:z-[1000] focus-within:z-[2001] border-b border-[#8b6f47]/15 dark:border-white/5 transition-all hover:bg-white/5 dark:hover:bg-slate-800/10 group/working-row",
                          onDoubleClick: () => {
                            o.product && (Ft(o.product), dt(!0))
                          },
                          children: [e.jsx("td", {
                            onClick: r => {
                              r.stopPropagation();
                              if (fe && fe.length > 0) {
                                playPackingQueue(fe, z);
                              } else {
                                toast.error("Giỏ hàng đang trống!");
                              }
                            },
                            title: "Bấm để đọc toàn bộ danh sách soạn hàng",
                            className: "py-4 px-4 text-center font-black text-primary cursor-pointer hover:bg-primary/10 rounded-l-xl",
                            children: e.jsx(ii, {
                              size: 18,
                              strokeWidth: 3,
                              className: "mx-auto"
                            })
                          }), e.jsx("td", {
                            className: "py-4 px-4 text-center",
                            children: e.jsx("div", {
                              className: "w-8 h-8 rounded-xl bg-primary/20 flex items-center justify-center text-primary mx-auto",
                              children: e.jsx(ft, {
                                size: 20,
                                strokeWidth: 3
                              })
                            })
                          }), e.jsxs("td", {
                            className: "py-4 px-2 relative",
                            children: [e.jsxs("div", {
                              className: "relative group/search flex items-center gap-2",
                              children: [e.jsx("div", {
                                className: "relative flex-1",
                                children: e.jsxs("div", {
                                  className: "relative",
                                  children: [e.jsx("div", {
                                    className: "absolute left-4 top-1/2 -translate-y-1/2 z-10 text-primary/50 group-focus-within/search:text-primary transition-colors",
                                    children: e.jsx(qr, {
                                      size: 20,
                                      strokeWidth: 3
                                    })
                                  }), e.jsx("input", {
                                    type: "text",
                                    placeholder: "Tìm kiếm sản phẩm thông minh (F2)...",
                                    className: "w-full h-auto py-2.5 pl-12 pr-16 bg-transparent border border-black/10 dark:border-white/5 rounded-2xl font-black text-slate-800 dark:text-white uppercase outline-none transition-all focus:border-primary/50 dark:focus:border-emerald-500/50 focus:ring-4 focus:ring-primary/10 dark:focus:ring-emerald-500/10 focus:bg-transparent leading-relaxed placeholder:normal-case placeholder:leading-relaxed",
                                    autoComplete: "off",
                                    value: ee,
                                    onChange: t => {
                                      const a = t.target.value;
                                      ce(a), $t(0), lr(!0), o.product && a !== o.name && _e({
                                        ...o,
                                        product: null,
                                        name: a,
                                        quantity: 1,
                                        price: 0
                                      })
                                    },
                                    onKeyDown: t => {
                                      if (t.key === "ArrowUp") t.preventDefault(), $t(a => {
                                        const r = Math.max(a - 1, 0),
                                          s = mr.current;
                                        if (s) {
                                          const n = s.children[r];
                                          n && n.scrollIntoView({
                                            block: "nearest"
                                          })
                                        }
                                        return r
                                      });
                                      else if (t.key === "ArrowDown") t.preventDefault(), $t(a => {
                                        const r = Math.min(a + 1, st.length - 1),
                                          s = mr.current;
                                        if (s) {
                                          const n = s.children[r];
                                          n && n.scrollIntoView({
                                            block: "nearest"
                                          })
                                        }
                                        return r
                                      });
                                      else if (t.key === "Enter") {
                                        t.preventDefault();
                                        const a = t.target.value.trim();
                                        let r = !1;
                                        if (a && (r = kr(a), r)) {
                                          ce("");
                                          return
                                        }
                                        if (a && st.length === 0) {
                                          G({
                                            message: `Mã vạch ${a} không tồn tại`,
                                            type: "error"
                                          }), ce("");
                                          return
                                        }
                                        if (ee && st[he]) {
                                          const s = st[he];
                                          if (ye === "Retail" || !s.secondary_unit) Pt(s, 1, E[s.id] !== void 0 ? E[s.id] : s.sale_price);
                                          else {
                                            const n = o.quantity !== 0 ? o.quantity : 1;
                                            _e({
                                              product: s,
                                              quantity: n,
                                              price: E[s.id] !== void 0 ? E[s.id] : s.sale_price,
                                              secondary_qty: n / (s.multiplier || 1),
                                              name: s.name,
                                              latest_audit: s.latest_audit
                                            }), ce(s.name), setTimeout(() => Xt.current?.focus(), 0)
                                          }
                                        }
                                      } else if (t.key === "Tab") {
                                        if (t.preventDefault(), t.stopPropagation(), o.product) {
                                          const a = ye === "Wholesale" && o.product.secondary_unit ? Xt : ut;
                                          a.current?.focus(), a.current?.select()
                                        } else if (ee && st[he]) {
                                          const a = st[he],
                                            r = o.quantity && o.quantity !== 0 ? o.quantity : 1;
                                          _e({
                                            product: a,
                                            quantity: r,
                                            price: E[a.id] !== void 0 ? E[a.id] : a.sale_price,
                                            secondary_qty: r / (a.multiplier || 1),
                                            name: a.name
                                          }), ce(a.name), setTimeout(() => {
                                            const s = ye === "Wholesale" && a.secondary_unit ? Xt : ut;
                                            s.current?.focus(), s.current?.select?.()
                                          }, 0)
                                        }
                                      }
                                    },
                                    onFocus: t => {
                                      t.target.select(), lr(!0)
                                    },
                                    onBlur: () => {
                                      setTimeout(() => lr(!1), 200)
                                    },
                                    ref: ue
                                  }), o.product && e.jsx("div", {
                                    className: "absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2",
                                    children: e.jsx("div", {
                                      className: "flex items-center gap-4 relative z-[200]",
                                      children: e.jsxs("div", {
                                        onClick: t => {
                                          t.stopPropagation();
                                          const a = t.currentTarget.getBoundingClientRect();
                                          _t(o.product), Ut({
                                            top: a.top,
                                            bottom: a.bottom,
                                            left: a.left,
                                            right: a.right
                                          }), pt(!0)
                                        },
                                        className: u("px-3 py-1.5 rounded-xl text-xs font-black border transition-all flex items-center gap-2  hover:scale-110 active:scale-95 group/stock cursor-pointer", o.product.stock <= 0 ? "bg-rose-500/15 text-rose-500 border-rose-500/30 shadow-rose-500/10" : o.product.stock < 10 ? "bg-amber-500/15 text-amber-600 border-amber-500/30 shadow-amber-500/10" : "bg-emerald-500/15 text-emerald-500 border-emerald-500/30 shadow-emerald-500/10"),
                                        children: [o.product.stock <= 0 ? e.jsx(Wa, {
                                          size: 14,
                                          strokeWidth: 3
                                        }) : o.product.stock < 10 ? e.jsx(qt, {
                                          size: 14,
                                          strokeWidth: 3,
                                          className: ""
                                        }) : e.jsx(sa, {
                                          size: 14,
                                          strokeWidth: 3
                                        }), e.jsx("span", {
                                          className: "tabular-nums",
                                          children: o.product.stock
                                        })]
                                      })
                                    })
                                  })]
                                })
                              }),
                              e.jsxs(m.button, {
                                whileHover: {
                                  scale: 1.02,
                                  backgroundColor: "rgba(15, 23, 42, 1)"
                                },
                                whileTap: {
                                  scale: .98
                                },
                                onClick: () => {
                                  Zt(!0), ea({
                                    name: "",
                                    price: ""
                                  }), setTimeout(() => fr.current?.focus(), 100)
                                },
                                tabIndex: -1,
                                className: "h-9 px-3 bg-slate-900/90 dark:bg-slate-800/90 text-white rounded-xl font-black text-[9px] uppercase tracking-wider flex items-center gap-2  shadow-black/20 border border-white/10 transition-colors whitespace-nowrap shrink-0 group/f6",
                                title: "Thêm món ngoài (F6)",
                                children: [e.jsx("div", {
                                  className: "w-5 h-5 rounded-md bg-white/10 flex items-center justify-center group-hover/f6:rotate-12 transition-transform",
                                  children: e.jsx(ft, {
                                    size: 12,
                                    strokeWidth: 3
                                  })
                                }), e.jsx("span", {
                                  children: "Món Ngoài"
                                }), e.jsx("div", {
                                  className: "px-1 py-0.2 rounded bg-white/10 text-[7px] font-black border border-white/10 opacity-60",
                                  children: "F6"
                                })]
                              })]
                            }), e.jsx(T, {
                              children: ee && !o.product && en && e.jsxs(m.div, {
                                initial: {
                                  opacity: 0,
                                  y: -5
                                },
                                animate: {
                                  opacity: 1,
                                  y: 0
                                },
                                exit: {
                                  opacity: 0,
                                  y: -5
                                },
                                transition: {
                                  duration: .15
                                },
                                className: "absolute left-0 top-full mt-2 w-full min-w-[700px] dropdown-premium backdrop-blur-xl backdrop-saturate-150 !z-[1000]",
                                style: {
                                  backgroundColor: Y.glassBg
                                },
                                children: [e.jsx("div", {
                                  className: "absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white/40 to-transparent pointer-events-none"
                                }), e.jsx("div", {
                                  className: "max-h-[480px] overflow-y-auto custom-scrollbar",
                                  ref: mr,
                                  children: st.map((t, a) => e.jsxs("div", {
                                    onMouseEnter: () => $t(a),
                                    onMouseDown: r => {
                                      r.preventDefault();
                                      const s = o.quantity && o.quantity !== 0 ? o.quantity : 1;
                                      _e({
                                        product: t,
                                        quantity: s,
                                        price: E[t.id] !== void 0 ? E[t.id] : t.sale_price,
                                        secondary_qty: s / (t.multiplier || 1),
                                        name: t.name
                                      }), ce(t.name)
                                    },
                                    className: u("dropdown-item flex justify-between items-center", a === he && "active"),
                                    children: [e.jsxs("div", {
                                      className: "flex-1 flex flex-col gap-1.5 relative z-10",
                                      children: [e.jsxs("div", {
                                        className: "flex items-center gap-3",
                                        children: [e.jsx("span", {
                                          className: "font-black uppercase tracking-tight transition-all duration-300 leading-relaxed",
                                          style: {
                                            color: a === he ? Y.accent : Y.main,
                                            fontSize: a === he ? "18px" : "16px",
                                            transform: a === he ? "scale(1.02)" : "scale(1)",
                                            paddingLeft: a === he ? "12px" : "0px"
                                          },
                                          children: t.name
                                        }), t.code && e.jsx("span", {
                                          className: "px-2.5 py-0.5 rounded-lg bg-slate-900/5 dark:bg-white/10 border border-black/5 dark:border-white/10 text-[10px] font-black tabular-nums text-slate-500 dark:text-slate-400",
                                          children: t.code
                                        }), t.is_combo && e.jsx("span", {
                                          className: "px-2.5 py-0.5 rounded-lg bg-amber-500 text-white text-[10px] font-black tracking-widest ",
                                          children: "COMBO"
                                        })]
                                      }), e.jsxs("div", {
                                        className: "flex items-center gap-5",
                                        children: [e.jsx("span", {
                                          className: "text-[11px] font-black italic tracking-wide transition-colors",
                                          style: {
                                            color: a === he ? Y.accentMuted : Y.muted
                                          },
                                          children: t.active_ingredient || ""
                                        }), e.jsxs("div", {
                                          className: "flex items-center gap-2 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest",
                                          children: [e.jsx("span", {
                                            className: u("px-2 py-0.5 rounded-md border transition-colors", a === he ? "bg-white/20 border-white/30 text-white" : "bg-transparent border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"),
                                            children: Te(t.unit)
                                          }), t.multiplier > 1 && e.jsxs("span", {
                                            className: a === he ? "text-white/60" : "text-slate-500 opacity-60",
                                            children: ["/ ", Te(t.secondary_unit), " (x", t.multiplier, ")"]
                                          })]
                                        })]
                                      })]
                                    }), e.jsxs("div", {
                                      className: "flex items-center gap-8 relative z-10",
                                      children: [e.jsxs("div", {
                                        onClick: r => {
                                          r.stopPropagation();
                                          const s = r.currentTarget.getBoundingClientRect();
                                          _t(t), Ut({
                                            top: s.top,
                                            bottom: s.bottom,
                                            left: s.left,
                                            right: s.right
                                          }), pt(!0)
                                        },
                                        className: u("px-4 py-2 rounded-2xl text-[13px] font-black border-2 transition-all flex items-center gap-2.5  hover:scale-110 active:scale-95 group/stock", t.stock <= 0 ? "bg-rose-500/10 text-rose-600 border-rose-500/30" : t.stock < 10 ? "bg-amber-500/10 text-amber-700 border-amber-500/30" : "bg-emerald-500/10 text-emerald-600 border-emerald-500/30"),
                                        children: [t.stock <= 0 ? e.jsx(Wa, {
                                          size: 16,
                                          strokeWidth: 3
                                        }) : t.stock < 10 ? e.jsx(qt, {
                                          size: 16,
                                          strokeWidth: 3,
                                          className: ""
                                        }) : e.jsx(sa, {
                                          size: 16,
                                          strokeWidth: 3
                                        }), e.jsx("span", {
                                          className: "tabular-nums",
                                          children: t.stock
                                        }), e.jsx(Rt, {
                                          size: 12,
                                          className: "ml-1 opacity-0 group-hover/stock:opacity-100 group-hover/stock:rotate-180 transition-all duration-500"
                                        })]
                                      }), e.jsxs("div", {
                                        className: "flex flex-col items-end gap-1",
                                        children: [e.jsx("div", {
                                          className: "text-[22px] font-black tracking-tighter tabular-nums drop-",
                                          style: {
                                            color: a === he ? Y.accent : Y.main
                                          },
                                          children: I(t.sale_price)
                                        }), e.jsxs("div", {
                                          className: "text-[10px] font-black text-slate-500 dark:text-slate-500 uppercase tracking-widest opacity-80",
                                          children: ["NHẬP CUỐI: ", I(t.latest_cost_price)]
                                        })]
                                      })]
                                    })]
                                  }, t.id))
                                }), ee && st.length === 0 && e.jsxs("div", {
                                  className: "dropdown-item flex items-center justify-center gap-3 font-black uppercase text-[12px] tracking-widest border-t border-transparent",
                                  onClick: () => {
                                    Vr(ee), ka(!0)
                                  },
                                  children: [e.jsx(ft, {
                                    size: 18,
                                    strokeWidth: 3
                                  }), e.jsxs("span", {
                                    children: ['Thêm sản phẩm mới: "', ee, '"']
                                  })]
                                })]
                              }, "pos-product-dropdown")
                            })]
                          }), e.jsxs("td", {
                            className: "py-4 px-4 text-center",
                            children: [e.jsx("div", {
                              className: "font-bold text-gray-700 dark:text-gray-200 text-xs",
                              children: Te(o.product?.unit || "-")
                            }), o.product?.secondary_unit && e.jsxs("div", {
                              className: "text-[10px] text-primary dark:text-[#d4a574] font-black uppercase tracking-tighter whitespace-nowrap",
                              children: ["1", " ", Te(o.product.secondary_unit), " ", "= ", o.product.multiplier, " ", Te(o.product.unit)]
                            })]
                          }), e.jsx("td", {
                            className: "py-4 px-2 w-32",
                            children: o.product?.secondary_unit ? e.jsxs("div", {
                              className: "flex items-center gap-1 h-10 px-2 bg-transparent border border-black/10 dark:border-white/5 rounded-2xl focus-within:bg-transparent focus-within:border-[#d4a574]/50 focus-within:ring-4 focus-within:ring-[#d4a574]/10  transition-all",
                              children: [e.jsx("input", {
                                type: "number",
                                className: "w-full min-w-0 bg-transparent text-center font-black text-base outline-none placeholder:text-gray-300 text-primary dark:text-[#d4a574]",
                                id: "working-sec-qty",
                                ref: Xt,
                                tabIndex: ye === "Wholesale" ? 0 : -1,
                                value: o.secondary_qty,
                                autoComplete: "off",
                                onFocus: t => t.target.select(),
                                onChange: t => {
                                  const a = parseFloat(t.target.value) || 0;
                                  _e(r => {
                                    const s = parseFloat(r.product?.multiplier) || 1;
                                    return {
                                      ...r,
                                      secondary_qty: a,
                                      quantity: a * s
                                    }
                                  })
                                },
                                onKeyDown: t => {
                                  t.key === "Tab" ? (t.preventDefault(), t.stopPropagation(), ut.current?.focus()) : t.key === "Enter" && (t.preventDefault(), o.product && o.quantity !== 0 && Pt(o.product, o.quantity, o.price))
                                }
                              }), e.jsx("span", {
                                className: "text-[10px] font-black text-muted-foreground uppercase pr-2",
                                children: Te(o.product.secondary_unit)
                              })]
                            }) : e.jsx("div", {
                              className: "text-center text-muted-foreground italic text-[10px] font-bold h-[40px] flex items-center justify-center",
                              children: "N/A"
                            })
                          }), e.jsx("td", {
                            className: "py-4 px-2 w-24 group/qty",
                            children: e.jsxs("div", {
                              className: "relative w-full",
                              children: [e.jsx("input", {
                                type: "number",
                                className: "w-full h-10 text-center bg-transparent border border-black/10 dark:border-white/5 rounded-2xl focus:bg-transparent focus:border-primary/50 focus:ring-4 focus:ring-primary/10 outline-none font-black text-lg text-primary dark:text-foreground  transition-all",
                                value: o.quantity,
                                id: "working-main-qty",
                                ref: ut,
                                autoComplete: "off",
                                onFocus: t => t.target.select(),
                                onChange: t => {
                                  const a = parseFloat(t.target.value) || 0;
                                  _e(r => {
                                    const s = parseFloat(r.product?.multiplier) || 1;
                                    return {
                                      ...r,
                                      quantity: a,
                                      secondary_qty: a / s
                                    }
                                  })
                                },
                                onKeyDown: t => {
                                  t.key === "Tab" ? (t.preventDefault(), t.stopPropagation(), ur.current?.focus()) : t.key === "Enter" && (t.preventDefault(), o.product && o.quantity !== 0 && Pt(o.product, o.quantity, o.price))
                                }
                              }), e.jsx("button", {
                                tabIndex: -1,
                                className: "absolute -top-2.5 -right-2.5 w-6 h-6 flex items-center justify-center bg-white/40 dark:bg-black/20 text-[#8b6f47] dark:text-[#d4a574] rounded-full  border border-white/50 dark:border-white/10 hover:bg-white/60 active:scale-90 z-[70] transition-all hover:scale-110 opacity-0 group-hover/qty:opacity-100",
                                onClick: () => {
                                  _e(t => ({
                                    ...t,
                                    quantity: t.quantity * -1,
                                    secondary_qty: t.secondary_qty * -1
                                  })), ut.current?.focus()
                                },
                                title: "Đổi thành Trả Hàng (Âm)",
                                children: e.jsx(Ir, {
                                  size: 12,
                                  strokeWidth: 3
                                })
                              })]
                            })
                          }), e.jsx("td", {
                            className: "py-4 px-2 text-right",
                            children: e.jsxs("div", {
                              className: "flex flex-col items-center gap-1 group/price relative group-hover/price:z-[500]",
                              children: [o.product && e.jsxs("div", {
                                className: `absolute bottom-full left-1/2 -translate-x-1/2 mb-3 p-1\r
                                                                                bg-white/85 dark:bg-slate-900/85 backdrop-blur-[32px] rounded-2xl border border-slate-200 dark:border-white/10 shadow-2xl\r
                                                                                flex items-stretch whitespace-nowrap z-[9999] \r
                                                                                opacity-0 group-hover/price:opacity-100 group-focus-within/price:opacity-100\r
                                                                                transition-all duration-300 pointer-events-none translate-y-2 group-hover/price:translate-y-0 group-focus-within/price:translate-y-0`,
                                children: [e.jsxs("div", {
                                  className: "flex flex-col items-center px-4 py-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-xl transition-colors",
                                  children: [e.jsx("span", {
                                    className: "text-[9px] uppercase font-black text-slate-500/70 dark:text-slate-400 leading-none mb-1.5 tracking-[0.1em]",
                                    children: "Vốn TB"
                                  }), e.jsxs("span", {
                                    className: "text-sm font-black text-indigo-600 dark:text-indigo-300 tabular-nums",
                                    children: [I(o.product.cost_price), e.jsx("span", {
                                      className: "text-[10px] ml-1 opacity-50",
                                      children: "đ"
                                    })]
                                  })]
                                }), e.jsx("div", {
                                  className: "w-px my-2 bg-gradient-to-b from-transparent via-black/10 dark:via-white/10 to-transparent"
                                }), e.jsxs("div", {
                                  className: "flex flex-col items-center px-4 py-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-xl transition-colors",
                                  children: [e.jsx("span", {
                                    className: "text-[9px] uppercase font-black text-[#8b6f47] dark:text-[#d4a574] leading-none mb-1.5 tracking-[0.1em]",
                                    children: "Nhập cuối"
                                  }), e.jsxs("span", {
                                    className: "text-sm font-black text-emerald-600 dark:text-emerald-400 tabular-nums",
                                    children: [I(o.product.latest_cost_price || 0), e.jsx("span", {
                                      className: "text-[10px] ml-1 opacity-50",
                                      children: "đ"
                                    })]
                                  })]
                                }), e.jsx("div", {
                                  className: "absolute top-full left-1/2 -translate-x-1/2 border-[6px] border-transparent border-t-white/85 dark:border-t-slate-900/85"
                                })]
                              }), e.jsx("input", {
                                type: "text",
                                className: u("w-full h-10 text-center bg-transparent border border-black/10 dark:border-white/5 rounded-2xl focus:bg-transparent focus:border-primary/50 focus:ring-4 focus:ring-primary/10 outline-none font-black text-lg transition-all ", o.product && o.price < o.product.cost_price ? "text-rose-600 dark:text-rose-400 bg-rose-500/15 dark:bg-rose-900/20 focus:ring-rose-200" : o.product && o.price < (o.product.latest_cost_price || 0) ? "text-orange-600 dark:text-orange-400 bg-orange-500/15 dark:bg-orange-900/10 focus:ring-orange-200" : "text-primary dark:text-foreground"),
                                value: I(o.price),
                                id: "working-price",
                                ref: ur,
                                autoComplete: "off",
                                onFocus: t => t.target.select(),
                                onChange: t => {
                                  const a = parseFloat(t.target.value.replace(/,/g, "")) || 0;
                                  _e({
                                    ...o,
                                    price: a
                                  })
                                },
                                onKeyDown: t => {
                                  if (t.key === "Enter") {
                                    t.preventDefault();
                                    On();
                                    o.product && o.quantity !== 0 && Pt(o.product, o.quantity, o.price);
                                  } else if (t.key === "Tab" && !t.shiftKey) {
                                    t.preventDefault();
                                    t.stopPropagation();
                                    ue.current?.focus();
                                  }
                                }
                              }), e.jsxs(T, {
                                children: [o.product && o.price < o.product.cost_price && e.jsxs(m.div, {
                                  initial: {
                                    opacity: 0,
                                    scale: .8,
                                    y: -5
                                  },
                                  animate: {
                                    opacity: 1,
                                    scale: 1,
                                    y: 0
                                  },
                                  className: "bg-rose-500/90 text-white text-[9px] px-2 py-1.5 rounded-xl font-black whitespace-nowrap z-10 flex items-center gap-1.5  shadow-rose-500/30 border border-white/20",
                                  children: [e.jsx(qt, {
                                    size: 12,
                                    strokeWidth: 3,
                                    className: "text-white"
                                  }), "LỖ VỐN"]
                                }), o.product && o.price < (o.product.latest_cost_price || 0) && o.price >= o.product.cost_price && e.jsxs(m.div, {
                                  initial: {
                                    opacity: 0,
                                    scale: .8,
                                    y: -5
                                  },
                                  animate: {
                                    opacity: 1,
                                    scale: 1,
                                    y: 0
                                  },
                                  className: "bg-orange-500/90 text-white text-[9px] px-2 py-1.5 rounded-xl font-black whitespace-nowrap z-10 flex items-center gap-1.5  shadow-orange-500/30 border border-white/20",
                                  children: [e.jsx(Ns, {
                                    size: 12,
                                    strokeWidth: 3,
                                    className: "text-white"
                                  }), "DƯỚI VỐN NHẬP"]
                                }), o.product && o.price < o.product.sale_price && o.price >= (o.product.latest_cost_price || o.product.cost_price) && e.jsxs(m.div, {
                                  initial: {
                                    opacity: 0,
                                    scale: .8,
                                    y: -5
                                  },
                                  animate: {
                                    opacity: 1,
                                    scale: 1,
                                    y: 0
                                  },
                                  className: "bg-amber-500/90 text-white text-[9px] px-2 py-1.5 rounded-xl font-black whitespace-nowrap z-10 flex items-center gap-1.5  border border-white/20",
                                  children: [e.jsx(li, {
                                    size: 12,
                                    strokeWidth: 3,
                                    className: "text-white"
                                  }), "GIÁ THẤP (", it(o.product.sale_price), ")"]
                                }), o.product && p && E[o.product.id] !== void 0 && o.price === o.product.sale_price && e.jsxs(m.div, {
                                  initial: {
                                    opacity: 0,
                                    scale: .8,
                                    y: -5
                                  },
                                  animate: {
                                    opacity: 1,
                                    scale: 1,
                                    y: 0
                                  },
                                  className: "px-2 py-1 rounded-lg bg-indigo-500/90 dark:bg-indigo-600/90 border border-white/20  flex items-center gap-1.5 overflow-hidden",
                                  children: [e.jsx(oi, {
                                    size: 12,
                                    className: "text-white fill-white/20"
                                  }), e.jsx("span", {
                                    className: "text-[9px] font-black uppercase tracking-wider text-white",
                                    children: "Đồng bộ giá"
                                  })]
                                })]
                              })]
                            })
                          }), e.jsxs("td", {
                            className: "py-4 px-4 text-right",
                            children: [e.jsx("div", {
                              className: u("font-black text-lg transition-colors", o.quantity < 0 ? "text-rose-600 dark:text-rose-400" : "text-primary"),
                              children: I(o.price * o.quantity)
                            }), o.quantity < 0 && e.jsx("span", {
                              className: "inline-block px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded text-[9px] font-black uppercase tracking-widest border border-red-200 dark:border-red-800/50 mt-1",
                              children: "Hàng trả"
                            })]
                          }), e.jsx("td", {
                            className: "py-4 px-2 text-center",
                            children: o.product && e.jsx("button", {
                              onClick: () => _e({
                                product: null,
                                quantity: 1,
                                price: 0,
                                secondary_qty: 0,
                                name: ""
                              }),
                              className: "p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all",
                              title: "Xóa dòng",
                              children: e.jsx(Se, {
                                size: 20
                              })
                            })
                          })]
                        }), e.jsxs(T, {
                          initial: !1,
                          children: [
                            ts && e.jsx(m.tr, {
                              className: "w-full border-none bg-transparent",
                              initial: {
                                opacity: 0
                              },
                              animate: {
                                opacity: 1
                              },
                              exit: {
                                opacity: 0,
                                scale: .95,
                                transition: {
                                  duration: .2
                                }
                              },
                              children: e.jsx("td", {
                                colSpan: 10,
                                className: "h-[400px] text-center relative align-middle border-none bg-transparent",
                                children: e.jsxs("div", {
                                  className: "absolute inset-0 flex flex-col items-center justify-center gap-4",
                                  children: [e.jsxs("div", {
                                    className: "relative",
                                    children: [e.jsx("div", {
                                      className: "absolute inset-0 bg-primary/20 blur-xl rounded-full"
                                    }), e.jsx(Rt, {
                                      size: 48,
                                      className: "animate-spin text-primary relative z-10"
                                    })]
                                  }), e.jsx("span", {
                                    className: "text-sm font-black text-muted dark:text-[#d4a574] uppercase tracking-widest",
                                    children: "Đang đồng bộ dữ liệu..."
                                  })]
                                })
                              })
                            }, "loading-skeleton"),
                             ...(remoteCartRows || []),
                            xe !== 'remote_inspect' && !ts && fe.length > 0 && fe.map((t, a) => e.jsxs(m.tr, {
                            layout: !0,
                            initial: {
                              opacity: 0,
                              x: -20
                            },
                            animate: {
                              opacity: t.isPacked ? .6 : 1,
                              x: 0
                            },
                            exit: {
                              opacity: 0,
                              x: 50,
                              scale: .95,
                              backgroundColor: "rgba(0,0,0,0)",
                              transition: {
                                duration: .2,
                                ease: "easeIn"
                              }
                            },
                            whileHover: {
                              scale: 1.008,
                              y: -3,
                              transition: {
                                duration: .2,
                                ease: "easeOut"
                              }
                            },
                            transition: {
                              duration: .3,
                              type: "spring",
                              stiffness: 300,
                              damping: 25,
                              delay: a * .02
                            },
                            className: u("relative transition-colors duration-200 group cursor-pointer border-b border-[#8b6f47]/10 dark:border-white/5 last:border-b-0", t.isPacked && "line-through decoration-emerald-500/30 opacity-50", Je === a ? "z-[2000] bg-white/5 dark:bg-slate-800/20" : "z-[50] hover:z-[1000] bg-transparent focus-within:z-[1000]"),
                            onDoubleClick: () => {
                              const r = z.find(s => s.id === t.product_id);
                              r && (Ft(r), dt(!0))
                            },
                            children: [e.jsx("td", {
                              onClick: r => {
                                r.stopPropagation();
                                const prod = z.find(s => s.id === t.product_id);
                                const nameText = (prod && prod.alias && prod.alias.trim()) ? prod.alias.trim() : t.product_name;
                                speakNumber(`${nameText}, ${t.quantity}`);
                              },
                              title: "Bấm để đọc tên và số lượng",
                              className: "py-2 px-4 text-center text-slate-400 font-black text-[11px] group-hover:text-emerald-500 transition-colors tabular-nums cursor-pointer hover:bg-emerald-500/10 rounded-l-xl",
                              children: a + 1
                            }), e.jsx("td", {
                              className: "py-2 px-4 text-center",
                              children: e.jsx("button", {
                                onClick: r => {
                                  r.stopPropagation(), Tn(a)
                                },
                                className: u("w-8 h-8 rounded-xl flex items-center justify-center transition-all border-2", t.isPacked ? "bg-emerald-500 border-emerald-500 text-white  shadow-emerald-500/20" : "bg-transparent dark:bg-slate-800/40 border-black/10 dark:border-white/10 text-gray-400 hover:border-emerald-400 hover:text-emerald-400 hover:bg-white/5"),
                                children: e.jsx(ci, {
                                  size: 16,
                                  strokeWidth: 4
                                })
                              })
                            }), e.jsx("td", {
                              className: "py-2 px-2 relative",
                              children: e.jsxs("div", {
                                className: "relative group/search-row",
                                onDoubleClick: r => {
                                  r.preventDefault();
                                  const s = z.find(n => n.id === t.product_id);
                                  s && (Ft(s), dt(!0))
                                },
                                children: [e.jsx("input", {
                                  type: "text",
                                  autoComplete: "off",
                                  className: u("w-full h-auto py-2.5 px-4 bg-transparent border-0 border-transparent outline-none focus:outline-none ring-0 focus:ring-0 focus:ring-transparent focus:border-transparent focus:border-0", "text-[17px] font-black uppercase tracking-tight transition-all leading-relaxed placeholder:normal-case placeholder:leading-relaxed", "text-emerald-900 dark:text-emerald-300 placeholder:text-gray-300", Je === a ? "bg-white/10 dark:bg-slate-800/30  rounded-xl" : ""),
                                  value: Je === a ? kt : t.product_name,
                                  onFocus: r => {
                                    at(a), Xr(t.product_name), ja(0), r.target.select(), r.target.scrollIntoView({
                                      block: "nearest",
                                      behavior: "smooth"
                                    })
                                  },
                                  onChange: r => {
                                    Xr(r.target.value), ja(0)
                                  },
                                  onBlur: () => {
                                    setTimeout(() => {
                                      at(r => r === a ? null : r)
                                    }, 200)
                                  },
                                  onDoubleClick: () => {
                                    const r = z.find(s => s.id === t.product_id);
                                    r && (Ft(r), dt(!0))
                                  },
                                  onKeyDown: r => {
                                    const s = aa.filter(n => {
                                      const l = kt.toLowerCase(),
                                        c = nt(l);
                                      return n._lowName.includes(l) || n._normName.includes(c) || n._lowCode.includes(l) || n._normCode.includes(c) || n._lowActive.includes(l) || n._normActive.includes(c)
                                    }).sort((n, l) => {
                                      const c = kt.toLowerCase(),
                                        x = n._lowName.startsWith(c),
                                        d = l._lowName.startsWith(c);
                                      return x && !d ? -1 : !x && d ? 1 : n._lowCode === c && l._lowCode !== c ? -1 : n._lowCode !== c && l._lowCode === c ? 1 : n._lowName.localeCompare(l._lowName, "vi", {
                                        sensitivity: "base"
                                      })
                                    }).slice(0, 10);
                                    if (r.key === "ArrowDown")
                                      if (Je === a && s.length > 0) r.preventDefault(), ja(n => {
                                        const l = Math.min(n + 1, s.length - 1);
                                        if (Jt.current) {
                                          const c = Jt.current.children[l];
                                          c && c.scrollIntoView({
                                            block: "nearest"
                                          })
                                        }
                                        return l
                                      });
                                      else {
                                        r.preventDefault();
                                        const n = a + 1;
                                        n < fe.length && document.getElementById(`row-name-${n}`)?.focus()
                                      }
                                    else if (r.key === "ArrowUp")
                                      if (Je === a && s.length > 0) r.preventDefault(), ja(n => {
                                        const l = Math.max(n - 1, 0);
                                        if (Jt.current) {
                                          const c = Jt.current.children[l];
                                          c && c.scrollIntoView({
                                            block: "nearest"
                                          })
                                        }
                                        return l
                                      });
                                      else {
                                        r.preventDefault();
                                        const n = a - 1;
                                        n >= 0 ? document.getElementById(`row-name-${n}`)?.focus() : ue.current?.focus()
                                      }
                                    else if (r.key === "Enter") {
                                      if (r.preventDefault(), s[jt]) {
                                        const n = s[jt];
                                        let l = [...b];
                                        const c = t.quantity,
                                          x = l.findIndex(v => v.cartId !== t.cartId && v.product_id === n.id),
                                          d = l.findIndex(v => v.cartId === t.cartId);
                                        d > -1 && (x > -1 ? (l[x].quantity += c, l[x].secondary_qty = l[x].quantity / (l[x].multiplier || 1), l.splice(d, 1)) : l[d] = {
                                          ...l[d],
                                          product_id: n.id,
                                          product_name: n.name,
                                          unit: n.unit,
                                          secondary_unit: n.secondary_unit,
                                          multiplier: n.multiplier || 1,
                                          price: E[n.id] !== void 0 ? E[n.id] : n.sale_price,
                                          cost_price: n.cost_price,
                                          latest_cost_price: n.latest_cost_price,
                                          stock: n.stock,
                                          latest_stock_entry: n.latest_stock_entry,
                                          is_combo: n.is_combo,
                                          secondary_qty: c / (n.multiplier || 1),
                                          active_ingredient: n.active_ingredient
                                        }, S(l), at(null))
                                      }
                                      ue.current?.focus()
                                    } else if (r.key === "Tab") {
                                      r.preventDefault();
                                      const n = s.length > 0 ? s : [];
                                      if (n[jt]) {
                                        const l = n[jt];
                                        let c = [...b];
                                        const x = t.quantity,
                                          d = c.findIndex(_ => _.cartId !== t.cartId && _.product_id === l.id),
                                          v = c.findIndex(_ => _.cartId === t.cartId);
                                        v > -1 && (d > -1 ? (c[d].quantity += x, c[d].secondary_qty = c[d].quantity / (c[d].multiplier || 1), c.splice(v, 1), S(c), at(null), setTimeout(() => {
                                          const _ = fe.findIndex(R => R.cartId === c[d > v ? d - 1 : d].cartId),
                                            j = _ > -1 ? _ : d > v ? d - 1 : d,
                                            U = document.getElementById(`qty-sec-${j}`);
                                          if (ye === "Wholesale" && U && !U.disabled) U.focus(), U.select?.();
                                          else {
                                            const R = document.getElementById(`qty-main-${j}`);
                                            R?.focus(), R?.select?.()
                                          }
                                        }, 200)) : (c[v] = {
                                          ...c[v],
                                          product_id: l.id,
                                          product_name: l.name,
                                          unit: l.unit,
                                          secondary_unit: l.secondary_unit,
                                          multiplier: l.multiplier || 1,
                                          price: E[l.id] !== void 0 ? E[l.id] : l.sale_price,
                                          cost_price: l.cost_price,
                                          latest_cost_price: l.latest_cost_price,
                                          stock: l.stock,
                                          latest_stock_entry: l.latest_stock_entry,
                                          is_combo: l.is_combo,
                                          secondary_qty: x / (l.multiplier || 1),
                                          active_ingredient: l.active_ingredient
                                        }, S(c), at(null), setTimeout(() => {
                                          const _ = document.getElementById(`qty-sec-${a}`);
                                          if (ye === "Wholesale" && _ && !_.disabled) _.focus(), _.select?.();
                                          else {
                                            const j = document.getElementById(`qty-main-${a}`);
                                            j?.focus(), j?.select?.()
                                          }
                                        }, 200)))
                                      } else at(null), setTimeout(() => {
                                        const l = document.getElementById(`qty-sec-${a}`);
                                        if (ye === "Wholesale" && l && !l.disabled) l.focus(), l.select?.();
                                        else {
                                          const c = document.getElementById(`qty-main-${a}`);
                                          c?.focus(), c?.select?.()
                                        }
                                      }, 200)
                                    }
                                  },
                                  id: `row-name-${a}`
                                }), Je !== a && e.jsx("div", {
                                  className: "absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-3",
                                  children: e.jsxs("div", {
                                    onClick: r => {
                                      r.stopPropagation();
                                      const s = z.find(n => n.id === t.product_id);
                                      if (s) {
                                        const n = r.currentTarget.getBoundingClientRect();
                                        _t(s), Ut({
                                          top: n.top,
                                          bottom: n.bottom,
                                          left: n.left,
                                          right: n.right
                                        }), pt(!0)
                                      }
                                    },
                                    className: u("relative cursor-pointer hover:scale-105 active:scale-95 px-2.5 py-1 rounded-full text-[11px] font-black border transition-all flex items-center gap-1.5  group/stock overflow-hidden z-[100]", t.stock <= 0 ? "bg-rose-500/20 text-rose-600 dark:text-rose-400 border-rose-500/40 dark:bg-rose-500/30" : t.stock < 10 ? "bg-amber-500/20 text-amber-700 dark:text-amber-400 border-amber-500/40 dark:bg-amber-500/30" : "bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border-emerald-500/40 dark:bg-emerald-500/30"),
                                    children: [e.jsx("div", {
                                      className: "absolute inset-0 bg-white/20 opacity-0 group-hover/stock:opacity-100 transition-opacity"
                                    }), e.jsxs("div", {
                                      className: "relative flex items-center gap-1.5 transition-all duration-500",
                                      children: [t.stock <= 0 ? e.jsx(Wa, {
                                        size: 12,
                                        strokeWidth: 3,
                                        className: "opacity-90"
                                      }) : t.stock < 10 ? e.jsx(qt, {
                                        size: 12,
                                        strokeWidth: 3,
                                        className: "opacity-90"
                                      }) : e.jsx(sa, {
                                        size: 12,
                                        strokeWidth: 3,
                                        className: "opacity-90"
                                      }), e.jsx("span", {
                                        className: "tabular-nums drop-",
                                        children: t.stock
                                      }), e.jsx("div", {
                                        className: "w-0 group-hover/stock:w-3.5 h-3.5 flex items-center justify-center opacity-0 group-hover/stock:opacity-100 transition-all duration-500 overflow-hidden",
                                        children: e.jsx(Rt, {
                                          size: 10,
                                          className: "group-hover/stock:rotate-180 transition-transform duration-700 ease-out text-inherit shrink-0"
                                        })
                                      })]
                                    })]
                                  })
                                }), e.jsx(T, {
                                  children: Je === a && kt && e.jsx(m.div, {
                                    initial: {
                                      opacity: 0,
                                      y: -5
                                    },
                                    animate: {
                                      opacity: 1,
                                      y: 0
                                    },
                                    exit: {
                                      opacity: 0,
                                      y: -5
                                    },
                                    transition: {
                                      duration: .15
                                    },
                                    className: "dropdown-premium backdrop-blur-xl backdrop-saturate-150 min-w-[400px] mt-2",
                                    children: e.jsx("div", {
                                      ref: Jt,
                                      className: "max-h-64 overflow-y-auto no-scrollbar",
                                      children: aa.filter(r => {
                                        const s = kt.toLowerCase(),
                                          n = nt(s);
                                        return r._lowName.includes(s) || r._normName.includes(n) || r._lowCode.includes(s) || r._normCode.includes(n) || r._lowActive.includes(s) || r._normActive.includes(n)
                                      }).sort((r, s) => {
                                        const n = kt.toLowerCase(),
                                          l = r._lowName.startsWith(n),
                                          c = s._lowName.startsWith(n);
                                        return l && !c ? -1 : !l && c ? 1 : r._lowCode === n && s._lowCode !== n ? -1 : r._lowCode !== n && s._lowCode === n ? 1 : r._lowName.localeCompare(s._lowName, "vi", {
                                          sensitivity: "base"
                                        })
                                      }).slice(0, 10).map((r, s) => e.jsxs("div", {
                                        onClick: () => {
                                          let n = [...b];
                                          const l = n.findIndex(d => d.cartId === t.cartId);
                                          if (l === -1) return;
                                          const c = n[l].quantity,
                                            x = n.findIndex((d, v) => v !== l && d.product_id === r.id);
                                          x > -1 ? (n[x].quantity += c, n[x].secondary_qty = n[x].quantity / (n[x].multiplier || 1), n.splice(l, 1)) : n[l] = {
                                            ...n[l],
                                            product_id: r.id,
                                            product_name: r.name,
                                            unit: r.unit,
                                            secondary_unit: r.secondary_unit,
                                            multiplier: r.multiplier || 1,
                                            price: E[r.id] !== void 0 ? E[r.id] : r.sale_price,
                                            cost_price: r.cost_price,
                                            latest_cost_price: r.latest_cost_price,
                                            stock: r.stock,
                                            is_combo: r.is_combo,
                                            secondary_qty: c / (r.multiplier || 1),
                                            active_ingredient: r.active_ingredient,
                                            latest_audit: r.latest_audit,
                                            latest_stock_entry: r.latest_stock_entry
                                          }, S(n), at(null)
                                        },
                                        className: u("dropdown-item flex justify-between items-center", s === jt && "active"),
                                        children: [e.jsxs("div", {
                                          children: [e.jsx("div", {
                                            className: "font-black text-gray-900 dark:text-gray-50 text-[17px] uppercase tracking-tight leading-relaxed mb-1",
                                            children: r.name
                                          }), e.jsxs("div", {
                                            className: "text-[11px] text-gray-500 uppercase font-black flex items-center gap-2",
                                            children: [e.jsxs("span", {
                                              className: a === he ? "text-white/60" : "text-slate-500 opacity-60",
                                              children: [Te(r.unit), " ", r.multiplier > 1 && `/ ${Te(r.secondary_unit)} (x${r.multiplier})`]
                                            }), e.jsxs("div", {
                                              onClick: n => {
                                                n.stopPropagation();
                                                const l = n.currentTarget.getBoundingClientRect();
                                                _t(r), Ut({
                                                  top: l.top,
                                                  bottom: l.bottom,
                                                  left: l.left,
                                                  right: l.right
                                                }), pt(!0)
                                              },
                                              className: u("ml-auto px-2.5 py-1 rounded-full text-[11px] font-black border transition-all flex items-center gap-1.5  group/stock cursor-pointer relative overflow-hidden", s === jt ? "bg-primary text-white border-primary shadow-primary/40" : r.stock <= 0 ? "bg-rose-500/20 text-rose-600 dark:text-rose-400 border-rose-500/40 dark:bg-rose-500/30" : r.stock < 10 ? "bg-amber-500/20 text-amber-700 dark:text-amber-400 border-amber-500/40 dark:bg-amber-500/30" : "bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border-emerald-500/40 dark:bg-emerald-500/30"),
                                              title: "Kiểm tồn nhanh",
                                              children: [e.jsx("div", {
                                                className: "absolute inset-0 bg-white/20 opacity-0 group-hover/stock:opacity-100 transition-opacity"
                                              }), e.jsxs("div", {
                                                className: "relative flex items-center gap-1.5 transition-all duration-500",
                                                children: [r.stock <= 0 ? e.jsx(Wa, {
                                                  size: 12,
                                                  strokeWidth: 3,
                                                  className: "opacity-90"
                                                }) : r.stock < 10 ? e.jsx(qt, {
                                                  size: 12,
                                                  strokeWidth: 3,
                                                  className: "opacity-90"
                                                }) : e.jsx(sa, {
                                                  size: 12,
                                                  strokeWidth: 3,
                                                  className: "opacity-90"
                                                }), e.jsx("span", {
                                                  className: "tabular-nums drop-",
                                                  children: r.stock
                                                }), e.jsx("div", {
                                                  className: "w-0 group-hover/stock:w-3.5 h-3.5 flex items-center justify-center opacity-0 group-hover/stock:opacity-100 transition-all duration-500 overflow-hidden",
                                                  children: e.jsx(Rt, {
                                                    size: 10,
                                                    className: "group-hover/stock:rotate-180 transition-transform duration-700 ease-out text-inherit shrink-0"
                                                  })
                                                })]
                                              })]
                                            })]
                                          })]
                                        }), e.jsxs("div", {
                                          className: "text-right flex flex-col items-end gap-1.5",
                                          children: [e.jsx("div", {
                                            className: "font-black text-[16px] text-primary dark:text-[#d4a574] leading-none",
                                            children: I(r.sale_price)
                                          }), e.jsxs("div", {
                                            className: "text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500",
                                            children: ["Nhập: ", I(r.latest_cost_price)]
                                          })]
                                        })]
                                      }, r.id))
                                    })
                                  })
                                }), t.is_combo && e.jsx("span", {
                                  className: "ml-2 bg-primary/10 text-primary dark:text-[#d4a574] text-[9px] px-1.5 py-0.5 rounded font-black uppercase",
                                  children: "Combo"
                                }), t.active_ingredient && e.jsxs("div", {
                                  className: "absolute left-0 bottom-full mb-2 hidden group-hover/search-row:block z-[2000] w-64 bg-slate-800 text-white p-3 rounded-xl  animate-in fade-in slide-in-from-bottom-2 duration-200 border border-slate-700",
                                  children: [e.jsx("div", {
                                    className: "text-[10px] font-black uppercase text-[#d4a574] mb-1 tracking-widest border-b border-white/10 pb-1",
                                    children: "Hoạt chất / Thành phần"
                                  }), e.jsx("div", {
                                    className: "text-xs font-bold leading-relaxed",
                                    children: t.active_ingredient
                                  })]
                                })]
                              })
                            }), e.jsxs("td", {
                              className: "py-2 px-4 text-center",
                              children: [e.jsx("div", {
                                className: "font-bold text-gray-700 dark:text-gray-200",
                                children: Te(t.unit)
                              }), t.secondary_unit && e.jsxs("div", {
                                className: "text-[10px] text-primary dark:text-[#d4a574] font-black uppercase tracking-tighter whitespace-nowrap",
                                children: ["1 ", Te(t.secondary_unit), " =", " ", t.multiplier, " ", Te(t.unit)]
                              })]
                            }), e.jsx("td", {
                              className: "py-2 px-2 w-32",
                              children: t.secondary_unit ? e.jsxs("div", {
                                className: "flex items-center gap-1 h-10 px-2 bg-transparent border border-white/20 dark:border-white/10 rounded-2xl focus-within:bg-transparent focus-within:border-[#d4a574]/50 focus-within:ring-4 focus-within:ring-[#d4a574]/10 shadow-none transition-all",
                                children: [e.jsx("input", {
                                  type: "number",
                                  className: "w-full bg-transparent text-center font-black text-base outline-none placeholder:text-gray-300 text-primary dark:text-[#d4a574]",
                                  value: t.secondary_qty,
                                  onFocus: r => r.target.select(),
                                  autoComplete: "off",
                                  onChange: r => ta(a, "secondary_qty", parseFloat(r.target.value) || 0),
                                  onKeyDown: r => {
                                    if (r.key === "ArrowDown") {
                                      r.preventDefault();
                                      const s = a + 1;
                                      s < fe.length && document.getElementById(`qty-sec-${s}`)?.focus()
                                    } else if (r.key === "ArrowUp") {
                                      r.preventDefault();
                                      const s = a - 1;
                                      s >= 0 && document.getElementById(`qty-sec-${s}`)?.focus()
                                    }
                                  },
                                  id: `qty-sec-${a}`
                                }), e.jsx("span", {
                                  className: "text-[10px] font-black text-gray-400 uppercase pr-2",
                                  children: Te(t.secondary_unit)
                                })]
                              }) : e.jsx("div", {
                                className: "text-center text-gray-300 italic text-[10px] font-bold",
                                children: "N/A"
                              })
                            }), e.jsx("td", {
                              className: "py-2 px-2 w-24 group/qty",
                              children: e.jsxs("div", {
                                className: "relative w-full",
                                children: [e.jsx("input", {
                                  type: "number",
                                  className: "w-full h-10 text-center bg-transparent border border-white/20 dark:border-white/10 rounded-2xl focus:bg-transparent focus:border-primary/50 focus:ring-4 focus:ring-primary/10 outline-none font-black text-lg text-primary dark:text-[#d4a574] shadow-none transition-all",
                                  value: t.quantity,
                                  onFocus: r => r.target.select(),
                                  autoComplete: "off",
                                  onChange: r => ta(a, "quantity", parseFloat(r.target.value) || 0),
                                  ref: r => nn.current[t.product_id] = r,
                                  id: `qty-main-${a}`,
                                  onKeyDown: r => {
                                    if (r.key === "Enter") r.preventDefault(), ue.current?.focus();
                                    else if (r.key === "Tab") r.preventDefault(), document.getElementById(`price-${a}`)?.focus();
                                    else if (r.key === "ArrowDown") {
                                      r.preventDefault();
                                      const s = a + 1;
                                      s < fe.length && document.getElementById(`qty-main-${s}`)?.focus()
                                    } else if (r.key === "ArrowUp") {
                                      r.preventDefault();
                                      const s = a - 1;
                                      s >= 0 ? document.getElementById(`qty-main-${s}`)?.focus() : ut.current?.focus()
                                    }
                                  }
                                }), e.jsx("button", {
                                  tabIndex: -1,
                                  className: "absolute -top-2.5 -right-2.5 w-6 h-6 flex items-center justify-center bg-white/40 dark:bg-black/20 text-[#8b6f47] dark:text-[#d4a574] rounded-full  border border-white/50 dark:border-white/10 hover:bg-white/60 active:scale-90 z-[70] transition-all hover:scale-110 opacity-0 group-hover/qty:opacity-100",
                                  onClick: () => ta(a, "quantity", t.quantity * -1),
                                  title: "Đổi thành Trả Hàng (Âm)",
                                  children: e.jsx(Ir, {
                                    size: 10,
                                    strokeWidth: 3
                                  })
                                })]
                              })
                            }), e.jsx("td", {
                              className: "py-2 px-2 text-right",
                              children: e.jsxs("div", {
                                className: "flex flex-col items-center gap-1 group/price relative group-hover/price:z-[500]",
                                children: [e.jsxs("div", {
                                  className: "absolute bottom-full left-1/2 -translate-x-1/2 mb-3 p-1 bg-white/85 dark:bg-slate-900/85 backdrop-blur-[32px] rounded-2xl border border-slate-200 dark:border-white/10 shadow-2xl flex items-stretch whitespace-nowrap z-[9999] opacity-0 group-hover/price:opacity-100 group-focus-within/price:opacity-100 transition-all duration-300 pointer-events-none translate-y-2 group-hover/price:translate-y-0 group-focus-within/price:translate-y-0",
                                  children: [e.jsxs("div", {
                                    className: "flex flex-col items-center px-4 py-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-xl transition-colors",
                                    children: [e.jsx("span", {
                                      className: "text-[9px] uppercase font-black text-slate-500/70 dark:text-slate-400 leading-none mb-1.5 tracking-[0.1em]",
                                      children: "Vốn TB"
                                    }), e.jsxs("span", {
                                      className: "text-sm font-black text-indigo-600 dark:text-indigo-300 tabular-nums",
                                      children: [I(t.cost_price), e.jsx("span", {
                                        className: "text-[10px] ml-1 opacity-50",
                                        children: "đ"
                                      })]
                                    })]
                                  }), e.jsx("div", {
                                    className: "w-px my-2 bg-gradient-to-b from-transparent via-black/10 dark:via-white/10 to-transparent"
                                  }), e.jsxs("div", {
                                    className: "flex flex-col items-center px-4 py-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-xl transition-colors",
                                    children: [e.jsx("span", {
                                      className: "text-[9px] uppercase font-black text-[#8b6f47] dark:text-[#d4a574] leading-none mb-1.5 tracking-[0.1em]",
                                      children: "Nhập cuối"
                                    }), e.jsxs("span", {
                                      className: "text-sm font-black text-emerald-600 dark:text-emerald-400 tabular-nums",
                                      children: [I(t.latest_cost_price || 0), e.jsx("span", {
                                        className: "text-[10px] ml-1 opacity-50",
                                        children: "đ"
                                      })]
                                    })]
                                  }), e.jsx("div", {
                                    className: "absolute top-full left-1/2 -translate-x-1/2 border-[6px] border-transparent border-t-white/85 dark:border-t-slate-900/85"
                                  })]
                                }), e.jsxs("div", {
                                  className: "relative w-full",
                                  children: [e.jsx("input", {
                                    type: "text",
                                    className: u("w-full p-2 text-center bg-transparent border-none focus:ring-2 rounded font-black transition-all outline-none", t.price === 0 ? "text-transparent select-none placeholder:text-transparent" : t.price < t.cost_price ? "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 focus:ring-red-200 dark:focus:ring-red-900" : t.price < (t.latest_cost_price || 0) ? "text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/10 focus:ring-orange-200" : "text-primary dark:text-[#d4a574] focus:ring-2 focus:ring-primary/20 dark:focus:ring-[#4a7c59]/20"),
                                    value: I(t.price),
                                    onFocus: r => r.target.select(),
                                    autoComplete: "off",
                                    onChange: r => {
                                      const s = parseFloat(r.target.value.replace(/,/g, "")) || 0;
                                      ta(a, "price", s)
                                    },
                                    onKeyDown: r => {
                                      if (r.key === "Enter" || r.key === "Tab") {
                                        r.preventDefault();
                                        if (r.key === "Enter") On();
                                        ue.current?.focus();
                                      } else if (r.key === "ArrowDown") {
                                        r.preventDefault();
                                        const s = a + 1;
                                        s < fe.length && document.getElementById(`price-${s}`)?.focus()
                                      } else if (r.key === "ArrowUp") {
                                        r.preventDefault();
                                        const s = a - 1;
                                        s >= 0 ? document.getElementById(`price-${s}`)?.focus() : ur.current?.focus()
                                      }
                                    },
                                    id: `price-${a}`
                                  }), t.price === 0 && e.jsx("div", {
                                    className: "absolute inset-0 flex items-center justify-center pointer-events-none",
                                    children: e.jsx("span", {
                                      className: "bg-rose-500/10 text-rose-600 dark:text-rose-400 font-black text-[10px] px-2 py-0.5 rounded-lg uppercase tracking-wider border border-rose-500/20",
                                      children: "HÀNG TẶNG"
                                    })
                                  })]
                                }), e.jsx(T, {
                                  children: (() => {
                                    const r = z.find(n => n.id === t.product_id),
                                      s = t.latest_cost_price || 0;
                                    return t.price < t.cost_price ? e.jsxs(m.div, {
                                      initial: {
                                        opacity: 0,
                                        scale: .8,
                                        y: -5
                                      },
                                      animate: {
                                        opacity: 1,
                                        scale: 1,
                                        y: 0
                                      },
                                      className: "bg-gradient-to-r from-red-600/90 to-rose-600/90 text-white text-[9px] px-2 py-1 rounded-full font-black whitespace-nowrap z-10 flex items-center gap-1.5  pointer-events-none border border-white/20",
                                      children: [e.jsx(qt, {
                                        size: 10,
                                        className: "text-white"
                                      }), e.jsxs("span", {
                                        children: ["LỖ VỐN (THỰC TẾ:", " ", it(t.cost_price), ")"]
                                      })]
                                    }) : s > 0 && t.price < s && t.price >= t.cost_price ? e.jsxs(m.div, {
                                      initial: {
                                        opacity: 0,
                                        scale: .8,
                                        y: -5
                                      },
                                      animate: {
                                        opacity: 1,
                                        scale: 1,
                                        y: 0
                                      },
                                      className: "bg-gradient-to-r from-orange-500/90 to-orange-600/90 text-white text-[9px] px-2 py-1 rounded-full font-black whitespace-nowrap z-10 flex items-center gap-1.5  pointer-events-none border border-white/20",
                                      children: [e.jsx(_s, {
                                        size: 10,
                                        className: "text-white"
                                      }), e.jsxs("span", {
                                        children: ["DƯỚI VỐN NHẬP MỚI (", it(s), ")"]
                                      })]
                                    }) : r && t.price < r.sale_price && t.price >= (s || t.cost_price) ? e.jsxs(m.div, {
                                      initial: {
                                        opacity: 0,
                                        scale: .8,
                                        y: -5
                                      },
                                      animate: {
                                        opacity: 1,
                                        scale: 1,
                                        y: 0
                                      },
                                      className: "bg-gradient-to-r from-amber-500/90 to-orange-600/90 text-white text-[9px] px-2 py-1 rounded-full font-black whitespace-nowrap z-10 flex items-center gap-1.5  border border-white/20",
                                      children: [e.jsx(Ns, {
                                        size: 10,
                                        className: "text-white"
                                      }), e.jsxs("span", {
                                        children: ["GIÁ THẤP (", it(r.sale_price), ")"]
                                      })]
                                    }) : r && p && E[t.product_id] !== void 0 && t.price === r.sale_price ? e.jsxs(m.div, {
                                      initial: {
                                        opacity: 0,
                                        scale: .8,
                                        y: -5
                                      },
                                      animate: {
                                        opacity: 1,
                                        scale: 1,
                                        y: 0
                                      },
                                      className: "bg-gradient-to-r from-emerald-500 to-emerald-700 text-white text-[9px] px-2 py-1 rounded-full font-black whitespace-nowrap z-10 flex items-center gap-1.5  border border-white/20 ",
                                      children: [e.jsx(Rt, {
                                        size: 10,
                                        className: "text-white"
                                      }), e.jsx("span", {
                                        children: "ĐỒNG BỘ GIÁ"
                                      })]
                                    }) : null
                                  })()
                                })]
                              })
                            }), e.jsxs("td", {
                              className: "py-2 px-4 text-right",
                              children: [e.jsx("div", {
                                className: u("font-black text-lg transition-colors", t.quantity < 0 ? "text-red-600 dark:text-red-400" : "text-primary dark:text-[#d4a574]"),
                                children: I(t.price * t.quantity)
                              }), t.quantity < 0 && e.jsx("span", {
                                className: "inline-block px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded text-[9px] font-black uppercase tracking-widest border border-red-200 dark:border-red-800/50 mt-1",
                                children: "Hàng trả"
                              })]
                            }), e.jsx("td", {
                              className: "py-2 px-2 text-center",
                              children: e.jsx("button", {
                                onClick: r => {
                                  r.stopPropagation(), In(a)
                                },
                                className: "p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all opacity-0 group-hover:opacity-100",
                                title: "Xóa dòng",
                                children: e.jsx(Ar, {
                                  size: 18
                                })
                              })
                            })]
                          }, t.cartId || `cart-row-${a}-${t.product_id}`))]
                        })]
                      })]
                    })
                  })
                }), e.jsx(T, {
                  children: !Lt && e.jsxs(e.Fragment, {
                    children: [e.jsx(m.div, {
                      layout: !0,
                    initial: {
                      scale: .5,
                      opacity: 0,
                      x: ie.partner.x,
                      y: ie.partner.y + 50,
                      filter: "blur(10px)"
                    },
                    animate: {
                      scale: 1,
                      opacity: 1,
                      x: ie.partner.x,
                      y: ie.partner.y,
                      filter: "blur(0.01px)"
                    },
                    exit: {
                      scale: .5,
                      opacity: 0,
                      y: 50,
                      filter: "blur(10px)",
                      transition: {
                        scale: {
                          type: "spring",
                          stiffness: 350,
                          damping: 25,
                          mass: .8
                        },
                        opacity: {
                          duration: .2
                        },
                        y: {
                          type: "spring",
                          stiffness: 350,
                          damping: 25,
                          mass: .8
                        },
                        filter: {
                          duration: .2,
                          ease: "easeOut"
                        }
                      }
                    },
                    drag: !0,
                    dragConstraints: {
                      top: -500 - ie.partner.y,
                      left: -40 - ie.partner.x,
                      right: 1200 - ie.partner.x,
                      bottom: 40 - ie.partner.y
                    },
                    onDragEnd: (t, a) => Br("partner", a.offset),
                    className: "absolute bottom-10 left-10 z-[110] pointer-events-none flex flex-col items-start gap-4",
                    children: e.jsxs("div", {
                      className: "flex items-center gap-4 pointer-events-auto",
                      children: [e.jsxs("div", {
                        onClick: t => {
                          t.stopPropagation(), p ? (Ca(p), Yt(!0)) : Vt.current?.focus()
                        },
                        className: "flex items-start group/partner-bubble cursor-pointer hover:scale-[1.02] transition-all duration-500 p-4 px-6 rounded-[2.5rem] border border-border/50 bg-[#f8f4e8]/95 dark:bg-[#2a2217]/95 backdrop-blur-md hover:bg-[#f5eedb] dark:hover:bg-[#332a1e] hover:border-primary/30 relative overflow-hidden",
                        children: [e.jsx(Cs, {
                          className: "absolute -right-4 -bottom-4 w-32 h-32 text-primary/5 -rotate-12 transition-transform group-hover/partner-bubble:scale-110 group-hover/partner-bubble:-rotate-6 pointer-events-none"
                        }), e.jsxs("div", {
                          className: "flex flex-col max-w-[300px] relative z-10",
                          children: [e.jsx("div", {
                            className: "text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-1",
                            children: "Đối tác / Khách hàng"
                          }), e.jsxs("div", {
                            className: "flex items-center gap-2 mb-2",
                            children: [xe === 'remote_inspect' ? e.jsx("span", {
                              className: "px-2 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-md text-[10px] font-black tracking-wider shrink-0 mt-0.5",
                              children: "MÁY TRẠM"
                            }) : (p && e.jsxs("span", {
                              className: "px-2 py-0.5 bg-primary/10 text-primary rounded-md text-[10px] font-black tracking-wider shrink-0 mt-0.5",
                              children: ["ID: ", p.id]
                            })), e.jsx("div", {
                              className: "text-lg font-black text-foreground uppercase leading-relaxed py-1 tracking-tight truncate",
                              children: xe === 'remote_inspect' ? (activeRemoteTerm?.partner_name || "Khách bán lẻ") : (p ? p.name : "Khách bán lẻ")
                            })]
                          }), displayPartner && e.jsxs("div", {
                            className: "flex flex-col gap-1.5 w-full border-l-2 border-primary/20 pl-3 ml-1",
                            children: [(displayPartner.phone || displayPartner.cccd) && e.jsxs("div", {
                              className: "flex items-center gap-4 text-[11px] font-bold text-muted-foreground",
                              children: [displayPartner.phone && e.jsxs("div", {
                                className: "flex items-center gap-1.5",
                                children: [e.jsx(na, {
                                  size: 12,
                                  className: "text-primary/70 shrink-0"
                                }), e.jsx("span", {
                                  className: "truncate",
                                  children: displayPartner.phone
                                })]
                              }), displayPartner.cccd && e.jsxs("div", {
                                className: "flex items-center gap-1.5",
                                children: [e.jsx(ra, {
                                  size: 12,
                                  className: "text-primary/70 shrink-0"
                                }), e.jsx("span", {
                                  className: "truncate",
                                  children: displayPartner.cccd
                                })]
                              })]
                            }), displayPartner.address && e.jsxs("div", {
                              className: "flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground",
                              children: [e.jsx(Ha, {
                                size: 12,
                                className: "text-primary/70 shrink-0"
                              }), e.jsx("span", {
                                className: "truncate",
                                children: displayPartner.address
                              })]
                            }), (xe === 'remote_inspect' ? (displayPartner.debt_balance || 0) : zt) !== 0 && e.jsxs("div", {
                              className: "flex items-start gap-1.5 text-[11px] font-bold mt-0.5",
                              children: [e.jsx(La, {
                                size: 12,
                                className: "text-primary/70 shrink-0 mt-0.5"
                              }), e.jsx("span", {
                                className: "text-muted-foreground uppercase tracking-wider text-[10px] whitespace-nowrap mt-0.5",
                                children: "Dư nợ:"
                              }), (() => {
                                   if (xe === 'remote_inspect') {
                                     const bal = displayPartner.debt_balance || 0;
                                     return e.jsxs("span", {
                                       className: u("font-black text-xs ml-1", bal > 0 ? "text-rose-500" : "text-emerald-500"),
                                       children: [it(Math.abs(bal)), bal < 0 ? " (Mình nợ)" : bal > 0 ? " (Khách nợ)" : ""]
                                     });
                                   }
                                   const changeVal = zt - Dt;
                                   if (changeVal === 0) {
                                     return e.jsxs("span", {
                                       className: u("font-black text-xs ml-1", Dt > 0 ? "text-rose-500" : "text-emerald-500"),
                                       children: [it(Math.abs(Dt)), Dt < 0 ? " (Mình nợ)" : Dt > 0 ? " (Khách nợ)" : ""]
                                     });
                                   }
                                   return e.jsxs("span", {
                                      className: "font-black text-xs ml-1 flex flex-col items-start gap-1",
                                      children: [
                                        e.jsxs("span", {
                                          className: Dt > 0 ? "text-rose-500/80" : Dt < 0 ? "text-emerald-500/80" : "text-foreground/80",
                                          children: [it(Math.abs(Dt)), Dt < 0 ? " (Mình nợ)" : Dt > 0 ? " (Khách nợ)" : ""]
                                        }),
                                        e.jsxs("div", {
                                          className: "flex items-center gap-1.5",
                                          children: [
                                            e.jsx("span", {
                                              className: "text-muted-foreground text-[10px]",
                                              children: "➔"
                                            }),
                                            e.jsxs("span", {
                                              className: zt > 0 ? "text-rose-500" : zt < 0 ? "text-emerald-500" : "text-foreground",
                                              children: [it(Math.abs(zt)), zt < 0 ? " (Mình nợ)" : zt > 0 ? " (Khách nợ)" : ""]
                                            })
                                          ]
                                        })
                                      ]
                                    });
                                  })()]
                               })]
                             })]
                           })]
                         }), e.jsxs("div", {
                           className: "relative group/note-container pointer-events-auto",
                           children: [e.jsxs("div", {
                             onClick: t => {
                               t.stopPropagation(), rr(!ba)
                             },
                             className: u("w-12 h-12 rounded-[1.2rem] flex items-center justify-center transition-all cursor-pointer hover:scale-110 active:scale-95 pos-card bg-[#f8f4e8]/95 dark:bg-[#2a2217]/95 backdrop-blur-md", pe ? "text-primary border-primary/50" : "text-muted dark:text-gray-400 border-white/20 dark:border-white/5", ba && "bg-white/40 dark:bg-slate-900/40 border-primary"),
                             title: "Ghi chú hóa đơn",
                             children: [e.jsx(ra, {
                              size: 20,
                              className: pe ? "text-primary" : "text-[#8b6f47]/70 dark:text-[#d4a574]/80",
                              strokeWidth: 2.5
                            }), pe && e.jsx("div", {
                              className: "absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-rose-500 rounded-full  border border-white/50"
                            })]
                          }), e.jsx(T, {
                            children: ba && e.jsxs(m.div, {
                              initial: {
                                opacity: 0,
                                scale: .9,
                                x: -20,
                                y: 20
                              },
                              animate: {
                                opacity: 1,
                                scale: 1,
                                x: 0,
                                y: 0
                              },
                              exit: {
                                opacity: 0,
                                scale: .9,
                                x: -20,
                                y: 20
                              },
                              onClick: t => t.stopPropagation(),
                              className: "absolute bottom-full left-0 mb-4 w-[280px] bg-transparent p-4 rounded-2xl  border border-[#8b6f47]/20 dark:border-white/10 z-[100]",
                              children: [e.jsxs("div", {
                                className: "flex justify-between items-center mb-2",
                                children: [e.jsx("div", {
                                  className: "text-[10px] font-black text-[#8b6f47]/60 dark:text-[#d4a574]/60 uppercase tracking-widest",
                                  children: "Ghi chú đơn"
                                }), e.jsx("button", {
                                  onClick: t => {
                                    t.stopPropagation(), rr(!1)
                                  },
                                  className: "text-muted-foreground hover:text-primary transition-colors",
                                  children: e.jsx(Se, {
                                    size: 14,
                                    strokeWidth: 3
                                  })
                                })]
                              }), e.jsx("textarea", {
                                autoFocus: !0,
                                placeholder: "Nhập ghi chú cho hóa đơn này...",
                                rows: 3,
                                className: "w-full px-4 py-3 bg-[#f9f8f6] dark:bg-slate-900 border border-[#8b6f47]/10 dark:border-white/5 rounded-[1rem] text-sm font-bold outline-none focus:ring-2 focus:ring-primary/30 transition-all resize-none shadow-none custom-scrollbar dark:text-white",
                                value: pe,
                                onChange: t => Ve(t.target.value)
                              })]
                            })
                          })]
                        }), e.jsxs("div", {
                          className: "relative group/ship-container pointer-events-auto",
                          children: [e.jsxs("div", {
                            onClick: t => {
                              t.stopPropagation(), Ee ? mt(null) : (mt("Shipping"), p && (St(p.address || ""), It(p.phone || "")))
                            },
                            className: u("w-12 h-12 rounded-[1.2rem] flex items-center justify-center transition-all cursor-pointer hover:scale-110 active:scale-95 pos-card bg-[#f8f4e8]/95 dark:bg-[#2a2217]/95 backdrop-blur-md", Ee ? "text-emerald-600 border-emerald-500 shadow-emerald-500/20" : "text-muted dark:text-gray-400 border-white/20 dark:border-white/5"),
                            title: "Giao hàng tận nơi",
                            children: [e.jsx(lt, {
                              size: 20,
                              strokeWidth: 2.5,
                              className: Ee ? "text-emerald-600" : "text-[#8b6f47]/70 dark:text-[#d4a574]/80"
                            }), Ee && e.jsx("div", {
                              className: "absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-800"
                            })]
                          }), e.jsx(T, {
                            children: Ee && e.jsxs(m.div, {
                              initial: {
                                opacity: 0,
                                scale: .9,
                                x: -20,
                                y: 20
                              },
                              animate: {
                                opacity: 1,
                                scale: 1,
                                x: 0,
                                y: 0
                              },
                              exit: {
                                opacity: 0,
                                scale: .9,
                                x: -20,
                                y: 20
                              },
                              onClick: t => t.stopPropagation(),
                              className: "absolute bottom-full left-0 mb-4 w-[320px] bg-transparent p-5 rounded-[2rem]  border border-emerald-500/20 z-[100]",
                              children: [e.jsxs("div", {
                                className: "flex justify-between items-center mb-4",
                                children: [e.jsxs("div", {
                                  className: "flex items-center gap-2",
                                  children: [e.jsx(lt, {
                                    size: 16,
                                    className: "text-emerald-500"
                                  }), e.jsx("div", {
                                    className: "text-[10px] font-black text-emerald-600 uppercase tracking-widest",
                                    children: "Thông tin giao hàng"
                                  })]
                                }), e.jsx("button", {
                                  onClick: t => {
                                    t.stopPropagation(), mt(null)
                                  },
                                  className: "text-muted-foreground hover:text-rose-500 transition-colors",
                                  children: e.jsx(Se, {
                                    size: 14,
                                    strokeWidth: 3
                                  })
                                })]
                              }), e.jsxs("div", {
                                className: "space-y-4",
                                children: [e.jsxs("div", {
                                  className: "space-y-1",
                                  children: [e.jsx("label", {
                                    className: "text-[9px] font-black uppercase text-gray-400 ml-1",
                                    children: "Địa chỉ giao hàng"
                                  }), e.jsx("textarea", {
                                    placeholder: "Nhập địa chỉ nhận hàng...",
                                    rows: 2,
                                    className: "w-full px-4 py-3 bg-transparent border border-emerald-500/10 dark:border-white/5 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all resize-none dark:text-white",
                                    value: Sa,
                                    onChange: t => St(t.target.value)
                                  })]
                                }), e.jsxs("div", {
                                  className: "space-y-1",
                                  children: [e.jsx("label", {
                                    className: "text-[9px] font-black uppercase text-gray-400 ml-1",
                                    children: "Số điện thoại nhận"
                                  }), e.jsxs("div", {
                                    className: "relative",
                                    children: [e.jsx(na, {
                                      size: 12,
                                      className: "absolute left-3 top-1/2 -translate-y-1/2 text-gray-300"
                                    }), e.jsx("input", {
                                      type: "text",
                                      placeholder: "SĐT người nhận...",
                                      className: "w-full h-10 pl-9 pr-4 bg-transparent border border-emerald-500/10 dark:border-white/5 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all dark:text-white",
                                      value: Ia,
                                      onChange: t => It(t.target.value)
                                    })]
                                  })]
                                })]
                              })]
                            })
                          })]
                        })]
                      })
                    }), e.jsxs(m.div, {
                      layout: !0,
                      initial: {
                        scale: .5,
                        opacity: 0,
                        x: ie.total.x,
                        y: ie.total.y + 50,
                        filter: "blur(10px)"
                      },
                      animate: {
                        scale: 1,
                        opacity: 1,
                        x: ie.total.x,
                        y: ie.total.y,
                        filter: "blur(0.01px)"
                      },
                      exit: {
                        scale: .5,
                        opacity: 0,
                        y: 50,
                        filter: "blur(10px)"
                      },
                      transition: {
                        scale: {
                          type: "spring",
                          stiffness: 350,
                          damping: 25,
                          mass: .8
                        },
                        opacity: {
                          duration: .2
                        },
                        y: {
                          type: "spring",
                          stiffness: 350,
                          damping: 25,
                          mass: .8
                        },
                        filter: {
                          duration: .2,
                          ease: "easeOut"
                        }
                      },
                      drag: !0,
                      dragConstraints: {
                        top: -800 - ie.total.y,
                        left: -1200 - ie.total.x,
                        right: 40 - ie.total.x,
                        bottom: 40 - ie.total.y
                      },
                      onDragEnd: (t, a) => Br("total", a.offset),
                      className: "absolute bottom-10 right-10 z-[110] pointer-events-none flex items-center gap-4",
                      children: [D === "Cash" && e.jsxs("div", {
                        className: "pointer-events-auto flex items-center pos-card bg-[#f8f4e8]/95 dark:bg-[#2a2217]/95 backdrop-blur-md p-4 pr-8 rounded-[2.5rem]  group/cash-calculator relative min-w-[220px] hover:scale-105 transition-all duration-500",
                        children: [e.jsx("div", {
                          className: "w-12 h-12 bg-primary/10 dark:bg-emerald-500/10 border border-primary/20 rounded-2xl flex items-center justify-center text-primary dark:text-emerald-400  group-hover/cash-calculator:rotate-12 transition-transform",
                          children: e.jsx(bt, {
                            size: 24
                          })
                        }), e.jsxs("div", {
                          className: "flex flex-col ml-4",
                          children: [e.jsx("span", {
                            className: "text-[10px] font-black uppercase tracking-[0.2em] text-primary/80 dark:text-emerald-400/80 mb-0.5 whitespace-nowrap",
                            children: "Khách đưa (F1)"
                          }), e.jsxs("div", {
                            className: "flex items-center gap-3",
                            children: [e.jsxs("div", {
                              className: "relative flex items-center min-w-[80px] group/input-wrapper h-full",
                              children: [e.jsx("span", {
                                className: "invisible whitespace-pre font-black text-2xl px-1 pointer-events-none tabular-nums select-none",
                                children: I(ne) || "0"
                              }), e.jsx("input", {
                                id: "cash-given-compact",
                                ref: _a,
                                type: "text",
                                className: "absolute inset-0 w-full h-full bg-transparent border-b-2 border-primary/20 focus:border-primary dark:focus:border-emerald-450 outline-none font-black text-2xl text-gray-900 dark:text-white p-0 tabular-nums transition-all z-10",
                                value: I(ne),
                                autoComplete: "off",
                                onChange: t => Xe(parseFloat(t.target.value.replace(/,/g, "")) || 0),
                                onFocus: t => t.target.select()
                              })]
                            }), ne > 0 && e.jsxs("div", {
                              className: "flex flex-col items-end min-w-[100px] border-l border-primary/10 dark:border-emerald-500/10 pl-4 py-1",
                              children: [e.jsx("span", {
                                className: "text-[9px] font-black text-primary/60 dark:text-emerald-400/60 uppercase leading-none mb-1 whitespace-nowrap",
                                children: "Tiền thối"
                              }), e.jsx("span", {
                                className: u("text-2xl font-black tabular-nums transition-colors", ne > A ? "text-emerald-600 dark:text-emerald-400" : "text-gray-400 opacity-50"),
                                children: I(Math.max(0, ne - A))
                              })]
                            })]
                          })]
                        })]
                      }), (p || xe === 'remote_inspect') && e.jsxs("div", {
                        className: "w-[180px] pointer-events-auto flex items-center pos-card bg-[#f8f4e8]/95 dark:bg-[#2a2217]/95 backdrop-blur-md p-1.5 rounded-[2.5rem]  group/payment-toggle relative h-[75px] transition-all duration-500",
                        children: [e.jsx(m.div, {
                          layout: !0,
                          className: "absolute inset-y-1.5 bg-[#059669] rounded-[2rem]  z-0",
                          style: {
                            width: "calc(50% - 6px)",
                            left: (xe === 'remote_inspect' ? (activeRemoteTerm?.payment_method || 'Cash') : D) === "Cash" ? "6px" : "calc(50%)"
                          },
                          transition: {
                            type: "spring",
                            stiffness: 400,
                            damping: 30
                          }
                        }), e.jsxs("button", {
                          onClick: t => {
                            t.stopPropagation(), me("Cash"), J(A)
                          },
                          className: u("flex-1 h-full rounded-xl flex flex-col items-center justify-center transition-all duration-300 relative z-10 gap-0.5", D === "Cash" ? "text-white" : "text-slate-400 hover:text-primary dark:hover:text-emerald-400"),
                          children: [e.jsx(bt, {
                            size: 14,
                            className: u(D === "Cash" ? "opacity-100" : "opacity-40")
                          }), e.jsx("span", {
                            className: "text-[10px] font-black uppercase tracking-wider",
                            children: "Tiền mặt"
                          })]
                        }), e.jsxs("button", {
                          onClick: t => {
                            t.stopPropagation(), me("Debt"), J(0)
                          },
                          className: u("flex-1 h-full rounded-xl flex flex-col items-center justify-center transition-all duration-300 relative z-10 gap-0.5", D === "Debt" ? "text-white" : "text-slate-400 hover:text-primary dark:hover:text-emerald-400"),
                          children: [e.jsx(Ot, {
                            size: 14,
                            className: u(D === "Debt" ? "opacity-100" : "opacity-40")
                          }), e.jsx("span", {
                            className: "text-[10px] font-black uppercase tracking-wider",
                            children: "Ghi nợ"
                          })]
                        })]
                      }), e.jsxs("div", {
                        onMouseDown: rs,
                        onMouseUp: br,
                        onMouseLeave: br,
                        onTouchStart: rs,
                        onTouchEnd: br,
                        className: "px-10 py-6 rounded-[2.5rem] border border-border/50 bg-[#f8f4e8]/95 dark:bg-[#2a2217]/95 backdrop-blur-md hover:bg-[#f5eedb] dark:hover:bg-[#332a1e] flex flex-col items-end group/total pointer-events-auto relative overflow-hidden",
                        children: [e.jsx(La, {
                          className: "absolute -left-8 -bottom-8 w-40 h-40 text-emerald-500/5 -rotate-12 transition-transform group-hover/total:scale-110 group-hover/total:-rotate-6 pointer-events-none"
                        }), e.jsxs("div", {
                          className: "flex items-center gap-2 mb-1 z-10 relative",
                          children: [e.jsx("div", {
                            className: "w-1.5 h-1.5 rounded-full bg-emerald-500"
                          }), e.jsx("span", {
                            className: "text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-1.5",
                            children: "Tổng cộng thanh toán"
                          })]
                        }), e.jsxs("div", {
                          className: "text-4xl font-black tracking-tighter tabular-nums text-foreground flex items-baseline gap-1 z-10 relative",
                          children: [I(xe === 'remote_inspect' ? (activeRemoteTerm?.total_amount || (activeRemoteTerm?.cart || []).reduce((sum, item) => sum + (item.price || item.sale_price || 0) * (item.quantity || 1), 0)) : A), e.jsx("span", {
                            className: "text-sm text-emerald-600 dark:text-emerald-400 font-bold ml-1",
                            children: "đ"
                          })]
                        }), pn && (b.some(t => t.product_id !== null) || o.product && o.product.id !== null) && e.jsxs("div", {
                          className: "mt-2 px-4 py-2 bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 rounded-[1rem] flex items-center gap-2 border border-emerald-500/20 scale-105 z-10 relative",
                          children: [e.jsx(_s, {
                            size: 14,
                            className: "text-emerald-600 dark:text-emerald-400"
                          }), e.jsxs("span", {
                            className: "text-[11px] font-black uppercase tracking-tight",
                            children: ["Lợi nhuận: ", I(yn), "đ"]
                          })]
                        })]
                      })]
                    }, "total-bubble")]
                  })
                })]
              })
            })
          }), Lt && e.jsx("div", {
            onMouseDown: Pn,
            className: u("w-1.5 h-full cursor-col-resize transition-all hover:bg-primary/20 flex items-center justify-center group relative z-[600]", Ht && "bg-primary/30"),
            children: e.jsx("div", {
              className: "w-0.5 h-12 bg-slate-300 dark:bg-slate-700 rounded-full group-hover:bg-primary/50 transition-colors"
            })
          }), e.jsx(m.div, {
            initial: !1,
            animate: {
              width: Lt ? `${100-Fr-1}%` : "90px"
            },
            transition: Ht ? {
              duration: 0
            } : {
              type: "spring",
              stiffness: 300,
              damping: 30
            },
            className: "flex flex-col bg-transparent min-h-0 relative z-[3000]",
            children: e.jsx("div", {
              className: "p-1 transition-colors relative flex-1 flex flex-col min-h-0",
              children: e.jsx(T, {
                mode: "wait",
                children: Lt ? e.jsxs(m.div, {
                  initial: {
                    opacity: 0,
                    x: 20,
                    scale: .98
                  },
                  animate: {
                    opacity: 1,
                    x: 0,
                    scale: 1
                  },
                  exit: {
                    opacity: 0,
                    x: 20,
                    scale: .98
                  },
                  transition: {
                    type: "spring",
                    stiffness: 400,
                    damping: 30,
                    mass: 1
                  },
                  className: "h-full flex flex-col relative bg-transparent rounded-[2.5rem] py-4 px-0",
                  children: [e.jsx(m.button, {
                    whileHover: {
                      scale: 1.2,
                      x: 2
                    },
                    whileTap: {
                      scale: .9
                    },
                    onClick: () => $r(!1),
                    className: "absolute -left-10 top-[32px] w-9 h-9 bg-transparent rounded-full flex items-center justify-center text-[#8b6f47] dark:text-[#d4a574] border-[3px] border-white dark:border-slate-800 z-[60]  hover: ring-2 ring-[#d4a574]/30 transition-all group/toggle-open",
                    children: e.jsx(Sr, {
                      size: 18,
                      strokeWidth: 4,
                      className: "group-hover/toggle-open:translate-x-0.5 transition-transform"
                    })
                  }), e.jsxs("div", {
                    className: "flex flex-col gap-3 relative z-10 flex-1 overflow-y-auto px-3 pb-2 scroll-smooth",
                    children: [e.jsxs("div", {
                      className: "space-y-3",
                      children: [e.jsxs("div", {
                        onClick: () => {
                          p ? (Ca(p), Yt(!0)) : Vt.current?.focus()
                        },
                        className: "flex items-center gap-3.5 bg-transparent dark:bg-transparent p-3.5 rounded-3xl border border-[#d4a574]/30 dark:border-[#d4a574]/15 transition-all duration-300 ease-in-out hover:bg-white/30 dark:hover:bg-white/5 hover:scale-[1.01] active:scale-[0.99] group/partner-sidebar cursor-pointer relative",
                        children: [e.jsxs("div", {
                          className: "flex-1 min-w-0 relative z-10",
                          children: [e.jsxs("div", {
                            className: "flex items-center gap-2 mb-0.5 w-full",
                            children: [e.jsx("div", {
                              className: "text-[11px] font-black text-[#8b6f47]/60 dark:text-[#d4a574]/60 uppercase tracking-[0.1em]",
                              children: "KHÁCH HÀNG"
                            }), p && e.jsxs("div", {
                              className: "bg-emerald-50 text-emerald-800 text-[10px] font-black tracking-wider px-2 py-0.5 rounded-full border border-emerald-500 dark:border-emerald-700",
                              children: ["#", p.id]
                            }), p && e.jsx("button", {
                              onClick: t => {
                                t.stopPropagation(), Va(!da)
                              },
                              className: "ml-auto w-6 h-6 rounded-full bg-[#8b6f47]/10 dark:bg-[#d4a574]/15 hover:bg-[#8b6f47]/20 text-[#8b6f47] dark:text-[#d4a574] flex items-center justify-center border border-[#d4a574]/35 transition-all cursor-pointer shrink-0 z-20 partner-popout-trigger",
                              title: "Xem lịch sử giao dịch gần đây",
                              children: e.jsx(ia, {
                                size: 12,
                                strokeWidth: 3
                              })
                            })]
                          }), e.jsx("div", {
                            className: "font-black text-[#2d5016] dark:text-white text-lg uppercase leading-normal py-1 truncate group-hover:text-primary transition-colors",
                            children: p ? p.name : "KHÁCH BÁN LẺ"
                          }), p && e.jsxs("div", {
                            className: "flex flex-col gap-1 mt-1.5",
                            children: [(p.phone || p.address) && e.jsxs("div", {
                              className: "flex items-center gap-2 text-xs font-bold text-gray-500 dark:text-gray-400 truncate bg-white/50 dark:bg-slate-900/40 px-2 py-1 rounded-xl w-fit max-w-full",
                              children: [e.jsx(na, {
                                size: 11,
                                strokeWidth: 3,
                                className: "shrink-0 text-[#8b6f47] dark:text-[#d4a574]"
                              }), e.jsx("span", {
                                className: "truncate",
                                children: displayPartner.phone || "N/A"
                              }), p.address && e.jsxs(e.Fragment, {
                                children: [e.jsx("div", {
                                  className: "w-1 h-1 rounded-full bg-gray-300"
                                }), e.jsx(Ha, {
                                  size: 11,
                                  strokeWidth: 3,
                                  className: "shrink-0 text-emerald-500"
                                }), e.jsx("span", {
                                  className: "truncate",
                                  children: displayPartner.address
                                })]
                              })]
                            }), displayPartner.cccd && e.jsxs("div", {
                              className: "flex items-center gap-2 text-xs font-bold text-gray-500 dark:text-gray-400 truncate bg-white/50 dark:bg-slate-900/40 px-2 py-1 rounded-xl w-fit max-w-full",
                              children: [e.jsx(ra, {
                                size: 11,
                                strokeWidth: 3,
                                className: "shrink-0 text-indigo-500"
                              }), e.jsxs("span", {
                                className: "truncate",
                                children: ["CCCD: ", p.cccd]
                              })]
                            })]
                          })]
                        }), p && e.jsxs("div", {
                          ref: be,
                          onClick: t => t.stopPropagation(),
                          className: u("absolute right-full top-1/2 -translate-y-1/2 mr-3 w-56 p-3.5 rounded-2xl bg-gradient-to-br from-[#a7f3d0]/90 to-[#99f6e4]/90 dark:from-[#042f2e]/90 dark:to-[#115e59]/90 backdrop-blur-xl shadow-2xl border border-emerald-400/30 transition-all duration-300 z-[9999] text-left text-slate-800 dark:text-emerald-150 partner-popout-container", da ? "pointer-events-auto opacity-100 translate-x-0" : "pointer-events-none opacity-0 translate-x-2"),
                          children: [e.jsx("div", {
                            className: "border-b border-emerald-500/20 dark:border-emerald-300/10 pb-1.5 mb-2",
                            children: e.jsx("div", {
                              className: "text-[9px] font-black uppercase tracking-[0.15em] opacity-80 text-emerald-800 dark:text-emerald-250",
                              children: "LỊCH SỬ GIAO DỊCH"
                            })
                          }), e.jsxs("div", {
                            className: "flex bg-black/5 dark:bg-white/5 p-0.5 rounded-lg mb-2",
                            children: [e.jsx("button", {
                              onClick: () => gt("debt"),
                              className: u("flex-1 py-0.5 rounded-md text-[8px] font-black uppercase transition-all", se === "debt" ? "bg-white/60 dark:bg-white/10 text-emerald-800 dark:text-white shadow-sm" : "text-emerald-700/60 dark:text-emerald-300/60 hover:text-emerald-900 dark:hover:text-white"),
                              children: "Mua nợ"
                            }), e.jsx("button", {
                              onClick: () => gt("cash"),
                              className: u("flex-1 py-0.5 rounded-md text-[8px] font-black uppercase transition-all", se === "cash" ? "bg-white/60 dark:bg-white/10 text-emerald-800 dark:text-white shadow-sm" : "text-emerald-700/60 dark:text-emerald-300/60 hover:text-emerald-900 dark:hover:text-white"),
                              children: "Mua tiền"
                            })]
                          }), Or ? e.jsxs("div", {
                            className: "flex items-center gap-2 py-2 font-black uppercase text-[10px] tracking-wider opacity-85",
                            children: [e.jsx(Ts, {
                              size: 14,
                              className: "animate-spin text-emerald-750 dark:text-emerald-300"
                            }), e.jsx("span", {
                              children: "Đang tải..."
                            })]
                          }) : (se === "debt" ? Oe : We) ? e.jsxs("div", {
                            onClick: () => {
                              const t = se === "debt" ? Oe : We;
                              t && t.obj && (Na(t.obj), Ct(!0))
                            },
                            className: "space-y-2 py-1 cursor-pointer hover:bg-white/20 dark:hover:bg-white/5 rounded-xl transition-all active:scale-[0.98] border border-transparent",
                            children: [e.jsxs("div", {
                              className: "flex items-center gap-2.5",
                              children: [e.jsx("div", {
                                className: "w-7 h-7 rounded-lg bg-white/40 dark:bg-white/10 flex items-center justify-center shrink-0",
                                children: e.jsx(bt, {
                                  size: 15,
                                  className: "text-emerald-750 dark:text-emerald-355"
                                })
                              }), e.jsxs("div", {
                                children: [e.jsx("div", {
                                  className: "text-[8px] font-black uppercase tracking-wider opacity-60",
                                  children: "SỐ TIỀN"
                                }), e.jsx("div", {
                                  className: "text-xs font-black text-rose-600 dark:text-rose-400 uppercase",
                                  children: (() => {
                                    const t = se === "debt" ? Oe : We;
                                    return it(t.increase || t.obj?.total_amount || 0)
                                  })()
                                })]
                              })]
                            }), e.jsxs("div", {
                              className: "flex items-center gap-2.5",
                              children: [e.jsx("div", {
                                className: "w-7 h-7 rounded-lg bg-white/40 dark:bg-white/10 flex items-center justify-center shrink-0",
                                children: e.jsx(ra, {
                                  size: 15,
                                  className: "text-emerald-750 dark:text-emerald-355"
                                })
                              }), e.jsxs("div", {
                                className: "min-w-0 flex-1",
                                children: [e.jsx("div", {
                                  className: "text-[8px] font-black uppercase tracking-wider opacity-60",
                                  children: "NỘI DUNG"
                                }), e.jsx("div", {
                                  className: "text-[10px] font-black uppercase truncate text-slate-800 dark:text-emerald-100",
                                  children: (se === "debt" ? Oe : We).desc
                                })]
                              })]
                            }), e.jsxs("div", {
                              className: "flex items-center gap-2.5",
                              children: [e.jsx("div", {
                                className: "w-7 h-7 rounded-lg bg-white/40 dark:bg-white/10 flex items-center justify-center shrink-0",
                                children: e.jsx(ia, {
                                  size: 15,
                                  className: "text-emerald-750 dark:text-emerald-355"
                                })
                              }), e.jsxs("div", {
                                children: [e.jsx("div", {
                                  className: "text-[8px] font-black uppercase tracking-wider opacity-60",
                                  children: "THỜI GIAN"
                                }), e.jsx("div", {
                                  className: "text-[10px] font-black uppercase text-slate-800 dark:text-emerald-100",
                                  children: Fe((se === "debt" ? Oe : We).date)
                                })]
                              })]
                            })]
                          }) : e.jsxs("div", {
                            className: "py-4 text-center font-black uppercase text-xs tracking-wider opacity-60 italic",
                            children: ["Không có giao dịch ", se === "debt" ? "nợ" : "tiền mặt", " gần đây"]
                          })]
                        })]
                      }), e.jsxs("div", {
                        className: "relative",
                        children: [e.jsx("div", {
                          className: "absolute left-3 top-3 text-primary/40 dark:text-[#d4a574]/40 z-10",
                          children: e.jsx(ui, {
                            size: 16
                          })
                        }), e.jsx("textarea", {
                          placeholder: "Ghi chú đơn bán...",
                          className: "w-full pl-9 p-3 bg-transparent border border-border rounded-[1.5rem] focus:border-primary/50 dark:focus:border-[#4a7c59] outline-none transition-all resize-none h-16 text-xs italic dark:text-gray-350 ",
                          value: pe,
                          onChange: t => Ve(t.target.value)
                        })]
                      })]
                    }), e.jsxs("div", {
                      className: "flex-1 space-y-3 pt-1",
                      children: [e.jsxs("div", {
                        className: "pos-card p-5 rounded-[1.5rem]  relative overflow-hidden group/total-main cursor-default hover:scale-[1.02] transition-all duration-300 ease-in-out flex flex-col items-center",
                        children: [e.jsx("div", {
                          className: "absolute inset-0 bg-white/10 opacity-0 group-hover/total-main:opacity-100 transition-opacity duration-300"
                        }), e.jsx("div", {
                          className: "text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-[0.3em] mb-1 text-center relative z-10",
                          children: "TỔNG THANH TOÁN"
                        }), e.jsxs("div", {
                          className: "font-black text-3xl text-center text-emerald-700 dark:text-emerald-300 whitespace-nowrap overflow-hidden relative z-10 drop-",
                          children: [I(A), e.jsx("span", {
                            className: "text-sm opacity-80 font-bold ml-1",
                            children: "đ"
                          })]
                        })]
                      }), e.jsxs("div", {
                        className: "space-y-3 px-1",
                        children: [e.jsxs("div", {
                          className: "flex justify-between items-center pos-card p-3 rounded-[1.2rem]  hover:scale-[1.01] transition-all duration-300 ease-in-out",
                          children: [e.jsx("span", {
                            className: "text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest",
                            children: "NỢ CŨ KH:"
                          }), e.jsx("span", {
                            className: "font-black text-sm text-red-500 dark:text-red-400/80",
                            children: I(Dt)
                          })]
                        }), e.jsxs("div", {
                          className: "flex justify-between items-center pos-card p-3 rounded-[1.2rem] border-indigo-500/20 dark:border-indigo-500/25  hover:scale-[1.01] transition-all duration-300 ease-in-out",
                          children: [e.jsxs("div", {
                            className: "flex items-center gap-2",
                            children: [e.jsx(lt, {
                              size: 16,
                              className: "text-indigo-600 dark:text-indigo-500"
                            }), e.jsx("span", {
                              className: "text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest",
                              children: "GIAO HÀNG TẬN NƠI:"
                            })]
                          }), e.jsxs("label", {
                            onClick: t => {
                              t.preventDefault(), Ee ? mt(null) : (mt("Shipping"), p && (St(p.address || ""), It(p.phone || "")))
                            },
                            className: "relative inline-flex items-center cursor-pointer",
                            children: [e.jsx("input", {
                              type: "checkbox",
                              checked: !!Ee,
                              readOnly: !0,
                              className: "sr-only"
                            }), e.jsx("div", {
                              className: u("w-9 h-5 rounded-full transition-all duration-300 ease-in-out relative after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all after:duration-300 after:ease-in-out", Ee ? "bg-indigo-600 after:translate-x-4" : "bg-gray-200 dark:bg-gray-700")
                            })]
                          })]
                        }), e.jsxs("div", {
                          className: u("transition-all duration-300 ease-in-out overflow-hidden space-y-2 pos-card rounded-[1.2rem] border-indigo-500/20 dark:border-indigo-500/25 ", Ee === "Shipping" ? "max-h-[160px] p-3 border mt-2 opacity-100" : "max-h-0 p-0 border-0 opacity-0 pointer-events-none"),
                          children: [e.jsx("input", {
                            type: "text",
                            placeholder: "Địa chỉ giao hàng...",
                            className: "w-full p-2.5 bg-white/20 dark:bg-slate-900/30 border border-white/20 dark:border-white/10 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:bg-white/40 focus:border-indigo-500 dark:focus:border-indigo-400 outline-none transition-all duration-300 ease-in-out",
                            value: Sa,
                            onChange: t => St(t.target.value)
                          }), e.jsx("input", {
                            type: "text",
                            placeholder: "Số điện thoại nhận hàng...",
                            className: "w-full p-2.5 bg-white/20 dark:bg-slate-900/30 border border-white/20 dark:border-white/10 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:bg-white/40 focus:border-indigo-500 dark:focus:border-indigo-400 outline-none transition-all duration-300 ease-in-out",
                            value: Ia,
                            onChange: t => It(t.target.value)
                          })]
                        }), e.jsxs("div", {
                          className: u("transition-all duration-300 ease-in-out grid grid-cols-2 gap-2", p ? "max-h-[60px] mt-2 opacity-100 overflow-visible" : "max-h-0 opacity-0 overflow-hidden pointer-events-none"),
                          children: [e.jsxs(m.button, {
                            whileHover: {
                              y: -2,
                              scale: 1.02
                            },
                            whileTap: {
                              scale: .98
                            },
                            onClick: () => ha(!0),
                            className: "flex items-center justify-center gap-1.5 py-2 px-3 bg-transparent text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/20 rounded-xl font-black text-xs uppercase tracking-wider transition-all duration-300 ease-in-out hover:bg-emerald-50 dark:hover:bg-emerald-950/40",
                            children: [e.jsx(Pr, {
                              size: 14,
                              strokeWidth: 2.5
                            }), e.jsx("span", {
                              children: "Ghi nợ"
                            })]
                          }), e.jsxs(m.button, {
                            whileHover: {
                              y: -2,
                              scale: 1.02
                            },
                            whileTap: {
                              scale: .98
                            },
                            onClick: () => fa(!0),
                            className: "flex items-center justify-center gap-1.5 py-2 px-3 bg-transparent text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/20 rounded-xl font-black text-xs uppercase tracking-wider transition-all duration-300 ease-in-out hover:bg-emerald-50 dark:hover:bg-emerald-950/40",
                            children: [e.jsx(Er, {
                              size: 14,
                              strokeWidth: 2.5
                            }), e.jsx("span", {
                              children: "Thu/Chi"
                            })]
                          })]
                        }), e.jsxs("div", {
                          className: "flex flex-col gap-3",
                          children: [e.jsxs("div", {
                            className: "flex pos-card p-1.5 rounded-[1.2rem] gap-1 ",
                            children: [e.jsx("button", {
                              onClick: () => {
                                me("Cash"), J(A)
                              },
                              className: u("flex-1 py-1.5 rounded-lg text-[9px] font-black transition-all duration-300 ease-in-out hover:opacity-90 active:scale-95", D === "Cash" ? "bg-gradient-to-br from-emerald-600 to-emerald-500 text-white  hover:scale-[1.02]" : "text-slate-600 dark:text-slate-400 hover:text-emerald-500 hover:bg-white/10"),
                              children: "TIỀN MẶT"
                            }), e.jsx("button", {
                              onClick: () => {
                                me("Debt"), J(0)
                              },
                              className: u("flex-1 py-1.5 rounded-lg text-[9px] font-black transition-all duration-300 ease-in-out hover:opacity-90 active:scale-95", D === "Debt" ? "bg-gradient-to-br from-rose-600 to-rose-500 text-white  hover:scale-[1.02]" : "text-slate-600 dark:text-slate-400 hover:text-rose-500 hover:bg-white/10"),
                              children: "CÔNG NỢ"
                            }), e.jsx("button", {
                              onClick: () => me("Transfer"),
                              className: u("flex-1 py-1.5 rounded-lg text-[9px] font-black transition-all duration-300 ease-in-out hover:opacity-90 active:scale-95", D === "Transfer" ? "bg-gradient-to-br from-blue-600 to-blue-500 text-white  hover:scale-[1.02]" : "text-slate-600 dark:text-slate-450 hover:text-blue-600 hover:bg-white/10"),
                              children: "C/K"
                            })]
                          }), e.jsx(T, {
                            children: D === "Transfer" && e.jsxs(m.div, {
                              initial: {
                                opacity: 0,
                                height: 0,
                                y: -10
                              },
                              animate: {
                                opacity: 1,
                                height: "auto",
                                y: 0
                              },
                              exit: {
                                opacity: 0,
                                height: 0,
                                y: -10
                              },
                              transition: {
                                type: "spring",
                                stiffness: 350,
                                damping: 26
                              },
                              className: "relative overflow-hidden flex items-center justify-between p-2.5 pl-4 pos-card border-blue-200 dark:border-blue-900/30 rounded-[1.2rem]",
                              children: [e.jsx("div", {
                                className: "text-[9px] font-black text-blue-450 uppercase whitespace-nowrap",
                                children: "TK Nhận:"
                              }), e.jsx(CustomSelect, {
                                className: "w-full min-w-0 border-none shadow-none text-right justify-end font-bold text-xs bg-transparent dark:text-white outline-none",
                                value: Kr,
                                onChange: t => Gr(t.target.value),
                                options: Js.map(t => ({
                                  value: t.id,
                                  label: `${t.bank_name} - ${t.account_number}`
                                }))
                              })]
                            })
                          }), e.jsxs("div", {
                            className: "relative",
                            children: [e.jsx("div", {
                              className: "absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase z-10",
                              children: "KHÁCH ĐƯA (F1):"
                            }), e.jsx("input", {
                              ref: _a,
                              type: "number",
                              className: "w-full p-2.5 pl-32 text-right rounded-[1.2rem] font-black text-xl outline-none  pos-card transition-all duration-300 text-emerald-700 dark:text-emerald-400 focus:ring-2 focus:ring-emerald-550/20",
                              value: ne === 0 ? "" : ne,
                              placeholder: "0",
                              id: "cash-given-sidebar",
                              autoComplete: "off",
                              onChange: t => Xe(parseFloat(t.target.value) || 0),
                              onFocus: t => t.target.select()
                            })]
                          }), e.jsxs("div", {
                            className: "relative",
                            children: [e.jsx("div", {
                              className: "absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase z-10",
                              children: "THANH TOÁN:"
                            }), e.jsx("input", {
                              type: "text",
                              readOnly: D === "Cash" || D === "Pending",
                              className: u("w-full p-2.5 pl-24 text-right rounded-[1.2rem] font-black text-xl outline-none  pos-card transition-all duration-300 ease-in-out", D === "Cash" || D === "Pending" ? "text-emerald-700/40 dark:text-emerald-400/40 cursor-not-allowed" : "text-emerald-700 dark:text-emerald-450 focus:ring-2 focus:ring-emerald-550/20"),
                              value: I(Le),
                              autoComplete: "off",
                              onChange: t => J(parseFloat(t.target.value.replace(/,/g, "")) || 0)
                            }), e.jsx(T, {
                              children: (D === "Debt" || D === "Transfer") && e.jsx(m.button, {
                                initial: {
                                  opacity: 0,
                                  scale: .8,
                                  y: 5
                                },
                                animate: {
                                  opacity: 1,
                                  scale: 1,
                                  y: 0
                                },
                                exit: {
                                  opacity: 0,
                                  scale: .8,
                                  y: 5
                                },
                                transition: {
                                  type: "spring",
                                  stiffness: 450,
                                  damping: 25
                                },
                                onClick: () => J(A + (Dt > 0 ? Dt : 0)),
                                className: "absolute right-4 -top-2.5 px-2.5 py-0.5 bg-transparent text-emerald-600 dark:text-emerald-400 text-[9px] font-black rounded-full transition-all duration-300 ease-in-out border border-emerald-500/30 hover:bg-emerald-500 hover:text-white dark:hover:bg-emerald-400 dark:hover:text-slate-900  hover:scale-105 active:scale-95 z-30 uppercase",
                                children: "Trả hết"
                              })
                            })]
                          }), e.jsx(T, {
                            children: ne > A && e.jsxs(m.div, {
                              initial: {
                                opacity: 0,
                                scale: .95,
                                height: 0
                              },
                              animate: {
                                opacity: 1,
                                scale: 1,
                                height: "auto"
                              },
                              exit: {
                                opacity: 0,
                                scale: .95,
                                height: 0
                              },
                              transition: {
                                type: "spring",
                                stiffness: 350,
                                damping: 26
                              },
                              className: "flex justify-between items-center pos-card p-4 rounded-[1.2rem]  overflow-hidden",
                              children: [e.jsx("span", {
                                className: "text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest",
                                children: "TIỀN THỐI LẠI:"
                              }), e.jsx("span", {
                                className: "font-black text-sm text-emerald-600 dark:text-emerald-400",
                                children: I(Math.max(0, ne - A))
                              })]
                            })
                          })]
                        })]
                      })]
                    }), e.jsxs("div", {
                      className: u("pos-card py-4 px-6 rounded-3xl flex items-center justify-between  hover:scale-[1.02] transition-all duration-300 ease-in-out relative z-20 min-h-[76px]", zt > 0 ? "border-red-500/30 bg-red-500/5 dark:bg-red-950/10 text-red-600 dark:text-red-400" : "border-emerald-500/30 bg-emerald-500/5 dark:bg-emerald-950/10 text-emerald-600 dark:text-emerald-400"),
                      children: [e.jsxs("div", {
                        className: "min-w-0 flex flex-col justify-center",
                        children: [e.jsx("span", {
                          className: "text-[10px] font-black uppercase opacity-80 tracking-[0.1em] block mb-0.5 leading-tight",
                          children: "NỢ SAU ĐƠN:"
                        }), e.jsx("span", {
                          className: "text-3xl font-black tracking-tighter block leading-tight",
                          children: I(zt)
                        })]
                      }), e.jsx(bt, {
                        className: "opacity-20 shrink-0 ml-2",
                        size: 32
                      })]
                    }), e.jsxs("div", {
                      className: "flex flex-col gap-2 pt-2",
                      children: [e.jsxs("div", {
                        className: "flex gap-2.5",
                        children: [e.jsxs(m.button, {
                          whileTap: {
                            scale: .95
                          },
                          disabled: b.length === 0,
                          onClick: gr,
                          className: "flex-1 pos-card text-emerald-700 dark:text-emerald-300 border border-emerald-600/30 dark:border-emerald-400/30 rounded-2xl font-black hover:bg-emerald-500/10 hover:border-emerald-600/60 dark:hover:border-emerald-400/60 hover:scale-[1.02] transition-all duration-300 ease-in-out flex items-center justify-center gap-2 py-3 text-lg uppercase tracking-widest whitespace-nowrap",
                          children: [e.jsx(At, {
                            size: 20,
                            strokeWidth: 3
                          }), e.jsx("span", {
                            children: "TẠM"
                          })]
                        }), e.jsxs(m.button, {
                          whileTap: {
                            scale: .95
                          },
                          disabled: b.length === 0 || tt,
                          onClick: () => $e(!1),
                          className: "flex-1 pos-card text-emerald-700 dark:text-emerald-300 rounded-2xl font-black border border-emerald-600/30 dark:border-emerald-400/30 hover:bg-emerald-500/10 hover:border-emerald-600/60 dark:hover:border-emerald-400/60 hover:scale-[1.02] transition-all duration-300 ease-in-out flex items-center justify-center gap-2 py-3 text-lg uppercase tracking-widest whitespace-nowrap",
                          children: [e.jsx(Ss, {
                            size: 20,
                            strokeWidth: 3
                          }), e.jsx("span", {
                            children: "LƯU"
                          })]
                        })]
                      }), e.jsx(m.button, {
                        whileTap: {
                          scale: .98
                        },
                        disabled: b.length === 0 || tt,
                        onClick: () => $e(!0),
                        className: "w-full bg-emerald-600 dark:bg-emerald-500/30 hover:bg-emerald-700 dark:hover:bg-emerald-500/50 text-white dark:text-emerald-200 border border-emerald-600 dark:border-emerald-400/40 shadow-md shadow-emerald-600/20 rounded-2xl flex items-center justify-center transition-all duration-300 ease-in-out py-4.5 h-16 text-3xl font-black uppercase tracking-widest gap-3 hover:scale-[1.01] active:scale-[0.99]",
                        children: tt ? e.jsx("div", {
                          className: "w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin"
                        }) : e.jsxs(e.Fragment, {
                          children: [e.jsx(Dr, {
                            size: 28,
                            strokeWidth: 3
                          }), e.jsx("span", {
                            children: "IN"
                          })]
                        })
                      })]
                    })]
                  })]
                }, "expanded-sidebar") : e.jsxs(m.div, {
                  initial: {
                    opacity: 0,
                    x: -20,
                    scale: .95
                  },
                  animate: {
                    opacity: 1,
                    x: 0,
                    scale: 1
                  },
                  exit: {
                    opacity: 0,
                    x: -20,
                    scale: .95
                  },
                  transition: {
                    type: "spring",
                    stiffness: 400,
                    damping: 30,
                    mass: 1
                  },
                  className: "flex flex-col items-center py-6 gap-6 h-full relative z-10 no-print bg-transparent",
                  children: [e.jsxs("div", {
                    onClick: () => p && Va(!da),
                    className: u("w-14 h-14 rounded-full flex items-center justify-center border transition-all relative cursor-pointer partner-popout-trigger shadow-sm", p ? "bg-transparent text-emerald-600 dark:text-emerald-400 border-emerald-500/40 dark:border-emerald-400/60 hover:bg-emerald-50 dark:hover:bg-emerald-950/40" : "bg-transparent text-[#8b6f47]/60 dark:text-[#d4a574] border-slate-300 dark:border-white/30 hover:bg-white/40 dark:hover:bg-white/10"),
                    children: [e.jsx(Cs, {
                      size: 24,
                      className: u("")
                    }), p && e.jsxs("div", {
                      className: "absolute -top-2 -right-3 bg-emerald-50 text-emerald-800 text-[9px] font-black tracking-wider px-2 py-0.5 rounded-full border-2 border-emerald-500 dark:border-emerald-700 transition-transform z-20",
                      children: ["#", p.id]
                    }), p && e.jsxs("div", {
                      ref: w,
                      onClick: t => t.stopPropagation(),
                      className: u("absolute right-full top-1/2 -translate-y-1/2 mr-3 w-56 p-3.5 rounded-2xl bg-gradient-to-br from-[#a7f3d0]/90 to-[#99f6e4]/90 dark:from-[#042f2e]/90 dark:to-[#115e59]/90 backdrop-blur-xl shadow-2xl border border-emerald-400/30 transition-all duration-300 z-[9999] text-left text-slate-800 dark:text-emerald-150 partner-popout-container", da ? "pointer-events-auto opacity-100 translate-x-0" : "pointer-events-none opacity-0 translate-x-2"),
                      children: [e.jsx("div", {
                        className: "border-b border-emerald-500/20 dark:border-emerald-300/10 pb-1.5 mb-2",
                        children: e.jsx("div", {
                          className: "text-[9px] font-black uppercase tracking-[0.15em] opacity-80 text-emerald-800 dark:text-emerald-250",
                          children: "LỊCH SỬ GIAO DỊCH"
                        })
                      }), e.jsxs("div", {
                        className: "flex bg-black/5 dark:bg-white/5 p-0.5 rounded-lg mb-2",
                        children: [e.jsx("button", {
                          onClick: () => gt("debt"),
                          className: u("flex-1 py-0.5 rounded-md text-[8px] font-black uppercase transition-all", se === "debt" ? "bg-white/60 dark:bg-white/10 text-emerald-800 dark:text-white shadow-sm" : "text-emerald-700/60 dark:text-emerald-300/60 hover:text-emerald-900 dark:hover:text-white"),
                          children: "Mua nợ"
                        }), e.jsx("button", {
                          onClick: () => gt("cash"),
                          className: u("flex-1 py-0.5 rounded-md text-[8px] font-black uppercase transition-all", se === "cash" ? "bg-white/60 dark:bg-white/10 text-emerald-800 dark:text-white shadow-sm" : "text-emerald-700/60 dark:text-emerald-300/60 hover:text-emerald-900 dark:hover:text-white"),
                          children: "Mua tiền"
                        })]
                      }), Or ? e.jsxs("div", {
                        className: "flex items-center gap-2 py-2 font-black uppercase text-[10px] tracking-wider opacity-85",
                        children: [e.jsx(Ts, {
                          size: 14,
                          className: "animate-spin text-emerald-750 dark:text-emerald-300"
                        }), e.jsx("span", {
                          children: "Đang tải..."
                        })]
                      }) : (se === "debt" ? Oe : We) ? e.jsxs("div", {
                        onClick: () => {
                          const t = se === "debt" ? Oe : We;
                          t && t.obj && (Na(t.obj), Ct(!0))
                        },
                        className: "space-y-2 py-1 cursor-pointer hover:bg-white/20 dark:hover:bg-white/5 rounded-xl transition-all active:scale-[0.98] border border-transparent",
                        children: [e.jsxs("div", {
                          className: "flex items-center gap-2.5",
                          children: [e.jsx("div", {
                            className: "w-7 h-7 rounded-lg bg-white/40 dark:bg-white/10 flex items-center justify-center shrink-0",
                            children: e.jsx(bt, {
                              size: 15,
                              className: "text-emerald-750 dark:text-emerald-350"
                            })
                          }), e.jsxs("div", {
                            children: [e.jsx("div", {
                              className: "text-[8px] font-black uppercase tracking-wider opacity-60",
                              children: "SỐ TIỀN"
                            }), e.jsx("div", {
                              className: "text-xs font-black text-rose-600 dark:text-rose-400 uppercase",
                              children: (() => {
                                const t = se === "debt" ? Oe : We;
                                return it(t.increase || t.obj?.total_amount || 0)
                              })()
                            })]
                          })]
                        }), e.jsxs("div", {
                          className: "flex items-center gap-2.5",
                          children: [e.jsx("div", {
                            className: "w-7 h-7 rounded-lg bg-white/40 dark:bg-white/10 flex items-center justify-center shrink-0",
                            children: e.jsx(ra, {
                              size: 15,
                              className: "text-emerald-750 dark:text-emerald-355"
                            })
                          }), e.jsxs("div", {
                            className: "min-w-0 flex-1",
                            children: [e.jsx("div", {
                              className: "text-[8px] font-black uppercase tracking-wider opacity-60",
                              children: "NỘI DUNG"
                            }), e.jsx("div", {
                              className: "text-[10px] font-black uppercase truncate text-slate-800 dark:text-emerald-100",
                              children: (se === "debt" ? Oe : We).desc
                            })]
                          })]
                        }), e.jsxs("div", {
                          className: "flex items-center gap-2.5",
                          children: [e.jsx("div", {
                            className: "w-7 h-7 rounded-lg bg-white/40 dark:bg-white/10 flex items-center justify-center shrink-0",
                            children: e.jsx(ia, {
                              size: 15,
                              className: "text-emerald-750 dark:text-emerald-355"
                            })
                          }), e.jsxs("div", {
                            children: [e.jsx("div", {
                              className: "text-[8px] font-black uppercase tracking-wider opacity-60",
                              children: "THỜI GIAN"
                            }), e.jsx("div", {
                              className: "text-[10px] font-black uppercase text-slate-800 dark:text-emerald-100",
                              children: Fe((se === "debt" ? Oe : We).date)
                            })]
                          })]
                        })]
                      }) : e.jsxs("div", {
                        className: "py-4 text-center font-black uppercase text-xs tracking-wider opacity-60 italic",
                        children: ["Không có giao dịch ", se === "debt" ? "nợ" : "tiền mặt", " gần đây"]
                      })]
                    })]
                  }), e.jsxs("div", {
                    className: "flex flex-col items-center gap-4 shrink-0 relative z-[50]",
                    children: [p && e.jsxs(m.button, {
                      whileHover: {
                        scale: 1.12,
                        rotate: 5
                      },
                      whileTap: {
                        scale: .9
                      },
                      onClick: () => ha(!0),
                      className: "w-14 h-14 bg-transparent rounded-full flex items-center justify-center text-emerald-600 dark:text-emerald-400 border border-emerald-500/40 dark:border-emerald-400/60 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-all group/qd relative overflow-hidden shadow-sm",
                      title: "Ghi nợ nhanh",
                      children: [e.jsx("div", {
                        className: "absolute inset-0 bg-white/20 translate-y-full group-hover/qd:translate-y-0 transition-transform duration-300 z-10"
                      }), e.jsx(Pr, {
                        size: 22,
                        strokeWidth: 2.5,
                        className: "relative z-20"
                      })]
                    }), p && e.jsxs(m.button, {
                      whileHover: {
                        scale: 1.12,
                        rotate: -5
                      },
                      whileTap: {
                        scale: .9
                      },
                      onClick: () => fa(!0),
                      className: "w-14 h-14 bg-transparent rounded-full flex items-center justify-center text-teal-600 dark:text-teal-400 border border-teal-500/40 dark:border-teal-400/60 hover:bg-teal-50 dark:hover:bg-teal-950/40 transition-all group/qv relative overflow-hidden shadow-sm",
                      title: "Lập phiếu nhanh",
                      children: [e.jsx("div", {
                        className: "absolute inset-0 bg-white/20 translate-y-full group-hover/qv:translate-y-0 transition-transform duration-300 z-10"
                      }), e.jsx(Er, {
                        size: 22,
                        strokeWidth: 2.5,
                        className: "relative z-20"
                      })]
                    }), e.jsxs("div", {
                      className: "relative group/ship-mini",
                      children: [e.jsxs(m.button, {
                        whileHover: {
                          scale: 1.12,
                          rotate: 10
                        },
                        whileTap: {
                          scale: .9
                        },
                        onClick: () => ss(!0),
                        className: "w-14 h-14 bg-transparent rounded-full flex items-center justify-center text-emerald-700 dark:text-emerald-400 border border-emerald-600/40 dark:border-emerald-400/60 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-all group/ship relative overflow-hidden shadow-sm",
                        title: "Quản lý giao hàng",
                        children: [e.jsx("div", {
                          className: "absolute inset-0 bg-white/20 translate-y-full group-hover/ship:translate-y-0 transition-transform duration-300 z-10"
                        }), e.jsx(lt, {
                          size: 22,
                          strokeWidth: 2.5,
                          className: "relative z-20"
                        })]
                      }), ve > 0 && e.jsxs("div", {
                        className: "absolute -top-1.5 -right-1.5 min-w-[22px] h-[22px] bg-emerald-50 text-emerald-800 text-[10px] font-black tracking-wider rounded-full border-2 border-emerald-500 dark:border-emerald-700 flex items-center justify-center px-1.5 z-20",
                        children: [e.jsx("span", {
                          className: "relative flex h-2 w-2 mr-0.5",
                          children: e.jsx("span", {
                            className: "relative inline-flex rounded-full h-2 w-2 bg-emerald-600"
                          })
                        }), ve]
                      })]
                    })]
                  }), e.jsx("div", {
                    className: "flex-1 flex items-center justify-center w-full min-h-[80px] relative",
                    children: e.jsxs(m.button, {
                      whileHover: {
                        scale: 1.12,
                        x: -3
                      },
                      whileTap: {
                        scale: .9
                      },
                      onClick: () => $r(!0),
                      className: "w-14 h-14 bg-transparent rounded-full flex items-center justify-center text-[#8b6f47] dark:text-[#d4a574] border border-[#d4a574]/50 dark:border-[#d4a574]/60 hover:bg-white/40 dark:hover:bg-white/10 transition-all group/toggle z-10 relative shadow-sm",
                      children: [e.jsx("div", {
                        className: "absolute inset-0 rounded-full bg-gradient-to-tr from-[#d4a574]/10 to-transparent pointer-events-none"
                      }), e.jsx(js, {
                        size: 28,
                        strokeWidth: 3,
                        className: "group-hover/toggle:-translate-x-1 transition-transform drop-shadow"
                      })]
                    })
                  }), e.jsxs("div", {
                    className: "flex flex-col gap-4 pb-6 px-3",
                    children: [e.jsx(m.button, {
                      whileHover: {
                        scale: 1.12
                      },
                      whileTap: {
                        scale: .9
                      },
                      onClick: gr,
                      disabled: b.length === 0,
                      className: "w-14 h-14 bg-transparent rounded-full flex items-center justify-center text-emerald-600/80 dark:text-emerald-400 border border-emerald-500/40 dark:border-emerald-400/60 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-all shadow-sm",
                      title: "Treo đơn",
                      children: e.jsx(At, {
                        size: 18,
                        strokeWidth: 2.5
                      })
                    }), e.jsx(m.button, {
                      whileHover: {
                        scale: 1.12
                      },
                      whileTap: {
                        scale: .9
                      },
                      onClick: () => $e(!1),
                      disabled: b.length === 0 || tt,
                      className: "w-14 h-14 bg-transparent rounded-full flex items-center justify-center text-emerald-600 dark:text-emerald-400 border border-emerald-500/40 dark:border-emerald-400/60 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-all shadow-sm",
                      title: "Lưu đơn",
                      children: tt ? e.jsx("div", {
                        className: "w-5 h-5 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"
                      }) : e.jsx(Ss, {
                        size: 22,
                        strokeWidth: 2.5
                      })
                    }), e.jsxs(m.button, {
                      whileHover: {
                        scale: 1.12,
                        y: -2
                      },
                      whileTap: {
                        scale: .9
                      },
                      onClick: () => $e(!0),
                      disabled: b.length === 0 || tt,
                      className: "w-14 h-14 bg-emerald-600 dark:bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-md shadow-emerald-600/20 hover:bg-emerald-700 transition-all relative overflow-hidden group/print-mini border border-emerald-500/50 dark:border-emerald-300/80",
                      children: [e.jsx("div", {
                        className: "absolute inset-0 bg-white/20 translate-y-full group-hover/print-mini:translate-y-0 transition-transform duration-300"
                      }), tt ? e.jsx("div", {
                        className: "w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin"
                      }) : e.jsx(Dr, {
                        size: 26,
                        strokeWidth: 2.5,
                        className: "relative z-10"
                      })]
                    }), b.length > 0 && e.jsxs(m.button, {
                      whileHover: {
                        scale: 1.12,
                        y: -2
                      },
                      whileTap: {
                        scale: .9
                      },
                      onClick: () => ar(!0),
                      className: "w-14 h-14 bg-gradient-to-br from-emerald-600 to-teal-700 text-white rounded-2xl flex items-center justify-center  shadow-purple-500/30 hover:shadow-purple-500/50 transition-all relative overflow-hidden group/tax-mini",
                      title: "Quy đổi tiền CK",
                      children: [e.jsx("div", {
                        className: "absolute inset-0 bg-white/20 translate-y-full group-hover/tax-mini:translate-y-0 transition-transform duration-300"
                      }), e.jsx(di, {
                        size: 26,
                        strokeWidth: 2.5,
                        className: "relative z-10"
                      })]
                    }), f && e.jsx(m.button, {
                      whileHover: {
                        scale: 1.1,
                        rotate: 180
                      },
                      whileTap: {
                        scale: .9
                      },
                      onClick: f,
                      className: "w-14 h-14 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/40 dark:to-purple-900/40 rounded-full flex items-center justify-center text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-700/50  hover: transition-all group/toggle-theme",
                      title: "Chuyển đổi giao diện",
                      children: e.jsx(pi, {
                        size: 22,
                        strokeWidth: 2.5
                      })
                    })]
                  })]
                }, "mini-sidebar")
              })
            })
          })]
        }), e.jsx(T, {
          children: ya && e.jsx(gs, {
            isOpen: ya,
            partner: {
              name: Qr,
              is_customer: !0,
              is_supplier: !1
            },
            onClose: () => wa(!1),
            onSave: t => {
              vr(), wa(!1), t && (L(t), je(""), setTimeout(() => ue.current?.focus(), 100))
            }
          })
        }), e.jsx(T, {
          children: va && e.jsx(ms, {
            isOpen: va,
            product: {
              name: Qr
            },
            onClose: () => ka(!1),
            onSave: () => {
              wr(), ka(!1)
            }
          })
        }), e.jsx(T, {
          children: ir && e.jsx(An, {
            message: ir.message,
            type: ir.type,
            onClose: () => G(null)
          })
        }), e.jsx("div", {
          className: "fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none",
          children: e.jsx(T, {
            children: K.map(t => e.jsxs(m.div, {
              initial: {
                opacity: 0,
                x: 100,
                scale: .9
              },
              animate: {
                opacity: 1,
                x: 0,
                scale: 1
              },
              exit: {
                opacity: 0,
                x: 50,
                scale: .9,
                transition: {
                  duration: .15
                }
              },
              className: "bg-slate-900/90 text-white px-4 py-3 rounded-2xl shadow-xl border border-white/10 dark:border-white/10 backdrop-blur-md text-xs font-black flex items-center gap-3 pointer-events-auto",
              children: [e.jsx("div", {
                className: "w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0"
              }), e.jsxs("div", {
                children: [e.jsx("div", {
                  className: "text-[10px] text-slate-400 uppercase tracking-wider leading-none",
                  children: "Quét từ xa"
                }), e.jsxs("div", {
                  className: "mt-1",
                  children: [t.productName, " ", e.jsxs("span", {
                    className: "text-amber-400",
                    children: ["x", t.qty]
                  }), " → ", e.jsx("span", {
                    className: "underline text-blue-400",
                    children: t.tabName
                  })]
                })]
              })]
            }, t.id))
          })
        }), e.jsx(Vn, {
          isOpen: Xs,
          onClose: () => ar(!1),
          totalAmount: A,
          partnerName: p?.name || ""
        }), e.jsx(ms, {
          isOpen: dr,
          product: an,
          onClose: () => dt(!1),
          onSave: wr
        }), e.jsx(gs, {
          isOpen: ln,
          partner: on,
          onClose: () => Yt(!1),
          onSave: async t => {
            await vr(), t && (L(t), je(""), setTimeout(() => ue.current?.focus(), 100))
          }
        }), e.jsx(Be, {
          children: e.jsx(fi, {
            isOpen: Qs || le && le.type === "DebtIncrease",
            partner: p,
            initialData: le && le.type === "DebtIncrease" ? le : null,
            onClose: () => {
              ha(!1), Kt(null)
            },
            onSave: async t => {
              le ? await ps() : (L(t), F.invalidateQueries(["partners"])), G({
                message: le ? "Đã cập nhật khoản nợ thành công!" : "Đã lưu khoản nợ mới thành công!",
                type: "success"
              }), Kt(null), ha(!1), le || xt(!1)
            }
          })
        }), e.jsx(Be, {
          children: e.jsx(Ki, {
            isOpen: mn,
            onClose: () => ss(!1),
            onViewOrder: t => {
              Na(t), Ct(!0)
            }
          })
        }), e.jsx(Be, {
          children: e.jsx(bi, {
            isOpen: Vs || le && (le.type === "Receipt" || le.type === "Payment"),
            partner: p,
            initialData: le && (le.type === "Receipt" || le.type === "Payment") ? le : null,
            onClose: () => {
              fa(!1), Kt(null)
            },
            onSave: async t => {
              await ps(), G({
                message: le ? "Đã cập nhật phiếu thành công!" : "Đã lập phiếu thành công!",
                type: "success"
              }), Kt(null), fa(!1)
            }
          })
        }), e.jsx(T, {
          children: or && Jr && e.jsx(Be, {
            children: e.jsxs("div", {
              className: "fixed inset-0 z-[1000] flex bg-[radial-gradient(circle_at_25%_center,_#1e293b_0%,_#020617_100%)] animate-in fade-in duration-700 font-sans overflow-hidden",
              children: [e.jsxs("div", {
                className: "absolute inset-0 overflow-hidden pointer-events-none",
                children: [e.jsx("div", {
                  className: "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 hidden"
                }), e.jsx("div", {
                  className: "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 hidden"
                })]
              }), e.jsxs(m.div, {
                initial: {
                  x: -100,
                  opacity: 0
                },
                animate: {
                  x: 0,
                  opacity: 1
                },
                exit: {
                  x: -100,
                  opacity: 0
                },
                transition: {
                  type: "spring",
                  stiffness: 200,
                  damping: 25
                },
                className: "w-80 h-full bg-slate-900 border-r border-slate-800 flex flex-col z-50  relative",
                onClick: t => t.stopPropagation(),
                children: [e.jsxs("div", {
                  className: "p-8 border-b border-white/10",
                  children: [e.jsx("h3", {
                    className: "text-xl font-black text-white uppercase tracking-tighter",
                    children: "Thiết lập in"
                  }), e.jsx("p", {
                    className: "text-[10px] font-bold text-white/40 uppercase tracking-widest mt-1",
                    children: "Tùy chỉnh nội dung hiển thị"
                  })]
                }), e.jsx("div", {
                  className: "flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar",
                  children: e.jsxs("div", {
                    className: "space-y-4",
                    children: [e.jsxs("div", {
                      className: "flex items-center justify-between px-2",
                      children: [e.jsx("label", {
                        className: "text-[10px] font-black text-rose-500/60 uppercase tracking-[0.2em]",
                        children: "Thông tin tài chính"
                      }), e.jsx("div", {
                        className: "h-[1px] flex-1 bg-gradient-to-r from-rose-500/20 to-transparent ml-4"
                      })]
                    }), e.jsx("div", {
                      className: "grid gap-3",
                      children: [{
                        id: "showOldDebt",
                        label: "Hiển thị nợ cũ",
                        icon: Ot,
                        color: "text-rose-400",
                        glow: "shadow-rose-500/20",
                        baseColor: "rose"
                      }, {
                        id: "showPayment",
                        label: "Hiển thị thanh toán",
                        icon: La,
                        color: "text-emerald-400",
                        glow: "shadow-emerald-500/20",
                        baseColor: "emerald"
                      }, {
                        id: "showRemaining",
                        label: "Hiển thị còn lại",
                        icon: bt,
                        color: "text-blue-400",
                        glow: "shadow-blue-500/20",
                        baseColor: "blue"
                      }, {
                        id: "showCashGiven",
                        label: "Hiển thị khách đưa",
                        icon: xi,
                        color: "text-amber-400",
                        glow: "shadow-amber-500/20",
                        baseColor: "amber"
                      }, {
                        id: "showChange",
                        label: "Hiển thị tiền thối",
                        icon: mi,
                        color: "text-cyan-400",
                        glow: "shadow-cyan-500/20",
                        baseColor: "cyan"
                      }].map(t => {
                        const a = t.icon,
                          r = we[t.id];
                        return e.jsxs(m.button, {
                          whileHover: {
                            x: 8,
                            backgroundColor: "rgba(255,255,255,0.08)"
                          },
                          whileTap: {
                            scale: .96
                          },
                          onClick: () => hn(s => ({
                            ...s,
                            [t.id]: !s[t.id]
                          })),
                          className: u("w-full p-4 rounded-[1.8rem] flex items-center justify-between transition-all duration-500 border border-white/5 group relative overflow-hidden", r ? "bg-white/10 " : "bg-transparent"),
                          children: [r && e.jsx("div", {
                            className: u("absolute inset-0 opacity-5 bg-current", t.color)
                          }), e.jsxs("div", {
                            className: "flex items-center gap-4 relative z-10",
                            children: [e.jsx("div", {
                              className: u("w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-500", r ? `bg-white/10 ${t.color}  ${t.glow} scale-110` : "bg-white/5 text-white/20 group-hover:text-white/40 dark:text-white/20 group-hover:text-slate-600 dark:group-hover:text-white/40"),
                              children: e.jsx(a, {
                                size: 20,
                                strokeWidth: 2.5,
                                className: u("transition-transform duration-700", r ? "rotate-0 scale-110" : "rotate-[-10deg]")
                              })
                            }), e.jsxs("div", {
                              className: "flex flex-col items-start gap-0.5",
                              children: [e.jsx("span", {
                                className: u("text-[11px] font-black uppercase tracking-[0.05em] transition-colors duration-500", r ? "text-white" : "text-white/30 group-hover:text-white/60 group-hover:text-slate-600 dark:group-hover:text-white/60"),
                                children: t.label
                              }), e.jsx("span", {
                                className: "text-[8px] font-bold text-white/10 uppercase tracking-widest leading-none",
                                children: r ? "ĐANG HIỆN" : "ĐANG ẨN"
                              })]
                            })]
                          }), e.jsxs("div", {
                            className: u("w-12 h-6 rounded-full relative p-1 transition-all duration-700 overflow-hidden ring-1 ring-white/10", r ? "bg-emerald-500/20 " : "bg-white/5 shadow-none"),
                            children: [e.jsx("div", {
                              className: u("absolute top-1/2 left-3 right-3 h-[2px] rounded-full transition-colors duration-700", r ? "bg-emerald-500/40" : "bg-white/10")
                            }), e.jsxs(m.div, {
                              layout: !0,
                              animate: {
                                x: r ? 24 : 0,
                                backgroundColor: r ? "#10b981" : "#475569"
                              },
                              transition: {
                                type: "spring",
                                stiffness: 500,
                                damping: 30
                              },
                              className: "w-4 h-4 rounded-full  flex items-center justify-center relative z-10",
                              children: [e.jsx("div", {
                                className: "w-1.5 h-1.5 rounded-full bg-white opacity-40 shadow-none"
                              }), r && e.jsx("div", {
                                className: "absolute inset-0 rounded-full bg-emerald-400 opacity-10"
                              })]
                            })]
                          })]
                        }, t.id)
                      })
                    })]
                  })
                }), e.jsxs("div", {
                  className: "p-8 border-t border-white/10 space-y-3 bg-slate-900",
                  children: [e.jsxs(m.button, {
                    whileHover: {
                      scale: 1.02
                    },
                    whileTap: {
                      scale: .98
                    },
                    onClick: () => {
                      Bt(!1), $e(!0)
                    },
                    className: "group w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-400 text-white rounded-[2rem] font-black uppercase tracking-widest text-[11px]  shadow-emerald-500/20 flex items-center justify-center gap-3",
                    children: [e.jsx(Dr, {
                      size: 18,
                      strokeWidth: 2.5,
                      className: "group-hover:rotate-12 transition-transform"
                    }), "Lưu & In Ngay"]
                  }), e.jsxs(m.button, {
                    whileHover: {
                      scale: 1.02,
                      backgroundColor: "rgba(236, 72, 153, 0.2)"
                    },
                    whileTap: {
                      scale: .98
                    },
                    onClick: () => {
                      if (Jr && Jr.details) {
                        playPackingQueue(Jr.details, z);
                      }
                    },
                    className: "w-full py-4 bg-pink-500/10 text-pink-400 hover:text-pink-300 rounded-[2rem] font-black uppercase tracking-widest text-[11px] border border-pink-500/20 flex items-center justify-center gap-3",
                    children: [e.jsx(Volume2, {
                      size: 18
                    }), "Đọc Soạn Hàng"]
                  }), e.jsxs(m.button, {
                    whileHover: {
                      scale: 1.02,
                      backgroundColor: "rgba(255,255,255,0.1)"
                    },
                    whileTap: {
                      scale: .98
                    },
                    onClick: () => Bt(!1),
                    className: "w-full py-4 bg-white/5 text-white/50 hover:text-white rounded-[2rem] font-black uppercase tracking-widest text-[11px] border border-white/5 flex items-center justify-center gap-3",
                    children: [e.jsx(Se, {
                      size: 18
                    }), "Đóng nhanh"]
                  })]
                })]
              }), e.jsxs("div", {
                className: "fixed bottom-10 left-1/2 -translate-x-1/2 z-[2100] flex items-center gap-2 p-2 bg-slate-900/80 rounded-[2rem] border border-white/10 ",
                children: [e.jsx(m.button, {
                  whileHover: {
                    scale: 1.1
                  },
                  whileTap: {
                    scale: .9
                  },
                  onClick: () => cr(t => Math.max(.5, t - .1)),
                  className: "w-12 h-12 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-white transition-colors",
                  title: "Thu nhỏ",
                  children: e.jsx(hi, {
                    size: 20
                  })
                }), e.jsxs("div", {
                  className: "px-4 text-[13px] font-black text-white min-w-[60px] text-center",
                  children: [Math.round(Yr * 100), "%"]
                }), e.jsx(m.button, {
                  whileHover: {
                    scale: 1.1
                  },
                  whileTap: {
                    scale: .9
                  },
                  onClick: () => cr(t => Math.min(2, t + .1)),
                  className: "w-12 h-12 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-white transition-colors",
                  title: "Phóng to",
                  children: e.jsx(ft, {
                    size: 20
                  })
                }), e.jsx("div", {
                  className: "w-[1px] h-6 bg-white/10 mx-1"
                }), e.jsx(m.button, {
                  whileHover: {
                    scale: 1.1
                  },
                  whileTap: {
                    scale: .9
                  },
                  onClick: () => cr(1),
                  className: "w-12 h-12 flex items-center justify-center rounded-full bg-primary/20 hover:bg-primary/30 text-primary transition-colors",
                  title: "Reset",
                  children: e.jsx(Ir, {
                    size: 18
                  })
                })]
              }), e.jsxs("div", {
                className: "flex-1 h-full overflow-auto no-scrollbar py-20 px-4 flex flex-col items-center cursor-zoom-out",
                onClick: () => Bt(!1),
                children: [e.jsx(m.div, {
                  initial: {
                    scale: .9,
                    opacity: 0,
                    y: 30
                  },
                  animate: {
                    scale: Yr,
                    opacity: 1,
                    y: 0
                  },
                  exit: {
                    scale: .95,
                    opacity: 0,
                    y: 20
                  },
                  transition: {
                    type: "spring",
                    stiffness: 200,
                    damping: 25
                  },
                  onClick: t => t.stopPropagation(),
                  className: "relative keep-white bg-white  ring-1 ring-black/5 transform-gpu cursor-default origin-top",
                  children: e.jsx(bs, {
                    data: Jr,
                    settings: X,
                    type: "Sale",
                    isPreview: !0,
                    showOldDebt: we.showOldDebt,
                    showPayment: we.showPayment,
                    showRemaining: we.showRemaining,
                    showCashGiven: we.showCashGiven,
                    showChange: we.showChange
                  })
                }), e.jsx("p", {
                  className: "mt-10 text-[10px] font-bold text-white/20 uppercase tracking-[0.3em] font-sans",
                  children: "Cuộn để xem toàn bộ hóa đơn • LyangPOS Studio"
                })]
              })]
            })
          })
        }), e.jsx(qn, {
          isVisible: tt && z.length === 0,
          message: "Đang nạp dữ liệu POS..."
        }), e.jsx(Be, {
          children: e.jsx(ki, {
            isOpen: xn,
            partner: p,
            onClose: () => xt(!1),
            onViewOrder: t => {
              Na(t), Ct(!0)
            },
            onEditOrder: t => {
              Da(t), xt(!1), G({
                message: "Đã mang hóa đơn ra màn hình để sửa!",
                type: "success"
              })
            },
            onDeleteOrder: zn,
            onEditVoucher: t => {
              Kt({
                ...t,
                id: t.id.toString().replace("v_", ""),
                amount: t.total_amount
              })
            },
            onDeleteVoucher: Dn,
            onAddToCart: t => {
              const a = z.find(r => r.id === t.id);
              a && Pt(a)
            }
          })
        })]
      }), pa && pa.details && pa.details.length > 0 && e.jsx("div", {
        className: "only-print",
        children: e.jsx(bs, {
          data: pa,
          settings: X,
          type: "Sale",
          showOldDebt: we.showOldDebt,
          showPayment: we.showPayment,
          showRemaining: we.showRemaining,
          showCashGiven: we.showCashGiven,
          showChange: we.showChange
        })
      }), e.jsx(T, {
        children: hr && e.jsx(Be, {
          children: e.jsx("div", {
            className: "fixed inset-0 z-[500000] flex items-center justify-center p-4 bg-slate-950/40 dark:bg-black/60 overflow-y-auto",
            children: e.jsxs(m.div, {
              initial: {
                scale: .95,
                opacity: 0,
                y: 10
              },
              animate: {
                scale: 1,
                opacity: 1,
                y: 0
              },
              exit: {
                scale: .95,
                opacity: 0,
                y: 10
              },
              className: "bg-card w-full max-w-md rounded-2xl border border-border flex flex-col relative z-10 overflow-hidden",
              children: [e.jsxs("div", {
                className: "p-5 flex items-center justify-between border-b border-border bg-card shrink-0",
                children: [e.jsxs("div", {
                  className: "flex items-center gap-3",
                  children: [e.jsx("div", {
                    className: "w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20",
                    children: e.jsx(ft, {
                      className: "text-primary",
                      size: 20
                    })
                  }), e.jsxs("div", {
                    children: [e.jsx("h3", {
                      className: "text-base font-bold text-foreground uppercase tracking-wide leading-tight",
                      children: "Thêm món ngoài"
                    }), e.jsx("p", {
                      className: "text-muted-foreground text-[10px] font-medium uppercase tracking-widest mt-0.5",
                      children: "Phím tắt F6"
                    })]
                  })]
                }), e.jsx("button", {
                  onClick: () => Zt(!1),
                  className: "w-8 h-8 flex items-center justify-center rounded-lg bg-transparent hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors",
                  children: e.jsx(Se, {
                    size: 16,
                    strokeWidth: 2.5
                  })
                })]
              }), e.jsxs("div", {
                className: "p-5 space-y-4 bg-card/50",
                children: [e.jsxs("div", {
                  className: "space-y-1",
                  children: [e.jsx("label", {
                    className: "text-[10px] font-bold uppercase text-muted-foreground tracking-wider ml-1",
                    children: "Tên món / Nội dung"
                  }), e.jsx("input", {
                    ref: fr,
                    type: "text",
                    className: "w-full h-12 px-4 bg-background border border-border focus:border-primary rounded-xl font-bold text-foreground outline-none transition-all placeholder:text-muted-foreground uppercase",
                    placeholder: "GÕ TÊN MÓN...",
                    value: Ze.name,
                    onChange: t => ea({
                      ...Ze,
                      name: t.target.value
                    }),
                    onKeyDown: t => {
                      t.key === "Enter" && (t.preventDefault(), Zr.current?.focus())
                    }
                  })]
                }), e.jsxs("div", {
                  className: "space-y-1",
                  children: [e.jsx("label", {
                    className: "text-[10px] font-bold uppercase text-muted-foreground tracking-wider ml-1",
                    children: "Giá tiền"
                  }), e.jsx("input", {
                    ref: Zr,
                    type: "text",
                    className: "w-full h-12 px-4 bg-background border border-border focus:border-primary rounded-xl font-black text-xl text-primary outline-none transition-all",
                    placeholder: "0",
                    value: Ze.price ? parseFloat(Ze.price).toLocaleString("en-US") : "",
                    onChange: t => {
                      const a = t.target.value.replace(/,/g, "");
                      /^\d*$/.test(a) && ea({
                        ...Ze,
                        price: a
                      })
                    },
                    onKeyDown: t => {
                      t.key === "Enter" && (t.preventDefault(), us(Ze.name, parseFloat(Ze.price) || 0))
                    }
                  })]
                })]
              }), e.jsx("div", {
                className: "p-6 bg-card border-t border-border flex flex-col items-center",
                children: e.jsxs("button", {
                  onClick: () => us(Ze.name, parseFloat(Ze.price) || 0),
                  className: "w-full py-3 bg-primary hover:bg-primary-hover text-white rounded-xl font-bold uppercase tracking-wider transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-2",
                  children: [e.jsx(ft, {
                    size: 18
                  }), " THÊM VÀO GIỎ (ENTER)"]
                })
              })]
            })
          })
        })
      }), e.jsx(T, {
        children: sn && pr && e.jsx(Rn, {
          order: pr,
          partner: Q.find(t => t.id === pr.partner_id),
          onClose: () => Ct(!1),
          onSave: () => {
            Ct(!1), B && F.invalidateQueries(["orders"])
          }
        })
      }), e.jsx(T, {
        children: Gt && e.jsx(Mn, {
          isOpen: !!Gt,
          title: Gt.title,
          message: Gt.message,
          onConfirm: Gt.onConfirm,
          onCancel: () => Qt(null)
        })
      }), e.jsx(Be, {
        children: e.jsx(T, {
          children: Nt && Ye && e.jsx(gi, {
            product: Ye,
            isOpen: Nt,
            onClose: () => pt(!1),
            onSave: Cn,
            coordinates: rn
          })
        })
      }), e.jsx(Be, {
        children: e.jsx(T, {
          children: showDeletePrompt && e.jsxs(m.div, {
            initial: {
              opacity: 0,
              y: -20,
              scale: 0.9
            },
            animate: {
              opacity: 1,
              y: 0,
              scale: 1
            },
            exit: {
              opacity: 0,
              y: -20,
              scale: 0.9
            },
            className: "fixed top-6 right-6 z-[2000000] flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl border border-rose-500/20 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl no-print overflow-hidden",
            children: [
              e.jsx("div", {
                className: "p-2 rounded-xl text-white shadow-lg bg-rose-500 shadow-rose-500/25 shrink-0",
                children: e.jsx(Ar, {
                  size: 20
                })
              }),
              e.jsxs("div", {
                className: "flex flex-col min-w-[140px] max-w-[180px]",
                children: [
                  e.jsx("span", {
                    className: "text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 opacity-70",
                    children: "Hành động"
                  }),
                  e.jsx("span", {
                    className: "font-bold text-xs tracking-tight text-slate-800 dark:text-white/95 leading-snug",
                    children: "Xóa dòng thứ mấy?"
                  })
                ]
              }),
              e.jsx("input", {
                type: "text",
                autoFocus: true,
                value: deleteRowInput,
                onChange: s => setDeleteRowInput(s.target.value),
                onKeyDown: s => {
                  if (s.key === "Enter") {
                    s.preventDefault();
                    handleConfirmDeleteRow();
                  } else if (s.key === "Escape") {
                    setShowDeletePrompt(false);
                    setDeleteRowInput("");
                  }
                },
                placeholder: "Số...",
                className: "w-16 px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-center text-sm font-black text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500 transition-all"
              }),
              e.jsx("button", {
                onClick: () => {
                  setShowDeletePrompt(false);
                  setDeleteRowInput("");
                },
                className: "ml-2 p-1.5 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors text-slate-500 dark:text-white/60 hover:text-slate-800 dark:hover:text-white",
                children: e.jsx(Se, {
                  size: 16
                })
              })
            ]
          })
        })
      }), e.jsx(Be, {
        children: e.jsx(T, {
          children: cn && e.jsx("div", {
            className: "fixed inset-0 z-[300000] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200",
            children: e.jsxs(m.div, {
              initial: {
                scale: .9,
                opacity: 0,
                y: 20
              },
              animate: {
                scale: 1,
                opacity: 1,
                y: 0
              },
              exit: {
                scale: .9,
                opacity: 0,
                y: 20
              },
              className: "bg-white dark:bg-slate-900 backdrop-blur-2xl w-full max-w-sm rounded-[2rem] border border-white dark:border-white/10 overflow-hidden relative p-6 space-y-4",
              children: [e.jsxs("div", {
                className: "flex justify-between items-start",
                children: [e.jsxs("div", {
                  className: "flex items-center gap-2 text-primary dark:text-[#d4a574]",
                  children: [e.jsx(ks, {
                    size: 20,
                    className: "shrink-0"
                  }), e.jsx("h3", {
                    className: "font-black text-lg uppercase tracking-tight",
                    children: "Màn hình soạn hàng"
                  })]
                }), e.jsx("button", {
                  onClick: () => Ta(!1),
                  className: "p-1.5 hover:bg-rose-500/10 text-slate-400 hover:text-rose-500 rounded-xl transition-all",
                  children: e.jsx(Se, {
                    size: 18
                  })
                })]
              }), e.jsxs("p", {
                className: "text-xs text-gray-500 dark:text-gray-400 font-bold leading-normal",
                children: ["Chọn phương thức hiển thị màn hình soạn hàng. Sử dụng trình duyệt Chrome/Edge nếu bạn muốn ", e.jsx("span", {
                  className: "text-[#059669] dark:text-[#34d399] font-black",
                  children: "truyền màn hình (Cast) lên TV"
                }), "."]
              }), e.jsxs("div", {
                className: "flex flex-col gap-2.5 pt-2",
                children: [e.jsx("button", {
                  onClick: async () => {
                    Ta(!1);
                    const t = "packing-display-" + Date.now(),
                      a = "/#/packing-display",
                      r = window.__TAURI__?.webviewWindow?.WebviewWindow || window.__TAURI__?.window?.WebviewWindow;
                    if (r) try {
                      new r(t, {
                        url: a,
                        title: "Màn hình soạn hàng",
                        width: 1e3,
                        height: 800,
                        center: !0
                      });
                      return
                    } catch (s) {
                      console.error("Failed to create WebviewWindow from global namespace", s)
                    }
                    if (window.__TAURI_INTERNALS__) try {
                      const {
                        WebviewWindow: s
                      } = await hs(async () => {
                        const {
                          WebviewWindow: n
                        } = await import("@tauri-apps/api/webviewWindow");
                        return {
                          WebviewWindow: n
                        }
                      }, []);
                      new s(t, {
                        url: a,
                        title: "Màn hình soạn hàng",
                        width: 1e3,
                        height: 800,
                        center: !0
                      });
                      return
                    } catch (s) {
                      console.error("Failed to dynamically import WebviewWindow", s)
                    }
                    window.open(window.location.origin + "/#/packing-display", "_blank", "width=1200,height=800,menubar=no,status=no,toolbar=no,location=no")
                  },
                  className: "w-full py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl font-black uppercase tracking-widest text-xs transition-all  active:scale-98 cursor-pointer",
                  children: "📺 Mở trong cửa sổ App (Tauri)"
                }), e.jsx("button", {
                  onClick: async () => {
                    Ta(!1);
                    const t = localStorage.getItem("server_ip"),
                      r = (t ? `http://${t}:3579` : "http://localhost:3579") + "/#/packing-display";
                    try {
                      await q.post("/api/open-external-chrome", {
                        url: r
                      });
                      return
                    } catch (s) {
                      console.error("Failed to open Chrome in app mode via backend API, falling back", s)
                    }
                    if (window.__TAURI_INTERNALS__) try {
                      const {
                        open: s
                      } = await hs(async () => {
                        const {
                          open: n
                        } = await import("@tauri-apps/plugin-shell");
                        return {
                          open: n
                        }
                      }, []);
                      await s(r);
                      return
                    } catch (s) {
                      console.error("Failed to open URL using tauri shell", s)
                    }
                    window.open(r, "_blank", "width=1200,height=800,menubar=no,status=no,toolbar=no,location=no")
                  },
                  className: "w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black uppercase tracking-widest text-xs transition-all  active:scale-98 cursor-pointer",
                  children: "🌐 Mở trong Trình duyệt (Để Cast TV)"
                })]
              })]
            })
          })
        })
      })]
    })
  })
}
export default ol;