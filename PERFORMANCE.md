# Performance audit and optimization

Validated November 13, 2026, against original commit `861ddbc`.

## Findings

- The headline is the observed LCP element. It is already server-rendered; its content and entrance timing were preserved. The above-the-fold canvas still loads immediately after hydration.
- Asset delivery was expensive: a 560,932-byte logo displayed at 156–216 CSS pixels, a 596,406-byte favicon, and large project PNGs. This static export disables Next's runtime image optimization, so the previous `Image` component did not resize those files.
- The normal initial visit loaded 1,634,121 bytes of JavaScript in the local preview. The optional external-character GLTF loader and animation support were bundled with the procedural scene even though no external model is configured.
- All five world signs performed full-scene raycasting every frame, including signs already hidden by their chapter/frustum checks. Baseline desktop CPU samples included about 590 ms across raycast, triangle-intersection, and vertex-fetch functions in one five-second profile.
- The yarn submitted fourteen separate strand meshes with identical transforms and materials. Scene rendering and shadow work remain substantial, particularly under mobile CPU throttling.
- The mini-game was already dynamically imported and absent from the initial network requests. The canvas is already memoized, character poses use mutable refs, and scroll progress only publishes changed quantized values. No evidence justified replacing those mechanisms or changing animation timing.
- Fonts are local WOFF2 assets. The browser requested the three relevant Latin weights during the measured startup; importing other subsets does not mean they were all downloaded. Weight 800 was unused. Weight 700 remains available for game controls and semantic bold text.

## Changes

| Files | Optimization |
| --- | --- |
| `src/components/PortfolioExperience.tsx` | Eager, high-priority responsive logo with explicit dimensions and static WebP candidates. Removes the unnecessary client image-component code for this static asset. |
| `src/lib/portfolio.ts`, `public/images/optimized/*` | Full-resolution lossless WebP project screenshots; responsive lossless-encoded logo derivatives; appropriately sized favicon and Apple icon. Original PNGs are retained. |
| `src/app/layout.tsx` | Uses the smaller icons and removes unused font weight 800. |
| `src/components/experience/OctocatCharacter.tsx`, `LoadedCharacter.tsx` | Moves optional GLTF loading and animation support behind `React.lazy`, preserving the original loading/error fallback. |
| `src/components/experience/WorldSign.tsx` | Retains mounted sign content and active-sign occlusion, but supplies no raycast targets when the sign is already inactive. React state changes only when visibility eligibility changes. |
| `src/components/experience/ExperienceCanvas.tsx` | Computes geometry bounding boxes once, enabling Three.js to reject ray misses before triangle tests. |
| `src/components/experience/YarnBall.tsx` | Merges the fourteen opaque yarn strands into one geometry with the same vertices, normals, material, and animation transform. |
| `scripts/serve.mjs` | Correct WebP MIME type for the local static preview. |
| `scripts/optimize-images.mjs` | Reproducible delivery-asset generation using the existing Sharp installation. |
| `scripts/profile-performance.mjs`, `.gitignore` | Reproducible Chrome measurements, with local profiles/screenshots/results excluded from Git. |
| `tests/finale.test.ts` | Checks actual decoded screenshot pixels and dimensions against the source PNGs, rather than assuming PNG file headers. |
| `tests/browser/game.spec.ts` | Covers starting, jumping, sliding, pausing, resuming, collision/replay, closing, and focus restoration. |

No dependencies, camera keyframes, animation durations, DPR settings, antialiasing, lights, shadows, material quality, or scene detail were changed. SEO metadata and all readable/reduced-motion/no-JavaScript fallbacks remain present.

## Measurement method

The existing Playwright installation drives installed Chrome against `npm run build` / `npm start`. Three cold-cache contexts per device use the same viewport, CPU and network emulation: desktop 1440×1000, DPR 1, 10 Mbit/s, 40 ms latency; mobile 390×844, DPR 3, 4× CPU slowdown, 1.6 Mbit/s, 150 ms latency. The existing software-WebGL fallback flag is retained. These runs are local lab evidence, not PageSpeed Insights scores or physical-phone measurements; the local server sends uncompressed responses and no-cache headers.

Reports are saved under `.performance/baseline/`, `.performance/optimized/` (intermediate), and `.performance/final/`. The inspector is used identically on both builds. Timings vary with CPU/GPU load and shader compilation; byte counts and draw counts are more repeatable.

The profiler captures FCP, LCP, CLS, long tasks, one contact-reader interaction, resource sizes, draw calls, and steady-state CPU profiles. Its `blockingTime15s` is a fixed-window diagnostic, **not Lighthouse TBT**. An individual event duration is **not field INP**. Speed Index and updated PageSpeed scores were not measured; Lighthouse is not installed. No numerical PageSpeed improvement is claimed.

## Results

Medians of three runs per device, comparing the original build with the final build:

| Metric | Desktop before → after | Mobile before → after |
| --- | --- | --- |
| Startup resource bodies | 4,026,184 → 3,019,239 bytes (−25.0%) | 2,881,151 → 1,742,501 bytes (−39.5%) |
| Initial JavaScript bodies | 1,634,121 → 1,552,438 bytes (−5.0%) | 1,634,121 → 1,552,438 bytes (−5.0%) |
| FCP / observed LCP | 432 → 420 ms | 2,852 → 2,812 ms |
| Scene ready | 2,553 → 2,514 ms | 19,925 → 15,272 ms |
| CLS | 0.00138 → 0.00138 | 0 → 0 |
| Draw calls at the hero | 264 → 251 | 218 → 205 |
| Rendered triangles | 45,136 → 45,136 | 41,032 → 41,032 |
| Main-thread task time during ~5 s idle profile | 3.27 → 3.05 s | 5.05 → 5.09 s |
| Mean frame interval during that profile | 16.71 → 16.65 ms | 83.26 → 63.44 ms |
| Contact-reader interaction duration | 64 → 72 ms | 400 → 280 ms |
| Fixed first-15-second blocking diagnostic | 403 → 582 ms | 4,900 → 7,158 ms |

The repeatable benefits are smaller downloads and thirteen fewer draw calls without removing triangles. The default route no longer downloads the optional GLTF loader, while the total emitted JavaScript is almost unchanged because the optional feature still exists. Project images total 2,173,815 → 1,366,946 bytes (−37.1%), with exactly equal decoded pixels. The favicon is 596,406 → 2,743 bytes. Desktop selects the 9,444-byte logo; the DPR-3 mobile run selects the 42,164-byte candidate instead of the 560,932-byte original.

Startup image scheduling differs: the final desktop capture includes all four project images, whereas the baseline includes three. Two final mobile captures also include the small Mezon image; the other does not. The resource totals above report actual captured traffic rather than assuming identical requests.

FCP/LCP differences are small relative to run variability. The intermediate build had larger timing improvements that did not fully repeat in the final runs. Mobile main-thread utilization remains saturated, and the fixed-window blocking diagnostic increased. Because much of baseline initialization occurred after its 15-second cutoff, that diagnostic is incomplete for comparing total startup work; it must not be presented as a TBT improvement. These measurements support transfer/draw-call reductions and faster median mobile readiness, not a guaranteed score, CPU, or field-INP improvement.

## Validation and remaining work

- Production export and TypeScript passed. All 26 unit tests passed, including decoded pixel equality for every project screenshot.
- 14 of 15 browser tests passed, including all six cat-interaction cases, mobile sign readers, the reversible finale, WebGL failure/context loss, reduced motion, no JavaScript, and the mini-game.
- The existing gallery test fails at `tests/browser/portfolio.spec.ts:71` because the DreamService wall poster is occluded at progress 0.18. An isolated production build of original commit `861ddbc` reproduces the exact failure. Its later width expectation also describes the former larger hanging signs. This test was not weakened or disabled; reconciling it with the existing wall-poster layout remains separate work.
- Desktop before/after screenshots were visually inspected. The compressed screenshots are verified pixel-identical; responsive logo/icon derivatives preserve their source composition. No feature was removed or intentionally disabled. The optional external model remains supported but cannot be visually verified without a supplied model.
- Mobile main-thread/GPU work remains high. Further scene batching or shadow optimizations need careful visual comparisons. Continuous rendering is retained because the cat and world have visible idle animations. Off-screen image scheduling should be evaluated against fast scrolling before deferring it further.
- Actual CDN compression and cache headers must be checked on the deployed host. Use Brotli/gzip for text assets, long immutable caching for hashed `/_next/static/` assets, and revalidation for HTML; no hosting-specific configuration was guessed in this static-export repository.
- Re-run PageSpeed Insights on the deployed URL to assess Lighthouse TBT, Speed Index, and scores. Field INP requires real-user data. The local measurements cannot establish a new score or guarantee 100.

To reproduce: run `npm run build`, start `npm start`, then run `node scripts/profile-performance.mjs comparison 3`. Rebuild assets with `node scripts/optimize-images.mjs` only when their source images change.
