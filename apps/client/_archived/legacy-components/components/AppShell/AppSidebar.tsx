"use client";

import { WorkspaceTree } from "@/components/WorkspaceTree/WorkspaceTree";
import { cn } from "@ui/lib/utils";
import React from "react";

interface AppSidebarProps {
  className?: string;
  isOpen: boolean;
}

export function AppSidebar({ className, isOpen }: AppSidebarProps) {

  return (
    <div
      className={cn(
        "fixed left-0 top-0 h-full bg-background border-r z-40 transition-transform duration-200",
        "w-80", // Wider to accommodate the workspace tree
        isOpen ? "translate-x-0" : "-translate-x-full",
        className,
      )}
    >
      <WorkspaceTree />
    </div>
  );
}
