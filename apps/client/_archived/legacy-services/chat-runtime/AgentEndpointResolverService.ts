import { Data, Effect } from "effect";

// --- Error Definition ---
export class AgentEndpointNotFoundError extends Data.TaggedError(
  "AgentEndpointNotFoundError",
)<{
  readonly agentId: string;
  readonly message: string;
}> {}

// --- API Definition ---
export interface AgentEndpointResolverServiceApi {
  readonly resolveEndpoint: (
    agentId: string,
    chatId: string,
  ) => Effect.Effect<string, AgentEndpointNotFoundError>;
}

// --- Service Definition and Implementation ---

const getBaseEndpoint = (): string => {
  const envUrl =
    typeof process !== "undefined" && process.env.NEXT_PUBLIC_WS_URL
      ? process.env.NEXT_PUBLIC_WS_URL
      : undefined;
  if (!envUrl) {
    throw new Error(
      "NEXT_PUBLIC_WS_URL is not set. Please configure the WebSocket endpoint in your environment.",
    );
  }
  return envUrl;
};

export class AgentEndpointResolverService extends Effect.Service<AgentEndpointResolverServiceApi>()(
  "AgentEndpointResolverService", // Service Identifier
  {
    // Implementation for the service API
    effect: Effect.succeed({
      resolveEndpoint: (agentId: string, chatId: string) =>
        Effect.sync(() => {
          const baseWsUrl = getBaseEndpoint();

          const urlObject = new URL(baseWsUrl);
          if (!urlObject.pathname.includes("/chat")) {
            if (urlObject.pathname.endsWith("/")) {
              urlObject.pathname += "chat";
            } else {
              urlObject.pathname += "/chat";
            }
          }
          urlObject.searchParams.set("chatId", chatId);
          urlObject.searchParams.set("agentId", agentId);

          return urlObject.toString();
        }),
    }),
    dependencies: [], // No dependencies for this service
  },
) {}

// Example of how this service might be used later with AppService for dynamic config:
// import { AppService } from "../dynamic/AppService"; // Adjust import path as needed
// import { Option } from "effect";
//
// export const AgentEndpointResolverServiceDynamicLive = Layer.effect(
//   AgentEndpointResolverService,
//   Effect.gen(function* () {
//     const appsService = yield* AppService;
//
//     return AgentEndpointResolverService.of({
//       resolveEndpoint: (agentId: string, chatId: string) =>
//         Effect.gen(function* () {
//           // This is a placeholder for fetching dynamic configuration.
//           // You would typically fetch an AppConfig that contains the agent's URL.
//           // For example, if AppConfig has an agentWsUrl property:
//           const appConfigOption = yield* appsService.getById(chatId); // Or some other lookup
//
//           if (Option.isNone(appConfigOption)) {
//             return yield* Effect.fail(
//               new AgentEndpointNotFoundError({
//                 agentId,
//                 message: `Configuration for chatId ${chatId} (agentId ${agentId}) not found.`,
//               })
//             );
//           }
//           const appConfig = appConfigOption.value;
//
//           // Assuming appConfig.agentId points to the agent we need,
//           // and we'd need a way to get the *actual* WebSocket URL.
//           // This part is highly dependent on how your AppConfig and dynamic resolution works.
//           // For now, we'll use a placeholder or a direct field if available.
//           // Let's assume there's a direct URL or a way to look it up via AppService/AgentsService.
//
//           // This is a simplified example. You'd need to integrate with how your AppService
//           // and related schemas store the WebSocket URL for a given agent or app.
//           const resolvedBaseUrl = defaultBaseEndpoint; // Placeholder: Replace with actual dynamic lookup
//
//           const urlObject = new URL(resolvedBaseUrl);
//            if (!urlObject.pathname.includes("/chat")) {
//                if (urlObject.pathname.endsWith("/")) {
//                    urlObject.pathname += "chat";
//                } else {
//                    urlObject.pathname += "/chat";
//                }
//            }
//           urlObject.searchParams.set("chatId", chatId);
//           urlObject.searchParams.set("agentId", agentId); // or appConfig.agentId
//           return urlObject.toString();
//         }),
//     });
//   }).pipe(Layer.provide(AppService.Live)) // Provide AppService.Live or .Default
// );
