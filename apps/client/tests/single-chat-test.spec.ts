import { expect, test } from "@playwright/test";

test.describe("ChatArea – Single Test", () => {
  test("complete chat flow with real interaction", async ({ page }) => {
    console.log("🔍 Starting test...");

    await page.goto("/");
    console.log("📄 Page loaded");

    // Log existing chat apps first
    const existingApps = await page
      .locator('[data-testid="chat-app-root"]')
      .count();
    console.log(`📱 Found ${existingApps} existing chat apps`);

    // Inject our test chat app
    await page.evaluate(() => {
      console.log("🎯 About to inject chat app");
      const cfg = {
        id: "single-test-chat",
        name: "Single Test Chat",
        agentId: "test-agent",
        theme: {},
      };
      window.dispatchEvent(
        new CustomEvent("buddy:addChatApp", { detail: cfg }),
      );
      console.log("✅ Chat app injection event dispatched");
      return "completed";
    });

    await page.waitForTimeout(3000);
    console.log("⏳ Waited for chat app creation");

    // Check total apps after injection
    const totalApps = await page
      .locator('[data-testid="chat-app-root"]')
      .count();
    console.log(`📱 Now have ${totalApps} total chat apps`);

    // List all chat app names
    const allApps = await page.locator('[data-testid="chat-app-root"]').all();
    for (let i = 0; i < allApps.length; i++) {
      const name = await allApps[i].getAttribute("aria-label");
      console.log(`📋 App ${i}: ${name}`);
    }

    // Find our specific chat app
    const ourChatApp = page.locator('[aria-label="Single Test Chat"]');
    console.log("🔍 Looking for our chat app...");

    await expect(ourChatApp).toBeVisible({ timeout: 5000 });
    console.log("✅ Found our chat app!");

    // Verify empty state
    const emptyState = ourChatApp.getByTestId("empty-chat-placeholder");
    await expect(emptyState).toBeVisible();
    console.log("📭 Empty state visible");

    // Find input and button
    const input = ourChatApp.locator('input[aria-label="Message input"]');
    const sendButton = ourChatApp.locator('[aria-label="Send message"]');

    await expect(input).toBeVisible();
    console.log("📝 Input field found");

    // Type message
    await input.fill("Hello from single test!");
    console.log("⌨️ Typed message");

    // Wait for send button to be enabled and click
    await expect(sendButton).toBeEnabled({ timeout: 2000 });
    console.log("🔘 Send button enabled");

    await sendButton.click();
    console.log("🚀 Message sent!");

    // Wait for message to appear
    const userMessage = ourChatApp
      .locator('[data-testid="chat-message"]')
      .filter({
        hasText: "Hello from single test!",
      });

    await expect(userMessage).toBeVisible({ timeout: 15000 });
    console.log("💬 User message appeared!");

    // Check that empty state is gone
    await expect(emptyState).not.toBeVisible();
    console.log("📬 Empty state hidden");

    // Wait a bit to see if agent response comes
    await page.waitForTimeout(3000);

    // Count total messages
    const totalMessages = await ourChatApp
      .locator('[data-testid="chat-message"]')
      .count();
    console.log(`💬 Total messages: ${totalMessages}`);

    // If more than 1 message, we got an agent response
    if (totalMessages > 1) {
      console.log("🤖 Agent responded!");

      // Look for typing indicator
      const typingIndicator = ourChatApp.getByTestId("typing-indicator");
      if (await typingIndicator.isVisible({ timeout: 1000 })) {
        console.log("⏳ Typing indicator was visible");
      } else {
        console.log("❌ No typing indicator found");
      }
    }

    console.log("🎉 Test completed successfully!");
  });
});
