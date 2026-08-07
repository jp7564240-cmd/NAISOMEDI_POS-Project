use rusqlite::Connection;

pub fn get_connection(key: &str) -> Result<Connection, &'static str> {
    let conn = Connection::open("naisomedi.db").map_err(|_| "Failed to open DB")?;
    
    // PRAGMA key for SQLCipher - Use pragma_update to let rusqlite handle escaping internally
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
    use std::sync::Mutex;
    use std::fs;

    lazy_static::lazy_static! {
        static ref DB_LOCK: Mutex<()> = Mutex::new(());
    }

    fn cleanup_db() {
        let _ = fs::remove_file("naisomedi.db");
    }

    #[test]
    fn test_db_init_and_connection() {
        let _lock = DB_LOCK.lock().unwrap();
        cleanup_db();

        let key = "secure_test_key";
        let res = initialize_db(key);
        assert!(res.is_ok(), "Failed to initialize DB: {:?}", res.err());

        // Reconnect with same key
        let conn = get_connection(key);
        assert!(conn.is_ok(), "Failed to reconnect with valid key");

        // Reconnect with invalid key
        let conn_invalid = get_connection("wrong_key");
        assert!(conn_invalid.is_err(), "Expected failure with invalid key");

        cleanup_db();
    }

    #[test]
    fn test_db_key_with_escapes() {
        let _lock = DB_LOCK.lock().unwrap();
        cleanup_db();

        // Testing a key containing single quotes, double quotes, semicolons, etc.
        // This would have broken or caused injection in string formatting!
        let complex_key = "test'key\"with;escapes\\and%symbols";
        let res = initialize_db(complex_key);
        assert!(res.is_ok(), "Failed to initialize with complex key: {:?}", res.err());

        let conn = get_connection(complex_key);
        assert!(conn.is_ok(), "Failed to connect with complex key");

        cleanup_db();
    }
}
