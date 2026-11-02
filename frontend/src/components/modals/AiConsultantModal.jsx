import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import {
    BrainCircuit, Sparkles, Send, Trash2, ShoppingCart,
    Check, Leaf, X, Copy,
    CheckCheck, Image as ImageIcon,
    FlaskConical, Droplets, Maximize2, Minimize2,
    BarChart3, TrendingUp, Bot, FileText,
    ShieldAlert, Stethoscope, Zap, Beaker, CheckCircle2, ChevronRight,
    Sun, Moon, Share2, Link2, Home, ArrowLeft,
    Camera, ShieldCheck, Microscope, Bug,
    DollarSign, Crown, AlertTriangle, Trophy, CreditCard, Clock,
    MessageSquare, Calculator, Languages, FileEdit,
    Settings, RefreshCw, Cpu, GripHorizontal, RotateCcw, Move,
    Palette, Search, Filter, BookOpen, Scale, ArrowRight, Info, LayoutGrid
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { cn } from '../../lib/utils';
import { MASCOT_LIST } from '../../lib/mascots';
import SearchTypingOverlay from '../widgets/SearchTypingOverlay';
import HeavyClock from '../widgets/HeavyClock';
import { SidebarMascotLogo } from '../layout/Layout';
import { useProductData } from '../../queries/useProductData';
import { checkIsAdmin } from '../../lib/auth';

const getActiveMascot = () => {
    try {
        const saved = localStorage.getItem('lyang_mascot_config');
        if (saved) {
            const parsed = JSON.parse(saved);
            const charId = parsed.characterId || 'lyang';
            const found = (MASCOT_LIST || []).find(m => m.id === charId);
            if (found) {
                if (found.id === 'lyang' || found.name?.includes('Lyang')) {
                    return { ...found, name: 'Lí An' };
                }
                return found;
            }
        }
    } catch (e) { }
    return {
        id: 'lyang',
        name: 'Lí An',
        avatar: '/mascots/avatar-lyang.webp',
        emoji: '🌾'
    };
};

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
        welcomeText: 'Xin chào! Tôi là **Lí An AI - Cố Vấn Hoạt Chất & Nông Nghiệp Thông Minh**.\n\nHãy nhập triệu chứng cây trồng, loại sâu bệnh hoặc **nhấn Ctrl+V để dán ảnh lá/trái bị bệnh**, tôi sẽ chẩn đoán ngay và đối chiếu thuốc trong kho giúp bạn!',
        loadingText: 'Lí An AI đang tra cứu hoạt chất & đối chiếu kho thuốc...',
        suggestions: [
            { icon: Camera, iconColor: 'text-teal-500', label: 'Dán ảnh khám bệnh (Ctrl+V)', query: 'Hướng dẫn tôi cách chụp hoặc nhấn Ctrl+V để dán ảnh lá cây, vết bệnh vào đây cho AI chẩn đoán và kê đơn thuốc từ kho?' },
            { icon: Zap, iconColor: 'text-amber-500', label: 'Phối bọ trĩ lờn thuốc', query: 'Bọ trĩ thanh long bị kháng thuốc nặng gây quăn bông, đen tai, tư vấn bộ phối trộn hoạt chất có trong kho để tăng lực dập dịch và liều pha?' },
            { icon: FlaskConical, iconColor: 'text-emerald-500', label: 'Phối thán thư + thối nhũn vi khuẩn', query: 'Thanh long bị thán thư kết hợp thối nhũn vi khuẩn trên cành và bông mùa mưa, tư vấn bộ phối nấm + khuẩn từ các sản phẩm trong kho?' },
            { icon: ShieldAlert, iconColor: 'text-rose-500', label: 'Đốm nâu (Tắc kè) thanh long', query: 'Thanh long bị bệnh đốm nâu (đốm trắng / tắc kè) trên cành và trái non, rà soát toàn bộ hoạt chất đặc trị có trong kho và công thức phối trộn hiệu quả nhất?' },
            { icon: Bug, iconColor: 'text-amber-500', label: 'Phối rệp sáp & rầy bồ hóng', query: 'Rệp sáp và rầy phấn trắng bu nụ bông tạo nấm bồ hóng đen, tư vấn phối hợp hoạt chất hạ gục + lưu dẫn ức chế lột xác trong kho?' },
            { icon: Droplets, iconColor: 'text-sky-500', label: 'Thối cành & xì mủ Phytophthora', query: 'Cành thanh long bị thối nhũn và nứt thân xì mủ, rà soát hoạt chất Oomycetes và vi khuẩn trong kho để phối thuốc chặn lây lan?' },
            { icon: Leaf, iconColor: 'text-green-500', label: 'Vuốt tai & Đẹp trái', query: 'Tư vấn phân thuốc và kích thích sinh trưởng giúp trái thanh long đỏ da, tai dày xanh cứng, không bị lem trái?' }
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
        welcomeText: 'Xin chào! Tôi là **Lí An AI - Trợ Lý Phân Tích Số Liệu Toàn Diện**.\n\nTôi có thể trả lời các câu hỏi thời gian thực về **doanh thu, đơn hàng, công nợ khách hàng / nhà cung cấp, tồn kho và mặt hàng sắp hết / cận date** trong toàn bộ hệ thống!',
        loadingText: 'Lí An AI đang phân tích số liệu toàn bộ phần mềm...',
        suggestions: [
            { icon: DollarSign, iconColor: 'text-emerald-500', label: 'Tổng vốn tồn kho', query: 'Tổng vốn lưu động đang nằm trong kho là bao nhiêu tiền và những mặt hàng nào đang giam vốn nhiều nhất?' },
            { icon: Crown, iconColor: 'text-amber-500', label: 'Top khách VIP mua nhiều nhất', query: 'Những khách hàng nào mua nhiều tiền nhất từ trước đến nay và tình hình công nợ của họ ra sao?' },
            { icon: TrendingUp, iconColor: 'text-blue-500', label: 'So sánh tháng này & tháng trước', query: 'So sánh tổng kết doanh thu, số đơn và lợi nhuận gộp của tháng này với tháng trước?' },
            { icon: BarChart3, iconColor: 'text-indigo-500', label: 'Doanh thu hôm nay / gần nhất', query: 'Hôm nay hoặc ngày bán gần đây nhất cửa hàng bán được bao nhiêu đơn, tổng doanh thu và thực thu thế nào?' },
            { icon: AlertTriangle, iconColor: 'text-rose-500', label: 'Hàng ế đọng vốn', query: 'Những mặt hàng nào đang bị đọng vốn lâu ngày, tồn kho nhiều mà 60 ngày qua bán chậm cần xả hàng?' },
            { icon: Trophy, iconColor: 'text-amber-500', label: 'Top mặt hàng bán chạy nhất', query: 'Top 10 mặt hàng bán chạy nhất lịch sử từ trước đến nay và tổng doanh số mang lại?' },
            { icon: CreditCard, iconColor: 'text-purple-500', label: 'Công nợ khách nợ nhiều nhất', query: 'Tổng công nợ khách hàng hiện tại là bao nhiêu và những ai đang nợ nhiều nhất cần thu hồi?' },
            { icon: Clock, iconColor: 'text-orange-500', label: 'Hàng cận date / sắp hết kho', query: 'Có những sản phẩm nào sắp hết hạn sử dụng hoặc tồn kho thấp hơn mức cảnh báo không?' }
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
        welcomeText: 'Xin chào! Tôi là **Lí An AI - Trợ Lý Đa Năng Thông Minh (Gemini)**.\n\nBạn có thể hỏi tôi bất cứ điều gì: **soạn tin nhắn Zalo gửi khách, lập kế hoạch công việc, dịch thuật, tính toán, tra cứu kiến thức đời sống & nông nghiệp**!',
        loadingText: 'Lí An AI đang suy nghĩ và tổng hợp câu trả lời...',
        suggestions: [
            { icon: MessageSquare, iconColor: 'text-purple-500', label: 'Soạn tin Zalo đòi nợ tế nhị', query: 'Hãy soạn giúp tôi một tin nhắn Zalo gửi cho khách hàng thân thiết để nhắc công nợ một cách tế nhị, lịch sự và giữ mối quan hệ lâu dài?' },
            { icon: Calculator, iconColor: 'text-pink-500', label: 'Tính chiết khấu & điểm hòa vốn', query: 'Hướng dẫn tôi cách tính nhanh tỷ lệ phần trăm chiết khấu và điểm hòa vốn khi nhập một lô hàng lớn?' },
            { icon: Languages, iconColor: 'text-indigo-500', label: 'Giải thích thuật ngữ BVTV', query: 'Giải thích chi tiết cơ chế tác động và sự khác biệt giữa hoạt chất trừ sâu nhóm Diamide và nhóm Spinosyn?' },
            { icon: FileEdit, iconColor: 'text-amber-500', label: 'Soạn cam kết cung cấp hàng', query: 'Soạn thảo giúp tôi một mẫu cam kết cung cấp vật tư nông nghiệp và thời hạn thanh toán công nợ đơn giản, rõ ràng?' }
        ]
    }
];

const CHAT_THEMES = [
    {
        id: 'transparent',
        name: 'Trong Suốt',
        subName: 'Hình nền POS',
        icon: '🪟',
        preview: 'transparent',
        isTransparent: true,
        lightBg: 'transparent',
        darkBg: 'transparent',
        bubbleLight: '#ffffff',
        bubbleDark: '#111827'
    },
    {
        id: 'cream',
        name: 'Mộc Mạc',
        subName: 'Warm Cream',
        icon: '🌾',
        preview: '#f5f3ec',
        lightBg: '#f5f3ec',
        darkBg: '#0c150e',
        bubbleLight: '#f5f3ec',
        bubbleDark: '#0c150e'
    },
    {
        id: 'white',
        name: 'Trắng Tuyết',
        icon: '🤍',
        preview: '#ffffff',
        lightBg: '#ffffff',
        darkBg: '#111827',
        bubbleLight: '#ffffff',
        bubbleDark: '#111827'
    },
    {
        id: 'emerald',
        name: 'Ngọc Bích',
        icon: '🌿',
        preview: '#10b981',
        lightBg: '#f0faf4',
        darkBg: '#071710',
        bubbleLight: '#f0faf4',
        bubbleDark: '#071710'
    },
    {
        id: 'amber',
        name: 'Gỗ Mộc',
        icon: '🌾',
        preview: '#f59e0b',
        lightBg: '#faf5ea',
        darkBg: '#181309',
        bubbleLight: '#faf5ea',
        bubbleDark: '#181309'
    },
    {
        id: 'ocean',
        name: 'Đại Dương',
        icon: '🌊',
        preview: '#0ea5e9',
        lightBg: '#f0f7fd',
        darkBg: '#081422',
        bubbleLight: '#f0f7fd',
        bubbleDark: '#081422'
    },
    {
        id: 'violet',
        name: 'Thạch Anh',
        icon: '🍇',
        preview: '#8b5cf6',
        lightBg: '#f6f1fc',
        darkBg: '#140c21',
        bubbleLight: '#f6f1fc',
        bubbleDark: '#140c21'
    },
    {
        id: 'rose',
        name: 'Hoa Đào',
        icon: '🌸',
        preview: '#f43f5e',
        lightBg: '#fcf0f3',
        darkBg: '#210c12',
        bubbleLight: '#fcf0f3',
        bubbleDark: '#210c12'
    },
    {
        id: 'slate',
        name: 'Than Chì',
        icon: '🌑',
        preview: '#475569',
        lightBg: '#f2f4f7',
        darkBg: '#0f172a',
        bubbleLight: '#f2f4f7',
        bubbleDark: '#0f172a'
    }
];

const ACTIVE_TAXONOMY = [
    {
        groupId: '01_BACTERICIDE',
        groupName: 'Đặc Trị Vi Khuẩn Cây Trồng (Thối nhũn, loét cành, cháy bìa lá)',
        roleType: 'Đặc Trị Vi Khuẩn',
        moaDesc: 'Ức chế tổng hợp protein hoặc phá vỡ vách tế bào vi khuẩn. Đặc trị vết loét, thối nhũn, đốm sọc vi khuẩn. Bắt buộc phối hợp với thuốc nấm khi vết bệnh có dấu hiệu nhiễm khuẩn đôi.',
        isAdvanced: (l) => l.includes('kasugamycin') || l.includes('streptomycin') || l.includes('ningnanmycin'),
        keywords: [
            'kasugamycin', 'kasumin', 'streptomycin', 'ningnanmycin', 'bismerthiazol',
            'xantocid', 'oxolinic', 'starner', 'oxytetracycline', 'bronopol', 'nano bac',
            'nano dong', 'chitosan', 'thiodiazole copper', 'validamycin'
        ]
    },
    {
        groupId: '02_FUNGICIDE_SDHI',
        groupName: 'Trừ Nấm SDHI & Công Nghệ Mới (Đặc trị thán thư, đốm nâu/đốm trắng thanh long)',
        roleType: 'Trừ Nấm SDHI Cao Cấp',
        moaDesc: 'Ức chế enzyme Succinate Dehydrogenase (phức hợp II), dập tắt hoàn toàn hô hấp tế bào nấm. Hiệu lực cực mạnh, lưu dẫn kéo dài, tính mát êm bông không gây teo đọt hay nám trái non.',
        isAdvanced: () => true,
        keywords: [
            'pydiflumetofen', 'miravis', 'fluxapyroxad', 'sercadis', 'fluopyram', 'luna',
            'boscalid', 'cantus', 'thifluzamide', 'isopyrazam', 'bixafen', 'sedaxane',
            'benzovindiflupyr', 'penflufen'
        ]
    },
    {
        groupId: '03_FUNGICIDE_TRIAZOLE',
        groupName: 'Trừ Nấm Triazole Nội Hấp Thấm Sâu (Diệt sợi nấm ẩn sâu trong mô cây)',
        roleType: 'Trừ Nấm Nội Hấp',
        moaDesc: 'Ức chế sinh tổng hợp Ergosterol màng tế bào nấm. Lưu dẫn nội hấp mạnh hai chiều, dập dịch thán thư, đốm lá, nấm hồng, lem lép hạt; chặn đứng mầm bệnh đang phát triển.',
        isAdvanced: (l) => l.includes('tebuconazole') || l.includes('difenoconazole'),
        keywords: [
            'difenoconazole', 'score', 'hexaconazole', 'anvil', 'tebuconazole', 'nativo',
            'propiconazole', 'tilt', 'epoxiconazole', 'tetraconazole', 'paclobutrazol',
            'cyproconazole', 'flusilazole', 'myclobutanil', 'triadimefon'
        ]
    },
    {
        groupId: '04_FUNGICIDE_STROBILURIN',
        groupName: 'Trừ Nấm Strobilurin & Kích Hoạt Xanh Lá (Phổ rộng, phòng & trị nấm)',
        roleType: 'Trừ Nấm & Xanh Lá',
        moaDesc: 'Ức chế hô hấp phức hợp III tế bào nấm; ngăn ngừa bào tử nảy mầm đồng thời tạo hiệu ứng xanh lá dày lá (AgCelence), tăng quang hợp giúp cây phục hồi nhanh sau bệnh.',
        isAdvanced: (l) => l.includes('pyraclostrobin') || l.includes('trifloxystrobin'),
        keywords: [
            'azoxystrobin', 'amistar', 'pyraclostrobin', 'cabrio', 'trifloxystrobin',
            'kresoxim', 'picoxystrobin', 'dimoxystrobin'
        ]
    },
    {
        groupId: '05_FUNGICIDE_OOMYCETES',
        groupName: 'Đặc Trị Nấm Thủy Sinh Oomycetes (Sương mai, nứt thân xì mủ, thối rễ, Phytophthora)',
        roleType: 'Đặc Trị Nấm Rễ & Xì Mủ',
        moaDesc: 'Chuyên trị nấm thủy sinh gây nứt thân xì mủ, thối rễ, chết nhanh, sương mai; lưu dẫn hai chiều lên ngọn xuống rễ, làm khô nhanh vết loét xì mủ thân cành.',
        isAdvanced: (l) => l.includes('oxathiapiprolin') || l.includes('mandipropamid') || l.includes('cyazofamid') || l.includes('hymexazol'),
        keywords: [
            'metalaxyl', 'mefenoxam', 'ridomil', 'dimethomorph', 'cymoxanil', 'fosetyl',
            'aliette', 'mandipropamid', 'revus', 'oxathiapiprolin', 'zorvec', 'cyazofamid',
            'hymexazol', 'tachigaren', 'famoxadone', 'fenamidone', 'propamocarb'
        ]
    },
    {
        groupId: '06_FUNGICIDE_CONTACT',
        groupName: 'Trừ Nấm Tiếp Xúc Bảo Vệ Phổ Rộng (Áo giáp ngoài, phòng ngừa đa điểm)',
        roleType: 'Trừ Nấm Tiếp Xúc Bề Mặt',
        moaDesc: 'Bám dính bề mặt lá/vỏ trái, ức chế đa điểm enzyme nấm, ngăn ngừa bào tử nảy mầm xâm nhập; không lo lờn thuốc; là nền tảng phối trộn số 1 với thuốc nội hấp.',
        isAdvanced: (l) => l.includes('metiram') || l.includes('polyram'),
        keywords: [
            'mancozeb', 'propineb', 'antracol', 'metiram', 'polyram', 'chlorothalonil',
            'daconil', 'zineb', 'sulfur', 'luu huynh', 'copper', 'dong', 'booc-do',
            'bordeaux', 'ziram', 'thiram', 'captan', 'folpet', 'cupric'
        ]
    },
    {
        groupId: '07_INSECTICIDE_SPINOSYN',
        groupName: 'Đặc Trị Sâu / Bọ Trĩ Kháng Thuốc (Spinosyn & Pyrrole - Hạ gục thần tốc)',
        roleType: 'Trừ Sâu / Bọ Trĩ Đột Phá',
        moaDesc: 'Tác động thụ thể nicotinic acetylcholine kiểu mới hoặc tách rời chuỗi phosphoryl hóa năng lượng; hạ gục cực nhanh bọ trĩ lờn thuốc, sâu keo, sâu tơ, sâu đục trái.',
        isAdvanced: () => true,
        keywords: [
            'spinetoram', 'radiant', 'spinosad', 'chlorfenapyr', 'pirate'
        ]
    },
    {
        groupId: '08_INSECTICIDE_DIAMIDE',
        groupName: 'Trừ Sâu Nhóm Diamide (Lưu dẫn bảo vệ đọt non, tê liệt cơ bắp tức thì)',
        roleType: 'Trừ Sâu Lưu Dẫn Cao Cấp',
        moaDesc: 'Kích hoạt thụ thể Ryanodine làm cạn kiệt Canxi cơ bắp khiến sâu ngừng cắn phá sau vài phút và chết; lưu dẫn kéo dài 14-21 ngày bảo vệ đọt non mới ra.',
        isAdvanced: () => true,
        keywords: [
            'chlorantraniliprole', 'virtako', 'prevathon', 'cyantraniliprole', 'benevia',
            'minecto', 'flubendiamide', 'takumi', 'broflanilide', 'incipio', 'tetraniliprole'
        ]
    },
    {
        groupId: '09_INSECTICIDE_IGR',
        groupName: 'Ức Chế Lột Xác IGR & Diệt Trứng (Cắt đứt vòng đời, chống tái bùng phát)',
        roleType: 'Ức Chế Sinh Trưởng Côn Trùng',
        moaDesc: 'Ức chế tổng hợp Chitin hoặc làm rối loạn hormone lột xác; làm ung trứng, ấu trùng không thể lột xác hóa nhộng; vũ khí phối trộn bắt buộc để dập tắt triệt để gối lứa.',
        isAdvanced: (l) => l.includes('lufenuron') || l.includes('pyriproxyfen'),
        keywords: [
            'lufenuron', 'match', 'tebufenozide', 'methoxyfenozide', 'buprofezin',
            'applaud', 'pyriproxyfen', 'admiral', 'chromafenozide'
        ]
    },
    {
        groupId: '10_INSECTICIDE_KNOCKDOWN',
        groupName: 'Trừ Sâu Tiếp Xúc - Vị Độc - Hạ Gục Nhanh (Đòn phối dập dịch tức thì)',
        roleType: 'Trừ Sâu Tiếp Xúc / Vị Độc',
        moaDesc: 'Kích thích giải phóng GABA hoặc phong bế kênh Natri thần kinh; hạ gục nhanh sâu hại sau khi trúng thuốc; rất phù hợp phối chung với thuốc lưu dẫn để vừa hạ nhanh vừa diệt dai.',
        isAdvanced: (l) => l.includes('emamectin') && l.includes('5%'),
        keywords: [
            'emamectin', 'abamectin', 'cartap', 'padan', 'cypermethrin', 'permethrin',
            'alpha-cypermethrin', 'lambda-cyhalothrin', 'deltamethrin', 'indoxacarb',
            'fenvalerate', 'profenofos', 'fipronil'
        ]
    },
    {
        groupId: '11_SUCKING_ADVANCED',
        groupName: 'Đặc Trị Bọ Trĩ & Rầy Rệp Thế Hệ Mới (Lưu dẫn hai chiều, bẻ gãy kháng thuốc)',
        roleType: 'Trừ Chích Hút Cao Cấp',
        moaDesc: 'Tác động thụ thể thần kinh chuyên biệt kiểu mới hoặc ức chế sinh tổng hợp Lipid (lưu dẫn 2 chiều cả ngọn lẫn rễ như Movento); đặc trị rầy phấn trắng, rệp sáp, bọ trĩ trốn trong kẽ lá/nụ bông.',
        isAdvanced: () => true,
        keywords: [
            'flupyrimin', 'sulfoxaflor', 'transform', 'flonicamid', 'teppeki',
            'spirotetramat', 'movento', 'tolfenpyrad', 'afidopyropen', 'triflumezopyrim',
            'diafenthiuron', 'pegasus'
        ]
    },
    {
        groupId: '12_SUCKING_NEONIC',
        groupName: 'Trừ Rầy & Bọ Trĩ Neonicotinoid Nội Hấp (Thấm sâu lưu dẫn trong nhựa cây)',
        roleType: 'Trừ Chích Hút Nội Hấp',
        moaDesc: 'Lưu dẫn nội hấp mạnh mẽ qua rễ và lá vào hệ mạch dẫn; làm tê liệt thần kinh trung ương côn trùng chích hút; phối hợp tốt với thuốc hạ gục hoặc dầu khoáng.',
        isAdvanced: (l) => l.includes('dinotefuran') || l.includes('clothianidin'),
        keywords: [
            'thiamethoxam', 'imidacloprid', 'dinotefuran', 'oshin', 'acetamiprid',
            'clothianidin', 'nitenpyram', 'pymetrozine'
        ]
    },
    {
        groupId: '13_ACARICIDE',
        groupName: 'Đặc Trị Nhện Đỏ & Nhện Gây Hại (Diệt cả nhện trưởng thành, ấu trùng & ung trứng)',
        roleType: 'Đặc Trị Nhện Đỏ',
        moaDesc: 'Ức chế enzyme tổng hợp Lipid hoặc kênh hô hấp tế bào nhện; diệt sạch nhện kháng thuốc gây nám da trái, bạc lá; nên phối hoạt chất diệt nhện lớn với hoạt chất ung trứng.',
        isAdvanced: (l) => l.includes('spirodiclofen') || l.includes('spiromesifen') || l.includes('fenpyroximate'),
        keywords: [
            'spirodiclofen', 'envidor', 'spiromesifen', 'oberon', 'fenpyroximate',
            'ortus', 'pyridaben', 'propargite', 'hexythiazox', 'clofentezine',
            'bifenazate', 'fenbutatin'
        ]
    },
    {
        groupId: '14_NEMATICIDE',
        groupName: 'Đặc Trị Tuyến Trùng & Nấm Đối Kháng Đất (Bảo vệ rễ, ngừa vàng lá thối rễ)',
        roleType: 'Đặc Trị Tuyến Trùng',
        moaDesc: 'Tiêu diệt và xua đuổi tuyến trùng gây nốt sưng rễ; bảo vệ đầu chóp rễ tơ hút dinh dưỡng.',
        isAdvanced: () => true,
        keywords: [
            'fosthiazate', 'benfuracarb', 'trichoderma', 'paecilomyces'
        ]
    },
    {
        groupId: '15_NUTRITION_ADJUVANT',
        groupName: 'Dinh Dưỡng, Kích Kháng & Chất Trợ Lực Loang Trải (Tăng hấp thu, chống rửa trôi)',
        roleType: 'Dinh Dưỡng & Trợ Lực',
        moaDesc: 'Phá vỡ lớp sáp phấn của côn trùng, tăng diện tích tiếp xúc giọt thuốc; cung cấp vi lượng và acid amin giúp cây phục hồi nhanh sau bệnh.',
        isAdvanced: (l) => l.includes('brassinolide') || l.includes('amino'),
        keywords: [
            'amino', 'rong bien', 'seaweed', 'humic', 'fulvic', 'bo', 'canxi', 'kem',
            'zinc', 'ga3', 'naa', 'brassinolide', 'dau khoang', 'mineral oil', 'bam dinh',
            'loang trai', 'surfactant', 'silicone'
        ]
    }
];

const classifyActiveIngredient = (name) => {
    if (!name || typeof name !== 'string') {
        return {
            groupId: '16_OTHER_ACTIVE',
            groupName: 'Hoạt Chất Nông Dược Bổ Trợ & Phối Hợp Trong Kho',
            roleType: 'Bảo Vệ Thực Vật',
            moaDesc: 'Hoạt chất BVTV hữu hiệu có sẵn trong kho, tham gia diệt trừ sâu bệnh theo phổ tác động chỉ định.',
            isAdvanced: false
        };
    }
    const lower = name.toLowerCase();
    for (const item of ACTIVE_TAXONOMY) {
        if (item.keywords.some(k => lower.includes(k))) {
            return {
                groupId: item.groupId,
                groupName: item.groupName,
                roleType: item.roleType,
                moaDesc: item.moaDesc,
                isAdvanced: item.isAdvanced(lower)
            };
        }
    }
    return {
        groupId: '16_OTHER_ACTIVE',
        groupName: 'Hoạt Chất Nông Dược Bổ Trợ & Phối Hợp Trong Kho',
        roleType: 'Bảo Vệ Thực Vật',
        moaDesc: 'Hoạt chất BVTV hữu hiệu có sẵn trong kho, tham gia diệt trừ sâu bệnh theo phổ tác động chỉ định.',
        isAdvanced: false
    };
};

const isAdvancedActive = (name) => {
    return classifyActiveIngredient(name).isAdvanced;
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

const isTargetProduct = (prod) => {
    if (!prod) return true;
    if (prod.role === 'target') return true;
    if (prod.role === 'synergy') return false;
    const tier = (prod.tier || '').toLowerCase();
    if (tier.includes('đặc trị chính') || tier.includes('hạ gục') || tier.includes('đặc trị')) return true;
    if (tier.includes('tương thích') || tier.includes('hiệp đồng') || tier.includes('luân phiên') || tier.includes('phòng ngừa')) return false;
    return true;
};

const isLegitDrugPair = (drugName, activeName) => {
    if (!drugName || !activeName) return false;
    // Tên thuốc không được quá dài (<= 32 ký tự và <= 4 từ)
    const drugWords = drugName.trim().split(/\s+/);
    if (drugName.length > 32 || drugWords.length > 4) return false;

    // Tên hoạt chất không được quá dài (<= 36 ký tự và <= 5 từ)
    const activeWords = activeName.trim().split(/\s+/);
    if (activeName.length > 36 || activeWords.length > 5) return false;

    // Không được chứa các từ ngữ mô tả triệu chứng, tác hại, câu văn giải thích
    const nonDrugKeywords = /bệnh|kháng thuốc|triệu chứng|nguyên nhân|nghiêm trọng|gây|tác hại|thanh long|cây trồng|sâu hại|thiệt hại|lưu ý|hướng dẫn|giai đoạn|đặc điểm|xuất hiện|quăn bông|đen tai|nám tai|thối nhũn|thán thư|phòng trị|xử lý/i;
    if (nonDrugKeywords.test(drugName) || nonDrugKeywords.test(activeName)) return false;

    return true;
};

// Format cụm từ: làm nổi bật **Tên Thuốc** *(Tên hoạt chất)* hoặc **Tên Thuốc** (Hoạt chất)
const renderBoldSpans = (text) => {
    if (!text) return null;

    const drugPattern = /(\*\*[^*]+\*\*)\s*(\*(?:\([^*()]+\)|\[[^*[\]]+\])\*|\([^*()]+\)|\[[^*[\]]+\])/g;
    const tokens = [];
    let lastIndex = 0;
    let match;

    while ((match = drugPattern.exec(text)) !== null) {
        const drugName = match[1].replace(/^\*\*|\*\*$/g, '').trim();
        const activeName = match[2].replace(/^[\*\(\[]+|[\*\)\]]+$/g, '').trim();

        if (isLegitDrugPair(drugName, activeName)) {
            if (match.index > lastIndex) {
                tokens.push({ type: 'text', content: text.substring(lastIndex, match.index) });
            }
            tokens.push({
                type: 'drug_pair',
                drugName,
                activeName
            });
            lastIndex = drugPattern.lastIndex;
        }
    }

    if (lastIndex < text.length) {
        tokens.push({ type: 'text', content: text.substring(lastIndex) });
    }

    return tokens.map((token, tIdx) => {
        if (token.type === 'drug_pair') {
            return (
                <span
                    key={tIdx}
                    className="inline-flex flex-wrap items-center gap-1.5 mx-1 my-0.5 px-2.5 py-0.5 rounded-xl bg-emerald-500/10 dark:bg-emerald-950/40 border border-emerald-500/30 shadow-2xs align-middle max-w-full"
                >
                    <strong className="font-black text-emerald-950 dark:text-emerald-200 tracking-tight">
                        {token.drugName}
                    </strong>
                    <span className="text-[0.88em] font-semibold italic text-emerald-700 dark:text-emerald-400 bg-emerald-500/15 dark:bg-emerald-900/50 px-1.5 py-0.2 rounded-lg">
                        ({token.activeName})
                    </span>
                </span>
            );
        }

        const parts = token.content.split(/(\*\*.*?\*\*)/g);
        return (
            <span key={tIdx}>
                {parts.map((p, pIdx) => {
                    if (p.startsWith('**') && p.endsWith('**')) {
                        const boldContent = p.slice(2, -2);
                        const isDose = /bình\s*\d+l|phuy\s*\d+l|liều/i.test(boldContent);
                        if (isDose) {
                            return (
                                <span
                                    key={pIdx}
                                    className="font-black text-amber-900 dark:text-amber-300 bg-amber-500/20 border border-amber-500/40 px-2 py-0.5 rounded-lg mx-0.5 shadow-2xs"
                                >
                                    {boldContent}
                                </span>
                            );
                        }
                        return (
                            <strong key={pIdx} className="font-black text-stone-900 dark:text-stone-100">
                                {boldContent}
                            </strong>
                        );
                    }
                    return p;
                })}
            </span>
        );
    });
};

const stripLeadingEmojisAndIcons = (str) => {
    if (!str) return '';
    return str
        .replace(/^[\p{Extended_Pictographic}\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}\u{1F000}-\u{1F02F}\s•\-\*#👉🔥💥⚡🎯🧪📊📈🌿🍃💡⚠️🚨🔴🟢👑💰📦🩺🔍📌✨🏷️🌾💧]+/gu, '')
        .trim();
};

// Render formatted markdown với Data Table, KPI & các Section Card trực quan
const renderFormattedMarkdown = (text, fontSize) => {
    if (!text) return null;

    const cleanedText = text
        .split('\n')
        .filter(line => {
            const t = line.trim();
            return !/^>[ \t]*(\+[ \t]*)?$/.test(t) && t !== '+';
        })
        .map(line => {
            let l = line.trim();
            if (l.startsWith('> ')) {
                l = l.substring(2).trim();
            } else if (l.startsWith('>')) {
                l = l.substring(1).trim();
            }
            return l;
        })
        .join('\n');

    const rawLines = cleanedText.split('\n');
    const blocks = [];
    let i = 0;

    while (i < rawLines.length) {
        const line = rawLines[i];
        const trimmed = line.trim();

        if (trimmed.startsWith('|') && trimmed.endsWith('|') && trimmed.indexOf('|', 1) !== -1) {
            const tableLines = [];
            while (i < rawLines.length && rawLines[i].trim().startsWith('|') && rawLines[i].trim().endsWith('|')) {
                tableLines.push(rawLines[i].trim());
                i++;
            }

            if (tableLines.length >= 1) {
                const parsedRows = tableLines.map(tLine => {
                    return tLine
                        .split('|')
                        .slice(1, -1)
                        .map(c => c.trim());
                });

                const headers = parsedRows[0];
                let rows = [];
                if (parsedRows.length > 1 && parsedRows[1].every(c => /^:?-+:?$/.test(c))) {
                    rows = parsedRows.slice(2);
                } else {
                    rows = parsedRows.slice(1);
                }

                blocks.push({
                    type: 'table',
                    headers,
                    rows,
                    key: `table-${i}`
                });
                continue;
            }
        }

        blocks.push({
            type: 'line',
            content: line,
            key: `line-${i}`
        });
        i++;
    }

    return blocks.map((block, bIdx) => {
        if (block.type === 'table') {
            return (
                <div
                    key={block.key || bIdx}
                    className="my-3 overflow-hidden rounded-2xl border border-stone-200/90 dark:border-white/10 shadow-sm bg-white/95 dark:bg-[#0c1813]"
                >
                    <div className="overflow-x-auto custom-scrollbar">
                        <table className="w-full text-left border-collapse min-w-[540px]">
                            <thead>
                                <tr className="bg-gradient-to-r from-stone-100 via-stone-50 to-blue-50/50 dark:from-[#0d1e16] dark:via-[#0c1b14] dark:to-[#081510] border-b border-stone-200/90 dark:border-white/10">
                                    {block.headers.map((h, hIdx) => (
                                        <th
                                            key={hIdx}
                                            className="px-3 py-2.5 font-black text-stone-800 dark:text-stone-100 uppercase tracking-wider text-[11px] whitespace-nowrap"
                                        >
                                            {renderBoldSpans(stripLeadingEmojisAndIcons(h))}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-stone-100 dark:divide-white/5">
                                {block.rows.map((row, rIdx) => {
                                    const isEven = rIdx % 2 === 0;
                                    return (
                                        <tr
                                            key={rIdx}
                                            className={cn(
                                                "transition-colors hover:bg-emerald-50/50 dark:hover:bg-emerald-950/30",
                                                isEven ? "bg-transparent" : "bg-stone-50/40 dark:bg-white/[0.02]"
                                            )}
                                        >
                                            {row.map((cell, cIdx) => {
                                                const isSafe = /🟢|an toàn|đã thanh toán/i.test(cell);
                                                const isWarning = /⚠️|cần thu hồi|nợ lớn|quá hạn|cần theo dõi/i.test(cell);
                                                const isDanger = /🔴|nợ xấu|khẩn cấp/i.test(cell);
                                                const isMoney = /\d+[\.,\d]*\s*đ/i.test(cell) || /₫/i.test(cell);
                                                const isSTT = cIdx === 0 && /^\d+$/.test(cell.replace(/[\*\_\#]/g, '').trim());

                                                return (
                                                    <td
                                                        key={cIdx}
                                                        className={cn(
                                                            "px-3 py-2 text-stone-700 dark:text-stone-200 whitespace-nowrap text-[11.5px]",
                                                            isSTT ? "text-center font-bold text-stone-400 dark:text-stone-500 w-10" : ""
                                                        )}
                                                    >
                                                        {isSafe ? (
                                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                                                                <CheckCircle2 size={11} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                                                                <span>{cell.replace(/🟢/g, '').trim()}</span>
                                                            </span>
                                                        ) : isWarning ? (
                                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-900 dark:text-amber-300 border border-amber-500/30 text-[10px] font-bold">
                                                                <AlertTriangle size={11} className="text-amber-600 dark:text-amber-400 shrink-0" />
                                                                <span>{cell.replace(/⚠️/g, '').trim()}</span>
                                                            </span>
                                                        ) : isDanger ? (
                                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-900 dark:text-rose-300 border border-rose-500/30 text-[10px] font-bold">
                                                                <ShieldAlert size={11} className="text-rose-600 dark:text-rose-400 shrink-0" />
                                                                <span>{cell.replace(/🔴/g, '').trim()}</span>
                                                            </span>
                                                        ) : (
                                                            <span className={cn(
                                                                isMoney ? "font-black text-[#1a4a20] dark:text-emerald-400" : ""
                                                            )}>
                                                                {renderBoldSpans(cell)}
                                                            </span>
                                                        )}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            );
        }

        const line = block.content;
        const lineIdx = bIdx;
        const trimmed = line.trim();

        if (trimmed === '---' || trimmed === '***' || trimmed === '___') {
            return <hr key={lineIdx} className="my-3 border-stone-200/80 dark:border-white/10" />;
        }

        if (line.startsWith('### ')) {
            const rawHeaderText = line.replace('### ', '').trim();
            const headerClean = stripLeadingEmojisAndIcons(rawHeaderText);
            const lower = headerClean.toLowerCase();

            let IconComp = Leaf;
            let cardStyle = "bg-emerald-500/10 dark:bg-emerald-950/40 border-emerald-500/30 text-emerald-900 dark:text-emerald-200";

            if (lower.includes('bảng') || lower.includes('tổng hợp') || lower.includes('top') || lower.includes('báo cáo') || lower.includes('doanh thu') || lower.includes('số liệu') || lower.includes('thống kê')) {
                IconComp = BarChart3;
                cardStyle = "bg-blue-500/10 dark:bg-blue-950/40 border-blue-500/30 text-blue-950 dark:text-blue-200";
            } else if (lower.includes('khách hàng') || lower.includes('vip') || lower.includes('đối tác')) {
                IconComp = Crown;
                cardStyle = "bg-amber-500/15 dark:bg-amber-950/40 border-amber-500/40 text-amber-950 dark:text-amber-200";
            } else if (lower.includes('vốn') || lower.includes('tồn kho') || lower.includes('chiết khấu') || lower.includes('lãi')) {
                IconComp = DollarSign;
                cardStyle = "bg-emerald-500/10 dark:bg-emerald-950/40 border-emerald-500/30 text-emerald-900 dark:text-emerald-200";
            } else if (lower.includes('cận date') || lower.includes('bán chậm') || lower.includes('hết hạn') || lower.includes('cảnh báo') || lower.includes('tương kỵ')) {
                IconComp = AlertTriangle;
                cardStyle = "bg-rose-500/10 dark:bg-rose-950/40 border-rose-500/30 text-rose-950 dark:text-rose-200";
            } else if (lower.includes('chẩn đoán') || lower.includes('đặc tính') || lower.includes('nguyên nhân')) {
                IconComp = Stethoscope;
                cardStyle = "bg-teal-500/10 dark:bg-teal-950/40 border-teal-500/30 text-teal-900 dark:text-teal-200";
            } else if (lower.includes('bộ phối') || lower.includes('phối trộn') || lower.includes('tank-mix') || lower.includes('đòn kép')) {
                IconComp = Zap;
                cardStyle = "bg-amber-500/15 dark:bg-amber-950/40 border-amber-500/40 text-amber-950 dark:text-amber-200";
            } else if (lower.includes('thứ tự') || lower.includes('hòa tan') || lower.includes('pha thuốc')) {
                IconComp = Beaker;
                cardStyle = "bg-sky-500/10 dark:bg-sky-950/40 border-sky-500/30 text-sky-950 dark:text-sky-200";
            } else if (lower.includes('rà soát') || lower.includes('hoạt chất')) {
                IconComp = FlaskConical;
                cardStyle = "bg-emerald-500/10 dark:bg-emerald-950/40 border-emerald-500/30 text-emerald-950 dark:text-emerald-200";
            } else if (lower.includes('soạn tin') || lower.includes('văn bản') || lower.includes('thỏa thuận')) {
                IconComp = MessageSquare;
                cardStyle = "bg-purple-500/10 dark:bg-purple-950/40 border-purple-500/30 text-purple-950 dark:text-purple-200";
            }

            return (
                <div
                    key={lineIdx}
                    className={cn(
                        "mt-3.5 mb-2 px-3 py-1.5 rounded-2xl border flex items-center gap-2.5 shadow-2xs",
                        cardStyle
                    )}
                >
                    <div className="p-1 rounded-xl bg-white/80 dark:bg-black/40 shadow-xs shrink-0">
                        <IconComp size={Math.max(14, Math.round(fontSize * 1.05))} />
                    </div>
                    <h4
                        style={{ fontSize: `${Math.round(fontSize * 1.08)}px` }}
                        className="font-black tracking-tight drop-shadow-2xs"
                    >
                        {renderBoldSpans(headerClean)}
                    </h4>
                </div>
            );
        }

        if (line.startsWith('## ')) {
            return (
                <h3
                    key={lineIdx}
                    style={{ fontSize: `${Math.round(fontSize * 1.2)}px` }}
                    className="font-black mt-3.5 mb-1.5 text-[#2d5016] dark:text-emerald-400 flex items-center gap-1.5"
                >
                    <Leaf size={Math.max(14, Math.round(fontSize * 1.1))} />
                    {renderBoldSpans(stripLeadingEmojisAndIcons(line.replace('## ', '')))}
                </h3>
            );
        }

        if (line.startsWith('# ')) {
            return (
                <h2
                    key={lineIdx}
                    style={{ fontSize: `${Math.round(fontSize * 1.35)}px` }}
                    className="font-black mt-3.5 mb-1.5 text-[#2d5016] dark:text-emerald-400"
                >
                    {renderBoldSpans(stripLeadingEmojisAndIcons(line.replace('# ', '')))}
                </h2>
            );
        }

        const numMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
        if (numMatch) {
            return (
                <div
                    key={lineIdx}
                    style={{ fontSize: `${fontSize}px`, lineHeight: 1.6 }}
                    className="my-1.5 py-1 px-3 rounded-2xl bg-stone-50/80 dark:bg-stone-900/40 border border-stone-200/60 dark:border-white/5 flex items-start gap-2.5 shadow-2xs"
                >
                    <span
                        style={{ background: 'var(--button-gradient, linear-gradient(135deg, #2d5016 0%, #4a7c59 100%))' }}
                        className="w-5 h-5 rounded-full text-white font-black text-[10.5px] flex items-center justify-center shrink-0 select-none shadow-xs mt-0.5 border border-white/20"
                    >
                        {numMatch[1]}
                    </span>
                    <div className="flex-1 text-stone-800 dark:text-stone-200">
                        {renderBoldSpans(numMatch[2])}
                    </div>
                </div>
            );
        }

        const isProductItem = /^(?:👉|🔥|💥|⚡|•|\-|\*)?\s*(?:Sản phẩm\s*\d+|Trợ lực|Công thức phối|Bộ phối)/i.test(trimmed);
        if (isProductItem) {
            return (
                <div
                    key={lineIdx}
                    style={{ fontSize: `${fontSize}px`, lineHeight: 1.6 }}
                    className="my-1.5 py-1.5 px-3 rounded-2xl bg-amber-500/15 dark:bg-amber-950/40 border border-amber-500/30 flex items-start gap-2.5 text-stone-800 dark:text-stone-200 shadow-2xs"
                >
                    <div className="p-1 rounded-lg bg-amber-500/20 dark:bg-amber-400/20 text-amber-800 dark:text-amber-300 shrink-0 mt-0.5">
                        <Zap size={13} />
                    </div>
                    <div className="flex-1 font-medium">
                        {renderBoldSpans(stripLeadingEmojisAndIcons(trimmed))}
                    </div>
                </div>
            );
        }

        if (trimmed.startsWith('- ') || trimmed.startsWith('* ') || trimmed.startsWith('+ ')) {
            const clean = trimmed.substring(2);
            const isSubItem = line.startsWith('  ') || line.startsWith('\t');
            return (
                <div
                    key={lineIdx}
                    style={{ fontSize: `${fontSize}px`, lineHeight: 1.6 }}
                    className={cn(
                        "py-0.5 flex items-start gap-2 text-stone-700 dark:text-stone-300",
                        isSubItem ? "ml-5" : "ml-1"
                    )}
                >
                    <span className="text-[#2d5016] dark:text-emerald-400 font-bold shrink-0 select-none mt-1">
                        {isSubItem ? '›' : '•'}
                    </span>
                    <div className="flex-1">
                        {renderBoldSpans(clean)}
                    </div>
                </div>
            );
        }

        if (!trimmed) {
            return <div key={lineIdx} className="h-1" />;
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

const SpotlightStudio = React.memo(function SpotlightStudio({
    mascot,
    activeMode,
    isDoctorOnly,
    currentModeConfig,
    input,
    setInput,
    inputRef,
    selectedImages,
    handleRemoveImage,
    onUploadClick,
    handlePaste,
    handleSend,
    isSendingAnim,
    isLoading,
    fontSize
}) {
    const mascotName = (mascot?.name && !mascot.name.includes('Lyang')) ? mascot.name : 'Lí An';
    const mascotAvatar = mascot?.avatar || '/mascots/avatar-lyang.webp';

    const heroInfo = useMemo(() => {
        if (activeMode === 'app_analytics') {
            return {
                badge: 'Báo Cáo & Phân Tích App',
                badgeIcon: BarChart3,
                badgeColor: 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20',
                title: 'Hôm nay số liệu kinh doanh thế nào?',
                subtitle: 'Tra cứu tức thì doanh thu, công nợ khách hàng, tồn kho và danh mục hàng bán chạy.',
                chips: [
                    { icon: DollarSign, iconColor: 'text-emerald-600 dark:text-emerald-400', label: 'Vốn tồn kho', query: 'Tổng vốn lưu động đang nằm trong kho là bao nhiêu tiền và những mặt hàng nào đang giam vốn nhiều nhất?' },
                    { icon: Crown, iconColor: 'text-amber-500 dark:text-amber-400', label: 'Khách VIP nợ', query: 'Những khách hàng nào mua nhiều tiền nhất từ trước đến nay và tình hình công nợ của họ ra sao?' },
                    { icon: TrendingUp, iconColor: 'text-blue-600 dark:text-blue-400', label: 'Doanh thu tháng', query: 'So sánh tổng kết doanh thu, số đơn và lợi nhuận gộp của tháng này với tháng trước?' },
                    { icon: Clock, iconColor: 'text-rose-500 dark:text-rose-400', label: 'Hàng cận date', query: 'Có những sản phẩm nào sắp hết hạn sử dụng hoặc tồn kho thấp hơn mức cảnh báo không?' }
                ],
                tiles: [
                    {
                        icon: DollarSign,
                        badgeStyle: 'bg-emerald-500/15 border-emerald-500/25',
                        iconColor: 'text-emerald-700 dark:text-emerald-300',
                        title: 'Vốn & Giam vốn kho',
                        desc: 'Kiểm tra tổng vốn lưu động và các mặt hàng giam vốn lớn nhất',
                        onClick: () => handleSend('Tổng vốn lưu động đang nằm trong kho là bao nhiêu tiền và những mặt hàng nào đang giam vốn nhiều nhất?')
                    },
                    {
                        icon: Crown,
                        badgeStyle: 'bg-amber-500/15 border-amber-500/25',
                        iconColor: 'text-amber-700 dark:text-amber-300',
                        title: 'Khách VIP & Công nợ',
                        desc: 'Top khách hàng mua nhiều nhất và các khoản nợ cần thu hồi',
                        onClick: () => handleSend('Những khách hàng nào mua nhiều tiền nhất từ trước đến nay và tình hình công nợ của họ ra sao?')
                    },
                    ...(isAdmin ? [{
                        icon: TrendingUp,
                        badgeStyle: 'bg-blue-500/15 border-blue-500/25',
                        iconColor: 'text-blue-700 dark:text-blue-300',
                        title: 'Doanh thu & Lợi nhuận',
                        desc: 'So sánh doanh số, số đơn hàng và lãi gộp tháng này với tháng trước',
                        onClick: () => handleSend('So sánh tổng kết doanh thu, số đơn và lợi nhuận gộp của tháng này với tháng trước?')
                    }] : []),
                    {
                        icon: BarChart3,
                        badgeStyle: 'bg-indigo-500/15 border-indigo-500/25',
                        iconColor: 'text-indigo-700 dark:text-indigo-300',
                        title: 'Bán hàng hôm nay',
                        desc: 'Xem số đơn chốt và thực thu ngày gần nhất',
                        onClick: () => handleSend('Hôm nay hoặc ngày bán gần đây nhất cửa hàng bán được bao nhiêu đơn, tổng doanh thu và thực thu thế nào?')
                    },
                    {
                        icon: AlertTriangle,
                        badgeStyle: 'bg-rose-500/15 border-rose-500/25',
                        iconColor: 'text-rose-700 dark:text-rose-300',
                        title: 'Hàng ế đọng vốn',
                        desc: 'Mặt hàng tồn nhiều mà 60 ngày qua bán chậm cần xả hàng',
                        onClick: () => handleSend('Những mặt hàng nào đang bị đọng vốn lâu ngày, tồn kho nhiều mà 60 ngày qua bán chậm cần xả hàng?')
                    },
                    {
                        icon: Clock,
                        badgeStyle: 'bg-orange-500/15 border-orange-500/25',
                        iconColor: 'text-orange-700 dark:text-orange-300',
                        title: 'Hàng cận date',
                        desc: 'Phát hiện hàng sắp hết hạn và tồn kho dưới mức an toàn',
                        onClick: () => handleSend('Có những sản phẩm nào sắp hết hạn sử dụng hoặc tồn kho thấp hơn mức cảnh báo không?')
                    }
                ]
            };
        }

        if (activeMode === 'general_assistant') {
            return {
                badge: 'Trợ Lý Đa Năng Thông Minh',
                badgeIcon: Sparkles,
                badgeColor: 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20',
                title: 'Hôm nay Lí An có thể giúp gì cho bạn?',
                subtitle: 'Soạn tin nhắn Zalo gửi nông dân, tính toán tài chính & giải đáp mọi câu hỏi.',
                chips: [
                    { icon: MessageSquare, iconColor: 'text-purple-600 dark:text-purple-400', label: 'Tin Zalo nhắc nợ', query: 'Hãy soạn giúp tôi một tin nhắn Zalo gửi cho khách hàng thân thiết để nhắc công nợ một cách tế nhị, lịch sự và giữ mối quan hệ lâu dài?' },
                    { icon: Calculator, iconColor: 'text-pink-600 dark:text-pink-400', label: 'Tính chiết khấu & Lãi', query: 'Hướng dẫn tôi cách tính nhanh tỷ lệ phần trăm chiết khấu và điểm hòa vốn khi nhập một lô hàng lớn?' },
                    { icon: Microscope, iconColor: 'text-indigo-600 dark:text-indigo-400', label: 'Cơ chế hoạt chất', query: 'Giải thích chi tiết cơ chế tác động và sự khác biệt giữa hoạt chất trừ sâu nhóm Diamide và nhóm Spinosyn?' },
                    { icon: FileEdit, iconColor: 'text-amber-600 dark:text-amber-400', label: 'Mẫu cam kết hàng', query: 'Soạn thảo giúp tôi một mẫu cam kết cung cấp vật tư nông nghiệp và thời hạn thanh toán công nợ đơn giản, rõ ràng?' }
                ],
                tiles: [
                    {
                        icon: MessageSquare,
                        badgeStyle: 'bg-purple-500/15 border-purple-500/25',
                        iconColor: 'text-purple-700 dark:text-purple-300',
                        title: 'Soạn tin Zalo nhắc nợ',
                        desc: 'Lời dặn tế nhị, lịch sự, giữ vững mối thâm giao làm ăn lâu dài',
                        onClick: () => handleSend('Hãy soạn giúp tôi một tin nhắn Zalo gửi cho khách hàng thân thiết để nhắc công nợ một cách tế nhị, lịch sự và giữ mối quan hệ lâu dài?')
                    },
                    {
                        icon: Calculator,
                        badgeStyle: 'bg-pink-500/15 border-pink-500/25',
                        iconColor: 'text-pink-700 dark:text-pink-300',
                        title: 'Tính chiết khấu & Điểm hòa vốn',
                        desc: 'Cách tính nhanh tỷ lệ phần trăm chiết khấu và biên lợi nhuận nhập lô',
                        onClick: () => handleSend('Hướng dẫn tôi cách tính nhanh tỷ lệ phần trăm chiết khấu và điểm hòa vốn khi nhập một lô hàng lớn?')
                    },
                    {
                        icon: Languages,
                        badgeStyle: 'bg-indigo-500/15 border-indigo-500/25',
                        iconColor: 'text-indigo-700 dark:text-indigo-300',
                        title: 'Giải thích cơ chế BVTV',
                        desc: 'Tra cứu so sánh sự khác biệt nông dược học chuyên sâu',
                        onClick: () => handleSend('Giải thích chi tiết cơ chế tác động và sự khác biệt giữa hoạt chất trừ sâu nhóm Diamide và nhóm Spinosyn?')
                    },
                    {
                        icon: FileEdit,
                        badgeStyle: 'bg-amber-500/15 border-amber-500/25',
                        iconColor: 'text-amber-700 dark:text-amber-300',
                        title: 'Soạn cam kết cung cấp vật tư',
                        desc: 'Mẫu cam kết chất lượng hàng hóa và hạn thanh toán công nợ',
                        onClick: () => handleSend('Soạn thảo giúp tôi một mẫu cam kết cung cấp vật tư nông nghiệp và thời hạn thanh toán công nợ đơn giản, rõ ràng?')
                    },
                    {
                        icon: Sparkles,
                        badgeStyle: 'bg-purple-500/15 border-purple-500/25',
                        iconColor: 'text-purple-700 dark:text-purple-300',
                        title: 'Lập kế hoạch công việc tuần',
                        desc: 'Gợi ý các đầu việc ưu tiên cần xử lý trong tuần cho đại lý',
                        onClick: () => handleSend('Gợi ý cho tôi kế hoạch các công việc cần ưu tiên xử lý trong tuần này cho cửa hàng vật tư nông nghiệp?')
                    },
                    {
                        icon: BrainCircuit,
                        badgeStyle: 'bg-teal-500/15 border-teal-500/25',
                        iconColor: 'text-teal-700 dark:text-teal-300',
                        title: 'Hỏi đáp kiến thức tự do',
                        desc: 'Giải đáp mọi thắc mắc đời sống, kỹ thuật & quản lý cửa hàng',
                        onClick: () => {
                            inputRef.current?.focus();
                        }
                    }
                ]
            };
        }

        // Mặc định: Chế độ Bác Sĩ Cây Trồng Lí An (crop_doctor / isDoctorOnly)
        return {
            badge: 'Bác Sĩ Cây Trồng Lí An',
            badgeIcon: Stethoscope,
            badgeColor: 'bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border-emerald-500/20',
            title: 'Hôm nay cây trồng cần hỗ trợ gì?',
            subtitle: 'Chẩn đoán hình ảnh vết bệnh, rà soát kho hoạt chất & kê đơn thuốc chuẩn liều phuy.',
            chips: [
                { icon: Droplets, iconColor: 'text-sky-600 dark:text-sky-400', label: 'Liều Phuy 200L', append: 'hướng dẫn liều pha chuẩn cho phuy 200L và thứ tự hòa tan W-S-S-E-A' },
                { icon: Zap, iconColor: 'text-amber-500 dark:text-amber-400', label: 'Kháng thuốc', append: 'bị lờn thuốc kháng thuốc nặng, tư vấn bộ phối đòn kép tăng lực từ kho' },
                { icon: Leaf, iconColor: 'text-emerald-600 dark:text-emerald-400', label: 'Đẹp trái vuốt tai', query: 'Tư vấn phân thuốc và kích thích sinh trưởng giúp trái thanh long đỏ da, tai dày xanh cứng, không bị lem trái?' },
                { icon: FlaskConical, iconColor: 'text-rose-500 dark:text-rose-400', label: 'Nấm khuẩn mùa mưa', query: 'Thanh long bị thán thư kết hợp thối nhũn vi khuẩn trên cành và bông mùa mưa, tư vấn bộ phối nấm + khuẩn từ các sản phẩm trong kho?' }
            ],
            tiles: [
                {
                    icon: Camera,
                    badgeStyle: 'bg-teal-500/15 border-teal-500/25',
                    iconColor: 'text-teal-700 dark:text-teal-300',
                    title: 'Khám bệnh bằng ảnh',
                    desc: 'Dán ảnh (Ctrl+V) hoặc chụp lá, bông, trái để AI đọc bệnh & kê đơn',
                    onClick: onUploadClick
                },
                {
                    icon: Zap,
                    badgeStyle: 'bg-amber-500/15 border-amber-500/25',
                    iconColor: 'text-amber-700 dark:text-amber-300',
                    title: 'Bọ trĩ & Sâu kháng thuốc',
                    desc: 'Bộ phối đòn kép hạ gục nhanh + ức chế lột xác diệt sạch trứng',
                    onClick: () => handleSend('Bọ trĩ thanh long bị kháng thuốc nặng gây quăn bông, đen tai, tư vấn bộ phối trộn hoạt chất có trong kho để tăng lực dập dịch và liều pha?')
                },
                {
                    icon: FlaskConical,
                    badgeStyle: 'bg-sky-500/15 border-sky-500/25',
                    iconColor: 'text-sky-700 dark:text-sky-300',
                    title: 'Thán thư & Thối vi khuẩn',
                    desc: 'Phối nấm nội hấp + sát khuẩn khô nhanh vết thối loét mùa mưa',
                    onClick: () => handleSend('Thanh long bị thán thư kết hợp thối nhũn vi khuẩn trên cành và bông mùa mưa, tư vấn bộ phối nấm + khuẩn từ các sản phẩm trong kho?')
                },
                {
                    icon: Leaf,
                    badgeStyle: 'bg-emerald-500/15 border-emerald-500/25',
                    iconColor: 'text-emerald-700 dark:text-emerald-300',
                    title: 'Dưỡng bông & Đẹp trái',
                    desc: 'Chống rụng, dưỡng tai xanh dày cứng, trái bóng đỏ không lem da',
                    onClick: () => handleSend('Tư vấn phân thuốc và kích thích sinh trưởng giúp trái thanh long đỏ da, tai dày xanh cứng, không bị lem trái?')
                },
                {
                    icon: Droplets,
                    badgeStyle: 'bg-blue-500/15 border-blue-500/25',
                    iconColor: 'text-blue-700 dark:text-blue-300',
                    title: 'Tính liều Phuy 200L',
                    desc: 'Quy đổi thứ tự pha W-S-S-E-A và tỷ lệ chuẩn bình 25L / phuy 200L',
                    onClick: () => handleSend('Hướng dẫn thứ tự pha thuốc W-S-S-E-A vào phuy 200L và cách tính liều chuẩn cho bình 25L và phuy 200L?')
                },
                {
                    icon: MessageSquare,
                    badgeStyle: 'bg-purple-500/15 border-purple-500/25',
                    iconColor: 'text-purple-700 dark:text-purple-300',
                    title: 'Soạn tin Zalo gửi nông dân',
                    desc: 'Soạn hướng dẫn liều dùng và lời dặn phun xịt tế nhị, dễ hiểu',
                    onClick: () => handleSend('Hãy soạn giúp tôi một tin nhắn Zalo gửi cho khách hàng thân thiết hướng dẫn cách phun thuốc và liều lượng thật chi tiết, lịch sự?')
                }
            ]
        };
    }, [activeMode, onUploadClick, handleSend, inputRef]);

    return (
        <div className="w-full max-w-4xl mx-auto px-2 sm:px-4 py-4 sm:py-8 flex flex-col items-center justify-center select-none">
            {/* 1. Hero Header */}
            <m.div
                initial={{ opacity: 0, y: -14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                className="text-center mb-5 sm:mb-7 flex flex-col items-center"
            >
                {/* Avatar giống trên sidebar (Đồng bộ linh vật 2.5D / logo sidebar) */}
                <div className="relative mb-3 flex items-center justify-center">
                    <SidebarMascotLogo
                        showPulseDot={true}
                        className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl border-2 border-emerald-500/40 shadow-lg shadow-emerald-950/25 bg-gradient-to-tr from-emerald-500/20 to-teal-400/20"
                    />
                </div>

                <div className={cn("inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[11px] font-black tracking-wide uppercase shadow-2xs", heroInfo.badgeColor)}>
                    <heroInfo.badgeIcon size={12} />
                    <span>{heroInfo.badge}</span>
                </div>

                <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-stone-900 dark:text-white tracking-tight mt-2">
                    {heroInfo.title}
                </h1>
                <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 font-medium max-w-xl mx-auto mt-1 leading-relaxed">
                    {heroInfo.subtitle}
                </p>
            </m.div>

            {/* 2. Central Spotlight Command Box */}
            <m.div
                initial={{ opacity: 0, y: 12, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.38, delay: 0.05, ease: "easeOut" }}
                className="w-full max-w-3xl"
            >
                <form
                    onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                    className="relative w-full rounded-3xl bg-white/45 dark:bg-black/40 backdrop-blur-2xl border border-white/60 dark:border-white/15 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.08)] dark:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7)] p-3 sm:p-4 transition-all focus-within:border-emerald-500/70 focus-within:ring-4 focus-within:ring-emerald-500/10"
                >
                    {/* Selected Images Carousel inside Spotlight */}
                    {selectedImages.length > 0 && (
                        <div className="mb-2.5 p-2 rounded-2xl bg-emerald-50/70 dark:bg-[#091811] border border-emerald-500/20 flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar py-0.5">
                                <span className="text-[10px] font-black uppercase text-emerald-800 dark:text-emerald-400 whitespace-nowrap flex items-center gap-1">
                                    <span>📸 Ảnh khám bệnh:</span>
                                    <span className="text-[9px] px-1.5 py-0.2 bg-emerald-200/80 dark:bg-emerald-800/60 rounded-full font-black">
                                        {selectedImages.length}/4
                                    </span>
                                </span>
                                {selectedImages.map((img, idx) => (
                                    <div key={idx} className="relative group w-11 h-11 rounded-xl overflow-hidden border-2 border-emerald-500/60 shadow-xs shrink-0 bg-black/5">
                                        <img src={img} alt="Preview" className="w-full h-full object-cover" />
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveImage(idx)}
                                            title="Xóa ảnh này"
                                            className="absolute inset-0 bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                        >
                                            <X size={13} className="text-white drop-shadow-sm" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                            <span className="text-[10px] font-bold text-emerald-700/90 dark:text-emerald-400/90 whitespace-nowrap shrink-0 hidden sm:inline-block">
                                Nhấn Gửi để chẩn đoán
                            </span>
                        </div>
                    )}

                    {/* Large Input Area with Typing Overlay */}
                    <div className="relative flex items-center min-h-[46px] sm:min-h-[50px]">
                        <SearchTypingOverlay
                            text={input}
                            enabled={Boolean(input)}
                            inputRef={inputRef}
                            className="left-0 right-10 pl-3.5 sm:pl-4 font-medium text-stone-900 dark:text-white"
                            style={{
                                fontSize: `${Math.max(13.5, Math.min(16, fontSize + 0.5))}px`
                            }}
                        />
                        <input
                            ref={inputRef}
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onPaste={handlePaste}
                            spellCheck={false}
                            autoComplete="off"
                            placeholder={
                                selectedImages.length > 0
                                    ? "Nhập thêm ghi chú hoặc nhấn Gửi để chẩn đoán ngay..."
                                    : `${currentModeConfig.placeholder} (Ctrl+V dán ảnh)`
                            }
                            style={{
                                fontSize: `${Math.max(13.5, Math.min(16, fontSize + 0.5))}px`
                            }}
                            className={cn(
                                "w-full pl-3.5 sm:pl-4 pr-10 py-2 sm:py-2.5 placeholder-stone-400 dark:placeholder-stone-500 font-medium outline-none bg-transparent caret-emerald-600 dark:caret-emerald-400",
                                input ? "!text-transparent" : "!text-stone-900 dark:!text-white"
                            )}
                        />
                        {input ? (
                            <div className="absolute right-1 z-20 flex items-center">
                                <m.button
                                    type="button"
                                    initial={{ scale: 0, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0, opacity: 0 }}
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => { setInput(''); inputRef.current?.focus(); }}
                                    title="Xóa câu hỏi để nhập lại"
                                    className="p-1.5 rounded-xl bg-stone-100 hover:bg-red-50 text-stone-400 hover:text-red-500 dark:bg-white/10 dark:hover:bg-red-950/40 dark:hover:text-red-400 cursor-pointer transition-colors shadow-2xs"
                                >
                                    <X size={13} />
                                </m.button>
                            </div>
                        ) : null}
                    </div>

                    {/* Integrated Action Toolbar inside Spotlight */}
                    <div className="mt-2 pt-2.5 border-t border-stone-200/60 dark:border-white/10 flex items-center justify-between gap-2">
                        {/* Left Side: Photo upload */}
                        <div className="flex items-center gap-1.5 min-w-0">
                            <button
                                type="button"
                                onClick={onUploadClick}
                                title="Tải ảnh hoặc nhấn Ctrl+V để dán ảnh trực tiếp"
                                className="shrink-0 px-2.5 sm:px-3 py-1.5 rounded-xl bg-white/45 hover:bg-white/70 dark:bg-white/10 dark:hover:bg-white/20 text-stone-700 dark:text-stone-200 border border-white/50 dark:border-white/10 text-xs font-bold flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer shadow-2xs whitespace-nowrap backdrop-blur-xs"
                            >
                                <Camera size={14} className="text-teal-600 dark:text-teal-400 shrink-0" />
                                <span className="hidden sm:inline">Dán / Chụp ảnh</span>
                                <span className="sm:hidden">Ảnh</span>
                                <kbd className="hidden md:inline-block px-1 py-0.2 text-[9px] bg-stone-200/80 dark:bg-white/10 rounded font-mono text-stone-500 dark:text-stone-400">Ctrl+V</kbd>
                            </button>
                        </div>

                        {/* Right Side: Nút Khám Bệnh - Tối ưu 0% GPU, đổi màu mượt qua CSS transition, không viền đen */}
                        {(() => {
                            const hasContent = Boolean(input.trim() || selectedImages.length > 0);
                            return (
                                <div className="relative shrink-0 flex items-center">
                                    <m.button
                                        type="submit"
                                        disabled={isLoading}
                                        whileHover={!isLoading ? { scale: 1.02 } : {}}
                                        whileTap={!isLoading ? { scale: 0.96 } : {}}
                                        style={{
                                            border: 'none',
                                            outline: 'none',
                                            boxShadow: 'none',
                                            WebkitTapHighlightColor: 'transparent',
                                            WebkitAppearance: 'none'
                                        }}
                                        className={cn(
                                            "relative overflow-hidden px-4 sm:px-5 py-2 rounded-2xl font-extrabold text-xs sm:text-sm flex items-center gap-1.5 select-none cursor-pointer transition-all duration-300 group",
                                            "border-0 outline-none ring-0 focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 active:outline-none active:ring-0",
                                            hasContent
                                                ? "text-white shadow-md shadow-emerald-600/30"
                                                : "text-emerald-800 dark:text-emerald-200 hover:text-emerald-950 dark:hover:text-white"
                                        )}
                                    >
                                        {/* Lớp nền khi chưa có chữ: Mờ mịn thanh lịch (0% GPU khi idle) */}
                                        <div
                                            className={cn(
                                                "absolute inset-0 bg-emerald-500/15 dark:bg-emerald-500/20 hover:bg-emerald-500/25 transition-opacity duration-300 ease-out",
                                                hasContent ? "opacity-0 pointer-events-none" : "opacity-100"
                                            )}
                                        />

                                        {/* Lớp nền khi có chữ / ảnh: Gradient đa sắc chuyển màu êm ái */}
                                        <div
                                            className={cn(
                                                "absolute inset-0 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:brightness-105 transition-opacity duration-300 ease-out",
                                                hasContent ? "opacity-100" : "opacity-0 pointer-events-none"
                                            )}
                                        />

                                        {/* Tia sáng ngọc lướt qua khi rê chuột (Hardware-accelerated CSS transform) */}
                                        {hasContent && (
                                            <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/25 to-transparent skew-x-12 pointer-events-none" />
                                        )}

                                        <span className="relative z-10 transition-colors duration-200">
                                            {selectedImages.length > 0 && !input.trim() ? 'Khám ảnh' : 'Khám bệnh'}
                                        </span>

                                        <m.div
                                            className="relative z-10"
                                            animate={isSendingAnim ? {
                                                x: [0, 8, 14, 0],
                                                y: [0, -8, -14, 0],
                                                opacity: [1, 0.8, 0, 1],
                                                rotate: [0, -25, -45, 0]
                                            } : {}}
                                            transition={{ duration: 0.45, ease: "easeOut" }}
                                        >
                                            <Send size={13} className={cn("transition-transform duration-200", hasContent ? "translate-x-0.5 -translate-y-0.5" : "")} />
                                        </m.div>
                                    </m.button>
                                </div>
                            );
                        })()}
                    </div>
                </form>
            </m.div>

            {/* 3. Quick Command Grid (6 Tiles) */}
            <m.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1, ease: "easeOut" }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3 max-w-3xl mx-auto w-full mt-4"
            >
                {heroInfo.tiles.map((tile, tIdx) => {
                    const IconComponent = tile.icon;
                    return (
                        <m.button
                            key={tIdx}
                            type="button"
                            whileHover={{ y: -2, scale: 1.01 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={tile.onClick}
                            className="p-3 sm:p-3.5 rounded-2xl bg-white/40 dark:bg-black/35 hover:bg-white/60 dark:hover:bg-black/50 backdrop-blur-xl border border-white/50 dark:border-white/10 hover:border-emerald-500/40 dark:hover:border-emerald-500/40 text-left transition-all group cursor-pointer shadow-2xs hover:shadow-md flex items-start gap-3"
                        >
                            <div className={cn("w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-2xs mt-0.5", tile.badgeStyle)}>
                                <IconComponent size={18} className={tile.iconColor} />
                            </div>
                            <div className="min-w-0 flex-1">
                                <h4 className="font-extrabold text-xs sm:text-sm text-stone-900 dark:text-white group-hover:text-emerald-700 dark:group-hover:text-emerald-300 truncate">
                                    {tile.title}
                                </h4>
                                <p className="text-[11px] text-stone-500 dark:text-stone-400 font-medium mt-0.5 line-clamp-2 leading-relaxed">
                                    {tile.desc}
                                </p>
                            </div>
                        </m.button>
                    );
                })}
            </m.div>
        </div>
    );
});

const STORE_ACTIVES_DATA = [
    {
        id: 'radiant',
        category: 'sau_ray',
        name: 'Spinetoram 60g/L',
        tradeName: 'Radiant 60SC',
        target: 'Bọ trĩ, sâu cuốn lá, dòi đục lá',
        feature: 'Sinh học thế hệ mới, tác động thần kinh cực nhạy, kháng thuốc thấp',
        dosage: '15-20ml / Bình 25L • 100ml / Phuy 200L',
        badge: 'Đặc trị bọ trĩ',
        badgeColor: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30'
    },
    {
        id: 'proclaim',
        category: 'sau_ray',
        name: 'Emamectin Benzoate 5%',
        tradeName: 'Proclaim, Rồng Đỏ',
        target: 'Sâu tơ, sâu đục quả, sâu xanh, nhện',
        feature: 'Tiếp xúc vị độc, an toàn thiên địch, phổ trừ sâu rộng',
        dosage: '10g / Bình 25L • 80-100g / Phuy 200L',
        badge: 'Diệt sâu sinh học',
        badgeColor: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
    },
    {
        id: 'oshin',
        category: 'sau_ray',
        name: 'Dinotefuran 20%',
        tradeName: 'Oshin 20WP',
        target: 'Rầy phấn trắng, rầy mềm, rệp sáp',
        feature: 'Lưu dẫn 2 chiều cực mạnh, ngấm sâu hạ gục cả rầy ẩn dưới nách lá',
        dosage: '10-15g / Bình 25L • 100g / Phuy 200L',
        badge: 'Rầy phấn trắng',
        badgeColor: 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30'
    },
    {
        id: 'actara',
        category: 'sau_ray',
        name: 'Thiamethoxam 25%',
        tradeName: 'Actara 25WG',
        target: 'Bọ trĩ đọt non, rầy nâu, rệp muội',
        feature: 'Lưu dẫn bảo vệ đọt mới nhú, kích thích bộ rễ phát triển xanh khỏe',
        dosage: '1g / Bình 16L • 12-15g / Phuy 200L',
        badge: 'Bảo vệ đọt non',
        badgeColor: 'bg-teal-500/15 text-teal-700 dark:text-teal-300 border-teal-500/30'
    },
    {
        id: 'prevathon',
        category: 'sau_ray',
        name: 'Chlorantraniliprole',
        tradeName: 'Prevathon 5SC, Virtako',
        target: 'Sâu đục thân, sâu đục trái, sâu cuốn lá',
        feature: 'Nhóm Diamide làm tê liệt canxi cơ sâu tức thì, hiệu lực kéo dài 2-3 tuần',
        dosage: '25ml / Bình 25L • 200ml / Phuy 200L',
        badge: 'Chống sâu đục',
        badgeColor: 'bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30'
    },
    {
        id: 'amistartop',
        category: 'nam_khuan',
        name: 'Azoxystrobin + Difenoconazole',
        tradeName: 'Amistar Top 325SC',
        target: 'Thán thư, phấn trắng, đốm nâu cành, lem lép',
        feature: 'Nội hấp lưu dẫn 2 chiều, chặn đứng sợi nấm, giữ xanh gai bẹ',
        dosage: '15-20ml / Bình 25L • 250ml / 2 Phuy 400L',
        badge: 'Thán thư đốm cành',
        badgeColor: 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30'
    },
    {
        id: 'anvil',
        category: 'nam_khuan',
        name: 'Hexaconazole 50g/L',
        tradeName: 'Anvil 5SC',
        target: 'Đốm nâu cành, nấm hồng, rỉ sắt, khô vằn',
        feature: 'Ức chế tổng hợp Ergosterol tế bào nấm, làm bóng mướt cành lá',
        dosage: '35-40ml / Bình 25L • 300-400ml / Phuy 200L',
        badge: 'Bóng cành sạch nấm',
        badgeColor: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30'
    },
    {
        id: 'mancozeb',
        category: 'nam_khuan',
        name: 'Mancozeb Vàng 80%',
        tradeName: 'Dithane M-45, Manozeb',
        target: 'Phòng ngừa nấm phổ rộng, rửa vườn sau mưa',
        feature: 'Tiếp xúc bám dính như áo giáp vi lượng Kẽm (Zn) & Mangan (Mn)',
        dosage: '80-100g / Bình 25L • 1kg / 2 Phuy 400L',
        badge: 'Áo giáp Kẽm',
        badgeColor: 'bg-yellow-500/15 text-yellow-800 dark:text-yellow-300 border-yellow-500/30'
    },
    {
        id: 'ridomil',
        category: 'nam_khuan',
        name: 'Metalaxyl-M + Mancozeb',
        tradeName: 'Ridomil Gold 68WG',
        target: 'Xì mủ Phytophthora, thối nhũn, sương mai',
        feature: 'Cơ chế hiệp đồng: Bên trong lưu dẫn diệt nấm, bên ngoài che phủ',
        dosage: '50-60g / Bình 25L • 500g / Phuy 200L',
        badge: 'Trị Phytophthora',
        badgeColor: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
    },
    {
        id: 'kasumin',
        category: 'nam_khuan',
        name: 'Kasugamycin 2%',
        tradeName: 'Kasumin 2L',
        target: 'Vi khuẩn Xanthomonas, thối cành thối bông',
        feature: 'Kháng sinh thực vật an toàn, ức chế tổng hợp protein vi khuẩn, khô vết loét',
        dosage: '30-40ml / Bình 25L • 250-300ml / Phuy 200L',
        badge: 'Kháng sinh vi khuẩn',
        badgeColor: 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border-cyan-500/30'
    },
    {
        id: 'ga3',
        category: 'duong_trai',
        name: 'Gibberellic Acid (GA3)',
        tradeName: 'Viên Sủi GA3 / Tinh Chất',
        target: 'Kéo đòn, vươn lóng, vuốt tai thanh long',
        feature: 'Kích thích sinh trưởng giãn dài tế bào, tai xanh dài, dày bẹ',
        dosage: '1 viên 5g / Phuy 200L (hoặc 1ml / 10-15L)',
        badge: 'Vươn lóng vuốt tai',
        badgeColor: 'bg-lime-500/15 text-lime-800 dark:text-lime-300 border-lime-500/30'
    },
    {
        id: 'calciboron',
        category: 'duong_trai',
        name: 'Canxi Bo Chelate Hữu Cơ',
        tradeName: 'Cal-Boron, Bo-Trac Chelate',
        target: 'Chống rụng bông & trái non, chống nứt da',
        feature: 'Gia cố vách tế bào dẻo dai, cuống trái chắc khỏe, tăng tỷ lệ đậu',
        dosage: '25ml / Bình 25L • 200ml / Phuy 200L',
        badge: 'Dai cuống chống rụng',
        badgeColor: 'bg-orange-500/15 text-orange-700 dark:text-orange-300 border-orange-500/30'
    },
    {
        id: 'amino',
        category: 'duong_trai',
        name: 'Amino Acid + Rong Biển',
        tradeName: 'Seasol, Amino Dưỡng Bông',
        target: 'Chống sốc nhiệt nắng hạn, giải độc thuốc BVTV',
        feature: 'Cung cấp 16 acid amin tự do giúp mát bông, phục hồi sức cây tức thì',
        dosage: '30ml / Bình 25L • 250ml / Phuy 200L',
        badge: 'Mát bông chống sốc',
        badgeColor: 'bg-teal-500/15 text-teal-700 dark:text-teal-300 border-teal-500/30'
    },
    {
        id: 'silicon',
        category: 'tro_luc',
        name: 'Silicon Nông Nghiệp',
        tradeName: 'Organosilicone Siêu Thấm',
        target: 'Chất trợ lực loang trải, chống rửa trôi mưa',
        feature: 'Phá vỡ sức căng bề mặt giọt nước, loang đều sau 15s, dẫn thuốc thấm sâu kẽ lá',
        dosage: '5ml / Bình 25L • 40-50ml / Phuy 200L (pha cuối)',
        badge: 'Siêu loang 15s',
        badgeColor: 'bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30'
    },
    {
        id: 'daukhoang',
        category: 'tro_luc',
        name: 'Dầu Khoáng Nông Nghiệp',
        tradeName: 'SK Enspray 99EC',
        target: 'Ung trứng bọ trĩ, bịt lỗ thở nhện & rệp sáp',
        feature: 'Cơ chế vật lý bọc kín không lo lờn thuốc, cộng hưởng tăng lực cho thuốc rầy',
        dosage: '50ml / Bình 25L • 400ml / Phuy 200L',
        badge: 'Ung trứng bọ trĩ',
        badgeColor: 'bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-500/30'
    }
];

// Helpers cho việc phân loại & tra cứu toàn bộ hoạt chất từ kho cửa hàng
const removeVietnameseAccents = (str) => {
    if (!str || typeof str !== 'string') return '';
    return str
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/Đ/g, 'D')
        .toLowerCase()
        .trim();
};

const detectActiveCategory = (activeName = '', tradeName = '', catName = '') => {
    const text = `${activeName} ${tradeName} ${catName}`.toLowerCase();

    // Trợ lực & Phụ gia bám dính
    if (text.includes('tro luc') || text.includes('trợ lực') || text.includes('bám dính') || text.includes('bam dinh') ||
        text.includes('silicon') || text.includes('loang trai') || text.includes('loang trải') || text.includes('dầu khoáng') ||
        text.includes('dau khoang') || text.includes('enspray') || text.includes('surfactant') || text.includes('thấm sâu') || text.includes('tham sau')) {
        return 'tro_luc';
    }

    // Dưỡng trái, vuốt tai, dinh dưỡng & điều hòa sinh trưởng
    if (text.includes('ga3') || text.includes('gibberell') || text.includes('vuốt tai') || text.includes('vuot tai') ||
        text.includes('vươn lóng') || text.includes('lớn trái') || text.includes('lon trai') || text.includes('dưỡng trái') ||
        text.includes('amino') || text.includes('rong biển') || text.includes('rong bien') || text.includes('canxi') ||
        text.includes('bo-trac') || text.includes('calcium') || text.includes('boron') || text.includes('combi') ||
        text.includes('vi lượng') || text.includes('vi luong') || text.includes('phân bón') || text.includes('phan bon') ||
        text.includes('humic') || text.includes('fulvic') || text.includes('chống rụng') || text.includes('đậu trái') ||
        text.includes('kéo đọt') || text.includes('paclo')) {
        return 'duong_trai';
    }

    // Nấm bệnh & Vi khuẩn
    if (text.includes('nấm') || text.includes('nam') || text.includes('khuẩn') || text.includes('khuan') ||
        text.includes('thán thư') || text.includes('than thu') || text.includes('ghẻ') || text.includes('ghe') ||
        text.includes('sương mai') || text.includes('phấn trắng') || text.includes('phan trang') || text.includes('đốm nâu') ||
        text.includes('rỉ sắt') || text.includes('xì mủ') || text.includes('xi mu') || text.includes('thối') ||
        text.includes('loét') || text.includes('lở cổ') || text.includes('azoxy') || text.includes('difen') ||
        text.includes('hexa') || text.includes('manco') || text.includes('metala') || text.includes('kasu') ||
        text.includes('strepto') || text.includes('valida') || text.includes('propiconazole') || text.includes('tebuconazole') ||
        text.includes('carbendazim') || text.includes('dimethomorph') || text.includes('fosetyl') || text.includes('đồng') ||
        text.includes('copper') || text.includes('chlorothalonil')) {
        return 'nam_khuan';
    }

    // Sâu hại, rầy rệp, bọ trĩ, nhện đỏ (Mặc định cho thuốc BVTV bảo vệ)
    return 'sau_ray';
};

const getProductBadge = (active = '', name = '', cat = 'sau_ray') => {
    const text = `${active} ${name}`.toLowerCase();
    if (text.includes('bọ trĩ') || text.includes('bo tri') || text.includes('spinetoram')) return 'Đặc trị bọ trĩ';
    if (text.includes('nhện') || text.includes('nhen')) return 'Đặc trị nhện đỏ';
    if (text.includes('rầy') || text.includes('ray') || text.includes('rệp') || text.includes('rep') || text.includes('dinotefuran')) return 'Đặc trị rầy rệp';
    if (text.includes('sâu đục') || text.includes('cuốn lá') || text.includes('chlorantraniliprole') || text.includes('virtako') || text.includes('prevathon')) return 'Trừ sâu kháng';
    if (text.includes('thán thư') || text.includes('than thu')) return 'Đặc trị thán thư';
    if (text.includes('xì mủ') || text.includes('xi mu') || text.includes('sương mai') || text.includes('phytophthora') || text.includes('metalaxyl')) return 'Trị xì mủ thối cây';
    if (text.includes('khuẩn') || text.includes('khuan') || text.includes('loét') || text.includes('kasu') || text.includes('strepto')) return 'Kháng sinh diệt khuẩn';
    if (text.includes('ga3') || text.includes('vuốt tai') || text.includes('vuot tai')) return 'Vuốt tai vươn lóng';
    if (text.includes('canxi') || text.includes('bo') || text.includes('chống rụng')) return 'Dai cuống đậu trái';
    if (text.includes('amino') || text.includes('rong biển') || text.includes('rong bien')) return 'Mát cây phục hồi';
    if (text.includes('silicon') || text.includes('loang') || text.includes('bám dính')) return 'Siêu bám dính 15s';
    if (text.includes('dầu khoáng') || text.includes('dau khoang') || text.includes('enspray')) return 'Ung trứng bịt thở';

    if (cat === 'sau_ray') return 'Đặc trị sâu rầy';
    if (cat === 'nam_khuan') return 'Trừ bệnh nấm khuẩn';
    if (cat === 'duong_trai') return 'Dưỡng trái & vuốt tai';
    return 'Trợ lực loang trải';
};

const getBadgeStyle = (cat) => {
    switch (cat) {
        case 'sau_ray':
            return 'bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/30';
        case 'nam_khuan':
            return 'bg-rose-500/15 text-rose-800 dark:text-rose-300 border-rose-500/30';
        case 'duong_trai':
            return 'bg-lime-500/15 text-lime-800 dark:text-lime-300 border-lime-500/30';
        case 'tro_luc':
            return 'bg-sky-500/15 text-sky-800 dark:text-sky-300 border-sky-500/30';
        default:
            return 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border-emerald-500/30';
    }
};

const getDosageText = (p) => {
    if (p.dosage && typeof p.dosage === 'string' && p.dosage.trim()) return p.dosage;
    const u = (p.unit || '').toLowerCase();
    if (u === 'viên' || u === 'vien') return '1 viên / Phuy 200L (hoặc 1 viên / 10-15 bình)';
    if (u === 'gói' || u === 'goi') return '1 gói / Phuy 200L (hoặc 25-50g / Bình 25L)';
    if (u === 'chai') return '20-25ml / Bình 25L • 200-250ml / Phuy 200L';
    if (u === 'can') return '1L / 400-500L nước tưới gốc hoặc phun lá';
    return 'Liều chuẩn theo hướng dẫn nhãn • Phun đều ướt lá';
};

const getTargetText = (p, cat) => {
    if (p.target && typeof p.target === 'string' && p.target.trim()) return p.target;
    if (cat === 'sau_ray') return 'Đặc trị bọ trĩ, rầy phấn trắng, sâu đục thân, nhện đỏ, sâu cuốn lá';
    if (cat === 'nam_khuan') return 'Trị thán thư, đốm nâu cành, nấm hồng, sương mai, thối nhũn vi khuẩn';
    if (cat === 'duong_trai') return 'Vuốt tai thanh long, lớn trái, dai cuống chống rụng bông, dưỡng xanh gai';
    return 'Chất trợ lực bám dính, phá vỡ sức căng giọt nước, chống rửa trôi mưa';
};

const CockpitLeftPanel = React.memo(function CockpitLeftPanel({
    onSelectActive,
    isLoading,
    currentThemeConfig,
    isTransparentBg,
    isDark
}) {
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState('all');

    // Đồng bộ dữ liệu kho thuốc & hoạt chất thực tế của cửa hàng từ useProductData
    const { data: rawProducts } = useProductData();
    const [apiProducts, setApiProducts] = useState([]);

    useEffect(() => {
        let isMounted = true;
        if (!rawProducts || rawProducts.length === 0) {
            axios.get('/api/products')
                .then(res => {
                    if (!isMounted) return;
                    const list = Array.isArray(res.data) ? res.data : (res.data?.data || res.data?.items || []);
                    if (list.length > 0) setApiProducts(list);
                })
                .catch(() => { });
        }
        return () => { isMounted = false; };
    }, [rawProducts]);

    const storeProducts = (rawProducts && rawProducts.length > 0) ? rawProducts : apiProducts;

    const tabs = [
        { id: 'all', label: 'Tất cả', icon: LayoutGrid, iconColor: 'text-emerald-600 dark:text-emerald-400' },
        { id: 'sau_ray', label: 'Sâu rầy', icon: Bug, iconColor: 'text-amber-600 dark:text-amber-400' },
        { id: 'nam_khuan', label: 'Nấm khuẩn', icon: Microscope, iconColor: 'text-rose-600 dark:text-rose-400' },
        { id: 'duong_trai', label: 'Vuốt tai', icon: Leaf, iconColor: 'text-lime-600 dark:text-lime-400' },
        { id: 'tro_luc', label: 'Trợ lực', icon: Droplets, iconColor: 'text-sky-600 dark:text-sky-400' }
    ];

    // Kết hợp toàn bộ hoạt chất & thuốc thực tế trong kho với danh mục mẫu
    const allStoreActives = useMemo(() => {
        const list = [];
        const usedProductIds = new Set();

        // 1. Nạp danh mục tiêu chuẩn đại diện, gắn kèm tồn kho thực tế nếu tìm thấy sản phẩm tương ứng
        STORE_ACTIVES_DATA.forEach(curated => {
            const normName = removeVietnameseAccents(curated.name);
            const normTrade = removeVietnameseAccents(curated.tradeName);

            const matchedProd = storeProducts.find(p => {
                const pName = removeVietnameseAccents(p.name || '');
                const pAct = removeVietnameseAccents(p.active_ingredient || '');
                return (
                    (pAct && normName && (pAct.includes(normName) || normName.includes(pAct))) ||
                    (normTrade && pName && (pName.includes(normTrade) || normTrade.includes(pName)))
                );
            });

            if (matchedProd) {
                usedProductIds.add(matchedProd.id);
            }

            list.push({
                ...curated,
                isCurated: true,
                productId: matchedProd?.id,
                stock: matchedProd ? Number(matchedProd.stock || 0) : undefined,
                unit: matchedProd?.unit || '',
                salePrice: matchedProd?.sale_price
            });
        });

        // 2. Nạp toàn bộ sản phẩm thực tế từ kho cửa hàng
        // Ưu tiên sản phẩm có hoạt chất rõ ràng và còn tồn kho
        const remainingProducts = storeProducts
            .filter(p => !usedProductIds.has(p.id))
            .sort((a, b) => {
                const aHasAct = (a.active_ingredient && a.active_ingredient.trim()) ? 1 : 0;
                const bHasAct = (b.active_ingredient && b.active_ingredient.trim()) ? 1 : 0;
                if (aHasAct !== bHasAct) return bHasAct - aHasAct;
                return (Number(b.stock || 0) > 0 ? 1 : 0) - (Number(a.stock || 0) > 0 ? 1 : 0);
            });

        remainingProducts.forEach(p => {
            const pName = (p.name || '').trim();
            const pActive = (p.active_ingredient || '').trim();
            if (!pName && !pActive) return;

            const cat = detectActiveCategory(pActive, pName, p.category_name || p.category || '');
            const badge = getProductBadge(pActive, pName, cat);
            const badgeColor = getBadgeStyle(cat);
            const dosage = getDosageText(p);
            const target = getTargetText(p, cat);

            list.push({
                id: `prod-${p.id}`,
                productId: p.id,
                category: cat,
                name: pActive || p.brand || 'Dược chất BVTV kho',
                tradeName: pName,
                target,
                feature: pActive ? `Hoạt chất BVTV: ${pActive}` : 'Thuốc BVTV & phân bón sẵn có trong kho',
                dosage,
                badge,
                badgeColor,
                stock: Number(p.stock || 0),
                unit: p.unit || '',
                salePrice: p.sale_price,
                hasRealActive: Boolean(pActive),
                isCurated: false
            });
        });

        return list;
    }, [storeProducts]);

    const isSearching = Boolean(searchQuery.trim());

    // Lọc theo từ khóa tìm kiếm (hỗ trợ không dấu) và tab danh mục
    const filteredItems = useMemo(() => {
        let list = allStoreActives;
        if (activeTab !== 'all') {
            list = list.filter(item => item.category === activeTab);
        }
        if (isSearching) {
            const qNorm = removeVietnameseAccents(searchQuery);
            const qWords = qNorm.split(/\s+/).filter(Boolean);

            list = list.filter(item => {
                const fullText = removeVietnameseAccents(
                    `${item.name} ${item.tradeName} ${item.target} ${item.feature} ${item.badge} ${item.unit || ''}`
                );
                return qWords.every(word => fullText.includes(word));
            });
        }
        return list;
    }, [allStoreActives, activeTab, searchQuery, isSearching]);

    // Quy tắc hiển thị:
    // 1. Khi đang SEARCH: phải ra HẾT kết quả phù hợp ("search phải ra hết")
    // 2. Khi KHÔNG search: chỉ hiển thị TƯỢNG TRƯNG 10 CÁI tiêu biểu ("còn hiện thì tượng trưng 10 cái")
    const displayItems = useMemo(() => {
        if (isSearching) {
            return filteredItems;
        }
        return filteredItems.slice(0, 10);
    }, [filteredItems, isSearching]);

    const asideStyle = isTransparentBg
        ? {
            backgroundColor: isDark ? 'rgba(12, 24, 18, 0.45)' : 'rgba(255, 255, 255, 0.35)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)'
        }
        : {
            backgroundColor: isDark
                ? (currentThemeConfig?.darkBg || '#071710')
                : (currentThemeConfig?.lightBg || '#f5f3ec')
        };

    return (
        <aside
            style={asideStyle}
            className="hidden xl:flex w-72 2xl:w-80 flex-col shrink-0 rounded-3xl border border-white/40 dark:border-white/10 shadow-lg shadow-black/5 dark:shadow-black/20 my-2 sm:my-2.5 ml-2.5 sm:ml-3 mr-1 sm:mr-1.5 overflow-hidden z-10 select-none transition-all backdrop-blur-2xl"
        >
            {/* Header */}
            <div className="p-3.5 border-b border-black/[0.06] dark:border-white/[0.08] shrink-0 bg-transparent">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-emerald-500/15 dark:bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-700 dark:text-emerald-400 shadow-2xs">
                            <FlaskConical size={16} />
                        </div>
                        <div>
                            <h3 className="font-extrabold text-xs sm:text-sm text-stone-900 dark:text-white tracking-tight flex items-center gap-1.5">
                                <span>Kho Hoạt Chất & Thuốc</span>
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            </h3>
                            <p className="text-[10px] text-stone-500 dark:text-stone-400 font-medium">
                                Chạm để AI đối chiếu & kê đơn
                            </p>
                        </div>
                    </div>
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/25">
                        {isSearching
                            ? `Tìm thấy ${filteredItems.length} mục`
                            : `${Math.min(10, filteredItems.length)} / ${allStoreActives.length} mục`}
                    </span>
                </div>

                {/* Search Bar */}
                <div className="relative mt-2.5">
                    <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400 dark:text-stone-500" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Tìm hoạt chất, tên thuốc trong kho..."
                        className="w-full pl-8 pr-7 py-1.5 rounded-xl text-xs bg-white/40 hover:bg-white/60 focus:bg-white/70 dark:bg-black/25 dark:hover:bg-black/40 text-stone-900 dark:text-white placeholder-stone-500 dark:placeholder-stone-400 border border-white/50 dark:border-white/10 outline-none focus:border-emerald-500/60 shadow-2xs transition-all backdrop-blur-xs"
                    />
                    {searchQuery && (
                        <button
                            type="button"
                            onClick={() => setSearchQuery('')}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 cursor-pointer"
                        >
                            <X size={12} />
                        </button>
                    )}
                </div>

                {/* Filter Pills */}
                <div className="flex items-center gap-1 overflow-x-auto custom-scrollbar mt-2 pt-0.5 pb-0.5">
                    {tabs.map(tab => {
                        const TabIcon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => setActiveTab(tab.id)}
                                className={cn(
                                    "shrink-0 px-2 py-1 rounded-lg text-[10.5px] font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5",
                                    isActive
                                        ? "bg-emerald-600 text-white shadow-2xs shadow-emerald-950/20"
                                        : "bg-white/40 hover:bg-white/65 dark:bg-white/10 dark:hover:bg-white/20 text-stone-800 dark:text-stone-300 border border-white/35 dark:border-white/10"
                                )}
                            >
                                {TabIcon && (
                                    <TabIcon size={12} className={cn("shrink-0", isActive ? 'text-white' : tab.iconColor)} />
                                )}
                                <span>{tab.label}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* List of Actives */}
            <div className="flex-1 overflow-y-auto p-2.5 space-y-2 custom-scrollbar">
                {displayItems.length === 0 ? (
                    <div className="py-8 text-center text-xs text-stone-400">
                        Không tìm thấy thuốc hoặc hoạt chất phù hợp
                    </div>
                ) : (
                    <>
                        {displayItems.map(item => (
                            <div
                                key={item.id}
                                onClick={() => {
                                    if (isLoading) return;
                                    onSelectActive(`Tư vấn chi tiết về hoạt chất / thuốc ${item.tradeName || item.name} (Hoạt chất: ${item.name}): cơ chế tác động, liều lượng chuẩn cho phuy 200L & bình 25L, thời điểm phun xịt và cách phối trộn hiệu quả nhất?`);
                                }}
                                className={cn(
                                    "group p-2.5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden backdrop-blur-md",
                                    isTransparentBg
                                        ? "bg-white/40 hover:bg-white/65 dark:bg-black/30 dark:hover:bg-black/50 border-white/50 dark:border-white/10"
                                        : "bg-white/80 hover:bg-white dark:bg-white/[0.06] dark:hover:bg-white/[0.1] border-black/[0.06] dark:border-white/10",
                                    "hover:border-emerald-500/50 dark:hover:border-emerald-500/40",
                                    "shadow-2xs hover:shadow-md hover:shadow-black/5 dark:hover:shadow-black/20 active:scale-[0.99]",
                                    isLoading && "opacity-60 cursor-not-allowed"
                                )}
                            >
                                <div className="flex items-start justify-between gap-1.5">
                                    <span className={cn("text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md border", item.badgeColor)}>
                                        {item.badge}
                                    </span>
                                    <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5 opacity-85 group-hover:opacity-100">
                                        Hỏi AI <ArrowRight size={10} />
                                    </span>
                                </div>

                                <div className="mt-1.5">
                                    <h4 className="font-extrabold text-xs text-stone-900 dark:text-white group-hover:text-emerald-700 dark:group-hover:text-emerald-300 transition-colors line-clamp-1">
                                        {item.tradeName}
                                    </h4>
                                    <p className="text-[11px] font-bold text-emerald-800 dark:text-emerald-400/90 leading-tight line-clamp-1">
                                        {item.name}
                                    </p>
                                </div>

                                <p className="text-[10.5px] text-stone-600 dark:text-stone-300 mt-1 line-clamp-2 leading-relaxed">
                                    {item.target}
                                </p>

                                <div className="mt-2 pt-1.5 border-t border-black/[0.04] dark:border-white/[0.04] flex items-center justify-between text-[9.5px]">
                                    <div className="flex items-center gap-1 font-bold text-stone-500 dark:text-stone-400 truncate max-w-[62%]">
                                        <span className="shrink-0">Liều:</span>
                                        <span className="font-semibold text-stone-700 dark:text-stone-300 truncate" title={item.dosage}>
                                            {item.dosage}
                                        </span>
                                    </div>
                                    {item.stock !== undefined && (
                                        <span className={cn(
                                            "font-extrabold px-1.5 py-0.5 rounded-md text-[9px] shrink-0",
                                            item.stock > 0
                                                ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20"
                                                : "bg-stone-500/10 text-stone-500 dark:text-stone-400 border border-stone-500/20"
                                        )}>
                                            {item.stock > 0 ? `Kho: ${item.stock} ${item.unit || ''}` : 'Hết hàng'}
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}

                        {/* Thông báo gợi ý tra cứu toàn bộ kho khi đang hiển thị tượng trưng 10 mục */}
                        {!isSearching && filteredItems.length > 10 && (
                            <div className="p-2.5 rounded-2xl bg-black/[0.03] dark:bg-white/[0.04] border border-black/[0.06] dark:border-white/[0.08] text-center my-1 select-none">
                                <p className="text-[11px] font-bold text-stone-700 dark:text-stone-300">
                                    Đang hiển thị 10 hoạt chất tiêu biểu
                                </p>
                                <p className="text-[10px] text-stone-500 dark:text-stone-400 mt-0.5">
                                    Nhập ô tìm kiếm để tra cứu toàn bộ <strong>{filteredItems.length}</strong> thuốc & hoạt chất trong kho
                                </p>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Footer Status Bar */}
            <div className="p-2.5 border-t border-black/[0.06] dark:border-white/[0.08] bg-transparent shrink-0 text-[10px] text-stone-500 dark:text-stone-400 flex items-center justify-between">
                <span className="flex items-center gap-1.5 truncate">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                    <span className="truncate">Đồng bộ kho BVTV ({allStoreActives.length} mục)</span>
                </span>
                <span className="font-bold text-emerald-700 dark:text-emerald-400 shrink-0">
                    Sẵn sàng kê đơn
                </span>
            </div>
        </aside>
    );
});

const CockpitRightPanel = React.memo(function CockpitRightPanel({
    onQuickAsk,
    isLoading,
    currentThemeConfig,
    isTransparentBg,
    isDark
}) {
    const asideStyle = isTransparentBg
        ? {
            backgroundColor: isDark ? 'rgba(12, 24, 18, 0.45)' : 'rgba(255, 255, 255, 0.35)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)'
        }
        : {
            backgroundColor: isDark
                ? (currentThemeConfig?.darkBg || '#071710')
                : (currentThemeConfig?.lightBg || '#f5f3ec')
        };

    const cardClass = cn(
        "p-3.5 rounded-3xl border transition-all duration-200 shadow-sm backdrop-blur-md",
        isTransparentBg
            ? "bg-white/40 hover:bg-white/60 dark:bg-black/30 dark:hover:bg-black/50 border-white/50 dark:border-white/10"
            : "bg-white/90 hover:bg-white dark:bg-white/[0.07] dark:hover:bg-white/[0.11] border-stone-200/80 dark:border-white/10"
    );

    return (
        <aside
            style={asideStyle}
            className="hidden xl:flex w-72 2xl:w-80 flex-col shrink-0 rounded-3xl border border-white/40 dark:border-white/10 shadow-md shadow-black/5 dark:shadow-black/20 my-2 sm:my-2.5 mr-2.5 sm:mr-3 ml-1 sm:ml-1.5 overflow-hidden z-10 select-none transition-all backdrop-blur-2xl"
        >
            {/* Header Cẩm Nang Dược Học */}
            <div className="p-3.5 border-b border-black/[0.06] dark:border-white/[0.08] shrink-0 bg-transparent">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500/20 to-emerald-500/20 border border-amber-500/30 dark:border-amber-500/40 flex items-center justify-center text-amber-700 dark:text-amber-300 shadow-2xs shrink-0">
                        <BookOpen size={16} />
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                            <h3 className="font-extrabold text-xs sm:text-sm text-stone-900 dark:text-white tracking-tight">
                                Cẩm Nang Dược Học
                            </h3>
                            <span className="px-1.5 py-0.2 rounded-md bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 text-[9px] font-black uppercase tracking-wider border border-emerald-500/25">
                                Chuẩn BVTV
                            </span>
                        </div>
                        <p className="text-[10px] text-stone-500 dark:text-stone-400 font-medium truncate">
                            Thứ tự hòa tan & bảng chia liều lâm sàng
                        </p>
                    </div>
                </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
                {/* 1. Card Quy Tắc Pha Phuy W-S-S-E-A (The Gold Standard Flow) */}
                <div className={cardClass}>
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1.5">
                            <div className="w-6 h-6 rounded-lg bg-emerald-500/15 dark:bg-emerald-500/25 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                                <FlaskConical size={13} />
                            </div>
                            <span className="text-[11px] font-black uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                                Quy Tắc Pha Phuy
                            </span>
                        </div>
                        <span className="px-2 py-0.5 rounded-lg bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 font-mono font-black text-[10px] tracking-wide border border-emerald-500/25 shadow-2xs">
                            W-S-S-E-A
                        </span>
                    </div>

                    <p className="text-[10px] text-stone-500 dark:text-stone-400 leading-snug mb-2.5">
                        Thứ tự hòa tan chuẩn quốc tế tránh kết tủa & nghẹt béc phun:
                    </p>

                    {/* Step list với màu sắc đặc trưng từng dạng thuốc */}
                    <div className="space-y-1.5 text-xs">
                        {/* 1. W */}
                        <div
                            onClick={() => !isLoading && onQuickAsk("Hướng dẫn chi tiết cách hòa tan thuốc bột WP, WG, WDG vào xô riêng trước khi đổ vào phuy 200L để không bị nghẹt béc?")}
                            className="p-2 rounded-2xl bg-amber-500/[0.06] hover:bg-amber-500/15 dark:bg-amber-500/[0.08] dark:hover:bg-amber-500/20 border border-amber-500/25 hover:border-amber-500/40 flex items-center gap-2.5 transition-all shadow-2xs group cursor-pointer active:scale-[0.98]"
                            title="Nhấp để hỏi AI cách pha thuốc dạng bột"
                        >
                            <div className="w-6 h-6 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-stone-950 font-black text-[10px] flex items-center justify-center shrink-0 shadow-xs border border-amber-300/40 group-hover:scale-105 transition-transform">
                                1.W
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5">
                                    <p className="font-extrabold text-[11px] text-stone-900 dark:text-white leading-tight">
                                        Bột hòa tan
                                    </p>
                                    <span className="px-1.5 py-0.2 rounded font-mono font-bold text-[9px] bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/20">
                                        WP, WG, WDG
                                    </span>
                                </div>
                                <p className="text-[9.5px] text-stone-500 dark:text-stone-400 mt-0.5 leading-tight">
                                    Hòa tan xô riêng trước rồi đổ vào phuy
                                </p>
                            </div>
                        </div>

                        {/* 2. S */}
                        <div
                            onClick={() => !isLoading && onQuickAsk("Hướng dẫn cách pha thuốc dạng huyền phù SC, FL vào phuy 200L để hòa tan đều và không bị lắng cặn?")}
                            className="p-2 rounded-2xl bg-blue-500/[0.06] hover:bg-blue-500/15 dark:bg-blue-500/[0.08] dark:hover:bg-blue-500/20 border border-blue-500/25 hover:border-blue-500/40 flex items-center gap-2.5 transition-all shadow-2xs group cursor-pointer active:scale-[0.98]"
                            title="Nhấp để hỏi AI cách pha huyền phù SC"
                        >
                            <div className="w-6 h-6 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-black text-[10px] flex items-center justify-center shrink-0 shadow-xs border border-blue-400/40 group-hover:scale-105 transition-transform">
                                2.S
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5">
                                    <p className="font-extrabold text-[11px] text-stone-900 dark:text-white leading-tight">
                                        Huyền phù đậm đặc
                                    </p>
                                    <span className="px-1.5 py-0.2 rounded font-mono font-bold text-[9px] bg-blue-500/15 text-blue-800 dark:text-blue-300 border border-blue-500/20">
                                        SC, FL
                                    </span>
                                </div>
                                <p className="text-[9.5px] text-stone-500 dark:text-stone-400 mt-0.5 leading-tight">
                                    Lắc kỹ chai rồi đổ vào phuy khuấy đều
                                </p>
                            </div>
                        </div>

                        {/* 3. S */}
                        <div
                            onClick={() => !isLoading && onQuickAsk("Hướng dẫn thứ tự pha dung dịch tan hoàn toàn SL, SP và phân bón lá lỏng vào phuy 200L?")}
                            className="p-2 rounded-2xl bg-teal-500/[0.06] hover:bg-teal-500/15 dark:bg-teal-500/[0.08] dark:hover:bg-teal-500/20 border border-teal-500/25 hover:border-teal-500/40 flex items-center gap-2.5 transition-all shadow-2xs group cursor-pointer active:scale-[0.98]"
                            title="Nhấp để hỏi AI cách pha dung dịch SL"
                        >
                            <div className="w-6 h-6 rounded-xl bg-gradient-to-br from-teal-400 to-emerald-600 text-white font-black text-[10px] flex items-center justify-center shrink-0 shadow-xs border border-teal-300/40 group-hover:scale-105 transition-transform">
                                3.S
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5">
                                    <p className="font-extrabold text-[11px] text-stone-900 dark:text-white leading-tight">
                                        Dung dịch tan
                                    </p>
                                    <span className="px-1.5 py-0.2 rounded font-mono font-bold text-[9px] bg-teal-500/15 text-teal-800 dark:text-teal-300 border border-teal-500/20">
                                        SL, SP, Phân lỏng
                                    </span>
                                </div>
                                <p className="text-[9.5px] text-stone-500 dark:text-stone-400 mt-0.5 leading-tight">
                                    Đổ tiếp vào sau khi huyền phù đã tan hết
                                </p>
                            </div>
                        </div>

                        {/* 4. E */}
                        <div
                            onClick={() => !isLoading && onQuickAsk("Vì sao thuốc dạng nhũ dầu EC, EW, OD phải pha sau cùng và cách phòng tránh vón cục, cháy lá non?")}
                            className="p-2 rounded-2xl bg-purple-500/[0.06] hover:bg-purple-500/15 dark:bg-purple-500/[0.08] dark:hover:bg-purple-500/20 border border-purple-500/25 hover:border-purple-500/40 flex items-center gap-2.5 transition-all shadow-2xs group cursor-pointer active:scale-[0.98]"
                            title="Nhấp để hỏi AI cách pha nhũ dầu EC"
                        >
                            <div className="w-6 h-6 rounded-xl bg-gradient-to-br from-purple-500 to-fuchsia-600 text-white font-black text-[10px] flex items-center justify-center shrink-0 shadow-xs border border-purple-400/40 group-hover:scale-105 transition-transform">
                                4.E
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5">
                                    <p className="font-extrabold text-[11px] text-stone-900 dark:text-white leading-tight">
                                        Nhũ dầu sữa
                                    </p>
                                    <span className="px-1.5 py-0.2 rounded font-mono font-bold text-[9px] bg-purple-500/15 text-purple-800 dark:text-purple-300 border border-purple-500/20">
                                        EC, EW, OD
                                    </span>
                                </div>
                                <p className="text-[9.5px] text-stone-500 dark:text-stone-400 mt-0.5 leading-tight">
                                    Dạng dầu sữa cho sau cùng tránh vón cục
                                </p>
                            </div>
                        </div>

                        {/* 5. A */}
                        <div
                            onClick={() => !isLoading && onQuickAsk("Cách pha chất trợ lực, thấm sâu loang trải Silicon vào phuy đúng kỹ thuật để tăng hiệu lực thuốc?")}
                            className="p-2 rounded-2xl bg-emerald-500/[0.06] hover:bg-emerald-500/15 dark:bg-emerald-500/[0.08] dark:hover:bg-emerald-500/20 border border-emerald-500/25 hover:border-emerald-500/40 flex items-center gap-2.5 transition-all shadow-2xs group cursor-pointer active:scale-[0.98]"
                            title="Nhấp để hỏi AI cách pha chất bám dính Silicon"
                        >
                            <div className="w-6 h-6 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white font-black text-[10px] flex items-center justify-center shrink-0 shadow-xs border border-emerald-400/40 group-hover:scale-105 transition-transform">
                                5.A
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5">
                                    <p className="font-extrabold text-[11px] text-stone-900 dark:text-white leading-tight">
                                        Trợ lực & bám dính
                                    </p>
                                    <span className="px-1.5 py-0.2 rounded font-mono font-bold text-[9px] bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/20">
                                        Silicon, Thấm sâu
                                    </span>
                                </div>
                                <p className="text-[9.5px] text-stone-500 dark:text-stone-400 mt-0.5 leading-tight">
                                    Bước chót hạ khi phuy đã đầy 90% nước
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Hộp Nguyên Tắc Vàng */}
                    <div className="mt-2.5 p-2.5 rounded-2xl bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-transparent dark:from-amber-500/20 dark:via-amber-500/10 border-l-3 border-amber-500 border-y border-r border-amber-500/30 text-[10px] shadow-2xs">
                        <div className="flex items-center gap-1.5 font-black text-amber-800 dark:text-amber-300 mb-0.5">
                            <Sparkles size={12} className="text-amber-500 shrink-0" />
                            <span>Nguyên tắc vàng sống còn:</span>
                        </div>
                        <p className="leading-relaxed text-stone-700 dark:text-stone-300">
                            Đổ <strong>1/2 nước</strong> vào phuy trước. Tuyệt đối không đổ 2 loại thuốc đậm đặc trực tiếp vào nhau!
                        </p>
                    </div>

                    {/* Nút hành động */}
                    <button
                        type="button"
                        onClick={() => {
                            if (isLoading) return;
                            onQuickAsk("Hướng dẫn chi tiết thứ tự pha thuốc vào phuy 200L theo quy tắc W-S-S-E-A và cách phòng ngừa kết tủa nghẹt béc?");
                        }}
                        className="mt-3 w-full py-2.5 px-3 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black shadow-sm shadow-emerald-950/20 hover:shadow-md flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-[0.98] group"
                    >
                        <span>Hỏi AI chi tiết về W-S-S-E-A</span>
                        <ArrowRight size={13} className="transition-transform group-hover:translate-x-1" />
                    </button>
                </div>

                {/* 2. Card Bảng Tính Liều Nhanh (Phuy 200L <-> Bình 25L) */}
                <div className={cardClass}>
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1.5">
                            <div className="w-6 h-6 rounded-lg bg-sky-500/15 dark:bg-sky-500/25 border border-sky-500/30 flex items-center justify-center text-sky-600 dark:text-sky-400 shrink-0">
                                <Scale size={13} />
                            </div>
                            <span className="text-[11px] font-black uppercase tracking-wider text-sky-800 dark:text-sky-300">
                                Quy Đổi Liều Nhanh
                            </span>
                        </div>
                        <span className="px-2 py-0.5 rounded-lg bg-sky-500/15 text-sky-700 dark:text-sky-300 font-mono font-black text-[9.5px] border border-sky-500/25 shadow-2xs">
                            1 Phuy = 8 Bình 25L
                        </span>
                    </div>

                    {/* Conversion Recipe Grid */}
                    <div className="space-y-1.5">
                        {/* 500ml */}
                        <div
                            onClick={() => !isLoading && onQuickAsk("Hướng dẫn chia liều chai thuốc 500ml (liều chuẩn 2 phuy 400L) ra từng bình 25L sao cho chuẩn nhất?")}
                            className="p-2 rounded-2xl bg-white/40 dark:bg-white/[0.04] hover:bg-white/60 dark:hover:bg-sky-500/10 border border-white/50 hover:border-sky-500/30 dark:border-white/[0.07] flex items-center justify-between gap-2 transition-all shadow-2xs group cursor-pointer active:scale-[0.98] backdrop-blur-xs"
                            title="Nhấp để hỏi AI tính toán chai 500ml"
                        >
                            <div className="min-w-0">
                                <p className="font-extrabold text-[11px] text-stone-800 dark:text-stone-200">
                                    Chai 500ml
                                </p>
                                <p className="text-[9.5px] text-stone-400 dark:text-stone-500">
                                    Pha 2 phuy (400L)
                                </p>
                            </div>
                            <div className="px-2 py-1 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 border border-emerald-500/25 text-right shrink-0">
                                <span className="font-mono font-black text-xs text-emerald-700 dark:text-emerald-300">
                                    ~30ml
                                </span>
                                <span className="text-[9.5px] text-emerald-600 dark:text-emerald-400 font-semibold ml-1">
                                    / bình 25L
                                </span>
                            </div>
                        </div>

                        {/* 240ml */}
                        <div
                            onClick={() => !isLoading && onQuickAsk("Hướng dẫn đong chai thuốc 240ml (liều chuẩn 1 phuy 200L) bằng nắp chai sang từng bình 25L?")}
                            className="p-2 rounded-2xl bg-white/40 dark:bg-white/[0.04] hover:bg-white/60 dark:hover:bg-sky-500/10 border border-white/50 hover:border-sky-500/30 dark:border-white/[0.07] flex items-center justify-between gap-2 transition-all shadow-2xs group cursor-pointer active:scale-[0.98] backdrop-blur-xs"
                            title="Nhấp để hỏi AI tính toán chai 240ml"
                        >
                            <div className="min-w-0">
                                <p className="font-extrabold text-[11px] text-stone-800 dark:text-stone-200">
                                    Chai 240ml
                                </p>
                                <p className="text-[9.5px] text-stone-400 dark:text-stone-500">
                                    Pha 1 phuy (200L)
                                </p>
                            </div>
                            <div className="px-2 py-1 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 border border-emerald-500/25 text-right shrink-0">
                                <span className="font-mono font-black text-xs text-emerald-700 dark:text-emerald-300">
                                    30ml
                                </span>
                                <span className="text-[9.5px] text-emerald-600 dark:text-emerald-400 font-semibold ml-1">
                                    (1 nắp) / bình
                                </span>
                            </div>
                        </div>

                        {/* Gói 100g */}
                        <div
                            onClick={() => !isLoading && onQuickAsk("Hướng dẫn cách chia gói thuốc bột 100g (liều chuẩn 1 phuy 200L) bằng muỗng canh sang từng bình 25L?")}
                            className="p-2 rounded-2xl bg-white/40 dark:bg-white/[0.04] hover:bg-white/60 dark:hover:bg-sky-500/10 border border-white/50 hover:border-sky-500/30 dark:border-white/[0.07] flex items-center justify-between gap-2 transition-all shadow-2xs group cursor-pointer active:scale-[0.98] backdrop-blur-xs"
                            title="Nhấp để hỏi AI tính toán gói 100g"
                        >
                            <div className="min-w-0">
                                <p className="font-extrabold text-[11px] text-stone-800 dark:text-stone-200">
                                    Gói 100g
                                </p>
                                <p className="text-[9.5px] text-stone-400 dark:text-stone-500">
                                    Pha 1 phuy (200L)
                                </p>
                            </div>
                            <div className="px-2 py-1 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 border border-emerald-500/25 text-right shrink-0">
                                <span className="font-mono font-black text-xs text-emerald-700 dark:text-emerald-300">
                                    12.5g
                                </span>
                                <span className="text-[9.5px] text-emerald-600 dark:text-emerald-400 font-semibold ml-1">
                                    (~1 muỗng)
                                </span>
                            </div>
                        </div>

                        {/* Gói 50g */}
                        <div
                            onClick={() => !isLoading && onQuickAsk("Hướng dẫn chia gói thuốc 50g (liều chuẩn 1 phuy 200L) sang 8 bình 25L chính xác không bị quá liều?")}
                            className="p-2 rounded-2xl bg-white/40 dark:bg-white/[0.04] hover:bg-white/60 dark:hover:bg-sky-500/10 border border-white/50 hover:border-sky-500/30 dark:border-white/[0.07] flex items-center justify-between gap-2 transition-all shadow-2xs group cursor-pointer active:scale-[0.98] backdrop-blur-xs"
                            title="Nhấp để hỏi AI tính toán gói 50g"
                        >
                            <div className="min-w-0">
                                <p className="font-extrabold text-[11px] text-stone-800 dark:text-stone-200">
                                    Gói 50g
                                </p>
                                <p className="text-[9.5px] text-stone-400 dark:text-stone-500">
                                    Pha 1 phuy (200L)
                                </p>
                            </div>
                            <div className="px-2 py-1 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 border border-emerald-500/25 text-right shrink-0">
                                <span className="font-mono font-black text-xs text-emerald-700 dark:text-emerald-300">
                                    6.25g
                                </span>
                                <span className="text-[9.5px] text-emerald-600 dark:text-emerald-400 font-semibold ml-1">
                                    / bình 25L
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Nút hành động */}
                    <button
                        type="button"
                        onClick={() => {
                            if (isLoading) return;
                            onQuickAsk("Hướng dẫn cách chia liều thuốc chính xác từ chai 240ml, chai 500ml và gói 100g sang bình 25L và bình 16L?");
                        }}
                        className="mt-3 w-full py-2.5 px-3 rounded-2xl bg-gradient-to-r from-sky-600 via-teal-600 to-sky-700 hover:from-sky-500 hover:to-teal-500 text-white text-xs font-black shadow-sm shadow-sky-950/20 hover:shadow-md flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-[0.98] group"
                    >
                        <Calculator size={13} className="shrink-0" />
                        <span>Nhờ AI tính liều lượng</span>
                        <ArrowRight size={13} className="transition-transform group-hover:translate-x-1" />
                    </button>
                </div>

                {/* 3. Card Cảnh Báo Tương Khắc (Không Phối) */}
                <div className="p-3.5 rounded-3xl border border-rose-500/30 bg-rose-500/[0.06] dark:bg-rose-950/30 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400">
                            <div className="w-6 h-6 rounded-lg bg-rose-500/15 dark:bg-rose-500/25 border border-rose-500/30 flex items-center justify-center shrink-0">
                                <AlertTriangle size={13} />
                            </div>
                            <span className="text-[11px] font-black uppercase tracking-wider">
                                Cảnh Báo Tương Khắc
                            </span>
                        </div>
                        <span className="px-1.5 py-0.2 rounded-md bg-rose-500/20 text-rose-700 dark:text-rose-300 font-mono font-black text-[9px] uppercase tracking-wider border border-rose-500/30">
                            Không Phối
                        </span>
                    </div>

                    <div className="space-y-1.5 text-[10px]">
                        <div
                            onClick={() => !isLoading && onQuickAsk("Vì sao gốc Đồng không được pha chung với thuốc nhũ dầu EC hoặc phân bón chứa Lân hữu cơ?")}
                            className="p-2 rounded-2xl bg-white/40 dark:bg-white/[0.04] hover:bg-white/60 border border-rose-500/20 hover:border-rose-500/40 flex items-start gap-2 transition-all cursor-pointer shadow-2xs group backdrop-blur-xs"
                        >
                            <span className="w-4 h-4 rounded-full bg-rose-500 text-white font-black text-[9px] flex items-center justify-center shrink-0 mt-0.5">✕</span>
                            <div className="min-w-0 flex-1 leading-snug">
                                <p className="font-extrabold text-stone-900 dark:text-white">Gốc Đồng + Nhũ dầu EC / Lân</p>
                                <p className="text-rose-600 dark:text-rose-400 text-[9.5px]">Dễ bẻ gãy nhũ tương, cháy lá và kết tủa</p>
                            </div>
                        </div>

                        <div
                            onClick={() => !isLoading && onQuickAsk("Vì sao thuốc có tính kiềm cao như Vôi, Bordeaux không được pha chung với vi sinh Trichoderma hay Bacillus?")}
                            className="p-2 rounded-2xl bg-white/40 dark:bg-white/[0.04] hover:bg-white/60 border border-rose-500/20 hover:border-rose-500/40 flex items-start gap-2 transition-all cursor-pointer shadow-2xs group backdrop-blur-xs"
                        >
                            <span className="w-4 h-4 rounded-full bg-rose-500 text-white font-black text-[9px] flex items-center justify-center shrink-0 mt-0.5">✕</span>
                            <div className="min-w-0 flex-1 leading-snug">
                                <p className="font-extrabold text-stone-900 dark:text-white">Vôi / Thuốc kiềm + Vi sinh đối kháng</p>
                                <p className="text-rose-600 dark:text-rose-400 text-[9.5px]">Tiêu diệt nấm có ích (Trichoderma, Bacillus)</p>
                            </div>
                        </div>

                        <div
                            onClick={() => !isLoading && onQuickAsk("Vì sao Canxi Bo đậm đặc không nên pha chung với phân Lân hoặc Lưu huỳnh vì tạo thạch cao?")}
                            className="p-2 rounded-2xl bg-white/40 dark:bg-white/[0.04] hover:bg-white/60 border border-rose-500/20 hover:border-rose-500/40 flex items-start gap-2 transition-all cursor-pointer shadow-2xs group backdrop-blur-xs"
                        >
                            <span className="w-4 h-4 rounded-full bg-rose-500 text-white font-black text-[9px] flex items-center justify-center shrink-0 mt-0.5">✕</span>
                            <div className="min-w-0 flex-1 leading-snug">
                                <p className="font-extrabold text-stone-900 dark:text-white">Canxi đậm đặc + Lân / Lưu huỳnh</p>
                                <p className="text-rose-600 dark:text-rose-400 text-[9.5px]">Tạo kết tủa thạch cao làm nghẹt béc phun</p>
                            </div>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={() => {
                            if (isLoading) return;
                            onQuickAsk("Kiểm tra tương tác thuốc: Những loại thuốc BVTV và phân bón lá nào tuyệt đối không được pha chung với nhau vì gây kết tủa hoặc cháy lá?");
                        }}
                        className="mt-3 w-full py-2.5 px-3 rounded-2xl bg-gradient-to-r from-rose-600 via-rose-700 to-rose-600 hover:brightness-105 text-white text-xs font-black shadow-sm shadow-rose-950/20 hover:shadow-md flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-[0.98] group"
                    >
                        <span>Hỏi AI kiểm tra tương tác thuốc</span>
                        <ArrowRight size={13} className="transition-transform group-hover:translate-x-1" />
                    </button>
                </div>
            </div>
        </aside>
    );
});

const ChatMessageBubble = React.memo(function ChatMessageBubble({
    msg,
    idx,
    isLatestUser,
    isLatestModel,
    latestUserMsgRef,
    latestModelMsgRef,
    fontSize,
    copiedIndex,
    addedProducts,
    activeTab,
    onTabChange,
    onCopy,
    onDelete,
    onAddToCart,
    onAddAllToCart,
    renderFormattedText,
    mascot
}) {
    return (
        <m.div
            ref={isLatestUser ? latestUserMsgRef : (isLatestModel ? latestModelMsgRef : null)}
            layout="position"
            initial={{
                opacity: 0,
                y: msg.role === 'user' ? 64 : 18,
                x: msg.role === 'user' ? 32 : 0,
                scale: msg.role === 'user' ? 0.68 : 0.95,
            }}
            animate={{
                opacity: 1,
                y: 0,
                x: 0,
                scale: 1
            }}
            exit={{ opacity: 0, y: -6, transition: { duration: 0.15 } }}
            transition={msg.role === 'user' ? {
                type: 'spring',
                stiffness: 210,
                damping: 18,
                mass: 0.85
            } : {
                type: 'spring',
                stiffness: 260,
                damping: 24,
                mass: 0.8
            }}
            style={{
                willChange: 'transform, opacity',
                transformOrigin: msg.role === 'user' ? 'bottom right' : 'top left'
            }}
            className={`scroll-mt-4 group/msg ${msg.role === 'user' ? 'flex justify-end items-end gap-1.5' : 'flex gap-2.5 sm:gap-3 items-start justify-start'}`}
        >
            {msg.role === 'user' && (
                <div className="flex items-center gap-1 opacity-0 group-hover/msg:opacity-100 transition-opacity duration-150 select-none pb-1 shrink-0">
                    <button
                        type="button"
                        onClick={() => onCopy(msg.text, idx)}
                        title="Sao chép câu hỏi"
                        className="w-7 h-7 rounded-full bg-slate-800/85 hover:bg-slate-700 text-slate-300 hover:text-white border border-white/10 shadow-sm flex items-center justify-center transition-all cursor-pointer active:scale-90"
                    >
                        {copiedIndex === idx ? <CheckCheck size={12} className="text-emerald-400" /> : <Copy size={12} />}
                    </button>
                    <button
                        type="button"
                        onClick={() => onDelete(idx)}
                        title="Xóa câu hỏi này"
                        className="w-7 h-7 rounded-full bg-slate-800/85 hover:bg-rose-600 text-slate-300 hover:text-white border border-white/10 shadow-sm flex items-center justify-center transition-all cursor-pointer active:scale-90"
                    >
                        <Trash2 size={12} />
                    </button>
                </div>
            )}

            {msg.role === 'model' && (
                <div className="relative shrink-0 mt-0.5 select-none">
                    <div
                        className="w-8.5 h-8.5 sm:w-9.5 sm:h-9.5 rounded-2xl overflow-hidden bg-gradient-to-tr from-amber-200 via-emerald-100 to-teal-200 dark:from-[#0d2218] dark:via-[#133022] dark:to-[#1a4430] border border-emerald-500/40 flex items-center justify-center shadow-md shadow-emerald-950/20 ring-2 ring-emerald-500/20 ring-offset-1 ring-offset-transparent transition-transform duration-300 hover:scale-105"
                    >
                        <div
                            style={{
                                width: '100%',
                                height: '100%',
                                backgroundImage: `url("${mascot?.directions || '/mascots/lyang-directions.webp'}")`,
                                backgroundSize: '300% 300%',
                                backgroundPosition: '50% 50%',
                                backgroundRepeat: 'no-repeat',
                                transform: 'scale(1.22)',
                                transformOrigin: 'center center'
                            }}
                            className="pointer-events-none select-none"
                        />
                    </div>
                    {/* Glowing active indicator dot */}
                    <span
                        title="Bác Sĩ Cây Trồng Lí An online"
                        className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white dark:border-[#07130d] shadow-[0_0_8px_rgba(16,185,129,0.9)] animate-pulse"
                    />
                </div>
            )}

            <div
                className={`relative select-text ${msg.role === 'user'
                        ? 'max-w-[85%] rounded-2xl rounded-br-xs sm:rounded-[20px] sm:rounded-br-[4px] px-4 py-2.5 sm:px-4.5 sm:py-3 text-white bg-emerald-600 shadow-md shadow-emerald-950/20 border border-emerald-500/40'
                        : 'max-w-[88%] bg-white/85 dark:bg-[#0c1a14]/90 backdrop-blur-2xl border border-emerald-500/25 dark:border-emerald-500/30 rounded-3xl rounded-tl-md sm:rounded-3xl sm:rounded-tl-lg p-4 sm:p-5 shadow-[0_10px_30px_rgba(0,0,0,0.06),0_1px_3px_rgba(16,185,129,0.08)] dark:shadow-[0_14px_40px_rgba(0,0,0,0.5),0_0_20px_rgba(16,185,129,0.08)] text-stone-800 dark:text-stone-100 overflow-hidden'
                    }`}
            >
                {/* Model hardware top shine / light ray */}
                {msg.role === 'model' && (
                    <div className="absolute inset-x-6 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-emerald-400/50 dark:via-emerald-400/30 to-transparent pointer-events-none rounded-t-full" />
                )}

                {/* Model Header with Brand Badge & Quick Actions */}
                {msg.role === 'model' && (
                    <div className="flex items-center justify-between gap-2 mb-3 pb-2.5 border-b border-emerald-500/15 dark:border-emerald-500/20 select-none">
                        <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-emerald-500/15 to-teal-500/15 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 font-black text-[11px] shadow-2xs">
                                <span>🌾</span>
                                <span>{(mascot?.name && !mascot.name.includes('Lyang')) ? mascot.name : 'Lí An'}</span>
                                <span className="text-[9px] px-1 py-0.2 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-bold uppercase tracking-wider">AI</span>
                            </span>
                            <span className="inline-flex items-center gap-1 text-[9.5px] font-bold px-2 py-0.5 rounded-full bg-amber-500/12 dark:bg-amber-400/10 text-amber-900 dark:text-amber-300 border border-amber-500/30">
                                <Sparkles size={10} className="text-amber-500" />
                                <span>Bác Sĩ Cây Trồng Lí An</span>
                            </span>
                        </div>

                        {/* Model Message Action Buttons (Copy / Delete) */}
                        {msg.id !== 'welcome' && (
                            <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity select-none">
                                <button
                                    type="button"
                                    onClick={() => onCopy(msg.text, idx)}
                                    title="Sao chép toàn bộ chẩn đoán & phác đồ"
                                    className="p-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-white/10 dark:hover:bg-white/20 text-stone-600 dark:text-stone-300 border border-stone-200/60 dark:border-white/10 transition-all cursor-pointer shadow-2xs select-none active:scale-90"
                                >
                                    {copiedIndex === idx ? <CheckCheck size={13} className="text-emerald-600 dark:text-emerald-400" /> : <Copy size={13} />}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => onDelete(idx)}
                                    title="Xóa câu trả lời này"
                                    className="p-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 border border-rose-200/60 dark:border-rose-800/40 transition-all cursor-pointer shadow-2xs select-none active:scale-90"
                                >
                                    <Trash2 size={13} />
                                </button>
                            </div>
                        )}
                    </div>
                )}


                {/* User Images */}
                {msg.images && msg.images.length > 0 && (
                    <div className="flex gap-2 mb-3 flex-wrap select-none">
                        {msg.images.map((img, imgIdx) => (
                            <div key={imgIdx} className="relative group/img overflow-hidden rounded-2xl border-2 border-white/40 shadow-md">
                                <img
                                    src={img}
                                    alt="Uploaded crop/leaf"
                                    className="w-20 h-20 object-cover transition-transform duration-300 group-hover/img:scale-108"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover/img:opacity-100 transition-opacity flex items-end p-1.5 pointer-events-none">
                                    <span className="text-[9px] font-black text-white drop-shadow-xs">Ảnh #{imgIdx + 1}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Content */}
                <div className="space-y-0.5 select-text">
                    {msg.role === 'user' ? (
                        <p
                            style={{ fontSize: `${Math.max(13, fontSize)}px`, lineHeight: 1.6 }}
                            className="font-medium whitespace-pre-wrap leading-relaxed drop-shadow-2xs select-text cursor-text text-white"
                        >
                            {msg.text}
                        </p>
                    ) : (
                        <div
                            style={{ fontSize: `${fontSize}px`, lineHeight: 1.65 }}
                            className="select-text cursor-text leading-relaxed font-normal text-stone-800 dark:text-stone-100"
                        >
                            {renderFormattedText(msg.text)}
                        </div>
                    )}
                </div>

                {/* Recommended Products Cards */}
                {msg.recommended_products && msg.recommended_products.length > 0 && (() => {
                    const allProds = msg.recommended_products;
                    const targetProds = allProds.filter(p => isTargetProduct(p));
                    const synergyProds = allProds.filter(p => !isTargetProduct(p));

                    const currentTab = activeTab || (targetProds.length > 0 ? 'target' : 'all');
                    const displayedProds = currentTab === 'target'
                        ? targetProds
                        : (currentTab === 'synergy' ? synergyProds : allProds);

                    const inStockCount = displayedProds.filter(p => (p.stock || 0) > 0).length;

                    return (
                        <div className="mt-3.5 pt-3.5 border-t border-stone-200/80 dark:border-white/10 space-y-2.5 select-none">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#8b6f47]/20 dark:border-white/10">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                    {targetProds.length > 0 && (
                                        <button
                                            type="button"
                                            onClick={() => onTabChange(msg.id, 'target')}
                                            className={cn(
                                                "px-2.5 py-1 rounded-xl text-[10.5px] font-black flex items-center gap-1.5 transition-all cursor-pointer active:scale-95",
                                                currentTab === 'target'
                                                    ? "bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 shadow-sm shadow-amber-500/20 ring-1 ring-amber-400"
                                                    : "bg-black/5 dark:bg-white/5 text-stone-600 dark:text-stone-300 hover:bg-black/10"
                                            )}
                                        >
                                            <span>⚡ Thuốc đặc trị</span>
                                            <span className={cn(
                                                "px-1.5 py-0.2 rounded-full text-[9px] font-black",
                                                currentTab === 'target' ? "bg-black/20 text-stone-950" : "bg-black/10 dark:bg-white/10"
                                            )}>
                                                {targetProds.length}
                                            </span>
                                        </button>
                                    )}
                                    {synergyProds.length > 0 && (
                                        <button
                                            type="button"
                                            onClick={() => onTabChange(msg.id, 'synergy')}
                                            className={cn(
                                                "px-2.5 py-1 rounded-xl text-[10.5px] font-black flex items-center gap-1.5 transition-all cursor-pointer active:scale-95",
                                                currentTab === 'synergy'
                                                    ? "bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-sm shadow-emerald-700/20 ring-1 ring-emerald-400/40"
                                                    : "bg-black/5 dark:bg-white/5 text-stone-600 dark:text-stone-300 hover:bg-black/10"
                                            )}
                                        >
                                            <span>🔄 Phối hợp tăng lực</span>
                                            <span className={cn(
                                                "px-1.5 py-0.2 rounded-full text-[9px] font-black",
                                                currentTab === 'synergy' ? "bg-white/25 text-white" : "bg-black/10 dark:bg-white/10"
                                            )}>
                                                {synergyProds.length}
                                            </span>
                                        </button>
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => onTabChange(msg.id, 'all')}
                                        className={cn(
                                            "px-2 py-1 rounded-xl text-[10px] font-bold transition-all cursor-pointer active:scale-95",
                                            currentTab === 'all'
                                                ? "bg-stone-800 text-white dark:bg-white dark:text-stone-900 shadow-xs"
                                                : "text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
                                        )}
                                    >
                                        <span>Tất cả ({allProds.length})</span>
                                    </button>
                                </div>

                                <button
                                    type="button"
                                    disabled={inStockCount === 0}
                                    onClick={() => onAddAllToCart(displayedProds)}
                                    className="px-2.5 py-1 rounded-xl bg-gradient-to-r from-[#2d5016] to-[#3e6d23] hover:brightness-110 active:scale-95 text-white text-[10px] font-black flex items-center gap-1 shadow-xs transition-all shrink-0 cursor-pointer disabled:opacity-40"
                                    title={`Thêm ${inStockCount} thuốc còn hàng trong tab này vào đơn hàng POS`}
                                >
                                    <ShoppingCart size={11} />
                                    <span>Thêm {currentTab === 'target' ? 'đặc trị' : (currentTab === 'synergy' ? 'phối hợp' : 'tất cả')} ({inStockCount})</span>
                                </button>
                            </div>

                            <div className="grid grid-cols-1 gap-2 max-h-[420px] overflow-y-auto pr-1 custom-scrollbar">
                                {displayedProds.map((prod) => {
                                    const inStock = (prod.stock || 0) > 0;
                                    const isAdded = addedProducts[prod.id];
                                    const isTarget = isTargetProduct(prod);

                                    return (
                                        <div
                                            key={prod.id}
                                            className={cn(
                                                "p-3 rounded-2xl border flex flex-col justify-between gap-2 shadow-2xs transition-all select-none",
                                                isTarget
                                                    ? "border-amber-500/35 hover:border-amber-500/60 bg-amber-500/5 dark:bg-[#1a2216]/90"
                                                    : "border-emerald-600/25 hover:border-emerald-600/50 bg-emerald-500/5 dark:bg-[#14281f]/90"
                                            )}
                                        >
                                            <div>
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="min-w-0 flex-1 select-text">
                                                        <h5
                                                            style={{ fontSize: `${Math.max(12.5, fontSize)}px` }}
                                                            className="font-black text-stone-900 dark:text-white leading-snug select-text cursor-text"
                                                        >
                                                            {prod.name}
                                                        </h5>
                                                        {prod.tier && (
                                                            <div className="mt-1">
                                                                <span className={`inline-flex items-center gap-1 text-[9.5px] font-black px-2 py-0.5 rounded-lg border ${isTarget
                                                                        ? 'bg-amber-500/20 text-amber-900 dark:text-amber-200 border-amber-500/40'
                                                                        : 'bg-emerald-500/15 text-emerald-900 dark:text-emerald-200 border-emerald-500/30'
                                                                    }`}>
                                                                    {prod.tier}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <span
                                                        className={`text-[10px] font-black px-2.5 py-0.5 rounded-full shrink-0 border ${inStock
                                                                ? 'bg-emerald-100 text-emerald-800 border-emerald-300/60 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800/40'
                                                                : 'bg-rose-100 text-rose-700 border-rose-300/60 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800/40'
                                                            }`}
                                                    >
                                                        {inStock ? `Còn ${prod.stock} ${prod.unit || ''}` : 'Hết hàng'}
                                                    </span>
                                                </div>
                                                {prod.active_ingredient && (
                                                    <p
                                                        style={{ fontSize: `${Math.max(11, fontSize - 1.5)}px` }}
                                                        className="font-bold italic mt-1 text-emerald-800 dark:text-emerald-400 line-clamp-1 flex items-center gap-1.5 select-text cursor-text"
                                                        title={prod.active_ingredient}
                                                    >
                                                        <FlaskConical size={12} className="text-emerald-600 dark:text-emerald-400 shrink-0 select-none" />
                                                        <span className="select-text">{prod.active_ingredient}</span>
                                                    </p>
                                                )}
                                                {prod.dosage && (
                                                    <div
                                                        style={{ fontSize: `${Math.max(10.5, fontSize - 1.5)}px` }}
                                                        className="mt-1.5 px-2.5 py-1 rounded-xl bg-sky-50 dark:bg-sky-950/30 text-sky-900 dark:text-sky-200 border border-sky-200/70 dark:border-sky-800/40 font-medium flex items-start gap-1.5 select-text cursor-text"
                                                    >
                                                        <Droplets size={13} className="text-sky-500 shrink-0 mt-0.5 select-none" />
                                                        <span className="line-clamp-2 select-text">{prod.dosage}</span>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex items-center justify-between pt-2 border-t border-stone-200/60 dark:border-white/5">
                                                <div
                                                    style={{ fontSize: `${Math.max(12, fontSize)}px` }}
                                                    className="font-black text-[#2d5016] dark:text-emerald-400 select-text cursor-text"
                                                >
                                                    {Number(prod.sale_price || 0).toLocaleString('vi-VN')} đ
                                                    {prod.unit && <span className="text-[10px] font-normal text-stone-500 dark:text-stone-400 select-none">/{prod.unit}</span>}
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => onAddToCart(prod)}
                                                    disabled={!inStock}
                                                    style={{
                                                        background: inStock && !isAdded ? 'var(--button-gradient, linear-gradient(135deg, #2d5016 0%, #3e6d23 100%))' : undefined
                                                    }}
                                                    className={`px-3 py-1.5 rounded-xl text-[11px] font-black flex items-center gap-1.5 shadow-sm active:scale-95 transition-all select-none cursor-pointer ${isAdded
                                                            ? 'bg-emerald-600 text-white'
                                                            : inStock
                                                                ? 'hover:brightness-110 text-white'
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
                    );
                })()}
            </div>
        </m.div>
    );
});



export default function AiConsultantModal({
    isOpen,
    onClose,
    onAddToCart,
    mascotPos = { x: 800, y: 500 },
    mascotSize = 110,
    isStandalone = false,
    onlyDoctorMode = false
}) {
    const isAdmin = useMemo(() => {
        try {
            const u = JSON.parse(sessionStorage.getItem('user') || '{}');
            return checkIsAdmin(u?.role);
        } catch (e) {
            return false;
        }
    }, []);
    const effectiveIsOpen = isStandalone || isOpen;
    const isDoctorOnly = isStandalone || onlyDoctorMode;

    const [activeMascot, setActiveMascot] = useState(getActiveMascot);

    useEffect(() => {
        const handleMascotChange = () => {
            setActiveMascot(getActiveMascot());
        };
        window.addEventListener('lyang_mascot_config_updated', handleMascotChange);
        window.addEventListener('storage', handleMascotChange);
        return () => {
            window.removeEventListener('lyang_mascot_config_updated', handleMascotChange);
            window.removeEventListener('storage', handleMascotChange);
        };
    }, []);

    const [isDark, setIsDark] = useState(() => {
        return typeof document !== 'undefined' && (document.documentElement.classList.contains('dark') || localStorage.getItem('theme') === 'dark');
    });

    const handleToggleDark = () => {
        const nextDark = !isDark;
        setIsDark(nextDark);
        if (nextDark) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
        window.dispatchEvent(new Event('storage'));
    };

    const handleCopyPageLink = () => {
        const url = `${window.location.origin}${window.location.pathname}#/bacsisauquy`;
        navigator.clipboard.writeText(url);
        toast.success('Đã sao chép link Bác Sĩ Cây Trồng Lí An (#/bacsisauquy)!', {
            icon: '🔗',
            duration: 3000
        });
    };

    const [activeMode, setActiveMode] = useState(() => {
        if (isDoctorOnly) return 'crop_doctor';
        try {
            const saved = localStorage.getItem('lyang_ai_active_mode');
            if (saved && MODES.some(m => m.id === saved)) return saved;
        } catch (e) { }
        return 'crop_doctor';
    });

    const currentModeConfig = useMemo(() => {
        if (isDoctorOnly) return MODES[0];
        return MODES.find(m => m.id === activeMode) || MODES[0];
    }, [activeMode, isDoctorOnly]);

    const getInitialMessages = (modeId) => {
        try {
            const storageKey = modeId === 'crop_doctor'
                ? (localStorage.getItem('lyang_ai_chat_crop_doctor') ? 'lyang_ai_chat_crop_doctor' : 'lyang_ai_consult_chat')
                : `lyang_ai_chat_${modeId}`;
            const saved = localStorage.getItem(storageKey);
            if (saved) {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    return parsed.map((m, i) => ({
                        ...m,
                        id: m.id || `msg-${modeId}-${i}-${Date.now()}`
                    }));
                }
            }
        } catch (e) { }
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
        setActiveMode(newModeId);
        try {
            localStorage.setItem('lyang_ai_active_mode', newModeId);
        } catch (e) { }
        setMessages(getInitialMessages(newModeId));
    };

    // Lưu tin nhắn theo từng mode
    useEffect(() => {
        try {
            localStorage.setItem(`lyang_ai_chat_${activeMode}`, JSON.stringify(messages));
            if (activeMode === 'crop_doctor') {
                localStorage.setItem('lyang_ai_consult_chat', JSON.stringify(messages));
            }
        } catch (e) { }
    }, [messages, activeMode]);

    // Tự động đồng bộ và nạp trước cấu hình / Gemini API Key từ máy chủ khi mở modal
    useEffect(() => {
        const syncServerConfig = async () => {
            try {
                let s = null;
                try {
                    const res = await axios.get('/api/settings', { timeout: 3500 });
                    if (res?.data) s = res.data;
                } catch (e) { }

                if (!s && typeof window !== 'undefined' && window.location?.origin) {
                    try {
                        const raw = await fetch(`${window.location.origin.replace(/\/+$/, '')}/api/settings`);
                        if (raw.ok) s = await raw.json();
                    } catch (e) { }
                }

                if (s) {
                    if (s.gemini_api_key && typeof s.gemini_api_key === 'string' && s.gemini_api_key.trim()) {
                        localStorage.setItem('gemini_api_key', s.gemini_api_key.trim());
                    }
                    if (s.shop_name) {
                        localStorage.setItem('lyang_store_name', s.shop_name);
                    }
                }
            } catch (err) { }
        };
        syncServerConfig();
    }, []);

    const [fontSize, setFontSize] = useState(() => {
        try {
            const saved = localStorage.getItem('lyang_ai_font_size');
            if (saved) {
                const num = parseFloat(saved);
                if (!isNaN(num) && num >= 11 && num <= 22) return num;
            }
        } catch (e) { }
        return 13;
    });

    const handleFontSizeChange = (delta) => {
        setFontSize(prev => {
            const next = Math.min(22, Math.max(11, Math.round((prev + delta) * 10) / 10));
            try {
                localStorage.setItem('lyang_ai_font_size', next.toString());
            } catch (e) { }
            return next;
        });
    };

    // --- CHẾ ĐỘ NỀN TRONG SUỐT (GIỐNG TAB POS) & MÀU SẮC KHUNG CHAT ---
    const [isTransparentBg, setIsTransparentBg] = useState(() => {
        const saved = localStorage.getItem('lyang_ai_transparent_bg');
        if (saved !== null) return saved === 'true';
        return true; // Mặc định bật nền trong suốt giống tab POS
    });

    const handleToggleTransparentBg = () => {
        setIsTransparentBg(prev => {
            const next = !prev;
            try {
                localStorage.setItem('lyang_ai_transparent_bg', next.toString());
            } catch (e) { }
            if (next) {
                setChatTheme('transparent');
                try { localStorage.setItem('lyang_ai_chat_theme', 'transparent'); } catch (e) { }
            } else if (chatTheme === 'transparent') {
                setChatTheme('cream');
                try { localStorage.setItem('lyang_ai_chat_theme', 'cream'); } catch (e) { }
            }
            return next;
        });
    };

    const [chatTheme, setChatTheme] = useState(() => {
        const saved = localStorage.getItem('lyang_ai_chat_theme');
        if (saved === 'transparent') return 'transparent';
        if (!saved || saved === 'glass') {
            try {
                localStorage.setItem('lyang_ai_chat_theme', 'transparent');
                localStorage.setItem('lyang_ai_transparent_bg', 'true');
            } catch (e) { }
            return 'transparent';
        }
        return saved;
    });
    const [customChatColor, setCustomChatColor] = useState(() => {
        return localStorage.getItem('lyang_ai_custom_chat_color') || '#ffffff';
    });

    const handleSelectTheme = (themeId) => {
        setChatTheme(themeId);
        const isTrans = themeId === 'transparent';
        setIsTransparentBg(isTrans);
        try {
            localStorage.setItem('lyang_ai_chat_theme', themeId);
            localStorage.setItem('lyang_ai_transparent_bg', isTrans.toString());
        } catch (e) { }
    };

    const handleCustomColorChange = (hex) => {
        setCustomChatColor(hex);
        setChatTheme('custom');
        setIsTransparentBg(false);
        try {
            localStorage.setItem('lyang_ai_chat_theme', 'custom');
            localStorage.setItem('lyang_ai_custom_chat_color', hex);
            localStorage.setItem('lyang_ai_transparent_bg', 'false');
        } catch (e) { }
    };

    const currentThemeConfig = useMemo(() => {
        if (chatTheme === 'custom') {
            return {
                id: 'custom',
                name: 'Tự chọn',
                icon: '🎨',
                preview: customChatColor,
                lightBg: customChatColor,
                darkBg: '#091510',
                lightHeader: 'rgba(0, 0, 0, 0.03)',
                darkHeader: 'rgba(255, 255, 255, 0.02)',
                lightInput: 'rgba(0, 0, 0, 0.02)',
                darkInput: 'rgba(0, 0, 0, 0.25)',
                bubbleLight: customChatColor,
                bubbleDark: '#091510'
            };
        }
        return CHAT_THEMES.find(t => t.id === chatTheme) || CHAT_THEMES[0];
    }, [chatTheme, customChatColor]);

    // --- CÀI ĐẶT & CHỌN MODEL GOOGLE AI STUDIO ---
    const [showSettings, setShowSettings] = useState(false);
    const settingsPanelRef = useRef(null);
    const settingsBtnRef = useRef(null);

    const [selectedModel, setSelectedModel] = useState(() => {
        return localStorage.getItem('lyang_ai_selected_model') || 'gemini-2.5-flash';
    });

    const [availableModels, setAvailableModels] = useState(() => {
        try {
            const saved = localStorage.getItem('lyang_ai_available_models');
            if (saved) {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed) && parsed.length > 0) return parsed;
            }
        } catch (e) { }
        return [
            { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', desc: 'Thế hệ 2.5 mới nhất - Tốc độ cực nhanh & tối ưu nhất (Khuyên dùng)' },
            { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', desc: 'Tốc độ cao, đa phương thức vượt trội' },
            { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', desc: 'Hoạt động ổn định, phản hồi tức thì' },
            { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', desc: 'Suy luận chuyên sâu & ngữ cảnh siêu lớn' }
        ];
    });

    const [isFetchingModels, setIsFetchingModels] = useState(false);

    // Đóng dropdown settings khi click ra ngoài
    useEffect(() => {
        if (!showSettings) return;
        const handleClickOutsideSettings = (e) => {
            if (settingsBtnRef.current && settingsBtnRef.current.contains(e.target)) {
                return;
            }
            if (settingsPanelRef.current && !settingsPanelRef.current.contains(e.target)) {
                setShowSettings(false);
            }
        };
        document.addEventListener('pointerdown', handleClickOutsideSettings);
        return () => document.removeEventListener('pointerdown', handleClickOutsideSettings);
    }, [showSettings]);

    useEffect(() => {
        const handleModelChanged = (e) => {
            if (e.detail?.model) {
                setSelectedModel(e.detail.model);
            }
            if (e.detail?.models && Array.isArray(e.detail.models)) {
                setAvailableModels(e.detail.models);
            }
        };
        window.addEventListener('gemini_model_changed', handleModelChanged);
        return () => window.removeEventListener('gemini_model_changed', handleModelChanged);
    }, []);

    useEffect(() => {
        if (!isOpen) return;
        axios.get('/api/settings').then(res => {
            if (res.data?.gemini_selected_model) {
                setSelectedModel(res.data.gemini_selected_model);
                localStorage.setItem('lyang_ai_selected_model', res.data.gemini_selected_model);
            }
            if (res.data?.gemini_available_models) {
                try {
                    const parsed = typeof res.data.gemini_available_models === 'string'
                        ? JSON.parse(res.data.gemini_available_models)
                        : res.data.gemini_available_models;
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        setAvailableModels(parsed);
                    }
                } catch (e) { }
            }
        }).catch(() => { });
    }, [isOpen]);

    const handleSelectModel = (modelId) => {
        setSelectedModel(modelId);
        try {
            localStorage.setItem('lyang_ai_selected_model', modelId);
            axios.post('/api/settings', { gemini_selected_model: modelId }).catch(() => { });
            window.dispatchEvent(new CustomEvent('gemini_model_changed', { detail: { model: modelId } }));
        } catch (e) { }
        toast.success(`Đã chọn model: ${modelId}`);
    };

    const handleFetchModels = async () => {
        setIsFetchingModels(true);
        try {
            let apiKeys = [];
            const localKey = (localStorage.getItem('gemini_api_key') || '').trim();
            if (localKey) {
                localKey.split(/[,;\n]/).forEach(k => {
                    const trimmed = k.trim();
                    if (trimmed && !apiKeys.includes(trimmed)) apiKeys.push(trimmed);
                });
            }

            try {
                const sRes = await axios.get('/api/settings', { timeout: 3500 });
                if (sRes.data) {
                    ['gemini_api_key', 'gemini_api_key_2', 'gemini_api_key_3'].forEach(k => {
                        if (sRes.data[k] && typeof sRes.data[k] === 'string') {
                            sRes.data[k].split(/[,;\n]/).forEach(p => {
                                const trimmed = p.trim();
                                if (trimmed && !apiKeys.includes(trimmed)) apiKeys.push(trimmed);
                            });
                        }
                    });
                }
            } catch (e) { }

            if (apiKeys.length === 0) {
                toast.error('Chưa có Gemini API Key. Vui lòng vào Cài đặt hệ thống để lưu API Key trước khi fetch.');
                setIsFetchingModels(false);
                return;
            }

            let foundModels = [];
            let lastError = '';

            for (let i = 0; i < apiKeys.length; i++) {
                const key = apiKeys[i];
                try {
                    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;
                    const res = await axios.get(url, { timeout: 12000 });
                    if (res.data?.models && Array.isArray(res.data.models)) {
                        const filtered = res.data.models
                            .filter(m => {
                                const methods = m.supportedGenerationMethods || [];
                                return methods.includes('generateContent');
                            })
                            .map(m => {
                                const cleanId = (m.name || '').replace(/^models\//, '');
                                return {
                                    id: cleanId,
                                    name: m.displayName || cleanId,
                                    desc: m.description ? (m.description.length > 85 ? m.description.substring(0, 85) + '...' : m.description) : `Input: ${m.inputTokenLimit?.toLocaleString() || '1M'} tokens`,
                                    inputTokenLimit: m.inputTokenLimit
                                };
                            })
                            .filter(m => m.id && !m.id.includes('embedding') && !m.id.includes('aqa') && !m.id.includes('imagen') && !m.id.includes('text-embedding'));

                        if (filtered.length > 0) {
                            filtered.sort((a, b) => {
                                const getRank = (id) => {
                                    if (id.includes('2.5-flash')) return 100;
                                    if (id.includes('2.0-flash')) return 90;
                                    if (id.includes('1.5-flash')) return 80;
                                    if (id.includes('2.5-pro')) return 70;
                                    if (id.includes('2.0-pro')) return 60;
                                    if (id.includes('1.5-pro')) return 50;
                                    return 10;
                                };
                                return getRank(b.id) - getRank(a.id);
                            });

                            foundModels = filtered;
                            break;
                        }
                    }
                } catch (err) {
                    lastError = err.response?.data?.error?.message || err.message;
                }
            }

            if (foundModels.length > 0) {
                setAvailableModels(foundModels);
                const chosenModel = foundModels.some(m => m.id === selectedModel) ? selectedModel : foundModels[0].id;
                try {
                    localStorage.setItem('lyang_ai_available_models', JSON.stringify(foundModels));
                    // Đồng bộ lưu trực tiếp lên máy chủ POS để Backend Rust cũng cập nhật danh sách model chính thức
                    axios.post('/api/settings', {
                        gemini_available_models: JSON.stringify(foundModels.map(m => m.id)),
                        gemini_selected_model: chosenModel
                    }).catch(() => { });
                } catch (e) { }

                toast.success(`Đã cập nhật ${foundModels.length} models chính thức từ máy chủ Google AI!`);
                if (chosenModel !== selectedModel) {
                    handleSelectModel(chosenModel);
                }
            } else {
                toast.error(`Không thể lấy danh sách model: ${lastError || 'Kiểm tra lại API Key'}`);
            }
        } catch (e) {
            toast.error(`Lỗi khi fetch models: ${e.message}`);
        } finally {
            setIsFetchingModels(false);
        }
    };

    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [selectedImages, setSelectedImages] = useState([]);
    const [copiedIndex, setCopiedIndex] = useState(null);
    const [addedProducts, setAddedProducts] = useState({});
    const [isExpanded, setIsExpanded] = useState(false);
    const [isDraggingImage, setIsDraggingImage] = useState(false);
    const [productSubTabs, setProductSubTabs] = useState({});
    const [isSendingAnim, setIsSendingAnim] = useState(false);

    const popoverRef = useRef(null);
    const chatFeedRef = useRef(null);
    const chatEndRef = useRef(null);
    const latestModelMsgRef = useRef(null);
    const latestUserMsgRef = useRef(null);
    const prevMsgLengthRef = useRef(messages.length);
    const shouldScrollToAiRef = useRef(false);
    const inputRef = useRef(null);
    const fileInputRef = useRef(null);

    // Bấm ESC để đóng Popover / Settings
    useEffect(() => {
        if (!effectiveIsOpen || isStandalone) return;
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                e.stopPropagation();
                if (showSettings) {
                    setShowSettings(false);
                    return;
                }
                onClose?.();
            }
        };
        window.addEventListener('keydown', handleKeyDown, true);
        return () => window.removeEventListener('keydown', handleKeyDown, true);
    }, [effectiveIsOpen, isStandalone, onClose, showSettings]);

    const [customSize, setCustomSize] = useState(() => {
        try {
            const saved = localStorage.getItem('lyang_ai_custom_size');
            if (saved) return JSON.parse(saved);
        } catch (e) { }
        return null; // { width: number, height: number }
    });
    const isResizingRef = useRef(false);

    // Vị trí tùy chỉnh do người dùng kéo thả
    const [customPos, setCustomPos] = useState(() => {
        try {
            const saved = localStorage.getItem('lyang_ai_custom_pos');
            if (saved) return JSON.parse(saved);
        } catch (e) { }
        return null; // { x: number, y: number }
    });
    const isDraggingModalRef = useRef(false);

    // Kéo thả di chuyển khung chat trên thanh tiêu đề
    const handleHeaderDragStart = (e) => {
        if (e.button !== 0 || isStandalone) return;
        const target = e.target;
        if (target.closest('button') || target.closest('input') || target.closest('a') || target.closest('.no-drag') || target.closest('[role="button"]')) {
            return;
        }

        e.preventDefault();
        isDraggingModalRef.current = true;

        const startMouseX = e.clientX;
        const startMouseY = e.clientY;

        const currentRect = popoverRef.current?.getBoundingClientRect();
        if (!currentRect) return;

        const startModalX = currentRect.left;
        const startModalY = currentRect.top;
        const modalW = currentRect.width;
        const modalH = currentRect.height;

        const handlePointerMove = (moveEvt) => {
            if (!isDraggingModalRef.current) return;
            const deltaX = moveEvt.clientX - startMouseX;
            const deltaY = moveEvt.clientY - startMouseY;

            const winW = window.innerWidth;
            const winH = window.innerHeight;

            const newX = Math.min(Math.max(8, startModalX + deltaX), winW - modalW - 8);
            const newY = Math.min(Math.max(8, startModalY + deltaY), winH - modalH - 8);

            setCustomPos({ x: Math.round(newX), y: Math.round(newY) });
        };

        const handlePointerUp = () => {
            isDraggingModalRef.current = false;
            window.removeEventListener('pointermove', handlePointerMove);
            window.removeEventListener('pointerup', handlePointerUp);
            window.removeEventListener('pointercancel', handlePointerUp);
            setCustomPos((latest) => {
                if (latest) {
                    try {
                        localStorage.setItem('lyang_ai_custom_pos', JSON.stringify(latest));
                    } catch (e) { }
                }
                return latest;
            });
        };

        window.addEventListener('pointermove', handlePointerMove);
        window.addEventListener('pointerup', handlePointerUp);
        window.addEventListener('pointercancel', handlePointerUp);
    };

    // Đưa khung chat về lại vị trí mặc định bên cạnh Lí An
    const handleResetPosition = () => {
        setCustomPos(null);
        try {
            localStorage.removeItem('lyang_ai_custom_pos');
        } catch (e) { }
        toast.success('Đã đưa khung chat về vị trí mặc định cạnh Lí An!', {
            icon: '📍',
            duration: 2000
        });
    };

    // Xử lý kéo resize tự do (8 hướng & 4 góc)
    const handleResizeStart = (direction, e) => {
        e.preventDefault();
        e.stopPropagation();
        isResizingRef.current = true;

        const startX = e.clientX;
        const startY = e.clientY;

        const currentRect = popoverRef.current?.getBoundingClientRect();
        const startWidth = currentRect ? currentRect.width : (customSize?.width || 430);
        const startHeight = currentRect ? currentRect.height : (customSize?.height || 540);
        const startLeft = currentRect ? currentRect.left : (customPos?.x || 100);
        const startTop = currentRect ? currentRect.top : (customPos?.y || 100);

        const handleMouseMove = (moveEvent) => {
            if (!isResizingRef.current) return;
            const deltaX = moveEvent.clientX - startX;
            const deltaY = moveEvent.clientY - startY;

            let newWidth = startWidth;
            let newHeight = startHeight;
            let newLeft = startLeft;
            let newTop = startTop;

            const winW = window.innerWidth;
            const winH = window.innerHeight;

            // X-direction
            if (direction.includes('e')) {
                newWidth = startWidth + deltaX;
            } else if (direction.includes('w')) {
                newWidth = startWidth - deltaX;
                newLeft = startLeft + deltaX;
            }

            // Y-direction
            if (direction.includes('s')) {
                newHeight = startHeight + deltaY;
            } else if (direction.includes('n')) {
                newHeight = startHeight - deltaY;
                newTop = startTop + deltaY;
            }

            const clampedW = Math.min(Math.max(340, newWidth), winW - 20);
            const clampedH = Math.min(Math.max(400, newHeight), winH - 20);

            if (direction.includes('w')) {
                newLeft = startLeft + (startWidth - clampedW);
            }
            if (direction.includes('n')) {
                newTop = startTop + (startHeight - clampedH);
            }

            setCustomSize({ width: Math.round(clampedW), height: Math.round(clampedH) });
            if (direction.includes('w') || direction.includes('n')) {
                setCustomPos({ x: Math.round(newLeft), y: Math.round(newTop) });
            }
        };

        const handleMouseUp = () => {
            isResizingRef.current = false;
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
            setCustomSize((latest) => {
                if (latest) {
                    try {
                        localStorage.setItem('lyang_ai_custom_size', JSON.stringify(latest));
                    } catch (e) { }
                }
                return latest;
            });
            setCustomPos((latest) => {
                if (latest) {
                    try {
                        localStorage.setItem('lyang_ai_custom_pos', JSON.stringify(latest));
                    } catch (e) { }
                }
                return latest;
            });
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
    };

    // Reset kích thước về mặc định khi click đúp hoặc reset
    const handleResetSize = () => {
        setCustomSize(null);
        try {
            localStorage.removeItem('lyang_ai_custom_size');
        } catch (e) { }
        toast.success('Đã đặt lại kích thước tiêu chuẩn!', {
            icon: '📐',
            duration: 2000
        });
    };

    // Tính toán vị trí Popover (theo vị trí kéo thả tùy ý hoặc mặc định bám sát cạnh Mascot)
    const popoverStyle = useMemo(() => {
        if (typeof window === 'undefined') return { top: 100, left: 100, width: 440, height: 540, originX: '0%', originY: '100%', isMascotOnLeft: true };
        const winW = window.innerWidth;
        const winH = window.innerHeight;

        let baseW = customSize?.width || (isExpanded ? 640 : 430);
        let baseH = customSize?.height || (isExpanded ? 720 : 540);

        if (isExpanded && !customSize) {
            baseW = Math.min(680, winW - 24);
            baseH = Math.min(740, winH - 24);
        }

        const popW = Math.min(baseW, winW - 16);
        const popH = Math.min(baseH, winH - 16);

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
        } catch (e) { }

        let left = 8;
        let top = 12;
        let originX = '0%';
        let originY = '100%';
        let isMascotOnLeft = true;

        if (customPos) {
            // Khi người dùng đã kéo khung chat tới vị trí tùy ý
            left = Math.min(Math.max(8, customPos.x), winW - popW - 8);
            top = Math.min(Math.max(8, customPos.y), winH - popH - 8);
            isMascotOnLeft = (mX + mSize / 2) < (left + popW / 2);
            originX = isMascotOnLeft ? '0%' : '100%';
            originY = (mY + mSize / 2) < (top + popH / 2) ? '0%' : '100%';
        } else {
            // Vị trí mặc định: Tự động tính toán bám sát cạnh Bé Lyang
            if (mX + mSize / 2 < winW / 2) {
                left = mX + mSize + 12;
                if (left + popW > winW - 8) {
                    left = Math.max(8, winW - popW - 8);
                }
                originX = '0%';
                isMascotOnLeft = true;
            } else {
                left = mX - popW - 12;
                if (left < 8) {
                    left = 8;
                }
                originX = '100%';
                isMascotOnLeft = false;
            }

            const desiredBottom = mY + Math.round(mSize * 0.38);
            top = desiredBottom - popH;
            originY = '100%';

            if (top < 12) {
                top = 12;
            }
            if (top + popH > winH - 12) {
                top = Math.max(12, winH - popH - 12);
            }
        }

        return {
            left: `${Math.round(left)}px`,
            top: `${Math.round(top)}px`,
            width: `${Math.round(popW)}px`,
            height: `${Math.round(popH)}px`,
            originX,
            originY,
            isMascotOnLeft
        };
    }, [mascotPos, mascotSize, isExpanded, customSize, customPos]);

    // Tính toán vị trí 3 bong bóng suy nghĩ chibi bám theo đường nối giữa Bé Lyang và khung chat
    const bubbleConfig = useMemo(() => {
        if (isStandalone || typeof window === 'undefined') return null;

        const numLeft = parseFloat(popoverStyle.left) || 0;
        const numTop = parseFloat(popoverStyle.top) || 0;
        const numW = parseFloat(popoverStyle.width) || 430;
        const numH = parseFloat(popoverStyle.height) || 540;

        const modalRight = numLeft + numW;
        const modalBottom = numTop + numH;

        // Tọa độ mascot
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
        } catch (e) { }

        const mascotCenterX = mX + mSize * 0.5;

        // Điểm phát ngôn trên đầu/mũ Bé Lyang (hướng về phía khung chat)
        const isMascotLeftOfModal = mascotCenterX < (numLeft + numW * 0.5);
        const headTargetX = mX + (isMascotLeftOfModal ? mSize * 0.72 : mSize * 0.28);
        const headTargetY = mY + mSize * 0.30;

        // Bán kính bo góc của khung chat (rounded-3xl ~ 24px)
        const cornerR = 24;
        const minX = numLeft + cornerR;
        const maxX = modalRight - cornerR;
        const minY = numTop + cornerR;
        const maxY = modalBottom - cornerR;

        const clamp = (val, min, max) => Math.max(min, Math.min(max, val));

        let modalAnchorX, modalAnchorY;

        // Nếu mascot ở góc chéo dưới-trái (vị trí kinh điển cạnh Bé Lyang):
        if (headTargetX < minX && headTargetY > maxY) {
            modalAnchorX = numLeft + 12;
            modalAnchorY = modalBottom - 12;
        } else if (headTargetX > maxX && headTargetY > maxY) {
            modalAnchorX = modalRight - 12;
            modalAnchorY = modalBottom - 12;
        } else if (headTargetX < minX && headTargetY < minY) {
            modalAnchorX = numLeft + 12;
            modalAnchorY = numTop + 12;
        } else if (headTargetX > maxX && headTargetY < minY) {
            modalAnchorX = modalRight - 12;
            modalAnchorY = numTop + 12;
        } else {
            // Mascot ở cạnh trái, phải, trên, hoặc dưới:
            const distLeft = Math.abs(headTargetX - numLeft);
            const distRight = Math.abs(headTargetX - modalRight);
            const distTop = Math.abs(headTargetY - numTop);
            const distBottom = Math.abs(headTargetY - modalBottom);

            const minDist = Math.min(distLeft, distRight, distTop, distBottom);
            if (minDist === distLeft) {
                modalAnchorX = numLeft;
                modalAnchorY = clamp(headTargetY, minY, maxY);
            } else if (minDist === distRight) {
                modalAnchorX = modalRight;
                modalAnchorY = clamp(headTargetY, minY, maxY);
            } else if (minDist === distTop) {
                modalAnchorX = clamp(headTargetX, minX, maxX);
                modalAnchorY = numTop;
            } else {
                modalAnchorX = clamp(headTargetX, minX, maxX);
                modalAnchorY = modalBottom;
            }
        }

        const vx = headTargetX - modalAnchorX;
        const vy = headTargetY - modalAnchorY;
        const dist = Math.hypot(vx, vy);

        // Nếu khung chat đè lên mascot thì ẩn bong bóng để không che mặt
        if (dist < 18) {
            return { visible: false };
        }

        const ux = vx / dist;
        const uy = vy / dist;

        let d1, d2, d3;
        if (dist <= 85) {
            d1 = dist * 0.24;
            d2 = dist * 0.58;
            d3 = dist * 0.90;
        } else if (dist <= 180) {
            d1 = 14;
            d2 = 14 + (dist - 28) * 0.45;
            d3 = Math.min(dist - 10, 14 + (dist - 28) * 0.90);
        } else {
            d1 = 14;
            d2 = 32;
            d3 = 50;
        }

        return {
            visible: true,
            b1: { x: modalAnchorX + ux * d1, y: modalAnchorY + uy * d1 },
            b2: { x: modalAnchorX + ux * d2, y: modalAnchorY + uy * d2 },
            b3: { x: modalAnchorX + ux * d3, y: modalAnchorY + uy * d3 }
        };
    }, [isStandalone, popoverStyle, mascotPos, mascotSize]);

    // Close when clicking outside
    useEffect(() => {
        if (!effectiveIsOpen || isStandalone) return;
        const handlePointerDownOutside = (e) => {
            if (isDraggingModalRef.current || isResizingRef.current) return;
            if (popoverRef.current && !popoverRef.current.contains(e.target)) {
                const mascotEl = document.querySelector('.group.select-none');
                if (mascotEl && mascotEl.contains(e.target)) return;
                onClose?.();
            }
        };
        window.addEventListener('pointerdown', handlePointerDownOutside);
        return () => window.removeEventListener('pointerdown', handlePointerDownOutside);
    }, [effectiveIsOpen, isStandalone, onClose]);

    // Lưu tin nhắn vào LocalStorage
    useEffect(() => {
        try {
            localStorage.setItem('lyang_ai_consult_chat', JSON.stringify(messages));
        } catch (e) { }
    }, [messages]);

    // Helper cuộn chỉ bên trong khung chat (chatFeedRef) để tuyệt đối không làm trôi Header của trang
    const scrollChatToElement = (el, behavior = 'smooth') => {
        if (!chatFeedRef.current) return;
        if (!el) {
            chatFeedRef.current.scrollTo({
                top: chatFeedRef.current.scrollHeight,
                behavior
            });
            return;
        }
        try {
            const containerRect = chatFeedRef.current.getBoundingClientRect();
            const elRect = el.getBoundingClientRect();
            const currentScroll = chatFeedRef.current.scrollTop;
            const targetScroll = currentScroll + (elRect.top - containerRect.top) - 16;
            chatFeedRef.current.scrollTo({
                top: Math.max(0, targetScroll),
                behavior
            });
        } catch (e) {
            chatFeedRef.current.scrollTop = chatFeedRef.current.scrollHeight;
        }
    };

    const scrollChatToBottom = (behavior = 'smooth') => {
        if (!chatFeedRef.current) return;
        const el = chatFeedRef.current;
        // Nếu khung chat chưa bị tràn (nội dung ngắn), không cần cuộn để tránh xung đột với animation trượt
        if (el.scrollHeight <= el.clientHeight + 10) {
            return;
        }
        try {
            el.scrollTo({
                top: el.scrollHeight,
                behavior
            });
        } catch (e) {
            el.scrollTop = el.scrollHeight;
        }
    };

    // Điều khiển cuộn thông minh (chỉ cuộn bên trong khung tin nhắn):
    useEffect(() => {
        if (!effectiveIsOpen) return;

        const isNewAiMessage = shouldScrollToAiRef.current &&
            messages.length > prevMsgLengthRef.current &&
            messages[messages.length - 1]?.role === 'model';

        if (isNewAiMessage) {
            shouldScrollToAiRef.current = false;
            const timer = setTimeout(() => {
                if (latestUserMsgRef.current) {
                    scrollChatToElement(latestUserMsgRef.current, 'smooth');
                } else if (latestModelMsgRef.current) {
                    scrollChatToElement(latestModelMsgRef.current, 'smooth');
                }
            }, 60);
            prevMsgLengthRef.current = messages.length;
            return () => clearTimeout(timer);
        } else if (isLoading || (messages.length > prevMsgLengthRef.current && messages[messages.length - 1]?.role === 'user')) {
            // Đợi 480ms cho câu hỏi trượt nảy lò xo Apple iMessage hoàn tất mượt mà rồi mới cuộn nếu cần
            const timer = setTimeout(() => {
                scrollChatToBottom('smooth');
            }, 480);
            prevMsgLengthRef.current = messages.length;
            return () => clearTimeout(timer);
        } else {
            prevMsgLengthRef.current = messages.length;
        }
    }, [effectiveIsOpen, messages, isLoading]);

    // Khi mở modal lần đầu: focus ô nhập, cuộn nội bộ đến câu hỏi gần nhất nếu có (đợi hiệu ứng mở kết thúc để tránh giật lag layout)
    useEffect(() => {
        if (effectiveIsOpen) {
            const timer = setTimeout(() => {
                inputRef.current?.focus();
                if (messages.length > 1) {
                    if (latestUserMsgRef.current) {
                        scrollChatToElement(latestUserMsgRef.current, 'auto');
                    } else if (latestModelMsgRef.current) {
                        scrollChatToElement(latestModelMsgRef.current, 'auto');
                    }
                }
            }, 260);
            return () => clearTimeout(timer);
        }
    }, [effectiveIsOpen]);

    // Lắng nghe sự kiện tìm kiếm nhanh từ giỏ hàng hoặc các nơi khác
    useEffect(() => {
        const handleQuickQuery = (e) => {
            const query = e?.detail?.query;
            if (query && typeof query === 'string') {
                if (activeMode !== 'crop_doctor') {
                    handleSwitchMode('crop_doctor');
                }
                setTimeout(() => {
                    handleSend(query);
                }, 100);
            }
        };

        window.addEventListener('lyang_ai_query', handleQuickQuery);
        return () => window.removeEventListener('lyang_ai_query', handleQuickQuery);
    }, [activeMode, messages]);

    const handleClearChat = () => {
        const welcomeMsg = [
            {
                id: 'welcome',
                role: 'model',
                text: currentModeConfig.welcomeText,
                recommended_products: []
            }
        ];
        setMessages(welcomeMsg);
        try {
            localStorage.setItem(`lyang_ai_chat_${activeMode}`, JSON.stringify(welcomeMsg));
            if (activeMode === 'crop_doctor') {
                localStorage.setItem('lyang_ai_consult_chat', JSON.stringify(welcomeMsg));
            }
        } catch (e) { }
        toast.success(`Đã xóa lịch sử trò chuyện (${currentModeConfig.label})`);
    };

    const handleDeleteMessage = useCallback((idxToDelete) => {
        setMessages(prev => {
            const next = prev.filter((_, idx) => idx !== idxToDelete);
            const finalMsgs = next.length > 0 ? next : [
                {
                    id: 'welcome',
                    role: 'model',
                    text: currentModeConfig.welcomeText,
                    recommended_products: []
                }
            ];
            try {
                localStorage.setItem(`lyang_ai_chat_${activeMode}`, JSON.stringify(finalMsgs));
                if (activeMode === 'crop_doctor') {
                    localStorage.setItem('lyang_ai_consult_chat', JSON.stringify(finalMsgs));
                }
            } catch (e) { }
            return finalMsgs;
        });
        toast.success('Đã xóa tin nhắn');
    }, [activeMode, currentModeConfig.welcomeText]);

    const handleCopy = useCallback((text, idx) => {
        navigator.clipboard.writeText(text);
        setCopiedIndex(idx);
        toast.success('Đã sao chép tư vấn vào clipboard!');
        setTimeout(() => setCopiedIndex(null), 2000);
    }, []);

    const processImageFile = (file) => {
        if (!file || !file.type || !file.type.startsWith('image/')) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            const base64 = event.target.result;
            setSelectedImages(prev => {
                if (prev.length >= 4) {
                    toast.error('Chỉ được gửi tối đa 4 ảnh cho mỗi câu hỏi');
                    return prev;
                }
                toast.success('📸 Đã dán ảnh từ clipboard! Bạn có thể nhấn Gửi hoặc nhập thêm ghi chú.');
                return [...prev, base64];
            });
        };
        reader.readAsDataURL(file);
    };

    const handlePaste = (e) => {
        const clipboardData = e.clipboardData || window.clipboardData;
        if (!clipboardData) return;

        const items = clipboardData.items;
        const files = clipboardData.files;
        let hasImage = false;

        // Ưu tiên đọc từ items (DataTransferItemList)
        if (items && items.length > 0) {
            for (let i = 0; i < items.length; i++) {
                if (items[i].type && items[i].type.indexOf('image') !== -1) {
                    const file = items[i].getAsFile();
                    if (file) {
                        processImageFile(file);
                        hasImage = true;
                        break; // Chỉ lấy ảnh đầu tiên trên mỗi lần paste nếu clipboard chứa trùng lặp
                    }
                }
            }
        }

        // Nếu items không có ảnh, kiểm tra files (copy file ảnh từ folder rồi dán)
        if (!hasImage && files && files.length > 0) {
            for (let i = 0; i < files.length; i++) {
                if (files[i].type && files[i].type.startsWith('image/')) {
                    processImageFile(files[i]);
                    hasImage = true;
                    break;
                }
            }
        }

        if (hasImage) {
            e.preventDefault();
            e.stopPropagation();
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.dataTransfer && e.dataTransfer.types && Array.from(e.dataTransfer.types).includes('Files')) {
            setIsDraggingImage(true);
        }
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!popoverRef.current?.contains(e.relatedTarget)) {
            setIsDraggingImage(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDraggingImage(false);
        const files = Array.from(e.dataTransfer?.files || []);
        const imageFiles = files.filter(f => f.type && f.type.startsWith('image/'));
        if (imageFiles.length === 0) return;

        imageFiles.slice(0, 4).forEach(file => {
            processImageFile(file);
        });
    };

    const handleImageSelect = (e) => {
        const files = Array.from(e.target.files || []);
        if (!files.length) return;

        files.slice(0, 4).forEach(file => {
            processImageFile(file);
        });
        if (e.target) e.target.value = '';
    };

    const handleRemoveImage = (index) => {
        setSelectedImages(prev => prev.filter((_, i) => i !== index));
    };

    // Client-side fallback gọi Gemini trực tiếp nếu backend endpoint chưa sẵn sàng
    const callGeminiDirectClient = async ({ message, history, images, mode = 'crop_doctor' }) => {
        let apiKeys = [];

        // 1. Kiểm tra cache trong localStorage của thiết bị trước
        const localKey = (localStorage.getItem('gemini_api_key') || '').trim();
        if (localKey) {
            const parts = localKey.split(/[,;\n]/);
            parts.forEach(p => {
                const trimmed = p.trim();
                if (trimmed && !apiKeys.includes(trimmed)) apiKeys.push(trimmed);
            });
        }

        // 2. Lấy cấu hình tươi từ máy chủ POS
        try {
            let s = null;
            try {
                const settingsRes = await axios.get('/api/settings', { timeout: 3500 });
                if (settingsRes?.data) s = settingsRes.data;
            } catch (e) { }

            if (!s && typeof window !== 'undefined' && window.location?.origin) {
                try {
                    const raw = await fetch(`${window.location.origin.replace(/\/+$/, '')}/api/settings`);
                    if (raw.ok) s = await raw.json();
                } catch (e) { }
            }

            if (s) {
                ['gemini_api_key', 'gemini_api_key_2', 'gemini_api_key_3'].forEach(k => {
                    if (s[k] && typeof s[k] === 'string' && s[k].trim()) {
                        const parts = s[k].trim().split(/[,;\n]/);
                        parts.forEach(p => {
                            const trimmed = p.trim();
                            if (trimmed && !apiKeys.includes(trimmed)) {
                                apiKeys.push(trimmed);
                            }
                        });
                    }
                });
                if (s.gemini_api_key) {
                    try { localStorage.setItem('gemini_api_key', s.gemini_api_key); } catch (e) { }
                }
            }
        } catch (e) { }

        if (apiKeys.length === 0) {
            return {
                reply: '⚠️ **Chưa nhận diện được Gemini API Key từ máy chủ**.\n\n- **Nếu dùng trên máy tính POS**: Vào **Cài đặt -> Tích hợp AI (Gemini)** để lưu Key.\n- **Nếu mở trên điện thoại**: Đảm bảo điện thoại bắt **cùng mạng Wi-Fi** với máy POS để tự động dùng chung Key.',
                recommended_products: []
            };
        }

        let systemInstruction = '';
        let productList = [];

        if (mode === 'app_analytics') {
            // Lấy số liệu kinh doanh thời gian thực từ các endpoint
            let statsContext = '=== SỐ LIỆU KINH DOANH THỜI GIAN THỰC TỪ CƠ SỞ DỮ LIỆU LYANGPOS ===\n';
            try {
                const fetchTasks = [
                    axios.get('/api/dashboard-stats'),
                    axios.get('/api/products'),
                    axios.get('/api/partners')
                ];
                if (isAdmin) {
                    fetchTasks.push(axios.get('/api/reports/products?sort_by=profit&sort_order=desc'));
                }
                const [statsRes, prodRes, partnerRes, profitProdRes] = await Promise.allSettled(fetchTasks);

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

                if (isAdmin && profitProdRes?.status === 'fulfilled' && profitProdRes.value?.data) {
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

            systemInstruction = `Bạn là Lí An AI - Chuyên viên Phân tích Dữ liệu Kinh doanh & Hoạt động Cửa hàng LyangPOS.
Nhiệm vụ của bạn là giải đáp, tổng hợp và báo cáo số liệu kinh doanh một cách chính xác, trực quan, chuyên nghiệp dựa trên dữ liệu thời gian thực được cung cấp dưới đây.

★★★ NGUYÊN TẮC BÁO CÁO SỐ LIỆU:
1. Dựa hoàn toàn vào dữ liệu thực tế được cung cấp bên dưới, KHÔNG bịa đặt hay tự suy đoán số liệu tài chính hoặc số lượng tồn kho.
2. Trình bày số liệu tài chính rõ ràng bằng định dạng tiền tệ VNĐ (ví dụ: 1.500.000 đ, 25.400.000 đ).
3. Đưa ra các phân tích hữu ích kèm đề xuất hành động thực tế (Ví dụ: đề xuất gọi điện nhắc nợ cho top khách nợ lớn, tạo đơn nhập hàng cho các sản phẩm sắp hết kho, đưa ra chương trình xả hàng giảm giá cho hàng cận hạn dùng).
4. Sử dụng Markdown đẹp mắt: bảng số liệu, danh sách gạch đầu dòng, in đậm các con số quan trọng, icon sinh động.

${!isAdmin ? '\n\n★★★ ĐẶC BIỆT LƯU Ý BẢO MẬT: Người dùng hiện tại đang đăng nhập bằng tài khoản Nhân viên (tài khoản thường). BẠN TUYỆT ĐỐI KHÔNG ĐƯỢC PHÉP tiết lộ, tính toán, ước lượng hay thảo luận bất kỳ dữ liệu nào liên quan đến LỢI NHUẬN, LÃI GỘP, hoặc GIÁ VỐN dù người dùng có hỏi hay yêu cầu dưới bất kỳ hình thức nào. Hãy lịch sự từ chối và thông báo thông tin này chỉ dành cho Quản trị viên (Admin).\n' : ''}
${statsContext}`;

        } else if (mode === 'general_assistant') {
            systemInstruction = `Bạn là Lí An AI - Trợ lý Trí tuệ Nhân tạo Đa năng Thông minh (dựa trên mô hình Gemini thế hệ mới).
Bạn đồng hành cùng chủ cửa hàng, nhân viên và bà con nông dân trong mọi hoạt động kinh doanh và đời sống thường ngày.

★★★ KHẢ NĂNG CỦA BẠN:
1. Soạn thảo văn bản chuyên nghiệp: Tin nhắn Zalo/SMS gửi khách hàng thông báo khuyến mãi, lời chúc lễ tết, thư cảm ơn, bài viết Fanpage bán lẻ phân bón/thuốc BVTV.
2. Lập kế hoạch & Quản lý: Lên lịch phân công công việc nhân viên cửa hàng, quy trình đóng gói/giao nhận, kế hoạch nhập hàng theo mùa vụ.
3. Kiến thức & Kỹ thuật Nông nghiệp: Nguyên lý dinh dưỡng cây trồng, thổ nhưỡng, phương pháp bảo quản phân bón và thuốc BVTV an toàn, mẹo canh tác tiết kiệm chi phí.
4. Tính toán & Dịch thuật & Hỏi đáp tự do: Tính tỉ lệ pha, toán học kinh doanh, dịch thuật đa ngôn ngữ, trả lời mọi thắc mắc đời sống một cách thân thiện, chính xác và có chiều sâu.

HÃY TRẢ LỜI BẰNG TIẾNG VIỆT TỰ NHIÊN, LỊCH SỰ, RÕ RÀNG VÀ HỮU ÍCH NHẤT CÓ THỂ. Sử dụng Markdown linh hoạt (tiêu đề, gạch đầu dòng, highlight số liệu/nội dung quan trọng).`;

        } else {
            // mode === 'crop_doctor'
            let productKB = 'DANH MỤC TOÀN BỘ SẢN PHẨM & HOẠT CHẤT TRONG KHO CỬA HÀNG:\n';
            let allUniqueActives = [];
            const groupMap = {};

            try {
                let prodData = null;
                try {
                    const prodRes = await axios.get('/api/products', { timeout: 4000 });
                    if (prodRes?.data) prodData = prodRes.data;
                } catch (e) { }

                if (!prodData && typeof window !== 'undefined' && window.location?.origin) {
                    try {
                        const raw = await fetch(`${window.location.origin.replace(/\/+$/, '')}/api/products`);
                        if (raw.ok) prodData = await raw.json();
                    } catch (e) { }
                }

                productList = Array.isArray(prodData) ? prodData : (prodData?.data || []);
                let activeGroupsSummary = '(Kho chưa có dữ liệu hoạt chất chi tiết)\n';
                let allStr = '(Chưa có dữ liệu hoạt chất trong kho)';

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
                                const info = classifyActiveIngredient(clean);
                                if (!groupMap[info.groupId]) {
                                    groupMap[info.groupId] = {
                                        info,
                                        actives: [],
                                        products: []
                                    };
                                }
                                if (!groupMap[info.groupId].actives.some(x => x.toLowerCase() === clean.toLowerCase())) {
                                    groupMap[info.groupId].actives.push(clean);
                                }
                                const prodDesc = `${p.name} [Hoạt chất: ${clean} | Tồn: ${p.stock || 0}${p.unit || ''}]`;
                                if (!groupMap[info.groupId].products.includes(prodDesc) && groupMap[info.groupId].products.length < 8) {
                                    groupMap[info.groupId].products.push(prodDesc);
                                }
                            });
                        }
                    });

                    const groupKeys = Object.keys(groupMap).sort();
                    if (groupKeys.length > 0) {
                        activeGroupsSummary = '';
                        groupKeys.forEach(k => {
                            const grp = groupMap[k];
                            activeGroupsSummary += `▶ [${grp.info.groupName}] (Vai trò: ${grp.info.roleType}):\n  - Hoạt chất có trong kho: ${grp.actives.join(', ')}\n  - Cơ chế & Công dụng: ${grp.info.moaDesc}\n  - Sản phẩm đại diện trong kho: ${grp.products.join('; ')}\n\n`;
                        });
                    }

                    if (allUniqueActives.length > 0) {
                        allStr = allUniqueActives.join(', ');
                    }

                    productList.slice(0, 500).forEach(p => {
                        const active = p.active_ingredient || 'Chưa có';
                        const unit = p.unit || '';
                        const price = p.sale_price || 0;
                        const stock = p.stock || 0;
                        const info = p.active_ingredient ? classifyActiveIngredient(p.active_ingredient) : null;
                        const tag = info ? (info.isAdvanced ? `[🌟 THẾ HỆ MỚI / ĐẶC TRỊ: ${info.roleType}]` : `[🌾 PHỔ THÔNG: ${info.roleType}]`) : '[CHƯA RÕ HOẠT CHẤT]';
                        productKB += `- [ID:${p.id}] Tên: ${p.name} | Hoạt chất: ${active} | ĐVT: ${unit} | Giá: ${price}đ | Tồn: ${stock} | Phân loại: ${tag}\n`;
                    });
                }

                systemInstruction = `Bạn là Lí An AI - Chuyên gia Bác sĩ Cây trồng & Dược học Nông nghiệp cao cấp (Plant Protection & Agronomy Expert) của cửa hàng LyangPOS.

★★★ NGUYÊN TẮC BẮT BUỘC SỐ 1: RÀ SOÁT TOÀN DIỆN MỌI HOẠT CHẤT TRONG KHO (KHÔNG ĐƯỢC BỎ SÓT)
Người dùng yêu cầu bạn phải rà soát TOÀN BỘ danh mục hoạt chất trong kho của cửa hàng, phải biết rõ từng hoạt chất có công dụng và cơ chế gì rồi tư vấn ĐẦY ĐỦ các hoạt chất phù hợp, TUYỆT ĐỐI KHÔNG ĐƯỢC CHỈ lặp đi lặp lại những hoạt chất phổ biến quen thuộc (như chỉ chăm chăm nói Mancozeb, Difenoconazole, Abamectin...).
- Khi người dùng hỏi về bất kỳ đối tượng sâu bệnh, nấm khuẩn, côn trùng hay chăm sóc cây nào:
  1. Bạn PHẢI đối chiếu với "BẢNG TỔNG HỢP HOẠT CHẤT THEO DƯỢC HỌC" và danh mục sản phẩm kho phía dưới.
  2. Liệt kê và phân tích công dụng của TẤT CẢ các hoạt chất trong kho có hiệu lực đối với đối tượng này (gồm cả hoạt chất công nghệ mới, hoạt chất chuyên biệt, hoạt chất phối hợp và hoạt chất phổ thông).
  3. Nêu rõ cơ chế tác động (MOA) của từng hoạt chất: tác động lên đâu (ức chế enzyme hô hấp tế bào nấm, phong bế thần kinh trung ương, ức chế lột xác ung trứng, phá vỡ vách tế bào vi khuẩn...), tính năng nổi trội (tính mát êm bông, lưu dẫn 2 chiều, tiếp xúc bám dính chống rửa trôi...).

★★★ NGUYÊN TẮC BẮT BUỘC SỐ 2: CHIẾN LƯỢC PHỐI TRỘN THUỐC TĂNG LỰC TỐI ƯU (TANK-MIX SYNERGY)
Bạn PHẢI biết cách phối trộn các sản phẩm thực tế trong kho lại với nhau để tạo thành "BỘ PHỐI ĐÒN KÉP TĂNG LỰC" giúp tăng vọt hiệu quả dập dịch, bẻ gãy tính lờn thuốc và bảo vệ cây trồng toàn diện:
1. CÁC NGUYÊN TẮC PHỐI TRỘN KHOA HỌC:
   - Phối Tiếp xúc + Nội hấp/Lưu dẫn: Thuốc tiếp xúc (Mancozeb, Propineb, Chlorothalonil...) làm lớp áo giáp ngoài + Thuốc nội hấp (SDHI, Triazole, Strobilurin...) thấm sâu vào trong mô tiêu diệt tận gốc mầm bệnh.
   - Phối Nấm + Vi khuẩn: Khi vết bệnh thối nhũn, loét cành, thán thư có mùi chua/hôi hoặc sau mưa bão dập nát: Phối thuốc nấm + thuốc khuẩn (Kasugamycin, Streptomycin, Ningnanmycin, Bismerthiazol).
   - Phối Đánh nhanh (Hạ gục) + Đánh dai (Lưu dẫn / Ức chế lột xác ung trứng): Trị sâu keo, sâu đục thân, bọ trĩ, rầy rệp: Phối hoạt chất hạ gục nhanh (Spinetoram, Chlorfenapyr, Emamectin) + hoạt chất lưu dẫn dài ngày hoặc ức chế lột xác diệt trứng (Lufenuron, Buprofezin, Thiamethoxam, Movento) để cắt đứt lứa sau, ngăn tái bùng phát.
   - Phối 2 Cơ chế tác động (MOA) khác nhau: Tuyệt đối không phối 2 hoạt chất cùng 1 phân nhóm cơ chế (tránh sốc cây và lãng phí); luôn phối 2 cơ chế khác nhau để bẻ gãy tính lờn thuốc.
   - Phối Thuốc BVTV + Dầu khoáng / Chất trợ lực loang trải: Giúp thuốc thấm sâu xuyên qua lớp sáp phấn của rầy rệp, tăng độ bám dính chống mưa rửa trôi.
2. THỨ TỰ HÒA TAN CHUẨN VÀO BÌNH / PHUY (Quy tắc W-S-S-E-A):
   - Bước 1: Cho nước vào 1/2 bình hoặc phuy.
   - Bước 2: Cho dạng Bột hòa tan / thấm nước trước (WP, WG, WDG, DF) - khuấy tan đều.
   - Bước 3: Cho dạng Huyền phù / Nước (SC, SL, FS, OD) - khuấy đều.
   - Bước 4: Cho dạng Nhũ dầu (EC, EW, ME) - cho sau cùng vì dung môi dầu dễ làm vón cục dạng bột nếu cho trước.
   - Bước 5: Cho Phân bón lá / Chất bám dính / Trợ lực (nếu có).
   - Bước 6: Châm thêm nước cho đủ thể tích và khuấy đều, phun ngay không để lưu cữu.
3. CẢNH BÁO TƯƠNG KỴ:
   - Không pha chung thuốc có tính kiềm mạnh (vôi, Booc-đô, Đồng nguyên chất) với thuốc vi sinh hoặc thuốc gốc lân, cúc.
   - Chú ý liều lượng phối hợp, không tự ý tăng liều gấp đôi nếu chưa kiểm nghiệm để tránh làm nám da trái hoặc cháy đọt non.

★★★ NGUYÊN TẮC BẮT BUỘC SỐ 4: QUY CHUẨN TRÌNH BÀY TRỰC QUAN & VIẾT TÊN THUỐC
1. BẮT BUỘC MỌI TÊN THUỐC PHẢI ĐƯỢC VIẾT ĐẬM KÈM TÊN HOẠT CHẤT TRONG NGOẶC ĐƠN theo định dạng:
   **Tên Thuốc** *(Tên hoạt chất)*
   - Ví dụ chuẩn: **RADIANT 60SC** *(Spinetoram)*, **LUFEN 150WG** *(Lufenuron)*, **VISILON 2.5ML** *(Polyether modified silicone)*.
   - Tuyệt đối không viết trơ trọi mỗi tên thương mại hoặc mỗi tên hoạt chất. Phải luôn viết cặp: **Tên Thuốc** *(Tên hoạt chất)* để người bán và nông dân nhìn vào là hiểu ngay loại thuốc và thành phần!
2. NGUYÊN TẮC TRÌNH BÀY GỌN GÀNG, SẠCH ĐẸP, KHÔNG LỘN XỘN:
   - TUYỆT ĐỐI KHÔNG DÙNG DẤU TRÍCH DẪN BLOCKQUOTE (`> `) Ở ĐẦU CÂU.
   - TUYỆT ĐỐI KHÔNG VIẾT CÁC DÒNG RỜI RẠC NHƯ `> +` HOẶC DÒNG CHỈ CÓ MỖI DẤU CỘNG.
   - Trình bày dạng danh sách gạch đầu dòng rõ ràng, mạch lạc, dễ đọc.
   - Bảng phác đồ phối trộn phải ghi rõ liều lượng cho bình 25L và phuy 200L.
   - Thứ tự pha thuốc phải đánh số rõ ràng theo từng bước 1, 2, 3, 4.

---
### CẤU TRÚC BÀI TƯ VẤN TRỰC QUAN BẮT BUỘC (TUÂN THỦ CHÍNH XÁC):

### CHẨN ĐOÁN & ĐẶC TÍNH GÂY HẠI
- **Đối tượng hại**: Tên sâu/bệnh & tác nhân gây hại (nấm, vi khuẩn, chích hút, ăn lá...).
- **Đặc tính nguy hiểm**: Cơ chế phá hoại, tốc độ lây lan, khả năng kháng thuốc cần lưu ý.

### RÀ SOÁT HOẠT CHẤT CÓ TRONG KHO & LỰA CHỌN TƯƠNG THÍCH
(Điểm danh tất cả hoạt chất kho đang có dùng được cho đối tượng này, viết rõ: **Tên Thuốc** *(Hoạt chất)*):
- **Nhóm thế hệ mới / Đặc trị**: **Tên Thuốc A** *(Hoạt chất A)* - Cơ chế tác động & ưu thế vượt trội (ví dụ: bẻ gãy tính kháng, lưu dẫn 2 chiều, mát bông).
- **Nhóm hạ gục nhanh / Tiếp xúc**: **Tên Thuốc B** *(Hoạt chất B)* - Cơ chế tiếp xúc vị độc, hạ gục tức thì.
- **Nhóm bảo vệ / Ức chế lột xác**: **Tên Thuốc C** *(Hoạt chất C)* - Diệt trứng, cắt đứt vòng đời, chống tái phát.

### BỘ PHỐI ĐÒN KÉP TĂNG LỰC (TANK-MIX TẠI KHO)
- **Công thức phối**: **Tên Thuốc 1** *(Hoạt chất 1)* + **Tên Thuốc 2** *(Hoạt chất 2)* (+ **Trợ lực** *(Hoạt chất)* nếu có)
- **Vì sao lại phối các thuốc này?**: Phân tích ngắn gọn cơ chế cộng hưởng tăng lực (ví dụ: Thuốc 1 đánh nhanh hạ gục + Thuốc 2 ngấm sâu diệt trứng lưu dẫn dài ngày).
- **Liều pha phối hợp cụ thể**:
  + **Bình 25 Lít**: Pha liều từng thuốc (ví dụ: 15ml **Tên Thuốc 1** + 15g **Tên Thuốc 2** + 2.5ml **Trợ lực**).
  + **Phuy 200 Lít**: Pha liều từng thuốc (ví dụ: 1 chai **Tên Thuốc 1** + 1 gói **Tên Thuốc 2** + 1 chai **Trợ lực**).

### THỨ TỰ HÒA TAN CHUẨN VÀO BÌNH (Quy tắc W-S-S-E-A)
1. Đổ nước sạch vào 1/2 bình hoặc phuy.
2. Thuốc dạng Bột (WP, WG, WDG) khuấy tan hoàn toàn trước.
3. Thuốc dạng Huyền phù / Nước (SC, SL, FS, OD) đổ vào khuấy đều.
4. Thuốc dạng Nhũ dầu (EC, EW, ME) cho vào sau cùng.
5. Thêm chất bám dính / trợ lực (nếu có), châm đủ nước và phun ngay.

### LƯU Ý KỸ THUẬT & CẢNH BÁO TƯƠNG KỴ
- Thời điểm phun thích hợp (sáng sớm / chiều mát).
- Cảnh báo an toàn (không phối với phân bón lá có đạm cao khi đang có bệnh, không pha thuốc có tính kiềm mạnh...).
- Cữ phun kế tiếp (sau 5-7 ngày) nên luân chuyển sang **Tên Thuốc Khác** *(Hoạt chất khác)* để chống lờn thuốc.

---
### 📦 DỮ LIỆU ĐỐI CHIẾU TRONG KHO CỬA HÀNG:

🌟 **TỔNG HỢP CÁC NHÓM HOẠT CHẤT TRONG KHO THEO CƠ CHẾ DƯỢC HỌC**:
${activeGroupsSummary}

📚 **TOÀN BỘ HOẠT CHẤT CÓ TRONG KHO**:
${allStr}

${productKB}

QUY TẮC BẮT BUỘC VỀ DỮ LIỆU ĐỀ XUẤT (JSON BLOCK):
Ở CUỐI CÙNG CỦA CÂU TRẢ LỜI, nếu câu hỏi về tư vấn thuốc/bệnh, bạn BẮT BUỘC phải đối chiếu và ĐỀ XUẤT RA TẤT CẢ CÁC SẢN PHẨM PHÙ HỢP CÓ TRONG KHO (gồm cả bộ phối tăng lực khuyên dùng, các lựa chọn hoạt chất tương thích sẵn có, và sản phẩm luân phiên), TUYỆT ĐỐI KHÔNG ĐƯỢC GIỚI HẠN 2-6 SẢN PHẨM, KHÔNG ĐƯỢC BỎ SÓT THUỐC NÀO để xuất ra khối JSON code block theo đúng mẫu sau:
\`\`\`recommended_products
[
  {
    "id": 123,
    "name": "Tên sản phẩm A đúng theo kho",
    "active_ingredient": "Hoạt chất của sản phẩm A",
    "dosage": "Phối trộn: 20-25ml/bình 25L (hoặc 1 chai/phuy 200L)",
    "tier": "⚡ Bộ phối tăng lực: Đòn hạ gục",
    "sale_price": 185000,
    "unit": "Chai",
    "stock": 15
  },
  {
    "id": 456,
    "name": "Tên sản phẩm B đúng theo kho",
    "active_ingredient": "Hoạt chất của sản phẩm B",
    "dosage": "Phối trộn: 30g/bình 25L (hoặc 1 gói/phuy 200L)",
    "tier": "🛡️ Bộ phối tăng lực: Lưu dẫn kéo dài",
    "sale_price": 95000,
    "unit": "Gói",
    "stock": 30
  }
]
\`\`\`
Nếu không có sản phẩm phù hợp trong kho, xuất:
\`\`\`recommended_products
[]
\`\`\``;
            } catch (e) {
                productKB += '(Không thể đọc danh mục sản phẩm từ server)\n';
            }
        }

        const safeSystemInstruction = (typeof systemInstruction === 'string' && systemInstruction.trim().length > 0)
            ? systemInstruction.trim()
            : (mode === 'crop_doctor'
                ? 'Bạn là Lí An AI - Chuyên gia Bác sĩ Cây trồng & Dược học Nông nghiệp cao cấp (Plant Protection & Agronomy Expert) của cửa hàng LyangPOS. Hãy hỗ trợ tư vấn chi tiết về chẩn đoán sâu bệnh, giải pháp phòng trị, cơ chế tác động và danh mục thuốc BVTV tối ưu.'
                : (mode === 'app_analytics'
                    ? 'Bạn là Lí An AI - Chuyên viên Phân tích Dữ liệu Kinh doanh & Hoạt động Cửa hàng LyangPOS.'
                    : 'Bạn là Lí An AI - Trợ lý Trí tuệ Nhân tạo Đa năng Thông minh của LyangPOS.'));

        const contents = [];
        if (history && Array.isArray(history)) {
            history.forEach(h => {
                if (h && h.text) {
                    contents.push({
                        role: h.role === 'user' ? 'user' : 'model',
                        parts: [{ text: String(h.text) }]
                    });
                }
            });
        }

        const userPrompt = (typeof message === 'string' && message.trim().length > 0)
            ? message.trim()
            : (images && images.length > 0
                ? (mode === 'crop_doctor'
                    ? 'Chẩn đoán giúp tôi hình ảnh này cây đang bị bệnh gì, sâu hại gì và tư vấn phác đồ xử lý, bộ thuốc phối trộn đặc trị có trong kho cửa hàng nhé!'
                    : 'Phân tích và cho tôi biết thông tin chi tiết về hình ảnh này nhé!')
                : 'Xin chào Lí An AI');

        const userParts = [{ text: userPrompt }];
        if (images && images.length > 0) {
            images.forEach(dataUrl => {
                if (dataUrl && typeof dataUrl === 'string') {
                    const idx = dataUrl.indexOf(';base64,');
                    const mime = idx !== -1 ? dataUrl.substring(5, idx) : 'image/jpeg';
                    const rawB64 = idx !== -1 ? dataUrl.substring(idx + 8) : dataUrl;
                    const cleanB64 = rawB64.replace(/\s+/g, '');
                    if (cleanB64) {
                        userParts.push({
                            inlineData: {
                                mimeType: mime || 'image/jpeg',
                                data: cleanB64
                            }
                        });
                    }
                }
            });
        }
        contents.push({ role: 'user', parts: userParts });

        const requestBody = {
            systemInstruction: { parts: [{ text: safeSystemInstruction }] },
            contents: contents,
            generationConfig: {
                temperature: mode === 'crop_doctor' ? 0.4 : (mode === 'app_analytics' ? 0.2 : 0.6),
                maxOutputTokens: 65536
            }
        };

        let dynamicModelList = [];
        if (Array.isArray(availableModels) && availableModels.length > 0) {
            dynamicModelList = availableModels.map(m => (typeof m === 'string' ? m : m.id)).filter(Boolean);
        }
        if (dynamicModelList.length === 0) {
            try {
                const saved = JSON.parse(localStorage.getItem('lyang_ai_available_models') || '[]');
                if (Array.isArray(saved) && saved.length > 0) {
                    dynamicModelList = saved.map(m => (typeof m === 'string' ? m : m.id)).filter(Boolean);
                }
            } catch (e) { }
        }
        if (dynamicModelList.length === 0 && s?.gemini_available_models) {
            try {
                const sModels = typeof s.gemini_available_models === 'string'
                    ? JSON.parse(s.gemini_available_models)
                    : s.gemini_available_models;
                if (Array.isArray(sModels)) {
                    dynamicModelList = sModels.map(m => (typeof m === 'string' ? m : m.id)).filter(Boolean);
                }
            } catch (e) { }
        }

        const activeChoice = selectedModel || dynamicModelList[0] || 'gemini-2.5-flash';
        const models = [
            activeChoice,
            ...dynamicModelList.filter(m => m !== activeChoice)
        ];
        if (models.length === 1 && !dynamicModelList.includes(activeChoice)) {
            models.push('gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash');
        }
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
                    } catch (e) { }
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
                    } catch (e) { }
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
                            tier: '🌾 Thuốc có sẵn trong kho',
                            sale_price: p.sale_price || 0,
                            unit: p.unit || '',
                            stock: p.stock || 0
                        });
                    }
                }
            }
        }

        return {
            reply: cleanReply,
            recommended_products
        };
    };

    const handleSend = useCallback(async (queryText = null) => {
        const defaultImagePrompt = activeMode === 'crop_doctor'
            ? 'Chẩn đoán giúp tôi hình ảnh này cây đang bị bệnh gì, sâu hại gì và tư vấn phác đồ xử lý, bộ thuốc phối trộn đặc trị có trong kho cửa hàng nhé!'
            : 'Phân tích và cho tôi biết thông tin chi tiết về hình ảnh này nhé!';

        const textToSend = (queryText || input).trim() || (selectedImages.length > 0 ? defaultImagePrompt : '');
        if ((!textToSend && selectedImages.length === 0) || isLoading) return;

        // Kích hoạt hiệu ứng phóng tên lửa / bay nút gửi
        setIsSendingAnim(true);
        setTimeout(() => setIsSendingAnim(false), 550);

        // Mascot lắng nghe câu hỏi (chớp mắt tập trung)
        try {
            window.dispatchEvent(new CustomEvent('lyang_mascot_react', {
                detail: { reaction: 'blink', duration: 1200 }
            }));
        } catch (e) { }

        const userMsg = {
            id: Date.now().toString(),
            role: 'user',
            text: textToSend,
            images: selectedImages.length > 0 ? [...selectedImages] : undefined
        };

        const isFirstQuestion = messages.length === 1 && messages[0].id === 'welcome';
        const newMessages = [...messages.filter(m => m.id !== 'welcome'), userMsg];
        if (isFirstQuestion && chatFeedRef.current) {
            chatFeedRef.current.scrollTop = 0;
        }
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
                    mode: activeMode,
                    model: selectedModel || 'gemini-2.5-flash'
                }, { timeout: 25000 });

                if (response.data && typeof response.data === 'object' && response.data.reply && !response.data.error) {
                    result = response.data;
                }
            } catch (e) { }

            // 2. Fallback gọi trực tiếp Gemini API nếu backend chưa có hoặc lỗi
            if (!result || !result.reply || result.error) {
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

            // Mascot vui mừng / lấp lánh khi trả lời xong
            try {
                window.dispatchEvent(new CustomEvent('lyang_mascot_react', {
                    detail: { reaction: 'delighted', duration: 1600 }
                }));
            } catch (e) { }
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
    }, [activeMode, input, selectedImages, isLoading, messages]);

    const handleAddToCartClick = useCallback((prod) => {
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
                    try { cartList = JSON.parse(currentCartStr); } catch (e) { }
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
            } catch (err) { }
        }
        setAddedProducts(prev => ({ ...prev, [prod.id]: true }));
        toast.success(`Đã thêm "${prod.name}" vào đơn hàng!`);
        setTimeout(() => {
            setAddedProducts(prev => ({ ...prev, [prod.id]: false }));
        }, 1800);
    }, [onAddToCart]);

    const handleAddAllToCart = useCallback((productsList) => {
        if (!Array.isArray(productsList) || productsList.length === 0) return;
        const available = productsList.filter(p => (p.stock || 0) > 0);
        if (available.length === 0) {
            toast.error('Các sản phẩm được đề xuất hiện đều đã tạm hết hàng');
            return;
        }
        available.forEach(p => {
            handleAddToCartClick(p);
        });
        toast.success(`Đã thêm tất cả ${available.length} thuốc còn hàng vào đơn hàng POS!`);
    }, [handleAddToCartClick]);

    const renderFormattedText = useCallback((text) => {
        return renderFormattedMarkdown(text, fontSize);
    }, [fontSize]);

    const handleSubTabChange = useCallback((msgId, tab) => {
        setProductSubTabs(prev => ({ ...prev, [msgId]: tab }));
    }, []);

    const latestUserIdx = useMemo(() => {
        for (let i = messages.length - 1; i >= 0; i--) {
            if (messages[i].role === 'user') return i;
        }
        return -1;
    }, [messages]);

    const latestModelIdx = useMemo(() => {
        for (let i = messages.length - 1; i >= 0; i--) {
            if (messages[i].role === 'model') return i;
        }
        return -1;
    }, [messages]);

    const isInitialWelcome = useMemo(() => {
        return messages.length === 1 && messages[0].id === 'welcome';
    }, [messages]);

    return (
        <AnimatePresence>
            {/* Chibi Manga Speech Connector Bubbles - Tự động tính vector nối chuẩn từ Bé Lyang đến khung chat */}
            {effectiveIsOpen && !isStandalone && bubbleConfig && bubbleConfig.visible && (
                <m.div
                    key="ai-consultant-speech-bubbles"
                    initial={{ opacity: 0, scale: 0.6 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.6 }}
                    transition={{ duration: 0.15, ease: "easeOut" }}
                    className="pointer-events-none fixed inset-0 z-[100005]"
                >
                    {/* Bubble 1 (Nearest to modal edge, largest) */}
                    <div
                        className="absolute rounded-full shadow-md border border-stone-200/50 dark:border-white/10"
                        style={{
                            width: '14px',
                            height: '14px',
                            left: `${Math.round(bubbleConfig.b1.x - 7)}px`,
                            top: `${Math.round(bubbleConfig.b1.y - 7)}px`,
                            backgroundColor: isDark ? currentThemeConfig.bubbleDark : currentThemeConfig.bubbleLight
                        }}
                    />
                    {/* Bubble 2 (Mid-way) */}
                    <div
                        className="absolute rounded-full shadow-xs border border-stone-200/50 dark:border-white/10"
                        style={{
                            width: '10px',
                            height: '10px',
                            left: `${Math.round(bubbleConfig.b2.x - 5)}px`,
                            top: `${Math.round(bubbleConfig.b2.y - 5)}px`,
                            backgroundColor: isDark ? currentThemeConfig.bubbleDark : currentThemeConfig.bubbleLight
                        }}
                    />
                    {/* Bubble 3 (Nearest to Bé Lyang's cheek/hat, smallest) */}
                    <div
                        className="absolute rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 shadow-xs"
                        style={{
                            width: '7px',
                            height: '7px',
                            left: `${Math.round(bubbleConfig.b3.x - 3.5)}px`,
                            top: `${Math.round(bubbleConfig.b3.y - 3.5)}px`,
                        }}
                    />
                </m.div>
            )}

            {effectiveIsOpen && (
                <m.div
                    ref={popoverRef}
                    key={isStandalone ? "ai-consultant-standalone" : "ai-consultant-popover"}
                    initial={isStandalone ? { opacity: 0 } : {
                        opacity: 0,
                        scale: 0.92,
                        y: 10
                    }}
                    animate={isStandalone ? { opacity: 1 } : {
                        opacity: 1,
                        scale: 1,
                        y: 0
                    }}
                    exit={isStandalone ? { opacity: 0 } : {
                        opacity: 0,
                        scale: 0.95,
                        y: 8,
                        transition: {
                            duration: 0.16,
                            ease: [0.32, 0, 0.67, 0]
                        }
                    }}
                    transition={isStandalone ? { duration: 0.15 } : {
                        type: "spring",
                        stiffness: 400,
                        damping: 28,
                        mass: 0.75
                    }}
                    style={isStandalone ? {
                        position: 'relative',
                        width: '100%',
                        height: '100%',
                        '--ai-font-size': `${fontSize}px`
                    } : {
                        position: 'fixed',
                        left: popoverStyle.left,
                        top: popoverStyle.top,
                        width: popoverStyle.width,
                        height: popoverStyle.height,
                        zIndex: 100000,
                        transformOrigin: `${popoverStyle.originX} ${popoverStyle.originY}`,
                        willChange: 'transform, opacity',
                        backfaceVisibility: 'hidden',
                        WebkitBackfaceVisibility: 'hidden',
                        '--ai-font-size': `${fontSize}px`
                    }}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onPaste={handlePaste}
                    className={isStandalone ? "w-full h-full min-h-0 flex-1 flex flex-col overflow-hidden relative select-none" : "relative select-none"}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Main Modal Card Container - Màu sắc tùy chỉnh theo Settings, đậm đặc hoàn toàn */}
                    <div
                        className={isStandalone ? "w-full h-full min-h-0 flex-1 flex flex-col overflow-hidden" : "w-full h-full text-stone-800 dark:text-stone-100 rounded-3xl shadow-[0_25px_65px_-12px_rgba(0,0,0,0.28),0_4px_16px_-2px_rgba(0,0,0,0.08)] flex flex-col overflow-hidden relative"}
                        style={{
                            backgroundColor: isTransparentBg ? 'transparent' : (isDark ? currentThemeConfig.darkBg : currentThemeConfig.lightBg)
                        }}
                    >

                        {/* Drag & Drop Visual Overlay */}
                        {isDraggingImage && (
                            <div className="absolute inset-0 z-[200] bg-emerald-950/85 backdrop-blur-md border-3 border-dashed border-emerald-400 rounded-3xl flex flex-col items-center justify-center p-6 text-white text-center pointer-events-none transition-all">
                                <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-400/50 flex items-center justify-center text-emerald-300 mb-3 shadow-lg shadow-emerald-500/20">
                                    <ImageIcon size={32} />
                                </div>
                                <h4 className="text-base font-black uppercase tracking-wider text-emerald-300">Thả ảnh cây trồng vào đây</h4>
                                <p className="text-xs text-emerald-100/90 mt-1 max-w-[280px]">Lí An AI sẽ chẩn đoán triệu chứng sâu bệnh & kê đơn thuốc từ kho ngay lập tức</p>
                            </div>
                        )}

                        {/* Settings Popover Panel - Đặt ở tầng cao nhất của Modal, z-[250] với AnimatePresence để đóng/mở mượt mà */}
                        <AnimatePresence>
                            {showSettings && (
                                <m.div
                                    ref={settingsPanelRef}
                                    onDoubleClick={(e) => e.stopPropagation()}
                                    onPointerDown={(e) => e.stopPropagation()}
                                    initial={{ opacity: 0, scale: 0.92, y: -10 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.94, y: -8 }}
                                    transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                                    className={cn(
                                        "absolute top-[58px] sm:top-[62px] right-3 sm:right-4 w-[calc(100%-24px)] sm:w-96 max-w-[390px] max-h-[calc(100%-76px)] rounded-2xl bg-white dark:bg-[#0c1813] shadow-2xl p-3.5 text-stone-800 dark:text-stone-100 z-[250] flex flex-col ring-1 ring-black/10 dark:ring-white/10 border border-stone-200/50 dark:border-white/10",
                                        isStandalone ? "sm:right-[max(1rem,calc((100%-56rem)/2+1rem))]" : ""
                                    )}
                                >
                                    {/* Header */}
                                    <div className="flex items-center justify-between pb-2.5 border-b border-stone-200/60 dark:border-white/10 shrink-0">
                                        <div className="flex items-center gap-2">
                                            <div className="w-7 h-7 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                                                <Settings size={14} />
                                            </div>
                                            <h4 className="font-extrabold text-sm tracking-tight">Cài Đặt Lí An AI</h4>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setShowSettings(false)}
                                            className="w-6 h-6 rounded-lg hover:bg-stone-100 dark:hover:bg-white/10 flex items-center justify-center text-stone-400 hover:text-stone-700 dark:hover:text-white transition-colors cursor-pointer"
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>

                                    <div className="space-y-3.5 pt-3 overflow-y-auto custom-scrollbar pr-1 flex-1">
                                        {/* 1. Giao diện & Hiển thị */}
                                        <div className="space-y-2">
                                            <span className="text-[10px] font-black uppercase tracking-wider text-stone-400 dark:text-stone-500">
                                                Giao diện & Cỡ chữ
                                            </span>

                                            {/* Chế độ Sáng / Tối */}
                                            <div className="flex items-center justify-between p-2 rounded-xl bg-stone-50 dark:bg-white/5 border border-stone-200/60 dark:border-white/5">
                                                <div className="flex items-center gap-2">
                                                    {isDark ? <Moon size={15} className="text-amber-400" /> : <Sun size={15} className="text-amber-500" />}
                                                    <span className="text-xs font-bold">{isDark ? 'Chế độ Tối' : 'Chế độ Sáng'}</span>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={handleToggleDark}
                                                    className={cn(
                                                        "px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer",
                                                        isDark
                                                            ? "bg-amber-400/20 text-amber-300 border border-amber-400/30 hover:bg-amber-400/30"
                                                            : "bg-stone-200 text-stone-700 hover:bg-stone-300"
                                                    )}
                                                >
                                                    {isDark ? '☀️ Bật Sáng' : '🌙 Bật Tối'}
                                                </button>
                                            </div>

                                            {/* Cỡ chữ */}
                                            <div className="flex items-center justify-between p-2 rounded-xl bg-stone-50 dark:bg-white/5 border border-stone-200/60 dark:border-white/5">
                                                <div>
                                                    <span className="text-xs font-bold block">Cỡ chữ văn bản</span>
                                                    <span className="text-[10px] text-stone-400 font-medium">Hiện tại: {fontSize}px</span>
                                                </div>
                                                <div className="flex items-center bg-stone-200/80 dark:bg-white/10 rounded-lg p-0.5 border border-stone-300/60 dark:border-white/10">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleFontSizeChange(-1)}
                                                        className="w-7 h-7 flex items-center justify-center hover:bg-white dark:hover:bg-white/20 rounded font-black text-xs transition-colors cursor-pointer"
                                                    >
                                                        A-
                                                    </button>
                                                    <div className="w-[1px] h-3 bg-stone-300 dark:bg-white/20 mx-0.5" />
                                                    <button
                                                        type="button"
                                                        onClick={() => handleFontSizeChange(1)}
                                                        className="w-7 h-7 flex items-center justify-center hover:bg-white dark:hover:bg-white/20 rounded font-black text-xs transition-colors cursor-pointer"
                                                    >
                                                        A+
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Chế độ Nền Trong Suốt (Giống Tab POS) */}
                                            <div className="flex items-center justify-between p-2 rounded-xl bg-stone-50 dark:bg-white/5 border border-stone-200/60 dark:border-white/5">
                                                <div className="flex items-center gap-2">
                                                    <Sparkles size={15} className={isTransparentBg ? "text-emerald-500" : "text-stone-400"} />
                                                    <div>
                                                        <span className="text-xs font-bold block">Nền trong suốt (Tab POS)</span>
                                                        <span className="text-[10px] text-stone-500 dark:text-stone-400 font-medium">
                                                            {isTransparentBg ? 'Bật: Hiển thị hình nền hệ thống' : 'Tắt: Dùng màu nền chủ đề'}
                                                        </span>
                                                    </div>
                                                </div>
                                                <button
                                                    type="button"
                                                    role="switch"
                                                    aria-checked={isTransparentBg}
                                                    onClick={handleToggleTransparentBg}
                                                    className={cn(
                                                        "relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none shadow-inner",
                                                        isTransparentBg ? "bg-emerald-600" : "bg-stone-300 dark:bg-stone-700"
                                                    )}
                                                >
                                                    <span
                                                        className={cn(
                                                            "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition duration-200 ease-in-out",
                                                            isTransparentBg ? "translate-x-5" : "translate-x-0"
                                                        )}
                                                    />
                                                </button>
                                            </div>

                                            {/* Màu sắc khung chat */}
                                            <div className="space-y-1.5 pt-1">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs font-bold text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
                                                        <Palette size={13} className="text-emerald-500" />
                                                        <span>Màu khung chat</span>
                                                    </span>
                                                    <span className="text-[10px] font-black text-emerald-700 dark:text-emerald-300 bg-emerald-500/15 px-2 py-0.5 rounded-full border border-emerald-500/30">
                                                        {isTransparentBg ? 'Trong Suốt' : currentThemeConfig.name}
                                                    </span>
                                                </div>

                                                <div className="grid grid-cols-4 gap-1.5">
                                                    {CHAT_THEMES.map((th) => {
                                                        const isSelected = isTransparentBg ? th.id === 'transparent' : (chatTheme === th.id && !isTransparentBg);
                                                        return (
                                                            <button
                                                                key={th.id}
                                                                type="button"
                                                                onClick={() => handleSelectTheme(th.id)}
                                                                className={cn(
                                                                    "p-1.5 rounded-xl border flex flex-col items-center gap-1 transition-all cursor-pointer select-none active:scale-95",
                                                                    isSelected
                                                                        ? "border-emerald-600 bg-emerald-500/10 dark:bg-emerald-950/40 ring-1 ring-emerald-500/30"
                                                                        : "border-stone-200/80 dark:border-white/10 hover:border-stone-400 dark:hover:border-white/20 bg-stone-50 dark:bg-white/5"
                                                                )}
                                                                title={th.name}
                                                            >
                                                                <div
                                                                    className="w-5 h-5 rounded-lg shadow-2xs border border-black/10 flex items-center justify-center relative overflow-hidden"
                                                                    style={{
                                                                        backgroundColor: th.id === 'transparent' ? 'transparent' : th.preview,
                                                                        backgroundImage: th.id === 'transparent' ? 'linear-gradient(45deg, #cbd5e1 25%, transparent 25%), linear-gradient(-45deg, #cbd5e1 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #cbd5e1 75%), linear-gradient(-45deg, transparent 75%, #cbd5e1 75%)' : undefined,
                                                                        backgroundSize: th.id === 'transparent' ? '6px 6px' : undefined,
                                                                        backgroundPosition: th.id === 'transparent' ? '0 0, 0 3px, 3px -3px, -3px 0px' : undefined
                                                                    }}
                                                                >
                                                                    {isSelected && (
                                                                        <Check
                                                                            size={11}
                                                                            className={th.id === 'white' || th.id === 'cream' || th.id === 'transparent' ? 'text-stone-900' : 'text-white'}
                                                                            strokeWidth={3}
                                                                        />
                                                                    )}
                                                                </div>
                                                                <span className="text-[9px] font-bold truncate max-w-full text-stone-700 dark:text-stone-300">
                                                                    {th.name}
                                                                </span>
                                                            </button>
                                                        );
                                                    })}

                                                    {/* Tự chọn màu tùy ý qua Color Picker */}
                                                    <label
                                                        className={cn(
                                                            "p-1.5 rounded-xl border flex flex-col items-center gap-1 transition-all cursor-pointer select-none active:scale-95 relative overflow-hidden",
                                                            chatTheme === 'custom'
                                                                ? "border-emerald-600 bg-emerald-500/10 dark:bg-emerald-950/40 ring-1 ring-emerald-500/30"
                                                                : "border-stone-200/80 dark:border-white/10 hover:border-stone-400 dark:hover:border-white/20 bg-stone-50 dark:bg-white/5"
                                                        )}
                                                        title="Tự chọn màu sắc bất kỳ qua bảng mã màu"
                                                    >
                                                        <input
                                                            type="color"
                                                            value={customChatColor}
                                                            onChange={(e) => handleCustomColorChange(e.target.value)}
                                                            className="opacity-0 absolute inset-0 w-full h-full cursor-pointer pointer-events-auto"
                                                        />
                                                        <div
                                                            className="w-5 h-5 rounded-lg shadow-2xs border border-black/10 flex items-center justify-center bg-gradient-to-tr from-rose-500 via-amber-400 to-cyan-400 relative"
                                                            style={chatTheme === 'custom' ? { backgroundColor: customChatColor, backgroundImage: 'none' } : {}}
                                                        >
                                                            <Palette size={11} className="text-white drop-shadow-xs" />
                                                        </div>
                                                        <span className="text-[9px] font-bold truncate max-w-full text-stone-700 dark:text-stone-300">
                                                            Tự chọn
                                                        </span>
                                                    </label>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Vị trí & Kích thước khung chat */}
                                        {!isStandalone && (
                                            <div className="space-y-2 pt-2 border-t border-stone-200/50 dark:border-white/10">
                                                <span className="text-[10px] font-black uppercase tracking-wider text-stone-400 dark:text-stone-500">
                                                    Vị trí & Kích thước khung chat
                                                </span>
                                                <div className="grid grid-cols-2 gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={handleResetPosition}
                                                        className="p-2 rounded-xl bg-stone-50 hover:bg-emerald-50 dark:bg-white/5 dark:hover:bg-emerald-950/40 text-stone-700 hover:text-emerald-700 dark:text-stone-300 dark:hover:text-emerald-300 border border-stone-200/60 dark:border-white/5 hover:border-emerald-500/40 text-[10.5px] font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95"
                                                        title="Đưa khung chat về vị trí mặc định bên cạnh Lí An"
                                                    >
                                                        <RotateCcw size={12} />
                                                        <span>Về cạnh Lí An</span>
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={handleResetSize}
                                                        className="p-2 rounded-xl bg-stone-50 hover:bg-emerald-50 dark:bg-white/5 dark:hover:bg-emerald-950/40 text-stone-700 hover:text-emerald-700 dark:text-stone-300 dark:hover:text-emerald-300 border border-stone-200/60 dark:border-white/5 hover:border-emerald-500/40 text-[10.5px] font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95"
                                                        title="Đặt lại chiều rộng và chiều cao tiêu chuẩn"
                                                    >
                                                        <Maximize2 size={12} />
                                                        <span>Đặt lại kích thước</span>
                                                    </button>
                                                </div>
                                            </div>
                                        )}

                                        {/* 2. Google AI Studio Models */}
                                        <div className="space-y-2 pt-1 border-t border-stone-200/50 dark:border-white/10">
                                            <div className="flex items-center justify-between">
                                                <span className="text-[10px] font-black uppercase tracking-wider text-stone-400 dark:text-stone-500">
                                                    Mô hình AI Studio
                                                </span>
                                                <button
                                                    type="button"
                                                    disabled={isFetchingModels}
                                                    onClick={handleFetchModels}
                                                    className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-[10px] font-bold transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                                                    title="Gọi API Google AI Studio để cập nhật danh sách model mới nhất từ tài khoản của bạn"
                                                >
                                                    <RefreshCw size={11} className={isFetchingModels ? "animate-spin" : ""} />
                                                    <span>{isFetchingModels ? 'Đang fetch...' : 'Fetch từ AI Studio'}</span>
                                                </button>
                                            </div>

                                            {/* Model Selector List */}
                                            <div className="space-y-1.5 max-h-48 overflow-y-auto custom-scrollbar pr-0.5">
                                                {availableModels.map((m) => {
                                                    const isChosen = (selectedModel || 'gemini-2.5-flash') === m.id;
                                                    return (
                                                        <button
                                                            key={m.id}
                                                            type="button"
                                                            onClick={() => handleSelectModel(m.id)}
                                                            className={cn(
                                                                "w-full p-2 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-2",
                                                                isChosen
                                                                    ? "bg-emerald-500/10 dark:bg-emerald-950/40 border-emerald-500/60 ring-1 ring-emerald-500/30"
                                                                    : "bg-stone-50 dark:bg-white/5 border-stone-200/60 dark:border-white/5 hover:border-emerald-500/30"
                                                            )}
                                                        >
                                                            <div className={cn(
                                                                "w-3.5 h-3.5 rounded-full border mt-0.5 flex items-center justify-center shrink-0 transition-colors",
                                                                isChosen ? "border-emerald-600 bg-emerald-600 text-white" : "border-stone-400 dark:border-stone-600"
                                                            )}>
                                                                {isChosen && <Check size={9} strokeWidth={3} />}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center justify-between gap-1">
                                                                    <span className={cn(
                                                                        "text-[11px] font-black truncate",
                                                                        isChosen ? "text-emerald-800 dark:text-emerald-300" : "text-stone-800 dark:text-stone-200"
                                                                    )}>
                                                                        {m.name || m.id}
                                                                    </span>
                                                                    {isChosen && (
                                                                        <span className="text-[8.5px] px-1 py-0.2 rounded bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-bold shrink-0">
                                                                            Đang dùng
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <p className="text-[9.5px] text-stone-500 dark:text-stone-400 mt-0.5 line-clamp-1 font-mono">
                                                                    {m.id} {m.desc ? `• ${m.desc}` : ''}
                                                                </p>
                                                            </div>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                </m.div>
                            )}
                        </AnimatePresence>

                        <div
                            onPointerDown={handleHeaderDragStart}
                            onDoubleClick={(e) => {
                                // Chỉ đặt lại vị trí khi click đúp trực tiếp vào nền thanh tiêu đề trống, tuyệt đối không kích hoạt khi click nút cài đặt/công cụ
                                if (e.target === e.currentTarget || e.target.closest('.header-drag-area')) {
                                    handleResetPosition();
                                }
                            }}
                            className={`px-3.5 sm:px-5 ${isDoctorOnly ? 'py-3 sm:py-3.5' : 'py-3'} flex items-center justify-between text-stone-800 dark:text-stone-100 shrink-0 select-none relative transition-colors bg-transparent ${!isStandalone ? 'cursor-grab active:cursor-grabbing header-drag-area' : ''}`}
                            title={!isStandalone ? "Nhấn giữ thanh tiêu đề để di chuyển khung chat tùy ý (Click đúp vùng trống để về cạnh Lí An)" : ""}
                        >
                            <div className={cn("flex items-center justify-between w-full pointer-events-none", isStandalone ? "w-full" : "")}>
                                <div className="flex items-center gap-2 sm:gap-2.5 relative z-10 min-w-0 pointer-events-auto">
                                    {/* Grip Indicator */}
                                    {!isStandalone && (
                                        <div className="text-stone-400 dark:text-stone-500 opacity-40 hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing shrink-0" title="Nhấn giữ để di chuyển">
                                            <GripHorizontal size={14} />
                                        </div>
                                    )}

                                    {/* Đồng hồ bên POS (HeavyClock) thay thế toàn bộ cụm Avatar + Tiêu đề */}
                                    <HeavyClock variant="purchase" />
                                </div>

                                {/* Action Toolbar */}
                                <div
                                    onPointerDown={(e) => e.stopPropagation()}
                                    onDoubleClick={(e) => e.stopPropagation()}
                                    className="flex items-center gap-1.5 sm:gap-2 relative z-20 shrink-0 pointer-events-auto"
                                >
                                    {/* Nút Ca khám mới (chỉ hiện khi đang trong phiên chat, đưa về Spotlight Studio) */}
                                    {!isInitialWelcome && (
                                        <button
                                            type="button"
                                            onClick={handleClearChat}
                                            onPointerDown={(e) => e.stopPropagation()}
                                            onDoubleClick={(e) => e.stopPropagation()}
                                            title="Bắt đầu ca khám mới (trở về Spotlight Studio)"
                                            className="w-8 h-8 flex items-center justify-center rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-90 text-white transition-all shadow-sm shadow-emerald-950/20 cursor-pointer"
                                        >
                                            <RotateCcw size={15} />
                                        </button>
                                    )}

                                    {/* Nút Cài đặt mở Popover (Darkmode, Cỡ chữ & AI Studio Models) */}
                                    <button
                                        ref={settingsBtnRef}
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setShowSettings(prev => !prev);
                                        }}
                                        onPointerDown={(e) => e.stopPropagation()}
                                        onDoubleClick={(e) => e.stopPropagation()}
                                        title="Cài đặt Lí An AI (Giao diện, Cỡ chữ & AI Studio Models)"
                                        className={cn(
                                            "w-8 h-8 flex items-center justify-center rounded-xl border transition-all active:scale-90 cursor-pointer shadow-2xs",
                                            showSettings
                                                ? "bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-950/20"
                                                : "bg-black/[0.04] hover:bg-black/[0.08] dark:bg-white/[0.08] dark:hover:bg-white/15 text-stone-700 dark:text-stone-200 border-black/[0.06] dark:border-white/10"
                                        )}
                                    >
                                        <Settings size={15} />
                                    </button>

                                    {/* Nút Xóa lịch sử chat */}
                                    <button
                                        type="button"
                                        onClick={handleClearChat}
                                        onPointerDown={(e) => e.stopPropagation()}
                                        onDoubleClick={(e) => e.stopPropagation()}
                                        title="Làm mới cuộc trò chuyện"
                                        className="w-8 h-8 flex items-center justify-center bg-black/[0.04] hover:bg-black/[0.08] dark:bg-white/[0.08] dark:hover:bg-white/15 active:scale-90 text-stone-600 hover:text-stone-900 dark:text-stone-300 dark:hover:text-white rounded-xl border border-black/[0.06] dark:border-white/10 transition-all cursor-pointer shadow-2xs"
                                    >
                                        <Trash2 size={15} />
                                    </button>

                                    {!isDoctorOnly && !isStandalone && (
                                        <button
                                            type="button"
                                            onClick={onClose}
                                            onPointerDown={(e) => e.stopPropagation()}
                                            onDoubleClick={(e) => e.stopPropagation()}
                                            title="Đóng (ESC)"
                                            className="w-8 h-8 flex items-center justify-center bg-rose-500/15 hover:bg-rose-500 text-rose-600 hover:text-white dark:bg-rose-500/25 dark:hover:bg-rose-500 dark:text-rose-300 dark:hover:text-white rounded-xl border border-rose-500/25 transition-all active:scale-90 cursor-pointer shadow-2xs ml-0.5"
                                        >
                                            <X size={16} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Mode Segmented Tab Switcher */}
                        {!isDoctorOnly && (
                            <div className="px-3 sm:px-4 py-1.5 shrink-0 select-none">
                                <div className={cn("flex items-center gap-1.5 p-1 bg-black/[0.04] dark:bg-white/[0.06] rounded-2xl border border-black/[0.06] dark:border-white/10 shadow-2xs", isStandalone ? "max-w-4xl mx-auto" : "")}>
                                    {MODES.map((m) => {
                                        const IconComponent = m.icon;
                                        const isActive = activeMode === m.id;
                                        return (
                                            <button
                                                key={m.id}
                                                type="button"
                                                onClick={() => handleSwitchMode(m.id)}
                                                title={m.desc}
                                                className={`flex-1 py-1.5 px-2.5 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer select-none active:scale-95 ${isActive
                                                        ? `${m.activeBg} text-white shadow-md shadow-emerald-950/20 scale-[1.01]`
                                                        : 'text-stone-700 dark:text-stone-300 hover:bg-black/[0.06] dark:hover:bg-white/10 hover:text-stone-900 dark:hover:text-white'
                                                    }`}
                                            >
                                                <IconComponent size={13} className={isActive ? 'text-white' : 'opacity-70'} />
                                                <span className="truncate tracking-tight">{m.label}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Main Cockpit Body (3 Cột: Kho Hoạt Chất | Studio & Chat | Cẩm Nang Dược Học) */}
                        <div className="flex-1 flex min-h-0 overflow-hidden relative w-full">
                            {/* LEFT COCKPIT: Kho hoạt chất & Thuốc sẵn có (chỉ hiện khi isStandalone & màn hình rộng xl+) */}
                            {isStandalone && (
                                <CockpitLeftPanel
                                    onSelectActive={(prompt) => handleSend(prompt)}
                                    isLoading={isLoading}
                                    currentThemeConfig={currentThemeConfig}
                                    isTransparentBg={isTransparentBg}
                                    isDark={isDark}
                                />
                            )}

                            {/* CENTER COLUMN: Spotlight Studio hoặc Feed hội thoại + Khung gõ */}
                            <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
                                {/* Chat Messages Feed - Thấu suốt hình nền */}
                                <div
                                    ref={chatFeedRef}
                                    className="flex-1 overflow-y-auto p-3 sm:p-5 custom-scrollbar bg-transparent select-text"
                                >
                                    <AnimatePresence>
                                        {isInitialWelcome ? (
                                            <m.div
                                                key="spotlight-welcome-container"
                                                initial={{ opacity: 0, scale: 0.98 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                exit={{ opacity: 0, y: -24, scale: 0.96 }}
                                                transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                                                className="w-full flex-1 flex flex-col justify-center"
                                            >
                                                <SpotlightStudio
                                                    mascot={activeMascot}
                                                    activeMode={activeMode}
                                                    isDoctorOnly={isDoctorOnly}
                                                    currentModeConfig={currentModeConfig}
                                                    input={input}
                                                    setInput={setInput}
                                                    inputRef={inputRef}
                                                    selectedImages={selectedImages}
                                                    handleRemoveImage={handleRemoveImage}
                                                    onUploadClick={() => fileInputRef.current?.click()}
                                                    handlePaste={handlePaste}
                                                    handleSend={handleSend}
                                                    isSendingAnim={isSendingAnim}
                                                    isLoading={isLoading}
                                                    fontSize={fontSize}
                                                />
                                            </m.div>
                                        ) : (
                                            <div className={`space-y-3.5 ${isStandalone ? 'max-w-4xl mx-auto' : ''}`}>
                                                <AnimatePresence>
                                                    {messages.map((msg, idx) => {
                                                        const isLatestUser = idx === latestUserIdx;
                                                        const isLatestModel = idx === latestModelIdx;

                                                        return (
                                                            <ChatMessageBubble
                                                                key={msg.id || `msg-${idx}`}
                                                                msg={msg}
                                                                idx={idx}
                                                                mascot={activeMascot}
                                                                isLatestUser={isLatestUser}
                                                                isLatestModel={isLatestModel}
                                                                latestUserMsgRef={latestUserMsgRef}
                                                                latestModelMsgRef={latestModelMsgRef}
                                                                fontSize={fontSize}
                                                                copiedIndex={copiedIndex}
                                                                addedProducts={addedProducts}
                                                                activeTab={productSubTabs[msg.id]}
                                                                onTabChange={handleSubTabChange}
                                                                onCopy={handleCopy}
                                                                onDelete={handleDeleteMessage}
                                                                onAddToCart={handleAddToCartClick}
                                                                onAddAllToCart={handleAddAllToCart}
                                                                renderFormattedText={renderFormattedText}
                                                            />
                                                        );
                                                    })}

                                                    {isLoading && (
                                                        <m.div
                                                            key="ai-loading-indicator"
                                                            initial={{ opacity: 0, y: 16 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            exit={{ opacity: 0, y: -6, transition: { duration: 0.12 } }}
                                                            transition={{ duration: 0.42, delay: 0.16, ease: [0.22, 1, 0.36, 1] }}
                                                            className="flex gap-2.5 sm:gap-3 justify-start items-start select-none py-1"
                                                        >
                                                            {/* Avatar Bé Lyang with thinking badge */}
                                                            <div className="relative shrink-0 mt-0.5">
                                                                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-2xl overflow-hidden bg-gradient-to-tr from-emerald-500/20 to-teal-400/20 border border-emerald-500/40 p-0.5 flex items-center justify-center shadow-md shadow-emerald-950/15">
                                                                    <div
                                                                        style={{
                                                                            width: '100%',
                                                                            height: '100%',
                                                                            backgroundImage: `url("${activeMascot?.directions || '/mascots/lyang-directions.webp'}")`,
                                                                            backgroundSize: '300% 300%',
                                                                            backgroundPosition: '50% 50%',
                                                                            backgroundRepeat: 'no-repeat',
                                                                            transform: 'scale(1.22)',
                                                                            transformOrigin: 'center center'
                                                                        }}
                                                                        className="pointer-events-none select-none"
                                                                    />
                                                                </div>
                                                                <m.span
                                                                    animate={{ rotate: [0, 15, -15, 0], scale: [1, 1.15, 1] }}
                                                                    transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                                                                    className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-gradient-to-tr from-amber-400 to-yellow-300 text-stone-900 flex items-center justify-center shadow-xs text-[9px] font-black"
                                                                >
                                                                    ✨
                                                                </m.span>
                                                            </div>

                                                            {/* Loading Bubble Card with Wave Dots & Shimmer Beam */}
                                                            <div className="relative overflow-hidden bg-white/85 dark:bg-[#0c1a14]/90 backdrop-blur-2xl border border-emerald-500/25 dark:border-emerald-500/30 rounded-3xl rounded-tl-md sm:rounded-3xl sm:rounded-tl-lg p-3.5 sm:p-4 shadow-[0_10px_30px_rgba(0,0,0,0.06),0_1px_3px_rgba(16,185,129,0.08)] dark:shadow-[0_14px_40px_rgba(0,0,0,0.5),0_0_20px_rgba(16,185,129,0.08)] flex flex-col gap-2 max-w-[85%]">
                                                                {/* Top shine line */}
                                                                <div className="absolute inset-x-6 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-emerald-400/50 dark:via-emerald-400/30 to-transparent pointer-events-none rounded-t-full" />

                                                                <div className="flex items-center gap-2.5">
                                                                    {/* Bouncing 3-dot thinking wave */}
                                                                    <div className="flex items-center gap-1.5 shrink-0 py-1">
                                                                        <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.7)] ai-dot-1" />
                                                                        <span className="inline-block w-2.5 h-2.5 rounded-full bg-teal-400 shadow-[0_0_8px_rgba(20,184,166,0.7)] ai-dot-2" />
                                                                        <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.7)] ai-dot-3" />
                                                                    </div>

                                                                    {/* Shimmering Text */}
                                                                    <p
                                                                        style={{ fontSize: `${Math.max(12, fontSize - 1)}px` }}
                                                                        className="font-extrabold bg-gradient-to-r from-emerald-800 via-emerald-500 to-teal-700 dark:from-emerald-300 dark:via-emerald-100 dark:to-teal-200 bg-[length:200%_auto] animate-[shimmer_2s_infinite] bg-clip-text text-transparent leading-tight"
                                                                    >
                                                                        {currentModeConfig.loadingText}
                                                                    </p>
                                                                </div>

                                                                {/* Bottom Animated Thinking Beam - Chạy trọn vẹn 100% thanh từ trái sang phải */}
                                                                <div className="w-full h-1.5 bg-stone-100 dark:bg-white/10 rounded-full overflow-hidden relative mt-0.5">
                                                                    <div className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-400 rounded-full animate-[ai-thinking-beam_1.5s_cubic-bezier(0.4,0,0.2,1)_infinite] shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                                                </div>
                                                            </div>
                                                        </m.div>
                                                    )}
                                                </AnimatePresence>

                                                <div ref={chatEndRef} />
                                            </div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                {/* File input ẩn dùng chung cho cả Spotlight Studio và Bottom Dock */}
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleImageSelect}
                                    accept="image/*"
                                    multiple
                                    className="hidden"
                                />

                                {/* Bottom Dock Input - Chỉ hiện khi đang trong phiên chat (không hiện khi ở Spotlight Studio ban đầu) */}
                                <AnimatePresence>
                                    {!isInitialWelcome && (
                                        <m.div
                                            key="bottom-dock-input-bar"
                                            initial={{ opacity: 0, y: 24 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: 24 }}
                                            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                                            className="shrink-0 flex flex-col"
                                        >
                                            {/* Preview Selected Images */}
                                            {selectedImages.length > 0 && (
                                                <div className="px-3.5 py-2 border-t border-stone-200/50 dark:border-white/10 bg-emerald-50/70 dark:bg-[#091811] shrink-0">
                                                    <div className={`flex items-center justify-between gap-2 ${isStandalone ? 'max-w-4xl mx-auto w-full' : ''}`}>
                                                        <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar py-0.5">
                                                            <span className="text-[10px] font-black uppercase text-emerald-800 dark:text-emerald-400 whitespace-nowrap flex items-center gap-1">
                                                                <span>📸 Ảnh khám bệnh</span>
                                                                <span className="text-[9px] px-1.5 py-0.2 bg-emerald-200/80 dark:bg-emerald-800/60 rounded-full font-black">
                                                                    {selectedImages.length}/4
                                                                </span>
                                                            </span>
                                                            {selectedImages.map((img, idx) => (
                                                                <div key={idx} className="relative group w-12 h-12 rounded-xl overflow-hidden border-2 border-emerald-500/60 shadow-xs shrink-0 bg-black/5">
                                                                    <img src={img} alt="Preview" className="w-full h-full object-cover" />
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleRemoveImage(idx)}
                                                                        title="Xóa ảnh này"
                                                                        className="absolute inset-0 bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                                                    >
                                                                        <X size={14} className="text-white drop-shadow-sm" />
                                                                    </button>
                                                                </div>
                                                            ))}
                                                        </div>
                                                        <span className="text-[9.5px] font-bold text-emerald-700/90 dark:text-emerald-400/90 whitespace-nowrap shrink-0 hidden sm:inline-block">
                                                            Nhấn Gửi để chẩn đoán ngay
                                                        </span>
                                                    </div>
                                                </div>
                                            )}


                                            {/* Input Controls */}
                                            <div className="p-2.5 sm:p-3.5 bg-transparent shrink-0 border-t border-black/[0.04] dark:border-white/[0.04]">
                                                <div className={isStandalone ? "max-w-4xl mx-auto w-full" : ""}>
                                                    <form
                                                        onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                                                        className="flex items-center gap-2"
                                                    >
                                                        <button
                                                            type="button"
                                                            onClick={() => fileInputRef.current?.click()}
                                                            title="Tải ảnh hoặc nhấn Ctrl+V để dán ảnh trực tiếp"
                                                            className="p-2.5 sm:p-3 rounded-2xl active:scale-95 transition-all shrink-0 cursor-pointer flex items-center justify-center shadow-2xs bg-white/45 hover:bg-white/70 dark:bg-white/[0.08] dark:hover:bg-white/15 text-stone-700 dark:text-stone-200 border border-white/50 dark:border-white/15 backdrop-blur-xs"
                                                        >
                                                            <Camera size={18} />
                                                        </button>

                                                        <div className="flex-1 relative flex items-center">
                                                            {/* Hiệu ứng gõ từng ký tự nảy mượt mà, đồng bộ chính xác với input */}
                                                            <SearchTypingOverlay
                                                                text={input}
                                                                enabled={Boolean(input)}
                                                                inputRef={inputRef}
                                                                className="left-0 right-10 sm:right-11 pl-3.5 sm:pl-4 font-medium text-stone-900 dark:text-white"
                                                                style={{
                                                                    fontSize: `${Math.max(12.5, Math.min(15, fontSize))}px`
                                                                }}
                                                            />

                                                            {/* Input gốc nhận sự kiện bàn phím & gõ tiếng Việt tự nhiên */}
                                                            <input
                                                                ref={inputRef}
                                                                type="text"
                                                                value={input}
                                                                onChange={(e) => setInput(e.target.value)}
                                                                onPaste={handlePaste}
                                                                spellCheck={false}
                                                                autoComplete="off"
                                                                placeholder={
                                                                    selectedImages.length > 0
                                                                        ? "Nhập thêm ghi chú hoặc nhấn Gửi để chẩn đoán bệnh..."
                                                                        : `${currentModeConfig.placeholder} (Ctrl+V dán ảnh)`
                                                                }
                                                                style={{
                                                                    fontSize: `${Math.max(12.5, Math.min(15, fontSize))}px`
                                                                }}
                                                                className={cn(
                                                                    "w-full pl-3.5 sm:pl-4 !pr-10 sm:!pr-11 py-2.5 sm:py-3 placeholder-stone-400 dark:placeholder-stone-500 rounded-2xl font-medium outline-none transition-all shadow-2xs caret-emerald-600 dark:caret-emerald-400 bg-white/45 hover:bg-white/60 focus:bg-white/70 dark:bg-black/40 dark:hover:bg-black/50 dark:focus:bg-black/60 backdrop-blur-xl border border-white/55 dark:border-white/15 focus:border-emerald-500/60 dark:focus:border-emerald-400/60",
                                                                    input ? "!text-transparent" : "!text-stone-900 dark:!text-white"
                                                                )}
                                                            />

                                                            {/* Nút xóa nhanh khi có nội dung - Đặt bên phải với khoảng cách an toàn, không đè lên chữ */}
                                                            {input ? (
                                                                <div className="absolute right-2 sm:right-2.5 z-20 flex items-center">
                                                                    <m.button
                                                                        type="button"
                                                                        initial={{ scale: 0, opacity: 0 }}
                                                                        animate={{ scale: 1, opacity: 1 }}
                                                                        exit={{ scale: 0, opacity: 0 }}
                                                                        whileHover={{ scale: 1.1 }}
                                                                        whileTap={{ scale: 0.9 }}
                                                                        onClick={() => { setInput(''); inputRef.current?.focus(); }}
                                                                        title="Xóa câu hỏi để nhập lại"
                                                                        className="p-1.5 rounded-xl bg-stone-100 hover:bg-red-50 text-stone-400 hover:text-red-500 dark:bg-white/10 dark:hover:bg-red-950/40 dark:hover:text-red-400 cursor-pointer transition-colors shadow-2xs"
                                                                    >
                                                                        <X size={13} />
                                                                    </m.button>
                                                                </div>
                                                            ) : null}
                                                        </div>

                                                        {(() => {
                                                            const hasContent = Boolean(input.trim() || selectedImages.length > 0);
                                                            return (
                                                                <div className="relative shrink-0 flex items-center">
                                                                    <m.button
                                                                        type="submit"
                                                                        disabled={isLoading || !hasContent}
                                                                        whileHover={hasContent && !isLoading ? { scale: 1.03 } : {}}
                                                                        whileTap={hasContent && !isLoading ? { scale: 0.96 } : {}}
                                                                        style={{
                                                                            border: 'none',
                                                                            outline: 'none',
                                                                            boxShadow: 'none',
                                                                            WebkitTapHighlightColor: 'transparent',
                                                                            WebkitAppearance: 'none'
                                                                        }}
                                                                        className={cn(
                                                                            "relative overflow-hidden px-4 sm:px-5 py-2.5 sm:py-3 rounded-2xl font-black text-xs sm:text-sm flex items-center gap-1.5 select-none transition-all duration-300 group",
                                                                            "border-0 outline-none ring-0 focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 active:outline-none active:ring-0",
                                                                            hasContent && !isLoading
                                                                                ? "cursor-pointer text-white shadow-md shadow-emerald-600/30"
                                                                                : "cursor-not-allowed text-stone-400 dark:text-stone-500 bg-black/[0.05] dark:bg-white/[0.08]"
                                                                        )}
                                                                    >
                                                                        {/* Lớp nền gradient chuyển màu êm ái khi có nội dung */}
                                                                        <div
                                                                            className={cn(
                                                                                "absolute inset-0 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:brightness-105 transition-opacity duration-300 ease-out",
                                                                                hasContent && !isLoading ? "opacity-100" : "opacity-0 pointer-events-none"
                                                                            )}
                                                                        />

                                                                        {/* Hiệu ứng chùm sáng nhẹ chạy qua khi rê chuột */}
                                                                        {hasContent && !isLoading && (
                                                                            <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/25 to-transparent skew-x-12 pointer-events-none" />
                                                                        )}

                                                                        <span className="relative z-10 transition-colors duration-200">
                                                                            {selectedImages.length > 0 && !input.trim() ? 'Khám ảnh' : 'Gửi'}
                                                                        </span>
                                                                        <m.div
                                                                            className="relative z-10"
                                                                            animate={isSendingAnim ? {
                                                                                x: [0, 8, 14, 0],
                                                                                y: [0, -8, -14, 0],
                                                                                opacity: [1, 0.8, 0, 1],
                                                                                rotate: [0, -25, -45, 0]
                                                                            } : hasContent ? {
                                                                                rotate: [0, -6, 0],
                                                                                transition: { duration: 0.25 }
                                                                            } : {}}
                                                                            transition={{ duration: 0.45, ease: "easeOut" }}
                                                                        >
                                                                            <Send size={14} className={cn("transition-transform duration-200", hasContent ? "translate-x-0.5 -translate-y-0.5" : "")} />
                                                                        </m.div>
                                                                    </m.button>
                                                                </div>
                                                            );
                                                        })()}
                                                    </form>
                                                </div>
                                            </div>
                                        </m.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* RIGHT COCKPIT: Cẩm nang dược học & Bảng chia liều W-S-S-E-A (chỉ hiện khi isStandalone & màn hình rộng xl+) */}
                            {isStandalone && (
                                <CockpitRightPanel
                                    onQuickAsk={(prompt) => handleSend(prompt)}
                                    isLoading={isLoading}
                                    currentThemeConfig={currentThemeConfig}
                                    isTransparentBg={isTransparentBg}
                                    isDark={isDark}
                                />
                            )}
                        </div>
                    </div>

                    {/* RESIZE HANDLERS (8 HƯỚNG & 4 GÓC TỰ DO) - ONLY IN FLOATING POPUP MODE */}
                    {!isStandalone && (
                        <>
                            {/* Top edge */}
                            <div
                                onMouseDown={(e) => handleResizeStart('n', e)}
                                className="absolute top-0 left-3 right-3 h-2 cursor-ns-resize z-50 hover:bg-emerald-500/20 active:bg-emerald-500/40 transition-colors"
                                title="Kéo để chỉnh chiều cao"
                            />
                            {/* Bottom edge */}
                            <div
                                onMouseDown={(e) => handleResizeStart('s', e)}
                                className="absolute bottom-0 left-3 right-3 h-2 cursor-ns-resize z-50 hover:bg-emerald-500/20 active:bg-emerald-500/40 transition-colors"
                                title="Kéo để chỉnh chiều cao"
                            />
                            {/* Left edge */}
                            <div
                                onMouseDown={(e) => handleResizeStart('w', e)}
                                className="absolute left-0 top-3 bottom-3 w-2 cursor-ew-resize z-50 hover:bg-emerald-500/20 active:bg-emerald-500/40 transition-colors"
                                title="Kéo để chỉnh chiều rộng"
                            />
                            {/* Right edge */}
                            <div
                                onMouseDown={(e) => handleResizeStart('e', e)}
                                className="absolute right-0 top-3 bottom-3 w-2 cursor-ew-resize z-50 hover:bg-emerald-500/20 active:bg-emerald-500/40 transition-colors"
                                title="Kéo để chỉnh chiều rộng"
                            />
                            {/* Top-Left corner */}
                            <div
                                onMouseDown={(e) => handleResizeStart('nw', e)}
                                className="absolute top-0 left-0 w-3.5 h-3.5 cursor-nwse-resize z-50 hover:bg-emerald-500/30 rounded-tl-3xl"
                            />
                            {/* Top-Right corner */}
                            <div
                                onMouseDown={(e) => handleResizeStart('ne', e)}
                                className="absolute top-0 right-0 w-3.5 h-3.5 cursor-nesw-resize z-50 hover:bg-emerald-500/30 rounded-tr-3xl"
                            />
                            {/* Bottom-Left corner */}
                            <div
                                onMouseDown={(e) => handleResizeStart('sw', e)}
                                className="absolute bottom-0 left-0 w-3.5 h-3.5 cursor-nesw-resize z-50 hover:bg-emerald-500/30 rounded-bl-3xl"
                            />
                            {/* Bottom-Right corner with visual resize grip indicator */}
                            <div
                                onMouseDown={(e) => handleResizeStart('se', e)}
                                className="absolute bottom-0.5 right-0.5 w-4 h-4 cursor-nwse-resize z-50 flex items-center justify-center group/grip opacity-60 hover:opacity-100 transition-opacity"
                                title="Kéo để thay đổi kích thước tự do"
                            >
                                <svg className="w-2.5 h-2.5 text-stone-400 dark:text-stone-500 group-hover/grip:text-emerald-500" viewBox="0 0 6 6" fill="currentColor">
                                    <circle cx="5" cy="5" r="0.75" />
                                    <circle cx="5" cy="2.5" r="0.75" />
                                    <circle cx="2.5" cy="5" r="0.75" />
                                </svg>
                            </div>
                        </>
                    )}
                </m.div>
            )}
        </AnimatePresence>
    );
}
