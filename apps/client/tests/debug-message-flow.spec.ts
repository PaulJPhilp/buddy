import { expect, test } from "@playwright/test";

test.describe("Debug Message Flow", () => {
  test("debug what happens when sending a message", async ({ page }) => {
    await page.goto("/");
    await page.waitForTimeout(2000);

    const pinkChat = page.locator('[aria-label="Pink Chat"]');
    await expect(pinkChat).toBeVisible();
    console.log("✅ Pink Chat found");

    // Take screenshot before sending message
    await page.screenshot({ path: "debug-before-message.png", fullPage: true });

    // Get input and send button
    const input = pinkChat.locator('input[aria-label="Message input"]');
    const sendButton = pinkChat.locator('[aria-label="Send message"]');

    await expect(input).toBeVisible();
    console.log("📝 Input found");

    // Log the current ChatArea HTML before sending
    const chatAreaHTML = await pinkChat.innerHTML();
    console.log("=== CHAT AREA HTML BEFORE SEND ===");
    console.log(chatAreaHTML.substring(0, 1000));

    // Type message
    await input.fill("Debug test message");
    console.log("⌨️ Message typed");

    // Check if send button is enabled
    const isEnabled = await sendButton.isEnabled();
    console.log(`🔘 Send button enabled: ${isEnabled}`);

    // Click send
    await sendButton.click();
    console.log("🚀 Send button clicked");

    // Wait a moment
    await page.waitForTimeout(2000);

    // Take screenshot after sending
    await page.screenshot({ path: "debug-after-message.png", fullPage: true });

    // Log the ChatArea HTML after sending
    const chatAreaHTMLAfter = await pinkChat.innerHTML();
    console.log("=== CHAT AREA HTML AFTER SEND ===");
    console.log(chatAreaHTMLAfter);

    // Check for any elements with "message" in their test id
    const messageElements = await pinkChat.locator('[data-testid*="message"]').count();
    console.log(`📋 Elements with 'message' testid: ${messageElements}`);

    // Check for elements with "chat" in their test id
    const chatElements = await pinkChat.locator('[data-testid*="chat"]').count();
    console.log(`📋 Elements with 'chat' testid: ${chatElements}`);

    // Look for any text content that matches our message
    const bodyText = await page.textContent('body');
    const hasMessage = bodyText?.includes("Debug test message");
    console.log(`📝 Page contains our message: ${hasMessage}`);

    // Check empty state
    const emptyState = pinkChat.getByTestId("empty-chat-placeholder");
    const emptyVisible = await emptyState.isVisible();
    console.log(`📭 Empty state visible: ${emptyVisible}`);

    // Check input value after send
    const inputValue = await input.inputValue();
    console.log(`📝 Input value after send: "${inputValue}"`);

    console.log("🔍 Debug completed");
  });
}); 