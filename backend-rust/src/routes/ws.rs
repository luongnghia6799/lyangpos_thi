use axum::{
    extract::{
        ws::{Message, WebSocket, WebSocketUpgrade},
        State,
    },
    response::IntoResponse,
};
use futures_util::{SinkExt, StreamExt};
use serde::{Deserialize, Serialize};
use std::sync::{Arc, OnceLock};
use tokio::sync::broadcast;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WsBroadcastMessage {
    pub r#type: String,
    pub payload: serde_json::Value,
    #[serde(default)]
    pub source_ip: Option<String>,
    #[serde(default)]
    pub timestamp: i64,
}

pub struct WsHub {
    pub tx: broadcast::Sender<String>,
}

impl Default for WsHub {
    fn default() -> Self {
        let (tx, _rx) = broadcast::channel(100);
        Self { tx }
    }
}

static WS_HUB: OnceLock<Arc<WsHub>> = OnceLock::new();

pub fn get_ws_hub() -> Arc<WsHub> {
    WS_HUB.get_or_init(|| Arc::new(WsHub::default())).clone()
}

pub fn broadcast_event(event_type: &str, payload: serde_json::Value) {
    let hub = get_ws_hub();
    let msg = WsBroadcastMessage {
        r#type: event_type.to_string(),
        payload,
        source_ip: None,
        timestamp: chrono::Utc::now().timestamp_millis(),
    };

    if let Ok(json_str) = serde_json::to_string(&msg) {
        let _ = hub.tx.send(json_str);
    }
}

pub async fn ws_handler(ws: WebSocketUpgrade) -> impl IntoResponse {
    ws.on_upgrade(handle_socket)
}

async fn handle_socket(socket: WebSocket) {
    let (mut sender, mut receiver) = socket.split();
    let hub = get_ws_hub();
    let mut rx = hub.tx.subscribe();

    // Task 1: Forward broadcast messages from hub to this client WebSocket
    let mut send_task = tokio::spawn(async move {
        while let Ok(msg) = rx.recv().await {
            if sender.send(Message::Text(msg)).await.is_err() {
                break;
            }
        }
    });

    // Task 2: Receive messages from client (if any) and broadcast or log
    let hub_clone = hub.clone();
    let mut recv_task = tokio::spawn(async move {
        while let Some(Ok(msg)) = receiver.next().await {
            match msg {
                Message::Text(text) => {
                    // Try parsing as broadcast message from client
                    if let Ok(mut parsed) = serde_json::from_str::<WsBroadcastMessage>(&text) {
                        parsed.timestamp = chrono::Utc::now().timestamp_millis();
                        if let Ok(re_encoded) = serde_json::to_string(&parsed) {
                            let _ = hub_clone.tx.send(re_encoded);
                        }
                    }
                }
                Message::Ping(p) => {
                    // Handled automatically by axum/tungstenite
                }
                Message::Close(_) => break,
                _ => {}
            }
        }
    });

    // If either task finishes, abort the other
    tokio::select! {
        _ = (&mut send_task) => recv_task.abort(),
        _ = (&mut recv_task) => send_task.abort(),
    };
}
