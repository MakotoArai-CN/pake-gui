import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Grid,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  Divider,
  Chip
} from '@mui/material';
import { open } from '@tauri-apps/plugin-dialog';

const Settings = ({ onSettingsChange }) => {
  const [settings, setSettings] = useState({
    projectSavePath: '.pake-cli',
    projectNamePattern: '{timestamp}',
    language: 'zh'
  });
  
  const [patternParts, setPatternParts] = useState({
    name: false,
    time: false,
    year: false,
    month: false,
    day: false,
    timestamp: true
  });

  // 加载设置
  useEffect(() => {
    const loadSettings = async () => {
      try {
        // 从本地存储加载设置
        const savedSettings = localStorage.getItem('pake-gui-settings');
        if (savedSettings) {
          const parsed = JSON.parse(savedSettings);
          setSettings(parsed);
          
          // 解析项目命名模式
          parsePattern(parsed.projectNamePattern);
        } else {
          // 如果没有保存的设置，保存默认设置
          const defaultSettings = {
            projectSavePath: '.pake-cli',
            projectNamePattern: '{timestamp}',
            language: 'zh'
          };
          localStorage.setItem('pake-gui-settings', JSON.stringify(defaultSettings));
        }
      } catch (error) {
        console.error('Failed to load settings:', error);
      }
    };

    loadSettings();
  }, []);

  // 解析项目命名模式
  const parsePattern = (pattern) => {
    if (!pattern) return;
    
    const parts = {
      name: pattern.includes('{name}'),
      time: pattern.includes('{time}'),
      year: pattern.includes('{year}'),
      month: pattern.includes('{month}'),
      day: pattern.includes('{day}'),
      timestamp: pattern.includes('{timestamp}')
    };
    setPatternParts(parts);
  };

  // 更新设置
  const updateSettings = (key, value) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    localStorage.setItem('pake-gui-settings', JSON.stringify(newSettings));
    
    // 通知父组件设置已更改
    if (onSettingsChange) {
      onSettingsChange(newSettings);
    }
  };

  // 更新项目命名模式
  const updatePatternPart = (part, checked) => {
    const newParts = { ...patternParts, [part]: checked };
    setPatternParts(newParts);
    
    // 构建新模式字符串
    let pattern = '';
    const parts = [];
    
    if (newParts.name) parts.push('{name}');
    if (newParts.time) parts.push('{time}');
    if (newParts.year) parts.push('{year}');
    if (newParts.month) parts.push('{month}');
    if (newParts.day) parts.push('{day}');
    if (newParts.timestamp) parts.push('{timestamp}');
    
    // 使用连字符连接各部分
    pattern = parts.join('-');
    
    // 如果没有选择任何部分，则默认使用时间戳
    if (!pattern) {
      pattern = '{timestamp}';
      // 保持时间戳选中状态
      newParts.timestamp = true;
      setPatternParts(newParts);
    }
    
    updateSettings('projectNamePattern', pattern);
  };

  // 选择项目保存目录
  const selectProjectSavePath = async () => {
    try {
      const selected = await open({
        directory: true,
        multiple: false,
        defaultPath: settings.projectSavePath
      });
      
      if (selected) {
        updateSettings('projectSavePath', selected);
      }
    } catch (error) {
      console.error('Failed to select directory:', error);
    }
  };

  return (
    <Box sx={{ p: 3, width: '100%' }}>
      <Typography variant="h6" component="h2" gutterBottom>
        设置
      </Typography>
      
      <Grid container spacing={3}>
        {/* 项目保存设置 */}
        <Grid item xs={12} md={6} sx={{ width: '100%' }}>
          <Paper sx={{ p: 3, height: '100%' }} variant="outlined">
            <Typography variant="h6" gutterBottom>
              项目设置
            </Typography>
            
            <TextField
              fullWidth
              label="项目保存目录"
              value={settings.projectSavePath}
              onChange={(e) => updateSettings('projectSavePath', e.target.value)}
              placeholder=".pake-cli"
              InputProps={{
                endAdornment: (
                  <Button 
                    onClick={selectProjectSavePath}
                    variant="contained"
                    size="small"
                  >
                    选择
                  </Button>
                ),
              }}
              helperText="设置项目保存的根目录路径"
              margin="normal"
            />
            
            <Divider sx={{ my: 2 }} />
            
            <Typography variant="subtitle1" gutterBottom>
              项目命名规则
            </Typography>
            
            <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
              选择并组合以下选项来定义项目目录名称格式
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={patternParts.name}
                      onChange={(e) => updatePatternPart('name', e.target.checked)}
                    />
                  }
                  label="项目名称 {name}"
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={patternParts.time}
                      onChange={(e) => updatePatternPart('time', e.target.checked)}
                    />
                  }
                  label="时间 {time}"
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={patternParts.year}
                      onChange={(e) => updatePatternPart('year', e.target.checked)}
                    />
                  }
                  label="年 {year}"
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={patternParts.month}
                      onChange={(e) => updatePatternPart('month', e.target.checked)}
                    />
                  }
                  label="月 {month}"
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={patternParts.day}
                      onChange={(e) => updatePatternPart('day', e.target.checked)}
                    />
                  }
                  label="日 {day}"
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={patternParts.timestamp}
                      onChange={(e) => updatePatternPart('timestamp', e.target.checked)}
                    />
                  }
                  label="时间戳 {timestamp}"
                />
              </Grid>
            </Grid>
            
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                预览:
              </Typography>
              <Chip 
                label={settings.projectNamePattern} 
                variant="outlined" 
                sx={{ fontWeight: 'normal' }}
              />
            </Box>
          </Paper>
        </Grid>
        
        {/* 语言设置 */}
        <Grid item xs={12} md={6} sx={{ width: '100%' }}>
          <Paper sx={{ p: 3, height: '100%' }} variant="outlined">
            <Typography variant="h6" gutterBottom>
              语言设置
            </Typography>
            
            <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
              选择界面显示语言（更改后刷新页面生效）
            </Typography>
            
            <FormControl fullWidth>
              <InputLabel>界面语言</InputLabel>
              <Select
                value={settings.language}
                label="界面语言"
                onChange={(e) => updateSettings('language', e.target.value)}
              >
                <MenuItem value="zh">中文</MenuItem>
                <MenuItem value="en">English</MenuItem>
                <MenuItem value="ja">日本語</MenuItem>
              </Select>
            </FormControl>
            
            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                语言设置说明
              </Typography>
              <Typography variant="body2" color="textSecondary" component="div">
                <ul>
                  <li>中文 (zh) - 简体中文界面</li>
                  <li>English (en) - 英文界面</li>
                  <li>日本語 (ja) - 日文界面</li>
                </ul>
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Settings;