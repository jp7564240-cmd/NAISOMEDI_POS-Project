use sha2::{Sha256, Digest};
use rand::{rngs::OsRng, RngCore};
use subtle::ConstantTimeEq;

pub fn generate_backup_codes(count: usize) -> Vec<String> {
    let mut codes = Vec::with_capacity(count);
    for _ in 0..count {
        let mut bytes = [0u8; 4];
        OsRng.fill_bytes(&mut bytes);
        let code = format!("{:08x}", u32::from_ne_bytes(bytes));
        codes.push(code);
    }
    codes
}

pub fn hash_backup_code(code: &str, salt: &str) -> String {
    let mut hasher = Sha256::new();
    hasher.update(salt.as_bytes());
    hasher.update(code.as_bytes());
    let result = hasher.finalize();
    hex::encode(result)
}

pub fn verify_backup_code(code: &str, salt: &str, stored_hash: &str) -> bool {
    let computed_hash = hash_backup_code(code, salt);
    // Constant time comparison
    computed_hash.as_bytes().ct_eq(stored_hash.as_bytes()).into()
}
