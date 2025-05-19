# Buddy ChatApp Style Guide (Compact UI)

## Spacing (for compact layouts)
| Name | Value      | Use Case                  |
|------|------------|---------------------------|
| xxs  | 0.125rem   | Tightest gaps (2px)       |
| xs   | 0.25rem    | Small gaps (4px)          |
| sm   | 0.5rem     | Compact padding (8px)     |
| md   | 0.75rem    | Standard compact (12px)   |
| lg   | 1rem       | Slightly larger (16px)    |

## Font Sizes
| Name | Value      | Use Case                  |
|------|------------|---------------------------|
| xxs  | 0.625rem   | Tiny captions, badges     |
| xs   | 0.75rem    | Compact body, labels      |
| sm   | 0.875rem   | Default compact text      |
| md   | 1rem       | Section headers           |

## Border Radius
| Name | Value      | Use Case                  |
|------|------------|---------------------------|
| xxs  | 1px        | Ultra-compact elements    |
| xs   | 2px        | Compact buttons, inputs   |
| sm   | calc(var(--radius) - 4px) | Small cards |
| md   | calc(var(--radius) - 2px) | Default     |
| lg   | var(--radius) | Large cards, modals     |

## Color Usage
- Use CSS variables for all colors (background, border, muted, accent, etc.)
- Prefer neutral backgrounds and borders for compact, modern look.
- Use Tailwind's `bg-background`, `border`, `text-foreground`, etc. for consistency.

## Example: Compact Button
```jsx
<button className="px-xs py-xxs text-xs rounded-xs bg-background border border-solid border-border">
  Compact Button
</button>
```

## Example: Compact Input
```jsx
<input className="px-xs py-xxs text-xs rounded-xs border border-border bg-background" />
```

## Accessibility
- Ensure color contrast for all text and controls.
- Minimum touch target: 32x32px (even for compact UIs).

---

_This guide should be referenced for all new components and reviewed as part of code review._
