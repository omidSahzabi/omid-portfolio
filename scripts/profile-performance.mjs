// Production lab measurements using the existing Playwright/Chrome installation.
// Usage: npm start, then node scripts/profile-performance.mjs baseline [runs]
// These are local lab metrics, not Lighthouse scores or field INP.
import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";

const label = process.argv[2] ?? "measurement";
if (!/^[a-z0-9-]+$/i.test(label)) throw new Error("Use a simple report label");
const runs = Number(process.argv[3] ?? 3);
const directory = `.performance/${label}`;
await mkdir(directory, { recursive: true });
const browser = await chromium.launch({ channel: "chrome", args: ["--enable-unsafe-swiftshader"] });
const results = [];
try {
  for (const mobile of [false, true]) for (let run = 1; run <= runs; run++) {
    const device = mobile ? "mobile" : "desktop";
    const context = await browser.newContext({ viewport: mobile ? { width: 390, height: 844 } : { width: 1440, height: 1000 }, deviceScaleFactor: mobile ? 3 : 1, isMobile: mobile, hasTouch: mobile });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.addInitScript(() => {
      const data = window.labMetrics = { lcp: 0, lcpElement: "", shifts: [], tasks: [], frames: [], events: [] };
      new PerformanceObserver(list => { for (const entry of list.getEntries()) { data.lcp = entry.startTime; data.lcpElement = entry.element?.outerHTML.slice(0, 250); } }).observe({ type: "largest-contentful-paint", buffered: true });
      new PerformanceObserver(list => { for (const entry of list.getEntries()) if (!entry.hadRecentInput) data.shifts.push({ time: entry.startTime, value: entry.value }); }).observe({ type: "layout-shift", buffered: true });
      new PerformanceObserver(list => { for (const entry of list.getEntries()) data.tasks.push({ time: entry.startTime, duration: entry.duration }); }).observe({ type: "longtask", buffered: true });
      new PerformanceObserver(list => { for (const entry of list.getEntries()) if (entry.interactionId) data.events.push({ name: entry.name, duration: entry.duration }); }).observe({ type: "event", buffered: true, durationThreshold: 16 });
      let previous;
      const tick = now => { if (previous) data.frames.push({ time: now, duration: now - previous }); previous = now; requestAnimationFrame(tick); };
      requestAnimationFrame(tick);
    });
    const cdp = await context.newCDPSession(page);
    await cdp.send("Network.enable");
    await cdp.send("Network.setCacheDisabled", { cacheDisabled: true });
    await cdp.send("Network.emulateNetworkConditions", { offline: false, latency: mobile ? 150 : 40, downloadThroughput: (mobile ? 1.6 : 10) * 1024 * 1024 / 8, uploadThroughput: 750 * 1024 / 8 });
    await cdp.send("Emulation.setCPUThrottlingRate", { rate: mobile ? 4 : 1 });
    await cdp.send("Performance.enable");
    await page.goto("http://127.0.0.1:3000/?inspect=1", { waitUntil: "load" });
    await page.locator(".loading-state").waitFor({ state: "detached", timeout: 90000 });
    const ready = await page.evaluate(() => performance.now());
    await page.waitForTimeout(Math.max(0, 15000 - ready));
    const startup = await page.evaluate(() => {
      const data = window.labMetrics;
      let cls = 0, value = 0, first = 0, previous = 0;
      for (const shift of data.shifts) { if (shift.time - previous > 1000 || shift.time - first > 5000) { first = shift.time; value = 0; } value += shift.value; cls = Math.max(cls, value); previous = shift.time; }
      return { fcp: performance.getEntriesByName("first-contentful-paint")[0]?.startTime, lcp: data.lcp, lcpElement: data.lcpElement, cls, longTasks: data.tasks, blockingTime15s: data.tasks.filter(t => t.time < 15000).reduce((sum, t) => sum + Math.max(0, t.duration - 50), 0), resources: performance.getEntriesByType("resource").map(r => ({ name: r.name.replace(location.origin, ""), bytes: r.encodedBodySize, type: r.initiatorType, duration: r.duration })), scene: document.querySelector("canvas")?.portfolioSnapshot?.() };
    });
    await page.screenshot({ path: `${directory}/${device}-${run}.png` });
    // Steady-state main-thread CPU profile, separate from startup metrics.
    await cdp.send("Profiler.enable");
    await cdp.send("Profiler.start");
    const before = (await cdp.send("Performance.getMetrics")).metrics;
    const start = await page.evaluate(() => performance.now());
    await page.waitForTimeout(5000);
    const end = await page.evaluate(() => performance.now());
    const after = (await cdp.send("Performance.getMetrics")).metrics;
    const { profile } = await cdp.send("Profiler.stop");
    await writeFile(`${directory}/${device}-${run}.cpuprofile`, JSON.stringify(profile));
    const frames = await page.evaluate(({ start, end }) => window.labMetrics.frames.filter(f => f.time >= start && f.time <= end).map(f => f.duration), { start, end });
    const delta = name => (after.find(m => m.name === name)?.value ?? 0) - (before.find(m => m.name === name)?.value ?? 0);
    await page.getByRole("button", { name: "Read contact board", exact: false }).click();
    await page.getByRole("dialog").waitFor();
    await page.waitForTimeout(300);
    const interactionEvents = await page.evaluate(() => window.labMetrics.events);
    const result = { device, run, ready, ...startup, steady: { seconds: (end - start) / 1000, taskSeconds: delta("TaskDuration"), scriptSeconds: delta("ScriptDuration"), layoutSeconds: delta("LayoutDuration"), frames: frames.length, meanFrameMs: frames.reduce((a, b) => a + b, 0) / frames.length }, interactionEvents, errors };
    results.push(result);
    console.log(JSON.stringify({ device, run, ready, fcp: result.fcp, lcp: result.lcp, cls: result.cls, blockingTime15s: result.blockingTime15s, bytes: result.resources.reduce((sum, r) => sum + r.bytes, 0), steady: result.steady, errors }));
    await writeFile(`${directory}/results.json`, JSON.stringify(results, null, 2));
    await context.close();
  }
} finally { await browser.close(); }
