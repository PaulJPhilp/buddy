import { ChatAppColors, ChatAppTheme } from "./themeTypes";

/**
 * Validates if a theme object is a valid ChatAppTheme
 */
export function isValidChatAppTheme(theme: any): theme is ChatAppTheme {
  if (!theme || typeof theme !== "object") return false;
  if (!theme.colors || typeof theme.colors !== "object") return false;
  if (typeof theme.colors.primary !== "string") return false;
  if (typeof theme.colors.secondary !== "string") return false;
  return true;
}

/**
 * Converts CSS variable string to a ChatAppTheme object
 * @param cssString CSS variable string (e.g. from exported theme)
 */
export function cssToThemeObject(cssString: string): ChatAppTheme | null {
  try {
    // Extract CSS variables
    const extractVar = (cssVarName: string): string | undefined => {
      const regex = new RegExp(`${cssVarName}:\s*([^;\s]+)`);
      const match = cssString.match(regex);
      return match && match[1] ? match[1].trim() : undefined;
    };

    // Extract theme colors from CSS variables
    const background = extractVar("--color-chat-background");
    const foreground =
      extractVar("--color-chat-foreground") || extractVar("--color-chat-text");
    const primary = extractVar("--color-chat-primary");
    const secondary = extractVar("--color-chat-secondary");
    const border = extractVar("--color-chat-border");
    const userAreaBg = extractVar("--color-chat-user-area");
    const bubbleUserBg = extractVar("--color-chat-bubble-user");
    const bubbleAgentBg = extractVar("--color-chat-bubble-agent");
    const headerBg = extractVar("--color-chat-header-bg");
    const headerText = extractVar("--color-chat-header-text");

    // Ensure required properties exist
    if (!primary || !secondary || !background || !foreground) {
      return null;
    }

    // Create a ChatAppTheme object
    return {
      colors: {
        primary,
        secondary,
        background,
        text: foreground,
        border: border,
      },
      borders: {
        color: border,
        thickness: "1px",
        radius: "0.5rem",
      },
      bubbles: {
        user: {
          background: bubbleUserBg || primary,
          text: "auto",
          radius: "rounded-xl",
        },
        agent: {
          background: bubbleAgentBg || secondary,
          text: "auto",
          radius: "rounded-xl",
        },
      },
      userArea: {
        background: userAreaBg || "gray-50",
      },
      header: {
        background: headerBg || primary,
        text: headerText || "auto",
      },
      typography: {
        fontFamily: "sans-serif",
        fontSize: "1rem",
      },
    };
  } catch (error) {
    console.error("Error parsing CSS to theme:", error);
    return null;
  }
}

/**
 * Converts ChatAppTheme to CSS variables string
 */
export function themeToCss(theme: ChatAppTheme): string {
  return `:root {
  --color-chat-background: ${theme.colors.background};
  --color-chat-text: ${theme.colors.text};
  --color-chat-foreground: ${theme.colors.text};
  --color-chat-primary: ${theme.colors.primary};
  --color-chat-secondary: ${theme.colors.secondary};
  --color-chat-border: ${theme.borders?.color || theme.colors.border || ""};
  --color-chat-user-area: ${theme.userArea?.background || ""};
  --color-chat-bubble-user: ${theme.bubbles?.user?.background || theme.colors.primary};
  --color-chat-bubble-agent: ${theme.bubbles?.agent?.background || theme.colors.secondary};
  --color-chat-header-bg: ${theme.header?.background || theme.colors.primary};
  --color-chat-header-text: ${theme.header?.text || "auto"};
}`;
}

/**
 * Checks if a color value is valid
 */
export function isValidColor(color: string): boolean {
  // Basic validation for hex, rgb, rgba, hsl, hsla
  const colorRegex = /^(#[0-9A-Fa-f]{3,8}|(rgb|hsl)a?\(.*\))$/;
  return colorRegex.test(color);
}

/**
 * Generates a contrasting text color (black or white) based on background color
 */
export function getContrastTextColor(backgroundColor: string): string {
  // Simple implementation - for hex colors only
  if (backgroundColor.startsWith("#")) {
    let hex = backgroundColor.substring(1);

    // Convert short hex to full hex
    if (hex.length === 3) {
      hex = hex
        .split("")
        .map((char) => char + char)
        .join("");
    }

    // Convert hex to RGB
    const r = Number.parseInt(hex.substring(0, 2), 16);
    const g = Number.parseInt(hex.substring(2, 4), 16);
    const b = Number.parseInt(hex.substring(4, 6), 16);

    // Calculate luminance - simplified formula
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

    // Return white for dark backgrounds, black for light backgrounds
    return luminance > 0.5 ? "#000000" : "#ffffff";
  }

  // Default to black if not a hex color
  return "#000000";
}
