import { act, render, screen } from "@testing-library/react";
import { ThemeProvider, useTheme } from "../ThemeContext";

// Mock localStorage for testing
const localStorageMock = (() => {
    let store: Record<string, string> = {};

    return {
        getItem: (key: string) => store[key] || null,
        setItem: (key: string, value: string) => {
            store[key] = value.toString();
        },
        removeItem: (key: string) => {
            delete store[key];
        },
        clear: () => {
            store = {};
        },
    };
})();

Object.defineProperty(window, "localStorage", {
    value: localStorageMock,
});

// Test component that uses the theme
function TestComponent({ chatId }: { chatId: string }) {
    const { chatThemes, updateChatColor, getChatStyle } = useTheme();
    const theme = chatThemes[chatId];
    const style = getChatStyle(chatId);

    return (
        <div data-testid="theme-test" style={style}>
            <div data-testid="current-background">
                {theme?.background || "not-set"}
            </div>
            <button
                data-testid="update-color"
                onClick={() => updateChatColor(chatId, "background", "#ff0000")}
            >
                Update Background
            </button>
        </div>
    );
}

describe("ThemeProvider Integration", () => {
    beforeEach(() => {
        localStorageMock.clear();
    });

    it("provides theme context to child components", async () => {
        render(
            <ThemeProvider>
                <TestComponent chatId="test-chat" />
            </ThemeProvider>
        );

        // Should render without crashing
        expect(screen.getByTestId("theme-test")).toBeInTheDocument();
    });

    it("allows theme updates and maintains state", async () => {
        render(
            <ThemeProvider>
                <TestComponent chatId="test-chat" />
            </ThemeProvider>
        );

        // Initial state should show default theme or not-set
        const backgroundDisplay = screen.getByTestId("current-background");

        // Update the theme
        const updateButton = screen.getByTestId("update-color");
        act(() => {
            updateButton.click();
        });

        // After update, should show new color
        expect(backgroundDisplay).toHaveTextContent("#ff0000");
    });

    it("applies CSS variables correctly", async () => {
        render(
            <ThemeProvider>
                <TestComponent chatId="test-chat" />
            </ThemeProvider>
        );

        const testElement = screen.getByTestId("theme-test");

        // Should have CSS variables applied
        const computedStyle = window.getComputedStyle(testElement);

        // Check that CSS variables are present in the style attribute
        expect(testElement.style.getPropertyValue("--color-chat-background")).toBeTruthy();
    });

    // Note: localStorage integration test would require more complex setup
    // since the Effect runtime is asynchronous. In a real implementation,
    // we'd test this with proper Effect test utilities.
}); 