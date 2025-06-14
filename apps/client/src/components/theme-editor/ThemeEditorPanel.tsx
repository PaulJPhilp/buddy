"use client";

import { ChatAppColors } from "@/themes/themeTypes";
import type { ChatAppTheme } from "@/themes/themeTypes";
import { cssToThemeObject, themeToCss } from "@/themes/themeUtils";
import { Button } from "@ui/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@ui/components/ui/card";
import { Input } from "@ui/components/ui/input";
import { Label } from "@ui/components/ui/label";
import { Download, Palette, Upload, X } from "lucide-react";
import { useTheme } from "next-themes";
import { useCallback, useEffect, useState } from "react";
import { ChromePicker } from "react-color";

interface ThemeEditorPanelProps {
  theme: ChatAppTheme;
  onThemeChange: (theme: ChatAppTheme) => void;
  isOpen: boolean;
  onClose: () => void;
}

const colorKeys = [
  ["background", "Background"],
  ["foreground", "Text Color"],
  ["primary", "Primary Color"],
  ["secondary", "Secondary Color"],
  ["border", "Border Color"],
  ["userArea", "User Area"],
  ["bubbleUser", "User Bubble"],
  ["bubbleAgent", "Agent Bubble"],
  ["headerBg", "Header Background"],
  ["headerText", "Header Text"],
] as const;

const isValidColor = (color: string) => {
  const s = new Option().style;
  s.color = color;
  return s.color !== "";
};

export function ThemeEditorPanel({
  theme,
  onThemeChange,
  isOpen,
  onClose,
}: ThemeEditorPanelProps) {
  const activeTheme = theme;

  if (!activeTheme || !activeTheme.colors) {
    return (
      <div className="text-red-500 p-4">
        This chat app has no theme or an invalid theme. Please fix the config.
      </div>
    );
  }
  const [editingColors, setEditingColors] = useState<Record<string, string>>(
    {},
  );
  const [openColorPicker, setOpenColorPicker] = useState<string | null>(null);

  // Helper to read a color value from the theme for a given key
  const getThemeColor = useCallback(
    (key: string, t: ChatAppTheme): string | undefined => {
      switch (key) {
        case "background":
          return t.colors?.background;
        case "foreground":
          return t.colors?.text;
        case "primary":
          return t.colors?.primary;
        case "secondary":
          return t.colors?.secondary;
        case "border":
          return t.colors?.border ?? t.borders?.color;
        case "userArea":
          return t.userArea?.background;
        case "bubbleUser":
          return t.bubbles?.user?.background;
        case "bubbleAgent":
          return t.bubbles?.agent?.background;
        case "headerBg":
          return t.header?.background;
        case "headerText":
          return t.header?.text;
        default:
          return undefined;
      }
    },
    [],
  );

  const getDisplayColor = (key: string): string =>
    editingColors[key] || getThemeColor(key, activeTheme) || "#ffffff";

  // Initialize editing colors from current theme
  useEffect(() => {
    if (activeTheme) {
      const initialColors: Record<string, string> = {};
      for (const [key] of colorKeys) {
        const value = getThemeColor(key, activeTheme);
        if (value && typeof value === "string") {
          initialColors[key] = value;
        }
      }
      setEditingColors(initialColors);
    }
  }, [activeTheme, getThemeColor]);

  const updateColor = (key: string, value: string) => {
    if (!isValidColor(value)) return;

    console.log("[ThemeEditor] updateColor called:", key, value);

    // Update local editing state
    setEditingColors((prev) => ({
      ...prev,
      [key]: value,
    }));

    // Build new theme immutably with deep clone where needed
    const updatedTheme: ChatAppTheme = (() => {
      const t = { ...activeTheme } as ChatAppTheme;
      switch (key) {
        case "background":
          t.colors = { ...t.colors, background: value };
          break;
        case "foreground":
          t.colors = { ...t.colors, text: value };
          break;
        case "primary":
          t.colors = { ...t.colors, primary: value };
          break;
        case "secondary":
          t.colors = { ...t.colors, secondary: value };
          break;
        case "border":
          t.colors = { ...t.colors, border: value };
          // keep borders color sync too
          t.borders = { ...t.borders, color: value };
          break;
        case "userArea":
          t.userArea = { ...(t.userArea || {}), background: value };
          break;
        case "bubbleUser":
          t.bubbles = {
            ...(t.bubbles || {}),
            user: { ...(t.bubbles?.user || {}), background: value },
            agent: t.bubbles?.agent,
          };
          break;
        case "bubbleAgent":
          t.bubbles = {
            ...(t.bubbles || {}),
            agent: { ...(t.bubbles?.agent || {}), background: value },
            user: t.bubbles?.user,
          };
          break;
        case "headerBg":
          t.header = { ...(t.header || {}), background: value };
          break;
        case "headerText":
          t.header = { ...(t.header || {}), text: value };
          break;
        default:
          // Fallback put into colors object to avoid losing updates
          t.colors = { ...t.colors, [key]: value } as any;
      }
      return t;
    })();

    console.log("[ThemeEditor] Emitting theme change:", updatedTheme);

    // Notify parent via callback
    if (onThemeChange) {
      onThemeChange(updatedTheme);
    }

    console.log("[ThemeEditor] Theme change dispatched to callback");
  };

  const exportTheme = () => {
    const themeCSS = themeToCss(activeTheme);
    const blob = new Blob([themeCSS], { type: "text/css" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "chat-theme.css";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const importTheme = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const content = reader.result as string;
        const themeObject = cssToThemeObject(content);

        if (themeObject?.colors) {
          // Update theme with imported colors
          const updatedTheme: ChatAppTheme = {
            ...activeTheme,
            colors: {
              ...activeTheme.colors,
              ...themeObject.colors,
            },
          };

          // Update local editing state
          setEditingColors((prev) => ({
            ...prev,
            ...themeObject.colors,
          }));

          // Call onThemeChange with updated theme
          onThemeChange(updatedTheme);
        }
      } catch (error) {
        console.error("Error importing theme:", error);
      }
    };
    reader.readAsText(file);

    // Reset the input
    event.target.value = "";
  };

  const resetToDefault = () => {
    // Reset to default theme
    onThemeChange("system");
  };

  if (!isOpen) return null;

  return (
    <div className="w-full h-full bg-background overflow-hidden">
      <Card className="h-full rounded-none border-0">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Theme Editor
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        <CardContent className="space-y-6 h-full overflow-y-auto">
          {/* Color Editor Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Colors</h3>
            <div className="space-y-3">
              {colorKeys.map(([key, label]) => (
                <div key={key} className="space-y-2">
                  <Label className="text-xs">{label}</Label>
                  <div className="flex items-center gap-2">
                    {/* Color Picker Button */}
                    <div className="relative">
                      <button
                        type="button"
                        className="w-8 h-8 rounded border border-input hover:border-ring transition-colors"
                        style={{
                          backgroundColor: getDisplayColor(key),
                        }}
                        onClick={() =>
                          setOpenColorPicker(
                            openColorPicker === key ? null : key,
                          )
                        }
                      />

                      {/* Color Picker Popup */}
                      {openColorPicker === key && (
                        <div className="absolute top-10 left-0 z-50">
                          {/* biome-ignore lint/a11y/useKeyWithClickEvents: <explanation> */}
                          <div
                            className="fixed inset-0 z-40"
                            onClick={() => setOpenColorPicker(null)}
                          />
                          <div className="relative z-50 shadow-lg rounded-lg overflow-hidden">
                            <ChromePicker
                              color={getDisplayColor(key)}
                              onChange={(color) => {
                                setEditingColors((prev) => ({
                                  ...prev,
                                  [key]: color.hex,
                                }));
                              }}
                              onChangeComplete={(color) => {
                                updateColor(key, color.hex);
                              }}
                              disableAlpha
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Color Input */}
                    <Input
                      type="text"
                      value={
                        editingColors[key] ||
                        getThemeColor(key, activeTheme) ||
                        ""
                      }
                      onChange={(e) => {
                        setEditingColors((prev) => ({
                          ...prev,
                          [key]: e.target.value,
                        }));
                      }}
                      onBlur={(e) => {
                        const value = e.target.value;
                        if (isValidColor(value)) {
                          updateColor(key, value);
                        } else {
                          // Reset to current theme value
                          setEditingColors((prev) => ({
                            ...prev,
                            [key]: getThemeColor(key, activeTheme) || "",
                          }));
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          const value = e.currentTarget.value;
                          if (isValidColor(value)) {
                            updateColor(key, value);
                          }
                          e.currentTarget.blur();
                        }
                      }}
                      className="flex-1 text-xs"
                      placeholder="#000000"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Theme Preview */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Preview</h3>
            <div className="space-y-2">
              {colorKeys.slice(0, 4).map(([key, label]) => (
                <div key={key} className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded border"
                    style={{
                      backgroundColor:
                        editingColors[key] ||
                        activeTheme.colors?.[key as keyof ChatAppColors] ||
                        "#ffffff",
                    }}
                  />
                  <span className="text-xs text-muted-foreground">{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3 pt-4 border-t">
            <Button
              onClick={exportTheme}
              variant="outline"
              size="sm"
              className="w-full"
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSS
            </Button>

            <div className="relative">
              <input
                type="file"
                onChange={importTheme}
                accept=".css"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                id="theme-import"
              />
              <Button variant="outline" size="sm" className="w-full" asChild>
                <label htmlFor="theme-import" className="cursor-pointer">
                  <Upload className="h-4 w-4 mr-2" />
                  Import CSS
                </label>
              </Button>
            </div>

            <Button
              onClick={resetToDefault}
              variant="outline"
              size="sm"
              className="w-full"
            >
              Reset to Default
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
