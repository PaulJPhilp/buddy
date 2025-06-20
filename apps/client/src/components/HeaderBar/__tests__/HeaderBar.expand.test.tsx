import { fireEvent, render, screen } from "@testing-library/react";
import { HeaderBar } from "../HeaderBar";

describe("HeaderBar onExpand Event", () => {
  it("should show expand icon when onExpand is provided and not expanded", () => {
    const mockOnExpand = vi.fn();

    render(
      <HeaderBar
        title="Test Chat"
        onExpand={mockOnExpand}
        isExpanded={false}
      />,
    );

    const expandButton = screen.getByTestId("expand-chat-button");
    expect(expandButton).toBeInTheDocument();
    expect(expandButton).toHaveAttribute("title", "Expand chat");
    expect(expandButton).toHaveAttribute("aria-label", "Expand chat");
  });

  it("should hide expand icon when expanded", () => {
    const mockOnExpand = vi.fn();

    render(
      <HeaderBar title="Test Chat" onExpand={mockOnExpand} isExpanded={true} />,
    );

    const expandButton = screen.queryByTestId("expand-chat-button");
    expect(expandButton).not.toBeInTheDocument();
  });

  it("should hide expand icon when onExpand is not provided", () => {
    render(<HeaderBar title="Test Chat" isExpanded={false} />);

    const expandButton = screen.queryByTestId("expand-chat-button");
    expect(expandButton).not.toBeInTheDocument();
  });

  it("should call onExpand when expand button is clicked", () => {
    const mockOnExpand = vi.fn();

    render(
      <HeaderBar
        title="Test Chat"
        onExpand={mockOnExpand}
        isExpanded={false}
      />,
    );

    const expandButton = screen.getByTestId("expand-chat-button");
    fireEvent.click(expandButton);

    expect(mockOnExpand).toHaveBeenCalledTimes(1);
  });

  it("should stop propagation when expand button is clicked", () => {
    const mockOnExpand = vi.fn();
    const mockOnHeaderClick = vi.fn();

    render(
      <HeaderBar
        title="Test Chat"
        onExpand={mockOnExpand}
        onHeaderClick={mockOnHeaderClick}
        isExpanded={false}
      />,
    );

    const expandButton = screen.getByTestId("expand-chat-button");
    fireEvent.click(expandButton);

    expect(mockOnExpand).toHaveBeenCalledTimes(1);
    // Header click should NOT be called due to stopPropagation
    expect(mockOnHeaderClick).not.toHaveBeenCalled();
  });
});
