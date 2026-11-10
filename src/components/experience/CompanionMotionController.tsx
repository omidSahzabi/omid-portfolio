import { useFrame } from "@react-three/fiber";
import { advanceCharacterMotion, type CharacterMotion } from "@/lib/experience/characterMotion";
import type { NarrativeState } from "@/lib/experience/narrativeTimeline";
import { useHeroPointer } from "./useHeroPointer";

export function CompanionMotionController({ state, motion }: { state: React.RefObject<NarrativeState>; motion: React.RefObject<CharacterMotion> }) {
  const pointer = useHeroPointer();
  useFrame((_, delta) => {
    advanceCharacterMotion(motion.current, state.current, delta, pointer(state.current, motion.current));
  }, -90);
  return null;
}
