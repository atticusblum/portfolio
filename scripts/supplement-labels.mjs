// Cuts the four label areas out of assets/supplements-1.jpg and widens each so the
// real label covers the front half of the bottle (sides mirror the label's edges).
// Usage: node scripts/supplement-labels.mjs <out_dir>
import sharp from 'sharp';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

const out = process.argv[2];
mkdirSync(out, { recursive: true });

// Label areas in the 1500 x 2000 photo, left to right: D3+K2, fish oil, magnesium, creatine.
const boxes = [
  { left: 158, top: 885, width: 250, height: 320 },
  { left: 405, top: 695, width: 312, height: 505 },
  { left: 720, top: 740, width: 222, height: 425 },
  { left: 950, top: 480, width: 430, height: 695 },
];

for (const [i, box] of boxes.entries()) {
  const side = Math.round(box.width / 2);
  await sharp('assets/supplements-1.jpg')
    .extract(box)
    .extend({ left: side, right: side, extendWith: 'mirror' })
    .resize({ height: 1024, fit: 'inside' })
    .png()
    .toFile(join(out, `label-${i}.png`));
  console.log(`label-${i}.png`);
}
