# Progress

## Done
- Phase 1: Astro scaffold, placeholder page, GitHub Actions deploy to https://atticusblum.github.io/portfolio/ (confirmed live).
- Phase 2 (live since ac0b4aa):
  - Title card: click or Enter to enter, contour lines draw in, slides away.
  - Hero landing: "Hello {{ first name }}" prompt that greets in place. Name kept in memory only. Skip, Escape, or empty Enter shows "Hello There." Click the name to change it.
  - Photo cutout with topo contour rings (Atticus as the summit), peak-and-flag and compass-star doodles, "that's you" arrow.
  - Brush-textured lines: variable-width filled strokes plus a dry-brush filter, revealed by a drawing mask.
  - Top menu: Work, Personal, Contact (anchors to stub sections).
  - Scroll stations wired in `src/scripts/stations.ts`: `goTo()`, `station:change` events, and `setStationDriver()` for the Phase 3 camera.
  - Reduced motion: no title card, no draw-in, no smooth scroll.
  - Palette Pine, Big Shoulders Display + DM Mono, self-hosted.
  - Checked at 1440x900, 1920x1080, and 1512x744.
- Phase 2 additions (live):
  - Topo map behind the photo: index contours with elevation labels set into line gaps, steep right face, a knoll, a stream, faint map grid, dashed switchback route up to a "Mt. Atticus" summit flag, north arrow, scale bar. Map fades out under the text column.
  - Mouse parallax on the hero: map, photo, route, and words move at different depths. Off with reduced motion.
  - Cursor trail: dashed trail line that follows the mouse and fades in 0.7s. Paper color on the title card, Pine elsewhere. Off with reduced motion and on touch.

- Phase 3 desk prototype (committed, not pushed):
  - Three.js 0.187 + GSAP 3, loaded only when the desk comes near (about 180 KB compressed).
  - Room: wall, floor, desk with legs, window-style key light and soft shadows.
  - Objects: ice axe (wall), JBL Clip and Mac (desk), all neutral grey stand-ins from `npm run placeholders`.
  - Every model is fit to its slot from `src/data/objects.ts`, so real .glb files drop in with no code change.
  - Hover lifts the object and shows its name. Click floats it out in front of a dimmed room with a side panel. Drag turns it; it sways gently when idle. Click away, Esc, or "Back to the desk" returns it.
  - Keyboard: an object list at the bottom left opens each one.
  - Camera settles in on arrival at the desk; slight mouse sway at rest. Both off with reduced motion.
  - Checked at 1512x744 (Chrome, real clicks), 1440x900, and 1920x1080.

## 3D models (Nov 27, 2026)
- JBL Clip: done locally, not committed. `assets/models/jbl-clip.glb` (644 KB).
  - Source: Tripo multiview generation (9 Higgsfield credits; 1 left).
  - Cleaned with `scripts/blender/clean_jbl.py` (Blender 5.3.0, installed Nov 27): detached hook piece removed (908 faces), watertight (0 open edges), 36.4 degree tilt corrected, depth rescaled to the JBL spec (97 x 46 mm body), three raised buttons and a recessed logo plate in the body's own red. 1024 px WebP textures, quantized mesh, `orient-model.mjs` run (no rotation needed).
  - Still visible from the AI: a dark dent and a small bump on the grille, a notch at the top rim, a stray triangle on the back edge.
  - Before/after renders: `review/jbl-before-after.png` (not in git). Earlier versions and the raw download: `assets/_source/`.
- Object plan (nothing generated yet):
  | Object | Method | What Atticus provides |
  |---|---|---|
  | Guitar | Blender build traced from the front photo, photo on the face | Guitar make/model or body length |
  | Journal | Blender, `make_journal.py` | 3 measurements, a straight-on cover photo |
  | Ice axe | Blender build (thin shaft and leash fail in scans and AI) | Confirm 66 cm length |
  | Shirt | Blender, `make_shirt.py` | Design file (PNG), shirt color |
  | Posters | Blender, `make_poster.py`, one per poster | Real height of each poster |
  | Supplements | Free-tier generator (Meshy.ai free account) from supplements-1.jpg | Sign up, upload, download the .glb |
- Blender scripts in `scripts/blender/`: clean_jbl and render_views have run; make_journal, make_poster, make_shirt are syntax-checked only.

## Decisions (Nov 26, 2026)
- Repo `atticusblum/portfolio` (the `atticusblum.github.io` repo is an older site, left alone).
- 3D models: AI-generated from reference photos.
- Scroll: camera moves between fixed stations.
- Posters are Atticus's own designs in the style of other posters: design work, fine to show (corrected Nov 27).
- Spotify: later.
- Landing: title card, then the hero greets by name in place (plan updated).
- Public repo excludes `assets/`, `references/`, and draft `content/*.md`. Tracked copy: `content/site.md`, `content/landing.md`. One web copy of the photo cutout: `src/assets/atticus-cutout.webp`.

## Next
- Atticus reviews the Phase 3 prototype and approves the push.
- Atticus reviews the cleaned JBL Clip and approves a commit.
- Run make_poster.py for the posters once their real heights are known.
- Approve copy in `content/intro.md`, then replace the [Placeholder] lines in `content/landing.md`.
- Phase 4: full desk and wall scene with every object at equal weight.

## Placeholders still in use
- Title card line and hero tagline (`content/landing.md`).
- Map labels in `content/landing.md` (elevations 5000/6000, scale 1/2 and 1 mi) are decoration, not real data.
- Stub sections: work, personal, contact.
- 3D models: `assets/models/ice-axe.glb`, `jbl-clip.glb`, `mac.glb` are grey stand-ins.
- Object panel text in `content/objects.md`.
- Favicon (grey square).
- `content/site.md` is unused since Phase 2; can be removed with OK.
