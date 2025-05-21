import { cn } from "../lib/utils";

export interface ToolbarStyleConfig {
  container: string;
  item: string;
  icon: string;
  label: string;
  spacer: string;
  disabled: string;
}

export const toolbarVariantStyles: Record<string, ToolbarStyleConfig> = {
  default: {
    container: "flex items-center gap-2 p-2",
    item: "flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
    icon: "h-5 w-5",
    label: "hidden sm:inline-block",
    spacer: "flex-grow",
    disabled: "opacity-50 cursor-not-allowed",
  },
  compact: {
    container: "flex items-center gap-1 p-1",
    item: "flex items-center gap-1 rounded-md px-1.5 py-1 text-xs font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
    icon: "h-4 w-4",
    label: "hidden",
    spacer: "flex-grow",
    disabled: "opacity-50 cursor-not-allowed",
  },
  tiny: {
    container: "flex items-center gap-0.5 p-0.5",
    item: "flex items-center rounded-sm px-1 py-0.5 text-xs font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
    icon: "h-3.5 w-3.5",
    label: "hidden",
    spacer: "flex-grow",
    disabled: "opacity-50 cursor-not-allowed",
  },
};

export const getToolbarStyles = (
  variant: keyof typeof toolbarVariantStyles = "default",
  className?: string,
): ToolbarStyleConfig => {
  const styles = toolbarVariantStyles[variant] || toolbarVariantStyles.default;
  return {
    ...styles,
    container: cn(styles.container, className),
  };
};
