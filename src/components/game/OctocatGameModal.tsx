"use client";

import { useEffect, useRef } from "react";
import { CloseIcon } from "../Icons";
import { OctocatRunnerGame } from "./OctocatRunnerGame";
import styles from "./Runner.module.css";

export default function OctocatGameModal({ close, reducedMotion }: { close: () => void; reducedMotion: boolean }) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const element = dialog.current;
    const origin = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const x = window.scrollX, y = window.scrollY;
    const bodyStyle = document.body.style;
    const saved = { position: bodyStyle.position, top: bodyStyle.top, left: bodyStyle.left, width: bodyStyle.width, overflow: bodyStyle.overflow };
    // Fixed-body locking preserves iOS scroll as well as desktop wheel input.
    bodyStyle.position = "fixed"; bodyStyle.top = `${-y}px`; bodyStyle.left = `${-x}px`; bodyStyle.width = "100%"; bodyStyle.overflow = "hidden";
    element?.showModal();
    element?.querySelector<HTMLButtonElement>("[data-runner-start]")?.focus({ preventScroll: true });
    return () => {
      if (element?.open) element.close();
      Object.assign(bodyStyle, saved);
      window.scrollTo({ left: x, top: y, behavior: "instant" });
      const returnTarget = origin?.isConnected ? origin : document.querySelector<HTMLButtonElement>("[data-entertain-octocat]");
      returnTarget?.focus({ preventScroll: true });
    };
  }, []);
  return <dialog ref={dialog} className={styles.modal} aria-labelledby="octocat-game-title" aria-describedby="octocat-game-subtitle" onCancel={event => { event.preventDefault(); close(); }}>
    <header className={styles.header}>
      <div><p className={styles.kicker}>A LITTLE BREAK / A NEW HIGH SCORE</p><h2 id="octocat-game-title">Octocat vs. Developer Life</h2><p id="octocat-game-subtitle">Jump over errors. Slide under deadlines.</p></div>
      <button className={`icon-button ${styles.close}`} aria-label="Close mini-game" onClick={close}><CloseIcon /></button>
    </header>
    <OctocatRunnerGame close={close} reducedMotion={reducedMotion} />
    <footer className={styles.footer}><span>Our original portfolio cat, on a coffee break.</span><span>Esc to close</span></footer>
  </dialog>;
}
