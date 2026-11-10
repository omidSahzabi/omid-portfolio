import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { BoxGeometry, Color, type Group, InstancedMesh, Matrix4, MeshStandardMaterial, Quaternion, Vector3 } from "three";
import type { NarrativeState } from "@/lib/experience/narrativeTimeline";

export type DetailBlock = { at: [number, number, number]; size: [number, number, number]; color?: string };

// Repeated small details share one geometry/material and one draw call.
export function DetailBatch({ items, color = "#785995" }: { items: DetailBlock[]; color?: string }) {
  const mesh = useMemo(() => {
    const result = new InstancedMesh(new BoxGeometry(1, 1, 1), new MeshStandardMaterial({ roughness: 0.78 }), items.length);
    const matrix = new Matrix4(); const rotation = new Quaternion();
    items.forEach((item, index) => {
      matrix.compose(new Vector3(...item.at), rotation, new Vector3(...item.size));
      result.setMatrixAt(index, matrix);
      result.setColorAt(index, new Color(item.color ?? color));
    });
    result.computeBoundingSphere();
    return result;
  }, [items, color]);
  useEffect(() => () => { mesh.geometry.dispose(); (mesh.material as MeshStandardMaterial).dispose(); }, [mesh]);
  return <primitive object={mesh} dispose={null} />;
}

export function Block({ at, size, color = "#221733", glow = false }: { at: [number, number, number]; size: [number, number, number]; color?: string; glow?: boolean }) {
  return <mesh position={at} castShadow receiveShadow><boxGeometry args={size} /><meshStandardMaterial color={color} roughness={0.62} metalness={0.16} emissive={glow ? color : "#000000"} emissiveIntensity={glow ? 1.8 : 0} /></mesh>;
}

export function Arch({ at, radius = 3, height = 3, glow = false }: { at: [number, number, number]; radius?: number; height?: number; glow?: boolean }) {
  const color = glow ? "#8B5CF6" : "#392453";
  return <group position={at}>
    <mesh position={[0, height, 0]} castShadow><torusGeometry args={[radius, glow ? 0.09 : 0.28, 8, 48, Math.PI]} /><meshStandardMaterial color={color} roughness={0.6} emissive={glow ? color : "#000000"} emissiveIntensity={glow ? 3 : 0} /></mesh>
    {[-1, 1].map(side => <Block key={side} at={[radius * side, height / 2, 0]} size={[glow ? 0.18 : 0.56, height, glow ? 0.18 : 0.56]} color={color} glow={glow} />)}
  </group>;
}

export function TileFloor({ z, length, width = 13 }: { z: number; length: number; width?: number }) {
  const mesh = useMemo(() => {
    const columns = Math.floor(width / 1.5);
    const rows = Math.floor(length / 1.5);
    const geometry = new BoxGeometry(1.47, 0.035, 1.47);
    const material = new MeshStandardMaterial({ color: "#20162d", roughness: 0.85, metalness: 0.08 });
    const instance = new InstancedMesh(geometry, material, columns * rows);
    const matrix = new Matrix4();
    for (let row = 0; row < rows; row++) for (let col = 0; col < columns; col++) {
      matrix.makeTranslation((col - (columns - 1) / 2) * 1.5, 0, z + (row - (rows - 1) / 2) * 1.5);
      instance.setMatrixAt(row * columns + col, matrix);
    }
    instance.receiveShadow = true;
    return instance;
  }, [z, length, width]);
  useEffect(() => () => { mesh.geometry.dispose(); (mesh.material as MeshStandardMaterial).dispose(); }, [mesh]);
  return <primitive object={mesh} dispose={null} />;
}

export function Pendant({ at, state }: { at: [number, number, number]; state?: React.RefObject<NarrativeState> }) {
  const shade = useRef<Group>(null);
  useFrame(() => { if (shade.current && state) shade.current.rotation.z = Math.sin(state.current.clock * 0.65 + at[2]) * 0.018; });
  return <group position={at} ref={shade}>
    <mesh position={[0, 1.3, 0]}><cylinderGeometry args={[0.018, 0.018, 2.6, 6]} /><meshStandardMaterial color="#4a3566" /></mesh>
    <mesh><cylinderGeometry args={[0.16, 0.55, 0.4, 24, 1, true]} /><meshStandardMaterial color="#493159" side={2} roughness={0.65} /></mesh>
    <mesh position={[0, -0.19, 0]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[0.48, 24]} /><meshBasicMaterial color="#ad88dc" /></mesh>
  </group>;
}
