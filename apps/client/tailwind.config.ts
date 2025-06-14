import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/features/**/*.{js,ts,jsx,tsx,mdx}",
    "../../packages/ui/src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontSize: {
        xxs: ["0.625rem", { lineHeight: "1rem" }], // 10px
      },
      colors: {
        // Chat theme colors using CSS variables
        "chat-background": "var(--color-chat-background, #ffffff)",
        "chat-foreground": "var(--color-chat-foreground, #000000)",
        "chat-primary": "var(--color-chat-primary, #0ea5e9)",
        "chat-secondary": "var(--color-chat-secondary, #64748b)",
        "chat-border": "var(--color-chat-border, #e2e8f0)",
        "chat-user-area": "var(--color-chat-user-area, #f8fafc)",
        "chat-bubble-user": "var(--color-chat-bubble-user, #0ea5e9)",
        "chat-bubble-agent": "var(--color-chat-bubble-agent, #64748b)",
        "chat-header-bg": "var(--color-chat-header-bg, #f8fafc)",
        "chat-header-text": "var(--color-chat-header-text, #000000)",
      },
    },
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
};

export default config;
