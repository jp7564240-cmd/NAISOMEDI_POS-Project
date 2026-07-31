use rusqlite::Connection;

pub fn get_connection(key: &str) -> Result<Connection, &'static str> {
    let conn = Connection::open("naisomedi.db").map_err(|_| "Failed to open DB")?;
    
    // PRAGMA key for SQLCipher - use pragma_update to prevent SQL injection and handle escaping safely
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
    fn test_db_key_escaping_and_injection() {
        // Use a temporary database file for the test to avoid interfering with production DB
        let temp_db_path = "test_escaped.db";
        let _ = std::fs::remove_file(temp_db_path); // Clean up if left over

        {
            let conn = Connection::open(temp_db_path).expect("Failed to open test DB");

            // Set a key containing a single quote and other special characters
            let key_with_quotes = "my'secure'\"key; -- injection test";
            conn.pragma_update(None, "key", &key_with_quotes).expect("Failed to set key with pragma_update");

            // Create a test table to verify we can write to the encrypted DB
            conn.execute(
                "CREATE TABLE test_table (id INTEGER PRIMARY KEY, value TEXT)",
                [],
            ).expect("Failed to create table in encrypted DB");
        }

        // Reopen and try to decrypt with the exact same key containing single quotes
        {
            let conn = Connection::open(temp_db_path).expect("Failed to open test DB");
            let key_with_quotes = "my'secure'\"key; -- injection test";
            conn.pragma_update(None, "key", &key_with_quotes).expect("Failed to set key with pragma_update");

            // We should be able to query the schema successfully
            let count: i64 = conn.query_row(
                "SELECT count(*) FROM sqlite_schema",
                [],
                |row| row.get(0),
            ).expect("Failed to read schema with correct key containing quotes");
            assert!(count >= 1);
        }

        // Reopen and try to decrypt with an invalid key to ensure encryption is actually working
        {
            let conn = Connection::open(temp_db_path).expect("Failed to open test DB");
            let wrong_key = "wrong_key";
            conn.pragma_update(None, "key", &wrong_key).expect("Setting wrong key should succeed");

            // Trying to read the schema should fail because the key is incorrect
            let result = conn.query_row(
                "SELECT count(*) FROM sqlite_schema",
                [],
                |_| Ok(()),
            );
            assert!(result.is_err(), "Reading schema with wrong key should fail");
        }

        // Clean up the temporary test database file
        let _ = std::fs::remove_file(temp_db_path);
    }
}
