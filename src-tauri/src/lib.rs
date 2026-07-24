pub mod commands;
pub mod security;
pub mod db;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() { 
    tauri::Builder::default()
        .setup(|_app| {
            let _ = db::initialize_db("temp_key_for_dev_mode");
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::auth::verify_totp, 
            commands::auth::enroll_totp,
            commands::auth::generate_backup_codes_cmd,
            commands::sales::create_sale
        ])
        .run(tauri::generate_context!())
        .expect("failed to run NaiSoMedi"); 
}
