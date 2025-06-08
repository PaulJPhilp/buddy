import type { StatusInfo } from "@/features/chat/components/HeaderBar";
import type { Agent } from "@/features/chat/components/UserArea/AgentToolBar";
import type { AttachmentFile } from "@/features/chat/components/UserArea/AttachmentBar";
import type { ChatState } from "@/services/chat/ChatServiceApi";
import { create } from "zustand";

export type MockThreadId = "thread1" | "thread2";

interface AppShellState {
  // Chat selection (migrated from SelectedChatContext)
  selectedChatId: string;
  setSelectedChatId: (id: string) => void;
  activeChatId: string | null;
  setActiveChatId: (id: string) => void;

  // Thread selection (legacy - can be removed later)
  selectedThreadId: MockThreadId | null;
  setSelectedThreadId: (threadId: MockThreadId) => void;

  // Chat state
  messages: ChatState["messages"];
  setMessages: (messages: ChatState["messages"]) => void;
  addMessage: (message: ChatState["messages"][0]) => void;
  createUserMessage: (text: string, files?: File[]) => ChatState["messages"][0];
  createAssistantMessage: (
    text: string,
    files?: File[],
  ) => ChatState["messages"][0];
  simulateAssistantResponse: (
    userText: string,
    files?: File[],
  ) => Promise<void>;
  sendMessage: (text: string, files?: File[]) => Promise<void>;
  error: string | null;
  setError: (error: string | null) => void;
  isTyping: boolean;
  setIsTyping: (isTyping: boolean) => void;
  isSending: boolean;
  setIsSending: (isSending: boolean) => void;

  // Attachments
  attachments: AttachmentFile[];
  setAttachments: (attachments: AttachmentFile[]) => void;
  addAttachment: (attachment: AttachmentFile) => void;
  removeAttachment: (fileId: string) => void;

  // Agent state
  selectedAgent: string;
  setSelectedAgent: (agentId: string) => void;
  agents: Agent[];

  // Status panel
  isStatusPanelOpen: boolean;
  setIsStatusPanelOpen: (isOpen: boolean) => void;
  statusInfo: StatusInfo;
}

// Mock data
const mockMessages: ChatState["messages"] = [
  {
    id: "1",
    text: "Hello! How can I help you today?",
    sender: "assistant",
    timestamp: Date.now() - 3600000 * 2, // 2 hours ago
    metadata: { length: 29 },
  },
  {
    id: "2",
    text: "I need help with my React code. I'm trying to implement a chat interface with TypeScript.",
    sender: "user",
    timestamp: Date.now() - 3600000 * 2 + 30000, // 30 seconds later
    metadata: { length: 82 },
  },
  {
    id: "3",
    text: "I'd be happy to help with your React and TypeScript implementation. Could you share your current code structure?",
    sender: "assistant",
    timestamp: Date.now() - 3600000 * 2 + 60000, // 1 minute later
    metadata: { length: 98 },
  },
  {
    id: "4",
    text: "Here's my current setup: I have a ChatApp component that manages the state and renders the messages.",
    sender: "user",
    timestamp: Date.now() - 3600000 * 2 + 120000, // 2 minutes later
    metadata: { length: 94 },
  },
  {
    id: "5",
    text: "That's a good start. Let's break down the implementation into smaller components.",
    sender: "assistant",
    timestamp: Date.now() - 3600000 * 2 + 180000,
    metadata: { length: 75 },
  },
];

const mockAgents: Agent[] = [
  {
    id: "default",
    name: "Buddy",
    description: "Your helpful AI assistant",
    status: { mood: 100, energy: 100, health: 100 },
    capabilities: { canSpeak: true, canMove: false, canLearn: true },
  },
  {
    id: "coder",
    name: "Code Buddy",
    description: "Specialized in programming assistance",
    status: { mood: 100, energy: 100, health: 100 },
    capabilities: { canSpeak: true, canMove: false, canLearn: true },
  },
];

const mockStatusInfo: StatusInfo = {
  tokens: {
    used: 1234,
    remaining: 8766,
  },
  cost: {
    current: 0.25,
    limit: 5.0,
    currency: "USD",
  },
  agentStatus: {
    state: "idle",
    details: undefined,
  },
};

// Helper functions
const generateMessageId = () =>
  `msg-${Date.now()}-${Math.random().toString(36).slice(2)}`;

export const useAppShellStore = create<AppShellState>((set, get) => ({
  // Chat selection (migrated from SelectedChatContext)
  selectedChatId: "chat1",
  setSelectedChatId: (id) => set({ selectedChatId: id }),
  activeChatId: "chat1",
  setActiveChatId: (id) => set({ activeChatId: id }),

  // Thread selection (legacy - can be removed later)
  selectedThreadId: null,
  setSelectedThreadId: (threadId) => set({ selectedThreadId: threadId }),

  // Chat state
  messages: mockMessages,
  setMessages: (messages) => set({ messages }),
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
      // Create and add user message
      const userMessage = store.createUserMessage(text, files);
      store.addMessage(userMessage);

      // Simulate response (will be replaced with actual API call)
      await store.simulateAssistantResponse(text, files);

      // TODO: Actual API integration
      // await Effect.runPromise(
      //   ChatService.sendMessage(text, store.selectedAgent, files)
      // );
    } catch (err) {
      store.setError(
        err instanceof Error ? err.message : "Failed to process message",
      );
      console.error("Error in sendMessage:", err);
    } finally {
      store.setIsSending(false);
    }
  },
  error: null,
  setError: (error) => set({ error }),
  isTyping: false,
  setIsTyping: (isTyping) => set({ isTyping }),
  isSending: false,
  setIsSending: (isSending) => set({ isSending }),

  // Attachments
  attachments: [],
  setAttachments: (attachments) => set({ attachments }),
  addAttachment: (attachment) =>
    set((state) => ({
      attachments: [...state.attachments, attachment],
    })),
  removeAttachment: (fileId) =>
    set((state) => ({
      attachments: state.attachments.filter((f) => f.id !== fileId),
    })),

  // Agent state
  selectedAgent: "default",
  setSelectedAgent: (agentId) => set({ selectedAgent: agentId }),
  agents: mockAgents,

  // Status panel
  isStatusPanelOpen: false,
  setIsStatusPanelOpen: (isOpen) => set({ isStatusPanelOpen: isOpen }),
  statusInfo: mockStatusInfo,
}));
