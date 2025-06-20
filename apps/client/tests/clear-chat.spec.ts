import { expect, test } from "@playwright/test";

test.describe("ChatApp – Clear conversation", () => {
  test("clears messages and shows placeholder", async ({ page }) => {
    await page.goto("/");

    // Inject a dummy chat-app config so the UI renders something testable.
    await page.evaluate(() => {
      const cfg = {
        id: "playwright-test-chat-app",
        name: "Test Chat",
        agentId: "test-agent",
        theme: {},
      };
      window.dispatchEvent(
        new CustomEvent("buddy:addChatApp", { detail: cfg }),
      );
    });

    // Wait for the chat app to be rendered
    await page.waitForTimeout(2000);

    // Debug: print what's on the page
    console.log("[DEBUG] Page HTML:", await page.locator("body").innerHTML());

    // Find the ChatApp container by its title
    const chatApp = page.getByRole("region", { name: "Test Chat" });
    const clearButton = chatApp.getByTestId("clear-chat-button");
    await expect(clearButton).toBeVisible();

    // Click Clear button (should work even when no messages yet).
    await clearButton.click();

    // Placeholder should be visible only in this ChatApp
    await expect(chatApp.getByTestId("empty-chat-placeholder")).toBeVisible();
  });
});
