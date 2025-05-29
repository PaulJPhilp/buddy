# Theme System Testing Guide

## Quick Test URLs

After running `bun dev`, visit these URLs:

1. **Primary Test Page**: `http://localhost:3000/theme-test`
2. **Side-by-side Test**: `http://localhost:3000/test-chat-instance`

## Hydration Fix Applied ✅

**Fixed Issue**: Hydration error where server rendered HTML didn't match client
**Solution**: Added proper client-side mount detection with loading states

### What You'll See Now:
- Brief loading state on initial page load (prevents hydration mismatch)
- Smooth transition to interactive theme switching
- No more hydration warnings in console

## Testing Checklist

### 1. Theme Switching (theme-test page)
- [ ] Page loads with brief loading state (this is normal and expected)
- [ ] Theme buttons become active after loading
- [ ] Default theme loads correctly
- [ ] "Spike Dark" button switches to dark blue theme
- [ ] "Minimal Test" button switches to bright green theme
- [ ] Theme changes are immediately visible in chat interface
- [ ] Color swatches update to match selected theme
- [ ] No hydration errors in browser console

### 2. Visual Elements to Verify

#### Chat Background & Foreground
- [ ] Background color changes with theme
- [ ] Text remains readable with proper contrast
- [ ] Borders and dividers are visible

#### Chat Bubbles
- [ ] User bubbles use theme's primary color
- [ ] Agent bubbles use theme's secondary color
- [ ] Text in bubbles has proper contrast

#### User Input Area
- [ ] Input area background matches theme
- [ ] Text input is properly styled
- [ ] Send button reflects theme colors

#### Header Area
- [ ] Header uses theme's primary color
- [ ] Header text is readable

### 3. Theme-Specific Tests

#### Default Theme
- [ ] Light background (white/near-white)
- [ ] Dark text for readability
- [ ] Blue-ish accent colors

#### Spike Dark Theme
- [ ] Dark blue background
- [ ] Light text
- [ ] Blue accent colors with good contrast

#### Minimal Test Theme
- [ ] Bright green background (should be very obvious)
- [ ] White text
- [ ] Dark blue and light green accents
- [ ] Red borders (very noticeable for testing)

### 4. Component Integration Tests

- [ ] Theme applies to all chat components
- [ ] No CSS variable fallbacks showing
- [ ] All Tailwind classes resolve correctly
- [ ] No console errors related to CSS
- [ ] No hydration warnings in console ✅

### 5. Responsive Testing

- [ ] Themes work on mobile widths
- [ ] Themes work on tablet widths
- [ ] Themes work on desktop widths

## Debugging

### Check CSS Variables
Open browser dev tools and inspect elements. You should see:
```css
--color-chat-background: oklch(...)
--color-chat-primary: oklch(...)
/* etc. */
```

### Check Data Attributes
Chat container should have:
```html
<div data-chat-theme="spike-dark">
  <!-- or other theme name -->
</div>
```

### Common Issues
1. **Theme not applying**: Check data-chat-theme attribute is set
2. **Colors not changing**: Verify CSS custom properties are defined
3. **Build errors**: Check Tailwind config is properly set up
4. **Hydration errors**: ✅ Fixed with proper mount detection

## Creating New Themes

To add a new theme:

1. Add CSS block in `apps/client/src/app/globals.css`:
```css
[data-chat-theme="my-theme"] {
  --color-chat-background: oklch(...);
  --color-chat-foreground: oklch(...);
  /* ... other colors */
}
```

2. Add to theme selector in `ThemeTestComponent.tsx`:
```typescript
const themes = [
  // ... existing themes
  { value: "my-theme", label: "My Theme" },
];
```

3. Test the new theme using the theme test page

## Expected Loading Behavior

Due to hydration protection:
1. **Initial Load**: Brief loading skeleton while React mounts
2. **Theme Ready**: Buttons become active, themes work immediately
3. **No Hydration Errors**: Clean console, no React warnings

This loading state is intentional and prevents hydration mismatches! 