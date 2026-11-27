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

## Decisions (Nov 26, 2026)
- Repo `atticusblum/portfolio` (the `atticusblum.github.io` repo is an older site, left alone).
- 3D models: AI-generated from reference photos.
- Scroll: camera moves between fixed stations.
- Posters are bought prints: decoration only (plan updated).
- Spotify: later.
- Landing: title card, then the hero greets by name in place (plan updated).
- Public repo excludes `assets/`, `references/`, and draft `content/*.md`. Tracked copy: `content/site.md`, `content/landing.md`. One web copy of the photo cutout: `src/assets/atticus-cutout.webp`.

## Next
- Atticus reviews the Phase 3 prototype and approves the push.
- Real models for ice axe, JBL Clip, Mac (AI image-to-3D from assets photos).
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
