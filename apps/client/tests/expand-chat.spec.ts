import { expect, test } from "@playwright/test";

test.describe("ChatApp – Expand conversation", () => {
  test("expands chat app to focus mode", async ({ page }) => {
    await page.goto("/");

    // Inject a dummy chat-app config so the UI renders something testable.
    await page.evaluate(() => {
      const cfg = {
        id: "playwright-expand-chat-app",
        name: "Expand Test Chat",
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

    // Find the ChatApp container by its region name (unique)
    const chatApp = page.getByRole("region", { name: "Expand Test Chat" });

    // Debug: print the region's HTML to help diagnose selector issues
    console.log("[DEBUG] ChatApp region HTML:", await chatApp.innerHTML());

    // Find and click the expand button in the header bar
    const expandButton = chatApp.getByTestId("expand-chat-button");
    await expect(expandButton).toBeVisible();

    // Click the expand button
    await expandButton.click();

    // Verify the chat app is expanded
    await expect(chatApp).toHaveAttribute("aria-expanded", "true");
  });
});
