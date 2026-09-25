use axum::{
    extract::State,
    response::IntoResponse,
    Json,
};
use serde::{Deserialize, Serialize};
use serde_json::json;
use sqlx::{Row, SqlitePool};

use crate::error::AppError;

#[derive(Debug, Deserialize)]
pub struct ChatMessage {
    pub role: String, // "user" or "model" / "assistant"
    pub text: String,
}

#[derive(Debug, Deserialize)]
pub struct AiConsultRequest {
    pub message: String,
    pub history: Option<Vec<ChatMessage>>,
    pub images: Option<Vec<String>>,
    pub api_key: Option<String>,
    pub mode: Option<String>, // "crop_doctor" | "app_analytics" | "general_assistant"
}

#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct ProductContext {
    pub id: i64,
    pub name: String,
    pub code: Option<String>,
    pub unit: Option<String>,
    pub sale_price: Option<f64>,
    pub stock: Option<f64>,
    pub active_ingredient: Option<String>,
    pub brand: Option<String>,
}

async fn build_app_analytics_context(pool: &SqlitePool, user_query: Option<&str>) -> String {
    super::ai_analytics::build_app_analytics_context(pool, user_query).await
}

#[derive(Debug, Clone)]
pub struct ActiveIngredientInfo {
    pub group_id: &'static str,
    pub group_name: &'static str,
    pub role_type: &'static str,
    pub moa_desc: &'static str,
    pub is_advanced: bool,
}

pub fn classify_active_ingredient(name: &str) -> ActiveIngredientInfo {
    let lower = name.to_lowercase();

    // 1. Thuốc trừ vi khuẩn (Thối nhũn, loét, cháy bìa lá, đốm sọc)
    let bactericide_keys = [
        "kasugamycin", "kasumin", "streptomycin", "ningnanmycin", "bismerthiazol",
        "xantocid", "oxolinic", "starner", "oxytetracycline", "bronopol", "nano bac",
        "nano dong", "chitosan", "thiodiazole copper", "validamycin"
    ];
    if bactericide_keys.iter().any(|&k| lower.contains(k)) {
        return ActiveIngredientInfo {
            group_id: "01_BACTERICIDE",
            group_name: "Đặc Trị Vi Khuẩn Cây Trồng (Thối nhũn, loét cành, cháy bìa lá)",
            role_type: "Đặc Trị Vi Khuẩn",
            moa_desc: "Ức chế tổng hợp protein hoặc phá vỡ vách tế bào vi khuẩn. Đặc trị vết loét, thối nhũn, đốm sọc vi khuẩn. Bắt buộc phối hợp với thuốc nấm khi vết bệnh có dấu hiệu nhiễm khuẩn đôi.",
            is_advanced: lower.contains("kasugamycin") || lower.contains("streptomycin") || lower.contains("ningnanmycin"),
        };
    }

    // 2. Thuốc trừ nấm - SDHI & Công nghệ mới tiên tiến (Thán thư, đốm nâu/đốm trắng, rỉ sắt)
    let sdhi_keys = [
        "pydiflumetofen", "miravis", "fluxapyroxad", "sercadis", "fluopyram", "luna",
        "boscalid", "cantus", "thifluzamide", "isopyrazam", "bixafen", "sedaxane",
        "benzovindiflupyr", "penflufen"
    ];
    if sdhi_keys.iter().any(|&k| lower.contains(k)) {
        return ActiveIngredientInfo {
            group_id: "02_FUNGICIDE_SDHI",
            group_name: "Trừ Nấm SDHI & Công Nghệ Mới (Đặc trị thán thư, đốm nâu/đốm trắng thanh long)",
            role_type: "Trừ Nấm SDHI Cao Cấp",
            moa_desc: "Ức chế enzyme Succinate Dehydrogenase (phức hợp II), dập tắt hoàn toàn hô hấp tế bào nấm. Hiệu lực cực mạnh, lưu dẫn kéo dài, tính mát êm bông không gây teo đọt hay nám trái non.",
            is_advanced: true,
        };
    }

    // 3. Thuốc trừ nấm - Triazole nội hấp thấm sâu
    let triazole_keys = [
        "difenoconazole", "score", "hexaconazole", "anvil", "tebuconazole", "nativo",
        "propiconazole", "tilt", "epoxiconazole", "tetraconazole", "paclobutrazol",
        "cyproconazole", "flusilazole", "myclobutanil", "triadimefon"
    ];
    if triazole_keys.iter().any(|&k| lower.contains(k)) {
        return ActiveIngredientInfo {
            group_id: "03_FUNGICIDE_TRIAZOLE",
            group_name: "Trừ Nấm Triazole Nội Hấp Thấm Sâu (Diệt sợi nấm ẩn sâu trong mô cây)",
            role_type: "Trừ Nấm Nội Hấp",
            moa_desc: "Ức chế sinh tổng hợp Ergosterol màng tế bào nấm. Lưu dẫn nội hấp mạnh hai chiều, dập dịch thán thư, đốm lá, nấm hồng, lem lép hạt; chặn đứng mầm bệnh đang phát triển.",
            is_advanced: lower.contains("tebuconazole") || lower.contains("difenoconazole"),
        };
    }

    // 4. Thuốc trừ nấm - Strobilurin kích hoạt xanh lá
    let strobi_keys = [
        "azoxystrobin", "amistar", "pyraclostrobin", "cabrio", "trifloxystrobin",
        "kresoxim", "picoxystrobin", "dimoxystrobin"
    ];
    if strobi_keys.iter().any(|&k| lower.contains(k)) {
        return ActiveIngredientInfo {
            group_id: "04_FUNGICIDE_STROBILURIN",
            group_name: "Trừ Nấm Strobilurin & Kích Hoạt Xanh Lá (Phổ rộng, phòng & trị nấm)",
            role_type: "Trừ Nấm & Xanh Lá",
            moa_desc: "Ức chế hô hấp phức hợp III tế bào nấm; ngăn ngừa bào tử nảy mầm đồng thời tạo hiệu ứng xanh lá dày lá (AgCelence), tăng quang hợp giúp cây phục hồi nhanh sau bệnh.",
            is_advanced: lower.contains("pyraclostrobin") || lower.contains("trifloxystrobin"),
        };
    }

    // 5. Thuốc trừ nấm - Oomycetes (Sương mai, nứt thân xì mủ, thối rễ Phytophthora & Pythium)
    let oomycetes_keys = [
        "metalaxyl", "mefenoxam", "ridomil", "dimethomorph", "cymoxanil", "fosetyl",
        "aliette", "mandipropamid", "revus", "oxathiapiprolin", "zorvec", "cyazofamid",
        "hymexazol", "tachigaren", "famoxadone", "fenamidone", "propamocarb"
    ];
    if oomycetes_keys.iter().any(|&k| lower.contains(k)) {
        return ActiveIngredientInfo {
            group_id: "05_FUNGICIDE_OOMYCETES",
            group_name: "Đặc Trị Nấm Thủy Sinh Oomycetes (Sương mai, nứt thân xì mủ, thối rễ, Phytophthora)",
            role_type: "Đặc Trị Nấm Rễ & Xì Mủ",
            moa_desc: "Chuyên trị nấm thủy sinh gây nứt thân xì mủ, thối rễ, chết nhanh, sương mai; lưu dẫn hai chiều lên ngọn xuống rễ, làm khô nhanh vết loét xì mủ thân cành.",
            is_advanced: lower.contains("oxathiapiprolin") || lower.contains("mandipropamid") || lower.contains("cyazofamid") || lower.contains("hymexazol"),
        };
    }

    // 6. Thuốc trừ nấm - Tiếp xúc phòng ngừa phổ rộng
    let contact_keys = [
        "mancozeb", "propineb", "antracol", "metiram", "polyram", "chlorothalonil",
        "daconil", "zineb", "sulfur", "luu huynh", "copper", "dong", "booc-do",
        "bordeaux", "ziram", "thiram", "captan", "folpet", "cupric"
    ];
    if contact_keys.iter().any(|&k| lower.contains(k)) {
        return ActiveIngredientInfo {
            group_id: "06_FUNGICIDE_CONTACT",
            group_name: "Trừ Nấm Tiếp Xúc Bảo Vệ Phổ Rộng (Áo giáp ngoài, phòng ngừa đa điểm)",
            role_type: "Trừ Nấm Tiếp Xúc Bề Mặt",
            moa_desc: "Bám dính bề mặt lá/vỏ trái, ức chế đa điểm enzyme nấm, ngăn ngừa bào tử nảy mầm xâm nhập; không lo lờn thuốc; là nền tảng phối trộn số 1 với thuốc nội hấp.",
            is_advanced: lower.contains("metiram") || lower.contains("polyram"),
        };
    }

    // 7. Thuốc trừ sâu - Spinosyn, Pyrrole & Semicarbazone đặc trị kháng thuốc
    let spinosyn_keys = [
        "spinetoram", "radiant", "spinosad", "chlorfenapyr", "pirate",
        "metaflumizone", "takiwa", "alanto", "verismo"
    ];
    if spinosyn_keys.iter().any(|&k| lower.contains(k)) {
        return ActiveIngredientInfo {
            group_id: "07_INSECTICIDE_SPINOSYN",
            group_name: "Đặc Trị Sâu / Bọ Trĩ Kháng Thuốc (Spinosyn, Pyrrole & Semicarbazone - Hạ gục triệt để)",
            role_type: "Trừ Sâu / Bọ Trĩ Đột Phá",
            moa_desc: "Tác động thụ thể nicotinic acetylcholine kiểu mới, tách rời phosphoryl hóa hoặc phong bế kênh ion Natri thần kinh; hạ gục cực nhanh bọ trĩ lờn thuốc, sâu xanh, sâu keo, sâu tơ, sâu đục trái.",
            is_advanced: true,
        };
    }

    // 8. Thuốc trừ sâu - Diamide thế hệ mới
    let diamide_keys = [
        "chlorantraniliprole", "virtako", "prevathon", "cyantraniliprole", "benevia",
        "minecto", "flubendiamide", "takumi", "broflanilide", "incipio", "tetraniliprole"
    ];
    if diamide_keys.iter().any(|&k| lower.contains(k)) {
        return ActiveIngredientInfo {
            group_id: "08_INSECTICIDE_DIAMIDE",
            group_name: "Trừ Sâu Nhóm Diamide (Lưu dẫn bảo vệ đọt non, tê liệt cơ bắp tức thì)",
            role_type: "Trừ Sâu Lưu Dẫn Cao Cấp",
            moa_desc: "Kích hoạt thụ thể Ryanodine làm cạn kiệt Canxi cơ bắp khiến sâu ngừng cắn phá sau vài phút và chết; lưu dẫn kéo dài 14-21 ngày bảo vệ đọt non mới ra.",
            is_advanced: true,
        };
    }

    // 9. Thuốc trừ sâu - Ức chế lột xác IGR & Diệt trứng / Sâu non
    let igr_keys = [
        "lufenuron", "match", "tebufenozide", "methoxyfenozide", "buprofezin",
        "applaud", "pyriproxyfen", "admiral", "chromafenozide"
    ];
    if igr_keys.iter().any(|&k| lower.contains(k)) {
        return ActiveIngredientInfo {
            group_id: "09_INSECTICIDE_IGR",
            group_name: "Ức Chế Lột Xác IGR & Diệt Trứng (Cắt đứt vòng đời, chống tái bùng phát)",
            role_type: "Ức Chế Sinh Trưởng Côn Trùng",
            moa_desc: "Ức chế tổng hợp Chitin hoặc làm rối loạn hormone lột xác; làm ung trứng, ấu trùng không thể lột xác hóa nhộng; vũ khí phối trộn bắt buộc để dập tắt triệt để gối lứa.",
            is_advanced: lower.contains("lufenuron") || lower.contains("pyriproxyfen"),
        };
    }

    // 10. Thuốc trừ sâu - Tiếp xúc, vị độc, hạ gục nhanh
    let knockdown_keys = [
        "emamectin", "abamectin", "cartap", "padan", "cypermethrin", "permethrin",
        "alpha-cypermethrin", "lambda-cyhalothrin", "deltamethrin", "indoxacarb",
        "fenvalerate", "profenofos", "fipronil"
    ];
    if knockdown_keys.iter().any(|&k| lower.contains(k)) {
        return ActiveIngredientInfo {
            group_id: "10_INSECTICIDE_KNOCKDOWN",
            group_name: "Trừ Sâu Tiếp Xúc - Vị Độc - Hạ Gục Nhanh (Đòn phối dập dịch tức thì)",
            role_type: "Trừ Sâu Tiếp Xúc / Vị Độc",
            moa_desc: "Kích thích giải phóng GABA hoặc phong bế kênh Natri thần kinh; hạ gục nhanh sâu hại sau khi trúng thuốc; rất phù hợp phối chung với thuốc lưu dẫn để vừa hạ nhanh vừa diệt dai.",
            is_advanced: lower.contains("emamectin") && lower.contains("5%"),
        };
    }

    // 11. Bọ trĩ, Rầy, Rệp sáp - Thế hệ mới
    let sucking_adv_keys = [
        "flupyrimin", "sulfoxaflor", "transform", "flonicamid", "teppeki",
        "spirotetramat", "movento", "tolfenpyrad", "afidopyropen", "triflumezopyrim",
        "diafenthiuron", "pegasus"
    ];
    if sucking_adv_keys.iter().any(|&k| lower.contains(k)) {
        return ActiveIngredientInfo {
            group_id: "11_SUCKING_ADVANCED",
            group_name: "Đặc Trị Bọ Trĩ & Rầy Rệp Thế Hệ Mới (Lưu dẫn hai chiều, bẻ gãy kháng thuốc)",
            role_type: "Trừ Chích Hút Cao Cấp",
            moa_desc: "Tác động thụ thể thần kinh chuyên biệt kiểu mới hoặc ức chế sinh tổng hợp Lipid (lưu dẫn 2 chiều cả ngọn lẫn rễ như Movento); đặc trị rầy phấn trắng, rệp sáp, bọ trĩ trốn trong kẽ lá/nụ bông.",
            is_advanced: true,
        };
    }

    // 12. Bọ trĩ, Rầy, Rệp sáp - Neonicotinoid & Nội hấp phổ biến
    let sucking_neonic_keys = [
        "thiamethoxam", "imidacloprid", "dinotefuran", "oshin", "acetamiprid",
        "clothianidin", "nitenpyram", "pymetrozine"
    ];
    if sucking_neonic_keys.iter().any(|&k| lower.contains(k)) {
        return ActiveIngredientInfo {
            group_id: "12_SUCKING_NEONIC",
            group_name: "Trừ Rầy & Bọ Trĩ Neonicotinoid Nội Hấp (Thấm sâu lưu dẫn trong nhựa cây)",
            role_type: "Trừ Chích Hút Nội Hấp",
            moa_desc: "Lưu dẫn nội hấp mạnh mẽ qua rễ và lá vào hệ mạch dẫn; làm tê liệt thần kinh trung ương côn trùng chích hút; phối hợp tốt với thuốc hạ gục hoặc dầu khoáng.",
            is_advanced: lower.contains("dinotefuran") || lower.contains("clothianidin"),
        };
    }

    // 13. Thuốc đặc trị nhện đỏ
    let acaricide_keys = [
        "spirodiclofen", "envidor", "spiromesifen", "oberon", "fenpyroximate",
        "ortus", "pyridaben", "propargite", "hexythiazox", "clofentezine",
        "bifenazate", "fenbutatin"
    ];
    if acaricide_keys.iter().any(|&k| lower.contains(k)) {
        return ActiveIngredientInfo {
            group_id: "13_ACARICIDE",
            group_name: "Đặc Trị Nhện Đỏ & Nhện Gây Hại (Diệt cả nhện trưởng thành, ấu trùng & ung trứng)",
            role_type: "Đặc Trị Nhện Đỏ",
            moa_desc: "Ức chế enzyme tổng hợp Lipid hoặc kênh hô hấp tế bào nhện; diệt sạch nhện kháng thuốc gây nám da trái, bạc lá; nên phối hoạt chất diệt nhện lớn với hoạt chất ung trứng.",
            is_advanced: lower.contains("spirodiclofen") || lower.contains("spiromesifen") || lower.contains("fenpyroximate"),
        };
    }

    // 14. Tuyến trùng
    let nematicide_keys = [
        "fosthiazate", "benfuracarb", "trichoderma", "paecilomyces"
    ];
    if nematicide_keys.iter().any(|&k| lower.contains(k)) {
        return ActiveIngredientInfo {
            group_id: "14_NEMATICIDE",
            group_name: "Đặc Trị Tuyến Trùng & Nấm Đối Kháng Đất (Bảo vệ rễ, ngừa vàng lá thối rễ)",
            role_type: "Đặc Trị Tuyến Trùng",
            moa_desc: "Tiêu diệt và xua đuổi tuyến trùng gây nốt sưng rễ; bảo vệ đầu chóp rễ tơ hút dinh dưỡng.",
            is_advanced: true,
        };
    }

    // 15. Dinh dưỡng, điều hòa sinh trưởng, trợ lực bám dính
    let nutrition_keys = [
        "amino", "rong bien", "seaweed", "humic", "fulvic", "bo", "canxi", "kem",
        "zinc", "ga3", "naa", "brassinolide", "dau khoang", "mineral oil", "bam dinh",
        "loang trai", "surfactant", "silicone"
    ];
    if nutrition_keys.iter().any(|&k| lower.contains(k)) {
        return ActiveIngredientInfo {
            group_id: "15_NUTRITION_ADJUVANT",
            group_name: "Dinh Dưỡng, Kích Kháng & Chất Trợ Lực Loang Trải (Tăng hấp thu, chống rửa trôi)",
            role_type: "Dinh Dưỡng & Trợ Lực",
            moa_desc: "Phá vỡ lớp sáp phấn của côn trùng, tăng diện tích tiếp xúc giọt thuốc; cung cấp vi lượng và acid amin giúp cây phục hồi nhanh sau bệnh.",
            is_advanced: lower.contains("brassinolide") || lower.contains("amino"),
        };
    }

    // Nhóm khác / Chưa phân loại riêng
    ActiveIngredientInfo {
        group_id: "16_OTHER_ACTIVE",
        group_name: "Hoạt Chất Nông Dược Bổ Trợ & Phối Hợp Trong Kho",
        role_type: "Bảo Vệ Thực Vật",
        moa_desc: "Hoạt chất BVTV hữu hiệu có sẵn trong kho, tham gia diệt trừ sâu bệnh theo phổ tác động chỉ định.",
        is_advanced: false,
    }
}

fn is_advanced_active(name: &str) -> bool {
    classify_active_ingredient(name).is_advanced
}

fn extract_active_ingredients(raw: &str) -> Vec<String> {
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
        if !c_trimmed.is_empty() && !results.iter().any(|x: &String| x.eq_ignore_ascii_case(c_trimmed)) {
            results.push(c_trimmed.to_string());
        }
    }
    results
}

pub async fn consult_ai(
    State(pool): State<SqlitePool>,
    Json(payload): Json<AiConsultRequest>,
) -> Result<impl IntoResponse, AppError> {
    let raw_mode = payload.mode.as_deref().unwrap_or("crop_doctor");
    let mut api_keys: Vec<String> = Vec::new();

    // 1. Thêm key từ payload (nếu có)
    if let Some(ref k) = payload.api_key {
        let trimmed = k.trim();
        if !trimmed.is_empty() {
            for part in trimmed.split(|c| c == ',' || c == '\n' || c == ';') {
                let p = part.trim();
                if !p.is_empty() && !api_keys.contains(&p.to_string()) {
                    api_keys.push(p.to_string());
                }
            }
        }
    }

    // 2. Lấy danh sách các key từ database app_setting (gemini_api_key, gemini_api_key_2, gemini_api_key_3)
    let setting_keys = ["gemini_api_key", "gemini_api_key_2", "gemini_api_key_3"];
    for sk in setting_keys {
        if let Ok(row) = sqlx::query("SELECT setting_value FROM app_setting WHERE setting_key = ?")
            .bind(sk)
            .fetch_optional(&pool)
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
        return Ok(Json(json!({
            "error": "missing_api_key",
            "reply": "⚠️ Bạn chưa cấu hình **Gemini API Key** trong phần Cài Đặt. Vui lòng vào **Cài đặt -> Tích hợp AI** hoặc nhập API Key để sử dụng tính năng Trợ lý AI.",
            "recommended_products": []
        })));
    }

    let mut products: Vec<ProductContext> = Vec::new();
    let mut matched_compatible_ctx: Option<super::active_ingredient::MatchedIngredientsContext> = None;

    // Kiểm tra nếu câu hỏi liên quan đến số liệu, công nợ, lợi nhuận, doanh thu...
    let user_msg_lower = payload.message.to_lowercase();
    let q_norm = crate::utils::remove_accents(&user_msg_lower);
    let is_analytics_question = user_msg_lower.contains("nợ")
        || user_msg_lower.contains("công nợ")
        || user_msg_lower.contains("lợi nhuận")
        || user_msg_lower.contains("lãi")
        || user_msg_lower.contains("lời")
        || user_msg_lower.contains("doanh thu")
        || user_msg_lower.contains("doanh số")
        || user_msg_lower.contains("đối tác")
        || user_msg_lower.contains("nhà cung cấp")
        || user_msg_lower.contains("khách hàng")
        || user_msg_lower.contains("bán chạy")
        || user_msg_lower.contains("thu chi")
        || user_msg_lower.contains("tiền mặt")
        || user_msg_lower.contains("tồn kho")
        || user_msg_lower.contains("sắp hết")
        || user_msg_lower.contains("hết hạn")
        || user_msg_lower.contains("cận date")
        || user_msg_lower.contains("quý")
        || user_msg_lower.contains("năm")
        || user_msg_lower.contains("tháng")
        || user_msg_lower.contains("tuần")
        || user_msg_lower.contains("hôm qua")
        || user_msg_lower.contains("hôm nay")
        || user_msg_lower.contains("báo cáo")
        || user_msg_lower.contains("tổng kết")
        || user_msg_lower.contains("nhập hàng")
        || user_msg_lower.contains("2 chiều")
        || user_msg_lower.contains("hai chiều")
        || user_msg_lower.contains("cấn trừ")
        || user_msg_lower.contains("bù trừ")
        || q_norm.contains("quy 1") || q_norm.contains("quy 2") || q_norm.contains("quy 3") || q_norm.contains("quy 4")
        || q_norm.contains("q1") || q_norm.contains("q2") || q_norm.contains("q3") || q_norm.contains("q4")
        || q_norm.contains("nam nay") || q_norm.contains("nam ngoai") || q_norm.contains("nam 202")
        || q_norm.contains("bao cao") || q_norm.contains("tong ket")
        || q_norm.contains("ncc") || q_norm.contains("dai ly")
        || q_norm.contains("nhap hang") || q_norm.contains("doanh so");

    // Nếu người dùng đang ở tab crop_doctor nhưng hỏi rõ ràng về công nợ, lợi nhuận, doanh thu... thì tự động chuyển sang mode app_analytics!
    let mode = if raw_mode == "crop_doctor" && is_analytics_question && !user_msg_lower.contains("bệnh") && !user_msg_lower.contains("sâu") && !user_msg_lower.contains("xịt") && !user_msg_lower.contains("phun") && !user_msg_lower.contains("liều") {
        "app_analytics"
    } else {
        raw_mode
    };

    // 3. Xây dựng System Instruction dựa theo từng Mode
    let system_instruction = match mode {
        "app_analytics" => {
            let analytics_context = build_app_analytics_context(&pool, Some(&payload.message)).await;
            format!(
                r#"Bạn là LyangAI - Giám đốc Tài chính & Chuyên viên Phân tích Dữ liệu Cấp cao (CFO & Senior BI Analyst) trong phần mềm bán hàng LyangPOS.
Nhiệm vụ của bạn là giải đáp chính xác tuyệt đối, toàn diện, sắc bén và trực quan mọi thắc mắc của chủ cửa hàng về doanh thu, lãi lỗ, dòng tiền, định giá vốn kho, khách hàng VIP, nhà cung cấp, đối tác 2 chiều, công nợ và rủi ro kinh doanh dựa trên hệ thống số liệu thời gian thực dưới đây.

★★★ BẢNG SỐ LIỆU TÀI CHÍNH & VẬN HÀNH THỜI GIAN THỰC (REAL-TIME LEDGER):
{}

★★★ QUY TẮC TRẢ LỜI:
1. ĐỘ CHÍNH XÁC CAO: Mọi con số (doanh thu, lợi nhuận gộp, tỷ suất %, giá trị vốn kho, công nợ, số lượng...) PHẢI lấy chính xác từ bảng số liệu trên. Trình bày số tiền rõ ràng kèm đơn vị "đ" (ví dụ: 1.500.000đ, 32.527.102.961đ).
2. ĐỐI TÁC VỪA LÀ KHÁCH HÀNG VỪA LÀ NHÀ CUNG CẤP (GIAO DỊCH 2 CHIỀU / CẤN TRỪ CÔNG NỢ):
   - Khi hỏi về đối tác 2 chiều (hoặc đối tác có cả giao dịch Bán hàng và Nhập hàng):
     + Phải phân tích ĐẦY ĐỦ VÀ TÁCH BIỆT RÕ RÀNG 2 CHIỀU:
       * Chiều Bán hàng (Họ là Khách mua): Số đơn mua, tổng doanh số tiệm bán cho họ, số tiền đã thu và số tiền họ còn nợ tiệm.
       * Chiều Nhập hàng (Họ là Nhà cung cấp): Số đơn nhập từ họ, tổng giá trị hàng nhập, số tiền tiệm đã thanh toán và tiệm còn nợ họ.
     + Kết luận DƯ NỢ RÒNG SAU CẤN TRỪ (Net Debt Balance): Dựa vào số liệu Dư nợ ròng trong bảng dữ liệu để nêu rõ hiện tại ai đang nợ ai bao nhiêu tiền (nếu > 0 là đối tác nợ tiệm cần thu, nếu < 0 là tiệm nợ đối tác cần trả, 0đ là đã bù trừ cân bằng). Tuyệt đối không nhầm lẫn giữa doanh số bán cho họ và tiền nhập hàng từ họ.
3. BÁO CÁO TOÀN DIỆN THEO KỲ (THEO QUÝ, THEO NĂM, THEO THÁNG):
   - Khi người dùng hỏi về bất kỳ Quý nào (Quý 1, 2, 3, 4, Quý này, Quý trước...) hoặc Năm nào (Năm nay, Năm ngoái, 2024, 2025, 2026...):
     + Tuyệt đối không trả lời sơ sài hay chỉ đưa 1 vài con số.
     + Cung cấp BÁO CÁO TOÀN DIỆN gồm các mục:
       (1) Tổng kết kỳ: Doanh thu bán hàng, Lợi nhuận gộp, Tỷ suất lợi nhuận (Biên lãi %), Thực thu, Nợ khách phát sinh, và Tổng tiền nhập hàng từ NCC.
       (2) Diễn biến từng tháng: Liệt kê số liệu chi tiết từng tháng trong quý/năm đó (doanh thu, lợi nhuận, đơn bán, đơn nhập) để chủ tiệm nắm bắt xu hướng kinh doanh.
       (3) Top sản phẩm bán chạy nhất & Top mặt hàng sinh lãi gộp cao nhất trong kỳ.
       (4) Top khách hàng lớn nhất & Top Nhà cung cấp trọng điểm trong kỳ (nếu có trong dữ liệu).
4. TỔNG QUAN & SO SÁNH: Khi phân tích doanh thu hay lợi nhuận chung, hãy so sánh với kỳ trước (hôm nay vs hôm qua, tháng này vs tháng trước) và nêu rõ tỷ suất lợi nhuận biên (Profit Margin %) để chủ tiệm thấy bức tranh tăng trưởng.
5. PHÂN TÍCH CHUYÊN SÂU & LỜI KHUYÊN KINH DOANH THỰC CHIẾN:
   - Nếu hỏi về khách hàng/công nợ: Phân biệt rõ giữa Khách VIP (người mang lại doanh thu lớn) và Khách nợ (rủi ro công nợ). Cảnh báo kịp thời khi tỷ lệ nợ trên doanh thu cao.
   - Nếu hỏi về kho: Đưa ra cảnh báo hàng đọng vốn, hàng ế ẩm để gợi ý chủ cửa hàng xả hàng, giảm giá hoặc cắt giảm đặt hàng mới.
6. ĐỊNH DẠNG ĐẸP MẮT: Sử dụng Markdown chuyên nghiệp (bảng tóm tắt nếu cần, gạch đầu dòng, in đậm con số mấu chốt, emoji tài chính 📊, 💰, 📦, 💳, ⚠️, 📈).
7. Ở chế độ này KHÔNG bắt buộc xuất khối recommended_products trừ khi người dùng hỏi về sản phẩm cụ thể.
"#,            analytics_context
            )
        },
        "general_assistant" => {
            let mut prompt = r#"Bạn là LyangAI - Trợ lý AI Đa Năng Thông Minh (tương tự như Google Gemini / ChatGPT) tích hợp trong hệ thống phần mềm LyangPOS.
Bạn có khả năng hỗ trợ người dùng giải đáp, sáng tạo và thực hiện MỌI YÊU CẦU:
- Soạn thảo văn bản, tin nhắn Zalo/SMS gửi khách hàng, thông báo khuyến mãi, lời chúc mừng, email giao dịch.
- Giải đáp kiến thức khoa học, kỹ thuật nông nghiệp nói chung, canh tác cây trồng, phân bón, đất đai, thời tiết.
- Tính toán, phân tích, lập kế hoạch công việc, mẹo vặt cuộc sống và quản lý cửa hàng.
- Trả lời tự nhiên, thông minh, súc tích, chuyên nghiệp với định dạng Markdown rõ ràng, bắt mắt.
- Không bị gò bó vào danh mục thuốc hay số liệu nội bộ cửa hàng, trừ khi người dùng chủ động yêu cầu.
"#.to_string();
            if is_analytics_question {
                let analytics_context = build_app_analytics_context(&pool, Some(&payload.message)).await;
                prompt.push_str(&format!("\n\n★★★ DỮ LIỆU SỐ LIỆU KINH DOANH THỜI GIAN THỰC ĐỂ TRẢ LỜI CÂU HỎI:\n{}\n", analytics_context));
            }
            prompt
        },
        _ => {
            // Mode 1: Cố vấn thuốc BVTV & Cây trồng (Mặc định)
            // Quét từ khóa triệu chứng & bệnh hại để tìm kiếm các hoạt chất đặc trị + hoạt chất phối hợp tương thích từ DB
            let ctx = super::active_ingredient::scan_query_and_find_compatible_options(&pool, &payload.message)
                .await
                .unwrap_or_else(|e| {
                    tracing::warn!("Lỗi quét hoạt chất tương thích: {}", e);
                    super::active_ingredient::MatchedIngredientsContext {
                        matched_targets: Vec::new(),
                        compatible_synergies: Vec::new(),
                        all_usable_products: Vec::new(),
                        summary_text: String::new(),
                    }
                });

            let researched_context_text = ctx.summary_text.clone();
            matched_compatible_ctx = Some(ctx);

            products = match sqlx::query_as::<_, ProductContext>(
                r#"
                SELECT id, name, code, unit, 
                       CAST(sale_price AS REAL) as sale_price, 
                       CAST(stock AS REAL) as stock, 
                       active_ingredient, brand
                FROM product
                WHERE is_active = 1
                ORDER BY 
                    CASE WHEN active_ingredient IS NOT NULL AND TRIM(active_ingredient) != '' THEN 0 ELSE 1 END,
                    stock DESC,
                    name ASC
                LIMIT 1000
                "#
            )
            .fetch_all(&pool)
            .await
            {
                Ok(prods) => prods,
                Err(e) => {
                    tracing::error!("Lỗi truy vấn danh mục sản phẩm cho AI: {}", e);
                    Vec::new()
                },
            };

            let mut all_unique_actives: Vec<String> = Vec::new();
            // Nhóm hoạt chất theo phân loại dược lý: group_id -> (ActiveIngredientInfo, Vec<ActiveName>, Vec<ProductSummary>)
            let mut group_map: std::collections::BTreeMap<&'static str, (ActiveIngredientInfo, Vec<String>, Vec<String>)> = std::collections::BTreeMap::new();

            for p in &products {
                if let Some(ref act) = p.active_ingredient {
                    let extracted = extract_active_ingredients(act);
                    for item in extracted {
                        let item_clean = item.trim();
                        if item_clean.is_empty() {
                            continue;
                        }
                        if !all_unique_actives.iter().any(|x| x.eq_ignore_ascii_case(item_clean)) {
                            all_unique_actives.push(item_clean.to_string());
                        }

                        let info = classify_active_ingredient(item_clean);
                        let entry = group_map.entry(info.group_id).or_insert_with(|| {
                            (info.clone(), Vec::new(), Vec::new())
                        });

                        if !entry.1.iter().any(|x| x.eq_ignore_ascii_case(item_clean)) {
                            entry.1.push(item_clean.to_string());
                        }

                        let prod_desc = format!(
                            "{} [Hoạt chất: {} | Tồn: {}{}]",
                            p.name,
                            item_clean,
                            p.stock.unwrap_or(0.0),
                            p.unit.as_deref().unwrap_or("")
                        );
                        if !entry.2.contains(&prod_desc) && entry.2.len() < 8 {
                            entry.2.push(prod_desc);
                        }
                    }
                }
            }

            let mut active_groups_summary = String::new();
            if group_map.is_empty() {
                active_groups_summary.push_str("(Kho chưa có dữ liệu hoạt chất chi tiết)\n");
            } else {
                for (_, (info, act_list, prod_list)) in &group_map {
                    active_groups_summary.push_str(&format!(
                        "▶ [{}] (Vai trò: {}):\n  - Hoạt chất có trong kho: {}\n  - Cơ chế & Công dụng: {}\n  - Sản phẩm đại diện trong kho: {}\n\n",
                        info.group_name,
                        info.role_type,
                        act_list.join(", "),
                        info.moa_desc,
                        prod_list.join("; ")
                    ));
                }
            }

            let store_actives_str = if all_unique_actives.is_empty() {
                String::from("(Chưa có dữ liệu hoạt chất trong kho)")
            } else {
                all_unique_actives.join(", ")
            };

            let mut product_kb = String::from("DANH MỤC TOÀN BỘ SẢN PHẨM & HOẠT CHẤT ĐANG KINH DOANH TẠI CỬA HÀNG:\n");
            if products.is_empty() {
                product_kb.push_str("(Hiện chưa có sản phẩm nào trong cơ sở dữ liệu)\n");
            } else {
                for p in &products {
                    let active = p.active_ingredient.as_deref().unwrap_or("Chưa có");
                    let brand = p.brand.as_deref().unwrap_or("");
                    let unit = p.unit.as_deref().unwrap_or("");
                    let price = p.sale_price.unwrap_or(0.0);
                    let stock = p.stock.unwrap_or(0.0);
                    let code = p.code.as_deref().unwrap_or("");

                    let info = p.active_ingredient.as_ref().map(|act| classify_active_ingredient(act));
                    let tag_str = if let Some(ref inf) = info {
                        if inf.is_advanced {
                            format!("[🌟 THẾ HỆ MỚI / ĐẶC TRỊ: {}]", inf.role_type)
                        } else if !inf.role_type.is_empty() {
                            format!("[🌾 PHỔ THÔNG / BẢO VỆ: {}]", inf.role_type)
                        } else {
                            "[🌾 PHỔ THÔNG]".to_string()
                        }
                    } else {
                        "[CHƯA RÕ HOẠT CHẤT]".to_string()
                    };

                    product_kb.push_str(&format!(
                        "- [ID:{}] Tên: {} | Mã: {} | Hoạt chất: {} | Đơn vị: {} | Giá: {:.}đ | Tồn kho: {} | Hãng: {} | Phân loại: {}\n",
                        p.id, p.name, code, active, unit, price, stock, brand, tag_str
                    ));
                }
            }

            let mut base_prompt = format!(
                r#"Bạn là LyangAI - Chuyên gia Bác sĩ Cây trồng & Dược học Nông nghiệp cao cấp (Plant Protection & Agronomy Expert) tích hợp trong phần mềm quản lý bán hàng LyangPOS.

★★★ NGUYÊN TẮC BẮT BUỘC SỐ 1: RÀ SOÁT TOÀN DIỆN MỌI HOẠT CHẤT TRONG KHO (KHÔNG ĐƯỢC BỎ SÓT)
Người dùng yêu cầu bạn phải rà soát TOÀN BỘ danh mục hoạt chất trong kho của cửa hàng, phải biết rõ từng hoạt chất có công dụng và cơ chế gì rồi tư vấn ĐẦY ĐỦ các hoạt chất phù hợp, TUYỆT ĐỐI KHÔNG ĐƯỢC CHỈ lặp đi lặp lại những hoạt chất phổ biến quen thuộc.
- Khi người dùng hỏi về bất kỳ đối tượng sâu bệnh, nấm khuẩn, côn trùng hay chăm sóc cây nào:
  1. Bạn PHẢI đối chiếu với "KẾT QUẢ QUÉT CƠ SỞ DỮ LIỆU DƯỢC HỌC HOẠT CHẤT", "BẢNG TỔNG HỢP HOẠT CHẤT THEO DƯỢC HỌC" và danh mục sản phẩm kho phía dưới.
  2. Liệt kê và phân tích công dụng của TẤT CẢ các hoạt chất trong kho có hiệu lực đối với đối tượng này (gồm cả hoạt chất công nghệ mới, hoạt chất chuyên biệt, hoạt chất phối hợp và hoạt chất phổ thông).
  3. Nêu rõ cơ chế tác động (MOA) của từng hoạt chất: tác động lên đâu, tính năng nổi trội (tính mát êm bông, lưu dẫn 2 chiều, tiếp xúc bám dính chống rửa trôi...).

★★★ NGUYÊN TẮC BẮT BUỘC SỐ 2: CHIẾN LƯỢC PHỐI TRỘN THUỐC TĂNG LỰC TỐI ƯU (TANK-MIX SYNERGY)
Bạn PHẢI biết cách phối trộn các sản phẩm thực tế trong kho lại với nhau để tạo thành "BỘ PHỐI ĐÒN KÉP TĂNG LỰC" giúp tăng vọt hiệu quả dập dịch, bẻ gãy tính lờn thuốc và bảo vệ cây trồng toàn diện:
1. CÁC NGUYÊN TẮC PHỐI TRỘN KHOA HỌC:
   - Phối Tiếp xúc + Nội hấp/Lưu dẫn: Thuốc tiếp xúc (Mancozeb, Propineb, Chlorothalonil...) làm lớp áo giáp ngoài + Thuốc nội hấp (SDHI, Triazole, Strobilurin...) thấm sâu vào trong mô tiêu diệt tận gốc mầm bệnh.
   - Phối Nấm + Vi khuẩn: Khi vết bệnh thối nhũn, loét cành, thán thư có mùi chua/hôi hoặc sau mưa bão dập nát: Phối thuốc nấm + thuốc khuẩn (Kasugamycin, Streptomycin, Ningnanmycin, Bismerthiazol).
   - Phối Đánh nhanh (Hạ gục) + Đánh dai (Lưu dẫn / Ức chế lột xác ung trứng): Trị sâu keo, sâu đục thân, bọ trĩ, rầy rệp: Phối hoạt chất hạ gục nhanh (Spinetoram, Chlorfenapyr, Emamectin) + hoạt chất lưu dẫn dài ngày hoặc ức chế lột xác diệt trứng (Lufenuron, Buprofezin, Thiamethoxam, Movento) để cắt đứt lứa sau, ngăn tái bùng phát.
   - Phối 2 Cơ chế tác động (MOA) khác nhau: Tuyệt đối không phối 2 hoạt chất cùng 1 phân nhóm cơ chế; luôn phối 2 cơ chế khác nhau để bẻ gãy tính lờn thuốc.
   - Phối Thuốc BVTV + Dầu khoáng / Chất trợ lực loang trải: Giúp thuốc thấm sâu xuyên qua lớp sáp phấn của rầy rệp, tăng độ bám dính chống mưa rửa trôi.
2. THỨ TỰ HÒA TAN CHUẨN VÀO BÌNH / PHUY (Quy tắc W-S-S-E-A):
   - Bước 1: Cho nước vào 1/2 bình hoặc phuy.
   - Bước 2: Cho dạng Bột hòa tan / thấm nước trước (WP, WG, WDG, DF) - khuấy tan đều.
   - Bước 3: Cho dạng Huyền phù / Nước (SC, SL, FS, OD) - khuấy đều.
   - Bước 4: Cho dạng Nhũ dầu (EC, EW, ME) - cho sau cùng.
   - Bước 5: Cho Phân bón lá / Chất bám dính / Trợ lực (nếu có).
   - Bước 6: Châm thêm nước cho đủ thể tích và khuấy đều, phun ngay không để lưu cữu.
3. CẢNH BÁO TƯƠNG KỴ:
   - Không pha chung thuốc có tính kiềm mạnh (vôi, Booc-đô, Đồng nguyên chất) với thuốc vi sinh hoặc thuốc gốc lân, cúc.

★★★ NGUYÊN TẮC BẮT BUỘC SỐ 3: ĐỀ XUẤT RA TẤT CẢ THUỐC CÓ THỂ DÙNG ĐƯỢC (KHÔNG BỎ SÓT THUỐC NÀO)
Người dùng yêu cầu bạn BẮT BUỘC PHẢI đề xuất ra TẤT CẢ các thuốc có trong kho có thể dùng được cho đối tượng này (bao gồm cả thuốc trong bộ phối tăng lực chính, các lựa chọn hoạt chất tương thích sẵn có trong kho, và các thuốc luân phiên dự phòng). TUYỆT ĐỐI KHÔNG ĐƯỢC giới hạn 2-6 thuốc như trước, mà phải xuất TOÀN BỘ danh sách tất cả các thuốc phù hợp vào khối mã ```recommended_products```!

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

★★★ NGUYÊN TẮC BẮT BUỘC SỐ 5: CHẨN ĐOÁN HÌNH ẢNH CÂY TRỒNG & SÂU BỆNH (KHI CÓ ẢNH ĐÍNH KÈM)
Khi người dùng gửi ảnh (lá cây, thân cành, hoa, quả, rễ hoặc côn trùng sâu bệnh):
1. Bạn hãy quan sát kỹ từng chi tiết trong ảnh:
   - Nhận diện loại cây trồng (sầu riêng, thanh long, lúa, xoài, cam quýt, ớt, cà chua, hoa màu...).
   - Bộ phận bị hại (mặt trên/dưới lá, đọt non, vỏ cành, thân, hoa, cuống quả, vỏ quả, rễ...).
   - Triệu chứng lâm sàng đặc trưng: vết đốm hoại tử (thán thư, đốm mắt cua, rỉ sắt), loét sũng nước vi khuẩn, vết chích hút xoăn đọt, nứt thân xì mủ, nấm phấn trắng/bồ hóng, hoặc hình thái sâu rầy, bọ trĩ, nhện đỏ.
2. Đưa ra chẩn đoán chính xác: Tên bệnh / sâu hại, tác nhân gây hại (nấm, vi khuẩn, virus, nhện, bọ trĩ...) và mức độ nguy hại.
3. Kê đơn phác đồ điều trị dập dịch: Đối chiếu ngay toàn bộ hoạt chất và sản phẩm có sẵn trong kho cửa hàng để đưa ra bộ phối tăng lực tối ưu!

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

{}

🌟 **TỔNG HỢP CÁC NHÓM HOẠT CHẤT TRONG KHO THEO CƠ CHẾ DƯỢC HỌC**:
{}

📚 **TOÀN BỘ HOẠT CHẤT CÓ TRONG KHO**:
{}

{}

QUY TẮC BẮT BUỘC VỀ DỮ LIỆU ĐỀ XUẤT (JSON BLOCK):
Ở CUỐI CÙNG CỦA CÂU TRẢ LỜI, nếu câu hỏi về tư vấn thuốc/bệnh, bạn BẮT BUỘC phải đối chiếu và ĐỀ XUẤT RA TẤT CẢ CÁC SẢN PHẨM PHÙ HỢP CÓ TRONG KHO (gồm cả bộ phối tăng lực khuyên dùng, các lựa chọn tương thích sẵn có trong kho, và sản phẩm luân phiên), TUYỆT ĐỐI KHÔNG ĐƯỢC BỎ SÓT THUỐC NÀO để xuất ra khối JSON code block theo đúng mẫu sau:
```recommended_products
[
  {{
    "id": 123,
    "name": "Tên sản phẩm A đúng theo kho",
    "active_ingredient": "Hoạt chất của sản phẩm A",
    "dosage": "Phối trộn: 20-25ml/bình 25L (hoặc 1 chai/phuy 200L)",
    "tier": "⚡ Bộ phối tăng lực: Đòn hạ gục",
    "sale_price": 185000,
    "unit": "Chai",
    "stock": 15
  }},
  {{
    "id": 456,
    "name": "Tên sản phẩm B đúng theo kho",
    "active_ingredient": "Hoạt chất của sản phẩm B",
    "dosage": "Phối trộn: 30g/bình 25L (hoặc 1 gói/phuy 200L)",
    "tier": "🛡️ Bộ phối tăng lực: Lưu dẫn kéo dài",
    "sale_price": 95000,
    "unit": "Gói",
    "stock": 30
  }}
]
```
Nếu không có sản phẩm phù hợp trong kho hoặc câu hỏi về số liệu/kinh doanh/công nợ/lợi nhuận, xuất:
```recommended_products
[]
```
"#,
                researched_context_text,
                active_groups_summary,
                store_actives_str,
                product_kb
            );

            if is_analytics_question {
                let analytics_context = build_app_analytics_context(&pool, Some(&payload.message)).await;
                base_prompt = format!(
                    "★★★ LƯU Ý ĐẶC BIỆT QUAN TRỌNG: Người dùng đang hỏi về số liệu kinh doanh, công nợ, lợi nhuận hoặc doanh số. BẮT BUỘC trả lời chính xác bằng các con số thực tế trong hệ thống dưới đây trước tiên:\n{}\n\n{}",
                    analytics_context,
                    base_prompt
                );
            }

            base_prompt
        }
    };

    // 5. Xây dựng nội dung gửi tới Gemini API
    let mut contents: Vec<serde_json::Value> = Vec::new();

    // Lịch sử chat (nếu có)
    if let Some(history) = payload.history {
        for msg in history {
            let role = if msg.role == "user" { "user" } else { "model" };
            contents.push(json!({
                "role": role,
                "parts": [
                    { "text": msg.text }
                ]
            }));
        }
    }

    // Lượt chat hiện tại của User
    let mut current_user_parts: Vec<serde_json::Value> = Vec::new();
    current_user_parts.push(json!({
        "text": payload.message
    }));

    // Thêm hình ảnh nếu có
    if let Some(images) = payload.images {
        for img_val in images {
            if !img_val.is_empty() {
                let (mime_type, base64_data) = if let Some(idx) = img_val.find(";base64,") {
                    let mime = img_val[5..idx].to_string();
                    let b64 = &img_val[idx + 8..];
                    (mime, b64)
                } else {
                    ("image/jpeg".to_string(), img_val.as_str())
                };

                current_user_parts.push(json!({
                    "inline_data": {
                        "mime_type": mime_type,
                        "data": base64_data
                    }
                }));
            }
        }
    }

    contents.push(json!({
        "role": "user",
        "parts": current_user_parts
    }));

    let request_body = json!({
        "systemInstruction": {
            "parts": [
                { "text": system_instruction }
            ]
        },
        "contents": contents,
        "generationConfig": {
            "temperature": if mode == "app_analytics" { 0.2 } else if mode == "general_assistant" { 0.6 } else { 0.4 },
            "maxOutputTokens": 65536,
        }
    });

    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(18))
        .build()
        .unwrap_or_else(|_| reqwest::Client::new());

    let models = [
        "gemini-3.5-flash-lite",
    ];
    let mut reply_text = String::new();
    let mut error_msg = String::new();

    // Vòng lặp xoay vòng fallback qua từng API Key và từng Model
    'key_loop: for (k_idx, key) in api_keys.iter().enumerate() {
        for model in models {
            let url = format!(
                "https://generativelanguage.googleapis.com/v1beta/models/{}:generateContent?key={}",
                model, key
            );

            let res = client
                .post(&url)
                .header("Content-Type", "application/json")
                .json(&request_body)
                .send()
                .await;

            match res {
                Ok(resp) => {
                    if resp.status().is_success() {
                        if let Ok(gemini_res) = resp.json::<serde_json::Value>().await {
                            if let Some(text) = gemini_res
                                .get("candidates")
                                .and_then(|c| c.get(0))
                                .and_then(|c0| c0.get("content"))
                                .and_then(|cnt| cnt.get("parts"))
                                .and_then(|p| p.get(0))
                                .and_then(|p0| p0.get("text"))
                                .and_then(|t| t.as_str())
                            {
                                reply_text = text.trim().to_string();
                                break 'key_loop;
                            }
                        }
                    } else {
                        let status = resp.status();
                        let err_text = resp.text().await.unwrap_or_default();
                        error_msg = format!("Key #{}: Model {} lỗi (status {}): {}", k_idx + 1, model, status, err_text);
                        tracing::warn!("{}", error_msg);
                    }
                }
                Err(e) => {
                    error_msg = format!("Key #{}: Lỗi kết nối Gemini API ({})", k_idx + 1, e);
                    tracing::warn!("{}", error_msg);
                }
            }
        }
    }

    if reply_text.is_empty() {
        return Ok(Json(json!({
            "error": "gemini_api_failed",
            "reply": format!("❌ Không thể kết nối hoặc nhận phản hồi từ Gemini API (đã thử {} key). Chi tiết: {}", api_keys.len(), error_msg),
            "recommended_products": []
        })));
    }

    // 6. Bóc tách khối recommended_products JSON nếu có
    let mut recommended_products: Vec<serde_json::Value> = Vec::new();
    let mut clean_reply = reply_text.clone();

    if let Some(start_tag) = reply_text.find("```recommended_products") {
        let after_start = &reply_text[start_tag + 23..];
        if let Some(end_tag) = after_start.find("```") {
            let json_str = after_start[..end_tag].trim();
            if let Ok(parsed) = serde_json::from_str::<Vec<serde_json::Value>>(json_str) {
                recommended_products = parsed;
            }
            // Xóa khối code khỏi nội dung chat hiển thị cho đẹp
            let full_block_end = start_tag + 23 + end_tag + 3;
            let mut stripped = reply_text[..start_tag].trim_end().to_string();
            if full_block_end < reply_text.len() {
                stripped.push_str(&reply_text[full_block_end..]);
            }
            clean_reply = stripped;
        }
    } else if let Some(start_tag) = reply_text.find("```json") {
        let after_start = &reply_text[start_tag + 7..];
        if let Some(end_tag) = after_start.find("```") {
            let json_str = after_start[..end_tag].trim();
            if let Ok(parsed) = serde_json::from_str::<Vec<serde_json::Value>>(json_str) {
                if !parsed.is_empty() && parsed[0].get("id").is_some() {
                    recommended_products = parsed;
                    let full_block_end = start_tag + 7 + end_tag + 3;
                    let mut stripped = reply_text[..start_tag].trim_end().to_string();
                    if full_block_end < reply_text.len() {
                        stripped.push_str(&reply_text[full_block_end..]);
                    }
                    clean_reply = stripped;
                }
            }
        }
    }

    // 7. Bổ sung TẤT CẢ các thuốc có thể dùng được từ kết quả quét hoạt chất tương thích trong kho
    if let Some(ref ctx) = matched_compatible_ctx {
        let mut existing_ids: Vec<i64> = recommended_products
            .iter()
            .filter_map(|p| p.get("id").and_then(|id| id.as_i64()))
            .collect();

        for prod in &ctx.all_usable_products {
            if !existing_ids.contains(&prod.id) {
                recommended_products.push(json!({
                    "id": prod.id,
                    "name": prod.name,
                    "active_ingredient": prod.active_ingredient.as_deref().unwrap_or(""),
                    "dosage": format!("Theo khuyến cáo bao bì ({})", prod.role_desc),
                    "tier": prod.tier,
                    "sale_price": prod.sale_price,
                    "unit": prod.unit.as_deref().unwrap_or(""),
                    "stock": prod.stock
                }));
                existing_ids.push(prod.id);
            }
        }
    }

    // 8. Fallback tự động nếu AI nhắc tới tên sản phẩm có trong kho
    if recommended_products.is_empty() && !products.is_empty() {
        let reply_lower = clean_reply.to_lowercase();
        for p in &products {
            if p.name.len() >= 4 && reply_lower.contains(&p.name.to_lowercase()) {
                recommended_products.push(json!({
                    "id": p.id,
                    "name": p.name,
                    "active_ingredient": p.active_ingredient.as_deref().unwrap_or(""),
                    "dosage": "Theo hướng dẫn bao bì / liều khuyến nghị trên",
                    "tier": "🌾 Sản phẩm có sẵn trong kho",
                    "sale_price": p.sale_price.unwrap_or(0.0),
                    "unit": p.unit.as_deref().unwrap_or(""),
                    "stock": p.stock.unwrap_or(0.0)
                }));
            }
        }
    }

    Ok(Json(json!({
        "reply": clean_reply,
        "recommended_products": recommended_products
    })))
}
