import { expect, test } from "@playwright/test";

test.describe("ChatArea – Real Application Flow", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");

    // Inject a chat app config (this event is actually handled)
    await page.evaluate(() => {
      const cfg = {
        id: "real-chat-test",
        name: "Real Chat Test",
        agentId: "test-agent",
        theme: {},
      };
      window.dispatchEvent(
        new CustomEvent("buddy:addChatApp", { detail: cfg }),
      );
    });

    await page.waitForTimeout(2000);
  });

  test("displays empty state when no messages", async ({ page }) => {
    const chatApp = page.getByRole("region", { name: "Real Chat Test" });

    // Check if the chat app is actually rendered
    await expect(chatApp).toBeVisible({ timeout: 10000 });

    // Empty state should be visible
    const emptyState = chatApp.getByTestId("empty-chat-placeholder");
    await expect(emptyState).toBeVisible();
    await expect(emptyState).toContainText("No messages yet");
  });

  test("sends user message and shows it in chat area", async ({ page }) => {
    const chatApp = page.getByRole("region", { name: "Real Chat Test" });

    // Wait for chat app to be visible
    await expect(chatApp).toBeVisible({ timeout: 10000 });

    // Look for input field
    const input = chatApp
      .getByLabel("Message input")
      .or(chatApp.locator('input[type="text"]'));

    const sendButton = chatApp
      .getByTestId("send-message-button")
      .or(chatApp.getByRole("button", { name: /send/i }));

    // Check if elements exist before trying to interact
    await expect(input).toBeVisible({ timeout: 5000 });
    await expect(sendButton).toBeVisible({ timeout: 5000 });

    // Send a message
    await input.fill("Hello from real test!");
    await sendButton.click();

    // User message should appear in the chat area
    await expect(chatApp.getByText("Hello from real test!")).toBeVisible({
      timeout: 5000,
    });

    // Empty state should disappear
    const emptyState = chatApp.getByTestId("empty-chat-placeholder");
    await expect(emptyState).not.toBeVisible();
  });

  test("shows proper message structure", async ({ page }) => {
    const chatApp = page.getByRole("region", { name: "Real Chat Test" });

    // Wait for chat app to be visible
    await expect(chatApp).toBeVisible({ timeout: 10000 });

    const input = chatApp
      .getByLabel("Message input")
      .or(chatApp.locator('input[type="text"]'));

    const sendButton = chatApp
      .getByTestId("send-message-button")
      .or(chatApp.getByRole("button", { name: /send/i }));

    await expect(input).toBeVisible({ timeout: 5000 });
    await expect(sendButton).toBeVisible({ timeout: 5000 });

    // Send a message
    await input.fill("Test message structure");
    await sendButton.click();

    // Look for message in the chat area with proper data-testid
    const message = chatApp.getByTestId("chat-message");
    await expect(message).toBeVisible({ timeout: 5000 });

    // Check that the message contains our text
    await expect(message).toContainText("Test message structure");
  });

  test("displays header with correct title", async ({ page }) => {
    const chatApp = page.getByRole("region", { name: "Real Chat Test" });

    // Wait for chat app to be visible
    await expect(chatApp).toBeVisible({ timeout: 10000 });

    // Check for header with correct title
    await expect(chatApp).toContainText("Real Chat Test");

    // Look for close button
    const closeButton = chatApp.getByTestId("close-chat-button");
    await expect(closeButton).toBeVisible();
  });

  test("handles multiple messages", async ({ page }) => {
    const chatApp = page.getByRole("region", { name: "Real Chat Test" });

    // Wait for chat app to be visible
    await expect(chatApp).toBeVisible({ timeout: 10000 });

    const input = chatApp
      .getByLabel("Message input")
      .or(chatApp.locator('input[type="text"]'));

    const sendButton = chatApp
      .getByTestId("send-message-button")
      .or(chatApp.getByRole("button", { name: /send/i }));

    await expect(input).toBeVisible({ timeout: 5000 });
    await expect(sendButton).toBeVisible({ timeout: 5000 });

    // Send first message
    await input.fill("First message");
    await sendButton.click();

    // Wait for first message to appear
    await expect(chatApp.getByText("First message")).toBeVisible({
      timeout: 5000,
    });

    // Send second message
    await input.fill("Second message");
    await sendButton.click();

    // Both messages should be visible
    await expect(chatApp.getByText("First message")).toBeVisible();
    await expect(chatApp.getByText("Second message")).toBeVisible();

    // Should have 2 message elements
    const messages = chatApp.getByTestId("chat-message");
    await expect(messages).toHaveCount(2);
  });
});
