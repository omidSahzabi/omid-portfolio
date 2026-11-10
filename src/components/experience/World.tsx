import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Group } from "three";
import { smoothRange, type NarrativeState } from "@/lib/experience/narrativeTimeline";
import { HeroScene } from "./scenes/HeroScene";
import { RestaurantScene } from "./scenes/RestaurantScene";
import { KitchenScene } from "./scenes/KitchenScene";
import { StorageScene } from "./scenes/StorageScene";
import { PortalScene } from "./scenes/PortalScene";
import { Arch, Block } from "./scenes/Primitives";

function Doorway({ z, start, state }: { z: number; start: number; state: React.RefObject<NarrativeState> }) {
  const left = useRef<Group>(null);
  const right = useRef<Group>(null);
  useFrame(() => {
    const angle = smoothRange(start, start + 0.055, state.current.progress) * Math.PI * 0.46;
    if (left.current) left.current.rotation.y = -angle;
    if (right.current) right.current.rotation.y = angle;
  });
  return <group position={[0, 0, z]}>
    <Arch at={[0, 0, 0]} radius={2.3} height={2.6} />
    {[-1, 1].map(side => <Block key={side} at={[side * 4.6, 1.9, 0]} size={[4, 3.8, 0.28]} />)}
    <group ref={left} position={[-2.1, 0, 0]}><Block at={[1.05, 1.35, 0]} size={[2.08, 2.7, 0.12]} color="#3f2953" /><Block at={[1.7, 1.5, 0.1]} size={[0.05, 0.4, 0.06]} color="#a483cf" /></group>
    <group ref={right} position={[2.1, 0, 0]}><Block at={[-1.05, 1.35, 0]} size={[2.08, 2.7, 0.12]} color="#3f2953" /><Block at={[-1.7, 1.5, 0.1]} size={[0.05, 0.4, 0.06]} color="#a483cf" /></group>
  </group>;
}

export function World({ state }: { state: React.RefObject<NarrativeState> }) {
  return <group>
    <HeroScene state={state} /><RestaurantScene state={state} /><KitchenScene state={state} /><StorageScene /><PortalScene state={state} />
    <Doorway z={-16.2} start={0.34} state={state} /><Doorway z={-27.7} start={0.57} state={state} />
    <ambientLight color="#c4b5fd" intensity={0.8} />
    <hemisphereLight args={["#b19acb", "#09070d", 1.4]} />
    <directionalLight position={[-8, 16, 8]} color="#c4b5fd" intensity={3.2} castShadow shadow-mapSize={[1024, 1024]} shadow-camera-left={-13} shadow-camera-right={13} shadow-camera-top={12} shadow-camera-bottom={-50} shadow-camera-far={90} shadow-bias={-0.001} shadow-normalBias={0.04} />
    <pointLight position={[-3, 4, 3]} intensity={65} distance={18} color="#8b5cf6" decay={2} />
    {[-10, -22, -33].map(z => <pointLight key={z} position={[0, 5, z]} intensity={70} distance={17} color="#8b5cf6" decay={2} />)}
  </group>;
}
