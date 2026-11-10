import { GAME_HEIGHT, GROUND, PLAYER_X, type RunnerState, type Obstacle } from "./runner";

type Context = CanvasRenderingContext2D;
function round(ctx: Context, x: number, y: number, w: number, h: number, radius: number, fill: string, stroke?: string) {
  ctx.beginPath(); ctx.roundRect(x, y, w, h, radius); ctx.fillStyle = fill; ctx.fill();
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 1; ctx.stroke(); }
}
function ellipse(ctx: Context, x: number, y: number, rx: number, ry: number, fill: string | CanvasGradient) {
  ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); ctx.fillStyle = fill; ctx.fill();
}
function line(ctx: Context, points: number[], color: string, width = 1) {
  ctx.beginPath(); ctx.moveTo(points[0], points[1]);
  for (let i = 2; i < points.length; i += 2) ctx.lineTo(points[i], points[i + 1]);
  ctx.strokeStyle = color; ctx.lineWidth = width; ctx.stroke();
}

function drawCat(ctx: Context, game: RunnerState, reduced: boolean) {
  const running = game.phase === "running" && game.y === 0;
  const gait = running ? game.distance * 0.11 : 0;
  const bounce = reduced ? 0 : running ? Math.abs(Math.sin(gait)) * 2 : Math.sin(game.time * 2) * 0.7;
  ellipse(ctx, PLAYER_X + 2, GROUND + 3, 33 - Math.min(12, -game.y * 0.1), 5, "#08050da8");
  ctx.save(); ctx.translate(PLAYER_X, GROUND + game.y - bounce);
  if (game.phase === "hit" && !reduced) { ctx.translate(-game.hitTime * 8, 0); ctx.rotate(-Math.sin(game.hitTime * 15) * 0.07); }
  ctx.translate(game.slidePose * 11, 0);
  ctx.scale(1 + game.slidePose * 0.32, 1 - game.slidePose * 0.64);
  // Curled appendage, lilac toe pads, collar gem, and forehead diamond echo
  // OriginalCatCharacter. The connected silhouette is drawn back to front.
  ctx.lineCap = "round";
  ctx.beginPath(); ctx.moveTo(-12, -15); ctx.bezierCurveTo(-45, -12, -47, -38, -34, -43); ctx.bezierCurveTo(-21, -48, -17, -32, -29, -32);
  ctx.strokeStyle = "#76518c"; ctx.lineWidth = 7; ctx.stroke();
  const step = Math.sin(gait) * 6;
  ellipse(ctx, -9 - step * 0.3, -5 - Math.max(0, step), 9, 5, "#604476");
  ellipse(ctx, 12 + step * 0.3, -5 - Math.max(0, -step), 10, 5, "#8b64a4");
  const coat = ctx.createLinearGradient(-20, -50, 24, -3);
  coat.addColorStop(0, "#593c70"); coat.addColorStop(1, "#2c1b3c");
  ellipse(ctx, 0, -25, 19, 23, coat);
  ellipse(ctx, 5, -22, 10, 13, "#725087");
  round(ctx, -15, -30 + step * 0.4, 9, 20, 5, "#49305e");
  round(ctx, 12, -29 - step * 0.4, 9, 20, 5, "#8b65a2");
  for (let i = 0; i < 3; i++) ellipse(ctx, 14 + i * 2, -12 - step * 0.4, 1, 1.6, "#c6a7df");
  round(ctx, -15, -43, 33, 4, 2, "#9d6ee9");
  ctx.beginPath(); ctx.moveTo(2, -43); ctx.lineTo(6, -38); ctx.lineTo(2, -33); ctx.lineTo(-2, -38); ctx.closePath(); ctx.fillStyle = "#c4b5fd"; ctx.fill();
  ctx.beginPath();
  ctx.moveTo(-24, -59); ctx.lineTo(-23, -82); ctx.quadraticCurveTo(-22, -86, -18, -82); ctx.lineTo(-7, -70);
  ctx.quadraticCurveTo(2, -74, 12, -69); ctx.lineTo(23, -82); ctx.quadraticCurveTo(26, -85, 27, -80); ctx.lineTo(29, -57);
  ctx.bezierCurveTo(31, -39, 17, -35, 2, -35); ctx.bezierCurveTo(-16, -35, -26, -42, -24, -59);
  ctx.fillStyle = coat; ctx.fill(); ctx.strokeStyle = "#8a62a45c"; ctx.lineWidth = 1.2; ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-20, -78); ctx.lineTo(-19, -64); ctx.lineTo(-10, -67); ctx.closePath(); ctx.fillStyle = "#b484cc"; ctx.fill();
  ctx.beginPath(); ctx.moveTo(23, -78); ctx.lineTo(14, -67); ctx.lineTo(24, -64); ctx.closePath(); ctx.fill();
  const blink = game.phase === "hit" ? 0.2 : Math.sin(game.time * 1.5) > 0.992 ? 0.12 : 1;
  for (const x of [-9, 14]) {
    ellipse(ctx, x, -55, 8.5, 10 * blink, "#d6c4f5");
    if (game.phase === "hit") {
      line(ctx, [x - 4, -59, x + 4, -51], "#31203f", 2); line(ctx, [x + 4, -59, x - 4, -51], "#31203f", 2);
    } else {
      ellipse(ctx, x + 2.5, -54, 3.5, 6.5 * blink, "#160f22");
      if (blink > 0.5) ellipse(ctx, x + 1.5, -57, 1.4, 2, "#fff3ff");
    }
  }
  ellipse(ctx, 3, -43, 9, 4.5, "#aa80bc");
  ctx.beginPath(); ctx.moveTo(0, -47); ctx.lineTo(7, -47); ctx.lineTo(3.5, -43); ctx.closePath(); ctx.fillStyle = "#352040"; ctx.fill();
  line(ctx, [3.5, -43, 3.5, -41, 0, -40], "#352040");
  line(ctx, [3.5, -41, 7, -40], "#352040");
  for (const side of [-1, 1]) for (let i = 0; i < 2; i++) line(ctx, [side < 0 ? -15 : 20, -45 + i * 4, side < 0 ? -29 : 33, -47 + i * 7], "#b38ac6", 0.8);
  ctx.beginPath(); ctx.moveTo(2, -70); ctx.lineTo(5, -66); ctx.lineTo(2, -62); ctx.lineTo(-1, -66); ctx.closePath(); ctx.fillStyle = "#aa7af0"; ctx.fill();
  if (game.phase === "hit") {
    ctx.font = "700 16px Manrope, sans-serif"; ctx.fillStyle = "#edb7ef"; ctx.textAlign = "center";
    ctx.fillText(game.hitType === "error" ? "404" : "!", 1, -98);
  }
  ctx.restore();
}

function drawObstacle(ctx: Context, obstacle: Obstacle, time: number, reduced: boolean) {
  const x = obstacle.x, w = obstacle.width;
  if (obstacle.type === "error") {
    round(ctx, x, GROUND - 46, w, 46, 4, "#2b1337", "#be5cbd");
    round(ctx, x + 3, GROUND - 43, w - 6, 3, 1, "#dc83cf");
    ctx.font = "800 14px Manrope, sans-serif"; ctx.textAlign = "center"; ctx.fillStyle = "#f0c2ed"; ctx.fillText("ERROR", x + w / 2, GROUND - 17);
    const glitch = reduced ? 0 : Math.sin(time * 18 + obstacle.id) > 0.8 ? 4 : 0;
    line(ctx, [x - glitch, GROUND - 7, x + 13, GROUND - 7], "#ae58b0", 2);
    line(ctx, [x + w - 15, GROUND - 34, x + w + glitch, GROUND - 34], "#ae58b0", 2);
  } else {
    // Solid mechanical panel = visible danger, with a clear floor-level gap.
    const top = GROUND - 194, bottom = GROUND - 34;
    const twitch = reduced ? 0 : Math.sin(time * 4 + obstacle.id) * 0.7;
    for (const dx of [12, w - 12]) {
      line(ctx, [x + dx, 16, x + dx, top], "#735088", 2);
      ellipse(ctx, x + dx, top + 10, 2.5, 2.5, "#b48fcb");
    }
    round(ctx, x, top + twitch, w, bottom - top, 5, "#20152f", "#8b5cb4");
    for (let y = top + 22; y < bottom - 45; y += 16) line(ctx, [x + 10, y, x + w - 10, y], "#3d2a51");
    round(ctx, x + 3, bottom - 40 + twitch, w - 6, 37, 3, "#3f2459", "#ae7cd2");
    ctx.font = "800 16px Manrope, sans-serif"; ctx.textAlign = "center"; ctx.fillStyle = "#e0c5f6"; ctx.fillText("DEADLINE", x + w / 2, bottom - 16 + twitch);
    line(ctx, [x + 4, bottom, x + w - 4, bottom], "#c39be8", 2);
    for (let dx = 10; dx < w - 8; dx += 16) line(ctx, [x + dx, bottom - 5, x + dx + 5, bottom - 10], "#9870b0", 2);
  }
}

export function drawRunner(ctx: Context, game: RunnerState, reduced: boolean) {
  const w = game.width, t = game.time, travel = reduced ? 0 : game.distance;
  ctx.clearRect(0, 0, w, GAME_HEIGHT);
  const sky = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT);
  sky.addColorStop(0, "#100b1c"); sky.addColorStop(1, "#1c102b");
  ctx.fillStyle = sky; ctx.fillRect(0, 0, w, GAME_HEIGHT);
  const glow = ctx.createRadialGradient(w * 0.6, 160, 10, w * 0.6, 160, w * 0.7);
  glow.addColorStop(0, "#6d28d918"); glow.addColorStop(1, "#6d28d900"); ctx.fillStyle = glow; ctx.fillRect(0, 0, w, GAME_HEIGHT);
  for (let i = 0; i < 16; i++) {
    const px = ((i * 113.7 - travel * 0.1) % (w + 50) + w + 50) % (w + 50);
    ellipse(ctx, px, 28 + (i * 43.1) % 170 + (reduced ? 0 : Math.sin(t + i) * 2), 1, 1, "#b18ad044");
  }
  for (let x = -100; x < w + 160; x += 110) {
    const left = x - travel * 0.18 % 110;
    round(ctx, left, 170, 78, 90, 6, "#241732", "#6f488125");
    for (let j = 0; j < 3; j++) line(ctx, [left + 13, 190 + j * 12, left + 52 - j * 8, 190 + j * 12], "#60417835", 3);
  }
  ctx.fillStyle = "#130c1e"; ctx.fillRect(0, GROUND, w, GAME_HEIGHT - GROUND);
  line(ctx, [0, GROUND + 1, w, GROUND + 1], "#8754b2", 1.5);
  for (let x = -40; x < w + 40; x += 36) {
    const left = x - travel % 36;
    line(ctx, [left, GROUND + 16, left + 13, GROUND + 16], "#593573", 2);
  }
  for (const obstacle of game.obstacles) drawObstacle(ctx, obstacle, t, reduced);
  if (!reduced && game.phase === "running" && game.y === 0) {
    for (let i = 0; i < 4; i++) {
      const life = (t * 2.8 + i * 0.25) % 1;
      ctx.globalAlpha = (1 - life) * 0.35;
      ellipse(ctx, PLAYER_X - 26 - life * 35, GROUND - 3 - life * 6, 1 + life * 2, 1.3, "#b187d1");
    }
    ctx.globalAlpha = 1;
  }
  if (!reduced && game.landTime > 0) {
    ctx.globalAlpha = game.landTime * 3;
    ctx.strokeStyle = "#c4a1e1"; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.ellipse(PLAYER_X, GROUND, 10 + (0.2 - game.landTime) * 140, 4, 0, 0, Math.PI * 2); ctx.stroke(); ctx.globalAlpha = 1;
  }
  drawCat(ctx, game, reduced);
  ctx.font = "10px Manrope, sans-serif"; ctx.fillStyle = "#a58bb6"; ctx.textAlign = "right";
  ctx.fillText("ONE MORE GOOD COMMIT.", w - 18, GAME_HEIGHT - 20);
}
