import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  Search,
  ShoppingCart,
  User,
  Trash2,
  Plus,
  Minus,
  Save,
  Printer,
  History,
  Zap,
  Package,
  X,
  ChevronRight,
  Pause,
  Sun,
  Moon,
  Menu,
  Palette,
  FileText,
  CreditCard,
  Wallet,
  BadgePercent,
  Mic,
} from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import LiteClock from "../../components/LiteClock";
import { useProductData, usePartnerData } from "../../queries/useProductData";
import { useQueryClient } from "@tanstack/react-query";
import { formatCurrency, cn, playPopSound, playSuccessSound, removeAccents, formatNumber } from "../../lib/utils";
import { getLiteTheme } from "../../lib/liteTheme";
import { useLiteThemeSync } from "../../hooks/useLiteThemeSync";
import axios from "axios";
import PrintTemplate from "../../components/PrintTemplate";
import ConfirmModal from "../../components/ConfirmModal";
import TaxCalculatorModal from "../../components/TaxCalculatorModal";
import { DEFAULT_SETTINGS } from "../../lib/settings";
import ProductEditModal from "../../components/ProductEditModal";
import PartnerEditModal from "../../components/PartnerEditModal";
import QuickDebtModal from "../../components/QuickDebtModal";
import QuickVoucherModal from "../../components/QuickVoucherModal";
import QuickAuditPopout from "../../components/QuickAuditPopout";
import Portal from "../../components/Portal";
import logo from "../../assets/logo.png";

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

/**
 * POS Lite (Survival Edition)
 * Optimized for: Low RAM, Zero GPU, Battery Saving.
 */

const POSLite = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const isLiteMode = import.meta.env.VITE_APP_MODE === 'lite';
  const { data: productsData, isLoading: isLoadingProducts } = useProductData();
  const { data: partnersData, isLoading: isLoadingPartners } = usePartnerData();

  const [settings, setSettings] = useState(DEFAULT_SETTINGS);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const [templatesRes, settingsRes] = await Promise.all([
          axios.get("/api/print-templates?module=Sale"),
          axios.get("/api/settings"),
        ]);
        let combinedSettings = { ...DEFAULT_SETTINGS };
        if (settingsRes.data) {
          combinedSettings = { ...combinedSettings, ...settingsRes.data };
        }
        if (templatesRes.data && templatesRes.data.length > 0) {
          const defaultTemplate =
            templatesRes.data.find((t) => t.is_default) || templatesRes.data[0];
          if (defaultTemplate) {
            try {
              const config = JSON.parse(defaultTemplate.config);
              combinedSettings = { ...combinedSettings, ...config };
            } catch (e) {
              console.error(e);
            }
          }
        }
        setSettings(combinedSettings);
      } catch (err) {
        console.error("Failed to load settings in POS Lite", err);
      }
    };
    fetchSettings();
    precacheCommonTTS();
  }, []);

  const products = useMemo(() => productsData || [], [productsData]);
  const partners = useMemo(() => partnersData || [], [partnersData]);

  useEffect(() => {
    if (products && products.length > 0) {
      precacheCommonTTS(products);
    }
  }, [products]);

  // UI State
  const [searchTerm, setSearchTerm] = useState("");
  const [cart, setCart] = useState(() => {
    const saved = localStorage.getItem('pos_lite_cart');
    return saved ? JSON.parse(saved) : [];
  });
  const [selectedPartner, setSelectedPartner] = useState(() => {
    const saved = localStorage.getItem('pos_lite_partner');
    return saved ? JSON.parse(saved) : null;
  });
  const [partnerSearchTerm, setPartnerSearchTerm] = useState("");
  const [isPartnerDropdownOpen, setIsPartnerDropdownOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState(() => {
    return localStorage.getItem('pos_lite_payment_method') || "Cash";
  });
  const [note, setNote] = useState(() => {
    return localStorage.getItem('pos_lite_note') || "";
  });
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [todaySalesMap, setTodaySalesMap] = useState({});
  const [superSave, setSuperSave] = useState(false);

  // Edit modals state
  const [editingProduct, setEditingProduct] = useState(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState(null);
  const [isPartnerModalOpen, setIsPartnerModalOpen] = useState(false);
  const [contextMenu, setContextMenu] = useState(null);
  const [isQuickDebtOpen, setIsQuickDebtOpen] = useState(false);
  const [isQuickVoucherOpen, setIsQuickVoucherOpen] = useState(false);
  const [isAuditOpen, setIsAuditOpen] = useState(false);
  const [auditProduct, setAuditProduct] = useState(null);
  const [auditCoords, setAuditCoords] = useState({ top: 0, left: 0, right: 0, bottom: 0 });
  const [showThemePopover, setShowThemePopover] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showNotePopover, setShowNotePopover] = useState(false);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);

  const handleLogout = useCallback(() => {
    localStorage.removeItem('user');
    sessionStorage.removeItem('user');
    navigate('/welcome');
  }, [navigate]);

  const { bgColor, fontSize, changeTheme, changeFontSize } = useLiteThemeSync();
  
  const theme = useMemo(() => getLiteTheme(bgColor), [bgColor]);

  const isDark = theme.isDark;

  const cycleFontSize = () => {
    const sizes = ["14px", "16px", "18px", "20px"];
    const currentIndex = sizes.indexOf(fontSize);
    const nextIndex = (currentIndex + 1) % sizes.length;
    changeFontSize(sizes[nextIndex]);
  };
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    return parseInt(localStorage.getItem('pos_lite_sidebar_width')) || 650;
  });

  const handleMouseDown = (e) => {
    e.preventDefault();
    const handleMouseMove = (moveEvent) => {
      const newWidth = window.innerWidth - moveEvent.clientX;
      if (newWidth > 380 && newWidth < window.innerWidth - 300) {
        setSidebarWidth(newWidth);
        localStorage.setItem('pos_lite_sidebar_width', newWidth.toString());
      }
    };
    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };
  const [activeIndex, setActiveIndex] = useState(-1);
  const [partnerIndex, setPartnerIndex] = useState(0);
  const [quickQty, setQuickQty] = useState(1);
  const [confirm, setConfirm] = useState(null); // { title, message, onConfirm, type }
  const [historyStep, setHistoryStep] = useState(0);
  const [editOrderId, setEditOrderId] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [customPrices, setCustomPrices] = useState({});
  // LiteClock handles time internally
  const [printData, setPrintData] = useState(null);
  const [printOptions, setPrintOptions] = useState(() => {
    const saved = localStorage.getItem("pos_print_options");
    return saved
      ? JSON.parse(saved)
      : {
        showOldDebt: false,
        showPayment: false,
        showRemaining: false,
        showCashGiven: true,
        showChange: true,
      };
  });

  useEffect(() => {
    localStorage.setItem("pos_print_options", JSON.stringify(printOptions));
  }, [printOptions]);

  useEffect(() => {
    const totalAmount = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
    if (totalAmount > 0) {
      const timer = setTimeout(() => {
        precacheAmounts(totalAmount, selectedPartner?.name);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [cart, selectedPartner]);

  const [isHistoryDrawerOpen, setIsHistoryDrawerOpen] = useState(false);
  const [isTaxModalOpen, setIsTaxModalOpen] = useState(false);
  const [recentOrders, setRecentOrders] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [historyPartner, setHistoryPartner] = useState(null);

  const fetchRecentOrders = async (partnerId = null) => {
    setIsLoadingHistory(true);
    try {
      const params = {
        type: "Sale",
        limit: partnerId ? 50 : 20,
        page: 1
      };
      if (partnerId) {
        params.partner_id = partnerId;
      }
      const res = await axios.get("/api/orders", { params });
      setRecentOrders(res.data.items || res.data || []);
    } catch (err) {
      console.error("Lỗi khi tải lịch sử đơn hàng:", err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleReloadOrder = (order) => {
    if (lastSpokenProductIdRef.current !== undefined) {
      lastSpokenProductIdRef.current = null;
    }
    setCart(order.details.map(d => ({
      id: Math.random().toString(36).substr(2, 9),
      product_id: d.product_id,
      name: d.product_name,
      price: d.price,
      quantity: d.quantity,
      unit: d.product_unit || d.unit || "",
      stock: d.product_stock || d.stock || 0
    })));
    if (order.partner_id) {
      const matchedPartner = partners.find(p => p.id === order.partner_id);
      if (matchedPartner) setSelectedPartner(matchedPartner);
    } else {
      setSelectedPartner(null);
    }
    setPaymentMethod(order.payment_method || "Cash");
    setNote(order.note || "");
    setEditOrderId(order.id);
    setIsHistoryDrawerOpen(false);
    showToast("ĐÃ NẠP ĐƠN HÀNG LÊN MÀN HÌNH CHỈNH SỬA!");
  };

  const lastActiveIndexRef = useRef(-1);
  const lastSpokenProductIdRef = useRef(null);
  const [heldOrders, setHeldOrders] = useState(() => {
    const saved = localStorage.getItem("lite_held_orders");
    return saved ? JSON.parse(saved) : [];
  });

  const fetchTodaySales = useCallback(async () => {
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const res = await axios.get(`/api/reports/product-sales?start_date=${todayStr}&limit=500`);
      if (res.data && Array.isArray(res.data)) {
        const salesMap = {};
        res.data.forEach(item => {
          if (item.product_id) {
            salesMap[item.product_id] = item.qty || 0;
          }
        });
        setTodaySalesMap(salesMap);
      }
    } catch (err) {
      console.error("Failed to fetch today sales for sorting", err);
    }
  }, []);

  useEffect(() => {
    fetchTodaySales();
  }, [fetchTodaySales]);

  // State Persistence
  useEffect(() => {
    localStorage.setItem('pos_lite_cart', JSON.stringify(cart));
    localStorage.setItem('pos_lite_partner', JSON.stringify(selectedPartner));
    localStorage.setItem('pos_lite_payment_method', paymentMethod);
    localStorage.setItem('pos_lite_note', note);
    localStorage.setItem('pos_lite_super_save', superSave.toString());
    localStorage.setItem('pos_lite_bg_color', bgColor);
    localStorage.setItem('lite_held_orders', JSON.stringify(heldOrders));
  }, [cart, selectedPartner, paymentMethod, note, superSave, bgColor, heldOrders]);
  
  const searchInputRef = useRef(null);
  const partnerInputRef = useRef(null);
  const quickQtyRef = useRef(null);

  // Survival Mode: Force system cursor to save battery
  useEffect(() => {
    document.documentElement.classList.remove("custom-cursor-active");
    
    const handleClickOutside = (e) => {
      if (partnerInputRef.current && !partnerInputRef.current.contains(e.target)) {
        setIsPartnerDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Survival Mode Optimization: Reduced Clock Update Frequency
  // Now handled by LiteClock internally


  // Show Toast
  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleHold = () => {
    if (cart.length === 0) return;
    const newHeld = {
      id: Date.now(),
      cart: [...cart],
      partner: selectedPartner,
      time: new Date().toLocaleTimeString("vi-VN")
    };
    setHeldOrders([newHeld, ...heldOrders]);
    setCart([]);
    setSelectedPartner(null);
    if (lastSpokenProductIdRef.current !== undefined) {
      lastSpokenProductIdRef.current = null;
    }
    showToast("ĐÃ TREO ĐƠN");
  };

  const handleRestoreHeld = (held) => {
    if (cart.length > 0) {
      setConfirm({
        title: "Khôi phục đơn treo",
        message: "Giỏ hàng đang có sản phẩm, bạn có chắc chắn muốn ghi đè để khôi phục đơn treo này?",
        type: "warning",
        onConfirm: () => {
          setCart(held.cart);
          setSelectedPartner(held.partner);
          if (lastSpokenProductIdRef.current !== undefined) {
            lastSpokenProductIdRef.current = null;
          }
          setHeldOrders(prev => prev.filter(h => h.id !== held.id));
          showToast("ĐÃ KHÔI PHỤC ĐƠN TREO");
        }
      });
    } else {
      setCart(held.cart);
      setSelectedPartner(held.partner);
      if (lastSpokenProductIdRef.current !== undefined) {
        lastSpokenProductIdRef.current = null;
      }
      setHeldOrders(prev => prev.filter(h => h.id !== held.id));
      showToast("ĐÃ KHÔI PHỤC ĐƠN TREO");
    }
  };

  const handleNew = () => {
    setCart([]);
    setSelectedPartner(null);
    setNote("");
    setSearchTerm("");
    setPartnerSearchTerm("");
    setEditOrderId(null);
    setHistoryStep(0);
    if (lastSpokenProductIdRef.current !== undefined) {
      lastSpokenProductIdRef.current = null;
    }
    searchInputRef.current?.focus();
  };

  const loadOrder = (order) => {
    if (lastSpokenProductIdRef.current !== undefined) {
      lastSpokenProductIdRef.current = null;
    }
    setEditOrderId(order.id);
    setCart(
      order.details.map((d) => {
        const freshProd = products.find((p) => p.id === d.product_id);
        return {
          id: Math.random().toString(36).substr(2, 9),
          product_id: d.product_id,
          name: d.product_name,
          price: d.price,
          quantity: d.quantity,
          unit: freshProd ? freshProd.unit : "",
          stock: freshProd ? freshProd.stock : 0
        };
      })
    );
    setNote(order.note || "");
    const loadedMethod = order.payment_method || "Cash";
    setPaymentMethod(loadedMethod === "Debt" ? "Pending" : loadedMethod);
    if (order.partner_id) {
      const p = partners.find(partner => partner.id === order.partner_id);
      setSelectedPartner(p || null);
    } else {
      setSelectedPartner(null);
    }
  };

  const navigateHistory = async (direction) => {
    if (historyLoading) return;
    let nextStep;
    if (direction === "prev") {
      nextStep = historyStep + 1;
    } else {
      nextStep = Math.max(0, historyStep - 1);
    }

    if (nextStep === 0) {
      playPopSound();
      handleNew();
      return;
    }

    playPopSound();
    setHistoryLoading(true);
    try {
      const res = await axios.get(
        `/api/orders?limit=1&page=${nextStep}&type=Sale`
      );
      if (res.data.items && res.data.items.length > 0) {
        loadOrder(res.data.items[0]);
        setHistoryStep(nextStep);
      } else {
        showToast("Không còn hóa đơn nào khác", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Không thể tải lịch sử đơn", "error");
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleNewOrder = () => {
    handleNew();
    showToast("ĐÃ TẠO ĐƠN MỚI");
  };

  // Optimized Search Logic (Exact parity with standard POS priority matching & Vietnamese accents)
  const filteredProducts = useMemo(() => {
    const s = searchTerm.toLowerCase();
    const sNoAccent = removeAccents(s);
    if (!s) {
      return [...products]
        .sort((a, b) => {
          const qtyA = todaySalesMap[a.id] || 0;
          const qtyB = todaySalesMap[b.id] || 0;
          if (qtyB !== qtyA) {
            return qtyB - qtyA;
          }
          const aName = (a.name || "").toLowerCase();
          const bName = (b.name || "").toLowerCase();
          return aName.localeCompare(bName, "vi", { sensitivity: "base" });
        })
        .slice(0, 100);
    }
    return products
      .filter((p) => {
        const name = (p.name || "").toLowerCase();
        const code = (p.code || p.sku || "").toLowerCase();
        const active = (p.active_ingredient || "").toLowerCase();
        return (
          name.includes(s) ||
          removeAccents(name).includes(sNoAccent) ||
          code.includes(s) ||
          removeAccents(code).includes(sNoAccent) ||
          active.includes(s) ||
          removeAccents(active).includes(sNoAccent)
        );
      })
      .sort((a, b) => {
        const aName = (a.name || "").toLowerCase();
        const bName = (b.name || "").toLowerCase();
        const aStarts = aName.startsWith(s);
        const bStarts = bName.startsWith(s);
        if (aStarts && !bStarts) return -1;
        if (!aStarts && bStarts) return 1;
        return aName.localeCompare(bName, "vi", { sensitivity: "base" });
      })
      .slice(0, 200);
  }, [products, searchTerm, todaySalesMap]);

  const filteredPartners = useMemo(() => {
    const s = partnerSearchTerm.toLowerCase();
    const searchId = parseInt(s);
    const sNoAccent = removeAccents(s);
    if (!s) return [];
    return partners
      .filter((p) => {
        const matchesId = !isNaN(searchId) && p.id === searchId;
        const pNameNorm = (p.name || "").toLowerCase();
        return (
          matchesId ||
          pNameNorm.includes(s) ||
          removeAccents(pNameNorm).includes(sNoAccent) ||
          (p.phone || "").includes(s)
        );
      })
      .sort((a, b) => {
        if (!isNaN(searchId)) {
          if (a.id === searchId) return -1;
          if (b.id === searchId) return 1;
        }
        const aName = (a.name || "").toLowerCase();
        const bName = (b.name || "").toLowerCase();
        const aStarts = aName.startsWith(s);
        const bStarts = bName.startsWith(s);
        if (aStarts && !bStarts) return -1;
        if (!aStarts && bStarts) return 1;
        return aName.localeCompare(bName, "vi", { sensitivity: "base" });
      });
  }, [partners, partnerSearchTerm]);

  // Reset index when search term changes
  useEffect(() => {
    setActiveIndex(searchTerm.trim() ? 0 : -1);
    setQuickQty(1);
  }, [searchTerm]);

  useEffect(() => {
    setPartnerIndex(0);
  }, [partnerSearchTerm]);

  const handleEditProduct = useCallback((product) => {
    setEditingProduct(product);
    setIsProductModalOpen(true);
  }, []);

  const handleAddProduct = useCallback(() => {
    setEditingProduct(null);
    setIsProductModalOpen(true);
  }, []);

  const handleEditPartner = useCallback((partner) => {
    setEditingPartner(partner);
    setIsPartnerModalOpen(true);
  }, []);

  const handleAddPartner = useCallback(() => {
    setEditingPartner(null);
    setIsPartnerModalOpen(true);
  }, []);

  const handleAddPartnerWithName = useCallback((name) => {
    setEditingPartner({ name });
    setIsPartnerModalOpen(true);
  }, []);

  const handleProductSaved = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['products'] });
    setIsProductModalOpen(false);
  }, [queryClient]);

  const handlePartnerSaved = useCallback((savedPartner) => {
    queryClient.invalidateQueries({ queryKey: ['partners'] });
    if (savedPartner) {
      setSelectedPartner(savedPartner);
    }
    setIsPartnerModalOpen(false);
  }, [queryClient]);

  // Fetch custom prices when partner changes
  useEffect(() => {
    if (selectedPartner?.id) {
      axios.get(`/api/custom-prices/${selectedPartner.id}`)
        .then(res => setCustomPrices(res.data || {}))
        .catch(err => {
          console.error("Lỗi khi tải bảng giá riêng:", err);
          setCustomPrices({});
        });
    } else {
      setCustomPrices({});
    }
  }, [selectedPartner?.id]);

  // Sync cart prices when customPrices or products change
  useEffect(() => {
    if (cart.length === 0 || products.length === 0) return;
    
    setCart(prevCart => {
      let hasChanged = false;
      const newCart = prevCart.map(item => {
        const fresh = products.find(p => p.id === item.product_id);
        if (fresh) {
          const customPrice = customPrices[item.product_id];
          let autoPrice = customPrice !== undefined ? customPrice : (fresh.sale_price || 0);
          
          if (fresh.bulk_quantity > 0 && item.quantity >= fresh.bulk_quantity) {
              autoPrice = fresh.bulk_price || autoPrice;
          }
          
          if (!item.is_manual_price && item.price !== autoPrice) {
            hasChanged = true;
            return { ...item, price: autoPrice };
          }
        }
        return item;
      });
      return hasChanged ? newCart : prevCart;
    });
  }, [customPrices, products]);

  const handleSave = async (shouldPrint = false) => {
    if (cart.length === 0 || isSaving) return;
    setIsSaving(true);
    try {
      const total = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
      const orderData = {
        partner_id: selectedPartner ? selectedPartner.id : null,
        type: "Sale",
        payment_method: paymentMethod, 
        details: cart.map(item => ({
          product_id: item.product_id,
          product_name: item.name,
          quantity: item.quantity,
          price: item.price
        })),
        note: note,
        amount_paid: paymentMethod === "Cash" ? total : 0,
        created_by: JSON.parse(sessionStorage.getItem('user') || '{}').name || 'Lite'
      };

      let res;
      if (editOrderId) {
        res = await axios.put(`/api/orders/${editOrderId}`, orderData);
      } else {
        res = await axios.post("/api/orders", orderData);
      }
      playSuccessSound();

      showToast("LƯU ĐƠN THÀNH CÔNG!");
      queryClient.invalidateQueries({ queryKey: ['partners'] });
      
      if (shouldPrint) {
        setPrintData(res.data);
        setTimeout(() => {
          window.print();
          setTimeout(() => {
            setPrintData(null);
          }, 1000);
        }, 800);
      }

      setCart([]);
      setSelectedPartner(null);
      setNote("");
      setSearchTerm("");
      setPartnerSearchTerm("");
      setPaymentMethod("Cash");
      setEditOrderId(null);
      setHistoryStep(0);
      if (lastSpokenProductIdRef.current !== undefined) {
        lastSpokenProductIdRef.current = null;
      }
      fetchTodaySales();
      searchInputRef.current?.focus();
    } catch (err) {
      console.error(err);
      showToast("LỖI KHI LƯU ĐƠN", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const addToCart = useCallback((product, qty = 1) => {
    setCart(prev => {
      const existing = prev.find(item => item.product_id === product.id);
      const newQty = existing ? existing.quantity + qty : qty;
      

      
      // Determine price: Custom Price > Sale Price > 0
      const customPrice = customPrices[product.id];
      let autoPrice = customPrice !== undefined ? customPrice : (product.sale_price || 0);
      
      if (product.bulk_quantity > 0 && newQty >= product.bulk_quantity && customPrice === undefined) {
          autoPrice = product.bulk_price || autoPrice;
      }

      if (existing) {
        return prev.map(item => 
          item.product_id === product.id 
            ? { ...item, quantity: newQty, price: item.is_manual_price ? item.price : autoPrice }
            : item
        );
      }
      const itemId = Math.random().toString(36).substr(2, 9);
      
      return [...prev, {
        id: itemId,
        product_id: product.id,
        name: product.name,
        price: autoPrice,
        quantity: qty,
        unit: product.unit,
        stock: product.stock,
        is_manual_price: false
      }];
    });
  }, [customPrices]);

  const handleEnterCreateNewLine = useCallback(() => {
    if (filteredProducts[activeIndex]) {
      addToCart(filteredProducts[activeIndex], 1);
      setSearchTerm("");
    }
    setTimeout(() => {
      if (searchInputRef.current) {
        searchInputRef.current.focus();
        searchInputRef.current.select();
      }
    }, 50);
  }, [filteredProducts, activeIndex, addToCart]);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        navigate("/pos");
        return;
      }
      if (e.ctrlKey && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        navigate("/");
        return;
      }
      if (e.ctrlKey && e.key.toLowerCase() === 'h') {
        e.preventDefault();
        navigate("/history");
        return;
      }
      if (e.key === 'Escape') {
        setContextMenu(null);
      }
      if (e.key === 'F2') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if (e.key === 'F3') {
        e.preventDefault();
        if (selectedPartner) {
          setSelectedPartner(null);
          setPartnerSearchTerm("");
        } else {
          partnerInputRef.current?.focus();
        }
      }
      if (e.key === 'F4') {
        e.preventDefault();
        handleNewOrder();
      }
      if (e.key === 'F7') {
        e.preventDefault();
        if (cart.length > 0) {
          setIsTaxModalOpen(true);
        }
      }
      if (e.key === 'F9') {
        e.preventDefault();
        handleSave(true);
      }

      if (e.key === 'F12') {
        e.preventDefault();
        handleSave(false);
      }
      if (e.ctrlKey && e.key === 'ArrowLeft') {
        e.preventDefault();
        navigateHistory('prev');
      }
      if (e.ctrlKey && e.key === 'ArrowRight') {
        e.preventDefault();
        navigateHistory('next');
      }

      // TAB key navigation loop: Search input <-> Qty input <-> Price input
      if (e.key === 'Tab') {
        const active = document.activeElement;
        
        if (active === searchInputRef.current) {
          e.preventDefault();
          if (filteredProducts[activeIndex]) {
            quickQtyRef.current?.focus();
            quickQtyRef.current?.select();
          } else if (cart.length > 0) {
            const lastItem = cart[cart.length - 1];
            if (e.shiftKey) {
              document.getElementById(`price-input-${lastItem.product_id}`)?.focus();
            } else {
              document.getElementById(`qty-input-${lastItem.product_id}`)?.focus();
            }
          }
          return;
        }

        if (active === quickQtyRef.current) {
          e.preventDefault();
          if (e.shiftKey) {
            searchInputRef.current?.focus();
          } else {
            if (filteredProducts[activeIndex]) {
              const product = filteredProducts[activeIndex];
              addToCart(product, quickQty);
              setSearchTerm("");
              setTimeout(() => {
                const priceInput = document.getElementById(`price-input-${product.id}`);
                if (priceInput) {
                  priceInput.focus();
                  priceInput.select();
                }
              }, 50);
            }
          }
          return;
        }

        if (active && active.classList.contains('pos-lite-cart-qty-input')) {
          e.preventDefault();
          const productId = active.id.replace('qty-input-', '');
          if (e.shiftKey) {
            searchInputRef.current?.focus();
          } else {
            document.getElementById(`price-input-${productId}`)?.focus();
          }
          return;
        }

        if (active && active.classList.contains('pos-lite-cart-price-input')) {
          e.preventDefault();
          const productId = active.id.replace('price-input-', '');
          if (e.shiftKey) {
            document.getElementById(`qty-input-${productId}`)?.focus();
          } else {
            searchInputRef.current?.focus();
          }
          return;
        }
      }

      // Product list navigation
      if (document.activeElement === searchInputRef.current) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setActiveIndex(prev => prev === -1 ? 0 : Math.min(prev + 1, filteredProducts.length - 1));
        }
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          setActiveIndex(prev => Math.max(prev - 1, -1));
        }
        if (e.key === 'Enter') {
          e.preventDefault();
          handleEnterCreateNewLine();
        }
      } else if (document.activeElement === quickQtyRef.current) {
        if (e.key === 'Enter' && filteredProducts[activeIndex]) {
          e.preventDefault();
          addToCart(filteredProducts[activeIndex], quickQty);
          setSearchTerm("");
          setTimeout(() => {
            searchInputRef.current?.focus();
            searchInputRef.current?.select();
          }, 50);
        }
      } else if (document.activeElement === partnerInputRef.current) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setPartnerIndex(prev => Math.min(prev + 1, filteredPartners.length - 1));
        }
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          setPartnerIndex(prev => Math.max(prev - 1, 0));
        }
        if (e.key === 'Enter' && filteredPartners[partnerIndex]) {
          e.preventDefault();
          setSelectedPartner(filteredPartners[partnerIndex]);
          setIsPartnerDropdownOpen(false);
          setPartnerSearchTerm("");
          searchInputRef.current?.focus();
        }
        if (e.key === 'Escape') {
          setIsPartnerDropdownOpen(false);
        }
      }
    };
    const handleCloseMenu = () => {
      setContextMenu(null);
      setShowThemePopover(false);
      setShowNotePopover(false);
      setIsMenuOpen(false);
    };
    window.addEventListener('click', handleCloseMenu);
    window.addEventListener('contextmenu', handleCloseMenu);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('click', handleCloseMenu);
      window.removeEventListener('contextmenu', handleCloseMenu);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [cart, isSaving, selectedPartner, note, filteredProducts, activeIndex, addToCart, quickQty, paymentMethod, filteredPartners, partnerIndex, handleEnterCreateNewLine, total]);

  // Memoized Row Component for extreme performance
  const ProductRow = React.memo(({ product, onAdd, isActive, onEdit, onContextMenu }) => {
    const rowRef = useRef(null);
    
    useEffect(() => {
      // Only scroll into view if active index actually changed (keyboard navigation)
      if (isActive && lastActiveIndexRef.current !== activeIndex && rowRef.current) {
        rowRef.current.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        lastActiveIndexRef.current = activeIndex;
      }
    }, [isActive, activeIndex]);

    return (
      <div 
        ref={rowRef}
        className={cn("pos-lite-product-row", isActive && "pos-lite-row-active")} 
        onClick={() => onAdd(product)}
        onContextMenu={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onContextMenu(e, product);
        }}
      >
        <div className="flex flex-col min-w-0 flex-1 pr-2">
          <div 
            title={product.name}
            className="font-black font-mono text-lg flex flex-wrap items-center gap-x-2 leading-snug break-words whitespace-normal" 
            style={{ color: "var(--lite-text)" }}
          >
            <span>{product.name}</span>
            {product.unit && (
              <span className="text-[9px] px-1.5 py-0.5 rounded font-bold uppercase shrink-0" 
                    style={{ 
                      backgroundColor: isActive ? "rgba(255, 255, 255, 0.2)" : "var(--lite-input-bg)", 
                      color: isActive ? "var(--lite-inv-text)" : "var(--lite-muted)" 
                    }}>
                {product.unit}
              </span>
            )}
          </div>
          {product.active_ingredient && (
            <div 
              title={product.active_ingredient}
              className="text-[10px] opacity-60 truncate uppercase mt-0.5" 
              style={{ color: "var(--lite-text)" }}
            >
              {product.active_ingredient}
            </div>
          )}
        </div>
        <div className="text-right flex flex-col gap-0.5">
          <div className="pos-lite-price-col">
            {formatCurrency(product.sale_price)}
          </div>
          <div className="flex justify-end gap-3 text-[10px] font-bold opacity-40 uppercase" style={{ color: "var(--lite-text)" }}>
            <span>TB: {formatCurrency(product.cost_price)}</span>
            <span>CUỐI: {formatCurrency(product.latest_cost_price)}</span>
          </div>
        </div>
        <div 
          className="pos-lite-stock-col cursor-pointer hover:scale-110 transition-transform active:scale-95" 
          style={{ color: product.stock <= 0 ? "var(--lite-danger)" : "var(--lite-muted)" }}
          onClick={(e) => {
            e.stopPropagation();
            const rect = e.currentTarget.getBoundingClientRect();
            setAuditProduct(product);
            setAuditCoords({
              top: rect.top,
              bottom: rect.bottom,
              left: rect.left,
              right: rect.right,
            });
            setIsAuditOpen(true);
          }}
          title="Kiểm kê kho nhanh"
        >
          {product.stock}
        </div>
      </div>
    );
  });

  return (
    <div className="pos-lite-container" style={{ backgroundColor: theme.bg }}>
      <style>{`
        :root {
          --lite-bg: ${theme.bg};
          --lite-surface: ${theme.surface};
          --lite-input-bg: ${theme.inputBg};
          --lite-sub-surface: ${theme.subSurface};
          --lite-border: ${theme.border};
          --lite-text: ${theme.text};
          --lite-muted: ${theme.muted};
          --lite-inv-text: #ffffff;
          --lite-accent: ${theme.accent};
          --lite-active-bg: ${theme.activeBg};
          --lite-danger: #ef4444;
          --lite-warn: #f59e0b;
        }

        .pos-lite-container {
          background: var(--lite-bg);
          color: var(--lite-text);
          height: 100vh;
          width: 100vw;
          font-family: 'Be Vietnam Pro', ui-sans-serif, system-ui, -apple-system, sans-serif;
          overflow: hidden;
          font-size: ${fontSize};
          cursor: auto !important;
        }

        .pos-lite-screen-wrapper {
          display: flex;
          height: 100%;
          width: 100%;
          overflow: hidden;
        }

        .pos-lite-container * {
          cursor: auto !important;
          font-family: 'Be Vietnam Pro', ui-sans-serif, system-ui, -apple-system, sans-serif !important;
        }

        .pos-lite-main {
          flex: 1; /* Make the left side expand to fill all remaining horizontal screen space! */
          display: flex;
          flex-direction: column;
          padding: 1.25rem;
          background: transparent;
          height: 100%;
          overflow: hidden;
          min-width: 0;
        }

        .pos-lite-search-box {
          background: var(--lite-surface);
          border: 1px solid var(--lite-border);
          padding: 0.4rem 0.8rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.4rem;
          border-radius: 6px;
        }

        .pos-lite-input {
          background: transparent;
          border: none;
          color: var(--lite-text);
          width: 100%;
          font-size: 0.95rem;
          outline: none;
          letter-spacing: -0.01em;
        }

        .pos-lite-input::placeholder {
          color: var(--lite-muted);
          opacity: 0.5;
        }

        .pos-lite-product-list {
          flex: 1;
          overflow-y: auto;
          border: 1px solid var(--lite-border);
          background: var(--lite-sub-surface);
          margin-top: 0.5rem;
          display: flex;
          flex-direction: column;
          border-radius: 8px;
        }

        .pos-lite-product-header {
          display: grid;
          grid-template-columns: 1fr 180px 100px;
          padding: 1rem 1.5rem;
          background: var(--lite-surface);
          font-weight: 700;
          font-size: 0.75rem;
          color: var(--lite-muted);
          border-bottom: 1px solid var(--lite-border);
          text-transform: uppercase;
          letter-spacing: 0.12em;
        }

        .pos-lite-product-row {
          display: grid;
          grid-template-columns: 1fr 180px 100px;
          padding: 0.9rem 1.5rem;
          border-bottom: 1px solid var(--lite-border);
          cursor: pointer;
          align-items: center;
        }

        .pos-lite-product-row:hover {
          background: var(--lite-surface);
        }

        .pos-lite-product-row.pos-lite-row-active {
          background: var(--lite-accent) !important;
          color: var(--lite-inv-text) !important;
          font-weight: 900;
          padding-left: calc(1.5rem - 4px);
        }
        .pos-lite-product-row.pos-lite-row-active * {
          color: var(--lite-inv-text) !important;
        }

        .pos-lite-partner-selector input {
          background-color: var(--lite-input-bg);
          padding: 10px 12px;
          color: var(--lite-text);
          border: 1px solid var(--lite-border);
          border-radius: 6px;
        }

        .pos-lite-sidebar {
          display: flex;
          flex-direction: column;
          background: var(--lite-sub-surface);
          padding: 1.25rem 1rem 0 1rem;
          height: 100%;
          overflow: hidden;
        }

        /* Dynamic resizer line */
        .pos-lite-resizer {
          width: 4px;
          height: 100%;
          background: var(--lite-border);
          cursor: col-resize;
          position: relative;
          z-index: 50;
        }
        .pos-lite-resizer:hover {
          background: var(--lite-accent);
        }

        .pos-lite-cart-list {
          flex: 1;
          overflow-y: auto;
          margin-bottom: 0.75rem;
          min-height: 0;
          padding-right: 2px;
        }

        .pos-lite-cart-item {
          display: grid;
          grid-template-columns: 1fr 150px;
          padding: 0.75rem 0.5rem;
          border-bottom: 1px solid var(--lite-border);
          background: transparent;
          margin-bottom: 0;
        }

        .pos-lite-summary {
          padding: 0.75rem 1rem;
          background: var(--lite-surface);
          border-top: 1px solid var(--lite-border);
          border-radius: 8px 8px 0 0;
          margin-top: auto;
          margin-left: -1rem;
          margin-right: -1rem;
        }

        .pos-lite-btn-save-print {
          background: var(--lite-accent);
          color: var(--lite-inv-text) !important;
          border-radius: 8px;
          font-weight: 850;
          letter-spacing: 0.05em;
          border: 1px solid transparent;
          box-shadow: 0 2px 4px rgba(0,0,0,0.08);
          transition: all 0.15s ease;
        }
        .pos-lite-btn-save-print:hover:not(:disabled) {
          filter: brightness(1.1);
          transform: translateY(-1px);
          box-shadow: 0 4px 6px rgba(0,0,0,0.12);
        }
        .pos-lite-btn-save-print:active:not(:disabled) {
          transform: translateY(0);
        }
        
        .pos-lite-btn-save-only {
          background: transparent;
          color: var(--lite-accent) !important;
          border: 1.5px solid var(--lite-accent);
          border-radius: 8px;
          font-weight: 850;
          letter-spacing: 0.05em;
          transition: all 0.15s ease;
        }
        .pos-lite-btn-save-only:hover:not(:disabled) {
          background: var(--lite-accent);
          color: var(--lite-inv-text) !important;
          transform: translateY(-1px);
          box-shadow: 0 4px 6px rgba(0,0,0,0.08);
        }
        .pos-lite-btn-save-only:active:not(:disabled) {
          transform: translateY(0);
        }

        .pos-lite-btn-aux {
          background: var(--lite-input-bg) !important;
          border: 1px solid var(--lite-border) !important;
          color: var(--lite-text) !important;
          border-radius: 8px;
          font-weight: bold;
          transition: all 0.15s ease;
        }
        .pos-lite-btn-new:hover:not(:disabled) {
          border-color: #10b981 !important;
          color: #10b981 !important;
          background: rgba(16, 185, 129, 0.08) !important;
          transform: translateY(-1px);
        }
        .pos-lite-btn-new:active:not(:disabled) {
          transform: translateY(0);
        }
        .pos-lite-btn-hold:hover:not(:disabled) {
          border-color: #f59e0b !important;
          color: #f59e0b !important;
          background: rgba(245, 158, 11, 0.08) !important;
          transform: translateY(-1px);
        }
        .pos-lite-btn-hold:active:not(:disabled) {
          transform: translateY(0);
        }
        .pos-lite-btn-exit:hover:not(:disabled) {
          border-color: #ef4444 !important;
          color: #ef4444 !important;
          background: rgba(239, 68, 68, 0.08) !important;
          transform: translateY(-1px);
        }
        .pos-lite-btn-exit:active:not(:disabled) {
          transform: translateY(0);
        }

        .pos-lite-main-controls {
          padding: 0.5rem 0.75rem;
          background: var(--lite-surface);
          border: 1px solid var(--lite-border);
          border-radius: 8px;
        }

        /* Scrollbar styling */
        ::-webkit-scrollbar { 
          width: 6px; 
          height: 6px;
        }
        ::-webkit-scrollbar-track { 
          background: transparent; 
        }
        ::-webkit-scrollbar-thumb { 
          background: var(--lite-border); 
          border-radius: 4px;
        }

        /* Scale absolute Tailwind sizes relatively based on container font size */
        .pos-lite-container .text-xs { font-size: 0.75em !important; }
        .pos-lite-container .text-sm { font-size: 0.875em !important; }
        .pos-lite-container .text-base { font-size: 1em !important; }
        .pos-lite-container .text-lg { font-size: 1.125em !important; }
        .pos-lite-container .text-xl { font-size: 1.25em !important; }
        .pos-lite-container .text-2xl { font-size: 1.5em !important; }
        .pos-lite-container .text-3xl { font-size: 1.875em !important; }

        /* Prominent Product List Price & Stock Columns */
        .pos-lite-price-col {
          color: var(--lite-accent) !important;
          font-weight: 900 !important;
          font-size: 1.25em !important;
          text-align: right;
        }
        .pos-lite-stock-col {
          font-weight: 900 !important;
          font-size: 1.15em !important;
          text-align: right;
        }

        /* Prominent Cart Column inputs with flat colors (no boxes, no outlines) */
        .pos-lite-cart-price-input {
          background-color: transparent !important;
          border: none !important;
          font-weight: 900 !important;
          color: var(--lite-text) !important;
          width: 5.5em;
          height: 1.8em;
          text-align: left;
          outline: none;
          padding: 0;
          transition: all 0.2s ease;
          border-radius: 4px;
        }
        .pos-lite-cart-price-input:focus {
          background-color: var(--lite-input-bg) !important;
          box-shadow: 0 0 0 2px var(--lite-accent) !important;
          padding: 0 6px !important;
          width: 6.5em !important;
        }

        .pos-lite-cart-qty-input {
          background-color: transparent !important;
          border: none !important;
          font-weight: 950 !important;
          font-size: 1.6rem !important;
          color: var(--lite-accent) !important;
          width: 2.5em !important;
          height: 1.6em !important;
          text-align: left !important;
          outline: none !important;
          padding: 0 !important;
          transition: all 0.2s ease;
          border-radius: 4px;
        }
        .pos-lite-cart-qty-input:focus {
          background-color: var(--lite-input-bg) !important;
          box-shadow: 0 0 0 2px var(--lite-accent) !important;
          padding: 0 6px !important;
          width: 3.5em !important;
        }

        .pos-lite-cart-subtotal {
          color: ${theme.isDark ? "#fbbf24" : "#b45309"} !important; /* Golden/Amber highlight color */
          font-weight: 950 !important;
          font-size: 1.75rem !important;
          border: none !important;
          padding: 0;
        }

        /* Sleek premium glassmorphic control capsule - Ultra Compact */
        .pos-lite-control-capsule {
          display: flex;
          align-items: center;
          gap: 0.35rem;
          background: transparent;
          border: none;
          padding: 0;
          height: 32px;
        }

        .pos-lite-control-btn {
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          font-size: 9px;
          font-weight: 900;
          transition: all 0.15s ease;
          cursor: pointer;
          background: var(--lite-input-bg) !important;
          border: 1px solid var(--lite-border) !important;
          color: var(--lite-text) !important;
        }

        .pos-lite-control-btn:hover {
          color: var(--lite-accent) !important;
          border-color: var(--lite-accent) !important;
        }

        /* Dedicated specificity-safe active classes for premium toggle icons */
        .pos-lite-control-btn.active-saver {
          background: rgba(16, 185, 129, 0.15) !important;
          color: #10b981 !important;
          border-color: rgba(16, 185, 129, 0.4) !important;
        }

        /* Quick navigation menu dropdown */
        .pos-lite-menu-dropdown {
          position: absolute;
          right: 0;
          top: 34px;
          width: 215px;
          max-height: 460px;
          overflow-y: auto;
          background: var(--lite-surface);
          border: 1px solid var(--lite-border);
          box-shadow: 0 4px 25px rgba(0, 0, 0, 0.25);
          z-index: 200;
          display: flex;
          flex-direction: column;
          padding: 0.25rem 0;
        }

        .pos-lite-menu-section-header {
          text-align: left;
          font-size: 8px;
          font-weight: 900;
          letter-spacing: 0.15em;
          color: var(--lite-accent) !important;
          opacity: 0.8;
          padding: 0.65rem 0.75rem 0.25rem 0.75rem;
          border-bottom: 1px solid var(--lite-border);
          margin-bottom: 0.25rem;
          background: var(--lite-input-bg);
          user-select: none;
        }

        .pos-lite-menu-item {
          padding: 0.45rem 0.75rem;
          font-size: 10px;
          font-weight: 800;
          color: var(--lite-text) !important;
          text-decoration: none;
          transition: all 0.15s ease;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .pos-lite-menu-item:hover {
          background: var(--lite-accent);
          color: var(--lite-inv-text) !important;
        }
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }
        .animate-slide-in-right {
          animation: slideInRight 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>

      {/* Screen Wrapper (Entire UI) - Hidden during print */}
      <div className="no-print pos-lite-screen-wrapper">
        {/* Main Content */}
        <main className="pos-lite-main">


          {/* Ultra-Compact Horizontal Transaction Config Ribbon */}
          <div className="pos-lite-partner-selector mb-2.5 p-0 flex items-center gap-4 justify-between"
               style={{
                 backgroundColor: "transparent",
                 border: "none",
                 boxShadow: "none"
               }}>
            
            {/* Left side: Segment Control */}
            <div className="flex items-center gap-2 shrink-0 select-none">
              <span className="text-[9px] font-black uppercase tracking-wider opacity-45" style={{ color: "var(--lite-text)" }}>
                Giao dịch:
              </span>
              <div className="flex p-0.5 rounded-lg border bg-[var(--lite-input-bg)] border-[var(--lite-border)] w-[160px]">
                <button 
                  className="flex-1 py-1 text-[9px] font-black rounded-md transition-all flex items-center justify-center gap-0.5"
                  style={{ 
                    backgroundColor: paymentMethod === "Cash" ? "var(--lite-accent)" : "transparent",
                    color: paymentMethod === "Cash" ? "var(--lite-inv-text)" : "var(--lite-muted)"
                  }}
                  onClick={() => setPaymentMethod("Cash")}
                >
                  TIỀN MẶT
                </button>
                <button 
                  className="flex-1 py-1 text-[9px] font-black rounded-md transition-all flex items-center justify-center gap-0.5"
                  style={{ 
                    backgroundColor: (paymentMethod === "Pending" || paymentMethod === "Debt") ? "var(--lite-danger)" : "transparent",
                    color: (paymentMethod === "Pending" || paymentMethod === "Debt") ? "#ffffff" : "var(--lite-muted)"
                  }}
                  onClick={() => setPaymentMethod("Pending")}
                >
                  GHI NỢ
                </button>
              </div>
            </div>

            {/* Right side: Customer Search or Details */}
            <div className="flex-1 min-w-0 max-w-[420px]">
              {!selectedPartner ? (
                <div className="relative">
                  <div className="flex items-center gap-2 px-2.5 py-1 border rounded-lg transition-all" style={{ backgroundColor: "var(--lite-input-bg)", borderColor: "var(--lite-border)" }}>
                    <User size={13} style={{ color: "var(--lite-accent)" }} />
                    <input 
                      ref={partnerInputRef}
                      type="text"
                      placeholder="TÌM ĐỐI TÁC... (F3)"
                      className="bg-transparent border-none outline-none w-full text-[11px] font-mono font-bold"
                      style={{ color: "var(--lite-text)" }}
                      value={partnerSearchTerm}
                      onChange={(e) => {
                        setPartnerSearchTerm(e.target.value);
                        setIsPartnerDropdownOpen(true);
                      }}
                      onFocus={(e) => {
                        setIsPartnerDropdownOpen(true);
                        e.target.select();
                      }}
                    />
                    {partnerSearchTerm.trim() !== "" && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddPartnerWithName(partnerSearchTerm);
                        }}
                        className="px-2.5 py-0.5 rounded border text-[9px] font-black uppercase flex items-center gap-0.5 hover:bg-[var(--lite-accent)] hover:text-[var(--lite-inv-text)] hover:border-[var(--lite-accent)] transition-all shrink-0 ml-1"
                        style={{
                          backgroundColor: "var(--lite-surface)",
                          borderColor: "var(--lite-border)",
                          color: "var(--lite-accent)"
                        }}
                        title="Thêm đối tác mới với tên này"
                      >
                        <Plus size={10} /> Thêm mới
                      </button>
                    )}
                  </div>

                  {isPartnerDropdownOpen && partnerSearchTerm && (
                    <div className="absolute top-full left-0 w-full border z-50 max-h-60 overflow-y-auto shadow-2xl rounded-lg mt-1" style={{ backgroundColor: "var(--lite-surface)", borderColor: "var(--lite-border)" }}>
                      {filteredPartners.length === 0 ? (
                        <div className="p-2 text-xs opacity-50" style={{ color: "var(--lite-text)" }}>KHÔNG TÌM THẤY...</div>
                      ) : (
                        filteredPartners.map((p, idx) => (
                          <div 
                            key={p.id} 
                            className={cn(
                              "p-2.5 text-xs cursor-pointer border-b flex justify-between transition-colors",
                              idx === partnerIndex ? "bg-[var(--lite-accent)] text-[var(--lite-inv-text)] font-bold" : "hover:bg-[var(--lite-input-bg)]"
                            )}
                            style={{ color: idx === partnerIndex ? "var(--lite-inv-text)" : "var(--lite-text)", borderBottomColor: "var(--lite-border)" }}
                            onClick={() => {
                              setSelectedPartner(p);
                              setPartnerSearchTerm("");
                              setIsPartnerDropdownOpen(false);
                            }}
                          >
                            <span className="font-bold">{p.name.toUpperCase()}</span>
                            <span className="opacity-60 font-mono text-[10px]">{p.phone}</span>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div 
                  className="flex items-center justify-between gap-3 w-full bg-[var(--lite-input-bg)] px-2.5 py-1 border border-[var(--lite-border)] rounded-lg cursor-pointer select-none"
                  onDoubleClick={() => handleEditPartner(selectedPartner)}
                  title="Nhấp đúp để sửa thông tin đối tác"
                >
                  {/* Left: Client info */}
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <div className="w-5 h-5 rounded flex items-center justify-center font-bold text-[9px] uppercase shrink-0"
                         style={{ 
                           backgroundColor: "rgba(16, 185, 129, 0.12)",
                           color: "var(--lite-accent)" 
                         }}>
                      {selectedPartner.name.charAt(0)}
                    </div>
                    <div className="flex items-center gap-2 truncate min-w-0">
                      <span className="font-mono font-black text-[11px] uppercase truncate" style={{ color: "var(--lite-text)" }}>
                        {selectedPartner.name}
                      </span>
                      <span className="text-[9px] font-mono opacity-50 truncate">
                        📞{selectedPartner.phone || "N/A"}
                      </span>
                    </div>
                  </div>

                  {/* Right: Debt Status & Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <span 
                      className="px-1.5 py-0.5 rounded text-[9px] font-mono font-black"
                      style={{
                        backgroundColor: (selectedPartner.debt_balance > 0 || paymentMethod === "Pending")
                          ? "rgba(239, 68, 68, 0.12)"
                          : "rgba(16, 185, 129, 0.12)",
                        color: (selectedPartner.debt_balance > 0 || paymentMethod === "Pending")
                          ? "var(--lite-danger)"
                          : "#10b981"
                      }}
                    >
                      {paymentMethod === "Pending" ? "NỢ MỚI: " : "NỢ: "}
                      {formatCurrency(
                        paymentMethod === "Pending"
                          ? selectedPartner.debt_balance + cart.reduce((sum, i) => sum + i.price * i.quantity, 0)
                          : selectedPartner.debt_balance
                      )}
                    </span>

                    {/* Sửa đối tác */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditPartner(selectedPartner);
                      }}
                      className="px-2 py-0.5 text-[8px] font-black uppercase rounded border hover:border-[var(--lite-accent)] hover:text-[var(--lite-accent)] transition-all bg-[var(--lite-surface)] border-[var(--lite-border)] text-[var(--lite-accent)] mr-1"
                    >
                      SỬA
                    </button>

                    {/* Lịch sử */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setHistoryPartner(selectedPartner);
                        setIsHistoryDrawerOpen(true);
                        fetchRecentOrders(selectedPartner.id);
                      }}
                      className="px-2 py-0.5 text-[8px] font-black uppercase rounded border hover:border-[var(--lite-accent)] hover:text-[var(--lite-accent)] transition-all bg-[var(--lite-surface)] border-[var(--lite-border)] text-[var(--lite-text)]"
                    >
                      LỊCH SỬ
                    </button>

                    {/* Hủy chọn */}
                    <button
                      onClick={() => { 
                        setSelectedPartner(null); 
                        setPartnerSearchTerm(""); 
                      }}
                      className="p-0.5 rounded border hover:bg-rose-50 hover:border-red-500 text-red-500 transition-all bg-[var(--lite-surface)] border-[var(--lite-border)]"
                      title="Bỏ chọn"
                    >
                      <X size={10} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="pos-lite-search-box" style={{ backgroundColor: "var(--lite-surface)" }}>
            <div className="flex items-center gap-2 flex-1">
              <Search size={16} style={{ color: "var(--lite-accent)" }} />
              <input 
                ref={searchInputRef}
                type="text" 
                className="pos-lite-input" 
                placeholder="Tên SP / Mã vạch... (F2)" 
                style={{ color: "var(--lite-text)" }}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onFocus={(e) => e.target.select()}
              />
            </div>

            <button
              onClick={() => setIsVoiceModalOpen(true)}
              className="px-2.5 py-1 rounded border text-[10px] font-black uppercase flex items-center gap-1 hover:bg-[var(--lite-active-bg)] transition-all bg-[var(--lite-surface)] border-[var(--lite-border)] text-emerald-500 hover:text-emerald-400 shrink-0 mr-1"
              title="Đọc tên / Alias sản phẩm bằng giọng nói (Voice STT)"
            >
              <Mic size={12} className="animate-pulse" /> ĐỌC ALIAS
            </button>

            <button
              onClick={handleAddProduct}
              className="px-2.5 py-1 rounded border text-[10px] font-black uppercase flex items-center gap-0.5 hover:bg-[var(--lite-active-bg)] transition-all bg-[var(--lite-surface)] border-[var(--lite-border)] text-[var(--lite-accent)] shrink-0 mr-1"
              title="Thêm sản phẩm mới nhanh"
            >
              <Plus size={11} /> SP mới
            </button>

            {filteredProducts.length > 0 && activeIndex !== -1 && (
              <div 
                className="flex items-center gap-3 border-2 pl-4 pr-3 py-1.5 max-w-[400px] rounded-full transition-all shadow-md"
                style={{ 
                  backgroundColor: "var(--lite-active-bg)",
                  borderColor: "var(--lite-accent)"
                }}
              >
                <div className="flex flex-col min-w-0">
                  <span className="text-[10px] font-black uppercase leading-none" style={{ color: "var(--lite-accent)" }}>ĐANG CHỌN:</span>
                  <span className="text-[13px] font-black font-mono truncate mt-0.5" style={{ color: "var(--lite-text)" }}>
                    {filteredProducts[activeIndex]?.name.toUpperCase()}
                  </span>
                </div>
                <div className="flex items-center gap-1 border-l pl-2 ml-1" style={{ borderColor: "var(--lite-border)" }}>
                  <span className="text-[10px] font-black font-mono" style={{ color: "var(--lite-accent)" }}>SL:</span>
                  <input 
                    ref={quickQtyRef}
                    type="number"
                    className="w-10 font-black font-mono text-sm outline-none border-b text-center bg-transparent"
                    style={{ color: "var(--lite-text)", borderBottomColor: "var(--lite-accent)" }}
                    value={quickQty}
                    onChange={(e) => setQuickQty(parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="pos-lite-product-list">
            <div className="pos-lite-product-header">
              <div>TÊN HÀNG / ĐVT</div>
              <div className="text-right">ĐƠN GIÁ / VỐN</div>
              <div className="text-right">KHO</div>
            </div>
            {isLoadingProducts ? (
              <div className="p-10 text-center font-mono">ĐANG TẢI DỮ LIỆU...</div>
            ) : (
              filteredProducts.map((p, idx) => (
                <ProductRow 
                  key={p.id} 
                  product={p} 
                  onAdd={(prod) => {
                    addToCart(prod, 1);
                    setTimeout(() => {
                      searchInputRef.current?.focus();
                      searchInputRef.current?.select();
                    }, 50);
                  }}
                  isActive={idx === activeIndex} 
                  onEdit={handleEditProduct} 
                  onContextMenu={(e, prod) => {
                    setContextMenu({
                      x: e.clientX,
                      y: e.clientY,
                      product: prod
                    });
                  }}
                />
              ))
            )}
          </div>
          
          {heldOrders.length > 0 && (
            <div className="mt-2 p-2 bg-black border border-yellow-900/30">
              <div className="text-[10px] text-yellow-600 mb-1 font-bold uppercase">Đơn đang treo:</div>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {heldOrders.map(h => (
                  <button 
                    key={h.id}
                    onClick={() => handleRestoreHeld(h)}
                    className="px-3 py-1 bg-yellow-900/20 border border-yellow-800 text-yellow-500 text-xs whitespace-nowrap hover:bg-yellow-900/40"
                  >
                    {h.time} ({h.cart.length})
                  </button>
                ))}
              </div>
            </div>
          )}


        </main>

        {/* Vertical Resizer Bar */}
        <div 
          className="pos-lite-resizer" 
          onMouseDown={handleMouseDown} 
        />

        {/* Sidebar Content */}
        <aside 
          className="pos-lite-sidebar" 
          style={{ 
            width: `${sidebarWidth}px`, 
            minWidth: '380px' 
          }}
        >
          {/* Logo & Brand Section in Cart Side */}
          <div className="flex items-center justify-between mb-3 pb-3 border-b" style={{ borderColor: "var(--lite-border)" }}>
            <div 
              onClick={(e) => {
                e.stopPropagation();
                setIsMenuOpen(!isMenuOpen);
              }}
              className="flex items-center gap-3 select-none shrink-0 cursor-pointer hover:opacity-80 transition-opacity relative"
              title="Menu nhanh chuyển trang"
            >
              <div className="w-11 h-11 flex items-center justify-center shrink-0">
                <img src={logo} alt="LyangPOS" className="w-full h-full object-contain" />
              </div>
              <div className="flex flex-col">
                <span className="text-[7px] font-black uppercase tracking-[0.15em] opacity-40 leading-none" style={{ color: "var(--lite-text)" }}>HỆ THỐNG BÁN HÀNG</span>
                <span className="text-sm font-black uppercase tracking-tight leading-none mt-0.5" style={{ color: "var(--lite-accent)" }}>
                  Lyang POS <span className="text-[7px] font-black px-1 py-0.5 rounded bg-[var(--lite-surface)] text-[var(--lite-text)] border border-[var(--lite-border)] ml-0.5">LITE</span>
                </span>
              </div>

              {isMenuOpen && (
                <div 
                  className="pos-lite-menu-dropdown" 
                  style={{ left: 0, right: 'auto', top: '48px', width: '192px', borderRadius: '12px', border: '1px solid var(--lite-border)', backgroundColor: 'var(--lite-surface)', zIndex: 100 }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="pos-lite-menu-section-header">LITE MENU</div>
                  <Link to="/" className="pos-lite-menu-item" onClick={() => setIsMenuOpen(false)}>
                    📊 TỔNG QUAN
                  </Link>
                  <Link to="/pos" className="pos-lite-menu-item" onClick={() => setIsMenuOpen(false)}>
                    🖥️ BÁN HÀNG
                  </Link>
                  <Link to="/purchase" className="pos-lite-menu-item" onClick={() => setIsMenuOpen(false)}>
                    📥 NHẬP HÀNG
                  </Link>
                  <Link to="/history" className="pos-lite-menu-item" onClick={() => setIsMenuOpen(false)}>
                    📜 LỊCH SỬ ĐƠN
                  </Link>
                  <Link to="/summary" className="pos-lite-menu-item" onClick={() => setIsMenuOpen(false)}>
                    📈 TỔNG HỢP LITE
                  </Link>
                  <Link to="/ledger" className="pos-lite-menu-item" onClick={() => setIsMenuOpen(false)}>
                    📖 SỔ GIAO DỊCH
                  </Link>
                  <Link to="/settings" className="pos-lite-menu-item" onClick={() => setIsMenuOpen(false)}>
                    ⚙️ CÀI ĐẶT LITE
                  </Link>
                  <div className="h-px my-1" style={{ backgroundColor: "var(--lite-border)" }} />
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      handleLogout();
                    }}
                    className="pos-lite-menu-item w-full text-left"
                    style={{ color: "#ef4444" }}
                  >
                    🚪 ĐĂNG XUẤT
                  </button>
                </div>
              )}
            </div>

            {/* Controls (Theme / Font size / Clock) */}
            <div className="flex items-center gap-2">
              <div className="flex flex-col text-right pr-2 border-r shrink-0" style={{ borderColor: "var(--lite-border)" }}>
                <LiteClock activePath="/pos" superSave={superSave} color="var(--lite-text)" />
              </div>
              
              <div className="pos-lite-control-capsule shrink-0">
                {/* Giao diện Popover */}
                <div className="relative">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowThemePopover(!showThemePopover);
                    }}
                    className={cn(
                      "pos-lite-control-btn flex items-center justify-center",
                      showThemePopover && "active-saver"
                    )}
                    title="Cấu hình giao diện"
                  >
                    <Palette size={12} />
                  </button>

                  {showThemePopover && (
                    <div className="absolute top-[34px] right-0 z-50 p-3 rounded-lg border shadow-xl w-60"
                         style={{ backgroundColor: "var(--lite-surface)", borderColor: "var(--lite-border)" }}
                         onClick={(e) => e.stopPropagation()}
                    >
                      <div className="text-[10px] font-black uppercase tracking-wider mb-2.5" style={{ color: "var(--lite-accent)" }}>
                        Cấu hình giao diện
                      </div>
                      
                      <div className="space-y-3">
                        {/* Font Size Selector */}
                        <div>
                          <div className="text-[9px] font-black uppercase opacity-60 mb-1" style={{ color: "var(--lite-text)" }}>Cỡ chữ</div>
                          <div className="grid grid-cols-4 gap-1">
                            {["14px", "16px", "18px", "20px"].map(sz => (
                              <button
                                key={sz}
                                onClick={() => {
                                  changeFontSize(sz);
                                  localStorage.setItem('pos_lite_font_size', sz);
                                }}
                                className="py-1 text-[10px] font-mono font-bold rounded border hover:bg-[var(--lite-input-bg)] transition-all"
                                style={{
                                  backgroundColor: fontSize === sz ? "var(--lite-accent)" : "transparent",
                                  borderColor: fontSize === sz ? "var(--lite-accent)" : "var(--lite-border)",
                                  color: fontSize === sz ? "var(--lite-inv-text)" : "var(--lite-text)"
                                }}
                              >
                                {sz === "14px" ? "A-" : sz === "16px" ? "A" : sz === "18px" ? "A+" : sz === "20px" ? "A++" : "A"}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Preset Themes */}
                        <div>
                          <div className="text-[9px] font-black uppercase opacity-60 mb-1" style={{ color: "var(--lite-text)" }}>Giao diện mẫu</div>
                          <div className="grid grid-cols-3 gap-1">
                            {[
                              { label: "📜 Cream", color: "#f4ecd8" },
                              { label: "🌿 Sage", color: "#e8f5e9" },
                              { label: "🌙 Tối", color: "#050505" }
                            ].map(t => (
                              <button
                                key={t.color}
                                onClick={() => {
                                  changeTheme(t.color);
                                }}
                                className="py-1 text-[10px] font-mono font-bold rounded border hover:bg-[var(--lite-input-bg)] transition-all"
                                style={{
                                  backgroundColor: bgColor === t.color ? "var(--lite-accent)" : "transparent",
                                  borderColor: bgColor === t.color ? "var(--lite-accent)" : "var(--lite-border)",
                                  color: bgColor === t.color ? "var(--lite-inv-text)" : "var(--lite-text)"
                                }}
                              >
                                {t.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Custom Color Picker */}
                        <div className="pt-1.5 border-t" style={{ borderColor: "var(--lite-border)" }}>
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] font-black uppercase opacity-60" style={{ color: "var(--lite-text)" }}>Màu nền tự do</span>
                            <div className="flex items-center gap-1.5">
                              <input 
                                type="color"
                                className="w-5 h-5 cursor-pointer rounded border-0 p-0"
                                value={bgColor.startsWith("#") && bgColor.length === 7 ? bgColor : "#f4ecd8"}
                                onChange={(e) => {
                                  const nextColor = e.target.value;
                                  changeTheme(nextColor);
                                }}
                              />
                              <span className="text-[9px] font-mono font-bold uppercase opacity-85" style={{ color: "var(--lite-text)" }}>
                                {bgColor}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Ghi nợ nhanh Button */}
                <button
                  onClick={() => {
                    if (selectedPartner) {
                      setIsQuickDebtOpen(true);
                    } else {
                      showToast("VUI LÒNG CHỌN KHÁCH HÀNG TRƯỚC!", "error");
                    }
                  }}
                  className={cn(
                    "pos-lite-control-btn flex items-center justify-center",
                    selectedPartner ? "hover:text-blue-500 hover:border-blue-500" : "opacity-45 cursor-not-allowed"
                  )}
                  title="Ghi nợ sổ tay nhanh"
                >
                  <CreditCard size={12} />
                </button>

                {/* Thu chi nhanh Button */}
                <button
                  onClick={() => {
                    if (selectedPartner) {
                      setIsQuickVoucherOpen(true);
                    } else {
                      showToast("VUI LÒNG CHỌN KHÁCH HÀNG TRƯỚC!", "error");
                    }
                  }}
                  className={cn(
                    "pos-lite-control-btn flex items-center justify-center",
                    selectedPartner ? "hover:text-emerald-500 hover:border-emerald-500" : "opacity-45 cursor-not-allowed"
                  )}
                  title="Lập phiếu thu/chi nhanh"
                >
                  <Wallet size={12} />
                </button>

                {/* Quy đổi thuế Button */}
                <button
                  onClick={() => setIsTaxModalOpen(true)}
                  className={cn(
                    "pos-lite-control-btn flex items-center justify-center",
                    cart.length > 0 ? "hover:text-purple-500 hover:border-purple-500" : "opacity-45 cursor-not-allowed"
                  )}
                  title="Quy đổi tiền chuyển khoản"
                  disabled={cart.length === 0}
                >
                  <BadgePercent size={12} />
                </button>

                {/* Ghi chú Popover Button */}
                <div className="relative">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowNotePopover(!showNotePopover);
                    }}
                    className={cn(
                      "pos-lite-control-btn flex items-center justify-center relative",
                      note && "active-saver"
                    )}
                    title="Ghi chú đơn hàng"
                  >
                    <FileText size={12} />
                    {note && <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-amber-500 rounded-full" />}
                  </button>

                  {showNotePopover && (
                    <div className="absolute top-[34px] right-0 z-50 p-2.5 rounded-lg border shadow-xl w-64"
                         style={{ backgroundColor: "var(--lite-surface)", borderColor: "var(--lite-border)" }}
                         onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] font-black uppercase tracking-wider" style={{ color: "var(--lite-accent)" }}>GHI CHÚ ĐƠN</span>
                        <button 
                          onClick={() => setShowNotePopover(false)}
                          className="text-red-500 hover:text-red-600 p-0.5 rounded"
                        >
                          <X size={10} />
                        </button>
                      </div>
                      <textarea 
                        autoFocus
                        placeholder="Nhập ghi chú tại đây..."
                        className="w-full h-20 p-2 text-xs outline-none border rounded resize-none font-mono"
                        style={{ backgroundColor: "var(--lite-input-bg)", borderColor: "var(--lite-border)", color: "var(--lite-text)" }}
                        value={note}
                        onChange={(e) => {
                          setNote(e.target.value);
                          localStorage.setItem('pos_lite_note', e.target.value);
                        }}
                      />
                    </div>
                  )}
                </div>

                {/* Treo đơn Button */}
                <button 
                  onClick={handleHold}
                  disabled={cart.length === 0}
                  className={cn(
                    "pos-lite-control-btn flex items-center justify-center",
                    cart.length === 0
                      ? "opacity-35 cursor-not-allowed"
                      : "hover:text-amber-500 hover:border-amber-500"
                  )}
                  title="Treo đơn hàng"
                >
                  <Pause size={12} />
                </button>

                {/* Quick History Drawer Button */}
                <button 
                  onClick={() => {
                    setHistoryPartner(selectedPartner);
                    setIsHistoryDrawerOpen(true);
                    fetchRecentOrders(selectedPartner ? selectedPartner.id : null);
                  }}
                  className={cn(
                    "pos-lite-control-btn flex items-center justify-center",
                    isHistoryDrawerOpen && "active-saver"
                  )}
                  title="Lịch sử giao dịch"
                >
                  <History size={12} />
                </button>


              </div>
            </div>
          </div>

          {/* Cart Header (Sub-header) */}
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-2 flex-1 min-w-0 flex-wrap">
              <h2 className="text-lg font-black tracking-tight uppercase leading-normal" style={{ color: "var(--lite-accent)" }}>
                {editOrderId ? `Đơn DH${editOrderId}` : "Giỏ hàng"}
              </h2>
              {editOrderId && (
                <span className={cn(
                  "px-2 py-0.5 text-[9px] font-black font-mono border rounded-full whitespace-nowrap uppercase tracking-wider shadow-sm flex items-center gap-0.5",
                  paymentMethod === "Cash" 
                    ? "bg-emerald-600 dark:bg-emerald-950/40 text-white dark:text-emerald-400 border-emerald-700 dark:border-emerald-500/30" 
                    : "bg-rose-600 dark:bg-red-950/40 text-white dark:text-red-400 border-rose-700 dark:border-red-500/30"
                )}>
                  {paymentMethod === "Cash" ? "💵 TIỀN MẶT" : "⚠️ CÔNG NỢ"}
                </span>
              )}
              {historyStep > 0 && (
                <span className="px-2 py-0.5 text-[9px] bg-amber-500 dark:bg-amber-950/40 text-white dark:text-amber-400 border border-amber-600 dark:border-amber-500/30 font-black font-mono rounded-full whitespace-nowrap shadow-sm flex items-center gap-0.5">
                  LỊCH SỬ #{historyStep}
                </span>
              )}
            </div>
          </div>
          <div className="pos-lite-cart-list">
            {cart.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center opacity-40 select-none pointer-events-none min-h-[50vh]">
                <div className="mb-8 relative">
                  <div className="absolute inset-0 bg-emerald-500 blur-[60px] rounded-full opacity-20" />
                  <ShoppingCart size={160} strokeWidth={0.5} style={{ color: "var(--lite-text)" }} className="relative z-10 drop-shadow-2xl opacity-60" />
                  <div className="absolute -top-6 -right-6 opacity-50">
                    <Sun size={60} style={{ color: "var(--lite-accent)" }} strokeWidth={1} />
                  </div>
                </div>
                <p className="text-4xl md:text-5xl font-black tracking-[0.2em] uppercase mb-4" style={{ color: "var(--lite-text)" }}>Trống rỗng</p>
                <p className="text-sm md:text-base font-bold tracking-widest uppercase opacity-60 flex items-center gap-2" style={{ color: "var(--lite-text)" }}>
                  <Search size={16} /> Quét mã vạch hoặc nhấn F2 để bắt đầu
                </p>
              </div>
            ) : (
              cart.map(item => (
                <div key={item.id} className="pos-lite-cart-item">
                  <div className="flex flex-col min-w-0">
                    <div className="font-normal font-mono text-base uppercase leading-tight truncate" style={{ color: "var(--lite-text)" }}>{item.name}</div>
                    
                    {/* Price & Quantity grouped together under the product name */}
                    <div className="flex items-center gap-4 mt-2">
                      {/* Price Input */}
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] opacity-75 mr-0.5" style={{ color: "var(--lite-text)" }}>GIÁ:</span>
                        <input 
                          id={`price-input-${item.product_id}`}
                          type="text"
                          className="pos-lite-cart-price-input"
                          value={item.price === 0 ? "" : formatNumber(item.price)}
                          placeholder="0"
                          onFocus={(e) => e.target.select()}
                          onChange={(e) => {
                            const rawVal = e.target.value.replace(/,/g, '');
                            const val = parseFloat(rawVal) || 0;
                            setCart(prev => prev.map(i => i.id === item.id ? { ...i, price: val, is_manual_price: true } : i));
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              e.stopPropagation();
                              setTimeout(() => searchInputRef.current?.focus(), 10);
                            }
                          }}
                        />
                      </div>
                      
                      {/* Quantity Input (×) */}
                      <div className="flex items-center">
                        <span className="text-xl font-black mr-1" style={{ color: "var(--lite-accent)" }}>×</span>
                        <input 
                          id={`qty-input-${item.product_id}`}
                          type="number"
                          className="pos-lite-cart-qty-input"
                          value={item.quantity === 0 ? "" : item.quantity}
                          placeholder="0"
                          onFocus={(e) => e.target.select()}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            setCart(prev => prev.map(i => {
                              if (i.id === item.id) {
                                let newPrice = i.price;
                                if (!i.is_manual_price) {
                                  const p = products.find(prod => prod.id === i.product_id);
                                  if (p) {
                                    const basePrice = customPrices[p.id] !== undefined ? customPrices[p.id] : (p.sale_price || 0);
                                    if (p.bulk_quantity > 0 && val >= p.bulk_quantity && customPrices[p.id] === undefined) {
                                      newPrice = p.bulk_price || basePrice;
                                    } else {
                                      newPrice = basePrice;
                                    }
                                  }
                                }
                                return { ...i, quantity: val, price: newPrice };
                              }
                              return i;
                            }));
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              e.stopPropagation();
                              setTimeout(() => searchInputRef.current?.focus(), 10);
                            }
                          }}
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* Right side holds Subtotal & Delete button */}
                  <div className="flex items-center gap-3 justify-end shrink-0">
                    <span className="pos-lite-cart-subtotal font-black font-mono text-xl md:text-2xl text-right tabular-nums shrink-0">
                      {formatNumber(item.price * item.quantity)}
                    </span>
                    <button 
                      onClick={() => setCart(prev => prev.filter(i => i.id !== item.id))}
                      className="w-7 h-7 shrink-0 rounded-md flex items-center justify-center transition-all cursor-pointer border"
                      style={{ 
                        backgroundColor: "var(--lite-input-bg)", 
                        borderColor: "var(--lite-border)",
                        color: "var(--lite-muted)" 
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = "var(--lite-danger)";
                        e.currentTarget.style.borderColor = "var(--lite-danger)";
                        e.currentTarget.style.color = "#ffffff";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "var(--lite-input-bg)";
                        e.currentTarget.style.borderColor = "var(--lite-border)";
                        e.currentTarget.style.color = "var(--lite-muted)";
                      }}
                      title="Xóa khỏi giỏ hàng"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="pos-lite-summary">
            <div className="flex justify-between items-center p-3.5 rounded-lg mt-1 shadow-md" 
                 style={{ 
                   backgroundColor: "var(--lite-accent)" 
                 }}>
              <span className="text-[11px] font-black uppercase font-mono tracking-wider" 
                    style={{ color: theme.isDark ? "#111827" : "#ffffff", opacity: 0.9 }}>
                TỔNG CỘNG:
              </span>
              <span className="text-3xl md:text-4xl font-black font-mono tracking-tighter" 
                    style={{ color: theme.isDark ? "#111827" : "#ffffff" }}>
                {formatCurrency(cart.reduce((sum, i) => sum + i.price * i.quantity, 0))}
              </span>
            </div>

            {/* Checkout Action Buttons (Moved from main header to below Invoice Total) */}
            <div className="mt-3 flex flex-col gap-2">
              {/* Primary Action Row */}
              <div className="grid grid-cols-2 gap-2">
                <button 
                  disabled={isSaving || cart.length === 0}
                  className={cn(
                    "py-3 flex items-center justify-center gap-2 pos-lite-btn-save-print text-xs font-black rounded-lg border shadow-sm select-none transition-all duration-150 cursor-pointer",
                    (isSaving || cart.length === 0)
                      ? "opacity-35 grayscale cursor-not-allowed"
                      : "hover:brightness-110 active:scale-[0.98]"
                  )}
                  style={{
                    backgroundColor: "var(--lite-accent)",
                    color: "var(--lite-inv-text)",
                    borderColor: "transparent"
                  }}
                  onClick={() => handleSave(true)}
                >
                  <Printer size={14} /> IN & LƯU (F9)
                </button>

                <button 
                  disabled={isSaving || cart.length === 0}
                  className={cn(
                    "py-3 flex items-center justify-center gap-2 pos-lite-btn-save-only text-xs font-black rounded-lg border shadow-sm select-none transition-all duration-150 cursor-pointer",
                    (isSaving || cart.length === 0)
                      ? "opacity-35 grayscale cursor-not-allowed"
                      : "hover:brightness-110 active:scale-[0.98]"
                  )}
                  style={{
                    backgroundColor: "transparent",
                    color: "var(--lite-accent)",
                    borderColor: "var(--lite-accent)",
                    borderWidth: "1.5px"
                  }}
                  onClick={() => handleSave(false)}
                >
                  <Save size={14} /> LƯU (F12)
                </button>
              </div>
            </div>
          </div>
        </aside>

        {/* Transaction History Drawer */}
        {isHistoryDrawerOpen && (
          <div className="fixed inset-0 z-[9998] flex justify-end no-print">
            {/* Backdrop */}
            <div 
              className="absolute inset-0 bg-black/50 backdrop-blur-sm" 
              onClick={() => setIsHistoryDrawerOpen(false)}
            />
            {/* Drawer Body */}
            <div 
              className="relative w-[450px] max-w-full h-full shadow-2xl flex flex-col border-l transition-all animate-slide-in-right"
              style={{ backgroundColor: "var(--lite-surface)", borderColor: "var(--lite-border)" }}
            >
              {/* Drawer Header */}
              <div className="p-4 border-b flex justify-between items-center" style={{ borderColor: "var(--lite-border)" }}>
                <div className="flex items-center gap-2 min-w-0">
                  <History size={18} className="shrink-0" style={{ color: "var(--lite-accent)" }} />
                  <span className="font-black font-mono text-xs uppercase tracking-wider truncate" style={{ color: "var(--lite-text)" }}>
                    {historyPartner ? `LỊCH SỬ MUA: ${historyPartner.name.toUpperCase()}` : "LỊCH SỬ GIAO DỊCH (20 ĐƠN GẦN NHẤT)"}
                  </span>
                </div>
                <button 
                  onClick={() => setIsHistoryDrawerOpen(false)} 
                  className="p-1 rounded-md hover:bg-red-500/10 text-red-500 transition-colors shrink-0"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Drawer Content */}
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {isLoadingHistory ? (
                  <div className="p-10 text-center font-mono text-xs opacity-50" style={{ color: "var(--lite-text)" }}>
                    ĐANG TẢI LỊCH SỬ...
                  </div>
                ) : recentOrders.length === 0 ? (
                  <div className="p-10 text-center font-mono text-xs opacity-50" style={{ color: "var(--lite-text)" }}>
                    {historyPartner ? "KHÁCH HÀNG NÀY CHƯA CÓ GIAO DỊCH NÀO." : "CHƯA CÓ GIAO DỊCH NÀO HÔM NAY."}
                  </div>
                ) : (
                  recentOrders.map(order => {
                    const isOrderActive = editOrderId === order.id;
                    return (
                      <div 
                        key={order.id}
                        className={cn(
                          "p-3 rounded-lg border transition-all flex flex-col gap-2 relative overflow-hidden",
                          isOrderActive ? "border-amber-500 ring-1 ring-amber-500/30" : "hover:border-[var(--lite-accent)]"
                        )}
                        style={{ 
                          backgroundColor: "var(--lite-input-bg)", 
                          borderColor: isOrderActive ? "#f59e0b" : "var(--lite-border)" 
                        }}
                      >
                        {/* Order Header info */}
                        <div className="flex justify-between items-start">
                          <div className="flex flex-col">
                            <span className="font-mono font-black text-xs" style={{ color: "var(--lite-text)" }}>
                              #{order.display_id || order.id.slice(-6).toUpperCase()}
                            </span>
                            <span className="text-[9px] font-mono opacity-50" style={{ color: "var(--lite-text)" }}>
                              {new Date(order.date || order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(order.date || order.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="font-mono font-black text-sm block" style={{ color: "var(--lite-accent)" }}>
                              {formatCurrency(order.total_amount)}
                            </span>
                            <span 
                              className="text-[8px] font-black uppercase px-1.5 py-0.5 rounded"
                              style={{ 
                                backgroundColor: order.payment_method === "Cash" ? "rgba(16, 185, 129, 0.12)" : "rgba(239, 68, 68, 0.12)",
                                color: order.payment_method === "Cash" ? "#10b981" : "#ef4444" 
                              }}
                            >
                              {order.payment_method === "Cash" ? "TIỀN MẶT" : "CÔNG NỢ"}
                            </span>
                          </div>
                        </div>

                        {/* Customer */}
                        <div className="text-[10px] font-bold uppercase truncate" style={{ color: "var(--lite-text)", opacity: 0.8 }}>
                          👤 KHÁCH: {order.partner_name || "KHÁCH VÃNG LAI"}
                        </div>

                        {/* Items preview */}
                        <div className="flex flex-wrap gap-1 mt-1">
                          {order.details?.map((d, dIdx) => (
                            <span 
                              key={dIdx} 
                              className="text-[8px] font-bold px-1.5 py-0.5 rounded opacity-80 border"
                              style={{ backgroundColor: "var(--lite-surface)", borderColor: "var(--lite-border)", color: "var(--lite-text)" }}
                            >
                              {d.product_name} <span className="opacity-50">x</span>{d.quantity}
                            </span>
                          ))}
                        </div>

                        {/* Action buttons */}
                        <div className="flex justify-end gap-1.5 mt-2 pt-2 border-t" style={{ borderColor: "var(--lite-border)" }}>
                          <button
                            onClick={() => handleReloadOrder(order)}
                            className="px-2 py-1 text-[9px] font-black uppercase rounded bg-amber-500/10 text-amber-500 hover:bg-amber-500 hover:text-white transition-all font-mono"
                          >
                            SỬA ĐƠN
                          </button>
                          <button
                            onClick={async () => {
                              try {
                                const printRes = await axios.get(`/api/orders/${order.id}`);
                                setPrintData(printRes.data);
                                setTimeout(() => {
                                  window.print();
                                  setTimeout(() => setPrintData(null), 1000);
                                }, 800);
                              } catch (e) {
                                console.error(e);
                                showToast("LỖI KHI IN LẠI ĐƠN", "error");
                              }
                            }}
                            className="px-2 py-1 text-[9px] font-black uppercase rounded bg-blue-500/10 text-blue-500 hover:bg-blue-500 hover:text-white transition-all font-mono"
                          >
                            IN LẠI
                          </button>
                          <button
                            onClick={() => {
                              setConfirm({
                                title: "XÁC NHẬN XÓA ĐƠN",
                                message: `Bạn có chắc muốn XÓA đơn #${order.display_id || order.id}? Thao tác này sẽ phục hồi kho hàng và trừ dư nợ đối tác tương ứng.`,
                                type: "danger",
                                onConfirm: async () => {
                                  try {
                                    await axios.delete(`/api/orders/${order.id}`);
                                    showToast("ĐÃ XÓA ĐƠN HÀNG THÀNH CÔNG!");
                                    fetchRecentOrders();
                                    queryClient.invalidateQueries({ queryKey: ['partners'] });
                                  } catch (e) {
                                    console.error(e);
                                    showToast("LỖI KHI XÓA ĐƠN HÀNG!", "error");
                                  }
                                }
                              });
                            }}
                            className="px-2 py-1 text-[9px] font-black uppercase rounded bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all font-mono"
                          >
                            XÓA ĐƠN
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}

        {localStorage.getItem('feature_tax_calculator_enabled') === 'true' && (
          <TaxCalculatorModal
            isOpen={isTaxModalOpen}
            onClose={() => setIsTaxModalOpen(false)}
            totalAmount={cart.reduce((sum, i) => sum + i.price * i.quantity, 0)}
            partnerName={selectedPartner?.name || ""}
          />
        )}

        {confirm && (
          <ConfirmModal
            isOpen={!!confirm}
            title={confirm.title}
            message={confirm.message}
            type={confirm.type}
            onConfirm={() => {
              confirm.onConfirm();
              setConfirm(null);
            }}
            onCancel={() => setConfirm(null)}
          />
        )}
      </div> {/* End Screen Wrapper */}

      {/* Print Template - Hidden on screen, shown on print */}
      {printData && (
        <div className="only-print">
          <PrintTemplate 
            data={printData} 
            settings={settings}
            type="Sale"
            showOldDebt={printOptions.showOldDebt}
            showPayment={printOptions.showPayment}
            showRemaining={printOptions.showRemaining}
            showCashGiven={printOptions.showCashGiven}
            showChange={printOptions.showChange}
          />
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className={cn(
          "no-print fixed top-4 left-1/2 -translate-x-1/2 px-10 py-5 border-4 font-black z-50 text-2xl shadow-2xl",
          toast.type === "error" ? "bg-red-900 border-red-500 text-white" : "bg-green-900 border-green-500 text-white"
        )}>
          {toast.message}
        </div>
      )}

      {/* Context Menu for Product editing */}
      {contextMenu && (
        <div 
          className="fixed border shadow-2xl rounded-lg py-1 z-[9999] min-w-[140px] overflow-hidden"
          style={{ 
            top: contextMenu.y, 
            left: contextMenu.x, 
            backgroundColor: "var(--lite-surface)", 
            borderColor: "var(--lite-border)" 
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => {
              handleEditProduct(contextMenu.product);
              setContextMenu(null);
            }}
            className="w-full text-left px-3 py-2 text-xs font-bold hover:bg-[var(--lite-input-bg)] text-[var(--lite-accent)] transition-all uppercase flex items-center gap-1.5"
          >
            Sửa sản phẩm
          </button>
        </div>
      )}

      {/* Quick Debt Modal */}
      <QuickDebtModal
        isOpen={isQuickDebtOpen}
        onClose={() => setIsQuickDebtOpen(false)}
        partner={selectedPartner}
        onSave={() => {
          queryClient.invalidateQueries({ queryKey: ['partners'] });
          showToast("ĐÃ GHI NỢ SỔ TAY THÀNH CÔNG!");
        }}
      />

      {/* Quick Voucher Modal */}
      <QuickVoucherModal
        isOpen={isQuickVoucherOpen}
        onClose={() => setIsQuickVoucherOpen(false)}
        partner={selectedPartner}
        onSave={() => {
          queryClient.invalidateQueries({ queryKey: ['partners'] });
          showToast("ĐÃ LẬP PHIẾU THU/CHI THÀNH CÔNG!");
        }}
      />

      {/* Product Edit/Add Modal */}
      <ProductEditModal
        product={editingProduct}
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        onSave={handleProductSaved}
      />

      {/* Partner Edit/Add Modal */}
      <PartnerEditModal
        partner={editingPartner}
        isOpen={isPartnerModalOpen}
        onClose={() => setIsPartnerModalOpen(false)}
        onSave={handlePartnerSaved}
      />

      <Portal>
        {isAuditOpen && auditProduct && (
          <QuickAuditPopout
            product={auditProduct}
            isOpen={isAuditOpen}
            onClose={() => setIsAuditOpen(false)}
            onSave={(updatedProduct) => {
              queryClient.invalidateQueries({ queryKey: ['products'] });
              setIsAuditOpen(false);
              showToast("Đã cập nhật tồn kho thành công!");
            }}
            coordinates={auditCoords}
          />
        )}
      </Portal>
    </div>
  );
};

export default POSLite;
