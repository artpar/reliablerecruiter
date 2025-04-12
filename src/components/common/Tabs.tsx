import React, { useState, useEffect } from 'react';

export type TabItem = {
  id: string;
  label: string | React.ReactNode;
  content: React.ReactNode;
  disabled?: boolean;
};

interface TabsProps {
  tabs: TabItem[];
  defaultTabId?: string;
  activeTabId?: string;
  onChange?: (tabId: string) => void;
  variant?: 'default' | 'pills' | 'underline';
  className?: string;
}

const Tabs: React.FC<TabsProps> = ({
  tabs,
  defaultTabId,
  activeTabId,
  onChange,
  variant = 'default',
  className = '',
}) => {
  const [internalActiveTabId, setInternalActiveTabId] = useState(defaultTabId || (tabs.length > 0 ? tabs[0].id : ''));

  // Update internal state when activeTabId prop changes
  useEffect(() => {
    if (activeTabId !== undefined) {
      setInternalActiveTabId(activeTabId);
    }
  }, [activeTabId]);

  const handleTabClick = (tabId: string) => {
    setInternalActiveTabId(tabId);
    if (onChange) {
      onChange(tabId);
    }
  };

  // Use activeTabId from props if provided, otherwise use internal state
  const currentActiveTabId = activeTabId !== undefined ? activeTabId : internalActiveTabId;

  const getTabListStyles = () => {
    switch (variant) {
      case 'pills':
        return 'flex space-x-2 p-1 bg-neutral-100 rounded-lg';
      case 'underline':
        return 'flex border-b border-neutral-200';
      default:
        return 'flex space-x-4 border-b border-neutral-200';
    }
  };

  const getTabStyles = (tab: TabItem) => {
    const isActive = currentActiveTabId === tab.id;
    const disabled = tab.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer';

    switch (variant) {
      case 'pills':
        return `${
          isActive
            ? 'bg-white text-primary-700 shadow-sm'
            : 'text-neutral-600 hover:text-neutral-800 hover:bg-neutral-200'
        } px-3 py-2 text-sm font-medium rounded-md ${disabled}`;
      case 'underline':
        return `${
          isActive
            ? 'text-primary-700 border-b-2 border-primary-500'
            : 'text-neutral-600 hover:text-neutral-800 hover:border-neutral-300 border-b-2 border-transparent'
        } px-4 py-2 text-sm font-medium ${disabled}`;
      default:
        return `${
          isActive
            ? 'text-primary-700 border-b-2 border-primary-500'
            : 'text-neutral-600 hover:text-neutral-800 hover:border-neutral-300 border-b-2 border-transparent'
        } px-1 py-3 text-sm font-medium ${disabled}`;
    }
  };

  return (
    <div className={className}>
      <div className={getTabListStyles()} role="tablist">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={currentActiveTabId === tab.id}
            aria-controls={`tab-panel-${tab.id}`}
            id={`tab-${tab.id}`}
            className={getTabStyles(tab)}
            onClick={() => !tab.disabled && handleTabClick(tab.id)}
            disabled={tab.disabled}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="mt-4">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            role="tabpanel"
            aria-labelledby={`tab-${tab.id}`}
            id={`tab-panel-${tab.id}`}
            className={currentActiveTabId === tab.id ? 'block' : 'hidden'}
          >
            {tab.content}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Tabs;
