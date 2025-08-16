#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;
mod project;
mod environment;

use commands::*;

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            get_projects,
            load_project,
            save_project,
            delete_project,
            get_project_path,
            get_project_config_path,
            get_project_output_path,
            check_environment,
            install_tool,
            update_pake_config,
            build_pake_app
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}