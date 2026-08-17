import React, { useState, useEffect, useMemo } from 'react';
import {
    Landmark,
    FileSpreadsheet,
    Upload,
    CheckCircle2,
    AlertCircle,
    Package,
    ArrowRight,
    Search,
    RefreshCw,
    Save,
    X,
    Columns,
    AlertTriangle,
    Database,
    Tag,
    Calculator,
    CornerDownRight,
    ArrowUpDown,
    ChevronDown,
    Check,
    Scale,
    Layers,
    Filter,
    HelpCircle,
    ArrowLeft,
    TrendingUp,
    TrendingDown,
    Eye,
    Sparkles
} from 'lucide-react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import * as XLSX from 'xlsx';
import QuickAuditPopout from '../../components/QuickAuditPopout';
import { useQueryClient } from '@tanstack/react-query';
import { cn } from '../../lib/utils';
import SearchableSelect from '../../components/SearchableSelect';
import { createPortal } from 'react-dom';

export default function AccountingInventory() {
    const [view, setView] = useState('list'); // 'list' or 'import'
    const [step, setStep] = useState(1); // 1: Upload, 2: Mapping, 3: Pre-check & Preview
    const [products, setProducts] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [showDiscrepancyOnly, setShowDiscrepancyOnly] = useState(false);
    const [showOnlyCoded, setShowOnlyCoded] = useState(false);

    // Pagination Dashboard
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(20);

    // Sorting Dashboard
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

    // Import State
    const [rawMatrix, setRawMatrix] = useState([]);
    const [headerRowIndex, setHeaderRowIndex] = useState(0);
    const [headerMode, setHeaderMode] = useState('merged_two_rows'); // 'single' or 'merged_two_rows'
    const [showSheetPreview, setShowSheetPreview] = useState(false);
    const [fileData, setFileData] = useState([]);
    const [headers, setHeaders] = useState([]);
    const [uploadedFileName, setUploadedFileName] = useState('');
    const [mapping, setMapping] = useState({ code: '', name: '', stock: '', price: '', unit: '' });
    const [calcPriceFromTotal, setCalcPriceFromTotal] = useState(true);
    const [analyzing, setAnalyzing] = useState(false);
    const [updating, setUpdating] = useState(false);
    const [isUpdateSuccess, setIsUpdateSuccess] = useState(false);
    const [matchedData, setMatchedData] = useState([]);
    const [importSearch, setImportSearch] = useState('');
    const [importFilter, setImportFilter] = useState('all'); // all, unmatched, matched, discrepancy, perfect
    const [importShowOnlyCoded, setImportShowOnlyCoded] = useState(false);
    const [importSort, setImportSort] = useState({ key: null, direction: 'asc' });
    const [importPage, setImportPage] = useState(1);
    const [importItemsPerPage, setImportItemsPerPage] = useState(20);

    // Manual Matching Modal
    const [showMatchModal, setShowMatchModal] = useState(false);
    const [selectedMatchDataId, setSelectedMatchDataId] = useState(null);

    // Quick Audit state
    const [isAuditOpen, setIsAuditOpen] = useState(false);
    const [auditProduct, setAuditProduct] = useState(null);
    const [auditCoords, setAuditCoords] = useState(null);
    const queryClient = useQueryClient();

    // Lock body scroll when modal is open
    useEffect(() => {
        if (showMatchModal) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [showMatchModal]);

    // Fetch all products for matching
    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            const res = await axios.get('/api/products?limit=10000');
            const list = res.data.items || res.data || [];
            setProducts(list);
        } catch (error) {
            console.error("Error fetching products:", error);
            toast.error("Không thể tải danh mục sản phẩm");
        }
    };

    const applyHeaderRow = (matrix, rowIdx, mode = headerMode) => {
        if (!matrix || matrix.length <= rowIdx) return;
        setHeaderRowIndex(rowIdx);
        setHeaderMode(mode);

        let head = [];
        let dataStartIndex = rowIdx + 1;

        if (mode === 'merged_two_rows' && rowIdx + 1 < matrix.length) {
            dataStartIndex = rowIdx + 2;
            const rowA = matrix[rowIdx] || [];
            const rowB = matrix[rowIdx + 1] || [];
            const colCount = Math.max(rowA.length, rowB.length);
            let currentParent = '';

            for (let col = 0; col < colCount; col++) {
                const topVal = (rowA[col] !== undefined && rowA[col] !== null) ? rowA[col].toString().trim() : '';
                const subVal = (rowB[col] !== undefined && rowB[col] !== null) ? rowB[col].toString().trim() : '';

                if (topVal) {
                    currentParent = topVal;
                }

                let combinedName = '';
                if (topVal && !subVal) {
                    combinedName = topVal;
                } else if (!topVal && subVal) {
                    combinedName = currentParent ? `${currentParent} - ${subVal}` : subVal;
                } else if (topVal && subVal) {
                    combinedName = (topVal === subVal) ? topVal : `${topVal} - ${subVal}`;
                } else {
                    combinedName = currentParent ? `${currentParent} - Cột_${col + 1}` : `Cột_${col + 1}`;
                }
                head.push(combinedName);
            }
        } else {
            const rawHead = matrix[rowIdx] || [];
            head = rawHead.map((h, i) => {
                return (h !== undefined && h !== null && h !== '') ? h.toString().trim() : `Cột_${i + 1}`;
            });
        }

        setHeaders(head);

        const dataRows = matrix.slice(dataStartIndex).map((rowArr) => {
            const obj = {};
            head.forEach((h, colIdx) => {
                obj[h] = rowArr[colIdx] !== undefined && rowArr[colIdx] !== null ? rowArr[colIdx] : '';
            });
            return obj;
        }).filter(rowObj => {
            return Object.values(rowObj).some(val => val !== '' && val !== null && val !== undefined);
        });

        setFileData(dataRows);

        // Smart mapping suggestion with comprehensive pattern detection
        const suggest = { code: '', name: '', stock: '', price: '', unit: '' };
        let autoDivide = true;

        // 1. Stock: Prioritize finding "Cuối kỳ - Số lượng" or "Tồn cuối"
        head.forEach(h => {
            const norm = h.toLowerCase().trim();
            if (!suggest.stock && (norm.includes('cuối kỳ') && (norm.includes('số lượng') || norm.includes('sl') || norm.includes('tồn')))) {
                suggest.stock = h;
            }
        });

        // 2. Price/Value: Prioritize finding "Cuối kỳ - Giá trị" or "Cuối kỳ - Thành tiền"
        head.forEach(h => {
            const norm = h.toLowerCase().trim();
            if (!suggest.price && (norm.includes('cuối kỳ') && (norm.includes('giá trị') || norm.includes('thành tiền') || norm.includes('tiền')))) {
                suggest.price = h;
                autoDivide = true;
            }
        });

        // 3. Fallback standard detections for all fields
        head.forEach(h => {
            const norm = h.toLowerCase().trim();
            // Code
            if (!suggest.code && (norm === 'mã hàng' || norm === 'mã sp' || norm === 'mã sản phẩm' || norm === 'mã' || norm === 'code' || norm === 'sku' || norm.includes('mã hàng') || norm.includes('mã sp'))) {
                suggest.code = h;
            }
            // Name
            if (!suggest.name && (norm === 'tên sản phẩm' || norm === 'tên hàng' || norm === 'tên hàng hóa' || norm === 'tên sp' || norm === 'name' || norm === 'sản phẩm' || norm.includes('tên hàng') || norm.includes('tên sp') || norm.includes('tên sản phẩm'))) {
                suggest.name = h;
            }
            // Stock fallback
            if (!suggest.stock && (norm === 'tồn kế toán' || norm === 'tồn sổ sách' || norm === 'tồn kho (đơn vị chính)' || norm === 'tồn kho' || norm === 'tồn' || norm === 'số lượng tồn' || norm === 'sl tồn' || norm === 'tồn cuối' || norm === 'sl cuối kỳ' || norm === 'stock' || norm.includes('tồn cuối') || norm.includes('tồn kho') || norm.includes('số lượng'))) {
                suggest.stock = h;
            }
            // Price / Total Value fallback
            if (!suggest.price && (norm.includes('giá trị') || norm.includes('thành tiền') || norm.includes('trị giá') || norm.includes('tt tồn') || norm.includes('giá trị tồn') || norm.includes('tiền tồn'))) {
                suggest.price = h;
                autoDivide = true;
            } else if (!suggest.price && (norm === 'giá kế toán' || norm === 'giá vốn' || norm === 'giá nhập' || norm === 'giá bán' || norm === 'đơn giá' || norm === 'price' || norm === 'cost' || norm.includes('đơn giá') || norm.includes('giá vốn'))) {
                suggest.price = h;
                autoDivide = false;
            }
            // Unit
            if (!suggest.unit && (norm === 'đơn vị' || norm === 'đvt' || norm === 'đơn vị tính' || norm === 'unit' || norm.includes('đvt') || norm.includes('đơn vị'))) {
                suggest.unit = h;
            }
        });

        // 4. Broadest fallbacks
        if (!suggest.code) {
            head.forEach(h => {
                const norm = h.toLowerCase();
                if (norm.includes('mã') || norm.includes('code')) suggest.code = h;
            });
        }
        if (!suggest.name) {
            head.forEach(h => {
                const norm = h.toLowerCase();
                if (norm.includes('tên') || norm.includes('name')) suggest.name = h;
            });
        }
        if (!suggest.stock) {
            head.forEach(h => {
                const norm = h.toLowerCase();
                if (norm.includes('tồn') || norm.includes('kho') || norm.includes('sl') || norm.includes('số lượng') || norm.includes('stock')) suggest.stock = h;
            });
        }
        if (!suggest.price) {
            head.forEach(h => {
                const norm = h.toLowerCase();
                if (norm.includes('thành tiền') || norm.includes('giá trị') || norm.includes('tiền')) {
                    suggest.price = h;
                    autoDivide = true;
                } else if (norm.includes('giá') || norm.includes('price')) {
                    suggest.price = h;
                }
            });
        }

        setCalcPriceFromTotal(autoDivide);
        setMapping(suggest);
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploadedFileName(file.name);
        setAnalyzing(true);
        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const bstr = evt.target.result;
                const wb = XLSX.read(bstr, { type: 'binary' });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                const data = XLSX.utils.sheet_to_json(ws, { header: 1 });

                if (data.length < 2) {
                    toast.error("File Excel không có dữ liệu!");
                    setAnalyzing(false);
                    return;
                }

                setRawMatrix(data);

                // Auto-detect best candidate header row and mode within first 15 rows
                let bestRowIdx = 0;
                let maxScore = -1;
                let detectedMode = 'single';
                const groupKeywords = ['đầu kỳ', 'nhập kho', 'xuất kho', 'cuối kỳ', 'tồn đầu', 'tồn cuối', 'trong kỳ'];
                const keywords = ['mã', 'tên', 'tồn', 'kho', 'đvt', 'đơn vị', 'đơn giá', 'giá', 'số lượng', 'sl', 'stt', 'code', 'name', 'stock', 'price', 'unit', 'thành tiền', 'giá trị'];

                for (let r = 0; r < Math.min(15, data.length); r++) {
                    const row = data[r];
                    if (!Array.isArray(row)) continue;
                    const nonEmptyCells = row.filter(cell => cell !== undefined && cell !== null && cell.toString().trim() !== '');
                    if (nonEmptyCells.length < 2) continue;

                    let score = nonEmptyCells.length;
                    let hasGroupKeywords = false;

                    nonEmptyCells.forEach(cell => {
                        const text = cell.toString().toLowerCase().trim();
                        if (groupKeywords.some(k => text.includes(k))) {
                            hasGroupKeywords = true;
                            score += 10;
                        }
                        if (keywords.some(k => text.includes(k))) {
                            score += 5;
                        }
                    });

                    // Check if next row has subheaders like "Số lượng", "Giá trị"
                    if (r + 1 < data.length && Array.isArray(data[r + 1])) {
                        const nextRowText = data[r + 1].map(c => (c || '').toString().toLowerCase()).join(' ');
                        if (nextRowText.includes('số lượng') || nextRowText.includes('giá trị') || nextRowText.includes('thành tiền') || hasGroupKeywords) {
                            score += 15;
                            hasGroupKeywords = true;
                        }
                    }

                    if (score > maxScore) {
                        maxScore = score;
                        bestRowIdx = r;
                        detectedMode = hasGroupKeywords ? 'merged_two_rows' : 'single';
                    }
                }

                applyHeaderRow(data, bestRowIdx, detectedMode);
                setStep(2);
            } catch (err) {
                console.error(err);
                toast.error("Lỗi khi đọc file Excel!");
            } finally {
                setAnalyzing(false);
            }
        };
        reader.readAsBinaryString(file);
    };

    const startMatching = () => {
        if (!mapping.code && !mapping.name) {
            toast.error("Vui lòng chọn ít nhất cột Mã hàng hoặc Tên sản phẩm!");
            return;
        }
        if (!mapping.stock) {
            toast.error("Vui lòng chọn cột Tồn kho / Số lượng!");
            return;
        }

        const result = fileData.map((row, idx) => {
            const rawCode = mapping.code ? (row[mapping.code] || '').toString().trim() : '';
            const rawName = mapping.name ? (row[mapping.name] || '').toString().trim() : '';
            const excelStock = parseFloat(row[mapping.stock]) || 0;
            const rawPriceVal = mapping.price ? (parseFloat(row[mapping.price]) || 0) : 0;
            const excelUnit = mapping.unit ? (row[mapping.unit] || '').toString().trim() : '';

            // Calculate accounting unit price
            let excelPrice = 0;
            if (calcPriceFromTotal) {
                excelPrice = (excelStock !== 0) ? Math.round(rawPriceVal / excelStock) : 0;
            } else {
                excelPrice = Math.round(rawPriceVal);
            }

            const normCode = rawCode.toLowerCase().normalize('NFC');
            const normName = rawName.toLowerCase().normalize('NFC');

            // Intelligent 4-stage matching
            let matched = null;
            // Stage 1: Exact code match
            if (normCode) {
                matched = products.find(p => (p.code || '').trim().toLowerCase().normalize('NFC') === normCode);
            }
            // Stage 2: Exact name match
            if (!matched && normName) {
                matched = products.find(p => (p.name || '').trim().toLowerCase().normalize('NFC') === normName);
            }
            // Stage 3: Match Excel code with product name
            if (!matched && normCode) {
                matched = products.find(p => (p.name || '').trim().toLowerCase().normalize('NFC') === normCode);
            }
            // Stage 4: Match Excel name with product code
            if (!matched && normName) {
                matched = products.find(p => (p.code || '').trim().toLowerCase().normalize('NFC') === normName);
            }

            return {
                id: idx,
                excelCode: rawCode || rawName || `SP_${idx + 1}`,
                excelName: rawName || rawCode,
                excelStock,
                excelPrice,
                excelUnit,
                excelRow: row,
                matchedProduct: matched || null,
                status: matched ? 'matched' : 'unmatched'
            };
        });

        setMatchedData(result);
        setStep(3);
        setImportPage(1);
        setIsUpdateSuccess(false);
    };

    const handleManualMatch = (product) => {
        if (selectedMatchDataId === null) return;

        setMatchedData(prev => prev.map(item => {
            if (item.id === selectedMatchDataId) {
                return { ...item, matchedProduct: product, status: 'matched' };
            }
            return item;
        }));

        toast.success(`Đã ghép với "${product.name}"`);
        setShowMatchModal(false);
        setSelectedMatchDataId(null);
    };

    // Pre-check Stats
    const stats = useMemo(() => {
        if (view !== 'import' || step !== 3) {
            return { total: 0, matched: 0, unmatched: 0, discrepancy: 0, perfect: 0, discrepancyQty: 0, discrepancyValue: 0 };
        }
        const matchedItems = matchedData.filter(i => i.status === 'matched');
        const unmatchedItems = matchedData.filter(i => i.status === 'unmatched');
        const discrepancyItems = matchedItems.filter(i => (i.excelStock !== (i.matchedProduct?.stock || 0)));
        const perfectItems = matchedItems.filter(i => (i.excelStock === (i.matchedProduct?.stock || 0)));

        const totalExcelValue = matchedItems.reduce((sum, i) => sum + (i.excelPrice * i.excelStock), 0);
        const totalPosValue = matchedItems.reduce((sum, i) => sum + (i.excelPrice * (i.matchedProduct?.stock || 0)), 0);

        return {
            total: matchedData.length,
            matched: matchedItems.length,
            unmatched: unmatchedItems.length,
            discrepancy: discrepancyItems.length,
            perfect: perfectItems.length,
            discrepancyQty: matchedItems.reduce((sum, i) => sum + (i.excelStock - (i.matchedProduct?.stock || 0)), 0),
            discrepancyValue: totalExcelValue - totalPosValue
        };
    }, [matchedData, view, step]);

    // Import filter & search
    const filteredImportData = useMemo(() => {
        return matchedData.filter(item => {
            const matchesSearch = !importSearch ||
                item.excelCode.toLowerCase().includes(importSearch.toLowerCase()) ||
                item.excelName.toLowerCase().includes(importSearch.toLowerCase()) ||
                (item.matchedProduct?.name || '').toLowerCase().includes(importSearch.toLowerCase()) ||
                (item.matchedProduct?.code || '').toLowerCase().includes(importSearch.toLowerCase());

            let matchesFilter = true;
            if (importFilter === 'unmatched') matchesFilter = item.status === 'unmatched';
            if (importFilter === 'matched') matchesFilter = item.status === 'matched';
            if (importFilter === 'discrepancy') matchesFilter = item.status === 'matched' && (item.excelStock !== (item.matchedProduct?.stock || 0));
            if (importFilter === 'perfect') matchesFilter = item.status === 'matched' && (item.excelStock === (item.matchedProduct?.stock || 0));

            const matchesCoded = !importShowOnlyCoded || (item.matchedProduct && item.matchedProduct.code);

            return matchesSearch && matchesFilter && matchesCoded;
        });
    }, [matchedData, importSearch, importFilter, importShowOnlyCoded]);

    const sortedImportData = useMemo(() => {
        let items = [...filteredImportData];
        if (importSort.key) {
            items.sort((a, b) => {
                let aVal, bVal;
                if (importSort.key === 'status') { aVal = a.status; bVal = b.status; }
                else if (importSort.key === 'excelCode') { aVal = a.excelCode; bVal = b.excelCode; }
                else if (importSort.key === 'excelStock') { aVal = a.excelStock; bVal = b.excelStock; }
                else if (importSort.key === 'posStock') {
                    aVal = a.matchedProduct ? a.matchedProduct.stock : -999999;
                    bVal = b.matchedProduct ? b.matchedProduct.stock : -999999;
                }
                else if (importSort.key === 'diff') {
                    aVal = a.matchedProduct ? (a.matchedProduct.stock - a.excelStock) : -999999;
                    bVal = b.matchedProduct ? (b.matchedProduct.stock - b.excelStock) : -999999;
                }
                else { aVal = a[importSort.key]; bVal = b[importSort.key]; }

                if (aVal < bVal) return importSort.direction === 'asc' ? -1 : 1;
                if (aVal > bVal) return importSort.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }
        return items;
    }, [filteredImportData, importSort]);

    const paginatedImportData = useMemo(() => {
        const start = (importPage - 1) * importItemsPerPage;
        return sortedImportData.slice(start, start + importItemsPerPage);
    }, [sortedImportData, importPage, importItemsPerPage]);

    // Update to Database
    const handleUpdate = async () => {
        const updateList = matchedData
            .filter(item => item.matchedProduct)
            .map(item => ({
                id: item.matchedProduct.id,
                accounting_price: item.excelPrice,
                accounting_stock: item.excelStock
            }));

        if (updateList.length === 0) {
            toast.error("Chưa có sản phẩm nào được khớp mã để cập nhật!");
            return;
        }

        setUpdating(true);
        try {
            const res = await axios.post('/api/products/bulk-accounting-update', updateList);
            toast.success(res.data.message || `Đã cập nhật thành công ${updateList.length} mặt hàng!`);
            await fetchProducts();
            setIsUpdateSuccess(true);
            queryClient.invalidateQueries(["products"]);
            const syncChannel = new BroadcastChannel("pos_data_sync");
            syncChannel.postMessage({ type: "PRODUCT_UPDATED" });
            syncChannel.close();
        } catch (error) {
            console.error(error);
            toast.error("Lỗi khi cập nhật dữ liệu vào hệ thống");
        } finally {
            setUpdating(false);
        }
    };

    // Export Excel Reports
    const handleExportImportData = async () => {
        if (sortedImportData.length === 0) {
            toast.error("Không có dữ liệu để xuất!");
            return;
        }

        const exportData = sortedImportData.map(item => {
            const posStock = item.matchedProduct ? item.matchedProduct.stock : 0;
            const diff = item.matchedProduct ? (posStock - item.excelStock) : 0;
            const diffValue = diff * (item.excelPrice || (item.matchedProduct?.cost_price || 0));

            return {
                "Mã hàng (Excel)": item.excelCode,
                "Tên hàng (Excel)": item.excelName,
                "Tên sản phẩm (POS)": item.matchedProduct?.name || "Chưa khớp",
                "Mã hàng (POS)": item.matchedProduct?.code || "---",
                "Đơn vị tính": item.matchedProduct?.unit || item.excelUnit || "---",
                "Tồn thực tế (Kho POS)": item.matchedProduct ? item.matchedProduct.stock : "---",
                "Tồn sổ sách (Kho Kế toán)": item.excelStock,
                "Chênh lệch (Thực tế - Sổ sách)": item.matchedProduct ? diff : "---",
                "Đơn giá kế toán": item.excelPrice,
                "Giá trị chênh lệch": item.matchedProduct ? diffValue : "---",
                "Trạng thái đối soát": item.status === 'matched'
                    ? (diff === 0 ? 'Khớp hoàn toàn' : (diff > 0 ? 'Lệch thừa thực tế' : 'Lệch thiếu thực tế'))
                    : 'Chưa khớp mã trong POS'
            };
        });

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Doi_Soat_Kho");

        const colWidths = Object.keys(exportData[0]).map(key => ({
            wch: Math.max(key.length, ...exportData.map(row => String(row[key] || '').length)) + 2
        }));
        ws['!cols'] = colWidths;

        const filename = `Bao_Cao_Doi_Soat_Kho_${new Date().toLocaleDateString('vi-VN').replace(/\//g, '-')}.xlsx`;
        const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'base64' });

        try {
            const { saveOrOpenFile } = await import('../../utils/downloadHelper');
            await saveOrOpenFile(wbout, filename, true);
            toast.success("Đã xuất file báo cáo đối soát chênh lệch!");
        } catch (err) {
            console.error("Export Error:", err);
            toast.error("Lỗi khi xuất file");
        }
    };

    const handleExportDashboardData = async () => {
        if (sortedProducts.length === 0) {
            toast.error("Không có dữ liệu để xuất!");
            return;
        }

        const exportData = sortedProducts.map(p => {
            const diff = (p.stock || 0) - (p.accounting_stock || 0);
            const totalValue = (p.accounting_price || 0) * (p.accounting_stock || 0);

            return {
                "Mã hàng": p.code || "---",
                "Tên sản phẩm": p.name,
                "Đơn vị tính": p.unit || "---",
                "Tồn thực tế (POS)": p.stock || 0,
                "Tồn sổ sách (Kế toán)": p.accounting_stock || 0,
                "Chênh lệch (Thực tế - Sổ sách)": diff,
                "Đơn giá (Kế toán)": p.accounting_price || 0,
                "Tổng giá trị sổ sách": totalValue,
                "Trạng thái": diff === 0 ? 'Cân bằng' : (diff > 0 ? 'Thừa thực tế' : 'Thiếu thực tế')
            };
        });

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "So_Ke_Toan_Kho");

        const colWidths = Object.keys(exportData[0]).map(key => ({
            wch: Math.max(key.length, ...exportData.map(row => String(row[key] || '').length)) + 2
        }));
        ws['!cols'] = colWidths;

        const filename = `So_Ke_Toan_Kho_${new Date().toLocaleDateString('vi-VN').replace(/\//g, '-')}.xlsx`;
        const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'base64' });

        try {
            const { saveOrOpenFile } = await import('../../utils/downloadHelper');
            await saveOrOpenFile(wbout, filename, true);
            toast.success("Đã xuất file sổ kế toán kho!");
        } catch (err) {
            console.error("Export Error:", err);
            toast.error("Lỗi khi xuất file");
        }
    };

    // Dashboard Filtering & Sorting
    const filteredProducts = useMemo(() => {
        return products.filter(p => {
            const matchesSearch = !searchQuery ||
                p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (p.code && p.code.toLowerCase().includes(searchQuery.toLowerCase()));

            const hasDiscrepancy = (p.accounting_stock || 0) !== (p.stock || 0);
            const hasCode = p.code && p.code.trim() !== '';

            let matches = matchesSearch;
            if (showDiscrepancyOnly) matches = matches && hasDiscrepancy;
            if (showOnlyCoded) matches = matches && hasCode;

            return matches;
        });
    }, [products, searchQuery, showDiscrepancyOnly, showOnlyCoded]);

    const sortedProducts = useMemo(() => {
        let sortableItems = [...filteredProducts];
        if (sortConfig.key !== null) {
            sortableItems.sort((a, b) => {
                let aValue = a[sortConfig.key];
                let bValue = b[sortConfig.key];

                if (sortConfig.key === 'diff') {
                    aValue = (a.stock || 0) - (a.accounting_stock || 0);
                    bValue = (b.stock || 0) - (b.accounting_stock || 0);
                }

                if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }
        return sortableItems;
    }, [filteredProducts, sortConfig]);

    const paginatedProducts = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return sortedProducts.slice(start, start + itemsPerPage);
    }, [sortedProducts, currentPage, itemsPerPage]);

    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const SortIcon = ({ columnKey }) => {
        if (sortConfig.key !== columnKey) return <ArrowUpDown size={12} className="ml-1 opacity-30" />;
        return sortConfig.direction === 'asc'
            ? <ChevronDown size={12} className="ml-1 rotate-180 text-emerald-500" />
            : <ChevronDown size={12} className="ml-1 text-emerald-500" />;
    };

    const handleQuickAuditSave = async (auditData) => {
        try {
            await axios.post("/api/inventory/audit", auditData);
            toast.success("Đã cập nhật kho thành công!");
            queryClient.invalidateQueries(["products"]);
            const syncChannel = new BroadcastChannel("pos_data_sync");
            syncChannel.postMessage({ type: "PRODUCT_UPDATED" });
            syncChannel.close();
            fetchProducts();
        } catch (err) {
            console.error(err);
            toast.error("Lỗi khi cập nhật kho");
            throw err;
        }
    };

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, showDiscrepancyOnly, showOnlyCoded]);

    useEffect(() => {
        setImportPage(1);
    }, [importSearch, importFilter]);

    const globalStats = useMemo(() => {
        const withStock = products.filter(p => (p.accounting_stock || 0) !== 0 || (p.stock || 0) !== 0);
        const discrepancyCount = products.filter(p => (p.accounting_stock || 0) !== (p.stock || 0)).length;
        const totalAccountingValue = products.reduce((sum, p) => sum + ((p.accounting_price || 0) * (p.accounting_stock || 0)), 0);

        return {
            total: products.length,
            withStock: withStock.length,
            discrepancy: discrepancyCount,
            totalValue: totalAccountingValue
        };
    }, [products]);

    return (
        <div className="pt-2 px-4 pb-20 w-full transition-colors">
            <div className="max-w-[1800px] mx-auto space-y-8 pb-32">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-4 px-4 md:px-0">
                    <div className="flex items-center gap-4 relative z-10">
                        <div className="w-14 h-14 bg-emerald-600/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center shadow-inner">
                            <Scale size={30} />
                        </div>
                        <div>
                            <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-3">
                                Sổ Kế Toán & Đối Soát Kho
                            </h1>
                            <div className="flex items-center gap-2 mt-1.5">
                                <span className={cn(
                                    "px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-widest",
                                    view === 'list' ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300" : "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                                )}>
                                    {view === 'list' ? 'Sổ Sách Hiện Tại' : 'Chế Độ Đối Soát Excel'}
                                </span>
                                <p className="text-xs font-bold text-slate-400">
                                    {view === 'list' ? 'So sánh chênh lệch giữa Kho thực tế (POS) và Kho sổ sách (Kế toán)' : 'Quy trình kiểm tra mã khớp & đối soát tồn kho từ file Excel'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-3 relative z-10">
                        {view === 'list' && (
                            <>
                                <motion.button
                                    whileHover={{ scale: 1.03, y: -2 }}
                                    whileTap={{ scale: 0.97 }}
                                    onClick={handleExportDashboardData}
                                    className="px-5 py-3.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-2 border-slate-200 dark:border-slate-700 rounded-2xl font-black flex items-center gap-2.5 shadow-sm hover:border-emerald-500 hover:text-emerald-600 transition-all text-xs uppercase tracking-wider"
                                >
                                    <FileSpreadsheet size={18} className="text-emerald-600" />
                                    <span>Xuất Sổ Excel</span>
                                </motion.button>

                                <motion.button
                                    whileHover={{ scale: 1.03, y: -2 }}
                                    whileTap={{ scale: 0.97 }}
                                    onClick={() => { setView('import'); setStep(1); }}
                                    className="px-6 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black flex items-center gap-2.5 shadow-xl shadow-emerald-600/20 transition-all text-xs uppercase tracking-wider group"
                                >
                                    <Upload size={18} className="group-hover:-translate-y-0.5 transition-transform" />
                                    <span>Đối Soát Excel Mới</span>
                                </motion.button>
                            </>
                        )}

                        {view === 'import' && (
                            <>
                                {step === 3 && (
                                    <>
                                        <motion.button
                                            whileHover={{ scale: 1.03, y: -2 }}
                                            whileTap={{ scale: 0.97 }}
                                            onClick={handleExportImportData}
                                            className="px-5 py-3.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-2 border-slate-200 dark:border-slate-700 rounded-2xl font-black flex items-center gap-2.5 shadow-sm hover:border-emerald-500 hover:text-emerald-600 transition-all text-xs uppercase tracking-wider"
                                        >
                                            <FileSpreadsheet size={18} className="text-emerald-600" />
                                            <span>Xuất Báo Cáo Đối Soát</span>
                                        </motion.button>

                                        <motion.button
                                            whileHover={{ scale: 1.03, y: -2 }}
                                            whileTap={{ scale: 0.97 }}
                                            onClick={handleUpdate}
                                            disabled={updating || isUpdateSuccess}
                                            className={cn(
                                                "px-6 py-3.5 text-white rounded-2xl font-black flex items-center gap-2.5 shadow-xl transition-all disabled:opacity-50 text-xs uppercase tracking-wider",
                                                isUpdateSuccess ? "bg-slate-500" : "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20"
                                            )}
                                        >
                                            {updating ? <RefreshCw className="animate-spin" size={18} /> : (isUpdateSuccess ? <CheckCircle2 size={18} /> : <Save size={18} />)}
                                            <span>
                                                {isUpdateSuccess ? 'Đã lưu sổ sách' : `Cập nhật ${stats.matched} mặt hàng`}
                                            </span>
                                        </motion.button>
                                    </>
                                )}

                                <button
                                    onClick={() => {
                                        if (isUpdateSuccess) {
                                            setView('list');
                                            setStep(1);
                                            setFileData([]);
                                            setIsUpdateSuccess(false);
                                        } else if (step > 1) {
                                            setStep(step - 1);
                                        } else {
                                            setView('list');
                                        }
                                    }}
                                    className="px-5 py-3.5 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-2xl font-black hover:bg-slate-300 dark:hover:bg-slate-700 transition-all text-xs uppercase tracking-wider flex items-center gap-2"
                                >
                                    <ArrowLeft size={16} />
                                    {isUpdateSuccess ? 'Đóng đối soát' : (step === 1 ? 'Hủy bỏ' : 'Quay lại')}
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {/* VIEW 1: DASHBOARD / SỔ SÁCH HIỆN TẠI */}
                {view === 'list' && (
                    <div className="space-y-6">
                        {/* KPI Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-6 rounded-[2rem] border border-slate-200/80 dark:border-slate-800 shadow-lg shadow-slate-900/5 group hover:-translate-y-1 transition-all">
                                <div className="flex items-start justify-between">
                                    <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-600 dark:text-slate-300 group-hover:bg-slate-900 group-hover:text-white transition-colors">
                                        <Package size={24} />
                                    </div>
                                    <p className="text-3xl font-black text-slate-900 dark:text-white tabular-nums">{globalStats.total}</p>
                                </div>
                                <div className="mt-4">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tổng Danh Mục</p>
                                    <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full mt-2 overflow-hidden">
                                        <div className="h-full bg-slate-400 w-full" />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-6 rounded-[2rem] border border-emerald-100 dark:border-emerald-900/40 shadow-lg shadow-emerald-900/5 group hover:-translate-y-1 transition-all">
                                <div className="flex items-start justify-between">
                                    <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-950/60 rounded-2xl flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                                        <Database size={24} />
                                    </div>
                                    <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400 tabular-nums">{globalStats.withStock}</p>
                                </div>
                                <div className="mt-4">
                                    <p className="text-[10px] font-black text-emerald-600/70 uppercase tracking-widest">Mặt Hàng Có Tồn Kho</p>
                                    <div className="h-1.5 w-full bg-emerald-100 dark:bg-emerald-950 rounded-full mt-2 overflow-hidden">
                                        <div className="h-full bg-emerald-500" style={{ width: `${globalStats.total ? (globalStats.withStock / globalStats.total) * 100 : 0}%` }} />
                                    </div>
                                </div>
                            </div>

                            <div className={cn(
                                "p-6 rounded-[2rem] border backdrop-blur-md shadow-lg transition-all group hover:-translate-y-1",
                                globalStats.discrepancy > 0
                                    ? "bg-rose-50/70 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/50 shadow-rose-900/5"
                                    : "bg-white/80 dark:bg-slate-900/80 border-slate-200/80 dark:border-slate-800"
                            )}>
                                <div className="flex items-start justify-between">
                                    <div className={cn(
                                        "w-12 h-12 rounded-2xl flex items-center justify-center transition-colors",
                                        globalStats.discrepancy > 0 ? "bg-rose-100 dark:bg-rose-900/60 text-rose-600 dark:text-rose-400" : "bg-slate-100 dark:bg-slate-800 text-slate-400"
                                    )}>
                                        <AlertTriangle size={24} />
                                    </div>
                                    <p className={cn("text-3xl font-black tabular-nums", globalStats.discrepancy > 0 ? "text-rose-600 dark:text-rose-400" : "text-slate-900 dark:text-white")}>
                                        {globalStats.discrepancy}
                                    </p>
                                </div>
                                <div className="mt-4">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mặt Hàng Lệch Tồn (Thực tế ≠ Sổ sách)</p>
                                    <div className="h-1.5 w-full bg-rose-100 dark:bg-rose-950 rounded-full mt-2 overflow-hidden">
                                        <div className="h-full bg-rose-500" style={{ width: `${globalStats.total ? (globalStats.discrepancy / globalStats.total) * 100 : 0}%` }} />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-slate-900 dark:bg-slate-950 p-6 rounded-[2rem] shadow-xl shadow-slate-900/40 relative overflow-hidden group hover:-translate-y-1 transition-all">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl -mr-16 -mt-16" />
                                <div className="flex items-start justify-between relative z-10">
                                    <div className="w-12 h-12 bg-slate-800 rounded-2xl flex items-center justify-center text-emerald-400">
                                        <Calculator size={24} />
                                    </div>
                                    <p className="text-2xl font-black text-white tabular-nums tracking-tight">{globalStats.totalValue.toLocaleString()}đ</p>
                                </div>
                                <div className="mt-4 relative z-10">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tổng Trị Giá Kho Sổ Sách</p>
                                    <div className="h-1.5 w-full bg-slate-800 rounded-full mt-2 overflow-hidden">
                                        <div className="h-full bg-emerald-500 animate-pulse" style={{ width: '100%' }} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Search & Filter bar */}
                        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-4 rounded-[2rem] border border-slate-200/80 dark:border-slate-800 shadow-md flex flex-col xl:flex-row items-center gap-4">
                            <div className="relative flex-1 group w-full">
                                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                                <input
                                    type="text"
                                    placeholder="Tìm kiếm theo mã hàng hoặc tên sản phẩm..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-11 pr-4 py-3 bg-slate-100/70 dark:bg-slate-800/70 border border-transparent focus:border-emerald-500/30 rounded-xl outline-none font-bold text-sm text-slate-800 dark:text-slate-100 transition-all placeholder:text-slate-400"
                                />
                            </div>
                            <div className="flex flex-wrap items-center gap-3 shrink-0">
                                <button
                                    onClick={() => setShowDiscrepancyOnly(!showDiscrepancyOnly)}
                                    className={cn(
                                        "flex items-center gap-2.5 px-4 py-3 rounded-xl cursor-pointer select-none border font-black text-xs uppercase tracking-wider transition-all",
                                        showDiscrepancyOnly
                                            ? "bg-rose-500 border-rose-600 text-white shadow-md shadow-rose-500/20"
                                            : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-rose-300"
                                    )}
                                >
                                    <AlertTriangle size={15} />
                                    <span>Chỉ xem lệch tồn</span>
                                </button>

                                <button
                                    onClick={() => setShowOnlyCoded(!showOnlyCoded)}
                                    className={cn(
                                        "flex items-center gap-2.5 px-4 py-3 rounded-xl cursor-pointer select-none border font-black text-xs uppercase tracking-wider transition-all",
                                        showOnlyCoded
                                            ? "bg-emerald-600 border-emerald-700 text-white shadow-md shadow-emerald-600/20"
                                            : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-emerald-300"
                                    )}
                                >
                                    <Tag size={15} />
                                    <span>Có mã hàng</span>
                                </button>

                                <button
                                    onClick={() => fetchProducts()}
                                    className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 rounded-xl hover:text-emerald-600 hover:border-emerald-500 transition-all"
                                    title="Tải lại danh sách"
                                >
                                    <RefreshCw size={18} />
                                </button>
                            </div>
                        </div>

                        {/* Product Sổ Kế Toán Table */}
                        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-[2rem] border border-slate-200/80 dark:border-slate-800 shadow-xl overflow-hidden min-h-[500px] flex flex-col">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-slate-900 text-white text-xs">
                                        <tr>
                                            <th className="px-6 py-4 uppercase font-black tracking-wider cursor-pointer hover:bg-slate-800 transition-colors" onClick={() => handleSort('code')}>
                                                <div className="flex items-center gap-2">Mã hàng <SortIcon columnKey="code" /></div>
                                            </th>
                                            <th className="px-6 py-4 uppercase font-black tracking-wider cursor-pointer hover:bg-slate-800 transition-colors" onClick={() => handleSort('name')}>
                                                <div className="flex items-center gap-2">Tên sản phẩm <SortIcon columnKey="name" /></div>
                                            </th>
                                            <th className="px-6 py-4 uppercase font-black tracking-wider text-right cursor-pointer hover:bg-slate-800 transition-colors" onClick={() => handleSort('stock')}>
                                                <div className="flex items-center justify-end gap-2 text-emerald-400">Kho Thực Tế (POS) <SortIcon columnKey="stock" /></div>
                                            </th>
                                            <th className="px-6 py-4 uppercase font-black tracking-wider text-right cursor-pointer hover:bg-slate-800 transition-colors" onClick={() => handleSort('accounting_stock')}>
                                                <div className="flex items-center justify-end gap-2 text-blue-400">Kho Sổ Sách (KT) <SortIcon columnKey="accounting_stock" /></div>
                                            </th>
                                            <th className="px-6 py-4 uppercase font-black tracking-wider text-right cursor-pointer hover:bg-slate-800 transition-colors" onClick={() => handleSort('diff')}>
                                                <div className="flex items-center justify-end gap-2 text-rose-400">Chênh lệch <SortIcon columnKey="diff" /></div>
                                            </th>
                                            <th className="px-6 py-4 uppercase font-black tracking-wider text-right cursor-pointer hover:bg-slate-800 transition-colors" onClick={() => handleSort('accounting_price')}>
                                                <div className="flex items-center justify-end gap-2 text-amber-400">Giá Kế Toán <SortIcon columnKey="accounting_price" /></div>
                                            </th>
                                            <th className="px-6 py-4 uppercase font-black tracking-wider text-center">Trạng thái đối soát</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                                        {paginatedProducts.map((p) => {
                                            const diff = (p.stock || 0) - (p.accounting_stock || 0);

                                            return (
                                                <tr key={p.id} className="hover:bg-emerald-500/[0.03] dark:hover:bg-slate-800/40 transition-colors">
                                                    <td className="px-6 py-4 font-mono font-bold text-xs text-slate-500 dark:text-slate-400">
                                                        <span className="bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
                                                            {p.code || '---'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 font-black text-slate-800 dark:text-slate-100">
                                                        <div className="flex flex-col">
                                                            <span>{p.name}</span>
                                                            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">{p.unit || 'ĐVT'}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-right font-black tabular-nums text-slate-800 dark:text-slate-100">
                                                        <span className="text-base text-emerald-600 dark:text-emerald-400">{p.stock || 0}</span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right font-black tabular-nums text-blue-600 dark:text-blue-400">
                                                        <span className="text-base">{p.accounting_stock || 0}</span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right font-black tabular-nums">
                                                        {diff === 0 ? (
                                                            <span className="text-slate-400">0</span>
                                                        ) : diff > 0 ? (
                                                            <span className="text-emerald-600 dark:text-emerald-400 font-black">+{diff} (Thừa)</span>
                                                        ) : (
                                                            <span className="text-rose-600 dark:text-rose-400 font-black">{diff} (Thiếu)</span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 text-right font-black tabular-nums text-slate-700 dark:text-slate-300">
                                                        {(p.accounting_price || 0).toLocaleString()}đ
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        {diff === 0 ? (
                                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-xs font-black rounded-lg uppercase">
                                                                <CheckCircle2 size={13} /> Khớp hoàn toàn
                                                            </span>
                                                        ) : diff > 0 ? (
                                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-xs font-black rounded-lg uppercase">
                                                                <TrendingUp size={13} /> Thực tế nhiều hơn
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 text-xs font-black rounded-lg uppercase">
                                                                <AlertTriangle size={13} /> Sổ sách nhiều hơn
                                                            </span>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            {paginatedProducts.length === 0 && (
                                <div className="flex-1 flex flex-col items-center justify-center py-20 text-slate-400">
                                    <Search size={40} className="mb-3 opacity-30 animate-pulse" />
                                    <p className="font-black uppercase tracking-widest text-sm">Không tìm thấy mặt hàng nào</p>
                                </div>
                            )}

                            {/* Pagination */}
                            <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                                <p className="text-xs font-bold text-slate-400">
                                    Hiển thị {Math.min(filteredProducts.length, (currentPage - 1) * itemsPerPage + 1)} - {Math.min(filteredProducts.length, currentPage * itemsPerPage)} trong {filteredProducts.length} mặt hàng
                                </p>
                                <div className="flex items-center gap-2">
                                    <button
                                        disabled={currentPage === 1}
                                        onClick={() => setCurrentPage(currentPage - 1)}
                                        className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-xs disabled:opacity-30"
                                    >
                                        Trang trước
                                    </button>
                                    <span className="text-xs font-black text-slate-800 dark:text-slate-200 px-2">
                                        Trang {currentPage} / {Math.max(1, Math.ceil(filteredProducts.length / itemsPerPage))}
                                    </span>
                                    <button
                                        disabled={currentPage >= Math.ceil(filteredProducts.length / itemsPerPage)}
                                        onClick={() => setCurrentPage(currentPage + 1)}
                                        className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-xs disabled:opacity-30"
                                    >
                                        Trang sau
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* VIEW 2: IMPORT & ĐỐI SOÁT EXCEL WORKFLOW */}
                {view === 'import' && (
                    <div className="space-y-6">
                        {/* STEP 1: UPLOAD FILE */}
                        {step === 1 && (
                            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-10 md:p-14 rounded-[2.5rem] border border-slate-200/80 dark:border-slate-800 shadow-xl max-w-2xl mx-auto text-center flex flex-col items-center">
                                <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-3xl flex items-center justify-center mb-6 shadow-inner">
                                    <FileSpreadsheet size={40} />
                                </div>
                                <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 mb-2">Tải Lên File Excel Đối Soát</h2>
                                <p className="text-slate-500 text-sm max-w-md mb-8">
                                    Nhập file Excel xuất từ LyangPOS (<code>danh_sach_san_pham.xlsx</code>) hoặc bất kỳ bảng kê kiểm kho kế toán nào để đối chiếu với kho thực tế.
                                </p>

                                <div className="relative group w-full">
                                    <input
                                        type="file"
                                        accept=".xlsx, .xls, .csv"
                                        onChange={handleFileUpload}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                    />
                                    <div className="border-3 border-dashed border-slate-200 dark:border-slate-700 group-hover:border-emerald-500 rounded-3xl p-10 transition-all bg-slate-50/50 dark:bg-slate-800/40 group-hover:bg-emerald-50/50 dark:group-hover:bg-emerald-950/20 text-center">
                                        <Upload className={cn("mx-auto mb-4 transition-all duration-300", analyzing ? "animate-bounce text-emerald-600" : "text-slate-400 group-hover:text-emerald-500")} size={40} />
                                        <p className="text-sm font-black text-slate-700 dark:text-slate-200 uppercase tracking-wider">
                                            {analyzing ? "Đang đọc dữ liệu..." : "Kéo thả hoặc bấm để chọn file Excel"}
                                        </p>
                                        <p className="text-xs text-slate-400 mt-2 font-medium">Hỗ trợ định dạng .xlsx, .xls, .csv</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* STEP 2: COLUMN MAPPING */}
                        {/* STEP 2: COLUMN MAPPING */}
                        {step === 2 && (
                            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-8 md:p-10 rounded-[2.5rem] border border-slate-200/80 dark:border-slate-800 shadow-xl max-w-3xl mx-auto">
                                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
                                    <Columns className="text-emerald-600 dark:text-emerald-400" size={24} />
                                    <div>
                                        <h2 className="text-xl font-black text-slate-800 dark:text-slate-100 uppercase">Khớp Cột Dữ Liệu Excel</h2>
                                        <p className="text-xs text-slate-400 font-medium">Tệp: <span className="text-emerald-600 font-bold">{uploadedFileName}</span> ({fileData.length} dòng dữ liệu)</p>
                                    </div>
                                </div>

                                {/* CHỌN DÒNG TIÊU ĐỀ (HEADER ROW) */}
                                <div className="mb-6 p-5 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-2xl border-2 border-emerald-500/30">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="px-2 py-0.5 rounded-md bg-emerald-600 text-white text-[10px] font-black uppercase tracking-wider">Bước 1</span>
                                                <label className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase">
                                                    Chọn Dòng Tiêu Đề Cột (Header Row)
                                                </label>
                                            </div>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                                Hệ thống tự động hỗ trợ <span className="text-emerald-600 dark:text-emerald-400 font-bold">ghép 2 dòng tiêu đề đã merge ô</span> (như bảng Nhập - Xuất - Tồn của kế toán MISA, FAST...).
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setShowSheetPreview(!showSheetPreview)}
                                            className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-300 font-bold text-xs border border-emerald-500/30 shadow-xs hover:bg-emerald-50 dark:hover:bg-slate-700 transition-all flex items-center gap-2 whitespace-nowrap self-start sm:self-auto cursor-pointer"
                                        >
                                            <Eye size={14} />
                                            <span>{showSheetPreview ? "Ẩn bảng tính" : "Xem trước bảng tính"}</span>
                                        </button>
                                    </div>

                                    {/* Header Mode Switcher */}
                                    <div className="flex flex-wrap items-center gap-2 mb-4">
                                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Kiểu tiêu đề:</span>
                                        <div className="flex items-center gap-1.5 p-1 bg-slate-200/60 dark:bg-slate-800 rounded-xl">
                                            <button
                                                type="button"
                                                onClick={() => applyHeaderRow(rawMatrix, headerRowIndex, 'merged_two_rows')}
                                                className={cn(
                                                    "px-3 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer",
                                                    headerMode === 'merged_two_rows'
                                                        ? "bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm"
                                                        : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                                                )}
                                            >
                                                <Sparkles size={13} />
                                                <span>Ghép 2 dòng (Dòng Merge)</span>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => applyHeaderRow(rawMatrix, headerRowIndex, 'single')}
                                                className={cn(
                                                    "px-3 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer",
                                                    headerMode === 'single'
                                                        ? "bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 shadow-sm"
                                                        : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                                                )}
                                            >
                                                <span>1 dòng tiêu đề đơn</span>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Dropdown Selector for Header Row */}
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
                                        <div className="sm:col-span-2">
                                            <select
                                                value={headerRowIndex}
                                                onChange={(e) => applyHeaderRow(rawMatrix, parseInt(e.target.value), headerMode)}
                                                className="w-full bg-white dark:bg-slate-800 border-2 border-emerald-500/40 rounded-xl px-4 py-2.5 font-black text-slate-800 dark:text-slate-100 text-sm focus:border-emerald-600 outline-none shadow-sm cursor-pointer"
                                            >
                                                {rawMatrix.slice(0, 15).map((row, idx) => {
                                                    const rowCells = Array.isArray(row) ? row.filter(c => c !== undefined && c !== null && c !== '').join(' | ') : '';
                                                    return (
                                                        <option key={idx} value={idx}>
                                                            {headerMode === 'merged_two_rows'
                                                                ? `Dòng ${idx + 1} & ${idx + 2}: ${rowCells ? (rowCells.length > 55 ? rowCells.substring(0, 55) + '...' : rowCells) : '(Dòng trống)'}`
                                                                : `Dòng ${idx + 1}: ${rowCells ? (rowCells.length > 60 ? rowCells.substring(0, 60) + '...' : rowCells) : '(Dòng trống)'}`}
                                                        </option>
                                                    );
                                                })}
                                            </select>
                                        </div>
                                        <div className="text-xs font-bold text-slate-500 dark:text-slate-400">
                                            📊 Tải được: <span className="text-emerald-600 dark:text-emerald-400 font-black">{fileData.length}</span> dòng dữ liệu
                                        </div>
                                    </div>

                                    {/* Interactive Sheet Preview Table */}
                                    {showSheetPreview && (
                                        <div className="mt-4 p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-x-auto max-h-72 custom-scrollbar">
                                            <p className="text-[11px] font-black text-slate-400 uppercase mb-2 tracking-wider">
                                                Bấm vào một dòng bên dưới để chọn làm dòng tiêu đề:
                                            </p>
                                            <table className="w-full text-left text-xs border-collapse">
                                                <thead>
                                                    <tr className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-black">
                                                        <th className="py-2 px-3 border-b border-slate-200 dark:border-slate-700 w-24">Vị trí</th>
                                                        <th className="py-2 px-3 border-b border-slate-200 dark:border-slate-700">Nội dung dòng</th>
                                                        <th className="py-2 px-3 border-b border-slate-200 dark:border-slate-700 w-36 text-right">Trạng thái</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                                    {rawMatrix.slice(0, 12).map((row, rIdx) => {
                                                        const isHeader1 = rIdx === headerRowIndex;
                                                        const isHeader2 = headerMode === 'merged_two_rows' && rIdx === headerRowIndex + 1;
                                                        const isBefore = rIdx < headerRowIndex;
                                                        return (
                                                            <tr
                                                                key={rIdx}
                                                                onClick={() => applyHeaderRow(rawMatrix, rIdx, headerMode)}
                                                                className={cn(
                                                                    "cursor-pointer transition-colors",
                                                                    isHeader1
                                                                        ? "bg-emerald-500/15 dark:bg-emerald-500/25 font-bold"
                                                                        : isHeader2
                                                                            ? "bg-blue-500/15 dark:bg-blue-500/25 font-bold"
                                                                            : isBefore
                                                                                ? "opacity-50 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                                                                                : "hover:bg-emerald-50/50 dark:hover:bg-emerald-950/30"
                                                                )}
                                                            >
                                                                <td className="py-2.5 px-3">
                                                                    <span className={cn(
                                                                        "px-2 py-0.5 rounded text-[11px] font-black",
                                                                        isHeader1
                                                                            ? "bg-emerald-600 text-white"
                                                                            : isHeader2
                                                                                ? "bg-blue-600 text-white"
                                                                                : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
                                                                    )}>
                                                                        Dòng {rIdx + 1}
                                                                    </span>
                                                                </td>
                                                                <td className="py-2.5 px-3 font-mono text-[11px] text-slate-700 dark:text-slate-300 max-w-xl truncate">
                                                                    {Array.isArray(row) ? row.filter(c => c !== undefined && c !== null && c !== '').join('  |  ') : '(Trống)'}
                                                                </td>
                                                                <td className="py-2.5 px-3 text-right">
                                                                    {isHeader1 ? (
                                                                        <span className="inline-flex items-center gap-1 text-[11px] font-black text-emerald-600 dark:text-emerald-400">
                                                                            <Check size={14} /> TIÊU ĐỀ 1
                                                                        </span>
                                                                    ) : isHeader2 ? (
                                                                        <span className="inline-flex items-center gap-1 text-[11px] font-black text-blue-600 dark:text-blue-400">
                                                                            <Check size={14} /> TIÊU ĐỀ 2 (CHI TIẾT)
                                                                        </span>
                                                                    ) : isBefore ? (
                                                                        <span className="text-[10px] text-slate-400 font-bold">
                                                                            Bỏ qua
                                                                        </span>
                                                                    ) : (
                                                                        <span className="text-[10px] text-slate-400 font-bold hover:text-emerald-600">
                                                                            Chọn làm đầu
                                                                        </span>
                                                                    )}
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-5">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="px-2 py-0.5 rounded-md bg-slate-800 dark:bg-slate-700 text-white text-[10px] font-black uppercase tracking-wider">Bước 2</span>
                                        <span className="text-xs font-black text-slate-700 dark:text-slate-200 uppercase">Khớp Các Cột Cần Nhập</span>
                                    </div>

                                    {/* Cột Mã hàng */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center p-4 bg-slate-50/70 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                                        <div>
                                            <label className="text-xs font-black text-slate-700 dark:text-slate-200 uppercase block mb-1">Cột Mã Hàng / Mã SP</label>
                                            <p className="text-[11px] text-slate-400">Dùng để so khớp chính xác mã với sản phẩm trong kho.</p>
                                            {mapping.code && fileData[0] && (
                                                <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1 font-bold truncate">
                                                    Ví dụ dòng 1: "{fileData[0][mapping.code] || '(Trống)'}"
                                                </p>
                                            )}
                                        </div>
                                        <select
                                            value={mapping.code}
                                            onChange={(e) => setMapping({ ...mapping, code: e.target.value })}
                                            className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 font-bold text-slate-800 dark:text-slate-100 outline-none focus:border-emerald-500 transition-all text-sm"
                                        >
                                            <option value="">-- Bỏ qua / Không chọn --</option>
                                            {headers.map(h => <option key={h} value={h}>{h}</option>)}
                                        </select>
                                    </div>

                                    {/* Cột Tên hàng */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center p-4 bg-slate-50/70 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                                        <div>
                                            <label className="text-xs font-black text-slate-700 dark:text-slate-200 uppercase block mb-1">Cột Tên Sản Phẩm</label>
                                            <p className="text-[11px] text-slate-400">Dùng để so khớp theo tên khi mã không trùng khớp.</p>
                                            {mapping.name && fileData[0] && (
                                                <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1 font-bold truncate">
                                                    Ví dụ dòng 1: "{fileData[0][mapping.name] || '(Trống)'}"
                                                </p>
                                            )}
                                        </div>
                                        <select
                                            value={mapping.name}
                                            onChange={(e) => setMapping({ ...mapping, name: e.target.value })}
                                            className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 font-bold text-slate-800 dark:text-slate-100 outline-none focus:border-emerald-500 transition-all text-sm"
                                        >
                                            <option value="">-- Bỏ qua / Không chọn --</option>
                                            {headers.map(h => <option key={h} value={h}>{h}</option>)}
                                        </select>
                                    </div>

                                    {/* Cột Tồn kho */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center p-4 bg-slate-50/70 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                                        <div>
                                            <label className="text-xs font-black text-slate-700 dark:text-slate-200 uppercase block mb-1">Cột Tồn Kho / Số Lượng <span className="text-rose-500">*</span></label>
                                            <p className="text-[11px] text-slate-400">Số lượng tồn kho theo sổ sách hoặc file kế toán.</p>
                                            {mapping.stock && fileData[0] && (
                                                <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1 font-bold truncate">
                                                    Ví dụ dòng 1: "{fileData[0][mapping.stock] || '0'}"
                                                </p>
                                            )}
                                        </div>
                                        <select
                                            value={mapping.stock}
                                            onChange={(e) => setMapping({ ...mapping, stock: e.target.value })}
                                            className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 font-bold text-slate-800 dark:text-slate-100 outline-none focus:border-emerald-500 transition-all text-sm"
                                        >
                                            <option value="">-- Chọn cột tồn kho --</option>
                                            {headers.map(h => <option key={h} value={h}>{h}</option>)}
                                        </select>
                                    </div>

                                    {/* Cột Đơn giá / Giá trị tồn kho */}
                                    <div className="p-4 bg-slate-50/70 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-3">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                                            <div>
                                                <label className="text-xs font-black text-slate-700 dark:text-slate-200 uppercase block mb-1">
                                                    Cột Giá Trị Tồn / Đơn Giá Kế Toán
                                                </label>
                                                <p className="text-[11px] text-slate-400">
                                                    Chọn cột Tổng Giá Trị Tồn (Thành tiền) hoặc Cột Đơn Giá từ file kế toán.
                                                </p>
                                                {mapping.price && fileData[0] && (
                                                    <div className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1.5 font-bold space-y-0.5">
                                                        <p>Dữ liệu dòng 1: {Number(fileData[0][mapping.price] || 0).toLocaleString()}đ</p>
                                                        {calcPriceFromTotal && mapping.stock && (
                                                            <p className="text-blue-600 dark:text-blue-400 font-black">
                                                                👉 Đơn giá tự tính = {(parseFloat(fileData[0][mapping.stock]) > 0 ? Math.round(parseFloat(fileData[0][mapping.price]) / parseFloat(fileData[0][mapping.stock])) : 0).toLocaleString()}đ / cái
                                                            </p>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                            <select
                                                value={mapping.price}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    setMapping({ ...mapping, price: val });
                                                    const norm = val.toLowerCase();
                                                    if (norm.includes('giá trị') || norm.includes('thành tiền') || norm.includes('trị giá') || norm.includes('tiền')) {
                                                        setCalcPriceFromTotal(true);
                                                    }
                                                }}
                                                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 font-bold text-slate-800 dark:text-slate-100 outline-none focus:border-emerald-500 transition-all text-sm"
                                            >
                                                <option value="">-- Bỏ qua / Mặc định 0 --</option>
                                                {headers.map(h => <option key={h} value={h}>{h}</option>)}
                                            </select>
                                        </div>

                                        {/* Toggle: Tự tính Đơn giá = Giá trị / Tồn kho */}
                                        <div className="pt-3 border-t border-slate-200/60 dark:border-slate-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                            <label className="flex items-center gap-2.5 cursor-pointer select-none">
                                                <input
                                                    type="checkbox"
                                                    checked={calcPriceFromTotal}
                                                    onChange={(e) => setCalcPriceFromTotal(e.target.checked)}
                                                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 dark:border-slate-600 cursor-pointer"
                                                />
                                                <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                                                    Tự tính lại <span className="text-emerald-600 dark:text-emerald-400 font-black">Đơn giá = Tổng Giá Trị chia cho Tồn kho</span>
                                                </span>
                                            </label>
                                            <span className="text-[10px] font-black uppercase text-amber-700 dark:text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20 w-fit">
                                                Khuyên dùng cho file Nhập Xuất Tồn
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-8 flex justify-end gap-3">
                                    <button
                                        onClick={() => setStep(1)}
                                        className="px-6 py-3.5 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-xs uppercase tracking-wider"
                                    >
                                        Chọn file khác
                                    </button>
                                    <motion.button
                                        whileHover={{ scale: 1.03 }}
                                        whileTap={{ scale: 0.97 }}
                                        onClick={startMatching}
                                        className="px-8 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-emerald-600/20"
                                    >
                                        <span>Bắt đầu đối soát</span>
                                        <ArrowRight size={16} />
                                    </motion.button>
                                </div>
                            </div>
                        )}

                        {/* STEP 3: PRE-CHECK & AUDIT PREVIEW */}
                        {step === 3 && (
                            <div className="space-y-6">
                                {/* Top KPI Statistics */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                                    {/* Tổng bản ghi */}
                                    <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl flex items-center justify-center">
                                                <Layers size={20} />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Tổng Dòng Excel</p>
                                                <p className="text-xl font-black text-slate-900 dark:text-white tabular-nums">{stats.total}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Đã khớp mã */}
                                    <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-5 rounded-2xl border border-emerald-200 dark:border-emerald-900 shadow-sm">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center">
                                                <CheckCircle2 size={20} />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-emerald-600 uppercase tracking-wider">Đã Khớp Mã ({stats.total ? Math.round((stats.matched / stats.total) * 100) : 0}%)</p>
                                                <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 tabular-nums">{stats.matched}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Chưa khớp mã */}
                                    <div className={cn(
                                        "bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-5 rounded-2xl border shadow-sm",
                                        stats.unmatched > 0 ? "border-rose-300 dark:border-rose-900 bg-rose-50/20" : "border-slate-200 dark:border-slate-800"
                                    )}>
                                        <div className="flex items-center gap-3">
                                            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", stats.unmatched > 0 ? "bg-rose-100 dark:bg-rose-950 text-rose-600" : "bg-slate-100 text-slate-400")}>
                                                <AlertCircle size={20} />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Chưa Khớp Mã</p>
                                                <p className={cn("text-xl font-black tabular-nums", stats.unmatched > 0 ? "text-rose-600 dark:text-rose-400 font-black" : "text-slate-900 dark:text-white")}>
                                                    {stats.unmatched}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Lệch tồn */}
                                    <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-5 rounded-2xl border border-amber-200 dark:border-amber-900 shadow-sm">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 rounded-xl flex items-center justify-center">
                                                <AlertTriangle size={20} />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-amber-600 uppercase tracking-wider">Lệch Tồn Kho</p>
                                                <p className="text-xl font-black text-amber-600 dark:text-amber-400 tabular-nums">{stats.discrepancy}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Lệch giá trị */}
                                    <div className="bg-slate-900 dark:bg-slate-950 p-5 rounded-2xl shadow-lg relative overflow-hidden">
                                        <div className="flex items-center gap-3 relative z-10">
                                            <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center text-emerald-400">
                                                <Calculator size={20} />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Lệch Trị Giá</p>
                                                <p className={cn("text-base font-black tabular-nums", stats.discrepancyValue >= 0 ? "text-emerald-400" : "text-rose-400")}>
                                                    {stats.discrepancyValue > 0 ? '+' : ''}{stats.discrepancyValue.toLocaleString()}đ
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Filter Tabs & Search Bar */}
                                <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-md flex flex-col xl:flex-row items-center justify-between gap-4">
                                    {/* Search Input */}
                                    <div className="relative flex-1 group w-full">
                                        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                                        <input
                                            type="text"
                                            placeholder="Tìm kiếm sản phẩm trong bảng đối soát..."
                                            value={importSearch}
                                            onChange={(e) => setImportSearch(e.target.value)}
                                            className="w-full pl-11 pr-4 py-2.5 bg-slate-100/70 dark:bg-slate-800/70 border border-transparent focus:border-emerald-500/30 rounded-xl outline-none font-bold text-sm text-slate-800 dark:text-slate-100 transition-all placeholder:text-slate-400"
                                        />
                                    </div>

                                    {/* Filter Segmented Control */}
                                    <div className="flex flex-wrap items-center gap-2 bg-slate-100/80 dark:bg-slate-800/80 p-1.5 rounded-xl">
                                        {[
                                            { id: 'all', label: `Tất cả (${stats.total})` },
                                            { id: 'matched', label: `🟢 Khớp mã (${stats.matched})` },
                                            { id: 'unmatched', label: `🔴 Chưa khớp (${stats.unmatched})` },
                                            { id: 'discrepancy', label: `🟡 Lệch tồn (${stats.discrepancy})` },
                                            { id: 'perfect', label: `✅ Cân bằng (${stats.perfect})` }
                                        ].map(f => (
                                            <button
                                                key={f.id}
                                                onClick={() => setImportFilter(f.id)}
                                                className={cn(
                                                    "px-3.5 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all",
                                                    importFilter === f.id
                                                        ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm"
                                                        : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                                                )}
                                            >
                                                {f.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Pre-Check Comparison Table */}
                                <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-[2rem] border border-slate-200/80 dark:border-slate-800 shadow-xl overflow-hidden min-h-[500px] flex flex-col">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left border-collapse">
                                            <thead className="bg-slate-900 text-white text-xs">
                                                <tr>
                                                    <th className="px-6 py-4 uppercase font-black tracking-wider cursor-pointer hover:bg-slate-800" onClick={() => setImportSort({ key: 'excelCode', direction: importSort.direction === 'asc' ? 'desc' : 'asc' })}>
                                                        Sản Phẩm (Từ File Excel)
                                                    </th>
                                                    <th className="px-6 py-4 uppercase font-black tracking-wider text-right cursor-pointer hover:bg-slate-800" onClick={() => setImportSort({ key: 'posStock', direction: importSort.direction === 'asc' ? 'desc' : 'asc' })}>
                                                        Kho Thực Tế (POS)
                                                    </th>
                                                    <th className="px-6 py-4 uppercase font-black tracking-wider text-right cursor-pointer hover:bg-slate-800" onClick={() => setImportSort({ key: 'excelStock', direction: importSort.direction === 'asc' ? 'desc' : 'asc' })}>
                                                        Kho Sổ Sách (Excel)
                                                    </th>
                                                    <th className="px-6 py-4 uppercase font-black tracking-wider text-right cursor-pointer hover:bg-slate-800" onClick={() => setImportSort({ key: 'diff', direction: importSort.direction === 'asc' ? 'desc' : 'asc' })}>
                                                        Chênh lệch
                                                    </th>
                                                    <th className="px-6 py-4 uppercase font-black tracking-wider text-center">
                                                        Trạng Thái Khớp Mã & Xử Lý
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                                                {paginatedImportData.map((item) => {
                                                    const posStock = item.matchedProduct ? item.matchedProduct.stock : 0;
                                                    const diff = item.matchedProduct ? (posStock - item.excelStock) : 0;
                                                    const isMatched = item.status === 'matched';

                                                    return (
                                                        <tr key={item.id} className={cn(
                                                            "transition-colors",
                                                            !isMatched ? "bg-rose-50/30 dark:bg-rose-950/20" : "hover:bg-emerald-500/[0.02]"
                                                        )}>
                                                            {/* Excel info */}
                                                            <td className="px-6 py-4">
                                                                <div className="flex flex-col">
                                                                    <span className="font-black text-slate-800 dark:text-slate-100 text-sm">{item.excelName || item.excelCode}</span>
                                                                    <div className="flex items-center gap-2 mt-1">
                                                                        <span className="text-[11px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-500 px-2 py-0.5 rounded">
                                                                            Mã: {item.excelCode}
                                                                        </span>
                                                                        {item.excelPrice > 0 && (
                                                                            <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400">
                                                                                Giá: {item.excelPrice.toLocaleString()}đ
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </td>

                                                            {/* Kho thực tế POS */}
                                                            <td className="px-6 py-4 text-right font-black tabular-nums">
                                                                {isMatched ? (
                                                                    <div className="flex flex-col items-end">
                                                                        <span className="text-base text-emerald-600 dark:text-emerald-400">{posStock}</span>
                                                                        <span className="text-[10px] text-slate-400 font-bold uppercase">{item.matchedProduct.unit || 'ĐVT'}</span>
                                                                    </div>
                                                                ) : (
                                                                    <span className="text-xs text-slate-400 italic">Chưa có</span>
                                                                )}
                                                            </td>

                                                            {/* Kho sổ sách Excel */}
                                                            <td className="px-6 py-4 text-right font-black tabular-nums text-blue-600 dark:text-blue-400">
                                                                <span className="text-base">{item.excelStock}</span>
                                                            </td>

                                                            {/* Chênh lệch */}
                                                            <td className="px-6 py-4 text-right font-black tabular-nums">
                                                                {isMatched ? (
                                                                    diff === 0 ? (
                                                                        <span className="text-slate-400 font-bold">0 (Cân bằng)</span>
                                                                    ) : diff > 0 ? (
                                                                        <span className="text-emerald-600 dark:text-emerald-400 font-black">+{diff} (Thừa)</span>
                                                                    ) : (
                                                                        <span className="text-rose-600 dark:text-rose-400 font-black">{diff} (Thiếu)</span>
                                                                    )
                                                                ) : (
                                                                    <span className="text-xs text-slate-400 font-mono">---</span>
                                                                )}
                                                            </td>

                                                            {/* Status / Actions */}
                                                            <td className="px-6 py-4 text-center">
                                                                {isMatched ? (
                                                                    <div className="flex items-center justify-between gap-3 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-2 rounded-xl border border-emerald-200 dark:border-emerald-900">
                                                                        <div className="flex items-center gap-2 text-left truncate">
                                                                            <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                                                                            <div className="truncate">
                                                                                <p className="text-xs font-black text-slate-800 dark:text-slate-100 truncate">{item.matchedProduct.name}</p>
                                                                                <p className="text-[10px] text-slate-400 font-mono">{item.matchedProduct.code || 'Mã POS'}</p>
                                                                            </div>
                                                                        </div>
                                                                        <button
                                                                            onClick={() => {
                                                                                setSelectedMatchDataId(item.id);
                                                                                setShowMatchModal(true);
                                                                            }}
                                                                            className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 rounded-lg transition-all shrink-0"
                                                                            title="Chọn sản phẩm khác để ghép"
                                                                        >
                                                                            <RefreshCw size={13} />
                                                                        </button>
                                                                    </div>
                                                                ) : (
                                                                    <motion.button
                                                                        whileHover={{ scale: 1.02 }}
                                                                        whileTap={{ scale: 0.98 }}
                                                                        onClick={() => {
                                                                            setSelectedMatchDataId(item.id);
                                                                            setShowMatchModal(true);
                                                                        }}
                                                                        className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-sm transition-all"
                                                                    >
                                                                        <CornerDownRight size={14} />
                                                                        <span>Ghép Mã Thủ Công</span>
                                                                    </motion.button>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>

                                    {paginatedImportData.length === 0 && (
                                        <div className="flex-1 flex flex-col items-center justify-center py-20 text-slate-400">
                                            <Search size={40} className="mb-3 opacity-30 animate-pulse" />
                                            <p className="font-black uppercase tracking-widest text-sm">Không có dữ liệu thỏa điều kiện lọc</p>
                                        </div>
                                    )}

                                    {/* Pagination */}
                                    <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                                        <p className="text-xs font-bold text-slate-400">
                                            Hiển thị {Math.min(filteredImportData.length, (importPage - 1) * importItemsPerPage + 1)} - {Math.min(filteredImportData.length, importPage * importItemsPerPage)} trong {filteredImportData.length} dòng
                                        </p>
                                        <div className="flex items-center gap-2">
                                            <button
                                                disabled={importPage === 1}
                                                onClick={() => setImportPage(importPage - 1)}
                                                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-xs disabled:opacity-30"
                                            >
                                                Trang trước
                                            </button>
                                            <span className="text-xs font-black text-slate-800 dark:text-slate-200 px-2">
                                                Trang {importPage} / {Math.max(1, Math.ceil(filteredImportData.length / importItemsPerPage))}
                                            </span>
                                            <button
                                                disabled={importPage >= Math.ceil(filteredImportData.length / importItemsPerPage)}
                                                onClick={() => setImportPage(importPage + 1)}
                                                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-xs disabled:opacity-30"
                                            >
                                                Trang sau
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Modal Ghép Mã Thủ Công */}
            <AnimatePresence>
                {showMatchModal && createPortal(
                    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => { setShowMatchModal(false); setSelectedMatchDataId(null); }}
                            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden relative z-10 p-6 md:p-8"
                        >
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-rose-50 dark:bg-rose-950/60 text-rose-600 rounded-2xl flex items-center justify-center">
                                        <Search size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black text-slate-900 dark:text-slate-100 leading-tight">Ghép Sản Phẩm Thủ Công</h3>
                                        <p className="text-xs text-slate-400 mt-1">
                                            Dòng Excel: <span className="text-rose-500 font-bold">{matchedData.find(i => i.id === selectedMatchDataId)?.excelName || matchedData.find(i => i.id === selectedMatchDataId)?.excelCode}</span>
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => { setShowMatchModal(false); setSelectedMatchDataId(null); }}
                                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 rounded-xl transition-all"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="space-y-6">
                                <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-700">
                                    <label className="text-xs font-black text-slate-700 dark:text-slate-200 uppercase block mb-2">Chọn sản phẩm từ danh mục hệ thống</label>
                                    <SearchableSelect
                                        options={products}
                                        displayValue={(p) => `${p.name} (${p.code || 'Mã: N/A'}) - Tồn: ${p.stock || 0}`}
                                        valueKey="id"
                                        onChange={(val) => {
                                            const product = products.find(p => p.id === val);
                                            if (product) handleManualMatch(product);
                                        }}
                                        placeholder="Gõ tìm theo tên, mã hoặc hoạt chất..."
                                        className="!bg-white dark:!bg-slate-800 !rounded-xl !py-3 !px-4 !border !border-slate-200 dark:!border-slate-600"
                                    />
                                </div>

                                <div className="p-4 bg-blue-50/60 dark:bg-blue-950/40 rounded-2xl border border-blue-100 dark:border-blue-900/60 flex items-start gap-3">
                                    <AlertCircle size={18} className="text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                                    <p className="text-xs text-blue-700 dark:text-blue-300 font-medium leading-relaxed">
                                        Khi chọn sản phẩm, dòng dữ liệu từ Excel sẽ được gán với sản phẩm tương ứng trong kho POS để tiến hành đối soát và lưu vào sổ kế toán.
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    </div>,
                    document.body
                )}
            </AnimatePresence>

            {/* Quick Audit Popout */}
            {isAuditOpen && auditProduct && createPortal(
                <QuickAuditPopout
                    product={auditProduct}
                    isOpen={isAuditOpen}
                    coordinates={auditCoords}
                    onClose={() => {
                        setIsAuditOpen(false);
                        setAuditProduct(null);
                    }}
                    onSave={handleQuickAuditSave}
                />,
                document.body
            )}
        </div>
    );
}
