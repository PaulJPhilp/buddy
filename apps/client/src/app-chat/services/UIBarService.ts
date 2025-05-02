import { Effect } from "effect"
import * as React from "react"

// Define the service interface
export interface UIBarServiceApi {
    readonly render: () => React.ReactNode
}