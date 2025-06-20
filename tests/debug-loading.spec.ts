import { expect, test } from "@playwright/test";

test.describe("Debug Loading", () => {
  test("captures console logs to debug loading issue", async ({ page }) => {
    // Capture console logs
    const consoleLogs: string[] = [];
    page.on('console', msg => {
      consoleLogs.push(`${msg.type()}: ${msg.text()}`);
    });

    // Capture page errors
    const pageErrors: string[] = [];
    page.on('pageerror', error => {
      pageErrors.push(`Page error: ${error.message}`);
    });

    console.log("🔍 Starting page navigation...");
    await page.goto("/");

    console.log("⏳ Waiting 10 seconds to capture logs...");
    await page.waitForTimeout(10000);

    console.log("📄 Page title:", await page.title());
    console.log("📄 Page URL:", page.url());

    // Log all console messages
    console.log("🔍 Console logs:");
    consoleLogs.forEach((log, i) => {
      console.log(`  ${i + 1}: ${log}`);
    });

    // Log any errors
    if (pageErrors.length > 0) {
      console.log("❌ Page errors:");
      pageErrors.forEach((error, i) => {
        console.log(`  ${i + 1}: ${error}`);
      });
    }

    // Check what's visible on the page
    const bodyText = await page.textContent('body');
    console.log("📄 Body text preview:", bodyText?.substring(0, 300));

    // Check if loading div is present
    const loadingDiv = await page.locator('.h-screen.w-full.flex.items-center.justify-center').textContent();
    console.log("⏳ Loading div content:", loadingDiv);

    // Take a screenshot
    await page.screenshot({ path: "debug-loading.png" });
    console.log("📸 Screenshot saved as debug-loading.png");
  });
}); 