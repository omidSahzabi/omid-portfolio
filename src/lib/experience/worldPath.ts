import { CatmullRomCurve3, Vector3 } from "three";
import { clampProgress } from "./narrativeTimeline";

// All rooms, characters, yarn, and shots share this world. Forward is -Z.
export const worldPath = new CatmullRomCurve3([
  new Vector3(-2.4, 0, 3.6),
  new Vector3(-1.3, 0, 0.2),
  new Vector3(0, 0, -4),
  new Vector3(-1.1, 0, -9),
  new Vector3(0.9, 0, -14),
  new Vector3(0, 0, -19),
  new Vector3(-1, 0, -24),
  new Vector3(0, 0, -29),
  new Vector3(0.6, 0, -34),
  new Vector3(0, 0, -40),
  new Vector3(0, 0, -44.5),
], false, "centripetal");

export function characterPoint(progress: number, target = new Vector3()) {
  return worldPath.getPointAt(clampProgress(progress), target);
}

