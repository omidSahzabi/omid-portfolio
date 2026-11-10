import { useEffect, useRef } from "react";
import { useThree } from "@react-three/fiber";
import { type Mesh, type Object3D, Plane, Raycaster, Vector2, Vector3 } from "three";
import { CAT_SCALE, type CharacterMotion } from "@/lib/experience/characterMotion";
import { createHeroPointerSample, heroIsInteractive } from "@/lib/experience/heroInteraction";
import type { NarrativeState } from "@/lib/experience/narrativeTimeline";

export function useHeroPointer() {
  const { scene, camera, gl } = useThree();
  const input = useRef({
    sample: createHeroPointerSample(), x: 0, y: 0,
    ray: new Raycaster(), ndc: new Vector2(), plane: new Plane(),
    normal: new Vector3(), anchor: new Vector3(), world: new Vector3(),
    axis: new Vector3(0, 1, 0), hitList: [] as ReturnType<Raycaster["intersectObject"]>,
  });

  useEffect(() => {
    const state = input.current;
    const fine = window.matchMedia("(any-hover: hover) and (any-pointer: fine)");
    const capability = () => { state.sample.finePointer = fine.matches; };
    capability();
    const move = (event: PointerEvent) => {
      if (event.pointerType === "touch") { state.sample.present = false; return; }
      if (event.pointerType !== "mouse" && event.pointerType !== "pen") return;
      // Browser-generated stationary pointer events must not reset the idle timer.
      if (!state.sample.present || Math.hypot(event.clientX - state.x, event.clientY - state.y) >= 0.5) {
        state.x = event.clientX;
        state.y = event.clientY;
        state.sample.sequence++;
      }
      state.sample.present = true;
      state.sample.finePointer = true;
    };
    const leave = (event: PointerEvent) => { if (!event.relatedTarget) state.sample.present = false; };
    const blur = () => { state.sample.present = false; };
    const visibility = () => { state.sample.suspended = document.hidden; if (document.hidden) blur(); };
    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerout", leave, { passive: true });
    window.addEventListener("blur", blur);
    document.addEventListener("visibilitychange", visibility);
    fine.addEventListener("change", capability);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerout", leave);
      window.removeEventListener("blur", blur);
      document.removeEventListener("visibilitychange", visibility);
      fine.removeEventListener("change", capability);
    };
  }, []);

  function sample(state: NarrativeState, motion: CharacterMotion) {
    const runtime = input.current;
    const pointer = runtime.sample;
    pointer.hovered = false;
    if (!heroIsInteractive(state, pointer.suspended) || !pointer.present || !pointer.finePointer) return pointer;
    const rect = gl.domElement.getBoundingClientRect();
    runtime.ndc.set((runtime.x - rect.left) / rect.width * 2 - 1, -(runtime.y - rect.top) / rect.height * 2 + 1);
    camera.updateMatrixWorld();
    runtime.ray.setFromCamera(runtime.ndc, camera);
    // Intersect a cat-facing plane in front of its head, then convert the result
    // to the cat's local frame. The animation controller constrains joint angles.
    runtime.normal.set(Math.sin(motion.yaw), 0, Math.cos(motion.yaw));
    runtime.anchor.copy(motion.position).addScaledVector(runtime.normal, 2.4 * CAT_SCALE);
    runtime.anchor.y += 1.24 * CAT_SCALE;
    runtime.plane.setFromNormalAndCoplanarPoint(runtime.normal, runtime.anchor);
    if (runtime.ray.ray.intersectPlane(runtime.plane, runtime.world)) {
      pointer.target.copy(runtime.world).sub(motion.position).applyAxisAngle(runtime.axis, -motion.yaw).divideScalar(CAT_SCALE);
    }
    const cat = scene.getObjectByName("original-cat");
    // HTML controls/overlays can cover geometry. Only the rendered canvas may hover.
    if (!cat?.visible || document.elementFromPoint(runtime.x, runtime.y) !== gl.domElement) return pointer;
    cat.updateWorldMatrix(true, true);
    runtime.hitList.length = 0;
    runtime.ray.intersectObject(cat, true, runtime.hitList);
    const catHit = runtime.hitList.find(hit => visibleCatMesh(hit.object));
    if (!catHit) return pointer;
    runtime.hitList.length = 0;
    // A yarn strand or any nearer world geometry must win over a hidden cat mesh.
    scene.updateMatrixWorld(true);
    runtime.ray.intersectObjects(scene.children, true, runtime.hitList);
    const first = runtime.hitList.find(hit => visibleCatMesh(hit.object));
    if (first) for (let object: Object3D | null = first.object; object; object = object.parent) if (object === cat) pointer.hovered = true;
    return pointer;
  }
  return sample;
}

function visibleCatMesh(object: Object3D) {
  if (!(object as Mesh).isMesh || object.userData.ignoreHeroHover) return false;
  for (let parent: Object3D | null = object; parent; parent = parent.parent) if (!parent.visible) return false;
  return true;
}
