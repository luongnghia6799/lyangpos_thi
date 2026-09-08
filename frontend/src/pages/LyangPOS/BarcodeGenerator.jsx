import React, { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import Barcode from 'react-barcode';
import { Printer, Search, Plus, Trash2, Box, RefreshCw, Layers, CheckSquare, Square, Eye, Sliders, List, HelpCircle, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';

const DraggableElement = ({ children, x, y, onChange, containerRef, active, onSelect, showResize, onResize, style = {} }) => {
    const [dragging, setDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [posStart, setPosStart] = useState({ x: 0, y: 0 });

    const handleMouseDown = (e) => {
        e.stopPropagation();
        onSelect && onSelect();
        setDragging(true);
        setDragStart({ x: e.clientX, y: e.clientY });
        setPosStart({ x, y });
    };

    useEffect(() => {
        if (!dragging) return;

        const handleMouseMove = (e) => {
            if (!containerRef.current) return;
            const rect = containerRef.current.getBoundingClientRect();
            const deltaX = ((e.clientX - dragStart.x) / rect.width) * 100;
            const deltaY = ((e.clientY - dragStart.y) / rect.height) * 100;
            
            const newX = Math.max(0, Math.min(95, posStart.x + deltaX));
            const newY = Math.max(0, Math.min(95, posStart.y + deltaY));
            
            onChange(newX, newY);
        };

        const handleMouseUp = () => {
            setDragging(false);
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [dragging, dragStart, posStart, containerRef, onChange]);

    return (
        <div
            style={{
                position: 'absolute',
                left: `${x}%`,
                top: `${y}%`,
                cursor: 'move',
                userSelect: 'none',
                border: active ? '2px dashed #10b981' : '1px solid transparent',
                padding: '2px',
                borderRadius: '4px',
                backgroundColor: active ? 'rgba(16, 185, 129, 0.05)' : 'transparent',
                display: 'inline-block',
                zIndex: active ? 20 : 10,
                ...style
            }}
            onMouseDown={handleMouseDown}
        >
            {children}
            {active && showResize && (
                <div
                    style={{
                        position: 'absolute',
                        right: '-6px',
                        bottom: '-6px',
                        width: '12px',
                        height: '12px',
                        backgroundColor: '#10b981',
                        border: '2px solid white',
                        borderRadius: '50%',
                        cursor: 'se-resize',
                        zIndex: 30
                    }}
                    onMouseDown={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        const startSizeY = e.clientY;
                        const startSizeX = e.clientX;
                        
                        const handleResizeMove = (re) => {
                            const deltaY = re.clientY - startSizeY;
                            const deltaX = re.clientX - startSizeX;
                            onResize(deltaX, deltaY);
                        };
                        
                        const handleResizeUp = () => {
                            window.removeEventListener('mousemove', handleResizeMove);
                            window.removeEventListener('mouseup', handleResizeUp);
                        };
                        
                        window.addEventListener('mousemove', handleResizeMove);
                        window.addEventListener('mouseup', handleResizeUp);
                    }}
                />
            )}
        </div>
    );
};

const getBarcodeScaleFactor = (val) => {
    if (!val) return 1;
    const str = String(val);
    const len = str.length;
    // If there is a hyphen (meaning it's a combo package), it will be encoded in CODE128, which is much wider.
    if (str.includes('-')) {
        // Keep the scale factor high enough (minimum 0.72) so the bar width stays thick and scannable
        return Math.max(0.72, Math.min(0.85, 11 / (len + 3)));
    }
    // For general long barcodes (longer than 10 digits)
    if (len > 10) {
        return Math.max(0.78, Math.min(0.9, 12 / (len + 2)));
    }
    return 1;
};

const BarcodeGenerator = () => {
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');
    const debounceTimeoutRef = React.useRef(null);
    const searchInputRef = React.useRef(null);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'F2') {
                e.preventDefault();
                searchInputRef.current?.focus();
                searchInputRef.current?.select();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const handleSearchChange = (e) => {
        const val = e.target.value;
        if (debounceTimeoutRef.current) {
            clearTimeout(debounceTimeoutRef.current);
        }
        debounceTimeoutRef.current = setTimeout(() => {
            setSearchTerm(val);
        }, 300);
    };

    useEffect(() => {
        return () => {
            if (debounceTimeoutRef.current) {
                clearTimeout(debounceTimeoutRef.current);
            }
        };
    }, []);

    const [printList, setPrintList] = useState(() => {
        const saved = localStorage.getItem('lyangpos_print_list');
        return saved ? JSON.parse(saved) : [];
    });
    const [hidePrinted, setHidePrinted] = useState(() => {
        return localStorage.getItem('lyangpos_hide_printed') === 'true';
    });
    const [paperSize, setPaperSize] = useState('A4');
    const [barcodeScale, setBarcodeScale] = useState(1.2);
    const [activeTab, setActiveTab] = useState('list');
    const [toast, setToast] = useState(null);
    const [filterMode, setFilterMode] = useState('all'); // 'all', 'has_code', 'no_code'
    const [displayLimit, setDisplayLimit] = useState(10); // 10 or 'all'
    const [selectedElement, setSelectedElement] = useState('name'); // 'name', 'barcode', or 'combo'
    const designerContainerRef = React.useRef(null);
    const firstCellRef = React.useRef(null);
    const [labelConfig, setLabelConfig] = useState(() => {
        const saved = localStorage.getItem('lyangpos_label_config');
        const parsed = saved ? JSON.parse(saved) : {};
        const storedPaperSize = localStorage.getItem('lyangpos_paper_size') || 'A4';
        return {
            showName: parsed.showName ?? true,
            showCombo: parsed.showCombo ?? true,
            nameFontSize: parsed.nameFontSize ?? 100,
            comboFontSize: parsed.comboFontSize ?? 100,
            labelMargin: parsed.labelMargin ?? 100,
            comboPosition: parsed.comboPosition ?? 'top-right',
            nameFont: parsed.nameFont ?? 'monospace',
            comboFont: parsed.comboFont ?? 'monospace',
            nameX: parsed.nameX ?? 10,
            nameY: parsed.nameY ?? 10,
            barcodeX: parsed.barcodeX ?? 10,
            barcodeY: parsed.barcodeY ?? 35,
            comboX: parsed.comboX ?? 80,
            comboY: parsed.comboY ?? 10,
            prefix: parsed.prefix ?? 'SP',
            a4Columns: parsed.a4Columns ?? 2,
            a4Rows: parsed.a4Rows ?? 5,
            labelHeight: parsed.labelHeight ?? (storedPaperSize === '35x22' ? 22 : storedPaperSize === 'A6' ? 45 : 52),
            labelWidth: parsed.labelWidth ?? (storedPaperSize === '35x22' ? 35 : 0),
            a4MarginTop: parsed.a4MarginTop ?? 10,
            a4MarginSide: parsed.a4MarginSide ?? 15,
            labelGap: parsed.labelGap ?? 4,
            showBarcodeText: parsed.showBarcodeText ?? true,
            barcodeWidthScale: parsed.barcodeWidthScale ?? 100,
            barcodeHeightScale: parsed.barcodeHeightScale ?? 100
        };
    });

    const labelConfigRef = React.useRef(labelConfig);

    useEffect(() => {
        localStorage.setItem('lyangpos_paper_size', paperSize);
        setLabelConfig(prev => {
            const defaultHeight = paperSize === 'A4' ? 52 : paperSize === 'A6' ? 45 : 22;
            const defaultWidth = paperSize === '35x22' ? 35 : 0;
            return {
                ...prev,
                labelHeight: prev.labelHeight || defaultHeight,
                labelWidth: prev.labelWidth !== undefined ? prev.labelWidth : defaultWidth
            };
        });
    }, [paperSize]);

    const scaleFactor = paperSize === 'A6' ? 1.0 : paperSize === 'A4' ? 1.09 : 2.72;
    const editorNameSize = (paperSize === 'A6' ? 24 : paperSize === 'A4' ? 18 : 8) * scaleFactor;
    const editorComboSize = (paperSize === 'A6' ? 28 : paperSize === 'A4' ? 22 : 12) * scaleFactor;
    const editorBarcodeWidth = (paperSize === 'A6' ? 2.0 : paperSize === 'A4' ? 1.4 : 1.0) * scaleFactor;
    const editorBarcodeHeight = (paperSize === 'A6' ? 100 : paperSize === 'A4' ? 70 : 25) * scaleFactor;
    const editorBarcodeFontSize = (paperSize === 'A6' ? 24 : paperSize === 'A4' ? 16 : 10) * scaleFactor;
    const editorHeight = `${(labelConfig.labelHeight || (paperSize === 'A4' ? 52 : paperSize === 'A6' ? 45 : 22)) * 4.58}px`;
    const editorWidth = labelConfig.labelWidth > 0 
        ? `${labelConfig.labelWidth * 4.58}px` 
        : (paperSize === 'A4' ? '360px' : paperSize === 'A6' ? '450px' : '360px');
    const editorPadding = (paperSize === 'A6' ? 5 : paperSize === 'A4' ? 11 : 5.5) * (labelConfig.labelMargin / 100);

    useEffect(() => {
        localStorage.setItem('lyangpos_label_config', JSON.stringify(labelConfig));
        labelConfigRef.current = labelConfig;
    }, [labelConfig]);

    useEffect(() => {
        localStorage.setItem('lyangpos_print_list', JSON.stringify(printList));
    }, [printList]);

    useEffect(() => {
        localStorage.setItem('lyangpos_hide_printed', hidePrinted);
    }, [hidePrinted]);

    const [savedTemplates, setSavedTemplates] = useState(() => {
        const saved = localStorage.getItem('lyangpos_saved_templates');
        if (saved) return JSON.parse(saved);
        return [
            {
                id: 'sys-a4-10',
                name: 'A4 - Mẫu mặc định (10 tem)',
                paperSize: 'A4',
                barcodeScale: 1.2,
                config: {
                    showName: true,
                    showCombo: true,
                    nameFontSize: 100,
                    comboFontSize: 100,
                    labelMargin: 100,
                    comboPosition: 'top-right',
                    nameFont: 'monospace',
                    comboFont: 'monospace',
                    nameX: 50,
                    nameY: 12,
                    barcodeX: 50,
                    barcodeY: 45,
                    comboX: 85,
                    comboY: 10,
                    prefix: 'SP',
                    a4Columns: 2,
                    a4Rows: 5,
                    labelHeight: 52,
                    labelWidth: 0,
                    a4MarginTop: 10,
                    a4MarginSide: 15,
                    labelGap: 4,
                    showBarcodeText: true
                }
            },
            {
                id: 'sys-a6-1',
                name: 'A6 - Mẫu mặc định',
                paperSize: 'A6',
                barcodeScale: 1.2,
                config: {
                    showName: true,
                    showCombo: true,
                    nameFontSize: 100,
                    comboFontSize: 100,
                    labelMargin: 100,
                    comboPosition: 'top-right',
                    nameFont: 'monospace',
                    comboFont: 'monospace',
                    nameX: 50,
                    nameY: 15,
                    barcodeX: 50,
                    barcodeY: 50,
                    comboX: 80,
                    comboY: 15,
                    prefix: 'SP',
                    a4Columns: 2,
                    a4Rows: 5,
                    labelHeight: 45,
                    labelWidth: 0,
                    a4MarginTop: 10,
                    a4MarginSide: 15,
                    labelGap: 4,
                    showBarcodeText: true
                }
            },
            {
                id: 'sys-roll-35x22',
                name: 'Cuộn - Mẫu mặc định (35x22)',
                paperSize: '35x22',
                barcodeScale: 0.8,
                config: {
                    showName: true,
                    showCombo: true,
                    nameFontSize: 90,
                    comboFontSize: 90,
                    labelMargin: 100,
                    comboPosition: 'top-right',
                    nameFont: 'monospace',
                    comboFont: 'monospace',
                    nameX: 50,
                    nameY: 15,
                    barcodeX: 50,
                    barcodeY: 55,
                    comboX: 80,
                    comboY: 15,
                    prefix: 'SP',
                    a4Columns: 2,
                    a4Rows: 5,
                    labelHeight: 22,
                    labelWidth: 35,
                    a4MarginTop: 10,
                    a4MarginSide: 15,
                    labelGap: 4,
                    showBarcodeText: true
                }
            }
        ];
    });

    const [newTemplateName, setNewTemplateName] = useState('');

    useEffect(() => {
        localStorage.setItem('lyangpos_saved_templates', JSON.stringify(savedTemplates));
    }, [savedTemplates]);

    const handleSaveTemplate = () => {
        if (!newTemplateName.trim()) {
            showToast('Vui lòng nhập tên mẫu tem!', 'error');
            return;
        }
        const newTpl = {
            id: 'tpl-' + Date.now(),
            name: newTemplateName.trim(),
            paperSize,
            barcodeScale,
            config: { ...labelConfig }
        };
        setSavedTemplates(prev => [...prev, newTpl]);
        setNewTemplateName('');
        showToast(`Đã lưu mẫu tem: ${newTpl.name}`);
    };

    const handleApplyTemplate = (tpl) => {
        setPaperSize(tpl.paperSize);
        setBarcodeScale(tpl.barcodeScale);
        setLabelConfig({
            ...tpl.config,
            barcodeWidthScale: tpl.config.barcodeWidthScale ?? 100,
            barcodeHeightScale: tpl.config.barcodeHeightScale ?? 100
        });
        showToast(`Đã áp dụng mẫu tem: ${tpl.name}`);
    };

    const handleDeleteTemplate = (id, name, e) => {
        e.stopPropagation();
        if (id.startsWith('sys-')) {
            showToast('Không thể xóa mẫu mặc định của hệ thống!', 'error');
            return;
        }
        if (window.confirm(`Bạn có chắc chắn muốn xóa mẫu tem "${name}"?`)) {
            setSavedTemplates(prev => prev.filter(t => t.id !== id));
            showToast(`Đã xóa mẫu tem: ${name}`);
        }
    };

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const updateConfig = (key, value) => {
        setLabelConfig(prev => ({ ...prev, [key]: value }));
    };

    const { data: products = [], isLoading } = useQuery({
        queryKey: ["products"],
        queryFn: async () => {
            const res = await axios.get("/api/products?type=All");
            return res.data;
        },
    });

    const generateBarcodeMutation = useMutation({
        mutationFn: async (params) => {
            const isCustom = params.product !== undefined;
            const product = isCustom ? params.product : params;
            let newBarcode = isCustom ? params.barcode : null;
            
            if (!newBarcode) {
                const prefix = labelConfigRef.current.prefix !== undefined ? labelConfigRef.current.prefix : 'SP';
                const randomLength = Math.max(2, 8 - prefix.length);
                
                let nextNum = 1;
                const prefixLower = prefix.toLowerCase();
                const existingNumbers = products
                    .map(p => {
                        const bc = p.barcode || p.code || "";
                        if (bc.toLowerCase().startsWith(prefixLower)) {
                            const numStr = bc.slice(prefix.length).split('-')[0];
                            const parsed = parseInt(numStr, 10);
                            return isNaN(parsed) ? null : parsed;
                        }
                        return null;
                    })
                    .filter(n => n !== null);
                    
                if (existingNumbers.length > 0) {
                    nextNum = Math.max(...existingNumbers) + 1;
                }
                
                const numStr = String(nextNum).padStart(randomLength, '0');
                newBarcode = prefix + numStr;
            }
            
            const res = await axios.put(`/api/products/${product.id}`, {
                ...product,
                barcode: newBarcode,
                code: product.code || newBarcode
            });
            return res.data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries(["products"]);
            showToast(`Đã tạo mã vạch thành công cho: ${data.name}`);
        },
        onError: () => {
            showToast('Lỗi khi sinh mã vạch', 'error');
        }
    });

    const deleteBarcodeMutation = useMutation({
        mutationFn: async (product) => {
            const res = await axios.put(`/api/products/${product.id}`, {
                ...product,
                barcode: "",
                code: ""
            });
            return res.data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries(["products"]);
        },
        onError: () => {
            showToast('Lỗi khi xóa mã vạch', 'error');
        }
    });

    const filteredProducts = useMemo(() => {
        let result = products;
        if (filterMode === 'has_code') {
            result = result.filter(p => p.barcode || p.code);
        } else if (filterMode === 'no_code') {
            result = result.filter(p => !p.barcode && !p.code);
        }
        
        if (!searchTerm) return result;
        const lower = searchTerm.toLowerCase();
        return result.filter(p => 
            (p.name && p.name.toLowerCase().includes(lower)) ||
            (p.code && p.code.toLowerCase().includes(lower)) ||
            (p.barcode && p.barcode.toLowerCase().includes(lower))
        );
    }, [searchTerm, products, filterMode]);

    const displayedProducts = useMemo(() => {
        if (displayLimit === 'all') return filteredProducts;
        return filteredProducts.slice(0, displayLimit);
    }, [filteredProducts, displayLimit]);

    const addToPrintList = (product, qtyToAdd = 1, comboQty = 1) => {
        const existing = printList.find(item => item.product.id === product.id && item.comboQty === comboQty);
        if (existing) {
            setPrintList(printList.map(item => 
                (item.product.id === product.id && item.comboQty === comboQty) ? { ...item, qty: item.qty + qtyToAdd, isPrinted: false } : item
            ));
        } else {
            setPrintList([...printList, { product, qty: qtyToAdd, comboQty, isPrinted: false }]);
        }
        showToast(`Đã thêm ${qtyToAdd} tem cho: ${product.name}`);
    };

    const updateQty = (productId, comboQty, newQty) => {
        if (newQty < 1) return;
        setPrintList(printList.map(item => 
            (item.product.id === productId && item.comboQty === comboQty) ? { ...item, qty: newQty } : item
        ));
    };

    const updateComboQty = (productId, oldComboQty, newComboQty) => {
        if (newComboQty < 1) return;
        // Check if there is already an item with the newComboQty
        const existing = printList.find(item => item.product.id === productId && item.comboQty === newComboQty);
        if (existing) {
            // merge them
            setPrintList(printList.filter(item => !(item.product.id === productId && item.comboQty === oldComboQty)).map(item => 
                (item.product.id === productId && item.comboQty === newComboQty) ? { ...item, qty: item.qty + (printList.find(x => x.product.id === productId && x.comboQty === oldComboQty)?.qty || 0) } : item
            ));
        } else {
            setPrintList(printList.map(item => 
                (item.product.id === productId && item.comboQty === oldComboQty) ? { ...item, comboQty: newComboQty } : item
            ));
        }
    };

    const removeFromPrintList = (productId, comboQty) => {
        const item = printList.find(item => item.product.id === productId && item.comboQty === comboQty);
        setPrintList(printList.filter(item => !(item.product.id === productId && item.comboQty === comboQty)));
        if (item) {
            showToast(`Đã xóa ${item.product.name} khỏi danh sách chờ in`, 'info');
        }
    };

    const addPOSCommandsToPrintList = () => {
        const commandItems = [
            {
                product: {
                    id: "cmd-thanhtoan",
                    name: "LỆNH: THANH TOÁN & IN",
                    code: "THANHTOAN",
                    barcode: "THANHTOAN",
                    sale_price: 0,
                    unit: "Lệnh"
                },
                qty: 1,
                comboQty: 1,
                isPrinted: false
            },
            {
                product: {
                    id: "cmd-luudon",
                    name: "LỆNH: LƯU ĐƠN (KHÔNG IN)",
                    code: "LUUDON",
                    barcode: "LUUDON",
                    sale_price: 0,
                    unit: "Lệnh"
                },
                qty: 1,
                comboQty: 1,
                isPrinted: false
            }
        ];
        setPrintList(prev => {
            const filtered = prev.filter(item => item.product.id !== "cmd-thanhtoan" && item.product.id !== "cmd-luudon");
            return [...filtered, ...commandItems];
        });
        showToast("Đã thêm 2 nhãn lệnh POS vào danh sách chờ in!");
    };

    const [selectedProductIds, setSelectedProductIds] = useState([]);
    const toggleSelectProduct = (id) => {
        setSelectedProductIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };
    
    const handleBatchGenerate = async () => {
        const withoutCode = products.filter(p => selectedProductIds.includes(p.id) && !p.barcode && !p.code);
        if (withoutCode.length === 0) {
            showToast('Tất all sản phẩm đã chọn đều đã có mã vạch!', 'info');
            return;
        }
        
        const prefix = labelConfigRef.current.prefix !== undefined ? labelConfigRef.current.prefix : 'SP';
        const randomLength = Math.max(2, 8 - prefix.length);
        
        let nextNum = 1;
        const prefixLower = prefix.toLowerCase();
        const existingNumbers = products
            .map(p => {
                const bc = p.barcode || p.code || "";
                if (bc.toLowerCase().startsWith(prefixLower)) {
                    const numStr = bc.slice(prefix.length).split('-')[0];
                    const parsed = parseInt(numStr, 10);
                    return isNaN(parsed) ? null : parsed;
                }
                return null;
            })
            .filter(n => n !== null);
            
        if (existingNumbers.length > 0) {
            nextNum = Math.max(...existingNumbers) + 1;
        }

        setSelectedProductIds([]);
        showToast(`Đang sinh mã vạch tăng dần cho ${withoutCode.length} sản phẩm...`);

        for (let i = 0; i < withoutCode.length; i++) {
            const p = withoutCode[i];
            const numStr = String(nextNum).padStart(randomLength, '0');
            const newBarcode = prefix + numStr;
            nextNum++;
            
            await generateBarcodeMutation.mutateAsync({ product: p, barcode: newBarcode });
        }
    };

    const handleBatchDelete = () => {
        const hasCode = products.filter(p => selectedProductIds.includes(p.id) && (p.barcode || p.code));
        if (hasCode.length === 0) {
            showToast('Không có sản phẩm nào có mã vạch để xóa!', 'info');
            return;
        }
        if (window.confirm(`Bạn có chắc chắn muốn xóa mã vạch của ${hasCode.length} sản phẩm đã chọn?`)) {
            hasCode.forEach(p => deleteBarcodeMutation.mutate(p));
            setSelectedProductIds([]);
            showToast(`Đang xóa mã vạch của ${hasCode.length} sản phẩm...`);
        }
    };

    const activePrintList = hidePrinted 
        ? printList.filter(item => !item.isPrinted) 
        : printList;

    const handlePrint = () => {
        window.print();
        // Mark all printed items
        setPrintList(prev => {
            const updated = prev.map(item => {
                const shouldMarkPrinted = hidePrinted ? !item.isPrinted : true;
                if (shouldMarkPrinted) {
                    return { ...item, isPrinted: true };
                }
                return item;
            });
            return updated;
        });
        showToast("Đã gửi lệnh in và đánh dấu tem đã in!");
    };

    const totalLabels = activePrintList.reduce((acc, item) => acc + item.qty, 0);

    return (
        <div className="flex flex-col h-screen bg-transparent select-none font-sans text-primary">
            {/* Toast Notification */}
            <AnimatePresence>
                {toast && (
                    <motion.div
                        initial={{ opacity: 0, y: -50, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -20, scale: 0.9 }}
                        className={cn(
                            "fixed top-4 left-1/2 -translate-x-1/2 z-[9999] px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 font-bold text-sm backdrop-blur-md border border-white/20",
                            toast.type === 'error' ? "bg-rose-500/90 text-white" : 
                            toast.type === 'info' ? "bg-blue-600/90 text-white" : "bg-emerald-600/90 text-white"
                        )}
                    >
                        <CheckCircle size={18} />
                        <span>{toast.message}</span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* NO-PRINT UI */}
            <div className="no-print flex-1 flex flex-col p-6 overflow-hidden max-w-[1600px] mx-auto w-full">
                <style dangerouslySetInnerHTML={{__html: `
                    .barcode-wrapper {
                        position: absolute !important;
                        left: ${labelConfig.barcodeX}% !important;
                        top: ${labelConfig.barcodeY}% !important;
                        transform: translateX(-50%) !important;
                        width: ${(labelConfig.barcodeWidthScale ?? 100) * 0.85}% !important;
                        max-width: 98% !important;
                        box-sizing: border-box !important;
                    }
                    .barcode-wrapper svg,
                    .designer-barcode-wrapper svg {
                        max-width: 100% !important;
                        width: 100% !important;
                        display: block !important;
                        margin: 0 auto !important;
                    }
                `}} />
                
                {/* Premium Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-6 shrink-0 py-2">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-primary/10 dark:bg-emerald-500/20 rounded-2xl flex items-center justify-center border border-primary/20 dark:border-emerald-500/30">
                            <Box size={24} className="text-primary dark:text-emerald-400" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black uppercase tracking-tight text-primary dark:text-[#d4a574]">
                                Tạo & In Mã Vạch
                            </h1>
                            <div className="flex items-center gap-2 mt-0.5">
                                <span className="px-2 py-0.5 bg-primary/10 text-primary dark:bg-emerald-500/10 dark:text-emerald-400 text-[9px] font-black uppercase rounded-lg tracking-wider border border-primary/10">LyangPOS Premium</span>
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500">Quản lý, tạo và in tem nhãn theo chuẩn chất lượng cao</p>
                            </div>
                        </div>
                    </div>
                    
                    {/* Header Controls */}
                    <div className="flex items-center flex-wrap gap-4 w-full md:w-auto">

                        <select 
                            value={paperSize}
                            onChange={(e) => setPaperSize(e.target.value)}
                            className="bg-white/50 dark:bg-slate-950/60 border border-white/30 dark:border-white/10 rounded-xl px-4 py-2.5 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 text-xs font-bold dark:text-white cursor-pointer transition-all"
                        >
                            <option value="A4" className="dark:bg-slate-900">Khổ A4 (Giấy Tomy / Cắt tay)</option>
                            <option value="A6" className="dark:bg-slate-900">Khổ A6 (In đơn lớn)</option>
                            <option value="35x22" className="dark:bg-slate-900">Cuộn in tem (35x22mm)</option>
                        </select>
                        
                        <motion.button 
                            whileHover={{ y: -2 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handlePrint}
                            disabled={activePrintList.length === 0}
                            className="bg-primary text-white dark:bg-emerald-600 hover:bg-primary/95 dark:hover:bg-emerald-500 px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/20 dark:shadow-emerald-950/20"
                        >
                            <Printer size={16} strokeWidth={2.5} />
                            In {totalLabels} tem
                        </motion.button>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 flex gap-6 min-h-0">
                    
                    {/* Left Panel: Search and Add Products */}
                    <div className="w-1/3 flex flex-col bg-white/20 dark:bg-black/20 backdrop-blur-xl rounded-3xl border border-white/20 dark:border-white/5 overflow-hidden shadow-sm">
                        <div className="p-4 border-b border-white/20 dark:border-white/5 space-y-3 shrink-0">
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={18} />
                                <input 
                                    ref={searchInputRef}
                                    type="text"
                                    placeholder="Tìm kiếm sản phẩm để tạo mã..."
                                    onChange={handleSearchChange}
                                    className="w-full pl-11 pr-4 py-3 bg-white/40 dark:bg-slate-950/40 border border-white/30 dark:border-white/10 rounded-2xl outline-none focus:border-primary dark:focus:border-emerald-500/50 dark:text-white transition-all font-semibold text-sm placeholder:font-medium"
                                />
                            </div>

                            {/* Filter Mode Selector */}
                            <div className="grid grid-cols-3 gap-1 p-1 bg-white/40 dark:bg-slate-950/40 rounded-xl border border-white/20 dark:border-white/5">
                                <button
                                    onClick={() => setFilterMode('all')}
                                    className={cn(
                                        "py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all",
                                        filterMode === 'all' 
                                            ? "bg-primary text-white dark:bg-emerald-600 shadow-md"
                                            : "text-slate-500 hover:bg-white/30 dark:hover:bg-slate-900/30"
                                    )}
                                >
                                    Tất cả
                                </button>
                                <button
                                    onClick={() => setFilterMode('has_code')}
                                    className={cn(
                                        "py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all",
                                        filterMode === 'has_code' 
                                            ? "bg-primary text-white dark:bg-emerald-600 shadow-md"
                                            : "text-slate-500 hover:bg-white/30 dark:hover:bg-slate-900/30"
                                    )}
                                >
                                    Đã có mã
                                </button>
                                <button
                                    onClick={() => setFilterMode('no_code')}
                                    className={cn(
                                        "py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all",
                                        filterMode === 'no_code' 
                                            ? "bg-primary text-white dark:bg-emerald-600 shadow-md"
                                            : "text-slate-500 hover:bg-white/30 dark:hover:bg-slate-900/30"
                                    )}
                                >
                                    Chưa có mã
                                </button>
                            </div>

                            {/* Limit Selector */}
                            <div className="flex items-center justify-between px-1 text-xs">
                                <span className="font-bold text-slate-500 dark:text-slate-400">Số lượng hiển thị:</span>
                                <div className="flex gap-1 bg-white/35 dark:bg-slate-950/35 p-0.5 rounded-lg border border-white/20 dark:border-white/5">
                                    <button
                                        onClick={() => setDisplayLimit(10)}
                                        className={cn(
                                            "px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider transition-all",
                                            displayLimit === 10 
                                                ? "bg-primary text-white dark:bg-emerald-600 shadow-md"
                                                : "text-slate-500 hover:bg-white/35 dark:hover:bg-slate-900/30"
                                        )}
                                    >
                                        10
                                    </button>
                                    <button
                                        onClick={() => setDisplayLimit('all')}
                                        className={cn(
                                            "px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider transition-all",
                                            displayLimit === 'all' 
                                                ? "bg-primary text-white dark:bg-emerald-600 shadow-md"
                                                : "text-slate-500 hover:bg-white/35 dark:hover:bg-slate-900/30"
                                        )}
                                    >
                                        Tất cả
                                    </button>
                                </div>
                            </div>
                            
                            <div className="flex items-center justify-between px-1">
                                <label className="flex items-center gap-2.5 cursor-pointer text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-primary transition-colors">
                                    <input 
                                        type="checkbox"
                                        checked={displayedProducts.length > 0 && displayedProducts.every(p => selectedProductIds.includes(p.id))}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                setSelectedProductIds(prev => {
                                                    const newIds = [...prev];
                                                    displayedProducts.forEach(p => {
                                                        if (!newIds.includes(p.id)) newIds.push(p.id);
                                                    });
                                                    return newIds;
                                                });
                                            } else {
                                                setSelectedProductIds(prev => prev.filter(id => !displayedProducts.some(p => p.id === id)));
                                            }
                                        }}
                                        className="w-4 h-4 accent-primary rounded cursor-pointer"
                                    />
                                    Chọn tất cả ({selectedProductIds.length})
                                </label>
                                
                                {selectedProductIds.length > 0 && (
                                    <div className="flex items-center gap-1.5">
                                        <motion.button 
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={handleBatchGenerate}
                                            disabled={generateBarcodeMutation.isPending}
                                            className="text-[10px] bg-primary/10 text-primary dark:bg-emerald-600/20 dark:text-emerald-400 px-3 py-1.5 rounded-xl font-black uppercase tracking-wider hover:bg-primary/20 transition-all flex items-center gap-1.5 border border-primary/10"
                                            title="Sinh mã hàng loạt"
                                        >
                                            <RefreshCw size={12} className={cn("stroke-[2.5]", generateBarcodeMutation.isPending && "animate-spin")} />
                                            Sinh mã
                                        </motion.button>
                                        <motion.button 
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={handleBatchDelete}
                                            disabled={deleteBarcodeMutation.isPending}
                                            className="text-[10px] bg-rose-500/10 text-rose-500 px-3 py-1.5 rounded-xl font-black uppercase tracking-wider hover:bg-rose-500/20 transition-all flex items-center gap-1.5 border border-rose-500/10"
                                            title="Xóa mã hàng loạt"
                                        >
                                            <Trash2 size={12} className={cn("stroke-[2.5]", deleteBarcodeMutation.isPending && "animate-spin")} />
                                            Xóa mã
                                        </motion.button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* List Results */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
                            {isLoading ? (
                                <div className="h-40 flex items-center justify-center text-slate-400 font-bold text-sm">
                                    <RefreshCw className="animate-spin mr-2" size={18} />
                                    Đang tải danh sách sản phẩm...
                                </div>
                            ) : displayedProducts.length > 0 ? (
                                <AnimatePresence>
                                    {displayedProducts.map(p => {
                                        const code = p.barcode || p.code;
                                        const hasCode = !!code;
                                        const isSelected = selectedProductIds.includes(p.id);
                                        
                                        return (
                                            <motion.div 
                                                layout
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                key={p.id} 
                                                className={cn(
                                                    "flex items-center justify-between p-3.5 rounded-2xl bg-white/40 dark:bg-slate-900/30 hover:bg-white/80 dark:hover:bg-slate-900/60 border border-white/30 dark:border-white/5 group transition-all duration-300 shadow-sm",
                                                    isSelected && "border-primary/30 bg-primary/5 dark:bg-emerald-500/5"
                                                )}
                                            >
                                                <div className="flex items-start gap-3 flex-1 min-w-0">
                                                    <input 
                                                        type="checkbox"
                                                        checked={isSelected}
                                                        onChange={() => toggleSelectProduct(p.id)}
                                                        className="mt-1 w-4 h-4 accent-primary rounded cursor-pointer"
                                                    />
                                                    <div className="min-w-0 flex-1">
                                                        <h3 className="font-black text-slate-800 dark:text-white text-sm truncate uppercase tracking-tight">{p.name}</h3>
                                                        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
                                                            {code ? (
                                                                <span className="font-mono bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 px-2 py-0.5 rounded font-black tracking-wider border border-emerald-500/10">{code}</span>
                                                            ) : (
                                                                <span className="text-rose-500 font-bold bg-rose-500/5 px-2 py-0.5 rounded border border-rose-500/10 uppercase text-[9px] tracking-wider">Chưa có mã</span>
                                                            )}
                                                            {!hasCode && (
                                                                <button 
                                                                    onClick={(e) => { e.stopPropagation(); generateBarcodeMutation.mutate(p); }}
                                                                    disabled={generateBarcodeMutation.isPending}
                                                                    className="flex items-center gap-1 text-[9px] bg-primary text-white px-2.5 py-0.5 rounded-full hover:bg-primary/95 transition-all font-bold uppercase tracking-wider"
                                                                >
                                                                    <RefreshCw size={10} className={generateBarcodeMutation.isPending ? "animate-spin" : ""} />
                                                                    Tạo mã
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex gap-1.5 ml-2 shrink-0 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-all duration-300">
                                                    {['1', '2', '5', '10'].map(num => (
                                                        <button 
                                                            key={num}
                                                            onClick={() => addToPrintList(p, 1, parseInt(num))} 
                                                            disabled={!hasCode} 
                                                            className="px-2 py-1 text-[10px] font-black bg-white dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-primary dark:text-emerald-400 rounded-lg hover:bg-primary hover:text-white dark:hover:bg-emerald-600 dark:hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                                                        >
                                                            +{num}
                                                        </button>
                                                    ))}
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </AnimatePresence>
                            ) : (
                                <div className="text-center p-8 text-slate-500 text-xs font-semibold">Không tìm thấy sản phẩm phù hợp.</div>
                            )}
                        </div>
                    </div>

                    {/* Right Panel: Print Queue & Settings tabs */}
                    <div className="w-2/3 bg-white/20 dark:bg-black/20 backdrop-blur-xl rounded-3xl border border-white/20 dark:border-white/5 overflow-hidden flex flex-col shadow-sm">
                        
                        {/* Tab Switcher */}
                        <div className="flex border-b border-white/20 dark:border-white/5 bg-white/10 dark:bg-slate-900/10 p-2 gap-2 shrink-0">
                            <button 
                                onClick={() => setActiveTab('list')}
                                className={cn(
                                    "flex-1 py-3 px-4 text-xs font-black uppercase tracking-wider rounded-2xl transition-all flex justify-center items-center gap-2",
                                    activeTab === 'list' 
                                        ? 'bg-primary text-white dark:bg-emerald-600 shadow-md' 
                                        : 'text-slate-500 dark:text-slate-400 hover:bg-white/40 dark:hover:bg-slate-900/20'
                                )}
                            >
                                <List size={14} strokeWidth={2.5} />
                                Danh sách chờ in
                                <span className={cn(
                                    "px-2 py-0.5 rounded-full text-[10px] ml-1 font-black",
                                    activeTab === 'list' ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                                )}>
                                    {activePrintList.length}
                                </span>
                            </button>
                            <button 
                                onClick={() => setActiveTab('config')}
                                className={cn(
                                    "flex-1 py-3 px-4 text-xs font-black uppercase tracking-wider rounded-2xl transition-all flex justify-center items-center gap-2",
                                    activeTab === 'config' 
                                        ? 'bg-primary text-white dark:bg-emerald-600 shadow-md' 
                                        : 'text-slate-500 dark:text-slate-400 hover:bg-white/40 dark:hover:bg-slate-900/20'
                                )}
                            >
                                <Sliders size={14} strokeWidth={2.5} />
                                Tùy chỉnh tem in
                            </button>
                        </div>
                        
                        {/* Queue Tab Content */}
                        {activeTab === 'list' ? (
                            <>
                                {printList.length > 0 && (
                                    <div className="px-6 py-3 flex flex-wrap justify-between items-center gap-2 border-b border-white/10 dark:border-white/5 shrink-0 bg-white/10">
                                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Có {activePrintList.length} mặt hàng ({totalLabels} tem in)</span>
                                        <div className="flex items-center gap-3">
                                            <label className="flex items-center gap-1.5 cursor-pointer select-none">
                                                <input 
                                                    type="checkbox" 
                                                    checked={hidePrinted} 
                                                    onChange={e => setHidePrinted(e.target.checked)}
                                                    className="w-3.5 h-3.5 rounded border-slate-300 text-primary focus:ring-primary bg-transparent"
                                                />
                                                <span className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-wider">Ẩn đã in</span>
                                            </label>
                                            
                                            {printList.some(item => item.isPrinted) && (
                                                <button 
                                                    onClick={() => {
                                                        setPrintList(printList.filter(item => !item.isPrinted));
                                                        showToast("Đã dọn dẹp các tem đã in!");
                                                    }} 
                                                    className="text-[10px] font-black text-emerald-500 hover:text-emerald-600 dark:text-emerald-400 uppercase tracking-wider"
                                                >
                                                    Dọn tem đã in
                                                </button>
                                            )}

                                            <button 
                                                onClick={addPOSCommandsToPrintList} 
                                                className="text-[10px] font-black text-primary hover:text-primary/80 dark:text-emerald-400 dark:hover:text-emerald-300 uppercase tracking-wider"
                                            >
                                                + Mã lệnh POS
                                            </button>

                                            <button 
                                                onClick={() => setPrintList([])} 
                                                className="text-[10px] font-black text-rose-500 hover:text-rose-600 uppercase tracking-wider"
                                            >
                                                Xóa toàn bộ
                                            </button>
                                        </div>
                                    </div>
                                )}
                                <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3">
                                    {activePrintList.length === 0 ? (
                                        <div className="h-full flex flex-col items-center justify-center text-slate-400/80 space-y-4">
                                            <div className="w-16 h-16 bg-white/20 dark:bg-slate-800/30 rounded-full flex items-center justify-center border border-white/20">
                                                <Printer size={28} className="opacity-30" />
                                            </div>
                                            <p className="text-xs font-bold uppercase tracking-wider">Chưa chọn sản phẩm nào để in tem</p>
                                            <button
                                                onClick={addPOSCommandsToPrintList}
                                                className="mt-2 text-xs font-black uppercase tracking-wider bg-primary/10 hover:bg-primary/20 dark:bg-emerald-600/20 dark:hover:bg-emerald-600/35 text-primary dark:text-emerald-400 border border-primary/20 dark:border-emerald-500/20 px-4 py-2 rounded-xl transition-all"
                                            >
                                                Tạo nhanh Mã lệnh POS (Thanh toán / Lưu)
                                            </button>
                                        </div>
                                    ) : (
                                        <AnimatePresence>
                                            {activePrintList.map((item, index) => (
                                                <motion.div 
                                                    initial={{ opacity: 0, y: 12 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, scale: 0.96 }}
                                                    key={`${item.product.id}-${item.comboQty || 1}-${index}`} 
                                                    className="flex flex-col md:flex-row items-center gap-4 p-4 rounded-2xl border border-white/30 dark:border-white/5 bg-white/40 dark:bg-slate-900/20 backdrop-blur-sm shadow-sm"
                                                >
                                                    {/* Visual Preview */}
                                                    <div className="w-48 bg-white p-2 rounded-xl flex justify-center border border-slate-200/60 shadow-sm shrink-0">
                                                        <Barcode 
                                                            value={item.comboQty > 1 ? `${item.product.barcode || item.product.code}-${item.comboQty}` : (item.product.barcode || item.product.code)} 
                                                            width={1.4 * ((labelConfig.barcodeWidthScale ?? 100) / 100) * getBarcodeScaleFactor(item.comboQty > 1 ? `${item.product.barcode || item.product.code}-${item.comboQty}` : (item.product.barcode || item.product.code))} 
                                                            height={38} 
                                                            fontSize={11}
                                                            margin={0}
                                                            displayValue={labelConfig.showBarcodeText !== false}
                                                            background="transparent"
                                                            lineColor="#000000"
                                                        />
                                                    </div>
                                                    
                                                    <div className="flex-1 min-w-0 text-center md:text-left">
                                                        <div className="flex items-center gap-2 justify-center md:justify-start">
                                                            <h3 className="font-black text-slate-800 dark:text-white uppercase tracking-tight text-sm truncate">{item.product.name}</h3>
                                                            {item.isPrinted && (
                                                                <span className="text-[9px] bg-slate-500/15 text-slate-600 dark:text-slate-400 px-1.5 py-0.5 rounded font-black uppercase">Đã in</span>
                                                            )}
                                                        </div>
                                                        <p className="text-xs font-bold text-primary dark:text-[#d4a574] mt-0.5">Đơn giá: {item.product.sale_price?.toLocaleString('vi-VN')} VNĐ</p>
                                                     </div>
                                                    
                                                    {/* Controls (Qty / Combo Qty) */}
                                                    <div className="flex items-center gap-4 shrink-0 flex-wrap justify-center">
                                                        <div className="flex flex-col items-center">
                                                            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider">Số Combo (x2, x5...)</span>
                                                            <div className="flex items-center bg-white/60 dark:bg-slate-950/40 rounded-xl border border-white/40 dark:border-white/10 overflow-hidden shadow-sm">
                                                                <button 
                                                                    onClick={() => updateComboQty(item.product.id, item.comboQty, (item.comboQty || 1) - 1)}
                                                                    className="px-2.5 py-1.5 hover:bg-white/80 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300 font-bold"
                                                                >-</button>
                                                                <input 
                                                                    type="number"
                                                                    value={item.comboQty || 1}
                                                                    onChange={e => updateComboQty(item.product.id, item.comboQty, parseInt(e.target.value) || 1)}
                                                                    className="w-10 text-center bg-transparent outline-none dark:text-white font-black text-xs text-primary dark:text-emerald-400"
                                                                    min="1"
                                                                />
                                                                <button 
                                                                    onClick={() => updateComboQty(item.product.id, item.comboQty, (item.comboQty || 1) + 1)}
                                                                    className="px-2.5 py-1.5 hover:bg-white/80 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300 font-bold"
                                                                >+</button>
                                                            </div>
                                                        </div>
                                                        
                                                        <div className="flex flex-col items-center ml-2 border-l border-white/20 dark:border-white/5 pl-4">
                                                            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider">Số lượng tem in</span>
                                                            <div className="flex items-center bg-white/60 dark:bg-slate-950/40 rounded-xl border border-white/40 dark:border-white/10 overflow-hidden shadow-sm">
                                                                <button 
                                                                    onClick={() => updateQty(item.product.id, item.comboQty, item.qty - 1)}
                                                                    className="px-3 py-1.5 hover:bg-white/80 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300 font-bold"
                                                                >-</button>
                                                                <input 
                                                                    type="number"
                                                                    value={item.qty}
                                                                    onChange={e => updateQty(item.product.id, item.comboQty, parseInt(e.target.value) || 1)}
                                                                    className="w-12 text-center bg-transparent outline-none dark:text-white font-black text-xs text-primary dark:text-emerald-400"
                                                                    min="1"
                                                                />
                                                                <button 
                                                                    onClick={() => updateQty(item.product.id, item.comboQty, item.qty + 1)}
                                                                    className="px-3 py-1.5 hover:bg-white/80 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300 font-bold"
                                                                >+</button>
                                                            </div>
                                                        </div>
                                                        
                                                        <button 
                                                            onClick={() => removeFromPrintList(item.product.id, item.comboQty)}
                                                            className="p-2.5 text-rose-500 hover:bg-rose-500/10 rounded-xl ml-2 transition-colors self-end mt-4 md:mt-0"
                                                        >
                                                            <Trash2 size={18} strokeWidth={2.5} />
                                                        </button>
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </AnimatePresence>
                                    )}
                                </div>
                            </>
                        ) : (
                            /* Config Tab Content */
<div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
                                
                                {/* Live Preview Panel */}
                                <div className="bg-white/10 dark:bg-slate-900/10 rounded-3xl p-5 border border-white/20 dark:border-white/5 space-y-4">
                                    <h3 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-2">
                                        <Eye size={14} className="text-emerald-500" strokeWidth={3} /> Thiết kế tem trực quan & Bản xem trước
                                    </h3>
                                    
                                    <div className="flex flex-col lg:flex-row gap-6 items-stretch">
                                        {/* Left Side: Drag-and-Drop Designer Canvas */}
                                        <div className="flex-1 bg-slate-100/50 dark:bg-slate-950/40 rounded-2xl border border-slate-200 dark:border-slate-800/40 p-6 flex flex-col items-center justify-center min-h-[350px]">
                                            {(() => {
                                                const previewName = activePrintList.length > 0 ? activePrintList[0].product.name : "Tên Sản Phẩm Demo";
                                                const previewBarcode = activePrintList.length > 0 
                                                    ? (activePrintList[0].comboQty > 1 ? `${activePrintList[0].product.barcode || activePrintList[0].product.code}-${activePrintList[0].comboQty}` : (activePrintList[0].product.barcode || activePrintList[0].product.code)) 
                                                    : "893123456789";
                                                const previewCombo = activePrintList.length > 0 ? `x${activePrintList[0].comboQty || 1}` : "x5";

                                                const cols = labelConfig.a4Columns || 2;
                                                const rows = labelConfig.a4Rows || 5;
                                                const gap = labelConfig.labelGap !== undefined ? labelConfig.labelGap : 4;
                                                const marginTop = labelConfig.a4MarginTop !== undefined ? labelConfig.a4MarginTop : 10;
                                                const marginSide = labelConfig.a4MarginSide !== undefined ? labelConfig.a4MarginSide : 15;
                                                const mmToPx = (mm) => mm * 3.78;
                                                
                                                let labelWidthMm = labelConfig.labelWidth;
                                                let labelHeightMm = labelConfig.labelHeight;
                                                
                                                if (paperSize === 'A4') {
                                                    labelWidthMm = labelConfig.labelWidth > 0 ? labelConfig.labelWidth : (210 - marginSide * 2 - (cols - 1) * gap) / cols;
                                                    labelHeightMm = labelConfig.labelHeight > 0 ? labelConfig.labelHeight : (295 - marginTop * 2 - (rows - 1) * gap) / rows;
                                                } else if (paperSize === 'A6') {
                                                    labelWidthMm = labelConfig.labelWidth > 0 ? labelConfig.labelWidth : 105;
                                                    labelHeightMm = labelConfig.labelHeight > 0 ? labelConfig.labelHeight : 148;
                                                } else { // 35x22 Roll
                                                    labelWidthMm = labelConfig.labelWidth > 0 ? labelConfig.labelWidth : 35;
                                                    labelHeightMm = labelConfig.labelHeight > 0 ? labelConfig.labelHeight : 22;
                                                }

                                                const actualWidthPx = mmToPx(labelWidthMm);
                                                const actualHeightPx = mmToPx(labelHeightMm);

                                                const renderA4Preview = () => (
                                                    <div 
                                                        className="relative"
                                                        style={{
                                                            width: '397px',
                                                            height: '557.5px',
                                                        }}
                                                    >
                                                        <div 
                                                            className="bg-white shadow-2xl relative overflow-hidden transition-all duration-300 rounded-xl border border-emerald-500/30"
                                                            style={{
                                                                width: '794px',
                                                                height: '1115px',
                                                                transform: 'scale(0.5)',
                                                                transformOrigin: 'top left',
                                                                position: 'absolute',
                                                                left: 0,
                                                                top: 0,
                                                                boxSizing: 'border-box',
                                                                padding: `${marginTop}mm ${marginSide}mm`
                                                            }}
                                                        >
                                                            <div 
                                                                className="grid w-full h-full justify-start align-content-start"
                                                                style={{
                                                                    gridTemplateColumns: `repeat(${cols}, ${actualWidthPx}px)`,
                                                                    gridTemplateRows: `repeat(${rows}, ${actualHeightPx}px)`,
                                                                    gap: `${gap}mm`
                                                                }}
                                                            >
                                                                {Array.from({ length: cols * rows }).map((_, i) => (
                                                                    <div 
                                                                        key={i} 
                                                                        className="border border-slate-200 bg-white rounded relative overflow-hidden"
                                                                        style={{
                                                                            width: `${actualWidthPx}px`,
                                                                            height: `${actualHeightPx}px`,
                                                                            padding: `${10 * (labelConfig.labelMargin / 100)}px`,
                                                                            boxSizing: 'border-box'
                                                                        }}
                                                                    >
                                                                        {labelConfig.showName && (
                                                                            <span 
                                                                                className="barcode-product-name"
                                                                                style={{
                                                                                    position: 'absolute',
                                                                                    left: `${labelConfig.nameX}%`,
                                                                                    top: `${labelConfig.nameY}%`,
                                                                                    transform: 'translateX(-50%)',
                                                                                    fontSize: `${18 * (labelConfig.nameFontSize / 100)}px`,
                                                                                    fontFamily: labelConfig.nameFont || 'monospace',
                                                                                    fontWeight: 'bold',
                                                                                    color: 'black',
                                                                                    whiteSpace: 'nowrap',
                                                                                    overflow: 'hidden',
                                                                                    textOverflow: 'ellipsis',
                                                                                    display: 'block',
                                                                                    maxWidth: '95%'
                                                                                }}
                                                                            >
                                                                                {previewName}
                                                                            </span>
                                                                        )}
                                                                        <div className="barcode-wrapper">
                                                                            <div className="bg-white p-[2px] rounded">
                                                                                <Barcode 
                                                                                    value={previewBarcode} 
                                                                                    width={1.4 * barcodeScale * ((labelConfig.barcodeWidthScale ?? 100) / 100) * getBarcodeScaleFactor(previewBarcode)} 
                                                                                    height={70 * barcodeScale * ((labelConfig.barcodeHeightScale ?? 100) / 100)} 
                                                                                    fontSize={16 * barcodeScale}
                                                                                    margin={0}
                                                                                    displayValue={labelConfig.showBarcodeText !== false}
                                                                                    background="transparent"
                                                                                    lineColor="black"
                                                                                    preserveAspectRatio="none"
                                                                                />
                                                                            </div>
                                                                        </div>
                                                                        {labelConfig.showCombo && (
                                                                            <span 
                                                                                className="barcode-price"
                                                                                style={{
                                                                                    position: 'absolute',
                                                                                    left: `${labelConfig.comboX}%`,
                                                                                    top: `${labelConfig.comboY}%`,
                                                                                    fontSize: `${22 * (labelConfig.comboFontSize / 100)}px`,
                                                                                    fontWeight: '900',
                                                                                    fontFamily: labelConfig.comboFont || 'monospace',
                                                                                    color: 'black',
                                                                                    whiteSpace: 'nowrap',
                                                                                    backgroundColor: 'rgba(0,0,0,0.05)',
                                                                                    padding: '1px 3px',
                                                                                    borderRadius: '4px'
                                                                                }}
                                                                            >
                                                                                {previewCombo}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );

                                                const renderOtherPreview = () => {
                                                    const aspect = labelWidthMm / labelHeightMm;
                                                    const previewH = 220;
                                                    const previewW = previewH * aspect;
                                                    
                                                    return (
                                                        <div 
                                                            className="bg-white shadow-2xl relative overflow-hidden transition-all duration-300 rounded-xl border border-emerald-500/30"
                                                            style={{
                                                                width: `${previewW}px`,
                                                                height: `${previewH}px`,
                                                                boxSizing: 'border-box',
                                                                padding: `${10 * (labelConfig.labelMargin / 100) * (previewW / actualWidthPx)}px`
                                                            }}
                                                        >
                                                            {labelConfig.showName && (
                                                                <span 
                                                                    className="barcode-product-name"
                                                                    style={{
                                                                        position: 'absolute',
                                                                        left: `${labelConfig.nameX}%`,
                                                                        top: `${labelConfig.nameY}%`,
                                                                        transform: 'translateX(-50%)',
                                                                        fontSize: `${18 * (labelConfig.nameFontSize / 100) * (previewW / actualWidthPx)}px`,
                                                                        fontFamily: labelConfig.nameFont || 'monospace',
                                                                        fontWeight: 'bold',
                                                                        color: 'black',
                                                                        whiteSpace: 'nowrap',
                                                                        overflow: 'hidden',
                                                                        textOverflow: 'ellipsis',
                                                                        display: 'block',
                                                                        maxWidth: '95%'
                                                                    }}
                                                                >
                                                                    {previewName}
                                                                </span>
                                                            )}
                                                            <div 
                                                                className="barcode-wrapper"
                                                                style={{ 
                                                                    position: 'absolute',
                                                                    left: `${labelConfig.barcodeX}%`,
                                                                    top: `${labelConfig.barcodeY}%`,
                                                                    transform: 'translateX(-50%)'
                                                                }}
                                                            >
                                                                <div className="bg-white p-[2px] rounded">
                                                                    <Barcode 
                                                                        value={previewBarcode} 
                                                                        width={1.4 * barcodeScale * ((labelConfig.barcodeWidthScale ?? 100) / 100) * getBarcodeScaleFactor(previewBarcode) * (previewW / actualWidthPx)} 
                                                                        height={70 * barcodeScale * ((labelConfig.barcodeHeightScale ?? 100) / 100) * (previewW / actualWidthPx)} 
                                                                        fontSize={16 * barcodeScale * (previewW / actualWidthPx)}
                                                                        margin={0}
                                                                        displayValue={labelConfig.showBarcodeText !== false}
                                                                        background="transparent"
                                                                        lineColor="black"
                                                                        preserveAspectRatio="none"
                                                                    />
                                                                </div>
                                                            </div>
                                                            {labelConfig.showCombo && (
                                                                <span 
                                                                    className="barcode-price"
                                                                    style={{
                                                                        position: 'absolute',
                                                                        left: `${labelConfig.comboX}%`,
                                                                        top: `${labelConfig.comboY}%`,
                                                                        fontSize: `${22 * (labelConfig.comboFontSize / 100) * (previewW / actualWidthPx)}px`,
                                                                        fontWeight: '900',
                                                                        fontFamily: labelConfig.comboFont || 'monospace',
                                                                        color: 'black',
                                                                        whiteSpace: 'nowrap',
                                                                        backgroundColor: 'rgba(0,0,0,0.05)',
                                                                        padding: '1px 3px',
                                                                        borderRadius: '4px'
                                                                    }}
                                                                >
                                                                    {previewCombo}
                                                                </span>
                                                            )}
                                                        </div>
                                                    );
                                                };

                                                const renderVisualEditor = () => {
                                                    const editorLabelWidth = 360;
                                                    const aspect = labelWidthMm / labelHeightMm;
                                                    const editorLabelHeight = editorLabelWidth / aspect;
                                                    
                                                    return (
                                                        <div 
                                                            ref={firstCellRef}
                                                            className="bg-white shadow-xl rounded-xl border-2 border-primary relative overflow-hidden"
                                                            style={{
                                                                width: `${editorLabelWidth}px`,
                                                                height: `${editorLabelHeight}px`,
                                                                padding: `${10 * (labelConfig.labelMargin / 100) * (editorLabelWidth / actualWidthPx)}px`,
                                                                boxSizing: 'border-box'
                                                            }}
                                                        >
                                                            <div className="absolute inset-0 grid grid-cols-6 grid-rows-6 pointer-events-none opacity-5">
                                                                {Array.from({ length: 36 }).map((_, i) => (
                                                                    <div key={i} className="border-[0.5px] border-slate-900"></div>
                                                                ))}
                                                            </div>

                                                            {labelConfig.showName && (
                                                                <DraggableElement
                                                                    x={labelConfig.nameX}
                                                                    y={labelConfig.nameY}
                                                                    style={{ transform: 'translateX(-50%)' }}
                                                                    containerRef={firstCellRef}
                                                                    active={selectedElement === 'name'}
                                                                    onSelect={() => setSelectedElement('name')}
                                                                    showResize={true}
                                                                    onResize={(deltaX, deltaY) => {
                                                                        const newSize = Math.max(50, Math.min(200, labelConfig.nameFontSize + deltaY * 0.5));
                                                                        updateConfig('nameFontSize', Math.round(newSize));
                                                                    }}
                                                                    onChange={(x, y) => {
                                                                        updateConfig('nameX', Math.round(x));
                                                                        updateConfig('nameY', Math.round(y));
                                                                    }}
                                                                >
                                                                    <span 
                                                                        className="barcode-product-name"
                                                                        style={{
                                                                            fontSize: `${18 * (labelConfig.nameFontSize / 100) * (editorLabelWidth / actualWidthPx)}px`,
                                                                            fontFamily: labelConfig.nameFont || 'monospace',
                                                                            fontWeight: 'bold',
                                                                            color: 'black',
                                                                            whiteSpace: 'nowrap',
                                                                            pointerEvents: 'none',
                                                                            overflow: 'hidden',
                                                                            textOverflow: 'ellipsis',
                                                                            display: 'block',
                                                                            maxWidth: '95%'
                                                                        }}
                                                                    >
                                                                        {previewName}
                                                                    </span>
                                                                </DraggableElement>
                                                            )}

                                                            <DraggableElement
                                                                x={labelConfig.barcodeX}
                                                                y={labelConfig.barcodeY}
                                                                style={{ transform: 'translateX(-50%)' }}
                                                                containerRef={firstCellRef}
                                                                active={selectedElement === 'barcode'}
                                                                onSelect={() => setSelectedElement('barcode')}
                                                                showResize={true}
                                                                onResize={(deltaX, deltaY) => {
                                                                    const newScale = Math.max(0.6, Math.min(2.5, barcodeScale + deltaY * 0.005));
                                                                    setBarcodeScale(parseFloat(newScale.toFixed(2)));
                                                                }}
                                                                onChange={(x, y) => {
                                                                    updateConfig('barcodeX', Math.round(x));
                                                                    updateConfig('barcodeY', Math.round(y));
                                                                }}
                                                            >
                                                                <div style={{ pointerEvents: 'none' }} className="designer-barcode-wrapper flex items-center justify-center bg-white p-[2px] rounded">
                                                                    <Barcode 
                                                                        value={previewBarcode} 
                                                                        width={1.4 * barcodeScale * ((labelConfig.barcodeWidthScale ?? 100) / 100) * getBarcodeScaleFactor(previewBarcode) * (editorLabelWidth / actualWidthPx)} 
                                                                        height={70 * barcodeScale * ((labelConfig.barcodeHeightScale ?? 100) / 100) * (editorLabelWidth / actualWidthPx)} 
                                                                        fontSize={16 * barcodeScale * (editorLabelWidth / actualWidthPx)}
                                                                        margin={0}
                                                                        displayValue={labelConfig.showBarcodeText !== false}
                                                                        background="transparent"
                                                                        lineColor="black"
                                                                        preserveAspectRatio="none"
                                                                    />
                                                                </div>
                                                            </DraggableElement>

                                                            {labelConfig.showCombo && (
                                                                <DraggableElement
                                                                    x={labelConfig.comboX}
                                                                    y={labelConfig.comboY}
                                                                    containerRef={firstCellRef}
                                                                    active={selectedElement === 'combo'}
                                                                    onSelect={() => setSelectedElement('combo')}
                                                                    showResize={true}
                                                                    onResize={(deltaX, deltaY) => {
                                                                        const newSize = Math.max(50, Math.min(200, labelConfig.comboFontSize + deltaY * 0.5));
                                                                        updateConfig('comboFontSize', Math.round(newSize));
                                                                    }}
                                                                    onChange={(x, y) => {
                                                                        updateConfig('comboX', Math.round(x));
                                                                        updateConfig('comboY', Math.round(y));
                                                                    }}
                                                                >
                                                                    <span 
                                                                        className="barcode-price"
                                                                        style={{
                                                                            fontSize: `${22 * (labelConfig.comboFontSize / 100) * (editorLabelWidth / actualWidthPx)}px`,
                                                                            fontWeight: '900',
                                                                            fontFamily: labelConfig.comboFont || 'monospace',
                                                                            color: 'black',
                                                                            whiteSpace: 'nowrap',
                                                                            pointerEvents: 'none',
                                                                            backgroundColor: 'rgba(0,0,0,0.05)',
                                                                            padding: '1px 3px',
                                                                            borderRadius: '4px'
                                                                        }}
                                                                    >
                                                                        {previewCombo}
                                                                    </span>
                                                                </DraggableElement>
                                                            )}
                                                        </div>
                                                    );
                                                };

                                                return (
                                                    <div className="w-full flex flex-col items-center gap-6">
                                                        <div className="flex flex-col items-center">
                                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2">
                                                                Bản xem trước bố cục thực tế
                                                            </span>
                                                            {paperSize === 'A4' ? renderA4Preview() : renderOtherPreview()}
                                                        </div>
                                                        
                                                        <div className="w-full border-t border-slate-200/60 dark:border-slate-800/40 pt-6 flex flex-col items-center">
                                                            <span className="text-[11px] font-black uppercase tracking-widest text-slate-800 dark:text-slate-200 mb-1">
                                                                Bảng thiết kế mẫu tem (Áp dụng cho TẤT CẢ sản phẩm)
                                                            </span>
                                                            <span className="text-[9px] text-slate-400 dark:text-slate-500 lowercase italic font-normal tracking-normal mb-2 text-center block">
                                                                (Bạn chỉ cần chỉnh mẫu này 1 lần, toàn bộ sản phẩm khi in ra sẽ tự động áp dụng bố cục này)
                                                            </span>
                                                            {renderVisualEditor()}
                                                        </div>
                                                    </div>
                                                );
                                            })()}
                                            
                                            {/* Selector Buttons */}
                                            <div className="flex gap-2.5 mt-4">
                                                <button 
                                                    onClick={() => setSelectedElement('name')}
                                                    className={cn("px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-colors border", 
                                                        selectedElement === 'name' ? "bg-primary text-white border-primary" : "bg-white/40 dark:bg-slate-900/40 text-slate-600 dark:text-slate-400 border-white/20"
                                                    )}
                                                >
                                                    Chỉnh tên sản phẩm
                                                </button>
                                                <button 
                                                    onClick={() => setSelectedElement('barcode')}
                                                    className={cn("px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-colors border", 
                                                        selectedElement === 'barcode' ? "bg-primary text-white border-primary" : "bg-white/40 dark:bg-slate-900/40 text-slate-600 dark:text-slate-400 border-white/20"
                                                    )}
                                                >
                                                    Chỉnh mã vạch
                                                </button>
                                                <button 
                                                    onClick={() => setSelectedElement('combo')}
                                                    className={cn("px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-colors border", 
                                                        selectedElement === 'combo' ? "bg-primary text-white border-primary" : "bg-white/40 dark:bg-slate-900/40 text-slate-600 dark:text-slate-400 border-white/20"
                                                    )}
                                                >
                                                    Chỉnh số Combo
                                                </button>
                                            </div>
                                        </div>
                                        
                                        {/* Right Side: Settings & Configuration Controls */}
                                        <div className="w-full lg:w-[350px] bg-white/40 dark:bg-slate-900/40 backdrop-blur-md rounded-2xl border border-white/30 dark:border-white/5 p-4 flex flex-col justify-start gap-4 overflow-y-auto max-h-[580px] custom-scrollbar shrink-0 shadow-sm">
                                            {/* Template Manager */}
                                            <div className="space-y-3 bg-slate-50 dark:bg-slate-950/30 p-3 rounded-xl border border-slate-200/50 dark:border-slate-800/40">
                                                <h4 className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider flex justify-between items-center">
                                                    <span>Mẫu thiết kế tem đã lưu</span>
                                                    <span className="text-[8px] bg-primary/15 text-primary dark:text-[#d4a574] px-1.5 py-0.5 rounded font-black">Templates</span>
                                                </h4>
                                                
                                                <div className="flex gap-1.5 items-center">
                                                    <input 
                                                        type="text" 
                                                        placeholder="Tên mẫu mới..." 
                                                        value={newTemplateName} 
                                                        onChange={e => setNewTemplateName(e.target.value)}
                                                        className="flex-1 px-2.5 py-1 text-[11px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-white outline-none focus:border-primary font-bold"
                                                    />
                                                    <button 
                                                        onClick={handleSaveTemplate}
                                                        className="px-2.5 py-1 text-[10px] bg-primary hover:bg-primary/95 text-white font-black uppercase rounded-lg tracking-wider shrink-0 transition-colors"
                                                    >
                                                        Lưu mẫu
                                                    </button>
                                                </div>

                                                <div className="space-y-1.5 max-h-[150px] overflow-y-auto custom-scrollbar pt-1.5 border-t border-slate-200/55 dark:border-slate-800/55">
                                                    {savedTemplates.map((tpl) => (
                                                        <div 
                                                            key={tpl.id} 
                                                            onClick={() => handleApplyTemplate(tpl)}
                                                            className="group flex items-center justify-between bg-white dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-700/60 p-2 rounded-lg border border-slate-200/30 cursor-pointer transition-colors"
                                                        >
                                                            <div className="flex flex-col min-w-0">
                                                                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200 truncate group-hover:text-primary dark:group-hover:text-[#d4a574]">
                                                                    {tpl.name}
                                                                </span>
                                                                <span className="text-[9px] text-slate-400 font-bold uppercase mt-0.5">
                                                                    Khổ: {tpl.paperSize} | Cột: {tpl.config.a4Columns || 2} dòng: {tpl.config.a4Rows || 5}
                                                                </span>
                                                            </div>
                                                            
                                                            {!tpl.id.startsWith('sys-') && (
                                                                <button 
                                                                    onClick={(e) => handleDeleteTemplate(tpl.id, tpl.name, e)}
                                                                    className="p-1 hover:bg-rose-500/10 text-slate-400 hover:text-rose-500 rounded transition-colors"
                                                                >
                                                                    <Trash2 size={12} strokeWidth={2.5} />
                                                                </button>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                            
                                            <div className="flex items-center gap-2 pb-2 border-b border-slate-200 dark:border-slate-800/60">
                                                <Sliders size={16} className="text-primary dark:text-emerald-400" />
                                                <span className="text-[11px] font-black uppercase tracking-wider text-slate-800 dark:text-white">
                                                    Thông số & Cấu hình tem
                                                </span>
                                            </div>

                                            {activePrintList.length > 0 && (
                                                <div className="bg-slate-50 dark:bg-slate-950/30 p-3 rounded-xl border border-slate-200/50 dark:border-slate-800/40 space-y-2">
                                                    <h4 className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider flex justify-between items-center">
                                                        <span>Số tem cần in ({totalLabels} tem)</span>
                                                        <span className="text-[8px] bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded font-black">Thiết lập</span>
                                                    </h4>
                                                    <div className="space-y-1.5 max-h-[120px] overflow-y-auto custom-scrollbar">
                                                        {activePrintList.map((item, idx) => (
                                                            <div key={`${item.product.id}-${item.comboQty || 1}-${idx}`} className="flex items-center justify-between bg-white dark:bg-slate-800/60 p-2 rounded-lg border border-slate-200/30">
                                                                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 truncate max-w-[140px]">
                                                                    {item.product.name} {item.comboQty > 1 && `(x${item.comboQty})`}
                                                                </span>
                                                                <div className="flex items-center bg-slate-100 dark:bg-slate-950 rounded overflow-hidden border border-slate-200/50 dark:border-slate-800">
                                                                    <button 
                                                                        onClick={() => updateQty(item.product.id, item.comboQty, item.qty - 1)}
                                                                        className="px-2 py-0.5 hover:bg-slate-200 dark:hover:bg-slate-900 text-xs font-bold text-slate-600 dark:text-slate-400"
                                                                    >-</button>
                                                                    <input 
                                                                        type="number"
                                                                        value={item.qty}
                                                                        onChange={e => updateQty(item.product.id, item.comboQty, parseInt(e.target.value) || 1)}
                                                                        className="w-8 text-center bg-transparent outline-none dark:text-white font-black text-[11px] text-primary dark:text-emerald-400"
                                                                        min="1"
                                                                    />
                                                                    <button 
                                                                        onClick={() => updateQty(item.product.id, item.comboQty, item.qty + 1)}
                                                                        className="px-2 py-0.5 hover:bg-slate-200 dark:hover:bg-slate-900 text-xs font-bold text-slate-600 dark:text-slate-400"
                                                                    >+</button>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            <div className="space-y-2 bg-slate-50 dark:bg-slate-950/30 p-3 rounded-xl border border-slate-200/50 dark:border-slate-800/40">
                                                <h4 className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Hiển thị thông tin</h4>
                                                
                                                <label className="flex items-center justify-between p-1 hover:bg-white/40 dark:hover:bg-white/5 rounded cursor-pointer transition-colors">
                                                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Tên sản phẩm</span>
                                                    <input type="checkbox" checked={labelConfig.showName} onChange={e => updateConfig('showName', e.target.checked)} className="w-3.5 h-3.5 accent-primary" />
                                                </label>
                                                
                                                <label className="flex items-center justify-between p-1 hover:bg-white/40 dark:hover:bg-white/5 rounded cursor-pointer transition-colors">
                                                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Số lượng Combo (x5)</span>
                                                    <input type="checkbox" checked={labelConfig.showCombo} onChange={e => updateConfig('showCombo', e.target.checked)} className="w-3.5 h-3.5 accent-primary" />
                                                </label>
                                                
                                                <label className="flex items-center justify-between p-1 hover:bg-white/40 dark:hover:bg-white/5 rounded cursor-pointer transition-colors">
                                                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Hiện chữ số mã sản phẩm</span>
                                                    <input type="checkbox" checked={labelConfig.showBarcodeText !== false} onChange={e => updateConfig('showBarcodeText', e.target.checked)} className="w-3.5 h-3.5 accent-primary" />
                                                </label>

                                                {labelConfig.showCombo && (
                                                    <div className="flex items-center justify-between p-1">
                                                        <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Vị trí ký tự Combo</span>
                                                        <select 
                                                            value={labelConfig.comboPosition || 'top-right'}
                                                            onChange={e => updateConfig('comboPosition', e.target.value)}
                                                            className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-2 py-0.5 text-[11px] outline-none text-slate-800 dark:text-white font-bold cursor-pointer"
                                                        >
                                                            <option value="top-right">Góc trên phải</option>
                                                            <option value="bottom-right">Góc dưới phải</option>
                                                            <option value="center-bottom">Giữa dưới cùng</option>
                                                        </select>
                                                    </div>
                                                )}

                                                <div className="flex items-center justify-between p-1">
                                                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Tiền tố mã (Prefix)</span>
                                                    <input 
                                                        type="text" 
                                                        value={labelConfig.prefix ?? 'SP'} 
                                                        onChange={e => updateConfig('prefix', e.target.value.toUpperCase())} 
                                                        placeholder="SP"
                                                        className="w-14 px-2 py-0.5 text-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-[11px] font-black uppercase text-slate-800 dark:text-white outline-none"
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-3 bg-slate-50 dark:bg-slate-950/30 p-3 rounded-xl border border-slate-200/50 dark:border-slate-800/40">
                                                <h4 className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">Cỡ chữ & lề</h4>
                                                
                                                <div className="space-y-1">
                                                    <div className="flex justify-between text-[11px] font-bold">
                                                        <span className="text-slate-600 dark:text-slate-400">Chữ Tên sản phẩm</span>
                                                        <span className="text-primary dark:text-[#d4a574] font-mono">{labelConfig.nameFontSize}%</span>
                                                    </div>
                                                    <div className="flex gap-2 items-center">
                                                        <select 
                                                            value={labelConfig.nameFont || 'monospace'}
                                                            onChange={e => updateConfig('nameFont', e.target.value)}
                                                            className="text-[10px] font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-1.5 py-0.5 outline-none text-slate-700 dark:text-slate-300"
                                                        >
                                                            <option value="monospace">Mặc định</option>
                                                            <option value="'Be Vietnam Pro', sans-serif">Vietnam Pro</option>
                                                            <option value="Inter, sans-serif">Inter</option>
                                                            <option value="Arial, sans-serif">Arial</option>
                                                        </select>
                                                        <input type="range" min="50" max="150" value={labelConfig.nameFontSize} onChange={e => updateConfig('nameFontSize', parseInt(e.target.value))} className="flex-1 accent-primary h-1 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer" />
                                                    </div>
                                                </div>

                                                <div className="space-y-1">
                                                    <div className="flex justify-between text-[11px] font-bold">
                                                        <span className="text-slate-600 dark:text-slate-400">Chiều ngang mã vạch (Dài)</span>
                                                        <span className="text-primary dark:text-[#d4a574] font-mono">{labelConfig.barcodeWidthScale ?? 100}%</span>
                                                    </div>
                                                    <input type="range" min="50" max="200" value={labelConfig.barcodeWidthScale ?? 100} onChange={e => updateConfig('barcodeWidthScale', parseInt(e.target.value))} className="w-full accent-primary h-1 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer" />
                                                </div>
                                                
                                                <div className="space-y-1">
                                                    <div className="flex justify-between text-[11px] font-bold">
                                                        <span className="text-slate-600 dark:text-slate-400">Chiều dọc mã vạch (Cao)</span>
                                                        <span className="text-primary dark:text-[#d4a574] font-mono">{labelConfig.barcodeHeightScale ?? 100}%</span>
                                                    </div>
                                                    <input type="range" min="40" max="250" value={labelConfig.barcodeHeightScale ?? 100} onChange={e => updateConfig('barcodeHeightScale', parseInt(e.target.value))} className="w-full accent-primary h-1 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer" />
                                                </div>

                                                {labelConfig.showCombo && (
                                                    <div className="space-y-1">
                                                        <div className="flex justify-between text-[11px] font-bold">
                                                            <span className="text-slate-600 dark:text-slate-400">Ký tự Combo</span>
                                                            <span className="text-primary dark:text-[#d4a574] font-mono">{labelConfig.comboFontSize}%</span>
                                                        </div>
                                                        <div className="flex gap-2 items-center">
                                                            <select 
                                                                value={labelConfig.comboFont || 'monospace'}
                                                                onChange={e => updateConfig('comboFont', e.target.value)}
                                                                className="text-[10px] font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-1.5 py-0.5 outline-none text-slate-700 dark:text-slate-300"
                                                            >
                                                                <option value="monospace">Mặc định</option>
                                                                <option value="'Be Vietnam Pro', sans-serif">Vietnam Pro</option>
                                                                <option value="Inter, sans-serif">Inter</option>
                                                                <option value="Arial, sans-serif">Arial</option>
                                                            </select>
                                                            <input type="range" min="50" max="200" value={labelConfig.comboFontSize} onChange={e => updateConfig('comboFontSize', parseInt(e.target.value))} className="flex-1 accent-primary h-1 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer" />
                                                        </div>
                                                    </div>
                                                )}

                                                <div className="space-y-1">
                                                    <div className="flex justify-between text-[11px] font-bold">
                                                        <span className="text-slate-600 dark:text-slate-400">Lề trong nhãn</span>
                                                        <span className="text-primary dark:text-[#d4a574] font-mono">{labelConfig.labelMargin}%</span>
                                                    </div>
                                                    <input type="range" min="0" max="200" value={labelConfig.labelMargin} onChange={e => updateConfig('labelMargin', parseInt(e.target.value))} className="w-full accent-primary h-1 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer" />
                                                </div>
                                            </div>

                                            {paperSize === 'A4' && (
                                                <div className="space-y-3 bg-slate-50 dark:bg-slate-950/30 p-3 rounded-xl border border-slate-200/50 dark:border-slate-800/40">
                                                    <h4 className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">Bố cục trang A4</h4>
                                                    
                                                    <div className="space-y-1">
                                                        <div className="flex justify-between text-[11px] font-bold">
                                                            <span className="text-slate-600 dark:text-slate-400">Số cột tem</span>
                                                            <span className="text-primary dark:text-[#d4a574] font-mono">{labelConfig.a4Columns || 2} cột</span>
                                                        </div>
                                                        <input type="range" min="1" max="6" value={labelConfig.a4Columns || 2} onChange={e => updateConfig('a4Columns', parseInt(e.target.value))} className="w-full accent-primary h-1 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer" />
                                                    </div>
                                                    
                                                    <div className="space-y-1">
                                                        <div className="flex justify-between text-[11px] font-bold">
                                                            <span className="text-slate-600 dark:text-slate-400">Số dòng tem</span>
                                                            <span className="text-primary dark:text-[#d4a574] font-mono">{labelConfig.a4Rows || 5} dòng</span>
                                                        </div>
                                                        <input type="range" min="1" max="15" value={labelConfig.a4Rows || 5} onChange={e => updateConfig('a4Rows', parseInt(e.target.value))} className="w-full accent-primary h-1 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer" />
                                                    </div>

                                                    <div className="space-y-1">
                                                        <div className="flex justify-between text-[11px] font-bold">
                                                            <span className="text-slate-600 dark:text-slate-400">Lề trên / dưới (mm)</span>
                                                            <span className="text-primary dark:text-[#d4a574] font-mono">{labelConfig.a4MarginTop !== undefined ? labelConfig.a4MarginTop : 10} mm</span>
                                                        </div>
                                                        <input type="range" min="0" max="40" value={labelConfig.a4MarginTop !== undefined ? labelConfig.a4MarginTop : 10} onChange={e => updateConfig('a4MarginTop', parseInt(e.target.value))} className="w-full accent-primary h-1 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer" />
                                                    </div>

                                                    <div className="space-y-1">
                                                        <div className="flex justify-between text-[11px] font-bold">
                                                            <span className="text-slate-600 dark:text-slate-400">Lề trái / phải (mm)</span>
                                                            <span className="text-primary dark:text-[#d4a574] font-mono">{labelConfig.a4MarginSide !== undefined ? labelConfig.a4MarginSide : 15} mm</span>
                                                        </div>
                                                        <input type="range" min="0" max="40" value={labelConfig.a4MarginSide !== undefined ? labelConfig.a4MarginSide : 15} onChange={e => updateConfig('a4MarginSide', parseInt(e.target.value))} className="w-full accent-primary h-1 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer" />
                                                    </div>

                                                    <div className="space-y-1">
                                                        <div className="flex justify-between text-[11px] font-bold">
                                                            <span className="text-slate-600 dark:text-slate-400">Khoảng cách giữa các tem</span>
                                                            <span className="text-primary dark:text-[#d4a574] font-mono">{labelConfig.labelGap !== undefined ? labelConfig.labelGap : 4} mm</span>
                                                        </div>
                                                        <input type="range" min="0" max="20" value={labelConfig.labelGap !== undefined ? labelConfig.labelGap : 4} onChange={e => updateConfig('labelGap', parseInt(e.target.value))} className="w-full accent-primary h-1 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer" />
                                                    </div>
                                                </div>
                                            )}

                                            <div className="space-y-3 bg-slate-50 dark:bg-slate-950/30 p-3 rounded-xl border border-slate-200/50 dark:border-slate-800/40">
                                                <h4 className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">Kích thước nhãn</h4>
                                                
                                                <div className="space-y-1">
                                                    <div className="flex justify-between text-[11px] font-bold">
                                                        <span className="text-slate-600 dark:text-slate-400">Chiều cao tem</span>
                                                        <span className="text-primary dark:text-[#d4a574] font-mono">{labelConfig.labelHeight || 52} mm</span>
                                                    </div>
                                                    <input type="range" min="10" max="150" value={labelConfig.labelHeight || 52} onChange={e => updateConfig('labelHeight', parseInt(e.target.value))} className="w-full accent-primary h-1 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer" />
                                                </div>
                                                
                                                <div className="space-y-1">
                                                    <div className="flex justify-between text-[11px] font-bold">
                                                        <span className="text-slate-600 dark:text-slate-400">Chiều rộng tem</span>
                                                        <span className="text-primary dark:text-[#d4a574] font-mono">{labelConfig.labelWidth === 0 ? 'Tự động' : `${labelConfig.labelWidth} mm`}</span>
                                                    </div>
                                                    <input type="range" min="0" max="150" value={labelConfig.labelWidth ?? 0} onChange={e => updateConfig('labelWidth', parseInt(e.target.value))} className="w-full accent-primary h-1 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer" />
                                                </div>
                                            </div>

                                            <div className="space-y-3 bg-slate-50 dark:bg-slate-950/30 p-3 rounded-xl border border-slate-200/50 dark:border-slate-800/40">
                                                <h4 className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">Căn chỉnh Vị trí</h4>
                                                
                                                {labelConfig.showCombo && (
                                                    <div className="space-y-2 bg-white dark:bg-slate-900/60 p-2 rounded-lg border border-slate-200/20">
                                                        <span className="text-[9px] font-black uppercase text-slate-500 dark:text-slate-400">Số lượng Combo (x5, x10)</span>
                                                        <div className="grid grid-cols-2 gap-3">
                                                            <div className="space-y-0.5">
                                                                <div className="flex justify-between text-[9px] font-bold text-slate-600 dark:text-slate-400">
                                                                    <span>Ngang (X)</span>
                                                                    <span className="font-mono text-primary dark:text-[#d4a574]">{labelConfig.comboX}%</span>
                                                                </div>
                                                                <input type="range" min="0" max="100" value={labelConfig.comboX} onChange={e => updateConfig('comboX', parseInt(e.target.value))} className="w-full accent-primary h-0.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer" />
                                                            </div>
                                                            <div className="space-y-0.5">
                                                                <div className="flex justify-between text-[9px] font-bold text-slate-600 dark:text-slate-400">
                                                                    <span>Dọc (Y)</span>
                                                                    <span className="font-mono text-primary dark:text-[#d4a574]">{labelConfig.comboY}%</span>
                                                                </div>
                                                                <input type="range" min="0" max="100" value={labelConfig.comboY} onChange={e => updateConfig('comboY', parseInt(e.target.value))} className="w-full accent-primary h-0.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer" />
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                <div className="space-y-2 bg-white dark:bg-slate-900/60 p-2 rounded-lg border border-slate-200/20">
                                                    <span className="text-[9px] font-black uppercase text-slate-500 dark:text-slate-400">Mã vạch (Barcode)</span>
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <div className="space-y-0.5">
                                                            <div className="flex justify-between text-[9px] font-bold text-slate-600 dark:text-slate-400">
                                                                <span>Ngang (X)</span>
                                                                <span className="font-mono text-primary dark:text-[#d4a574]">{labelConfig.barcodeX}%</span>
                                                            </div>
                                                            <input type="range" min="0" max="100" value={labelConfig.barcodeX} onChange={e => updateConfig('barcodeX', parseInt(e.target.value))} className="w-full accent-primary h-0.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer" />
                                                        </div>
                                                        <div className="space-y-0.5">
                                                            <div className="flex justify-between text-[9px] font-bold text-slate-600 dark:text-slate-400">
                                                                <span>Dọc (Y)</span>
                                                                <span className="font-mono text-primary dark:text-[#d4a574]">{labelConfig.barcodeY}%</span>
                                                            </div>
                                                            <input type="range" min="0" max="100" value={labelConfig.barcodeY} onChange={e => updateConfig('barcodeY', parseInt(e.target.value))} className="w-full accent-primary h-0.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer" />
                                                        </div>
                                                    </div>
                                                </div>

                                                {labelConfig.showName && (
                                                    <div className="space-y-2 bg-white dark:bg-slate-900/60 p-2 rounded-lg border border-slate-200/20">
                                                        <span className="text-[9px] font-black uppercase text-slate-500 dark:text-slate-400">Tên sản phẩm</span>
                                                        <div className="grid grid-cols-2 gap-3">
                                                            <div className="space-y-0.5">
                                                                <div className="flex justify-between text-[9px] font-bold text-slate-600 dark:text-slate-400">
                                                                    <span>Ngang (X)</span>
                                                                    <span className="font-mono text-primary dark:text-[#d4a574]">{labelConfig.nameX}%</span>
                                                                </div>
                                                                <input type="range" min="0" max="100" value={labelConfig.nameX} onChange={e => updateConfig('nameX', parseInt(e.target.value))} className="w-full accent-primary h-0.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer" />
                                                            </div>
                                                            <div className="space-y-0.5">
                                                                <div className="flex justify-between text-[9px] font-bold text-slate-600 dark:text-slate-400">
                                                                    <span>Dọc (Y)</span>
                                                                    <span className="font-mono text-primary dark:text-[#d4a574]">{labelConfig.nameY}%</span>
                                                                </div>
                                                                <input type="range" min="0" max="100" value={labelConfig.nameY} onChange={e => updateConfig('nameY', parseInt(e.target.value))} className="w-full accent-primary h-0.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer" />
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-4 bg-primary/5 dark:bg-emerald-600/10 text-primary dark:text-emerald-400 rounded-2xl text-xs border border-primary/10 flex items-start gap-3">
                                    <HelpCircle size={16} className="shrink-0 mt-0.5" />
                                    <p className="leading-relaxed"><strong>Mẹo thông minh:</strong> Các thông số cấu hình và tùy chọn hiển thị sẽ được lưu trực tiếp trên thiết bị để áp dụng cho mọi lần in tiếp theo. Bản in thực tế sẽ tự động tối ưu hóa vị trí căn chỉnh khi xuất lệnh in ra máy.</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* PRINT ONLY LAYOUT */}
            <div className={cn("hidden print:block", paperSize === 'A4' ? 'print-a4-container' : paperSize === 'A6' ? 'print-a6-container' : 'print-barcode-container')}>
                <style dangerouslySetInnerHTML={{__html: `
                    @media print {
                        @page { 
                            size: ${paperSize === 'A4' ? 'A4' : paperSize === 'A6' ? 'A6' : 'auto'}; 
                            margin: 0; 
                        }
                        body { 
                            background: white !important; 
                            margin: 0 !important; 
                            padding: 0 !important; 
                        }
                        .no-print { display: none !important; }
                        
                        .print-barcode-container {
                            position: absolute;
                            left: 0;
                            top: 0;
                            width: 100%;
                            display: flex !important;
                            flex-wrap: wrap;
                            gap: 10px;
                            padding: 10px;
                        }

                        .print-a4-container {
                            display: block !important;
                            width: 100%;
                        }

                        .print-a6-container {
                            display: block !important;
                            width: 100%;
                        }

                        .barcode-label {
                            width: ${labelConfig.labelWidth > 0 ? `${labelConfig.labelWidth}mm` : (paperSize === '35x22' ? '35mm' : '100%')};
                            height: ${labelConfig.labelHeight > 0 ? `${labelConfig.labelHeight}mm` : (paperSize === '35x22' ? '22mm' : '100%')};
                            border: ${paperSize === 'A4' ? '1px dashed #ccc' : 'none'};
                            page-break-after: auto;
                            page-break-inside: avoid;
                            padding: ${(paperSize === 'A6' ? 5 : paperSize === 'A4' ? 10 : 2) * (labelConfig.labelMargin / 100)}px;
                            box-sizing: border-box;
                            overflow: hidden;
                            position: relative;
                        }
                        .barcode-product-name {
                            display: ${labelConfig.showName ? 'block' : 'none'} !important;
                            font-size: ${(paperSize === 'A6' ? 24 : paperSize === 'A4' ? 18 : 8) * (labelConfig.nameFontSize / 100)}px;
                            white-space: nowrap !important;
                            overflow: hidden !important;
                            text-overflow: ellipsis !important;
                            font-family: ${labelConfig.nameFont || 'monospace'};
                            font-weight: bold;
                            position: absolute !important;
                            left: ${labelConfig.nameX}% !important;
                            top: ${labelConfig.nameY}% !important;
                            max-width: 95% !important;
                            transform: translateX(-50%) !important;
                        }
                        .barcode-wrapper {
                            position: absolute !important;
                            left: ${labelConfig.barcodeX}% !important;
                            top: ${labelConfig.barcodeY}% !important;
                            transform: translateX(-50%) !important;
                            width: ${(labelConfig.barcodeWidthScale ?? 100) * 0.85}% !important;
                            max-width: 98% !important;
                            box-sizing: border-box !important;
                        }
                        .barcode-wrapper svg,
                        .designer-barcode-wrapper svg {
                            max-width: 100% !important;
                            width: 100% !important;
                            display: block !important;
                            margin: 0 auto !important;
                        }
                        .barcode-price {
                            display: ${labelConfig.showCombo ? 'block' : 'none'} !important;
                            font-size: ${(paperSize === 'A6' ? 28 : paperSize === 'A4' ? 22 : 12) * (labelConfig.comboFontSize / 100)}px;
                            font-weight: 900;
                            font-family: ${labelConfig.comboFont || 'monospace'};
                            position: absolute !important;
                            left: ${labelConfig.comboX}% !important;
                            top: ${labelConfig.comboY}% !important;
                            background-color: rgba(0,0,0,0.05) !important;
                            padding: 1px 3px !important;
                            border-radius: 4px !important;
                            white-space: nowrap !important;
                            color: black !important;
                        }
                    }
                `}} />
                
                {(() => {
                    const allLabels = activePrintList.flatMap(item => 
                        Array.from({ length: item.qty }).map(() => item)
                    );
                    
                    if (paperSize === 'A4') {
                        const cols = labelConfig.a4Columns || 2;
                        const rows = labelConfig.a4Rows || 5;
                        const itemsPerPage = cols * rows;
                        const pages = [];
                        for (let i = 0; i < allLabels.length; i += itemsPerPage) {
                            pages.push(allLabels.slice(i, i + itemsPerPage));
                        }
                        
                        const gap = labelConfig.labelGap !== undefined ? labelConfig.labelGap : 4;
                        const marginTop = labelConfig.a4MarginTop !== undefined ? labelConfig.a4MarginTop : 10;
                        const marginSide = labelConfig.a4MarginSide !== undefined ? labelConfig.a4MarginSide : 15;
                        
                        const actualWidth = labelConfig.labelWidth > 0 ? `${labelConfig.labelWidth}mm` : `${(210 - marginSide * 2 - (cols - 1) * gap) / cols}mm`;
                        const actualHeight = labelConfig.labelHeight > 0 ? `${labelConfig.labelHeight}mm` : `${(295 - marginTop * 2 - (rows - 1) * gap) / rows}mm`;
                        
                        return pages.map((pageItems, pageIdx) => (
                            <div key={pageIdx} className="print-a4-page" style={{ pageBreakAfter: 'always', pageBreakInside: 'avoid', height: '295mm', boxSizing: 'border-box', overflow: 'hidden', padding: `${marginTop}mm ${marginSide}mm` }}>
                                <div className="print-a4-grid" style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, ${actualWidth})`, gridTemplateRows: `repeat(${rows}, ${actualHeight})`, gap: `${gap}mm`, height: '100%', width: '100%', boxSizing: 'border-box', justifyContent: 'start', alignContent: 'start' }}>
                                    {pageItems.map((item, index) => (
                                        <div key={index} className="barcode-label" style={{ border: '1px dashed #ccc', height: actualHeight, width: actualWidth, boxSizing: 'border-box', position: 'relative', overflow: 'hidden', padding: `${(paperSize === 'A6' ? 5 : paperSize === 'A4' ? 10 : 2) * (labelConfig.labelMargin / 100)}px` }}>
                                            <div className="barcode-product-name">{item.product.name}</div>
                                            <div className="barcode-wrapper">
                                                {(() => {
                                                    const barcodeVal = item.comboQty > 1 ? `${item.product.barcode || item.product.code}-${item.comboQty}` : (item.product.barcode || item.product.code);
                                                    const barcodeW = 1.4 * barcodeScale * ((labelConfig.barcodeWidthScale ?? 100) / 100) * getBarcodeScaleFactor(barcodeVal);
                                                    return (
                                                        <Barcode 
                                                            value={barcodeVal} 
                                                            width={barcodeW} 
                                                            height={70 * barcodeScale * ((labelConfig.barcodeHeightScale ?? 100) / 100)} 
                                                            fontSize={16 * barcodeScale}
                                                            margin={0}
                                                            displayValue={labelConfig.showBarcodeText !== false}
                                                            background="transparent"
                                                            preserveAspectRatio="none"
                                                        />
                                                    );
                                                })()}
                                            </div>
                                            <div className="barcode-price">x{item.comboQty || 1}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ));
                    }
                    
                    return allLabels.map((item, index) => (
                        <div key={`${item.product.id}-${item.comboQty || 1}-${index}`} className="barcode-label">
                            <div className="barcode-product-name">{item.product.name}</div>
                            <div className="barcode-wrapper">
                                {(() => {
                                    const barcodeVal = item.comboQty > 1 ? `${item.product.barcode || item.product.code}-${item.comboQty}` : (item.product.barcode || item.product.code);
                                    const barcodeW = (paperSize === 'A6' ? 2.0 : 1.0) * barcodeScale * ((labelConfig.barcodeWidthScale ?? 100) / 100);
                                    const scale = getBarcodeScaleFactor(barcodeVal);
                                    return (
                                        <Barcode 
                                            value={barcodeVal} 
                                            width={barcodeW * scale} 
                                            height={(paperSize === 'A6' ? 100 : 25) * barcodeScale * ((labelConfig.barcodeHeightScale ?? 100) / 100)} 
                                            fontSize={(paperSize === 'A6' ? 24 : 10) * barcodeScale}
                                            margin={0}
                                            displayValue={labelConfig.showBarcodeText !== false}
                                            background="transparent"
                                            preserveAspectRatio="none"
                                        />
                                    );
                                })()}
                            </div>
                            <div className="barcode-price">x{item.comboQty || 1}</div>
                        </div>
                    ));
                })()}
            </div>
        </div>
    );
};

export default BarcodeGenerator;
