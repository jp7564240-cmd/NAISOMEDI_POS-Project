## 2025-02-15 - [Database Key Injection via SQLCipher PRAGMA key]
**Vulnerability:** Dynamic database encryption keys passed to the SQLite `PRAGMA key = '{}';` configuration statement were vulnerable to SQL injection/escaping issues because single quotes inside the key were not escaped.
**Learning:** SQLCipher encryption keys are set using a `PRAGMA` statement, which does not support parameterized query arguments. If the key is not sanitized/escaped, inputting single quotes allows terminating the SQL literal and executing arbitrary SQL queries or creating syntax errors.
**Prevention:** Sanitise any dynamic SQL string literal inputs in SQLite by doubling single quote characters (replacing `'` with `''`) to keep the input bound safely within the string literal.
