import { createStore } from "@xstate/store";
import { useStore } from "@xstate/store/react";

// Log levels
export type LogLevel = "debug" | "info" | "warn" | "error";

// Log sources
export type LogSource =
    | "client"
    | "server"
    | "websocket"
    | "agent"
    | "effect"
    | "store"
    | "component"
    | "service";

// Log entry interface
export interface LogEntry {
    readonly id: string;
    readonly timestamp: number;
    readonly level: LogLevel;
    readonly source: LogSource;
    readonly message: string;
    readonly metadata?: Record<string, unknown>;
    readonly stack?: string;
    readonly module?: string;
    readonly method?: string;
}

// Performance metric interface
export interface PerformanceMetric {
    readonly id: string;
    readonly timestamp: number;
    readonly name: string;
    readonly duration: number;
    readonly metadata?: Record<string, unknown>;
}

// Debug tool state interface
interface DebugToolState {
    readonly isOpen: boolean;
    readonly activeTab: "logs" | "performance" | "state" | "network" | "settings";
    readonly logs: readonly LogEntry[];
    readonly performanceMetrics: readonly PerformanceMetric[];
    readonly selectedLogId: string | null;
    readonly filterLevel: LogLevel | "all";
    readonly filterSource: LogSource | "all";
    readonly searchQuery: string;
    readonly autoScroll: boolean;
    readonly maxLogs: number;
    readonly maxMetrics: number;
    readonly isRecording: boolean;
    readonly showTimestamps: boolean;
    readonly showMetadata: boolean;
    readonly logLevelColors: Record<LogLevel, string>;
}

// Initial state
const createInitialState = (): DebugToolState => ({
    isOpen: false,
    activeTab: "logs",
    logs: [],
    performanceMetrics: [],
    selectedLogId: null,
    filterLevel: "all",
    filterSource: "all",
    searchQuery: "",
    autoScroll: true,
    maxLogs: 5000,
    maxMetrics: 1000,
    isRecording: true,
    showTimestamps: true,
    showMetadata: false,
    logLevelColors: {
        debug: "#6b7280",
        info: "#3b82f6",
        warn: "#f59e0b",
        error: "#ef4444",
    },
});

// Debug Tool Store
export const debugToolStore = createStore({
    context: createInitialState(),
    on: {
        open: (context) => ({
            ...context,
            isOpen: true,
        }),

        close: (context) => ({
            ...context,
            isOpen: false,
            selectedLogId: null,
        }),

        toggle: (context) => ({
            ...context,
            isOpen: !context.isOpen,
            selectedLogId: context.isOpen ? null : context.selectedLogId,
        }),

        setActiveTab: (context, event: { tab: DebugToolState["activeTab"] }) => ({
            ...context,
            activeTab: event.tab,
            selectedLogId: null,
        }),

        addLog: (context, event: { log: Omit<LogEntry, "id" | "timestamp"> }) => {
            if (!context.isRecording) return context;

            const newLog: LogEntry = {
                ...event.log,
                id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                timestamp: Date.now(),
            };

            const updatedLogs = [newLog, ...context.logs];

            // Trim to max logs if needed
            const trimmedLogs =
                updatedLogs.length > context.maxLogs
                    ? updatedLogs.slice(0, context.maxLogs)
                    : updatedLogs;

            return {
                ...context,
                logs: trimmedLogs,
            };
        },

        addPerformanceMetric: (
            context,
            event: { metric: Omit<PerformanceMetric, "id" | "timestamp"> },
        ) => {
            if (!context.isRecording) return context;

            const newMetric: PerformanceMetric = {
                ...event.metric,
                id: `metric-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                timestamp: Date.now(),
            };

            const updatedMetrics = [newMetric, ...context.performanceMetrics];

            // Trim to max metrics if needed
            const trimmedMetrics =
                updatedMetrics.length > context.maxMetrics
                    ? updatedMetrics.slice(0, context.maxMetrics)
                    : updatedMetrics;

            return {
                ...context,
                performanceMetrics: trimmedMetrics,
            };
        },

        clearLogs: (context) => ({
            ...context,
            logs: [],
            selectedLogId: null,
        }),

        clearMetrics: (context) => ({
            ...context,
            performanceMetrics: [],
        }),

        clearAll: (context) => ({
            ...context,
            logs: [],
            performanceMetrics: [],
            selectedLogId: null,
        }),

        selectLog: (context, event: { logId: string | null }) => ({
            ...context,
            selectedLogId: event.logId,
        }),

        setFilterLevel: (
            context,
            event: { level: DebugToolState["filterLevel"] },
        ) => ({
            ...context,
            filterLevel: event.level,
        }),

        setFilterSource: (
            context,
            event: { source: DebugToolState["filterSource"] },
        ) => ({
            ...context,
            filterSource: event.source,
        }),

        setSearchQuery: (context, event: { query: string }) => ({
            ...context,
            searchQuery: event.query,
        }),

        toggleAutoScroll: (context) => ({
            ...context,
            autoScroll: !context.autoScroll,
        }),

        toggleRecording: (context) => ({
            ...context,
            isRecording: !context.isRecording,
        }),

        toggleTimestamps: (context) => ({
            ...context,
            showTimestamps: !context.showTimestamps,
        }),

        toggleMetadata: (context) => ({
            ...context,
            showMetadata: !context.showMetadata,
        }),

        setMaxLogs: (context, event: { maxLogs: number }) => ({
            ...context,
            maxLogs: event.maxLogs,
            logs: context.logs.slice(0, event.maxLogs),
        }),

        setMaxMetrics: (context, event: { maxMetrics: number }) => ({
            ...context,
            maxMetrics: event.maxMetrics,
            performanceMetrics: context.performanceMetrics.slice(0, event.maxMetrics),
        }),

        setLogLevelColor: (context, event: { level: LogLevel; color: string }) => ({
            ...context,
            logLevelColors: {
                ...context.logLevelColors,
                [event.level]: event.color,
            },
        }),
    },
});

// Hook for using the debug tool store
export function useDebugToolStore() {
    const store = useStore(debugToolStore);
    return store.context || createInitialState();
}

// Selectors
export const debugToolSelectors = {
    getState: (state: DebugToolState) => state,
    getLogs: (state: DebugToolState) => state.logs,
    getPerformanceMetrics: (state: DebugToolState) => state.performanceMetrics,
    getSelectedLog: (state: DebugToolState) =>
        state.selectedLogId
            ? state.logs.find((log) => log.id === state.selectedLogId)
            : null,
    getFilteredLogs: (state: DebugToolState) => {
        let filtered = state.logs;

        // Apply level filter
        if (state.filterLevel !== "all") {
            filtered = filtered.filter((log) => log.level === state.filterLevel);
        }

        // Apply source filter
        if (state.filterSource !== "all") {
            filtered = filtered.filter((log) => log.source === state.filterSource);
        }

        // Apply search query
        if (state.searchQuery.trim()) {
            const query = state.searchQuery.toLowerCase();
            filtered = filtered.filter(
                (log) =>
                    log.message.toLowerCase().includes(query) ||
                    log.module?.toLowerCase().includes(query) ||
                    log.method?.toLowerCase().includes(query) ||
                    log.source.toLowerCase().includes(query),
            );
        }

        return filtered;
    },
    getLogsByLevel: (state: DebugToolState) => {
        const counts = { debug: 0, info: 0, warn: 0, error: 0 };
        state.logs.forEach((log) => {
            counts[log.level]++;
        });
        return counts;
    },
    getLogsBySource: (state: DebugToolState) => {
        const counts: Record<LogSource, number> = {
            client: 0,
            server: 0,
            websocket: 0,
            agent: 0,
            effect: 0,
            store: 0,
            component: 0,
            service: 0,
        };
        state.logs.forEach((log) => {
            counts[log.source]++;
        });
        return counts;
    },
    getRecentLogs: (state: DebugToolState, minutes = 5) =>
        state.logs.filter(
            (log) => Date.now() - log.timestamp < minutes * 60 * 1000,
        ),
    getErrorLogs: (state: DebugToolState) =>
        state.logs.filter((log) => log.level === "error"),
    getWarningLogs: (state: DebugToolState) =>
        state.logs.filter((log) => log.level === "warn"),
    getAveragePerformance: (state: DebugToolState, metricName?: string) => {
        const metrics = metricName
            ? state.performanceMetrics.filter((m) => m.name === metricName)
            : state.performanceMetrics;

        if (metrics.length === 0) return 0;

        const total = metrics.reduce((sum, metric) => sum + metric.duration, 0);
        return total / metrics.length;
    },
};

// Helper functions for creating logs
export const createLog = {
    debug: (
        message: string,
        source: LogSource,
        metadata?: Record<string, unknown>,
        module?: string,
        method?: string,
    ): Omit<LogEntry, "id" | "timestamp"> => ({
        level: "debug",
        source,
        message,
        metadata,
        module,
        method,
    }),

    info: (
        message: string,
        source: LogSource,
        metadata?: Record<string, unknown>,
        module?: string,
        method?: string,
    ): Omit<LogEntry, "id" | "timestamp"> => ({
        level: "info",
        source,
        message,
        metadata,
        module,
        method,
    }),

    warn: (
        message: string,
        source: LogSource,
        metadata?: Record<string, unknown>,
        module?: string,
        method?: string,
    ): Omit<LogEntry, "id" | "timestamp"> => ({
        level: "warn",
        source,
        message,
        metadata,
        module,
        method,
    }),

    error: (
        message: string,
        source: LogSource,
        stack?: string,
        metadata?: Record<string, unknown>,
        module?: string,
        method?: string,
    ): Omit<LogEntry, "id" | "timestamp"> => ({
        level: "error",
        source,
        message,
        stack,
        metadata,
        module,
        method,
    }),
};

// Helper function for creating performance metrics
export const createPerformanceMetric = (
    name: string,
    duration: number,
    metadata?: Record<string, unknown>,
): Omit<PerformanceMetric, "id" | "timestamp"> => ({
    name,
    duration,
    metadata,
});