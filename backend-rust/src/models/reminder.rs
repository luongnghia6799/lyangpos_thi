use chrono::NaiveDateTime;
use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Reminder {
    pub id: i64,
    pub title: String,
    pub description: Option<String>,
    pub remind_at: NaiveDateTime,
    pub repeat_type: Option<String>, // 'once', 'daily', 'weekly', 'monthly'
    pub sound_theme: Option<String>, // 'bell', 'chime', 'urgent', 'gentle', 'tts'
    pub tts_message: Option<String>,
    pub status: Option<String>,      // 'pending', 'completed', 'dismissed'
    pub priority: Option<String>,    // 'low', 'medium', 'high'
    pub color: Option<String>,
    pub created_at: Option<NaiveDateTime>,
    pub completed_at: Option<NaiveDateTime>,
}

#[derive(Debug, Clone, Deserialize)]
pub struct CreateReminderDto {
    pub title: String,
    pub description: Option<String>,
    pub remind_at: String, // ISO date string or YYYY-MM-DD HH:MM:SS
    pub repeat_type: Option<String>,
    pub sound_theme: Option<String>,
    pub tts_message: Option<String>,
    pub priority: Option<String>,
    pub color: Option<String>,
}

#[derive(Debug, Clone, Deserialize)]
pub struct UpdateReminderDto {
    pub title: Option<String>,
    pub description: Option<String>,
    pub remind_at: Option<String>,
    pub repeat_type: Option<String>,
    pub sound_theme: Option<String>,
    pub tts_message: Option<String>,
    pub status: Option<String>,
    pub priority: Option<String>,
    pub color: Option<String>,
}

#[derive(Debug, Clone, Deserialize)]
pub struct SnoozeReminderDto {
    pub minutes: i64,
}

#[derive(Debug, Clone, Deserialize)]
pub struct ReminderQueryDto {
    pub status: Option<String>,
    pub date: Option<String>,
}
