import { useEffect } from "react";
import { useThree } from "@react-three/fiber";
import { Box3, Raycaster, Vector2, Vector3 } from "three";
import type { CharacterMotion } from "@/lib/experience/characterMotion";
import type { NarrativeState } from "@/lib/experience/narrativeTimeline";
import { finaleState } from "@/lib/experience/finaleTimeline";

export type SceneSnapshot = {
  progress: number; direction: number; catVisible: boolean; headVisible: boolean; headOccluder: string;
  catPosition: number[]; yarnPosition: number[]; catScreen: number[];
  yaw: number; gait: number; stride: number; blink: number; headYaw: number;
  yarnAhead: number; yarnDistance: number; catHeight: number; yarnDiameter: number;
  drawCalls: number; triangles: number;
  heroMode: string; heroEnabled: boolean; heroIdleFor: number; heroJumps: number; heroJumpElapsed: number;
  heroTrackingWeight: number; heroPlayWeight: number; jumpOffset: number; jumpSquash: number;
  eyeOffsets: number[]; reachingArm: number[]; yarnNudge: number; yarnScreen: number[]; cameraPosition: number[];
  heroHoverArmed: boolean; heroPointerInside: boolean; headPitch: number;
  heroCooldownRemaining: number;
  finaleProgress: number; finaleCamera: number; portalAtmosphere: number; finaleCTA: number;
  portalScreen: number[]; cameraDirection: number[]; catScale: number;
};

declare global { interface HTMLCanvasElement { portfolioSnapshot?: () => SceneSnapshot } }

// Read-only diagnostics, enabled explicitly for QA. No DOM writes in the render loop.
export function SceneInspection({ state, motion }: { state: React.RefObject<NarrativeState>; motion: React.RefObject<CharacterMotion> }) {
  const { scene, camera, gl } = useThree();
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("inspect") !== "1") return;
    const canvas = gl.domElement;
    const inspect = () => {
      scene.updateMatrixWorld(true);
      const cat = scene.getObjectByName("original-cat");
      const yarn = scene.getObjectByName("companion-yarn");
      const box = cat ? new Box3().setFromObject(cat) : new Box3();
      // Transform actual vertices: rotating each thread's cached local AABB
      // inflates the apparent diameter even though the yarn remains spherical.
      const yarnBox = yarn ? new Box3().setFromObject(yarn, true) : new Box3();
      const headNode = scene.getObjectByName("cat-head");
      const head = headNode ? headNode.localToWorld(new Vector3(0, 0, 0.1)) : cat ? cat.localToWorld(new Vector3(0, 1.28, 0.1)) : new Vector3();
      const screen = head.clone().project(camera);
      const ray = new Raycaster();
      ray.setFromCamera(new Vector2(screen.x, screen.y), camera);
      const hit = ray.intersectObjects(scene.children, true).find(item => item.object.visible);
      let hitCat = false;
      const hitNames: string[] = [];
      for (let object = hit?.object; object; object = object.parent ?? undefined) {
        if (object === cat) hitCat = true;
        if (object.name) hitNames.push(object.name);
      }
      const offset = motion.current.yarn.clone().sub(motion.current.position);
      offset.y = 0;
      const ahead = offset.dot(new Vector3(Math.sin(motion.current.yaw), 0, Math.cos(motion.current.yaw)));
      const pupils = scene.getObjectByName("cat-pupils");
      const arm = scene.getObjectByName("cat-reaching-arm");
      return {
        progress: state.current.progress, direction: state.current.direction,
        catVisible: !!cat?.visible && screen.z < 1 && Math.abs(screen.x) < 1 && Math.abs(screen.y) < 1,
        headVisible: hitCat, headOccluder: hitCat ? "" : hitNames.join(" / ") || hit?.object.type || "none", catPosition: motion.current.position.toArray(), yarnPosition: motion.current.yarn.toArray(), catScreen: screen.toArray(),
        yaw: motion.current.yaw, gait: motion.current.gait, stride: motion.current.stride, blink: motion.current.blink, headYaw: motion.current.headYaw,
        yarnAhead: ahead, yarnDistance: offset.length(), catHeight: box.getSize(new Vector3()).y, yarnDiameter: yarnBox.getSize(new Vector3()).y,
        drawCalls: gl.info.render.calls, triangles: gl.info.render.triangles,
        heroMode: motion.current.hero.mode, heroEnabled: motion.current.hero.enabled, heroIdleFor: motion.current.hero.inactiveFor,
        heroJumps: motion.current.hero.jumpCount, heroJumpElapsed: motion.current.hero.jumpElapsed,
        heroTrackingWeight: motion.current.hero.trackingBlend, heroPlayWeight: motion.current.hero.playBlend,
        jumpOffset: motion.current.jumpOffset, jumpSquash: motion.current.jumpSquash,
        eyeOffsets: pupils?.position.toArray() ?? [], reachingArm: arm ? [arm.rotation.x, arm.rotation.y, arm.rotation.z] : [],
        yarnNudge: motion.current.yarnNudge, yarnScreen: motion.current.yarn.clone().project(camera).toArray(), cameraPosition: camera.position.toArray(),
        heroHoverArmed: motion.current.hero.armed, heroPointerInside: motion.current.hero.inside, headPitch: motion.current.headPitch,
        heroCooldownRemaining: Math.max(0, motion.current.hero.cooldownUntil - motion.current.hero.time),
        finaleProgress: finaleState(state.current.progress).progress, finaleCamera: finaleState(state.current.progress).camera,
        portalAtmosphere: finaleState(state.current.progress).atmosphere, finaleCTA: finaleState(state.current.progress).cta,
        portalScreen: new Vector3(0, 2.4, -44).project(camera).toArray(), cameraDirection: camera.getWorldDirection(new Vector3()).toArray(), catScale: motion.current.portalScale,
      };
    };
    Object.defineProperty(canvas, "portfolioSnapshot", { configurable: true, value: inspect });
    return () => { Reflect.deleteProperty(canvas, "portfolioSnapshot"); };
  }, [scene, camera, gl, motion, state]);
  return null;
}
