import { Effect, Layer } from "effect";
import { describe, expect, it } from "vitest";
import { WebSocketService } from "../../websocket/WebSocketService";
import { ChatService } from "../ChatService";
import { ChatState, MessageApi } from "../ChatServiceApi";

// Create a test layer that provides all required dependencies
const TestLayer = Layer.mergeAll(WebSocketService.Default, ChatService.Default);

// Helper to create real file attachments (no mocking)
const createRealFile = (name: string, content: string, type: string): File => {
  return new File([content], name, { type });
};

// Helper to simulate typing delay
const simulateTypingDelay = (ms = 1000) => Effect.sleep(`${ms} millis`);

describe("ChatService - Real Session Scenarios (No Mocks)", () => {
  describe("Basic Conversation Flow", () => {
    it("should handle a simple greeting conversation", () =>
      Effect.gen(function* () {
        const service = yield* ChatService;

        // Initialize chat
        const chatId = `chat-greeting-${Date.now()}`;
        yield* service.setState({
          id: chatId,
          messages: [],
          isTyping: false,
        });

        // User starts typing
        yield* service.setTyping(true);
        yield* simulateTypingDelay(500);

        // User sends greeting
        const userGreeting = yield* service.sendMessage(
          "Hello! How are you today?",
        );
        yield* service.setTyping(false);

        // Verify conversation state
        const state = yield* service.getState();
        expect(state.messages).toHaveLength(1);
        expect(state.messages[0]).toEqual(userGreeting);
        expect(state.isTyping).toBe(false);
        expect(userGreeting.text).toBe("Hello! How are you today?");
        expect(userGreeting.sender).toBe("user");
        expect(userGreeting.timestamp).toBeDefined();
      }).pipe(Effect.provide(TestLayer)));

    it("should handle a multi-turn conversation", () =>
      Effect.gen(function* () {
        const service = yield* ChatService;

        const chatId = `chat-multiturn-${Date.now()}`;
        yield* service.setState({
          id: chatId,
          messages: [],
          isTyping: false,
        });

        // Turn 1: User asks about weather
        yield* service.setTyping(true);
        yield* simulateTypingDelay(800);
        const msg1 = yield* service.sendMessage(
          "What's the weather like today?",
        );
        yield* service.setTyping(false);

        // Turn 2: User asks follow-up
        yield* simulateTypingDelay(300);
        yield* service.setTyping(true);
        yield* simulateTypingDelay(600);
        const msg2 = yield* service.sendMessage("Should I bring an umbrella?");
        yield* service.setTyping(false);

        // Turn 3: User thanks
        yield* simulateTypingDelay(200);
        yield* service.setTyping(true);
        yield* simulateTypingDelay(400);
        const msg3 = yield* service.sendMessage("Thank you for the help!");
        yield* service.setTyping(false);

        // Verify conversation flow
        const state = yield* service.getState();
        expect(state.messages).toHaveLength(3);
        expect(state.messages.map((m) => m.text)).toEqual([
          "What's the weather like today?",
          "Should I bring an umbrella?",
          "Thank you for the help!",
        ]);
        expect(state.messages.every((m) => m.sender === "user")).toBe(true);
        expect(state.metadata?.messageCount).toBe(3);
      }).pipe(Effect.provide(TestLayer)));
  });

  describe("File Attachment Scenarios", () => {
    it("should handle single file attachment with real content", () =>
      Effect.gen(function* () {
        const service = yield* ChatService;

        const chatId = `chat-file-${Date.now()}`;
        yield* service.setState({
          id: chatId,
          messages: [],
          isTyping: false,
        });

        // Create real file with actual content
        const documentContent = `
# Project Documentation

This is a real document with actual content for testing file attachments.

## Overview
This document contains important project information that needs to be shared.

## Details
- Feature A: Implementation details
- Feature B: Testing requirements
- Feature C: Deployment notes

## Conclusion
This completes the documentation requirements.
        `.trim();

        const realFile = createRealFile(
          "document.pdf",
          documentContent,
          "application/pdf",
        );

        // User sends message with attachment
        yield* service.setTyping(true);
        yield* simulateTypingDelay(1200); // Longer delay for file upload
        const messageWithFile = yield* service.sendMessage(
          "Here's the document you requested",
          [realFile],
        );
        yield* service.setTyping(false);

        // Verify file attachment
        expect(messageWithFile.attachments).toBeDefined();
        expect(messageWithFile.attachments).toHaveLength(1);
        expect(messageWithFile.attachments?.[0]).toMatchObject({
          name: "document.pdf",
          size: documentContent.length,
          type: "application/pdf",
        });
        expect(messageWithFile.metadata?.hasAttachments).toBe(true);

        const state = yield* service.getState();
        expect(state.metadata?.totalAttachments).toBe(1);
      }).pipe(Effect.provide(TestLayer)));

    it("should handle multiple file attachments with real content", () =>
      Effect.gen(function* () {
        const service = yield* ChatService;

        const chatId = `chat-multifile-${Date.now()}`;
        yield* service.setState({
          id: chatId,
          messages: [],
          isTyping: false,
        });

        // Create multiple real files with actual content
        const imageContent = `
This is a real image file content for testing.
Image metadata:
- Format: JPEG
- Dimensions: 1920x1080
- Created: ${new Date().toISOString()}
- Camera: Canon EOS R5
- Settings: f/2.8, 1/60s, ISO 400
        `.trim();

        const textContent = `
# Project Notes

## Meeting Notes - ${new Date().toISOString().split("T")[0]}

### Attendees
- Alice Johnson (Product Manager)
- Bob Smith (Lead Developer)  
- Carol Davis (UX Designer)

### Discussion Points
1. Feature requirements review
2. Timeline adjustments
3. Resource allocation
4. Testing strategy

### Action Items
- [ ] Update project timeline
- [ ] Review design mockups
- [ ] Schedule next sprint planning
- [ ] Prepare demo for stakeholders

### Next Steps
Follow up on action items by end of week.
        `.trim();

        const configContent = `
{
  "project": "buddy-chat-app",
  "version": "1.0.0",
  "environment": "development",
  "database": {
    "host": "localhost",
    "port": 5432,
    "name": "buddy_dev"
  },
  "features": {
    "realTimeChat": true,
    "fileAttachments": true,
    "typingIndicators": true
  },
  "limits": {
    "maxFileSize": "10MB",
    "maxFilesPerMessage": 10,
    "maxMessageLength": 2000
  }
}
        `.trim();

        const files = [
          createRealFile("project-image.jpg", imageContent, "image/jpeg"),
          createRealFile("meeting-notes.txt", textContent, "text/plain"),
          createRealFile("config.json", configContent, "application/json"),
        ];

        // User sends message with multiple attachments
        yield* service.setTyping(true);
        yield* simulateTypingDelay(2000); // Longer delay for multiple files
        const messageWithFiles = yield* service.sendMessage(
          "Here are the files from our project",
          files,
        );
        yield* service.setTyping(false);

        // Verify multiple attachments
        expect(messageWithFiles.attachments).toHaveLength(3);
        expect(messageWithFiles.attachments?.map((f) => f.name)).toEqual([
          "project-image.jpg",
          "meeting-notes.txt",
          "config.json",
        ]);
        expect(messageWithFiles.metadata?.hasAttachments).toBe(true);

        const state = yield* service.getState();
        expect(state.metadata?.totalAttachments).toBe(3);
      }).pipe(Effect.provide(TestLayer)));
  });

  describe("Complex Conversation Scenarios", () => {
    it("should handle a technical support conversation with real files", () =>
      Effect.gen(function* () {
        const service = yield* ChatService;

        const chatId = `chat-support-${Date.now()}`;
        yield* service.setState({
          id: chatId,
          messages: [],
          isTyping: false,
        });

        // User reports an issue
        yield* service.setTyping(true);
        yield* simulateTypingDelay(1200);
        const issue = yield* service.sendMessage(
          "I'm having trouble logging into my account. It keeps saying 'invalid credentials' even though I'm sure my password is correct.",
        );
        yield* service.setTyping(false);

        // User provides more details
        yield* simulateTypingDelay(800);
        yield* service.setTyping(true);
        yield* simulateTypingDelay(900);
        const details = yield* service.sendMessage(
          "I tried resetting my password twice but the same error keeps happening.",
        );
        yield* service.setTyping(false);

        // User shares screenshot with real content
        yield* simulateTypingDelay(1500);
        const screenshotContent = `
Error Screenshot Data:
Timestamp: ${new Date().toISOString()}
Error Code: AUTH_INVALID_CREDENTIALS
User Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36
Session ID: sess_${Math.random().toString(36).substr(2, 9)}
Request URL: https://app.example.com/login
Status: 401 Unauthorized
Response Headers:
  Content-Type: application/json
  WWW-Authenticate: Bearer realm="api"
Response Body:
{
  "error": "invalid_credentials",
  "message": "The provided credentials are invalid",
  "timestamp": "${new Date().toISOString()}"
}
        `.trim();

        const screenshot = createRealFile(
          "error-screenshot.png",
          screenshotContent,
          "image/png",
        );
        yield* service.setTyping(true);
        yield* simulateTypingDelay(800);
        const withScreenshot = yield* service.sendMessage(
          "Here's a screenshot of the error",
          [screenshot],
        );
        yield* service.setTyping(false);

        // Verify support conversation flow
        const state = yield* service.getState();
        expect(state.messages).toHaveLength(3);
        expect(state.messages[0].text).toContain("trouble logging into");
        expect(state.messages[1].text).toContain("tried resetting");
        expect(state.messages[2].attachments).toHaveLength(1);
        expect(state.metadata?.messageCount).toBe(3);
        expect(state.metadata?.totalAttachments).toBe(1);
      }).pipe(Effect.provide(TestLayer)));

    it("should handle a creative writing collaboration", () =>
      Effect.gen(function* () {
        const service = yield* ChatService;

        const chatId = `chat-creative-${Date.now()}`;
        yield* service.setState({
          id: chatId,
          messages: [],
          isTyping: false,
        });

        // User starts a story
        yield* service.setTyping(true);
        yield* simulateTypingDelay(2000);
        const storyStart = yield* service.sendMessage(
          "Let's write a story together! Here's the beginning: 'The old lighthouse keeper had seen many storms, but nothing quite like this...'",
        );
        yield* service.setTyping(false);

        // User adds to the story
        yield* simulateTypingDelay(1500);
        yield* service.setTyping(true);
        yield* simulateTypingDelay(1800);
        const storyContinue = yield* service.sendMessage(
          "The waves crashed against the rocks below with unprecedented fury, and in the distance, he could see something that shouldn't exist...",
        );
        yield* service.setTyping(false);

        // User asks for feedback
        yield* simulateTypingDelay(600);
        yield* service.setTyping(true);
        yield* simulateTypingDelay(700);
        const feedback = yield* service.sendMessage(
          "What do you think? Should we make it more mysterious or add some action?",
        );
        yield* service.setTyping(false);

        // Verify creative conversation
        const state = yield* service.getState();
        expect(state.messages).toHaveLength(3);
        expect(state.messages[0].text).toContain("lighthouse keeper");
        expect(state.messages[1].text).toContain("waves crashed");
        expect(state.messages[2].text).toContain("more mysterious");

        // Check message lengths (creative writing tends to be longer)
        const avgLength =
          state.messages.reduce((sum, msg) => sum + msg.text.length, 0) /
          state.messages.length;
        expect(avgLength).toBeGreaterThan(50); // Creative messages tend to be longer
      }).pipe(Effect.provide(TestLayer)));
  });

  describe("Edge Case Scenarios", () => {
    it("should handle rapid-fire messages", () =>
      Effect.gen(function* () {
        const service = yield* ChatService;

        const chatId = `chat-rapidfire-${Date.now()}`;
        yield* service.setState({
          id: chatId,
          messages: [],
          isTyping: false,
        });

        // Send multiple messages quickly (like excited user)
        const messages = [
          "OMG!",
          "Did you see that?",
          "That was amazing!",
          "I can't believe it worked!",
          "Thank you so much!",
        ];

        for (const text of messages) {
          yield* service.setTyping(true);
          yield* simulateTypingDelay(200); // Very quick typing
          yield* service.sendMessage(text);
          yield* service.setTyping(false);
          yield* simulateTypingDelay(100); // Brief pause between messages
        }

        const state = yield* service.getState();
        expect(state.messages).toHaveLength(5);
        expect(state.messages.map((m) => m.text)).toEqual(messages);
        expect(state.metadata?.messageCount).toBe(5);
      }).pipe(Effect.provide(TestLayer)));

    it("should handle very long message with real content", () =>
      Effect.gen(function* () {
        const service = yield* ChatService;

        const chatId = `chat-longmessage-${Date.now()}`;
        yield* service.setState({
          id: chatId,
          messages: [],
          isTyping: false,
        });

        // Create a long but valid message with real content
        const longMessage = `
I wanted to share my comprehensive thoughts on this fascinating topic that we've been discussing. 

The intersection of artificial intelligence and human creativity represents one of the most intriguing frontiers in modern technology. When we consider how machine learning algorithms can now generate art, write poetry, compose music, and even engage in complex conversations like this one, we're witnessing a fundamental shift in how we understand both intelligence and creativity.

What's particularly fascinating is how these systems learn patterns from vast amounts of human-created content, then use those patterns to generate something new. It's reminiscent of how human artists learn by studying the masters, absorbing techniques and styles, then developing their own unique voice. The difference, of course, is the scale and speed at which AI can process and synthesize information.

This raises profound questions about the nature of creativity itself. Is creativity purely a human domain, or is it simply a sophisticated form of pattern recognition and recombination that can be replicated by machines? When an AI generates a beautiful piece of music or a compelling story, who deserves credit for the creativity - the AI, the programmers who created it, or the countless human artists whose work formed the training data?

These aren't just philosophical questions; they have real implications for how we structure society, education, and the economy in an age of increasingly capable AI systems.
        `.trim();

        yield* service.setTyping(true);
        yield* simulateTypingDelay(3000); // Longer delay for long message
        const message = yield* service.sendMessage(longMessage);
        yield* service.setTyping(false);

        expect(message.text).toBe(longMessage);
        expect(message.metadata?.length).toBe(longMessage.length);
        expect(message.metadata?.validation?.isValid).toBe(true);
      }).pipe(Effect.provide(TestLayer)));

    it("should handle emoji and special characters", () =>
      Effect.gen(function* () {
        const service = yield* ChatService;

        const chatId = `chat-emoji-${Date.now()}`;
        yield* service.setState({
          id: chatId,
          messages: [],
          isTyping: false,
        });

        // Messages with various special characters and real content
        const specialMessages = [
          "Hello! 👋 How are you doing today? 😊 I hope you're having a wonderful time!",
          "I love coding! 💻✨ It's so much fun to build things that solve real problems! 🎉🚀",
          "Math is beautiful: ∑(n=1 to ∞) 1/n² = π²/6, and ∫₀^∞ e^(-x²) dx = √π/2 ≈ 0.886",
          "Global economy update: $100 USD ≈ €92 EUR ≈ ¥15,000 JPY ≈ £82 GBP (approximate rates)",
          "Multilingual greetings: café (French), naïve (English), résumé (French), piñata (Spanish), Москва (Russian)",
        ];

        for (const text of specialMessages) {
          yield* service.setTyping(true);
          yield* simulateTypingDelay(800);
          const message = yield* service.sendMessage(text);
          yield* service.setTyping(false);

          expect(message.text).toBe(text);
          expect(message.metadata?.validation?.isValid).toBe(true);
          yield* simulateTypingDelay(300);
        }

        const state = yield* service.getState();
        expect(state.messages).toHaveLength(5);
        expect(state.messages.map((m) => m.text)).toEqual(specialMessages);
      }).pipe(Effect.provide(TestLayer)));
  });

  describe("Session Management Scenarios", () => {
    it("should handle session with history retrieval", () =>
      Effect.gen(function* () {
        const service = yield* ChatService;

        const chatId = `chat-history-${Date.now()}`;
        yield* service.setState({
          id: chatId,
          messages: [],
          isTyping: false,
        });

        // Build up conversation history with realistic content
        const conversationFlow = [
          "Hi there! I'm working on a React project and could use some guidance.",
          "I need help with my project - it's a web application for managing team tasks.",
          "The app is built with React and TypeScript, using modern hooks and context for state management.",
          "I'm having issues with state management, specifically with useEffect dependencies causing infinite re-renders.",
          "The problem occurs when I try to fetch data based on user input and update the component state accordingly.",
        ];

        for (const text of conversationFlow) {
          yield* service.setTyping(true);
          yield* simulateTypingDelay(600);
          yield* service.sendMessage(text);
          yield* service.setTyping(false);
          yield* simulateTypingDelay(200);
        }

        // Retrieve history
        const history = yield* service.getHistory();
        expect(history.messages).toHaveLength(5);
        expect(history.messages.map((m) => m.text)).toEqual(conversationFlow);
        expect(history.hasMore).toBe(false);

        // Verify state consistency
        const state = yield* service.getState();
        expect(state.messages).toHaveLength(5);
        expect(state.metadata?.messageCount).toBe(5);
      }).pipe(Effect.provide(TestLayer)));

    it("should handle session cleanup", () =>
      Effect.gen(function* () {
        const service = yield* ChatService;

        const chatId = `chat-cleanup-${Date.now()}`;
        yield* service.setState({
          id: chatId,
          messages: [],
          isTyping: false,
        });

        // Add some realistic conversation
        yield* service.sendMessage(
          "Hello, I'd like to start a new conversation.",
        );
        yield* service.sendMessage(
          "How are you doing today? I hope everything is going well.",
        );
        yield* service.sendMessage(
          "Thank you for your help. I'll talk to you later. Goodbye!",
        );

        // Verify messages exist
        let state = yield* service.getState();
        expect(state.messages).toHaveLength(3);

        // Clear history (simulating session end)
        yield* service.clearHistory();

        // Verify cleanup
        state = yield* service.getState();
        expect(state.messages).toHaveLength(0);
        expect(state.metadata?.messageCount).toBe(0);
        expect(state.isTyping).toBe(false);

        const history = yield* service.getHistory();
        expect(history.messages).toHaveLength(0);
        expect(history.hasMore).toBe(false);
      }).pipe(Effect.provide(TestLayer)));
  });

  describe("Realistic Timing and Flow", () => {
    it("should simulate natural conversation pacing", () =>
      Effect.gen(function* () {
        const service = yield* ChatService;

        const chatId = `chat-natural-${Date.now()}`;
        yield* service.setState({
          id: chatId,
          messages: [],
          isTyping: false,
        });

        const startTime = Date.now();

        // Natural conversation with realistic pauses and content
        yield* service.setTyping(true);
        yield* simulateTypingDelay(1200); // Thinking time
        const msg1 = yield* service.sendMessage(
          "I've been thinking about our conversation yesterday regarding the new project architecture...",
        );
        yield* service.setTyping(false);

        yield* simulateTypingDelay(800); // Pause to think
        yield* service.setTyping(true);
        yield* simulateTypingDelay(1500); // Longer message
        const msg2 = yield* service.sendMessage(
          "You mentioned something about microservices and containerization that really intrigued me. Could you elaborate on how that would fit with our current infrastructure?",
        );
        yield* service.setTyping(false);

        yield* simulateTypingDelay(400); // Quick follow-up
        yield* service.setTyping(true);
        yield* simulateTypingDelay(600);
        const msg3 = yield* service.sendMessage(
          "Specifically, I'm curious about the deployment strategy and how we'd handle service discovery and load balancing.",
        );
        yield* service.setTyping(false);

        const endTime = Date.now();
        const totalTime = endTime - startTime;

        // Verify natural timing (should take several seconds)
        expect(totalTime).toBeGreaterThan(4000); // At least 4 seconds for natural conversation

        // Verify message timestamps are in order
        const state = yield* service.getState();
        expect(state.messages).toHaveLength(3);

        for (let i = 1; i < state.messages.length; i++) {
          expect(state.messages[i].timestamp).toBeGreaterThan(
            state.messages[i - 1].timestamp,
          );
        }
      }).pipe(Effect.provide(TestLayer)));
  });
});
