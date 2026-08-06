## 2025-03-04 - Dynamic Database Key Injection in SQLCipher Connection
**Vulnerability:** The database connection function used `conn.execute(&format!("PRAGMA key = '{}';", key), [])` which interpolated the dynamic database key directly into a PRAGMA SQL string, introducing a potential SQL injection and key-escaping vulnerability.
**Learning:** It existed because of direct string interpolation/formatting for configuration PRAGMAs instead of using safe parameter binding. SQLCipher PRAGMA values should be updated using dedicated methods to ensure correct escaping.
**Prevention:** Always use `conn.pragma_update(None, "key", &key)` to set the database key, which lets rusqlite handle the escaping internally and prevents SQL injection.
