import { Effect, Layer } from "effect";
import { beforeEach, describe, expect, it } from "vitest";
import { ContextEngineeringManager } from "../service";
import { NamedFile, NamedPrompt } from "../types";

describe("ContextEngineeringManager Integration", () => {
  let manager: ContextEngineeringManager;

  beforeEach(async () => {
    const testLayer = Layer.mergeAll(ContextEngineeringManager.Default);

    manager = await Effect.runPromise(
      Effect.gen(function* () {
        return yield* ContextEngineeringManager;
      }).pipe(Effect.provide(testLayer))
    );
  });

  it("should initialize and manage context elements", async () => {
    // Initialize the manager
    await Effect.runPromise(
      manager.initialize({
        chatAppId: "test-chat-app",
        autoSave: true,
        maxElementsPerSection: 10,
        enableReordering: true,
      })
    );

    // Create test elements
    const testPrompt = new NamedPrompt({
      _tag: "NamedPrompt",
      id: "test-prompt-1",
      name: "Test Prompt",
      content: "You are a helpful assistant.",
    });

    const testFile = new NamedFile({
      _tag: "NamedFile",
      id: "test-file-1",
      name: "Test File",
      fileId: "file-123",
    });

    // Add elements to pre-prompt
    await Effect.runPromise(manager.addPrePromptElement(testPrompt));
    await Effect.runPromise(manager.addPrePromptElement(testFile));

    // Add elements to post-prompt
    const postPrompt = new NamedPrompt({
      _tag: "NamedPrompt",
      id: "post-prompt-1",
      name: "Post Prompt",
      content: "Please be concise in your response.",
    });
    await Effect.runPromise(manager.addPostPromptElement(postPrompt));

    // Get final context
    const finalContext = await Effect.runPromise(
      manager.getFinalContext("What is the weather like?", [
        "weather-data.json",
      ])
    );

    // Verify the context structure
    expect(finalContext).toBeDefined();
    expect(finalContext.prePrompt).toHaveLength(2);
    expect(finalContext.userPrompt).toBe("What is the weather like?");
    expect(finalContext.userAttachedFiles).toEqual(["weather-data.json"]);
    expect(finalContext.postPrompt).toHaveLength(1);

    // Verify pre-prompt elements
    expect(finalContext.prePrompt[0]).toEqual(testPrompt);
    expect(finalContext.prePrompt[1]).toEqual(testFile);

    // Verify post-prompt elements
    expect(finalContext.postPrompt[0]).toEqual(postPrompt);

    // Get stats
    const stats = await Effect.runPromise(manager.getStats());
    expect(stats.totalElements).toBe(3);
    expect(stats.prePromptCount).toBe(2);
    expect(stats.postPromptCount).toBe(1);
    expect(stats.namedPromptsCount).toBe(2);
    expect(stats.namedFilesCount).toBe(1);
  });

  it("should handle element reordering", async () => {
    await Effect.runPromise(
      manager.initialize({
        chatAppId: "test-chat-app-2",
        autoSave: true,
        maxElementsPerSection: 10,
        enableReordering: true,
      })
    );

    // Add multiple elements
    const prompt1 = new NamedPrompt({
      _tag: "NamedPrompt",
      id: "prompt-1",
      name: "First Prompt",
      content: "First prompt content",
    });

    const prompt2 = new NamedPrompt({
      _tag: "NamedPrompt",
      id: "prompt-2",
      name: "Second Prompt",
      content: "Second prompt content",
    });

    const prompt3 = new NamedPrompt({
      _tag: "NamedPrompt",
      id: "prompt-3",
      name: "Third Prompt",
      content: "Third prompt content",
    });

    await Effect.runPromise(manager.addPrePromptElement(prompt1));
    await Effect.runPromise(manager.addPrePromptElement(prompt2));
    await Effect.runPromise(manager.addPrePromptElement(prompt3));

    // Reorder elements
    await Effect.runPromise(
      manager.reorderPrePromptElements(["prompt-3", "prompt-1", "prompt-2"])
    );

    // Get final context to verify order
    const finalContext = await Effect.runPromise(
      manager.getFinalContext("Test message", [])
    );

    expect(finalContext.prePrompt[0].id).toBe("prompt-3");
    expect(finalContext.prePrompt[1].id).toBe("prompt-1");
    expect(finalContext.prePrompt[2].id).toBe("prompt-2");
  });

  it("should validate elements correctly", async () => {
    await Effect.runPromise(
      manager.initialize({
        chatAppId: "test-chat-app-3",
        autoSave: true,
        maxElementsPerSection: 10,
        enableReordering: true,
      })
    );

    // Test invalid element (empty name)
    const invalidPrompt = new NamedPrompt({
      _tag: "NamedPrompt",
      id: "invalid-prompt",
      name: "",
      content: "Valid content",
    });

    // Should fail validation
    await expect(
      Effect.runPromise(manager.addPrePromptElement(invalidPrompt))
    ).rejects.toThrow();

    // Test valid element
    const validPrompt = new NamedPrompt({
      _tag: "NamedPrompt",
      id: "valid-prompt",
      name: "Valid Prompt",
      content: "Valid content",
    });

    // Should succeed
    await Effect.runPromise(manager.addPrePromptElement(validPrompt));

    const stats = await Effect.runPromise(manager.getStats());
    expect(stats.totalElements).toBe(1);
  });
});
