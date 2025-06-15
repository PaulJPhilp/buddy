"use client";

import { useConfigEditor } from "@/hooks/useConfigEditor";
import { ChatAppConfig } from "@/types/global";
import React, { useState } from "react";

interface RealTimeConfigEditorProps {
  configId: string;
  onClose?: () => void;
}

/**
 * Real-time config editor with auto-save, debounced updates, and save status tracking.
 * Uses the enhanced ConfigLifecycleService for immediate UI updates and smart persistence.
 */
export function RealTimeConfigEditor({
  configId,
  onClose,
}: RealTimeConfigEditorProps) {
  const {
    config,
    saveStatus,
    loading,
    error,
    updateTheme,
    updateName,
    saveNow,
    revert,
    autoSaveEnabled,
    toggleAutoSave,
  } = useConfigEditor({ configId });

  const [isExpanded, setIsExpanded] = useState(false);

  if (loading) {
    return (
      <div className="p-4 border rounded-lg bg-background">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
          <div className="h-8 bg-gray-200 rounded w-full"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 border rounded-lg bg-red-50 border-red-200">
        <div className="text-red-600 text-sm">
          Error loading config: {error}
        </div>
        <button
          onClick={onClose}
          className="mt-2 px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
        >
          Close
        </button>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="p-4 border rounded-lg bg-yellow-50 border-yellow-200">
        <div className="text-yellow-600 text-sm">
          Config not found: {configId}
        </div>
        <button
          onClick={onClose}
          className="mt-2 px-3 py-1 text-xs bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200"
        >
          Close
        </button>
      </div>
    );
  }

  const getSaveStatusColor = () => {
    switch (saveStatus) {
      case "saved":
        return "text-green-600";
      case "saving":
        return "text-blue-600";
      case "dirty":
        return "text-orange-600";
      case "error":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  const getSaveStatusIcon = () => {
    switch (saveStatus) {
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

  return (
    <div className="border rounded-lg bg-background shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b">
        <div className="flex items-center gap-2">
          <h3 className="font-medium text-sm">{config.name}</h3>
          <div
            className={`text-xs flex items-center gap-1 ${getSaveStatusColor()}`}
          >
            <span>{getSaveStatusIcon()}</span>
            <span className="capitalize">{saveStatus}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded"
          >
            {isExpanded ? "Collapse" : "Expand"}
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Quick Controls */}
      <div className="p-3 border-b bg-gray-50">
        <div className="flex items-center gap-4 text-xs">
          <label className="flex items-center gap-1">
            <input
              type="checkbox"
              checked={autoSaveEnabled}
              onChange={toggleAutoSave}
              className="w-3 h-3"
            />
            Auto-save
          </label>

          <button
            onClick={saveNow}
            disabled={saveStatus === "saved" || saveStatus === "saving"}
            className="px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Save Now
          </button>

          <button
            onClick={revert}
            disabled={saveStatus === "saved"}
            className="px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Revert
          </button>
        </div>
      </div>

      {/* Editor Fields */}
      <div className="p-3">
        {/* Name Field */}
        <div className="mb-3">
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Name
          </label>
          <input
            type="text"
            value={config.name}
            onChange={(e) => updateName(e.target.value)}
            className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="Config name"
          />
        </div>

        {/* Theme Colors - Always visible */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Primary Color
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={config.theme?.colors?.primary || "#3b82f6"}
                onChange={(e) =>
                  updateTheme({
                    colors: {
                      ...config.theme?.colors,
                      primary: e.target.value,
                    },
                  })
                }
                className="w-8 h-8 border rounded cursor-pointer"
              />
              <input
                type="text"
                value={config.theme?.colors?.primary || "#3b82f6"}
                onChange={(e) =>
                  updateTheme({
                    colors: {
                      ...config.theme?.colors,
                      primary: e.target.value,
                    },
                  })
                }
                className="flex-1 px-2 py-1 text-xs border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Background
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={config.theme?.colors?.background || "#ffffff"}
                onChange={(e) =>
                  updateTheme({
                    colors: {
                      ...config.theme?.colors,
                      background: e.target.value,
                    },
                  })
                }
                className="w-8 h-8 border rounded cursor-pointer"
              />
              <input
                type="text"
                value={config.theme?.colors?.background || "#ffffff"}
                onChange={(e) =>
                  updateTheme({
                    colors: {
                      ...config.theme?.colors,
                      background: e.target.value,
                    },
                  })
                }
                className="flex-1 px-2 py-1 text-xs border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Expanded Fields */}
        {isExpanded && (
          <div className="space-y-3 pt-3 border-t">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Secondary Color
                </label>
                <input
                  type="color"
                  value={config.theme?.colors?.secondary || "#e5e7eb"}
                  onChange={(e) =>
                    updateTheme({
                      colors: {
                        ...config.theme?.colors,
                        secondary: e.target.value,
                      },
                    })
                  }
                  className="w-full h-8 border rounded cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Accent Color
                </label>
                <input
                  type="color"
                  value={config.theme?.colors?.accent || "#1d4ed8"}
                  onChange={(e) =>
                    updateTheme({
                      colors: {
                        ...config.theme?.colors,
                        accent: e.target.value,
                      },
                    })
                  }
                  className="w-full h-8 border rounded cursor-pointer"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Text Color
              </label>
              <input
                type="color"
                value={config.theme?.colors?.text || "#1f2937"}
                onChange={(e) =>
                  updateTheme({
                    colors: {
                      ...config.theme?.colors,
                      text: e.target.value,
                    },
                  })
                }
                className="w-full h-8 border rounded cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Border Radius
              </label>
              <input
                type="text"
                value={config.theme?.borders?.radius || "0.5rem"}
                onChange={(e) =>
                  updateTheme({
                    borders: {
                      ...config.theme?.borders,
                      radius: e.target.value,
                    },
                  })
                }
                className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="e.g., 0.5rem, 8px"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
