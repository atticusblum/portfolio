// Rotates a .glb in place so it meets the export spec (Y up, front facing +Z).
// Usage: node scripts/orient-model.mjs <file.glb> <rx> <ry> <rz>   (degrees, applied X then Y then Z)
// Example: node scripts/orient-model.mjs assets/models/jbl-clip.glb 0 0 -90
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';

const [file, rx = '0', ry = '0', rz = '0'] = process.argv.slice(2);
if (!file) {
  console.error('Usage: node scripts/orient-model.mjs <file.glb> <rx> <ry> <rz>');
  process.exit(1);
}

const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
const doc = await io.read(file);
const d2r = Math.PI / 180;

// Quaternion for intrinsic X, then Y, then Z rotation.
const q = (ax, ay, az) => {
  const [cx, sx] = [Math.cos(ax / 2), Math.sin(ax / 2)];
  const [cy, sy] = [Math.cos(ay / 2), Math.sin(ay / 2)];
  const [cz, sz] = [Math.cos(az / 2), Math.sin(az / 2)];
  return [
    sx * cy * cz + cx * sy * sz,
    cx * sy * cz - sx * cy * sz,
    cx * cy * sz + sx * sy * cz,
    cx * cy * cz - sx * sy * sz,
  ];
};
// Wrap every scene's roots in one parent carrying the rotation.
const rot = q(+rx * d2r, +ry * d2r, +rz * d2r);
for (const scene of doc.getRoot().listScenes()) {
  const wrapper = doc.createNode('oriented').setRotation(rot);
  for (const child of scene.listChildren()) {
    scene.removeChild(child);
    wrapper.addChild(child);
  }
  scene.addChild(wrapper);
}
await io.write(file, doc);
console.log(`rotated ${file} by (${rx}, ${ry}, ${rz}) degrees`);
