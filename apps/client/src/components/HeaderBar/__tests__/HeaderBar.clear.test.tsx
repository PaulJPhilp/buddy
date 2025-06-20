import { fireEvent, render, screen } from "@testing-library/react";
import { HeaderBar } from "../HeaderBar";

describe("HeaderBar onClearChat Event", () => {
  it("should show clear icon when onClearChat is provided", () => {
    const mockOnClearChat = vi.fn();

    render(<HeaderBar title="Test Chat" onClearChat={mockOnClearChat} />);

    const clearButton = screen.getByTestId("clear-chat-button");
    expect(clearButton).toBeInTheDocument();
    expect(clearButton).toHaveAttribute("title", "Clear chat");
    expect(clearButton).toHaveAttribute("aria-label", "Clear chat");
  });

  it("should hide clear icon when onClearChat is not provided", () => {
    render(<HeaderBar title="Test Chat" />);

    const clearButton = screen.queryByTestId("clear-chat-button");
    expect(clearButton).not.toBeInTheDocument();
  });

  it("should call onClearChat when clear button is clicked", () => {
    const mockOnClearChat = vi.fn();

    render(<HeaderBar title="Test Chat" onClearChat={mockOnClearChat} />);

    const clearButton = screen.getByTestId("clear-chat-button");
    fireEvent.click(clearButton);

    expect(mockOnClearChat).toHaveBeenCalledTimes(1);
  });

  it("should stop propagation when clear button is clicked", () => {
    const mockOnClearChat = vi.fn();
    const mockOnHeaderClick = vi.fn();

    render(
      <HeaderBar
        title="Test Chat"
        onClearChat={mockOnClearChat}
        onHeaderClick={mockOnHeaderClick}
      />,
    );

    const clearButton = screen.getByTestId("clear-chat-button");
    fireEvent.click(clearButton);

    expect(mockOnClearChat).toHaveBeenCalledTimes(1);
    // Header click should NOT be called due to stopPropagation
    expect(mockOnHeaderClick).not.toHaveBeenCalled();
  });

  it("should show clear icon regardless of expanded state", () => {
    const mockOnClearChat = vi.fn();

    const { rerender } = render(
      <HeaderBar
        title="Test Chat"
        onClearChat={mockOnClearChat}
        isExpanded={false}
      />,
    );

    // Should show clear icon when not expanded
    expect(screen.getByTestId("clear-chat-button")).toBeInTheDocument();

    // Re-render as expanded
    rerender(
      <HeaderBar
        title="Test Chat"
        onClearChat={mockOnClearChat}
        isExpanded={true}
      />,
    );

    // Should still show clear icon when expanded
    expect(screen.getByTestId("clear-chat-button")).toBeInTheDocument();
  });

  it("should use yellow hover state for clear button", () => {
    const mockOnClearChat = vi.fn();

    render(<HeaderBar title="Test Chat" onClearChat={mockOnClearChat} />);

    const clearButton = screen.getByTestId("clear-chat-button");
    expect(clearButton).toHaveClass("hover:bg-yellow-100");
  });

  it("should show appropriate icons when all callbacks are provided", () => {
    const mockOnExpand = vi.fn();
    const mockOnCompact = vi.fn();
    const mockOnClose = vi.fn();
    const mockOnClearChat = vi.fn();

    render(
      <HeaderBar
        title="Test Chat"
        onExpand={mockOnExpand}
        onCompact={mockOnCompact}
        onClose={mockOnClose}
        onClearChat={mockOnClearChat}
        isExpanded={false}
      />,
    );

    // Should show expand (not expanded), settings, clear, and close icons
    expect(screen.getByTestId("expand-chat-button")).toBeInTheDocument();
    expect(screen.queryByTestId("compact-chat-button")).not.toBeInTheDocument();
    expect(screen.getByTestId("clear-chat-button")).toBeInTheDocument();
    expect(screen.getByTestId("close-chat-button")).toBeInTheDocument();
    expect(screen.getByTitle("Settings")).toBeInTheDocument();
  });
});
