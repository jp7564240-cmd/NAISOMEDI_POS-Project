use rusqlite::Connection;

pub fn get_connection(key: &str) -> Result<Connection, &'static str> {
    let conn = Connection::open("naisomedi.db").map_err(|_| "Failed to open DB")?;
    
    // PRAGMA key for SQLCipher set via pragma_update to safely escape the key internally
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

    #[test]
    fn test_initialize_and_get_connection() {
        // Clean up any existing file from previous runs or failed tests
        let _ = std::fs::remove_file("naisomedi.db");

        let key = "test_key_123'with_single_quotes_to_verify_escaping";
        // Initialize the DB
        let init_res = initialize_db(key);
        assert!(init_res.is_ok(), "Failed to initialize DB with key containing single quotes");

        // Try getting connection with same key
        let conn_res = get_connection(key);
        assert!(conn_res.is_ok(), "Failed to connect to DB with correct key");

        // Try getting connection with wrong key to verify it fails
        let conn_fail = get_connection("wrong_key");
        assert!(conn_fail.is_err(), "Successfully connected with wrong key, which is insecure!");

        // Clean up test database file
        let _ = std::fs::remove_file("naisomedi.db");
    }
}
