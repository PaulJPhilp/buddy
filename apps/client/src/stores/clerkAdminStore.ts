import { createStore } from "@xstate/store"
import { useStore } from "@xstate/store/react"

// Clerk admin store state interface
interface ClerkAdminState {
    readonly isOpen: boolean
    readonly isPanelOpen: boolean
    readonly activeTab: 'users' | 'sessions' | 'organizations' | 'settings'
    readonly isLoading: boolean
    readonly error: string | null
}

// Initial state factory
const createInitialState = (): ClerkAdminState => ({
    isOpen: false,
    isPanelOpen: false,
    activeTab: 'users',
    isLoading: false,
    error: null,
})

// Clerk admin store
export const clerkAdminStore = createStore({
    context: createInitialState(),
    on: {
        togglePanel: (context) => ({
            ...context,
            isOpen: !context.isOpen,
            isPanelOpen: !context.isPanelOpen,
        }),

        openPanel: (context) => ({
            ...context,
            isOpen: true,
            isPanelOpen: true,
        }),

        closePanel: (context) => ({
            ...context,
            isOpen: false,
            isPanelOpen: false,
        }),

        close: (context) => ({
            ...context,
            isOpen: false,
            isPanelOpen: false,
        }),

        setActiveTab: (context, event: { tab: ClerkAdminState['activeTab'] }) => ({
            ...context,
            activeTab: event.tab,
        }),

        setLoading: (context, event: { isLoading: boolean }) => ({
            ...context,
            isLoading: event.isLoading,
        }),

        setError: (context, event: { error: string | null }) => ({
            ...context,
            error: event.error,
        }),

        clearError: (context) => ({
            ...context,
            error: null,
        }),
    }
})

// Hook for components to use clerk admin store
export function useClerkAdminStore() {
    const store = useStore(clerkAdminStore)
    return store.context || createInitialState()
}

// Hook for just panel state (most common use case)
export function useClerkAdminPanelState() {
    const store = useStore(clerkAdminStore)
    const state = store.context || createInitialState()
    return {
        isOpen: state.isOpen,
        isPanelOpen: state.isPanelOpen,
        activeTab: state.activeTab,
    }
} 