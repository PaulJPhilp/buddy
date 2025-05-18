import { Menu } from 'lucide-react';
import type { LucideIcon, LucideProps } from 'lucide-react';
import type { FC } from 'react';
import React from 'react';

interface HeaderBarProps {
  title: string;
  onToggleSidebarAction: () => void;
  error?: string | null;
  className?: string;
  style?: React.CSSProperties;
}

export function HeaderBar({
  title,
  onToggleSidebarAction,
  error,
  className = '',
  style,
}: HeaderBarProps) {
  // Determine background color based on error state
  const bgColorClass = error ? 'bg-red-50 border-b border-red-200' : 'bg-gray-100 dark:bg-gray-800';
  
  return (
    <div
      className={`flex items-center justify-between p-2 ${bgColorClass} ${className}`}
      style={style}
    >
      <div className="flex items-center">
        {/* biome-ignore lint/a11y/useButtonType: <explanation> */}
        <button 
          onClick={onToggleSidebarAction}
          className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 mr-2"
        >
          {React.createElement(Menu as FC<LucideProps>, { size: 18, 'aria-hidden': true })}
        </button>
        <span className="font-semibold text-gray-800 dark:text-gray-200">
          {title}
        </span>
      </div>
      
      {error && (
        <div className="text-sm text-red-600 px-2 py-1 bg-red-50 rounded">
          {error}
        </div>
      )}
    </div>
  );
}
