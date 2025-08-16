import React, { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-dialog';
import { Command } from '@tauri-apps/plugin-shell';

// Material UI Imports
import {
  Box,
  Card,
  CardContent,
  CardActions,
  IconButton,
  Typography,
  Grid,
  TextField,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Tooltip,
  LinearProgress,
  Snackbar,
  Alert,
  Fab,
  Divider,
} from '@mui/material';

import {
  Add as AddIcon,
  PlayArrow as PlayArrowIcon,
  Folder as FolderIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Edit as EditIcon,
} from '@mui/icons-material';

const ProjectManager = ({ projects, onProjectSelect, onLoadProjects, buildStatus, onNavigateToConfig }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info'
  });

  // 过滤项目
  const filteredProjects = projects.filter(project => 
    project.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.config?.url?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 显示提示消息
  const showSnackbar = (message, severity = 'info') => {
    setSnackbar({
      open: true,
      message,
      severity
    });
  };

  // 新建项目
  const handleNewProject = () => {
    try {
      onProjectSelect(null);
      onNavigateToConfig(null);
      showSnackbar('准备创建新项目', 'info');
    } catch (error) {
      console.error('Failed to create new project:', error);
      showSnackbar('创建新项目失败: ' + error.message, 'error');
    }
  };

  // 打开删除确认对话框
  const handleOpenDeleteDialog = (project, e) => {
    e.stopPropagation();
    setProjectToDelete(project);
    setDeleteDialogOpen(true);
  };

  // 确认删除项目
  const confirmDelete = async () => {
    if (!projectToDelete) return;
    
    setIsDeleting(true);
    setDeleteDialogOpen(false);
    
    try {
      await invoke('delete_project', { projectId: projectToDelete.id });
      await onLoadProjects();
      showSnackbar('项目删除成功', 'success');
    } catch (error) {
      console.error('Failed to delete project:', error);
      showSnackbar('删除项目失败：' + error.message, 'error');
    } finally {
      setIsDeleting(false);
      setSelectedProjectId(null);
      setProjectToDelete(null);
    }
  };

  const handleProjectClick = async (project) => {
    try {
      // 选择项目并导航到配置页面
      onProjectSelect(project);
      onNavigateToConfig(project);
    } catch (error) {
      console.error('Failed to load project:', error);
      showSnackbar('加载项目失败：' + error.message, 'error');
    }
  };

  const handleRebuildProject = async (project, e) => {
    e.stopPropagation();
    try {
      // 直接运行项目的构建命令
      setLoading(true);
      showSnackbar('开始重新构建项目...', 'info');
      
      // 调用构建命令
      await invoke('build_pake_app', { 
        config: project.config, 
        projectId: project.id 
      });
      
      showSnackbar('项目构建完成', 'success');
    } catch (error) {
      console.error('Failed to rebuild project:', error);
      showSnackbar('重新构建项目失败：' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenProjectDirectory = async (project, e) => {
    e.stopPropagation();
    try {
      // 直接使用系统的文件资源管理器打开项目所在目录
      const projectPath = await invoke('get_project_path', { projectId: project.id });
      // 使用新添加的Rust命令打开目录
      await invoke('open_path', { path: projectPath });
    } catch (error) {
      console.error('Failed to open project directory:', error);
      showSnackbar('打开项目目录失败：' + error.message, 'error');
    }
  };

  const handleOpenProjectFile = async (project, e) => {
    e.stopPropagation();
    try {
      // 获取项目文件路径并打开
      const projectPath = await invoke('get_project_output_path', { projectId: project.id });
      if (projectPath) {
        // 使用新添加的Rust命令打开项目输出文件
        await invoke('open_path', { path: projectPath });
      }
    } catch (error) {
      console.error('Failed to open project file:', error);
      showSnackbar('打开项目文件失败：' + error.message, 'error');
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* 顶部工具栏 */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <TextField
          placeholder="搜索项目..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          variant="outlined"
          size="small"
          sx={{ width: 300 }}
          InputProps={{
            startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
          }}
        />
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleNewProject}
          disabled={loading}
          sx={{ 
            textTransform: 'none',
            borderRadius: '24px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
            '&:hover': {
              boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
            }
          }}
        >
          新建项目
        </Button>
      </Box>

      {/* 加载状态 */}
      {loading && <LinearProgress sx={{ mb: 2 }} />}

      {/* 项目列表标题 */}
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 500 }}>
        项目列表 ({filteredProjects.length})
      </Typography>

      {/* 项目列表 */}
      <Grid container spacing={3}>
        {filteredProjects.length === 0 ? (
          <Grid item xs={12}>
            <Card 
              sx={{ 
                textAlign: 'center', 
                py: 8,
                borderRadius: '16px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              }}
            >
              <FolderIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                未找到项目
              </Typography>
              <Typography color="text.secondary" sx={{ mb: 2 }}>
                {searchTerm ? '尝试使用其他搜索词' : '创建一个新项目开始使用'}
              </Typography>
              <Button 
                variant="contained" 
                startIcon={<AddIcon />}
                onClick={handleNewProject}
                sx={{ 
                  borderRadius: '20px',
                  textTransform: 'none'
                }}
              >
                创建新项目
              </Button>
            </Card>
          </Grid>
        ) : (
          filteredProjects.map((project) => (
            <Grid item xs={12} sm={6} md={4} key={project.id}>
              <Card 
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  cursor: 'pointer',
                  '&:hover': {
                    boxShadow: 8,
                  },
                  borderRadius: '16px',
                  transition: 'box-shadow 0.3s ease',
                  ...(selectedProjectId === project.id && {
                    outline: '2px solid',
                    outlineColor: 'primary.main'
                  })
                }}
                onClick={() => handleProjectClick(project)}
              >
                <CardContent sx={{ flexGrow: 1, pb: 0 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                    <Typography variant="h6" noWrap sx={{ fontWeight: 500, maxWidth: '80%' }}>
                      {project.name || '未命名项目'}
                    </Typography>
                    <Chip 
                      label={new Date(project.lastModified).toLocaleDateString()} 
                      size="small" 
                      variant="outlined"
                      sx={{ 
                        height: '20px',
                        borderRadius: '10px',
                        fontSize: '0.7rem'
                      }}
                    />
                  </Box>
                  
                  <Typography color="text.secondary" noWrap sx={{ mb: 2, minHeight: '24px' }}>
                    {project.config?.url || '未设置 URL'}
                  </Typography>
                  
                  {/* 项目状态标签 */}
                  <Box sx={{ mb: 2 }}>
                    {project.config?.debug && (
                      <Chip 
                        label="调试模式" 
                        size="small" 
                        color="warning"
                        variant="outlined"
                        sx={{ 
                          mr: 0.5,
                          borderRadius: '8px',
                          height: '20px'
                        }}
                      />
                    )}
                    {project.config?.useLocalFile && (
                      <Chip 
                        label="本地文件" 
                        size="small" 
                        color="info"
                        variant="outlined"
                        sx={{ 
                          mr: 0.5,
                          borderRadius: '8px',
                          height: '20px'
                        }}
                      />
                    )}
                  </Box>
                </CardContent>
                
                <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
                  <Box>
                    <Tooltip title="编辑项目">
                      <IconButton 
                        size="small"
                        onClick={(e) => handleProjectClick(project, e)}
                        disabled={loading}
                        sx={{ 
                          mr: 0.5,
                          borderRadius: '12px'
                        }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="重建项目">
                      <IconButton 
                        size="small"
                        onClick={(e) => handleRebuildProject(project, e)}
                        disabled={loading}
                        sx={{ 
                          mr: 0.5,
                          borderRadius: '12px'
                        }}
                      >
                        <PlayArrowIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                  
                  <Box>
                    <Tooltip title="打开目录">
                      <IconButton 
                        size="small"
                        onClick={(e) => handleOpenProjectDirectory(project, e)}
                        disabled={loading}
                        sx={{ 
                          mr: 0.5,
                          borderRadius: '12px'
                        }}
                      >
                        <FolderIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="删除项目">
                      <IconButton
                        size="small" 
                        onClick={(e) => handleOpenDeleteDialog(project, e)}
                        disabled={loading || (isDeleting && selectedProjectId === project.id)}
                        color="error"
                        sx={{ 
                          borderRadius: '12px'
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </CardActions>
              </Card>
            </Grid>
          ))
        )}
      </Grid>

      {/* 删除确认对话框 */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
        PaperProps={{
          sx: {
            borderRadius: '16px',
            boxShadow: '0 8px 16px rgba(0,0,0,0.2)'
          }
        }}
      >
        <DialogTitle id="alert-dialog-title" sx={{ pb: 1 }}>
          确认删除项目？
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ pb: 1 }}>
          <DialogContentText id="alert-dialog-description" sx={{ mt: 2 }}>
            您确定要删除项目 "{projectToDelete?.name || '未命名项目'}" 吗？此操作无法撤销。
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button 
            onClick={() => setDeleteDialogOpen(false)} 
            disabled={isDeleting}
            sx={{ 
              textTransform: 'none',
              borderRadius: '20px'
            }}
          >
            取消
          </Button>
          <Button 
            onClick={confirmDelete} 
            color="error" 
            variant="contained"
            disabled={isDeleting}
            autoFocus
            sx={{ 
              textTransform: 'none',
              borderRadius: '20px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
              '&:hover': {
                boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
              }
            }}
          >
            {isDeleting ? '删除中...' : '删除'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 消息提示 */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        sx={{ 
          '& .MuiSnackbarContent-root': {
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
          }
        }}
      >
        <Alert 
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))} 
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
    </Box>
  );
};

export default ProjectManager;