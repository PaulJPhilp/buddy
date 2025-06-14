import { useThemeEditor } from "@/hooks/useConfigEditor";
import React from "react";

interface ConfigEditorProps {
  configId: string;
}

export function ConfigEditor({ configId }: ConfigEditorProps) {
  const {
    config,
    saveStatus,
    loading,
    error,
    updateBackgroundColor,
    updateTextColor,
    updateAccentColor,
    updateName,
    saveNow,
    revert,
    autoSaveEnabled,
    toggleAutoSave,
  } = useThemeEditor(configId);

  if (!config) {
    return <div>Config not found</div>;
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

  const getSaveStatusText = () => {
    switch (saveStatus) {
      case "saved":
        return "Saved";
      case "saving":
        return "Saving...";
      case "dirty":
        return "Unsaved changes";
      case "error":
        return "Save failed";
      default:
        return "Unknown";
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto bg-white rounded-lg shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          Config Editor: {config.name}
        </h2>

        {/* Save Status Indicator */}
        <div className="flex items-center gap-3">
          <span className={`text-sm font-medium ${getSaveStatusColor()}`}>
            {getSaveStatusText()}
          </span>

          {loading && (
            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          )}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Auto-save Toggle */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={autoSaveEnabled}
            onChange={toggleAutoSave}
            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
          />
          <span className="text-sm font-medium text-gray-700">
            Auto-save enabled (2 second delay)
          </span>
        </label>
        <p className="text-xs text-gray-500 mt-1">
          When enabled, changes are automatically saved after 2 seconds of
          inactivity
        </p>
      </div>

      {/* Config Name Editor */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Config Name
        </label>
        <input
          type="text"
          value={config.name}
          onChange={(e) => updateName(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Enter config name"
        />
        <p className="text-xs text-gray-500 mt-1">
          Name changes are saved immediately
        </p>
      </div>

      {/* Theme Color Editors */}
      {config.theme && (
        <div className="space-y-4 mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Theme Colors</h3>

          {/* Background Color */}
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-gray-700 w-24">
              Background:
            </label>
            <input
              type="color"
              value={config.theme.colors?.background || "#ffffff"}
              onChange={(e) => updateBackgroundColor(e.target.value)}
              className="w-12 h-8 border border-gray-300 rounded cursor-pointer"
            />
            <span className="text-sm text-gray-600 font-mono">
              {config.theme.colors?.background || "#ffffff"}
            </span>
          </div>

          {/* Text Color */}
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-gray-700 w-24">
              Text:
            </label>
            <input
              type="color"
              value={config.theme.colors?.text || "#000000"}
              onChange={(e) => updateTextColor(e.target.value)}
              className="w-12 h-8 border border-gray-300 rounded cursor-pointer"
            />
            <span className="text-sm text-gray-600 font-mono">
              {config.theme.colors?.text || "#000000"}
            </span>
          </div>

          {/* Accent Color */}
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-gray-700 w-24">
              Accent:
            </label>
            <input
              type="color"
              value={config.theme.colors?.accent || "#3b82f6"}
              onChange={(e) => updateAccentColor(e.target.value)}
              className="w-12 h-8 border border-gray-300 rounded cursor-pointer"
            />
            <span className="text-sm text-gray-600 font-mono">
              {config.theme.colors?.accent || "#3b82f6"}
            </span>
          </div>

          <p className="text-xs text-gray-500">
            Color changes update immediately and are auto-saved after 2 seconds
          </p>
        </div>
      )}

      {/* Preview Area */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">
          Live Preview
        </h3>
        <div
          className="p-4 rounded-lg border-2 border-dashed border-gray-300"
          style={{
            backgroundColor: config.theme?.colors?.background || "#ffffff",
            color: config.theme?.colors?.text || "#000000",
          }}
        >
          <h4 className="font-semibold mb-2">Chat App: {config.name}</h4>
          <p className="text-sm mb-3">
            This is how your chat app will look with the current theme settings.
          </p>
          <button
            className="px-3 py-1 rounded text-sm font-medium"
            style={{
              backgroundColor: config.theme?.colors?.accent || "#3b82f6",
              color: "#ffffff",
            }}
          >
            Sample Button
          </button>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={saveNow}
          disabled={loading || saveStatus === "saved"}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Save Now
        </button>

        <button
          onClick={revert}
          disabled={loading || saveStatus === "saved"}
          className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Revert Changes
        </button>
      </div>

      {/* Status Information */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="text-sm font-semibold text-gray-700 mb-2">
          Status Information
        </h4>
        <div className="text-xs text-gray-600 space-y-1">
          <div>
            Config ID: <span className="font-mono">{config.id}</span>
          </div>
          <div>
            Save Status:{" "}
            <span className={getSaveStatusColor()}>{getSaveStatusText()}</span>
          </div>
          <div>
            Auto-save:{" "}
            <span
              className={autoSaveEnabled ? "text-green-600" : "text-red-600"}
            >
              {autoSaveEnabled ? "Enabled" : "Disabled"}
            </span>
          </div>
          <div>
            Loading:{" "}
            <span className={loading ? "text-blue-600" : "text-gray-600"}>
              {loading ? "Yes" : "No"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Example usage component
export function ConfigEditorExample() {
  const [selectedConfigId, setSelectedConfigId] = React.useState<string>("");

  // This would typically come from your app's config list
  const availableConfigs = [
    { id: "config-1", name: "Default Chat" },
    { id: "config-2", name: "Dark Theme Chat" },
    { id: "config-3", name: "Colorful Chat" },
  ];

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
          Real-Time Config Editor Demo
        </h1>

        {/* Config Selector */}
        <div className="mb-8 text-center">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select a config to edit:
          </label>
          <select
            value={selectedConfigId}
            onChange={(e) => setSelectedConfigId(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Choose a config...</option>
            {availableConfigs.map((config) => (
              <option key={config.id} value={config.id}>
                {config.name}
              </option>
            ))}
          </select>
        </div>

        {/* Config Editor */}
        {selectedConfigId && <ConfigEditor configId={selectedConfigId} />}

        {/* Instructions */}
        <div className="mt-12 p-6 bg-blue-50 rounded-lg">
          <h2 className="text-lg font-semibold text-blue-900 mb-3">
            How Real-Time Editing Works
          </h2>
          <ul className="text-sm text-blue-800 space-y-2">
            <li>
              • <strong>Immediate UI Updates:</strong> Changes appear instantly
              in the preview
            </li>
            <li>
              • <strong>Smart Auto-Save:</strong> Files are saved automatically
              after 2 seconds of inactivity
            </li>
            <li>
              • <strong>Save Status Tracking:</strong> See exactly when your
              changes are saved
            </li>
            <li>
              • <strong>Error Recovery:</strong> Revert changes if something
              goes wrong
            </li>
            <li>
              • <strong>Manual Control:</strong> Save immediately or disable
              auto-save as needed
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
