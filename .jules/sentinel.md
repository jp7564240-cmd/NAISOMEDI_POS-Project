## 2025-02-13 - SQLCipher Dynamic Key Injection
**Vulnerability:** String formatted dynamic keys in `PRAGMA key` statements are susceptible to SQL injection, double-escaping, and execution errors.
**Learning:** In rusqlite with SQLCipher, setting keys using `conn.execute(&format!("PRAGMA key = '{}';", key), [])` bypasses SQL parameter safety because `PRAGMA` statements are not parameterized in this format, leaving the application vulnerable if the key contains unexpected characters or user-controlled input.
**Prevention:** Use rusqlite's built-in `conn.pragma_update(None, "key", &key)` helper, which handles the internal escaping and parameterization safely.
