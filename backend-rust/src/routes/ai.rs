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

pub async fn consult_ai(
    State(pool): State<SqlitePool>,
    Json(payload): Json<AiConsultRequest>,
) -> Result<impl IntoResponse, AppError> {
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
            "reply": "⚠️ Bạn chưa cấu hình **Gemini API Key** trong phần Cài Đặt. Vui lòng vào **Cài đặt -> Tích hợp AI** hoặc nhập API Key để sử dụng tính năng Trợ lý AI Cố vấn Sâu bệnh & Hoạt chất.",
            "recommended_products": []
        })));
    }

    // 3. Lấy danh sách sản phẩm trong kho (ưu tiên sản phẩm có hoạt chất & còn tồn kho)
    let products = match sqlx::query_as::<_, ProductContext>(
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

    // Tạo chuỗi Knowledge Base từ danh mục sản phẩm
    let mut product_kb = String::from("DANH MỤC SẢN PHẨM & HOẠT CHẤT ĐANG KINH DOANH TẠI CỬA HÀNG:\n");
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

            product_kb.push_str(&format!(
                "- [ID:{}] Tên: {} | Mã: {} | Hoạt chất: {} | Đơn vị: {} | Giá: {:.}đ | Tồn kho: {} | Hãng: {}\n",
                p.id, p.name, code, active, unit, price, stock, brand
            ));
        }
    }

    // 4. Xây dựng System Prompt chuyên gia Nông Nghiệp & BVTV với hướng dẫn liều lượng rõ ràng cho từng loại thuốc
    let system_instruction = format!(
        r#"Bạn là Chuyên gia Cố vấn Nông nghiệp & Dược học Cây trồng cao cấp (Plant Protection & Agronomy AI Expert) tích hợp trong phần mềm quản lý bán hàng LyangPOS.

QUY TẮC CỐ VẤN & HƯỚNG DẪN LIỀU LƯỢNG (BẮT BUỘC):
1. **Phân tích bệnh/sâu hại**: Giải đáp chính xác nguyên nhân (nấm, vi khuẩn, virus, rầy, rệp, bọ trĩ, nhện đỏ, sâu cuốn lá, sâu đục thân, đạo ôn, đốm vằn, thán thư, xì mủ, tuyến trùng...), triệu chứng và cơ chế phát sinh.
2. **Đề xuất nhóm hoạt chất (Active Ingredients)**: Nêu rõ hoạt chất đặc trị khoa học (ví dụ: Difenoconazole, Azoxystrobin, Tricyclazole, Hexaconazole, Isoprothiolane, Metalaxyl, Mancozeb, Kasugamycin, Validamycin, Emamectin, Chlorantraniliprole, Thiamethoxam...).
3. **ĐỐI CHIẾU VÀ TÌM KIẾM SẢN PHẨM TRONG DANH MỤC KHO HÀNG (Bên dưới)**: 
   - Tìm kiếm các sản phẩm có chứa hoạt chất phù hợp.
   - **LƯU Ý ĐẶC BIỆT**: Một số sản phẩm trong kho có thể chưa được điền cột hoạt chất nhưng tên thương mại của nó chính là thuốc trị bệnh đó (Ví dụ: Tilt Super, Amistar Top, Anvil, Beam, Flash, Map Famy, Filia, Fuji-one, Validacin, Nativo, Ridomil Gold, Score, Antracol, Topsin...). Bạn hãy nhận diện theo kiến thức nông nghiệp và đề xuất các sản phẩm này từ kho!
4. **BẮT BUỘC HƯỚNG DẪN LIỀU LƯỢNG CỤ THỂ CHO TỪNG LOẠI THUỐC ĐƯỢC GỢI Ý**:
   - Liều pha cho bình 16L, 25L hoặc phuy 200L (Ví dụ: 20-25ml/bình 25L hoặc 1 gói 100g/phuy 200L).
   - Thời điểm và cách phun (phun sáng sớm/chiều mát, phun ướt đều 2 mặt lá, phun đẫm gốc hay phun đón đọt).
   - Liều lượng trong khối JSON `recommended_products` ở trường "dosage".
5. **Nguyên tắc luân phiên đổi gốc hoạt chất**: Hướng dẫn cách đổi nhóm hoạt chất sau 1-2 lần phun để tránh kháng thuốc và lưu ý phối trộn an toàn.
6. **Định dạng Markdown đẹp mắt, bảng biểu trực quan, rõ ràng.**

{}

QUY TẮC BẮT BUỘC VỀ DỮ LIỆU ĐỀ XUẤT (JSON BLOCK):
Ở CUỐI CÙNG CỦA CÂU TRẢ LỜI, bạn BẮT BUỘC phải đối chiếu và chọn ra từ 1 đến 8 sản phẩm phù hợp nhất có trong danh mục kho hàng phía trên để xuất ra khối JSON code block theo đúng mẫu sau (tuyệt đối không được bỏ qua):
```recommended_products
[
  {{
    "id": 123,
    "name": "Tên sản phẩm đúng theo kho",
    "active_ingredient": "Hoạt chất của sản phẩm",
    "dosage": "Liều dùng: 20-25ml/bình 25L (hoặc 1 chai/phuy 200L)",
    "sale_price": 150000,
    "unit": "Chai",
    "stock": 15
  }}
]
```
Nếu tuyệt đối không tìm thấy bất kỳ sản phẩm nào liên quan trong danh mục kho, xuất:
```recommended_products
[]
```
"#,
        product_kb
    );

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
            "temperature": 0.3,
            "maxOutputTokens": 65536,
        }
    });

    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(18))
        .build()
        .unwrap_or_else(|_| reqwest::Client::new());

    let models = [
        "gemini-3.5-flash-lite",
        "gemini-flash-lite-latest",
        "gemini-2.5-flash",
        "gemini-2.0-flash",
        "gemini-1.5-flash",
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

    // Fallback tự động nếu AI nhắc tới tên sản phẩm có trong kho
    if recommended_products.is_empty() && !products.is_empty() {
        let reply_lower = clean_reply.to_lowercase();
        for p in &products {
            if p.name.len() >= 4 && reply_lower.contains(&p.name.to_lowercase()) {
                recommended_products.push(json!({
                    "id": p.id,
                    "name": p.name,
                    "active_ingredient": p.active_ingredient.as_deref().unwrap_or(""),
                    "dosage": "Theo hướng dẫn bao bì / liều khuyến nghị trên",
                    "sale_price": p.sale_price.unwrap_or(0.0),
                    "unit": p.unit.as_deref().unwrap_or(""),
                    "stock": p.stock.unwrap_or(0.0)
                }));
                if recommended_products.len() >= 4 {
                    break;
                }
            }
        }
    }

    Ok(Json(json!({
        "reply": clean_reply,
        "recommended_products": recommended_products
    })))
}
