# Progress

## Done
- Phase 1: Astro scaffold, placeholder page, GitHub Actions deploy to https://atticusblum.github.io/portfolio/ (confirmed live).
- Phase 2 (committed, not pushed, awaiting review):
  - Title card: click or Enter to enter, contour lines draw in, slides away.
  - Hero landing: "Hello {{ first name }}" prompt that greets in place. Name kept in memory only. Skip, Escape, or empty Enter shows "Hello There." Click the name to change it.
  - Photo cutout with topo contour rings (Atticus as the summit), peak-and-flag and compass-star doodles, "that's you" arrow.
  - Brush-textured lines: variable-width filled strokes plus a dry-brush filter, revealed by a drawing mask.
  - Top menu: Work, Personal, Contact (anchors to stub sections).
  - Scroll stations wired in `src/scripts/stations.ts`: `goTo()`, `station:change` events, and `setStationDriver()` for the Phase 3 camera.
  - Reduced motion: no title card, no draw-in, no smooth scroll.
  - Palette Pine, Big Shoulders Display + DM Mono, self-hosted.
  - Checked at 1440x900, 1920x1080, and 1512x744.
- Phase 2 additions (committed, not pushed):
  - Topo map behind the photo: index contours with elevation labels set into line gaps, steep right face, a knoll, a stream, faint map grid, dashed switchback route up to a "Mt. Atticus" summit flag, north arrow, scale bar. Map fades out under the text column.
  - Mouse parallax on the hero: map, photo, route, and words move at different depths. Off with reduced motion.
  - Cursor trail: dashed trail line that follows the mouse and fades in 0.7s. Paper color on the title card, Pine elsewhere. Off with reduced motion and on touch.

## Decisions (Nov 26, 2026)
- Repo `atticusblum/portfolio` (the `atticusblum.github.io` repo is an older site, left alone).
- 3D models: AI-generated from reference photos.
- Scroll: camera moves between fixed stations.
- Posters are bought prints: decoration only (plan updated).
- Spotify: later.
- Landing: title card, then the hero greets by name in place (plan updated).
- Public repo excludes `assets/`, `references/`, and draft `content/*.md`. Tracked copy: `content/site.md`, `content/landing.md`. One web copy of the photo cutout: `src/assets/atticus-cutout.webp`.

## Next
- Atticus reviews Phase 2 and approves the push.
- Confirm the photo can go public (built in on the assumption it can).
- Approve copy in `content/intro.md`, then replace the [Placeholder] lines in `content/landing.md`.
- Phase 3: desk prototype with 2 to 3 objects.

## Placeholders still in use
- Title card line and hero tagline (`content/landing.md`).
- Map labels in `content/landing.md` (elevations 5000/6000, scale 1/2 and 1 mi) are decoration, not real data.
- Stub sections: desk, work, personal, contact.
- Favicon (grey square).
- `content/site.md` is unused since Phase 2; can be removed with OK.
