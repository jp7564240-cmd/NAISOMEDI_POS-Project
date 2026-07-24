use totp_rs::{Algorithm, TOTP, Secret};

pub fn generate_secret(account_name: &str) -> Result<(String, String), &'static str> {
    let secret = Secret::generate_secret().to_bytes().map_err(|_| "Secret generation failed")?;
    let totp = TOTP::new(
        Algorithm::SHA1,
        6,
        1,
        30,
        secret,
        Some("NaiSoMedi Pharmacy".to_string()),
        account_name.to_string(),
    ).map_err(|_| "TOTP initialization failed")?;
    
    let secret_base32 = totp.get_secret_base32();
    let url = totp.get_url();
    Ok((secret_base32, url))
}

pub fn verify_totp(secret_base32: &str, code: &str) -> bool {
    let secret = match Secret::Encoded(secret_base32.to_string()).to_bytes() {
        Ok(s) => s,
        Err(_) => return false,
    };
    let totp = match TOTP::new(
        Algorithm::SHA1,
        6,
        1,
        30,
        secret,
        None,
        "".to_string(),
    ) {
        Ok(t) => t,
        Err(_) => return false,
    };

    // check_current already applies the step tolerance (which is 1 step of 30s by default)
    // Wait, the step tolerance is the `skew` parameter.
    // The `TOTP::new` signature: Algorithm, digits, skew, step, secret, issuer, account_name.
    // `1` is the skew (±1 step tolerance).
    totp.check_current(code).unwrap_or(false)
}
