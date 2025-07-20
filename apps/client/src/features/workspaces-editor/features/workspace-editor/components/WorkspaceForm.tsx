"use client";

import type {
  Workspace,
  WorkspaceCreateInput,
  WorkspaceUpdateInput,
} from "@/managers/workspace-manager/types";
import { WORKSPACE_MANAGER_CONSTANTS } from "@/managers/workspace-manager/types";
import { useCallback, useState } from "react";

interface WorkspaceFormProps {
  workspace?: Workspace;
  onSubmit: (
    input: WorkspaceCreateInput | WorkspaceUpdateInput,
  ) => Promise<void>;
  onCancel: () => void;
  isEditing?: boolean;
  isSubmitting?: boolean;
  hideIconPicker?: boolean;
  hideColorPicker?: boolean;
  compact?: boolean;
}

// Common workspace icons
const WORKSPACE_ICONS = [
  "💼",
  "🎯",
  "🚀",
  "⚡",
  "🔥",
  "💡",
  "🎨",
  "🔧",
  "📊",
  "🌟",
  "🎪",
  "🎭",
  "🎬",
  "🎵",
  "🎮",
  "🤖",
  "🧠",
  "📚",
  "✍️",
  "🔬",
  "🏗️",
  "🎯",
  "🌈",
];

// Common workspace colors
const WORKSPACE_COLORS = [
  "#ef4444",
  "#f97316",
  "#f59e0b",
  "#eab308",
  "#84cc16",
  "#22c55e",
  "#10b981",
  "#14b8a6",
  "#06b6d4",
  "#0ea5e9",
  "#3b82f6",
  "#6366f1",
  "#8b5cf6",
  "#a855f7",
  "#d946ef",
  "#ec4899",
  "#f43f5e",
  "#6b7280",
];

export function WorkspaceForm({
  workspace,
  onSubmit,
  onCancel,
  isEditing = false,
  isSubmitting = false,
  hideIconPicker = false,
  hideColorPicker = false,
  compact = false,
}: WorkspaceFormProps) {
  const [name, setName] = useState(workspace?.name || "");
  const [description, setDescription] = useState(workspace?.description || "");
  const [icon, setIcon] = useState(workspace?.icon || WORKSPACE_ICONS[0]);
  const [primaryColor, setPrimaryColor] = useState(
    workspace?.primaryColor || WORKSPACE_COLORS[0],
  );
  const [maxExpandedApps, setMaxExpandedApps] = useState(
    workspace?.maxExpandedApps ||
      WORKSPACE_MANAGER_CONSTANTS.DEFAULT_MAX_EXPANDED_APPS,
  );
  const [isArchived, setIsArchived] = useState(workspace?.isArchived || false);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!name.trim()) {
        alert("Workspace name is required");
        return;
      }

      const input = {
        name: name.trim(),
        description: description.trim(),
        icon,
        primaryColor,
        ...(isEditing && { maxExpandedApps, isArchived }),
      };

      await onSubmit(input);
    },
    [
      name,
      description,
      icon,
      primaryColor,
      maxExpandedApps,
      isArchived,
      onSubmit,
      isEditing,
    ],
  );

  const handleIconSelect = useCallback((selectedIcon: string) => {
    setIcon(selectedIcon);
  }, []);

  const handleColorSelect = useCallback((selectedColor: string) => {
    setPrimaryColor(selectedColor);
  }, []);

  return (
    <form
      onSubmit={handleSubmit}
      className={compact ? "w-1/2" : "w-1/2"}
      style={{
        padding: "var(--workspace-form-padding, 24px)",
        backgroundColor: "var(--color-workspace-form-bg, #ffffff)",
        borderRadius: "var(--workspace-form-input-border-radius, 6px)",
        border: "1px solid var(--color-workspace-form-border, #e2e8f0)",
        fontFamily:
          "var(--workspace-font-family, 'Geist', system-ui, sans-serif)",
        display: "flex",
        flexDirection: "column",
        gap: "var(--workspace-form-spacing, 16px)",
      }}
    >
      <div
        className="flex items-center justify-between"
        style={{
          marginBottom: compact ? "4px" : "8px",
        }}
      >
        <h2
          style={{
            fontSize: compact
              ? "16px"
              : "var(--workspace-header-font-size, 18px)",
            fontWeight: "var(--workspace-header-font-weight, 600)",
            color: "var(--color-workspace-form-label-text, #374151)",
          }}
        >
          {isEditing ? "Edit Workspace" : "Create New Workspace"}
        </h2>
        <div
          className="flex items-center"
          style={{
            gap: compact ? "4px" : "8px",
          }}
        >
          <span
            style={{
              fontSize: compact
                ? "18px"
                : "var(--workspace-header-icon-size, 48px)",
            }}
          >
            {icon}
          </span>
          <div
            style={{
              width: compact ? "12px" : "24px",
              height: compact ? "12px" : "24px",
              borderRadius: "50%",
              border: `${compact ? "1px" : "2px"} solid var(--color-workspace-form-picker-border, #d1d5db)`,
              backgroundColor: primaryColor,
            }}
          />
        </div>
      </div>

      {/* Basic Information */}
      <div
        className={
          compact
            ? "grid grid-cols-1 gap-2"
            : "grid grid-cols-1 md:grid-cols-2 gap-6"
        }
      >
        <div>
          <label
            htmlFor="workspace-name-input"
            style={{
              display: "block",
              fontSize: "var(--workspace-form-label-font-size, 14px)",
              fontWeight: "var(--workspace-form-label-font-weight, 500)",
              color: "var(--color-workspace-form-label-text, #374151)",
              marginBottom: compact ? "4px" : "8px",
            }}
          >
            Workspace Name *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="My Awesome Workspace"
            style={{
              width: "100%",
              padding: "var(--workspace-form-input-padding, 8px 12px)",
              border:
                "var(--workspace-form-input-border-width, 1px) solid var(--color-workspace-form-input-border, #d1d5db)",
              borderRadius: "var(--workspace-form-input-border-radius, 6px)",
              fontSize: "var(--workspace-form-input-font-size, 14px)",
              backgroundColor: "var(--color-workspace-form-input-bg, #ffffff)",
              color: "var(--color-workspace-form-input-text, #111827)",
              outline: "none",
              transition:
                "border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out",
            }}
            onFocus={(e) => {
              e.target.style.borderColor =
                "var(--color-workspace-form-input-border-focus, #3b82f6)";
              e.target.style.boxShadow = `0 0 0 2px var(--color-workspace-form-input-border-focus, #3b82f6)25`;
            }}
            onBlur={(e) => {
              e.target.style.borderColor =
                "var(--color-workspace-form-input-border, #d1d5db)";
              e.target.style.boxShadow = "none";
            }}
            required
            maxLength={WORKSPACE_MANAGER_CONSTANTS.MAX_NAME_LENGTH}
          />
          <div
            style={{
              fontSize: compact ? "10px" : "12px",
              color: "var(--color-workspace-form-meta-text, #9ca3af)",
              marginTop: compact ? "2px" : "4px",
            }}
          >
            {name.length} / {WORKSPACE_MANAGER_CONSTANTS.MAX_NAME_LENGTH}{" "}
            characters
          </div>
        </div>

        <div>
          <label
            htmlFor="workspace-description"
            style={{
              display: "block",
              fontSize: "var(--workspace-form-label-font-size, 14px)",
              fontWeight: "var(--workspace-form-label-font-weight, 500)",
              color: "var(--color-workspace-form-label-text, #374151)",
              marginBottom: compact ? "4px" : "8px",
            }}
          >
            Description
          </label>
          <textarea
            id="workspace-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe your workspace..."
            rows={compact ? 2 : 3}
            style={{
              width: "100%",
              padding: "var(--workspace-form-input-padding, 8px 12px)",
              minHeight: compact ? "56px" : "auto",
              border:
                "var(--workspace-form-input-border-width, 1px) solid var(--color-workspace-form-input-border, #d1d5db)",
              borderRadius: "var(--workspace-form-input-border-radius, 6px)",
              fontSize: "var(--workspace-form-input-font-size, 14px)",
              backgroundColor: "var(--color-workspace-form-input-bg, #ffffff)",
              color: "var(--color-workspace-form-input-text, #111827)",
              outline: "none",
              transition:
                "border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out",
              resize: "vertical",
            }}
            onFocus={(e) => {
              e.target.style.borderColor =
                "var(--color-workspace-form-input-border-focus, #3b82f6)";
              e.target.style.boxShadow = `0 0 0 2px var(--color-workspace-form-input-border-focus, #3b82f6)25`;
            }}
            onBlur={(e) => {
              e.target.style.borderColor =
                "var(--color-workspace-form-input-border, #d1d5db)";
              e.target.style.boxShadow = "none";
            }}
            maxLength={WORKSPACE_MANAGER_CONSTANTS.MAX_DESCRIPTION_LENGTH}
          />
          <div
            className={
              compact
                ? "text-[10px] text-gray-400 mt-0.5"
                : "text-xs text-gray-500 mt-1"
            }
          >
            {description.length} /{" "}
            {WORKSPACE_MANAGER_CONSTANTS.MAX_DESCRIPTION_LENGTH} characters
          </div>
        </div>
      </div>

      {/* Icon Selection (hidden if hideIconPicker) */}
      {!hideIconPicker && (
        <div>
          <label
            htmlFor="workspace-icon-picker"
            style={{
              display: "block",
              fontSize: "var(--workspace-form-label-font-size, 14px)",
              fontWeight: "var(--workspace-form-label-font-weight, 500)",
              color: "var(--color-workspace-form-label-text, #374151)",
              marginBottom: "8px",
            }}
          >
            Choose Icon
          </label>
          <div
            id="workspace-icon-picker"
            className="grid grid-cols-8"
            style={{
              gap: "8px",
            }}
          >
            {WORKSPACE_ICONS.map((workspaceIcon) => (
              <button
                key={workspaceIcon}
                type="button"
                onClick={() => handleIconSelect(workspaceIcon)}
                className="transition-all"
                style={{
                  padding: "8px",
                  fontSize: "20px",
                  borderRadius:
                    "var(--workspace-form-input-border-radius, 6px)",
                  border: `2px solid ${
                    icon === workspaceIcon
                      ? "var(--color-workspace-form-picker-border-active, #3b82f6)"
                      : "var(--color-workspace-form-picker-border, #d1d5db)"
                  }`,
                  backgroundColor:
                    icon === workspaceIcon
                      ? "var(--color-workspace-form-picker-bg-active, #dbeafe)"
                      : "var(--color-workspace-form-input-bg, #ffffff)",
                }}
                onMouseEnter={(e) => {
                  if (icon !== workspaceIcon) {
                    e.currentTarget.style.borderColor =
                      "var(--color-workspace-border-hover, #cbd5e1)";
                    e.currentTarget.style.backgroundColor =
                      "var(--color-workspace-secondary, #f1f5f9)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (icon !== workspaceIcon) {
                    e.currentTarget.style.borderColor =
                      "var(--color-workspace-form-picker-border, #d1d5db)";
                    e.currentTarget.style.backgroundColor =
                      "var(--color-workspace-form-input-bg, #ffffff)";
                  }
                }}
              >
                {workspaceIcon}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Color Selection (hidden if hideColorPicker) */}
      {!hideColorPicker && (
        <div>
          <label
            htmlFor="workspace-color-picker"
            style={{
              display: "block",
              fontSize: "var(--workspace-form-label-font-size, 14px)",
              fontWeight: "var(--workspace-form-label-font-weight, 500)",
              color: "var(--color-workspace-form-label-text, #374151)",
              marginBottom: "8px",
            }}
          >
            Choose Color
          </label>
          <div
            id="workspace-color-picker"
            className="grid grid-cols-9"
            style={{
              gap: "8px",
            }}
          >
            {WORKSPACE_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => handleColorSelect(color)}
                className="transition-all"
                style={{
                  width: "var(--workspace-form-color-picker-size, 32px)",
                  height: "var(--workspace-form-color-picker-size, 32px)",
                  borderRadius: "50%",
                  border: `2px solid ${
                    primaryColor === color
                      ? "var(--color-workspace-foreground, #0f172a)"
                      : "var(--color-workspace-form-picker-border, #d1d5db)"
                  }`,
                  backgroundColor: color,
                  transform: primaryColor === color ? "scale(1.1)" : "scale(1)",
                }}
                onMouseEnter={(e) => {
                  if (primaryColor !== color) {
                    e.currentTarget.style.borderColor =
                      "var(--color-workspace-border-hover, #cbd5e1)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (primaryColor !== color) {
                    e.currentTarget.style.borderColor =
                      "var(--color-workspace-form-picker-border, #d1d5db)";
                  }
                }}
                title={color}
              />
            ))}
          </div>
        </div>
      )}

      {/* Advanced Settings (only for editing) */}
      {isEditing && (
        <div className="border-t pt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Advanced Settings
          </h3>

          <div className="grid grid-cols-1 gap-2">
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-1">
                My Awesome Workspace
              </h3>
            </div>
            <div className="flex items-center">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isArchived}
                  onChange={(e) => setIsArchived(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">
                  Archive this workspace
                </span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Form Actions */}
      <div className="flex items-center justify-end space-x-2 pt-3 border-t">
        <button
          type="button"
          onClick={onCancel}
          className="px-2 py-1 text-xs text-gray-700 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting || !name.trim()}
          className="px-2 py-1 text-xs text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting
            ? "Saving..."
            : isEditing
              ? "Update Workspace"
              : "Create Workspace"}
        </button>
      </div>
    </form>
  );
}
