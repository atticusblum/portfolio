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
- Full desk and wall built (Nov 27, not committed). 17 models in `assets/models/` (2.0 MB total):
  | Object | How it was made | Placeholder parts |
  |---|---|---|
  | Ice axe | `make_silhouette.py` from ice-axe-2 photo, 66 cm (from the "66" on the shaft) | Length unconfirmed |
  | Guitar | `make_silhouette.py` from guitar-1-front photo with a deep body section | 104 cm is a typical dreadnought, not measured |
  | Mac | `make_laptop.py`, 14-inch MacBook Pro proportions | Screen is a flat green placeholder (home screen in Phase 5) |
  | Supplements | `make_supplements.py` with real labels cut from supplements-1 photo | Sizes from photo proportions |
  | Toy airplane | `make_airplane.py`, generic toy plane, loops with a "Find me on LinkedIn" banner, click opens LinkedIn | No photo of the real one |
  | Journal | `make_journal.py`, A5 placeholder size, flat grey cover with band | Size, cover photo |
  | Shirt | `make_shirt.py`, blank grey T-shirt | Design file, real color |
  | Posters (8) | `make_poster.py` from your poster files (white margin trimmed on Matterhorn) | Real sizes |
  | JBL Clip | AI + Blender cleanup (above) | |
- Scene: wall (ice axe, shirt, 8 posters in two rows, one taped open slot), desk (JBL, journal lying flat, Mac, supplements), guitar leaning on the floor, plane flying a loop over the left wall. Lying/leaning objects straighten when floated out. Supplements are not clickable. Object list collapsed behind an "Objects (15)" toggle.
- Checked: 1512x744 (Chrome, real clicks: journal, guitar, posters, plane hover, list), 1440x900, 1920x1080. No console errors.
- New scripts: `scripts/blender/make_silhouette.py`, `make_laptop.py`, `make_supplements.py`, `make_airplane.py`; `scripts/supplement-labels.mjs`, `scripts/poster-images.mjs`. Build inputs (cutouts, labels, trimmed posters, built copies) in `assets/_source/` (not in git).

- Phase 5 started (Nov 27, not committed):
  - Toy airplane: Atticus's LinkedIn-blue model (`assets/linkedin_blue_toy_plane.glb`) prepared with `scripts/prepare-plane.mjs` (propeller grouped to spin, rotated to spec), 15% smaller, loops the whole room above the posters and dips on the near side to stay below the menu.
  - Window light: daylight through a window on the left, a spotlight projecting soft window-pane shadows across wall, desk, and floor, plus cool sky fill.
  - Mac (first object behavior): the laptop screen shows a live home-screen texture. Floating it out shows "Open the Mac", which grows a full-screen home screen out of the laptop: menu bar with clock, Photoshop (gallery of the 8 poster designs with detail view and arrow keys; shirt and KC Athletics marked "Coming soon") and Professional Material (Resume.pdf "Coming soon"). Draggable windows, Esc closes top window, then the home screen. Copy in `content/mac.md`.
  - Design work web copies: `src/assets/work/` via `scripts/work-images.mjs`.
  - Next objects need decisions: ice axe walkthrough concept, journal concept and content, guitar videos, Spotify (deferred), resume PDF, shirt design.

- Phase 5, round 2 (Nov 27):
  - Mac: clicking it flies the camera into the laptop screen, then the home screen fades in; leaving reverses the flight. Photoshop icon is the official logo (redrawn as SVG). Photoshop gallery = Atticus's designs from `assets/mac assets/` (Harvey Lieberman Class of 2026, Senior Prom 2026, Winter 2026-27 schedule); the wall posters are no longer in it. Professional Material opens Resume.pdf in a document window.
  - Resume: `public/resume/Atticus-Blum-Resume.pdf`, made from the .docx text (Word's export timed out on a prompt), phone number removed at Atticus's request. Email and LinkedIn stay. An exact Word export can replace it under the same filename.
  - Shirt: Built for State, Football version (confirmed by Atticus), on a long-sleeve white dri-fit shirt, `make_shirt.py --long --sheen`.
  - Ice axe: "Open the map" opens a topo map of Mount Rainier, Mount Adams, and Mount St. Helens at their real positions and elevations. Clicking a peak shows a rotating slideshow (placeholder slides) and placeholder text. Real photos go in `src/assets/climbs/<rainier|adams|st-helens>-1.jpg`, -2, ...; copy in `content/climbs.md`.
  - Journal, guitar, JBL Clip: placeholder text plus a "Coming soon" button.

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
- Climb photos and stories for the three peaks.
- Real measurements (posters, journal, guitar, ice axe), shirt design file, journal cover photo, toy airplane photo: each is a rerun of one script.
- Approve copy in `content/intro.md`, then replace the [Placeholder] lines in `content/landing.md`.
- Phase 5 in progress: Mac and ice axe done; journal, guitar, JBL Clip are placeholders.

## Placeholders still in use
- Title card line and hero tagline (`content/landing.md`).
- Map labels in `content/landing.md` (elevations 5000/6000, scale 1/2 and 1 mi) are decoration, not real data.
- Stub sections: work, personal, contact.
- Object panel text in `content/objects.md`.
- Favicon (grey square).
- `content/site.md` is unused since Phase 2; can be removed with OK.
