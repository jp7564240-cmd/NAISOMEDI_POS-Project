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
    fn test_initialize_db_with_secure_key() {
        // Ensure no leftover test DB
        let _ = fs::remove_file("naisomedi.db");

        let res = initialize_db("my_secure_test_key_123");
        assert!(res.is_ok(), "Failed to initialize database: {:?}", res);

        // Try opening with correct key
        let conn_ok = get_connection("my_secure_test_key_123");
        assert!(conn_ok.is_ok(), "Should successfully connect with correct key");

        // Try opening with wrong key - should fail
        let conn_err = get_connection("wrong_key");
        assert!(conn_err.is_err(), "Should fail to connect with wrong key");

        // Clean up
        let _ = fs::remove_file("naisomedi.db");
    }
}
