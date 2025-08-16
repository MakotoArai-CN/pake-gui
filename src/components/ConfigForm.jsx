import React, { useEffect, useRef } from 'react';
import { Save, Play, Plus, X } from 'lucide-react';
import { open } from '@tauri-apps/plugin-dialog';

const ConfigForm = ({ config, onChange, onSave, onBuild, buildStatus, buildOutput }) => {
  const updateConfig = (key, value) => {
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
      updateConfig(key, [...config[key], value.trim()]);
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

  const ArrayInput = ({ label, configKey, placeholder }) => {
    const [inputValue, setInputValue] = React.useState('');

    return (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
        <div className="space-y-2">
          {config[configKey].map((item, index) => (
            <div key={index} className="flex items-center space-x-2">
              <input
                type="text"
                value={item}
                readOnly
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
              />
              <button
                onClick={() => removeFromArray(configKey, index)}
                className="p-2 text-red-600 hover:bg-red-100 rounded-md"
              >
                <X size={16} />
              </button>
            </div>
          ))}
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={placeholder}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  addToArray(configKey, inputValue);
                  setInputValue('');
                }
              }}
            />
            <button
              onClick={() => {
                addToArray(configKey, inputValue);
                setInputValue('');
              }}
              className="p-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              <Plus size={16} />
            </button>
            <button
              onClick={() => selectFileForArray(configKey, { multiple: false })}
              className="p-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
            >
              <span className="text-xs">Browse</span>
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Configuration</h2>
        <div className="flex space-x-2">
          <button
            onClick={() => {
              if (!config.url.trim()) {
                alert('URL is required.');
                return;
              }
              if (!config.name.trim()) {
                alert('Application Name is required.');
                return;
              }
              onSave();
            }}
            className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
          >
            <Save size={16} />
            <span>Save</span>
          </button>
          <button
            onClick={onBuild}
            disabled={buildStatus === 'building'}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md ${
              buildStatus === 'building' 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            <Play size={16} />
            <span>{buildStatus === 'building' ? 'Building...' : 'Build'}</span>
          </button>
        </div>
      </div>

      {buildStatus && (
        <div className="mb-6 p-4 rounded-lg bg-gray-100">
          <h3 className="font-medium text-gray-900 mb-2">Build Status</h3>
          <div 
            ref={buildOutputRef}
            className={`p-3 rounded font-mono text-sm max-h-60 overflow-y-auto ${
              buildStatus === 'error' ? 'bg-red-100 text-red-800' : 
              buildStatus === 'success' ? 'bg-green-100 text-green-800' : 
              'bg-blue-100 text-blue-800'
            }`}
          >
            {buildOutput || `Build status: ${buildStatus}`}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Basic Settings */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Basic Settings</h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">URL *</label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={config.url}
                onChange={(e) => updateConfig('url', e.target.value)}
                placeholder="https://example.com or file:///path/to/file.html"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
              />
              <button
                onClick={() => selectFile('url', { 
                  filters: [{
                    name: 'Web Files',
                    extensions: ['html', 'htm', 'txt']
                  }]
                })}
                className="px-3 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
              >
                Browse
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Application Name</label>
            <input
              type="text"
              value={config.name}
              onChange={(e) => updateConfig('name', e.target.value)}
              placeholder="MyApp"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Icon Path</label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={config.icon}
                onChange={(e) => updateConfig('icon', e.target.value)}
                placeholder="/path/to/icon.png"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
              />
              <button
                onClick={() => selectFile('icon', {
                  filters: [{
                    name: 'Image Files',
                    extensions: ['png', 'ico', 'jpg', 'jpeg']
                  }]
                })}
                className="px-3 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
              >
                Browse
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Width</label>
              <input
                type="number"
                value={config.width}
                onChange={(e) => updateConfig('width', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Height</label>
              <input
                type="number"
                value={config.height}
                onChange={(e) => updateConfig('height', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>
        </div>

        {/* Advanced Settings */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Advanced Settings</h3>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">User Agent</label>
            <input
              type="text"
              value={config.userAgent}
              onChange={(e) => updateConfig('userAgent', e.target.value)}
              placeholder="Custom user agent string"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Activation Shortcut</label>
            <input
              type="text"
              value={config.activationShortcut}
              onChange={(e) => updateConfig('activationShortcut', e.target.value)}
              placeholder="CmdOrControl+Shift+P"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">System Tray Icon</label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={config.systemTrayIcon}
                onChange={(e) => updateConfig('systemTrayIcon', e.target.value)}
                placeholder="/path/to/tray-icon.png"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
              />
              <button
                onClick={() => selectFile('systemTrayIcon', {
                  filters: [{
                    name: 'Image Files',
                    extensions: ['png', 'ico', 'jpg', 'jpeg']
                  }]
                })}
                className="px-3 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
              >
                Browse
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Targets (Linux)</label>
            <select
              value={config.targets}
              onChange={(e) => updateConfig('targets', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="all">All (deb + appimage)</option>
              <option value="deb">DEB</option>
              <option value="appimage">AppImage</option>
            </select>
          </div>

          <ArrayInput
            label="Inject Files"
            configKey="inject"
            placeholder="path/to/script.js or path/to/style.css"
          />

          <ArrayInput
            label="Safe Domains"
            configKey="safeDomain"
            placeholder="example.com"
          />
        </div>

        {/* Boolean Options */}
        <div className="md:col-span-2 space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Options</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { key: 'useLocalFile', label: 'Use Local File' },
              { key: 'fullscreen', label: 'Start Fullscreen' },
              { key: 'hideTitleBar', label: 'Hide Title Bar (Mac)' },
              { key: 'multiArch', label: 'Multi-Arch (Mac)' },
              { key: 'debug', label: 'Debug Mode' },
              { key: 'alwaysOnTop', label: 'Always On Top' },
              { key: 'showSystemTray', label: 'Show System Tray' }
            ].map(({ key, label }) => (
              <label key={key} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={config[key]}
                  onChange={(e) => updateConfig(key, e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm text-gray-700">{label}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfigForm;