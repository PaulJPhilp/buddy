"use client";

import { makeUIBarService } from "../services/UIBarService";

function StatusUIBar() {
  return (
    <div className="flex items-center justify-between text-sm text-muted-foreground">
      <div className="flex items-center gap-2">
        <div className="h-2 w-2 rounded-full bg-green-500" />
        <span>Connected</span>
      </div>
      <div>Last updated: {new Date().toLocaleTimeString()}</div>
    </div>
  );
}

// Create a service instance
export const StatusUIBarService = makeUIBarService(() => <StatusUIBar />);
