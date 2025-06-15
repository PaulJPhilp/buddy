"use client";

import { ChatAppConfig } from "@/types/global";
import React, { useEffect, useState } from "react";

/**
 * ChatAppSwitcher renders a <select> dropdown that lists all chat apps found
 * in localStorage (key: "buddy:apps"). Selecting a different chat app will
 * write it to `buddy:activeConfig` and reload the page, causing RootLayout to
 * bootstrap the newly-selected chat application.
 */
export function ChatAppSwitcher() {
  console.log(
    "🚀 ChatAppSwitcher: Component mounted/rendered (regular version)",
  );
  const [apps, setApps] = useState<ChatAppConfig[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");

  // This component is now deprecated - apps are managed directly in layout
  useEffect(() => {
    // No longer using localStorage - apps are managed in layout state
    setApps([]);
    setSelectedId("");
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const id = e.target.value;
    setSelectedId(id);
    const cfg = apps.find((a) => a.id === id);
    if (cfg) {
      // Dispatch custom event with full config to add chat app without reload
      window.dispatchEvent(
        new CustomEvent("buddy:addChatApp", { detail: cfg }),
      );
    }
  }

  if (apps.length === 0) {
    return (
      <div className="text-xs text-muted-foreground px-2 py-1 border rounded bg-background">
        add a chat app.
      </div>
    );
  }

  return (
    <select
      value={selectedId}
      onChange={handleChange}
      className="text-sm border rounded px-2 py-1 bg-background"
      aria-label="Select chat application"
    >
      <option value="">Select a chat app...</option>
      {apps.map((app) => (
        <option key={app.id} value={app.id}>
          {app.name}
        </option>
      ))}
    </select>
  );
}
