use crate::project::{Project, ProjectManager};
use crate::environment::{EnvironmentChecker, EnvironmentStatus};
use serde_json::Value;
use std::collections::HashMap;
use tauri_plugin_shell::ShellExt;
use std::path::PathBuf;
use tauri::{Manager, Emitter};
use std::process::Command as StdCommand;

#[tauri::command]
pub async fn get_projects() -> Result<Vec<Project>, String> {
    let manager = ProjectManager::new().map_err(|e| e.to_string())?;
    manager.list_projects().map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn load_project(project_id: String) -> Result<Project, String> {
    let manager = ProjectManager::new().map_err(|e| e.to_string())?;
    manager.load_project(&project_id).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn save_project(project: Project) -> Result<(), String> {
    let manager = ProjectManager::new().map_err(|e| e.to_string())?;
    manager.save_project(project).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn delete_project(project_id: String) -> Result<(), String> {
    let manager = ProjectManager::new().map_err(|e| e.to_string())?;
    manager.delete_project(&project_id).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_project_path(project_id: String) -> Result<String, String> {
    let manager = ProjectManager::new().map_err(|e| e.to_string())?;
    let project_path = manager.get_project_path(&project_id);
    Ok(project_path.to_string_lossy().to_string())
}

#[tauri::command]
pub async fn get_project_config_path(project_id: String) -> Result<String, String> {
    let manager = ProjectManager::new().map_err(|e| e.to_string())?;
    let config_path = manager.get_project_config_path(&project_id);
    Ok(config_path.to_string_lossy().to_string())
}

#[tauri::command]
pub async fn get_project_output_path(project_id: String) -> Result<Option<String>, String> {
    let manager = ProjectManager::new().map_err(|e| e.to_string())?;
    let project = manager.load_project(&project_id).map_err(|e| e.to_string())?;
    
    // 尝试从项目配置中获取输出路径
    if let Some(url) = project.config.get("url").and_then(|v| v.as_str()) {
        let name = project.config.get("name").and_then(|v| v.as_str()).unwrap_or("app");
        // 简单推断输出路径，实际应该根据构建过程确定
        let output_name = if url.starts_with("http") {
            name.to_string()
        } else {
            // 对于本地文件，使用文件名
            PathBuf::from(url)
                .file_stem()
                .and_then(|s| s.to_str())
                .unwrap_or(name)
                .to_string()
        };
        
        // 构建可能的输出路径（在项目目录中）
        let project_dir = manager.get_project_path(&project_id);
        let possible_paths = vec![
            project_dir.join(format!("{}.app", output_name)), // macOS
            project_dir.join(format!("{}.exe", output_name)), // Windows
            project_dir.join(format!("{}", output_name)),     // Linux
        ];
        
        for path in possible_paths {
            if path.exists() {
                return Ok(Some(path.to_string_lossy().to_string()));
            }
        }
    }
    
    Ok(None)
}

#[tauri::command]
pub async fn check_environment() -> Result<HashMap<String, EnvironmentStatus>, String> {
    let checker = EnvironmentChecker::new();
    Ok(checker.check_all().await)
}

#[tauri::command]
pub async fn install_tool(tool: String) -> Result<(), String> {
    let checker = EnvironmentChecker::new();
    checker.install_tool(&tool).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn update_pake_config(_project_id: String, config: Value) -> Result<(), String> {
    // 这个函数目前未被使用，保留以备将来使用
    // 实现逻辑会涉及更新项目配置并同步到pake-cli
    let _ = config; // 避免未使用变量警告
    Ok(())
}

#[tauri::command]
pub async fn build_pake_app(
    app_handle: tauri::AppHandle, 
    config: Value,
    project_id: String
) -> Result<(), String> {
    // 获取主窗口用于发送事件
    let window = app_handle.get_webview_window("main").ok_or("Failed to get main window")?;
    
    let shell = app_handle.shell();
    
    let mut cmd_args = vec![];
    
    // Build pake command from config
    if let Some(url) = config.get("url").and_then(|v| v.as_str()) {
        cmd_args.push(url.to_string());
    } else {
        return Err("URL is required".to_string());
    }
    
    if let Some(name) = config.get("name").and_then(|v| v.as_str()) {
        if !name.is_empty() {
            cmd_args.push("--name".to_string());
            cmd_args.push(name.to_string());
        }
    }
    
    if let Some(icon) = config.get("icon").and_then(|v| v.as_str()) {
        if !icon.is_empty() {
            cmd_args.push("--icon".to_string());
            cmd_args.push(icon.to_string());
        }
    }
    
    if let Some(width) = config.get("width").and_then(|v| v.as_u64()) {
        if width != 1200 {
            cmd_args.push("--width".to_string());
            cmd_args.push(width.to_string());
        }
    }
    
    if let Some(height) = config.get("height").and_then(|v| v.as_u64()) {
        if height != 780 {
            cmd_args.push("--height".to_string());
            cmd_args.push(height.to_string());
        }
    }
    
    if config.get("useLocalFile").and_then(|v| v.as_bool()).unwrap_or(false) {
        cmd_args.push("--use-local-file".to_string());
    }
    
    if config.get("fullscreen").and_then(|v| v.as_bool()).unwrap_or(false) {
        cmd_args.push("--fullscreen".to_string());
    }
    
    if config.get("hideTitleBar").and_then(|v| v.as_bool()).unwrap_or(false) {
        cmd_args.push("--hide-title-bar".to_string());
    }
    
    if config.get("multiArch").and_then(|v| v.as_bool()).unwrap_or(false) {
        cmd_args.push("--multi-arch".to_string());
    }
    
    if config.get("debug").and_then(|v| v.as_bool()).unwrap_or(false) {
        cmd_args.push("--debug".to_string());
    }
    
    if let Some(shortcut) = config.get("activationShortcut").and_then(|v| v.as_str()) {
        if !shortcut.is_empty() {
            cmd_args.push("--activation-shortcut".to_string());
            cmd_args.push(shortcut.to_string());
        }
    }
    
    if config.get("alwaysOnTop").and_then(|v| v.as_bool()).unwrap_or(false) {
        cmd_args.push("--always-on-top".to_string());
    }
    
    if let Some(targets) = config.get("targets").and_then(|v| v.as_str()) {
        if targets != "all" {
            cmd_args.push("--targets".to_string());
            cmd_args.push(targets.to_string());
        }
    }
    
    if let Some(user_agent) = config.get("userAgent").and_then(|v| v.as_str()) {
        if !user_agent.is_empty() {
            cmd_args.push("--user-agent".to_string());
            cmd_args.push(user_agent.to_string());
        }
    }
    
    if config.get("showSystemTray").and_then(|v| v.as_bool()).unwrap_or(false) {
        cmd_args.push("--show-system-tray".to_string());
    }
    
    if let Some(tray_icon) = config.get("systemTrayIcon").and_then(|v| v.as_str()) {
        if !tray_icon.is_empty() {
            cmd_args.push("--system-tray-icon".to_string());
            cmd_args.push(tray_icon.to_string());
        }
    }
    
    if let Some(inject_array) = config.get("inject").and_then(|v| v.as_array()) {
        for inject_file in inject_array {
            if let Some(file) = inject_file.as_str() {
                cmd_args.push("--inject".to_string());
                cmd_args.push(file.to_string());
            }
        }
    }
    
    if let Some(safe_domains) = config.get("safeDomain").and_then(|v| v.as_array()) {
        for domain in safe_domains {
            if let Some(domain_str) = domain.as_str() {
                cmd_args.push("--safe-domain".to_string());
                cmd_args.push(domain_str.to_string());
            }
        }
    }
    
    // 获取项目目录作为工作目录
    let manager = ProjectManager::new().map_err(|e| e.to_string())?;
    let project_dir = manager.get_project_path(&project_id);
    
    // 确保项目目录存在
    if !project_dir.exists() {
        std::fs::create_dir_all(&project_dir).map_err(|e| format!("Failed to create project directory: {}", e))?;
    }
    
    // Execute pake command with real-time output in the project directory
    let (mut rx, _child) = shell
        .command("pake")
        .args(&cmd_args)
        .current_dir(project_dir) // 设置工作目录为项目目录
        .spawn()
        .map_err(|e| format!("Failed to start pake command: {}", e))?;

    // Listen to the command stream and send output to the frontend
    while let Some(event) = rx.recv().await {
        match event {
            tauri_plugin_shell::process::CommandEvent::Stdout(line) => {
                let _ = window.emit("build-output", format!("stdout: {}", String::from_utf8_lossy(&line)));
            }
            tauri_plugin_shell::process::CommandEvent::Stderr(line) => {
                let _ = window.emit("build-output", format!("stderr: {}", String::from_utf8_lossy(&line)));
            }
            tauri_plugin_shell::process::CommandEvent::Error(error) => {
                let _ = window.emit("build-output", format!("error: {}", error));
                return Err(format!("Command error: {}", error));
            }
            tauri_plugin_shell::process::CommandEvent::Terminated(payload) => {
                if !payload.code.map_or(true, |code| code == 0) {
                    return Err("Command terminated with non-zero exit code".to_string());
                }
                break;
            }
            _ => {}
        }
    }
    
    Ok(())
}

#[tauri::command]
pub async fn open_path(path: String) -> Result<(), String> {
    // 使用系统默认方式打开路径（文件或目录）
    #[cfg(target_os = "windows")]
    {
        // Windows系统使用explorer命令
        StdCommand::new("explorer")
            .arg(&path)
            .spawn()
            .map_err(|e| format!("Failed to open path: {}", e))?;
    }
    
    #[cfg(target_os = "macos")]
    {
        // macOS系统使用open命令
        StdCommand::new("open")
            .arg(&path)
            .spawn()
            .map_err(|e| format!("Failed to open path: {}", e))?;
    }
    
    #[cfg(target_os = "linux")]
    {
        // Linux系统使用xdg-open命令
        StdCommand::new("xdg-open")
            .arg(&path)
            .spawn()
            .map_err(|e| format!("Failed to open path: {}", e))?;
    }
    
    Ok(())
}
