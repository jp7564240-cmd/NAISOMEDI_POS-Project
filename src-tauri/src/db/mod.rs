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
    fn test_db_key_escaping() {
        // Clean up any existing DB file to ensure a clean slate
        let _ = fs::remove_file("naisomedi.db");

        // A key containing single quotes to verify escaping prevents SQL syntax/injection errors.
        let test_key = "test'secure'key";

        // 1. Initial creation and schema writing
        let res = initialize_db(test_key);
        if let Err(e) = res {
            panic!("initialize_db failed: {}", e);
        }

        // 2. Open connection again and verify read/query is successful
        let conn_res = get_connection(test_key);
        assert!(conn_res.is_ok(), "Should open DB successfully with the same single-quoted key");

        // 3. Verify a wrong key fails
        let wrong_conn_res = get_connection("wrong_key");
        assert!(wrong_conn_res.is_err(), "Opening with wrong key should fail");

        // 4. Clean up after test
        let _ = fs::remove_file("naisomedi.db");
    }
}
