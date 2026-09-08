// Dịch vụ tìm kiếm lời bài hát online (Tích hợp API LRCLIB mở & fallback kho nhạc phong phú)

export class LyricsService {
    // Tìm kiếm bài hát theo từ khóa
    static async searchOnline(query) {
        if (!query || !query.trim()) return [];

        const cleanQuery = query.trim();
        const results = [];

        try {
            // LRCLIB API mở (miễn phí, không cần token, hỗ trợ tìm kiếm bài hát quốc tế & Việt Nam)
            const response = await fetch(`https://lrclib.net/api/search?q=${encodeURIComponent(cleanQuery)}`);
            if (response.ok) {
                const data = await response.json();
                if (Array.isArray(data) && data.length > 0) {
                    data.slice(0, 10).forEach(item => {
                        const lyrics = item.plainLyrics || (item.syncedLyrics ? this.cleanSyncedLyrics(item.syncedLyrics) : null);
                        if (lyrics && lyrics.trim().length > 20) {
                            results.push({
                                id: `online-${item.id}`,
                                title: item.trackName || item.name,
                                author: item.artistName || "Nghệ sĩ",
                                album: item.albumName || "",
                                lyrics: lyrics
                            });
                        }
                    });
                }
            }
        } catch (e) {
            console.warn("Lỗi khi kết nối LRCLIB API:", e);
        }

        // Tìm kiếm thêm trong kho mở rộng nội bộ
        const localMatches = this.searchLocalExtended(cleanQuery);
        return [...results, ...localMatches];
    }

    // Xóa timestamp [00:12.34] của format synced lyrics
    static cleanSyncedLyrics(synced) {
        return synced.replace(/\[\d{2}:\d{2}\.\d{2,3}\]/g, '').replace(/^\s*[\r\n]/gm, '').trim();
    }

    // Kho bài hát tiếng Việt mở rộng sẵn sàng offline/fallback
    static searchLocalExtended(query) {
        const q = query.toLowerCase();
        const EXTENDED_SONGS = [
            {
                id: "long-me",
                title: "Lòng Mẹ",
                author: "Y Vân",
                lyrics: `Lòng mẹ bao la như biển Thái Bình dạt dào
Tình mẹ tha thiết như dòng suối hiền ngọt ngào
Lời mẹ êm ái như đồng lúa chiều rì rào
Tiếng ru êm đềm trăng tà soi bóng mẹ yêu

Lòng mẹ thương con như vầng trăng tròn mùa thu
Tình mẹ yêu con như biển rộng muôn ngàn trùng
Thương con mẹ dệt ước mơ
Mong con khôn lớn nên người`
            },
            {
                id: "noi-buon-hoa-phuong",
                title: "Nỗi Buồn Hoa Phượng",
                author: "Thanh Sơn",
                lyrics: `Mỗi năm đến hè lòng man mác buồn
Chín mươi ngày qua chứa chan tình thương
Ngày mai xa cách hai đứa hai nơi
Phút gần gũi nhau mất rồi bạn ơi

Tạ từ là hết tiếng ve rộn rã
Cánh phượng hồng rơi thắm đỏ sân trường
Bao nhiêu kỷ niệm tuổi học trò ngây thơ
Giờ đành gửi lại theo gió mây trôi`
            },
            {
                id: "thu-vang",
                title: "Thu Vàng",
                author: "Cung Tiến",
                lyrics: `Chiều hôm qua lang thang trên đường
Hoàng hôn xuống chiều thu vàng úa
Lá thu rơi xào xạc bước chân
Nhớ người em gái tóc mây bồng bềnh

Mùa thu đi qua mang theo nỗi nhớ
Trời cao xanh ngát gió lạnh từng cơn
Tình xưa như lá úa rơi bên thềm
Một thoáng mong manh kỷ niệm êm đềm`
            },
            {
                id: "ao-moi-ca-mau",
                title: "Áo Mới Cà Mau",
                author: "Thanh Sơn",
                lyrics: `Nghe nói Cà Mau xa lắm
Ở cuối cùng bản đồ Việt Nam
Ngại chi đường xa không tới
Về đó nghe khúc dân ca ngọt ngào

Đầm Dơi mây nước mênh mông
Cái Nước Năm Căn rừng đước xanh tươi
Người Cà Mau dễ thương hiếu khách
Về nghe đờn ca tài tử say lòng`
            }
        ];

        return EXTENDED_SONGS.filter(s => 
            s.title.toLowerCase().includes(q) || 
            s.author.toLowerCase().includes(q) ||
            s.lyrics.toLowerCase().includes(q)
        );
    }
}
