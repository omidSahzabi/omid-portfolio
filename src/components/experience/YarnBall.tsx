import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { CatmullRomCurve3, type Group, Mesh, MeshStandardMaterial, TubeGeometry, Vector3 } from "three";
import { clampProgress, type NarrativeState } from "@/lib/experience/narrativeTimeline";
import { worldPath } from "@/lib/experience/worldPath";
import { COMPANION_DISTANCE, YARN_RADIUS, type CharacterMotion } from "@/lib/experience/characterMotion";

export function YarnBall({ state, motion }: { state: React.RefObject<NarrativeState>; motion: React.RefObject<CharacterMotion> }) {
  const root = useRef<Group>(null);
  const ball = useRef<Group>(null);
  const resources = useMemo(() => {
    const material = new MeshStandardMaterial({ color: "#a07aeb", roughness: 0.75, emissive: "#6d28d9", emissiveIntensity: 0.16 });
    const curves: TubeGeometry[] = [];
    for (let i = 0; i < 14; i++) {
      const points: Vector3[] = [];
      for (let j = 0; j <= 80; j++) {
        const t = j / 80 * Math.PI * 2;
        const latitude = Math.sin(t * 3 + i * 0.67) * 0.36;
        const v = new Vector3(Math.cos(t) * Math.cos(latitude), Math.sin(latitude), Math.sin(t) * Math.cos(latitude));
        v.applyAxisAngle(new Vector3(0.7, 0.3, 0.5).normalize(), i * 0.31).multiplyScalar(1.006 + (i % 3) * 0.009);
        points.push(v);
      }
      curves.push(new TubeGeometry(new CatmullRomCurve3(points, true), 64, 0.018, 4, true));
    }
    const trailPoints = worldPath.getSpacedPoints(240).map(p => p.add(new Vector3(0, 0.035, 0)));
    const trail = new TubeGeometry(new CatmullRomCurve3(trailPoints), 300, 0.009, 4, false);
    return { material, curves, trail };
  }, []);
  useEffect(() => () => { resources.material.dispose(); resources.curves.forEach(g => g.dispose()); resources.trail.dispose(); }, [resources]);
  const thread = useRef<Mesh>(null);
  useFrame(() => {
    const p = clampProgress(state.current.progress);
    if (root.current) {
      root.current.position.copy(motion.current.yarn);
      root.current.scale.setScalar(YARN_RADIUS);
    }
    if (ball.current) {
      // Rotation depends on distance, so any seek yields the same physical roll.
      ball.current.rotation.x = -p * worldPath.getLength() / YARN_RADIUS - motion.current.yarnNudge / YARN_RADIUS;
      ball.current.rotation.z = Math.sin(p * 30) * 0.16;
    }
    const count = resources.trail.index?.count ?? 0;
    resources.trail.setDrawRange(0, Math.floor(Math.min(1, p + COMPANION_DISTANCE / worldPath.getLength()) * count / 24) * 24);
  });
  return <>
    <mesh ref={thread} geometry={resources.trail}><meshStandardMaterial color="#8b5cf6" emissive="#6d28d9" emissiveIntensity={0.5} roughness={0.9} /></mesh>
    <group ref={root} name="companion-yarn" userData={{ radius: YARN_RADIUS }}>
      <group ref={ball}>
        <mesh castShadow><sphereGeometry args={[1, 24, 20]} /><meshStandardMaterial color="#6d28d9" roughness={0.88} /></mesh>
        {resources.curves.map((geometry, i) => <mesh key={i} geometry={geometry} material={resources.material} dispose={null} />)}
      </group>
    </group>
  </>;
}
