import type { Config } from "tailwindcss";
// import plugin from "tailwindcss/plugin"; // No longer needed for addBase themes

const config: Config = {
  content: [
    "./apps/**/*.{js,ts,jsx,tsx,mdx}",
    "./packages/**/*.{js,ts,jsx,tsx,mdx}",
    "./apps/client/src/features/chat/ChatApp.tsx",
    "./apps/client/src/components/debug/ThemeTestComponent.tsx",
  ],
  plugins: [
    require("tailwindcss-animate"),
    require("@tailwindcss/typography"),
    require("@tailwindcss/forms"),
    // plugin(({ addBase }) => { ... removed ... }), // Custom plugin removed
  ],
} as const;

export default config;
