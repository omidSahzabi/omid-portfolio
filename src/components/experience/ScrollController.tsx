import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { clampProgress, type NarrativeState } from "@/lib/experience/narrativeTimeline";
import { TIMELINE_END, originalScrollDistance } from "@/lib/experience/finaleTimeline";

export function scrollToProgress(progress: number, reducedMotion = false) {
  const track = document.getElementById("story-track");
  if (!track) return;
  const distance = originalScrollDistance(window.innerHeight);
  const value = Number.isFinite(progress) ? Math.min(TIMELINE_END, Math.max(0, progress)) : 0;
  window.scrollTo({ top: Math.max(0, distance * value), behavior: reducedMotion ? "instant" : "smooth" });
}

export function ScrollController({ state, onProgress }: { state: React.RefObject<NarrativeState>; onProgress: (progress: number) => void }) {
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const trigger = ScrollTrigger.create({
      trigger: "#story-track", start: "top top", end: "bottom bottom",
      onUpdate: self => { state.current.target = clampProgress(self.progress) * TIMELINE_END; },
      onRefresh: self => { state.current.target = clampProgress(self.progress) * TIMELINE_END; },
    });
    let last = -1;
    const update = () => {
      const snapshot = Math.round(state.current.progress * 1000) / 1000;
      if (snapshot !== last) { last = snapshot; onProgress(snapshot); }
    };
    gsap.ticker.add(update);
    return () => { trigger.kill(); gsap.ticker.remove(update); };
  }, [state, onProgress]);
  return null;
}
