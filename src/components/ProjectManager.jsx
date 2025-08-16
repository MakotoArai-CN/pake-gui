import React from 'react';
import { Plus, Play, FolderOpen, Trash2, RotateCcw, Folder } from 'lucide-react';
import { invoke } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-dialog';
import { Command } from '@tauri-apps/plugin-shell';

const ProjectManager = ({ projects, onProjectSelect, onLoadProjects, buildStatus }) => {
  const handleNewProject = () => {
    // 创建新项目时传递null，表示创建新项目
    onProjectSelect(null);
  };

  const handleDeleteProject = async (project, e) => {
    e.stopPropagation();
    try {
      await invoke('delete_project', { projectId: project.id });
      onLoadProjects();
    } catch (error) {
      console.error('Failed to delete project:', error);
    }
  };

  const handleRebuildProject = async (project, e) => {
    e.stopPropagation();
    try {
      // 设置项目配置并切换到配置页面
      onProjectSelect(project.id);
    } catch (error) {
      console.error('Failed to rebuild project:', error);
    }
  };

  const handleOpenProjectDirectory = async (project, e) => {
    e.stopPropagation();
    try {
      // 获取项目目录路径并打开
      const projectPath = await invoke('get_project_path', { projectId: project.id });
      await open({ 
        mode: 'folder', 
        directory: true,
        defaultPath: projectPath 
      });
    } catch (error) {
      console.error('Failed to open project directory:', error);
    }
  };

  const handleOpenProjectFile = async (project, e) => {
    e.stopPropagation();
    try {
      // 获取项目文件路径并打开
      const projectPath = await invoke('get_project_output_path', { projectId: project.id });
      if (projectPath) {
        // 尝试打开项目输出文件
        await Command.create('open', [projectPath]).execute();
      }
    } catch (error) {
      console.error('Failed to open project file:', error);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Project Manager</h2>
        <button
          onClick={handleNewProject}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          <Plus size={16} />
          <span>New Project</span>
        </button>
      </div>

      <div className="grid gap-4">
        {projects.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <FolderOpen size={48} className="mx-auto mb-4 opacity-50" />
            <p>No projects found. Create a new project to get started.</p>
          </div>
        ) : (
          projects.map((project) => (
            <div
              key={project.id}
              className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
              onClick={() => onProjectSelect(project)}
            >
              <div className="flex-1">
                <h3 className="font-medium">{project.name}</h3>
                <p className="text-sm text-gray-500">{project.config.url}</p>
                <p className="text-xs text-gray-400">
                  Last modified: {new Date(project.lastModified).toLocaleDateString()}
                </p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={(e) => handleRebuildProject(project, e)}
                  className="p-2 text-blue-600 hover:bg-blue-100 rounded-md"
                  title="Rebuild Project"
                >
                  <Play size={16} />
                </button>
                <button
                  onClick={(e) => handleOpenProjectDirectory(project, e)}
                  className="p-2 text-gray-600 hover:bg-gray-100 rounded-md"
                  title="Open Directory"
                >
                  <FolderOpen size={16} />
                </button>
                <button
                  onClick={(e) => handleDeleteProject(project, e)}
                  className="p-2 text-red-600 hover:bg-red-100 rounded-md"
                  title="Delete Project"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ProjectManager;