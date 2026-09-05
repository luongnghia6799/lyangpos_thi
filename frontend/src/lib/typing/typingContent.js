// Kho từ vựng, danh ngôn, ca dao, lời bài hát & từ vựng nghiệp vụ POS thực chiến

export const POS_PRODUCT_WORDS = [
    "phân", "bón", "lá", "đạm", "lân", "kali", "npk", "hữu", "cơ", "vi", "lượng",
    "thuốc", "trừ", "sâu", "bệnh", "rầy", "nấm", "cỏ", "kích", "rễ", "chồi", "hoa", "trái",
    "bao", "50kg", "25kg", "gói", "100g", "500g", "1kg", "chai", "250ml", "500ml", "1l", "can", "5l",
    "hóa", "đơn", "bán", "lẻ", "nhập", "kho", "xuất", "tồn", "công", "nợ", "tiền", "mặt",
    "chuyển", "khoản", "vietqr", "mã", "vạch", "quét", "giá", "sỉ", "chiết", "khấu", "khách", "hàng",
    "nhà", "cung", "cấp", "phiếu", "thu", "chi", "sổ", "quỹ", "kiểm", "kê", "xẻ", "lẻ", "quy", "đổi",
    "lợi", "nhuận", "doanh", "thu", "báo", "cáo", "tổng", "hợp", "đơn", "vị", "tính", "thùng", "bao"
];

export const VIETNAMESE_WORDS = [
    "hoa", "lá", "cây", "nhà", "nước", "sông", "núi", "biển", "trời", "mây",
    "yêu", "thương", "gia", "đình", "ông", "bà", "cha", "mẹ", "con", "cháu",
    "bình", "yên", "hạnh", "phúc", "sức", "khỏe", "an", "lành", "vui", "vẻ",
    "cuộc", "sống", "thời", "gian", "kỷ", "niệm", "quê", "hương", "đất", "nước",
    "mùa", "xuân", "hạ", "thu", "đông", "nắng", "mưa", "gió", "sương", "mai",
    "uống", "trà", "ngắm", "cảnh", "đọc", "sách", "trồng", "hoa", "nuôi", "chim",
    "tâm", "hồn", "thư", "thái", "an", "nhiên", "tự", "tại", "sống", "vui",
    "trí", "tuệ", "kinh", "nghiệm", "truyền", "thống", "đạo", "đức", "nghĩa", "tình",
    "làng", "xóm", "bạn", "bè", "tri", "kỷ", "gặp", "gỡ", "nụ", "cười",
    "thanh", "thản", "bình", "minh", "hoàng", "hôn", "vườn", "xanh", "chim", "hót"
];

export const VIETNAMESE_PROVERBS = [
    "Có công mài sắt có ngày nên kim.",
    "Uống nước nhớ nguồn, ăn quả nhớ kẻ trồng cây.",
    "Lá lành đùm lá rách, lá rách ít đùm lá rách nhiều.",
    "Học thầy không tày học bạn, đi một ngày đàng học một sàng khôn.",
    "Anh em như thể tay chân, rách lành đùm bọc dở hay đỡ đần.",
    "Cây ngay không sợ chết đứng, thật thà là cha quỷ quái.",
    "Một cây làm chẳng nên non, ba cây chụm lại nên hòn núi cao.",
    "Gần mực thì đen, gần đèn thì rạng.",
    "Thuận vợ thuận chồng, tát biển Đông cũng cạn.",
    "Lời nói chẳng mất tiền mua, lựa lời mà nói cho vừa lòng nhau.",
    "Tốt gỗ hơn tốt nước sơn, xấu người đẹp nết còn hơn đẹp người.",
    "Chim khôn kêu tiếng rảnh rang, người khôn nói tiếng dịu dàng dễ nghe.",
    "Bầu ơi thương lấy bí cùng, tuy rằng khác giống nhưng chung một giàn.",
    "Đói cho sạch, rách cho thơm."
];

export const VIETNAMESE_QUOTES = [
    "Sống chậm lại, yêu thương nhiều hơn để thấy cuộc đời thật thanh thản và tươi đẹp.",
    "Sức khỏe là tài sản vô giá, bình an trong tâm hồn là hạnh phúc lớn nhất của đời người.",
    "Mỗi ngày mới là một cơ hội để bắt đầu lại và làm việc hết mình với đam mê.",
    "Thành công trong kinh doanh đến từ sự tận tâm phục vụ và uy tín lâu dài với khách hàng.",
    "Hạnh phúc không phải là có tất cả mọi thứ, mà là biết trân trọng những gì mình đang có.",
    "Một tách trà thơm vào buổi sáng, một ngày làm việc hăng say, cuộc sống giản dị mà tràn đầy ý nghĩa.",
    "Tâm tĩnh lặng như mặt hồ phẳng lặng, mọi quyết định và công việc sẽ tự khắc hanh thông."
];

export const POPULAR_SONGS = [
    {
        id: "diem-xua",
        title: "Diễm Xưa",
        author: "Trịnh Công Sơn",
        genre: "Nhạc Trịnh",
        audioUrl: "https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=lofi-study-112191.mp3",
        lyrics: `Mưa vẫn mưa bay trên tầng tháp cổ
Dài tay em mấy thuở mắt xanh xao
Nghe thu mưa rơi suối mềm vai gầy
Đường dài hun hút cho mắt thêm sâu

Mưa vẫn hay mưa trên hàng lá nhỏ
Buổi chiều ngồi ngóng những chuyến mưa qua
Trên bước chân em âm thầm lá đổ
Chợt hồn xanh buốt cho mình xót xa`
    },
    {
        id: "bien-tinh",
        title: "Biển Tình",
        author: "Lam Phương",
        genre: "Trữ Tình",
        audioUrl: "https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3?filename=relaxed-vlog-131746.mp3",
        lyrics: `Nằm nghe sóng vỗ từng lớp xa
Bọt tràn theo từng làn gió đưa
Một vầng trăng sáng với tình yêu chúng ta
Vượt qua sóng gió tìm đến bờ

Nhìn nhau trao trọn ngàn yêu thương
Dù cho năm tháng có phai mờ
Tình ta như biển rộng bao la
Muôn đời không bao giờ phôi pha`
    },
    {
        id: "bai-ca-dat-phuong-nam",
        title: "Bài Ca Đất Phương Nam",
        author: "Lư Nhất Vũ - Lê Giang",
        genre: "Quê Hương",
        audioUrl: "https://cdn.pixabay.com/download/audio/2022/03/15/audio_c8c8a73467.mp3?filename=melody-of-nature-main-6672.mp3",
        lyrics: `Nhắn ai đi về miền đất phương Nam
Trời xanh mây trắng soi bóng dòng Cửu Long
Mênh mông sông nước xuôi mái chèo êm trôi
Hương tràm ngạt ngào đưa gió bay muôn nơi

Về đây nghe khúc ca dao chan chứa ân tình
Người phương Nam thủy chung son sắt trọn niềm tin
Bao năm dãi dầu một nắng hai sương
Đất mẹ nở hoa đượm thắm tình quê hương`
    },
    {
        id: "que-huong",
        title: "Quê Hương (Thơ)",
        author: "Đỗ Trung Quân",
        genre: "Thơ Ca",
        audioUrl: "https://cdn.pixabay.com/download/audio/2021/08/04/audio_0625c1539c.mp3?filename=peaceful-garden-healing-light-piano-10741.mp3",
        lyrics: `Quê hương là chùm khế ngọt
Cho con trèo hái mỗi ngày
Quê hương là đường đi học
Con về rợp bướm vàng bay

Quê hương là con diều biếc
Tuổi thơ con thả trên đồng
Quê hương là con đò nhỏ
Êm đềm khua nước ven sông`
    }
];

export const TYPING_FONTS = [
    { id: 'space-mono', name: 'Space Mono (Monospace cổ điển)', family: '"Space Mono", monospace', googleName: 'Space Mono' },
    { id: 'roboto-mono', name: 'Roboto Mono (Monkeytype gốc)', family: '"Roboto Mono", monospace', googleName: 'Roboto Mono' },
    { id: 'be-vietnam-pro', name: 'Be Vietnam Pro (Chuẩn Việt)', family: '"Be Vietnam Pro", sans-serif' },
    { id: 'lexend-deca', name: 'Lexend Deca (Chống mỏi mắt)', family: '"Lexend Deca", sans-serif', googleName: 'Lexend Deca' },
    { id: 'lora', name: 'Lora (Trang nhã / Thơ văn)', family: '"Lora", serif', googleName: 'Lora' },
    { id: 'merriweather', name: 'Merriweather (Sách xưa)', family: '"Merriweather", serif', googleName: 'Merriweather' },
    { id: 'comfortaa', name: 'Comfortaa (Bo tròn dễ thương)', family: '"Comfortaa", cursive', googleName: 'Comfortaa' },
    { id: 'inter', name: 'Inter (Hiện đại)', family: '"Inter", sans-serif', googleName: 'Inter' }
];

export function loadGoogleFontDynamically(googleName) {
    if (!googleName) return;
    const fontId = `gfont-${googleName.replace(/\s+/g, '-').toLowerCase()}`;
    if (document.getElementById(fontId)) return;

    const link = document.createElement('link');
    link.id = fontId;
    link.rel = 'stylesheet';
    link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(googleName)}:ital,wght@0,400;0,600;0,700;1,400&display=swap`;
    document.head.appendChild(link);
}

