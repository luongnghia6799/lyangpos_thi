// agriVoiceParser.js - Bộ phân tích giọng nói chuyên biệt cho vật tư nông nghiệp & phân bón / thuốc BVTV

// Bản đồ chuyển đổi số từ chữ sang số tiếng Việt
const NUM_WORDS = {
  'nửa': 0.5,
  'rưỡi': 0.5,
  'một': 1,
  'mốt': 1,
  'hai': 2,
  'ba': 3,
  'bốn': 4,
  'tư': 4,
  'năm': 5,
  'lăm': 5,
  'sáu': 6,
  'bảy': 7,
  'bẩy': 7,
  'tám': 8,
  'chín': 9,
  'mười': 10,
  'mươi': 10,
  'chục': 10,
  'hai chục': 20,
  'ba chục': 30,
  'bốn chục': 40,
  'năm chục': 50
};

// Các đơn vị tính phổ biến trong cửa hàng nông nghiệp
export const AGRI_UOMS = [
  'gói', 'chai', 'bao', 'kg', 'kí', 'ký', 'can', 'hộp', 'xô', 'túi', 'viên', 'bình', 'cặp', 'ống', 'tấm', 'cái', 'cuộn', 'bộ'
];

/**
 * Xóa dấu tiếng Việt chuẩn
 */
export function removeVietnameseAccents(str) {
  if (!str) return '';
  return str.normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd').replace(/Đ/g, 'D')
    .toLowerCase().trim();
}

/**
 * Phân tích chuỗi giọng nói thành Số lượng, Đơn vị tính và Cụm từ tìm kiếm
 * @param {string} text - Câu nói thu được từ Web Speech API
 * @param {Array} products - Danh sách sản phẩm hiện tại để đối chiếu thông minh
 */
export function parseAgriVoiceInput(text, products = []) {
  if (!text) return { qty: null, uom: null, cleanSearch: '', original: '' };
  
  let raw = text.trim();
  
  // 1. Chuẩn hóa các cụm NPK đặc trưng:
  // "ba số 17" -> "3 số 17", "ba số mười bảy" -> "3 số 17"
  raw = raw.replace(/\bba số\s*(\d+|mười\s*\w+)\b/gi, (match, p1) => {
    let num = p1.toLowerCase() === 'mười bảy' ? '17' : p1;
    return `3 số ${num}`;
  });

  // "hai mươi hai mươi mười lăm" -> "20 20 15"
  raw = raw.replace(/\bhai mươi hai mươi mười lăm\b/gi, '20 20 15');
  // "hai mươi mười lăm năm" -> "20 15 5"
  raw = raw.replace(/\bhai mươi mười lăm năm\b/gi, '20 15 5');
  // "mười sáu đầu trâu" -> "16 đầu trâu"
  raw = raw.replace(/\bmười sáu đầu trâu\b/gi, '16 đầu trâu');

  // 2. Loại bỏ các từ thừa mở đầu như: "lấy", "bán", "cho", "thêm", "tìm", "kiếm"
  raw = raw.replace(/^(lấy|bán|cho tôi|cho|thêm|tìm|kiếm)\s+/i, '');

  let qty = null;
  let uom = null;
  let cleanSearch = raw;

  // 3. Nhận diện mẫu [Số lượng] + [Đơn vị tính] + [Tên sản phẩm]
  const uomPattern = AGRI_UOMS.join('|');
  const regex = new RegExp(`^(\\d+(?:[.,]\\d+)?|\\w+(?:\\s+\\w+)?)\\s+(${uomPattern})\\s+(.+)$`, 'i');
  const match = raw.match(regex);

  if (match) {
    const rawQty = match[1].toLowerCase().trim();
    const parsedNum = parseFloat(rawQty.replace(',', '.'));
    if (!isNaN(parsedNum)) {
      qty = parsedNum;
    } else if (NUM_WORDS[rawQty] !== undefined) {
      qty = NUM_WORDS[rawQty];
    }
    uom = match[2].toLowerCase().trim();
    cleanSearch = match[3].trim();
  } else {
    // Nếu không có ĐVT rõ ràng, kiểm tra xem toàn bộ câu có trùng tên/alias sản phẩm bắt đầu bằng số không
    // Ví dụ "120 tạo màu", "14 7 21", "20 15 5"
    const cleanRaw = raw.toLowerCase();
    const isKnownProductNumber = products.some(p => {
      const a = (p.alias || '').toLowerCase();
      const n = (p.name || '').toLowerCase();
      return a.startsWith(cleanRaw) || cleanRaw.startsWith(a) || n.startsWith(cleanRaw) || cleanRaw.startsWith(n);
    });

    if (!isKnownProductNumber) {
      // Nếu không phải tên sản phẩm có số, tách số lượng ở đầu: ví dụ "5 a rô bát"
      const simpleNumRegex = new RegExp(`^(\\d+(?:[.,]\\d+)?)\\s+(.+)$`, 'i');
      const numMatch = raw.match(simpleNumRegex);
      if (numMatch) {
        qty = parseFloat(numMatch[1].replace(',', '.'));
        cleanSearch = numMatch[2].trim();
      }
    }
  }

  return { qty, uom, cleanSearch, original: text };
}

/**
 * Tìm kiếm & xếp hạng sản phẩm dựa trên câu nói giọng nói
 * @param {string} queryText - Câu nói từ người dùng
 * @param {Array} products - Danh mục sản phẩm
 */
export function matchAgriVoiceProduct(queryText, products = []) {
  const parsed = parseAgriVoiceInput(queryText, products);
  const search = parsed.cleanSearch.toLowerCase().trim();
  const searchNoAccent = removeVietnameseAccents(search);
  const searchNoSpace = searchNoAccent.replace(/[\s\-_./+*()]+/g, '');

  if (!search) {
    return { parsed, topMatch: null, topScore: 0, candidates: [] };
  }

  // Phân rã cụm từ tìm kiếm thành các token từ đơn
  const queryTokens = searchNoAccent.split(/\s+/).filter(Boolean);

  const scored = products.map(p => {
    let score = 0;
    const name = (p.name || '').toLowerCase();
    const nameNoAccent = removeVietnameseAccents(name);
    const nameNoSpace = nameNoAccent.replace(/[\s\-_./+*()]+/g, '');

    const alias = (p.alias || '').toLowerCase();
    const aliasNoAccent = removeVietnameseAccents(alias);
    const aliasNoSpace = aliasNoAccent.replace(/[\s\-_./+*()]+/g, '');

    const brand = (p.brand || '').toLowerCase();
    const brandNoAccent = removeVietnameseAccents(brand);

    const active = (p.active_ingredient || '').toLowerCase();
    const activeNoAccent = removeVietnameseAccents(active);

    const code = (p.code || '').toLowerCase();

    const unit = (p.unit || '').toLowerCase();
    const unitNoAccent = removeVietnameseAccents(unit);

    const combined = `${nameNoAccent} ${aliasNoAccent} ${brandNoAccent} ${activeNoAccent} ${unitNoAccent} ${code}`;
    const combinedNoSpace = combined.replace(/[\s\-_./+*()]+/g, '');

    // 1. Khớp Alias chính xác = Điểm tối cao (tên dân dã quen thuộc)
    if (alias && (alias === search || aliasNoAccent === searchNoAccent)) {
      score += 120;
    } else if (alias && (alias.includes(search) || aliasNoAccent.includes(searchNoAccent))) {
      score += 70;
    }

    // 2. Khớp Tên chính thức (Tiếng Anh hoặc tiếng Việt chuẩn)
    if (name === search || nameNoAccent === searchNoAccent) {
      score += 100;
    } else if (name.startsWith(search) || nameNoAccent.startsWith(searchNoAccent)) {
      score += 65;
    } else if (name.includes(search) || nameNoAccent.includes(searchNoAccent)) {
      score += 45;
    }

    // 3. Khớp Mã SP
    if (code && code === search) {
      score += 85;
    }

    // 4. Khớp dính liền không khoảng trắng (Ví dụ: "cabrio top" -> "cabriotop", "ac gib" -> "acgib")
    if (searchNoSpace.length >= 4) {
      if (nameNoSpace.includes(searchNoSpace)) {
        score += 55;
      } else if (searchNoSpace.includes(nameNoSpace) && nameNoSpace.length >= 5) {
        score += 40;
      }
    }

    // 5. Khớp đa từ (Multi-token coverage) kết hợp Tên + Hãng + Quy cách
    // Ví dụ: "aliette bayer" -> "aliette" ở tên, "bayer" ở brand
    // Ví dụ: "atonik chai" -> "atonik" ở tên, "chai" ở ĐVT
    let matchedTokensCount = 0;
    let nameOrAliasMatchedTokens = 0;

    for (const token of queryTokens) {
      if (token.length < 2) continue;
      const tokenNormY = token.replace(/y/g, 'i');

      const inNameOrAlias = nameNoAccent.includes(token) || 
                            aliasNoAccent.includes(token) ||
                            nameNoSpace.includes(token) ||
                            aliasNoSpace.includes(token) ||
                            nameNoSpace.replace(/y/g, 'i').includes(tokenNormY) ||
                            aliasNoSpace.replace(/y/g, 'i').includes(tokenNormY);

      if (inNameOrAlias) {
        matchedTokensCount++;
        nameOrAliasMatchedTokens++;
      } else {
        const inCombined = combined.includes(token) || 
                           combinedNoSpace.includes(token) ||
                           combinedNoSpace.replace(/y/g, 'i').includes(tokenNormY) ||
                           (token.endsWith('r') && combined.includes(token.slice(0, -1)));
        if (inCombined) {
          matchedTokensCount++;
        }
      }
    }

    if (queryTokens.length > 1 && matchedTokensCount === queryTokens.length) {
      score += 50 + (matchedTokensCount * 15) + (nameOrAliasMatchedTokens * 25);
    } else if (matchedTokensCount > 0) {
      score += (matchedTokensCount * 10) + (nameOrAliasMatchedTokens * 20);
    }

    // 6. Cộng điểm nếu đơn vị tính nói trùng với đơn vị của sản phẩm
    if (parsed.uom && unit && unitNoAccent.includes(removeVietnameseAccents(parsed.uom))) {
      score += 15;
    }

    return { product: p, score };
  })
  .filter(item => item.score > 0)
  .sort((a, b) => b.score - a.score);

  return {
    parsed,
    topMatch: scored[0] ? scored[0].product : null,
    topScore: scored[0] ? scored[0].score : 0,
    candidates: scored.slice(0, 10).map(s => s.product)
  };
}
