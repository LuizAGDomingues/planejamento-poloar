import React from 'react';

type Tab = {
  id: string;
  label: string;
};

type TabSelectorProps = {
  tabs: Tab[];
  activeTab: string;
  onChange: (tabId: string) => void;
};

export default function TabSelector({ tabs, activeTab, onChange }: TabSelectorProps) {
  return (
    <div className="mb-6 border-b border-gray-200">
      <nav className="-mb-px flex space-x-8">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`
              py-4 px-1 border-b-2 font-medium text-sm
              ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }
            `}
          >
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  );
} 