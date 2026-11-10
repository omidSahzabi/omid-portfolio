import { CubicBezierCurve3, MathUtils, Vector3 } from "three";
import { sampleCamera } from "./cameraShots";
import { finaleProgress } from "./finaleTimeline";
import { smoothRange } from "./narrativeTimeline";

// Keep Three.js camera math inside the lazy scene bundle, separate from the
// scalar timeline used by the header, readable fallback, and HTML overlays.
const dolly = new CubicBezierCurve3(new Vector3(-6.5, 3.8, -38.4), new Vector3(-5.6, 4.5, -35.6), new Vector3(-1.8, 3, -35.4), new Vector3(0, 2.4, -36.6));
const mobileDolly = new CubicBezierCurve3(new Vector3(-6.5, 6.8, -38.4), new Vector3(-5.6, 6, -35.6), new Vector3(-1.8, 3.6, -35.4), new Vector3(0, 2.4, -35.8));
const portalCenter = new Vector3(0, 2.4, -44);

export function sampleExtendedCamera(progress: number, mobile: boolean, position: Vector3, target: Vector3) {
  const fov = sampleCamera(Math.min(progress, 1), mobile, position, target);
  if (progress <= 1) return fov;
  const t = smoothRange(0, 0.88, finaleProgress(progress));
  (mobile ? mobileDolly : dolly).getPoint(t, position);
  target.lerp(portalCenter, t);
  return MathUtils.lerp(fov, mobile ? 52 : 44, t);
}
