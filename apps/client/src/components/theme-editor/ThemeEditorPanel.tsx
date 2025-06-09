"use client";

import { ChatAppColors } from "@/features/chat/themes/themeTypes";
import { cssToThemeObject, themeToCss } from "@/features/chat/themes/themeUtils";
import { themeStore, useThemeStore } from "@/stores/themeStore";
import { Button } from "@ui/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@ui/components/ui/card";
import { Input } from "@ui/components/ui/input";
import { Label } from "@ui/components/ui/label";
import { Download, Palette, Upload, X } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { ChromePicker } from "react-color";

interface ThemeEditorPanelProps {
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

export function ThemeEditorPanel({ isOpen, onClose }: ThemeEditorPanelProps) {
    const { parsedTheme } = useThemeStore();
    const { setTheme } = useTheme();
    const [editingColors, setEditingColors] = useState<Record<string, string>>({});
    const [openColorPicker, setOpenColorPicker] = useState<string | null>(null);

    // Initialize editing colors from current theme
    useEffect(() => {
        if (parsedTheme?.colors) {
            const initialColors: Record<string, string> = {};
            for (const [key] of colorKeys) {
                const value = parsedTheme.colors[key as keyof ChatAppColors];
                if (value && typeof value === "string") {
                    initialColors[key] = value;
                }
            }
            setEditingColors(initialColors);
        }
    }, [parsedTheme]);

    const updateColor = (key: string, value: string) => {
        if (!isValidColor(value)) return;

        // Update the theme store
        const updatedTheme = {
            ...parsedTheme,
            colors: {
                ...parsedTheme.colors,
                [key]: value,
            },
        };

        // Update next-themes
        setTheme(JSON.stringify(updatedTheme));

        // Update local editing state
        setEditingColors(prev => ({
            ...prev,
            [key]: value,
        }));
    };

    const exportTheme = () => {
        const themeCSS = themeToCss(parsedTheme);
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
                    const updatedTheme = {
                        ...parsedTheme,
                        colors: {
                            ...parsedTheme.colors,
                            ...themeObject.colors,
                        },
                    };

                    setTheme(JSON.stringify(updatedTheme));

                    // Update local editing state
                    setEditingColors(prev => ({
                        ...prev,
                        ...themeObject.colors,
                    }));
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
        setTheme("system");
        themeStore.send({ type: "updateRawTheme", rawTheme: "system" });
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
                                                    backgroundColor: editingColors[key] || parsedTheme.colors?.[key as keyof ChatAppColors] || "#ffffff",
                                                }}
                                                onClick={() => setOpenColorPicker(openColorPicker === key ? null : key)}
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
                                                            color={editingColors[key] || parsedTheme.colors?.[key as keyof ChatAppColors] || "#ffffff"}
                                                            onChange={(color) => {
                                                                setEditingColors(prev => ({
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
                                            value={editingColors[key] || parsedTheme.colors?.[key as keyof ChatAppColors] || ""}
                                            onChange={(e) => {
                                                setEditingColors(prev => ({
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
                                                    setEditingColors(prev => ({
                                                        ...prev,
                                                        [key]: parsedTheme.colors?.[key as keyof ChatAppColors] || "",
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
                                            backgroundColor: editingColors[key] || parsedTheme.colors?.[key as keyof ChatAppColors] || "#ffffff"
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
                            <Button
                                variant="outline"
                                size="sm"
                                className="w-full"
                                asChild
                            >
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