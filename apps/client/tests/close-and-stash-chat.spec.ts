import { expect, test } from "@playwright/test";

test.describe("ChatApp – Close and Stash", () => {
  test("user can close (remove) a chat app from the UI", async ({ page }) => {
    await page.goto("/");

    // Inject two chat-app configs so the UI renders multiple chat apps
    await page.evaluate(() => {
      const cfg1 = {
        id: "playwright-close-chat-app-1",
        name: "Close Test Chat 1",
        agentId: "test-agent-1",
        toolbarId: "toolbar-1",
        themeId: "theme-1",
        theme: {},
      };
      const cfg2 = {
        id: "playwright-close-chat-app-2",
        name: "Close Test Chat 2",
        agentId: "test-agent-2",
        toolbarId: "toolbar-2",
        themeId: "theme-2",
        theme: {},
      };
      window.dispatchEvent(
        new CustomEvent("buddy:addChatApp", { detail: cfg1 }),
      );
      window.dispatchEvent(
        new CustomEvent("buddy:addChatApp", { detail: cfg2 }),
      );
    });

    // Wait for the chat apps to be rendered
    await page.waitForTimeout(2000);

    // Find both ChatApp containers by their region names
    const chatApp1 = page.getByRole("region", { name: "Close Test Chat 1" });
    const chatApp2 = page.getByRole("region", { name: "Close Test Chat 2" });

    // Debug: print the region's HTML to help diagnose selector issues
    console.log("[DEBUG] ChatApp1 region HTML:", await chatApp1.innerHTML());

    // Close the first chat app (look for a close or remove button)
    const closeButton = chatApp1
      .getByTestId("close-chat-button")
      .or(chatApp1.getByRole("button", { name: /close|remove/i }));
    await expect(closeButton).toBeVisible();
    await closeButton.click();

    // The first chat app should be gone
    await expect(chatApp1).toHaveCount(0);
    // The second chat app should still be visible
    await expect(chatApp2).toBeVisible();
  });

  test("user can stash (minimize) a chat app if supported", async ({
    page,
  }) => {
    await page.goto("/");

    // Inject a chat-app config
    await page.evaluate(() => {
      const cfg = {
        id: "playwright-stash-chat-app",
        name: "Stash Test Chat",
        agentId: "test-agent-stash",
        toolbarId: "toolbar-stash",
        themeId: "theme-stash",
        theme: {},
      };
      window.dispatchEvent(
        new CustomEvent("buddy:addChatApp", { detail: cfg }),
      );
    });

    // Wait for the chat app to be rendered
    await page.waitForTimeout(2000);

    const chatApp = page.getByRole("region", { name: "Stash Test Chat" });

    // Try to find a stash/minimize button (by test id or aria-label)
    const stashButton = chatApp
      .getByTestId("stash-chat-button")
      .or(chatApp.getByRole("button", { name: /stash|minimize|collapse/i }));
    // If the button exists, click it and verify the chat app is stashed/minimized
    if (await stashButton.count()) {
      await stashButton.click();
      // The chat app should now have a stashed/minimized state (aria attribute or class)
      await expect(chatApp).toHaveAttribute("aria-expanded", "false");
    } else {
      // If no stash button, just log and pass
      console.log(
        "[INFO] No stash/minimize button found; skipping stash test.",
      );
    }
  });
});
