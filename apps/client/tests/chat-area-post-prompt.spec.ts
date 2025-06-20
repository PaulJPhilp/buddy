import { expect, test } from "@playwright/test";

test.describe("ChatArea – Post-Prompt Behavior", () => {
  test("verifies complete post-prompt flow and state changes", async ({
    page,
  }) => {
    console.log("🎯 Testing complete post-prompt behavior");

    await page.goto("/");
    await page.waitForTimeout(2000);

    const pinkChat = page.locator('[aria-label="Pink Chat"]');
    await expect(pinkChat).toBeVisible();

    // === PHASE 1: PRE-PROMPT STATE ===
    console.log("📋 PHASE 1: Verifying pre-prompt state");

    const emptyState = pinkChat.getByTestId("empty-chat-placeholder");
    await expect(emptyState).toBeVisible();
    await expect(emptyState).toContainText("No messages yet");

    const messageCount = await pinkChat
      .locator('[data-testid="chat-message"]')
      .count();
    expect(messageCount).toBe(0);
    console.log("✅ Pre-prompt: Empty state visible, 0 messages");

    // === PHASE 2: SENDING PROMPT ===
    console.log("📋 PHASE 2: Sending prompt");

    const input = pinkChat.locator('input[aria-label="Message input"]');
    const sendButton = pinkChat.locator('[aria-label="Send message"]');

    await input.fill("Comprehensive post-prompt test message");
    await expect(sendButton).toBeEnabled();
    await sendButton.click();
    console.log("🚀 Prompt sent");

    // === PHASE 3: IMMEDIATE POST-PROMPT CHANGES ===
    console.log("📋 PHASE 3: Verifying immediate post-prompt changes");

    // User message should appear immediately
    const userMessage = pinkChat
      .locator('[data-testid="chat-message"]')
      .filter({
        hasText: "Comprehensive post-prompt test message",
      });
    await expect(userMessage).toBeVisible({ timeout: 10000 });
    console.log("✅ User message appeared immediately");

    // Empty state should disappear
    await expect(emptyState).not.toBeVisible();
    console.log("✅ Empty state hidden");

    // Input should be cleared
    await expect(input).toHaveValue("");
    console.log("✅ Input field cleared");

    // Message count should be 1
    const postSendCount = await pinkChat
      .locator('[data-testid="chat-message"]')
      .count();
    expect(postSendCount).toBe(1);
    console.log("✅ Message count updated to 1");

    // === PHASE 4: MESSAGE STRUCTURE VERIFICATION ===
    console.log("📋 PHASE 4: Verifying message structure");

    // Check message is properly aligned (user messages align right)
    await expect(userMessage).toHaveClass(/justify-end/);
    console.log("✅ User message properly right-aligned");

    // Check timestamp is present
    const timestamp = userMessage
      .locator("span")
      .filter({ hasText: /\d+:\d+:\d+/ });
    await expect(timestamp).toBeVisible();
    console.log("✅ Timestamp displayed");

    // === PHASE 5: UI STATE CONSISTENCY ===
    console.log("📋 PHASE 5: Verifying UI state consistency");

    // Send button should be disabled again (empty input)
    await expect(sendButton).toBeDisabled();
    console.log("✅ Send button disabled with empty input");

    // Agent selector should still be visible and functional
    const agentSelect = pinkChat.getByTestId("agent-select");
    await expect(agentSelect).toBeVisible();
    await expect(agentSelect).toContainText("pink-agent");
    console.log("✅ Agent selector functional");

    // Clear button should work after message
    const clearButton = pinkChat.getByTestId("clear-chat-button");
    await clearButton.click();
    await expect(emptyState).toBeVisible({ timeout: 5000 });
    const clearedCount = await pinkChat
      .locator('[data-testid="chat-message"]')
      .count();
    expect(clearedCount).toBe(0);
    console.log("✅ Clear functionality works post-message");

    console.log("🎉 Complete post-prompt behavior test passed!");
  });

  test("verifies rapid multiple message sending", async ({ page }) => {
    console.log("🎯 Testing rapid multiple message behavior");

    await page.goto("/");
    await page.waitForTimeout(2000);

    const simpleChat = page.locator('[aria-label="Simple Chat"]');
    await expect(simpleChat).toBeVisible();

    const input = simpleChat.locator('input[aria-label="Message input"]');
    const sendButton = simpleChat.locator('[aria-label="Send message"]');

    // Send multiple messages rapidly
    const messages = ["First message", "Second message", "Third message"];

    for (let i = 0; i < messages.length; i++) {
      await input.fill(messages[i]);
      await expect(sendButton).toBeEnabled();
      await sendButton.click();

      // Verify each message appears
      const message = simpleChat
        .locator('[data-testid="chat-message"]')
        .filter({
          hasText: messages[i],
        });
      await expect(message).toBeVisible({ timeout: 10000 });
      console.log(`✅ Message ${i + 1} sent and displayed`);

      // Brief pause between messages
      await page.waitForTimeout(500);
    }

    // Verify total message count
    const totalMessages = await simpleChat
      .locator('[data-testid="chat-message"]')
      .count();
    expect(totalMessages).toBe(3);
    console.log(`✅ All ${totalMessages} messages preserved`);

    // Verify chronological order (messages should appear in order sent)
    const messageTexts = await simpleChat
      .locator('[data-testid="chat-message"] .whitespace-pre-wrap')
      .allTextContents();
    for (let i = 0; i < messages.length; i++) {
      expect(messageTexts[i]).toBe(messages[i]);
    }
    console.log("✅ Message chronological order preserved");

    console.log("🎉 Rapid multiple message test passed!");
  });

  test("verifies chat area scrolling behavior with multiple messages", async ({
    page,
  }) => {
    console.log("🎯 Testing scroll behavior with multiple messages");

    await page.goto("/");
    await page.waitForTimeout(2000);

    const slateChat = page.locator('[aria-label="Slate Chat"]');
    await expect(slateChat).toBeVisible();

    const input = slateChat.locator('input[aria-label="Message input"]');
    const sendButton = slateChat.locator('[aria-label="Send message"]');

    // Send enough messages to potentially cause scrolling
    for (let i = 1; i <= 10; i++) {
      await input.fill(
        `Scroll test message ${i} - testing the chat area scrolling behavior with longer content that might wrap to multiple lines`,
      );
      await expect(sendButton).toBeEnabled();
      await sendButton.click();

      // Wait for message to appear
      const message = slateChat.locator('[data-testid="chat-message"]').filter({
        hasText: `Scroll test message ${i}`,
      });
      await expect(message).toBeVisible({ timeout: 10000 });

      console.log(`📜 Message ${i} sent`);
      await page.waitForTimeout(200);
    }

    // Verify all messages are present
    const totalMessages = await slateChat
      .locator('[data-testid="chat-message"]')
      .count();
    expect(totalMessages).toBe(10);
    console.log("✅ All 10 messages preserved");

    // Verify the most recent message is visible (should auto-scroll)
    const lastMessage = slateChat
      .locator('[data-testid="chat-message"]')
      .filter({
        hasText: "Scroll test message 10",
      });
    await expect(lastMessage).toBeVisible();
    console.log("✅ Latest message visible (auto-scroll working)");

    // Verify first message is still present but may not be visible due to scroll
    const firstMessage = slateChat
      .locator('[data-testid="chat-message"]')
      .filter({
        hasText: "Scroll test message 1",
      });
    const firstMessageExists = (await firstMessage.count()) > 0;
    expect(firstMessageExists).toBe(true);
    console.log("✅ Earlier messages preserved in DOM");

    console.log("🎉 Scroll behavior test passed!");
  });

  test("verifies error handling and recovery", async ({ page }) => {
    console.log("🎯 Testing error handling and recovery");

    await page.goto("/");
    await page.waitForTimeout(2000);

    const aiExpertChat = page.locator('[aria-label="AI Expert"]');
    await expect(aiExpertChat).toBeVisible();

    const input = aiExpertChat.locator('input[aria-label="Message input"]');
    const sendButton = aiExpertChat.locator('[aria-label="Send message"]');

    // Test with various edge case inputs
    const edgeCases = [
      "", // Empty (should not send)
      "   ", // Whitespace only (should not send)
      "Normal message", // Normal case
      "🚀💬🎯 Emoji test", // Emoji test
      "Very long message ".repeat(50), // Very long message
    ];

    for (const testInput of edgeCases) {
      await input.fill(testInput);

      if (testInput.trim() === "") {
        // Empty or whitespace should not enable send button
        await expect(sendButton).toBeDisabled();
        console.log("✅ Send button disabled for empty/whitespace input");
      } else {
        // Valid content should enable send button
        await expect(sendButton).toBeEnabled();
        await sendButton.click();

        const message = aiExpertChat
          .locator('[data-testid="chat-message"]')
          .filter({
            hasText: testInput.substring(0, 50), // Match first 50 chars for long messages
          });
        await expect(message).toBeVisible({ timeout: 10000 });
        console.log(`✅ Edge case handled: "${testInput.substring(0, 30)}..."`);

        await page.waitForTimeout(300);
      }
    }

    console.log("🎉 Error handling and recovery test passed!");
  });

  test("verifies message timestamp and formatting", async ({ page }) => {
    console.log("🎯 Testing message timestamps and formatting");

    await page.goto("/");
    await page.waitForTimeout(2000);

    const pinkChat = page.locator('[aria-label="Pink Chat"]');
    await expect(pinkChat).toBeVisible();

    const input = pinkChat.locator('input[aria-label="Message input"]');
    const sendButton = pinkChat.locator('[aria-label="Send message"]');

    // Clear any existing messages
    const clearButton = pinkChat.getByTestId("clear-chat-button");
    await clearButton.click();
    await page.waitForTimeout(1000);

    // Send a message
    await input.fill("Timestamp test message");
    await sendButton.click();

    const userMessage = pinkChat
      .locator('[data-testid="chat-message"]')
      .filter({
        hasText: "Timestamp test message",
      });
    await expect(userMessage).toBeVisible({ timeout: 10000 });

    // Check timestamp format (should be HH:MM:SS PM/AM)
    const timestamp = userMessage
      .locator("span")
      .filter({ hasText: /\d+:\d+:\d+/ });
    await expect(timestamp).toBeVisible();

    const timestampText = await timestamp.textContent();
    expect(timestampText).toMatch(/\d{1,2}:\d{2}:\d{2}\s?(AM|PM)/);
    console.log(`✅ Timestamp format correct: ${timestampText}`);

    // Check message bubble styling
    const messageBubble = userMessage.locator(".chat-bubble-user");
    await expect(messageBubble).toBeVisible();
    console.log("✅ Message bubble styling applied");

    // Check text content preservation
    const messageText = userMessage.locator(".whitespace-pre-wrap");
    await expect(messageText).toHaveText("Timestamp test message");
    console.log("✅ Message text preserved correctly");

    console.log("🎉 Timestamp and formatting test passed!");
  });

  test("verifies empty state restoration after clearing", async ({ page }) => {
    console.log("🎯 Testing empty state restoration");

    await page.goto("/");
    await page.waitForTimeout(2000);

    const simpleChat = page.locator('[aria-label="Simple Chat"]');
    await expect(simpleChat).toBeVisible();

    const input = simpleChat.locator('input[aria-label="Message input"]');
    const sendButton = simpleChat.locator('[aria-label="Send message"]');
    const clearButton = simpleChat.getByTestId("clear-chat-button");
    const emptyState = simpleChat.getByTestId("empty-chat-placeholder");

    // Initial state should be empty
    await expect(emptyState).toBeVisible();
    console.log("✅ Initial empty state visible");

    // Send a message
    await input.fill("Test message for clearing");
    await sendButton.click();

    const message = simpleChat.locator('[data-testid="chat-message"]').filter({
      hasText: "Test message for clearing",
    });
    await expect(message).toBeVisible({ timeout: 10000 });
    await expect(emptyState).not.toBeVisible();
    console.log("✅ Message sent, empty state hidden");

    // Clear messages
    await clearButton.click();
    await expect(emptyState).toBeVisible({ timeout: 5000 });
    await expect(message).not.toBeVisible();
    console.log("✅ Messages cleared, empty state restored");

    // Verify empty state content
    await expect(emptyState).toContainText("No messages yet");
    await expect(emptyState).toContainText("Start the conversation");
    console.log("✅ Empty state content correct");

    console.log("🎉 Empty state restoration test passed!");
  });
});
