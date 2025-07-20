// import type { ToolbarStyle } from "app/client/src/managers/toolbar/types"; // Adjust path

type ToolbarSize = "xs" | "sm" | "md" | "lg" | "xl";

type SizeStyles = {
  "--button-padding": string;
  "--icon-size": string;
  "--button-border-radius": string;
  "--gap": string;
};

export function getStyleForSize(size: ToolbarSize): SizeStyles {
  switch (size) {
    case "xs":
      return {
        "--button-padding": "0.25rem",
        "--icon-size": "0.75rem", // 12px
        "--button-border-radius": "0.25rem",
        "--gap": "0.125rem",
      };
    case "sm":
      return {
        "--button-padding": "0.375rem",
        "--icon-size": "1rem", // 16px
        "--button-border-radius": "0.375rem",
        "--gap": "0.25rem",
      };
    case "lg":
      return {
        "--button-padding": "0.75rem",
        "--icon-size": "1.5rem", // 24px
        "--button-border-radius": "0.625rem",
        "--gap": "0.5rem",
      };
    case "xl":
      return {
        "--button-padding": "1rem",
        "--icon-size": "1.75rem", // 28px
        "--button-border-radius": "0.75rem",
        "--gap": "0.75rem",
      };
    case "md":
    default:
      return {
        "--button-padding": "0.5rem",
        "--icon-size": "1.25rem", // 20px
        "--button-border-radius": "0.5rem",
        "--gap": "0.375rem",
      };
  }
}
