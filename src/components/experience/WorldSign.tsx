import { useRef, type ReactNode } from "react";
import { Html } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { type Group, Vector3 } from "three";
import type { NarrativeState } from "@/lib/experience/narrativeTimeline";
import { Block } from "./scenes/Primitives";

type Props = {
  name: string; state: React.RefObject<NarrativeState>; position: [number, number, number];
  rotation?: number; width: number; height: number; from: number; to: number;
  poster?: boolean; children: ReactNode;
};

export function WorldSign({ name, state, position, rotation = 0, width, height, from, to, poster = false, children }: Props) {
  const root = useRef<Group>(null);
  const face = useRef<HTMLDivElement>(null);
  const projection = useRef(new Vector3());
  const previous = useRef<boolean | null>(null);
  useFrame(({ camera }) => {
    if (!root.current || !face.current) return;
    root.current.getWorldPosition(projection.current).project(camera);
    const p = state.current.progress;
    const active = p >= from && p <= to && Math.abs(projection.current.x) < 1.12 && Math.abs(projection.current.y) < 1.1 && projection.current.z < 1;
    if (active !== previous.current) {
      face.current.inert = !active;
      face.current.style.pointerEvents = active ? "auto" : "none";
      face.current.style.visibility = active ? "visible" : "hidden";
      previous.current = active;
    }
  });
  return <group ref={root} name={name} position={position} rotation={[0, rotation, 0]}>
    {poster ? <mesh><boxGeometry args={[width + 0.025, height + 0.025, 0.02]} /><meshStandardMaterial color="#49364f" roughness={0.95} /></mesh> : <>
    <Block at={[0, 0, 0]} size={[width + 0.13, height + 0.13, 0.18]} color="#372246" />
    <Block at={[0, 0, 0.095]} size={[width, height, 0.025]} color="#100c16" />
    {[-1, 1].map(side => <mesh key={side} position={[side * (width / 2 + 0.035), 0, 0.1]}><boxGeometry args={[0.018, height, 0.02]} /><meshStandardMaterial color="#8b5cf6" emissive="#6d28d9" emissiveIntensity={0.5} roughness={0.65} /></mesh>)}
    {[-1, 1].map(side => <Block key={side} at={[side * width * 0.38, 0, -0.16]} size={[0.12, height * 0.75, 0.25]} color="#4c355d" />)}
    </>}
    <Html transform occlude position={[0, 0, poster ? 0.012 : 0.125]} distanceFactor={width * 400 / 600} zIndexRange={[8, 1]} wrapperClass="world-sign-anchor">
      <div ref={face} className={`world-sign-source${poster ? " wall-project-preview" : ""}`} style={{ width: 600, height: height / width * 600 }}>{children}</div>
    </Html>
  </group>;
}
