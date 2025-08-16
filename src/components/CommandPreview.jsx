import React, { useState, useEffect, useRef } from 'react';
import { Copy, Terminal, Edit, Check, X } from 'lucide-react';
import { Box, Typography, Paper, Button, Grid, Divider } from '@mui/material';
import { ContentCopy as CopyIcon } from '@mui/icons-material';
import { listen } from '@tauri-apps/api/event';

const CommandPreview = ({ config }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedCommand, setEditedCommand] = useState('');
  const buildOutputRef = useRef(null);
  const [buildOutput, setBuildOutput] = useState('');

  // 监听构建输出事件
  useEffect(() => {
    const unlisten = listen('build-output', (event) => {
      const newOutput = event.payload;
      setBuildOutput(prev => prev + '\n' + newOutput);
    });

    return () => {
      unlisten.then(unlistenFn => unlistenFn());
    };
  }, []);

  // 滚动到最新的日志
  useEffect(() => {
    if (buildOutputRef.current) {
      buildOutputRef.current.scrollTop = buildOutputRef.current.scrollHeight;
    }
  }, [buildOutput]);

  const generateCommand = () => {
    const parts = ['pake'];
    
    if (!config.url) return 'pake <URL>';
    
    parts.push(config.url);
    
    if (config.name) parts.push(`--name "${config.name}"`);
    if (config.icon) parts.push(`--icon "${config.icon}"`);
    if (config.width !== 1200) parts.push(`--width ${config.width}`);
    if (config.height !== 780) parts.push(`--height ${config.height}`);
    if (config.useLocalFile) parts.push('--use-local-file');
    if (config.fullscreen) parts.push('--fullscreen');
    if (config.hideTitleBar) parts.push('--hide-title-bar');
    if (config.multiArch) parts.push('--multi-arch');
    if (config.debug) parts.push('--debug');
    if (config.activationShortcut) parts.push(`--activation-shortcut "${config.activationShortcut}"`);
    if (config.alwaysOnTop) parts.push('--always-on-top');
    if (config.targets !== 'all') parts.push(`--targets ${config.targets}`);
    if (config.userAgent) parts.push(`--user-agent "${config.userAgent}"`);
    if (config.showSystemTray) parts.push('--show-system-tray');
    if (config.systemTrayIcon) parts.push(`--system-tray-icon "${config.systemTrayIcon}"`);
    
    config.inject?.forEach(file => {
      parts.push(`--inject "${file}"`);
    });
    
    config.safeDomain?.forEach(domain => {
      parts.push(`--safe-domain "${domain}"`);
    });
    
    return parts.join(' ');
  };

  const copyToClipboard = async () => {
    try {
      const commandToCopy = isEditing ? editedCommand : generateCommand();
      await navigator.clipboard.writeText(commandToCopy);
    } catch (error) {
      console.error('Failed to copy command:', error);
    }
  };

  const startEditing = () => {
    setEditedCommand(generateCommand());
    setIsEditing(true);
  };

  const saveEditing = () => {
    setIsEditing(false);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setEditedCommand('');
  };

  const command = isEditing ? editedCommand : generateCommand();

  return (
    <Box sx={{ p: 3, width: '100%' }}>
      <Grid container spacing={3}>
        <Grid item xs={12} sx={{ width: '100%' }}>
          <Typography variant="h6" component="h2" gutterBottom>
            Command Preview
          </Typography>
          <Paper 
            variant="outlined" 
            sx={{ 
              p: 2, 
              bgcolor: 'grey.50',
              position: 'relative',
              width: '100%'
            }}
          >
            <Box sx={{ display: 'inline', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <div className="inline items-center space-x-2 mb-2">
                <Terminal size={16} />
                <span className="text-gray-400">Terminal</span>
              </div>
              <Button
                startIcon={<CopyIcon />}
                onClick={copyToClipboard}
                size="small"
                variant="outlined"
                sx={{ 
                  borderRadius: '20px',
                  textTransform: 'none',
                  position: 'absolute',
                  right: '20px',
                  top: '5px',
                }}
              >
                Copy
              </Button>
            </Box>
            <div className="bg-gray-900 text-green-400 rounded-lg font-mono text-sm overflow-x-auto w-full">
              {isEditing ? (
                <textarea
                  value={editedCommand}
                  onChange={(e) => setEditedCommand(e.target.value)}
                  className="w-full bg-gray-900 text-green-400 font-mono text-sm resize-none focus:outline-none"
                  rows={4}
                />
              ) : (
                <pre 
                  className="whitespace-pre-wrap break-all cursor-pointer hover:bg-gray-800 p-4 rounded w-full"
                  onClick={startEditing}
                >
                  {command}
                </pre>
              )}
            </div>
          </Paper>
        </Grid>

        {buildOutput && (
          <Grid item xs={12}>
            <Typography variant="h6" component="h2" gutterBottom>
              Build Status
            </Typography>
            <Paper 
              variant="outlined" 
              sx={{ 
                p: 2,
                width: '100%'
              }}
            >
              <Box
                ref={buildOutputRef}
                sx={{
                  maxHeight: 400,
                  minHeight: 200,
                  overflow: 'auto',
                  whiteSpace: 'pre-wrap',
                  fontFamily: 'monospace',
                  fontSize: '0.875rem',
                  lineHeight: 1.2,
                  p: 2,
                  bgcolor: 'grey.900',
                  color: 'grey.100',
                  borderRadius: '4px',
                  width: '100%'
                }}
              >
                {buildOutput || 'Waiting for build...\nBuild output will be displayed here'}
              </Box>
            </Paper>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default CommandPreview;