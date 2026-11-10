import { MathUtils, Vector3 } from "three";
import { characterPoint, worldPath } from "./worldPath";
import { clampProgress, smoothRange, type NarrativeState } from "./narrativeTimeline";
import { advanceHeroInteraction, createHeroInteraction, sampleHeroJump, type HeroPointerSample } from "./heroInteraction";

export const CAT_SCALE = 0.9;
export const CAT_HEIGHT = 1.86;
export const YARN_RADIUS = 0.225;
export const COMPANION_DISTANCE = 0.88;

export function createCharacterMotion() {
  return {
    position: new Vector3(), yarn: new Vector3(), tangent: new Vector3(),
    yaw: -0.62, gait: 0, stride: 0, run: 0, turn: 0,
    breath: 1, blink: 1, headYaw: 0, headPitch: 0,
    earLeft: 0, earRight: 0, tail: 0, play: 1, tap: 0,
    hero: createHeroInteraction(), eyeX: 0, eyeY: 0, eyeYaw: 0, eyePitch: 0,
    rightArmX: 0, rightArmY: 0, rightArmZ: 0.12, leftArmX: 0, leftArmZ: -0.12,
    wristX: 0, wristZ: 0, bodyLean: 0, jumpOffset: 0, jumpSquash: 1, jumpTuck: 0, yarnNudge: 0,
    portalScale: 1, initialized: false,
  };
}

export type CharacterMotion = ReturnType<typeof createCharacterMotion>;

export function angleDelta(from: number, to: number) {
  return Math.atan2(Math.sin(to - from), Math.cos(to - from));
}

// Shared articulated animation controller. Mutable poses, no React state per frame.
// Both the procedural mascot and optional GLB use this pose; the yarn uses its heading.
export function advanceCharacterMotion(motion: CharacterMotion, state: NarrativeState, delta: number, pointer?: HeroPointerSample) {
  const dt = Math.min(Math.max(delta, 0), 0.05);
  const hero = 1 - smoothRange(0.003, 0.035, state.progress);
  characterPoint(state.progress, motion.position);
  worldPath.getTangentAt(clampProgress(state.progress), motion.tangent).multiplyScalar(state.direction);
  const travelYaw = Math.atan2(motion.tangent.x, motion.tangent.z);
  const goalYaw = travelYaw + angleDelta(travelYaw, -0.62) * hero;
  if (!motion.initialized) { motion.yaw = goalYaw; motion.initialized = true; }
  advanceHeroInteraction(motion.hero, state, delta, pointer);
  if (!state.paused) {
    motion.yaw += angleDelta(motion.yaw, goalYaw) * (1 - Math.exp(-12 * dt));
    motion.turn = Math.abs(angleDelta(motion.yaw, goalYaw));
    const movement = state.moving ? MathUtils.clamp(state.speed * 22, 0.35, 1) : 0;
    motion.stride = MathUtils.damp(motion.stride, movement * (motion.turn > 1.1 ? 0.3 : 1), 12, dt);
    motion.run = MathUtils.damp(motion.run, state.speed > 0.22 ? 1 : 0, 8, dt);
    // Always advances in positive time, including reverse travel and rapid seeks.
    motion.gait += dt * (7 + motion.run * 7) * motion.stride;
    motion.play = hero * (1 - motion.stride) * motion.hero.playBlend;
    // A slowly varying beat avoids an identical mechanical tap every cycle.
    const tapBeat = state.clock * 2.15 + Math.sin(state.clock * 0.43) * 0.22;
    motion.tap = Math.pow(Math.max(0, Math.sin(tapBeat)), 8) * motion.play;
    motion.yarnNudge = MathUtils.damp(motion.yarnNudge, motion.tap * 0.12, 10, dt);
    motion.breath = 1 + Math.sin(state.clock * 2.4) * 0.018;
    const blinkTime = state.clock % 4.7;
    motion.blink = 1 - 0.96 * Math.exp(-Math.pow((blinkTime - 3.9) / 0.075, 2));
    const jumping = motion.hero.mode === "jumping";
    const track = jumping ? 0 : motion.hero.trackingBlend;
    const rawYaw = pointer ? Math.atan2(pointer.target.x, Math.max(0.5, pointer.target.z)) : 0;
    const rawPitch = pointer ? -Math.atan2(pointer.target.y - 1.24, Math.max(0.5, Math.hypot(pointer.target.x, pointer.target.z))) : 0;
    const headYaw = MathUtils.clamp(rawYaw, -0.34, 0.34);
    const headPitch = MathUtils.clamp(rawPitch, -0.24, 0.25);
    motion.headYaw = MathUtils.damp(motion.headYaw, headYaw * track + Math.sin(state.clock * 0.7) * 0.025 * (1 - track), 8, dt);
    motion.headPitch = MathUtils.damp(motion.headPitch, MathUtils.lerp(-0.08 + motion.play * 0.25 + motion.tap * 0.05, headPitch, track), 8, dt);
    const eyeYaw = MathUtils.clamp(rawYaw - motion.headYaw, -0.3, 0.3) * track;
    const eyePitch = MathUtils.clamp(rawPitch - motion.headPitch, -0.25, 0.25) * track;
    motion.eyeX = MathUtils.damp(motion.eyeX, Math.sin(eyeYaw) * 0.13, 18, dt);
    motion.eyeY = MathUtils.damp(motion.eyeY, -Math.sin(eyePitch) * 0.12 - motion.play * 0.012, 18, dt);
    motion.eyeYaw = eyeYaw; motion.eyePitch = eyePitch;
    const jump = sampleHeroJump(motion.hero.jumpElapsed);
    motion.jumpOffset = jumping ? jump.height : MathUtils.damp(motion.jumpOffset, 0, 20, dt);
    motion.jumpSquash = jumping ? jump.squash : MathUtils.damp(motion.jumpSquash, 1, 18, dt);
    motion.jumpTuck = jumping ? jump.tuck : 0;
    if (motion.jumpOffset < 0.0001) motion.jumpOffset = 0;
    const sway = Math.sin(motion.gait) * motion.stride;
    const reachX = MathUtils.clamp(-1.35 + headPitch * 2, -2, -0.85);
    const reachZ = MathUtils.clamp(0.12 + rawYaw * 0.45, -0.5, 0.55);
    motion.rightArmX = MathUtils.damp(motion.rightArmX, jumping ? -jump.tuck * 0.95 : MathUtils.lerp(-sway * 0.65 - motion.play * (0.4 + motion.tap * 0.3), reachX, track), 12, dt);
    motion.rightArmY = MathUtils.damp(motion.rightArmY, MathUtils.clamp(rawYaw * 0.4, -0.4, 0.4) * track, 12, dt);
    motion.rightArmZ = MathUtils.damp(motion.rightArmZ, jumping ? 0.12 + jump.tuck * 0.3 : MathUtils.lerp(0.12 - motion.tap * 0.12, reachZ, track), 12, dt);
    motion.leftArmX = MathUtils.damp(motion.leftArmX, jumping ? -jump.tuck * 0.75 : sway * 0.65, 12, dt);
    motion.leftArmZ = -0.12 - jump.tuck * 0.3;
    motion.wristX = MathUtils.damp(motion.wristX, track * (-0.2 - Math.sin(state.clock * 2.7) * 0.06) - motion.tap * 0.16, 12, dt);
    motion.wristZ = MathUtils.damp(motion.wristZ, MathUtils.clamp(rawYaw * 0.18, -0.15, 0.15) * track, 12, dt);
    motion.bodyLean = motion.stride * 0.07 + motion.play * 0.09 + motion.tap * 0.025 - jump.tuck * 0.035;
    motion.earLeft = Math.sin(state.clock * 1.8) * 0.035 + Math.pow(Math.max(0, Math.sin(state.clock * 0.91)), 18) * 0.13;
    motion.earRight = -Math.sin(state.clock * 1.6 + 1) * 0.04 - motion.tap * 0.08;
    motion.tail = Math.sin(state.clock * 2 + motion.stride) * (0.12 + motion.stride * 0.1);
  }
  const lead = COMPANION_DISTANCE - motion.play * 0.12 + motion.yarnNudge;
  // Following the smoothed heading sweeps the yarn around the cat during a turn,
  // rather than teleporting it through the body when direction changes.
  motion.yarn.set(motion.position.x + Math.sin(motion.yaw) * lead, YARN_RADIUS + 0.02 + motion.tap * 0.012, motion.position.z + Math.cos(motion.yaw) * lead);
  motion.portalScale = 1 - smoothRange(0.986, 1, state.progress);
}
