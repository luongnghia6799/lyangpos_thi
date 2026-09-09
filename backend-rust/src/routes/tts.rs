use axum::{
    extract::Query,
    http::{header, HeaderMap, StatusCode},
    response::IntoResponse,
    Json,
};
use md5::Md5;
use serde::Deserialize;
use sha2::{Digest, Sha256};
use std::path::{Path, PathBuf};


#[derive(Debug, Deserialize)]
pub struct TtsParams {
    pub text: Option<String>,
    pub voice: Option<String>,
    pub rate: Option<String>,
    pub pitch: Option<String>,
}

fn remove_accents(input: &str) -> String {
    let mut output = String::new();
    for c in input.chars() {
        let mapped = match c {
            'a' | 'á' | 'à' | 'ả' | 'ã' | 'ạ' | 'ă' | 'ắ' | 'ằ' | 'ẳ' | 'ẵ' | 'ặ' | 'â' | 'ấ' | 'ầ' | 'ẩ' | 'ẫ' | 'ậ' => 'a',
            'A' | 'Á' | 'À' | 'Ả' | 'Ã' | 'Ạ' | 'Ă' | 'Ắ' | 'Ằ' | 'Ẳ' | 'Ẵ' | 'Ặ' | 'Â' | 'Ấ' | 'Ầ' | 'Ẩ' | 'Ẫ' | 'Ậ' => 'a',
            'd' | 'đ' => 'd',
            'D' | 'Đ' => 'd',
            'e' | 'é' | 'è' | 'ẻ' | 'ẽ' | 'ẹ' | 'ê' | 'ế' | 'ề' | 'ể' | 'ễ' | 'ệ' => 'e',
            'E' | 'É' | 'È' | 'Ẻ' | 'Ẽ' | 'Ẹ' | 'Ê' | 'Ế' | 'Ề' | 'Ể' | 'Ễ' | 'Ệ' => 'e',
            'i' | 'í' | 'ì' | 'ỉ' | 'ĩ' | 'ị' => 'i',
            'I' | 'Í' | 'Ì' | 'Ỉ' | 'Ĩ' | 'Ị' => 'i',
            'o' | 'ó' | 'ò' | 'ỏ' | 'õ' | 'ọ' | 'ô' | 'ố' | 'ồ' | 'ổ' | 'ỗ' | 'ộ' | 'ơ' | 'ớ' | 'ờ' | 'ở' | 'ỡ' | 'ợ' => 'o',
            'O' | 'Ó' | 'Ò' | 'Ỏ' | 'Õ' | 'Ọ' | 'Ô' | 'Ố' | 'Ồ' | 'Ổ' | 'Ỗ' | 'Ộ' | 'Ơ' | 'Ớ' | 'Ờ' | 'Ở' | 'Ỡ' | 'Ợ' => 'o',
            'u' | 'ú' | 'ù' | 'ủ' | 'ũ' | 'ụ' | 'ư' | 'ứ' | 'ừ' | 'ử' | 'ữ' | 'ự' => 'u',
            'U' | 'Ú' | 'Ù' | 'Ủ' | 'Ũ' | 'Ụ' | 'Ư' | 'Ứ' | 'Ừ' | 'Ử' | 'Ữ' | 'Ự' => 'u',
            'y' | 'ý' | 'ỳ' | 'ỷ' | 'ỹ' | 'ỵ' => 'y',
            'Y' | 'Ý' | 'Ỳ' | 'Ỷ' | 'Ỹ' | 'Ỵ' => 'y',
            other => other,
        };
        output.push(mapped);
    }
    output
}

use futures_util::{SinkExt, StreamExt};
use tokio_tungstenite::{
    connect_async,
    tungstenite::{
        client::IntoClientRequest,
        http::HeaderValue,
        protocol::Message,
    },
};

const EDGE_TRUSTED_CLIENT_TOKEN: &str = "6A5AA1D4EAFF4E9FB37E23D68491D6F4";
const CHROMIUM_FULL_VERSION: &str = "143.0.3650.75";
const CHROMIUM_MAJOR_VERSION: &str = "143";

fn generate_sec_ms_gmt() -> String {
    chrono::Utc::now().format("%a, %d %b %Y %H:%M:%S GMT").to_string()
}

fn generate_sec_ms_gec() -> String {
    // Windows epoch is 1601-01-01T00:00:00Z.
    // Unix epoch is 1970-01-01T00:00:00Z.
    // Difference is 11,644,473,600 seconds.
    let unix_secs = chrono::Utc::now().timestamp() as f64;
    let mut ticks = unix_secs + 11_644_473_600.0;
    ticks -= ticks % 300.0;
    ticks *= 10_000_000.0; // S_TO_NS / 100
    let str_to_hash = format!("{:.0}{}", ticks, EDGE_TRUSTED_CLIENT_TOKEN);
    let mut hasher = sha2::Sha256::new();
    hasher.update(str_to_hash.as_bytes());
    hex::encode(hasher.finalize()).to_uppercase()
}

fn generate_request_id() -> String {
    let now = chrono::Utc::now().timestamp_nanos_opt().unwrap_or(0);
    format!("{:032x}", now)
}

pub async fn fetch_edge_tts_rust(text: &str, voice: &str, rate: &str, pitch: &str) -> anyhow::Result<Vec<u8>> {
    let gec = generate_sec_ms_gec();
    let conn_id = generate_request_id();
    let gec_version = format!("1-{}", CHROMIUM_FULL_VERSION);

    let wss_url = format!(
        "wss://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1?TrustedClientToken={}&Sec-MS-GEC={}&Sec-MS-GEC-Version={}&ConnectionId={}",
        EDGE_TRUSTED_CLIENT_TOKEN, gec, gec_version, conn_id
    );

    let user_agent = format!(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/{}.0.0.0 Safari/537.36 Edg/{}.0.0.0",
        CHROMIUM_MAJOR_VERSION, CHROMIUM_MAJOR_VERSION
    );

    let mut req = wss_url.into_client_request()?;
    let headers = req.headers_mut();
    headers.insert("Pragma", HeaderValue::from_static("no-cache"));
    headers.insert("Cache-Control", HeaderValue::from_static("no-cache"));
    headers.insert("Origin", HeaderValue::from_static("chrome-extension://jdiccldimpdaibmpdkjnbmckianbfold"));
    headers.insert("Accept-Encoding", HeaderValue::from_static("gzip, deflate, br, zstd"));
    headers.insert("Accept-Language", HeaderValue::from_static("en-US,en;q=0.9"));
    headers.insert("User-Agent", HeaderValue::from_str(&user_agent).unwrap());



    let (ws_stream, _) = connect_async(req).await?;
    let (mut write, mut read) = ws_stream.split();

    let date_str = generate_sec_ms_gmt();
    let config_message = format!(
        "X-Timestamp:{}\r\nContent-Type:application/json; charset=utf-8\r\nPath:speech.config\r\n\r\n{{\"context\":{{\"synthesis\":{{\"audio\":{{\"metadataoptions\":{{\"sentenceBoundaryEnabled\":\"false\",\"wordBoundaryEnabled\":\"false\"}},\"outputFormat\":\"audio-24khz-48kbitrate-mono-mp3\"}}}}}}}}",
        date_str
    );
    write.send(Message::Text(config_message.into())).await?;

    let req_id = generate_request_id();
    let ssml_rate = if rate.is_empty() || rate == "+0%" || rate == "1" || rate == "1.0" {
        "+0%".to_string()
    } else if rate.starts_with('+') || rate.starts_with('-') {
        rate.to_string()
    } else if let Ok(val) = rate.parse::<f32>() {
        let pct = ((val - 1.0) * 100.0).round() as i32;
        if pct >= 0 { format!("+{}%", pct) } else { format!("{}%", pct) }
    } else {
        "+0%".to_string()
    };

    let ssml_pitch = if pitch.is_empty() || pitch == "+0Hz" || pitch == "0" {
        "+0Hz".to_string()
    } else if pitch.starts_with('+') || pitch.starts_with('-') {
        pitch.to_string()
    } else {
        let p_val = pitch.parse::<i32>().unwrap_or(0);
        if p_val >= 0 { format!("+{}Hz", p_val) } else { format!("{}Hz", p_val) }
    };

    let escaped_text = text
        .replace('&', "&amp;")
        .replace('<', "&lt;")
        .replace('>', "&gt;")
        .replace('"', "&quot;")
        .replace('\'', "&apos;");

    let ssml = format!(
        "<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='vi-VN'><voice name='{}'><prosody pitch='{}' rate='{}'>{}</prosody></voice></speak>",
        voice, ssml_pitch, ssml_rate, escaped_text
    );

    let ssml_message = format!(
        "X-RequestId:{}\r\nContent-Type:application/ssml+xml\r\nX-Timestamp:{}\r\nPath:ssml\r\n\r\n{}",
        req_id, date_str, ssml
    );
    write.send(Message::Text(ssml_message.into())).await?;

    let mut audio_data = Vec::new();

    while let Some(msg_result) = read.next().await {
        match msg_result {
            Ok(Message::Binary(bin)) => {
                if bin.len() > 2 {
                    let header_len = u16::from_be_bytes([bin[0], bin[1]]) as usize;
                    if bin.len() >= 2 + header_len {
                        let payload = &bin[2 + header_len..];
                        audio_data.extend_from_slice(payload);
                    }
                }
            }
            Ok(Message::Text(txt)) => {
                if txt.contains("Path:turn.end") {
                    break;
                }
            }
            Ok(Message::Close(c)) => {
                tracing::info!("TTS WebSocket closed: {:?}", c);
                break;
            }
            Err(e) => {
                tracing::warn!("TTS WebSocket error: {:?}", e);
                break;
            }
            _ => {}
        }
    }

    let _ = write.close().await;

    if audio_data.is_empty() {
        anyhow::bail!("No audio data received from Edge TTS");
    }

    Ok(audio_data)
}

fn get_base_dir() -> PathBuf {
    crate::utils::get_app_base_dir()
}

fn resolve_tts_dir() -> PathBuf {
    let base = get_base_dir();
    let dir = base.join("tts_cache");
    let _ = std::fs::create_dir_all(&dir);
    dir
}

pub async fn get_tts(Query(params): Query<TtsParams>) -> impl IntoResponse {
    let text = match params.text {
        Some(ref t) if !t.trim().is_empty() => t.trim(),
        _ => {
            return (
                StatusCode::BAD_REQUEST,
                Json(serde_json::json!({"error": "Text parameter is required"})),
            )
                .into_response()
        }
    };

    let voice_type = params.voice.unwrap_or_else(|| "edge-vi-female".to_string());
    let voice_suffix = if voice_type.to_lowercase().contains("male") && !voice_type.to_lowercase().contains("female") {
        "nam"
    } else {
        "nu"
    };

    let raw_rate = params.rate.unwrap_or_else(|| "+0%".to_string());
    let raw_pitch = params.pitch.unwrap_or_else(|| "+0Hz".to_string());

    let ssml_rate = if raw_rate.is_empty() || raw_rate == "+0%" || raw_rate == "1" || raw_rate == "1.0" {
        "+0%".to_string()
    } else if raw_rate.starts_with('+') || raw_rate.starts_with('-') {
        raw_rate.to_string()
    } else if let Ok(val) = raw_rate.parse::<f32>() {
        let pct = ((val - 1.0) * 100.0).round() as i32;
        if pct >= 0 { format!("+{}%", pct) } else { format!("{}%", pct) }
    } else {
        "+0%".to_string()
    };

    let ssml_pitch = if raw_pitch.is_empty() || raw_pitch == "+0Hz" || raw_pitch == "0" {
        "+0Hz".to_string()
    } else if raw_pitch.starts_with('+') || raw_pitch.starts_with('-') {
        raw_pitch.to_string()
    } else {
        let p_val = raw_pitch.parse::<i32>().unwrap_or(0);
        if p_val >= 0 { format!("+{}Hz", p_val) } else { format!("{}Hz", p_val) }
    };

    // Slugify rate and pitch for filename (e.g. rate_p40_pitch_0hz or r1_4_p0)
    let rate_slug = ssml_rate.replace('+', "p").replace('-', "m").replace('%', "pct");
    let pitch_slug = ssml_pitch.replace('+', "p").replace('-', "m").replace("Hz", "hz").replace("hz", "hz");
    let is_default_params = ssml_rate == "+0%" && ssml_pitch == "+0Hz";

    let clean = remove_accents(text);
    let mut safe_slug = String::new();
    for c in clean.chars() {
        if c.is_alphanumeric() {
            safe_slug.push(c.to_ascii_lowercase());
        } else if !safe_slug.ends_with('_') {
            safe_slug.push('_');
        }
    }
    let safe_slug = safe_slug.trim_matches('_');
    let safe_slug = if safe_slug.is_empty() { "am_thanh" } else { safe_slug };
    let safe_slug = if safe_slug.len() > 40 { &safe_slug[..40] } else { safe_slug };

    // Human readable filename with voice, rate, pitch
    let human_readable_name = format!("{}_{}_{}_{}.mp3", safe_slug, voice_suffix, rate_slug, pitch_slug);

    let tts_dir = resolve_tts_dir();
    let base_dir = get_base_dir();
    let cache_dirs = [
        tts_dir.clone(),
        base_dir.join("tts"),
        base_dir.join("resources").join("tts_cache"),
        base_dir.join("_up_").join("tts_cache"),
    ];

    let mut found_path: Option<PathBuf> = None;

    // Hasher with text, voice, rate, pitch
    let mut hasher = Md5::new();
    hasher.update(format!("{}_{}_{}_{}", text, voice_suffix, ssml_rate, ssml_pitch).as_bytes());
    let hash_primary = format!("{:x}", hasher.finalize());
    let hash_tts = format!("tts_{}_{}_{}_{}.mp3", hash_primary, voice_suffix, rate_slug, pitch_slug);

    let mut candidates = vec![
        human_readable_name.clone(),
        hash_tts,
    ];

    // Backward compatibility for pre-cached default audio files (0% rate, 0Hz pitch)
    if is_default_params {
        let mut default_hasher = Md5::new();
        default_hasher.update(format!("{}_{}", text, voice_suffix).as_bytes());
        let legacy_hash = format!("{:x}", default_hasher.finalize());
        candidates.push(format!("{}_{}.mp3", safe_slug, voice_suffix));
        candidates.push(format!("{}.mp3", safe_slug));
        candidates.push(format!("tts_{}_{}.mp3", legacy_hash, voice_suffix));
    }

    for dir in &cache_dirs {
        for cand in &candidates {
            let p = dir.join(cand);
            if p.exists() && std::fs::metadata(&p).map(|m| m.len() >= 100).unwrap_or(false) {
                found_path = Some(p);
                break;
            }
        }
        if found_path.is_some() {
            break;
        }
    }

    if let Some(path) = found_path {
        match tokio::fs::read(&path).await {
            Ok(bytes) => {
                let mut headers = HeaderMap::new();
                headers.insert(header::CONTENT_TYPE, "audio/mpeg".parse().unwrap());
                headers.insert(header::CACHE_CONTROL, "public, max-age=86400".parse().unwrap());
                headers.insert(header::ACCESS_CONTROL_ALLOW_ORIGIN, "*".parse().unwrap());
                return (StatusCode::OK, headers, bytes).into_response();
            }
            Err(e) => {
                tracing::error!("Failed to read TTS audio cache file: {:?}", e);
            }
        }
    }

    let target_file = tts_dir.join(&human_readable_name);

    let edge_voice = if voice_suffix == "nam" {
        "vi-VN-NamMinhNeural"
    } else {
        "vi-VN-HoaiMyNeural"
    };

    // 1. Native Direct Microsoft Edge-TTS via WebSocket in Rust (HoaiMy & NamMinh Neural AI)
    match fetch_edge_tts_rust(text, edge_voice, &ssml_rate, &ssml_pitch).await {
        Ok(bytes) if bytes.len() >= 100 => {
            let _ = tokio::fs::write(&target_file, &bytes).await;
            let mut headers = HeaderMap::new();
            headers.insert(header::CONTENT_TYPE, "audio/mpeg".parse().unwrap());
            headers.insert(header::CACHE_CONTROL, "public, max-age=86400".parse().unwrap());
            headers.insert(header::ACCESS_CONTROL_ALLOW_ORIGIN, "*".parse().unwrap());
            return (StatusCode::OK, headers, bytes).into_response();
        }
        Ok(_) => {
            tracing::warn!("Edge TTS returned empty or too short data for voice: {}", edge_voice);
        }
        Err(e) => {
            tracing::error!("Failed to fetch Edge TTS (voice: {}): {:?}", edge_voice, e);
        }
    }

    (
        StatusCode::INTERNAL_SERVER_ERROR,
        Json(serde_json::json!({"error": "Failed to synthesize Edge TTS audio"})),
    )
        .into_response()
}

pub async fn clear_tts_cache() -> impl IntoResponse {
    let tts_dir = resolve_tts_dir();
    let mut deleted_count = 0;
    if let Ok(entries) = std::fs::read_dir(&tts_dir) {
        for entry in entries.flatten() {
            let path = entry.path();
            if path.is_file() {
                if let Some(ext) = path.extension() {
                    if ext == "mp3" {
                        if std::fs::remove_file(&path).is_ok() {
                            deleted_count += 1;
                        }
                    }
                }
            }
        }
    }
    tracing::info!("Cleared TTS cache: deleted {} mp3 files", deleted_count);
    (
        StatusCode::OK,
        Json(serde_json::json!({
            "message": format!("Đã xóa {} file bộ nhớ đệm âm thanh", deleted_count),
            "deleted_count": deleted_count
        })),
    )
}
