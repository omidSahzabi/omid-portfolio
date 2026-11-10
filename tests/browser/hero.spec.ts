import { expect, test, type Page } from "@playwright/test";

async function snapshot(page: Page) {
  return page.locator("canvas").evaluate(canvas => {
    const element = canvas as HTMLCanvasElement;
    if (!element.portfolioSnapshot) throw new Error("Hero inspector is not ready");
    return element.portfolioSnapshot();
  });
}

async function pointOn(page: Page, object: "cat" | "yarn") {
  const scene = await snapshot(page);
  const rect = await page.locator("canvas").boundingBox();
  if (!rect) throw new Error("Expected the 3D canvas");
  const screen = object === "cat" ? scene.catScreen : scene.yarnScreen;
  return { x: rect.x + (screen[0] + 1) * rect.width / 2, y: rect.y + (1 - screen[1]) * rect.height / 2 };
}

async function openHero(page: Page) {
  await page.goto("/?inspect=1");
  await expect(page.locator("canvas")).toBeVisible();
  await expect(page.getByRole("status")).toHaveCount(0, { timeout: 30000 });
  await expect.poll(async () => (await snapshot(page)).heroEnabled).toBe(true);
}

test("cursor over HTML overlays drives bounded eyes, head and an articulated reaching paw", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.setViewportSize({ width: 1440, height: 1000 });
  await openHero(page);
  const ground = (await snapshot(page)).catPosition;
  await page.mouse.move(1250, 430); // Hero headline HTML, outside the canvas event target.
  await expect.poll(async () => (await snapshot(page)).heroMode).toBe("tracking");
  await expect.poll(async () => (await snapshot(page)).headYaw).toBeGreaterThan(0.15);
  await expect.poll(async () => (await snapshot(page)).eyeOffsets[0]).toBeGreaterThan(0.02);
  await expect.poll(async () => (await snapshot(page)).reachingArm[0]).toBeLessThan(-0.8);
  await page.screenshot({ path: "test-results/hero-cursor-right.png" });
  await page.mouse.move(120, 430);
  await expect.poll(async () => (await snapshot(page)).headYaw).toBeLessThan(-0.1);
  await expect.poll(async () => (await snapshot(page)).eyeOffsets[0]).toBeLessThan(-0.015);
  await page.mouse.move(620, 160);
  await expect.poll(async () => (await snapshot(page)).headPitch).toBeLessThan(-0.1);
  await expect.poll(async () => (await snapshot(page)).eyeOffsets[1]).toBeGreaterThan(0.01);
  await page.mouse.move(1200, 880);
  await expect.poll(async () => (await snapshot(page)).headPitch).toBeGreaterThan(0.1);
  const pose = await snapshot(page);
  expect(Math.abs(pose.headYaw)).toBeLessThanOrEqual(0.35);
  expect(Math.abs(pose.eyeOffsets[0])).toBeLessThan(0.045);
  expect(Math.abs(pose.eyeOffsets[1])).toBeLessThan(0.045);
  expect(pose.catPosition).toEqual(ground);
  expect(pose.heroJumps).toBe(0);
  expect(errors).toEqual([]);
});

test("precise cat entry jumps once, excludes yarn and lands grounded", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await openHero(page);
  await page.mouse.move(120, 450);
  await expect.poll(async () => (await snapshot(page)).heroHoverArmed).toBe(true);
  const yarn = await pointOn(page, "yarn");
  await page.mouse.move(yarn.x, yarn.y);
  await page.waitForTimeout(150);
  expect((await snapshot(page)).heroJumps).toBe(0);
  expect((await snapshot(page)).heroPointerInside).toBe(false);
  await page.mouse.move(120, 450);
  const cat = await pointOn(page, "cat");
  await page.mouse.move(cat.x, cat.y);
  await expect.poll(async () => (await snapshot(page)).heroJumps, { timeout: 1500, intervals: [16, 30, 50] }).toBe(1);
  const takeoff = await snapshot(page);
  await expect.poll(async () => (await snapshot(page)).jumpOffset, { intervals: [16, 30, 50] }).toBeGreaterThan(0.15);
  await page.screenshot({ path: "test-results/hero-hover-jump.png" });
  await expect.poll(async () => (await snapshot(page)).heroMode, { intervals: [30, 50] }).not.toBe("jumping");
  await expect.poll(async () => (await snapshot(page)).jumpOffset).toBe(0);
  const landed = await snapshot(page);
  expect(landed.catPosition).toEqual(takeoff.catPosition);
  expect(landed.cameraPosition).toEqual(takeoff.cameraPosition);
  expect(Math.abs(landed.jumpSquash - 1)).toBeLessThan(0.01);
  await page.waitForTimeout(1500);
  expect((await snapshot(page)).heroJumps).toBe(1); // Staying over the cat never repeats the jump.
  await page.mouse.move(120, 450);
  await expect.poll(async () => (await snapshot(page)).heroHoverArmed).toBe(true);
  const again = await pointOn(page, "cat");
  await page.mouse.move(again.x, again.y);
  await expect.poll(async () => (await snapshot(page)).heroJumps, { timeout: 1500 }).toBe(2);
});

test("a mesh re-entry inside the cooldown is rejected and never queued", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await openHero(page);
  await page.mouse.move(120, 450);
  const cat = await pointOn(page, "cat");
  await page.mouse.move(cat.x, cat.y);
  await expect.poll(async () => (await snapshot(page)).heroJumps, { intervals: [16, 30] }).toBe(1);
  // Schedule pointer events at render boundaries so screenshot/driver latency cannot
  // accidentally place the re-entry after the short cooldown has already expired.
  const blocked = await page.locator("canvas").evaluate(async element => {
    const canvas = element as HTMLCanvasElement;
    const read = () => { if (!canvas.portfolioSnapshot) throw new Error("No inspector"); return canvas.portfolioSnapshot(); };
    const until = (condition: (value: ReturnType<typeof read>) => boolean) => new Promise<void>((resolve, reject) => {
      const deadline = performance.now() + 2500;
      const tick = () => {
        if (condition(read())) resolve();
        else if (performance.now() > deadline) reject(new Error("Timed out waiting for the Hero frame"));
        else requestAnimationFrame(tick);
      };
      tick();
    });
    const move = (x: number, y: number) => window.dispatchEvent(new PointerEvent("pointermove", { clientX: x, clientY: y, pointerType: "mouse", bubbles: true }));
    await until(value => value.heroMode !== "jumping");
    move(120, 450);
    await until(value => value.heroHoverArmed);
    const head = read().catScreen, rect = canvas.getBoundingClientRect();
    move(rect.x + (head[0] + 1) * rect.width / 2, rect.y + (1 - head[1]) * rect.height / 2);
    await until(value => value.heroPointerInside);
    return read();
  });
  expect(blocked.heroCooldownRemaining).toBeGreaterThan(0);
  expect(blocked.heroJumps).toBe(1);
  await page.waitForTimeout(1200);
  expect((await snapshot(page)).heroJumps).toBe(1);
});

test("three seconds idle starts yarn play; pointer movement smoothly interrupts it", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await openHero(page);
  await page.mouse.move(1250, 430);
  await expect.poll(async () => (await snapshot(page)).heroMode).toBe("tracking");
  await page.waitForTimeout(2400);
  expect((await snapshot(page)).heroMode).toBe("tracking");
  await expect.poll(async () => (await snapshot(page)).heroMode, { timeout: 1600 }).toBe("yarn");
  await expect.poll(async () => (await snapshot(page)).heroPlayWeight).toBeGreaterThan(0.95);
  await expect.poll(async () => (await snapshot(page)).yarnNudge, { timeout: 4000, intervals: [30, 50] }).toBeGreaterThan(0.04);
  await expect.poll(async () => (await snapshot(page)).headPitch).toBeGreaterThan(0.08);
  const play = await snapshot(page);
  expect(play.reachingArm[0]).toBeGreaterThan(-0.9);
  expect(play.yarnDistance).toBeGreaterThan(0.75);
  expect(play.yarnDistance).toBeLessThan(1.02);
  await page.screenshot({ path: "test-results/hero-idle-yarn.png" });
  await page.mouse.move(1330, 390);
  await expect.poll(async () => (await snapshot(page)).heroMode).toBe("tracking");
  await expect.poll(async () => (await snapshot(page)).heroPlayWeight).toBeLessThan(0.01);
  await expect.poll(async () => (await snapshot(page)).yarnNudge).toBeLessThan(0.005);
  expect((await snapshot(page)).heroJumps).toBe(0);
});

test("scrolling disables Hero interactions and returning restores them without a surprise jump", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await openHero(page);
  await page.mouse.move(1200, 430);
  await expect.poll(async () => (await snapshot(page)).heroMode).toBe("tracking");
  const initial = await snapshot(page);
  await page.mouse.wheel(0, 1300);
  await expect.poll(async () => (await snapshot(page)).progress).toBeGreaterThan(0.1);
  let travel = await snapshot(page);
  expect(travel.heroEnabled).toBe(false);
  expect(travel.heroMode).toBe("idle");
  expect(travel.gait).toBeGreaterThan(initial.gait);
  await page.mouse.move(400, 500);
  expect((await snapshot(page)).heroJumps).toBe(initial.heroJumps);
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await expect.poll(async () => (await snapshot(page)).heroEnabled).toBe(true);
  await page.waitForTimeout(800);
  travel = await snapshot(page);
  expect(travel.heroJumps).toBe(initial.heroJumps);
  expect(travel.heroIdleFor).toBeLessThan(2);
  expect(travel.jumpOffset).toBe(0);
  await page.mouse.move(1300, 400);
  await expect.poll(async () => (await snapshot(page)).heroMode).toBe("tracking");
  await expect.poll(async () => (await snapshot(page)).reachingArm[0]).toBeLessThan(-0.8);
});

test.describe("touch Hero", () => {
  test.use({ hasTouch: true, isMobile: true, viewport: { width: 390, height: 844 } });
  test("plays with yarn, does not require hover, and permits native touch scrolling", async ({ page }) => {
    await openHero(page);
    await expect.poll(async () => (await snapshot(page)).heroMode).toBe("yarn");
    const cat = await pointOn(page, "cat");
    await page.touchscreen.tap(cat.x, cat.y);
    expect((await snapshot(page)).heroJumps).toBe(0);
    const cdp = await page.context().newCDPSession(page);
    await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: 340, y: 600 }] });
    for (let i = 1; i <= 10; i++) {
      await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: 340, y: 600 - i * 30 }] });
      await page.waitForTimeout(20);
    }
    await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(100);
    await expect.poll(async () => (await snapshot(page)).heroEnabled).toBe(false);
    expect((await snapshot(page)).heroJumps).toBe(0);
    await cdp.detach();
  });
});
