# Sentinel Security Journal

## 2026-03-05 - SQL Injection in SQLCipher Key Setting
**Vulnerability:** Dynamic database keys were set using custom formatted SQL strings inside standard `PRAGMA key = '...'` execution. If a database key contains a single quote, it could break out of the string literal boundaries, potentially causing a SQL injection or a syntax error.
**Learning:** SQLCipher PRAGMA keys should not be format-inserted into raw execute statements. Doing so exposes the database connection to SQL injection or double-escaping issues.
**Prevention:** Use `conn.pragma_update(None, "key", &key)` to set the key dynamically, allowing rusqlite to handle escaping internally.
