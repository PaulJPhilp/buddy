/**
 * @file Example usage of useChatInstance hook
 * @module hooks/chat-instance/example
 */

import { useChatInstance } from "./useChatInstance";

// Example component showing how to use the new hook
export function ChatInstanceExample() {
    const agentConfig = {
        agentId: "example-agent",
        initialAgentName: "Example Agent",
    };

    const { chatState, runtimeError, dispatchAction } = useChatInstanceV2(
        "example-chat",
        agentConfig
    );

    const handleSendMessage = () => {
        dispatchAction({
            _tag: "sendMessage",
            text: "Hello from the new architecture!",
            chatId: "example-chat",
        });
    };

    return (
        <div className="chat-instance-example">
            <h2>Chat Instance V2 Example</h2>

            <div className="chat-status">
                <p><strong>Status:</strong> {chatState.status}</p>
                <p><strong>Agent:</strong> {chatState.agentName}</p>
                <p><strong>Chat ID:</strong> {chatState.chatId}</p>
                <p><strong>Typing:</strong> {chatState.isTyping ? "Yes" : "No"}</p>
                {chatState.error && (
                    <p className="error"><strong>Error:</strong> {chatState.error}</p>
                )}
                {runtimeError && (
                    <p className="runtime-error">
                        <strong>Runtime Error:</strong> {runtimeError.message}
                    </p>
                )}
            </div>

            <div className="messages">
                <h3>Messages ({chatState.messages.length})</h3>
                {chatState.messages.map((message, index) => (
                    <div key={message.id || index} className="message">
                        <strong>{message.role}:</strong> {message.text}
                        {message.metadata?.streaming && <em> (streaming...)</em>}
                    </div>
                ))}
            </div>
            <div className="actions">
                <button 
                    type="button"
                    onClick={handleSendMessage} 
                    disabled={chatState.status !== "connected"}
                >
                    Send Test Message
                </button>
            </div>

            <div className="architecture-info">
                <h3>Architecture Benefits</h3>
                <ul>
                    <li>✅ Event-driven state management with xState/store</li>
                    <li>✅ Pure business logic with Effect.js services</li>
                    <li>✅ Clean separation of concerns</li>
                    <li>✅ Type-safe throughout</li>
                    <li>✅ Comprehensive error handling</li>
                    <li>✅ Proper resource management</li>
                    <li>✅ Testable and maintainable</li>
                </ul>
            </div>
        </div>
    );
}

// Example of how to use with custom layer for testing
export function ChatInstanceExampleWithMocks() {
    // In a real test, you would provide a mock layer here
    // const mockLayer = Layer.merge(MockChatRuntimeService, MockMdxService);

    const agentConfig = {
        agentId: "test-agent",
        initialAgentName: "Test Agent",
    };

    const { chatState, runtimeError, dispatchAction } = useChatInstanceV2(
        "test-chat",
        agentConfig
        // mockLayer // Would pass mock layer for testing
    );

    return (
        <div className="chat-instance-test-example">
            <h2>Chat Instance V2 with Mocks (for testing)</h2>
            <p>This example shows how to use the hook with dependency injection for testing.</p>
            <p>Status: {chatState.status}</p>
        </div>
    );
} 