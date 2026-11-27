// Object registry: the only place that knows each object's model file and scene slot.
// Pure data, so scripts/make-placeholders.mjs can read it too.
//
// Swapping a model for a better one: drop the new .glb at assets/models/<model>,
// same filename. The scene fits every model to its slot, so no code changes.
// Export spec: glTF binary (.glb), Y up, front facing +Z, under 5 MB, textures 2048px max.

export type Vec3 = [number, number, number];

export type DeskObject = {
  id: string;
  /** File in assets/models/. */
  model: string;
  /** Key into content/objects.md. */
  content: string;
  /**
   * wall: back sits flat on the wall at `position` (center).
   * desk / floor: base rests at `position`.
   * air: centered at `position`; flies if `flight` is set.
   */
  surface: 'wall' | 'desk' | 'floor' | 'air';
  position: Vec3;
  /** How the object sits, Euler radians: X and Z first, then yaw around Y (order YXZ). */
  rotation: Vec3;
  /** Largest dimension after fitting, in scene meters. */
  size: number;
  /** Angle (Euler radians, relative to the camera) when floated out for viewing. */
  present: Vec3;
  /** false for background props (no hover, no click). Default true. */
  clickable?: boolean;
  /** Opens this URL instead of floating out. */
  link?: string;
  /** Ambient flight loop for the toy airplane. */
  flight?: { center: Vec3; radius: [number, number]; seconds: number };
  /** Stand-in shape the placeholder script builds if the model file is missing. */
  standIn: 'ice-axe' | 'speaker' | 'laptop' | 'box';
};

const wall = -0.985;
const desk = 0.76;
const flat: Vec3 = [0, -0.2, 0];

const poster = (id: string, content: string, x: number, y: number, size: number): DeskObject => ({
  id: `poster-${id}`,
  model: `poster-${id}.glb`,
  content,
  surface: 'wall',
  position: [x, y, wall],
  rotation: [0, 0, 0],
  size,
  present: flat,
  standIn: 'box',
});

export const deskObjects: DeskObject[] = [
  // Wall, left to right.
  { id: 'ice-axe', model: 'ice-axe.glb', content: 'iceAxe', surface: 'wall', position: [-1.3, 1.46, wall], rotation: [0, 0, -0.42], size: 0.82, present: [0.1, -0.35, -0.72], standIn: 'ice-axe' },
  { id: 'shirt', model: 'shirt.glb', content: 'shirt', surface: 'wall', position: [-0.66, 1.48, wall], rotation: [0, 0, 0.03], size: 0.5, present: flat, standIn: 'box' },
  poster('mt-baker-topo', 'posterMtBaker', 0.22, 1.74, 0.36),
  poster('patagonia', 'posterPatagonia', 0.62, 1.74, 0.36),
  poster('matterhorn', 'posterMatterhorn', 1.01, 1.74, 0.36),
  poster('pct-nat-geo', 'posterPct', 1.4, 1.74, 0.36),
  poster('glacier-peak-topo', 'posterGlacierPeak', 0.22, 1.32, 0.36),
  poster('just-one-life', 'posterJustOneLife', 0.69, 1.31, 0.38),
  poster('dont-let-school', 'posterDontLetSchool', 1.13, 1.32, 0.31),
  poster('skydive', 'posterSkydive', 1.52, 1.32, 0.36),

  // Desk, left to right.
  { id: 'jbl-clip', model: 'jbl-clip.glb', content: 'jblClip', surface: 'desk', position: [-0.85, desk, -0.3], rotation: [0, 0.35, 0], size: 0.3, present: [0.15, -0.5, 0], standIn: 'speaker' },
  { id: 'journal', model: 'journal.glb', content: 'journal', surface: 'desk', position: [-0.36, desk, -0.12], rotation: [-Math.PI / 2, 0.28, 0], size: 0.3, present: [0.2, -0.45, 0], standIn: 'box' },
  { id: 'mac', model: 'mac.glb', content: 'mac', surface: 'desk', position: [0.3, desk, -0.5], rotation: [0, -0.25, 0], size: 0.62, present: [0.42, -0.45, 0], standIn: 'laptop' },
  { id: 'supplements', model: 'supplements.glb', content: 'supplements', surface: 'desk', position: [1.0, desk, -0.64], rotation: [0, -0.22, 0], size: 0.3, present: flat, clickable: false, standIn: 'box' },

  // Floor: the guitar leans against the wall right of the desk.
  { id: 'guitar', model: 'guitar.glb', content: 'guitar', surface: 'floor', position: [1.74, 0, -0.84], rotation: [-0.14, -0.3, 0.04], size: 0.8, present: [0.05, -0.35, -0.35], standIn: 'box' },

  // Air: the toy airplane loops in front of the wall towing the LinkedIn banner.
  {
    id: 'toy-airplane', model: 'toy-airplane.glb', content: 'airplane', surface: 'air', position: [0, 2.0, -0.3], rotation: [0, 0, 0], size: 0.3, present: flat,
    link: 'https://www.linkedin.com/in/atticusblum/',
    flight: { center: [-0.62, 1.8, -0.32], radius: [0.75, 0.28], seconds: 16 },
    standIn: 'box',
  },
];

/** Intentional open spots for future objects: marked with masking-tape corners. */
export const openSlots: { position: Vec3; size: [number, number] }[] = [
  { position: [-0.17, 1.58, wall + 0.003], size: [0.24, 0.32] },
];
