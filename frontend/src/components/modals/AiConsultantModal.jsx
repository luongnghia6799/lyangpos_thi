import React, { useState, useEffect, useRef, useMemo } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { 
    BrainCircuit, Sparkles, Send, Trash2, ShoppingCart, 
    Check, Leaf, X, Copy, 
    CheckCheck, Image as ImageIcon,
    FlaskConical, Droplets, Maximize2, Minimize2,
    BarChart3, TrendingUp, Bot, FileText,
    ShieldAlert, Stethoscope, Zap, Beaker, CheckCircle2, ChevronRight
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
        welcomeText: 'Xin chào! Tôi là **LyangAI - Cố Vấn Hoạt Chất & Nông Nghiệp Thông Minh**.\n\nHãy nhập triệu chứng cây trồng, loại sâu bệnh hoặc **nhấn Ctrl+V để dán ảnh lá/trái bị bệnh**, tôi sẽ chẩn đoán ngay và đối chiếu thuốc trong kho giúp bạn!',
        loadingText: 'LyangAI đang tra cứu hoạt chất & đối chiếu kho thuốc...',
        suggestions: [
            { label: '📸 Dán ảnh khám bệnh (Ctrl+V)', query: 'Hướng dẫn tôi cách chụp hoặc nhấn Ctrl+V để dán ảnh lá cây, vết bệnh vào đây cho AI chẩn đoán và kê đơn thuốc từ kho?' },
            { label: '🐛 Phối bọ trĩ lờn thuốc', query: 'Bọ trĩ thanh long bị kháng thuốc nặng gây quăn bông, đen tai, tư vấn bộ phối trộn hoạt chất có trong kho để tăng lực dập dịch và liều pha?' },
            { label: '🌿 Phối thán thư + thối nhũn vi khuẩn', query: 'Thanh long bị thán thư kết hợp thối nhũn vi khuẩn trên cành và bông mùa mưa, tư vấn bộ phối nấm + khuẩn từ các sản phẩm trong kho?' },
            { label: '🦎 Đốm nâu (Tắc kè) thanh long', query: 'Thanh long bị bệnh đốm nâu (đốm trắng / tắc kè) trên cành và trái non, rà soát toàn bộ hoạt chất đặc trị có trong kho và công thức phối trộn hiệu quả nhất?' },
            { label: '🐜 Phối rệp sáp & rầy bồ hóng', query: 'Rệp sáp và rầy phấn trắng bu nụ bông tạo nấm bồ hóng đen, tư vấn phối hợp hoạt chất hạ gục + lưu dẫn ức chế lột xác trong kho?' },
            { label: '🍂 Thối cành & xì mủ Phytophthora', query: 'Cành thanh long bị thối nhũn và nứt thân xì mủ, rà soát hoạt chất Oomycetes và vi khuẩn trong kho để phối thuốc chặn lây lan?' },
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
            { label: '💰 Tổng vốn tồn kho', query: 'Tổng vốn lưu động đang nằm trong kho là bao nhiêu tiền và những mặt hàng nào đang giam vốn nhiều nhất?' },
            { label: '👑 Top khách VIP mua nhiều nhất', query: 'Những khách hàng nào mua nhiều tiền nhất từ trước đến nay và tình hình công nợ của họ ra sao?' },
            { label: '📈 So sánh tháng này & tháng trước', query: 'So sánh tổng kết doanh thu, số đơn và lợi nhuận gộp của tháng này với tháng trước?' },
            { label: '📊 Doanh thu hôm nay / gần nhất', query: 'Hôm nay hoặc ngày bán gần đây nhất cửa hàng bán được bao nhiêu đơn, tổng doanh thu và thực thu thế nào?' },
            { label: '⚠️ Hàng ế đọng vốn', query: 'Những mặt hàng nào đang bị đọng vốn lâu ngày, tồn kho nhiều mà 60 ngày qua bán chậm cần xả hàng?' },
            { label: '🏆 Top mặt hàng bán chạy nhất', query: 'Top 10 mặt hàng bán chạy nhất lịch sử từ trước đến nay và tổng doanh số mang lại?' },
            { label: '💳 Công nợ khách nợ nhiều nhất', query: 'Tổng công nợ khách hàng hiện tại là bao nhiêu và những ai đang nợ nhiều nhất cần thu hồi?' },
            { label: '⏳ Hàng cận date / sắp hết kho', query: 'Có những sản phẩm nào sắp hết hạn sử dụng hoặc tồn kho thấp hơn mức cảnh báo không?' }
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
    const [isDraggingImage, setIsDraggingImage] = useState(false);
    const [productSubTabs, setProductSubTabs] = useState({});

    // Phân loại thuốc: Đặc trị chính vs Phối hợp tăng lực (Phương án B)
    const isTargetProduct = (prod) => {
        if (!prod) return true;
        if (prod.role === 'target') return true;
        if (prod.role === 'synergy') return false;
        const tier = (prod.tier || '').toLowerCase();
        if (tier.includes('đặc trị chính') || tier.includes('hạ gục') || tier.includes('đặc trị')) return true;
        if (tier.includes('tương thích') || tier.includes('hiệp đồng') || tier.includes('luân phiên') || tier.includes('phòng ngừa')) return false;
        return true;
    };

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
            let productKB = 'DANH MỤC TOÀN BỘ SẢN PHẨM & HOẠT CHẤT TRONG KHO CỬA HÀNG:\n';
            let allUniqueActives = [];
            const groupMap = {};

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

                    let activeGroupsSummary = '';
                    const groupKeys = Object.keys(groupMap).sort();
                    if (groupKeys.length === 0) {
                        activeGroupsSummary = '(Kho chưa có dữ liệu hoạt chất chi tiết)\n';
                    } else {
                        groupKeys.forEach(k => {
                            const grp = groupMap[k];
                            activeGroupsSummary += `▶ [${grp.info.groupName}] (Vai trò: ${grp.info.roleType}):\n  - Hoạt chất có trong kho: ${grp.actives.join(', ')}\n  - Cơ chế & Công dụng: ${grp.info.moaDesc}\n  - Sản phẩm đại diện trong kho: ${grp.products.join('; ')}\n\n`;
                        });
                    }

                    const allStr = allUniqueActives.length > 0 ? allUniqueActives.join(', ') : '(Chưa có dữ liệu hoạt chất trong kho)';

                    productList.slice(0, 500).forEach(p => {
                        const active = p.active_ingredient || 'Chưa có';
                        const unit = p.unit || '';
                        const price = p.sale_price || 0;
                        const stock = p.stock || 0;
                        const info = p.active_ingredient ? classifyActiveIngredient(p.active_ingredient) : null;
                        const tag = info ? (info.isAdvanced ? `[🌟 THẾ HỆ MỚI / ĐẶC TRỊ: ${info.roleType}]` : `[🌾 PHỔ THÔNG: ${info.roleType}]`) : '[CHƯA RÕ HOẠT CHẤT]';
                        productKB += `- [ID:${p.id}] Tên: ${p.name} | Hoạt chất: ${active} | ĐVT: ${unit} | Giá: ${price}đ | Tồn: ${stock} | Phân loại: ${tag}\n`;
                    });

                    systemInstruction = `Bạn là LyangAI - Chuyên gia Bác sĩ Cây trồng & Dược học Nông nghiệp cao cấp (Plant Protection & Agronomy Expert) của cửa hàng LyangPOS.

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
### 🌿 CẤU TRÚC BÀI TƯ VẤN TRỰC QUAN BẮT BUỘC (TUÂN THỦ CHÍNH XÁC):

### 🎯 CHẨN ĐOÁN & ĐẶC TÍNH GÂY HẠI
- **Đối tượng hại**: Tên sâu/bệnh & tác nhân gây hại (nấm, vi khuẩn, chích hút, ăn lá...).
- **Đặc tính nguy hiểm**: Cơ chế phá hoại, tốc độ lây lan, khả năng kháng thuốc cần lưu ý.

### 🔍 RÀ SOÁT HOẠT CHẤT CÓ TRONG KHO & LỰA CHỌN TƯƠNG THÍCH
(Điểm danh tất cả hoạt chất kho đang có dùng được cho đối tượng này, viết rõ: **Tên Thuốc** *(Hoạt chất)*):
- **Nhóm thế hệ mới / Đặc trị**: **Tên Thuốc A** *(Hoạt chất A)* - Cơ chế tác động & ưu thế vượt trội (ví dụ: bẻ gãy tính kháng, lưu dẫn 2 chiều, mát bông).
- **Nhóm hạ gục nhanh / Tiếp xúc**: **Tên Thuốc B** *(Hoạt chất B)* - Cơ chế tiếp xúc vị độc, hạ gục tức thì.
- **Nhóm bảo vệ / Ức chế lột xác**: **Tên Thuốc C** *(Hoạt chất C)* - Diệt trứng, cắt đứt vòng đời, chống tái phát.

### 💥 BỘ PHỐI ĐÒN KÉP TĂNG LỰC (TANK-MIX TẠI KHO)
- **Công thức phối**: **Tên Thuốc 1** *(Hoạt chất 1)* + **Tên Thuốc 2** *(Hoạt chất 2)* (+ **Trợ lực** *(Hoạt chất)* nếu có)
- **Vì sao lại phối các thuốc này?**: Phân tích ngắn gọn cơ chế cộng hưởng tăng lực (ví dụ: Thuốc 1 đánh nhanh hạ gục + Thuốc 2 ngấm sâu diệt trứng lưu dẫn dài ngày).
- **Liều pha phối hợp cụ thể**:
  + **Bình 25 Lít**: Pha liều từng thuốc (ví dụ: 15ml **Tên Thuốc 1** + 15g **Tên Thuốc 2** + 2.5ml **Trợ lực**).
  + **Phuy 200 Lít**: Pha liều từng thuốc (ví dụ: 1 chai **Tên Thuốc 1** + 1 gói **Tên Thuốc 2** + 1 chai **Trợ lực**).

### 🧪 THỨ TỰ HÒA TAN CHUẨN VÀO BÌNH (Quy tắc W-S-S-E-A)
1. Đổ nước sạch vào 1/2 bình hoặc phuy.
2. Thuốc dạng Bột (WP, WG, WDG) khuấy tan hoàn toàn trước.
3. Thuốc dạng Huyền phù / Nước (SC, SL, FS, OD) đổ vào khuấy đều.
4. Thuốc dạng Nhũ dầu (EC, EW, ME) cho vào sau cùng.
5. Thêm chất bám dính / trợ lực (nếu có), châm đủ nước và phun ngay.

### ⚠️ LƯU Ý KỸ THUẬT & CẢNH BÁO TƯƠNG KỴ
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
            'gemini-3.5-flash-lite'
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

    const handleSend = async (queryText = null) => {
        const defaultImagePrompt = activeMode === 'crop_doctor'
            ? 'Chẩn đoán giúp tôi hình ảnh này cây đang bị bệnh gì, sâu hại gì và tư vấn phác đồ xử lý, bộ thuốc phối trộn đặc trị có trong kho cửa hàng nhé!'
            : 'Phân tích và cho tôi biết thông tin chi tiết về hình ảnh này nhé!';

        const textToSend = (queryText || input).trim() || (selectedImages.length > 0 ? defaultImagePrompt : '');
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
                }, { timeout: 25000 });

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

    const handleAddAllToCart = (productsList) => {
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
    };

    // Format cụm từ: làm nổi bật **Tên Thuốc** *(Tên hoạt chất)* hoặc **Tên Thuốc** (Hoạt chất)
    const renderBoldSpans = (text) => {
        if (!text) return null;

        // Bắt mẫu: **Tên Thuốc** *(Tên hoạt chất)* hoặc **Tên Thuốc** (Tên hoạt chất) hoặc **Tên Thuốc** [Hoạt chất]
        const drugPattern = /(\*\*[^*]+\*\*)\s*(\*(?:\([^*()]+\)|\[[^*[\]]+\])\*|\([^*()]+\)|\[[^*[\]]+\])/g;

        const tokens = [];
        let lastIndex = 0;
        let match;

        while ((match = drugPattern.exec(text)) !== null) {
            // Text trước match
            if (match.index > lastIndex) {
                tokens.push({ type: 'text', content: text.substring(lastIndex, match.index) });
            }
            tokens.push({
                type: 'drug_pair',
                drugName: match[1].replace(/^\*\*|\*\*$/g, '').trim(),
                activeName: match[2].replace(/^[\*\(\[]+|[\*\)\]]+$/g, '').trim()
            });
            lastIndex = drugPattern.lastIndex;
        }

        if (lastIndex < text.length) {
            tokens.push({ type: 'text', content: text.substring(lastIndex) });
        }

        return tokens.map((token, tIdx) => {
            if (token.type === 'drug_pair') {
                return (
                    <span 
                        key={tIdx} 
                        className="inline-flex items-center gap-1 mx-1 my-0.5 px-2 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/30 shadow-2xs align-middle"
                    >
                        <strong className="font-black text-emerald-900 dark:text-emerald-200 tracking-tight">
                            {token.drugName}
                        </strong>
                        <span className="text-[0.88em] font-semibold italic text-emerald-700 dark:text-emerald-400 bg-emerald-100/60 dark:bg-emerald-900/50 px-1.5 py-0.2 rounded">
                            ({token.activeName})
                        </span>
                    </span>
                );
            }

            // Xử lý các đoạn in đậm thông thường **...**
            const parts = token.content.split(/(\*\*.*?\*\*)/g);
            return (
                <span key={tIdx}>
                    {parts.map((p, pIdx) => {
                        if (p.startsWith('**') && p.endsWith('**')) {
                            const boldContent = p.slice(2, -2);
                            // Highlight đặc biệt nếu là liều lượng (bình 25L, phuy 200L)
                            const isDose = /bình\s*\d+l|phuy\s*\d+l|liều/i.test(boldContent);
                            if (isDose) {
                                return (
                                    <span 
                                        key={pIdx} 
                                        className="font-black text-amber-800 dark:text-amber-300 bg-amber-500/15 border border-amber-500/30 px-1.5 py-0.2 rounded-md mx-0.5"
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

    // Render formatted markdown với các Section Card trực quan (Chẩn đoán, Phối trộn, Thứ tự pha, Cảnh báo)
    const renderFormattedText = (text) => {
        if (!text) return null;

        // Tiền xử lý chuẩn hóa chuỗi phản hồi từ AI:
        // 1. Loại bỏ các dòng rác kiểu: "> +", ">  +", ">" trơ trọi, "+ " đứng một mình
        // 2. Bỏ dấu "> " ở đầu dòng để tránh vỡ layout và lộn xộn
        const cleanedText = text
            .split('\n')
            .filter(line => {
                const t = line.trim();
                // Bỏ dòng chỉ có dấu >, +, > +, > + >
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

        return rawLines.map((line, lineIdx) => {
            const trimmed = line.trim();

            if (trimmed === '---' || trimmed === '***' || trimmed === '___') {
                return <hr key={lineIdx} className="my-3 border-stone-200/80 dark:border-white/10" />;
            }

            // Nhận diện Header Section H3
            if (line.startsWith('### ')) {
                const headerText = line.replace('### ', '').trim();
                const lower = headerText.toLowerCase();

                let IconComp = Leaf;
                let cardStyle = "bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-500/30 text-emerald-900 dark:text-emerald-200";

                if (lower.includes('chẩn đoán') || lower.includes('đặc tính') || lower.includes('nguyên nhân')) {
                    IconComp = Stethoscope;
                    cardStyle = "bg-teal-500/10 dark:bg-teal-950/40 border-teal-500/30 text-teal-900 dark:text-teal-200";
                } else if (lower.includes('bộ phối') || lower.includes('phối trộn') || lower.includes('tank-mix') || lower.includes('đòn kép')) {
                    IconComp = Zap;
                    cardStyle = "bg-amber-500/15 dark:bg-amber-950/40 border-amber-500/40 text-amber-950 dark:text-amber-200";
                } else if (lower.includes('thứ tự') || lower.includes('hòa tan') || lower.includes('pha thuốc')) {
                    IconComp = Beaker;
                    cardStyle = "bg-sky-500/10 dark:bg-sky-950/40 border-sky-500/30 text-sky-950 dark:text-sky-200";
                } else if (lower.includes('cảnh báo') || lower.includes('lưu ý') || lower.includes('tương kỵ')) {
                    IconComp = ShieldAlert;
                    cardStyle = "bg-rose-500/10 dark:bg-rose-950/40 border-rose-500/30 text-rose-950 dark:text-rose-200";
                } else if (lower.includes('rà soát') || lower.includes('hoạt chất')) {
                    IconComp = FlaskConical;
                    cardStyle = "bg-emerald-500/10 dark:bg-emerald-950/40 border-emerald-500/30 text-emerald-950 dark:text-emerald-200";
                }

                return (
                    <div 
                        key={lineIdx}
                        className={cn(
                            "mt-3.5 mb-2 px-3 py-1.5 rounded-xl border flex items-center gap-2 shadow-2xs",
                            cardStyle
                        )}
                    >
                        <div className="p-1 rounded-lg bg-white/70 dark:bg-black/30 shadow-2xs shrink-0">
                            <IconComp size={Math.max(14, Math.round(fontSize * 1.05))} />
                        </div>
                        <h4 
                            style={{ fontSize: `${Math.round(fontSize * 1.08)}px` }}
                            className="font-black tracking-tight"
                        >
                            {headerText}
                        </h4>
                    </div>
                );
            }

            if (line.startsWith('## ')) {
                return (
                    <h3 
                        key={lineIdx} 
                        style={{ fontSize: `${Math.round(fontSize * 1.2)}px` }}
                        className="font-black mt-3 mb-1 text-emerald-800 dark:text-emerald-400 flex items-center gap-1.5"
                    >
                        <Leaf size={Math.max(14, Math.round(fontSize * 1.1))} />
                        {line.replace('## ', '')}
                    </h3>
                );
            }

            if (line.startsWith('# ')) {
                return (
                    <h2 
                        key={lineIdx} 
                        style={{ fontSize: `${Math.round(fontSize * 1.35)}px` }}
                        className="font-black mt-3 mb-1 text-emerald-800 dark:text-emerald-400"
                    >
                        {line.replace('# ', '')}
                    </h2>
                );
            }

            // Từng bước đánh số: "1. ", "2. ", "3. " (Dạng Step-by-step nổi bật trực quan)
            const numMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
            if (numMatch) {
                return (
                    <div 
                        key={lineIdx} 
                        style={{ fontSize: `${fontSize}px`, lineHeight: 1.6 }}
                        className="my-1 py-1 px-2.5 rounded-xl bg-stone-50/70 dark:bg-stone-900/40 border border-stone-200/50 dark:border-white/5 flex items-start gap-2.5"
                    >
                        <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-black text-[11px] flex items-center justify-center shrink-0 select-none shadow-2xs mt-0.5">
                            {numMatch[1]}
                        </span>
                        <div className="flex-1 text-stone-800 dark:text-stone-200">
                            {renderBoldSpans(numMatch[2])}
                        </div>
                    </div>
                );
            }

            // Dòng Sản phẩm 1, Sản phẩm 2, Trợ lực trong Bộ phối
            const isProductItem = /^(?:👉|🔥|💥|⚡|•|\-|\*)?\s*(?:Sản phẩm\s*\d+|Trợ lực|Công thức phối|Bộ phối)/i.test(trimmed);
            if (isProductItem) {
                return (
                    <div 
                        key={lineIdx} 
                        style={{ fontSize: `${fontSize}px`, lineHeight: 1.6 }}
                        className="my-1 py-1.5 px-3 rounded-xl bg-amber-500/10 dark:bg-amber-950/30 border border-amber-500/25 flex items-start gap-2 text-stone-800 dark:text-stone-200"
                    >
                        <span className="text-amber-600 dark:text-amber-400 font-black shrink-0 select-none mt-0.5">
                            ⚡
                        </span>
                        <div className="flex-1 font-medium">
                            {renderBoldSpans(trimmed.replace(/^[👉🔥💥⚡•\-\*]+\s*/, ''))}
                        </div>
                    </div>
                );
            }

            // Gạch đầu dòng: "- " hoặc "* " hoặc "+ "
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
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold shrink-0 select-none mt-1">
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
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onPaste={handlePaste}
                    className="bg-white dark:bg-[#07130e] text-stone-900 dark:text-stone-100 border border-emerald-800/20 dark:border-emerald-500/25 rounded-3xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.3)] flex flex-col overflow-hidden select-none ring-1 ring-black/5 dark:ring-white/10 relative"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Drag & Drop Visual Overlay */}
                    {isDraggingImage && (
                        <div className="absolute inset-0 z-[200] bg-emerald-950/90 backdrop-blur-md border-3 border-dashed border-emerald-400 rounded-3xl flex flex-col items-center justify-center p-6 text-white text-center pointer-events-none transition-all">
                            <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-400/50 flex items-center justify-center text-emerald-300 mb-3 shadow-lg shadow-emerald-500/20 animate-bounce">
                                <ImageIcon size={32} />
                            </div>
                            <h4 className="text-base font-black uppercase tracking-wider text-emerald-300">Thả ảnh cây trồng vào đây</h4>
                            <p className="text-xs text-emerald-100/90 mt-1 max-w-[280px]">LyangAI sẽ chẩn đoán triệu chứng sâu bệnh & kê đơn thuốc từ kho ngay lập tức</p>
                        </div>
                    )}
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

                                        {/* Recommended Products Cards - PHƯƠNG ÁN B: Phân Tab Rõ Ràng */}
                                        {msg.recommended_products && msg.recommended_products.length > 0 && (() => {
                                            const allProds = msg.recommended_products;
                                            const targetProds = allProds.filter(p => isTargetProduct(p));
                                            const synergyProds = allProds.filter(p => !isTargetProduct(p));
                                            
                                            // Mặc định chọn tab Đặc trị chính nếu có, ngược lại chọn tất cả
                                            const activeTab = productSubTabs[msg.id] || (targetProds.length > 0 ? 'target' : 'all');
                                            const displayedProds = activeTab === 'target' 
                                                ? targetProds 
                                                : (activeTab === 'synergy' ? synergyProds : allProds);

                                            const inStockCount = displayedProds.filter(p => (p.stock || 0) > 0).length;

                                            return (
                                                <div className="mt-3.5 pt-3 border-t border-stone-200/80 dark:border-white/10 space-y-2.5">
                                                    {/* THANH ĐIỀU HƯỚNG TABS: ĐẶC TRỊ CHÍNH vs PHỐI HỢP TĂNG LỰC */}
                                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1.5 border-b border-emerald-600/15">
                                                        <div className="flex items-center gap-1.5 flex-wrap">
                                                            {targetProds.length > 0 && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setProductSubTabs(prev => ({ ...prev, [msg.id]: 'target' }))}
                                                                    className={cn(
                                                                        "px-2.5 py-1 rounded-xl text-[10.5px] font-black flex items-center gap-1.5 transition-all cursor-pointer",
                                                                        activeTab === 'target'
                                                                            ? "bg-amber-500 text-stone-950 shadow-xs ring-1 ring-amber-600/40"
                                                                            : "bg-black/5 dark:bg-white/5 text-stone-600 dark:text-stone-300 hover:bg-black/10"
                                                                    )}
                                                                >
                                                                    <span>⚡ Thuốc đặc trị chính</span>
                                                                    <span className={cn(
                                                                        "px-1.5 py-0.2 rounded-full text-[9px] font-black",
                                                                        activeTab === 'target' ? "bg-black/20 text-stone-950" : "bg-black/10 dark:bg-white/10"
                                                                    )}>
                                                                        {targetProds.length}
                                                                    </span>
                                                                </button>
                                                            )}
                                                            {synergyProds.length > 0 && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setProductSubTabs(prev => ({ ...prev, [msg.id]: 'synergy' }))}
                                                                    className={cn(
                                                                        "px-2.5 py-1 rounded-xl text-[10.5px] font-black flex items-center gap-1.5 transition-all cursor-pointer",
                                                                        activeTab === 'synergy'
                                                                            ? "bg-emerald-700 text-white shadow-xs ring-1 ring-emerald-800"
                                                                            : "bg-black/5 dark:bg-white/5 text-stone-600 dark:text-stone-300 hover:bg-black/10"
                                                                    )}
                                                                >
                                                                    <span>🔄 Phối hợp tăng lực</span>
                                                                    <span className={cn(
                                                                        "px-1.5 py-0.2 rounded-full text-[9px] font-black",
                                                                        activeTab === 'synergy' ? "bg-white/25 text-white" : "bg-black/10 dark:bg-white/10"
                                                                    )}>
                                                                        {synergyProds.length}
                                                                    </span>
                                                                </button>
                                                            )}
                                                            <button
                                                                type="button"
                                                                onClick={() => setProductSubTabs(prev => ({ ...prev, [msg.id]: 'all' }))}
                                                                className={cn(
                                                                    "px-2 py-1 rounded-xl text-[10px] font-bold transition-all cursor-pointer",
                                                                    activeTab === 'all'
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
                                                            onClick={() => handleAddAllToCart(displayedProds)}
                                                            className="px-2.5 py-1 rounded-lg bg-emerald-700 hover:bg-emerald-600 active:scale-95 text-white text-[10px] font-black flex items-center gap-1 shadow-2xs transition-all shrink-0 cursor-pointer disabled:opacity-40"
                                                            title={`Thêm ${inStockCount} thuốc còn hàng trong tab này vào đơn hàng POS`}
                                                        >
                                                            <ShoppingCart size={11} />
                                                            <span>Thêm {activeTab === 'target' ? 'đặc trị' : (activeTab === 'synergy' ? 'phối hợp' : 'tất cả')} ({inStockCount})</span>
                                                        </button>
                                                    </div>

                                                    {/* DANH SÁCH THUỐC THEO TAB ĐANG CHỌN */}
                                                    <div className="grid grid-cols-1 gap-2 max-h-[420px] overflow-y-auto pr-1 custom-scrollbar">
                                                        {displayedProds.map((prod) => {
                                                            const inStock = (prod.stock || 0) > 0;
                                                            const isAdded = addedProducts[prod.id];
                                                            const isTarget = isTargetProduct(prod);

                                                            return (
                                                                <div 
                                                                    key={prod.id}
                                                                    className={cn(
                                                                        "p-3 rounded-xl border flex flex-col justify-between gap-2 shadow-2xs transition-all",
                                                                        isTarget
                                                                            ? "border-amber-500/30 hover:border-amber-500/50 bg-amber-50/20 dark:bg-[#1a2216]"
                                                                            : "border-emerald-600/15 hover:border-emerald-600/35 bg-emerald-50/40 dark:bg-[#14281f]"
                                                                    )}
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
                                                                                            isTarget
                                                                                                ? 'bg-amber-500/20 text-amber-900 dark:text-amber-200 border-amber-500/40'
                                                                                                : 'bg-emerald-500/15 text-emerald-900 dark:text-emerald-200 border-emerald-500/30'
                                                                                        }`}>
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
                                                                                        ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white cursor-pointer'
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
                        <div className="px-3.5 py-2 border-t border-stone-200 dark:border-white/10 bg-emerald-50/50 dark:bg-[#091811] flex items-center justify-between gap-2 shrink-0">
                            <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar py-0.5">
                                <span className="text-[10px] font-black uppercase text-emerald-800 dark:text-emerald-400 whitespace-nowrap flex items-center gap-1">
                                    <span>📸 Ảnh khám bệnh</span>
                                    <span className="text-[9px] px-1.5 py-0.2 bg-emerald-200/70 dark:bg-emerald-800/60 rounded-full font-black">
                                        {selectedImages.length}/4
                                    </span>
                                </span>
                                {selectedImages.map((img, idx) => (
                                    <div key={idx} className="relative group w-11 h-11 rounded-xl overflow-hidden border-2 border-emerald-500/50 shadow-xs shrink-0 bg-black/5">
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
                            <span className="text-[9.5px] font-bold text-emerald-700/80 dark:text-emerald-400/80 whitespace-nowrap shrink-0 hidden sm:inline-block">
                                Nhấn Gửi để chẩn đoán ngay
                            </span>
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
                                title="Tải ảnh hoặc nhấn Ctrl+V để dán ảnh trực tiếp"
                                className="p-2 rounded-xl bg-stone-100 hover:bg-emerald-50 hover:text-emerald-700 dark:bg-white/10 dark:hover:bg-white/15 text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-white/10 active:scale-95 transition-all shrink-0 cursor-pointer relative group flex items-center gap-1"
                            >
                                <ImageIcon size={16} />
                                <span className="text-[9px] font-black uppercase text-stone-400 dark:text-stone-500 group-hover:text-emerald-600 hidden sm:inline">Ctrl+V</span>
                            </button>

                            <div className="flex-1 relative">
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onPaste={handlePaste}
                                    placeholder={
                                        selectedImages.length > 0
                                            ? "Nhập thêm ghi chú hoặc nhấn Gửi để chẩn đoán bệnh..."
                                            : `${currentModeConfig.placeholder} (Ctrl+V để dán ảnh)`
                                    }
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
                                className="px-4 py-2 rounded-xl bg-stone-300 dark:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-110 active:scale-95 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all shrink-0 cursor-pointer"
                            >
                                <span>{selectedImages.length > 0 && !input.trim() ? 'Khám ảnh' : 'Gửi'}</span>
                                <Send size={12} />
                            </button>
                        </form>
                    </div>
                </m.div>
            )}
        </AnimatePresence>
    );
}
