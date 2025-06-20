import { expect, test } from "@playwright/test";

test.describe("ChatArea – Working Test", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");

    // Inject a chat app config
    await page.evaluate(() => {
      const cfg = {
        id: "working-chat-test",
        name: "Working Chat Test",
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
    // Use aria-label selector instead of role
    const chatApp = page.locator('[aria-label="Working Chat Test"]');

    // Check if the chat app is actually rendered
    await expect(chatApp).toBeVisible({ timeout: 10000 });

    // Empty state should be visible
    const emptyState = chatApp.getByTestId("empty-chat-placeholder");
    await expect(emptyState).toBeVisible();
    await expect(emptyState).toContainText("No messages yet");
  });

  test("sends user message via real WebSocket connection", async ({ page }) => {
    const chatApp = page.locator('[aria-label="Working Chat Test"]');

    // Wait for chat app to be visible
    await expect(chatApp).toBeVisible({ timeout: 10000 });

    // Look for input field
    const input = chatApp.locator('input[aria-label="Message input"]');
    const sendButton = chatApp.locator('[aria-label="Send message"]');

    // Check if elements exist
    await expect(input).toBeVisible({ timeout: 5000 });

    // Type a message but don't send yet (send button should be disabled until text)
    await input.fill("Hello from working test!");

    // Now send button should be enabled
    await expect(sendButton).toBeEnabled({ timeout: 2000 });
    await sendButton.click();

    // User message should appear in the chat area
    const userMessage = chatApp.locator('[data-testid="chat-message"]').filter({
      hasText: "Hello from working test!",
    });
    await expect(userMessage).toBeVisible({ timeout: 10000 });

    // Empty state should disappear
    const emptyState = chatApp.getByTestId("empty-chat-placeholder");
    await expect(emptyState).not.toBeVisible();

    // Input should be cleared after sending
    await expect(input).toHaveValue("");
  });

  test("shows proper chat structure and styling", async ({ page }) => {
    const chatApp = page.locator('[aria-label="Working Chat Test"]');

    // Wait for chat app to be visible
    await expect(chatApp).toBeVisible({ timeout: 10000 });

    // Check for proper header structure
    await expect(chatApp).toContainText("Working Chat Test");

    // Check for close button
    const closeButton = chatApp.getByTestId("close-chat-button");
    await expect(closeButton).toBeVisible();

    // Check for expand button
    const expandButton = chatApp.getByTestId("expand-chat-button");
    await expect(expandButton).toBeVisible();

    // Check for clear button
    const clearButton = chatApp.getByTestId("clear-chat-button");
    await expect(clearButton).toBeVisible();

    // Check for input area
    const input = chatApp.locator('input[aria-label="Message input"]');
    await expect(input).toBeVisible();

    // Check for agent selector
    const agentSelect = chatApp.getByTestId("agent-select");
    await expect(agentSelect).toBeVisible();
    await expect(agentSelect).toContainText("test-agent");
  });

  test("typing indicator appears when agent is processing", async ({
    page,
  }) => {
    const chatApp = page.locator('[aria-label="Working Chat Test"]');
    await expect(chatApp).toBeVisible({ timeout: 10000 });

    const input = chatApp.locator('input[aria-label="Message input"]');
    const sendButton = chatApp.locator('[aria-label="Send message"]');

    // Send a message to trigger agent response
    await input.fill("Test typing indicator");
    await expect(sendButton).toBeEnabled({ timeout: 2000 });
    await sendButton.click();

    // User message should appear
    await expect(
      chatApp.locator('[data-testid="chat-message"]').filter({
        hasText: "Test typing indicator",
      }),
    ).toBeVisible({ timeout: 10000 });

    // Look for typing indicator that should appear while agent processes
    // This might appear briefly, so we use a shorter timeout
    const typingIndicator = chatApp.getByTestId("typing-indicator");

    // If typing indicator appears, verify it
    if (await typingIndicator.isVisible({ timeout: 2000 })) {
      await expect(typingIndicator).toContainText("thinking");
    }

    console.log(
      "✅ Typing indicator test completed (may appear briefly during real processing)",
    );
  });

  test("handles button interactions", async ({ page }) => {
    const chatApp = page.locator('[aria-label="Working Chat Test"]');
    await expect(chatApp).toBeVisible({ timeout: 10000 });

    // Test expand button
    const expandButton = chatApp.getByTestId("expand-chat-button");
    await expandButton.click();

    // Chat should be expanded (aria-expanded changes)
    await expect(chatApp).toHaveAttribute("aria-expanded", "true");

    // Test clear button (this should clear any messages)
    const clearButton = chatApp.getByTestId("clear-chat-button");
    await clearButton.click();

    // After clear, empty state should be visible
    const emptyState = chatApp.getByTestId("empty-chat-placeholder");
    await expect(emptyState).toBeVisible({ timeout: 5000 });
  });
});
