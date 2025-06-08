import { beforeEach, describe, expect, it } from "vitest";
import { useAppShellStore } from "../appShellStore";
import { useBusinessChatStore, useSocialChatStore } from "../chatStores";
import { createChatStore } from "../createChatStore";

// Custom mock interfaces
interface MockFile {
  name: string;
  size: number;
  type: string;
}

interface MockAgent {
  id: string;
  name: string;
  description: string;
  status: { mood: number; energy: number; health: number };
  capabilities: { canSpeak: boolean; canMove: boolean; canLearn: boolean };
}

describe("appShellStore", () => {
  beforeEach(() => {
    // Reset store state before each test
    useAppShellStore.setState(useAppShellStore.getInitialState());
  });

  it("should set and get selectedThreadId", () => {
    useAppShellStore.getState().setSelectedThreadId("thread1");
    expect(useAppShellStore.getState().selectedThreadId).toBe("thread1");
  });

  it("should add and set messages", () => {
    const msg = useAppShellStore.getState().createUserMessage("test message");
    useAppShellStore.getState().addMessage(msg);
    expect(useAppShellStore.getState().messages.at(-1)).toEqual(msg);
    const newMessages = [msg];
    useAppShellStore.getState().setMessages(newMessages);
    expect(useAppShellStore.getState().messages).toEqual(newMessages);
  });

  it("should create user and assistant messages with files", () => {
    const files: File[] = [
      { name: "file1.txt", size: 123, type: "text/plain" } as File,
      { name: "file2.png", size: 456, type: "image/png" } as File,
    ];
    const userMsg = useAppShellStore.getState().createUserMessage("hi", files);
    expect(userMsg.metadata?.hasAttachments).toBe(true);
    expect(userMsg.metadata?.attachedFileCount).toBe(2);
    expect(userMsg.metadata?.fileNames).toEqual(["file1.txt", "file2.png"]);
    const assistantMsg = useAppShellStore
      .getState()
      .createAssistantMessage("hello", files);
    expect(assistantMsg.metadata?.hasAttachments).toBe(true);
    expect(assistantMsg.metadata?.attachedFileCount).toBe(2);
  });

  it("should simulate assistant response asynchronously", async () => {
    const initialCount = useAppShellStore.getState().messages.length;
    await useAppShellStore.getState().simulateAssistantResponse("test async");
    expect(useAppShellStore.getState().messages.length).toBe(initialCount + 1);
    expect(useAppShellStore.getState().isTyping).toBe(false);
  });

  it("should send message and handle async flow", async () => {
    const initialCount = useAppShellStore.getState().messages.length;
    await useAppShellStore.getState().sendMessage("hello world");
    expect(useAppShellStore.getState().messages.length).toBe(initialCount + 2);
    expect(useAppShellStore.getState().isSending).toBe(false);
  });

  it("should set and clear error", () => {
    useAppShellStore.getState().setError("fail");
    expect(useAppShellStore.getState().error).toBe("fail");
    useAppShellStore.getState().setError(null);
    expect(useAppShellStore.getState().error).toBe(null);
  });

  it("should set isTyping and isSending", () => {
    useAppShellStore.getState().setIsTyping(true);
    expect(useAppShellStore.getState().isTyping).toBe(true);
    useAppShellStore.getState().setIsSending(true);
    expect(useAppShellStore.getState().isSending).toBe(true);
  });

  it("should manage attachments", () => {
    const attachment = {
      id: "1",
      name: "file.txt",
      size: 100,
      type: "text/plain",
    };
    useAppShellStore.getState().addAttachment(attachment);
    expect(useAppShellStore.getState().attachments.length).toBe(1);
    useAppShellStore.getState().removeAttachment("1");
    expect(useAppShellStore.getState().attachments.length).toBe(0);
    useAppShellStore.getState().setAttachments([attachment]);
    expect(useAppShellStore.getState().attachments).toEqual([attachment]);
  });

  it("should set and get selectedAgent", () => {
    useAppShellStore.getState().setSelectedAgent("coder");
    expect(useAppShellStore.getState().selectedAgent).toBe("coder");
  });

  it("should open and close status panel", () => {
    useAppShellStore.getState().setIsStatusPanelOpen(true);
    expect(useAppShellStore.getState().isStatusPanelOpen).toBe(true);
    useAppShellStore.getState().setIsStatusPanelOpen(false);
    expect(useAppShellStore.getState().isStatusPanelOpen).toBe(false);
  });
});

describe("chatStores (business/social)", () => {
  it("should initialize with correct themes and agents", () => {
    expect(useBusinessChatStore.getState().theme.primaryColor).toBe("#1a365d");
    expect(useSocialChatStore.getState().theme.primaryColor).toBe("#7B341E");
    expect(useBusinessChatStore.getState().agents.length).toBeGreaterThan(0);
    expect(useSocialChatStore.getState().agents.length).toBeGreaterThan(0);
  });

  it("should add and create messages", () => {
    const store = useBusinessChatStore;
    const msg = store
      .getState()
      .createUserMessage("test", [
        { name: "a.txt", size: 1, type: "text/plain" } as File,
      ]);
    store.getState().addMessage(msg);
    expect(store.getState().messages.at(-1)).toEqual(msg);
  });

  it("should simulate assistant response and send message", async () => {
    const store = useSocialChatStore;
    const initial = store.getState().messages.length;
    await store.getState().simulateAssistantResponse("hi");
    expect(store.getState().messages.length).toBe(initial + 1);
    await store.getState().sendMessage("yo");
    expect(store.getState().messages.length).toBe(initial + 3);
  });

  it("should set agent and UI state", () => {
    const store = useBusinessChatStore;
    store.getState().setSelectedAgent("analyst");
    expect(store.getState().selectedAgent).toBe("analyst");
    store.getState().setIsTyping(true);
    expect(store.getState().isTyping).toBe(true);
    store.getState().setIsSending(true);
    expect(store.getState().isSending).toBe(true);
    store.getState().setError("err");
    expect(store.getState().error).toBe("err");
  });

  it("should handle rating toolbar if present", () => {
    const store = useBusinessChatStore;
    if (
      store.getState().hasRatingToolbar &&
      typeof store.getState().rateMessage === "function"
    ) {
      expect(() => store.getState().rateMessage?.("id", "up")).not.toThrow();
    }
    const social = useSocialChatStore;
    expect(social.getState().hasRatingToolbar).toBe(false);
    expect(social.getState().rateMessage).toBeUndefined();
  });
});

describe("createChatStore (custom instance)", () => {
  it("should create a new chat store with custom config", () => {
    const customStore = createChatStore({
      theme: {
        primaryColor: "#000",
        secondaryColor: "#fff",
        activePrimaryColor: "#111",
        activeSecondaryColor: "#eee",
      },
      initialAgents: [
        {
          id: "test",
          name: "Test Agent",
          description: "desc",
          status: { mood: 1, energy: 2, health: 3 },
          capabilities: { canSpeak: true, canMove: false, canLearn: false },
        },
      ],
      initialMessages: [],
      hasRatingToolbar: true,
    });
    expect(customStore.getState().theme.primaryColor).toBe("#000");
    expect(customStore.getState().agents[0].id).toBe("test");
    expect(customStore.getState().hasRatingToolbar).toBe(true);
    expect(typeof customStore.getState().rateMessage).toBe("function");
  });
});
