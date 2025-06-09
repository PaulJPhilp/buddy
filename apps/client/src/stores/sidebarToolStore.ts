import { createStore } from "@xstate/store"
import { useStore } from "@xstate/store/react"

// Sidebar tool store state interface
interface SidebarToolState {
    readonly isOpen: boolean
    readonly activeTab: 'controls' | 'layout' | 'preview'
    readonly previewMode: 'desktop' | 'tablet' | 'mobile'
}

// Initial state factory
const createInitialState = (): SidebarToolState => ({
    isOpen: false,
    activeTab: 'controls',
    previewMode: 'desktop',
})

// Sidebar tool store
export const sidebarToolStore = createStore({
    context: createInitialState(),
    on: {
        open: (context) => ({
            ...context,
            isOpen: true,
        }),

        close: (context) => ({
            ...context,
            isOpen: false,
        }),

        toggle: (context) => ({
            ...context,
            isOpen: !context.isOpen,
        }),

        setActiveTab: (context, event: { tab: SidebarToolState['activeTab'] }) => ({
            ...context,
            activeTab: event.tab,
        }),

        setPreviewMode: (context, event: { mode: SidebarToolState['previewMode'] }) => ({
            ...context,
            previewMode: event.mode,
        }),
    }
})

// Hook for using the sidebar tool store
export function useSidebarToolStore() {
    const store = useStore(sidebarToolStore)
    return store.context || createInitialState()
} 