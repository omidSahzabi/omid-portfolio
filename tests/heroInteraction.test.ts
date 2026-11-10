import { strict as assert } from "node:assert";
import { test } from "node:test";
import { advanceHeroInteraction, createHeroInteraction, createHeroPointerSample, HERO_JUMP_SECONDS, sampleHeroJump } from "../src/lib/experience/heroInteraction";
import { createNarrativeState } from "../src/lib/experience/narrativeTimeline";

function fixture() {
  const interaction = createHeroInteraction(), narrative = createNarrativeState(), pointer = createHeroPointerSample();
  const advance = (seconds = 1 / 60) => advanceHeroInteraction(interaction, narrative, seconds, pointer);
  const frames = (count: number) => { for (let i = 0; i < count; i++) advance(); };
  advance();
  return { interaction, narrative, pointer, advance, frames };
}

test("cursor activity wins over yarn play, which begins after three inactive seconds", () => {
  const f = fixture();
  f.pointer.present = true; f.pointer.sequence++;
  f.advance(); assert.equal(f.interaction.mode, "tracking");
  f.frames(175); assert.equal(f.interaction.mode, "tracking");
  f.frames(10); assert.equal(f.interaction.mode, "yarn");
  f.frames(30); assert.ok(f.interaction.playBlend > 0.99);
  f.pointer.sequence++; f.advance();
  assert.equal(f.interaction.mode, "tracking");
  assert.ok(f.interaction.playBlend > 0, "interruption should blend rather than snap");
  f.frames(40); assert.ok(f.interaction.playBlend < 0.001);
});

test("one jump per real pointer entry; stationary geometry changes cannot rearm it", () => {
  const f = fixture();
  f.pointer.present = true; f.pointer.hovered = true; f.pointer.sequence++; f.advance();
  assert.equal(f.interaction.mode, "jumping"); assert.equal(f.interaction.jumpCount, 1);
  // The mesh moves away from and back under a stationary pointer during its jump.
  f.pointer.hovered = false; f.frames(20);
  f.pointer.hovered = true; f.frames(160);
  assert.equal(f.interaction.jumpCount, 1);
  // Even small movements inside the mesh must not retrigger it.
  f.pointer.sequence++; f.advance(); assert.equal(f.interaction.jumpCount, 1);
  f.pointer.hovered = false; f.pointer.sequence++; f.advance();
  f.pointer.hovered = true; f.pointer.sequence++; f.advance();
  assert.equal(f.interaction.jumpCount, 2);
});

test("cooldown entries are consumed and do not queue surprise jumps", () => {
  const f = fixture(); f.pointer.present = true;
  f.pointer.hovered = true; f.pointer.sequence++; f.advance();
  f.frames(48); assert.notEqual(f.interaction.mode, "jumping");
  f.pointer.hovered = false; f.pointer.sequence++; f.advance();
  f.pointer.hovered = true; f.pointer.sequence++; f.advance();
  assert.equal(f.interaction.jumpCount, 1);
  f.frames(90); assert.equal(f.interaction.jumpCount, 1);
  f.pointer.hovered = false; f.pointer.sequence++; f.advance();
  f.pointer.hovered = true; f.pointer.sequence++; f.advance();
  assert.equal(f.interaction.jumpCount, 2);
});

test("jump takes priority over tracking and inactivity without competing primary states", () => {
  const f = fixture(); f.frames(200); assert.equal(f.interaction.mode, "yarn");
  f.pointer.present = true; f.pointer.hovered = true; f.pointer.sequence++; f.advance();
  f.frames(20);
  assert.equal(f.interaction.mode, "jumping");
  assert.ok(f.interaction.trackingBlend < 0.001);
  assert.ok(f.interaction.playBlend < 0.03);
  f.frames(30); assert.equal(f.interaction.mode, "tracking");
});

test("scrolling, pause, reduced motion and document suspension disable Hero interactions", () => {
  for (const reason of ["target", "progress", "moving", "paused", "reducedMotion", "suspended"]) {
    const f = fixture(); f.pointer.present = true; f.pointer.hovered = true; f.pointer.sequence++; f.advance();
    if (reason === "target") f.narrative.target = 0.01;
    else if (reason === "progress") f.narrative.progress = 0.01;
    else if (reason === "suspended") f.pointer.suspended = true;
    else f.narrative[reason as "moving" | "paused" | "reducedMotion"] = true;
    f.advance(); assert.equal(f.interaction.enabled, false, reason); assert.equal(f.interaction.jumpElapsed, -1);
  }
});

test("returning to the Hero resets inactivity and ignores a stationary pointer over the cat", () => {
  const f = fixture(); f.frames(200);
  f.narrative.progress = 0.3; f.advance();
  f.pointer.present = true; f.pointer.hovered = true; f.pointer.sequence++;
  f.narrative.progress = 0; f.advance(); f.frames(80);
  assert.equal(f.interaction.jumpCount, 0); assert.equal(f.interaction.mode, "tracking");
  assert.ok(f.interaction.inactiveFor < 1.5);
  f.pointer.hovered = false; f.pointer.sequence++; f.advance();
  f.pointer.hovered = true; f.pointer.sequence++; f.advance();
  assert.equal(f.interaction.jumpCount, 1);
});

test("touch devices retain idle yarn play and never need hover", () => {
  const f = fixture(); f.pointer.finePointer = false; f.pointer.hovered = true; f.pointer.sequence++;
  f.frames(80); assert.equal(f.interaction.mode, "yarn"); assert.equal(f.interaction.jumpCount, 0);
});

test("the 760ms jump is grounded at both ends and never dips through the floor", () => {
  let peak = 0;
  for (let t = 0; t <= HERO_JUMP_SECONDS; t += 0.002) {
    const pose = sampleHeroJump(t);
    assert.ok(pose.height >= 0); assert.ok(pose.squash >= 0.87 && pose.squash <= 1.06);
    peak = Math.max(peak, pose.height);
  }
  assert.ok(peak > 0.45 && peak < 0.47);
  assert.deepEqual(sampleHeroJump(-1), { height: 0, squash: 1, tuck: 0 });
  assert.deepEqual(sampleHeroJump(HERO_JUMP_SECONDS), { height: 0, squash: 1, tuck: 0 });
});
