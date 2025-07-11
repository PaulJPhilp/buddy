import { describe, expect, it } from "vitest";
import {
  calculateContrastColor,
  getLuminance,
  isDarkColor,
  isLightColor,
} from "../color-utils";

describe("Color Utilities", () => {
  describe("calculateContrastColor", () => {
    it("should return black for light colors", () => {
      expect(calculateContrastColor("#ffffff")).toBe("#000000"); // white
      expect(calculateContrastColor("#f0f0f0")).toBe("#000000"); // light gray
      expect(calculateContrastColor("#ffff00")).toBe("#000000"); // yellow
      expect(calculateContrastColor("#00ff00")).toBe("#000000"); // green
    });

    it("should return white for dark colors", () => {
      expect(calculateContrastColor("#000000")).toBe("#ffffff"); // black
      expect(calculateContrastColor("#333333")).toBe("#ffffff"); // dark gray
      expect(calculateContrastColor("#0000ff")).toBe("#ffffff"); // blue
      expect(calculateContrastColor("#ff0000")).toBe("#ffffff"); // red
    });

    it("should handle hex colors without # prefix", () => {
      expect(calculateContrastColor("ffffff")).toBe("#000000");
      expect(calculateContrastColor("000000")).toBe("#ffffff");
    });

    it("should handle 3-digit hex codes", () => {
      expect(calculateContrastColor("#fff")).toBe("#000000"); // white
      expect(calculateContrastColor("#000")).toBe("#ffffff"); // black
      expect(calculateContrastColor("f00")).toBe("#ffffff"); // red
    });

    it("should handle invalid hex codes gracefully", () => {
      expect(calculateContrastColor("invalid")).toBe("#ffffff");
      expect(calculateContrastColor("#gggggg")).toBe("#ffffff");
      expect(calculateContrastColor("")).toBe("#ffffff");
    });

    it("should handle specific brand colors correctly", () => {
      expect(calculateContrastColor("#db2777")).toBe("#ffffff"); // pink (dark)
      expect(calculateContrastColor("#ec4899")).toBe("#ffffff"); // pink (medium)
      expect(calculateContrastColor("#fce7f3")).toBe("#000000"); // pink (light)
    });
  });

  describe("isLightColor", () => {
    it("should correctly identify light colors", () => {
      expect(isLightColor("#ffffff")).toBe(true);
      expect(isLightColor("#f0f0f0")).toBe(true);
      expect(isLightColor("#ffff00")).toBe(true);
    });

    it("should correctly identify dark colors", () => {
      expect(isLightColor("#000000")).toBe(false);
      expect(isLightColor("#333333")).toBe(false);
      expect(isLightColor("#db2777")).toBe(false);
    });
  });

  describe("isDarkColor", () => {
    it("should correctly identify dark colors", () => {
      expect(isDarkColor("#000000")).toBe(true);
      expect(isDarkColor("#333333")).toBe(true);
      expect(isDarkColor("#db2777")).toBe(true);
    });

    it("should correctly identify light colors", () => {
      expect(isDarkColor("#ffffff")).toBe(false);
      expect(isDarkColor("#f0f0f0")).toBe(false);
      expect(isDarkColor("#ffff00")).toBe(false);
    });
  });

  describe("getLuminance", () => {
    it("should return correct luminance values", () => {
      expect(getLuminance("#ffffff")).toBe(1); // white should be 1
      expect(getLuminance("#000000")).toBe(0); // black should be 0

      const grayLuminance = getLuminance("#808080");
      // With WCAG formula, gray has lower luminance due to gamma correction
      expect(grayLuminance).toBeGreaterThan(0.2);
      expect(grayLuminance).toBeLessThan(0.25);
    });

    it("should handle invalid colors", () => {
      expect(getLuminance("invalid")).toBe(0.5);
      expect(getLuminance("#gggggg")).toBe(0.5);
    });

    it("should handle 3-digit hex codes", () => {
      expect(getLuminance("#fff")).toBe(1);
      expect(getLuminance("#000")).toBe(0);
    });
  });
});
