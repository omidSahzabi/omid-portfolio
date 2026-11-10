import { useMemo, useRef, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { CatmullRomCurve3, type Group, type Mesh, type MeshBasicMaterial, TubeGeometry, Vector3 } from "three";
import type { NarrativeState } from "@/lib/experience/narrativeTimeline";
import { Block, DetailBatch, type DetailBlock, Pendant, TileFloor } from "./Primitives";

const counterDetails: DetailBlock[] = [-4.2, 4.2].flatMap(x => [
  ...[-19.5, -22, -24.3].flatMap(z => [0, 1, 2].map(i => ({ at: [x - Math.sign(x) * 1.12, 1.28, z + (i - 1) * 0.24], size: [0.035, 0.08, 0.1], color: "#a483bd" } as DetailBlock))),
  ...[-20, -21, -22, -23].map((z, i) => ({ at: [x + Math.sign(x) * 1.35, 3.2, z], size: [0.3, 0.36 + i % 2 * 0.1, 0.3], color: i % 2 ? "#694783" : "#9270a8" } as DetailBlock)),
]);

function Steam({ x, z, state }: { x: number; z: number; state: React.RefObject<NarrativeState> }) {
  const root = useRef<Group>(null);
  const strand = useRef<Mesh>(null);
  const geometry = useMemo(() => new TubeGeometry(new CatmullRomCurve3([new Vector3(0, 0, 0), new Vector3(0.045, 0.18, 0), new Vector3(-0.035, 0.38, 0), new Vector3(0.025, 0.6, 0)]), 16, 0.014, 4, false), []);
  useEffect(() => () => geometry.dispose(), [geometry]);
  useFrame(() => {
    const cycle = state.current.clock * 0.8 + z;
    if (root.current) { root.current.scale.y = 0.65 + Math.sin(cycle) * 0.25; root.current.rotation.y = cycle * 0.3; }
    if (strand.current) (strand.current.material as MeshBasicMaterial).opacity = 0.14 + Math.sin(cycle) * 0.05;
  });
  return <group ref={root} position={[x, 2.22, z]}><mesh ref={strand} geometry={geometry}><meshBasicMaterial color="#c4b5fd" transparent opacity={0.16} depthWrite={false} /></mesh></group>;
}

function Chef({ x, z, state }: { x: number; z: number; state: React.RefObject<NarrativeState> }) {
  const arm = useRef<Group>(null);
  const otherArm = useRef<Group>(null);
  useFrame(() => {
    const cycle = state.current.clock * 2 + z;
    if (arm.current) { arm.current.rotation.x = -0.9 + Math.sin(cycle) * 0.18; arm.current.rotation.z = Math.cos(cycle) * 0.1; }
    if (otherArm.current) otherArm.current.rotation.x = -0.65 + Math.sin(cycle + 1.3) * 0.12;
  });
  return <group position={[x, 0, z]} rotation={[0, Math.sign(x) * Math.PI / 2, 0]}>
    <mesh position={[0, 1.2, 0]} castShadow><capsuleGeometry args={[0.28, 0.65, 4, 12]} /><meshStandardMaterial color="#4b3463" /></mesh>
    <mesh position={[0, 1.95, 0]} castShadow><sphereGeometry args={[0.26, 16, 12]} /><meshStandardMaterial color="#6c4c8b" /></mesh>
    <mesh position={[0, 2.2, 0]}><cylinderGeometry args={[0.3, 0.26, 0.3, 16]} /><meshStandardMaterial color="#9478b1" /></mesh>
    {[-0.16, 0, 0.16].map(x => <mesh key={x} position={[x, 2.39, 0]}><sphereGeometry args={[0.18, 12, 8]} /><meshStandardMaterial color="#9478b1" /></mesh>)}
    {[-0.15, 0.15].map(x => <Block key={x} at={[x, 0.36, 0]} size={[0.18, 0.72, 0.23]} />)}
    <group ref={arm} position={[0.3, 1.55, 0]}><Block at={[0, -0.28, 0]} size={[0.16, 0.6, 0.16]} color="#6c4c8b" /><Block at={[0, -0.65, 0.09]} size={[0.035, 0.38, 0.08]} color="#b195c6" /></group>
    <group ref={otherArm} position={[-0.3, 1.55, 0]}><Block at={[0, -0.28, 0]} size={[0.16, 0.55, 0.16]} color="#6c4c8b" /></group>
  </group>;
}

export function KitchenScene({ state }: { state: React.RefObject<NarrativeState> }) {
  return <group>
    <TileFloor z={-22} length={12} />
    {[-4.2, 4.2].map(x => <group key={x}>
      <Block at={[x, 0.8, -21.5]} size={[2.2, 1.6, 8.5]} color="#35243f" />
      <Block at={[x, 1.65, -21.5]} size={[2.4, 0.16, 8.7]} color="#64497c" />
      {[-19.5, -22, -24.3].map(z => <group key={z}>
        <mesh position={[x, 1.76, z]} rotation={[-Math.PI / 2, 0, 0]}><torusGeometry args={[0.43, 0.025, 6, 24]} /><meshStandardMaterial color="#8b5cf6" emissive="#8b5cf6" emissiveIntensity={0.8} /></mesh>
        <mesh position={[x, 1.91, z]} castShadow><cylinderGeometry args={[0.43, 0.36, 0.32, 24]} /><meshStandardMaterial color="#382344" roughness={0.42} metalness={0.3} /></mesh>
        <mesh position={[x, 2.08, z]}><cylinderGeometry args={[0.45, 0.43, 0.05, 24]} /><meshStandardMaterial color="#785b8c" roughness={0.4} metalness={0.3} /></mesh>
        <mesh position={[x, 2.13, z]}><torusGeometry args={[0.11, 0.025, 6, 16, Math.PI]} /><meshStandardMaterial color="#a181b9" roughness={0.4} /></mesh>
        <Steam x={x} z={z} state={state} />
      </group>)}
      <Block at={[x + Math.sign(x) * 1.35, 2.96, -21.5]} size={[0.8, 0.1, 6]} color="#51345f" />
    </group>)}
    <DetailBatch items={counterDetails} />
    <mesh position={[-4.2, 1.85, -25.2]}><cylinderGeometry args={[0.3, 0.3, 0.24, 24]} /><meshStandardMaterial color="#b19ac5" roughness={0.55} /></mesh>
    <Chef x={-2.8} z={-18.65} state={state} /><Chef x={2.8} z={-24.1} state={state} />
    <Pendant at={[0, 5.3, -22]} state={state} />
  </group>;
}
