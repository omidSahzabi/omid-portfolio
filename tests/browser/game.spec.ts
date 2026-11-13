import { expect, test, type Locator } from "@playwright/test";

async function snapshot(canvas: Locator) {
  return canvas.evaluate(element => (element as HTMLCanvasElement & {
    runnerSnapshot: () => { phase: string; y: number; slide: boolean; score: number };
  }).runnerSnapshot());
}

test("the on-demand game supports jump, slide, pause, replay and closing", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto("/?inspect=1");
  await expect(page.locator(".loading-state")).toHaveCount(0, { timeout: 30000 });
  const entry = page.locator("[data-entertain-octocat]:visible");
  await entry.click();
  const dialog = page.getByRole("dialog", { name: "Octocat vs. Developer Life" });
  await expect(dialog).toBeVisible();
  const canvas = dialog.locator("canvas");
  await dialog.getByRole("button", { name: "Start Game" }).click();
  await page.keyboard.press("Space");
  await expect.poll(async () => (await snapshot(canvas)).y).toBeLessThan(0);
  await expect.poll(async () => (await snapshot(canvas)).y).toBe(0);
  await page.keyboard.down("ArrowDown");
  await expect.poll(async () => (await snapshot(canvas)).slide).toBe(true);
  await page.keyboard.up("ArrowDown");
  await expect.poll(async () => (await snapshot(canvas)).slide).toBe(false);
  await dialog.getByRole("button", { name: "Pause", exact: false }).click();
  await expect.poll(async () => (await snapshot(canvas)).phase).toBe("paused");
  const paused = await snapshot(canvas);
  await page.waitForTimeout(250);
  expect((await snapshot(canvas)).score).toBe(paused.score);
  await dialog.getByRole("button", { name: "Resume Game" }).click();
  await expect.poll(async () => (await snapshot(canvas)).phase).toBe("running");
  await expect(dialog.getByRole("button", { name: "Try Again" })).toBeVisible({ timeout: 20000 });
  await dialog.getByRole("button", { name: "Try Again" }).click();
  await expect.poll(async () => (await snapshot(canvas)).phase).toBe("running");
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(entry).toBeFocused();
  expect(await page.evaluate(() => document.body.style.position)).toBe("");
  expect(errors).toEqual([]);
});
