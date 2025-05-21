import { Effect } from "effect";
import { expect, it } from "vitest";
import { ChatService } from "../service.js";

it("should add and retrieve messages", async () => {
  const program = Effect.gen(function* () {
    const service = yield* ChatService;

    // Check initial welcome message
    const initialMessages = yield* service.getMessages();
    expect(initialMessages.length).toBe(1);
    expect(initialMessages[0].text).toBe("Hello! How can I help you today!");

    // Add a new message
    yield* service.addMessage("Test message", true);

    // Verify message was added
    const updatedMessages = yield* service.getMessages();
    expect(updatedMessages.length).toBe(2);
    expect(updatedMessages[1].text).toBe("Test message");
    expect(updatedMessages[1].isUser).toBe(true);
  });

  await Effect.runPromise(program.pipe(Effect.provide(ChatService.Default)));
});

it("should handle file operations", async () => {
  const program = Effect.gen(function* () {
    const service = yield* ChatService;

    // Verify initial state has no files
    const initialFiles = yield* service.getFiles();
    expect(initialFiles.length).toBe(0);

    // Create a test file
    const testFile = new File([new Blob(["test content"])], "test-file.txt", {
      type: "text/plain",
    });

    // Add file
    yield* service.addFile(testFile);

    // Verify file was added
    const updatedFiles = yield* service.getFiles();
    expect(updatedFiles.length).toBe(1);
    expect(updatedFiles[0].name).toBe("test-file.txt");

    // Remove file
    yield* service.removeFile(updatedFiles[0]);

    // Verify file was removed
    const finalFiles = yield* service.getFiles();
    expect(finalFiles.length).toBe(0);
  });

  await Effect.runPromise(program.pipe(Effect.provide(ChatService.Default)));
});
