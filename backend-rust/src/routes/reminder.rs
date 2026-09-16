use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    response::IntoResponse,
    Json,
};
use chrono::{Duration, Local, NaiveDateTime};
use serde_json::json;
use sqlx::SqlitePool;

use crate::error::AppError;
use crate::models::reminder::{
    CreateReminderDto, Reminder, ReminderQueryDto, SnoozeReminderDto, UpdateReminderDto,
};
use crate::routes::ws::broadcast_event;

pub fn parse_datetime(dt_str: &str) -> Result<NaiveDateTime, AppError> {
    let clean = dt_str.trim();
    if let Ok(dt) = NaiveDateTime::parse_from_str(clean, "%Y-%m-%d %H:%M:%S") {
        return Ok(dt);
    }
    if let Ok(dt) = NaiveDateTime::parse_from_str(clean, "%Y-%m-%d %H:%M") {
        return Ok(dt);
    }
    if let Ok(dt) = NaiveDateTime::parse_from_str(clean, "%Y-%m-%dT%H:%M:%S") {
        return Ok(dt);
    }
    if let Ok(dt) = NaiveDateTime::parse_from_str(clean, "%Y-%m-%dT%H:%M") {
        return Ok(dt);
    }
    if let Ok(dt) = NaiveDateTime::parse_from_str(clean, "%Y-%m-%dT%H:%M:%S%.f") {
        return Ok(dt);
    }
    if let Ok(dt) = chrono::DateTime::parse_from_rfc3339(clean) {
        return Ok(dt.naive_local());
    }
    if let Ok(d) = chrono::NaiveDate::parse_from_str(clean, "%Y-%m-%d") {
        if let Some(dt) = d.and_hms_opt(9, 0, 0) {
            return Ok(dt);
        }
    }
    Err(AppError::BadRequest(format!("Định dạng thời gian không hợp lệ: {}", dt_str)))
}

// GET /api/reminders
pub async fn get_reminders(
    State(pool): State<SqlitePool>,
    Query(query): Query<ReminderQueryDto>,
) -> Result<impl IntoResponse, AppError> {
    let mut sql = String::from(
        "SELECT id, title, description, remind_at, repeat_type, sound_theme, tts_message, \
         status, priority, color, created_at, completed_at FROM reminder WHERE 1=1"
    );

    if let Some(ref st) = query.status {
        if st == "active" || st == "pending" {
            sql.push_str(" AND status = 'pending'");
        } else if st == "completed" {
            sql.push_str(" AND status = 'completed'");
        } else if st != "all" {
            sql.push_str(&format!(" AND status = '{}'", st.replace('\'', "''")));
        }
    }

    if let Some(ref d) = query.date {
        sql.push_str(&format!(" AND date(remind_at) = '{}'", d.replace('\'', "''")));
    }

    sql.push_str(" ORDER BY remind_at ASC, priority DESC");

    let reminders: Vec<Reminder> = sqlx::query_as(&sql).fetch_all(&pool).await?;
    Ok(Json(reminders))
}

// GET /api/reminders/counts
pub async fn get_reminder_counts(
    State(pool): State<SqlitePool>,
) -> Result<impl IntoResponse, AppError> {
    let today_str = Local::now().format("%Y-%m-%d").to_string();

    let pending_count: i64 = sqlx::query_scalar(
        "SELECT COUNT(*) FROM reminder WHERE status = 'pending'"
    )
    .fetch_one(&pool)
    .await
    .unwrap_or(0);

    let today_count: i64 = sqlx::query_scalar(
        "SELECT COUNT(*) FROM reminder WHERE status = 'pending' AND date(remind_at) <= date(?)"
    )
    .bind(&today_str)
    .fetch_one(&pool)
    .await
    .unwrap_or(0);

    let overdue_count: i64 = sqlx::query_scalar(
        "SELECT COUNT(*) FROM reminder WHERE status = 'pending' AND remind_at < ?"
    )
    .bind(Local::now().naive_local())
    .fetch_one(&pool)
    .await
    .unwrap_or(0);

    Ok(Json(json!({
        "pending": pending_count,
        "today": today_count,
        "overdue": overdue_count
    })))
}

// POST /api/reminders
pub async fn create_reminder(
    State(pool): State<SqlitePool>,
    Json(payload): Json<CreateReminderDto>,
) -> Result<impl IntoResponse, AppError> {
    if payload.title.trim().is_empty() {
        return Err(AppError::BadRequest("Tiêu đề nhắc nhở không được để trống".into()));
    }

    let remind_at = parse_datetime(&payload.remind_at)?;
    let repeat_type = payload.repeat_type.unwrap_or_else(|| "once".into());
    let sound_theme = payload.sound_theme.unwrap_or_else(|| "bell".into());
    let priority = payload.priority.unwrap_or_else(|| "medium".into());
    let color = payload.color.unwrap_or_else(|| "#10b981".into());
    let now = Local::now().naive_local();

    let result = sqlx::query(
        "INSERT INTO reminder (title, description, remind_at, repeat_type, sound_theme, tts_message, status, priority, color, created_at) \
         VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?)"
    )
    .bind(&payload.title)
    .bind(&payload.description)
    .bind(remind_at)
    .bind(&repeat_type)
    .bind(&sound_theme)
    .bind(&payload.tts_message)
    .bind(&priority)
    .bind(&color)
    .bind(now)
    .execute(&pool)
    .await?;

    let reminder_id = result.last_insert_rowid();

    let reminder: Reminder = sqlx::query_as(
        "SELECT id, title, description, remind_at, repeat_type, sound_theme, tts_message, \
         status, priority, color, created_at, completed_at FROM reminder WHERE id = ?"
    )
    .bind(reminder_id)
    .fetch_one(&pool)
    .await?;

    // Broadcast WebSocket event
    broadcast_event(
        "REMINDER_CREATED",
        serde_json::to_value(&reminder).unwrap_or(json!({ "id": reminder_id })),
    );

    Ok((StatusCode::CREATED, Json(reminder)))
}

// PUT /api/reminders/:id
pub async fn update_reminder(
    State(pool): State<SqlitePool>,
    Path(id): Path<i64>,
    Json(payload): Json<UpdateReminderDto>,
) -> Result<impl IntoResponse, AppError> {
    let existing: Option<Reminder> = sqlx::query_as(
        "SELECT id, title, description, remind_at, repeat_type, sound_theme, tts_message, \
         status, priority, color, created_at, completed_at FROM reminder WHERE id = ?"
    )
    .bind(id)
    .fetch_optional(&pool)
    .await?;

    let existing = existing.ok_or_else(|| AppError::NotFound("Không tìm thấy nhắc nhở".into()))?;

    let title = payload.title.unwrap_or(existing.title);
    let description = payload.description.or(existing.description);
    let remind_at = if let Some(ref dt_str) = payload.remind_at {
        parse_datetime(dt_str)?
    } else {
        existing.remind_at
    };
    let repeat_type = payload.repeat_type.or(existing.repeat_type);
    let sound_theme = payload.sound_theme.or(existing.sound_theme);
    let tts_message = payload.tts_message.or(existing.tts_message);
    let status = payload.status.or(existing.status);
    let priority = payload.priority.or(existing.priority);
    let color = payload.color.or(existing.color);

    let completed_at = if status.as_deref() == Some("completed") {
        Some(Local::now().naive_local())
    } else {
        None
    };

    sqlx::query(
        "UPDATE reminder SET title = ?, description = ?, remind_at = ?, repeat_type = ?, \
         sound_theme = ?, tts_message = ?, status = ?, priority = ?, color = ?, completed_at = ? WHERE id = ?"
    )
    .bind(&title)
    .bind(&description)
    .bind(remind_at)
    .bind(&repeat_type)
    .bind(&sound_theme)
    .bind(&tts_message)
    .bind(&status)
    .bind(&priority)
    .bind(&color)
    .bind(completed_at)
    .bind(id)
    .execute(&pool)
    .await?;

    let updated: Reminder = sqlx::query_as(
        "SELECT id, title, description, remind_at, repeat_type, sound_theme, tts_message, \
         status, priority, color, created_at, completed_at FROM reminder WHERE id = ?"
    )
    .bind(id)
    .fetch_one(&pool)
    .await?;

    broadcast_event(
        "REMINDER_UPDATED",
        serde_json::to_value(&updated).unwrap_or(json!({ "id": id })),
    );

    Ok(Json(updated))
}

// POST /api/reminders/:id/snooze (Hoãn 5p, 10p, 15p, 30p, 1h...)
pub async fn snooze_reminder(
    State(pool): State<SqlitePool>,
    Path(id): Path<i64>,
    Json(payload): Json<SnoozeReminderDto>,
) -> Result<impl IntoResponse, AppError> {
    let existing: Option<Reminder> = sqlx::query_as(
        "SELECT id, title, description, remind_at, repeat_type, sound_theme, tts_message, \
         status, priority, color, created_at, completed_at FROM reminder WHERE id = ?"
    )
    .bind(id)
    .fetch_optional(&pool)
    .await?;

    let existing = existing.ok_or_else(|| AppError::NotFound("Không tìm thấy nhắc nhở".into()))?;

    let minutes = if payload.minutes > 0 { payload.minutes } else { 5 };
    let new_remind_at = Local::now().naive_local() + Duration::minutes(minutes);

    sqlx::query(
        "UPDATE reminder SET remind_at = ?, status = 'pending', completed_at = NULL WHERE id = ?"
    )
    .bind(new_remind_at)
    .bind(id)
    .execute(&pool)
    .await?;

    let updated: Reminder = sqlx::query_as(
        "SELECT id, title, description, remind_at, repeat_type, sound_theme, tts_message, \
         status, priority, color, created_at, completed_at FROM reminder WHERE id = ?"
    )
    .bind(id)
    .fetch_one(&pool)
    .await?;

    broadcast_event(
        "REMINDER_UPDATED",
        serde_json::to_value(&updated).unwrap_or(json!({ "id": id })),
    );

    Ok(Json(json!({
        "status": "success",
        "message": format!("Đã hoãn nhắc nhở thêm {} phút", minutes),
        "reminder": updated
    })))
}

// POST /api/reminders/:id/complete (Đánh dấu hoàn tất hoặc dời chu kỳ lặp)
pub async fn complete_reminder(
    State(pool): State<SqlitePool>,
    Path(id): Path<i64>,
) -> Result<impl IntoResponse, AppError> {
    let existing: Option<Reminder> = sqlx::query_as(
        "SELECT id, title, description, remind_at, repeat_type, sound_theme, tts_message, \
         status, priority, color, created_at, completed_at FROM reminder WHERE id = ?"
    )
    .bind(id)
    .fetch_optional(&pool)
    .await?;

    let existing = existing.ok_or_else(|| AppError::NotFound("Không tìm thấy nhắc nhở".into()))?;
    let repeat = existing.repeat_type.as_deref().unwrap_or("once");
    let now = Local::now().naive_local();

    if repeat == "daily" || repeat == "weekly" || repeat == "monthly" {
        let next_time = match repeat {
            "daily" => existing.remind_at + Duration::days(1),
            "weekly" => existing.remind_at + Duration::weeks(1),
            "monthly" => existing.remind_at + Duration::days(30),
            _ => existing.remind_at,
        };

        sqlx::query(
            "UPDATE reminder SET remind_at = ?, status = 'pending', completed_at = NULL WHERE id = ?"
        )
        .bind(next_time)
        .bind(id)
        .execute(&pool)
        .await?;
    } else {
        sqlx::query(
            "UPDATE reminder SET status = 'completed', completed_at = ? WHERE id = ?"
        )
        .bind(now)
        .bind(id)
        .execute(&pool)
        .await?;
    }

    let updated: Reminder = sqlx::query_as(
        "SELECT id, title, description, remind_at, repeat_type, sound_theme, tts_message, \
         status, priority, color, created_at, completed_at FROM reminder WHERE id = ?"
    )
    .bind(id)
    .fetch_one(&pool)
    .await?;

    broadcast_event(
        "REMINDER_UPDATED",
        serde_json::to_value(&updated).unwrap_or(json!({ "id": id })),
    );

    Ok(Json(json!({
        "status": "success",
        "message": "Đã hoàn thành nhắc nhở",
        "reminder": updated
    })))
}

// DELETE /api/reminders/:id
pub async fn delete_reminder(
    State(pool): State<SqlitePool>,
    Path(id): Path<i64>,
) -> Result<impl IntoResponse, AppError> {
    sqlx::query("DELETE FROM reminder WHERE id = ?")
        .bind(id)
        .execute(&pool)
        .await?;

    broadcast_event(
        "REMINDER_DELETED",
        json!({ "id": id }),
    );

    Ok(Json(json!({
        "status": "success",
        "message": "Đã xóa nhắc nhở thành công"
    })))
}

// Background Task: Tự động quét kiểm tra nhắc nhở đến hạn mỗi 5 giây và gửi WebSocket REMINDER_DUE
pub fn start_reminder_scheduler_task(pool: SqlitePool) {
    tokio::spawn(async move {
        tracing::info!("Reminder scheduler background task started (every 5s)");
        loop {
            tokio::time::sleep(tokio::time::Duration::from_secs(5)).await;
            let now = Local::now().naive_local();

            // Lấy các nhắc nhở pending đã tới hạn
            let due_reminders: Vec<Reminder> = match sqlx::query_as(
                "SELECT id, title, description, remind_at, repeat_type, sound_theme, tts_message, \
                 status, priority, color, created_at, completed_at FROM reminder \
                 WHERE status = 'pending' AND remind_at <= ?"
            )
            .bind(now)
            .fetch_all(&pool)
            .await
            {
                Ok(list) => list,
                Err(err) => {
                    tracing::warn!("Failed to query due reminders: {:?}", err);
                    continue;
                }
            };

            for r in due_reminders {
                tracing::info!("🔔 Reminder due: [{}] {}", r.id, r.title);
                broadcast_event(
                    "REMINDER_DUE",
                    serde_json::to_value(&r).unwrap_or(json!({ "id": r.id, "title": r.title })),
                );
            }
        }
    });
}
