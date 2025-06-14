"use client";

import { ChatAppConfig } from "@/schemas/ChatAppConfigSchema";
import {
  EnhancedConfigLifecycleService,
  EnhancedConfigLifecycleServiceLive,
} from "@/services/config-lifecycle";
import { Effect } from "effect";
import React, { useCallback, useEffect, useState } from "react";
import { RealTimeConfigEditor } from "../config-editor/RealTimeConfigEditor";

interface ConfigManagerPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Config Management Panel with real-time updates, bulk operations, and live editing.
 * Provides a comprehensive view of all configs with their save status and allows
 * real-time editing with auto-save capabilities.
 */
export function ConfigManagerPanel({
  isOpen,
  onClose,
}: ConfigManagerPanelProps) {
  const [configs, setConfigs] = useState<ChatAppConfig[]>([]);
  const [saveStatus, setSaveStatus] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedConfigId, setSelectedConfigId] = useState<string | null>(null);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);

  // Load configs and setup real-time subscription
  useEffect(() => {
    if (!isOpen) return;

    let unsubscribe: (() => void) | null = null;

    const setupConfigManager = async () => {
      try {
        setLoading(true);
        setError(null);

        const service = await Effect.runPromise(
          Effect.gen(function* () {
            return yield* EnhancedConfigLifecycleService;
          }).pipe(Effect.provide(EnhancedConfigLifecycleServiceLive)),
        );

        // Load initial configs
        const initialConfigs = await Effect.runPromise(service.loadConfigs());
        setConfigs(initialConfigs);

        // Get initial state
        const state = await Effect.runPromise(service.getState());
        setSaveStatus(state.saveStatus);
        setAutoSaveEnabled(state.autoSaveEnabled);

        // Setup real-time subscription
        const subscription = await Effect.runPromise(
          service.subscribe((state) => {
            setConfigs(state.configs);
            setSaveStatus(state.saveStatus);
            setAutoSaveEnabled(state.autoSaveEnabled);
          }),
        );

        unsubscribe = subscription.unsubscribe;
      } catch (err) {
        console.error("Failed to setup config manager:", err);
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setLoading(false);
      }
    };

    setupConfigManager();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [isOpen]);

  // Toggle global auto-save
  const toggleGlobalAutoSave = useCallback(async () => {
    try {
      const service = await Effect.runPromise(
        Effect.gen(function* () {
          return yield* EnhancedConfigLifecycleService;
        }).pipe(Effect.provide(EnhancedConfigLifecycleServiceLive)),
      );

      await Effect.runPromise(service.toggleAutoSave());
    } catch (err) {
      console.error("Failed to toggle auto-save:", err);
    }
  }, []);

  // Save all configs
  const saveAllConfigs = useCallback(async () => {
    try {
      const service = await Effect.runPromise(
        Effect.gen(function* () {
          return yield* EnhancedConfigLifecycleService;
        }).pipe(Effect.provide(EnhancedConfigLifecycleServiceLive)),
      );

      // Save each config that has changes
      for (const config of configs) {
        const status = saveStatus[config.id];
        if (status === "dirty" || status === "error") {
          await Effect.runPromise(service.saveConfig(config.id)).catch(
            (err) => {
              console.warn(`Failed to save config ${config.id}:`, err);
            },
          );
        }
      }
    } catch (err) {
      console.error("Failed to save all configs:", err);
    }
  }, [configs, saveStatus]);

  // Delete config
  const deleteConfig = useCallback(
    async (configId: string) => {
      if (
        !confirm(
          `Are you sure you want to delete "${configs.find((c) => c.id === configId)?.name}"?`,
        )
      ) {
        return;
      }

      try {
        const service = await Effect.runPromise(
          Effect.gen(function* () {
            return yield* EnhancedConfigLifecycleService;
          }).pipe(Effect.provide(EnhancedConfigLifecycleServiceLive)),
        );

        await Effect.runPromise(service.deleteConfig(configId));

        // Close editor if this config was selected
        if (selectedConfigId === configId) {
          setSelectedConfigId(null);
        }
      } catch (err) {
        console.error("Failed to delete config:", err);
        alert(
          `Failed to delete config: ${err instanceof Error ? err.message : err}`,
        );
      }
    },
    [configs, selectedConfigId],
  );

  const getSaveStatusColor = (status: string) => {
    switch (status) {
      case "saved":
        return "text-green-600 bg-green-50";
      case "saving":
        return "text-blue-600 bg-blue-50";
      case "dirty":
        return "text-orange-600 bg-orange-50";
      case "error":
        return "text-red-600 bg-red-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  const getSaveStatusIcon = (status: string) => {
    switch (status) {
      case "saved":
        return "✅";
      case "saving":
        return "⏳";
      case "dirty":
        return "📝";
      case "error":
        return "❌";
      default:
        return "⚪";
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold">Config Manager</h2>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>{configs.length} configs</span>
              <span>•</span>
              <span
                className={autoSaveEnabled ? "text-green-600" : "text-gray-600"}
              >
                Auto-save {autoSaveEnabled ? "ON" : "OFF"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleGlobalAutoSave}
              className={`px-3 py-1 text-sm rounded ${
                autoSaveEnabled
                  ? "bg-green-100 text-green-700 hover:bg-green-200"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {autoSaveEnabled ? "Disable Auto-save" : "Enable Auto-save"}
            </button>

            <button
              onClick={saveAllConfigs}
              className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
            >
              Save All
            </button>

            <button
              onClick={onClose}
              className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
            >
              Close
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Config List */}
          <div className="w-1/3 border-r overflow-y-auto">
            {loading ? (
              <div className="p-4">
                <div className="animate-pulse space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-16 bg-gray-200 rounded"></div>
                  ))}
                </div>
              </div>
            ) : error ? (
              <div className="p-4 text-red-600 text-sm">Error: {error}</div>
            ) : configs.length === 0 ? (
              <div className="p-4 text-gray-500 text-sm">No configs found</div>
            ) : (
              <div className="divide-y">
                {configs.map((config) => {
                  const status = saveStatus[config.id] || "saved";
                  const isSelected = selectedConfigId === config.id;

                  return (
                    <div
                      key={config.id}
                      className={`p-3 cursor-pointer hover:bg-gray-50 ${
                        isSelected
                          ? "bg-blue-50 border-r-2 border-blue-500"
                          : ""
                      }`}
                      onClick={() => setSelectedConfigId(config.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">
                            {config.name}
                          </div>
                          <div className="text-xs text-gray-500 truncate">
                            {config.id}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <div
                            className={`px-2 py-1 rounded text-xs ${getSaveStatusColor(status)}`}
                          >
                            <span className="mr-1">
                              {getSaveStatusIcon(status)}
                            </span>
                            {status}
                          </div>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteConfig(config.id);
                            }}
                            className="text-red-500 hover:text-red-700 text-xs p-1"
                            title="Delete config"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Config Editor */}
          <div className="flex-1 overflow-y-auto">
            {selectedConfigId ? (
              <div className="p-4">
                <RealTimeConfigEditor
                  configId={selectedConfigId}
                  onClose={() => setSelectedConfigId(null)}
                />
              </div>
            ) : (
              <div className="p-8 text-center text-gray-500">
                <div className="text-4xl mb-4">⚙️</div>
                <div className="text-lg font-medium mb-2">Select a Config</div>
                <div className="text-sm">
                  Choose a config from the list to start editing
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
