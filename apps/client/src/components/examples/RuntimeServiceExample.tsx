import { useChatRuntime } from "../../contexts/ChatRuntimeContext";

export function RuntimeServiceExample() {
  const runtime = useChatRuntime();

  const handleWebSocketConnect = async () => {
    // WebSocket service is now accessed directly through ChatRuntimeService
    console.log("WebSocket functionality available through ChatRuntimeService");
  };

  const handleChatSession = async () => {
    if (runtime.chatRuntime) {
      // Example of using the Chat Runtime service
      console.log("Chat Runtime service available");
      // You can now use runtime.chatRuntime.establishSession(), etc.
    }
  };

  return (
    <div className="p-4 border rounded-lg">
      <h3 className="text-lg font-semibold mb-4">Chat Runtime Service Example</h3>

      <div className="mb-4">
        <div className="font-medium">Status:</div>
        <div
          className={`px-2 py-1 rounded text-sm inline-block ${runtime.status === "ready"
            ? "bg-green-100 text-green-800"
            : runtime.status === "error"
              ? "bg-red-100 text-red-800"
              : "bg-blue-100 text-blue-800"
            }`}
        >
          {runtime.status}
        </div>
      </div>

      {runtime.status === "error" && (
        <div className="mb-4 p-2 bg-red-50 border border-red-200 rounded">
          <div className="font-medium text-red-800">Error:</div>
          <div className="text-red-600 text-sm">{String(runtime.error)}</div>
        </div>
      )}

      {runtime.chatRuntime && (
        <div className="space-y-2">
          <button
            type="button"
            onClick={handleWebSocketConnect}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Use WebSocket Service
          </button>

          <button
            type="button"
            onClick={handleChatSession}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 ml-2"
          >
            Use Chat Runtime Service
          </button>
        </div>
      )}
    </div>
  );
}
