## 2025-02-18 - SQLCipher PRAGMA Key SQL Injection and Escaping Issue
**Vulnerability:** String-interpolating database keys into `PRAGMA key = '...'` statement in SQLCipher/SQLite is vulnerable to SQL injection if the key contains single quotes or malicious input.
**Learning:** Using simple string interpolation fails to escape the key, leading to syntax errors or arbitrary SQL statement injection when special characters or quotes are used in database keys.
**Prevention:** Always use `conn.pragma_update(None, "key", &key)` in rusqlite to securely bind the key and allow rusqlite/SQLCipher to handle dynamic database keys and escaping internally, preventing SQL injection and double-escaping issues.
