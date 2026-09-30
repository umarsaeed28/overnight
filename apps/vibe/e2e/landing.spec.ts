import { expect, test } from "@playwright/test";

test("loads with the tagline and a focused URL input", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { level: 1, name: "Your app, checked every night." }),
  ).toBeVisible();
  const input = page.getByLabel("Link to your app");
  await expect(input).toBeVisible();
  await expect(input).toBeFocused();
  await expect(page.getByRole("button", { name: "Go" })).toBeVisible();
});

test("shows an inline error for an invalid URL", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Link to your app").fill("http://localhost:3000");
  await page.getByRole("button", { name: "Go" }).click();
  await expect(page.locator("#try").getByRole("status")).toContainText(/https|localhost/i);
  await expect(page).toHaveURL(/\/$/);
});

test("routes a valid URL to onboarding and shows it escaped", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Link to your app").fill("https://my-shop.lovable.app");
  await page.getByRole("button", { name: "Go" }).click();
  await expect(page).toHaveURL(/\/onboarding\?url=https%3A%2F%2Fmy-shop\.lovable\.app%2F$/);
  await expect(page.getByRole("heading", { name: "Onboarding coming next" })).toBeVisible();
  await expect(page.getByText("https://my-shop.lovable.app/")).toBeVisible();
});

test("submits from the keyboard", async ({ page }) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  await page.keyboard.type("app.netlify.app");
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/onboarding\?url=/);
});

test("onboarding never renders an unsafe url as markup", async ({ page }) => {
  await page.goto("/onboarding?url=" + encodeURIComponent("https://x.com/<script>alert(1)</script>"));
  await expect(page.locator("main script")).toHaveCount(0);
});

test.describe("reduced motion", () => {
  test.use({ reducedMotion: "reduce" });

  test("shows all three steps in normal flow with no pinned stage", async ({ page }) => {
    await page.goto("/");
    const steps = page.locator("ol.steps > li");
    await expect(steps).toHaveCount(3);
    for (const step of await steps.all()) {
      await expect(step).toBeVisible();
      await expect(step).toHaveCSS("opacity", "1");
      await expect(step).toHaveCSS("position", "static");
    }
    // The section is not turned into a tall scroll track.
    const height = await page.locator("section.story").evaluate((el) => el.getBoundingClientRect().height);
    expect(height).toBeLessThan(2400);
  });
});

test.describe("phone width", () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test("never scrolls sideways", async ({ page }) => {
    await page.goto("/");
    const { scrollWidth, clientWidth } = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
    await expect(page.getByLabel("Link to your app")).toBeVisible();
  });
});

test.describe("fix prompts", () => {
  test.use({ permissions: ["clipboard-read", "clipboard-write"] });

  test("copies the markdown prompt", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Copy prompt" }).click();
    await expect(page.getByRole("status").filter({ hasText: "Copied" })).toBeVisible();
    const copied = await page.evaluate(() => navigator.clipboard.readText());
    expect(copied).toContain("# Fix: Pay button unreachable on phones");
    expect(copied).toContain("## Constraints");
  });
});

test("explains the four agents", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 2, name: "Four agents. One job each." })).toBeVisible();
  const agents = page.locator("#agents").locator("xpath=ancestor::section").locator("ol > li");
  await expect(agents).toHaveCount(4);
  for (const name of ["Explorer", "Test writer", "Runner", "Reporter"]) {
    await expect(page.getByRole("heading", { level: 3, name })).toBeVisible();
  }
  await expect(page.getByRole("img", { name: /four stations/i })).toBeVisible();
});

test.describe("reduced motion, agents", () => {
  test.use({ reducedMotion: "reduce" });

  test("the relay is a still picture", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator(".packet--bug")).toHaveCSS("animation-name", "none");
    await expect(page.locator(".station").first()).toHaveCSS("animation-name", "none");
  });
});

test("pricing shows three tiles", async ({ page }) => {
  await page.goto("/");
  const pricing = page.locator("#pricing").locator("xpath=ancestor::section");
  await expect(pricing.getByRole("heading", { level: 3 })).toHaveText(["One run", "Monthly", "In your sandbox"]);
  await expect(pricing.getByText("$50", { exact: true })).toBeVisible();
  await expect(pricing.getByText("$150", { exact: true })).toBeVisible();
  await expect(pricing.getByText("Custom", { exact: true })).toBeVisible();
  await expect(pricing).toContainText("Nothing is handed off to your repo");
  await expect(pricing).toContainText("A person is always in the loop");
  await expect(pricing).toContainText("RAG system");
  await expect(pricing).not.toContainText("$49");
});

test("explains the agent architecture", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 2, name: "How the agents are built." })).toBeVisible();
  for (const name of ["Your systems", "The agents", "Knowledge (RAG)", "Evals and people"]) {
    await expect(page.getByRole("heading", { level: 3, name })).toBeVisible();
  }
  await expect(page.getByRole("img", { name: /architecture diagram/i })).toBeVisible();
});

test.describe("reduced motion, architecture", () => {
  test.use({ reducedMotion: "reduce" });

  test("the diagram is a still picture", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator(".dg-flow--dash").first()).toHaveCSS("animation-name", "none");
    await expect(page.locator(".dg-agent").first()).toHaveCSS("animation-name", "none");
  });
});
