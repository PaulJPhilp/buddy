# Buddy ChatApp Style Guide

**Version:** 1.0
**Date:** May 14, 2025

## 1. Core Visual Principles

*   **Compactness:** The primary visual goal is a compact design. This means prioritizing information density while maintaining usability. UI elements should be sized and spaced to make efficient use of screen real estate.
*   **Consistency:** Apply spacing, typography, color, and border styles uniformly across all components.
*   **Clarity:** Ensure that even with a compact design, the UI remains clear, readable, and easy to understand.
*   **Minimalism:** Avoid unnecessary visual clutter. Focus on essential elements and functionality.

## 2. Tailwind CSS Customization

The `tailwind.config.ts` file has been updated to support the compactness principle. Key customizations include:

*   **Spacing Scale:** A new, more granular spacing scale has been introduced. Use these values for margins, paddings, and gaps to maintain consistency.
    *   `px`: 1px
    *   `0.5`: 0.125rem (2px)
    *   `1`: 0.25rem (4px)
    *   `1.5`: 0.375rem (6px)
    *   `2`: 0.5rem (8px)
    *   `2.5`: 0.625rem (10px)
    *   `3`: 0.75rem (12px)
    *   `3.5`: 0.875rem (14px)
    *   `4`: 1rem (16px)
    *   *(Refer to `tailwind.config.ts` for the full scale)*
*   **Font Size Scale:** A new font size scale has been introduced to allow for smaller text where appropriate, enhancing information density.
    *   `xs`: 0.75rem (12px)
    *   `sm`: 0.875rem (14px)
    *   `base`: 1rem (16px)
    *   *(Refer to `tailwind.config.ts` for the full scale)*

## 3. Component-Level Guidelines

*   **Buttons:**
    *   Default padding: `py-1 px-2` or `py-0.5 px-1.5` for very small buttons.
    *   Font size: `text-sm` or `text-xs`.
*   **Inputs (Text Areas, Selects):**
    *   Default padding: `py-1 px-2`.
    *   Font size: `text-sm` or `text-base`.
    *   Border: `border border-border`.
*   **Cards/Containers:**
    *   Padding: `p-2` or `p-3`.
    *   Border Radius: Use `rounded-md` or `rounded-sm` from the theme.
*   **Icons:**
    *   Typically use `w-4 h-4` (1rem/16px) or `w-3.5 h-3.5` (0.875rem/14px) for compact contexts.
*   **Text:**
    *   Prioritize `text-sm` for general UI text and `text-xs` for secondary information or labels where space is very limited. `text-base` should be used sparingly for primary content if `text-sm` is too small.

## 4. Color Palette

*   Refer to the `colors` section in `tailwind.config.ts` for the defined color palette (e.g., `primary`, `secondary`, `border`, `background`, `foreground`).
*   Ensure sufficient contrast, especially for text on backgrounds, to maintain accessibility.

## 5. Borders

*   Use `border-border` for standard component borders.
*   Default border width: `border` (1px).

## 6. Reference Examples (To be added)

*   This section will include visual examples or links to Storybook/Figma for common compact UI patterns (e.g., compact tables, dense lists, minimal forms).

## 7. General Rules for Compactness

*   Minimize whitespace where possible without sacrificing readability.
*   Use smaller font sizes for labels and secondary information.
*   Opt for icons instead of text for actions when the meaning is clear.
*   Consider using more condensed UI elements (e.g., smaller buttons, tighter list item spacing).
*   Regularly review components to identify opportunities for reducing size or improving information density.

This document serves as the initial guide. It will be updated as the project evolves and more specific patterns are established.
