import { MathUtils, Vector3 } from "three";
import type { NarrativeState } from "./narrativeTimeline";

export const HERO_INACTIVITY_SECONDS = 3;
export const HERO_JUMP_SECONDS = 0.76;
export const HERO_JUMP_COOLDOWN = 1.15;

export type HeroBehavior = "idle" | "tracking" | "yarn" | "jumping";

export function createHeroPointerSample() {
  return { sequence: 0, present: false, finePointer: true, hovered: false, suspended: false, target: new Vector3(0, 1.24, 2.4) };
}
export type HeroPointerSample = ReturnType<typeof createHeroPointerSample>;

export function createHeroInteraction() {
  return {
    mode: "idle" as HeroBehavior, enabled: false, time: 0, inactiveFor: 0,
    seenSequence: 0, inside: false, armed: false, cooldownUntil: 0,
    jumpStarted: -Infinity, jumpCount: 0, jumpElapsed: -1,
    trackingBlend: 0, playBlend: 0,
  };
}
export type HeroInteraction = ReturnType<typeof createHeroInteraction>;

export function heroIsInteractive(state: NarrativeState, suspended = false) {
  return state.progress < 0.003 && state.target < 0.0002 && !state.moving && !state.paused && !state.reducedMotion && !suspended;
}

export function advanceHeroInteraction(interaction: HeroInteraction, state: NarrativeState, delta: number, pointer?: HeroPointerSample) {
  const dt = Math.min(Math.max(delta, 0), 0.1);
  interaction.time += dt;
  const enabled = heroIsInteractive(state, pointer?.suspended);
  const sequence = pointer?.sequence ?? 0;
  const present = !!pointer?.present && !!pointer?.finePointer;
  const hovered = present && !!pointer?.hovered;
  if (!enabled) {
    interaction.enabled = false;
    interaction.mode = "idle";
    interaction.jumpElapsed = -1;
    interaction.inactiveFor = 0;
    interaction.inside = false;
    interaction.armed = false;
    interaction.seenSequence = sequence;
  } else {
    if (!interaction.enabled) {
      // A restored Hero never interprets a stationary cursor as a new entry.
      interaction.enabled = true;
      interaction.inactiveFor = 0;
      interaction.seenSequence = sequence;
      interaction.inside = hovered;
      interaction.armed = !hovered;
      interaction.jumpStarted = -Infinity;
      interaction.cooldownUntil = interaction.time;
    }
    const moved = present && sequence !== interaction.seenSequence;
    interaction.seenSequence = sequence;
    interaction.inactiveFor = moved ? 0 : interaction.inactiveFor + dt;
    let jumping = interaction.time - interaction.jumpStarted < HERO_JUMP_SECONDS;
    if (!jumping && moved) {
      if (!hovered) {
        interaction.inside = false;
        interaction.armed = true;
      } else {
        const entered = !interaction.inside;
        if (entered && interaction.armed && interaction.time >= interaction.cooldownUntil) {
          interaction.jumpStarted = interaction.time;
          interaction.cooldownUntil = interaction.time + HERO_JUMP_COOLDOWN;
          interaction.jumpCount++;
          interaction.armed = false;
          jumping = true;
        }
        // Entries during the cooldown are consumed, never queued for later.
        interaction.inside = true;
      }
    }
    interaction.jumpElapsed = jumping ? interaction.time - interaction.jumpStarted : -1;
    if (jumping) interaction.mode = "jumping";
    else if (pointer && !pointer.finePointer) interaction.mode = "yarn";
    else if (interaction.inactiveFor >= HERO_INACTIVITY_SECONDS) interaction.mode = "yarn";
    else interaction.mode = present ? "tracking" : "idle";
  }
  interaction.trackingBlend = MathUtils.damp(interaction.trackingBlend, interaction.mode === "tracking" ? 1 : 0, 12, dt);
  interaction.playBlend = MathUtils.damp(interaction.playBlend, interaction.mode === "yarn" ? 1 : 0, 12, dt);
}

export function sampleHeroJump(elapsed: number) {
  if (elapsed < 0 || elapsed >= HERO_JUMP_SECONDS) return { height: 0, squash: 1, tuck: 0 };
  if (elapsed < 0.12) {
    const t = MathUtils.smoothstep(elapsed, 0, 0.12);
    return { height: 0, squash: 1 - t * 0.13, tuck: 0 };
  }
  if (elapsed < 0.56) {
    const u = (elapsed - 0.12) / 0.44;
    const arc = 4 * u * (1 - u);
    return { height: arc * 0.46, squash: 1 + Math.sin(Math.PI * u) * 0.055, tuck: arc };
  }
  if (elapsed < 0.65) {
    const t = (elapsed - 0.56) / 0.09;
    return { height: 0, squash: 1 - Math.sin(Math.PI * t) * 0.11, tuck: 0 };
  }
  return { height: 0, squash: 1 + Math.sin((elapsed - 0.65) / 0.11 * Math.PI) * 0.025, tuck: 0 };
}
