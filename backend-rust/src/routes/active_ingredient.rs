use axum::{
    extract::{Query, State},
    response::IntoResponse,
    Json,
};
use chrono::NaiveDateTime;
use serde::{Deserialize, Serialize};
use serde_json::json;
use sqlx::{Row, SqlitePool};

use crate::error::AppError;
use crate::utils::remove_accents;

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct ActiveIngredientResearch {
    pub id: i64,
    pub name: String,
    pub group_name: Option<String>,
    pub role_type: Option<String>,
    pub moa: Option<String>,
    pub targets: Option<String>,
    pub compatible_synergies: Option<String>,
    pub incompatibilities: Option<String>,
    pub features: Option<String>,
    pub keywords: Option<String>,
    pub is_advanced: Option<bool>,
    pub research_source: Option<String>,
    pub created_at: Option<NaiveDateTime>,
    pub updated_at: Option<NaiveDateTime>,
}

#[derive(Debug, Serialize)]
pub struct ResearchedIngredientItem {
    #[serde(flatten)]
    pub research: ActiveIngredientResearch,
    pub product_count: i64,
    pub sample_products: Vec<String>,
}

#[derive(Debug, Deserialize)]
pub struct ListIngredientsQuery {
    pub search: Option<String>,
    pub group: Option<String>,
    pub in_stock_only: Option<bool>,
}

#[derive(Debug, Deserialize)]
pub struct ResearchOneDto {
    pub name: String,
    pub api_key: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateIngredientDto {
    pub name: String,
    pub group_name: Option<String>,
    pub role_type: Option<String>,
    pub moa: Option<String>,
    pub targets: Option<String>,
    pub compatible_synergies: Option<String>,
    pub incompatibilities: Option<String>,
    pub features: Option<String>,
    pub keywords: Option<String>,
    pub is_advanced: Option<bool>,
}

#[derive(Debug, Clone, Serialize)]
pub struct MatchedProductInfo {
    pub id: i64,
    pub name: String,
    pub code: Option<String>,
    pub active_ingredient: Option<String>,
    pub matched_active: String,
    pub unit: Option<String>,
    pub sale_price: f64,
    pub stock: f64,
    pub tier: String,
    pub role_desc: String,
}

#[derive(Debug, Clone, Serialize)]
pub struct MatchedIngredientsContext {
    pub matched_targets: Vec<ActiveIngredientResearch>,
    pub compatible_synergies: Vec<ActiveIngredientResearch>,
    pub all_usable_products: Vec<MatchedProductInfo>,
    pub summary_text: String,
}

// Bảng dữ liệu tri thức dược học nền tảng cho hơn 80+ hoạt chất phổ biến
pub fn get_seed_active_ingredients() -> Vec<(&'static str, &'static str, &'static str, &'static str, &'static str, &'static str, &'static str, &'static str, &'static str, bool)> {
    vec![
        // 1. Nhóm Trừ Nấm Strobilurin & Xanh Lá
        (
            "Azoxystrobin",
            "Trừ Nấm Strobilurin (Ức chế hô hấp Phức hợp III)",
            "Trừ Nấm Phổ Rộng & Dưỡng Xanh Lá",
            "Ức chế sự vận chuyển điện tử trong ty thể tế bào nấm tại vị trí Qo (phức hợp III cytochrome bc1), làm nấm bệnh cạn kiệt năng lượng ATP và chết; ức chế nảy mầm bào tử.",
            "Thán thư, rỉ sắt, đốm lá, lem lép hạt, nấm hồng, lở cổ rễ, đốm trắng/đốm nâu thanh long, phấn trắng",
            "Difenoconazole, Mancozeb, Hexaconazole, Metalaxyl, Kasugamycin, Chlorothalonil",
            "Không pha chung với chất bám dính chứa silicon trên cây mẫn cảm (như táo); tránh pha với thuốc có tính kiềm mạnh.",
            "Nội hấp lưu dẫn mạnh, hiệu ứng AgCelence giúp lá xanh dày, tăng quang hợp, hạt sáng đẹp, tính mát an toàn cho bông và trái non.",
            "azoxystrobin, amistar, thán thư, đốm nâu, đốm trắng, tắc kè, rỉ sắt, nấm hồng, lem lép hạt, xanh lá",
            true
        ),
        (
            "Pyraclostrobin",
            "Trừ Nấm Strobilurin Thế Hệ Mới",
            "Đặc Trị Nấm & Kích Kháng Siêu Xanh Cây",
            "Gắn vào phức hợp III ty thể tế bào nấm, dập tắt hô hấp tế bào nấm nhanh hơn các strobilurin đời đầu; kích hoạt hệ miễn dịch cây trồng sản sinh phytoalexin.",
            "Thán thư, sương mai, đốm vòng, nấm mắt cua, đốm nâu thanh long, rỉ sắt, lở cổ rễ, chết ẻo cây con",
            "Boscalid, Fluxapyroxad, Metiram, Mancozeb, Difenoconazole, Dimethomorph",
            "Không phối với thuốc có tính kiềm mạnh hoặc phân bón lá có hàm lượng đạm tự do quá cao trong giai đoạn nắng gắt.",
            "Hiệu ứng xanh lá vượt trội, tính mát, bám dính bề mặt cực tốt và lưu dẫn mô biểu bì, bảo vệ đọt non và hoa.",
            "pyraclostrobin, cabrio, thán thư, đốm nâu, nấm mắt cua, xanh lá, sương mai, chết ẻo",
            true
        ),
        (
            "Trifloxystrobin",
            "Trừ Nấm Strobilurin Thấm Sâu Dạng Khí (Mesostemic)",
            "Phòng & Trị Nấm Đa Điểm, Chống Mưa Rửa Trôi",
            "Ức chế hô hấp tế bào nấm; cơ chế Mesostemic đặc biệt: thuốc tái phân bố qua pha hơi trên bề mặt mô cây, bám chặt lớp sáp bảo vệ màng ngoài.",
            "Thán thư, phấn trắng, đốm lá, đốm nâu, ghẻ sẹo, lem lép hạt lúa, đạo ôn cổ bông",
            "Tebuconazole, Propineb, Hexaconazole, Kasugamycin, Mancozeb",
            "Tránh phối với dầu khoáng liều cao trên hoa và trái non.",
            "Kháng mưa rửa trôi cực tốt, hiệu lực kéo dài 14-21 ngày, an toàn cho hoa và trái non.",
            "trifloxystrobin, nativo, thán thư, phấn trắng, ghẻ sẹo, lem lép hạt, đốm nâu",
            true
        ),

        // 2. Nhóm Triazole Nội Hấp Dập Dịch
        (
            "Difenoconazole",
            "Trừ Nấm Triazole Nội Hấp Thấm Sâu",
            "Trị Nấm Nội Hấp & Quét Sạch Sợi Nấm",
            "Ức chế enzyme C14-demethylase trong quá trình sinh tổng hợp Ergosterol màng tế bào nấm; làm màng tế bào nấm bị thủng và rách nát.",
            "Thán thư, đốm vằn, đốm nâu thanh long, nấm hồng, ghẻ nhám, rỉ sắt, thối đen cuống trái, thối bông",
            "Azoxystrobin, Propiconazole, Mancozeb, Kasugamycin, Streptomycin, Fosetyl-Aluminium",
            "Hạn chế tăng liều gấp đôi trên hoa đang nở rộ; không phối với hoạt chất thuộc cùng nhóm Triazole nếu không có hướng dẫn.",
            "Nội hấp hai chiều cực mạnh, dập tắt mầm bệnh đã ăn sâu vào trong thịt lá/vỏ trái non, làm khô vết thương trong 24h.",
            "difenoconazole, score, thán thư, đốm nâu, đốm vằn, nấm hồng, thối cuống, ghẻ nhám",
            true
        ),
        (
            "Hexaconazole",
            "Trừ Nấm Triazole Phổ Rộng",
            "Tẩy Nấm Hồng, Rỉ Sắt, Đốm Vằn & Đứng Đọt",
            "Ức chế sinh tổng hợp Ergosterol màng nấm; cô lập và triệt tiêu sợi nấm trong mô biểu bì; có tác dụng làm chậm sinh trưởng nhẹ giúp xanh lá.",
            "Nấm hồng, rỉ sắt, đốm lá mắt cua, lở cổ rễ, thán thư, phấn trắng, lem lép hạt",
            "Mancozeb, Tricyclazole, Kasugamycin, Propineb, Validamycin",
            "Không phun quá liều trên đọt non đang vươn hoặc mắt cua đang nhú vì có thể gây sượng nhẹ.",
            "Chi phí kinh tế, diệt nấm hồng và rỉ sắt rất bén, làm đứng vết bệnh nhanh.",
            "hexaconazole, anvil, nấm hồng, rỉ sắt, đốm vằn, phấn trắng, lở cổ rễ",
            false
        ),
        (
            "Tebuconazole",
            "Trừ Nấm Triazole Thế Hệ Mới",
            "Đặc Trị Đạo Ôn, Thán Thư, Đốm Lá, Rỉ Sắt",
            "Ức chế demethylation sterol nấm; lưu dẫn hướng ngọn cực mạnh, bảo vệ các bộ phận mới mọc của cây trồng.",
            "Thán thư, đạo ôn, đốm nâu, khô vằn, rỉ sắt, thối hạch, chết nhánh",
            "Trifloxystrobin, Azoxystrobin, Mancozeb, Fosetyl-Aluminium",
            "Tránh phối với chất kiềm mạnh.",
            "Lưu dẫn mạnh, tính mát hơn các triazole thế hệ cũ khi được phối cùng Strobilurin.",
            "tebuconazole, nativo, thán thư, đạo ôn, khô vằn, rỉ sắt, đốm lá",
            true
        ),
        (
            "Propiconazole",
            "Trừ Nấm Triazole Khô Vết Nhanh",
            "Đặc Trị Đốm Lá, Lem Lép Hạt, Rỉ Sắt",
            "Ức chế tổng hợp ergosterol; chặn đứng sự xâm nhiễm của vòi hút nấm bệnh vào biểu bì tế bào cây.",
            "Lem lép hạt, khô vằn, thán thư, rỉ sắt, vàng rụng lá",
            "Difenoconazole, Mancozeb, Tricyclazole",
            "Có thể gây chùn đọt nhẹ nếu phun trời nắng gắt hoặc quá liều.",
            "Làm khô vết thương siêu tốc, hạt vàng sáng bóng.",
            "propiconazole, tilt, lem lép hạt, khô vằn, rỉ sắt, thán thư",
            false
        ),
        (
            "Tricyclazole",
            "Đặc Trị Đạo Ôn Chuyên Biệt",
            "Thuốc Trừ Đạo Ôn Lá & Đạo Ôn Cổ Bông Số 1",
            "Ức chế sinh tổng hợp sắc tố Melanin trong đĩa áp của nấm đạo ôn, khiến nấm mất khả năng đâm xuyên qua vách tế bào lúa.",
            "Đạo ôn lá (cháy lá), đạo ôn cổ bông, đạo ôn nhánh gié",
            "Hexaconazole, Isoprothiolane, Kasugamycin, Difenoconazole",
            "Không pha chung với hoạt chất có tính kiềm mạnh.",
            "Thuốc hấp thu nhanh trong 1 giờ, mưa sau 1 giờ không giảm hiệu lực; bảo vệ kéo dài suốt giai đoạn trổ nghẹt đến chín.",
            "tricyclazole, beam, đạo ôn, cháy lá, cổ bông, nấm lúa",
            false
        ),

        // 3. Nhóm SDHI Công Nghệ Mới
        (
            "Pydiflumetofen",
            "Trừ Nấm SDHI Thế Hệ Mới Đột Phá",
            "Đặc Trị Thán Thư, Đốm Nâu, Phấn Trắng Đỉnh Cao",
            "Ức chế enzyme Succinate Dehydrogenase (phức hợp II), dập tắt hoàn toàn chu trình hô hấp tế bào nấm ở giai đoạn sớm nhất.",
            "Thán thư kháng thuốc, đốm nâu/đốm trắng thanh long, phấn trắng, mốc xám, đốm mắt cua, thối trái sầu riêng",
            "Difenoconazole, Fludioxonil, Mancozeb, Kasugamycin, Azoxystrobin",
            "Tránh pha với thuốc có pH quá kiềm.",
            "Hiệu lực kéo dài kỷ lục (trên 21 ngày), êm bông, mát trái non, không gây lem vỏ, dập tắt các chủng nấm đã kháng triazole.",
            "pydiflumetofen, miravis, thán thư, đốm nâu, tắc kè, đốm trắng, phấn trắng, mốc xám",
            true
        ),
        (
            "Fluxapyroxad",
            "Trừ Nấm SDHI Carboxamide Tiên Tiến",
            "Trị Nấm Nội Hấp Đa Chiều & Chống Nghẽn Mạch",
            "Khóa chặt thụ thể SDHI của ty thể nấm; lưu dẫn hai chiều cực kỳ linh hoạt xuyên qua lớp sáp cutin vào mạch rây và xylem.",
            "Thán thư, rỉ sắt, đốm nâu, lở cổ rễ, đốm vòng, thối hạch",
            "Pyraclostrobin, Difenoconazole, Metiram, Kasugamycin",
            "Tuân thủ liều khuyến cáo của nhà sản xuất.",
            "Tác động phổ rộng, không tạo vết nám trên trái, bảo vệ hoa trong thời tiết mưa dầm.",
            "fluxapyroxad, sercadis, thán thư, rỉ sắt, đốm nâu, lở cổ rễ",
            true
        ),
        (
            "Fluopyram",
            "Trừ Nấm SDHI & Tuyến Trùng Rễ",
            "Đặc Trị Nấm Đất, Thán Thư, Tuyến Trùng",
            "Tác động phức hợp II SDHI; đồng thời phá hủy hệ năng lượng cơ vận động của tuyến trùng rễ.",
            "Thán thư, tuyến trùng sưng rễ, mốc xám botrytis, thối rễ Fusarium",
            "Trifloxystrobin, Fosetyl-Aluminium, Metalaxyl",
            "Không pha với phân bón lá có tính axit đậm đặc.",
            "Đặc trị kép cả nấm hại trên đọt lẫn tuyến trùng phá hoại đầu rễ tơ.",
            "fluopyram, luna, tuyến trùng, thán thư, thối rễ, mốc xám",
            true
        ),

        // 4. Nhóm Oomycetes (Sương Mai, Nứt Thân Xì Mủ, Thối Rễ Phytophthora)
        (
            "Metalaxyl",
            "Đặc Trị Nấm Thủy Sinh Oomycetes",
            "Đặc Trị Nứt Thân Xì Mủ, Thối Rễ, Sương Mai",
            "Ức chế enzyme RNA polymerase I của nấm Oomycetes, ngăn chặn tổng hợp RNA sợi nấm.",
            "Nứt thân xì mủ sầu riêng/cam quýt, thối rễ chết nhanh hồ tiêu, sương mai cà chua/dưa leo, loét sọc mặt cạo cao su",
            "Mancozeb, Dimethomorph, Fosetyl-Aluminium, Kasugamycin, Cymoxanil",
            "Tránh sử dụng liên tục đơn lẻ nhiều lần trong vụ để ngừa chủng Phytophthora đột biến kháng thuốc.",
            "Lưu dẫn hai chiều cực nhanh (lên ngọn và xuống rễ), làm khô ráo vết xì mủ thân cành sau 2-3 ngày quét.",
            "metalaxyl, ridomil, xì mủ, nứt thân, thối rễ, sương mai, phytophthora, chết nhanh",
            false
        ),
        (
            "Metalaxyl-M",
            "Metalaxyl Tinh Khiết Đồng Phân D",
            "Đặc Trị Phytophthora Hiệu Lực Gấp Đôi",
            "Đồng phân quang học hoạt tính sinh học cao nhất của Metalaxyl; hiệu lực cao gấp đôi ở cùng một hàm lượng hoạt chất.",
            "Nứt thân xì mủ, thối cành thanh long, sương mai, chết ẻo cây con, thối rễ",
            "Mancozeb, Fosetyl-Aluminium, Dimethomorph, Kasugamycin",
            "Không phối với thuốc có tính kiềm mạnh.",
            "Liều lượng thấp hơn, giảm tồn dư cho đất và nông sản, khô vết xì mủ rất nhanh.",
            "metalaxyl-m, mefenoxam, ridomil gold, xì mủ, thối cành, thối rễ, sương mai",
            true
        ),
        (
            "Dimethomorph",
            "Đặc Trị Nấm Sương Mai & Giả Sương Mai",
            "Phá Hủy Vách Tế Bào Nấm Oomycetes",
            "Làm gián đoạn quá trình hình thành vách tế bào nấm ở tất cả các giai đoạn phát triển (bào tử, sợi nấm, bọc bào tử).",
            "Sương mai, thối nhũn do nấm, thối cành thanh long, nứt thân xì mủ, đốm lá Oomycetes",
            "Mancozeb, Kasugamycin, Cymoxanil, Propineb, Metalaxyl",
            "Không pha với thuốc có chứa vôi hoặc bazơ mạnh.",
            "Hiệu lực trị bệnh ăn sâu, chống lờn thuốc chéo với nhóm phenylamide (Metalaxyl).",
            "dimethomorph, thối cành, sương mai, xì mủ, nứt thân, thối rễ",
            false
        ),
        (
            "Fosetyl-Aluminium",
            "Kích Kháng & Nội Hấp Hai Chiều",
            "Đặc Trị Chết Nhanh, Thối Rễ, Xì Mủ, Kích Kháng",
            "Lưu dẫn hai chiều hoàn hảo; vừa ức chế sự nảy mầm của bào tử Phytophthora vừa kích hoạt phản ứng tự vệ miễn dịch toàn thân (SAR) của cây trồng.",
            "Nứt thân xì mủ sầu riêng, thối rễ vàng lá, chết nhanh hồ tiêu, sương mai, thối trái",
            "Mancozeb, Difenoconazole, Kasugamycin, Metalaxyl",
            "Tuyệt đối KHÔNG pha chung với phân bón lá có đạm, Bo hoặc thuốc gốc Đồng, lưu huỳnh, dầu khoáng (dễ gây cháy lá hoặc kết tủa).",
            "Tác động kích kháng tự nhiên cực bền, làm liền sẹo vỏ cây nhanh chóng.",
            "fosetyl-aluminium, aliette, xì mủ, nứt thân, thối rễ, chết nhanh, kích kháng",
            false
        ),
        (
            "Cymoxanil",
            "Đặc Trị Nấm Sương Mai Thấm Sâu Cấp Tốc",
            "Đánh Bay Bào Tử Nấm Trong Vòng 24-48 Giờ",
            "Ngăn cản sự tổng hợp acid nucleic và thẩm thấu màng tế bào nấm; tác động tiếp xúc và thấm sâu sau khi phun 1 giờ.",
            "Sương mai, mốc sương, cháy lá cà chua/khoai tây, thối nhũn thân dưa hấu, thối bông",
            "Mancozeb, Dimethomorph, Propineb, Kasugamycin",
            "Thời gian lưu tồn tương đối ngắn nên thường phối với Mancozeb để bảo vệ kéo dài.",
            "Khả năng chặn dịch tức thời cực bén khi mầm bệnh vừa chớm bùng phát.",
            "cymoxanil, curzate, sương mai, mốc sương, thối nhũn, cháy lá",
            false
        ),

        // 5. Nhóm Tiếp Xúc Bảo Vệ Bề Mặt Phổ Rộng
        (
            "Mancozeb",
            "Trừ Nấm Tiếp Xúc Bảo Vệ Phổ Rộng Số 1",
            "Áo Giáp Ngoài & Phòng Ngừa Đa Điểm",
            "Tác động đa điểm (Multi-site) lên 6 hệ enzyme hô hấp và chuyển hóa của tế bào nấm; hoàn toàn không thể bị nấm lờn thuốc.",
            "Thán thư, sương mai, đốm nâu, rỉ sắt, vàng lá, lem lép hạt, ghẻ nhám, thối cành, đốm mắt cua",
            "Metalaxyl, Difenoconazole, Azoxystrobin, Dimethomorph, Kasugamycin, Cymoxanil",
            "Không phối với thuốc có tính kiềm mạnh (vôi, Booc-đô), thuốc gốc lân hữu cơ hoặc phân bón có Bo nồng độ cao.",
            "Bám dính siêu hạng trên mặt lá, cung cấp thêm vi lượng Mangan (Mn) và Kẽm (Zn) giúp cây quang hợp tốt, lá xanh bóng mỡ màng.",
            "mancozeb, dithane, vàng lá, thán thư, đốm nâu, rỉ sắt, đốm mắt cua, sương mai",
            false
        ),
        (
            "Propineb",
            "Trừ Nấm Tiếp Xúc Bổ Sung Kẽm (Zn++)",
            "Áo Giáp Bảo Vệ Bông & Xanh Dày Lá",
            "Ức chế đa điểm enzyme nấm; phóng thích hàm lượng Kẽm tinh khiết (Zn++) cao dễ hấp thu cho mô cây.",
            "Thán thư, thối nụ hoa, đốm lá, đốm nâu, sương mai, lem lép hạt, rỉ sắt",
            "Difenoconazole, Trifloxystrobin, Kasugamycin, Cymoxanil, Azoxystrobin",
            "Không pha với thuốc có tính kiềm mạnh.",
            "Mát bông, êm nụ hoa, tăng thụ phấn hạt phấn, áo giáp bám dính cực dai chống mưa trôi.",
            "propineb, antracol, thán thư, thối bông, đốm lá, rụng bông, rụng trái non",
            false
        ),
        (
            "Chlorothalonil",
            "Trừ Nấm Tiếp Xúc Bám Dính Chống Mưa Số 1",
            "Trị Nấm Bề Mặt Chuyên Trị Mùa Mưa",
            "Liên kết với các nhóm thiol của enzyme nấm, làm rối loạn hoàn toàn quá trình tạo năng lượng của nấm.",
            "Thán thư, đốm vòng, đốm lá, sương mai, ghẻ sẹo, mốc xám, đốm nâu",
            "Azoxystrobin, Difenoconazole, Dimethomorph, Kasugamycin",
            "Không pha với dầu khoáng hoặc chất bám dính dạng dầu trên cây họ cam quýt giai đoạn trái non.",
            "Bám dính bền bỉ số 1 trước những trận mưa lớn, màng thuốc bao bọc bề mặt lá vững chắc.",
            "chlorothalonil, daconil, thán thư, đốm vòng, đốm lá, sương mai, ghẻ sẹo",
            false
        ),
        (
            "Copper Oxychloride",
            "Thuốc Gốc Đồng Trừ Nấm & Khuẩn Phổ Rộng",
            "Sát Khuẩn Rửa Vườn & Trị Nấm Bề Mặt",
            "Ion Đồng (Cu2+) phá vỡ cấu trúc protein và enzyme tế bào nấm khuẩn, làm đông tụ sinh chất vi sinh vật.",
            "Ghẻ loét cam quýt, thối nhũn vi khuẩn, nấm hồng, rỉ sắt, rong rêu địa y thân cây, thán thư",
            "Vôi (pha Booc-đô), Kasugamycin, Streptomycin (cần kiểm tra độ hòa tan)",
            "KHÔNG pha với thuốc vi sinh, thuốc nhóm lân hữu cơ, cúc tổng hợp hoặc hoạt chất nhạy cảm với kim loại nặng.",
            "Rửa vườn sau thu hoạch, dọn sạch rong rêu nấm mốc bám vỏ cây, sát khuẩn vết cắt tỉa cành.",
            "copper oxychloride, coc 85, gốc đồng, ghẻ loét, rửa vườn, rong rêu, nấm hồng",
            false
        ),
        (
            "Copper Hydroxide",
            "Thuốc Gốc Đồng Thế Hệ Mới",
            "Sát Khuẩn & Trừ Nấm Hạt Siêu Mịn",
            "Kích thước hạt cực mịn giúp giải phóng ion Cu2+ đều đặn trên bề mặt lá mà không làm đỏ bông, rộp lá.",
            "Bệnh cháy bìa lá vi khuẩn, loét cam quýt, thối nhũn, đốm rong, thán thư, rỉ sắt",
            "Kasugamycin, Mancozeb (dạng WP/WG)",
            "Không pha chung với hoạt chất tính kiềm quá mạnh hoặc phân bón lá chứa đạm amon cao.",
            "Hạt mịn phân tán đều, ít nóng hơn đồng oxychloride truyền thống.",
            "copper hydroxide, kocide, sát khuẩn, cháy bìa lá, ghẻ loét, loét vi khuẩn",
            false
        ),

        // 6. Nhóm Đặc Trị Vi Khuẩn (Thối Nhũn, Loét, Cháy Bìa Lá)
        (
            "Kasugamycin",
            "Kháng Sinh Nông Nghiệp Đặc Trị Vi Khuẩn & Nấm",
            "Trị Thối Nhũn, Cháy Bìa Lá, Đốm Sọc Vi Khuẩn",
            "Ức chế sự gắn kết của aminoacyl-tRNA vào ribosome 30S của vi khuẩn, ngừng trệ tổng hợp protein vi khuẩn.",
            "Thối nhũn vi khuẩn trên bắp cải/thanh long/hành tỏi, cháy bìa lá lúa, loét sẹo cam quýt, đốm sọc vi khuẩn, đạo ôn lúa",
            "Mancozeb, Difenoconazole, Azoxystrobin, Dimethomorph, Copper Oxychloride, Streptomycin",
            "Tránh pha với dung dịch có tính kiềm quá cao.",
            "Lưu dẫn thấm sâu nhanh, nguồn gốc sinh học an toàn, thời gian cách ly ngắn, dập dịch thối nhũn trong 24h.",
            "kasugamycin, kasumin, thối nhũn, cháy bìa lá, loét vi khuẩn, đốm sọc, thối cành",
            true
        ),
        (
            "Streptomycin sulfate",
            "Kháng Sinh Diệt Khuẩn Mạnh",
            "Đặc Trị Vi Khuẩn Thối Thân, Loét Cành",
            "Gắn vào tiểu đơn vị ribosome 30S vi khuẩn gây đọc sai mã di truyền, làm vi khuẩn sản sinh protein độc tự tiêu diệt.",
            "Thối nhũn bắp cải, héo xanh vi khuẩn, loét vi khuẩn cây có múi, đốm đen cuống bông, thối bẹ",
            "Kasugamycin, Mancozeb, Difenoconazole, Oxytetracycline",
            "Không lạm dụng liều cao tránh vi khuẩn kháng thuốc; không phối với kiềm.",
            "Hạ gục ổ vi khuẩn tức thời, ngăn chặn vết loét xì mủ bốc mùi chua hôi.",
            "streptomycin, thối nhũn, héo xanh, loét cành, loét vi khuẩn, thối thân",
            true
        ),
        (
            "Oxytetracycline Hydrochloride",
            "Kháng Sinh Phổ Rộng Trừ Vi Khuẩn",
            "Đặc Trị Bệnh Vàng Lá Greening & Loét Vi Khuẩn",
            "Ức chế tổng hợp protein vi khuẩn gram âm và gram dương tại ribosome 30S.",
            "Loét cành cam quýt, thối nhũn hoa quả, héo rũ vi khuẩn, cháy bìa lá",
            "Streptomycin, Kasugamycin, Mancozeb",
            "Không pha với thuốc có pH kiềm cao.",
            "Hiệu quả cao khi kết hợp đòn kép với Streptomycin.",
            "oxytetracycline, vi khuẩn, thối nhũn, loét cành, héo rũ, cháy lá",
            false
        ),
        (
            "Bismerthiazol",
            "Đặc Trị Vi Khuẩn Nội Hấp Lưu Dẫn",
            "Đặc Trị Bạc Lá / Cháy Bìa Lá Vi Khuẩn Lúa",
            "Can thiệp vào quá trình phân chia tế bào vi khuẩn Xanthomonas, làm hỏng vách ngăn tế bào.",
            "Cháy bìa lá (bạc lá) vi khuẩn, đốm sọc vi khuẩn, loét vi khuẩn cây ăn trái",
            "Kasugamycin, Tricyclazole, Hexaconazole, Mancozeb",
            "Không phối với kiềm mạnh.",
            "Lưu dẫn bảo vệ toàn bộ gân lá, chặn đứng hiện tượng cháy khô bìa lá mùa mưa bão.",
            "bismerthiazol, xantocid, cháy bìa lá, bạc lá, đốm sọc, loét vi khuẩn",
            false
        ),
        (
            "Validamycin",
            "Thuốc Kháng Sinh Trừ Nấm Khô Vằn & Nấm Đất",
            "Đặc Trị Khô Vằn, Lở Cổ Rễ, Nấm Hồng",
            "Ức chế enzyme trehalase ở sợi nấm đang sinh trưởng, làm nấm mất nguồn năng lượng đường trehalose và tiêu biến đầu sợi nấm.",
            "Đốm vằn (khô vằn) lúa, lở cổ rễ cây con, nấm hồng cao su/sầu riêng, thối hạch",
            "Hexaconazole, Tricyclazole, Mancozeb, Difenoconazole",
            "Không pha chung với chất có tính kiềm mạnh.",
            "Nguồn gốc sinh học lên men an toàn, không để lại dư lượng độc hại, làm teo tóp hạch nấm nhanh.",
            "validamycin, validacin, khô vằn, đốm vằn, lở cổ rễ, nấm hồng",
            false
        ),

        // 7. Nhóm Đặc Trị Bọ Trĩ & Sâu Kháng Thuốc (Spinosyn & Pyrrole)
        (
            "Spinetoram",
            "Đặc Trị Bọ Trĩ & Sâu Cuốn Lá Thế Hệ Mới (Spinosyn)",
            "Đòn Hạ Gục Bọ Trĩ Kháng Thuốc Số 1",
            "Tác động lên vị trí allosteric nicotinic acetylcholine (nAChR) và thụ thể GABA; làm tế bào thần kinh côn trùng hưng phấn tột độ, co giật tê liệt và chết trong vòng vài chục phút.",
            "Bọ trĩ (bù lạch) hại thanh long/xoài/ớt/lúa, sâu cuốn lá, sâu tơ, sâu đục trái, sâu keo mùa thu, giòi đục lá",
            "Lufenuron, Chlorfenapyr, Spirotetramat, Thiamethoxam, Emamectin, Dầu khoáng",
            "Không pha với thuốc có tính kiềm đậm đặc; nên luân phiên hoạt chất sau 2 cữ phun.",
            "Nguồn gốc sinh học lên men tự nhiên, hạ gục cực nhanh các dòng bọ trĩ đã kháng neonicotinoid, an toàn cho hoa và thiên địch.",
            "spinetoram, radiant, bọ trĩ, sâu cuốn lá, sâu tơ, sâu đục trái, sâu keo, bù lạch",
            true
        ),
        (
            "Chlorfenapyr",
            "Thuốc Trừ Sâu Nhóm Pyrrole (Tách Rời Chuỗi Phosphoryl Hóa)",
            "Hạ Gục Sâu Tơ, Bọ Trĩ, Nhện Đỏ Lờn Thuốc",
            "Chuyển hóa thành dạng độc trong cơ thể sâu, tách rời chuỗi photphoryl hóa trong ty thể khiến sâu không thể tổng hợp ATP năng lượng; sâu ngừng cắn phá tức thì.",
            "Sâu tơ kháng thuốc, bọ trĩ lờn thuốc, sâu khoang, sâu xanh da láng, nhện đỏ, sâu đục thân",
            "Lufenuron, Spinetoram, Emamectin benzoate, Abamectin, Spirotetramat",
            "Cần chú ý phun sáng sớm hoặc chiều mát; hạn chế phun vào buổi trưa nắng gắt trên nụ hoa mẫn cảm.",
            "Hiệu lực diệt sâu kháng thuốc cực kỳ bền bỉ, bẻ gãy mọi cơ chế lờn thuốc của sâu họ ngài.",
            "chlorfenapyr, pirate, sâu tơ, sâu khoang, sâu xanh, bọ trĩ, sâu đục thân",
            true
        ),
        (
            "Metaflumizone",
            "Thuốc Trừ Sâu Nhóm Semicarbazone",
            "Đặc Trị Sâu Xanh, Sâu Tơ, Sâu Khoang, Sâu Đục Quả",
            "Ức chế kênh ion natri (sodium channel blocker) ở hệ thần kinh côn trùng, làm gián đoạn dẫn truyền xung thần kinh, khiến sâu tê liệt, ngừng ăn và chết.",
            "Sâu xanh, sâu tơ, sâu khoang, sâu đục quả, sâu xanh da láng, bọ trĩ, rệp sáp",
            "Chlorantraniliprole, Emamectin benzoate, Lufenuron, Spinetoram",
            "Không nên pha chung với các thuốc có tính kiềm mạnh hoặc dung dịch chứa đồng nồng độ cao.",
            "Hiệu lực kéo dài, không kháng chéo với nhóm lân hữu cơ, cúc hay carbamate; an toàn cho cây trồng và thiên địch.",
            "metaflumizone, takiwa, sâu xanh, sâu tơ, sâu khoang, sâu đục quả, sâu xanh da láng, semicarbazone",
            true
        ),

        // 8. Nhóm Sâu Diamide Lưu Dẫn Cao Cấp (Bảo Vệ Đọt Non)
        (
            "Chlorantraniliprole",
            "Thuốc Trừ Sâu Nhóm Anthranilic Diamide",
            "Lưu Dẫn Bảo Vệ Đọt Non 14-21 Ngày, Diệt Sâu Đục Thân",
            "Kích hoạt thụ thể Ryanodine làm xả cạn kiệt lượng ion Canxi dự trữ trong tế bào cơ bắp; sâu bị liệt cơ toàn thân, ngừng ăn sau vài phút và chết khô.",
            "Sâu đục thân, sâu cuốn lá, sâu đục trái đậu/cà chua, sâu keo mùa thu, sâu xanh da láng, bọ nhảy",
            "Emamectin benzoate, Thiamethoxam, Lufenuron, Spinetoram",
            "Không cần tăng liều gấp đôi vì thuốc có tính lưu dẫn hướng ngọn bền bỉ kéo dài.",
            "Hiệu lực bảo vệ 14-21 ngày cho chồi đọt non mới nhú; độc tính cực thấp với động vật có vú, ong mật và cá.",
            "chlorantraniliprole, prevathon, virtako, sâu đục thân, sâu cuốn lá, sâu đục trái, sâu keo",
            true
        ),
        (
            "Cyantraniliprole",
            "Diamide Thế Hệ Kế Tiếp (Diệt Cả Chích Hút Lẫn Nhai)",
            "Đặc Trị Sâu Vẽ Bùa, Bọ Phấn Trắng, Sâu Đục Trái",
            "Tác động thụ thể Ryanodine; đồng thời có tác dụng diệt mạnh trên cả nhóm côn trùng chích hút (bọ trĩ, bọ phấn) và sâu nhai.",
            "Sâu vẽ bùa cam quýt, bọ phấn trắng, sâu đục trái, ruồi đục lá, bọ trĩ",
            "Thiamethoxam, Spirotetramat, Lufenuron",
            "Tránh pha chung với chất có pH kiềm cao.",
            "Hấp thu nhanh qua rễ và lá, bảo vệ cơi đọt cam quýt và rau màu toàn diện.",
            "cyantraniliprole, benevia, minecto, sâu vẽ bùa, bọ phấn trắng, sâu đục trái",
            true
        ),
        (
            "Flubendiamide",
            "Thuốc Trừ Sâu Nhóm Phthalamide",
            "Đặc Trị Sâu Cuốn Lá & Sâu Đục Thân Lúa",
            "Kích hoạt thụ thể Ryanodine cơ bắp sâu hại; sâu ngừng ăn ngay lập tức.",
            "Sâu cuốn lá lúa, sâu đục bẹ, sâu đục thân lúa, sâu xanh da láng",
            "Emamectin benzoate, Lufenuron, Tricyclazole",
            "Không pha với thuốc kiềm mạnh.",
            "Tính mát, an toàn cho lúa giai đoạn đòng trổ.",
            "flubendiamide, takumi, sâu cuốn lá, sâu đục thân, sâu đục bẹ",
            true
        ),

        // 9. Nhóm Ức Chế Lột Xác IGR & Diệt Trứng (Cắt Vòng Đời)
        (
            "Lufenuron",
            "Chất Điều Hòa Sinh Trưởng Côn Trùng (IGR Benzoylurea)",
            "Ung Trứng & Ngăn Sâu Lột Xác, Triệt Tiệt Lứa Sau",
            "Ức chế quá trình sinh tổng hợp Chitin cấu tạo nên lớp vỏ cutin của côn trùng; ấu trùng không lột xác được sẽ vỡ bụng chết; làm ung rữa phôi trứng sâu.",
            "Trứng và ấu trùng sâu tơ, sâu khoang, sâu keo mùa thu, sâu cuốn lá, bọ trĩ, rầy phấn trắng",
            "Spinetoram, Chlorfenapyr, Emamectin benzoate, Abamectin, Thiamethoxam",
            "Tác động chậm sau 2-3 ngày lột xác nên BẮT BUỘC phối với hoạt chất hạ gục nhanh (như Spinetoram, Emamectin).",
            "Vũ khí phối trộn số 1 để dập tắt triệt để gối lứa, ngăn sâu bùng phát cữ sau, cắt đứt hoàn toàn vòng đời dịch hại.",
            "lufenuron, match, ung trứng, ức chế lột xác, sâu keo, sâu tơ, bọ trĩ, gối lứa",
            true
        ),
        (
            "Buprofezin",
            "Thuốc Ức Chế Sinh Tổng Hợp Chitin Chuyên Trị Rầy Rệp",
            "Diệt Trứng & Ấu Trùng Rầy Nâu, Rệp Sáp, Bọ Phấn",
            "Ức chế tổng hợp Chitin và ức chế rụng trứng ở con cái; rầy cái trúng thuốc đẻ trứng không nở được; rầy non không lột xác hóa nhộng.",
            "Rầy nâu, rầy lưng trắng, rầy phấn trắng, rệp sáp, bọ trĩ non, rầy xanh",
            "Dinotefuran, Thiamethoxam, Imidacloprid, Clothianidin, Fenobucarb",
            "Hiệu lực chậm đối với rầy trưởng thành nên phải phối chung với thuốc hạ gục nhanh.",
            "Hiệu lực kéo dài đến 20 ngày, dập tắt tận gốc ổ rầy gối lứa.",
            "buprofezin, applaud, rầy nâu, rầy phấn trắng, rệp sáp, ung trứng, rầy xanh",
            false
        ),

        // 10. Nhóm Tiếp Xúc, Vị Độc & Hạ Gục Nhanh
        (
            "Emamectin benzoate",
            "Thuốc Trừ Sâu Sinh Học Bán Tổng Hợp",
            "Đặc Trị Sâu Cuốn Lá, Bọ Trĩ, Sâu Tơ, Sâu Đục Trái",
            "Kích hoạt giải phóng acid gamma-aminobutyric (GABA) phong bế tín hiệu dẫn truyền xung thần kinh; sâu ngừng ăn ngay sau 2 giờ và tê liệt chết.",
            "Sâu cuốn lá, sâu tơ, sâu đục trái, bọ trĩ, sâu xanh, nhện gié, sâu keo",
            "Chlorantraniliprole, Lufenuron, Chlorfenapyr, Thiamethoxam, Spinetoram",
            "Phun vào sáng sớm hoặc chiều mát tránh ánh nắng mặt trời phân hủy thuốc nhanh.",
            "Liều lượng cực thấp, phổ tác động rộng, phân hủy sinh học an toàn, phối trộn hoàn hảo với thuốc lưu dẫn.",
            "emamectin, sâu cuốn lá, sâu tơ, sâu đục trái, bọ trĩ, sâu keo",
            false
        ),
        (
            "Abamectin",
            "Thuốc Trừ Sâu & Trừ Nhện Đỏ Sinh Học",
            "Đặc Trị Nhện Đỏ, Bọ Trĩ, Sâu Vẽ Bùa",
            "Thấm sâu vào nhu mô lá tạo kho dự trữ thuốc; phong bế kênh Cl- thông qua kích thích GABA tế bào thần kinh cơ.",
            "Nhện đỏ, bọ trĩ, sâu vẽ bùa cam quýt, sâu tơ, giòi đục lá, rầy mềm",
            "Hexythiazox, Spirodiclofen, Pyridaben, Emamectin, Dầu khoáng",
            "Tránh phun lúc trời nắng gắt; không pha với thuốc có tính kiềm cao.",
            "Thấm sâu vào bề mặt lá, hiệu lực trừ nhện đỏ và bọ trĩ xuất sắc, chi phí kinh tế.",
            "abamectin, nhện đỏ, bọ trĩ, sâu vẽ bùa, giòi đục lá",
            false
        ),
        (
            "Cartap",
            "Thuốc Trừ Sâu Gốc Cartap Hydrochloride",
            "Đặc Trị Sâu Đục Thân Lúa & Sâu Cuốn Lá",
            "Chuyển hóa thành nereistoxin phong bế thụ thể acetylcholine gây tê liệt cơ bắp.",
            "Sâu đục thân lúa, sâu cuốn lá, bọ xít hôi, sâu keo, rầy nâu",
            "Buprofezin, Tricyclazole, Fenobucarb",
            "Không pha với thuốc có tính kiềm.",
            "Có tác dụng tiếp xúc, vị độc và lưu dẫn; hạ gục nhanh ổ sâu đục thân ẩn sâu trong bẹ lúa.",
            "cartap, padan, sâu đục thân, sâu cuốn lá, bọ xít",
            false
        ),
        (
            "Alpha-cypermethrin",
            "Thuốc Trừ Sâu Nhóm Cúc Tổng Hợp (Pyrethroid)",
            "Đòn Hạ Gục Côn Trùng Tiếp Xúc Tức Thì",
            "Làm chậm quá trình đóng kênh ion Natri ở màng tế bào thần kinh, gây xung đột kích thích thần kinh liên tục khiến côn trùng chết nhanh.",
            "Sâu cuốn lá, sâu khoang, bọ xít muỗi hạt điều/chè, rầy xanh, sâu đục quả, bọ cánh cứng",
            "Chlorpyrifos, Dimethoate, Thiamethoxam, Emamectin",
            "Không phun trên cây đang nở hoa rộ vì có thể xua đuổi ong thụ phấn; tránh ngày nắng gắt.",
            "Hạ gục tức thời sâu hại trúng thuốc trong vòng vài phút; có tính xua đuổi côn trùng bay đến đẻ trứng.",
            "alpha-cypermethrin, fastac, sâu cuốn lá, bọ xít muỗi, rầy xanh, sâu khoang",
            false
        ),
        (
            "Deltamethrin",
            "Cúc Tổng Hợp Thế Hệ Cao",
            "Đặc Trị Sâu Đo, Bọ Xít, Rầy Chổng Cánh",
            "Kích thích liên tục màng sợi trục thần kinh kênh Natri; hạ gục nhanh.",
            "Sâu đo, bọ xít, rầy chổng cánh cam quýt, sâu ăn lá, kiến, bọ rùa hại lá",
            "Thiamethoxam, Imidacloprid, Mancozeb",
            "Tránh nguồn nước có cá, không phun lúc trưa nắng.",
            "Bám dính bề mặt, hiệu ứng xua đuổi và diệt nhanh.",
            "deltamethrin, decis, sâu đo, bọ xít, rầy chổng cánh, sâu ăn lá",
            false
        ),

        // 11. Nhóm Chích Hút Thế Hệ Mới & Lưu Dẫn Hai Chiều
        (
            "Spirotetramat",
            "Thuốc Trừ Rệp Sáp & Chích Hút Lưu Dẫn Hai Chiều",
            "Đặc Trị Rệp Sáp, Rầy Phấn Trắng Trốn Trong Kẽ",
            "Ức chế sinh tổng hợp Lipid (Acetyl-CoA Carboxylase); thuốc lưu dẫn hai chiều toàn diện (cả lên ngọn non và xuống tận đầu rễ tơ).",
            "Rệp sáp hại rễ và cành, rầy phấn trắng, bọ trĩ, rệp vảy, rầy chổng cánh",
            "Spinetoram, Thiamethoxam, Dinotefuran, Dầu khoáng, Buprofezin",
            "Tác động chậm qua việc ngừng sinh sản và ức chế lipid; nên phun khi dịch hại mới chớm hoặc phối thêm thuốc hạ gục.",
            "Thuốc số 1 diệt sạch rệp sáp ẩn trốn sâu trong kẽ nách lá, nụ hoa và rễ dưới lòng đất nhờ lưu dẫn 2 chiều.",
            "spirotetramat, movento, rệp sáp, rầy phấn trắng, rệp vảy, bọ trĩ",
            true
        ),
        (
            "Tolfenpyrad",
            "Thuốc Trừ Bọ Trĩ & Sâu Rầy Nhóm Pyrazole Đột Phá",
            "Đặc Trị Bọ Trĩ, Rệp Muội, Sâu Tơ Kháng Thuốc",
            "Ức chế phức hợp I trong chuỗi hô hấp ty thể của côn trùng; hạ gục nhanh cả ấu trùng và con trưởng thành.",
            "Bọ trĩ kháng thuốc, rệp sáp, rầy mềm, sâu tơ, bọ phấn trắng, rầy bông xoài",
            "Lufenuron, Spinetoram, Thiamethoxam",
            "Tránh phun trên hoa nhạy cảm lúc nắng gắt.",
            "Cơ chế mới dập tắt các ổ bọ trĩ đã kháng thuốc cúc và neonicotinoid.",
            "tolfenpyrad, bọ trĩ, rệp sáp, rầy mềm, sâu tơ, rầy bông",
            true
        ),
        (
            "Diafenthiuron",
            "Đặc Trị Nhện Đỏ, Bọ Trĩ & Bọ Phấn Trắng",
            "Tác Động Kép Diệt Nhện Lẫn Sâu Rầy",
            "Chuyển hóa dưới ánh sáng thành carbodiimide ức chế ATPase ty thể; tê liệt cơ quan hô hấp của nhện và côn trùng chích hút.",
            "Nhện đỏ, bọ phấn trắng, bọ trĩ, sâu tơ, rệp muội",
            "Spirodiclofen, Abamectin, Lufenuron",
            "Tác động mạnh hơn dưới ánh nắng mặt trời; không phun chung với dầu khoáng liều cao.",
            "Đặc trị hiệu quả cùng lúc cả nhện đỏ và côn trùng chích hút lờn thuốc.",
            "diafenthiuron, pegasus, nhện đỏ, bọ phấn trắng, bọ trĩ, sâu tơ",
            true
        ),

        // 12. Nhóm Neonicotinoid Lưu Dẫn Phổ Biến
        (
            "Thiamethoxam",
            "Neonicotinoid Thế Hệ Mới Nội Hấp Hai Chiều",
            "Trừ Rầy, Bọ Trĩ, Rệp Sáp, Sâu Vẽ Bùa",
            "Tác động thụ thể nicotinic acetylcholine hệ thần kinh trung ương; lưu dẫn mạnh qua rễ và mô lá.",
            "Bọ trĩ, rầy nâu, rầy xanh, rầy phấn trắng, rệp sáp, sâu vẽ bùa, bọ nhảy",
            "Spinetoram, Lufenuron, Emamectin, Buprofezin, Chlorantraniliprole",
            "Hạn chế phun trên hoa đang nở rộ để bảo vệ ong thụ phấn.",
            "Tan hoàn toàn trong nước, lưu dẫn thần tốc bảo vệ mầm chồi mới nhú.",
            "thiamethoxam, actara, bọ trĩ, rầy nâu, rầy xanh, rệp sáp, bọ phấn trắng",
            false
        ),
        (
            "Dinotefuran",
            "Neonicotinoid Thế Hệ Thứ 3 (Furanicotinyl)",
            "Đòn Hạ Gục Cực Nhanh Rầy Nâu & Bọ Phấn Trắng",
            "Tác động thụ thể nAChR kiểu mới; tính tan trong nước cao gấp nhiều lần neonicotinoid cũ, ngấm sâu vào dịch nhựa cây nhanh chóng.",
            "Rầy nâu lúa, rầy phấn trắng, rầy xanh, bọ trĩ, rệp sáp, bọ xít hôi",
            "Buprofezin, Pymetrozine, Spinetoram, Lufenuron",
            "Tránh nguồn nước có ong mật.",
            "Hạ gục rầy sau 30 phút, dập dịch rầy nâu cháy rầy ngay tức thì.",
            "dinotefuran, oshin, rầy nâu, rầy phấn trắng, rầy xanh, bọ trĩ, cháy rầy",
            true
        ),
        (
            "Imidacloprid",
            "Neonicotinoid Nội Hấp Bền Bỉ",
            "Đặc Trị Mối, Mọt, Rầy Chích Hút, Bọ Cánh Cứng",
            "Phong bế thụ thể acetylcholine sau synap thần kinh côn trùng.",
            "Rầy nâu, rệp sáp, bọ trĩ, mối đất, sùng trắng gốc rễ, rầy chổng cánh",
            "Buprofezin, Cartap, Mancozeb",
            "Không dùng trên hoa nở rộ.",
            "Lưu dẫn rễ cực tốt, tưới gốc trừ sâu hại đất và rệp sáp rễ bền lâu.",
            "imidacloprid, confidor, rệp sáp, mối đất, rầy nâu, sùng đất",
            false
        ),

        // 13. Nhóm Đặc Trị Nhện Đỏ
        (
            "Spirodiclofen",
            "Thuốc Đặc Trị Nhện Đỏ Nhóm Tetronic Acid",
            "Diệt Sạch Trứng & Nhện Non, Làm Vô Sinh Nhện Trưởng Thành",
            "Ức chế enzyme Acetyl-CoA Carboxylase (ACCase) tổng hợp lipid cơ thể nhện; trứng bị ung rữa không thể nở; nhện cái bị triệt sản.",
            "Nhện đỏ, nhện lông nhung, nhện trắng hại cam quýt, sầu riêng, hoa hồng, chè",
            "Abamectin, Fenpyroximate, Pyridaben, Dầu khoáng",
            "Tác động chậm lên nhện lớn nên cần phối với hoạt chất hạ gục nhện trưởng thành (Abamectin hoặc Pyridaben).",
            "Hiệu lực kéo dài 20-30 ngày, bẻ gãy hoàn toàn tính kháng thuốc của các dòng nhện đỏ cứng đầu.",
            "spirodiclofen, envidor, nhện đỏ, nhện trắng, ung trứng nhện, nhện lông nhung",
            true
        ),
        (
            "Fenpyroximate",
            "Đặc Trị Nhện Đỏ Hạ Gục Nhanh",
            "Đánh Bật Cả Nhện Trưởng Thành Lẫn Ấu Trùng",
            "Ức chế phức hợp I chuỗi vận chuyển điện tử ty thể tế bào nhện; nhện ngừng chích hút ngay và rụng khỏi mặt lá.",
            "Nhện đỏ, nhện gié lúa, nhện trắng, bọ trĩ",
            "Hexythiazox, Spirodiclofen, Dầu khoáng",
            "Phun ướt đều cả mặt dưới lá nơi nhện ẩn nấp.",
            "Hạ gục nhanh sau 1-2 giờ, làm sạch bóng da trái bị nám do nhện.",
            "fenpyroximate, ortus, nhện đỏ, nhện gié, hạ gục nhện, nám da trái",
            true
        ),
        (
            "Hexythiazox",
            "Đặc Trị Ung Trứng & Ấu Trùng Nhện",
            "Khóa Chặt Lứa Nhện Kế Tiếp",
            "Ức chế lột xác và làm ung trứng nhện đỏ; ngăn chặn nhện non phát triển thành con trưởng thành.",
            "Nhện đỏ, nhện trắng, nhện gié",
            "Abamectin, Fenpyroximate, Pyridaben",
            "Phải phối với thuốc diệt nhện lớn để dập dịch tức thì.",
            "An toàn cho thiên địch và cây trồng, hiệu lực bền bỉ.",
            "hexythiazox, nissorun, nhện đỏ, ung trứng nhện, nhện gié",
            false
        ),

        // 14. Nhóm Điều Hòa Sinh Trưởng, Dinh Dưỡng & Trợ Lực
        (
            "Gibberellic Acid (GA3)",
            "Hormone Điều Hòa Sinh Trưởng Cây Trồng (Kéo Dài Tế Bào)",
            "Kéo Đọt, Dài Tai, Phóng Bông, Lớn Trái Thần Tốc",
            "Kích thích sự phân chia và kéo dài tế bào mô phân sinh chồi và quả; phá vỡ trạng thái ngủ nghỉ của mầm hạt.",
            "Vuốt tai thanh long dày xanh, kéo đọt sầu riêng, lớn trái cây ăn trái, vươn lóng mía, trổ thoát đòng lúa",
            "Amino Acid, Bo, Canxi, Brassinolide, Phân bón lá NPK",
            "Tuyệt đối KHÔNG dùng quá liều gây vóng đọt yếu ớt, mỏng vỏ trái hoặc nứt trái; không phun khi cây đang bị bệnh thối nhũn.",
            "Hiệu quả kéo dài tế bào rõ rệt sau 24-48 giờ, giúp tai thanh long xanh dày cứng cáp.",
            "ga3, gibberellic, vuốt tai, lớn trái, kéo đọt, phóng bông, thanh long",
            false
        ),
        (
            "Paclobutrazol",
            "Chất Ức Chế Sinh Trưởng & Xử Lý Ra Hoa Trái Vụ",
            "Hãm Đọt, Già Lá Đồng Loạt, Kích Thích Phân Hóa Mầm Hoa",
            "Ức chế sinh tổng hợp Gibberellin tự nhiên trong cây; kìm hãm sự phát triển sinh dưỡng của chồi lá để chuyển sang sinh sản (phân hóa mầm hoa).",
            "Xử lý ra hoa sầu riêng, xoài, cam quýt trái vụ; chống đổ ngã lúa; cứng cây",
            "Thioure, MKP, Kali Bo, Amino Acid (dùng sau khi đậu trái để giải độc)",
            "Không lạm dụng liều quá cao gây chai đất, suy kiệt bộ rễ và chết nhánh cành; cần tưới xả độc và phục hồi rễ sau vụ.",
            "Công cụ số 1 để ép cây ra hoa đồng loạt theo ý muốn của nhà vườn.",
            "paclobutrazol, xử lý ra hoa, hãm đọt, già lá, ra hoa trái vụ, sầu riêng, xoài",
            false
        ),
        (
            "Brassinolide",
            "Hormone Thực Vật Tự Nhiên Thế Hệ Thứ 6",
            "Chống Sốc Cây, Giải Độc Thuốc, Tăng Đậu Trái",
            "Kích hoạt hệ gen đề kháng stress (hạn, úng, lạnh, ngộ độc thuốc BVTV); thúc đẩy phân chia tế bào hài hòa cả chiều ngang lẫn chiều dọc.",
            "Chống rụng bông và trái non, giải độc phân thuốc, tăng kích thước trái, xanh mướt lá",
            "Bo, Canxi, GA3, Amino Acid, Thuốc BVTV các loại",
            "Có thể phối chung với hầu hết các loại thuốc trừ sâu bệnh và phân bón lá.",
            "Giảm sốc thuốc cực mạnh, giúp bông và trái non chịu đựng được thời tiết khắc nghiệt.",
            "brassinolide, chống sốc, giải độc thuốc, đậu trái, chống rụng, mát cây",
            true
        ),
        (
            "Chitosan",
            "Chất Kích Kháng Sinh Học Chiết Xuất Vỏ Tôm",
            "Áo Giáp Sinh Học, Trừ Nấm Vi Khuẩn & Kích Rễ",
            "Kích hoạt hệ thống phòng thủ tự nhiên SAR của cây trồng sản sinh enzyme Chitinase và Glucanase tiêu diệt mầm bệnh; bao bọc vết thương.",
            "Thối rễ, tuyến trùng, thán thư, thối nhũn, kích rễ cây con, lành vết loét cành",
            "Trichoderma, Amino Acid, Kasugamycin, Mancozeb",
            "Tránh pha với dung dịch có tính kiềm quá mạnh làm kết tủa chitosan.",
            "Hoàn toàn hữu cơ, kích thích bộ rễ phát triển cực mạnh, kháng lại nấm đất.",
            "chitosan, vỏ tôm, kích kháng, thối rễ, tuyến trùng, hữu cơ sinh học",
            false
        ),
        (
            "Amino Acid",
            "Dinh Dưỡng Acid Amin Hấp Thu Nhanh",
            "Phục Hồi Cây Cấp Tốc, Mát Bông, Lớn Trái",
            "Cung cấp trực tiếp các acid amin thiết yếu (Proline, Glycine, Glutamic acid...) giúp cây xây dựng protein tế bào mà không tốn năng lượng tổng hợp.",
            "Cây suy kiệt sau bệnh, sau mưa bão, giai đoạn nuôi trái lớn, dưỡng bông mập cuống",
            "Bo, Canxi, Kẽm, Rong biển, GA3, Thuốc trừ sâu nấm mát cây",
            "Không phối với thuốc có tính kiềm mạnh hoặc thuốc gốc Đồng vô cơ nguyên chất.",
            "Hấp thu trực tiếp qua khí khổng trong 2 giờ, phục hồi bộ lá xanh dày bóng mượt.",
            "amino acid, acid amin, phục hồi cây, dưỡng bông, lớn trái, nuôi trái",
            false
        ),
        (
            "Glufosinate-ammonium",
            "Thuốc Trừ Cỏ Tiếp Xúc Không Chọn Lọc",
            "Diệt Cỏ Khai Hoang, Cỏ Bờ Vườn Gốc Cây An Toàn",
            "Ức chế enzyme Glutamine synthetase; làm tích tụ nồng độ Amoniac độc hại trong tế bào mô cỏ, phá hủy màng lục lạp khiến cỏ vàng cháy khô sau 2-4 ngày.",
            "Cỏ mần trầu, cỏ tranh, cỏ chỉ, cỏ lá rộng, cỏ hòa bản trong vườn cây ăn trái",
            "2,4-D (pha cỏ bờ rào), Diuron, Muối ăn / Dầu khoáng trợ lực",
            "Phun ướt đều thân lá cỏ; tránh phun tạt trực tiếp vào phần vỏ xanh hoặc chồi non của gốc cây trồng.",
            "Không lưu tồn lâu trong đất, không làm hỏng bộ rễ sâu của cây ăn trái như các loại thuốc cỏ lưu dẫn rễ.",
            "glufosinate-ammonium, basta, thuốc trừ cỏ, diệt cỏ, khai hoang, cỏ mần trầu",
            false
        )
    ]
}

// Khởi tạo bảng và nạp seed data
pub async fn init_active_ingredient_knowledge(pool: &SqlitePool) -> anyhow::Result<()> {
    let seeds = get_seed_active_ingredients();
    for s in seeds {
        let (name, group_name, role_type, moa, targets, compatible_synergies, incompatibilities, features, keywords, is_adv) = s;
        sqlx::query(
            r#"
            INSERT INTO active_ingredient_research 
            (name, group_name, role_type, moa, targets, compatible_synergies, incompatibilities, features, keywords, is_advanced, research_source)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'system')
            ON CONFLICT(name) DO UPDATE SET
                group_name = excluded.group_name,
                role_type = excluded.role_type,
                moa = excluded.moa,
                targets = excluded.targets,
                compatible_synergies = excluded.compatible_synergies,
                incompatibilities = excluded.incompatibilities,
                features = excluded.features,
                keywords = excluded.keywords,
                is_advanced = excluded.is_advanced,
                updated_at = CURRENT_TIMESTAMP
            WHERE research_source = 'system'
            "#
        )
        .bind(name)
        .bind(group_name)
        .bind(role_type)
        .bind(moa)
        .bind(targets)
        .bind(compatible_synergies)
        .bind(incompatibilities)
        .bind(features)
        .bind(keywords)
        .bind(is_adv)
        .execute(pool)
        .await?;
    }

    // Tự động quét kho và đăng ký các hoạt chất chưa có trong DB
    let _ = scan_and_register_warehouse_actives(pool).await;

    // Làm sạch các bản ghi warehouse_scan bị gán sai synergy tạp nham trước đây
    let _ = sqlx::query(
        "UPDATE active_ingredient_research 
         SET compatible_synergies = 'Spinetoram, Emamectin benzoate, Thiamethoxam, Lufenuron'
         WHERE compatible_synergies LIKE '%Mancozeb%' AND compatible_synergies LIKE '%Spinetoram%'
           AND (role_type LIKE '%Sâu%' OR role_type LIKE '%Rầy%' OR role_type LIKE '%Nhện%' OR group_name LIKE '%Sâu%' OR group_name LIKE '%Rầy%' OR group_name LIKE '%Nhện%')"
    ).execute(pool).await;

    let _ = sqlx::query(
        "UPDATE active_ingredient_research 
         SET compatible_synergies = 'Mancozeb, Difenoconazole, Azoxystrobin, Kasugamycin'
         WHERE compatible_synergies LIKE '%Mancozeb%' AND compatible_synergies LIKE '%Spinetoram%'"
    ).execute(pool).await;

    // Đảm bảo hoạt chất Metaflumizone trong DB luôn có keyword và đối tượng đặc trị 'sâu xanh'
    let _ = sqlx::query(
        "UPDATE active_ingredient_research 
         SET targets = 'Sâu xanh, sâu tơ, sâu khoang, sâu đục quả, sâu xanh da láng, bọ trĩ, rệp sáp',
             keywords = 'metaflumizone, takiwa, sâu xanh, sâu tơ, sâu khoang, sâu đục quả, sâu xanh da láng, semicarbazone',
             group_name = 'Semicarbazone',
             role_type = 'Trừ Sâu Miệng Nhai Đặc Trị',
             is_advanced = 1
         WHERE LOWER(name) LIKE '%metaflumizone%'"
    ).execute(pool).await;

    Ok(())
}

// Hàm chuẩn hóa bóc tách các hoạt chất từ chuỗi text
pub fn extract_single_actives(raw: &str) -> Vec<String> {
    let mut results = Vec::new();
    for part in raw.split(|c| c == '+' || c == ',' || c == ';' || c == '/') {
        let trimmed = part.trim();
        if trimmed.is_empty() {
            continue;
        }
        let mut clean_words = Vec::new();
        for word in trimmed.split_whitespace() {
            if word.chars().next().map_or(false, |c| c.is_ascii_digit()) {
                break;
            }
            clean_words.push(word);
        }
        let clean_name = if clean_words.is_empty() {
            trimmed.to_string()
        } else {
            clean_words.join(" ")
        };
        let c_trimmed = clean_name.trim();
        if c_trimmed.len() >= 2 && !results.iter().any(|x: &String| x.eq_ignore_ascii_case(c_trimmed)) {
            results.push(c_trimmed.to_string());
        }
    }
    results
}

// Quét toàn bộ sản phẩm trong kho để nhận diện các hoạt chất chưa được nghiên cứu và đăng ký vào DB
pub async fn scan_and_register_warehouse_actives(pool: &SqlitePool) -> anyhow::Result<usize> {
    let rows = sqlx::query("SELECT DISTINCT active_ingredient FROM product WHERE active_ingredient IS NOT NULL AND TRIM(active_ingredient) != ''")
        .fetch_all(pool)
        .await?;

    let mut new_registered_count = 0;

    for r in rows {
        let raw_active: String = r.get("active_ingredient");
        let extracted = extract_single_actives(&raw_active);
        for act in extracted {
            let exists: Option<i64> = sqlx::query_scalar("SELECT id FROM active_ingredient_research WHERE LOWER(name) = LOWER(?)")
                .bind(&act)
                .fetch_optional(pool)
                .await?;

            if exists.is_none() {
                // Tạo bản ghi nghiên cứu ban đầu từ phân loại thông minh
                let info = super::ai::classify_active_ingredient(&act);

                let is_pest_group = info.group_id.starts_with("07_") || info.group_id.starts_with("08_") 
                    || info.group_id.starts_with("09_") || info.group_id.starts_with("10_") 
                    || info.group_id.starts_with("11_") || info.group_id.starts_with("12_") 
                    || info.group_id.starts_with("13_") || info.group_id.starts_with("14_");
                let is_disease_group = info.group_id.starts_with("01_") || info.group_id.starts_with("02_") 
                    || info.group_id.starts_with("03_") || info.group_id.starts_with("04_") 
                    || info.group_id.starts_with("05_") || info.group_id.starts_with("06_");
                let is_weed_group = info.group_id == "16_HERBICIDE";

                let (default_targets, default_synergies) = if is_pest_group {
                    (
                        format!("Phòng trừ sâu hại, rầy rệp, côn trùng chích hút ({})", info.role_type),
                        "Spinetoram, Emamectin benzoate, Thiamethoxam, Lufenuron".to_string()
                    )
                } else if is_disease_group {
                    (
                        format!("Phòng trừ nấm bệnh và vi khuẩn hại cây trồng ({})", info.role_type),
                        "Mancozeb, Difenoconazole, Azoxystrobin, Kasugamycin".to_string()
                    )
                } else if is_weed_group {
                    (
                        "Diệt trừ cỏ dại trên ruộng vườn".to_string(),
                        "Glufosinate, Glyphosate".to_string()
                    )
                } else {
                    (
                        format!("Hỗ trợ sinh trưởng và tăng cường sức đề kháng ({})", info.role_type),
                        "Amino acid, Rong biển, Vi lượng Canxi Bo".to_string()
                    )
                };

                let default_keywords = format!("{}, {}, {}", act.to_lowercase(), info.role_type.to_lowercase(), info.group_name.to_lowercase());

                sqlx::query(
                    r#"
                    INSERT INTO active_ingredient_research 
                    (name, group_name, role_type, moa, targets, compatible_synergies, incompatibilities, features, keywords, is_advanced, research_source)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'warehouse_scan')
                    "#
                )
                .bind(&act)
                .bind(info.group_name)
                .bind(info.role_type)
                .bind(info.moa_desc)
                .bind(&default_targets)
                .bind(&default_synergies)
                .bind("Tránh pha với thuốc có tính kiềm quá mạnh nếu chưa thử nghiệm trước")
                .bind("Hoạt chất bảo vệ thực vật hữu hiệu có sẵn trong kho hàng LyangPOS")
                .bind(&default_keywords)
                .bind(info.is_advanced)
                .execute(pool)
                .await?;

                new_registered_count += 1;
            }
        }
    }

    Ok(new_registered_count)
}

#[derive(Debug, PartialEq, Eq, Clone, Copy)]
pub enum AgriculturalDomain {
    Pest,       // Sâu, bọ trĩ, rầy, rệp, nhện, sâu keo, đục thân, chích hút
    Disease,    // Nấm bệnh, vi khuẩn, thán thư, đốm lá, thối nhũn, rỉ sắt, xì mủ
    Weed,       // Trừ cỏ
    Growth,     // Phân bón, dưỡng, kích rễ, ra hoa, đậu trái
    General,    // Không phân loại rõ ràng
}

pub fn get_ingredient_domain(item: &ActiveIngredientResearch) -> AgriculturalDomain {
    let info = super::ai::classify_active_ingredient(&item.name);
    if info.group_id.starts_with("01_") || info.group_id.starts_with("02_") 
        || info.group_id.starts_with("03_") || info.group_id.starts_with("04_") 
        || info.group_id.starts_with("05_") || info.group_id.starts_with("06_") {
        return AgriculturalDomain::Disease;
    }
    if info.group_id.starts_with("07_") || info.group_id.starts_with("08_") 
        || info.group_id.starts_with("09_") || info.group_id.starts_with("10_") 
        || info.group_id.starts_with("11_") || info.group_id.starts_with("12_") 
        || info.group_id.starts_with("13_") || info.group_id.starts_with("14_") {
        return AgriculturalDomain::Pest;
    }
    if info.group_id == "15_NUTRITION_ADJUVANT" {
        return AgriculturalDomain::Growth;
    }
    if info.group_id == "16_HERBICIDE" {
        return AgriculturalDomain::Weed;
    }

    let group = item.group_name.as_deref().unwrap_or("").to_lowercase();
    let role = item.role_type.as_deref().unwrap_or("").to_lowercase();
    let combined = format!("{} {}", group, role);
    if combined.contains("sâu") || combined.contains("rầy") || combined.contains("rệp") 
        || combined.contains("nhện") || combined.contains("bọ trĩ") || combined.contains("chích hút") {
        return AgriculturalDomain::Pest;
    }
    if combined.contains("nấm") || combined.contains("khuẩn") || combined.contains("bệnh") 
        || combined.contains("thán thư") || combined.contains("thối") {
        return AgriculturalDomain::Disease;
    }
    if combined.contains("cỏ") {
        return AgriculturalDomain::Weed;
    }
    if combined.contains("dưỡng") || combined.contains("sinh trưởng") || combined.contains("phân") {
        return AgriculturalDomain::Growth;
    }

    AgriculturalDomain::General
}

pub fn detect_query_domains(user_query: &str) -> (bool, bool, bool, bool) {
    let q_raw = user_query.to_lowercase();
    let q_no_accents = remove_accents(&q_raw);

    // 1. Nhóm Sâu / Chích hút / Nhện (Pest)
    let pest_keywords = [
        "sau", "bo tri", "ray", "rep", "nhen", "sau keo", "sau duc", "sau to", "sau xanh", 
        "sau cuon", "doi duc", "chich hut", "bo phan", "bo xit", "bo nhay", "ruoi duc", 
        "tuyen trung", "kien", "moi", "an la", "can dot", "can la", "duc trai", "duc than",
        "cuon la", "ray nau", "ray xanh", "ray lung trang", "rep sap", "rep muoi", "nhen do",
        "nhen trang", "nhen gie", "kien vuong", "sung dat", "bo hung"
    ];
    let is_pest = pest_keywords.iter().any(|&k| q_no_accents.contains(k));

    // 2. Nhóm Bệnh Nấm / Vi Khuẩn (Disease)
    let disease_keywords = [
        "benh", "nam", "khuan", "vi khuan", "than thu", "dom la", "dom nau", "dom trang", 
        "dom mat cua", "suong mai", "gia suong mai", "thoi re", "thoi than", "thoi trai", 
        "thoi goc", "thoi nhuon", "nut than", "xi mu", "ghe", "dao on", "lem lep", "lo co re", 
        "phan trang", "ri sat", "chay bi la", "heo xanh", "chet nhanh", "vang la thoi re",
        "chet cham", "loet", "kho van", "seo", "chay la", "nam hong"
    ];
    let is_disease = disease_keywords.iter().any(|&k| q_no_accents.contains(k));

    // 3. Nhóm Cỏ dại (Weed)
    let weed_keywords = [
        "diet co", "tru co", "co mam trau", "co tranh", "co long vuc", "co man chau",
        "co duoi phung", "co chao", "co bui", "co gac", "co tien nay mam", "co hau nay mam"
    ];
    let is_weed = weed_keywords.iter().any(|&k| q_no_accents.contains(k)) || 
        q_no_accents.split_whitespace().any(|w| w == "co");

    // 4. Nhóm Dinh dưỡng / Sinh trưởng (Growth)
    let growth_keywords = [
        "duong", "kich re", "ra hoa", "dau trai", "lon trai", "phan bon", "vi luong", 
        "ga3", "paclo", "amino", "humic", "rong bien", "phuc hoi cay"
    ];
    let is_growth = growth_keywords.iter().any(|&k| q_no_accents.contains(k));

    (is_pest, is_disease, is_weed, is_growth)
}

// Hàm quét keyword câu hỏi và mở rộng tìm kiếm các hoạt chất tương thích + sản phẩm trong kho
pub async fn scan_query_and_find_compatible_options(
    pool: &SqlitePool,
    user_query: &str,
) -> anyhow::Result<MatchedIngredientsContext> {
    let q_lower = user_query.to_lowercase();
    let q_no_accents = remove_accents(&q_lower);

    // Xác định nhóm công dụng chính của câu hỏi
    let (is_pest, is_disease, is_weed, is_growth) = detect_query_domains(user_query);

    // Xác định miền bắt buộc nếu người dùng chỉ hỏi về 1 nhóm công dụng duy nhất
    let required_domain = if is_pest && !is_disease {
        Some(AgriculturalDomain::Pest)
    } else if is_disease && !is_pest {
        Some(AgriculturalDomain::Disease)
    } else if is_weed && !is_pest && !is_disease {
        Some(AgriculturalDomain::Weed)
    } else if is_growth && !is_pest && !is_disease {
        Some(AgriculturalDomain::Growth)
    } else {
        None // Hỏi kết hợp cả sâu lẫn bệnh, hoặc không xác định rõ
    };

    // Danh sách từ cấm generic (không dùng để match keyword tránh match bừa bãi)
    let generic_stopwords = [
        "sau benh", "dich hai", "nong nghiep", "cay trong", "thuoc", "phong tru", 
        "dac tri", "bao ve", "thuc vat", "la", "hoa", "trai", "cay", "vuon", "kho", 
        "hieu qua", "an toan", "dung thuoc", "nhom", "hoat chat", "giai phap", "san pham",
        "chuyen tri", "tri", "diet", "thuoc tru", "thuoc tru sau", "thuoc tru benh"
    ];

    // Trích xuất các đối tượng dịch hại / bệnh hại cụ thể xuất hiện trong câu hỏi của người dùng
    let specific_target_terms = [
        // Sâu hại & Chích hút
        "sau xanh", "sau to", "sau khoang", "sau keo", "sau duc than", "sau duc qua", "sau duc trai",
        "sau cuon la", "sau ve bua", "sau do", "sau rom", "sau gai", "sau duc dot", "sau da lang",
        "bo tri", "bu lach", "ray nau", "ray xanh", "ray lung trang", "ray phan trang", "ray bong",
        "rep sap", "rep muoi", "rep vay", "rep kim", "nhen do", "nhen vang", "nhen gie", "nhen trang",
        "bo xit muoi", "bo xit hoi", "bo hung", "bo nhay", "ruoi duc trai", "ruoi duc la", "gioi duc la",
        "tuyen trung", "kien", "moi",
        // Bệnh Nấm & Vi Khuẩn
        "than thu", "dao on", "chay la", "dom la", "dom mat cua", "dom nau", "dom trang", "kho van",
        "dom van", "lem lep hat", "ri sat", "phan trang", "suong mai", "gia suong mai", "nam hong",
        "thoi nhuon", "thoi re", "thoi trai", "thoi than", "thoi goc", "nut than xi mu", "xi mu", "loet",
        "ghe nham", "ghe seo", "chay bia la", "bac la", "heo xanh", "chet nhanh", "chet cham",
        "vang la thoi re", "lo co re",
        // Cỏ dại
        "co long vuc", "co duoi phung", "co mam trau", "co man chau", "co tranh", "co chao", "co bui"
    ];

    let query_detected_targets: Vec<&'static str> = specific_target_terms
        .iter()
        .filter(|&&term| q_no_accents.contains(term))
        .copied()
        .collect();

    // 1. Lấy toàn bộ danh mục hoạt chất đã nghiên cứu từ database
    let all_researched: Vec<ActiveIngredientResearch> = sqlx::query_as::<_, ActiveIngredientResearch>(
        "SELECT * FROM active_ingredient_research ORDER BY is_advanced DESC, name ASC"
    )
    .fetch_all(pool)
    .await?;

    let mut matched_target_ids: Vec<i64> = Vec::new();
    let mut matched_targets: Vec<ActiveIngredientResearch> = Vec::new();
    let mut synergy_names_to_lookup: Vec<String> = Vec::new();

    // Phân tích từ khóa tìm kiếm (bệnh, sâu, triệu chứng)
    for item in &all_researched {
        let item_domain = get_ingredient_domain(item);

        // BỘ LỌC CÔNG DỤNG CHẶT CHẼ: Nếu câu hỏi chỉ hỏi Sâu, CẤM chọn hoạt chất Nấm/Khuẩn/Cỏ và ngược lại!
        if let Some(req_dom) = required_domain {
            if item_domain != req_dom {
                continue;
            }
        }

        let name_lower = item.name.to_lowercase();
        let targets_lower = item.targets.as_deref().unwrap_or("").to_lowercase();
        let targets_no_accents = remove_accents(&targets_lower);
        let keywords_lower = item.keywords.as_deref().unwrap_or("").to_lowercase();
        let keywords_no_accents = remove_accents(&keywords_lower);

        let mut is_matched = false;

        // Trùng tên trực tiếp hoạt chất
        if q_lower.contains(&name_lower) || q_no_accents.contains(&remove_accents(&name_lower)) {
            is_matched = true;
        }

        // 1. Khớp đối tượng dịch hại cụ thể đã nhận diện trong câu hỏi (ví dụ: 'sau xanh', 'bo tri', 'than thu')
        if !is_matched && !query_detected_targets.is_empty() {
            for &term in &query_detected_targets {
                if targets_no_accents.contains(term) || keywords_no_accents.contains(term) {
                    is_matched = true;
                    break;
                }
            }
        }

        // 2. Khớp từ khóa bệnh hại / triệu chứng (2 chiều)
        if !is_matched {
            let kw_parts = keywords_lower.split(|c| c == ',' || c == ';' || c == '|');
            for kw in kw_parts {
                let kw_clean = kw.trim();
                let kw_clean_no_accents = remove_accents(kw_clean);
                if kw_clean_no_accents.len() >= 3 && !generic_stopwords.contains(&kw_clean_no_accents.as_str()) {
                    if q_lower.contains(kw_clean) || q_no_accents.contains(&kw_clean_no_accents) 
                        || (kw_clean_no_accents.len() >= 4 && q_no_accents.contains(&kw_clean_no_accents)) {
                        is_matched = true;
                        break;
                    }
                }
            }
        }

        // 3. Khớp trong cột targets (đối tượng)
        if !is_matched {
            let target_parts = targets_lower.split(|c| c == ',' || c == ';' || c == '/');
            for tg in target_parts {
                let tg_clean = tg.trim();
                let tg_clean_no_accents = remove_accents(tg_clean);
                if tg_clean_no_accents.len() >= 4 && !generic_stopwords.contains(&tg_clean_no_accents.as_str()) {
                    if q_lower.contains(tg_clean) || q_no_accents.contains(&tg_clean_no_accents) {
                        is_matched = true;
                        break;
                    }
                }
            }
        }

        if is_matched {
            matched_target_ids.push(item.id);
            matched_targets.push(item.clone());

            // Thu thập các hoạt chất phối hợp tương thích (synergies)
            if let Some(ref syn) = item.compatible_synergies {
                for s in syn.split(|c| c == ',' || c == ';' || c == '+') {
                    let s_clean = s.trim();
                    if s_clean.len() >= 3 && !synergy_names_to_lookup.iter().any(|x| x.eq_ignore_ascii_case(s_clean)) {
                        synergy_names_to_lookup.push(s_clean.to_string());
                    }
                }
            }
        }
    }

    // 2. Tìm các hoạt chất tương thích (Synergy Partners) từ database
    let mut compatible_synergies: Vec<ActiveIngredientResearch> = Vec::new();
    for syn_name in &synergy_names_to_lookup {
        for item in &all_researched {
            // LỌC SYNERGY: Hoạt chất tương thích cũng PHẢI cùng nhóm công dụng với câu hỏi!
            if let Some(req_dom) = required_domain {
                if get_ingredient_domain(item) != req_dom {
                    continue;
                }
            }

            if !matched_target_ids.contains(&item.id) 
                && (item.name.eq_ignore_ascii_case(syn_name) || item.name.to_lowercase().contains(&syn_name.to_lowercase()))
                && !compatible_synergies.iter().any(|x| x.id == item.id) 
            {
                compatible_synergies.push(item.clone());
                break;
            }
        }
    }

    // 3. Gom tất cả tên hoạt chất cần tìm thuốc trong kho: gồm cả targets và compatible synergies
    let mut all_compatible_active_names: Vec<(String, String)> = Vec::new(); // (Tên hoạt chất, Phân loại: Target hay Synergy)
    for t in &matched_targets {
        all_compatible_active_names.push((t.name.clone(), "target".to_string()));
    }
    for s in &compatible_synergies {
        all_compatible_active_names.push((s.name.clone(), "synergy".to_string()));
    }

    // 4. Quét TẤT CẢ các sản phẩm trong kho (`product` table) chứa các hoạt chất tương thích này
    let products_rows = sqlx::query(
        r#"
        SELECT id, name, code, active_ingredient, unit, 
               CAST(sale_price AS REAL) as sale_price, 
               CAST(stock AS REAL) as stock
        FROM product
        WHERE is_active = 1
        ORDER BY stock DESC, sale_price ASC
        "#
    )
    .fetch_all(pool)
    .await?;

    let mut all_usable_products: Vec<MatchedProductInfo> = Vec::new();

    for r in products_rows {
        let p_id: i64 = r.get("id");
        let p_name: String = r.get("name");
        let p_code: Option<String> = r.get("code");
        let p_active: Option<String> = r.get("active_ingredient");
        let p_unit: Option<String> = r.get("unit");
        let p_price: f64 = r.get("sale_price");
        let p_stock: f64 = r.get("stock");

        let p_active_str = p_active.as_deref().unwrap_or("").to_lowercase();
        let p_name_lower = p_name.to_lowercase();

        // Kiểm tra xem sản phẩm này có chứa hoạt chất nào trong danh sách target hoặc synergy không
        let mut matched_role = None;
        let mut matched_act_name = String::new();

        for (act_name, role) in &all_compatible_active_names {
            let act_lower = act_name.to_lowercase();
            if p_active_str.contains(&act_lower) || p_name_lower.contains(&act_lower) {
                matched_role = Some(role.as_str());
                matched_act_name = act_name.clone();
                break;
            }
        }

        if let Some(role) = matched_role {
            let tier = if role == "target" {
                if p_stock > 0.0 {
                    "⚡ Bộ phối tăng lực khuyên dùng (Đặc trị chính)".to_string()
                } else {
                    "⚡ Bộ phối tăng lực (Tạm hết kho)".to_string()
                }
            } else {
                if p_stock > 0.0 {
                    "🔄 Lựa chọn tương thích sẵn có trong kho (Hiệp đồng tăng lực)".to_string()
                } else {
                    "🌾 Thuốc luân phiên phòng ngừa (Tạm hết kho)".to_string()
                }
            };

            let role_desc = if role == "target" {
                format!("Chứa hoạt chất đặc trị chính: {}", matched_act_name)
            } else {
                format!("Chứa hoạt chất phối hợp tăng lực / luân phiên: {}", matched_act_name)
            };

            all_usable_products.push(MatchedProductInfo {
                id: p_id,
                name: p_name,
                code: p_code,
                active_ingredient: p_active,
                matched_active: matched_act_name,
                unit: p_unit,
                sale_price: p_price,
                stock: p_stock,
                tier,
                role_desc,
            });
        }
    }

    // 5. Tạo đoạn văn bản tổng kết nghiên cứu để gắn vào System Instruction cho Gemini
    let mut summary_text = String::new();
    if !matched_targets.is_empty() {
        summary_text.push_str("★★★ KẾT QUẢ QUÉT CƠ SỞ DỮ LIỆU DƯỢC HỌC HOẠT CHẤT (DATABASE RESEARCH):\n");
        summary_text.push_str("1. CÁC HOẠT CHẤT ĐẶC TRỊ KHỚP VỚI CÂU HỎI:\n");
        for t in &matched_targets {
            summary_text.push_str(&format!(
                "- Hoạt chất: {} [{}] (Vai trò: {})\n  * Cơ chế (MOA): {}\n  * Đặc tính: {}\n  * Phối hợp tương thích tốt với: {}\n  * Cảnh báo tương kỵ: {}\n",
                t.name,
                t.group_name.as_deref().unwrap_or(""),
                t.role_type.as_deref().unwrap_or(""),
                t.moa.as_deref().unwrap_or(""),
                t.features.as_deref().unwrap_or(""),
                t.compatible_synergies.as_deref().unwrap_or(""),
                t.incompatibilities.as_deref().unwrap_or("Chưa có")
            ));
        }

        if !compatible_synergies.is_empty() {
            summary_text.push_str("\n2. CÁC HOẠT CHẤT PHỐI HỢP TƯƠNG THÍCH ĐƯỢC ĐỀ XUẤT THÊM (SYNERGY PARTNERS):\n");
            for s in &compatible_synergies {
                summary_text.push_str(&format!(
                    "- Hoạt chất tương thích: {} [{}] (Cơ chế: {})\n  * Lợi ích phối hợp: Cộng hưởng tăng lực, bẻ gãy tính lờn thuốc, bảo vệ đọt non/bông.\n",
                    s.name,
                    s.role_type.as_deref().unwrap_or(""),
                    s.moa.as_deref().unwrap_or("")
                ));
            }
        }

        summary_text.push_str(&format!(
            "\n3. DANH SÁCH TẤT CẢ THUỐC TRONG KHO TƯƠNG THÍCH CÓ THỂ SỬ DỤNG (TỔNG CỘNG {} SẢN PHẨM):\n",
            all_usable_products.len()
        ));
        for p in &all_usable_products {
            summary_text.push_str(&format!(
                "- [ID:{}] {} | Hoạt chất: {} | Giá: {:.}đ | Tồn: {}{} | Phân loại: {}\n",
                p.id,
                p.name,
                p.active_ingredient.as_deref().unwrap_or(""),
                p.sale_price,
                p.stock,
                p.unit.as_deref().unwrap_or(""),
                p.tier
            ));
        }
    }

    Ok(MatchedIngredientsContext {
        matched_targets,
        compatible_synergies,
        all_usable_products,
        summary_text,
    })
}

// AI Research một hoạt chất cụ thể sử dụng Gemini API
pub async fn research_ingredient_with_gemini(
    pool: &SqlitePool,
    ingredient_name: &str,
    api_key_override: Option<&str>,
) -> Result<ActiveIngredientResearch, AppError> {
    let mut api_keys: Vec<String> = Vec::new();
    if let Some(k) = api_key_override {
        if !k.trim().is_empty() {
            api_keys.push(k.trim().to_string());
        }
    }

    let setting_keys = ["gemini_api_key", "gemini_api_key_2", "gemini_api_key_3"];
    for sk in setting_keys {
        if let Ok(row) = sqlx::query("SELECT setting_value FROM app_setting WHERE setting_key = ?")
            .bind(sk)
            .fetch_optional(pool)
            .await
        {
            if let Some(r) = row {
                if let Ok(val) = r.try_get::<String, _>("setting_value") {
                    let cleaned = val.trim_matches('"').trim();
                    for part in cleaned.split(|c| c == ',' || c == '\n' || c == ';') {
                        let p = part.trim();
                        if !p.is_empty() && !api_keys.contains(&p.to_string()) {
                            api_keys.push(p.to_string());
                        }
                    }
                }
            }
        }
    }

    if api_keys.is_empty() {
        return Err(AppError::BadRequest("Chưa cấu hình Gemini API Key để thực hiện AI Research hoạt chất".to_string()));
    }

    let prompt = format!(
        r#"Bạn là Chuyên gia Dược học Nông nghiệp & Bảo vệ thực vật cao cấp.
Hãy nghiên cứu chuyên sâu về hoạt chất bảo vệ thực vật / phân bón sau đây: "{}"

Trả về KẾT QUẢ DUY NHẤT dưới dạng mã JSON (không kèm văn bản giải thích thừa thãi) theo đúng cấu trúc sau:
{{
  "name": "{}",
  "group_name": "Phân nhóm hóa học / dược lý (ví dụ: Trừ nấm Strobilurin, Trừ sâu Spinosyn, SDHI...)",
  "role_type": "Vai trò tác động (ví dụ: Đặc trị vi khuẩn, Trừ nấm nội hấp, Hạ gục nhanh, Trừ chích hút...)",
  "moa": "Cơ chế tác động dược lý chi tiết (Mechanism of Action - MOA, thụ thể hoặc chu trình enzyme bị ức chế)",
  "targets": "Danh sách các đối tượng sâu bệnh hại chính (phân cách bằng dấu phẩy, ví dụ: Thán thư, đốm nâu, bọ trĩ, sâu cuốn lá...)",
  "compatible_synergies": "Danh sách các hoạt chất phối hợp tương thích tốt nhất tạo hiệu ứng tăng lực (phân cách bằng dấu phẩy, ví dụ: Mancozeb, Difenoconazole, Kasugamycin)",
  "incompatibilities": "Cảnh báo tương kỵ, các chất không được pha chung (ví dụ: tính kiềm mạnh, vôi, đồng...)",
  "features": "Các đặc tính ưu việt nổi trội (tính mát êm bông, lưu dẫn hai chiều, bám dính chống mưa...)",
  "keywords": "Các từ khóa tìm kiếm liên quan (tên bệnh, triệu chứng, tên cây trồng phổ biến, tên thương mại quen thuộc)",
  "is_advanced": true
}}
"#,
        ingredient_name, ingredient_name
    );

    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(20))
        .build()
        .unwrap_or_else(|_| reqwest::Client::new());

    let models = ["gemini-3.5-flash-lite"];
    let mut json_result: Option<serde_json::Value> = None;

    'outer: for key in &api_keys {
        for model in models {
            let url = format!(
                "https://generativelanguage.googleapis.com/v1beta/models/{}:generateContent?key={}",
                model, key
            );

            let body = json!({
                "contents": [{
                    "role": "user",
                    "parts": [{ "text": prompt }]
                }],
                "generationConfig": {
                    "temperature": 0.2,
                    "responseMimeType": "application/json"
                }
            });

            if let Ok(resp) = client.post(&url).json(&body).send().await {
                if resp.status().is_success() {
                    if let Ok(res_val) = resp.json::<serde_json::Value>().await {
                        if let Some(text) = res_val
                            .get("candidates")
                            .and_then(|c| c.get(0))
                            .and_then(|c0| c0.get("content"))
                            .and_then(|cnt| cnt.get("parts"))
                            .and_then(|p| p.get(0))
                            .and_then(|p0| p0.get("text"))
                            .and_then(|t| t.as_str())
                        {
                            let clean = text.trim();
                            if let Ok(parsed) = serde_json::from_str::<serde_json::Value>(clean) {
                                json_result = Some(parsed);
                                break 'outer;
                            }
                        }
                    }
                }
            }
        }
    }

    let parsed = json_result.ok_or_else(|| {
        AppError::Internal(anyhow::anyhow!("Không thể nhận kết quả nghiên cứu hoạt chất từ Gemini API"))
    })?;

    let name = parsed.get("name").and_then(|v| v.as_str()).unwrap_or(ingredient_name);
    let group_name = parsed.get("group_name").and_then(|v| v.as_str()).unwrap_or("");
    let role_type = parsed.get("role_type").and_then(|v| v.as_str()).unwrap_or("");
    let moa = parsed.get("moa").and_then(|v| v.as_str()).unwrap_or("");
    let targets = parsed.get("targets").and_then(|v| v.as_str()).unwrap_or("");
    let compatible_synergies = parsed.get("compatible_synergies").and_then(|v| v.as_str()).unwrap_or("");
    let incompatibilities = parsed.get("incompatibilities").and_then(|v| v.as_str()).unwrap_or("");
    let features = parsed.get("features").and_then(|v| v.as_str()).unwrap_or("");
    let keywords = parsed.get("keywords").and_then(|v| v.as_str()).unwrap_or("");
    let is_advanced = parsed.get("is_advanced").and_then(|v| v.as_bool()).unwrap_or(false);

    sqlx::query(
        r#"
        INSERT INTO active_ingredient_research 
        (name, group_name, role_type, moa, targets, compatible_synergies, incompatibilities, features, keywords, is_advanced, research_source, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'gemini', CURRENT_TIMESTAMP)
        ON CONFLICT(name) DO UPDATE SET
            group_name = excluded.group_name,
            role_type = excluded.role_type,
            moa = excluded.moa,
            targets = excluded.targets,
            compatible_synergies = excluded.compatible_synergies,
            incompatibilities = excluded.incompatibilities,
            features = excluded.features,
            keywords = excluded.keywords,
            is_advanced = excluded.is_advanced,
            research_source = 'gemini',
            updated_at = CURRENT_TIMESTAMP
        "#
    )
    .bind(name)
    .bind(group_name)
    .bind(role_type)
    .bind(moa)
    .bind(targets)
    .bind(compatible_synergies)
    .bind(incompatibilities)
    .bind(features)
    .bind(keywords)
    .bind(is_advanced)
    .execute(pool)
    .await?;

    let record = sqlx::query_as::<_, ActiveIngredientResearch>(
        "SELECT * FROM active_ingredient_research WHERE LOWER(name) = LOWER(?)"
    )
    .bind(name)
    .fetch_one(pool)
    .await?;

    Ok(record)
}

// ----------------- HANDLERS -----------------

// GET /api/active-ingredients/researched
pub async fn get_researched_ingredients(
    State(pool): State<SqlitePool>,
    Query(query): Query<ListIngredientsQuery>,
) -> Result<impl IntoResponse, AppError> {
    let mut sql = String::from("SELECT * FROM active_ingredient_research WHERE 1=1 ");
    if let Some(ref s) = query.search {
        if !s.trim().is_empty() {
            sql.push_str(&format!(
                "AND (LOWER(name) LIKE '%{}%' OR LOWER(targets) LIKE '%{}%' OR LOWER(keywords) LIKE '%{}%' OR LOWER(group_name) LIKE '%{}%') ",
                s.to_lowercase().replace('\'', "''"),
                s.to_lowercase().replace('\'', "''"),
                s.to_lowercase().replace('\'', "''"),
                s.to_lowercase().replace('\'', "''")
            ));
        }
    }
    if let Some(ref g) = query.group {
        if !g.trim().is_empty() && g != "all" {
            sql.push_str(&format!("AND LOWER(group_name) LIKE '%{}%' ", g.to_lowercase().replace('\'', "''")));
        }
    }
    sql.push_str("ORDER BY is_advanced DESC, name ASC");

    let list: Vec<ActiveIngredientResearch> = sqlx::query_as(&sql).fetch_all(&pool).await?;

    // Đếm số lượng sản phẩm kho dùng hoạt chất này
    let mut items = Vec::new();
    for r in list {
        let pattern = format!("%{}%", r.name.to_lowercase());
        let count_row: (i64,) = sqlx::query_as(
            "SELECT COUNT(*) FROM product WHERE is_active = 1 AND LOWER(active_ingredient) LIKE ?"
        )
        .bind(&pattern)
        .fetch_one(&pool)
        .await
        .unwrap_or((0,));

        if query.in_stock_only.unwrap_or(false) && count_row.0 == 0 {
            continue;
        }

        let sample_prods: Vec<String> = sqlx::query_scalar(
            "SELECT name FROM product WHERE is_active = 1 AND LOWER(active_ingredient) LIKE ? LIMIT 3"
        )
        .bind(&pattern)
        .fetch_all(&pool)
        .await
        .unwrap_or_default();

        items.push(ResearchedIngredientItem {
            research: r,
            product_count: count_row.0,
            sample_products: sample_prods,
        });
    }

    Ok(Json(json!({
        "success": true,
        "total": items.len(),
        "data": items
    })))
}

// POST /api/active-ingredients/researched/sync
pub async fn sync_and_research_warehouse(
    State(pool): State<SqlitePool>,
) -> Result<impl IntoResponse, AppError> {
    let _ = init_active_ingredient_knowledge(&pool).await.map_err(|e| {
        AppError::Internal(anyhow::anyhow!("Lỗi khởi tạo tri thức hoạt chất: {}", e))
    })?;

    let count = scan_and_register_warehouse_actives(&pool).await.map_err(|e| {
        AppError::Internal(anyhow::anyhow!("Lỗi quét hoạt chất kho: {}", e))
    })?;

    let total: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM active_ingredient_research")
        .fetch_one(&pool)
        .await?;

    Ok(Json(json!({
        "success": true,
        "new_registered": count,
        "total_researched": total.0,
        "message": format!("Đã đồng bộ cơ sở dữ liệu hoạt chất kho! Hiện có {} hoạt chất được nghiên cứu dược học trong hệ thống.", total.0)
    })))
}

// POST /api/active-ingredients/researched/research-one
pub async fn research_single_ingredient_handler(
    State(pool): State<SqlitePool>,
    Json(payload): Json<ResearchOneDto>,
) -> Result<impl IntoResponse, AppError> {
    let name = payload.name.trim();
    if name.is_empty() {
        return Err(AppError::BadRequest("Tên hoạt chất không được để trống".to_string()));
    }

    let result = research_ingredient_with_gemini(&pool, name, payload.api_key.as_deref()).await?;

    Ok(Json(json!({
        "success": true,
        "data": result,
        "message": format!("Đã nghiên cứu và lưu trữ thành công tri thức dược học cho hoạt chất '{}'", name)
    })))
}

// POST /api/active-ingredients/researched/update
pub async fn update_researched_ingredient_handler(
    State(pool): State<SqlitePool>,
    Json(payload): Json<UpdateIngredientDto>,
) -> Result<impl IntoResponse, AppError> {
    let name = payload.name.trim();
    if name.is_empty() {
        return Err(AppError::BadRequest("Tên hoạt chất không được để trống".to_string()));
    }

    sqlx::query(
        r#"
        UPDATE active_ingredient_research SET
            group_name = COALESCE(?, group_name),
            role_type = COALESCE(?, role_type),
            moa = COALESCE(?, moa),
            targets = COALESCE(?, targets),
            compatible_synergies = COALESCE(?, compatible_synergies),
            incompatibilities = COALESCE(?, incompatibilities),
            features = COALESCE(?, features),
            keywords = COALESCE(?, keywords),
            is_advanced = COALESCE(?, is_advanced),
            research_source = 'user',
            updated_at = CURRENT_TIMESTAMP
        WHERE LOWER(name) = LOWER(?)
        "#
    )
    .bind(payload.group_name)
    .bind(payload.role_type)
    .bind(payload.moa)
    .bind(payload.targets)
    .bind(payload.compatible_synergies)
    .bind(payload.incompatibilities)
    .bind(payload.features)
    .bind(payload.keywords)
    .bind(payload.is_advanced)
    .bind(name)
    .execute(&pool)
    .await?;

    let record = sqlx::query_as::<_, ActiveIngredientResearch>(
        "SELECT * FROM active_ingredient_research WHERE LOWER(name) = LOWER(?)"
    )
    .bind(name)
    .fetch_optional(&pool)
    .await?
    .ok_or_else(|| AppError::NotFound(format!("Không tìm thấy hoạt chất '{}'", name)))?;

    Ok(Json(json!({
        "success": true,
        "data": record,
        "message": format!("Đã cập nhật thông tin dược học cho hoạt chất '{}'", name)
    })))
}
