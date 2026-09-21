export const CATEGORY_LABELS = {
    fungicide: { label: 'Trừ nấm / Bệnh', color: 'bg-emerald-500/10 text-emerald-800 dark:text-emerald-400 border-emerald-500/30' },
    insecticide: { label: 'Trừ sâu / Rầy / Bọ trĩ', color: 'bg-rose-500/10 text-rose-800 dark:text-rose-400 border-rose-500/30' },
    herbicide: { label: 'Trừ cỏ', color: 'bg-amber-500/10 text-amber-800 dark:text-amber-400 border-amber-500/30' },
    pgr: { label: 'Sinh trưởng / Dưỡng / Phân', color: 'bg-teal-500/10 text-teal-800 dark:text-teal-400 border-teal-500/30' },
    custom: { label: 'Cửa hàng (Đã nhớ)', color: 'bg-[#8b6f47]/15 text-[#5c4028] dark:text-[#d4a574] border-[#8b6f47]/40' },
};

export const POPULAR_ACTIVE_INGREDIENTS = [
    // --- THUỐC TRỪ NẤM / BỆNH (Fungicides) ---
    { name: 'Difenoconazole', category: 'fungicide', aliases: ['difenoconazol', 'score'] },
    { name: 'Azoxystrobin', category: 'fungicide', aliases: ['azoxy', 'amistar'] },
    { name: 'Hexaconazole', category: 'fungicide', aliases: ['hexa', 'anvil'] },
    { name: 'Metalaxyl', category: 'fungicide', aliases: ['metalaxil'] },
    { name: 'Metalaxyl-M', category: 'fungicide', aliases: ['mefenoxam', 'ridomil'] },
    { name: 'Mancozeb', category: 'fungicide', aliases: ['dithane', 'man'] },
    { name: 'Propiconazole', category: 'fungicide', aliases: ['tilt', 'propi'] },
    { name: 'Tricyclazole', category: 'fungicide', aliases: ['beam', 'dao on'] },
    { name: 'Isoprothiolane', category: 'fungicide', aliases: ['fuji-one', 'dao on'] },
    { name: 'Chlorothalonil', category: 'fungicide', aliases: ['daconil'] },
    { name: 'Validamycin', category: 'fungicide', aliases: ['validacin', 'kho van'] },
    { name: 'Fosetyl-Aluminium', category: 'fungicide', aliases: ['aliette', 'fosetyl'] },
    { name: 'Kasugamycin', category: 'fungicide', aliases: ['kasumin', 'vi khuan'] },
    { name: 'Ningnanmycin', category: 'fungicide', aliases: ['ningnan', 'khang sinh'] },
    { name: 'Dimethomorph', category: 'fungicide', aliases: ['dimetho', 'suong mai'] },
    { name: 'Copper Oxychloride', category: 'fungicide', aliases: ['dong clorua', 'coc 85'] },
    { name: 'Copper Hydroxide', category: 'fungicide', aliases: ['dong hydroxide', 'kocide'] },
    { name: 'Streptomycin sulfate', category: 'fungicide', aliases: ['strepto', 'tri khuan'] },
    { name: 'Oxytetracycline', category: 'fungicide', aliases: ['oxytera', 'khang sinh'] },
    { name: 'Carbendazim', category: 'fungicide', aliases: ['derosal', 'carben'] },
    { name: 'Tebuconazole', category: 'fungicide', aliases: ['tebu', 'folicur'] },
    { name: 'Trifloxystrobin', category: 'fungicide', aliases: ['trifloxy', 'nativo'] },
    { name: 'Pyraclostrobin', category: 'fungicide', aliases: ['pyraclo', 'cabrio'] },
    { name: 'Kresoxim-methyl', category: 'fungicide', aliases: ['kresoxim'] },
    { name: 'Cymoxanil', category: 'fungicide', aliases: ['cymo', 'curzate'] },
    { name: 'Propineb', category: 'fungicide', aliases: ['antracol'] },
    { name: 'Zineb', category: 'fungicide', aliases: ['zineb'] },
    { name: 'Thiram', category: 'fungicide', aliases: ['thiram'] },
    { name: 'Captan', category: 'fungicide', aliases: ['captan'] },
    { name: 'Folpet', category: 'fungicide', aliases: ['folpan'] },
    { name: 'Iprodione', category: 'fungicide', aliases: ['rovrall'] },
    { name: 'Boscalid', category: 'fungicide', aliases: ['boscalid', 'cantus'] },
    { name: 'Fluopyram', category: 'fungicide', aliases: ['fluopyram', 'luna'] },
    { name: 'Fluxapyroxad', category: 'fungicide', aliases: ['sercadis'] },
    { name: 'Pencycuron', category: 'fungicide', aliases: ['monceren'] },
    { name: 'Fludioxonil', category: 'fungicide', aliases: ['maxim', 'celest'] },
    { name: 'Hymexazol', category: 'fungicide', aliases: ['tachigaren'] },
    { name: 'Polyoxin', category: 'fungicide', aliases: ['polyoxin'] },
    { name: 'Sulfur (Lưu huỳnh)', category: 'fungicide', aliases: ['luu huynh', 'kumulus'] },
    { name: 'Chitosan', category: 'fungicide', aliases: ['chitosan', 'vo tom'] },

    // --- THUỐC TRỪ SÂU / RẦY / BỌ TRĨ / NHỆN (Insecticides & Acaricides) ---
    { name: 'Thiamethoxam', category: 'insecticide', aliases: ['thiam', 'actara', 'ray'] },
    { name: 'Dinotefuran', category: 'insecticide', aliases: ['dino', 'osumit', 'chess', 'ray nau'] },
    { name: 'Emamectin benzoate', category: 'insecticide', aliases: ['emamectin', 'ema', 'sau cuon la'] },
    { name: 'Abamectin', category: 'insecticide', aliases: ['aba', 'sau to', 'nhen do'] },
    { name: 'Chlorantraniliprole', category: 'insecticide', aliases: ['virtako', 'prevathon', 'sau duc than'] },
    { name: 'Cyantraniliprole', category: 'insecticide', aliases: ['benevia', 'minecto'] },
    { name: 'Flubendiamide', category: 'insecticide', aliases: ['takumi', 'sau duc than'] },
    { name: 'Imidacloprid', category: 'insecticide', aliases: ['confidor', 'imida'] },
    { name: 'Acetamiprid', category: 'insecticide', aliases: ['mospilan', 'bo tri'] },
    { name: 'Clothianidin', category: 'insecticide', aliases: ['clothia', 'dantotsu'] },
    { name: 'Buprofezin', category: 'insecticide', aliases: ['applaud', 'chong lot xac'] },
    { name: 'Pymetrozine', category: 'insecticide', aliases: ['chess', 'chong chich hut'] },
    { name: 'Spinetoram', category: 'insecticide', aliases: ['radiant', 'bo tri'] },
    { name: 'Spinosad', category: 'insecticide', aliases: ['success'] },
    { name: 'Fipronil', category: 'insecticide', aliases: ['regen', 'duoi sau'] },
    { name: 'Indoxacarb', category: 'insecticide', aliases: ['amplithe', 'sau khoang'] },
    { name: 'Diafenthiuron', category: 'insecticide', aliases: ['pegasus', 'nhen do'] },
    { name: 'Lufenuron', category: 'insecticide', aliases: ['match'] },
    { name: 'Cartap', category: 'insecticide', aliases: ['padan', 'sau duc than'] },
    { name: 'Fenobucarb (BPMC)', category: 'insecticide', aliases: ['bass', 'ray xanh'] },
    { name: 'Isoprocarb (MIPC)', category: 'insecticide', aliases: ['mipcin'] },
    { name: 'Chlorpyrifos Ethyl', category: 'insecticide', aliases: ['chlorpyri'] },
    { name: 'Cypermethrin', category: 'insecticide', aliases: ['cyp', 'sherpa'] },
    { name: 'Alpha-cypermethrin', category: 'insecticide', aliases: ['fastac'] },
    { name: 'Deltamethrin', category: 'insecticide', aliases: ['decis'] },
    { name: 'Lambda-cyhalothrin', category: 'insecticide', aliases: ['karate'] },
    { name: 'Permethrin', category: 'insecticide', aliases: ['permet'] },
    { name: 'Carbosulfan', category: 'insecticide', aliases: ['marshal'] },
    { name: 'Benfuracarb', category: 'insecticide', aliases: ['oncol'] },
    { name: 'Tebufenozide', category: 'insecticide', aliases: ['mimic'] },
    { name: 'Methoxyfenozide', category: 'insecticide', aliases: ['prodigy'] },
    { name: 'Pyriproxyfen', category: 'insecticide', aliases: ['admiral'] },
    { name: 'Hexythiazox', category: 'insecticide', aliases: ['nissorun', 'tri trung nhen'] },
    { name: 'Propargite', category: 'insecticide', aliases: ['omite'] },
    { name: 'Pyridaben', category: 'insecticide', aliases: ['sanmite'] },
    { name: 'Fenpyroximate', category: 'insecticide', aliases: ['ortus'] },
    { name: 'Spirodiclofen', category: 'insecticide', aliases: ['envidor'] },
    { name: 'Spiromesifen', category: 'insecticide', aliases: ['oberon'] },
    { name: 'Spirotetramat', category: 'insecticide', aliases: ['movento', 'rep sap'] },
    { name: 'Matrine', category: 'insecticide', aliases: ['matrine', 'thao moc'] },
    { name: 'Azadirachtin', category: 'insecticide', aliases: ['neem', 'dau neem'] },
    { name: 'Bacillus thuringiensis (Bt)', category: 'insecticide', aliases: ['bt', 'vi sinh'] },

    // --- THUỐC TRỪ CỎ (Herbicides) ---
    { name: 'Glufosinate-ammonium', category: 'herbicide', aliases: ['basta', 'glufosinate', 'co khai hoang'] },
    { name: 'Glyphosate', category: 'herbicide', aliases: ['roundup', 'co luu dan'] },
    { name: 'Pretilachlor', category: 'herbicide', aliases: ['sofit', 'co tien nay mam'] },
    { name: 'Butachlor', category: 'herbicide', aliases: ['machete'] },
    { name: 'Bispyribac-sodium', category: 'herbicide', aliases: ['nominee', 'co hau nay mam'] },
    { name: '2,4-D', category: 'herbicide', aliases: ['24d', 'co la rong'] },
    { name: 'Atrazine', category: 'herbicide', aliases: ['atrazin', 'co bap', 'co mia'] },
    { name: 'Fenoxaprop-P-ethyl', category: 'herbicide', aliases: ['whip'] },
    { name: 'Cyhalofop-butyl', category: 'herbicide', aliases: ['clincher', 'co long vuc'] },
    { name: 'Quinclorac', category: 'herbicide', aliases: ['facet'] },
    { name: 'Pyrazosulfuron-ethyl', category: 'herbicide', aliases: ['sirius'] },
    { name: 'Bensulfuron-methyl', category: 'herbicide', aliases: ['londax'] },
    { name: 'Penoxsulam', category: 'herbicide', aliases: ['rainbow'] },
    { name: 'Oxadiazon', category: 'herbicide', aliases: ['ronstar'] },
    { name: 'Clethodim', category: 'herbicide', aliases: ['select'] },
    { name: 'Haloxyfop-P-methyl', category: 'herbicide', aliases: ['gallant super'] },
    { name: 'Metolachlor', category: 'herbicide', aliases: ['dual gold'] },
    { name: 'Acetochlor', category: 'herbicide', aliases: ['harness'] },

    // --- ĐIỀU HÒA SINH TRƯỞNG & VI LƯỢNG (PGR & Nutrients) ---
    { name: 'Gibberellic Acid (GA3)', category: 'pgr', aliases: ['ga3', 'tang truong', 'keo dot'] },
    { name: 'Paclobutrazol', category: 'pgr', aliases: ['paclo', 'xu ly ra hoa', 'ham dot'] },
    { name: 'Brassinolide', category: 'pgr', aliases: ['brassin', 'chong soc', 'khoe cay'] },
    { name: 'NAA (Alpha-Naphthylacetic acid)', category: 'pgr', aliases: ['naa', 'kich ra re', 'dau trai'] },
    { name: 'IBA (Indole-3-butyric acid)', category: 'pgr', aliases: ['iba', 'kich re'] },
    { name: 'CPPU (Forchlorfenuron)', category: 'pgr', aliases: ['cppu', 'lon trai'] },
    { name: 'Ethephon', category: 'pgr', aliases: ['ethephon', 'chin trai', 'mo mu'] },
    { name: 'Cytokinin', category: 'pgr', aliases: ['cytokinin', 'phan nhanh'] },
    { name: 'Amino Acid', category: 'pgr', aliases: ['amino', 'dam ca'] },
    { name: 'Acid Humic', category: 'pgr', aliases: ['humic', 'cai tao dat'] },
    { name: 'Acid Fulvic', category: 'pgr', aliases: ['fulvic'] },
    { name: 'Seaweed Extract (Rong biển)', category: 'pgr', aliases: ['rong bien', 'mat cay'] },
    { name: 'Bo (Boron)', category: 'pgr', aliases: ['bo', 'chong rung hoa'] },
    { name: 'Kẽm (Zinc / Zn)', category: 'pgr', aliases: ['kem', 'zn', 'xanh la'] },
    { name: 'Canxi (Calcium / Ca)', category: 'pgr', aliases: ['canxi', 'chong nut trai'] },
    { name: 'Magie (Magnesium / Mg)', category: 'pgr', aliases: ['magie', 'quang hop'] },
    { name: 'Silic (Silicon / Si)', category: 'pgr', aliases: ['silic', 'cung cay'] },
];

/**
 * Tách chuỗi hoạt chất thành danh sách các tag riêng biệt
 * Ví dụ: "Azoxystrobin 200g/l + Difenoconazole 125g/l" => ["Azoxystrobin 200g/l", "Difenoconazole 125g/l"]
 */
export function parseActiveIngredients(rawString) {
    if (!rawString || typeof rawString !== 'string') return [];
    return rawString
        .split(/[+,;]+/)
        .map(s => s.trim())
        .filter(Boolean);
}

/**
 * Ghép các tag lại thành chuỗi chuẩn "Hoạt chất 1 + Hoạt chất 2"
 */
export function stringifyActiveIngredients(tagList) {
    if (!Array.isArray(tagList)) return '';
    return tagList
        .map(t => typeof t === 'string' ? t.trim() : (t.name || '').trim())
        .filter(Boolean)
        .join(' + ');
}

/**
 * Trích xuất các hoạt chất đã có trong danh sách sản phẩm hiện tại để tự học
 */
export function extractActiveIngredientsFromProducts(products) {
    if (!Array.isArray(products)) return [];
    const discovered = new Set();
    products.forEach(p => {
        if (p && p.active_ingredient) {
            const parts = parseActiveIngredients(p.active_ingredient);
            parts.forEach(part => {
                // Tách bỏ số lượng hàm lượng nếu cần, lấy tên gốc
                const clean = part.replace(/\s+\d+.*$/i, '').trim();
                if (clean && clean.length > 2) {
                    discovered.add(clean);
                }
            });
        }
    });
    return Array.from(discovered);
}

const CUSTOM_STORAGE_KEY = 'lyang_custom_active_ingredients';

/**
 * Lọc và tự động dọn dẹp các mảnh gõ dở dang (ví dụ 'm', 'me', 'met', 'meta', 'metal' khi gõ 'metalaxyl')
 */
export function sanitizeCustomIngredients(list) {
    if (!Array.isArray(list)) return [];

    const standardNames = POPULAR_ACTIVE_INGREDIENTS.map(p => p.name.toLowerCase());

    // 1. Chuẩn hóa về object { name, category, createdAt }
    const items = list.map(item => {
        if (typeof item === 'string') return { name: item.trim(), category: 'custom', createdAt: Date.now() };
        return { ...item, name: (item.name || '').trim() };
    }).filter(item => {
        // Loại bỏ rác quá ngắn (< 3 ký tự)
        if (!item.name || item.name.length < 3) return false;
        // Nếu tên trùng với từ điển chuẩn thì không cần lưu custom
        if (standardNames.includes(item.name.toLowerCase())) return false;
        return true;
    });

    // 2. Sắp xếp theo chiều dài giảm dần (từ dài, hoàn chỉnh xét trước)
    items.sort((a, b) => b.name.length - a.name.length);

    // 3. Loại bỏ những từ ngắn là tiền tố gõ dở của từ chuẩn hoặc từ custom dài hơn
    const cleaned = [];
    for (const item of items) {
        const lower = item.name.toLowerCase();

        // Kiểm tra xem có phải tiền tố gõ dở của từ chuẩn trong từ điển không
        // Ví dụ 'met', 'meta', 'metal' là tiền tố của 'metalaxyl'
        const isPrefixOfStandard = standardNames.some(s => s.startsWith(lower) && s !== lower && lower.length < 8);
        if (isPrefixOfStandard) continue;

        // Kiểm tra xem có phải tiền tố của từ custom dài hơn đã nhận không
        const isPrefixOfCustom = cleaned.some(c => c.name.toLowerCase().startsWith(lower) && c.name.toLowerCase() !== lower);
        if (isPrefixOfCustom) continue;

        // Tránh trùng lặp
        if (!cleaned.some(c => c.name.toLowerCase() === lower)) {
            cleaned.push(item);
        }
    }

    return cleaned;
}

/**
 * Lấy danh sách các hoạt chất do người dùng tự gõ thêm đã lưu trong máy (tự động dọn rác tiền tố)
 */
export function getCustomActiveIngredients() {
    try {
        const stored = localStorage.getItem(CUSTOM_STORAGE_KEY);
        if (stored) {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed)) {
                const cleaned = sanitizeCustomIngredients(parsed);
                // Tự động ghi đè danh sách đã làm sạch để triệt tiêu vĩnh viễn dữ liệu rác
                if (cleaned.length !== parsed.length) {
                    try {
                        localStorage.setItem(CUSTOM_STORAGE_KEY, JSON.stringify(cleaned));
                    } catch (err) {}
                }
                return cleaned;
            }
        }
    } catch (e) {
        console.warn('Error reading custom active ingredients from localStorage', e);
    }
    return [];
}

/**
 * Tự động ghi nhớ hoạt chất mới vào máy vĩnh viễn (loại bỏ các tiền tố gõ dở trước đó)
 */
export function saveCustomActiveIngredient(name, category = 'custom') {
    if (!name || typeof name !== 'string') return;
    const trimmed = name.trim();
    if (trimmed.length < 3) return;

    // Không lưu nếu đã có sẵn trong từ điển chuẩn
    const isStandard = POPULAR_ACTIVE_INGREDIENTS.some(p => p.name.toLowerCase() === trimmed.toLowerCase());
    if (isStandard) return getCustomActiveIngredients();

    const currentList = getCustomActiveIngredients();
    const lowerTrimmed = trimmed.toLowerCase();

    // Loại bỏ mọi tiền tố gõ dở trước đó của từ này (ví dụ nếu trước đó lỡ có 'met', 'meta' thì gỡ đi)
    const filtered = currentList.filter(item => {
        const itemName = (typeof item === 'string' ? item : item.name).toLowerCase();
        if (itemName === lowerTrimmed) return false;
        if (lowerTrimmed.startsWith(itemName) && itemName.length < lowerTrimmed.length) return false;
        return true;
    });

    const updated = [{ name: trimmed, category, createdAt: Date.now() }, ...filtered];
    try {
        localStorage.setItem(CUSTOM_STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
        console.warn('Error saving custom active ingredient', e);
    }
    return updated;
}

/**
 * Xóa hoạt chất tự tạo khỏi bộ nhớ máy nếu gõ sai
 */
export function removeCustomActiveIngredient(name) {
    if (!name) return;
    const trimmed = name.trim().toLowerCase();
    const list = getCustomActiveIngredients();
    const filtered = list.filter(item => (typeof item === 'string' ? item : item.name).toLowerCase() !== trimmed);
    try {
        localStorage.setItem(CUSTOM_STORAGE_KEY, JSON.stringify(filtered));
    } catch (e) {}
    return filtered;
}

