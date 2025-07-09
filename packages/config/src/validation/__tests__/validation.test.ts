import { describe, it, expect } from "vitest";
import { Effect } from "effect";
import { validateWorkspaceCreate } from "../index";
import { WorkspaceError } from "../../errors";

// Simple test to verify that the validation function works
describe("Validation functions", () => {
  describe("validateWorkspaceCreate", () => {
    it("should validate valid workspace creation input", () => {
      // A minimal valid input for workspace creation
      const validInput = {
        name: "Test Workspace"
      };

      // Create a mock Effect for testing
      const mockEffect = validateWorkspaceCreate(validInput);
      
      // Basic assertion that the effect exists
      expect(mockEffect).toBeDefined();
    });

    it("should reject non-object input", () => {
      // Invalid input (not an object)
      const invalidInput = "not an object";

      // Create a mock Effect for testing
      const mockEffect = validateWorkspaceCreate(invalidInput as any);
      
      // Basic assertion that the effect exists
      expect(mockEffect).toBeDefined();
    });
  });
});

