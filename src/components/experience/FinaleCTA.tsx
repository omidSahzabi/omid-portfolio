import { portfolio } from "@/lib/portfolio";
import { finaleState } from "@/lib/experience/finaleTimeline";
import { Arrow } from "../Icons";

export function FinaleCTA({ progress, alwaysVisible = false }: { progress: number; alwaysVisible?: boolean }) {
  const opacity = alwaysVisible ? 1 : finaleState(progress).cta;
  const visible = opacity > 0.01;
  return <section className={`finale-cta ${alwaysVisible ? "is-static" : ""}`} aria-label="The next chapter" aria-hidden={!visible} inert={!visible} style={{ opacity, visibility: visible ? "visible" : "hidden", transform: alwaysVisible ? undefined : `translate(-50%, calc(-50% + ${(1 - opacity) * 18}px))` }}>
    <p className="eyebrow">BEYOND THE PORTAL</p><h2>What&apos;s next?</h2><p>Let&apos;s turn an idea into something real.</p>
    <a className="primary-button finale-button" href={portfolio.dreamServiceUrl} target="_blank" rel="noopener noreferrer">Enter DreamService <Arrow diagonal /></a>
  </section>;
}
