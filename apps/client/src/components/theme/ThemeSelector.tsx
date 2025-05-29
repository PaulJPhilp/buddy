"use client";

import { useTheme } from "@/contexts/ThemeContext";
import { SidebarItem, SidebarSection } from "@ui/components/ui/sidebar";
import dynamic from "next/dynamic";

// Dynamically import icons to prevent hydration mismatches
const Paintbrush = dynamic(() => import("lucide-react").then((mod) => ({ default: mod.Paintbrush })), {
    ssr: false,
    loading: () => <div className="h-4 w-4" />,
});

const Palette = dynamic(() => import("lucide-react").then((mod) => ({ default: mod.Palette })), {
    ssr: false,
    loading: () => <div className="h-4 w-4" />,
});

export function ThemeSelector() {
    const {
        currentTheme,
        isCustomMode,
        defaultThemes,
        handlePresetTheme,
        handleCustomMode,
    } = useTheme();

    return (
        <SidebarSection title="🎨 Themes">
            {/* Preset Themes */}
            {Object.keys(defaultThemes).map((themeName) => (
                <SidebarItem
                    key={themeName}
                    icon={<Palette className="h-4 w-4" aria-hidden="true" />}
                    collapsedIcon={<Palette className="h-4 w-4" aria-hidden="true" />}
                    isActive={currentTheme === themeName && !isCustomMode}
                    onClick={() => handlePresetTheme(themeName)}
                    className="capitalize"
                >
                    {themeName}
                </SidebarItem>
            ))}

            {/* Custom Theme */}
            <SidebarItem
                icon={<Paintbrush className="h-4 w-4" aria-hidden="true" />}
                collapsedIcon={<Paintbrush className="h-4 w-4" aria-hidden="true" />}
                isActive={isCustomMode}
                onClick={handleCustomMode}
            >
                Custom Theme
            </SidebarItem>
        </SidebarSection>
    );
} 