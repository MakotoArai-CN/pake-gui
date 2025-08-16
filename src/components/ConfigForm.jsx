import React, { useEffect, useRef, useState } from 'react';
import { open } from '@tauri-apps/plugin-dialog';
import {
  Box,
  Typography,
  TextField,
  Button,
  Grid,
  Paper,
  FormControlLabel,
  Checkbox,
  MenuItem,
  IconButton,
  Stack,
  Chip,
  Divider,
  Alert,
  LinearProgress,
  InputAdornment
} from '@mui/material';
import {
  Save as SaveIcon,
  PlayArrow as PlayArrowIcon,
  Add as AddIcon,
  Close as CloseIcon,
  FolderOpen as FolderOpenIcon
} from '@mui/icons-material';

const ConfigForm = ({ config, onChange, onSave, onBuild, buildStatus, buildOutput, currentProject }) => {
  const [inputValues, setInputValues] = useState({
    inject: '',
    safeDomain: ''
  });

  const showSnackbar = (message, severity = 'info') => {
    // 这里应该通过某种方式显示提示消息
    // 由于ConfigForm组件中没有snackbar状态，我们可以使用原生alert作为临时方案
    if (severity === 'error') {
      alert(message);
    }
  };

  // 表单验证
  const validateForm = () => {
    if (!config.url?.trim()) {
      return { isValid: false, error: 'URL是必填项' };
    }
    
    if (!config.name?.trim()) {
      return { isValid: false, error: '应用名称是必填项' };
    }
    
    // 检查应用名称是否包含中文
    const chineseRegex = /[\u4e00-\u9fa5]/;
    if (chineseRegex.test(config.name)) {
      return { isValid: false, error: '应用名称不能包含中文' };
    }
    
    return { isValid: true };
  };

  // 配置更新处理
  const updateConfig = (key, value) => {
    // 如果是图标字段且值为空，则设置默认图标路径
    if (key === 'icon' && !value) {
      // 使用默认图标路径
      value = '../src-tauri/icons/icon.ico';
    }
    onChange({ ...config, [key]: value });
  };

  const buildOutputRef = useRef(null);

  // 滚动到最新的日志
  useEffect(() => {
    if (buildOutputRef.current) {
      buildOutputRef.current.scrollTop = buildOutputRef.current.scrollHeight;
    }
  }, [buildOutput]);

  const addToArray = (key, value) => {
    if (value.trim()) {
      updateConfig(key, [...(config[key] || []), value.trim()]);
      setInputValues(prev => ({ ...prev, [key]: '' }));
    }
  };

  const removeFromArray = (key, index) => {
    updateConfig(key, config[key].filter((_, i) => i !== index));
  };

  // 文件选择功能
  const selectFile = async (key, options = {}) => {
    try {
      const selected = await open(options);
      if (selected) {
        updateConfig(key, selected);
      }
    } catch (error) {
      console.error('Failed to open file dialog:', error);
    }
  };

  // 为数组字段选择文件
  const selectFileForArray = async (key, options = {}) => {
    try {
      const selected = await open(options);
      if (selected) {
        addToArray(key, selected);
      }
    } catch (error) {
      console.error('Failed to open file dialog:', error);
    }
  };

  const handleSaveClick = async () => {
    // 在保存前检查图标设置
    let configToSave = { ...config };
    
    // 如果没有设置图标，使用默认图标
    if (!configToSave.icon) {
      configToSave.icon = '../src-tauri/icons/icon.ico';
    }
    
    const { isValid, error } = validateForm();
    if (isValid) {
      // 传递更新后的配置
      onChange(configToSave);
      onSave();
    } else {
      // 显示错误提示
      showSnackbar(error, 'error');
    }
  };

  const ArrayField = ({ label, configKey, placeholder, helperText }) => (
    <Box sx={{ mb: 2 }}>
      <Typography variant="subtitle2" gutterBottom>
        {label}
      </Typography>
      <Stack spacing={1}>
        {config[configKey]?.map((item, index) => (
          <Chip
            key={index}
            label={item}
            onDelete={() => removeFromArray(configKey, index)}
            color="primary"
            variant="outlined"
          />
        ))}
        <Box sx={{ display: 'flex', gap: 1 }}>
          <TextField
            fullWidth
            size="small"
            value={inputValues[configKey]}
            onChange={(e) => setInputValues(prev => ({ ...prev, [configKey]: e.target.value }))}
            placeholder={placeholder}
            helperText={helperText}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addToArray(configKey, inputValues[configKey]);
              }
            }}
          />
          <Button
            variant="contained"
            color="primary"
            onClick={() => addToArray(configKey, inputValues[configKey])}
            disabled={!inputValues[configKey]}
            startIcon={<AddIcon />}
          >
            Add
          </Button>
          <Button
            variant="outlined"
            onClick={() => selectFileForArray(configKey, { multiple: false })}
            startIcon={<FolderOpenIcon />}
          >
            Browse
          </Button>
        </Box>
      </Stack>
    </Box>
  );

  const FileField = ({ label, configKey, placeholder, filters }) => (
    <TextField
      fullWidth
      label={label}
      value={config[configKey] || ''}
      onChange={(e) => updateConfig(configKey, e.target.value)}
      placeholder={placeholder}
      margin="normal"
      InputProps={{
        endAdornment: (
          <InputAdornment position="end">
            <IconButton
              onClick={() => selectFile(configKey, { filters })}
              edge="end"
            >
              <FolderOpenIcon />
            </IconButton>
          </InputAdornment>
        ),
      }}
    />
  );

  return (
    <Box sx={{ p: 3 }}>
      {/* Actions */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h6" component="h2">
          {currentProject ? `编辑项目: ${currentProject.name}` : '新建项目'}
        </Typography>
        <Stack direction="row" spacing={2}>
          <Button
            variant="contained"
            color="success"
            onClick={handleSaveClick}
            disabled={!config.url?.trim() || !config.name?.trim()}
            startIcon={<SaveIcon />}
          >
            保存
          </Button>
          <Button
            variant="contained"
            onClick={onBuild}
            disabled={buildStatus === 'building' || !config.url?.trim() || !config.name?.trim()}
            startIcon={<PlayArrowIcon />}
          >
            {buildStatus === 'building' ? '构建中...' : '构建'}
          </Button>
        </Stack>
      </Box>

      {/* Build Status */}
      {buildStatus && (
        <Paper sx={{ p: 2, mb: 3 }} variant="outlined">
          <Typography variant="subtitle1" gutterBottom>
            构建状态
          </Typography>
          {buildStatus === 'building' && (
            <LinearProgress sx={{ mb: 1 }} />
          )}
          <Alert 
            severity={
              buildStatus === 'error' ? 'error' :
              buildStatus === 'success' ? 'success' :
              'info'
            }
            sx={{
              '& .MuiAlert-message': {
                width: '100%'
              }
            }}
          >
            <Box
              ref={buildOutputRef}
              sx={{
                maxHeight: 200,
                overflow: 'auto',
                whiteSpace: 'pre-wrap',
                fontFamily: 'monospace',
                fontSize: '0.875rem',
                lineHeight: '0.625rem' // 将行高设置为紧凑显示，约为原来三分之一
              }}
            >
              {buildOutput || `构建状态: ${buildStatus}`}
            </Box>
          </Alert>
        </Paper>
      )}

      <Grid container spacing={3}>
        {/* Basic Settings */}
        <Grid item xs={12} md={6} sx={{ width: '100%' }}>
          <Paper sx={{ p: 3 }} variant="outlined">
            <Typography variant="subtitle1" gutterBottom>
              基本设置
            </Typography>
            
            <TextField
              fullWidth
              required
              label="URL"
              value={config.url || ''}
              onChange={(e) => updateConfig('url', e.target.value)}
              placeholder="https://example.com"
              margin="normal"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => selectFile('url', { 
                        filters: [{
                          name: 'HTML Files',
                          extensions: ['html', 'htm']
                        }, {
                          name: 'All Files',
                          extensions: ['*']
                        }]
                      })}
                      edge="end"
                    >
                      <FolderOpenIcon />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              fullWidth
              required
              label="应用名称"
              value={config.name || ''}
              onChange={(e) => updateConfig('name', e.target.value)}
              placeholder="MyApp"
              margin="normal"
              error={config.name && /[\u4e00-\u9fa5]/.test(config.name)}
              helperText={config.name && /[\u4e00-\u9fa5]/.test(config.name) ? '应用名称不能包含中文' : ''}
            />

            <FileField
              label="图标"
              configKey="icon"
              placeholder="/path/to/icon.png"
              filters={[{
                name: 'Image Files',
                extensions: ['png', 'ico', 'jpg', 'jpeg']
              }]}
            />

            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="宽度"
                  value={config.width || 1200}
                  onChange={(e) => updateConfig('width', parseInt(e.target.value))}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="高度"
                  value={config.height || 780}
                  onChange={(e) => updateConfig('height', parseInt(e.target.value))}
                />
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Advanced Settings */}
        <Grid item xs={12} md={6} sx={{ width: '100%' }}>
          <Paper sx={{ p: 3 }} variant="outlined">
            <Typography variant="subtitle1" gutterBottom>
              高级设置
            </Typography>

            <TextField
              fullWidth
              label="User Agent"
              value={config.userAgent || ''}
              onChange={(e) => updateConfig('userAgent', e.target.value)}
              placeholder="Custom user agent string"
              margin="normal"
            />

            <TextField
              fullWidth
              label="快捷键"
              value={config.activationShortcut || ''}
              onChange={(e) => updateConfig('activationShortcut', e.target.value)}
              placeholder="CmdOrControl+Shift+P"
              margin="normal"
            />

            <FileField
              label="系统托盘图标"
              configKey="systemTrayIcon"
              placeholder="/path/to/tray-icon.png"
              filters={[{
                name: 'Image Files',
                extensions: ['png', 'ico', 'jpg', 'jpeg']
              }]}
            />

            <TextField
              select
              fullWidth
              label="Linux 目标格式"
              value={config.targets || 'all'}
              onChange={(e) => updateConfig('targets', e.target.value)}
              margin="normal"
            >
              <MenuItem value="all">All (deb + appimage)</MenuItem>
              <MenuItem value="deb">DEB</MenuItem>
              <MenuItem value="appimage">AppImage</MenuItem>
            </TextField>

            <ArrayField
              label="注入文件"
              configKey="inject"
              placeholder="path/to/script.js or path/to/style.css"
              helperText="按回车添加新项"
            />

            <ArrayField
              label="安全域名"
              configKey="safeDomain"
              placeholder="example.com"
              helperText="按回车添加新项"
            />
          </Paper>
        </Grid>

        {/* Options */}
        <Grid item xs={12} sx={{ width: '100%' }}>
          <Paper sx={{ p: 3 }} variant="outlined">
            <Typography variant="subtitle1" gutterBottom>
              选项
            </Typography>
            <Grid container spacing={2}>
              {[
                { key: 'useLocalFile', label: '使用本地文件' },
                { key: 'fullscreen', label: '全屏启动' },
                { key: 'hideTitleBar', label: '隐藏标题栏 (Mac)' },
                { key: 'multiArch', label: '多架构 (Mac)' },
                { key: 'debug', label: '调试模式' },
                { key: 'alwaysOnTop', label: '窗口置顶' },
                { key: 'showSystemTray', label: '显示系统托盘' }
              ].map(({ key, label }) => (
                <Grid item xs={12} sm={6} md={3} key={key}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={config[key] || false}
                        onChange={(e) => updateConfig(key, e.target.checked)}
                      />
                    }
                    label={label}
                  />
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ConfigForm;