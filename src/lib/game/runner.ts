// Logical pixels and seconds. Neither DPR nor CSS sizing changes the physics.
export const GAME_HEIGHT = 320;
export const GROUND = 260;
export const PLAYER_X = 96;
export const GRAVITY = 1900;
export const JUMP_VELOCITY = -650;
export const BEST_KEY = "omid.runner.best.v1";

export type Phase = "ready" | "running" | "paused" | "hit" | "over";
export type Obstacle = { id: number; type: "error" | "deadline"; x: number; width: number; passed: boolean };
export type RunnerState = {
  phase: Phase; width: number; time: number; distance: number; score: number;
  speed: number; y: number; vy: number; slide: boolean; slidePose: number;
  inputs: Set<string>; obstacles: Obstacle[]; nextIn: number; nextId: number;
  lastType: Obstacle["type"] | null; streak: number; hitTime: number;
  hitType: Obstacle["type"] | null; landTime: number; cleared: number;
};

export function createRunner(width = 800): RunnerState {
  return {
    phase: "ready", width, time: 0, distance: 0, score: 0, speed: 190,
    y: 0, vy: 0, slide: false, slidePose: 0, inputs: new Set(), obstacles: [],
    nextIn: 130, nextId: 0, lastType: null, streak: 0, hitTime: 0,
    hitType: null, landTime: 0, cleared: 0,
  };
}

export function startRunner(game: RunnerState) {
  const width = game.width;
  Object.assign(game, createRunner(width), { phase: "running" });
}

export function clearInput(game: RunnerState) {
  game.inputs.clear();
  game.slide = false;
}

export function pauseRunner(game: RunnerState) {
  clearInput(game);
  if (game.phase === "running") game.phase = "paused";
}

export function jump(game: RunnerState) {
  if (game.phase !== "running" || game.y < -0.01 || game.vy !== 0 || game.inputs.size > 0) return;
  game.vy = JUMP_VELOCITY;
  game.slide = false;
}

export function setSlide(game: RunnerState, source: string, held: boolean) {
  if (!held) game.inputs.delete(source);
  else if (game.phase === "running") game.inputs.add(source);
  game.slide = game.phase === "running" && game.y >= -0.01 && game.inputs.size > 0;
}

type Rect = { x: number; y: number; width: number; height: number };

export function playerBounds(game: RunnerState): Rect {
  // Ears, tail, and whiskers are deliberately excluded from the forgiving box.
  return game.slide
    ? { x: PLAYER_X - 19, y: GROUND - 24, width: 63, height: 21 }
    : { x: PLAYER_X - 16, y: GROUND + game.y - 59, width: 38, height: 55 };
}

export function obstacleBounds(obstacle: Obstacle): Rect {
  return obstacle.type === "error"
    ? { x: obstacle.x + 4, y: GROUND - 43, width: obstacle.width - 8, height: 41 }
    // The visible suspended panel spans the full possible jump height. Its
    // 34-pixel floor gap fits the slide, and can never be jumped over.
    : { x: obstacle.x + 5, y: GROUND - 190, width: obstacle.width - 10, height: 154 };
}

function overlaps(a: Rect, b: Rect) {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}

function spawn(game: RunnerState, random: () => number) {
  const type = game.streak >= 2 ? (game.lastType === "error" ? "deadline" : "error") : random() < 0.5 ? "error" : "deadline";
  const width = type === "deadline" ? 124 : 58;
  game.streak = type === game.lastType ? game.streak + 1 : 1;
  game.lastType = type;
  game.obstacles.push({ id: game.nextId++, type, x: game.width + 20, width, passed: false });
  // At least 1.25 seconds of clear ground AFTER the prior panel's trailing
  // edge. This exceeds a full jump plus time to release/switch controls.
  const clearSeconds = Math.max(1.25, 1.75 - game.distance / 32000) + random() * 0.4;
  game.nextIn = width + game.speed * clearSeconds;
}

export function advanceRunner(game: RunnerState, elapsed: number, random = Math.random) {
  const dt = Math.max(0, Math.min(Number.isFinite(elapsed) ? elapsed : 0, 0.05));
  if (game.phase === "paused" || game.phase === "over") return;
  game.time += dt;
  if (game.phase === "ready") return;
  if (game.phase === "hit") {
    game.hitTime += dt;
    if (game.hitTime >= 0.42) game.phase = "over";
    return;
  }
  // Small substeps also keep hit detection reliable during dropped frames.
  const steps = Math.max(1, Math.ceil(dt / (1 / 120)));
  const step = dt / steps;
  for (let i = 0; i < steps && game.phase === "running"; i++) {
    game.speed = Math.min(320, 190 + game.distance * 0.007);
    const travel = game.speed * step;
    game.distance += travel;
    game.score = Math.floor(game.distance / 12);
    game.landTime = Math.max(0, game.landTime - step);
    if (game.y < 0 || game.vy < 0) {
      game.y += game.vy * step + GRAVITY * step * step / 2;
      game.vy += GRAVITY * step;
      if (game.y >= 0) { game.y = 0; game.vy = 0; game.landTime = 0.2; }
    }
    game.slide = game.y === 0 && game.inputs.size > 0;
    game.slidePose += ((game.slide ? 1 : 0) - game.slidePose) * (1 - Math.exp(-24 * step));
    game.nextIn -= travel;
    if (game.nextIn <= 0) spawn(game, random);
    const player = playerBounds(game);
    for (const obstacle of game.obstacles) {
      obstacle.x -= travel;
      if (overlaps(player, obstacleBounds(obstacle))) {
        game.phase = "hit";
        game.hitType = obstacle.type;
        clearInput(game);
        break;
      }
      if (!obstacle.passed && obstacle.x + obstacle.width < player.x) { obstacle.passed = true; game.cleared++; }
    }
    game.obstacles = game.obstacles.filter(obstacle => obstacle.x + obstacle.width > -30);
  }
}

export function readBest(): number {
  try {
    const saved = Number(localStorage.getItem(BEST_KEY));
    return Number.isFinite(saved) && saved > 0 ? Math.floor(saved) : 0;
  } catch { return 0; }
}

export function saveBest(value: number) {
  try { localStorage.setItem(BEST_KEY, String(value)); } catch { /* Storage may be disabled. The run still works. */ }
}
