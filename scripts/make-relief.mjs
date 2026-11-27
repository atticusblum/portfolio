// Renders the shaded-relief background for the climbs map: hypsometric tints
// (green lowlands -> tan -> brown -> white summits) with hillshading lit from the
// northwest, water in blue, and land outside Washington faded.
// The terrain is a stylized model (noise-shaped ranges plus real summit cones), not survey data.
// Usage: node scripts/make-relief.mjs <out.webp>
import sharp from 'sharp';
import { FRAME, VW, VH, px, py, OCEAN, SOUNDS, STATE, RIVERS, SUMMITS, RAMP, smoothPath } from '../src/data/washington.ts';

const out = process.argv[2];
const W = VW, H = VH;
const KX = Math.cos((47.3 * Math.PI) / 180);

// ---------- masks from SVG ----------
const poly = (pts) => smoothPath(pts);
const straight = (pts) => 'M' + pts.map(([lo, la]) => `${px(lo).toFixed(1)} ${py(la).toFixed(1)}`).join(' L') + ' Z';
const mask = async (paths) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><rect width="100%" height="100%" fill="#000"/>${paths.map((d) => `<path d="${d}" fill="#fff"/>`).join('')}</svg>`;
  const { data } = await sharp(Buffer.from(svg)).greyscale().raw().toBuffer({ resolveWithObject: true });
  return data;
};
const water = await mask([poly(OCEAN), ...SOUNDS.map(poly)]);
const state = await mask([straight(STATE)]);

// ---------- noise: 2D gradient (Perlin) noise, fBm, ridged, domain warp ----------
const perm = new Uint8Array(512);
{
  const p = Array.from({ length: 256 }, (_, i) => i);
  let seed = 1337;
  for (let i = 255; i > 0; i--) { seed = (seed * 16807) % 2147483647; const j = seed % (i + 1); [p[i], p[j]] = [p[j], p[i]]; }
  for (let i = 0; i < 512; i++) perm[i] = p[i & 255];
}
const grad = (h, x, y) => { const a = (h & 7) * (Math.PI / 4); return Math.cos(a) * x + Math.sin(a) * y; };
const fade = (t) => t * t * t * (t * (t * 6 - 15) + 10);
const perlin = (x, y) => {
  const xi = Math.floor(x) & 255, yi = Math.floor(y) & 255;
  const xf = x - Math.floor(x), yf = y - Math.floor(y);
  const u = fade(xf), v = fade(yf);
  const aa = perm[perm[xi] + yi], ab = perm[perm[xi] + yi + 1], ba = perm[perm[xi + 1] + yi], bb = perm[perm[xi + 1] + yi + 1];
  const x1 = grad(aa, xf, yf) + (grad(ba, xf - 1, yf) - grad(aa, xf, yf)) * u;
  const x2 = grad(ab, xf, yf - 1) + (grad(bb, xf - 1, yf - 1) - grad(ab, xf, yf - 1)) * u;
  return (x1 + (x2 - x1) * v) * 0.7 + 0.5; // ~0..1
};
const fbm = (x, y, oct = 5) => {
  let s = 0, amp = 0.5, f = 1, norm = 0;
  for (let i = 0; i < oct; i++) { s += perlin(x * f + i * 17.1, y * f - i * 9.3) * amp; norm += amp; amp *= 0.5; f *= 2.03; }
  return s / norm;
};
const ridged = (x, y, oct = 6) => {
  // Domain warp first, so ridges wander like real drainage.
  const wx = x + (fbm(x * 0.7 + 3.1, y * 0.7) - 0.5) * 1.6, wy = y + (fbm(x * 0.7, y * 0.7 + 7.7) - 0.5) * 1.6;
  let s = 0, amp = 0.5, f = 1, norm = 0, prev = 1;
  for (let i = 0; i < oct; i++) {
    let n = 1 - Math.abs(perlin(wx * f + i * 5.3, wy * f + i * 2.9) * 2 - 1);
    n = n * n * prev;
    prev = Math.min(1, n * 1.6);
    s += n * amp; norm += amp; amp *= 0.5; f *= 2.07;
  }
  return Math.min(1, (s / norm) * 1.5);
};
const ss = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const bump = (lon, lat, clon, clat, r) => { const d = Math.hypot((lon - clon) * KX, lat - clat) / r; return Math.exp(-d * d * 2); };

// Distance (degrees, x scaled) from a point to a polyline.
const segDist = (x, y, pts) => {
  let best = Infinity;
  for (let i = 0; i < pts.length - 1; i++) {
    const [ax, ay] = [pts[i][0] * KX, pts[i][1]], [bx, by] = [pts[i + 1][0] * KX, pts[i + 1][1]];
    const dx = bx - ax, dy = by - ay;
    const t = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy)));
    best = Math.min(best, Math.hypot(x - (ax + dx * t), y - (ay + dy * t)));
  }
  return best;
};
const columbia = RIVERS[0].pts;

// ---------- elevation (meters) ----------
const elev = new Float32Array(W * H);
for (let j = 0; j < H; j++) {
  const lat = FRAME.N - (j / H) * (FRAME.N - FRAME.S);
  for (let i = 0; i < W; i++) {
    const lon = FRAME.W + (i / W) * (FRAME.E - FRAME.W);
    const x = lon * KX, y = lat;
    const n = fbm(x * 2.4, y * 2.4);
    const r = ridged(x * 4.2 + 10, y * 4.2 + 3);

    const crest = -121.15 - (48.8 - lat) * 0.15;
    const westBase = 40 + n * 170;
    const eastBase = 260 + Math.max(0, lon + 121) * 95 + (n - 0.5) * 260 + bump(lon, lat, -117.4, 46.85, 0.6) * 180;
    let e = westBase + (eastBase - westBase) * ss(crest + 0.15, crest + 1.3, lon);

    // Cascades: higher and more rugged to the north.
    const band = Math.exp(-((((lon - crest) * KX) / 0.38) ** 2));
    e += band * (700 + 1300 * r) * (1 + 0.4 * ss(47, 48.8, lat));
    // Olympics, Willapa Hills, Blue Mountains, Okanogan Highlands, Kettle/Selkirk, BC Coast Mountains.
    e += bump(lon, lat, -123.62, 47.78, 0.42) * (500 + 1500 * r);
    e += bump(lon, lat, -123.55, 46.55, 0.38) * (250 + 350 * n);
    e += bump(lon, lat, -117.75, 46.12, 0.42) * (500 + 900 * r);
    e += bump(lon, lat, -119.3, 48.62, 0.75) * (350 + 700 * r);
    e += bump(lon, lat, -117.85, 48.62, 0.6) * (450 + 1000 * r);
    e += bump(lon, lat, -122.2, 49.35, 0.55) * (600 + 1300 * r);
    // Columbia River valley cut.
    const dc = segDist(x, y, columbia);
    e *= 0.72 + 0.28 * ss(0.008, 0.05, dc);
    // Volcano cones on top.
    for (const s of SUMMITS) {
      const d = Math.hypot((lon - s.lon) * KX, lat - s.lat) / s.sigma;
      if (d > 4) continue;
      // Steep cone with gullies running down the flanks.
      const ang = Math.atan2(lat - s.lat, (lon - s.lon) * KX);
      // Seamless around the cone: sample noise on a circle instead of by raw angle.
      const gully = 0.9 + 0.1 * ridged(Math.cos(ang) * 2.5 + d * 0.8 + s.m * 0.001, Math.sin(ang) * 2.5 + d * 0.8);
      const cone = s.m * Math.exp(-Math.pow(d * d + 0.012, 0.575)) * gully;
      e = Math.max(e, cone + e * 0.15);
    }
    // St. Helens: crater open to the north.
    {
      const d = Math.hypot((lon + 122.1956) * KX, lat - 46.205) / 0.022;
      e -= 650 * Math.exp(-d * d);
    }
    elev[j * W + i] = e;
  }
}

// ---------- color ----------
const rgb = (hex) => [1, 3, 5].map((k) => parseInt(hex.slice(k, k + 2), 16));
const ramp = RAMP.map(([m, c]) => [m, rgb(c)]);
const tint = (e) => {
  if (e <= ramp[0][0]) return ramp[0][1];
  for (let k = 1; k < ramp.length; k++) {
    if (e <= ramp[k][0]) {
      const [m0, c0] = ramp[k - 1], [m1, c1] = ramp[k];
      const t = (e - m0) / (m1 - m0);
      return c0.map((v, i) => v + (c1[i] - v) * t);
    }
  }
  return ramp[ramp.length - 1][1];
};

const mPerPx = ((FRAME.N - FRAME.S) * 111320) / H;
const az = (315 * Math.PI) / 180, alt = (42 * Math.PI) / 180, zf = 2.2;
const sea = rgb('#a9d0ec'), seaDeep = rgb('#93c1e6');
const img = Buffer.alloc(W * H * 3);
for (let j = 0; j < H; j++) {
  for (let i = 0; i < W; i++) {
    const k = j * W + i;
    let c;
    if (water[k] > 127) {
      const t = Math.min(1, i / (W * 0.25));
      c = seaDeep.map((v, q) => v + (sea[q] - v) * t);
    } else {
      const e = elev[k];
      const l = elev[j * W + Math.max(0, i - 1)], rr = elev[j * W + Math.min(W - 1, i + 1)];
      const u = elev[Math.max(0, j - 1) * W + i], d = elev[Math.min(H - 1, j + 1) * W + i];
      const dzdx = ((rr - l) / (2 * mPerPx)) * zf, dzdy = ((d - u) / (2 * mPerPx)) * zf;
      const slope = Math.atan(Math.hypot(dzdx, dzdy));
      const aspect = Math.atan2(dzdy, -dzdx);
      let shade = Math.cos(Math.PI / 2 - alt) * Math.cos(slope) + Math.sin(Math.PI / 2 - alt) * Math.sin(slope) * Math.cos(az - aspect);
      shade = Math.max(0, shade);
      const base = tint(e);
      c = base.map((v) => Math.min(255, v * (0.5 + 0.62 * shade)));
      // Fade land outside Washington.
      if (state[k] < 128) c = c.map((v) => v + (247 - v) * 0.5);
    }
    img[k * 3] = c[0]; img[k * 3 + 1] = c[1]; img[k * 3 + 2] = c[2];
  }
}
const info = await sharp(img, { raw: { width: W, height: H, channels: 3 } }).webp({ quality: 80 }).toFile(out);
console.log(`wrote ${out} ${W}x${H} ${Math.round(info.size / 1024)} KB`);
