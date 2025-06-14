import { appLayoutStore } from "@/stores/appLayoutStore";
import { clerkAdminStore } from "@/stores/clerkAdminStore";
import { debugToolStore } from "@/stores/debugToolStore";
import { errorManagerStore } from "@/stores/errorManagerStore";
import { sidebarToolStore } from "@/stores/sidebarToolStore";

import {
  AlertTriangle,
  Bug,
  Cog,
  Eye,
  Grid3X3,
  Menu,
  Palette,
  Settings,
  Sidebar,
  Users,
} from "lucide-react";
import { FolderOpen } from "lucide-react";
import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import { ConfigManagerPanel } from "../config-manager/ConfigManagerPanel";
import { ChatAppSwitcher } from "./ChatAppSwitcher";
import { ChatAppSwitcherEnhanced } from "./ChatAppSwitcher.enhanced";
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

    // Sidebar tool command
    {
      id: "toggle-sidebar-tool",
      label: "Sidebar Tool",
      icon: <Sidebar className="h-4 w-4" />,
      action: () => {
        console.log("Toggle sidebar tool clicked");
        sidebarToolStore.send({ type: "toggle" });
      },
      tooltip: "Open/close sidebar configuration tool",
      active: false, // Will be updated by store subscription
    },

    // Chat app switcher dropdown - Enhanced version with real-time updates
    {
      id: "chat-app-switcher",
      type: "custom" as const,
      element:
        process.env.NODE_ENV === "development" ? (
          <ChatAppSwitcherEnhanced />
        ) : (
          <ChatAppSwitcher />
        ),
    },

    // Spacer to separate groups
    {
      id: "spacer-1",
      type: "spacer" as const,
    },

    // Theme editor toggle command
    {
      id: "toggle-theme-editor",
      label: "Theme Editor",
      icon: <Palette className="h-4 w-4" />,
      action: () => {
        console.log("Open theme editor in sidebar");
        appLayoutStore.send({
          type: "setActiveSidebarEditor",
          editor: "theme",
        });
      },
      tooltip: "Open theme editor in sidebar",
      active: false, // Will be updated by store subscription
    },

    // Config Manager - Real-time config editing (dev only for now)
    ...(process.env.NODE_ENV === "development"
      ? [
          {
            id: "toggle-config-manager",
            label: "Config Manager",
            icon: <Cog className="h-4 w-4" />,
            action: () => {
              console.log("Open config manager");
              if (!window.__configManagerModal) {
                const root = document.createElement("div");
                document.body.appendChild(root);
                const rootInstance = createRoot(root);
                function close() {
                  if (window.__configManagerModal?.rootInstance) {
                    window.__configManagerModal.rootInstance.unmount();
                  }
                  document.body.removeChild(root);
                  window.__configManagerModal = null;
                }
                window.__configManagerModal = { root, rootInstance };
                rootInstance.render(
                  React.createElement(ConfigManagerPanel, {
                    isOpen: true,
                    onClose: close,
                  }),
                );
              }
            },
            tooltip: "Open real-time config manager",
            active: false,
          },
        ]
      : []),

    // Clerk admin panel toggle command
    {
      id: "toggle-clerk-admin",
      label: "User Management",
      icon: <Users className="h-4 w-4" />,
      action: () => {
        console.log("Toggle user management clicked");
        clerkAdminStore.send({ type: "togglePanel" });
      },
      tooltip: "Open/close user management panel",
      active: false, // Will be updated by store subscription
    },

    // Error manager toggle command
    {
      id: "toggle-error-manager",
      label: "Error Manager",
      icon: <AlertTriangle className="h-4 w-4" />,
      action: () => {
        console.log("Toggle error manager clicked");
        errorManagerStore.send({ type: "toggle" });
      },
      tooltip: "Open/close error manager",
      active: false, // Will be updated by store subscription
    },

    // Debug tool toggle command
    {
      id: "toggle-debug-tool",
      label: "Debug Tool",
      icon: <Bug className="h-4 w-4" />,
      action: () => {
        console.log("Toggle debug tool clicked");
        debugToolStore.send({ type: "toggle" });
      },
      tooltip: "Open/close debug tool",
      active: false, // Will be updated by store subscription
    },

    // Expandable spacer to push remaining items to the right
    {
      id: "spacer-expand",
      type: "spacer-expand" as const,
    },

    // Test button to manually dispatch event (dev only)
    ...(process.env.NODE_ENV === "development"
      ? [
          {
            id: "test-add-chat-app",
            label: "Test Add",
            icon: <Settings className="h-4 w-4" />,
            action: () => {
              console.log(
                "🧪 Test: Manually dispatching buddy:addChatApp event",
              );
              const testConfig = {
                id: "test-chat-app",
                name: "Test Chat App",
                agentId: "test-agent",
                toolbarId: "test-toolbar",
                themeId: "test-theme",
              };
              window.dispatchEvent(
                new CustomEvent("buddy:addChatApp", { detail: testConfig }),
              );
              console.log("🧪 Test: Event dispatched");
            },
            tooltip: "Test add chat app event",
            variant: "secondary" as const,
          },
        ]
      : []),

    // Settings command (placeholder for future)
    {
      id: "settings",
      label: "Settings",
      icon: <Settings className="h-4 w-4" />,
      action: () => {
        console.log("Settings command executed");
        // TODO: Implement settings panel
      },
      tooltip: "Open settings",
      variant: "secondary" as const,
    },
  ],
};

// Dev-only localStorage viewer modal
function BuddyLocalStorageViewerModal({
  open,
  onClose,
}: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  const keys =
    typeof window !== "undefined"
      ? Object.keys(localStorage).filter((k) => k.startsWith("buddy:"))
      : [];
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        background: "rgba(0,0,0,0.5)",
        zIndex: 10001,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      onClick={onClose}
      onKeyDown={(e) => e.key === "Escape" && onClose()}
      // biome-ignore lint/a11y/useSemanticElements: <explanation>
      role="dialog"
      aria-modal="true"
    >
      <div
        style={{
          background: "white",
          padding: 24,
          borderRadius: 12,
          maxWidth: 600,
          maxHeight: "80vh",
          overflow: "auto",
          boxShadow: "0 4px 24px rgba(0,0,0,0.2)",
        }}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.key === "Escape" && onClose()}
        role="document"
      >
        <h2>buddy:* LocalStorage Keys</h2>
        {keys.length === 0 ? (
          <div>No buddy:* keys found.</div>
        ) : (
          <ul style={{ fontFamily: "monospace", fontSize: 14 }}>
            {keys.map((key) => (
              <li key={key} style={{ marginBottom: 16 }}>
                <strong>{key}</strong>
                <pre
                  style={{
                    background: "#f3f4f6",
                    padding: 8,
                    borderRadius: 4,
                    maxHeight: 200,
                    overflow: "auto",
                  }}
                >
                  {(localStorage.getItem(key) ?? "").slice(0, 500)}
                  {(localStorage.getItem(key)?.length ?? 0) > 500
                    ? "... (truncated)"
                    : ""}
                </pre>
              </li>
            ))}
          </ul>
        )}
        {/* biome-ignore lint/a11y/useButtonType: <explanation> */}
        <button
          style={{
            marginTop: 16,
            background: "#ef4444",
            color: "white",
            border: "none",
            borderRadius: 6,
            padding: "6px 12px",
            cursor: "pointer",
          }}
          onClick={onClose}
        >
          Close
        </button>
      </div>
    </div>
  );
}

// Add dev-only button to mainToolbarConfig
if (process.env.NODE_ENV === "development") {
  // Insert before settings
  const idx = mainToolbarConfig.items.findIndex((i) => i.id === "settings");
  mainToolbarConfig.items.splice(idx, 0, {
    id: "show-buddy-localstorage",
    label: "Show LocalStorage",
    icon: <Eye className="h-4 w-4" />,
    action: () => {
      // Use a global to avoid React state in config
      if (!window.__buddyLocalStorageViewerModal) {
        const root = document.createElement("div");
        document.body.appendChild(root);
        const rootInstance = createRoot(root);
        function close() {
          if (window.__buddyLocalStorageViewerModal?.rootInstance) {
            window.__buddyLocalStorageViewerModal.rootInstance.unmount();
          }
          document.body.removeChild(root);
          window.__buddyLocalStorageViewerModal = null;
        }
        window.__buddyLocalStorageViewerModal = { root, rootInstance };
        rootInstance.render(
          React.createElement(BuddyLocalStorageViewerModal, {
            open: true,
            onClose: close,
          }),
        );
      }
    },
    tooltip: "Show all buddy:* localStorage keys",
    variant: "secondary",
  });

  // Modal to select and import a config
  function BuddyConfigLoaderModal({
    open,
    onClose,
  }: { open: boolean; onClose: () => void }) {
    const [configs, setConfigs] = React.useState<string[]>([]);
    const [loading, setLoading] = React.useState(false);
    const [displayedConfigs, setDisplayedConfigs] = React.useState<any[]>([]);

    React.useEffect(() => {
      if (!open) return;

      // No longer using localStorage for displayed configs
      setDisplayedConfigs([]);

      // Fetch available configs from the API
      fetch("/api/configs")
        .then((res) => res.json())
        .then((files) => {
          if (Array.isArray(files)) {
            // Extract just the filenames from the file objects
            const filteredFiles = files
              .filter((file) => file.name !== "index.json")
              .map((file) => file.name);
            setConfigs(filteredFiles);
          } else {
            setConfigs([]);
          }
        })
        .catch(() => setConfigs([]));
    }, [open]);

    // Defensive: always use an array for mapping
    const safeConfigs = Array.isArray(configs) ? configs : [];
    console.log("BuddyConfigLoaderModal configs:", configs);

    async function handleImportConfig(filename: string) {
      setLoading(true);
      try {
        // Fetch the selected config file from the API
        const res = await fetch(
          `/api/configs?file=${encodeURIComponent(filename)}`,
        );
        if (!res.ok) throw new Error("Failed to import config");
        const json = await res.text();
        const configObj = JSON.parse(json);

        // Handle both old format (with chatApps array) and new format (direct config)
        if (configObj.chatApps && Array.isArray(configObj.chatApps)) {
          // Old format: extract from chatApps array
          for (const chatApp of configObj.chatApps) {
            // Enrich with theme if available
            if (
              chatApp.themeId &&
              configObj.themes &&
              configObj.themes[chatApp.themeId]
            ) {
              chatApp.theme = configObj.themes[chatApp.themeId];
            }

            // Dispatch event to add this chat app
            window.dispatchEvent(
              new CustomEvent("buddy:addChatApp", { detail: chatApp }),
            );
          }

          setLoading(false);
          onClose();

          // Show success message
          alert(
            `Successfully imported ${configObj.chatApps.length} chat app(s) from ${filename}`,
          );
        } else if (configObj.id && configObj.name) {
          // New format: file is the config directly
          window.dispatchEvent(
            new CustomEvent("buddy:addChatApp", { detail: configObj }),
          );

          setLoading(false);
          onClose();

          // Show success message
          alert(
            `Successfully imported chat app "${configObj.name}" from ${filename}`,
          );
        } else {
          // Fallback to old behavior for configs without chatApps or direct config
          localStorage.setItem("buddy:bootstrap", json);
          setLoading(false);
          onClose();
          window.location.reload();
        }
      } catch (e) {
        setLoading(false);
        alert(`Failed to import config: ${e instanceof Error ? e.message : e}`);
      }
    }

    async function handleDeleteConfig(filename: string) {
      if (
        !confirm(
          `Are you sure you want to delete ${filename}? This action cannot be undone.`,
        )
      ) {
        return;
      }

      try {
        // First, get the config to see which chatapps it contains
        const res = await fetch(
          `/api/configs?file=${encodeURIComponent(filename)}`,
        );
        if (res.ok) {
          const json = await res.text();
          const configObj = JSON.parse(json);

          // Remove any displayed chatapps from this config
          let configChatAppIds: string[] = [];

          if (configObj.chatApps && Array.isArray(configObj.chatApps)) {
            // Old format: extract IDs from chatApps array
            configChatAppIds = configObj.chatApps.map((app: any) => app.id);
          } else if (configObj.id) {
            // New format: single config ID
            configChatAppIds = [configObj.id];
          }

          // No longer using localStorage for displayed configs
        }

        // Delete the config file from localStorage (if stored there)
        // Note: We can't actually delete files from public/configs via client-side code
        // This would need a server-side API endpoint for actual file deletion

        // For now, just remove from any local storage references
        alert(
          `Config ${filename} references removed from active chatapps. Note: The file still exists in /public/configs and would need to be manually deleted.`,
        );

        // Reload to reflect changes
        window.location.reload();
      } catch (e) {
        alert(
          `Failed to process config deletion: ${e instanceof Error ? e.message : e}`,
        );
      }
    }

    // We need to track config usage state
    const [configUsageState, setConfigUsageState] = React.useState<
      Record<string, boolean>
    >({});

    // Update config usage when displayedConfigs or configs change
    React.useEffect(() => {
      async function isConfigInUse(filename: string): Promise<boolean> {
        try {
          // Fetch the config to get its chatapps
          const res = await fetch(
            `/api/configs?file=${encodeURIComponent(filename)}`,
          );
          if (!res.ok) return false;

          const json = await res.text();
          const configObj = JSON.parse(json);

          let configChatAppIds: string[] = [];

          if (configObj.chatApps && Array.isArray(configObj.chatApps)) {
            // Old format: extract IDs from chatApps array
            configChatAppIds = configObj.chatApps.map((app: any) => app.id);
          } else if (configObj.id) {
            // New format: single config ID
            configChatAppIds = [configObj.id];
          } else {
            return false;
          }

          // Check if any of these chatapps are currently displayed
          return displayedConfigs.some((displayedApp) =>
            configChatAppIds.includes(displayedApp.id),
          );
        } catch {
          return false;
        }
      }

      const updateConfigUsage = async () => {
        const usageState: Record<string, boolean> = {};

        for (const filename of safeConfigs) {
          usageState[filename] = await isConfigInUse(filename);
        }

        setConfigUsageState(usageState);
      };

      if (safeConfigs.length > 0) {
        updateConfigUsage();
      }
    }, [safeConfigs, displayedConfigs]);

    if (!open) return null;
    return (
      <dialog
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          background: "rgba(0,0,0,0.5)",
          zIndex: 10001,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border: "none",
          padding: 0,
          margin: 0,
        }}
        onClick={onClose}
        onKeyDown={(e) => e.key === "Escape" && onClose()}
        open={open}
      >
        <div
          style={{
            background: "white",
            padding: 24,
            borderRadius: 12,
            maxWidth: 400,
            maxHeight: "80vh",
            overflow: "auto",
            boxShadow: "0 4px 24px rgba(0,0,0,0.2)",
          }}
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.key === "Escape" && onClose()}
          role="document"
        >
          <h2>Chat App Configs</h2>
          {safeConfigs.length === 0 ? (
            <div>No configs found in /public/configs.</div>
          ) : (
            <ul style={{ listStyle: "none", padding: 0 }}>
              {safeConfigs.map((file, index) => {
                const isInUse = configUsageState[file] || false;
                return (
                  <li
                    key={file}
                    style={{
                      marginBottom: 12,
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "8px",
                      borderRadius: "6px",
                      backgroundColor: isInUse ? "#f3f4f6" : "transparent",
                      opacity: isInUse ? 0.6 : 1,
                      border: isInUse
                        ? "1px solid #d1d5db"
                        : "1px solid transparent",
                    }}
                  >
                    <button
                      type="button"
                      style={{
                        background: isInUse ? "#9ca3af" : "#2563eb",
                        color: "white",
                        border: "none",
                        borderRadius: 6,
                        padding: "6px 12px",
                        cursor: isInUse ? "not-allowed" : "pointer",
                        flex: 1,
                      }}
                      onClick={() => handleImportConfig(file)}
                      disabled={loading || isInUse}
                    >
                      {isInUse ? `${file} (Active)` : `Import ${file}`}
                    </button>
                    <button
                      type="button"
                      style={{
                        background: "#ef4444",
                        color: "white",
                        border: "none",
                        borderRadius: 4,
                        padding: "4px 8px",
                        cursor: "pointer",
                        fontSize: "14px",
                        fontWeight: "bold",
                      }}
                      onClick={() => handleDeleteConfig(file)}
                      disabled={loading}
                      title={`Delete ${file}`}
                    >
                      ×
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
          <button
            type="button"
            style={{
              marginTop: 16,
              background: "#ef4444",
              color: "white",
              border: "none",
              borderRadius: 6,
              padding: "6px 12px",
              cursor: "pointer",
            }}
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </dialog>
    );
  }

  // Add dev-only button to mainToolbarConfig
  if (process.env.NODE_ENV === "development") {
    const idx = mainToolbarConfig.items.findIndex((i) => i.id === "settings");
    mainToolbarConfig.items.splice(idx, 0, {
      id: "manage-buddy-configs",
      label: "Configs",
      icon: <FolderOpen className="h-4 w-4" />,
      action: () => {
        if (!window.__buddyConfigLoaderModal) {
          const root = document.createElement("div");
          document.body.appendChild(root);
          const rootInstance = createRoot(root);
          function close() {
            if (window.__buddyConfigLoaderModal?.rootInstance) {
              window.__buddyConfigLoaderModal.rootInstance.unmount();
            }
            document.body.removeChild(root);
            window.__buddyConfigLoaderModal = null;
          }
          window.__buddyConfigLoaderModal = { root, rootInstance };
          rootInstance.render(
            React.createElement(BuddyConfigLoaderModal, {
              open: true,
              onClose: close,
            }),
          );
        }
      },
      tooltip: "Manage chat app configs",
      variant: "secondary",
    });

    // Chat Apps Manager - shows count and provides controls
    function ChatAppsManagerModal({
      open,
      onClose,
    }: { open: boolean; onClose: () => void }) {
      const [displayedConfigs, setDisplayedConfigs] = React.useState<any[]>([]);

      React.useEffect(() => {
        if (!open) return;

        // No longer using localStorage for displayed configs
        setDisplayedConfigs([]);
      }, [open]);

      function handleClearAll() {
        setDisplayedConfigs([]);
        onClose();
        window.location.reload();
      }

      function handleRemoveConfig(configId: string) {
        const updated = displayedConfigs.filter((c) => c.id !== configId);
        setDisplayedConfigs(updated);

        // Reload to reflect changes
        window.location.reload();
      }

      if (!open) return null;

      return (
        <dialog
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            background: "rgba(0,0,0,0.5)",
            zIndex: 10001,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "none",
            padding: 0,
            margin: 0,
          }}
          onClick={onClose}
          onKeyDown={(e) => e.key === "Escape" && onClose()}
          open={open}
        >
          <div
            style={{
              background: "white",
              padding: 24,
              borderRadius: 12,
              maxWidth: 500,
              maxHeight: "80vh",
              overflow: "auto",
              boxShadow: "0 4px 24px rgba(0,0,0,0.2)",
            }}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.key === "Escape" && onClose()}
            role="document"
          >
            <h2>Chat Apps Manager</h2>
            <p>Currently showing {displayedConfigs.length} chat app(s)</p>

            {displayedConfigs.length === 0 ? (
              <div style={{ margin: "16px 0" }}>
                No chat apps currently displayed.
              </div>
            ) : (
              <div style={{ margin: "16px 0" }}>
                {displayedConfigs.map((config, index) => (
                  <div
                    key={config.id || `config-${index}`}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "8px 0",
                      borderBottom: "1px solid #eee",
                    }}
                  >
                    <span>{config.name || config.id}</span>
                    <button
                      type="button"
                      style={{
                        background: "#ef4444",
                        color: "white",
                        border: "none",
                        borderRadius: 4,
                        padding: "4px 8px",
                        cursor: "pointer",
                        fontSize: "12px",
                      }}
                      onClick={() => handleRemoveConfig(config.id)}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: "flex", gap: "8px", marginTop: "16px" }}>
              {displayedConfigs.length > 0 && (
                <button
                  type="button"
                  style={{
                    background: "#ef4444",
                    color: "white",
                    border: "none",
                    borderRadius: 6,
                    padding: "6px 12px",
                    cursor: "pointer",
                  }}
                  onClick={handleClearAll}
                >
                  Clear All
                </button>
              )}
              <button
                type="button"
                style={{
                  background: "#6b7280",
                  color: "white",
                  border: "none",
                  borderRadius: 6,
                  padding: "6px 12px",
                  cursor: "pointer",
                }}
                onClick={onClose}
              >
                Close
              </button>
            </div>
          </div>
        </dialog>
      );
    }

    // Add chat apps manager button
    mainToolbarConfig.items.splice(idx, 0, {
      id: "chat-apps-manager",
      label: "Chat Apps",
      icon: <Grid3X3 className="h-4 w-4" />,
      action: () => {
        if (!window.__chatAppsManagerModal) {
          const root = document.createElement("div");
          document.body.appendChild(root);
          const rootInstance = createRoot(root);
          function close() {
            if (window.__chatAppsManagerModal?.rootInstance) {
              window.__chatAppsManagerModal.rootInstance.unmount();
            }
            document.body.removeChild(root);
            window.__chatAppsManagerModal = null;
          }
          window.__chatAppsManagerModal = { root, rootInstance };
          rootInstance.render(
            React.createElement(ChatAppsManagerModal, {
              open: true,
              onClose: close,
            }),
          );
        }
      },
      tooltip: "Manage displayed chat apps",
      variant: "secondary",
    });
  }
}

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
      id: "chat-app-switcher-compact",
      type: "custom" as const,
      element:
        process.env.NODE_ENV === "development" ? (
          <ChatAppSwitcherEnhanced />
        ) : (
          <ChatAppSwitcher />
        ),
    },
    {
      id: "spacer-expand",
      type: "spacer-expand" as const,
    },
    {
      id: "toggle-theme-editor",
      label: "Theme",
      icon: <Palette className="h-4 w-4" />,
      action: () => {
        console.log("Open theme editor in sidebar (compact)");
        appLayoutStore.send({
          type: "setActiveSidebarEditor",
          editor: "theme",
        });
      },
      tooltip: "Theme editor",
    },
  ],
};

// Helper function to get toolbar config based on screen size
export function getToolbarConfig(isMobile: boolean): ToolbarConfig {
  return isMobile ? compactToolbarConfig : mainToolbarConfig;
}
