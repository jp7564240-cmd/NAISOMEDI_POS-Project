## 2025-02-14 - [SQLCipher Encryption Key Injection in SQLite Connection]
**Vulnerability:** The application set the SQLCipher database encryption key using `conn.execute(&format!("PRAGMA key = '{}';", key), [])`. Because the password/key was directly interpolated into the SQL statement, any password containing a single quote or other special characters could lead to SQL injection or connection failure due to double-escaping issues.
**Learning:** Performing string formatting/interpolation on database administration commands (PRAGMAs) carries SQL injection risks similar to data manipulation statements.
**Prevention:** Always use safe APIs such as rusqlite's `conn.pragma_update(None, "key", &key)` which handles formatting and parameter escaping internally, preventing injection.
