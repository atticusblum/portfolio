// Prepares assets/linkedin_blue_toy_plane.glb for the scene:
//  - groups the propeller hub and blades under one node named "propeller",
//    pivoting on the hub center, so the site can spin it
//  - rotates the model to the export spec: it is authored Z up with the nose on +X;
//    the spec is Y up with the front (nose) on +Z
// Usage: node scripts/prepare-plane.mjs <in.glb> <out.glb>
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';

const [src, out] = process.argv.slice(2);
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
const doc = await io.read(src);
const scene = doc.getRoot().listScenes()[0];
const all = doc.getRoot().listNodes();

// Hub center from the hub mesh bounds.
const hubNode = all.find((n) => n.getName() === 'Propeller hub');
const pos = hubNode.getMesh().listPrimitives()[0].getAttribute('POSITION');
const mn = pos.getMin([]), mx = pos.getMax([]);
const hub = mn.map((v, i) => (v + mx[i]) / 2);

const prop = doc.createNode('propeller').setTranslation(hub);
for (const n of all.filter((n) => /^Propeller (hub|blade)/.test(n.getName()))) {
  for (const p of [scene, ...all]) if (p.listChildren?.().includes(n)) p.removeChild(n);
  n.setTranslation(hub.map((v) => -v));
  prop.addChild(n);
}
const world = all.find((n) => n.getName() === 'world');
world.addChild(prop);

// Rotation: X by -90 (Z up -> Y up), then Y by -90 (nose +X -> +Z).
const s = Math.SQRT1_2;
const qx = [-s, 0, 0, s];
const qy = [0, -s, 0, s];
const mul = ([ax, ay, az, aw], [bx, by, bz, bw]) => [
  aw * bx + ax * bw + ay * bz - az * by,
  aw * by - ax * bz + ay * bw + az * bx,
  aw * bz + ax * by - ay * bx + az * bw,
  aw * bw - ax * bx - ay * by - az * bz,
];
const wrapper = doc.createNode('oriented').setRotation(mul(qy, qx));
for (const child of scene.listChildren()) {
  scene.removeChild(child);
  wrapper.addChild(child);
}
scene.addChild(wrapper);
await io.write(out, doc);
console.log(`wrote ${out}; propeller pivot at ${hub.map((v) => v.toFixed(2)).join(', ')}`);
