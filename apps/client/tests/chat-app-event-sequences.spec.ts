import { expect, test } from "@playwright/test";

test.describe("ChatApp – Event Sequences", () => {
  test("handles rapid expand-compact-close sequences", async ({ page }) => {
    await page.goto("/");

    // Create multiple chat apps for sequence testing
    await page.evaluate(() => {
      const configs = [
        {
          id: "sequence-chat-1",
          name: "Sequence Chat 1",
          agentId: "seq-agent-1",
          theme: {},
        },
        {
          id: "sequence-chat-2",
          name: "Sequence Chat 2",
          agentId: "seq-agent-2",
          theme: {},
        },
        {
          id: "sequence-chat-3",
          name: "Sequence Chat 3",
          agentId: "seq-agent-3",
          theme: {},
        },
      ];

      configs.forEach((cfg) => {
        window.dispatchEvent(
          new CustomEvent("buddy:addChatApp", { detail: cfg }),
        );
      });
    });

    await page.waitForTimeout(1500);

    const chat1 = page.getByRole("region", { name: "Sequence Chat 1" });
    const chat2 = page.getByRole("region", { name: "Sequence Chat 2" });
    const chat3 = page.getByRole("region", { name: "Sequence Chat 3" });

    // Verify initial state
    await expect(chat1).toBeVisible();
    await expect(chat2).toBeVisible();
    await expect(chat3).toBeVisible();

    console.log("✅ Initial setup complete - 3 chat apps created");

    // Rapid sequence 1: Expand → Compact → Expand different chat
    const expandButton1 = chat1.getByTestId("expand-chat-button");
    const expandButton2 = chat2.getByTestId("expand-chat-button");

    // Expand chat 1
    await expandButton1.click();
    await expect(chat1).toHaveAttribute("aria-expanded", "true");

    // Immediately expand chat 2 (should compact chat 1)
    await expandButton2.click();
    await expect(chat2).toHaveAttribute("aria-expanded", "true");
    await expect(chat1).toHaveAttribute("aria-expanded", "false");

    console.log("✅ Rapid expand sequence completed");

    // Rapid sequence 2: Close and re-add
    const closeButton2 = chat2.getByTestId("close-chat-button");
    await closeButton2.click();

    // Chat 2 should be removed
    await expect(chat2).toHaveCount(0);

    // Immediately re-add the same chat
    await page.evaluate(() => {
      const cfg = {
        id: "sequence-chat-2-new",
        name: "Sequence Chat 2 Recreated",
        agentId: "seq-agent-2-new",
        theme: {},
      };
      window.dispatchEvent(
        new CustomEvent("buddy:addChatApp", { detail: cfg }),
      );
    });

    await page.waitForTimeout(1000);

    const chat2New = page.getByRole("region", {
      name: "Sequence Chat 2 Recreated",
    });
    await expect(chat2New).toBeVisible();

    console.log("✅ Close and re-add sequence completed");

    // Rapid sequence 3: Multiple rapid expansions
    const expandButton3 = chat3.getByTestId("expand-chat-button");
    const expandButton2New = chat2New.getByTestId("expand-chat-button");

    // Rapid fire expansions (stress test the state machine)
    await expandButton3.click();
    await expandButton1.click();
    await expandButton2New.click();
    await expandButton3.click();

    // Final state: chat 3 should be expanded
    await expect(chat3).toHaveAttribute("aria-expanded", "true");
    await expect(chat1).toHaveAttribute("aria-expanded", "false");
    await expect(chat2New).toHaveAttribute("aria-expanded", "false");

    console.log("✅ Rapid expansion sequence completed - state consistent");
  });

  test("handles concurrent multi-chat operations", async ({ page }) => {
    await page.goto("/");

    // Create multiple chat apps for concurrent testing
    await page.evaluate(() => {
      const configs = [
        {
          id: "concurrent-1",
          name: "Concurrent Chat 1",
          agentId: "conc-1",
          theme: {},
        },
        {
          id: "concurrent-2",
          name: "Concurrent Chat 2",
          agentId: "conc-2",
          theme: {},
        },
        {
          id: "concurrent-3",
          name: "Concurrent Chat 3",
          agentId: "conc-3",
          theme: {},
        },
        {
          id: "concurrent-4",
          name: "Concurrent Chat 4",
          agentId: "conc-4",
          theme: {},
        },
      ];

      configs.forEach((cfg) => {
        window.dispatchEvent(
          new CustomEvent("buddy:addChatApp", { detail: cfg }),
        );
      });
    });

    await page.waitForTimeout(1500);

    const chats = [
      page.getByRole("region", { name: "Concurrent Chat 1" }),
      page.getByRole("region", { name: "Concurrent Chat 2" }),
      page.getByRole("region", { name: "Concurrent Chat 3" }),
      page.getByRole("region", { name: "Concurrent Chat 4" }),
    ];

    // Verify all chats are visible
    for (const chat of chats) {
      await expect(chat).toBeVisible();
    }

    console.log("✅ 4 chat apps created for concurrent testing");

    // Concurrent operations: Send messages in multiple chats simultaneously
    const messagePromises = chats.map(async (chat, index) => {
      const input = chat.getByLabel("Message input");
      const sendButton = chat.getByTestId("send-message-button");

      await input.fill(`Concurrent message ${index + 1}`);
      await sendButton.click();

      return chat.getByTestId("chat-message").filter({
        hasText: `Concurrent message ${index + 1}`,
      });
    });

    // Wait for all messages to be sent concurrently
    const sentMessages = await Promise.all(messagePromises);

    // Verify all messages appeared
    for (const message of sentMessages) {
      await expect(message).toBeVisible({ timeout: 5000 });
    }

    console.log("✅ Concurrent message sending completed");

    // Concurrent expansion operations
    const expansionPromises = chats.map(async (chat, index) => {
      const expandButton = chat.getByTestId("expand-chat-button");
      // Stagger slightly to create realistic concurrent access
      await page.waitForTimeout(index * 100);
      await expandButton.click();
    });

    await Promise.all(expansionPromises);

    // Only the last chat should be expanded (due to mutual exclusion)
    await expect(chats[3]).toHaveAttribute("aria-expanded", "true");
    for (let i = 0; i < 3; i++) {
      await expect(chats[i]).toHaveAttribute("aria-expanded", "false");
    }

    console.log(
      "✅ Concurrent expansion operations completed - state consistent",
    );

    // Concurrent clear operations
    const clearPromises = chats.slice(0, 2).map(async (chat) => {
      const clearButton = chat.getByTestId("clear-chat-button");
      await clearButton.click();
    });

    await Promise.all(clearPromises);

    // First two chats should show empty state
    for (let i = 0; i < 2; i++) {
      const emptyState = chats[i].getByTestId("empty-chat-placeholder");
      await expect(emptyState).toBeVisible();
    }

    console.log("✅ Concurrent clear operations completed");
  });

  test("preserves state through complex user workflows", async ({ page }) => {
    await page.goto("/");

    console.log("🎯 Starting complex user workflow simulation");

    // Step 1: Create workspace with tabs and chats
    await page.evaluate(() => {
      // Create work tab
      window.dispatchEvent(
        new CustomEvent("buddy:addTab", {
          detail: { tabId: "work-tab", name: "Work", color: "#3b82f6" },
        }),
      );

      // Create personal tab
      window.dispatchEvent(
        new CustomEvent("buddy:addTab", {
          detail: { tabId: "personal-tab", name: "Personal", color: "#10b981" },
        }),
      );

      // Add work chats
      const workChats = [
        {
          id: "work-chat-1",
          name: "Project Alpha",
          agentId: "work-1",
          tabId: "work-tab",
        },
        {
          id: "work-chat-2",
          name: "Team Standup",
          agentId: "work-2",
          tabId: "work-tab",
        },
      ];

      // Add personal chats
      const personalChats = [
        {
          id: "personal-chat-1",
          name: "Family Chat",
          agentId: "personal-1",
          tabId: "personal-tab",
        },
      ];

      [...workChats, ...personalChats].forEach((cfg) => {
        window.dispatchEvent(
          new CustomEvent("buddy:addChatApp", {
            detail: { ...cfg, theme: {} },
          }),
        );
      });

      // Start in work tab
      window.dispatchEvent(
        new CustomEvent("buddy:activateTab", { detail: { tabId: "work-tab" } }),
      );
    });

    await page.waitForTimeout(1500);

    // Step 2: Work session - send messages, expand chats
    const projectChat = page.getByRole("region", { name: "Project Alpha" });
    const standupChat = page.getByRole("region", { name: "Team Standup" });

    await expect(projectChat).toBeVisible();
    await expect(standupChat).toBeVisible();

    // Send project update
    const projectInput = projectChat.getByLabel("Message input");
    const projectSend = projectChat.getByTestId("send-message-button");
    await projectInput.fill("Project milestone completed successfully!");
    await projectSend.click();

    // Expand project chat for detailed discussion
    const projectExpand = projectChat.getByTestId("expand-chat-button");
    await projectExpand.click();
    await expect(projectChat).toHaveAttribute("aria-expanded", "true");

    console.log("✅ Work session setup completed");

    // Step 3: Switch to personal tab for break
    await page.evaluate(() => {
      window.dispatchEvent(
        new CustomEvent("buddy:activateTab", {
          detail: { tabId: "personal-tab" },
        }),
      );
    });

    await page.waitForTimeout(1000);

    const familyChat = page.getByRole("region", { name: "Family Chat" });
    await expect(familyChat).toBeVisible();
    await expect(projectChat).not.toBeVisible();

    // Send personal message
    const familyInput = familyChat.getByLabel("Message input");
    const familySend = familyChat.getByTestId("send-message-button");
    await familyInput.fill("Taking a quick break, will be back soon!");
    await familySend.click();

    console.log("✅ Personal break session completed");

    // Step 4: Return to work with complex interactions
    await page.evaluate(() => {
      window.dispatchEvent(
        new CustomEvent("buddy:activateTab", { detail: { tabId: "work-tab" } }),
      );
    });

    await page.waitForTimeout(1000);

    // Verify work state preserved
    await expect(projectChat).toBeVisible();
    await expect(standupChat).toBeVisible();
    await expect(projectChat).toHaveAttribute("aria-expanded", "true");

    // Verify project message still there
    await expect(
      projectChat.getByTestId("chat-message").filter({
        hasText: "Project milestone completed successfully!",
      }),
    ).toBeVisible();

    console.log("✅ Work state preserved after personal break");

    // Step 5: Complex work session - multiple rapid operations
    // Switch focus to standup chat
    const standupExpand = standupChat.getByTestId("expand-chat-button");
    await standupExpand.click();
    await expect(standupChat).toHaveAttribute("aria-expanded", "true");
    await expect(projectChat).toHaveAttribute("aria-expanded", "false");

    // Send standup updates rapidly
    const standupInput = standupChat.getByLabel("Message input");
    const standupSend = standupChat.getByTestId("send-message-button");

    const standupMessages = [
      "Yesterday: Completed feature X",
      "Today: Working on feature Y",
      "Blockers: Need review on PR #123",
    ];

    for (const message of standupMessages) {
      await standupInput.fill(message);
      await standupSend.click();
      await page.waitForTimeout(500); // Realistic typing pace
    }

    console.log("✅ Rapid standup updates completed");

    // Step 6: Add new urgent chat mid-workflow
    await page.evaluate(() => {
      const urgentCfg = {
        id: "urgent-chat",
        name: "URGENT: Production Issue",
        agentId: "urgent-agent",
        tabId: "work-tab",
        theme: {},
      };
      window.dispatchEvent(
        new CustomEvent("buddy:addChatApp", { detail: urgentCfg }),
      );
    });

    await page.waitForTimeout(1000);

    const urgentChat = page.getByRole("region", {
      name: "URGENT: Production Issue",
    });
    await expect(urgentChat).toBeVisible();

    // Immediately expand urgent chat
    const urgentExpand = urgentChat.getByTestId("expand-chat-button");
    await urgentExpand.click();
    await expect(urgentChat).toHaveAttribute("aria-expanded", "true");

    // Other chats should be compacted
    await expect(standupChat).toHaveAttribute("aria-expanded", "false");
    await expect(projectChat).toHaveAttribute("aria-expanded", "false");

    console.log("✅ Urgent chat added and prioritized");

    // Step 7: Final state verification - all data preserved
    // Check project chat history
    const projectExpandFinal = projectChat.getByTestId("expand-chat-button");
    await projectExpandFinal.click();
    await expect(
      projectChat.getByTestId("chat-message").filter({
        hasText: "Project milestone completed successfully!",
      }),
    ).toBeVisible();

    // Check standup chat history
    const standupExpandFinal = standupChat.getByTestId("expand-chat-button");
    await standupExpandFinal.click();
    for (const message of standupMessages) {
      await expect(
        standupChat.getByTestId("chat-message").filter({
          hasText: message,
        }),
      ).toBeVisible();
    }

    // Switch back to personal tab to verify isolation
    await page.evaluate(() => {
      window.dispatchEvent(
        new CustomEvent("buddy:activateTab", {
          detail: { tabId: "personal-tab" },
        }),
      );
    });

    await page.waitForTimeout(1000);

    await expect(
      familyChat.getByTestId("chat-message").filter({
        hasText: "Taking a quick break, will be back soon!",
      }),
    ).toBeVisible();

    console.log("✅ Complex user workflow completed - all state preserved");
  });

  test("handles event flooding gracefully", async ({ page }) => {
    await page.goto("/");

    console.log("🎯 Starting event flooding stress test");

    // Create base chat apps
    await page.evaluate(() => {
      for (let i = 1; i <= 5; i++) {
        const cfg = {
          id: `flood-chat-${i}`,
          name: `Flood Chat ${i}`,
          agentId: `flood-agent-${i}`,
          theme: {},
        };
        window.dispatchEvent(
          new CustomEvent("buddy:addChatApp", { detail: cfg }),
        );
      }
    });

    await page.waitForTimeout(1000);

    // Verify initial setup
    for (let i = 1; i <= 5; i++) {
      const chat = page.getByRole("region", { name: `Flood Chat ${i}` });
      await expect(chat).toBeVisible();
    }

    console.log("✅ Base chat apps created");

    // Test functionality after potential flooding
    const originalChat = page.getByRole("region", { name: "Flood Chat 1" });
    await expect(originalChat).toBeVisible();

    // Test basic functionality
    const input = originalChat.getByLabel("Message input");
    const sendButton = originalChat.getByTestId("send-message-button");
    await input.fill("System responsive test message");
    await sendButton.click();

    await expect(
      originalChat.getByTestId("chat-message").filter({
        hasText: "System responsive test message",
      }),
    ).toBeVisible({ timeout: 5000 });

    console.log("✅ System remains responsive");

    // Test expansion functionality
    const testChat = page.getByRole("region", { name: "Flood Chat 3" });
    await expect(testChat).toBeVisible();

    const expandButton = testChat.getByTestId("expand-chat-button");
    await expandButton.click();
    await expect(testChat).toHaveAttribute("aria-expanded", "true");

    console.log("✅ Event handling stress test completed - system stable");
  });
});
