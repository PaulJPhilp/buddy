import { expect, test } from "@playwright/test";

test.describe("ChatApp – Tab Management", () => {
  test("preserves chat app states when switching tabs", async ({ page }) => {
    await page.goto("/");

    // Create Tab 1 with chat apps
    await page.evaluate(() => {
      // First create Tab 1
      window.dispatchEvent(
        new CustomEvent("buddy:addTab", {
          detail: {
            tabId: "tab-1",
            name: "Work Tab",
            color: "#3b82f6",
          },
        }),
      );

      // Add chat apps to Tab 1
      const cfg1 = {
        id: "tab1-chat-1",
        name: "Work Chat 1",
        agentId: "work-agent-1",
        tabId: "tab-1",
        theme: {},
      };
      const cfg2 = {
        id: "tab1-chat-2",
        name: "Work Chat 2",
        agentId: "work-agent-2",
        tabId: "tab-1",
        theme: {},
      };

      window.dispatchEvent(
        new CustomEvent("buddy:addChatApp", { detail: cfg1 }),
      );
      window.dispatchEvent(
        new CustomEvent("buddy:addChatApp", { detail: cfg2 }),
      );
    });

    await page.waitForTimeout(1500);

    // Find Tab 1 chat apps and expand one
    const tab1Chat1 = page.getByRole("region", { name: "Work Chat 1" });
    const tab1Chat2 = page.getByRole("region", { name: "Work Chat 2" });

    await expect(tab1Chat1).toBeVisible();
    await expect(tab1Chat2).toBeVisible();

    // Expand first chat in Tab 1
    const expandButton1 = tab1Chat1.getByTestId("expand-chat-button");
    await expandButton1.click();
    await expect(tab1Chat1).toHaveAttribute("aria-expanded", "true");
    await expect(tab1Chat2).toHaveAttribute("aria-expanded", "false");

    console.log("✅ Tab 1 setup complete - Work Chat 1 expanded");

    // Send a message in the expanded chat
    const input1 = tab1Chat1.getByLabel("Message input");
    const sendButton1 = tab1Chat1.getByTestId("send-message-button");
    await input1.fill("Important work message");
    await sendButton1.click();

    await expect(
      tab1Chat1.getByTestId("chat-message").filter({
        hasText: "Important work message",
      }),
    ).toBeVisible({ timeout: 5000 });

    console.log("✅ Message sent in Tab 1");

    // Create Tab 2 with different chat apps
    await page.evaluate(() => {
      // Create Tab 2
      window.dispatchEvent(
        new CustomEvent("buddy:addTab", {
          detail: {
            tabId: "tab-2",
            name: "Personal Tab",
            color: "#10b981",
          },
        }),
      );

      // Switch to Tab 2
      window.dispatchEvent(
        new CustomEvent("buddy:activateTab", {
          detail: { tabId: "tab-2" },
        }),
      );

      // Add different chat apps to Tab 2
      const cfg3 = {
        id: "tab2-chat-1",
        name: "Personal Chat 1",
        agentId: "personal-agent-1",
        tabId: "tab-2",
        theme: {},
      };
      const cfg4 = {
        id: "tab2-chat-2",
        name: "Personal Chat 2",
        agentId: "personal-agent-2",
        tabId: "tab-2",
        theme: {},
      };

      window.dispatchEvent(
        new CustomEvent("buddy:addChatApp", { detail: cfg3 }),
      );
      window.dispatchEvent(
        new CustomEvent("buddy:addChatApp", { detail: cfg4 }),
      );
    });

    await page.waitForTimeout(1500);

    // Tab 1 chats should be hidden/inactive, Tab 2 chats should be visible
    await expect(tab1Chat1).not.toBeVisible();
    await expect(tab1Chat2).not.toBeVisible();

    const tab2Chat1 = page.getByRole("region", { name: "Personal Chat 1" });
    const tab2Chat2 = page.getByRole("region", { name: "Personal Chat 2" });

    await expect(tab2Chat1).toBeVisible();
    await expect(tab2Chat2).toBeVisible();

    console.log("✅ Tab 2 active - Personal chats visible");

    // Expand a chat in Tab 2
    const expandButton3 = tab2Chat1.getByTestId("expand-chat-button");
    await expandButton3.click();
    await expect(tab2Chat1).toHaveAttribute("aria-expanded", "true");

    // Send a message in Tab 2
    const input3 = tab2Chat1.getByLabel("Message input");
    const sendButton3 = tab2Chat1.getByTestId("send-message-button");
    await input3.fill("Personal chat message");
    await sendButton3.click();

    console.log("✅ Tab 2 interactions complete");

    // Switch back to Tab 1
    await page.evaluate(() => {
      window.dispatchEvent(
        new CustomEvent("buddy:activateTab", {
          detail: { tabId: "tab-1" },
        }),
      );
    });

    await page.waitForTimeout(1500);

    // Tab 2 chats should be hidden, Tab 1 chats should be visible again
    await expect(tab2Chat1).not.toBeVisible();
    await expect(tab2Chat2).not.toBeVisible();
    await expect(tab1Chat1).toBeVisible();
    await expect(tab1Chat2).toBeVisible();

    // Verify Tab 1 state is preserved
    await expect(tab1Chat1).toHaveAttribute("aria-expanded", "true");
    await expect(tab1Chat2).toHaveAttribute("aria-expanded", "false");

    // Verify message history is preserved
    await expect(
      tab1Chat1.getByTestId("chat-message").filter({
        hasText: "Important work message",
      }),
    ).toBeVisible();

    console.log("✅ Tab 1 state and history preserved across tab switches");
  });

  test("handles tab closure with chat app cleanup", async ({ page }) => {
    await page.goto("/");

    // Create multiple tabs with chat apps
    await page.evaluate(() => {
      // Create Tab A
      window.dispatchEvent(
        new CustomEvent("buddy:addTab", {
          detail: {
            tabId: "cleanup-tab-a",
            name: "Cleanup Tab A",
            color: "#ef4444",
          },
        }),
      );

      // Create Tab B
      window.dispatchEvent(
        new CustomEvent("buddy:addTab", {
          detail: {
            tabId: "cleanup-tab-b",
            name: "Cleanup Tab B",
            color: "#8b5cf6",
          },
        }),
      );

      // Add chat apps to Tab A
      const cfgA1 = {
        id: "cleanup-chat-a1",
        name: "Cleanup Chat A1",
        agentId: "agent-a1",
        tabId: "cleanup-tab-a",
        theme: {},
      };
      const cfgA2 = {
        id: "cleanup-chat-a2",
        name: "Cleanup Chat A2",
        agentId: "agent-a2",
        tabId: "cleanup-tab-a",
        theme: {},
      };

      // Add chat apps to Tab B
      const cfgB1 = {
        id: "cleanup-chat-b1",
        name: "Cleanup Chat B1",
        agentId: "agent-b1",
        tabId: "cleanup-tab-b",
        theme: {},
      };

      window.dispatchEvent(
        new CustomEvent("buddy:addChatApp", { detail: cfgA1 }),
      );
      window.dispatchEvent(
        new CustomEvent("buddy:addChatApp", { detail: cfgA2 }),
      );
      window.dispatchEvent(
        new CustomEvent("buddy:addChatApp", { detail: cfgB1 }),
      );

      // Activate Tab A initially
      window.dispatchEvent(
        new CustomEvent("buddy:activateTab", {
          detail: { tabId: "cleanup-tab-a" },
        }),
      );
    });

    await page.waitForTimeout(1500);

    // Verify Tab A chat apps are visible
    const chatA1 = page.getByRole("region", { name: "Cleanup Chat A1" });
    const chatA2 = page.getByRole("region", { name: "Cleanup Chat A2" });

    await expect(chatA1).toBeVisible();
    await expect(chatA2).toBeVisible();

    // Send messages in Tab A chats
    const inputA1 = chatA1.getByLabel("Message input");
    const sendButtonA1 = chatA1.getByTestId("send-message-button");
    await inputA1.fill("Message before tab closure");
    await sendButtonA1.click();

    console.log("✅ Tab A setup complete with messages");

    // Switch to Tab B
    await page.evaluate(() => {
      window.dispatchEvent(
        new CustomEvent("buddy:activateTab", {
          detail: { tabId: "cleanup-tab-b" },
        }),
      );
    });

    await page.waitForTimeout(1000);

    // Verify Tab B chat is visible, Tab A chats are hidden
    const chatB1 = page.getByRole("region", { name: "Cleanup Chat B1" });
    await expect(chatB1).toBeVisible();
    await expect(chatA1).not.toBeVisible();
    await expect(chatA2).not.toBeVisible();

    console.log("✅ Tab B activated");

    // Close Tab A programmatically
    await page.evaluate(() => {
      window.dispatchEvent(
        new CustomEvent("buddy:closeTab", {
          detail: { tabId: "cleanup-tab-a" },
        }),
      );
    });

    await page.waitForTimeout(1500);

    // Tab A chat apps should be completely removed from DOM
    await expect(chatA1).toHaveCount(0);
    await expect(chatA2).toHaveCount(0);

    // Tab B should remain unaffected
    await expect(chatB1).toBeVisible();

    console.log("✅ Tab A closed and chat apps cleaned up");

    // Try to switch back to Tab A (should fail gracefully)
    await page.evaluate(() => {
      try {
        window.dispatchEvent(
          new CustomEvent("buddy:activateTab", {
            detail: { tabId: "cleanup-tab-a" },
          }),
        );
      } catch (error) {
        console.log("Expected error when activating closed tab:", error);
      }
    });

    // Tab B should still be active and functional
    await expect(chatB1).toBeVisible();
    const inputB1 = chatB1.getByLabel("Message input");
    await inputB1.fill("Tab B still works after A closure");

    console.log("✅ Tab B remains functional after Tab A closure");
  });

  test("maintains expanded state across tab switches", async ({ page }) => {
    await page.goto("/");

    // Setup: Create two tabs with chat apps
    await page.evaluate(() => {
      // Tab 1
      window.dispatchEvent(
        new CustomEvent("buddy:addTab", {
          detail: {
            tabId: "expand-tab-1",
            name: "Expand Test Tab 1",
            color: "#06b6d4",
          },
        }),
      );

      // Tab 2
      window.dispatchEvent(
        new CustomEvent("buddy:addTab", {
          detail: {
            tabId: "expand-tab-2",
            name: "Expand Test Tab 2",
            color: "#f59e0b",
          },
        }),
      );

      // Chat apps for Tab 1
      const cfg1 = {
        id: "expand-chat-1a",
        name: "Expand Chat 1A",
        agentId: "agent-1a",
        tabId: "expand-tab-1",
        theme: {},
      };
      const cfg2 = {
        id: "expand-chat-1b",
        name: "Expand Chat 1B",
        agentId: "agent-1b",
        tabId: "expand-tab-1",
        theme: {},
      };

      // Chat apps for Tab 2
      const cfg3 = {
        id: "expand-chat-2a",
        name: "Expand Chat 2A",
        agentId: "agent-2a",
        tabId: "expand-tab-2",
        theme: {},
      };

      window.dispatchEvent(
        new CustomEvent("buddy:addChatApp", { detail: cfg1 }),
      );
      window.dispatchEvent(
        new CustomEvent("buddy:addChatApp", { detail: cfg2 }),
      );
      window.dispatchEvent(
        new CustomEvent("buddy:addChatApp", { detail: cfg3 }),
      );

      // Start with Tab 1 active
      window.dispatchEvent(
        new CustomEvent("buddy:activateTab", {
          detail: { tabId: "expand-tab-1" },
        }),
      );
    });

    await page.waitForTimeout(1500);

    // In Tab 1: Expand Chat 1A
    const chat1A = page.getByRole("region", { name: "Expand Chat 1A" });
    const chat1B = page.getByRole("region", { name: "Expand Chat 1B" });

    await expect(chat1A).toBeVisible();
    await expect(chat1B).toBeVisible();

    const expandButton1A = chat1A.getByTestId("expand-chat-button");
    await expandButton1A.click();

    await expect(chat1A).toHaveAttribute("aria-expanded", "true");
    await expect(chat1B).toHaveAttribute("aria-expanded", "false");

    console.log("✅ Tab 1: Chat 1A expanded");

    // Switch to Tab 2
    await page.evaluate(() => {
      window.dispatchEvent(
        new CustomEvent("buddy:activateTab", {
          detail: { tabId: "expand-tab-2" },
        }),
      );
    });

    await page.waitForTimeout(1000);

    // Tab 1 chats should be hidden, Tab 2 chat should be visible
    await expect(chat1A).not.toBeVisible();
    await expect(chat1B).not.toBeVisible();

    const chat2A = page.getByRole("region", { name: "Expand Chat 2A" });
    await expect(chat2A).toBeVisible();

    // Expand chat in Tab 2
    const expandButton2A = chat2A.getByTestId("expand-chat-button");
    await expandButton2A.click();
    await expect(chat2A).toHaveAttribute("aria-expanded", "true");

    console.log("✅ Tab 2: Chat 2A expanded");

    // Perform multiple tab switches to test state persistence
    for (let i = 0; i < 3; i++) {
      // Switch back to Tab 1
      await page.evaluate(() => {
        window.dispatchEvent(
          new CustomEvent("buddy:activateTab", {
            detail: { tabId: "expand-tab-1" },
          }),
        );
      });

      await page.waitForTimeout(500);

      // Verify Tab 1 state is preserved
      await expect(chat1A).toBeVisible();
      await expect(chat1B).toBeVisible();
      await expect(chat1A).toHaveAttribute("aria-expanded", "true");
      await expect(chat1B).toHaveAttribute("aria-expanded", "false");

      // Switch back to Tab 2
      await page.evaluate(() => {
        window.dispatchEvent(
          new CustomEvent("buddy:activateTab", {
            detail: { tabId: "expand-tab-2" },
          }),
        );
      });

      await page.waitForTimeout(500);

      // Verify Tab 2 state is preserved
      await expect(chat2A).toBeVisible();
      await expect(chat2A).toHaveAttribute("aria-expanded", "true");

      console.log(`✅ Tab switch cycle ${i + 1} completed - states preserved`);
    }

    console.log("✅ Expanded states maintained across multiple tab switches");
  });

  test("handles tab creation and deletion edge cases", async ({ page }) => {
    await page.goto("/");

    // Test: Create tab, add chat apps, delete tab, recreate with same ID
    await page.evaluate(() => {
      // Create initial tab
      window.dispatchEvent(
        new CustomEvent("buddy:addTab", {
          detail: {
            tabId: "edge-case-tab",
            name: "Edge Case Tab",
            color: "#ec4899",
          },
        }),
      );

      // Add chat app
      const cfg = {
        id: "edge-case-chat",
        name: "Edge Case Chat",
        agentId: "edge-agent",
        tabId: "edge-case-tab",
        theme: {},
      };

      window.dispatchEvent(
        new CustomEvent("buddy:addChatApp", { detail: cfg }),
      );

      window.dispatchEvent(
        new CustomEvent("buddy:activateTab", {
          detail: { tabId: "edge-case-tab" },
        }),
      );
    });

    await page.waitForTimeout(1000);

    const edgeChat = page.getByRole("region", { name: "Edge Case Chat" });
    await expect(edgeChat).toBeVisible();

    // Send a message
    const input = edgeChat.getByLabel("Message input");
    const sendButton = edgeChat.getByTestId("send-message-button");
    await input.fill("Message before tab deletion");
    await sendButton.click();

    console.log("✅ Edge case setup complete");

    // Delete the tab
    await page.evaluate(() => {
      window.dispatchEvent(
        new CustomEvent("buddy:closeTab", {
          detail: { tabId: "edge-case-tab" },
        }),
      );
    });

    await page.waitForTimeout(1000);

    // Chat should be removed
    await expect(edgeChat).toHaveCount(0);

    console.log("✅ Tab deleted, chat cleaned up");

    // Recreate tab with same ID
    await page.evaluate(() => {
      window.dispatchEvent(
        new CustomEvent("buddy:addTab", {
          detail: {
            tabId: "edge-case-tab",
            name: "Recreated Edge Case Tab",
            color: "#14b8a6",
          },
        }),
      );

      // Add new chat app with different ID
      const newCfg = {
        id: "new-edge-case-chat",
        name: "New Edge Case Chat",
        agentId: "new-edge-agent",
        tabId: "edge-case-tab",
        theme: {},
      };

      window.dispatchEvent(
        new CustomEvent("buddy:addChatApp", { detail: newCfg }),
      );

      window.dispatchEvent(
        new CustomEvent("buddy:activateTab", {
          detail: { tabId: "edge-case-tab" },
        }),
      );
    });

    await page.waitForTimeout(1000);

    // New chat should be visible and clean (no old messages)
    const newEdgeChat = page.getByRole("region", {
      name: "New Edge Case Chat",
    });
    await expect(newEdgeChat).toBeVisible();

    // Should show empty state (no previous messages)
    const emptyState = newEdgeChat.getByTestId("empty-chat-placeholder");
    await expect(emptyState).toBeVisible();

    console.log("✅ Tab recreated with clean state");
  });
});
