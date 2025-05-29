export interface ChatAppColors {
  primary: string; // Tailwind color name, e.g., "blue-500"
  secondary: string; // Tailwind color name, e.g., "gray-700"
  accent?: string; // Tailwind color name, e.g., "green-500"
  background?: string; // Tailwind color name for the main chat area background (default: "white")
  text?: string; // Tailwind color name for default text on main background (default: "gray-800")

  // Contrast-derived text colors (internal, not directly set by user but derived)
  // We'll strive to derive these, but might need overrides in complex themes
  // textOnPrimary?: string;
  // textOnSecondary?: string;
  // textOnAccent?: string;
}

export interface ChatAppBorders {
  // For the main ChatApp container
  color?: string; // Tailwind color name, e.g., "gray-300"
  thickness?: string; // e.g., "1px", "2px", Tailwind: "border", "border-2"
  radius?: string; // e.g., "0.5rem", Tailwind: "rounded-md", "rounded-lg"
}

export interface ChatAppBubbleTheme {
  background?: string; // Tailwind color name
  text?: string; // Tailwind color name (or "auto" for contrast)
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
    agent: { background: "colors.secondary", text: "auto", radius: "rounded-xl" },
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
    text: "slate-100",   // Light text for dark mode
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