import { appLayoutStore } from "@/stores/appLayoutStore";
import { UserButton } from "@clerk/nextjs";

import { Menu } from "lucide-react";

import React from "react";

import { ToolbarConfig } from "./types";

// Main toolbar configuration for AppShell
export const mainToolbarConfig: ToolbarConfig = {
  id: "main-toolbar",
  position: "top",
  variant: "default",
  items: [
    // Sidebar toggle command
    {
      id: "toggle-sidebar",
      label: "Toggle Sidebar",
      icon: <Menu className="h-4 w-4" />,
      action: () => {
        console.log("Toggle sidebar clicked");
        appLayoutStore.send({ type: "toggleSidebar" });
      },
      tooltip: "Open/close sidebar",
      active: false, // Will be updated by store subscription
    },

    // Expandable spacer to push remaining items to the right
    {
      id: "spacer-expand",
      type: "spacer-expand" as const,
    },

    // Clerk User Button - provides user settings, profile, sign out
    {
      id: "user-settings",
      type: "custom" as const,
      element: <UserButton afterSignOutUrl="/" />,
    },
  ],
};

// Compact toolbar for mobile/small screens
export const compactToolbarConfig: ToolbarConfig = {
  id: "compact-toolbar",
  position: "top",
  variant: "compact",
  items: [
    {
      id: "toggle-sidebar",
      label: "Menu",
      icon: <Menu className="h-4 w-4" />,
      action: () => appLayoutStore.send({ type: "toggleSidebar" }),
      tooltip: "Toggle menu",
    },

    {
      id: "spacer-expand",
      type: "spacer-expand" as const,
    },

    // Clerk User Button - provides user settings, profile, sign out
    {
      id: "user-settings",
      type: "custom" as const,
      element: <UserButton afterSignOutUrl="/" />,
    },
  ],
};

// Helper function to get toolbar config based on screen size
export function getToolbarConfig(isMobile: boolean): ToolbarConfig {
  return isMobile ? compactToolbarConfig : mainToolbarConfig;
}
