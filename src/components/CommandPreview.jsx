import React, { useState } from 'react';
import { Copy, Terminal, Edit, Check, X } from 'lucide-react';

const CommandPreview = ({ config }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedCommand, setEditedCommand] = useState('');

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
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Command Preview</h2>
        <div className="flex space-x-2">
          {isEditing ? (
            <>
              <button
                onClick={saveEditing}
                className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
              >
                <Check size={16} />
                <span>Save</span>
              </button>
              <button
                onClick={cancelEditing}
                className="flex items-center space-x-2 bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
              >
                <X size={16} />
                <span>Cancel</span>
              </button>
            </>
          ) : (
            <>
              <button
                onClick={startEditing}
                className="flex items-center space-x-2 bg-yellow-600 text-white px-4 py-2 rounded-md hover:bg-yellow-700"
              >
                <Edit size={16} />
                <span>Edit</span>
              </button>
              <button
                onClick={copyToClipboard}
                className="flex items-center space-x-2 bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
              >
                <Copy size={16} />
                <span>Copy</span>
              </button>
            </>
          )}
        </div>
      </div>

      <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm overflow-x-auto">
        <div className="flex items-center space-x-2 mb-2">
          <Terminal size={16} />
          <span className="text-gray-400">Terminal</span>
        </div>
        {isEditing ? (
          <textarea
            value={editedCommand}
            onChange={(e) => setEditedCommand(e.target.value)}
            className="w-full bg-gray-900 text-green-400 font-mono text-sm resize-none focus:outline-none"
            rows={4}
          />
        ) : (
          <pre 
            className="whitespace-pre-wrap break-all cursor-pointer hover:bg-gray-800 p-1 rounded"
            onClick={startEditing}
          >
            {command}
          </pre>
        )}
      </div>

      <div className="mt-6">
        <h3 className="font-medium text-gray-900 mb-3">Configuration Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="space-y-2">
            <div><strong>URL:</strong> {config.url || 'Not specified'}</div>
            <div><strong>App Name:</strong> {config.name || 'Not specified'}</div>
            <div><strong>Window Size:</strong> {config.width} x {config.height}</div>
            <div><strong>Debug Mode:</strong> {config.debug ? 'Enabled' : 'Disabled'}</div>
          </div>
          <div className="space-y-2">
            <div><strong>Fullscreen:</strong> {config.fullscreen ? 'Yes' : 'No'}</div>
            <div><strong>Always On Top:</strong> {config.alwaysOnTop ? 'Yes' : 'No'}</div>
            <div><strong>System Tray:</strong> {config.showSystemTray ? 'Yes' : 'No'}</div>
            <div><strong>Injected Files:</strong> {config.inject?.length || 0}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommandPreview;