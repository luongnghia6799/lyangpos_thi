import React, { useState, useEffect, useRef, useMemo } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { 
    BrainCircuit, Sparkles, Send, Trash2, ShoppingCart, 
    Check, Leaf, X, Copy, 
    CheckCheck, Image as ImageIcon,
    FlaskConical, Droplets, Maximize2, Minimize2
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const QUICK_SUGGESTIONS = [
    { label: '🌿 Bọ trĩ sầu riêng', query: 'Cây sầu riêng đang bị bọ trĩ chích hút đọt non và lá non, nên dùng hoạt chất gì và thuốc nào trong kho?' },
    { label: '🌾 Đạo ôn & Đốm vằn lúa', query: 'Lúa trổ đẹt bị đạo ôn cổ bông và đốm vằn, tư vấn thuốc đặc trị có trong kho và cách phun hiệu quả?' },
    { label: '🍂 Xì mủ nứt thân', query: 'Sầu riêng bị xì mủ nứt thân chảy nhựa do nấm Phytophthora, dùng hoạt chất nào quét gốc và phun xịt?' },
    { label: '🐛 Rầy phấn trắng', query: 'Rầy phấn trắng đã bị kháng thuốc, cửa hàng có hoạt chất nào mới hoặc công thức phối trộn nào hiệu quả?' },
    { label: '🌶️ Thán thư ớt/xoài', query: 'Bệnh thán thư thối trái trên ớt/xoài mùa mưa, dùng hoạt chất nào trị dứt điểm?' },
    { label: '🌱 Vàng lá thối rễ', query: 'Cây bị vàng lá thối rễ, tư vấn phác đồ xử lý nấm tuyến trùng và kích rễ phục hồi?' }
];

export default function AiConsultantModal({ 
    isOpen, 
    onClose, 
    onAddToCart, 
    mascotPos = { x: 800, y: 500 }, 
    mascotSize = 110 
}) {
    const [messages, setMessages] = useState(() => {
        try {
            const saved = localStorage.getItem('lyang_ai_consult_chat');
            if (saved) {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed) && parsed.length === 1 && parsed[0].id === 'welcome') {
                    parsed[0].text = 'Xin chào! Tôi là **LyangAI - Cố Vấn Hoạt Chất & Nông Nghiệp Thông Minh**.\n\nHãy nhập triệu chứng cây trồng, loại sâu bệnh hoặc gửi ảnh để tôi tra cứu hoạt chất và đối chiếu thuốc trong kho giúp bạn!';
                }
                return parsed;
            }
        } catch (e) {}
        return [
            {
                id: 'welcome',
                role: 'model',
                text: 'Xin chào! Tôi là **LyangAI - Cố Vấn Hoạt Chất & Nông Nghiệp Thông Minh**.\n\nHãy nhập triệu chứng cây trồng, loại sâu bệnh hoặc gửi ảnh để tôi tra cứu hoạt chất và đối chiếu thuốc trong kho giúp bạn!',
                recommended_products: []
            }
        ];
    });

    const [fontSize, setFontSize] = useState(() => {
        try {
            const saved = localStorage.getItem('lyang_ai_font_size');
            if (saved) {
                const num = parseFloat(saved);
                if (!isNaN(num) && num >= 11 && num <= 22) return num;
            }
        } catch (e) {}
        return 13;
    });

    const handleFontSizeChange = (delta) => {
        setFontSize(prev => {
            const next = Math.min(22, Math.max(11, Math.round((prev + delta) * 10) / 10));
            try {
                localStorage.setItem('lyang_ai_font_size', next.toString());
            } catch (e) {}
            return next;
        });
    };

    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [selectedImages, setSelectedImages] = useState([]);
    const [copiedIndex, setCopiedIndex] = useState(null);
    const [addedProducts, setAddedProducts] = useState({});
    const [isExpanded, setIsExpanded] = useState(false);

    const popoverRef = useRef(null);
    const chatFeedRef = useRef(null);
    const chatEndRef = useRef(null);
    const latestModelMsgRef = useRef(null);
    const prevMsgLengthRef = useRef(messages.length);
    const shouldScrollToAiRef = useRef(false);
    const inputRef = useRef(null);
    const fileInputRef = useRef(null);

    // Bấm ESC để đóng Popover
    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                e.stopPropagation();
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown, true);
        return () => window.removeEventListener('keydown', handleKeyDown, true);
    }, [isOpen, onClose]);

    // Tính toán vị trí Popover bám sát cạnh Mascot & chiều cao từ dưới lên
    const popoverStyle = useMemo(() => {
        if (typeof window === 'undefined') return { top: 100, left: 100, width: 440, height: 540 };
        const winW = window.innerWidth;
        const winH = window.innerHeight;

        const popW = isExpanded ? Math.min(620, winW - 24) : Math.min(430, winW - 24);
        const popH = isExpanded ? Math.min(700, winH - 24) : Math.min(540, winH - 24);

        // Lấy tọa độ thực tế trực tiếp từ DOM của Mascot
        let mX = mascotPos?.x ?? 800;
        let mY = mascotPos?.y ?? 500;
        let mSize = mascotSize ?? 110;

        try {
            const mascotEl = document.querySelector('.group.select-none');
            if (mascotEl) {
                const rect = mascotEl.getBoundingClientRect();
                if (rect.width > 0 && rect.height > 0) {
                    mX = rect.left;
                    mY = rect.top;
                    mSize = rect.width;
                }
            }
        } catch (e) {}

        // Trục ngang: Đặt sát bên Mascot (khoảng cách chỉ 4px)
        let left = 8;
        let originX = '0%';
        if (mX + mSize / 2 < winW / 2) {
            // Mascot ở bên trái -> Popover nằm ngay bên phải Mascot sát nút
            left = mX + mSize + 4;
            if (left + popW > winW - 8) {
                left = Math.max(8, winW - popW - 8);
            }
            originX = '0%';
        } else {
            // Mascot ở bên phải -> Popover nằm ngay bên trái Mascot sát nút
            left = mX - popW - 4;
            if (left < 8) {
                left = 8;
            }
            originX = '100%';
        }

        // Trục dọc: Đáy Popover thẳng hàng với đáy Mascot (chiều cao từ dưới lên)
        let top = mY + mSize - popH;
        let originY = '100%';

        if (top < 8) {
            top = 8;
        }
        if (top + popH > winH - 8) {
            top = Math.max(8, winH - popH - 8);
        }

        return {
            left: `${Math.round(left)}px`,
            top: `${Math.round(top)}px`,
            width: `${Math.round(popW)}px`,
            height: `${Math.round(popH)}px`,
            originX,
            originY
        };
    }, [mascotPos, mascotSize, isExpanded, isOpen]);

    // Close when clicking outside
    useEffect(() => {
        if (!isOpen) return;
        const handlePointerDownOutside = (e) => {
            if (popoverRef.current && !popoverRef.current.contains(e.target)) {
                const mascotEl = document.querySelector('.group.select-none');
                if (mascotEl && mascotEl.contains(e.target)) return;
                onClose();
            }
        };
        window.addEventListener('pointerdown', handlePointerDownOutside);
        return () => window.removeEventListener('pointerdown', handlePointerDownOutside);
    }, [isOpen, onClose]);

    // Lưu tin nhắn vào LocalStorage
    useEffect(() => {
        try {
            localStorage.setItem('lyang_ai_consult_chat', JSON.stringify(messages));
        } catch (e) {}
    }, [messages]);

    // Điều khiển cuộn thông minh:
    // Khi AI trả lời xong: cuộn đến ĐẦU câu trả lời của AI để người dùng bắt đầu đọc rồi cuộn xuống
    // Khi người dùng gửi câu hỏi hoặc đang phân tích (loading): cuộn xuống đáy để thấy câu hỏi và loader
    useEffect(() => {
        if (!isOpen) return;

        const isNewAiMessage = shouldScrollToAiRef.current && 
            messages.length > prevMsgLengthRef.current && 
            messages[messages.length - 1]?.role === 'model';

        if (isNewAiMessage) {
            shouldScrollToAiRef.current = false;
            const timer = setTimeout(() => {
                if (latestModelMsgRef.current) {
                    latestModelMsgRef.current.scrollIntoView({ 
                        behavior: 'smooth', 
                        block: 'start' 
                    });
                }
            }, 60);
            prevMsgLengthRef.current = messages.length;
            return () => clearTimeout(timer);
        } else if (isLoading || (messages.length > prevMsgLengthRef.current && messages[messages.length - 1]?.role === 'user')) {
            const timer = setTimeout(() => {
                chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
            }, 60);
            prevMsgLengthRef.current = messages.length;
            return () => clearTimeout(timer);
        } else {
            prevMsgLengthRef.current = messages.length;
        }
    }, [isOpen, messages, isLoading]);

    // Khi mở modal lần đầu: focus ô nhập, cuộn mượt đến đầu tin nhắn AI mới nhất nếu có
    useEffect(() => {
        if (isOpen) {
            const timer = setTimeout(() => {
                inputRef.current?.focus();
                if (messages.length > 1 && latestModelMsgRef.current) {
                    latestModelMsgRef.current.scrollIntoView({ behavior: 'auto', block: 'start' });
                }
            }, 80);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    const handleClearChat = () => {
        const welcomeMsg = [
            {
                id: 'welcome',
                role: 'model',
                text: 'Xin chào! Tôi là **LyangAI - Cố Vấn Hoạt Chất & Nông Nghiệp Thông Minh**.\n\nHãy nhập triệu chứng cây trồng, loại sâu bệnh hoặc gửi ảnh để tôi tra cứu hoạt chất và đối chiếu thuốc trong kho giúp bạn!',
                recommended_products: []
            }
        ];
        setMessages(welcomeMsg);
        localStorage.setItem('lyang_ai_consult_chat', JSON.stringify(welcomeMsg));
        toast.success('Đã xóa lịch sử trò chuyện LyangAI');
    };

    const handleCopy = (text, idx) => {
        navigator.clipboard.writeText(text);
        setCopiedIndex(idx);
        toast.success('Đã sao chép tư vấn vào clipboard!');
        setTimeout(() => setCopiedIndex(null), 2000);
    };

    const handleImageSelect = (e) => {
        const files = Array.from(e.target.files || []);
        if (!files.length) return;

        files.slice(0, 3).forEach(file => {
            const reader = new FileReader();
            reader.onload = (event) => {
                setSelectedImages(prev => [...prev, event.target.result]);
            };
            reader.readAsDataURL(file);
        });
    };

    const handleRemoveImage = (index) => {
        setSelectedImages(prev => prev.filter((_, i) => i !== index));
    };

    // Client-side fallback gọi Gemini trực tiếp nếu backend endpoint chưa sẵn sàng
    const callGeminiDirectClient = async ({ message, history, images }) => {
        let apiKeys = [];
        try {
            const settingsRes = await axios.get('/api/settings');
            if (settingsRes.data) {
                const s = settingsRes.data;
                ['gemini_api_key', 'gemini_api_key_2', 'gemini_api_key_3'].forEach(k => {
                    if (s[k] && s[k].trim()) {
                        const parts = s[k].trim().split(/[,;\n]/);
                        parts.forEach(p => {
                            const trimmed = p.trim();
                            if (trimmed && !apiKeys.includes(trimmed)) {
                                apiKeys.push(trimmed);
                            }
                        });
                    }
                });
            }
        } catch (e) {}

        if (apiKeys.length === 0) {
            const localKey = (localStorage.getItem('gemini_api_key') || '').trim();
            if (localKey) apiKeys.push(localKey);
        }

        if (apiKeys.length === 0) {
            return {
                reply: '⚠️ Bạn chưa cấu hình **Gemini API Key** trong phần Cài Đặt. Vui lòng vào **Cài đặt -> Tích hợp AI** để nhập Gemini API Key của bạn.',
                recommended_products: []
            };
        }

        // Lấy danh sách sản phẩm để làm ngữ cảnh
        let productKB = 'DANH MỤC SẢN PHẨM & HOẠT CHẤT TRONG KHO CỬA HÀNG:\n';
        let productList = [];
        let storeActivesStr = '(Chưa có thông tin hoạt chất)';
        try {
            const prodRes = await axios.get('/api/products');
            productList = Array.isArray(prodRes.data) ? prodRes.data : (prodRes.data?.data || []);
            if (productList.length > 0) {
                // Ưu tiên sản phẩm có hoạt chất & còn tồn kho lên đầu
                productList.sort((a, b) => {
                    const aHas = (a.active_ingredient && a.active_ingredient.trim()) ? 1 : 0;
                    const bHas = (b.active_ingredient && b.active_ingredient.trim()) ? 1 : 0;
                    if (aHas !== bHas) return bHas - aHas;
                    return (b.stock || 0) - (a.stock || 0);
                });

                const uniqueActives = [];
                productList.forEach(p => {
                    if (p.active_ingredient && p.active_ingredient.trim()) {
                        const act = p.active_ingredient.trim();
                        if (!uniqueActives.some(x => x.toLowerCase() === act.toLowerCase())) {
                            uniqueActives.push(act);
                        }
                    }
                });
                if (uniqueActives.length > 0) {
                    storeActivesStr = uniqueActives.join(', ');
                }

                productList.slice(0, 500).forEach(p => {
                    const active = p.active_ingredient || 'Chưa có';
                    const unit = p.unit || '';
                    const price = p.sale_price || 0;
                    const stock = p.stock || 0;
                    productKB += `- [ID:${p.id}] Tên: ${p.name} | Hoạt chất: ${active} | ĐVT: ${unit} | Giá: ${price}đ | Tồn: ${stock}\n`;
                });
            }
        } catch (e) {
            productKB += '(Không thể đọc danh mục sản phẩm từ server)\n';
        }

        const systemInstruction = `Bạn là LyangAI - Chuyên gia Cố vấn Nông nghiệp & Dược học Cây trồng cao cấp (Plant Protection & Agronomy AI Expert) của cửa hàng LyangPOS.

★★★ NGUYÊN TẮC CỐ VẤN TỐI THƯỢNG (BẮT BUỘC TUÂN THỦ):
1. **ƯU TIÊN TUYỆT ĐỐI CÁC HOẠT CHẤT & SẢN PHẨM ĐANG CÓ SẴN TRONG KHO**:
   - Mục tiêu sống còn của bạn là **TƯ VẤN VÀ ĐỀ XUẤT ĐƯỢC CÁC SẢN PHẨM ĐANG CÓ HÀNG TRONG KHO CỬA HÀNG**.
   - BẮT BUỘC quét qua DANH SÁCH HOẠT CHẤT TRONG KHO (mục 2 bên dưới) trước tiên khi nhận câu hỏi của bà con nông dân.
   - **ĐẶC BIỆT TÍCH CỰC GIỚI THIỆU CÁC HOẠT CHẤT MỚI / THẾ HỆ MỚI / TIÊN TIẾN CÓ TRONG KHO**:
     Ví dụ: Metaflumizone, Spinetoram, Flupyrimin, Sulfoxaflor, Fluopyram, Pydiflumetofen, Oxathiapiprolin, Chlorfenapyr, Pyriproxyfen, Lufenuron, Fenpyroximate, Flonicamid, Tolfenpyrad, Fluxapyroxad, Mandipropamid, Fenamidone, v.v...
   - **TUYỆT ĐỐI KHÔNG ĐƯỢC CHỈ QUANH QUẨN GỢI Ý CÁC HOẠT CHẤT CŨ TRÊN SÁCH VỞ** (như chỉ chăm chăm nói Difenoconazole, Mancozeb, Thiamethoxam, Abamectin) nếu trong kho cửa hàng đang có các hoạt chất mới hơn, đặc trị mạnh hơn và chưa bị lờn thuốc!
   - Hãy giải thích rõ cho bà con: vì sao hoạt chất mới trong kho này lại vượt trội (cơ chế diệt trừ mới lạ, bẻ gãy tính kháng thuốc của sâu/bọ/rầy/nấm, hiệu lực kéo dài, mát cây không gây cháy đọt non hoặc rụng bông/trái).

2. **DANH SÁCH TOÀN BỘ HOẠT CHẤT CỬA HÀNG ĐANG CÓ SẴN TRONG KHO (HÃY ƯU TIÊN CHỌN TRONG ĐÂY ĐẦU TIÊN)**:
${storeActivesStr}

3. **CÁC BƯỚC CỐ VẤN CHI TIẾT**:
   - Bước 1: Chuẩn đoán ngắn gọn nguyên nhân gây bệnh/sâu hại.
   - Bước 2: **Đề xuất ngay các hoạt chất có trong kho cửa hàng** (ưu tiên hoạt chất mới/thế hệ mới nếu có trong kho). Nếu kho không có hoạt chất mới thì mới đề xuất các hoạt chất phổ thông có trong kho.
   - Bước 3: **Chỉ định chính xác tên thương phẩm của sản phẩm đang có trong kho** chứa hoạt chất đó.
     Lưu ý: Một số thuốc trong kho có thể chưa được điền cột hoạt chất nhưng tên thương mại đã thể hiện rõ công dụng (Ví dụ: Beam, Tilt Super, Amistar, Flash, Filia, Nativo, Ridomil Gold, Score, Antracol, Topsin...), hãy nhận diện và giới thiệu từ kho!
   - Bước 4: **HƯỚNG DẪN LIỀU LƯỢNG PHA CỤ THỂ**: Bắt buộc ghi rõ liều pha cho bình 16L, 25L hoặc phuy 200L (Ví dụ: Pha 20-25ml/bình 25L hoặc 1 chai/phuy 200L), thời điểm phun (sáng sớm/chiều mát) và kỹ thuật phun đạt hiệu quả tối đa.
   - Bước 5: Hướng dẫn luân phiên đổi gốc hoạt chất để chống lờn thuốc và lưu ý phối trộn an toàn.
   - Bước 6: Định dạng Markdown sinh động, rõ ràng, gạch đầu dòng mạch lạc.

${productKB}

QUY TẮC BẮT BUỘC VỀ DỮ LIỆU ĐỀ XUẤT:
Ở cuối câu trả lời, nếu có gợi ý sản phẩm cụ thể từ danh sách cửa hàng, bạn BẮT BUỘC xuất kèm khối JSON code block:
\`\`\`recommended_products
[
  {
    "id": 123,
    "name": "Tên sản phẩm",
    "active_ingredient": "Hoạt chất",
    "dosage": "Liều dùng: 20-25ml/bình 25L hoặc 1 chai/phuy 200L",
    "sale_price": 150000,
    "unit": "Chai",
    "stock": 15
  }
]
\`\`\`
Nếu không có sản phẩm phù hợp từ kho, xuất:
\`\`\`recommended_products
[]
\`\`\``;

        const contents = [];
        if (history && Array.isArray(history)) {
            history.forEach(h => {
                contents.push({
                    role: h.role === 'user' ? 'user' : 'model',
                    parts: [{ text: h.text }]
                });
            });
        }

        const userParts = [{ text: message }];
        if (images && images.length > 0) {
            images.forEach(dataUrl => {
                if (dataUrl) {
                    const idx = dataUrl.indexOf(';base64,');
                    const mime = idx !== -1 ? dataUrl.substring(5, idx) : 'image/jpeg';
                    const b64 = idx !== -1 ? dataUrl.substring(idx + 8) : dataUrl;
                    userParts.push({
                        inline_data: {
                            mime_type: mime,
                            data: b64
                        }
                    });
                }
            });
        }
        contents.push({ role: 'user', parts: userParts });

        const requestBody = {
            systemInstruction: { parts: [{ text: systemInstruction }] },
            contents: contents,
            generationConfig: {
                temperature: 0.3,
                maxOutputTokens: 65536
            }
        };

        const models = [
            'gemini-3.5-flash-lite',
            'gemini-flash-lite-latest',
            'gemini-2.5-flash',
            'gemini-2.0-flash',
            'gemini-1.5-flash'
        ];
        let replyText = '';
        let lastError = '';

        keyLoop: for (let k = 0; k < apiKeys.length; k++) {
            const currentKey = apiKeys[k];
            for (const model of models) {
                try {
                    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${currentKey}`;
                    const res = await axios.post(url, requestBody, {
                        headers: { 'Content-Type': 'application/json' },
                        timeout: 18000
                    });
                    if (res.data?.candidates?.[0]?.content?.parts?.[0]?.text) {
                        replyText = res.data.candidates[0].content.parts[0].text.trim();
                        break keyLoop;
                    }
                } catch (err) {
                    lastError = `Key #${k + 1} (${model}): ` + (err.response?.data?.error?.message || err.message);
                }
            }
        }

        if (!replyText) {
            return {
                reply: `❌ Không thể nhận phản hồi từ Gemini API sau khi thử ${apiKeys.length} key (${lastError || 'Lỗi kết nối'}). Vui lòng kiểm tra lại Gemini API Key trong Cài đặt.`,
                recommended_products: []
            };
        }

        // Bóc tách khối recommended_products
        let recommended_products = [];
        let cleanReply = replyText;

        if (replyText.includes('```recommended_products')) {
            const startTag = replyText.indexOf('```recommended_products');
            const afterStart = replyText.substring(startTag + 23);
            const endTag = afterStart.indexOf('```');
            if (endTag !== -1) {
                const jsonStr = afterStart.substring(0, endTag).trim();
                try {
                    recommended_products = JSON.parse(jsonStr);
                } catch (e) {}
                const fullEnd = startTag + 23 + endTag + 3;
                cleanReply = (replyText.substring(0, startTag).trimEnd() + '\n' + replyText.substring(fullEnd)).trim();
            }
        } else if (replyText.includes('```json')) {
            const startTag = replyText.indexOf('```json');
            const afterStart = replyText.substring(startTag + 7);
            const endTag = afterStart.indexOf('```');
            if (endTag !== -1) {
                const jsonStr = afterStart.substring(0, endTag).trim();
                try {
                    const parsed = JSON.parse(jsonStr);
                    if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].id) {
                        recommended_products = parsed;
                        const fullEnd = startTag + 7 + endTag + 3;
                        cleanReply = (replyText.substring(0, startTag).trimEnd() + '\n' + replyText.substring(fullEnd)).trim();
                    }
                } catch (e) {}
            }
        }

        // Fallback tự động: nếu AI quên block JSON nhưng nhắc đến tên sản phẩm có trong danh mục kho
        if (recommended_products.length === 0 && productList.length > 0) {
            const replyLower = cleanReply.toLowerCase();
            for (const p of productList) {
                if (p.name && p.name.length >= 4 && replyLower.includes(p.name.toLowerCase())) {
                    recommended_products.push({
                        id: p.id,
                        name: p.name,
                        active_ingredient: p.active_ingredient || '',
                        dosage: 'Theo hướng dẫn bao bì / liều lượng khuyến nghị trên',
                        sale_price: p.sale_price || 0,
                        unit: p.unit || '',
                        stock: p.stock || 0
                    });
                    if (recommended_products.length >= 6) break;
                }
            }
        }

        return {
            reply: cleanReply,
            recommended_products
        };
    };

    const handleSend = async (queryText = null) => {
        const textToSend = (queryText || input).trim();
        if ((!textToSend && selectedImages.length === 0) || isLoading) return;

        const userMsg = {
            id: Date.now().toString(),
            role: 'user',
            text: textToSend,
            images: selectedImages.length > 0 ? [...selectedImages] : undefined
        };

        const newMessages = [...messages, userMsg];
        setMessages(newMessages);
        setInput('');
        setSelectedImages([]);
        shouldScrollToAiRef.current = true;
        setIsLoading(true);

        try {
            const history = newMessages
                .filter(m => m.id !== 'welcome')
                .slice(-8)
                .map(m => ({
                    role: m.role,
                    text: m.text
                }));

            let result = null;

            // 1. Thử gọi backend Rust endpoint
            try {
                const response = await axios.post('/api/ai/consult', {
                    message: textToSend,
                    history: history.slice(0, -1),
                    images: userMsg.images
                }, { timeout: 15000 });

                if (response.data && typeof response.data === 'object' && response.data.reply) {
                    result = response.data;
                }
            } catch (e) {}

            // 2. Fallback gọi trực tiếp Gemini API nếu backend chưa có hoặc lỗi
            if (!result || !result.reply) {
                result = await callGeminiDirectClient({
                    message: textToSend,
                    history: history.slice(0, -1),
                    images: userMsg.images
                });
            }

            const modelMsg = {
                id: (Date.now() + 1).toString(),
                role: 'model',
                text: result?.reply || 'Không có phản hồi từ AI.',
                recommended_products: result?.recommended_products || []
            };

            setMessages(prev => [...prev, modelMsg]);
        } catch (err) {
            console.error('Lỗi khi gọi AI consult:', err);
            const errorMsg = {
                id: (Date.now() + 1).toString(),
                role: 'model',
                text: `❌ Lỗi xử lý: ${err.message || err}. Vui lòng kiểm tra lại cấu hình Gemini API Key.`,
                recommended_products: []
            };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddToCartClick = (prod) => {
        if (onAddToCart) {
            onAddToCart(prod);
        } else {
            // 1. Dispatch sự kiện để POS (POSnew hoặc poslite) trực tiếp thêm vào giỏ hàng đang mở
            const event = new CustomEvent('pos_add_product_by_id', { 
                detail: { productId: prod.id, product: prod, quantity: 1 } 
            });
            window.dispatchEvent(event);

            // 2. Đồng thời đồng bộ vào pos_cart trong localStorage đề phòng trường hợp POS chưa nạp
            try {
                const currentCartStr = localStorage.getItem('pos_cart');
                let cartList = [];
                if (currentCartStr) {
                    try { cartList = JSON.parse(currentCartStr); } catch (e) {}
                }
                if (!Array.isArray(cartList)) cartList = [];

                const existing = cartList.find(item => item.product_id === prod.id);
                if (existing) {
                    existing.quantity = (existing.quantity || 1) + 1;
                } else {
                    cartList.unshift({
                        product_id: prod.id,
                        product_name: prod.name,
                        unit: prod.unit || 'Cái',
                        price: prod.sale_price || 0,
                        sale_price: prod.sale_price || 0,
                        quantity: 1,
                        stock: prod.stock || 0,
                        active_ingredient: prod.active_ingredient || '',
                        cartId: Math.random().toString(36).substr(2, 9)
                    });
                }
                localStorage.setItem('pos_cart', JSON.stringify(cartList));
                window.dispatchEvent(new CustomEvent('pos_cart_updated', { detail: { cart: cartList } }));
            } catch (err) {}
        }
        setAddedProducts(prev => ({ ...prev, [prod.id]: true }));
        toast.success(`Đã thêm "${prod.name}" vào đơn hàng!`);
        setTimeout(() => {
            setAddedProducts(prev => ({ ...prev, [prod.id]: false }));
        }, 1800);
    };

    // Render formatted markdown
    const renderFormattedText = (text) => {
        if (!text) return null;
        const lines = text.split('\n');
        return lines.map((line, lineIdx) => {
            const trimmed = line.trim();
            if (trimmed === '---' || trimmed === '***' || trimmed === '___') {
                return <hr key={lineIdx} className="my-2.5 border-stone-200/80 dark:border-white/10" />;
            }
            if (line.startsWith('### ')) {
                return (
                    <h4 
                        key={lineIdx} 
                        style={{ fontSize: `${Math.round(fontSize * 1.08)}px` }}
                        className="font-black mt-2 mb-1 flex items-center gap-1.5 text-emerald-800 dark:text-emerald-400"
                    >
                        <Leaf size={Math.max(12, Math.round(fontSize * 0.95))} />
                        {line.replace('### ', '')}
                    </h4>
                );
            }
            if (line.startsWith('## ')) {
                return (
                    <h3 
                        key={lineIdx} 
                        style={{ fontSize: `${Math.round(fontSize * 1.2)}px` }}
                        className="font-black mt-2.5 mb-1 text-emerald-800 dark:text-emerald-400"
                    >
                        {line.replace('## ', '')}
                    </h3>
                );
            }
            if (line.startsWith('# ')) {
                return (
                    <h2 
                        key={lineIdx} 
                        style={{ fontSize: `${Math.round(fontSize * 1.35)}px` }}
                        className="font-black mt-2.5 mb-1 text-emerald-800 dark:text-emerald-400"
                    >
                        {line.replace('# ', '')}
                    </h2>
                );
            }
            // Match numbered items like "1. ", "2. ", "3. Nguyên tắc..."
            const numMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
            if (numMatch) {
                return (
                    <div 
                        key={lineIdx} 
                        style={{ fontSize: `${fontSize}px`, lineHeight: 1.6 }}
                        className="py-0.5 flex items-start gap-1.5"
                    >
                        <span className="font-black text-emerald-700 dark:text-emerald-400 shrink-0 select-none">
                            {numMatch[1]}.
                        </span>
                        <div className="flex-1">
                            {renderBoldSpans(numMatch[2])}
                        </div>
                    </div>
                );
            }
            if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
                const clean = trimmed.substring(2);
                return (
                    <li 
                        key={lineIdx} 
                        style={{ fontSize: `${fontSize}px`, lineHeight: 1.6 }}
                        className="ml-3.5 list-disc py-0.5 text-stone-700 dark:text-stone-300"
                    >
                        {renderBoldSpans(clean)}
                    </li>
                );
            }
            if (!trimmed) {
                return <div key={lineIdx} className="h-1.5" />;
            }
            return (
                <p 
                    key={lineIdx} 
                    style={{ fontSize: `${fontSize}px`, lineHeight: 1.6 }}
                    className="py-0.5 text-stone-800 dark:text-stone-200"
                >
                    {renderBoldSpans(line)}
                </p>
            );
        });
    };

    const renderBoldSpans = (text) => {
        const parts = text.split(/(\*\*.*?\*\*)/g);
        return parts.map((part, idx) => {
            if (part.startsWith('**') && part.endsWith('**')) {
                return (
                    <strong key={idx} className="font-black text-emerald-900 dark:text-emerald-300">
                        {part.slice(2, -2)}
                    </strong>
                );
            }
            return part;
        });
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <m.div
                    ref={popoverRef}
                    key="ai-consultant-popover"
                    initial={{
                        opacity: 0,
                        scale: 0.94,
                        y: 8
                    }}
                    animate={{
                        opacity: 1,
                        scale: 1,
                        y: 0
                    }}
                    exit={{
                        opacity: 0,
                        scale: 0.94,
                        y: 6
                    }}
                    transition={{
                        duration: 0.14,
                        ease: 'easeOut'
                    }}
                    style={{
                        position: 'fixed',
                        left: popoverStyle.left,
                        top: popoverStyle.top,
                        width: popoverStyle.width,
                        height: popoverStyle.height,
                        zIndex: 100000,
                        transformOrigin: `${popoverStyle.originX} ${popoverStyle.originY}`,
                        '--ai-font-size': `${fontSize}px`
                    }}
                    className="bg-white dark:bg-[#07130e] text-stone-900 dark:text-stone-100 border border-emerald-800/20 dark:border-emerald-500/25 rounded-3xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.3)] flex flex-col overflow-hidden select-none ring-1 ring-black/5 dark:ring-white/10"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header with Theme Botanical Gradient */}
                    <div 
                        style={{ 
                            background: 'var(--top-nav-gradient, linear-gradient(135deg, #163d18 0%, #205c26 50%, #2b7a33 100%))'
                        }}
                        className="px-4 py-3 flex items-center justify-between border-b border-white/10 text-white shadow-sm shrink-0 select-none relative overflow-hidden"
                    >
                        {/* Shimmer line */}
                        <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none" />

                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center border border-white/25 shadow-xs relative">
                                <BrainCircuit size={17} className="text-white" />
                                <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-[#163d18] shadow-xs" />
                            </div>
                            <div className="flex items-center gap-2">
                                <h3 className="font-black text-sm tracking-wide text-white flex items-center gap-1.5 drop-shadow-xs">
                                    LYANGAI
                                </h3>
                                <span className="bg-white/20 text-white text-[9.5px] font-black px-2 py-0.5 rounded-full border border-white/20 flex items-center gap-1 shadow-2xs">
                                    <Sparkles size={10} className="text-amber-300" /> Gemini
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                            {/* Nút chỉnh cỡ chữ (A- và A+) */}
                            <div 
                                className="flex items-center bg-black/25 rounded-lg p-0.5 text-white border border-white/15 shadow-inner gap-0.5"
                                title="Chỉnh kích thước chữ trò chuyện (A- / A+)"
                            >
                                <button
                                    type="button"
                                    onClick={() => handleFontSizeChange(-1)}
                                    disabled={fontSize <= 11}
                                    title="Giảm cỡ chữ (A-)"
                                    className="px-1.5 py-0.5 flex items-center justify-center hover:bg-white/20 active:scale-95 disabled:opacity-30 rounded text-[11px] font-black transition-all"
                                >
                                    A-
                                </button>
                                <div className="w-[1px] h-3 bg-white/20" />
                                <button
                                    type="button"
                                    onClick={() => handleFontSizeChange(1)}
                                    disabled={fontSize >= 22}
                                    title="Tăng cỡ chữ (A+)"
                                    className="px-1.5 py-0.5 flex items-center justify-center hover:bg-white/20 active:scale-95 disabled:opacity-30 rounded text-[11px] font-black transition-all"
                                >
                                    A+
                                </button>
                            </div>

                            <button
                                type="button"
                                onClick={() => setIsExpanded(!isExpanded)}
                                title={isExpanded ? "Thu nhỏ" : "Phóng to"}
                                className="p-1.5 hover:bg-white/20 active:scale-95 text-white/90 hover:text-white rounded-lg transition-all"
                            >
                                {isExpanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                            </button>
                            <button 
                                type="button"
                                onClick={handleClearChat}
                                title="Xóa lịch sử chat"
                                className="p-1.5 hover:bg-white/20 active:scale-95 text-white/90 hover:text-white rounded-lg transition-all"
                            >
                                <Trash2 size={14} />
                            </button>
                            <button 
                                type="button"
                                onClick={onClose}
                                title="Đóng (ESC)"
                                className="p-1.5 hover:bg-rose-500 active:scale-95 text-white/90 hover:text-white rounded-lg transition-all"
                            >
                                <X size={15} />
                            </button>
                        </div>
                    </div>

                    {/* Chat Messages Feed */}
                    <div 
                        ref={chatFeedRef}
                        className="flex-1 overflow-y-auto p-3.5 space-y-3.5 custom-scrollbar bg-[#f8faf7] dark:bg-[#07120d] scroll-smooth"
                    >
                        {messages.map((msg, idx) => {
                            const isLatestModel = idx === messages.length - 1 && msg.role === 'model';
                            return (
                                <div 
                                    key={msg.id || idx}
                                    ref={isLatestModel ? latestModelMsgRef : null}
                                    className={`scroll-mt-3 ${msg.role === 'user' ? 'flex justify-end' : 'flex gap-2.5 items-start justify-start'}`}
                                >
                                    {msg.role === 'model' && (
                                        <div 
                                            style={{ background: 'var(--top-nav-gradient, linear-gradient(135deg, #163d18 0%, #297a33 100%))' }}
                                            className="w-7 h-7 rounded-xl text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5"
                                        >
                                            <BrainCircuit size={14} />
                                        </div>
                                    )}

                                    <div 
                                        style={msg.role === 'user' ? {
                                            background: 'var(--button-gradient, linear-gradient(135deg, #1e5225 0%, #2e7535 100%))',
                                            color: '#ffffff'
                                        } : undefined}
                                        className={`relative group transition-colors ${
                                            msg.role === 'user' 
                                                ? 'max-w-[85%] rounded-2xl rounded-tr-xs p-3 text-white shadow-sm' 
                                                : 'max-w-[88%] bg-white dark:bg-[#0e1d17] border border-stone-200/80 dark:border-white/10 rounded-2xl rounded-tl-xs p-3.5 shadow-xs text-stone-800 dark:text-stone-100'
                                        }`}
                                    >
                                        {/* Nút Copy */}
                                        {msg.role === 'model' && msg.id !== 'welcome' && (
                                            <button 
                                                type="button"
                                                onClick={() => handleCopy(msg.text, idx)}
                                                title="Sao chép câu trả lời"
                                                className="absolute top-2.5 right-2.5 p-1.5 rounded-lg bg-stone-100 dark:bg-white/10 hover:bg-stone-200 dark:hover:bg-white/20 text-stone-500 dark:text-stone-300 opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                {copiedIndex === idx ? <CheckCheck size={13} className="text-emerald-600 dark:text-emerald-400" /> : <Copy size={13} />}
                                            </button>
                                        )}

                                        {/* User Images */}
                                        {msg.images && msg.images.length > 0 && (
                                            <div className="flex gap-1.5 mb-2 flex-wrap">
                                                {msg.images.map((img, imgIdx) => (
                                                    <img 
                                                        key={imgIdx} 
                                                        src={img} 
                                                        alt="Uploaded crop/leaf" 
                                                        className="w-16 h-16 object-cover rounded-xl border border-white/20 shadow-xs"
                                                    />
                                                ))}
                                            </div>
                                        )}

                                        {/* Content */}
                                        <div className="space-y-0.5">
                                            {msg.role === 'user' ? (
                                                <p 
                                                    style={{ fontSize: `${fontSize}px`, lineHeight: 1.55 }}
                                                    className="font-bold whitespace-pre-wrap leading-relaxed"
                                                >
                                                    {msg.text}
                                                </p>
                                            ) : (
                                                <div>{renderFormattedText(msg.text)}</div>
                                            )}
                                        </div>

                                        {/* Recommended Products Cards */}
                                        {msg.recommended_products && msg.recommended_products.length > 0 && (
                                            <div className="mt-3.5 pt-3 border-t border-stone-200/80 dark:border-white/10 space-y-2">
                                                <div className="flex items-center gap-1.5 text-[10.5px] font-black uppercase tracking-wider text-emerald-800 dark:text-emerald-400">
                                                    <FlaskConical size={13} className="text-emerald-600 dark:text-emerald-400" />
                                                    <span>Thuốc phù hợp có trong kho:</span>
                                                </div>
                                                <div className="grid grid-cols-1 gap-2">
                                                    {msg.recommended_products.map((prod) => {
                                                        const inStock = (prod.stock || 0) > 0;
                                                        const isAdded = addedProducts[prod.id];
                                                        return (
                                                            <div 
                                                                key={prod.id}
                                                                className="p-3 rounded-xl border border-emerald-600/15 hover:border-emerald-600/35 bg-emerald-50/40 dark:bg-[#14281f] flex flex-col justify-between gap-2 shadow-2xs transition-all"
                                                            >
                                                                <div>
                                                                    <div className="flex items-start justify-between gap-2">
                                                                        <h5 
                                                                            style={{ fontSize: `${Math.max(12.5, fontSize)}px` }}
                                                                            className="font-black text-stone-900 dark:text-white leading-snug"
                                                                        >
                                                                            {prod.name}
                                                                        </h5>
                                                                        <span 
                                                                            className={`text-[10px] font-black px-2 py-0.5 rounded-full shrink-0 border ${
                                                                                inStock 
                                                                                    ? 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800/40' 
                                                                                    : 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800/40'
                                                                            }`}
                                                                        >
                                                                            {inStock ? `Còn ${prod.stock} ${prod.unit || ''}` : 'Hết hàng'}
                                                                        </span>
                                                                    </div>
                                                                    {prod.active_ingredient && (
                                                                        <p 
                                                                            style={{ fontSize: `${Math.max(11, fontSize - 1.5)}px` }}
                                                                            className="font-bold italic mt-0.5 text-emerald-700 dark:text-emerald-400 line-clamp-1 flex items-center gap-1.5" 
                                                                            title={prod.active_ingredient}
                                                                        >
                                                                            <FlaskConical size={12} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                                                                            <span>{prod.active_ingredient}</span>
                                                                        </p>
                                                                    )}
                                                                    {prod.dosage && (
                                                                        <div 
                                                                            style={{ fontSize: `${Math.max(10.5, fontSize - 1.5)}px` }}
                                                                            className="mt-1.5 px-2.5 py-1 rounded-lg bg-sky-50 dark:bg-sky-950/30 text-sky-900 dark:text-sky-200 border border-sky-200/70 dark:border-sky-800/40 font-medium flex items-start gap-1.5"
                                                                        >
                                                                            <Droplets size={13} className="text-sky-500 shrink-0 mt-0.5" />
                                                                            <span className="line-clamp-2">{prod.dosage}</span>
                                                                        </div>
                                                                    )}
                                                                </div>

                                                                <div className="flex items-center justify-between pt-1.5 border-t border-stone-200/60 dark:border-white/5">
                                                                    <div 
                                                                        style={{ fontSize: `${Math.max(12, fontSize)}px` }}
                                                                        className="font-black text-stone-900 dark:text-white"
                                                                    >
                                                                        {Number(prod.sale_price || 0).toLocaleString('vi-VN')} đ
                                                                        {prod.unit && <span className="text-[10px] font-normal text-stone-500 dark:text-stone-400">/{prod.unit}</span>}
                                                                    </div>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleAddToCartClick(prod)}
                                                                        disabled={!inStock}
                                                                        className={`px-2.5 py-1 rounded-lg text-[11px] font-black flex items-center gap-1.5 shadow-2xs active:scale-95 transition-all ${
                                                                            isAdded
                                                                                ? 'bg-emerald-600 text-white'
                                                                                : inStock
                                                                                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white'
                                                                                    : 'bg-stone-200 dark:bg-white/10 text-stone-400 cursor-not-allowed'
                                                                        }`}
                                                                    >
                                                                        {isAdded ? (
                                                                            <><Check size={12} strokeWidth={3} /> Đã thêm</>
                                                                        ) : (
                                                                            <><ShoppingCart size={12} /> Thêm vào đơn</>
                                                                        )}
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}

                        {isLoading && (
                            <div className="flex gap-2.5 justify-start items-center">
                                <div 
                                    style={{ background: 'var(--top-nav-gradient, linear-gradient(135deg, #163d18 0%, #297a33 100%))' }}
                                    className="w-7 h-7 rounded-xl text-white flex items-center justify-center shrink-0 shadow-xs"
                                >
                                    <BrainCircuit size={14} />
                                </div>
                                <div className="bg-white dark:bg-[#0e1d17] border border-emerald-600/20 dark:border-white/10 rounded-2xl rounded-tl-xs px-3.5 py-2.5 shadow-xs flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                    <p 
                                        style={{ fontSize: `${Math.max(11.5, fontSize - 1)}px` }}
                                        className="font-bold text-emerald-800 dark:text-emerald-300"
                                    >
                                        LyangAI đang phân tích & tra cứu hoạt chất trong kho...
                                    </p>
                                </div>
                            </div>
                        )}

                        <div ref={chatEndRef} />
                    </div>

                    {/* Preview Selected Images */}
                    {selectedImages.length > 0 && (
                        <div className="px-3 py-1.5 border-t border-stone-200 dark:border-white/10 bg-stone-50 dark:bg-[#0b1610] flex items-center gap-1.5 shrink-0">
                            <span className="text-[9.5px] font-black uppercase text-stone-500 dark:text-stone-400">Ảnh gửi kèm:</span>
                            {selectedImages.map((img, idx) => (
                                <div key={idx} className="relative group w-10 h-10 rounded-lg overflow-hidden border border-black/10">
                                    <img src={img} alt="Preview" className="w-full h-full object-cover" />
                                    <button 
                                        type="button"
                                        onClick={() => handleRemoveImage(idx)}
                                        className="absolute inset-0 bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <X size={12} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Input Controls */}
                    <div className="p-2.5 border-t border-stone-200/80 dark:border-white/10 bg-white dark:bg-[#07130e] shrink-0">
                        <form 
                            onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                            className="flex items-center gap-2"
                        >
                            <input 
                                type="file" 
                                ref={fileInputRef} 
                                onChange={handleImageSelect} 
                                accept="image/*" 
                                multiple 
                                className="hidden" 
                            />
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                title="Tải ảnh sâu bệnh / lá cây"
                                className="p-2 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-white/10 dark:hover:bg-white/15 text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-white/10 active:scale-95 transition-all shrink-0"
                            >
                                <ImageIcon size={16} />
                            </button>

                            <div className="flex-1 relative">
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder="Hỏi LyangAI về sâu bệnh, hoạt chất... (VD: difenconazole, xì mủ)"
                                    style={{
                                        fontSize: `${Math.max(12, Math.min(15, fontSize))}px`
                                    }}
                                    className="w-full px-3.5 py-2 bg-stone-100/90 dark:bg-white/5 border border-stone-200 dark:border-white/10 text-stone-900 dark:text-white placeholder-stone-400 dark:placeholder-stone-500 rounded-xl font-medium outline-none focus:bg-white dark:focus:bg-black/30 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading || (!input.trim() && selectedImages.length === 0)}
                                style={{
                                    background: (!isLoading && (input.trim() || selectedImages.length > 0)) 
                                        ? 'var(--button-gradient, linear-gradient(135deg, #16a34a 0%, #0d9488 100%))' 
                                        : undefined
                                }}
                                className="px-4 py-2 rounded-xl bg-stone-300 dark:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-110 active:scale-95 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all shrink-0"
                            >
                                <span>Gửi</span>
                                <Send size={12} />
                            </button>
                        </form>
                    </div>
                </m.div>
            )}
        </AnimatePresence>
    );
}
