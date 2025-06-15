import { render, screen } from "@testing-library/react";
import { vi } from "vitest";
import { ChatApp } from "./ChatApp";

// Mock the useSimpleChat hook
vi.mock("@/hooks/useSimpleChat", () => ({
  useSimpleChat: vi.fn(() => ({
    chatState: {
      chatId: "test-chat",
      messages: [
        {
          id: "1",
          text: "Hello, this is a test message",
          role: "user",
          timestamp: Date.now(),
        },
        {
          id: "2",
          text: "Hello! How can I help you today?",
          role: "assistant",
          timestamp: Date.now() + 1000,
        },
      ],
      status: "connected",
      agentName: "Test Agent",
      isTyping: false,
      error: undefined,
    },
    dispatchAction: vi.fn(),
  })),
}));

// Mock the Effect services
vi.mock("@/services/app", () => ({
  AppService: {
    Default: {},
  },
}));

vi.mock("@/services/agent", () => ({
  AgentService: {
    Default: {},
  },
}));

vi.mock("@/services/toolbar", () => ({
  ToolbarService: {
    Default: {},
  },
}));

{
}
}
}))

// Mock Effect
vi.mock('effect', () => (
{
  runPromise: vi.fn(() =>
    Promise.resolve({
      id: "test-app",
      name: "Test Chat App",
      agentId: "test-agent",
    }),
  ),
    gen;
  : vi.fn(),
    provide: vi.fn()
  ,
  Layer:
  mergeAll: vi.fn(() => ());
}
))

describe('ChatApp', () =>
{
  it("should render messages correctly", async () => {
    render(<ChatApp chatAppId="test-app" />);

    // Wait for the component to load (may need to wait for useEffect)
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Check if messages are displayed
    expect(
      screen.getByText("Hello, this is a test message"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Hello! How can I help you today?"),
    ).toBeInTheDocument();

    // Check if role indicators are present
    expect(screen.getByText("You")).toBeInTheDocument();
    expect(screen.getByText("Test Agent")).toBeInTheDocument();
  });

  it("should display empty state when no messages", async () => {
    // Override the mock for this test
    const { useSimpleChat } = await import("@/hooks/useSimpleChat");
    vi.mocked(useSimpleChat).mockReturnValue({
      chatState: {
        chatId: "test-chat",
        messages: [],
        status: "connected",
        agentName: "Test Agent",
        isTyping: false,
        error: undefined,
      },
      dispatchAction: vi.fn(),
    });

    render(<ChatApp chatAppId="test-app" />);

    expect(screen.getByText("Start a conversation")).toBeInTheDocument();
    expect(
      screen.getByText("Send a message to begin chatting with Test Agent"),
    ).toBeInTheDocument();
  });
}
)
