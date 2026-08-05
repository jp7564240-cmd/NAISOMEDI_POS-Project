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
    use std::sync::Mutex;

    lazy_static::lazy_static! {
        static ref DB_LOCK: Mutex<()> = Mutex::new(());
    }

    fn cleanup() {
        let _ = fs::remove_file("naisomedi.db");
    }

    #[test]
    fn test_db_initialization_and_correct_key() {
        run_test(|| {
            let key = "secure_test_key_123";
            assert!(initialize_db(key).is_ok());

            let conn = get_connection(key);
            assert!(conn.is_ok());
        });
    }

    #[test]
    fn test_db_incorrect_key() {
        run_test(|| {
            let key = "valid_key_123";
            assert!(initialize_db(key).is_ok());

            // Attempting to connect with incorrect key should fail
            let conn = get_connection("wrong_key_456");
            assert!(conn.is_err());
        });
    }

    #[test]
    fn test_special_characters_key() {
        run_test(|| {
            // Key with single quotes and special characters to verify safety under pragma_update
            let key = "unsafe'key'with\"quotes'and;semicolons";
            assert!(initialize_db(key).is_ok());

            let conn = get_connection(key);
            assert!(conn.is_ok());
        });
    }

    fn run_test<F: FnOnce()>(f: F) {
        let _guard = DB_LOCK.lock().unwrap();
        cleanup();
        f();
        cleanup();
    }
}
