import React from 'react';
import clsx from 'clsx';

export const Tabs = ({ children, defaultValue, className }) => {
  const [activeTab, setActiveTab] = React.useState(defaultValue);
  
  return (
    <div className={clsx('w-full', className)}>
      {React.Children.map(children, child =>
        React.cloneElement(child, { activeTab, setActiveTab })
      )}
    </div>
  );
};

export const TabsList = ({ children, className, activeTab, setActiveTab }) => (
  <div className={clsx('flex space-x-1 rounded-lg bg-gray-200 p-1', className)}>
    {React.Children.map(children, child =>
      React.cloneElement(child, { activeTab, setActiveTab })
    )}
  </div>
);

export const TabsTrigger = ({ value, children, activeTab, setActiveTab }) => (
  <button
    className={clsx(
      'flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors',
      activeTab === value
        ? 'bg-white text-gray-900 shadow-sm'
        : 'text-gray-600 hover:text-gray-900'
    )}
    onClick={() => setActiveTab(value)}
  >
    {children}
  </button>
);

export const TabsContent = ({ value, children, activeTab }) => (
  <div className={clsx('mt-4', activeTab === value ? 'block' : 'hidden')}>
    {children}
  </div>
);