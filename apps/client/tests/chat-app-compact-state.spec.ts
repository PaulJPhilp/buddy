import { expect, test } from "@playwright/test";

test.describe("ChatApp – Compact State Management", () => {
  test("compacts other chat apps when one expands", async ({ page }) => {
    await page.goto("/");

    // Inject multiple chat app configs
    await page.evaluate(() => {
      const cfg1 = {
        id: "compact-test-chat-1",
        name: "Compact Test Chat 1",
        agentId: "test-agent-1",
        theme: {},
      };
      const cfg2 = {
        id: "compact-test-chat-2",
        name: "Compact Test Chat 2",
        agentId: "test-agent-2",
        theme: {},
      };
      const cfg3 = {
        id: "compact-test-chat-3",
        name: "Compact Test Chat 3",
        agentId: "test-agent-3",
        theme: {},
      };

      // Add all three chat apps
      window.dispatchEvent(
        new CustomEvent("buddy:addChatApp", { detail: cfg1 }),
      );
      window.dispatchEvent(
        new CustomEvent("buddy:addChatApp", { detail: cfg2 }),
      );
      window.dispatchEvent(
        new CustomEvent("buddy:addChatApp", { detail: cfg3 }),
      );
    });

    // Wait for chat apps to be rendered
    await page.waitForTimeout(2000);

    // Find all three chat apps
    const chatApp1 = page.getByRole("region", { name: "Compact Test Chat 1" });
    const chatApp2 = page.getByRole("region", { name: "Compact Test Chat 2" });
    const chatApp3 = page.getByRole("region", { name: "Compact Test Chat 3" });

    // Verify all chat apps are visible initially
    await expect(chatApp1).toBeVisible();
    await expect(chatApp2).toBeVisible();
    await expect(chatApp3).toBeVisible();

    // Initially, all should be in compact state (not expanded)
    await expect(chatApp1).toHaveAttribute("aria-expanded", "false");
    await expect(chatApp2).toHaveAttribute("aria-expanded", "false");
    await expect(chatApp3).toHaveAttribute("aria-expanded", "false");

    console.log("✅ All chat apps initially in compact state");

    // Expand the first chat app
    const expandButton1 = chatApp1.getByTestId("expand-chat-button");
    await expect(expandButton1).toBeVisible();
    await expandButton1.click();

    // First chat app should be expanded
    await expect(chatApp1).toHaveAttribute("aria-expanded", "true");
    console.log("✅ Chat app 1 expanded");

    // Other chat apps should remain compact or become stashed
    // (depending on implementation - they should NOT be expanded)
    await expect(chatApp2).not.toHaveAttribute("aria-expanded", "true");
    await expect(chatApp3).not.toHaveAttribute("aria-expanded", "true");
    console.log("✅ Other chat apps remained compact/stashed");

    // Now expand the second chat app
    const expandButton2 = chatApp2.getByTestId("expand-chat-button");
    await expect(expandButton2).toBeVisible();
    await expandButton2.click();

    // Second chat app should now be expanded
    await expect(chatApp2).toHaveAttribute("aria-expanded", "true");
    console.log("✅ Chat app 2 expanded");

    // First chat app should no longer be expanded (compacted)
    await expect(chatApp1).toHaveAttribute("aria-expanded", "false");
    console.log("✅ Chat app 1 compacted when chat app 2 expanded");

    // Third chat app should still be compact/stashed
    await expect(chatApp3).not.toHaveAttribute("aria-expanded", "true");
    console.log("✅ Chat app 3 remained compact/stashed");
  });

  test("handles compact state with message history preservation", async ({
    page,
  }) => {
    await page.goto("/");

    // Inject two chat app configs
    await page.evaluate(() => {
      const cfg1 = {
        id: "compact-history-chat-1",
        name: "History Test Chat 1",
        agentId: "test-agent-1",
        theme: {},
      };
      const cfg2 = {
        id: "compact-history-chat-2",
        name: "History Test Chat 2",
        agentId: "test-agent-2",
        theme: {},
      };

      window.dispatchEvent(
        new CustomEvent("buddy:addChatApp", { detail: cfg1 }),
      );
      window.dispatchEvent(
        new CustomEvent("buddy:addChatApp", { detail: cfg2 }),
      );
    });

    await page.waitForTimeout(2000);

    const chatApp1 = page.getByRole("region", { name: "History Test Chat 1" });
    const chatApp2 = page.getByRole("region", { name: "History Test Chat 2" });

    // Send a message in the first chat app
    const input1 = chatApp1.getByLabel("Message input");
    const sendButton1 = chatApp1.getByTestId("send-message-button");

    await input1.fill("Message in chat 1");
    await sendButton1.click();

    // Wait for message to appear
    await expect(
      chatApp1.getByTestId("chat-message").filter({
        hasText: "Message in chat 1",
      }),
    ).toBeVisible({ timeout: 5000 });

    console.log("✅ Message sent in chat app 1");

    // Expand the second chat app (should compact the first)
    const expandButton2 = chatApp2.getByTestId("expand-chat-button");
    await expandButton2.click();

    // Verify state changes
    await expect(chatApp2).toHaveAttribute("aria-expanded", "true");
    await expect(chatApp1).toHaveAttribute("aria-expanded", "false");

    console.log("✅ Chat app 2 expanded, chat app 1 compacted");

    // Now expand the first chat app again
    const expandButton1 = chatApp1.getByTestId("expand-chat-button");
    await expandButton1.click();

    // Verify the message history is preserved
    await expect(chatApp1).toHaveAttribute("aria-expanded", "true");
    await expect(
      chatApp1.getByTestId("chat-message").filter({
        hasText: "Message in chat 1",
      }),
    ).toBeVisible();

    console.log("✅ Message history preserved after compact/expand cycle");
  });

  test("handles programmatic CHAT_APP_COMPACTED events", async ({ page }) => {
    await page.goto("/");

    // Inject a chat app config
    await page.evaluate(() => {
      const cfg = {
        id: "programmatic-compact-chat",
        name: "Programmatic Compact Test",
        agentId: "test-agent",
        theme: {},
      };

      window.dispatchEvent(
        new CustomEvent("buddy:addChatApp", { detail: cfg }),
      );
    });

    await page.waitForTimeout(2000);

    const chatApp = page.getByRole("region", {
      name: "Programmatic Compact Test",
    });

    // First expand the chat app
    const expandButton = chatApp.getByTestId("expand-chat-button");
    await expandButton.click();
    await expect(chatApp).toHaveAttribute("aria-expanded", "true");

    console.log("✅ Chat app expanded");

    // Send a programmatic compact event
    await page.evaluate(() => {
      // Simulate workspace store sending a CHAT_APP_COMPACTED event
      window.dispatchEvent(
        new CustomEvent("buddy:chatAppCompacted", {
          detail: {
            appId: "programmatic-compact-chat",
            tabId: "default-tab",
          },
        }),
      );
    });

    // Wait for the event to be processed
    await page.waitForTimeout(1000);

    // Chat app should now be compacted
    await expect(chatApp).toHaveAttribute("aria-expanded", "false");

    console.log("✅ Programmatic compact event processed");
  });

  test("maintains compact state across page interactions", async ({ page }) => {
    await page.goto("/");

    // Inject multiple chat apps
    await page.evaluate(() => {
      const cfg1 = {
        id: "persistent-compact-1",
        name: "Persistent Test 1",
        agentId: "test-agent-1",
        theme: {},
      };
      const cfg2 = {
        id: "persistent-compact-2",
        name: "Persistent Test 2",
        agentId: "test-agent-2",
        theme: {},
      };

      window.dispatchEvent(
        new CustomEvent("buddy:addChatApp", { detail: cfg1 }),
      );
      window.dispatchEvent(
        new CustomEvent("buddy:addChatApp", { detail: cfg2 }),
      );
    });

    await page.waitForTimeout(2000);

    const chatApp1 = page.getByRole("region", { name: "Persistent Test 1" });
    const chatApp2 = page.getByRole("region", { name: "Persistent Test 2" });

    // Expand first chat app
    const expandButton1 = chatApp1.getByTestId("expand-chat-button");
    await expandButton1.click();
    await expect(chatApp1).toHaveAttribute("aria-expanded", "true");

    // Second should be compact/stashed
    await expect(chatApp2).toHaveAttribute("aria-expanded", "false");

    // Perform some interactions (send messages, clear, etc.)
    const input1 = chatApp1.getByLabel("Message input");
    const sendButton1 = chatApp1.getByTestId("send-message-button");

    await input1.fill("Test message");
    await sendButton1.click();

    // Click clear button
    const clearButton1 = chatApp1.getByTestId("clear-chat-button");
    await clearButton1.click();

    // State should be maintained - first still expanded, second still compact
    await expect(chatApp1).toHaveAttribute("aria-expanded", "true");
    await expect(chatApp2).toHaveAttribute("aria-expanded", "false");

    console.log("✅ Compact state maintained across interactions");
  });
});
