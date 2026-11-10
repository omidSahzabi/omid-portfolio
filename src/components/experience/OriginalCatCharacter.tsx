import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Group, PointLight } from "three";
import { CAT_SCALE, type CharacterMotion } from "@/lib/experience/characterMotion";
import { createAlmondEye, createCatBody, createCatEar, createCatHead, createCurledTail, createSmile } from "@/lib/experience/mascotGeometry";

const coat = "#30203f";

/** An original cat mascot. This is not GitHub's Octocat or an official GitHub asset. */
export function OriginalCatCharacter({ motion }: { motion: React.RefObject<CharacterMotion> }) {
  const root = useRef<Group>(null);
  const torso = useRef<Group>(null);
  const head = useRef<Group>(null);
  const eyes = useRef<Group>(null);
  const pupils = useRef<Group>(null);
  const leftArm = useRef<Group>(null);
  const rightArm = useRef<Group>(null);
  const leftFoot = useRef<Group>(null);
  const rightFoot = useRef<Group>(null);
  const tail = useRef<Group>(null);
  const leftEar = useRef<Group>(null);
  const rightEar = useRef<Group>(null);
  const fill = useRef<PointLight>(null);
  const jumpRoot = useRef<Group>(null);
  const rightWrist = useRef<Group>(null);
  const geometry = useMemo(() => ({ head: createCatHead(), body: createCatBody(), ear: createCatEar(), eye: createAlmondEye(), tail: createCurledTail(), smileLeft: createSmile(-1), smileRight: createSmile(1) }), []);
  useEffect(() => () => { Object.values(geometry).forEach(part => part.dispose()); }, [geometry]);

  useFrame(() => {
    const pose = motion.current;
    if (fill.current) {
      fill.current.position.set(pose.position.x - 1.5, 3.1, pose.position.z + 1.8);
      fill.current.intensity = 9 * pose.portalScale;
    }
    if (!root.current) return;
    root.current.position.copy(pose.position);
    root.current.rotation.y = pose.yaw;
    root.current.scale.setScalar(CAT_SCALE * pose.portalScale);
    root.current.visible = pose.portalScale > 0.015;
    if (jumpRoot.current) {
      jumpRoot.current.position.y = pose.jumpOffset / CAT_SCALE;
      const width = 1 - (pose.jumpSquash - 1) * 0.32;
      jumpRoot.current.scale.set(width, pose.jumpSquash, width);
    }
    const step = Math.sin(pose.gait);
    const sway = step * pose.stride;
    if (torso.current) {
      torso.current.scale.y = pose.breath;
      torso.current.position.y = Math.abs(step) * 0.025 * pose.stride;
      torso.current.rotation.z = sway * 0.025;
      torso.current.rotation.x = pose.bodyLean;
    }
    if (head.current) { head.current.rotation.set(pose.headPitch, pose.headYaw, -sway * 0.025); }
    if (eyes.current) eyes.current.scale.y = pose.blink;
    if (pupils.current) {
      pupils.current.position.set(pose.eyeX, pose.eyeY, 0);
      for (const pupil of pupils.current.children) pupil.rotation.set(pose.eyePitch, pose.eyeYaw, 0);
    }
    if (leftEar.current) leftEar.current.rotation.z = -0.08 + pose.earLeft;
    if (rightEar.current) rightEar.current.rotation.z = 0.08 + pose.earRight;
    if (tail.current) { tail.current.rotation.y = pose.tail; tail.current.rotation.x = sway * 0.07; }
    if (leftArm.current) leftArm.current.rotation.set(pose.leftArmX, 0, pose.leftArmZ);
    if (rightArm.current) {
      rightArm.current.rotation.set(pose.rightArmX, pose.rightArmY, pose.rightArmZ);
      rightArm.current.position.z = 0.11 + pose.tap * 0.07;
    }
    if (rightWrist.current) rightWrist.current.rotation.set(pose.wristX, 0, pose.wristZ);
    for (const [foot, sign] of [[leftFoot.current, 1], [rightFoot.current, -1]] as const) {
      if (!foot) continue;
      foot.position.y = 0.13 + Math.max(0, step * sign) * (0.1 + pose.run * 0.04) * pose.stride;
      foot.position.z = 0.03 + Math.cos(pose.gait) * sign * 0.12 * pose.stride;
      foot.rotation.x = step * sign * pose.stride * 0.14;
    }
  });

  return <><group ref={root} name="original-cat" userData={{ original: true, height: 1.86 }}>
    <group ref={jumpRoot} name="cat-jump-body">
    <group ref={torso}>
      <mesh geometry={geometry.body} position={[0, 0.22, 0]} castShadow><meshStandardMaterial color={coat} emissive="#352043" emissiveIntensity={0.24} roughness={0.68} metalness={0.08} /></mesh>
      <mesh position={[0, 0.64, 0.282]} scale={[0.235, 0.28, 0.075]}><sphereGeometry args={[1, 24, 16]} /><meshStandardMaterial color="#634779" roughness={0.9} /></mesh>
      <mesh position={[0, 0.99, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.235, 0.028, 8, 32]} /><meshStandardMaterial color="#8b5cf6" roughness={0.5} /></mesh>
      <mesh position={[0, 0.94, 0.25]} scale={[1, 1.2, 0.45]}><octahedronGeometry args={[0.065]} /><meshStandardMaterial color="#c4b5fd" emissive="#8b5cf6" emissiveIntensity={0.2} /></mesh>
      <group ref={leftArm} position={[-0.35, 0.79, 0.11]}><Paw /></group>
      <group ref={rightArm} name="cat-reaching-arm" position={[0.35, 0.79, 0.11]}><Paw wrist={rightWrist} /></group>
      <group ref={tail} position={[0, 0.42, -0.23]}><mesh geometry={geometry.tail} castShadow><meshStandardMaterial color="#53366b" roughness={0.7} /></mesh></group>
      <group position={[0, 1.24, 0.025]}>
        <group ref={head} name="cat-head">
          <mesh geometry={geometry.head} castShadow><meshStandardMaterial color={coat} emissive="#352043" emissiveIntensity={0.24} roughness={0.6} metalness={0.09} /></mesh>
          <mesh position={[0, 0.13, -0.386]} scale={[0.65, 1, 0.16]}><octahedronGeometry args={[0.11]} /><meshStandardMaterial color="#7c5599" roughness={0.85} /></mesh>
          <group ref={leftEar} position={[-0.36, 0.28, -0.06]}>
            <mesh geometry={geometry.ear} castShadow><meshStandardMaterial color={coat} roughness={0.65} /></mesh>
            <mesh geometry={geometry.ear} position={[-0.018, 0.04, 0.135]} scale={[0.55, 0.62, 0.12]}><meshStandardMaterial color="#9a70c8" roughness={0.8} /></mesh>
          </group>
          <group ref={rightEar} position={[0.36, 0.28, -0.06]} scale={[-1, 1, 1]}>
            <mesh geometry={geometry.ear} castShadow><meshStandardMaterial color={coat} roughness={0.65} /></mesh>
            <mesh geometry={geometry.ear} position={[-0.018, 0.04, 0.135]} scale={[0.55, 0.62, 0.12]}><meshStandardMaterial color="#9a70c8" roughness={0.8} /></mesh>
          </group>
          <mesh position={[0, -0.15, 0.34]} scale={[0.28, 0.155, 0.11]}><sphereGeometry args={[1, 24, 16]} /><meshStandardMaterial color="#8b6aa4" roughness={0.95} /></mesh>
          <group ref={eyes} position={[0, 0.015, 0]}>
            {[-1, 1].map(side => <mesh key={side} geometry={geometry.eye} position={[side * 0.235, 0.025, 0.35]} rotation={[0, side * 0.15, side * 0.035]}><meshStandardMaterial color="#c4b5fd" emissive="#9f79d8" emissiveIntensity={0.16} roughness={0.48} /></mesh>)}
            <group ref={pupils} name="cat-pupils">
              {[-1, 1].map(side => <group key={side} position={[side * 0.235, 0.055, 0.405]}>
                <mesh scale={[0.057, 0.115, 0.026]}><sphereGeometry args={[1, 20, 16]} /><meshStandardMaterial color="#100b18" roughness={0.25} /></mesh>
                <mesh position={[-0.02, 0.05, 0.022]}><sphereGeometry args={[0.022, 10, 8]} /><meshBasicMaterial color="#e2d5fd" /></mesh>
              </group>)}
            </group>
          </group>
          <mesh position={[0, -0.09, 0.447]} rotation={[0, 0, Math.PI]} scale={[1, 0.7, 0.5]}><coneGeometry args={[0.065, 0.085, 3]} /><meshStandardMaterial color="#2b163c" roughness={0.6} /></mesh>
          <mesh geometry={geometry.smileLeft}><meshStandardMaterial color="#2b163c" roughness={1} /></mesh><mesh geometry={geometry.smileRight}><meshStandardMaterial color="#2b163c" roughness={1} /></mesh>
          <mesh position={[0, 0.29, 0.3]} scale={[0.55, 1, 0.2]}><octahedronGeometry args={[0.09]} /><meshStandardMaterial color="#8b5cf6" roughness={0.8} /></mesh>
          {[-1, 1].flatMap(side => [0, 1].map(i => <mesh key={`${side}-${i}`} position={[side * 0.395, -0.1 - i * 0.055, 0.321]} rotation={[0, 0, side * (0.1 + i * 0.15)]}><capsuleGeometry args={[0.008, 0.12, 2, 6]} /><meshStandardMaterial color="#aa84c6" roughness={1} /></mesh>))}
        </group>
      </group>
    </group>
    <group ref={leftFoot} position={[-0.235, 0.13, 0.03]}><Foot /></group><group ref={rightFoot} position={[0.235, 0.13, 0.03]}><Foot /></group>
    </group>
    <mesh name="cat-contact-shadow" userData={{ ignoreHeroHover: true }} position={[0, 0.026, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={[0.6, 0.45, 1]} renderOrder={1}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial transparent depthWrite={false} vertexShader="varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }" fragmentShader="varying vec2 vUv; void main(){ float a=(1.0-smoothstep(0.0,0.5,length(vUv-0.5)))*0.3; gl_FragColor=vec4(0.025,0.012,0.04,a); }" />
    </mesh>
  </group><pointLight ref={fill} color="#b49ade" intensity={9} distance={5} decay={2} /></>;
}

function Paw({ wrist }: { wrist?: React.RefObject<Group | null> }) {
  return <>
    <mesh position={[0, -0.18, 0]} castShadow><capsuleGeometry args={[0.105, 0.28, 4, 12]} /><meshStandardMaterial color={coat} roughness={0.75} /></mesh>
    <group ref={wrist} position={[0, -0.38, 0.045]}>
      <mesh scale={[0.14, 0.12, 0.15]} castShadow><sphereGeometry args={[1, 20, 14]} /><meshStandardMaterial color="#59406d" roughness={0.8} /></mesh>
      {[-1, 0, 1].map(i => <mesh key={i} position={[i * 0.055, -0.02, 0.133]} scale={[1, 0.75, 0.4]}><sphereGeometry args={[0.022, 8, 6]} /><meshStandardMaterial color="#b398d0" roughness={0.9} /></mesh>)}
    </group>
  </>;
}

function Foot() {
  return <mesh scale={[0.19, 0.13, 0.26]} castShadow><sphereGeometry args={[1, 24, 16]} /><meshStandardMaterial color="#423052" roughness={0.8} /></mesh>;
}
