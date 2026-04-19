mod commands;

use commands::reveal::{open_in_vscode, reveal_in_finder};
use commands::symlinks::scan_symlinks;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            scan_symlinks,
            reveal_in_finder,
            open_in_vscode
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
