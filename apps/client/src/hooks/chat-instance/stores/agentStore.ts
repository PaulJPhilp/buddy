import type { Message } from "@/types/chat";
import { createStore } from "@xstate/store";
import type { AgentState } from "../types";

// Initial state factory
const createInitialState = (): AgentState => ({
  activeStreams: new Map(),
  pendingMessages: [],
});

// Agent Store - manages agent communication and message streaming
export const agentStore = createStore({
  context: createInitialState(),
  on: {
    streamStarted: (
      context,
      event: { streamId: string; initialText?: string },
    ) => {
      const newActiveStreams = new Map(context.activeStreams);
      newActiveStreams.set(event.streamId, event.initialText || "");

      return {
        ...context,
        activeStreams: newActiveStreams,
      };
    },

    streamChunk: (context, event: { streamId: string; chunk: string }) => {
      const newActiveStreams = new Map(context.activeStreams);
      const currentText = newActiveStreams.get(event.streamId) || "";
      newActiveStreams.set(event.streamId, currentText + event.chunk);

      return {
        ...context,
        activeStreams: newActiveStreams,
      };
    },

    streamCompleted: (
      context,
      event: { streamId: string; finalMessage: Message },
    ) => {
      const newActiveStreams = new Map(context.activeStreams);
      newActiveStreams.delete(event.streamId);

      return {
        ...context,
        activeStreams: newActiveStreams,
        pendingMessages: [...context.pendingMessages, event.finalMessage],
      };
    },

    streamAborted: (context, event: { streamId: string; reason?: string }) => {
      const newActiveStreams = new Map(context.activeStreams);
      newActiveStreams.delete(event.streamId);

      return {
        ...context,
        activeStreams: newActiveStreams,
      };
    },

    streamsCleared: (context) => ({
      ...context,
      activeStreams: new Map(),
      pendingMessages: [],
    }),
  },
});

// Selectors for agent communication state
export const agentSelectors = {
  // Get the full state
  getState: (state: typeof agentStore.getSnapshot) => state().context,

  // Get active streams
  getActiveStreams: (state: typeof agentStore.getSnapshot) =>
    state().context.activeStreams,

  // Get pending messages
  getPendingMessages: (state: typeof agentStore.getSnapshot) =>
    state().context.pendingMessages,

  // Check if a specific stream is active
  isStreamActive:
    (streamId: string) => (state: typeof agentStore.getSnapshot) =>
      state().context.activeStreams.has(streamId),

  // Get accumulated text for a stream
  getStreamText: (streamId: string) => (state: typeof agentStore.getSnapshot) =>
    state().context.activeStreams.get(streamId) || "",

  // Get count of active streams
  getActiveStreamCount: (state: typeof agentStore.getSnapshot) =>
    state().context.activeStreams.size,

  // Check if any streams are active
  hasActiveStreams: (state: typeof agentStore.getSnapshot) =>
    state().context.activeStreams.size > 0,

  // Get all stream IDs
  getActiveStreamIds: (state: typeof agentStore.getSnapshot) =>
    Array.from(state().context.activeStreams.keys()),
};

// Action creators for type-safe event dispatching
export const agentActions = {
  startStream: (streamId: string, initialText?: string) =>
    agentStore.send({ type: "streamStarted", streamId, initialText }),

  addChunk: (streamId: string, chunk: string) =>
    agentStore.send({ type: "streamChunk", streamId, chunk }),

  completeStream: (streamId: string, finalMessage: Message) =>
    agentStore.send({ type: "streamCompleted", streamId, finalMessage }),

  abortStream: (streamId: string, reason?: string) =>
    agentStore.send({ type: "streamAborted", streamId, reason }),

  clearStreams: () => agentStore.send({ type: "streamsCleared" }),
};

// Utility functions for working with agent communication
export const agentUtils = {
  // Create a streaming message from current stream state
  createStreamingMessage: (
    streamId: string,
    role: "user" | "assistant" = "assistant",
  ): Message => {
    const currentText = agentSelectors.getStreamText(streamId)(
      agentStore.getSnapshot,
    );
    return {
      id: streamId,
      text: currentText,
      role,
      timestamp: Date.now(),
      metadata: { streaming: true },
    };
  },

  // Finalize a streaming message
  finalizeStreamingMessage: (
    streamId: string,
    role: "user" | "assistant" = "assistant",
  ): Message => {
    const currentText = agentSelectors.getStreamText(streamId)(
      agentStore.getSnapshot,
    );
    return {
      id: streamId,
      text: currentText,
      role,
      timestamp: Date.now(),
      metadata: { streaming: false },
    };
  },
};
