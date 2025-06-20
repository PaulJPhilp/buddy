import { fireEvent, render, screen } from "@testing-library/react";
import { HeaderBar } from "../HeaderBar";

describe("HeaderBar onCompact Event", () => {
  it("should show compact icon when onCompact is provided and expanded", () => {
    const mockOnCompact = vi.fn();

    render(
      <HeaderBar
        title="Test Chat"
        onCompact={mockOnCompact}
        isExpanded={true}
      />,
    );

    const compactButton = screen.getByTestId("compact-chat-button");
    expect(compactButton).toBeInTheDocument();
    expect(compactButton).toHaveAttribute("title", "Restore chat");
    expect(compactButton).toHaveAttribute("aria-label", "Restore chat");
  });

  it("should hide compact icon when not expanded", () => {
    const mockOnCompact = vi.fn();

    render(
      <HeaderBar
        title="Test Chat"
        onCompact={mockOnCompact}
        isExpanded={false}
      />,
    );

    const compactButton = screen.queryByTestId("compact-chat-button");
    expect(compactButton).not.toBeInTheDocument();
  });

  it("should hide compact icon when onCompact is not provided", () => {
    render(<HeaderBar title="Test Chat" isExpanded={true} />);

    const compactButton = screen.queryByTestId("compact-chat-button");
    expect(compactButton).not.toBeInTheDocument();
  });

  it("should call onCompact when compact button is clicked", () => {
    const mockOnCompact = vi.fn();

    render(
      <HeaderBar
        title="Test Chat"
        onCompact={mockOnCompact}
        isExpanded={true}
      />,
    );

    const compactButton = screen.getByTestId("compact-chat-button");
    fireEvent.click(compactButton);

    expect(mockOnCompact).toHaveBeenCalledTimes(1);
  });

  it("should stop propagation when compact button is clicked", () => {
    const mockOnCompact = vi.fn();
    const mockOnHeaderClick = vi.fn();

    render(
      <HeaderBar
        title="Test Chat"
        onCompact={mockOnCompact}
        onHeaderClick={mockOnHeaderClick}
        isExpanded={true}
      />,
    );

    const compactButton = screen.getByTestId("compact-chat-button");
    fireEvent.click(compactButton);

    expect(mockOnCompact).toHaveBeenCalledTimes(1);
    // Header click should NOT be called due to stopPropagation
    expect(mockOnHeaderClick).not.toHaveBeenCalled();
  });

  it("should show expand icon when not expanded and expand icon when expanded", () => {
    const mockOnExpand = vi.fn();
    const mockOnCompact = vi.fn();

    const { rerender } = render(
      <HeaderBar
        title="Test Chat"
        onExpand={mockOnExpand}
        onCompact={mockOnCompact}
        isExpanded={false}
      />,
    );

    // Should show expand icon when not expanded
    expect(screen.getByTestId("expand-chat-button")).toBeInTheDocument();
    expect(screen.queryByTestId("compact-chat-button")).not.toBeInTheDocument();

    // Re-render as expanded
    rerender(
      <HeaderBar
        title="Test Chat"
        onExpand={mockOnExpand}
        onCompact={mockOnCompact}
        isExpanded={true}
      />,
    );

    // Should show compact icon when expanded
    expect(screen.queryByTestId("expand-chat-button")).not.toBeInTheDocument();
    expect(screen.getByTestId("compact-chat-button")).toBeInTheDocument();
  });
});
