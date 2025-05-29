"use client";

import React, { createContext, useContext, useState } from "react";

interface ThemeColors {
    background: string;
    foreground: string;
    primary: string;
    secondary: string;
    border: string;
    userArea: string;
    bubbleUser: string;
    bubbleAgent: string;
    headerBg: string;
    headerText: string;
}

const defaultThemes: Record<string, ThemeColors> = {
    "default": {
        background: "#ffffff",
        foreground: "#1e3a8a",
        primary: "#3b82f6",
        secondary: "#f1f5f9",
        border: "#e2e8f0",
        userArea: "#f8fafc",
        bubbleUser: "#3b82f6",
        bubbleAgent: "#f1f5f9",
        headerBg: "#1e40af",
        headerText: "#ffffff",
    },
    "spike-dark": {
        background: "#1e293b",
        foreground: "#f1f5f9",
        primary: "#8b5cf6",
        secondary: "#334155",
        border: "#475569",
        userArea: "#0f172a",
        bubbleUser: "#8b5cf6",
        bubbleAgent: "#475569",
        headerBg: "#0f172a",
        headerText: "#f1f5f9",
    },
    "minimal-test": {
        background: "#22c55e",
        foreground: "#ffffff",
        primary: "#16a34a",
        secondary: "#15803d",
        border: "#166534",
        userArea: "#dcfce7",
        bubbleUser: "#16a34a",
        bubbleAgent: "#ffffff",
        headerBg: "#15803d",
        headerText: "#ffffff",
    },
};

interface ThemeContextType {
    currentTheme: string;
    isCustomMode: boolean;
    customColors: ThemeColors;
    defaultThemes: Record<string, ThemeColors>;
    setCurrentTheme: (theme: string) => void;
    setIsCustomMode: (isCustom: boolean) => void;
    setCustomColors: (colors: ThemeColors | ((prev: ThemeColors) => ThemeColors)) => void;
    handlePresetTheme: (themeName: string) => void;
    handleCustomMode: () => void;
    updateCustomColor: (key: keyof ThemeColors, value: string) => void;
    getActualTheme: () => string;
    getCustomStyle: () => React.CSSProperties;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [currentTheme, setCurrentTheme] = useState<string>("default");
    const [isCustomMode, setIsCustomMode] = useState(false);
    const [customColors, setCustomColors] = useState<ThemeColors>(
        defaultThemes.default
    );

    const handlePresetTheme = (themeName: string) => {
        setCurrentTheme(themeName);
        setIsCustomMode(false);
        setCustomColors(defaultThemes[themeName]);
    };

    const handleCustomMode = () => {
        setCurrentTheme("custom");
        setIsCustomMode(true);
    };

    const updateCustomColor = (key: keyof ThemeColors, value: string) => {
        setCustomColors((prev) => ({ ...prev, [key]: value }));
    };

    const getActualTheme = () => {
        return isCustomMode ? "custom" : currentTheme;
    };

    const getCustomStyle = (): React.CSSProperties => {
        return isCustomMode
            ? {
                "--color-chat-background": customColors.background,
                "--color-chat-foreground": customColors.foreground,
                "--color-chat-primary": customColors.primary,
                "--color-chat-secondary": customColors.secondary,
                "--color-chat-border": customColors.border,
                "--color-chat-user-area": customColors.userArea,
                "--color-chat-bubble-user": customColors.bubbleUser,
                "--color-chat-bubble-agent": customColors.bubbleAgent,
                "--color-chat-header-bg": customColors.headerBg,
                "--color-chat-header-text": customColors.headerText,
            } as React.CSSProperties
            : {};
    };

    const value: ThemeContextType = {
        currentTheme,
        isCustomMode,
        customColors,
        defaultThemes,
        setCurrentTheme,
        setIsCustomMode,
        setCustomColors,
        handlePresetTheme,
        handleCustomMode,
        updateCustomColor,
        getActualTheme,
        getCustomStyle,
    };

    return (
        <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error("useTheme must be used within a ThemeProvider");
    }
    return context;
}

export type { ThemeColors };
