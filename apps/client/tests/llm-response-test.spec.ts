import { expect, test } from "@playwright/test";

test.describe("LLM Response Testing", () => {
  test("sends message and receives LLM response", async ({ page }) => {
    console.log("🎯 Testing actual LLM response functionality");

    // Navigate to the chat application
    await page.goto("http://localhost:3000");

    console.log("📄 Page loaded");

    // Wait for the page to load and find an existing chat app
    await page.waitForSelector('[data-testid="chat-app-root"]', {
      timeout: 10000,
    });

    // Find the first available chat app (should be Pink Chat, Simple Chat, etc.)
    const chatApps = await page.locator('[data-testid="chat-app-root"]').all();
    expect(chatApps.length).toBeGreaterThan(0);

    const chatApp = chatApps[0];
    const chatAppName =
      (await chatApp.getAttribute("aria-label")) || "Unknown Chat";
    console.log(`✅ Found chat app: ${chatAppName}`);

    // Find the input field and send button using the same selectors as working tests
    const input = chatApp.locator('input[aria-label="Message input"]');
    const sendButton = chatApp.locator('[aria-label="Send message"]');

    await expect(input).toBeVisible();
    await expect(sendButton).toBeVisible();

    // Send a test message that should get an LLM response
    const testMessage =
      "Hello! Please respond with exactly 'LLM Response Received' so I can verify you're working.";
    console.log("📝 Typing test message...");
    await input.fill(testMessage);

    // Verify send button is enabled
    await expect(sendButton).toBeEnabled();

    console.log("🚀 Sending message...");
    await sendButton.click();

    // Verify user message appears immediately
    const userMessage = chatApp
      .getByTestId("chat-message")
      .filter({ hasText: testMessage });
    await expect(userMessage).toBeVisible({ timeout: 5000 });
    console.log("✅ User message appeared");

    // Wait for typing indicator (optional - may be brief)
    console.log("⏳ Waiting for potential typing indicator...");
    const typingIndicator = chatApp.getByText("thinking", { exact: false });

    // Don't fail if typing indicator doesn't appear - it might be too brief
    try {
      await expect(typingIndicator).toBeVisible({ timeout: 3000 });
      console.log("✅ Typing indicator detected");

      // Wait for typing indicator to disappear
      await expect(typingIndicator).not.toBeVisible({ timeout: 15000 });
      console.log("✅ Typing indicator disappeared");
    } catch (error) {
      console.log("ℹ️ Typing indicator not detected (may be too brief)");
    }

    // Wait for assistant response to appear
    console.log("🤖 Waiting for LLM response...");

    // Wait for a new message that's not the user message
    // The assistant message should appear as a left-aligned bubble
    const assistantMessage = chatApp
      .getByTestId("chat-message")
      .filter({ hasNot: page.getByText(testMessage) })
      .first();

    await expect(assistantMessage).toBeVisible({ timeout: 20000 });
    console.log("✅ Assistant message appeared!");

    // Get the assistant message content
    const assistantText = await assistantMessage.textContent();
    console.log(
      `📝 Assistant response: "${assistantText?.substring(0, 100)}..."`,
    );

    // Verify we have at least 2 messages now (user + assistant)
    const allMessages = chatApp.getByTestId("chat-message");
    await expect(allMessages).toHaveCount(2, { timeout: 5000 });
    console.log("✅ Message count correct: 2 messages (user + assistant)");

    // Verify assistant message is properly styled (left-aligned)
    await expect(assistantMessage).toHaveClass(/justify-start|text-left/, {
      timeout: 1000,
    });
    console.log("✅ Assistant message has correct styling");

    // Verify the assistant message contains some content
    expect(assistantText).toBeTruthy();
    expect(assistantText!.length).toBeGreaterThan(5);
    console.log("✅ Assistant message has meaningful content");

    console.log("🎉 LLM response test completed successfully!");
  });

  test("verifies multiple message exchange", async ({ page }) => {
    console.log("🎯 Testing multiple message exchange");

    await page.goto("http://localhost:3000");
    await page.waitForSelector('[data-testid="chat-app-root"]', {
      timeout: 10000,
    });

    const chatApp = page.locator('[data-testid="chat-app-root"]').first();
    const input = chatApp.locator('input[aria-label="Message input"]');
    const sendButton = chatApp.locator('[aria-label="Send message"]');

    // Send first message
    console.log("📝 Sending first message...");
    await input.fill("Count to 3 for me");
    await sendButton.click();

    // Wait for first response
    await expect(chatApp.getByTestId("chat-message")).toHaveCount(2, {
      timeout: 20000,
    });
    console.log("✅ First exchange complete");

    // Send second message
    console.log("📝 Sending second message...");
    await input.fill("Now count to 5");
    await sendButton.click();

    // Wait for second response
    await expect(chatApp.getByTestId("chat-message")).toHaveCount(4, {
      timeout: 20000,
    });
    console.log("✅ Second exchange complete");

    // Verify all messages are preserved
    const allMessages = await chatApp.getByTestId("chat-message").all();
    expect(allMessages.length).toBe(4);
    console.log("✅ All 4 messages preserved (2 user + 2 assistant)");

    console.log("🎉 Multiple message exchange test completed!");
  });
});
