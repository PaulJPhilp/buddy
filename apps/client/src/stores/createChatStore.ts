import { create } from "zustand";
import type { Agent } from "../features/chat/components/UserArea/AgentToolBar";

interface ChatTheme {
  primaryColor: string;
  secondaryColor: string;
  activePrimaryColor: string;
  activeSecondaryColor: string;
}

interface Message {
  id: string;
  text: string;
  sender: "user" | "assistant";
  timestamp: number;
  metadata: {
    length: number;
    hasAttachments?: boolean;
    attachedFileCount?: number;
    fileNames?: string[];
  };
}

interface ChatStoreState {
  // Theme
  theme: ChatTheme;

  // Messages
  messages: Message[];
  addMessage: (message: Message) => void;
  createUserMessage: (text: string, files?: File[]) => Message;
  createAssistantMessage: (text: string, files?: File[]) => Message;
  simulateAssistantResponse: (
    userText: string,
    files?: File[],
  ) => Promise<void>;
  sendMessage: (text: string, files?: File[]) => Promise<void>;

  // Agents
  agents: Agent[];
  selectedAgent: string;
  setSelectedAgent: (agentId: string) => void;

  // UI State
  isTyping: boolean;
  setIsTyping: (isTyping: boolean) => void;
  isSending: boolean;
  setIsSending: (isSending: boolean) => void;
  error: string | null;
  setError: (error: string | null) => void;

  // Toolbar
  hasRatingToolbar: boolean;
  rateMessage?: (messageId: string, rating: "up" | "down") => void;
}

interface CreateChatStoreConfig {
  theme: ChatTheme;
  initialAgents: Agent[];
  initialMessages: Message[];
  hasRatingToolbar?: boolean;
}

const generateMessageId = () =>
  `msg-${Date.now()}-${Math.random().toString(36).slice(2)}`;

export const createChatStore = (config: CreateChatStoreConfig) => {
  return create<ChatStoreState>((set, get) => ({
    // Theme
    theme: config.theme,

    // Messages
    messages: config.initialMessages,
    addMessage: (message) =>
      set((state) => ({
        messages: [...state.messages, message],
      })),
    createUserMessage: (text, files) => ({
      id: generateMessageId(),
      text,
      sender: "user",
      timestamp: Date.now(),
      metadata: {
        length: text.length,
        hasAttachments: files?.length ? files.length > 0 : false,
        attachedFileCount: files?.length ?? 0,
        fileNames: files?.map((file) => file.name) ?? [],
      },
    }),
    createAssistantMessage: (text, files) => ({
      id: generateMessageId(),
      text,
      sender: "assistant",
      timestamp: Date.now(),
      metadata: {
        length: text.length,
        hasAttachments: files?.length ? files.length > 0 : false,
        attachedFileCount: files?.length ?? 0,
        fileNames: files?.map((file) => file.name) ?? [],
      },
    }),
    simulateAssistantResponse: async (userText, files) => {
      const store = get();
      store.setIsTyping(true);
      await new Promise((resolve) => setTimeout(resolve, 1200));
      const responseText = `Received: "${userText}". ${files && files.length > 0 ? `And ${files.length} file(s).` : ""} I'm pondering...`;
      const response = store.createAssistantMessage(responseText, files);
      store.addMessage(response);
      store.setIsTyping(false);
    },
    sendMessage: async (text, files) => {
      const store = get();
      try {
        store.setIsSending(true);
        const userMessage = store.createUserMessage(text, files);
        store.addMessage(userMessage);
        await store.simulateAssistantResponse(text, files);
      } catch (err) {
        store.setError(
          err instanceof Error ? err.message : "Failed to process message",
        );
        console.error("Error in sendMessage:", err);
      } finally {
        store.setIsSending(false);
      }
    },

    // Agents
    agents: config.initialAgents,
    selectedAgent: config.initialAgents[0]?.id ?? "",
    setSelectedAgent: (agentId) => set({ selectedAgent: agentId }),

    // UI State
    isTyping: false,
    setIsTyping: (isTyping) => set({ isTyping }),
    isSending: false,
    setIsSending: (isSending) => set({ isSending }),
    error: null,
    setError: (error) => set({ error }),

    // Toolbar
    hasRatingToolbar: config.hasRatingToolbar ?? false,
    rateMessage: config.hasRatingToolbar
      ? (messageId, rating) => {
          console.log(`Message ${messageId} rated ${rating}`);
          // TODO: Implement actual rating logic
        }
      : undefined,
  }));
};
