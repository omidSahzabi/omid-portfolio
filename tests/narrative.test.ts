import { strict as assert } from "node:assert";
import { test } from "node:test";
import { Vector3 } from "three";
import { advanceNarrative, chapterAt, clampProgress, createNarrativeState, smoothRange } from "../src/lib/experience/narrativeTimeline";
import { cameraShots, sampleCamera } from "../src/lib/experience/cameraShots";
import { characterPoint, worldPath } from "../src/lib/experience/worldPath";
import { resolveAnimation } from "../src/lib/experience/animationStates";

test("arbitrary seeks settle to the requested location and reverse locomotion advances in time", () => {
  const state = createNarrativeState();
  for (const destination of [0.98, 0.12, 0.55, 0.54, 0, 1]) {
    const previous = state.progress;
    const previousClock = state.clock;
    state.target = destination;
    for (let frame = 0; frame < 180; frame++) advanceNarrative(state, 1 / 60);
    assert.ok(Math.abs(state.progress - destination) < 0.0001);
    assert.equal(state.direction, destination >= previous ? 1 : -1);
    assert.ok(state.clock > previousClock);
    assert.equal(state.moving, false);
  }
});

test("rapid direction changes never overshoot and stopping preserves a stable frame", () => {
  const state = createNarrativeState();
  state.progress = 0.5;
  for (let i = 0; i < 120; i++) {
    state.target = i % 2 ? 0.2 : 0.8;
    advanceNarrative(state, 1 / 60);
    assert.ok(state.progress >= 0.2 && state.progress <= 0.8);
    assert.ok(Number.isFinite(state.speed));
  }
  state.paused = true;
  const progress = state.progress;
  advanceNarrative(state, 0.5);
  assert.equal(state.progress, progress);
  assert.equal(state.speed, 0);
});

test("all camera shot boundaries are spatially continuous on desktop and mobile", () => {
  for (const mobile of [false, true]) for (const shot of cameraShots.slice(1, -1)) {
    const a = new Vector3(); const b = new Vector3();
    const gazeA = new Vector3(); const gazeB = new Vector3();
    const lensA = sampleCamera(shot.at - 0.00001, mobile, a, gazeA);
    const lensB = sampleCamera(shot.at + 0.00001, mobile, b, gazeB);
    assert.ok(a.distanceTo(b) < 0.01, `${shot.style}: dolly discontinuity`);
    assert.ok(gazeA.distanceTo(gazeB) < 0.01, `${shot.style}: gaze discontinuity`);
    assert.ok(Math.abs(lensA - lensB) < 0.01);
  }
});

test("character follows the original grounded continuous route through every room", () => {
  let previous = characterPoint(0);
  for (let i = 0; i <= 1000; i++) {
    const p = i / 1000;
    const point = characterPoint(p);
    assert.equal(point.y, 0);
    assert.ok(point.distanceTo(previous) < 0.1);
    assert.ok(worldPath.getTangentAt(p).z < 0);
    previous = point;
  }
  assert.ok(characterPoint(1).z < -44);
  assert.deepEqual(characterPoint(0.51), characterPoint(0.51));
});

test("narrative boundaries, reduced motion, and invalid progress are safe", () => {
  assert.equal(clampProgress(NaN), 0);
  assert.equal(clampProgress(Infinity), 0);
  assert.equal(clampProgress(-10), 0);
  assert.equal(clampProgress(10), 1);
  assert.deepEqual([0, 0.26, 0.51, 0.74, 1].map(chapterAt), [0, 1, 2, 3, 4]);
  assert.equal(smoothRange(0.4, 0.5, 0), 0);
  assert.equal(smoothRange(0.4, 0.5, 1), 1);
  const state = createNarrativeState(); state.reducedMotion = true; state.target = 0.75;
  advanceNarrative(state, 1 / 60);
  assert.equal(state.progress, 0.75);
});

test("animation intent handles reverse turning, running, stopping and portal entry", () => {
  const state = createNarrativeState();
  assert.equal(resolveAnimation(state, false, false, false), "play");
  assert.equal(resolveAnimation(state, false, false, true), "look");
  state.progress = 0.5; state.moving = true; state.direction = -1; state.speed = 0.1;
  assert.equal(resolveAnimation(state, true, true, false), "turn");
  assert.equal(resolveAnimation(state, false, true, false), "follow");
  state.speed = 0.3;
  assert.equal(resolveAnimation(state, false, true, false), "run");
  state.moving = false;
  assert.equal(resolveAnimation(state, false, true, false), "stop");
  state.progress = 0.99; state.direction = 1; state.moving = true;
  assert.equal(resolveAnimation(state, false, false, false), "enter");
});
