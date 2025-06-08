// Use the canonical ThemeColor type for all chat theme color objects
export type ThemeColor = string; // e.g., '#fff', 'rgb(255,255,255)', 'var(--color-primary)'

/**
 * Canonical typography settings for chat themes.
 * Add more fields as needed for richer font control.
 */
export interface ThemeTypography {
  /** Main font family for all text */
  fontFamily: string;
  /** Base font size (e.g., '16px') */
  fontSize: string;
  /** Base font weight (e.g., '400') */
  fontWeight?: string;
  /** Font family for headings (optional) */
  headingFamily?: string;
  /** Font weight for headings (optional) */
  headingWeight?: string;
  /** Monospace font family (optional) */
  monospaceFamily?: string;
  /** Line height (optional, e.g., '1.5') */
  lineHeight?: string;
  /** Letter spacing (optional, e.g., '0.01em') */
  letterSpacing?: string;
}

/**
 * Section color structure for backgrounds, text, and borders.
 */
export interface SectionColors {
  background: ThemeColor;
  text?: ThemeColor;
  border?: ThemeColor;
}

/**
 * Bubble color structure for user/agent bubbles.
 */
export interface BubbleColors {
  background: ThemeColor;
  text: ThemeColor;
}

/**
 * Icon set for toolbars, attachments, etc.
 */
export interface IconSet {
  color: ThemeColor;
  size: string;
  textColor?: ThemeColor;
  textBackground?: ThemeColor;
  radius?: string; // Tailwind border radius class e.g. "rounded-xl"
}

export interface ChatAppUserAreaTheme {
  background?: string; // Tailwind color name
  // Toolbar (attachment, agent) background will be this.
  // Icon/text colors within toolbars will aim for auto-contrast or use primary/secondary.
  inputRingColor?: string; // Tailwind color for focus ring (default: accent or primary)
}

export interface ChatAppHeaderTheme {
  background?: string; // Tailwind color name (default: primary)
  text?: string; // Tailwind color name (or "auto" for contrast)
}

export interface ChatAppColors {
  primary?: string;
  secondary?: string;
  background?: string;
  text?: string;
  border?: string;
  accent?: string;
  error?: string;
  success?: string;
  warning?: string;
}

export interface ChatAppBubbleTheme {
  background?: string;
  text?: string;
  border?: string;
  borderRadius?: string;
  radius?: string; // For backwards compatibility
  padding?: string;
}

export interface ChatAppUserAreaTheme {
  background?: string;
  inputBackground?: string;
  inputText?: string;
  inputBorder?: string;
  buttonBackground?: string;
  buttonText?: string;
}

export interface ChatAppHeaderTheme {
  background?: string;
  text?: string;
  border?: string;
}

export interface ChatAppBorders {
  width?: string;
  thickness?: string; // For backward compatibility
  style?: string;
  color?: string;
  radius?: string;
}

export interface ChatAppTypography {
  fontFamily?: string; // e.g., "Inter, sans-serif", "Roboto Mono, monospace"
  fontSize?: string; // e.g., "14px", "1rem", Tailwind: "text-sm", "text-base"
  // More specific font sizes can be added here if needed, e.g., for header, bubbles, input
  // headerFontSize?: string;
  // bubbleFontSize?: string;
  // inputFontSize?: string;
}

export interface ChatAppTheme {
  colors: ChatAppColors;
  borders?: ChatAppBorders; // Optional: for the main ChatApp container
  bubbles?: {
    user?: ChatAppBubbleTheme;
    agent?: ChatAppBubbleTheme;
  };
  userArea?: ChatAppUserAreaTheme;
  header?: ChatAppHeaderTheme;
  typography?: ChatAppTypography;
}

// Example Default Theme (conceptual, will be implemented in ChatApp.tsx or a theme provider)
export const defaultChatTheme: ChatAppTheme = {
  colors: {
    primary: "blue-500",
    secondary: "gray-200", // Often used as a light background or accent
    accent: "blue-600",
    background: "white",
    text: "gray-800",
  },
  borders: {
    color: "gray-300",
    thickness: "border", // Tailwind class for 1px border
    radius: "rounded-lg",
  },
  bubbles: {
    user: {
      background: "colors.primary", // Special value to reference another theme color
      text: "auto", // Indicates auto-contrast
      radius: "rounded-xl",
    },
    agent: {
      background: "colors.secondary", // e.g. light gray
      text: "auto",
      radius: "rounded-xl",
    },
  },
  userArea: {
    background: "gray-50",
    inputRingColor: "colors.accent",
  },
  header: {
    background: "colors.primary",
    text: "auto",
  },
  typography: {
    fontFamily: "sans-serif", // A generic fallback
    fontSize: "1rem", // Direct CSS value, typically equivalent to browser default 16px
  },
};

export const lightChatThemeExample: ChatAppTheme = {
  colors: {
    primary: "blue-500",
    secondary: "gray-100",
    accent: "blue-600",
    background: "white",
    text: "gray-900",
  },
  borders: {
    color: "gray-300",
    thickness: "1px",
    radius: "0.5rem",
  },
  bubbles: {
    user: { background: "colors.primary", text: "auto", radius: "rounded-xl" },
    agent: {
      background: "colors.secondary",
      text: "auto",
      radius: "rounded-xl",
    },
  },
  userArea: {
    background: "gray-50",
    inputRingColor: "colors.accent",
  },
  header: {
    background: "colors.primary",
    text: "auto",
  },
  typography: {
    fontFamily: "Inter, sans-serif",
    fontSize: "1rem",
  },
};

export const darkChatThemeExample: ChatAppTheme = {
  colors: {
    primary: "sky-400", // A lighter blue for dark mode
    secondary: "slate-700", // Darker secondary for bubble backgrounds etc.
    accent: "sky-500",
    background: "slate-900", // Main background for dark mode
    text: "slate-100", // Light text for dark mode
  },
  borders: {
    color: "slate-600",
    thickness: "1px",
    radius: "0.5rem",
  },
  bubbles: {
    user: { background: "colors.primary", text: "auto", radius: "rounded-xl" },
    // Agent bubbles on dark theme might need a slightly lighter or distinct background than userArea
    agent: { background: "slate-600", text: "auto", radius: "rounded-xl" },
  },
  userArea: {
    background: "slate-800", // Darker user area
    inputRingColor: "colors.accent",
  },
  header: {
    background: "colors.primary",
    text: "auto",
  },
  typography: {
    fontFamily: "Inter, sans-serif",
    fontSize: "1rem",
  },
};
