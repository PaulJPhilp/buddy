import { fireEvent, render, screen } from "@testing-library/react";
import { HeaderBar } from "../HeaderBar";

describe("HeaderBar Settings", () => {
  it("should render settings button with proper test id", () => {
    render(<HeaderBar title="Test Chat" />);

    const settingsButton = screen.getByTestId("settings-button");
    expect(settingsButton).toBeInTheDocument();
    expect(settingsButton).toHaveAttribute("title", "Settings");
    expect(settingsButton).toHaveAttribute("aria-label", "Settings");
  });

  it("should call onSettings when settings button is clicked and onSettings is provided", () => {
    const mockOnSettings = vi.fn();

    render(<HeaderBar title="Test Chat" onSettings={mockOnSettings} />);

    const settingsButton = screen.getByTestId("settings-button");
    fireEvent.click(settingsButton);

    expect(mockOnSettings).toHaveBeenCalledTimes(1);
  });

  it("should toggle status panel when settings button is clicked and no onSettings provided but statusInfo exists", () => {
    const mockOnToggleStatusPanel = vi.fn();

    render(
      <HeaderBar
        title="Test Chat"
        statusInfo={{
          agentStatus: {
            state: "idle",
            details: "Ready",
          },
        }}
        onToggleStatusPanel={mockOnToggleStatusPanel}
      />,
    );

    const settingsButton = screen.getByTestId("settings-button");
    fireEvent.click(settingsButton);

    // Should toggle status panel when no onSettings but statusInfo exists
    expect(mockOnToggleStatusPanel).toHaveBeenCalledTimes(1);
    expect(mockOnToggleStatusPanel).toHaveBeenCalledWith(true);
  });

  it("should prioritize onSettings over status panel toggle when both are provided", () => {
    const mockOnSettings = vi.fn();
    const mockOnToggleStatusPanel = vi.fn();

    render(
      <HeaderBar
        title="Test Chat"
        onSettings={mockOnSettings}
        statusInfo={{
          agentStatus: {
            state: "idle",
            details: "Ready",
          },
        }}
        onToggleStatusPanel={mockOnToggleStatusPanel}
      />,
    );

    const settingsButton = screen.getByTestId("settings-button");
    fireEvent.click(settingsButton);

    // Should call onSettings, not toggle status panel
    expect(mockOnSettings).toHaveBeenCalledTimes(1);
    expect(mockOnToggleStatusPanel).not.toHaveBeenCalled();
  });

  it("should stop event propagation when settings button is clicked", () => {
    const mockOnSettings = vi.fn();
    const mockOnHeaderClick = vi.fn();

    render(
      <HeaderBar
        title="Test Chat"
        onSettings={mockOnSettings}
        onHeaderClick={mockOnHeaderClick}
      />,
    );

    const settingsButton = screen.getByTestId("settings-button");
    fireEvent.click(settingsButton);

    expect(mockOnSettings).toHaveBeenCalledTimes(1);
    expect(mockOnHeaderClick).not.toHaveBeenCalled();
  });
});
