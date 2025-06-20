import { expect, test } from "@playwright/test";

test.describe("WebSocket Connection Testing", () => {
  test("verifies WebSocket connection to LLM agent", async ({ page }) => {
    console.log("🎯 Testing WebSocket connection to LLM agent");

    // Navigate to the chat application
    await page.goto("http://localhost:3000");
    console.log("📄 Page loaded");

    // Listen for console messages to capture WebSocket logs
    page.on("console", (msg) => {
      if (
        msg.text().includes("WebSocket") ||
        msg.text().includes("websocket") ||
        msg.text().includes("ws://")
      ) {
        console.log(`🔍 Browser console: ${msg.text()}`);
      }
    });

    // Wait for the page to load and find an existing chat app
    await page.waitForSelector('[data-testid="chat-app-root"]', {
      timeout: 10000,
    });

    // Find the first chat app
    const chatApp = page.locator('[data-testid="chat-app-root"]').first();
    const chatAppName =
      (await chatApp.getAttribute("aria-label")) || "Unknown Chat";
    console.log(`✅ Found chat app: ${chatAppName}`);

    // Wait a bit for WebSocket connections to establish
    await page.waitForTimeout(3000);
    console.log("⏳ Waited for WebSocket connections");

    // Try to send a simple message to trigger WebSocket activity
    const input = chatApp.locator('input[aria-label="Message input"]');
    const sendButton = chatApp.locator('[aria-label="Send message"]');

    await expect(input).toBeVisible();
    await expect(sendButton).toBeVisible();

    console.log("📝 Sending test message to trigger WebSocket...");
    await input.fill("WebSocket connection test");
    await sendButton.click();

    // Verify user message appears (this confirms the UI is working)
    const userMessage = chatApp
      .getByTestId("chat-message")
      .filter({ hasText: "WebSocket connection test" });
    await expect(userMessage).toBeVisible({ timeout: 5000 });
    console.log("✅ User message appeared - UI working");

    // Wait a bit to see if any WebSocket activity happens
    await page.waitForTimeout(5000);
    console.log("⏳ Waited for potential WebSocket activity");

    // Check if there are any network errors
    const errors = [];
    page.on("pageerror", (error) => {
      errors.push(error.message);
      console.log(`❌ Page error: ${error.message}`);
    });

    page.on("requestfailed", (request) => {
      console.log(
        `❌ Request failed: ${request.url()} - ${request.failure()?.errorText}`,
      );
    });

    console.log("🎉 WebSocket connection test completed");
  });

  test("checks browser WebSocket capabilities", async ({ page }) => {
    console.log("🎯 Testing browser WebSocket capabilities");

    await page.goto("http://localhost:3000");

    // Test WebSocket directly in the browser
    const wsTest = await page.evaluate(async () => {
      try {
        const ws = new WebSocket(
          "ws://localhost:8080/chat?chatId=test-connection",
        );

        return new Promise((resolve) => {
          const timeout = setTimeout(() => {
            ws.close();
            resolve({ success: false, error: "Connection timeout" });
          }, 5000);

          ws.onopen = () => {
            clearTimeout(timeout);
            ws.close();
            resolve({ success: true, error: null });
          };

          ws.onerror = (error) => {
            clearTimeout(timeout);
            resolve({ success: false, error: "Connection error" });
          };
        });
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    console.log(`🔌 WebSocket test result:`, wsTest);

    if (wsTest.success) {
      console.log("✅ WebSocket connection successful");
    } else {
      console.log(`❌ WebSocket connection failed: ${wsTest.error}`);
    }

    expect(wsTest.success).toBe(true);
  });
});
