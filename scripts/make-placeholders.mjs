// Creates a neutral grey stand-in .glb for every object in src/data/objects.ts
// whose model file is missing. Never overwrites an existing file.
// Usage: npm run placeholders
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { deskObjects } from '../src/data/objects.ts';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'assets', 'models');
mkdirSync(outDir, { recursive: true });

const place = (g, { x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0 } = {}) => {
  g.rotateX(rx); g.rotateY(ry); g.rotateZ(rz);
  g.translate(x, y, z);
  return g.toNonIndexed();
};

// Rough shapes in true proportion. Y up, front facing +Z.
const builders = {
  'ice-axe': () => [
    place(new THREE.CylinderGeometry(0.016, 0.014, 0.66, 20), { y: 0.37 }), // shaft
    place(new THREE.ConeGeometry(0.014, 0.05, 20), { y: 0.015, rx: Math.PI }), // spike
    place(new THREE.BoxGeometry(0.05, 0.04, 0.026), { y: 0.71 }), // head
    place(new THREE.BoxGeometry(0.17, 0.022, 0.012), { x: -0.1, y: 0.7, rz: -0.18 }), // pick
    place(new THREE.BoxGeometry(0.09, 0.012, 0.04), { x: 0.07, y: 0.715 }), // adze
  ],
  speaker: () => [
    place(new THREE.CylinderGeometry(0.05, 0.05, 0.045, 48), { y: 0.05, rx: Math.PI / 2 }), // puck, faces +Z
    place(new THREE.TorusGeometry(0.018, 0.004, 12, 32), { y: 0.11 }), // carabiner loop
  ],
  laptop: () => [
    place(new THREE.BoxGeometry(0.31, 0.012, 0.22), { y: 0.006 }), // base
    place(new THREE.BoxGeometry(0.31, 0.2, 0.006), { y: 0.1, rx: -0.26, z: -0.08 }), // screen, tilted back
  ],
};

function glb(name, geometry) {
  const pos = geometry.getAttribute('position');
  const nor = geometry.getAttribute('normal');
  const p = new Float32Array(pos.array);
  const n = new Float32Array(nor.array);
  geometry.computeBoundingBox();
  const { min, max } = geometry.boundingBox;
  const bin = Buffer.concat([Buffer.from(p.buffer), Buffer.from(n.buffer)]);
  const json = {
    asset: { version: '2.0', generator: 'portfolio make-placeholders' },
    scene: 0,
    scenes: [{ nodes: [0] }],
    nodes: [{ mesh: 0, name }],
    meshes: [{ name, primitives: [{ attributes: { POSITION: 0, NORMAL: 1 }, material: 0 }] }],
    materials: [{ name: 'placeholder', pbrMetallicRoughness: { baseColorFactor: [0.6, 0.61, 0.58, 1], metallicFactor: 0, roughnessFactor: 0.85 } }],
    buffers: [{ byteLength: bin.length }],
    bufferViews: [
      { buffer: 0, byteOffset: 0, byteLength: p.byteLength, target: 34962 },
      { buffer: 0, byteOffset: p.byteLength, byteLength: n.byteLength, target: 34962 },
    ],
    accessors: [
      { bufferView: 0, componentType: 5126, count: pos.count, type: 'VEC3', min: [min.x, min.y, min.z], max: [max.x, max.y, max.z] },
      { bufferView: 1, componentType: 5126, count: nor.count, type: 'VEC3' },
    ],
  };
  const pad = (buf, fill) => (buf.length % 4 ? Buffer.concat([buf, Buffer.alloc(4 - (buf.length % 4), fill)]) : buf);
  const jsonChunk = pad(Buffer.from(JSON.stringify(json)), 0x20);
  const binChunk = pad(bin, 0);
  const header = Buffer.alloc(12);
  header.writeUInt32LE(0x46546c67, 0); // "glTF"
  header.writeUInt32LE(2, 4);
  header.writeUInt32LE(12 + 8 + jsonChunk.length + 8 + binChunk.length, 8);
  const chunk = (data, type) => {
    const h = Buffer.alloc(8);
    h.writeUInt32LE(data.length, 0);
    h.writeUInt32LE(type, 4);
    return Buffer.concat([h, data]);
  };
  return Buffer.concat([header, chunk(jsonChunk, 0x4e4f534a), chunk(binChunk, 0x004e4942)]);
}

for (const obj of deskObjects) {
  const file = join(outDir, obj.model);
  if (existsSync(file)) {
    console.log(`keep    assets/models/${obj.model}`);
    continue;
  }
  const geometry = mergeGeometries(builders[obj.standIn]());
  writeFileSync(file, glb(obj.id, geometry));
  console.log(`created assets/models/${obj.model} (stand-in)`);
}
