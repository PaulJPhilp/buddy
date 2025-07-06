"use client";

import * as Effect from "effect/Effect";
import * as Ref from "effect/Ref";
import * as React from "react";

// Message type for our demo
interface Message {
  id: string;
  text: string;
  sender: "user" | "agent";
  timestamp: number;
}

/**
 * A simple component to test Effect.js integration with React
 * This component demonstrates:
 * 1. Using Ref for state management
 * 2. Handling side effects with Effect
 * 3. Converting Effect-based state to React state
 */
export const EffectReactTest: React.FC = () => {
  // Use React state to manage UI values
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [text, setText] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);

  // Store refs in React state so we can access them throughout the component
  const [messagesRef] = React.useState(() => Ref.unsafeMake<Message[]>([]));
  const [textRef] = React.useState(() => Ref.unsafeMake(""));
  const [errorRef] = React.useState(() => Ref.unsafeMake<string | null>(null));

  // Sync refs with React state
  React.useEffect(() => {
    const subscription = setInterval(() => {
      const currentMessages = Effect.runSync(Ref.get(messagesRef));
      const currentText = Effect.runSync(Ref.get(textRef));
      const currentError = Effect.runSync(Ref.get(errorRef));

      setMessages(currentMessages);
      setText(currentText);
      setError(currentError);
    }, 100);

    return () => clearInterval(subscription);
  }, [messagesRef, textRef, errorRef]);

  // Effect-based actions
  const sendMessage = React.useCallback(
    (text: string) => {
      const sendEffect = Effect.gen(function* (_) {
        if (text.trim().length === 0) {
          yield* Ref.set(errorRef, "Message cannot be empty");
          return;
        }

        yield* Ref.set(errorRef, null);

        // Add user message
        const userMessage: Message = {
          id: `user-${Date.now()}`,
          text,
          sender: "user",
          timestamp: Date.now(),
        };

        yield* Ref.update(messagesRef, (msgs) => [...msgs, userMessage]);
        yield* Ref.set(textRef, "");

        // Simulate agent response after a delay
        yield* Effect.sleep("1 seconds");

        const agentMessage: Message = {
          id: `agent-${Date.now()}`,
          text: `You said: "${text}"`,
          sender: "agent",
          timestamp: Date.now(),
        };

        yield* Ref.update(messagesRef, (msgs) => [...msgs, agentMessage]);
      });

      Effect.runFork(sendEffect);
    },
    [messagesRef, textRef, errorRef],
  );

  const handleTextChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      Effect.runSync(Ref.set(textRef, e.target.value));
    },
    [textRef],
  );

  const handleSubmit = React.useCallback(() => {
    const currentText = Effect.runSync(Ref.get(textRef));
    sendMessage(currentText);
  }, [textRef, sendMessage]);

  return (
    <div className="flex flex-col p-4 border rounded-md max-w-md mx-auto my-4">
      <h2 className="text-lg font-semibold mb-2">
        Effect-React Integration Test
      </h2>

      {/* Message display area */}
      <div className="bg-gray-100 p-2 mb-2 min-h-[200px] overflow-y-auto">
        {messages.length === 0 ? (
          <p className="text-gray-500">No messages yet</p>
        ) : (
          <ul className="space-y-2">
            {messages.map((msg) => (
              <li
                key={msg.id}
                className={`p-2 rounded ${
                  msg.sender === "user" ? "bg-blue-100" : "bg-green-100"
                }`}
              >
                <div className="font-semibold">{msg.sender}</div>
                <div>{msg.text}</div>
                <div className="text-xs text-gray-500">
                  {new Date(msg.timestamp).toLocaleTimeString()}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Error display */}
      {error && (
        <div className="bg-red-100 text-red-700 p-2 mb-2 rounded">{error}</div>
      )}

      {/* Input area */}
      <div className="flex space-x-2">
        <input
          type="text"
          value={text}
          onChange={handleTextChange}
          className="flex-1 p-2 border rounded"
          placeholder="Type a message..."
        />
        <button
          type="button"
          onClick={handleSubmit}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Send
        </button>
      </div>

      {/* Status info */}
      <div className="mt-4 text-sm text-gray-500">
        <div>Message Count: {messages.length}</div>
      </div>
    </div>
  );
};
