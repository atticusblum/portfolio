import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://atticusblum.github.io',
  base: '/portfolio',
  output: 'static',
  // 3D models in assets/models/ are bundled as hashed files (see src/data/objects.ts).
  vite: { assetsInclude: ['**/*.glb'] },
});
