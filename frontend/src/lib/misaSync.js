import axios from "axios";

/**
 * Normalizes text for matching codes, names, and aliases
 */
export const cleanMisaStr = (s) => (s || '').replace(/[\u200B-\u200D\uFEFF]/g, '').trim().toLowerCase().normalize('NFC');

/**
 * Intelligent 5-stage matching between MISA items and POS products
 * Returns mapped list with matched product reference
 */
export function matchMisaItemsWithProducts(misaItems, products) {
    if (!Array.isArray(misaItems) || !Array.isArray(products)) return [];

    return misaItems.map((item, idx) => {
        const rawCode = item.code || '';
        const rawName = item.name || '';
        const excelStock = Number(item.stock) || 0;
        const excelPrice = Math.round(Number(item.price) || 0);
        const excelUnit = item.unit || '';

        const normCode = cleanMisaStr(rawCode);
        const normName = cleanMisaStr(rawName);

        // Skip empty or total rows
        if (!normCode && !normName) return null;
        if (normCode === 'tổng cộng' || normName === 'tổng cộng' || normCode === 'cộng' || normName === 'cộng' || normCode.startsWith('tổng cộng') || normName.startsWith('tổng cộng')) {
            return null;
        }

        // Intelligent 5-stage matching
        let matched = null;
        // Stage 1: Exact code match
        if (normCode) {
            matched = products.find(p => cleanMisaStr(p.code) === normCode);
        }
        // Stage 2: Exact name match
        if (!matched && normName) {
            matched = products.find(p => cleanMisaStr(p.name) === normName);
        }
        // Stage 3: Match MISA code with POS product name
        if (!matched && normCode) {
            matched = products.find(p => cleanMisaStr(p.name) === normCode);
        }
        // Stage 4: Match MISA name with POS product code
        if (!matched && normName) {
            matched = products.find(p => cleanMisaStr(p.code) === normName);
        }
        // Stage 5: Match alias
        if (!matched && (normCode || normName)) {
            matched = products.find(p => {
                const normAlias = cleanMisaStr(p.alias);
                return normAlias && (normAlias === normCode || normAlias === normName);
            });
        }

        return {
            id: idx,
            excelCode: rawCode || (matched ? matched.code : '') || `MISA_${idx + 1}`,
            excelName: rawName || rawCode,
            excelStock,
            excelPrice,
            excelUnit,
            excelRow: item,
            matchedProduct: matched || null,
            status: matched ? 'matched' : 'unmatched'
        };
    }).filter(Boolean);
}

/**
 * Load MISA configuration from backend or localStorage
 */
export async function getMisaConfig() {
    let cfg = {
        api_url: 'https://actapp.misa.vn',
        app_id: '',
        access_code: '',
        org_company_code: '',
        branch_id: '',
        stock_code: '',
        to_date: ''
    };
    try {
        const res = await axios.get('/api/misa/config');
        if (res.data) {
            cfg = { ...cfg, ...res.data };
        }
    } catch {
        const saved = localStorage.getItem('misa_amis_config');
        if (saved) {
            try {
                cfg = { ...cfg, ...JSON.parse(saved) };
            } catch {}
        }
    }
    return cfg;
}

/**
 * Fetch inventory balance from MISA
 */
export async function fetchMisaInventory(configOverride = null) {
    const savedConfig = await getMisaConfig();
    const config = { ...savedConfig, ...(configOverride || {}) };

    if (!config.app_id?.trim() || !config.access_code?.trim()) {
        throw new Error("Chưa cấu hình MISA (thiếu App ID hoặc Access Code). Vui lòng cấu hình trong mục Sổ Kế Toán!");
    }

    let items = null;

    // 1. Try backend proxy
    try {
        const res = await axios.post('/api/misa/sync-inventory', config);
        if (res.data && res.data.success && Array.isArray(res.data.items)) {
            items = res.data.items;
        }
    } catch (backendErr) {
        console.warn("Backend MISA sync error, trying direct client fetch:", backendErr);
        if (backendErr.response?.data?.error && !backendErr.response.data.error.includes("404")) {
            throw new Error(backendErr.response.data.error);
        }
    }

    // 2. Direct client fallback
    if (!items) {
        const baseUrl = (config.api_url || 'https://actapp.misa.vn').replace(/\/+$/, '');
        const connectUrl = `${baseUrl}/api/oauth/actopen/connect`;

        const connectRes = await axios.post(connectUrl, {
            app_id: config.app_id.trim(),
            access_code: config.access_code.trim(),
            org_company_code: config.org_company_code?.trim() || ''
        });

        if (!connectRes.data?.Success) {
            throw new Error(connectRes.data?.ErrorMessage || "MISA từ chối xác thực kết nối");
        }

        let token = null;
        const rawConnData = connectRes.data.Data;
        if (typeof rawConnData === 'string') {
            try {
                const parsed = JSON.parse(rawConnData);
                token = parsed.access_token || parsed.AccessToken || parsed.token || rawConnData;
            } catch {
                token = rawConnData;
            }
        } else if (typeof rawConnData === 'object' && rawConnData) {
            token = rawConnData.access_token || rawConnData.AccessToken || rawConnData.token;
        }

        if (!token) throw new Error("Không nhận được access_token từ MISA");

        const invUrl = `${baseUrl}/apir/sync/actopen/get_list_inventory_balance`;
        let allItems = [];
        let skip = 0;
        const take = 500;

        while (true) {
            const invRes = await axios.post(invUrl, {
                app_id: config.app_id.trim(),
                branch_id: config.branch_id?.trim() || null,
                skip,
                take,
                last_sync_time: null
            }, {
                headers: {
                    'X-MISA-AccessToken': token,
                    'Content-Type': 'application/json'
                }
            });

            if (!invRes.data?.Success) {
                throw new Error(invRes.data?.ErrorMessage || "Lỗi khi lấy dữ liệu tồn kho từ MISA");
            }

            const rawInvData = invRes.data?.Data;
            let dataArr = [];
            if (typeof rawInvData === 'string') {
                try {
                    dataArr = JSON.parse(rawInvData) || [];
                } catch {
                    dataArr = [];
                }
            } else if (Array.isArray(rawInvData)) {
                dataArr = rawInvData;
            }

            if (dataArr.length === 0) break;

            for (const item of dataArr) {
                const itemStockCode = (item.stock_code || item.StockCode || '').trim();
                if (config.stock_code?.trim() && itemStockCode !== config.stock_code.trim()) {
                    continue;
                }

                const code = (item.inventory_item_code || item.InventoryItemCode || '').trim();
                const name = (item.inventory_item_name || item.InventoryItemName || '').trim();
                const unit = (item.unit_name || item.UnitName || '').trim();
                const stock = Number(item.quantity_balance ?? item.Quantity ?? item.quantity ?? 0);
                const amount = Number(item.amount_balance ?? item.Amount ?? item.amount ?? 0);
                const explicitPrice = Number(item.unit_price ?? item.UnitPrice ?? 0);
                const price = explicitPrice > 0 ? Math.round(explicitPrice) : (stock !== 0 && amount !== 0 ? Math.round(amount / stock) : 0);
                const stockName = (item.stock_name || item.StockName || '').trim();

                allItems.push({
                    code,
                    name,
                    stock,
                    unit,
                    price,
                    amount,
                    stock_code: itemStockCode,
                    stock_name: stockName
                });
            }

            if (dataArr.length < take) break;
            skip += take;
            if (skip > 50000) break;
        }

        items = allItems;
    }

    return { items, config };
}

/**
 * Directly execute full MISA inventory sync & auto-update accounting inventory
 */
export async function executeMisaAccountingSync(productsList, configOverride = null) {
    const { items, config } = await fetchMisaInventory(configOverride);

    if (!items || items.length === 0) {
        throw new Error("Không có dữ liệu tồn kho từ MISA cho cấu hình đã chọn!");
    }

    let targetProducts = productsList;
    if (!targetProducts || targetProducts.length === 0) {
        const prodRes = await axios.get('/api/products');
        targetProducts = Array.isArray(prodRes.data) ? prodRes.data : (prodRes.data?.items || []);
    }

    const matchedResults = matchMisaItemsWithProducts(items, targetProducts);

    // Filter matched and construct update payload - NEVER update unit!
    const updateList = matchedResults
        .filter(item => item.matchedProduct)
        .map(item => ({
            id: item.matchedProduct.id,
            accounting_price: item.excelPrice || 0,
            accounting_stock: item.excelStock || 0
        }));

    if (updateList.length === 0) {
        return {
            success: false,
            message: `Tìm thấy ${items.length} mặt hàng trên MISA nhưng không có sản phẩm nào khớp với POS.`,
            items,
            matchedResults,
            updateCount: 0,
            totalItems: items.length,
            config
        };
    }

    // Direct database update
    await axios.post('/api/products/bulk-accounting-update', updateList);

    // Notify other components & tabs
    try {
        const syncChannel = new BroadcastChannel("pos_data_sync");
        syncChannel.postMessage({ type: "PRODUCT_UPDATED" });
        syncChannel.close();
    } catch {}

    const stockInfo = config.stock_code ? ` (Kho: ${config.stock_code})` : '';
    return {
        success: true,
        message: `Đã tự động cập nhật ${updateList.length}/${items.length} sản phẩm từ MISA${stockInfo} vào kho kế toán!`,
        items,
        matchedResults,
        updateCount: updateList.length,
        totalItems: items.length,
        config
    };
}

