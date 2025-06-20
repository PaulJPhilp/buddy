import { expect, test } from "@playwright/test";

test.describe("Simple Working Test", () => {
  test("waits for app to load and then adds chat app", async ({ page }) => {
    await page.goto("/");

    console.log("🔍 Waiting for app to finish loading...");

    // Wait for the loading state to disappear
    await page.waitForFunction(
      () => {
        const loadingDiv = document.querySelector(
          ".h-screen.w-full.flex.items-center.justify-center",
        );
        return !loadingDiv || !loadingDiv.textContent?.includes("Loading...");
      },
      { timeout: 30000 },
    );

    console.log("✅ App finished loading");

    // Take a screenshot to see what we have
    await page.screenshot({ path: "after-loading.png" });

    // Now try to add a chat app
    await page.evaluate(() => {
      console.log("🎯 About to dispatch buddy:addChatApp event");
      const cfg = {
        id: "simple-test-chat",
        name: "Simple Test Chat",
        agentId: "test-agent",
        theme: {},
      };
      window.dispatchEvent(
        new CustomEvent("buddy:addChatApp", { detail: cfg }),
      );
      console.log("✅ Event dispatched");
    });

    await page.waitForTimeout(3000);

    // Check if the chat app was created
    const chatApp = page.getByRole("region", { name: "Simple Test Chat" });
    await expect(chatApp).toBeVisible({ timeout: 10000 });

    console.log("✅ Chat app created successfully!");

    // Try to interact with it
    const input = chatApp.getByRole("textbox", { name: "Message input" });

    await input.fill("Hello test!");

    // Debug: Check what elements are available
    console.log("🔍 Looking for send button...");
    const allButtons = await chatApp.locator("button").all();
    console.log(`Found ${allButtons.length} buttons in chat app`);

    for (let i = 0; i < allButtons.length; i++) {
      const text = await allButtons[i].textContent();
      const testId = await allButtons[i].getAttribute("data-testid");
      console.log(`Button ${i}: text="${text}", testid="${testId}"`);
    }

    // Try different selectors for the send button
    const sendButtonSelectors = [
      '[aria-label="Send message"]',
      'button[data-testid="send-message-button"]',
      'button:has-text("Send")',
      'button[type="submit"]',
      "button:last-child",
    ];

    let actualSendButton = null;
    for (const selector of sendButtonSelectors) {
      const button = chatApp.locator(selector);
      const count = await button.count();
      console.log(`Selector "${selector}" found ${count} elements`);
      if (count > 0) {
        actualSendButton = button.first();
        break;
      }
    }

    if (actualSendButton) {
      await actualSendButton.click();
      console.log("✅ Send button clicked!");

      // Check if message appears
      await expect(
        chatApp.getByTestId("chat-message").filter({
          hasText: "Hello test!",
        }),
      ).toBeVisible({ timeout: 5000 });

      console.log("✅ Message sent and displayed successfully!");
    } else {
      console.log("❌ No send button found");

      // Take a screenshot for debugging
      await page.screenshot({ path: "debug-no-send-button.png" });

      // Print the chat app HTML for debugging
      const chatAppHTML = await chatApp.innerHTML();
      console.log("Chat app HTML:", chatAppHTML);
    }
  });
});
