import { appLayoutStore } from "@/stores/appLayoutStore"
import { clerkAdminStore } from "@/stores/clerkAdminStore"
import { debugToolStore } from "@/stores/debugToolStore"
import { errorManagerStore } from "@/stores/errorManagerStore"
import { sidebarToolStore } from "@/stores/sidebarToolStore"
import { themeStore } from "@/stores/themeStore"
import { AlertTriangle, Bug, Menu, Palette, Settings, Sidebar, Users } from "lucide-react"
import { ToolbarConfig } from "./types"

// Main toolbar configuration for AppShell
export const mainToolbarConfig: ToolbarConfig = {
    id: 'main-toolbar',
    position: 'top',
    variant: 'default',
    items: [
        // Sidebar toggle command
        {
            id: 'toggle-sidebar',
            label: 'Toggle Sidebar',
            icon: <Menu className="h-4 w-4" />,
            action: () => {
                console.log('Toggle sidebar clicked');
                appLayoutStore.send({ type: 'toggleSidebar' });
            },
            tooltip: 'Open/close sidebar',
            active: false, // Will be updated by store subscription
        },

        // Sidebar tool command
        {
            id: 'toggle-sidebar-tool',
            label: 'Sidebar Tool',
            icon: <Sidebar className="h-4 w-4" />,
            action: () => {
                console.log('Toggle sidebar tool clicked');
                sidebarToolStore.send({ type: 'toggle' });
            },
            tooltip: 'Open/close sidebar configuration tool',
            active: false, // Will be updated by store subscription
        },

        // Spacer to separate groups
        {
            id: 'spacer-1',
            type: 'spacer' as const,
        },

        // Theme editor toggle command
        {
            id: 'toggle-theme-editor',
            label: 'Theme Editor',
            icon: <Palette className="h-4 w-4" />,
            action: () => {
                console.log('Toggle theme editor clicked');
                themeStore.send({ type: 'toggleEditor' });
            },
            tooltip: 'Open/close theme editor',
            active: false, // Will be updated by store subscription
        },

        // Clerk admin panel toggle command
        {
            id: 'toggle-clerk-admin',
            label: 'User Management',
            icon: <Users className="h-4 w-4" />,
            action: () => {
                console.log('Toggle user management clicked');
                clerkAdminStore.send({ type: 'togglePanel' });
            },
            tooltip: 'Open/close user management panel',
            active: false, // Will be updated by store subscription
        },

        // Error manager toggle command
        {
            id: 'toggle-error-manager',
            label: 'Error Manager',
            icon: <AlertTriangle className="h-4 w-4" />,
            action: () => {
                console.log('Toggle error manager clicked');
                errorManagerStore.send({ type: 'toggle' });
            },
            tooltip: 'Open/close error manager',
            active: false, // Will be updated by store subscription
        },

        // Debug tool toggle command
        {
            id: 'toggle-debug-tool',
            label: 'Debug Tool',
            icon: <Bug className="h-4 w-4" />,
            action: () => {
                console.log('Toggle debug tool clicked');
                debugToolStore.send({ type: 'toggle' });
            },
            tooltip: 'Open/close debug tool',
            active: false, // Will be updated by store subscription
        },

        // Expandable spacer to push remaining items to the right
        {
            id: 'spacer-expand',
            type: 'spacer-expand' as const,
        },

        // Settings command (placeholder for future)
        {
            id: 'settings',
            label: 'Settings',
            icon: <Settings className="h-4 w-4" />,
            action: () => {
                console.log('Settings command executed')
                // TODO: Implement settings panel
            },
            tooltip: 'Open settings',
            variant: 'secondary' as const,
        },
    ],
}

// Compact toolbar for mobile/small screens
export const compactToolbarConfig: ToolbarConfig = {
    id: 'compact-toolbar',
    position: 'top',
    variant: 'compact',
    items: [
        {
            id: 'toggle-sidebar',
            label: 'Menu',
            icon: <Menu className="h-4 w-4" />,
            action: () => appLayoutStore.send({ type: 'toggleSidebar' }),
            tooltip: 'Toggle menu',
        },
        {
            id: 'spacer-expand',
            type: 'spacer-expand' as const,
        },
        {
            id: 'toggle-theme-editor',
            label: 'Theme',
            icon: <Palette className="h-4 w-4" />,
            action: () => themeStore.send({ type: 'toggleEditor' }),
            tooltip: 'Theme editor',
        },
    ],
}

// Helper function to get toolbar config based on screen size
export function getToolbarConfig(isMobile: boolean): ToolbarConfig {
    return isMobile ? compactToolbarConfig : mainToolbarConfig
} 