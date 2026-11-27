# Atticus Blum Portfolio: Living Plan

This is a living document. New objects and ideas get added as they come up. Items marked **Open** are not decided yet. Nothing here is final until you confirm it.

## 1. Vision

A desktop website that opens on a short title card, then a hero landing scene that greets you by name, and rewards exploration. One scroll takes you into a 3D desk and wall, where professional work and personal life sit side by side. The desk is the main experience. A simple top menu gets you to any section directly.

Reference qualities:
- **Scroll scene** (dsgnbyhl): scrolling moves the camera through a 3D world.
- **Interactive 3D tools** (Odama): objects respond when clicked.
- **Personal** (Minh Tran): handwritten and personal details, used sparingly.
- **Cohesive and artful** (Ruthi): one visual language throughout, with a memorable intro.

## 2. Structure

| Layer | What it is | Status |
|---|---|---|
| Landing scene | The hero. Asks the visitor's first name and greets them in place ("Hello, [name]"). Photo of Atticus, topo contour lines, top menu to every section, scroll cue to the desk. | Stated |
| Desk and wall scene | One scroll from the landing scene. Main 3D experience. | Stated |
| Intro | Short click-to-enter title card before the landing scene. | Stated |
| Contact | Form or email link. | Deferred (decide later) |
| Domain | GitHub Pages default address. | Stated |
| Ambient motion | Constant movement even without interaction, such as a toy airplane towing a LinkedIn banner. | Stated |
| Background audio | Music on prompt. | Open (later) |

## 3. Objects

Each object has: what it is, whether it is professional or personal, how it behaves, and what it reveals. Briefs will expand over time.

**Interaction model (stated):** No object stands out above the others. Every object is 3D in the desk scene, so it looks dimensional as you view it in place. On click, the object floats out of the scene so you can see its full 3D form and rotate it. Then it opens to its content (Spotify, videos, project files, LinkedIn, and so on). Clicking away returns it to its spot on the desk or wall.

### Wall

| Object | Type | Behavior | Reveals | Status |
|---|---|---|---|---|
| Ice axe | Personal (mountaineering) | Clickable. Animates into view, then walks through the mountaineering experience in a creative way. | Mountaineering experience | Stated. Details open. |
| Posters (bought prints on your wall) | Decoration only | Decoration. Never presented as your design work. | Personal taste only | Stated. Photos in assets/. |
| Shirt design | Professional | 3D rendering. Location open (desk or inside the Mac). | Design work | Stated. |

### Desk

| Object | Type | Behavior | Reveals | Status |
|---|---|---|---|---|
| JBL Clip speaker | Personal (music) | Clickable. Opens to a Spotify connection (profile: https://open.spotify.com/user/3147df24dihefncddweicksb74v4). | Current listening, favorite songs | Stated. Interactable. |
| Physical journal | Personal | Clickable. Opens with an animation. Scroll through pages across years. | Personal history over time | Stated. Concept open. |
| Mac | Professional hub | Clickable. Boots up to a home screen full of obvious click targets. Photoshop icon opens your graphic design work. "Professional Material" folder holds the resume and other documents. | Design work, resume | Stated. Expands later. |
| Guitar | Personal (music) | Clickable. Opens to videos of you playing, or plays itself. | Music, practice | Stated. Method open. |
| Toy airplane | Ambient, playful | Flies around the scene with a LinkedIn banner. Clickable, opens https://www.linkedin.com/in/atticusblum/ | Connection point | Stated. |
| Supplements and vitamins | Background prop | Not clickable. Adds realism. | Realism only | Stated. |

### Not yet placed

Items you have mentioned will be added here until you decide where they go.

**Scene rule (stated):** Use every object listed above. Leave open slots on the wall and desk for items you add later. Open slots should look intentional, not empty.

## 4. Assets Needed

Photos go into `assets/` in the project folder. Take them in even light, straight on, with a plain background if possible. Reference items are fine to photograph as they are.

**Objects (one photo each, from several angles if you can):**
- Ice axe (full length, head close-up, and the handle)
- JBL Clip speaker (front, top, and charging port)
- Physical journal (closed, open to any page, and the spine)
- Guitar (full body and headstock)
- Mac or laptop (open, front, and at a slight angle)
- Toy airplane (if you have it, otherwise note the model)
- Supplements and vitamins (as they sit on the desk, in a group)

**Wall:**
- Each poster on the wall (straight-on, good light)
- Shirt design (flat, or on a hanger if that is how you keep it)
- Any other items on the wall

**Work to feature:**
- Final versions of each poster and design (highest resolution you have)
- Shirt design file (PNG or PDF, transparent background if possible)
- Kennedy Catholic Athletics graphic (highest resolution)
- Resume (PDF)

**Desk setup reference:**
- One photo of your full desk and wall as they are now
- One photo of the desk from the seat you sit in

## 5. Build Phases

Each phase ends with something you can open and check. We'll move to the next phase only after you confirm the current one.

1. **Foundation:** site scaffold, deploy to GitHub Pages with a public URL, placeholder landing page. Confirm: the URL loads.
2. **Landing scene:** the title card, the hero landing with the name greeting, and the top menu. Confirm: it looks right and the menu works.
3. **Desk prototype:** a small desk section with 2 to 3 objects, each both 3D in place and floating out on click. This proves the core interaction before we scale to the full desk. Confirm: objects look dimensional in place, and the float-out feels right.
4. **Desk and wall scene:** the scroll scene with the rest of the objects in place, all at equal visual weight. Start with placeholder shapes if models aren't ready.
5. **Object interactions:** each object's full behavior, added one at a time.
6. **Content:** briefs and case studies for each object, filled in from your input.
7. **Polish:** performance on a normal laptop, reduced-motion support, and a last visual pass.
8. **Launch:** public link, final check, and your LinkedIn post.

## 6. Open Questions

- Desk prototype: all objects are in the scene. Which ones get full interaction first? (Suggestion: one wall item, one desk item, and the Mac.)
- Do you want placeholder objects in the first version, or only finished ones?
- Contact method: decide later.

## 7. Change Log

- Initial version: vision, structure, object list from your first answers, asset checklist, build phases.
- Asset inventory added. assets/ holds web-ready JPGs for: ice axe (2), supplements (1), guitar (5 angles), JBL Clip (3), and posters (Mt Baker topo, Glacier Peak topo, Matterhorn, Patagonia, Just One Life, Don't Let School, PCT NAT Geo, Skydive). Poster sources are in Documents/Personal/Posters.
- Content drafts in content/ (bio, intro, work, personal) are mock-ups from memory. Atticus will edit them.
- Intro set to a Ruthi-style screen. Mac set to a home screen with clickable icons (Photoshop, Professional Material folder). LinkedIn and Spotify links added. Domain set to GitHub Pages default. Contact deferred. All listed objects in the scene, with open slots for future items.
- Equal visual weight for all objects. No single hero object. Every object is 3D in place and floats out on click to show its full form. Build phase 3 changed from one object to a desk prototype of 2 to 3 objects.
- Posters on the wall are bought prints, not Atticus's designs. Changed to decoration only (Nov 26, 2026).
- Landing changed (Nov 26, 2026): the hero is the landing scene. A short click-to-enter title card comes first, then the hero asks the visitor's name and greets them in place. Replaces the separate calm landing. Palette Pine (#2F5D46 on #EEEDE5), Big Shoulders Display and DM Mono.
