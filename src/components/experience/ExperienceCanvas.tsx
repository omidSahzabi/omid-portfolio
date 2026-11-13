"use client";

import { Component, memo, useEffect, useRef, type ReactNode } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { AdaptiveDpr } from "@react-three/drei";
import { ACESFilmicToneMapping, SRGBColorSpace, type Mesh } from "three";
import type { NarrativeState } from "@/lib/experience/narrativeTimeline";
import { CinematicCameraRig } from "./CinematicCameraRig";
import { OctocatCharacter } from "./OctocatCharacter";
import { World } from "./World";
import { YarnBall } from "./YarnBall";
import { createCharacterMotion } from "@/lib/experience/characterMotion";
import { CompanionMotionController } from "./CompanionMotionController";
import { SceneInspection } from "./SceneInspection";

class CanvasBoundary extends Component<{ children: ReactNode; onFailure: () => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { this.props.onFailure(); }
  render() { return this.state.failed ? null : this.props.children; }
}

function CanvasLifecycle({ onReady, onFailure }: { onReady: () => void; onFailure: () => void }) {
  const gl = useThree(s => s.gl);
  const scene = useThree(s => s.scene);
  useEffect(() => {
    // Mesh.raycast uses an existing local bounding box to reject misses before
    // testing triangles. This is especially useful for long floors and shelves.
    // Compute once for shared geometries; rendered vertices remain untouched.
    scene.traverse(object => {
      const geometry = (object as Mesh).geometry;
      if (geometry && !geometry.boundingBox) geometry.computeBoundingBox();
    });
    onReady();
    const canvas = gl.domElement;
    const lost = (event: Event) => { event.preventDefault(); onFailure(); };
    canvas.addEventListener("webglcontextlost", lost);
    return () => canvas.removeEventListener("webglcontextlost", lost);
  }, [gl, scene, onReady, onFailure]);
  return null;
}

export default memo(function ExperienceCanvas({ state, onReady, onFailure, onCharacterFailure }: { state: React.RefObject<NarrativeState>; onReady: () => void; onFailure: () => void; onCharacterFailure: () => void }) {
  const motion = useRef(createCharacterMotion());
  return <CanvasBoundary onFailure={onFailure}>
    <Canvas shadows dpr={[1, 1.5]} camera={{ position: [-13, 9.5, 17], fov: 40, near: 0.1, far: 105 }} gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }} onCreated={({ gl }) => { gl.toneMapping = ACESFilmicToneMapping; gl.toneMappingExposure = 1.1; gl.outputColorSpace = SRGBColorSpace; gl.domElement.setAttribute("aria-hidden", "true"); }}>
      <fog attach="fog" args={["#09070d", 18, 60]} />
      <CinematicCameraRig state={state} />
      <CompanionMotionController state={state} motion={motion} />
      <World state={state} />
      <YarnBall state={state} motion={motion} />
      <OctocatCharacter state={state} motion={motion} onFailure={onCharacterFailure} />
      <AdaptiveDpr pixelated />
      <CanvasLifecycle onReady={onReady} onFailure={onFailure} />
      <SceneInspection state={state} motion={motion} />
    </Canvas>
  </CanvasBoundary>;
});
