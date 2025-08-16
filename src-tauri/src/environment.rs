use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::process::Command;
use which::which;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EnvironmentStatus {
    pub status: String, // "ok", "error", "warning", "checking"
    pub version: Option<String>,
    pub path: Option<String>,
}

pub struct EnvironmentChecker;

impl EnvironmentChecker {
    pub fn new() -> Self {
        Self
    }
    
    pub async fn check_all(&self) -> HashMap<String, EnvironmentStatus> {
        let mut results = HashMap::new();
        
        results.insert("nodejs".to_string(), self.check_nodejs().await);
        results.insert("bunjs".to_string(), self.check_bunjs().await);
        results.insert("rust".to_string(), self.check_rust().await);
        results.insert("visualStudio".to_string(), self.check_visual_studio().await);
        results.insert("pake".to_string(), self.check_pake().await);
        
        results
    }
    
    async fn check_nodejs(&self) -> EnvironmentStatus {
        match which("node") {
            Ok(path) => {
                if let Ok(output) = Command::new("node").args(&["--version"]).output() {
                    let version = String::from_utf8_lossy(&output.stdout).trim().to_string();
                    EnvironmentStatus {
                        status: "ok".to_string(),
                        version: Some(version),
                        path: Some(path.to_string_lossy().to_string()),
                    }
                } else {
                    EnvironmentStatus {
                        status: "error".to_string(),
                        version: None,
                        path: None,
                    }
                }
            }
            Err(_) => EnvironmentStatus {
                status: "error".to_string(),
                version: None,
                path: None,
            },
        }
    }
    
    async fn check_bunjs(&self) -> EnvironmentStatus {
        match which("bun") {
            Ok(path) => {
                if let Ok(output) = Command::new("bun").args(&["--version"]).output() {
                    let version = String::from_utf8_lossy(&output.stdout).trim().to_string();
                    EnvironmentStatus {
                        status: "ok".to_string(),
                        version: Some(version),
                        path: Some(path.to_string_lossy().to_string()),
                    }
                } else {
                    EnvironmentStatus {
                        status: "error".to_string(),
                        version: None,
                        path: None,
                    }
                }
            }
            Err(_) => EnvironmentStatus {
                status: "error".to_string(),
                version: None,
                path: None,
            },
        }
    }
    
    async fn check_rust(&self) -> EnvironmentStatus {
        match which("rustc") {
            Ok(path) => {
                if let Ok(output) = Command::new("rustc").args(&["--version"]).output() {
                    let version = String::from_utf8_lossy(&output.stdout).trim().to_string();
                    EnvironmentStatus {
                        status: "ok".to_string(),
                        version: Some(version),
                        path: Some(path.to_string_lossy().to_string()),
                    }
                } else {
                    EnvironmentStatus {
                        status: "error".to_string(),
                        version: None,
                        path: None,
                    }
                }
            }
            Err(_) => EnvironmentStatus {
                status: "error".to_string(),
                version: None,
                path: None,
            },
        }
    }
    
    async fn check_visual_studio(&self) -> EnvironmentStatus {
        // Check for Visual Studio Build Tools on Windows
        #[cfg(target_os = "windows")]
        {
            use std::path::Path;
            
            let vs_paths = vec![
                "C:\\Program Files (x86)\\Microsoft Visual Studio\\2022\\BuildTools",
                "C:\\Program Files (x86)\\Microsoft Visual Studio\\2019\\BuildTools",
                "C:\\Program Files\\Microsoft Visual Studio\\2022\\Community",
                "C:\\Program Files\\Microsoft Visual Studio\\2019\\Community",
            ];
            
            for vs_path in vs_paths {
                if Path::new(vs_path).exists() {
                    return EnvironmentStatus {
                        status: "ok".to_string(),
                        version: Some("Found".to_string()),
                        path: Some(vs_path.to_string()),
                    };
                }
            }
            
            EnvironmentStatus {
                status: "error".to_string(),
                version: None,
                path: None,
            }
        }
        
        #[cfg(not(target_os = "windows"))]
        {
            EnvironmentStatus {
                status: "ok".to_string(),
                version: Some("Not required on this platform".to_string()),
                path: None,
            }
        }
    }
    
    async fn check_pake(&self) -> EnvironmentStatus {
        match which("pake") {
            Ok(path) => {
                if let Ok(output) = Command::new("pake").args(&["--version"]).output() {
                    let version = String::from_utf8_lossy(&output.stdout).trim().to_string();
                    EnvironmentStatus {
                        status: "ok".to_string(),
                        version: Some(version),
                        path: Some(path.to_string_lossy().to_string()),
                    }
                } else {
                    EnvironmentStatus {
                        status: "error".to_string(),
                        version: None,
                        path: None,
                    }
                }
            }
            Err(_) => EnvironmentStatus {
                status: "error".to_string(),
                version: None,
                path: None,
            },
        }
    }
    
    pub async fn install_tool(&self, tool: &str) -> Result<(), Box<dyn std::error::Error>> {
        match tool {
            "nodejs" => {
                // Open Node.js download page
                #[cfg(target_os = "windows")]
                Command::new("cmd").args(&["/c", "start", "https://nodejs.org"]).spawn()?;
                
                #[cfg(target_os = "macos")]
                Command::new("open").args(&["https://nodejs.org"]).spawn()?;
                
                #[cfg(target_os = "linux")]
                Command::new("xdg-open").args(&["https://nodejs.org"]).spawn()?;
            }
            "bunjs" => {
                // Install Bun.js
                #[cfg(not(target_os = "windows"))]
                {
                    Command::new("curl")
                        .args(&["-fsSL", "https://bun.sh/install"])
                        .arg("|")
                        .arg("bash")
                        .spawn()?;
                }
                
                #[cfg(target_os = "windows")]
                {
                    Command::new("powershell")
                        .args(&["-c", "irm bun.sh/install.ps1 | iex"])
                        .spawn()?;
                }
            }
            "rust" => {
                // Install Rust
                #[cfg(not(target_os = "windows"))]
                {
                    Command::new("curl")
                        .args(&["--proto", "=https", "--tlsv1.2", "-sSf", "https://sh.rustup.rs"])
                        .arg("|")
                        .arg("sh")
                        .spawn()?;
                }
                
                #[cfg(target_os = "windows")]
                {
                    Command::new("cmd")
                        .args(&["/c", "start", "https://rustup.rs"])
                        .spawn()?;
                }
            }
            "pake" => {
                // Install pake-cli via bun or bun
                if which("bun").is_ok() {
                    Command::new("bun").args(&["install", "-g", "pake-cli"]).spawn()?;
                } else if which("bun").is_ok() {
                    Command::new("bun").args(&["install", "-g", "pake-cli"]).spawn()?;
                } else {
                    return Err("Neither bun nor bun found".into());
                }
            }
            "visualStudio" => {
                // Open Visual Studio Build Tools download page
                #[cfg(target_os = "windows")]
                Command::new("cmd")
                    .args(&["/c", "start", "https://visualstudio.microsoft.com/downloads/#build-tools-for-visual-studio-2022"])
                    .spawn()?;
            }
            _ => return Err(format!("Unknown tool: {}", tool).into()),
        }
        
        Ok(())
    }
}