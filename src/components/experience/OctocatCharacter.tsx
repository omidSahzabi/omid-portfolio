import { Component, Suspense, useEffect, useMemo, useRef, type ReactNode } from "react";
import { useAnimations, useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { clone } from "three/examples/jsm/utils/SkeletonUtils.js";
import { type AnimationAction, type Group, MathUtils, Quaternion, Vector3 } from "three";
import { portfolio } from "@/lib/portfolio";
import { resolveAnimation, type AnimationState } from "@/lib/experience/animationStates";
import { type NarrativeState } from "@/lib/experience/narrativeTimeline";
import type { CharacterMotion } from "@/lib/experience/characterMotion";
import { OriginalCatCharacter } from "./OriginalCatCharacter";

class AssetBoundary extends Component<{ children: ReactNode; fallback: ReactNode; onFailure: () => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { this.props.onFailure(); }
  render() { return this.state.failed ? this.props.fallback : this.props.children; }
}

function LoadedCharacter({ url, state, motion }: { url: string; state: React.RefObject<NarrativeState>; motion: React.RefObject<CharacterMotion> }) {
  const model = useGLTF(url);
  const scene = useMemo(() => clone(model.scene), [model.scene]);
  const root = useRef<Group>(null);
  const { actions } = useAnimations(model.animations, root);
  const runtimeRef = useRef({ point: new Vector3(), tangent: new Vector3(), orientation: new Quaternion(), axis: new Vector3(0, 1, 0), animation: "" as AnimationState | "", action: null as AnimationAction | null, wasMoving: false, stopUntil: 0 });
  useEffect(() => {
    scene.traverse(object => { object.castShadow = true; object.receiveShadow = true; });
    return () => { Object.values(actions).forEach(action => action?.stop()); };
  }, [scene, actions]);
  useFrame(({ pointer }, delta) => {
    const runtime = runtimeRef.current;
    if (!root.current) return;
    const travel = state.current;
    root.current.position.copy(motion.current.position);
    const yaw = motion.current.yaw + portfolio.character.yawOffset;
    runtime.orientation.setFromAxisAngle(runtime.axis, yaw);
    const turning = root.current.quaternion.angleTo(runtime.orientation) > 0.4;
    root.current.quaternion.slerp(runtime.orientation, 1 - Math.exp(-10 * Math.min(delta, 0.05)));
    root.current.scale.setScalar(portfolio.character.scale * motion.current.portalScale);
    let next = resolveAnimation(travel, turning, runtime.wasMoving, Math.abs(pointer.x) + Math.abs(pointer.y) > 0.25);
    if (runtime.wasMoving && !travel.moving) runtime.stopUntil = travel.clock + 0.25;
    if (!travel.moving && travel.clock < runtime.stopUntil) next = "stop";
    if (next !== runtime.animation) {
      const clips = portfolio.character.clips;
      const fallback = travel.moving ? clips.walk : clips.idle;
      const nextAction = actions[clips[next]] ?? actions[fallback];
      if (nextAction && nextAction !== runtime.action) {
        runtime.action?.fadeOut(0.22);
        nextAction.reset().setEffectiveTimeScale(1).setEffectiveWeight(1).fadeIn(0.22).play();
        runtime.action = nextAction;
      }
      runtime.animation = next;
    }
    // Positive time scale is deliberately independent of travel direction.
    const action = runtime.action;
    if (action) action.setEffectiveTimeScale(MathUtils.clamp(travel.moving ? 0.8 + travel.speed * 2 : 1, 0.8, 1.8));
    runtime.wasMoving = travel.moving;
  });
  return <group ref={root}><primitive object={scene} dispose={null} /></group>;
}

export function OctocatCharacter({ state, motion, onFailure }: { state: React.RefObject<NarrativeState>; motion: React.RefObject<CharacterMotion>; onFailure: () => void }) {
  const { authorized, modelUrl } = portfolio.character;
  const original = <OriginalCatCharacter motion={motion} />;
  if (!authorized || !modelUrl) return original;
  return <AssetBoundary onFailure={onFailure} fallback={original}><Suspense fallback={original}><LoadedCharacter url={modelUrl} state={state} motion={motion} /></Suspense></AssetBoundary>;
}
