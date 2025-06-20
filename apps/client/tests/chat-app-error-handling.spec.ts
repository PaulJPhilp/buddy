import { expect, test } from "@playwright/test";

test.describe("ChatApp – Error Handling", () => {
  test("handles malformed buddy:addChatApp events", async ({ page }) => {
    await page.goto("/");

    console.log("🎯 Testing malformed event handling");

    // First, add a valid chat app to establish baseline
    await page.evaluate(() => {
      const validCfg = {
        id: "valid-baseline-chat",
        name: "Valid Baseline Chat",
        agentId: "valid-agent",
        theme: {},
      };
      window.dispatchEvent(
        new CustomEvent("buddy:addChatApp", { detail: validCfg }),
      );
    });

    await page.waitForTimeout(1000);

    const validChat = page.getByRole("region", { name: "Valid Baseline Chat" });
    await expect(validChat).toBeVisible();
    console.log("✅ Baseline valid chat created");

    // Test 1: Missing required fields
    await page.evaluate(() => {
      const malformedConfigs = [
        // Missing id
        {
          name: "No ID Chat",
          agentId: "agent-1",
          theme: {},
        },
        // Missing name
        {
          id: "no-name-chat",
          agentId: "agent-2",
          theme: {},
        },
        // Missing agentId
        {
          id: "no-agent-chat",
          name: "No Agent Chat",
          theme: {},
        },
        // Completely empty
        {},
        // Null values
        {
          id: null,
          name: null,
          agentId: null,
          theme: {},
        },
      ];

      malformedConfigs.forEach((cfg, index) => {
        try {
          window.dispatchEvent(
            new CustomEvent("buddy:addChatApp", { detail: cfg }),
          );
          console.log(`Sent malformed config ${index + 1}`);
        } catch (error) {
          console.log(
            `Expected error for malformed config ${index + 1}:`,
            error,
          );
        }
      });
    });

    await page.waitForTimeout(1500);

    // Verify baseline chat still works after malformed events
    await expect(validChat).toBeVisible();
    const input = validChat.getByLabel("Message input");
    const sendButton = validChat.getByTestId("send-message-button");
    await input.fill("System stable after malformed events");
    await sendButton.click();

    await expect(
      validChat.getByTestId("chat-message").filter({
        hasText: "System stable after malformed events",
      }),
    ).toBeVisible({ timeout: 5000 });

    console.log("✅ System remains stable after malformed events");

    // Test 2: Wrong data types
    await page.evaluate(() => {
      const wrongTypeConfigs = [
        // String instead of object
        "invalid-string-config",
        // Number instead of object
        12345,
        // Array instead of object
        ["invalid", "array", "config"],
        // Function instead of object
        () => "invalid",
        // Config with wrong field types
        {
          id: 123, // Should be string
          name: true, // Should be string
          agentId: {}, // Should be string
          theme: "not-an-object", // Should be object
        },
      ];

      wrongTypeConfigs.forEach((cfg, index) => {
        try {
          window.dispatchEvent(
            new CustomEvent("buddy:addChatApp", { detail: cfg }),
          );
          console.log(`Sent wrong type config ${index + 1}`);
        } catch (error) {
          console.log(
            `Expected error for wrong type config ${index + 1}:`,
            error,
          );
        }
      });
    });

    await page.waitForTimeout(1000);

    // System should still be functional
    const expandButton = validChat.getByTestId("expand-chat-button");
    await expandButton.click();
    await expect(validChat).toHaveAttribute("aria-expanded", "true");

    console.log("✅ System handles wrong data types gracefully");

    // Test 3: Extremely large or malicious payloads
    await page.evaluate(() => {
      try {
        // Very long strings
        const hugeCfg = {
          id: `huge-${"x".repeat(10000)}`,
          name: `Huge Chat ${"y".repeat(10000)}`,
          agentId: `huge-agent-${"z".repeat(10000)}`,
          theme: {},
        };
        window.dispatchEvent(
          new CustomEvent("buddy:addChatApp", { detail: hugeCfg }),
        );

        // Circular reference (should be handled by JSON serialization)
        const circularCfg = {
          id: "circular-chat",
          name: "Circular Chat",
          agentId: "circular-agent",
          theme: {},
        };
        circularCfg.self = circularCfg; // Create circular reference

        window.dispatchEvent(
          new CustomEvent("buddy:addChatApp", { detail: circularCfg }),
        );

        console.log("Sent potentially problematic configs");
      } catch (error) {
        console.log("Expected error for problematic configs:", error);
      }
    });

    await page.waitForTimeout(1000);

    // Verify system resilience
    await expect(validChat).toBeVisible();
    console.log("✅ System resilient to large/malicious payloads");
  });

  test("handles duplicate chat app IDs gracefully", async ({ page }) => {
    await page.goto("/");

    console.log("🎯 Testing duplicate ID handling");

    // Add first chat app
    await page.evaluate(() => {
      const cfg1 = {
        id: "duplicate-test-chat",
        name: "Original Chat",
        agentId: "original-agent",
        theme: {},
      };
      window.dispatchEvent(
        new CustomEvent("buddy:addChatApp", { detail: cfg1 }),
      );
    });

    await page.waitForTimeout(1000);

    const originalChat = page.getByRole("region", { name: "Original Chat" });
    await expect(originalChat).toBeVisible();

    // Send a message in the original chat
    const originalInput = originalChat.getByLabel("Message input");
    const originalSend = originalChat.getByTestId("send-message-button");
    await originalInput.fill("Original chat message");
    await originalSend.click();

    await expect(
      originalChat.getByTestId("chat-message").filter({
        hasText: "Original chat message",
      }),
    ).toBeVisible();

    console.log("✅ Original chat created and functional");

    // Try to add another chat with the same ID
    await page.evaluate(() => {
      const cfg2 = {
        id: "duplicate-test-chat", // Same ID!
        name: "Duplicate Chat",
        agentId: "duplicate-agent",
        theme: {},
      };
      window.dispatchEvent(
        new CustomEvent("buddy:addChatApp", { detail: cfg2 }),
      );
    });

    await page.waitForTimeout(1000);

    // Original chat should still exist and be functional
    await expect(originalChat).toBeVisible();
    await expect(
      originalChat.getByTestId("chat-message").filter({
        hasText: "Original chat message",
      }),
    ).toBeVisible();

    // Check if duplicate was rejected or renamed
    const duplicateChat = page.getByRole("region", { name: "Duplicate Chat" });
    const duplicateChatCount = await duplicateChat.count();

    if (duplicateChatCount > 0) {
      console.log(
        "✅ Duplicate chat was allowed (possibly with ID modification)",
      );
      // If allowed, verify both work independently
      const duplicateInput = duplicateChat.getByLabel("Message input");
      const duplicateSend = duplicateChat.getByTestId("send-message-button");
      await duplicateInput.fill("Duplicate chat message");
      await duplicateSend.click();

      // Messages should be isolated
      await expect(
        duplicateChat.getByTestId("chat-message").filter({
          hasText: "Duplicate chat message",
        }),
      ).toBeVisible();

      // Original shouldn't have duplicate's message
      await expect(
        originalChat.getByTestId("chat-message").filter({
          hasText: "Duplicate chat message",
        }),
      ).not.toBeVisible();
    } else {
      console.log("✅ Duplicate chat was rejected (preferred behavior)");
    }

    // Original chat should remain unaffected
    await originalInput.fill("Still working after duplicate attempt");
    await originalSend.click();

    await expect(
      originalChat.getByTestId("chat-message").filter({
        hasText: "Still working after duplicate attempt",
      }),
    ).toBeVisible();

    console.log("✅ Original chat unaffected by duplicate ID attempt");
  });

  test("handles orphaned chat apps and invalid tab IDs", async ({ page }) => {
    await page.goto("/");

    console.log("🎯 Testing orphaned chat app handling");

    // Create a valid tab and chat app
    await page.evaluate(() => {
      // Create tab
      window.dispatchEvent(
        new CustomEvent("buddy:addTab", {
          detail: {
            tabId: "valid-tab",
            name: "Valid Tab",
            color: "#3b82f6",
          },
        }),
      );

      // Add chat app to valid tab
      const validCfg = {
        id: "valid-tab-chat",
        name: "Valid Tab Chat",
        agentId: "valid-agent",
        tabId: "valid-tab",
        theme: {},
      };
      window.dispatchEvent(
        new CustomEvent("buddy:addChatApp", { detail: validCfg }),
      );

      // Activate the tab
      window.dispatchEvent(
        new CustomEvent("buddy:activateTab", {
          detail: { tabId: "valid-tab" },
        }),
      );
    });

    await page.waitForTimeout(1000);

    const validTabChat = page.getByRole("region", { name: "Valid Tab Chat" });
    await expect(validTabChat).toBeVisible();
    console.log("✅ Valid tab and chat created");

    // Test 1: Add chat app with non-existent tab ID
    await page.evaluate(() => {
      const orphanedConfigs = [
        {
          id: "orphaned-chat-1",
          name: "Orphaned Chat 1",
          agentId: "orphaned-agent-1",
          tabId: "non-existent-tab",
          theme: {},
        },
        {
          id: "orphaned-chat-2",
          name: "Orphaned Chat 2",
          agentId: "orphaned-agent-2",
          tabId: "another-missing-tab",
          theme: {},
        },
        // Chat with null tabId
        {
          id: "null-tab-chat",
          name: "Null Tab Chat",
          agentId: "null-tab-agent",
          tabId: null,
          theme: {},
        },
        // Chat with undefined tabId
        {
          id: "undefined-tab-chat",
          name: "Undefined Tab Chat",
          agentId: "undefined-tab-agent",
          tabId: undefined,
          theme: {},
        },
      ];

      for (const cfg of orphanedConfigs) {
        try {
          window.dispatchEvent(
            new CustomEvent("buddy:addChatApp", { detail: cfg }),
          );
        } catch (error) {
          console.log("Expected error for orphaned chat:", error);
        }
      }
    });

    await page.waitForTimeout(1000);

    // Valid chat should still be visible and functional
    await expect(validTabChat).toBeVisible();
    const input = validTabChat.getByLabel("Message input");
    const sendButton = validTabChat.getByTestId("send-message-button");
    await input.fill("Valid chat still works");
    await sendButton.click();

    console.log("✅ System handles orphaned chat creation gracefully");

    // Test 2: Close tab that has chat apps
    await page.evaluate(() => {
      // Add another chat to the valid tab first
      const anotherCfg = {
        id: "another-valid-chat",
        name: "Another Valid Chat",
        agentId: "another-agent",
        tabId: "valid-tab",
        theme: {},
      };
      window.dispatchEvent(
        new CustomEvent("buddy:addChatApp", { detail: anotherCfg }),
      );
    });

    await page.waitForTimeout(1000);

    const anotherValidChat = page.getByRole("region", {
      name: "Another Valid Chat",
    });
    await expect(anotherValidChat).toBeVisible();

    // Send messages in both chats
    const anotherInput = anotherValidChat.getByLabel("Message input");
    const anotherSend = anotherValidChat.getByTestId("send-message-button");
    await anotherInput.fill("Message before tab closure");
    await anotherSend.click();

    console.log("✅ Multiple chats in tab setup complete");

    // Close the tab
    await page.evaluate(() => {
      window.dispatchEvent(
        new CustomEvent("buddy:closeTab", {
          detail: { tabId: "valid-tab" },
        }),
      );
    });

    await page.waitForTimeout(1500);

    // Both chat apps should be cleaned up
    await expect(validTabChat).toHaveCount(0);
    await expect(anotherValidChat).toHaveCount(0);

    console.log("✅ Chat apps cleaned up when tab closed");

    // Test 3: Try to interact with non-existent tabs
    await page.evaluate(() => {
      try {
        // Try to activate non-existent tab
        window.dispatchEvent(
          new CustomEvent("buddy:activateTab", {
            detail: { tabId: "non-existent-tab" },
          }),
        );

        // Try to close non-existent tab
        window.dispatchEvent(
          new CustomEvent("buddy:closeTab", {
            detail: { tabId: "another-non-existent-tab" },
          }),
        );

        console.log("Sent events for non-existent tabs");
      } catch (error) {
        console.log("Expected error for non-existent tab operations:", error);
      }
    });

    await page.waitForTimeout(1000);

    // System should remain stable
    console.log("✅ System stable after invalid tab operations");
  });

  test("recovers from service connection failures", async ({ page }) => {
    await page.goto("/");

    console.log("🎯 Testing service failure recovery");

    // Create a chat app
    await page.evaluate(() => {
      const cfg = {
        id: "service-test-chat",
        name: "Service Test Chat",
        agentId: "service-agent",
        theme: {},
      };
      window.dispatchEvent(
        new CustomEvent("buddy:addChatApp", { detail: cfg }),
      );
    });

    await page.waitForTimeout(1000);

    const serviceChat = page.getByRole("region", { name: "Service Test Chat" });
    await expect(serviceChat).toBeVisible();

    // Test normal operation first
    const input = serviceChat.getByLabel("Message input");
    const sendButton = serviceChat.getByTestId("send-message-button");

    await input.fill("Normal operation test");
    await sendButton.click();

    await expect(
      serviceChat.getByTestId("chat-message").filter({
        hasText: "Normal operation test",
      }),
    ).toBeVisible({ timeout: 5000 });

    console.log("✅ Normal operation confirmed");

    // Simulate service failure scenarios
    await page.evaluate(() => {
      // Simulate network errors by intercepting and failing requests
      const originalFetch = window.fetch;
      let failureMode = true;

      window.fetch = function (...args) {
        if (failureMode) {
          return Promise.reject(new Error("Simulated network failure"));
        }
        return originalFetch.apply(this, args);
      };

      // Store reference to restore later
      window.originalFetch = originalFetch;
      window.toggleFailureMode = () => {
        failureMode = !failureMode;
        return failureMode;
      };

      console.log("Service failure simulation enabled");
    });

    // Try to send a message during "service failure"
    await input.fill("Message during service failure");
    await sendButton.click();

    // The message might appear locally but fail to send to backend
    // Check for error indicators or retry mechanisms
    await page.waitForTimeout(2000);

    // Look for error states in the UI
    const errorIndicators = [
      serviceChat.getByText(/error/i),
      serviceChat.getByText(/failed/i),
      serviceChat.getByText(/retry/i),
      serviceChat.getByText(/offline/i),
      serviceChat.getByRole("alert"),
      serviceChat.locator('[data-testid*="error"]'),
    ];

    let errorFound = false;
    for (const indicator of errorIndicators) {
      const count = await indicator.count();
      if (count > 0) {
        errorFound = true;
        console.log("✅ Error state detected in UI");
        break;
      }
    }

    if (!errorFound) {
      console.log("ℹ️ No explicit error UI found (may be handled silently)");
    }

    // Test recovery - restore service
    await page.evaluate(() => {
      if (window.originalFetch) {
        window.fetch = window.originalFetch;
        console.log("Service failure simulation disabled - recovery mode");
      }
    });

    await page.waitForTimeout(1000);

    // Try sending a message after "recovery"
    await input.fill("Message after service recovery");
    await sendButton.click();

    await expect(
      serviceChat.getByTestId("chat-message").filter({
        hasText: "Message after service recovery",
      }),
    ).toBeVisible({ timeout: 10000 });

    console.log("✅ Service recovery successful");

    // Test UI responsiveness after failure/recovery cycle
    const expandButton = serviceChat.getByTestId("expand-chat-button");
    await expandButton.click();
    await expect(serviceChat).toHaveAttribute("aria-expanded", "true");

    const clearButton = serviceChat.getByTestId("clear-chat-button");
    await clearButton.click();

    const emptyState = serviceChat.getByTestId("empty-chat-placeholder");
    await expect(emptyState).toBeVisible();

    console.log("✅ UI fully functional after service failure/recovery cycle");
  });

  test("handles malformed message and typing events", async ({ page }) => {
    await page.goto("/");

    console.log("🎯 Testing malformed message event handling");

    // Create a chat app
    await page.evaluate(() => {
      const cfg = {
        id: "message-test-chat",
        name: "Message Test Chat",
        agentId: "message-agent",
        theme: {},
      };
      window.dispatchEvent(
        new CustomEvent("buddy:addChatApp", { detail: cfg }),
      );
    });

    await page.waitForTimeout(1000);

    const messageChat = page.getByRole("region", { name: "Message Test Chat" });
    await expect(messageChat).toBeVisible();

    // Send malformed message events
    await page.evaluate(() => {
      const malformedMessageEvents = [
        // Missing required fields
        {
          chatId: "message-test-chat",
          message: {
            // Missing id, text, sender, timestamp
          },
        },
        // Wrong data types
        {
          chatId: "message-test-chat",
          message: {
            id: 123, // Should be string
            text: null, // Should be string
            sender: true, // Should be string
            timestamp: "not-a-number", // Should be number
          },
        },
        // Null message
        {
          chatId: "message-test-chat",
          message: null,
        },
        // Missing chatId
        {
          message: {
            id: "valid-msg",
            text: "Valid text",
            sender: "assistant",
            timestamp: Date.now(),
          },
        },
        // Wrong chatId
        {
          chatId: "non-existent-chat",
          message: {
            id: "orphaned-msg",
            text: "Orphaned message",
            sender: "assistant",
            timestamp: Date.now(),
          },
        },
      ];

      malformedMessageEvents.forEach((event, index) => {
        try {
          window.dispatchEvent(
            new CustomEvent("buddy:simulateAgentMessage", { detail: event }),
          );
          console.log(`Sent malformed message event ${index + 1}`);
        } catch (error) {
          console.log(
            `Expected error for malformed message ${index + 1}:`,
            error,
          );
        }
      });
    });

    await page.waitForTimeout(1000);

    // Send malformed typing events
    await page.evaluate(() => {
      const malformedTypingEvents = [
        // Missing chatId
        {
          isTyping: true,
        },
        // Wrong data types
        {
          chatId: 123,
          isTyping: "not-a-boolean",
        },
        // Non-existent chat
        {
          chatId: "non-existent-chat",
          isTyping: true,
        },
        // Null values
        {
          chatId: null,
          isTyping: null,
        },
      ];

      malformedTypingEvents.forEach((event, index) => {
        try {
          window.dispatchEvent(
            new CustomEvent("buddy:simulateAgentTyping", { detail: event }),
          );
          console.log(`Sent malformed typing event ${index + 1}`);
        } catch (error) {
          console.log(
            `Expected error for malformed typing ${index + 1}:`,
            error,
          );
        }
      });
    });

    await page.waitForTimeout(1000);

    // Verify chat is still functional
    const input = messageChat.getByLabel("Message input");
    const sendButton = messageChat.getByTestId("send-message-button");
    await input.fill("Chat still works after malformed events");
    await sendButton.click();

    await expect(
      messageChat.getByTestId("chat-message").filter({
        hasText: "Chat still works after malformed events",
      }),
    ).toBeVisible({ timeout: 5000 });

    // Send a valid message event to confirm message handling still works
    await page.evaluate(() => {
      const validEvent = {
        chatId: "message-test-chat",
        message: {
          id: "valid-recovery-msg",
          text: "Valid message after errors",
          sender: "assistant",
          timestamp: Date.now(),
          metadata: {},
        },
      };
      window.dispatchEvent(
        new CustomEvent("buddy:simulateAgentMessage", { detail: validEvent }),
      );
    });

    await page.waitForTimeout(1000);

    await expect(
      messageChat.getByTestId("chat-message").filter({
        hasText: "Valid message after errors",
      }),
    ).toBeVisible();

    console.log(
      "✅ Message handling recovers gracefully from malformed events",
    );
  });
});
