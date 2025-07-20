import { AppStyle } from "@/features/application/types/AppStyle";
import { Effect, Schema as S } from "effect";
import React, { useEffect } from "react";

interface AppEditorUIProps {
  config: any; // TODO: Define a more specific type for config
  handleFieldChange: (field: string, value: string) => void;
  activeTab: "edit" | "preview";
  onCancel: () => void;
  updateAppStyle: (style: Partial<AppStyle>) => void;
  resetAppStyle: () => void;
}

export function AppEditorUI({
  config,
  handleFieldChange,
  activeTab,
  onCancel,
  updateAppStyle,
  resetAppStyle,
}: AppEditorUIProps) {
  return (
    <div className="h-full bg-gray-50 flex flex-col">
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Form Panel */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-4 py-4 max-h-[calc(100vh-120px)] overflow-y-auto">
              {activeTab === "edit" ? (
                <AppConfigForm config={config} onChange={handleFieldChange} />
              ) : (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    Configuration Preview
                  </h3>
                  <pre className="bg-gray-50 p-4 rounded-md text-sm overflow-x-auto">
                    {JSON.stringify(config, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>

          {/* Preview Panel */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-4 py-4">
              <AppPreview config={config} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Simple form component for editing configuration
function AppConfigForm({
  config,
  onChange,
}: { config: any; onChange: (field: string, value: string) => void }) {
  console.log("🔥 FORM CONFIG:", config);
  console.log("🔥 FORM CONFIG.STYLE:", config.style);
  return (
    <div className="space-y-6">
      {/* Basic Info */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Basic Information
        </h3>
        <div className="space-y-4">
          <div>
            <label
              htmlFor="app-name"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              App Name
            </label>
            <input
              id="app-name"
              type="text"
              value={config.name}
              onChange={(e) => onChange("name", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label
              htmlFor="app-description"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Description
            </label>
            <input
              id="app-description"
              type="text"
              value={config.description}
              onChange={(e) => onChange("description", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Styling */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Styling</h3>
        <div className="space-y-4">
          <div>
            <label
              htmlFor="background-color"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Background Color
            </label>
            <input
              id="background-color"
              type="color"
              value={config.style.background || "#f9fafb"}
              onChange={(e) => {
                console.log("🔥 COLOR CHANGE:", e.target.value);
                onChange("style.background", e.target.value);
              }}
              onBlur={(e) => {
                console.log("🔥 COLOR BLUR:", e.target.value);
                onChange("style.background", e.target.value);
              }}
              className="w-full h-10 border border-gray-300 rounded-md"
            />
            <button
              type="button"
              onClick={() => {
                console.log("🔥 MANUAL TEST - Setting background to red");
                onChange("style.background", "#ff0000");
              }}
              className="mt-2 px-2 py-1 bg-red-500 text-white text-xs rounded"
            >
              Test Red
            </button>
          </div>
          <div>
            <label
              htmlFor="text-color"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Text Color
            </label>
            <input
              id="text-color"
              type="color"
              value={config.style.foreground || "#111827"}
              onChange={(e) => onChange("style.foreground", e.target.value)}
              className="w-full h-10 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label
              htmlFor="font-family"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Font Family
            </label>
            <input
              id="font-family"
              type="text"
              value={
                config.style.fontFamily || '"Geist", system-ui, sans-serif'
              }
              onChange={(e) => onChange("style.fontFamily", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Header Styling */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Header Styling
        </h3>
        <div className="space-y-4">
          <div>
            <label
              htmlFor="header-height"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Header Height
            </label>
            <input
              id="header-height"
              type="text"
              value={config.style.headerHeight || "64px"}
              onChange={(e) => onChange("style.headerHeight", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label
              htmlFor="header-background"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Header Background
            </label>
            <input
              id="header-background"
              type="color"
              value={config.style.headerBackground || "#ffffff"}
              onChange={(e) =>
                onChange("style.headerBackground", e.target.value)
              }
              className="w-full h-10 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label
              htmlFor="header-foreground"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Header Text Color
            </label>
            <input
              id="header-foreground"
              type="color"
              value={config.style.headerForeground || "#111827"}
              onChange={(e) =>
                onChange("style.headerForeground", e.target.value)
              }
              className="w-full h-10 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label
              htmlFor="header-border"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Header Border Color
            </label>
            <input
              id="header-border"
              type="color"
              value={config.style.headerBorder || "#e5e7eb"}
              onChange={(e) => onChange("style.headerBorder", e.target.value)}
              className="w-full h-10 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label
              htmlFor="header-shadow"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Header Shadow
            </label>
            <input
              id="header-shadow"
              type="text"
              value={config.style.headerShadow || "0 1px 3px 0 rgba(0,0,0,0.1)"}
              onChange={(e) => onChange("style.headerShadow", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Sidebar Styling */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Sidebar Styling
        </h3>
        <div className="space-y-4">
          <div>
            <label
              htmlFor="sidebar-width"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Sidebar Width
            </label>
            <input
              id="sidebar-width"
              type="text"
              value={config.style.sidebarWidth || "240px"}
              onChange={(e) => onChange("style.sidebarWidth", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label
              htmlFor="sidebar-background"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Sidebar Background
            </label>
            <input
              id="sidebar-background"
              type="color"
              value={config.style.sidebarBackground || "#ffffff"}
              onChange={(e) =>
                onChange("style.sidebarBackground", e.target.value)
              }
              className="w-full h-10 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label
              htmlFor="sidebar-foreground"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Sidebar Text Color
            </label>
            <input
              id="sidebar-foreground"
              type="color"
              value={config.style.sidebarForeground || "#111827"}
              onChange={(e) =>
                onChange("style.sidebarForeground", e.target.value)
              }
              className="w-full h-10 border border-gray-300 rounded-md"
            />
          </div>
        </div>
      </div>

      {/* Main Content Styling */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Main Content Styling
        </h3>
        <div className="space-y-4">
          <div>
            <label
              htmlFor="main-background"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Main Background
            </label>
            <input
              id="main-background"
              type="color"
              value={config.style.mainBackground || "#f9fafb"}
              onChange={(e) => onChange("style.mainBackground", e.target.value)}
              className="w-full h-10 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label
              htmlFor="main-foreground"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Main Text Color
            </label>
            <input
              id="main-foreground"
              type="color"
              value={config.style.mainForeground || "#111827"}
              onChange={(e) => onChange("style.mainForeground", e.target.value)}
              className="w-full h-10 border border-gray-300 rounded-md"
            />
          </div>
        </div>
      </div>

      {/* Auth Button Styling */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Auth Button Styling
        </h3>
        <div className="space-y-4">
          <div>
            <label
              htmlFor="auth-button-background"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Auth Button Background
            </label>
            <input
              id="auth-button-background"
              type="color"
              value={config.style.authButtonBackground || "#ffffff"}
              onChange={(e) =>
                onChange("style.authButtonBackground", e.target.value)
              }
              className="w-full h-10 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label
              htmlFor="auth-button-foreground"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Auth Button Text Color
            </label>
            <input
              id="auth-button-foreground"
              type="color"
              value={config.style.authButtonForeground || "#111827"}
              onChange={(e) =>
                onChange("style.authButtonForeground", e.target.value)
              }
              className="w-full h-10 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label
              htmlFor="auth-button-hover-background"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Auth Button Hover Background
            </label>
            <input
              id="auth-button-hover-background"
              type="color"
              value={config.style.authButtonHoverBackground || "#2563eb"}
              onChange={(e) =>
                onChange("style.authButtonHoverBackground", e.target.value)
              }
              className="w-full h-10 border border-gray-300 rounded-md"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// Simple preview component for app configuration
function AppPreview({ config }: { config: any }) {
  return (
    <div className="p-4 bg-gray-50 rounded-md shadow-inner h-full flex flex-col">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Live Preview</h3>
      <div
        className="flex-1 border border-gray-300 rounded-md overflow-hidden flex items-center justify-center text-center"
        style={{
          backgroundColor: config.style.background,
          color: config.style.foreground,
          fontFamily: config.style.fontFamily,
        }}
      >
        <p>Your app preview will appear here.</p>
      </div>
    </div>
  );
}
