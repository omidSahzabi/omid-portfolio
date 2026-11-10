import { Arch, Block } from "./Primitives";
import type { NarrativeState } from "@/lib/experience/narrativeTimeline";
import { ContactInformationBoard } from "../ContactInformationBoard";

export function HeroScene({ state }: { state: React.RefObject<NarrativeState> }) {
  return <group>
    <ContactInformationBoard state={state} />
    <mesh position={[0, -0.32, 2]} receiveShadow><cylinderGeometry args={[7, 7, 0.6, 64]} /><meshStandardMaterial color="#21152f" roughness={0.63} metalness={0.2} /></mesh>
    <mesh position={[0, -0.04, 2]} rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[6.6, 6.625, 80]} /><meshBasicMaterial color="#6d4592" /></mesh>
    <Arch at={[0, 0, -3.5]} radius={3.5} height={3.2} />
    <Arch at={[0, 0.02, -3.4]} radius={3.17} height={3.2} glow />
    <Block at={[5.25, 1.7, -3.5]} size={[2.8, 3.4, 0.55]} color="#1e142a" />
    <Block at={[-5.25, 1.7, -3.5]} size={[2.8, 3.4, 0.55]} color="#1e142a" />
    <Block at={[-5.1, 0.25, 1]} size={[0.8, 0.5, 0.8]} color="#362044" />
    <Block at={[-5.1, 1.9, 1]} size={[0.055, 3.3, 0.055]} color="#8b5cf6" glow />
    <mesh position={[-4.5, 0.7, -2]}><cylinderGeometry args={[0.38, 0.3, 1.4, 16]} /><meshStandardMaterial color="#33213f" /></mesh>
    {[0, 1, 2].map(i => <mesh key={i} position={[-4.5 + Math.sin(i * 2) * 0.3, 1.7 + i * 0.22, -2]} rotation={[0, i, i * 0.3]}><icosahedronGeometry args={[0.5, 0]} /><meshStandardMaterial color="#4c3265" roughness={1} /></mesh>)}
  </group>;
}
