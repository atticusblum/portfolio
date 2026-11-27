// Prepares poster files for scripts/blender/make_poster.py:
// trims plain white margins (e.g. a poster saved on a white canvas) and caps size at 2000 px.
// Usage: node scripts/poster-images.mjs <out_dir> <name> [<name> ...]   (names from assets/<name>.jpg)
import sharp from 'sharp';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

const [out, ...names] = process.argv.slice(2);
mkdirSync(out, { recursive: true });
for (const name of names) {
  const info = await sharp(`assets/${name}.jpg`)
    .trim({ background: '#ffffff', threshold: 18 })
    .resize({ width: 2000, height: 2000, fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 88 })
    .toFile(join(out, `${name}.jpg`));
  console.log(`${name}.jpg ${info.width}x${info.height}`);
}
