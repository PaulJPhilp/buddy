import { useEffectContext } from "@/components/EffectProvider";
import { AppStyle } from "@/features/application/types/AppStyle";
import { AppConfigClientService } from "@buddy/config/services/app-config-client";
import { Effect, Schema as S } from "effect";
import React, { useState, useEffect } from "react";
import { AppEditorUI } from "../components/AppEditorUI";

// Note: App styling is now managed by the centralized AppStyleContext

// App configuration schema (Removed - now in AppEditorUI)
// const AppConfigSchema = S.Struct({ ... });

// Sample app configuration (Removed - now in AppEditorUI)
// const sampleAppConfig = { ... };

interface AppEditorContainerProps {
  onCancel?: () => void;
  activeTab?: "edit" | "preview";
  updateAppStyle: (style: Partial<AppStyle>) => void;
  resetAppStyle: () => void;
}

export function AppEditorContainer({
  onCancel,
  activeTab = "edit",
  updateAppStyle,
  resetAppStyle,
}: AppEditorContainerProps) {
  const { runWithServices } = useEffectContext();
  const [config, setConfig] = useState<any>(null); // Use any for now, refine type later

  useEffect(() => {
    // Temporarily use hardcoded config while API is being fixed
    console.log("🔥 AppEditorContainer: Using hardcoded config");
    const sampleAppConfig = {
      id: "buddy-app",
      name: "Buddy App",
      description: "Main Buddy application configuration",
      version: "1.0.0",
      style: {
        background: "#f9fafb",
        foreground: "#111827",
        fontFamily: '"Geist", system-ui, sans-serif',
        headerHeight: "64px",
        headerBackground: "#ffffff",
        headerForeground: "#111827",
        headerBorder: "#e5e7eb",
        headerShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
        sidebarWidth: "240px",
        sidebarBackground: "#ffffff",
        sidebarForeground: "#111827",
        sidebarBorder: "#e5e7eb",
        mainBackground: "#f9fafb",
        mainForeground: "#111827",
        authButtonBackground: "#ffffff",
        authButtonForeground: "#111827",
        authButtonHoverBackground: "#2563eb",
      },
    };
    setConfig(sampleAppConfig);
  }, []);

  if (!config) {
    return <div>Loading...</div>;
  }

  // Apply styles in real-time as the user edits using centralized system
  useEffect(() => {
    if (config?.style) {
      console.log(
        "🔥 App Editor Container updating style via centralized system:",
        config.style,
      );
      updateAppStyle(config.style);
    }
  }, [config?.style, updateAppStyle]);

  const handleFieldChange = (field: string, value: string) => {
    const keys = field.split(".");
    const newConfig = { ...config };
    let current: any = newConfig; // Use any for now

    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) {
        current[keys[i]] = {};
      } else {
        current[keys[i]] = { ...current[keys[i]] };
      }
      current = current[keys[i]];
    }

    current[keys[keys.length - 1]] = value;

    // Temporarily update local state only while API is being fixed
    console.log("🔥 AppEditorContainer: Updating local config:", newConfig);
    setConfig(newConfig);
  };

  return (
    <AppEditorUI
      config={config}
      handleFieldChange={handleFieldChange}
      activeTab={activeTab}
      onCancel={onCancel}
      updateAppStyle={updateAppStyle}
      resetAppStyle={resetAppStyle}
    />
  );
}
