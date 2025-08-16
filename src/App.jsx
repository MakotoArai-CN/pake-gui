import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { open } from '@tauri-apps/plugin-dialog';
import ProjectManager from './components/ProjectManager';
import ConfigForm from './components/ConfigForm';
import EnvironmentCheck from './components/EnvironmentCheck';
import CommandPreview from './components/CommandPreview';
import Settings from './components/Settings';

// Material UI Imports
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  Tab,
  Tabs,
  CircularProgress,
  Container,
  Paper,
  Button,
  Alert,
  Snackbar,
  Chip,
} from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

// Create theme following Material Design 3 principles
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#6750A4', // Material Design 3 primary color
    },
    secondary: {
      main: '#03DAC6', // Material Design 3 secondary color
    },
    background: {
      default: '#F3EDF7', // Material Design 3 background color
      paper: '#FFFFFF',
    },
    text: {
      primary: 'rgba(0, 0, 0, 0.87)',
      secondary: 'rgba(0, 0, 0, 0.6)',
    },
    error: {
      main: '#B3261E',
    },
    warning: {
      main: '#F3BF4F',
    },
    info: {
      main: '#4285F4',
    },
    success: {
      main: '#34A853',
    }
  },
  shape: {
    borderRadius: 12, // Material Design 3 rounded corners
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h6: {
      fontWeight: 500,
    },
    body1: {
      fontSize: '0.875rem',
    }
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '20px',
          textTransform: 'none',
          fontWeight: 500,
        }
      }
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: '16px',
          boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
        }
      }
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: '16px',
          boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
        },
        elevation1: {
          boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
        },
        elevation3: {
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        }
      }
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
          fontSize: '0.875rem',
        }
      }
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: '12px',
          }
        }
      }
    }
  }
});

// Tab Panel Component
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

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
  const [activeTab, setActiveTab] = useState(0);
  const [buildStatus, setBuildStatus] = useState(null);
  const [buildOutput, setBuildOutput] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info'
  });
  const [settings, setSettings] = useState({}); // 添加设置状态

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        await loadProjects();
      } catch (error) {
        console.error('Failed to initialize:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  useEffect(() => {
    // 监听构建输出事件
    const unlisten = listen('build-output', (event) => {
      const newOutput = event.payload;
      setBuildOutput(prev => prev + '\n' + newOutput);
      showSnackbar(newOutput, 'info');
    });

    return () => {
      unlisten.then(unlistenFn => unlistenFn());
    };
  }, []);

  const showSnackbar = (message, severity = 'info') => {
    setSnackbar({
      open: true,
      message,
      severity
    });
  };

  const handleSnackbarClose = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const loadProjects = async () => {
    try {
      setLoading(true);
      const projectList = await invoke('get_projects');
      if (!projectList) {
        throw new Error('无法加载项目列表');
      }
      setProjects(projectList);
    } catch (error) {
      console.error('Failed to load projects:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleProjectSelect = async (project) => {
    if (project === null) {
      setCurrentProject(null);
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
    } else {
      try {
        const loadedProject = await invoke('load_project', { projectId: project.id });
        if (!loadedProject) {
          throw new Error('项目加载失败');
        }
        
        setCurrentProject(loadedProject);
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
        showSnackbar('项目加载成功', 'success');
      } catch (error) {
        console.error('Failed to load project:', error);
        showSnackbar('加载项目失败：' + error.message, 'error');
      }
    }
  };

  const handleSaveProject = async () => {
    if (!config.url?.trim()) {
      showSnackbar('请输入 URL', 'error');
      return;
    }
    
    if (!config.name?.trim()) {
      showSnackbar('请输入应用名称', 'error');
      return;
    }

    try {
      setLoading(true);
      const project = {
        id: currentProject?.id || Date.now().toString(),
        name: config.name.trim(),
        config: {
          ...config,
          url: config.url.trim(),
          name: config.name.trim()
        },
        lastModified: Date.now()
      };
      
      await invoke('save_project', { project });
      setCurrentProject(project);
      await loadProjects();
      showSnackbar('项目保存成功', 'success');
      setActiveTab(0); // 返回项目列表
    } catch (error) {
      console.error('Failed to save project:', error);
      showSnackbar('保存项目失败：' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleBuild = async () => {
    try {
      const project = {
        id: currentProject?.id || Date.now().toString(),
        name: config.name || 'Untitled Project',
        config,
        lastModified: Date.now()
      };
      
      await invoke('save_project', { project });
      setCurrentProject(project);
      await loadProjects();
      
      setBuildStatus('building');
      setBuildOutput('Building application...\n');
      showSnackbar('开始构建应用...', 'info');
      
      await invoke('build_pake_app', { config, projectId: project.id });
      setBuildStatus('success');
      setBuildOutput(prev => prev + '\nBuild completed successfully!');
      showSnackbar('构建完成', 'success');
      
      // 发送系统通知
      try {
        // 注意：Tauri的通知API可能需要额外配置
        // 这里使用console.log作为占位符
        console.log('Build completed notification would be sent here');
        // 如果要实现真正的系统通知，需要：
        // 1. 添加notification插件: bun add @tauri-apps/plugin-notification
        // 2. 在tauri.conf.json中配置权限
        // 3. 使用类似以下的代码:
        // import { requestPermission, isPermissionGranted, sendNotification } from '@tauri-apps/plugin-notification';
        // const permissionGranted = await isPermissionGranted();
        // if (!permissionGranted) {
        //   const permission = await requestPermission();
        //   if (permission !== 'granted') {
        //     return;
        //   }
        // }
        // await sendNotification({
        //   title: 'Pake GUI Builder',
        //   body: `项目 "${project.name}" 构建完成!`
        // });
      } catch (notificationError) {
        console.error('Failed to send notification:', notificationError);
      }
      
      await loadProjects();
    } catch (error) {
      setBuildStatus('error');
      setBuildOutput(prev => prev + `\nBuild failed: ${error}`);
      showSnackbar('构建失败：' + error.message, 'error');
      console.error('Build failed:', error);
    }
  };

  // 处理设置更改
  const handleSettingsChange = (newSettings) => {
    setSettings(newSettings);
  };

  if (loading) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100vh',
            flexDirection: 'column',
            gap: 2
          }}
        >
          <CircularProgress />
          <Typography variant="body1" color="text.secondary">
            加载中...
          </Typography>
        </Box>
      </ThemeProvider>
    );
  }

  if (error) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100vh'
          }}
        >
          <Paper
            elevation={3}
            sx={{
              p: 4,
              textAlign: 'center',
              maxWidth: 400
            }}
          >
            <Typography variant="h5" color="error" gutterBottom>
              错误
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              {error}
            </Typography>
            <Button
              variant="contained"
              onClick={() => window.location.reload()}
              sx={{
                borderRadius: '20px'
              }}
            >
              重试
            </Button>
          </Paper>
        </Box>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ flexGrow: 1, bgcolor: 'background.default', minHeight: '100vh' }}>
        <AppBar 
          position="static" 
          color="primary" 
          elevation={1}
          sx={{ 
            borderRadius: 0,
            bgcolor: 'primary.main',
          }}
        >
          <Toolbar>
            <Typography 
              variant="h6" 
              component="h1" 
              sx={{ 
                flexGrow: 1,
                fontWeight: 500
              }}
            >
              Pake GUI Builder
            </Typography>
            {currentProject && (
              <Chip
                label={`编辑: ${currentProject.name}`}
                variant="outlined"
                sx={{ 
                  mr: 2, 
                  color: 'white', 
                  borderColor: 'white',
                  borderRadius: '8px'
                }}
              />
            )}
            {buildStatus === 'building' && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CircularProgress size={20} color="inherit" />
                <Typography variant="body2" sx={{ color: 'white' }}>
                  构建中...
                </Typography>
              </Box>
            )}
          </Toolbar>
        </AppBar>

        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
          <Paper 
            elevation={1}
            sx={{ 
              borderRadius: '16px',
              overflow: 'hidden'
            }}
          >
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs
                value={activeTab}
                onChange={(_, newValue) => setActiveTab(newValue)}
                aria-label="应用标签页"
                variant="scrollable"
                scrollButtons="auto"
                sx={{
                  '& .MuiTabs-indicator': {
                    backgroundColor: 'primary.main',
                  }
                }}
              >
                <Tab 
                  label="项目" 
                  id="tab-0"
                  aria-controls="tabpanel-0"
                  sx={{
                    fontWeight: 500
                  }}
                />
                <Tab 
                  label="配置" 
                  id="tab-1"
                  aria-controls="tabpanel-1"
                  sx={{
                    fontWeight: 500
                  }}
                />
                <Tab 
                  label="环境" 
                  id="tab-2"
                  aria-controls="tabpanel-2"
                  sx={{
                    fontWeight: 500
                  }}
                />
                <Tab 
                  label="预览" 
                  id="tab-3"
                  aria-controls="tabpanel-3"
                  sx={{
                    fontWeight: 500
                  }}
                />
                <Tab 
                  label="设置" 
                  id="tab-4"
                  aria-controls="tabpanel-4"
                  sx={{
                    fontWeight: 500
                  }}
                />
              </Tabs>
            </Box>

            <TabPanel value={activeTab} index={0}>
              <ProjectManager
                projects={projects}
                onProjectSelect={handleProjectSelect}
                onLoadProjects={loadProjects}
                buildStatus={buildStatus}
                onNavigateToConfig={(project) => {
                  handleProjectSelect(project);
                  setActiveTab(1);
                }}
              />
            </TabPanel>
            
            <TabPanel value={activeTab} index={1}>
              <ConfigForm
                config={config}
                onChange={setConfig}
                onSave={handleSaveProject}
                onBuild={handleBuild}
                buildStatus={buildStatus}
                buildOutput={buildOutput}
                currentProject={currentProject}
              />
            </TabPanel>
            
            <TabPanel value={activeTab} index={2}>
              <EnvironmentCheck />
            </TabPanel>
            
            <TabPanel value={activeTab} index={3}>
              <CommandPreview config={config} />
            </TabPanel>
            
            <TabPanel value={activeTab} index={4}>
              <Settings onSettingsChange={handleSettingsChange} />
            </TabPanel>
          </Paper>
        </Container>
      </Box>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        sx={{
          '& .MuiSnackbarContent-root': {
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
          }
        }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbar.severity}
          variant="filled"
          elevation={6}
          sx={{
            borderRadius: '12px',
            width: '100%'
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </ThemeProvider>
  );
}

export default App;