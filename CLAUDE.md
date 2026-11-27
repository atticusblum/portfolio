# Atticus Blum Portfolio

## Purpose
Personal desktop website. Two jobs: a professional portfolio (graphic design, freelance, NVL, websites) and a "get to know me" space (music, mountaineering, sports, personal life shared at Atticus's comfort level). Audience: recruiters, Gonzaga and NVL contacts, potential clients, friends.

Read `portfolio-plan.md` first. It is the source of truth for scope, objects, and build phases. Ask before changing anything in it.

## Scope
- Desktop only. No mobile layouts, breakpoints, or touch-specific behavior.
- Public site on GitHub Pages: repo `atticusblum/portfolio`, live at https://atticusblum.github.io/portfolio/. Deploys from `main` via GitHub Actions.
- `atticusblum.github.io` is a separate, older site. Never touch that repo.

## Stack
- Astro, static output. `base` is `/portfolio`, so internal links and asset URLs must go through `import.meta.env.BASE_URL`.
- Commands: `npm install`, `npm run dev`, `npm run build`.
- 3D: Three.js, with GSAP for camera and object motion and Lenis for smooth scroll (proposed; confirm in Phase 3).
- Scroll model: the camera moves between fixed stations (landing, desk, wall) on scroll, dsgnbyhl-style. Not scrubbed.

## Content
- All copy lives in `content/*.md`. Do not hardcode text in components.
- Images live in `assets/images/`, 3D models in `assets/models/`. Optimize before use (max 2000px wide, WebP or JPG).
- Never invent facts, metrics, client names, dates, or credentials. If something is missing, ask.
- Nothing from a draft content file goes on the public URL until Atticus approves it.
- The repo is public. Draft content, original photos, and poster files stay out of git (see `.gitignore`) until Atticus approves them.
- Posters on the wall are bought prints, not Atticus's design work. They are decoration only and never presented as his work.
- Spotify connection is deferred to a later phase.

## 3D models
- Final models are AI-generated from Atticus's reference photos (image-to-3D), then cleaned up as needed. Claude picks the tool per object.

## Placeholders
- Final assets aren't ready. Every object uses a generic stand-in saved at the exact path the final asset will have, e.g. `assets/models/ice-axe.glb`, `assets/images/poster-matterhorn.webp`.
- One registry (`src/data/objects.ts`) maps each object id to its asset path, scene slot, and content file. Code reads paths only from the registry.
- Swapping a placeholder for the real file must need zero code changes. To make that true:
  - Code fits every model to its slot at load: scales to the slot's bounding box, centers it, and sets it on the surface. Size, units, and origin of the real file don't matter.
  - Export spec for real models: glTF binary (.glb), Y up, front facing +Z, under 5 MB, textures 2048px max.
  - Images are shown with `object-fit`, so aspect ratio differences don't break layout.
- Stand-ins are neutral grey shapes in roughly the object's proportions. Same material treatment for all, so none stands out.
- A script (`npm run placeholders`) creates missing stand-ins. It never overwrites an existing file.
- `PROGRESS.md` lists which assets are still placeholders.

## Design
- Quality bar is set by the four reference sites in `references/notes.md`. Match their qualities, not their content.
- One visual language across the site: one accent color, one display font, one body font, defined as CSS variables in `src/styles/tokens.css`.
- Palette: Pine accent #2F5D46 on #EEEDE5, ink #1D221E. Display: Big Shoulders Display. Body: DM Mono. Self-hosted via Fontsource.
- Intro is a short click-to-enter title card. The hero is the landing scene: it asks the visitor's first name (kept in memory only, never stored) and greets them in place, with a top menu to every section.
- Ruthi is a reference for the name mechanic only. Composition, line style, and word placement must be our own.
- Desk and wall scene: every object is 3D in place, and floats out to show full form on click. No object has more visual weight than another.
- Respect `prefers-reduced-motion`.

## Working rules
- Make the smallest change that completes the task. Don't refactor unrelated files.
- Ask before deleting, moving, or overwriting any content or asset.
- Build and fix errors after each change before moving on.
- Keep a short running list of what is done and what is next in `PROGRESS.md`.
- Confirm each build phase with Atticus before starting the next one.

## Owner preferences
- Direct, no filler. Say when a design choice is weak.
- Copy is natural and first-person. Avoid corporate phrasing.
- Don't use em dashes in copy.
