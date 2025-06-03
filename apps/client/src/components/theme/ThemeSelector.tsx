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
        setGlobalTheme,
        defaultThemes,
    } = useTheme();

    return (
        <SidebarSection title="🎨 Global Themes">
            {/* Available Themes */}
            {Object.keys(defaultThemes).map((themeName) => (
                <SidebarItem
                    key={themeName}
                    icon={<Palette className="h-4 w-4" aria-hidden="true" />}
                    collapsedIcon={<Palette className="h-4 w-4" aria-hidden="true" />}
                    isActive={currentTheme === themeName}
                    onClick={() => setGlobalTheme(themeName)}
                    className="capitalize"
                >
                    {themeName}
                </SidebarItem>
            ))}
        </SidebarSection>
    );
} 