use serde::Serialize;
#[derive(Serialize)] pub struct SaleResult { pub sale_id: String, pub duplicate: bool }
#[tauri::command]
pub fn create_sale(client_sale_id: String, total_cents: i64) -> Result<SaleResult, String> { if total_cents < 0 { return Err("invalid integer money amount".into()); } Ok(SaleResult { sale_id: client_sale_id, duplicate: false }) }
