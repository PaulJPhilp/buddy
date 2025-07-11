/**
 * Color utility functions for calculating contrast colors and other color operations
 */

/**
 * Convert sRGB color component to linear RGB
 * @param c - Color component value (0-1)
 * @returns Linear RGB value
 */
function sRGBToLinear(c: number): number {
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

/**
 * Calculate the relative luminance of a color using WCAG formula
 * @param r - Red component (0-255)
 * @param g - Green component (0-255)
 * @param b - Blue component (0-255)
 * @returns Relative luminance (0-1)
 */
function calculateRelativeLuminance(r: number, g: number, b: number): number {
  // Convert to 0-1 range
  const rNorm = r / 255;
  const gNorm = g / 255;
  const bNorm = b / 255;

  // Apply gamma correction
  const rLinear = sRGBToLinear(rNorm);
  const gLinear = sRGBToLinear(gNorm);
  const bLinear = sRGBToLinear(bNorm);

  // Calculate relative luminance using WCAG coefficients
  return 0.2126 * rLinear + 0.7152 * gLinear + 0.0722 * bLinear;
}

/**
 * Calculate the appropriate contrast color (black or white) for a given hex color
 * Uses WCAG relative luminance formula to determine if text should be dark or light
 *
 * @param hexColor - Hex color string (with or without #)
 * @returns '#000000' for light backgrounds, '#ffffff' for dark backgrounds
 */
export function calculateContrastColor(hexColor: string): string {
  // Remove # if present and handle short hex codes
  const color = hexColor.replace("#", "");

  // Handle 3-digit hex codes by expanding them
  const fullColor =
    color.length === 3
      ? color
          .split("")
          .map((c) => c + c)
          .join("")
      : color;

  // Validate hex color format
  if (!/^[0-9A-Fa-f]{6}$/.test(fullColor)) {
    console.warn(`Invalid hex color: ${hexColor}, using default contrast`);
    return "#ffffff";
  }

  // Convert to RGB
  const r = Number.parseInt(fullColor.substr(0, 2), 16);
  const g = Number.parseInt(fullColor.substr(2, 2), 16);
  const b = Number.parseInt(fullColor.substr(4, 2), 16);

  // Calculate relative luminance using WCAG formula
  const luminance = calculateRelativeLuminance(r, g, b);

  // Return white for dark colors, black for light colors
  // Using 0.5 as threshold for good contrast
  return luminance > 0.5 ? "#000000" : "#ffffff";
}

/**
 * Check if a color is considered "light" (luminance > 0.5)
 *
 * @param hexColor - Hex color string (with or without #)
 * @returns true if the color is light, false if dark
 */
export function isLightColor(hexColor: string): boolean {
  return calculateContrastColor(hexColor) === "#000000";
}

/**
 * Check if a color is considered "dark" (luminance <= 0.5)
 *
 * @param hexColor - Hex color string (with or without #)
 * @returns true if the color is dark, false if light
 */
export function isDarkColor(hexColor: string): boolean {
  return calculateContrastColor(hexColor) === "#ffffff";
}

/**
 * Get the luminance value of a color (0-1 scale)
 *
 * @param hexColor - Hex color string (with or without #)
 * @returns Luminance value between 0 and 1
 */
export function getLuminance(hexColor: string): number {
  const color = hexColor.replace("#", "");
  const fullColor =
    color.length === 3
      ? color
          .split("")
          .map((c) => c + c)
          .join("")
      : color;

  if (!/^[0-9A-Fa-f]{6}$/.test(fullColor)) {
    return 0.5; // Default middle luminance for invalid colors
  }

  const r = Number.parseInt(fullColor.substr(0, 2), 16);
  const g = Number.parseInt(fullColor.substr(2, 2), 16);
  const b = Number.parseInt(fullColor.substr(4, 2), 16);

  return calculateRelativeLuminance(r, g, b);
}
