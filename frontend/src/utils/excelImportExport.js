import * as XLSX from 'xlsx';
import { saveOrOpenFile } from './downloadHelper';
import axios from 'axios';

/**
 * Normalizes an object's keys to lowercase alphanumeric for flexible column matching
 */
function normalizeRowKeys(row) {
    const normalized = {};
    for (const key of Object.keys(row)) {
        const cleanKey = key.toLowerCase()
            .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // remove Vietnamese accents
            .replace(/[^a-z0-9]/g, '');
        normalized[cleanKey] = row[key];
    }
    return normalized;
}

/**
 * 1. Tải file Excel mẫu để nhập kho sản phẩm
 */
export async function downloadProductTemplate() {
    const templateData = [
        {
            "Mã sản phẩm": "SP001",
            "Tên sản phẩm": "Thuốc trừ bệnh Anvil 5SC (Chai 1L)",
            "Đơn vị tính": "Chai",
            "Đơn vị phụ": "Thùng",
            "Quy đổi": 20,
            "Giá vốn": 85000,
            "Giá bán": 110000,
            "Tồn kho": 100,
            "Mức cảnh báo tồn": 10,
            "Hạn dùng (YYYY-MM-DD)": "2026-12-31",
            "Hoạt chất": "Hexaconazole 50g/l",
            "Hãng sản xuất": "Syngenta",
            "Loại hàng": "Thuốc BVTV",
            "Giá sỉ": 105000,
            "Số lượng sỉ": 5,
            "Tên viết tắt": "ANVIL5SC"
        },
        {
            "Mã sản phẩm": "SP002",
            "Tên sản phẩm": "Phân bón NPK 20-20-15 Đầu Trâu (Bao 50kg)",
            "Đơn vị tính": "Bao",
            "Đơn vị phụ": "Tấn",
            "Quy đổi": 20,
            "Giá vốn": 650000,
            "Giá bán": 720000,
            "Tồn kho": 50,
            "Mức cảnh báo tồn": 10,
            "Hạn dùng (YYYY-MM-DD)": "",
            "Hoạt chất": "N: 20%, P2O5: 20%, K2O: 15%",
            "Hãng sản xuất": "Bình Điền",
            "Loại hàng": "Phân bón",
            "Giá sỉ": 700000,
            "Số lượng sỉ": 10,
            "Tên viết tắt": "NPK202015"
        }
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    ws['!cols'] = [
        { wch: 15 }, // Mã
        { wch: 42 }, // Tên
        { wch: 12 }, // ĐVT
        { wch: 12 }, // ĐV phụ
        { wch: 10 }, // Quy đổi
        { wch: 14 }, // Giá vốn
        { wch: 14 }, // Giá bán
        { wch: 10 }, // Tồn
        { wch: 18 }, // Cảnh báo
        { wch: 22 }, // Hạn dùng
        { wch: 32 }, // Hoạt chất
        { wch: 18 }, // Hãng
        { wch: 18 }, // Loại hàng
        { wch: 14 }, // Giá sỉ
        { wch: 14 }, // Số lượng sỉ
        { wch: 18 }  // Alias
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Mau_Nhap_Kho");
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'base64' });
    return await saveOrOpenFile(wbout, 'mau_nhap_kho.xlsx', true);
}

/**
 * 2. Xuất toàn bộ danh sách sản phẩm ra Excel
 */
export async function exportProductList(existingCategories = []) {
    // Tải toàn bộ danh sách sản phẩm (không phân trang)
    const res = await axios.get('/api/products?limit=10000&include_inactive=true');
    const products = Array.isArray(res.data) ? res.data : (res.data.items || []);

    const categoryMap = new Map();
    existingCategories.forEach(c => categoryMap.set(c.id, c.name));

    const exportRows = products.map((p, idx) => {
        const catName = p.category_name || categoryMap.get(p.category_id) || '';
        const secQty = p.multiplier > 0 ? Math.round((p.stock / p.multiplier) * 100) / 100 : 0;
        return {
            "STT": idx + 1,
            "Mã sản phẩm": p.code || `ID:${p.id}`,
            "Tên sản phẩm": p.name || '',
            "Đơn vị tính": p.unit || 'Cái',
            "Đơn vị phụ": p.secondary_unit || '',
            "Quy đổi": p.multiplier || 1,
            "Giá vốn": Number(p.cost_price) || 0,
            "Giá bán": Number(p.sale_price) || 0,
            "Tồn kho": Number(p.stock) || 0,
            "Tồn phụ": secQty,
            "Mức cảnh báo tồn": Number(p.min_stock) || 0,
            "Hạn sử dụng": p.expiry_date || '',
            "Hoạt chất & Thành phần": p.active_ingredient || '',
            "Hãng sản xuất": p.brand || '',
            "Loại hàng": catName,
            "Giá sỉ": Number(p.bulk_price) || 0,
            "Số lượng sỉ": Number(p.bulk_quantity) || 0,
            "Tên viết tắt": p.alias || '',
            "Trạng thái": p.is_active ? "Đang bán" : "Ngừng theo dõi"
        };
    });

    const ws = XLSX.utils.json_to_sheet(exportRows);
    ws['!cols'] = [
        { wch: 6 },  // STT
        { wch: 15 }, // Mã
        { wch: 40 }, // Tên
        { wch: 12 }, // ĐVT
        { wch: 12 }, // ĐV phụ
        { wch: 10 }, // Quy đổi
        { wch: 14 }, // Giá vốn
        { wch: 14 }, // Giá bán
        { wch: 12 }, // Tồn
        { wch: 12 }, // Tồn phụ
        { wch: 16 }, // Cảnh báo
        { wch: 16 }, // Hạn dùng
        { wch: 32 }, // Hoạt chất
        { wch: 18 }, // Hãng
        { wch: 18 }, // Loại hàng
        { wch: 14 }, // Giá sỉ
        { wch: 14 }, // Số lượng sỉ
        { wch: 18 }, // Alias
        { wch: 16 }  // Trạng thái
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Danh_Sach_San_Pham");
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'base64' });
    const today = new Date().toISOString().slice(0, 10);
    return await saveOrOpenFile(wbout, `danh_sach_san_pham_${today}.xlsx`, true);
}

/**
 * 3. Nhập sản phẩm từ file Excel
 */
export async function importProductsFromExcel(file, onProgress) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async (evt) => {
            try {
                const bstr = evt.target.result;
                const wb = XLSX.read(bstr, { type: 'binary' });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                const rawRows = XLSX.utils.sheet_to_json(ws);

                if (!rawRows || rawRows.length === 0) {
                    throw new Error("File Excel không có dữ liệu hàng nào!");
                }

                // 1. Tải danh mục hiện có để đối chiếu
                const [categoriesRes, existingProdsRes] = await Promise.all([
                    axios.get('/api/categories').catch(() => ({ data: [] })),
                    axios.get('/api/products?limit=10000').catch(() => ({ data: [] }))
                ]);

                const categories = categoriesRes.data || [];
                const existingProducts = Array.isArray(existingProdsRes.data)
                    ? existingProdsRes.data
                    : (existingProdsRes.data?.items || []);

                const existingByCode = new Map();
                const existingByName = new Map();
                existingProducts.forEach(p => {
                    if (p.code) existingByCode.set(p.code.trim().toLowerCase(), p);
                    if (p.name) existingByName.set(p.name.trim().toLowerCase(), p);
                });

                let createdCount = 0;
                let updatedCount = 0;
                let errorCount = 0;

                for (let i = 0; i < rawRows.length; i++) {
                    const r = rawRows[i];
                    const n = normalizeRowKeys(r);

                    // Tìm tên sản phẩm
                    const name = n.tensanpham || n.tenhang || n.tenhanghoa || n.ten || n.name || r['Tên sản phẩm'] || r['Tên hàng'] || '';
                    if (!name || !name.trim()) continue;

                    // Tìm mã sản phẩm
                    const code = (n.masanpham || n.mahang || n.ma || n.code || r['Mã sản phẩm'] || r['Mã hàng'] || '').toString().trim();
                    const unit = (n.donvitinh || n.dvt || n.donvi || n.unit || r['ĐVT'] || 'Cái').toString().trim();
                    const secondary_unit = (n.donviphy || n.donviphụ || n.dvphu || n.secondaryunit || r['Đơn vị phụ'] || '').toString().trim();
                    const multiplier = Number(n.quydoi || n.multiplier || r['Quy đổi']) || 1;
                    const cost_price = Number(n.giavon || n.gianhap || n.costprice || r['Giá vốn']) || 0;
                    const sale_price = Number(n.giaban || n.saleprice || r['Giá bán']) || 0;
                    const stock = Number(n.tonkho || n.ton || n.soluong || n.stock || r['Tồn kho']) || 0;
                    const min_stock = Number(n.muccanhanhton || n.muccanbaoton || n.minstock || r['Mức cảnh báo tồn']) || 0;
                    const expiry_date = (n.handung || n.hansudung || n.expirydate || r['Hạn dùng'] || r['Hạn sử dụng'] || '').toString().trim();
                    const active_ingredient = (n.hoatchat || n.thanhphan || n.activeingredient || r['Hoạt chất'] || '').toString().trim();
                    const brand = (n.hangsanxuat || n.hang || n.thuonghieu || n.brand || r['Hãng sản xuất'] || r['Hãng'] || '').toString().trim();
                    const bulk_price = Number(n.giasi || n.bulkprice || r['Giá sỉ']) || 0;
                    const bulk_quantity = Number(n.soluongsi || n.bulkquantity || r['Số lượng sỉ']) || 0;
                    const alias = (n.tenviettat || n.alias || r['Tên viết tắt'] || '').toString().trim();

                    // Tìm category
                    const catRaw = (n.loaihang || n.nhomsanpham || n.category || r['Loại hàng'] || '').toString().trim();
                    let category_id = null;
                    if (catRaw) {
                        const matchedCat = categories.find(c => c.name.toLowerCase() === catRaw.toLowerCase());
                        if (matchedCat) {
                            category_id = matchedCat.id;
                        }
                    }

                    const payload = {
                        name: name.trim(),
                        code: code || null,
                        unit: unit || 'Cái',
                        secondary_unit: secondary_unit || null,
                        multiplier: multiplier > 0 ? multiplier : 1,
                        cost_price,
                        sale_price,
                        stock,
                        min_stock,
                        expiry_date: expiry_date || null,
                        active_ingredient: active_ingredient || null,
                        brand: brand || null,
                        category_id,
                        bulk_price: bulk_price > 0 ? bulk_price : null,
                        bulk_quantity: bulk_quantity > 0 ? bulk_quantity : null,
                        alias: alias || null,
                        is_active: true
                    };

                    try {
                        const existing = (code && existingByCode.get(code.toLowerCase())) || existingByName.get(name.trim().toLowerCase());
                        if (existing) {
                            await axios.put(`/api/products/${existing.id}`, { ...existing, ...payload });
                            updatedCount++;
                        } else {
                            await axios.post('/api/products', payload);
                            createdCount++;
                        }
                    } catch (err) {
                        console.error(`Lỗi nhập hàng ${name}:`, err);
                        errorCount++;
                    }

                    onProgress?.(Math.round(((i + 1) / rawRows.length) * 100));
                }

                resolve({
                    success: true,
                    total: rawRows.length,
                    createdCount,
                    updatedCount,
                    errorCount,
                    message: `Đã nhập thành công ${createdCount + updatedCount} sản phẩm (${createdCount} mới, ${updatedCount} cập nhật)!`
                });
            } catch (err) {
                reject(err);
            }
        };
        reader.onerror = reject;
        reader.readAsBinaryString(file);
    });
}

/**
 * 4. Tải file Excel mẫu để nhập danh sách đối tác
 */
export async function downloadPartnerTemplate() {
    const templateData = [
        {
            "Mã đối tác": "KH001",
            "Tên đối tác / Khách hàng": "Nguyễn Văn An",
            "Loại đối tác": "Khách hàng",
            "Số điện thoại": "0912345678",
            "Địa chỉ": "Ấp 1, Xã Bình Minh, Huyện Chợ Mới",
            "Nhóm đối tác": "Khách VIP",
            "Dư nợ ban đầu": 0,
            "Ghi chú": "Khách mua vật tư lúa vụ Đông Xuân"
        },
        {
            "Mã đối tác": "NCC001",
            "Tên đối tác / Khách hàng": "Công ty TNHH Syngenta Việt Nam",
            "Loại đối tác": "Nhà cung cấp",
            "Số điện thoại": "0283838383",
            "Địa chỉ": "Khu công nghiệp Biên Hòa 2, Đồng Nai",
            "Nhóm đối tác": "Nhà cung cấp chính",
            "Dư nợ ban đầu": 0,
            "Ghi chú": "Chiết khấu 5% theo quý"
        }
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    ws['!cols'] = [
        { wch: 15 }, // Mã
        { wch: 35 }, // Tên
        { wch: 16 }, // Loại
        { wch: 16 }, // SĐT
        { wch: 40 }, // Địa chỉ
        { wch: 18 }, // Nhóm
        { wch: 16 }, // Dư nợ
        { wch: 35 }  // Ghi chú
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Mau_Nhap_Doi_Tac");
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'base64' });
    return await saveOrOpenFile(wbout, 'mau_nhap_doi_tac.xlsx', true);
}

/**
 * 5. Xuất toàn bộ danh sách đối tác ra Excel
 */
export async function exportPartnerList() {
    const res = await axios.get('/api/partners');
    const partners = Array.isArray(res.data) ? res.data : (res.data.items || []);

    const exportRows = partners.map((p, idx) => ({
        "STT": idx + 1,
        "Mã đối tác": p.code || `ID:${p.id}`,
        "Tên đối tác": p.name || '',
        "Loại đối tác": p.type === 'supplier' ? "Nhà cung cấp" : "Khách hàng",
        "Số điện thoại": p.phone || '',
        "Địa chỉ": p.address || '',
        "Nhóm đối tác": p.group_name || 'Mặc định',
        "Dư nợ hiện tại": Number(p.current_debt) || 0,
        "Ghi chú": p.notes || ''
    }));

    const ws = XLSX.utils.json_to_sheet(exportRows);
    ws['!cols'] = [
        { wch: 6 },  // STT
        { wch: 15 }, // Mã
        { wch: 35 }, // Tên
        { wch: 16 }, // Loại
        { wch: 16 }, // SĐT
        { wch: 40 }, // Địa chỉ
        { wch: 18 }, // Nhóm
        { wch: 18 }, // Dư nợ
        { wch: 35 }  // Ghi chú
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Danh_Sach_Doi_Tac");
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'base64' });
    const today = new Date().toISOString().slice(0, 10);
    return await saveOrOpenFile(wbout, `danh_sach_doi_tac_${today}.xlsx`, true);
}

/**
 * 6. Nhập danh sách đối tác từ file Excel
 */
export async function importPartnersFromExcel(file, onProgress) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async (evt) => {
            try {
                const bstr = evt.target.result;
                const wb = XLSX.read(bstr, { type: 'binary' });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                const rawRows = XLSX.utils.sheet_to_json(ws);

                if (!rawRows || rawRows.length === 0) {
                    throw new Error("File Excel không có dữ liệu!");
                }

                // Tải danh sách đối tác hiện có để đối chiếu
                const res = await axios.get('/api/partners').catch(() => ({ data: [] }));
                const existingPartners = Array.isArray(res.data) ? res.data : (res.data?.items || []);

                const existingByCode = new Map();
                const existingByPhone = new Map();
                const existingByName = new Map();

                existingPartners.forEach(p => {
                    if (p.code) existingByCode.set(p.code.trim().toLowerCase(), p);
                    if (p.phone) existingByPhone.set(p.phone.trim().replace(/\s+/g, ''), p);
                    if (p.name) existingByName.set(p.name.trim().toLowerCase(), p);
                });

                let createdCount = 0;
                let updatedCount = 0;
                let errorCount = 0;

                for (let i = 0; i < rawRows.length; i++) {
                    const r = rawRows[i];
                    const n = normalizeRowKeys(r);

                    const name = n.tendoitac || n.tenkhachhang || n.ten || n.name || r['Tên đối tác / Khách hàng'] || r['Tên đối tác'] || '';
                    if (!name || !name.trim()) continue;

                    const code = (n.madoitac || n.makh || n.ma || n.code || r['Mã đối tác'] || '').toString().trim();
                    const phone = (n.sodienthoai || n.sdt || n.phone || r['Số điện thoại'] || '').toString().trim();
                    const address = (n.diachi || n.address || r['Địa chỉ'] || '').toString().trim();
                    const group_name = (n.nhomdoitac || n.nhom || n.group || r['Nhóm đối tác'] || 'Mặc định').toString().trim();
                    const current_debt = Number(n.dunobanndau || n.dunobandau || n.duno || n.no || r['Dư nợ ban đầu'] || r['Dư nợ hiện tại']) || 0;
                    const notes = (n.ghichu || n.notes || r['Ghi chú'] || '').toString().trim();

                    // Xác định type (Khách hàng vs Nhà cung cấp)
                    const typeRaw = (n.loaidoitac || n.loai || n.type || r['Loại đối tác'] || '').toString().toLowerCase();
                    const type = (typeRaw.includes('cung cap') || typeRaw.includes('ncc') || typeRaw.includes('supplier'))
                        ? 'supplier'
                        : 'customer';

                    const payload = {
                        name: name.trim(),
                        code: code || null,
                        phone: phone || null,
                        address: address || null,
                        group_name: group_name || 'Mặc định',
                        current_debt,
                        notes: notes || null,
                        type
                    };

                    try {
                        const cleanPhone = phone.replace(/\s+/g, '');
                        const existing = (code && existingByCode.get(code.toLowerCase()))
                            || (cleanPhone && existingByPhone.get(cleanPhone))
                            || existingByName.get(name.trim().toLowerCase());

                        if (existing) {
                            await axios.put(`/api/partners/${existing.id}`, { ...existing, ...payload });
                            updatedCount++;
                        } else {
                            await axios.post('/api/partners', payload);
                            createdCount++;
                        }
                    } catch (err) {
                        console.error(`Lỗi nhập đối tác ${name}:`, err);
                        errorCount++;
                    }

                    onProgress?.(Math.round(((i + 1) / rawRows.length) * 100));
                }

                resolve({
                    success: true,
                    total: rawRows.length,
                    createdCount,
                    updatedCount,
                    errorCount,
                    message: `Đã nhập thành công ${createdCount + updatedCount} đối tác (${createdCount} mới, ${updatedCount} cập nhật)!`
                });
            } catch (err) {
                reject(err);
            }
        };
        reader.onerror = reject;
        reader.readAsBinaryString(file);
    });
}
