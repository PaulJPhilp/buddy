import { ChatAppTheme, ChatAppColors } from './themeTypes';
import { ThemeColors } from '@/contexts/ThemeContext';

/**
 * Validates if a theme object is a valid ChatAppTheme
 */
export function isValidChatAppTheme(theme: any): theme is ChatAppTheme {
  if (!theme || typeof theme !== 'object') return false;
  if (!theme.colors || typeof theme.colors !== 'object') return false;
  if (typeof theme.colors.primary !== 'string') return false;
  if (typeof theme.colors.secondary !== 'string') return false;
  return true;
}

/**
 * Converts CSS variable string to a theme object
 * @param cssString CSS variable string (e.g. from exported theme)
 */
export function cssToThemeColors(cssString: string): ThemeColors | null {
  try {
    const themeColors: Partial<ThemeColors> = {};
    
    // Extract each CSS variable
    const extractVar = (varName: string, cssVarName: string) => {
      const regex = new RegExp(`${cssVarName}:\s*([^;\s]+)`);
      const match = cssString.match(regex);
      if (match && match[1]) {
        themeColors[varName as keyof ThemeColors] = match[1].trim();
      }
    };
    
    // Map CSS variables to theme properties
    extractVar('background', '--color-chat-background');
    extractVar('foreground', '--color-chat-foreground');
    extractVar('primary', '--color-chat-primary');
    extractVar('secondary', '--color-chat-secondary');
    extractVar('border', '--color-chat-border');
    extractVar('userArea', '--color-chat-user-area');
    extractVar('bubbleUser', '--color-chat-bubble-user');
    extractVar('bubbleAgent', '--color-chat-bubble-agent');
    extractVar('headerBg', '--color-chat-header-bg');
    extractVar('headerText', '--color-chat-header-text');
    
    // Ensure all required properties exist
    const requiredProps: (keyof ThemeColors)[] = [
      'background', 'foreground', 'primary', 'secondary'
    ];
    
    if (requiredProps.every(prop => themeColors[prop])) {
      return themeColors as ThemeColors;
    }
    
    return null;
  } catch (error) {
    console.error('Error parsing CSS to theme:', error);
    return null;
  }
}

/**
 * Converts ThemeColors to CSS variables string
 */
export function themeColorsToCss(theme: ThemeColors): string {
  return `:root {
  --color-chat-background: ${theme.background};
  --color-chat-foreground: ${theme.foreground};
  --color-chat-primary: ${theme.primary};
  --color-chat-secondary: ${theme.secondary};
  --color-chat-border: ${theme.border};
  --color-chat-user-area: ${theme.userArea};
  --color-chat-bubble-user: ${theme.bubbleUser};
  --color-chat-bubble-agent: ${theme.bubbleAgent};
  --color-chat-header-bg: ${theme.headerBg};
  --color-chat-header-text: ${theme.headerText};
}`;
}

/**
 * Checks if a color value is valid
 */
export function isValidColor(color: string): boolean {
  // Basic validation for hex, rgb, rgba, hsl, hsla
  const colorRegex = /^(#[0-9A-Fa-f]{3,8}|(rgb|hsl)a?\(.*\))$/;
  return colorRegex.test(color);
}

/**
 * Generates a contrasting text color (black or white) based on background color
 */
export function getContrastTextColor(backgroundColor: string): string {
  // Simple implementation - for hex colors only
  if (backgroundColor.startsWith('#')) {
    let hex = backgroundColor.substring(1);
    
    // Convert short hex to full hex
    if (hex.length === 3) {
      hex = hex.split('').map(char => char + char).join('');
    }
    
    // Convert hex to RGB
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    
    // Calculate luminance - simplified formula
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    
    // Return white for dark backgrounds, black for light backgrounds
    return luminance > 0.5 ? '#000000' : '#ffffff';
  }
  
  // Default to black if not a hex color
  return '#000000';
}
