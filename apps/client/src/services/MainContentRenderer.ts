import { Context, Effect } from "effect";

// Define the structure of the rendered output (Placeholder for now)
type UIElement = React.ReactElement; // Or a more abstract type

// Define the service interface
export interface MainContentRenderer {
  readonly render: Effect.Effect<UIElement>;
}

// Create a Tag for the service
export const MainContentRenderer = Context.Tag<MainContentRenderer>(
  "services/MainContentRenderer",
);
