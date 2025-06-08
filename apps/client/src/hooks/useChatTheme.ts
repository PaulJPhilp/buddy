import {
  ChatAppTheme,
  defaultChatTheme,
} from "@/features/chat/themes/themeTypes";
import { useMemo } from "react";

export function useChatTheme(
  theme?: Partial<ChatAppTheme> | string,
): ChatAppTheme {
  return useMemo(() => {
    // If no theme is provided, return the default theme
    if (!theme) return defaultChatTheme;

    // Handle string themes (JSON parsing)
    if (typeof theme === "string") {
      try {
        // If it's a named theme, return default theme with that name
        if (["system", "dark", "light"].includes(theme)) {
          return { ...defaultChatTheme, themeName: theme };
        }
        // Otherwise try to parse as JSON
        return { ...defaultChatTheme, ...JSON.parse(theme) };
      } catch (e) {
        console.error("Error parsing theme string:", e);
        return defaultChatTheme;
      }
    }

    // Handle object themes with deep merge
    const partialTheme = theme as Partial<ChatAppTheme>;

    // Create a deep merge function that handles nested objects
    const deepMerge = <T extends Record<string, any>>(
      target: T,
      source: Partial<T>,
    ): T => {
      const result = { ...target };

      for (const key in source) {
        if (source[key] !== undefined) {
          if (
            source[key] &&
            typeof source[key] === "object" &&
            !Array.isArray(source[key])
          ) {
            // @ts-ignore - We know these are objects
            result[key] = deepMerge(target[key] || {}, source[key]);
          } else {
            // @ts-ignore - We know the types match
            result[key] = source[key];
          }
        }
      }

      return result;
    };

    // Perform a deep merge of the default theme with the provided theme
    return deepMerge(defaultChatTheme, partialTheme);
  }, [theme]);
}

export default useChatTheme;
