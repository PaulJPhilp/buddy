/**
 * Defines the set of CSS class strings for a single ToolBar variant.
 * These will typically be Tailwind CSS utility classes.
 */
export interface ToolBarVariantStyleConfig {
  /** Classes for the main ToolBar container (the root div). */
  containerClasses: string;
  /** Classes for each individual command item wrapper. */
  itemClasses: string;
  /** Classes specifically for the icon within a command item. */
  iconClasses: string;
  /** Classes for the text label within a command item. */
  labelClasses: string;
  /** Classes for the tooltip (if rendered by the component, or for styling an external one). */
  tooltipClasses?: string; // Optional, as tooltips might be handled by a separate library
  /** Classes for disabled command items. */
  disabledItemClasses: string;
  /** Classes for the spacer elements (e.g., if they need more than just flex-grow). */
  spacerClasses: string;
}

/**
 * Defines the structure for the collection of all ToolBar style variants.
 * It maps a variant name (e.g., "default", "tiny") to its specific style configuration.
 */
export interface ToolBarVariantStyles {
  [variantName: string]: ToolBarVariantStyleConfig;
}

/**
 * The actual style configurations for different ToolBar variants.
 *
 * Remember:
 * - Use Tailwind CSS v4.x classes.
 * - Ensure these classes provide a good default appearance and behavior.
 * - `primaryColor` and `secondaryColor` (and their active states) will likely be
 *   handled via inline styles or CSS variables injected based on props,
 *   so these classes should focus on layout, spacing, typography, borders,
 *   backgrounds (where not color-theme dependent), and interaction states.
 */
export const toolbarVariantStyles: ToolBarVariantStyles = {
  default: {
    containerClasses: 'flex items-center p-1.5 space-x-1.5 rounded-md bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700',
    itemClasses: 'flex items-center justify-center p-1.5 rounded-md hover:bg-neutral-200 dark:hover:bg-neutral-700 focus-visible:ring-2 focus-visible:ring-blue-500 focus:outline-none transition-colors',
    iconClasses: 'h-5 w-5 text-neutral-700 dark:text-neutral-300', // Default icon size & color
    labelClasses: 'ml-1.5 text-sm text-neutral-700 dark:text-neutral-300',
    disabledItemClasses: 'opacity-50 cursor-not-allowed',
    spacerClasses: 'flex-grow', // Essential for spacer functionality
    tooltipClasses: 'px-2 py-1 text-xs bg-neutral-900 text-white rounded-md shadow-lg dark:bg-neutral-700 dark:text-neutral-100',
  },
  tiny: {
    containerClasses: 'flex items-center p-1 space-x-1 rounded bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700',
    itemClasses: 'flex items-center justify-center p-1 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700 focus-visible:ring-1 focus-visible:ring-blue-500 focus:outline-none transition-colors',
    iconClasses: 'h-4 w-4 text-neutral-700 dark:text-neutral-300',
    labelClasses: 'ml-1 text-xs text-neutral-700 dark:text-neutral-300',
    disabledItemClasses: 'opacity-50 cursor-not-allowed',
    spacerClasses: 'flex-grow',
    tooltipClasses: 'px-1.5 py-0.5 text-xs bg-neutral-900 text-white rounded shadow-lg dark:bg-neutral-700 dark:text-neutral-100',
  },
  // Add more variants here as needed, e.g., 'compact', 'menu-item-like'
};

/**
 * Default variant name to use if `ToolBarProps.variant` is not specified.
 */
export const DEFAULT_TOOLBAR_VARIANT = 'default';
