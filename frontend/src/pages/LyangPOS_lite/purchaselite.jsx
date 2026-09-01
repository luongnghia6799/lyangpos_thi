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
  Truck,
} from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import LiteClock from "../../components/LiteClock";
import { useProductData, usePartnerData } from "../../queries/useProductData";
import { useQueryClient } from "@tanstack/react-query";
import { formatCurrency, cn, playPopSound, playSuccessSound, removeAccents, formatNumber, formatDate } from "../../lib/utils";
import { getLiteTheme } from "../../lib/liteTheme";
import { useLiteThemeSync } from "../../hooks/useLiteThemeSync";
import axios from "axios";
import PrintTemplate from "../../components/PrintTemplate";
import ConfirmModal from "../../components/ConfirmModal";
import { DEFAULT_SETTINGS } from "../../lib/settings";
import ProductEditModal from "../../components/ProductEditModal";
import PartnerEditModal from "../../components/PartnerEditModal";
import QuickDebtModal from "../../components/QuickDebtModal";
import QuickVoucherModal from "../../components/QuickVoucherModal";
import logo from "../../assets/logo.png";

const PurchaseLite = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { data: productsData, isLoading: isLoadingProducts } = useProductData();
  const { data: partnersData, isLoading: isLoadingPartners } = usePartnerData();

  const [settings, setSettings] = useState(DEFAULT_SETTINGS);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const [templatesRes, settingsRes] = await Promise.all([
          axios.get("/api/print-templates?module=Purchase"),
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
        console.error("Failed to load settings in Purchase Lite", err);
      }
    };
    fetchSettings();
  }, []);

  const products = useMemo(() => productsData || [], [productsData]);
  const partners = useMemo(() => partnersData || [], [partnersData]);

  // UI State
  const [searchTerm, setSearchTerm] = useState("");
  const [cart, setCart] = useState(() => {
    const saved = localStorage.getItem('purchase_lite_cart');
    return saved ? JSON.parse(saved) : [];
  });
  const [selectedPartner, setSelectedPartner] = useState(() => {
    const saved = localStorage.getItem('purchase_lite_partner');
    return saved ? JSON.parse(saved) : null;
  });
  const [partnerSearchTerm, setPartnerSearchTerm] = useState("");
  const [isPartnerDropdownOpen, setIsPartnerDropdownOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState(() => {
    return localStorage.getItem('purchase_lite_payment_method') || "Cash";
  });
  const [note, setNote] = useState(() => {
    return localStorage.getItem('purchase_lite_note') || "";
  });
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [superSave, setSuperSave] = useState(false);

  // Edit modals state
  const [editingProduct, setEditingProduct] = useState(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState(null);
  const [isPartnerModalOpen, setIsPartnerModalOpen] = useState(false);
  const [contextMenu, setContextMenu] = useState(null);
  const [isQuickDebtOpen, setIsQuickDebtOpen] = useState(false);
  const [isQuickVoucherOpen, setIsQuickVoucherOpen] = useState(false);
  const [showThemePopover, setShowThemePopover] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showNotePopover, setShowNotePopover] = useState(false);
  const { bgColor, changeTheme } = useLiteThemeSync();

  const theme = useMemo(() => getLiteTheme(bgColor), [bgColor]);

  const isDark = theme.isDark;
  const [fontSize, setFontSize] = useState(localStorage.getItem('pos_lite_font_size') || "16px");
  const changeFontSize = (size) => {
    setFontSize(size);
    localStorage.setItem('pos_lite_font_size', size);
  };
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    return parseInt(localStorage.getItem('purchase_lite_sidebar_width')) || 650;
  });

  const handleMouseDown = (e) => {
    e.preventDefault();
    const handleMouseMove = (moveEvent) => {
      const newWidth = window.innerWidth - moveEvent.clientX;
      if (newWidth > 380 && newWidth < window.innerWidth - 300) {
        setSidebarWidth(newWidth);
        localStorage.setItem('purchase_lite_sidebar_width', newWidth.toString());
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
  const [confirm, setConfirm] = useState(null);
  const [historyStep, setHistoryStep] = useState(0);
  const [editOrderId, setEditOrderId] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  // LiteClock handles time internally
  const [printData, setPrintData] = useState(null);
  const [printOptions, setPrintOptions] = useState(() => {
    const saved = localStorage.getItem("purchase_print_options");
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
    localStorage.setItem("purchase_print_options", JSON.stringify(printOptions));
  }, [printOptions]);

  const [isHistoryDrawerOpen, setIsHistoryDrawerOpen] = useState(false);
  const [recentOrders, setRecentOrders] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [historyPartner, setHistoryPartner] = useState(null);

  const fetchRecentOrders = async (partnerId = null) => {
    setIsLoadingHistory(true);
    try {
      const params = {
        type: "Purchase",
        limit: partnerId ? 50 : 20,
        page: 1
      };
      if (partnerId) {
        params.partner_id = partnerId;
      }
      const res = await axios.get("/api/orders", { params });
      setRecentOrders(res.data.items || res.data || []);
    } catch (err) {
      console.error("Lỗi khi tải lịch sử đơn nhập hàng:", err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleReloadOrder = (order) => {
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
    showToast("ĐÃ NẠP ĐƠN NHẬP LÊN MÀN HÌNH CHỈNH SỬA!");
  };

  const lastActiveIndexRef = useRef(-1);
  const [heldOrders, setHeldOrders] = useState(() => {
    const saved = localStorage.getItem("lite_held_purchases");
    return saved ? JSON.parse(saved) : [];
  });

  // State Persistence
  useEffect(() => {
    localStorage.setItem('purchase_lite_cart', JSON.stringify(cart));
    localStorage.setItem('purchase_lite_partner', JSON.stringify(selectedPartner));
    localStorage.setItem('purchase_lite_payment_method', paymentMethod);
    localStorage.setItem('purchase_lite_note', note);
    localStorage.setItem('pos_lite_bg_color', bgColor);
    localStorage.setItem('lite_held_purchases', JSON.stringify(heldOrders));
  }, [cart, selectedPartner, paymentMethod, note, bgColor, heldOrders]);
  
  const searchInputRef = useRef(null);
  const partnerInputRef = useRef(null);
  const quickQtyRef = useRef(null);

  useEffect(() => {
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
    showToast("ĐÃ TREO ĐƠN NHẬP");
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
          setHeldOrders(prev => prev.filter(h => h.id !== held.id));
          showToast("ĐÃ KHÔI PHỤC ĐƠN TREO");
        }
      });
    } else {
      setCart(held.cart);
      setSelectedPartner(held.partner);
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
    searchInputRef.current?.focus();
  };

  const loadOrder = (order) => {
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
      const hasStoredOldDebt = order.old_debt !== undefined && order.old_debt !== null;
      const resolvedOldDebt = hasStoredOldDebt ? Number(order.old_debt) : Number(p?.debt_balance || 0);
      setSelectedPartner(p ? { ...p, debt_balance: resolvedOldDebt } : (order.partner || null));
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
        `/api/orders?limit=1&page=${nextStep}&type=Purchase`
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

  const handleLogout = () => {
    sessionStorage.removeItem('user');
    localStorage.removeItem('user');
    navigate('/welcome');
  };

  const filteredProducts = useMemo(() => {
    const s = searchTerm.toLowerCase();
    const sNoAccent = removeAccents(s);
    if (!s) {
      return [...products]
        .sort((a, b) => {
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
  }, [products, searchTerm]);

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
    setEditingPartner({ name, is_supplier: true });
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

  const handleSave = async (shouldPrint = false) => {
    if (cart.length === 0 || isSaving) return;
    setIsSaving(true);
    try {
      const total = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
      const orderData = {
        partner_id: selectedPartner ? selectedPartner.id : null,
        type: "Purchase",
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
      showToast("LƯU ĐƠN NHẬP HÀNG THÀNH CÔNG!");
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
      searchInputRef.current?.focus();
    } catch (err) {
      console.error(err);
      showToast("LỖI KHI LƯU ĐƠN", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const addToCart = useCallback((product, qty = 1) => {
    playPopSound();
    setCart(prev => {
      const existing = prev.find(item => item.product_id === product.id);
      if (existing) {
        return prev.map(item => 
          item.product_id === product.id 
            ? { ...item, quantity: item.quantity + qty }
            : item
        );
      }
      const itemId = Math.random().toString(36).substr(2, 9);
      return [...prev, {
        id: itemId,
        product_id: product.id,
        name: product.name,
        price: product.latest_cost_price || product.cost_price || 0,
        quantity: qty,
        unit: product.unit,
        stock: product.stock
      }];
    });
  }, []);

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

      // TAB key navigation loop
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
  }, [cart, isSaving, selectedPartner, note, filteredProducts, activeIndex, addToCart, quickQty, paymentMethod, filteredPartners, partnerIndex, handleEnterCreateNewLine]);

  const ProductRow = React.memo(({ product, onAdd, isActive, onEdit, onContextMenu }) => {
    const rowRef = useRef(null);
    
    useEffect(() => {
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
            {formatCurrency(product.latest_cost_price || product.cost_price)}
          </div>
          <div className="flex justify-end gap-3 text-[10px] font-bold opacity-40 uppercase" style={{ color: "var(--lite-text)" }}>
            <span>GIÁ VỐN TB: {formatCurrency(product.cost_price)}</span>
            <span>NHẬP CUỐI: {formatCurrency(product.latest_cost_price)}</span>
          </div>
        </div>
        <div className="pos-lite-stock-col" style={{ color: product.stock <= 0 ? "var(--lite-danger)" : "var(--lite-muted)" }}>
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
          flex: 1;
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

        .pos-lite-container .text-xs { font-size: 0.75em !important; }
        .pos-lite-container .text-sm { font-size: 0.875em !important; }
        .pos-lite-container .text-base { font-size: 1em !important; }
        .pos-lite-container .text-lg { font-size: 1.125em !important; }
        .pos-lite-container .text-xl { font-size: 1.25em !important; }
        .pos-lite-container .text-2xl { font-size: 1.5em !important; }
        .pos-lite-container .text-3xl { font-size: 1.875em !important; }

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
          color: ${theme.isDark ? "#fbbf24" : "#b45309"} !important;
          font-weight: 950 !important;
          font-size: 1.75rem !important;
          border: none !important;
          padding: 0;
        }

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

        .pos-lite-control-btn.active-saver {
          background: rgba(16, 185, 129, 0.15) !important;
          color: #10b981 !important;
          border-color: rgba(16, 185, 129, 0.4) !important;
        }

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

      {/* Screen Wrapper */}
      <div className="no-print pos-lite-screen-wrapper" style={{ flexDirection: 'row-reverse' }}>
        {/* Main Content */}
        <main className="pos-lite-main relative">
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-[0.03] overflow-hidden z-0">
            <span className="font-black text-[20vw] leading-none select-none tracking-tighter whitespace-nowrap rotate-[-12deg]" style={{ color: theme.text }}>NHẬP HÀNG</span>
          </div>
          <div className="relative z-10 h-full flex flex-col">
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

            {/* Right side: Supplier Search or Details */}
            <div className="flex-1 min-w-0 max-w-[420px]">
              {!selectedPartner ? (
                <div className="relative">
                  <div className="flex items-center gap-2 px-2.5 py-1 border rounded-lg transition-all" style={{ backgroundColor: "var(--lite-input-bg)", borderColor: "var(--lite-border)" }}>
                    <User size={13} style={{ color: "var(--lite-accent)" }} />
                    <input 
                      ref={partnerInputRef}
                      type="text"
                      placeholder="TÌM NHÀ CUNG CẤP... (F3)"
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
                        title="Thêm nhà cung cấp mới với tên này"
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
                  title="Nhấp đúp để sửa thông tin"
                >
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

                  <div className="flex items-center gap-2 shrink-0">
                    <span 
                      className="px-1.5 py-0.5 rounded text-[9px] font-mono font-black"
                      style={{
                        backgroundColor: (selectedPartner.debt_balance < 0 || paymentMethod === "Pending")
                          ? "rgba(239, 68, 68, 0.12)"
                          : "rgba(16, 185, 129, 0.12)",
                        color: (selectedPartner.debt_balance < 0 || paymentMethod === "Pending")
                          ? "var(--lite-danger)"
                          : "#10b981"
                      }}
                    >
                      {paymentMethod === "Pending" ? "NỢ NHẬP MỚI: " : "NỢ CC: "}
                      {formatCurrency(
                        paymentMethod === "Pending"
                          ? Math.abs(selectedPartner.debt_balance) + cart.reduce((sum, i) => sum + i.price * i.quantity, 0)
                          : Math.abs(selectedPartner.debt_balance)
                      )}
                    </span>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditPartner(selectedPartner);
                      }}
                      className="px-2 py-0.5 text-[8px] font-black uppercase rounded border hover:border-[var(--lite-accent)] hover:text-[var(--lite-accent)] transition-all bg-[var(--lite-surface)] border-[var(--lite-border)] text-[var(--lite-accent)] mr-1"
                    >
                      SỬA
                    </button>

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
                placeholder="Tìm sản phẩm cần nhập... (F2)" 
                style={{ color: "var(--lite-text)" }}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onFocus={(e) => e.target.select()}
              />
            </div>

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
              <div className="text-right">ĐƠN GIÁ NHẬP / VỐN</div>
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
          </div>
        </main>

        <div className="pos-lite-resizer" onMouseDown={handleMouseDown} />

        {/* Sidebar Content */}
        <aside className="pos-lite-sidebar" style={{ width: `${sidebarWidth}px`, minWidth: '380px' }}>
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
                <span className="text-[7px] font-black uppercase tracking-[0.15em] opacity-40 leading-none" style={{ color: "var(--lite-text)" }}>HỆ THỐNG NHẬP HÀNG</span>
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

            {/* Controls */}
            <div className="flex items-center gap-2">
              <div className="flex flex-col text-right pr-2 border-r shrink-0" style={{ borderColor: "var(--lite-border)" }}>
                <LiteClock activePath="/purchase" superSave={superSave} color="var(--lite-text)" />
              </div>
              
              <div className="pos-lite-control-capsule shrink-0">
                {/* Theme Selector */}
                <div className="relative">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowThemePopover(!showThemePopover);
                    }}
                    className={cn("pos-lite-control-btn flex items-center justify-center", showThemePopover && "active-saver")}
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
                        <div>
                          <div className="text-[9px] font-black uppercase opacity-60 mb-1" style={{ color: "var(--lite-text)" }}>Cỡ chữ</div>
                          <div className="grid grid-cols-4 gap-1">
                            {["14px", "16px", "18px", "20px"].map(sz => (
                              <button
                                key={sz}
                                onClick={() => changeFontSize(sz)}
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

                        <div className="pt-1.5 border-t" style={{ borderColor: "var(--lite-border)" }}>
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] font-black uppercase opacity-60" style={{ color: "var(--lite-text)" }}>Màu nền tự do</span>
                            <div className="flex items-center gap-1.5">
                              <input 
                                type="color"
                                className="w-5 h-5 cursor-pointer rounded border-0 p-0"
                                value={bgColor.startsWith("#") && bgColor.length === 7 ? bgColor : "#f4ecd8"}
                                onChange={(e) => {
                                  changeTheme(e.target.value);
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

                {/* Quick Debt */}
                <button
                  onClick={() => {
                    if (selectedPartner) {
                      setIsQuickDebtOpen(true);
                    } else {
                      showToast("VUI LÒNG CHỌN NHÀ CUNG CẤP TRƯỚC!", "error");
                    }
                  }}
                  className={cn("pos-lite-control-btn flex items-center justify-center", selectedPartner ? "hover:text-blue-500 hover:border-blue-500" : "opacity-45 cursor-not-allowed")}
                  title="Ghi nợ sổ tay nhanh"
                >
                  <CreditCard size={12} />
                </button>

                {/* Quick Voucher */}
                <button
                  onClick={() => {
                    if (selectedPartner) {
                      setIsQuickVoucherOpen(true);
                    } else {
                      showToast("VUI LÒNG CHỌN NHÀ CUNG CẤP TRƯỚC!", "error");
                    }
                  }}
                  className={cn("pos-lite-control-btn flex items-center justify-center", selectedPartner ? "hover:text-emerald-500 hover:border-emerald-500" : "opacity-45 cursor-not-allowed")}
                  title="Lập phiếu chi nhanh"
                >
                  <Wallet size={12} />
                </button>

                {/* Note */}
                <div className="relative">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowNotePopover(!showNotePopover);
                    }}
                    className={cn("pos-lite-control-btn flex items-center justify-center relative", note && "active-saver")}
                    title="Ghi chú đơn hàng"
                  >
                    <FileText size={12} />
                    {note && <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />}
                  </button>

                  {showNotePopover && (
                    <div className="absolute top-[34px] right-0 z-50 p-2.5 rounded-lg border shadow-xl w-64"
                         style={{ backgroundColor: "var(--lite-surface)", borderColor: "var(--lite-border)" }}
                         onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] font-black uppercase tracking-wider" style={{ color: "var(--lite-accent)" }}>GHI CHÚ ĐƠN NHẬP</span>
                        <button onClick={() => setShowNotePopover(false)} className="text-red-500 hover:text-red-600 p-0.5 rounded">
                          <X size={10} />
                        </button>
                      </div>
                      <textarea 
                        autoFocus
                        placeholder="Nhập ghi chú nhập hàng..."
                        className="w-full h-20 p-2 text-xs outline-none border rounded resize-none font-mono"
                        style={{ backgroundColor: "var(--lite-input-bg)", borderColor: "var(--lite-border)", color: "var(--lite-text)" }}
                        value={note}
                        onChange={(e) => {
                          setNote(e.target.value);
                          localStorage.setItem('purchase_lite_note', e.target.value);
                        }}
                      />
                    </div>
                  )}
                </div>

                {/* Hold */}
                <button 
                  onClick={handleHold}
                  disabled={cart.length === 0}
                  className={cn("pos-lite-control-btn flex items-center justify-center", cart.length === 0 ? "opacity-35 cursor-not-allowed" : "hover:text-amber-500 hover:border-amber-500")}
                  title="Treo đơn hàng"
                >
                  <Pause size={12} />
                </button>

                {/* History Drawer */}
                <button 
                  onClick={() => {
                    setHistoryPartner(selectedPartner);
                    setIsHistoryDrawerOpen(true);
                    fetchRecentOrders(selectedPartner ? selectedPartner.id : null);
                  }}
                  className={cn("pos-lite-control-btn flex items-center justify-center", isHistoryDrawerOpen && "active-saver")}
                  title="Lịch sử giao dịch"
                >
                  <History size={12} />
                </button>


              </div>
            </div>
          </div>

          {/* Cart Header */}
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-2 flex-1 min-w-0 flex-wrap">
              <h2 className="text-lg font-black tracking-tight uppercase leading-normal" style={{ color: "var(--lite-accent)" }}>
                {editOrderId ? `Nhập hàng #${editOrderId}` : "Đơn nhập hàng"}
              </h2>
              {editOrderId && (
                <span className={cn(
                  "px-2 py-0.5 text-[9px] font-black font-mono border rounded-full whitespace-nowrap uppercase tracking-wider shadow-sm",
                  paymentMethod === "Cash" 
                    ? "bg-emerald-600 dark:bg-emerald-950/40 text-white dark:text-emerald-400 border-emerald-700 dark:border-emerald-500/30" 
                    : "bg-rose-600 dark:bg-red-950/40 text-white dark:text-red-400 border-rose-700 dark:border-red-500/30"
                )}>
                  {paymentMethod === "Cash" ? "💵 TRẢ TIỀN MẶT" : "⚠️ GHI NỢ NCC"}
                </span>
              )}
            </div>
          </div>

          <div className="pos-lite-cart-list">
            {cart.length === 0 ? (
              <div className="text-center text-gray-800 mt-20 font-mono italic text-sm">GIỎ HÀNG NHẬP TRỐNG</div>
            ) : (
              cart.map(item => (
                <div key={item.id} className="pos-lite-cart-item">
                  <div className="flex flex-col min-w-0">
                    <div className="font-normal font-mono text-base uppercase leading-tight truncate" style={{ color: "var(--lite-text)" }}>{item.name}</div>
                    
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
                            setCart(prev => prev.map(i => i.id === item.id ? { ...i, price: val } : i));
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleEnterCreateNewLine();
                            }
                          }}
                        />
                      </div>
                      
                      {/* Qty Input */}
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
                            setCart(prev => prev.map(i => i.id === item.id ? { ...i, quantity: val } : i));
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleEnterCreateNewLine();
                            }
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end justify-between">
                    <button 
                      onClick={() => setCart(prev => prev.filter(i => i.id !== item.id))}
                      className="p-1 text-red-500 hover:bg-rose-900/10 rounded transition-colors"
                      title="Xóa khỏi đơn"
                    >
                      <Trash2 size={13} />
                    </button>
                    <div className="pos-lite-cart-subtotal">
                      {formatNumber(item.price * item.quantity)}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Cart Summary */}
          <div className="pos-lite-summary">
            <div className="flex justify-between items-center mb-4">
              <span className="text-[10px] font-black opacity-50 uppercase tracking-wider" style={{ color: "var(--lite-text)" }}>TỔNG CỘNG ({cart.length} dòng):</span>
              <span className="text-3xl font-black font-mono tracking-tight" style={{ color: theme.accent }}>
                {formatCurrency(cart.reduce((sum, i) => sum + i.price * i.quantity, 0))}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-2">
              <button 
                onClick={handleNewOrder}
                className="pos-lite-btn-aux pos-lite-btn-new py-2 text-[10px] uppercase font-bold"
              >
                Hủy / Đơn Mới (F4)
              </button>
              <button 
                onClick={handleHold}
                disabled={cart.length === 0}
                className="pos-lite-btn-aux pos-lite-btn-hold py-2 text-[10px] uppercase font-bold"
              >
                Treo Đơn Nhập
              </button>
            </div>

            <div className="grid grid-cols-12 gap-2">
              <button 
                disabled={cart.length === 0 || isSaving}
                onClick={() => handleSave(false)}
                className="col-span-4 pos-lite-btn-save-only py-4 text-xs font-black uppercase"
              >
                Lưu Đơn (F12)
              </button>
              <button 
                disabled={cart.length === 0 || isSaving}
                onClick={() => handleSave(true)}
                className="col-span-8 pos-lite-btn-save-print py-4 text-xs font-black uppercase"
              >
                Lưu & In Đơn (F9)
              </button>
            </div>
          </div>
        </aside>
      </div>

      {/* History Drawer */}
      {isHistoryDrawerOpen && (
        <div className="fixed inset-0 z-[1000] flex justify-end no-print">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-xs" onClick={() => setIsHistoryDrawerOpen(false)} />
          <div className="relative w-full max-w-md h-full flex flex-col shadow-2xl border-l animate-slide-in-right"
               style={{ backgroundColor: "var(--lite-bg)", borderColor: "var(--lite-border)" }}
          >
            <div className="p-4 border-b flex justify-between items-center" style={{ borderColor: "var(--lite-border)" }}>
              <div>
                <h3 className="font-black text-sm uppercase tracking-wider" style={{ color: "var(--lite-accent)" }}>Lịch sử nhập hàng</h3>
                <p className="text-[9px] font-bold opacity-50 uppercase mt-0.5">
                  {historyPartner ? `NHÀ CUNG CẤP: ${historyPartner.name}` : "TẤT CẢ NHÀ CUNG CẤP"}
                </p>
              </div>
              <button onClick={() => setIsHistoryDrawerOpen(false)} className="p-1 rounded hover:bg-red-500/10 text-red-500">
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {isLoadingHistory ? (
                <div className="p-10 text-center font-mono opacity-50 text-xs">ĐANG TẢI...</div>
              ) : recentOrders.length === 0 ? (
                <div className="p-10 text-center font-mono italic opacity-50 text-xs">Không tìm thấy đơn nào.</div>
              ) : (
                recentOrders.map(order => {
                  return (
                    <div 
                      key={order.id} 
                      className="p-3 border rounded-xl hover:bg-[var(--lite-input-bg)] cursor-pointer transition-colors"
                      style={{ backgroundColor: "var(--lite-surface)", borderColor: "var(--lite-border)" }}
                      onClick={() => handleReloadOrder(order)}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <span className="font-mono font-black text-xs text-[var(--lite-text)]">#{order.display_id || order.id}</span>
                          <span className="text-[9px] font-bold opacity-40 ml-2">{formatDate(order.date)}</span>
                        </div>
                        <span className="font-black text-xs text-[var(--lite-accent)]">
                          {formatNumber(order.total_amount)}
                        </span>
                      </div>
                      
                      <div className="flex flex-wrap gap-1 mt-2">
                        {order.details.map((d, dIdx) => (
                          <span 
                            key={dIdx} 
                            className="px-1.5 py-0.5 rounded bg-[var(--lite-input-bg)] text-[9px] font-bold uppercase"
                            style={{ color: "var(--lite-text)" }}
                          >
                            {d.product_name} x{d.quantity}
                          </span>
                        ))}
                      </div>

                      <div className="flex justify-end gap-1.5 mt-2 pt-2 border-t" style={{ borderColor: "var(--lite-border)" }}>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleReloadOrder(order); }}
                          className="px-2 py-1 text-[9px] font-black uppercase rounded bg-amber-500/10 text-amber-500 hover:bg-amber-500 hover:text-white transition-all font-mono"
                        >
                          SỬA ĐƠN
                        </button>
                        <button
                          onClick={async (e) => {
                            e.stopPropagation();
                            try {
                              const printRes = await axios.get(`/api/orders/${order.id}`);
                              const orderData = printRes.data || order;
                              const hasStoredOldDebt = orderData.old_debt !== undefined && orderData.old_debt !== null;
                              const p = partners.find(pt => pt.id === orderData.partner_id);
                              const resolvedOldDebt = hasStoredOldDebt ? Number(orderData.old_debt) : Number(p?.debt_balance || 0);
                              setPrintData({
                                ...orderData,
                                old_debt: resolvedOldDebt,
                                partner: p ? { ...p, debt_balance: resolvedOldDebt } : (orderData.partner || null)
                              });
                              setTimeout(() => {
                                window.print();
                                setTimeout(() => setPrintData(null), 1000);
                              }, 800);
                            } catch (err) {
                              console.error(err);
                              showToast("LỖI KHI IN LẠI ĐƠN", "error");
                            }
                          }}
                          className="px-2 py-1 text-[9px] font-black uppercase rounded bg-blue-500/10 text-blue-500 hover:bg-blue-500 hover:text-white transition-all font-mono"
                        >
                          IN LẠI
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setConfirm({
                              title: "XÁC NHẬN XÓA ĐƠN",
                              message: `Bạn có chắc muốn XÓA đơn nhập #${order.display_id || order.id}? Thao tác này sẽ hoàn trả lại kho hàng và dư nợ nhà cung cấp.`,
                              type: "danger",
                              onConfirm: async () => {
                                try {
                                  await axios.delete(`/api/orders/${order.id}`);
                                  showToast("ĐÃ XÓA ĐƠN HÀNG THÀNH CÔNG!");
                                  fetchRecentOrders(historyPartner ? historyPartner.id : null);
                                  queryClient.invalidateQueries({ queryKey: ['partners'] });
                                } catch (err) {
                                  console.error(err);
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

      {/* Print Template */}
      {printData && (
        <div className="only-print">
          <PrintTemplate 
            data={printData} 
            settings={settings}
            type="Purchase"
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

      {/* Context Menu */}
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

      {/* Modals */}
      <QuickDebtModal
        isOpen={isQuickDebtOpen}
        onClose={() => setIsQuickDebtOpen(false)}
        partner={selectedPartner}
        onSave={() => {
          queryClient.invalidateQueries({ queryKey: ['partners'] });
          showToast("ĐÃ GHI NỢ SỔ TAY THÀNH CÔNG!");
        }}
      />

      <QuickVoucherModal
        isOpen={isQuickVoucherOpen}
        onClose={() => setIsQuickVoucherOpen(false)}
        partner={selectedPartner}
        onSave={() => {
          queryClient.invalidateQueries({ queryKey: ['partners'] });
          showToast("ĐÃ LẬP PHIẾU CHI THÀNH CÔNG!");
        }}
      />

      <ProductEditModal
        product={editingProduct}
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        onSave={handleProductSaved}
      />

      <PartnerEditModal
        partner={editingPartner}
        isOpen={isPartnerModalOpen}
        onClose={() => setIsPartnerModalOpen(false)}
        onSave={handlePartnerSaved}
      />
    </div>
  );
};

export default PurchaseLite;
