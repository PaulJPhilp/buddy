"use client";

import type { WorkspaceModel } from "@/domain/workspace";
import React from "react";
import { WorkspaceTree } from "./WorkspaceTree";

interface AppSidebarProps {
  className?: string;
  isOpen: boolean;
}

export function AppSidebar({ className = "", isOpen }: AppSidebarProps) {
  return (
    <div
      className={`
        fixed left-0 top-0 h-full bg-white border-r border-gray-200 z-30
        transition-transform duration-200 w-40
        ${isOpen ? "translate-x-0" : "-translate-x-full"}
        ${className}
      `}
    >
      {/* Sidebar Header */}
      <div className="flex h-6 items-center justify-between border-b bg-white px-1">
        <h2 className="text-xs font-semibold text-gray-900">Workspaces</h2>
      </div>

      {/* Sidebar Content */}
      <div className="flex-1 overflow-y-auto">
        <WorkspaceTree />
      </div>
    </div>
  );
}
