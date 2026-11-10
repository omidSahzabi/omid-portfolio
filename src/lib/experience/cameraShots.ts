import { CatmullRomCurve3, MathUtils, Vector3 } from "three";
import { clampProgress } from "./narrativeTimeline";

type Shot = { at: number; style: string; position: [number, number, number]; target: [number, number, number]; fov: number };

export const cameraShots: Shot[] = [
  { at: 0, style: "medium-wide", position: [-13, 9.5, 17], target: [3.6, 1, -1.6], fov: 40 },
  { at: 0.08, style: "close-up", position: [-8, 5.2, 8.8], target: [2.8, 0.8, -0.5], fov: 43 },
  { at: 0.16, style: "character-follow", position: [-6.5, 5.5, 3], target: [3.6, 1, -8], fov: 49 },
  { at: 0.25, style: "wide-establishing", position: [-12, 9, -0.8], target: [3, 0.8, -11], fov: 48 },
  { at: 0.34, style: "side-tracking", position: [-12, 5.8, -11], target: [2.5, 1, -15], fov: 48 },
  { at: 0.44, style: "over-the-shoulder", position: [-4.8, 4.8, -12.3], target: [3.4, 1.2, -22], fov: 53 },
  { at: 0.53, style: "controlled-orbit", position: [-10.5, 7.4, -18], target: [3.1, 0.8, -25], fov: 49 },
  { at: 0.62, style: "medium-tracking", position: [-8.5, 5.5, -23], target: [3.4, 1.2, -30], fov: 49 },
  { at: 0.73, style: "symmetrical-wide", position: [-3, 8.8, -28], target: [4, 1, -35], fov: 52 },
  { at: 0.83, style: "push-in", position: [-4, 4.2, -30.5], target: [3.2, 1.5, -38], fov: 49 },
  { at: 0.91, style: "portal-reveal", position: [-7.5, 5.5, -34.5], target: [3.2, 1.6, -42], fov: 46 },
  { at: 1, style: "three-quarter", position: [-6.5, 3.8, -38.4], target: [3.1, 1.8, -44.7], fov: 44 },
];

// Continuous splines for both dolly and gaze: no lookAt jumps at shot boundaries.
const positionCurve = new CatmullRomCurve3(cameraShots.map(s => new Vector3(...s.position)), false, "centripetal");
const targetCurve = new CatmullRomCurve3(cameraShots.map(s => new Vector3(...s.target)), false, "centripetal");

// Composition trims for the new foreground character. Original shot paths, gaze
// keyframes, lenses, and timing stay intact; only the framing is shifted slightly.
const mascotFraming = [
  [0.7, -0.65], [0.8, -0.35], [1.4, -0.35], [0.9, -0.2],
  [1.8, -1], [3.5, -1.2], [5.5, -1.9], [3.8, -2.2],
  [1.5, -3], [0.7, -1.2], [0.8, -0.6], [0.5, -0.3],
];

export function sampleCamera(progress: number, mobile: boolean, position: Vector3, target: Vector3) {
  const p = clampProgress(progress);
  let index = cameraShots.findIndex((shot, i) => i < cameraShots.length - 1 && p >= shot.at && p <= cameraShots[i + 1].at);
  if (index < 0) index = cameraShots.length - 2;
  const a = cameraShots[index];
  const b = cameraShots[index + 1];
  const t = MathUtils.clamp((p - a.at) / (b.at - a.at), 0, 1);
  const curveT = (index + t) / (cameraShots.length - 1);
  positionCurve.getPoint(curveT, position);
  targetCurve.getPoint(curveT, target);
  const framingT = t * t * (3 - 2 * t);
  target.x += MathUtils.lerp(mascotFraming[index][0], mascotFraming[index + 1][0], framingT);
  target.y += MathUtils.lerp(mascotFraming[index][1], mascotFraming[index + 1][1], framingT);
  if (mobile) {
    // Recenter the world above the mobile copy and widen the lens.
    target.x -= 3.7;
    // Keep the foreground mascot above the mobile HTML copy; shots and dolly stay intact.
    target.y -= 3.2;
    position.y += 3;
  }
  return MathUtils.lerp(a.fov, b.fov, t * t * (3 - 2 * t)) + (mobile ? 8 : 0);
}
