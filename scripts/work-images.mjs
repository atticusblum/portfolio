// Makes web copies of the design work shown in the Mac's Photoshop window:
// a 1600px view and a 600px thumbnail per file, WebP.
// Usage: node scripts/work-images.mjs <src_dir> <out_dir> <name> [<name> ...]   (src_dir/<name>.jpg)
import sharp from 'sharp';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

const [src, out, ...names] = process.argv.slice(2);
mkdirSync(join(out, 'thumbs'), { recursive: true });
for (const name of names) {
  const input = join(src, `${name}.jpg`);
  const full = await sharp(input).resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true }).webp({ quality: 80 }).toFile(join(out, `${name}.webp`));
  const thumb = await sharp(input).resize({ width: 600, height: 600, fit: 'inside', withoutEnlargement: true }).webp({ quality: 74 }).toFile(join(out, 'thumbs', `${name}.webp`));
  console.log(`${name}: ${Math.round(full.size / 1024)} KB, thumb ${Math.round(thumb.size / 1024)} KB`);
}
