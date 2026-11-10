"use client";

import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { advanceRunner, clearInput, createRunner, GAME_HEIGHT, jump, pauseRunner, readBest, saveBest, setSlide, startRunner, type Phase } from "@/lib/game/runner";
import { drawRunner } from "@/lib/game/runnerDrawing";
import styles from "./Runner.module.css";

type Hud = { phase: Phase; score: number; best: number };
type Actions = { start: () => void; jump: () => void; slide: (source: string, held: boolean) => void; release: () => void; pause: () => void; resume: () => void };

export function OctocatRunnerGame({ close, reducedMotion }: { close: () => void; reducedMotion: boolean }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const wrap = useRef<HTMLDivElement>(null);
  const start = useRef<HTMLButtonElement>(null);
  const actions = useRef<Actions | null>(null);
  const reduced = useRef(reducedMotion);
  const [hud, setHud] = useState<Hud>({ phase: "ready", score: 0, best: 0 });
  const [pressed, setPressed] = useState({ jump: false, slide: false });
  const [unavailable, setUnavailable] = useState(false);
  useEffect(() => { reduced.current = reducedMotion; }, [reducedMotion]);
  useEffect(() => {
    const element = canvas.current, host = wrap.current;
    if (!element || !host) return;
    const ctx = element.getContext("2d");
    if (!ctx) { const failed = requestAnimationFrame(() => setUnavailable(true)); return () => cancelAnimationFrame(failed); }
    const game = createRunner();
    let best = readBest(), savedBest = best;
    let frame = 0, lastTime = 0, lastHud = -1;
    let lastPhase: Phase = "ready", disposed = false;
    const publish = () => {
      best = Math.max(best, game.score);
      setHud(previous => previous.phase === game.phase && previous.score === game.score && previous.best === best ? previous : { phase: game.phase, score: game.score, best });
    };
    const resetPressed = () => setPressed({ jump: false, slide: false });
    const pause = () => { pauseRunner(game); resetPressed(); publish(); };
    actions.current = {
      start: () => { startRunner(game); lastTime = 0; resetPressed(); publish(); element.focus({ preventScroll: true }); },
      jump: () => jump(game),
      slide: (source, held) => { setSlide(game, source, held); },
      release: () => { clearInput(game); resetPressed(); },
      pause,
      resume: () => { if (game.phase === "paused") { clearInput(game); game.phase = "running"; lastTime = 0; publish(); element.focus({ preventScroll: true }); } },
    };
    if (new URLSearchParams(window.location.search).get("inspect") === "1") {
      Object.defineProperty(element, "runnerSnapshot", { configurable: true, value: () => ({
        phase: game.phase, y: game.y, vy: game.vy, slide: game.slide,
        width: game.width, speed: game.speed, score: game.score,
        inputs: [...game.inputs], obstacles: game.obstacles.map(item => ({ ...item })),
      }) });
    }
    const resize = () => {
      const cssWidth = host.getBoundingClientRect().width;
      if (cssWidth <= 0) return;
      const width = Math.max(480, Math.min(960, cssWidth * 1.45));
      // Preserve each obstacle's time-to-contact during orientation changes.
      game.width = width;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      element.width = Math.round(width * dpr); element.height = Math.round(GAME_HEIGHT * dpr);
      element.style.aspectRatio = `${width} / ${GAME_HEIGHT}`;
      ctx.setTransform(element.width / width, 0, 0, element.height / GAME_HEIGHT, 0, 0);
      drawRunner(ctx, game, reduced.current);
    };
    const observer = new ResizeObserver(resize);
    observer.observe(host); resize();
    const visibility = () => { if (document.hidden) pause(); lastTime = 0; };
    const blur = () => { pause(); lastTime = 0; };
    document.addEventListener("visibilitychange", visibility);
    window.addEventListener("blur", blur);
    function tick(now: number) {
      if (disposed) return;
      const dt = lastTime ? Math.min((now - lastTime) / 1000, 0.05) : 0;
      lastTime = now;
      advanceRunner(game, dt);
      drawRunner(ctx!, game, reduced.current);
      if (game.phase !== lastPhase || now - lastHud >= 100) {
        if (game.phase !== lastPhase) resetPressed();
        publish(); lastHud = now; lastPhase = game.phase;
      }
      if ((game.phase === "hit" || game.phase === "over") && best > savedBest) { saveBest(best); savedBest = best; }
      frame = requestAnimationFrame(tick);
    }
    frame = requestAnimationFrame(tick);
    return () => {
      disposed = true; cancelAnimationFrame(frame); observer.disconnect();
      document.removeEventListener("visibilitychange", visibility); window.removeEventListener("blur", blur);
      clearInput(game); actions.current = null;
      Reflect.deleteProperty(element, "runnerSnapshot");
      if (game.score > savedBest) saveBest(game.score);
    };
  }, []);
  useEffect(() => {
    if (hud.phase === "ready" || hud.phase === "paused" || hud.phase === "over") start.current?.focus({ preventScroll: true });
  }, [hud.phase]);

  function keyDown(event: KeyboardEvent<HTMLCanvasElement>) {
    if (hud.phase !== "running" || document.activeElement !== event.currentTarget) return;
    if (event.code === "Space") { event.preventDefault(); if (!event.repeat) actions.current?.jump(); }
    if ((event.code === "Tab" && !event.shiftKey) || event.code === "ArrowDown") { event.preventDefault(); actions.current?.slide(event.code, true); }
  }
  function keyUp(event: KeyboardEvent<HTMLCanvasElement>) {
    if (event.code === "Tab" || event.code === "ArrowDown") actions.current?.slide(event.code, false);
  }
  function pressSlide(event: PointerEvent<HTMLButtonElement>) {
    if (hud.phase !== "running" || (event.pointerType === "mouse" && event.button !== 0)) return;
    event.preventDefault(); event.currentTarget.setPointerCapture(event.pointerId);
    actions.current?.slide(`pointer:${event.pointerId}`, true);
    setPressed(value => ({ ...value, slide: true }));
  }
  function releaseSlide(event: PointerEvent<HTMLButtonElement>) {
    actions.current?.slide(`pointer:${event.pointerId}`, false);
    setPressed(value => ({ ...value, slide: false }));
  }
  function slideKey(event: KeyboardEvent<HTMLButtonElement>, held: boolean) {
    if (event.code !== "Space" && event.code !== "Enter") return;
    event.preventDefault(); actions.current?.slide(`button:${event.code}`, held);
    setPressed(value => ({ ...value, slide: held && hud.phase === "running" }));
  }
  const playing = hud.phase === "running";
  const overlay = hud.phase === "ready" || hud.phase === "paused" || hud.phase === "over";
  return <div className={styles.game}>
    <div className={styles.hud}>
      <div><span>SCORE</span><strong aria-label={`Score ${hud.score}`}>{String(hud.score).padStart(5, "0")}</strong></div>
      <div><span>BEST</span><strong aria-label={`Best ${hud.best}`}>{String(hud.best).padStart(5, "0")}</strong></div>
      <button className={styles.pause} disabled={!playing && hud.phase !== "paused"} onPointerDown={event => event.preventDefault()} onClick={() => playing ? actions.current?.pause() : actions.current?.resume()}>{hud.phase === "paused" ? "Resume" : "Pause"}<span aria-hidden="true"> {hud.phase === "paused" ? "▷" : "Ⅱ"}</span></button>
    </div>
    <div ref={wrap} className={styles.stage}>
      <canvas ref={canvas} className={styles.canvas} tabIndex={0} role="application" aria-label="Developer Life runner game. Space jumps; hold Tab or Arrow Down to slide. Shift Tab leaves the game surface. Escape closes the dialog." aria-describedby="runner-help" onKeyDown={keyDown} onKeyUp={keyUp} onBlur={event => {
        actions.current?.release();
        if (!event.relatedTarget || !(event.relatedTarget instanceof HTMLElement) || !event.relatedTarget.closest(`.${styles.controls}`)) actions.current?.pause();
      }} />
      {unavailable ? <div className={styles.overlay}><h3>Canvas is unavailable</h3><p>Your browser could not open the mini-game.</p><button className="primary-button" onClick={close}>Close</button></div> : overlay && <div className={styles.overlay}>
        <span className={styles.overlayKicker}>{hud.phase === "ready" ? "COFFEE BREAK, COMPILED." : hud.phase === "paused" ? "TAKE YOUR TIME" : "RUN COMPLETE"}</span>
        <h3>{hud.phase === "ready" ? "A little less work. A little more play." : hud.phase === "paused" ? "On a quick break." : "GAME OVER"}</h3>
        <p>{hud.phase === "ready" ? "Jump over ERROR. Hold SLIDE beneath DEADLINE." : hud.phase === "paused" ? "Your run is right where you left it." : "Even great developers hit errors."}</p>
        {hud.phase === "over" && <p className={styles.result}>SCORE {hud.score} <span> / </span> BEST {hud.best}</p>}
        <div className={styles.overlayActions}><button ref={start} data-runner-start className="primary-button" onClick={() => hud.phase === "paused" ? actions.current?.resume() : actions.current?.start()}>{hud.phase === "ready" ? "Start Game" : hud.phase === "paused" ? "Resume Game" : "Try Again"}<span aria-hidden="true">↗</span></button>{hud.phase === "over" && <button className="text-button" onClick={close}>Close</button>}</div>
      </div>}
    </div>
    <div className={styles.controls} aria-label="Game controls">
      <button className={`${styles.control} ${pressed.slide ? styles.pressed : ""}`} disabled={!playing} aria-label="Slide, press and hold" aria-describedby="runner-help" onPointerDown={pressSlide} onPointerUp={releaseSlide} onPointerCancel={releaseSlide} onLostPointerCapture={releaseSlide} onKeyDown={event => slideKey(event, true)} onKeyUp={event => slideKey(event, false)} onBlur={() => { actions.current?.release(); setPressed({ slide: false, jump: false }); }}><span aria-hidden="true">↓</span> SLIDE <small>HOLD</small></button>
      <p id="runner-help" className={styles.help}><span>SPACE to jump · TAB / ↓ to slide</span><span>Shift + Tab to leave the game · Esc to close</span><span className={styles.touchHelp}>Hold SLIDE. Tap JUMP. You&apos;ve got this.</span></p>
      <button className={`${styles.control} ${pressed.jump ? styles.pressed : ""}`} disabled={!playing} aria-label="Jump" onPointerDown={event => {
        if (!playing || (event.pointerType === "mouse" && event.button !== 0)) return;
        event.preventDefault(); event.currentTarget.setPointerCapture(event.pointerId); actions.current?.jump(); setPressed(value => ({ ...value, jump: true }));
      }} onPointerUp={() => setPressed(value => ({ ...value, jump: false }))} onPointerCancel={() => setPressed(value => ({ ...value, jump: false }))} onLostPointerCapture={() => setPressed(value => ({ ...value, jump: false }))} onKeyDown={event => { if (event.repeat && (event.code === "Space" || event.code === "Enter")) event.preventDefault(); }} onClick={event => { if (event.detail === 0) actions.current?.jump(); }}><span aria-hidden="true">↑</span> JUMP <small>TAP</small></button>
    </div>
    <p className={styles.live} role="status" aria-live="polite">{hud.phase === "over" ? `Game over. Score ${hud.score}. Best ${hud.best}.` : hud.phase === "paused" ? "Game paused." : ""}</p>
    {reducedMotion && <p className={styles.motionNote}>Reduced motion: ambient effects are off. Gameplay begins only when you start.</p>}
  </div>;
}
