import { ToolbarConfig, isCommand } from "@/components/toolbar/types"
import { appLayoutStore } from "@/stores/appLayoutStore"
import { clerkAdminStore } from "@/stores/clerkAdminStore"
import { debugToolStore } from "@/stores/debugToolStore"
import { errorManagerStore } from "@/stores/errorManagerStore"
import { sidebarToolStore } from "@/stores/sidebarToolStore"
import { themeStore } from "@/stores/themeStore"
import { useSelector } from "@xstate/store/react"
import { useMemo } from "react"

/**
 * Hook that creates a dynamic toolbar configuration with active states
 * synchronized to store state
 */
export function useDynamicToolbar(baseConfig: ToolbarConfig): ToolbarConfig {
    // Use useSelector consistently for all stores to ensure reactivity
    const isSidebarOpen = useSelector(appLayoutStore, (state) => state.context.isSidebarOpen)
    const themeEditorIsOpen = useSelector(themeStore, (state) => state.context.isEditorOpen)
    const clerkAdminPanelIsOpen = useSelector(clerkAdminStore, (state) => state.context.isPanelOpen)
    const sidebarToolIsOpen = useSelector(sidebarToolStore, (state) => state.context.isOpen)
    const errorManagerIsOpen = useSelector(errorManagerStore, (state) => state.context.isOpen)
    const debugToolIsOpen = useSelector(debugToolStore, (state) => state.context.isOpen)

    const dynamicConfig = useMemo((): ToolbarConfig => {
        const updatedItems = baseConfig.items.map((item) => {
            if (!isCommand(item)) {
                return item
            }

            // Update active states based on store state
            switch (item.id) {
                case 'toggle-sidebar':
                    return { ...item, active: isSidebarOpen }

                case 'toggle-sidebar-tool':
                    return { ...item, active: sidebarToolIsOpen }

                case 'toggle-theme-editor':
                    return { ...item, active: themeEditorIsOpen }

                case 'toggle-clerk-admin':
                    return { ...item, active: clerkAdminPanelIsOpen }

                case 'toggle-error-manager':
                    return { ...item, active: errorManagerIsOpen }

                case 'toggle-debug-tool':
                    return { ...item, active: debugToolIsOpen }

                default:
                    // Keep original item unchanged
                    return item
            }
        })

        return {
            ...baseConfig,
            items: updatedItems,
        }
    }, [
        baseConfig,
        isSidebarOpen,
        sidebarToolIsOpen,
        themeEditorIsOpen,
        clerkAdminPanelIsOpen,
        errorManagerIsOpen,
        debugToolIsOpen,
    ])

    return dynamicConfig
} 