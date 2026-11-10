export const chapters = [
  { id: "intro", label: "Meet Omid", place: "Meet your guide", eyebrow: "Full-Stack Developer & Product-Minded Engineer", title: "Hey, I’m Omid.", subtitle: "I build web applications that make complex things simple.", detail: "From the interface to the API and database.", progress: 0 },
  { id: "restaurant", label: "Frontend", place: "Dining room", eyebrow: "01 / FRONTEND", title: "I build interfaces\npeople enjoy using.", subtitle: "From responsive layouts to interactive experiences, I turn ideas into clean, intuitive interfaces.", detail: "React · Next.js · TypeScript · JavaScript · Tailwind CSS", progress: 0.26 },
  { id: "kitchen", label: "Backend", place: "Kitchen", eyebrow: "02 / BACKEND", title: "I build the logic\nthat makes everything work.", subtitle: "APIs, business logic, and operational workflows — I connect the moving parts into reliable applications.", detail: "Node.js · Express.js · REST APIs", progress: 0.51 },
  { id: "storage", label: "Database", place: "Storage", eyebrow: "03 / DATABASE", title: "I organize data\nso systems can grow.", subtitle: "I design and work with structured data, connecting applications to the information they need.", detail: "PostgreSQL · MongoDB · Data Modeling", progress: 0.74 },
  { id: "portal", label: "Product thinking", place: "The bigger picture", eyebrow: "04 / THE BIGGER PICTURE", title: "I solve problems,\nnot just coding tasks.", subtitle: "I turn real-world processes into practical digital products — from understanding the problem to building the solution.", detail: "Let’s build something useful.", progress: 1 },
] as const;

export function clampProgress(value: number) {
  return Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 0;
}

export function chapterAt(progress: number) {
  if (progress > 1) return 5;
  const p = clampProgress(progress);
  if (p < 0.15) return 0;
  if (p < 0.4) return 1;
  if (p < 0.64) return 2;
  if (p < 0.87) return 3;
  return 4;
}

export const finaleChapter = { label: "What’s next", place: "The next chapter", progress: 1.32 } as const;

export function smoothRange(from: number, to: number, value: number) {
  const t = clampProgress((value - from) / (to - from));
  return t * t * (3 - 2 * t);
}

export type TravelDirection = 1 | -1;
export type NarrativeState = {
  target: number;
  progress: number;
  direction: TravelDirection;
  speed: number;
  moving: boolean;
  clock: number;
  reducedMotion: boolean;
  paused: boolean;
};

export function createNarrativeState(): NarrativeState {
  return { target: 0, progress: 0, direction: 1, speed: 0, moving: false, clock: 0, reducedMotion: false, paused: false };
}

export function advanceNarrative(state: NarrativeState, delta: number) {
  if (state.paused) { state.moving = false; state.speed = 0; return; }
  const dt = Math.min(delta, 0.05);
  const previous = state.progress;
  const difference = state.target - previous;
  if (Math.abs(difference) > 0.0005) state.direction = difference > 0 ? 1 : -1;
  state.progress = state.reducedMotion ? state.target : previous + difference * (1 - Math.exp(-9 * dt));
  if (Math.abs(state.target - state.progress) < 0.00002) state.progress = state.target;
  state.speed = Math.abs(state.progress - previous) / Math.max(dt, 0.0001);
  state.moving = state.speed > 0.0015;
  // Locomotion always advances in real time, including on reverse travel.
  state.clock += dt;
}
