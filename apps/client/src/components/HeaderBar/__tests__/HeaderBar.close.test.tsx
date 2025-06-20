import { fireEvent, render, screen } from "@testing-library/react";
import { HeaderBar } from "../HeaderBar";

describe("HeaderBar onClose Event", () => {
  it("should show close icon when onClose is provided", () => {
    const mockOnClose = vi.fn();

    render(<HeaderBar title="Test Chat" onClose={mockOnClose} />);

    const closeButton = screen.getByTestId("close-chat-button");
    expect(closeButton).toBeInTheDocument();
    expect(closeButton).toHaveAttribute("title", "Close chat");
    expect(closeButton).toHaveAttribute("aria-label", "Close chat");
  });

  it("should hide close icon when onClose is not provided", () => {
    render(<HeaderBar title="Test Chat" />);

    const closeButton = screen.queryByTestId("close-chat-button");
    expect(closeButton).not.toBeInTheDocument();
  });

  it("should call onClose when close button is clicked", () => {
    const mockOnClose = vi.fn();

    render(<HeaderBar title="Test Chat" onClose={mockOnClose} />);

    const closeButton = screen.getByTestId("close-chat-button");
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it("should stop propagation when close button is clicked", () => {
    const mockOnClose = vi.fn();
    const mockOnHeaderClick = vi.fn();

    render(
      <HeaderBar
        title="Test Chat"
        onClose={mockOnClose}
        onHeaderClick={mockOnHeaderClick}
      />,
    );

    const closeButton = screen.getByTestId("close-chat-button");
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
    // Header click should NOT be called due to stopPropagation
    expect(mockOnHeaderClick).not.toHaveBeenCalled();
  });

  it("should show close icon regardless of expanded state", () => {
    const mockOnClose = vi.fn();

    const { rerender } = render(
      <HeaderBar title="Test Chat" onClose={mockOnClose} isExpanded={false} />,
    );

    // Should show close icon when not expanded
    expect(screen.getByTestId("close-chat-button")).toBeInTheDocument();

    // Re-render as expanded
    rerender(
      <HeaderBar title="Test Chat" onClose={mockOnClose} isExpanded={true} />,
    );

    // Should still show close icon when expanded
    expect(screen.getByTestId("close-chat-button")).toBeInTheDocument();
  });

  it("should show all icons when all callbacks are provided", () => {
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

    // Should show expand (not expanded), settings, trash, and close icons
    expect(screen.getByTestId("expand-chat-button")).toBeInTheDocument();
    expect(screen.queryByTestId("compact-chat-button")).not.toBeInTheDocument();
    expect(screen.getByTestId("close-chat-button")).toBeInTheDocument();
    expect(screen.getByTitle("Settings")).toBeInTheDocument();
    expect(screen.getByTitle("Clear chat")).toBeInTheDocument();
  });
});
