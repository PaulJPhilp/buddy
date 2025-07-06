import { Effect, Layer } from "effect";
import { AgentEndpointResolverService } from "../AgentEndpointResolverService";

// Real test endpoint resolver implementation
export class TestEndpointResolverService extends Effect.Service<AgentEndpointResolverService>()(
  "AgentEndpointResolverService",
  {
    scoped: Effect.gen(function* () {
      return {
        resolveEndpoint: (agentId: string, chatId: string) =>
          Effect.succeed(`ws://test-endpoint/${agentId}/${chatId}`),
      };
    }),
    dependencies: [],
  }
) {}

// Layer with test services
export const TestServicesLive = Layer.succeed(
  AgentEndpointResolverService,
  TestEndpointResolverService
);
