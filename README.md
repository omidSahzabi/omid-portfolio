# Omid — Behind the Experience

A static, scroll-directed 3D portfolio built with Next.js App Router, TypeScript, Tailwind CSS, Three.js, React Three Fiber, Drei, and GSAP ScrollTrigger. All public content is English. No application backend, database, authentication, or external runtime services are required.

## Run

Requires Node.js 22+ and npm.

```sh
npm ci
npm run dev
```

Open http://127.0.0.1:3000.

```sh
npm run typecheck
npm run lint
npm test
npm run build
npm start
```

The production build exports `out/`. Deploy that folder to any static host. `npm start` previews the actual export locally. The built-in preview server is a development convenience, not an application backend.

## Original animated cat

The default protagonist is an **original procedural cat mascot**, authored as Three.js geometry in this project. It is not an official GitHub Octocat model. No external model or texture is needed to render the complete character.

`mascotGeometry.ts` sculpts the rounded-square head, beveled pointed ears, almond eyes, tapered body, and curled tail. `OriginalCatCharacter.tsx` arranges these into an articulated hierarchy: torso, head, ears, eyes/pupils, shoulder pivots, paws, feet, and tail. Purple paw pads and the curled appendage give the silhouette a restrained tentacle-inspired detail while keeping the character an original cat.

`characterMotion.ts` is the reusable animation controller. It coordinates idle breathing, blinking, head and ear movement, pointer looking, paw taps, walking/running, turning, tail movement, and stopping. The approximately 1.86-unit cat follows the existing world path. The yarn is 0.45 units in diameter, approximately 24% of the cat's height, and sits 0.88 units ahead during travel. In the hero, it sits closer so a paw tap can nudge it.

On reversal, the cat turns using the shortest heading arc. The yarn follows that smoothed heading around the cat instead of teleporting through its body. Gait time always advances positively and movement blends back to idle. At the final portal, the character scales away only during the last 1.4% of progress; backward scrubbing restores it. World state and portal effects remain scroll-driven, while decorative idle/cooking loops use the pausable narrative clock.

The existing camera shot positions, gaze keyframes, FOVs, and timing are retained. Small interpolated composition offsets keep the foreground character out of the text column and bottom vignette, with an additional mobile framing offset above the HTML copy. The kitchen chefs were repositioned to avoid obscuring it.

### Hero personality and pointer interaction

The built-in cat is interactive only at its introductory position. `useHeroPointer.ts` listens passively at the window level, so the cat can notice mouse movement over both the canvas and Hero HTML. A Three.js ray intersects a cat-facing plane, and the resulting target is converted into character-local space. Head yaw/pitch, pupil offsets/rotation, shoulder reach, and wrist motion have explicit bounds and damped transitions.

`heroInteraction.ts` owns a single priority state machine: **jumping → cursor tracking/reaching → idle yarn play → neutral idle**. A genuine pointer entry onto visible cat geometry triggers a 760ms anticipation, jump, landing, and settle sequence. The hover ray excludes the contact shadow, respects foreground geometry/HTML, and does not treat the yarn as part of the cat. A pointer-entry latch and 1.15-second cooldown prevent repeated or queued jumps under a stationary cursor. Jump transforms live in a child group, leaving the world-path root, floor shadow, and camera untouched.

After three seconds without pointer movement, tracking blends into looking down, leaning, and gently tapping the existing yarn. A damped nudge drives both its position and rolling rotation; no duplicate yarn is created. Mouse activity interrupts play smoothly. Breathing, blinking, and tail motion continue as compatible secondary animations, while one controller supplies the primary joint poses.

Scrolling, opening an overlay, document suspension, or reduced motion disables Hero interactions. Returning to the introduction resets inactivity and does not count a stationary cursor as a fresh hover. Touch devices keep idle yarn play and native page scrolling; tap-to-jump is not enabled. The existing reduced-motion HTML view is preserved. These articulated interactions target the built-in character; a separately configured GLB would require suitable bone/clip bindings for equivalent joint animation.

GitHub’s Octocat is a GitHub trademark. This is an independent portfolio and does not imply affiliation or endorsement. Before integrating a model, obtain both appropriate asset licensing and permission for this use. Consult the [GitHub mascot guidelines](https://brand.github.com/graphic-elements/mascots) and [logo policy](https://docs.github.com/en/site-policy/other-site-policies/github-logo-policy). A downloadable third-party model alone does not establish permission or official status.

### Optional licensed model override

1. Place the licensed `.glb` in `public/models/`. Preserve its license and permission documentation.
2. Edit `src/lib/portfolio.ts`: set `character.modelUrl`, set `authorized: true` only when permission is verified, and adjust `scale` and `yawOffset`.
3. The expected model faces +Z, with feet at Y=0. Normalize the source model to this convention or adjust the integration component.
4. Map actual animation clip names in `character.clips`. Supported intents: idle, playing, pointer looking, walking, running, turning, stopping, following yarn, and entering the portal. Missing clips fall back to idle/walk where available. Meaningful idle and walk clips are required for locomotion.
5. The GLTF loader, skeleton-safe clone, `useAnimations` mixer, positive animation time, crossfades, and shared companion motion are connected in `OctocatCharacter.tsx`. The original cat renders during loading and on failure, so the protagonist never disappears because an external model is unavailable.
6. Test the actual model’s grounding, rig, root motion, clips, reverse turning, and appearance on mobile. No external model is supplied or verified. The default original character can be used without configuring this override.

## Integrated cinematic portfolio

The existing entrance, restaurant, kitchen, storage, portal, original cat, and Hero interaction controller are retained. There is one page and one continuous world. No dependencies were added for this integration.

The header contains only the existing `omid.` brand and one rotating skill. Each skill holds for 2.5 seconds, then fades through a small vertical transition. Reduced motion leaves the first skill static. The former conventional portfolio dialog, sections, menus, and their unused styles/configuration have been removed. Existing frontend/backend/database/product narrative copy remains part of the journey.

The Hero contact board has physical depth, mounting brackets, a nearby wall, dark materials, and restrained violet accents. Its real email and GitHub anchors are world-transformed Drei `Html`, so they follow perspective and support keyboard focus. The restaurant contains four framed signs suspended on cables, distributed along its left edge. Sign hover/focus freezes their slight ambient sway so clicking and reading remain comfortable. Inactive/offscreen sign content is inert. The content layer does not capture wheel scrolling.

A contextual “Read sign” dialog presents the current physical sign at a comfortable size on small screens. It pauses the world, contains keyboard focus, closes with Escape, and restores focus and page scrolling. It does not expose a conventional projects grid or section menu. Coming Soon remains unlinked in both the world and the reader.

### Supplied screenshots

All four existing PNGs remain in `public/images/` without alteration. Browser paths omit `/public`. Images use explicit source dimensions, asynchronous decoding, lazy loading, and `object-fit: contain`; the browser renders them as embedded sign previews rather than GPU textures.

| Project | Existing local file | Source dimensions | Destination |
| --- | --- | --- | --- |
| DreamService | `public/images/dreamservice.net.png` | 1889 x 860 | https://dreamservice.net |
| Hossein Portfolio | `public/images/hosseinseyedzade.dreamservice.net.png` | 1891 x 864 | https://hosseinseyedzade.dreamservice.net/ |
| Daniyal Portfolio | `public/images/httpshosseinseyedzade.dreamservice.net.png` | 1892 x 862 | https://daniyalbadrlou.dreamservice.net/ |
| Mezon Shik Pik | `public/images/mezonshikpik.png` | 280 x 437 | None; Coming Soon |

The third filename is misleading: inspection identifies its visible DANIYAL branding. The Mezon file visibly shows Dookht Academy; the user explicitly confirmed using `mezonshikpik.png` for Mezon Shik Pik. Its original portrait aspect ratio and supplied content are preserved. No replacement imagery or project URLs were invented.

Contact destinations are supplied in `src/lib/portfolio.ts`: `mailto:omidpanahiyan5700@gmail.com` and `https://github.com/omidSahzabi`. GitHub, live project links, and the finale CTA use new tabs with `noopener noreferrer`.

## Extended portal timeline

`ScrollController` retains one ScrollTrigger. Original story coordinates **0 through 1** preserve the existing camera samples, world movement, yarn path, portal approach, and disappearance. The original physical scroll distance is `max(7.8 * viewportHeight, 4000) - viewportHeight`. The new story ends at **1.32**, adding exactly 32% of that original distance after disappearance. The original story occupies 75.76% of the longer scrollbar without being shortened in pixels.

The track height is `max(997.6svh, calc(5280px - 32svh))`. Chapter seeking uses the original distance multiplied by story progress, and the progress bar uses `progress / 1.32`. The additional finale is a continuation of the same timeline, with no automatic camera sequence or redirect.

Let `t = clamp((progress - 1) / 0.32)`:

- **Original endpoint, progress 1:** the cat is fully gone; the existing camera pose holds. New atmosphere and CTA are absent. Waiting does not start the new camera movement.
- **Camera, t 0 to 0.88:** a continuous eased Bezier dolly moves from the existing endpoint into a frontal composition. The existing quaternion orientation system follows a target that converges on the portal center. Original reverse framing is eased out only after the original endpoint. The final camera is centered at X=0, Y=2.4, looking directly down -Z, with separate mobile distance/FOV.
- **Atmosphere, t 0.08 to 0.85:** a lightweight arch-masked navy shader, soft floor illumination, restrained seeded particles, and blue portal lighting appear progressively. The old translucent rectangle fades out and the violet entry rim dims only in this appended range. No postprocessing was introduced.
- **CTA, t 0.72 to 1:** “What's next?”, “Let's turn an idea into something real.”, and “Enter DreamService” fade in near the frontal composition. The link opens https://dreamservice.net only when activated.

Reverse scrolling evaluates the same functions: CTA fades, atmosphere reduces, camera returns, and the cat reappears through its original timeline. Character path/tangent sampling is clamped to the original range so extended progress never requests an invalid path position. Original animation/controller logic is otherwise retained. Scalar finale math is separate from Three.js camera math to keep the 3D code inside the lazy canvas bundle.

## Accessibility and performance

See [PERFORMANCE.md](PERFORMANCE.md) for the measured optimization audit, changed files, reproducible profiling commands, and current validation limitations.

- Essential sign content uses semantic HTML and native anchors with visible focus.
- Inactive narrative chapters and offscreen signs are inert.
- Mobile contextual readers reuse the same sign content and destinations.
- Reduced motion, unavailable WebGL, and context loss present the same sequence of chapters, screenshots, contact details, and final CTA as readable HTML.
- A no-JavaScript version is server-rendered inside `noscript`.
- `/?webgl=off` provides an explicit fallback diagnostic.
- The existing DPR cap, adaptive resolution, instancing, local fonts, and simple lighting remain in place.
- `/?inspect=1` enables the read-only `canvas.portfolioSnapshot()` QA method. It reports character visibility/occluders, interaction state, camera pose, and appended finale phases. It is absent during normal visits.

## Validation

```sh
npm run typecheck
npm run lint
npm test
npm run build
npm run test:browser
```

Playwright uses installed Google Chrome and an isolated production-export server on port 4173, independently of a development server on port 3000. Screenshots and failure traces are written to ignored `test-results/`.

Validation on November 10, 2026: TypeScript, ESLint, production export, all 26 unit tests, and all 14 Chrome browser tests passed. Actual rendered desktop signs, the Hero, the frontal portal, and mobile readers/finale were inspected from browser screenshots.

The 26 unit cases cover original character motion and Hero interaction priority, camera continuity, unchanged original camera samples, physical scroll pacing, reversible disappearance, deterministic finale phases, and actual PNG headers/aspect ratios. The 14 browser cases cover Hero tracking/jumping/cooldown/idle yarn play/touch, the minimal header, contact focus, all four actual screenshot signs, real native project clicks, mobile readers at 320 and 390 pixels, the held original endpoint, frontal/reversible finale, reduced motion, WebGL failure/context loss, and no JavaScript.

Browser link tests intercept destination documents to verify the requested URL, native tab behavior, and safe opener handling without depending on external websites. They do not establish remote availability. The mailto destination is checked, but launching an installed mail application depends on the visitor's device. Mobile validation uses Chrome emulation, not a physical phone or Safari. The supplied Mezon source remains 280 x 437 and carries the branding noted above; no external model or replacement image has been supplied.

### Files in this integration

- Shell/content: `src/components/PortfolioExperience.tsx`, `AnimatedSkills.tsx`, `SignContent.tsx`, `SignReader.tsx`, `AccessibleJourney.tsx`, and `src/app/globals.css`.
- World additions: `src/components/experience/WorldSign.tsx`, `ContactInformationBoard.tsx`, `ProjectSignGallery.tsx`, `PortalFinale.tsx`, and `FinaleCTA.tsx`.
- World integration: `src/components/experience/ExperienceCanvas.tsx`, `World.tsx`, `NarrativeOverlay.tsx`, `SceneInspection.tsx`, `CinematicCameraRig.tsx`, `ScrollController.tsx`, `YarnBall.tsx`, and `scenes/HeroScene.tsx`, `scenes/RestaurantScene.tsx`, `scenes/PortalScene.tsx`.
- Configuration/timeline: `src/lib/portfolio.ts`, `src/lib/experience/finaleTimeline.ts`, `finaleCamera.ts`, `narrativeTimeline.ts`, and the extended-range compatibility fix in `characterMotion.ts`.
- Validation/documentation: `tests/finale.test.ts`, `tests/browser/portfolio.spec.ts`, and `README.md`. The existing six `tests/browser/hero.spec.ts` cases are retained.
- Removed: `src/components/PortfolioContent.tsx` and `src/components/PortfolioDialog.tsx`.

Original screenshot files, camera shot keyframes, character geometry, Hero interaction controller, and the other scene geometry are retained.

## Optional 2D mini-game

The Hero's **Entertain Octocat** button opens a lazy-loaded Canvas 2D runner in a native dialog. It also appears in the readable/reduced-motion introduction. Nothing starts before **Start Game**. The 2D character is a procedural adaptation of this portfolio's original cat, not an official GitHub asset.

- **Space** jumps over ERROR; hold **Tab** or **Arrow Down** to slide beneath DEADLINE. Tab is intercepted only on the focused, running game canvas. Shift+Tab leaves the surface; Escape closes the dialog.
- On-screen **SLIDE** (left) supports press/hold/release, pointer cancellation, and lost capture. **JUMP** (right) responds once per press. No swipe gestures are used.
- Gravity, forgiving collision boxes, capped speed, speed-based spacing, and a maximum two-obstacle streak keep the two obstacle types fair. No double jump is allowed. DEADLINE's visible panel covers the entire jump arc, making sliding its intended solution.
- Distance drives score. Best score uses guarded localStorage access. Collision gives a brief stunned pose, then Game Over, Try Again, and Close. Blur/hidden tabs pause the run and clear input.
- The dialog preserves portfolio scroll/focus, locks background input, and uses the existing narrative pause flag. Closing cancels animation, disconnects the resize observer, removes listeners, and releases input. Reduced motion disables ambient parallax, dust, bounce, glitching, and hit shake; essential gameplay begins only by choice.
- Rendering uses logical coordinates with capped high-DPI resolution. Width changes preserve existing obstacle coordinates and time-to-contact. No game engine or dependency was added.

Implementation lives in `src/components/game/` (entry, modal, game input/lifecycle, scoped CSS) and `src/lib/game/` (physics and drawing). Only `PortfolioExperience.tsx`, `NarrativeOverlay.tsx`, and `AccessibleJourney.tsx` connect it to the existing application. `?inspect=1` adds a read-only `runnerSnapshot()` to the game canvas for focused QA; normal visits do not expose it.

Validation for this feature is limited to targeted TypeScript/ESLint and focused Chrome checks against the existing dev server, including desktop controls, touch input cleanup, collision/restart, best-score persistence, portfolio restoration, responsive modal screenshots, and actual survival using both obstacle types. No full production build or existing test suite was run for this addition. Mobile checks use emulation rather than physical devices or Safari.
