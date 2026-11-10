import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { MathUtils, type Group, type Mesh, type MeshBasicMaterial, type MeshStandardMaterial, type PointLight, DoubleSide } from "three";
import { smoothRange, type NarrativeState } from "@/lib/experience/narrativeTimeline";
import { Arch, Block, TileFloor } from "./Primitives";
import { PortalFinale } from "../PortalFinale";
import { finaleState } from "@/lib/experience/finaleTimeline";

export function PortalScene({ state }: { state: React.RefObject<NarrativeState> }) {
  const surface = useRef<Mesh>(null);
  const halo = useRef<Group>(null);
  const gateGlow = useRef<Group>(null);
  const entryLight = useRef<PointLight>(null);
  const gateMaterials = useRef<{ material: MeshStandardMaterial; original: number }[]>([]);
  useFrame(() => {
    if (!gateMaterials.current.length) {
      gateGlow.current?.traverse(object => {
        if ((object as Mesh).isMesh) {
          const material = (object as Mesh).material as MeshStandardMaterial;
          gateMaterials.current.push({ material, original: material.emissiveIntensity });
        }
      });
    }
    const atmosphere = finaleState(state.current.progress).atmosphere;
    if (surface.current) (surface.current.material as MeshBasicMaterial).opacity = (0.04 + smoothRange(0.82, 1, state.current.progress) * 0.16) * (1 - atmosphere);
    for (const entry of gateMaterials.current) entry.material.emissiveIntensity = MathUtils.lerp(entry.original, 0.8, atmosphere);
    if (entryLight.current) entryLight.current.intensity = MathUtils.lerp(30, 12, atmosphere);
    if (halo.current) {
      const reveal = smoothRange(0.87, 0.99, state.current.progress);
      halo.current.scale.setScalar(0.98 + Math.sin(state.current.clock * 1.4) * 0.008 * reveal);
    }
  });
  return <group>
    <PortalFinale state={state} />
    <TileFloor z={-42} length={7.5} />
    <Arch at={[0, 0, -44]} radius={2.25} height={2.4} />
    <group ref={gateGlow}><Arch at={[0, 0, -43.8]} radius={1.95} height={2.4} glow /></group>
    <group ref={halo} position={[0, 2.4, -44.1]}>
      <mesh><torusGeometry args={[1.78, 0.016, 6, 64, Math.PI]} /><meshBasicMaterial color="#b399ee" transparent opacity={0.45} /></mesh>
    </group>
    {[-42.1, -42.8, -43.5].map(z => <mesh key={z} position={[0, 0.04, z]} rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[0.22, 0.24, 32, 1, 0, Math.PI]} /><meshStandardMaterial color="#ac82e6" emissive="#6d28d9" emissiveIntensity={0.5} /></mesh>)}
    <mesh ref={surface} position={[0, 2.2, -44]}><planeGeometry args={[3.8, 4.4]} /><meshBasicMaterial color="#8b5cf6" transparent opacity={0.16} side={DoubleSide} depthWrite={false} /></mesh>
    <pointLight ref={entryLight} position={[0, 2.4, -43]} color="#8b5cf6" intensity={30} distance={12} decay={2} />
    {[-1, 1].map(side => <Block key={side} at={[side * 3.2, 0.7, -43.8]} size={[0.7, 1.4, 0.7]} color="#362046" />)}
  </group>;
}
