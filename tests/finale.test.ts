import { strict as assert } from "node:assert";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import { Vector3 } from "three";
import { FINALE_EXTENSION, TIMELINE_END, finaleState, originalScrollDistance } from "../src/lib/experience/finaleTimeline";
import { sampleExtendedCamera } from "../src/lib/experience/finaleCamera";
import { sampleCamera } from "../src/lib/experience/cameraShots";
import { advanceCharacterMotion, createCharacterMotion } from "../src/lib/experience/characterMotion";
import { advanceNarrative, createNarrativeState } from "../src/lib/experience/narrativeTimeline";
import { projectWork } from "../src/lib/portfolio";

test("the finale appends physical scroll distance without compressing the original story", () => {
  for (const height of [390, 740, 844, 1000, 1200]) {
    const original = Math.max(7.8 * height, 4000);
    const extended = Math.max(9.976 * height, 5280 - 0.32 * height);
    assert.ok(Math.abs(originalScrollDistance(height) - (original - height)) < 0.0001);
    assert.ok(Math.abs((extended - height) / TIMELINE_END - (original - height)) < 0.0001);
    assert.ok(Math.abs(extended - original - originalScrollDistance(height) * FINALE_EXTENSION) < 0.0001);
  }
});

test("every camera sample before and including disappearance is exactly preserved", () => {
  for (const mobile of [false, true]) for (let i = 0; i <= 200; i++) {
    const p = i / 200; const a = new Vector3(), b = new Vector3(), gazeA = new Vector3(), gazeB = new Vector3();
    const originalFov = sampleCamera(p, mobile, a, gazeA);
    const extendedFov = sampleExtendedCamera(p, mobile, b, gazeB);
    assert.deepEqual(a.toArray(), b.toArray());
    assert.deepEqual(gazeA.toArray(), gazeB.toArray());
    assert.equal(originalFov, extendedFov);
  }
});

test("the extended camera starts continuously and ends centered and frontal", () => {
  for (const mobile of [false, true]) {
    const a = new Vector3(), b = new Vector3(), gazeA = new Vector3(), gazeB = new Vector3();
    sampleExtendedCamera(1 - 0.00001, mobile, a, gazeA);
    sampleExtendedCamera(1 + 0.00001, mobile, b, gazeB);
    assert.ok(a.distanceTo(b) < 0.01); assert.ok(gazeA.distanceTo(gazeB) < 0.01);
    sampleExtendedCamera(TIMELINE_END, mobile, a, gazeA);
    assert.equal(a.x, 0); assert.equal(gazeA.x, 0);
    assert.ok(Math.abs(a.y - gazeA.y) < 1e-10); assert.equal(gazeA.z, -44);
    assert.ok(gazeA.z < a.z);
  }
});

test("no extra movement, atmosphere, or CTA occurs while resting at the old endpoint", () => {
  const state = createNarrativeState(); state.target = 1;
  for (let i = 0; i < 240; i++) advanceNarrative(state, 1 / 60);
  const before = new Vector3(), gaze = new Vector3(); sampleExtendedCamera(state.progress, false, before, gaze);
  for (let i = 0; i < 240; i++) advanceNarrative(state, 1 / 60);
  const after = new Vector3(); sampleExtendedCamera(state.progress, false, after, gaze);
  assert.deepEqual(before.toArray(), after.toArray());
  assert.deepEqual(finaleState(state.progress), { progress: 0, camera: 0, atmosphere: 0, cta: 0 });
});

test("cat disappearance is unchanged, remains complete throughout the finale, and reverses safely", () => {
  const state = createNarrativeState(), motion = createCharacterMotion();
  for (const p of [0.986, 0.995, 1, 1.12, TIMELINE_END, 1.12, 1, 0.995]) {
    state.progress = p; state.target = p; advanceCharacterMotion(motion, state, 1 / 60);
    assert.ok(Number.isFinite(motion.yaw));
    if (p >= 1) assert.equal(motion.portalScale, 0);
    else assert.ok(motion.portalScale > 0);
    assert.equal(motion.position.y, 0);
    if (p <= 1) assert.equal(finaleState(p).cta, 0);
  }
  assert.equal(finaleState(1.2).cta, 0);
  assert.equal(finaleState(TIMELINE_END).cta, 1);
});

test("all finale states are deterministic on forward and reverse scrubs", () => {
  const forward = [1, 1.08, 1.16, 1.24, TIMELINE_END].map(p => ({ p, state: finaleState(p) }));
  for (const value of [...forward].reverse()) assert.deepEqual(finaleState(value.p), value.state);
  assert.ok(finaleState(1.16).atmosphere > 0 && finaleState(1.16).atmosphere < 1);
});

test("project previews are the existing local PNGs at their original aspect ratios", () => {
  for (const project of projectWork) {
    assert.ok(project.image.src.startsWith("/images/"));
    const bytes = readFileSync(`public${project.image.src}`);
    assert.equal(bytes.readUInt32BE(16), project.image.width);
    assert.equal(bytes.readUInt32BE(20), project.image.height);
  }
  assert.equal(projectWork[2].title, "Daniyal Portfolio");
  assert.equal(projectWork[2].image.src, "/images/httpshosseinseyedzade.dreamservice.net.png");
  assert.equal(projectWork[3].url, null);
  assert.equal(projectWork[3].status, "Coming Soon");
});
