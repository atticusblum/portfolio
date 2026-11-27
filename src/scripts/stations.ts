// Scroll stations. The page moves between fixed stations (landing, desk, ...).
// Phase 2 uses native scroll-snap between sections. Phase 3 plugs in a camera
// driver with setStationDriver(); every caller keeps using goTo() unchanged.

export type StationChange = { from: string | null; to: string };
type Driver = (id: string) => void;

let current: string | null = null;
let driver: Driver | null = null;

const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

export function currentStation() {
  return current;
}

/** Phase 3: hand station moves to the 3D camera instead of page scroll. */
export function setStationDriver(fn: Driver | null) {
  driver = fn;
}

export function goTo(id: string) {
  if (driver) return driver(id);
  document.getElementById(id)?.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth' });
}

/** Watches every [data-station] section and fires `station:change` on window. */
export function initStations() {
  const els = [...document.querySelectorAll<HTMLElement>('[data-station]')];
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        const to = (e.target as HTMLElement).dataset.station!;
        if (to === current) continue;
        const detail: StationChange = { from: current, to };
        current = to;
        document.documentElement.dataset.station = to;
        window.dispatchEvent(new CustomEvent<StationChange>('station:change', { detail }));
      }
    },
    { threshold: 0.55 },
  );
  els.forEach((el) => io.observe(el));
}
