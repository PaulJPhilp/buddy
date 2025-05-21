"use client";
import { HelpCircle, MessageCircle, Settings } from "lucide-react";
import React from "react";

interface AppSidebarProps {
  isOpen: boolean;
  onToggleAction: () => void;
}

export function AppSidebar({ isOpen, onToggleAction }: AppSidebarProps) {
  if (!isOpen) return null;

  return (
    <div className="flex-1 overflow-hidden hover:overflow-y-auto flex flex-col">
      {/* Recent Chats Section */}
      <div className="p-3 border-b">
        <h2 className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
          Recent Chats
        </h2>
        <div className="space-y-1">
          {["General Chat", "Project Ideas", "Technical Support"].map(
            (chat) => (
              <button
                key={chat}
                type="button"
                className="w-full text-left px-2 py-1.5 rounded text-sm hover:bg-gray-200 dark:hover:bg-gray-700"
              >
                <div className="flex items-center gap-2">
                  <MessageCircle className="h-4 w-4" aria-hidden="true" />
                  {chat}
                </div>
              </button>
            ),
          )}
        </div>
      </div>

      {/* Settings & Help Section */}
      <div className="p-3 mt-auto border-t">
        <div className="space-y-1">
          <button
            type="button"
            className="w-full text-left px-2 py-1.5 rounded text-sm hover:bg-gray-200 dark:hover:bg-gray-700"
          >
            <div className="flex items-center gap-2">
              <Settings className="h-4 w-4" aria-hidden="true" />
              Settings
            </div>
          </button>
          <button
            type="button"
            className="w-full text-left px-2 py-1.5 rounded text-sm hover:bg-gray-200 dark:hover:bg-gray-700"
          >
            <div className="flex items-center gap-2">
              <HelpCircle className="h-4 w-4" aria-hidden="true" />
              Help & Support
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
