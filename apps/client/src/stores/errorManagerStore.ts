import { createStore } from "@xstate/store";
import { useStore } from "@xstate/store/react";

// Error severity levels
export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

// Error categories
export type ErrorCategory = 'network' | 'validation' | 'runtime' | 'auth' | 'system' | 'user';

// Error entry interface
export interface ErrorEntry {
    readonly id: string;
    readonly timestamp: number;
    readonly message: string;
    readonly severity: ErrorSeverity;
    readonly category: ErrorCategory;
    readonly source?: string;
    readonly stack?: string;
    readonly metadata?: Record<string, unknown>;
    readonly resolved: boolean;
    readonly resolvedAt?: number;
    readonly resolvedBy?: string;
}

// Error manager state interface
interface ErrorManagerState {
    readonly isOpen: boolean;
    readonly activeTab: 'all' | 'unresolved' | 'critical' | 'recent';
    readonly errors: readonly ErrorEntry[];
    readonly selectedErrorId: string | null;
    readonly filterSeverity: ErrorSeverity | 'all';
    readonly filterCategory: ErrorCategory | 'all';
    readonly searchQuery: string;
    readonly autoResolveEnabled: boolean;
    readonly notificationsEnabled: boolean;
    readonly maxErrors: number;
}

// Initial state
const createInitialState = (): ErrorManagerState => ({
    isOpen: false,
    activeTab: 'unresolved',
    errors: [],
    selectedErrorId: null,
    filterSeverity: 'all',
    filterCategory: 'all',
    searchQuery: '',
    autoResolveEnabled: true,
    notificationsEnabled: true,
    maxErrors: 1000,
});

// Error Manager Store
export const errorManagerStore = createStore({
    context: createInitialState(),
    on: {
        open: (context) => ({
            ...context,
            isOpen: true,
        }),

        close: (context) => ({
            ...context,
            isOpen: false,
            selectedErrorId: null,
        }),

        toggle: (context) => ({
            ...context,
            isOpen: !context.isOpen,
            selectedErrorId: context.isOpen ? null : context.selectedErrorId,
        }),

        setActiveTab: (context, event: { tab: ErrorManagerState['activeTab'] }) => ({
            ...context,
            activeTab: event.tab,
            selectedErrorId: null,
        }),

        addError: (context, event: { error: Omit<ErrorEntry, 'id' | 'timestamp' | 'resolved'> }) => {
            const newError: ErrorEntry = {
                ...event.error,
                id: `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                timestamp: Date.now(),
                resolved: false,
            };

            const updatedErrors = [newError, ...context.errors];

            // Trim to max errors if needed
            const trimmedErrors = updatedErrors.length > context.maxErrors
                ? updatedErrors.slice(0, context.maxErrors)
                : updatedErrors;

            return {
                ...context,
                errors: trimmedErrors,
            };
        },

        resolveError: (context, event: { errorId: string; resolvedBy?: string }) => ({
            ...context,
            errors: context.errors.map(error =>
                error.id === event.errorId
                    ? {
                        ...error,
                        resolved: true,
                        resolvedAt: Date.now(),
                        resolvedBy: event.resolvedBy,
                    }
                    : error
            ),
        }),

        resolveAllErrors: (context, event: { resolvedBy?: string }) => ({
            ...context,
            errors: context.errors.map(error => ({
                ...error,
                resolved: true,
                resolvedAt: Date.now(),
                resolvedBy: event.resolvedBy,
            })),
        }),

        deleteError: (context, event: { errorId: string }) => ({
            ...context,
            errors: context.errors.filter(error => error.id !== event.errorId),
            selectedErrorId: context.selectedErrorId === event.errorId ? null : context.selectedErrorId,
        }),

        clearAllErrors: (context) => ({
            ...context,
            errors: [],
            selectedErrorId: null,
        }),

        selectError: (context, event: { errorId: string | null }) => ({
            ...context,
            selectedErrorId: event.errorId,
        }),

        setFilterSeverity: (context, event: { severity: ErrorManagerState['filterSeverity'] }) => ({
            ...context,
            filterSeverity: event.severity,
        }),

        setFilterCategory: (context, event: { category: ErrorManagerState['filterCategory'] }) => ({
            ...context,
            filterCategory: event.category,
        }),

        setSearchQuery: (context, event: { query: string }) => ({
            ...context,
            searchQuery: event.query,
        }),

        toggleAutoResolve: (context) => ({
            ...context,
            autoResolveEnabled: !context.autoResolveEnabled,
        }),

        toggleNotifications: (context) => ({
            ...context,
            notificationsEnabled: !context.notificationsEnabled,
        }),

        setMaxErrors: (context, event: { maxErrors: number }) => ({
            ...context,
            maxErrors: event.maxErrors,
            errors: context.errors.slice(0, event.maxErrors),
        }),
    },
});

// Hook for using the error manager store
export function useErrorManagerStore() {
    const store = useStore(errorManagerStore);
    return store.context || createInitialState();
}

// Selectors
export const errorManagerSelectors = {
    getState: (state: ErrorManagerState) => state,
    getErrors: (state: ErrorManagerState) => state.errors,
    getUnresolvedErrors: (state: ErrorManagerState) =>
        state.errors.filter(error => !error.resolved),
    getCriticalErrors: (state: ErrorManagerState) =>
        state.errors.filter(error => error.severity === 'critical'),
    getRecentErrors: (state: ErrorManagerState) =>
        state.errors.filter(error => Date.now() - error.timestamp < 24 * 60 * 60 * 1000), // Last 24 hours
    getSelectedError: (state: ErrorManagerState) =>
        state.selectedErrorId ? state.errors.find(error => error.id === state.selectedErrorId) : null,
    getFilteredErrors: (state: ErrorManagerState) => {
        let filtered = state.errors;

        // Apply severity filter
        if (state.filterSeverity !== 'all') {
            filtered = filtered.filter(error => error.severity === state.filterSeverity);
        }

        // Apply category filter
        if (state.filterCategory !== 'all') {
            filtered = filtered.filter(error => error.category === state.filterCategory);
        }

        // Apply search query
        if (state.searchQuery.trim()) {
            const query = state.searchQuery.toLowerCase();
            filtered = filtered.filter(error =>
                error.message.toLowerCase().includes(query) ||
                error.source?.toLowerCase().includes(query) ||
                error.category.toLowerCase().includes(query)
            );
        }

        // Apply tab filter
        switch (state.activeTab) {
            case 'unresolved':
                filtered = filtered.filter(error => !error.resolved);
                break;
            case 'critical':
                filtered = filtered.filter(error => error.severity === 'critical');
                break;
            case 'recent':
                filtered = filtered.filter(error => Date.now() - error.timestamp < 24 * 60 * 60 * 1000);
                break;
            case 'all':
            default:
                // No additional filtering
                break;
        }

        return filtered;
    },
};

// Helper functions for creating errors
export const createError = {
    network: (message: string, metadata?: Record<string, unknown>): Omit<ErrorEntry, 'id' | 'timestamp' | 'resolved'> => ({
        message,
        severity: 'medium',
        category: 'network',
        metadata,
    }),

    validation: (message: string, source?: string, metadata?: Record<string, unknown>): Omit<ErrorEntry, 'id' | 'timestamp' | 'resolved'> => ({
        message,
        severity: 'low',
        category: 'validation',
        source,
        metadata,
    }),

    runtime: (message: string, stack?: string, metadata?: Record<string, unknown>): Omit<ErrorEntry, 'id' | 'timestamp' | 'resolved'> => ({
        message,
        severity: 'high',
        category: 'runtime',
        stack,
        metadata,
    }),

    critical: (message: string, source?: string, stack?: string, metadata?: Record<string, unknown>): Omit<ErrorEntry, 'id' | 'timestamp' | 'resolved'> => ({
        message,
        severity: 'critical',
        category: 'system',
        source,
        stack,
        metadata,
    }),

    auth: (message: string, metadata?: Record<string, unknown>): Omit<ErrorEntry, 'id' | 'timestamp' | 'resolved'> => ({
        message,
        severity: 'medium',
        category: 'auth',
        metadata,
    }),

    user: (message: string, source?: string, metadata?: Record<string, unknown>): Omit<ErrorEntry, 'id' | 'timestamp' | 'resolved'> => ({
        message,
        severity: 'low',
        category: 'user',
        source,
        metadata,
    }),
}; 