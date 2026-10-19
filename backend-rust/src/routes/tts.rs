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
    pub category: Option<String>,
}

fn sanitize_category(cat: &str) -> &'static str {
    let lower = cat.to_lowercase();
    if lower.contains("qty") || lower.contains("so_luong") || lower.contains("soluong") {
        "so_luong"
    } else if lower.contains("tien") || lower.contains("amount") || lower.contains("currency") || lower.contains("price") {
        "so_tien"
    } else if lower.contains("alias") || lower.contains("san_pham") || lower.contains("product") || lower.contains("mon") {
        "alias"
    } else {
        "he_thong"
    }
}

fn detect_category_from_text(text: &str) -> &'static str {
    let t = text.trim();
    let clean = remove_accents(t).to_lowercase();

    // 1. Số tiền: chứa đồng, vnd, ngan, nghin, trieu, ty, hoac template gia
    if clean.contains("dong") || clean.contains("vnd") || clean.contains("dạ") || clean.contains("da ") || 
       clean.contains("tong tien") || clean.contains("so tien") || clean.contains("thanh toan") {
        return "so_tien";
    }

    // 2. Số lượng: nếu là số đếm kèm dấu phẩy hoặc chuỗi số đếm đơn giản
    // ví dụ: "mot,", "hai,", "ba,", "1", "2", "3", "muoi,"
    if t.ends_with(',') || t.parse::<f64>().is_ok() {
        return "so_luong";
    }

    let is_number_word = match clean.trim_matches(',').trim() {
        "khong" | "mot" | "hai" | "ba" | "bon" | "tu" | "nam" | "sau" | "bay" | "tam" | "chin" | "muoi" | "lam" => true,
        _ => false,
    };
    if is_number_word {
        return "so_luong";
    }

    // 3. Hệ thống / Common Phrases
    if clean == "cam on quy khach" || clean == "da xoa" || clean == "da soan" || 
       clean == "soan hang" || clean == "da soan xong" || clean == "tra hang" {
        return "he_thong";
    }

    // 4. Mặc định là tên món / alias sản phẩm hoặc đơn vị tính
    "alias"
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

const WIN_EPOCH: f64 = 11_644_473_600.0;
const S_TO_NS: f64 = 1_000_000_000.0;

const SHA256_INITIAL: [u32; 8] = [
    0x6A09E667, 0xBB67AE85, 0x3C6EF372, 0xA54FF53A,
    0x510E527F, 0x9B05688C, 0x1F83D9AB, 0x5BE0CD19,
];
const SHA256_STATE: [u32; 8] = [
    0xFD9FBEA2, 0x91243CE7, 0xBE499094, 0xCD2E1E0A,
    0x6C006F49, 0x04BD35AB, 0xFEB0A7E4, 0x03EFFBD2,
];
const SHA256_ROUND_CONSTANTS: [u32; 64] = [
    0x428A2F98, 0x71374491, 0xB5C0FBCF, 0xE9B5DBA5,
    0x3956C25B, 0x59F111F1, 0x923F82A4, 0xAB1C5ED5,
    0xD807AA98, 0x12835B01, 0x243185BE, 0x550C7DC3,
    0x72BE5D74, 0x80DEB1FE, 0x9BDC06A7, 0xC19BF174,
    0xE49B69C1, 0xEFBE4786, 0x0FC19DC6, 0x240CA1CC,
    0x2DE92C6F, 0x4A7484AA, 0x5CB0A9DC, 0x76F988DA,
    0x983E5152, 0xA831C66D, 0xB00327C8, 0xBF597FC7,
    0xC6E00BF3, 0xD5A79147, 0x06CA6351, 0x14292967,
    0x27B70A85, 0x2E1B2138, 0x4D2C6DFC, 0x53380D13,
    0x650A7354, 0x766A0ABB, 0x81C2C92E, 0x92722C85,
    0xA2BFE8A1, 0xA81A664B, 0xC24B8B70, 0xC76C51A3,
    0xD192E819, 0xD6990624, 0xF40E3585, 0x106AA070,
    0x19A4C116, 0x1E376C08, 0x2748774C, 0x34B0BCB5,
    0x391C0CB3, 0x4ED8AA4A, 0x5B9CCA4F, 0x682E6FF3,
    0x748F82EE, 0x78A5636F, 0x84C87814, 0x8CC70208,
    0x90BEFFFA, 0xA4506CEB, 0xBEF9A3F7, 0xC67178F2,
];

const CS64_COEFFICIENTS: [(u32, u32); 14] = [
    (0xE82E91B1, 0xB32700D0),
    (0x44DE24C6, 0x88DFF51D),
    (0x3BEB65BC, 0x29514038),
    (0xC89C5933, 0xB328CBDF),
    (0x8D1EC211, 0xD405B4D5),
    (0x314EF5D5, 0x26E55F3C),
    (0xE92491B1, 0x607801C6),
    (0xF0A5B9D5, 0x82B2C1FB),
    (0x06064CF3, 0xFA51A3DA),
    (0xDA79FA60, 0x207CC464),
    (0xBED20560, 0x3C3C74F3),
    (0x89F9C9F8, 0xD2D14B61),
    (0x35FA38C6, 0xBB04A2C1),
    (0xCB49E3C6, 0xC5626167),
];
const CS64_FACTOR: u32 = 0x82893933;
const CS64_ADJUSTMENT0: u32 = 0xF2F90B1A;
const CS64_ADJUSTMENT1: u32 = 0x0B1A0000;

#[inline]
fn rol16(v: u32) -> u32 {
    v.rotate_left(16)
}

#[inline]
fn sigma0(x: u32) -> u32 {
    x.rotate_right(7) ^ x.rotate_right(18) ^ (x >> 3)
}

#[inline]
fn sigma1(x: u32) -> u32 {
    x.rotate_right(17) ^ x.rotate_right(19) ^ (x >> 10)
}

fn expand_sha256_schedule(words: &mut [u32; 64], start: usize) {
    for i in start..64 {
        let s0 = sigma0(words[i - 15]);
        let s1 = sigma1(words[i - 2]);
        words[i] = words[i - 16]
            .wrapping_add(s0)
            .wrapping_add(words[i - 7])
            .wrapping_add(s1);
    }
}

fn sha256_rounds(state: [u32; 8], words: &[u32; 64], first_round: usize) -> [u32; 8] {
    let [mut a, mut b, mut c, mut d, mut e, mut f, mut g, mut h] = state;
    for i in first_round..64 {
        let constant = if first_round == 14 && i == 14 {
            0xC9DC06A7
        } else {
            SHA256_ROUND_CONSTANTS[i]
        };
        let s1 = e.rotate_right(6) ^ e.rotate_right(11) ^ e.rotate_right(25);
        let ch = (e & f) ^ (!e & g);
        let temp1 = h
            .wrapping_add(s1)
            .wrapping_add(ch)
            .wrapping_add(constant)
            .wrapping_add(words[i]);
        let s0 = a.rotate_right(2) ^ a.rotate_right(13) ^ a.rotate_right(22);
        let maj = (a & b) ^ (a & c) ^ (b & c);
        let temp2 = s0.wrapping_add(maj);

        h = g;
        g = f;
        f = e;
        e = d.wrapping_add(temp1);
        d = c;
        c = b;
        b = a;
        a = temp1.wrapping_add(temp2);
    }
    [a, b, c, d, e, f, g, h]
}

const SHA256_SCHEDULE: [u32; 14] = [
    0xEB24BF9E, 0x1558691F, 0xA0C09EE2, 0x0CFA32BA,
    0xA622EE8C, 0xD1DD9491, 0xC0DD25A0, 0xF9E70AB6,
    0xF0C31573, 0x7058CE4E, 0x7188E606, 0x00E5AB33,
    0xD258B060, 0x72766564,
];
const SHA256_ADJUSTMENT: u32 = 0xC9DC06A7;
const SHA256_SIGMA0_ADJUSTMENT: u32 = 0x059C0B80;
const SHA256_SIGMA1_ADJUSTMENT: u32 = 0x000B92C0;

fn sha256_init(data: &[u8]) -> [u32; 8] {
    let mut words = [0u32; 64];
    words[14] = ((data[0] as u32) << 16) | ((data[1] as u32) << 8) | (data[2] as u32);
    words[15] = ((data[3] as u32) << 24)
        | ((data[4] as u32) << 16)
        | ((data[5] as u32) << 8)
        | (data[6] as u32);

    for index in 16..30 {
        let mut value = SHA256_SCHEDULE[index - 16];
        if index - 2 >= 14 {
            let s1 = sigma1(words[index - 2]);
            value = value.wrapping_add(if index == 16 {
                s1 ^ SHA256_SIGMA1_ADJUSTMENT
            } else {
                s1
            });
        }
        if index - 7 >= 14 {
            value = value.wrapping_add(words[index - 7]);
        }
        if index - 15 >= 14 {
            let s0 = sigma0(words[index - 15]);
            value = value.wrapping_add(if index == 29 {
                s0 ^ SHA256_SIGMA0_ADJUSTMENT
            } else {
                s0
            });
        }
        words[index] = value;
    }

    words[30] = sigma1(words[28])
        .wrapping_add(words[23])
        .wrapping_add(sigma0(words[15]))
        .wrapping_add(words[14])
        .wrapping_add(SHA256_ADJUSTMENT)
        .wrapping_sub(SHA256_ROUND_CONSTANTS[14]);

    expand_sha256_schedule(&mut words, 31);
    let working = sha256_rounds(SHA256_STATE, &words, 14);
    let mut out = [0u32; 8];
    for i in 0..8 {
        out[i] = SHA256_INITIAL[i].wrapping_add(working[i]);
    }
    out
}

fn sha256_digest(data: &[u8]) -> [u8; 32] {
    let length = 57 + data.len();
    let pad_len = (55 - (length as isize)).rem_euclid(64) as usize;

    let mut padded = Vec::with_capacity(data.len() - 7 + 1 + pad_len + 8);
    padded.extend_from_slice(&data[7..]);
    padded.push(0x80);
    padded.resize(padded.len() + pad_len, 0);
    padded.extend_from_slice(&((length as u64) * 8).to_be_bytes());

    let mut state = sha256_init(&data[..7]);

    for chunk in padded.chunks_exact(64) {
        let mut words = [0u32; 64];
        for i in 0..16 {
            words[i] = u32::from_be_bytes([
                chunk[i * 4],
                chunk[i * 4 + 1],
                chunk[i * 4 + 2],
                chunk[i * 4 + 3],
            ]);
        }
        expand_sha256_schedule(&mut words, 16);
        let working = sha256_rounds(state, &words, 0);
        for i in 0..8 {
            state[i] = state[i].wrapping_add(working[i]);
        }
    }

    let mut out = [0u8; 32];
    for (i, val) in state.iter().enumerate() {
        out[i * 4..(i + 1) * 4].copy_from_slice(&val.to_be_bytes());
    }
    out
}

fn words_le4_even(data: &[u8]) -> Vec<u32> {
    let pad = (4 - (data.len() % 4)) % 4;
    let mut buf = data.to_vec();
    buf.resize(buf.len() + pad, 0);
    let mut words = Vec::with_capacity((buf.len() / 4) + 1);
    for chunk in buf.chunks_exact(4) {
        words.push(u32::from_le_bytes([chunk[0], chunk[1], chunk[2], chunk[3]]));
    }
    if words.len() % 2 != 0 {
        words.push(0);
    }
    words
}

fn cs64_digest(data: &[u8], digest: &[u8; 32]) -> (u32, u32) {
    let key_a = u32::from_le_bytes([digest[0], digest[1], digest[2], digest[3]]) | 1;
    let key_b = u32::from_le_bytes([digest[4], digest[5], digest[6], digest[7]]) | 1;

    let factor_a = key_a.wrapping_mul(CS64_FACTOR);
    let factor_b = key_b.wrapping_mul(CS64_FACTOR);
    let factors = [factor_a, factor_b];

    let mut terms = Vec::new();
    let mut offsets = Vec::new();

    for (idx, &(coeff, off)) in CS64_COEFFICIENTS.iter().enumerate() {
        terms.push(coeff.wrapping_mul(factors[idx % 2]));
        offsets.push(off);
    }

    let mut prefixed = Vec::with_capacity(data.len() + 1);
    prefixed.push(0);
    prefixed.extend_from_slice(data);

    let extra_words = words_le4_even(&prefixed);
    for (idx, word) in extra_words.into_iter().enumerate() {
        let mut term = word.wrapping_mul(if idx % 2 == 0 { key_a } else { key_b });
        let mut offset = rol16(word).wrapping_mul(if idx % 2 == 0 { 0xEF0569FB } else { 0xC31713DB });
        if idx == 0 {
            term = term.wrapping_add(CS64_ADJUSTMENT0.wrapping_mul(factors[0]));
            offset = offset.wrapping_add(CS64_ADJUSTMENT1);
        }
        terms.push(term);
        offsets.push(offset);
    }

    let mut swap_acc = 0u32;
    let mut swap_last = 0u32;
    let mut state = 0u32;
    let mut acc = 0u32;

    for i in (0..terms.len()).step_by(2) {
        let x = terms[i];
        let y = terms[i + 1];

        let mut t = rol16(offsets[i].wrapping_add(x));
        let mut q = t.wrapping_mul(0x76F50F34);
        swap_acc = swap_acc.wrapping_add(rol16(q).wrapping_mul(0xC3EFEA97)).wrapping_add(q);

        t = rol16(offsets[i + 1].wrapping_add(y));
        q = t.wrapping_mul(0x1881CE3C);
        swap_last = rol16(q).wrapping_mul(0x35BD1EC9).wrapping_add(q);
        swap_acc = swap_acc.wrapping_add(swap_last);

        state = state.wrapping_mul(key_a).wrapping_add(x);
        state = rol16(state).wrapping_mul(0xCF98B111);
        state = rol16(state).wrapping_mul(0x87085B9F);
        state = rol16(state).wrapping_mul(0x12CEB96D);
        state = rol16(state).wrapping_mul(0x257E1D83);
        acc = acc.wrapping_add(state);

        t = state.wrapping_mul(key_b).wrapping_add(y);
        t = rol16(t).wrapping_mul(0xA27416F5);
        t = rol16(t).wrapping_mul(0xD38396FF);
        state = rol16(rol16(t).wrapping_mul(0x7C932B89)).wrapping_mul(0xBFA49F69);
        acc = acc.wrapping_add(state);
    }

    (swap_last ^ state, swap_acc ^ acc)
}

pub fn generate_sec_ms_gec_v2(unix_timestamp: Option<f64>) -> String {
    let unix_secs = unix_timestamp.unwrap_or_else(|| chrono::Utc::now().timestamp() as f64);
    let mut ticks = unix_secs + WIN_EPOCH;
    ticks -= ticks % 300.0;
    ticks *= S_TO_NS / 100.0;

    let str_to_hash = format!("{:.0}{}", ticks, EDGE_TRUSTED_CLIENT_TOKEN);
    let digest = sha256_digest(str_to_hash.as_bytes());
    let (c1, c2) = cs64_digest(str_to_hash.as_bytes(), &digest);

    let mut cs64_bytes = [0u8; 8];
    cs64_bytes[..4].copy_from_slice(&c1.to_le_bytes());
    cs64_bytes[4..].copy_from_slice(&c2.to_le_bytes());

    format!("{}-{}", hex::encode(cs64_bytes).to_uppercase(), hex::encode(digest).to_uppercase())
}

fn generate_sec_ms_gmt() -> String {
    chrono::Utc::now().format("%a, %d %b %Y %H:%M:%S GMT").to_string()
}

fn generate_request_id() -> String {
    let now = chrono::Utc::now().timestamp_nanos_opt().unwrap_or(0);
    format!("{:032x}", now)
}

pub async fn fetch_edge_tts_rust(text: &str, voice: &str, rate: &str, pitch: &str) -> anyhow::Result<Vec<u8>> {
    let gec = generate_sec_ms_gec_v2(None);
    let conn_id = generate_request_id();
    let gec_version = format!("2-{}", CHROMIUM_FULL_VERSION);

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

    let muid = {
        let now = chrono::Utc::now().timestamp_nanos_opt().unwrap_or(0);
        let mut b = [0u8; 16];
        b[..8].copy_from_slice(&now.to_be_bytes());
        b[8..].copy_from_slice(&(now ^ 0x55AA55AA55AA55AA).to_le_bytes());
        hex::encode(b).to_uppercase()
    };
    headers.insert("Cookie", HeaderValue::from_str(&format!("muid={};", muid)).unwrap());

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

    let category = match params.category {
        Some(ref c) if !c.trim().is_empty() => sanitize_category(c),
        _ => detect_category_from_text(text),
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

    let tts_dir = resolve_tts_dir();
    let category_dir = tts_dir.join(category);
    let _ = std::fs::create_dir_all(&category_dir);

    let base_dir = get_base_dir();
    let cache_dirs = [
        category_dir.clone(),
        tts_dir.join("so_luong"),
        tts_dir.join("alias"),
        tts_dir.join("so_tien"),
        tts_dir.join("he_thong"),
        tts_dir.clone(),
        base_dir.join("tts"),
        base_dir.join("resources").join("tts_cache"),
        base_dir.join("_up_").join("tts_cache"),
    ];

    let mut found_path: Option<PathBuf> = None;

    // Hasher with full text (including Vietnamese tones/diacritics), voice, rate, pitch
    let mut hasher = Md5::new();
    hasher.update(format!("{}_{}_{}_{}", text, voice_suffix, ssml_rate, ssml_pitch).as_bytes());
    let hash_primary = format!("{:x}", hasher.finalize());
    let text_hash = &hash_primary[..6];
    let hash_tts = format!("tts_{}_{}_{}_{}.mp3", hash_primary, voice_suffix, rate_slug, pitch_slug);

    // Collision-free unique filename with text hash to distinguish words like 'tám' vs 'tấm'
    let unique_human_name = format!("{}_{}_{}_{}_{}.mp3", safe_slug, text_hash, voice_suffix, rate_slug, pitch_slug);
    let legacy_human_name = format!("{}_{}_{}_{}.mp3", safe_slug, voice_suffix, rate_slug, pitch_slug);

    // 1. Stage 1: Exact hashed candidates (guaranteed collision-free across any cache dir)
    let exact_candidates = [
        unique_human_name.clone(),
        hash_tts.clone(),
    ];

    for dir in &cache_dirs {
        for cand in &exact_candidates {
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

    // 2. Stage 2: Legacy backward compatibility
    if found_path.is_none() {
        let mut default_hasher = Md5::new();
        default_hasher.update(format!("{}_{}", text, voice_suffix).as_bytes());
        let legacy_hash = format!("{:x}", default_hasher.finalize());
        let legacy_hash_cand = format!("tts_{}_{}.mp3", legacy_hash, voice_suffix);

        // Safe across dirs because legacy_hash is an MD5 of the exact accented text
        for dir in &cache_dirs {
            let p = dir.join(&legacy_hash_cand);
            if p.exists() && std::fs::metadata(&p).map(|m| m.len() >= 100).unwrap_or(false) {
                found_path = Some(p);
                break;
            }
        }

        // Un-hashed candidates: ONLY check within category_dir, and NEVER check for sensitive homonyms like 'tam'
        if found_path.is_none() && safe_slug != "tam" {
            let unhashed_cands = [
                legacy_human_name,
                format!("{}_{}.mp3", safe_slug, voice_suffix),
                format!("{}.mp3", safe_slug),
            ];
            for cand in &unhashed_cands {
                let p = category_dir.join(cand);
                if p.exists() && std::fs::metadata(&p).map(|m| m.len() >= 100).unwrap_or(false) {
                    found_path = Some(p);
                    break;
                }
            }
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

    let target_file = category_dir.join(&unique_human_name);

    let edge_voice = if voice_suffix == "nam" {
        "vi-VN-NamMinhNeural"
    } else {
        "vi-VN-HoaiMyNeural"
    };

    // Native Microsoft Edge-TTS via WebSocket in Rust (HoaiMy & NamMinh Neural AI)
    match fetch_edge_tts_rust(text, edge_voice, &ssml_rate, &ssml_pitch).await {
        Ok(bytes) if bytes.len() >= 100 => {
            tracing::info!("Edge TTS synthesized successfully for voice: {}", edge_voice);
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
            tracing::error!("Failed to fetch Edge TTS for voice {}: {:?}", edge_voice, e);
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

    fn remove_mp3s_recursive(dir: &Path, count: &mut usize) {
        if let Ok(entries) = std::fs::read_dir(dir) {
            for entry in entries.flatten() {
                let path = entry.path();
                if path.is_dir() {
                    remove_mp3s_recursive(&path, count);
                } else if path.is_file() {
                    if let Some(ext) = path.extension() {
                        if ext == "mp3" && std::fs::remove_file(&path).is_ok() {
                            *count += 1;
                        }
                    }
                }
            }
        }
    }

    remove_mp3s_recursive(&tts_dir, &mut deleted_count);
    tracing::info!("Cleared TTS cache: deleted {} mp3 files across subfolders", deleted_count);
    (
        StatusCode::OK,
        Json(serde_json::json!({
            "message": format!("Đã xóa {} file bộ nhớ đệm âm thanh", deleted_count),
            "deleted_count": deleted_count
        })),
    )
}
