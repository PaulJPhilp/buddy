"use client";

import React, { ReactNode } from "react";

interface AppShellIntegrationProps {
  children: ReactNode;
  configPath?: string;
  autoLoadConfig?: boolean;
  autoRenderShell?: boolean;
  debugMode?: boolean;
}

export function AppShellIntegration({
  children,
  debugMode = false,
}: AppShellIntegrationProps) {
  // Modern shell - clean container for Effect services
  return (
    <div className="h-screen w-full flex flex-col bg-background">
      {debugMode && (
        <div className="bg-muted p-2 text-xs font-mono border-b">
          <div>Effect Architecture - Clean Services</div>
        </div>
      )}

      <main className="flex-1 overflow-hidden">{children}</main>
    </div>
  );
}
