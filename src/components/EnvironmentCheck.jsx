import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, Download, RefreshCw } from 'lucide-react';
import { invoke } from '@tauri-apps/api/core';

const EnvironmentCheck = () => {
  const [environment, setEnvironment] = useState({
    nodejs: { status: 'checking', version: null, path: null },
    bunjs: { status: 'checking', version: null, path: null },
    rust: { status: 'checking', version: null, path: null },
    visualStudio: { status: 'checking', version: null, path: null },
    pake: { status: 'checking', version: null, path: null }
  });
  
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    checkEnvironment();
  }, []);

  const checkEnvironment = async () => {
    setIsChecking(true);
    try {
      const result = await invoke('check_environment');
      setEnvironment(result);
    } catch (error) {
      console.error('Environment check failed:', error);
    } finally {
      setIsChecking(false);
    }
  };

  const installTool = async (tool) => {
    try {
      await invoke('install_tool', { tool });
      checkEnvironment();
    } catch (error) {
      console.error(`Failed to install ${tool}:`, error);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'ok':
        return <CheckCircle className="text-green-500" size={20} />;
      case 'error':
        return <XCircle className="text-red-500" size={20} />;
      case 'warning':
        return <AlertCircle className="text-yellow-500" size={20} />;
      default:
        return <RefreshCw className="text-gray-400 animate-spin" size={20} />;
    }
  };

  const getStatusText = (tool, info) => {
    if (info.status === 'checking') return 'Checking...';
    if (info.status === 'ok') return `${tool} ${info.version} (Found)`;
    if (info.status === 'warning') return `${tool} found but outdated (${info.version})`;
    return `${tool} not found`;
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Environment Check</h2>
        <button
          onClick={checkEnvironment}
          disabled={isChecking}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          <RefreshCw size={16} className={isChecking ? 'animate-spin' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      <div className="space-y-4">
        {Object.entries(environment).map(([tool, info]) => (
          <div key={tool} className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center space-x-3">
              {getStatusIcon(info.status)}
              <div>
                <h3 className="font-medium capitalize">{tool === 'bunjs' ? 'Bun.js' : tool === 'nodejs' ? 'Node.js' : tool === 'visualStudio' ? 'Visual Studio Build Tools' : tool}</h3>
                <p className="text-sm text-gray-500">{getStatusText(tool, info)}</p>
                {info.path && (
                  <p className="text-xs text-gray-400">Path: {info.path}</p>
                )}
              </div>
            </div>
            
            {info.status === 'error' && (
              <button
                onClick={() => installTool(tool)}
                className="flex items-center space-x-2 bg-green-600 text-white px-3 py-1 rounded-md hover:bg-green-700 text-sm"
              >
                <Download size={14} />
                <span>Install</span>
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-medium text-blue-900 mb-2">Installation Guide</h3>
        <div className="text-sm text-blue-800 space-y-1">
          <p>• <strong>Bun.js (Recommended):</strong> curl -fsSL https://bun.sh/install | bash</p>
          <p>• <strong>Node.js:</strong> Download from nodejs.org</p>
          <p>• <strong>Rust:</strong> curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh</p>
          <p>• <strong>Pake CLI:</strong> bun install -g pake-cli</p>
          <p>• <strong>VS Build Tools:</strong> Download from Microsoft website</p>
        </div>
      </div>
    </div>
  );
};

export default EnvironmentCheck;