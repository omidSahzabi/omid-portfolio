import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { MathUtils, Matrix4, PerspectiveCamera, Quaternion, Vector3 } from "three";
import { sampleExtendedCamera } from "@/lib/experience/finaleCamera";
import { advanceNarrative, smoothRange, type NarrativeState } from "@/lib/experience/narrativeTimeline";

export function CinematicCameraRig({ state }: { state: React.RefObject<NarrativeState> }) {
  const rigRef = useRef({ position: new Vector3(), target: new Vector3(), matrix: new Matrix4(), rotation: new Quaternion(), reverse: 0 });
  useFrame(({ camera, size, pointer }, delta) => {
    const rig = rigRef.current;
    advanceNarrative(state.current, delta);
    const travel = state.current;
    const mobile = size.width < 768;
    const fov = sampleExtendedCamera(travel.progress, mobile, rig.position, rig.target);
    // Reverse shots retain their screen axis; a small lateral dolly reveals the return route.
    rig.reverse = MathUtils.damp(rig.reverse, travel.direction < 0 ? 1 : 0, 3, Math.min(delta, 0.05));
    const reverseFraming = 1 - smoothRange(1, 1.15, travel.progress);
    rig.position.x -= rig.reverse * 0.8 * reverseFraming;
    rig.position.z += rig.reverse * 0.6 * reverseFraming;
    if (!mobile && !travel.reducedMotion && !travel.paused && travel.progress < 0.1) {
      rig.position.x += pointer.x * 0.22;
      rig.position.y += pointer.y * 0.15;
    }
    camera.position.copy(rig.position);
    rig.matrix.lookAt(rig.position, rig.target, camera.up);
    rig.rotation.setFromRotationMatrix(rig.matrix);
    // Slerp through the shortest quaternion arc, never through Euler wraps.
    camera.quaternion.slerp(rig.rotation, travel.reducedMotion ? 1 : 1 - Math.exp(-12 * Math.min(delta, 0.05)));
    const perspective = camera as PerspectiveCamera;
    if (Math.abs(perspective.fov - fov) > 0.005) {
      perspective.fov = fov;
      perspective.updateProjectionMatrix();
    }
  }, -100);
  return null;
}
