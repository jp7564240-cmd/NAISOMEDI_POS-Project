use pbkdf2::pbkdf2_hmac;
use sha2::Sha256;
use aes_gcm::{Aes256Gcm, Key, Nonce, aead::{Aead, KeyInit}};
use rand::{rngs::OsRng, RngCore};
// use subtle::ConstantTimeEq;

pub const ITERATIONS: u32 = 600_000;
pub const KEY_SIZE: usize = 32;
pub const NONCE_SIZE: usize = 12;
pub const SALT_SIZE: usize = 16;

pub fn derive_key(password: &str, salt: &[u8]) -> [u8; KEY_SIZE] {
    let mut key = [0u8; KEY_SIZE];
    pbkdf2_hmac::<Sha256>(password.as_bytes(), salt, ITERATIONS, &mut key);
    key
}

pub fn generate_random_bytes(len: usize) -> Vec<u8> {
    let mut bytes = vec![0u8; len];
    OsRng.fill_bytes(&mut bytes);
    bytes
}

pub fn encrypt(key: &[u8; KEY_SIZE], plaintext: &[u8]) -> Result<(Vec<u8>, [u8; NONCE_SIZE]), &'static str> {
    let cipher = Aes256Gcm::new(Key::<Aes256Gcm>::from_slice(key));
    let mut nonce_bytes = [0u8; NONCE_SIZE];
    OsRng.fill_bytes(&mut nonce_bytes);
    let nonce = Nonce::from_slice(&nonce_bytes);
    
    let ciphertext = cipher.encrypt(nonce, plaintext)
        .map_err(|_| "Encryption error")?;
        
    Ok((ciphertext, nonce_bytes))
}

pub fn decrypt(key: &[u8; KEY_SIZE], nonce_bytes: &[u8; NONCE_SIZE], ciphertext: &[u8]) -> Result<Vec<u8>, &'static str> {
    let cipher = Aes256Gcm::new(Key::<Aes256Gcm>::from_slice(key));
    let nonce = Nonce::from_slice(nonce_bytes);
    
    cipher.decrypt(nonce, ciphertext)
        .map_err(|_| "Decryption error")
}
