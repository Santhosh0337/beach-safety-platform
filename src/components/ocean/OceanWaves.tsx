import { useEffect, useRef } from 'react';
import { usePrefersReducedMotion } from '../../hooks/browserHooks';
import { useResolvedTheme } from '../../theme/theme';

export type OceanWavesProps = {
  /** Base drift speed of the idle swell. */
  ambientSpeed?: number;
  /** Radius of cursor influence in CSS pixels. */
  hoverRadius?: number;
  /** Impulse multiplier injected under the cursor. */
  hoverStrength?: number;
  /** Per-step energy retention of ripples. */
  damping?: number;
  /** Ripple spread speed (stable range 0.1 to 0.28). */
  propagation?: number;
  /** Grid density multiplier (1 = default). */
  density?: number;
  /** Horizon position as a fraction of the container height (0 to 1). */
  horizon?: number;
  /** Set false to disable pointer and touch ripples. */
  interactive?: boolean;
};

type Rgb = readonly [number, number, number];

type EngineConfig = {
  ambientSpeed: number;
  hoverRadius: number;
  hoverStrength: number;
  damping: number;
  propagation: number;
  density: number;
  horizon: number;
  interactive: boolean;
  reduced: boolean;
  pointerEase: number;
  fpsCap: number;
  dprCap: number;
};

const DEPTH_EXP = 1.8;
const ALPHA_LEVELS = 6;
const BUCKETS = ALPHA_LEVELS * 2;
const MAX_ALPHA = 0.95;
const LEVEL_STEP = MAX_ALPHA / ALPHA_LEVELS;
const STATIC_TIME = 14;

const clamp = (v: number, lo: number, hi: number) => (v < lo ? lo : v > hi ? hi : v);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

function parseColor(value: string, fallback: Rgb): Rgb {
  const match = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(value.trim());
  if (!match) return fallback;
  let hex = match[1] ?? '';
  if (hex.length === 3) {
    hex = hex
      .split('')
      .map((ch) => ch + ch)
      .join('');
  }
  const n = parseInt(hex, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** Three summed sine components: a slow, deep-ocean swell. `cn` is a column index normalised to 0..139. */
function ambient(cn: number, z: number, t: number): number {
  return (
    0.55 * Math.sin(0.045 * cn + 5.4 * z - t * 0.9) +
    0.3 * Math.sin(0.09 * cn - 5.4 * z + t * 0.6 + 1.7) +
    0.15 * Math.sin(0.16 * cn + 4.2 * z - t * 1.3 + 4.2)
  );
}

function createOceanEngine(canvas: HTMLCanvasElement, host: HTMLElement, cfg: EngineConfig) {
  const context = canvas.getContext('2d');
  if (!context) return null;
  const ctx: CanvasRenderingContext2D = context;

  // Palette comes from CSS custom properties so it stays defined in one place.
  const style = getComputedStyle(canvas);
  const crest = parseColor(style.getPropertyValue('--ocean-crest'), [167, 176, 186]);
  const foam = parseColor(style.getPropertyValue('--ocean-foam'), [255, 255, 255]);
  const abyss = parseColor(style.getPropertyValue('--ocean-abyss'), [2, 5, 10]);
  const mid = parseColor(style.getPropertyValue('--ocean-mid'), [14, 34, 51]);

  const rgba = (c: Rgb, a: number) => `rgba(${c[0]},${c[1]},${c[2]},${a.toFixed(3)})`;
  const abyssCss = `rgb(${abyss[0]},${abyss[1]},${abyss[2]})`;

  // Stroke styles are precomputed: index = alphaLevel * 2 + (isFoam ? 1 : 0).
  const bucketStyle: string[] = [];
  for (let a = 0; a < ALPHA_LEVELS; a++) {
    const alpha = Math.min(MAX_ALPHA, (a + 0.5) * LEVEL_STEP);
    bucketStyle.push(rgba(crest, alpha), rgba(foam, alpha));
  }

  const interactiveOn = cfg.interactive && !cfg.reduced;

  let W = 1;
  let H = 1;
  let dpr = 1;
  let cols = 0;
  let rows = 0;
  let horizonY = 0;
  let bottomY = 0;
  let ampScale = 1;
  let quality = 1;
  let lightEnabled = true;
  let glow: CanvasGradient | string = 'transparent';
  let glowTop = 0;
  let glowHeight = 0;

  let cur = new Float32Array(0);
  let prev = new Float32Array(0);
  let nxt = new Float32Array(0);
  let px = new Float32Array(0);
  let py = new Float32Array(0);
  let hs = new Float32Array(0);
  let segBucket = new Uint8Array(0);
  const bucketCount = new Uint16Array(BUCKETS);

  const pointer = { active: false, tx: 0, ty: 0, sx: 0, sy: 0 };
  const hit = { r: 0, c: 0, z: 0, colPx: 1 };

  const widthFactor = (z: number) => 1.1 + 0.9 * z;
  const rowY = (z: number) => horizonY + (bottomY - horizonY) * Math.pow(z, DEPTH_EXP);

  function resize() {
    const rect = host.getBoundingClientRect();
    W = Math.max(1, Math.round(rect.width));
    H = Math.max(1, Math.round(rect.height));
    dpr = Math.min(window.devicePixelRatio || 1, cfg.dprCap);
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const mobile = W < 640;
    const factor = cfg.density * quality * (mobile ? 0.6 : 1);
    cols = clamp(Math.round((W / 10) * factor), 80, 200);
    rows = clamp(Math.round((H / 16) * factor), 32, 72);
    ampScale = mobile ? 0.75 : 1;

    const n = cols * rows;
    cur = new Float32Array(n);
    prev = new Float32Array(n);
    nxt = new Float32Array(n);
    px = new Float32Array(cols);
    py = new Float32Array(cols);
    hs = new Float32Array(cols);
    segBucket = new Uint8Array(cols);

    horizonY = H * (mobile ? Math.min(cfg.horizon, 0.35) : cfg.horizon);
    bottomY = H + 12;

    // The only gradient in the scene: a faint horizon haze, at most 25% opacity.
    glowTop = Math.max(0, horizonY - H * 0.18);
    glowHeight = H * 0.4;
    const g = ctx.createLinearGradient(0, glowTop, 0, glowTop + glowHeight);
    g.addColorStop(0, rgba(mid, 0));
    g.addColorStop(0.45, rgba(mid, 0.25));
    g.addColorStop(1, rgba(mid, 0));
    glow = g;
  }

  /** Inverts the perspective mapping: screen position to grid coordinates (stored in `hit`). */
  function screenToGrid(sx: number, sy: number): boolean {
    if (sy <= horizonY || sx < -50 || sx > W + 50) return false;
    const z = Math.pow((sy - horizonY) / (bottomY - horizonY), 1 / DEPTH_EXP);
    const wf = W * widthFactor(z);
    hit.z = z;
    hit.r = z * (rows - 1);
    hit.c = ((sx - W / 2) / wf + 0.5) * (cols - 1);
    hit.colPx = wf / (cols - 1);
    return true;
  }

  /** Adds a Gaussian displacement (negative = pressed down) centred on a screen position. */
  function inject(sx: number, sy: number, radiusPx: number, amount: number) {
    if (!screenToGrid(sx, sy)) return;
    const { r: r0, c: c0, z, colPx } = hit;
    const radius = radiusPx * lerp(0.45, 1, z);
    const rowPx = Math.max(
      0.5,
      ((bottomY - horizonY) * DEPTH_EXP * Math.pow(Math.max(z, 0.02), DEPTH_EXP - 1)) / (rows - 1),
    );
    const rc = Math.min(24, Math.max(1.5, radius / colPx));
    const rr = Math.min(24, Math.max(1.5, radius / rowPx));
    const cMin = Math.max(1, Math.floor(c0 - rc));
    const cMax = Math.min(cols - 2, Math.ceil(c0 + rc));
    const rMin = Math.max(1, Math.floor(r0 - rr));
    const rMax = Math.min(rows - 2, Math.ceil(r0 + rr));
    for (let r = rMin; r <= rMax; r++) {
      const dv = (r - r0) / rr;
      for (let c = cMin; c <= cMax; c++) {
        const du = (c - c0) / rc;
        const q = du * du + dv * dv;
        if (q > 1) continue;
        const i = r * cols + c;
        cur[i] = clamp(cur[i] + amount * Math.exp(-q * 3.5), -1.2, 1.2);
      }
    }
  }

  /** One step of the damped 2D wave equation (ripple tank). Borders stay at zero. */
  function step() {
    const k = cfg.propagation;
    const d = cfg.damping;
    for (let r = 1; r < rows - 1; r++) {
      let i = r * cols + 1;
      for (let c = 1; c < cols - 1; c++, i++) {
        const lap = cur[i - 1] + cur[i + 1] + cur[i - cols] + cur[i + cols] - 4 * cur[i];
        const v = (2 * cur[i] - prev[i] + k * lap) * d;
        // Flushing tiny values avoids slow denormal arithmetic and lets ripples settle fully.
        nxt[i] = v > -1e-5 && v < 1e-5 ? 0 : v;
      }
    }
    const tmp = prev;
    prev = cur;
    cur = nxt;
    nxt = tmp;
  }

  function draw(time: number) {
    const c2d = ctx;
    c2d.fillStyle = abyssCss;
    c2d.fillRect(0, 0, W, H);
    c2d.lineJoin = 'round';

    const lightOn = lightEnabled && interactiveOn && pointer.active && pointer.sy > horizonY;
    const R = cfg.hoverRadius;
    const R2 = R * R;
    const centerX = W / 2;
    const cdiv = cols - 1;

    for (let r = 0; r < rows; r++) {
      const z = r / (rows - 1);
      const baseY = rowY(z);
      const amp = lerp(2, 38, Math.pow(z, 1.4)) * ampScale;
      const wf = W * widthFactor(z);
      const x0 = centerX - 0.5 * wf;
      const dx = wf / cdiv;
      const off = r * cols;

      for (let c = 0; c < cols; c++) {
        const h = ambient((c * 139) / cdiv, z, time) + cur[off + c];
        hs[c] = h;
        px[c] = x0 + c * dx;
        py[c] = baseY - h * amp;
      }

      // Occlude farther rows: opaque fill beneath this line, same colour as the canvas.
      c2d.beginPath();
      c2d.moveTo(px[0], py[0]);
      for (let c = 1; c < cols; c++) c2d.lineTo(px[c], py[c]);
      c2d.lineTo(px[cols - 1], H + 20);
      c2d.lineTo(px[0], H + 20);
      c2d.closePath();
      c2d.fillStyle = abyssCss;
      c2d.fill();

      // Classify each segment into an alpha/colour bucket, then stroke bucket by bucket.
      const baseAlpha = lerp(0.05, 0.55, z);
      bucketCount.fill(0);
      for (let c = 0; c < cols - 1; c++) {
        const hAvg = 0.5 * (hs[c] + hs[c + 1]);
        const hn = clamp(hAvg, -1, 1);
        let alpha = baseAlpha * (0.55 + 0.225 * (hn + 1));
        let foamFlag = 0;
        if (hn > 0.35) {
          const m = (hn - 0.35) / 0.65;
          alpha += (MAX_ALPHA - alpha) * m * (0.35 + 0.65 * z);
          if (m > 0.4) foamFlag = 1;
        }
        if (lightOn) {
          const mx = 0.5 * (px[c] + px[c + 1]) - pointer.sx;
          const my = 0.5 * (py[c] + py[c + 1]) - pointer.sy;
          const d2 = mx * mx + my * my;
          if (d2 < R2) alpha += 0.3 * (1 - Math.sqrt(d2) / R);
        }
        const level = Math.min(ALPHA_LEVELS - 1, Math.floor(alpha / LEVEL_STEP));
        const b = level * 2 + foamFlag;
        segBucket[c] = b;
        bucketCount[b]++;
      }

      c2d.lineWidth = lerp(0.6, 1.2, z);
      for (let b = 0; b < BUCKETS; b++) {
        if (bucketCount[b] === 0) continue;
        c2d.strokeStyle = bucketStyle[b];
        c2d.beginPath();
        let pen = -1;
        for (let c = 0; c < cols - 1; c++) {
          if (segBucket[c] !== b) continue;
          if (pen !== c) c2d.moveTo(px[c], py[c]);
          c2d.lineTo(px[c + 1], py[c + 1]);
          pen = c + 1;
        }
        c2d.stroke();
      }
    }

    c2d.fillStyle = glow;
    c2d.fillRect(0, glowTop, W, glowHeight);
  }

  // ---- animation loop -------------------------------------------------------------------------
  let raf = 0;
  let running = false;
  let last = 0;
  let time = STATIC_TIME;
  let simAcc = 0;
  let slowMs = 0;
  let warmup = 0;

  function frame(now: number) {
    raf = requestAnimationFrame(frame);
    const interval = 1000 / cfg.fpsCap;
    const elapsed = now - last;
    if (elapsed < interval - 1) return;
    last = now - (elapsed % interval);
    const dt = Math.min(elapsed / 1000, 0.1);

    time += dt * cfg.ambientSpeed;

    if (interactiveOn && pointer.active) {
      const k = 1 - Math.pow(1 - cfg.pointerEase, dt * 60);
      const prevX = pointer.sx;
      const prevY = pointer.sy;
      pointer.sx += (pointer.tx - pointer.sx) * k;
      pointer.sy += (pointer.ty - pointer.sy) * k;
      const speed = Math.hypot(pointer.sx - prevX, pointer.sy - prevY) / Math.max(dt, 0.001);
      const sn = clamp(speed / 900, 0, 1);
      // A stationary pointer still presses gently; faster movement pushes harder.
      inject(pointer.sx, pointer.sy, cfg.hoverRadius, -(0.03 + 0.3 * sn) * cfg.hoverStrength);
    }

    simAcc += dt * 60;
    let steps = 0;
    while (simAcc >= 1 && steps < 3) {
      step();
      simAcc -= 1;
      steps++;
    }
    if (steps === 3) simAcc = 0;

    draw(time);

    // Adaptive quality: sustained slow frames reduce grid density and drop the cursor light.
    warmup++;
    if (warmup > 30) {
      slowMs = elapsed > 24 ? slowMs + elapsed : Math.max(0, slowMs - elapsed);
      if (slowMs >= 2000) {
        slowMs = 0;
        quality *= 0.75;
        lightEnabled = false;
        resize();
      }
    }
  }

  function start() {
    if (running) return;
    running = true;
    last = performance.now();
    warmup = 0;
    slowMs = 0;
    raf = requestAnimationFrame(frame);
  }

  function stop() {
    if (!running) return;
    running = false;
    cancelAnimationFrame(raf);
  }

  // ---- visibility, resize ---------------------------------------------------------------------
  let inView = true;
  const updateRunning = () => {
    if (cfg.reduced) return;
    if (inView && !document.hidden) start();
    else stop();
  };

  const io = new IntersectionObserver((entries) => {
    const entry = entries[entries.length - 1];
    if (entry) {
      inView = entry.isIntersecting;
      updateRunning();
    }
  });
  io.observe(host);

  const onVisibility = () => updateRunning();
  document.addEventListener('visibilitychange', onVisibility);

  let resizeTimer = 0;
  const ro = new ResizeObserver(() => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      resize();
      if (cfg.reduced) draw(STATIC_TIME);
    }, 150);
  });
  ro.observe(host);

  // ---- pointer and touch (read from the host so the canvas never intercepts events) ------------
  const local = (clientX: number, clientY: number) => {
    const rect = host.getBoundingClientRect();
    return [clientX - rect.left, clientY - rect.top] as const;
  };

  const aim = (x: number, y: number) => {
    if (!pointer.active) {
      pointer.sx = x;
      pointer.sy = y;
    }
    pointer.tx = x;
    pointer.ty = y;
    pointer.active = true;
  };

  const ripple = (x: number, y: number) =>
    inject(x, y, cfg.hoverRadius * 1.3, -0.35 * 2.5 * cfg.hoverStrength);

  const onPointerMove = (e: PointerEvent) => {
    if (e.pointerType === 'touch') return;
    const [x, y] = local(e.clientX, e.clientY);
    aim(x, y);
  };
  const onPointerLeave = (e: PointerEvent) => {
    if (e.pointerType === 'touch') return;
    pointer.active = false;
  };
  const onPointerDown = (e: PointerEvent) => {
    if (e.pointerType === 'touch') return;
    const [x, y] = local(e.clientX, e.clientY);
    ripple(x, y);
  };
  const onTouchStart = (e: TouchEvent) => {
    const t = e.touches[0];
    if (!t) return;
    const [x, y] = local(t.clientX, t.clientY);
    aim(x, y);
    ripple(x, y);
  };
  const onTouchMove = (e: TouchEvent) => {
    const t = e.touches[0];
    if (!t) return;
    const [x, y] = local(t.clientX, t.clientY);
    aim(x, y);
  };
  const onTouchEnd = () => {
    pointer.active = false;
  };

  if (interactiveOn) {
    host.addEventListener('pointermove', onPointerMove);
    host.addEventListener('pointerleave', onPointerLeave);
    host.addEventListener('pointerdown', onPointerDown);
    // Passive listeners and no preventDefault: native page scrolling is never blocked.
    host.addEventListener('touchstart', onTouchStart, { passive: true });
    host.addEventListener('touchmove', onTouchMove, { passive: true });
    host.addEventListener('touchend', onTouchEnd, { passive: true });
    host.addEventListener('touchcancel', onTouchEnd, { passive: true });
  }

  // ---- initial frame (synchronous, so there is no blank flash) ---------------------------------
  resize();
  draw(cfg.reduced ? STATIC_TIME : time);
  if (!cfg.reduced) updateRunning();

  return {
    destroy() {
      stop();
      window.clearTimeout(resizeTimer);
      io.disconnect();
      ro.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      host.removeEventListener('pointermove', onPointerMove);
      host.removeEventListener('pointerleave', onPointerLeave);
      host.removeEventListener('pointerdown', onPointerDown);
      host.removeEventListener('touchstart', onTouchStart);
      host.removeEventListener('touchmove', onTouchMove);
      host.removeEventListener('touchend', onTouchEnd);
      host.removeEventListener('touchcancel', onTouchEnd);
    },
  };
}

/**
 * Decorative ocean background. Place it once, as a child of a positioned container
 * (for example the hero). Pointer and touch input is read from that container.
 */
export function OceanWaves({
  ambientSpeed = 0.35,
  hoverRadius = 160,
  hoverStrength = 1,
  damping = 0.985,
  propagation = 0.22,
  density = 1,
  horizon = 0.42,
  interactive = true,
}: OceanWavesProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reduced = usePrefersReducedMotion();
  // The palette is read from CSS variables when the engine starts, so restart it on a theme change.
  const theme = useResolvedTheme();

  useEffect(() => {
    const canvas = canvasRef.current;
    const host = canvas?.parentElement;
    if (!canvas || !host) return;
    const engine = createOceanEngine(canvas, host, {
      ambientSpeed: reduced ? 0 : ambientSpeed,
      hoverRadius,
      hoverStrength,
      damping,
      propagation,
      density,
      horizon,
      interactive,
      reduced,
      pointerEase: 0.12,
      fpsCap: 60,
      dprCap: 2,
    });
    return () => engine?.destroy();
  }, [ambientSpeed, hoverRadius, hoverStrength, damping, propagation, density, horizon, interactive, reduced, theme]);

  return <canvas ref={canvasRef} className="bs-ocean" aria-hidden="true" role="presentation" />;
}
