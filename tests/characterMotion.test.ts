import { strict as assert } from "node:assert";
import { test } from "node:test";
import { Vector3 } from "three";
import { advanceCharacterMotion, angleDelta, CAT_HEIGHT, COMPANION_DISTANCE, createCharacterMotion, YARN_RADIUS } from "../src/lib/experience/characterMotion";
import { advanceNarrative, createNarrativeState } from "../src/lib/experience/narrativeTimeline";
import { worldPath } from "../src/lib/experience/worldPath";
import { createHeroPointerSample } from "../src/lib/experience/heroInteraction";

test("yarn stays a small, grounded companion ahead of the cat, in both directions", () => {
  assert.ok(YARN_RADIUS * 2 / CAT_HEIGHT >= 0.2 && YARN_RADIUS * 2 / CAT_HEIGHT <= 0.3);
  for (const direction of [1, -1] as const) for (const p of [0.16, 0.26, 0.51, 0.74, 0.94]) {
    const state = createNarrativeState(); state.progress = p; state.direction = direction;
    const pose = createCharacterMotion();
    advanceCharacterMotion(pose, state, 1 / 60);
    const offset = pose.yarn.clone().sub(pose.position); offset.y = 0;
    const tangent = worldPath.getTangentAt(p).multiplyScalar(direction);
    assert.ok(offset.dot(tangent) > 0.85);
    assert.ok(Math.abs(offset.length() - COMPANION_DISTANCE) < 0.0001);
    assert.ok(pose.yarn.y >= YARN_RADIUS && pose.yarn.y < YARN_RADIUS + 0.06);
    assert.equal(pose.position.y, 0);
  }
});

test("a reversal turns smoothly without snapping the yarn through the cat", () => {
  const state = createNarrativeState(); state.progress = 0.51; state.moving = true; state.speed = 0.15;
  const pose = createCharacterMotion(); advanceCharacterMotion(pose, state, 1 / 60);
  const beforeGait = pose.gait;
  state.direction = -1;
  for (let i = 0; i < 90; i++) {
    const previous = pose.yaw; const previousYarn = pose.yarn.clone();
    advanceCharacterMotion(pose, state, 1 / 60);
    assert.ok(Math.abs(angleDelta(previous, pose.yaw)) < 0.6);
    assert.ok(previousYarn.distanceTo(pose.yarn) < 0.55);
    assert.ok(new Vector3(pose.yarn.x - pose.position.x, 0, pose.yarn.z - pose.position.z).length() > 0.85);
    assert.ok(pose.gait >= beforeGait);
  }
  const goal = worldPath.getTangentAt(0.51).negate();
  assert.ok(Math.abs(angleDelta(pose.yaw, Math.atan2(goal.x, goal.z))) < 0.001);
});

test("hero idle play nudges the existing yarn and pointer tracking stays bounded", () => {
  const state = createNarrativeState(); const pose = createCharacterMotion();
  for (let i = 0; i < 220; i++) { state.clock += 1 / 60; advanceCharacterMotion(pose, state, 1 / 60); }
  assert.equal(pose.hero.mode, "yarn");
  let nudge = 0;
  for (let i = 0; i < 180; i++) { state.clock += 1 / 60; advanceCharacterMotion(pose, state, 1 / 60); nudge = Math.max(nudge, pose.yarnNudge); }
  assert.ok(nudge > 0.04 && nudge < 0.13);
  const pointer = createHeroPointerSample(); pointer.present = true; pointer.sequence = 1; pointer.target.set(6, 5, 2.4);
  for (let i = 0; i < 60; i++) advanceCharacterMotion(pose, state, 1 / 60, pointer);
  assert.ok(pose.headYaw > 0.1 && pose.headYaw <= 0.34);
  assert.ok(pose.eyeX > 0 && pose.eyeX < 0.045);
  state.clock = 3.9; advanceCharacterMotion(pose, state, 0.016);
  assert.ok(pose.blink < 0.05);
  state.clock = 4.1; advanceCharacterMotion(pose, state, 0.016);
  assert.ok(pose.blink > 0.99);
});

test("rapid full-world seeks settle, locomotion stops, and pausing freezes ambient pose", () => {
  const state = createNarrativeState(); const pose = createCharacterMotion();
  for (const destination of [0.9, 0.2, 0.74, 0.51, 0]) {
    state.target = destination;
    for (let i = 0; i < 180; i++) { advanceNarrative(state, 1 / 60); advanceCharacterMotion(pose, state, 1 / 60); }
    assert.ok(pose.stride < 0.001);
    assert.ok(Number.isFinite(pose.yaw));
    assert.ok(Math.abs(state.progress - destination) < 0.0001);
  }
  state.paused = true;
  const previous = { yaw: pose.yaw, gait: pose.gait, tail: pose.tail, blink: pose.blink };
  advanceCharacterMotion(pose, state, 0.05);
  assert.deepEqual({ yaw: pose.yaw, gait: pose.gait, tail: pose.tail, blink: pose.blink }, previous);
});

test("portal entry is reversible and only finishes at the end of the original path", () => {
  const state = createNarrativeState(); const pose = createCharacterMotion();
  for (const p of [0.94, 0.99, 1, 0.99, 0.94]) {
    state.progress = p; advanceCharacterMotion(pose, state, 0.016);
    assert.equal(pose.portalScale, p === 1 ? 0 : p < 0.986 ? 1 : pose.portalScale);
    assert.ok(pose.portalScale >= 0 && pose.portalScale <= 1);
  }
  assert.equal(pose.portalScale, 1);
});
