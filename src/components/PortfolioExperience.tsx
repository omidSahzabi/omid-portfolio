"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { chapterAt, chapters, createNarrativeState, finaleChapter, smoothRange } from "@/lib/experience/narrativeTimeline";
import { TIMELINE_END } from "@/lib/experience/finaleTimeline";
import { Arrow, CloseIcon, ThreadIcon } from "./Icons";
import { AnimatedSkills } from "./AnimatedSkills";
import { AccessibleJourney } from "./AccessibleJourney";
import { SignReader, type SignSelection } from "./SignReader";
import { NarrativeOverlay } from "./experience/NarrativeOverlay";
import { FinaleCTA } from "./experience/FinaleCTA";
import { ScrollController, scrollToProgress } from "./experience/ScrollController";

const ExperienceCanvas = dynamic(() => import("./experience/ExperienceCanvas"), { ssr: false });
const OctocatGameModal = dynamic(() => import("./game/OctocatGameModal"), { ssr: false });
const subscribeMounted = () => () => {};
const mountedSnapshot = () => true;
const serverSnapshot = () => false;
const motionSnapshot = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const subscribeMotion = (callback: () => void) => {
  const query = window.matchMedia("(prefers-reduced-motion: reduce)");
  query.addEventListener("change", callback);
  return () => query.removeEventListener("change", callback);
};

export function PortfolioExperience() {
  const mounted = useSyncExternalStore(subscribeMounted, mountedSnapshot, serverSnapshot);
  const reducedMotion = useSyncExternalStore(subscribeMotion, motionSnapshot, serverSnapshot);
  const state = useRef(createNarrativeState());
  const [progress, setProgress] = useState(0);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [characterFailed, setCharacterFailed] = useState(false);
  const [simpleView, setSimpleView] = useState(false);
  const [sign, setSign] = useState<SignSelection | null>(null);
  const [journeyInfo, setJourneyInfo] = useState(false);
  const [gameOpen, setGameOpen] = useState(false);
  const chapter = chapterAt(progress);
  const chapterMeta = chapter === 5 ? finaleChapter : chapters[chapter];
  const fallback = reducedMotion || failed || simpleView;
  const onReady = useCallback(() => setReady(true), []);
  const onFailure = useCallback(() => setFailed(true), []);
  const onCharacterFailure = useCallback(() => setCharacterFailed(true), []);
  const onProgress = useCallback((value: number) => setProgress(value), []);
  const readSign = useCallback((selection: SignSelection) => setSign(selection), []);
  const closeSign = useCallback(() => setSign(null), []);
  const openGame = useCallback(() => { state.current.paused = true; setGameOpen(true); }, []);
  const closeGame = useCallback(() => setGameOpen(false), []);

  useEffect(() => {
    state.current.reducedMotion = reducedMotion;
    state.current.paused = sign !== null || journeyInfo || fallback || gameOpen;
  }, [sign, reducedMotion, state, journeyInfo, fallback, gameOpen]);
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("webgl") === "off") queueMicrotask(() => setFailed(true));
  }, []);

  function returnToJourney() {
    setSimpleView(false);
    window.scrollTo({ top: 0, behavior: "instant" });
    state.current.progress = 0;
    state.current.target = 0;
    setProgress(0);
  }

  return <>
    <a className="skip-link" href={fallback ? "#journey-beginning" : "#story-content"}>Skip to the story</a>
    <header className="site-header">
      <a className="wordmark" href="#journey-beginning" aria-label="Omid Sahzabi home" onClick={event => { event.preventDefault(); if (fallback) window.scrollTo({ top: 0, behavior: reducedMotion ? "instant" : "smooth" }); else scrollToProgress(0, reducedMotion); }}><Image className="brand-logo" src="/images/logo.png" alt="Omid — Personal Portfolio" width={2172} height={724} sizes="(max-width: 767px) 156px, 216px" loading="eager" fetchPriority="high" /></a>
      <AnimatedSkills reducedMotion={reducedMotion} />
    </header>

    {fallback ? <>
      <AccessibleJourney onPlay={openGame} reason={reducedMotion ? "Following your reduced-motion preference." : failed ? "The 3D experience is unavailable. The same journey is readable below." : "The same story, with motion turned off."} />
      {!reducedMotion && !failed && <button className="return-to-journey text-button" onClick={returnToJourney}>Return to the 3D journey <Arrow /></button>}
    </> : <>
      <ScrollController state={state} onProgress={onProgress} />
      <main id="story-track" className="story-track" aria-label="A continuous cinematic portfolio">
        <div className="experience-viewport">
          <div className="canvas-wrap">{mounted && <ExperienceCanvas state={state} onReady={onReady} onFailure={onFailure} onCharacterFailure={onCharacterFailure} />}</div>
          <div className="scene-vignette" style={{ opacity: 1 - smoothRange(1, 1.17, progress) }} />
          <div className="experience-topline"><span className="story-badge"><span className="status-dot" />A PORTFOLIO IN ONE JOURNEY</span><span className="experience-edition">DESIGNED TO BE EXPLORED</span></div>
          <div className={`world-caption${chapter === 1 ? " is-gallery" : ""}`}><span className="caption-cross">+</span><span>{String(chapter).padStart(2, "0")}<span className="caption-divider">/</span>{chapterMeta.place}</span></div>
          <NarrativeOverlay chapter={chapter} progress={progress} readSign={readSign} reducedMotion={reducedMotion} onPlay={openGame} />
          <FinaleCTA progress={progress} />
          <div className="scene-footnote" style={{ opacity: 1 - smoothRange(1, 1.12, progress) }}><ThreadIcon /><span>Interfaces. APIs. Data.<br /><strong>One connected application.</strong></span></div>
          {!ready && <div className="loading-state" role="status"><span className="loading-ring" />Setting the scene<span className="loading-sub">Your journey is almost ready.</span></div>}
          <div className="scroll-prompt"><span className="scroll-mouse"><span /></span><span>{progress >= 1.3 ? "THE NEXT CHAPTER IS YOURS" : progress >= 0.98 ? "KEEP SCROLLING / BEYOND THE PORTAL" : "SCROLL TO UNRAVEL"}</span><span className="scroll-prompt-line" /></div>
        </div>
      </main>
      <footer className="experience-footer">
        <div className="chapter-progress"><span className="current-chapter">{String(chapter).padStart(2, "0")}</span><span className="progress-divider">/ 05</span><div className="progress-track"><span style={{ transform: `scaleX(${Math.min(1, progress / TIMELINE_END)})` }} /></div></div>
        <nav className="chapter-nav" aria-label="Story chapters">{[...chapters, finaleChapter].map((item, i) => <button key={item.label} className={i === chapter ? "active" : ""} aria-current={i === chapter ? "step" : undefined} onClick={() => scrollToProgress(item.progress, reducedMotion)}><span className="chapter-dot" />{item.label}</button>)}</nav>
        <button className="journey-info-button" onClick={() => setJourneyInfo(true)} aria-label="About this journey">i</button>
        <button className="motion-button" onClick={() => { setSimpleView(true); window.scrollTo({ top: 0, behavior: "instant" }); }}><span className="motion-symbol">Ⅱ</span><span>Motion off</span></button>
      </footer>
    </>}

    <noscript><style>{".story-track,.experience-footer{display:none}"}</style><AccessibleJourney reason="The same journey, without JavaScript." /></noscript>
    {sign !== null && <SignReader selection={sign} close={closeSign} />}
    {journeyInfo && <JourneyInfo close={() => setJourneyInfo(false)} characterFailed={characterFailed} />}
    {gameOpen && <OctocatGameModal close={closeGame} reducedMotion={reducedMotion} />}
  </>;
}

function JourneyInfo({ close, characterFailed }: { close: () => void; characterFailed: boolean }) {
  const ref = useMemo(() => ({ current: null as HTMLDialogElement | null }), []);
  useEffect(() => {
    ref.current?.showModal();
    const element = ref.current;
    return () => { if (element?.open) element.close(); };
  }, [ref]);
  return <dialog className="info-dialog" ref={ref} aria-labelledby="journey-title" onCancel={close} onClick={event => { if (event.target === event.currentTarget) close(); }}>
    <div className="info-dialog-content"><button className="icon-button" onClick={close} aria-label="Close journey information"><CloseIcon /></button>
      <p className="eyebrow">A LITTLE CONTEXT</p><h2 id="journey-title">One world. The whole story.</h2>
      <p>The entrance contact board and the dining room’s hanging signs are part of the world. Use “Read sign” for a closer, accessible view. Live projects open only when you choose their links.</p>
      <p>Follow the cat through interfaces, backend logic, and data. Once it disappears, keep scrolling to turn toward the portal. Scrolling back reverses the reveal.</p>
      <div className="asset-note"><h3>An original character</h3><p>The guide is a custom animated 3D cat, not an official GitHub asset.</p>{characterFailed && <p>The optional external model couldn’t load, so the original mascot is shown.</p>}<small>Independent portfolio. No affiliation with or endorsement by GitHub.</small></div>
      <button className="primary-button" onClick={close}>Back to the journey <Arrow /></button>
    </div>
  </dialog>;
}

