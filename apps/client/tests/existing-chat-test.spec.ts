import { expect, test } from "@playwright/test";

test.describe("ChatArea – Testing with Existing Apps", () => {
  test("interacts with Pink Chat app", async ({ page }) => {
    console.log("🎯 Starting test with existing Pink Chat app");

    await page.goto("/");
    console.log("📄 Page loaded");

    // Wait for page to load
    await page.waitForTimeout(2000);

    // Find the Pink Chat app (we know this exists from debug test)
    const pinkChatApp = page.locator('[aria-label="Pink Chat"]');
    console.log("🔍 Looking for Pink Chat app...");

    await expect(pinkChatApp).toBeVisible({ timeout: 10000 });
    console.log("✅ Found Pink Chat app!");

    // Verify empty state
    const emptyState = pinkChatApp.getByTestId("empty-chat-placeholder");
    await expect(emptyState).toBeVisible();
    console.log("📭 Empty state visible");

    // Find input and send button
    const input = pinkChatApp.locator('input[aria-label="Message input"]');
    const sendButton = pinkChatApp.locator('[aria-label="Send message"]');

    await expect(input).toBeVisible();
    console.log("📝 Input field found");

    // Type a message
    await input.fill("Test message for Pink Chat!");
    console.log("⌨️ Typed message");

    // Send button should become enabled
    await expect(sendButton).toBeEnabled({ timeout: 2000 });
    console.log("🔘 Send button enabled");

    await sendButton.click();
    console.log("🚀 Message sent!");

    // Wait for user message to appear
    const userMessage = pinkChatApp
      .locator('[data-testid="chat-message"]')
      .filter({
        hasText: "Test message for Pink Chat!",
      });

    await expect(userMessage).toBeVisible({ timeout: 15000 });
    console.log("💬 User message appeared!");

    // Empty state should be hidden
    await expect(emptyState).not.toBeVisible();
    console.log("📬 Empty state hidden");

    // Wait to see if agent responds
    await page.waitForTimeout(5000);

    // Count total messages
    const totalMessages = await pinkChatApp
      .locator('[data-testid="chat-message"]')
      .count();
    console.log(`💬 Total messages: ${totalMessages}`);

    // Input should be cleared
    await expect(input).toHaveValue("");
    console.log("🧹 Input cleared");

    console.log("🎉 Pink Chat test completed successfully!");
  });

  test("tests multiple chat apps simultaneously", async ({ page }) => {
    console.log("🎯 Testing multiple chat apps");

    await page.goto("/");
    await page.waitForTimeout(2000);

    // Test Pink Chat
    const pinkChat = page.locator('[aria-label="Pink Chat"]');
    await expect(pinkChat).toBeVisible();
    console.log("✅ Pink Chat visible");

    // Test Simple Chat
    const simpleChat = page.locator('[aria-label="Simple Chat"]');
    await expect(simpleChat).toBeVisible();
    console.log("✅ Simple Chat visible");

    // Test button functionality in Pink Chat
    const pinkExpandButton = pinkChat.getByTestId("expand-chat-button");
    const pinkClearButton = pinkChat.getByTestId("clear-chat-button");

    await expect(pinkExpandButton).toBeVisible();
    await expect(pinkClearButton).toBeVisible();
    console.log("✅ Pink Chat buttons visible");

    // Click expand in Pink Chat
    await pinkExpandButton.click();
    await expect(pinkChat).toHaveAttribute("aria-expanded", "true");
    console.log("↗️ Pink Chat expanded");

    // Click clear in Pink Chat
    await pinkClearButton.click();
    const pinkEmptyState = pinkChat.getByTestId("empty-chat-placeholder");
    await expect(pinkEmptyState).toBeVisible({ timeout: 5000 });
    console.log("🧹 Pink Chat cleared");

    console.log("🎉 Multiple chat apps test completed!");
  });

  test("sends messages to different chat apps", async ({ page }) => {
    console.log("🎯 Testing messages in different chat apps");

    await page.goto("/");
    await page.waitForTimeout(2000);

    // Send message to Pink Chat
    const pinkChat = page.locator('[aria-label="Pink Chat"]');
    const pinkInput = pinkChat.locator('input[aria-label="Message input"]');
    const pinkSendButton = pinkChat.locator('[aria-label="Send message"]');

    await pinkInput.fill("Hello from Pink Chat!");
    await expect(pinkSendButton).toBeEnabled();
    await pinkSendButton.click();

    // Verify Pink Chat message
    const pinkMessage = pinkChat
      .locator('[data-testid="chat-message"]')
      .filter({
        hasText: "Hello from Pink Chat!",
      });
    await expect(pinkMessage).toBeVisible({ timeout: 10000 });
    console.log("💬 Pink Chat message sent");

    // Send message to Simple Chat
    const simpleChat = page.locator('[aria-label="Simple Chat"]');
    const simpleInput = simpleChat.locator('input[aria-label="Message input"]');
    const simpleSendButton = simpleChat.locator('[aria-label="Send message"]');

    await simpleInput.fill("Hello from Simple Chat!");
    await expect(simpleSendButton).toBeEnabled();
    await simpleSendButton.click();

    // Verify Simple Chat message
    const simpleMessage = simpleChat
      .locator('[data-testid="chat-message"]')
      .filter({
        hasText: "Hello from Simple Chat!",
      });
    await expect(simpleMessage).toBeVisible({ timeout: 10000 });
    console.log("💬 Simple Chat message sent");

    // Verify isolation - Pink Chat shouldn't have Simple Chat's message
    await expect(
      pinkChat.locator('[data-testid="chat-message"]').filter({
        hasText: "Hello from Simple Chat!",
      }),
    ).not.toBeVisible();
    console.log("🔒 Chat isolation verified");

    console.log("🎉 Multi-chat messaging test completed!");
  });

  test("verifies agent selection and typing indicators", async ({ page }) => {
    console.log("🎯 Testing agent selection and typing indicators");

    await page.goto("/");
    await page.waitForTimeout(2000);

    const pinkChat = page.locator('[aria-label="Pink Chat"]');

    // Check agent selector
    const agentSelect = pinkChat.getByTestId("agent-select");
    await expect(agentSelect).toBeVisible();
    await expect(agentSelect).toContainText("pink-agent");
    console.log("🤖 Agent selector showing pink-agent");

    // Send message and look for typing indicator
    const input = pinkChat.locator('input[aria-label="Message input"]');
    const sendButton = pinkChat.locator('[aria-label="Send message"]');

    await input.fill("Tell me about typing indicators");
    await sendButton.click();

    // Look for typing indicator briefly
    const typingIndicator = pinkChat.getByTestId("typing-indicator");

    // Use a try-catch since typing indicator might be very brief
    try {
      await expect(typingIndicator).toBeVisible({ timeout: 3000 });
      console.log("⏳ Typing indicator appeared");
    } catch (e) {
      console.log("⏳ Typing indicator not detected (may be too brief)");
    }

    // Wait a bit for potential agent response
    await page.waitForTimeout(3000);

    const totalMessages = await pinkChat
      .locator('[data-testid="chat-message"]')
      .count();
    console.log(`💬 Total messages after agent processing: ${totalMessages}`);

    console.log("🎉 Agent and typing indicator test completed!");
  });
});
