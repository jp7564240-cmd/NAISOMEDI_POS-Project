use rusqlite::Connection;

pub fn get_connection(key: &str) -> Result<Connection, &'static str> {
    let conn = Connection::open("naisomedi.db").map_err(|_| "Failed to open DB")?;
    
    // PRAGMA key for SQLCipher
    conn.pragma_update(None, "key", &key).map_err(|_| "Failed to set DB key")?;
    
    // Test key by reading schema
    conn.query_row("SELECT count(*) FROM sqlite_schema", [], |_| Ok(()))
        .map_err(|_| "Invalid DB key")?;
        
    Ok(conn)
}

pub fn initialize_db(key: &str) -> Result<(), &'static str> {
    let conn = get_connection(key)?;
    
    conn.execute(
        "CREATE TABLE IF NOT EXISTS throttle (
            user_id INTEGER PRIMARY KEY,
            attempts INTEGER NOT NULL DEFAULT 0,
            locked_until INTEGER
        )",
        [],
    ).map_err(|_| "Failed to create throttle table")?;
    
    conn.execute(
        "CREATE TABLE IF NOT EXISTS backup_codes (
            id INTEGER PRIMARY KEY,
            user_id INTEGER NOT NULL,
            code_hash TEXT NOT NULL,
            used BOOLEAN NOT NULL DEFAULT 0
        )",
        [],
    ).map_err(|_| "Failed to create backup codes table")?;
    
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;

    #[test]
    fn test_secure_key_with_single_quote() {
        let db_path = "naisomedi.db";
        let backup_path = "naisomedi.db.bak";

        // 1. Back up existing DB if any
        let had_existing = if fs::metadata(db_path).is_ok() {
            fs::rename(db_path, backup_path).expect("Failed to backup existing DB file");
            true
        } else {
            false
        };

        // Ensure we clean up / restore on panic or completion
        struct Cleanup {
            db_path: &'static str,
            backup_path: &'static str,
            had_existing: bool,
        }
        impl Drop for Cleanup {
            fn drop(&mut self) {
                if fs::metadata(self.db_path).is_ok() {
                    let _ = fs::remove_file(self.db_path);
                }
                if self.had_existing {
                    let _ = fs::rename(self.backup_path, self.db_path).expect("Failed to restore DB file");
                }
            }
        }
        let _cleanup = Cleanup { db_path, backup_path, had_existing };

        // 2. Test get_connection and initialize_db with a key containing a single quote
        let key_with_quote = "secure'key'with'single'quote";

        let init_res = initialize_db(key_with_quote);
        assert!(init_res.is_ok(), "Failed to initialize DB with key containing single quote: {:?}", init_res);

        let conn_res = get_connection(key_with_quote);
        assert!(conn_res.is_ok(), "Failed to open DB with key containing single quote: {:?}", conn_res);

        let conn = conn_res.unwrap();
        // Check that tables exist
        let has_throttle: Result<i32, _> = conn.query_row(
            "SELECT count(*) FROM sqlite_schema WHERE type='table' AND name='throttle'",
            [],
            |row| row.get(0)
        );
        assert_eq!(has_throttle.unwrap_or(0), 1);
    }
}
