import { useEffect, useRef } from "react";
import gsap from "gsap";
import { chapters, smoothRange } from "@/lib/experience/narrativeTimeline";
import { projectAt, projectWork } from "@/lib/portfolio";
import type { SignSelection } from "../SignReader";
import { Arrow } from "../Icons";
import { scrollToProgress } from "./ScrollController";
import { EntertainOctocatButton } from "../game/EntertainOctocatButton";
import gameStyles from "../game/Runner.module.css";

export function NarrativeOverlay({ chapter, progress, readSign, reducedMotion, onPlay }: { chapter: number; progress: number; readSign: (selection: SignSelection) => void; reducedMotion: boolean; onPlay: () => void }) {
  const root = useRef<HTMLDivElement>(null);
  const storyChapter = Math.min(4, chapter);
  useEffect(() => {
    if (reducedMotion) return;
    const context = gsap.context(() => {
      gsap.fromTo(".narrative-copy.is-active > *", { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.65, stagger: 0.07, ease: "power2.out", clearProps: "transform" });
    }, root);
    return () => context.revert();
  }, [storyChapter, reducedMotion]);
  const portalOpacity = 1 - smoothRange(1, 1.075, progress);
  const project = projectAt(progress);
  return <div ref={root} className="narrative-stage" id="story-content" tabIndex={-1}>
    {chapters.map((item, index) => {
      const active = index === storyChapter && (index !== 4 || portalOpacity > 0.01);
      return <section key={item.id} className={`narrative-copy ${active ? "is-active" : ""}`} style={index === 4 ? { opacity: active ? portalOpacity : 0 } : undefined} aria-hidden={!active} inert={!active} aria-label={item.label}>
        <p className="eyebrow narrative-eyebrow"><span className="small-line" />{item.eyebrow}</p>
        {index === 0 ? <h1>Hey, I’m<br /><span>Omid<span className="title-period">.</span></span></h1> : <h2>{item.title.split("\n").map((line, i) => <span key={line} className={i === 1 ? "purple-line" : ""}>{line}{i === 0 && <br />}</span>)}</h2>}
        <p className="narrative-subtitle">{item.subtitle}</p><p className="narrative-detail">{item.detail}</p>
        {index === 0 && <div className="narrative-actions"><button className="primary-button" onClick={() => scrollToProgress(0.17, reducedMotion)}>Follow the thread <Arrow /></button><button className="text-button" aria-haspopup="dialog" onClick={() => readSign("contact")}>Read contact board <span aria-hidden="true">+</span></button></div>}
        {index === 0 && <div className={gameStyles.entryRow}><EntertainOctocatButton onClick={onPlay} /></div>}
        {index === 1 && <div className="narrative-actions sign-context"><span className="sign-context-label">ON DISPLAY / {String(project + 1).padStart(2, "0")}</span><button className="text-button" aria-haspopup="dialog" onClick={() => readSign(project)}>Read sign: {projectWork[project].title} <span aria-hidden="true">+</span></button></div>}
        {index === 2 && <p className="narrative-experience">~4 years in software · Freelance experience · Iziran, ~2 years and counting</p>}
        {index === 4 && <p className="portal-entry-hint">THE CAT GOES FIRST. KEEP SCROLLING.</p>}
      </section>;
    })}
  </div>;
}

