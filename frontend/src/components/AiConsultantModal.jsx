import React, { useState, useEffect, useRef, useMemo } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { 
    Bot, Sparkles, Send, Trash2, ShoppingCart, 
    Check, Leaf, X, Copy, 
    CheckCheck, Image as ImageIcon,
    FlaskConical, Zap, Maximize2, Minimize2
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
            if (saved) return JSON.parse(saved);
        } catch (e) {}
        return [
            {
                id: 'welcome',
                role: 'model',
                text: 'Xin chào! Tôi là **Trợ lý AI Nông Nghiệp & Cố Vấn Hoạt Chất BVTV**.\n\nHãy nhập triệu chứng cây trồng, loại sâu bệnh hoặc gửi ảnh để tôi tra cứu hoạt chất và đối chiếu thuốc trong kho giúp bạn!',
                recommended_products: []
            }
        ];
    });

    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [selectedImages, setSelectedImages] = useState([]);
    const [copiedIndex, setCopiedIndex] = useState(null);
    const [addedProducts, setAddedProducts] = useState({});
    const [isExpanded, setIsExpanded] = useState(false);

    const popoverRef = useRef(null);
    const chatEndRef = useRef(null);
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

    // Tự động cuộn xuống cuối
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => {
                chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
                inputRef.current?.focus();
            }, 80);
        }
    }, [isOpen, messages, isLoading]);

    const handleClearChat = () => {
        const welcomeMsg = [
            {
                id: 'welcome',
                role: 'model',
                text: 'Xin chào! Tôi là **Trợ lý AI Nông Nghiệp & Cố Vấn Hoạt Chất BVTV**.\n\nHãy nhập triệu chứng cây trồng, loại sâu bệnh hoặc gửi ảnh để tôi tra cứu hoạt chất và đối chiếu thuốc trong kho giúp bạn!',
                recommended_products: []
            }
        ];
        setMessages(welcomeMsg);
        localStorage.setItem('lyang_ai_consult_chat', JSON.stringify(welcomeMsg));
        toast.success('Đã xóa lịch sử trò chuyện AI');
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
        try {
            const prodRes = await axios.get('/api/products');
            productList = Array.isArray(prodRes.data) ? prodRes.data : (prodRes.data?.data || []);
            if (productList.length > 0) {
                productList.slice(0, 400).forEach(p => {
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

        const systemInstruction = `Bạn là Chuyên gia Cố vấn Nông nghiệp & Dược học Cây trồng cao cấp (Plant Protection & Agronomy AI Expert) của cửa hàng LyangPOS.
Nhiệm vụ của bạn:
1. Giải đáp thắc mắc về bệnh hại, sâu bọ, rầy, rệp, bọ trĩ, nấm khuẩn (đạo ôn, thán thư, xì mủ, đốm vằn, rỉ sắt, lem lép hạt...).
2. Phân tích nguyên nhân khoa học và ĐỀ XUẤT CHUẨN XÁC CÁC NHÓM HOẠT CHẤT (Active Ingredients) đặc trị (ví dụ: Difenoconazole, Hexaconazole, Azoxystrobin, Tricyclazole, Isoprothiolane, Metalaxyl, Mancozeb, Validamycin, Emamectin benzoate, Abamectin, Chlorantraniliprole, Thiamethoxam...).
3. ĐỐI CHIẾU VỚI DANH MỤC KHO HÀNG CỦA CỬA HÀNG (bên dưới) để đề xuất các sản phẩm cụ thể đang có sẵn. Lưu ý: nhiều sản phẩm có thể chưa điền cột hoạt chất nhưng tên thương mại chính là thuốc trị bệnh đó (như Beam, Tilt Super, Anvil, Amistar, Flash, Filia, Map Famy, Validacin, Nativo, Ridomil...), hãy nhận diện và đề xuất các sản phẩm này từ kho!
4. BẮT BUỘC HƯỚNG DẪN LIỀU LƯỢNG PHA CHI TIẾT (cho bình 16L/25L/phuy 200L), thời điểm phun và nguyên tắc LUÂN PHIÊN ĐỔI GỐC HOẠT CHẤT để chống kháng thuốc.
5. Giọng điệu thân thiện, chuyên môn, định dạng Markdown đẹp mắt.

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
            const event = new CustomEvent('pos_add_product_by_id', { 
                detail: { productId: prod.id, product: prod } 
            });
            window.dispatchEvent(event);
        }
        setAddedProducts(prev => ({ ...prev, [prod.id]: true }));
        toast.success(`Đã thêm "${prod.name}" vào giỏ hàng!`);
        setTimeout(() => {
            setAddedProducts(prev => ({ ...prev, [prod.id]: false }));
        }, 1800);
    };

    // Render formatted markdown
    const renderFormattedText = (text) => {
        if (!text) return null;
        const lines = text.split('\n');
        return lines.map((line, lineIdx) => {
            if (line.startsWith('### ')) {
                return <h4 key={lineIdx} className="text-xs font-black mt-2 mb-1 flex items-center gap-1.5 text-[#2d5016] dark:text-[#d4a574]"><Leaf size={13} />{line.replace('### ', '')}</h4>;
            }
            if (line.startsWith('## ')) {
                return <h3 key={lineIdx} className="text-sm font-black mt-2.5 mb-1 text-[#2d5016] dark:text-[#d4a574]">{line.replace('## ', '')}</h3>;
            }
            if (line.startsWith('# ')) {
                return <h2 key={lineIdx} className="text-base font-black mt-2.5 mb-1 text-[#2d5016] dark:text-[#d4a574]">{line.replace('# ', '')}</h2>;
            }
            if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
                const clean = line.trim().substring(2);
                return (
                    <li key={lineIdx} className="ml-3.5 list-disc text-[11.5px] leading-relaxed py-0.5 opacity-90">
                        {renderBoldSpans(clean)}
                    </li>
                );
            }
            if (!line.trim()) {
                return <div key={lineIdx} className="h-1.5" />;
            }
            return (
                <p key={lineIdx} className="text-[11.5px] leading-relaxed py-0.5">
                    {renderBoldSpans(line)}
                </p>
            );
        });
    };

    const renderBoldSpans = (text) => {
        const parts = text.split(/(\*\*.*?\*\*)/g);
        return parts.map((part, idx) => {
            if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={idx} className="font-black text-[#2d5016] dark:text-[#d4a574]">{part.slice(2, -2)}</strong>;
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
                        willChange: 'transform, opacity',
                        backgroundColor: 'var(--card-bg, #fbf8f2)',
                        color: 'var(--text-main, #2d261e)'
                    }}
                    className="border border-[#2d5016]/25 dark:border-white/10 rounded-3xl shadow-2xl flex flex-col overflow-hidden select-none"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header with Theme Background */}
                    <div 
                        style={{ 
                            backgroundColor: 'var(--primary-color, #2d5016)',
                            color: '#ffffff'
                        }}
                        className="px-4 py-3 flex items-center justify-between shadow-xs shrink-0 select-none"
                    >
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center border border-white/25 shadow-xs relative">
                                <Bot size={18} className="text-white" />
                                <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border border-emerald-800" />
                            </div>
                            <div>
                                <div className="flex items-center gap-1.5">
                                    <h3 className="font-black text-xs uppercase tracking-wide text-white">
                                        Cố Vấn Hoạt Chất AI
                                    </h3>
                                    <span className="bg-white/20 text-white text-[9px] font-black px-1.5 py-0.2 rounded-md flex items-center gap-0.5">
                                        <Sparkles size={9} /> Gemini
                                    </span>
                                </div>
                                <p className="text-[10px] text-white/80 font-medium">
                                    Tra cứu sâu bệnh & đối chiếu kho thuốc
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-1">
                            <button
                                type="button"
                                onClick={() => setIsExpanded(!isExpanded)}
                                title={isExpanded ? "Thu nhỏ" : "Phóng to"}
                                className="p-1.5 hover:bg-white/20 text-white/90 hover:text-white rounded-lg transition-all"
                            >
                                {isExpanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                            </button>
                            <button 
                                type="button"
                                onClick={handleClearChat}
                                title="Xóa lịch sử chat"
                                className="p-1.5 hover:bg-white/20 text-white/90 hover:text-white rounded-lg transition-all"
                            >
                                <Trash2 size={14} />
                            </button>
                            <button 
                                type="button"
                                onClick={onClose}
                                title="Đóng (ESC)"
                                className="p-1.5 hover:bg-rose-500 hover:text-white text-white/90 rounded-lg transition-all"
                            >
                                <X size={15} />
                            </button>
                        </div>
                    </div>

                    {/* Quick Suggestion Chips */}
                    <div 
                        style={{ 
                            backgroundColor: 'var(--bg-color, #f4ecd8)',
                            borderColor: 'rgba(45, 80, 22, 0.12)'
                        }}
                        className="px-3 py-2 border-b flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0"
                    >
                        <span className="text-[9.5px] font-black uppercase tracking-wider opacity-60 flex items-center gap-0.5 whitespace-nowrap pl-0.5">
                            <Zap size={11} className="text-amber-500" /> Gợi ý:
                        </span>
                        {QUICK_SUGGESTIONS.map((item, idx) => (
                            <button
                                key={idx}
                                type="button"
                                onClick={() => handleSend(item.query)}
                                disabled={isLoading}
                                style={{
                                    backgroundColor: 'var(--card-bg, #fbf8f2)',
                                    borderColor: 'rgba(45, 80, 22, 0.15)',
                                    color: 'var(--text-main, #2d261e)'
                                }}
                                className="text-[10.5px] font-bold px-2.5 py-0.8 rounded-full border whitespace-nowrap transition-all shadow-2xs hover:brightness-95 active:scale-95 disabled:opacity-50"
                            >
                                {item.label}
                            </button>
                        ))}
                    </div>

                    {/* Chat Messages Feed */}
                    <div 
                        style={{
                            backgroundColor: 'var(--bg-color, #f4ecd8)'
                        }}
                        className="flex-1 overflow-y-auto p-3.5 space-y-3 custom-scrollbar"
                    >
                        {messages.map((msg, idx) => (
                            <div 
                                key={msg.id || idx}
                                className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                {msg.role === 'model' && (
                                    <div 
                                        style={{ backgroundColor: 'var(--primary-color, #2d5016)' }}
                                        className="w-7 h-7 rounded-xl text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5"
                                    >
                                        <Bot size={14} />
                                    </div>
                                )}

                                <div 
                                    style={msg.role === 'user' ? {
                                        backgroundColor: 'var(--primary-color, #2d5016)',
                                        color: '#ffffff'
                                    } : {
                                        backgroundColor: 'var(--card-bg, #fbf8f2)',
                                        borderColor: 'rgba(45, 80, 22, 0.15)',
                                        color: 'var(--text-main, #2d261e)'
                                    }}
                                    className={`max-w-[88%] rounded-2xl p-3.5 shadow-2xs relative group ${
                                        msg.role === 'user' 
                                            ? 'rounded-tr-xs' 
                                            : 'border rounded-tl-xs'
                                    }`}
                                >
                                    {/* Nút Copy */}
                                    {msg.role === 'model' && msg.id !== 'welcome' && (
                                        <button 
                                            type="button"
                                            onClick={() => handleCopy(msg.text, idx)}
                                            title="Sao chép câu trả lời"
                                            className="absolute top-2 right-2 p-1 rounded-lg bg-black/5 hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            {copiedIndex === idx ? <CheckCheck size={12} className="text-emerald-600" /> : <Copy size={12} />}
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
                                                    className="w-16 h-16 object-cover rounded-lg border border-black/10 shadow-2xs"
                                                />
                                            ))}
                                        </div>
                                    )}

                                    {/* Content */}
                                    <div className="space-y-0.5">
                                        {msg.role === 'user' ? (
                                            <p className="text-[11.5px] font-bold leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                                        ) : (
                                            <div>{renderFormattedText(msg.text)}</div>
                                        )}
                                    </div>

                                    {/* Recommended Products Cards */}
                                    {msg.recommended_products && msg.recommended_products.length > 0 && (
                                        <div 
                                            style={{ borderColor: 'rgba(45, 80, 22, 0.15)' }}
                                            className="mt-3 pt-2.5 border-t space-y-1.5"
                                        >
                                            <div 
                                                className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-[#2d5016] dark:text-[#d4a574]"
                                            >
                                                <FlaskConical size={12} /> Thuốc phù hợp có trong kho:
                                            </div>
                                            <div className="grid grid-cols-1 gap-2">
                                                {msg.recommended_products.map((prod) => {
                                                    const inStock = (prod.stock || 0) > 0;
                                                    const isAdded = addedProducts[prod.id];
                                                    return (
                                                        <div 
                                                            key={prod.id}
                                                            style={{
                                                                backgroundColor: 'var(--bg-color, #f4ecd8)',
                                                                borderColor: 'rgba(45, 80, 22, 0.15)'
                                                            }}
                                                            className="p-2.5 rounded-xl border flex flex-col justify-between gap-1.5 shadow-2xs"
                                                        >
                                                            <div>
                                                                <div className="flex items-start justify-between gap-1">
                                                                    <h5 className="text-[11.5px] font-black leading-snug">
                                                                        {prod.name}
                                                                    </h5>
                                                                    <span 
                                                                        style={inStock ? {
                                                                            backgroundColor: 'rgba(45, 80, 22, 0.15)',
                                                                            color: 'var(--primary-color, #2d5016)'
                                                                        } : {
                                                                            backgroundColor: 'rgba(239, 68, 68, 0.15)',
                                                                            color: '#dc2626'
                                                                        }}
                                                                        className="text-[9.5px] font-black px-1.5 py-0.2 rounded-md shrink-0"
                                                                    >
                                                                        {inStock ? `Còn ${prod.stock} ${prod.unit || ''}` : 'Hết hàng'}
                                                                    </span>
                                                                </div>
                                                                {prod.active_ingredient && (
                                                                    <p 
                                                                        className="text-[10px] font-bold italic mt-0.5 line-clamp-1 text-[#2d5016] dark:text-[#d4a574]" 
                                                                        title={prod.active_ingredient}
                                                                    >
                                                                        🧪 {prod.active_ingredient}
                                                                    </p>
                                                                )}
                                                                {prod.dosage && (
                                                                    <div 
                                                                        className="mt-1 px-2 py-0.8 rounded-lg bg-[#2d5016]/10 dark:bg-white/10 text-[9.5px] font-semibold text-[#2d5016] dark:text-[#e8d5b5] flex items-center gap-1 border border-[#2d5016]/15 dark:border-white/10"
                                                                    >
                                                                        <span>💧</span>
                                                                        <span className="line-clamp-2">{prod.dosage}</span>
                                                                    </div>
                                                                )}
                                                            </div>

                                                            <div 
                                                                style={{ borderColor: 'rgba(45, 80, 22, 0.1)' }}
                                                                className="flex items-center justify-between pt-1 border-t"
                                                            >
                                                                <div className="text-[11.5px] font-black">
                                                                    {Number(prod.sale_price || 0).toLocaleString('vi-VN')} đ
                                                                    {prod.unit && <span className="text-[9.5px] font-normal opacity-60">/{prod.unit}</span>}
                                                                </div>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleAddToCartClick(prod)}
                                                                    disabled={!inStock}
                                                                    style={isAdded ? {
                                                                        backgroundColor: '#16a34a',
                                                                        color: '#ffffff'
                                                                    } : inStock ? {
                                                                        backgroundColor: 'var(--primary-color, #2d5016)',
                                                                        color: '#ffffff'
                                                                    } : {
                                                                        backgroundColor: 'rgba(0,0,0,0.08)',
                                                                        color: 'rgba(0,0,0,0.3)'
                                                                    }}
                                                                    className="px-2 py-0.8 rounded-lg text-[10.5px] font-black flex items-center gap-1 shadow-2xs active:scale-95 transition-all"
                                                                >
                                                                    {isAdded ? (
                                                                        <><Check size={11} strokeWidth={3} /> Đã thêm</>
                                                                    ) : (
                                                                        <><ShoppingCart size={11} /> Thêm vào đơn</>
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

                                {msg.role === 'user' && (
                                    <div 
                                        style={{ backgroundColor: 'var(--card-bg, #fbf8f2)', borderColor: 'rgba(45, 80, 22, 0.15)' }}
                                        className="w-7 h-7 rounded-xl border flex items-center justify-center shrink-0 shadow-2xs mt-0.5 font-black text-[11px] opacity-70"
                                    >
                                        Tôi
                                    </div>
                                )}
                            </div>
                        ))}

                        {isLoading && (
                            <div className="flex gap-2.5 justify-start items-center">
                                <div 
                                    style={{ backgroundColor: 'var(--primary-color, #2d5016)' }}
                                    className="w-7 h-7 rounded-xl text-white flex items-center justify-center shrink-0 shadow-2xs"
                                >
                                    <Bot size={14} />
                                </div>
                                <div 
                                    style={{
                                        backgroundColor: 'var(--card-bg, #fbf8f2)',
                                        borderColor: 'rgba(45, 80, 22, 0.15)'
                                    }}
                                    className="border rounded-2xl rounded-tl-xs px-3.5 py-2 shadow-2xs flex items-center gap-2"
                                >
                                    <span 
                                        style={{ backgroundColor: 'var(--primary-color, #2d5016)' }}
                                        className="w-2 h-2 rounded-full" 
                                    />
                                    <p className="text-[11px] font-bold opacity-75">
                                        AI đang phân tích & tra cứu hoạt chất trong kho...
                                    </p>
                                </div>
                            </div>
                        )}

                        <div ref={chatEndRef} />
                    </div>

                    {/* Preview Selected Images */}
                    {selectedImages.length > 0 && (
                        <div 
                            style={{ 
                                backgroundColor: 'var(--bg-color, #f4ecd8)',
                                borderColor: 'rgba(45, 80, 22, 0.12)'
                            }}
                            className="px-3 py-1.5 border-t flex items-center gap-1.5 shrink-0"
                        >
                            <span className="text-[9.5px] font-black uppercase opacity-60">Ảnh gửi kèm:</span>
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
                    <div 
                        style={{
                            backgroundColor: 'var(--card-bg, #fbf8f2)',
                            borderColor: 'rgba(45, 80, 22, 0.15)'
                        }}
                        className="p-2.5 border-t shrink-0"
                    >
                        <form 
                            onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                            className="flex items-center gap-1.5"
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
                                title="Tải ảnh sâu bệnh/lá cây"
                                style={{
                                    backgroundColor: 'var(--bg-color, #f4ecd8)',
                                    borderColor: 'rgba(45, 80, 22, 0.15)'
                                }}
                                className="p-2 rounded-xl border opacity-80 hover:opacity-100 transition-opacity shrink-0"
                            >
                                <ImageIcon size={16} />
                            </button>

                            <div className="flex-1 relative">
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder="Hỏi sâu bệnh, hoạt chất... (VD: difenconazole, xì mủ)"
                                    style={{
                                        backgroundColor: 'var(--bg-color, #f4ecd8)',
                                        borderColor: 'rgba(45, 80, 22, 0.15)',
                                        color: 'var(--text-main, #2d261e)'
                                    }}
                                    className="w-full pl-3 pr-3 py-2 border rounded-xl text-xs font-medium outline-none transition-all"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading || (!input.trim() && selectedImages.length === 0)}
                                style={{
                                    backgroundColor: 'var(--primary-color, #2d5016)',
                                    color: '#ffffff'
                                }}
                                className="px-3.5 py-2 rounded-xl hover:brightness-110 disabled:opacity-50 font-black text-xs flex items-center gap-1 shadow-xs active:scale-95 transition-all shrink-0"
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
