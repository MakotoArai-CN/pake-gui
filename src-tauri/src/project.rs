use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::fs;
use std::path::PathBuf;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Project {
    pub id: String,
    pub name: String,
    pub config: Value,
    #[serde(rename = "lastModified")]
    pub last_modified: u64,
}

pub struct ProjectManager {
    projects_dir: PathBuf,
}

impl ProjectManager {
    pub fn new() -> Result<Self, Box<dyn std::error::Error>> {
        let mut projects_dir = dirs::home_dir().ok_or("Could not find home directory")?;
        projects_dir.push(".pake-gui");
        
        if !projects_dir.exists() {
            fs::create_dir_all(&projects_dir)?;
        }
        
        Ok(Self { projects_dir })
    }
    
    pub fn list_projects(&self) -> Result<Vec<Project>, Box<dyn std::error::Error>> {
        let mut projects = Vec::new();
        
        if !self.projects_dir.exists() {
            return Ok(projects);
        }
        
        for entry in fs::read_dir(&self.projects_dir)? {
            let entry = entry?;
            let path = entry.path();
            
            // 检查是否为目录且包含tauri.conf.json文件
            if path.is_dir() {
                let config_path = path.join("tauri.conf.json");
                if config_path.exists() {
                    let content = fs::read_to_string(config_path)?;
                    let project: Project = serde_json::from_str(&content)?;
                    projects.push(project);
                }
            }
        }
        
        projects.sort_by(|a, b| b.last_modified.cmp(&a.last_modified));
        Ok(projects)
    }
    
    pub fn load_project(&self, project_id: &str) -> Result<Project, Box<dyn std::error::Error>> {
        let project_dir = self.projects_dir.join(project_id);
        let config_path = project_dir.join("tauri.conf.json");
        let content = fs::read_to_string(config_path)?;
        let project: Project = serde_json::from_str(&content)?;
        Ok(project)
    }
    
    pub fn save_project(&self, mut project: Project) -> Result<(), Box<dyn std::error::Error>> {
        project.last_modified = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)?
            .as_millis() as u64;
            
        // 为项目创建独立目录
        let project_dir = self.projects_dir.join(&project.id);
        if !project_dir.exists() {
            fs::create_dir_all(&project_dir)?;
        }
        
        // 保存项目配置到项目目录下的tauri.conf.json
        let config_path = project_dir.join("tauri.conf.json");
        let content = serde_json::to_string_pretty(&project)?;
        fs::write(config_path, content)?;
        Ok(())
    }
    
    pub fn delete_project(&self, project_id: &str) -> Result<(), Box<dyn std::error::Error>> {
        let project_dir = self.projects_dir.join(project_id);
        if project_dir.exists() {
            std::fs::remove_dir_all(project_dir)?;
        }
        Ok(())
    }
    
    // 添加公共方法来获取特定项目的路径
    pub fn get_project_path(&self, project_id: &str) -> PathBuf {
        self.projects_dir.join(project_id)
    }
    
    // 添加公共方法来获取项目配置文件路径
    pub fn get_project_config_path(&self, project_id: &str) -> PathBuf {
        self.projects_dir.join(project_id).join("tauri.conf.json")
    }
}