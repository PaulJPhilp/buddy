import { Effect, Layer, Ref } from "effect"
import * as React from "react"

import { InputAreaRenderer } from "@/services/InputAreaRenderer"

// Placeholder: Define how messages are sent to the backend
// This would likely involve another service or Effect
const sendMessage = (message: string) =>
    Effect.sync(() => console.log("Sending:", message)) // Replace with actual send logic

type UIElement = React.ReactElement

/**
 * Live implementation for the InputAreaRenderer service.
 * Provides a simple text input and send button for the MVP.
 */
export const LiveInputAreaLayer = Layer.effect(
    InputAreaRenderer,
    // Use Layer.effect because we need Ref for state
    Effect.gen(function* () {
        // Local state for the input field value
        const inputRef = yield* Ref.make("")

        return InputAreaRenderer.of({
            render: Effect.sync(() => {
                // Read the current input value (synchronously within render)
                const currentInput = Ref.unsafeGet(inputRef) // Use unsafeGet for sync access in render

                const handleInputChange = (
                    event: React.ChangeEvent<HTMLInputElement>
                ) => {
                    // Update the Ref (synchronously)
                    Ref.unsafeSet(inputRef, event.target.value)
                    // Ideally, trigger a re-render if needed, depending on Effect/React bridge
                }

                const handleSend = () => {
                    // Read the value from Ref
                    const message = Ref.unsafeGet(inputRef)
                    if (message.trim()) {
                        // Run the send message Effect (asynchronously)
                        Effect.runFork(sendMessage(message))
                        // Clear the input field
                        Ref.unsafeSet(inputRef, "")
                        // Trigger re-render if needed
                    }
                }

                const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                        event.preventDefault() // Prevent default form submission/newline
                        handleSend()
                    }
                }

                // MVP Input Area: Simple text input and send button
                // We can add Tailwind classes later
                return (
                    <div style= {{ display: "flex", padding: "1rem", borderTop: "1px solid #ccc" }
            }>
            {/* Placeholder for Agent Status Icon */ }
            < input
                            type = "text"
                            value = { currentInput }
                            onChange = { handleInputChange }
                            onKeyDown = { handleKeyDown }
                            style = {{ flexGrow: 1, marginRight: "0.5rem", padding: "0.5rem" }}
                            placeholder = "Type your message..."
            />
            <button onClick={ handleSend } style = {{ padding: "0.5rem 1rem" }} >
        Send
        </button>
        </div>
    )
            })
        })
    })
) 