import { expect, test, type Page } from "@playwright/test";
import { projectWork } from "../../src/lib/portfolio";

async function snapshot(page: Page) {
  return page.locator("canvas").evaluate(canvas => {
    const element = canvas as HTMLCanvasElement;
    if (!element.portfolioSnapshot) throw new Error("Scene inspector is not ready");
    return element.portfolioSnapshot();
  });
}

async function openJourney(page: Page) {
  await page.goto("/?inspect=1");
  await expect(page.locator("canvas")).toBeVisible();
  await expect(page.getByRole("status")).toHaveCount(0, { timeout: 30000 });
  await expect.poll(async () => (await snapshot(page)).heroEnabled).toBe(true);
}

async function seek(page: Page, story: number) {
  await page.evaluate(p => {
    const original = Math.max(innerHeight * 7.8, 4000) - innerHeight;
    window.scrollTo({ top: original * p, behavior: "instant" });
  }, story);
  await expect.poll(async () => Math.abs((await snapshot(page)).progress - story), { timeout: 10000 }).toBeLessThan(0.0005);
  await page.waitForTimeout(250);
}

test("minimal header, rotating skills, physical contact board and keyboard links", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.setViewportSize({ width: 1440, height: 1000 });
  await openJourney(page);
  const header = page.getByRole("banner");
  await expect(header.getByRole("link", { name: "Omid Sahzabi home" })).toBeVisible();
  await expect(header.getByRole("navigation")).toHaveCount(0);
  await expect(header.getByRole("button")).toHaveCount(0);
  await expect(header.locator(".skill-name")).toHaveCount(1);
  const originalSkill = await header.locator(".skill-name").textContent();
  await expect.poll(() => header.locator(".skill-name").textContent(), { timeout: 4000 }).not.toBe(originalSkill);
  const board = page.locator(".world-sign-source .contact-board-content");
  await expect(board).toBeVisible();
  const email = board.getByRole("link", { name: /EMAIL/ });
  const github = board.getByRole("link", { name: /GITHUB/ });
  await expect(email).toHaveAttribute("href", "mailto:omidpanahiyan5700@gmail.com");
  await expect(github).toHaveAttribute("href", "https://github.com/omidSahzabi");
  await expect(github).toHaveAttribute("target", "_blank");
  await expect(github).toHaveAttribute("rel", "noopener noreferrer");
  const box = await board.boundingBox();
  expect(box?.width).toBeGreaterThan(160);
  await email.focus();
  expect(await email.evaluate(element => document.activeElement === element)).toBe(true);
  expect(await email.evaluate(element => getComputedStyle(element).outlineStyle)).toBe("solid");
  await page.screenshot({ path: "test-results/integrated-hero-desktop.png" });
  const scene = await snapshot(page);
  expect(scene.catVisible).toBe(true);
  expect(scene.headVisible).toBe(true);
  expect(scene.yarnDiameter / scene.catHeight).toBeLessThan(0.3);
  expect(errors).toEqual([]);
});

test("hanging gallery uses real screenshots, live anchors and an unlinked Coming Soon sign", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.context().route(/^https:\/\/(dreamservice\.net|hosseinseyedzade\.dreamservice\.net|daniyalbadrlou\.dreamservice\.net)\/?$/, route => route.fulfill({ contentType: "text/html", body: "<title>Verified destination</title>" }));
  await openJourney(page);
  for (const [i, p] of [0.18, 0.245, 0.305, 0.365].entries()) {
    await seek(page, p);
    const project = projectWork[i];
    const face = project.url
      ? page.locator(".world-sign-source").getByRole("link", { name: `Visit ${project.title}`, exact: true })
      : page.locator(".world-sign-source").getByRole("article", { name: "Mezon Shik Pik — Coming Soon" });
    await expect(face).toBeVisible();
    const image = face.locator("img");
    await expect(image).toHaveAttribute("src", project.image.src);
    await expect.poll(() => image.evaluate(element => (element as HTMLImageElement).complete && (element as HTMLImageElement).naturalWidth > 0)).toBe(true);
    expect(await image.evaluate(element => getComputedStyle(element).objectFit)).toBe("contain");
    const bounds = await face.boundingBox();
    expect(bounds?.width).toBeGreaterThan(140);
    await page.screenshot({ path: `test-results/project-sign-${project.id}.png` });
    const scene = await snapshot(page);
    expect(scene.headVisible, `${project.title}: cat occluder: ${scene.headOccluder}`).toBe(true);
    if (project.url) {
      await expect(face).toHaveAttribute("href", project.url);
      await expect(face).toHaveAttribute("rel", "noopener noreferrer");
      // A real visitor moves onto the gently suspended sign before clicking.
      // Hover freezes its ambient sway; actionability checks alone never enter it.
      if (!bounds) throw new Error("Expected the hanging sign bounds");
      await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
      await page.waitForTimeout(250);
      const popupPromise = page.waitForEvent("popup");
      await face.click();
      const popup = await popupPromise;
      await expect(popup).toHaveURL(new URL(project.url).href);
      expect(await popup.evaluate(() => window.opener === null)).toBe(true);
      await popup.close();
    } else {
      await expect(face.locator("a")).toHaveCount(0);
      expect(await face.evaluate(element => getComputedStyle(element).cursor)).toBe("default");
      await expect(face.getByText("Coming Soon", { exact: true })).toBeVisible();
    }
  }
});

test("finale requires additional scroll after disappearance, holds when stopped, and reverses", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await openJourney(page);
  await seek(page, 0.995);
  expect((await snapshot(page)).catScale).toBeGreaterThan(0);
  await expect(page.getByRole("link", { name: "Enter DreamService" })).toHaveCount(0);
  await seek(page, 1);
  const endpoint = await snapshot(page);
  expect(endpoint.catScale).toBeLessThan(1e-8);
  expect(endpoint.finaleCamera).toBeLessThan(1e-8);
  expect(endpoint.portalAtmosphere).toBe(0);
  await page.waitForTimeout(1800);
  expect((await snapshot(page)).cameraPosition).toEqual(endpoint.cameraPosition);
  await page.screenshot({ path: "test-results/original-portal-endpoint.png" });
  await seek(page, 1.16);
  const middle = await snapshot(page);
  expect(middle.catVisible).toBe(false);
  expect(middle.cameraPosition).not.toEqual(endpoint.cameraPosition);
  expect(middle.portalAtmosphere).toBeGreaterThan(0);
  expect(middle.portalAtmosphere).toBeLessThan(1);
  await expect(page.getByRole("link", { name: "Enter DreamService" })).toHaveCount(0);
  await page.screenshot({ path: "test-results/portal-mid-reveal.png" });
  await seek(page, 1.32);
  const final = await snapshot(page);
  expect(Math.abs(final.portalScreen[0])).toBeLessThan(0.02);
  expect(Math.abs(final.portalScreen[1])).toBeLessThan(0.02);
  expect(final.cameraDirection[2]).toBeLessThan(-0.999);
  await expect(page.getByRole("heading", { name: "What's next?" })).toBeVisible();
  const cta = page.getByRole("link", { name: "Enter DreamService" });
  await expect(cta).toHaveAttribute("href", "https://dreamservice.net");
  await page.screenshot({ path: "test-results/portal-final-frontal.png" });
  await page.context().route("https://dreamservice.net/", route => route.fulfill({ contentType: "text/html", body: "<title>DreamService destination</title>" }));
  const popupPromise = page.waitForEvent("popup");
  await cta.click();
  const popup = await popupPromise;
  await expect(popup).toHaveURL("https://dreamservice.net/");
  await popup.close();
  await seek(page, 1.12);
  await expect(page.getByRole("link", { name: "Enter DreamService" })).toHaveCount(0);
  await seek(page, 0.995);
  expect((await snapshot(page)).catVisible).toBe(true);
  expect((await snapshot(page)).portalAtmosphere).toBe(0);
  expect(errors).toEqual([]);
});

test("mobile has compact skills, contextual sign readers and a usable final CTA", async ({ page }) => {
  for (const width of [320, 390]) {
    await page.setViewportSize({ width, height: 844 });
    await openJourney(page);
    await expect(page.getByRole("banner").getByRole("button")).toHaveCount(0);
    await expect(page.getByRole("button", { name: /Open navigation/ })).toHaveCount(0);
    await page.getByRole("button", { name: "Read contact board", exact: false }).click();
    const contact = page.getByRole("dialog", { name: "Contact information board" });
    await expect(contact).toBeVisible();
    await expect(contact.getByRole("link", { name: /EMAIL/ })).toHaveAttribute("href", "mailto:omidpanahiyan5700@gmail.com");
    await page.keyboard.press("Tab");
    expect(await contact.evaluate(element => element.contains(document.activeElement))).toBe(true);
    await page.keyboard.press("Escape");
    await expect(contact).toHaveCount(0);
    for (const [i, p] of [0.18, 0.245, 0.305, 0.365].entries()) {
      await seek(page, p);
      await page.getByRole("button", { name: `Read sign: ${projectWork[i].title}`, exact: false }).click();
      const reader = page.getByRole("dialog");
      await expect(reader).toBeVisible();
      await expect(reader.locator("img")).toHaveAttribute("src", projectWork[i].image.src);
      if (i === 3) await expect(reader.locator("a")).toHaveCount(0);
      if (i === 2) await page.screenshot({ path: `test-results/mobile-${width}-sign-reader.png` });
      await reader.getByRole("button", { name: "Close sign" }).click();
    }
    await seek(page, 1.32);
    await expect(page.getByRole("link", { name: "Enter DreamService" })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: `test-results/mobile-${width}-finale.png` });
  }
});

test("reduced motion follows the same chapters and signs without a WebGL canvas", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.getByText("Following your reduced-motion preference.")).toBeVisible();
  await expect(page.locator("canvas")).toHaveCount(0);
  await expect(page.locator(".accessible-chapters > li")).toHaveCount(4);
  await expect(page.locator(".accessible-sign-sequence > li")).toHaveCount(4);
  await expect(page.getByRole("link", { name: /EMAIL/ })).toHaveAttribute("href", "mailto:omidpanahiyan5700@gmail.com");
  await expect(page.getByRole("article", { name: "Mezon Shik Pik — Coming Soon" }).locator("a")).toHaveCount(0);
  await expect(page.locator(".skill-name")).toHaveText("React");
  await page.waitForTimeout(3100);
  await expect(page.locator(".skill-name")).toHaveText("React");
});

test("WebGL failure preserves the same readable journey and functional sign links", async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, context: string, ...args: unknown[]) {
      if (context.includes("webgl")) return null;
      return Reflect.apply(original, this, [context, ...args]);
    } as typeof HTMLCanvasElement.prototype.getContext;
  });
  await page.goto("/");
  await expect(page.getByText("The 3D experience is unavailable. The same journey is readable below.")).toBeVisible({ timeout: 30000 });
  await expect(page.getByRole("heading", { name: "I build interfaces people enjoy using." })).toBeVisible();
  await expect(page.getByRole("link", { name: "Visit Hossein Portfolio" })).toHaveAttribute("href", projectWork[1].url!);
  await expect(page.getByRole("link", { name: "Enter DreamService" })).toHaveAttribute("href", "https://dreamservice.net");
});

test("no JavaScript retains the same story, screenshots and supplied contact details", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Hey, I’m Omid." })).toBeVisible();
  await expect(page.getByRole("link", { name: /EMAIL/ })).toHaveAttribute("href", "mailto:omidpanahiyan5700@gmail.com");
  await expect(page.locator(".accessible-sign-sequence img")).toHaveCount(4);
  await context.close();
});

test("rapid forward/reverse scrubs and WebGL context loss preserve access", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await openJourney(page);
  for (const p of [0.2, 1.32, 0.5, 1.16, 0.74, 0]) {
    await page.evaluate(value => window.scrollTo({ top: (Math.max(7.8 * innerHeight, 4000) - innerHeight) * value, behavior: "instant" }), p);
    await page.waitForTimeout(90);
  }
  await expect.poll(async () => (await snapshot(page)).heroEnabled, { timeout: 10000 }).toBe(true);
  expect((await snapshot(page)).cameraPosition.every(Number.isFinite)).toBe(true);
  await page.locator("canvas").evaluate(canvas => {
    const gl = (canvas as HTMLCanvasElement).getContext("webgl2");
    if (!gl) throw new Error("Expected WebGL2");
    gl.getExtension("WEBGL_lose_context")?.loseContext();
  });
  await expect(page.getByText("The 3D experience is unavailable. The same journey is readable below.")).toBeVisible();
});

