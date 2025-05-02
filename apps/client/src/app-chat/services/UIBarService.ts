import { Context, Effect } from "effect"
import * as React from "react"

// Define the service interface
export interface UIBarService {
    readonly render: () => React.ReactNode
}

// Create a Tag for the service
export const UIBarService = Context.Tag<UIBarService>("services/UIBarService")

// Create a default implementation that renders nothing
export const DefaultUIBarService = UIBarService.of({
    render: () => null
})

// Helper to create a UIBar service
export const makeUIBarService = (component: () => React.ReactNode): Effect.Effect<never, never, UIBarService> =>
    Effect.succeed({
        render: component
    }) 