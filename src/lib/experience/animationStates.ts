import type { NarrativeState } from "./narrativeTimeline";

export type AnimationState = "idle" | "play" | "look" | "walk" | "run" | "turn" | "stop" | "follow" | "enter";

export function resolveAnimation(state: NarrativeState, turning: boolean, wasMoving: boolean, pointerActive: boolean): AnimationState {
  if (state.progress > 0.965 && state.direction === 1 && state.moving) return "enter";
  if (turning && state.moving) return "turn";
  if (!state.moving && wasMoving) return "stop";
  if (!state.moving && state.progress < 0.025) return pointerActive ? "look" : "play";
  if (!state.moving) return "idle";
  if (state.speed > 0.22) return "run";
  if (state.progress > 0.1 && state.progress < 0.9) return "follow";
  return "walk";
}
