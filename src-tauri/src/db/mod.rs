use rusqlite::Connection;

pub fn get_connection(key: &str) -> Result<Connection, &'static str> {
    let conn = Connection::open("naisomedi.db").map_err(|_| "Failed to open DB")?;
    
    // PRAGMA key for SQLCipher - use pragma_update to safely handle database keys
    // and prevent SQL injection or escaping issues with special characters.
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
    fn test_db_key_escaping() {
        // Test initializing a test/temp database with a key containing special characters, including single quotes
        let complex_key = "my'secure\"key;with--quotes";
        let test_db_path = "naisomedi_test.db";

        // Clean up any existing test db
        let _ = std::fs::remove_file(test_db_path);

        let conn = Connection::open(test_db_path).expect("Failed to open test DB");

        // PRAGMA key for SQLCipher using pragma_update
        let key_res = conn.pragma_update(None, "key", &complex_key);
        assert!(key_res.is_ok(), "Setting dynamic key with special characters failed");

        // Create a table to ensure data is written to the database file (not a 0-byte file)
        conn.execute("CREATE TABLE test_table (id INTEGER PRIMARY KEY)", []).expect("Failed to create table");

        // Test key by reading schema
        let test_res = conn.query_row("SELECT count(*) FROM sqlite_schema", [], |_| Ok(()));
        assert!(test_res.is_ok(), "Testing DB with special characters key failed");

        // Close connection
        drop(conn);

        // Try opening again with correct key
        let conn2 = Connection::open(test_db_path).expect("Failed to reopen test DB");
        let key_res2 = conn2.pragma_update(None, "key", &complex_key);
        assert!(key_res2.is_ok(), "Setting dynamic key with special characters on reopen failed");
        let test_res2 = conn2.query_row("SELECT count(*) FROM sqlite_schema", [], |_| Ok(()));
        assert!(test_res2.is_ok(), "Testing reopened DB with correct key failed");
        drop(conn2);

        // Try opening again with wrong key - should fail
        let conn3 = Connection::open(test_db_path).expect("Failed to reopen test DB");
        let _ = conn3.pragma_update(None, "key", &"wrong_key");
        let test_res3 = conn3.query_row("SELECT count(*) FROM sqlite_schema", [], |_| Ok(()));
        assert!(test_res3.is_err(), "Testing reopened DB with WRONG key should have failed");
        drop(conn3);

        // Clean up
        let _ = std::fs::remove_file(test_db_path);
    }
}
