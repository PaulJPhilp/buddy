import { Page, expect, test } from "@playwright/test";

test.describe("Debug LLM Flow", () => {
  test("traces complete message flow", async ({ page }) => {
    console.log("🔍 Starting detailed LLM flow debugging");

    // Capture all console logs
    const consoleLogs: string[] = [];
    page.on("console", (msg) => {
      const text = msg.text();
      consoleLogs.push(text);
      if (
        text.includes("WebSocket") ||
        text.includes("ChatService") ||
        text.includes("message")
      ) {
        console.log(`🔍 Browser console: ${text}`);
      }
    });

    // Go to the page
    await page.goto("http://localhost:3001");
    console.log("📄 Page loaded");

    // Wait for page to fully load
    await page.waitForTimeout(2000);

    // Find the first chat app
    const chatApp = page.locator('[data-testid="chat-app-root"]').first();
    await expect(chatApp).toBeVisible({ timeout: 10000 });

    const chatTitle = await chatApp
      .locator('[data-testid="header-title"]')
      .textContent();
    console.log(`✅ Found chat app: ${chatTitle}`);

    // Wait for WebSocket connections to establish
    await page.waitForTimeout(3000);
    console.log("⏳ Waited for WebSocket connections");

    // Check WebSocket connection state
    const wsState = await page.evaluate(() => {
      const logs = (window as any).wsDebugLogs || [];
      return {
        logCount: logs.length,
        lastLogs: logs.slice(-5),
        readyStates: (window as any).wsReadyStates || [],
      };
    });
    console.log("🔌 WebSocket state:", JSON.stringify(wsState, null, 2));

    // Find the input and send a message
    const input = chatApp
      .locator(
        'input[placeholder*="message"], textarea[placeholder*="message"], input[type="text"]',
      )
      .first();
    await expect(input).toBeVisible({ timeout: 5000 });

    console.log("📝 Typing test message...");
    await input.fill("Debug test - please respond with 'DEBUG_SUCCESS'");

    console.log("🚀 Sending message...");
    await input.press("Enter");

    // Wait and check if user message appeared
    await page.waitForTimeout(1000);
    const userMessage = chatApp
      .getByTestId("chat-message")
      .filter({ hasText: "Debug test" });
    await expect(userMessage).toBeVisible({ timeout: 5000 });
    console.log("✅ User message appeared");

    // Wait longer and capture all logs
    console.log("⏳ Waiting 30 seconds for any server response...");
    await page.waitForTimeout(30000);

    // Check for any new messages
    const allMessages = await chatApp.getByTestId("chat-message").count();
    console.log(`📊 Total messages found: ${allMessages}`);

    // Get all message contents
    for (let i = 0; i < allMessages; i++) {
      const messageText = await chatApp
        .getByTestId("chat-message")
        .nth(i)
        .textContent();
      console.log(`📝 Message ${i + 1}: ${messageText?.substring(0, 100)}...`);
    }

    // Check WebSocket state again
    const finalWsState = await page.evaluate(() => {
      const logs = (window as any).wsDebugLogs || [];
      return {
        logCount: logs.length,
        lastLogs: logs.slice(-10),
        readyStates: (window as any).wsReadyStates || [],
      };
    });
    console.log(
      "🔌 Final WebSocket state:",
      JSON.stringify(finalWsState, null, 2),
    );

    // Print recent console logs
    console.log("📋 Recent console logs:");
    consoleLogs.slice(-20).forEach((log, i) => {
      console.log(`  ${i + 1}: ${log}`);
    });

    // Check if we got any assistant response
    const assistantMessages = await chatApp
      .getByTestId("chat-message")
      .filter({ hasNot: page.getByText("Debug test") })
      .count();
    console.log(`🤖 Assistant messages found: ${assistantMessages}`);

    if (assistantMessages > 0) {
      console.log("✅ LLM response received!");
    } else {
      console.log("❌ No LLM response received");
    }
  });
});
