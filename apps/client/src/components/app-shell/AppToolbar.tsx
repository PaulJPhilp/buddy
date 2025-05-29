"use client";

import { Menu } from "lucide-react";
import React from "react";

interface AppToolbarProps {
  onToggleSidebarAction: () => void;
}

export function AppToolbar({ onToggleSidebarAction }: AppToolbarProps) {
  return (
    <header className="flex items-center h-6 px-4 border-b bg-background/80">
      <button
        type="button"
        onClick={onToggleSidebarAction}
        className="p-2 rounded-md hover:bg-accent hover:text-accent-foreground"
        aria-label="Toggle sidebar"
      >
        <Menu className="h-5 w-5" aria-hidden="true" />
      </button>
      <div className="flex-1 flex items-center justify-between ml-4">
        {/* Add additional toolbar content here */}
        {/* <span className="font-semibold text-lg">Buddy</span> */}
      </div>
    </header>
  );
} 