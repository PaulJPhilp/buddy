/**
 * Example usage of the Error Manager and Debug Tool
 * This file demonstrates how to integrate error reporting and debug logging
 * throughout your application.
 */

import { ToolsIntegrationService } from "@/utils/toolsIntegration";

// Example 1: Basic error reporting
export function exampleErrorReporting() {
    // Report different types of errors
    ToolsIntegrationService.reportNetworkError(
        "Failed to fetch user data",
        "/api/users/123",
        404,
        { userId: "123", retryCount: 3 }
    );

    ToolsIntegrationService.reportValidationError(
        "Email format is invalid",
        "email",
        "invalid-email",
        "UserForm"
    );

    ToolsIntegrationService.reportCriticalError(
        "Database connection lost",
        "DatabaseService",
        new Error().stack,
        { connectionId: "db-001", timestamp: Date.now() }
    );
}

// Example 2: Debug logging
export function exampleDebugLogging() {
    // Log different types of messages
    ToolsIntegrationService.logInfo(
        "User logged in successfully",
        "client",
        { userId: "user-123", sessionId: "session-456" },
        "AuthService",
        "login"
    );

    ToolsIntegrationService.logDebug(
        "Component rendered with new props",
        "component",
        { props: { id: 1, name: "Test" } },
        "UserCard",
        "render"
    );

    ToolsIntegrationService.logWarning(
        "API response took longer than expected",
        "client",
        { duration: 5000, endpoint: "/api/data" },
        "ApiService",
        "fetchData"
    );
}

// Example 3: Performance tracking
export async function examplePerformanceTracking() {
    // Manual performance recording
    const timer = ToolsIntegrationService.createTimer("data_processing");

    // Simulate some work
    await new Promise(resolve => setTimeout(resolve, 100));

    timer.stop(); // Automatically records the metric

    // Automatic performance measurement
    const result = await ToolsIntegrationService.measurePerformance(
        "api_call",
        async () => {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 200));
            return { data: "example" };
        },
        { endpoint: "/api/example" }
    );

    console.log("API result:", result);
}

// Example 4: Function wrapping with automatic tracking
export const exampleFunctionWrapping = ToolsIntegrationService.withErrorAndPerformanceTracking(
    async function processUserData(userId: string, data: any) {
        // This function will automatically:
        // - Log when it starts and completes
        // - Track performance metrics
        // - Report any errors that occur
        // - Include context in logs and errors

        if (!userId) {
            throw new Error("User ID is required");
        }

        // Simulate processing
        await new Promise(resolve => setTimeout(resolve, 50));

        return { processed: true, userId, data };
    },
    "processUserData",
    "service",
    "UserService"
);

// Example 5: Component lifecycle logging
export function exampleComponentLogging() {
    // Log component events
    ToolsIntegrationService.logComponentEvent(
        "UserProfile",
        "mount",
        { userId: "user-123", props: { editable: true } }
    );

    ToolsIntegrationService.logComponentEvent(
        "UserProfile",
        "update",
        { changedProps: ["name", "email"] }
    );

    ToolsIntegrationService.logComponentEvent(
        "UserProfile",
        "unmount",
        { duration: 5000 }
    );
}

// Example 6: Store action logging
export function exampleStoreLogging() {
    // Log store actions
    ToolsIntegrationService.logStoreAction(
        "userStore",
        "setUser",
        { userId: "user-123", action: "login" }
    );

    ToolsIntegrationService.logStoreAction(
        "chatStore",
        "addMessage",
        { messageId: "msg-456", type: "user" }
    );
}

// Example 7: Effect.js operation logging
export function exampleEffectLogging() {
    // Log Effect operations
    ToolsIntegrationService.logEffectOperation(
        "fetchUserData",
        "start",
        { userId: "user-123" }
    );

    ToolsIntegrationService.logEffectOperation(
        "fetchUserData",
        "success",
        { userId: "user-123", duration: 150 }
    );

    ToolsIntegrationService.logEffectOperation(
        "saveUserData",
        "error",
        { userId: "user-123", error: "Network timeout" }
    );
}

// Example 8: WebSocket event logging
export function exampleWebSocketLogging() {
    // Log WebSocket events
    ToolsIntegrationService.logWebSocketEvent(
        "connect",
        { url: "ws://localhost:3001", protocol: "chat" }
    );

    ToolsIntegrationService.logWebSocketEvent(
        "message",
        { type: "chat_message", size: 256 }
    );

    ToolsIntegrationService.logWebSocketEvent(
        "error",
        { error: "Connection lost", code: 1006 }
    );
}

// Example 9: Agent communication logging
export function exampleAgentLogging() {
    // Log agent events
    ToolsIntegrationService.logAgentEvent(
        "session_start",
        "agent-123",
        { chatId: "chat-456", model: "gpt-4" }
    );

    ToolsIntegrationService.logAgentEvent(
        "message_sent",
        "agent-123",
        { messageId: "msg-789", tokens: 150 }
    );

    ToolsIntegrationService.logAgentEvent(
        "stream_start",
        "agent-123",
        { streamId: "stream-001", expectedTokens: 500 }
    );
}

// Example 10: Error boundary integration
export function exampleErrorBoundaryIntegration(error: Error, errorInfo: any) {
    // Report React error boundary errors
    ToolsIntegrationService.reportCriticalError(
        `React Error Boundary: ${error.message}`,
        errorInfo.componentStack,
        error.stack,
        {
            errorBoundary: true,
            componentStack: errorInfo.componentStack,
            errorInfo
        }
    );
}

// Example 11: Async operation with comprehensive tracking
export async function exampleComprehensiveTracking() {
    try {
        // Start logging
        ToolsIntegrationService.logInfo(
            "Starting comprehensive operation",
            "service",
            { operation: "dataSync" },
            "DataSyncService",
            "syncData"
        );

        // Track performance
        const result = await ToolsIntegrationService.measurePerformance(
            "data_sync_operation",
            async () => {
                // Simulate multiple steps
                ToolsIntegrationService.logDebug("Step 1: Fetching data", "service");
                await new Promise(resolve => setTimeout(resolve, 100));

                ToolsIntegrationService.logDebug("Step 2: Processing data", "service");
                await new Promise(resolve => setTimeout(resolve, 150));

                ToolsIntegrationService.logDebug("Step 3: Saving data", "service");
                await new Promise(resolve => setTimeout(resolve, 75));

                return { synced: 100, errors: 0 };
            },
            { steps: 3, dataSize: "1MB" }
        );

        ToolsIntegrationService.logInfo(
            "Comprehensive operation completed",
            "service",
            { result },
            "DataSyncService",
            "syncData"
        );

        return result;
    } catch (error) {
        // Report the error
        ToolsIntegrationService.reportError(
            `Data sync failed: ${error instanceof Error ? error.message : String(error)}`,
            "high",
            "system",
            "DataSyncService",
            error instanceof Error ? error.stack : undefined,
            { operation: "dataSync", step: "unknown" }
        );

        throw error;
    }
}

// Export all examples for easy testing
export const examples = {
    errorReporting: exampleErrorReporting,
    debugLogging: exampleDebugLogging,
    performanceTracking: examplePerformanceTracking,
    functionWrapping: exampleFunctionWrapping,
    componentLogging: exampleComponentLogging,
    storeLogging: exampleStoreLogging,
    effectLogging: exampleEffectLogging,
    webSocketLogging: exampleWebSocketLogging,
    agentLogging: exampleAgentLogging,
    errorBoundaryIntegration: exampleErrorBoundaryIntegration,
    comprehensiveTracking: exampleComprehensiveTracking,
}; 