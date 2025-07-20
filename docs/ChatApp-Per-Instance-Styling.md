# ChatApp Per-Instance Styling System

## Overview

Each ChatApp instance can have its own unique visual appearance through the `style` property in its configuration. This allows for distinct branding and visual identity per ChatApp without needing a complex theming system.

## How It Works

### 1. Configuration-Based Styling
Each ChatApp configuration file (in `public/static/configs/chatapps/`) can include a `style` object that defines the visual appearance:

```json
{
  "id": "creative-writing-chat",
  "name": "Creative Writing",
  "style": {
    "primaryColor": "#8b5cf6",
    "primaryContrastColor": "#ffffff",
    "backgroundColor": "#ffffff",
    "backgroundSecondaryColor": "#f3f4f6",
    "borderColor": "#e5e7eb",
    "borderRadius": "12px",
    "fontFamily": "Georgia, serif",
    "fontSize": "16px"
  }
}
```

### 2. Dynamic CSS Variable Updates
When a ChatApp loads, the `applyChatAppStyling()` function dynamically updates CSS variables to apply the custom styling:

- **Primary Colors**: Headers, buttons, focus states
- **Background Colors**: Chat area, user input area
- **Border Styling**: Colors, radius, width
- **Typography**: Font family, size, weight
- **Message Colors**: User and assistant message bubbles
- **Icon Styling**: Colors and sizes

### 3. Automatic Cleanup
When switching between ChatApps or unmounting, the styling is automatically reset to defaults to prevent style conflicts.

## Available Style Properties

### Colors
- `primaryColor`: Main brand color (buttons, headers, focus states)
- `primaryContrastColor`: Text color on primary backgrounds
- `backgroundColor`: Main background color
- `backgroundSecondaryColor`: Secondary background (user area)
- `borderColor`: Border colors throughout the app
- `userMessageColor`: User message bubble color
- `assistantMessageColor`: Assistant message bubble color
- `inputBackgroundColor`: Input field background
- `inputBorderColor`: Input field border
- `iconColor`: Icon colors
- `shadowColor`: Shadow colors

### Layout & Typography
- `borderRadius`: Corner radius for elements
- `borderWidth`: Border thickness
- `fontFamily`: Font family for text
- `fontSize`: Base font size
- `fontWeight`: Font weight
- `iconSize`: Icon dimensions

### Behavior
- `compactMode`: Enable compact layout
- `showTimestamps`: Show message timestamps
- `showAvatars`: Show user/assistant avatars
- `shadowIntensity`: Shadow intensity ("none", "sm", "md", "lg", "xl")
- `opacity`: Overall opacity

## Example ChatApp Styles

### 1. Cyan Theme (Building AI)
```json
{
  "primaryColor": "#06b6d4",
  "backgroundColor": "#ffffff",
  "backgroundSecondaryColor": "#ecfeff",
  "borderColor": "#cffafe",
  "borderRadius": "0.75rem",
  "fontFamily": "Inter, sans-serif",
  "fontSize": "0.95rem"
}
```

### 2. Purple Theme (Creative Writing)
```json
{
  "primaryColor": "#8b5cf6",
  "backgroundColor": "#ffffff",
  "backgroundSecondaryColor": "#f3f4f6",
  "borderColor": "#e5e7eb",
  "borderRadius": "12px",
  "fontFamily": "Georgia, serif",
  "fontSize": "16px"
}
```

### 3. Green Theme (Financial Advisor)
```json
{
  "primaryColor": "#10b981",
  "backgroundColor": "#ffffff",
  "backgroundSecondaryColor": "#f0fdf4",
  "borderColor": "#bbf7d0",
  "borderRadius": "6px",
  "fontFamily": "Menlo, monospace",
  "fontSize": "14px",
  "compactMode": true
}
```

## Benefits

1. **No Theme System Complexity**: Each ChatApp has its own styling without global theme switching
2. **Unique Branding**: Each ChatApp can have distinct visual identity
3. **Easy Customization**: Simple JSON configuration for styling
4. **Automatic Management**: Styling applied/removed automatically
5. **CSS Variable Based**: Leverages existing CSS variable system
6. **Fallback Handling**: Graceful fallback to defaults when styling is missing

## Technical Implementation

The system uses two main functions:

- `applyChatAppStyling(style)`: Applies custom styling by updating CSS variables
- `resetChatAppStyling()`: Resets all styling to defaults

These are called automatically in the ChatApp component's `useEffect` hook based on the instance configuration. 