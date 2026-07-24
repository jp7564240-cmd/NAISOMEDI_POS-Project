use rusqlite::Connection;
use std::time::{SystemTime, UNIX_EPOCH};

const MAX_ATTEMPTS: u32 = 5;
const LOCKOUT_DURATION_SECS: u64 = 300; // 5 minutes

pub fn check_throttle(conn: &Connection, user_id: i64) -> Result<(), &'static str> {
    let now = SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs();
    
    let mut stmt = conn.prepare("SELECT attempts, locked_until FROM throttle WHERE user_id = ?1").map_err(|_| "DB error")?;
    let mut rows = stmt.query([user_id]).map_err(|_| "DB error")?;
    
    if let Some(row) = rows.next().map_err(|_| "DB error")? {
        let _attempts: u32 = row.get(0).unwrap_or(0);
        let locked_until: Option<u64> = row.get(1).unwrap_or(None);
        
        if let Some(lock_time) = locked_until {
            if now < lock_time {
                return Err("Account temporarily locked due to too many failed attempts");
            }
        }
    }
    
    Ok(())
}

pub fn record_failure(conn: &Connection, user_id: i64) -> Result<(), &'static str> {
    let now = SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs();
    
    // Upsert failure
    conn.execute(
        "INSERT INTO throttle (user_id, attempts) VALUES (?1, 1)
         ON CONFLICT(user_id) DO UPDATE SET 
            attempts = attempts + 1,
            locked_until = CASE WHEN attempts + 1 >= ?2 THEN ?3 ELSE locked_until END",
        (user_id, MAX_ATTEMPTS, now + LOCKOUT_DURATION_SECS),
    ).map_err(|_| "DB error")?;
    
    Ok(())
}

pub fn record_success(conn: &Connection, user_id: i64) -> Result<(), &'static str> {
    conn.execute(
        "UPDATE throttle SET attempts = 0, locked_until = NULL WHERE user_id = ?1",
        [user_id],
    ).map_err(|_| "DB error")?;
    
    Ok(())
}
