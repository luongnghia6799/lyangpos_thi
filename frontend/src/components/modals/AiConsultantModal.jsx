import React, { useState, useEffect, useRef, useMemo } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { 
    BrainCircuit, Sparkles, Send, Trash2, ShoppingCart, 
    Check, Leaf, X, Copy, 
    CheckCheck, Image as ImageIcon,
    FlaskConical, Droplets, Maximize2, Minimize2,
    BarChart3, TrendingUp, Bot, FileText,
    Volume2, VolumeX, Square
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { cn } from '../../lib/utils';

const MODES = [
    {
        id: 'crop_doctor',
        label: 'Tư vấn thuốc',
        shortLabel: 'BVTV',
        subTitle: 'Cố vấn BVTV & Hoạt chất',
        icon: FlaskConical,
        activeBg: 'bg-gradient-to-r from-[#163d18] to-[#2b7a33]',
        badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30',
        desc: 'Hỏi sâu bệnh, hoạt chất, liều pha & đối chiếu kho',
        placeholder: 'Hỏi sâu bệnh hại, hoạt chất, liều lượng pha, đối chiếu thuốc...',
        welcomeText: 'Xin chào! Tôi là **LyangAI - Cố Vấn Hoạt Chất & Nông Nghiệp Thông Minh**.\n\nHãy nhập triệu chứng cây trồng, loại sâu bệnh hoặc gửi ảnh để tôi tra cứu hoạt chất và đối chiếu thuốc trong kho giúp bạn!',
        loadingText: 'LyangAI đang tra cứu hoạt chất & đối chiếu kho thuốc...',
        suggestions: [
            { label: '🦎 Đốm nâu (Tắc kè) thanh long', query: 'Thanh long bị bệnh đốm nâu (đốm trắng / tắc kè) trên cành và trái non, tư vấn hoạt chất đặc trị có trong kho và liều pha?' },
            { label: '🌿 Thán thư cành & trái', query: 'Thanh long bị thán thư thối cành và thối bông/trái mùa mưa, nên dùng hoạt chất nào dứt điểm?' },
            { label: '🐜 Rệp sáp & Bồ hóng', query: 'Thanh long bị rệp sáp bu nụ bông và trái non tạo nấm bồ hóng đen, tư vấn thuốc xịt đặc trị có trong kho?' },
            { label: '🌸 Bọ trĩ & Bọ xít chọc nụ', query: 'Nụ hoa và bông thanh long bị bọ trĩ, bọ xít chích hút gây quăn bông, đen tai, rụng nụ, dùng thuốc gì hiệu quả?' },
            { label: '🍂 Thối cành & thối ngọn', query: 'Cành thanh long bị thối nhũn do nấm và vi khuẩn, dùng hoạt chất nào quét gốc hoặc phun chặn lây lan?' },
            { label: '✨ Vuốt tai & Đẹp trái', query: 'Tư vấn phân thuốc và kích thích sinh trưởng giúp trái thanh long đỏ da, tai dày xanh cứng, không bị lem trái?' }
        ]
    },
    {
        id: 'app_analytics',
        label: 'Số liệu App',
        shortLabel: 'Số liệu',
        subTitle: 'Báo cáo, Doanh thu & Tồn kho',
        icon: BarChart3,
        activeBg: 'bg-gradient-to-r from-blue-700 to-indigo-700',
        badgeBg: 'bg-blue-500/20 text-blue-300 border-blue-400/30',
        desc: 'Hỏi doanh thu, đơn hàng, tồn kho, công nợ toàn app',
        placeholder: 'Hỏi doanh thu hôm nay, hàng sắp hết, công nợ khách hàng, tồn kho...',
        welcomeText: 'Xin chào! Tôi là **LyangAI - Trợ Lý Phân Tích Số Liệu Toàn Diện**.\n\nTôi có thể trả lời các câu hỏi thời gian thực về **doanh thu, đơn hàng, công nợ khách hàng / nhà cung cấp, tồn kho và mặt hàng sắp hết / cận date** trong toàn bộ hệ thống!',
        loadingText: 'LyangAI đang phân tích số liệu toàn bộ phần mềm...',
        suggestions: [
            { label: '📊 Doanh thu hôm nay', query: 'Hôm nay cửa hàng bán được bao nhiêu đơn, tổng doanh thu và thực thu tiền mặt thế nào?' },
            { label: '📅 Doanh thu các tháng qua', query: 'Cho tôi xem tổng kết doanh thu, số đơn và công nợ của các tháng trước trong quá khứ?' },
            { label: '🏆 Hàng bán chạy nhất', query: 'Top 10 mặt hàng bán chạy nhất lịch sử từ trước đến nay và tổng doanh số mang lại?' },
            { label: '⚠️ Hàng sắp hết kho', query: 'Những mặt hàng nào đang hết kho hoặc có lượng tồn thấp hơn mức cảnh báo cần nhập thêm?' },
            { label: '⏳ Hàng cận date', query: 'Có những sản phẩm nào sắp hết hạn sử dụng hoặc đã quá hạn trong kho không?' },
            { label: '💳 Khách nợ nhiều nhất', query: 'Tổng công nợ khách hàng hiện tại là bao nhiêu và những ai đang nợ nhiều nhất?' },
            { label: '📈 Doanh thu tháng này', query: 'Tháng này cửa hàng đã bán được tổng cộng bao nhiêu đơn và doanh thu đạt bao nhiêu?' }
        ]
    },
    {
        id: 'general_assistant',
        label: 'Trợ lý Gemini',
        shortLabel: 'Gemini',
        subTitle: 'Hỏi đáp tự do mọi lĩnh vực',
        icon: Sparkles,
        activeBg: 'bg-gradient-to-r from-purple-700 to-pink-600',
        badgeBg: 'bg-purple-500/20 text-purple-300 border-purple-400/30',
        desc: 'Soạn văn bản, tính toán, kiến thức tổng hợp...',
        placeholder: 'Hỏi bất cứ điều gì (soạn tin nhắn, tính toán, kiến thức, kế hoạch)...',
        welcomeText: 'Xin chào! Tôi là **LyangAI - Trợ Lý Đa Năng Thông Minh (Gemini)**.\n\nBạn có thể hỏi tôi bất cứ điều gì: **soạn tin nhắn Zalo gửi khách, lập kế hoạch công việc, dịch thuật, tính toán, tra cứu kiến thức đời sống & nông nghiệp**!',
        loadingText: 'LyangAI đang suy nghĩ và tổng hợp câu trả lời...',
        suggestions: []
    }
];

const ADVANCED_ACTIVE_KEYWORDS = [
    'spinetoram', 'radiant', 'flupyrimin', 'sulfoxaflor', 'broflanilide', 'incipio',
    'chlorfenapyr', 'cyantraniliprole', 'benevia', 'minecto', 'chlorantraniliprole', 
    'virtako', 'prevathon', 'flonicamid', 'teppeki', 'spirotetramat', 'movento', 
    'spirodiclofen', 'envidor', 'spiromesifen', 'oberon', 'fenpyroximate', 'ortus', 
    'lufenuron', 'match', 'pyriproxyfen', 'admiral', 'tolfenpyrad', 'afidopyropen', 
    'metaflumizone', 'flubendiamide', 'takumi', 'diafenthiuron', 'pegasus',
    'pydiflumetofen', 'miravis', 'fluxapyroxad', 'sercadis', 'fluopyram', 'luna', 
    'oxathiapiprolin', 'zorvec', 'pyraclostrobin', 'cabrio', 'mandipropamid', 'revus', 
    'fenamidone', 'metiram', 'polyram', 'boscalid', 'cantus', 'kresoxim', 'cyazofamid',
    'trifloxystrobin', 'nativo', 'fludioxonil', 'sedaxane', 'dinotefuran', 'clothianidin',
    'hymexazol', 'tachigaren', 'chitosan', 'ningnanmycin', 'kasugamycin', 'streptomycin'
];

const isAdvancedActive = (name) => {
    if (!name || typeof name !== 'string') return false;
    const lower = name.toLowerCase();
    return ADVANCED_ACTIVE_KEYWORDS.some(k => lower.includes(k));
};

const extractActiveIngredients = (raw) => {
    if (!raw || typeof raw !== 'string') return [];
    const results = [];
    raw.split(/[+,;/]+/).forEach(part => {
        const trimmed = part.trim();
        if (!trimmed) return;
        const words = trimmed.split(/\s+/);
        const cleanWords = [];
        for (const w of words) {
            if (/^\d/.test(w)) break;
            cleanWords.push(w);
        }
        const cleanName = (cleanWords.length ? cleanWords.join(' ') : trimmed).trim();
        if (cleanName && !results.some(x => x.toLowerCase() === cleanName.toLowerCase())) {
            results.push(cleanName);
        }
    });
    return results;
};

// Làm sạch văn bản markdown và định dạng câu chữ tự nhiên cho giọng đọc TTS tiếng Việt
const cleanTextForTTS = (text) => {
    if (!text || typeof text !== 'string') return '';
    return text
        .replace(/```[\s\S]*?```/g, '') // Bỏ block code / block json
        .replace(/`([^`]+)`/g, '$1')     // Bỏ inline code
        .replace(/^#+\s+/gm, '')         // Bỏ ký hiệu heading
        .replace(/\*\*([^*]+)\*\*/g, '$1') // Bỏ in đậm **
        .replace(/\*([^*]+)\*/g, '$1')   // Bỏ in nghiêng *
        .replace(/[-*•]\s+/g, ', ')      // Gạch đầu dòng thành dấu phẩy nghỉ nhịp
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Giữ text của link
        .replace(/https?:\/\/\S+/g, '')  // Bỏ URL thô
        .replace(/(\d+)\s*k\b/gi, '$1 nghìn')
        .replace(/(\d+)\s*đ\b/gi, '$1 đồng')
        .replace(/\bml\b/gi, 'mi li lít')
        .replace(/\bkg\b/gi, 'ki lô gam')
        .replace(/\bha\b/gi, 'héc ta')
        .replace(/\n+/g, '. ')           // Xuống dòng chuyển thành dấu chấm nghỉ
        .replace(/\s+/g, ' ')
        .trim();
};

export default function AiConsultantModal({ 
    isOpen, 
    onClose, 
    onAddToCart, 
    mascotPos = { x: 800, y: 500 }, 
    mascotSize = 110 
}) {
    const [activeMode, setActiveMode] = useState(() => {
        try {
            const saved = localStorage.getItem('lyang_ai_active_mode');
            if (saved && MODES.some(m => m.id === saved)) return saved;
        } catch (e) {}
        return 'crop_doctor';
    });

    const currentModeConfig = useMemo(() => {
        return MODES.find(m => m.id === activeMode) || MODES[0];
    }, [activeMode]);

    const getInitialMessages = (modeId) => {
        try {
            const storageKey = modeId === 'crop_doctor'
                ? (localStorage.getItem('lyang_ai_chat_crop_doctor') ? 'lyang_ai_chat_crop_doctor' : 'lyang_ai_consult_chat')
                : `lyang_ai_chat_${modeId}`;
            const saved = localStorage.getItem(storageKey);
            if (saved) {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed) && parsed.length > 0) return parsed;
            }
        } catch (e) {}
        const cfg = MODES.find(m => m.id === modeId) || MODES[0];
        return [
            {
                id: 'welcome',
                role: 'model',
                text: cfg.welcomeText,
                recommended_products: []
            }
        ];
    };

    const [messages, setMessages] = useState(() => getInitialMessages(activeMode));

    const handleSwitchMode = (newModeId) => {
        if (newModeId === activeMode) return;
        stopSpeech();
        setActiveMode(newModeId);
        try {
            localStorage.setItem('lyang_ai_active_mode', newModeId);
        } catch (e) {}
        setMessages(getInitialMessages(newModeId));
    };

    // Lưu tin nhắn theo từng mode
    useEffect(() => {
        try {
            localStorage.setItem(`lyang_ai_chat_${activeMode}`, JSON.stringify(messages));
            if (activeMode === 'crop_doctor') {
                localStorage.setItem('lyang_ai_consult_chat', JSON.stringify(messages));
            }
        } catch (e) {}
    }, [messages, activeMode]);

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

    // Text-to-Speech (TTS)
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [speakingMsgId, setSpeakingMsgId] = useState(null);
    const [autoSpeak, setAutoSpeak] = useState(() => {
        try {
            return localStorage.getItem('lyang_ai_auto_speak') === 'true';
        } catch (e) {
            return false;
        }
    });

    const stopSpeech = () => {
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
            try {
                window.speechSynthesis.cancel();
            } catch (e) {}
        }
        setIsSpeaking(false);
        setSpeakingMsgId(null);
    };

    const toggleAutoSpeak = () => {
        setAutoSpeak(prev => {
            const next = !prev;
            try {
                localStorage.setItem('lyang_ai_auto_speak', next.toString());
            } catch (e) {}
            if (!next) {
                stopSpeech();
            }
            toast(next ? '🔊 Đã bật tự động đọc to câu trả lời AI' : '🔇 Đã tắt tự động đọc câu trả lời', {
                icon: next ? '🔊' : '🔇',
                duration: 2000
            });
            return next;
        });
    };

    const handleSpeak = (msgId, text) => {
        if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
            toast.error('Trình duyệt của bạn chưa hỗ trợ giọng đọc Web Speech API.');
            return;
        }

        // Bấm lại đúng tin nhắn đang đọc -> Dừng phát
        if (speakingMsgId === msgId) {
            stopSpeech();
            return;
        }

        stopSpeech();

        const cleanText = cleanTextForTTS(text);
        if (!cleanText) return;

        try {
            const utterance = new SpeechSynthesisUtterance(cleanText);
            utterance.lang = 'vi-VN';
            utterance.rate = 1.05;
            utterance.pitch = 1.0;

            const voices = window.speechSynthesis.getVoices();
            const viVoice = voices.find(v => 
                v.lang === 'vi-VN' || 
                v.lang?.toLowerCase().startsWith('vi') || 
                v.name?.toLowerCase().includes('vietnam') || 
                v.name?.toLowerCase().includes('vietnamese')
            );
            if (viVoice) {
                utterance.voice = viVoice;
            }

            utterance.onstart = () => {
                setIsSpeaking(true);
                setSpeakingMsgId(msgId);
            };

            utterance.onend = () => {
                setIsSpeaking(false);
                setSpeakingMsgId(null);
            };

            utterance.onerror = (e) => {
                console.warn('SpeechSynthesis error:', e);
                setIsSpeaking(false);
                setSpeakingMsgId(null);
            };

            window.speechSynthesis.speak(utterance);
        } catch (e) {
            console.error('Speech synthesis error:', e);
            setIsSpeaking(false);
            setSpeakingMsgId(null);
        }
    };

    // Tự động dừng đọc khi tắt modal hoặc unmount
    useEffect(() => {
        return () => {
            stopSpeech();
        };
    }, []);

    useEffect(() => {
        if (!isOpen) {
            stopSpeech();
        }
    }, [isOpen]);

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
                text: currentModeConfig.welcomeText,
                recommended_products: []
            }
        ];
        stopSpeech();
        setMessages(welcomeMsg);
        try {
            localStorage.setItem(`lyang_ai_chat_${activeMode}`, JSON.stringify(welcomeMsg));
            if (activeMode === 'crop_doctor') {
                localStorage.setItem('lyang_ai_consult_chat', JSON.stringify(welcomeMsg));
            }
        } catch (e) {}
        toast.success(`Đã xóa lịch sử trò chuyện (${currentModeConfig.label})`);
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
    const callGeminiDirectClient = async ({ message, history, images, mode = 'crop_doctor' }) => {
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

        let systemInstruction = '';
        let productList = [];

        if (mode === 'app_analytics') {
            // Lấy số liệu kinh doanh thời gian thực từ các endpoint
            let statsContext = '=== SỐ LIỆU KINH DOANH THỜI GIAN THỰC TỪ CƠ SỞ DỮ LIỆU LYANGPOS ===\n';
            try {
                const [statsRes, prodRes, partnerRes, profitProdRes] = await Promise.allSettled([
                    axios.get('/api/dashboard-stats'),
                    axios.get('/api/products'),
                    axios.get('/api/partners'),
                    axios.get('/api/reports/products?sort_by=profit&sort_order=desc')
                ]);

                if (statsRes.status === 'fulfilled' && statsRes.value?.data) {
                    const st = statsRes.value.data;
                    const todayRev = st.today_revenue ?? st.todayRevenue ?? 0;
                    const todayOrd = st.today_orders ?? st.todayOrders ?? 0;
                    const monthRev = st.month_revenue ?? st.monthRevenue ?? 0;
                    const monthOrd = st.month_orders ?? st.monthOrders ?? 0;
                    const collected = st.today_actual_collected ?? 0;
                    statsContext += `1. DOANH THU & ĐƠN HÀNG:
- Doanh thu hôm nay: ${Number(todayRev).toLocaleString('vi-VN')} đ (Số đơn: ${todayOrd})
- Thực thu tiền mặt/chuyển khoản hôm nay: ${Number(collected).toLocaleString('vi-VN')} đ
- Doanh thu tháng này: ${Number(monthRev).toLocaleString('vi-VN')} đ (Số đơn: ${monthOrd})\n\n`;
                }

                if (partnerRes.status === 'fulfilled' && partnerRes.value?.data) {
                    const partners = Array.isArray(partnerRes.value.data) ? partnerRes.value.data : (partnerRes.value.data?.data || []);
                    let custDebt = 0;
                    let suppDebt = 0;
                    let custCount = 0;
                    let suppCount = 0;
                    const topDebtors = [];
                    const topSuppliers = [];

                    partners.forEach(p => {
                        const bal = Number(p.debt_balance ?? 0);
                        const isCust = p.is_customer ?? (p.type === 'Customer' || p.type === 'customer' || !p.type);
                        const isSupp = p.is_supplier ?? (p.type === 'Supplier' || p.type === 'supplier');

                        if (isCust && bal > 0) {
                            custDebt += bal;
                            custCount += 1;
                            topDebtors.push({ name: p.name, phone: p.phone || '', debt: bal });
                        }
                        if (isSupp && bal < 0) {
                            const absBal = Math.abs(bal);
                            suppDebt += absBal;
                            suppCount += 1;
                            topSuppliers.push({ name: p.name, phone: p.phone || '', debt: absBal });
                        }
                    });

                    topDebtors.sort((a, b) => b.debt - a.debt);
                    topSuppliers.sort((a, b) => b.debt - a.debt);

                    statsContext += `2. CÔNG NỢ ĐỐI TÁC (PHẢI THU & PHẢI TRẢ CHI TIẾT):
- KHÁCH HÀNG (CÔNG NỢ PHẢI THU - KHÁCH NỢ CỬA HÀNG):
  * Tổng nợ cần thu: ${custDebt.toLocaleString('vi-VN')} đ (${custCount} khách hàng đang có nợ)
  * Top khách hàng có dư nợ cao nhất:
${topDebtors.slice(0, 10).map((td, i) => `    ${i + 1}. ${td.name} (${td.phone || 'Không SĐT'}): ${td.debt.toLocaleString('vi-VN')} đ`).join('\n') || '    (Không có khách hàng nào đang nợ)'}

- NHÀ CUNG CẤP (CÔNG NỢ PHẢI TRẢ - CỬA HÀNG NỢ NHÀ CUNG CẤP):
  * Tổng nợ cửa hàng phải trả: ${suppDebt.toLocaleString('vi-VN')} đ (${suppCount} nhà cung cấp)
  * Top nhà cung cấp cửa hàng đang nợ nhiều nhất:
${topSuppliers.slice(0, 8).map((td, i) => `    ${i + 1}. ${td.name} (${td.phone || 'Không SĐT'}): ${td.debt.toLocaleString('vi-VN')} đ`).join('\n') || '    (Cửa hàng không có nợ nhà cung cấp)'}\n\n`;
                }

                if (profitProdRes.status === 'fulfilled' && profitProdRes.value?.data) {
                    const profitList = Array.isArray(profitProdRes.value.data) ? profitProdRes.value.data : [];
                    if (profitList.length > 0) {
                        statsContext += `3. TOP SẢN PHẨM MANG LẠI LỢI NHUẬN CAO NHẤT (TOÀN THỜI GIAN):\n`;
                        profitList.slice(0, 12).forEach((p, i) => {
                            const profit = Number(p.profit || 0);
                            const rev = Number(p.revenue || 0);
                            const qty = Number(p.quantity || 0);
                            const unit = p.unit || 'cái';
                            const margin = rev > 0 ? ((profit / rev) * 100).toFixed(1) : 0;
                            statsContext += `  ${i + 1}. ${p.name}: Lợi nhuận ${profit.toLocaleString('vi-VN')} đ (Tỷ suất: ${margin}%) | Đã bán: ${qty} ${unit} | Doanh số: ${rev.toLocaleString('vi-VN')} đ\n`;
                        });
                        statsContext += '\n';
                    }
                }

                if (prodRes.status === 'fulfilled' && prodRes.value?.data) {
                    productList = Array.isArray(prodRes.value.data) ? prodRes.value.data : (prodRes.value.data?.data || []);
                    const lowStock = [];
                    const nearExpiry = [];
                    const now = new Date();
                    const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

                    productList.forEach(p => {
                        const stock = Number(p.stock || 0);
                        const minStock = Number(p.min_stock || 5);
                        if (stock <= minStock) {
                            lowStock.push(`${p.name} (Tồn: ${stock} ${p.unit || ''}, Tối thiểu: ${minStock})`);
                        }
                        if (p.expiry_date) {
                            const exp = new Date(p.expiry_date);
                            if (!isNaN(exp.getTime()) && exp <= thirtyDaysLater) {
                                nearExpiry.push(`${p.name} (HSD: ${p.expiry_date}, Tồn: ${stock} ${p.unit || ''})`);
                            }
                        }
                    });

                    statsContext += `4. CẢNH BÁO KHO & HÀNG HÓA:
- Tổng số mặt hàng trong danh mục: ${productList.length}
- Hàng sắp hết kho hoặc dưới mức tồn tối thiểu (${lowStock.length} món):
${lowStock.slice(0, 10).map(s => `  * ${s}`).join('\n') || '  (Kho hàng dồi dào, không có mặt hàng nào dưới mức cảnh báo)'}
- Hàng cận hạn sử dụng (< 30 ngày) (${nearExpiry.length} món):
${nearExpiry.slice(0, 8).map(s => `  * ${s}`).join('\n') || '  (Không có mặt hàng cận date)'}\n`;
                }
            } catch (e) {
                statsContext += '(Không thể đọc số liệu chi tiết từ máy chủ)\n';
            }

            systemInstruction = `Bạn là LyangAI - Chuyên viên Phân tích Dữ liệu Kinh doanh & Hoạt động Cửa hàng LyangPOS.
Nhiệm vụ của bạn là giải đáp, tổng hợp và báo cáo số liệu kinh doanh một cách chính xác, trực quan, chuyên nghiệp dựa trên dữ liệu thời gian thực được cung cấp dưới đây.

★★★ NGUYÊN TẮC BÁO CÁO SỐ LIỆU:
1. Dựa hoàn toàn vào dữ liệu thực tế được cung cấp bên dưới, KHÔNG bịa đặt hay tự suy đoán số liệu tài chính hoặc số lượng tồn kho.
2. Trình bày số liệu tài chính rõ ràng bằng định dạng tiền tệ VNĐ (ví dụ: 1.500.000 đ, 25.400.000 đ).
3. Đưa ra các phân tích hữu ích kèm đề xuất hành động thực tế (Ví dụ: đề xuất gọi điện nhắc nợ cho top khách nợ lớn, tạo đơn nhập hàng cho các sản phẩm sắp hết kho, đưa ra chương trình xả hàng giảm giá cho hàng cận hạn dùng).
4. Sử dụng Markdown đẹp mắt: bảng số liệu, danh sách gạch đầu dòng, in đậm các con số quan trọng, icon sinh động.

${statsContext}`;

        } else if (mode === 'general_assistant') {
            systemInstruction = `Bạn là LyangAI - Trợ lý Trí tuệ Nhân tạo Đa năng Thông minh (dựa trên mô hình Gemini thế hệ mới).
Bạn đồng hành cùng chủ cửa hàng, nhân viên và bà con nông dân trong mọi hoạt động kinh doanh và đời sống thường ngày.

★★★ KHẢ NĂNG CỦA BẠN:
1. Soạn thảo văn bản chuyên nghiệp: Tin nhắn Zalo/SMS gửi khách hàng thông báo khuyến mãi, lời chúc lễ tết, thư cảm ơn, bài viết Fanpage bán lẻ phân bón/thuốc BVTV.
2. Lập kế hoạch & Quản lý: Lên lịch phân công công việc nhân viên cửa hàng, quy trình đóng gói/giao nhận, kế hoạch nhập hàng theo mùa vụ.
3. Kiến thức & Kỹ thuật Nông nghiệp: Nguyên lý dinh dưỡng cây trồng, thổ nhưỡng, phương pháp bảo quản phân bón và thuốc BVTV an toàn, mẹo canh tác tiết kiệm chi phí.
4. Tính toán & Dịch thuật & Hỏi đáp tự do: Tính tỉ lệ pha, toán học kinh doanh, dịch thuật đa ngôn ngữ, trả lời mọi thắc mắc đời sống một cách thân thiện, chính xác và có chiều sâu.

HÃY TRẢ LỜI BẰNG TIẾNG VIỆT TỰ NHIÊN, LỊCH SỰ, RÕ RÀNG VÀ HỮU ÍCH NHẤT CÓ THỂ. Sử dụng Markdown linh hoạt (tiêu đề, gạch đầu dòng, highlight số liệu/nội dung quan trọng).`;

        } else {
            // mode === 'crop_doctor'
            let productKB = 'DANH MỤC SẢN PHẨM & HOẠT CHẤT TRONG KHO CỬA HÀNG:\n';
            let uniqueAdvancedActives = [];
            let uniqueCommonActives = [];
            let allUniqueActives = [];

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

                    productList.forEach(p => {
                        if (p.active_ingredient && p.active_ingredient.trim()) {
                            const extracted = extractActiveIngredients(p.active_ingredient);
                            extracted.forEach(item => {
                                const clean = item.trim();
                                if (!clean) return;
                                if (!allUniqueActives.some(x => x.toLowerCase() === clean.toLowerCase())) {
                                    allUniqueActives.push(clean);
                                }
                                if (isAdvancedActive(clean)) {
                                    if (!uniqueAdvancedActives.some(x => x.toLowerCase() === clean.toLowerCase())) {
                                        uniqueAdvancedActives.push(clean);
                                    }
                                } else {
                                    if (!uniqueCommonActives.some(x => x.toLowerCase() === clean.toLowerCase())) {
                                        uniqueCommonActives.push(clean);
                                    }
                                }
                            });
                        }
                    });

                    const advStr = uniqueAdvancedActives.length > 0 ? uniqueAdvancedActives.join(', ') : '(Kho chưa có hoặc chưa điền hoạt chất thế hệ mới)';
                    const comStr = uniqueCommonActives.length > 0 ? uniqueCommonActives.join(', ') : '(Chưa có hoạt chất phổ thông)';
                    const allStr = allUniqueActives.length > 0 ? allUniqueActives.join(', ') : '(Chưa có dữ liệu hoạt chất trong kho)';

                    productList.slice(0, 500).forEach(p => {
                        const active = p.active_ingredient || 'Chưa có';
                        const unit = p.unit || '';
                        const price = p.sale_price || 0;
                        const stock = p.stock || 0;
                        const isAdv = isAdvancedActive(p.active_ingredient);
                        const tag = isAdv ? '[🌟 TẦNG 1: CÔNG NGHỆ MỚI]' : (p.active_ingredient && p.active_ingredient.trim() ? '[🌾 TẦNG 2: PHỔ THÔNG]' : '[CHƯA RÕ HOẠT CHẤT]');
                        productKB += `- [ID:${p.id}] Tên: ${p.name} | Hoạt chất: ${active} | ĐVT: ${unit} | Giá: ${price}đ | Tồn: ${stock} | Phân loại: ${tag}\n`;
                    });

                    systemInstruction = `Bạn là LyangAI - Chuyên gia Cố vấn Nông nghiệp & Dược học Cây trồng cao cấp (Plant Protection & Agronomy AI Expert) của cửa hàng LyangPOS.

★★★ CHIẾN LƯỢC TƯ VẤN PHÂN TẦNG BẮT BUỘC (TUÂN THỦ 100%):
Khi người dùng hỏi về bệnh hại, sâu hại, bọ trĩ, rầy rệp hoặc chăm sóc cây trồng, bạn TUYỆT ĐỐI KHÔNG ĐƯỢC CHỈ đưa ra các hoạt chất quen thuộc cũ (như chỉ chăm chăm nói Mancozeb, Difenoconazole, Abamectin...).
BẮT BUỘC bạn phải quét qua TOÀN BỘ DANH SÁCH HOẠT CHẤT TRONG KHO (đặc biệt là NHÓM THẾ HỆ MỚI) và trình bày câu trả lời theo **CHIẾN LƯỢC TƯ VẤN PHÂN TẦNG RÕ RÀNG**:

---
### 🌿 CẤU TRÚC BÀI TƯ VẤN BẮT BUỘC:

1. **CHẨN ĐOÁN & NGUYÊN NHÂN CỐT LÕI (Ngắn gọn)**:
   - Tên bệnh/sâu hại, nguyên nhân (nấm, vi khuẩn, côn trùng chích hút, bọ trĩ kháng thuốc...).

2. **🚀 TẦNG 1: GIẢI PHÁP ĐẶC TRỊ CÔNG NGHỆ MỚI / CHỐNG KHÁNG THUỐC (Ưu tiên số 1 từ kho)**:
   - **Mục tiêu**: Dập dịch cấp tốc, bẻ gãy tính lờn thuốc của sâu/nấm, bảo vệ đọt non/bông/trái an toàn.
   - **Hành động bắt buộc**: Bạn PHẢI rà soát trong danh sách [🌟 NHÓM HOẠT CHẤT THẾ HỆ MỚI / TIÊN TIẾN TRONG KHO] để chọn ra hoạt chất đặc trị mạnh nhất có sẵn trong kho.
     * Ví dụ:
       - Trừ nấm/bệnh phổ mới (SDHI, Carboxamide, CAA...): Pydiflumetofen (Miravis Duo), Fluxapyroxad (Sercadis), Fluopyram (Luna), Oxathiapiprolin (Zorvec), Pyraclostrobin (Cabrio Top), Mandipropamid (Revus), Metiram (Polyram), Boscalid, Cyazofamid...
       - Trừ sâu/bọ trĩ/rầy/nhện phổ mới (Spinosyn, Diamide, Pyrrole, Ketoenol, Pyropene...): Spinetoram (Radiant), Flupyrimin, Sulfoxaflor (Transform), Broflanilide (Incipio), Chlorfenapyr, Cyantraniliprole (Benevia), Chlorantraniliprole (Virtako), Flonicamid (Teppeki), Spirotetramat (Movento), Spirodiclofen (Envidor), Fenpyroximate (Ortus), Lufenuron, Pyriproxyfen...
   - **Phân tích cơ chế vượt trội**: Giải thích vì sao hoạt chất này diệt dứt điểm (tác động vào thụ thể mới lạ, ức chế enzyme tế bào, hiệu lực lưu dẫn kéo dài, tính mát êm cây không làm teo đọt, không rụng hoa, không lem vỏ trái).
   - **Sản phẩm cụ thể trong kho**: Chỉ định rõ Tên sản phẩm, Hoạt chất, Giá bán và Tồn kho từ danh mục kho.
   - **Liều pha cụ thể**: Nêu rõ liều cho bình 16L, 25L hoặc phuy 200L (Ví dụ: 20-25ml/bình 25L hoặc 1 chai/phuy 200L) và thời điểm phun tốt nhất.

3. **🌾 TẦNG 2: GIẢI PHÁP PHỔ THÔNG / TIẾT KIỆM CHI PHÍ (Giải pháp kinh tế & Phòng ngừa từ kho)**:
   - **Mục tiêu**: Tiết kiệm chi phí mùa vụ, phun phòng ngừa định kỳ đón đọt/sau mưa khi áp lực sâu bệnh chưa bùng phát nặng.
   - **Hành động**: Nhặt các sản phẩm chứa hoạt chất kinh điển, giá rẻ hơn có sẵn trong kho (như Mancozeb, Difenoconazole, Azoxystrobin, Hexaconazole, Metalaxyl, Abamectin, Thiamethoxam, Imidacloprid, Validamycin, Carbendazim, Copper Oxychloride...).
   - **Sản phẩm cụ thể trong kho**: Chỉ định rõ Tên sản phẩm, Hoạt chất, Giá bán và Tồn kho từ danh mục kho.
   - **Liều pha cụ thể**: Nêu rõ liều cho bình 16L, 25L hoặc phuy 200L.

4. **🔄 CHIẾN THUẬT PHỐI TRỘN & LUÂN PHIÊN (Bí kíp nhà nghề)**:
   - Hướng dẫn luân phiên cữ phun: Cữ 1 dập dịch bằng Tầng 1 (công nghệ mới), cữ 2 (cách 5-7 ngày) đổi sang Tầng 2 hoặc luân chuyển nhóm gốc thuốc khác để sâu bệnh không kịp thích nghi tạo kháng thể.
   - Nguyên tắc phối trộn an toàn: Thứ tự pha (Bột WP/WG -> Huyền phù SC -> Nhũ dầu EC -> Phân bón lá/Dưỡng), không pha chung với vôi/gốc đồng kiềm mạnh nếu chưa kiểm tra tương thích.

---
### 📦 DỮ LIỆU ĐỐI CHIẾU TRONG KHO CỬA HÀNG:

🌟 **NHÓM HOẠT CHẤT THẾ HỆ MỚI / TIÊN TIẾN TRONG KHO (BẮT BUỘC DÙNG CHO TẦNG 1 NẾU PHÙ HỢP)**:
${advStr}

🌾 **NHÓM HOẠT CHẤT PHỔ THÔNG / KINH ĐIỂN TRONG KHO (DÙNG CHO TẦNG 2)**:
${comStr}

📚 **TOÀN BỘ HOẠT CHẤT CÓ TRONG KHO**:
${allStr}

${productKB}

QUY TẮC BẮT BUỘC VỀ DỮ LIỆU ĐỀ XUẤT (JSON BLOCK):
Ở CUỐI CÙNG CỦA CÂU TRẢ LỜI, nếu câu hỏi về tư vấn thuốc/bệnh, bạn BẮT BUỘC phải đối chiếu và chọn ra từ 2 đến 6 sản phẩm phù hợp nhất đại diện cho CẢ TẦNG 1 VÀ TẦNG 2 có trong kho hàng phía trên để xuất ra khối JSON code block theo đúng mẫu sau:
\`\`\`recommended_products
[
  {
    "id": 123,
    "name": "Tên sản phẩm đúng theo kho",
    "active_ingredient": "Hoạt chất của sản phẩm",
    "dosage": "Liều dùng: 20-25ml/bình 25L (hoặc 1 chai/phuy 200L)",
    "tier": "Tầng 1 (Công nghệ mới)",
    "sale_price": 185000,
    "unit": "Chai",
    "stock": 15
  },
  {
    "id": 456,
    "name": "Tên sản phẩm đúng theo kho",
    "active_ingredient": "Hoạt chất của sản phẩm",
    "dosage": "Liều dùng: 30ml/bình 25L",
    "tier": "Tầng 2 (Phổ thông)",
    "sale_price": 95000,
    "unit": "Chai",
    "stock": 30
  }
]
\`\`\`
Nếu không có sản phẩm phù hợp trong kho, xuất:
\`\`\`recommended_products
[]
\`\`\``;
                }
            } catch (e) {
                productKB += '(Không thể đọc danh mục sản phẩm từ server)\n';
            }
        }

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
                temperature: mode === 'crop_doctor' ? 0.4 : (mode === 'app_analytics' ? 0.2 : 0.6),
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

        // Bóc tách khối recommended_products (chỉ dùng trong chế độ tư vấn thuốc)
        let recommended_products = [];
        let cleanReply = replyText;

        if (mode === 'crop_doctor') {
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
                    images: userMsg.images,
                    mode: activeMode
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
                    images: userMsg.images,
                    mode: activeMode
                });
            }

            const modelMsg = {
                id: (Date.now() + 1).toString(),
                role: 'model',
                text: result?.reply || 'Không có phản hồi từ AI.',
                recommended_products: result?.recommended_products || []
            };

            setMessages(prev => [...prev, modelMsg]);

            // Tự động phát âm thanh giọng đọc nếu người dùng bật chế độ Auto-Speak
            if (autoSpeak && modelMsg.text) {
                setTimeout(() => {
                    handleSpeak(modelMsg.id, modelMsg.text);
                }, 300);
            }
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
                        className="px-4 py-2.5 flex items-center justify-between border-b border-white/10 text-white shadow-sm shrink-0 select-none relative overflow-hidden"
                    >
                        {/* Shimmer line */}
                        <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none" />

                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center border border-white/25 shadow-xs relative">
                                <currentModeConfig.icon size={17} className="text-white" />
                                <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-[#163d18] shadow-xs" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h3 className="font-black text-sm tracking-wide text-white drop-shadow-xs">
                                        LYANGAI
                                    </h3>
                                    <span className="bg-white/20 text-white text-[9.5px] font-black px-2 py-0.5 rounded-full border border-white/20 flex items-center gap-1 shadow-2xs">
                                        {currentModeConfig.shortLabel}
                                    </span>
                                </div>
                                <p className="text-[10px] text-white/80 font-medium leading-none mt-0.5">
                                    {currentModeConfig.subTitle}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                            {/* Nút chỉnh cỡ chữ (A- và A+) */}
                            <div 
                                className="flex items-center bg-black/25 rounded-full p-0.5 text-white border border-white/15 shadow-inner gap-0.5 overflow-hidden"
                                title="Chỉnh kích thước chữ trò chuyện (A- / A+)"
                            >
                                <button
                                    type="button"
                                    onClick={() => handleFontSizeChange(-1)}
                                    disabled={fontSize <= 11}
                                    title="Giảm cỡ chữ (A-)"
                                    className="px-2 py-0.5 flex items-center justify-center hover:bg-white/20 active:scale-95 disabled:opacity-30 rounded-l-full text-[11px] font-black transition-all"
                                >
                                    A-
                                </button>
                                <div className="w-[1px] h-3 bg-white/20" />
                                <button
                                    type="button"
                                    onClick={() => handleFontSizeChange(1)}
                                    disabled={fontSize >= 22}
                                    title="Tăng cỡ chữ (A+)"
                                    className="px-2 py-0.5 flex items-center justify-center hover:bg-white/20 active:scale-95 disabled:opacity-30 rounded-r-full text-[11px] font-black transition-all"
                                >
                                    A+
                                </button>
                            </div>

                            {/* Nút bật/tắt tự động đọc giọng nói AI */}
                            <button
                                type="button"
                                onClick={toggleAutoSpeak}
                                title={autoSpeak ? "Tự động đọc to: Đang BẬT (Bấm để tắt)" : "Tự động đọc to: Đang TẮT (Bấm để bật)"}
                                className={`p-1.5 rounded-lg active:scale-95 transition-all flex items-center justify-center ${
                                    autoSpeak 
                                        ? 'bg-amber-400 text-stone-900 shadow-xs font-bold' 
                                        : 'hover:bg-white/20 text-white/90 hover:text-white'
                                }`}
                            >
                                {autoSpeak ? <Volume2 size={14} className="animate-pulse" /> : <VolumeX size={14} />}
                            </button>

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

                    {/* 3-Mode Segmented Tab Switcher */}
                    <div className="px-2.5 py-1.5 bg-[#edf3ea] dark:bg-[#0a1811] border-b border-stone-200/80 dark:border-white/10 flex items-center gap-1.5 shrink-0 select-none">
                        {MODES.map((m) => {
                            const IconComponent = m.icon;
                            const isActive = activeMode === m.id;
                            return (
                                <button
                                    key={m.id}
                                    type="button"
                                    onClick={() => handleSwitchMode(m.id)}
                                    title={m.desc}
                                    className={`flex-1 py-1 px-1.5 rounded-xl text-[11px] font-black flex items-center justify-center gap-1.5 transition-all select-none ${
                                        isActive 
                                            ? `${m.activeBg} text-white shadow-xs scale-[1.01]` 
                                            : 'bg-white dark:bg-white/5 text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-white/10 hover:text-stone-900 dark:hover:text-white border border-stone-200/70 dark:border-white/5'
                                    }`}
                                >
                                    <IconComponent size={13} className={isActive ? 'text-white' : 'opacity-70'} />
                                    <span className="truncate">{m.label}</span>
                                </button>
                            );
                        })}
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
                                        {/* Nút Loa Nghe đọc & Nút Copy */}
                                        {msg.role === 'model' && (
                                            <div className={`absolute top-2.5 right-2.5 flex items-center gap-1 z-10 transition-opacity ${
                                                speakingMsgId === msg.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                                            }`}>
                                                <button 
                                                    type="button"
                                                    onClick={() => handleSpeak(msg.id, msg.text)}
                                                    title={speakingMsgId === msg.id ? "Dừng đọc" : "Nghe đọc to câu trả lời (tiếng Việt)"}
                                                    className={`p-1.5 rounded-lg transition-all ${
                                                        speakingMsgId === msg.id 
                                                            ? 'bg-emerald-600 text-white shadow-xs animate-pulse ring-2 ring-emerald-400/40' 
                                                            : 'bg-stone-100 dark:bg-white/10 hover:bg-stone-200 dark:hover:bg-white/20 text-stone-600 dark:text-stone-300'
                                                    }`}
                                                >
                                                    {speakingMsgId === msg.id ? <Square size={12} className="fill-current text-white" /> : <Volume2 size={13} />}
                                                </button>

                                                {msg.id !== 'welcome' && (
                                                    <button 
                                                        type="button"
                                                        onClick={() => handleCopy(msg.text, idx)}
                                                        title="Sao chép câu trả lời"
                                                        className="p-1.5 rounded-lg bg-stone-100 dark:bg-white/10 hover:bg-stone-200 dark:hover:bg-white/20 text-stone-500 dark:text-stone-300 transition-all"
                                                    >
                                                        {copiedIndex === idx ? <CheckCheck size={13} className="text-emerald-600 dark:text-emerald-400" /> : <Copy size={13} />}
                                                    </button>
                                                )}
                                            </div>
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
                                                                        <div className="min-w-0 flex-1">
                                                                            <h5 
                                                                                style={{ fontSize: `${Math.max(12.5, fontSize)}px` }}
                                                                                className="font-black text-stone-900 dark:text-white leading-snug"
                                                                            >
                                                                                {prod.name}
                                                                            </h5>
                                                                            {prod.tier && (
                                                                                <div className="mt-1">
                                                                                    <span className={`inline-flex items-center gap-1 text-[9.5px] font-black px-2 py-0.5 rounded-md border ${
                                                                                        prod.tier.includes('1') || prod.tier.toLowerCase().includes('mới')
                                                                                            ? 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border-emerald-500/30'
                                                                                            : 'bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/30'
                                                                                    }`}>
                                                                                        {prod.tier.includes('1') || prod.tier.toLowerCase().includes('mới') ? '🌟 ' : '🌾 '}
                                                                                        {prod.tier}
                                                                                    </span>
                                                                                </div>
                                                                            )}
                                                                        </div>
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
                                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                    <p 
                                        style={{ fontSize: `${Math.max(11.5, fontSize - 1)}px` }}
                                        className="font-bold text-emerald-800 dark:text-emerald-300"
                                    >
                                        {currentModeConfig.loadingText}
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

                    {/* Quick Suggestion Chips */}
                    {currentModeConfig.suggestions && currentModeConfig.suggestions.length > 0 && (
                        <div className="px-3 py-1.5 bg-[#f5f8f4] dark:bg-[#06110c] border-t border-stone-200/60 dark:border-white/5 flex items-center gap-1.5 overflow-x-auto custom-scrollbar shrink-0 select-none">
                            <span className="text-[9px] font-black uppercase tracking-wider text-stone-400 dark:text-stone-500 shrink-0">
                                Gợi ý:
                            </span>
                            {currentModeConfig.suggestions.map((sug, sIdx) => (
                                <button
                                    key={sIdx}
                                    type="button"
                                    onClick={() => handleSend(sug.query)}
                                    disabled={isLoading}
                                    title={sug.query}
                                    className="shrink-0 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-white dark:bg-white/10 text-stone-700 dark:text-stone-200 hover:text-emerald-700 dark:hover:text-emerald-300 border border-stone-200/90 dark:border-white/10 hover:border-emerald-500 dark:hover:border-emerald-400 shadow-2xs active:scale-95 transition-all select-none"
                                >
                                    {sug.label}
                                </button>
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
                                    placeholder={currentModeConfig.placeholder}
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
