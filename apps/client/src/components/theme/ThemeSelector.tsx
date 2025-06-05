"use client";

import { useTheme } from "@/contexts/ThemeContext";
import { SidebarItem, SidebarSection } from "@ui/components/ui/sidebar";
import dynamic from "next/dynamic";
import { useState } from "react";

// Dynamically import icons to prevent hydration mismatches
const Paintbrush = dynamic(() => import("lucide-react").then((mod) => ({ default: mod.Paintbrush })), {
    ssr: false,
    loading: () => <div className="h-4 w-4" />,
});

const Palette = dynamic(() => import("lucide-react").then((mod) => ({ default: mod.Palette })), {
    ssr: false,
    loading: () => <div className="h-4 w-4" />,
});

const Check = dynamic(() => import("lucide-react").then((mod) => ({ default: mod.Check })), {
    ssr: false,
    loading: () => <div className="h-4 w-4" />,
});

const Save = dynamic(() => import("lucide-react").then((mod) => ({ default: mod.Save })), {
    ssr: false,
    loading: () => <div className="h-4 w-4" />,
});

export function ThemeSelector() {
    const {
        currentTheme,
        setGlobalTheme,
        defaultThemes,
        chatThemes,
    } = useTheme();

    const [lastSaved, setLastSaved] = useState<string | null>(null);

    const getThemeDisplayName = (themeName: string): string => {
        return themeName
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    };

    const getThemeColorPreview = (themeName: string) => {
        const theme = defaultThemes[themeName];
        if (!theme) return null;

        return (
            <div className="flex gap-1 ml-2">
                {[theme.primary, theme.secondary, theme.bubbleUser, theme.bubbleAgent].map((color, index) => (
                    <div
                        // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
                        key={index}
                        className="w-2 h-2 rounded-full border border-gray-300"
                        style={{ backgroundColor: color }}
                    />
                ))}
            </div>
        );
    };

    const handleThemeChange = (themeName: string) => {
        setGlobalTheme(themeName);
        setLastSaved(themeName);

        // Auto-clear the saved indicator after 2 seconds
        setTimeout(() => {
            setLastSaved(null);
        }, 2000);
    };

    const totalThemes = Object.keys(defaultThemes).length;
    const activeThemesCount = Object.keys(chatThemes).length;

    return (
        <>
            <SidebarSection title="🎨 Theme Presets">
                {/* Theme Status */}
                <div className="px-2 py-1 text-xs text-gray-500 border-b border-gray-200 mb-2">
                    <div className="flex justify-between items-center">
                        <span>{totalThemes} presets available</span>
                        <span>{activeThemesCount} active themes</span>
                    </div>
                </div>

                {/* Available Themes */}
                {Object.keys(defaultThemes).map((themeName) => {
                    const isActive = currentTheme === themeName;
                    const wasRecentlySaved = lastSaved === themeName;

                    return (
                        <SidebarItem
                            key={themeName}
                            icon={
                                <div className="flex items-center gap-1">
                                    {isActive ? (
                                        <Check className="h-4 w-4 text-green-600" aria-hidden="true" />
                                    ) : wasRecentlySaved ? (
                                        <Save className="h-4 w-4 text-blue-600" aria-hidden="true" />
                                    ) : (
                                        <Palette className="h-4 w-4" aria-hidden="true" />
                                    )}
                                </div>
                            }
                            collapsedIcon={
                                <div className="flex items-center">
                                    {isActive ? (
                                        <Check className="h-4 w-4 text-green-600" aria-hidden="true" />
                                    ) : (
                                        <Palette className="h-4 w-4" aria-hidden="true" />
                                    )}
                                </div>
                            }
                            isActive={isActive}
                            onClick={() => handleThemeChange(themeName)}
                            className="relative"
                        >
                            <div className="flex items-center justify-between w-full">
                                <span className="font-medium">
                                    {getThemeDisplayName(themeName)}
                                </span>
                                {getThemeColorPreview(themeName)}
                            </div>
                            {isActive && (
                                <div className="text-xs text-green-600 mt-1">
                                    Currently active
                                </div>
                            )}
                            {wasRecentlySaved && !isActive && (
                                <div className="text-xs text-blue-600 mt-1">
                                    Recently applied
                                </div>
                            )}
                        </SidebarItem>
                    );
                })}
            </SidebarSection>

            <SidebarSection title="🔧 Theme Tools">
                <SidebarItem
                    icon={<Paintbrush className="h-4 w-4" aria-hidden="true" />}
                    collapsedIcon={<Paintbrush className="h-4 w-4" aria-hidden="true" />}
                    onClick={() => {
                        // Navigate to theme builder
                        window.open('/theme-test', '_blank');
                    }}
                >
                    <div className="flex flex-col">
                        <span className="font-medium">Theme Builder</span>
                        <span className="text-xs text-gray-500">
                            Create custom themes
                        </span>
                    </div>
                </SidebarItem>

                {/* Service Status Indicator */}
                <div className="px-2 py-2 mt-2 border-t border-gray-200">
                    <div className="text-xs space-y-1">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full" />
                            <span className="text-gray-600">ThemesService Active</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-blue-500 rounded-full" />
                            <span className="text-gray-600">Auto-save Enabled</span>
                        </div>
                        <div className="text-gray-500 text-xs mt-1">
                            Changes persist across sessions
                        </div>
                    </div>
                </div>
            </SidebarSection>
        </>
    );
} 