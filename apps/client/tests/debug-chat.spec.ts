import { expect, test } from "@playwright/test";

test.describe("Debug Chat App Creation", () => {
  test("debug what happens when adding chat app", async ({ page }) => {
    await page.goto("/");

    // Take initial screenshot
    await page.screenshot({ path: "debug-initial.png", fullPage: true });

    // Log what's on the page initially
    console.log("=== INITIAL PAGE ===");
    console.log("Page title:", await page.title());
    console.log(
      "Page HTML preview:",
      (await page.locator("body").innerHTML()).substring(0, 500),
    );

    // Inject a chat app config and log the dispatch
    await page.evaluate(() => {
      console.log("About to dispatch buddy:addChatApp event");
      const cfg = {
        id: "debug-chat-test",
        name: "Debug Chat Test",
        agentId: "test-agent",
        theme: {},
      };
      console.log("Config being dispatched:", cfg);

      const event = new CustomEvent("buddy:addChatApp", { detail: cfg });
      console.log("Created event:", event);

      window.dispatchEvent(event);
      console.log("Dispatched buddy:addChatApp event");

      return "Event dispatched";
    });

    console.log("Event dispatch completed");

    // Wait and take another screenshot
    await page.waitForTimeout(3000);
    await page.screenshot({ path: "debug-after-event.png", fullPage: true });

    // Log what's on the page after event
    console.log("=== AFTER EVENT ===");
    const bodyHTML = await page.locator("body").innerHTML();
    console.log("Full page HTML:");
    console.log(bodyHTML);

    // Check for any elements that might be the chat app
    const regions = page.locator('[role="region"]');
    const regionCount = await regions.count();
    console.log("Number of regions found:", regionCount);

    if (regionCount > 0) {
      for (let i = 0; i < regionCount; i++) {
        const region = regions.nth(i);
        const name = await region.getAttribute("aria-label");
        console.log(`Region ${i} name:`, name);
        console.log(`Region ${i} HTML:`, await region.innerHTML());
      }
    }

    // Check for any elements with our test ID
    const chatRoots = page.getByTestId("chat-app-root");
    const chatRootCount = await chatRoots.count();
    console.log("Number of chat-app-root elements:", chatRootCount);

    // Check what's in the main container
    const mainContent = page.locator("main");
    if ((await mainContent.count()) > 0) {
      console.log("Main content HTML:", await mainContent.innerHTML());
    }

    // Look for any errors in console
    page.on("console", (msg) => {
      console.log("Browser console:", msg.type(), msg.text());
    });

    // This test always passes - it's just for debugging
    expect(true).toBe(true);
  });
});
