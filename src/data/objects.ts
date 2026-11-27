// Object registry: the only place that knows each object's model file and scene slot.
// Pure data, so scripts/make-placeholders.mjs can read it too.
//
// Swapping a stand-in for a real model: drop the new .glb at assets/models/<model>,
// same filename. The scene fits every model to its slot, so no code changes.
// Export spec: glTF binary (.glb), Y up, front facing +Z, under 5 MB, textures 2048px max.

export type Vec3 = [number, number, number];

export type DeskObject = {
  id: string;
  /** File in assets/models/. */
  model: string;
  /** Key into content/objects.md. */
  content: string;
  surface: 'wall' | 'desk';
  /** Where the object sits. Desk items rest their base here; wall items center here. */
  position: Vec3;
  /** Euler rotation in radians, applied after fitting. */
  rotation: Vec3;
  /** Largest dimension after fitting, in scene meters. */
  size: number;
  /** Angle (Euler radians, relative to the camera) when floated out for viewing. */
  present: Vec3;
  /** Stand-in shape the placeholder script builds if the model file is missing. */
  standIn: 'ice-axe' | 'speaker' | 'laptop';
};

export const deskObjects: DeskObject[] = [
  {
    id: 'ice-axe',
    model: 'ice-axe.glb',
    content: 'iceAxe',
    surface: 'wall',
    position: [-0.98, 1.5, -0.985],
    rotation: [0, 0, -0.42],
    size: 0.9,
    present: [0.1, -0.35, -0.72],
    standIn: 'ice-axe',
  },
  {
    id: 'jbl-clip',
    model: 'jbl-clip.glb',
    content: 'jblClip',
    surface: 'desk',
    position: [-0.58, 0.76, -0.18],
    rotation: [0, 0.45, 0],
    size: 0.46,
    present: [0.15, -0.5, 0],
    standIn: 'speaker',
  },
  {
    id: 'mac',
    model: 'mac.glb',
    content: 'mac',
    surface: 'desk',
    position: [0.42, 0.76, -0.42],
    rotation: [0, -0.32, 0],
    size: 0.86,
    present: [0.42, -0.45, 0],
    standIn: 'laptop',
  },
];
