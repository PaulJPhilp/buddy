import { expect, test } from "@playwright/test";

test.describe("ChatApp – Accessibility & Performance", () => {
  test("maintains accessibility during rapid state changes", async ({
    page,
  }) => {
    await page.goto("/");

    console.log("🎯 Testing accessibility during rapid operations");

    // Create multiple chat apps for testing
    await page.evaluate(() => {
      const configs = [
        {
          id: "a11y-chat-1",
          name: "Accessibility Chat 1",
          agentId: "a11y-agent-1",
          theme: {},
        },
        {
          id: "a11y-chat-2",
          name: "Accessibility Chat 2",
          agentId: "a11y-agent-2",
          theme: {},
        },
        {
          id: "a11y-chat-3",
          name: "Accessibility Chat 3",
          agentId: "a11y-agent-3",
          theme: {},
        },
      ];

      for (const cfg of configs) {
        window.dispatchEvent(
          new CustomEvent("buddy:addChatApp", { detail: cfg }),
        );
      }
    });

    await page.waitForTimeout(2000);

    const chat1 = page.getByRole("region", { name: "Accessibility Chat 1" });
    const chat2 = page.getByRole("region", { name: "Accessibility Chat 2" });
    const chat3 = page.getByRole("region", { name: "Accessibility Chat 3" });

    await expect(chat1).toBeVisible();
    await expect(chat2).toBeVisible();
    await expect(chat3).toBeVisible();

    console.log("✅ Multiple chat apps created");

    // Test 1: Rapid expand/collapse accessibility
    const operations = [
      () => chat1.getByTestId("expand-chat-button").click(),
      () => chat2.getByTestId("expand-chat-button").click(),
      () => chat3.getByTestId("expand-chat-button").click(),
      () => chat1.getByTestId("expand-chat-button").click(), // Collapse
      () => chat2.getByTestId("expand-chat-button").click(), // Collapse
    ];

    for (const operation of operations) {
      await operation();
      await page.waitForTimeout(100); // Small delay between operations

      // Check aria-expanded states are consistent
      const expandedStates = await page.evaluate(() => {
        const chats = document.querySelectorAll('[role="region"]');
        return Array.from(chats).map((chat) => ({
          name: chat.getAttribute("aria-label"),
          expanded: chat.getAttribute("aria-expanded"),
        }));
      });

      // Verify at most one chat is expanded
      const expandedCount = expandedStates.filter(
        (state) => state.expanded === "true",
      ).length;
      expect(expandedCount).toBeLessThanOrEqual(1);
    }

    console.log(
      "✅ Accessibility states remain consistent during rapid changes",
    );

    // Test 2: Focus management during state changes
    await chat1.getByTestId("expand-chat-button").click();
    await expect(chat1).toHaveAttribute("aria-expanded", "true");

    const input1 = chat1.getByLabel("Message input");
    await input1.focus();
    await expect(input1).toBeFocused();

    // Expand another chat (should collapse first)
    await chat2.getByTestId("expand-chat-button").click();
    await expect(chat2).toHaveAttribute("aria-expanded", "true");
    await expect(chat1).toHaveAttribute("aria-expanded", "false");

    // Focus should be manageable in the new expanded chat
    const input2 = chat2.getByLabel("Message input");
    await input2.focus();
    await expect(input2).toBeFocused();

    console.log("✅ Focus management works correctly during state transitions");

    // Test 3: Keyboard navigation
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");

    // Test keyboard accessibility of buttons
    const expandButton3 = chat3.getByTestId("expand-chat-button");
    await expandButton3.focus();
    await page.keyboard.press("Enter");
    await expect(chat3).toHaveAttribute("aria-expanded", "true");

    // Test keyboard navigation within expanded chat
    const input3 = chat3.getByLabel("Message input");
    await input3.focus();
    await input3.type("Keyboard navigation test");

    await page.keyboard.press("Tab"); // Should move to send button
    const sendButton3 = chat3.getByTestId("send-message-button");
    await expect(sendButton3).toBeFocused();

    await page.keyboard.press("Enter"); // Send message
    await expect(
      chat3.getByTestId("chat-message").filter({
        hasText: "Keyboard navigation test",
      }),
    ).toBeVisible();

    console.log("✅ Keyboard navigation fully functional");

    // Test 4: Screen reader compatibility
    const ariaLabels = await page.evaluate(() => {
      const elements = document.querySelectorAll(
        "[aria-label], [aria-labelledby]",
      );
      return Array.from(elements).map((el) => ({
        tag: el.tagName,
        ariaLabel: el.getAttribute("aria-label"),
        ariaLabelledBy: el.getAttribute("aria-labelledby"),
        role: el.getAttribute("role"),
      }));
    });

    // Verify essential elements have proper labels
    const hasRegionLabels = ariaLabels.some(
      (label) => label.role === "region" && label.ariaLabel?.includes("Chat"),
    );
    expect(hasRegionLabels).toBe(true);

    const hasInputLabels = ariaLabels.some((label) =>
      label.ariaLabel?.includes("Message input"),
    );
    expect(hasInputLabels).toBe(true);

    console.log("✅ Screen reader compatibility verified");
  });

  test("handles performance stress with many chat apps", async ({ page }) => {
    await page.goto("/");

    console.log("🎯 Testing performance with multiple chat apps");

    const startTime = Date.now();

    // Create many chat apps to test performance
    await page.evaluate(() => {
      const configs = [];
      for (let i = 1; i <= 20; i++) {
        configs.push({
          id: `perf-chat-${i}`,
          name: `Performance Chat ${i}`,
          agentId: `perf-agent-${i}`,
          theme: {},
        });
      }

      for (const cfg of configs) {
        window.dispatchEvent(
          new CustomEvent("buddy:addChatApp", { detail: cfg }),
        );
      }
    });

    await page.waitForTimeout(1000);

    const creationTime = Date.now() - startTime;
    console.log(`✅ Created 20 chat apps in ${creationTime}ms`);

    // Verify all chats are visible
    const chatCount = await page.getByRole("region").count();
    expect(chatCount).toBe(20);

    // Test rapid interactions across multiple chats
    const interactionStart = Date.now();

    await page.evaluate(() => {
      // Rapid expand/collapse operations
      for (let i = 1; i <= 10; i++) {
        const chatRegion = document.querySelector(
          `[aria-label="Performance Chat ${i}"]`,
        );
        if (chatRegion) {
          const expandButton = chatRegion.querySelector(
            '[data-testid="expand-chat-button"]',
          );
          if (expandButton) {
            expandButton.click();
          }
        }
      }
    });

    await page.waitForTimeout(1000);

    const interactionTime = Date.now() - interactionStart;
    console.log(`✅ Rapid interactions completed in ${interactionTime}ms`);

    // Test message sending performance
    const messageStart = Date.now();

    // Send messages to first 5 chats
    for (let i = 1; i <= 5; i++) {
      const chat = page.getByRole("region", { name: `Performance Chat ${i}` });

      // Expand if not already expanded
      const isExpanded = await chat.getAttribute("aria-expanded");
      if (isExpanded !== "true") {
        await chat.getByTestId("expand-chat-button").click();
        await page.waitForTimeout(100);
      }

      const input = chat.getByLabel("Message input");
      const sendButton = chat.getByTestId("send-message-button");

      await input.fill(`Performance test message ${i}`);
      await sendButton.click();

      // Don't wait for each message individually to test concurrent handling
    }

    // Wait for all messages to appear
    await page.waitForTimeout(3000);

    const messageTime = Date.now() - messageStart;
    console.log(`✅ Sent 5 messages in ${messageTime}ms`);

    // Verify messages appeared correctly
    for (let i = 1; i <= 5; i++) {
      const chat = page.getByRole("region", { name: `Performance Chat ${i}` });
      await expect(
        chat.getByTestId("chat-message").filter({
          hasText: `Performance test message ${i}`,
        }),
      ).toBeVisible();
    }

    console.log("✅ All messages sent and received correctly");

    // Test cleanup performance
    const cleanupStart = Date.now();

    await page.evaluate(() => {
      // Clear all chats
      for (let i = 1; i <= 20; i++) {
        const chatRegion = document.querySelector(
          `[aria-label="Performance Chat ${i}"]`,
        );
        if (chatRegion) {
          const clearButton = chatRegion.querySelector(
            '[data-testid="clear-chat-button"]',
          );
          if (clearButton) {
            clearButton.click();
          }
        }
      }
    });

    await page.waitForTimeout(1000);

    const cleanupTime = Date.now() - cleanupStart;
    console.log(`✅ Cleared all chats in ${cleanupTime}ms`);

    // Verify cleanup worked
    const emptyStates = await page
      .getByTestId("empty-chat-placeholder")
      .count();
    expect(emptyStates).toBeGreaterThan(0);

    console.log("✅ Performance test completed successfully");
  });

  test("handles memory management with message history", async ({ page }) => {
    await page.goto("/");

    console.log("🎯 Testing memory management with large message history");

    // Create a chat app
    await page.evaluate(() => {
      const cfg = {
        id: "memory-test-chat",
        name: "Memory Test Chat",
        agentId: "memory-agent",
        theme: {},
      };
      window.dispatchEvent(
        new CustomEvent("buddy:addChatApp", { detail: cfg }),
      );
    });

    await page.waitForTimeout(1000);

    const memoryChat = page.getByRole("region", { name: "Memory Test Chat" });
    await expect(memoryChat).toBeVisible();

    // Expand the chat
    await memoryChat.getByTestId("expand-chat-button").click();
    await expect(memoryChat).toHaveAttribute("aria-expanded", "true");

    const input = memoryChat.getByLabel("Message input");
    const sendButton = memoryChat.getByTestId("send-message-button");

    console.log("✅ Memory test chat setup complete");

    // Send many messages to test memory handling
    const messageCount = 50;
    const startTime = Date.now();

    for (let i = 1; i <= messageCount; i++) {
      await input.fill(
        `Memory test message ${i} - Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.`,
      );
      await sendButton.click();

      // Add agent responses to increase message volume
      await page.evaluate((msgNum) => {
        const event = {
          chatId: "memory-test-chat",
          message: {
            id: `agent-msg-${msgNum}`,
            text: `Agent response ${msgNum} - Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.`,
            sender: "assistant",
            timestamp: Date.now(),
            metadata: {},
          },
        };
        window.dispatchEvent(
          new CustomEvent("buddy:simulateAgentMessage", { detail: event }),
        );
      }, i);

      // Small delay to prevent overwhelming the system
      if (i % 10 === 0) {
        await page.waitForTimeout(100);
        console.log(`✅ Sent ${i} message pairs`);
      }
    }

    const sendTime = Date.now() - startTime;
    console.log(`✅ Sent ${messageCount * 2} total messages in ${sendTime}ms`);

    // Wait for all messages to be processed
    await page.waitForTimeout(2000);

    // Verify message count
    const totalMessages = await memoryChat.getByTestId("chat-message").count();
    expect(totalMessages).toBe(messageCount * 2); // User + agent messages

    console.log(`✅ All ${totalMessages} messages rendered correctly`);

    // Test scrolling performance with many messages
    const scrollStart = Date.now();

    await page.evaluate(() => {
      const chatContainer = document.querySelector(
        '[data-testid="chat-messages-container"]',
      );
      if (chatContainer) {
        // Scroll to top
        chatContainer.scrollTop = 0;

        // Then scroll to bottom
        setTimeout(() => {
          chatContainer.scrollTop = chatContainer.scrollHeight;
        }, 100);
      }
    });

    await page.waitForTimeout(500);

    const scrollTime = Date.now() - scrollStart;
    console.log(
      `✅ Scrolling through ${totalMessages} messages took ${scrollTime}ms`,
    );

    // Test compact/expand with large message history
    const compactStart = Date.now();

    await memoryChat.getByTestId("expand-chat-button").click(); // Compact
    await expect(memoryChat).toHaveAttribute("aria-expanded", "false");

    await memoryChat.getByTestId("expand-chat-button").click(); // Expand again
    await expect(memoryChat).toHaveAttribute("aria-expanded", "true");

    const compactTime = Date.now() - compactStart;
    console.log(`✅ Compact/expand with large history took ${compactTime}ms`);

    // Verify all messages are still there after compact/expand
    const messagesAfterToggle = await memoryChat
      .getByTestId("chat-message")
      .count();
    expect(messagesAfterToggle).toBe(totalMessages);

    // Test clear operation with large history
    const clearStart = Date.now();

    await memoryChat.getByTestId("clear-chat-button").click();

    await page.waitForTimeout(1000);

    const clearTime = Date.now() - clearStart;
    console.log(`✅ Cleared ${totalMessages} messages in ${clearTime}ms`);

    // Verify clear worked
    await expect(
      memoryChat.getByTestId("empty-chat-placeholder"),
    ).toBeVisible();
    const remainingMessages = await memoryChat
      .getByTestId("chat-message")
      .count();
    expect(remainingMessages).toBe(0);

    console.log("✅ Memory management test completed successfully");
  });

  test("maintains responsiveness during concurrent operations", async ({
    page,
  }) => {
    await page.goto("/");

    console.log("🎯 Testing concurrent operations responsiveness");

    // Create multiple chat apps
    await page.evaluate(() => {
      const configs = [];
      for (let i = 1; i <= 10; i++) {
        configs.push({
          id: `concurrent-chat-${i}`,
          name: `Concurrent Chat ${i}`,
          agentId: `concurrent-agent-${i}`,
          theme: {},
        });
      }

      for (const cfg of configs) {
        window.dispatchEvent(
          new CustomEvent("buddy:addChatApp", { detail: cfg }),
        );
      }
    });

    await page.waitForTimeout(1000);

    console.log("✅ Created 10 chats for concurrent testing");

    // Test concurrent expand operations
    const concurrentStart = Date.now();

    const expandPromises = [];
    for (let i = 1; i <= 5; i++) {
      const chat = page.getByRole("region", { name: `Concurrent Chat ${i}` });
      expandPromises.push(chat.getByTestId("expand-chat-button").click());
    }

    await Promise.all(expandPromises);
    await page.waitForTimeout(500);

    const expandTime = Date.now() - concurrentStart;
    console.log(`✅ Concurrent expand operations took ${expandTime}ms`);

    // Verify only one chat is expanded (last one wins)
    const expandedChats = await page.evaluate(() => {
      const chats = document.querySelectorAll('[role="region"]');
      return Array.from(chats).filter(
        (chat) => chat.getAttribute("aria-expanded") === "true",
      ).length;
    });

    expect(expandedChats).toBeLessThanOrEqual(1);

    // Test concurrent message sending
    const messageStart = Date.now();

    // Find the expanded chat and send concurrent messages
    const expandedChat = await page.evaluate(() => {
      const chats = document.querySelectorAll('[role="region"]');
      return Array.from(chats)
        .find((chat) => chat.getAttribute("aria-expanded") === "true")
        ?.getAttribute("aria-label");
    });

    if (expandedChat) {
      const chat = page.getByRole("region", { name: expandedChat });
      const input = chat.getByLabel("Message input");
      const sendButton = chat.getByTestId("send-message-button");

      // Send multiple messages rapidly
      const messagePromises = [];
      for (let i = 1; i <= 5; i++) {
        messagePromises.push(
          (async () => {
            await input.fill(`Concurrent message ${i}`);
            await sendButton.click();
          })(),
        );
      }

      await Promise.all(messagePromises);
    }

    const messageTime = Date.now() - messageStart;
    console.log(`✅ Concurrent message operations took ${messageTime}ms`);

    // Test concurrent agent message simulation
    await page.evaluate(() => {
      const promises = [];
      for (let i = 1; i <= 10; i++) {
        promises.push(
          new Promise((resolve) => {
            setTimeout(() => {
              const event = {
                chatId: `concurrent-chat-${(i % 5) + 1}`, // Distribute across first 5 chats
                message: {
                  id: `concurrent-agent-msg-${i}`,
                  text: `Concurrent agent message ${i}`,
                  sender: "assistant",
                  timestamp: Date.now(),
                  metadata: {},
                },
              };
              window.dispatchEvent(
                new CustomEvent("buddy:simulateAgentMessage", {
                  detail: event,
                }),
              );
              resolve();
            }, Math.random() * 100); // Random delay up to 100ms
          }),
        );
      }
      return Promise.all(promises);
    });

    await page.waitForTimeout(2000);

    console.log("✅ Concurrent agent message simulation completed");

    // Test system responsiveness after concurrent operations
    const responsivenessStart = Date.now();

    // Try to interact with UI elements
    const chat1 = page.getByRole("region", { name: "Concurrent Chat 1" });
    await chat1.getByTestId("expand-chat-button").click();
    await expect(chat1).toHaveAttribute("aria-expanded", "true");

    const input1 = chat1.getByLabel("Message input");
    await input1.fill("Responsiveness test after concurrent operations");

    const sendButton1 = chat1.getByTestId("send-message-button");
    await sendButton1.click();

    await expect(
      chat1.getByTestId("chat-message").filter({
        hasText: "Responsiveness test after concurrent operations",
      }),
    ).toBeVisible();

    const responsivenessTime = Date.now() - responsivenessStart;
    console.log(`✅ UI responsiveness test took ${responsivenessTime}ms`);

    // Verify system is still stable
    const totalChats = await page.getByRole("region").count();
    expect(totalChats).toBe(10);

    console.log("✅ Concurrent operations test completed - system stable");
  });
});
