import { Effect, Ref } from "effect";
import * as React from "react";

import { InputAreaRenderer } from "@/services/InputAreaRenderer";

// Placeholder: Define how messages are sent to the backend
const sendMessage = (message: string) =>
  Effect.sync(() => console.log("Sending:", message));

type UIElement = React.ReactElement;

/**
 * Live implementation for the InputAreaRenderer service.
 */
export class LiveInputAreaRenderer implements InputAreaRenderer {
  constructor(private readonly inputRef: Ref.Ref<string>) {}

  render = Effect.sync(() => {
    // Read the current input value (synchronously within render)
    const currentInput = Effect.runSync(Ref.get(this.inputRef));

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      // Update the Ref (synchronously)
      Effect.runSync(Ref.set(this.inputRef, event.target.value));
    };

    const handleSend = () => {
      // Read the value from Ref synchronously
      const message = Effect.runSync(Ref.get(this.inputRef));
      if (message.trim()) {
        // Run the send message Effect (asynchronously)
        Effect.runFork(sendMessage(message));
        // Clear the input field
        Effect.runSync(Ref.set(this.inputRef, ""));
      }
    };

    const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault(); // Prevent default form submission/newline
        handleSend();
      }
    };

    return React.createElement(
      "div",
      {
        style: {
          display: "flex",
          padding: "1rem",
          borderTop: "1px solid #ccc",
        },
      },
      React.createElement("input", {
        type: "text",
        value: currentInput,
        onChange: handleInputChange,
        onKeyDown: handleKeyDown,
        style: { flexGrow: 1, marginRight: "0.5rem", padding: "0.5rem" },
        placeholder: "Type your message...",
      }),
      React.createElement(
        "button",
        {
          type: "button",
          onClick: handleSend,
          style: { padding: "0.5rem 1rem" },
        },
        "Send",
      ),
    );
  });
}

/**
 * Create a new instance of the LiveInputAreaRenderer service
 */
export const makeLiveInputAreaRenderer = Effect.gen(function* (_) {
  const inputRef = yield* Ref.make("");
  return new LiveInputAreaRenderer(inputRef);
});
