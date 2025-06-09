import type { LogLevel, LogSource } from "@/stores/debugToolStore";
import { createLog, createPerformanceMetric, debugToolStore } from "@/stores/debugToolStore";
import type { ErrorCategory, ErrorSeverity } from "@/stores/errorManagerStore";
import { createError, errorManagerStore } from "@/stores/errorManagerStore";

/**
 * Utility service for integrating with the Error Manager and Debug Tool
 * Provides convenient methods for reporting errors and logging debug information
 */
export class ToolsIntegrationService {
    /**
     * Report an error to the Error Manager
     */
    static reportError(
        message: string,
        severity: ErrorSeverity = 'medium',
        category: ErrorCategory = 'runtime',
        source?: string,
        stack?: string,
        metadata?: Record<string, unknown>
    ) {
        const error = createError[category](message, source, metadata);
        errorManagerStore.send({
            type: 'addError',
            error: {
                ...error,
                severity,
                stack,
            },
        });
    }

    /**
     * Report a network error
     */
    static reportNetworkError(
        message: string,
        url?: string,
        status?: number,
        metadata?: Record<string, unknown>
    ) {
        this.reportError(
            message,
            'medium',
            'network',
            url,
            undefined,
            { status, ...metadata }
        );
    }

    /**
     * Report a validation error
     */
    static reportValidationError(
        message: string,
        field?: string,
        value?: unknown,
        source?: string
    ) {
        this.reportError(
            message,
            'low',
            'validation',
            source,
            undefined,
            { field, value }
        );
    }

    /**
     * Report a critical system error
     */
    static reportCriticalError(
        message: string,
        source?: string,
        stack?: string,
        metadata?: Record<string, unknown>
    ) {
        this.reportError(
            message,
            'critical',
            'system',
            source,
            stack,
            metadata
        );
    }

    /**
     * Report an authentication error
     */
    static reportAuthError(
        message: string,
        userId?: string,
        action?: string,
        metadata?: Record<string, unknown>
    ) {
        this.reportError(
            message,
            'medium',
            'auth',
            action,
            undefined,
            { userId, ...metadata }
        );
    }

    /**
     * Log a debug message
     */
    static logDebug(
        message: string,
        source: LogSource = 'client',
        metadata?: Record<string, unknown>,
        module?: string,
        method?: string
    ) {
        const log = createLog.debug(message, source, metadata, module, method);
        debugToolStore.send({ type: 'addLog', log });
    }

    /**
     * Log an info message
     */
    static logInfo(
        message: string,
        source: LogSource = 'client',
        metadata?: Record<string, unknown>,
        module?: string,
        method?: string
    ) {
        const log = createLog.info(message, source, metadata, module, method);
        debugToolStore.send({ type: 'addLog', log });
    }

    /**
     * Log a warning message
     */
    static logWarning(
        message: string,
        source: LogSource = 'client',
        metadata?: Record<string, unknown>,
        module?: string,
        method?: string
    ) {
        const log = createLog.warn(message, source, metadata, module, method);
        debugToolStore.send({ type: 'addLog', log });
    }

    /**
     * Log an error message
     */
    static logError(
        message: string,
        source: LogSource = 'client',
        stack?: string,
        metadata?: Record<string, unknown>,
        module?: string,
        method?: string
    ) {
        const log = createLog.error(message, source, stack, metadata, module, method);
        debugToolStore.send({ type: 'addLog', log });
    }

    /**
     * Record a performance metric
     */
    static recordPerformance(
        name: string,
        duration: number,
        metadata?: Record<string, unknown>
    ) {
        const metric = createPerformanceMetric(name, duration, metadata);
        debugToolStore.send({ type: 'addPerformanceMetric', metric });
    }

    /**
     * Measure and record the performance of a function
     */
    static async measurePerformance<T>(
        name: string,
        fn: () => Promise<T> | T,
        metadata?: Record<string, unknown>
    ): Promise<T> {
        const startTime = performance.now();
        try {
            const result = await fn();
            const duration = performance.now() - startTime;
            this.recordPerformance(name, duration, { success: true, ...metadata });
            return result;
        } catch (error) {
            const duration = performance.now() - startTime;
            this.recordPerformance(name, duration, {
                success: false,
                error: error instanceof Error ? error.message : String(error),
                ...metadata
            });
            throw error;
        }
    }

    /**
     * Create a performance timer
     */
    static createTimer(name: string, metadata?: Record<string, unknown>) {
        const startTime = performance.now();
        return {
            stop: () => {
                const duration = performance.now() - startTime;
                this.recordPerformance(name, duration, metadata);
                return duration;
            },
        };
    }

    /**
     * Log a component lifecycle event
     */
    static logComponentEvent(
        componentName: string,
        event: 'mount' | 'unmount' | 'update' | 'error',
        metadata?: Record<string, unknown>
    ) {
        this.logDebug(
            `Component ${event}: ${componentName}`,
            'component',
            metadata,
            componentName,
            event
        );
    }

    /**
     * Log a store action
     */
    static logStoreAction(
        storeName: string,
        action: string,
        metadata?: Record<string, unknown>
    ) {
        this.logDebug(
            `Store action: ${storeName}.${action}`,
            'store',
            metadata,
            storeName,
            action
        );
    }

    /**
     * Log an Effect.js operation
     */
    static logEffectOperation(
        operation: string,
        status: 'start' | 'success' | 'error',
        metadata?: Record<string, unknown>
    ) {
        const level: LogLevel = status === 'error' ? 'error' : 'debug';
        const message = `Effect operation ${operation}: ${status}`;

        if (level === 'error') {
            this.logError(message, 'effect', undefined, metadata, 'Effect', operation);
        } else {
            this.logDebug(message, 'effect', metadata, 'Effect', operation);
        }
    }

    /**
     * Log a WebSocket event
     */
    static logWebSocketEvent(
        event: 'connect' | 'disconnect' | 'message' | 'error',
        metadata?: Record<string, unknown>
    ) {
        const level: LogLevel = event === 'error' ? 'error' : 'info';
        const message = `WebSocket ${event}`;

        if (level === 'error') {
            this.logError(message, 'websocket', undefined, metadata, 'WebSocket', event);
        } else {
            this.logInfo(message, 'websocket', metadata, 'WebSocket', event);
        }
    }

    /**
     * Log an agent communication event
     */
    static logAgentEvent(
        event: 'session_start' | 'session_end' | 'message_sent' | 'message_received' | 'stream_start' | 'stream_end' | 'error',
        agentId?: string,
        metadata?: Record<string, unknown>
    ) {
        const level: LogLevel = event === 'error' ? 'error' : 'info';
        const message = `Agent ${event}${agentId ? ` (${agentId})` : ''}`;

        if (level === 'error') {
            this.logError(message, 'agent', undefined, { agentId, ...metadata }, 'Agent', event);
        } else {
            this.logInfo(message, 'agent', { agentId, ...metadata }, 'Agent', event);
        }
    }

    /**
     * Wrap a function with automatic error reporting and performance tracking
     */
    static withErrorAndPerformanceTracking<T extends (...args: any[]) => any>(
        fn: T,
        name: string,
        source: LogSource = 'client',
        module?: string
    ): T {
        return ((...args: Parameters<T>) => {
            const timer = this.createTimer(`${name}_performance`);

            try {
                this.logDebug(`Starting ${name}`, source, { args }, module, name);
                const result = fn(...args);

                if (result instanceof Promise) {
                    return result
                        .then((value) => {
                            timer.stop();
                            this.logDebug(`Completed ${name}`, source, { result: value }, module, name);
                            return value;
                        })
                        .catch((error) => {
                            timer.stop();
                            this.reportError(
                                `Error in ${name}: ${error.message}`,
                                'high',
                                'runtime',
                                module,
                                error.stack,
                                { args, error: error.message }
                            );
                            this.logError(
                                `Error in ${name}`,
                                source,
                                error.stack,
                                { args, error: error.message },
                                module,
                                name
                            );
                            throw error;
                        });
                } else {
                    timer.stop();
                    this.logDebug(`Completed ${name}`, source, { result }, module, name);
                    return result;
                }
            } catch (error) {
                timer.stop();
                this.reportError(
                    `Error in ${name}: ${error instanceof Error ? error.message : String(error)}`,
                    'high',
                    'runtime',
                    module,
                    error instanceof Error ? error.stack : undefined,
                    { args, error: error instanceof Error ? error.message : String(error) }
                );
                this.logError(
                    `Error in ${name}`,
                    source,
                    error instanceof Error ? error.stack : undefined,
                    { args, error: error instanceof Error ? error.message : String(error) },
                    module,
                    name
                );
                throw error;
            }
        }) as T;
    }
}

// Export convenience functions
export const {
    reportError,
    reportNetworkError,
    reportValidationError,
    reportCriticalError,
    reportAuthError,
    logDebug,
    logInfo,
    logWarning,
    logError,
    recordPerformance,
    measurePerformance,
    createTimer,
    logComponentEvent,
    logStoreAction,
    logEffectOperation,
    logWebSocketEvent,
    logAgentEvent,
    withErrorAndPerformanceTracking,
} = ToolsIntegrationService; 