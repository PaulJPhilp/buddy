import { defaultChatTheme } from "@/themes/themeTypes";
import type { ChatAppTheme } from "@/themes/themeTypes";
import { createStore } from "@xstate/store";
import { useStore } from "@xstate/store/react";

// Theme store state interface
interface ThemeState {
  readonly rawTheme: string | object | null;
  readonly parsedTheme: ChatAppTheme;
  readonly cssVariables: Record<string, string>;
  readonly isEditorOpen: boolean;
}

// Helper function to parse theme
function parseTheme(rawTheme: string | object | null): ChatAppTheme {
  if (!rawTheme) return defaultChatTheme;

  if (typeof rawTheme === "string") {
    if (rawTheme === "system" || rawTheme === "light" || rawTheme === "dark") {
      return defaultChatTheme;
    }
    try {
      return { ...defaultChatTheme, ...JSON.parse(rawTheme) };
    } catch {
      return defaultChatTheme;
    }
  }

  if (typeof rawTheme === "object") {
    return { ...defaultChatTheme, ...rawTheme };
  }

  return defaultChatTheme;
}

// Helper function to generate CSS variables
function generateCSSVariables(theme: ChatAppTheme): Record<string, string> {
  return {
    "--color-chat-background":
      theme.colors?.background ||
      defaultChatTheme.colors?.background ||
      "#ffffff",
    "--color-chat-foreground":
      theme.colors?.text || defaultChatTheme.colors?.text || "#000000",
    "--color-chat-primary":
      theme.colors?.primary || defaultChatTheme.colors?.primary || "#0066cc",
    "--color-chat-secondary":
      theme.colors?.secondary ||
      defaultChatTheme.colors?.secondary ||
      "#f5f5f5",
    "--color-chat-border":
      theme.borders?.color || defaultChatTheme.borders?.color || "#e0e0e0",
  };
}

// Initial state factory
const createInitialState = (): ThemeState => {
  const parsedTheme = parseTheme(null);
  return {
    rawTheme: null,
    parsedTheme,
    cssVariables: generateCSSVariables(parsedTheme),
    isEditorOpen: false,
  };
};

// Theme store
export const themeStore = createStore({
  context: createInitialState(),
  on: {
    updateRawTheme: (context, event: { rawTheme: string | object | null }) => {
      const parsedTheme = parseTheme(event.rawTheme);
      return {
        ...context,
        rawTheme: event.rawTheme,
        parsedTheme,
        cssVariables: generateCSSVariables(parsedTheme),
      };
    },

    updateParsedTheme: (context, event: { theme: ChatAppTheme }) => ({
      ...context,
      parsedTheme: event.theme,
      cssVariables: generateCSSVariables(event.theme),
    }),

    openEditor: (context) => ({
      ...context,
      isEditorOpen: true,
    }),

    closeEditor: (context) => ({
      ...context,
      isEditorOpen: false,
    }),

    toggleEditor: (context) => ({
      ...context,
      isEditorOpen: !context.isEditorOpen,
    }),
  },
});

// Hook for components to use theme store
export function useThemeStore() {
  const store = useStore(themeStore);
  return store.context || createInitialState();
}

// Hook for just parsed theme (most common use case)
export function useParsedTheme() {
  const store = useStore(themeStore);
  return store.context?.parsedTheme || defaultChatTheme;
}

// Hook for CSS variables
export function useThemeCSSVariables() {
  const store = useStore(themeStore);
  return store.context?.cssVariables || generateCSSVariables(defaultChatTheme);
}
