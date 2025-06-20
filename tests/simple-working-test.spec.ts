import { expect, test } from "@playwright/test";

test.describe("Simple Working Test", () => {
  test("waits for app to load and then adds chat app", async ({ page }) => {
    await page.goto("/");

    console.log("🔍 Waiting for app to finish loading...");

    // Wait for either the Welcome page or the chat apps to load
    // The app should load much faster now with optimized AppService
    await page.waitForFunction(
      () => {
        // Check if we have the welcome page content or chat apps
        const welcomeText = document.querySelector(
          'h2:has-text("Welcome to Buddy Chat")',
        );
        const chatApps = document.querySelectorAll('[role="region"]');
        const loading = document.querySelector(
          ".h-screen.w-full.flex.items-center.justify-center",
        );

        // Return true if we see welcome content, chat apps, or loading is gone
        return (
          welcomeText ||
          chatApps.length > 0 ||
          !loading?.textContent?.includes("Loading...")
        );
      },
      { timeout: 10000 }, // Much shorter timeout since we optimized loading
    );

    console.log("✅ App finished loading");

    // Take a screenshot to see what we have
    await page.screenshot({ path: "after-loading.png" });

    // Check what's actually on the page
    const pageContent = await page.textContent("body");
    console.log("📄 Page content preview:", pageContent?.substring(0, 200));

    // Now try to add a chat app
    await page.evaluate(() => {
      const chatConfig = {
        id: "test-chat-working",
        name: "Test Chat Working",
        agentId: "test-agent",
        toolbarId: "test-toolbar",
        themeId: "test-theme",
        description: "A test chat for working functionality",
        version: "1.0.0",
        agent: {
          id: "test-agent",
          initialAgentName: "Test Agent",
        },
        toolbar: {
          id: "test-toolbar",
          name: "Test Toolbar",
          tools: [],
        },
        theme: {
          colors: {
            primary: "#3b82f6",
            secondary: "#e5e7eb",
            accent: "#1d4ed8",
            background: "#ffffff",
            text: "#1f2937",
          },
        },
      };

      console.log("🎯 Dispatching buddy:addChatApp event");
      window.dispatchEvent(
        new CustomEvent("buddy:addChatApp", { detail: chatConfig }),
      );
    });

    console.log("⏳ Waiting for chat app to appear...");

    // Wait for chat app to be created
    const chatApp = page.getByRole("region", { name: "Test Chat Working" });
    await expect(chatApp).toBeVisible({ timeout: 5000 });

    console.log("✅ Chat app appeared!");

    // Try to interact with it
    const input = chatApp.getByRole("textbox", { name: "Message input" });

    await input.fill("Hello optimized test!");

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
          hasText: "Hello optimized test!",
        }),
      ).toBeVisible({ timeout: 5000 });

      console.log("✅ Message sent and displayed successfully!");
    } else {
      console.log("❌ No send button found");
    }
  });
});
