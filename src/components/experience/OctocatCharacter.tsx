import { Component, lazy, Suspense, type ReactNode } from "react";
import { portfolio } from "@/lib/portfolio";
import { type NarrativeState } from "@/lib/experience/narrativeTimeline";
import type { CharacterMotion } from "@/lib/experience/characterMotion";
import { OriginalCatCharacter } from "./OriginalCatCharacter";

// The default procedural cat needs no GLTF/Draco loaders or animation mixer.
// Retain the optional model override, loading its support only when configured.
const LoadedCharacter = lazy(() => import("./LoadedCharacter"));

class AssetBoundary extends Component<{ children: ReactNode; fallback: ReactNode; onFailure: () => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { this.props.onFailure(); }
  render() { return this.state.failed ? this.props.fallback : this.props.children; }
}

export function OctocatCharacter({ state, motion, onFailure }: { state: React.RefObject<NarrativeState>; motion: React.RefObject<CharacterMotion>; onFailure: () => void }) {
  const { authorized, modelUrl } = portfolio.character;
  const original = <OriginalCatCharacter motion={motion} />;
  if (!authorized || !modelUrl) return original;
  return <AssetBoundary onFailure={onFailure} fallback={original}><Suspense fallback={original}><LoadedCharacter url={modelUrl} state={state} motion={motion} /></Suspense></AssetBoundary>;
}
