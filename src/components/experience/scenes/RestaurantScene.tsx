import { RoundedBox } from "@react-three/drei";
import type { NarrativeState } from "@/lib/experience/narrativeTimeline";
import { Block, DetailBatch, type DetailBlock, Pendant, TileFloor } from "./Primitives";
import { ProjectSignGallery } from "../ProjectSignGallery";

const menuDetails: DetailBlock[] = [-7.1, -10.2, -13.3].flatMap(z => [
  { at: [6.11, 3.85, z], size: [0.025, 0.045, 0.95], color: "#b194ce" },
  ...[0, 1, 2].map(i => ({ at: [6.11, 3.65 - i * 0.15, z + 0.1], size: [0.025, 0.025, 0.75 - i * 0.12] } as DetailBlock)),
] as DetailBlock[]);

function Chair({ x, z, rotation }: { x: number; z: number; rotation: number }) {
  return <group position={[x, 0, z]} rotation={[0, rotation, 0]}>
    <RoundedBox position={[0, 0.62, 0]} args={[0.85, 0.16, 0.8]} radius={0.07} smoothness={2} castShadow><meshStandardMaterial color="#422b59" roughness={0.85} /></RoundedBox>
    <mesh position={[0, 1.08, 0]} castShadow><cylinderGeometry args={[0.52, 0.52, 0.8, 20, 1, true, -0.95, 1.9]} /><meshStandardMaterial color="#513668" side={2} roughness={0.8} /></mesh>
    {[-0.32, 0.32].flatMap(a => [-0.28, 0.28].map(b => <Block key={`${a}-${b}`} at={[a, 0.3, b]} size={[0.07, 0.6, 0.07]} color="#30213f" />))}
  </group>;
}

function Table({ x, z, state }: { x: number; z: number; state: React.RefObject<NarrativeState> }) {
  return <group position={[x, 0, z]}>
    <mesh position={[0, 1.25, 0]} castShadow receiveShadow><cylinderGeometry args={[1.1, 1.1, 0.16, 32]} /><meshStandardMaterial color="#50316b" roughness={0.55} /></mesh>
    <mesh position={[0, 0.6, 0]}><cylinderGeometry args={[0.1, 0.15, 1.2, 12]} /><meshStandardMaterial color="#2d1e3b" /></mesh>
    <mesh position={[0, 0.09, 0]}><cylinderGeometry args={[0.55, 0.55, 0.14, 24]} /><meshStandardMaterial color="#2d1e3b" /></mesh>
    <mesh position={[0, 1.43, 0]}><cylinderGeometry args={[0.1, 0.14, 0.25, 16]} /><meshStandardMaterial color="#8b5cf6" emissive="#6d28d9" emissiveIntensity={0.3} /></mesh>
    {[-0.5, 0.5].map(x => <group key={x} position={[x, 1.34, 0]}>
      <mesh><cylinderGeometry args={[0.27, 0.23, 0.025, 24]} /><meshStandardMaterial color="#8b6da1" roughness={0.5} /></mesh>
      <mesh position={[0.3, 0.08, 0.18]}><cylinderGeometry args={[0.075, 0.055, 0.16, 12]} /><meshStandardMaterial color="#4a325d" roughness={0.3} /></mesh>
    </group>)}
    <Chair x={0} z={1.6} rotation={0} /><Chair x={0} z={-1.6} rotation={Math.PI} />
    <Pendant at={[0, 4.5, 0]} state={state} />
  </group>;
}

export function RestaurantScene({ state }: { state: React.RefObject<NarrativeState> }) {
  return <group>
    <ProjectSignGallery state={state} />
    <TileFloor z={-9.8} length={13.5} />
    {[-4, 4].flatMap(x => [-7.2, -12.6].map(z => <Table key={`${x}-${z}`} x={x} z={z} state={state} />))}
    <Block at={[6.4, 1.3, -10]} size={[0.28, 2.6, 13]} />
    <Block at={[6.2, 2.67, -10]} size={[0.12, 0.035, 12.5]} color="#6d28d9" glow />
    {[-7.1, -10.2, -13.3].map(z => <Block key={z} at={[6.2, 3.6, z]} size={[0.12, 1.1, 1.7]} color="#3c2653" />)}
    <DetailBatch items={menuDetails} />
  </group>;
}
