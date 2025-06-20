import { expect, test } from "@playwright/test";

test.describe("ChatArea – Basic Functionality", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");

    // Inject a chat app config
    await page.evaluate(() => {
      const cfg = {
        id: "basic-chat-test",
        name: "Basic Chat Test",
        agentId: "test-agent",
        theme: {},
      };
      window.dispatchEvent(
        new CustomEvent("buddy:addChatApp", { detail: cfg }),
      );
    });

    await page.waitForTimeout(1500);
  });

  test("shows empty state initially", async ({ page }) => {
    const chatApp = page.getByRole("region", { name: "Basic Chat Test" });

    // Empty state should be visible
    const emptyState = chatApp.getByTestId("empty-chat-placeholder");
    await expect(emptyState).toBeVisible();
    await expect(emptyState).toContainText("No messages yet");
  });

  test("displays user message after sending", async ({ page }) => {
    const chatApp = page.getByRole("region", { name: "Basic Chat Test" });
    const input = chatApp.getByLabel("Message input");
    const sendButton = chatApp.getByTestId("send-message-button");

    // Send a simple message
    await input.fill("Hello ChatArea!");
    await sendButton.click();

    // User message should appear
    const userMessage = chatApp.getByTestId("chat-message").filter({
      hasText: "Hello ChatArea!",
    });
    await expect(userMessage).toBeVisible();

    // Empty state should disappear
    const emptyState = chatApp.getByTestId("empty-chat-placeholder");
    await expect(emptyState).not.toBeVisible();
  });

  test("shows typing indicator", async ({ page }) => {
    const chatApp = page.getByRole("region", { name: "Basic Chat Test" });
    const input = chatApp.getByLabel("Message input");
    const sendButton = chatApp.getByTestId("send-message-button");

    // Send a message
    await input.fill("Testing typing indicator");
    await sendButton.click();

    // Wait for the message to appear
    await expect(
      chatApp.getByTestId("chat-message").filter({
        hasText: "Testing typing indicator",
      }),
    ).toBeVisible();

    // Simulate agent typing
    await page.evaluate(() => {
      window.dispatchEvent(
        new CustomEvent("buddy:simulateAgentTyping", {
          detail: {
            chatId: "basic-chat-test",
            isTyping: true,
          },
        }),
      );
    });

    // Typing indicator should appear
    const typingIndicator = chatApp.getByTestId("typing-indicator");
    await expect(typingIndicator).toBeVisible();

    // Should have animated dots
    const animatedDots = typingIndicator.locator('div[style*="animation"]');
    await expect(animatedDots).toHaveCount(3);
  });

  test("displays assistant response with correct styling", async ({ page }) => {
    const chatApp = page.getByRole("region", { name: "Basic Chat Test" });
    const input = chatApp.getByLabel("Message input");
    const sendButton = chatApp.getByTestId("send-message-button");

    // Send a message
    await input.fill("What is the weather?");
    await sendButton.click();

    // Simulate assistant response
    await page.evaluate(() => {
      window.dispatchEvent(
        new CustomEvent("buddy:simulateAgentMessage", {
          detail: {
            chatId: "basic-chat-test",
            message: {
              id: "weather-response",
              text: "It's sunny today!",
              sender: "assistant",
              timestamp: Date.now(),
              metadata: {},
            },
          },
        }),
      );
    });

    // Assistant message should appear
    const assistantMessage = chatApp.getByTestId("chat-message").filter({
      hasText: "It's sunny today!",
    });
    await expect(assistantMessage).toBeVisible();

    // Check message alignment (assistant messages should be left-aligned)
    const messageContainer = assistantMessage.locator("..");
    await expect(messageContainer).toHaveClass(/justify-start/);

    // Should have both user and assistant messages now
    const allMessages = chatApp.getByTestId("chat-message");
    await expect(allMessages).toHaveCount(2);
  });

  test("handles multiple messages correctly", async ({ page }) => {
    const chatApp = page.getByRole("region", { name: "Basic Chat Test" });
    const input = chatApp.getByLabel("Message input");
    const sendButton = chatApp.getByTestId("send-message-button");

    // Send first message
    await input.fill("First message");
    await sendButton.click();

    // Send second message
    await input.fill("Second message");
    await sendButton.click();

    // Both messages should be visible
    await expect(
      chatApp.getByTestId("chat-message").filter({
        hasText: "First message",
      }),
    ).toBeVisible();

    await expect(
      chatApp.getByTestId("chat-message").filter({
        hasText: "Second message",
      }),
    ).toBeVisible();

    // Should have 2 messages total
    const allMessages = chatApp.getByTestId("chat-message");
    await expect(allMessages).toHaveCount(2);
  });
});
