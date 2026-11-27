// Hand-drawn topo contour lines as brush strokes.
// Each stroke is a filled outline with varying width (not a uniform SVG stroke),
// revealed by a mask that draws along its centerline.

type Pt = [number, number];

export function rng(seed: number) {
  let s = seed % 2147483647 || 1;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

/** Smooth closed-ish loop: a contour ring with a small pen-lift gap. */
export function ring(
  cx: number, cy: number, rx: number, ry: number,
  shape: number[], rand: () => number,
  start = rand() * Math.PI * 2, sweep = Math.PI * 2 - 0.18 - rand() * 0.2, n = 180,
): Pt[] {
  const pts: Pt[] = [];
  for (let i = 0; i <= n; i++) {
    const a = start + (sweep * i) / n;
    let r = 1;
    for (let k = 0; k < shape.length; k += 2) r += shape[k] * Math.sin((k / 2 + 2) * a + shape[k + 1]);
    pts.push([cx + Math.cos(a) * rx * r, cy + Math.sin(a) * ry * r]);
  }
  return pts;
}

/** Brush outline around a centerline: tapered ends, wobbling width. */
export function brush(pts: Pt[], width: number, rand: () => number): string {
  const n = pts.length;
  const seeds = [rand() * 6.28, rand() * 6.28];
  const left: Pt[] = [];
  const right: Pt[] = [];
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    const p = pts[i];
    const a = pts[Math.max(0, i - 1)];
    const b = pts[Math.min(n - 1, i + 1)];
    let dx = b[0] - a[0], dy = b[1] - a[1];
    const len = Math.hypot(dx, dy) || 1;
    dx /= len; dy /= len;
    const taper = Math.pow(Math.sin(Math.PI * Math.min(1, Math.max(0, t))), 0.45);
    const wob = 0.62 + 0.28 * Math.sin(t * 9 + seeds[0]) + 0.1 * Math.sin(t * 31 + seeds[1]);
    const w = (width / 2) * taper * wob;
    left.push([p[0] - dy * w, p[1] + dx * w]);
    right.push([p[0] + dy * w, p[1] - dx * w]);
  }
  const all = left.concat(right.reverse());
  return 'M' + all.map(([x, y]) => `${x.toFixed(2)} ${y.toFixed(2)}`).join(' L') + ' Z';
}

export function centerline(pts: Pt[]): string {
  return 'M' + pts.map(([x, y]) => `${x.toFixed(2)} ${y.toFixed(2)}`).join(' L');
}

/** Polyline through hand-placed points with a little jitter. */
export function sketch(points: Pt[], rand: () => number, jitter = 0.08, steps = 6): Pt[] {
  const out: Pt[] = [];
  for (let i = 0; i < points.length - 1; i++) {
    const [x0, y0] = points[i], [x1, y1] = points[i + 1];
    for (let s = 0; s < steps; s++) {
      const t = s / steps;
      out.push([x0 + (x1 - x0) * t + (rand() - 0.5) * jitter, y0 + (y1 - y0) * t + (rand() - 0.5) * jitter]);
    }
  }
  out.push(points[points.length - 1]);
  return out;
}

let maskId = 0;

/** Renders brush strokes into an <svg> group. Returns nothing; DOM only. */
export function paint(group: SVGGElement, strokes: { pts: Pt[]; width: number; delay: number }[], rand: () => number) {
  const ns = 'http://www.w3.org/2000/svg';
  const svg = group.ownerSVGElement!;
  let defs = svg.querySelector('defs');
  if (!defs) defs = svg.insertBefore(document.createElementNS(ns, 'defs'), svg.firstChild);
  for (const s of strokes) {
    const id = `cm${++maskId}`;
    const mask = document.createElementNS(ns, 'mask');
    mask.id = id;
    mask.setAttribute('maskUnits', 'userSpaceOnUse');
    const reveal = document.createElementNS(ns, 'path');
    reveal.setAttribute('d', centerline(s.pts));
    reveal.setAttribute('pathLength', '1');
    reveal.setAttribute('class', 'reveal');
    reveal.setAttribute('stroke-width', String(s.width * 3 + 0.6));
    reveal.style.animationDelay = `${s.delay}s`;
    mask.appendChild(reveal);
    defs.appendChild(mask);
    const fill = document.createElementNS(ns, 'path');
    fill.setAttribute('d', brush(s.pts, s.width, rand));
    fill.setAttribute('mask', `url(#${id})`);
    group.appendChild(fill);
  }
}
