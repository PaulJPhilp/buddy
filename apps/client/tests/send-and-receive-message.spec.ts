import { expect, test } from "@playwright/test";

test.describe("ChatApp – Send and receive message", () => {
  test("user can send a message and see agent response with typing indicator", async ({
    page,
  }) => {
    await page.goto("/");

    // Inject a dummy chat-app config so the UI renders something testable.
    await page.evaluate(() => {
      const cfg = {
        id: "playwright-send-receive-chat-app",
        name: "Send/Receive Test Chat",
        agentId: "test-agent",
        theme: {},
      };
      window.dispatchEvent(
        new CustomEvent("buddy:addChatApp", { detail: cfg }),
      );
    });

    // Wait for the chat app to be rendered
    await page.waitForTimeout(2000);

    const chatApp = page.getByRole("region", {
      name: "Send/Receive Test Chat",
    });

    // Debug: print the region's HTML to help diagnose selector issues
    console.log("[DEBUG] ChatApp region HTML:", await chatApp.innerHTML());

    const input = chatApp.getByLabel("Message input");
    const sendButton = chatApp.getByTestId("send-message-button");

    // Wait for the input to become enabled
    await expect(input).toBeEnabled({ timeout: 5000 });

    // Type and send a message
    await input.fill("Hello, agent!");
    await sendButton.click();

    // User message should appear
    await expect(
      chatApp.getByText("Hello, agent!", { exact: true }),
    ).toBeVisible();

    // Simulate agent typing (if supported by test harness)
    // This assumes the app exposes a way to simulate agent typing for tests
    await page.evaluate(() => {
      window.dispatchEvent(
        new CustomEvent("buddy:simulateAgentTyping", {
          detail: {
            chatId: "playwright-send-receive-chat-app",
            isTyping: true,
          },
        }),
      );
    });

    // Typing indicator should appear
    await expect(chatApp.getByTestId("typing-indicator")).toBeVisible();

    // Simulate agent response
    await page.evaluate(() => {
      window.dispatchEvent(
        new CustomEvent("buddy:simulateAgentMessage", {
          detail: {
            chatId: "playwright-send-receive-chat-app",
            message: {
              id: "agent-msg-1",
              text: "Hello, user!",
              sender: "assistant",
              timestamp: Date.now(),
              metadata: {},
            },
          },
        }),
      );
    });

    // Agent message should appear
    await expect(
      chatApp.getByText("Hello, user!", { exact: true }),
    ).toBeVisible();
  });
});
