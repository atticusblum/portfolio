// Map frame and simplified Washington geography for the climbs map.
// Pure data (no Vite features) so scripts/make-relief.mjs can import it too.
// Shapes are hand-simplified from real coordinates: right for a stylized map, not for navigation.

export type LonLat = [number, number];

export const FRAME = { W: -125.0, E: -116.6, S: 45.45, N: 49.15 };
const KX = Math.cos((47.3 * Math.PI) / 180);
export const VW = 2400;
export const VH = Math.round((VW * (FRAME.N - FRAME.S)) / ((FRAME.E - FRAME.W) * KX));

export const px = (lon: number) => ((lon - FRAME.W) / (FRAME.E - FRAME.W)) * VW;
export const py = (lat: number) => ((FRAME.N - lat) / (FRAME.N - FRAME.S)) * VH;
/** Pixels per kilometer (north-south). */
export const KM = VH / (FRAME.N - FRAME.S) / 111.32;

/** Pacific Ocean and the Salish Sea: Washington coast, Strait of Juan de Fuca, the water west of
 * Whidbey Island up to Boundary Bay, and the south and east shore of Vancouver Island. */
export const OCEAN: LonLat[] = [
  [-123.97, 45.3], [-123.96, 45.7], [-123.94, 46.0], [-123.98, 46.18], [-124.07, 46.27], [-124.06, 46.35], [-124.05, 46.65],
  [-124.03, 46.7], [-124.12, 46.92], [-124.19, 47.11], [-124.22, 47.24], [-124.29, 47.35], [-124.38, 47.61], [-124.64, 47.91],
  [-124.73, 48.15], [-124.73, 48.39], [-124.62, 48.37], [-124.3, 48.26], [-124.1, 48.2], [-123.43, 48.12], [-123.11, 48.18],
  [-123.04, 48.08], [-122.76, 48.12], [-122.75, 48.25], [-122.7, 48.4], [-122.62, 48.5], [-122.55, 48.72], [-122.65, 48.8],
  [-122.77, 48.92], [-122.76, 49.0], [-122.95, 49.03], [-123.08, 49.02], [-123.15, 49.1], [-123.2, 49.15], [-123.85, 49.15],
  [-123.7, 48.95], [-123.55, 48.72], [-123.4, 48.7], [-123.3, 48.45], [-123.55, 48.33], [-123.72, 48.37], [-124.05, 48.42],
  [-124.42, 48.55], [-124.8, 48.65], [-125.0, 48.7], [-125.6, 48.75], [-125.6, 44.9], [-123.98, 44.9],
];

/** Inland water: Puget Sound, Hood Canal, water east of Whidbey, Columbia estuary, Willapa Bay, Grays Harbor. */
export const SOUNDS: LonLat[][] = [
  // Puget Sound from Admiralty Inlet to Olympia.
  [[-122.76, 48.12], [-122.68, 48.0], [-122.6, 47.92], [-122.38, 47.81], [-122.4, 47.62], [-122.42, 47.58], [-122.33, 47.4],
   [-122.44, 47.27], [-122.55, 47.27], [-122.9, 47.06], [-122.82, 47.15], [-122.68, 47.3], [-122.55, 47.45], [-122.52, 47.62],
   [-122.55, 47.78], [-122.63, 47.92], [-122.72, 48.03]],
  // Hood Canal.
  [[-122.63, 47.92], [-122.72, 47.78], [-122.85, 47.62], [-123.05, 47.4], [-123.15, 47.36], [-122.93, 47.4], [-123.02, 47.43],
   [-122.82, 47.66], [-122.69, 47.82], [-122.66, 47.92]],
  // East of Whidbey: Possession Sound, Saratoga Passage, Skagit Bay.
  [[-122.4, 47.95], [-122.22, 47.99], [-122.25, 48.05], [-122.38, 48.18], [-122.48, 48.27], [-122.52, 48.38], [-122.6, 48.35],
   [-122.55, 48.3], [-122.5, 48.15], [-122.45, 48.0], [-122.38, 47.92]],
  // Columbia estuary.
  [[-124.07, 46.28], [-123.92, 46.28], [-123.75, 46.27], [-123.45, 46.22], [-123.3, 46.16], [-123.3, 46.13], [-123.45, 46.17],
   [-123.75, 46.2], [-123.95, 46.18], [-124.02, 46.23]],
  // Willapa Bay.
  [[-124.03, 46.7], [-123.92, 46.72], [-123.85, 46.6], [-123.95, 46.38], [-124.02, 46.4], [-124.0, 46.6]],
  // Grays Harbor.
  [[-124.12, 46.92], [-123.85, 46.98], [-123.82, 46.95], [-124.0, 46.88], [-124.1, 46.88]],
];

/** Washington state outline (west side follows the coast and the water boundary). */
export const STATE: LonLat[] = [
  // Coast (same points as OCEAN) from the Columbia mouth to Cape Flattery.
  [-124.07, 46.27], [-124.06, 46.35], [-124.05, 46.65], [-124.03, 46.7], [-124.12, 46.92], [-124.19, 47.11], [-124.22, 47.24],
  [-124.29, 47.35], [-124.38, 47.61], [-124.64, 47.91], [-124.73, 48.15], [-124.73, 48.39],
  // Water boundary with Canada through the Strait and Haro Strait, then the 49th parallel.
  [-124.0, 48.3], [-123.25, 48.24], [-123.12, 48.43], [-123.25, 48.7], [-123.0, 48.83], [-122.76, 49.0], [-117.03, 49.0],
  // Idaho line, Snake River, 46th parallel, then the Columbia back to the coast.
  [-117.03, 46.42], [-116.92, 46.0], [-118.98, 46.0], [-119.25, 45.93], [-119.6, 45.92], [-120.5, 45.7], [-121.2, 45.64],
  [-121.9, 45.66], [-122.3, 45.55], [-122.75, 45.62], [-122.78, 45.85], [-122.95, 46.11], [-123.4, 46.2], [-123.95, 46.23],
];

export const RIVERS: { name: string; pts: LonLat[] }[] = [
  {
    name: 'Columbia',
    pts: [[-118.3, 49.15], [-118.15, 48.6], [-118.2, 48.1], [-118.98, 47.95], [-119.65, 47.95], [-120.2, 47.75], [-120.3, 47.4],
      [-119.95, 46.9], [-119.5, 46.7], [-119.3, 46.3], [-119.0, 46.1], [-119.25, 45.93], [-119.6, 45.92], [-120.5, 45.7],
      [-121.2, 45.64], [-121.9, 45.66], [-122.3, 45.55], [-122.75, 45.62], [-122.78, 45.85], [-122.95, 46.11], [-123.4, 46.2], [-124.05, 46.25]],
  },
  { name: 'Snake', pts: [[-116.92, 45.45], [-116.92, 46.0], [-117.04, 46.42], [-117.6, 46.6], [-118.3, 46.55], [-119.0, 46.2]] },
  { name: 'Yakima', pts: [[-121.1, 47.35], [-120.55, 46.98], [-120.5, 46.6], [-120.2, 46.35], [-119.6, 46.25], [-119.3, 46.28]] },
];

export const CITIES: { name: string; lon: number; lat: number; capital?: boolean }[] = [
  { name: 'Seattle', lon: -122.33, lat: 47.61 },
  { name: 'Tacoma', lon: -122.44, lat: 47.25 },
  { name: 'Olympia', lon: -122.9, lat: 47.04, capital: true },
  { name: 'Spokane', lon: -117.43, lat: 47.66 },
  { name: 'Yakima', lon: -120.51, lat: 46.6 },
  { name: 'Bellingham', lon: -122.48, lat: 48.75 },
  { name: 'Portland', lon: -122.68, lat: 45.52 },
];

/** Summits used for the relief cones. Elevations in meters (public figures). */
export const SUMMITS: { lon: number; lat: number; m: number; sigma: number }[] = [
  { lon: -121.7604, lat: 46.8529, m: 4392, sigma: 0.11 }, // Rainier
  { lon: -121.4909, lat: 46.2024, m: 3743, sigma: 0.1 }, // Adams
  { lon: -122.1956, lat: 46.1914, m: 2549, sigma: 0.075 }, // St. Helens
  { lon: -121.1139, lat: 48.1125, m: 3213, sigma: 0.065 }, // Glacier Peak
  { lon: -121.8145, lat: 48.7768, m: 3286, sigma: 0.075 }, // Baker
  { lon: -121.6959, lat: 45.3735, m: 3426, sigma: 0.09 }, // Hood (just south of the frame)
  { lon: -123.7107, lat: 47.8013, m: 2428, sigma: 0.08 }, // Olympus
];

/** Elevation color stops (meters) shared by the relief image and the legend. */
export const RAMP: [number, string][] = [
  [0, '#a4cb8b'], [150, '#8fbf78'], [400, '#b5d18c'], [700, '#d4da9e'], [1000, '#e5d6a1'],
  [1400, '#d9bd86'], [1800, '#c69d6a'], [2200, '#a87d55'], [2800, '#8b6a4e'], [3300, '#b8ada3'], [4400, '#f4f1ec'],
];

/** Smooth SVG path through lon/lat points (quadratic curves through midpoints), in map pixels. */
export function smoothPath(pts: LonLat[], closed = true): string {
  const P = pts.map(([lo, la]) => [px(lo), py(la)]);
  const mid = (a: number[], b: number[]) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const f = (v: number[]) => `${v[0].toFixed(1)} ${v[1].toFixed(1)}`;
  if (!closed) {
    let d = `M${f(P[0])}`;
    for (let i = 1; i < P.length - 1; i++) d += ` Q${f(P[i])} ${f(mid(P[i], P[i + 1]))}`;
    return d + ` L${f(P[P.length - 1])}`;
  }
  const n = P.length;
  let d = `M${f(mid(P[n - 1], P[0]))}`;
  for (let i = 0; i < n; i++) d += ` Q${f(P[i])} ${f(mid(P[i], P[(i + 1) % n]))}`;
  return d + ' Z';
}
