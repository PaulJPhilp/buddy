import { Effect } from "effect";

// Define the structure of the rendered output (Placeholder for now)
type UIElement = React.ReactElement; // Or a more abstract type

// Define the service interface
export interface InputAreaRenderer {
  readonly render: Effect.Effect<UIElement>;
}

// Create service using Effect.Service pattern
export class InputAreaRendererService extends Effect.Service<InputAreaRenderer>()(
  "InputAreaRenderer",
  {
    effect: Effect.succeed({
      render: Effect.succeed(null as unknown as UIElement),
    }),
    dependencies: [],
  },
) { }
