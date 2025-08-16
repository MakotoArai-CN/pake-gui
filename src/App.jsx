import React, { useState, useEffect, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import ProjectManager from './components/ProjectManager';
import ConfigForm from './components/ConfigForm';
import EnvironmentCheck from './components/EnvironmentCheck';
import CommandPreview from './components/CommandPreview';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';

function App() {
  const [currentProject, setCurrentProject] = useState(null);
  const [projects, setProjects] = useState([]);
  const [config, setConfig] = useState({
    url: '',
    name: '',
    icon: '',
    width: 1200,
    height: 780,
    useLocalFile: false,
    fullscreen: false,
    hideTitleBar: false,
    multiArch: false,
    inject: [],
    debug: false,
    activationShortcut: '',
    alwaysOnTop: false,
    targets: 'all',
    userAgent: '',
    showSystemTray: false,
    systemTrayIcon: '',
    safeDomain: []
  });
  const [activeTab, setActiveTab] = useState('projects');
  const [buildStatus, setBuildStatus] = useState(null); // null, 'building', 'success', 'error'
  const [buildOutput, setBuildOutput] = useState('');
  const buildOutputRef = useRef([]);

  useEffect(() => {
    loadProjects();
    // 确保默认显示Projects页面
    setActiveTab('projects');
  }, []);

  useEffect(() => {
    // 监听构建输出事件
    const unlisten = listen('build-output', (event) => {
      const newOutput = event.payload;
      setBuildOutput(prev => prev + '\n' + newOutput);
      buildOutputRef.current = [...buildOutputRef.current, newOutput];
    });

    return () => {
      unlisten.then(unlistenFn => unlistenFn());
    };
  }, []);

  const loadProjects = async () => {
    try {
      const projectList = await invoke('get_projects');
      setProjects(projectList);
    } catch (error) {
      console.error('Failed to load projects:', error);
    }
  };

  const handleProjectSelect = async (project) => {
    if (project === null) {
      // 创建新项目
      setCurrentProject(null);
      // 重置配置为默认值
      setConfig({
        url: '',
        name: '',
        icon: '',
        width: 1200,
        height: 780,
        useLocalFile: false,
        fullscreen: false,
        hideTitleBar: false,
        multiArch: false,
        inject: [],
        debug: false,
        activationShortcut: '',
        alwaysOnTop: false,
        targets: 'all',
        userAgent: '',
        showSystemTray: false,
        systemTrayIcon: '',
        safeDomain: []
      });
      // 切换到配置页面
      setActiveTab('config');
    } else {
      // 加载现有项目
      try {
        const loadedProject = await invoke('load_project', { projectId: project.id });
        setCurrentProject(loadedProject);
        // 确保正确设置配置，从project.config中提取所有字段
        setConfig({
          url: loadedProject.config.url || '',
          name: loadedProject.config.name || '',
          icon: loadedProject.config.icon || '',
          width: loadedProject.config.width || 1200,
          height: loadedProject.config.height || 780,
          useLocalFile: loadedProject.config.useLocalFile || false,
          fullscreen: loadedProject.config.fullscreen || false,
          hideTitleBar: loadedProject.config.hideTitleBar || false,
          multiArch: loadedProject.config.multiArch || false,
          inject: loadedProject.config.inject || [],
          debug: loadedProject.config.debug || false,
          activationShortcut: loadedProject.config.activationShortcut || '',
          alwaysOnTop: loadedProject.config.alwaysOnTop || false,
          targets: loadedProject.config.targets || 'all',
          userAgent: loadedProject.config.userAgent || '',
          showSystemTray: loadedProject.config.showSystemTray || false,
          systemTrayIcon: loadedProject.config.systemTrayIcon || '',
          safeDomain: loadedProject.config.safeDomain || []
        });
        // 切换到配置页面
        setActiveTab('config');
      } catch (error) {
        console.error('Failed to load project:', error);
      }
    }
  };

  const handleSaveProject = async () => {
    // 校验必填字段
    if (!config.url) {
      alert('URL is required');
      return;
    }
    
    if (!config.name) {
      alert('Application Name is required');
      return;
    }

    try {
      const project = {
        id: currentProject?.id || Date.now().toString(),
        name: config.name || 'Untitled Project',
        config,
        lastModified: Date.now()
      };
      
      await invoke('save_project', { project });
      setCurrentProject(project);
      await loadProjects(); // 等待项目列表刷新完成
      console.log('Project saved successfully');
    } catch (error) {
      console.error('Failed to save project:', error);
      alert(`Failed to save project: ${error.message || error}`);
    }
  };

  const handleBuild = async () => {
    // 构建前先保存项目
    try {
      const project = {
        id: currentProject?.id || Date.now().toString(),
        name: config.name || 'Untitled Project',
        config,
        lastModified: Date.now()
      };
      
      await invoke('save_project', { project });
      setCurrentProject(project);
      await loadProjects(); // 等待项目列表刷新完成
    } catch (error) {
      console.error('Failed to save project before build:', error);
      alert(`Failed to save project before build: ${error.message || error}`);
      return;
    }
    
    // 开始构建过程
    setBuildStatus('building');
    setBuildOutput('Building application...\n');
    buildOutputRef.current = ['Building application...'];
    
    try {
      // 调用构建命令，传递项目ID
      await invoke('build_pake_app', { config, projectId: currentProject?.id || Date.now().toString() });
      setBuildStatus('success');
      setBuildOutput(prev => prev + '\nBuild completed successfully!');
      buildOutputRef.current = [...buildOutputRef.current, 'Build completed successfully!'];
      // 构建完成后刷新项目列表
      await loadProjects();
    } catch (error) {
      setBuildStatus('error');
      setBuildOutput(prev => prev + `\nBuild failed: ${error}`);
      buildOutputRef.current = [...buildOutputRef.current, `Build failed: ${error}`];
      console.error('Build failed:', error);
      alert(`Build failed: ${error.message || error}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Pake GUI Builder</h1>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="projects">Projects</TabsTrigger>
            <TabsTrigger value="config">Configuration</TabsTrigger>
            <TabsTrigger value="environment">Environment</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
          </TabsList>
          
          <TabsContent value="projects">
            <ProjectManager
              projects={projects}
              onProjectSelect={handleProjectSelect}
              onLoadProjects={loadProjects}
              buildStatus={buildStatus}
            />
          </TabsContent>
          
          <TabsContent value="config">
            <ConfigForm
              config={config}
              onChange={setConfig}
              onSave={handleSaveProject}
              onBuild={handleBuild}
              buildStatus={buildStatus}
              buildOutput={buildOutput}
            />
          </TabsContent>
          
          <TabsContent value="environment">
            <EnvironmentCheck />
          </TabsContent>
          
          <TabsContent value="preview">
            <CommandPreview config={config} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default App;