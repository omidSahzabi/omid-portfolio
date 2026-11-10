import { clampProgress, smoothRange } from "./narrativeTimeline";

// Story units 0..1 retain every original world/camera event. Append 32% of its
// ORIGINAL physical scrolling distance, rather than retiming the existing story.
export const FINALE_EXTENSION = 0.32;
export const TIMELINE_END = 1 + FINALE_EXTENSION;

export function originalScrollDistance(viewportHeight: number) {
  return Math.max(viewportHeight * 7.8, 4000) - viewportHeight;
}

export function finaleProgress(progress: number) {
  return clampProgress((progress - 1) / FINALE_EXTENSION);
}

export function finaleState(progress: number) {
  const p = finaleProgress(progress);
  return { progress: p, camera: smoothRange(0, 0.88, p), atmosphere: smoothRange(0.08, 0.85, p), cta: smoothRange(0.72, 1, p) };
}

